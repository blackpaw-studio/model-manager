import { randomBytes, timingSafeEqual } from "crypto";
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import path from "path";
import { getConfig } from "./config";

interface SessionData {
  token: string;
  createdAt: string;
  expiresAt: string;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionPath(): string {
  return path.join(getConfig().dataDir, "session.json");
}

export function createSession(): string {
  const config = getConfig();
  if (!existsSync(config.dataDir)) {
    mkdirSync(config.dataDir, { recursive: true });
  }
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const session: SessionData = {
    token,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
  };
  writeFileSync(getSessionPath(), JSON.stringify(session, null, 2));
  return token;
}

export function validateSession(token: string): boolean {
  const sessionPath = getSessionPath();
  if (!existsSync(sessionPath)) {
    return false;
  }
  try {
    const session: SessionData = JSON.parse(readFileSync(sessionPath, "utf-8"));

    // Timing-safe comparison to prevent timing attacks
    if (token.length !== session.token.length) {
      return false;
    }
    if (!timingSafeEqual(Buffer.from(token), Buffer.from(session.token))) {
      return false;
    }

    if (new Date(session.expiresAt) < new Date()) {
      destroySession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function destroySession(): void {
  const sessionPath = getSessionPath();
  if (existsSync(sessionPath)) {
    unlinkSync(sessionPath);
  }
}
