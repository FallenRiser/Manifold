import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "How fast it converges — Manifold",
  description:
    "Iterative evaluation converges geometrically at rate γ, so the sweeps needed grow with the effective horizon 1/(1−γ). The worst-case bound, why real problems often converge faster, and the discount tradeoff.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ConvergenceRate() {
  const code = `import numpy as np
def sweeps_to_converge(gamma, tol=1e-4):
    V = np.zeros(nS)
    for k in range(1, 100000):
        Vn = (random_policy * (R + gamma * (P @ V))).sum(axis=1); Vn[TERMINALS] = 0.0
        if np.max(np.abs(Vn - V)) < tol:
            return k
        V = Vn
    return -1

print(f"{'gamma':>6} {'sweeps':>7} {'horizon 1/(1-g)':>16}")
for g in (0.5, 0.9, 0.99, 1.0):
    h = "inf" if g == 1 else f"{1/(1-g):.0f}"
    print(f"{g:>6} {sweeps_to_converge(g):>7} {h:>16}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>How fast it converges</>}
        intro={<>We know iterative evaluation gets to <M>{String.raw`V^\pi`}</M> eventually. The practical question
          is <em>how many sweeps</em> — and the answer ties back to a number we already met. Convergence is
          geometric at rate <M>{String.raw`\gamma`}</M>, so the same discount that decides how far-sighted your
          agent is also decides how long you wait for its values.</>}
      />

      <div className="lesson">
        <h2>Geometric convergence</h2>
        <p>
          Because the Bellman backup is a <M>{String.raw`\gamma`}</M>-contraction, the error shrinks by at least a
          factor of <M>{String.raw`\gamma`}</M> every sweep. After <M>k</M> sweeps the distance to the true
          value is bounded by
        </p>
        <MathBlock>{String.raw`\lVert V_k - V^\pi\rVert_\infty \;\le\; \gamma^{k}\,\lVert V_0 - V^\pi\rVert_\infty.`}</MathBlock>
        <p>
          To drive the error below a tolerance <M>{String.raw`\varepsilon`}</M> you therefore need on the order of{" "}
          <M>{String.raw`k \approx \dfrac{\ln(1/\varepsilon)}{1-\gamma}`}</M> sweeps — the count grows with the
          <strong> effective horizon</strong> <M>{String.raw`\tfrac{1}{1-\gamma}`}</M>. The very same quantity
          that told us how far ahead the agent plans now tells us how many backups the planning costs. Measure it:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{` gamma  sweeps  horizon 1/(1-g)
   0.5      14                2
   0.9      60               10
  0.99     147              100
   1.0     173              inf`}</CodeOutput>
        <p>
          The trend is unmistakable — a more far-sighted agent (larger <M>{String.raw`\gamma`}</M>) takes more
          sweeps: 14, 60, 147. This is a real cost of foresight, and it is why a discount slightly below 1 is
          often chosen even for episodic tasks: <M>{String.raw`\gamma = 0.99`}</M> converges markedly faster than{" "}
          <M>{String.raw`\gamma = 1`}</M> while behaving almost identically.
        </p>

        <Callout color={GOLD} title={<>The bound is worst-case — reality is often kinder</>}>
          Notice the numbers don&rsquo;t match the crude bound. For <M>{String.raw`\gamma = 0.99`}</M> and{" "}
          <M>{String.raw`\varepsilon = 10^{-4}`}</M>, <M>{String.raw`\ln(1/\varepsilon)/(1-\gamma) \approx 920`}</M>{" "}
          sweeps — yet it converged in <strong>147</strong>. The bound uses the worst possible contraction rate,{" "}
          <M>{String.raw`\gamma`}</M>; the <em>actual</em> rate is set by the second-largest eigenvalue of{" "}
          <M>{String.raw`P^\pi`}</M>, which for a fast-mixing chain like this grid is well below{" "}
          <M>{String.raw`\gamma`}</M>. So <M>{String.raw`\tfrac{1}{1-\gamma}`}</M> is the honest upper bound on
          how bad it can get, not a prediction — a distinction worth keeping whenever you see a convergence rate
          quoted.
        </Callout>

        <h2>The discount is a dial with two effects</h2>
        <p>
          Choosing <M>{String.raw`\gamma`}</M> is a genuine tradeoff, and now you can see both sides of it at
          once. Push it toward 1 and the agent sees further, valuing long-delayed rewards it might otherwise
          ignore — but every value computation slows, because the horizon it must propagate over grows. Pull it
          down and evaluation flies, but the agent turns short-sighted and may miss payoffs that lie beyond its
          shrunken horizon. There is no universally right value; there is the smallest <M>{String.raw`\gamma`}</M>{" "}
          whose horizon still comfortably covers the delay between the actions you care about and the rewards
          that justify them.
        </p>

        <Proof title="the geometric bound, in one line" color={GOLD}>
          <p>
            Let <M>{String.raw`T^\pi`}</M> be the backup, with fixed point <M>{String.raw`V^\pi`}</M>. Contraction
            gives <M>{String.raw`\lVert V_{k} - V^\pi\rVert = \lVert T^\pi V_{k-1} - T^\pi V^\pi\rVert \le \gamma\lVert V_{k-1} - V^\pi\rVert`}</M>.
            Apply this <M>k</M> times: <M>{String.raw`\lVert V_k - V^\pi\rVert \le \gamma^k\lVert V_0 - V^\pi\rVert`}</M>.
            Setting the right side below <M>{String.raw`\varepsilon`}</M> and solving for <M>k</M> gives{" "}
            <M>{String.raw`k \ge \frac{\ln(\lVert V_0 - V^\pi\rVert/\varepsilon)}{\ln(1/\gamma)}`}</M>, and since{" "}
            <M>{String.raw`\ln(1/\gamma) \approx 1-\gamma`}</M> for <M>{String.raw`\gamma`}</M> near 1, the sweep
            count scales as <M>{String.raw`\frac{1}{1-\gamma}`}</M>. The same algebra bounds value iteration for{" "}
            <M>{String.raw`V^*`}</M>, since its backup is a <M>{String.raw`\gamma`}</M>-contraction too.
          </p>
        </Proof>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>Iterative evaluation converges geometrically. What sets the guaranteed rate?</>,
              options: [
                "The number of states",
                "The discount factor γ — the error shrinks by at least a factor γ each sweep",
                "The initial guess",
              ],
              answer: 1,
              explain: <>The backup is a γ-contraction, so <M>{String.raw`\lVert V_k - V^\pi\rVert \le \gamma^k\lVert V_0 - V^\pi\rVert`}</M>.
                The worst-case per-sweep shrink factor is exactly γ.</>,
            },
            {
              q: <>Why did γ = 0.99 converge in ~147 sweeps when the bound predicted ~920?</>,
              options: [
                "The bound is wrong",
                "The bound uses the worst-case rate γ; the true rate depends on the chain's mixing (second eigenvalue), which is faster here",
                "The tolerance was ignored",
              ],
              answer: 1,
              explain: <>The <M>{String.raw`1/(1-\gamma)`}</M> estimate is an upper bound assuming the slowest
                possible contraction. A fast-mixing chain contracts faster than γ, so real convergence beats the
                bound — the bound caps the damage, it doesn&rsquo;t predict it.</>,
            },
            {
              q: <>Why might you pick γ = 0.99 over γ = 1 even for a task that always ends?</>,
              options: [
                "It changes the optimal policy entirely",
                "It converges noticeably faster while behaving almost identically",
                "γ = 1 is not allowed in episodic tasks",
              ],
              answer: 1,
              explain: <>For a proper episodic task both are valid, but a slight discount speeds every value
                computation (smaller effective horizon) while barely changing behaviour — a cheap win in practice.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/reading-a-value-landscape", label: <>← Reading a value landscape</> }}
          next={{ href: "/learn/markov-decision-processes/when-markov-breaks", label: <>Next chapter · When the Markov assumption breaks →</> }}
        />
      </div>
    </article>
  );
}
