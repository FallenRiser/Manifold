import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track, parity with Linear Regression: Tiers 1–3, from intuition
// through algorithm, initialization, choosing k, evaluation, failure modes,
// variants, theory, and a multi-case capstone. Pages with an href are built;
// the rest are the planned roadmap (shown greyed in the sidebar).
export const KM_TRACK: TrackChapter[] = [
  {
    title: "The problem & the intuition",
    pages: [
      { title: "What is clustering?", href: "/learn/k-means" },
      { title: "The unsupervised landscape", href: "/learn/k-means/the-unsupervised-landscape" },
      { title: "Similarity & distance", href: "/learn/k-means/similarity-and-distance" },
      { title: "Distance metrics in depth", href: "/learn/k-means/distance-metrics-in-depth" },
      { title: "The curse of dimensionality", href: "/learn/k-means/the-curse-of-dimensionality" },
    ],
  },
  {
    title: "The k-means idea",
    pages: [
      { title: "The k-means idea", href: "/learn/k-means/the-k-means-idea" },
      { title: "The objective: inertia", href: "/learn/k-means/the-objective-inertia" },
      { title: "Hard assignment & Voronoi cells", href: "/learn/k-means/hard-assignment-and-voronoi" },
    ],
  },
  {
    title: "The algorithm",
    pages: [
      { title: "Assign & update (Lloyd's)", href: "/learn/k-means/assign-and-update" },
      { title: "Why it converges", href: "/learn/k-means/why-it-converges" },
      { title: "Computational complexity", href: "/learn/k-means/computational-complexity" },
      { title: "Empty clusters & edge cases", href: "/learn/k-means/empty-clusters-and-edge-cases" },
      { title: "Accelerated k-means (Elkan)", href: "/learn/k-means/accelerated-elkan" },
      { title: "Mini-batch k-means", href: "/learn/k-means/mini-batch" },
    ],
  },
  {
    title: "Initialization",
    pages: [
      { title: "The initialization problem", href: "/learn/k-means/the-initialization-problem" },
      { title: "Random restarts", href: "/learn/k-means/random-restarts" },
      { title: "k-means++", href: "/learn/k-means/k-means-plus-plus" },
    ],
  },
  {
    title: "Choosing k",
    pages: [
      { title: "The elbow method", href: "/learn/k-means/the-elbow-method" },
      { title: "Silhouette analysis", href: "/learn/k-means/silhouette-analysis" },
      { title: "The gap statistic", href: "/learn/k-means/the-gap-statistic" },
      { title: "Information criteria (X-means)", href: "/learn/k-means/information-criteria-x-means" },
    ],
  },
  {
    title: "Evaluating clusters",
    pages: [
      { title: "Internal metrics", href: "/learn/k-means/internal-metrics" },
      { title: "External metrics (ARI, NMI)", href: "/learn/k-means/external-metrics" },
      { title: "Cluster stability", href: "/learn/k-means/cluster-stability" },
    ],
  },
  {
    title: "Preprocessing & practicalities",
    pages: [
      { title: "Why scaling matters", href: "/learn/k-means/why-scaling-matters" },
      { title: "Outliers & robustness", href: "/learn/k-means/outliers-and-robustness" },
      { title: "Categorical & mixed data", href: "/learn/k-means/categorical-and-mixed-data" },
      { title: "Clustering after dimensionality reduction", href: "/learn/k-means/clustering-after-dimensionality-reduction" },
    ],
  },
  {
    title: "When k-means fails",
    pages: [
      { title: "Non-spherical clusters", href: "/learn/k-means/non-spherical-clusters" },
      { title: "Unequal sizes & densities", href: "/learn/k-means/unequal-sizes-and-densities" },
      { title: "The failure-mode gallery", href: "/learn/k-means/the-failure-mode-gallery" },
      { title: "k-means vs DBSCAN, GMM, hierarchical", href: "/learn/k-means/vs-dbscan-gmm-hierarchical" },
    ],
  },
  {
    title: "Variants & the bigger family",
    pages: [
      { title: "k-medoids (PAM)", href: "/learn/k-means/k-medoids" },
      { title: "k-medians & k-modes", href: "/learn/k-means/k-medians-and-k-modes" },
      { title: "Fuzzy c-means (soft assignment)", href: "/learn/k-means/fuzzy-c-means" },
      { title: "Kernel & spherical k-means", href: "/learn/k-means/kernel-and-spherical" },
      { title: "Bisecting k-means", href: "/learn/k-means/bisecting-k-means" },
      { title: "k-means as EM (link to GMM)", href: "/learn/k-means/k-means-as-em" },
    ],
  },
  {
    title: "Theory · go deeper",
    pages: [
      { title: "NP-hardness of optimal clustering", href: "/learn/k-means/np-hardness" },
      { title: "Convergence as coordinate descent", href: "/learn/k-means/coordinate-descent" },
      { title: "Bregman divergences", href: "/learn/k-means/bregman-divergences" },
    ],
  },
  {
    title: "In the wild",
    pages: [
      { title: "When to use k-means", href: "/learn/k-means/when-to-use-k-means" },
      { title: "Case A: image colour quantization", href: "/learn/k-means/case-image-quantization" },
      { title: "Case B: customer segmentation", href: "/learn/k-means/case-customer-segmentation" },
      { title: "Case C: clustering embeddings", href: "/learn/k-means/case-clustering-embeddings" },
    ],
  },
];

export const KM_TOTAL = KM_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const KM_DONE = KM_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
