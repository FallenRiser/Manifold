import Link from "next/link";

export const metadata = {
  title: "Cross-validation & bias–variance — Manifold",
  description:
    "How to evaluate models honestly. Train-test splits, k-fold cross validation, and understanding the eternal tradeoff between underfitting and overfitting.",
};

export default function CrossValidationBiasVariancePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--good)")}>Evaluation</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Cross-validation &amp; bias–variance
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Evaluating a model on the data it trained on is like giving a student an
        exam with the exact same questions they practiced. It measures
        memorisation, not learning.
      </p>

      <div className="lesson">
        <h2>The golden rule of ML</h2>
        <p>
          <strong>Never evaluate your model on your training data.</strong>
        </p>
        <p>
          Any sufficiently complex model can achieve zero training error just by
          memorising the noise in the dataset. To know if a model has actually
          learned the underlying pattern (generalisation), you must test it on
          data it has never seen before.
        </p>

        <h2>Train / Test splits</h2>
        <p>
          The simplest approach is to randomly split your data. Keep 80% for
          training the model, and lock the remaining 20% in a vault. Fit the
          model on the 80%, then predict on the 20% and calculate your RMSE.
        </p>
        <p>
          This is good, but has a flaw: what if you got "lucky" (or unlucky)
          with the random split? What if all the hardest examples ended up in
          the test set?
        </p>

        <h2>k-Fold Cross Validation</h2>
        <p>
          To eliminate the luck of the draw, we use k-Fold Cross Validation.
        </p>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", margin: "1.2rem 0" }}>
          <ol style={{ paddingLeft: "1.4em", margin: 0, lineHeight: 1.85, color: "var(--muted)", fontSize: 14.5 }}>
            <li>Shuffle the dataset and split it into <em>k</em> equal chunks (folds). <span style={{ color: "var(--ink)", fontWeight: 500 }}>(k=5 is standard)</span>.</li>
            <li>Train the model on folds 2, 3, 4, and 5. Test it on fold 1. Record the RMSE.</li>
            <li>Train the model on folds 1, 3, 4, and 5. Test it on fold 2. Record the RMSE.</li>
            <li>Repeat until every fold has been used as the test set exactly once.</li>
            <li>Average the <em>k</em> different RMSE scores.</li>
          </ol>
        </div>
        <p>
          This gives you a much more robust estimate of how your model will
          perform in the real world, because every single data point gets to be
          in the test set once.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "2.5rem 0" }} />

        <h2>The Bias-Variance Tradeoff</h2>
        <p>
          When you evaluate your models via cross-validation, you'll discover
          they fail in one of two distinct ways.
        </p>

        <div style={bvGrid}>
          <BVCard title="High Bias (Underfitting)" color="var(--c-regression)"
            body="The model is too simple. It cannot capture the true pattern in the data (like fitting a straight line to a curve). It performs poorly on the training set AND poorly on the test set." />
          <BVCard title="High Variance (Overfitting)" color="var(--warn)"
            body="The model is too complex. It memorises the training data, including the random noise (like a degree-15 polynomial). It performs perfectly on the training set, but terribly on the test set." />
        </div>

        <p>
          It's called a <strong>tradeoff</strong> because as you increase model
          complexity (e.g., adding polynomial features or interaction terms),
          bias goes down, but variance goes up.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The sweet spot
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The goal of machine learning is to find the exact level of
            complexity where the test error reaches its minimum. This is the
            U-shaped curve: as complexity increases, test error falls (as bias
            is reduced), hits a minimum, and then rises again (as variance takes
            over). You find this sweet spot using cross-validation.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/rmse-vs-mae" style={navLink}>← RMSE vs MAE</Link>
          <Link href="/learn/linear-regression/transformations" style={navLink}>Next up · Transformations →</Link>
        </div>
      </div>
    </article>
  );
}

function BVCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, padding: "12px 16px", background: `color-mix(in srgb, ${color} 4%, var(--surface-2))` }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const bvGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.6rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
