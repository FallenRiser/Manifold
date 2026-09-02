import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The ensemble interpretation — Manifold",
  description:
    "Dropout can be read as training an exponentially large ensemble of subnetworks that share weights, then approximating their average at test time by scaling. The idea that ties dropout to bagging.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function EnsembleInterpretationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dropout", color: CORAL }, { label: "Tier 3 · theory", color: CORAL }]}
        time="about 7 minutes"
        title={<>The ensemble interpretation</>}
        intro={<>There is a second way to read dropout, and it is the one that explains why it works
          so reliably. Each training step, by dropping a different random subset of units, you are
          training a <em>different network</em>. Over training you touch exponentially many of them,
          and they all share weights. Dropout is bagging, done in superposition.</>}
      />

      <div className="lesson">
        <h2>Every mask is a different network</h2>
        <p>
          A hidden layer of <M>{String.raw`n`}</M> units has <M>{String.raw`2^n`}</M> possible
          on/off patterns. Each forward pass under dropout samples one of these patterns and computes
          with the corresponding <em>subnetwork</em> — the full architecture with some units deleted.
          A network with a few hundred hidden units therefore has more possible subnetworks than there
          are atoms in the observable universe, and training visits a fresh random one at every step.
        </p>
        <p>
          Crucially, these subnetworks are not independent. They <strong>share weights</strong>: the
          weight on a given connection is the same weight in every subnetwork that includes that
          connection. So a single gradient step improves not just the sampled subnetwork but, on
          average, the whole family that shares those weights. You train an ensemble of exponential
          size at the cost of training one network.
        </p>

        <MathBlock>{String.raw`\text{subnetwork } = \; g\!\bigl((\mathbf{m}\odot \mathbf{h})\,;\,\theta\bigr), \qquad \mathbf{m}\sim \text{Bernoulli}(1-p)`}</MathBlock>

        <h2>Test time is an approximate average</h2>
        <p>
          A true ensemble would average the predictions of all its members. You cannot enumerate{" "}
          <M>{String.raw`2^n`}</M> subnetworks, but dropout gives you a shortcut: at test time, turn
          dropout off and use the full network with weights scaled by the keep-probability (the{" "}
          <Link href="/learn/nn-regularisation/dropout-at-test" style={link}>inverted-dropout</Link>{" "}
          scaling already folds this into training). That single deterministic pass approximates the{" "}
          <em>geometric mean</em> of all the subnetworks&rsquo; predictions.
        </p>
        <p>
          The approximation is exact for a single linear layer followed by a softmax, and only
          approximate for deep nonlinear networks — but in practice it is close enough that the one
          scaled forward pass stands in for the whole ensemble. This is why you get ensemble-like
          variance reduction without paying to store or run many models.
        </p>

        <Callout color={CORAL} title={<>Why this reduces variance</>}>
          Averaging many high-variance predictors that make roughly independent errors cancels those
          errors — the same mechanism that makes a <Link href="/learn/random-forests" style={link}>random
          forest</Link> beat a single tree. Dropout manufactures that diversity for free by randomising
          which units are present, so the shared-weight ensemble is more diverse than any single
          subnetwork and its average generalises better. On this track&rsquo;s problem that showed up as
          the measured lift from 0.751 to 0.777 at rate 0.5.
        </Callout>

        <h2>How it differs from bagging</h2>
        <p>
          The analogy to <Link href="/learn/random-forests" style={link}>bagging</Link> is close but not
          exact, and the differences are instructive:
        </p>
        <p>
          <strong>Weight sharing.</strong> Bagged trees are fully independent models trained on
          different bootstrap samples. Dropout&rsquo;s subnetworks all share one set of weights, so they
          cannot specialise as freely — but that sharing is exactly what makes training one network
          suffice.
        </p>
        <p>
          <strong>No member is trained to completion.</strong> Each subnetwork is updated only on the
          steps where its mask was sampled, so no individual subnetwork is ever fully trained. The
          ensemble exists only in aggregate, in the shared weights.
        </p>
        <p>
          <strong>Test-time collapse.</strong> Bagging averages real model outputs; dropout collapses
          the ensemble into one scaled network. You trade an exact average for a cheap approximate one.
        </p>

        <Proof color={CORAL} title="why the weight-scaling rule approximates the ensemble average">
          <p>
            Consider a single unit that outputs <M>{String.raw`w\,h`}</M> when present, and is kept with
            probability <M>{String.raw`q = 1-p`}</M>. Under the dropout distribution, its expected
            contribution is <M>{String.raw`q\,w\,h`}</M>. Using the full weight <M>{String.raw`w`}</M> at
            test time would over-count by a factor of <M>{String.raw`1/q`}</M>, so scaling the weight to{" "}
            <M>{String.raw`q\,w`}</M> (equivalently, scaling activations by <M>{String.raw`1/q`}</M>{" "}
            during training) makes the deterministic test-time output equal the expected training-time
            output.
          </p>
          <p>
            For a linear-softmax model this expected pre-activation is exactly what the geometric-mean
            ensemble predicts, so the scaling rule is exact. In a deep network the nonlinearities make it
            only approximate — the scaled network is a first-order stand-in for the true average over{" "}
            <M>{String.raw`2^n`}</M> masks — but empirically the gap is small, which is what makes the
            single-pass approximation usable.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>In what sense does dropout train an ensemble of <M>{String.raw`2^n`}</M> networks
                without <M>{String.raw`2^n`}</M> times the cost?</>,
              options: [
                "It trains each subnetwork briefly and stores them all",
                "The subnetworks share one set of weights, so a single gradient step improves the whole family that includes those connections",
                "It only trains the largest subnetwork and copies its weights to the rest",
              ],
              answer: 1,
              explain: <>Weight sharing is the whole trick: every subnetwork that uses a connection uses
                the same weight, so training on random subnetworks improves an exponential family at the
                cost of one network. No subnetwork is stored or trained to completion.</>,
            },
            {
              q: <>Why can a single scaled forward pass replace averaging all the subnetworks at test
                time?</>,
              options: [
                "Because the subnetworks are identical",
                "Because scaling the weights by the keep-probability makes the deterministic output equal the expected output under the dropout mask — exactly for a linear-softmax layer, approximately for deep nets",
                "Because dropout is turned off, so the ensemble no longer matters",
              ],
              answer: 1,
              explain: <>The weight-scaling rule sets each unit&rsquo;s test-time contribution equal to
                its expectation under the mask distribution. That expectation is the geometric-mean
                ensemble prediction — exact for one linear-softmax layer, a close approximation for a
                deep network.</>,
            },
            {
              q: <>How does dropout&rsquo;s ensemble differ from a random forest&rsquo;s?</>,
              options: [
                "A random forest shares weights across trees; dropout does not",
                "Dropout&rsquo;s members share weights and are never individually trained to completion, whereas bagged trees are independent models trained fully on separate bootstrap samples",
                "There is no difference; both average independent models at test time",
              ],
              answer: 1,
              explain: <>Bagging averages fully-trained, independent models. Dropout&rsquo;s subnetworks
                share one weight set, are each updated only on the steps their mask appears, and are
                collapsed into a single scaled network at test time — an approximate average rather than
                an exact one.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/dropout-at-test", label: <>← Dropout at test time</> }}
          next={{ href: "/learn/nn-regularisation/early-stopping", label: <>Next up · Early stopping →</> }}
        />
      </div>
    </article>
  );
}
