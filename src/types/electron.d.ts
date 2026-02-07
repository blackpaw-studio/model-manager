interface ElectronAPI {
  openDirectory(): Promise<string | null>;
  getSetting(key: string): Promise<unknown>;
  setSetting(key: string, value: unknown): Promise<void>;
  getVersion(): Promise<string>;
  getServerInfo(): Promise<{ port: number; addresses: string[] }>;
  restartServer(): Promise<void>;
  openInFinder(filePath: string): Promise<void>;
  openExternal(url: string): Promise<void>;
  onMenuNavigate(callback: (path: string) => void): () => void;
  onMenuRescan(callback: () => void): () => void;
  onMenuDownload(callback: () => void): () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
