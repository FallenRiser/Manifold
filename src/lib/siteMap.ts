// `partial` = the track is live but its outline is not fully built yet; /map
// must say so rather than present it like a finished track (PROJECT.md §10.5).
export type Track = { title: string; href?: string; partial?: boolean };
export type Group = { name: string; color: string; blurb: string; tracks: Track[] };

export const TIERS = [
  { n: "0", name: "Math Foundations", blurb: "the prerequisites, only when you need them" },
  { n: "1", name: "Intuition", blurb: "see it work — everyone starts here" },
  { n: "2", name: "Practitioner", blurb: "use it well: code, tuning, workflow" },
  { n: "3", name: "Theory", blurb: "why it's guaranteed to work" },
];

export const FAMILIES: Group[] = [
  {
    name: "Regression",
    color: "var(--c-regression)",
    blurb: "Predict a number. The gentlest on-ramp to all of ML.",
    tracks: [
      { title: "Linear regression", href: "/learn/linear-regression" },
      { title: "Ridge, Lasso & Elastic-net", href: "/learn/regularized-regression" },
      { title: "Polynomial & basis-function regression", href: "/learn/polynomial-regression" },
      { title: "Kernel ridge regression", href: "/learn/kernel-ridge-regression" },
      { title: "Support vector regression", href: "/learn/support-vector-regression" },
    ],
  },
  {
    name: "Classification",
    color: "var(--c-classification)",
    blurb: "Predict a category, and learn where the boundary goes.",
    tracks: [
      { title: "Logistic regression", href: "/learn/logistic-regression" },
      { title: "k-Nearest Neighbors", href: "/learn/k-nearest-neighbors" },
      { title: "Naive Bayes" },
      { title: "Support Vector Machines" },
      { title: "Kernel methods" },
      { title: "Perceptron & online classifiers" },
      { title: "Multi-class strategies" },
    ],
  },
  {
    name: "Trees & ensembles",
    color: "var(--c-trees)",
    blurb: "Interpretable splits, then the power of combining many.",
    tracks: [
      { title: "Decision trees", href: "/learn/decision-trees" },
      { title: "Bagging & random forests", href: "/learn/random-forests" },
      { title: "Boosting (AdaBoost, gradient boosting)", href: "/learn/boosting" },
      { title: "Stacking & blending" },
    ],
  },
  {
    name: "Clustering",
    color: "var(--c-clustering)",
    blurb: "Unsupervised learning — find structure when there are no labels at all.",
    tracks: [
      { title: "k-Means (& k-Means++)", href: "/learn/k-means" },
      { title: "Hierarchical clustering" },
      { title: "DBSCAN & density-based" },
      { title: "Gaussian mixtures & EM" },
    ],
  },
  {
    name: "Dimensionality reduction",
    color: "var(--c-dimred)",
    blurb: "Squeeze many features into a few you can see.",
    tracks: [
      { title: "Principal component analysis" },
      { title: "Kernel PCA" },
      { title: "Manifold learning (Isomap, LLE)" },
      { title: "t-SNE & UMAP" },
      { title: "Random projections (Johnson–Lindenstrauss)" },
    ],
  },
  {
    name: "Neural networks",
    color: "var(--c-neural)",
    blurb: "Stack simple units into something that learns features.",
    tracks: [
      { title: "Perceptron → multilayer perceptron" },
      { title: "Backpropagation & training" },
      { title: "Activations, init & normalisation" },
      { title: "Regularisation (dropout, weight decay)" },
    ],
  },
  {
    name: "Reinforcement learning",
    color: "var(--c-rl)",
    blurb: "Learn by acting, from reward instead of labels.",
    tracks: [
      { title: "MDPs, policies & value functions" },
      { title: "Planning (value & policy iteration)" },
      { title: "TD learning, Q-learning, SARSA" },
      { title: "Function approximation" },
    ],
  },
];

export const PILLARS: Group[] = [
  {
    name: "The data workflow",
    color: "var(--c-metrics)",
    blurb: "Given raw data, what do you actually do — step by step?",
    tracks: [
      { title: "California housing capstone", href: "/learn/california-housing-capstone" },
      { title: "Asteroid-hazard capstone", href: "/learn/asteroid-hazard-capstone" },
      { title: "Exploratory data analysis" },
      { title: "Framing & preprocessing" },
      { title: "Baselines & model selection" },
      { title: "Diagnosis & optimization" },
    ],
  },
  {
    name: "Evaluation & metrics",
    color: "var(--c-metrics)",
    blurb: "How do you know it's any good — and which metric matters?",
    tracks: [
      { title: "Confusion matrix & the threshold", href: "/learn/evaluation" },
      { title: "Accuracy, precision, recall, F1", href: "/learn/evaluation/precision-recall-and-f1" },
      { title: "ROC/AUC & precision–recall", href: "/learn/evaluation/roc-auc-and-pr-curves" },
      { title: "Calibration & cost-sensitive thresholds", href: "/learn/evaluation/calibration" },
      { title: "Regression metrics & cross-validation", href: "/learn/evaluation/rmse-vs-mae" },
    ],
  },
  {
    name: "Model selection",
    color: "var(--c-metrics)",
    blurb: "Capacity, overfitting, and choosing among models.",
    tracks: [
      { title: "Estimation vs approximation error" },
      { title: "ERM & structural risk minimization" },
      { title: "Cross-validation" },
      { title: "Regularization as capacity control" },
    ],
  },
];

export const FOUNDATIONS: Group[] = [
  {
    name: "Math foundations",
    color: "var(--c-metrics)",
    blurb: "Tier 0 — short interactive refreshers, linked when needed.",
    tracks: [
      { title: "Linear algebra" },
      { title: "Calculus & convex optimization" },
      { title: "Probability" },
      { title: "Concentration inequalities" },
      { title: "Information theory" },
    ],
  },
  {
    name: "Learning theory",
    color: "var(--c-metrics)",
    blurb: "Tier 3 — the guarantees behind why learning works.",
    tracks: [
      { title: "Generalization: the central question" },
      { title: "The PAC framework" },
      { title: "Rademacher complexity & VC-dimension" },
      { title: "Margin theory" },
      { title: "Algorithmic stability" },
    ],
  },
  {
    name: "Optimization",
    color: "var(--c-fundamentals)",
    blurb: "The engine under almost every model you'll train.",
    tracks: [
      { title: "Gradient descent" },
      { title: "SGD, momentum, Adam" },
      { title: "Convex vs non-convex landscapes" },
      { title: "Coordinate descent" },
    ],
  },
];
