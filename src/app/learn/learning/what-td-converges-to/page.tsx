import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { StepSizeFloorLab } from "@/components/labs/StepSizeFloorLab";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "What TD converges to — Manifold",
  description:
    "TD bootstraps off estimates that start out wrong, yet it converges to the exact Vπ. The reason: the expected TD update IS the Bellman backup, a contraction whose fixed point is Vπ — and stochastic approximation handles the noise.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatTdConvergesTo() {
  const code = `env = make_goal_env(); gamma = 0.9
policy = np.full((nS, nA), 1/nA)
Vtrue = dp_eval(env, policy, gamma)              # oracle Vπ — we claim this is the TD fixed point

def mean_td_error(V, s, n=50000):                # average the TD error over many samples
    errs = []
    for _ in range(n):
        env.reset(s); a = int(env.rng.choice(nA, p=policy[s]))
        s2, r, done = env.step(a)
        errs.append(r + gamma * (0.0 if done else V[s2]) - V[s])
    return np.mean(errs)

env.seed(0)
print("mean TD error at V = Vπ (the fixed point) — should be ~0:")
for s in (6, 9, 12):
    print(f"  state {s:2d}:  {mean_td_error(Vtrue, s):+.4f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 9 minutes"
        title={<>What TD converges to</>}
        intro={<>TD updates an estimate using an estimate. At the start both are wrong. It should, by all rights,
          chase its own tail forever — and instead it lands squarely on the true value function. The reason is worth
          seeing clearly, because it is the same contraction argument that made planning work, now wearing a
          disguise.</>}
      />

      <div className="lesson">
        <h2>The key fact: the expected TD update is a Bellman backup</h2>
        <p>
          Strip the noise away and ask what the TD update does <em>on average.</em> The target is{" "}
          <M>{String.raw`R_{t+1} + \gamma V(S_{t+1})`}</M>, where the reward and next state are sampled from the world
          under <M>\pi</M>. Take its expectation:
        </p>
        <MathBlock>{String.raw`\mathbb{E}\big[R_{t+1} + \gamma V(S_{t+1}) \mid S_t = s\big] = \sum_a \pi(a\mid s)\Big[R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V(s')\Big] = (T^\pi V)(s).`}</MathBlock>
        <p>
          That right-hand side is exactly the <Link href="/learn/markov-decision-processes/bellman-expectation" style={link}>
          Bellman expectation operator</Link> <M>{String.raw`T^\pi`}</M> from the MDP track. So <strong>in
          expectation, one TD step moves <M>V</M> toward <M>{String.raw`T^\pi V`}</M></strong> — the very backup that
          iterative policy evaluation applied deliberately, TD applies in expectation, one sampled step at a time. TD
          is stochastic policy evaluation.
        </p>
        <p>
          We proved in the MDP track that <M>{String.raw`T^\pi`}</M> is a <M>\gamma</M>-contraction with a single
          fixed point, <M>{String.raw`V^\pi`}</M>. So the only value function the expected update leaves unchanged is
          <M>{String.raw`V^\pi`}</M> — and there the expected TD error is zero. Let&rsquo;s confirm that fixed-point
          property directly: plug in the true <M>{String.raw`V^\pi`}</M> and average the TD error over many samples.
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`mean TD error at V = Vπ (the fixed point) — should be ~0:
  state  6:  -0.0009
  state  9:  +0.0009
  state 12:  +0.0003`}</CodeOutput>
        <p>
          Essentially zero at every state, up to sampling noise. At <M>{String.raw`V^\pi`}</M> the individual TD
          errors on any given step are <em>not</em> zero — the target still jumps around with the sampled reward and
          next state — but they are zero <strong>on average.</strong> The updates cancel, and the estimate has nowhere
          to drift. That is what it means to be the fixed point.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="If the expected update is a contraction toward Vπ, why doesn't a constant step size α land TD exactly on Vπ?"
          options={[
            "It does — constant α converges exactly",
            "Each real update is the expected backup PLUS zero-mean noise; a fixed α never stops injecting that noise, so V hovers in a cloud around Vπ instead of settling",
            "Because the contraction factor γ is too small",
          ]}
          nudge="Locked in. Constant α = persistent noise = a steady-state jitter. Shrinking α at the right rate is what silences the noise and pins V to Vπ."
        />

        <h2>From &ldquo;right on average&rdquo; to &ldquo;converges&rdquo;</h2>
        <p>
          &ldquo;The expected update contracts toward <M>{String.raw`V^\pi`}</M>&rdquo; is not quite convergence,
          because real updates carry noise. Bridging the gap is the job of <strong>stochastic approximation</strong>
          {" "}(the Robbins&ndash;Monro theorem) — the mathematics of driving a noisy quantity to the root of its
          expected value by taking ever-smaller steps. It converges when the step sizes satisfy two conditions:
        </p>
        <MathBlock>{String.raw`\sum_{n=1}^{\infty}\alpha_n = \infty \qquad\text{and}\qquad \sum_{n=1}^{\infty}\alpha_n^{2} < \infty.`}</MathBlock>
        <p>
          The first keeps steps large enough, for long enough, to reach the answer from any start (you can always
          still move). The second forces them to shrink fast enough that the noise averages out and the estimate
          settles (the wobble dies). A schedule like <M>{String.raw`\alpha_n = 1/n`}</M> satisfies both;{" "}
          <M>{String.raw`\alpha_n = 1/\sqrt n`}</M> fails the second (too much lingering noise); a constant{" "}
          <M>\alpha</M> fails both, which is exactly why our constant-<M>\alpha</M> run hovered near{" "}
          <M>{String.raw`V^\pi`}</M> rather than nailing it.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Slide <M>\alpha</M> and watch the error curve: it plunges, then <em>stalls</em> at a dashed floor
            and jitters there. Read the floor off the bars below. Does turning <M>\alpha</M> up make the floor higher or
            lower?</>}
          insight={<>A constant step size never lands on <M>{String.raw`V^\pi`}</M> — it hovers in a cloud whose size
            grows with <M>\alpha</M>, because every update keeps injecting fresh sampling noise. That is precisely the
            gap the Robbins&ndash;Monro conditions close: only a step size that <em>shrinks</em> (yet not too fast) can
            silence the noise and pin the estimate to the truth.</>}
        >
          <StepSizeFloorLab />
        </LabFrame>

        <Proof title="the stochastic-approximation convergence of tabular TD(0)" color={GOLD}>
          <p>
            Write the TD update at a state as{" "}
            <M>{String.raw`V(s) \leftarrow V(s) + \alpha_n\big[(T^\pi V)(s) - V(s) + \omega_n\big]`}</M>, where we
            have added and subtracted the expected target. Here <M>{String.raw`(T^\pi V)(s) - V(s)`}</M> is the
            deterministic drift and <M>{String.raw`\omega_n = \big(R + \gamma V(S') \big) - (T^\pi V)(s)`}</M> is the
            <em> noise</em> — the deviation of the one sampled target from its mean.
          </p>
          <p>
            The noise is, by construction, zero-mean given the past:{" "}
            <M>{String.raw`\mathbb{E}[\omega_n \mid \mathcal{F}_n] = 0`}</M>, and on a grid with bounded rewards it
            has bounded variance. The drift is a contraction: <M>{String.raw`T^\pi`}</M> shrinks distances to{" "}
            <M>{String.raw`V^\pi`}</M> by <M>\gamma</M> in the sup-norm. Dvoretzky&rsquo;s stochastic-approximation
            theorem then applies: given a contraction toward a fixed point, zero-mean bounded-variance noise, every
            state updated infinitely often, and step sizes with{" "}
            <M>{String.raw`\sum\alpha_n=\infty,\ \sum\alpha_n^2<\infty`}</M>, the iterates converge to the fixed point{" "}
            <M>{String.raw`V^\pi`}</M> almost surely.
          </p>
          <p>
            Read the two step-size conditions against the two error sources and they are almost self-explanatory.{" "}
            <M>{String.raw`\sum\alpha_n=\infty`}</M> defeats the <em>bias</em> from a bad initial guess — the total
            distance you can still travel is unbounded, so no starting error can trap you. And{" "}
            <M>{String.raw`\sum\alpha_n^2<\infty`}</M> defeats the <em>variance</em> — the accumulated noise the steps
            let through is finite, so the wobble is eventually squeezed to nothing. Steps large enough to arrive,
            shrinking fast enough to settle. It is the same pair of conditions that governs stochastic gradient
            descent, for the same reason.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>The through-line to planning</>}>
          Iterative policy evaluation applied <M>{String.raw`T^\pi`}</M> exactly and converged to{" "}
          <M>{String.raw`V^\pi`}</M> by contraction. TD applies <M>{String.raw`T^\pi`}</M> <em>in expectation</em>,
          from samples, and converges to the same <M>{String.raw`V^\pi`}</M> by contraction-plus-stochastic-
          approximation. Learning is planning with the exact backup replaced by a noisy sampled one — and the same
          fixed-point mathematics carries the guarantee across.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/td-vs-monte-carlo", label: <>← TD vs Monte Carlo</> }}
          next={{ href: "/learn/learning/batch-td-vs-mc", label: <>Next · Batch TD vs MC →</> }}
        />
      </div>
    </article>
  );
}
