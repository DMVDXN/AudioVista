"use client";

import { Download, Loader2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

type Props = {
  fileName?: string;
  children: ReactNode;
};

export function ShareIdentity({ fileName = "audiovista-identity", children }: Props) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(targetRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0B0F1A",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileName}.png`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div ref={targetRef}>{children}</div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-4 py-2 text-xs font-medium hover:border-brand-violet/60 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Export as PNG
        </button>
      </div>
    </div>
  );
}
