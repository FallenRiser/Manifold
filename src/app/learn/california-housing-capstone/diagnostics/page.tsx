import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "Capstone: diagnostics — what the linear model misses — Manifold",
  description:
    "Reading the fitted ridge model: standardized coefficients show geography outweighs income, and residual analysis exposes three concrete weaknesses — non-linear geography, the censored target, and missing interactions — each motivating an upgrade.",
};

const COEF = [
  { f: "Latitude", c: -0.915 }, { f: "Longitude", c: -0.848 }, { f: "IncomeLevel", c: 0.780 },
  { f: "RoomsPerHousehold", c: 0.496 }, { f: "TotalRooms", c: -0.234 }, { f: "BedroomsRatio", c: 0.207 },
  { f: "PropertyAge", c: 0.129 }, { f: "NeighborhoodPop", c: 0.053 }, { f: "AvgOccupancy", c: 0.039 }, { f: "TotalBedrooms", c: -0.033 },
];

function CoefFig() {
  const W = 340, H = 220, padL = 110;
  const mid = padL + (W - padL - 16) / 2, half = (W - padL - 16) / 2, rowH = (H - 16) / COEF.length, max = 1.0;
  const bx = (c: number) => Math.round((mid + (c / max) * half) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      <line x1={mid} y1={8} x2={mid} y2={H - 8} stroke="var(--border-strong)" strokeWidth={0.8} />
      {COEF.map((d, i) => {
        const y = 12 + i * rowH, pos = d.c >= 0, x0 = Math.min(mid, bx(d.c)), w = Math.abs(bx(d.c) - mid);
        return (
          <g key={d.f}>
            <text x={padL - 6} y={y + rowH / 2 + 2} fontSize={8} fill="var(--muted)" textAnchor="end">{d.f}</text>
            <rect x={Math.round(x0 * 100) / 100} y={Math.round((y + 1.5) * 100) / 100} width={Math.round(w * 100) / 100} height={Math.round((rowH - 4) * 100) / 100} fill={pos ? "var(--c-trees)" : "var(--bad, #d9534f)"} fillOpacity={0.75} rx={1.5} />
            <text x={pos ? bx(d.c) + 3 : bx(d.c) - 3} y={y + rowH / 2 + 2} fontSize={7.5} fill="var(--muted)" textAnchor={pos ? "start" : "end"}>{d.c.toFixed(2)}</text>
          </g>
        );
      })}
      <text x={mid - half / 2} y={H - 1} fontSize={7.5} fill="var(--faint)" textAnchor="middle">cheaper ←</text>
      <text x={mid + half / 2} y={H - 1} fontSize={7.5} fill="var(--faint)" textAnchor="middle">→ pricier</text>
    </svg>
  );
}

export default function DiagnosticsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "3 · The linear baseline", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Diagnostics: what it misses</>}
        intro={<>
          A score is not understanding. Reading the coefficients and dissecting the residuals turns the baseline
        into a to-do list: three specific weaknesses, each of which becomes one of the next three pages.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What the model learned</h2>
        <p>Because we standardized, the ridge coefficients are directly comparable — price change (in $100k) per
          one-standard-deviation change in each feature, holding the rest fixed.</p>
        <div style={figWrap}>
          <CoefFig />
          <div style={cap}>Standardized ridge coefficients. Green raises price, red lowers it. The two biggest
            drivers are <strong>geographic</strong>, ahead of income.</div>
        </div>
        <ul style={ul}>
          <li><strong>Geography dominates</strong> — Latitude (−0.92) and Longitude (−0.85) are larger than income. Prices fall going north and inland: the California coast-and-south premium, captured as a linear tilt.</li>
          <li><strong>Income is the top non-geographic driver</strong> (+0.78), exactly as EDA promised.</li>
          <li><strong>Rooms-per-household up (+0.50), total rooms down (−0.23)</strong> — read together, this disentangles &ldquo;spacious homes&rdquo; from &ldquo;dense, apartment-heavy blocks,&rdquo; which is why the ratio feature earns its place.</li>
        </ul>

        <h2>Where it fails: residual analysis</h2>
        <p>On a clean 20% holdout, ridge scores R² = 0.656, RMSE = 0.671 — consistent with CV. But splitting the
          residuals reveals where the error hides:</p>
        <CodeOutput>{`holdout ridge:  R2 = 0.656   RMSE = 0.671

residuals split by the 5.0 cap:
  RMSE on non-capped blocks :  0.605
  RMSE on capped blocks     :  1.528     <- 2.5x worse
  mean residual at cap      : +1.041     <- under-predicts by ~$104k`}</CodeOutput>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            The three diagnoses — and the three upgrades they demand
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 6px" }}><strong>1 · Geography is non-linear.</strong> The map (EDA) is curved
              and clustered, but the model can only tilt a plane across it — and lat/long had near-zero linear
              correlation despite dominating the fit. <em>→ Upgrade 1: spatial features.</em></p>
            <p style={{ margin: "0 0 6px" }}><strong>2 · The target is censored.</strong> Predicted exactly as on
              the framing page: error at the cap is 2.5× higher, and the +1.04 mean residual shows systematic
              under-prediction of expensive blocks — information destroyed when prices were clipped to 5.0.{" "}
              <em>→ Upgrade 2: a Tobit model.</em></p>
            <p style={{ margin: 0 }}><strong>3 · Interactions are unmodelled.</strong> A linear model adds effects
              independently, but income&rsquo;s effect surely <em>depends</em> on location. The residuals still hold
              spatial and interaction structure. <em>→ Upgrade 3: gradient boosting.</em></p>
          </div>
        </div>

        <p>
          This is the senior move: not &ldquo;the model scores 0.67,&rdquo; but &ldquo;here are three named reasons it isn&rsquo;t
          higher, and here&rsquo;s the specific fix for each.&rdquo; The rest of the capstone executes that plan.
        </p>

        <DecisionPoint
          question={<>Three diagnosed weaknesses, limited time. Which fix do you attempt first?</>}
          options={[
            {
              label: "Spatial features — engineer distance-to-coast, metros, regions",
              verdict: "best",
              response: <>It attacks the largest diagnosed structure (geography dominates the coefficients <em>and</em> the residuals), it&rsquo;s cheap to build, and it keeps the model linear and interpretable — which framing said the stakeholders need. Fix the biggest named problem first, with the smallest tool that can fix it.</>,
            },
            {
              label: "Skip ahead — throw gradient boosting at it now",
              verdict: "close",
              response: <>It would win on score immediately (we&rsquo;ll see it hits mid-0.80s). But you&rsquo;d never learn <em>which</em> problem the trees solved, you&rsquo;d abandon the interpretability requirement without testing the linear ceiling, and you couldn&rsquo;t justify the complexity to stakeholders. The ladder is the argument.</>,
            },
            {
              label: "Fix the censoring first — it biases every coefficient",
              verdict: "close",
              response: <>Principled — the cap bias is real and measured (+1.04 mean residual). But it directly affects 4.9% of rows, while the geographic non-linearity distorts the fit <em>everywhere</em>. We do fix it (Upgrade 2), right after the bigger win.</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/california-housing-capstone/linear-models", label: <>← Baseline &amp; regularized models</> }} next={{ href: "/learn/california-housing-capstone/spatial-features", label: <>Next up · Upgrade 1: spatial feature engineering →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" };
const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 };
