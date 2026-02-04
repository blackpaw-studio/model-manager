"use client";

import { ModelCard } from "./model-card";
import type { ModelListItem } from "../../lib/types";

interface ModelGridProps {
  models: ModelListItem[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
}

export function ModelGrid({
  models,
  hasMore,
  onLoadMore,
  loading,
}: ModelGridProps) {
  if (models.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted">
        <p className="text-lg">No models found</p>
        <p className="mt-1 text-sm">Try adjusting your filters or search</p>
      </div>
    );
  }

  return (
    <div>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-card-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
