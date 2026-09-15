import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";
import { FloorPlan } from "@/components/capstone/FloorPlan";

export const metadata = {
  title: "The warehouse field guide — Manifold",
  description:
    "The complete spec of the environment we are about to train against: floor plan, dynamics, stochasticity, episode boundaries — and the measured true cost of a spill, which is 39 points, not the 30 written in the reward function.",
};

const OLIVE = "var(--c-warehouse)";

export default function TheWarehouse() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 2 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>The warehouse field guide</>}
        intro={<>
          Act 1 chose the state, the reward and the discount. Before a single agent learns anything, we write down
          exactly what we are training against — the floor, the physics, where an episode starts and stops — and
          then check one number we thought we already knew: what a spill actually costs.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={2} n={6}>
          Can I state my environment&rsquo;s dynamics, stochasticity and episode boundaries precisely enough that
          someone else could rebuild it — and have I checked that the costs I wrote down are the costs the agent
          actually experiences?
        </WorkOrder>

        <h2>The floor</h2>
        <p>
          Five rows, eight columns. The robot starts at the <strong>dock</strong> in the top-left, must reach the{" "}
          <strong>shelf</strong> in the bottom-left to collect a package, and must then carry it to the{" "}
          <strong>dropoff</strong> in the top-right. Running across the middle is a row of spilled cells the robot
          must not drive through.
        </p>

        <FloorPlan />

        <p>
          The geometry is the whole design. The shelf is <em>below</em> the spill wall and the dropoff is{" "}
          <em>above</em> it, so the robot must cross that wall <strong>twice every episode</strong> — once empty on
          the way down, once carrying on the way back up. And the wall has more than one gap:
        </p>
        <ul>
          <li>
            the <strong>doorway</strong> at column 3 — short, but with spilled cells on both flanks, so a slip
            costs you;
          </li>
          <li>
            the <strong>bypass</strong> at columns 6&ndash;7 — a longer detour around the end of the wall, with
            nothing dangerous adjacent.
          </li>
        </ul>
        <p>
          Every interesting question in this capstone is some version of &ldquo;which crossing, and why&rdquo;.
          Here is the floor as the code sees it:
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeMap} />
        <CodeOutput>{`  r0  S   .   .   .   .   .   .   D
  r1  .   .   .   .   .   .   .   .
  r2  H   H   H   .   H   H   .   .
  r3  .   .   .   .   .   .   .   .
  r4  P   .   .   .   .   .   .   .
      c0   c1   c2   c3   c4   c5   c6   c7

dock (start) : (0, 0)
pickup shelf : (4, 0)
dropoff      : (0, 7)
spill cells  : [(2, 0), (2, 1), (2, 2), (2, 4), (2, 5)]
gaps in the spill wall (row 2): [3, 6, 7]
states       : 80  actions: 4`}</CodeOutput>

        <h2>The rules, in full</h2>
        <p>
          Everything below is implemented in the <code>Warehouse</code> class that every code block on this site
          imports. There is no hidden behaviour.
        </p>
        <ul>
          <li>
            <strong>State.</strong> <M>{String.raw`(\text{row},\ \text{col},\ \text{carrying})`}</M> — 40 cells ×
            2 = <strong>80 states</strong>. The carrying bit flips to 1 automatically on entering the shelf.
          </li>
          <li>
            <strong>Actions.</strong> Four: up, right, down, left. Driving into an outer wall leaves the robot
            where it is (and still costs a step).
          </li>
          <li>
            <strong>Stochasticity.</strong> With probability <M>{String.raw`1-\text{slip} = 0.90`}</M> the robot
            moves as commanded; otherwise it is shoved 90° to one side, each with probability 0.05. This is the
            only randomness in the world, and it is what makes standing next to a spill dangerous.
          </li>
          <li>
            <strong>Rewards.</strong> <M>{String.raw`-1`}</M> per step, <M>{String.raw`-30`}</M> for a spill,{" "}
            <M>{String.raw`+50`}</M> for delivering.
          </li>
          <li>
            <strong>Spills do not end the episode.</strong> Driving into a spilled cell costs 30 and{" "}
            <em>teleports the robot back to the dock</em> — package still in hand if it had one. It is a setback,
            not a death.
          </li>
          <li>
            <strong>Episode boundaries.</strong> Start: dock, empty-handed. Terminal: standing on the dropoff
            carrying a package. Evaluation additionally cuts the episode off at{" "}
            <strong>250 steps</strong>, so a policy that never finishes still yields a finite score.
          </li>
        </ul>

        <Callout color={OLIVE} title={<>Why the truncation cap matters more than it looks</>}>
          That 250-step cap is not a detail; it is the difference between an experiment that terminates and one
          that hangs. Early in training, and forever for a badly-specified agent, policies simply do not finish.
          The cap also gives failure a <em>readable signature</em>: a mean return of almost exactly{" "}
          <M>{String.raw`-250`}</M> with 0% delivered means &ldquo;walked in a circle for 250 steps&rdquo; — which
          is precisely what we saw the aliased agent do in Act 1. Choose a cap, write it down, and never compare
          two numbers measured under different caps.
        </Callout>

        <h2>What a spill actually costs</h2>
        <p>
          The reward function says <M>{String.raw`-30`}</M>. But the reward function is not the only consequence
          of a spill: the robot is also thrown back to the dock, and has to redo however much of the trip it had
          already completed. That second cost is invisible in the spec and very visible in the results. So let&rsquo;s
          measure it — run the optimal policy 3,000 times and split the episodes into those that spilled and those
          that did not.
        </p>

        <GuessSlider
          accent={OLIVE}
          prompt={<>A spill is written as <M>{String.raw`-30`}</M>, and the step that caused it costs another{" "}
            <M>{String.raw`-1`}</M>. How much worse, on average, is an episode that contains a spill?</>}
          min={20}
          max={60}
          step={1}
          start={31}
          actual={39.26}
          decimals={2}
          reveal={<>Nearly ten points worse than the sticker price. The extra comes from the tow back to the dock:
            spoiled episodes take <strong>6.7 more steps</strong>, and those steps are re-walking ground the robot
            had already covered.</>}
        />

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeSpill} />
        <CodeOutput>{`episodes with NO spill :  2618   mean return   26.25   mean steps  23.7
episodes with a spill  :   382   mean return  -13.01   mean steps  30.4
difference             :                 39.26              6.7`}</CodeOutput>
        <p>
          <strong>39.26</strong>, not 31. The written penalty accounts for about three-quarters of the true damage;
          the rest is the delay it causes. This is a general and slightly uncomfortable property of sequential
          decision problems: <em>the cost of an event is not the number attached to it, but that number plus
          everything it does to the rest of the episode.</em> It is exactly the reason we need value functions at
          all — a value is the machinery for accounting for consequences you did not write down.
        </p>
        <p>
          It also sharpens the doorway-versus-bypass question. The bypass is about six steps longer, costing{" "}
          <M>{String.raw`\approx 6`}</M>. A spill costs <M>{String.raw`\approx 39`}</M>. So the doorway is worth
          taking only if it spills less than roughly one time in six. Keep that ratio in mind — in Act 3 the
          algorithms will disagree about it, and that disagreement is the second hard truth of this capstone.
        </p>

        <h2>One episode, step by step</h2>
        <p>
          Finally, the shape of a good episode. Here is the optimal policy running once, with{" "}
          <code>*</code> marking the steps where the robot is carrying:
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeEpisode} />
        <CodeOutput>{`(0,0) -> (0,1) -> (0,2) -> (0,3) -> (0,2) -> (0,3) -> (1,3) -> (2,3) -> (3,3) -> (4,3) -> (4,2) -> (4,1) -> (4,0)* -> (4,1)* -> (4,2)* -> (4,3)* -> (4,4)* -> (4,5)* -> (4,6)* -> (3,6)* -> (2,6)* -> (2,7)* -> (1,7)* -> (0,7)*

steps: 23    * = carrying the package`}</CodeOutput>
        <p>
          Two things to notice. First, the fourth step is a <strong>slip</strong>: the robot commanded{" "}
          <em>down</em> at (0,3) and was shoved to (0,2), then simply carried on. Second — and this is the detail
          worth stopping at — the two crossings are made <strong>differently</strong>. Outbound, empty-handed, it
          goes through the doorway at column 3. On the return leg, carrying the package, it takes the long bypass
          at column 6.
        </p>
        <p>
          The optimal policy is not &ldquo;prefer the short route&rdquo; or &ldquo;prefer the safe route&rdquo;. It
          is willing to gamble when it has nothing to lose and unwilling once it has something to protect — and
          nobody told it to behave that way. It fell out of the arithmetic, which is the pleasure of this whole
          approach. Act 5 will read the full policy map and confirm the pattern holds everywhere, not just on this
          one lucky run.
        </p>

        <TransferBox>
          Write the environment spec down before you train, in enough detail that a stranger could rebuild it —
          and then measure the cost of your rare, bad events end-to-end rather than trusting the constant in the
          reward function. Setbacks that reset progress (a dropped connection, a failed transaction, a restarted
          job) always cost more than their sticker price, and the gap is where your intuition about the trade-offs
          goes wrong.
        </TransferBox>

        <PlaybookRule n={6}>
          <strong>Specify the environment completely — including the truncation cap — before training anything</strong>,
          and measure the true end-to-end cost of each bad event rather than assuming it equals the penalty you
          wrote.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/choosing-the-discount", label: <>← Choosing the discount</> }}
          next={{ href: "/learn/warehouse-robot-capstone/what-success-means", label: <>Next up · What counts as success? →</> }}
        />
      </div>
    </article>
  );
}

const codeMap = `for r in range(NROW):
    print("  r%d  " % r + "   ".join(FLOOR[r]))
print("      " + "   ".join("c%d" % c for c in range(NCOL)))
print()
print("dock (start) :", DOCK)
print("pickup shelf :", PICK)
print("dropoff      :", DROP)
print("spill cells  :", sorted(SPILLS))
print("gaps in the spill wall (row 2):", [c for c in range(NCOL) if (2, c) not in SPILLS])
print("states       :", nS, " actions:", nA)`;

const codeSpill = `V, PI = dp_solve()                    # the optimal policy (Act 2 will earn this properly)
env = Warehouse(11)
clean_r = clean_s = dirty_r = dirty_s = 0.0
nc = nd = 0
for _ in range(3000):
    s = env.reset(); tot = 0.0; n_sp = 0
    for t in range(1, 251):
        s, r, done = env.step(int(PI[s]))
        tot += r
        if r <= STEP_COST + SPILL + 1e-9: n_sp += 1
        if done: break
    if n_sp == 0: clean_r += tot; clean_s += t; nc += 1
    else:         dirty_r += tot; dirty_s += t; nd += 1

print("episodes with NO spill : %5d   mean return %7.2f   mean steps %5.1f" % (nc, clean_r/nc, clean_s/nc))
print("episodes with a spill  : %5d   mean return %7.2f   mean steps %5.1f" % (nd, dirty_r/nd, dirty_s/nd))
print("difference             :               %7.2f              %5.1f" % (
    clean_r/nc - dirty_r/nd, dirty_s/nd - clean_s/nc))`;

const codeEpisode = `env = Warehouse(4); s = env.reset(); V, PI = dp_solve()
trail = []
for t in range(250):
    r, c, k = unpack(s)
    trail.append("(%d,%d)%s" % (r, c, "*" if k else ""))
    s, rew, done = env.step(int(PI[s]))
    if done:
        r, c, k = unpack(s); trail.append("(%d,%d)*" % (r, c)); break

print(" -> ".join(trail))
print()
print("steps:", len(trail) - 1, "   * = carrying the package")`;
