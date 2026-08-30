"use client";

import { useMemo, useState } from "react";

// The flagship of the Activation functions track: every activation drawn twice,
// as the curve everyone knows and as the derivative that actually decides
// whether learning happens.
//
// Everything here is computed in the component rather than pasted from the
// script, for two reasons. The shape parameters are continuous, so no table
// could cover them; and the summary numbers -- output range, peak slope, how
// much of the line is switched off -- then cannot drift away from the curve
// being drawn. At the default settings they reproduce section 1 of
// scripts/activation_cases.py to the printed precision.
//
// The red band is the point of the whole lab: it marks where |f'| < 0.01, the
// region in which a unit contributes a factor of at most one hundredth to the
// chain-rule product. That band IS the vanishing gradient, drawn.

const SQ = Math.sqrt(2 / Math.PI);
const sig = (z: number) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

type Spec = {
  key: string;
  label: string;
  param?: { name: string; min: number; max: number; step: number; init: number };
  f: (z: number, p: number) => number;
  d: (z: number, p: number) => number;
  note: string;
};

const SELU_L = 1.0507009873554805, SELU_A = 1.6732632423543772;

const SPECS: Spec[] = [
  {
    key: "sigmoid", label: "sigmoid",
    f: (z) => sig(z),
    d: (z) => sig(z) * (1 - sig(z)),
    note: "The peak slope is 0.25 — even at its best, a sigmoid layer divides the gradient by four. Away from zero it is far worse.",
  },
  {
    key: "tanh", label: "tanh",
    f: (z) => Math.tanh(z),
    d: (z) => 1 - Math.tanh(z) ** 2,
    note: "A rescaled sigmoid with two differences that matter: the peak slope is 1, not 0.25, and the output is centred on zero.",
  },
  {
    key: "relu", label: "ReLU",
    f: (z) => Math.max(0, z),
    d: (z) => (z > 0 ? 1 : 0),
    note: "Slope exactly 1 on the right and exactly 0 on the left. Half the line is switched off — and that half is permanent for any unit that ends up there.",
  },
  {
    key: "leaky", label: "Leaky ReLU",
    param: { name: "α", min: 0, max: 0.4, step: 0.01, init: 0.01 },
    f: (z, a) => (z > 0 ? z : a * z),
    d: (z, a) => (z > 0 ? 1 : a),
    note: "Drag α to 0 and you are back to ReLU, with the dead half restored. Any α above zero removes the flat region entirely — this is the only activation here that literally cannot die.",
  },
  {
    key: "elu", label: "ELU",
    param: { name: "α", min: 0.2, max: 3, step: 0.05, init: 1 },
    f: (z, a) => (z > 0 ? z : a * (Math.exp(z) - 1)),
    d: (z, a) => (z > 0 ? 1 : a * Math.exp(z)),
    note: "Smooth, negative-valued on the left, and saturating: the slope decays toward zero rather than staying flat at a constant. ELU can still switch off — it just takes a much larger input to do it.",
  },
  {
    key: "selu", label: "SELU",
    f: (z) => SELU_L * (z > 0 ? z : SELU_A * (Math.exp(z) - 1)),
    d: (z) => SELU_L * (z > 0 ? 1 : SELU_A * Math.exp(z)),
    note: "ELU with two constants chosen so that activations keep unit mean and variance layer after layer — the only activation here whose scale factors were derived rather than picked.",
  },
  {
    key: "gelu", label: "GELU",
    f: (z) => 0.5 * z * (1 + Math.tanh(SQ * (z + 0.044715 * z ** 3))),
    d: (z) => {
      const u = SQ * (z + 0.044715 * z ** 3);
      const t = Math.tanh(u);
      return 0.5 * (1 + t) + 0.5 * z * (1 - t * t) * SQ * (1 + 3 * 0.044715 * z * z);
    },
    note: "The transformer default. Note the slope exceeds 1 near x = 1 and dips below 0 near x = −1 — it is not monotone, and that turned out not to matter.",
  },
  {
    key: "swish", label: "Swish / SiLU",
    param: { name: "β", min: 0, max: 8, step: 0.1, init: 1 },
    f: (z, b) => z * sig(b * z),
    d: (z, b) => sig(b * z) + b * z * sig(b * z) * (1 - sig(b * z)),
    note: "One dial from a straight line to ReLU. At β = 0 this is exactly x/2; push β past about 8 and the curve is visually a ReLU with the corner sanded off.",
  },
  {
    key: "mish", label: "Mish",
    f: (z) => z * Math.tanh(Math.log1p(Math.exp(-Math.abs(z))) + Math.max(z, 0)),
    d: (z) => {
      const h = 1e-6;
      const g = (v: number) => v * Math.tanh(Math.log1p(Math.exp(-Math.abs(v))) + Math.max(v, 0));
      return (g(z + h) - g(z - h)) / (2 * h);
    },
    note: "Swish with a second bend. Nearly indistinguishable in shape, meaningfully more expensive, and the measured differences are inside seed noise.",
  },
  {
    key: "softplus", label: "softplus",
    f: (z) => Math.log1p(Math.exp(-Math.abs(z))) + Math.max(z, 0),
    d: (z) => sig(z),
    note: "A smooth ReLU whose derivative is exactly the sigmoid — which is also its problem: it inherits sigmoid's saturation on the left and is never quite zero, so it gives up ReLU's sparsity for nothing measurable.",
  },
];

const VW = 460, PH = 118, GAP = 8, VH = PH * 2 + GAP + 22;
const PD = { l: 34, r: 12 };
const X0 = PD.l, X1 = VW - PD.r;
const XLO = -6, XHI = 6;
const NPTS = 481;

const sx = (x: number) => X0 + ((x - XLO) / (XHI - XLO)) * (X1 - X0);
const accent = "var(--c-neural)";

export function ActivationExplorerLab() {
  const [k, setK] = useState(2);
  const [params, setParams] = useState<Record<string, number>>(
    Object.fromEntries(SPECS.filter((s) => s.param).map((s) => [s.key, s.param!.init])),
  );
  const spec = SPECS[k];
  const p = params[spec.key] ?? 0;

  const { xs, fv, dv, fLo, fHi, dMax, offFrac, offRuns } = useMemo(() => {
    const xs: number[] = [], fv: number[] = [], dv: number[] = [];
    for (let i = 0; i < NPTS; i++) {
      const x = XLO + ((XHI - XLO) * i) / (NPTS - 1);
      xs.push(x);
      fv.push(spec.f(x, p));
      dv.push(spec.d(x, p));
    }
    // The published summary numbers are measured on [-8, 8], so measure them
    // there too rather than on the drawn window.
    let fLo = Infinity, fHi = -Infinity, dMax = 0, off = 0;
    const M = 16001;
    for (let i = 0; i < M; i++) {
      const x = -8 + (16 * i) / (M - 1);
      const v = spec.f(x, p), g = Math.abs(spec.d(x, p));
      fLo = Math.min(fLo, v); fHi = Math.max(fHi, v); dMax = Math.max(dMax, g);
      if (g < 0.01) off++;
    }
    // Contiguous stretches of the DRAWN window where the slope is negligible,
    // so the shading is a band rather than 481 separate slivers.
    const runs: [number, number][] = [];
    let start: number | null = null;
    for (let i = 0; i < NPTS; i++) {
      const dead = Math.abs(dv[i]) < 0.01;
      if (dead && start === null) start = xs[i];
      if (!dead && start !== null) { runs.push([start, xs[i]]); start = null; }
    }
    if (start !== null) runs.push([start, xs[NPTS - 1]]);
    return { xs, fv, dv, fLo, fHi, dMax, offFrac: off / M, offRuns: runs };
  }, [spec, p]);

  // Each panel gets its own vertical scale, clipped so an unbounded function
  // does not flatten the interesting part of the curve.
  const fTop = Math.max(2, Math.min(6, fHi)), fBot = Math.min(-1.2, Math.max(-3, fLo));
  const dTop = Math.max(1.2, Math.min(2, dMax * 1.15));
  const fy = (v: number) => 6 + (1 - (v - fBot) / (fTop - fBot)) * (PH - 12);
  const dy = (v: number) => PH + GAP + 22 + 6 + (1 - (v + 0.3) / (dTop + 0.3)) * (PH - 12);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const pathF = xs.map((x, i) => `${sx(x).toFixed(2)},${fy(clamp(fv[i], fBot, fTop)).toFixed(2)}`).join(" ");
  const pathD = xs.map((x, i) => `${sx(x).toFixed(2)},${dy(clamp(dv[i], -0.3, dTop)).toFixed(2)}`).join(" ");

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        The curve, and the half that matters
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        top: <strong style={{ color: "var(--muted)" }}>f(x)</strong> · bottom:{" "}
        <strong style={{ color: "var(--muted)" }}>f′(x)</strong> · the red band marks |f′| &lt; 0.01 — where a unit
        stops passing gradient
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: VW, height: "auto", display: "block" }}>
        {[0, 1].map((panel) => {
          const top = panel === 0 ? 0 : PH + GAP + 22;
          return (
            <rect key={panel} x={X0} y={top} width={X1 - X0} height={PH} rx={8}
              fill="var(--canvas)" stroke="var(--border-strong)" />
          );
        })}

        {/* dead-slope shading, drawn on both panels so the two readings line up */}
        {offRuns.map(([a, b], i) => (
          <g key={`o${i}`}>
            <rect x={sx(a).toFixed(2)} y={0} width={Math.max(0.5, sx(b) - sx(a)).toFixed(2)} height={PH}
              fill="var(--bad)" opacity={0.1} />
            <rect x={sx(a).toFixed(2)} y={PH + GAP + 22} width={Math.max(0.5, sx(b) - sx(a)).toFixed(2)} height={PH}
              fill="var(--bad)" opacity={0.16} />
          </g>
        ))}

        {/* axes */}
        <line x1={X0} y1={fy(0)} x2={X1} y2={fy(0)} stroke="var(--border)" strokeWidth={1} />
        <line x1={X0} y1={dy(0)} x2={X1} y2={dy(0)} stroke="var(--border)" strokeWidth={1} />
        <line x1={sx(0)} y1={0} x2={sx(0)} y2={PH} stroke="var(--border)" strokeWidth={1} />
        <line x1={sx(0)} y1={PH + GAP + 22} x2={sx(0)} y2={VH - 22} stroke="var(--border)" strokeWidth={1} />
        <line x1={X0} y1={dy(1)} x2={X1} y2={dy(1)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
        <text x={X0 - 4} y={dy(1) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">1</text>
        <text x={X0 - 4} y={dy(0) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">0</text>
        <text x={X0 - 4} y={fy(0) + 3.5} fontSize={9} fill="var(--faint)" textAnchor="end">0</text>

        <polyline points={pathF} fill="none" stroke={accent} strokeWidth={2.2} />
        <polyline points={pathD} fill="none" stroke="var(--ink)" strokeWidth={2} />

        <text x={X0 + 8} y={14} fontSize={10} fill={accent}>f(x)</text>
        <text x={X0 + 8} y={PH + GAP + 22 + 14} fontSize={10} fill="var(--ink)">f′(x)</text>
        <text x={(X0 + X1) / 2} y={VH - 6} fontSize={10} fill="var(--muted)" textAnchor="middle">
          input to the unit, −6 to 6
        </text>
      </svg>

      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
        {SPECS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setK(i)}
            style={{
              background: i === k ? `color-mix(in srgb, ${accent} 18%, var(--surface))` : "var(--surface-2)",
              color: "var(--ink)",
              border: `1px solid ${i === k ? `color-mix(in srgb, ${accent} 45%, var(--border))` : "var(--border)"}`,
              fontSize: 12, padding: "5px 9px", borderRadius: 8, cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {spec.param && (
        <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          <span style={{ display: "inline-block", width: 26, color: "var(--ink)" }}>{spec.param.name}</span>
          <input
            type="range" min={spec.param.min} max={spec.param.max} step={spec.param.step} value={p}
            onChange={(e) => setParams((q) => ({ ...q, [spec.key]: Number(e.target.value) }))}
            style={{ width: "calc(100% - 82px)", verticalAlign: "middle", accentColor: "var(--c-neural)" }}
          />
          <span style={{ display: "inline-block", width: 48, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.toFixed(2)}</span>
        </label>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {[
          ["output range", `${fLo.toFixed(2)} … ${fHi > 100 ? "∞" : fHi.toFixed(2)}`, false],
          ["peak slope", dMax.toFixed(3), false],
          ["switched off", `${(offFrac * 100).toFixed(1)}%`, offFrac > 0.25],
        ].map(([label, value, bad]) => (
          <div key={label as string} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px", flex: "1 1 110px" }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label as string}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: bad ? "var(--bad)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {value as string}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>
        measured on x ∈ [−8, 8]; &ldquo;switched off&rdquo; is the fraction of that interval with |f′| &lt; 0.01
      </div>

      <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>{spec.note}</div>
    </div>
  );
}
