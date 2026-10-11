"use client";

import { useState } from "react";
import mv from "@/data/routing/metric.json";

// One router's routes (the audited view, linear SVM C=0.3), counted three ways. Each new thread
// once gives every forum a weight equal to its share of the new threads; each forum once gives all
// twenty the same weight; each post of its conversation weighs a new thread by 1 + the replies its
// thread drew. The score is the weighted mean of the forums' accuracies. Every interval is the
// script's bootstrap (95%); a forum is named when its whole interval sits below the floor.
//
// Data: src/data/routing/metric.json, written by `python scripts/routing_cases.py the_metric`.

type Forum = { n: number; w: number; acc: number; lo: number; hi: number; cacc: number; clo: number; chi: number };
type Src = "later" | "harness";
type Count = "thread" | "forum" | "conv";
const M = mv as {
  floor: number; names: string[]; order: number[]; n_later: number; n_harness: number;
  scores: Record<Src, Record<Count, number[]>>;
  forums: Record<Src, Forum[]>;
};

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const SOURCES: { key: Src; label: string }[] = [
  { key: "later", label: "the later new threads" },
  { key: "harness", label: "the harness (earlier posts)" },
];
const COUNTS: { key: Count; label: string }[] = [
  { key: "thread", label: "each new thread once" },
  { key: "forum", label: "each forum once" },
  { key: "conv", label: "each post of its conversation" },
];

function weights(src: Src, c: Count): number[] {
  const F = M.forums[src];
  const n = F.reduce((s, f) => s + f.n, 0);
  return F.map((f) => (c === "thread" ? f.n / n : c === "forum" ? 1 / F.length : f.w));
}
const cell = (f: Forum, c: Count) => (c === "conv" ? { acc: f.cacc, lo: f.clo, hi: f.chi } : { acc: f.acc, lo: f.lo, hi: f.hi });
const WMAX = Math.max(...(["later", "harness"] as Src[]).flatMap((s) => (["thread", "forum", "conv"] as Count[]).flatMap((c) => weights(s, c))));
const px = (a: number) => Math.round(1000 * Math.min(1, Math.max(0, a))) / 10;

function Segmented<T extends string>({ label, items, value, onChange, sub }: {
  label: string; items: { key: T; label: string }[]; value: T; onChange: (k: T) => void; sub?: (k: T) => string;
}) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
      {items.map((m) => {
        const on = m.key === value;
        return (
          <button key={m.key} role="radio" aria-checked={on} onClick={() => onChange(m.key)}
            style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400, textAlign: "left", lineHeight: 1.3 }}>
            {m.label}
            {sub && <span style={{ ...mono, display: "block", fontSize: 11, opacity: on ? 0.9 : 0.8 }}>{sub(m.key)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function CountingLab() {
  const [src, setSrc] = useState<Src>("later");
  const [count, setCount] = useState<Count>("thread");
  const [floor, setFloor] = useState(M.floor);
  const F = M.forums[src];
  const W = weights(src, count);
  const [v, lo, hi] = M.scores[src][count];
  const below = M.order.filter((k) => cell(F[k], count).hi < floor);

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px 12px" }}>
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <Segmented label="which posts" items={SOURCES} value={src} onChange={setSrc} />
        <Segmented label="how to count" items={COUNTS} value={count} onChange={setCount}
          sub={(k) => M.scores[src][k][0].toFixed(3)} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 12px", marginBottom: 10 }}>
        <span style={{ ...mono, fontSize: 26, fontWeight: 600, color: POST }}>{v.toFixed(3)}</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          routed right, counting {COUNTS.find((c) => c.key === count)!.label}; 95% interval {lo.toFixed(3)} to {hi.toFixed(3)}
          {" "}({(100 * (hi - lo)).toFixed(1)} points wide)
        </span>
      </div>

      <div style={{ display: "grid", gap: 3 }}>
        <Row head name={<span style={{ color: "var(--faint)" }}>forum</span>} weight={<span style={{ color: "var(--faint)" }}>weight</span>}
          strip={<Strip value={null}>
            <div style={{ position: "relative", height: 14, ...mono, fontSize: 10.5, color: "var(--faint)" }}>
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <span key={t} style={{ position: "absolute", left: `${px(t)}%`, transform: t === 0 ? "none" : t === 1 ? "translateX(-100%)" : "translateX(-50%)" }}>{t === 0 ? "0" : t === 1 ? "1" : t.toFixed(2).replace(/^0/, "")}</span>
              ))}
            </div>
          </Strip>} />
        {M.order.map((k) => {
          const c = cell(F[k], count);
          const bad = c.hi < floor;
          const ink = bad ? "var(--bad)" : POST;
          return (
            <Row key={k}
              name={<span style={{ color: bad ? "var(--bad)" : "var(--ink)", fontWeight: bad ? 600 : 400 }}>{M.names[k]}</span>}
              weight={<>
                <span aria-hidden style={{ display: "inline-block", verticalAlign: "-1px", height: 9, width: `${Math.max(2, Math.round(50 * W[k] / WMAX))}px`, background: POST, opacity: 0.55, borderRadius: 2, marginRight: 6 }} />
                <span style={{ color: "var(--muted)" }}>{(100 * W[k]).toFixed(1)}%</span>
              </>}
              strip={<Strip value={<span style={{ color: bad ? "var(--bad)" : "var(--muted)" }}>{c.acc.toFixed(2)}</span>}>
                <div title={`${c.acc.toFixed(3)} (${c.lo.toFixed(3)} to ${c.hi.toFixed(3)}), ${F[k].n} new threads`}
                  style={{ position: "relative", height: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3 }}>
                  <span aria-hidden style={{ position: "absolute", top: -1, bottom: -1, left: `${px(floor)}%`, borderLeft: "1.5px dashed var(--bad)", opacity: 0.7 }} />
                  <span aria-hidden style={{ position: "absolute", top: 6, height: 2, left: `${px(c.lo)}%`, width: `${Math.max(0.4, px(c.hi) - px(c.lo))}%`, background: ink, opacity: 0.55 }} />
                  <span aria-hidden style={{ position: "absolute", top: 2.5, width: 9, height: 9, marginLeft: -4.5, left: `${px(c.acc)}%`, borderRadius: 999, background: ink }} />
                </div>
              </Strip>} />
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
        <label htmlFor="counting-floor" style={{ whiteSpace: "nowrap" }}>floor <strong style={{ ...mono, color: "var(--bad)" }}>{floor.toFixed(2)}</strong></label>
        <input id="counting-floor" type="range" min={0.5} max={0.95} step={0.05} value={floor}
          onChange={(e) => setFloor(Number(e.target.value))} style={{ flex: "1 1 10em", minWidth: 0, accentColor: POST }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
        {below.length === 0
          ? <>No forum&rsquo;s whole interval sits below {floor.toFixed(2)}.</>
          : <><strong style={{ color: "var(--bad)" }}>{below.length} {below.length === 1 ? "forum" : "forums"}</strong> with the whole interval below {floor.toFixed(2)}: {below.map((k) => M.names[k]).join(", ")}.</>}
        {" "}Weight: the forum&rsquo;s share of the score under this count. The routes are the same in every view.
      </p>
    </div>
  );
}

function Row({ name, weight, strip, head }: { name: React.ReactNode; weight: React.ReactNode; strip: React.ReactNode; head?: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1px 10px", paddingBottom: head ? 2 : 0 }}>
      <div style={{ flex: "0 1 24em", minWidth: 0, display: "flex", alignItems: "center", gap: 8, ...mono, fontSize: 11.5 }}>
        <span style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <span style={{ flex: "0 0 8.6em", whiteSpace: "nowrap", fontSize: head ? 10.5 : 11 }}>{weight}</span>
      </div>
      <div style={{ flex: "1 1 11em", minWidth: 0 }}>{strip}</div>
    </div>
  );
}

function Strip({ value, children }: { value: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>{children}</div>
      <span style={{ flex: "0 0 2.6em", textAlign: "right", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 11 }}>{value}</span>
    </div>
  );
}
