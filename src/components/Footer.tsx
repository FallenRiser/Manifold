import Link from "next/link";
import { ManifoldMark } from "./ManifoldMark";
import { FAMILIES, PILLARS, FOUNDATIONS, CAPSTONES, type Group } from "@/lib/siteMap";
import { SITE, countsFor, groupPages } from "@/lib/catalog";

// Everything in this footer is derived from the track outlines. The previous version listed
// fifteen hand-typed tracks and had not been touched in months, on a site that had grown to
// thirty — so the rule now is that no link list here is written by hand.

/** A family's entry point: its first track that actually exists. */
const firstLive = (g: Group) => g.tracks.find((t) => t.href)?.href;

/** The substantial tracks, deepest first — a genuinely useful "where to go" list.
 *  In FAMILIES each entry is its own track. In PILLARS and FOUNDATIONS the *group* is the track
 *  and its entries are chapters of it, so counting those per-entry would list one 34-page track
 *  five times over. */
const DEEPEST = [
  ...FAMILIES.flatMap((g) =>
    g.tracks
      .filter((t) => t.href && !t.partial)
      .map((t) => ({ title: t.title, href: t.href!, color: g.color, pages: countsFor(t.href)?.done ?? 0 })),
  ),
  ...[...PILLARS, ...FOUNDATIONS]
    .filter((g) => firstLive(g))
    .map((g) => ({ title: g.name, href: firstLive(g)!, color: g.color, pages: groupPages(g).pages })),
]
  .sort((a, b) => b.pages - a.pages)
  .slice(0, 8);

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 0 }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "46px 24px 0",
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1.25fr) repeat(3, minmax(150px, 1fr))",
          gap: 32,
        }}
        className="footer-grid"
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <ManifoldMark size={24} />
            <span className="font-display" style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>manifold</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--muted)", maxWidth: 300, margin: 0 }}>
            An interactive textbook for machine-learning intuition. Drag, tune, and watch every
            algorithm work from the inside out.
          </p>
          <div style={{ display: "flex", gap: 22, marginTop: 18 }}>
            <span>
              <div className="font-serif" style={{ fontSize: 21, color: "var(--ink)", lineHeight: 1.1 }}>{SITE.livePages}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)" }}>pages</div>
            </span>
            <span>
              <div className="font-serif" style={{ fontSize: 21, color: "var(--ink)", lineHeight: 1.1 }}>{SITE.completeTracks}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)" }}>tracks</div>
            </span>
            <span>
              <div className="font-serif" style={{ fontSize: 21, color: "var(--ink)", lineHeight: 1.1 }}>{SITE.completeCapstones}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)" }}>capstones</div>
            </span>
          </div>
        </div>

        <div>
          <div className="font-display" style={colHead}>Families</div>
          {FAMILIES.map((g) => {
            const href = firstLive(g);
            const { pages } = groupPages(g);
            return href ? (
              <Link key={g.name} href={href} style={colLink}>
                <span style={{ color: g.color }}>{g.name}</span>
                <span style={count}>{pages}</span>
              </Link>
            ) : (
              <span key={g.name} style={{ ...colLink, color: "var(--faint)" }}>{g.name}</span>
            );
          })}
          <Link href="/map" style={{ ...colLink, color: "var(--ink)" }}>The full map →</Link>
        </div>

        <div>
          <div className="font-display" style={colHead}>Deepest tracks</div>
          {DEEPEST.map((t) => (
            <Link key={t.href} href={t.href} style={colLink}>
              <span>{t.title}</span>
              <span style={count}>{t.pages}</span>
            </Link>
          ))}
        </div>

        <div>
          <div className="font-display" style={colHead}>Capstones</div>
          {CAPSTONES.map((c) => (
            <Link key={c.href} href={c.href} style={colLink}>
              <span style={{ color: c.color }}>{c.title}</span>
              <span style={count}>{c.pages}</span>
            </Link>
          ))}
          <div className="font-display" style={{ ...colHead, marginTop: 22 }}>Start</div>
          <Link href="/learn/start-here" style={colLink}>New to all this →</Link>
          <Link href="/learn/linear-regression" style={colLink}>Linear regression →</Link>
        </div>
      </div>

      {/* the colophon gets its own rule — a type-nerd note, not another link column */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
        <p
          style={{
            borderTop: "1px solid var(--border)",
            margin: "34px 0 0",
            padding: "16px 0 44px",
            fontSize: 12.5,
            lineHeight: 1.7,
            color: "var(--muted)",
            maxWidth: 760,
          }}
        >
          Set in <em>Instrument Serif</em>, <em>Bricolage Grotesque</em> and <em>Geist</em>, on a
          risograph palette. Every figure is a hand-built SVG; every lab runs real mathematics in
          your browser — least squares, Lloyd&rsquo;s iterations, gradient descent and all. Every
          number quoted in the prose is reproduced by a script that runs the same code you can read.
        </p>
      </div>
    </footer>
  );
}

const colHead: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 11,
};

const colLink: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 13.5,
  color: "var(--muted)",
  textDecoration: "none",
  padding: "3.5px 0",
};

const count: React.CSSProperties = { fontSize: 11, color: "var(--faint)", flexShrink: 0 };
