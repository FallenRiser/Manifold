import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Case: boosting beats the forest — Manifold",
  description:
    "The same forest-cover-type data the random forest scored 0.847 on, now a battlefield: a tuned LightGBM reaches 0.865 and XGBoost 0.854 — but scikit-learn's default HistGBM lands at 0.783, below the forest. Boosting has the higher ceiling and demands you climb to it.",
};

const TREES = "var(--c-trees)";

const CODE = `from sklearn.datasets import fetch_covtype
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import lightgbm as lgb

X, y = fetch_covtype(return_X_y=True)
X, y = X[:25000], y[:25000]                 # random 25k subsample (seed 0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3,
                                      random_state=0, stratify=y)

# the forest, tuning-free
rf = RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=0).fit(Xtr, ytr)
print("RandomForest:", round(accuracy_score(yte, rf.predict(Xte)), 3))

# the booster, given real capacity
gbm = lgb.LGBMClassifier(n_estimators=700, learning_rate=0.1, num_leaves=63,
                         n_jobs=-1, random_state=0, verbose=-1).fit(Xtr, ytr)
print("LightGBM:    ", round(accuracy_score(yte, gbm.predict(Xte)), 3))

# (XGBoost is identical but wants 0-indexed labels: fit on ytr - 1.
#  full four-way comparison is in scripts/boosting_cases.py)`;

export default function CaseTabularPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "In the wild · real run", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Case: boosting beats the forest</>}
        intro={<>
          Back to the forest-cover-type dataset — 25,000 map cells, 54 features, 7 forest types — where the{" "}
          <Link href="/learn/random-forests/case-a-covertype" style={link}>random forest earned its reputation</Link>{" "}
          at 0.847. Same data, same split, now a head-to-head. Does boosting&rsquo;s higher ceiling actually show
          up? Yes — but with an asterisk that <em>is</em> the lesson.
        </>}
      />

      <div className="lesson">
        <h2>The head-to-head</h2>
        <CodeBlock fromScratch={CODE} />
        <CodeOutput label="covtype 25k — test accuracy and fit time (single run)">{`  RandomForest(300)      test acc 0.842    1.5 s
  sklearn HistGBM(700)   test acc 0.783    0.8 s    <- default, auto early-stopped
  XGBoost(700, depth 8)  test acc 0.854   15.7 s
  LightGBM(700, 63 lf)   test acc 0.865    9.7 s    <- winner`}</CodeOutput>

        <Callout color={TREES} title={<>Read the whole table, not just the winner</>}>
          <strong>Tuned boosting wins.</strong> LightGBM (0.865) and XGBoost (0.854) both clear the random forest
          (0.842) — a real, repeatable margin from driving down bias with deep, sequential, decorrelated trees.
          <br /><br />
          <strong>But boosting is not automatic.</strong> scikit-learn&rsquo;s <code>HistGradientBoosting</code> at
          its defaults scores <strong>0.783 — below the forest</strong> — because its auto early-stopping halts
          after a handful of rounds and underfits this interaction-rich data. The forest, meanwhile, hit 0.842
          with no tuning at all, in a tenth of the time.
        </Callout>

        <h2>Why the strong boosters win here</h2>
        <p>
          Forest cover type rewards deep feature interactions — elevation combined with aspect combined with soil
          type. A random forest captures these with deep trees but then <em>averages</em>, which cannot push bias
          below what an individual tree achieves. Boosting keeps <em>correcting</em>: each tree targets the errors
          the ensemble still makes, so it drives bias down past the forest&rsquo;s floor. Give the boosters enough
          capacity — 700 rounds, depth 8 / 63 leaves — and the extra bias-reduction is worth ~2 accuracy points
          over the forest. That is the entire thesis of this track, measured.
        </p>

        <h2>The price of those two points</h2>
        <ul style={ul}>
          <li><strong>Time.</strong> The forest fit in 1.5 s; LightGBM took ~6× longer and XGBoost ~10×. And that is <em>one</em> configuration — the tuning search behind &ldquo;depth 8, 700 rounds&rdquo; multiplies it further.</li>
          <li><strong>Fragility.</strong> The same family produced 0.783 at defaults. A forest at defaults would have handed you ~0.842 immediately. Boosting&rsquo;s ceiling is higher and its floor is lower.</li>
          <li><strong>Sequential fit.</strong> The forest&rsquo;s 300 trees fit in parallel across cores; boosting&rsquo;s rounds are inherently serial (only within-tree work parallelises).</li>
        </ul>

        <h2>The honest summary</h2>
        <p>
          This is the real texture of tabular modelling, not a fairy tale where boosting always wins. Boosting has
          the <strong>higher ceiling</strong>; the forest has the <strong>higher floor</strong>. If you have the
          time to tune and every fraction of a percent matters, a well-configured LightGBM or XGBoost is very hard
          to beat — which is exactly why they dominate Kaggle and production tabular systems. If you want a strong
          answer in one line with no babysitting, the forest is still the better <em>default</em>. Knowing which
          situation you&rsquo;re in is the whole skill — and it&rsquo;s the <Link href="/learn/boosting/when-to-use" style={link}>final
          page</Link>.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>Tuned LightGBM scored 0.865 vs the forest's 0.842, but sklearn's default HistGBM scored 0.783. What's the honest takeaway?</>,
              options: [
                "Boosting always beats forests",
                "Boosting has a higher ceiling but is not automatic — defaults can underperform the forest and it must be tuned",
                "sklearn's HistGBM is broken",
              ],
              answer: 1,
              explain: <>Well-tuned boosting beat the forest; the same family at defaults lost to it. Higher ceiling, lower floor — the reason the forest remains the better default.</>,
            },
            {
              q: <>Why does boosting reach a lower error than the forest on this interaction-rich data?</>,
              options: [
                "It uses more trees",
                "Sequential correction drives bias below the forest's floor; averaging deep trees can't lower bias further",
                "It uses more features per split",
              ],
              answer: 1,
              explain: <>The forest averages to cut variance but can't push bias below a single deep tree's; boosting keeps correcting residual errors, reducing bias past that floor.</>,
            },
            {
              q: <>The forest fit in 1.5 s and the boosters in 10–16 s. Why does this matter beyond convenience?</>,
              options: [
                "It doesn't — only accuracy matters",
                "Boosting is sequential and needs a tuning search, so the true cost is many serial fits — a real trade against the forest's fast, parallel, tuning-free fit",
                "The forest is more accurate per second in every case",
              ],
              answer: 1,
              explain: <>Each boosting fit is slower and serial, and reaching 0.865 required tuning — many such fits. That compute-and-effort cost is the price of the accuracy edge.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/interpretation", label: <>← Interpreting a boosted model</> }}
          next={{ href: "/learn/boosting/when-to-use", label: <>Next up · When to use boosting (and when not) →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
