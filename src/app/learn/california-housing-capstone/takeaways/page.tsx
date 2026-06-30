import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Capstone: predictions & takeaways — Manifold",
  description:
    "Generating final test predictions with a sanity pass that clips impossible values, and the end-to-end lessons a senior data scientist carries away — from framing through three diagnostic-driven upgrades.",
};

export default function TakeawaysPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>Decision &amp; delivery</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Predictions & takeaways
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The last mile: turn the chosen model into test predictions — with one more sanity pass that catches a
        problem a careless analyst ships — and step back for the lessons that outlast this dataset.
      </p>

      <div className="lesson">
        <h2>Generating predictions</h2>
        <p>
          We apply the <em>exact same</em> preprocessing and spatial features to the test set — using the training
          medians, scaler, and k-means regions, never re-fit — then predict with the final gradient-boosting model.
        </p>
        <CodeBlock fromScratch={code} withLibrary={codeLib} />
        <CodeOutput>{`test predictions (n = 4128)
  mean = 2.05    (train mean 2.07  -> distribution matches, good)
  min  = -1.42   max = 7.51        <- IMPOSSIBLE for a price
  fraction above the 5.0 cap: 0.9%

after clip(0.15, 5.0): min = 0.15  max = 5.00`}</CodeOutput>

        <h2>The catch: sane outputs</h2>
        <p>
          First, the good news: the predicted mean (2.05) almost matches the training mean (2.07), evidence the test
          set really is from the same distribution — validating an assumption from page one. But the range runs from{" "}
          <strong>−1.42 to 7.51</strong>. A negative home value is nonsense, and the target never exceeds 5.0, yet
          even a strong model will produce out-of-range numbers. A senior analyst doesn&rsquo;t ship these — they{" "}
          <strong>clip predictions to the valid range</strong> [0.15, 5.0], applying domain knowledge the model lacks.
          A two-character fix that prevents an embarrassing, obviously-wrong deliverable.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            What we&rsquo;d still do, given more time
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Even at R² 0.84 the work isn&rsquo;t &ldquo;done.&rdquo; Next steps: <strong>combine the upgrades</strong> — a
            censored <em>boosting</em> objective would marry Upgrade 2&rsquo;s cap-awareness with Upgrade 3&rsquo;s power;{" "}
            <strong>tune boosting</strong> properly with nested CV and try XGBoost/LightGBM; add{" "}
            <strong>richer spatial features</strong> (true coastline distance, school/crime data) and model the{" "}
            <strong>spatial correlation</strong> the independence assumption ignores; and <strong>quantify
            uncertainty</strong> with prediction intervals rather than point estimates. The capstone is a strong,
            honest result — and a clear map of where to go further.
          </p>
        </div>

        <h2>The lessons that outlast the dataset</h2>
        <ul style={ul}>
          <li><strong>Frame before you fit.</strong> The most consequential insight — the censored target — came from five minutes of looking, and shaped every model decision after.</li>
          <li><strong>EDA is a hunt for what&rsquo;s broken.</strong> Negative populations and 1,243-person households wouldn&rsquo;t error; domain sense caught them where statistics alone wouldn&rsquo;t.</li>
          <li><strong>Build a baseline, then earn every upgrade.</strong> We didn&rsquo;t jump to boosting — each upgrade answered a specific diagnosed weakness, so we can justify it, not just defend a score.</li>
          <li><strong>Regularization is insurance, not magic.</strong> With n ≫ p it tied OLS; we chose ridge anyway for stable, interpretable coefficients under multicollinearity.</li>
          <li><strong>Match the model to the data-generating process.</strong> The censored target needed a censored model — Tobit recovered the true income effect OLS attenuated by 18%.</li>
          <li><strong>The best model depends on the question.</strong> Gradient boosting for prediction, Tobit for inference, linear for transparency — and we can name each because we built the whole ladder.</li>
          <li><strong>Sanity-check the output.</strong> The model doesn&rsquo;t know prices can&rsquo;t be negative; you do. Clip before you ship.</li>
        </ul>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", margin: "1.6rem 0" }}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>You&rsquo;ve completed the California housing capstone</div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
            From framing and EDA through a regularized linear baseline, then three diagnostic-driven upgrades —
            spatial features (R² 0.69), a censored Tobit model (unbiased effects), and gradient boosting (R² 0.84) —
            to a justified final choice and sane, delivered predictions. Every number computed from the real data.
            This is what end-to-end data science actually looks like: not one model, but a reasoned progression you
            can defend at every step.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/model-selection" style={navLink}>← Final model selection</Link>
          <Link href="/learn/california-housing-capstone" style={navLink}>Back to overview →</Link>
        </div>
      </div>
    </article>
  );
}

const code = `import numpy as np

# identical preprocessing + spatial features on test, using TRAIN-fit transforms
test_df, _ = preprocess(test, medians=med)
X_test = add_spatial_features(test_df, kmeans=km_fit)   # reuse fitted regions
preds = final_gbm.predict(X_test)

print("mean:", preds.mean(), " min:", preds.min(), " max:", preds.max())
# -> mean 2.05 (≈ train 2.07), but min -1.42 and max 7.51 are impossible

preds = np.clip(preds, 0.15, 5.0)   # domain knowledge the model lacks`;

const codeLib = `import pandas as pd

submission = pd.DataFrame({
    "PropertyID": test["PropertyID"],
    "TargetPrice": np.clip(preds, 0.15, 5.0),   # never ship out-of-range predictions
})
submission.to_csv("predictions.csv", index=False)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
