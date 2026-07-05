import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { ModelLeaderboard, PermImportanceFig, PdpFig, LEADERBOARD } from "@/components/figures/CapstoneModelFigures";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { GuessSlider } from "@/components/capstone/GuessSlider";

export const metadata = {
  title: "Capstone: the model zoo — Manifold",
  description:
    "Upgrade 3: stop hand-engineering and let stronger learners find the structure themselves. We run the full zoo — random forest, HistGradientBoosting, XGBoost, LightGBM, and a stacking ensemble — with honest 5-fold CV, lifting R² from 0.65 to 0.858. Real code, real outputs, real plots.",
};

// trees-only slice for the in-page comparison
const TREE_ROWS = LEADERBOARD.filter((r) => r.kind === "tree" || r.kind === "win");

export default function ModelZooPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "Upgrade 3 · The model zoo", color: "var(--c-trees)" }]}
        time="about 14 minutes"
        title={<>Beyond linear — the model zoo</>}
        intro={<>
          We squeezed the linear model as far as it goes. Now we stop hand-engineering structure and let stronger
        learners <em>find</em> it. This is the open-ended part of any real project — try the zoo, measure honestly,
        keep what wins. The payoff is the project&rsquo;s biggest jump: R² from <strong>0.65 to 0.858</strong>.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>First: how far can the linear model stretch?</h2>
        <p>
          Before reaching for trees, it&rsquo;s worth knowing the real ceiling of the linear family — otherwise we can&rsquo;t
          say a complex model <em>earned</em> its keep. The spatial features from Upgrade 1 nudged ridge to 0.672.
          The last lever a linear model has is to manufacture non-linearity by hand: square every feature and add
          pairwise products, then let ridge sort them out.
        </p>
        <CodeBlock fromScratch={polyCode} withLibrary={polyCode} />
        <CodeOutput>{`5-fold CV  (full features, seed 42)
  Ridge + spatial            R2 0.672   RMSE 0.662
  Ridge + spatial + poly²    R2 0.711   RMSE 0.621`}</CodeOutput>
        <p>
          Polynomial expansion buys a real 0.05 — the income×geography interactions matter, exactly as the residual
          map suggested. But 78 hand-built terms to reach <strong>0.71</strong> is a lot of work for a model that&rsquo;s
          still guessing the <em>shape</em> of every interaction. A tree learns those shapes for free.
        </p>

        <h2>The contenders</h2>
        <p>
          Four tree-based learners, in rough order of sophistication. They all split the data into regions and
          predict a constant in each, so they capture non-linearity and interactions automatically — and they need
          no scaling or log-transforms, because splits only care about <em>order</em>, not magnitude.
        </p>
        <ul style={ul}>
          <li><strong>Random forest</strong> — hundreds of deep trees on bootstrapped samples, averaged. Variance
            reduction by voting; a strong, no-fuss baseline.</li>
          <li><strong>HistGradientBoosting</strong> — sklearn&rsquo;s histogram-binned boosting. Builds shallow trees in
            sequence, each correcting the last. Fast and excellent out of the box.</li>
          <li><strong>XGBoost &amp; LightGBM</strong> — the two libraries that win most tabular competitions.
            Regularized gradient boosting with smarter split-finding (XGBoost level-wise, LightGBM leaf-wise).</li>
        </ul>

        <h2>Run the whole zoo, judged the same way</h2>
        <p>
          The discipline that makes this trustworthy: <strong>identical 5-fold CV for every model</strong>, the same
          splits, the same metric. No peeking, no per-model holdout shopping. One function, looped over a list.
        </p>
        <GuessSlider
          prompt={<>The best linear model tops out at R² 0.711 after heavy feature engineering. A plain random forest, no feature engineering at all — where does it land?</>}
          min={0.6}
          max={1}
          step={0.005}
          start={0.75}
          actual={0.834}
          decimals={3}
          reveal={<>The no-fuss random forest hits <strong>R² 0.834</strong> — a 12-point leap past the linear ceiling, with zero hand-built features. The trees carve the geographic price surface on their own. The boosters go higher still; the output below judges them all with the same 5-fold CV.</>}
          accent="var(--c-trees)"
        />
        <CodeBlock fromScratch={zooCode} withLibrary={zooCode} />
        <CodeOutput>{`5-fold CV  (R2, RMSE in $100k)        seed 42
  RandomForest             R2 0.834   RMSE 0.470
  HistGradientBoosting     R2 0.846   RMSE 0.454
  LightGBM                 R2 0.855   RMSE 0.440
  XGBoost                  R2 0.856   RMSE 0.439   <- best single model
elapsed: 41.2s`}</CodeOutput>
        <p>
          Every tree model lands in the mid-0.80s — a <strong>20-point R² leap</strong> over the best linear model,
          and a ~30% cut in RMSE. XGBoost edges out LightGBM by a whisker; both clear HistGradientBoosting, which
          itself beats the random forest. The gap between the worst tree and the best linear model is far larger
          than the gaps among the trees — the message is &ldquo;use a tree,&rdquo; and only secondarily &ldquo;which one.&rdquo;
        </p>

        <h2>Can we do better than any single model? Stacking</h2>
        <p>
          The three boosters make <em>different</em> mistakes. When strong models disagree, averaging their
          predictions usually beats all of them — and a <strong>stacking ensemble</strong> does better than a plain
          average: it trains a small ridge meta-model to learn the best weighted blend, using out-of-fold
          predictions so it never cheats.
        </p>
        <CodeBlock fromScratch={stackCode} withLibrary={stackCode} />
        <CodeOutput>{`5-fold CV  Stacking(XGB + LightGBM + HistGB) -> RidgeCV
  R2 0.858   RMSE 0.435   MAE 0.280   <- best overall`}</CodeOutput>
        <div style={figWrap}>
          <ModelLeaderboard rows={TREE_ROWS} />
          <div style={cap}>The zoo, same CV for all. Random forest 0.834 → boosting 0.846–0.856 → the{" "}
            <strong>stacking ensemble at 0.858</strong> tops every individual learner. The meta-model wrings a last
            ~0.2 point out of their disagreements — small but free.</div>
        </div>

        <h2>What did the winner actually learn?</h2>
        <p>
          A high score you can&rsquo;t explain is a liability. Trees aren&rsquo;t a black box here: permutation importance
          ranks <em>what</em> matters, and partial dependence shows the <em>shape</em> of each effect. We read them
          off the LightGBM model (near-identical to the ensemble, and faster to interrogate).
        </p>
        <CodeBlock fromScratch={explainCode} withLibrary={explainCode} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "1rem 0" }} className="elbow-grid">
          <div style={figWrap}><PermImportanceFig /><div style={cap}>Permutation importance. Income leads, but the
            <strong> green geography features — dist_coast, latitude, longitude — collectively dominate</strong>.
            Our engineered <code>dist_coast</code> is the #2 feature in the whole model, vindicating Upgrade 1.</div></div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={figWrap}><PdpFig which="income" /><div style={cap}>Partial dependence of income — not a line.
              Flat for poor blocks, then <strong>accelerating</strong> for rich ones. The linear model averaged this
              curve into a single slope.</div></div>
            <div style={figWrap}><PdpFig which="coast" /><div style={cap}>Distance to coast: a steep premium right at
              the water that <strong>decays sharply</strong> inland — a non-linear cliff no coefficient can express.</div></div>
          </div>
        </div>

        <Callout color="var(--c-regression)" title={<>The payoff of the whole arc</>}>
          This jump validates the diagnostic-driven approach. We didn&rsquo;t reach for boosting first and hope — we
            <em> earned</em> it by showing the linear model&rsquo;s residuals held non-linear, interacting structure that
            even dozens of polynomial terms only half-captured, then chose the tools built for exactly that. And we didn&rsquo;t
            stop at one: running the whole zoo under identical CV, then stacking the best three, is how you find the
            real ceiling instead of trusting the first model that looked good. The importances and PDPs confirm the
            winner learned the <em>real</em> story — geography and non-linear income — not an artifact.
        </Callout>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/censored-regression", label: <>← Upgrade 2: Tobit</> }} next={{ href: "/learn/california-housing-capstone/model-selection", label: <>Next up · Final model selection →</> }} />
      </div>
    </article>
  );
}

const polyCode = `from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.linear_model import RidgeCV
from sklearn.pipeline import make_pipeline

# X_spatial = cleaned features + dist_coast / dist_sf / dist_la from Upgrade 1
poly_ridge = make_pipeline(
    StandardScaler(),
    PolynomialFeatures(degree=2, include_bias=False),   # squares + all pairwise products
    RidgeCV(alphas=np.logspace(-3, 3, 40)))

print("poly ridge :", evaluate(poly_ridge, X_spatial))   # R2 0.711`;

const zooCode = `from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.model_selection import cross_val_predict, KFold
from sklearn.metrics import r2_score, mean_squared_error
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor

cv = KFold(5, shuffle=True, random_state=42)
def evaluate(model, X):
    pred = cross_val_predict(model, X, y, cv=cv, n_jobs=-1)
    rmse = mean_squared_error(y, pred) ** 0.5
    return round(r2_score(y, pred), 3), round(rmse, 3)

zoo = {
  "RandomForest":         RandomForestRegressor(n_estimators=300, max_features=0.5,
                              min_samples_leaf=2, n_jobs=-1, random_state=42),
  "HistGradientBoosting": HistGradientBoostingRegressor(max_iter=600, learning_rate=0.05,
                              max_leaf_nodes=31, l2_regularization=1.0, random_state=42),
  "XGBoost":              XGBRegressor(n_estimators=900, learning_rate=0.03, max_depth=6,
                              subsample=0.8, colsample_bytree=0.8, min_child_weight=3,
                              reg_lambda=1.0, n_jobs=-1, random_state=42),
  "LightGBM":             LGBMRegressor(n_estimators=1200, learning_rate=0.03, num_leaves=63,
                              subsample=0.8, colsample_bytree=0.8, reg_lambda=1.0,
                              n_jobs=-1, random_state=42),
}
for name, model in zoo.items():
    print(f"{name:22s}", evaluate(model, X_full))   # trees: no scaling needed`;

const stackCode = `from sklearn.ensemble import StackingRegressor
from sklearn.linear_model import RidgeCV

stack = StackingRegressor(
    estimators=[("xgb", zoo["XGBoost"]),
                ("lgbm", zoo["LightGBM"]),
                ("hgb", zoo["HistGradientBoosting"])],
    final_estimator=RidgeCV(),        # learns the best blend of the three
    cv=cv, n_jobs=-1)                  # out-of-fold preds -> no leakage

print("Stacking :", evaluate(stack, X_full))   # R2 0.858  RMSE 0.435`;

const explainCode = `from sklearn.inspection import permutation_importance, PartialDependenceDisplay
import matplotlib.pyplot as plt

best = zoo["LightGBM"].fit(X_tr, y_tr)
pi = permutation_importance(best, X_ho, y_ho, n_repeats=8, random_state=42, n_jobs=-1)

order = pi.importances_mean.argsort()[::-1]
plt.barh([X_full.columns[i] for i in order][::-1],
         pi.importances_mean[order][::-1])
plt.xlabel("drop in R² when shuffled"); plt.tight_layout(); plt.show()

PartialDependenceDisplay.from_estimator(best, X_ho, ["IncomeLevel", "dist_coast"])
plt.show()`;

const figWrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, margin: "1.2rem 0" };
const cap: React.CSSProperties = { fontSize: 11.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 };
const ul: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.75 };
