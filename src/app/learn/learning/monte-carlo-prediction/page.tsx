import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Monte Carlo prediction — Manifold",
  description:
    "The most literal way to learn a value function from experience: play out whole episodes, average the returns that actually followed each state. No model, no bootstrapping — just the definition of a value function, estimated by sampling.",
};

const GOLD = "var(--c-rl)";

export default function MonteCarloPrediction() {
  const code = `env = make_goal_env(); gamma = 0.9
policy = np.full((nS, nA), 1/nA)          # the random policy we want to evaluate

def mc_predict(env, policy, gamma, episodes, seed=1):
    V = np.zeros(nS); N = np.zeros(nS)     # value estimate, and visit counts
    env.seed(seed)
    for _ in range(episodes):
        # 1. roll out one COMPLETE episode under the policy
        s = env.reset("uniform"); traj = []; done = False; steps = 0
        while not done and steps < 500:
            a = int(env.rng.choice(nA, p=policy[s]))
            s2, r, done = env.step(a); traj.append((s, r)); s = s2; steps += 1
        # 2. walk backwards, accumulating the return, folding it into a running mean
        G = 0.0
        for s_t, r_t in reversed(traj):
            G = r_t + gamma * G                  # the return that followed s_t
            N[s_t] += 1
            V[s_t] += (G - V[s_t]) / N[s_t]      # incremental average of returns
    return V

V = mc_predict(env, policy, gamma, 20000)
print("Monte Carlo Vπ (from samples only):"); show(V)
print("oracle truth:"); show(dp_eval(env, policy, gamma))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 8 minutes"
        title={<>Monte Carlo prediction</>}
        intro={<>The most honest way to answer &ldquo;how good is this state?&rdquo; is also the most literal:{" "}
          <strong>behave, watch what happens, and average the totals.</strong> A value is an expected return, so
          to estimate it you play out whole episodes and average the returns that actually followed. No model, no
          cleverness — just the definition, sampled.</>}
      />

      <div className="lesson">
        <h2>Straight from the definition</h2>
        <p>
          Recall what a state value <em>is</em>: <M>{String.raw`V^\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s]`}</M>,
          the expected return when you start in <M>s</M> and follow <M>\pi</M>. The previous chapter established
          that an expectation can be estimated by averaging samples. A single played-out episode gives you one
          sample of the return from every state it passed through. So the recipe writes itself:
        </p>
        <ul>
          <li>Run an episode all the way to termination under <M>\pi</M>.</li>
          <li>For each state visited, compute the <em>return</em> — the discounted sum of rewards from that state onward.</li>
          <li>Set each state&rsquo;s value estimate to the <strong>average of the returns observed from it</strong>, over many episodes.</li>
        </ul>
        <p>
          That is <strong>Monte Carlo prediction</strong>: no bootstrapping off other estimates, no transition
          model, nothing but complete episodes and arithmetic. The name is the old gambling-hall metaphor — estimate
          something hard to compute by sampling it many times.
        </p>

        <h2>The incremental mean trick</h2>
        <p>
          You do not need to store every return to average them. Keep a running mean and a count, and fold each new
          return in as it arrives:
        </p>
        <MathBlock>{String.raw`N(s) \mathrel{+}= 1, \qquad V(s) \mathrel{+}= \frac{1}{N(s)}\big(G - V(s)\big).`}</MathBlock>
        <p>
          This is exactly a sample mean, computed online. And it is worth staring at, because it is the seed of
          everything ahead: an update of the form <em>&ldquo;nudge the estimate toward a target by a fraction of the
          gap.&rdquo;</em> Here the target is the full return <M>G</M> and the fraction is{" "}
          <M>{String.raw`1/N(s)`}</M>. Swap the target for a bootstrapped one and the fraction for a fixed step size,
          and this line becomes temporal-difference learning.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="We evaluate the random policy on the goal grid by Monte Carlo, using exploring starts (each episode begins in a random state). After 20,000 episodes, how close should V come to the true Vπ?"
          options={[
            "Nowhere close — without the model you can't recover Vπ",
            "Very close — the sampled averages converge to the true expected returns, matching the oracle to about two decimals",
            "It converges to V*, the optimal values, not Vπ",
          ]}
          nudge="Locked in. MC estimates the value of the policy you actually run — here the random policy — and closes in on the oracle's Vπ."
        />

        <h2>Run it</h2>
        <p>
          Here is the whole method — rollout, backward return accumulation, running mean — evaluating the random
          policy with nothing but <code>reset</code> and <code>step</code>. We start each episode from a random state
          (<em>exploring starts</em>) so every cell gets visited, then compare against the oracle:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`Monte Carlo Vπ (from samples only):
 -0.41   -0.45   -0.60    0.00
 -0.36   -0.37   -0.38   -0.43
 -0.30   -0.24   -0.10    0.12
 -0.25   -0.13    0.21    0.00
oracle truth:
 -0.40   -0.45   -0.60    0.00
 -0.36   -0.36   -0.38   -0.43
 -0.30   -0.24   -0.10    0.13
 -0.25   -0.13    0.22    0.00`}</CodeOutput>
        <p>
          Cell for cell, the sampled estimate lands within about <M>{String.raw`0.01`}</M> of the true value
          function — recovered entirely from lived experience, with the model never once consulted. This is the
          whole promise made good. The averaging you see here (fold each return into a running mean) is deliberately
          the plain <em>every-visit</em> variant; there is a subtle and surprisingly consequential choice hiding in
          the word &ldquo;visited,&rdquo; which is the next page.
        </p>

        <Callout color={GOLD} title={<>What Monte Carlo assumes — and doesn&rsquo;t</>}>
          MC needs almost nothing: no model, no Markov property even (it never chains one estimate off another, so it
          is robust when states are aliased). Its one hard requirement is <strong>complete episodes</strong> — you
          cannot compute a return until the episode ends. That single assumption is what temporal-difference learning
          will lift, and it is the source of every drawback we&rsquo;ll catalogue two pages from now.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/exploration-returns", label: <>← Exploration returns</> }}
          next={{ href: "/learn/learning/first-visit-vs-every-visit", label: <>Next · First-visit vs every-visit →</> }}
        />
      </div>
    </article>
  );
}
