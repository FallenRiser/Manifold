import Link from "next/link";
import { CaseTracker } from "@/components/CaseTracker";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

export const metadata = {
  title: "Case B: House Prices — Manifold",
  description: "A messy, real-world linear-regression case study: a skewed target, features on clashing scales, diagnostics that actually fail, and the fixes — log-transform, scaling, and Ridge.",
};

// ---- data: a representative slice of the California housing problem ----
// MedInc (median income, tens of $k) vs house value ($100k), capped at 5.0 like the real set
const INC = [1.5, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.1, 3.3, 3.5, 3.7, 3.9, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.2, 5.5, 5.8, 6.0, 6.3, 6.6, 7.0, 7.4, 7.8, 8.0, 8.3];
const PRICE = [1.0, 1.3, 1.1, 1.6, 1.4, 1.9, 1.7, 2.2, 1.9, 2.5, 2.1, 2.8, 2.4, 3.1, 2.6, 3.4, 2.9, 3.8, 3.2, 4.2, 3.5, 4.6, 3.8, 5.0, 4.3, 5.0, 4.6, 5.0, 4.9, 5.0];
const N = PRICE.length;

// ---- simple OLS  y = a + b·x ----
function ols(x: number[], y: number[]) {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
  const b = sxy / sxx;
  const a = my - b * mx;
  const fit = x.map((v) => a + b * v);
  const res = y.map((v, i) => v - fit[i]);
  const r2 = 1 - res.reduce((s, e) => s + e * e, 0) / y.reduce((s, v) => s + (v - my) ** 2, 0);
  return { a, b, fit, res, r2 };
}

const raw = ols(INC, PRICE);                       // price ~ income (the naive model)
const LOGP = PRICE.map((p) => Math.log(p));
const logm = ols(INC, LOGP);                        // log(price) ~ income (the fix)

// skewness of the raw target (Fisher-Pearson)
function skew(v: number[]) {
  const n = v.length, m = v.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / n);
  return v.reduce((s, x) => s + ((x - m) / sd) ** 3, 0) / n;
}
const skewRaw = skew(PRICE);
const skewLog = skew(LOGP);

// ---- geometry helpers ----
const SX = (x: number) => 42 + ((x - 1.2) / 7.4) * 406;          // income axis
const SYp = (p: number) => 168 - ((p - 0.7) / 4.6) * 150;        // price axis
// residual panels (shared vertical layout, zero in the middle)
const maxR = Math.max(...raw.res.map(Math.abs)) * 1.12;
const RX = (f: number, lo: number, hi: number) => 42 + ((f - lo) / (hi - lo)) * 406;
const RYraw = (e: number) => 93 - (e / maxR) * 72;
const maxRl = Math.max(...logm.res.map(Math.abs)) * 1.12;
const RYlog = (e: number) => 93 - (e / maxRl) * 72;
const rawFmin = Math.min(...raw.fit), rawFmax = Math.max(...raw.fit);
const logFmin = Math.min(...logm.fit), logFmax = Math.max(...logm.fit);

// ---- code ----
const codeData = `import numpy as np
from sklearn.datasets import fetch_california_housing

# ~20,640 rows of real 1990 California census data
cal = fetch_california_housing()
X_raw, y = cal.data, cal.target          # y is in units of $100,000
print("shape:", X_raw.shape)
print("features:", cal.feature_names)

# EDA: is the target symmetric, or skewed?
from scipy.stats import skew
print("target skewness:", round(skew(y), 3))   # > 1  =>  heavily right-skewed
print("share at the $500k cap:", round((y >= 5.0).mean(), 3))`;

const codeFitScratch = `import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split

X_raw, y = fetch_california_housing(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X_raw, y, test_size=0.2, random_state=42)

# --- OLS from scratch: theta = (X'X)^-1 X'y, via a stable solve ---
Xb = np.column_stack([np.ones(len(Xtr)), Xtr])     # bias column
theta = np.linalg.solve(Xb.T @ Xb, Xb.T @ ytr)

Xb_te = np.column_stack([np.ones(len(Xte)), Xte])
pred = Xb_te @ theta
r2 = 1 - np.sum((yte - pred)**2) / np.sum((yte - yte.mean())**2)

mae  = np.mean(np.abs(yte - pred)) * 100_000
rmse = np.sqrt(np.mean((yte - pred)**2)) * 100_000
print(f"R²:   {r2:.3f}")
print(f"MAE:  \${mae:,.0f}")
print(f"RMSE: \${rmse:,.0f}")        # RMSE >> MAE  =>  a few huge misses`;

const codeFitLib = `import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

X_raw, y = fetch_california_housing(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X_raw, y, test_size=0.2, random_state=42)

model = LinearRegression().fit(Xtr, ytr)     # handles the bias term for you
pred = model.predict(Xte)

print(f"R²:   {r2_score(yte, pred):.3f}")
print(f"MAE:  \${mean_absolute_error(yte, pred)*100_000:,.0f}")
print(f"RMSE: \${np.sqrt(mean_squared_error(yte, pred))*100_000:,.0f}")`;

const codeDiag = `import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from scipy.stats import skew

X_raw, y = fetch_california_housing(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X_raw, y, test_size=0.2, random_state=42)
model = LinearRegression().fit(Xtr, ytr)
resid = ytr - model.predict(Xtr)

# 1. Normality of residuals — are they symmetric around 0?
print("residual skewness:", round(skew(resid), 3))
if abs(skew(resid)) > 1:
    print("  -> residuals are skewed; the straight-line fit is off")

# 2. Heteroscedasticity — does spread grow with the prediction?
fit = model.predict(Xtr)
lo = resid[fit < np.median(fit)].std()
hi = resid[fit >= np.median(fit)].std()
print(f"residual std (cheap half): {lo:.3f}")
print(f"residual std (pricey half): {hi:.3f}")   # much larger => fan shape

# 3. Multicollinearity — VIF on each feature
from numpy.linalg import inv
Xc = (Xtr - Xtr.mean(0)) / Xtr.std(0)
vif = np.diag(inv(np.corrcoef(Xc, rowvar=False)))
print("max VIF:", round(vif.max(), 1))           # AveRooms/AveBedrms are coupled`;

const codeFixScratch = `import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler

X_raw, y = fetch_california_housing(return_X_y=True)

# FIX 1: log-transform the skewed target  (np.log1p is log(1+y), safe at 0)
y_log = np.log1p(y)

Xtr, Xte, ytr, yte = train_test_split(X_raw, y_log, test_size=0.2, random_state=42)

# FIX 2: scale features so Ridge penalises them fairly
sc = StandardScaler().fit(Xtr)
Xtr_s, Xte_s = sc.transform(Xtr), sc.transform(Xte)

# FIX 3: Ridge from scratch — theta = (X'X + αI)^-1 X'y, α chosen by CV
def ridge_fit(X, yv, alpha):
    Xb = np.column_stack([np.ones(len(X)), X])
    A = Xb.T @ Xb + alpha * np.eye(Xb.shape[1])
    A[0, 0] -= alpha                       # don't penalise the intercept
    return np.linalg.solve(A, Xb.T @ yv)

theta = ridge_fit(Xtr_s, ytr, alpha=1.0)
pred_log = np.column_stack([np.ones(len(Xte_s)), Xte_s]) @ theta

# undo the log to score in dollars
pred = np.expm1(pred_log)
true = np.expm1(yte)
mae = np.mean(np.abs(true - pred)) * 100_000
print(f"MAE after fixes: \${mae:,.0f}")`;

const codeFixLib = `import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import RidgeCV
from sklearn.metrics import r2_score, mean_absolute_error

X_raw, y = fetch_california_housing(return_X_y=True)
y_log = np.log1p(y)                                  # FIX 1: tame the skew
Xtr, Xte, ytr, yte = train_test_split(X_raw, y_log, test_size=0.2, random_state=42)

sc = StandardScaler().fit(Xtr)                       # FIX 2: scale
Xtr_s, Xte_s = sc.transform(Xtr), sc.transform(Xte)

# FIX 3: RidgeCV sweeps alpha with built-in cross-validation
ridge = RidgeCV(alphas=[0.1, 1.0, 10.0, 100.0]).fit(Xtr_s, ytr)
pred = np.expm1(ridge.predict(Xte_s))               # back to dollars
true = np.expm1(yte)

print(f"chosen alpha: {ridge.alpha_}")
print(f"R² (log scale): {r2_score(yte, ridge.predict(Xte_s)):.3f}")
print(f"MAE: \${mean_absolute_error(true, pred)*100_000:,.0f}")`;

export default function HousePricesCasePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--warn)")}>Messy data</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· Case B · ~15 min</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Case B: House prices
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Same skeleton as Case A — but now the data fights back. 20,640 real California houses with a
        skewed, capped target and features on clashing scales. We run the workflow, watch the
        diagnostics <em>fail</em>, and fix them.
      </p>

      <CaseTracker />

      <div className="lesson">
        <Phase n="0" title="Frame the problem">
          <p style={pp}>
            <strong>The question:</strong> predict the median house value of a California
            neighbourhood from census features. Continuous target → regression, same family as
            Case A. What changes is the data quality, not the math.
          </p>
          <ul style={ul}>
            <li><strong style={{ color: "var(--ink)" }}>Target (y):</strong> median house value in $100k units — and it&rsquo;s capped at $500k, which will bite us.</li>
            <li><strong style={{ color: "var(--ink)" }}>Features (X):</strong> 8 of them — median income, house age, rooms, bedrooms, population, occupancy, latitude, longitude.</li>
          </ul>
          <Backlinks items={[
            { label: "Multiple linear regression", href: "/learn/linear-regression/multiple-linear-regression" },
            { label: "What a model really is", href: "/learn/linear-regression/what-a-model-really-is" },
          ]} />
        </Phase>

        <Phase n="1" title="Look at the data first">
          <p style={pp}>
            Median income is the dominant predictor, so we plot value against it. The trend is real
            and upward — but two things jump out that never appeared in Case A: the cloud{" "}
            <strong>fans wider as income rises</strong>, and a row of points is pinned to the{" "}
            <strong>$500k ceiling</strong>. Both are warnings.
          </p>
          <Figure caption="Value vs median income. The spread grows with income (heteroscedasticity) and high-value homes pile up against the $500k cap — the target is right-skewed.">
            <svg viewBox="0 0 460 190" style={{ width: "100%", height: "auto", display: "block" }}>
              <rect x={42} y={18} width={406} height={150} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
              <line x1={42} y1={SYp(5)} x2={448} y2={SYp(5)} stroke="var(--bad)" strokeWidth={1.3} strokeDasharray="4 3" strokeOpacity={0.7} />
              <text x={444} y={SYp(5) - 5} fontSize={9.5} fill="var(--bad)" textAnchor="end">$500k cap</text>
              {INC.map((x, i) => (
                <circle key={i} cx={SX(x)} cy={SYp(PRICE[i])} r={4} fill="var(--c-regression)" />
              ))}
              <text x={245} y={186} fontSize={11} fill="var(--faint)" textAnchor="middle">median income →</text>
              <text x={13} y={93} fontSize={11} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 13 93)">house value ($100k) →</text>
            </svg>
          </Figure>
          <div style={resultGrid}>
            <Stat label="target skewness (raw)" value={skewRaw.toFixed(2)} />
            <Stat label="target skewness (log)" value={skewLog.toFixed(2)} accent />
          </div>
          <Backlinks items={[
            { label: "Homoscedasticity", href: "/learn/linear-regression/homoscedasticity" },
            { label: "Normality of residuals", href: "/learn/linear-regression/normality-of-residuals" },
          ]} />
        </Phase>

        <CodeBlock fromScratch={codeData} withLibrary={codeData} />

        <Phase n="2" title="Fit the naive model — and split honestly">
          <p style={pp}>
            First, the obvious move: an <Link href="/learn/linear-regression/multiple-linear-regression">OLS fit on all 8 features</Link>,
            no transforms. But unlike Case A we can&rsquo;t score on the training data — with 20k
            rows we hold out a <strong>test set</strong> so the number we report is honest. Below,
            the same fit from scratch (normal equation) and via scikit-learn.
          </p>
          <CodeBlock fromScratch={codeFitScratch} withLibrary={codeFitLib} />
          <div style={resultGrid}>
            <Stat label="R² (test)" value="0.58" />
            <Stat label="MAE" value="~$53k" />
            <Stat label="RMSE" value="~$74k" accent />
          </div>
          <p style={{ ...pp, marginTop: 12 }}>
            R² of 0.58 looks passable — but <strong>RMSE far exceeds MAE</strong>. That gap is the
            tell: a handful of huge misses (the capped mansions) are dominating the error.{" "}
            <Link href="/learn/linear-regression/rmse-vs-mae">RMSE punishes big errors</Link>, so when it
            balloons past MAE, go hunting.
          </p>
          <Backlinks items={[
            { label: "Train / test split", href: "/learn/linear-regression/cross-validation-bias-variance" },
            { label: "RMSE vs MAE", href: "/learn/linear-regression/rmse-vs-mae" },
          ]} />
        </Phase>

        <Phase n="3" title="Run the diagnostics — watch them fail">
          <p style={pp}>
            Now we earn the R². Plotting residuals against fitted values should give a flat,
            patternless band. Instead it <strong>fans open</strong> — small errors on cheap homes,
            huge errors on expensive ones. That&rsquo;s textbook heteroscedasticity, and it means
            our coefficients and any confidence intervals are untrustworthy.
          </p>
          <Figure caption="Residuals vs fitted for the naive OLS fit — a clear cone. Variance grows with the prediction, violating the equal-variance assumption.">
            <svg viewBox="0 0 460 190" style={{ width: "100%", height: "auto", display: "block" }}>
              <rect x={42} y={18} width={406} height={150} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
              <line x1={42} y1={RYraw(0)} x2={448} y2={RYraw(0)} stroke="var(--brand)" strokeWidth={1.4} strokeDasharray="4 3" strokeOpacity={0.7} />
              {raw.fit.map((f, i) => (
                <circle key={i} cx={RX(f, rawFmin, rawFmax)} cy={RYraw(raw.res[i])} r={4} fill="var(--warn)" />
              ))}
              <text x={245} y={186} fontSize={11} fill="var(--faint)" textAnchor="middle">fitted value →</text>
              <text x={13} y={93} fontSize={11} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 13 93)">residual</text>
            </svg>
          </Figure>
          <p style={pp}>
            Two more checks in the code: residual <strong>skewness</strong> comes back high (the fit
            is systematically off at the top), and <strong>VIF</strong> flags that{" "}
            <code>AveRooms</code> and <code>AveBedrms</code> are nearly collinear — they carry
            overlapping information.
          </p>
          <CodeBlock fromScratch={codeDiag} withLibrary={codeDiag} />
          <Backlinks items={[
            { label: "Residual-vs-fitted", href: "/learn/linear-regression/residual-vs-fitted" },
            { label: "Heteroscedasticity in depth", href: "/learn/linear-regression/heteroscedasticity-in-depth" },
            { label: "Multicollinearity", href: "/learn/linear-regression/multicollinearity" },
          ]} />
        </Phase>

        <Phase n="4" title="Fix it — transform, scale, regularize">
          <p style={pp}>
            Three targeted fixes, each addressing one failure:
          </p>
          <ul style={ul}>
            <li><strong style={{ color: "var(--ink)" }}>Log-transform the target.</strong> A skewed, multiplicative quantity like price becomes near-symmetric in log space — skewness drops from {skewRaw.toFixed(2)} to {skewLog.toFixed(2)} and the fan collapses.</li>
            <li><strong style={{ color: "var(--ink)" }}>Scale the features.</strong> Income (~1–8) and population (~thousands) live on wildly different scales; <Link href="/learn/linear-regression/regularization">Ridge</Link> only penalises fairly once they&rsquo;re standardized.</li>
            <li><strong style={{ color: "var(--ink)" }}>Add Ridge regularization.</strong> The L2 penalty tames the collinear room-count coefficients, with α chosen by cross-validation.</li>
          </ul>
          <Figure caption="Residuals vs fitted after the log-transform — the cone is gone, the band is roughly flat, and the equal-variance assumption holds.">
            <svg viewBox="0 0 460 190" style={{ width: "100%", height: "auto", display: "block" }}>
              <rect x={42} y={18} width={406} height={150} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
              <line x1={42} y1={RYlog(0)} x2={448} y2={RYlog(0)} stroke="var(--brand)" strokeWidth={1.4} strokeDasharray="4 3" strokeOpacity={0.7} />
              {logm.fit.map((f, i) => (
                <circle key={i} cx={RX(f, logFmin, logFmax)} cy={RYlog(logm.res[i])} r={4} fill="var(--good)" />
              ))}
              <text x={245} y={186} fontSize={11} fill="var(--faint)" textAnchor="middle">fitted value (log) →</text>
              <text x={13} y={93} fontSize={11} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 13 93)">residual</text>
            </svg>
          </Figure>
          <CodeBlock fromScratch={codeFixScratch} withLibrary={codeFixLib} />
          <Backlinks items={[
            { label: "Feature scaling", href: "/learn/linear-regression/feature-scaling" },
            { label: "Regularization", href: "/learn/linear-regression/regularization" },
            { label: "Cross-validation", href: "/learn/linear-regression/cross-validation-bias-variance" },
          ]} />
        </Phase>

        <Phase n="5" title="Compare — did it actually help?">
          <p style={pp}>
            The headline R² barely moves, and that&rsquo;s the lesson: the win isn&rsquo;t a bigger
            number, it&rsquo;s a <strong>trustworthy</strong> one. The fixed model&rsquo;s residuals
            satisfy the assumptions, its errors are evenly spread instead of exploding on expensive
            homes, and its coefficients are stable enough to interpret.
          </p>
          <div style={cmpTable}>
            <div style={cmpRow}><span style={cmpH}>&nbsp;</span><span style={cmpH}>Naive OLS</span><span style={cmpH}>After fixes</span></div>
            <div style={cmpRow}><span style={cmpL}>Residuals</span><span style={cmpBad}>fan / skewed</span><span style={cmpGood}>flat / symmetric</span></div>
            <div style={cmpRow}><span style={cmpL}>RMSE vs MAE</span><span style={cmpBad}>RMSE ≫ MAE</span><span style={cmpGood}>gap shrinks</span></div>
            <div style={cmpRow}><span style={cmpL}>Coefficients</span><span style={cmpBad}>unstable (collinear)</span><span style={cmpGood}>regularized</span></div>
            <div style={cmpRow}><span style={cmpL}>Trustworthy?</span><span style={cmpBad}>no</span><span style={cmpGood}>yes</span></div>
          </div>
          <Backlinks items={[
            { label: "Bias–variance revisited", href: "/learn/linear-regression/bias-variance-revisited" },
            { label: "R² and adjusted R²", href: "/learn/linear-regression/r-squared-and-adjusted" },
          ]} />
        </Phase>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--warn)", marginBottom: 6 }}>
            Case B complete — diagnostics drive the work
          </div>
          <p style={{ margin: 0, color: "var(--ink)", fontSize: 14.5, lineHeight: 1.65 }}>
            The model that <em>looks</em> fine on R² was quietly broken; the residual plot exposed it.
            Real projects are mostly this loop: fit, diagnose, fix, re-check. <strong>Case C</strong>
            goes one level deeper — an interaction effect (smoking × age), heteroscedasticity you
            model rather than transform away, and statistical inference: confidence intervals and
            p-values.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/end-to-end-worked-case/startup-revenue" style={navLink}>← Case A</Link>
          <Link href="/learn/linear-regression/end-to-end-worked-case/medical-costs" style={{ ...navLink, fontWeight: 600 }}>Case C: Medical costs →</Link>
        </div>
      </div>
    </article>
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
const ul: React.CSSProperties = { margin: "0 0 4px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const stepBadge: React.CSSProperties = { display: "inline-block", background: "var(--brand)", color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 6 };
const resultGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, margin: "1.4rem 0 0.4rem" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--warn) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--warn) 24%, var(--border))", borderRadius: 12, padding: "16px 18px", margin: "2.2rem 0 0" };

const cmpTable: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", margin: "1.2rem 0 0.4rem" };
const cmpRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", borderTop: "1px solid var(--border)" };
const cmpH: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--ink)", padding: "9px 12px", background: "var(--surface-2)" };
const cmpL: React.CSSProperties = { fontSize: 13, color: "var(--muted)", padding: "9px 12px" };
const cmpBad: React.CSSProperties = { fontSize: 13, color: "var(--bad)", padding: "9px 12px" };
const cmpGood: React.CSSProperties = { fontSize: 13, color: "var(--good)", padding: "9px 12px" };
