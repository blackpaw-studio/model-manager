"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { formatFileSize } from "../../lib/utils";
import type { ModelDetail } from "../../lib/types";

export function ModelPlaceholder({ model }: { model: ModelDetail }) {
  return (
    <div className="min-h-screen pb-12">
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to gallery
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-md bg-zinc-700/30 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {model.type}
            </span>
            <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
              No metadata
            </span>
          </div>

          <h1 className="text-2xl font-bold">{model.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6">
        {/* Gradient placeholder */}
        <div className="mb-8 aspect-video rounded-xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 flex items-center justify-center border border-border">
          <div className="text-center text-muted">
            <FileText className="mx-auto mb-3 h-12 w-12 text-zinc-700" />
            <p className="text-lg font-medium text-zinc-600">
              No preview images available
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              This model was imported without CivitAI metadata
            </p>
          </div>
        </div>

        {/* File info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            File Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-24 text-muted">Filename</span>
              <span className="font-mono text-foreground/80">
                {model.filePath.split("/").pop()}
              </span>
            </div>
            {model.fileSize && (
              <div className="flex items-center gap-3">
                <span className="w-24 text-muted">Size</span>
                <span className="text-foreground/80">
                  {formatFileSize(model.fileSize)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="w-24 text-muted">Category</span>
              <span className="text-foreground/80">{model.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-24 text-muted">Path</span>
              <span className="font-mono text-xs text-foreground/60 break-all">
                {model.filePath}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
