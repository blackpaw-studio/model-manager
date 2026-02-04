import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-card border border-border",
        className
      )}
    />
  );
}

export function ModelCardSkeleton() {
  return (
    <div className="break-inside-avoid mb-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Skeleton className="aspect-[4/3] rounded-none border-0" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4 border-0" />
          <Skeleton className="h-3 w-1/2 border-0" />
        </div>
      </div>
    </div>
  );
}

export function ModelGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {Array.from({ length: count }, (_, i) => (
        <ModelCardSkeleton key={i} />
      ))}
    </div>
  );
}
