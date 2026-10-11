import Link from "next/link";
import { HeroFitLab } from "@/components/HeroFitLab";
import { ContinueCard } from "@/components/ContinueCard";
import { Reveal } from "@/components/Reveal";
import { HousingGeoMap } from "@/components/figures/HousingGeoMap";
import { NeoField } from "@/components/figures/NeoField";
import { WarehouseFloor } from "@/components/figures/WarehouseFloor";
import { RoutingWaffle } from "@/components/figures/RoutingWaffle";
import { CapstoneCard } from "@/components/CapstoneCard";
import { Shelf } from "@/components/Shelf";
import { CAPSTONES, FAMILIES, PILLARS, FOUNDATIONS } from "@/lib/siteMap";
import { SITE } from "@/lib/catalog";

const TIERS = [
  { n: 0, name: "Math Foundations", blurb: "the prerequisites, only when you need them" },
  { n: 1, name: "Intuition", blurb: "see it work — everyone starts here" },
  { n: 2, name: "Practitioner", blurb: "use it well: code, tuning, workflow" },
  { n: 3, name: "Theory", blurb: "why it's guaranteed to work" },
];

const ARC = ["Hook", "Intuition", "Mechanics", "Math", "Code", "Levers", "When & why"];

const FIGURES = [<HousingGeoMap key="h" wide />, <NeoField key="n" />, <WarehouseFloor key="w" />, <RoutingWaffle key="r" />];

const RULES = [
  {
    title: "Every number is reproduced",
    body: "No figure is quoted from memory or from a paper. Each one is produced by a script in this repository that runs the same code the page shows you — on the real dataset, with the seed written down.",
  },
  {
    title: "Every lab runs real mathematics",
    body: "Nothing is a pre-rendered animation. The labs solve least squares, run Lloyd's iterations and take gradient steps in your browser, on the numbers you just dragged.",
  },
  {
    title: "Unbuilt pages say so",
    body: "A track that is half-written shows its real count and leaves the rest unlinked. Results that have not been measured yet are never written up as though they had been.",
  },
];

const shelfHead: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--muted)",
  margin: "34px 0 10px",
};

export default function Home() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 0" }}>
      {/* ---------- Hero: the product is the demo ---------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,0.95fr)",
          gap: 44,
          alignItems: "center",
        }}
        className="hero-grid"
      >
        <div>
          <h1
            className="font-serif"
            style={{ fontSize: "clamp(40px, 6vw, 60px)", lineHeight: 1.06, letterSpacing: "-0.01em", margin: 0, color: "var(--ink)" }}
          >
            See how machine learning <span style={{ fontStyle: "italic" }}>actually thinks.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--muted)", maxWidth: 440, margin: "18px 0 28px" }}>
            An interactive textbook for the intuition behind every algorithm — drag, tune,
            and watch each one work from the inside out. No memorising formulas. Just seeing
            why they work.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Link
              href="/learn/linear-regression"
              className="font-display"
              style={{
                background: "var(--cta)",
                color: "var(--cta-text)",
                fontSize: 15,
                fontWeight: 500,
                padding: "11px 20px",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              Start with linear regression
            </Link>
            <Link href="/map" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 14, textDecoration: "none" }}>
              Browse the whole map →
            </Link>
          </div>

          {/* The size of the thing, stated once. Every figure is derived from the track
              outlines themselves, so it cannot drift the way a hand-written claim would. */}
          <div className="proof">
            <span className="proof-item">
              <span className="proof-num">{SITE.livePages}</span>
              <span className="proof-label">pages written</span>
            </span>
            <span className="proof-item">
              <span className="proof-num">{SITE.completeTracks}</span>
              <span className="proof-label">tracks complete</span>
            </span>
            <span className="proof-item">
              <span className="proof-num">{SITE.completeCapstones}</span>
              <span className="proof-label">capstones, end to end</span>
            </span>
          </div>

          <ContinueCard />
        </div>

        <HeroFitLab />
      </div>

      {/* ---------- How Manifold teaches ---------- */}
      <Reveal>
        <section className="chapter" style={{ marginTop: 72 }}>
          <div className="chapter-eyebrow">How it teaches</div>
          <h2 className="chapter-title">One topic, four optional depths.</h2>
          <p className="chapter-sub">
            A complete beginner and a graduate student read the same page — they just descend to
            different tiers. Theory is always opt-in, never a wall.
          </p>
          <div className="depthgrid">
            {TIERS.map((t, i) => {
              const fill = [
                "color-mix(in srgb, var(--ink) 45%, var(--paper))",
                "color-mix(in srgb, var(--ink) 65%, var(--paper))",
                "color-mix(in srgb, var(--ink) 84%, var(--paper))",
                "var(--ink)",
              ][i];
              return (
                <div key={t.n}>
                  <div className="depthstep-row">
                    <span className="depthbadge" style={{ background: fill, color: "var(--paper)" }}>{t.n}</span>
                    <span className="depthstep-name">{t.name}</span>
                  </div>
                  <div className="depthstep-blurb">{t.blurb}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 26, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)", marginRight: 8 }}>Every lesson follows the same arc:</span>
            {ARC.map((s, i) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span className="font-display" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>{s}</span>
                {i < ARC.length - 1 && <span style={{ color: "var(--faint)", fontSize: 12 }}>→</span>}
              </span>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ---------- The library, in full ---------- */}
      <Reveal>
        <section className="chapter">
          <div className="chapter-eyebrow">What&rsquo;s live</div>
          <h2 className="chapter-title">Mastery-depth tracks, not summaries.</h2>
          <p className="chapter-sub">
            One algorithm can run forty pages — every concept taught with text, a visual, and an
            interactive lab together, never prose alone. Here is all of it, families first, with
            the page count each one actually has today.
          </p>
          <Shelf groups={FAMILIES} />

          <h3 style={shelfHead}>The craft every algorithm leans on</h3>
          <Shelf groups={PILLARS} unit="chapters" />

          <h3 style={shelfHead}>The mathematics underneath, the guarantees above</h3>
          <Shelf groups={FOUNDATIONS} unit="chapters" />

          <p style={{ fontSize: 14, margin: "22px 0 0" }}>
            <Link href="/map" style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 500 }}>
              See how the families connect →
            </Link>
          </p>
        </section>
      </Reveal>

      {/* ---------- Capstones showcase ---------- */}
      <Reveal>
        <section className="chapter" style={{ marginBottom: 84 }}>
          <div className="chapter-eyebrow">The capstones</div>
          <h2 className="chapter-title">Real datasets, taken all the way.</h2>
          <p className="chapter-sub">
            Where the algorithms meet reality. Each capstone works one messy, real dataset the way a
            senior data scientist would — framing, honest evaluation, and a justified model climb — with
            every number computed from the actual data.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 20 }}>
            {CAPSTONES.map((cap, i) => (
              <CapstoneCard
                key={cap.href}
                capstone={cap}
                figure={FIGURES[i]}
              />
            ))}
          </div>
        </section>
      </Reveal>

      {/* ---------- The house rules — the site's actual differentiator ---------- */}
      <Reveal>
        <section className="chapter" style={{ marginBottom: 90 }}>
          <div className="chapter-eyebrow">House rules</div>
          <h2 className="chapter-title">Nothing here is hand-waved.</h2>
          <p className="chapter-sub">
            Three rules the whole site is held to — the reason it takes forty pages to teach one
            algorithm, and the reason you can trust the numbers in them.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 26 }}>
            {RULES.map((r) => (
              <div key={r.title}>
                <div className="font-display" style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
                  {r.title}
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--muted)" }}>{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </main>
  );
}
