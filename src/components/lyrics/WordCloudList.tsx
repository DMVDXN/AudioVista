"use client";

type WordDatum = { word: string; count: number };

type Props = { words: WordDatum[] };

const COLORS = ["#22D3EE", "#F472B6", "#A78BFA", "#FACC15", "#E6E9F2"];
const WIDTH = 900;
const HEIGHT = 390;

export function WordCloudList({ words }: Props) {
  if (!words.length) return null;

  const topWords = words.slice(0, 36);
  const max = Math.max(...topWords.map((w) => w.count));
  const min = Math.min(...topWords.map((w) => w.count));
  const placed = topWords.map((word, index) =>
    placeWord(word, index, topWords.length, min, max),
  );
  const bars = makeWaveBars(topWords, max);

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-bg/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_60%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_82%_60%,rgba(244,114,182,0.16),transparent_28%),linear-gradient(180deg,rgba(167,139,250,0.08),transparent_55%)]" />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Keyword soundwave between headphones, sized by word frequency"
        className="relative h-[390px] w-full"
      >
        <defs>
          <filter id="keywordGlow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="headphoneStroke" x1="120" x2="780" y1="60" y2="330">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <linearGradient id="waveGradient" x1="250" x2="650" y1="0" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>

        <g opacity={0.95}>
          <path
            d="M158 254 C158 70 742 70 742 254"
            fill="none"
            stroke="url(#headphoneStroke)"
            strokeLinecap="round"
            strokeWidth={20}
            opacity={0.2}
          />
          <path
            d="M186 251 C186 103 714 103 714 251"
            fill="none"
            stroke="#273044"
            strokeLinecap="round"
            strokeWidth={4}
          />
          <path
            d="M130 214 C116 236 112 296 130 320"
            fill="none"
            stroke="#22D3EE"
            strokeLinecap="round"
            strokeWidth={10}
            opacity={0.55}
          />
          <path
            d="M770 214 C784 236 788 296 770 320"
            fill="none"
            stroke="#F472B6"
            strokeLinecap="round"
            strokeWidth={10}
            opacity={0.55}
          />
          <rect
            x={132}
            y={200}
            width={110}
            height={144}
            rx={42}
            fill="#0E1422"
            stroke="#22D3EE"
            strokeOpacity={0.55}
            strokeWidth={3}
          />
          <rect
            x={658}
            y={200}
            width={110}
            height={144}
            rx={42}
            fill="#0E1422"
            stroke="#F472B6"
            strokeOpacity={0.55}
            strokeWidth={3}
          />
          <rect
            x={162}
            y={226}
            width={50}
            height={92}
            rx={24}
            fill="#101827"
            stroke="#2D3A56"
          />
          <rect
            x={688}
            y={226}
            width={50}
            height={92}
            rx={24}
            fill="#101827"
            stroke="#2D3A56"
          />
        </g>

        <g>
          <line
            x1={268}
            y1={245}
            x2={632}
            y2={245}
            stroke="#273044"
            strokeWidth={2}
            strokeDasharray="6 10"
          />
          {bars.map((bar, index) => (
            <rect
              key={index}
              x={bar.x}
              y={245 - bar.height / 2}
              width={bar.width}
              height={bar.height}
              rx={bar.width / 2}
              fill="url(#waveGradient)"
              opacity={bar.opacity}
            />
          ))}
          <path
            d="M258 245 C300 166 337 321 378 245 S456 169 497 245 S575 321 642 216"
            fill="none"
            stroke="url(#waveGradient)"
            strokeLinecap="round"
            strokeWidth={3}
            opacity={0.45}
          />
        </g>

        {placed.map((item) => (
          <g
            key={item.word}
            transform={`translate(${item.x},${item.y}) rotate(${item.rotate})`}
            className="transition-opacity duration-200 hover:opacity-100"
          >
            <title>{`${item.word}: ${item.count} uses`}</title>
            <rect
              x={-item.boxWidth / 2}
              y={-item.fontSize * 0.76}
              width={item.boxWidth}
              height={item.fontSize * 1.08}
              rx={Math.min(14, item.fontSize * 0.34)}
              fill="#070A12"
              opacity={0.5}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill={item.color}
              fontSize={item.fontSize}
              fontWeight={item.weight > 0.7 ? 800 : item.weight > 0.38 ? 650 : 500}
              fontFamily="var(--font-serif), Georgia, serif"
              letterSpacing={0}
              filter={item.weight > 0.72 ? "url(#keywordGlow)" : undefined}
              paintOrder="stroke"
              stroke="#070A12"
              strokeWidth={item.weight > 0.55 ? 3 : 2}
            >
              {item.word}
            </text>
          </g>
        ))}
      </svg>

      <div className="relative grid grid-cols-2 border-t border-border bg-bg-subtle/70 px-4 py-3 text-xs text-text-muted sm:flex sm:items-center sm:justify-between">
        <span>{topWords.length} keywords</span>
        <span>Words ride the soundwave between the headphones</span>
      </div>
    </div>
  );
}

function placeWord(
  datum: WordDatum,
  index: number,
  total: number,
  min: number,
  max: number,
) {
  const weight = max === min ? 1 : (datum.count - min) / (max - min);
  const lane = index % 4;
  const column = Math.floor(index / 4);
  const columns = Math.max(1, Math.ceil(total / 4));
  const t = columns === 1 ? 0.5 : column / (columns - 1);
  const x = 286 + t * 328 + Math.sin(index * 1.31) * 10;
  const wave = Math.sin(t * Math.PI * 4.6) * 42;
  const laneOffset = [-62, -24, 24, 62][lane];
  const y = 245 + wave * 0.45 + laneOffset;
  const fontSize = 13 + weight * 28 + Math.max(0, 0.18 - index / total) * 16;
  const rotate = lane === 0 || lane === 3 ? (lane === 0 ? -5 : 5) : 0;

  return {
    ...datum,
    x,
    y,
    rotate,
    fontSize,
    color: COLORS[index % COLORS.length],
    weight,
    boxWidth: Math.max(42, datum.word.length * fontSize * 0.56 + 22),
  };
}

function makeWaveBars(words: WordDatum[], max: number) {
  const count = 34;
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const source = words[index % Math.max(1, words.length)];
    const weight = source ? source.count / max : 0.25;
    const envelope = Math.sin(t * Math.PI);
    const pulse = 0.45 + Math.abs(Math.sin(index * 1.73)) * 0.55;
    return {
      x: 264 + index * 11,
      width: 5,
      height: 18 + envelope * pulse * (58 + weight * 72),
      opacity: 0.22 + weight * 0.48,
    };
  });
}
