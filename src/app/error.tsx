"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-red-400">Error</h1>
      <p className="mt-2 text-lg text-muted">Something went wrong</p>
      <p className="mt-1 text-sm text-muted/60">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
