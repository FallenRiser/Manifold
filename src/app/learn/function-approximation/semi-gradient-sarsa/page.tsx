import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Curve } from "@/components/figures/fa/Curve";
import { MC_LEARNING } from "@/components/figures/fa/data";
import { MC_EPISODES } from "@/components/figures/fa/data.generated";

export const metadata = {
  title: "Semi-gradient SARSA — Manifold",
  description:
    "Control with approximation: learn action values q(s,a,w) instead of v(s,w), on Mountain Car, where the state is two real numbers and a table cannot even start. Tile-coded semi-gradient SARSA with 1,536 weights goes from 2,746 steps in its first episode to a 136-step average — with no random exploration at all.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SemiGradientSarsa() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 11 minutes"
        title={<>Semi-gradient SARSA</>}
        intro={<>Everything so far has <em>predicted</em>: given a fixed policy, how good is each state? Now we
          want the agent to choose its own actions and get better at the task. That needs action values, and it
          needs a problem where no table could ever help — so here is one.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Mountain Car: a table can&rsquo;t even start</h2>
        <p>
          A car sits in a valley between two hills. The goal is the flag on top of the right-hand hill. The
          catch is that the engine is too weak to drive straight up: gravity on the slope beats full throttle. To
          get out, the car has to back up the left hill first, then use that momentum to charge the right one.
        </p>
        <p>
          The state is two real numbers, position <M>p \in [-1.2, 0.6]</M> and velocity{" "}
          <M>v \in [-0.07, 0.07]</M>. The actions are reverse, coast and forward, and each step updates the car
          like this:
        </p>
        <MathBlock>{String.raw`v \leftarrow v + 0.001\,(a - 1) - 0.0025\cos(3p), \qquad p \leftarrow p + v`}</MathBlock>
        <p>
          The engine contributes at most <M>0.001</M> per step; gravity contributes up to <M>0.0025</M>. That
          inequality is the whole puzzle. The reward is <M>-1</M> on every step until the car reaches{" "}
          <M>p \ge 0.5</M>, so the return is just minus the episode length: <strong>fewer steps is better</strong>.
        </p>
        <p>
          Now try to build a table. The car never visits the <em>exact</em> same pair of real numbers twice, so
          every cell would be filled once and never read again. You could chop the plane into bins — but that is
          state aggregation, which is already function approximation. There is no tabular version of this
          problem to fall back on.
        </p>

        <h2>From v̂ to q̂</h2>
        <p>
          To <em>choose</em> actions without a model, we need action values, exactly as the{" "}
          <Link href="/learn/learning/sarsa" style={link}>Learning track</Link> did. The approximate version is{" "}
          <M>{String.raw`\hat q(s, a, \mathbf{w})`}</M>. The simplest way to include the action is to give each
          action its own weight vector — three actions, three copies of the same feature map. The SARSA update
          then looks just like semi-gradient TD, with <M>{String.raw`\hat q`}</M> in place of{" "}
          <M>{String.raw`\hat v`}</M>:
        </p>
        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\big[R_{t+1} + \gamma\,\hat q(S_{t+1}, A_{t+1}, \mathbf{w}) - \hat q(S_t, A_t, \mathbf{w})\big]\,\nabla \hat q(S_t, A_t, \mathbf{w})`}</MathBlock>
        <p>
          The features are tile coding again, now in two dimensions: 8 offset tilings, each an 8×8 grid over
          (position, velocity). A state lights up exactly one tile per tiling — 8 active features out of 512 per
          action — and <M>{String.raw`\hat q`}</M> is the sum of those 8 weights. The episodes always end, so we
          use <M>{String.raw`\gamma = 1`}</M>.
        </p>

        <Proof title="Why the step size is divided by the number of tilings">
          <p>
            <strong>Step 1 — the gradient.</strong> Write <M>{String.raw`\mathbf{x}(s,a)`}</M> for the binary
            feature vector: 1 on the 8 tiles <M>s</M> activates in action <M>a</M>&rsquo;s weight block, 0
            everywhere else. The approximation is linear,
          </p>
          <MathBlock>{String.raw`\hat q(s,a,\mathbf{w}) = \mathbf{w}^\top \mathbf{x}(s,a) = \sum_{i \in \text{active}} w_i`}</MathBlock>
          <p>
            so its gradient with respect to <M>{String.raw`\mathbf{w}`}</M> is the feature vector itself:{" "}
            <M>{String.raw`\nabla \hat q(s,a,\mathbf{w}) = \mathbf{x}(s,a)`}</M>.
          </p>
          <p>
            <strong>Step 2 — the update touches 8 weights.</strong> Call the bracketed TD error{" "}
            <M>{String.raw`\delta`}</M> and the step size <M>{String.raw`\beta`}</M>. Multiplying{" "}
            <M>{String.raw`\beta\,\delta`}</M> by a 0/1 vector adds <M>{String.raw`\beta\,\delta`}</M> to each of
            the 8 active weights and leaves the other 1,528 alone.
          </p>
          <p>
            <strong>Step 3 — how far does the estimate move?</strong> Re-evaluate the same{" "}
            <M>(s, a)</M> after the update. It is a sum of the same 8 weights, each larger by{" "}
            <M>{String.raw`\beta\,\delta`}</M>:
          </p>
          <MathBlock>{String.raw`\hat q_{\text{new}}(s,a) = \sum_{i \in \text{active}} (w_i + \beta\,\delta) = \hat q_{\text{old}}(s,a) + 8\,\beta\,\delta`}</MathBlock>
          <p>
            <strong>Step 4 — choose β.</strong> If we want one update to close a fraction{" "}
            <M>{String.raw`\alpha`}</M> of the error, as a table would, we need{" "}
            <M>{String.raw`8\beta = \alpha`}</M>, i.e. <M>{String.raw`\beta = \alpha / 8`}</M>. That is the{" "}
            <code>alpha = 0.5 / 8</code> in the code: every update moves the estimate for the state it saw halfway
            to its target. With <M>n</M> tilings the rule is <M>{String.raw`\beta = \alpha / n`}</M>, which is why
            tile coding makes step sizes so easy to reason about.
          </p>
        </Proof>

        <Curve
          x={MC_EPISODES}
          series={[{ label: "steps to the goal", values: MC_LEARNING, color: GOLD }]}
          logY
          xlabel="episode"
          ylabel="steps"
          caption={<>One run, 200 episodes, on a log axis because the first episode and the last
            differ by more than an order of magnitude. The shape is the argument: a steep collapse
            over the first twenty or thirty episodes, then a noisy floor around{" "}
            <strong>136 steps</strong> that never improves again. The best single episode was{" "}
            <strong>89</strong>, and the spread around that floor never closes — which is what
            learning with a fixed step size and no exploration schedule looks like, and is worth
            remembering when you meet a curve that looks like this and assume something is broken.</>}
        />

        <h2>No ε, and it still explores</h2>
        <p>
          There is one line in the code below that should look wrong: the exploration rate is zero. The agent
          always takes the action with the highest current estimate. The Learning track spent pages warning
          against exactly that.
        </p>

        <Callout color={GOLD} title={<>A zero start is an optimistic start</>}>
          Every step costs <M>-1</M>, so every true action value here is negative. The weights start at 0, so
          every estimate starts at 0 — <em>above</em> the truth everywhere. Whatever the agent tries gets marked
          down; whatever it has not tried still looks like 0, so it gets tried next. That is{" "}
          <Link href="/learn/warehouse-robot-capstone/optimism-and-initialisation" style={link}>optimistic
          initialisation</Link>, and here it does all the exploring for free.
          <br /><br />
          Keep one caveat in your pocket: optimism only drives exploration while there is still something left
          to be optimistic about. The next page finds a corner of the state space where that runs out.
        </Callout>

        <PredictPrompt
          accent={GOLD}
          prompt={<>All 1,536 weights start at zero. How long does the <strong>very first</strong> episode take? (A
            good driver needs roughly 100–150 steps.)</>}
          options={["Under 200 steps", "About 500 steps", "Several thousand steps", "It never finishes"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`episode   1:  2746 steps
episode  10:   239 steps
episode  50:   150 steps
episode 100:   154 steps
episode 200:   102 steps

last 20 episodes: mean 136.2 steps   best of all: 89
weights learned : 1536`}</CodeOutput>

        <p>
          The first episode takes <strong>2,746 steps</strong>. That is the optimism at work: the car rolls
          around the valley, marking down each action in each patch of state space until the untried ones win,
          and the trying slowly carries it higher. Nothing about that is directed, but all of it is exploration.
        </p>
        <p>
          By episode 10 it is down to 239. Over the last 20 of 200 episodes it averages <strong>136.2
          steps</strong>, and its best run was <strong>89</strong>. The curve is not monotone — episode 100 took
          154, episode 200 took 102 — because every episode starts at a random position between −0.6 and −0.4,
          and some starts are simply harder than others.
        </p>
        <p>
          All of this came from <strong>1,536 numbers</strong>: 3 actions × 8 tilings × 64 tiles. The run never
          came near its 5,000-step safety cap (the longest episode was the first), so the cap never cut an
          episode short.
        </p>
        <p>
          A learning curve that falls from 2,746 to 136 looks like a solved problem. Before believing that, the
          next page takes these exact weights, freezes them, and watches the car drive.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/semi-gradient-td", label: <>← Semi-gradient TD(0)</> }}
          next={{ href: "/learn/function-approximation/mountain-car", label: <>Next · Mountain Car: what it actually learned →</> }}
        />
      </div>
    </article>
  );
}

const code = `coder = mc_coder(tilings=8, tiles=8)            # 8 offset 8x8 grids over (position, velocity)
w = np.zeros((MountainCar.nA, coder.size))       # one weight vector per action
alpha = 0.5 / 8                                  # so one update moves q by 0.5 * error
rng = np.random.default_rng(0)
mc = MountainCar(0)

lengths = []
for ep in range(200):
    mc.seed(ep)
    s = mc.reset(); f = coder.indices(s)
    a = eps_greedy_q(w[:, f].sum(axis=1), 0.0, rng)   # eps = 0 -- see the note above
    n = 0
    while True:
        s2, r, done = mc.step(a); n += 1
        q_sa = w[a, f].sum()                            # q(s, a) = the sum of 8 active tiles
        if done or n >= 5000:
            w[a, f] += alpha * (r - q_sa); break
        f2 = coder.indices(s2)
        a2 = eps_greedy_q(w[:, f2].sum(axis=1), 0.0, rng)
        w[a, f] += alpha * (r + w[a2, f2].sum() - q_sa)   # the semi-gradient SARSA update
        f, a = f2, a2
    lengths.append(n)

L = np.array(lengths)
for k in (1, 10, 50, 100, 200):
    print(f"episode {k:3d}: {L[k-1]:5d} steps")
print(f"\\nlast 20 episodes: mean {L[-20:].mean():.1f} steps   best of all: {L.min()}")
print(f"weights learned : {w.size}")`;
