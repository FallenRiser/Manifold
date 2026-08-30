import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeOutput } from "@/components/CodeOutput";
import { WeightSymmetryLab } from "@/components/labs/WeightSymmetryLab";

export const metadata = {
  title: "There is no single best set of weights — Manifold",
  description:
    "A hidden layer of 16 units has 1.4 × 10^18 exact copies of every solution it finds. That is not a curiosity — it explains why two runs disagree, why averaging weights destroys a model, and why you cannot interpret a weight.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ManyEquivalentSolutionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What networks are and are not", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>There is no <em>single</em> best set of weights</>}
        intro={<>Linear regression has one optimum, and you can write it down. A network does not, and the reason is
          not that the problem is hard — it is that the question is malformed. The same function has an
          astronomical number of equally valid spellings, and knowing this explains several things that otherwise
          look like bugs.</>}
      />

      <div className="lesson">
        <h2>Relabelling is not changing</h2>
        <p>
          Take a trained network and swap hidden units 1 and 3 — the whole units, meaning their incoming weights,
          their biases, and the outgoing weights that read them. You have changed a lot of numbers. What have you
          changed about the function?
        </p>
        <p>
          Nothing at all. The units in a layer have no order; they are a <em>set</em> wearing index numbers for our
          convenience. Permuting them permutes the labels and leaves every output identical — not approximately,
          exactly.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>You permute the hidden units of a trained network and re-run it on the test set. How much do the
            predictions move?</>}
          options={[
            "A little — the network is sensitive to weight changes",
            "Not at all — exactly zero, or floating-point noise",
            "It depends which units you swap",
          ]}
          nudge="Locked in. Try every preset in the lab below."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Step through all five presets and watch the two boxes at the bottom move in opposite
            directions. <strong>Negate units 1 &amp; 2</strong> is the one worth pausing on — it changes the sign of
            half the weights.</>}
          insight={<>Every preset moves the weights and none of them move the outputs. The difference column reads{" "}
            <strong>0</strong> — genuinely zero, because these are the same arithmetic operations in a different
            order rather than an approximation. On a real trained network with 16 hidden units, permuting the layer
            moved the weights by a mean of <strong>0.8855</strong> and the predictions by{" "}
            <strong>2.2 × 10<sup>−16</sup></strong>.</>}
        >
          <WeightSymmetryLab />
        </LabFrame>

        <h2>How many copies is that?</h2>
        <p>
          Two symmetries are available. A layer of <M>{String.raw`n`}</M> units can be permuted in{" "}
          <M>{String.raw`n!`}</M> ways. And with an odd activation such as <M>{String.raw`\tanh`}</M>, negating a
          unit&rsquo;s incoming weights and its outgoing weight also leaves the function unchanged, because{" "}
          <M>{String.raw`\tanh(-z) = -\tanh(z)`}</M> and the two sign flips cancel — that is another factor of{" "}
          <M>{String.raw`2^n`}</M>.
        </p>

        <MathBlock>{String.raw`\#\{\text{equivalent weight vectors}\} \;=\; \prod_{\text{layers}} n_\ell!\;\cdot\;2^{n_\ell}`}</MathBlock>

        <CodeOutput>{`  a single tanh layer of width   4: 4! x 2^4 = 3.840e+02 identical copies
  a single tanh layer of width  16: 16! x 2^16 = 1.371e+18 identical copies
  a single tanh layer of width  64: 64! x 2^64 = 2.341e+108 identical copies
      two layers of 32:      1.277e+90 (= 10^90)`}</CodeOutput>

        <p>
          A modest two-layer network of width 32 has <strong>10<sup>90</sup></strong> exact copies of every solution
          — more than the number of atoms in the observable universe, which is around 10<sup>80</sup>. Gradient
          descent is not searching for a needle. It is searching a haystack made entirely of needles.
        </p>

        <Callout color={CORAL} title={<>Why &ldquo;the&rdquo; optimum is the wrong phrase</>}>
          For linear regression the phrase is fine: the loss is convex, there is one minimum, and{" "}
          <Link href="/learn/linear-regression/the-normal-equation" style={link}>a formula gives it to you</Link>.
          <br /><br />
          For a network, <strong>the minima come in orbits</strong> — huge families of weight vectors that are
          different points and the same function. Asking &ldquo;did we find the optimum?&rdquo; conflates two
          questions that come apart here: <em>did we find a good function</em>, which is answerable, and{" "}
          <em>did we find a particular weight vector</em>, which nothing in the problem prefers.
        </Callout>

        <h2>Five seeds, one function, five different answers</h2>
        <p>
          The same architecture and the same data, trained five times with different random initialisations:
        </p>

        <CodeOutput>{`  seed 0: test acc 0.9190   |w| =  10.496   first 3 weights [-0.508, -0.523, -1.631]
  seed 1: test acc 0.9190   |w| =  11.600   first 3 weights [-1.074, -0.424, -0.44]
  seed 2: test acc 0.9190   |w| =  10.194   first 3 weights [-0.774, -3.596, -0.533]
  seed 3: test acc 0.9238   |w| =  10.590   first 3 weights [0.12, 0.545, -0.452]
  seed 4: test acc 0.9190   |w| =  10.688   first 3 weights [0.556, 0.661, 0.852]
  distance between seed 0 and seed 1 in weight space: 9.130
  difference in test accuracy: 0.0000`}</CodeOutput>

        <p>
          Four of the five score identically. And seeds 0 and 1 are <strong>9.130 apart</strong> in weight space,
          against weight vectors whose own lengths are about 10.5 — they are nearly as far from each other as either
          is from the origin. Two solutions, indistinguishable in quality, on opposite sides of the space.
        </p>

        <h2>The consequence that catches people out</h2>
        <p>
          If two models are equally good, averaging them ought to be safe. In weight space it is not:
        </p>

        <CodeOutput>{`  seed 0 alone           : 0.9190
  seed 1 alone           : 0.9190
  average of the WEIGHTS  : 0.8714   <- averaging in weight space
  average of the OUTPUTS  : 0.9190   <- averaging in function space (5 models)`}</CodeOutput>

        <p>
          Averaging the weights of two good models produced a <em>worse</em> model. The midpoint between two
          solutions is not a compromise between two functions — it is a third, unrelated network, and there is no
          reason for it to be any good. Averaging the <em>outputs</em> is fine, because that operation happens in
          function space where the symmetry does not exist.
        </p>

        <Callout color={CORAL} title={<>Three things this explains</>}>
          <strong>Why you cannot interpret a single weight.</strong> &ldquo;Hidden unit 7 detects X&rdquo; is a
          statement about a labelling that a permutation destroys. Re-run with another seed and unit 7 is something
          else entirely. Interpretability work has to target directions and functions, not indices.
          <br /><br />
          <strong>Why ensembles average predictions.</strong> Every practical ensembling method — bagging, snapshot
          ensembles, simple output averaging — combines in function space. Weight averaging only works between
          models that stayed in the <em>same</em> basin, which is why it needs shared initialisation or an explicit
          alignment step.
          <br /><br />
          <strong>Why seed variation is not a bug.</strong> The activation-function bakeoff two tracks from here
          reports spreads of up to 0.11 in test accuracy across seeds. Runs land in different orbits with genuinely
          different functions of similar quality, and reporting one run hides that.
        </Callout>

        <Proof color={CORAL} title="the permutation and sign symmetries, written out">
          <p>
            A one-hidden-layer network computes{" "}
            <M>{String.raw`f(x) = W_2\,\phi(W_1x + b_1) + b_2`}</M>. Let{" "}
            <M>{String.raw`P`}</M> be any <M>{String.raw`n\times n`}</M> permutation matrix, so{" "}
            <M>{String.raw`P^\top P = I`}</M>. Because <M>{String.raw`\phi`}</M> acts elementwise, it commutes with
            any permutation of coordinates: <M>{String.raw`\phi(Pv) = P\phi(v)`}</M>. Then with{" "}
            <M>{String.raw`W_1' = PW_1`}</M>, <M>{String.raw`b_1' = Pb_1`}</M>,{" "}
            <M>{String.raw`W_2' = W_2P^\top`}</M>:
          </p>
          <MathBlock>{String.raw`W_2'\,\phi(W_1'x + b_1') + b_2 = W_2P^\top P\,\phi(W_1x+b_1) + b_2 = f(x)`}</MathBlock>
          <p>
            For the sign symmetry, let <M>{String.raw`D`}</M> be diagonal with entries{" "}
            <M>{String.raw`\pm 1`}</M>, so <M>{String.raw`D^{-1} = D`}</M>. If{" "}
            <M>{String.raw`\phi`}</M> is odd then <M>{String.raw`\phi(Dv) = D\phi(v)`}</M>, and the identical
            cancellation goes through with <M>{String.raw`W_1' = DW_1`}</M>,{" "}
            <M>{String.raw`b_1' = Db_1`}</M>, <M>{String.raw`W_2' = W_2D`}</M>. This one needs the odd activation:
            it holds for <M>{String.raw`\tanh`}</M> and fails for sigmoid and ReLU, so those networks have the{" "}
            <M>{String.raw`n!`}</M> permutations without the <M>{String.raw`2^n`}</M> sign flips.
          </p>
          <p>
            ReLU has a different extra symmetry instead, from its positive homogeneity{" "}
            <M>{String.raw`\mathrm{ReLU}(cz) = c\,\mathrm{ReLU}(z)`}</M> for <M>{String.raw`c>0`}</M>: scale a
            unit&rsquo;s incoming weights by <M>{String.raw`c`}</M> and its outgoing weight by{" "}
            <M>{String.raw`1/c`}</M> and the function is unchanged. That is a <em>continuous</em> symmetry, so a
            ReLU network&rsquo;s equivalent solutions are not a large finite set but an infinite manifold — and it
            is why comparing the raw size of two ReLU networks&rsquo; weights tells you very little.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does permuting a hidden layer leave the network&rsquo;s output exactly unchanged?</>,
              options: [
                "Because the permutation is small relative to the weights",
                "Because the activation acts elementwise, so it commutes with a permutation, and the outgoing weights are permuted to match",
                "Because training makes the units interchangeable",
              ],
              answer: 1,
              explain: <>With <M>{String.raw`\phi(Pv)=P\phi(v)`}</M> and{" "}
                <M>{String.raw`W_2P^\top P = W_2`}</M>, the permutation cancels identically. It is an algebraic
                identity, not an approximation — the measured change on a real network was{" "}
                <M>{String.raw`2\times10^{-16}`}</M>.</>,
            },
            {
              q: <>Two independently trained networks both score 0.9190. Averaging their weights scores 0.8714. Why?</>,
              options: [
                "One of the models was undertrained",
                "They sit in different symmetry orbits, so the midpoint between them is a third unrelated network rather than a compromise",
                "Averaging weights always halves the effective capacity",
              ],
              answer: 1,
              explain: <>Weight space has no notion of &ldquo;between&rdquo; two functions when the same function
                has 10<sup>18</sup> spellings. Averaging the <em>outputs</em> is safe because that combination
                happens in function space.</>,
            },
            {
              q: <>What does this imply for the claim &ldquo;hidden unit 7 has learned to detect edges&rdquo;?</>,
              options: [
                "It is a well-defined claim about that network",
                "The index is an arbitrary label a permutation would destroy, so the claim must be about a direction or a function rather than a unit number",
                "It is only meaningful for ReLU networks",
              ],
              answer: 1,
              explain: <>Relabel the layer and unit 7 is something else, with an identical network. Any statement
                that survives has to be invariant to the symmetry — which is exactly why interpretability research
                works with directions in activation space rather than with indices.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/universal-approximation", label: <>← Universal approximation</> }}
          next={{ href: "/learn/perceptron-to-mlp/where-an-mlp-wins", label: <>Next up · Where an MLP wins →</> }}
        />
      </div>
    </article>
  );
}
