"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Sparkles,
  MessageSquareQuote,
  Network,
  LineChart,
  ListMusic,
  Mic2,
  Radio,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/artists", label: "Artists", icon: Mic2 },
  { href: "/taste", label: "Taste profile", icon: Sparkles },
  { href: "/lyrics", label: "Lyric emotions", icon: MessageSquareQuote },
  { href: "/network", label: "Artist network", icon: Network },
  { href: "/trends", label: "Trends", icon: LineChart },
  { href: "/playlist", label: "Playlist analyzer", icon: ListMusic },
  { href: "/upload", label: "Upload data", icon: Upload },
  { href: "/connect/lastfm", label: "Last.fm", icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-bg-elevated/40 px-4 py-6">
      <Link href="/" className="flex items-center gap-2 px-2">
        <div className="size-7 rounded-lg bg-brand-gradient" />
        <span className="font-semibold tracking-tight">AudioVista</span>
      </Link>
      <nav className="mt-8 flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-violet/15 text-white"
                  : "text-text-muted hover:bg-bg-subtle hover:text-text",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
