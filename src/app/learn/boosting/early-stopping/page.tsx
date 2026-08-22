import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { BoostingEarlyStopLab } from "@/components/labs/BoostingEarlyStopLab";

export const metadata = {
  title: "Early stopping & staged prediction — Manifold",
  description:
    "Unlike a random forest, a boosted model will overfit if you add too many trees — so the tree count is a hyperparameter you tune by watching a validation score and stopping when it flattens. Turn early stopping off and covtype boosting collapses from the forest's 0.84 to 0.54.",
};

const TREES = "var(--c-trees)";

export default function EarlyStoppingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Early stopping &amp; staged prediction</>}
        intro={<>
          Here is the single most important operational difference between a forest and a booster.{" "}
          <strong>Adding trees to a forest never hurts; adding trees to a booster eventually does.</strong> The
          tree count is therefore not a &ldquo;more is better&rdquo; setting but a hyperparameter you must choose —
          and there is a clean, automatic way to choose it.
        </>}
      />

      <div className="lesson">
        <h2>Boosting is not self-regularising</h2>
        <p>
          A forest averages independent trees, so extra trees only refine the average — its test error falls to a
          plateau and <em>stays</em> there. Boosting is different in kind: every tree is fit to reduce the{" "}
          <em>training</em> loss, so with enough trees the ensemble will drive training loss toward zero and start
          modelling noise. The test-error curve is a <strong>hump</strong>: down, then a minimum, then slowly back
          up.
        </p>
        <CodeOutput label="deep GBM (lr 0.1, depth 5) on housing — train vs test R²">{`   50 trees   train R² 0.837   test R² 0.797
  100 trees   train R² 0.873   test R² 0.822
  300 trees   train R² 0.923   test R² 0.840
  700 trees   train R² 0.956   test R² 0.845
 1500 trees   train R² 0.982   test R² 0.846
 3000 trees   train R² 0.995   test R² 0.846
  -> test R² peaks at ~1351 trees (0.847), then drifts down`}</CodeOutput>
        <p>
          Training R² marches all the way to 0.995 — the model is memorising — while test R² peaks near 1351 trees
          and then declines. On this gentle dataset the decline is mild (0.847 → 0.846), but the shape is the
          universal boosting signature, and on other data it is steep. You cannot read the right number of trees
          off the training curve; you have to watch validation.
        </p>

        <LabFrame
          accent={TREES}
          tryThis={<>Drag the tree count from 0 to 100 on this small, noisy 1-D problem. Find where the solid{" "}
            <em>test</em> curve bottoms out, then keep going and watch it climb while the dashed <em>train</em>{" "}
            curve keeps falling. Hit <strong>Snap to best</strong> to jump to the ideal stopping point.</>}
          insight={<>The two curves tell opposite stories past the dip: train error heads for zero (the stumps are
            now memorising individual noisy points) while test error turns and rises. Their split is the visible
            face of overfitting, and the minimum of the test curve is exactly what early stopping halts at — no
            guessing the tree count required.</>}
        >
          <BoostingEarlyStopLab />
        </LabFrame>

        <Callout color={TREES} title={<>The collapse when you ignore it</>}>
          On the forest-cover-type task, a histogram booster with early stopping <strong>off</strong>, run to 700
          deep iterations, overfits so hard its test accuracy falls to <strong>0.542</strong> — barely above the
          0.487 majority-class baseline, and far below the random forest&rsquo;s 0.842. The <em>same</em> booster
          with early stopping <strong>on</strong> keeps a validation split and halts automatically. Boosting&rsquo;s
          power and its danger are the same mechanism: relentless focus on the remaining error. Early stopping is
          the leash.
        </Callout>

        <h2>How early stopping works</h2>
        <p>
          Hold out a small <strong>validation fraction</strong>, and after each new tree, score the model on it.
          Keep a counter of how many rounds have passed without improvement; when it exceeds a patience{" "}
          <code>n_iter_no_change</code> (say 10–50), stop and roll back to the best iteration. It costs one extra
          scoring per round and removes the need to guess the tree count at all — you set{" "}
          <code>n_estimators</code> generously high and let the data decide.
        </p>
        <CodeOutput label="GBM with a validation fraction, patience 10 (housing)">{`n_estimators set to 3000, learning_rate 0.05
-> stopped at 543 trees   test R² 0.813
(vs 0.815 for the hand-tuned 300 — essentially free, no guessing)`}</CodeOutput>

        <h2>Staged prediction: the whole curve for free</h2>
        <p>
          Because a boosted model is <em>additive</em>, the prediction after <M>m</M> trees is just the running
          sum of the first <M>m</M>. That means you can get predictions at <em>every</em> intermediate size from a
          single fitted model — scikit-learn&rsquo;s <code>staged_predict</code>, XGBoost&rsquo;s{" "}
          <code>iteration_range</code>. Every learning-curve number on this page came from one fit, not dozens.
          It is also how early stopping cheaply evaluates &ldquo;the model so far&rdquo; after each round, and how
          you can trim a trained model back to its best iteration for faster inference.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>Why does adding trees eventually hurt a booster but never a random forest?</>,
              options: [
                "Boosting trees are deeper",
                "Every boosting tree targets the training loss, so enough of them fit noise; a forest only averages independent trees",
                "Forests use more features",
              ],
              answer: 1,
              explain: <>Boosting reduces training loss step by step and will overfit; bagging averages independent trees, so extra trees only stabilise the average and its test error plateaus.</>,
            },
            {
              q: <>What does early stopping monitor to choose the number of trees?</>,
              options: [
                "The training loss",
                "A validation score, stopping after a patience of no improvement",
                "The depth of each tree",
              ],
              answer: 1,
              explain: <>It scores a held-out validation set after each tree and halts when it hasn't improved for n_iter_no_change rounds, rolling back to the best iteration.</>,
            },
            {
              q: <>How can you get predictions for every ensemble size from one fitted booster?</>,
              options: [
                "Refit the model at each size",
                "Use staged prediction — the additive model's prediction after m trees is the running sum of the first m",
                "You cannot; you must retrain",
              ],
              answer: 1,
              explain: <>Because the model is a sum of trees, truncating the sum at m gives the m-tree prediction — staged_predict / iteration_range expose exactly this.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/tree-knobs", label: <>← Tree structure &amp; the other knobs</> }}
          next={{ href: "/learn/boosting/newton-boosting", label: <>Next up · Newton boosting: XGBoost&rsquo;s second-order step →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
