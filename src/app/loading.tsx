export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-text-muted">
        <div className="size-2 animate-pulse rounded-full bg-brand-magenta" />
        <div
          className="size-2 animate-pulse rounded-full bg-brand-violet"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="size-2 animate-pulse rounded-full bg-brand-cyan"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
