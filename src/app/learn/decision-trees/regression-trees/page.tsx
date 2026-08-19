import Link from "next/link";
import { RegressionTreeLab } from "@/components/labs/RegressionTreeLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Regression trees — Manifold",
  description:
    "Swap the class label for a number and a tree predicts numbers: split to reduce variance, predict the mean in each leaf. The fit is a staircase — flat steps, no extrapolation.",
};

const TREES = "var(--c-trees)";

export default function RegressionTreesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Regression trees</>}
        intro={<>
          Nothing about a tree is tied to categories. Point it at a numeric target and the same greedy
          splitting builds a <em>regression</em> tree — you only swap two ingredients: how impurity is scored,
          and what a leaf predicts.
        </>}
      />

      <div className="lesson">
        <h2>Two swaps and you&rsquo;re done</h2>
        <p>
          A classification leaf stores a majority class; a regression leaf stores the <strong>mean</strong> of
          its targets. And impurity — &ldquo;how mixed is this group?&rdquo; — becomes the natural numeric
          version, the <strong>variance</strong> (equivalently the sum of squared errors around the mean):
        </p>
        <MathBlock>{String.raw`\text{impurity}(\text{node}) = \sum_{i \in \text{node}} \big(y_i - \bar{y}\big)^2, \qquad \bar{y} = \text{mean target in the node}`}</MathBlock>
        <p>
          A split is scored the same way as before: pick the threshold that most reduces the total squared
          error of the two children. A pure classification node had every point in one class; a &ldquo;pure&rdquo;
          regression node has every target near its mean. Everything else — greedy recursion, stopping rules,
          the root-to-leaf prediction walk — is unchanged.
        </p>

        <h2>The fit is a staircase</h2>
        <p>
          Because every leaf predicts a single constant (its mean), a regression tree&rsquo;s prediction is
          <strong> piecewise constant</strong>: flat within each leaf&rsquo;s region, jumping at the split
          boundaries. On 1-D data it looks exactly like a staircase.
        </p>

        <PredictPrompt
          accent={TREES}
          prompt={<>As you increase depth, how does the staircase change — and what happens at very high depth?</>}
          options={["Smooths into a curve", "More, shorter steps that eventually trace every point", "Stays two steps"]}
        />

        <LabFrame
          accent={TREES}
          tryThis={<>Raise the depth from 1 to 6. Count the steps, watch the RMSE fall, and notice what the steps start doing to the noisy points at the top of the range.</>}
          insight={<>Depth 1 is two coarse steps (RMSE ≈ 0.125); by depth 6 there are ~18 short steps (RMSE ≈ 0.042) threading between individual points. The tree never draws a smooth curve — it approximates with flat treads — and at high depth those treads are memorising noise, not signal.</>}
        >
          <RegressionTreeLab />
        </LabFrame>

        <h2>The staircase has consequences</h2>
        <ul style={ul}>
          <li><strong>No extrapolation.</strong> The highest leaf predicts a flat value; feed the tree an{" "}
            <M>{String.raw`x`}</M> beyond the training range and it just returns that last step. A tree can
            never predict a trend continuing upward — a real limitation for forecasting.</li>
          <li><strong>Blocky, not smooth.</strong> If the truth is a gentle curve, a shallow tree renders it
            as crude steps. This is precisely where a single tree loses to a spline or a linear model —
            and where an <em>ensemble</em> of many trees, whose averaged steps blur into something smooth,
            wins it back.</li>
          <li><strong>Robust to monotone feature transforms.</strong> Splits depend only on the <em>order</em>
            of feature values, so logging or scaling an input changes nothing — a convenience linear models
            don&rsquo;t enjoy.</li>
        </ul>

        <Callout color={TREES} title={<>Same tree, both jobs</>}>
          This is why the canonical algorithm is called <strong>CART</strong> — Classification <em>And</em>
          Regression Trees. One structure, one greedy procedure; only the leaf value (majority vs mean) and the
          impurity (Gini/entropy vs variance) change. Random forests and gradient boosting inherit both modes
          for free.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/impurity-measures", label: <>← Gini, entropy & information gain</> }}
          next={{ href: "/learn/decision-trees/numeric-and-categorical-splits", label: <>Next up · Numeric & categorical splits →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
