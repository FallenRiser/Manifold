import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule, ShopFloor } from "@/components/capstone/warehouse";
import { PolicyFloor } from "@/components/capstone/PolicyFloor";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Reading the learned policy — Manifold",
  description:
    "A score is a single number; a policy is a plan. Two agents can both score 21 and disagree about the route entirely — and a near-optimal agent here agrees with the oracle on only 84% of the states it visits. This page reads the map instead of the scoreboard.",
};

const OLIVE = "var(--c-warehouse)";

// The two grids printed by the cell below, verbatim — the figure renders these,
// it does not re-derive them.
const RISKY = [
  "  >   >   >   v   <   <   v   v",
  "  ^   ^   >   v   <   ^   v   v",
  " ##  ##  ##   v  ##  ##   v   v",
  "  v   v   v   v   v   v   v   v",
  "  P   <   <   <   <   <   <   <",
];
const SAFE = [
  "  >   >   >   >   >   >   v   v",
  "  ^   ^   ^   ^   ^   ^   v   v",
  " ##  ##  ##   v  ##  ##   >   v",
  "  v   v   v   v   v   v   v   v",
  "  P   <   <   <   <   <   <   <",
];

export default function ReadingThePolicy() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 5 · Interpret", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Reading the learned policy</>}
        intro={<>
          Act 4 got the score to the ceiling. But a score tells you <em>how well</em> the agent did, never{" "}
          <em>what it decided to do</em> — and those are different questions with different failure modes. Here we
          stop reading the scoreboard and start reading the map.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={5} n={19}>
          I have a good score. But what plan did the agent actually learn — and would I be comfortable deploying
          that specific plan, including in the situations it rarely sees?
        </WorkOrder>

        <h2>The score hides the plan</h2>
        <p>
          Recall the two basins from Act 3: a risky route through the doorway (~21) and a safe route around the
          bypass (~16). Those score differently, so the number distinguishes them. But <em>within</em> the good
          basin there are many policies that all score ~21 — they agree on the important decisions and differ on the
          unimportant ones. The scoreboard cannot tell them apart. The policy map can.
        </p>
        <p>
          The cheapest way to see the difference is to draw two policies that a reader would otherwise assume are
          &ldquo;the same solution&rdquo;: the optimal one, and the spill-averse one. Both deliver 100% of packages.
          As numbers they are 21 and 16. As <em>plans</em> they are visibly different animals.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeMaps} />
        <CodeOutput>{`OPTIMAL (risky) -- empty leg, heading to the shelf:
  >   >   >   v   <   <   v   v
  ^   ^   >   v   <   ^   v   v
 ##  ##  ##   v  ##  ##   v   v
  v   v   v   v   v   v   v   v
  P   <   <   <   <   <   <   <

SAFE (spill-averse) -- same task, a different mind:
  >   >   >   >   >   >   v   v
  ^   ^   ^   ^   ^   ^   v   v
 ##  ##  ##   v  ##  ##   >   v
  v   v   v   v   v   v   v   v
  P   <   <   <   <   <   <   <`}</CodeOutput>

        <ShopFloor stamp="Empty leg" pad="24px 20px 18px">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 22 }}>
            <PolicyFloor
              label="Optimal · risky"
              rows={RISKY}
              note="Three cells right, then straight down through the doorway — between the spills, twice an episode."
            />
            <PolicyFloor
              label="Spill-averse · safe"
              rows={SAFE}
              note="All the way right to column 6 first, then down the clear bypass. Never adjacent to a spill."
            />
          </div>
        </ShopFloor>

        <p>
          Those are the same two grids above, painted on the floor: black arrows are the greedy action in every
          state, and the taped line is the route each policy actually induces from the dock.{" "}
          Follow the arrows from the dock at top-left. The <strong>optimal</strong> policy drives right three cells
          and then <em>down through the doorway</em> at column 3. The <strong>safe</strong> policy drives all the
          way right to column 6 and only then down — the long way around, keeping clear of every spill. Same task,
          same score-to-within-a-few-points, completely different intent. If a stakeholder asks &ldquo;does the
          robot ever drive next to the spills?&rdquo;, the number 21 cannot answer them; the map answers instantly.
        </p>

        <h2>Near-optimal is not the same policy</h2>
        <p>
          Now the subtler point, and the reason reading the policy is a discipline rather than a nicety. We take a
          properly trained agent — the tuned Act-4 configuration, scoring <strong>20.85</strong>, delivering 100% —
          and ask how often its every-state decision matches the oracle&rsquo;s.
        </p>

        <CodeBlock fromScratch={codeAgree} />
        <CodeOutput>{`learned return 20.85   delivered 100.0%
agrees with oracle on 84% of the 56 states it VISITS
agrees with oracle on 81% of ALL 79 states`}</CodeOutput>

        <PredictPrompt
          accent={OLIVE}
          prompt="The agent scores 20.85 — essentially the oracle's 21.21 — yet disagrees with the oracle in about one visited state in six. How is that possible?"
          options={[
            "It isn't — a near-optimal score requires a near-identical policy",
            "Most disagreements are in states where two actions have nearly equal value, or that are visited too rarely to matter — so being 'wrong' there costs almost nothing",
            "The agent is broken and the score is a fluke",
          ]}
          nudge="Locked in. Value is what the score tracks, and many states have several near-tied actions. Disagreeing on a near-tie is free; the score only punishes disagreements at states where the choice actually matters."
        />

        <h2>Why the gap is fine here — and how you&rsquo;d know if it weren&rsquo;t</h2>
        <p>
          A 16&ndash;19% disagreement rate sounds alarming until you look at <em>where</em> it lives. Two harmless
          sources dominate:
        </p>
        <ul>
          <li>
            <strong>Near-ties.</strong> At many cells, two directions reach the goal in nearly the same expected
            steps. The oracle breaks the tie one way, the agent the other; both are within a whisker of optimal, so
            the score barely notices.
          </li>
          <li>
            <strong>Rarely-visited states.</strong> The agent visits only 56 of the 79 non-terminal states on its
            way to the goal. The other 23 it reaches almost never, so their values stayed noisy and their arrows are
            close to arbitrary. Its overall agreement drops to 81% precisely because those off-path cells were never
            polished — and it does not matter, <em>because the agent is almost never there.</em>
          </li>
        </ul>
        <p>
          But that last sentence is a promise you must actually check, not assume. An arbitrary arrow in a
          rarely-visited state is harmless <em>only if the state stays rare.</em> If some disturbance can push the
          agent into that cell — and on our floor a slip can — then a garbage action there can start a loop. The map
          is exactly the tool for auditing this: scan the off-path cells, and for any that a mishap could route the
          agent into, confirm the arrow at least points <em>somewhere sensible</em> rather than into a wall. A score
          will never surface this; only looking at the plan will.
        </p>

        <Callout color={OLIVE} title={<>What to actually look for in a policy map</>}>
          Reading a policy is a repeatable audit, not an art. Four passes: <strong>(1)</strong> trace the main path
          from the start and check it is the route you intended; <strong>(2)</strong> look at the states near your
          hazards and confirm the agent&rsquo;s behaviour there matches your risk tolerance; <strong>(3)</strong>{" "}
          find the states the agent rarely visits and make sure none of their actions form a trap it could be
          knocked into; <strong>(4)</strong> compare against a reference — the oracle if you have one, a hand-drawn
          &ldquo;what I expect&rdquo; if you don&rsquo;t — and <em>investigate every disagreement</em> until you can
          say whether it is a harmless near-tie or a real defect. The score told you the agent is good on average;
          this tells you whether it is good in the ways you care about.
        </Callout>

        <TransferBox>
          Never ship an RL agent on its score alone. Render the policy — as a map, a decision table, a set of traced
          trajectories, whatever your state space allows — and audit it: the intended path, the behaviour near
          hazards, the rarely-visited traps, and every disagreement with your reference. A near-optimal score
          guarantees good <em>average</em> behaviour, not the absence of a catastrophic decision in a corner you
          forgot to look at.
        </TransferBox>

        <PlaybookRule n={19}>
          <strong>Read the policy, not just the score.</strong> Render and audit the learned plan — main path,
          behaviour near hazards, rarely-visited traps, disagreements with a reference — because many different
          policies share one score, and the number cannot tell you which one you got.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/tuning-protocol", label: <>← Tuning without fooling yourself</> }}
          next={{ href: "/learn/warehouse-robot-capstone/failure-modes", label: <>Next up · Failure modes →</> }}
        />
      </div>
    </article>
  );
}

const codeMaps = `# Two policies for the SAME task, both delivering 100% of packages.
V, PI = dp_solve()                       # the optimal (risky) policy
_orig = SPILL; SPILL = -300.0            # solve as if a spill were unthinkable...
Vs, PIsafe = dp_solve(); SPILL = _orig   # ...to get the spill-averse policy

print("OPTIMAL (risky) -- empty leg, heading to the shelf:")
show(PI, 0)
print()
print("SAFE (spill-averse) -- same task, a different mind:")
show(PIsafe, 0)`;

const codeAgree = `# How closely does a well-trained agent's PLAN match the oracle's, state by state?
# (Precomputed in rl_capstone_cases.py: tuned config, seed 0, 15000 episodes.)
Q = train("q", eps=1.0, eps_end=0.05, seed=0)     # the tuned Act-4 agent
pol = Q.argmax(1)
V, PI = dp_solve()

visited = set()
env = Warehouse(3)
for _ in range(2000):
    s = env.reset()
    for t in range(250):
        visited.add(s); s, r, done = env.step(int(pol[s]))
        if done: break

on_path = sum(pol[s] == PI[s] for s in visited) / len(visited)
overall = sum(pol[s] == PI[s] for s in NONTERMINAL) / len(NONTERMINAL)
r = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
print("learned return %.2f   delivered %.1f%%" % (r["ret"], r["delivered"] * 100))
print("agrees with oracle on %.0f%% of the %d states it VISITS" % (100 * on_path, len(visited)))
print("agrees with oracle on %.0f%% of ALL %d states" % (100 * overall, len(NONTERMINAL)))`;
