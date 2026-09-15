"use client";

import { useRef, useState } from "react";
import { NO_GO, RAMP, bestAngle, polarWith } from "./sim";

// The sailor's polar diagram, drawn the way sailors draw it: wind from the top, the boat at the centre,
// and the distance to the curve in each direction is the speed the boat settles at on that heading.
// The best upwind heading is where a horizontal line touches the top of the curve — the highest point
// the boat can reach toward the wind per second.

const R = 58; // px per m/s

export function PolarLab() {
  const [noGo, setNoGo] = useState(NO_GO);
  const [ramp, setRamp] = useState(RAMP);
  const [angle, setAngle] = useState(80);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const W = 400, H = 380, ox = 150, oy = 200;
  const best = bestAngle(noGo, ramp);
  const pt = (a: number, s: number) => ({ x: ox + s * R * Math.sin((a * Math.PI) / 180), y: oy - s * R * Math.cos((a * Math.PI) / 180) });

  let curve = "", mirror = "";
  for (let a = 0; a <= 180; a += 1) {
    const s = polarWith(a, noGo, ramp);
    const p = pt(a, s), m = pt(-a, s);
    curve += `${a ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    mirror += `${a ? "L" : "M"}${m.x.toFixed(1)},${m.y.toFixed(1)}`;
  }

  const s = polarWith(angle, noGo, ramp);
  const vmg = s * Math.cos((angle * Math.PI) / 180);
  const p = pt(angle, s);
  const bp = pt(best.angle, polarWith(best.angle, noGo, ramp));

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W - ox;
    const y = ((e.clientY - r.top) / r.height) * H - oy;
    let a = (Math.atan2(x, -y) * 180) / Math.PI;
    a = Math.max(0, Math.min(180, Math.abs(a)));
    setAngle(Math.round(a * 2) / 2);
  };

  const wedge = (deg: number, rad: number) => {
    const t = (deg * Math.PI) / 180;
    return `M${ox},${oy} L${ox - rad * Math.sin(t)},${oy - rad * Math.cos(t)} A${rad},${rad} 0 0 1 ${ox + rad * Math.sin(t)},${oy - rad * Math.cos(t)} Z`;
  };

  const ours = noGo === NO_GO && ramp === RAMP;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <span style={head}>The polar diagram, and the best way upwind</span>
        {!ours && <button style={btn} onClick={() => { setNoGo(NO_GO); setRamp(RAMP); }}>back to our boat</button>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-start" }}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} style={{ flex: "1 1 300px", maxWidth: 440, height: "auto", touchAction: "none", cursor: "grab" }}
          onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); onMove(e); }}
          onPointerMove={onMove} onPointerUp={() => (dragging.current = false)} role="img" aria-label="Polar diagram of boat speed against angle to the wind">
          {[1, 2, 3].map((k) => (
            <g key={k}>
              <circle cx={ox} cy={oy} r={k * R} fill="none" stroke="var(--border)" />
              <text x={ox - 4} y={oy + k * R - 4} fontSize={10} fill="var(--faint)" textAnchor="end">{k} m/s</text>
            </g>
          ))}
          {[30, 60, 90, 120, 150].map((a) => {
            const q = pt(a, 3.25);
            return (
              <g key={a}>
                <line x1={ox} y1={oy} x2={q.x} y2={q.y} stroke="var(--border)" />
                <text x={pt(a, 3.45).x} y={pt(a, 3.45).y + 4} fontSize={10} fill="var(--faint)" textAnchor="middle">{a}°</text>
              </g>
            );
          })}
          <path d={wedge(noGo, 3.1 * R)} fill="color-mix(in srgb, var(--bad) 12%, transparent)" />
          <text x={ox} y={oy - 3.05 * R + 30} fontSize={10.5} fill="var(--bad)" textAnchor="middle">no-go</text>
          {/* wind */}
          <g stroke="var(--c-regression)" strokeWidth={1.6} fill="none" opacity={0.7}>
            <line x1={ox} y1={4} x2={ox} y2={20} /><path d={`M${ox - 4},15 L${ox},21 L${ox + 4},15`} />
          </g>
          <text x={ox + 8} y={16} fontSize={11} fill="var(--c-regression)">wind</text>

          <path d={mirror} fill="none" stroke="var(--border-strong)" strokeWidth={1.4} />
          <path d={curve} fill="none" stroke="var(--ink)" strokeWidth={2} />

          {/* the sailor's construction: the highest point the boat can reach toward the wind */}
          <line x1={ox - 3.2 * R} x2={ox + 3.3 * R} y1={bp.y} y2={bp.y} stroke="var(--c-rl)" strokeDasharray="5 4" strokeWidth={1.3} />
          <circle cx={bp.x} cy={bp.y} r={4.5} fill="var(--c-rl)" />
          <text x={6} y={bp.y - 6} fontSize={11} fill="var(--c-rl)">best: {best.angle.toFixed(1)}°</text>

          {/* the heading you are dragging, and its upwind part */}
          <line x1={ox} y1={oy} x2={p.x} y2={p.y} stroke="var(--c-regression)" strokeWidth={2.2} />
          <line x1={p.x} y1={p.y} x2={ox - 14} y2={p.y} stroke="var(--c-regression)" strokeDasharray="2 3" opacity={0.7} />
          <line x1={ox - 14} y1={oy} x2={ox - 14} y2={p.y} stroke={vmg >= 0 ? "var(--good)" : "var(--bad)"} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
          <circle cx={p.x} cy={p.y} r={8} fill="var(--c-regression)" stroke="var(--surface)" strokeWidth={2} style={{ cursor: "grab" }} />
          <circle cx={ox} cy={oy} r={3} fill="var(--ink)" />
        </svg>

        <div style={{ flex: "1 1 200px", minWidth: 200 }}>
          <Readout label="heading off the wind" value={`${angle.toFixed(1)}°`} />
          <Readout label="boat speed" value={`${s.toFixed(3)} m/s`} color="var(--c-regression)" />
          <Readout label="toward the wind (VMG)" value={`${vmg >= 0 ? "+" : ""}${vmg.toFixed(3)} m/s`} color={vmg >= 0 ? "var(--good)" : "var(--bad)"} />
          <div style={{ height: 8 }} />
          <Readout label="best upwind angle" value={`${best.angle.toFixed(1)}°`} color="var(--c-rl)" />
          <Readout label="its VMG" value={`+${best.vmg.toFixed(3)} m/s`} color="var(--c-rl)" />
          <Readout label="50 m upwind takes at least" value={`${(50 / best.vmg).toFixed(1)} s`} />

          <label style={sl}>
            <span style={{ minWidth: 104 }}>NO_GO <b style={mono}>{noGo}°</b></span>
            <input type="range" min={10} max={45} step={1} value={noGo} onChange={(e) => setNoGo(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="no-go zone" />
          </label>
          <label style={sl}>
            <span style={{ minWidth: 104 }}>RAMP <b style={mono}>{ramp}°</b></span>
            <input type="range" min={3} max={30} step={1} value={ramp} onChange={(e) => setRamp(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--c-rl)" }} aria-label="ramp" />
          </label>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>
        Drag the blue handle round the curve. The thick bar on the wind axis is how far toward the wind one second at that heading takes
        you — green upwind, red downwind. The dashed gold line sits at the highest point of the curve: no heading reaches further upwind
        per second.
      </div>
    </div>
  );
}

function Readout({ label, value, color = "var(--ink)" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "3px 0", borderBottom: "1px dashed var(--border)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontFamily: "ui-monospace, monospace", color }}>{value}</span>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "4px 10px", fontSize: 12, color: "var(--ink)", background: "transparent" };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 12 };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
