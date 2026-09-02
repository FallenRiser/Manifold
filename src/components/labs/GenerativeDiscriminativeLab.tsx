"use client";

import { useState } from "react";

// Measured from scripts/naive_bayes_cases.py section 3. GaussianNB (generative)
// vs LogisticRegression (discriminative) on the same 20-feature problem, over
// growing training-set sizes (15-seed averages). The generative model has
// higher bias but lower variance: it wins with little data and is overtaken as
// data grows — the Ng & Jordan (2002) crossover.

type Row = { n: number; nb: number; lr: number };
const ROWS: Row[] = [
  { n: 15, nb: 0.701, lr: 0.710 },
  { n: 30, nb: 0.760, lr: 0.733 },
  { n: 60, nb: 0.809, lr: 0.774 },
  { n: 150, nb: 0.835, lr: 0.817 },
  { n: 400, nb: 0.845, lr: 0.845 },
  { n: 1000, nb: 0.852, lr: 0.853 },
  { n: 3000, nb: 0.851, lr: 0.857 },
];

const NB = "var(--c-classification)";
const LR = "var(--c-regression)";

const W = 560, H = 300;
const PAD = { l: 46, r: 16, t: 18, b: 42 };
const X0 = PAD.l, X1 = W - PAD.r, Y0 = H - PAD.b, Y1 = PAD.t;
const YLO = 0.68, YHI = 0.88;

const px = (i: number) => X0 + (i / (ROWS.length - 1)) * (X1 - X0);
const py = (a: number) => Y0 - ((a - YLO) / (YHI - YLO)) * (Y0 - Y1);

function path(key: "nb" | "lr") {
  return ROWS.map((r, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(r[key]).toFixed(1)}`).join(" ");
}

export function GenerativeDiscriminativeLab() {
  const [hover, setHover] = useState<number | null>(4);
  const r = hover != null ? ROWS[hover] : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 18, marginBottom: 8, fontSize: 12.5, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, background: NB, borderRadius: 2 }} /> Gaussian NB <span style={{ color: "var(--faint)" }}>(generative)</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, background: LR, borderRadius: 2 }} /> Logistic regression <span style={{ color: "var(--faint)" }}>(discriminative)</span>
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 420, display: "block" }}>
          {/* y gridlines */}
          {[0.70, 0.75, 0.80, 0.85].map((a) => (
            <g key={a}>
              <line x1={X0} y1={py(a)} x2={X1} y2={py(a)} stroke="var(--border)" strokeWidth={1} />
              <text x={X0 - 8} y={py(a) + 4} textAnchor="end" fontSize={11} fill="var(--faint)">{a.toFixed(2)}</text>
            </g>
          ))}
          {/* x labels */}
          {ROWS.map((row, i) => (
            <text key={i} x={px(i)} y={Y0 + 20} textAnchor="middle" fontSize={11} fill="var(--muted)" style={{ fontVariantNumeric: "tabular-nums" }}>{row.n}</text>
          ))}
          <text x={(X0 + X1) / 2} y={H - 6} textAnchor="middle" fontSize={11.5} fill="var(--faint)">training-set size (log spacing)</text>

          {/* crossover shading: NB-wins region */}
          <path d={path("nb")} fill="none" stroke={NB} strokeWidth={2.5} />
          <path d={path("lr")} fill="none" stroke={LR} strokeWidth={2.5} />

          {/* points + hover targets */}
          {ROWS.map((row, i) => (
            <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: "pointer" }}>
              <circle cx={px(i)} cy={py(row.nb)} r={hover === i ? 5 : 3.5} fill={NB} />
              <circle cx={px(i)} cy={py(row.lr)} r={hover === i ? 5 : 3.5} fill={LR} />
              <rect x={px(i) - 18} y={Y1} width={36} height={Y0 - Y1} fill="transparent" />
              {hover === i && <line x1={px(i)} y1={Y1} x2={px(i)} y2={Y0} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3" />}
            </g>
          ))}
        </svg>
      </div>

      <div style={{ marginTop: 10, padding: "11px 14px", background: "var(--bg-offset)", borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>
        {r ? (
          <>
            <strong style={{ color: "var(--ink)" }}>{r.n} training points:</strong>{" "}
            NB {r.nb.toFixed(3)} · LR {r.lr.toFixed(3)} —{" "}
            {r.nb > r.lr
              ? <span style={{ color: NB, fontWeight: 600 }}>Naive Bayes ahead by {(r.nb - r.lr).toFixed(3)}</span>
              : r.lr > r.nb
              ? <span style={{ color: LR, fontWeight: 600 }}>logistic regression ahead by {(r.lr - r.nb).toFixed(3)}</span>
              : <span style={{ fontWeight: 600 }}>tied</span>}.
            {r.n <= 150 ? " With little data the generative model's lower variance wins." : r.n >= 1000 ? " With plenty of data the discriminative model's lower bias wins." : " Right around the crossover."}
          </>
        ) : (
          <>Hover the curves. Naive Bayes leads early; logistic regression overtakes it around <strong>400</strong> points. Generative models reach their (biased) asymptote faster.</>
        )}
      </div>
    </div>
  );
}
