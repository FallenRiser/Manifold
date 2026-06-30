import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CoefPathLab } from "@/components/labs/CoefPathLab";

export const metadata = {
  title: "The regularization path — Manifold",
  description:
    "As λ shrinks from large to small, Lasso admits features one at a time. That sequence — the regularization path — is piecewise linear, free to compute in full, and a built-in ranking of feature importance.",
};

export default function PathPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The regularization path
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        For Lasso the coefficient path isn&rsquo;t just a diagnostic — it&rsquo;s a story. As the penalty relaxes,
        features switch on one at a time, and the order they appear is a free ranking of their importance.
      </p>

      <div className="lesson">
        <h2>Features enter one at a time</h2>
        <p>
          Start with <M>{""}</M>λ so large that every coefficient is zero (the empty model). Now lower λ. At
          some threshold the single most useful feature&rsquo;s coefficient lifts off zero. Lower it more, and a
          second feature enters, then a third. At <M>{""}</M>λ = 0 you&rsquo;re back to full OLS with every feature
          active. The Lasso path traces this whole journey from empty to full.
        </p>
        <p>
          The order of entry matters: the first features to appear are the ones the data finds most useful,
          giving you an <strong>importance ranking</strong> as a side effect of fitting. And the path is{" "}
          <strong>piecewise linear</strong> — each coefficient moves in straight-line segments, bending only
          at the λ values where a feature enters or leaves — which is what makes it so cheap to compute exactly.
        </p>

        <h2>See the difference from ridge</h2>
        <p>
          Switch the lab to <strong>Lasso</strong> and slide λ from left (strong) to right (weak). Watch
          coefficients leave zero one by one and the &ldquo;nonzero&rdquo; count climb. Then flip to{" "}
          <strong>Ridge</strong>: every coefficient is nonzero at every λ — there&rsquo;s no entry sequence, because
          nothing is ever exactly off.
        </p>
        <CoefPathLab />

        <h2>The whole path for the price of one fit</h2>
        <p>
          You might expect computing the path to mean refitting at hundreds of λ values. It&rsquo;s far cheaper:
        </p>
        <ul style={ul}>
          <li>
            <strong>LARS</strong> (Least Angle Regression) computes the exact piecewise-linear path directly,
            jumping between the &ldquo;knots&rdquo; where the active set changes — the full path for roughly the cost of
            one least-squares fit.
          </li>
          <li>
            <strong>Coordinate descent with warm starts</strong> solves along a λ grid, each fit initialised
            from the previous one, so each step converges almost instantly. This is scikit-learn&rsquo;s default.
          </li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            The path is how you choose λ
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Overlay cross-validation error along the path and the best λ is the point with lowest CV error —
            which also tells you exactly which features that model keeps. The path turns &ldquo;pick λ&rdquo; and &ldquo;pick
            features&rdquo; into a single, visual decision. The one-standard-error rule often nudges you to a
            slightly larger λ — a sparser, more robust model just inside the noise of the minimum.
          </p>
        </div>

        <h2>Compute the full path</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/why-l1-creates-sparsity" style={navLink}>← Why L1 creates sparsity</Link>
          <Link href="/learn/regularized-regression/lasso-for-feature-selection" style={{ ...navLink, fontWeight: 600 }}>Next up · Lasso for feature selection →</Link>
        </div>
      </div>
    </article>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontStyle: "italic" }}>{children}</span>;
}

const codeScratch = `import numpy as np
from sklearn.linear_model import lars_path

# LARS returns the exact piecewise-linear Lasso path: the λ knots and coefficients
alphas, _, coefs = lars_path(X, y, method="lasso")
# coefs has shape (n_features, n_knots); each column is the model at one knot.
# the order features first become nonzero = their importance ranking
order = [np.nonzero(coefs[:, k])[0] for k in range(coefs.shape[1])]`;

const codeLib = `import numpy as np
from sklearn.linear_model import lasso_path

# coordinate descent along a λ grid (high → low), with warm starts
alphas, coefs, _ = lasso_path(X, y, n_alphas=100)

import matplotlib.pyplot as plt
plt.plot(np.log10(alphas), coefs.T)
plt.xlabel("log10(λ)"); plt.ylabel("coefficient")   # the path figure
plt.show()`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
