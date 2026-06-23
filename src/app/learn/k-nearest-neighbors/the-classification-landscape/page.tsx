import Link from "next/link";

export const metadata = {
  title: "The classification landscape — Manifold",
  description:
    "k-NN is your first classifier, so it's worth seeing the map: what classification is, the parametric/non-parametric and lazy/eager splits, and exactly where k-NN sits among the alternatives.",
};

export default function LandscapePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-classification)")}>Classification</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The classification landscape
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-NN is the front door to <strong>classification</strong> — predicting a category rather than a
        number. Before going deep, here&rsquo;s the terrain, and the two axes that explain why k-NN behaves so
        differently from the classifiers you&rsquo;ll meet later.
      </p>

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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-classification)", marginBottom: 4 }}>
            Why this is the ideal first classifier
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            k-NN needs no optimization, no loss function, no gradient — nothing but a distance and a vote.
            That makes the core concepts of classification (decision boundaries, the bias–variance
            trade-off, the role of features) visible in their purest form, before they get tangled up with
            training machinery. Master k-NN and you have a baseline every other classifier must beat.
          </p>
        </div>

        <p>
          Everything hinges on one ingredient we&rsquo;ve so far taken for granted: what &ldquo;nearest&rdquo;
          actually means. That&rsquo;s next.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-nearest-neighbors" style={navLink}>← What is k-NN?</Link>
          <Link href="/learn/k-nearest-neighbors/similarity-and-distance" style={{ ...navLink, fontWeight: 600 }}>Next up · Similarity &amp; distance →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-classification) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-classification) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
