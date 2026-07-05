import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { CensoredZoneFig, LatentValueFig, ShapGlobalFig } from "@/components/figures/CapstoneBonusFigures";
import { ShapExplorerLab } from "@/components/labs/ShapExplorerLab";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Term } from "@/components/Term";

export const metadata = {
  title: "Capstone bonus: censored boosting & SHAP — Manifold",
  description:
    "The epilogue we promised: combining Upgrade 2 and Upgrade 3 by giving LightGBM a Tobit likelihood as its custom objective — cutting cap-zone error 7% and estimating what capped blocks are really worth — then answering the stakeholder's 'why?' with per-prediction SHAP explanations. Every number computed from the real data.",
};

export default function CensoredBoostingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "Bonus · Combining the upgrades", color: "var(--c-trees)" }]}
        time="about 12 minutes"
        title={<>Bonus · Censored boosting &amp; per-prediction SHAP</>}
        intro={<>
          The takeaways page listed &ldquo;combine the upgrades&rdquo; as future work. This page is that work, actually
        done: a LightGBM that carries the Tobit likelihood inside its objective — cap-awareness married to ensemble
        power — plus the per-prediction SHAP explanations that answer a stakeholder&rsquo;s &ldquo;why?&rdquo; for real.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The idea: a loss function is a plug-in part</h2>
        <p>
          The throughline of this whole site is that a supervised model is <em>a model form + a loss function + an
          optimiser</em> — and gradient boosting takes that literally. At each round it only asks the loss for two
          numbers per row: the gradient and the hessian of the loss with respect to the current prediction. Swap in
          any loss with those two derivatives and the machinery — leaf-wise trees, histogram splits, regularization —
          carries over untouched.
        </p>
        <p>
          So we take Upgrade 2&rsquo;s Tobit likelihood and hand it to Upgrade 3&rsquo;s best learner. Uncensored rows keep the
          usual squared-error pull toward <M>{String.raw`y_i`}</M>. Censored rows instead push the prediction to put
          probability mass <em>above</em> the cap:
        </p>
        <MathBlock>{String.raw`\frac{\partial \mathcal{L}_i}{\partial F} =
\begin{cases}
\dfrac{F - y_i}{\sigma^2} & y_i < 5 \\[10pt]
-\dfrac{1}{\sigma}\,\dfrac{\phi(z)}{\Phi(z)}, \quad z = \dfrac{F - 5}{\sigma} & y_i = 5
\end{cases}`}</MathBlock>
        <p>
          The censored branch is always negative — it only ever pushes predictions <em>up</em>, and pushes harder the
          further the prediction sits below the cap. That&rsquo;s the Tobit insight (&ldquo;5.0 means <em>at least</em> 5.0&rdquo;)
          expressed as a gradient instead of a coefficient correction. In LightGBM this is ~10 lines: a custom{" "}
          <code>objective</code> returning <code>(grad, hess)</code>.
        </p>

        <CodeBlock fromScratch={objCode} withLibrary={objCode} />

        <h2>Measured the only fair way: the same 5-fold CV</h2>
        <GuessSlider
          prompt={<>Plain LightGBM scores CV R² 0.855 on the zoo page. The censored objective knows about the cap — where does it land on the same clipped test data?</>}
          min={0.8}
          max={0.9}
          step={0.001}
          start={0.87}
          actual={0.855}
          decimals={3}
          reveal={<>A dead tie: <strong>0.855, RMSE 0.440 — identical to the digit</strong>. If you expected a jump, revisit the Tobit page&rsquo;s warning — the test data is censored too, so the usual metric structurally <em>cannot</em> reward cap-awareness. The payoff lives somewhere the headline number doesn&rsquo;t look, which is exactly where we look next.</>}
          accent="var(--c-trees)"
        />
        <CodeOutput>{`5-fold CV  (same folds as the zoo, seed 42; preds clipped to 5.0)
  plain LightGBM               R2 0.855   RMSE 0.440
  censored LGBM  sigma=0.4     R2 0.855   RMSE 0.440   <- exact tie
  censored LGBM  sigma=0.5     R2 0.854   RMSE 0.442
  censored LGBM  sigma=0.6     R2 0.853   RMSE 0.443`}</CodeOutput>
        <p>
          The result barely moves across a 50% swing in <M>{String.raw`\sigma`}</M> — one less hyperparameter to
          agonise over — and the headline is a tie. That&rsquo;s the Tobit lesson repeating at ensemble scale:{" "}
          <strong>a metric computed on censored data can&rsquo;t see the fix for censoring.</strong> So we judge the
          model where the censoring actually bites — the cap zone.
        </p>

        <h2>Where it pays: the cap zone</h2>
        <p>
          Model selection flagged this as the one weakness no model power fixed: the best model was 2.3× worse on
          blocks near the ceiling — holdout RMSE 0.911 in the cap zone against 0.398 elsewhere. Same holdout, same
          split, plain vs censored objective:
        </p>
        <CodeBlock fromScratch={zoneCode} withLibrary={zoneCode} />
        <CodeOutput>{`holdout RMSE by zone (20% holdout, seed 42 — the model-selection split)
                      plain     censored
  normal   (y < 4.5)  0.398     0.407      <- small tax
  cap zone (y >= 4.5) 0.911     0.848      <- 7% better where it hurts

mean error on cap-zone blocks:  plain -0.556   censored -0.439`}</CodeOutput>
        <div style={figWrap}>
          <CensoredZoneFig />
          <div style={cap}>The trade in one picture: the censored objective pays ~0.009 RMSE on the 3,069 normal
            blocks to cut cap-zone error <strong>0.911 → 0.848</strong> and shrink the systematic under-prediction
            bias from −0.56 to −0.44. It&rsquo;s not magic — nothing recovers values the data never recorded — but it&rsquo;s
            the first upgrade that moved this number at all.</div>
        </div>
        <p>
          And the censored model produces something the plain one structurally cannot: an <em>uncapped</em> estimate.
          Its raw (latent) predictions for the 173 capped holdout blocks average <strong>5.12</strong> and reach{" "}
          <strong>7.09</strong> — it&rsquo;s telling us those &ldquo;5.0&rdquo; neighbourhoods are really $510k–$710k territory. The
          plain model, trained to reproduce the recorded 5.0s, averages 4.53 on the same blocks — <em>below</em> the
          cap it&rsquo;s aiming at.
        </p>
        <div style={figWrap}>
          <LatentValueFig />
          <div style={cap}>Mean prediction for the capped holdout blocks. The plain model (gray) can only chase the
            recorded ceiling from below. The censored model&rsquo;s latent scale (pink) estimates what the cap hid —{" "}
            <strong>58% of its capped-block predictions land above 5.0</strong>, which is what &ldquo;the model knows 5.0
            means at least 5.0&rdquo; looks like in production.</div>
        </div>

        <Callout color="var(--c-regression)" title={<>Which one ships?</>}>
          It depends on the deliverable — as always. For the test-set submission scored against <em>clipped</em>{" "}
            prices, the two are indistinguishable, so the simpler plain objective wins. But for a real valuation tool —
            where the expensive tail is precisely where lawsuits live, and where &ldquo;this block is worth <em>more than</em>{" "}
            the cap&rdquo; is actionable information — the censored objective is the better product. One model, both
            upgrades, and the choice between them is a business question, not a leaderboard one.
        </Callout>

        <h2>The stakeholder&rsquo;s question, answered for real</h2>
        <p>
          The interview self-test asked: <em>&ldquo;a stakeholder asks why their block was priced at 4.2 — what do you
          say?&rdquo;</em> The honest answer is a per-prediction{" "}
          <Term def={<>SHapley Additive exPlanations. Borrowed from game theory: treat each feature as a &ldquo;player&rdquo; and split the prediction among them fairly — each feature&rsquo;s SHAP value is its fair share of the gap between the average prediction and this one, accounting for every order it could have joined in.</>}>SHAP</Term>{" "}
          explanation: for one block, SHAP splits the gap between the{" "}
          <Term def={<>The model&rsquo;s average prediction over the background data — here 2.07 ($207k). Every explanation starts from this value; SHAP values explain the journey from &ldquo;typical block&rdquo; to &ldquo;this block.&rdquo;</>}>base value</Term>{" "}
          (2.07) and <em>this</em> prediction into{" "}
          <Term def={<>&ldquo;Additive&rdquo; is a guarantee, not a metaphor: base value + the sum of all feature contributions equals the model&rsquo;s output exactly, to the last decimal. If the sums don&rsquo;t match, something is broken.</>}>additive contributions</Term>,
          one per feature, that provably sum to the output — computed here with{" "}
          <Term def={<>The exact, fast SHAP algorithm for tree ensembles (LightGBM, XGBoost, random forests). Polynomial-time instead of exponential, and exact rather than sampled — which is why SHAP took over the gradient-boosting world.</>}>TreeExplainer</Term>.
          First, the global view — averaged over the whole holdout, it independently confirms what permutation
          importance said:
        </p>
        <CodeBlock fromScratch={shapCode} withLibrary={shapCode} />
        <div style={figWrap}>
          <ShapGlobalFig />
          <div style={cap}>Mean |SHAP value| across 3,303 holdout blocks. Income and{" "}
            <strong>dist_coast are essentially tied at the top</strong>, and the green geography features —
            coast, coordinates, metro distances — collectively dominate, the same verdict as the zoo page&rsquo;s
            permutation importance but now in the target&rsquo;s own units: dist_coast moves a typical prediction
            by $33k.</div>
        </div>
        <p>
          Now the block itself — a peninsula block just south of San Francisco that the model prices at{" "}
          <strong>4.20</strong> (there&rsquo;s our stakeholder&rsquo;s 4.2). Instead of handing you the finished
          waterfall, build it: every value below is the real TreeExplainer output for these real blocks.
        </p>

        <PredictPrompt
          prompt={<>For the coastal block, which single feature will contribute the most to pushing the price from $207k to $420k?</>}
          options={["Income — it always dominates", "Some geography feature", "Rooms per household"]}
          nudge={<>Locked in. Step through the waterfall below one feature at a time and watch the running total.</>}
        />

        <LabFrame
          tryThis={<>Step through the coastal block one feature at a time, watching the running total walk from 2.07 to 4.20. Then switch to the capped case and do it again — slowly.</>}
          insight={<>On the coastal block, geography does the heavy lifting — longitude (+$56k), distance to water
            (+$31k), distance to SF (+$22k) — while income adds a modest +$27k. On the inland block the same
            arithmetic runs the other way: dist_coast alone subtracts $69k. And the capped case is the important one:
            SHAP walks you calmly through reasoning that is <em>wrong</em> — income 2.7 pulls down, nothing pushes
            hard — for a 63-person block the model has no way to read. <strong>SHAP explains the model, not the
            world.</strong></>}
        >
          <ShapExplorerLab />
        </LabFrame>

        <p>
          That capped case is the most important of the three. An explanation tool makes a model&rsquo;s reasoning
          legible — including when the reasoning is bad. If you only ever run SHAP on predictions that look right,
          you&rsquo;re using it as decoration; running it on the worst residuals is how it earns its keep, turning
          &ldquo;the model missed&rdquo; into &ldquo;the model leaned on income for a block too small to trust.&rdquo;
        </p>

        <Callout color="var(--c-regression)" title={<>What this epilogue actually taught</>}>
          Two things, and neither is a score. First: the components of this capstone <em>compose</em> — the Tobit
            likelihood from Upgrade 2 dropped straight into the booster from Upgrade 3, because losses are plug-in
            parts. Once you see models as form + loss + optimiser, &ldquo;combine the upgrades&rdquo; stops being research and
            becomes an afternoon. Second: interpretation is per-prediction now. Global importances defend the model in
            aggregate; the waterfall defends <em>one number to one stakeholder</em> — and exposes the model honestly
            when it&rsquo;s wrong. Those are the two moves that turn a finished project into a maintained product.
        </Callout>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/takeaways", label: <>← Predictions &amp; takeaways</> }} next={{ href: "/learn/california-housing-capstone", label: <>Back to overview →</> }} />
      </div>
    </article>
  );
}

const objCode = `import numpy as np
from scipy.stats import norm
from lightgbm import LGBMRegressor

U, SIGMA = 5.0, 0.4                       # cap and latent noise scale

def tobit_objective(y_true, y_pred):
    cens = y_true >= 4.9999
    # uncensored rows: ordinary squared-error pull
    g_obs = (y_pred - y_true) / SIGMA**2
    h_obs = np.full_like(y_pred, 1 / SIGMA**2)
    # censored rows: L = -log P(latent > U)  ->  only ever pushes UP
    z = (y_pred - U) / SIGMA
    lam = np.exp(norm.logpdf(z) - norm.logcdf(z))    # inverse Mills ratio
    g_cen = -lam / SIGMA
    h_cen = np.clip(lam * (lam + z) / SIGMA**2, 1e-6, None)
    return np.where(cens, g_cen, g_obs), np.where(cens, h_cen, h_obs)

model = LGBMRegressor(objective=tobit_objective,     # <- the whole trick
                      n_estimators=1200, learning_rate=0.03, num_leaves=63,
                      subsample=0.8, colsample_bytree=0.8, reg_lambda=1.0,
                      random_state=42)`;

const zoneCode = `# same protocol as model selection: score by zone, plain vs censored
for name, pred in [("plain", pred_plain), ("censored", np.minimum(latent, U))]:
    for label, mask in [("normal  ", y_ho < 4.5), ("cap zone", y_ho >= 4.5)]:
        rmse = np.sqrt(((y_ho[mask] - pred[mask]) ** 2).mean())
        print(name, label, f"RMSE {rmse:.3f}")

# and the thing only the censored model can say:
capped = y_ho >= 4.9999
print("latent value of capped blocks:", latent[capped].mean())   # 5.12`;

const shapCode = `import shap

explainer = shap.TreeExplainer(lgbm.fit(X_tr, y_tr))
sv = explainer.shap_values(X_ho)          # (3303, 16): one number per feature per block

print("base value:", explainer.expected_value)        # 2.067 — the average prediction
print("mean |SHAP|:", np.abs(sv).mean(0).round(3))    # global importance, in $100k

# one block, one answer: contributions sum exactly to the prediction
i = coastal_block_index
print(X_ho.iloc[i], sv[i], sv[i].sum() + explainer.expected_value)  # = 4.199`;

const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, margin: "1.2rem 0" };
const cap: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 };
