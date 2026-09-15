import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { CostToGo } from "@/components/figures/fa/CostToGo";
import { MC } from "@/components/figures/fa/data";

export const metadata = {
  title: "Mountain Car: what it actually learned — Manifold",
  description:
    "Freeze the SARSA agent whose learning curve averaged 136 steps and drive it from the valley floor: it never leaves. It rediscovered the textbook rocking strategy and also learned a trap — at rest near the bottom it pushes back toward the bottom from both sides. The same weights, still learning, escape in 148 steps.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MountainCarPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 10 minutes"
        title={<>Mountain Car: what it actually learned</>}
        intro={<>The learning curve said 136 steps. A learning curve is a summary of an agent that was still
          changing while it was measured. So take the final weights, stop learning, and look at the policy
          directly — both as a drive and as a map.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>One drive, and the whole policy</h2>
        <p>
          The code below retrains the same agent as the last page (<code>train_mc_sarsa</code> is that loop,
          packaged), then does two things with it. First it drives greedily from the most ordinary start
          imaginable: standing still at <M>p = -0.5</M>, right in the middle of the training starts. Then it
          prints the greedy action over a grid of positions and velocities, so you can read the policy like a
          chart.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The agent averaged 136 steps over its last 20 training episodes. Frozen, from standing still
            at −0.5, how does it do?</>}
          options={["About 136 steps, like its average", "Faster — no exploration now", "Slower, but it gets there", "It never gets there"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`greedy drive from the valley floor: 1000 steps, reached the goal: False
first move    : backwards (left)
lowest point  : -0.526  at step 255
last 200 steps: between -0.524 and -0.523

greedy action      < reverse   . coast   > forward
                   left of valley  -->  right, the goal
  velocity +0.070  <>>>>>>>>>>>>...<<
  velocity +0.053  <>>>>>>>>>>>>>..<<
  velocity +0.035  <<>>>>>>>>>>>...<<
  velocity +0.018  >>><>>>>>>>>>>>>><
  velocity +0.000  >>>>>>><<<<><<<>>>
  velocity -0.018  .<<<<<<><<<<<<<<>>
  velocity -0.035  .....><<<<<<<>.<<<
  velocity -0.053  <.<<<<<<<<<<>..<<<
  velocity -0.070  >>>>>.<..<<<<<<<<<`}</CodeOutput>

        <CostToGo
          cost={MC.cost}
          action={MC.action}
          pos={MC.pos}
          vel={MC.vel}
          caption={<>What 200 episodes of tile-coded SARSA actually learned, over the whole state
            space. On the left, cost-to-go: how many steps the agent expects to need from each
            (position, velocity). The expensive region is the dark band at low speed near the middle
            of the valley, topping out around <strong>113 steps</strong>; the cheap corners are
            high-speed states on either side, which are nearly free because momentum does the rest.
            On the right, the greedy action, and it is the spiral every textbook describes: push{" "}
            <em>with</em> the current velocity almost everywhere. The agent has not learned to drive
            up the hill. It has learned to resonate.</>}
        />

        <h2>What it got right</h2>
        <p>
          Read the map by rows. When the car is moving right (the top rows), the policy is almost all{" "}
          <code>&gt;</code>: push forward. When it is moving left (the bottom rows), it is mostly{" "}
          <code>&lt;</code>: push backward. <strong>Push in the direction you are already moving.</strong> That is
          the textbook solution to Mountain Car: every push adds to the swing, so the car pumps energy into its
          oscillation until one swing carries it over the right-hand hill. Nobody told the agent this. It came out
          of 1,536 weights and a reward of <M>-1</M> per step.
        </p>
        <p>
          And its very first move from −0.5 is <em>backwards</em> — away from the goal, up the left slope — which
          is the counterintuitive move a greedy human would not make.
        </p>

        <h2>What it got wrong</h2>
        <p>
          Then the drive fails. The car dips to −0.526 by step 255 and spends its last 200 steps between{" "}
          <strong>−0.524 and −0.523</strong>. That is not a random place. The floor of the valley, where{" "}
          <M>{String.raw`\cos(3p) = 0`}</M>, is at <M>{String.raw`p = -\pi/6 \approx -0.5236`}</M>. The car has
          parked at the exact bottom.
        </p>
        <p>
          The map shows why. Look at the row for velocity <M>+0.000</M>:{" "}
          <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;&lt;&lt;&lt;&lt;&gt;&lt;&lt;&lt;&gt;&gt;&gt;</code>. Just left of the
          bottom (the column at −0.565) the policy says forward; just right of it (−0.459) it says reverse. At
          rest near the floor, the car <strong>pushes back toward the floor from both sides</strong>. Whichever
          way it drifts, it corrects. We checked the last 200 steps of the drive directly: it alternates reverse
          and forward exactly 100 times each, and its speed never exceeds 0.0006. It is not stuck by physics. It
          is stuck by its own policy.
        </p>

        <h2>So how did it ever finish an episode?</h2>
        <p>
          Every training episode also started at rest in this region, and the learning curve says it got out in
          about 136 steps. The difference is that during training, <em>it was still learning</em>. Each step
          spent dithering at the bottom earns <M>-1</M>, and SARSA marks down the action it just took in those
          exact tiles. Dither long enough and the estimates it keeps using fall below the alternatives, the greedy
          choice flips, and the car breaks the loop. The trap was being dismantled in real time, every time the
          agent walked into it.
        </p>
        <p>
          Freeze the weights and that repair mechanism is gone. The next cell tests exactly this: the same weights,
          from the same start, once frozen and once still learning — and then the frozen policy from 100 starts
          drawn from the training distribution.
        </p>

        <CodeBlock setup={FA_SETUP} fromScratch={codeTrap} />
        <CodeOutput>{`frozen weights, start -0.5 : reached the goal False, after 1000 steps
still learning, start -0.5 : reached the goal True, after 148 steps

frozen weights, 100 starts from the training distribution: 79/100 reach the goal`}</CodeOutput>

        <p>
          Still learning, the same agent escapes in <strong>148 steps</strong>. Frozen, it never does — and from
          100 ordinary training starts, the frozen policy reaches the goal only <strong>79</strong> times. The
          training curve described an agent that fixes its own mistakes as it goes; the frozen policy is a
          different agent, and one in five of its drives never ends.
        </p>

        <h2>How big is the trap, really?</h2>
        <p>
          We did not want to build a page on one unlucky run, so we measured it more widely
          (<code>scripts/fa_cases.py ch3</code>):
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Frozen greedy policy, 100 training starts</th><th style={thR}>reach the goal</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>trained 200 episodes (this page)</td><td style={{ ...tdR, color: "var(--bad)" }}>79 / 100</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>trained 300 episodes</td><td style={tdR}>100 / 100</td></tr>
              <tr style={{ borderBottom: "2px solid var(--border)" }}><td style={td}>trained 500 episodes</td><td style={tdR}>100 / 100</td></tr>
              <tr><td style={td}>trained 200 episodes, 10 training seeds</td><td style={tdR}>mean 97.5 / 100</td></tr>
            </tbody>
          </table>
        </div>

        <p>
          Two honest readings. First, the trap closes with more training: by 300 episodes the frozen policy
          finishes from every start. Second, the seed we happened to use is the <em>worst</em> of ten — the other
          nine froze into policies that finished 98 to 100 times out of 100. So the effect is real, but on this
          page it is shown at its largest. What makes it worth a page is not its size. It is that the learning
          curve gave no hint of it at all.
        </p>

        <Callout color={GOLD} title={<>Evaluate the thing you will ship</>}>
          A training curve averages over an agent that is still changing — and, in general, still exploring.
          The policy you deploy is neither. Freeze the weights, turn exploration off, and test from many starts,
          including the boring ones. The{" "}
          <Link href="/learn/warehouse-robot-capstone/what-success-means" style={link}>warehouse capstone</Link>{" "}
          made the same point with a table; with function approximation it bites harder, because a state you
          rarely revisit can be quietly overwritten by updates made somewhere else.
        </Callout>

        <p>
          That last clause is the subject of the next two pages. Every value on the map above is a sum of weights
          shared with its neighbours, so what the agent ends up believing about any one patch of the valley
          depends on how far each update spreads. That spread is set by one number — the width of the tiles —
          and we have not yet asked what it should be.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/semi-gradient-sarsa", label: <>← Semi-gradient SARSA</> }}
          next={{ href: "/learn/function-approximation/the-width-dial", label: <>Next · The width dial →</> }}
        />
      </div>
    </article>
  );
}

const code = `w, coder, lengths = train_mc_sarsa(episodes=200)      # the same agent as the last page

# 1) one greedy drive, starting still at the bottom of the valley
mc = MountainCar(0); mc.reset()
mc.pos, mc.vel = -0.5, 0.0
s = np.array([mc.pos, mc.vel]); path = [s[0]]; done = False
while not done and len(path) <= 1000:
    a = int(np.argmax(w[:, coder.indices(s)].sum(axis=1)))
    s, r, done = mc.step(a); path.append(s[0])
path = np.array(path)
print(f"greedy drive from the valley floor: {len(path) - 1} steps, reached the goal: {done}")
print(f"first move    : {'backwards (left)' if path[1] < path[0] else 'forwards (right)'}")
print(f"lowest point  : {path.min():.3f}  at step {int(path.argmin())}")
print(f"last 200 steps: between {path[-200:].min():.3f} and {path[-200:].max():.3f}")

# 2) the whole policy at a glance: rows = velocity, columns = position
print("\\ngreedy action      < reverse   . coast   > forward")
print("                   left of valley  -->  right, the goal")
for v in np.linspace(MC_VEL[1], MC_VEL[0], 9):
    row = "".join("<.>"[int(np.argmax(w[:, coder.indices([p, v])].sum(axis=1)))]
                  for p in np.linspace(MC_POS[0], MC_POS[1], 18))
    print(f"  velocity {v:+.3f}  {row}")`;

const codeTrap = `w, coder, _ = train_mc_sarsa(episodes=200)      # the same 200-episode agent

def drive(w, pos, learning, cap=1000):
    "Drive from (pos, 0). Frozen = pure greedy; learning=True keeps applying SARSA updates."
    w = w.copy()
    mc = MountainCar(0); mc.reset(); mc.pos, mc.vel = pos, 0.0
    s = np.array([pos, 0.0]); f = coder.indices(s)
    a = int(np.argmax(w[:, f].sum(axis=1))); n = 0
    while True:
        s2, r, done = mc.step(a); n += 1
        q = w[a, f].sum()
        if done or n >= cap:
            if learning: w[a, f] += (0.5 / 8) * (r - q)
            return done, n
        f2 = coder.indices(s2); a2 = int(np.argmax(w[:, f2].sum(axis=1)))
        if learning: w[a, f] += (0.5 / 8) * (r + w[a2, f2].sum() - q)
        f, a = f2, a2

done, n = drive(w, -0.5, learning=False)
print(f"frozen weights, start -0.5 : reached the goal {done}, after {n} steps")
done, n = drive(w, -0.5, learning=True)
print(f"still learning, start -0.5 : reached the goal {done}, after {n} steps")

starts = np.random.default_rng(123).uniform(-0.6, -0.4, 100)
wins = sum(drive(w, p, learning=False)[0] for p in starts)
print(f"\\nfrozen weights, 100 starts from the training distribution: {wins}/100 reach the goal")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
