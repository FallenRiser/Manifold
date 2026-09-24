import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { SparsityLab } from "@/components/labs/SparsityLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Hinge vs log loss, and where sparsity comes from — Manifold",
  description:
    "The hinge reaches exactly zero and stays there; log loss never quite does. That one difference decides which training points can still move the boundary, and it is the entire origin of support vectors.",
};

export default function HingeVsLogLossPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 14 minutes"
        title={<>Who still gets a vote</>}
        intro={<>Logistic regression and a linear SVM are built the same way: a penalty on the
          coefficients plus a per-point loss. They differ in one place only — which loss — and it
          looks like a detail. It decides whether a model is defined by a handful of its training
          points or by all of them, and that follows from a single property neither curve
          advertises.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Two curves that look similar</h2>
        <p>
          Both losses are functions of the same quantity, <M>{String.raw`z = y f(x)`}</M>: positive
          when the prediction is right, large when it is confidently right, negative when it is
          wrong. Both are convex, both decrease as <M>{String.raw`z`}</M> grows, and both sit above
          the 0-1 loss they stand in for.
        </p>

        <MathBlock>{String.raw`\ell_{\text{hinge}}(z) = \max(0,\, 1-z) \qquad\qquad \ell_{\log}(z) = \log\!\left(1 + e^{-z}\right)`}</MathBlock>

        <CodeOutput source="scripts/svm_cases.py">{outLosses}</CodeOutput>

        <p>
          Read the two columns down to <M>{String.raw`z = 1`}</M> and they behave much alike. Past
          it they part company completely. The hinge is <strong>0.0000</strong>, and it is not a
          rounded 0.0000 — the function is identically zero for every{" "}
          <M>{String.raw`z \ge 1`}</M>. Log loss at <M>{String.raw`z = 5`}</M> is{" "}
          <strong>0.00672</strong>: tiny, but not nothing, and it never becomes nothing for any
          finite <M>{String.raw`z`}</M>.
        </p>

        <h2>What a loss of zero actually buys</h2>
        <p>
          A small loss and a zero loss sound like almost the same thing. They are not, because what
          moves the boundary during fitting is not the loss but its <em>derivative</em>. A point
          influences <M>{String.raw`w`}</M> in proportion to <M>{String.raw`|d\ell/dz|`}</M>, and
          that is where the two diverge:
        </p>

        <MathBlock>{String.raw`\frac{d\ell_{\text{hinge}}}{dz} = \begin{cases} -1 & z < 1 \\ 0 & z > 1 \end{cases} \qquad\qquad \frac{d\ell_{\log}}{dz} = \frac{-1}{1 + e^{z}}`}</MathBlock>

        <p>
          The hinge&rsquo;s derivative is <em>exactly</em> zero past the margin. Multiply a point by
          zero and it is not a small contributor, it is absent — it could be deleted from the
          dataset and the arithmetic would be unchanged. Log loss&rsquo;s derivative shrinks
          towards zero and never arrives.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outPull}</CodeOutput>

        <p>
          The individual numbers make the case look trivial: a point at{" "}
          <M>{String.raw`z = 20`}</M> pulls with <strong>2 × 10⁻⁹</strong>, which is nothing at
          all. The aggregate is the surprise. Across twenty datasets,{" "}
          <strong>55%</strong> of the total force shaping a logistic boundary comes from points it
          already classifies correctly and confidently. There are simply a lot of them — 87% of the
          data — and a lot of nearly-nothing is something.
        </p>
        <p>
          For the hinge the same figure is <strong>0.0000%</strong>. Not small. Zero.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>The lab below draws a halo around each point sized by how hard it is still
            pulling on the boundary. What will switching from hinge to log loss do to the points
            far from the boundary?</>}
          options={[
            "Their halos vanish, since they are classified correctly either way",
            "Halos appear on all of them — small, but never zero",
            "Nothing changes; the halo only depends on distance",
            "Only the misclassified points change",
          ]}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Start on <strong>hinge</strong> and notice how much of the picture is bare.
            Switch to <strong>log loss</strong> and watch halos appear on every single point,
            including the ones far out in the clouds. Press <strong>new sample</strong> a few
            times — the pattern does not depend on the draw.</>}
          insight={<>Under the hinge the bare points are not faint contributors, they are
            non-contributors: their derivative is exactly zero, so they enter the sum multiplied by
            nothing. Only the points on or inside the margin have any say at all. Under log loss
            nothing ever switches off, so the boundary is a compromise struck across the entire
            training set — and the counter shows those comfortable points still accounting for
            somewhere between a quarter and two fifths of the total pull depending on the sample,
            despite each one contributing almost nothing on its own.</>}
        >
          <SparsityLab />
        </LabFrame>

        <h2>Which means most of the data can be thrown away</h2>
        <p>
          If those points contribute nothing, the model should be recoverable without them. Not
          approximately — exactly. That is a strong claim and it is directly testable: fit on
          everything, keep only the support vectors, refit, and compare.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSparsity}</CodeOutput>

        <p>
          The weights agree to <strong>2.4 × 10⁻⁵</strong>, the intercept to about four decimals,
          and the predictions on the test set are <em>identical</em> — after discarding{" "}
          <strong>157 of the 280 training points</strong>. Those last two digits of disagreement
          are the solver stopping at its tolerance rather than the boundary genuinely shifting;
          nothing that survives to a prediction. This is what &ldquo;the support vectors{" "}
          <em>are</em> the model&rdquo; means, and it is meant literally. The rest of the training
          set was used to <em>find</em> the boundary and then stopped mattering to it.
        </p>
        <p>
          Log loss has no equivalent set. There is no subset it can name and drop for free, because
          no point ever reaches zero influence. Asked to give up the same <em>number</em> of its
          most comfortable points, its boundary swung <strong>24.8°</strong> on average and{" "}
          <strong>74°</strong> at worst — on data it was classifying correctly. The SVM moved{" "}
          <strong>0.03°</strong> at its worst, which is solver noise rather than movement.
        </p>

        <Callout color={PINK} title={<>Sparsity is a property of the fit, not a promise</>}>
          <p>
            Read the last line of that block carefully: across those twenty datasets, support
            vectors ranged from <strong>1%</strong> of the data to <strong>92%</strong> of it. A
            heavily overlapping problem, or a small <M>{String.raw`C`}</M>, puts most of your
            points inside the margin and there is nothing sparse about the result. The{" "}
            <M>{String.raw`C`}</M> dial from two pages ago is the same dial here: it took the
            support-vector count from 92 down to 6 on the same data. &ldquo;An SVM only keeps a few
            points&rdquo; is something to check on your own fit, not to assume.
          </p>
        </Callout>

        <h2>What each one is for</h2>
        <p>
          Neither loss is the better one. They answer different questions, and the flat zero is the
          hinge giving something up as well as gaining something.
        </p>
        <p>
          Because log loss keeps every point in play, its output is a calibrated probability: it is
          fitting <M>{String.raw`P(y=1 \mid x)`}</M>, and the far-away points are what pin down the
          steepness of that curve. The hinge discards exactly that information. An SVM&rsquo;s{" "}
          <M>{String.raw`f(x)`}</M> is a signed distance, not a probability, and the points that
          would have calibrated one have been multiplied by zero. Getting probabilities out of an
          SVM afterwards is a separate procedure with its own costs, which is a later page in this
          track.
        </p>
        <p>
          What the hinge buys in exchange is a model defined by a small, identifiable set of its
          training data. On a linear problem that is mostly an elegance. It stops being an elegance
          in the next chapter: once the boundary is expressed through kernels, prediction requires
          comparing a new point against every retained training point — so the support-vector count
          becomes the literal size and speed of the model, and a loss that never reaches zero would
          mean keeping all of it forever.
        </p>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Why does log loss&rsquo;s value of 0.00672 at <M>{String.raw`z = 5`}</M> matter,
                when the hinge&rsquo;s 0 looks barely different?</>,
              options: [
                "It does not matter; the difference is numerically negligible",
                "Because what moves the boundary is the derivative, and log loss's is never zero, so every point keeps influence",
                "Because log loss is not convex there",
                "Because it makes log loss slower to compute",
              ],
              answer: 1,
              explain: <>Influence is <M>{String.raw`|d\ell/dz|`}</M>, not the loss value. The
                hinge&rsquo;s derivative is identically zero past the margin; log loss&rsquo;s is{" "}
                <M>{String.raw`1/(1+e^{z})`}</M>, which approaches zero without reaching it. Across
                20 datasets those far points still supplied 55% of the total pull.</>,
            },
            {
              q: <>Refitting on only the support vectors reproduced the original boundary to five
                decimal places. What does that demonstrate?</>,
              options: [
                "The discarded points were redundant copies of the kept ones",
                "The solver is unstable and gave a coincidentally similar answer",
                "The discarded points had exactly zero influence on the solution, so removing them changes nothing",
                "The dataset was separable",
              ],
              answer: 2,
              explain: <>Every discarded point sat past its margin, where the hinge&rsquo;s
                derivative is exactly zero. They entered the objective multiplied by nothing, so
                the optimum is identical with or without them — 157 of 280 points deleted, same
                predictions.</>,
            },
            {
              q: <>On the twenty datasets, support vectors ranged from 1% to 92% of the training
                data. What should you take from that?</>,
              options: [
                "Sparsity depends on the data and on C, so it has to be checked rather than assumed",
                "The measurement is unreliable",
                "SVMs are only sparse on separable data",
                "92% means the sparsity claim is false",
              ],
              answer: 0,
              explain: <>The claim that non-support-vectors can be deleted holds every time; how{" "}
                <em>many</em> of them there are does not. Heavy overlap or a small{" "}
                <M>{String.raw`C`}</M> pushes most points inside the margin, where they all count.</>,
            },
            {
              q: <>Why can a linear SVM not hand you a calibrated probability the way logistic
                regression can?</>,
              options: [
                "Because its output is unbounded",
                "Because the points that would pin down the shape of the probability curve are the confidently-correct ones, and the hinge multiplies them by zero",
                "Because it minimises a non-convex objective",
                "Because it only works on two classes",
              ],
              answer: 1,
              explain: <>Calibration needs to know how confidence grows with distance, and that
                information lives in the far-away points. Log loss keeps them; the hinge switches
                them off. An SVM&rsquo;s <M>{String.raw`f(x)`}</M> is a signed distance, and turning
                it into a probability is a separate fitting step.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "The hinge loss",
          href: "/learn/support-vector-machines/the-hinge-loss",
        }}
        next={{
          label: "The primal problem",
          href: "/learn/support-vector-machines/the-primal-problem",
        }}
      />
    </article>
  );
}

const outLosses = `         z      hinge   logistic      0-1   what it means
      -2.0     3.0000     2.1269        1   badly wrong
      -0.5     1.5000     0.9741        1   wrong side
       0.0     1.0000     0.6931        1   on the boundary
       0.5     0.5000     0.4741        0   right side, inside margin
       1.0     0.0000     0.3133        0   exactly on the margin
       2.0     0.0000     0.1269        0   correct and clear
       5.0     0.0000     0.0067        0   correct and far

  Hinge hits EXACTLY zero at z = 1 and stays there. Logistic never does: a point
  at z = 5 still contributes 0.00672, so every point keeps pulling on the boundary.
  That flat stretch at zero is where sparsity comes from: a point out there enters
  the objective multiplied by nothing, so it cannot move the answer.`;

const outPull = `The derivative of each loss with respect to z = y f(x) is the force one point exerts.
For the hinge that is -1 below z = 1 and exactly 0 above it. For log loss it is
-1/(1 + e^z), which is never zero however far out the point sits.

         z     hinge pull    log loss pull
       0.0              1        5.000e-01
       0.5              1        3.775e-01
       1.0              0        2.689e-01
       2.0              0        1.192e-01
       5.0              0        6.693e-03
      10.0              0        4.540e-05
      20.0              0        2.061e-09

  A point at z = 20 is correct by a mile and still pulls, by 2e-09. On its own that
  is nothing. The question is what they add up to, because there are usually a lot
  of them.

Same 20 datasets, 280 points each, fitted both ways at C = 1:

                                                hinge         log loss
  points sitting past z = 1                     85.5%            87.3%
  share of the total pull they exert          0.0000%           55.25%

  Over half the force shaping a logistic boundary comes from points it already
  classifies correctly and confidently. For the hinge that number is 0, not rounded
  to 0 -- those points are multiplied by a derivative that is exactly zero.

So each model is asked to give up the points it says it does not need. For the SVM
that set has a name: everything outside the margin. Log loss has no such set, so it
gives up the same NUMBER of its most comfortable points instead.

                                                            SVM         logistic
  mean boundary movement, degrees                       0.0052          24.8370
  worst movement over the 20 datasets                   0.0323          73.9743
  datasets that moved less than 0.05 degrees              20/20              0/20

  support vectors as a share of the data       1% to 92%

  The SVM is unmoved: 0.03 degrees at worst, and that is solver noise rather than a
  real shift. Log loss moves 24 degrees on average and 74 at worst, on data it was
  getting right. The last row is the limit on all of this: how sparse the solution
  turns out to be is not fixed, and on one of these datasets 92% of the points are
  support vectors. Sparsity is a property of the fit, not a guarantee.`;

const outSparsity = `  trained on all 280 points: 123 support vectors (43.9% of the data)
  refit on ONLY those 123 support vectors:

    w (all points)             [ 0.1982 -0.6149]
    w (support vectors only)   [ 0.1982 -0.6149]
    b (all points)             1.285609
    b (support vectors only)   1.285672

    identical predictions on the test set: True
    max |w| difference: 2.42e-05

  This is what 'the support vectors ARE the model' means, literally. Every other
  training point could be deleted and the boundary would not move.`;
