import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The classification landscape — Manifold",
  description:
    "k-NN is your first classifier, so it's worth seeing the map: what classification is, the parametric/non-parametric and lazy/eager splits, and exactly where k-NN sits among the alternatives.",
};

export default function LandscapePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }]}
        time="about 5 minutes"
        title={<>The classification landscape</>}
        intro={<>
          k-NN is the front door to <strong>classification</strong> — predicting a category rather than a
        number. Before going deep, here&rsquo;s the terrain, and the two axes that explain why k-NN behaves so
        differently from the classifiers you&rsquo;ll meet later.
        </>}
      />

      <div className="lesson">
        <h2>What classification is</h2>
        <p>
          Like regression, classification is <strong>supervised</strong> — you learn from labelled
          examples. The difference is the target: regression predicts a continuous number (a price, a
          temperature), classification predicts a <strong>discrete class</strong> (spam / not-spam, which
          digit, which species). The model carves the feature space into <strong>decision regions</strong>,
          one per class, separated by <strong>decision boundaries</strong> — and almost every classifier
          differs only in the <em>shape</em> of boundary it can draw.
        </p>

        <h2>Axis 1 — parametric vs. non-parametric</h2>
        <ul style={ul}>
          <li>
            <strong>Parametric</strong> models (logistic regression, naive Bayes) commit to a fixed-shape
            boundary with a fixed number of parameters. Logistic regression can only draw a straight line,
            no matter how much data you give it. Compact and fast, but limited.
          </li>
          <li>
            <strong>Non-parametric</strong> models (k-NN, decision trees) let the boundary&rsquo;s complexity
            grow with the data — they make no assumption about its shape and can fit anything. More flexible,
            but hungrier for data and prone to overfitting. <strong>k-NN is the archetypal non-parametric
            classifier.</strong>
          </li>
        </ul>

        <h2>Axis 2 — lazy vs. eager</h2>
        <ul style={ul}>
          <li>
            <strong>Eager</strong> learners do the work up front: they train a model, then discard the data
            and predict quickly (logistic regression, SVMs, neural nets).
          </li>
          <li>
            <strong>Lazy</strong> learners (k-NN) skip training entirely and defer all work to prediction
            time, consulting the stored data for each query. Instant to &ldquo;train,&rdquo; slow to predict.
          </li>
        </ul>

        <h2>Where k-NN sits</h2>
        <p>
          k-NN is the <strong>non-parametric, lazy, instance-based</strong> corner of the map — about as far
          as you can get from a parametric eager model like logistic regression. That positioning is its
          whole personality: maximally flexible boundaries, zero training cost, but heavy prediction cost
          and total reliance on a good distance measure. Seeing it at this extreme makes every other
          classifier easier to place by contrast.
        </p>

        <Callout color="var(--c-classification)" title={<>Why this is the ideal first classifier</>}>
          k-NN needs no optimization, no loss function, no gradient — nothing but a distance and a vote.
            That makes the core concepts of classification (decision boundaries, the bias–variance
            trade-off, the role of features) visible in their purest form, before they get tangled up with
            training machinery. Master k-NN and you have a baseline every other classifier must beat.
        </Callout>

        <p>
          Everything hinges on one ingredient we&rsquo;ve so far taken for granted: what &ldquo;nearest&rdquo;
          actually means. That&rsquo;s next.
        </p>

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors", label: <>← What is k-NN?</> }} next={{ href: "/learn/k-nearest-neighbors/similarity-and-distance", label: <>Next up · Similarity &amp; distance →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
