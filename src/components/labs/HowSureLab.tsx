"use client";

import { useState } from "react";
import lg from "@/data/routing/logistic.json";

// How sure a router says it is, against how often it is right, on the harness's new threads. For each
// tenth of stated probability: how many posts the model put there, the probability it stated on
// average, and the share it routed right. A model whose number means what it says sits on the diagonal.
// Logistic regression comes with a dial for C; naive Bayes three ways: the textbook model, the
// complement model (the bar) with its own probability, and the bar with a probability fitted to the
// gap between its two best scores (a logistic regression with one input, fitted fold by fold).
//
// Data: src/data/routing/logistic.json, written by `python scripts/routing_cases.py logistic`.

type Bin = [number, number | null, number | null];
type Cal = { right: number; says: number; expected: number; n_right: number; ce: number; bins: Bin[] };
type LrRow = { C: number; right: number; says: number; ll: number; ce: number; expected: number; nRight: number; bins: Bin[] };
const D = lg as unknown as {
  n: number; C: number[]; pick: number; byLogLoss: number;
  lr: LrRow[]; models: Record<"textbook" | "bar" | "fitted", Cal>;
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const MODELS = [
  { key: "lr", label: "logistic regression" },
  { key: "textbook", label: "naive Bayes, textbook" },
  { key: "bar", label: "complement NB (the bar)" },
  { key: "fitted", label: "the bar + a fitted probability" },
] as const;
type Key = (typeof MODELS)[number]["key"];

const r1 = (v: number) => Math.round(v * 10) / 10;
const pct = (v: number) => `${(100 * v).toFixed(1)}%`;

// the reliability diagram
const S = 300, L = 40, T = 12, W = S - L - 14, H = S - T - 36;
const px = (v: number) => r1(L + v * W);
const py = (v: number) => r1(T + (1 - v) * H);

// the C strip
const SW = 300, SL = 40, ST = 14, SWd = SW - SL - 14, SH = 92;
const LO = 0.35, HI = 0.9;

export default function HowSureLab() {
  const [model, setModel] = useState<Key>("lr");
  const [ci, setCi] = useState(D.C.indexOf(D.pick));
  const row = D.lr[ci];
  const cal: Cal = model === "lr"
    ? { right: row.right, says: row.says, expected: row.expected, n_right: row.nRight, ce: row.ce, bins: row.bins }
    : D.models[model];
  const pts = cal.bins.map((b, q) => ({ q, n: b[0], x: b[1], y: b[2] })).filter((p) => p.n > 0 && p.x !== null && p.y !== null) as
    { q: number; n: number; x: number; y: number }[];
  const nMax = Math.max(...pts.map((p) => p.n));
  const over = cal.expected > cal.n_right;

  const toggle = (on: boolean): React.CSSProperties => ({
    fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
    background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400,
  });
  const group: React.CSSProperties = {
    display: "inline-flex", flexWrap: "wrap", gap: 3, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: 3,
  };
  const tile: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0,
  };
  const sx = (i: number) => r1(SL + (i / (D.C.length - 1)) * SWd);
  const sy = (v: number) => r1(ST + (1 - (v - LO) / (HI - LO)) * SH);
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ");

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>model</span>
        <div role="radiogroup" aria-label="model" style={group}>
          {MODELS.map((m) => (
            <button key={m.key} role="radio" aria-checked={model === m.key} onClick={() => setModel(m.key)} style={toggle(model === m.key)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {model === "lr" && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 10 }}>
          <label htmlFor="howsure-c" style={{ fontSize: 13, color: "var(--muted)" }}>C</label>
          <input id="howsure-c" type="range" min={0} max={D.C.length - 1} step={1} value={ci}
            onChange={(e) => setCi(Number(e.target.value))} style={{ flex: "1 1 10em", maxWidth: 260, accentColor: POST }}
            aria-valuetext={`C = ${D.C[ci]}`} />
          <span style={{ ...mono, fontSize: 13, color: "var(--ink)", minWidth: "4.5em" }}>C = {D.C[ci]}</span>
          <span style={{ fontSize: 12, color: "var(--faint)" }}>
            {D.C[ci] === D.pick ? "routes the most posts right" : D.C[ci] === D.byLogLoss ? "lowest log loss in every fold" : ""}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17em), 1fr))", gap: "12px 18px", alignItems: "start" }}>
        <figure style={{ margin: 0, minWidth: 0 }}>
          <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label="share routed right against the probability stated, per tenth of stated probability"
            style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={px(0)} x2={px(1)} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} />
                <text x={L - 6} y={py(v) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{v}</text>
                <text x={px(v)} y={T + H + 14} fontSize={10} textAnchor="middle" fill="var(--faint)">{v}</text>
              </g>
            ))}
            <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} stroke="var(--muted)" strokeDasharray="4 4" strokeWidth={1} />
            {pts.length > 1 && (
              <path d={pts.map((p, i) => `${i ? "L" : "M"}${px(p.x)},${py(p.y)}`).join(" ")} fill="none" stroke={POST} strokeWidth={1.5} opacity={0.6} />
            )}
            {pts.map((p) => (
              <circle key={p.q} cx={px(p.x)} cy={py(p.y)} r={r1(2.5 + 9 * Math.sqrt(p.n / nMax))} fill={POST} fillOpacity={0.35} stroke={POST} strokeWidth={1}>
                <title>{`${p.n} posts: says ${p.x.toFixed(2)} on average, right ${p.y.toFixed(2)}`}</title>
              </circle>
            ))}
            <text x={px(0.5)} y={S - 4} fontSize={10.5} textAnchor="middle" fill="var(--muted)">the probability it gives its pick</text>
            <text transform={`translate(11 ${py(0.5)}) rotate(-90)`} fontSize={10.5} textAnchor="middle" fill="var(--muted)">share routed right</text>
          </svg>
          <figcaption style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 4 }}>
            one circle per tenth of stated probability, sized by its posts. On the dashed line the number means what it
            says; above it the model is right more often than it says, below it less often
          </figcaption>
        </figure>

        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>routed right</div>
              <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{pct(cal.right)}</div>
            </div>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>says, on average</div>
              <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{pct(cal.says)}</div>
            </div>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>expects right, of {D.n.toLocaleString("en-US")}</div>
              <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{Math.round(cal.expected).toLocaleString("en-US")}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)" }}>gets {cal.n_right.toLocaleString("en-US")}</div>
            </div>
            <div style={tile}>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>calibration error</div>
              <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{cal.ce.toFixed(3)}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{over ? "says more than it gets" : "says less than it gets"}</div>
            </div>
          </div>

          {model === "lr" && (
            <figure style={{ margin: 0, minWidth: 0 }}>
              <svg viewBox={`0 0 ${SW} ${ST + SH + 20}`} role="img" aria-label="share routed right and the mean probability stated, at each C"
                style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                {[0.4, 0.6, 0.8].map((v) => (
                  <g key={v}>
                    <line x1={SL} x2={SL + SWd} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeWidth={1} />
                    <text x={SL - 6} y={sy(v) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{v}</text>
                  </g>
                ))}
                {D.C.map((c, i) => (
                  <text key={c} x={sx(i)} y={ST + SH + 14} fontSize={10} textAnchor="middle" fill={i === ci ? "var(--ink)" : "var(--faint)"}>{c}</text>
                ))}
                <text x={SL - 12} y={ST + SH + 14} fontSize={10.5} textAnchor="end" fill="var(--muted)">C</text>
                <line x1={sx(ci)} x2={sx(ci)} y1={ST} y2={ST + SH} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
                <path d={line(D.lr.map((r) => r.right))} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
                <path d={line(D.lr.map((r) => r.says))} fill="none" stroke={POST} strokeWidth={1.5} />
                <circle cx={sx(ci)} cy={sy(row.right)} r={3} fill="var(--ink)" />
                <circle cx={sx(ci)} cy={sy(row.says)} r={3} fill={POST} />
              </svg>
              <figcaption style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                <span><span aria-hidden style={{ display: "inline-block", width: 14, height: 2, background: "var(--ink)", verticalAlign: "3px", marginRight: 5 }} />routed right</span>
                <span><span aria-hidden style={{ display: "inline-block", width: 14, height: 2, background: POST, verticalAlign: "3px", marginRight: 5 }} />says, on average</span>
                <span style={{ ...mono }}>log loss {row.ll.toFixed(3)}</span>
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
}
