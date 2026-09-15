import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { INVENTORY_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Transfer test II · Inventory control — Manifold",
  description:
    "The far transfer drops the grid entirely. No robot, no floor, no route — just stock levels and stochastic demand. Every rule of the Playbook still applies, and the same Q-learning that drove the robot recovers the classic (s,S) inventory policy at 99% of the optimum.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TransferFar() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 6 · Transfer", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>Transfer test II · Inventory control</>}
        intro={<>
          The real test of a skill is whether it survives losing its scaffolding. So we throw away the grid. No
          robot, no cells, no route, no spatial intuition to lean on — just how much stock to order each morning
          against uncertain demand. If the Playbook is a way of thinking rather than a set of grid tricks, it should
          carry over intact. It does.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={6} n={24}>
          Strip away everything specific to the warehouse. Is what I learned a bag of gridworld tricks, or a
          transferable procedure for turning a sequential decision under uncertainty into a solved problem?
        </WorkOrder>

        <h2>A completely different problem</h2>
        <p>
          A shop holds stock of one item. Each morning you decide how many units to order; they arrive before the
          day&rsquo;s customers. Demand is random. Sell a unit for a profit; hold leftover stock overnight at a
          cost; run out and you lose the sale. Order too much and holding eats you; order too little and stockouts
          do. There is no floor, no position, no path — and yet <em>every question from Act 1 still has to be
          answered.</em>
        </p>
        <ul>
          <li><strong>The decision &amp; metric</strong> (Rule 1): how much to order; maximise long-run profit per day.</li>
          <li><strong>State</strong> (Rule 3): units of stock on hand. Is that enough to be{" "}
            <Link href="/learn/markov-decision-processes/the-markov-property" style={link}>Markov</Link>? Only if
            demand is independent day to day — the same freeze test, a different trap.</li>
          <li><strong>Actions</strong>: order 0&hellip;capacity units.</li>
          <li><strong>Reward</strong> (Rule 4): revenue &minus; holding &minus; order cost &minus; stockout penalty
            — profit, stated directly, rewarding no proxy for it.</li>
          <li><strong>Discount</strong> (Rule 5): how many days ahead today&rsquo;s stocking decision should look.</li>
        </ul>
        <p>
          The environment is a few lines — a demand distribution and a profit calculation — with the same{" "}
          <code>reset</code>/<code>step</code> interface the warehouse had, and no model exposed to the learner. The
          entire grid apparatus is gone.
        </p>

        <Callout color={OLIVE} title={<>The state-design trap wears a new costume</>}>
          On the grid, forgetting the carrying bit made the problem unsolvable. Here the same rule bites in a new
          place. If demand were seasonal or trending — higher on weekends, say — then <em>stock level alone would
          not be Markov</em>: the best order on a Friday differs from a Monday even at identical stock, and an agent
          that sees only stock is aliased exactly as the position-only robot was. Our demand is deliberately i.i.d.,
          so stock <em>is</em> sufficient — but the discipline is identical: name two situations that need different
          actions and check your state tells them apart. The costume changed; the rule did not.
        </Callout>

        <h2>Baselines and the oracle — same harness</h2>
        <p>
          Before learning anything, we bracket the problem exactly as Act 2 demanded: trivial baselines for the
          floor, and — since we own the demand model — an oracle for the ceiling, via the very same value iteration
          that solved the grid.
        </p>

        <CodeBlock setup={INVENTORY_SETUP} fromScratch={codeBase} />
        <CodeOutput>{`never order       : -14.888  /day
random order      :   4.093  /day
order-up-to-8     :  13.549  /day
order-up-to-10    :  13.249  /day
oracle (DP)       :  14.524  /day

oracle policy is an (s, S) rule:
  stock :  0  1  2  3  4  5  6  7  8  9 10 11 12
  order : 12 11 10  9  8  7  0  0  0  0  0  0  0`}</CodeOutput>

        <PredictPrompt
          accent={OLIVE}
          prompt="Look at the oracle's order quantities: 12, 11, 10, 9, 8, 7, then 0, 0, 0… What structure is that?"
          options={[
            "Order a fixed amount every day regardless of stock",
            "Order up to a target of 12 whenever stock is low, and order nothing once you already hold enough — a base-stock (s, S) policy",
            "Order randomly; there's no pattern",
          ]}
          nudge="Locked in. 0+12, 1+11, 5+7 all reach 12; at stock 6 and above it orders nothing. That's 'top up to 12, otherwise don't bother' — the classic (s, S) rule, and nobody coded it in. It emerged from planning, exactly as the route did."
        />

        <p>
          Read the oracle&rsquo;s policy as a <em>plan</em>, the way Act 5 taught, and a famous structure falls out:
          every low-stock order tops the shelf up to <strong>12</strong> (0+12, 1+11, &hellip;, 5+7), and from
          stock 6 upward it orders nothing. That is a <strong>base-stock, or (s, S), policy</strong> — &ldquo;if
          stock has fallen to the reorder point, refill to the target; otherwise wait&rdquo; — the canonical result
          of inventory theory. We did not program it. It <em>emerged</em> from value iteration on the reward we
          wrote, precisely as the doorway-then-bypass route emerged on the grid. Same machinery, same kind of
          surprise.
        </p>
        <p>
          The baselines land where they should, too: doing nothing is ruinous (<M>{String.raw`-14.9`}</M>), random
          ordering is barely positive (4.1), and a sensible hand-coded &ldquo;top up to 8 or 10&rdquo; heuristic
          gets you most of the way (13.2&ndash;13.5) — the hand-coded rule is respectable here, unlike the
          warehouse&rsquo;s, because inventory has no self-reinforcing spill trap. The oracle&rsquo;s 14.5 is the
          number to chase.
        </p>

        <h2>Learning it from samples</h2>
        <p>
          Now the same Q-learning agent — sampled backup, <M>\varepsilon</M>-greedy exploration, annealed schedule,
          all of it lifted unchanged from the warehouse — meets a problem with no geometry. The only differences are
          that this task never ends (inventory runs forever, so we learn over one long stream of days rather than
          episodes) and the numbers mean units and dollars instead of cells and steps.
        </p>

        <CodeBlock setup={INVENTORY_SETUP} fromScratch={codeLearn} />
        <CodeOutput>{`learned Q-learning: 14.306 /day  (99% of the oracle's 14.524)
learned order qty (stock 0..8): 17 15 10  8 10  8  7  0  0
oracle  order qty (stock 0..8): 12 11 10  9  8  7  0  0  0`}</CodeOutput>
        <p>
          <strong>14.31 against the oracle&rsquo;s 14.52 — 99% of optimal</strong>, and comfortably past every
          heuristic, learned purely from sampled days. And look at the policy with Act 5&rsquo;s eyes: the learned
          order quantities (17, 15, 10, 8&hellip;) are <em>messier</em> than the oracle&rsquo;s clean staircase, and
          it over-orders at the low end — yet it captures the structure that matters (top up when low, stop when
          high, reorder around stock 6) and pays almost nothing for the sloppy details. Near-optimal value with a
          visibly imperfect policy: exactly the reading-the-policy lesson, now on a problem the agent has never seen
          the shape of.
        </p>

        <h2>The Playbook is the transferable thing</h2>
        <p>
          Nothing in this page was about warehouses. We framed a decision and a metric, designed a state and tested
          it for aliasing, wrote a reward for the outcome, chose a discount, laid down baselines and an oracle,
          learned from samples, and read the resulting policy — and it took us from &ldquo;random ordering, barely
          break even&rdquo; to 99% of the theoretical optimum on a problem with no relation to a grid. The warehouse
          was never the point. It was a concrete place to build a way of thinking that turns out to be the same for
          a robot on a floor and a shop managing stock:
        </p>
        <p style={{ textAlign: "center", fontStyle: "italic", color: "var(--muted)", fontSize: 15 }}>
          frame it &rarr; design the state &rarr; reward the outcome &rarr; bracket with baselines and a ceiling
          &rarr; learn from samples &rarr; tune honestly &rarr; read and stress-test the policy.
        </p>
        <p>
          That sequence is the capstone. The grid was just where you learned to run it.
        </p>

        <TransferBox>
          When you meet a new sequential decision problem, do not look for what makes it special — look for the same
          seven questions. What is the decision and the metric? What must the state encode to be Markov? What
          outcome does the reward pay for? What is the floor and the ceiling? Can you learn it from samples? Is the
          tuning honest? What does the learned policy actually do? A method you can run on a problem you have never
          seen is the only kind worth keeping.
        </TransferBox>

        <PlaybookRule n={23}>
          <strong>Trust a method only after it solves a problem structurally unlike the one you built it on.</strong>{" "}
          The Playbook — frame, state, reward, discount, baselines, oracle, learn, tune, interpret — is
          domain-independent; when the same procedure recovers the known-optimal policy on a problem with no shared
          intuition, you have a skill, not a trick.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/transfer-near", label: <>← Transfer test I · A new warehouse</> }}
          next={{ href: "/learn/warehouse-robot-capstone/takeaways", label: <>Back to the verdict & playbook →</> }}
        />
      </div>
    </article>
  );
}

const codeBase = `# Trivial baselines for the floor, and value iteration for the ceiling.
V, PI = dp_solve()
rng = np.random.default_rng(0)
print("never order       : %7.3f  /day" % evaluate(lambda s: 0))
print("random order      : %7.3f  /day" % evaluate(lambda s: int(rng.integers(nA))))
print("order-up-to-8     : %7.3f  /day" % evaluate(lambda s: max(0, 8 - s)))
print("order-up-to-10    : %7.3f  /day" % evaluate(lambda s: max(0, 10 - s)))
print("oracle (DP)       : %7.3f  /day" % evaluate(lambda s: PI[s]))
print()
print("oracle policy is an (s, S) rule:")
print("  stock :", " ".join("%2d" % s for s in range(13)))
print("  order :", " ".join("%2d" % PI[s] for s in range(13)))`;

const codeLearn = `# The SAME Q-learning as the warehouse: sampled backup, annealed eps-greedy.
# Only difference: a continuing task, so we learn over one long stream of days.
def train(steps=200000, alpha=0.1, seed=0):
    env = Inventory(seed); Q = np.zeros((nS, nA)); s = env.reset("uniform")
    for t in range(steps):
        eps = 1.0 + (0.05 - 1.0) * (t / steps)               # anneal 1.0 -> 0.05
        a = eps_greedy(Q, s, eps, env.rng)
        s2, r, _ = env.step(a)
        Q[s, a] += alpha * (r + GAMMA * Q[s2].max() - Q[s, a])
        s = s2
    return Q

V, PI = dp_solve()
Q = train(seed=0)
learned = evaluate(lambda s: int(np.argmax(Q[s])))
oracle  = evaluate(lambda s: PI[s])
print("learned Q-learning: %.3f /day  (%.0f%% of the oracle's %.3f)"
      % (learned, 100 * learned / oracle, oracle))
print("learned order qty (stock 0..8):", " ".join("%2d" % int(np.argmax(Q[s])) for s in range(9)))
print("oracle  order qty (stock 0..8):", " ".join("%2d" % PI[s] for s in range(9)))`;
