import Link from "next/link";
import { HousingGeoMap } from "@/components/figures/HousingGeoMap";

export const metadata = {
  title: "Capstone: California housing — Manifold",
  description:
    "A complete, executed, end-to-end machine-learning project on real California housing data: framing, EDA, a linear baseline, and three diagnostic-driven upgrades — spatial features, a censored Tobit model, and gradient boosting — with every number and plot computed from the data.",
};

export default function CapstoneHubPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>End-to-end project</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 46, lineHeight: 1.06, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Predicting California housing prices
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        One real dataset, taken all the way — the way a senior data scientist actually works. We frame the
        problem, interrogate the data, build an honest linear baseline, then drive three upgrades straight
        from the diagnostics. Every metric, coefficient, and plot on these pages is computed from the actual
        16,512-block dataset.
      </p>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0 0 8px" }}>
        <HousingGeoMap />
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
          The whole problem in one picture: 260 sampled blocks placed by latitude/longitude and coloured by
          median price. The coast and the Bay Area / Los Angeles basins glow red; the inland Central Valley
          stays blue. <strong>Geography is the dominant signal</strong> — and it&rsquo;s deeply non-linear, which is
          the thread running through this entire capstone.
        </div>
      </div>

      <div className="lesson">
        <h2>The mission</h2>
        <p>
          Given 16,512 California census blocks with income, house age, rooms, population, occupancy, and
          location, predict each block&rsquo;s <strong>median home value</strong> (<code>TargetPrice</code>, in
          $100k units) — and do it for 4,128 held-out test blocks where the price is hidden. But the score is
          not the point. The point is the <em>reasoning</em>: every decision, why we make it, what we assume,
          and how each model choice follows from evidence.
        </p>

        <h2>The arc of the project</h2>
        <p>
          This capstone is built as a story with a spine: a strong, transparent baseline, and then three
          upgrades, each one motivated by a specific failure the diagnostics expose.
        </p>
        <ol style={ol}>
          <li><strong>Frame &amp; explore</strong> — define the target, metric, and assumptions; find the signal and the data-quality landmines.</li>
          <li><strong>Linear baseline</strong> — preprocess properly, then build up from a trivial baseline to regularized regression, and read what the model gets right.</li>
          <li><strong>Diagnose</strong> — three concrete weaknesses surface: non-linear geography, a censored target, and unmodelled interactions.</li>
          <li><strong>Upgrade 1 · Geography</strong> — engineer spatial features (distance-to-coast, regions).</li>
          <li><strong>Upgrade 2 · Censoring</strong> — a Tobit model that knows the target was clipped at 5.0.</li>
          <li><strong>Upgrade 3 · Non-linearity</strong> — gradient boosting to capture interactions and spatial structure.</li>
          <li><strong>Select &amp; deliver</strong> — compare every model, justify the final choice, and ship sane predictions.</li>
        </ol>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Where we end up (the spoiler)
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The regularized linear baseline reaches <strong>R² = 0.672</strong>. Spatial features lift it to{" "}
            <strong>0.691</strong>; the Tobit model corrects biased coefficients without chasing the score; and
            gradient boosting jumps to <strong>R² = 0.843</strong> — a ~43% cut in error over the baseline. Each
            gain is earned by addressing a named diagnostic, and we&rsquo;ll see exactly why the linear model left
            that performance on the table. Every number here is reproduced from the real data on the page that
            introduces it.
          </p>
        </div>

        <h2>How to read it</h2>
        <p>
          Code blocks show the real analysis; the <span style={{ color: "var(--good)" }}>●</span> <em>output</em>
          panels beneath them show the actual captured results from running it. Figures are computed from the
          data, not mocked. You can follow the narrative top to bottom, or jump to an upgrade from the sidebar.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression" style={navLink}>← Regularized regression</Link>
          <Link href="/learn/california-housing-capstone/framing" style={{ ...navLink, fontWeight: 600 }}>Next up · Framing the problem →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
