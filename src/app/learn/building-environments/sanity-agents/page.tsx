import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { RaceReplay } from "@/components/sail/RaceReplay";
import { SANITY_RACES } from "@/components/sail/data/sanityRaces";

export const metadata = {
  title: "Sanity agents, and a sailor who can't lose — Manifold",
  description:
    "Stage 4 for the sailboat: before any learning, race four hand-written helms on 200 held-out starts. Random finishes 4, holding course 0, steering at the mark 0, the expert 200 in 48.3 s — and each row is a prediction that would have exposed a specific bug had it come out differently.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SanityAgents() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 12 minutes"
        title={<>Sanity agents, and a sailor who can&rsquo;t lose</>}
        intro={<>The contract checker proved the boat is <em>well-behaved</em>. It said nothing about whether the world is{" "}
          <em>right</em> — whether the task is too easy, impossible, or subtly broken. You can find most of that out
          before any agent learns anything, with helms simple enough that you can predict exactly what they should
          do. This page races four of them and reads the results as tests.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Why test with agents that cannot learn</h2>
        <p>
          When a learning agent fails, there are two suspects: the learner and the world. When a hand-written helm
          fails, there is only one — because you know exactly what the helm does, any surprise is the
          world&rsquo;s. So stage 4 starts with a <strong>ladder</strong> of helms, from ones that should do terribly
          to one that should do perfectly, and a prediction for each written down <em>before</em> running them.
          A result that matches its prediction is weak evidence the world is right. A result that does not is strong
          evidence something is wrong, and it usually tells you what.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>A helm that picks bear left, hold or bear right uniformly at random every second. Out of 200 races, how many
            does it finish?</>}
          options={["None — the task is too hard for luck", "A handful", "Around a quarter", "About half"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeLadder} />
        <CodeOutput>{`helm                rounded  left  ran out  mean time  tacks
random helm               4   181       15     88.0 s   1.99
hold the tiller           0   160       40          -   0.00
point at the mark         0     0      200          -   0.82
the expert              200     0        0     48.3 s   1.00`}</CodeOutput>

        <RaceReplay id="sanity" races={SANITY_RACES}
          title="One of those 200: all four helms on held-out race 0" />
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.6rem" }}>
          A single race, not a summary: here the random helm happens to wander until the clock runs out rather than leave, which
          it does in 181 of the 200. The table above is the evidence; the replay shows what each row looks like on the water.
        </p>

        <p>Now read each row as the test it is.</p>

        <h3 style={h3}>Random helm — 4 finishes, 181 exits</h3>
        <p>
          <strong>The prediction:</strong> luck should almost never reach a mark that requires tacking, and a boat
          weaving at random should eventually drift out of the race area. <strong>What came back:</strong> 4 finishes
          and 181 exits. Both halves matter. Four in two hundred says the task is not solvable by chance, so a
          trained agent that finishes will have learned something. And 181 exits is the first evidence that the edge
          of the course actually works — a random walk that never crossed it would have meant the edge check was
          broken or the course was far too large.
        </p>

        <h3 style={h3}>Hold the tiller — 0 finishes, 160 exits, 40 out of time</h3>
        <p>
          <strong>The prediction:</strong> a boat that holds its random starting heading sails in a straight line,
          so it should either leave the course or, if it starts pointing into the dead zone, sit still until the clock
          runs out. It should never reach a mark that lies straight upwind. <strong>What came back:</strong> exactly
          that shape — and the 40 races that ran out of time are checkable. Of those 40, 32 started inside the 30°
          dead zone, and the other 8 started within 3.6° of its edge, where the sail barely draws and the boat crawls.
          If any of those 40 had started at, say, 90°, it would have meant a boat moving at full speed across the wind
          somehow never reached the edge — a bug in the movement or the edge.
        </p>

        <h3 style={h3}>Point at the mark — 0 finishes, 200 out of time</h3>
        <p>
          <strong>The prediction:</strong> this is the stalling helm from{" "}
          <Link href="/learn/building-environments/the-brief" style={link}>the brief</Link>, and it should stall in
          every race. <strong>What came back:</strong> 200 out of 200 ran out of time, none left the course. The
          tacks column is a small, useful surprise: 0.82 per race, for a helm that never intends to tack. It is the
          helm hunting back and forth across the wind while it sits in irons, and the counter records every crossing.
          That confirms the counter measures what the boat <em>did</em>, not what it meant — worth knowing before you
          use it to interpret a trained agent.
        </p>

        <h3 style={h3}>The expert — 200 finishes in 48.3 s, exactly 1 tack</h3>
        <p>
          <strong>The prediction:</strong> sailing at the polar&rsquo;s best angle and tacking once at the layline
          should finish every race, in more than the 32.0-second physical floor from the{" "}
          <Link href="/learn/building-environments/parameterising-a-boat" style={link}>speed chart</Link> but not far
          more. <strong>What came back:</strong> 200 of 200, 48.3 seconds, 1.00 tacks. This is the most important row
          on the page, and it is called the <strong>solvability check</strong>: it proves the task can be done within
          the rules as coded. Without it, an agent that fails leaves you unable to rule out an impossible world. And
          48.3 sitting above 32.0 is a consistency check between two independent pieces of the world — the polar and
          the step function — that could each have been wrong in ways the other would expose.
        </p>

        <h2>If a row had come out differently</h2>
        <p>
          The table below is the version of this page you want to have written <em>before</em> running the ladder.
          Each line is a bug the ladder is capable of catching.
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Surprise</th><th style={th}>What it would have meant</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Random helm finishes dozens of races</td>
                <td style={td}>Mark too close, arrival radius too big, or the dead zone not applied — the task is too easy to teach anything</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Random helm never leaves the course</td>
                <td style={td}>The edge check is broken, or the course is far larger than intended</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Holding course ever finishes</td>
                <td style={td}>A boat can make progress straight into the wind — the polar or its <code>abs</code> is wrong</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Pointing at the mark ever leaves the course</td>
                <td style={td}>Speed does not decay in irons, so the boat coasts away — the inertia update is wrong</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>The expert fails some races</td>
                <td style={td}>The world is harder than the physics says, or impossible from some starts — find which starts before training anything</td>
              </tr>
              <tr>
                <td style={td}>The expert beats 32.0 s</td>
                <td style={td}>Something lets the boat go faster than the polar allows — a bug in movement or in the arrival check</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout color={GOLD} title={<>Decision record: a hand-written expert, not a computed optimum</>}>
          The <Link href="/learn/planning" style={link}>Planning</Link> track would compute a truly optimal policy by
          dynamic programming, and it is fair to ask why we did not. Doing it here would mean building a discrete
          model of continuous physics, and the answer would be optimal only for that approximation. The expert is
          about a dozen lines, uses the polar&rsquo;s exact best angle, and its 200 finishes prove solvability directly on the
          real environment. The trade is honesty about what it proves: 48.3 s shows the task can be done that fast.
          It does <em>not</em> show nothing faster exists. The only proven bound below it is the 32.0-second floor from
          physics, and a trained agent landing anywhere between the two is not necessarily failing.
        </Callout>

        <h2>What these tests cannot see</h2>
        <p>
          Every helm on this page ignores the reward. That was the point — it isolates the world&rsquo;s physics and
          endings from the question of what the agent is paid — but it means the ladder is blind to reward bugs, the
          same blind spot flagged in{" "}
          <Link href="/learn/building-environments/writing-step" style={link}>Writing step()</Link>. Testing a reward
          needs an agent that responds to it. So the next page trains one, on the reward most people would write
          first, and finds that something very strange happens between practice and the test.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/where-the-course-ends", label: <>← Where the course ends</> }}
          next={{ href: "/learn/building-environments/paying-the-boat", label: <>Next · Paying the boat →</> }}
        />
      </div>
    </article>
  );
}

const codeLadder = `def point_at_mark(env):
    def helm(o):
        x, y, h, u = o
        err = wrap(math.degrees(math.atan2(env.mx - x, env.my - y)) - h)
        return 1 if abs(err) < 5 else (2 if err > 0 else 0)
    return helm

rng = np.random.default_rng(0)
ladder = [
    ("random helm",      lambda env: (lambda o: int(rng.integers(3)))),
    ("hold the tiller",  lambda env: (lambda o: 1)),
    ("point at the mark", point_at_mark),
    ("the expert",       expert),
]

print(f"{'helm':18s} {'rounded':>8s} {'left':>5s} {'ran out':>8s} {'mean time':>10s} {'tacks':>6s}")
for name, helm in ladder:
    r = race(helm)
    ran_out = 200 - r["arrived"] - r["left_course"]
    t = f"{r['mean_time']:.1f} s" if r["mean_time"] else "-"
    print(f"{name:18s} {r['arrived']:8d} {r['left_course']:5d} {ran_out:8d} {t:>10s} {r['tacks']:6.2f}")`;

const h3: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 19, marginTop: "1.6rem", color: "var(--ink)" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
