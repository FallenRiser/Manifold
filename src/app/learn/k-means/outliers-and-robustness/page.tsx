import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Outliers & robustness — Manifold",
  description:
    "The mean is the centroid update, and the mean is not robust. A single extreme point can drag a centroid off its cluster — here's why, and the fixes that keep k-means honest.",
};

// one blob plus a single far outlier; show how the mean (centroid) gets pulled
const BLOB = [
  { x: 30, y: 50 }, { x: 36, y: 44 }, { x: 28, y: 58 }, { x: 40, y: 52 },
  { x: 33, y: 48 }, { x: 38, y: 60 }, { x: 26, y: 46 }, { x: 34, y: 55 },
];
const OUTLIER = { x: 92, y: 50 };
const meanX = (pts: { x: number; y: number }[]) => pts.reduce((s, p) => s + p.x, 0) / pts.length;
const meanY = (pts: { x: number; y: number }[]) => pts.reduce((s, p) => s + p.y, 0) / pts.length;
const cNoOut = { x: meanX(BLOB), y: meanY(BLOB) };
const cWithOut = { x: meanX([...BLOB, OUTLIER]), y: meanY([...BLOB, OUTLIER]) };
const W = 320, H = 150;
const sx = (x: number) => Math.round((16 + (x / 100) * (W - 32)) * 100) / 100;
const sy = (y: number) => Math.round((H - 16 - (y / 100) * (H - 32)) * 100) / 100;

export default function OutliersPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Outliers & robustness
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Means is built on two things that outliers attack directly: squared distance and the mean.
        Knowing exactly where it&rsquo;s fragile tells you when to clean, when to switch methods, and what to
        watch for.
      </p>

      <div className="lesson">
        <h2>Two compounding weaknesses</h2>
        <ul style={ul}>
          <li>
            <strong>Squared distance.</strong> Inertia squares every error, so a point twice as far
            contributes <em>four</em> times the penalty. k-Means works hard to placate far-flung points —
            exactly the ones you often want to ignore.
          </li>
          <li>
            <strong>The mean.</strong> The update step moves each centroid to the mean of its members,
            and the mean has a breakdown point of zero: one arbitrarily extreme value drags it
            arbitrarily far. The median wouldn&rsquo;t budge — but k-means uses the mean.
          </li>
        </ul>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {BLOB.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill="var(--c-clustering)" fillOpacity={0.7} />)}
            <circle cx={sx(OUTLIER.x)} cy={sy(OUTLIER.y)} r={4.5} fill="var(--bad, #d9534f)" />
            <text x={sx(OUTLIER.x)} y={sy(OUTLIER.y) - 8} fontSize={9} fill="var(--bad, #d9534f)" textAnchor="middle">outlier</text>
            {/* centroid without outlier */}
            <path d={`M ${sx(cNoOut.x) - 5} ${sy(cNoOut.y)} L ${sx(cNoOut.x) + 5} ${sy(cNoOut.y)} M ${sx(cNoOut.x)} ${sy(cNoOut.y) - 5} L ${sx(cNoOut.x)} ${sy(cNoOut.y) + 5}`} stroke="var(--good)" strokeWidth={2.4} strokeLinecap="round" />
            {/* centroid with outlier — pulled right */}
            <path d={`M ${sx(cWithOut.x) - 5} ${sy(cWithOut.y)} L ${sx(cWithOut.x) + 5} ${sy(cWithOut.y)} M ${sx(cWithOut.x)} ${sy(cWithOut.y) - 5} L ${sx(cWithOut.x)} ${sy(cWithOut.y) + 5}`} stroke="var(--ink)" strokeWidth={2.4} strokeLinecap="round" />
            <line x1={sx(cNoOut.x)} y1={sy(cNoOut.y)} x2={sx(cWithOut.x)} y2={sy(cWithOut.y)} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 2" />
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            <span style={{ color: "var(--good)" }}>Green ✛</span>: the centroid of the blob alone.{" "}
            <span style={{ color: "var(--ink)" }}>Dark ✛</span>: add one outlier and the mean slides
            toward it — off the cluster it&rsquo;s supposed to represent. A whole centroid can even be
            &ldquo;wasted&rdquo; capturing a handful of outliers.
          </div>
        </div>

        <h2>The fixes, roughly in order</h2>
        <ul style={ul}>
          <li>
            <strong>Detect and remove</strong> obvious outliers before clustering (e.g. drop points
            beyond a sensible distance, or use an outlier detector). Simplest and often enough.
          </li>
          <li>
            <strong>Robust scaling.</strong> Center by the median and scale by the IQR instead of mean/std,
            so the <em>scaling</em> step itself isn&rsquo;t distorted by extremes.
          </li>
          <li>
            <strong>Switch to k-medoids.</strong> Use actual data points (medoids) as centers and minimise
            absolute, not squared, distance — far less sway from extremes. (Its own variant page.)
          </li>
          <li>
            <strong>k-medians.</strong> Replace the mean update with the per-coordinate median — robust by
            construction.
          </li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Outlier, or its own cluster?
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            k-Means has no &ldquo;noise&rdquo; category — every point <em>must</em> join a cluster, so genuine
            outliers get forced in and distort it. If your data has real noise, a method that can label
            points as noise (DBSCAN) may fit better than any robustified k-means. That comparison is the
            &ldquo;when k-means fails&rdquo; chapter.
          </p>
        </div>

        <h2>Robust preprocessing</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/why-scaling-matters" style={navLink}>← Why scaling matters</Link>
          <Link href="/learn/k-means/categorical-and-mixed-data" style={{ ...navLink, fontWeight: 600 }}>Next up · Categorical &amp; mixed data →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# robust scaling: median-center, IQR-scale (resists extreme values)
med = np.median(X, axis=0)
q1, q3 = np.percentile(X, [25, 75], axis=0)
X_robust = (X - med) / (q3 - q1)

# simple distance-based outlier removal before clustering
center = np.median(X, axis=0)
d = np.sqrt(((X - center)**2).sum(1))
keep = d < np.percentile(d, 98)        # drop the farthest 2%
X_clean = X[keep]`;

const codeLib = `from sklearn.preprocessing import RobustScaler
from sklearn.cluster import KMeans
from sklearn.pipeline import make_pipeline

# RobustScaler uses median & IQR instead of mean & std
model = make_pipeline(RobustScaler(),
                      KMeans(n_clusters=3, n_init=10, random_state=0))
labels = model.fit_predict(X)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
