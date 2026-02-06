export interface ModelListItem {
  id: number;
  name: string;
  type: string;
  category: string;
  subcategory: string | null;
  baseModel: string | null;
  nsfwLevel: number;
  creatorName: string | null;
  creatorAvatar: string | null;
  tags: string[];
  stats: {
    downloadCount?: number;
    thumbsUpCount?: number;
  };
  hasMetadata: boolean;
  heroImage: {
    id: number;
    thumbPath: string | null;
    width: number | null;
    height: number | null;
    nsfwLevel: number;
    blurhash: string | null;
  } | null;
}

export interface ModelDetail {
  id: number;
  name: string;
  type: string;
  description: string | null;
  filePath: string;
  fileSize: number | null;
  category: string;
  subcategory: string | null;
  baseModel: string | null;
  nsfwLevel: number;
  creatorName: string | null;
  creatorAvatar: string | null;
  tags: string[];
  stats: {
    downloadCount?: number;
    thumbsUpCount?: number;
    thumbsDownCount?: number;
    commentCount?: number;
    tippedAmountCount?: number;
  };
  trainedWords: string[];
  licensingInfo: {
    allowNoCredit?: boolean;
    allowCommercialUse?: string;
    allowDerivatives?: boolean;
    allowDifferentLicense?: boolean;
  };
  hasMetadata: boolean;
  versions: VersionDetail[];
}

export interface VersionDetail {
  id: number;
  name: string;
  baseModel: string | null;
  description: string | null;
  stats: {
    downloadCount?: number;
    thumbsUpCount?: number;
    thumbsDownCount?: number;
  };
  publishedAt: string | null;
  trainedWords: string[];
  isLocal: boolean;
  localPath: string | null;
  localFileSize: number | null;
  files: FileDetail[];
  images: ImageInfo[];
}

export interface FileDetail {
  id: number;
  fileName: string;
  sizeKb: number | null;
  format: string | null;
  precision: string | null;
}

export interface ImageInfo {
  id: number;
  localPath: string | null;
  thumbPath: string | null;
  width: number | null;
  height: number | null;
  nsfwLevel: number;
  prompt: string | null;
  generationParams: GenerationParams | null;
  blurhash: string | null;
  sortOrder: number;
}

export interface GenerationParams {
  seed?: number;
  steps?: number;
  sampler?: string;
  cfgScale?: number;
  scheduler?: string;
  denoise?: number;
  loras?: Array<{ name: string; strength: number }>;
  vaes?: string[];
  width?: number;
  height?: number;
  negativePrompt?: string;
  prompt?: string;
}

export interface FilterOptions {
  categories: string[];
  baseModels: string[];
  tags: string[];
  types: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
