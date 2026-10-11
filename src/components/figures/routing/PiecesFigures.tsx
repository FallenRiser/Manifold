import { Printout } from "@/components/capstone/newsreader";
import pd from "@/data/routing/pieces.json";

// Two later new threads from senders the router had not met. The SVM reading the words routes each to
// the wrong forum; reading pieces of words too, it routes them right. Marked in each post: the words that
// hold one of the pieces that moved it most. Beneath: those features, words and pieces, by how far each
// moves the post from the words' forum toward its own.
//
// Data: src/data/routing/pieces.json, written by `python scripts/routing_cases.py pieces`.

type Spec = {
  post: number; forum: string; words: string; subject: string;
  segments: { t: string; hit: boolean }[];
  top: { f: string; piece: boolean; c: number }[];
  from: { words: number; pieces: number };
};
const D = pd as unknown as { specimens: Spec[] };

const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
// a piece's spaces are the edges of a word: show them
const show = (f: string) => f.replace(/ /g, "␣");

export function PiecesPair() {
  const cMax = Math.max(...D.specimens.flatMap((s) => s.top.map((t) => t.c)));
  return (
    <figure style={{ margin: "22px 0 6px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 19em), 1fr))", gap: 12 }}>
        {D.specimens.map((s) => (
          <Printout key={s.post} py={12}>
            <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 6 }}>
              a later new thread · a new sender · {s.forum}
            </div>
            <div style={{ ...mono, fontSize: 12, lineHeight: 1.6, color: "var(--nr-ink)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {s.segments.map((g, i) => (g.hit ? (
                <mark key={i} style={{ background: "transparent", color: "var(--nr-accent)", fontWeight: 700, borderBottom: "2px solid var(--nr-accent)" }}>
                  {g.t}
                </mark>
              ) : <span key={i}>{g.t}</span>))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--nr-rule)", ...mono, fontSize: 11.5, lineHeight: 1.6, color: "var(--nr-ink-soft)" }}>
              <div>the words alone: <span style={{ color: "var(--nr-pen)", textDecoration: "line-through" }}>{s.words}</span></div>
              <div>words and pieces: <strong style={{ color: "var(--nr-ink)" }}>{s.forum}</strong></div>
            </div>
            <div style={{ marginTop: 8, ...mono, fontSize: 11.5, color: "var(--nr-faint)" }}>what moved it most</div>
            <div role="list" style={{ marginTop: 4 }}>
              {s.top.map((t) => (
                <div role="listitem" key={t.f + t.piece} style={{ display: "grid", gridTemplateColumns: "6.2em minmax(0, 1fr)", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ ...mono, fontSize: 11.5, color: t.piece ? "var(--nr-accent)" : "var(--nr-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    title={t.piece ? `the piece "${t.f}"` : `the word "${t.f}"`}>
                    {t.piece ? show(t.f) : t.f}
                  </span>
                  <span style={{ display: "block", height: 7, borderRadius: 2, width: `${Math.max(4, (100 * t.c) / cMax)}%`,
                    background: t.piece ? "var(--nr-accent)" : "var(--nr-faint)", opacity: t.piece ? 0.85 : 0.55 }} />
                </div>
              ))}
            </div>
          </Printout>
        ))}
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>
        Two later new threads the SVM routes wrong when it reads only words and right when it also reads pieces of
        words. The bars are the features that move each post furthest from the wrong forum toward the right one:
        pieces in blue (␣ marks the edge of a word, so ␣x␣ is the word X on its own), words in grey. The marked
        words in each post are the ones holding those pieces.
      </figcaption>
    </figure>
  );
}
