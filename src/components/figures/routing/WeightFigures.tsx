import { Printout } from "@/components/capstone/newsreader";

// What the whole-post model's decisions are made of on the later posts: the winning forum's score
// from words, split by the part of the post each word came from (a word in two parts is split
// between them). New threads, the router's job, against replies, which never need a model.
//
// Data: src/data/routing/weights.json ("parts"), written by `python scripts/routing_cases.py weights`.

const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const PARTS = [
  { key: "content", label: "subject and body", colour: "var(--nr-accent)" },
  { key: "meta", label: "header lines", colour: "var(--nr-head)" },
  { key: "quotes", label: "quotes", colour: "var(--nr-quote)" },
  { key: "sig", label: "signature", colour: "var(--nr-sig)" },
] as const;

type Shares = Record<string, number>;

export function ScoreParts({ parts }: { parts: Record<string, Shares> }) {
  const rows = [
    { key: "new threads", label: "new threads", note: "the router's job" },
    { key: "replies", label: "replies", note: "filed by the thread lookup" },
  ];
  return (
    <figure style={{ margin: "22px 0 6px" }}>
      <Printout py={12}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 10 }}>
          the model that reads the whole post · where its winning score comes from, later posts
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((r) => {
            const s = parts[r.key];
            const outside = 1 - s.content;
            return (
              <div key={r.key}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--nr-ink)" }}>
                    {r.label} <span style={{ fontWeight: 400, color: "var(--nr-faint)", fontSize: 12 }}>· {r.note}</span>
                  </span>
                  <span style={{ ...mono, fontSize: 12, color: "var(--nr-pen)" }}>{Math.round(100 * outside)}% from outside the subject and body</span>
                </div>
                <div style={{ display: "flex", height: 18, borderRadius: 4, overflow: "hidden", border: "1px solid var(--nr-rule)" }}>
                  {PARTS.map((p) => (
                    <span key={p.key} title={`${p.label}: ${(100 * s[p.key]).toFixed(1)}%`}
                      style={{ width: `${Math.round(1000 * s[p.key]) / 10}%`, background: p.colour }} />
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginTop: 4 }}>
                  {PARTS.map((p) => (
                    <span key={p.key} style={{ ...mono, fontSize: 11, color: "var(--nr-ink-soft)" }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: p.colour, marginRight: 4 }} />
                      {p.label} {(100 * s[p.key]).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Printout>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>
        Each post&rsquo;s winning score, word by word, credited to the part of the post the word came from, and
        summed over all the later posts of each kind.
      </figcaption>
    </figure>
  );
}
