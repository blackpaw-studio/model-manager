import Link from "next/link";

export default function ModelNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-foreground/60">404</h1>
      <p className="mt-2 text-lg text-muted">Model not found</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80 transition-colors"
      >
        Back to gallery
      </Link>
    </div>
  );
}
