import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "First-visit vs every-visit — Manifold",
  description:
    "A single episode can visit a state many times. Do you average the return from only the first visit, or from every visit? One is unbiased, the other reuses more data — and on our grid they differ by 30×. When each wins.",
};

const GOLD = "var(--c-rl)";

export default function FirstVisitVsEveryVisit() {
  const code = `env = make_goal_env(); gamma = 0.9
policy = np.full((nS, nA), 1/nA)

def mc_predict(env, policy, gamma, episodes, first_visit, seed=1):
    V = np.zeros(nS); N = np.zeros(nS); env.seed(seed)
    for _ in range(episodes):
        s = env.reset("uniform"); traj = []; done = False; steps = 0
        while not done and steps < 500:
            a = int(env.rng.choice(nA, p=policy[s]))
            s2, r, done = env.step(a); traj.append((s, r)); s = s2; steps += 1
        G = 0.0; seen = set()
        for s_t, r_t in reversed(traj):
            G = r_t + gamma * G
            if first_visit and s_t in seen:      # the ONLY difference: skip repeats
                continue
            seen.add(s_t); N[s_t] += 1
            V[s_t] += (G - V[s_t]) / N[s_t]
    return V

truth = dp_eval(env, policy, gamma)
nonterm = [s for s in range(nS) if s not in env.terminals]
for fv in (True, False):
    V = mc_predict(env, policy, gamma, 20000, fv)
    err = np.max(np.abs((V - truth)[nonterm]))
    print(f"{'first' if fv else 'every'}-visit:  max error vs truth = {err:.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 7 minutes"
        title={<>First-visit vs every-visit</>}
        intro={<>A wandering agent can pass through the same state several times in one episode. When you average
          returns, do you count only the <em>first</em> time it saw each state, or <em>every</em> time? It sounds
          like a footnote. On our grid the two answers differ by a factor of thirty — and the reason why is worth
          understanding.</>}
      />

      <div className="lesson">
        <h2>The two estimators</h2>
        <p>
          Within a single episode, a state <M>s</M> might be visited at steps 3, 7, and 11. Each visit has a return
          following it — three different numbers (the later a visit, the fewer rewards remain). Two conventions:
        </p>
        <ul>
          <li>
            <strong>First-visit MC.</strong> Use only the return following the <em>first</em> time <M>s</M> is
            visited in each episode. Across episodes, you average one return per episode per state.
          </li>
          <li>
            <strong>Every-visit MC.</strong> Use the return following <em>every</em> visit. A state hit three times
            contributes three returns from that one episode.
          </li>
        </ul>
        <p>
          In code it is a one-line difference — a <code>seen</code> set that first-visit checks and every-visit
          ignores:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`first-visit:  max error vs truth = 0.251
every-visit:  max error vs truth = 0.008`}</CodeOutput>
        <p>
          Same episodes, same 20,000 rollouts — and every-visit is <strong>thirty times more accurate</strong> here.
          That is not a fluke of this seed; it is structural, and it is the opposite of what the textbook ordering
          (first-visit is the &ldquo;canonical&rdquo; one) might lead you to expect.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Why is every-visit so much more accurate on this grid, despite first-visit being the 'cleaner', unbiased estimator?"
          options={[
            "Every-visit is unbiased and first-visit is not — the reverse of what was claimed",
            "Every-visit reuses every pass through a state, so states that are rarely the FIRST one seen still collect many samples; first-visit starves them",
            "First-visit has a bug in the seen-set logic",
          ]}
          nudge="Locked in. Under exploring starts, a goal-adjacent cell is seldom where an episode BEGINS, so first-visit sees it rarely — while every-visit counts every time an episode wanders through it."
        />

        <h2>Why the gap is so large here</h2>
        <p>
          Under exploring starts, each episode <em>begins</em> in a uniformly random cell. A state like the one just
          left of the goal is rarely the starting cell — but almost every episode <em>wanders through it</em> on the
          way to terminating. First-visit throws away all those pass-throughs unless the state happened to be first,
          so it collects very few samples there and its estimate stays noisy. Every-visit banks each pass, so the
          same rare-to-start states are richly sampled. More samples, lower variance — the thirty-fold gap is just{" "}
          <M>{String.raw`1/\sqrt{N}`}</M> doing its work with a much larger <M>N</M>.
        </p>

        <h2>So which is &ldquo;right&rdquo;?</h2>
        <p>
          Both converge to <M>{String.raw`V^\pi`}</M> as episodes <M>{String.raw`\to\infty`}</M> — they are both
          consistent. They differ in their finite-sample character:
        </p>
        <ul>
          <li>
            <strong>First-visit is unbiased.</strong> Each episode contributes one return per state, and those
            returns are independent across episodes — a clean i.i.d. average whose expectation is exactly{" "}
            <M>{String.raw`V^\pi(s)`}</M> at every episode count.
          </li>
          <li>
            <strong>Every-visit is biased at finite <M>N</M></strong> (multiple returns from one episode are
            correlated, and the count is inflated), but <strong>consistent</strong>, and often lower{" "}
            <em>mean-squared error</em> because the extra data crushes variance faster than the bias hurts — exactly
            what we see here.
          </li>
        </ul>

        <Proof title="why first-visit returns are i.i.d. and every-visit's are not" color={GOLD}>
          <p>
            <strong>First-visit.</strong> Consider a fixed state <M>s</M>. In each episode that reaches <M>s</M>,
            take the return from its first occurrence, <M>{String.raw`G^{(i)}`}</M>. By the Markov property, once the
            process arrives at <M>s</M> the future is governed only by <M>s</M> and <M>\pi</M> — independent of how it
            got there and of every other episode. So <M>{String.raw`G^{(1)}, G^{(2)}, \dots`}</M> are independent and
            identically distributed with mean <M>{String.raw`V^\pi(s)`}</M>. Their average is therefore unbiased at
            every <M>N</M>, and the strong law gives convergence. This is the textbook-clean estimator.
          </p>
          <p>
            <strong>Every-visit.</strong> Now suppose an episode visits <M>s</M> at times{" "}
            <M>{String.raw`t_1 < t_2`}</M>. The two returns <M>{String.raw`G_{t_1}`}</M> and{" "}
            <M>{String.raw`G_{t_2}`}</M> share the <em>same</em> tail of rewards (everything after{" "}
            <M>{String.raw`t_2`}</M> appears in both, discounted differently), so they are <em>correlated</em>. The
            average of correlated, non-identically-distributed returns is biased for finite samples: an early bad
            estimate of a downstream state feeds back into the count. As <M>{String.raw`N\to\infty`}</M> the bias
            washes out (each visit&rsquo;s return still has the right conditional mean), so it stays consistent —
            just not unbiased.
          </p>
          <p>
            The practical upshot: first-visit is the safe default when you want an estimator you can reason about
            cleanly; every-visit is what you reach for when data is scarce and you can tolerate a vanishing bias for
            a large variance reduction — and it generalises more naturally to the incremental, function-approximation
            settings later in the family.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>The takeaway</>}>
          The choice is a bias&ndash;variance knob, not a right-or-wrong. First-visit: unbiased, clean, one sample
          per episode. Every-visit: a touch of bias, far more samples, usually lower error when episodes revisit
          states — as they do whenever an agent wanders. Both are still Monte Carlo, and both still carry Monte
          Carlo&rsquo;s one big cost: they need the episode to <em>end</em> before they can learn anything at all.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/monte-carlo-prediction", label: <>← Monte Carlo prediction</> }}
          next={{ href: "/learn/learning/monte-carlo-control", label: <>Next · Monte Carlo control →</> }}
        />
      </div>
    </article>
  );
}
