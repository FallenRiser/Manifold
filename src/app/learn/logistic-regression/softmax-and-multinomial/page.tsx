import { M } from "@/components/Math";
import { SoftmaxLab } from "@/components/labs/SoftmaxLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Term } from "@/components/Term";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Softmax & multinomial logistic regression — Manifold",
  description: "The sigmoid's generalization to K classes. Softmax turns K linear scores into one probability distribution that sums to 1 — logistic regression, natively multiclass.",
};

export default function SoftmaxPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Softmax &amp; multinomial logistic regression</>}
        intro={<>
          Everything so far was two classes. But you rarely classify into just yes/no — you sort
          into digit 0–9, or product category, or disease type. The sigmoid has a natural
          generalization that handles all K at once.
        </>}
      />

      <div className="lesson">
        <p>
          Give each class its own weight vector, so class <M>k</M> gets a linear score{" "}
          <M>{String.raw`z_k = w_k \cdot x + b_k`}</M> — how strongly this input argues for class{" "}
          <M>k</M>. Now you have <M>K</M> scores and need one probability distribution over the
          classes. The <strong>softmax</strong> function does exactly that:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`P(\text{class } k) = \frac{e^{z_k}}{\sum_{j} e^{z_j}}`}</M>
        </p>
        <p>
          Exponentiate every score (making it positive) and divide by the total. The results are
          guaranteed positive and to <strong>sum to exactly 1</strong> — a genuine probability
          distribution. This is <Term accent={ACCENT} def={<>Also called softmax regression. One joint model over all K classes, trained to maximize the probability of the correct class — the direct multiclass generalization of binary logistic regression.</>}>multinomial logistic regression</Term>,
          and it&rsquo;s not a workaround bolted on top of binary logistic regression — it{" "}
          <em>is</em> logistic regression, with <M>K</M> classes instead of 2. (Plug in <M>K = 2</M>{" "}
          and the softmax algebra collapses back to the sigmoid exactly.)
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You park the query dot exactly on the meeting point of all three clusters. What do the three probabilities read?</>}
          options={["100% for the nearest class", "Roughly 33% / 33% / 33% — a three-way tie", "0% for all three"]}
          nudge={<>Locked in. Drag the dot to the centre where all three colours meet and read the bars.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Drag the dot into each coloured region and watch one class dominate; then park it on a boundary between two, and on the triple point in the middle. Keep an eye on the bar total.</>}
          insight={<>Deep in a cluster one bar hits ~100%; on a two-class border the mass splits between exactly those two;
            at the triple point it&rsquo;s a near-even three-way split. The three bars always total 100% because softmax
            shares a single denominator across classes — the model must divide one unit of belief <em>among</em> the
            classes, never rate them independently. That shared normalizer is the whole difference from the next
            page&rsquo;s approach.</>}
        >
          <SoftmaxLab />
        </LabFrame>

        <h2>Training: the same machinery, one dimension up</h2>
        <p>
          The loss generalizes just as cleanly. Binary log loss becomes{" "}
          <strong>categorical cross-entropy</strong> — <M>{String.raw`-\log P(\text{true class})`}</M>,
          the same &ldquo;pay for the probability you gave the truth&rdquo; charge, now over <M>K</M>{" "}
          options. The objective stays convex, and the gradient keeps its beautiful form:{" "}
          <M>{String.raw`(\text{predicted probability} - \text{one-hot truth}) \times \text{features}`}</M>.
          Everything you learned about training binary logistic regression — gradient descent,
          regularization, the works — transfers unchanged. On our three-blob dataset the softmax
          model scores <strong>92.8%</strong>.
        </p>

        <Callout color={ACCENT} title={<>Where you&rsquo;ve already met softmax</>}>
          Softmax is the output layer of nearly every classification neural network on earth — the
          final step of an image classifier turning raw scores into &ldquo;87% cat, 9% dog, 4% fox.&rdquo;
          Learning it here, on a three-blob logistic model, means the last layer of a deep net will
          hold no mystery: it&rsquo;s multinomial logistic regression on top of learned features.
          The throughline again — same form, scaled up.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/logistic-regression/when-perfect-separation-breaks-everything", label: <>← When perfect separation breaks everything</> }}
          next={{ href: "/learn/logistic-regression/one-vs-rest-and-one-vs-one", label: <>Next up · One-vs-rest &amp; one-vs-one →</> }}
        />
      </div>
    </article>
  );
}
