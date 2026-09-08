import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Batch TD vs MC — Manifold",
  description:
    "Give TD and Monte Carlo the exact same finite batch of experience and they converge to DIFFERENT answers. The reason reveals what each method really computes: MC minimises training error; TD builds the maximum-likelihood model and solves it.",
};

const GOLD = "var(--c-rl)";

export default function BatchTdVsMc() {
  const code = `import numpy as np
# Sutton & Barto's famous 8-episode example. Each episode is a list of (state, reward).
episodes = [
    [("A", 0), ("B", 0)],                                   # A -> 0 -> B -> 0 -> end
    [("B", 1)], [("B", 1)], [("B", 1)],                     # B -> 1 -> end  (six times)
    [("B", 1)], [("B", 1)], [("B", 1)],
    [("B", 0)],                                             # B -> 0 -> end
]
idx = {"A": 0, "B": 1}

# Batch Monte Carlo: V(s) = average observed RETURN following s, over the whole batch.
def batch_mc():
    tot = np.zeros(2); cnt = np.zeros(2)
    for ep in episodes:
        G = 0.0
        for s, r in reversed(ep):
            G = r + G; tot[idx[s]] += G; cnt[idx[s]] += 1
    return tot / cnt

# Batch TD: sweep the one-step TD update over the FIXED data until V stops moving.
def batch_td(alpha=1e-3):
    V = np.zeros(2)
    for _ in range(200000):
        dV = np.zeros(2)
        for ep in episodes:
            for t, (s, r) in enumerate(ep):
                v_next = V[idx[ep[t+1][0]]] if t + 1 < len(ep) else 0.0
                dV[idx[s]] += alpha * (r + v_next - V[idx[s]])
        V += dV
        if np.max(np.abs(dV)) < 1e-10: break
    return V

mc, td = batch_mc(), batch_td()
print(f"batch Monte Carlo :  V(A) = {mc[0]:.3f}   V(B) = {mc[1]:.3f}")
print(f"batch TD          :  V(A) = {td[0]:.3f}   V(B) = {td[1]:.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>Batch TD vs MC</>}
        intro={<>Here is a small experiment that pins down, exactly, what makes TD different from Monte Carlo. Give
          both methods the <em>same</em> fixed handful of episodes and let each converge on it completely. They
          settle on <strong>different values.</strong> The disagreement is not noise — it is the two methods
          computing two genuinely different things.</>}
      />

      <div className="lesson">
        <h2>Eight episodes, two answers</h2>
        <p>
          You have observed exactly eight episodes in a world with two states, <M>A</M> and <M>B</M> (rewards on the
          transitions, discount <M>{String.raw`\gamma = 1`}</M>):
        </p>
        <ul>
          <li>Once: <M>A \to 0 \to B \to 0 \to</M> end.</li>
          <li>Six times: <M>B \to 1 \to</M> end.</li>
          <li>Once: <M>B \to 0 \to</M> end.</li>
        </ul>
        <p>
          Everyone agrees on <M>B</M>: it was seen eight times and rewarded on six of them, so{" "}
          <M>{String.raw`V(B) = 6/8 = 0.75`}</M>. The interesting question is <M>{String.raw`V(A)`}</M>. Instead of
          arguing, let&rsquo;s run both methods to convergence on this fixed batch:
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`batch Monte Carlo :  V(A) = 0.000   V(B) = 0.750
batch TD          :  V(A) = 0.750   V(B) = 0.750`}</CodeOutput>

        <PredictPrompt
          accent={GOLD}
          prompt="A was seen exactly once, and that one episode's return was 0. So which answer for V(A) is 'right'?"
          options={[
            "V(A) = 0 — that's literally the only return we ever observed from A",
            "V(A) = 0.75 — A always leads to B, and B is worth 0.75, so A should inherit it",
            "Both are defensible: they answer different questions about the same data",
          ]}
          nudge="Locked in. MC reports the observed return from A (0). TD reasons through the model the data implies: A → B, and V(B) = 0.75. Different questions, different answers."
        />

        <h2>What each method is really computing</h2>
        <p>
          <strong>Monte Carlo minimises error on the training returns.</strong> The one episode from <M>A</M>{" "}
          returned <M>0</M>, so the value that best fits the observed returns from <M>A</M> is <M>0</M>. MC gives you
          the estimate with least mean-squared error <em>on the data you actually saw</em> — it fits the sample.
        </p>
        <p>
          <strong>Batch TD builds a model from the data and solves it.</strong> From the eight episodes, TD
          effectively estimates a little MDP: every time we were in <M>A</M> we went to <M>B</M> with reward{" "}
          <M>0</M> (so <M>{String.raw`\hat P(B\mid A) = 1`}</M>), and <M>B</M> terminates with mean reward{" "}
          <M>{String.raw`0.75`}</M>. Solving <em>that</em> MDP gives{" "}
          <M>{String.raw`V(A) = 0 + V(B) = 0.75`}</M>. This is the <strong>certainty-equivalence</strong> estimate:
          act as if the maximum-likelihood model built from the data were the true model, and compute its exact
          values.
        </p>
        <p>
          That is the deep difference the whole chapter was circling. MC ignores the Markov structure and fits
          returns; TD <em>exploits</em> the Markov structure by chaining through the successor state. On a genuinely
          Markov problem, TD&rsquo;s answer is the one that generalises — it uses the fact that <M>A</M> always leads
          to <M>B</M>, which a single return from <M>A</M> cannot see.
        </p>

        <Proof title="why batch TD equals the certainty-equivalence (maximum-likelihood MDP) solution" color={GOLD}>
          <p>
            &ldquo;Batch&rdquo; means: hold a fixed set of transitions and apply TD updates, repeatedly sweeping the
            whole batch, until <M>V</M> stops changing. At that fixed point the <em>total</em> update over the batch
            is zero. Group the increments by the state being updated. For a state <M>s</M>, summing the TD errors over
            every recorded transition out of <M>s</M> and setting the sum to zero gives
          </p>
          <MathBlock>{String.raw`\sum_{i:\,s_i = s}\big[\,r_i + \gamma V(s'_i) - V(s)\,\big] = 0 \;\Longrightarrow\; V(s) = \frac{1}{N(s)}\sum_{i:\,s_i=s}\big[\,r_i + \gamma V(s'_i)\,\big],`}</MathBlock>
          <p>
            where <M>{String.raw`N(s)`}</M> is the number of times <M>s</M> was left. Now read the right-hand side.
            The empirical frequencies <M>{String.raw`\hat P(s'\mid s) = \tfrac{1}{N(s)}\#\{i: s_i=s, s'_i=s'\}`}</M>{" "}
            and the empirical mean rewards <M>{String.raw`\hat R(s) = \tfrac{1}{N(s)}\sum_{i:s_i=s} r_i`}</M> are
            precisely the <strong>maximum-likelihood estimates</strong> of the transition and reward model from the
            batch. Rewriting,
          </p>
          <MathBlock>{String.raw`V(s) = \hat R(s) + \gamma\sum_{s'}\hat P(s'\mid s)\,V(s').`}</MathBlock>
          <p>
            This is exactly the Bellman equation of the estimated MDP <M>{String.raw`(\hat P, \hat R)`}</M>. So the
            batch-TD fixed point <em>is</em> the value function of the maximum-likelihood model — the
            certainty-equivalence estimate. Batch MC, by contrast, minimises{" "}
            <M>{String.raw`\sum_i (G_i - V(s_i))^2`}</M> over the observed returns, which is the sample-fit solution.
            On the eight episodes: <M>{String.raw`\hat P(B\mid A)=1,\ \hat R(B)=0.75`}</M> give{" "}
            <M>{String.raw`V(A)=0.75`}</M> (TD), while the lone return from <M>A</M> gives{" "}
            <M>{String.raw`V(A)=0`}</M> (MC). Both are optimal — for different objectives.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>The one-line summary of the whole chapter</>}>
          <strong>Monte Carlo fits the returns; TD fits a model and solves it.</strong> That is why TD usually
          learns faster on Markov problems (it reuses the successor&rsquo;s value instead of relearning it), why it
          can be led astray when the Markov assumption is badly broken (it trusts a structure that isn&rsquo;t there),
          and why its answer on the eight episodes is the one most people, on reflection, call correct.
        </Callout>

        <Quiz
          accent={GOLD}
          title="Chapter 3 checkpoint"
          questions={[
            {
              q: <>What is the TD target, and how does it differ from the Monte Carlo target?</>,
              options: [
                "They're identical — both use the full return",
                "TD's target is R + γV(S') (one reward plus a bootstrapped estimate); MC's target is the full sampled return G — one random step vs the whole random trajectory",
                "TD uses the full return, MC uses one step",
              ],
              answer: 1,
              explain: <>TD bootstraps: it replaces the unseen rest of the return with its current estimate of the
                next state&rsquo;s value. That one substitution buys online, low-variance, model-free updates at the
                cost of some bias.</>,
            },
            {
              q: <>Why does TD converge to Vπ even though it bootstraps off estimates that start out wrong?</>,
              options: [
                "Because it uses the full return in expectation",
                "Because the expected TD update is the Bellman operator T^π — a γ-contraction whose unique fixed point is Vπ — and stochastic approximation handles the noise",
                "Because α is constant",
              ],
              answer: 1,
              explain: <>In expectation one TD step applies <M>{String.raw`T^\pi`}</M>. Its fixed point is{" "}
                <M>{String.raw`V^\pi`}</M>; Robbins&ndash;Monro step sizes (<M>{String.raw`\sum\alpha=\infty,\ \sum\alpha^2<\infty`}</M>)
                drive the noisy iterates there.</>,
            },
            {
              q: <>On a fixed batch of episodes, what does batch TD compute that batch MC does not?</>,
              options: [
                "The same thing, just slower",
                "The value function of the maximum-likelihood MDP built from the data (certainty-equivalence); MC instead minimises squared error on the observed returns",
                "The optimal policy π*",
              ],
              answer: 1,
              explain: <>Batch TD&rsquo;s fixed point solves the Bellman equation of the empirical model{" "}
                <M>{String.raw`(\hat P, \hat R)`}</M>, exploiting Markov structure; batch MC fits the sampled returns.
                Hence V(A) = 0.75 vs 0 on the eight episodes.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning/what-td-converges-to", label: <>← What TD converges to</> }}
          next={{ href: "/learn/learning/sarsa", label: <>Next · SARSA: on-policy control →</> }}
        />
      </div>
    </article>
  );
}
