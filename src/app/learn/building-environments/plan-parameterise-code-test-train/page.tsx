import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { PipelineLab } from "@/components/sail/PipelineLab";

export const metadata = {
  title: "Plan, parameterise, code, test, train — Manifold",
  description:
    "The five-stage pipeline every world in this track goes through — and the honest build log of the sailboat: five prototypes, a first version that learned nothing (0 of 200), and the measurement that sent us back a stage each time.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const STAGES = [
  { n: "1", name: "Plan", out: "a spec card" },
  { n: "2", name: "Parameterise", out: "every constant, with a reason" },
  { n: "3", name: "Code", out: "reset and step" },
  { n: "4", name: "Test", out: "fails that should fail, a pass that must pass" },
  { n: "5", name: "Train", out: "an agent — and a verdict on the world" },
];

export default function Pipeline() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 12 minutes"
        title={<>Plan, parameterise, code, test, train</>}
        intro={<>Three worlds in this track, one way of building each. This page lays out the five stages, and then
          does something tutorials rarely do: shows the real build log of the sailboat you have been running, including
          the version that learned nothing at all, and the number that sent us back each time.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Five stages, and why they come in this order</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "1.2rem 0 0.6rem", alignItems: "stretch" }}>
          {STAGES.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 150px" }}>
              <div style={{
                flex: 1, border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 12px",
                background: "color-mix(in srgb, var(--c-rl) 7%, transparent)",
              }}>
                <div style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>stage {s.n}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)", fontSize: 16 }}>{s.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4 }}>{s.out}</div>
              </div>
              {i < STAGES.length - 1 && <span aria-hidden style={{ color: "var(--faint)" }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: "1.2rem" }}>
          The arrows are the order you <em>start</em> in. Stages 4 and 5 keep sending you back to 1 and 2 — the build log
          below shows exactly how often.
        </div>

        <p>
          <strong>Plan before parameterising</strong>, because a constant only means something once you know what it
          is for. &ldquo;Top speed 3 m/s&rdquo; is meaningless until you have decided the task is a race to a mark.{" "}
          <strong>Parameterise before coding</strong>, because writing <code>step</code> with made-up numbers
          scattered through it is how worlds end up impossible to reason about — every constant should live in one
          place with one sentence saying where it came from. <strong>Test before training</strong>, because an agent
          that fails cannot tell you <em>why</em> it failed, and a failure in the world looks exactly like a failure in
          the learner. And <strong>train last</strong>, but expect training to be a test too: it is the first time
          something tries hard to exploit every rule you wrote.
        </p>

        <h2>Stage 1&rsquo;s output: a spec card</h2>
        <p>
          Before any code, write the world down in plain sentences. For a reinforcement-learning environment the card
          has to answer the same handful of questions every time:
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li><strong>The task</strong> — one sentence, in the language of the domain, with no RL words in it.</li>
          <li><strong>What success means</strong> — the number you will actually report at the end.</li>
          <li><strong>What the agent sees</strong>, and what it deliberately does not.</li>
          <li><strong>What it can do</strong>, and how often it gets to decide.</li>
          <li><strong>What it is paid</strong> — and what behaviour that payment could accidentally reward.</li>
          <li><strong>How an episode ends</strong> — every ending, each labelled terminated or truncated, with the reason.</li>
          <li><strong>Where the randomness is</strong>, and how a seed controls it.</li>
          <li><strong>The tests</strong> — what should fail, what must succeed, and whether a ceiling can be computed.</li>
        </ol>
        <p>
          Here is the sailboat&rsquo;s card. It is not typed out by hand: the cell prints it from the constants the
          environment actually runs with, so the design document cannot quietly disagree with the code.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codeSpec} />
        <CodeOutput>{`THE TASK
  reach a mark 60 m directly upwind; round it within 10 m
THE BOAT
  top speed               3.0 m/s
  no-go zone              30 deg either side of the wind
  helm turn per step      10 deg
  speed response          30% of the gap to polar speed, per step
HOW IT ENDS
  terminated              rounded the mark, or left the 150 m race area
  truncated               200 steps on the clock
WHAT THE AGENT SEES AND DOES
  table                   5184 situations x 3 actions = 15552 values
THE CEILING (from physics, before any learning)
  best upwind angle       49.5 deg, making 1.565 m/s toward the wind
  fastest conceivable     32.0 s for 50 m of upwind progress`}</CodeOutput>

        <p>
          The last two lines are the most valuable on the card, and they come from physics, not from any agent. The
          boat&rsquo;s speed chart says the best angle to sail upwind is 49.5°, which gains 1.565 metres toward the wind
          every second. Even a boat that somehow sailed that angle perfectly from the first instant could not cover the
          50 metres of upwind progress in less than 32 seconds. The hand-written expert takes 48.3, because it has to
          accelerate from rest, turn onto its angle and tack once. So before training anything we know that a result
          under 32 seconds is a bug, and anything near 48 is excellent. Chapter 2 builds that speed chart line by line.
        </p>

        <h2>The honest build log</h2>
        <p>
          The numbers on the card look settled. They were not settled in advance. The sailboat you ran on the
          previous pages is the fifth version, and every earlier version was killed by a measurement. Here is the log,
          in order, with what each measurement did to the plan.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Step through versions 1 to 5 and follow the arrow each time.</>}
          insight={<>Three of the four loops went all the way back to planning, and none went back to the code. The fixes were
            about what the agent sees, where the course ends and what it is paid. The physics was right from version 1.</>}
        >
          <PipelineLab />
        </LabFrame>


        <p>
          Three things in that log are worth taking with you, because they will happen in every world you build.
        </p>
        <p>
          <strong>The first version failing completely was normal.</strong> Nothing was wrong with Q-learning, and
          nothing was wrong with the physics. The world was asking the agent to learn from a view in which success
          was nearly invisible. Almost every early failure in environment building is a planning failure — what the
          agent sees, what it is paid, when it stops — and almost none are coding errors.
        </p>
        <p>
          <strong>Each fix was chosen by a measurement, not a hunch.</strong> Version 3 is the clearest case. We
          expected the obvious reward, &ldquo;−1 per second until you arrive&rdquo;, to be fine; three training runs
          at 0–2 finishes said otherwise, and the chapter on reward will show you exactly why.
        </p>
        <p>
          <strong>Changing a parameter invalidates everything measured before it.</strong> Shrinking the course from
          100 m to 60 m was a budget decision, but it could have silently changed any of the earlier findings. So
          version 5 re-ran all of them. One did change size: the escape through a free edge was much stronger at 100
          m, where 183–196 of the last 200 practice races ended off the course, than at 60 m, where it was about half.
          The pages quote only the 60 m numbers.
        </p>

        <Callout color={GOLD} title={<>Decision record: why 60 metres and not 100</>}>
          This one was driven by a constraint, not by the task, so it deserves saying plainly. The goal was that
          every result about the sailboat can be reproduced by pressing Run on the page. At 100 m, a reliable agent
          needed about 3000 practice races — around ten seconds per run natively and far longer in the browser — to
          reach 178.6 ± 10.9 finishes out of 200. At 60 m with step size 0.5, 2000 races reached 175.8 ± 13.7: the
          same result within the spread between runs, in well under half the time. A sailor would call a 60 m beat short; the lessons do not
          depend on the distance, and they are all re-measured at this size. If you run the boat on your own
          machine, try 100 m — the{" "}
          <Link href="/learn/building-environments/terminated-vs-truncated" style={link}>clock</Link> and course
          constants are one-line changes.
        </Callout>

        <h2>What comes next</h2>
        <p>
          Chapter 2 walks through stages 1–3 for the boat in detail, writing the environment yourself one piece at a
          time: the task and its spec, the speed chart that makes tacking necessary, the <code>step</code> function,
          and the edge of the course. Chapter 3 is stages 4 and 5 — the tests, the observation, the agent, and the
          rewards that go wrong.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/terminated-vs-truncated", label: <>← Terminated vs truncated</> }}
          next={{ href: "/learn/building-environments/the-brief", label: <>Next · World 1: the brief →</> }}
        />
      </div>
    </article>
  );
}

const codeSpec = `# The spec card, printed FROM the code - so the design doc can never drift from what actually runs.
print("THE TASK")
print(f"  reach a mark {MARK_DIST:.0f} m directly upwind; round it within {ARRIVE:.0f} m")
print("THE BOAT")
print(f"  top speed               {V_MAX} m/s")
print(f"  no-go zone              {NO_GO:.0f} deg either side of the wind")
print(f"  helm turn per step      {TURN:.0f} deg")
print(f"  speed response          {INERTIA:.0%} of the gap to polar speed, per step")
print("HOW IT ENDS")
print(f"  terminated              rounded the mark, or left the {COURSE:.0f} m race area")
print(f"  truncated               {MAX_STEPS} steps on the clock")
print("WHAT THE AGENT SEES AND DOES")
print(f"  table                   {N_STATES} situations x {Sail.nA} actions = {N_STATES * Sail.nA} values")
print("THE CEILING (from physics, before any learning)")
print(f"  best upwind angle       {BEST_ANGLE:.1f} deg, making {BEST_VMG:.3f} m/s toward the wind")
print(f"  fastest conceivable     {(MARK_DIST - ARRIVE) / BEST_VMG:.1f} s for {MARK_DIST - ARRIVE:.0f} m of upwind progress")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
const tdStrong: React.CSSProperties = { ...td, color: "var(--ink)", fontWeight: 600, fontFamily: "ui-monospace, monospace" };
