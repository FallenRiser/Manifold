import Link from "next/link";
import { MulticollinearityLab } from "@/components/labs/MulticollinearityLab";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np

# x3 is almost exactly x1 + x2 -> severe collinearity
rng = np.random.default_rng(0)
x1 = rng.normal(size=200)
x2 = rng.normal(size=200)
x3 = x1 + x2 + rng.normal(scale=0.01, size=200)
X  = np.column_stack([x1, x2, x3])

def vif(X, j):
    y = X[:, j]                          # regress feature j on the others
    others = np.delete(X, j, axis=1)
    A = np.column_stack([np.ones(len(y)), others])
    beta, *_ = np.linalg.lstsq(A, y, rcond=None)
    r2 = 1 - np.sum((y - A @ beta)**2) / np.sum((y - y.mean())**2)
    return 1 / (1 - r2)

for j in range(X.shape[1]):
    print(f"VIF x{j+1}: {vif(X, j):6.1f}")   # >10 == severe`;

const codeLib = `import numpy as np
from statsmodels.stats.outliers_influence import variance_inflation_factor

rng = np.random.default_rng(0)
x1 = rng.normal(size=200); x2 = rng.normal(size=200)
x3 = x1 + x2 + rng.normal(scale=0.01, size=200)
X  = np.column_stack([x1, x2, x3])

for j in range(X.shape[1]):
    print(f"VIF x{j+1}: {variance_inflation_factor(X, j):6.1f}")`;

export const metadata = {
  title: "Multicollinearity — Manifold",
  description:
    "When features are highly correlated, the model can't tell which one deserves the credit. Coefficients become unstable, standard errors explode, and interpretation breaks down.",
};

export default function MulticollinearityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--warn)")}>Assumptions</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Multicollinearity
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        A coefficient tells you the effect of feature A <em>holding feature B
        constant</em>. But if A and B always move together, you can't hold one
        constant while changing the other. The math panics.
      </p>

      <Backlinks label="Related" items={[
        { label: "Regularization", href: "/learn/linear-regression/regularization" },
        { label: "Feature scaling", href: "/learn/linear-regression/feature-scaling" },
        { label: "Multiple linear regression", href: "/learn/linear-regression/multiple-linear-regression" },
      ]} />

      <div className="lesson">
        <h2>The intuition</h2>
        <p>
          Imagine trying to determine whether a person's left leg or right leg
          is more responsible for their walking speed. You measure the length of
          both legs for 100 people and fit a regression. Because left and right
          legs are almost perfectly correlated, the model can't isolate their
          individual effects. It might assign a huge positive coefficient to the
          left leg and a huge negative one to the right leg — canceling each
          other out to arrive at the correct overall prediction.
        </p>
        <p>
          This is <strong>multicollinearity</strong>. The model still predicts
          well overall, but the individual coefficients become meaningless.
        </p>

        <h2>Perfect vs partial multicollinearity</h2>
        <div style={typeGrid}>
          <TypeCard title="Perfect collinearity" color="var(--bad)"
            body="One feature is an exact linear combination of others (e.g., Temp in Celsius and Temp in Fahrenheit, or the dummy variable trap). XᵀX is strictly non-invertible. The normal equation has no unique solution; software will either crash or silently drop a column." />
          <TypeCard title="High (partial) collinearity" color="var(--warn)"
            body="Features are highly but not perfectly correlated (e.g., Square Footage and Number of Bedrooms). XᵀX is invertible, but just barely. The solution exists but is hyper-sensitive to tiny changes in the data." />
        </div>

        <h2>The symptoms</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Bouncing coefficients.</strong> Add or remove a few rows of data, and a coefficient swings wildly, even flipping from positive to negative.</li>
          <li><strong style={{ color: "var(--ink)" }}>Exploding standard errors.</strong> The model is deeply uncertain about the coefficients. You might have an R² of 0.90 but no individual predictor is statistically significant.</li>
          <li><strong style={{ color: "var(--ink)" }}>Wrong signs.</strong> A feature you know is positively related to the outcome (like square footage to house price) gets a negative coefficient.</li>
        </ul>

        <h2>How to detect it</h2>
        <p>
          Don't just look at pairwise correlations — three features might be
          highly collinear even if no two of them are. The gold standard is the
          <strong> Variance Inflation Factor (VIF)</strong>.
        </p>
        <div style={vifBox}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", marginBottom: 6 }}>The VIF for feature j</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>VIFⱼ = 1 / (1 − R²ⱼ)</div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
            Where R²ⱼ is the R² from regressing feature j on <em>all other
            features</em>. If it can be almost perfectly predicted by the others
            (R² &gt; 0.9), the VIF blows up to 10.
            <br/><br/>
            <strong>Rule of thumb:</strong> VIF &lt; 5 is fine. VIF &gt; 10 indicates severe multicollinearity.
          </p>
        </div>

        <MulticollinearityLab />

        <h2>How to fix it</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, margin: "1.4rem 0" }}>
          <FixRow n="1" title="Do nothing (if you only care about prediction)"
            body="If your only goal is to predict y, multicollinearity doesn't hurt you. The predictions are stable; only the coefficients are wild." />
          <FixRow n="2" title="Drop redundant features"
            body="If two features measure the same underlying thing (like highly correlated survey questions), just drop one. The model won't lose much information." />
          <FixRow n="3" title="Combine features"
            body="Average the correlated features into a single index, or use Principal Component Analysis (PCA) to extract uncorrelated orthogonal components." />
          <FixRow n="4" title="Use Regularisation (Ridge)"
            body="Ridge regression (L2 regularisation) adds a penalty for large coefficients. It acts like a rubber band, pulling the wild, opposing coefficients back to zero and stabilising the model." />
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The overarching lesson of assumptions
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Every assumption tells you something about how the model works.
            Linearity ensures the shape is right. Independence ensures your sample
            size isn't lying to you. Homoscedasticity and normality ensure your
            uncertainty bands are honest. Multicollinearity ensures your model
            can actually distinguish the effects it claims to be measuring.
          </p>
        </div>

        <h2>Compute it yourself</h2>
        <p>
          VIF is just &ldquo;regress each feature on all the others and see how well
          it&rsquo;s predicted.&rdquo; From scratch with a least-squares solve, then the
          one-liner in statsmodels:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/normality-of-residuals" style={navLink}>← Normality of residuals</Link>
          <Link href="/learn/linear-regression/residual-vs-fitted" style={navLink}>Next up · Residual-vs-fitted →</Link>
        </div>
      </div>
    </article>
  );
}

function TypeCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 5%, var(--surface-2))`, border: `1px solid color-mix(in srgb, ${color} 20%, var(--border))`, borderRadius: 12, padding: "13px 15px" }}>
      <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function FixRow({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}>{n}</div>
      <div>
        <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
      </div>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const typeGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "1.4rem 0" };
const vifBox: React.CSSProperties = { background: "color-mix(in srgb, var(--brand) 6%, var(--surface-2))", border: "1px solid color-mix(in srgb, var(--brand) 20%, var(--border))", borderRadius: 12, padding: "14px 18px", margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
