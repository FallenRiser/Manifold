import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Capstone: predictions & takeaways — Manifold",
  description:
    "Generating final test predictions with a sanity pass that clips impossible values, and the end-to-end lessons a senior data scientist carries away — from framing through three diagnostic-driven upgrades.",
};

export default function TakeawaysPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: <>Decision &amp; delivery</>, color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Predictions & takeaways</>}
        intro={<>
          The last mile: turn the chosen model into test predictions — with one more sanity pass that catches a
        problem a careless analyst ships — and step back for the lessons that outlast this dataset.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Generating predictions</h2>
        <p>
          We apply the <em>exact same</em> preprocessing and spatial features to the test set — using the training
          medians and engineered distances, never re-fit — then predict with the final model, refit on all 16,512
          training rows.
        </p>
        <CodeBlock fromScratch={code} withLibrary={codeLib} />
        <CodeOutput>{`test predictions (n = 4128)
  mean = 2.058   (train mean 2.072  -> distribution matches, good)
  min  = 0.438   max = 5.445
  predictions above the 5.0 cap: 51  (1.24%)   <- out of range

after clip(0.15, 5.0): min = 0.438  max = 5.00`}</CodeOutput>

        <h2>The catch: sane outputs</h2>
        <p>
          First, the good news: the predicted mean (2.058) almost matches the training mean (2.072), evidence the
          test set really is from the same distribution — validating an assumption from page one. The minimum, 0.438,
          is comfortably positive, so we don&rsquo;t get the nonsensical negative prices a linear extrapolation can throw.
          But <strong>51 predictions (1.24%) land above 5.445</strong> — and the target is <em>censored at 5.0</em>, so
          a value can never legitimately exceed it. This is the cap from EDA coming back one last time: the model,
          trained on values pinned at the ceiling, occasionally guesses past it. A senior analyst doesn&rsquo;t ship that —
          they <strong>clip predictions to the valid range</strong> [0.15, 5.0], applying domain knowledge the model
          lacks. A one-line fix that prevents an obviously-wrong deliverable.
        </p>

        <Callout color="var(--c-regression)" title={<>What we&rsquo;d still do, given more time</>}>
          Even at R² 0.858 the work isn&rsquo;t &ldquo;done.&rdquo; Next steps: <strong>combine the upgrades</strong> — a
            censored <em>boosting</em> objective marries Upgrade 2&rsquo;s cap-awareness with the ensemble&rsquo;s power,
            attacking the one weakness we couldn&rsquo;t (the cap-zone RMSE). We actually did this one — the{" "}
            <a href="/learn/california-housing-capstone/censored-boosting">bonus epilogue</a> builds it and cuts
            cap-zone error 7%. Still open: <strong>tune with nested CV</strong> and a
            proper <strong>spatial cross-validation</strong> (block-by-region, since neighbouring rows leak); add{" "}
            <strong>richer features</strong> (real coastline distance, school/crime data); and <strong>quantify
            uncertainty</strong> with quantile or conformal prediction intervals rather than point estimates. The
            capstone is a strong, honest result — and a clear map of where to go further.
        </Callout>

        <h2>The lessons that outlast the dataset</h2>
        <ul style={ul}>
          <li><strong>Frame before you fit.</strong> The most consequential insight — the censored target — came from five minutes of looking, and shaped every model decision after.</li>
          <li><strong>EDA is a hunt for what&rsquo;s broken.</strong> Negative populations and 1,243-person households wouldn&rsquo;t error; domain sense caught them where statistics alone wouldn&rsquo;t.</li>
          <li><strong>Build a baseline, then earn every upgrade.</strong> We didn&rsquo;t jump to boosting — each upgrade answered a specific diagnosed weakness, so we can justify it, not just defend a score.</li>
          <li><strong>Regularization is insurance, not magic.</strong> With n ≫ p it tied OLS; we chose ridge anyway for stable, interpretable coefficients under multicollinearity.</li>
          <li><strong>Match the model to the data-generating process.</strong> The censored target needed a censored model — Tobit recovered the true income effect OLS attenuated by 18%.</li>
          <li><strong>The best model depends on the question.</strong> A stacking ensemble for prediction, Tobit for inference, linear for transparency — and we can name each because we built the whole ladder.</li>
          <li><strong>Validate the way you&rsquo;ll deploy.</strong> Random CV reported 0.86; holding out whole regions reported 0.70. Spatial leakage inflates the score — the honest number depends on whether you&rsquo;ll predict interspersed blocks or genuinely new places.</li>
          <li><strong>Sanity-check the output.</strong> The model doesn&rsquo;t know prices can&rsquo;t be negative; you do. Clip before you ship.</li>
        </ul>

        <h2>Defend it: the interview test</h2>
        <p>
          A capstone you can&rsquo;t defend is a tutorial you followed. Try answering each of these out loud —
          they&rsquo;re the questions a hiring panel (or a skeptical stakeholder) would actually ask — then check
          yourself.
        </p>
        {DEFEND.map((d) => (
          <details key={d.q} style={detailsBox}>
            <summary style={summaryRow}>{d.q}</summary>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--muted)", padding: "8px 2px 4px" }}>{d.a}</div>
          </details>
        ))}

        <h2>Your turn: the transfer test</h2>
        <p>
          The real deliverable of this capstone isn&rsquo;t R² 0.858 — it&rsquo;s the <em>procedure</em>. Pick any tabular
          prediction dataset you haven&rsquo;t touched (bike-share demand, insurance costs, used-car prices, anything
          from your own work) and run the same arc <strong>before looking at anyone else&rsquo;s solution</strong>:
        </p>
        <ol style={{ ...ul, listStyle: "decimal" }}>
          <li><strong>Frame:</strong> what exactly is the target, in what units, for whom — and what&rsquo;s the one data fact (a cap? a floor? duplicates? time order?) that will shape everything downstream?</li>
          <li><strong>Explore:</strong> find the signal <em>and</em> the damage — what&rsquo;s physically impossible in this data?</li>
          <li><strong>Baseline:</strong> the dumbest model, then the interpretable one, with one honest CV protocol fixed up front.</li>
          <li><strong>Diagnose:</strong> read the coefficients and split the residuals until you can name three specific weaknesses.</li>
          <li><strong>Upgrade:</strong> one fix per named weakness — and measure each against the same CV.</li>
          <li><strong>Select &amp; ship:</strong> choose on the question, not the leaderboard; sanity-check the outputs before they leave your hands.</li>
        </ol>
        <p>
          If you can do that on a dataset nobody framed for you, you haven&rsquo;t read a capstone — you&rsquo;ve acquired
          one. (And every code block on these pages is real, runnable analysis: the exact commands, in order, are
          the reproduction script.)
        </p>

        <h2 id="reproduce-it-yourself">Reproduce it yourself</h2>
        <p>
          Don&rsquo;t take our word for a single number. The dataset and the full analysis — every stage from framing
          to the censored-boosting epilogue, as one runnable notebook — are yours:
        </p>
        <div style={{ display: "grid", gap: 8, margin: "0 0 1.4rem" }}>
          {[
            { href: "/capstone/california-housing-capstone.ipynb", name: "california-housing-capstone.ipynb", desc: "the full pipeline as a Jupyter notebook — run top to bottom to reproduce every published number" },
            { href: "/capstone/estate_train.csv", name: "estate_train.csv", desc: "16,512 training blocks (12 columns, landmines included)" },
            { href: "/capstone/estate_test.csv", name: "estate_test.csv", desc: "4,128 test blocks, target withheld — your submission target" },
          ].map((f) => (
            <a key={f.name} href={f.href} download style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textDecoration: "none" }}>
              <span className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--brand)" }}>↓ {f.name}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{f.desc}</span>
            </a>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", margin: "1.6rem 0" }}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>You&rsquo;ve completed the California housing capstone</div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
            From framing and EDA through a regularized linear baseline, then three diagnostic-driven upgrades —
            spatial features, a censored Tobit model (unbiased effects), and the full model zoo culminating in a
            stacking ensemble (R² 0.858) — to a justified final choice and sane, delivered predictions. Every number
            computed from the real data.
            This is what end-to-end data science actually looks like: not one model, but a reasoned progression you
            can defend at every step.
          </p>
        </div>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/model-selection", label: <>← Final model selection</> }} next={{ href: "/learn/california-housing-capstone/censored-boosting", label: <>Bonus · Censored boosting &amp; SHAP →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np

# identical preprocessing + spatial features on test, using TRAIN-fit transforms
X_test = add_spatial_features(preprocess(test, medians=med))   # never re-fit on test

final = stack.fit(X_full, y)          # refit the ensemble on ALL training rows
preds = final.predict(X_test)

print("mean:", preds.mean(), " min:", preds.min(), " max:", preds.max())
# -> mean 2.058 (≈ train 2.072); min 0.438 fine, but 51 preds exceed the 5.0 cap

preds = np.clip(preds, 0.15, 5.0)   # domain knowledge the model lacks`;

const codeLib = `import pandas as pd

submission = pd.DataFrame({
    "PropertyID": test["PropertyID"],
    "TargetPrice": np.clip(preds, 0.15, 5.0),   # never ship out-of-range predictions
})
submission.to_csv("predictions.csv", index=False)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };

const DEFEND: { q: string; a: React.ReactNode }[] = [
  {
    q: "Why didn't regularization improve your score?",
    a: <>Because there was almost no overfitting to fight: 16,512 rows against 10 features. OLS&rsquo;s variance was already low, so ridge/lasso/elastic-net all tied it at R² 0.653. We kept ridge anyway — not for accuracy, but for stable, interpretable coefficients under multicollinearity (VIF up to ~14). Regularization is insurance, and the premium was worth it for a different benefit than the one people expect.</>,
  },
  {
    q: "Your R² is 0.858. Would you quote that for predicting a brand-new town?",
    a: <>No. Random 5-fold CV lets a block&rsquo;s next-door neighbours into the training folds — spatial leakage. Under spatial GroupKFold (whole regions held out) the same model scores ~0.70. For interspersed blocks, 0.858 is honest; for genuinely new geography, ~0.70 is. The right number depends on the deployment, and quoting the wrong one is how models fail in production.</>,
  },
  {
    q: "Why did you bother with a Tobit model when it barely moved the RMSE?",
    a: <>Because the goal of that upgrade was inference, not score. The target is censored at 5.0, which attenuates OLS coefficients toward zero — the income effect read 0.78 when its true value is 0.92 (+18%). Tobit models the censoring in the likelihood and recovers the unbiased effects. RMSE on <em>censored test data</em> can&rsquo;t reward that, which is itself the lesson: the best model isn&rsquo;t always the one with the best score on a flawed metric.</>,
  },
  {
    q: "Why did trees beat your carefully engineered linear model by 15 points?",
    a: <>The dominant signal — geography — is non-linear and interacting: price spikes at the coast and two metros and depends on income <em>differently by location</em>. Hand-built spatial features (distances, region intercepts) are additive and monotonic, so they bought only +0.019. Trees partition the (lat, long, income) space directly, learning the interactions we would have had to enumerate by hand — 78 polynomial terms got the linear family to 0.711; the forest hit 0.834 with none.</>,
  },
  {
    q: "A stakeholder asks why their block was priced at 4.2. What do you say?",
    a: <>Not by reading the ensemble&rsquo;s internals — that&rsquo;s not what it&rsquo;s for. The explanation toolkit is the ladder we built alongside it: the Tobit/ridge coefficients give calibrated directional effects (income, coast distance, region), and per-prediction attributions (e.g. SHAP on the booster) localise them. We ship the ensemble for accuracy and keep the linear family for exactly this question — one model per job.</>,
  },
];

const detailsBox: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 14px",
  margin: "0 0 8px",
};
const summaryRow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "var(--ink)",
  cursor: "pointer",
};
