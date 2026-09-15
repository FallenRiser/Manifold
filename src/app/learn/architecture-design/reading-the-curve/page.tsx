import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { DiagnosticPanels } from "@/components/figures/arch/ArchFigures";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "Reading the learning curve — Manifold",
  description:
    "The training loss curve and the validation loss curve together tell you everything about whether to make the model bigger, smaller, or differently configured. Here is how to read them.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ReadingTheCurvePage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Diagnostics", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>Reading the learning curve</>}
        intro={
          <>
            Architecture search without diagnostics is guesswork. The single most informative
            diagnostic is the learning curve — training loss and validation loss plotted against
            epoch. This chapter teaches you to read it: four patterns, each with a clear
            prescription.
          </>
        }
      />

      <div className="lesson">
        <h2>What you are looking at</h2>
        <p>
          A learning curve has two lines. The <strong>training loss</strong> is the loss computed on
          the data the optimiser actually sees — the batches it computes gradients from. The{" "}
          <strong>validation loss</strong> (or test loss, in simple setups) is computed on a held-out
          set that the optimiser never touches. Both are plotted against training time, usually
          measured in epochs.
        </p>
        <p>
          The training loss tells you how well the model is fitting the data it has seen. The
          validation loss tells you how well that fit generalises. The <strong>gap</strong> between
          them — training loss minus validation loss, or equivalently, training accuracy minus test
          accuracy — measures overfitting: how much of the training-set performance is real versus
          memorised.
        </p>

        <MathBlock>{String.raw`\text{gap} = \mathcal{L}_{\text{train}} - \mathcal{L}_{\text{val}} \quad\text{or}\quad \text{acc}_{\text{train}} - \text{acc}_{\text{test}}`}</MathBlock>

        <DiagnosticPanels
          caption={<>The four patterns, measured rather than sketched: one 40-point training set, one
            optimiser, four configurations, with train and held-out accuracy sampled every 10 epochs
            inside a single 400-epoch run. They are drawn on a shared axis so that the differences
            between panels are real differences and not a change of scale. Everything the rest of
            this page says is a description of one of these four shapes.</>}
        />

        <h2>Pattern 1: underfitting</h2>
        <p>
          Both curves are high and flatten together. The training loss plateaus well above the
          level you expect for a good fit, and the validation loss tracks it closely — the gap is
          small, but that is not reassuring, because both numbers are bad.
        </p>
        <p>
          Measured example: a 1-layer, 4-unit network on two-moons. Training loss plateaus at{" "}
          <strong>0.321</strong>. Training accuracy 0.862, test accuracy 0.845, gap 0.017. The gap
          is tiny — there is almost no overfitting — but 0.862 on a problem that a good model
          solves at 0.953 means the model is too simple to capture the boundary shape.
        </p>

        <Callout color={CORAL} title={<>Small gap is not always good news</>}>
          A common mistake is to see a small train-test gap and declare the model well-fitted. The
          gap only measures <em>overfitting</em>; it says nothing about <em>underfitting</em>. A
          model with 50% accuracy and a 0.1% gap is underfitting catastrophically — it has learned
          almost nothing, so there is nothing to overfit. Always read the gap in context of the
          absolute level of performance.
        </Callout>

        <p>
          <strong>Prescription:</strong> increase capacity. Wider layers are the first knob (add
          units). Deeper architectures are the second (add layers). Do not regularise — the model is
          already too constrained.
        </p>

        <h2>Pattern 2: good fit</h2>
        <p>
          Training loss drops to a low level, validation loss follows it closely, and both
          stabilise. The gap is small, and the absolute level is satisfactory for the problem.
        </p>
        <p>
          Measured example: a 2-layer, 32-unit network (1,185 parameters). Training loss reaches{" "}
          <strong>0.126</strong>. Training accuracy 0.953, test accuracy 0.945, gap 0.008. The model
          has enough capacity to learn the boundary and not so much that it memorises noise.
        </p>
        <p>
          <strong>Prescription:</strong> you are done (for the architecture search). If you need
          better performance, the problem is probably data, features, or framing — not the model
          size. This is the state you are aiming for.
        </p>

        <h2>Pattern 3: overfitting</h2>
        <p>
          Training loss drops to a very low level — often lower than in the good-fit case — but
          validation loss diverges: it decreases initially, reaches a minimum, then rises. The gap
          widens with continued training.
        </p>
        <p>
          Measured example: a 3-layer, 128-unit network (33,537 parameters). Training loss reaches{" "}
          <strong>0.104</strong> — lower than the good-fit model — but test accuracy is 0.945, the
          same as the smaller model. The gap is 0.010. On this clean, easy problem, the overfitting
          is mild — the moons signal is so strong that even a 33,000-parameter model cannot
          memorise much beyond it.
        </p>
        <p>
          On harder problems with noise, limited data, or high-dimensional inputs, the pattern is
          more dramatic: validation loss climbs steeply while training loss approaches zero, and
          the gap can reach tens of percentage points.
        </p>
        <p>
          <strong>Prescription:</strong> regularise (dropout, weight decay, early stopping) or
          reduce capacity. The model has enough representational power — it is using the excess to
          fit noise.
        </p>

        <h2>Pattern 4: training failure</h2>
        <p>
          Both curves are noisy, unstable, or fail to converge. The loss may oscillate, spike, or
          plateau at a high level despite the model having ample capacity. This is usually not an
          architecture problem — it is an optimisation problem.
        </p>
        <p>
          Common causes: learning rate too high (loss oscillates or diverges), learning rate too
          low (loss decreases glacially), batch size too small (extreme gradient noise), numerical
          issues (NaN in the loss, often from exploding gradients or log of zero). The fix is in
          the training configuration, not the architecture.
        </p>
        <p>
          <strong>Prescription:</strong> before changing the architecture, check the learning rate
          (try 10x lower), the batch size (try 2x larger), and the loss function (are you computing
          it correctly?). An architecture that cannot be trained is rarely too small or too large —
          it is misconfigured.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Of the four panels above, exactly one has a held-out curve that rises and then
            falls. Which failure does that downturn identify, and why is it the only unambiguous
            signature on the page?</>}
          options={[
            "Underfitting — the model runs out of capacity",
            "Overfitting — and it is unambiguous because no other failure makes held-out performance get worse with more training",
            "A learning rate that is too high",
            "All four panels turn down eventually",
          ]}
          nudge="Locked in. Scroll back up and check which panel has the dashed vertical rule."
        />

        <h2>The loss numbers and the accuracy numbers</h2>
        <p>
          The table below summarises the three measured architectures. Note that the loss and the
          accuracy tell different stories at different scales — loss is always worth tracking even
          when accuracy is your final metric, because it is smoother and shows problems earlier.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                {["architecture", "params", "train acc", "test acc", "gap", "train loss"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)",
                    fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { arch: "1 x 4", params: "17", train: "0.862", test: "0.845", gap: "0.017", loss: "0.321" },
                { arch: "2 x 32", params: "1,185", train: "0.953", test: "0.945", gap: "0.008", loss: "0.126" },
                { arch: "3 x 128", params: "33,537", train: "0.955", test: "0.945", gap: "0.010", loss: "0.104" },
              ].map((r) => (
                <tr key={r.arch}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.arch}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.params}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.train}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.test}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.gap}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.loss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          All models trained on two-moons (1000 train, 200 test) with ReLU, Adam lr=0.001, 200
          epochs, averaged over five seeds.
        </p>

        <Proof color={CORAL} title="why loss is more informative than accuracy during training">
          <p>
            Accuracy is a step function of the model&rsquo;s output: a prediction is right or
            wrong. Small improvements in the model&rsquo;s confidence — moving a prediction from
            51% to 80% — do not change accuracy at all. The loss (cross-entropy, MSE) is continuous
            and differentiable, so it registers every improvement, no matter how small.
          </p>
          <p>
            This means accuracy can plateau for many epochs while the loss is still decreasing: the
            model is becoming more confident on examples it already classifies correctly, which will
            eventually flip borderline examples. Watching only accuracy, you might stop training too
            early or conclude that the model is stuck when it is not.
          </p>
          <p>
            Conversely, accuracy can jump discontinuously when a cluster of borderline examples
            crosses the decision threshold at once, creating the illusion of sudden progress. Loss
            shows the continuous improvement that led to that jump.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: (
                <>
                  A model achieves 0.72 training accuracy and 0.71 test accuracy. The gap is only
                  0.01. Is this a good fit?
                </>
              ),
              options: [
                "Yes — the small gap means the model generalises well",
                "No — the small gap means there is no overfitting, but 0.72 may be underfitting if the problem is solvable at 0.95+",
                "It depends on the number of parameters",
              ],
              answer: 1,
              explain: (
                <>
                  A small gap rules out overfitting but says nothing about underfitting. If the
                  problem admits 0.95 accuracy and the model reaches 0.72, the model is too simple.
                  The prescription is to increase capacity, not to regularise.
                </>
              ),
            },
            {
              q: (
                <>
                  The 3 x 128 model has a gap of only 0.010 on two-moons. Why does the text call it
                  &ldquo;overfitting&rdquo;?
                </>
              ),
              options: [
                "Because any gap above zero is overfitting by definition",
                "Because its test accuracy is lower than the 2 x 32 model's",
                "Because the gap is larger than the 2 x 32 model's gap, and the extra capacity bought lower training loss but no test improvement — the excess is fitting noise",
              ],
              answer: 2,
              explain: (
                <>
                  The 3 x 128 model drives training loss to 0.104 (below the 2 x 32 model&rsquo;s
                  0.126) but test accuracy does not improve. The extra capacity is being used to fit
                  the training set more tightly without benefit to generalisation — mild overfitting.
                  On a noisier problem the gap would be much wider.
                </>
              ),
            },
            {
              q: (
                <>
                  Your training loss oscillates wildly and does not converge. What should you check
                  first?
                </>
              ),
              options: [
                "Whether the model is deep enough",
                "The learning rate — try 10x lower",
                "Whether the model needs skip connections",
              ],
              answer: 1,
              explain: (
                <>
                  Oscillating loss is the classic sign of a learning rate that is too high. The
                  gradient steps are overshooting the minimum and bouncing between walls of the loss
                  landscape. Reducing the learning rate by a factor of 10 is the first diagnostic
                  move.
                </>
              ),
            },
          ]}
        />

        <PrevNext
          prev={{
            href: "/learn/architecture-design/residual-blocks",
            label: <>&larr; Residual blocks in practice</>,
          }}
          next={{
            href: "/learn/architecture-design/underfit-fit-overfit",
            label: <>Next up &middot; Underfit, fit, overfit &rarr;</>,
          }}
        />
      </div>
    </article>
  );
}
