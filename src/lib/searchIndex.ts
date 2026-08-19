import { START_TRACK } from "./startHereTrack";
import { LR_TRACK } from "./linearRegressionTrack";
import { REG_TRACK } from "./regularizationTrack";
import { POLY_TRACK } from "./polynomialRegressionTrack";
import { KRR_TRACK } from "./kernelRidgeTrack";
import { SVR_TRACK } from "./svrTrack";
import { DECISION_TREES_TRACK } from "./decisionTreesTrack";
import { KM_TRACK } from "./kMeansTrack";
import { KNN_TRACK } from "./knnTrack";
import { LOG_TRACK } from "./logisticRegressionTrack";
import { EVAL_TRACK } from "./evaluationTrack";
import { CAP_TRACK } from "./housingCapstoneTrack";
import type { TrackChapter } from "./linearRegressionTrack";

// Flat, static search index over every live lesson page, built from the track
// libs (the same source of truth the sidebars use — no separate list to drift).

export type SearchEntry = {
  title: string;
  track: string;
  chapter: string;
  href: string;
  accent: string; // family colour token
};

const TRACKS: { name: string; accent: string; chapters: TrackChapter[] }[] = [
  { name: "Start here", accent: "var(--c-fundamentals)", chapters: START_TRACK },
  { name: "Linear regression", accent: "var(--c-regression)", chapters: LR_TRACK },
  { name: "Regularized regression", accent: "var(--c-regression)", chapters: REG_TRACK },
  { name: "Polynomial regression", accent: "var(--c-regression)", chapters: POLY_TRACK },
  { name: "Kernel ridge regression", accent: "var(--c-regression)", chapters: KRR_TRACK },
  { name: "Support vector regression", accent: "var(--c-regression)", chapters: SVR_TRACK },
  { name: "Decision trees", accent: "var(--c-trees)", chapters: DECISION_TREES_TRACK },
  { name: "k-Means", accent: "var(--c-clustering)", chapters: KM_TRACK },
  { name: "k-Nearest neighbors", accent: "var(--c-classification)", chapters: KNN_TRACK },
  { name: "Logistic regression", accent: "var(--c-classification)", chapters: LOG_TRACK },
  { name: "Evaluation & metrics", accent: "var(--c-metrics)", chapters: EVAL_TRACK },
  { name: "Housing capstone", accent: "var(--c-regression)", chapters: CAP_TRACK },
];

export const SEARCH_INDEX: SearchEntry[] = TRACKS.flatMap((t) =>
  t.chapters.flatMap((c) =>
    c.pages
      .filter((p): p is { title: string; href: string } => Boolean(p.href))
      .map((p) => ({ title: p.title, track: t.name, chapter: c.title, href: p.href, accent: t.accent })),
  ),
);

// Lightweight scorer: word-prefix and substring matches over title, chapter,
// and track name. ~200 entries — no search library needed.
export function searchPages(query: string, limit = 12): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored: { e: SearchEntry; s: number }[] = [];
  for (const e of SEARCH_INDEX) {
    const title = e.title.toLowerCase();
    const hay = `${title} ${e.chapter.toLowerCase()} ${e.track.toLowerCase()}`;
    let score = 0;
    let ok = true;
    for (const term of terms) {
      if (title.startsWith(term)) score += 6;
      else if (title.split(/[^a-z0-9²]+/).some((w) => w.startsWith(term))) score += 4;
      else if (title.includes(term)) score += 3;
      else if (hay.includes(term)) score += 1;
      else { ok = false; break; }
    }
    if (ok) scored.push({ e, s: score });
  }
  return scored
    .sort((a, b) => b.s - a.s || a.e.title.length - b.e.title.length)
    .slice(0, limit)
    .map((x) => x.e);
}
