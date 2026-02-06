import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { access, stat } from "fs/promises";
import path from "path";
import { getDatabase } from "../../../../../../db";
import { getModelById } from "../../../../../../db/queries/models";
import { getConfig } from "../../../../../../lib/config";
import { withApiAuth } from "../../../../../../lib/api-auth";

export const dynamic = "force-dynamic";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const modelId = parseInt(id, 10);

  if (isNaN(modelId)) {
    return NextResponse.json({ error: "Invalid model ID" }, { status: 400 });
  }

  const db = getDatabase();
  const model = getModelById(db, modelId);

  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  // Check for versionId query parameter
  const { searchParams } = request.nextUrl;
  const versionIdParam = searchParams.get("versionId");

  let filePath: string | null = null;

  if (versionIdParam) {
    const versionId = parseInt(versionIdParam, 10);
    if (isNaN(versionId)) {
      return NextResponse.json({ error: "Invalid version ID" }, { status: 400 });
    }

    const version = model.versions.find((v) => v.id === versionId);
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (!version.localPath) {
      return NextResponse.json(
        { error: "Version file not available locally" },
        { status: 404 }
      );
    }

    filePath = version.localPath;
  } else {
    // Default to first local version or model.filePath
    const localVersion = model.versions.find((v) => v.isLocal && v.localPath);
    filePath = localVersion?.localPath ?? model.filePath;
  }
  if (!filePath) {
    return NextResponse.json(
      { error: "Model has no file path" },
      { status: 404 }
    );
  }

  const normalizedPath = path.normalize(filePath);

  // Security: verify file is within model directory
  const config = getConfig();
  if (!normalizedPath.startsWith(config.modelDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await access(normalizedPath);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileStats = await stat(normalizedPath);
  const fileName = path.basename(normalizedPath);

  const stream = createReadStream(normalizedPath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(fileStats.size),
    },
  });
}

export const GET = withApiAuth(handler);
