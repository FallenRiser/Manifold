import { START_TRACK } from "./startHereTrack";
import { LR_TRACK } from "./linearRegressionTrack";
import { REG_TRACK } from "./regularizationTrack";
import { POLY_TRACK } from "./polynomialRegressionTrack";
import { KRR_TRACK } from "./kernelRidgeTrack";
import { SVR_TRACK } from "./svrTrack";
import { DECISION_TREES_TRACK } from "./decisionTreesTrack";
import { RANDOM_FORESTS_TRACK } from "./randomForestsTrack";
import { BOOSTING_TRACK } from "./boostingTrack";
import { KM_TRACK } from "./kMeansTrack";
import { PCA_TRACK } from "./pcaTrack";
import { KNN_TRACK } from "./knnTrack";
import { NB_TRACK } from "./naiveBayesTrack";
import { LOG_TRACK } from "./logisticRegressionTrack";
import { EVAL_TRACK } from "./evaluationTrack";
import { MF_TRACK } from "./mathFoundationsTrack";
import { LT_TRACK } from "./learningTheoryTrack";
import { MS_TRACK } from "./modelSelectionTrack";
import { DW_TRACK } from "./dataWorkflowTrack";
import { PM_TRACK } from "./perceptronMlpTrack";
import { BP_TRACK } from "./backpropTrack";
import { ACT_TRACK } from "./activationsTrack";
import { ARCH_TRACK } from "./architectureTrack";
import { INIT_TRACK } from "./initNormTrack";
import { REG_NN_TRACK } from "./regularisationTrack";
import { MDP_TRACK } from "./mdpTrack";
import { PLANNING_TRACK } from "./planningTrack";
import { LEARNING_TRACK } from "./learningTrack";
import { CAP_TRACK } from "./housingCapstoneTrack";
import { NEO_TRACK } from "./neoCapstoneTrack";
import { RL_CAP_TRACK } from "./rlCapstoneTrack";
import { LOP_CAP_TRACK } from "./lopCapstoneTrack";
import { FA_TRACK } from "./functionApproximationTrack";
import { ENV_TRACK } from "./envBuildingTrack";
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
  { name: "Random forests", accent: "var(--c-trees)", chapters: RANDOM_FORESTS_TRACK },
  { name: "Boosting", accent: "var(--c-trees)", chapters: BOOSTING_TRACK },
  { name: "k-Means", accent: "var(--c-clustering)", chapters: KM_TRACK },
  { name: "Principal component analysis", accent: "var(--c-dimred)", chapters: PCA_TRACK },
  { name: "k-Nearest neighbors", accent: "var(--c-classification)", chapters: KNN_TRACK },
  { name: "Naive Bayes", accent: "var(--c-classification)", chapters: NB_TRACK },
  { name: "Logistic regression", accent: "var(--c-classification)", chapters: LOG_TRACK },
  { name: "Evaluation & metrics", accent: "var(--c-metrics)", chapters: EVAL_TRACK },
  { name: "Math foundations", accent: "var(--c-fundamentals)", chapters: MF_TRACK },
  { name: "Learning theory", accent: "var(--c-metrics)", chapters: LT_TRACK },
  { name: "Model selection", accent: "var(--c-metrics)", chapters: MS_TRACK },
  { name: "The data workflow", accent: "var(--c-metrics)", chapters: DW_TRACK },
  { name: "Perceptron → MLP", accent: "var(--c-neural)", chapters: PM_TRACK },
  { name: "Backpropagation", accent: "var(--c-neural)", chapters: BP_TRACK },
  { name: "Activation functions", accent: "var(--c-neural)", chapters: ACT_TRACK },
  { name: "Architecture design", accent: "var(--c-neural)", chapters: ARCH_TRACK },
  { name: "Initialisation & normalisation", accent: "var(--c-neural)", chapters: INIT_TRACK },
  { name: "Regularisation", accent: "var(--c-neural)", chapters: REG_NN_TRACK },
  { name: "Markov decision processes", accent: "var(--c-rl)", chapters: MDP_TRACK },
  { name: "Planning", accent: "var(--c-rl)", chapters: PLANNING_TRACK },
  { name: "Learning", accent: "var(--c-rl)", chapters: LEARNING_TRACK },
  { name: "Housing capstone", accent: "var(--c-regression)", chapters: CAP_TRACK },
  { name: "Asteroid-hazard capstone", accent: "var(--c-space)", chapters: NEO_TRACK },
  { name: "Warehouse-robot capstone", accent: "var(--c-warehouse)", chapters: RL_CAP_TRACK },
  { name: "Learning to parry (field report)", accent: "var(--c-krat)", chapters: LOP_CAP_TRACK },
  { name: "Function approximation", accent: "var(--c-rl)", chapters: FA_TRACK },
  { name: "Building environments", accent: "var(--c-rl)", chapters: ENV_TRACK },
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
