import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
};

export function ChartCard({ title, subtitle, className, children }: Props) {
  return (
    <section className={cn("card", className)}>
      <header className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
        )}
      </header>
      <div className="min-h-32">{children}</div>
    </section>
  );
}
