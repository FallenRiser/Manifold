"use client";

import { useState } from "react";

// Bayes' rule, via the test that fools everyone. A disease affects a small slice
// of people; even a very accurate test produces mostly FALSE positives when the
// disease is rare, because there are so many more healthy people to misclassify.
// Tune prevalence / sensitivity / specificity and watch the posterior — the
// chance you're actually sick given a positive — stay surprisingly low.

export function BayesLab() {
  const [prev, setPrev] = useState(1);   // % prevalence
  const [sens, setSens] = useState(90);  // % true-positive rate
  const [spec, setSpec] = useState(90);  // % true-negative rate
  const amber = "var(--c-fundamentals)";

  const p = prev / 100, se = sens / 100, sp = spec / 100;
  const N = 1000;
  const sick = p, healthy = 1 - p;
  const tp = sick * se, fn = sick * (1 - se), fp = healthy * (1 - sp), tn = healthy * sp;
  const posterior = tp / (tp + fp || 1); // P(sick | positive)
  const posPct = (posterior * 100);
  const tpN = Math.round(tp * N), fpN = Math.round(fp * N);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 10 }}>The base-rate trap</div>

      {/* among everyone who tests positive, share who is truly sick */}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Of everyone who tests positive:</div>
      <div style={{ display: "flex", height: 30, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
        <div style={{ width: `${posterior * 100}%`, background: amber, transition: "width 0.1s linear" }} />
        <div style={{ width: `${(1 - posterior) * 100}%`, background: "color-mix(in srgb, var(--bad) 45%, var(--surface))" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        <span>truly sick</span><span>false alarm (healthy)</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Metric label="P(sick | positive)" value={`${posPct.toFixed(1)}%`} accent={amber} big />
        <Metric label="per 1000 people" value={`${tpN} sick vs ${fpN} false`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 14 }}>
        <Slider label={`prevalence (base rate) = ${prev}%`} min={0.2} max={50} step={0.2} value={prev} onChange={setPrev} accent={amber} />
        <Slider label={`sensitivity (true-positive rate) = ${sens}%`} min={50} max={100} step={1} value={sens} onChange={setSens} accent={amber} />
        <Slider label={`specificity (true-negative rate) = ${spec}%`} min={50} max={100} step={1} value={spec} onChange={setSpec} accent={amber} />
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.5, fontFamily: "var(--font-geist-mono, monospace)" }}>
        P(+|sick)·P(sick) / P(+) = ({se.toFixed(2)}·{p.toFixed(3)}) / ({se.toFixed(2)}·{p.toFixed(3)} + {(1 - sp).toFixed(2)}·{healthy.toFixed(3)}) = {posterior.toFixed(3)}
      </div>
    </div>
  );
}

function Metric({ label, value, accent, big }: { label: string; value: string; accent?: string; big?: boolean }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "7px 11px" }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: big ? 22 : 15, fontWeight: 500, color: accent ?? "var(--ink)" }}>{value}</div>
    </div>
  );
}
function Slider({ label, min, max, step, value, onChange, accent }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; accent: string }) {
  return (
    <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block" }}>{label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: accent, marginTop: 2 }} />
    </label>
  );
}
