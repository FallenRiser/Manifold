import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { KNNBoundaryLab } from "@/components/labs/KNNBoundaryLab";

export const metadata = {
  title: "Decision boundaries — Manifold",
  description:
    "The shape k-NN actually draws. See why the boundary is jagged at k=1 and smooth at large k, why training accuracy lies, and what 'non-parametric' looks like when you can watch it bend.",
};

export default function DecisionBoundariesPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-classification)")}>Classification</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Decision boundaries
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Every classifier is defined by the boundary it can draw between classes. k-NN&rsquo;s is unlike any
        parametric model&rsquo;s — and watching it bend with <em>k</em> is the clearest possible view of the
        bias–variance trade-off.
      </p>

      <div className="lesson">
        <h2>The boundary, made visible</h2>
        <p>
          A decision boundary is the dividing line where the prediction flips from one class to another. To
          see k-NN&rsquo;s, classify <em>every</em> point on a fine grid and colour it by the predicted class —
          the coloured regions <em>are</em> the decision regions, and their border is the boundary. Below,
          do exactly that and slide <em>k</em>:
        </p>
        <KNNBoundaryLab />

        <h2>What you&rsquo;re seeing</h2>
        <ul style={ul}>
          <li>
            <strong>k = 1: jagged and island-pocked.</strong> The boundary is the seam of the Voronoi
            tessellation. Each noisy point owns a little island of its own colour. Maximum flexibility,
            maximum sensitivity to noise — <strong>high variance</strong>.
          </li>
          <li>
            <strong>Large k: smooth and simple.</strong> Averaging many neighbours irons out the wrinkles
            and dissolves the islands. The boundary approaches a clean curve — but pushed too far it ignores
            real structure — <strong>high bias</strong>.
          </li>
          <li>
            <strong>Non-parametric in action.</strong> Notice the boundary can be <em>any</em> shape — it
            curves and wraps freely. No parametric model (logistic regression&rsquo;s straight line, say) can do
            that. This flexibility is k-NN&rsquo;s superpower and its overfitting risk.
          </li>
        </ul>

        <h2>Why training accuracy lies</h2>
        <p>
          Toggle to <em>k</em> = 1 and note training accuracy hits 100%. That&rsquo;s not skill — every point is
          its own nearest neighbour, so 1-NN <em>always</em> labels the training set perfectly while
          carving noise into the boundary. As <em>k</em> rises, training accuracy drops <em>because the
          model stopped memorising</em>. This is the canonical lesson: <strong>training accuracy is no
          guide to k-NN quality</strong>. You must measure on held-out data — which is exactly what the
          choosing-<em>k</em> chapter does.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-classification)", marginBottom: 4 }}>
            The boundary is the bias–variance dial
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Small <em>k</em> → complex boundary → low bias, high variance (overfits). Large <em>k</em> →
            simple boundary → high bias, low variance (underfits). The boundary&rsquo;s <em>complexity</em> is
            literally what <em>k</em> controls, and you can watch it happen above. That makes k-NN the best
            visual intuition pump for bias–variance there is — the very next page formalises it.
          </p>
        </div>

        <h2>Plot a boundary yourself</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-nearest-neighbors/regression-by-averaging" style={navLink}>← Regression by averaging</Link>
          <Link href="/learn/k-nearest-neighbors/the-role-of-k" style={{ ...navLink, fontWeight: 600 }}>Next up · The role of k →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
import matplotlib.pyplot as plt

# classify a grid to draw the decision regions
xx, yy = np.meshgrid(np.linspace(*xlim, 300), np.linspace(*ylim, 300))
grid = np.c_[xx.ravel(), yy.ravel()]

for k in [1, 15]:
    Z = np.array([knn_classify(X_train, y_train, g, k) for g in grid])
    plt.contourf(xx, yy, Z.reshape(xx.shape), alpha=0.3)   # the coloured regions
    plt.scatter(*X_train.T, c=y_train)
    plt.show()`;

const codeLib = `import numpy as np, matplotlib.pyplot as plt
from sklearn.neighbors import KNeighborsClassifier
from sklearn.inspection import DecisionBoundaryDisplay

xx_k = [1, 5, 15, 51]
for k in xx_k:
    knn = KNeighborsClassifier(n_neighbors=k).fit(X_train, y_train)
    DecisionBoundaryDisplay.from_estimator(knn, X_train, alpha=0.3)
    plt.scatter(*X_train.T, c=y_train); plt.title(f"k={k}"); plt.show()`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-classification) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-classification) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
