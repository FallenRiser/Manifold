import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The width plateau — Manifold",
  description:
    "At depth 2, going from width 16 to width 512 adds 264,000 parameters and buys 0.004 test accuracy. The plateau is the most common wasted experiment in architecture search — here is exactly where it starts and why.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const SWEEP: { w: number; test: string; params: string }[] = [
  { w: 2,   test: "0.793", params: "15" },
  { w: 4,   test: "0.879", params: "37" },
  { w: 8,   test: "0.893", params: "105" },
  { w: 16,  test: "0.946", params: "337" },
  { w: 32,  test: "0.946", params: "1,185" },
  { w: 64,  test: "0.946", params: "4,417" },
  { w: 128, test: "0.950", params: "17,025" },
  { w: 256, test: "0.950", params: "66,817" },
  { w: 512, test: "0.950", params: "264,705" },
];

const th: React.CSSProperties = {
  textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)",
  fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
};

export default function TheWidthPlateauPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Width", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>The width plateau</>}
        intro={<>The most expensive way to waste compute in architecture search is to keep
          doubling a width that stopped mattering three doublings ago. The plateau is not a
          surprise once you measure it — the question is where it starts, what drives it,
          and how to recognise it before you burn the budget.</>}
      />

      <div className="lesson">
        <h2>The sweep</h2>
        <p>
          Two hidden layers, ReLU activations, two-moons classification. Width doubles from 2 to 512.
          Every number is a test accuracy averaged over five random seeds, trained for 200 epochs with
          Adam at learning rate 0.001. The parameter count is exact.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={th}>width</th>
                <th style={th}>test accuracy</th>
                <th style={th}>parameters</th>
              </tr>
            </thead>
            <tbody>
              {SWEEP.map((r) => (
                <tr key={r.w}>
                  <td style={{ ...td, fontWeight: 500 }}>{r.w}</td>
                  <td style={{ ...td, color: parseFloat(r.test) >= 0.946 ? "var(--good)" : "var(--ink)" }}>{r.test}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{r.params}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Depth-2 width sweep, measured.
        </p>

        <p>
          Read the table in three bands. From width 2 to width 16, test accuracy rises from 0.793 to
          0.946 — a gain of 0.153 across four doublings. From width 16 to width 512, test accuracy
          rises from 0.946 to 0.950 — a gain of 0.004 across five more doublings. The parameter count
          in the second band goes from 337 to 264,705, a factor of 785.
        </p>

        <Callout color={CORAL} title={<>0.004 accuracy for 785 times the parameters</>}>
          Going from width 16 to width 512 multiplies the parameter count by 785 and buys 0.004 of
          test accuracy. That is the plateau. It is not a gradual tapering — the curve is flat from
          width 16 onward, and the tiny movement from 0.946 to 0.950 is within the noise of the
          five-seed average. The network at width 16 has already learned everything it can learn at
          this depth and this data size. The extra 264,368 parameters are dead weight.
        </Callout>

        <h2>What causes the plateau</h2>
        <p>
          The plateau appears when the network has enough capacity to represent the decision boundary
          and the optimiser has enough data to find it. After that point, additional units are
          redundant basis functions. They can fire in the training set, but they do not improve the
          fit because the fit is already as good as the data allows.
        </p>
        <p>
          This is distinct from overfitting, which is what happens when additional capacity improves
          the <em>training</em> fit but degrades the <em>test</em> fit. On the plateau, neither
          improves. The training accuracy at width 16 is already 0.99 or above — the network has
          memorised the training set. Making it wider lets it memorise the training set with more
          degrees of freedom, but those degrees of freedom are not pointed at anything the test
          set rewards.
        </p>
        <p>
          The mechanism is clearer if you think about what each unit contributes. At width 2, every
          unit is essential — remove either and the network cannot separate the moons. At width 16,
          many units have overlapping receptive fields; their features are correlated and partially
          redundant. At width 512, the redundancy is extreme: hundreds of units are producing slight
          variations on the same small set of useful features, and the output weights are free to
          spread the load across them arbitrarily.
        </p>

        <h2>The plateau depends on depth</h2>
        <p>
          The position of the plateau is not a fixed property of the problem. It depends on the
          network&rsquo;s depth, because depth changes what each unit&rsquo;s features can do.
        </p>
        <p>
          At depth 1, the single hidden layer must solve the entire problem in one shot: each unit
          draws one line (with ReLU, one half-plane), and the output layer blends them. More lines
          keep helping up to higher widths, because the only way to approximate a curved boundary
          with half-planes is to use many of them. The depth-1 curve does not plateau until around
          width 64, and it plateaus at a lower accuracy (around 0.919) than the depth-2 curve does.
        </p>
        <p>
          At depth 2, the first layer extracts features and the second layer composes them. The
          composed features are more expressive per unit, so fewer of them suffice. Width 16 at
          depth 2 (0.946) already beats any width at depth 1 (best: 0.919 at width 64). The
          plateau arrives sooner and at a higher level.
        </p>
        <p>
          The measured depth-by-width grid confirms this: at any depth, going from width 16 to
          width 64 buys at most 0.006 of test accuracy. The plateau threshold is remarkably
          consistent across depths, which suggests that 16 features per layer is genuinely enough
          for this problem at any depth, and the depth axis is doing the remaining work.
        </p>

        <h2>Recognising the plateau before the sweep</h2>
        <p>
          A full width sweep is the definitive test, but it is also the most expensive one. There
          are cheaper signals that suggest you have hit the plateau.
        </p>
        <p>
          <strong>Training accuracy is already near 1.0.</strong> If the model is fitting the
          training set perfectly, more capacity cannot improve the training fit, and any test
          improvement must come from regularisation or data, not from width. At width 16 the
          training accuracy is 0.99+, so the model has already memorised the training set. No
          amount of additional width can improve a training loss that is already at its floor.
        </p>
        <p>
          <strong>The train-test gap is small and stable.</strong> If training accuracy is 0.99 and
          test accuracy is 0.946, the gap is 0.044. At width 512 the training accuracy is still
          0.99+ and the test accuracy is 0.950, so the gap narrowed by 0.004. A gap that barely
          moves when you quadruple the width is a gap that width cannot close. The remaining 0.04
          is the noise floor of the problem at this sample size.
        </p>
        <p>
          <strong>Gradient norms on the added units are small.</strong> This is more technical but
          the most diagnostic signal. If the new units have small gradients from the start, the
          optimiser has nothing to push them toward — they are initialised into a region of the
          loss landscape that is already flat. They will drift during training but will not
          converge to anything the existing units were not already doing.
        </p>

        <Proof color={CORAL} title="why the plateau is a property of (problem, data, depth), not just width">
          <p>
            The width at which the plateau starts is determined by three things: the complexity of the
            true decision boundary, the amount of training data, and the depth of the network.
          </p>
          <p>
            A more complex boundary requires more features to approximate, so the plateau starts later.
            More training data constrains the fit more tightly, which can push the plateau out (the
            network needs more capacity to capture the finer detail the data reveals) or pull it in
            (more data makes the gradients more consistent, so the existing units converge to better
            features and fewer are needed).
          </p>
          <p>
            Depth affects the plateau because deeper networks compose features, and composed features
            have higher representational efficiency per parameter. A depth-4 network might plateau at
            width 8 where a depth-2 network plateaus at 16 and a depth-1 at 64 — each additional
            layer substitutes for a factor of width.
          </p>
          <p>
            This is why the plateau is not a number you can look up. It is a property of the
            interaction between the problem, the data, and the architecture, and it must be measured
            or estimated for each combination.
          </p>
        </Proof>

        <h2>The practical lesson</h2>
        <p>
          The plateau is the most common wasted resource in architecture search. It happens because
          doubling is easy and measuring is harder, so people double the width, see that nothing
          broke, and double again. Each doubling quadruples the parameter count of the widest layer
          and the memory required to store its activations, but the test accuracy does not budge.
        </p>
        <p>
          The remedy is to measure early. Train at width 16 and width 32. If the test accuracy
          difference is below 0.01, you are on the plateau and further widening will not help. Spend
          the compute on depth, on data augmentation, on hyperparameter tuning — on anything except
          more units in layers that already have enough. The 264,368 parameters between width 16 and
          width 512 on this problem could have funded a 10-layer network at width 16, which is a
          far more interesting experiment than a 2-layer network at width 512.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>On the depth-2 two-moons sweep, going from width 16 (337 parameters) to width 512
                (264,705 parameters) improved test accuracy by 0.004. What is the best
                interpretation?</>,
              options: [
                "The network is overfitting at width 512",
                "Width 16 already has enough capacity; the extra parameters are redundant and contribute nothing the test set rewards",
                "The learning rate needs to be increased for the wider network",
              ],
              answer: 1,
              explain: <>Overfitting would show as improved training accuracy with degraded test
                accuracy. Here neither meaningfully changes — training was already near 1.0 and test
                barely moved. The network at width 16 can already represent and fit the boundary; the
                785-fold increase in parameters adds redundant capacity.</>,
            },
            {
              q: <>At depth 1, the width plateau does not appear until around width 64 and tops out
                at test accuracy 0.919. At depth 2, the plateau appears at width 16 and tops out at
                0.946. What explains the difference?</>,
              options: [
                "The depth-2 network has more total parameters at the same width",
                "Depth enables feature composition, so fewer features per layer suffice and the plateau arrives sooner at a higher level",
                "The depth-1 network is underfitting due to vanishing gradients",
              ],
              answer: 1,
              explain: <>At depth 2, the second layer composes the first layer&rsquo;s features,
                giving each unit more representational power. This means the network needs fewer
                units to represent the boundary (plateau sooner) and represents it better (plateau
                higher). Vanishing gradients are unlikely at depth 2 with ReLU.</>,
            },
            {
              q: <>You trained at width 16 (test 0.946) and width 32 (test 0.946). What should you
                try next?</>,
              options: [
                "Width 64, because doubling is the standard protocol",
                "Something other than width — depth, data augmentation, or regularisation — because the flat response to doubling signals you are on the plateau",
                "A smaller learning rate to let the wider network converge better",
              ],
              answer: 1,
              explain: <>Two consecutive doublings with no test improvement is a clear plateau signal.
                Further widening will not help. The compute budget is better spent on depth,
                regularisation, data augmentation, or hyperparameter tuning — any axis that is not
                already exhausted.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/universal-approximation", label: <>← Universal approximation, honestly</> }}
          next={{ href: "/learn/architecture-design/when-to-go-wider", label: <>Next up · When to go wider →</> }}
        />
      </div>
    </article>
  );
}
