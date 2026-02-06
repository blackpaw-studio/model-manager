import path from "path";

export interface AppConfig {
  modelDir: string;
  dataDir: string;
  dbPath: string;
  thumbDir: string;
  uploadDir: string;
}

export function createConfig(overrides?: Partial<AppConfig>): AppConfig {
  const modelDir =
    overrides?.modelDir ??
    process.env.MODEL_DIR ??
    "/Volumes/AI/models";

  const dataDir =
    overrides?.dataDir ??
    process.env.DATA_DIR ??
    path.join(process.cwd(), ".data");

  return {
    modelDir,
    dataDir,
    dbPath: overrides?.dbPath ?? path.join(dataDir, "models.db"),
    thumbDir: overrides?.thumbDir ?? path.join(dataDir, "thumbs"),
    uploadDir: overrides?.uploadDir ?? path.join(dataDir, "uploads"),
  };
}

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = createConfig();
  }
  return _config;
}
