import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "From a task to an MDP — Manifold",
  description:
    "The five questions that turn any fuzzy control task into a Markov Decision Process: what does the agent observe, what can it do, what does the world do back, what do we pay, and how far ahead do we care. Applied to a warehouse robot.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FromTaskToMdp() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 1 · Frame it", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>From a task to an MDP</>}
        intro={<>
          &ldquo;Teach the robot to deliver packages&rdquo; is not something you can run. Turning a sentence like
          that into a mathematical object with five named parts is the first real work of any RL project — and the
          part where most of the eventual outcome is decided.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={1} n={2}>
          What exactly does the agent <em>observe</em>, what can it <em>do</em>, what does the world <em>do back</em>,
          what are we <em>paying for</em>, and how far ahead do we <em>care</em>?
        </WorkOrder>

        <h2>The five questions</h2>
        <p>
          Every MDP is the same five-part tuple, <M>{String.raw`\langle \mathcal{S}, \mathcal{A}, P, R, \gamma \rangle`}</M>,
          and you build one by answering five questions in order. The order matters: each answer constrains the next.
        </p>
        <ol>
          <li><strong>What is a state?</strong> The information the agent gets to condition its decision on. This is the one that decides whether the problem is solvable at all — the next page is entirely about it.</li>
          <li><strong>What is an action?</strong> The set of choices, at the granularity the agent actually controls.</li>
          <li><strong>What does the world do?</strong> The dynamics <M>{String.raw`P(s' \mid s,a)`}</M> — including all the ways things go wrong.</li>
          <li><strong>What do we pay?</strong> The reward <M>R</M> — the <em>only</em> channel through which you express what you want.</li>
          <li><strong>How far ahead do we care?</strong> The discount <M>\gamma</M>.</li>
        </ol>

        <h2>Answering them for the warehouse</h2>
        <p>
          <strong>State.</strong> The robot&rsquo;s cell — a row and a column — plus one more thing: whether it is
          currently <em>carrying</em> the package. Forty cells × two carrying values = <strong>80 states</strong>.
          That extra bit will get a page of its own, because leaving it out breaks everything.
        </p>
        <p>
          <strong>Actions.</strong> Four: up, right, down, left. Note what we did <em>not</em> do — there is no
          &ldquo;pick up&rdquo; or &ldquo;drop&rdquo; action. Collection happens automatically on arriving at the
          shelf, and delivery on arriving at the dropoff. That is a modelling choice, and a defensible one: it keeps
          the action space small, at the cost of not being able to represent a robot that forgets to grab the box.
        </p>
        <p>
          <strong>Dynamics.</strong> The robot aims, and 90% of the time it goes where it aimed. The other 10% of
          the time a wheel slips and it goes perpendicular instead — 5% each way. Bump a wall and you stay put.
          Enter a spill and you pay <M>{String.raw`-30`}</M> and get towed back to the dock.
        </p>
        <p>
          <strong>Reward.</strong> <M>{String.raw`-1`}</M> per step, <M>{String.raw`-30`}</M> for a spill,{" "}
          <M>{String.raw`+50`}</M> for a delivery, which ends the episode. <strong>Discount.</strong>{" "}
          <M>{String.raw`\gamma = 0.97`}</M>. Both get their own page — they are decisions, not constants.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={code} />
        <CodeOutput>{`S : (row, col, carrying) -> 80 states
A : ['up', 'right', 'down', 'left']
gamma : 0.97

"right" from the dock, 1000 times — the robot never gets to READ these odds:
   -> cell (0, 1):  92.0%
   -> cell (1, 0):   4.1%
   -> cell (0, 0):   3.9%`}</CodeOutput>

        <h2>The part that makes it reinforcement learning</h2>
        <p>
          Look carefully at what that experiment did. We asked for the <em>same action</em> from the{" "}
          <em>same state</em> a thousand times, and got three different outcomes: mostly the intended cell, and
          occasionally a slip downward or a slip upward into the wall (where the robot simply stays put — which is
          why 3.9% of the time it does not move at all).
        </p>
        <p>
          Those percentages are <M>{String.raw`P(s' \mid s, a)`}</M>. They exist. They govern everything. And the
          robot <strong>cannot read them</strong> — it can only act and watch what happens. Had we handed it{" "}
          <M>P</M> and <M>R</M>, this would be a <Link href="/learn/planning" style={link}>planning</Link> problem,
          solvable exactly before the robot ever moved. Because we have not, it is a{" "}
          <Link href="/learn/learning" style={link}>learning</Link> problem, and every number it ever knows will be
          an average of samples.
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="We estimated those transition percentages with 1000 samples. Should we now hand that estimated table to the agent and let it plan?"
          options={[
            "Yes — an estimated model is nearly as good as the real one",
            "That's a legitimate approach (model-based RL), but it's a different project — and here the honest constraint is that the agent must learn from its own experience, not from a table we built for it",
            "No — estimated models are always useless",
          ]}
          nudge="Locked in. Building a model from samples and planning inside it is real and powerful — it's called model-based RL. We're deliberately not doing it, so that the methods you learned in the Learning track are the ones under test."
        />

        <Callout color={OLIVE} title={<>The modelling choices we just made, and what they cost</>}>
          Framing is not transcription — it is a series of decisions, each of which throws something away:
          <br /><br />
          <strong>No explicit pick-up action</strong> → smaller action space, but we cannot model a failed grab.
          <br />
          <strong>Spills do not end the episode</strong> → the robot can recover, so the task stays learnable; had
          a spill been terminal, most early episodes would end in two steps and teach almost nothing.
          <br />
          <strong>A 250-step cap</strong> → episodes cannot run forever, which is why a policy that never delivers
          scores exactly −250 rather than −∞. Convenient, but remember it is <em>our</em> cap, not the world&rsquo;s.
        </Callout>

        <TransferBox>
          On your next control problem, write the five answers down explicitly — in a comment at the top of the
          file if nowhere else. Then, for each one, write what it <em>excludes</em>. Most RL projects that fail
          quietly were mis-framed at exactly this step, and the framing is the cheapest thing to change.
        </TransferBox>

        <PlaybookRule n={2}>
          <strong>Turn the task into ⟨S, A, P, R, γ⟩ on paper first</strong>, and record what each choice throws
          away. The dynamics may exist without being readable — that gap is precisely what makes a problem
          &ldquo;reinforcement learning&rdquo; rather than planning.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone", label: <>← Overview &amp; the goal</> }}
          next={{ href: "/learn/warehouse-robot-capstone/designing-the-state", label: <>Next up · Designing the state →</> }}
        />
      </div>
    </article>
  );
}

const code = `print("S : (row, col, carrying) ->", nS, "states")
print("A :", ACTIONS)
print("gamma :", GAMMA)

# P and R are NOT readable — the robot can only sample them.
from collections import Counter
env.seed(2); c = Counter()
print()
print('"right" from the dock, 1000 times — the robot never gets to READ these odds:')
for _ in range(1000):
    env.reset()
    s2, r, done = env.step(1)              # 1 = "right"
    c[unpack(s2)[:2]] += 1
for cell, n in sorted(c.items(), key=lambda kv: -kv[1]):
    print(f"   -> cell {cell}: {n/10:5.1f}%")`;
