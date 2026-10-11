"use client";

import { useState } from "react";
import kd from "@/data/routing/kernels.json";

// What gamma does to the RBF kernel on posts. The kernel weighs each earlier post by exp(-gamma d^2),
// d its distance from the post being routed. Behind the curve: how far each harness new thread sits
// from its nearest training post and from a typical one (its median one). Beside it: the share of new
// threads the kernel SVM routes right at each gamma (each at its own best C), against the linear SVM
// and the single nearest earlier post.
//
// Data: src/data/routing/kernels.json, written by `python scripts/routing_cases.py kernel_reach`.

type Row = { gamma: number; half: number; ratio: number; C: number; sv: number; right: number; alike: number };
const D = kd as unknown as {
  rows: Row[]; lin: number; bar: number; straight: { C: number; right: number }; nn1: number;
  knn: { k: number; right: number };
  reach: { near: number; mid: number; edges: number[]; nearHist: number[]; midHist: number[] };
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const r1 = (v: number) => Math.round(v * 10) / 10;
const SQ2 = Math.SQRT2;
const PICK = D.rows.reduce((b, r, i) => (r.right > D.rows[b].right ? i : b), 0);

// panel A: weight against distance
const AW = 300, AH = 204, AL = 34, AR = 36, AT = 22, AB = 40;
const ax = (d: number) => r1(AL + (d / SQ2) * (AW - AL - AR));
const ay = (w: number) => r1(AT + (1 - w) * (AH - AT - AB));
// panel B: share routed right against gamma
const BW = 300, BH = 204, BL = 34, BR = 12, BT = 22, BB = 40;
const G0 = Math.log10(D.rows[0].gamma), G1 = Math.log10(D.rows[D.rows.length - 1].gamma);
const bx = (g: number) => r1(BL + ((Math.log10(g) - G0) / (G1 - G0)) * (BW - BL - BR));
const YMAX = 0.9;
const by = (v: number) => r1(BT + (1 - v / YMAX) * (BH - BT - BB));

const gfmt = (g: number) => (g < 0.1 ? g.toFixed(2) : String(g));
const pct = (v: number, dp = 1) => `${(100 * v).toFixed(dp)}%`;
const times = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(2)) + "×";
const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(100 * v).toFixed(2)}`;

export default function KernelReachLab() {
  const [gi, setGi] = useState(PICK);
  const row = D.rows[gi];
  const g = row.gamma;
  const w = (d: number) => Math.exp(-g * d * d);
  const curve = Array.from({ length: 61 }, (_, i) => (i / 60) * SQ2)
    .map((d, i) => `${i ? "L" : "M"}${ax(d)},${ay(w(d))}`).join(" ");
  const { near, mid, edges, nearHist, midHist } = D.reach;
  const hMax = Math.max(...nearHist, ...midHist);
  const barH = (v: number) => (v / hMax) * 0.55 * (AH - AT - AB);
  const bw = ax(edges[1]) - ax(edges[0]);
  const halfIn = row.half <= SQ2;

  const tile: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", minWidth: 0,
  };
  const panel: React.CSSProperties = {
    margin: 0, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 8px 6px",
  };
  const cap: React.CSSProperties = { fontSize: 12, lineHeight: 1.35, color: "var(--ink)", marginBottom: 2 };

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 10 }}>
        <label htmlFor="reach-gamma" style={{ fontSize: 13, color: "var(--muted)" }}>gamma</label>
        <input id="reach-gamma" type="range" min={0} max={D.rows.length - 1} step={1} value={gi}
          onChange={(e) => setGi(Number(e.target.value))} style={{ flex: "1 1 10em", maxWidth: 260, accentColor: POST }}
          aria-valuetext={`gamma = ${gfmt(g)}`} />
        <span style={{ ...mono, fontSize: 13, color: "var(--ink)", minWidth: "6em" }}>gamma = {gfmt(g)}</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>{gi === PICK ? "the harness's pick" : ""}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17em), 1fr))", gap: "10px 12px" }}>
        <figure style={panel}>
          <figcaption style={cap}>how much an earlier post counts, by its distance from the post</figcaption>
          <svg viewBox={`0 0 ${AW} ${AH}`} role="img" style={{ width: "100%", height: "auto", display: "block" }}
            aria-label={`At gamma ${gfmt(g)}, the nearest earlier post counts ${times(row.ratio)} a typical one`}>
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line x1={AL} x2={AW - AR} y1={ay(t)} y2={ay(t)} stroke="var(--border)" strokeWidth={1} />
                <text x={AL - 5} y={ay(t) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{t}</text>
              </g>
            ))}
            {nearHist.map((v, i) => v > 0 && (
              <rect key={`n${i}`} x={ax(edges[i])} y={r1(ay(0) - barH(v))} width={r1(bw)} height={r1(barH(v))} fill={POST} opacity={0.22} />
            ))}
            {midHist.map((v, i) => v > 0 && (
              <rect key={`m${i}`} x={ax(edges[i])} y={r1(ay(0) - barH(v))} width={r1(bw)} height={r1(barH(v))} fill="var(--ink)" opacity={0.14} />
            ))}
            {[0, 0.5, 1, SQ2].map((d) => (
              <text key={d} x={ax(d)} y={ay(0) + 15} fontSize={10} textAnchor={d === 0 ? "start" : d === SQ2 ? "end" : "middle"} fill="var(--faint)">
                {d === SQ2 ? "1.41" : d}
              </text>
            ))}
            <text x={r1((AL + AW - AR) / 2)} y={AH - 5} fontSize={10} textAnchor="middle" fill="var(--faint)">distance between two posts</text>
            {halfIn && (
              <g>
                <line x1={AL} x2={ax(row.half)} y1={ay(0.5)} y2={ay(0.5)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
                <line x1={ax(row.half)} x2={ax(row.half)} y1={ay(0.5)} y2={ay(0)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
              </g>
            )}
            <path d={curve} fill="none" stroke={POST} strokeWidth={2} />
            <line x1={ax(near)} x2={ax(near)} y1={AT - 6} y2={ay(0)} stroke={POST} strokeWidth={1} strokeDasharray="3 3" />
            <line x1={ax(mid)} x2={ax(mid)} y1={AT - 6} y2={ay(0)} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={ax(near)} cy={ay(w(near))} r={3.5} fill={POST} />
            <circle cx={ax(mid)} cy={ay(w(mid))} r={3.5} fill="var(--ink)" />
            <text x={ax(near) - 4} y={AT - 9} fontSize={10} textAnchor="end" fill={POST}>nearest</text>
            <text x={ax(mid) + 3} y={AT - 9} fontSize={10} textAnchor="start" fill="var(--ink)">typical</text>
          </svg>
          <div style={{ ...mono, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
            nearest <span style={{ color: "var(--ink)" }}>{w(near).toFixed(3)}</span> · typical{" "}
            <span style={{ color: "var(--ink)" }}>{w(mid).toFixed(3)}</span> ·{" "}
            {halfIn ? <>halves at <span style={{ color: "var(--ink)" }}>{row.half.toFixed(2)}</span></> : <>halves beyond the farthest post</>}
          </div>
        </figure>

        <figure style={panel}>
          <figcaption style={cap}>new threads routed right, at each gamma&rsquo;s best C</figcaption>
          <svg viewBox={`0 0 ${BW} ${BH}`} role="img" style={{ width: "100%", height: "auto", display: "block" }}
            aria-label={`At gamma ${gfmt(g)} the kernel SVM routes ${pct(row.right)} of the harness's new threads right; the linear SVM ${pct(D.lin)}`}>
            {[0, 0.2, 0.4, 0.6, 0.8].map((t) => (
              <g key={t}>
                <line x1={BL} x2={BW - BR} y1={by(t)} y2={by(t)} stroke="var(--border)" strokeWidth={1} />
                <text x={BL - 5} y={by(t) + 3.5} fontSize={10} textAnchor="end" fill="var(--faint)">{t.toFixed(1)}</text>
              </g>
            ))}
            {D.rows.map((r, i) => (
              <text key={r.gamma} x={bx(r.gamma)} y={by(0) + 15} fontSize={10} textAnchor={i ? "middle" : "start"} fill="var(--faint)">{gfmt(r.gamma)}</text>
            ))}
            <text x={r1((BL + BW - BR) / 2)} y={BH - 5} fontSize={10} textAnchor="middle" fill="var(--faint)">gamma</text>
            <line x1={BL} x2={BW - BR} y1={by(D.lin)} y2={by(D.lin)} stroke="var(--ink)" strokeWidth={1.25} strokeDasharray="5 4" />
            <line x1={BL} x2={BW - BR} y1={by(D.nn1)} y2={by(D.nn1)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="1.5 3" />
            <line x1={bx(g)} x2={bx(g)} y1={BT} y2={by(0)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
            <path d={D.rows.map((r, i) => `${i ? "L" : "M"}${bx(r.gamma)},${by(r.right)}`).join(" ")} fill="none" stroke={POST} strokeWidth={1.75} />
            {D.rows.map((r, i) => (
              <circle key={r.gamma} cx={bx(r.gamma)} cy={by(r.right)} r={i === gi ? 4.5 : 2.5} fill={POST} />
            ))}
          </svg>
          <div style={{ ...mono, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
            kernel <span style={{ color: "var(--ink)" }}>{row.right.toFixed(3)}</span> · linear{" "}
            <span style={{ color: "var(--ink)" }}>{D.lin.toFixed(3)}</span> ·{" "}
            <strong style={{ color: "var(--ink)" }}>{pts(row.right - D.lin)}</strong> points
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
            <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "1.5px dashed var(--ink)", verticalAlign: "3px", marginRight: 5 }} />the linear SVM {D.lin.toFixed(3)}</span>
            <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "1.5px dotted var(--muted)", verticalAlign: "3px", marginRight: 5 }} />the nearest post alone {D.nn1.toFixed(3)}</span>
          </div>
        </figure>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: 11.5, color: "var(--muted)", margin: "6px 0 10px" }}>
        <span><span aria-hidden style={{ display: "inline-block", width: 10, height: 10, background: POST, opacity: 0.35, verticalAlign: "-1px", marginRight: 5 }} />distance to each new thread&rsquo;s nearest earlier post</span>
        <span><span aria-hidden style={{ display: "inline-block", width: 10, height: 10, background: "var(--ink)", opacity: 0.25, verticalAlign: "-1px", marginRight: 5 }} />to a typical earlier post</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9.5em), 1fr))", gap: 8 }}>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>the nearest post counts</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{times(row.ratio)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>a typical post</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>routed right</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{row.right.toFixed(3)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>at C = {row.C}</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>routed as the linear SVM</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{pct(row.alike)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>of the new threads</div>
        </div>
        <div style={tile}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>support vectors</div>
          <div style={{ ...mono, fontSize: 18, color: "var(--ink)" }}>{pct(row.sv)}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>of the training posts</div>
        </div>
      </div>
    </div>
  );
}
