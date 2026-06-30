import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Capstone: gradient boosting — Manifold",
  description:
    "Upgrade 3: a gradient-boosted tree model captures the non-linear geography and feature interactions the linear model couldn't, lifting R² from 0.69 to 0.84 — the project's biggest jump. With feature importances and a partial-dependence curve.",
};

const IMP = [
  { f: "IncomeLevel", v: 0.338 }, { f: "Latitude", v: 0.235 }, { f: "Longitude", v: 0.204 },
  { f: "dist_coast", v: 0.172 }, { f: "RoomsPerHousehold", v: 0.125 }, { f: "dist_sf", v: 0.055 },
  { f: "region", v: 0.053 }, { f: "dist_la", v: 0.028 }, { f: "PropertyAge", v: 0.022 },
];
const PDP_X = [1.57, 2.18, 2.79, 3.4, 4.01, 4.62, 5.23, 5.84, 6.45, 7.06];
const PDP_Y = [-0.6, -0.56, -0.43, -0.25, -0.08, 0.08, 0.34, 0.86, 1.11, 1.27];

function ImpFig() {
  const W = 340, H = 200, padL = 104, padR = 30;
  const max = 0.36, rowH = (H - 14) / IMP.length;
  const bx = (v: number) => Math.round((padL + (v / max) * (W - padL - padR)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {IMP.map((d, i) => {
        const y = 10 + i * rowH;
        return (
          <g key={d.f}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8} fill="var(--muted)" textAnchor="end">{d.f}</text>
            <rect x={padL} y={Math.round((y + 1.5) * 100) / 100} width={Math.round((bx(d.v) - padL) * 100) / 100} height={Math.round((rowH - 4) * 100) / 100} fill="var(--c-trees)" fillOpacity={0.78} rx={1.5} />
            <text x={bx(d.v) + 4} y={y + rowH / 2 + 2} fontSize={7.5} fill="var(--muted)">{d.v.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}
function PdpFig() {
  const W = 320, H = 170, padL = 30, padB = 24, padT = 12;
  const xlo = 1.5, xhi = 7.1, ylo = -0.8, yhi = 1.4;
  const sx = (v: number) => Math.round((padL + ((v - xlo) / (xhi - xlo)) * (W - padL - 12)) * 100) / 100;
  const sy = (v: number) => Math.round((H - padB - ((v - ylo) / (yhi - ylo)) * (H - padT - padB)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      <line x1={padL} y1={sy(0)} x2={W - 12} y2={sy(0)} stroke="var(--border-strong)" strokeWidth={0.6} strokeDasharray="2 2" />
      <polyline points={PDP_X.map((x, i) => `${sx(x)},${sy(PDP_Y[i])}`).join(" ")} fill="none" stroke="var(--c-trees)" strokeWidth={2.6} />
      {PDP_X.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(PDP_Y[i])} r={2.6} fill="var(--c-trees)" />)}
      <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">block median income →</text>
      <text x={11} y={H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${H / 2})`}>effect on price</text>
    </svg>
  );
}

export default function GradientBoostingPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-trees)")}>Upgrade 3 · Nonlinear</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 9 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Upgrade 3 · Gradient boosting
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        <strong>Diagnosis:</strong> the linear residuals still hold non-linear geography and feature interactions.
        <strong> Fix:</strong> a model that learns those automatically. This is the project&rsquo;s biggest single jump —
        R² from 0.69 to <strong>0.84</strong>.
      </p>

      <div className="lesson">
        <h2>Why trees, why boosting</h2>
        <p>
          A decision tree splits the data into regions and predicts a constant in each — so it can carve California
          into &ldquo;coastal LA,&rdquo; &ldquo;inland valley,&rdquo; &ldquo;Bay Area&rdquo; on its own, no hand-engineering, and it captures{" "}
          <strong>interactions</strong> for free (income&rsquo;s effect can differ by region, because the splits nest).{" "}
          <strong>Gradient boosting</strong> builds many shallow trees in sequence, each one correcting the previous
          ensemble&rsquo;s errors — a powerful, robust learner that&rsquo;s the default winner on tabular data like this.
        </p>
        <p>
          Note one thing it doesn&rsquo;t need: scaling or log-transforms. Trees split on thresholds, so monotonic
          transforms don&rsquo;t change them — we feed the cleaned features (with the spatial ones from Upgrade 1) directly.
        </p>

        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`5-fold CV  HistGradientBoostingRegressor
  RMSE 0.458   R2 0.843        (vs linear baseline R2 0.672)
holdout R2 0.834

residuals at the 5.0 cap:
  RMSE capped   0.981   (linear was 1.528)
  RMSE non-cap  0.429   (linear was 0.605)`}</CodeOutput>
        <p>
          R² leaps from 0.69 to <strong>0.843</strong> — a ~30% cut in RMSE over the spatial linear model and the
          largest gain in the whole project. It even softens the cap problem (capped RMSE 0.98 vs the linear 1.53),
          because the trees fit the high-value blocks far better up to the ceiling — though censoring still bites,
          since no model can recover values that were never recorded.
        </p>

        <h2>What the model learned — and it&rsquo;s readable too</h2>
        <p>
          Trees aren&rsquo;t a black box here. Permutation importance ranks what matters, and partial dependence shows the
          <em> shape</em> of each effect.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "1rem 0" }} className="elbow-grid">
          <div style={figWrap}><ImpFig /><div style={cap}>Permutation importance. Income leads, but{" "}
            <strong>geography — latitude, longitude, dist_coast — collectively dominates</strong>, exactly what the
            map predicted and linear correlation hid.</div></div>
          <div style={figWrap}><PdpFig /><div style={cap}>Partial dependence of income. Not a straight line: the
            effect is flat at low income, then <strong>accelerates steeply</strong> for richer blocks — a
            non-linearity the linear model averaged away.</div></div>
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            The payoff of the whole arc
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            This jump validates the diagnostic-driven approach. We didn&rsquo;t reach for boosting first and hope — we
            <em> earned</em> it by showing the linear model&rsquo;s residuals held non-linear, interacting structure, then
            chose the tool built to capture exactly that. The importances and PDP confirm the model learned the{" "}
            <em>real</em> story (geography + non-linear income), not an artifact. That&rsquo;s the difference between a
            high score you trust and one you don&rsquo;t.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/censored-regression" style={navLink}>← Upgrade 2: Tobit</Link>
          <Link href="/learn/california-housing-capstone/model-selection" style={{ ...navLink, fontWeight: 600 }}>Next up · Final model selection →</Link>
        </div>
      </div>
    </article>
  );
}

const code = `from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance, partial_dependence
from sklearn.model_selection import cross_val_predict, KFold

gb = HistGradientBoostingRegressor(
    max_iter=400, learning_rate=0.05,
    max_leaf_nodes=31, l2_regularization=1.0, random_state=0)

# trees need no scaling; feed cleaned features + the spatial ones
pred = cross_val_predict(gb, X_spatial, y, cv=KFold(5, shuffle=True, random_state=0))
print("R2:", r2_score(y, pred))                       # 0.843

gb.fit(X_tr, y_tr)
imp = permutation_importance(gb, X_ho, y_ho, n_repeats=5, random_state=0)
pdp = partial_dependence(gb, X_ho, ["IncomeLevel"], grid_resolution=10)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, margin: 0 };
const cap: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 };
