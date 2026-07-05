"use client";

import { useMemo, useState } from "react";

// Elastic-net = a blend of the Lasso diamond and the Ridge circle. The constraint
// region is {β : (1-α)/2·‖β‖² + α·‖β‖₁ ≤ t}. Slide the mix α from 0 (pure ridge,
// a round ball → no sparsity) to 1 (pure lasso, a sharp diamond → corner solutions).
// The elliptical loss contours (tilted because the two features are correlated) are
// minimized where the smallest ellipse touches the region — at a corner when α is high.

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const BHAT: [number, number] = [1.15, 0.55];    // OLS solution (unconstrained min)
// loss metric Q (tilted ellipses ⇒ correlated features)
const Q = [[1, 0.82], [0.82, 1]];
const loss = (b1: number, b2: number) => {
  const d1 = b1 - BHAT[0], d2 = b2 - BHAT[1];
  return Q[0][0] * d1 * d1 + 2 * Q[0][1] * d1 * d2 + Q[1][1] * d2 * d2;
};

// boundary radius in direction θ for constraint budget t
function radius(theta: number, alpha: number, t: number) {
  const cx = Math.cos(theta), sy = Math.sin(theta);
  const a2 = (1 - alpha) / 2;                 // quadratic coeff
  const b1 = alpha * (Math.abs(cx) + Math.abs(sy));
  if (a2 < 1e-6) return t / (b1 || 1e-6);     // pure L1
  return (-b1 + Math.sqrt(b1 * b1 + 4 * a2 * t)) / (2 * a2);
}

export function ElasticNetMixLab() {
  const [alpha, setAlpha] = useState(0.5);   // l1_ratio
  const [t, setT] = useState(1.0);           // budget (∝ 1/λ)

  const N = 160;
  const boundary = useMemo(() => {
    return Array.from({ length: N + 1 }, (_, i) => {
      const th = (i / N) * 2 * Math.PI;
      const r = radius(th, alpha, t);
      return [r * Math.cos(th), r * Math.sin(th)] as [number, number];
    });
  }, [alpha, t]);

  // constrained optimum = boundary point with least loss (fine sample)
  const sol = useMemo(() => {
    let best = boundary[0], bl = Infinity;
    for (const p of boundary) { const l = loss(p[0], p[1]); if (l < bl) { bl = l; best = p; } }
    return best;
  }, [boundary]);
  const sparse1 = Math.abs(sol[0]) < 0.06, sparse2 = Math.abs(sol[1]) < 0.06;
  const nnz = (sparse1 ? 0 : 1) + (sparse2 ? 0 : 1);

  // ---- drawing ----
  const W = 300, H = 300, cx = W / 2, cy = H / 2, scale = 78;
  const sx = (b: number) => r3(cx + b * scale);
  const sy = (b: number) => r3(cy - b * scale);
  const contours = [0.15, 0.5, 1.0, 1.7].map((k) => {
    // ellipse of loss=k around BHAT: sample param
    return Array.from({ length: 60 }, (_, i) => {
      const th = (i / 59) * 2 * Math.PI;
      // solve loss(BHAT+ r u)=k along direction u
      const u1 = Math.cos(th), u2 = Math.sin(th);
      const a = Q[0][0] * u1 * u1 + 2 * Q[0][1] * u1 * u2 + Q[1][1] * u2 * u2;
      const r = Math.sqrt(k / a);
      return `${sx(BHAT[0] + r * u1)},${sy(BHAT[1] + r * u2)}`;
    }).join(" ");
  });
  const name = alpha < 0.08 ? "Ridge (L2)" : alpha > 0.92 ? "Lasso (L1)" : "Elastic-net";

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={head}>The elastic-net constraint region</span>
        <span style={{ fontSize: 12, color: name === "Elastic-net" ? "var(--c-regression)" : "var(--muted)", fontFamily: "var(--font-display)" }}>{name}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", margin: "0 auto" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="var(--border-strong)" strokeWidth={0.6} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="var(--border-strong)" strokeWidth={0.6} />
        {/* loss contours */}
        {contours.map((pts, i) => <polyline key={i} points={pts} fill="none" stroke="var(--faint)" strokeWidth={0.9} strokeOpacity={0.7} />)}
        {/* constraint region */}
        <polygon points={boundary.map((p) => `${sx(p[0])},${sy(p[1])}`).join(" ")} fill="color-mix(in srgb, var(--c-regression) 16%, transparent)" stroke="var(--c-regression)" strokeWidth={2} />
        {/* OLS solution */}
        <circle cx={sx(BHAT[0])} cy={sy(BHAT[1])} r={3} fill="var(--faint)" />
        <text x={sx(BHAT[0]) + 5} y={sy(BHAT[1]) - 4} fontSize={8} fill="var(--faint)">OLS β̂</text>
        {/* constrained solution */}
        <circle cx={sx(sol[0])} cy={sy(sol[1])} r={4.5} fill="var(--c-regression)" stroke="var(--surface)" strokeWidth={1} />
        <text x={12} y={cy - 5} fontSize={8} fill="var(--faint)">β₁</text>
        <text x={cx + 5} y={13} fontSize={8} fill="var(--faint)">β₂</text>
        {(sparse1 || sparse2) && <text x={sx(sol[0]) + 6} y={sy(sol[1]) + 3} fontSize={8} fill="var(--good)">corner → sparse</text>}
      </svg>

      <div style={{ marginTop: 12 }}>
        <label style={lbl}>mix α (l1_ratio): <b style={{ color: "var(--ink)" }}>{alpha.toFixed(2)}</b> <span style={{ color: "var(--faint)" }}>· 0 = ridge, 1 = lasso</span></label>
        <input type="range" min={0} max={1} step={0.01} value={alpha} onChange={(e) => setAlpha(+e.target.value)} style={slider} />
        <label style={lbl}>budget t <span style={{ color: "var(--faint)" }}>(larger = weaker λ)</span></label>
        <input type="range" min={0.35} max={1.8} step={0.01} value={t} onChange={(e) => setT(+e.target.value)} style={slider} />
      </div>

      <div style={{ display: "flex", gap: 18, margin: "6px 0 2px" }}>
        <S label="β₁, β₂" value={`${sol[0].toFixed(2)}, ${sol[1].toFixed(2)}`} />
        <S label="nonzero coefs" value={`${nnz} / 2`} color={nnz < 2 ? "var(--good)" : "var(--ink)"} />
      </div>

      <div style={caption}>
        The blue region is the elastic-net budget; the gray ellipses are the loss, centered on the unpenalized
        OLS estimate. The solution is where the smallest ellipse first touches the region. Slide α toward{" "}
        <strong>0</strong> and the region rounds into ridge&rsquo;s <strong>circle</strong> — the touch point drifts but
        both coefficients stay nonzero. Slide toward <strong>1</strong> and it sharpens into lasso&rsquo;s{" "}
        <strong>diamond</strong>, so the ellipse snaps to a <strong style={{ color: "var(--good)" }}>corner</strong>{" "}
        and a coefficient becomes exactly zero. Elastic-net lives in between: rounded corners keep <em>some</em>{" "}
        sparsity while sharing weight across the correlated pair — lasso&rsquo;s weakness, fixed.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, color: "var(--muted)", margin: "6px 0 2px" };
const slider: React.CSSProperties = { width: "100%", accentColor: "var(--c-regression)" };
