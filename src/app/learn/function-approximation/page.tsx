import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { FA_DONE, FA_TOTAL } from "@/lib/functionApproximationTrack";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Staircase } from "@/components/figures/fa/Staircase";
import { WALK_STATES, WALK_MU, AGG_VS_TRUE } from "@/components/figures/fa/data";

export const metadata = {
  title: "Function approximation — Manifold",
  description:
    "The Learning track dropped the model but kept the table: one number per state. This track drops the table. When states are too many to enumerate — or continuous, so there are no cells at all — values must become a parameterised function shared across states. That buys generalisation and costs you the guarantees.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FunctionApproximationHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Reinforcement learning", color: GOLD },
          {
            label: FA_DONE >= FA_TOTAL ? `Complete · ${FA_TOTAL} pages` : `${FA_DONE} of ${FA_TOTAL} pages`,
            color: GOLD,
          },
        ]}
        time="the scaling turn"
        title={<>When you can&rsquo;t store a value <em>per state</em></>}
        intro={<>Three tracks have quietly shared one assumption, and it is not the one you think. Planning assumed
          a known model, and the <Link href="/learn/learning" style={link}>Learning</Link> track threw it away. But
          all three kept something else: <strong>a table</strong> — one cell per state, filled in by experience.
          This track throws <em>that</em> away, and in doing so turns reinforcement learning into something that can
          leave the gridworld.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The assumption we are dropping</h2>
        <p>
          Every method so far ends with an array. <M>{String.raw`V`}</M> is <code>nS</code> floats;{" "}
          <M>{String.raw`Q`}</M> is <code>nS × nA</code>. Learning means writing into cells, and each cell is
          learned <em>independently</em> — what you discover about state 41 tells you precisely nothing about
          state 42. On a 4×4 grid that is not a problem; it is barely even a choice.
        </p>
        <p>
          It stops working for two separate reasons, and it is worth keeping them apart because they have the same
          cure but different flavours.
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li>
            <strong>Too many states to enumerate.</strong> The{" "}
            <Link href="/learn/warehouse-robot-capstone/limits" style={link}>warehouse capstone</Link> ended on this
            exact cliff: adding four modest features to an 80-state robot took it to{" "}
            <strong>2,016,000</strong> states. Nothing about the problem got harder — the table just stopped fitting.
          </li>
          <li>
            <strong>No states to enumerate at all.</strong> This one is worse, and it is the one that ends the
            argument. When position and velocity are real numbers, there is no cell to write into, because there is
            no finite set of cells.
          </li>
        </ol>

        <h2>The second reason, demonstrated</h2>
        <p>
          Mountain Car is the classic example: an underpowered car in a valley, too weak to drive straight up, that
          must rock backwards to build momentum. Its state is a pair of floats — position and velocity. Let us drive
          it for a thousand steps and simply count how many <em>distinct</em> states it visits.
        </p>

        <CodeBlock setup={FA_SETUP} fromScratch={codeContinuous} />
        <CodeOutput>{`steps taken: 1000
distinct states visited: 1000
first three, in order: [(-0.546874, -0.000832), (-0.546532, 0.000343), (-0.545017, 0.001514)]

a table would need one cell per distinct state.
after 1000 steps it would hold 1000 cells, each written exactly once.`}</CodeOutput>

        <p>
          A thousand steps, a thousand different states, <strong>every cell written exactly once and never read
          again</strong> — and that is <em>after</em> rounding each coordinate to six decimals to give the table the
          best possible chance. This is not a storage problem you can solve with a bigger machine. A tabular agent here
          cannot learn anything at all, because learning a value means <em>revisiting</em> a state and averaging —
          and it never revisits anything.
        </p>

        <Callout color={GOLD} title={<>The one idea this track rests on</>}>
          Stop storing values and start <strong>computing</strong> them. Replace the array{" "}
          <M>{String.raw`V[s]`}</M> with a function <M>{String.raw`\hat v(s,\mathbf{w})`}</M> — a formula with
          parameters <M>{String.raw`\mathbf{w}`}</M>, where <M>{String.raw`\mathbf{w}`}</M> is far smaller than the
          number of states. Now the parameters are <em>shared</em>: an update after visiting one state moves the
          estimate for every state that resembles it. That sharing is called{" "}
          <strong>generalisation</strong>, and it is the entire point — it is also the entire price.
        </Callout>

        <Staircase
          x={WALK_STATES}
          lines={AGG_VS_TRUE}
          mu={WALK_MU}
          ylabel="vπ(s)"
          xlabel="state"
          caption={<>The track in one picture. A thousand states, a value for each — and ten
            parameters trying to stand in for all of them. The staircase is the best those ten can
            do, which is both remarkably good and permanently wrong, and the shaded strip underneath
            is the distribution that decides which of its errors matter. Every chapter here is about
            some part of this picture: what the approximation can represent, where the error is
            allowed to be, and what happens to the learning algorithm once the values are shared.</>}
        />

        <h2>What it costs</h2>
        <p>
          Generalisation is not free, and this track is largely about the bill. Three charges, each of which gets
          its own chapter.
        </p>
        <p>
          <strong>You can no longer be right everywhere.</strong> With a table, every state could hold its exact
          value simultaneously. With fewer parameters than states, improving one estimate can actively worsen
          another — so &ldquo;best&rdquo; needs a definition, and that definition has to say which states you care
          about being right in.
        </p>
        <p>
          <strong>You lose the convergence guarantees.</strong> This is the part that surprises people. Tabular
          TD and Q-learning come with proofs. Swap in a function approximator and those proofs do not merely get
          harder — they become <em>false</em>. There is a famous seven-state problem, with no rewards at all and a
          representation that can express the true answer exactly, on which standard TD blows up to infinity. We
          build it and watch it happen.
        </p>
        <p>
          <strong>You inherit every pathology of supervised learning</strong> — and some new ones. The targets you
          fit toward are computed from your own current estimates, so they move while you chase them.
        </p>

        <h2>Where this track goes</h2>
        <ol style={{ lineHeight: 1.7 }}>
          <li><strong>Why the table has to go</strong> — the objective, and what gradient descent on values even means.</li>
          <li><strong>Linear methods &amp; features</strong> — the case where everything still works, plus tile coding, the workhorse. State aggregation shows a table <em>is</em> function approximation, which makes the whole subject a generalisation rather than a replacement.</li>
          <li><strong>Control with approximation</strong> — semi-gradient SARSA, and Mountain Car actually solved.</li>
          <li><strong>The deadly triad</strong> — the three ingredients that, together, break convergence. This chapter is the intellectual heart of the track.</li>
          <li><strong>Deep Q-Networks</strong> — what happens when <M>{String.raw`\hat v(s,\mathbf{w})`}</M> is a neural network, and the two tricks that made it work.</li>
          <li><strong>Practice &amp; limits</strong> — reading learning curves honestly, and the wall that opens the policy-gradient track.</li>
        </ol>

        <Callout color={GOLD} title={<>&ldquo;So where is Deep RL?&rdquo;</>}>
          You are in it. <strong>Deep RL is not a separate subject</strong> — it is what this track becomes in its
          fifth chapter, once the function <M>{String.raw`\hat v(s,\mathbf{w})`}</M> happens to be a neural network.
          DQN is semi-gradient Q-learning with a nonlinear approximator plus two engineering fixes for problems you
          will have met by then. Teaching it before the deadly triad would mean handing you a box of patches with no
          explanation of what they patch.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/the-throughline", label: <>← Learning: the throughline</> }}
        />
      </div>
    </article>
  );
}

const codeContinuous = `mc = MountainCar(0)
s = mc.reset()

traj, seen = [], set()
for t in range(1000):
    s, r, done = mc.step(2 if t % 3 else 0)   # mostly accelerate, occasionally not
    cell = (round(float(s[0]), 6), round(float(s[1]), 6))   # round HARD, to be fair to the table
    traj.append(cell); seen.add(cell)
    if done: break

print("steps taken:", t + 1)
print("distinct states visited:", len(seen))
print("first three, in order:", traj[:3])
print()
print("a table would need one cell per distinct state.")
print(f"after {t + 1} steps it would hold {len(seen)} cells, each written exactly once.")`;
