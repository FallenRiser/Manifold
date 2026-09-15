"use client";

import { useRef, useState } from "react";
import { BoatGlyph, CourseBackdrop, makeView } from "./course";
import { D_EDGES, MARK, observeParts, viewAbsoluteParts } from "./sim";

// Two boats, two ways of cutting the water into table cells. Drag the boats; the highlighted shapes are
// the cells each view puts them in. The starting positions are the two boats from the page's code cell.

const A0 = { x: MARK.x - 35 * Math.sin((20 * Math.PI) / 180), y: MARK.y - 35 * Math.cos((20 * Math.PI) / 180) };
const B0 = { x: MARK.x - 45 * Math.sin((20 * Math.PI) / 180), y: MARK.y - 45 * Math.cos((20 * Math.PI) / 180) };

export function ViewLab() {
  const [A, setA] = useState(A0);
  const [B, setB] = useState(B0);
  const [heading, setHeading] = useState(40);
  const [show, setShow] = useState<"relative" | "absolute">("relative");
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<"A" | "B" | null>(null);
  const v = makeView(-62, 62, -32, 92, 620, 440, 320);

  const toWorld = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * v.W, py = ((e.clientY - r.top) / r.height) * v.H;
    return { x: Math.max(-60, Math.min(60, v.x0 + px / v.k)), y: Math.max(-30, Math.min(90, v.y1 - py / v.k)) };
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = toWorld(e);
    (drag.current === "A" ? setA : setB)(p);
  };

  const ra = observeParts(A.x, A.y, heading), rb = observeParts(B.x, B.y, heading);
  const aa = viewAbsoluteParts(A.x, A.y, heading), ab = viewAbsoluteParts(B.x, B.y, heading);

  // relative cell outline: bearing slice bi (bearing from boat to mark) × distance band di, drawn around the mark
  const relCell = (bi: number, di: number) => {
    const b0 = bi * 15 - 180, b1 = b0 + 15;
    const r0 = di === 0 ? 0 : D_EDGES[di - 1], r1 = di < D_EDGES.length ? D_EDGES[di] : 170;
    const pt = (bear: number, d: number) => {
      const phi = ((bear + 180) * Math.PI) / 180; // direction from mark to boat
      return `${v.sx(MARK.x + d * Math.sin(phi)).toFixed(1)},${v.sy(MARK.y + d * Math.cos(phi)).toFixed(1)}`;
    };
    let d = `M${pt(b0, r0)}`;
    for (let s = 0; s <= 6; s++) d += `L${pt(b0 + (15 * s) / 6, r1)}`;
    for (let s = 6; s >= 0; s--) d += `L${pt(b0 + (15 * s) / 6, r0)}`;
    return d + "Z";
  };
  const absCell = (xi: number, yi: number) => ({ x: v.sx(xi * 10 - 60), y: v.sy(yi * 10 - 30 + 10), w: 10 * v.k, h: 10 * v.k });

  const sameRel = ra.cell === rb.cell, sameAbs = aa.cell === ab.cell;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Where do two boats land in the table?</span>
        <span style={{ display: "flex", gap: 5 }}>
          {(["relative", "absolute"] as const).map((s) => (
            <button key={s} onClick={() => setShow(s)} style={{ ...btn, ...(show === s ? on : {}) }}>
              {s === "relative" ? "where is the mark (shipped)" : "where am I"}
            </button>
          ))}
        </span>
      </div>

      <svg ref={svg} viewBox={`0 0 ${v.W} ${v.H}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 10, border: "1px solid var(--border)", touchAction: "none" }}
        onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)} role="img" aria-label="Table cells of two boats under two views">
        <CourseBackdrop v={v} id="view" grid={1000} showEdge={false} showRing={false} />
        {show === "absolute" ? (
          <g>
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i}>
                <line x1={v.sx(-60 + i * 10)} x2={v.sx(-60 + i * 10)} y1={v.sy(-30)} y2={v.sy(90)} stroke="var(--border-strong)" />
                <line y1={v.sy(-30 + i * 10)} y2={v.sy(-30 + i * 10)} x1={v.sx(-60)} x2={v.sx(60)} stroke="var(--border-strong)" />
              </g>
            ))}
            {[{ c: aa, col: "var(--c-rl)" }, { c: ab, col: "var(--c-regression)" }].map(({ c, col }, i) => {
              const r = absCell(c.xi, c.yi);
              return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={`color-mix(in srgb, ${col} 30%, transparent)`} stroke={col} strokeWidth={1.5} />;
            })}
          </g>
        ) : (
          <g>
            {D_EDGES.map((e) => <circle key={e} cx={v.sx(MARK.x)} cy={v.sy(MARK.y)} r={e * v.k} fill="none" stroke="var(--border-strong)" />)}
            {Array.from({ length: 24 }, (_, i) => {
              const phi = (i * 15 * Math.PI) / 180;
              return <line key={i} x1={v.sx(MARK.x)} y1={v.sy(MARK.y)} x2={v.sx(MARK.x + 170 * Math.sin(phi))} y2={v.sy(MARK.y + 170 * Math.cos(phi))} stroke="var(--border)" />;
            })}
            <path d={relCell(ra.bi, ra.di)} fill="color-mix(in srgb, var(--c-rl) 26%, transparent)" stroke="var(--c-rl)" strokeWidth={1.5} />
            <path d={relCell(rb.bi, rb.di)} fill="color-mix(in srgb, var(--c-regression) 22%, transparent)" stroke="var(--c-regression)" strokeWidth={1.5} />
          </g>
        )}
        <circle cx={v.sx(MARK.x)} cy={v.sy(MARK.y)} r={5} fill="var(--good)" />
        {[{ p: A, n: "A" as const, c: "var(--c-rl)" }, { p: B, n: "B" as const, c: "var(--c-regression)" }].map(({ p, n, c }) => (
          <g key={n} style={{ cursor: "grab" }} onPointerDown={(e) => { drag.current = n; svg.current?.setPointerCapture(e.pointerId); }}>
            <circle cx={v.sx(p.x)} cy={v.sy(p.y)} r={16} fill="transparent" />
            <BoatGlyph x={p.x} y={p.y} h={heading} color={c} v={v} size={1.2} />
            <text x={v.sx(p.x) + 12} y={v.sy(p.y) - 8} fontSize={13} fontWeight={700} fill={c}>{n}</text>
          </g>
        ))}
      </svg>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        <span style={{ minWidth: 120 }}>both heading <b style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink)" }}>{heading}°</b></span>
        <input type="range" min={-175} max={175} step={5} value={heading} onChange={(e) => setHeading(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="heading" />
        <button style={btn} onClick={() => { setA(A0); setB(B0); setHeading(40); }}>the code cell&rsquo;s boats</button>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 8, marginTop: 10, fontSize: 12.5 }}>
        <div style={card(show === "relative")}>
          <div style={{ color: "var(--muted)" }}>where is the mark (shipped)</div>
          <div style={mono}>A → {ra.cell} · B → {rb.cell}</div>
          <div style={{ color: sameRel ? "var(--good)" : "var(--bad)" }}>{sameRel ? "same cell: what A learns, B already knows" : "different cells"}</div>
        </div>
        <div style={card(show === "absolute")}>
          <div style={{ color: "var(--muted)" }}>where am I</div>
          <div style={mono}>A → {aa.cell} · B → {ab.cell}</div>
          <div style={{ color: sameAbs ? "var(--good)" : "var(--bad)" }}>{sameAbs ? "same cell" : "different cells: the lesson must be learned twice"}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        Drag A and B. In the shipped view a cell is a slice of bearing (15°) times a distance band (edges at 15, 30, 50, 80 and 120 m) —
        wedges round the mark — times the heading slice. In the other it is a 10 m square times the heading slice.
      </div>
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "4px 10px", fontSize: 12, color: "var(--ink)", background: "transparent" };
const on: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)" };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, monospace", color: "var(--ink)", fontSize: 13.5, margin: "2px 0" };
const card = (active: boolean): React.CSSProperties => ({ border: `1px solid ${active ? "var(--c-rl)" : "var(--border)"}`, borderRadius: 9, padding: "7px 10px" });
