import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { getConfig } from "../lib/config";
import fs from "fs";
import path from "path";

export type DB = BetterSQLite3Database<typeof schema>;

export function createDatabase(dbPath?: string): DB {
  const resolvedPath = dbPath ?? getConfig().dbPath;
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(resolvedPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

let _db: DB | null = null;

export function getDatabase(): DB {
  if (!_db) {
    _db = createDatabase();
  }
  return _db;
}
