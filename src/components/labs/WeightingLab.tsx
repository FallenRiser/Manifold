"use client";

import { useState } from "react";
import { Printout } from "@/components/capstone/newsreader";
import vec from "@/data/routing/vectors.json";

// One later new thread, three ways of turning its words into numbers: raw counts, TF-IDF, and
// TF-IDF with log counts (the router's). The bars are the post's ten heaviest words under the
// chosen weighting; below them, the three earlier posts closest to it by cosine under the same
// weighting. Words the vocabulary learned from the earlier posts has never seen are underlined:
// the vectorizer drops them without a word.
//
// Data: src/data/routing/vectors.json, written by `python scripts/routing_cases.py vectors`.

type Word = { w: string; n: number; df: number; x: number };
type Near = { subject: string; forum: string; cos: number };
type Scheme = { top: Word[]; nearest: Near[] };
type Specimen = { post: number; forum: string; text: string; unknown: string[]; schemes: Record<string, Scheme> };
const D = vec as { posts: number; vocab: number; specimens: Specimen[] };

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const fmt = (x: number) => x.toLocaleString("en-US");

const TABS = ["the ImageWriter question", "the PowerBook question", "the Western Digital question"];
const SCHEMES = [
  { key: "counts", label: "counts" },
  { key: "tfidf", label: "TF-IDF" },
  { key: "router", label: "TF-IDF, log counts" },
] as const;
type SchemeKey = (typeof SCHEMES)[number]["key"];

function Seg<T extends string>({ items, value, onChange, label }: { items: readonly { key: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(it.key)}
            style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: on ? POST : "transparent", color: on ? "var(--surface)" : "var(--muted)", fontWeight: on ? 600 : 400 }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// underline the words the vocabulary has never seen, matching the vectorizer's own rule:
// a word is two or more letters or digits, compared lower-cased
function Marked({ text, unknown }: { text: string; unknown: string[] }) {
  if (!unknown.length) return <>{text}</>;
  const set = new Set(unknown);
  const parts = text.split(/(\b\w\w+\b)/);
  return (
    <>
      {parts.map((p, i) =>
        set.has(p.toLowerCase()) ? (
          <span key={i} style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "var(--nr-pen)", textUnderlineOffset: 3 }}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default function WeightingLab() {
  const [si, setSi] = useState(0);
  const [sk, setSk] = useState<SchemeKey>("counts");
  const s = D.specimens[si];
  const sc = s.schemes[sk];
  const max = Math.max(...sc.top.map((t) => t.x));

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <Seg label="post" items={TABS.map((t, i) => ({ key: String(i), label: t }))} value={String(si)} onChange={(v) => setSi(Number(v))} />
      </div>

      <Printout py={12}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 6 }}>
          later new thread {fmt(s.post)} · filed in {s.forum}
        </div>
        <pre style={{ ...mono, fontSize: 11.5, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "var(--nr-ink)", background: "transparent", padding: 0 }}>
          <Marked text={s.text} unknown={s.unknown} />
        </pre>
        <div style={{ fontSize: 12, color: "var(--nr-faint)", marginTop: 8 }}>
          {s.unknown.length ? (
            <>
              <span style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", textDecorationColor: "var(--nr-pen)" }}>underlined</span>: never seen in the {fmt(D.posts)} earlier posts, so the vectorizer drops{" "}
              {s.unknown.length === 1 ? "it" : "them"} ({s.unknown.join(", ")})
            </>
          ) : (
            <>every word of this post is in the vocabulary</>
          )}
        </div>
      </Printout>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", margin: "14px 0 10px" }}>
        <span style={{ fontSize: 12.5, color: "var(--faint)" }}>weight the words by</span>
        <Seg label="weighting" items={SCHEMES} value={sk} onChange={setSk} />
      </div>

      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
          its ten heaviest words{sk === "counts" ? ", by how often the post uses them" : ", by weight after scaling the post to length 1"}
        </div>
        <div style={{ display: "grid", gap: 3 }}>
          {sc.top.map((t) => (
            <div key={t.w} style={{ display: "grid", gridTemplateColumns: "minmax(70px, 110px) minmax(0, 1fr) 44px", gap: 8, alignItems: "center" }}>
              <span style={{ ...mono, fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.w}>{t.w}</span>
              <span style={{ position: "relative", height: 14 }}>
                <span style={{ position: "absolute", left: 0, top: 2, height: 10, width: `${Math.round(1000 * t.x / max) / 10}%`, background: POST, borderRadius: 2, opacity: 0.85 }} />
              </span>
              <span style={{ ...mono, fontSize: 11, color: "var(--muted)", textAlign: "right" }}>{sk === "counts" ? t.x : t.x.toFixed(2)}</span>
              <span style={{ gridColumn: "2 / 4", ...mono, fontSize: 10, color: "var(--faint)", marginTop: -2, marginBottom: 2 }}>
                in {fmt(t.df)} of {fmt(D.posts)} earlier posts
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", margin: "14px 0 6px", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          the three earlier posts nearest to it (cosine, under this weighting)
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          {sc.nearest.map((n, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", gap: 8, alignItems: "baseline", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px" }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{n.cos.toFixed(2)}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ ...mono, fontSize: 12, color: "var(--ink)", overflowWrap: "anywhere" }}>{n.subject}</span>
                <span style={{ display: "block", ...mono, fontSize: 10.5, color: n.forum === s.forum ? "var(--faint)" : "var(--bad)" }}>
                  {n.forum}{n.forum === s.forum ? "" : " · another forum"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
