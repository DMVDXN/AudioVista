import { Sparkles } from "lucide-react";
import type { Identity } from "@/lib/dataset/taste";

type Props = { identity: Identity };

export function IdentityCard({ identity }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-violet/30 bg-bg-elevated p-8">
      <div className="absolute inset-0 -z-0 opacity-50 bg-gradient-to-br from-brand-magenta/30 via-brand-violet/20 to-brand-cyan/20" />
      <div className="absolute -right-16 -top-16 -z-0 size-72 rounded-full bg-brand-violet/30 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 -z-0 size-56 rounded-full bg-brand-cyan/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-text-muted">
          <Sparkles className="size-4 text-brand-cyan" />
          Your music identity
        </div>
        <h2 className="mt-4 font-serif text-4xl sm:text-5xl leading-tight">
          <span className="heading-gradient capitalize">{identity.label}</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm text-text-muted">
          {identity.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          <Badge>{identity.vibe}</Badge>
          <Badge>{identity.tempo}</Badge>
          <Badge>{identity.popularity}</Badge>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-bg-elevated/70 px-3 py-1 text-text backdrop-blur-sm">
      {children}
    </span>
  );
}
