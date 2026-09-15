import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { ENV_DONE, ENV_TOTAL } from "@/lib/envBuildingTrack";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { RaceReplay } from "@/components/sail/RaceReplay";
import { HelmLab } from "@/components/sail/HelmLab";
import { HUB_RACES } from "@/components/sail/data/hubRaces";

export const metadata = {
  title: "Building environments from scratch — Manifold",
  description:
    "Every RL track so far handed you a world. This one builds three — a sailboat that has to invent tacking, a wildfire command with coupled systems, and a Soulslike boss fight — each taken from plan to parameters to code to tests to a trained agent.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BuildingEnvironmentsHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Reinforcement learning", color: GOLD },
          {
            label: ENV_DONE >= ENV_TOTAL ? `Complete · ${ENV_TOTAL} pages` : `${ENV_DONE} of ${ENV_TOTAL} pages`,
            color: GOLD,
          },
        ]}
        time="the world-building turn"
        title={<>Every track handed you <em>a world</em></>}
        intro={<>A gridworld, a cliff, a random walk, a car stuck in a valley, a pole on a cart. Four tracks of
          reinforcement learning, and in every one of them somebody else had already written the world. You called{" "}
          <code>reset()</code> and <code>step()</code> and trusted what came back. This track is about the other
          side of that call — and it turns out to be where most real RL projects succeed or fail.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The half of RL nobody hands you</h2>
        <p>
          Read any RL paper and the environment gets a paragraph. Build any RL system and it gets most of your time.
          The agent is a few dozen lines you can copy from a textbook; the world is everything that is specific to
          your problem — what the agent is allowed to see, what it can do, what it is paid for, when an attempt is
          over, and whether any of that is even solvable.
        </p>
        <p>
          Get those wrong and the algorithm does not fail loudly. It succeeds, precisely, at the wrong thing. You
          will watch that happen several times in this track, and every time the bug will be in the world, not the
          learner.
        </p>

        <h2>Meet the first world</h2>
        <p>
          A sailboat starts 60 metres downwind of a mark and has to reach it. The catch is physical: a sail cannot
          drive a boat straight into the wind, so pointing at the mark gets you nowhere. Sailors solve this by{" "}
          <strong>tacking</strong> — zig-zagging at an angle to the wind, crossing over, and angling back. The agent
          will never be told this exists.
        </p>
        <p>
          Here are three helmsmen on the same start. The first steers at random, the second holds the tiller still,
          and the third is a hand-written sailor who knows the trick.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codeHelms} />
        <CodeOutput>{`random helm               58 s   tacks 0   left the course
hold the tiller           51 s   tacks 0   left the course
a sailor who can tack     52 s   tacks 1   rounded the mark`}</CodeOutput>

        <RaceReplay id="hub" races={HUB_RACES} colors={["var(--c-regression)", "var(--c-classification)", "var(--c-rl)"]} title="The same race, drawn: all three helms from start seed 3" />

        <p>
          Watch the gold boat. It never points at the mark; it sails off at an angle, swings through the wind once, and
          comes in on the other side. That swing is the tack. That is one race. Over 200 different starts, the random helm reaches the mark <strong>4</strong> times,
          holding the tiller <strong>0</strong> times, and the sailor who tacks <strong>200 out of 200</strong>, in
          48.3 seconds on average. The world is hard enough that luck does not solve it, and possible enough that a
          single idea does. Both of those facts had to be <em>checked</em> before an agent went anywhere near it —
          which is the first habit this track will drill.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Before anyone explains tacking, sail it yourself. Start the race, and first try steering straight at the mark.</>}
          insight={<>Pointing at the mark stops the boat dead: inside the red wedge the sail gives no drive. The way through is
            to sail at about 50° to the wind and turn across it once. The agent in this track has to find that out the same
            way you just did, by trying and being paid for the result.</>}
        >
          <HelmLab />
        </LabFrame>

        <Callout color={GOLD} title={<>What &ldquo;from scratch&rdquo; means here</>}>
          No Gymnasium, no physics engine, no game engine. Every world in this track is a Python class you write
          yourself: the constants, the dynamics, the reward, the ending conditions, the tests. We do copy one thing —
          the <em>shape</em> of Gymnasium&rsquo;s interface, <code>reset() → (obs, info)</code> and{" "}
          <code>step(a) → (obs, reward, terminated, truncated, info)</code> — because that shape encodes hard-won
          lessons, and because it means anything you build here plugs into real libraries later.
        </Callout>

        <h2>Three worlds, one pipeline</h2>
        <p>
          The track builds three environments at rising ambition, and takes every one of them through the same five
          stages:
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li><strong>Plan</strong> — the task in words, then as a decision problem: what the agent sees, does, is paid for, and when it stops.</li>
          <li><strong>Parameterise</strong> — the constants that make it this world and not another, and where each number comes from.</li>
          <li><strong>Code</strong> — <code>reset</code> and <code>step</code>, written line by line.</li>
          <li><strong>Test</strong> — agents that <em>should</em> fail, an expert that must succeed, and an oracle where one exists.</li>
          <li><strong>Train</strong> — drop an agent in, read what it actually learned, and fix whichever side was wrong.</li>
        </ol>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>World</th><th style={th}>What makes it hard</th><th style={th}>Where it runs</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}><strong style={{ color: "var(--ink)" }}>1 · Beat to windward</strong></td>
                <td style={td}>The obvious route is impossible; the answer has to be invented. There is a closed-form optimum from sailing theory to check the agent against.</td>
                <td style={td}>Entirely in your browser — every cell runs</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}><strong style={{ color: "var(--ink)" }}>2 · Wildfire command</strong></td>
                <td style={td}>Several systems on different clocks — fire spread, shifting wind, a helicopter that must refill — and a reward that forces you to say what a forest is worth next to a village.</td>
                <td style={td}>A small map in the browser; full training on your own machine</td>
              </tr>
              <tr>
                <td style={td}><strong style={{ color: "var(--ink)" }}>3 · Boss fight</strong></td>
                <td style={td}>A Soulslike duel: a moveset with delayed attacks, stamina, dodge frames and a perfect-guard window measured in frames.</td>
                <td style={td}>Your own machine, with videos of the result here</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          The third world has a second purpose. The{" "}
          <Link href="/learn/lies-of-p-capstone" style={link}>Learning to parry</Link> field report trains an agent
          to fight by copying recorded human play, because the real game cannot be simulated. Building a duel you{" "}
          <em>can</em> simulate is the other road to the same place, and putting the two side by side is the most
          interesting comparison the RL family has to offer.
        </p>

        <Callout color={GOLD} title={<>A promise about the numbers</>}>
          The first world is fully measured: every result quoted about it was produced by the exact code you can run
          on these pages, across several seeds, and several of those results are not the ones we expected going in.
          The second and third worlds are held to the same rule — their results pages stay unwritten until the
          trained agents exist.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/function-approximation/the-throughline", label: <>← Function approximation: the throughline</> }}
          next={{ href: "/learn/building-environments/the-reset-step-contract", label: <>Next · The reset/step contract →</> }}
        />
      </div>
    </article>
  );
}

const codeHelms = `rng = np.random.default_rng(0)
env = Sail()

helms = {
    "random helm":           lambda o: int(rng.integers(3)),
    "hold the tiller":       lambda o: 1,
    "a sailor who can tack": expert(env),
}

for name, helm in helms.items():
    o, info = env.reset(seed=3)
    while True:
        o, r, terminated, truncated, info = env.step(helm(o))
        if terminated or truncated:
            break
    how = "rounded the mark" if info["arrived"] else ("left the course" if info["out"] else "ran out of time")
    print(f"{name:24s} {env.t:3d} s   tacks {env.tacks}   {how}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
