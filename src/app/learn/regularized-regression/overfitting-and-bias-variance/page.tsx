import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Overfitting & the bias–variance tradeoff — Manifold",
  description:
    "Regularization is bias–variance control with a dial. Adding a penalty deliberately introduces bias to slash variance — and on noisy data that trade lowers total error.",
};

// bias↑ and variance↓ as λ grows; total error is U-shaped. illustrative.
const LAMS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const VAR = [0.9, 0.62, 0.44, 0.32, 0.24, 0.19, 0.16, 0.14, 0.13];
const BIAS = [0.04, 0.06, 0.1, 0.16, 0.24, 0.34, 0.46, 0.6, 0.76];
const TOT = VAR.map((v, i) => v + BIAS[i]);
const W = 330, H = 180, padL = 30, padB = 26, padT = 12;
const gx = (i: number) => Math.round((padL + (i / (LAMS.length - 1)) * (W - padL - 12)) * 100) / 100;
const gy = (v: number) => Math.round((padT + (1 - v / 1.0) * (H - padT - padB)) * 100) / 100;
const bestI = TOT.indexOf(Math.min(...TOT));

export default function BiasVariancePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Overfitting & the bias–variance tradeoff
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Regularization is the bias–variance tradeoff made adjustable. To see <em>why</em> a penalty helps,
        you have to see what overfitting actually is — too much variance — and what the penalty trades for
        it.
      </p>

      <div className="lesson">
        <h2>Error splits into two parts</h2>
        <p>
          A model&rsquo;s expected error on new data decomposes into three pieces:
        </p>
        <div style={{ textAlign: "center", margin: "0.4rem 0 1rem" }}>
          <M>{String.raw`\text{Error} = \text{Bias}^2 + \text{Variance} + \text{irreducible noise}`}</M>
        </div>
        <ul style={ul}>
          <li><strong>Bias</strong> — error from the model being too rigid to capture the truth (underfitting).</li>
          <li><strong>Variance</strong> — error from the model being so flexible it chases the particular noise in <em>this</em> training set (overfitting).</li>
          <li><strong>Noise</strong> — irreducible; no model can beat it.</li>
        </ul>
        <p>
          You can&rsquo;t kill both bias and variance at once — pushing one down tends to raise the other. The art
          is finding the balance that minimises their sum.
        </p>

        <h2>Overfitting is a variance problem</h2>
        <p>
          When OLS overfits — those wild degree-9 wiggles from the last page — it has <strong>low bias but
          enormous variance</strong>. The coefficients are huge, so a tiny change in the data swings the
          fitted curve dramatically. High variance shows up as large coefficients, and that&rsquo;s precisely
          what the penalty attacks.
        </p>

        <h2>Regularization buys variance with bias</h2>
        <p>
          Shrinking the coefficients makes the model less flexible. That <em>adds</em> a little bias (the fit
          can no longer reach every point) but <em>removes</em> a lot of variance (it stops chasing noise).
          On noisy or high-dimensional data, that trade is a bargain — total error drops.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={VAR.map((v, i) => `${gx(i)},${gy(v)}`).join(" ")} fill="none" stroke="var(--c-classification)" strokeWidth={2} />
            <polyline points={BIAS.map((v, i) => `${gx(i)},${gy(v)}`).join(" ")} fill="none" stroke="var(--c-trees)" strokeWidth={2} />
            <polyline points={TOT.map((v, i) => `${gx(i)},${gy(v)}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2.6} />
            <line x1={gx(bestI)} y1={padT} x2={gx(bestI)} y2={H - padB} stroke="var(--good)" strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
            <text x={gx(bestI)} y={padT + 8} fontSize={9} fill="var(--good)" textAnchor="middle">best λ</text>
            <text x={gx(8)} y={gy(VAR[8]) - 4} fontSize={8.5} fill="var(--c-classification)" textAnchor="end">variance</text>
            <text x={gx(8)} y={gy(BIAS[8]) - 4} fontSize={8.5} fill="var(--c-trees)" textAnchor="end">bias²</text>
            <text x={gx(1)} y={gy(TOT[1]) - 5} fontSize={8.5} fill="var(--c-regression)">total</text>
            <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">penalty strength λ →</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            As λ rises, variance falls and bias² climbs. Their sum — the total test error — is U-shaped, with
            a sweet spot at an intermediate λ. That minimum is what cross-validation hunts for.
          </div>
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            λ is the bias–variance dial
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Read the whole track through this lens. <M>{String.raw`\lambda = 0`}</M> is pure OLS: minimum bias,
            maximum variance (the left edge). <M>{String.raw`\lambda \to \infty`}</M> shrinks every coefficient
            to zero: maximum bias, zero variance (a flat line). Every value in between is a different point on
            the curve. Choosing λ <em>is</em> choosing where to sit on the bias–variance tradeoff.
          </p>
        </div>

        <h2>Measure the U-curve yourself</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression" style={navLink}>← Why regularize?</Link>
          <Link href="/learn/regularized-regression/shrinkage-the-core-idea" style={{ ...navLink, fontWeight: 600 }}>Next up · Shrinkage: the core idea →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import cross_val_score

# trace test error as λ grows: it falls, bottoms out, then rises (the U-curve)
for lam in [0, 0.01, 0.1, 1, 10, 100, 1000]:
    mse = -cross_val_score(Ridge(alpha=lam), X, y,
                           scoring="neg_mean_squared_error", cv=5).mean()
    print(f"λ={lam:>7}:  CV MSE = {mse:.3f}")`;

const codeLib = `import numpy as np
from sklearn.linear_model import RidgeCV

# RidgeCV finds the λ at the bottom of the U-curve automatically
alphas = np.logspace(-3, 3, 50)
model = RidgeCV(alphas=alphas, scoring="neg_mean_squared_error", cv=5).fit(X, y)
print("best λ:", model.alpha_)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
