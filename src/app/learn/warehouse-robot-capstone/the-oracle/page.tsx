import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The oracle: knowing your ceiling — Manifold",
  description:
    "We wrote this world, so we can solve it exactly: value iteration gives the best achievable score, 21.21. The oracle also settles two things a learner never could — that the optimal policy deliberately accepts risk, and that V* and the scoreboard are different numbers.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheOracle() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 2 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 11 minutes"
        title={<>The oracle: knowing your ceiling</>}
        intro={<>
          We built this warehouse, which means we know its transition probabilities exactly — so we can compute the
          best score any policy could ever achieve. No learning agent has that privilege, and we will not let ours
          use it. But we get to, and the ceiling is what makes every number in Act 3 interpretable.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion accent={OLIVE} label="The engineer's question" icon="🤖">
          How much headroom is there? If my agent scores 18, is that 85% of what is possible or 40% — and do I
          have any way of knowing?
        </AnalystQuestion>

        <h2>The privilege we are about to use once</h2>
        <p>
          There is a firm line through this capstone. The <code>Warehouse</code> class only lets you{" "}
          <code>reset()</code> and <code>step()</code> — sample the world, one transition at a time. That is what a
          real robot has. But <em>we</em> also have the code that generates those transitions, so we can do
          something a robot cannot: enumerate every outcome of every action in every state and solve the Bellman
          optimality equation directly with{" "}
          <Link href="/learn/planning/value-iteration" style={link}>value iteration</Link>.
        </p>
        <p>
          That is the <strong>oracle</strong>. It is not an agent and it is not a competitor — it is an instrument,
          used once, to mark the top of the scale. Every learned agent in Act 3 sees only samples.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeOracle} />
        <CodeOutput>{`V*(dock, empty) = 3.68   <- the model's own prediction
measured        : return 21.21   delivered 100.0%   spills 0.138   steps 24.6`}</CodeOutput>

        <h2>Why the oracle&rsquo;s own number disagrees with the scoreboard</h2>
        <p>
          Two numbers, both correct, describing the same policy: <strong>3.68</strong> and{" "}
          <strong>21.21</strong>. This trips people up constantly, so it is worth spending a paragraph on.
        </p>
        <p>
          <M>{String.raw`V^*(s)`}</M> is the <em>discounted</em> return, because that is the objective the agent
          optimises. The delivery bonus arrives about 24 steps in, so its contribution to{" "}
          <M>{String.raw`V^*`}</M> is <M>{String.raw`0.97^{24}\times 50 \approx 24`}</M>, not 50 — and the step
          costs in between, being immediate, are barely discounted at all. Net: <strong>3.68</strong>. The
          scoreboard from the previous page is the <em>undiscounted</em> return, which counts the full{" "}
          <M>{String.raw`+50`}</M>: <strong>21.21</strong>.
        </p>
        <p>
          Neither is wrong. They answer different questions — <em>&ldquo;what does the agent believe this state is
          worth under its own objective?&rdquo;</em> versus <em>&ldquo;what does this policy earn the
          business?&rdquo;</em> — and they will never agree unless <M>{String.raw`\gamma = 1`}</M>. Report a{" "}
          <M>{String.raw`V^*`}</M> where a return is expected and you will look like you are hiding something.
          Keep the two labelled, always.
        </p>

        <h2>Reading the ceiling policy</h2>
        <p>
          Because the state contains the carrying bit, the optimal policy is really two maps. Here they are, drawn
          over the floor:
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeRoutes} />
        <CodeOutput>{`EMPTY -- heading for the shelf P
  >   >   >   v   <   <   v   v
  ^   ^   >   v   <   ^   v   v
 ##  ##  ##   v  ##  ##   v   v
  v   v   v   v   v   v   v   v
  P   <   <   <   <   <   <   <

CARRYING -- heading for the dropoff D
  >   >   >   >   >   >   >   D
  ^   ^   ^   ^   ^   ^   >   ^
 ##  ##  ##   ^  ##  ##   >   ^
  v   v   >   >   >   >   ^   ^
  >   >   >   >   >   >   ^   ^`}</CodeOutput>
        <p>
          Follow the arrows from the dock at the top-left of the first map: right, right, right, then straight down
          through the <strong>doorway</strong> at column 3, then along the bottom row to the shelf. Now follow the
          second map from the shelf: right along row 4 to column 6, up through the <strong>bypass</strong>, across
          to column 7, and up to the dropoff.
        </p>
        <p>
          The two crossings are made by different routes, and the asymmetry has a cause. Going down, a spill costs
          the trip so far — which at that point is three steps. Coming back, a spill costs the trip{" "}
          <em>and the package is still undelivered</em>, with the whole outbound leg to redo. Same wall, same slip
          probability, different stake. So the optimal robot gambles on the way out and plays safe on the way home.
        </p>
        <p>
          Notice also what the arrows do in the top-right corner of the empty map — <em>down, down</em>, away from
          the dropoff. Those cells are only ever visited by accident, and from there the fastest way to the shelf
          is the bypass. The policy has an answer for every state, including the ones a good robot never reaches.
          Act 5 comes back to this: it is where badly-trained agents hide their worst behaviour.
        </p>

        <h2>The ceiling is not the safe policy</h2>
        <p>
          The optimal policy spills <strong>0.138</strong> times per episode. It could spill zero — the bypass
          route exists and nothing forces the robot through the doorway. It chooses not to.
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="Suppose we force absolute caution: solve a warehouse where a spill costs −300 instead of −30, then score that policy on the real reward. How much does perfect safety cost?"
          options={[
            "Nothing much — the safe route is only a few steps longer",
            "About 5 points of return, roughly a quarter of the achievable score",
            "It should score higher — spills are the expensive thing here",
          ]}
          nudge="Locked in. The comparison below is the seed of the whole safety argument in Act 3."
        />

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeSafe} />
        <CodeOutput>{`policy            |  return   spills   steps
optimal           |   21.21   0.1380    24.6
zero-risk         |   16.44   0.0000    33.6`}</CodeOutput>
        <p>
          A completely spill-free policy exists and scores <strong>16.44</strong>. The optimal policy buys{" "}
          <strong>4.77</strong> extra points by accepting about one spill every seven episodes. Is that the right
          trade? The arithmetic says yes — but only because <em>we</em> declared in Act 1 that a spill is worth{" "}
          <M>{String.raw`-30`}</M> and a step is worth <M>{String.raw`-1`}</M>. Change those two numbers and the
          ceiling moves, and so does the route.
        </p>

        <Callout color={OLIVE} title={<>The ceiling is a consequence of your specification</>}>
          It is tempting to read 21.21 as a fact about the warehouse. It is not. It is a fact about the warehouse{" "}
          <em>plus our reward function plus our discount</em> — every one of them a choice from Act 1. &ldquo;Optimal&rdquo;
          in RL never means &ldquo;the behaviour a sensible person would want&rdquo;; it means &ldquo;the maximiser
          of the objective you wrote down&rdquo;.
          <br /><br />
          Which is why the risk appetite of the optimal policy deserves a look before you deploy anything. If a
          real spill means a supervisor walking to the aisle with a mop, <M>{String.raw`-30`}</M> may be
          generous. If it means an injury, no finite penalty is right and the risk belongs in a constraint rather
          than the reward. The oracle will always faithfully compute the ceiling of the problem you specified —
          including when that is not the problem you meant.
        </Callout>

        <h2>When you cannot build an oracle</h2>
        <p>
          Ours exists only because the warehouse is small and simulated. In most real projects, the model is
          unknown or the state space is astronomical, and there is no ceiling to compute. You are not without
          options:
        </p>
        <ul>
          <li><strong>Human expert performance</strong> — have a person drive the system and score them on the same harness.</li>
          <li><strong>A relaxed problem</strong> — remove the stochasticity, or grant hindsight knowledge, and solve <em>that</em>. It gives an upper bound, usually a loose one, but a real one.</li>
          <li><strong>Hindsight-optimal replay</strong> — on logged data, compute the best decisions that could have been made knowing what happened next.</li>
          <li><strong>An oracle on a scaled-down twin</strong> — solve a toy version exactly, verify your agent reaches its ceiling there, then scale up with some evidence that the method works.</li>
        </ul>
        <p>
          That last one is the most useful habit, and it is what this capstone is secretly rehearsing:{" "}
          <strong>an agent that cannot reach the ceiling on a problem small enough to have one is not going to
          surprise you on a bigger one.</strong>
        </p>

        <h2>The scale, complete</h2>
        <p>Act 2 ends with every reference point on the board:</p>
        <ul>
          <li><strong>&minus;3560</strong> · the hand-coded heuristic, wrecked by a single bad state</li>
          <li><strong>&minus;816</strong> · random</li>
          <li><strong>&minus;250</strong> · never finishes, never spills — the aliased agent&rsquo;s signature</li>
          <li><strong>+16.44</strong> · the best <em>spill-free</em> policy</li>
          <li><strong>+21.21</strong> · the ceiling</li>
        </ul>
        <p>
          A learned agent scoring 18 is now legible: clearly competent, above the safe route, still four points
          short of optimal — and the interesting question becomes <em>where</em> those four points went. Act 3
          starts training.
        </p>

        <Quiz
          accent={OLIVE}
          title="Act 2 checkpoint"
          questions={[
            {
              q: <>Why is a spill&rsquo;s true cost 39 points rather than the 31 written in the reward?</>,
              options: [
                "The penalty is applied twice",
                "The tow back to the dock forces the robot to re-walk ground it had already covered — about 6.7 extra steps on top of the written penalty",
                "Discounting inflates it",
              ],
              answer: 1,
              explain: <>Splitting 3,000 optimal episodes into clean and spoiled gives 26.25 versus −13.01. The gap
                is the written penalty plus the delay it causes — the reason we need value functions at all is to
                account for consequences nobody wrote down.</>,
            },
            {
              q: <>The same fixed policy scores 20.97 and 13.10. What changed?</>,
              options: [
                "The number of evaluation episodes",
                "The evaluation exploration rate — at ε = 0.10 the random actions are expensive specifically because the good route runs beside a hazard",
                "The discount used for scoring",
              ],
              answer: 1,
              explain: <>Spills roughly double, from 0.147 to 0.289 per episode. Exploration is cheap in open floor
                and expensive next to a spill — which is exactly why SARSA and Q-learning are about to disagree.</>,
            },
            {
              q: <>How can a sensible hand-coded policy (&minus;3560) score four times worse than acting at random (&minus;816)?</>,
              options: [
                "It is a straw man written badly on purpose",
                "It is deterministic: it drives into the same spill, is thrown back to the dock, and — nothing having changed — makes the identical decision again, forever",
                "Random policies get lucky more often than people expect",
              ],
              answer: 1,
              explain: <>110 spills per episode, roughly every other step. A random policy&rsquo;s mistakes are
                uncorrelated in time; a deterministic policy&rsquo;s repeat. In control, the worst state a policy
                keeps returning to matters more than its average state.</>,
            },
            {
              q: <>The oracle reports V*(dock) = 3.68 but the same policy measures 21.21. Which is the ceiling?</>,
              options: [
                "3.68 — it is the value function, computed exactly",
                "21.21 — the ceiling is stated on the scoreboard, which is the undiscounted return; V* is the discounted objective the agent optimises and is not comparable",
                "Neither; the ceiling is somewhere between them",
              ],
              answer: 1,
              explain: <>Both numbers are correct and describe the same policy. V* discounts the +50 arriving 24
                steps out to about 24. Always label which of the two you are quoting.</>,
            },
            {
              q: <>The optimal policy spills 0.138 times per episode when a spill-free policy exists. Why?</>,
              options: [
                "Value iteration has not fully converged",
                "Because the reward we wrote makes it worth it: the doorway saves ~9 steps and the safe route scores 16.44 against the optimal 21.21",
                "Slip makes zero spills impossible",
              ],
              answer: 1,
              explain: <>A zero-spill policy exists and costs 4.77 points. The optimal policy&rsquo;s risk appetite
                is a consequence of our −30 and −1, not a property of the warehouse — which is why you should
                inspect it before deploying anything.</>,
            },
          ]}
        />

        <TransferBox accent={OLIVE}>
          Get a ceiling however you can — exact solution, human expert, relaxed problem, or an oracle on a
          scaled-down twin — before you start optimising. Without one, &ldquo;we improved 5%&rdquo; is unreadable:
          it might be the last 5% available or the first of eighty. And when you do have an oracle, inspect its
          <em> behaviour</em>, not just its score: it is the clearest statement you will ever get of what your
          reward function actually asked for.
        </TransferBox>

        <PlaybookRule n={9} accent={OLIVE}>
          <strong>Establish the ceiling before you optimise</strong>, keep the discounted{" "}
          <M>{String.raw`V^*`}</M> and the undiscounted scoreboard clearly separate, and read the optimal
          policy&rsquo;s risk appetite as a review of your reward function.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/baselines", label: <>← Baselines: the number to beat</> }}
          next={{ href: "/learn/warehouse-robot-capstone/q-learning", label: <>Next act · The first agent: Q-learning →</> }}
        />
      </div>
    </article>
  );
}

const codeOracle = `V, PI = dp_solve()          # enumerate the model and solve it exactly -- a learner CANNOT do this
r = evaluate(lambda s: PI[s], n=2000, seed=999)
print("V*(dock, empty) = %.2f   <- the model's own prediction" % V[sid(DOCK[0], DOCK[1], 0)])
print("measured        : return %.2f   delivered %.1f%%   spills %.3f   steps %.1f"
      % (r["ret"], r["delivered"]*100, r["spills"], r["steps"]))`;

const codeRoutes = `V, PI = dp_solve()
print("EMPTY -- heading for the shelf P")
show(PI, 0)
print()
print("CARRYING -- heading for the dropoff D")
show(PI, 1)`;

const codeSafe = `V, PI = dp_solve()
opt = evaluate(lambda s: PI[s], n=2000, seed=999)

_orig = SPILL
SPILL = -300.0                       # solve a world where a spill is unthinkable
Vs, PIs = dp_solve()
SPILL = _orig                        # ...but score it on the REAL reward
safe = evaluate(lambda s: PIs[s], n=2000, seed=999)

print("policy            |  return   spills   steps")
for name, x in (("optimal", opt), ("zero-risk", safe)):
    print("%-17s | %7.2f %8.4f %7.1f" % (name, x["ret"], x["spills"], x["steps"]))`;
