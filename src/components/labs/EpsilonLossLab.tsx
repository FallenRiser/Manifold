"use client";

import { useState } from "react";

// The epsilon-insensitive loss, made draggable. It plots three loss shapes over
// the residual r = y - f(x): squared error r^2, absolute error |r|, and SVR's
// epsilon-insensitive loss max(0, |r| - eps) — flat and free inside [-eps, eps],
// then linear outside. Drag eps to widen the free zone. All coordinates are
// closed-form in the slider value (no transcendentals), so it is SSR-safe with
// rounded coords and needs no mount-gate.

const ACCENT = "var(--c-regression)";

export function EpsilonLossLab() {
  const [eps, setEps] = useState(0.9);

  const W = 380, H = 250, padX = 30, padY = 24;
  const RMAX = 3;            // residual axis runs -3..3
  const LMAX = 3;            // loss axis runs 0..3
  const px = (r: number) => Math.round((W / 2 + (r / RMAX) * (W / 2 - padX)) * 100) / 100;
  const py = (l: number) => Math.round((H - padY - (l / LMAX) * (H - 2 * padY)) * 100) / 100;

  // sample each loss across the residual axis
  const xs: number[] = [];
  for (let k = 0; k <= 120; k++) xs.push(-RMAX + (2 * RMAX * k) / 120);
  const line = (f: (r: number) => number) =>
    xs.map((r) => `${px(r)},${py(Math.min(LMAX, f(r)))}`).join(" ");

  const sq = line((r) => r * r);
  const abs = line((r) => Math.abs(r));
  const ei = line((r) => Math.max(0, Math.abs(r) - eps));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Three loss functions on the residual</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>drag ε to widen the free zone</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* free-zone band [-eps, eps] */}
        <rect x={px(-eps)} y={padY} width={px(eps) - px(-eps)} height={H - 2 * padY}
          fill="color-mix(in srgb, var(--c-regression) 10%, transparent)" />
        {/* axes */}
        <line x1={px(-RMAX)} y1={py(0)} x2={px(RMAX)} y2={py(0)} stroke="var(--border-strong)" strokeWidth={1} />
        <line x1={px(0)} y1={padY} x2={px(0)} y2={H - padY} stroke="var(--border-strong)" strokeWidth={1} />
        {/* loss curves */}
        <polyline points={sq} fill="none" stroke="var(--faint)" strokeWidth={1.8} strokeDasharray="5 3" />
        <polyline points={abs} fill="none" stroke="var(--muted)" strokeWidth={1.8} strokeDasharray="2 3" />
        <polyline points={ei} fill="none" stroke={ACCENT} strokeWidth={2.6} />
        {/* eps ticks */}
        <line x1={px(eps)} y1={py(0) - 4} x2={px(eps)} y2={py(0) + 4} stroke={ACCENT} strokeWidth={1.5} />
        <line x1={px(-eps)} y1={py(0) - 4} x2={px(-eps)} y2={py(0) + 4} stroke={ACCENT} strokeWidth={1.5} />
      </svg>

      <div style={{ display: "flex", gap: 16, fontSize: 11.5, marginTop: 6, flexWrap: "wrap" }}>
        <Key color={ACCENT} solid label="ε-insensitive: max(0, |r| − ε)" />
        <Key color="var(--muted)" label="absolute: |r|" />
        <Key color="var(--faint)" label="squared: r²" />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
        <span style={{ minWidth: 118 }}>ε (free zone): <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{eps.toFixed(1)}</b></span>
        <input type="range" min={0} max={2} step={0.1} value={eps} onChange={(e) => setEps(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="epsilon free zone half-width" />
      </label>

      <div style={caption}>
        Inside the shaded band <M>|r| ≤ ε</M> the ε-insensitive loss is <strong>flat at zero</strong> — those errors
        are free, so points there become no one&rsquo;s problem and drop out of the model. Outside, it rises only{" "}
        <strong>linearly</strong>, like <M>|r|</M> — so a far-off outlier is penalised in proportion, not by its
        square. That flat bottom is where <em>sparsity</em> comes from; the linear (not quadratic) tails are where{" "}
        <em>robustness</em> comes from. Set ε = 0 and it collapses to plain absolute-error loss.
      </div>
    </div>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em", color: "var(--ink)" }}>{children}</span>;
}

function Key({ color, label, solid }: { color: string; label: string; solid?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--muted)" }}>
      <svg width={18} height={8}><line x1={0} y1={4} x2={18} y2={4} stroke={color} strokeWidth={solid ? 2.6 : 1.8} strokeDasharray={solid ? undefined : "3 2"} /></svg>
      {label}
    </span>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
