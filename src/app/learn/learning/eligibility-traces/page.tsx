import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Eligibility traces — Manifold",
  description:
    "TD(λ): instead of picking one n, average over all n-step returns at once — and implement it online with a short-term memory of recently visited states. The forward view explains what it computes; the backward view makes it practical.",
};

const GOLD = "var(--c-rl)";

export default function EligibilityTraces() {
  const code = `import numpy as np
NS = 21; true = np.array([-1 + 2*i/20 for i in range(NS)]); true[0] = true[20] = 0

def td_lambda(lam, alpha, episodes, seed):          # online, backward-view TD(λ)
    rng = np.random.default_rng(seed); V = np.zeros(NS)
    for _ in range(episodes):
        e = np.zeros(NS); s = 10; done = False      # e = eligibility trace, reset each episode
        while not done:
            s2 = s + rng.choice([-1, 1]); r = 1.0 if s2 == 20 else (-1.0 if s2 == 0 else 0.0)
            done = s2 in (0, 20)
            delta = r + (0 if done else V[s2]) - V[s]   # the usual TD error
            e[s] += 1.0                                  # this state just became eligible
            V += alpha * delta * e                       # update ALL states, scaled by eligibility
            e *= lam                                     # (γ=1) fade every trace toward 0
            s = s2
    return np.sqrt(np.mean((V[1:20] - true[1:20])**2))

print("TD(λ) RMS after 10 episodes (avg 100 runs, α=0.2):")
for lam in (0.0, 0.4, 0.8, 0.9, 0.95):
    rms = np.mean([td_lambda(lam, 0.2, 10, s) for s in range(100)])
    print(f"  λ={lam:<4}:  RMS = {rms:.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 9 minutes"
        title={<>Eligibility traces</>}
        intro={<>n-step returns forced a choice: which <em>n</em>? Eligibility traces refuse to choose. They average
          over <em>all</em> n-step returns at once, weighted by a single parameter <M>\lambda</M> — and, remarkably,
          implement that average <em>online</em>, updating every step, using nothing but a fading memory of where the
          agent has recently been.</>}
      />

      <div className="lesson">
        <h2>The forward view: average every n at once</h2>
        <p>
          Rather than commit to one n-step return, take a weighted average of <em>all</em> of them. The{" "}
          <strong>λ-return</strong> geometrically weights the <M>n</M>-step return by{" "}
          <M>{String.raw`(1-\lambda)\lambda^{n-1}`}</M>:
        </p>
        <MathBlock>{String.raw`G_t^\lambda = (1-\lambda)\sum_{n=1}^{\infty}\lambda^{n-1}\,G_{t:t+n}.`}</MathBlock>
        <p>
          One knob <M>{String.raw`\lambda \in [0,1]`}</M> slides between the familiar extremes. At{" "}
          <M>{String.raw`\lambda = 0`}</M> all weight sits on the one-step return — pure TD(0). At{" "}
          <M>{String.raw`\lambda = 1`}</M> the weights push out to the full return — Monte Carlo. In between, near
          returns count most and far ones fade smoothly, so you get the best of the n-step family without picking a
          single <M>n</M>. This is the <strong>forward view</strong>: to update a state, look forward and blend all
          its future n-step returns.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="The forward view needs all future n-step returns to update S_t — so it can't act until the episode ends, just like Monte Carlo. How does TD(λ) update online, every step?"
          options={[
            "It can't — TD(λ) is inherently offline",
            "The backward view: keep an eligibility trace marking recently visited states, and apply each new TD error to all of them at once — mathematically equivalent, but online",
            "It approximates by truncating at n = 10",
          ]}
          nudge="Locked in. The eligibility trace is the trick that turns the forward-view average into an online, incremental algorithm."
        />

        <h2>The backward view: a fading memory</h2>
        <p>
          The forward view is illuminating but impractical — it needs the future. The <strong>backward view</strong>{" "}
          computes the identical thing looking only backward, with a short-term memory called an{" "}
          <strong>eligibility trace</strong> <M>{String.raw`e(s)`}</M>. Each state&rsquo;s trace bumps up when the
          state is visited and fades by <M>{String.raw`\gamma\lambda`}</M> each step:
        </p>
        <MathBlock>{String.raw`e_t(s) = \gamma\lambda\,e_{t-1}(s) + \mathbf{1}[S_t = s], \qquad V(s) \mathrel{+}= \alpha\,\delta_t\,e_t(s)\ \text{ for all } s.`}</MathBlock>
        <p>
          Read it as a credit-assignment mechanism. When a TD error <M>{String.raw`\delta_t`}</M> arrives, it does not
          just correct the current state — it is broadcast to <em>every recently visited state</em>, each corrected in
          proportion to how recently it was seen (its trace). A state visited just now gets the full jolt; one visited
          ten steps ago gets a faded share; one not visited lately gets nothing. Surprise flows backward along the
          path that led to it, automatically. This runs fully online, one update per step — and it is provably
          equivalent to the forward-view λ-return (offline, exactly; online, very nearly).
        </p>

        <h2>The same U, one parameter</h2>
        <p>
          Sweep <M>\lambda</M> on the random walk and the n-step U-shape reappears, now over a single continuous
          knob:
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`TD(λ) RMS after 10 episodes (avg 100 runs, α=0.2):
  λ=0.0 :  RMS = 0.413
  λ=0.4 :  RMS = 0.336
  λ=0.8 :  RMS = 0.168
  λ=0.9 :  RMS = 0.226
  λ=0.95:  RMS = 0.367`}</CodeOutput>
        <p>
          <M>{String.raw`\lambda = 0`}</M> is TD(0) (<M>{String.raw`0.413`}</M>); the error dives to a minimum around{" "}
          <M>{String.raw`\lambda = 0.8`}</M> (<M>{String.raw`0.168`}</M>), then climbs again as <M>\lambda</M>{" "}
          approaches Monte Carlo territory — the same interior optimum as n-step, reached with one smooth dial and,
          crucially, <em>online</em>. (One honest caveat: with the simple <em>accumulating</em> trace shown here,{" "}
          <M>{String.raw`\lambda = 1`}</M> is not a clean stand-in for Monte Carlo and can even destabilise when
          states are revisited — practical implementations use bounded &ldquo;replacing&rdquo; or &ldquo;dutch&rdquo;
          traces, and keep <M>\lambda</M> below 1.)
        </p>

        <Proof title="why the λ-return weights are (1−λ)λⁿ⁻¹ — and sum to one" color={GOLD}>
          <p>
            For <M>{String.raw`G_t^\lambda`}</M> to be a valid weighted <em>average</em> of the n-step returns, the
            weights must be non-negative and sum to one. Take the weight on the <M>n</M>-step return to be{" "}
            <M>{String.raw`w_n = (1-\lambda)\lambda^{n-1}`}</M> for <M>{String.raw`n = 1, 2, \dots`}</M> Then
          </p>
          <MathBlock>{String.raw`\sum_{n=1}^{\infty} w_n = (1-\lambda)\sum_{n=1}^{\infty}\lambda^{n-1} = (1-\lambda)\cdot\frac{1}{1-\lambda} = 1,`}</MathBlock>
          <p>
            using the geometric series (valid for <M>{String.raw`\lambda < 1`}</M>). So the λ-return is a genuine
            convex combination — a probability-weighted blend. The weights decay geometrically: the one-step return
            gets <M>{String.raw`1-\lambda`}</M>, the two-step <M>{String.raw`(1-\lambda)\lambda`}</M>, and so on, each
            a factor <M>\lambda</M> smaller. Small <M>\lambda</M> concentrates the mass on short returns (toward TD);{" "}
            <M>{String.raw`\lambda\to 1`}</M> spreads it toward the full return (toward MC). For an{" "}
            <em>episodic</em> task the tail beyond termination at time <M>T</M> is folded onto the full return{" "}
            <M>{String.raw`G_t`}</M>, which carries the leftover weight <M>{String.raw`\lambda^{T-t-1}`}</M> — which is
            precisely why <M>{String.raw`\lambda = 1`}</M> recovers Monte Carlo in the forward view.
          </p>
          <p>
            <strong>Forward = backward.</strong> The remarkable fact (the TD(λ) equivalence theorem) is that summing
            the backward-view trace updates over a complete episode produces exactly the same total weight change as
            the forward-view λ-return updates — offline, they are identical. The eligibility trace is just the forward
            view&rsquo;s geometric weighting, accumulated causally: a state&rsquo;s trace at time <M>t</M> is{" "}
            <M>{String.raw`\sum_{k\le t}(\gamma\lambda)^{t-k}\mathbf{1}[S_k=s]`}</M>, exactly the discounted count of
            its recent visits, so applying <M>{String.raw`\delta_t`}</M> against it distributes credit with the same
            geometric profile the λ-return prescribes — but computable the instant <M>{String.raw`\delta_t`}</M> is
            known.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>What traces buy</>}>
          Eligibility traces give you the whole TD&ndash;MC spectrum through one parameter <M>\lambda</M>, computed
          online and incrementally, with faster credit assignment than one-step TD — a late reward reaches all the
          states that led to it in a single sweep of updates, not one state per episode. SARSA(λ) and Q(λ) apply the
          same trace to control. They are the classical peak of tabular value learning; the next step is not a better
          trace but a different representation entirely — because on real problems the table itself is the wall.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/n-step-returns", label: <>← n-step returns</> }}
          next={{ href: "/learn/learning/what-learning-still-assumes", label: <>Next · What learning still assumes →</> }}
        />
      </div>
    </article>
  );
}
