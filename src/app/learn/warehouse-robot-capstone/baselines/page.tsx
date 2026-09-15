import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Baselines: the number to beat — Manifold",
  description:
    "Before any agent learns, two reference points: a random policy and a sensible hand-coded one. The hand-coded robot scores −3560 against random's −816 — four times worse — because a deterministic policy that is wrong somewhere is wrong there forever.",
};

const OLIVE = "var(--c-warehouse)";

export default function Baselines() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 2 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Baselines: the number to beat</>}
        intro={<>
          A learned agent&rsquo;s score means nothing on its own. Before we train anything we establish two
          reference points — the dumbest possible policy, and the policy a competent engineer would write by hand
          in five minutes. One of them fails in a way that is worth the whole page.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={2} n={8}>
          What score do I get for free, and what score does the obvious non-learning solution get? Until I know
          both, I cannot tell whether my agent has learned anything worth having.
        </WorkOrder>

        <h2>Why two baselines, not one</h2>
        <p>
          Every capstone on this site opens the modelling with a baseline, and the reasoning is the same in RL as
          in supervised learning: a number with nothing to compare it against is not a result. But RL wants{" "}
          <strong>two</strong> baselines, and they answer different questions.
        </p>
        <ul>
          <li>
            The <strong>random policy</strong> is the floor. It tells you what &ldquo;no information at all&rdquo;
            scores, and it calibrates the scale — if random gets −800 and your agent gets −40, you know that
            &minus;40 is a real achievement rather than a bad number.
          </li>
          <li>
            The <strong>hand-coded policy</strong> is the bar that matters commercially. Nobody deploys RL because
            it beats randomness; they deploy it because it beats the heuristic someone would otherwise write. If
            your agent cannot clear that, the honest recommendation is to ship the heuristic.
          </li>
        </ul>

        <h2>Random, and a sensible heuristic</h2>
        <p>
          The heuristic is the one anybody would write: <em>head for whatever you are currently after — fix the
          row first, then the column.</em> Straight down to the shelf, then straight along to the dropoff. It
          knows the layout, it never wanders, and it is obviously better than flailing.
        </p>

        <GuessSlider
          accent={OLIVE}
          prompt={<>The random policy scores about <strong>&minus;816</strong>. What does the sensible hand-coded
            policy score?</>}
          min={-4000}
          max={100}
          step={10}
          start={-200}
          actual={-3560}
          decimals={0}
          reveal={<>Not a typo, and not a bug: the hand-coded policy is <strong>more than four times worse than
            acting at random</strong>. Read the trace below and it becomes obvious — and then it becomes a rule.</>}
        />

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeBase} />
        <CodeOutput>{`policy       |    return   delivered   spills   steps
random       |   -815.79       0.7%    18.89   249.5
hand-coded   |  -3560.04       3.2%   110.50   246.5`}</CodeOutput>

        <h2>How a good idea scores &minus;3560</h2>
        <p>
          The heuristic&rsquo;s first move from the dock at (0,0) is <em>down</em>, because the shelf is at (4,0)
          and it fixes the row first. Two steps down is (2,0). Column 0 of row 2 is a spill. Here are its first
          twelve steps:
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeTrace} />
        <CodeOutput>{`  (0,0) down  -> (1,0)  reward   -1.0
  (1,0) down  -> (0,0)  reward  -31.0
  (0,0) down  -> (1,0)  reward   -1.0
  (1,0) down  -> (1,0)  reward   -1.0
  (1,0) down  -> (0,0)  reward  -31.0
  (0,0) down  -> (1,0)  reward   -1.0
  (1,0) down  -> (0,0)  reward  -31.0
  (0,0) down  -> (1,0)  reward   -1.0
  (1,0) down  -> (0,0)  reward  -31.0
  (0,0) down  -> (1,0)  reward   -1.0
  (1,0) down  -> (0,0)  reward  -31.0
  (0,0) down  -> (1,0)  reward   -1.0`}</CodeOutput>
        <p>
          It drives into the spill, is thrown back to the dock, and — being deterministic — makes exactly the same
          decision again. And again. It spills <strong>110 times per episode</strong>, roughly every other step,
          until the 250-step cap ends its misery. The 3.2% of episodes it does complete are the ones where a slip
          happened to shove it out of column 0 and it stumbled onto a viable route by accident.
        </p>

        <Callout color={OLIVE} title={<>The asymmetry that makes this general</>}>
          Why does randomness do so much better than a policy that is right nearly everywhere? Because{" "}
          <strong>a random policy&rsquo;s mistakes are uncorrelated in time and a deterministic policy&rsquo;s are
          not.</strong> The random robot blunders into a spill occasionally and then, next step, does something
          else. The heuristic makes one mistake and then commits to it for the entire episode, because nothing
          about its situation has changed — it is back at the dock, still empty-handed, still applying the same
          rule.
          <br /><br />
          This is why hand-written policies fail so hard and so silently in sequential problems. In supervised
          learning a rule that is wrong 5% of the time costs you 5%. In a control problem, a rule that is wrong in
          one <em>state you keep returning to</em> can cost you everything, and the size of the loss tells you
          nothing about the size of the flaw. The heuristic here is a single wrong turn away from being decent.
        </Callout>

        <h2>What this pins down</h2>
        <p>
          We now have the scale for every number in the rest of the capstone:
        </p>
        <ul>
          <li><strong>&minus;3560</strong> — a plausible hand-written policy, wrecked by one bad state.</li>
          <li><strong>&minus;816</strong> — pure randomness, and the floor for &ldquo;knows nothing&rdquo;.</li>
          <li><strong>&minus;250</strong> — the signature of a policy that never finishes but also never spills (Act 1&rsquo;s aliased agent).</li>
          <li><strong>0</strong> — worth naming: deliver nothing, but at least stop moving. Even this beats two of the three above.</li>
        </ul>
        <p>
          Anything positive means the robot is completing deliveries more often than it is destroying stock. In the
          next page we compute the other end of the range — the best score anyone could possibly achieve here — and
          then Act 3 finally lets an agent learn.
        </p>
        <p>
          One last note on honesty: it would have been easy to write a better heuristic. Route around the wall, and
          it would score respectably. We are not showing a straw man to flatter the learned agent — the heuristic
          above is genuinely what a reasonable person writes first, and the point is precisely that{" "}
          <em>you cannot tell by looking at it</em> that it fails. Its author would have shipped it. The baseline
          is what catches it, which is the entire argument for measuring baselines instead of trusting them.
        </p>

        <TransferBox>
          Always measure both baselines — random for scale, hand-coded for the commercial bar — and{" "}
          <em>run</em> the hand-coded one rather than estimating what it would do. In a sequential problem, a
          policy&rsquo;s worst state matters more than its average state, and only a simulation will tell you which
          state that is.
        </TransferBox>

        <PlaybookRule n={8}>
          <strong>Establish a random baseline and a hand-coded baseline before training</strong>, and remember that
          a deterministic policy repeats its mistakes forever — a heuristic can score far <em>worse</em> than
          random, and looking at the code will not tell you.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/what-success-means", label: <>← What counts as success?</> }}
          next={{ href: "/learn/warehouse-robot-capstone/the-oracle", label: <>Next up · The oracle: knowing your ceiling →</> }}
        />
      </div>
    </article>
  );
}

const codeBase = `rng = np.random.default_rng(0)
rand = evaluate(lambda s: int(rng.integers(nA)), n=2000, seed=3)

def heuristic(s):
    """head for the target: fix the row first, then the column"""
    r, c, k = unpack(s)
    tr, tc = (DROP if k == 1 else PICK)
    if r != tr: return 2 if tr > r else 0      # down / up
    return 1 if tc > c else 3                  # right / left

heur = evaluate(heuristic, n=2000, seed=3)

print("policy       |    return   delivered   spills   steps")
for name, x in (("random", rand), ("hand-coded", heur)):
    print("%-12s | %9.2f %9.1f%% %8.2f %7.1f" % (name, x["ret"], x["delivered"]*100, x["spills"], x["steps"]))`;

const codeTrace = `def heuristic(s):
    r, c, k = unpack(s)
    tr, tc = (DROP if k == 1 else PICK)
    if r != tr: return 2 if tr > r else 0
    return 1 if tc > c else 3

env = Warehouse(4); s = env.reset()
for t in range(12):
    r, c, k = unpack(s)
    a = heuristic(s)
    s, rew, done = env.step(a)
    print("  (%d,%d) %-5s -> (%d,%d)  reward %6.1f" % (r, c, ACTIONS[a], unpack(s)[0], unpack(s)[1], rew))`;
