import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Knowing when to stop — Manifold",
  description:
    "Value iteration only reaches V* in the limit, so you need a stopping rule. The Bellman-error bound: if the largest change in a sweep is δ, then the value error is at most γδ/(1−γ) — a safe, computable guarantee.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function KnowingWhenToStop() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3

# the true V* (run to machine precision), for comparison only
Vstar = np.zeros(nS)
for _ in range(5000):
    nV = (R + gamma * (P @ Vstar)).max(1); nV[[GOAL, PIT]] = 0.0
    if np.max(np.abs(nV - Vstar)) < 1e-13: break
    Vstar = nV

# value iteration, printing the per-sweep change delta, the GUARANTEED error bound
# gamma/(1-gamma)*delta, and (cheating, for illustration) the true error.
V = np.zeros(nS)
for k in range(1, 8):
    nV = (R + gamma * (P @ V)).max(1); nV[[GOAL, PIT]] = 0.0
    delta = np.max(np.abs(nV - V)); V = nV
    bound = gamma / (1 - gamma) * delta
    true_err = np.max(np.abs(V - Vstar))
    print(f"sweep {k}: delta={delta:.3f}  bound={bound:.3f}  (true error {true_err:.3f})")
    if delta < 1e-6: break`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>Knowing when to stop</>}
        intro={<>Policy iteration has a perfect stopping test — halt when the policy stops changing. Value iteration
          does not: its values only reach <M>{String.raw`V^*`}</M> in the limit, creeping closer forever. So you need
          a rule that says &ldquo;close enough,&rdquo; with a guarantee. There is a clean one, and it costs nothing
          extra to compute.</>}
      />

      <div className="lesson">
        <h2>The change you can see vs the error you can&rsquo;t</h2>
        <p>
          After a sweep you can measure <M>{String.raw`\delta = \lVert V_{k+1} - V_k\rVert_\infty`}</M> — the largest
          value change this sweep, which you already compute to check convergence. What you <em>cannot</em> directly
          see is the thing you actually care about: <M>{String.raw`\lVert V_{k+1} - V^*\rVert_\infty`}</M>, the
          distance to the true optimum. The key result links them:
        </p>
        <MathBlock>{String.raw`\lVert V_{k+1} - V^*\rVert_\infty \;\le\; \frac{\gamma}{1-\gamma}\,\lVert V_{k+1} - V_k\rVert_\infty = \frac{\gamma}{1-\gamma}\,\delta.`}</MathBlock>
        <p>
          The measurable per-sweep change <M>{String.raw`\delta`}</M>, scaled by <M>{String.raw`\frac{\gamma}{1-\gamma}`}</M>,
          is a rigorous upper bound on your true distance to <M>{String.raw`V^*`}</M>. So a safe stopping rule is:
          run until <M>{String.raw`\delta \le \varepsilon\,\frac{1-\gamma}{\gamma}`}</M>, and you are guaranteed
          within <M>{String.raw`\varepsilon`}</M> of optimal. Watch the bound hold, sweep by sweep:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`sweep 1: delta=1.000  bound=9.000  (true error 0.900)
sweep 2: delta=0.900  bound=8.100  (true error 0.810)
sweep 3: delta=0.810  bound=7.290  (true error 0.729)
sweep 4: delta=0.729  bound=6.561  (true error 0.656)
sweep 5: delta=0.656  bound=5.905  (true error 0.590)
sweep 6: delta=0.590  bound=5.314  (true error 0.000)
sweep 7: delta=0.000  bound=0.000  (true error 0.000)`}</CodeOutput>
        <p>
          Two things to read here. First, the bound is always <em>above</em> the true error — it never lies to you in
          the dangerous direction, which is the whole point of a stopping guarantee. Second, it is{" "}
          <em>conservative</em>: at sweep 5 the true error is 0.59 but the bound says only &ldquo;within 5.9.&rdquo;
          The factor <M>{String.raw`\frac{\gamma}{1-\gamma}`}</M> blows up as <M>{String.raw`\gamma \to 1`}</M> —
          another face of the effective horizon — so near-undiscounted problems need a much smaller{" "}
          <M>{String.raw`\delta`}</M> before the guarantee bites.
        </p>

        <Callout color={GOLD} title={<>The δ trap</>}>
          Look at sweep 6: the values have actually reached <M>{String.raw`V^*`}</M> exactly (true error 0), yet{" "}
          <M>{String.raw`\delta`}</M> is still 0.59 — the previous sweep&rsquo;s big jump. A small{" "}
          <M>{String.raw`\delta`}</M> is <em>sufficient</em> for closeness, but a large <M>{String.raw`\delta`}</M>{" "}
          does <strong>not</strong> mean you are far away. Never read <M>{String.raw`\delta`}</M> itself as your
          error — always scale it by <M>{String.raw`\frac{\gamma}{1-\gamma}`}</M>. Reading the raw change as the
          error is one of the most common practical mistakes in dynamic programming.
        </Callout>

        <PredictPrompt
          accent={GOLD}
          prompt="As γ → 1, what happens to the stopping bound γ/(1−γ)·δ, and why does it matter?"
          options={[
            "It shrinks, so you can stop sooner",
            "It blows up, so you need a far smaller δ (many more sweeps) to certify the same accuracy",
            "It stays constant",
          ]}
          nudge="Locked in. The effective horizon 1/(1−γ) governs both foresight and how long you must iterate."
        />

        <p>
          There is a subtler practical point too. Because the <em>policy</em> converges before the values (last
          chapter), you can also stop when the greedy policy stops changing across sweeps — often far earlier than
          the value bound allows. In practice people use both: iterate until <M>{String.raw`\delta`}</M> is small{" "}
          <em>and</em> the greedy policy is stable, then extract that policy. The next page is about that extraction.
        </p>

        <Proof title="deriving the γδ/(1−γ) bound" color={GOLD}>
          <p>
            Write <M>T</M> for the Bellman optimality operator (a <M>{String.raw`\gamma`}</M>-contraction with fixed
            point <M>{String.raw`V^*`}</M>, from the MDP track). We have <M>{String.raw`V_{k+1} = T V_k`}</M> and{" "}
            <M>{String.raw`V^* = T V^*`}</M>. Bound the distance to <M>{String.raw`V^*`}</M> by inserting{" "}
            <M>{String.raw`V_{k+1}`}</M> and using the contraction:
          </p>
          <MathBlock>{String.raw`\lVert V^* - V_{k+1}\rVert = \lVert TV^* - TV_{k+1}\rVert \le \gamma\lVert V^* - V_{k+1}\rVert + \gamma\lVert V_{k+1} - V_k\rVert,`}</MathBlock>
          <p>
            where the last step used the triangle inequality{" "}
            <M>{String.raw`\lVert V^* - V_{k+1}\rVert \le \lVert V^* - V_{k+2}\rVert + \lVert V_{k+2}-V_{k+1}\rVert`}</M>{" "}
            together with <M>{String.raw`\lVert V_{k+2} - V_{k+1}\rVert = \lVert TV_{k+1} - TV_k\rVert \le \gamma\lVert V_{k+1} - V_k\rVert`}</M>.
            Collecting the <M>{String.raw`\lVert V^* - V_{k+1}\rVert`}</M> terms:
          </p>
          <MathBlock>{String.raw`(1-\gamma)\lVert V^* - V_{k+1}\rVert \le \gamma\lVert V_{k+1} - V_k\rVert \;\Longrightarrow\; \lVert V^* - V_{k+1}\rVert \le \frac{\gamma}{1-\gamma}\,\delta.`}</MathBlock>
          <p>
            The one ingredient is the contraction factor <M>{String.raw`\gamma`}</M>; the <M>{String.raw`\frac{1}{1-\gamma}`}</M>{" "}
            is the geometric sum of all the future shrinking still to come. That is why the same constant governs the
            effective horizon, the return bound, and now the stopping rule — they are all{" "}
            <M>{String.raw`\sum_k \gamma^k`}</M> wearing different hats.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/planning/value-iteration-is-truncated-pi", label: <>← Truncated policy iteration</> }}
          next={{ href: "/learn/planning/from-values-to-a-plan", label: <>Next · From values to a plan →</> }}
        />
      </div>
    </article>
  );
}
