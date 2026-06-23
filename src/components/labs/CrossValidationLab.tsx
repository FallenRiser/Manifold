"use client";

import { useState } from "react";

// As model complexity (polynomial degree) rises, training error keeps falling — the model
// memorises noise. Validation error follows a U: it drops while the model learns real signal,
// then climbs as it overfits. The bottom of the U is the right complexity.
const DMAX = 12;

// stylised error curves (arbitrary units) — train monotone down, validation U-shaped
function trainErr(d: number) { return 0.9 * Math.exp(-d * 0.42) + 0.04; }
function valErr(d: number) { return 0.9 * Math.exp(-d * 0.42) + 0.04 + 0.012 * Math.pow(Math.max(0, d - 3), 2.1); }

export function CrossValidationLab() {
  const [deg, setDeg] = useState(3);

  // find the validation minimum
  let best = 1, bestV = Infinity;
  for (let d = 1; d <= DMAX; d++) if (valErr(d) < bestV) { bestV = valErr(d); best = d; }

  const W = 320, H = 190;
  const px = (d: number) => 30 + ((d - 1) / (DMAX - 1)) * (W - 50);
  const emax = valErr(DMAX) * 1.05;
  const py = (e: number) => Math.round((H - 26 - (e / emax) * (H - 44)) * 100) / 100;
  const line = (f: (d: number) => number) => Array.from({ length: DMAX }, (_, i) => `${i === 0 ? "M" : "L"}${px(i + 1).toFixed(1)},${py(f(i + 1)).toFixed(1)}`).join(" ");

  const regime = deg < best ? { t: "underfitting (high bias)", c: "var(--warn)" } : deg > best ? { t: "overfitting (high variance)", c: "var(--bad)" } : { t: "the sweet spot", c: "var(--good)" };

  return (
    <div style={wrap}>
      <div style={head}>Train vs validation error</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={px(best)} y1={12} x2={px(best)} y2={H - 26} stroke="var(--good)" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.6} />
        <path d={line(trainErr)} fill="none" stroke="var(--c-regression)" strokeWidth={2} />
        <path d={line(valErr)} fill="none" stroke="var(--brand)" strokeWidth={2} />
        <line x1={px(deg)} y1={12} x2={px(deg)} y2={H - 26} stroke={regime.c} strokeWidth={1.6} />
        <circle cx={px(deg)} cy={py(trainErr(deg))} r={4} fill="var(--c-regression)" />
        <circle cx={px(deg)} cy={py(valErr(deg))} r={4} fill="var(--brand)" />
        <text x={W - 16} y={py(trainErr(DMAX)) + 4} fontSize={9.5} fill="var(--c-regression)" textAnchor="end">train</text>
        <text x={W - 16} y={py(valErr(DMAX)) - 4} fontSize={9.5} fill="var(--brand)" textAnchor="end">validation</text>
        <text x={W / 2} y={H - 8} fontSize={10} fill="var(--faint)" textAnchor="middle">model complexity (degree) →</text>
      </svg>
      <div style={{ display: "flex", gap: 16, margin: "8px 0 2px" }}>
        <S label="degree" value={String(deg)} />
        <S label="regime" value={regime.t} color={regime.c} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={rowLbl}><span>Polynomial degree</span><span style={mono}>{deg}</span></div>
        <input type="range" min={1} max={DMAX} step={1} value={deg}
          onChange={(e) => setDeg(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: regime.c, cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        Training error always improves with complexity — that's why you can't trust it alone.
        Cross-validation finds the dip in the purple curve (degree {best} here): complex enough
        to learn, simple enough to generalise.
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
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 12 };
const rowLbl: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
