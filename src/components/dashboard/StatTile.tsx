import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function StatTile({ label, value, hint, className }: Props) {
  return (
    <div className={cn("card !p-4", className)}>
      <div className="text-xs uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-text-subtle">{hint}</div>}
    </div>
  );
}
