"use client";

import { useState } from "react";
import fl from "@/data/routing/firstlook.json";

// The later new threads in six bands by length (words in the router's view): how many posts each
// band holds, how often the linear SVM routes them right, and six posts drawn at random from each
// band (their subjects), so the reader sees what the numbers are made of.
//
// Data: src/data/routing/firstlook.json, written by `python scripts/routing_cases.py first_look`.
// The draw is seeded and checked against the reviewed list in the script (FL_DRAW).

type Post = { subject: string; forum: string; routed: string; words: number };
type Band = { label: string; n: number; acc: number; ci: number[]; margin: number; sample: Post[] };
const D = fl as { n: number; bands: Band[] };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const fmt = (x: number) => x.toLocaleString("en-US");

// accuracy axis for the dots and whiskers
const LO = 0.3, HI = 1;
const y = (a: number) => Math.round(10000 * (1 - (a - LO) / (HI - LO))) / 100;
const MAXN = Math.max(...D.bands.map((b) => b.n));

export default function LengthBandsLab() {
  const [k, setK] = useState(0);
  const b = D.bands[k];
  const right = b.sample.filter((p) => p.forum === p.routed).length;

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 14px 12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "34px repeat(6, minmax(0, 1fr))", gap: "0 6px" }}>
        {/* accuracy panel */}
        <div style={{ position: "relative", height: 132 }}>
          {[1, 0.8, 0.6, 0.4].map((t) => (
            <span key={t} style={{ ...mono, position: "absolute", right: 2, top: `calc(${y(t)}% - 7px)`, fontSize: 10, color: "var(--faint)" }}>{t.toFixed(1)}</span>
          ))}
        </div>
        {D.bands.map((bb, i) => {
          const on = i === k;
          return (
            <button
              key={bb.label}
              onClick={() => setK(i)}
              aria-pressed={on}
              aria-label={`${bb.label} words: ${bb.n} posts, accuracy ${bb.acc.toFixed(3)}`}
              style={{ position: "relative", height: 132, padding: 0, border: "none", borderRadius: 8, cursor: "pointer", background: on ? `color-mix(in srgb, ${POST} 9%, transparent)` : "transparent" }}
            >
              {[1, 0.8, 0.6, 0.4].map((t) => (
                <span key={t} style={{ position: "absolute", left: 0, right: 0, top: `${y(t)}%`, borderTop: "1px dashed var(--border)" }} />
              ))}
              <span style={{ position: "absolute", left: "50%", width: 2, marginLeft: -1, top: `${y(bb.ci[1])}%`, height: `${y(bb.ci[0]) - y(bb.ci[1])}%`, background: on ? POST : "var(--muted)", opacity: 0.55 }} />
              <span style={{ position: "absolute", left: "50%", width: 10, height: 10, marginLeft: -5, marginTop: -5, top: `${y(bb.acc)}%`, borderRadius: "50%", background: on ? POST : "var(--muted)", border: "2px solid var(--surface-2)" }} />
            </button>
          );
        })}

        {/* post-count panel */}
        <div style={{ ...mono, fontSize: 10, color: "var(--faint)", textAlign: "right", paddingRight: 2, alignSelf: "end" }}>posts</div>
        {D.bands.map((bb, i) => (
          <div key={bb.label} onClick={() => setK(i)} style={{ height: 46, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", cursor: "pointer", marginTop: 6 }}>
            <span style={{ ...mono, fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{fmt(bb.n)}</span>
            <span style={{ width: "70%", height: Math.max(2, Math.round(30 * bb.n / MAXN)), borderRadius: "3px 3px 0 0", background: i === k ? POST : "color-mix(in srgb, var(--ink) 25%, var(--surface))" }} />
          </div>
        ))}

        <div />
        {D.bands.map((bb, i) => (
          <div key={bb.label} onClick={() => setK(i)} style={{ ...mono, fontSize: 10.5, textAlign: "center", color: i === k ? "var(--ink)" : "var(--muted)", fontWeight: i === k ? 700 : 400, borderTop: "1px solid var(--border-strong)", paddingTop: 4, cursor: "pointer", lineHeight: 1.25 }}>
            {bb.label.replace("under ", "<").replace(" or more", "+").replace("-", "–")}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", textAlign: "center", marginTop: 3 }}>words in the router&rsquo;s view</div>

      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55 }}>
          <strong>{b.label} words</strong>: {fmt(b.n)} new threads, routed right{" "}
          <strong style={mono}>{b.acc.toFixed(3)}</strong>{" "}
          <span style={{ color: "var(--muted)" }}>({b.ci[0].toFixed(2)} to {b.ci[1].toFixed(2)})</span>. Median margin{" "}
          <span style={mono}>{b.margin.toFixed(2)}</span>.
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 6px" }}>
          six drawn at random from this band ({right} of 6 routed right):
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
          {b.sample.map((p) => {
            const ok = p.forum === p.routed;
            return (
              <li key={p.subject + p.forum} style={{ display: "grid", gridTemplateColumns: "16px minmax(0, 1fr)", gap: 6, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px" }}>
                <span aria-label={ok ? "routed right" : "routed wrong"} style={{ color: ok ? "var(--good)" : "var(--bad)", fontWeight: 700, fontSize: 13 }}>{ok ? "✓" : "✗"}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ ...mono, fontSize: 12.5, color: "var(--ink)", overflowWrap: "anywhere" }}>{p.subject}</span>
                  <span style={{ display: "block", ...mono, fontSize: 10.5, color: "var(--faint)", marginTop: 1 }}>
                    {p.forum} · {fmt(p.words)} word{p.words === 1 ? "" : "s"}
                    {!ok && <> · routed to <span style={{ color: "var(--bad)" }}>{p.routed}</span></>}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
