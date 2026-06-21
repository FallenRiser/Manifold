"use client";

import { useState } from "react";

const XS = [-1.5, -0.8, 0, 0.5, 1.2, 1.9];
const YS = [2.1, 3.4, 5.0, 5.8, 7.2, 8.1];
const N = XS.length;

function loss(m: number, b: number) {
  let s = 0;
  for (let i = 0; i < N; i++) s += (m * XS[i] + b - YS[i]) ** 2;
  return s / N;
}

function grad(m: number, b: number): [number, number] {
  let dm = 0,
    db = 0;
  for (let i = 0; i < N; i++) {
    const e = m * XS[i] + b - YS[i];
    dm += 2 * e * XS[i];
    db += 2 * e;
  }
  return [dm / N, db / N];
}

type Step = {
  m: number;
  b: number;
  dm: number;
  db: number;
  alpha: number;
  nm: number;
  nb: number;
};

export function UpdateRuleLab() {
  const [alpha, setAlpha] = useState(0.15);
  const [history, setHistory] = useState<Step[]>([]);
  const [current, setCurrent] = useState({ m: 0.2, b: 2.0 });
  const [highlight, setHighlight] = useState<keyof Step | null>(null);

  function doStep() {
    const [dm, db] = grad(current.m, current.b);
    const nm = current.m - alpha * dm;
    const nb = current.b - alpha * db;
    const step: Step = { m: current.m, b: current.b, dm, db, alpha, nm, nb };
    setHistory((h) => [...h.slice(-4), step]);
    setCurrent({ m: nm, b: nb });
    setHighlight(null);
  }

  function reset() {
    setCurrent({ m: 0.2, b: 2.0 });
    setHistory([]);
    setHighlight(null);
  }

  const [dm, db] = grad(current.m, current.b);
  const nextM = current.m - alpha * dm;
  const nextB = current.b - alpha * db;
  const L = loss(current.m, current.b);
  const Lnext = loss(nextM, nextB);
  const delta = Lnext - L;

  // Data panel geometry
  const px = (x: number) => 44 + ((x - -2) / (2.4 - -2)) * 210;
  const py = (y: number) => 220 - ((y - 0) / 10) * 190;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 18,
        margin: "1.6rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          className="font-display"
          style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}
        >
          The update rule in action
        </span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>
          hover a term to see what it does
        </span>
      </div>

      {/* The equation display */}
      <div
        style={{
          background: "var(--canvas)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 14,
          fontFamily: "ui-monospace, monospace",
          fontSize: 15,
          display: "flex",
          flexWrap: "wrap",
          gap: "2px 4px",
          alignItems: "center",
          lineHeight: 2,
        }}
      >
        <TermPill
          label="θ_new"
          desc="New parameter value — what we'll use next step"
          color="var(--brand)"
          active={highlight === "nm"}
          onHover={() => setHighlight("nm")}
          onLeave={() => setHighlight(null)}
        />
        <span style={{ color: "var(--muted)", margin: "0 4px" }}>=</span>
        <TermPill
          label="θ"
          desc="Current parameter (slope m or intercept b)"
          color="var(--ink)"
          active={highlight === "m"}
          onHover={() => setHighlight("m")}
          onLeave={() => setHighlight(null)}
        />
        <span style={{ color: "var(--muted)", margin: "0 4px" }}>−</span>
        <TermPill
          label="α"
          desc="Learning rate — how big a step to take"
          color="var(--c-fundamentals)"
          active={highlight === "alpha"}
          onHover={() => setHighlight("alpha")}
          onLeave={() => setHighlight(null)}
        />
        <span style={{ color: "var(--muted)", margin: "0 2px" }}>×</span>
        <TermPill
          label="∇L"
          desc="Gradient — the slope of the loss surface at this point"
          color="var(--bad)"
          active={highlight === "dm"}
          onHover={() => setHighlight("dm")}
          onLeave={() => setHighlight(null)}
        />
      </div>

      {/* Description box */}
      {highlight && (
        <div
          style={{
            background:
              "color-mix(in srgb, var(--brand) 6%, var(--surface-2))",
            border: "1px solid color-mix(in srgb, var(--brand) 20%, var(--border))",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            fontSize: 13.5,
            color: "var(--muted)",
            minHeight: 36,
          }}
        >
          {highlight === "nm" &&
            "θ_new is what we store and use in the next iteration. After enough steps, it arrives at the minimum."}
          {highlight === "m" &&
            `Current value: slope m = ${current.m.toFixed(4)}, intercept b = ${current.b.toFixed(4)}. We start here and take a step away.`}
          {highlight === "alpha" &&
            `α = ${alpha.toFixed(2)} — controls the step size. Too large and we overshoot; too small and convergence is painfully slow.`}
          {highlight === "dm" &&
            `∇L_m = ${dm.toFixed(4)}, ∇L_b = ${db.toFixed(4)}. Positive gradient means we're on the uphill side; subtracting moves us downhill.`}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
          marginBottom: 14,
        }}
      >
        {/* Live numbers */}
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 13,
          }}
        >
          <div
            className="font-display"
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--faint)",
              marginBottom: 10,
            }}
          >
            Current step
          </div>
          <NumRow
            label="slope m"
            val={current.m}
            next={nextM}
            gradient={dm}
          />
          <NumRow
            label="intercept b"
            val={current.b}
            next={nextB}
            gradient={db}
          />
          <div
            style={{
              borderTop: "1px solid var(--border)",
              marginTop: 10,
              paddingTop: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--muted)" }}>Loss</span>
              <span style={{ fontWeight: 500 }}>{L.toFixed(4)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 3,
              }}
            >
              <span style={{ color: "var(--muted)" }}>After step</span>
              <span
                style={{
                  color: delta < 0 ? "var(--good)" : "var(--bad)",
                  fontWeight: 500,
                }}
              >
                {Lnext.toFixed(4)}{" "}
                <span style={{ fontSize: 11 }}>
                  ({delta > 0 ? "+" : ""}
                  {delta.toFixed(4)})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Mini scatter with current line */}
        <svg
          viewBox="0 0 270 240"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <rect
            x={44}
            y={10}
            width={210}
            height={210}
            rx={8}
            fill="var(--canvas)"
            stroke="var(--border-strong)"
          />
          {/* next line (faint) */}
          <line
            x1={px(-2)}
            y1={py(nextM * -2 + nextB)}
            x2={px(2.4)}
            y2={py(nextM * 2.4 + nextB)}
            stroke="var(--brand)"
            strokeWidth={1.5}
            strokeOpacity={0.35}
            strokeDasharray="4 3"
          />
          {/* current line */}
          <line
            x1={px(-2)}
            y1={py(current.m * -2 + current.b)}
            x2={px(2.4)}
            y2={py(current.m * 2.4 + current.b)}
            stroke="var(--brand)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {XS.map((x, i) => (
            <circle
              key={i}
              cx={px(x)}
              cy={py(YS[i])}
              r={3.5}
              fill="var(--c-regression)"
            />
          ))}
          <text
            x={149}
            y={235}
            fontSize={10}
            fill="var(--faint)"
            textAnchor="middle"
          >
            solid = current · dashed = next step
          </text>
        </svg>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            marginBottom: 12,
            background: "var(--canvas)",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            <thead>
              <tr style={{ color: "var(--faint)" }}>
                {["step", "m", "∇m", "α×∇m", "m_new", "b_new", "loss"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "2px 8px",
                        fontWeight: 400,
                        textAlign: "right",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {history.map((s, i) => (
                <tr key={i} style={{ color: "var(--muted)" }}>
                  <td style={{ padding: "2px 8px", textAlign: "right", color: "var(--faint)" }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: "2px 8px", textAlign: "right" }}>
                    {s.m.toFixed(3)}
                  </td>
                  <td
                    style={{
                      padding: "2px 8px",
                      textAlign: "right",
                      color: "var(--bad)",
                    }}
                  >
                    {s.dm.toFixed(3)}
                  </td>
                  <td style={{ padding: "2px 8px", textAlign: "right", color: "var(--c-fundamentals)" }}>
                    {(s.alpha * s.dm).toFixed(3)}
                  </td>
                  <td
                    style={{
                      padding: "2px 8px",
                      textAlign: "right",
                      color: "var(--brand)",
                      fontWeight: 500,
                    }}
                  >
                    {s.nm.toFixed(3)}
                  </td>
                  <td
                    style={{
                      padding: "2px 8px",
                      textAlign: "right",
                      color: "var(--brand)",
                    }}
                  >
                    {s.nb.toFixed(3)}
                  </td>
                  <td style={{ padding: "2px 8px", textAlign: "right" }}>
                    {loss(s.nm, s.nb).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            color: "var(--muted)",
            whiteSpace: "nowrap",
          }}
        >
          α (learning rate)
        </span>
        <input
          type="range"
          min={0.01}
          max={0.5}
          step={0.01}
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 32, textAlign: "right" }}>
          {alpha.toFixed(2)}
        </span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={doStep} style={btnPrimary}>
          Step
        </button>
        <button onClick={reset} style={btnGhost}>
          Reset
        </button>
      </div>
    </div>
  );
}

function TermPill({
  label,
  desc,
  color,
  active,
  onHover,
  onLeave,
}: {
  label: string;
  desc: string;
  color: string;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <span
      title={desc}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        display: "inline-block",
        color,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 8,
        background: active
          ? `color-mix(in srgb, ${color} 18%, var(--canvas))`
          : `color-mix(in srgb, ${color} 8%, var(--canvas))`,
        border: `1.5px solid color-mix(in srgb, ${color} ${active ? "55" : "22"}%, var(--border))`,
        cursor: "default",
        transition: "background 0.18s, border-color 0.18s",
        userSelect: "none",
      }}
    >
      {label}
    </span>
  );
}

function NumRow({
  label,
  val,
  next,
  gradient,
}: {
  label: string;
  val: number;
  next: number;
  gradient: number;
}) {
  const diff = next - val;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
        gap: 8,
      }}
    >
      <span style={{ color: "var(--muted)", minWidth: 72 }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 500 }}>
        {val.toFixed(4)}
      </span>
      <span
        style={{
          color: "var(--bad)",
          fontSize: 11.5,
          minWidth: 56,
          textAlign: "right",
        }}
      >
        ∇={gradient.toFixed(3)}
      </span>
      <span
        style={{
          color: diff < 0 ? "var(--good)" : "var(--bad)",
          fontSize: 11.5,
          minWidth: 44,
          textAlign: "right",
        }}
      >
        {diff > 0 ? "+" : ""}
        {diff.toFixed(4)}
      </span>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: "var(--cta)",
  color: "#fff",
  border: "none",
  fontSize: 13,
  fontWeight: 500,
  padding: "8px 18px",
  borderRadius: 10,
  cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "var(--muted)",
  border: "1px solid var(--border-strong)",
  fontSize: 13,
  padding: "8px 14px",
  borderRadius: 10,
  cursor: "pointer",
};
