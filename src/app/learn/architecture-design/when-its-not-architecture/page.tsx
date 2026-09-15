import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { DiagnosticPanels } from "@/components/figures/arch/ArchFigures";

export const metadata = {
  title: "When the architecture is not the problem — Manifold",
  description:
    "The honest counterweight: bad data, a leak, the wrong metric, too little data, an optimisation bug, or a Bayes-error ceiling. Past a point, changing the architecture is the wrong move.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhenItsNotArchitecturePage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Putting it together", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>When the architecture is not the problem</>}
        intro={
          <>
            This track has spent its length teaching you to tune the architecture. This page is the
            honest counterweight: the cases where changing the architecture is the wrong move
            entirely, and where more width, more depth, or more regularisation cannot help because
            the ceiling is somewhere else.
          </>
        }
      />

      <div className="lesson">
        <h2>The cases where architecture is not the lever</h2>
        <p>
          When the model is not good enough and you have already found the plateau, the instinct is
          to reach for more network. But a stubborn performance ceiling usually means the bottleneck
          has moved out of the architecture entirely. The common culprits:
        </p>
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            <strong>Bad data or label noise.</strong> If the labels are wrong for some fraction of
            examples, more capacity does not help — it memorises the noise. A bigger network fits the
            mislabelled points more confidently, widening the gap without improving the truth.
          </li>
          <li>
            <strong>A leak.</strong> A feature that encodes the target (a proxy for the label, an ID
            correlated with the outcome, information from the future) makes training accuracy soar and
            test accuracy collapse in deployment. No architecture change fixes a leak; only auditing
            the features does.
          </li>
          <li>
            <strong>The wrong metric.</strong> Optimising accuracy on an imbalanced problem, or a
            metric that does not match the decision the model informs, produces a model that looks
            good and behaves badly. The fix is the objective, not the layers.
          </li>
          <li>
            <strong>Insufficient data.</strong> A few hundred rows cannot support a large network. The
            remedy is more data, stronger priors, or a simpler model — not more parameters chasing a
            sample too small to constrain them.
          </li>
          <li>
            <strong>An optimisation bug.</strong> A wrong learning rate, an un-shuffled loader, a
            frozen layer, a mis-scaled input. These masquerade as capacity problems and waste
            architecture experiments. The small-sample overfit test from{" "}
            <Link href="/learn/architecture-design/the-order-of-operations" style={link}>the order of
            operations</Link> exists to catch them.
          </li>
          <li>
            <strong>A Bayes-error ceiling.</strong> Some problems are simply near their irreducible
            error — the overlap between classes is real, and no model can separate what is genuinely
            inseparable. When you are at the Bayes limit, every knob stops moving the number.
          </li>
        </ul>

        <DiagnosticPanels
          only={["lr", "good"]}
          caption={<>The same architecture — two hidden layers of 16 — twice. On the right it is
            trained at a learning rate of 0.01 and reaches 1.000 / 0.877. On the left the learning
            rate is 1.0, and both curves jitter between the same two or three values for 400 epochs
            and never settle. There is no width and no depth that repairs the left-hand panel,
            because nothing about it is an architecture problem. Being able to recognise that shape
            is worth more than any amount of searching, and this is what it looks like.</>}
        />

        <h2>The evidence is in the marginal returns</h2>
        <p>
          You do not have to guess which case you are in — the shape of the returns tells you. On this
          track&rsquo;s clean problem, both the capacity knob and the regularisation knob quietly ran
          out of road:
        </p>
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            <strong>The width plateau:</strong> going from width 16 to width 512 — a 32-fold increase
            in units, a several-hundred-fold increase in parameters — bought only{" "}
            <strong>+0.004</strong> test accuracy. Capacity had stopped mattering.
          </li>
          <li>
            <strong>The regularisation non-result:</strong> adding L2 to a 3&times;128 network moved
            the train-test gap from <strong>0.015 to 0.016</strong> — it did not help, because there
            was no real gap to close.
          </li>
        </ul>
        <p>
          Read together, these two results say the same thing: past a point, architecture and
          regularisation both stop mattering, and what remains is the data. The model was already
          extracting essentially all the signal the moons dataset contains; the leftover error is the
          overlap between the two crescents, which is a property of the data, not a deficiency of the
          network.
        </p>

        <Callout color={CORAL} title={<>A shrinking marginal return is a signal, not a nuisance</>}>
          When every experiment moves the number by less than the noise — +0.004 for a 32-fold width
          increase, +0.001 for regularisation — the diminishing return is itself the diagnosis. It is
          telling you that you have reached the ceiling the <em>data</em> imposes, not a ceiling the
          <em> architecture</em> imposes. The correct next move is to leave the architecture alone and
          look at the data: more of it, cleaner labels, better features, a leak audit, or a check that
          you are optimising the right metric. See the{" "}
          <Link href="/learn/data-workflow" style={link}>data workflow</Link> and{" "}
          <Link href="/learn/evaluation" style={link}>evaluation</Link> pillars for those tools, and
          the <Link href="/learn/nn-regularisation" style={link}>Regularisation track</Link> for a
          problem that genuinely overfits — where the gap is large and closing it is worth doing.
        </Callout>

        <Proof color={CORAL} title="why a shrinking marginal return signals a data/Bayes ceiling, not an architecture deficit">
          <p>
            Every predictor&rsquo;s test error decomposes into three parts: bias (error from a model
            too simple to represent the truth), variance (error from a model too flexible for the data
            it was given), and the irreducible Bayes error (the overlap in the problem itself that no
            model can remove). Architecture knobs move the first two: more capacity reduces bias, more
            regularisation reduces variance. Neither can touch the third.
          </p>
          <p>
            When capacity increases and the number barely moves, bias is already near zero — the model
            is expressive enough. When regularisation is added and the gap barely moves, variance is
            already near zero — the model is not overfitting. If both are near zero and the error is
            still nonzero, what is left is the irreducible term. That is exactly the signature on
            moons: +0.004 from a huge width increase (bias exhausted) and 0.015 &rarr; 0.016 from L2
            (variance exhausted) together locate the remaining error in the Bayes term, which lives in
            the data. Continuing to tune the architecture at that point is optimising a term that is
            already zero — the reason the returns shrank is that the lever is no longer connected to
            the error.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>On moons, widening 16 → 512 bought +0.004 and adding L2 to a 3×128 net moved the gap
                from 0.015 to 0.016. What do these two results, read together, indicate?</>,
              options: [
                "The network needs to be even larger",
                "Both the capacity knob and the regularisation knob have run out — the remaining error is in the data (Bayes ceiling), not the architecture",
                "The learning rate is wrong",
              ],
              answer: 1,
              explain: <>A negligible gain from a huge capacity increase means bias is exhausted; a
                negligible change from regularisation means variance is exhausted. With both near zero
                and error remaining, what is left is the irreducible Bayes term — a property of the
                data, so more architecture cannot help.</>,
            },
            {
              q: <>Your model has soaring training accuracy and collapsing test accuracy in deployment,
                and no amount of regularisation stabilises it. Which non-architecture cause fits best?</>,
              options: [
                "The network is too shallow",
                "A data leak — a feature encoding the target inflates training performance but does not transfer, and only auditing the features fixes it",
                "The learning rate is too low",
              ],
              answer: 1,
              explain: <>A leak makes training performance look excellent because the model reads the
                answer from a proxy feature, but that signal is absent or different at deployment. No
                architecture or regularisation change removes a leak; you have to audit the features.</>,
            },
            {
              q: <>Why is a shrinking marginal return described as a diagnosis rather than a
                nuisance?</>,
              options: [
                "Because it means the experiments were run incorrectly",
                "Because when each knob moves the number by less than the noise, the diminishing return itself indicates you have hit the data/Bayes ceiling and should stop tuning the architecture",
                "Because diminishing returns only happen when the model is underfitting",
              ],
              answer: 1,
              explain: <>Once capacity and regularisation both stop moving the number, they are telling
                you the bias and variance terms are exhausted and the residual error is irreducible.
                The shrinking return is the signal to leave the architecture and look at the data.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/the-playbook", label: <>&larr; The architecture playbook</> }}
          next={{ href: "/learn/architecture-design/the-checklist", label: <>Next up &middot; The architecture checklist &rarr;</> }}
        />
      </div>
    </article>
  );
}
