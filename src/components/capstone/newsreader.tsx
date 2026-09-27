// The message-routing capstone's own skin — the NEWSREADER PRINTOUT.
//
// Each capstone gets an identity, not a recolour (PROJECT.md §10.5): housing is editorial
// terracotta, the asteroid capstone an always-dark sky, the warehouse a concrete slab. This one
// is greenbar line-printer paper with posts in monospace on it, because the data IS raw text and
// the whole capstone turns on reading it closely. The auditor's red pen marks anything the model
// should not be reading.
//
// The contract (question -> transfer -> rule) is the same as the other capstones; the chrome is
// a Usenet post's own parts. The opener is a post header whose `Newsgroups:` line names the act
// and whose `Subject:` is the analyst's question; the transfer prompt is a `Followup-To:`; the
// Playbook rule is the page's signature, under the `-- ` line.

const POST = "var(--c-post)";

export const ROUTING_ACTS = [
  { n: 1, group: "capstone.routing.frame", name: "Frame the job" },
  { n: 2, group: "capstone.routing.first-contact", name: "First contact" },
  { n: 3, group: "capstone.routing.leak-audit", name: "The leak audit" },
  { n: 4, group: "capstone.routing.harness", name: "Lock the harness" },
  { n: 5, group: "capstone.routing.models", name: "Model, rung by rung" },
  { n: 6, group: "capstone.routing.system", name: "Build the system" },
  { n: 7, group: "capstone.routing.transfer", name: "Conclude & transfer" },
] as const;

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

/* ------------------------------------------------------------------ *
 * Printout — the signature panel: greenbar paper with a tractor-feed
 * strip down each edge. Used for the hero, the post specimens and the
 * page opener, so it stays special by scarcity.
 * ------------------------------------------------------------------ */
export function Printout({
  children,
  py = 20,
  radius = 12,
  style,
}: {
  children: React.ReactNode;
  py?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  // Only the vertical padding is set here: .nr-paper owns the horizontal, because it has to
  // clear the tractor-feed strips (and drops them on a phone).
  return (
    <div
      className="nr-paper"
      style={{
        borderRadius: radius,
        border: "1px solid var(--nr-rule)",
        overflow: "hidden",
        paddingTop: py,
        paddingBottom: py,
        ...style,
      }}
    >
      <div style={{ padding: "0 14px" }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ArticleOpener — opens every page. The analyst's question, set as the
 * Subject of a post filed in the current act's group.
 * ------------------------------------------------------------------ */
export function ArticleOpener({
  act,
  article,
  total,
  children,
}: {
  act: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  article: number;
  total: number;
  children: React.ReactNode;
}) {
  const a = ROUTING_ACTS[act - 1];
  // The Subject is set in the display face and needs room: when the line is too narrow for it
  // beside its key (a phone), it wraps under the key instead of into a 150px column.
  const row = (k: string, v: React.ReactNode, strong = false) => (
    <div style={{ display: "flex", flexWrap: strong ? "wrap" : "nowrap", gap: "2px 10px", alignItems: "baseline", minWidth: 0 }}>
      <span style={{ ...mono, fontSize: 12.5, color: "var(--nr-head)", width: 92, flexShrink: 0 }}>{k}</span>
      <span style={{ minWidth: 0, overflowWrap: "anywhere", ...(strong ? { flex: "1 1 250px" } : { ...mono, fontSize: 12.5, color: "var(--nr-ink-soft)" }) }}>{v}</span>
    </div>
  );
  return (
    <div style={{ margin: "0 0 22px" }}>
      <Printout py={14}>
        <div style={{ display: "grid", gap: 3 }}>
          {row("Newsgroups:", a.group)}
          {row("Article:", `${article} of ${total} · act ${a.n}, ${a.name.toLowerCase()}`)}
          <div style={{ height: 6 }} />
          {row(
            "Subject:",
            <span className="font-display" style={{ fontSize: 18, lineHeight: 1.45, color: "var(--nr-ink)" }}>
              {children}
            </span>,
            true,
          )}
        </div>
      </Printout>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Followup — closes a teaching beat: lift the lesson off these posts
 * and onto the reader's own data.
 * ------------------------------------------------------------------ */
export function Followup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${POST}`,
        background: `color-mix(in srgb, ${POST} 6%, var(--surface))`,
        borderRadius: "0 12px 12px 0",
        padding: "12px 16px",
        margin: "18px 0",
      }}
    >
      <div style={{ ...mono, fontSize: 12, color: POST, marginBottom: 5 }}>Followup-To: your.own.data</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SigRule — banks one reusable rule into the running Playbook, set as
 * the page's signature.
 * ------------------------------------------------------------------ */
export function SigRule({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "10px 15px 12px",
        margin: "18px 0",
      }}
    >
      <div style={{ ...mono, fontSize: 12.5, color: "var(--faint)", marginBottom: 4 }}>--&nbsp;</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)" }}>
        <span style={{ ...mono, fontSize: 11.5, color: POST, fontWeight: 600, marginRight: 8 }}>Playbook #{n}</span>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * RawPost — a real post, printed line for line as it was posted. Each
 * span is one part of the post; `pen` rings a span the model leaned on
 * that the poster did not write about the topic. Posts keep their own
 * line breaks (a signature is a drawn box), so on a phone the post
 * scrolls sideways inside its own frame rather than reflowing.
 * ------------------------------------------------------------------ */
export type PostPart = "meta" | "subject" | "body" | "quotes" | "sig";
export type PostSpan = { part: string; text: string; pen?: boolean };

export const PART_COLOUR: Record<PostPart, string> = {
  meta: "var(--nr-head)",
  subject: "var(--nr-ink)",
  body: "var(--nr-ink)",
  quotes: "var(--nr-quote)",
  sig: "var(--nr-sig)",
};

export const PART_NAME: Record<PostPart, string> = {
  meta: "header lines",
  subject: "subject",
  body: "what the poster wrote",
  quotes: "quoted from another post",
  sig: "signature",
};

export function RawPost({
  lines,
  dim = [],
  fontSize = 12,
}: {
  lines: PostSpan[][];
  dim?: PostPart[];
  fontSize?: number;
}) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <pre
        style={{
          ...mono,
          fontSize,
          lineHeight: 1.62,
          margin: 0,
          whiteSpace: "pre",
          background: "transparent",
          color: "var(--nr-ink)",
          padding: "3px 4px",
          width: "max-content",
        }}
      >
        {lines.map((line, li) => (
          <div key={li} style={{ minHeight: "1.62em" }}>
            {line.map((s, i) => {
              const part = s.part as PostPart;
              const off = dim.includes(part);
              return (
                <span
                  key={i}
                  style={{
                    color: PART_COLOUR[part],
                    fontWeight: part === "subject" ? 700 : 400,
                    opacity: off ? 0.28 : 1,
                    ...(s.pen && !off
                      ? {
                          outline: "1.6px solid var(--nr-pen)",
                          outlineOffset: 1,
                          borderRadius: 999,
                        }
                      : {}),
                  }}
                >
                  {s.text}
                </span>
              );
            })}
          </div>
        ))}
      </pre>
    </div>
  );
}

/* The colour key for RawPost, plus the ring. */
export function PartKey({
  parts = ["meta", "subject", "body", "quotes", "sig"],
  pen = "the words that decided it",
}: {
  parts?: PostPart[];
  /** what the red ring marks on this post */
  pen?: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 12, color: "var(--nr-ink-soft)", margin: "10px 0 0" }}>
      {parts.map((p) => (
        <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: PART_COLOUR[p] }} />
          {PART_NAME[p]}
        </span>
      ))}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 16, height: 10, borderRadius: 999, border: "1.6px solid var(--nr-pen)" }} />
        {pen}
      </span>
    </div>
  );
}
