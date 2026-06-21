"use client";

import { useMemo, useState } from "react";

const TRAIN: [number, number][] = [
  [1, 5.5], [2, 5.0], [3, 6.4], [4, 6.0], [5, 7.1], [6, 7.6],
  [7, 7.2], [8, 8.6], [9, 8.9], [10, 9.3], [11, 10.4], [12, 10.1],
];

const VALIDATION: [number, number][] = [
  [1.5, 5.35], [3.5, 6.05], [5.5, 7.35], [7.5, 8.05], [9.5, 9.45], [11.5, 10.0],
];

const N = TRAIN.length;
const XMEAN = TRAIN.reduce((s, [x]) => s + x, 0) / N;
const XSD = Math.sqrt(TRAIN.reduce((s, [x]) => s + (x - XMEAN) ** 2, 0) / N);
const XS = TRAIN.map(([x]) => (x - XMEAN) / XSD);
const YS = TRAIN.map(([, y]) => y);
const VS = VALIDATION.map(([x]) => (x - XMEAN) / XSD);
const VY = VALIDATION.map(([, y]) => y);

const MSTAR = XS.reduce((s, x, i) => s + x * YS[i], 0) / N;
const BSTAR = YS.reduce((s, y) => s + y, 0) / N;
const START = { m: MSTAR - 3.6, b: BSTAR + 3.6 };
const LR = 0.22;
const MAX_STEPS = 95;

type RunPoint = {
  step: number;
  m: number;
  b: number;
  train: number;
  validation: number;
  gradNorm: number;
  improvement: number;
};

function mse(xs: number[], ys: number[], m: number, b: number) {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += (m * xs[i] + b - ys[i]) ** 2;
  return s / xs.length;
}

function grad(m: number, b: number): [number, number] {
  let dm = 0;
  let db = 0;
  for (let i = 0; i < N; i++) {
    const e = m * XS[i] + b - YS[i];
    dm += 2 * e * XS[i];
    db += 2 * e;
  }
  return [dm / N, db / N];
}

function makeRun(): RunPoint[] {
  const points: RunPoint[] = [];
  let m = START.m;
  let b = START.b;
  let previous = mse(XS, YS, m, b);
  for (let step = 0; step <= MAX_STEPS; step++) {
    const [dm, db] = grad(m, b);
    const train = mse(XS, YS, m, b);
    const validationBase = mse(VS, VY, m, b);
    const lateDrift = step > 62 ? ((step - 62) / 42) ** 2 * 0.11 : 0;
    points.push({
      step,
      m,
      b,
      train,
      validation: validationBase + lateDrift,
      gradNorm: Math.hypot(dm, db),
      improvement: Math.max(0, previous - train),
    });
    previous = train;
    m -= LR * dm;
    b -= LR * db;
  }
  return points;
}

function firstBelow(points: RunPoint[], pick: (p: RunPoint) => number, threshold: number) {
  return points.findIndex((p, i) => i > 0 && pick(p) < threshold);
}

function patienceStop(points: RunPoint[], patience: number, minDelta: number) {
  let best = points[0].validation;
  let wait = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].validation < best - minDelta) {
      best = points[i].validation;
      wait = 0;
    } else {
      wait += 1;
      if (wait >= patience) return i;
    }
  }
  return points.length - 1;
}

export function StoppingRulesLab() {
  const points = useMemo(makeRun, []);
  const [rule, setRule] = useState<"gradient" | "improvement" | "patience">("gradient");
  const [gradientThreshold, setGradientThreshold] = useState(0.08);
  const [improvementThreshold, setImprovementThreshold] = useState(0.0015);
  const [patience, setPatience] = useState(8);

  const stopIndex =
    rule === "gradient"
      ? firstBelow(points, (p) => p.gradNorm, gradientThreshold)
      : rule === "improvement"
        ? firstBelow(points, (p) => p.improvement, improvementThreshold)
        : patienceStop(points, patience, 0.002);

  const safeStopIndex = stopIndex < 0 ? points.length - 1 : stopIndex;
  const current = points[safeStopIndex];
  const bestValidation = points.reduce((best, p) => (p.validation < best.validation ? p : best), points[0]);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 12 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Let the run decide when to stop
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>
          gradient descent on the same bowl
        </span>
      </div>

      <div style={tabs} aria-label="Stopping rule">
        <button onClick={() => setRule("gradient")} style={tab(rule === "gradient")}>Gradient</button>
        <button onClick={() => setRule("improvement")} style={tab(rule === "improvement")}>Improvement</button>
        <button onClick={() => setRule("patience")} style={tab(rule === "patience")}>Patience</button>
      </div>

      <LossChart points={points} stopIndex={safeStopIndex} bestIndex={bestValidation.step} />

      <div style={controls}>
        {rule === "gradient" && (
          <Slider
            label="gradient norm below"
            value={gradientThreshold}
            min={0.02}
            max={0.8}
            step={0.01}
            format={(v) => v.toFixed(2)}
            onChange={setGradientThreshold}
          />
        )}
        {rule === "improvement" && (
          <Slider
            label="loss improvement below"
            value={improvementThreshold}
            min={0.0002}
            max={0.02}
            step={0.0002}
            format={(v) => v.toFixed(4)}
            onChange={setImprovementThreshold}
          />
        )}
        {rule === "patience" && (
          <Slider
            label="validation patience"
            value={patience}
            min={2}
            max={18}
            step={1}
            format={(v) => `${Math.round(v)} steps`}
            onChange={setPatience}
          />
        )}
      </div>

      <div style={statsGrid}>
        <Stat label="stop step" value={String(current.step)} color="var(--brand)" />
        <Stat label="training MSE" value={current.train.toFixed(3)} color="var(--c-regression)" />
        <Stat label="gradient norm" value={current.gradNorm.toFixed(3)} color="var(--c-fundamentals)" />
        <Stat label="best validation" value={`step ${bestValidation.step}`} color="var(--good)" />
      </div>
    </div>
  );
}

function LossChart({ points, stopIndex, bestIndex }: { points: RunPoint[]; stopIndex: number; bestIndex: number }) {
  const W = 640;
  const H = 270;
  const x0 = 42;
  const x1 = 612;
  const y0 = 230;
  const y1 = 24;
  const maxLoss = Math.max(...points.map((p) => Math.max(p.train, p.validation)));
  const minLoss = Math.min(...points.map((p) => Math.min(p.train, p.validation)));
  const x = (step: number) => x0 + (step / MAX_STEPS) * (x1 - x0);
  const y = (loss: number) => y0 - ((loss - minLoss) / (maxLoss - minLoss)) * (y0 - y1);
  const line = (kind: "train" | "validation") =>
    points.map((p) => `${x(p.step).toFixed(1)},${y(p[kind]).toFixed(1)}`).join(" ");
  const stopped = points[stopIndex];
  const best = points[bestIndex];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={x0} y={y1} width={x1 - x0} height={y0 - y1} rx={10} fill="var(--canvas)" stroke="var(--border-strong)" />
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={x0} x2={x1} y1={y1 + (y0 - y1) * p} y2={y1 + (y0 - y1) * p} stroke="var(--border)" strokeDasharray="3 4" />
      ))}
      <polyline points={line("train")} fill="none" stroke="var(--c-regression)" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={line("validation")} fill="none" stroke="var(--good)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.9} />
      <line x1={x(stopped.step)} x2={x(stopped.step)} y1={y1} y2={y0} stroke="var(--brand)" strokeWidth={1.5} strokeDasharray="4 4" />
      <circle cx={x(stopped.step)} cy={y(stopped.train)} r={5.5} fill="var(--brand)" stroke="var(--surface)" strokeWidth={1.6} />
      <circle cx={x(best.step)} cy={y(best.validation)} r={5} fill="var(--good)" stroke="var(--surface)" strokeWidth={1.6} />
      <text x={x0 + 12} y={y1 + 18} fontSize={11} fill="var(--c-regression)">training loss</text>
      <text x={x0 + 12} y={y1 + 34} fontSize={11} fill="var(--good)">validation signal</text>
      <text x={x(stopped.step) + 8} y={y1 + 18} fontSize={11} fill="var(--brand)">stop</text>
      <text x={(x0 + x1) / 2} y={H - 7} fontSize={10.5} fill="var(--faint)" textAnchor="middle">training step</text>
      <text x={14} y={(y0 + y1) / 2} fontSize={10.5} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 14 ${(y0 + y1) / 2})`}>
        loss
      </text>
    </svg>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, minWidth: 160 }}
      />
      <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 70, textAlign: "right", color: "var(--ink)" }}>
        {format(value)}
      </span>
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: `color-mix(in srgb, ${color} 7%, var(--surface-2))`,
      border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`,
      borderRadius: 10,
      padding: "9px 11px",
    }}>
      <div style={{ fontSize: 10.5, color, fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 16,
  margin: "1.6rem 0",
};

const tabs: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 6,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 4,
  marginBottom: 12,
};

function tab(active: boolean): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 9,
    padding: "8px 10px",
    cursor: "pointer",
    background: active ? "var(--surface)" : "transparent",
    color: active ? "var(--ink)" : "var(--muted)",
    fontSize: 12.5,
    fontWeight: active ? 600 : 500,
    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
  };
}

const controls: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  margin: "12px 0",
  flexWrap: "wrap",
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 8,
};
