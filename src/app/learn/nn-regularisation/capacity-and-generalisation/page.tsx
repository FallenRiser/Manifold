import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Capacity, complexity, and generalisation — Manifold",
  description:
    "The classical story says a bigger network overfits more. On this problem it does not: from 1x32 to 4x512, every size memorises all 250 points and the gap barely moves. The gap is capped by the data, not the parameter count.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CapacityAndGeneralisationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The gap", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 9 minutes"
        title={<>Capacity, complexity, and generalisation</>}
        intro={<>The obvious hypothesis, once you see a gap, is that the network is too big. Shrink it,
          the reasoning goes, and the gap should shrink too. It is worth measuring that hypothesis
          directly — because on this problem it is <strong>wrong</strong>, and understanding why is what
          points you toward regularisation instead.</>}
      />

      <div className="lesson">
        <h2>The tempting fix, and the test of it</h2>
        <p>
          The classical intuition is a clean one. A model with more parameters can represent more
          complicated functions, and more complicated functions have more room to fit noise, so a larger
          model should overfit more and generalise worse. If that were the whole story, the cure for our
          0.244 gap would be simple: use a smaller network.
        </p>
        <p>
          So let us run the capacity sweep. Same data — 250 training points, 50 features of which 10 are
          informative, 10% label noise, 1000 test points — same optimiser, four network sizes from small
          to large. If capacity drives the gap, the gap should fall as we shrink the network.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>network (depth &times; width)</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>train</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>gap</th>
              </tr>
            </thead>
            <tbody>
              {([
                { net: "1 × 32", train: "1.000", test: "0.753", gap: "0.247" },
                { net: "2 × 64", train: "1.000", test: "0.754", gap: "0.246" },
                { net: "3 × 256", train: "1.000", test: "0.751", gap: "0.249" },
                { net: "4 × 512", train: "1.000", test: "0.770", gap: "0.230" },
              ] as const).map((r) => (
                <tr key={r.net}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.net}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.train}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.test === "0.770" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.test}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Full-batch AdamW, 400 epochs, ReLU, 3-seed averages. From <code>scripts/regularisation_cases.py</code>.
        </p>

        <h2>The surprise</h2>
        <p>
          The gap does not fall as the network shrinks. It sits at <strong>0.247, 0.246, 0.249,
          0.230</strong> — essentially flat across a range where the parameter count grows by roughly two
          orders of magnitude. The smallest network here does not generalise meaningfully better than the
          largest; if anything the <em>largest</em> network (4&times;512) has the smallest gap of the
          four. The classical &ldquo;shrink the model&rdquo; fix does approximately nothing.
        </p>
        <p>
          The reason is in the first column. <strong>Every network scores train 1.000.</strong> Even the
          smallest one — a single hidden layer of 32 units — has more than enough capacity to memorise
          250 points completely, label noise and all. Once a model can drive training error to zero, making
          it bigger does not let it memorise <em>more</em> than everything. It is already at the ceiling.
          Extra capacity past that point is spent on <em>how</em> it interpolates the points, not on{" "}
          <em>whether</em> it can, and here that choice barely affects the test score.
        </p>

        <Callout color={CORAL} title={<>The gap is set by the data, not the parameter count</>}>
          With 250 training points and 10% label noise, there is a floor on how well <em>any</em> model
          trained on this sample can do on the test set — a floor set by the noise you cannot see through
          and the estimation error of learning from only 250 examples. All four networks are already
          slammed against that floor. That is why widening or deepening moves the gap by hundredths, not
          by the tenths you would need to close it. The gap is a property of the <strong>problem</strong> —
          limited data plus irreducible noise — and no amount of resizing changes the problem.
        </Callout>

        <h2>The classical picture, and where it stops applying</h2>
        <p>
          The bias&ndash;variance intuition is not wrong; it is describing a regime this experiment has
          already left. In the classical picture, you sweep capacity from too little to too much and watch
          test error trace a U: high on the left (underfitting, the model cannot represent the answer), a
          minimum in the middle, high again on the right (overfitting, the model chases noise). In that
          picture, capacity genuinely trades bias for variance, and there is a sweet spot to find.
        </p>
        <p>
          But that U lives entirely on the <em>left</em> of a special point — the{" "}
          <strong>interpolation threshold</strong>, the capacity at which the model first becomes able to
          fit the training set exactly. Our smallest network (1&times;32) is already past that threshold:
          train 1.000 means it interpolates. Every network in the table is in the{" "}
          <strong>overparameterised regime</strong>, to the right of the threshold, where the classical U
          simply does not describe what happens. In that regime, adding parameters often leaves test error
          flat or even improves it slightly — which is exactly the 4&times;512 network having the{" "}
          <em>smallest</em> gap. This is the modern &ldquo;double descent&rdquo; behaviour: once you are
          past interpolation, more capacity is not the enemy the classical story warned about.
        </p>

        <h2>Approximation error versus estimation error</h2>
        <p>
          The cleanest way to name what is going on borrows the decomposition from model-selection theory.
          A model&rsquo;s test error splits into two parts. <strong>Approximation error</strong> is how
          well the best function in your model class could possibly do — limited by capacity. Add
          parameters and approximation error falls. <strong>Estimation error</strong> is how far the
          function you actually learned, from a finite noisy sample, sits from that best function —
          limited by data and noise. Add data and estimation error falls; add noise and it rises.
        </p>
        <p>
          On this problem, capacity is not the bottleneck: even 1&times;32 has essentially zero
          approximation error for a task with 10 informative features, which is why it already reaches
          train 1.000. The gap is almost <em>entirely</em> estimation error — the price of 250 points and
          10% noise. That is why turning the capacity knob does nothing: you are adjusting the term that is
          already small. To attack estimation error you either get more data (not available here) or you{" "}
          <strong>constrain the fit</strong> so it commits less to any single noisy point. That constraint
          is regularisation. The full split is developed in{" "}
          <Link href="/learn/model-selection/approximation-vs-estimation" style={link}>approximation
          versus estimation error</Link>.
        </p>

        <Proof color={CORAL} title="why, past interpolation, the gap is governed by data and noise">
          <p>
            Suppose the data are generated as <M>{String.raw`y = f^\star(x) \oplus \varepsilon`}</M>,
            where <M>{String.raw`f^\star`}</M> is the true labelling and{" "}
            <M>{String.raw`\varepsilon`}</M> flips the label independently with probability{" "}
            <M>{String.raw`p = 0.10`}</M>. A model of high enough capacity can achieve training accuracy
            1.000 — it fits <M>{String.raw`f^\star`}</M> on the clean points <em>and</em> reproduces every
            flip on the corrupted ones, because both are just training labels to be matched.
          </p>
          <p>
            Once the model is past this interpolation threshold, adding parameters cannot raise the
            training accuracy above 1.000, so it cannot change how much of the noise is being fit — all of
            it already is. The training score is pinned. The test score, meanwhile, is bounded by how much
            of the fitted &ldquo;signal&rdquo; is really <M>{String.raw`f^\star`}</M> and how much is
            memorised noise, and that ratio is determined by the sample size <M>{String.raw`n`}</M> and the
            noise rate <M>{String.raw`p`}</M> — quantities the parameter count does not touch. Hence the
            gap is roughly constant across the overparameterised sweep: it is a function of{" "}
            <M>{String.raw`(n, p)`}</M>, the data, not of capacity.
          </p>
          <p>
            The lever that <em>does</em> move it is one that changes <em>which</em> interpolating function
            the optimiser settles on — biasing it toward smoother fits that commit less to individual
            points. That lever is regularisation, and it operates without shrinking the network at all.
          </p>
        </Proof>

        <p>
          So the diagnosis is complete. The gap is real (last page), and it is not the network being too
          big (this page) — it is the data. Which means the fix cannot be resizing. The next page settles
          the last precondition: when this reasoning applies, and when regularising would be a mistake.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>From 1&times;32 to 4&times;512 the parameter count grows by roughly 100&times;, yet the
                gap stays near 0.24 and every network scores train 1.000. What does this tell you?</>,
              options: [
                "The larger networks are underfitting",
                "Even the smallest network already has enough capacity to memorise all 250 points, so the gap is set by the data (250 points, 10% noise), not the parameter count",
                "The measurement is too noisy to draw any conclusion",
              ],
              answer: 1,
              explain: <>Train 1.000 at every size means every network is past the interpolation
                threshold — it fits everything, noise included. Beyond that point extra capacity cannot
                memorise more than everything, so the gap is capped by the sample size and noise rate, not
                by parameters. Shrinking the network does not help.</>,
            },
            {
              q: <>Why does the classical bias&ndash;variance U-curve not describe this capacity sweep?</>,
              options: [
                "Because the U-curve only applies to linear models",
                "Because every network here is already past the interpolation threshold (train 1.000), in the overparameterised regime where the classical U does not apply and more capacity can even help slightly",
                "Because the networks are too small to overfit",
              ],
              answer: 1,
              explain: <>The classical U lives to the left of the interpolation threshold, where capacity
                trades bias for variance. All four networks interpolate the training set, placing them in
                the overparameterised regime — the modern double-descent picture, where the 4&times;512
                network actually has the smallest gap.</>,
            },
            {
              q: <>The gap here is almost entirely estimation error rather than approximation error. What
                follows for how to close it?</>,
              options: [
                "Add capacity, since that reduces approximation error",
                "Adding capacity is pointless because approximation error is already near zero; you must reduce estimation error — with more data (unavailable) or by constraining the fit, i.e. regularisation",
                "Nothing can be done; the gap is irreducible",
              ],
              answer: 1,
              explain: <>Approximation error is already tiny (1&times;32 reaches train 1.000), so the
                capacity knob adjusts a term that is not the bottleneck. Estimation error — the cost of
                250 noisy points — is what remains, and with no more data available, the only lever is to
                constrain the fit so it commits less to noise. That is regularisation.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/the-gap-revisited", label: <>&#8592; The train&ndash;test gap, revisited</> }}
          next={{ href: "/learn/nn-regularisation/when-to-regularise", label: <>Next up &middot; When to regularise, and when not to &#8594;</> }}
        />
      </div>
    </article>
  );
}
