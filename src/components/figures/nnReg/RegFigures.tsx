// Three small figures for the Regularisation track. They share a file because
// each is a single idea and none is reused outside this track.

const FRAME: React.CSSProperties = {
  margin: "22px 0 6px",
  padding: "14px 16px 12px",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 14,
};
const CAP: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--muted)",
  lineHeight: 1.6,
  marginTop: 9,
  paddingTop: 9,
  borderTop: "1px solid var(--border)",
};

// ---------------------------------------------------------------------------
// 1. The diagnostic quadrant.
//
// The track's one rule is "regularise only when the gap is the problem", and the
// rule is useless without its three neighbours: a model that is bad at both is
// underfitting, and no regulariser helps it. Prose states four cases in
// sequence; a 2x2 shows that they are one picture with one cell selected — and
// makes the wrong move (reaching for dropout when training accuracy is low)
// visibly a different cell rather than a judgement call.
const CELLS = [
  { tr: "high", te: "high", title: "Nothing to fix", body: "Ship it.", tint: "var(--good)", act: false },
  { tr: "high", te: "low", title: "A gap", body: "This is the one case regularisation is for.", tint: "var(--c-neural)", act: true },
  { tr: "low", te: "low", title: "Underfitting", body: "More capacity, longer training, better features. A regulariser makes it worse.", tint: "var(--bad)", act: false },
  { tr: "low", te: "high", title: "Check your split", body: "Test easier than train usually means leakage or a bad split, not a good model.", tint: "var(--warn)", act: false },
];

export function DiagnosticQuadrant({ caption }: { caption?: React.ReactNode }) {
  return (
    <figure style={FRAME}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gridTemplateRows: "auto auto auto", gap: 8, alignItems: "stretch" }}>
        <div />
        <div style={{ fontSize: 10.5, color: "var(--faint)", textAlign: "center" }}>test score high</div>
        <div style={{ fontSize: 10.5, color: "var(--faint)", textAlign: "center" }}>test score low</div>

        <div style={{ fontSize: 10.5, color: "var(--faint)", writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "center" }}>
          train score high
        </div>
        {[CELLS[0], CELLS[1]].map((c) => (
          <Cell key={c.title} c={c} />
        ))}

        <div style={{ fontSize: 10.5, color: "var(--faint)", writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "center" }}>
          train score low
        </div>
        {[CELLS[3], CELLS[2]].map((c) => (
          <Cell key={c.title} c={c} />
        ))}
      </div>
      {caption && <figcaption style={CAP}>{caption}</figcaption>}
    </figure>
  );
}

function Cell({ c }: { c: (typeof CELLS)[number] }) {
  return (
    <div
      style={{
        border: `1px ${c.act ? "solid" : "dashed"} color-mix(in srgb, ${c.tint} ${c.act ? 70 : 34}%, var(--border))`,
        background: c.act ? `color-mix(in srgb, ${c.tint} 9%, var(--surface))` : "var(--surface)",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 600, color: c.act ? c.tint : "var(--ink)", marginBottom: 3 }}>{c.title}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>{c.body}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. What the L2 penalty does to the objective.
//
// The page says the penalty "adds a bowl" and "pulls the optimum toward the
// origin". Both are geometric claims, and both are one curve each: the data
// loss, the penalty, and their sum, with the two minima marked. The distance
// between those two marks is the entire content of the chapter.
function curve(f: (w: number) => number, lo = -2.6, hi = 2.6, n = 90) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const w = lo + ((hi - lo) * i) / n;
    pts.push([w, f(w)]);
  }
  return pts;
}

export function PenaltySum({ lambda = 0.35, caption }: { lambda?: number; caption?: React.ReactNode }) {
  const wStar = 2.0;                       // where the data alone would put it
  const data = (w: number) => 0.5 * (w - wStar) ** 2;
  const pen = (w: number) => lambda * w * w;
  const sum = (w: number) => data(w) + pen(w);
  const wRidge = wStar / (1 + 2 * lambda);  // the exact minimiser of the sum

  const X0 = 30, X1 = 380, Y0 = 14, Y1 = 118;
  const px = (w: number) => X0 + ((w + 2.6) / 5.2) * (X1 - X0);
  const py = (v: number) => Y1 - (Math.min(v, 7) / 7) * (Y1 - Y0);
  const path = (f: (w: number) => number) =>
    curve(f).map(([w, v], i) => `${i ? "L" : "M"}${px(w).toFixed(1)},${py(v).toFixed(1)}`).join(" ");

  return (
    <figure style={FRAME}>
      <svg viewBox="0 0 400 140" width="100%" role="img" aria-label="data loss, L2 penalty and their sum">
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--border-strong)" strokeWidth={1} />
        <line x1={px(0)} y1={Y0} x2={px(0)} y2={Y1} stroke="var(--border-strong)" strokeWidth={0.7} strokeDasharray="2 3" />
        <path d={path(data)} fill="none" stroke="var(--muted)" strokeWidth={1.7} strokeDasharray="4 3" />
        <path d={path(pen)} fill="none" stroke="var(--warn)" strokeWidth={1.7} strokeDasharray="2 3" />
        <path d={path(sum)} fill="none" stroke="var(--c-neural)" strokeWidth={2.3} />
        {[
          { w: wStar, v: data(wStar), c: "var(--muted)", t: "data-only optimum" },
          { w: wRidge, v: sum(wRidge), c: "var(--c-neural)", t: "penalised optimum" },
        ].map((m) => (
          <g key={m.t}>
            <line x1={px(m.w)} y1={py(m.v)} x2={px(m.w)} y2={Y1} stroke={m.c} strokeWidth={0.8} />
            <circle cx={px(m.w)} cy={py(m.v)} r={3.2} fill={m.c} />
            <text x={px(m.w)} y={Y1 + 10} textAnchor="middle" fontSize={8} fill={m.c}>{m.t}</text>
          </g>
        ))}
        <text x={px(0) + 4} y={Y1 + 10} fontSize={8} fill="var(--faint)">w = 0</text>
        <text x={X1} y={Y1 + 22} textAnchor="end" fontSize={8.5} fill="var(--faint)">one weight w →</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 2 }}>
        {[
          ["data loss", "var(--muted)", "dashed"],
          ["penalty λw²", "var(--warn)", "dashed"],
          ["their sum", "var(--c-neural)", "solid"],
        ].map(([l, c, d]) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
            <span style={{ width: 14, height: 0, borderTop: `2px ${d} ${c}` }} />
            {l}
          </span>
        ))}
      </div>
      {caption && <figcaption style={CAP}>{caption}</figcaption>}
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 3. Dropout as a family of sub-networks.
//
// "Each minibatch trains a different thinned network" is the sentence every
// treatment of dropout uses, and it is exactly the sentence that needs a
// picture: four small networks, same wiring, different units switched off. Seeing
// them side by side is also what makes the ensemble interpretation land — they
// are not one network being damaged four times, they are four networks that
// share weights.
const LAYERS = [3, 5, 5, 2];
// Which units are dropped in each of the four sampled masks. Fixed, not random,
// so the figure is identical on the server and the client.
const MASKS = [
  [[], [1, 3], [0, 4], []],
  [[], [0, 2], [2, 3], []],
  [[], [2, 4], [1, 4], []],
  [[], [0, 1], [0, 2], []],
];

function Net({ drop }: { drop: number[][] }) {
  const W = 132, H = 96, colGap = W / (LAYERS.length + 0.4);
  const xs = LAYERS.map((_, i) => 16 + i * colGap);
  const ys = LAYERS.map((n) => Array.from({ length: n }, (_, j) => (H / (n + 1)) * (j + 1)));
  const dead = (l: number, j: number) => drop[l].includes(j);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="a thinned network">
      {LAYERS.slice(0, -1).map((_, l) =>
        ys[l].map((y1, j) =>
          ys[l + 1].map((y2, k) =>
            dead(l, j) || dead(l + 1, k) ? null : (
              <line key={`${l}-${j}-${k}`} x1={xs[l]} y1={y1} x2={xs[l + 1]} y2={y2} stroke="var(--border-strong)" strokeWidth={0.5} />
            ),
          ),
        ),
      )}
      {LAYERS.map((_, l) =>
        ys[l].map((y, j) => (
          <circle
            key={`${l}-${j}`}
            cx={xs[l]}
            cy={y}
            r={4}
            fill={dead(l, j) ? "var(--surface-2)" : "var(--c-neural)"}
            stroke={dead(l, j) ? "var(--faint)" : "none"}
            strokeWidth={dead(l, j) ? 1 : 0}
            opacity={dead(l, j) ? 0.7 : 0.9}
          />
        )),
      )}
    </svg>
  );
}

export function DropoutMasks({ caption }: { caption?: React.ReactNode }) {
  return (
    <figure style={FRAME}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        {MASKS.map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: 10.5, color: "var(--faint)", marginBottom: 2 }}>minibatch {i + 1}</div>
            <Net drop={m} />
          </div>
        ))}
      </div>
      {caption && <figcaption style={CAP}>{caption}</figcaption>}
    </figure>
  );
}
