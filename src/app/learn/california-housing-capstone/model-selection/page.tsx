import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { ModelLeaderboard, LearningCurveFig, ActualVsPredictedFig, CapZoneFig, SpatialCVFig } from "@/components/figures/CapstoneModelFigures";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "Capstone: final model selection — Manifold",
  description:
    "The full leaderboard — baseline, the linear family, polynomial ridge, the tree zoo, and a stacking ensemble at R² 0.858 — and choosing the final model on the criteria that matter: accuracy, the goal, interpretability, and robustness. With a learning curve, an actual-vs-predicted plot, and the cap-zone diagnostic.",
};

export default function ModelSelectionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: <>Decision &amp; delivery</>, color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>Final model selection</>}
        intro={<>
          Nine models, one decision. Selecting isn&rsquo;t just &ldquo;take the highest number&rdquo; — it&rsquo;s weighing accuracy
        against the goal, interpretability, robustness, and whether the model is even <em>done improving</em>. Let&rsquo;s
        lay the whole ladder out and choose deliberately.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Everything we built, side by side</h2>
        <div style={figWrap}>
          <ModelLeaderboard />
          <div style={cap}>The full journey, one honest 5-fold CV for all: baseline 0.00 → linear family 0.653 →
            spatial 0.672 → polynomial ridge 0.711 → the tree zoo 0.834–0.856 → the{" "}
            <strong>stacking ensemble at 0.858</strong>. Blue is linear, green is trees, violet is the ensemble.</div>
        </div>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Model", "CV R²", "RMSE", "Best for"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              <tr><td style={td}>Baseline (mean)</td><td style={td}>0.000</td><td style={td}>1.156</td><td style={td}>the reference</td></tr>
              <tr><td style={td}>Ridge (10 features)</td><td style={td}>0.653</td><td style={td}>0.681</td><td style={td}>interpretable baseline</td></tr>
              <tr><td style={td}>Ridge + spatial</td><td style={td}>0.672</td><td style={td}>0.662</td><td style={td}>+ geography, still linear</td></tr>
              <tr><td style={td}>Ridge + poly²</td><td style={td}>0.711</td><td style={td}>0.621</td><td style={td}>linear&rsquo;s real ceiling</td></tr>
              <tr><td style={td}>Tobit</td><td style={td}>~0.66</td><td style={td}>—</td><td style={td}><strong>inference</strong> (unbiased effects)</td></tr>
              <tr><td style={td}>Random forest</td><td style={td}>0.834</td><td style={td}>0.470</td><td style={td}>no-fuss strong default</td></tr>
              <tr><td style={td}>XGBoost</td><td style={td}>0.856</td><td style={td}>0.439</td><td style={td}>best single model</td></tr>
              <tr><td style={{ ...td, color: "var(--brand)", fontWeight: 600 }}>Stacking ensemble</td><td style={td}>0.858</td><td style={td}>0.435</td><td style={td}><strong>prediction</strong> (the deliverable)</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Is the winner actually trustworthy? Three checks</h2>
        <p>
          A leaderboard number isn&rsquo;t a decision. Before shipping the ensemble, a senior analyst asks three questions:
          is it <em>fit right</em> (not over- or under-fit), <em>where</em> does it still err, and is more data worth
          collecting? One plot answers each.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "1rem 0" }} className="elbow-grid">
          <div style={figWrap}><ActualVsPredictedFig /><div style={cap}>Actual vs predicted (out-of-fold). Points
            hug the diagonal across the whole range — no systematic bias. The flat line of dots at the top is the{" "}
            <strong>5.0 cap</strong>: true values pinned at the ceiling that the model can only approach.</div></div>
          <div style={figWrap}><LearningCurveFig /><div style={cap}>Learning curve. Training R² (gray) and
            validation R² (green) are still <strong>converging</strong> — the gap narrows as data grows and validation
            is inching up at 11k rows. Healthy fit; <strong>more data would still help</strong>.</div></div>
        </div>

        <p>
          The third check is the one EDA warned us about on day one — the censored target. Where does the error
          concentrate?
        </p>
        <CodeBlock fromScratch={capCode} withLibrary={capCode} />
        <CodeOutput>{`holdout RMSE by zone (LightGBM, 20% holdout)
  normal   (y < 4.5)   RMSE 0.398    n = 3069
  cap zone (y >= 4.5)  RMSE 0.911    n =  234   <- 2.3x worse`}</CodeOutput>
        <div style={figWrap}>
          <CapZoneFig />
          <div style={cap}>Even the best model is <strong>2.3× worse near the 5.0 ceiling</strong>. The trees fit
            high-value blocks far better than the linear model did, but censoring still bites — no learner can recover
            values the data never recorded. This is the one weakness no amount of model power fixes.</div>
        </div>

        <h2>How honest is that 0.858?</h2>
        <p>
          One more check separates a careful analyst from a careless one — and it&rsquo;s the most important on the page.
          Our whole leaderboard used <strong>random</strong> 5-fold CV: rows shuffled, then split. But housing is{" "}
          <strong>spatially autocorrelated</strong> — neighbouring blocks have almost identical prices. Under a random
          split, a block&rsquo;s next-door neighbours land in the <em>training</em> set, so the model isn&rsquo;t predicting a
          new place — it&rsquo;s half-remembering the one next door. That&rsquo;s a subtle form of leakage, and it inflates every
          score we&rsquo;ve reported.
        </p>
        <p>
          The fix is <strong>spatial cross-validation</strong>: cluster the blocks by location and hold out{" "}
          <em>whole regions</em> at a time, so the model must predict genuinely unseen geography.
        </p>
        <CodeBlock fromScratch={spatialCode} withLibrary={spatialCode} />
        <CodeOutput>{`same LightGBM, two ways of splitting
  random  KFold        R2 0.856
  spatial GroupKFold   R2 0.699   <- predicting unseen regions`}</CodeOutput>
        <div style={figWrap}>
          <SpatialCVFig />
          <div style={cap}>The same model drops from <strong>0.856 to 0.699</strong> when whole regions are held
            out. The ~0.16 gap is the price of spatial leakage — accuracy that came from memorising neighbourhoods,
            not from understanding what makes a place expensive.</div>
        </div>
        <div style={{ ...callout, background: "color-mix(in srgb, var(--warn) 9%, var(--surface))", borderColor: "color-mix(in srgb, var(--warn) 26%, var(--border))" }}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--warn)", marginBottom: 4 }}>
            Which number do you report?
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Both — with the question attached. If the deployment predicts blocks <em>interspersed</em> with known ones
            (as the held-out test set here is), <strong>0.858 is the right estimate</strong>. If it must predict a{" "}
            <em>new town</em> with no nearby training data, <strong>~0.70 is the honest one</strong>. Quoting 0.858
            for the second case isn&rsquo;t a better model — it&rsquo;s a leaked one. Knowing the difference is what makes the
            number trustworthy.
          </p>
        </div>

        <h2>The decision</h2>
        <DecisionPoint
          question={<>Nine models measured identically. The deliverable is predictions for 4,128 unseen blocks, for a valuation tool whose users will ask &ldquo;why?&rdquo;. Which do you ship?</>}
          options={[
            {
              label: "The stacking ensemble — highest CV score, R² 0.858",
              verdict: "best",
              response: <>For <em>this</em> deliverable — pure prediction, judged on accuracy — yes, with eyes open: the 0.002 edge over XGBoost costs three models to train and serve. We ship the ensemble as the headline and note XGBoost as the pragmatic production alternative. The point is you can defend the trade, not just the number.</>,
            },
            {
              label: "XGBoost alone — 99.8% of the accuracy, one model to maintain",
              verdict: "close",
              response: <>A completely defensible senior call, and for a long-lived production system it&rsquo;s arguably the <em>better</em> one — 0.856 vs 0.858 buys a third of the operational complexity. We treat it as the pragmatic alternative; the only reason it isn&rsquo;t the headline is that the stated task is scored on accuracy.</>,
            },
            {
              label: "Ridge + spatial — stakeholders want “why”, so ship the interpretable one",
              verdict: "close",
              response: <>Right instinct, wrong deliverable. Interpretability shaped the <em>journey</em> (the linear ladder is how we understand the data), and the Tobit coefficients answer the &ldquo;why&rdquo; questions on the side. But shipping 0.672 when 0.858 is available leaves half the remaining error on the table — explain with the linear family, predict with the ensemble.</>,
            },
          ]}
        />
        <p>
          The task is to <strong>predict</strong> test-block prices, so out-of-sample accuracy is the deciding
          criterion — and the <strong>stacking ensemble wins</strong> (R² 0.858), a hair above XGBoost alone (0.856).
          Here judgment enters: that 0.002 costs us three models to train and serve instead of one. For a
          competition leaderboard, ship the ensemble. For a production system that has to be maintained and debugged,
          <strong> XGBoost alone is the wiser pick</strong> — 99.8% of the gain at a third of the complexity. We&rsquo;ll
          carry the ensemble forward as the headline result and note XGBoost as the pragmatic alternative.
        </p>
        <p>But selection is contextual, and a senior analyst keeps the others for what they&rsquo;re best at:</p>
        <ul style={ul}>
          <li><strong>If the goal were explanation</strong> (&ldquo;how much does income drive price?&rdquo;), the{" "}
            <strong>Tobit linear model</strong> is the right deliverable — its unbiased, signed coefficients answer
            that; a booster&rsquo;s importances don&rsquo;t give calibrated effects.</li>
          <li><strong>If we needed a simple, auditable rule</strong> for a regulated setting, the{" "}
            <strong>polynomial ridge model</strong> trades ~15 points of R² for full transparency.</li>
          <li><strong>For a quick, robust default</strong> with near-zero tuning, the random forest is already 0.834.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>&ldquo;Best model&rdquo; depends on the question</>}>
          There is no single best model — there&rsquo;s the best model <em>for a stated objective and budget</em>. For
            raw prediction, it&rsquo;s the stacking ensemble; for a maintainable system, XGBoost; for inference, Tobit; for
            transparency, the linear model. We can name all four because we built the full ladder and measured every
            rung the same way. That&rsquo;s the value of a diagnostic-driven progression over jumping to the fanciest
            algorithm: you end up able to <em>justify</em> your choice, not just defend a score.
        </Callout>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/gradient-boosting", label: <>← Upgrade 3: the model zoo</> }} next={{ href: "/learn/california-housing-capstone/takeaways", label: <>Next up · Predictions &amp; takeaways →</> }} />
      </div>
    </article>
  );
}

const capCode = `# where does the error live? split the holdout by the censoring threshold
# (read off LightGBM — the ensemble's near-twin, and far faster to probe)
import numpy as np
pred = zoo["LightGBM"].fit(X_tr, y_tr).predict(X_ho)
for label, mask in [("normal  ", y_ho < 4.5), ("cap zone", y_ho >= 4.5)]:
    rmse = np.sqrt(((y_ho[mask] - pred[mask]) ** 2).mean())
    print(label, f"RMSE {rmse:.3f}   n = {mask.sum()}")`;

const spatialCode = `from sklearn.model_selection import KFold, GroupKFold, cross_val_predict
from sklearn.cluster import KMeans

# hold out whole geographic regions, not random rows
regions = KMeans(n_clusters=60, random_state=0).fit_predict(df[["Latitude", "Longitude"]])

p_random  = cross_val_predict(model, X, y, cv=KFold(5, shuffle=True, random_state=42))
p_spatial = cross_val_predict(model, X, y, cv=GroupKFold(5).split(X, y, regions))

print("random :", r2_score(y, p_random))    # 0.856
print("spatial:", r2_score(y, p_spatial))   # 0.699`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" };
const cap: React.CSSProperties = { fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 };
const th: React.CSSProperties = { textAlign: "left", padding: "7px 9px", borderBottom: "2px solid var(--border-strong)", color: "var(--muted)", fontWeight: 500, fontSize: 12 };
const td: React.CSSProperties = { padding: "7px 9px", borderBottom: "1px solid var(--border)", color: "var(--muted)", lineHeight: 1.4 };
