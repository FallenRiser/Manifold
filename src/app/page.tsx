import Link from "next/link";
import { LossLandscapeArt } from "@/components/LossLandscapeArt";

const families = [
  { name: "Regression", color: "var(--c-regression)", tint: "color-mix(in srgb, var(--c-regression) 12%, var(--surface))" },
  { name: "Classification", color: "var(--c-classification)", tint: "color-mix(in srgb, var(--c-classification) 12%, var(--surface))" },
  { name: "Clustering", color: "var(--c-clustering)", tint: "color-mix(in srgb, var(--c-clustering) 12%, var(--surface))" },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 24px 96px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.85fr)",
          gap: 40,
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
                color: "#fff",
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
              Browse the map →
            </Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 30 }}>
            {families.map((f) => (
              <span
                key={f.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: f.tint,
                  color: f.color,
                  fontSize: 12.5,
                  padding: "5px 12px 5px 9px",
                  borderRadius: 999,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: f.color }} />
                {f.name}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: 12,
          }}
        >
          <LossLandscapeArt />
          <div
            className="font-serif"
            style={{ fontSize: 14, fontStyle: "italic", color: "var(--faint)", textAlign: "center", marginTop: 7 }}
          >
            the loss landscape
          </div>
        </div>
      </div>
    </main>
  );
}
