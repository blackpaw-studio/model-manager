import { hashSync, compareSync } from "bcryptjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { getConfig } from "./config";

interface AdminCredentials {
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "password";
const BCRYPT_ROUNDS = 10;

function getAdminPath(): string {
  return path.join(getConfig().dataDir, "admin.json");
}

export function getAdminCredentials(): AdminCredentials {
  const adminPath = getAdminPath();
  if (!existsSync(adminPath)) {
    return createDefaultAdmin();
  }
  return JSON.parse(readFileSync(adminPath, "utf-8"));
}

function createDefaultAdmin(): AdminCredentials {
  const config = getConfig();
  if (!existsSync(config.dataDir)) {
    mkdirSync(config.dataDir, { recursive: true });
  }
  const now = new Date().toISOString();
  const credentials: AdminCredentials = {
    username: DEFAULT_USERNAME,
    passwordHash: hashSync(DEFAULT_PASSWORD, BCRYPT_ROUNDS),
    createdAt: now,
    updatedAt: now,
  };
  writeFileSync(getAdminPath(), JSON.stringify(credentials, null, 2));
  return credentials;
}

export function validatePassword(
  username: string,
  password: string
): boolean {
  const credentials = getAdminCredentials();
  if (username !== credentials.username) {
    return false;
  }
  return compareSync(password, credentials.passwordHash);
}

export function changePassword(newPassword: string): void {
  const credentials = getAdminCredentials();
  credentials.passwordHash = hashSync(newPassword, BCRYPT_ROUNDS);
  credentials.updatedAt = new Date().toISOString();
  writeFileSync(getAdminPath(), JSON.stringify(credentials, null, 2));
}
