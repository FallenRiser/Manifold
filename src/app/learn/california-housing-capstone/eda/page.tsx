import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { HousingGeoMap } from "@/components/figures/HousingGeoMap";

export const metadata = {
  title: "Capstone: EDA — distributions & signal — Manifold",
  description:
    "Exploratory analysis of the housing data: the censored target distribution, the strong near-linear income signal, the dominant non-linear geographic structure, and a correlation ranking of every feature.",
};

const HIST = [40, 1669, 2754, 2978, 2415, 2003, 1391, 814, 782, 399, 304, 963];
const INC_MID = [1.2, 2.3, 2.8, 3.3, 3.8, 4.4, 5.3, 10.5];
const INC_PRICE = [1.13, 1.33, 1.61, 1.83, 2.03, 2.28, 2.61, 3.75];

function HistFig() {
  const W = 320, H = 160, padL = 24, padB = 22, padT = 10;
  const max = Math.max(...HIST), bw = (W - padL - 8) / HIST.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      {HIST.map((c, i) => {
        const h = (c / max) * (H - padT - padB), last = i === HIST.length - 1;
        return <rect key={i} x={Math.round((padL + i * bw + 1) * 100) / 100} y={Math.round((H - padB - h) * 100) / 100} width={Math.round((bw - 2) * 100) / 100} height={Math.round(h * 100) / 100} fill={last ? "var(--bad, #d9534f)" : "var(--c-regression)"} fillOpacity={last ? 0.85 : 0.7} rx={1} />;
      })}
      <text x={Math.round(padL + (HIST.length - 0.5) * bw)} y={26} fontSize={8} fill="var(--bad, #d9534f)" textAnchor="end">cap →</text>
      <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">TargetPrice · 0 → 5.0</text>
    </svg>
  );
}
function IncomeFig() {
  const W = 320, H = 160, padL = 28, padB = 22, padT = 12;
  const sx = (v: number) => Math.round((padL + (v / 11) * (W - padL - 10)) * 100) / 100;
  const sy = (v: number) => Math.round((H - padB - (v / 4) * (H - padT - padB)) * 100) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
      <polyline points={INC_MID.map((m, i) => `${sx(m)},${sy(INC_PRICE[i])}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2.4} />
      {INC_MID.map((m, i) => <circle key={i} cx={sx(m)} cy={sy(INC_PRICE[i])} r={3} fill="var(--c-regression)" />)}
      <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">median income →</text>
      <text x={10} y={H / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`}>mean price</text>
    </svg>
  );
}

export default function EDAPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>2 · Understand the data</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        EDA: distributions & signal
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Exploration has two jobs: find the signal, and find what&rsquo;s broken. This page is the signal; the next is
        the damage. Three pictures tell us most of what a model can hope to learn.
      </p>

      <div className="lesson">
        <h2>The target: skewed and censored</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "1rem 0" }} className="elbow-grid">
          <div style={figWrap}><HistFig /><div style={cap}>Right-skewed, with a hard spike at the 5.0 cap (red).</div></div>
          <div style={figWrap}><IncomeFig /><div style={cap}>Mean price rises almost linearly with block income.</div></div>
        </div>
        <p>
          The distribution confirms two things from framing: a right skew (most blocks modest, a long expensive
          tail) and the <strong>censoring spike</strong> at 5.0. The income panel shows the single strongest
          predictor behaving almost linearly — encouraging for a linear baseline.
        </p>

        <h2>The dominant signal: geography</h2>
        <p>
          Plotting blocks on the map and colouring by price reveals the real structure. It is overwhelmingly{" "}
          <strong>spatial</strong>, and — crucially — <strong>non-linear</strong>: price doesn&rsquo;t rise smoothly
          with latitude or longitude, it spikes around the coast and the two big metros and falls off inland.
        </p>
        <div style={figWrap}>
          <HousingGeoMap height={280} />
          <div style={cap}>Median price by location. The coastal strip and the LA / Bay Area basins are red;
            the inland Central Valley is blue. A straight-line fit on latitude and longitude can only capture a
            crude tilt of this — the first sign the linear model will leave signal behind (Upgrade 1).</div>
        </div>

        <h2>Correlation ranking</h2>
        <p>A quick numeric scan of each feature&rsquo;s linear correlation with price:</p>
        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`correlation of each feature with TargetPrice
  IncomeLevel         0.691
  RoomsPerHousehold   0.213
  TotalRooms          0.158
  PropertyAge         0.102
  AvgOccupancy       -0.022
  NeighborhoodPop    -0.026
  Longitude          -0.046
  TotalBedrooms      -0.051
  Latitude           -0.143
  BedroomsRatio      -0.257`}</CodeOutput>
        <p>
          Income leads at 0.69. Note the trap: latitude and longitude show <em>weak</em> linear correlations
          (−0.14, −0.05) — yet the map screams that location matters most. That gap between &ldquo;weak linear
          correlation&rdquo; and &ldquo;obviously important&rdquo; is the signature of a non-linear relationship, and it&rsquo;s
          exactly why a tree-based model (Upgrade 3) will later rank geography near the top while linear
          correlation buries it.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            What EDA already told us about modeling
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Before fitting anything: income gives a clean linear backbone, the target is censored at the top,
            and geography is the biggest signal but is non-linear and only weakly <em>linearly</em> correlated.
            That single paragraph predicts the entire shape of this project — a decent linear baseline, a known
            cap bias, and large gains waiting from spatial features and a non-linear model.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/framing" style={navLink}>← Framing the problem</Link>
          <Link href="/learn/california-housing-capstone/data-quality" style={{ ...navLink, fontWeight: 600 }}>Next up · Data quality &amp; cleaning →</Link>
        </div>
      </div>
    </article>
  );
}

const code = `num = train.select_dtypes("number").drop(columns=["TargetPrice"])
print(num.corrwith(train["TargetPrice"]).sort_values(ascending=False))`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, margin: 0 };
const cap: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 };
