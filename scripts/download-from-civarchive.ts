#!/usr/bin/env npx tsx

/**
 * Downloads a model from civarchive.com and saves it in the ComfyUI
 * directory format with CivitAI-compatible metadata.
 *
 * Usage:
 *   npx tsx scripts/download-from-civarchive.ts <civarchive-url> [--model-dir <path>]
 *   npm run download -- <civarchive-url>
 *
 * Example:
 *   npm run download -- https://civarchive.com/models/2189974?modelVersionId=2465814
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_MODEL_DIR = process.env.MODEL_DIR ?? "/Volumes/AI/models";

const TYPE_DIR_MAP: Record<string, string> = {
  LORA: "loras",
  Checkpoint: "diffusion_models",
  VAE: "vae",
  ControlNet: "controlnet",
  TextualInversion: "embeddings",
  Upscaler: "upscale_models",
};

const BASE_MODEL_DIR_MAP: Record<string, string> = {
  ZImageTurbo: "zit",
  Qwen: "qwen",
  "Qwen Image": "qwen",
  "Flux.2 Klein 9B": "qwen",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CivArchivePageData {
  model: {
    id: number;
    name: string;
    type: string;
    description?: string;
    username?: string;
    creator_id?: string;
    downloadCount?: number;
    favoriteCount?: number;
    commentCount?: number;
    is_nsfw?: boolean;
    nsfw_level?: number;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
    versions: Array<{ id: number; name: string; href: string }>;
    version: CivArchiveVersion;
  };
}

interface CivArchiveVersion {
  id: number;
  modelId?: number;
  name: string;
  baseModel?: string;
  baseModelType?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  files: CivArchiveFile[];
  images?: CivArchiveImage[];
  trigger?: string[];
  mirrors?: CivArchiveMirror[];
}

interface CivArchiveFile {
  id: number;
  name: string;
  type: string;
  sizeKB?: number;
  sha256?: string;
  mirrors?: CivArchiveMirror[];
}

interface CivArchiveMirror {
  url: string;
  source: string;
  filename?: string;
  deletedAt?: string | null;
  is_gated?: boolean;
  is_paid?: boolean;
}

interface CivArchiveImage {
  id: number;
  url: string;
  nsfwLevel?: number;
  width?: number;
  height?: number;
  hash?: string;
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, { headers: { "User-Agent": "ModelManager/1.0" } }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return fetchText(res.headers.location).then(resolve, reject);
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString()));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, { headers: { "User-Agent": "ModelManager/1.0" } }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return downloadFile(res.headers.location, dest).then(
            resolve,
            reject
          );
        }
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }

        const contentLength = parseInt(
          res.headers["content-length"] ?? "0",
          10
        );
        const file = fs.createWriteStream(dest);
        let downloaded = 0;
        let lastPercent = -1;

        res.on("data", (chunk: Buffer) => {
          downloaded += chunk.length;
          if (contentLength > 0) {
            const percent = Math.floor((downloaded / contentLength) * 100);
            if (percent !== lastPercent && percent % 5 === 0) {
              lastPercent = percent;
              process.stdout.write(`\r  Downloading: ${percent}%`);
            }
          }
        });
        res.pipe(file);
        file.on("finish", () => {
          process.stdout.write("\r  Downloading: 100%\n");
          file.close();
          resolve();
        });
        file.on("error", reject);
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Parse civarchive page
// ---------------------------------------------------------------------------

function extractPageData(html: string): CivArchivePageData {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) {
    throw new Error("Could not find __NEXT_DATA__ on the page");
  }
  const nextData = JSON.parse(match[1]);
  const pageProps = nextData.props?.pageProps;
  if (!pageProps?.model) {
    throw new Error("Could not extract model data from page");
  }
  return pageProps as CivArchivePageData;
}

// ---------------------------------------------------------------------------
// Build CivitAI-compatible model_dict
// ---------------------------------------------------------------------------

function buildModelDict(
  pageData: CivArchivePageData,
  version: CivArchiveVersion
): Record<string, unknown> {
  const model = pageData.model;
  const creatorName = model.username ?? model.creator_id ?? "Unknown";

  return {
    id: model.id,
    name: model.name,
    description: model.description ?? "",
    allowNoCredit: false,
    allowCommercialUse: "None",
    allowDerivatives: false,
    allowDifferentLicense: false,
    type: model.type,
    minor: false,
    sfwOnly: false,
    poi: false,
    nsfw: model.is_nsfw ?? false,
    nsfwLevel: model.nsfw_level ?? 0,
    availability: "Public",
    stats: {
      downloadCount: model.downloadCount ?? 0,
      thumbsUpCount: model.favoriteCount ?? 0,
      thumbsDownCount: 0,
      commentCount: model.commentCount ?? 0,
      tippedAmountCount: 0,
    },
    creator: {
      username: creatorName,
      image: null,
    },
    tags: model.tags ?? [],
    modelVersions: [
      {
        id: version.id,
        index: 0,
        name: version.name,
        baseModel: version.baseModel ?? null,
        baseModelType: version.baseModelType ?? "Standard",
        createdAt: version.createdAt ?? model.createdAt,
        publishedAt: version.createdAt ?? model.createdAt,
        status: "Published",
        availability: "Public",
        nsfwLevel: model.nsfw_level ?? 0,
        description: version.description ?? "",
        stats: {
          downloadCount: model.downloadCount ?? 0,
          thumbsUpCount: model.favoriteCount ?? 0,
          thumbsDownCount: 0,
        },
        files: version.files.map((f) => ({
          id: f.id,
          sizeKB: f.sizeKB ?? 0,
          name: f.name,
          type: f.type,
          pickleScanResult: "Success",
          virusScanResult: "Success",
          metadata: { format: "SafeTensor" },
          hashes: f.sha256 ? { SHA256: f.sha256.toUpperCase() } : {},
          primary: true,
        })),
        images: (version.images ?? []).map((img) => ({
          url: img.url,
          nsfwLevel: img.nsfwLevel ?? 0,
          width: img.width ?? 0,
          height: img.height ?? 0,
          hash: img.hash ?? "",
          type: "image",
        })),
        trainedWords: version.trigger ?? [],
      },
    ],
  };
}

function buildImageSidecar(img: CivArchiveImage): Record<string, unknown> {
  return {
    url: img.url,
    nsfwLevel: img.nsfwLevel ?? 0,
    width: img.width ?? 0,
    height: img.height ?? 0,
    hash: img.hash ?? "",
    type: "image",
    metadata: {
      hash: img.hash ?? "",
      size: 0,
      width: img.width ?? 0,
      height: img.height ?? 0,
    },
    meta: img.meta ?? null,
    availability: "Public",
    hasMeta: !!img.meta,
    hasPositivePrompt: false,
    onSite: false,
  };
}

// ---------------------------------------------------------------------------
// Find best download URL
// ---------------------------------------------------------------------------

function findDownloadUrl(file: CivArchiveFile, versionId: number): string {
  const mirrors = file.mirrors ?? [];

  // Prefer non-deleted HuggingFace mirrors
  const hfMirror = mirrors.find(
    (m) => m.source === "huggingface" && !m.deletedAt && !m.is_gated && !m.is_paid
  );
  if (hfMirror) return hfMirror.url;

  // Any non-deleted mirror
  const anyMirror = mirrors.find((m) => !m.deletedAt && !m.is_gated && !m.is_paid);
  if (anyMirror) return anyMirror.url;

  // Fall back to civarchive download API
  return `https://civarchive.com/api/download/models/${versionId}`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(): { url: string; modelDir: string } {
  const args = process.argv.slice(2);
  let url = "";
  let modelDir = DEFAULT_MODEL_DIR;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model-dir" && args[i + 1]) {
      modelDir = args[++i];
    } else if (!args[i].startsWith("-")) {
      url = args[i];
    }
  }

  if (!url) {
    console.error(
      "Usage: npm run download -- <civarchive-url> [--model-dir <path>]"
    );
    console.error(
      "Example: npm run download -- https://civarchive.com/models/2189974?modelVersionId=2465814"
    );
    process.exit(1);
  }

  return { url, modelDir };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { url, modelDir } = parseArgs();

  console.log("CivArchive Downloader");
  console.log("=====================");
  console.log(`  URL: ${url}`);
  console.log(`  Model dir: ${modelDir}`);
  console.log();

  // 1. Fetch page and extract data
  console.log("Fetching model data...");
  const html = await fetchText(url);
  const pageData = extractPageData(html);
  const model = pageData.model;
  const version = model.version;

  console.log(`  Model: ${model.name} (${model.id})`);
  console.log(`  Type: ${model.type}`);
  console.log(`  Version: ${version.name} (${version.id})`);
  console.log(`  Base model: ${version.baseModel ?? "unknown"}`);
  if (version.trigger?.length) {
    console.log(`  Trigger words: ${version.trigger.join(", ")}`);
  }
  console.log();

  // 2. Find the safetensors file
  const modelFile = version.files.find((f) =>
    f.name.endsWith(".safetensors")
  );
  if (!modelFile) {
    console.error("No .safetensors file found in this version");
    process.exit(1);
  }

  // 3. Determine output directory
  const typeDir = TYPE_DIR_MAP[model.type] ?? "other";
  const baseModelDir =
    BASE_MODEL_DIR_MAP[version.baseModel ?? ""] ??
    version.baseModel?.toLowerCase().replace(/[^a-z0-9]+/g, "_") ??
    "unknown";
  const modelNameClean = model.name.replace(/[<>:"/\\|?*]/g, "");
  const outputDir = path.join(modelDir, typeDir, baseModelDir, modelNameClean);
  const extraDataDir = path.join(outputDir, `extra_data-vid_${version.id}`);

  console.log(`Output: ${outputDir}`);
  fs.mkdirSync(extraDataDir, { recursive: true });

  // 4. Build safetensors filename matching the expected pattern
  const baseName = modelFile.name.replace(/\.safetensors$/, "");
  const safetensorsName = `${baseName}-mid_${model.id}-vid_${version.id}.safetensors`;
  const safetensorsPath = path.join(outputDir, safetensorsName);

  // 5. Download the model file
  if (fs.existsSync(safetensorsPath)) {
    console.log("Model file already exists, skipping download");
  } else {
    const downloadUrl = findDownloadUrl(modelFile, version.id);
    console.log(`Downloading ${modelFile.name} (~${Math.round((modelFile.sizeKB ?? 0) / 1024)} MB)...`);
    console.log(`  From: ${downloadUrl}`);
    await downloadFile(downloadUrl, safetensorsPath);
    console.log(`  Saved as: ${safetensorsName}`);
  }
  console.log();

  // 6. Save model_dict JSON
  const modelDict = buildModelDict(pageData, version);
  const dictPath = path.join(
    extraDataDir,
    `model_dict-mid_${model.id}-vid_${version.id}.json`
  );
  fs.writeFileSync(dictPath, JSON.stringify(modelDict, null, 2));
  console.log("Saved model_dict.json");

  // 7. Download images and save sidecar JSONs
  const images = version.images ?? [];
  if (images.length > 0) {
    console.log(`Downloading ${images.length} preview images...`);
    for (const img of images) {
      const ext = path.extname(new URL(img.url).pathname) || ".jpeg";
      const imgFilename = `${img.id}${ext}`;
      const imgPath = path.join(extraDataDir, imgFilename);
      const sidecarPath = path.join(extraDataDir, `${img.id}.json`);

      // Save sidecar JSON
      fs.writeFileSync(
        sidecarPath,
        JSON.stringify(buildImageSidecar(img), null, 2)
      );

      // Download image
      if (fs.existsSync(imgPath)) {
        console.log(`  ${imgFilename} (exists)`);
      } else {
        try {
          await downloadFile(img.url, imgPath);
          console.log(`  ${imgFilename}`);
        } catch (err) {
          console.error(`  Failed: ${imgFilename} — ${err}`);
        }
      }
    }
  }

  console.log();
  console.log("Done! Run `npm run scan` to index the new model.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
