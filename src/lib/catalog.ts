// The derived catalogue — one source of truth for "how much of Manifold is actually live".
//
// Every number here is computed from the track modules themselves, never typed by hand. The
// landing page, the map and the footer all read from this, so adding a page to a track updates
// all three. The old hand-written lists drifted badly: the footer advertised 15 tracks and the
// landing page 5, on a site that had 34.
import type { Group, Track } from "./siteMap";

import { LR_TOTAL, LR_DONE } from "./linearRegressionTrack";
import { REG_TOTAL, REG_DONE } from "./regularizationTrack";
import { POLY_TOTAL, POLY_DONE } from "./polynomialRegressionTrack";
import { KRR_TOTAL, KRR_DONE } from "./kernelRidgeTrack";
import { SVR_TOTAL, SVR_DONE } from "./svrTrack";

import { LOG_TOTAL, LOG_DONE } from "./logisticRegressionTrack";
import { KNN_TOTAL, KNN_DONE } from "./knnTrack";
import { NB_TOTAL, NB_DONE } from "./naiveBayesTrack";

import { DECISION_TREES_TOTAL, DECISION_TREES_DONE } from "./decisionTreesTrack";
import { RANDOM_FORESTS_TOTAL, RANDOM_FORESTS_DONE } from "./randomForestsTrack";
import { BOOSTING_TOTAL, BOOSTING_DONE } from "./boostingTrack";

import { KM_TOTAL, KM_DONE } from "./kMeansTrack";
import { PCA_TOTAL, PCA_DONE } from "./pcaTrack";

import { PM_TOTAL, PM_DONE } from "./perceptronMlpTrack";
import { BP_TOTAL, BP_DONE } from "./backpropTrack";
import { ACT_TOTAL, ACT_DONE } from "./activationsTrack";
import { ARCH_TOTAL, ARCH_DONE } from "./architectureTrack";
import { INIT_TOTAL, INIT_DONE } from "./initNormTrack";
import { REG_NN_TOTAL, REG_NN_DONE } from "./regularisationTrack";

import { MDP_TOTAL, MDP_DONE } from "./mdpTrack";
import { PLANNING_TOTAL, PLANNING_DONE } from "./planningTrack";
import { LEARNING_TOTAL, LEARNING_DONE } from "./learningTrack";
import { FA_TOTAL, FA_DONE } from "./functionApproximationTrack";
import { ENV_TOTAL, ENV_DONE } from "./envBuildingTrack";

import { DW_TOTAL, DW_DONE } from "./dataWorkflowTrack";
import { EVAL_TOTAL, EVAL_DONE } from "./evaluationTrack";
import { MS_TOTAL, MS_DONE } from "./modelSelectionTrack";
import { MF_TOTAL, MF_DONE } from "./mathFoundationsTrack";
import { LT_TOTAL, LT_DONE } from "./learningTheoryTrack";
import { START_TOTAL, START_DONE } from "./startHereTrack";

import { CAP_TOTAL, CAP_DONE } from "./housingCapstoneTrack";
import { NEO_TOTAL, NEO_DONE } from "./neoCapstoneTrack";
import { RL_CAP_TOTAL, RL_CAP_DONE } from "./rlCapstoneTrack";
import { LOP_CAP_TOTAL, LOP_CAP_DONE } from "./lopCapstoneTrack";

export type Counts = { done: number; total: number };

const c = (done: number, total: number): Counts => ({ done, total });

/** Keyed by each track's ROOT href — the same href `siteMap` uses for the track's first page. */
export const TRACK_COUNTS: Record<string, Counts> = {
  "/learn/linear-regression": c(LR_DONE, LR_TOTAL),
  "/learn/regularized-regression": c(REG_DONE, REG_TOTAL),
  "/learn/polynomial-regression": c(POLY_DONE, POLY_TOTAL),
  "/learn/kernel-ridge-regression": c(KRR_DONE, KRR_TOTAL),
  "/learn/support-vector-regression": c(SVR_DONE, SVR_TOTAL),

  "/learn/logistic-regression": c(LOG_DONE, LOG_TOTAL),
  "/learn/k-nearest-neighbors": c(KNN_DONE, KNN_TOTAL),
  "/learn/naive-bayes": c(NB_DONE, NB_TOTAL),

  "/learn/decision-trees": c(DECISION_TREES_DONE, DECISION_TREES_TOTAL),
  "/learn/random-forests": c(RANDOM_FORESTS_DONE, RANDOM_FORESTS_TOTAL),
  "/learn/boosting": c(BOOSTING_DONE, BOOSTING_TOTAL),

  "/learn/k-means": c(KM_DONE, KM_TOTAL),
  "/learn/pca": c(PCA_DONE, PCA_TOTAL),

  "/learn/perceptron-to-mlp": c(PM_DONE, PM_TOTAL),
  "/learn/backpropagation": c(BP_DONE, BP_TOTAL),
  "/learn/activation-functions": c(ACT_DONE, ACT_TOTAL),
  "/learn/architecture-design": c(ARCH_DONE, ARCH_TOTAL),
  "/learn/initialisation-and-normalisation": c(INIT_DONE, INIT_TOTAL),
  "/learn/nn-regularisation": c(REG_NN_DONE, REG_NN_TOTAL),

  "/learn/markov-decision-processes": c(MDP_DONE, MDP_TOTAL),
  "/learn/planning": c(PLANNING_DONE, PLANNING_TOTAL),
  "/learn/learning": c(LEARNING_DONE, LEARNING_TOTAL),
  "/learn/function-approximation": c(FA_DONE, FA_TOTAL),
  "/learn/building-environments": c(ENV_DONE, ENV_TOTAL),

  "/learn/data-workflow": c(DW_DONE, DW_TOTAL),
  "/learn/evaluation": c(EVAL_DONE, EVAL_TOTAL),
  "/learn/model-selection": c(MS_DONE, MS_TOTAL),
  "/learn/math-foundations": c(MF_DONE, MF_TOTAL),
  "/learn/learning-theory": c(LT_DONE, LT_TOTAL),
  "/learn/start-here": c(START_DONE, START_TOTAL),
};

export const CAPSTONE_COUNTS: Record<string, Counts> = {
  "/learn/california-housing-capstone": c(CAP_DONE, CAP_TOTAL),
  "/learn/asteroid-hazard-capstone": c(NEO_DONE, NEO_TOTAL),
  "/learn/warehouse-robot-capstone": c(RL_CAP_DONE, RL_CAP_TOTAL),
  "/learn/lies-of-p-capstone": c(LOP_CAP_DONE, LOP_CAP_TOTAL),
};

/** A group's tracks may deep-link into chapters (the pillars do), so fall back to the root. */
export function countsFor(href?: string): Counts | undefined {
  if (!href) return undefined;
  return (
    TRACK_COUNTS[href] ??
    CAPSTONE_COUNTS[href] ??
    TRACK_COUNTS[href.split("/").slice(0, 3).join("/")]
  );
}

/** Live pages in one group, counting each distinct track once. */
export function groupPages(group: Group): { pages: number; live: number; planned: number } {
  const seen = new Set<Counts>();
  let live = 0;
  for (const t of group.tracks) {
    const k = countsFor(t.href);
    if (k && !seen.has(k)) {
      seen.add(k);
      live += 1;
    }
  }
  return {
    pages: [...seen].reduce((n, k) => n + k.done, 0),
    live,
    planned: group.tracks.length,
  };
}

export const trackHref = (t: Track) => t.href;

const TRACKS = Object.values(TRACK_COUNTS);
const CAPS = Object.values(CAPSTONE_COUNTS);

export const SITE = {
  /** Pages that are actually written and reachable, lessons + capstones. */
  livePages: [...TRACKS, ...CAPS].reduce((n, k) => n + k.done, 0),
  /** Pages the outlines commit to, including the ones still to write. */
  plannedPages: [...TRACKS, ...CAPS].reduce((n, k) => n + k.total, 0),
  liveTracks: TRACKS.filter((k) => k.done > 0).length,
  completeTracks: TRACKS.filter((k) => k.done >= k.total).length,
  /** Capstones worked all the way to the end. One more (the Lies-of-P field report) is mid-build,
   *  and is deliberately NOT counted here — a field report may ship its methodology before its
   *  results, so "live" would overstate it. */
  completeCapstones: CAPS.filter((k) => k.done >= k.total).length,
};
