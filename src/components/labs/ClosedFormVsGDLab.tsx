"use client";

import { useEffect, useRef, useState } from "react";

// Dataset
const DATA: [number, number][] = [
  [1, 52], [2, 58], [3, 64], [4, 68], [5, 73],
  [6, 76], [7, 80], [8, 84], [9, 87], [10, 91],
];
const N = DATA.length;
const XS_RAW = DATA.map(([x]) => x);
const YS = DATA.map(([, y]) => y);

// Standardise for GD
const XMEAN = XS_RAW.reduce((a, b) => a + b, 0) / N;
const XSD = Math.sqrt(XS_RAW.reduce((s, x) => s + (x - XMEAN) ** 2, 0) / N);
const XS = XS_RAW.map((x) => (x - XMEAN) / XSD);

// GD functions
function loss(m: number, b: number) {
  let s = 0;
  for (let i = 0; i < N; i++) s += (m * XS[i] + b - YS[i]) ** 2;
  return s / N;
}
function grad(m: number, b: number): [number, number] {
  let dm = 0, db = 0;
  for (let i = 0; i < N; i++) {
    const e = m * XS[i] + b - YS[i];
    dm += 2 * e * XS[i]; db += 2 * e;
  }
  return [dm / N, db / N];
}

// Normal equation solution (closed-form)
const NE_M_STD = XS.reduce((s, x, i) => s + x * YS[i], 0) / N;
const NE_B = YS.reduce((s, y) => s + y, 0) / N;
const NE_LOSS = loss(NE_M_STD, NE_B);

// GD state
const GD_START = { m: NE_M_STD + 3.8, b: NE_B - 3.8 };

type Method = "gd" | "ne";

export function ClosedFormVsGDLab() {
  const [gdState, setGdState] = useState({ m: GD_START.m, b: GD_START.b, steps: 0, converged: false });
  const [lr, setLr] = useState(0.22);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState<Method[]>([]);
  const lrRef = useRef(lr);
  lrRef.current = lr;

  // Toggle reveal
  function reveal(m: Method) {
    setRevealed(r => r.includes(m) ? r.filter(x => x !== m) : [...r, m]);
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setGdState(s => {
        if (s.converged) { setRunning(false); return s; }
        const [dm, db] = grad(s.m, s.b);
        const nm = s.m - lrRef.current * dm;
        const nb = s.b - lrRef.current * db;
        const converged = Math.hypot(dm, db) < 0.008;
        return { m: nm, b: nb, steps: s.steps + 1, converged };
      });
    }, 90);
    return () => clearInterval(id);
  }, [running]);

  function resetGD() {
    setGdState({ m: GD_START.m, b: GD_START.b, steps: 0, converged: false });
    setRunning(false);
  }

  const gdLoss = loss(gdState.m, gdState.b);
  const gdConverged = gdState.converged;

  // Convert GD params back to original scale for plotting
  // m_orig = m_std / XSD, b_orig = b - m_std * XMEAN / XSD
  const gdM_orig = gdState.m / XSD;
  const gdB_orig = gdState.b - gdState.m * XMEAN / XSD;
  const neM_orig = NE_M_STD / XSD;
  const neB_orig = NE_B - NE_M_STD * XMEAN / XSD;

  // Chart geometry
  const px = (x: number) => 44 + ((x - 0.5) / 10) * 220;
  const py = (y: number) => 210 - ((y - 45) / 55) * 195;

  // Comparison table values
  const gdMSE = gdLoss;
  const neMSE = NE_LOSS;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Two roads to the same line
        </span>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Legend color="var(--c-fundamentals)" label="Gradient descent" />
          <Legend color="var(--brand)" label="Normal equation" />
        </div>
      </div>

      {/* Scatter chart */}
      <svg viewBox="0 0 290 230" style={{ width: "100%", height: "auto", display: "block", marginBottom: 14 }}>
        <rect x={44} y={5} width={220} height={205} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        {/* Axis labels */}
        {[2, 4, 6, 8, 10].map(v => (
          <g key={v}>
            <text x={px(v)} y={224} fontSize={9} fill="var(--faint)" textAnchor="middle">{v}</text>
          </g>
        ))}
        {[50, 60, 70, 80, 90].map(v => (
          <g key={v}>
            <text x={40} y={py(v) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* Normal equation line */}
        {revealed.includes("ne") && (
          <line
            x1={px(0.5)} y1={py(neM_orig * 0.5 + neB_orig)}
            x2={px(10.5)} y2={py(neM_orig * 10.5 + neB_orig)}
            stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round"
          />
        )}

        {/* GD line */}
        {revealed.includes("gd") && (
          <line
            x1={px(0.5)} y1={py(gdM_orig * 0.5 + gdB_orig)}
            x2={px(10.5)} y2={py(gdM_orig * 10.5 + gdB_orig)}
            stroke="var(--c-fundamentals)" strokeWidth={2} strokeLinecap="round"
            strokeOpacity={0.85} strokeDasharray={gdConverged ? undefined : "4 3"}
          />
        )}

        {/* Data */}
        {DATA.map(([x, y], i) => (
          <circle key={i} cx={px(x)} cy={py(y)} r={3.8} fill="var(--c-regression)" fillOpacity={0.8} />
        ))}

        <text x={154} y={229} fontSize={9.5} fill="var(--faint)" textAnchor="middle">hours studied</text>
      </svg>

      {/* Toggle reveal */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <ToggleBtn
          active={revealed.includes("ne")}
          color="var(--brand)"
          label="Show normal equation line"
          onClick={() => reveal("ne")}
        />
        <ToggleBtn
          active={revealed.includes("gd")}
          color="var(--c-fundamentals)"
          label="Show gradient descent line"
          onClick={() => reveal("gd")}
        />
      </div>

      {/* GD controls */}
      <div style={{ background: "var(--canvas)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <div className="font-display" style={{ fontSize: 12, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 10 }}>
          Gradient descent
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>α</span>
          <input type="range" min={0.05} max={0.6} step={0.01} value={lr} onChange={e => setLr(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 32 }}>{lr.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setRunning(r => !r)} style={btnPrimary}>{running ? "Pause" : "Run GD"}</button>
          <button onClick={() => { resetGD(); setRevealed(r => r.filter(x => x !== "gd")); }} style={btnGhost}>Reset</button>
          <StatChip label="steps" value={String(gdState.steps)} />
          <StatChip label="MSE" value={gdLoss.toFixed(4)} />
          {gdConverged && <span style={{ fontSize: 12, color: "var(--good)", fontWeight: 500 }}>converged ✓</span>}
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <CompCard
          color="var(--brand)"
          title="Normal equation"
          rows={[
            { label: "Steps needed", val: "1 matrix multiply" },
            { label: "MSE", val: neMSE.toFixed(5) },
            { label: "Exact?", val: "✓ always" },
            { label: "Scales to big data?", val: "✗ O(p³) inversion" },
          ]}
        />
        <CompCard
          color="var(--c-fundamentals)"
          title="Gradient descent"
          rows={[
            { label: "Steps needed", val: `${gdState.steps} (α=${lr.toFixed(2)})` },
            { label: "MSE", val: gdMSE.toFixed(5) },
            { label: "Exact?", val: gdConverged ? "✓ converged" : "~ approximate" },
            { label: "Scales to big data?", val: "✓ O(Np) per step" },
          ]}
        />
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color, fontWeight: 500 }}>
      <span style={{ width: 18, height: 3, background: color, borderRadius: 2, display: "inline-block" }} />
      {label}
    </span>
  );
}

function ToggleBtn({ active, color, label, onClick }: { active: boolean; color: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 10, fontSize: 12.5, cursor: "pointer",
        border: `1.5px solid ${active ? color : "var(--border-strong)"}`,
        background: active ? `color-mix(in srgb, ${color} 12%, var(--surface))` : "transparent",
        color: active ? color : "var(--muted)",
        fontWeight: active ? 500 : 400,
        transition: "all 0.15s",
      }}
    >{label}</button>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: "5px 10px" }}>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

function CompCard({ color, title, rows }: { color: string; title: string; rows: { label: string; val: string }[] }) {
  return (
    <div style={{
      background: `color-mix(in srgb, ${color} 5%, var(--surface-2))`,
      border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`,
      borderRadius: 12, padding: "12px 14px",
    }}>
      <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 10 }}>{title}</div>
      {rows.map(({ label, val }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6, fontSize: 12.5 }}>
          <span style={{ color: "var(--muted)" }}>{label}</span>
          <span style={{ color: "var(--ink)", fontWeight: 500, textAlign: "right" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: "var(--cta)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 10, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", fontSize: 13, padding: "8px 14px", borderRadius: 10, cursor: "pointer" };
