"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// How an eigenvector is actually computed, end to end: power iteration. Start
// with any vector, repeatedly multiply by Σ and renormalise to unit length, and
// it swings toward the top eigenvector — because each multiply stretches most
// along the highest-variance direction. Watch the estimate converge to PC1, the
// Rayleigh quotient climb to λ₁, and the angle-to-truth fall to zero.

const S: [[number, number], [number, number]] = [[3.0, 1.3], [1.3, 1.2]];

// true top eigenvector/value of the fixed 2×2 Σ (analytic)
function topEig() {
  const a = S[0][0], b = S[0][1], c = S[1][1];
  const tr = a + c, d = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l1 = tr / 2 + d;
  const ang = 0.5 * Math.atan2(2 * b, a - c);
  return { l1, ang };
}

const VW = 380, VH = 380, CX = 190, CY = 190, R = 120;

export function PowerIterationLab() {
  const { l1, ang: trueAng } = useMemo(topEig, []);
  const [theta, setTheta] = useState(1.15); // current estimate direction
  const [iter, setIter] = useState(0);
  const timer = useRef<number | null>(null);

  const step = () => {
    setTheta((t) => {
      const vx = Math.cos(t), vy = Math.sin(t);
      const wx = S[0][0] * vx + S[0][1] * vy;
      const wy = S[1][0] * vx + S[1][1] * vy;
      return Math.atan2(wy, wx);
    });
    setIter((n) => n + 1);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const run = () => {
    if (timer.current) return;
    let k = 0;
    timer.current = window.setInterval(() => {
      step();
      if (++k >= 8) { clearInterval(timer.current!); timer.current = null; }
    }, 260);
  };
  const reset = (rand?: boolean) => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setTheta(rand ? Math.random() * Math.PI * 2 : 1.15);
    setIter(0);
  };

  const vx = Math.cos(theta), vy = Math.sin(theta);
  const wx = S[0][0] * vx + S[0][1] * vy, wy = S[1][0] * vx + S[1][1] * vy;
  const rayleigh = vx * wx + vy * wy; // vᵀΣv (v is unit)
  // angle between estimate and true PC1 (a line, so fold to [0,90])
  let ad = Math.abs(((theta - trueAng) * 180 / Math.PI) % 180);
  if (ad > 90) ad = 180 - ad;
  const wlen = Math.hypot(wx, wy);
  const f = (n: number) => n.toFixed(1);
  const dim = "var(--c-dimred)";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>
        Power iteration: v ← Σv / ‖Σv‖
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", margin: "0 auto" }}>
        <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
        {/* true PC1 line */}
        <line x1={f(CX - Math.cos(trueAng) * R * 1.1)} y1={f(CY + Math.sin(trueAng) * R * 1.1)} x2={f(CX + Math.cos(trueAng) * R * 1.1)} y2={f(CY - Math.sin(trueAng) * R * 1.1)} stroke="var(--ink)" strokeWidth={1.4} strokeDasharray="5 4" strokeOpacity={0.5} />
        <text x={f(CX + Math.cos(trueAng) * R * 1.1 + 4)} y={f(CY - Math.sin(trueAng) * R * 1.1)} fontSize={10.5} fill="var(--muted)">true PC1</text>

        {/* Σv (before normalising) */}
        <line x1={CX} y1={CY} x2={f(CX + wx * R / l1)} y2={f(CY - wy * R / l1)} stroke="var(--brand-3)" strokeWidth={2} strokeOpacity={0.7} />
        <text x={f(CX + wx * R / l1)} y={f(CY - wy * R / l1 - 6)} fontSize={10.5} fill="var(--brand-3)">Σv</text>

        {/* current estimate v (unit) */}
        <line x1={CX} y1={CY} x2={f(CX + vx * R)} y2={f(CY - vy * R)} stroke={dim} strokeWidth={3} strokeLinecap="round" />
        <circle cx={f(CX + vx * R)} cy={f(CY - vy * R)} r={6} fill="var(--surface)" stroke={dim} strokeWidth={2.5} />
        <text x={f(CX + vx * R)} y={f(CY - vy * R - 10)} fontSize={11} fill={dim} fontWeight={600}>v</text>
        <circle cx={CX} cy={CY} r={3} fill="var(--ink)" />
      </svg>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label="iteration" value={`${iter}`} />
        <Metric label="Rayleigh vᵀΣv" value={rayleigh.toFixed(3)} accent={dim} sub={`→ λ₁ = ${l1.toFixed(3)}`} />
        <Metric label="angle to PC1" value={`${ad.toFixed(1)}°`} accent="var(--good)" sub="→ 0°" />
        <div style={{ flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button onClick={step} style={btnPrimary}>Step ×1</button>
        <button onClick={run} style={btnGhost}>Run ×8</button>
        <button onClick={() => reset(true)} style={btnGhost}>Random start</button>
        <button onClick={() => reset(false)} style={btnGhost}>Reset</button>
        <span style={{ fontSize: 11.5, color: "var(--faint)", alignSelf: "center" }}>‖Σv‖ = {wlen.toFixed(2)}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "var(--cta-text)", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 12px", borderRadius: 10, cursor: "pointer" };
