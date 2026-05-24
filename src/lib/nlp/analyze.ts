import Sentiment from "sentiment";

const sentiment = new Sentiment();

const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","but","by","do","for","from","had","has",
  "have","he","her","him","his","i","if","in","is","it","its","just","me","my",
  "no","not","now","of","oh","on","or","our","out","she","so","that","the",
  "their","them","then","there","they","this","to","up","us","was","we","were",
  "what","when","where","which","who","will","with","you","your","yours",
  "im","ill","ive","dont","cant","wont","youre","its","gonna","wanna","like",
  "yeah","ooh","ah","la","na","hey","whoa","baby","got","get","one","know",
  "all","you'll","i'm","yo","cause","cuz","em",
]);

export type LyricAnalysis = {
  overall: {
    score: number;
    comparative: number;
    label: "positive" | "neutral" | "negative";
  };
  emotions: { name: string; value: number }[];
  arc: { line: number; score: number; text: string }[];
  words: { word: string; count: number }[];
  meta: { lineCount: number; wordCount: number };
};

const EMOTION_LEXICON: Record<string, string[]> = {
  joy: ["happy","smile","love","sun","dance","light","laugh","bright","alive","free","sweet","beautiful","fun","glow","celebrate","shine","golden"],
  sadness: ["cry","tear","lonely","alone","gone","miss","hurt","pain","sad","broken","blue","empty","ache","sorrow","grief","fall","drown","cold"],
  anger: ["hate","rage","fight","burn","fire","scream","wrong","kill","mad","fury","break","blood","destroy","war"],
  fear: ["scared","afraid","fear","dark","hide","nightmare","run","shadow","lost","tremble","alone","ghost","haunt"],
  love: ["love","heart","kiss","forever","baby","darling","yours","embrace","romance","sweetheart","desire","need","want","truly"],
};

function detectEmotions(text: string) {
  const tokens = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const counts: Record<string, number> = {};
  for (const [emotion, words] of Object.entries(EMOTION_LEXICON)) {
    counts[emotion] = tokens.filter((t) => words.includes(t)).length;
  }
  const max = Math.max(1, ...Object.values(counts));
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value: Number((value / max).toFixed(2)),
  }));
}

function keywordFrequency(text: string, limit = 30) {
  const tokens = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const counts = new Map<string, number>();
  for (const token of tokens) {
    if (token.length < 3) continue;
    if (STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function labelFor(score: number): "positive" | "neutral" | "negative" {
  if (score > 1) return "positive";
  if (score < -1) return "negative";
  return "neutral";
}

export function analyzeLyrics(text: string): LyricAnalysis {
  const cleaned = text.trim();
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const overall = sentiment.analyze(cleaned);
  const arc = lines.map((line, i) => {
    const r = sentiment.analyze(line);
    return { line: i + 1, score: r.score, text: line };
  });

  return {
    overall: {
      score: overall.score,
      comparative: Number(overall.comparative.toFixed(3)),
      label: labelFor(overall.comparative * 10),
    },
    emotions: detectEmotions(cleaned),
    arc,
    words: keywordFrequency(cleaned),
    meta: {
      lineCount: lines.length,
      wordCount: (cleaned.match(/\S+/g) ?? []).length,
    },
  };
}
