"use client";

import { useMemo, useRef, useState } from "react";

// Gamma is a length. This lab draws that length on top of the data so you can see it.
//
// The ring around the cursor point is the half-life: the distance at which the rbf kernel's
// similarity has fallen to 1/2, sqrt(ln2 / gamma). Points inside it are what the model can still
// see from there. Slide gamma and the ring is the only thing that moves -- the data never
// changes -- and the two readouts underneath say how many points the ring holds and how much of
// the training set has turned into support vectors.
//
// The three worlds exist so the dial is not the only variable. A ring big enough to span a moon
// is far too big to resolve a circle inside a circle, which is the page's point: there is no
// gamma that is correct on its own, only a gamma matched to how far apart the things you need to
// tell apart actually are.
//
// The boundary is drawn by the same dual solver the rest of the track uses, with an rbf Gram
// matrix in place of the linear one -- page 12's one-line change, running in the browser.
//
// Held by scripts/svm_choice_check.mjs against `python scripts/svm_cases.py reach`.

import { rbfFit, type Pt } from "./svmSolver";

const W = 560;
const PAD = 16;
const PLOT = 268;
const H = 352;
const GX = PAD + PLOT + 24;
const N = 60;
const C = 1;
const PINK = "var(--c-classification)";
const BLUE = "var(--c-regression)";
const GAMMAS = [0.05, 0.2, 0.5, 1, 3, 10, 40, 200];

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r6 = (v: number) => Math.round(v * 1e6) / 1e6;

// A deterministic sampler: no Math.log or Math.cos anywhere near the coordinates, because those
// are not correctly rounded and the server and the browser would disagree in the last bits.
function rand(seed: number) {
  let s = (seed * 1103515245 + 12345) & 0x7fffffff;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Sum of 6 uniforms, shifted and scaled: bell-shaped, and pure arithmetic.
const gauss = (u: () => number) => {
  let t = 0;
  for (let i = 0; i < 6; i += 1) t += u();
  return (t - 3) / 1.2247;
};

function world(kind: string, seed: number): Pt[] {
  const u = rand(seed);
  const out: Pt[] = [];
  for (let i = 0; i < N; i += 1) {
    const y = i % 2 === 0 ? 1 : -1;
    let x = 0;
    let z = 0;
    if (kind === "straight") {
      x = gauss(u) * 0.62 + y * 0.72;
      z = gauss(u) * 0.86;
    } else if (kind === "rings") {
      // angle from a uniform, turned into a point with a polynomial approximation-free route:
      // walk the unit circle by index so no trig is needed on the sample itself.
      const t = (i / N) * 2 + u() * 0.05;
      const rad = y > 0 ? 0.42 : 1.0;
      const cx = Math.cos(Math.PI * t);
      const cz = Math.sin(Math.PI * t);
      x = cx * rad + gauss(u) * 0.1;
      z = cz * rad + gauss(u) * 0.1;
    } else {
      const t = i / N;
      const cx = Math.cos(Math.PI * t);
      const cz = Math.sin(Math.PI * t);
      x = y > 0 ? cx : 1 - cx;
      z = y > 0 ? cz - 0.28 : 0.28 - cz;
      x = x * 0.9 - 0.45 + gauss(u) * 0.14;
      z = z * 0.9 + gauss(u) * 0.14;
    }
    out.push({ x: r6(x), z: r6(z), y });
  }
  return out;
}

export function KernelChoiceLab() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [kind, setKind] = useState("rings");
  const [gi, setGi] = useState(3);
  const [probe, setProbe] = useState<{ x: number; z: number }>({ x: 0.0, z: 0.0 });
  const [dragging, setDragging] = useState(false);

  const gamma = GAMMAS[gi];
  const pts = useMemo(() => world(kind, 7), [kind]);

  const lim = useMemo(() => {
    let m = 1.2;
    for (const p of pts) m = Math.max(m, Math.abs(p.x) + 0.25, Math.abs(p.z) + 0.25);
    return r3(m);
  }, [pts]);

  const sx = (x: number) => r3(PAD + ((x + lim) / (2 * lim)) * PLOT);
  const sy = (z: number) => r3(PAD + PLOT - ((z + lim) / (2 * lim)) * PLOT);
  const ux = (px: number) => ((px - PAD) / PLOT) * 2 * lim - lim;
  const uz = (py: number) => ((PAD + PLOT - py) / PLOT) * 2 * lim - lim;

  // The data's own scale. Depends on the points and nothing else, so it is not recomputed
  // when gamma moves or the probe is dragged.
  const near = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < pts.length; i += 1) {
      let best = Infinity;
      for (let j = 0; j < pts.length; j += 1) {
        if (i === j) continue;
        const dx = pts[i].x - pts[j].x;
        const dz = pts[i].z - pts[j].z;
        best = Math.min(best, Math.sqrt(dx * dx + dz * dz));
      }
      acc += best;
    }
    return r3(acc / pts.length);
  }, [pts]);

  // The fit. Keyed on the data and gamma ONLY -- dragging the probe must not re-solve an SVM.
  const view = useMemo(() => {
    const fit = rbfFit(pts, C, gamma);
    const sv = fit.alpha.map((a) => a > 1e-6);
    let right = 0;
    for (let i = 0; i < pts.length; i += 1) {
      if (Math.sign(fit.f[i]) === pts[i].y) right += 1;
    }
    return {
      fit,
      sv,
      nsv: sv.filter(Boolean).length,
      // the distance at which exp(-gamma r^2) has fallen to 1/2
      half: Math.sqrt(Math.LN2 / gamma),
      train: right / pts.length,
    };
  }, [pts, gamma]);

  // The only thing the probe actually changes.
  const inRing = useMemo(() => {
    let k = 0;
    for (const p of pts) {
      const dx = p.x - probe.x;
      const dz = p.z - probe.z;
      if (Math.sqrt(dx * dx + dz * dz) <= view.half) k += 1;
    }
    return k;
  }, [pts, probe, view.half]);

  // The decision regions. Emitting one <rect> per grid cell put ~800 elements on the page and
  // React spent longer laying them out than the solver spent solving -- so the shading is
  // quantised into four bands and each row collapsed into runs of equal fill. A smooth region
  // becomes one rect instead of twenty-eight, and it looks the same.
  const bands = useMemo(() => {
    const G = 28;
    const step = (2 * lim) / G;
    const cw = PLOT / G + 0.6;
    const out: { x: number; y: number; w: number; fill: string; o: number }[] = [];
    for (let b = 0; b < G; b += 1) {
      const z = -lim + (b + 0.5) * step;
      let runStart = 0;
      let runKey = "";
      const flush = (end: number, key: string) => {
        if (!key || end <= runStart) return;
        const [sg, lvl] = key.split(":");
        out.push({
          x: sx(-lim + runStart * step) - cw / 2,
          y: sy(z) - cw / 2,
          w: (end - runStart - 1) * (PLOT / G) + cw,
          fill: sg === "1" ? PINK : BLUE,
          o: Number(lvl) / 100,
        });
      };
      for (let a = 0; a < G; a += 1) {
        const x = -lim + (a + 0.5) * step;
        // score() runs through Math.exp, which is NOT required to be correctly rounded, so the
        // server and the browser disagree in the last bits and React refuses to hydrate.
        // Quantising here settles every attribute that depends on it.
        const sc = view.fit.score(x, z);
        const lvl = Math.min(4, Math.max(1, Math.ceil(Math.abs(sc) * 2.5)));
        const key = `${sc > 0 ? 1 : 0}:${4 + lvl * 4}`;
        if (key !== runKey) {
          flush(a, runKey);
          runStart = a;
          runKey = key;
        }
      }
      flush(G, runKey);
    }
    return { out, h: PLOT / 28 + 0.6 };
  }, [view, lim]);

  const move = (e: React.PointerEvent) => {
    if (!dragging || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    if (px > PAD + PLOT + 4) return;
    setProbe({
      x: Math.max(-lim, Math.min(lim, Math.round(ux(px) * 100) / 100)),
      z: Math.max(-lim, Math.min(lim, Math.round(uz(py) * 100) / 100)),
    });
  };

  const row = (yy: number, k: string, v: string, col = "var(--ink)", big = false) => (
    <>
      <text x={GX} y={yy} fontSize={11} fill="var(--muted)">
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
          cursor: dragging ? "grabbing" : "default",
        }}
        onPointerMove={move}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <rect x={0} y={0} width={W} height={H} fill="var(--canvas)" />

        <clipPath id="kcl-plot">
          <rect x={PAD} y={PAD} width={PLOT} height={PLOT} />
        </clipPath>

        <g clipPath="url(#kcl-plot)">
          {bands.out.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={c.w}
              height={bands.h}
              fill={c.fill}
              opacity={c.o}
            />
          ))}
        </g>

        <rect
          x={PAD}
          y={PAD}
          width={PLOT}
          height={PLOT}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />

        {/* the half-life ring: what the kernel can still see from the probe point */}
        <g clipPath="url(#kcl-plot)">
          <circle
            cx={sx(probe.x)}
            cy={sy(probe.z)}
            r={r3((view.half / (2 * lim)) * PLOT)}
            fill="var(--ink)"
            fillOpacity={0.05}
            stroke="var(--ink)"
            strokeWidth={1.2}
            strokeDasharray="4 3"
          />
        </g>

        {pts.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.z)}
            r={view.sv[i] ? 4.4 : 3}
            fill={p.y > 0 ? PINK : BLUE}
            opacity={view.sv[i] ? 1 : 0.42}
          />
        ))}

        <circle
          cx={sx(probe.x)}
          cy={sy(probe.z)}
          r={11}
          fill="transparent"
          style={{ cursor: "grab" }}
          onPointerDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
        />
        <circle cx={sx(probe.x)} cy={sy(probe.z)} r={3.5} fill="var(--ink)" pointerEvents="none" />

        {/* controls */}
        <text x={GX} y={PAD + 11} fontSize={11} fill="var(--muted)" letterSpacing="0.07em">
          WORLD
        </text>
        {["straight", "rings", "moons"].map((k, i) => (
          <g key={k} style={{ cursor: "pointer" }} onClick={() => setKind(k)}>
            <rect
              x={GX}
              y={PAD + 18 + i * 25}
              width={122}
              height={21}
              rx={5}
              fill={k === kind ? PINK : "transparent"}
              stroke={k === kind ? PINK : "var(--border)"}
            />
            <text
              x={GX + 61}
              y={PAD + 32 + i * 25}
              fontSize={11.5}
              textAnchor="middle"
              fill={k === kind ? "var(--canvas)" : "var(--muted)"}
            >
              {k}
            </text>
          </g>
        ))}

        <text x={GX} y={PAD + 110} fontSize={11} fill="var(--muted)" letterSpacing="0.07em">
          GAMMA
        </text>
        {GAMMAS.map((g, i) => (
          <g key={g} style={{ cursor: "pointer" }} onClick={() => setGi(i)}>
            <rect
              x={GX + (i % 4) * 32}
              y={PAD + 118 + Math.floor(i / 4) * 26}
              width={28}
              height={22}
              rx={4}
              fill={i === gi ? PINK : "transparent"}
              stroke={i === gi ? PINK : "var(--border)"}
            />
            <text
              x={GX + (i % 4) * 32 + 14}
              y={PAD + 133 + Math.floor(i / 4) * 26}
              fontSize={10.5}
              textAnchor="middle"
              fill={i === gi ? "var(--canvas)" : "var(--muted)"}
            >
              {g}
            </text>
          </g>
        ))}

        {row(PAD + 196, "half-life distance", view.half.toFixed(3), "var(--ink)", true)}
        {row(PAD + 216, "nearest-neighbour distance", near.toFixed(3))}
        {row(PAD + 236, "points inside the ring", String(inRing))}
        {row(PAD + 262, "support vectors", `${view.nsv} of ${N}`, PINK, true)}
        {row(PAD + 282, "training accuracy", view.train.toFixed(4))}

        <text x={PAD} y={PAD + PLOT + 36} fontSize={11.5} fill="var(--muted)">
          {`The dashed ring is how far the kernel can see from that point: the distance at which `}
        </text>
        <text x={PAD} y={PAD + PLOT + 52} fontSize={11.5} fill="var(--muted)">
          {`similarity has halved. Drag it around. Shading is the boundary the dual returns.`}
        </text>
      </svg>
    </div>
  );
}
