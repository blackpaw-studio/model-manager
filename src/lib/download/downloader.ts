import https from "https";
import http from "http";
import fs from "fs";
import type { DownloadProgress } from "./types";

const STALL_TIMEOUT_MS = 30000; // 30 seconds without data = stalled
const MAX_RETRIES = 3;

export interface DownloadOptions {
  headers?: Record<string, string>;
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
  resumeFrom?: number; // bytes already downloaded
}

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    url: string,
    public body: string = ""
  ) {
    super(`HTTP ${statusCode} for ${url}`);
  }
}

export class StallError extends Error {
  constructor(public downloaded: number) {
    super(`Download stalled after ${downloaded} bytes`);
  }
}

async function downloadFileOnce(
  url: string,
  dest: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { headers = {}, onProgress, signal, resumeFrom = 0 } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Download cancelled"));
      return;
    }

    const client = url.startsWith("https") ? https : http;
    const requestHeaders: Record<string, string> = {
      "User-Agent": "ModelManager/1.0",
      ...headers,
    };

    // Add Range header for resume
    if (resumeFrom > 0) {
      requestHeaders["Range"] = `bytes=${resumeFrom}-`;
    }

    const req = client.get(url, { headers: requestHeaders }, (res) => {
      // Handle redirects
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        // Strip auth headers when redirecting to a different host
        const originHost = new URL(url).hostname;
        const redirectUrl = new URL(res.headers.location, url).href;
        const redirectHost = new URL(redirectUrl).hostname;
        const redirectHeaders =
          originHost === redirectHost ? headers : {};

        downloadFileOnce(redirectUrl, dest, {
          ...options,
          headers: redirectHeaders,
        }).then(resolve, reject);
        return;
      }

      // Handle errors
      if (res.statusCode && res.statusCode >= 400) {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString().slice(0, 2000);
          reject(new HttpError(res.statusCode!, url, body));
        });
        return;
      }

      // Check if server supports range requests
      const isPartialContent = res.statusCode === 206;
      const contentRange = res.headers["content-range"];

      // Calculate total size
      let totalSize = 0;
      if (contentRange) {
        // Format: "bytes 0-999/1000" or "bytes 0-999/*"
        const match = contentRange.match(/\/(\d+|\*)/);
        if (match && match[1] !== "*") {
          totalSize = parseInt(match[1], 10);
        }
      } else {
        totalSize =
          parseInt(res.headers["content-length"] ?? "0", 10) + resumeFrom;
      }

      // Open file in append mode if resuming, otherwise create new
      const fileFlags = resumeFrom > 0 && isPartialContent ? "a" : "w";
      const file = fs.createWriteStream(dest, { flags: fileFlags });

      let downloaded = resumeFrom;
      const startTime = Date.now();
      let lastDataTime = Date.now();

      const updateProgress = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const bytesThisSession = downloaded - resumeFrom;
        const speed = elapsed > 0 ? bytesThisSession / elapsed : 0;
        const percent = totalSize > 0 ? (downloaded / totalSize) * 100 : 0;
        const remaining = totalSize - downloaded;
        const eta = speed > 0 && remaining > 0 ? remaining / speed : 0;

        onProgress?.({
          downloaded,
          total: totalSize,
          speed,
          percent,
          eta,
        });
      };

      // Update progress periodically
      const progressInterval = setInterval(updateProgress, 250);

      // Stall detection timer
      let stallTimer: NodeJS.Timeout | null = null;

      const resetStallTimer = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
          cleanup();
          res.destroy();
          reject(new StallError(downloaded));
        }, STALL_TIMEOUT_MS);
      };

      const cleanup = () => {
        clearInterval(progressInterval);
        if (stallTimer) clearTimeout(stallTimer);
        signal?.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        cleanup();
        file.close();
        res.destroy();
        // Don't delete partial file on cancel - allows resume
        reject(new Error("Download cancelled"));
      };

      signal?.addEventListener("abort", onAbort, { once: true });
      resetStallTimer();

      res.on("data", (chunk: Buffer) => {
        downloaded += chunk.length;
        lastDataTime = Date.now();
        resetStallTimer();
      });

      res.pipe(file);

      file.on("finish", () => {
        cleanup();
        updateProgress();
        file.close();
        resolve();
      });

      file.on("error", (err) => {
        cleanup();
        // Don't delete on error - allows resume
        reject(err);
      });

      res.on("error", (err) => {
        cleanup();
        reject(err);
      });
    });

    req.on("error", reject);

    const onAbort = () => {
      req.destroy();
      reject(new Error("Download cancelled"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function downloadFile(
  url: string,
  dest: string,
  options: DownloadOptions = {}
): Promise<void> {
  let lastError: Error | null = null;
  let resumeFrom = options.resumeFrom ?? 0;

  // Check if partial file exists and get its size
  if (resumeFrom === 0 && fs.existsSync(dest)) {
    const stats = fs.statSync(dest);
    resumeFrom = stats.size;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await downloadFileOnce(url, dest, { ...options, resumeFrom });
      return; // Success!
    } catch (err) {
      lastError = err as Error;

      // Don't retry on cancel or HTTP errors
      if (
        err instanceof Error &&
        err.message === "Download cancelled"
      ) {
        throw err;
      }
      if (err instanceof HttpError) {
        throw err;
      }

      // On stall, update resumeFrom for next attempt
      if (err instanceof StallError) {
        resumeFrom = err.downloaded;
        console.log(
          `Download stalled at ${resumeFrom} bytes, retrying (${attempt + 1}/${MAX_RETRIES})...`
        );
        continue;
      }

      // For other errors, try to resume from current file size
      if (fs.existsSync(dest)) {
        const stats = fs.statSync(dest);
        resumeFrom = stats.size;
      }

      if (attempt < MAX_RETRIES) {
        console.log(
          `Download error: ${err}, retrying (${attempt + 1}/${MAX_RETRIES})...`
        );
        // Wait a bit before retry
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  throw lastError ?? new Error("Download failed after retries");
}

export async function downloadToBuffer(
  url: string,
  headers: Record<string, string> = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const requestHeaders = { "User-Agent": "ModelManager/1.0", ...headers };

    client
      .get(url, { headers: requestHeaders }, (res) => {
        // Handle redirects
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const originHost = new URL(url).hostname;
          const redirectUrl = new URL(res.headers.location, url).href;
          const redirectHost = new URL(redirectUrl).hostname;
          const redirectHeaders =
            originHost === redirectHost ? headers : {};

          downloadToBuffer(redirectUrl, redirectHeaders).then(
            resolve,
            reject
          );
          return;
        }

        if (res.statusCode && res.statusCode >= 400) {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const body = Buffer.concat(chunks).toString().slice(0, 2000);
            reject(new HttpError(res.statusCode!, url, body));
          });
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${s}s`;
}
