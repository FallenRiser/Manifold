"use client";

import { useState } from "react";

// The gap between what you measure and what you want — and the exact moment it
// stops behaving.
//
// Mode "one fixed hypothesis": a single h whose TRUE risk is 0.50. Each sample
// of size n gives an empirical risk that wobbles around 0.50 inside Hoeffding's
// 95% band, and the band tightens like 1/sqrt(n). This is the reassuring story.
//
// Mode "best of 1000": a thousand hypotheses, ALL of them worthless coin flips
// with true risk 0.50, and we report whichever one looked best on the sample.
// Its score sits far below 0.50 and lands OUTSIDE the single-hypothesis band.
// Nothing was overfit and no hypothesis is any good — selection alone broke the
// guarantee.
//
// Why these constants: the reported minimum sits about z_M * sigma below the
// mean, where sigma = 0.5/sqrt(n) and z_M ~ 3.09 for M = 1000. So the bias is
// ~1.55/sqrt(n) against a band of sqrt(ln(2/delta)/2n) = ~1.36/sqrt(n). BOTH
// scale as 1/sqrt(n), so the violation holds at every sample size on the
// slider — which is the real lesson: more data does not fix selection bias.
// The wider union-bound band, sqrt((ln M + ln(2/delta))/2n), does contain it,
// previewing the repair that the next page derives.
//
// Deterministic mulberry32 throughout: the initial render is identical on the
// server and the client, so there's no hydration surface.

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRUE_RISK = 0.5;
const M_MANY = 1000;
const DELTA = 0.05;

const VW = 380, VH = 132;
const X0 = 16, X1 = VW - 16;
const AX_Y = 76;
const R_MAX = 0.8;
const rx = (r: number) => X0 + (Math.max(0, Math.min(R_MAX, r)) / R_MAX) * (X1 - X0);
const fx = (r: number) => Number(rx(r).toFixed(2));

export function EmpiricalRiskLab() {
  const [n, setN] = useState(200);
  const [seed, setSeed] = useState(1);
  const [many, setMany] = useState(false);

  const accent = "var(--c-metrics)";

  // Hoeffding's two-sided 95% band for ONE hypothesis, and the union-bound band
  // that would be honest if you searched M of them.
  const band = Math.sqrt(Math.log(2 / DELTA) / (2 * n));
  const unionBand = Math.sqrt((Math.log(M_MANY) + Math.log(2 / DELTA)) / (2 * n));

  const riskOf = (s: number) => {
    const rand = mulberry32(s);
    let errs = 0;
    for (let i = 0; i < n; i++) if (rand() < TRUE_RISK) errs++;
    return errs / n;
  };

  let shown: number;
  if (many) {
    let best = Infinity;
    for (let m = 0; m < M_MANY; m++) best = Math.min(best, riskOf(seed * 100003 + m));
    shown = best;
  } else {
    shown = riskOf(seed);
  }

  const gap = Math.abs(shown - TRUE_RISK);
  const inside = gap <= band;
  const insideUnion = gap <= unionBand;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Measured risk vs true risk
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        every hypothesis here is a coin flip — true risk exactly {TRUE_RISK.toFixed(2)}
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 380, height: "auto", display: "block" }}>
        {/* the honest band once you account for searching M hypotheses */}
        {many && (
          <rect
            x={fx(TRUE_RISK - unionBand)} y={AX_Y - 22}
            width={Number((rx(TRUE_RISK + unionBand) - rx(TRUE_RISK - unionBand)).toFixed(2))}
            height={44} rx={5} fill={accent} fillOpacity={0.09}
          />
        )}
        {/* the band you'd have used for a single hypothesis */}
        <rect
          x={fx(TRUE_RISK - band)} y={AX_Y - 22}
          width={Number((rx(TRUE_RISK + band) - rx(TRUE_RISK - band)).toFixed(2))}
          height={44} rx={5} fill={accent} fillOpacity={0.16}
        />

        {/* captions pinned to the left rail so they can never collide with the
            R-hat readout, which tracks the marker horizontally */}
        <text x={X0} y={13} fontSize={9.5} fill="var(--muted)" textAnchor="start">
          ▉ 95% band for one h
        </text>
        {many && (
          <text x={X0} y={25} fontSize={9.5} fill="var(--faint)" textAnchor="start">
            ▉ honest band after searching {M_MANY.toLocaleString()}
          </text>
        )}

        {/* axis */}
        <line x1={X0} y1={AX_Y} x2={X1} y2={AX_Y} stroke="var(--border-strong)" strokeWidth={1} />
        {[0, 0.2, 0.4, 0.6, 0.8].map((v) => (
          <g key={v}>
            <line x1={fx(v)} y1={AX_Y} x2={fx(v)} y2={AX_Y + 4} stroke="var(--border-strong)" />
            <text x={fx(v)} y={AX_Y + 15} fontSize={9.5} fill="var(--faint)" textAnchor="middle">{v.toFixed(1)}</text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={AX_Y + 28} fontSize={10} fill="var(--muted)" textAnchor="middle">risk</text>

        {/* true risk marker */}
        <line x1={fx(TRUE_RISK)} y1={AX_Y - 20} x2={fx(TRUE_RISK)} y2={AX_Y + 20} stroke="var(--ink)" strokeWidth={2} />
        <text x={fx(TRUE_RISK)} y={AX_Y + 40} fontSize={10} fill="var(--ink)" textAnchor="middle">R(h) = 0.50</text>

        {/* measured risk marker */}
        <circle cx={fx(shown)} cy={AX_Y} r={6} fill={inside ? "var(--brand-2)" : "var(--bad)"} />
        <text x={fx(shown)} y={AX_Y - 28} fontSize={10} fill={inside ? "var(--brand-2)" : "var(--bad)"} textAnchor="middle">
          R̂ = {shown.toFixed(3)}
        </text>
      </svg>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {[
          { k: false, label: "one fixed hypothesis" },
          { k: true, label: `report the best of ${M_MANY.toLocaleString()}` },
        ].map((m) => (
          <button
            key={String(m.k)}
            onClick={() => setMany(m.k)}
            style={{
              background: many === m.k ? `color-mix(in srgb, ${accent} 15%, var(--surface))` : "transparent",
              color: many === m.k ? "var(--ink)" : "var(--muted)",
              border: `1px solid ${many === m.k ? `color-mix(in srgb, ${accent} 40%, var(--border))` : "var(--border-strong)"}`,
              fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginTop: 10 }}>
        sample size n = {n.toLocaleString()}
        <input type="range" min={25} max={1000} step={25} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ width: "100%", accentColor: accent }} />
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <Metric label="measured gap" value={gap.toFixed(3)} accent={inside ? "var(--brand-2)" : "var(--bad)"} big />
        <Metric label="band for one h" value={band.toFixed(3)} accent={inside ? undefined : "var(--bad)"} sub={inside ? "holds" : "violated"} />
        {many && <Metric label={`band for ${M_MANY.toLocaleString()}`} value={unionBand.toFixed(3)} accent={insideUnion ? "var(--good)" : "var(--bad)"} sub={insideUnion ? "holds" : "violated"} />}
        <div style={{ flex: 1 }} />
        <button onClick={() => setSeed((s) => s + 1)} style={btn}>draw a new sample</button>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent, big }: { label: string; value: string; sub?: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", minWidth: 92 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 19 : 14.5, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
const btn: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12, padding: "5px 10px", borderRadius: 8, cursor: "pointer" };
