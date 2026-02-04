import { eq, asc, and } from "drizzle-orm";
import { images } from "../schema";
import type { DB } from "../index";
import type { ImageInfo } from "../../lib/types";

function mapImage(img: typeof images.$inferSelect): ImageInfo {
  return {
    id: img.id,
    localPath: img.localPath,
    thumbPath: img.thumbPath,
    width: img.width,
    height: img.height,
    nsfwLevel: img.nsfwLevel ?? 0,
    prompt: img.prompt,
    generationParams: img.generationParams,
    blurhash: img.blurhash,
    sortOrder: img.sortOrder ?? 0,
  };
}

export function getImagesByModelId(
  db: DB,
  modelId: number,
  versionId?: number
): ImageInfo[] {
  const conditions = [eq(images.modelId, modelId)];
  if (versionId != null) {
    conditions.push(eq(images.versionId, versionId));
  }

  return db
    .select()
    .from(images)
    .where(and(...conditions))
    .orderBy(asc(images.sortOrder))
    .all()
    .map(mapImage);
}

export function getImageById(db: DB, imageId: number): ImageInfo | null {
  const result = db
    .select()
    .from(images)
    .where(eq(images.id, imageId))
    .get();

  return result ? mapImage(result) : null;
}
