import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { TrainingGroundLab } from "@/components/sail/TrainingGroundLab";

export const metadata = {
  title: "Training ground: train the fleet yourself — Manifold",
  description:
    "A sandbox for everything chapter 3 measured. Train up to 16 boats at once, in your browser, with any reward, edge, view, step size or exploration — plus wind direction, wind strength and shifting wind, which the earlier pages never tested. Watch the fleet struggle, slow the loop down to a single Q-update, and test the result on 200 held-out starts.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TrainingGround() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="as long as you like"
        title={<>Training ground: train the fleet yourself</>}
        intro={<>Chapter 3 made every decision with a measurement you could only read. Here you make them. The lab below
          trains a whole fleet of boats side by side, in your browser, with the same learner and the same physics. You
          choose the reward, the edge, what the boat sees, how it learns, and the wind it sails in. Then you watch it
          struggle, and test what it learned.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The lab</h2>
        <p>
          Every boat is an independent training run with its own seed: boat 1 is seed 0, boat 2 is seed 1, and so on.
          They share one set of settings, so the differences you see between boats are pure luck of the draw. That is
          the most important thing this page can show you, and the cheapest.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Train the fleet</strong> with the shipped settings and watch the map. When it finishes,
            compare the boats&rsquo; test scores. Then reset, drag the start or the wind somewhere new, and train again.</>}
          insight={<>Identical settings, very different boats. Some seeds tack cleanly and finish nearly every test race;
            others learn far less in the same 2000 races. That spread is why every decision on the earlier pages was made
            over five training runs, never one.</>}
        >
          <TrainingGroundLab />
        </LabFrame>

        <h2>What you are looking at</h2>
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            <strong>Every boat sails on the one map, in its own colour.</strong> Each line is that boat&rsquo;s most recent
            practice race: solid if it rounded the mark, dashed if it left the course, faded if the clock ran out. Early on
            the lines are scribbles; watch for the moment they straighten into zig-zags. Hover a boat in the legend to pick
            it out of the crowd.
          </li>
          <li>
            <strong>Before training, the map is a control.</strong> Drag the start square to move where every race begins,
            and the green mark to move where every race ends — for practice and for the final test. Switch on the vortex
            and drag it wherever you want a whirlpool. Drag the wind dial&rsquo;s handle round to change where the wind
            comes from, up to 45° either side of the course, and in or out to make it lighter or stronger.
          </li>
          <li>
            <strong>The small line under each boat&rsquo;s name is its learning curve:</strong> the share of practice races
            it rounded the mark in each block of 50. The dashed top line is 100%. Practice includes exploration, so it
            understates the frozen boat.
          </li>
          <li>
            <strong>The code is the whole learner.</strong> Running flat out, the shaded loop executes for every boat,
            thousands of times a second. In <em>slow motion</em>, boat 1 runs one update at a time, the highlighted line is
            the one executing, and the panel beside it shows the actual numbers: the cell, the action and why it was
            chosen, the reward, the target, and the one table entry that changed.
          </li>
          <li>
            <strong>At the end, every boat is frozen and tested</strong> on the same 200 held-out starts, exactly as on
            the earlier pages: no exploration, no learning.
          </li>
        </ul>

        <h2>Experiments worth running</h2>
        <p>
          Each of these repeats a measurement from chapter 3. The right-hand column is what the Python version found,
          over five training runs. Your fleet uses different random draws, so expect the same <em>shape</em> of result,
          not the same digits.
        </p>
        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Change from the shipped settings</th><th style={th}>What to look for</th><th style={th}>What the Python pages measured</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Reward: <strong>−1 per second</strong></td>
                <td style={td}>Practice curves that rise while test scores stay low</td>
                <td style={td}>4.4 of 200 frozen; far more with the table still learning (<Link href="/learn/building-environments/paying-the-boat" style={link}>page</Link>)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>−1 per second <em>and</em> a <strong>free edge</strong></td>
                <td style={td}>Red paths: boats sailing off the course on purpose</td>
                <td style={td}>0 rounded, 115 of 200 left in testing (<Link href="/learn/building-environments/where-the-course-ends" style={link}>page</Link>)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Reward: <strong>speed</strong></td>
                <td style={td}>Loops that never approach the mark</td>
                <td style={td}>0–1 arrivals per run, 3–4.5 circles per race (<Link href="/learn/building-environments/pay-for-speed" style={link}>page</Link>)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>View: <strong>where am I</strong></td>
                <td style={td}>A wider spread between boats</td>
                <td style={td}>140.8 ± 39.4 against 175.8 ± 13.7 (<Link href="/learn/building-environments/what-the-boat-sees" style={link}>page</Link>)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Practice races: <strong>100</strong>, then 500, then 3000</td>
                <td style={td}>When the zig-zag first appears</td>
                <td style={td}>0, 31, 53, 103, 156 finishes after 100 to 2000 races (<Link href="/learn/building-environments/the-agent-invents-tacking" style={link}>page</Link>)</td>
              </tr>
              <tr>
                <td style={td}>Exploration ε: <strong>0.3</strong></td>
                <td style={td}>Whether more random actions speed learning up</td>
                <td style={td}>For −1 per second, tripling exploration barely helped; tripling practice did</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout color={GOLD} title={<>The wind settings are yours to investigate</>}>
          The earlier pages sailed from one start, in one steady wind blowing straight down the course, so the best angle
          could be computed exactly. The sandbox adds several knobs that none of them measured.
          <br /><br />
          <strong>The start and the mark</strong> move every race, practice and test alike. Together they set the shape of
          the task: a mark directly upwind of the start needs a zig-zag, a mark well off to one side needs one long leg and
          a short one, and a mark across the wind needs no tack at all. The race area moves with them: it is always the
          150 m circle centred halfway between start and mark, just as in the Python boat. Each fleet trains from scratch
          for the course you draw.
          <br /><br />
          <strong>The vortex</strong> is a whirlpool: inside its core the water turns anticlockwise at up to 0.8 m/s
          (gentle) or 1.6 m/s (strong), pulling slightly inward, and the current fades to nothing at two and a half times
          the core&rsquo;s radius. Like the shifting wind, it is invisible to the boat — nothing in what it sees says the
          water is moving. A table can still learn to avoid a whirlpool that never moves, cell by cell. Put one on the
          direct route and watch whether the fleet learns to go around it.
          <br /><br />
          <strong>Wind from</strong> rotates the wind. The mark is no longer dead upwind, so one tack is shorter than the
          other. At large angles the mark leaves the no-go zone entirely and the boat can sail straight to it.
          <br /><br />
          <strong>Wind strength</strong> changes the boat&rsquo;s top speed. The shape of the polar, and so the best angle,
          stays the same, but every race is shorter or longer in seconds.
          <br /><br />
          <strong>Wind shifts</strong> let the wind wander during a race. This is the interesting one, because nothing in
          what the boat sees says where the wind is. A heading that was a good tack a moment ago can drift into the no-go
          zone, and the table cannot tell. Whether the shipped view copes, and how badly, is an experiment we have
          deliberately left for you.
        </Callout>

        <Callout color={GOLD} title={<>How the sandbox differs from the Python boat</>}>
          With the wind settings at their defaults, the physics, the rewards, the views and the update rule are the
          environment and learner from the earlier pages, line for line, in TypeScript. What differs is the random numbers:
          a seeded generator in the page instead of numpy&rsquo;s. So boat 1 here is not the seed-0 boat from the Python
          pages, and no individual number will match. Trust the patterns across boats, not a single score. The pages&rsquo;
          Python cells remain the reference for every number quoted in this track.
        </Callout>

        <h2>The online ceiling, and going past it</h2>
        <p>
          The lab stops at 16 boats and 3000 practice races each. That is about 48,000 races, which a laptop trains in a
          few seconds when the speed is set to fast; the slower speeds exist so you can watch. Past that ceiling the page
          would stall on slower machines, so bigger experiments — tens of thousands of races, more seeds, a finer view, a
          different learner — belong on your own computer. The environment and learner from the earlier pages are plain
          Python and numpy and run unchanged there:
        </p>
        <pre style={pre}>{`# on your machine, with the Sail class and train_sailor from the earlier pages
results = []
for seed in range(20):                                   # twenty runs, not five
    Q, log = train_sailor(reward="progress", episodes=10000, seed=seed)
    results.append(race(greedy(Q))["arrived"])
print(np.mean(results), np.std(results))

# a wind from another direction is one line in Sail.step:
#     self.u += (polar(wrap(self.h - WIND_FROM)) - self.u) * INERTIA
# and the tack test must compare wrap(old - WIND_FROM) with wrap(self.h - WIND_FROM)`}</pre>

        <h2>World 1, handed over</h2>
        <p>
          You have now built the sailboat, tested it, trained it, broken it three ways, and trained a fleet of it with
          your own settings. The next world keeps every habit from this one and adds something the boat never had:
          several systems running at once, on different clocks, with a reward that forces a judgement about what matters
          most.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/pay-for-speed", label: <>← Pay for speed, get a boat that circles</> }}
          next={{ href: "/learn/building-environments/wildfire-brief", label: <>Next · World 2: the brief →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
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
