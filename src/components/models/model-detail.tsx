"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ThumbsUp,
  FileText,
  Tag,
  ChevronDown,
} from "lucide-react";
import { cn, formatNumber, formatFileSize, formatSizeKb, sanitizeHtml } from "../../lib/utils";
import { ImageGallery } from "../images/image-gallery";
import { ModelPlaceholder } from "./model-placeholder";
import type { ModelDetail, VersionDetail } from "../../lib/types";

const TYPE_COLORS: Record<string, string> = {
  LORA: "bg-purple-500/20 text-purple-400",
  LoRA: "bg-purple-500/20 text-purple-400",
  Checkpoint: "bg-blue-500/20 text-blue-400",
  VAE: "bg-green-500/20 text-green-400",
  ControlNet: "bg-orange-500/20 text-orange-400",
  Embedding: "bg-pink-500/20 text-pink-400",
  Upscaler: "bg-teal-500/20 text-teal-400",
};

function VersionSelector({
  versions,
  selected,
  onSelect,
}: {
  versions: VersionDetail[];
  selected: VersionDetail;
  onSelect: (v: VersionDetail) => void;
}) {
  const [open, setOpen] = useState(false);

  if (versions.length <= 1) {
    return (
      <span className="text-sm text-muted">
        Version: {selected.name}
        {selected.isLocal && (
          <span className="ml-1.5 text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
            LOCAL
          </span>
        )}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-accent/50 transition-colors"
      >
        {selected.name}
        {selected.isLocal && (
          <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
            LOCAL
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-30 w-64 rounded-xl border border-border bg-card shadow-xl">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                onSelect(v);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-card-hover transition-colors",
                v.id === selected.id && "text-accent"
              )}
            >
              {v.name}
              {v.isLocal && (
                <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                  LOCAL
                </span>
              )}
              {v.baseModel && (
                <span className="text-xs text-muted ml-auto">
                  {v.baseModel}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ModelDetailView({ model }: { model: ModelDetail }) {
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail>(
    model.versions[0]
  );

  if (!model.hasMetadata) {
    return <ModelPlaceholder model={model} />;
  }

  const typeColor =
    TYPE_COLORS[model.type] ?? "bg-zinc-500/20 text-zinc-400";

  // Get all images from the selected version, falling back to all images
  const displayImages =
    selectedVersion?.images.length > 0
      ? selectedVersion.images
      : model.versions.flatMap((v) => v.images);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to gallery
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
                    typeColor
                  )}
                >
                  {model.type}
                </span>
                {model.baseModel && (
                  <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                    {model.baseModel}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold">{model.name}</h1>

              {model.creatorName && (
                <div className="mt-2 flex items-center gap-2">
                  {model.creatorAvatar && (
                    <img
                      src={model.creatorAvatar}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="text-sm text-muted">
                    by {model.creatorName}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted">
              {model.stats.downloadCount != null && (
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" />
                  <span>{formatNumber(model.stats.downloadCount)}</span>
                </div>
              )}
              {model.stats.thumbsUpCount != null && (
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{formatNumber(model.stats.thumbsUpCount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6">
        {/* Version selector */}
        {model.versions.length > 0 && (
          <div className="mb-6">
            <VersionSelector
              versions={model.versions}
              selected={selectedVersion}
              onSelect={setSelectedVersion}
            />
          </div>
        )}

        {/* Image gallery */}
        {displayImages.length > 0 && (
          <div className="mb-8">
            <ImageGallery images={displayImages} />
          </div>
        )}

        {/* Description */}
        {model.description && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              <FileText className="h-4 w-4" />
              Description
            </h2>
            <div
              className="prose prose-sm prose-invert max-w-none rounded-xl border border-border bg-card p-4"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(model.description),
              }}
            />
          </div>
        )}

        {/* Tags */}
        {model.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              <Tag className="h-4 w-4" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {model.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/?tags=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-card border border-border px-3 py-1 text-sm text-muted hover:text-foreground hover:border-accent/50 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trained words */}
        {selectedVersion?.trainedWords &&
          selectedVersion.trainedWords.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                Trained Words
              </h2>
              <div className="flex flex-wrap gap-2">
                {selectedVersion.trainedWords.map((word) => (
                  <span
                    key={word}
                    className="rounded-lg bg-accent/10 px-3 py-1 text-sm text-accent font-mono"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Files table */}
        {selectedVersion?.files && selectedVersion.files.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Files
            </h2>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-2.5 text-left font-medium text-muted">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted">
                      Size
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted">
                      Format
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVersion.files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-2.5 font-mono text-foreground/90">
                        {file.fileName}
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {formatSizeKb(file.sizeKb)}
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {file.format ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* File info */}
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
          <div className="flex gap-6">
            <div>
              <span className="text-foreground/60">Local file:</span>{" "}
              <span className="font-mono text-foreground/80 text-xs">
                {model.filePath.split("/").pop()}
              </span>
            </div>
            {model.fileSize && (
              <div>
                <span className="text-foreground/60">Size:</span>{" "}
                {formatFileSize(model.fileSize)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
