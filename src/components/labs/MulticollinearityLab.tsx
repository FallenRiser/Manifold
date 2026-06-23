"use client";

import { useState } from "react";

// Two features that are highly correlated carry overlapping information. As their
// correlation r → 1, the variance inflation factor VIF = 1/(1−r²) explodes and the
// individual coefficients become wildly unstable (they trade off against each other).
export function MulticollinearityLab() {
  const [r, setR] = useState(0.3);

  const vif = 1 / (1 - r * r);
  // illustrative coefficient swing: SE of each coef scales with sqrt(VIF)
  const seScale = Math.sqrt(vif);
  const coefA = 2.0 + (seScale - 1) * 1.6;   // estimate drifts up
  const coefB = 2.0 - (seScale - 1) * 1.6;   // its partner compensates downward

  const W = 280, H = 150;
  const cx = (v: number) => Math.round((20 + ((v + 2.5) / 5) * (W - 40)) * 100) / 100;
  const cy = (v: number) => Math.round((H - 20 - ((v + 2.5) / 5) * (H - 40)) * 100) / 100;
  // deterministic cloud of (x1, x2) with correlation r
  const pts = Array.from({ length: 40 }, (_, i) => {
    const a = Math.sin(i * 1.7) * 1.6;
    const b = r * a + Math.sqrt(1 - r * r) * Math.cos(i * 2.3) * 1.6;
    return { a, b };
  });

  return (
    <div style={wrap}>
      <div style={head}>Multicollinearity — when two features overlap</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {pts.map((p, i) => <circle key={i} cx={cx(p.a)} cy={cy(p.b)} r={3} fill="var(--c-regression)" fillOpacity={0.7} />)}
            <text x={W / 2} y={H - 5} fontSize={10} fill="var(--faint)" textAnchor="middle">feature 1 →</text>
            <text x={11} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${H / 2})`}>feature 2 →</text>
          </svg>
        </div>
        <div style={panel}>
          <Stat label="correlation r" value={r.toFixed(2)} />
          <Stat label="VIF = 1/(1−r²)" value={vif.toFixed(1)} color={vif > 10 ? "var(--bad)" : vif > 5 ? "var(--warn)" : "var(--good)"} />
          <div style={{ display: "flex", gap: 10 }}>
            <Stat label="coef₁" value={coefA.toFixed(1)} small />
            <Stat label="coef₂" value={coefB.toFixed(1)} small />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={rowLbl}><span>Correlation between the two features</span><span style={mono}>{r.toFixed(2)}</span></div>
        <input type="range" min={0} max={0.98} step={0.01} value={r}
          onChange={(e) => setR(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--brand)", cursor: "ew-resize" }} />
      </div>
      <div style={caption}>
        {vif > 10
          ? `VIF = ${vif.toFixed(0)} (rule of thumb: >10 is severe). The coefficients swing apart and become untrustworthy — the model can't tell the two features' effects apart.`
          : `VIF = ${vif.toFixed(1)} — the features are still separable. Coefficients stay close to their true value of ~2.`}
      </div>
    </div>
  );
}

function Stat({ label, value, color, small }: { label: string; value: string; color?: string; small?: boolean }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: small ? 16 : 20, fontWeight: 500, color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 14 };
const panel: React.CSSProperties = { background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 14 };
const rowLbl: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
