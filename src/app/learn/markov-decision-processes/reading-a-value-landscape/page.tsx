import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ValueLandscapeLab } from "@/components/labs/ValueLandscapeLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Reading a value landscape — Manifold",
  description:
    "A value function is a map you can read at a glance: high ground near reward, valleys far from it, and a policy that is just 'walk uphill'. How to extract the greedy arrows and read structure off the numbers.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ReadingAValueLandscape() {
  const code = `import numpy as np
gamma = 1.0
V = np.zeros(nS)                                   # solve for V* (best-action backup)
for _ in range(200):
    V = np.where(np.isin(np.arange(nS), TERMINALS), 0.0, (R + gamma * (P @ V)).max(axis=1))

# the policy is just the greedy arrow at each cell -- "walk uphill on V"
greedy = (R + gamma * (P @ V)).argmax(axis=1)
arrows = np.array([ARROWS[a] for a in greedy], dtype=object)
arrows[TERMINALS] = "G"
print("V*:"); show(V)
print("greedy policy (walk uphill):"); show(arrows)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 7 minutes"
        title={<>Reading a value landscape</>}
        intro={<>Once you can compute a value function, you can <em>read</em> it — and a good value function is
          astonishingly legible. It is a topographic map of the task: high ground where reward is near, valleys
          where it is far, and a best policy that amounts to nothing more than &ldquo;always step uphill.&rdquo;
          Learning to see a value function this way makes the rest of RL far more intuitive.</>}
      />

      <div className="lesson">
        <h2>The value function is a map</h2>
        <p>
          Picture <M>{String.raw`V`}</M> as terrain: each state&rsquo;s value is its <em>elevation</em>. Near a
          source of reward the ground is high; far from it, the ground sinks into valleys. The shape isn&rsquo;t
          arbitrary — it encodes the structure of the whole problem. Where the landscape is steep, a single step
          changes your prospects a lot; where it is flat, nearby states are interchangeable. You can often
          diagnose a task just by looking at its value surface, before running a single episode.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="If a value function is a landscape and the optimal policy is 'walk uphill', what mathematical object is the policy?"
          options={[
            "The height of the landscape",
            "The direction of steepest ascent — the arrow pointing to the highest-valued reachable neighbour",
            "The average height of all cells",
          ]}
          nudge="Locked in. Think of the arrows the lab draws on each cell."
        />

        <LabFrame
          accent={GOLD}
          tryThis={<>On <strong>Optimal policy</strong>, trace a path from any far corner: at each cell, follow
            the arrow and confirm you always move to a <em>higher</em> (less negative) value, straight to a goal.
            Now switch to <strong>Random policy</strong> — the elevations plunge (an aimless walk is costly) but
            the arrows still point uphill toward the goals. Drag <M>{String.raw`\gamma`}</M> and watch the whole
            surface tilt.</>}
          insight={<>The policy is the <em>gradient</em> of the value landscape — at every cell it points to the
            best-valued neighbour. &ldquo;Solve for value, then act greedily&rdquo; is literally &ldquo;map the
            terrain, then always climb.&rdquo; The colours (value) and the arrows (policy) are the same
            information shown two ways.</>}
        >
          <ValueLandscapeLab />
        </LabFrame>

        <h2>Extracting the policy from the map</h2>
        <p>
          Turning the landscape into arrows is one line: at each cell, take the action whose one-step lookahead
          climbs highest. Here is <M>{String.raw`V^*`}</M> and the greedy policy it implies, printed side by side:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`V*:
  0.00   -1.00   -2.00   -3.00
 -1.00   -2.00   -3.00   -2.00
 -2.00   -3.00   -2.00   -1.00
 -3.00   -2.00   -1.00    0.00
greedy policy (walk uphill):
   G     ←     ←     ↓
   ↑     ↑     ↑     ↓
   ↑     ↑     →     ↓
   ↑     →     →     G`}</CodeOutput>
        <p>
          Read any cell and its arrow together: cell (0,3) in the top-right has value −3 and points{" "}
          <M>{String.raw`\downarrow`}</M> toward the bottom-right goal — the nearer of the two corners. Every
          arrow flows toward whichever goal is closest, and every step it recommends moves to a higher value.
          The map and the plan are the same drawing.
        </p>

        <Callout color={GOLD} title={<>Why practitioners visualise value first</>}>
          When an RL agent misbehaves, the value landscape is the first thing to plot. A valley where you
          expected a peak means the reward is mis-specified or a path is blocked; arrows that circle instead of
          flowing to the goal reveal a bug in the dynamics or a state that isn&rsquo;t Markov. The landscape turns
          an abstract policy into a picture you can debug — which is exactly why every lab in this track draws
          one.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/iterative-policy-evaluation", label: <>← Iterative policy evaluation</> }}
          next={{ href: "/learn/markov-decision-processes/convergence-rate", label: <>Next · How fast it converges →</> }}
        />
      </div>
    </article>
  );
}
