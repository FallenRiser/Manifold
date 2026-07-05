import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

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
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>Overfitting & the bias–variance tradeoff</>}
        intro={<>
          Regularization is the bias–variance tradeoff made adjustable. To see <em>why</em> a penalty helps,
        you have to see what overfitting actually is — too much variance — and what the penalty trades for
        it.
        </>}
      />

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

        <Callout color="var(--c-regression)" title={<>λ is the bias–variance dial</>}>
          Read the whole track through this lens. <M>{String.raw`\lambda = 0`}</M> is pure OLS: minimum bias,
            maximum variance (the left edge). <M>{String.raw`\lambda \to \infty`}</M> shrinks every coefficient
            to zero: maximum bias, zero variance (a flat line). Every value in between is a different point on
            the curve. Choosing λ <em>is</em> choosing where to sit on the bias–variance tradeoff.
        </Callout>

        <h2>Measure the U-curve yourself</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression", label: <>← Why regularize?</> }} next={{ href: "/learn/regularized-regression/shrinkage-the-core-idea", label: <>Next up · Shrinkage: the core idea →</> }} />
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


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


