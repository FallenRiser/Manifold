import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { SweepCurve } from "@/components/figures/SweepCurve";
import { DECAY_SGD, DECAY_ADAMW } from "@/components/figures/nnReg/data";

export const metadata = {
  title: "How much decay — Manifold",
  description:
    "Tuning weight decay: sweep on a log scale from 1e-4 to 1e-1 and watch validation. On the regression the optimum keeps improving out to 0.3; on the memorising classifier weight decay barely moves the metric at any strength. Recognising which case you are in is the real skill.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function HowMuchDecayPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Weight decay", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>How much decay</>}
        intro={<>You have one knob and a range to search. The mechanics of tuning weight decay are
          simple — sweep on a log scale, watch validation, keep the best. The judgement is harder:
          knowing whether weight decay is even the right lever for your problem, because on some problems
          it improves things steadily and on others it does almost nothing regardless of how hard you
          turn it. This page shows you both, side by side.</>}
      />

      <div className="lesson">
        <h2>How to search: log scale, watch validation</h2>
        <p>
          Weight decay spans orders of magnitude, so you tune it on a <strong>log scale</strong>: try{" "}
          <M>{String.raw`10^{-4}, 10^{-3}, 10^{-2}, 10^{-1}`}</M> — roughly one value per decade — hold a
          validation set out, and read the validation metric at each. Anything finer than one point per
          decade is usually wasted early on; you are looking for the decade where the curve turns, and
          you refine only around that. A typical useful range is <M>{String.raw`10^{-4}`}</M> to{" "}
          <M>{String.raw`10^{-1}`}</M>. Below <M>{String.raw`10^{-4}`}</M> the decay is indistinguishable
          from zero; much above <M>{String.raw`10^{-1}`}</M> and it usually starts underfitting, pulling
          the weights so hard toward zero that the model can no longer represent the signal.
        </p>

        <h2>Case one: a problem where decay steadily helps</h2>
        <p>
          On the noisy regression from two pages ago, the sweep behaves the way the textbook promises.
          Reading the validation (test) MSE as the decay climbs:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>weight decay</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test MSE</th>
              </tr>
            </thead>
            <tbody>
              {([
                { wd: "0.0", te: "0.0535" },
                { wd: "0.001", te: "0.0542" },
                { wd: "0.01", te: "0.0516" },
                { wd: "0.03", te: "0.0511" },
                { wd: "0.1", te: "0.0478" },
                { wd: "0.3", te: "0.0412" },
              ] as const).map((r) => (
                <tr key={r.wd}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.wd}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.te === "0.0412" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.te}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Over-wide MLP on 60 noisy points, AdamW.
        </p>

        <p>
          The test MSE keeps falling as the decay rises, all the way out to <M>{String.raw`0.3`}</M> —
          past the <M>{String.raw`10^{-1}`}</M> that a first sweep would stop at. That is the tell that you
          should <strong>extend the sweep</strong>: if the metric is still improving at the edge of your
          range, the optimum is further out, and you push another decade before declaring a winner. Here
          weight decay is unambiguously the binding regulariser — its magnitude directly controls how
          much the over-wide network overfits the noise, so turning the knob moves the result.
        </p>

        <SweepCurve
          points={DECAY_SGD}
          log
          xlabel="weight decay (log scale) — SGD + momentum"
          xticks={[0.0001, 0.001, 0.005, 0.01, 0.05]}
          caption={<>The search done properly: a log-spaced sweep, read on validation. This is what a
            <em> mild</em> effect looks like — a rise of three thousandths from 0.768 to 0.771, a peak
            at 1e-2, and a fall after it. The peak is real and reproducible, and it is also small
            enough that a reader should be asking whether it survives a different seed. Hold that
            thought for the next case.</>}
        />

        <h2>Case two: a problem where decay barely matters</h2>
        <p>
          Now the classifier this track is built around — the 3&times;256 MLP on 250 noisy points — swept
          the same way. Two optimisers, and the honest result is that <em>nothing much happens</em>.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 440 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>weight decay</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>SGD + momentum</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>full-batch AdamW</th>
              </tr>
            </thead>
            <tbody>
              {([
                { wd: "0.0", sgd: "0.768", adam: "0.755" },
                { wd: "0.005", sgd: "0.770", adam: "—" },
                { wd: "0.01", sgd: "0.771", adam: "0.751" },
                { wd: "0.05", sgd: "0.767", adam: "—" },
                { wd: "0.1", sgd: "—", adam: "0.753" },
              ] as const).map((r) => (
                <tr key={r.wd}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.wd}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.sgd === "0.771" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.sgd}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.adam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          3&times;256 MLP, 250 points, 10% label noise.
        </p>

        <p>
          Under SGD with momentum, the whole sweep lives inside a band of width{" "}
          <strong>0.004</strong>: 0.768 at no decay, a best of 0.771 at 0.01, back down to 0.767 by 0.05.
          Under full-batch AdamW the metric is effectively <strong>inert</strong> — 0.755, 0.751, 0.753 —
          moving less than the seed-to-seed noise. You could sweep this knob all day and never find the
          0.02-point gain that dropout will hand you in the next chapter. On this problem, weight decay is
          simply not the binding regulariser.
        </p>

        <SweepCurve
          points={DECAY_ADAMW}
          log
          markBest={false}
          xlabel="weight decay (log scale) — full-batch AdamW"
          xticks={[0.01, 0.1]}
          caption={<>The same knob, the same network, a different optimiser and batching — and the
            curve is flat within noise across four orders of magnitude, with the largest decay ending
            marginally <em>below</em> the smallest. Two reasons, and both are in the setup rather than
            in the idea of weight decay: full-batch training gives only ~400 steps, so the per-step
            shrinkage never compounds; and the network memorises these 250 points with small weights
            anyway, so there is no large weight for the penalty to find. A regulariser that does
            nothing is not a broken regulariser — it is a regulariser aimed at a failure this run does
            not have.</>}
        />

        <h2>Why the two problems differ</h2>
        <p>
          The mechanism is worth stating plainly, because it is the actual skill this page is teaching.
          Weight decay penalises weight <em>magnitude</em>. It helps exactly when magnitude is what is
          driving the overfitting. The over-wide regression net overfits by making its weights large
          enough to wiggle through every noisy point, so constraining magnitude directly attacks the
          problem. The classifier is different: it interpolates its 250 points with{" "}
          <strong>already-small weights</strong>, memorising through the sheer number of units rather than
          through large individual weights. Shrinking weights that are not large to begin with removes
          almost none of the capacity it is using to memorise, so the metric does not move.
        </p>

        <Callout color={CORAL} title={<>The real question is not &ldquo;how much&rdquo; but &ldquo;is this the right lever&rdquo;</>}>
          Tuning weight decay is trivial once you accept that most of the outcome is decided before you
          start sweeping — by whether magnitude controls overfitting on your problem. Run one quick sweep
          across three or four decades. If the validation curve moves, you have found your regulariser and
          you refine around the best decade (extending the range if it is still improving at the edge, as
          the regression was). If the curve is flat — as it is for the classifier here — stop. Weight
          decay is not your bottleneck, and the honest move is to reach for a different tool, which on this
          problem is <Link href="/learn/nn-regularisation/randomly-removing-units" style={link}>dropout</Link>.
        </Callout>

        <Proof color={CORAL} title="why the optimal decay grows as the training set shrinks">
          <p>
            Model the data term near the optimum as a quadratic,{" "}
            <M>{String.raw`\mathcal{L}_{\text{data}}(\mathbf{w}) \approx \tfrac{1}{2}(\mathbf{w}-\mathbf{w}^\star)^\top \mathbf{H}(\mathbf{w}-\mathbf{w}^\star)`}</M>,
            where the curvature <M>{String.raw`\mathbf{H}`}</M> is a sum of per-example contributions, so
            it scales with the number of training points: <M>{String.raw`\mathbf{H} \approx n\,\bar{\mathbf{H}}`}</M>
            for an average per-example curvature <M>{String.raw`\bar{\mathbf{H}}`}</M>. Adding the penalty{" "}
            <M>{String.raw`\lambda\lVert\mathbf{w}\rVert^2`}</M> shifts the minimiser to
          </p>
          <MathBlock>{String.raw`\mathbf{w}_\lambda = (\mathbf{H} + 2\lambda \mathbf{I})^{-1}\mathbf{H}\,\mathbf{w}^\star.`}</MathBlock>
          <p>
            The amount of shrinkage is governed by the ratio{" "}
            <M>{String.raw`2\lambda / \text{eig}(\mathbf{H}) \approx 2\lambda / (n\,\text{eig}(\bar{\mathbf{H}}))`}</M>.
            To hold that ratio — the effective regularisation strength — fixed as{" "}
            <M>{String.raw`n`}</M> changes, <M>{String.raw`\lambda`}</M> must scale like{" "}
            <M>{String.raw`n`}</M>: fewer training points means the data term pushes back with less
            curvature, so a <em>larger</em> <M>{String.raw`\lambda`}</M> is needed to impose the same
            constraint on the weights. This is the precise sense in which small datasets need more decay:
            with less data to pin the weights down, the prior toward small weights has to do more of the
            work. It is also why the over-wide net on just 60 regression points wanted decay as large as
            0.3, out at the far end of the usual range.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is the recommended way to search for a good weight-decay value?</>,
              options: [
                "Linearly from 0 to 1 in steps of 0.05",
                "On a log scale, roughly one value per decade from 1e-4 to 1e-1, choosing by validation, and extending the range if the metric is still improving at the edge",
                "Set it to 0.5 by default and never tune it",
              ],
              answer: 1,
              explain: <>Weight decay spans orders of magnitude, so you sweep it geometrically —{" "}
                <M>{String.raw`10^{-4}, 10^{-3}, 10^{-2}, 10^{-1}`}</M> — read validation at each, and
                refine around the best decade. If the curve is still falling at the edge (as the
                regression was at 0.3), push another decade out.</>,
            },
            {
              q: <>On the 3×256 classifier, SGD gave 0.768 → 0.771 → 0.767 across the sweep and AdamW was
                essentially flat. Why does weight decay barely help here?</>,
              options: [
                "The learning rate was too low for the decay to take effect",
                "The classifier interpolates its 250 points with already-small weights, so shrinking magnitude removes almost none of the capacity it uses to memorise — magnitude is not what is driving the overfitting",
                "Weight decay never helps classification, only regression",
              ],
              answer: 1,
              explain: <>Weight decay penalises magnitude, so it helps only when magnitude drives
                overfitting. The over-wide regression net overfits with large weights; the classifier
                memorises through many small-weight units. Shrinking small weights barely touches its
                effective capacity, so the metric does not move under any optimiser.</>,
            },
            {
              q: <>All else equal, how should the optimal weight decay change if you halve the size of the
                training set?</>,
              options: [
                "It should roughly halve — less data means less to regularise",
                "It should roughly double — with less data the loss curvature is smaller, so a larger λ is needed to impose the same constraint on the weights",
                "It should stay exactly the same — the optimum does not depend on dataset size",
              ],
              answer: 1,
              explain: <>The data-term curvature scales with the number of points, so the effective
                strength depends on <M>{String.raw`\lambda / n`}</M>. Holding that fixed means{" "}
                <M>{String.raw`\lambda`}</M> scales with <M>{String.raw`n`}</M>: fewer points, more decay,
                because the prior toward small weights must do more of the work.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/weight-decay-vs-l2", label: <>&#8592; Weight decay is not L2 regularisation</> }}
          next={{ href: "/learn/nn-regularisation/landscape-effect", label: <>Next up &middot; The effect on the loss landscape &#8594;</> }}
        />
      </div>
    </article>
  );
}
