import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { ActivationExplorerLab } from "@/components/labs/ActivationExplorerLab";

export const metadata = {
  title: "The leaky answers — Manifold",
  description:
    "Leaky ReLU, PReLU and ELU all remove the flat negative half. All three work exactly as advertised, all three eliminate dead units — and in the measured runs none of them bought any accuracy.",
};

const CORAL = "var(--c-neural)";

const th: React.CSSProperties = {
  textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)",
  fontVariantNumeric: "tabular-nums",
};

export default function LeakyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The ReLU family", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>The leaky answers</>}
        intro={<>If the problem is a derivative of exactly zero, the fix writes itself: make it not exactly zero.
          Three functions do this in three ways, and the honest report is that they solve the stated problem
          completely and deliver almost nothing for it.</>}
      />

      <div className="lesson">
        <h2>Three ways to fill in the negative half</h2>

        <MathBlock>{String.raw`\text{Leaky ReLU}(z) = \begin{cases} z & z>0 \\ \alpha z & z \le 0\end{cases} \qquad \alpha = 0.01 \text{ (fixed)}`}</MathBlock>

        <p>
          <strong>Leaky ReLU</strong> gives the negative side a small constant slope. The derivative is 1 or{" "}
          <M>{String.raw`\alpha`}</M> — never zero anywhere. This is the only function on the whole track for which
          a dead unit is <em>impossible by construction</em>, and the measurement confirms it: zero deaths across
          every run.
        </p>

        <p>
          <strong>PReLU</strong> is the same function with <M>{String.raw`\alpha`}</M> learned by gradient descent
          rather than fixed — one extra parameter per channel, negligible cost. It works, and it exposes the awkward
          empirical fact that networks often learn <M>{String.raw`\alpha`}</M> values around 0.25, far larger than
          the 0.01 convention.
        </p>

        <MathBlock>{String.raw`\text{ELU}(z) = \begin{cases} z & z>0 \\ \alpha(e^{z}-1) & z \le 0\end{cases} \qquad \text{ELU}'(z) = \begin{cases} 1 & z>0 \\ \alpha e^{z} & z \le 0\end{cases}`}</MathBlock>

        <p>
          <strong>ELU</strong> curves the negative half instead of straightening it. Two consequences: the function
          is smooth at the origin, and its outputs are negative on the left rather than merely small — so ELU is
          genuinely zero-centred in a way Leaky ReLU with <M>{String.raw`\alpha = 0.01`}</M> barely is. The cost is
          an <M>{String.raw`e^z`}</M> per negative unit, measured at 8.2× ReLU.
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Select <strong>Leaky ReLU</strong> and drag α from 0.01 upward, watching the &ldquo;switched
            off&rdquo; box stay at 0.0%. Then select <strong>ELU</strong> and look at its lower panel on the far
            left.</>}
          insight={<>Leaky ReLU reports <strong>0.0% switched off</strong> at any α above zero — that is the
            guarantee, and it is exact. ELU reports <strong>21.2%</strong>, because{" "}
            <M>{String.raw`\alpha e^{z} \to 0`}</M> as <M>{String.raw`z`}</M> goes negative: <strong>ELU still
            saturates</strong>, it just needs a much larger negative input to get there. The function marketed as the
            answer to dying ReLU has a dead region of its own.</>}
        >
          <ActivationExplorerLab />
        </LabFrame>

        <h2>What they actually bought</h2>
        <p>
          Same network, same data, same seed, same learning rate of 3.0 — the setting from the previous page, chosen
          because it kills ReLU units:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                <th style={th}>activation</th>
                <th style={th}>dead units</th>
                <th style={th}>final loss</th>
                <th style={th}>test accuracy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>ReLU</td>
                <td style={{ ...td, color: "var(--bad)" }}>19 of 64</td>
                <td style={td}>0.0828</td>
                <td style={td}>0.9190</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>Leaky ReLU</td>
                <td style={{ ...td, color: "var(--good)" }}>0 of 64</td>
                <td style={td}>0.0843</td>
                <td style={td}>0.9095</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>ELU</td>
                <td style={{ ...td, color: "var(--bad)" }}>49 of 64</td>
                <td style={{ ...td, color: "var(--bad)" }}>13.8155</td>
                <td style={{ ...td, color: "var(--bad)" }}>0.5000</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>GELU</td>
                <td style={{ ...td, color: "var(--good)" }}>0 of 64</td>
                <td style={td}>0.0852</td>
                <td style={td}>0.9048</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>Swish</td>
                <td style={{ ...td, color: "var(--good)" }}>0 of 64</td>
                <td style={td}>0.0912</td>
                <td style={td}>0.9238</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>Leaky ReLU did exactly what it promises and nothing more.</strong> Zero deaths, and an accuracy
          0.0095 <em>below</em> the ReLU run that lost 19 units — two test examples out of 210. The fix is real; the
          benefit is not detectable here.
        </p>

        <Callout color={CORAL} title={<>The row worth staring at</>}>
          <strong>ELU is the only one of the five that failed outright.</strong> Within forty steps the loss went
          from 0.61 to 13.8, 49 units landed in the saturated negative tail, and nothing moved for the remaining 760
          steps. At this learning rate, the function sold as the cure for dying ReLU is the one that died.
          <br /><br />
          The lesson is not &ldquo;ELU is bad&rdquo; — at lr 0.05 it trains perfectly well. It is that{" "}
          <strong>removing the flat half of ReLU is not the same as removing every way for a unit to stop
          responding.</strong> ELU trades a hard zero for an exponentially decaying slope, which is better in the
          region near the origin and no better at all once a unit is driven far out.
        </Callout>

        <h2>The recommendation, honestly</h2>
        <p>
          Leaky ReLU costs 2.5× ReLU, has one hyperparameter that almost nobody tunes, and guarantees you will never
          debug a dead unit again. That is a reasonable trade and a defensible default. What it is not is a source of
          accuracy: across this track&rsquo;s measurements it lands within noise of ReLU every time.
        </p>
        <p>
          Use it when you have <em>seen</em> the failure — a flat loss with a high dead count — or when you are
          training at a learning rate aggressive enough to expect it. Reaching for it prophylactically is fine and
          cheap. Reaching for it hoping for a better score is not supported by anything on this page.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why can a Leaky ReLU unit never die?</>,
              options: [
                "Because its outputs are zero-centred",
                "Because its derivative is 1 or α, and α > 0, so it is never exactly zero anywhere",
                "Because it is smooth at the origin",
              ],
              answer: 1,
              explain: <>Death requires an exactly-zero gradient. Leaky ReLU has no input at which its derivative is
                zero, so the update never vanishes — this is a structural guarantee, not a tendency, and it is why it
                measures 0.0% switched off.</>,
            },
            {
              q: <>ELU is often described as the fix for dying ReLU, yet at lr 3.0 it lost 49 of 64 units. Why?</>,
              options: [
                "Because ELU has a bug in its derivative",
                "Because ELU's negative slope decays exponentially toward zero, so a unit driven far negative still saturates",
                "Because ELU requires a special initialisation",
              ],
              answer: 1,
              explain: <><M>{String.raw`\alpha e^{z} \to 0`}</M> as <M>{String.raw`z \to -\infty`}</M>. ELU removes
                the hard zero near the origin and keeps a soft one further out — 21.2% of the measured range is below
                the saturation threshold.</>,
            },
            {
              q: <>Leaky ReLU eliminated all deaths and scored 0.0095 <em>below</em> the ReLU run that lost 19 units.
                What follows?</>,
              options: [
                "Leaky ReLU is worse than ReLU",
                "Fixing dead units is worth something only when the deaths were costing you capacity, which in this run they were not",
                "The measurement must be wrong",
              ],
              answer: 1,
              explain: <>A gap of 0.0095 on 210 test examples is two examples — noise. The right reading is that the
                fix addresses a real failure whose cost, in this network, was zero. It becomes valuable when the
                deaths are numerous or concentrated in one layer.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/dying-relu", label: <>← Dying ReLU</> }}
          next={{ href: "/learn/activation-functions/selu", label: <>Next up · SELU &amp; self-normalising nets →</> }}
        />
      </div>
    </article>
  );
}
