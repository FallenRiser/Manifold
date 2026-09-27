// The hand-read sample on the "Anatomy of a post" page: 40 blocks that scikit-learn's footer rule
// cuts from new threads with no '-- ' signature, each read and labelled. One square per block,
// then the nine that held the poster's own words, printed so the reader can see what goes.
//
// Data: src/data/routing/sample.json, written by `python scripts/routing_cases.py sample`; the
// labels live in that script (SAMPLE_LABELS) and the section refuses to run if the draw changes.

const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

export type SampleData = {
  pool: number;
  grid: { post: number; forum: string; label: string; lines: number; text?: string }[];
};

const KIND: Record<string, { name: string; colour: string }> = {
  sig: { name: "signature or contact details", colour: "var(--c-dimred)" },
  both: { name: "the poster's words and a sign-off", colour: "var(--warn)" },
  words: { name: "the poster's own words", colour: "var(--c-post)" },
  rule: { name: "a divider line", colour: "var(--faint)" },
};
const ORDER = ["sig", "both", "words", "rule"];
const MAX_LINES = 5;

export function SampleAudit({ d }: { d: SampleData }) {
  const cells = [...d.grid].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label) || a.post - b.post);
  const count = (k: string) => d.grid.filter((c) => c.label === k).length;
  const shown = cells.filter((c) => c.text);
  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ ...mono, fontSize: 11.5, color: "var(--faint)", marginBottom: 10 }}>
        {d.grid.length} cut blocks, drawn at random from {d.pool.toLocaleString("en-US")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }} role="img"
        aria-label={ORDER.map((k) => `${count(k)} ${KIND[k].name}`).join(", ")}>
        {cells.map((c) => (
          <span
            key={c.post}
            title={`${c.forum}: ${KIND[c.label].name}`}
            style={{ width: 22, height: 22, borderRadius: 4, background: `color-mix(in srgb, ${KIND[c.label].colour} ${c.label === "rule" ? 35 : 78}%, var(--surface))` }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 10 }}>
        {ORDER.map((k) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: `color-mix(in srgb, ${KIND[k].colour} ${k === "rule" ? 35 : 78}%, var(--surface))` }} />
            <strong style={{ ...mono, color: "var(--ink)" }}>{count(k)}</strong> {KIND[k].name}
          </span>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: "var(--muted)", margin: "16px 0 8px" }}>
        The {shown.length} blocks that held the poster&rsquo;s own words, which the footer rule deletes with the rest:
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 8 }}>
        {shown.map((c) => {
          const lines = (c.text ?? "").split("\n");
          const cut = lines.length > MAX_LINES;
          return (
            <div key={c.post} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${KIND[c.label].colour}`, borderRadius: 8, padding: "7px 10px", minWidth: 0 }}>
              <div style={{ ...mono, fontSize: 10.5, color: "var(--faint)", marginBottom: 4 }}>{c.forum}</div>
              <pre style={{ ...mono, fontSize: 11, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", tabSize: 2, color: "var(--ink)", background: "transparent", padding: 0 }}>
                {lines.slice(0, MAX_LINES).map((l) => l.trim()).join("\n")}
                {cut ? "\n…" : ""}
              </pre>
            </div>
          );
        })}
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Each block was read and labelled before anything was counted, and the labels are written into the script
        that draws the sample, which refuses to run if the draw ever changes. Names and addresses are dotted out.
      </figcaption>
    </figure>
  );
}
