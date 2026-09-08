import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "When BatchNorm helps, and when it does not — Manifold",
  description:
    "BatchNorm's home turf is deep conv nets with large batches. It struggles with small batches, batch size one, RNNs, and settings where coupling examples is a problem. On a shallow tabular task, plain He init is already fine.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhenBatchNormHelpsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>When BatchNorm helps, and when it does not</>}
        intro={<>BatchNorm is not a universal upgrade you sprinkle on every network. It has a home turf
          where it is close to essential, and several regimes where it degrades or actively hurts. This
          chapter draws that map honestly — including a measurement on this track&rsquo;s own tabular
          problem, where the plain He-initialised network needs no BatchNorm at all.</>}
      />

      <div className="lesson">
        <h2>Where it helps: deep conv nets, large batches</h2>
        <p>
          BatchNorm&rsquo;s home is the deep convolutional network trained with a reasonably large batch —
          the setting it was invented in and the setting where its payoff is largest. There the benefits
          from the earlier chapters all compound: a much larger stable learning rate, markedly faster
          convergence, and some regularisation for free. The batch is large enough (dozens to hundreds of
          examples) that the per-channel statistics <M>{String.raw`\mu_B, \sigma_B^2`}</M> are estimated
          well, and the network is deep enough that controlling the per-layer scale genuinely matters.
          Modern image classifiers were, for years, essentially unthinkable without it.
        </p>
        <p>
          The key phrase is <em>reasonably large batches</em>. BatchNorm&rsquo;s entire mechanism rests
          on the batch statistics being a good estimate of the population statistics. That assumption is
          what fails in the regimes below.
        </p>

        <h2>Where it struggles or hurts</h2>
        <p>
          <strong>Small batches.</strong> With only a handful of examples per batch, the mean and
          variance are noisy, and every layer is standardised by a poor estimate. The noise that was a
          mild regulariser at batch 128 becomes a source of instability at batch 4, and the whole method
          degrades. This is the most common practical reason to reach for a different normalisation.
        </p>
        <p>
          <strong>Batch size one / online / streaming.</strong> The pathological limit of small batches.
          A single example has zero variance; there is nothing to normalise across. BatchNorm has no
          sensible training-time behaviour here at all.
        </p>
        <p>
          <strong>RNNs and variable-length sequences.</strong> Recurrent networks apply the same
          transformation at every time step, and sequences in a batch have different lengths. There is no
          clean, consistent batch axis to normalise over across time — the statistics you would want at
          step 40 have far fewer examples than at step 1, and they differ step to step. BatchNorm does
          not fit the shape of the problem, which is a large part of why LayerNorm was developed for
          sequence models.
        </p>
        <p>
          <strong>Coupling examples in a batch.</strong> BatchNorm makes each example&rsquo;s normalised
          output depend on the other examples in its batch. Usually harmless, this becomes a real problem
          when that dependence leaks information or breaks an assumption — some contrastive and
          metric-learning setups, where examples in a batch are supposed to be treated independently, can
          be corrupted by the batch coupling. It is a subtle, leakage-like failure that is easy to miss.
        </p>

        <Callout color={CORAL} title={<>The one-line summary</>}>
          BatchNorm is a large-batch, fixed-shape-input technique. The moment the batch is small, the
          batch axis is ill-defined, or examples must not influence one another, its central assumption —
          that batch statistics estimate population statistics well and independently — breaks.
        </Callout>

        <h2>Measured: on a shallow tabular task, plain init is already fine</h2>
        <p>
          It is worth seeing directly that BatchNorm is not free upside on every problem. Here is the
          two-moons task from this track, depth swept with width fixed at 32, He initialisation, Adam,
          five seeds — and <strong>no normalisation anywhere</strong>:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>depth</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy (no norm)</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>change from depth 2</th>
              </tr>
            </thead>
            <tbody>
              {([
                { d: 2, acc: "0.953", delta: "---", best: true },
                { d: 4, acc: "0.945", delta: "-0.008", best: false },
                { d: 6, acc: "0.944", delta: "-0.009", best: false },
                { d: 8, acc: "0.936", delta: "-0.017", best: false },
                { d: 10, acc: "0.938", delta: "-0.015", best: false },
                { d: 12, acc: "0.939", delta: "-0.014", best: false },
                { d: 16, acc: "0.931", delta: "-0.022", best: false },
              ] as const).map((r) => (
                <tr key={r.d}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.d}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.best ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Width 32, He init, Adam, 5 seeds, two-moons.
        </p>

        <p>
          Read the decline honestly. From depth 2 (0.953) to depth 16 (0.931) the plain network loses
          only <strong>0.022</strong> — a gentle slide, not a collapse. With He initialisation the deep
          net degrades slowly rather than falling apart, and BatchNorm&rsquo;s job here would be to
          recover that fraction of a percent. On a two-dimensional, shallow, single-boundary problem
          there is simply not much for it to fix: the scale drift is small, the batch is large, and the
          network is not deep enough for the per-layer control to earn its keep.
        </p>
        <p>
          This is the honest scoping point. BatchNorm&rsquo;s payoff <em>grows with depth</em> and with
          the convolutional, large-batch regime; it does not grow here. Do not read the deep-learning
          reputation of BatchNorm and conclude it will rescue a shallow tabular model — on this problem a
          plain He-initialised net is already fine, and the right lesson is to match the tool to the
          regime.
        </p>

        <Proof color={CORAL} title="why small-batch statistics make BatchNorm's estimates high-variance">
          <p>
            BatchNorm normalises with the sample mean of <M>{String.raw`m`}</M> examples. For a feature
            with true variance <M>{String.raw`\sigma^2`}</M>, the variance of that sample mean is
          </p>
          <MathBlock>{String.raw`\operatorname{Var}\bigl[\mu_B\bigr] = \operatorname{Var}\!\left[\frac{1}{m}\sum_{i=1}^{m} x_i\right] = \frac{\sigma^2}{m}.`}</MathBlock>
          <p>
            The estimate&rsquo;s variance is inversely proportional to the batch size{" "}
            <M>{String.raw`m`}</M>. At <M>{String.raw`m = 128`}</M> the mean is a tight estimate; at{" "}
            <M>{String.raw`m = 4`}</M> it is <M>{String.raw`128/4 = 32`}</M> times as variable, and the
            sample variance <M>{String.raw`\sigma_B^2`}</M> is even noisier (its fluctuations scale
            roughly like <M>{String.raw`1/m`}</M> as well). Because every forward pass divides by that
            noisy <M>{String.raw`\sqrt{\sigma_B^2 + \varepsilon}`}</M>, the normalisation itself jitters
            from batch to batch. Small <M>{String.raw`m`}</M> therefore does not merely add a little
            regularising noise — it makes the core operation unreliable, which is the formal reason
            BatchNorm degrades in the small-batch regime and why the batch-independent methods of the
            next chapters exist.
          </p>
        </Proof>

        <h2>Where this points next</h2>
        <p>
          The failures above are not a verdict against normalisation — they are a map of where BatchNorm
          specifically, with its dependence on a large, well-defined batch axis, runs out of road. Every
          one of those regimes (small batches, sequences, per-example independence) has a normalisation
          designed for it that does <em>not</em> normalise over the batch. That is exactly the subject of
          the next chapter: layer normalisation, the first of the batch-free methods built for the
          settings where BatchNorm fails.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is BatchNorm&rsquo;s &ldquo;home turf,&rdquo; where its benefit is largest?</>,
              options: [
                "Shallow tabular models trained with small batches",
                "Deep convolutional networks trained with reasonably large batches",
                "Recurrent networks on variable-length sequences",
              ],
              answer: 1,
              explain: <>BatchNorm was invented for, and pays off most in, deep conv nets with large
                batches: the batch is big enough for the per-channel statistics to be reliable, and the
                network is deep enough that controlling the per-layer scale matters. Its two struggle
                cases are the other two options.</>,
            },
            {
              q: <>On the measured two-moons sweep with no normalisation, test accuracy goes from 0.953
                at depth 2 to 0.931 at depth 16. What is the honest conclusion?</>,
              options: [
                "BatchNorm is useless and should never be used",
                "On this shallow, large-batch tabular problem the plain He-initialised net degrades only gently (−0.022), so BatchNorm has little to fix here; its payoff grows with depth and the conv/large-batch regime",
                "The deep network has collapsed, proving BatchNorm is mandatory",
              ],
              answer: 1,
              explain: <>The plain net loses just 0.022 across depth 2 to 16 — a slow decline, not a
                collapse — because He init keeps the shallow tabular net healthy. BatchNorm would recover
                only that sliver here. Its real value shows up on deeper convolutional networks with
                large batches, not on this problem.</>,
            },
            {
              q: <>Why does BatchNorm degrade specifically when the batch size is small?</>,
              options: [
                "Small batches make the learned γ and β overfit",
                "The variance of the batch-mean estimate is σ²/m, so a small m makes the batch statistics high-variance and the normalisation itself jitters unreliably",
                "Small batches cause the running statistics to stop updating",
              ],
              answer: 1,
              explain: <>BatchNorm assumes the batch statistics estimate the population statistics well.
                Since Var[μ_B] = σ²/m, halving m doubles the estimate&rsquo;s variance; at m = 4 the mean
                is ~32× noisier than at m = 128, and the variance estimate is noisier still. Dividing by
                that noisy standard deviation every pass makes the operation unstable.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/batchnorm-at-test", label: <>&#8592; BatchNorm at test time</> }}
          next={{ href: "/learn/initialisation-and-normalisation/layer-norm", label: <>Next up &middot; Layer normalisation &#8594;</> }}
        />
      </div>
    </article>
  );
}
