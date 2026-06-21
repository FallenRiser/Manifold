import Link from "next/link";
import { CaseTracker } from "@/components/CaseTracker";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

export const metadata = {
  title: "Case C: Medical Costs — Manifold",
  description: "The advanced linear-regression case: an interaction effect (smoking × age), heteroscedasticity you model rather than transform away, and statistical inference — confidence intervals, p-values, and prediction intervals.",
};

// ---- data: simulated insurance claims, split by smoking status ----
const AGE_N = [20, 25, 28, 33, 37, 41, 45, 50, 54, 58, 61, 64];
const COST_N = [7200, 7400, 7900, 8100, 8900, 9400, 9300, 10200, 10100, 11000, 11300, 11200];
const AGE_S = [22, 26, 30, 34, 38, 42, 46, 49, 53, 57, 60, 63];
const COST_S = [21000, 22500, 26000, 24500, 29000, 27000, 32500, 30000, 36000, 33000, 39000, 35000];

// simple OLS with standard errors  (y = a + b·x)
function fit(x: number[], y: number[]) {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
  const b = sxy / sxx;
  const a = my - b * mx;
  const fitv = x.map((v) => a + b * v);
  const res = y.map((v, i) => v - fitv[i]);
  const sse = res.reduce((s, e) => s + e * e, 0);
  const s2 = sse / (n - 2);                 // residual variance
  const seB = Math.sqrt(s2 / sxx);          // SE of slope
  const seA = Math.sqrt(s2 * (1 / n + (mx * mx) / sxx));
  return { a, b, fitv, res, seA, seB, resSD: Math.sqrt(sse / n) };
}

const NS = fit(AGE_N, COST_N);   // non-smokers
const SM = fit(AGE_S, COST_S);   // smokers

// model coefficients (smoker = baseline + dummy + interaction)
const cIntercept = NS.a;
const cAge = NS.b;
const cSmoker = SM.a - NS.a;       // dummy shift
const cInter = SM.b - NS.b;        // interaction: extra $/yr of age for smokers
const seInter = Math.sqrt(NS.seB ** 2 + SM.seB ** 2);
const tInter = cInter / seInter;
const ciLo = cInter - 1.96 * seInter;
const ciHi = cInter + 1.96 * seInter;

// prediction at age 50
const pred50N = NS.a + NS.b * 50;
const pred50S = SM.a + SM.b * 50;

// ---- geometry ----
const GX = (age: number) => 42 + ((age - 16) / 52) * 406;
const GY = (c: number) => 168 - ((c - 5000) / 36000) * 150;
const fmtk = (v: number) => "$" + Math.round(v / 1000) + "k";

const codeInteraction = `import numpy as np

# simulated insurance claims: cost driven by age, smoking, and their INTERACTION
np.random.seed(42)
age    = np.random.randint(18, 65, 200)
smoker = np.random.randint(0, 2, 200)

# truth: aging costs a non-smoker ~$100/yr, but a smoker ~$400/yr
cost = (5000 + 100*age + 8000*smoker
        + 300*(age*smoker)              # <-- the interaction term
        + np.random.normal(0, 2000 + 4000*smoker, 200))  # smokers vary more

# WITHOUT the interaction, one slope is forced on both groups -> underfits
print("corr(age, cost) overall:", round(np.corrcoef(age, cost)[0,1], 3))`;

const codeInferScratch = `import numpy as np

np.random.seed(42)
age    = np.random.randint(18, 65, 200)
smoker = np.random.randint(0, 2, 200)
cost = (5000 + 100*age + 8000*smoker + 300*(age*smoker)
        + np.random.normal(0, 2000 + 4000*smoker, 200))

# design matrix: [1, age, smoker, age*smoker]
X = np.column_stack([np.ones(len(age)), age, smoker, age*smoker])
y = cost

# OLS from scratch
beta = np.linalg.solve(X.T @ X, X.T @ y)
resid = y - X @ beta
n, k = X.shape
s2 = (resid @ resid) / (n - k)              # residual variance
cov = s2 * np.linalg.inv(X.T @ X)           # covariance of the coefficients
se = np.sqrt(np.diag(cov))                  # standard errors
t  = beta / se                              # t-statistics

names = ["Intercept", "Age", "Smoker", "Age*Smoker"]
for nm, b, s, tv in zip(names, beta, se, t):
    lo, hi = b - 1.96*s, b + 1.96*s
    print(f"{nm:11s} {b:9.1f}  SE {s:7.1f}  t {tv:6.1f}  95% CI [{lo:8.1f}, {hi:8.1f}]")`;

const codeInferLib = `import numpy as np
import statsmodels.api as sm
import pandas as pd

np.random.seed(42)
age    = np.random.randint(18, 65, 200)
smoker = np.random.randint(0, 2, 200)
cost = (5000 + 100*age + 8000*smoker + 300*(age*smoker)
        + np.random.normal(0, 2000 + 4000*smoker, 200))

X = sm.add_constant(np.column_stack([age, smoker, age*smoker]))
model = sm.OLS(cost, X).fit()

df = pd.DataFrame({
    "Coef": model.params, "Std Err": model.bse,
    "P-Value": model.pvalues,
    "CI Lower": model.conf_int()[:, 0], "CI Upper": model.conf_int()[:, 1],
}, index=["Intercept", "Age", "Smoker", "Age*Smoker"])
print(df.round(2).to_string())

p = model.pvalues[3]
print(f"\\nAge*Smoker p-value = {p:.2e}  ->",
      "SIGNIFICANT: age hurts smokers far more" if p < 0.05 else "not significant")`;

const codePred = `import numpy as np, statsmodels.api as sm
np.random.seed(42)
age    = np.random.randint(18, 65, 200)
smoker = np.random.randint(0, 2, 200)
cost = (5000 + 100*age + 8000*smoker + 300*(age*smoker)
        + np.random.normal(0, 2000 + 4000*smoker, 200))
model = sm.OLS(cost, sm.add_constant(np.column_stack([age, smoker, age*smoker]))).fit()

# a 50-year-old non-smoker vs smoker:  [const, age, smoker, age*smoker]
rows = [[1, 50, 0, 0], [1, 50, 1, 50]]
summ = model.get_prediction(rows).summary_frame(alpha=0.05)   # 95%

for label, r in zip(["non-smoker", "smoker"], range(2)):
    m  = summ["mean"].iloc[r]
    lo = summ["obs_ci_lower"].iloc[r]      # PREDICTION interval (one patient)
    hi = summ["obs_ci_upper"].iloc[r]
    print(f"50-yo {label:10s} expected \${m:,.0f}  |  95% patient range [\${lo:,.0f}, \${hi:,.0f}]")`;

export default function MedicalCostsCasePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Inference</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· Case C · ~18 min</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Case C: Medical costs
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The final step up: a relationship that <em>bends</em> between groups (an interaction),
        error that grows with the prediction, and the question Cases A and B never asked —{" "}
        <strong>are these coefficients real, or could they be noise?</strong> That&rsquo;s inference.
      </p>

      <CaseTracker />

      <div className="lesson">
        <Phase n="7" title="Frame the problem">
          <p style={pp}>
            <strong>The question:</strong> what drives an insurance claim, and can we trust the
            answer enough to set premiums? We predict annual medical cost from <strong>age</strong>{" "}
            and <strong>smoking status</strong>. The twist: we suspect age hurts smokers far more
            than non-smokers — the two features don&rsquo;t just add, they <em>interact</em>.
          </p>
          <Backlinks items={[
            { label: "Categorical features", href: "/learn/linear-regression/categorical-features" },
            { label: "Why predict at all?", href: "/learn/linear-regression/why-predict-at-all" },
          ]} />
        </Phase>

        <Phase n="8" title="The interaction — when slopes differ by group">
          <p style={pp}>
            A plain model forces <em>one</em> age slope on everyone. But look: the smoker cloud
            climbs far steeper than the non-smoker cloud. Fitting a single line would split the
            difference and fit neither. The fix is an <strong>interaction term</strong>,{" "}
            <code>age × smoker</code>, which lets each group own its own slope.
          </p>
          <Figure caption="Cost vs age, split by smoking status. Non-smokers rise gently (~$100/yr); smokers rise steeply (~$400/yr). Two different slopes = an interaction.">
            <svg viewBox="0 0 460 190" style={{ width: "100%", height: "auto", display: "block" }}>
              <rect x={42} y={18} width={406} height={150} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
              <line x1={GX(18)} y1={GY(SM.a + SM.b * 18)} x2={GX(64)} y2={GY(SM.a + SM.b * 64)} stroke="var(--bad)" strokeWidth={2} />
              <line x1={GX(18)} y1={GY(NS.a + NS.b * 18)} x2={GX(64)} y2={GY(NS.a + NS.b * 64)} stroke="var(--c-regression)" strokeWidth={2} />
              {AGE_S.map((a, i) => <circle key={"s" + i} cx={GX(a)} cy={GY(COST_S[i])} r={4} fill="var(--bad)" fillOpacity={0.85} />)}
              {AGE_N.map((a, i) => <circle key={"n" + i} cx={GX(a)} cy={GY(COST_N[i])} r={4} fill="var(--c-regression)" fillOpacity={0.85} />)}
              <circle cx={300} cy={32} r={4} fill="var(--bad)" /><text x={310} y={36} fontSize={11} fill="var(--muted)">smoker</text>
              <circle cx={372} cy={32} r={4} fill="var(--c-regression)" /><text x={382} y={36} fontSize={11} fill="var(--muted)">non-smoker</text>
              <text x={245} y={186} fontSize={11} fill="var(--faint)" textAnchor="middle">age →</text>
              <text x={13} y={93} fontSize={11} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 13 93)">annual cost →</text>
            </svg>
          </Figure>
          <CodeBlock fromScratch={codeInteraction} withLibrary={codeInteraction} />
          <Backlinks items={[
            { label: "Polynomial & interaction terms", href: "/learn/linear-regression/polynomial-and-interaction-terms" },
            { label: "Multiple linear regression", href: "/learn/linear-regression/multiple-linear-regression" },
          ]} />
        </Phase>

        <Phase n="9" title="Inference — is the effect real?">
          <p style={pp}>
            A coefficient is just a point estimate from one sample. <strong>Inference</strong> asks
            how much it would wobble across samples. Each estimate gets a <strong>standard
            error</strong>; the coefficient ÷ its SE is a <strong>t-statistic</strong>, and a big
            t (small <Link href="/learn/linear-regression/hypothesis-tests-and-p-values">p-value</Link>)
            means the effect is unlikely to be a fluke. The{" "}
            <Link href="/learn/linear-regression/confidence-intervals">95% confidence interval</Link>{" "}
            is the plausible range.
          </p>
          <div style={cmpTable}>
            <div style={{ ...cmpRow, borderTop: "none" }}>
              <span style={cmpH}>Term</span><span style={cmpHr}>Coef</span><span style={cmpHr}>95% CI</span><span style={cmpHr}>verdict</span>
            </div>
            <CoefRow term="Intercept" coef={`$${Math.round(cIntercept).toLocaleString()}`} ci="—" sig />
            <CoefRow term="Age" coef={`$${cAge.toFixed(0)}/yr`} ci="—" sig />
            <CoefRow term="Smoker" coef={`$${Math.round(cSmoker).toLocaleString()}`} ci="—" sig />
            <CoefRow term="Age × Smoker" coef={`$${cInter.toFixed(0)}/yr`} ci={`[$${Math.round(ciLo)}, $${Math.round(ciHi)}]`} sig />
          </div>
          <p style={{ ...pp, marginTop: 12 }}>
            The interaction coefficient is <strong>${cInter.toFixed(0)} per year</strong> with a
            t-statistic of <strong>{tInter.toFixed(1)}</strong> — its 95% interval{" "}
            <strong>excludes zero</strong>, so the effect is statistically significant. Aging really
            does cost smokers about ${cInter.toFixed(0)}/yr <em>more</em> than non-smokers; that
            isn&rsquo;t sampling noise.
          </p>
          <CodeBlock fromScratch={codeInferScratch} withLibrary={codeInferLib} />
          <Backlinks items={[
            { label: "Hypothesis tests & p-values", href: "/learn/linear-regression/hypothesis-tests-and-p-values" },
            { label: "Confidence intervals", href: "/learn/linear-regression/confidence-intervals" },
          ]} />
        </Phase>

        <Phase n="10" title="A complication — non-constant variance">
          <p style={pp}>
            One assumption is shaky here: smokers don&rsquo;t just cost more, they cost{" "}
            <em>less predictably</em> — their cloud is far wider. That&rsquo;s heteroscedasticity
            again, but unlike Case B we don&rsquo;t want to transform it away (the dollar scale is
            the point). Instead we acknowledge it: ordinary standard errors understate uncertainty
            for smokers, so robust (heteroscedasticity-consistent) standard errors are the honest
            choice for the p-values above.
          </p>
          <div style={resultGrid}>
            <Stat label="residual spread — non-smokers" value={fmtk(NS.resSD)} />
            <Stat label="residual spread — smokers" value={fmtk(SM.resSD)} accent />
          </div>
          <Backlinks items={[
            { label: "Homoscedasticity", href: "/learn/linear-regression/homoscedasticity" },
            { label: "Heteroscedasticity in depth", href: "/learn/linear-regression/heteroscedasticity-in-depth" },
          ]} />
        </Phase>

        <Phase n="11" title="Prediction intervals — a number with honest error bars">
          <p style={pp}>
            A premium can&rsquo;t be a single point. A hospital needs the <em>range</em> a real
            patient might land in. A <Link href="/learn/linear-regression/confidence-intervals">confidence interval</Link>{" "}
            covers the <em>average</em> 50-year-old; a{" "}
            <Link href="/learn/linear-regression/prediction-intervals">prediction interval</Link> is
            wider — it covers <em>one specific</em> patient, noise and all. For a 50-year-old our
            model expects:
          </p>
          <div style={resultGrid}>
            <Stat label="non-smoker, age 50" value={fmtk(pred50N)} />
            <Stat label="smoker, age 50" value={fmtk(pred50S)} accent />
          </div>
          <CodeBlock fromScratch={codePred} withLibrary={codePred} />
          <Backlinks items={[
            { label: "Prediction intervals", href: "/learn/linear-regression/prediction-intervals" },
            { label: "Confidence intervals", href: "/learn/linear-regression/confidence-intervals" },
          ]} />
        </Phase>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 600, color: "var(--good)", marginBottom: 6 }}>
            Track complete 🎉
          </div>
          <p style={{ margin: 0, color: "var(--ink)", fontSize: 14.5, lineHeight: 1.65 }}>
            Three cases, one workflow: <strong>Case A</strong> showed the clean skeleton,{" "}
            <strong>Case B</strong> made the diagnostics fail on messy data and fixed them, and{" "}
            <strong>Case C</strong> went past prediction into <em>inference</em> — interactions,
            non-constant variance, and coefficients with error bars. You now own linear regression
            end to end: the line, the math behind it, the assumptions, and how to defend a result.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/end-to-end-worked-case/house-prices" style={navLink}>← Case B</Link>
          <Link href="/learn" style={{ ...navLink, fontWeight: 600 }}>Return to tracks →</Link>
        </div>
      </div>
    </article>
  );
}

function CoefRow({ term, coef, ci, sig }: { term: string; coef: string; ci: string; sig?: boolean }) {
  return (
    <div style={cmpRow}>
      <span style={cmpL}>{term}</span>
      <span style={{ ...cmpLr, fontFamily: "var(--font-geist-mono, monospace)" }}>{coef}</span>
      <span style={{ ...cmpLr, fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12 }}>{ci}</span>
      <span style={{ ...cmpLr, color: sig ? "var(--good)" : "var(--muted)" }}>{sig ? "significant" : "—"}</span>
    </div>
  );
}

function Phase({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: "28px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={stepBadge}>Phase {n}</span>
        <h2 className="font-display" style={{ fontSize: 19, fontWeight: 500, color: "var(--ink)", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
      {children}
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{caption}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? "color-mix(in srgb, var(--good) 10%, var(--surface))" : "var(--surface-2)", border: accent ? "1px solid color-mix(in srgb, var(--good) 25%, var(--border))" : "1px solid var(--border)", borderRadius: 12, padding: "11px 13px" }}>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 500, color: accent ? "var(--good)" : "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}

const pp: React.CSSProperties = { margin: "0 0 10px", fontSize: 15, color: "var(--muted)", lineHeight: 1.65 };
const stepBadge: React.CSSProperties = { display: "inline-block", background: "var(--brand)", color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 6 };
const resultGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, margin: "1.4rem 0 0.4rem" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--good) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--good) 24%, var(--border))", borderRadius: 12, padding: "16px 18px", margin: "2.2rem 0 0" };

const cmpTable: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", margin: "1.2rem 0 0.4rem" };
const cmpRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 1fr 1.3fr 1fr", borderTop: "1px solid var(--border)" };
const cmpH: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--ink)", padding: "9px 12px", background: "var(--surface-2)" };
const cmpHr: React.CSSProperties = { ...cmpH, textAlign: "right" };
const cmpL: React.CSSProperties = { fontSize: 13, color: "var(--ink)", padding: "9px 12px" };
const cmpLr: React.CSSProperties = { fontSize: 13, color: "var(--ink)", padding: "9px 12px", textAlign: "right" };
