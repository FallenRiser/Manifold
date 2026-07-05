import { HousingGeoMap } from "@/components/figures/HousingGeoMap";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Capstone: California housing — Manifold",
  description:
    "A complete, executed, end-to-end machine-learning project on real California housing data: framing, EDA, a linear baseline, and three diagnostic-driven upgrades — spatial features, a censored Tobit model, and a full model zoo (random forest, XGBoost, LightGBM, stacking) reaching R² 0.858 — with every number and plot computed from the data.",
};

export default function CapstoneHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "End-to-end project", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Predicting California housing prices</>}
        intro={<>
          One real dataset, taken all the way — the way a senior data scientist actually works. We frame the
        problem, interrogate the data, build an honest linear baseline, then drive three upgrades straight
        from the diagnostics. Every metric, coefficient, and plot on these pages is computed from the actual
        16,512-block dataset.
        </>}
        titleSize={46}
        introSize={17.5}
      />

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
          <li><strong>Upgrade 3 · The model zoo</strong> — push the linear ceiling with polynomials, then run random forest, XGBoost, LightGBM, and a stacking ensemble.</li>
          <li><strong>Select &amp; deliver</strong> — compare every model, justify the final choice, and ship sane predictions.</li>
          <li><strong>Epilogue · Combine the upgrades</strong> — a censored-objective LightGBM (Tobit likelihood inside the booster) that cuts cap-zone error 7%, and per-prediction SHAP explanations that answer a stakeholder&rsquo;s &ldquo;why?&rdquo;.</li>
        </ol>

        <Callout color="var(--c-regression)" title={<>Where we end up (the spoiler)</>}>
          The regularized linear baseline reaches <strong>R² = 0.653</strong>. Spatial features and polynomial
            terms push the linear ceiling to <strong>0.711</strong>; the Tobit model corrects biased coefficients
            without chasing the score; and the model zoo — random forest, XGBoost, LightGBM — lands in the mid-0.80s,
            with a <strong>stacking ensemble at R² = 0.858</strong>, a <strong>~62% cut in error</strong> over the
            baseline. Each gain is earned by addressing a named diagnostic, and we&rsquo;ll see exactly why the linear
            model left that performance on the table. Every number here is reproduced from the real data on the page
            that introduces it.
        </Callout>

        <h2>How to read it</h2>
        <p>
          Code blocks show the real analysis; the <span style={{ color: "var(--good)" }}>●</span> <em>output</em>
          panels beneath them show the actual captured results from running it. Figures are computed from the
          data, not mocked. You can follow the narrative top to bottom, or jump to an upgrade from the sidebar.
        </p>
        <p>
          And this capstone is <em>played</em>, not just read: at every major juncture a{" "}
          <strong>&ldquo;your call&rdquo;</strong> box asks what <em>you&rsquo;d</em> do before revealing the senior move, and{" "}
          <strong>&ldquo;guess before you look&rdquo;</strong> sliders make you commit to a number before the real one
          appears. Answer them honestly — the gap between your guess and the truth is where the learning is. The
          final page ends with an interview-style <strong>defend-it</strong> self-test and a transfer challenge to
          run on a dataset of your own.
        </p>
        <p>
          It&rsquo;s also fully reproducible: the dataset and the entire analysis as a runnable Jupyter notebook are{" "}
          <a href="/learn/california-housing-capstone/takeaways#reproduce-it-yourself">downloadable from the final page</a> —
          every number on these pages falls out of running it top to bottom.
        </p>

        <PrevNext prev={{ href: "/learn/regularized-regression", label: <>← Regularized regression</> }} next={{ href: "/learn/california-housing-capstone/framing", label: <>Next up · Framing the problem →</> }} />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
