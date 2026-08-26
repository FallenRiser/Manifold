import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LearningCurveLab } from "@/components/labs/LearningCurveLab";

export const metadata = {
  title: "Reading learning curves — Manifold",
  description:
    "Plot training and validation score against training-set size and the shape tells you whether more data will help. Measured on real digits runs: a converged pair at a ceiling means collect features, not rows.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LearningCurvesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "In practice", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Reading learning curves</>}
        intro={<>The single most useful plot in applied machine learning, because it answers the most expensive
          question you will be asked: <em>would more data help?</em> — before anyone spends a quarter finding out.</>}
      />

      <div className="lesson">
        <h2>The plot</h2>
        <p>
          Take subsets of your training data of increasing size. For each, fit the model and record both training
          score and cross-validated validation score. Plot both against <M>{String.raw`n`}</M>. Two curves, and
          the useful information is in <em>how they approach each other</em>.
        </p>
        <p>
          Training score starts high — a model fits ten points effortlessly — and falls as <M>n</M> grows and the
          data becomes harder to accommodate. Validation score starts low and rises as the model has enough data
          to generalize. They converge toward a common asymptote, and{" "}
          <strong>where they meet, and how quickly, is the diagnosis.</strong>
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>Your training and validation curves have converged and sit almost on top of each other, at 93% accuracy. You have budget to triple your training data. What will that buy?</>}
          options={[
            "A meaningful improvement — more data reliably helps",
            "Essentially nothing — the curves already converged, so estimation error is spent",
            "It depends entirely on the model, which the curve can't tell you",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Step the depth-2 tree along its curve and watch what validation accuracy does between n = 790 and n = 1,437. Then switch to the RBF model and do the same.</>}
          insight={<>The capped tree&rsquo;s curves slam together — a gap of <strong>0.0011</strong> — and its validation accuracy goes 0.3166 → 0.3183 across the last <em>647</em> examples. It is done learning at 32%, and ten times more data would change nothing. The RBF model still has a gap of <strong>0.0118</strong> and gained 1.8 points over that same stretch: still climbing, so more data is still buying something. <strong>A closed gap says stop collecting rows; a low ceiling says change the model.</strong></>}
        >
          <LearningCurveLab />
        </LabFrame>

        <p>
          Both curves in the lab are real 5-fold cross-validated accuracies on the digits dataset from{" "}
          <code>scripts/model_selection_cases.py</code> — not idealized shapes, which is why the tree&rsquo;s
          validation curve even dips slightly at n = 1,113 before recovering. A depth-2 tree can produce at most
          four leaves, so on a ten-class problem it is structurally incapable of exceeding roughly a third
          correct. Its training accuracy is <em>also</em> 32%: it cannot even fit the data it has seen. That is
          approximation error in its purest form, and the fix is a different model, not a bigger dataset.
        </p>

        <h2>The four shapes</h2>
        <ul>
          <li>
            <strong>Converged, at a low ceiling</strong> → approximation-limited. Richer model, better features,
            weaker regularization. <em>Do not collect more data.</em>
          </li>
          <li>
            <strong>Still separated, validation still climbing</strong> → estimation-limited. More data is exactly
            the right lever, and the slope at the right-hand edge estimates roughly how much it will buy.
          </li>
          <li>
            <strong>Converged, at a high ceiling</strong> → you are near the achievable limit. Ship it, or change
            the problem — the{" "}
            <Link href="/learn/asteroid-hazard-capstone/limits" style={link}>asteroid capstone</Link> reaches
            exactly this conclusion and correctly stops tuning.
          </li>
          <li>
            <strong>Validation above training, or curves crossing</strong> → something is wrong. Usually a leak, a
            broken split, or a validation set that isn&rsquo;t comparable to training. Investigate before
            interpreting anything else.
          </li>
        </ul>

        <Callout color={GRAY} title={<>The conversation this is really for</>}>
          &ldquo;Can we get from 93% to 97%?&rdquo; is usually answered with a guess. A learning curve answers it
          with evidence, and often with a &ldquo;no, and here&rsquo;s why more data won&rsquo;t do it&rdquo; that
          saves months. Pair it with the sample-complexity arithmetic — halving error typically{" "}
          <em>quadruples</em> the data required — and you can say something genuinely useful: <em>&ldquo;our
          curves converged four thousand rows ago; the ceiling is the feature set, so the honest options are new
          features or a different model class.&rdquo;</em> That is a far better contribution than a number.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/model-selection/information-criteria", label: <>← AIC, BIC &amp; MDL</> }}
          next={{ href: "/learn/model-selection/one-standard-error-rule", label: <>Next up · The one-standard-error rule →</> }}
        />
      </div>
    </article>
  );
}
