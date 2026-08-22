import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Case: prediction intervals on housing — Manifold",
  description:
    "A regression forest on California housing, end to end: it lifts a single tree's R² from 0.673 to 0.795, checks itself with out-of-bag error, and reports 80% prediction intervals that cover ~84% of held-out homes.",
};

const TREES = "var(--c-trees)";

const CODE = `import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

X, y = fetch_california_housing(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)

rf = RandomForestRegressor(n_estimators=300, oob_score=True,
                           n_jobs=-1, random_state=0).fit(X_tr, y_tr)
print("test R2:", round(rf.score(X_te, y_te), 3), " OOB R2:", round(rf.oob_score_, 3))

# 80% prediction interval from the spread of the individual trees
per_tree = np.stack([t.predict(X_te) for t in rf.estimators_], axis=1)
lo, hi = np.percentile(per_tree, [10, 90], axis=1)
print("80% coverage:", round(np.mean((y_te >= lo) & (y_te <= hi)), 3),
      " mean width:", round((hi - lo).mean(), 3))`;

export default function IntervalsCasePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "In the wild · real run", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Case: prediction intervals on housing</>}
        intro={<>
          The <Link href="/learn/random-forests/case-a-covertype" style={link}>covertype case</Link> showed a
          forest winning a classification leaderboard. This one closes the track on the regression side: the
          same California housing data as the decision-tree case, now with a forest that predicts a <em>range</em>,
          not just a number. Every figure is from <code>scripts/forest_cases.py</code>.
        </>}
      />

      <div className="lesson">
        <h2>One model, three deliverables</h2>
        <CodeBlock fromScratch={CODE} />
        <CodeOutput label="output">{`test R2: 0.795   OOB R2: 0.807
80% coverage: 0.839   mean width: 1.147`}</CodeOutput>

        <p>Read that output as the whole track in miniature:</p>
        <ul style={ul}>
          <li><strong>The accuracy lift.</strong> The single tuned tree from the last track managed R² 0.673.
            The forest, changing nothing but averaging 300 decorrelated trees, reaches <strong>0.795</strong> —
            a large, free gain from variance reduction alone.</li>
          <li><strong>The free self-check.</strong> The <Link href="/learn/random-forests/out-of-bag-error" style={link}>out-of-bag</Link>
            R² (<strong>0.807</strong>) lands right beside the test R², estimated from the training data alone —
            no held-out set spent.</li>
          <li><strong>The honest uncertainty.</strong> An 80% <Link href="/learn/random-forests/quantile-regression-forests" style={link}>prediction
            interval</Link> built from the spread of the trees covers <strong>83.9%</strong> of held-out homes —
            close to nominal, slightly conservative — with a mean width of about $115k. Each home gets its own
            interval, wider where the block is unusual.</li>
        </ul>

        <Callout color={TREES} title={<>The one thing the forest still can&rsquo;t do</>}>
          Its predictions still cap at ~$500k, the dataset&rsquo;s ceiling — a forest of trees{" "}
          <Link href="/learn/random-forests/limits-of-forests" style={link}>cannot extrapolate</Link> past its
          training range, exactly like the single tree. For median house value that&rsquo;s harmless; for an
          open-ended target it would be disqualifying. The forest fixed the variance and gave you intervals; it
          did not repeal the staircase&rsquo;s flat ceiling.
        </Callout>

        <h2>Where the family goes next</h2>
        <p>
          Between the two cases you&rsquo;ve now seen a random forest do the three things it&rsquo;s famous for:
          win a multiclass classification task out of the box, lift a regression baseline for free, and quantify
          its own uncertainty. It earned its reputation as <em>the</em> default tabular model — the thing to
          try first when you don&rsquo;t yet know what will work.
        </p>
        <p>
          The one place it&rsquo;s routinely beaten is the leaderboard&rsquo;s very top, by its sibling:{" "}
          <strong>gradient boosting</strong>, which grows trees <em>sequentially</em>, each correcting the
          last, to attack bias rather than variance. That&rsquo;s the next track in the{" "}
          <Link href="/map" style={link}>Trees &amp; ensembles</Link> family.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>The forest reached R² 0.795 versus the single tree's 0.673, with no new features. Where did the gain come from?</>,
              options: [
                "Lower bias from deeper trees",
                "Variance reduction — averaging many decorrelated trees cancels their independent errors",
                "A better split criterion",
              ],
              answer: 1,
              explain: <>Each tree is still low-bias and high-variance; averaging decorrelated trees drives the variance down while leaving bias alone, so the ensemble beats any single tree.</>,
            },
            {
              q: <>OOB R² was 0.807, close to the 0.795 test R². Why is that useful?</>,
              options: [
                "It proves the model is overfitting",
                "It's a generalisation estimate from the training data alone — no separate validation set needed",
                "It's always higher than the test score",
              ],
              answer: 1,
              explain: <>Each row is scored by the ~37% of trees that didn't train on it, giving a near-CV estimate for free. Its closeness to the test score is a quick sanity check.</>,
            },
            {
              q: <>The 80% prediction interval covered ~84% of test homes. How was it built?</>,
              options: [
                "From a single global ±σ error bar",
                "From the spread of the individual trees' predictions — a per-point, data-driven interval",
                "By assuming a normal distribution",
              ],
              answer: 1,
              explain: <>Pooling the trees' predictions (or leaf targets) gives an empirical distribution per point, so each home gets its own interval — wider where the block is unusual, with no distributional assumption.</>,
            },
            {
              q: <>Why did every prediction stay below ~$500k?</>,
              options: [
                "A bug",
                "No extrapolation — a forest averages leaf means, which are bounded by the training targets (capped at 5.0 here)",
                "The learning rate was too low",
              ],
              answer: 1,
              explain: <>Leaf means can't exceed the largest training target, and averaging them can't either. The forest inherits the tree's flat ceiling — fine for capped data, disqualifying for open-ended targets.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/case-a-covertype", label: <>← Case: the forest as a default</> }}
          next={{ href: "/map", label: <>Next family · Boosting, on the map →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
