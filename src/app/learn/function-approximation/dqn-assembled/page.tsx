import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { DqnDiagram } from "@/components/figures/fa/FaDiagrams";

export const metadata = {
  title: "DQN, assembled — Manifold",
  description:
    "The whole algorithm on one screen: 450 parameters, a replay buffer, a target network and an epsilon schedule, balancing CartPole for 360 steps. Every line traces back to a specific failure from earlier in the track.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DqnAssembled() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 12 minutes"
        title={<>DQN, assembled</>}
        intro={<>Everything this track has built now fits in one loop: semi-gradient Q-learning from chapter 3, a
          network in place of features, a replay buffer, and a frozen copy for the targets. Nothing in it is new
          at this point — which is the best possible position from which to read it.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The update, and where each part came from</h2>
        <p>
          DQN minimises one loss, over transitions drawn from the buffer:
        </p>
        <MathBlock>{String.raw`L(\mathbf{w}) = \mathbb{E}_{(s,a,r,s')\sim \mathcal{D}}\left[\Big(r + \gamma \max_{a'} \hat q(s',a',\mathbf{w}^-) - \hat q(s,a,\mathbf{w})\Big)^2\right]`}</MathBlock>
        <p>
          Read it right to left and every symbol has a history in this track:
        </p>
        <ul>
          <li>
            <M>{String.raw`\hat q(s,a,\mathbf{w})`}</M> — action values from shared parameters, because the state
            space has no cells to fill (<Link href="/learn/function-approximation/semi-gradient-sarsa" style={link}>chapter 3</Link>).
          </li>
          <li>
            <M>{String.raw`\max_{a'}`}</M> — Q-learning&rsquo;s off-policy target: learn about the greedy policy
            while behaving otherwise.
          </li>
          <li>
            <M>{String.raw`\mathbf{w}^-`}</M> — the frozen copy, because bootstrapping off the weights you are
            updating is the loop that diverged.
          </li>
          <li>
            <M>{String.raw`\mathcal{D}`}</M> — the replay buffer, because consecutive transitions are correlated
            and interfere.
          </li>
          <li>
            The gradient is taken through <M>{String.raw`\hat q(s,a,\mathbf{w})`}</M> only, not through the
            target — still a <strong>semi</strong>-gradient method, still not descending anything, exactly as in{" "}
            <Link href="/learn/function-approximation/gradient-descent-on-values" style={link}>chapter 1</Link>.
          </li>
        </ul>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The network below has <strong>450 parameters</strong> — four inputs, sixty-four hidden units,
            two outputs. CartPole caps episodes at 500 steps. After 200 episodes, how long does it balance?</>}
          options={["Under 100 steps", "About 150-200", "About 350", "The full 500 every time"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`   episode   1:   39.0 steps (mean of the last 25)
   episode  25:   26.0 steps (mean of the last 25)
   episode  50:   32.2 steps (mean of the last 25)
   episode 100:  268.3 steps (mean of the last 25)
   episode 150:  385.3 steps (mean of the last 25)
   episode 200:  358.6 steps (mean of the last 25)

   best episode 500, last 25 average 358.6
   parameters: 450`}</CodeOutput>

        <p>
          Follow the shape of that curve, because it is not the tidy monotone improvement people imagine.
        </p>
        <p>
          <strong>Episodes 1–50 look like nothing is happening</strong> — 39, then 26, then 32 steps, which is
          around what random flailing achieves. It is not stuck: <M>{String.raw`\varepsilon`}</M> decays from 1.0
          to 0.05 over the first 5,000 steps, so for most of that stretch the agent is mostly ignoring its own
          policy and filling the buffer. The learning is real but invisible in the returns.
        </p>
        <p>
          <strong>Then it jumps</strong>, to 268 by episode 100 and 385 by 150 — and then stops improving, sitting
          at 359 with a best of 500. Across 5 seeds the last-50 average is <strong>360.4 ± 55.6</strong>, so this
          run is typical rather than lucky. (Those first three rows — 39.0, 26.0, 32.2 — are identical under
          CPython; the later ones are not, for the reason given{" "}
          <Link href="/learn/function-approximation/experience-replay" style={link}>two pages back</Link>.)
        </p>

        <Callout color={GOLD} title={<>450 parameters, and it is standing on the triad</>}>
          It is worth pausing on how small this is. Four inputs, one hidden layer of 64 ReLUs, two outputs: 450
          numbers, which is less than a third of the 1,536 weights the tile-coded agent used for Mountain Car in
          chapter 3. The &ldquo;deep&rdquo; in deep RL is doing less work here than the two engineering ideas
          around it.
          <br /><br />
          And note what this agent is, formally: nonlinear function approximation, bootstrapped targets, and
          off-policy data from a replay buffer. That is <em>all three legs</em> of the deadly triad, plus the loss
          of every guarantee that required linearity. It works because of replay and the frozen target, not
          because anything proved it would.
        </Callout>

        <DqnDiagram
          caption={<>Every piece of DQN and where it came from. Two of the boxes are this
            chapter&rsquo;s contribution and neither is an improvement to the learning rule: the
            buffer sits between the environment and the network so that batches look like samples
            rather than a trajectory, and the target network sits beside the online one so that the
            thing being regressed towards holds still. Strip both out and what remains is
            semi-gradient Q-learning with a neural network — which is to say, all three legs of the
            triad and nothing holding them apart.</>}
        />

        <h2>The details that are easy to get wrong</h2>
        <ul>
          <li>
            <strong>The terminal mask.</strong> The target is{" "}
            <M>{String.raw`r + \gamma(1-d)\max_{a'}\hat q(s',a',\mathbf{w}^-)`}</M> — when an episode ends there
            is no next state, and bootstrapping past a terminal invents value out of nothing. This is the most
            common DQN bug and it produces an agent that looks like it is learning and then plateaus low.
          </li>
          <li>
            <strong>Gradients only on the action taken.</strong> The network outputs a value for every action but
            the transition tells you about one of them, so the error vector is zero in every other slot. That is
            the <code>dY[arange(batch), ba] = ...</code> line.
          </li>
          <li>
            <strong>Warm-up.</strong> No updates until the buffer holds at least a batch, or the first gradients
            are computed from a handful of near-identical transitions.
          </li>
          <li>
            <strong>The exploration schedule is not optional.</strong> Chapter 3 got away with{" "}
            <M>{String.raw`\varepsilon = 0`}</M> because zero-initialised weights were optimistic when every
            reward was <M>-1</M>. Here rewards are <M>+1</M>, so zero init is <em>pessimistic</em> and a greedy
            agent would never explore.
          </li>
        </ul>

        <p>
          What this agent still gets wrong is not visible in the returns at all. It is in the numbers the network
          reports about itself, and it is the subject of the last page in this chapter.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/target-networks", label: <>← Target networks</> }}
          next={{ href: "/learn/function-approximation/double-dqn", label: <>Next · Double DQN →</> }}
        />
      </div>
    </article>
  );
}

const code = `env = CartPole(0)
q  = MLP(4, 64, 2, seed=0, lr=1e-3)        # the online network
qt = MLP(4, 64, 2, seed=0, lr=1e-3)        # the target network
qt.copy_from(q)
rng = np.random.default_rng(1)
gamma, batch, cap, sync = 0.99, 32, 20000, 200

S  = np.zeros((cap, 4)); A = np.zeros(cap, int); R = np.zeros(cap)
S2 = np.zeros((cap, 4)); D = np.zeros(cap)
n = total = 0
lengths = []

for ep in range(200):
    env.seed(ep); s = env.reset()
    for t in range(500):
        eps = max(0.05, 1.0 - total / 5000.0)          # explore, then exploit
        a = int(rng.integers(2)) if rng.random() < eps else int(np.argmax(q.forward(s[None])[0]))
        s2, r, done = env.step(a)

        i = n % cap                                     # 1. STORE the transition
        S[i], A[i], R[i], S2[i], D[i] = s, a, r, s2, float(done)
        n += 1; total += 1; s = s2

        if n >= batch:
            idx = rng.integers(0, min(n, cap), batch)   # 2. REPLAY: sample the past
            bs, ba, br, bs2, bd = S[idx], A[idx], R[idx], S2[idx], D[idx]
            nxt = qt.forward(bs2).max(axis=1)           # 3. TARGET NET builds the target
            y = br + gamma * (1 - bd) * nxt             #    (no bootstrap past a terminal)
            out = q.forward(bs)                         # 4. one gradient step on the online net
            dY = np.zeros_like(out)
            dY[np.arange(batch), ba] = (out[np.arange(batch), ba] - y) * (2.0 / batch)
            q.backward(dY)
            if total % sync == 0:
                qt.copy_from(q)                         # 5. refresh the frozen copy
        if done:
            break
    lengths.append(t + 1)

L = np.array(lengths)
for k in (1, 25, 50, 100, 150, 200):
    print(f"   episode {k:3d}: {L[k-25:k].mean() if k > 25 else L[:k].mean():6.1f} steps (mean of the last 25)")
print(f"\\n   best episode {L.max()}, last 25 average {L[-25:].mean():.1f}")
print(f"   parameters: {sum(p.size for p in q.params())}")`;
