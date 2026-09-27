import { Printout } from "@/components/capstone/newsreader";

// soc.religion.christian's twenty heaviest words in the router's view (linear SVM, subject + body),
// each with the share of its uses in that forum's earlier posts that sit inside the moderator's
// bracketed notes. H2 in the register bet that at least one of the twenty is the moderator's.
//
// Data: src/data/routing/fingerprint.json ("top"), written by `python scripts/routing_cases.py fingerprint`.

type Word = { w: string; x: number; note: number; mod: boolean };

const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

export function NoteShareTop({ top, forum }: { top: Word[]; forum: string }) {
  const max = Math.max(...top.map((t) => t.x));
  return (
    <figure style={{ margin: "22px 0 6px" }}>
      <Printout py={12}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 10 }}>
          {forum} · its twenty heaviest words in the router&rsquo;s view
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "20px minmax(64px, 112px) minmax(0, 1fr) minmax(86px, 128px)", gap: "3px 8px", alignItems: "center" }}>
          <span />
          <span />
          <span style={{ fontSize: 11, color: "var(--nr-faint)" }}>weight</span>
          <span style={{ fontSize: 11, color: "var(--nr-faint)", lineHeight: 1.3 }}>uses inside the moderator&rsquo;s notes</span>
          {top.map((t, i) => {
            const ink = t.mod ? "var(--nr-pen)" : "var(--nr-ink)";
            return [
              <span key={`r${i}`} style={{ ...mono, fontSize: 11, color: "var(--nr-faint)", textAlign: "right" }}>{i + 1}</span>,
              <span key={`w${i}`} style={{ ...mono, fontSize: 12, color: ink, fontWeight: t.mod ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.w}</span>,
              <span key={`x${i}`} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ display: "inline-block", height: 9, width: `${Math.round(820 * t.x / max) / 10}%`, background: t.mod ? "var(--nr-pen)" : "var(--nr-accent)", borderRadius: 2 }} />
                <span style={{ ...mono, fontSize: 10.5, color: "var(--nr-ink-soft)" }}>{t.x.toFixed(2)}</span>
              </span>,
              <span key={`n${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ position: "relative", flex: "0 0 48px", height: 9, background: "var(--nr-edge)", border: "1px solid var(--nr-rule)", borderRadius: 2, overflow: "hidden" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.round(1000 * t.note) / 10}%`, background: t.mod ? "var(--nr-pen)" : "var(--nr-faint)" }} />
                </span>
                <span style={{ ...mono, fontSize: 11, color: ink, fontWeight: t.mod ? 700 : 400 }}>{Math.round(100 * t.note)}%</span>
              </span>,
            ];
          })}
        </div>
      </Printout>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>
        For each word, its uses in the subject and body of the forum&rsquo;s earlier posts, and how many of them
        fall inside a bracketed note signed with the moderator&rsquo;s initials (masked). One word is his; the
        other nineteen are the posters&rsquo;.
      </figcaption>
    </figure>
  );
}
