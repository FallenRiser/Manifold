import Link from "next/link";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { CREDIT_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

// Real L2 path from scripts/logit_tier2.py (standardized coefs vs C)
const CS = [0.001, 0.01, 0.1, 1, 10, 100];
const PATH: Record<string, number[]> = {
  util:   [0.128, 0.453, 0.645, 0.677, 0.681, 0.681],
  prior:  [0.102, 0.358, 0.510, 0.536, 0.539, 0.539],
  income: [-0.092, -0.322, -0.461, -0.485, -0.487, -0.487],
  age:    [-0.020, -0.084, -0.127, -0.135, -0.135, -0.136],
};
const COLORS: Record<string, string> = {
  util: "var(--c-classification)", prior: "var(--brand-2)",
  income: "var(--c-regression)", age: "var(--c-trees)",
};

const code = `from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

Xs = StandardScaler().fit_transform(X)   # penalties need a common scale
for C in [0.001, 0.01, 0.1, 1.0, 10.0]:
    clf = LogisticRegression(penalty="l2", C=C, max_iter=5000).fit(Xs, y)
    print(f"C={C:7.3f}  coefs={clf.coef_[0].round(3)}")`;

export default function RegularizedLogisticPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Regularized logistic regression</>}
        intro={<>
          You already met this idea in regression: penalize big coefficients to fight overfitting.
          It transfers to classification almost unchanged — and scikit-learn turns it on by default,
          whether you asked or not.
        </>}
      />

      <div className="lesson">
        <p>
          Logistic regression overfits for the same reasons linear regression does: too many
          features, correlated features, or too few rows, and the coefficients balloon to chase
          noise. And there&rsquo;s a failure mode unique to classification — when the classes are
          perfectly separable, the unpenalized coefficients run to <em>infinity</em> (the next-but-one
          page is devoted to it). Both problems have the same cure: add a penalty on coefficient size
          to the log-loss objective.
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{minimize}\quad \underbrace{-\tfrac{1}{n}\sum \big[y\log p + (1-y)\log(1-p)\big]}_{\text{log loss}} \;+\; \underbrace{\lambda \lVert w \rVert}_{\text{penalty}}`}</M>
        </p>
        <p>
          L2 (ridge-style) shrinks every coefficient smoothly toward zero; L1 (lasso-style) drives
          the weakest ones to exactly zero, doubling as feature selection — the identical trade-off
          the{" "}
          <Link href="/learn/regularized-regression" style={{ color: "var(--brand)" }}>regularized
          regression track</Link> covers in depth. Only the loss it&rsquo;s bolted onto has changed.
        </p>

        <h2>scikit-learn&rsquo;s <code>C</code>, and its silent default</h2>
        <p>
          One notation trap: scikit-learn parameterizes the penalty by <code>C</code>, which is the{" "}
          <em>inverse</em> strength — <M>{String.raw`C = 1/\lambda`}</M>. Small <code>C</code> means
          heavy shrinkage; large <code>C</code> means almost none. And the default is{" "}
          <code>C = 1.0</code> with L2 <em>on</em> — so unless you say otherwise, every
          scikit-learn logistic model you have ever trained was regularized. Watch the standardized
          coefficients grow as the penalty relaxes:
        </p>

        <CodeBlock setup={CREDIT_SETUP} fromScratch={code} />
        <CodeOutput>{`C=  0.001  coefs=[-0.02  -0.092  0.128  0.102]
C=  0.010  coefs=[-0.084 -0.322  0.453  0.358]
C=  0.100  coefs=[-0.127 -0.461  0.645  0.51 ]
C=  1.000  coefs=[-0.135 -0.485  0.677  0.536]
C= 10.000  coefs=[-0.135 -0.487  0.681  0.539]`}</CodeOutput>

        <PathFig />
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: "-0.4rem" }}>
          Standardized coefficients vs <code>C</code> (log scale). At heavy penalty (left) every
          coefficient is crushed toward zero — the model barely commits to anything. As{" "}
          <code>C</code> grows they fan out to their unpenalized values and then flatten: past{" "}
          <code>C ≈ 1</code> there&rsquo;s nothing left to constrain.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You crank the penalty all the way up (<code>C</code> → very small). Where do all the coefficients head?</>}
          options={["Toward zero — the model predicts the base rate for everyone", "Toward infinity", "They stay put; C only affects speed"]}
          nudge={<>Read the leftmost column of the output above, then the left edge of the figure.</>}
        />

        <h2>How to choose <code>C</code></h2>
        <p>
          Exactly as you chose <M>\lambda</M> in the regression track: <strong>cross-validation</strong>.
          Sweep a grid of <code>C</code> values, score held-out log loss (or AUC) on each, keep the
          winner. Scikit-learn ships <code>LogisticRegressionCV</code> to do the sweep for you. Never
          pick <code>C</code> by training performance — less penalty always fits the training set
          better, so training error votes for <code>C = ∞</code> every time.
        </p>

        <Callout color={ACCENT} title={<>Always standardize first</>}>
          A penalty judges coefficients by magnitude, and magnitude depends on feature scale. Feed
          raw features to a penalized model and it will punish the coefficient of a small-unit
          feature (like income-in-dollars) far harder than a large-unit one — an arbitrary,
          unintended bias. Standardize, <em>then</em> regularize. This is the one case where
          standardization changes the answer, not just the units (see the previous chapter).
        </Callout>

        <PrevNext
          prev={{ href: "/learn/logistic-regression/statistical-significance-of-coefficients", label: <>← Statistical significance</> }}
          next={{ href: "/learn/logistic-regression/class-imbalance-and-class-weights", label: <>Next up · Class imbalance &amp; class weights →</> }}
        />
      </div>
    </article>
  );
}

function PathFig() {
  const VW = 620, VH = 260, PAD = { l: 44, r: 74, t: 16, b: 34 };
  const xToPx = (i: number) => PAD.l + (i / (CS.length - 1)) * (VW - PAD.l - PAD.r);
  const lo = -0.55, hi = 0.75;
  const yToPx = (v: number) => PAD.t + ((hi - v) / (hi - lo)) * (VH - PAD.t - PAD.b);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "14px 16px", margin: "1.4rem 0" }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={PAD.l} y={PAD.t} width={VW - PAD.l - PAD.r} height={VH - PAD.t - PAD.b} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={PAD.l} y1={yToPx(0)} x2={VW - PAD.r} y2={yToPx(0)} stroke="var(--border-strong)" strokeDasharray="4 5" />
        <text x={PAD.l - 6} y={yToPx(0) + 4} fontSize={10} fill="var(--faint)" textAnchor="end">0</text>
        {CS.map((c, i) => (
          <text key={c} x={xToPx(i)} y={VH - PAD.b + 15} fontSize={9.5} fill="var(--faint)" textAnchor="middle">{c}</text>
        ))}
        <text x={(PAD.l + VW - PAD.r) / 2} y={VH - 4} fontSize={10} fill="var(--muted)" textAnchor="middle">C (inverse penalty →)</text>
        {Object.entries(PATH).map(([name, vals]) => (
          <g key={name}>
            <polyline points={vals.map((v, i) => `${xToPx(i)},${yToPx(v)}`).join(" ")} fill="none" stroke={COLORS[name]} strokeWidth={2.2} />
            <circle cx={xToPx(vals.length - 1)} cy={yToPx(vals[vals.length - 1])} r={3} fill={COLORS[name]} />
            <text x={VW - PAD.r + 6} y={yToPx(vals[vals.length - 1]) + 3.5} fontSize={10} fill={COLORS[name]}>{name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
