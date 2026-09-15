import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { BairdStates, TriadDiagram, DqnDiagram } from "@/components/figures/fa/FaDiagrams";
import { Curve } from "@/components/figures/fa/Curve";
import { BAIRD_X, BAIRD_SERIES } from "@/components/figures/fa/data";

export const metadata = {
  title: "Baird's counterexample — Manifold",
  description:
    "Seven states, eight weights, every reward zero, and a representation that expresses the true value function exactly. Off-policy semi-gradient TD still drives the weights 68.6x in a thousand steps — and the expected, noise-free version diverges too, reaching 1.6e12.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BairdsCounterexample() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 11 minutes"
        title={<>Baird&rsquo;s counterexample</>}
        intro={<>The two-state example could be waved away as a contrivance. This one cannot: it is the standard
          counterexample in the field, it is deliberately built out of nothing but benign parts, and it is the
          reason the next page has a name as dramatic as &ldquo;the deadly triad&rdquo;.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The setup, and how harmless it is</h2>
        <p>
          Seven states. Six of them are drawn as &ldquo;upper&rdquo; states; the seventh is the one everything
          funnels into. Two actions: a <strong>dashed</strong> action that jumps to a uniformly random upper
          state, and a <strong>solid</strong> action that goes to state 7. Every reward is <M>0</M>, and{" "}
          <M>{String.raw`\gamma = 0.99`}</M>.
        </p>
        <p>
          The <strong>target policy</strong> always takes solid. Since no reward is ever paid, the value of every
          state under that policy is exactly <M>0</M>. The <strong>behaviour policy</strong> — the one actually
          generating data — takes dashed 6/7 of the time. That mismatch is the off-policy leg, and off-policy
          updates carry an importance ratio of <M>1/(1/7) = 7</M> on solid steps and <M>0</M> on dashed ones.
        </p>
        <p>
          Each state gets 8 features, laid out so the seven states share weights with each other and with a
          common eighth weight. Two facts about this representation matter, and both make divergence{" "}
          <em>harder</em> to excuse:
        </p>
        <ul>
          <li>
            <strong>The true answer is representable exactly.</strong> Set every weight to 0 and{" "}
            <M>{String.raw`\hat v(s) = 0`}</M> for all seven states, which is the truth.
          </li>
          <li>
            <strong>There is no approximation error at all.</strong> The feature matrix has rank 7 over 7 states,
            so these features can express <em>any</em> value function on this problem. Nothing is being squeezed.
          </li>
        </ul>
        <p>
          The starting weights are deliberately unhelpful but hardly extreme —{" "}
          <M>{String.raw`\mathbf{w}_0 = (1,1,1,1,1,1,10,1)`}</M>, giving state 7 an inflated initial value. The
          step size is a modest <M>{String.raw`\alpha = 0.01`}</M>.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>No rewards, the correct answer sitting inside the representation, and a small step size. Run
            off-policy semi-gradient TD for 1,000 steps. Where do the weights go?</>}
          options={["To zero — the true values", "Somewhere wrong but finite", "They grow, slowly", "They explode"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`every true value is 0, and w = 0 represents that EXACTLY
target policy: always solid (-> state 7).  behaviour: dashed 6/7 of the time.

     step         ||w||     max|v(s)|
        1         10.34         12.00
       10         11.33         15.99
      100         27.28         47.35
      500        132.83        210.74
     1000        709.21       1096.07

||w|| grew 68.6x in 1000 steps,
on a problem with no rewards, an exact representation, and a small step size.`}</CodeOutput>

        <p>
          <strong>68.6× in a thousand steps</strong>, and accelerating — the value of some state has reached{" "}
          <strong>1096</strong> when the true value of every state is zero and it started at 10. Left running,
          this overflows to infinity. It does not oscillate, it does not settle on a wrong answer: it leaves.
        </p>

        <BairdStates
          caption={<>The whole environment. Seven states, two actions, no rewards, and a target
            policy that always takes the solid action into state 7. Every feature is known, every
            true value is zero, and <M>{String.raw`\mathbf{w} = \mathbf{0}`}</M> represents that
            answer exactly. Nothing here is adversarial in the usual sense — the example is famous
            because it is so hard to find anything wrong with it.</>}
        />

        <Curve
          x={BAIRD_X}
          series={BAIRD_SERIES}
          logY
          logX
          xlabel="update"
          ylabel="‖w‖"
          caption={<>The divergence, on log axes, against the identical run with the importance
            ratios set to 1 — that is, the same data and the same transitions, with only the
            off-policy leg removed. The off-policy weights climb from 10.34 to <strong>709.21</strong>{" "}
            in a thousand updates, a factor of <strong>68.6</strong>, and a straight line on these
            axes means it is still going. The on-policy run settles at <strong>9.00</strong> and
            stays. One leg of the triad is the difference between the two lines.</>}
        />

        <h2>It is not the sampling noise</h2>
        <p>
          A reasonable first suspicion is that this is a stochastic accident — unlucky draws, a step size too big
          for the variance, something a smaller <M>{String.raw`\alpha`}</M> or an average over seeds would wash
          out. It is not. Replace sampling with the <em>expected</em> update — sweep all seven states each
          iteration and apply the exact average update, with no randomness anywhere — and it still runs away
          (<code>scripts/fa_cases.py ch4</code>):
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 420 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Expected (noise-free) sweeps</th><th style={thR}>max |v(s)|</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>10</td><td style={tdR}>13.53</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>100</td><td style={tdR}>29.23</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1,000</td><td style={tdR}>676.9</td></tr>
              <tr><td style={td}>10,000</td><td style={{ ...tdR, color: "var(--bad)" }}>1.64 × 10<sup>12</sup></td></tr>
            </tbody>
          </table>
        </div>

        <p>
          So the divergence is in the expected update itself. This is a property of the algorithm applied to this
          problem, not a property of the random numbers. In the language of{" "}
          <Link href="/learn/function-approximation/semi-gradient-td" style={link}>chapter 2</Link>: the matrix{" "}
          <M>{String.raw`\mathbf{A}`}</M> whose fixed point TD chases is no longer positive definite once the
          updating distribution stops matching the target policy, and the expected update points{" "}
          <em>away</em> from the solution instead of toward it.
        </p>
        <MathBlock>{String.raw`\mathbb{E}[\Delta\mathbf{w}] = \alpha(\mathbf{b} - \mathbf{A}\mathbf{w}), \qquad \text{stable only if } \mathbf{A} \text{ is positive definite}`}</MathBlock>

        <Callout color={GOLD} title={<>Every ingredient here is one you would happily ship</>}>
          Take the parts one at a time. Linear function approximation with eight weights: standard, and here it is
          not even lossy. Bootstrapping: the whole reason TD is cheap and online. Off-policy data: exactly what
          you have when you learn a greedy policy while exploring, or replay old experience, or learn several
          things at once from one stream.
          <br /><br />
          None of these is a mistake. There is no bug to find, no hyperparameter that was set carelessly, no
          reward scaling gone wrong. The failure is <em>emergent</em> — it belongs to the combination and to
          nothing in it. That is what makes it worth its own chapter, and what the next page pins down by
          removing one ingredient at a time.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/function-approximation/when-td-diverges", label: <>← When TD diverges</> }}
          next={{ href: "/learn/function-approximation/the-three-ingredients", label: <>Next · The three ingredients →</> }}
        />
      </div>
    </article>
  );
}

const code = `phi, b_probs, gamma = baird()      # 7 states, 8 weights, every reward exactly 0
w = BAIRD_W0.copy()
alpha = 0.01
rng = np.random.default_rng(0)

print("every true value is 0, and w = 0 represents that EXACTLY")
print("target policy: always solid (-> state 7).  behaviour: dashed 6/7 of the time.\\n")
print(f"   {'step':>6}  {'||w||':>12}  {'max|v(s)|':>12}")
for t in range(1, 1001):
    s = int(rng.integers(7))
    if rng.random() < b_probs[0]:
        s2, rho = int(rng.integers(6)), 0.0          # dashed: the target policy never does this
    else:
        s2, rho = 6, 1.0 / b_probs[1]                # solid: importance ratio 7
    delta = 0.0 + gamma * phi[s2] @ w - phi[s] @ w
    w += alpha * rho * delta * phi[s]
    if t in (1, 10, 100, 500, 1000):
        print(f"   {t:6d}  {np.linalg.norm(w):12.2f}  {np.max(np.abs(phi @ w)):12.2f}")

print(f"\\n||w|| grew {np.linalg.norm(w) / np.linalg.norm(BAIRD_W0):.1f}x in 1000 steps,")
print("on a problem with no rewards, an exact representation, and a small step size.")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
