import Link from "next/link";
import { TIERS, FAMILIES, PILLARS, FOUNDATIONS, type Group } from "@/lib/siteMap";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "The map — Manifold",
  description:
    "The full curriculum: every algorithm family, the cross-cutting pillars, and the theory spine, across four depth tiers.",
};

const SECTIONS = [
  {
    part: "Part one",
    title: "Algorithm families",
    sub: "Predict, classify, cluster, reduce — each a colour-coded world you can explore end to end.",
    groups: FAMILIES,
  },
  {
    part: "Part two",
    title: "Cross-cutting pillars",
    sub: "The craft every algorithm leans on: understanding data, judging models, and choosing between them.",
    groups: PILLARS,
  },
  {
    part: "Part three",
    title: "Foundations & theory",
    sub: "The mathematics underneath and the guarantees above — always there when you want to go deeper.",
    groups: FOUNDATIONS,
  },
];

export default function MapPage() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 112px" }}>
      <Reveal>
        <span style={chip}>Curriculum map</span>
        <h1
          className="font-serif"
          style={{ fontSize: "clamp(46px, 7vw, 68px)", lineHeight: 1.04, letterSpacing: "-0.015em", margin: "12px 0 12px", color: "var(--ink)" }}
        >
          The map
        </h1>
        <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
          Everything Manifold teaches, as one connected atlas. One topic, four optional
          depths — start with intuition and descend as far as you like.
        </p>
        <p style={{ fontSize: 14.5, margin: "14px 0 0" }}>
          <Link href="/learn/start-here" style={{ color: "var(--c-fundamentals)", textDecoration: "none", fontWeight: 550 }}>
            New to machine learning? Take the five-page on-ramp →
          </Link>
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="depthscale">
          <div className="depthscale-head">Read at any depth — descend as far as you like</div>
          <div className="depthgrid">
            {TIERS.map((t, i) => {
              // ink deepening with descent — brand is ink, not violet (§10.1)
              const fill = [
                "color-mix(in srgb, var(--ink) 45%, var(--paper))",
                "color-mix(in srgb, var(--ink) 65%, var(--paper))",
                "color-mix(in srgb, var(--ink) 84%, var(--paper))",
                "var(--ink)",
              ][i];
              return (
                <div key={t.n}>
                  <div className="depthstep-row">
                    <span className="depthbadge" style={{ background: fill, color: "var(--paper)" }}>
                      {t.n}
                    </span>
                    <span className="depthstep-name">{t.name}</span>
                  </div>
                  <div className="depthstep-blurb">{t.blurb}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {SECTIONS.map((sec) => (
        <section key={sec.part} className="chapter">
          <Reveal>
            <div className="chapter-eyebrow">{sec.part}</div>
            <h2 className="chapter-title">{sec.title}</h2>
            <p className="chapter-sub">{sec.sub}</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {sec.groups.map((g, i) => (
              <Reveal key={g.name} delay={i * 55} style={{ height: "100%" }}>
                <GroupCard group={g} />
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function GroupCard({ group }: { group: Group }) {
  const live = group.tracks.filter((t) => t.href).length;
  return (
    <div
      className="gcard"
      style={{
        ["--accent"]: group.color,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        overflow: "hidden",
      } as React.CSSProperties}
    >
      {/* header band: consistent height across every card in a row */}
      <div
        style={{
          background: "color-mix(in srgb, var(--accent) 7%, var(--surface))",
          borderBottom: "1px solid color-mix(in srgb, var(--accent) 18%, var(--border))",
          padding: "14px 20px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--accent)", flexShrink: 0 }} />
          <span className="font-display" style={{ fontSize: 16, fontWeight: 500, color: "var(--accent)" }}>
            {group.name}
          </span>
          {live > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 10.5, whiteSpace: "nowrap", color: "var(--good)", background: "color-mix(in srgb, var(--good) 12%, var(--surface))", padding: "2px 8px", borderRadius: 999 }}>
              {live} live
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5, margin: "6px 0 0", minHeight: "2.6em" }}>
          {group.blurb}
        </p>
      </div>

      {/* track list fills the remaining height so card bottoms align */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "6px 20px 14px" }}>
        {group.tracks.map((t) =>
          t.href ? (
            <Link key={t.title} href={t.href} className="gtrack">
              <span>{t.title}</span>
              <span style={{ color: "var(--accent)", fontSize: 13, whiteSpace: "nowrap" }}>
                {t.partial ? <><span style={{ color: "var(--faint)", fontSize: 11 }}>first chapters</span> →</> : <>start →</>}
              </span>
            </Link>
          ) : (
            <div key={t.title} className="gtrack gtrack--soon">
              <span>{t.title}</span>
              <span style={{ fontSize: 11 }}>soon</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "color-mix(in srgb, var(--c-metrics) 14%, var(--surface))",
  color: "var(--muted)",
  fontSize: 12,
  padding: "3px 11px",
  borderRadius: 999,
};
