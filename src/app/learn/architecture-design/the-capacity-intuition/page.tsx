import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { ARCH_SETUP } from "@/lib/runtimeSetup";
import { SweepCurve } from "@/components/figures/SweepCurve";
import { WIDTH_SWEEP } from "@/components/figures/arch/data";

export const metadata = {
  title: "The capacity intuition — Manifold",
  description:
    "Capacity is the set of functions a network can represent. Below a minimum the network cannot fit the data; above it, returns diminish — and the classical rule that parameters must be fewer than samples is wrong.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CapacityIntuitionPage() {
  const fromScratch = `# Classical statistical learning theory draws a red line at P = n:
# more parameters than training points, it warns, means catastrophic overfit.
P = count_params((32, 32))
n = len(X_tr)
print(f"parameters P = {P}")
print(f"train samples n = {n}")
print(f"P / n = {P / n:.1f}   -> classical theory predicts memorisation, zero generalisation")`;

  const withLibrary = `# What actually happens when you cross that line?
tr, te = fit_mlp((32, 32))
print(f"depth-2, width-32:  train={tr}  test={te}  gap={round(tr - te, 4)}")
# P is roughly 2x the sample count, yet the train-test gap is a rounding error.
# This is double descent, not catastrophe -- gradient descent finds a smooth,
# low-complexity solution, not the worst-case memoriser the bound assumes.`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: "Core idea", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>The capacity intuition</>}
        intro={<>Capacity is the word everyone reaches for when they want to say &ldquo;how powerful is this
          network.&rdquo; The intuition is simple — more parameters, more complex functions — but the
          details matter, because the intuition is right about the floor and wrong about the ceiling.</>}
      />

      <div className="lesson">
        <h2>What capacity means</h2>
        <p>
          The capacity of a model is the set of functions it can represent. A linear model can represent
          any function of the form <M>{String.raw`f(x) = Wx + b`}</M> — hyperplanes in input space. A
          single-hidden-layer ReLU network with <M>{String.raw`W`}</M> units can represent any continuous
          piecewise-linear function with at most <M>{String.raw`W`}</M> linear regions per input
          dimension. A deeper network can represent piecewise-linear functions whose number of regions
          grows <em>exponentially</em> with depth, because each layer can fold the space the previous
          layer produced.
        </p>
        <p>
          This is a statement about what the network <em>can</em> represent, not about what it <em>will</em>{" "}
          represent after training. The distinction is everything. A network with a million parameters can
          represent an astronomically complex function, but the optimiser, the initialisation, and the
          finite training set conspire to select a tiny fraction of that space. Capacity sets the menu;
          training picks the dish.
        </p>

        <h2>The capacity ladder</h2>
        <p>
          On the running problem (make_moons, 1,000 samples, noise 0.25), the capacity ladder is
          unambiguous. A single-hidden-layer network with 1 unit achieves test accuracy{" "}
          <strong>0.641</strong> — barely above chance. The boundary this network can draw is a single
          line, and the moons are not linearly separable. With 4 units the accuracy jumps to{" "}
          <strong>0.879</strong>: four linear pieces are enough to approximate a crescent, though not
          well. At 8 units: <strong>0.893</strong>. At 16 units: <strong>0.946</strong>. At 32 units:{" "}
          <strong>0.950</strong>. At 64 units: <strong>0.919</strong>. At 256 units:{" "}
          <strong>0.918</strong>. At 512 units: <strong>0.950</strong>.
        </p>
        <p>
          The climb from 1 to 16 units is steep: every doubling buys a real improvement, because the
          network is acquiring the capacity it needs to fit the data. The plateau from 16 to 512 is flat:
          the width-16 network can already represent a boundary close to the true one, and adding more
          units provides capacity the optimiser does not use. The total improvement from 16 to 512 is{" "}
          <strong>+0.004</strong> — four thousandths of accuracy, spread over a 32-fold increase in width.
        </p>

        <Callout color={CORAL} title={<>The floor is real; the ceiling is not where you think</>}>
          Below a minimum capacity the network structurally cannot fit the data — no amount of training
          time, tuning, or regularisation will help. That floor is determined by the data complexity and
          the architecture. <strong>Above the floor, additional capacity yields diminishing and eventually
          zero returns.</strong> The practical question is never &ldquo;how much capacity can I
          afford?&rdquo; but &ldquo;have I passed the floor?&rdquo; — because once you have, the marginal
          value of more capacity drops faster than its cost.
        </Callout>

        <SweepCurve
          points={WIDTH_SWEEP.map((p) => ({ x: p.x, a: p.y }))}
          log
          xlabel="hidden width (log scale), 1 hidden layer"
          xticks={[2, 8, 32, 128, 512]}
          caption={<>The capacity ladder as a curve rather than a table. From width 2 to width 16 the
            model gains 18 points of test accuracy; from 16 to 512 it gains nothing and loses about
            one. The classical rule says the right-hand end should be a cliff — 264,705 parameters
            fitted to 600 points ought to be a catastrophe — and instead it is a gentle drift. That
            flat right-hand end is the whole of the next section.</>}
        />

        <h2>Why the classical rule is wrong</h2>
        <p>
          Classical statistical learning theory says that if your number of parameters exceeds your number
          of training samples, the model will overfit catastrophically. The VC dimension argument goes like
          this: a model with <M>{String.raw`P`}</M> parameters can shatter{" "}
          <M>{String.raw`P`}</M> points, so if <M>{String.raw`P > n`}</M> the model can memorise the
          training set and generalise to nothing.
        </p>
        <p>
          This prediction is wrong for neural networks, and the wrongness is not marginal. Modern networks
          routinely have millions of parameters trained on thousands of examples and generalise well. The
          phenomenon has a name — <strong>double descent</strong> — and you can study it in detail on
          the{" "}
          <Link href="/learn/learning-theory" style={link}>learning theory track</Link>. The short
          version: the classical bound assumes the worst-case function in the hypothesis class, but
          gradient descent with early stopping does not find the worst case. It finds a function that is
          smooth, low-norm, and biased toward simple solutions, and that implicit bias is enough to
          generalise even when the parameter count far exceeds the sample count.
        </p>

        <MathBlock>{String.raw`\underbrace{P \gg n}_{\text{classical: catastrophic overfit}} \quad\longrightarrow\quad \underbrace{\text{test error continues to decrease}}_{\text{observed: double descent}}`}</MathBlock>

        <PredictPrompt
          prompt={<>The depth-2, width-32 network has more parameters than it has training points to fit.
            Classical theory says it should memorise the training set and generalise to nothing. What is
            the actual train-test gap?</>}
          options={[
            "Huge — train near 1.0, test near chance, exactly as warned",
            "Tiny — a few thousandths; it generalises fine despite P > n",
            "The network refuses to train at all in the over-parameterised regime",
          ]}
          nudge={<>Locked in. Count the parameters, then train it and subtract.</>}
        />

        <p>
          On the running problem, the depth-2, width-32 network has 1,185 parameters and 1,000 training
          samples — already in the <M>{String.raw`P > n`}</M> regime. Its test accuracy is 0.953, the
          best on the grid. The depth-8, width-64 network has 29,377 parameters, nearly thirty times the
          sample count, and still achieves 0.932. Neither catastrophically overfits. The classical bound
          is not just loose — it predicts the wrong direction. Cross the red line yourself:
        </p>

        <CodeBlock setup={ARCH_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <h2>But the practical message holds</h2>
        <p>
          If the classical rule is wrong, does that mean you should always use the biggest network you can
          afford? No — and the reason is cost, not generalisation. The depth-8, width-64 network
          generalises adequately (0.932) but costs 25 times as many parameters as the depth-2, width-32
          network that scores higher (0.953). In a research setting with infinite compute, the
          overcapacity is harmless. In production, where you pay for every parameter in latency, memory,
          and energy, it is waste.
        </p>
        <p>
          The practical rule that replaces the classical one is: <strong>start with enough capacity to
          overfit the training set, then regularise</strong>. If your training accuracy is stuck below the
          level you need on the test set, you have a capacity problem — the network literally cannot
          represent a function that fits the data, and no amount of tuning will fix it. If your training
          accuracy is high but your test accuracy is low, you have a generalisation problem — the network
          can represent the right function but has also found a wrong one that happens to score better on
          the training data. Those two failures have different remedies, and telling them apart is the
          diagnostic skill this track teaches.
        </p>

        <Proof color={CORAL} title="what 'enough to overfit' means in practice">
          <p>
            &ldquo;Enough to overfit&rdquo; does not mean &ldquo;the training loss hits zero.&rdquo; It
            means the training loss is as low as you could reasonably expect given the noise in the
            data. On the make_moons problem with noise 0.25, no model should achieve 100% training
            accuracy because some of the labels are genuinely ambiguous — points near the boundary could
            belong to either class.
          </p>
          <p>
            A network that reaches, say, 0.98 training accuracy on this data has overfit: some of that
            0.98 is fitting the noise, not the signal. You can tell because the test accuracy is lower. A
            network that reaches 0.95 training accuracy and 0.953 test accuracy has fit the signal without
            fitting the noise — the gap is 0.003, essentially zero. That is the target: enough capacity to
            reach a training accuracy that the test accuracy can match.
          </p>
          <p>
            The 1-unit network with 0.641 training accuracy fails this test: it cannot even fit the
            signal, so the problem is capacity. The 256-unit network with 0.970 training accuracy and
            0.918 test accuracy also fails: it fits the signal and some of the noise, so the problem is
            generalisation. The 32-unit network with 0.956 training accuracy and 0.953 test accuracy
            passes: the gap is small enough that regularisation has nothing to do.
          </p>
        </Proof>

        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Every number in the curve above is from <code>scripts/architecture_cases.py</code>{" "}
          section 3, five seeds per point.
        </p>

        <h2>Capacity is not a single number</h2>
        <p>
          It is tempting to identify capacity with the parameter count, but two networks with the same
          number of parameters can have very different capacities. A depth-1, width-333 network
          (single hidden layer, <M>{String.raw`n = 2`}</M>, <M>{String.raw`m = 1`}</M>) has about
          1,333 parameters and achieves test accuracy <strong>0.953</strong>. A depth-8, width-10
          network has about 811 parameters and achieves test accuracy <strong>0.944</strong> with higher
          variance across seeds. Fewer parameters, similar accuracy — but the architectures are
          qualitatively different.
        </p>
        <p>
          The shallow network has 333 independent linear pieces and no composition. The deep network has
          far fewer pieces per layer but can compose them across eight layers, building features from
          features. On this problem the composition is not needed — the boundary is a pair of crescents,
          not a hierarchy of shapes — so the shallow network wins on efficiency. On a problem with
          hierarchical structure (images, language, nested logic), the deep network&rsquo;s compositional
          capacity would dominate even at a lower parameter count.
        </p>
        <p>
          This is why architecture design is not reducible to &ldquo;how many parameters.&rdquo; The
          parameter count tells you the cost. The architecture — depth, width, connectivity — tells you
          what <em>kind</em> of capacity those parameters buy, and whether that kind matches the
          structure of your data.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Width increases from 16 to 512 on the running problem. How much does test accuracy
                improve?</>,
              options: [
                "About 0.05 (five percentage points)",
                "About 0.004 (four thousandths)",
                "It decreases because of overfitting",
              ],
              answer: 1,
              explain: <>Width 16 achieves 0.946 and width 512 achieves 0.950. The improvement is
                +0.004 over a 32-fold increase in width. The network passed the capacity floor at
                around 16 units, and everything beyond that is diminishing returns.</>,
            },
            {
              q: <>The depth-2, width-32 network has 1,185 parameters and 1,000 training samples.
                Classical theory predicts catastrophic overfitting. What actually happens?</>,
              options: [
                "It overfits — training accuracy is much higher than test accuracy",
                "It achieves the best test accuracy on the grid (0.953) with a train-test gap of about 0.003",
                "It underfits because the parameters are not efficiently used",
              ],
              answer: 1,
              explain: <>The classical VC-dimension bound assumes the worst-case function, but gradient
                descent with finite-time training finds a smooth, low-complexity function. The
                implicit regularisation of the optimiser is enough to generalise well even in the
                over-parameterised regime.</>,
            },
            {
              q: <>Your network achieves 0.970 training accuracy and 0.918 test accuracy on the
                make_moons problem. What should you do?</>,
              options: [
                "Increase width — the network lacks capacity",
                "Regularise (dropout, weight decay, or early stopping) — the network has enough capacity but is fitting noise",
                "Increase depth — the network needs compositional features",
              ],
              answer: 1,
              explain: <>A training accuracy well above test accuracy means the network can fit the
                data — it has enough capacity — but it is also fitting noise. The remedy is
                regularisation, not more capacity. Adding width or depth would increase the gap, not
                close it.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/parameters-and-cost", label: <>&#8592; Parameters, and what they cost</> }}
          next={{ href: "/learn/architecture-design/what-width-buys", label: <>Next up &middot; What width buys &#8594;</> }}
        />
      </div>
    </article>
  );
}
