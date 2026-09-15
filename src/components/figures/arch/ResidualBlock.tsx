// F(x) + x, drawn.
//
// The depth audit called four pages about a wiring pattern with no wiring drawn
// "the clearest single omission in the audit". This is that wiring: a plain
// block and a residual block side by side, with the identity path marked,
// because the entire idea is one arrow that the plain version does not have.
//
// The backward annotation under each block is the point rather than decoration.
// In the plain block the gradient reaching x has been through every layer of
// F, so it carries a factor of the product of their Jacobians. In the residual
// block the derivative of (F(x) + x) with respect to x is F'(x) + I, and that
// identity term is a path along which the gradient arrives multiplied by
// nothing at all.
//
// Static SVG, no client JS.

const ACCENT = "var(--c-neural)";

function Box({ x, y, w, h, label, sub }: { x: number; y: number; w: number; h: number; label: string; sub?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 1 : h / 2 + 3.5)} textAnchor="middle" fontSize={9.5} fill="var(--ink)">
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" fontSize={8} fill="var(--muted)">
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color = "var(--muted)" }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 5} y2={y2} stroke={color} strokeWidth={1.2} />
      <path d={`M ${x2} ${y2} L ${x2 - 5.5} ${y2 - 3} L ${x2 - 5.5} ${y2 + 3} Z`} fill={color} />
    </g>
  );
}

const W = 440, H = 172;

/** One block, plain or residual. */
function Block({ residual, title }: { residual: boolean; title: string }) {
  const y = 62, h = 34;
  const bw = 66;
  const xs = [58, 148, 238];
  const inX = 16, outX = W - 34;
  const cx = 344; // the + node

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={title} style={{ display: "block", maxWidth: "100%" }}>
      <text x={W / 2} y={16} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">
        {title}
      </text>

      {/* input */}
      <text x={inX} y={y + h / 2 + 4} fontSize={11} fill="var(--ink)" fontStyle="italic">x</text>
      <Arrow x1={inX + 10} y1={y + h / 2} x2={xs[0]} y2={y + h / 2} />

      <Box x={xs[0]} y={y} w={bw} h={h} label="Weight" sub="Wx + b" />
      <Arrow x1={xs[0] + bw} y1={y + h / 2} x2={xs[1]} y2={y + h / 2} />
      <Box x={xs[1]} y={y} w={bw} h={h} label="Norm" sub="BatchNorm" />
      <Arrow x1={xs[1] + bw} y1={y + h / 2} x2={xs[2]} y2={y + h / 2} />
      <Box x={xs[2]} y={y} w={bw} h={h} label="ReLU" />

      {residual ? (
        <>
          <Arrow x1={xs[2] + bw} y1={y + h / 2} x2={cx - 8} y2={y + h / 2} />
          {/* the identity path */}
          <path
            d={`M ${inX + 16} ${y + h / 2 + 4} L ${inX + 16} ${y + h + 32} L ${cx} ${y + h + 32} L ${cx} ${y + h / 2 + 9}`}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.6}
          />
          <path d={`M ${cx} ${y + h / 2 + 8} L ${cx - 3} ${y + h / 2 + 14} L ${cx + 3} ${y + h / 2 + 14} Z`} fill={ACCENT} />
          <text x={(inX + 16 + cx) / 2} y={y + h + 44} textAnchor="middle" fontSize={9} fill={ACCENT}>
            identity — x, unmodified
          </text>
          <circle cx={cx} cy={y + h / 2} r={9} fill="var(--surface)" stroke={ACCENT} strokeWidth={1.6} />
          <text x={cx} y={y + h / 2 + 3.6} textAnchor="middle" fontSize={11} fill={ACCENT}>+</text>
          <Arrow x1={cx + 9} y1={y + h / 2} x2={outX} y2={y + h / 2} />
          <text x={outX + 4} y={y + h / 2 + 4} fontSize={9.5} fill="var(--ink)">
            F(x)+x
          </text>
        </>
      ) : (
        <>
          <Arrow x1={xs[2] + bw} y1={y + h / 2} x2={outX} y2={y + h / 2} />
          <text x={outX + 4} y={y + h / 2 + 4} fontSize={9.5} fill="var(--ink)">
            F(x)
          </text>
        </>
      )}

      {/* backward annotation */}
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={9} fill="var(--muted)">
        {residual
          ? "backward:  ∂out/∂x = F ′(x) + I    — the I is a path with no factors on it"
          : "backward:  ∂out/∂x = F ′(x)    — every gradient carries the whole product"}
      </text>
    </svg>
  );
}

export function ResidualBlock({ caption }: { caption?: React.ReactNode }) {
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Block residual={false} title="A plain block" />
        <Block residual title="A residual block" />
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** A stack of residual blocks — what "the residual stream" means. */
export function ResidualStack({ n = 4, caption }: { n?: number; caption?: React.ReactNode }) {
  const bw = 58, gap = 22, h = 30, y = 46;
  const width = 40 + n * (bw + gap) + 30;
  return (
    <figure style={{ margin: "1.8rem 0" }}>
      <svg viewBox={`0 0 ${width} 118`} width="100%" role="img" aria-label={`${n} residual blocks in sequence`} style={{ display: "block", maxWidth: "100%" }}>
        {/* the stream itself: one unbroken line from input to output */}
        <line x1={18} y1={y + h / 2} x2={width - 18} y2={y + h / 2} stroke={ACCENT} strokeWidth={2} />
        <text x={18} y={y - 22} fontSize={9} fill={ACCENT}>
          the residual stream — every block adds to it, none replaces it
        </text>
        {Array.from({ length: n }, (_, i) => {
          const x = 40 + i * (bw + gap);
          const plus = x + bw + gap / 2;
          return (
            <g key={i}>
              <rect x={x} y={y - 26} width={bw} height={h} rx={5} fill="var(--surface)" stroke="var(--border)" />
              <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize={9} fill="var(--ink)">
                F{i + 1}
              </text>
              <line x1={x + bw / 2} y1={y + h / 2} x2={x + bw / 2} y2={y - 26 + h} stroke="var(--muted)" strokeWidth={1} />
              <line x1={x + bw / 2} y1={y - 26 + h} x2={x + bw / 2} y2={y - 26 + h} stroke="var(--muted)" />
              <path d={`M ${plus} ${y - 6} L ${plus} ${y + h / 2 - 7}`} stroke="var(--muted)" strokeWidth={1} fill="none" />
              <circle cx={plus} cy={y + h / 2} r={7} fill="var(--surface)" stroke={ACCENT} strokeWidth={1.4} />
              <text x={plus} y={y + h / 2 + 3} textAnchor="middle" fontSize={9.5} fill={ACCENT}>+</text>
            </g>
          );
        })}
        <text x={width / 2} y={108} textAnchor="middle" fontSize={9} fill="var(--muted)">
          each block writes a correction onto the stream; the stream is never overwritten
        </text>
      </svg>
      {caption && (
        <figcaption style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
