"use client";

import { useState } from "react";

// A multiplicative / exponential relationship curves on raw axes — a straight line fits
// it badly. Take the log of y and the same data becomes linear, so OLS works again.
const N = 24;
const RAW = Array.from({ length: N }, (_, i) => {
  const x = 1 + (i / (N - 1)) * 5;          // 1..6
  const y = 8 * Math.exp(0.5 * x) * (1 + Math.sin(i * 2.1) * 0.08);  // exponential + jitter
  return { x, y };
});

export function TransformationLab() {
  const [log, setLog] = useState(false);

  const pts = RAW.map((p) => ({ x: p.x, y: log ? Math.log(p.y) : p.y }));
  // OLS fit on whatever is currently shown
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0, sxx = 0;
  for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; }
  const b = sxy / sxx, a = my - b * mx;
  const ss = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const sse = pts.reduce((s, p) => s + (p.y - (a + b * p.x)) ** 2, 0);
  const r2 = 1 - sse / ss;

  const W = 300, H = 200;
  const ymin = Math.min(...pts.map((p) => p.y)), ymax = Math.max(...pts.map((p) => p.y));
  const cx = (x: number) => Math.round((24 + ((x - 1) / 5) * (W - 44)) * 100) / 100;
  const cy = (y: number) => Math.round((H - 22 - ((y - ymin) / (ymax - ymin)) * (H - 42)) * 100) / 100;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={head}>Straightening a curve with a log transform</span>
        <button onClick={() => setLog((v) => !v)} style={btn(log)}>{log ? "showing log(y)" : "showing raw y"}</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={cx(1)} y1={cy(a + b * 1)} x2={cx(6)} y2={cy(a + b * 6)} stroke="var(--brand)" strokeWidth={2} />
        {pts.map((p, i) => <circle key={i} cx={cx(p.x)} cy={cy(p.y)} r={3.5} fill={log ? "var(--good)" : "var(--warn)"} fillOpacity={0.85} />)}
        <text x={W / 2} y={H - 6} fontSize={10} fill="var(--faint)" textAnchor="middle">x →</text>
        <text x={12} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>{log ? "log(y)" : "y"} →</text>
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        <S label="line R²" value={r2.toFixed(3)} color={r2 > 0.95 ? "var(--good)" : "var(--warn)"} />
        <S label="fit quality" value={r2 > 0.95 ? "excellent" : "poor (curved)"} color={r2 > 0.95 ? "var(--good)" : "var(--warn)"} />
      </div>
      <div style={caption}>
        {log
          ? `In log space the exponential growth becomes a straight line — R² jumps to ${r2.toFixed(2)}. Now linear regression is the right tool.`
          : `On raw axes the data bends away from the line; R² is only ${r2.toFixed(2)} and the residuals are systematically wrong. Toggle the log transform.`}
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
function btn(active: boolean): React.CSSProperties {
  return { fontSize: 12, fontFamily: "ui-monospace, monospace", padding: "5px 11px", borderRadius: 999, cursor: "pointer", border: "1px solid var(--brand)", background: active ? "var(--brand)" : "transparent", color: active ? "white" : "var(--brand)" };
}
