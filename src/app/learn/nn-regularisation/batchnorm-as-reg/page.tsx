import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "BatchNorm as implicit regularisation — Manifold",
  description:
    "BatchNorm was invented to stabilise training, but it also regularises: the batch statistics are noisy, and that noise acts like a mild dropout. Measured here at +0.012 test accuracy, for free — and why it means you often need less dropout.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BatchnormAsRegPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Combining regularisers", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 7 minutes"
        title={<>BatchNorm as implicit regularisation</>}
        intro={<>BatchNorm earned its place in the toolkit for a different job:{" "}
          <Link href="/learn/initialisation-and-normalisation/what-batchnorm-does" style={link}>stabilising
          training</Link> by keeping each layer&rsquo;s inputs well-scaled. But it does something you did not
          ask for on the side — it <em>regularises</em>. This chapter is about the free generalisation
          BatchNorm hands you, where it comes from, and why it changes how much dropout you should use.</>}
      />

      <div className="lesson">
        <h2>The side effect, measured</h2>
        <p>
          Take the running network — a 3&times;256 MLP on 250 noisy points, AdamW, 400 epochs, three
          seeds — and add nothing but BatchNorm layers. No dropout, no weight decay, no augmentation. Just
          normalise each layer&rsquo;s pre-activations over the batch.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>configuration</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>change</th>
              </tr>
            </thead>
            <tbody>
              {([
                { c: "batchnorm = False", acc: "0.751", delta: "---", best: false },
                { c: "batchnorm = True", acc: "0.763", delta: "+0.012", best: true },
              ] as const).map((r) => (
                <tr key={r.c}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.c}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.best ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.delta.startsWith("+") ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Three-seed average, train accuracy 1.000 throughout, no other regulariser present.
        </p>

        <p>
          BatchNorm lifts test accuracy from 0.751 to 0.763 — a gain of <strong>0.012</strong> with no
          regulariser in sight. That is comparable to what dropout at a modest rate bought, and we did not
          add it for that reason. It is a genuine, if mild, regularisation effect riding along inside a
          layer we included to make training well-behaved.
        </p>

        <h2>Where the effect comes from: noisy statistics</h2>
        <p>
          BatchNorm normalises each feature using the mean and variance <em>of the current minibatch</em>:
        </p>

        <MathBlock>{String.raw`\hat{x}_i = \frac{x_i - \mu_{\mathcal{B}}}{\sqrt{\sigma_{\mathcal{B}}^2 + \epsilon}}, \qquad \mu_{\mathcal{B}} = \frac{1}{m}\sum_{j=1}^{m} x_j, \quad \sigma_{\mathcal{B}}^2 = \frac{1}{m}\sum_{j=1}^{m} (x_j - \mu_{\mathcal{B}})^2`}</MathBlock>

        <p>
          Here is the subtle part. The normalised value <M>{String.raw`\hat{x}_i`}</M> for a given example
          depends not only on that example but on <em>which other examples happen to share its batch</em>.
          Shuffle the data and the same example lands in a different batch, gets normalised against
          different neighbours, and comes out slightly different. The statistics <M>{String.raw`\mu_{\mathcal{B}}`}</M>{" "}
          and <M>{String.raw`\sigma_{\mathcal{B}}^2`}</M> are <em>estimates</em> from a small sample, and
          estimates from small samples are noisy.
        </p>
        <p>
          That noise is the whole story. Every forward pass, each activation is perturbed by an amount that
          depends on the luck of the batch draw — a stochastic jitter injected into the representation,
          much like <Link href="/learn/nn-regularisation/randomly-removing-units" style={link}>dropout</Link>{" "}
          injects a stochastic mask. The network cannot rely on an exact activation value because that value
          wobbles from batch to batch, so it is pushed toward solutions that are robust to the wobble. That
          robustness is generalisation.
        </p>

        <Callout color={CORAL} title={<>BatchNorm is a data-dependent noise source</>}>
          The regularising power of BatchNorm is not in the normalisation itself — it is in the fact that the
          normalising constants are <em>estimated from a random minibatch</em>. The variance of the batch mean
          is <M>{String.raw`\sigma^2/m`}</M>: smaller batches mean noisier statistics mean stronger
          regularisation. This is why BatchNorm&rsquo;s regularising effect fades as the batch grows and why
          very large-batch training often needs an explicit regulariser to compensate.
        </Callout>

        <h2>Why the batch size sets the strength</h2>
        <p>
          The size of the perturbation is governed by how many examples the statistics are averaged over. For
          a batch of <M>{String.raw`m`}</M> examples drawn from a distribution with variance{" "}
          <M>{String.raw`\sigma^2`}</M>, the batch mean has variance <M>{String.raw`\sigma^2/m`}</M>. A batch
          of 8 gives a mean that jitters four times as much as a batch of 32. So the same BatchNorm layer is a
          strong regulariser at batch size 8 and a weak one at batch size 512 — the noise you are relying on
          literally averages away as the batch grows.
        </p>
        <p>
          This is a real, practical dial. If BatchNorm is your only regulariser and you scale up the batch for
          throughput, you quietly turn the regularisation off and may see the test gap widen. The fix is
          either to add an explicit regulariser back, or to use a normalisation whose statistics do not depend
          on batch composition when the batch has to be large.
        </p>

        <h2>The consequence: you need less dropout</h2>
        <p>
          Because BatchNorm and dropout both work by injecting noise, they compete for the same job — and can
          get in each other&rsquo;s way. Stacking a strong dropout on top of BatchNorm is stacking two
          noise sources of the <em>same</em> kind, exactly the interference the{" "}
          <Link href="/learn/nn-regularisation/interactions" style={link}>previous chapter</Link> measured
          when jitter dragged wd+dropout from 0.781 down to 0.774. The two also disagree about variance: dropout
          changes the variance of activations at train time, which shifts the very statistics BatchNorm is
          trying to estimate, so the two layers can fight over the numbers.
        </p>
        <p>
          The practical rule that falls out of this: <strong>when you use BatchNorm, reach for less
          dropout</strong>, or place dropout only where BatchNorm is not — and always tune the two together
          rather than setting each to the value you would use alone. BatchNorm has already spent part of your
          noise budget for you.
        </p>

        <Proof color={CORAL} title="why minibatch statistics act as data-dependent noise">
          <p>
            Consider a single feature with true population mean <M>{String.raw`\mu`}</M> and variance{" "}
            <M>{String.raw`\sigma^2`}</M>. On a minibatch of <M>{String.raw`m`}</M> i.i.d. examples, the
            estimated mean is <M>{String.raw`\mu_{\mathcal{B}} = \frac{1}{m}\sum_j x_j`}</M>. Its expectation
            is the true mean, <M>{String.raw`\mathbb{E}[\mu_{\mathcal{B}}] = \mu`}</M>, but its variance is
          </p>
          <MathBlock>{String.raw`\operatorname{Var}(\mu_{\mathcal{B}}) = \frac{1}{m^2}\sum_{j=1}^{m}\operatorname{Var}(x_j) = \frac{\sigma^2}{m}.`}</MathBlock>
          <p>
            So the quantity subtracted during normalisation is not the fixed constant <M>{String.raw`\mu`}</M>{" "}
            but a random variable centred on <M>{String.raw`\mu`}</M> with spread{" "}
            <M>{String.raw`\sigma/\sqrt{m}`}</M>. A given example is therefore normalised as{" "}
            <M>{String.raw`\hat{x} = (x - \mu_{\mathcal{B}})/\sqrt{\sigma_{\mathcal{B}}^2 + \epsilon}`}</M>,
            and because <M>{String.raw`\mu_{\mathcal{B}}`}</M> (and <M>{String.raw`\sigma_{\mathcal{B}}^2`}</M>)
            shift with the batch draw, <M>{String.raw`\hat{x}`}</M> is effectively the clean normalised value
            plus a mean-zero noise term of scale <M>{String.raw`\propto \sigma/\sqrt{m}`}</M>. That is a
            multiplicative-and-additive stochastic perturbation applied to every activation on every step —
            structurally the same mechanism by which dropout regularises, with a strength that scales as{" "}
            <M>{String.raw`1/\sqrt{m}`}</M> and therefore vanishes as the batch grows.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>BatchNorm was added to the network purely to stabilise training, yet test accuracy rose
                from 0.751 to 0.763 with no other regulariser. Where does that gain come from?</>,
              options: [
                "Normalising the activations directly removes overfitting",
                "The batch statistics are estimated from a random minibatch, so each activation is perturbed by batch-draw noise — a stochastic jitter that regularises like dropout",
                "BatchNorm reduces the number of parameters in the network",
              ],
              answer: 1,
              explain: <>The regularisation is not in the normalisation but in the noisiness of the constants
                doing it. Because μ and σ² are sampled from whichever examples share the batch, each example&rsquo;s
                normalised value wobbles from batch to batch, injecting exactly the kind of stochastic
                perturbation that pushes the network toward robust, generalising solutions.</>,
            },
            {
              q: <>You increase the batch size from 32 to 512 for faster training and, with BatchNorm as your
                only regulariser, the test gap widens. Why?</>,
              options: [
                "Larger batches always overfit",
                "The variance of the batch statistics is σ²/m, so a bigger batch gives less noisy statistics and therefore weaker regularisation",
                "BatchNorm stops working entirely above batch size 256",
              ],
              answer: 1,
              explain: <>The regularising noise scales as σ/√m. A 16× larger batch makes the batch mean four
                times less noisy, so BatchNorm&rsquo;s implicit regularisation fades. Large-batch training often
                needs an explicit regulariser added back to compensate.</>,
            },
            {
              q: <>Why is it often a mistake to combine strong dropout with BatchNorm at the rates you would
                use for each alone?</>,
              options: [
                "Dropout and BatchNorm cannot be used in the same network",
                "They both inject noise (the same failure mode), so stacking them at full strength risks over-regularisation, and dropout also disturbs the very statistics BatchNorm estimates",
                "BatchNorm requires dropout to be exactly zero to function",
              ],
              answer: 1,
              explain: <>BatchNorm has already spent part of your noise budget. Adding full-strength dropout
                stacks a second same-kind noise source — the interference the previous chapter measured — and
                dropout shifts the activation variance BatchNorm is trying to normalise. Use less dropout with
                BatchNorm, and tune the two together.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/interactions", label: <>&larr; The interaction between techniques</> }}
          next={{ href: "/learn/nn-regularisation/the-playbook", label: <>Next up &middot; The regularisation playbook &rarr;</> }}
        />
      </div>
    </article>
  );
}
