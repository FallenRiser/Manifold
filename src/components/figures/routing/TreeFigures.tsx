import { Printout } from "@/components/capstone/newsreader";
import tr from "@/data/routing/trees.json";

// One later new thread on its way through the first tree of the harness's forest (fitted on every
// earlier post). Every question is about one word: is its weight in the post above the split's
// threshold? The strip draws all of them in order, one mark each, and inks the few about a word the
// post contains; the rest are about words it lacks.
//
// Data: src/data/routing/trees.json, written by `python scripts/routing_cases.py tree_questions`.

type Q = { w: string; has: boolean; yes: boolean };
const D = tr as unknown as {
  forest: { words: string; trees: number; depth: number; leaves: number };
  all: { perTree: number; ownShare: number; covered: number; words: number };
  specimen: {
    id: number; forum: string; subject: string; words: number; own: string[]; path: Q[]; leaf: string;
    votes: { f: string; share: number }[]; svm: string;
  };
};

const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const fmt = (n: number) => n.toLocaleString("en-US");
const FIRST = 12;

export function TreePath() {
  const s = D.specimen;
  const own = s.path.map((q, i) => ({ ...q, i })).filter((q) => q.has);
  return (
    <figure style={{ margin: "22px 0 6px" }}>
      <Printout py={12}>
        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-faint)", marginBottom: 6 }}>
          tree 1 of {fmt(D.forest.trees)} · one later new thread in {s.forum}, {s.words} words
        </div>
        <div style={{ ...mono, fontSize: 12.5, color: "var(--nr-ink)", marginBottom: 10, overflowWrap: "anywhere" }}>
          Subject: {s.subject}
        </div>

        <div style={{ ...mono, fontSize: 11.5, color: "var(--nr-ink-soft)", lineHeight: 1.7, overflowWrap: "anywhere" }}>
          <span style={{ color: "var(--nr-faint)" }}>its first {FIRST} questions: </span>
          {s.path.slice(0, FIRST).map((q, i) => (
            <span key={i}>
              <span style={{ whiteSpace: "nowrap" }}>{q.w}? {q.yes ? "yes" : "no"}</span>
              {i < FIRST - 1 ? " · " : " …"}
            </span>
          ))}
        </div>

        <div
          role="img"
          aria-label={`All ${s.path.length} questions in order; ${own.length} are about a word the post contains`}
          style={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "flex-end", margin: "10px 0 4px" }}
        >
          {s.path.map((q, i) => (
            <span
              key={i}
              style={{
                display: "block", width: q.has ? 4 : 3, height: q.has ? 16 : 7, borderRadius: 1,
                background: q.has ? "var(--nr-accent)" : "var(--nr-rule)",
              }}
            />
          ))}
        </div>
        <div style={{ ...mono, fontSize: 11, color: "var(--nr-faint)", marginBottom: 8 }}>
          all {s.path.length} questions, in order · a short mark is a word the post lacks, a tall one a word it contains
        </div>

        <div style={{ ...mono, fontSize: 11.5, lineHeight: 1.7, color: "var(--nr-accent)", overflowWrap: "anywhere" }}>
          {own.map((q, n) => (
            <span key={q.i}>
              <span style={{ whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--nr-faint)" }}>#{q.i + 1}</span> <strong>{q.w}</strong>? {q.yes ? "yes" : "no"}
              </span>
              {n < own.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--nr-rule)", ...mono, fontSize: 11.5, lineHeight: 1.6, color: "var(--nr-ink-soft)" }}>
          <div>this tree&rsquo;s leaf: <strong style={{ color: "var(--nr-ink)" }}>{s.leaf}</strong></div>
          <div>
            all {fmt(D.forest.trees)} trees&rsquo; votes: {s.votes.map((v) => `${v.f} ${(100 * v.share).toFixed(1)}%`).join(" · ")}
          </div>
          <div>the linear SVM, adding a weight for every word of the post: {s.svm}</div>
        </div>
      </Printout>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>
        Every question the forest&rsquo;s first tree asks one post, from the root to its leaf. Each is about a
        single word: is its weight in the post above the split&rsquo;s threshold? For a word the post does not
        contain the answer is always no.
      </figcaption>
    </figure>
  );
}
