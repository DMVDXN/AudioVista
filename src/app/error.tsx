"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card max-w-md text-center">
        <h2 className="font-serif text-2xl">Something went wrong</h2>
        <p className="mt-2 text-sm text-text-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
