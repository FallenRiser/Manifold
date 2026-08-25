"use client";

import { useState } from "react";

// "Watch a digit emerge from k components." A single handwritten 3 from
// load_digits (64 pixels) reconstructed from its first k principal components.
// Every frame — and its variance-kept / pixel-error readout — is a real run of
// scripts/pca_cases.py (sklearn 1.8, PCA over all 1797 digits, then
// inverse_transform of this one sample). Drag k and see compression trade error
// for storage: 20 of 64 components already read as a clear 3.

// pixel intensities 0..16, row-major 8x8
const ORIGINAL = [0,0,7,15,13,1,0,0,0,8,13,6,15,4,0,0,0,2,1,13,13,0,0,0,0,0,2,15,11,1,0,0,0,0,0,1,12,12,1,0,0,0,0,0,1,10,8,0,0,0,8,4,5,14,9,0,0,0,7,13,13,9,0,0];

// reconstructions keyed by k
const FRAMES: Record<number, number[]> = {
  1: [0,1,9,14,12,7,1,0,0,4,14,10,11,12,2,0,0,4,9,4,10,10,1,0,0,1,5,9,13,8,2,0,0,0,2,6,9,8,3,0,0,0,2,3,4,8,4,0,0,1,8,8,8,11,5,0,0,1,9,14,12,8,3,1],
  2: [0,1,9,14,12,7,1,0,0,4,14,10,11,11,2,0,0,4,9,3,9,10,1,0,0,2,6,9,12,8,2,0,0,0,2,6,8,9,3,0,0,0,2,2,3,9,5,0,0,1,9,8,7,12,5,0,0,0,9,14,13,9,3,1],
  3: [0,1,10,15,11,4,0,0,0,5,15,10,11,9,0,0,0,4,9,4,10,7,0,0,0,1,5,10,12,5,0,0,0,0,2,7,8,6,2,0,0,0,4,4,2,7,5,0,0,1,11,9,7,13,7,0,0,1,10,15,14,11,4,1],
  5: [0,1,8,12,10,4,0,0,0,4,12,10,12,7,0,0,0,4,8,9,13,6,0,0,0,1,6,14,15,5,0,0,0,0,0,7,10,8,1,0,0,0,0,2,4,11,6,0,0,1,8,6,8,16,9,1,0,0,8,13,16,15,5,1],
  8: [0,1,10,14,9,1,0,0,0,5,11,9,12,3,0,0,0,3,5,8,14,3,0,0,0,1,5,14,16,6,0,0,0,0,1,6,10,12,3,0,0,0,0,1,2,11,7,0,0,1,7,5,8,15,8,1,0,1,11,13,16,11,4,1],
  12: [0,1,10,13,12,5,0,0,0,5,10,9,14,3,0,0,0,2,2,9,14,0,0,0,0,0,3,14,13,3,0,0,0,0,1,5,8,12,4,0,0,0,0,1,1,12,8,0,0,1,7,6,8,15,8,0,0,1,11,12,15,11,3,1],
  20: [0,1,9,14,12,2,0,0,0,3,9,9,15,4,0,0,0,1,2,9,14,0,0,0,0,0,3,14,12,1,0,0,0,0,0,4,9,11,3,0,0,1,0,1,1,12,9,0,0,1,7,4,5,12,7,0,0,1,10,14,16,9,2,0],
  30: [0,1,8,14,13,1,0,0,0,6,11,7,14,4,0,0,0,4,2,12,14,0,1,0,0,0,2,15,11,2,1,0,0,0,0,1,12,12,1,0,0,0,2,0,1,10,9,0,0,0,7,5,4,14,8,0,0,0,9,13,14,9,0,0],
  45: [0,1,7,15,13,1,0,0,0,8,13,6,15,4,0,0,0,2,1,13,13,0,0,0,0,0,2,15,11,1,0,0,0,0,0,1,12,12,1,0,0,0,0,0,1,10,8,0,0,0,8,4,5,14,9,0,0,0,7,13,13,9,0,0],
  64: ORIGINAL,
};

const KS = [1, 2, 3, 5, 8, 12, 20, 30, 45, 64];
const VAR: Record<number, number> = { 1: 14.9, 2: 28.5, 3: 40.3, 5: 54.5, 8: 67.4, 12: 78.5, 20: 89.4, 30: 95.9, 45: 99.6, 64: 100 };
const MSE: Record<number, number> = { 1: 15.98, 2: 13.42, 3: 11.21, 5: 8.54, 8: 6.12, 12: 4.04, 20: 1.98, 30: 0.77, 45: 0.08, 64: 0 };

function Grid({ px, size = 132, label }: { px: number[]; size?: number; label: string }) {
  const cell = size / 8;
  return (
    <figure style={{ margin: 0, textAlign: "center" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ borderRadius: 8, background: "var(--canvas)", border: "1px solid var(--border-strong)", display: "block" }}>
        {px.map((v, i) => {
          const r = Math.floor(i / 8), c = i % 8;
          return <rect key={i} x={c * cell} y={r * cell} width={cell + 0.5} height={cell + 0.5} fill={`color-mix(in srgb, var(--c-dimred) ${Math.round((v / 16) * 100)}%, var(--canvas))`} />;
        })}
      </svg>
      <figcaption style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>{label}</figcaption>
    </figure>
  );
}

export function PcaDigitReconstructLab() {
  const [ki, setKi] = useState(6); // index into KS -> 20
  const k = KS[ki];
  const dim = "var(--c-dimred)";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 12 }}>
        Reconstructing one digit from its first k components
      </div>

      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-end" }}>
        <Grid px={ORIGINAL} label="original · 64 pixels" />
        <div style={{ display: "flex", alignItems: "center", color: "var(--faint)", fontSize: 22 }}>→</div>
        <Grid px={FRAMES[k]} label={`k = ${k} component${k === 1 ? "" : "s"}`} />
      </div>

      <div style={{ marginTop: 16 }}>
        <input
          type="range" min={0} max={KS.length - 1} step={1} value={ki}
          onChange={(e) => setKi(Number(e.target.value))}
          style={{ width: "100%", accentColor: dim }}
          aria-label="Number of components k"
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--faint)", marginTop: 2 }}>
          {KS.map((kk) => <span key={kk}>{kk}</span>)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label="components stored" value={`${k} of 64`} sub={`${Math.round((k / 64) * 100)}% of the numbers`} accent={dim} />
        <Metric label="variance kept" value={`${VAR[k]}%`} />
        <Metric label="pixel error (MSE)" value={MSE[k].toFixed(2)} sub="0 = perfect" accent="var(--brand-3)" />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", minWidth: 100 }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)" }}>{sub}</div>}
    </div>
  );
}
