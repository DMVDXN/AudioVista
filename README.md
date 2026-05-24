# AudioVista

> See your music from every angle.

An interactive music data visualization platform that turns songs, artists, lyrics, and listening habits into clear visual insights.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Recharts + D3.js (planned)
- Spotify Web API + Kaggle datasets (planned)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Project structure

```
src/
  app/
    (app)/            # dashboard routes
    layout.tsx        # root
    page.tsx          # landing
  components/
    layout/           # Sidebar, TopBar
    dashboard/        # ChartCard, StatTile
    charts/           # (chart components — to add)
  lib/
    dataset/          # CSV loaders + aggregations
    nlp/              # sentiment + keyword extraction
    spotify/          # API client (Phase 3)
  types/              # shared TypeScript types
```

## Roadmap

- [x] Foundation: Next.js + Tailwind + app shell
- [ ] Dashboard charts (Recharts)
- [ ] Lyric emotion analyzer
- [ ] Artist collaboration graph (D3)
- [ ] Spotify OAuth + persisted listening history
- [ ] CSV upload & shareable identity card

## License

MIT
