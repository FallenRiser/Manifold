"use client";

import { useState } from "react";
import res from "@/data/routing/resolution.json";

// How finely can a test set settle a comparison? Eight comparisons the capstone's first pages drew
// conclusions from, each a pair of models scored on the same 2,527 later new threads.
//
// Each model on its own gets the usual interval for an accuracy. The difference between them gets
// the paired interval, and only the posts where the two disagree move it: one post's (a - b) is
// +1, -1 or 0, so its standard deviation is sqrt(pa + pb - (pa - pb)^2), where pa and pb are the
// shares of posts only a, or only b, gets right. The slider rescales the test set with those shares
// held fixed. At the real size the lab shows the script's 2,000-resample bootstrap interval, the one
// the page prints; the script refuses to write the data if the normal interval's half-width differs
// from the bootstrap's by more than 0.2 points, so the two join without a visible jump.
//
// Data: src/data/routing/resolution.json, written by `python scripts/routing_cases.py resolution`.

type Pair = { key: string; a: string; b: string; acc_a: number; acc_b: number; only_a: number; only_b: number; lo: number; hi: number };
const D = res as { n: number; pairs: Pair[] };

const Z = 1.959964;
const PAGE: Record<string, string> = { view: "page 1", sklearn: "page 4", tail: "page 4", minilm: "page 1", bge: "page 1", mini_both: "page 1", bge_both: "page 1", final: "page 1" };
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const POST = "var(--c-post)";
const fmt = (x: number) => x.toLocaleString("en-US");
const pts = (x: number, sign = true) => `${sign && x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(100 * x).toFixed(1)}`;
// a bound just clear of zero keeps a second decimal, so a settled result never reads "0.0"
const near = (x: number) => (100 * x < 0.1 ? (100 * x).toFixed(2) : (100 * x).toFixed(1));

// the slider runs on log10(posts) in thousandths
const LO = 2, HI = 5;
const toN = (v: number) => Math.round(10 ** (v / 1000));

// two axes: accuracy for each model alone, points for the difference
const ACC = [0.7, 0.92] as const;
const DIF = [-0.03, 0.07] as const;
const pos = (x: number, [a, b]: readonly [number, number]) => Math.round(10000 * Math.min(1, Math.max(0, (x - a) / (b - a)))) / 100;

function Axis({ ticks, dom, label }: { ticks: number[]; dom: readonly [number, number]; label: (t: number) => string }) {
  return (
    <div style={{ position: "relative", height: 16, marginTop: 4 }}>
      {ticks.map((t) => (
        <span key={t} style={{ ...mono, position: "absolute", left: `${pos(t, dom)}%`, transform: "translateX(-50%)", fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap" }}>
          {label(t)}
        </span>
      ))}
    </div>
  );
}

function Bar({ lo, hi, mid, dom, colour, tag }: { lo: number; hi: number; mid: number; dom: readonly [number, number]; colour: string; tag: string }) {
  const l = pos(lo, dom), r = pos(hi, dom), m = pos(mid, dom);
  const capL = lo < dom[0], capR = hi > dom[1];
  return (
    <div style={{ position: "relative", height: 20 }}>
      <div style={{ position: "absolute", top: 9, height: 2, left: `${l}%`, width: `${r - l}%`, background: colour, borderRadius: 1 }} />
      {!capL && <div style={{ position: "absolute", top: 4, height: 12, width: 2, left: `calc(${l}% - 1px)`, background: colour }} />}
      {!capR && <div style={{ position: "absolute", top: 4, height: 12, width: 2, left: `calc(${r}% - 1px)`, background: colour }} />}
      {capL && <span style={{ position: "absolute", top: 1, left: 0, fontSize: 11, color: colour }}>◂</span>}
      {capR && <span style={{ position: "absolute", top: 1, right: 0, fontSize: 11, color: colour }}>▸</span>}
      <div style={{ position: "absolute", top: 5, width: 10, height: 10, borderRadius: "50%", left: `calc(${m}% - 5px)`, background: colour, border: "2px solid var(--surface)" }} />
      {/* the tag sits past whichever end of the interval has room, never on the line itself */}
      <span style={{ ...mono, position: "absolute", top: 3, fontSize: 10.5, fontWeight: 600, color: colour, whiteSpace: "nowrap", ...(100 - r >= l ? { left: `calc(${r}% + 8px)` } : { right: `calc(${100 - l}% + 8px)` }) }}>{tag}</span>
    </div>
  );
}

export default function ResolutionLab() {
  const [k, setK] = useState(D.pairs.findIndex((p) => p.key === "bge"));
  const [N, setN] = useState(D.n);
  const p = D.pairs[k];

  const pa = p.only_a / D.n, pb = p.only_b / D.n;
  const diff = pa - pb;
  const sd1 = Math.sqrt(pa + pb - (pa - pb) ** 2);
  const half = (Z * sd1) / Math.sqrt(N);
  const atReal = N === D.n;
  // at the real size, the script's bootstrap interval (what the output block prints); elsewhere the normal one
  const lo = atReal ? p.lo : diff - half, hi = atReal ? p.hi : diff + half;
  const need = diff === 0 ? Infinity : ((Z * sd1) / diff) ** 2;
  const one = (a: number) => (Z * Math.sqrt(a * (1 - a))) / Math.sqrt(N);
  const settled = lo > 0 || hi < 0;
  const overlap = p.acc_a - one(p.acc_a) < p.acc_b + one(p.acc_b) && p.acc_b - one(p.acc_b) < p.acc_a + one(p.acc_a);

  const onSlide = (v: number) => {
    const n = toN(v);
    setN(Math.abs(Math.log10(n / D.n)) < 0.02 ? D.n : n);
  };

  const A = "var(--c-post)";
  const B = "var(--c-dimred)";

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px 14px" }}>
      <div role="radiogroup" aria-label="comparison" style={{ display: "grid", gap: 3, marginBottom: 14 }}>
        {D.pairs.map((q, i) => {
          const on = i === k;
          return (
            <button
              key={q.key}
              role="radio"
              aria-checked={on}
              onClick={() => setK(i)}
              style={{
                display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", textAlign: "left",
                fontSize: 13, padding: "5px 10px", borderRadius: 7, cursor: "pointer",
                border: on ? `1px solid color-mix(in srgb, ${POST} 55%, var(--border))` : "1px solid transparent",
                background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)",
              }}
            >
              <span>
                <span style={{ fontWeight: on ? 600 : 400 }}>{q.a}</span> vs {q.b}
              </span>
              <span style={{ ...mono, fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap" }}>{PAGE[q.key]}</span>
            </button>
          );
        })}
      </div>

      <label style={{ display: "block", fontSize: 12.5, color: "var(--muted)", marginBottom: 2 }}>
        posts in the test set: <strong style={{ ...mono, color: "var(--ink)" }}>{fmt(N)}</strong>
        {atReal && <span style={{ color: "var(--faint)" }}> · the later new threads</span>}
      </label>
      <input
        type="range"
        min={LO * 1000}
        max={HI * 1000}
        step={5}
        value={Math.round(Math.log10(N) * 1000)}
        onChange={(e) => onSlide(Number(e.target.value))}
        aria-label="posts in the test set"
        style={{ width: "100%", accentColor: POST }}
      />
      <div style={{ position: "relative", height: 14, ...mono, fontSize: 10.5, color: "var(--faint)" }}>
        <span style={{ position: "absolute", left: 0 }}>100</span>
        <span style={{ position: "absolute", left: `${Math.round(10000 * (Math.log10(D.n) - LO) / (HI - LO)) / 100}%`, transform: "translateX(-50%)" }}>{fmt(D.n)}</span>
        <span style={{ position: "absolute", right: 0 }}>100,000</span>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>each model on its own: accuracy, with its 95% interval</div>
      <div style={{ position: "relative", marginTop: 4 }}>
        <Bar lo={p.acc_a - one(p.acc_a)} hi={p.acc_a + one(p.acc_a)} mid={p.acc_a} dom={ACC} colour={A} tag="a" />
        <Bar lo={p.acc_b - one(p.acc_b)} hi={p.acc_b + one(p.acc_b)} mid={p.acc_b} dom={ACC} colour={B} tag="b" />
      </div>
      <Axis ticks={[0.7, 0.75, 0.8, 0.85, 0.9]} dom={ACC} label={(t) => t.toFixed(2)} />

      <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted)" }}>a minus b, on the same posts: points, with the 95% interval</div>
      <div style={{ position: "relative", marginTop: 4 }}>
        <div style={{ position: "absolute", top: -2, bottom: -2, left: `${pos(0, DIF)}%`, width: 0, borderLeft: "1px dashed var(--muted)" }} />
        <Bar lo={lo} hi={hi} mid={diff} dom={DIF} colour={settled ? "var(--ink)" : "var(--faint)"} tag="a − b" />
      </div>
      <Axis ticks={[-0.02, 0, 0.02, 0.04, 0.06]} dom={DIF} label={(t) => pts(t)} />

      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}>
        <div>
          <span style={{ ...mono, color: A, fontWeight: 600 }}>a</span> {p.a} {(100 * p.acc_a).toFixed(1)}%,{" "}
          <span style={{ ...mono, color: B, fontWeight: 600 }}>b</span> {p.b} {(100 * p.acc_b).toFixed(1)}%.
          They disagree on <strong>{fmt(p.only_a + p.only_b)}</strong> of the {fmt(D.n)} posts: {fmt(p.only_a)} only a gets right,{" "}
          {fmt(p.only_b)} only b.
        </div>
        <div style={{ marginTop: 6 }}>
          {settled ? (
            <>
              <strong>Settled</strong> at {fmt(N)} posts: a is {diff > 0 ? "ahead" : "behind"} by{" "}
              {near(Math.min(Math.abs(lo), Math.abs(hi)))} to {pts(Math.max(Math.abs(lo), Math.abs(hi)), false)} points.
            </>
          ) : (
            <>
              <strong>Not settled</strong> at {fmt(N)} posts: the interval runs from {pts(lo)} to {pts(hi)} points and zero is inside it.
            </>
          )}
          {overlap && settled && <> The two intervals above overlap, and it is settled anyway.</>}
        </div>
        <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--muted)" }}>
          Posts needed to settle it, with the same disagreements:{" "}
          <strong style={{ ...mono, color: "var(--ink)" }}>{need > 1e7 ? "over 10 million" : fmt(Math.round(need))}</strong>
        </div>
      </div>
    </div>
  );
}
