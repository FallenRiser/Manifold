import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { GuessSlider } from "@/components/capstone/GuessSlider";

export const metadata = {
  title: "Capstone: baseline & regularized models — Manifold",
  description:
    "Building from a trivial mean baseline up to OLS, ridge, lasso, and elastic-net with honest cross-validation — and the instructive result that with 16k rows and 10 features, regularization ties OLS.",
};

const MODELS = [
  { name: "Baseline (mean)", rmse: 1.156 },
  { name: "OLS", rmse: 0.681 },
  { name: "Ridge", rmse: 0.681 },
  { name: "Lasso", rmse: 0.681 },
  { name: "Elastic-net", rmse: 0.681 },
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
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "3 · The linear baseline", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Baseline & regularized models</>}
        intro={<>
          Now we model — from the bottom up, with honest validation. The result is more instructive than a
        triumphant one would be: on this data, regularization <em>ties</em> plain OLS, and understanding why is
        the real lesson.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Always start with a baseline</h2>
        <p>
          Before any real model, the dumbest one: predict the mean price for every block. Its RMSE equals the
          target&rsquo;s standard deviation, <strong>1.156</strong> — the number every later model must beat, and the
          thing that turns &ldquo;R² = 0.65&rdquo; into the concrete &ldquo;we cut baseline error by ~41%.&rdquo;
        </p>

        <h2>The comparison</h2>
        <GuessSlider
          prompt={<>Ten cleaned features, 16,512 rows, an honest 5-fold CV. What R² do you expect from the linear family on this data?</>}
          min={0}
          max={1}
          step={0.005}
          actual={0.653}
          decimals={3}
          reveal={<>The whole linear family lands at <strong>R² 0.653</strong> — RMSE 0.681, a ~41% cut in baseline error from ten interpretable coefficients. If you guessed higher: the missing 35% is exactly what the diagnostics page dissects (non-linear geography, the cap, interactions).</>}
        />
        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`5-fold CV  (RMSE in $100k, R2)        seed 42
  Baseline (mean)    RMSE 1.156   R2 0.000
  OLS                RMSE 0.681   R2 0.653
  Ridge   (λ≈10)     RMSE 0.681   R2 0.653
  Lasso   (λ≈0.001)  RMSE 0.681   R2 0.653   kept 10/10 features
  ElasticNet (α=0.9) RMSE 0.681   R2 0.653`}</CodeOutput>
        <div style={figWrap}>
          <BarFig />
          <div style={cap}>OLS crushes the mean baseline (1.156 → 0.681, R² 0.653) — but ridge, lasso, and
            elastic-net all land at the same 0.681. Regularization neither helps nor hurts the score here.</div>
        </div>

        <Callout color="var(--c-regression)" title={<>Why regularization didn&rsquo;t boost accuracy — and why that&rsquo;s the right outcome</>}>
          Regularization fights overfitting, and here there&rsquo;s almost none to fight:{" "}
            <strong>16,512 rows, only 10 features</strong> (n ≫ p). OLS has ample data to pin down ten
            coefficients, so its variance is already low and a penalty has little to remove. The tells confirm
            it: lasso chose a near-zero λ and kept all 10 features (nothing is redundant enough to drop), and
            ridge&rsquo;s λ buys stability without moving the score. The honest lesson —{" "}
            <strong>regularization is insurance, not a free accuracy boost</strong>. Its premium is still worth
            paying here for what it does deliver: stable, interpretable coefficients despite the multicollinearity
            (VIF up to 13.9 from the engineered features).
        </Callout>

        <h2>Which linear model do we keep?</h2>
        <p>
          Since the scores tie, we choose on the other criteria. <strong>Ridge</strong> is the pick: it matches
          OLS&rsquo;s accuracy while taming the collinear room-count coefficients into stable, interpretable values. We&rsquo;d
          take plain OLS only to avoid a hyperparameter, and lasso only for a shorter feature list the data says
          we don&rsquo;t need. We carry ridge forward as our baseline — and the next page reads what it actually learned,
          and where it falls short.
        </p>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/preprocessing", label: <>← Preprocessing pipeline</> }} next={{ href: "/learn/california-housing-capstone/diagnostics", label: <>Next up · Diagnostics: what it misses →</> }} />
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

const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" };
const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 };
