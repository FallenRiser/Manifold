import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LayerTrace } from "@/components/figures/LayerTrace";
import { VAR_BY_LAYER_RELU } from "@/components/figures/initNorm/data";
import { INIT_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The variance argument — Manifold",
  description:
    "The one idea behind every named initialisation: keep the variance of the activations constant across layers. Derive the condition Var(W) = 1/fan_in from the forward pass, and see why ReLU needs the factor of two that becomes He.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheVarianceArgumentPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The starting point matters", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 9 minutes"
        title={<>The variance argument</>}
        intro={<>The previous chapter showed the signal vanishing or exploding as it flows through
          the layers. This chapter fixes it with a single idea: if each layer preserves the variance
          of its activations, they can neither explode nor vanish. That one sentence, made precise,
          gives you the exact scale to initialise the weights at — and it is the argument that every
          named initialisation is built on.</>}
      />

      <div className="lesson">
        <h2>The one condition</h2>
        <p>
          The failure mode is a per-layer scale factor that is not one. So set the target directly:
          make each layer output activations with the <em>same variance</em> as its inputs. If that
          holds at every layer, the variance is constant all the way down the stack — no geometric
          decay, no geometric growth. The scale that comes out of layer 8 is the scale that went into
          layer 1. That is the whole objective, and everything else is working out what it demands of
          the weights.
        </p>

        <h2>Where the variance goes in a linear layer</h2>
        <p>
          Take a single linear layer <M>{String.raw`\mathbf{h} = W\mathbf{x}`}</M>, where each output
          unit sums over <M>{String.raw`n_{\text{in}}`}</M> inputs (the <em>fan-in</em>). Look at one
          output component, <M>{String.raw`h_i = \sum_{j=1}^{n_{\text{in}}} W_{ij}\, x_j`}</M>. It is a
          sum of <M>{String.raw`n_{\text{in}}`}</M> independent products. If the weights are drawn
          independently with mean zero, and are independent of the inputs, the variance of a sum of
          independent zero-mean terms is the sum of their variances:
        </p>

        <MathBlock>{String.raw`\operatorname{Var}(h_i) = \sum_{j=1}^{n_{\text{in}}} \operatorname{Var}(W_{ij} x_j) = n_{\text{in}} \cdot \operatorname{Var}(W)\, \operatorname{Var}(x).`}</MathBlock>

        <p>
          Read that off carefully: the output variance is the input variance{" "}
          <M>{String.raw`\operatorname{Var}(x)`}</M> multiplied by <M>{String.raw`n_{\text{in}} \cdot \operatorname{Var}(W)`}</M>.
          That product is exactly the per-layer scale factor <M>{String.raw`r`}</M> from the last
          chapter, now written in terms of quantities you control. The fan-in is fixed by the
          architecture. The only free knob is the variance of the weights.
        </p>

        <h2>Solving for the weight variance</h2>
        <p>
          You want <M>{String.raw`\operatorname{Var}(h) = \operatorname{Var}(x)`}</M>. Divide it out of
          the equation above and the condition is immediate:
        </p>

        <MathBlock>{String.raw`n_{\text{in}} \cdot \operatorname{Var}(W) = 1 \quad\Longrightarrow\quad \boxed{\operatorname{Var}(W) = \dfrac{1}{n_{\text{in}}}.}`}</MathBlock>

        <p>
          Initialise each weight with variance one over the fan-in — equivalently, standard deviation{" "}
          <M>{String.raw`1/\sqrt{n_{\text{in}}}`}</M> — and a linear layer passes the variance through
          untouched. A wide layer, with many inputs feeding each unit, therefore needs <em>smaller</em>
          weights: the sum runs over more terms, so each term must be smaller to keep the total in
          check. This is why a good initialisation scales with the layer&rsquo;s width rather than
          being a single fixed number.
        </p>

        <Callout color={CORAL} title={<>Var(W) = 1 / fan-in is the whole idea in one line</>}>
          Every named scheme in this track — Xavier, He, LeCun — is a variant of this one condition.
          They differ only in which fan they use (in, out, or the average) and in a small correction
          factor for what the activation does to the variance. The skeleton is always: set the weight
          variance to roughly one over the number of inputs, so each layer neither amplifies nor
          attenuates the signal.
        </Callout>

        <h2>The empirical confirmation — and a warning about ReLU</h2>
        <p>
          The condition was derived for a <em>linear</em> layer. Real networks put a nonlinearity
          after the matrix multiply, and the nonlinearity changes the variance too. So stop arguing
          and measure it: ten layers of width 64, ReLU, and the activation variance read off at
          every layer under four different weight scales.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Xavier was derived, above, to preserve variance exactly. Put it in front of a ReLU
            and track the activation variance from layer 1 to layer 10. What does it do?</>}
          options={[
            "Holds constant — that is what it was derived for",
            "Halves roughly every layer",
            "Doubles roughly every layer",
            "Holds for a few layers, then collapses",
          ]}
          nudge="Locked in. Run it and read the second column."
        />

        <CodeBlock
          setup={INIT_SETUP}
          fromScratch={`# Activation variance at each of 10 hidden layers, width 64, ReLU.
sizes = [2] + [64] * 10 + [1]
scales = ["xavier", "he", 0.01, 1.0]

var = {}
for s in scales:
    params = init_manual(sizes, scale=s, seed=0)
    _, _, acts = forward_activations(X_tr, params, act="relu")
    var[str(s)] = [np.var(a) for a in acts[1:-1]]   # the 10 hidden layers

print("layer " + "".join("%12s" % s for s in scales))
for i in range(10):
    print("%5d " % (i + 1) + "".join("%12.4g" % var[str(s)][i] for s in scales))`}
        />
        <CodeOutput>{`layer       xavier          he        0.01         1.0
    1       0.2457      0.4915   4.915e-05      0.4915
    2       0.1324      0.5296   1.695e-07       16.95
    3      0.07449      0.5959   6.102e-10       610.2
    4      0.03492      0.5586   1.831e-12   1.831e+04
    5      0.02159       0.691   7.245e-15   7.245e+05
    6      0.01431      0.9159   3.073e-17   3.073e+07
    7     0.007446      0.9531   1.023e-19   1.023e+09
    8     0.002484       0.636   2.185e-22   2.185e+10
    9     0.001264      0.6472   7.116e-25   7.116e+11
   10    0.0007801      0.7988    2.81e-27    2.81e+13`}</CodeOutput>

        <LayerTrace
          series={VAR_BY_LAYER_RELU}
          ylabel="activation variance"
          caption={<>Each line is one initialisation, and the y-axis spans forty orders of magnitude.
            The shape is what matters: on a log axis a straight line <em>is</em> geometric decay or
            growth. Three of these four are straight. Only He is flat, and flat is the entire design
            goal — the variance that enters layer 1 is the variance that leaves layer 10.</>}
        />

        <p>
          <strong>Xavier is a straight line sloping down.</strong> It loses roughly half its variance
          per layer — 0.2457 at layer 1, 0.0008 at layer 10, a factor of 315 — and it does that while
          being the scheme explicitly derived to preserve variance. The derivation was not wrong; it
          was a derivation about a linear layer, applied to a layer that is not linear.
        </p>
        <p>
          <strong>He is the flat one.</strong> It wanders between 0.49 and 0.95 and ends where it
          started. Nothing about the network is different except a constant factor on the initial
          weights.
        </p>
        <p>
          The two extreme scales make the same point twice. Scale 1.0 climbs by a factor of roughly 30
          per layer and reaches <M>{String.raw`2.8 \times 10^{13}`}</M>. Scale 0.01 falls by the same
          kind of factor and reaches <M>{String.raw`2.8 \times 10^{-27}`}</M>. That second one is worth
          dwelling on: printed to four decimal places it reads <code>0.0000</code> at every layer and
          looks like a network that has simply switched off. It has not. It is decaying by two to
          three decades per layer under exactly the same geometric law as Xavier — the same straight
          line, drawn steeper. There is no separate &ldquo;vanishing&rdquo; mechanism to learn. There
          is one mechanism, a per-layer scale factor, and every one of these four lines is that factor
          raised to the power of the depth.
        </p>
        <h2>Why ReLU needs a factor of two</h2>
        <p>
          Why does Xavier decay under ReLU when it was designed to preserve variance? Because ReLU
          throws away half of its input. It zeroes every negative pre-activation, so it deletes half
          the distribution before passing the signal on. That halving of the surviving variance is the
          gap Xavier does not account for — and closing it is exactly the factor of two that turns the
          condition into He&rsquo;s. The proof below does the accounting.
        </p>

        <Proof color={CORAL} title="the forward variance-propagation derivation, with the ReLU correction">
          <p>
            <strong>Linear layer.</strong> For output component{" "}
            <M>{String.raw`h_i = \sum_{j=1}^{n_{\text{in}}} W_{ij} x_j`}</M> with the weights drawn iid,
            zero-mean, and independent of the inputs, the products <M>{String.raw`W_{ij} x_j`}</M> are
            independent and zero-mean. Variance adds over independent zero-mean terms, and for a
            zero-mean product <M>{String.raw`\operatorname{Var}(W_{ij}x_j) = \operatorname{Var}(W)\operatorname{Var}(x)`}</M>, so
          </p>
          <MathBlock>{String.raw`\operatorname{Var}(h) = n_{\text{in}}\, \operatorname{Var}(W)\, \operatorname{Var}(x).`}</MathBlock>
          <p>
            Requiring <M>{String.raw`\operatorname{Var}(h) = \operatorname{Var}(x)`}</M> gives{" "}
            <M>{String.raw`\operatorname{Var}(W) = 1/n_{\text{in}}`}</M>, which is Xavier&rsquo;s forward
            condition (Glorot averages the forward and backward fans; the forward-only version is
            LeCun&rsquo;s).
          </p>
          <p>
            <strong>Adding the ReLU.</strong> Now insert the activation:{" "}
            <M>{String.raw`y = \max(0, h)`}</M>. Take the pre-activation <M>{String.raw`h`}</M> symmetric
            about zero (true when the weights are symmetric and centred). ReLU sets the negative half to
            zero, so <M>{String.raw`y`}</M> equals <M>{String.raw`h`}</M> with probability one-half and
            equals zero otherwise. Its second moment keeps only the positive half:
          </p>
          <MathBlock>{String.raw`\mathbb{E}[y^2] = \tfrac{1}{2}\,\mathbb{E}[h^2] = \tfrac{1}{2}\operatorname{Var}(h).`}</MathBlock>
          <p>
            So the signal that leaves the ReLU carries only <em>half</em> the variance that entered it.
            Feed that into the next linear layer and the propagation becomes
          </p>
          <MathBlock>{String.raw`\operatorname{Var}(h_{\ell}) = \tfrac{1}{2}\, n_{\text{in}}\, \operatorname{Var}(W)\, \operatorname{Var}(h_{\ell-1}).`}</MathBlock>
          <p>
            To hold the variance constant across layers now requires the bracket{" "}
            <M>{String.raw`\tfrac{1}{2} n_{\text{in}} \operatorname{Var}(W) = 1`}</M>, that is
          </p>
          <MathBlock>{String.raw`\operatorname{Var}(W) = \dfrac{2}{n_{\text{in}}}.`}</MathBlock>
          <p>
            That extra factor of two — the reciprocal of the half that ReLU discards — is the entire
            difference between Xavier and He. Without it, each layer keeps only half its variance and
            the signal decays by <M>{String.raw`(\tfrac12)^{\ell}`}</M>, which is precisely the halving
            visible in the measured Xavier-on-ReLU column. With it, the halving is cancelled and the
            variance holds — precisely the stable He column. The <Link href="/learn/initialisation-and-normalisation/he" style={link}>He
            chapter</Link> takes this factor of two as its starting point.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>For a linear layer h = Wx with fan-in n, the output variance is n · Var(W) · Var(x).
                What weight variance keeps the activation variance constant from one layer to the next?</>,
              options: [
                "Var(W) = 1, independent of the fan-in",
                "Var(W) = 1 / n_in, so the layer neither amplifies nor attenuates the variance",
                "Var(W) = n_in, growing with the layer width",
              ],
              answer: 1,
              explain: <>Setting the output variance equal to the input variance means n · Var(W) = 1,
                so Var(W) = 1/n_in (standard deviation 1/√n_in). Wider layers sum over more terms and so
                need smaller weights, which is why a good scale depends on the fan-in.</>,
            },
            {
              q: <>Xavier initialisation applied to a 10-layer ReLU network produced activation
                variances that halved roughly every layer (0.2457 down to 0.0008). What did Xavier fail
                to account for?</>,
              options: [
                "That ReLU zeroes the negative half of its input, discarding half of the variance at every layer",
                "That the fan-in changes from layer to layer",
                "That the inputs were not normalised to unit variance",
              ],
              answer: 0,
              explain: <>Xavier&rsquo;s condition Var(W) = 1/n_in preserves variance for a linear or
                tanh layer, but ReLU sets every negative pre-activation to zero, halving the surviving
                variance. Uncorrected, each layer keeps only half its variance, producing the geometric
                decay seen in the measurements.</>,
            },
            {
              q: <>He initialisation uses Var(W) = 2 / n_in instead of 1 / n_in. Where does the factor
                of two come from?</>,
              options: [
                "It is an empirical fudge factor with no derivation",
                "It compensates for ReLU keeping only half of the pre-activation variance, so the two cancels the one-half",
                "It doubles the learning rate implicitly",
              ],
              answer: 1,
              explain: <>ReLU passes only the positive half of a symmetric pre-activation, so
                E[y²] = ½·Var(h). The variance recursion picks up a factor of one-half per layer;
                setting Var(W) = 2/n_in inserts a two that cancels it exactly, holding the variance
                constant — which is what the stable He column shows.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/what-bad-init-looks-like", label: <>← What bad init looks like</> }}
          next={{ href: "/learn/initialisation-and-normalisation/breaking-symmetry", label: <>Next up · Breaking symmetry →</> }}
        />
      </div>
    </article>
  );
}
