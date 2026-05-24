import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
          404
        </p>
        <h2 className="mt-2 font-serif text-3xl">Page not found</h2>
        <p className="mt-2 text-sm text-text-muted">
          That track isn&apos;t in our library.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
