import Link from "next/link";
import { HeroFitLab } from "@/components/HeroFitLab";
import { ContinueCard } from "@/components/ContinueCard";
import { Reveal } from "@/components/Reveal";
import { HousingGeoMap } from "@/components/figures/HousingGeoMap";
import { LR_TOTAL, LR_DONE } from "@/lib/linearRegressionTrack";
import { REG_TOTAL, REG_DONE } from "@/lib/regularizationTrack";
import { POLY_TOTAL, POLY_DONE } from "@/lib/polynomialRegressionTrack";
import { KM_TOTAL, KM_DONE } from "@/lib/kMeansTrack";
import { KNN_TOTAL, KNN_DONE } from "@/lib/knnTrack";

const TIERS = [
  { n: 0, name: "Math Foundations", blurb: "the prerequisites, only when you need them" },
  { n: 1, name: "Intuition", blurb: "see it work — everyone starts here" },
  { n: 2, name: "Practitioner", blurb: "use it well: code, tuning, workflow" },
  { n: 3, name: "Theory", blurb: "why it's guaranteed to work" },
];

const ARC = ["Hook", "Intuition", "Mechanics", "Math", "Code", "Levers", "When & why"];

const TRACKS = [
  {
    name: "Linear regression",
    href: "/learn/linear-regression",
    color: "var(--c-regression)",
    done: LR_DONE, total: LR_TOTAL,
    blurb: "The flagship. From dragging a line by hand to gradients, diagnostics, and inference.",
  },
  {
    name: "Regularized regression",
    href: "/learn/regularized-regression",
    color: "var(--c-regression)",
    done: REG_DONE, total: REG_TOTAL,
    blurb: "Ridge, lasso, elastic-net — why shrinking coefficients beats trusting them.",
  },
  {
    name: "Polynomial regression",
    href: "/learn/polynomial-regression",
    color: "var(--c-regression)",
    done: POLY_DONE, total: POLY_TOTAL,
    blurb: "Curves from lines: basis functions, and the overfitting cliff-edge.",
  },
  {
    name: "k-Means clustering",
    href: "/learn/k-means",
    color: "var(--c-clustering)",
    done: KM_DONE, total: KM_TOTAL,
    blurb: "Structure with no labels — Lloyd's algorithm, k-means++, and how to choose k.",
  },
  {
    name: "k-Nearest Neighbors",
    href: "/learn/k-nearest-neighbors",
    color: "var(--c-classification)",
    done: KNN_DONE, total: KNN_TOTAL,
    blurb: "The simplest classifier there is — and the sharpest lens on distance and dimensionality.",
  },
];

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

      {/* ---------- Live tracks ---------- */}
      <Reveal>
        <section className="chapter">
          <div className="chapter-eyebrow">What&rsquo;s live</div>
          <h2 className="chapter-title">Mastery-depth tracks, not summaries.</h2>
          <p className="chapter-sub">
            One algorithm can run forty pages — every concept taught with text, a visual, and an
            interactive lab together. Never prose alone.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {TRACKS.map((t) => (
              <Link
                key={t.name}
                href={t.href}
                className="gcard"
                style={{ ["--accent" as string]: t.color, display: "block", textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="font-display" style={{ fontSize: 16.5, fontWeight: 500, color: t.color }}>{t.name}</span>
                  <span
                    style={{
                      fontSize: 11.5,
                      color: t.done >= t.total ? "var(--good)" : "var(--muted)",
                      background: "var(--surface-2)",
                      borderRadius: 999,
                      padding: "3px 9px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.done >= t.total ? `${t.total} pages` : `${t.done} of ${t.total} live`}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)" }}>{t.blurb}</p>
              </Link>
            ))}
            <Link href="/map" className="gcard" style={{ ["--accent" as string]: "var(--c-metrics)", display: "flex", flexDirection: "column", justifyContent: "center", textDecoration: "none" }}>
              <span className="font-display" style={{ fontSize: 16.5, fontWeight: 500, color: "var(--ink)" }}>The full map →</span>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)" }}>
                Seven algorithm families, the pillars, and the theory track — everything Manifold will teach.
              </p>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ---------- Capstone showcase ---------- */}
      <Reveal>
        <section className="chapter" style={{ marginBottom: 84 }}>
          <div className="chapter-eyebrow">The capstone</div>
          <h2 className="chapter-title">One real dataset, taken all the way.</h2>
          <p className="chapter-sub">
            16,512 California census blocks, the way a senior data scientist works: frame, explore,
            baseline, diagnose — then three upgrades, each earned by a named diagnostic.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
              gap: 28,
              alignItems: "center",
            }}
            className="hero-grid"
          >
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 14 }}>
              <HousingGeoMap />
            </div>
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "linear baseline", value: "R² 0.653" },
                  { label: "stacked ensemble", value: "R² 0.858" },
                  { label: "error cut", value: "~62%" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--surface-2)", borderRadius: 12, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</div>
                    <div className="font-display" style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--muted)", margin: "0 0 18px" }}>
                Spatial features, a censored Tobit model, and a full model zoo — random forest,
                XGBoost, LightGBM, stacking — with every number and plot computed from the actual
                data. Not a toy walkthrough: the reasoning behind every decision.
              </p>
              <Link href="/learn/california-housing-capstone" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Read the capstone →
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
