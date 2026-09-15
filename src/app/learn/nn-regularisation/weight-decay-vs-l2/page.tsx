import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { Dumbbell } from "@/components/figures/Dumbbell";
import { WD_VS_L2 } from "@/components/figures/nnReg/data";

export const metadata = {
  title: "Weight decay is not L2 regularisation — Manifold",
  description:
    "For plain SGD, weight decay and an L2 penalty produce the same update. For adaptive optimisers like Adam they do not: L2 in the loss gets scaled by Adam's per-parameter step, while decoupled weight decay (AdamW) shrinks every parameter equally. Measured, same nominal strength, different result.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WeightDecayVsL2Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Weight decay", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>Weight decay is not L2 regularisation</>}
        intro={<>The previous page treated &ldquo;add an L2 penalty&rdquo; and &ldquo;decay the weights a
          little each step&rdquo; as two views of one thing. For plain SGD they genuinely are the same
          update. For Adam — the optimiser you actually use — they are not, and confusing them is a
          real and common bug. This is the point Loshchilov and Hutter made in 2017 when they proposed
          AdamW, and you can measure the difference directly.</>}
      />

      <div className="lesson">
        <h2>Where the two look identical</h2>
        <p>
          Start with plain gradient descent. An L2 penalty <M>{String.raw`\lambda \sum_j w_j^2`}</M> adds{" "}
          <M>{String.raw`2\lambda \mathbf{w}`}</M> to the gradient, so the update is
        </p>

        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} - \eta\bigl(\mathbf{g} + 2\lambda\mathbf{w}\bigr) = \underbrace{(1 - 2\eta\lambda)\mathbf{w}}_{\text{decay}} - \underbrace{\eta\mathbf{g}}_{\text{data step}}`}</MathBlock>

        <p>
          where <M>{String.raw`\mathbf{g} = \nabla_{\mathbf{w}}\mathcal{L}_{\text{data}}`}</M>. That
          right-hand form is <em>literally</em> a weight-decay step: multiply the weight by a constant
          just under one, then subtract the data gradient. Under SGD, then, &ldquo;penalise the squared
          norm in the loss&rdquo; and &ldquo;shrink the weights by a fixed fraction each step&rdquo; are
          not merely similar — they are algebraically the same operation, with{" "}
          <M>{String.raw`\text{decay rate} = 2\eta\lambda`}</M>. This equivalence is why the two names
          are used interchangeably, and why almost everyone assumes it always holds. It does not.
        </p>

        <h2>Where Adam breaks the equivalence</h2>
        <p>
          Adam does not step along the raw gradient. It divides each parameter&rsquo;s step by a running
          estimate of that parameter&rsquo;s own gradient magnitude, <M>{String.raw`\sqrt{\hat{v}_j} + \epsilon`}</M>,
          so parameters with large, noisy gradients take small steps and parameters with small gradients
          take large ones. Now watch what happens to an L2 penalty. Because the penalty is added{" "}
          <em>inside</em> the loss, its gradient <M>{String.raw`2\lambda w_j`}</M> is bundled into{" "}
          <M>{String.raw`\mathbf{g}`}</M> and passed through that same per-parameter divisor:
        </p>

        <MathBlock>{String.raw`\text{Adam + L2:}\qquad w_j \leftarrow w_j - \eta\,\frac{\hat{m}_j + 2\lambda w_j}{\sqrt{\hat{v}_j} + \epsilon}`}</MathBlock>

        <p>
          The effective amount of shrinkage on weight <M>{String.raw`j`}</M> is{" "}
          <M>{String.raw`2\eta\lambda / (\sqrt{\hat{v}_j} + \epsilon)`}</M> — it is{" "}
          <em>divided by that parameter&rsquo;s adaptive denominator</em>. A weight that has been seeing
          large gradients gets decayed <strong>less</strong>; a weight with tiny gradients gets decayed
          more. The regularisation strength is no longer <M>{String.raw`\lambda`}</M> at all; it is a
          different number for every parameter, set by the optimiser&rsquo;s bookkeeping rather than by
          you.
        </p>
        <p>
          Decoupled weight decay fixes this by taking the decay term back out of the loss and applying it
          directly to the weights, <em>outside</em> the adaptive rescaling — which is the &ldquo;W&rdquo;
          in AdamW:
        </p>

        <MathBlock>{String.raw`\text{AdamW:}\qquad w_j \leftarrow (1 - \eta\lambda)\,w_j - \eta\,\frac{\hat{m}_j}{\sqrt{\hat{v}_j} + \epsilon}`}</MathBlock>

        <p>
          Here every weight is multiplied by the same factor <M>{String.raw`(1 - \eta\lambda)`}</M>,
          exactly as in the SGD case, independent of its gradient history. The data step is still
          adaptive; the shrink is uniform. That is the behaviour you almost always want, and it is the
          reason the two should never be treated as interchangeable once you leave plain SGD.
        </p>

        <Dumbbell
          rows={WD_VS_L2.map((r) => ({ init: r.label, a: r.test }))}
          seriesLabels={["test accuracy"]}
          ticks={[0.75, 0.76, 0.77]}
          caption={<>Same network, same data, same seeds, and the same number typed into the same
            slot — <code>1e-3</code>. The two runs are 1.9 points apart. If decoupled decay and an L2
            term in the loss were the same thing, these two dots would be on top of each other; the
            distance between them is the entire content of this page, and the direction is worth
            noting too — the textbook L2 form happens to win here, which is the opposite of the usual
            advice.</>}
        />

        <h2>The same nominal strength, a different result</h2>
        <p>
          This is not a subtlety that only shows up in theory. Take the overfitting classifier this track
          is built around — a 3&times;256 MLP on 250 noisy points — and run it two ways at the{" "}
          <em>same</em> nominal strength <M>{String.raw`10^{-3}`}</M>: once as AdamW&rsquo;s decoupled
          <code> weight_decay</code>, once as an L2 term added to the loss under plain Adam.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 460 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>method (strength 1e-3)</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>train&ndash;test gap</th>
              </tr>
            </thead>
            <tbody>
              {([
                { m: "AdamW decoupled weight decay", acc: "0.751", gap: "0.249" },
                { m: "Adam + L2 added to the loss", acc: "0.770", gap: "0.230" },
              ] as const).map((r) => (
                <tr key={r.m}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.m}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.acc === "0.770" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          3&times;256 MLP, 250 points, 10% label noise.
        </p>

        <p>
          Same number in the config file, different update, different outcome: 0.751 versus 0.770. Neither
          result is large here — this classifier resists weight decay under any optimiser, which is the
          subject of the next two pages — but the <em>gap between the two methods</em> is the whole point.
          A reader who assumed &ldquo;weight decay = L2&rdquo; and read a paper that used one while their
          framework defaulted to the other would be off by exactly this much, silently, and would blame
          the wrong thing.
        </p>

        <Callout color={CORAL} title={<>The practical rule: with Adam, use AdamW&rsquo;s weight_decay, not L2 in the loss</>}>
          If your optimiser is any adaptive method — Adam, RMSProp, Adagrad — reach for the optimiser&rsquo;s
          own decoupled <code>weight_decay</code> argument rather than hand-adding{" "}
          <M>{String.raw`\lambda \lVert \mathbf{w} \rVert^2`}</M> to your loss. In PyTorch that means{" "}
          <code>torch.optim.AdamW</code> (or <code>Adam</code> with the decoupled flag), <em>not</em>{" "}
          <code>Adam</code>&rsquo;s own <code>weight_decay</code> argument, which historically implemented
          the coupled L2 form. Under plain SGD it does not matter — the two coincide — so the SGD{" "}
          <code>weight_decay</code> argument is safe. The distinction only bites with adaptive optimisers.
        </Callout>

        <Proof color={CORAL} title="why the two coincide for SGD but split under Adam">
          <p>
            <strong>SGD.</strong> The L2 penalty contributes gradient{" "}
            <M>{String.raw`2\lambda\mathbf{w}`}</M>, so the update is{" "}
            <M>{String.raw`\mathbf{w} - \eta(\mathbf{g} + 2\lambda\mathbf{w}) = (1-2\eta\lambda)\mathbf{w} - \eta\mathbf{g}`}</M>.
            Decoupled decay applies <M>{String.raw`(1-\eta\lambda')\mathbf{w} - \eta\mathbf{g}`}</M>
            directly. Setting <M>{String.raw`\lambda' = 2\lambda`}</M> makes them identical term for
            term. Because SGD scales every coordinate by the same <M>{String.raw`\eta`}</M>, pushing the
            decay through the loss or applying it outside gives the same result.
          </p>
          <p>
            <strong>Adam.</strong> The update rescales coordinate <M>{String.raw`j`}</M> by{" "}
            <M>{String.raw`1/(\sqrt{\hat{v}_j}+\epsilon)`}</M>. With L2 in the loss, the decay term rides
            through that divisor:
          </p>
          <MathBlock>{String.raw`\Delta w_j^{\text{L2}} = -\eta\,\frac{\hat{m}_j + 2\lambda w_j}{\sqrt{\hat{v}_j}+\epsilon}, \qquad \text{effective decay} = \frac{2\eta\lambda}{\sqrt{\hat{v}_j}+\epsilon}.`}</MathBlock>
          <p>
            The shrink on <M>{String.raw`w_j`}</M> is divided by that parameter&rsquo;s adaptive
            denominator, so it varies across parameters and across training. Decoupled decay instead
            applies
          </p>
          <MathBlock>{String.raw`\Delta w_j^{\text{AdamW}} = -\eta\lambda w_j - \eta\,\frac{\hat{m}_j}{\sqrt{\hat{v}_j}+\epsilon},`}</MathBlock>
          <p>
            in which the shrink term <M>{String.raw`-\eta\lambda w_j`}</M> never touches{" "}
            <M>{String.raw`\hat{v}_j`}</M>. The two agree only when{" "}
            <M>{String.raw`\sqrt{\hat{v}_j}+\epsilon`}</M> is the same constant for every parameter — which
            is exactly the SGD case and never the Adam case. That is why the equivalence is not a general
            fact but an artefact of plain gradient descent.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Under plain SGD, how do an L2 penalty and decoupled weight decay compare?</>,
              options: [
                "They are algebraically the same update, up to a factor of two in the coefficient",
                "L2 always shrinks the weights more than weight decay",
                "They differ because SGD rescales each parameter separately",
              ],
              answer: 0,
              explain: <>For SGD the L2 update is{" "}
                <M>{String.raw`(1-2\eta\lambda)\mathbf{w} - \eta\mathbf{g}`}</M>, which is exactly a
                weight-decay step with decay rate <M>{String.raw`2\eta\lambda`}</M>. SGD scales every
                coordinate by the same <M>{String.raw`\eta`}</M>, so it makes no difference whether the
                decay rides through the loss or is applied outside it.</>,
            },
            {
              q: <>With Adam, why does an L2 penalty behave differently from decoupled weight decay?</>,
              options: [
                "Adam uses a larger learning rate, which amplifies the penalty",
                "The L2 gradient is bundled into the loss gradient and divided by Adam's per-parameter adaptive denominator, so high-gradient parameters get decayed less; decoupled decay shrinks every parameter by the same factor",
                "Adam ignores the L2 term entirely because it only tracks the running mean",
              ],
              answer: 1,
              explain: <>L2-in-the-loss contributes <M>{String.raw`2\lambda w_j`}</M> to the gradient,
                which then passes through Adam&rsquo;s divisor{" "}
                <M>{String.raw`\sqrt{\hat{v}_j}+\epsilon`}</M>. So the effective decay is{" "}
                <M>{String.raw`2\eta\lambda/(\sqrt{\hat{v}_j}+\epsilon)`}</M>, different per parameter.
                AdamW applies <M>{String.raw`(1-\eta\lambda)`}</M> uniformly instead.</>,
            },
            {
              q: <>At the same nominal strength 1e-3, AdamW scored test 0.751 and Adam+L2 scored 0.770.
                What is the lesson?</>,
              options: [
                "L2 is always better than weight decay, so prefer it",
                "The same config number produces genuinely different updates under an adaptive optimiser — you must know which one your framework is applying, and with Adam the recommended default is AdamW's decoupled weight_decay",
                "The difference is measurement noise and can be ignored",
              ],
              answer: 1,
              explain: <>The two are different algorithms once the optimiser is adaptive, so &ldquo;weight
                decay 1e-3&rdquo; is ambiguous until you say which. The practical default with Adam is the
                decoupled form (AdamW); the point of the measurement is that the choice is real, not that
                one number here is best.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/l2-penalty", label: <>&#8592; The L2 penalty on weights</> }}
          next={{ href: "/learn/nn-regularisation/how-much-decay", label: <>Next up &middot; How much decay &#8594;</> }}
        />
      </div>
    </article>
  );
}
