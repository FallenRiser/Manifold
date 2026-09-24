"use client";

import { useMemo, useRef, useState } from "react";

// Compute the same number twice: once by building the feature vector, once by not building it.
//
// Drag the two points; turn the degree dial. The panel shows phi(x) and phi(z) coordinate by
// coordinate, their dot product, and (1 + x.z)^p -- which agree to the last bit of a double at
// every degree and every position, because they are the same arithmetic in a different order.
//
// The dial is the argument. D climbs as C(2+p, p) and the monomial list gets longer; the kernel
// column never moves, because the kernel never touches D. The "if x had d features" row is the
// same binomial in the number of features rather than the degree, which is where the gap stops
// being a curiosity.
//
// Held against the same identity by scripts/svm_kernel_check.mjs, and by
// `python scripts/svm_cases.py lift`.

const W = 560;
const PAD = 16;
const PLOT = 236;
const H = 452;
const GX = PAD + PLOT + 22;
const LIM = 2;
const PINK = "var(--c-classification)";
const SUP = ["", "", "²", "³", "⁴", "⁵", "⁶"];

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const sx = (x: number) => r3(PAD + ((x + LIM) / (2 * LIM)) * PLOT);
const sy = (z: number) => r3(PAD + PLOT - ((z + LIM) / (2 * LIM)) * PLOT);
const ux = (px: number) => ((px - PAD) / PLOT) * 2 * LIM - LIM;
const uz = (py: number) => ((PAD + PLOT - py) / PLOT) * 2 * LIM - LIM;
const clamp = (v: number) => Math.max(-LIM, Math.min(LIM, Math.round(v * 100) / 100));

function fact(n: number) {
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
}

function comb(n: number, k: number) {
  let c = 1;
  for (let i = 0; i < k; i += 1) c = (c * (n - i)) / (i + 1);
  return Math.round(c);
}

// Every coordinate of the explicit map for (1 + x.z)^p in two features: the exponents (a, b) on
// x1 and x2, and the square of the multinomial weight that (1 + u + v)^p puts on that term.
function basis(p: number) {
  const out: { a: number; b: number; w2: number; label: string }[] = [];
  for (let a = 0; a <= p; a += 1) {
    for (let b = 0; a + b <= p; b += 1) {
      const k0 = p - a - b;
      const w2 = fact(p) / (fact(k0) * fact(a) * fact(b));
      const root = Math.round(Math.sqrt(w2));
      const coef = root * root === w2 ? (root === 1 ? "" : String(root)) : `√${w2}`;
      const mono =
        a === 0 && b === 0 ? "1" : `${a ? `x₁${SUP[a]}` : ""}${b ? `x₂${SUP[b]}` : ""}`;
      out.push({ a, b, w2, label: coef && mono !== "1" ? `${coef}·${mono}` : coef || mono });
    }
  }
  return out;
}

const phi = (pt: { x: number; z: number }, bs: ReturnType<typeof basis>) =>
  bs.map((t) => Math.sqrt(t.w2) * Math.pow(pt.x, t.a) * Math.pow(pt.z, t.b));

const fmt = (v: number) => {
  const m = Math.abs(v);
  if (m >= 1e5 || (m > 0 && m < 1e-3)) return v.toExponential(3);
  return v.toFixed(m >= 1000 ? 2 : 4);
};

export function KernelTrickLab() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [p, setP] = useState(2);
  const [pts, setPts] = useState([
    { x: -1.1, z: 0.8 },
    { x: 1.3, z: -0.6 },
  ]);
  const [drag, setDrag] = useState<number | null>(null);

  const view = useMemo(() => {
    const bs = basis(p);
    const [a, b] = pts;
    const fa = phi(a, bs);
    const fb = phi(b, bs);
    let built = 0;
    for (let i = 0; i < fa.length; i += 1) built += fa[i] * fb[i];
    const inner = a.x * b.x + a.z * b.z;
    const kernel = Math.pow(1 + inner, p);
    return {
      bs, fa, fb, built, kernel, inner,
      gap: Math.abs(built - kernel),
      D: bs.length,
    };
  }, [p, pts]);

  const move = (e: React.PointerEvent) => {
    if (drag === null || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    setPts((old) => old.map((q, i) => (i === drag ? { x: clamp(ux(px)), z: clamp(uz(py)) } : q)));
  };

  const row = (yy: number, k: string, v: string, col = "var(--ink)", big = false) => (
    <>
      <text x={GX} y={yy} fontSize={11} fill="var(--muted)" letterSpacing="0.05em">
        {k}
      </text>
      <text
        x={W - PAD}
        y={yy}
        fontSize={big ? 15 : 12.5}
        textAnchor="end"
        fill={col}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {v}
      </text>
    </>
  );

  const shown = view.bs.slice(0, 15);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--panel)",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          display: "block",
          touchAction: "none",
          cursor: drag !== null ? "grabbing" : "default",
        }}
        onPointerMove={move}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        {/* the plane the two points live in -- two features, and that is the whole input */}
        <rect
          x={PAD}
          y={PAD}
          width={PLOT}
          height={PLOT}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
        {[-1, 0, 1].map((t) => (
          <g key={t}>
            <line
              x1={sx(t)}
              y1={PAD}
              x2={sx(t)}
              y2={PAD + PLOT}
              stroke="var(--border)"
              strokeWidth={t === 0 ? 1 : 0.5}
              opacity={t === 0 ? 0.9 : 0.45}
            />
            <line
              x1={PAD}
              y1={sy(t)}
              x2={PAD + PLOT}
              y2={sy(t)}
              stroke="var(--border)"
              strokeWidth={t === 0 ? 1 : 0.5}
              opacity={t === 0 ? 0.9 : 0.45}
            />
          </g>
        ))}

        <line
          x1={sx(pts[0].x)}
          y1={sy(pts[0].z)}
          x2={sx(pts[1].x)}
          y2={sy(pts[1].z)}
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.6}
        />

        {pts.map((q, i) => (
          <g key={i} style={{ cursor: "grab" }}>
            <circle
              cx={sx(q.x)}
              cy={sy(q.z)}
              r={13}
              fill="transparent"
              onPointerDown={(e) => {
                e.preventDefault();
                setDrag(i);
              }}
            />
            <circle
              cx={sx(q.x)}
              cy={sy(q.z)}
              r={6}
              fill={i === 0 ? "var(--ink)" : PINK}
              pointerEvents="none"
            />
            {/* flip the label inward near the right edge, or it lands on the readout column */}
            <text
              x={sx(q.x) + (q.x > 0.55 ? -10 : 10)}
              y={sy(q.z) - 8}
              fontSize={12}
              textAnchor={q.x > 0.55 ? "end" : "start"}
              fill={i === 0 ? "var(--ink)" : PINK}
              pointerEvents="none"
            >
              {i === 0 ? "x" : "z"} ({q.x.toFixed(2)}, {q.z.toFixed(2)})
            </text>
          </g>
        ))}

        {/* the readout: the same number, twice */}
        <text x={GX} y={PAD + 12} fontSize={11} fill="var(--muted)" letterSpacing="0.07em">
          DEGREE p
        </text>
        {[1, 2, 3, 4, 5].map((d, i) => (
          <g key={d} style={{ cursor: "pointer" }} onClick={() => setP(d)}>
            <rect
              x={GX + i * 33}
              y={PAD + 20}
              width={28}
              height={24}
              rx={5}
              fill={d === p ? PINK : "transparent"}
              stroke={d === p ? PINK : "var(--border)"}
            />
            <text
              x={GX + i * 33 + 14}
              y={PAD + 36}
              fontSize={12.5}
              textAnchor="middle"
              fill={d === p ? "var(--canvas)" : "var(--muted)"}
            >
              {d}
            </text>
          </g>
        ))}

        {row(PAD + 72, "x · z", fmt(view.inner))}
        <line
          x1={GX}
          y1={PAD + 82}
          x2={W - PAD}
          y2={PAD + 82}
          stroke="var(--border)"
          strokeWidth={0.5}
        />
        {row(PAD + 104, `φ(x) · φ(z), from ${view.D} numbers`, fmt(view.built),
             "var(--ink)", true)}
        {row(PAD + 128, `(1 + x · z)${SUP[p] || ""}`, fmt(view.kernel), PINK, true)}
        {row(PAD + 152, "difference", view.gap === 0 ? "0" : view.gap.toExponential(1),
             "var(--muted)")}
        <line
          x1={GX}
          y1={PAD + 164}
          x2={W - PAD}
          y2={PAD + 164}
          stroke="var(--border)"
          strokeWidth={0.5}
        />
        {row(PAD + 186, "coordinates in φ", String(view.D))}
        {row(PAD + 206, "multiplications, at least, the long way", String(3 * view.D))}
        {row(PAD + 226, "multiplications, the kernel", String(2 + p - 1), PINK)}

        {/* the coordinates themselves, so the space is not an abstraction */}
        <text x={PAD} y={PAD + PLOT + 26} fontSize={11} fill="var(--muted)" letterSpacing="0.07em">
          {`φ(x) = THE ${view.D} COORDINATES OF x IN THAT SPACE`}
        </text>
        {shown.map((t, i) => {
          const cx = PAD + (i % 5) * 108;
          const yy = PAD + PLOT + 48 + Math.floor(i / 5) * 32;
          return (
            <g key={`${t.a}-${t.b}`}>
              <text x={cx} y={yy} fontSize={11.5} fill="var(--muted)">
                {t.label}
              </text>
              <text
                x={cx}
                y={yy + 14}
                fontSize={12}
                fill="var(--ink)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {view.fa[i].toFixed(3)}
              </text>
            </g>
          );
        })}
        {view.D > shown.length && (
          <text x={PAD} y={PAD + PLOT + 48 + Math.ceil(shown.length / 5) * 32} fontSize={11.5}
                fill="var(--muted)">
            {`… and ${view.D - shown.length} more, all of them some x₁^a x₂^b with a + b ≤ ${p}`}
          </text>
        )}

        <text x={PAD} y={H - 26} fontSize={11} fill="var(--muted)">
          {`With d features instead of 2, φ would hold `}
          {`${comb(10 + p, p).toLocaleString("en-US")} coordinates at d=10, `}
          {`${comb(100 + p, p).toLocaleString("en-US")} at d=100.`}
        </text>
        <text x={PAD} y={H - 10} fontSize={11} fill="var(--muted)">
          {`The kernel does d + ${p} − 1 multiplications either way: `}
          {`${10 + p - 1} and ${100 + p - 1}.`}
        </text>
      </svg>
    </div>
  );
}
