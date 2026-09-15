import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Dumbbell } from "@/components/figures/Dumbbell";
import { CodeOutput } from "@/components/CodeOutput";
import { ACC_VS_DEPTH } from "@/components/figures/initNorm/data";

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

        <PredictPrompt
          accent={CORAL}
          prompt={<>Two-moons, width 32, He init, depth swept from 2 to 20, with and without
            BatchNorm. How much accuracy does BatchNorm buy?</>}
          options={[
            "Several points, growing with depth",
            "About a point, growing with depth",
            "Under a point, and nothing at depth 20",
            "Nothing at any depth",
          ]}
          nudge="Locked in. Both columns are below, from the same trainer."
        />

        <Dumbbell
          rows={ACC_VS_DEPTH.map((r) => ({ init: `depth ${r.depth}`, a: r.noBn, b: r.bn }))}
          seriesLabels={["no normalisation", "with BatchNorm"]}
          caption={<>Test accuracy against depth, three seeds, both columns from the same hand-rolled
            trainer so the comparison is like for like. The gain is <strong>+0.008 at best</strong>,
            it does not grow with depth, and at depth 20 BatchNorm is <strong>0.013 behind</strong>.
            This is the honest result on this problem and the track is not going to dress it up.</>}
        />
        <CodeOutput source="scripts/init_norm_train.py" label="test accuracy vs depth, He init, 3 seeds">{`  depth     no BN   with BN     gain
------------------------------------
      2    0.9450    0.9450  +0.0000
      4    0.9400    0.9467  +0.0067
      8    0.9383    0.9467  +0.0083
     12    0.9483    0.9500  +0.0017
     16    0.9433    0.9450  +0.0017
     20    0.9433    0.9300  -0.0133`}</CodeOutput>

        <p>
          Read that honestly, because it is the opposite of the reputation. On a two-dimensional,
          single-boundary problem with a large batch and a network that is deep but not wide, the plain
          He-initialised network is already fine, and BatchNorm has almost nothing to fix. It does not
          collapse at depth — it simply never had a gap to close.
        </p>
        <p>
          So if the accuracy column is flat, why is BatchNorm in every architecture you have ever read
          about? Because accuracy on a well-initialised network is the wrong column to look at. The one
          that moves is <Link href="/learn/initialisation-and-normalisation/why-norm-reduces-sensitivity" style={link}>how
          much the initialisation still matters</Link> — and there the same sweep collapses a spread of
          0.475 down to 0.008. BatchNorm is not buying accuracy here. It is buying the right to stop
          thinking about the starting point, which is worth more on a real problem than a hundredth of
          a point ever was.
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
