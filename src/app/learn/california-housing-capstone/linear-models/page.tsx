import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Capstone: baseline & regularized models — Manifold",
  description:
    "Building from a trivial mean baseline up to OLS, ridge, lasso, and elastic-net with honest cross-validation — and the instructive result that with 16k rows and 10 features, regularization ties OLS.",
};

const MODELS = [
  { name: "Baseline (mean)", rmse: 1.156 },
  { name: "OLS", rmse: 0.662 },
  { name: "Ridge", rmse: 0.662 },
  { name: "Lasso", rmse: 0.662 },
  { name: "Elastic-net", rmse: 0.662 },
];

function BarFig() {
  const W = 340, H = 150, padL = 96, padR = 28, padT = 8, padB = 8;
  const max = 1.2, rowH = (H - padT - padB) / MODELS.length;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {MODELS.map((m, i) => {
        const y = padT + i * rowH, base = i === 0;
        return (
          <g key={m.name}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8.5} fill="var(--muted)" textAnchor="end">{m.name}</text>
            <rect x={padL} y={Math.round((y + 3) * 100) / 100} width={Math.round((bx(m.rmse) - padL) * 100) / 100} height={Math.round((rowH - 6) * 100) / 100} fill={base ? "var(--faint)" : "var(--c-regression)"} fillOpacity={base ? 0.5 : 0.78} rx={1.5} />
            <text x={bx(m.rmse) + 4} y={y + rowH / 2 + 2} fontSize={8} fill="var(--muted)">{m.rmse.toFixed(3)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function LinearModelsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>3 · The linear baseline</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 9 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Baseline & regularized models
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Now we model — from the bottom up, with honest validation. The result is more instructive than a
        triumphant one would be: on this data, regularization <em>ties</em> plain OLS, and understanding why is
        the real lesson.
      </p>

      <div className="lesson">
        <h2>Always start with a baseline</h2>
        <p>
          Before any real model, the dumbest one: predict the mean price for every block. Its RMSE equals the
          target&rsquo;s standard deviation, <strong>1.156</strong> — the number every later model must beat, and the
          thing that turns &ldquo;R² = 0.67&rdquo; into the concrete &ldquo;we cut baseline error by ~43%.&rdquo;
        </p>

        <h2>The comparison</h2>
        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`5-fold CV  (RMSE in $100k, R2)
  Baseline (mean)    RMSE 1.156   R2 0.000
  OLS                RMSE 0.662   R2 0.672
  Ridge   (λ≈10)     RMSE 0.662   R2 0.672
  Lasso   (λ≈0.001)  RMSE 0.662   R2 0.672   kept 10/10 features
  ElasticNet (α=0.9) RMSE 0.662   R2 0.672`}</CodeOutput>
        <div style={figWrap}>
          <BarFig />
          <div style={cap}>OLS crushes the mean baseline (1.156 → 0.662, R² 0.672) — but ridge, lasso, and
            elastic-net all land at the same 0.662. Regularization neither helps nor hurts the score here.</div>
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Why regularization didn&rsquo;t boost accuracy — and why that&rsquo;s the right outcome
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Regularization fights overfitting, and here there&rsquo;s almost none to fight:{" "}
            <strong>16,512 rows, only 10 features</strong> (n ≫ p). OLS has ample data to pin down ten
            coefficients, so its variance is already low and a penalty has little to remove. The tells confirm
            it: lasso chose a near-zero λ and kept all 10 features (nothing is redundant enough to drop), and
            ridge&rsquo;s λ buys stability without moving the score. The honest lesson —{" "}
            <strong>regularization is insurance, not a free accuracy boost</strong>. Its premium is still worth
            paying here for what it does deliver: stable, interpretable coefficients despite the multicollinearity
            (VIF up to 13.9 from the engineered features).
          </p>
        </div>

        <h2>Which linear model do we keep?</h2>
        <p>
          Since the scores tie, we choose on the other criteria. <strong>Ridge</strong> is the pick: it matches
          OLS&rsquo;s accuracy while taming the collinear room-count coefficients into stable, interpretable values. We&rsquo;d
          take plain OLS only to avoid a hyperparameter, and lasso only for a shorter feature list the data says
          we don&rsquo;t need. We carry ridge forward as our baseline — and the next page reads what it actually learned,
          and where it falls short.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/preprocessing" style={navLink}>← Preprocessing pipeline</Link>
          <Link href="/learn/california-housing-capstone/diagnostics" style={{ ...navLink, fontWeight: 600 }}>Next up · Diagnostics: what it misses →</Link>
        </div>
      </div>
    </article>
  );
}

const code = `import numpy as np
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression, RidgeCV, LassoCV, ElasticNetCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_predict, KFold
from sklearn.metrics import mean_squared_error, r2_score

cv = KFold(5, shuffle=True, random_state=0)
def evaluate(est):
    pred = cross_val_predict(make_pipeline(StandardScaler(), est), X, y, cv=cv)
    return np.sqrt(mean_squared_error(y, pred)), r2_score(y, pred)

for name, est in [("Baseline", DummyRegressor(strategy="mean")),
                  ("OLS",   LinearRegression()),
                  ("Ridge", RidgeCV(alphas=np.logspace(-3, 3, 30))),
                  ("Lasso", LassoCV(alphas=np.logspace(-3, 1, 30))),
                  ("ENet",  ElasticNetCV(l1_ratio=[.2,.5,.9,1]))]:
    print(name, evaluate(est))`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" };
const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 };
