// Figures for the message-routing capstone's "What job is the model doing?" page.
//
// Both read src/data/routing/job.json, which `python scripts/routing_cases.py job` writes and
// `scripts/routing_regen.py --check` re-derives. Nothing here is typed in by hand.
//
// HTML rather than SVG on purpose: the forum names are the data, and an SVG scaled to a phone
// shrinks them below reading size. A CSS grid keeps them at 11px and lets the track take the rest.

const POST = "var(--c-post)";
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

export type JobData = {
  posts: number;
  replies: number;
  new: number;
  before: number;
  later: number;
  missing: number;
  missing_threads: number;
  lookup: number;
  model: number;
  lookup_right: number;
  right_before: number;
  right_later: number;
  mix: { forum: string; all: number; new: number }[];
};

export const fmt = (x: number) => x.toLocaleString("en-US");
export const share = (a: number, b: number, dp = 1) => ((100 * a) / b).toFixed(dp) + "%";
export const rate = (r: number, dp = 1) => (100 * r).toFixed(dp) + "%";

const frame: React.CSSProperties = {
  margin: "22px 0 6px",
  padding: "16px 16px 12px",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 14,
};
const caption: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--muted)",
  lineHeight: 1.6,
  marginTop: 12,
  paddingTop: 10,
  borderTop: "1px solid var(--border)",
};

/* ------------------------------------------------------------------ *
 * RouterFlow — the later period's posts, split by who files them.
 * One bar, five segments: three the thread lookup files (grey, no
 * model), two the model has to decide (the accent).
 * ------------------------------------------------------------------ */
export function RouterFlow({ d }: { d: JobData }) {
  const follow = d.missing - d.missing_threads;
  const grey = (k: number) => `color-mix(in srgb, var(--ink) ${k}%, var(--surface))`;
  const segs = [
    { n: d.before, c: grey(46) },
    { n: d.later, c: grey(32) },
    { n: follow, c: grey(20) },
    { n: d.missing_threads, c: `color-mix(in srgb, ${POST} 52%, var(--surface))` },
    { n: d.new, c: POST },
  ];
  const row = (c: string, n: number, text: React.ReactNode, note?: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "10px 3.6em minmax(0, 1fr)", gap: "0 8px", alignItems: "baseline", fontSize: 13, lineHeight: 1.5 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: c, alignSelf: "center" }} />
      <span style={{ ...mono, fontSize: 12.5, fontWeight: 600, color: "var(--ink)", textAlign: "right" }}>{fmt(n)}</span>
      <span style={{ color: "var(--muted)" }}>
        {text}
        {note && <span style={{ ...mono, fontSize: 11.5, color: "var(--ink)", whiteSpace: "nowrap" }}> · {note}</span>}
      </span>
    </div>
  );
  const head = (title: string, n: number, colour: string) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: colour }}>{title}</div>
      <div style={{ ...mono, fontSize: 11.5, color: "var(--faint)" }}>
        {fmt(n)} posts · {share(n, d.posts)}
      </div>
    </div>
  );
  return (
    <figure style={frame}>
      <div style={{ ...mono, fontSize: 11.5, color: "var(--faint)", marginBottom: 8 }}>
        the {fmt(d.posts)} posts of the later period, by who files them
      </div>
      {/* the two groups, bracketed over the bar */}
      <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
        <div style={{ flex: d.lookup, borderTop: "1.5px solid var(--muted)", paddingTop: 3, fontSize: 11.5, color: "var(--muted)", minWidth: 0 }}>
          the thread lookup
        </div>
        <div style={{ flex: d.model, borderTop: `1.5px solid ${POST}`, paddingTop: 3, fontSize: 11.5, color: POST, fontWeight: 600, minWidth: 0 }}>
          the model
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, height: 26, borderRadius: 6, overflow: "hidden" }} role="img"
        aria-label={`${fmt(d.lookup)} posts filed by the thread lookup, ${fmt(d.model)} needing the model`}>
        {segs.map((s, i) => (
          <div key={i} style={{ flex: s.n, background: s.c }} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px 28px", marginTop: 16 }}>
        <div>
          {head("Filed with its thread, no model", d.lookup, "var(--ink)")}
          <div style={{ display: "grid", gap: 6 }}>
            {row(segs[0].c, d.before, "replies to a thread filed before the cut-off", `${rate(d.right_before)} right`)}
            {row(segs[1].c, d.later, "replies to a thread a later new post opened", `${rate(d.right_later)} right`)}
            {row(segs[2].c, follow, "more replies in those threads; they follow the first")}
          </div>
        </div>
        <div>
          {head("Needs the model", d.model, POST)}
          <div style={{ display: "grid", gap: 6 }}>
            {row(segs[4].c, d.new, "new threads")}
            {row(segs[3].c, d.missing_threads, `first replies in the ${fmt(d.missing_threads)} threads whose opening post is not in the data`)}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, paddingLeft: 18, lineHeight: 1.55 }}>
            <span style={{ color: POST }}>→</span> sure of it: filed.{" "}
            <span style={{ color: POST }}>→</span> not sure: a moderator picks from three suggestions.
          </div>
        </div>
      </div>

      <figcaption style={caption}>
        A reply goes wherever its thread already is, and the router finds the thread by its subject line. Where
        the thread&rsquo;s forum is known ({fmt(d.before + d.later)} replies), the lookup files{" "}
        {rate(d.lookup_right)} of them in the right forum.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * ForumMix — each forum's share of all later posts (hollow) against its
 * share of the new threads (filled): the traffic the model is for.
 * ------------------------------------------------------------------ */
const AXIS = 0.15;

export function ForumMix({ d }: { d: JobData }) {
  const x = (v: number) => `${((100 * v) / AXIS).toFixed(2)}%`;
  const grid = "max-content minmax(0, 1fr) 2.9em";
  return (
    <figure style={frame}>
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: "0 8px", alignItems: "center" }}>
        {/* axis */}
        <span />
        <div style={{ position: "relative", height: 16 }}>
          {[0, 0.05, 0.1, 0.15].map((t) => (
            <span key={t} style={{ position: "absolute", left: x(t), transform: t === 0 ? "none" : t === AXIS ? "translateX(-100%)" : "translateX(-50%)", ...mono, fontSize: 10.5, color: "var(--faint)" }}>
              {t === 0 ? "0" : `${Math.round(t * 100)}%`}
            </span>
          ))}
        </div>
        <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)", textAlign: "right" }}>new</span>

        {d.mix.map((m) => {
          const a = m.all / d.posts;
          const b = m.new / d.new;
          const lo = Math.min(a, b);
          return (
            <div key={m.forum} style={{ display: "contents" }}>
              <span style={{ ...mono, fontSize: 11, color: "var(--ink)", lineHeight: "20px", whiteSpace: "nowrap" }}>{m.forum}</span>
              <div
                style={{
                  position: "relative",
                  height: 20,
                  backgroundImage: "linear-gradient(to right, var(--border-strong) 1px, transparent 1px)",
                  backgroundSize: "33.333% 100%",
                }}
              >
                <span style={{ position: "absolute", left: x(lo), width: x(Math.abs(b - a)), top: 9, height: 2, background: `color-mix(in srgb, ${POST} 35%, transparent)` }} />
                <span style={{ position: "absolute", left: x(a), top: 5, width: 10, height: 10, marginLeft: -5, borderRadius: 999, border: "1.6px solid var(--muted)", background: "var(--surface-2)", boxSizing: "border-box" }} />
                <span style={{ position: "absolute", left: x(b), top: 5, width: 10, height: 10, marginLeft: -5, borderRadius: 999, background: POST }} />
              </div>
              <span style={{ ...mono, fontSize: 11, color: "var(--ink)", textAlign: "right" }}>{share(m.new, d.new)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 10, fontSize: 11.5, color: "var(--muted)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, border: "1.6px solid var(--muted)", boxSizing: "border-box" }} />
          share of all {fmt(d.posts)} later posts
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: POST }} />
          share of the {fmt(d.new)} new threads, the posts the model is for
        </span>
      </div>
      <figcaption style={caption}>
        Every forum holds between {share(Math.min(...d.mix.map((m) => m.all)), d.posts)} and{" "}
        {share(Math.max(...d.mix.map((m) => m.all)), d.posts)} of the later posts. Among the new threads the
        spread runs from {share(Math.min(...d.mix.map((m) => m.new)), d.new)} to{" "}
        {share(Math.max(...d.mix.map((m) => m.new)), d.new)}.
      </figcaption>
    </figure>
  );
}
