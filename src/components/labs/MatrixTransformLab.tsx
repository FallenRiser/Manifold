"use client";

import { useState } from "react";

// A matrix is a transformation of space. The columns of M say where the basis
// vectors î and ĵ land; everything else follows linearly. Tune the four entries
// and watch the unit square (with a corner mark, so you can see flips) deform.
// The determinant is the area-scale factor — negative means space was mirrored,
// zero means it was crushed onto a line (non-invertible).

const VW = 360, VH = 360, CX = 150, CY = 210, SC = 46;
const toPx = (x: number, y: number): [number, number] => [CX + x * SC, CY - y * SC];

const PRESETS: [string, [number, number, number, number]][] = [
  ["identity", [1, 0, 0, 1]],
  ["scale", [1.6, 0, 0, 0.7]],
  ["rotate", [0.7, -0.7, 0.7, 0.7]],
  ["shear", [1, 0.8, 0, 1]],
  ["squash", [1, 0.5, 0.4, 0.2]],
];

export function MatrixTransformLab() {
  const [m, setM] = useState<[number, number, number, number]>([1, 0.6, 0.2, 1]);
  const [a, b, c, d] = m;
  const amber = "var(--c-fundamentals)";
  const det = a * d - b * c;
  const ap = (x: number, y: number): [number, number] => toPx(a * x + b * y, c * x + d * y);
  const f = (n: number) => n.toFixed(1);
  // image of the unit square corners (with a small notch shape for orientation)
  const square = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => ap(x, y));
  const notch = [[0.15, 0.15], [0.5, 0.15], [0.15, 0.5]].map(([x, y]) => ap(x, y));

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 8 }}>Where does the unit square land?</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block" }}>
          <defs><marker id="mt-i" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 z" fill="var(--ink)" /></marker>
            <marker id="mt-j" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 z" fill="var(--c-fundamentals)" /></marker></defs>
          <rect x={1} y={1} width={VW - 2} height={VH - 2} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
          <line x1={0} y1={CY} x2={VW} y2={CY} stroke="var(--border)" strokeWidth={1} />
          <line x1={CX} y1={0} x2={CX} y2={VH} stroke="var(--border)" strokeWidth={1} />
          {/* faint original square */}
          <polygon points={[[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => toPx(x, y).map(f).join(",")).join(" ")} fill="none" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4 4" />
          {/* transformed square */}
          <polygon points={square.map((p) => p.map(f).join(",")).join(" ")} fill={`color-mix(in srgb, ${amber} ${det < 0 ? 6 : 14}%, transparent)`} stroke={amber} strokeWidth={2} />
          <polygon points={notch.map((p) => p.map(f).join(",")).join(" ")} fill={`color-mix(in srgb, ${amber} 40%, transparent)`} stroke="none" />
          {/* transformed basis vectors */}
          <line x1={CX} y1={CY} x2={f(ap(1, 0)[0])} y2={f(ap(1, 0)[1])} stroke="var(--ink)" strokeWidth={2.6} markerEnd="url(#mt-i)" />
          <line x1={CX} y1={CY} x2={f(ap(0, 1)[0])} y2={f(ap(0, 1)[1])} stroke={amber} strokeWidth={2.6} markerEnd="url(#mt-j)" />
          <text x={f(ap(1, 0)[0] + 6)} y={f(ap(1, 0)[1])} fontSize={11} fill="var(--ink)" fontWeight={600}>î</text>
          <text x={f(ap(0, 1)[0] + 6)} y={f(ap(0, 1)[1])} fontSize={11} fill={amber} fontWeight={600}>ĵ</text>
        </svg>

        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(["a", "b", "c", "d"] as const).map((lab, i) => (
              <label key={lab} style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {lab} = {m[i].toFixed(1)}
                <input type="range" min={-2} max={2} step={0.1} value={m[i]} onChange={(e) => { const v = Number(e.target.value); setM((prev) => prev.map((x, j) => (j === i ? v : x)) as typeof prev); }} style={{ width: "100%", accentColor: amber }} />
              </label>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <Metric label="determinant (area ×)" value={det.toFixed(2)} accent={Math.abs(det) < 0.05 ? "var(--bad)" : det < 0 ? "var(--warn)" : amber} />
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
              {Math.abs(det) < 0.05 ? "≈0 → crushed onto a line (singular)" : det < 0 ? "negative → space is mirrored" : "positive → orientation preserved"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {PRESETS.map(([name, v]) => (
              <button key={name} onClick={() => setM(v)} style={btn}>{name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px", display: "inline-block" }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}

const btn: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 12, padding: "5px 9px", borderRadius: 8, cursor: "pointer" };
