import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { NStepDialLab } from "@/components/labs/NStepDialLab";

export const metadata = {
  title: "n-step returns — Manifold",
  description:
    "Monte Carlo and TD are the two ends of one dial. n-step returns bootstrap after n real rewards instead of one — and the best value of n is almost always in the middle, beating both pure TD and pure Monte Carlo.",
};

const GOLD = "var(--c-rl)";

export default function NStepReturns() {
  const code = `import numpy as np
NS = 21                                    # 19-state random walk: 0..20, ends terminal, start at 10
true = np.array([-1 + 2*i/20 for i in range(NS)]); true[0] = true[20] = 0

def nstep_walk(n, alpha, episodes, seed):
    rng = np.random.default_rng(seed); V = np.zeros(NS)
    for _ in range(episodes):
        s = 10; S = [s]; R = [0.0]; T = 10**9; t = 0
        while True:
            if t < T:                                     # keep acting until termination
                s2 = s + rng.choice([-1, 1])
                r = 1.0 if s2 == 20 else (-1.0 if s2 == 0 else 0.0)
                S.append(s2); R.append(r)
                if s2 in (0, 20): T = t + 1
                s = s2
            tau = t - n + 1                               # the step whose value we can now update
            if tau >= 0:
                G = sum(R[i] for i in range(tau+1, min(tau+n, T)+1))   # n real rewards (gamma=1)
                if tau + n < T: G += V[S[tau+n]]                        # then bootstrap
                V[S[tau]] += alpha * (G - V[S[tau]])
            if tau == T - 1: break
            t += 1
    return np.sqrt(np.mean((V[1:20] - true[1:20])**2))

for n in (1, 2, 4, 8, 16):
    rms = np.mean([nstep_walk(n, 0.4, 10, s) for s in range(100)])
    tag = "TD(0)" if n == 1 else ("~ Monte Carlo" if n == 16 else "in between")
    print(f"n={n:>2}  ({tag:>13}):  RMS = {rms:.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>n-step returns</>}
        intro={<>TD and Monte Carlo have felt like rivals — bootstrap after one step, or wait for the whole return.
          They are really the two ends of a single dial. n-step returns bootstrap after <em>n</em> real rewards, and
          the punchline is that the best setting is almost never at either extreme: some middle <em>n</em> beats both
          pure TD and pure Monte Carlo.</>}
      />

      <div className="lesson">
        <h2>One dial, two familiar ends</h2>
        <p>
          TD(0) uses a one-step target: one real reward, then bootstrap. Monte Carlo uses the full return: all the
          real rewards, no bootstrap. The obvious thing to do is anything in between — take <M>n</M> real rewards,
          <em> then</em> bootstrap off the value <M>n</M> steps ahead:
        </p>
        <MathBlock>{String.raw`G_{t:t+n} = R_{t+1} + \gamma R_{t+2} + \cdots + \gamma^{n-1}R_{t+n} + \gamma^{n}\,V(S_{t+n}).`}</MathBlock>
        <p>
          Set <M>n=1</M> and the sum is one reward plus <M>{String.raw`\gamma V(S_{t+1})`}</M> — the TD target. Let{" "}
          <M>{String.raw`n\to\infty`}</M> (or to episode end) and the bootstrap term vanishes, leaving the full return
          — the Monte Carlo target. Every <M>n</M> in between is a genuine new algorithm, and the update is the same
          as ever: <M>{String.raw`V(S_t) \leftarrow V(S_t) + \alpha[G_{t:t+n} - V(S_t)]`}</M>.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Sweep n from 1 (TD) upward on the random walk. Where is the error lowest?"
          options={[
            "At n = 1 — bootstrapping is always best",
            "At the largest n — Monte Carlo is unbiased, so it wins",
            "At an intermediate n — enough real reward to cut TD's bias, not so much that MC's variance dominates",
          ]}
          nudge="Locked in. The bias–variance trade has an interior optimum: a few real steps, then bootstrap. The bar chart makes the U unmistakable."
        />

        <h2>The U-shape</h2>
        <p>
          On the 19-state random walk — the standard n-step testbed — sweep <M>n</M> and measure the value error
          after a handful of episodes:
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`n= 1  (        TD(0)):  RMS = 0.310
n= 2  (   in between):  RMS = 0.166
n= 4  (   in between):  RMS = 0.205
n= 8  (   in between):  RMS = 0.320
n=16  (~ Monte Carlo):  RMS = 0.435`}</CodeOutput>
        <p>
          A clean valley. Pure TD (<M>{String.raw`n=1`}</M>) errs at <M>{String.raw`0.310`}</M>; the MC-like extreme
          (<M>{String.raw`n=16`}</M>) is worst at <M>{String.raw`0.435`}</M>; and <M>{String.raw`n=2`}</M> wins
          handily at <M>{String.raw`0.166`}</M> — less than half the error of either end. Why an interior optimum?
          Small <M>n</M> leans hard on a bootstrap that is still biased (early estimates are wrong); large <M>n</M>{" "}
          drags in more of the trajectory&rsquo;s variance. The best <M>n</M> collects just enough real reward to
          break free of the bad estimates without swallowing the full noise of the return.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Run sweep</strong> and read the bars: the shortest is the best <M>n</M>, and it
            sits in the middle, not at either end. Now drag <M>\alpha</M>. At small step sizes the sweet spot moves
            toward larger <M>n</M>; at large <M>\alpha</M> it moves toward TD. The dial&rsquo;s best setting depends
            on the problem and the step size — which is exactly why having the dial matters.</>}
          insight={<>There is no universally best <M>n</M> — but there is almost always a middle <M>n</M> better than
            both extremes. n-step returns turn the TD-vs-MC choice from a binary into a continuum you can tune, and
            they are the stepping-stone to eligibility traces, which average over <em>all</em> n at once.</>}
        >
          <NStepDialLab />
        </LabFrame>

        <h2>n-step control, too</h2>
        <p>
          The same idea lifts straight to control: <strong>n-step SARSA</strong> bootstraps off{" "}
          <M>{String.raw`Q(S_{t+n}, A_{t+n})`}</M> after <M>n</M> real rewards, and n-step methods often learn
          markedly faster than one-step SARSA because a single good (or bad) outcome propagates its credit back{" "}
          <M>n</M> states in one update instead of seeping back one state per episode. The cost is that you must wait{" "}
          <M>n</M> steps before each update and store the last <M>n</M> transitions — a small price for much faster
          credit assignment.
        </p>

        <Callout color={GOLD} title={<>The unification, and what&rsquo;s left</>}>
          MC and TD are not two methods but the endpoints of the n-step family. That reframes every earlier chapter:
          the bias&ndash;variance trade you kept meeting is a single knob, <M>n</M>, and the good settings live in its
          interior. One question remains — do you have to <em>pick</em> one <M>n</M>? The next page&rsquo;s answer,
          eligibility traces, is to elegantly average over all of them at once, and recover online, incremental
          learning while doing it.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/double-q-learning", label: <>← Double Q-learning</> }}
          next={{ href: "/learn/learning/eligibility-traces", label: <>Next · Eligibility traces →</> }}
        />
      </div>
    </article>
  );
}
