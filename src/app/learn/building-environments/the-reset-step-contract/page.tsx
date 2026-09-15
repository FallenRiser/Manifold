import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { EnvLoopFigure } from "@/components/sail/EnvLoopFigure";
import { StepConsoleLab } from "@/components/sail/StepConsoleLab";

export const metadata = {
  title: "The reset/step contract — Manifold",
  description:
    "Two methods are the entire boundary between an agent and its world: reset(seed) returns (obs, info) and step(action) returns (obs, reward, terminated, truncated, info). Why each piece exists, and a five-promise checker that catches a one-line seeding bug.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ResetStepContract() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 12 minutes"
        title={<>The reset/step contract</>}
        intro={<>An environment can be anything — a boat, a forest fire, a boss fight — but from the agent&rsquo;s side
          it is only ever two methods. Get their shape right and everything else in this track plugs in. Get it
          subtly wrong and every number you measure afterwards is quietly unrepeatable. This page goes through the
          shape one piece at a time, says why each piece is there, and ends with a test you can run on any world
          you ever write.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>One loop, two sides</h2>
        <p>
          Here is the loop from the previous page, stripped to its bones. Read it slowly, because every environment
          in the track is driven by exactly this:
        </p>
        <pre style={pre}>{`obs, info = env.reset(seed=3)                  # a fresh race begins
while True:
    action = helm(obs)                          # the agent decides
    obs, reward, terminated, truncated, info = env.step(action)   # the world answers
    if terminated or truncated:                 # the race is over
        break`}</pre>
        <p>
          The line down the middle of that loop is the most important design decision in RL, and it is worth saying
          out loud who owns what:
        </p>

        <EnvLoopFigure />

        <p>
          <strong>Why split it this way?</strong> Two payoffs. The same agent code can be dropped into any world —
          the Q-learning you will run on the boat is the Q-learning from the{" "}
          <Link href="/learn/learning/q-learning" style={link}>Learning track</Link>, unchanged. And the world can be
          tested <em>without an agent at all</em>, which is how you find out whether a failure is the learner&rsquo;s
          fault or yours. The rest of this page is the fine print of that boundary.
        </p>

        <h2><code>reset(seed)</code> — where every episode begins</h2>
        <p>Here is the sailboat&rsquo;s version, in full:</p>
        <pre style={pre}>{`def reset(self, seed=None):
    if seed is not None: self.rng = np.random.default_rng(seed)
    self.x = 0.0; self.y = 0.0
    self.h = float(self.rng.uniform(-180, 180))   # heading, 0 = straight into the wind
    self.u = 0.0; self.t = 0; self.tacks = 0
    return (self.x, self.y, self.h, self.u), {}`}</pre>
        <p>Three decisions are packed into those six lines.</p>
        <p>
          <strong>It puts every piece of state back.</strong> Position, heading, speed, the clock, even the tack
          counter. Anything you forget to reset leaks from one episode into the next — a boat that starts its second
          race still moving at the speed it finished the first. That bug does not crash; it just makes episode 2
          easier than episode 1, and you will read it as learning.
        </p>
        <p>
          <strong>It takes the seed as an argument, and uses a generator it owns.</strong> Older environments on this
          site did not: the{" "}
          <Link href="/learn/function-approximation/semi-gradient-sarsa" style={link}>Mountain Car</Link> of the last
          track had a separate <code>seed()</code> method. Gymnasium moved seeding into <code>reset</code> in its
          0.26 release, so that &ldquo;start a reproducible episode&rdquo; is a single call that cannot be half-done.
          The line <code>self.rng = np.random.default_rng(seed)</code> gives each environment its <em>own</em>{" "}
          random stream. You are about to see what happens when one line forgets that.
        </p>
        <p>
          <strong>The starting heading is random.</strong> This one is a decision about the <em>task</em>, not the
          code. If every race started pointing the same way, an agent could memorise one sequence of turns and
          never learn to sail. A random heading forces it to learn what to do from any direction, and it lets us
          test on starts it never trained on — every evaluation in this track uses seeds from one million upward,
          which training never touches.
        </p>

        <h2><code>step(action)</code> — five things come back</h2>
        <p>
          Each of the five return values exists because leaving it out caused real problems somewhere. In order:
        </p>
        <p>
          <strong><code>obs</code> — what the agent is allowed to see.</strong> Not necessarily the whole state. The
          boat returns its raw position, heading and speed; later we will decide what the <em>agent</em> should
          actually look at, and that decision turns out to matter more than the choice of algorithm. The
          distinction is not pedantry: in the last track, hiding two velocities from CartPole cut the same
          DQN&rsquo;s score from 358.6 to{" "}
          <Link href="/learn/function-approximation/what-approximation-cant-do" style={link}>35.6</Link>.
        </p>
        <p>
          <strong><code>reward</code> — one number for this step.</strong> The boat accepts three different reward
          rules as a constructor argument, because choosing between them is a chapter of its own. As a spoiler: the
          rule most people write first teaches the boat far less than you would expect.
        </p>
        <p>
          <strong><code>terminated</code> and <code>truncated</code> — two different ways to stop.</strong>{" "}
          <em>Terminated</em> means the task itself has ended: the boat rounded the mark, or was disqualified for
          leaving the course, and there is nothing more to earn. <em>Truncated</em> means we stopped watching for a
          reason outside the task — the race clock ran out, but the boat was still out there, still able to finish.
          Older environments returned a single <code>done</code> flag, and Gymnasium split it in two in the same 0.26
          release. The next page is entirely about why, because the difference changes what the agent learns.
        </p>
        <p>
          <strong><code>info</code> — notes for you, not the agent.</strong> The boat reports whether it arrived or
          left the course. A training loop never feeds <code>info</code> to the policy; it is for your logs, your
          tests and your evaluation. Keeping diagnostics out of <code>obs</code> is how you avoid accidentally
          letting the agent see something it could not know in the real task.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Be the training loop. Press <code>reset(seed)</code>, then step a few times by hand, then let the expert
            finish and read the last line. Afterwards, try stepping once more.</>}
          insight={<>Every step returns the same five things. Only the last one of a race flips a flag, and exactly one of the
            two. Rounding the mark or leaving the course sets <code>terminated</code>; a stalled boat reaching 200 s sets{" "}
            <code>truncated</code>. The same seed always gives the same start, which is promise 4 below. Stepping after the
            end is refused here; a real environment might not refuse, which is why the loop has to check.</>}
        >
          <StepConsoleLab />
        </LabFrame>

        <Callout color={GOLD} title={<>Decision record: leaving the course is <em>terminated</em>, not truncated</>}>
          Gymnasium&rsquo;s own documentation allows either reading: truncation is typically a time limit, but it notes
          it can also mark an agent going out of bounds. So this was a choice, and the reasoning is about the race,
          not the code. In sailing, a boat that leaves the course area is out of the race — there is no version of
          the future in which it goes on to win. That is a real end of the task, so it is <em>terminated</em>, and
          the learning update treats everything after it as worth zero. If instead the edge were just the edge of our
          simulation — the water carries on and the boat could come back — truncation would be the honest label.
          Same line of code, different world. Two pages from now you will see this choice interact with the reward
          in a way that teaches the boat to leave on purpose.
        </Callout>

        <h2>Five promises, checked</h2>
        <p>
          Everything above can be turned into a test. Any environment you write — in this track or anywhere — must
          keep five promises, and the checker below verifies each one without needing an agent. It runs them on the
          real <code>Sail</code>, then on <code>LeakySail</code>: a copy that is identical except for one line, which
          draws the starting heading from numpy&rsquo;s shared global generator instead of the boat&rsquo;s own.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>LeakySail still starts every race at a random heading, and it still accepts a seed. How many of
            the five promises does that one-line change break?</>}
          options={["None — it is still random", "Exactly one", "Three", "All five"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeChecker} />
        <CodeOutput>{`Sail
  1. reset() returns (obs, info)                 ok
  2. step() returns 5 well-typed values          ok
  3. every episode eventually ends               ok
  4. same seed + same actions = same episode     ok
  5. a different seed changes the start          ok

LeakySail
  1. reset() returns (obs, info)                 ok
  2. step() returns 5 well-typed values          ok
  3. every episode eventually ends               ok
  4. same seed + same actions = same episode     FAIL
  5. a different seed changes the start          ok`}</CodeOutput>

        <p>
          <strong>Exactly one — and it is the one that matters most.</strong> Walk through why. LeakySail&rsquo;s{" "}
          <code>reset</code> still calls the parent, which still seeds <code>self.rng</code>, so the seed goes
          somewhere. But the heading is then overwritten with a number from <code>np.random</code>, a generator the
          seed never touched. Every call gives a different start. Promise 5 still passes — different seeds do give
          different starts — so a quick look says &ldquo;it&rsquo;s random, it&rsquo;s fine.&rdquo;
        </p>
        <p>
          What broke is repeatability, and everything downstream depends on it. The evaluation that says the trained
          boat reaches the mark 175.8 times out of 200 (averaged over five training runs) means something only
          because those 200 races are the same 200 races every time you run it. With LeakySail, two runs of an identical experiment would disagree, and you
          could never tell a real improvement from a lucky draw.
        </p>
        <p>Here is what each promise protects, in one line each:</p>
        <ol style={{ lineHeight: 1.7 }}>
          <li><strong>reset returns (obs, info)</strong> — the training loop can unpack it without special cases.</li>
          <li><strong>step returns five well-typed values</strong> — and never says an episode ended both ways at once.</li>
          <li><strong>every episode ends</strong> — otherwise a stuck boat hangs your training forever. This is what the race clock is for.</li>
          <li><strong>same seed + same actions = same episode</strong> — results are repeatable, bugs are reproducible.</li>
          <li><strong>a different seed changes the start</strong> — the agent is tested on variety, not one memorised race.</li>
        </ol>

        <Callout color={GOLD} title={<>Run this on everything you build</>}>
          The checker is twenty lines and costs a second. We will run it again on the wildfire and the boss fight,
          and it is worth copying into any project with an environment in it. It will not tell you your world is
          <em> good</em> — whether the task is solvable, and whether the reward asks for what you want, need their
          own tests — but it tells you your world is <em>well-behaved</em>, and nothing else is worth checking until
          that is true.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments", label: <>← Every track handed you a world</> }}
          next={{ href: "/learn/building-environments/terminated-vs-truncated", label: <>Next · Terminated vs truncated →</> }}
        />
      </div>
    </article>
  );
}

const codeChecker = `def report(promise, kept):
    print(f"  {promise:46s} {'ok' if kept else 'FAIL'}")

def check_env(make_env, name, seed=0):
    "Five promises every environment must keep. Prints a report."
    print(name)
    env = make_env()
    out = env.reset(seed=seed)
    report("1. reset() returns (obs, info)", isinstance(out, tuple) and len(out) == 2)
    obs0 = out[0]

    rng = np.random.default_rng(1)           # the checker's own actions, fixed
    actions, seen, well_typed, ended = [], [], True, False
    for t in range(1000):
        a = int(rng.integers(env.nA)); actions.append(a)
        res = env.step(a)
        if len(res) != 5: well_typed = False; break
        o, r, terminated, truncated, info = res
        if not (isinstance(r, float) and isinstance(terminated, bool)
                and isinstance(truncated, bool) and isinstance(info, dict)):
            well_typed = False
        if terminated and truncated: well_typed = False   # an episode ends ONE way
        seen.append(o)
        if terminated or truncated: ended = True; break
    report("2. step() returns 5 well-typed values", well_typed)
    report("3. every episode eventually ends", ended)

    env2 = make_env(); o2, _ = env2.reset(seed=seed)
    same = np.allclose(obs0, o2) and all(np.allclose(env2.step(a)[0], o) for a, o in zip(actions, seen))
    report("4. same seed + same actions = same episode", same)

    env3 = make_env(); o3, _ = env3.reset(seed=seed + 1)
    report("5. a different seed changes the start", not np.allclose(obs0, o3))


class LeakySail(Sail):
    "Identical boat, one line different: the heading comes from numpy's GLOBAL generator."
    def reset(self, seed=None):
        obs, info = super().reset(seed)
        self.h = float(np.random.uniform(-180, 180))     # the bug
        return (self.x, self.y, self.h, self.u), info


check_env(Sail, "Sail")
print()
check_env(LeakySail, "LeakySail")`;

const pre: React.CSSProperties = {
  background: "var(--code-bg, color-mix(in srgb, var(--ink) 5%, transparent))",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 13,
  lineHeight: 1.55,
  overflowX: "auto",
  fontFamily: "ui-monospace, monospace",
};
const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
