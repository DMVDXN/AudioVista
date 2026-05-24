import Link from "next/link";
import { BarChart3, Music2, Network, Sparkles } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Listening dashboard",
    body: "Top artists, top tracks, genre breakdowns, and listening trends — all in one view.",
  },
  {
    icon: Sparkles,
    title: "Music taste profile",
    body: "Your audio-feature fingerprint: energy, mood, tempo, danceability, and an identity card.",
  },
  {
    icon: Music2,
    title: "Lyric emotion visualizer",
    body: "Paste lyrics and see sentiment arcs, emotion breakdowns, and keyword clouds.",
  },
  {
    icon: Network,
    title: "Artist network",
    body: "Explore collaboration graphs and discover how your favorite artists connect.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-brand-gradient" />
          <span className="text-lg font-semibold tracking-tight">AudioVista</span>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-border bg-bg-elevated px-4 py-2 text-sm font-medium hover:border-brand-violet/60 transition-colors"
        >
          Open dashboard
        </Link>
      </nav>

      <section className="mt-20 sm:mt-28 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-text-muted">
          Music analytics, reimagined
        </p>
        <h1 className="mt-6 font-serif text-5xl sm:text-7xl leading-[1.05] tracking-tight">
          See your music from <span className="heading-gradient">every angle</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
          AudioVista turns your listening history, song features, and lyrics into
          interactive visual insights — so you actually understand the music you love.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30 hover:opacity-90 transition-opacity"
          >
            Try the demo
          </Link>
          <Link
            href="/lyrics"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-brand-violet/60 transition-colors"
          >
            Analyze lyrics
          </Link>
        </div>
      </section>

      <section className="mt-28 grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card">
            <Icon className="size-6 text-brand-cyan" />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-text-muted">{body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-28 border-t border-border pt-8 flex items-center justify-between text-sm text-text-subtle">
        <span>© {new Date().getFullYear()} AudioVista</span>
        <span>Built with Next.js · Tailwind · D3</span>
      </footer>
    </main>
  );
}
