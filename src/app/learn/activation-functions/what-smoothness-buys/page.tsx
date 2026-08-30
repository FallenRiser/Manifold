import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "What smoothness actually buys — Manifold",
  description:
    "Every modern activation is smooth, and the usual explanation for why is wrong. Three candidate mechanisms, examined against what was actually measured.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SmoothnessPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The smooth moderns", color: CORAL }, { label: "Tier 2→3", color: CORAL }]}
        time="about 8 minutes"
        title={<>What smoothness <em>actually</em> buys</>}
        intro={<>The functions that replaced ReLU are all smooth, and the reason usually given — &ldquo;gradient
          descent likes smooth functions&rdquo; — does not survive contact with the evidence. Here are three
          candidate mechanisms and an honest account of which one the data supports.</>}
      />

      <div className="lesson">
        <h2>The explanation that does not work</h2>
        <p>
          The intuitive story is that ReLU&rsquo;s kink at the origin is a problem for gradient descent, and rounding
          it off helps. This cannot be right, for a simple reason: <strong>the kink is at a single point of measure
          zero.</strong> A unit whose pre-activation is exactly 0.0 in floating point essentially never occurs, and
          the frameworks that define the derivative there as 0 have trained every large model of the last decade
          without incident.
        </p>
        <p>
          The loss surface of a ReLU network is piecewise smooth, and the non-smooth boundaries are lower-dimensional
          sets that an optimiser passes through rather than gets stuck on. Whatever the smooth activations are
          buying, it is not the removal of a kink at one point.
        </p>

        <h2>Three mechanisms that might be real</h2>
        <p>
          <strong>1. No exactly-zero derivative.</strong> This one is solid and measured. ReLU&rsquo;s slope is
          exactly zero on the whole negative half-line, which is what makes dead units permanent. GELU and Swish
          approach zero asymptotically and never reach it, so a unit driven negative keeps a tiny path back. At the
          learning rate that killed 19 of 64 ReLU units, both recorded zero deaths.
        </p>
        <p>
          Note this has nothing to do with smoothness as such. <strong>Leaky ReLU has the same property and is not
          smooth at all</strong> — it also recorded zero deaths. If this is the mechanism, then smoothness is a
          way of achieving it, not the thing itself.
        </p>

        <p>
          <strong>2. The non-monotone dip.</strong> Both functions go slightly negative near{" "}
          <M>{String.raw`x = -1`}</M> before returning to zero. This makes the output a non-injective function of
          the input, and the argument is that the small negative region lets a unit express &ldquo;weakly
          against&rdquo; as distinct from &ldquo;absent&rdquo;. ReLU collapses both to zero.
        </p>
        <p>
          Suggestive, and largely unproven. The ablation you would want — the same function with the dip removed —
          was run in the Swish paper and the dip helped a little; it is not a large or well-replicated effect.
        </p>

        <p>
          <strong>3. Self-gating.</strong> Both functions have the form{" "}
          <M>{String.raw`x \cdot g(x)`}</M> where <M>{String.raw`g`}</M> is a soft gate in{" "}
          <M>{String.raw`[0,1]`}</M> — the unit modulates its own output by a smooth function of its own input. ReLU
          is the same form with a hard gate, <M>{String.raw`g(x) = \mathbb{1}[x>0]`}</M>.
        </p>

        <MathBlock>{String.raw`\text{ReLU}(x) = x\cdot\mathbb{1}[x>0] \qquad \text{Swish}(x) = x\cdot\sigma(\beta x) \qquad \text{GELU}(x) = x\cdot\Phi(x)`}</MathBlock>

        <p>
          Written this way the family is obvious, and it is the same idea as the gating in an LSTM or a GLU, applied
          pointwise. This is the framing most likely to generalise, and it is why the next page can present the
          &ldquo;rest of the zoo&rdquo; as variations rather than a list.
        </p>

        <Callout color={CORAL} title={<>What the measurement says about all three</>}>
          In the bakeoff on the next page — five seeds, same data, same network — the smooth moderns lead. Swish
          scores <strong>0.8857</strong> shallow against ReLU&rsquo;s <strong>0.7838</strong>, which looks decisive
          until you read the spread column: ReLU&rsquo;s five seeds span <strong>0.1143</strong>.
          <br /><br />
          The honest statement is that the smooth functions are <strong>slightly ahead and much more
          consistent</strong> — Swish&rsquo;s spread is 0.019, a sixth of ReLU&rsquo;s. That consistency is a real
          and underrated benefit, and it is what mechanism 1 predicts: an activation that cannot lose units
          permanently has fewer ways for an unlucky seed to go badly wrong.
        </Callout>

        <h2>What smoothness costs</h2>
        <p>
          Not free, and the price is paid on every unit of every layer at every step:
        </p>

        <CodeOutput>{`activation   ms per call   vs relu
      relu          4.75      1.0x
     leaky         11.89      2.5x
     swish        104.84     22.1x
      gelu        121.71     25.6x
      mish         82.00     17.3x`}</CodeOutput>

        <p>
          Roughly twenty-five times ReLU, in NumPy on one machine. On a GPU with fused kernels the gap narrows a
          great deal — this is a memory-bandwidth-bound operation there, not a compute-bound one — but it does not
          close. Which is why <strong>hard-swish</strong> exists: replace the sigmoid with a piecewise-linear
          approximation, keep most of the shape, recover most of the speed, and ship it on phones.
        </p>

        <Callout color={CORAL} title={<>The size of the prize</>}>
          Every difference on this page is worth low single-digit percentages at most, and on this track&rsquo;s
          measurements much of it is inside seed noise. Meanwhile the{" "}
          <Link href="/learn/activation-functions/what-depth-did" style={link}>initialisation scale alone</Link>{" "}
          moved a gradient ratio by six orders of magnitude.
          <br /><br />
          Choosing GELU over ReLU is a reasonable default and a rounding error. Choosing sigmoid over either is a
          catastrophe. <strong>Knowing which decisions are which is the actual skill</strong> — and it is the reason
          this chapter ends with a measured bakeoff rather than a recommendation.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is &ldquo;smoothness removes ReLU&rsquo;s kink, which helps the optimiser&rdquo; a weak
                explanation?</>,
              options: [
                "Because ReLU has no kink",
                "Because the kink is at a single point of measure zero, which a network essentially never lands on",
                "Because optimisers ignore second derivatives anyway",
              ],
              answer: 1,
              explain: <>Exact zero pre-activations do not occur in floating point in any meaningful quantity, and
                frameworks define the derivative there by convention. Whatever smooth activations buy, this is not
                it.</>,
            },
            {
              q: <>Leaky ReLU is not smooth, yet it shares the smooth moderns&rsquo; immunity to dead units. What
                does that tell you?</>,
              options: [
                "That Leaky ReLU is secretly smooth",
                "That the operative property is 'derivative never exactly zero', and smoothness is one way of achieving it rather than the mechanism itself",
                "That dead units are not caused by zero derivatives",
              ],
              answer: 1,
              explain: <>Separating the property from the implementation is the useful move. It also tells you what
                to look for in a new activation: check the derivative for exact zeros, not the curve for
                corners.</>,
            },
            {
              q: <>Swish leads ReLU by 0.10 in the shallow bakeoff, and ReLU&rsquo;s five seeds span 0.11. What is
                the defensible claim?</>,
              options: [
                "Swish is decisively better than ReLU",
                "Swish is slightly ahead and considerably more consistent — its own spread is 0.019 — but a single-seed comparison could not distinguish them",
                "The two are identical in performance",
              ],
              answer: 1,
              explain: <>A gap of the same size as the seed spread cannot support a strong ranking, but the
                difference in <em>variance</em> is itself a result: an activation that cannot lose units permanently
                has fewer ways for a bad seed to go wrong.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/gelu-and-swish", label: <>← GELU &amp; Swish</> }}
          next={{ href: "/learn/activation-functions/the-rest-of-the-zoo", label: <>Next up · The rest of the zoo →</> }}
        />
      </div>
    </article>
  );
}
