import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";

export const metadata = {
  title: "What can go wrong — Manifold",
  description:
    "Four failures that look identical from the outside — a flat loss curve — and the order to rule them out. Including the one that cost 0.43 accuracy and was not the model's fault.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatCanGoWrongPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Making it learn", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>What can go wrong</>}
        intro={<>The first neural network you train yourself will probably not work, and the loss curve will not
          tell you why — because four quite different faults produce the same flat line. Here they are, with the
          order to rule them out and the reason that order is the cheap one.</>}
      />

      <div className="lesson">
        <h2>The one that is not the model&rsquo;s fault</h2>
        <p>
          Start with the most common and least discussed. Here is the same 64–64 network on the same tabular task,
          fitted twice, with a single difference: whether the input columns were standardised first.
        </p>

        <CodeOutput source="scripts/perceptron_mlp_cases.py">{`MLP, 64-64, standardised  : 0.7483
MLP, 64-64, raw columns   : 0.3225   (-0.4258)`}</CodeOutput>

        <p>
          Forty-three points of accuracy, and nothing errored. Look closely at where it landed: the positive class
          makes up <strong>0.3223</strong> of this dataset, and the unscaled network scores{" "}
          <strong>0.3225</strong>. It is not confused — it has collapsed to predicting one class for essentially
          every row, which is <em>worse</em> than the trivial majority-class baseline of 0.6778. The dataset
          has an income column spanning tens of thousands and a region code between 0 and 5. The first hidden layer
          computes <M>{String.raw`\sum_j w_j x_j`}</M>, so before any learning happens{" "}
          <strong>income contributes roughly ten thousand times more to every unit&rsquo;s activation than region
          does</strong>. The network can in principle correct this by learning a tiny weight for income — but the
          gradient with respect to that weight is proportional to income too, so the very parameter that needs the
          smallest steps receives the largest ones.
        </p>

        <Callout color={CORAL} title={<>Why trees do not care and networks do</>}>
          A random forest on the identical raw columns is unaffected, because a split asks{" "}
          <em>is income above 40,000?</em> — a question invariant to any monotone rescaling. A neural network adds
          features together, so their units must be commensurate. This is the clearest example of a general truth
          worth internalising: <strong>&ldquo;do I need to scale?&rdquo; is a question about the model, not about
          the data.</strong> Distance- and sum-based models need it; split-based models do not. The{" "}
          <Link href="/learn/data-workflow/scaling-and-transforms" style={link}>scaling &amp; transforms</Link> page
          has the general treatment.
        </Callout>

        <h2>The four flat curves</h2>
        <p>
          Your loss sits there and does not move. Rule these out in this order — cheapest and most likely first.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 660 }}>
            <thead>
              <tr>
                {["#", "cause", "the tell", "fix"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 18px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "Unscaled inputs", "columns differ by orders of magnitude", "standardise, inside the pipeline"],
                ["2", "Learning rate far too small", "loss falls, just imperceptibly — zoom the axis", "raise it 10× at a time"],
                ["3", "Learning rate too large", "loss rises, oscillates, or becomes NaN", "lower it 10× at a time"],
                ["4", "A bug in the plumbing", "cannot overfit ten examples", "the ten-example test localises it"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 18px 7px 0", color: j === 0 ? CORAL : j === 3 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The order is not arbitrary. Scaling is one line and fixes the most common cause. The learning rate is one
          number and spans the widest range of possible error — people routinely start three orders of magnitude
          out. Hunting a code bug is the most expensive, so it goes last, and the ten-example test from the last
          page settles it in under a minute.
        </p>

        <h2>Dead ReLUs</h2>
        <p>
          One failure deserves its own name because it is specific to networks and genuinely irreversible. A ReLU
          unit whose pre-activation is negative outputs zero — and its <em>gradient</em> is also zero, because ReLU
          is flat on the negative side. A unit with zero gradient never updates.
        </p>
        <p>
          So if a large gradient step pushes a unit&rsquo;s bias far enough negative that it outputs zero for{" "}
          <strong>every</strong> example in the dataset, that unit is dead permanently. It contributes nothing, it
          receives no gradient, and no amount of further training revives it. Enough of them and the network quietly
          loses most of its capacity while continuing to train without complaint.
        </p>
        <p>
          The diagnostic is direct: take a batch, run a forward pass, and count units whose activation is zero
          across the entire batch. If that number is climbing over training, your learning rate is too high. The
          family of activations invented to answer this — Leaky ReLU, ELU, GELU and the rest — is the{" "}
          <strong>Activation functions</strong> track&rsquo;s subject.
        </p>

        <Callout color={CORAL} title={<>Everything on this page is a symptom, not a cause</>}>
          A flat loss and a dead unit are things you observe. Behind them sit two mechanisms — how gradients grow or
          shrink as they pass back through layers, and how the initial weights are scaled — that are properly
          treated in <strong>Backpropagation</strong> and <strong>Initialisation &amp; normalisation</strong>. This
          page is deliberately a field guide rather than an explanation, because being able to <em>recognise</em>{" "}
          these four situations is worth having before you can derive any of them.
        </Callout>

        <DecisionPoint
          accent={CORAL}
          question={<>Your network&rsquo;s training loss has been flat for 50 epochs. You have five minutes before a
            meeting. What do you do with them?</>}
          options={[
            {
              label: "Add layers and width — it is probably underfitting",
              verdict: "miss",
              response: <>A flat loss means the model is not learning <em>at all</em>, which is a different
                condition from learning as much as it can. Adding capacity to a model that cannot train gives you a
                bigger model that cannot train, and it makes every subsequent experiment slower.</>,
            },
            {
              label: "Try three different learning rates, an order of magnitude apart",
              verdict: "close",
              response: <>Genuinely good, and often it just works — the learning rate is the single most impactful
                hyperparameter and the one people get wrong by the widest margin. But it presumes the plumbing is
                sound. If there is a shape bug, all three runs will be flat and you will conclude something false
                about the learning rate.</>,
            },
            {
              label: "Try to overfit ten examples",
              verdict: "best",
              response: <>It is the only action that <em>partitions</em> the possibilities rather than sampling one.
                Succeed, and the model, the loss and the gradients are all fine — the problem is the learning rate
                or the data, and you have five minutes well spent. Fail, and the fault is in about thirty lines of
                your own code, and no amount of hyperparameter search would ever have found it.</>,
            },
          ]}
        />

        <h2>The order, once more</h2>
        <p>
          Scale the inputs. Overfit ten examples. Sweep the learning rate by powers of ten. Only then think about
          the architecture. In that order those four steps resolve the overwhelming majority of first networks that
          refuse to train, and the ordering matters more than any individual step: <strong>each one narrows the
          search rather than exploring it.</strong>
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does forgetting to standardise cost a neural network 0.43 accuracy while costing a random
                forest nothing?</>,
              options: [
                "Forests are more robust to noise",
                "A network sums features, so their units must be comparable; a split asks a threshold question that rescaling does not affect",
                "Forests standardise internally",
              ],
              answer: 1,
              explain: <>&ldquo;Is income above 40,000?&rdquo; produces the same partition under any monotone
                rescaling. <M>{String.raw`\sum_j w_j x_j`}</M> does not: a column spanning tens of thousands
                dominates one spanning 0–5 both in the activation and in the gradient. Nothing is standardised
                internally — the question simply never arises for a tree.</>,
            },
            {
              q: <>Why is a dead ReLU permanent rather than temporary?</>,
              options: [
                "Its weights are set to zero and cannot be restored",
                "It outputs zero and its gradient is also zero, so it never receives an update",
                "The optimiser removes units that stop contributing",
              ],
              answer: 1,
              explain: <>ReLU is flat for negative inputs, so a unit that is negative on every example has zero
                gradient on every example. Its weights are untouched and perfectly ordinary — they simply never
                change again. Leaky ReLU exists precisely to keep a small non-zero slope there.</>,
            },
            {
              q: <>Why try to overfit ten examples before sweeping the learning rate?</>,
              options: [
                "It is faster than a learning-rate sweep",
                "It splits the possibilities in two, whereas a sweep assumes the code is already correct",
                "It tells you the right learning rate directly",
              ],
              answer: 1,
              explain: <>The test separates &ldquo;the plumbing works&rdquo; from &ldquo;the plumbing is
                broken&rdquo;. A learning-rate sweep run on buggy code produces three flat curves and a confidently
                wrong conclusion. Both are quick; only one narrows the search.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/capacity-you-can-see", label: <>← Capacity you can see</> }}
          next={{ href: "/learn/perceptron-to-mlp/universal-approximation", label: <>Next up · Universal approximation →</> }}
        />
      </div>
    </article>
  );
}
