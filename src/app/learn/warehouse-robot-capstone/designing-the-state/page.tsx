import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { DecisionPoint } from "@/components/DecisionPoint";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Designing the state — Manifold",
  description:
    "The single most consequential decision in an RL project. Drop one bit from the warehouse robot's state and a textbook-correct Q-learning agent delivers 0% of packages and scores −250. Put it back and the same code scores +21.63. State aliasing, and how to test for it.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DesigningTheState() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 1 · Frame it", color: "var(--c-metrics)" }]}
        time="about 11 minutes"
        title={<>Designing the state</>}
        intro={<>
          This is the page that decides whether the project succeeds. Not the algorithm, not the learning rate —
          the answer to one question about what the robot is allowed to know. Get it wrong and a flawless
          implementation of a proven algorithm will deliver, with total confidence, absolutely nothing.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={1} n={3}>
          If I froze the agent mid-task and showed it <em>only</em> what I am calling &ldquo;the state&rdquo;,
          would that be enough for it to choose correctly?
        </WorkOrder>

        <h2>The test, in general</h2>
        <p>
          A state is not &ldquo;everything the sensors report&rdquo;, and it is not &ldquo;where the agent
          is&rdquo;. It is <strong>whatever the agent must know in order to act optimally</strong> — no less, and
          preferably no more. The formal name for &ldquo;no less&rdquo; is the{" "}
          <Link href="/learn/markov-decision-processes/the-markov-property" style={link}>Markov property</Link>: the
          state must summarise the past well enough that history adds nothing.
        </p>
        <p>
          The practical test is a thought experiment you can run in thirty seconds, on any problem. Pick a
          situation. Imagine handing the agent your proposed state and nothing else. Ask: <em>is there exactly one
          right answer?</em> If two situations that demand <strong>different actions</strong> would look{" "}
          <strong>identical</strong> to the agent, your state is <strong>aliased</strong>, and no amount of
          training will fix it.
        </p>

        <h2>Running the test on the warehouse</h2>
        <p>
          The tempting state for a robot on a floor is the obvious one: its cell. Forty cells, forty numbers to
          learn. Clean, small, and — as we are about to see — fatal.
        </p>
        <p>
          Consider the doorway, cell (2,3). The robot is standing in it. Should it drive up or down? If it is{" "}
          <em>empty</em>, the shelf is below, so it should go <strong>down</strong>. If it is <em>carrying</em>,
          the dropoff is above, so it should go <strong>up</strong>. Same cell. Opposite answers. Let&rsquo;s ask
          the oracle — the planner that knows the true model — what it does at a few cells:
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeA} />
        <CodeOutput>{`cell (1,3):  empty -> down   carrying -> up
cell (2,3):  empty -> down   carrying -> up
cell (3,3):  empty -> down   carrying -> right
cell (0,4):  empty -> left   carrying -> right`}</CodeOutput>
        <p>
          Four cells, four disagreements — two of them exactly opposite. The optimal policy is a{" "}
          <em>different function</em> depending on the carrying bit. A table indexed by cell alone has one row per
          cell, and that row must hold a single action. It is being asked to be both <em>down</em> and{" "}
          <em>up</em> at once.
        </p>

        <DecisionPoint
          accent={OLIVE}
          question={<>Your state is the robot&rsquo;s cell. You have just realised the optimal action at some cells depends on whether it is carrying. What do you do?</>}
          options={[
            {
              label: "Add the carrying flag to the state — 40 cells × 2 = 80 states",
              verdict: "best",
              response: <>The direct fix, and the right one here. The extra bit is exactly the missing information: with it, every state has one correct answer again, and the table can represent the optimal policy. The cost is a doubled state space — cheap at this size, and the price of a problem that is actually solvable.</>,
            },
            {
              label: "Train longer and lower the learning rate so it settles on the best compromise",
              verdict: "miss",
              response: <>This is the trap, and it is the instinct almost everyone reaches for when an agent underperforms. But there is no compromise to find: no single action at the doorway is good for both situations. More episodes buy a more confident average of two contradictory demands. We will measure exactly how badly this fails.</>,
            },
            {
              label: "Give the robot a memory of the last few cells it visited instead",
              verdict: "close",
              response: <>Genuinely reasonable, and it is the standard move when the missing fact is not directly observable — a history window or a recurrent state can often recover what a single observation lost. Here it is heavier machinery than the problem needs: we <em>know</em> the missing bit and can just include it. Save this technique for when you cannot.</>,
            },
          ]}
        />

        <h2>Measuring the damage</h2>
        <p>
          Let&rsquo;s not argue about it — let&rsquo;s run it. The same Q-learning code, the same hyperparameters,
          the same number of episodes. The only difference is one line: whether the state index keeps the carrying
          bit or throws it away.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeB} />
        <CodeOutput>{`position + carrying      return    21.63   delivered 100.0%   steps  25.0
position ONLY (aliased)  return  -250.00   delivered   0.0%   steps 250.0`}</CodeOutput>
        <p>
          Read the second row carefully, because it is worse than &ldquo;bad performance&rdquo;. The aliased agent
          delivers <strong>zero</strong> packages — not few, none — in five hundred evaluation episodes. Every
          single episode runs to the 250-step cap. Its return of exactly <M>{String.raw`-250`}</M> is the
          signature of an agent that walks in a circle for the entire episode and never once completes the task.
        </p>
        <p>
          And the first row is not a marginal improvement. It is <strong>+21.63</strong>, with 100% delivery in
          25 steps — that is essentially the oracle&rsquo;s <strong>+21.00</strong>. The identical algorithm, given
          one extra bit, goes from total failure to optimal.
        </p>

        <Callout color={OLIVE} title={<>Why this is impossibility, not difficulty</>}>
          The aliased agent is not undertrained or unlucky. Consider what its table is being asked to do at the
          doorway. Half the visits arrive empty, where <em>down</em> eventually leads to <M>{String.raw`+50`}</M>;
          half arrive carrying, where <em>up</em> does. Q-learning faithfully averages the returns it observes for
          each action, and settles on whichever is marginally better <em>on average across both situations</em> —
          then executes that one action every time. So half the time it drives away from its goal. It ends up
          shuttling between two cells forever.
          <br /><br />
          <strong>No learning rate, no exploration schedule, and no number of episodes can repair this</strong>,
          because the optimal policy is not representable in the space you gave it. The failure is in the state,
          and the state is the one thing the algorithm cannot fix for you.
        </Callout>

        <h2>What this looks like in the wild</h2>
        <p>
          The warehouse makes aliasing obvious because we built it that way. In real problems it hides:
        </p>
        <ul>
          <li>A trading agent that sees prices but not its own <strong>current position</strong> — buy and sell look identical from the same chart.</li>
          <li>A game agent that sees one frame and so cannot tell <strong>which way anything is moving</strong> (the reason deep-RL agents stack frames).</li>
          <li>A dialogue agent that sees the last message but not <strong>what it already asked</strong>.</li>
          <li>A robot that knows where it is but not <strong>which subtask it is on</strong> — precisely our case.</li>
        </ul>
        <p>
          The tell is behavioural and consistent: the agent <strong>oscillates or stalls</strong>, its learning
          curve flattens far below what you expected, and the failures cluster in exactly the situations where the
          hidden fact would have mattered. When a formally-correct RL problem has states that look the same but
          demand different actions, it is technically a <strong>POMDP</strong> — partially observable — and the fix
          is to restore the missing information, either directly (as here) or through memory.
        </p>

        <TransferBox>
          Before you tune anything, run the freeze test on your own problem: name two situations that require
          different actions, and check whether your state distinguishes them. If your agent is stalling or
          oscillating, suspect aliasing <em>before</em> you touch the learning rate — and remember the diagnostic
          we used here: train once on the reduced state and once on the fuller one, and let the gap tell you.
        </TransferBox>

        <PlaybookRule n={3}>
          <strong>Design the state by asking what the agent must know to act optimally</strong>, then test for
          aliasing: if two situations needing different actions look identical, no algorithm can succeed. Fix the
          representation, not the hyperparameters.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/from-task-to-mdp", label: <>← From a task to an MDP</> }}
          next={{ href: "/learn/warehouse-robot-capstone/designing-the-reward", label: <>Next up · Designing the reward →</> }}
        />
      </div>
    </article>
  );
}

const codeA = `# Ask the ORACLE (it knows the model) what it does at the same cell,
# once while empty and once while carrying.
V, PI = dp_solve()
for (r, c) in [(1, 3), (2, 3), (3, 3), (0, 4)]:
    print(f"cell ({r},{c}):  empty -> {ACTIONS[PI[sid(r,c,0)]]:<5s}  carrying -> {ACTIONS[PI[sid(r,c,1)]]}")`;

const codeB = `def train(aliased=False, episodes=3000, alpha=0.1, eps=0.1, seed=0):
    e = Warehouse(seed)
    n   = nS // 2 if aliased else nS       # aliased: forget the carrying bit
    enc = (lambda s: s // 2) if aliased else (lambda s: s)
    Q = np.zeros((n, nA))
    for ep in range(episodes):
        s = e.reset("uniform"); x = enc(s)
        a = eps_greedy(Q, x, eps, e.rng)
        for t in range(250):
            s2, r, done = e.step(a); y = enc(s2)
            if done:
                Q[x, a] += alpha * (r - Q[x, a]); break
            a2 = eps_greedy(Q, y, eps, e.rng)
            Q[x, a] += alpha * (r + GAMMA * Q[y].max() - Q[x, a])
            s, x, a = s2, y, a2
    return Q, enc

for aliased in (False, True):
    Q, enc = train(aliased)
    res = evaluate(lambda s: int(np.argmax(Q[enc(s)])), n=500, seed=7)
    label = "position ONLY (aliased)" if aliased else "position + carrying"
    print(f"{label:<24} return {res['ret']:8.2f}   delivered {res['delivered']*100:5.1f}%   steps {res['steps']:5.1f}")`;
