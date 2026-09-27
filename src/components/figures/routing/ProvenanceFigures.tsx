// The life of one Usenet post, for the capstone's "How the data was made" page.
//
// Every stage names who or what wrote which part, and each part is tagged by what it tells a
// router: what the post says, who sent it, the conversation, when/where/how long, or the forum
// itself. A rule marks the moment the router decides; everything below it did not exist yet.
//
// The presence notes come from src/data/routing/provenance.json, which
// `python scripts/routing_cases.py provenance` writes and `routing_regen.py --check` re-derives.

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

export type ProvenanceData = {
  posts: number;
  headers: Record<string, number>;
  other_headers: Record<string, number>;
  parts: Record<string, number[]>;
};

type Tell = "what" | "who" | "thread" | "meta" | "answer";

const TELL: Record<Tell, { label: string; colour: string }> = {
  what: { label: "what the post says", colour: POST },
  // violet, like the printout's signature ink: the parts that describe the sender
  who: { label: "who sent it", colour: "var(--c-dimred)" },
  thread: { label: "the conversation", colour: "var(--warn)" },
  meta: { label: "when, where, how long", colour: "var(--faint)" },
  answer: { label: "the forum itself", colour: "var(--bad)" },
};

const pct = (r: number) => (100 * r).toFixed(1) + "%";

type Item = { name: string; tell: Tell; note: string };
type Stage = { when: string; who: string; text: string; items: Item[] };

export function PostLife({ d }: { d: ProvenanceData }) {
  const of = (h: string) => {
    const n = d.headers[h] ?? d.other_headers[h.toLowerCase()] ?? 0;
    return n === d.posts ? "every post" : n ? `${pct(n / d.posts)} of posts` : "in no post";
  };
  const part = (k: string) => `${pct(d.parts[k][0])} of new threads, ${pct(d.parts[k][1])} of replies`;

  const before: Stage[] = [
    {
      when: "weeks or years before",
      who: "the poster, once",
      text: "A few lines about themselves, written once. The newsreader appends them to every post.",
      items: [{ name: "signature", tell: "who", note: part("end in a signature") }],
    },
    {
      when: "hours or days before",
      who: "someone else",
      text: "A reply quotes the post it answers, and the newsreader writes a line naming that post's author and its Message-ID.",
      items: [
        { name: "quoted text", tell: "thread", note: part("quote another post") },
        { name: "attribution line", tell: "thread", note: part("carry an attribution line") },
      ],
    },
    {
      when: "at posting",
      who: "the poster",
      text: "Writes the subject and the body, and chooses the forum.",
      items: [
        { name: "Subject", tell: "what", note: of("Subject") },
        { name: "body", tell: "what", note: "every post" },
        { name: "Newsgroups", tell: "answer", note: "in no post: it became the label" },
      ],
    },
    {
      when: "at posting",
      who: "the newsreader and the site",
      text: "Fill in the sender, their organisation, the date, an ID naming the machine the post entered the network from, and on a reply the IDs of the posts it answers.",
      items: [
        { name: "From", tell: "who", note: of("From") },
        { name: "Organization", tell: "who", note: of("Organization") },
        { name: "Lines", tell: "meta", note: of("Lines") },
        { name: "Date", tell: "meta", note: of("Date") },
        { name: "Message-ID", tell: "meta", note: of("Message-ID") },
        { name: "References", tell: "thread", note: of("References") },
      ],
    },
    {
      when: "on arrival",
      who: "the news server that accepts it",
      text: "Records the machine the post was sent from.",
      items: [{ name: "NNTP-Posting-Host", tell: "who", note: of("nntp-posting-host") }],
    },
  ];
  const after: Stage[] = [
    {
      when: "once the forum is chosen",
      who: "the moderator, in one forum",
      text: "Posts to soc.religion.christian went to its moderator at Rutgers first, who approved them and posted them from the moderator's own server.",
      items: [{ name: "Approved", tell: "answer", note: of("Approved") }],
    },
    {
      when: "as it travels",
      who: "every server on the way",
      text: "Each adds its name to the route, files the post, and writes down the forum and the post's number there.",
      items: [
        { name: "Path", tell: "meta", note: of("Path") },
        { name: "Xref", tell: "answer", note: of("Xref") },
      ],
    },
    {
      when: "1993",
      who: "Ken Lang, most likely",
      text: "Collects about 20,000 posts, close to 1,000 from each of 20 forums, probably for a 1995 paper on filtering news. The dataset's maintainer is not certain either.",
      items: [],
    },
    {
      when: "later",
      who: "Jason Rennie, the bydate release",
      text: "Sorts the posts by date and splits them 60/40, drops cross-posted copies, and removes the headers that name the forum. Each post's forum becomes the name of the folder it sits in: the label.",
      items: [],
    },
  ];

  const stage = (s: Stage, i: number, dim: boolean) => (
    <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", padding: "10px 0", opacity: dim ? 0.92 : 1 }}>
      <div style={{ flex: "0 0 8.5em", ...mono, fontSize: 11.5, color: "var(--faint)", paddingTop: 2 }}>{s.when}</div>
      <div
        style={{
          flex: "1 1 260px",
          minWidth: 0,
          borderLeft: `2px ${dim ? "dashed" : "solid"} var(--border-strong)`,
          paddingLeft: 12,
        }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{s.who}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--muted)", margin: "2px 0 6px" }}>{s.text}</div>
        {s.items.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {s.items.map((it) => {
              const c = TELL[it.tell].colour;
              return (
                <span
                  key={it.name}
                  style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 6,
                    border: `1px solid color-mix(in srgb, ${c} 55%, var(--border))`,
                    background: `color-mix(in srgb, ${c} 8%, var(--surface))`,
                    borderRadius: 7,
                    padding: "2px 8px",
                    maxWidth: "100%",
                  }}
                >
                  <span style={{ ...mono, fontSize: 12, color: it.tell === "meta" ? "var(--ink)" : c, fontWeight: 600 }}>{it.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{it.note}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 16px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginBottom: 6 }}>
        {(Object.keys(TELL) as Tell[]).map((t) => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px solid ${TELL[t].colour}`, background: `color-mix(in srgb, ${TELL[t].colour} 18%, var(--surface))` }} />
            {TELL[t].label}
          </span>
        ))}
      </div>

      {before.map((s, i) => stage(s, i, false))}

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
        <span style={{ flex: 1, borderTop: `1.5px dashed ${POST}` }} />
        <span style={{ ...mono, fontSize: 11.5, color: POST, fontWeight: 600, textAlign: "center" }}>
          the router decides here
        </span>
        <span style={{ flex: 1, borderTop: `1.5px dashed ${POST}` }} />
      </div>

      {after.map((s, i) => stage(s, i + before.length, true))}

      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        One post&rsquo;s life, and what survived of it in this release. Shares are over all {d.posts.toLocaleString("en-US")}{" "}
        posts, or over the later posts where new threads and replies are split. Everything above the dashed line
        exists when the router decides; everything below it was written afterwards.
      </figcaption>
    </figure>
  );
}
