import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { RaceReplay } from "@/components/sail/RaceReplay";
import { NoGoFigure } from "@/components/sail/NoGoFigure";
import { BRIEF_RACES } from "@/components/sail/data/briefRaces";

export const metadata = {
  title: "The brief: reach an upwind mark — Manifold",
  description:
    "Stage 1 for the sailboat. Why sailing makes a good first world, what happens when you steer straight for the mark (0 finishes in 200 — the boat stalls head-to-wind), and every planning decision behind the spec, with the reasoning written down.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheBrief() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 13 minutes"
        title={<>The brief: reach an upwind mark</>}
        intro={<>This chapter builds the sailboat from nothing, and it starts where every environment should: with no
          code at all. Before a single constant, you need to know what the task is, why this task, and what you are
          going to measure. Every one of those is a decision, and every decision here comes with the reason it was
          made.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The task, in one sentence with no RL words in it</h2>
        <div style={brief}>
          Starting from rest at a random heading, sail to a mark 60 metres directly upwind as quickly as you can,
          without leaving the race area.
        </div>
        <p>
          That sentence is deliberately written the way a sailing coach would say it. No states, no rewards, no
          episodes. If you cannot describe your task without reinforcement-learning vocabulary, you have usually not
          decided what the task <em>is</em> yet — you have decided what the algorithm will do, which is backwards.
          Everything else on this page is a translation of that sentence into decisions.
        </p>

        <h2>Why this world, and not another</h2>
        <p>
          A first environment is a teaching instrument, so it has to earn its place. We held the sailboat to four
          requirements, and they are worth reusing when you pick your own:
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li>
            <strong>The obvious strategy must fail.</strong> If the thing anyone would try first already works, the
            agent has nothing to discover and you learn nothing about whether it can. We did prototype a simpler world
            first — a one-dimensional lunar lander — and its effects were real, but its best strategy was the obvious
            one: brake harder the closer you get. A hand-written rule doing exactly that landed 200 times out of 200.
          </li>
          <li>
            <strong>There must be a ceiling you can compute without an agent.</strong> Otherwise &ldquo;the agent
            got 70 seconds&rdquo; means nothing. For a boat, the physics of sailing gives the best possible upwind
            angle in closed form.
          </li>
          <li>
            <strong>Failures must be visible.</strong> You can picture a boat pointing into the wind with its sail
            flapping. That matters when you are debugging: a failure you can imagine is a failure you can diagnose.
          </li>
          <li>
            <strong>It must be small enough to train where you are reading.</strong> Every claim about this world
            has to be reproducible by pressing Run.
          </li>
        </ol>
        <p>
          Requirement 1 is the one that makes the sailboat interesting, so let us check it before going any further.
        </p>

        <h2>Try the obvious thing first</h2>
        <p>
          The mark is straight ahead into the wind. The most natural helm in the world is &ldquo;point at the
          mark and go&rdquo;. The environment already exists in this page&rsquo;s setup, so we can try that rule right
          now — it reads the bearing of the mark, and turns toward it whenever it is more than 5° off.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>A helm that always steers straight for the mark, which lies directly upwind. Out of 200 races from
            random starting headings, how many does it finish?</>}
          options={["Nearly all of them", "About half", "A few, when the start is lucky", "None"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codePoint} />
        <CodeOutput>{`start heading  -149.2 deg -> after 200 s:  56.6 m from the mark, heading  20.8, speed 0.00 m/s
start heading   159.5 deg -> after 200 s:  58.7 m from the mark, heading -20.5, speed 0.00 m/s
start heading   109.8 deg -> after 200 s:  51.4 m from the mark, heading -10.2, speed 0.00 m/s

over 200 starts: 0 rounded the mark`}</CodeOutput>

        <RaceReplay id="brief" races={BRIEF_RACES} title="The three races above, drawn: point at the mark and go" />

        <p>
          <strong>None.</strong> Play the replay and watch the status column, because it shows exactly how it fails. Each boat
          turns toward the mark, and on the way it crosses some angles where the sail does work, so it moves a few
          metres — that is why it ends 51 to 59 metres away rather than 60. Then it arrives at a heading within 30° of
          the wind, and the sail stops producing any drive at all. Speed bleeds away to zero. The helm keeps making
          small corrections around the mark&rsquo;s bearing — you can see it finished at 20.8°, −20.5° and −10.2° —
          but every one of those headings is inside the dead zone, so nothing it does can get it moving again. Sailors
          call this being <strong>in irons</strong>. After 200 seconds the clock truncates the race.
        </p>
        <p>
          So requirement 1 holds, and emphatically. The only way to the mark is to sail <em>away</em> from pointing
          at it, at an angle, and cross back — tacking — and nothing in the environment tells the agent that.
        </p>

        <NoGoFigure />

        <h2>Answering the spec, one decision at a time</h2>
        <p>
          The <Link href="/learn/building-environments/plan-parameterise-code-test-train" style={link}>spec card</Link>{" "}
          asks the same questions of every world. Here are the sailboat&rsquo;s answers, each with the reasoning and,
          where it exists, the alternative we did not take.
        </p>

        <h3 style={h3}>What success means</h3>
        <p>
          <strong>Decision: finishes out of 200 held-out races, and the mean finishing time of the boats that
          finish.</strong> Two numbers, in that order of importance. A single &ldquo;average time&rdquo; would be
          undefined for races that never finish, and replacing those with the clock limit would let one number blur
          &ldquo;slow&rdquo; with &ldquo;never arrived&rdquo;. The 200 races use start seeds from one million upward,
          which training never sees, so the score measures sailing rather than memory. Deciding this now, before
          any agent exists, is what stops you from choosing whichever metric happens to look good later.
        </p>

        <h3 style={h3}>What the boat can do</h3>
        <p>
          <strong>Decision: three actions — bear left, hold, bear right — turning the helm 10° per second.</strong>{" "}
          The alternative was to let the agent pick a heading outright, say one of 36 directions, each step. That
          would be simpler to learn in one sense, but it would break the physics that makes the task interesting: a
          boat could jump from 50° on one side of the wind to 50° on the other in a single step, and a tack would
          cost nothing. Real boats have to swing their bow through the dead zone and lose speed doing it, and that
          cost is exactly what forces a sailor to tack rarely and at the right moment. Turning gradually keeps that
          cost in the world. It also keeps the action set tiny, which matters for a table-based learner. We did not
          run the absolute-heading version, so this is a decision from the physics rather than from a measurement.
        </p>

        <h3 style={h3}>How often it decides</h3>
        <p>
          <strong>Decision: once per second.</strong> A tack from 50° on one side to 50° on the other is a 100° turn,
          so it takes about ten decisions — enough that the agent has to commit to a tack and live through it, few
          enough that a whole race is a couple of hundred decisions rather than thousands. Deciding every tenth of a
          second would multiply every episode by ten without adding anything a sailor would recognise.
        </p>

        <h3 style={h3}>What it sees</h3>
        <p>
          <strong>Decision, for now: the environment reports everything — position, heading, speed.</strong> What
          the <em>agent</em> should look at is a separate question, and it is the one the first version of this world
          got wrong: a table indexed by raw position finished 0 races in 200. Chapter 3 is where that choice gets
          made, with measurements. Keeping the environment&rsquo;s output complete and letting the agent choose its
          own view means the world does not have to change when the agent does.
        </p>

        <h3 style={h3}>Where the randomness is</h3>
        <p>
          <strong>Decision: only the starting heading is random; the wind blows steadily from one direction.</strong>{" "}
          Real wind shifts, and sailors exploit the shifts. We left that out on purpose. A steady wind keeps the best
          upwind angle an exact number we can compute, so every gap between the agent and the ceiling belongs to the
          agent. It also means that when something fails, there is one source of randomness to suspect, not two.
          Wind shifts are the first extension worth adding once this world is trusted — and the checker from the{" "}
          <Link href="/learn/building-environments/the-reset-step-contract" style={link}>contract page</Link> will
          tell you whether you seeded them properly.
        </p>

        <h3 style={h3}>How a race ends</h3>
        <p>
          <strong>Decision: rounding the mark (terminated), leaving the race area (terminated), or 200 seconds on
          the clock (truncated).</strong> Each label was argued on the{" "}
          <Link href="/learn/building-environments/terminated-vs-truncated" style={link}>previous chapter&rsquo;s page</Link>:
          leaving the area is a disqualification, so the race is genuinely over; the clock is a safety net, four times
          longer than the expert needs, so it is not a rule of the race.
        </p>

        <h3 style={h3}>What it is paid</h3>
        <p>
          <strong>Decision: deferred — on purpose.</strong> The environment will accept three reward rules as a
          setting: a cost for every second, payment for distance gained toward the mark, and payment for raw speed.
          Choosing between them without measuring would be guessing, and the build log already told you that the
          first guess was wrong. Chapter 3 trains a boat on each and lets the results decide.
        </p>

        <Callout color={GOLD} title={<>The decisions you defer are decisions too</>}>
          Two of the answers above are &ldquo;not yet&rdquo;: what the agent sees, and what it is paid. That is not
          vagueness. It is recognising which choices can be argued from the task alone — how a race ends, how fast a
          helm turns — and which can only be settled by trying them. Write down which is which. The worst environment
          bugs come from a choice that should have been measured being made by intuition and then forgotten.
        </Callout>

        <h2>What the next page builds</h2>
        <p>
          You now have the sentence, the reasons, and one hard fact: steering at the mark stalls in irons every
          time. The next page turns the most important physical fact about sailing — how fast a boat goes at each
          angle to the wind — into a function you write yourself, and uses it to compute the ceiling before any agent
          exists.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/plan-parameterise-code-test-train", label: <>← Plan, parameterise, code, test, train</> }}
          next={{ href: "/learn/building-environments/parameterising-a-boat", label: <>Next · Parameterising a boat →</> }}
        />
      </div>
    </article>
  );
}

const codePoint = `def point_at_mark(env):
    "The obvious helm: always steer straight for the mark."
    def helm(o):
        x, y, h, u = o
        want = math.degrees(math.atan2(env.mx - x, env.my - y))   # bearing of the mark
        err = wrap(want - h)
        return 1 if abs(err) < 5 else (2 if err > 0 else 0)
    return helm

env = Sail()
helm = point_at_mark(env)
for seed in (3, 4, 5):
    o, _ = env.reset(seed=seed)
    start = env.h
    while True:
        o, r, terminated, truncated, info = env.step(helm(o))
        if terminated or truncated: break
    dist = math.hypot(env.mx - env.x, env.my - env.y)
    print(f"start heading {start:7.1f} deg -> after {env.t:3d} s: {dist:5.1f} m from the mark, "
          f"heading {env.h:5.1f}, speed {env.u:.2f} m/s")

print()
print("over 200 starts:", race(point_at_mark)["arrived"], "rounded the mark")`;

const brief: React.CSSProperties = {
  borderLeft: "3px solid var(--c-rl)",
  background: "color-mix(in srgb, var(--c-rl) 7%, transparent)",
  padding: "14px 18px",
  borderRadius: "0 8px 8px 0",
  fontFamily: "var(--font-display)",
  fontSize: 19,
  lineHeight: 1.45,
  color: "var(--ink)",
  margin: "1rem 0 1.2rem",
};
const h3: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 19, marginTop: "1.6rem", color: "var(--ink)" };
