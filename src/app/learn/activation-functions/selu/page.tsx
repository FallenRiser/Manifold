import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "SELU & self-normalising nets — Manifold",
  description:
    "The one activation on this track whose constants were derived rather than chosen. It works, it comes with four conditions attached, and understanding why it lost is more useful than using it.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SeluPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The ReLU family", color: CORAL }, { label: "Tier 2→3", color: CORAL }]}
        time="about 7 minutes"
        title={<>SELU &amp; self-normalising nets</>}
        intro={<>Every other activation here was proposed, then tested. SELU was <em>derived</em>: two constants
          solved for so that a network keeps unit mean and variance layer after layer, with no normalisation layer
          at all. It is the most intellectually satisfying entry in the zoo and almost nobody uses it.</>}
      />

      <div className="lesson">
        <h2>The function</h2>

        <MathBlock>{String.raw`\text{SELU}(z) = \lambda\begin{cases} z & z > 0\\ \alpha(e^{z}-1) & z \le 0\end{cases} \qquad \begin{aligned}\lambda &= 1.0507009873554805\\ \alpha &= 1.6732632423543772\end{aligned}`}</MathBlock>

        <p>
          ELU, multiplied by a constant. The constants are the entire contribution, and they are not round numbers
          because they are not choices — they are the solution to a fixed-point equation. Klambauer et al. (2017)
          asked: for what <M>{String.raw`\lambda, \alpha`}</M> does a layer map activations with mean 0 and variance
          1 to activations with mean 0 and variance 1? Those values are the answer, and the paper&rsquo;s appendix
          proving it runs to over ninety pages.
        </p>

        <Callout color={CORAL} title={<>What &ldquo;self-normalising&rdquo; claims</>}>
          Not that the activations happen to stay well-behaved — that they are <strong>attracted</strong> to mean 0,
          variance 1. Perturb them and they return. That is a genuinely stronger property than
          &ldquo;initialised well&rdquo;, and it is what would let you drop batch normalisation entirely from a deep
          feedforward network.
        </Callout>

        <h2>The four conditions</h2>
        <p>
          The fixed point is real, and it holds only under a set of assumptions that the paper is explicit about and
          that summaries usually drop. Every one of them is load-bearing:
        </p>
        <ul>
          <li><strong>LeCun-normal initialisation</strong> — weights drawn with variance{" "}
            <M>{String.raw`1/\text{fan\_in}`}</M> exactly. He initialisation breaks the fixed point.</li>
          <li><strong>Standardised inputs</strong> — the guarantee is a fixed point, so you have to start at it.</li>
          <li><strong>Alpha dropout, not ordinary dropout.</strong> Standard dropout sets activations to zero, which
            shifts the mean and destroys the property; alpha dropout drops to the negative saturation value and
            rescales, preserving it.</li>
          <li><strong>Plain feedforward layers.</strong> The derivation assumes many independent inputs per unit.
            Convolutions, recurrence, attention and residual connections all violate it to some degree.</li>
        </ul>
        <p>
          That last one is why SELU is not part of the modern default. It is a solution engineered for exactly the
          architecture that stopped being the interesting one.
        </p>

        <CodeBlock
          language="python"
          fromScratch={`# SELU is all-or-nothing: the constants only hold under its own init and dropout.
import torch.nn as nn

net = nn.Sequential(
    nn.Linear(64, 256), nn.SELU(), nn.AlphaDropout(0.1),
    nn.Linear(256, 256), nn.SELU(), nn.AlphaDropout(0.1),
    nn.Linear(256, 1),
)
for m in net.modules():                       # LeCun normal, not the default
    if isinstance(m, nn.Linear):
        nn.init.normal_(m.weight, std=(1.0 / m.in_features) ** 0.5)
        nn.init.zeros_(m.bias)`}
        />

        <Proof color={CORAL} title="where the fixed point comes from">
          <p>
            Let a unit&rsquo;s pre-activation be <M>{String.raw`z = \sum_i w_i a_i`}</M> with{" "}
            <M>{String.raw`n`}</M> independent inputs. If the incoming activations have mean{" "}
            <M>{String.raw`\mu`}</M> and variance <M>{String.raw`\nu`}</M>, and the weights are drawn with mean 0
            and variance <M>{String.raw`1/n`}</M>, then by the central limit theorem{" "}
            <M>{String.raw`z`}</M> is approximately Gaussian with mean{" "}
            <M>{String.raw`\mu\sum_i w_i \approx 0`}</M> and variance <M>{String.raw`\nu`}</M>.
          </p>
          <p>
            Now push that Gaussian through the activation. The output mean and variance are integrals against the
            Gaussian density:
          </p>
          <MathBlock>{String.raw`\tilde\mu = \int f(z)\,\phi_{0,\nu}(z)\,dz, \qquad \tilde\nu = \int f(z)^2 \phi_{0,\nu}(z)\,dz - \tilde\mu^2`}</MathBlock>
          <p>
            This defines a map <M>{String.raw`(\mu, \nu) \mapsto (\tilde\mu, \tilde\nu)`}</M>. Solving{" "}
            <M>{String.raw`(\tilde\mu, \tilde\nu) = (0, 1)`}</M> for the two free constants{" "}
            <M>{String.raw`\lambda, \alpha`}</M> gives the published values; the ninety pages are spent proving the
            fixed point is <em>attracting</em> — that the map is a contraction in a neighbourhood — which is what
            makes it robust rather than merely consistent.
          </p>
          <p>
            Note precisely what the argument needs: many independent inputs (for the CLT), a specific weight
            variance, and a starting point near the fixed point. Every one of the four conditions above is one of
            these assumptions, made operational.
          </p>
        </Proof>

        <h2>Why it lost, and what to take from it</h2>
        <p>
          SELU solves the problem that <strong>batch normalisation</strong> solves, and it solves it more elegantly
          and more cheaply — no extra layer, no batch statistics, no train/test discrepancy. It lost anyway, for
          reasons that have nothing to do with elegance: batch norm works with any activation, any initialisation,
          any architecture, and tolerates you getting things wrong. SELU works if you satisfy four conditions and
          silently degrades to &ldquo;a scaled ELU&rdquo; if you do not.
        </p>
        <p>
          <strong>Robustness beat optimality</strong>, which is a pattern worth recognising because it recurs across
          the whole field.
        </p>

        <Callout color={CORAL} title={<>The idea that outlived the function</>}>
          SELU is the clearest demonstration on this track that <strong>an activation can be derived from a
          requirement rather than guessed.</strong> Write down the property you need as an equation, solve for the
          constants, prove the solution is stable.
          <br /><br />
          That method is the thing to keep, and{" "}
          <Link href="/learn/activation-functions/designing-a-new-one" style={link}>designing a new one</Link> puts
          it to work. The function itself is a reasonable choice for a plain deep MLP on tabular data where you would
          rather not add normalisation layers, and an unnecessary constraint everywhere else.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What does &ldquo;self-normalising&rdquo; assert?</>,
              options: [
                "That activations happen to stay near mean 0 and variance 1 if initialised well",
                "That mean 0, variance 1 is an attracting fixed point — perturbed activations return to it",
                "That the activation normalises each batch internally",
              ],
              answer: 1,
              explain: <>The claim is about attraction, not coincidence, and that is exactly the property that would
                let you delete a normalisation layer. The bulk of the paper is spent proving the map is a
                contraction.</>,
            },
            {
              q: <>You add standard <code>nn.Dropout</code> to a SELU network. What breaks?</>,
              options: [
                "Nothing — dropout is independent of the activation",
                "Zeroing activations shifts their mean, moving the network off the fixed point the constants were derived for",
                "The network can no longer be initialised",
              ],
              answer: 1,
              explain: <>Alpha dropout exists precisely for this: it drops to the negative saturation value and
                rescales, so the mean and variance survive. Ordinary dropout does not, and the guarantee quietly
                stops holding.</>,
            },
            {
              q: <>Why did batch normalisation win over SELU despite being less elegant?</>,
              options: [
                "It is faster to compute",
                "It works with any activation, initialisation and architecture, whereas SELU needs four conditions held simultaneously",
                "SELU was published later",
              ],
              answer: 1,
              explain: <>Batch norm is more expensive and adds a train/test discrepancy, and it still won, because
                it tolerates being used wrong. SELU degrades silently to a scaled ELU when any condition is
                violated.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-leaky-answers", label: <>← The leaky answers</> }}
          next={{ href: "/learn/activation-functions/gelu-and-swish", label: <>Next up · GELU &amp; Swish →</> }}
        />
      </div>
    </article>
  );
}
