import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Principal Component Analysis — the flagship track of
// the Dimensionality Reduction family (accent riso violet --c-dimred). PCA is
// the gateway to the whole family: the linear, closed-form, eigenvector method
// that every later method (kernel PCA, manifold learning, t-SNE/UMAP) either
// generalises or reacts against.
//
// The arc: the projection idea (maximise variance) -> the machinery (centering,
// covariance, eigenvectors, projection, reconstruction) -> how many components
// (scree, choosing k, standardising) -> the SVD view and low-rank optimality ->
// theory (the variance/reconstruction duality, Rayleigh quotient, whitening) ->
// reading & limits (loadings, when it fails, vs alternatives) -> two real cases.
// Pages with an href are built.
export const PCA_TRACK: TrackChapter[] = [
  {
    title: "Seeing in fewer dimensions",
    tier: 1,
    pages: [
      { title: "Fewer dimensions, same story", href: "/learn/pca" },
      { title: "Why reduce dimensions at all?", href: "/learn/pca/why-reduce" },
      { title: "The direction of most spread", href: "/learn/pca/maximize-variance" },
    ],
  },
  {
    title: "The machinery",
    tier: 2,
    pages: [
      { title: "Centering & the covariance matrix", href: "/learn/pca/centering-and-covariance" },
      { title: "Eigenvectors: the axes of the cloud", href: "/learn/pca/eigenvectors" },
      { title: "Projection & the new coordinates", href: "/learn/pca/projection-and-scores" },
      { title: "Reconstruction & what you drop", href: "/learn/pca/reconstruction" },
    ],
  },
  {
    title: "How many components?",
    tier: 2,
    pages: [
      { title: "The scree plot & explained variance", href: "/learn/pca/scree-and-explained-variance" },
      { title: "Choosing k in practice", href: "/learn/pca/choosing-k" },
      { title: "Standardize before you PCA", href: "/learn/pca/standardize-first" },
    ],
  },
  {
    title: "PCA, the SVD & compression",
    tier: 2,
    pages: [
      { title: "PCA through the SVD", href: "/learn/pca/svd" },
      { title: "The best low-rank approximation", href: "/learn/pca/low-rank-approximation" },
      { title: "PCA is a linear autoencoder", href: "/learn/pca/linear-autoencoder" },
    ],
  },
  {
    title: "Theory · go deeper",
    tier: 3,
    pages: [
      { title: "Two objectives, one answer", href: "/learn/pca/two-objectives" },
      { title: "The Rayleigh quotient & why eigenvectors", href: "/learn/pca/rayleigh-and-eigen" },
      { title: "Computing the components: power iteration", href: "/learn/pca/computing-the-components" },
      { title: "Whitening & decorrelation", href: "/learn/pca/whitening" },
    ],
  },
  {
    title: "Reading it & its limits",
    tier: 2,
    pages: [
      { title: "Reading components: loadings & biplots", href: "/learn/pca/interpreting-loadings" },
      { title: "When PCA fails", href: "/learn/pca/when-pca-fails" },
      { title: "PCA vs LDA, t-SNE & autoencoders", href: "/learn/pca/vs-alternatives" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "Case: compressing handwritten digits", href: "/learn/pca/case-digits" },
      { title: "Case: PCA as preprocessing", href: "/learn/pca/case-preprocessing" },
    ],
  },
];

export const PCA_TOTAL = PCA_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const PCA_DONE = PCA_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
