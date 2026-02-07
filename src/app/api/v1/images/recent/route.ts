import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../../../db";
import { withApiAuth } from "../../../../../lib/api-auth";
import { desc, sql } from "drizzle-orm";
import { userImages, models } from "../../../../../db/schema";

export const dynamic = "force-dynamic";

async function handler(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const db = getDatabase();

  // Get recent user-uploaded images with model info
  // Note: localPath and thumbPath are NOT returned for security - use ID-based routes instead
  const results = db
    .select({
      id: userImages.id,
      modelId: userImages.modelId,
      versionId: userImages.versionId,
      width: userImages.width,
      height: userImages.height,
      nsfwLevel: userImages.nsfwLevel,
      prompt: userImages.prompt,
      generationParams: userImages.generationParams,
      blurhash: userImages.blurhash,
      createdAt: userImages.createdAt,
      modelName: models.name,
      modelType: models.type,
    })
    .from(userImages)
    .leftJoin(models, sql`${userImages.modelId} = ${models.id}`)
    .orderBy(desc(userImages.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Get total count
  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(userImages)
    .get();

  const total = countResult?.count ?? 0;

  return NextResponse.json({
    images: results.map((r) => ({
      id: r.id,
      modelId: r.modelId,
      versionId: r.versionId,
      width: r.width,
      height: r.height,
      nsfwLevel: r.nsfwLevel ?? 0,
      prompt: r.prompt,
      generationParams: r.generationParams,
      blurhash: r.blurhash,
      createdAt: r.createdAt,
      modelName: r.modelName,
      modelType: r.modelType,
      isUserUpload: true,
    })),
    total,
    hasMore: offset + results.length < total,
  });
}

export const GET = withApiAuth(handler);
