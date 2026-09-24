import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Three worlds, one pipeline — Manifold",
  description:
    "A boat, a wildfire and a boss fight, built the same way. What the pipeline is, what each world contributed to it, and the eight findings that turned up in all three — including the one that cost a week each time it was ignored.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const th: React.CSSProperties = {
  textAlign: "left", padding: "7px 10px", borderBottom: "1px solid var(--border)",
  fontFamily: "var(--font-display)", fontSize: 12.5, fontWeight: 500, color: "var(--muted)",
  letterSpacing: "0.02em", verticalAlign: "bottom",
};
const td: React.CSSProperties = {
  padding: "9px 10px", borderBottom: "1px solid var(--border)", fontSize: 14.2,
  lineHeight: 1.5, verticalAlign: "top",
};

export default function Throughline() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 14 minutes"
        title={<>Three worlds, one pipeline</>}
        intro={<>Every other track on this site handed you a world. This one made three: a boat that has to invent
          tacking, a wildfire with four coupled clocks, and a duel decided by five frames. They have almost nothing in
          common as simulations. They went through exactly the same five steps, hit the same eight problems, and two of
          those problems cost a week each before anybody wrote them down.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The pipeline</h2>
        <p>
          <strong>Plan &rarr; parameterise &rarr; code &rarr; test &rarr; train.</strong> It is not a waterfall — you go
          round it — but the order of the first pass matters, and the most expensive mistakes in all three worlds came
          from doing a later step before an earlier one.
        </p>
        <ol style={{ lineHeight: 1.75 }}>
          <li>
            <strong>Plan</strong> — decide the task in a sentence with no RL words in it, and decide what would make it
            a bad task. Every world here started with the same four requirements: the obvious strategy must leave room,
            there must be a hand-written player that succeeds, the interesting behaviour must not be reachable by
            accident, and it must run fast enough to train on one machine.
          </li>
          <li>
            <strong>Parameterise</strong> — pick the numbers, and pick them by measurement wherever a measurement is
            available. A boat gets a polar diagram, a fire gets a spread probability, a boss gets frame data. This is
            where most of the world&rsquo;s character is decided, and it is the step people skip.
          </li>
          <li>
            <strong>Code</strong> — <code>reset</code> and <code>step</code>, the observation, the reward, the endings.
            Small, boring, and checkable.
          </li>
          <li>
            <strong>Test</strong> — invariants, determinism, and above all the <strong>sanity ladder</strong>: a set of
            hand-written players whose scores you can predict, including one that succeeds and one that declines the
            task entirely.
          </li>
          <li>
            <strong>Train</strong> — last, and mostly as a way of finding out what you got wrong in steps one to four.
          </li>
        </ol>

        <h2>The three worlds, side by side</h2>
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={th}>Beat to windward</th>
                <th style={th}>Wildfire command</th>
                <th style={th}>The duel</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td, fontWeight: 600 }}>What is hard</td>
                <td style={td}>Strategy — you cannot sail at the mark</td>
                <td style={td}>Priorities — which fire, and when</td>
                <td style={td}>Timing and spacing, to the frame</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 600 }}>The state</td>
                <td style={td}>A table of 5,184 cells</td>
                <td style={td}>Twelve 16&times;16 layers</td>
                <td style={td}>Twenty-seven floats</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 600 }}>The ceiling</td>
                <td style={td}>Layline sailor: 200/200 in 48.3 s</td>
                <td style={td}>Guard the village: 1.03 cells lost, 77% saved</td>
                <td style={td}>Patient parry: 200/200 on full health</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 600 }}>The floor</td>
                <td style={td}>Random 4/200; hold course 0/200</td>
                <td style={td}>Stand by: 6.79 cells lost, 20% saved</td>
                <td style={td}>Stand still: dies 200/200 at &minus;41.26</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 600 }}>The hack it found</td>
                <td style={td}>Sail off the course to stop paying &minus;1</td>
                <td style={td}>Paid per fire extinguished, let fires grow</td>
                <td style={td}>Refuse to engage; then turtle</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 600 }}>Speed work</td>
                <td style={td}>Runs in the browser, in Pyodide</td>
                <td style={td}>Vectorised: 8.0&ndash;8.7&times; at batch 64</td>
                <td style={td}>None needed — the duel is 2% of the loop</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Three different answers to every row, produced by the same five steps. That is the argument for having a
          pipeline rather than a template: what carries between worlds is the <em>order of the questions</em>, not any
          of the answers.
        </p>

        <h2>Eight things that turned up in all three</h2>
        <ol style={{ lineHeight: 1.8 }}>
          <li>
            <strong>Every world got hacked, and never in the predicted way.</strong> World 1 expected slow learning from
            a &minus;1-per-second reward and got an agent that{" "}
            <Link href="/learn/building-environments/where-the-course-ends" style={link}>left the course</Link> to stop
            paying it. World 2 expected a crew that fought fires and got one that, paid per fire put out,{" "}
            <Link href="/learn/building-environments/the-cobra-effect" style={link}>benefits from more fires</Link>.
            World 3&rsquo;s plan predicted turtling, and what actually appeared first was outright{" "}
            <Link href="/learn/building-environments/the-turtle" style={link}>refusal</Link> — the harder of the two to
            remove. Predicting the hack is not the skill; noticing it within one training run is.
          </li>
          <li>
            <strong>The sanity ladder must contain an agent that declines the task.</strong> This is the one that cost a
            week, twice. World 1 had no &ldquo;leave the course&rdquo; row, so its worst bug was invisible until a
            trained agent found it. World 3&rsquo;s first ladder had no <code>run away</code> row, and hid a boss that
            physically could not catch a retreating player. The row costs three lines.
          </li>
          <li>
            <strong>When declining is available, fix the world, not the reward.</strong> World 1 added a course
            boundary; World 3 added a wall at eight units and a boss that closes at 0.105 against your 0.075. Both times
            a reward patch was tried first and both times it moved the symptom. A reward that has to punish an escape is
            a reward doing an environment&rsquo;s job.
          </li>
          <li>
            <strong>A baseline that moves when you run it twice is not a baseline.</strong> World 2&rsquo;s helicopter
            and World 3&rsquo;s <code>random buttons</code> both held one shared generator, so their scores depended on
            how many episodes had already been run in the process. Run your ladder twice in one process and diff it.
          </li>
          <li>
            <strong>Measure which cost dominates before optimising anything.</strong> World 2 profiled, found the fire
            tick at 80% of runtime, vectorised it and got eight times the throughput. World 3 ran the same measurement,
            found the environment at{" "}
            <Link href="/learn/building-environments/thousands-of-duels-at-once" style={link}>under 2% of a training
            run</Link>, and wrote no vectorised code at all. Same discipline, opposite conclusion — and neither was
            guessable from reading the source.
          </li>
          <li>
            <strong>A knob you assume is about speed can delete a mechanic.</strong> The duel&rsquo;s decision rate
            looks like a training-cost dial. At one decision every six frames the parry window becomes unhittable and
            the expert falls from 100% wins to{" "}
            <Link href="/learn/building-environments/stamina-and-the-perfect-guard-window" style={link}>21.7%</Link>,
            with no error and no warning. Derive that threshold from the tightest window in your world before you touch
            the knob.
          </li>
          <li>
            <strong>The obvious dial is not monotone.</strong> World 1 found that more training episodes made things{" "}
            <em>worse</em> at a large constant step size. World 3&rsquo;s aggression dial makes life harder for players
            who block (56.3 &rarr; 30.0 health) and{" "}
            <Link href="/learn/building-environments/scripted-players-and-a-difficulty-dial" style={link}>better for
            players who avoid</Link> (69.1 &rarr; 79.0). Sweep every dial against more than one strategy, or you will
            describe a curve that only one policy sees.
          </li>
          <li>
            <strong>Publish the nulls.</strong> World 2&rsquo;s corner-weight experiment turned out to be about speed
            rather than shape; its slope term barely moved anything; World 1&rsquo;s attempt to complete the Markov
            state by adding speed made learning <em>worse</em>. Those are the results that stop the next person
            repeating the experiment, and they are the first thing a tidy write-up deletes.
          </li>
        </ol>

        <Callout color={GOLD} title={<>The one-sentence version</>}>
          <p style={{ margin: 0 }}>
            <strong>An environment is a claim about what matters, and almost every bug in one is a claim you did not
            realise you were making.</strong> A boat that can leave the course claims leaving is allowed. A boss that
            cannot catch you claims running is a strategy. A reward that pays for survival claims a shield is as good as
            a win. None of those were decisions anybody made on purpose; all of them were found by a hand-written player
            costing three lines, before a single gradient step.
          </p>
        </Callout>

        <h2>If you build one</h2>
        <p>
          A short checklist, in the order that saves the most time:
        </p>
        <ul style={{ lineHeight: 1.75 }}>
          <li>Write the task in a sentence with no RL vocabulary. If you cannot, you do not have a task yet.</li>
          <li>Write the player that <em>succeeds</em> before you write the reward. If you cannot write it, the world may
            be unsolvable and no amount of training will tell you which.</li>
          <li>Write the player that <em>refuses</em> — runs away, stands still, does nothing. Score it. If it does well,
            stop and fix the world.</li>
          <li>Write the player that uses exactly one mechanic, for every mechanic. They are your control columns
            forever, and they cost a line each.</li>
          <li>Check determinism: same seed plus same actions gives the same episode, and a different seed gives a
            different one. World 1&rsquo;s leaky version passed four of its five promises and failed only that one.</li>
          <li>Check the endings you think are unreachable. Branch coverage under random play in this world reaches every
            branch <em>except</em> winning — which is exactly the property that makes the world worth training in.</li>
          <li>Only then train, and treat the first run as a test of the previous six bullets.</li>
        </ul>

        <Proof title="what this track deliberately did not do" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            No world here was built with a physics engine, and none needed one. A polar diagram, a cellular automaton
            and a frame table are each a few hundred lines of numpy, which is what makes them fast enough to sweep, small
            enough to port, and simple enough that a disagreement between two implementations can be traced to a line.
            The duel&rsquo;s TypeScript port agrees with the Python to 5&times;10<sup>&minus;13</sup> over nine hundred
            frames because there is little enough of it to check.
          </p>
          <p style={{ margin: 0 }}>
            Nor did any of them start from a research paper&rsquo;s benchmark. The point of the track is that the
            environments in papers were built by somebody who made all of these decisions, usually without writing them
            down, and that reading a leaderboard tells you nothing about which of those decisions the number depends on.
          </p>
        </Proof>

        <h2>Where to go next</h2>
        <p>
          If you want to <em>use</em> a world someone else built, the{" "}
          <Link href="/learn/warehouse-robot-capstone" style={link}>warehouse capstone</Link> runs the full loop on a
          tabular problem with a playbook at the end. If you want the opposite of this track — learning a policy with no
          environment at all, from a human&rsquo;s own recorded play — that is the{" "}
          <Link href="/learn/lies-of-p-capstone" style={link}>Lies of P field report</Link>, which is where this duel
          points once you accept that the real game is not something you can reset forty thousand times a minute.
        </p>
        <p>
          And if you want to build one of your own, the most useful thing in this track is not any of the three worlds.
          It is the habit that produced them: <strong>every number on every page here is reproduced by a script in the
          repository</strong>, so a claim that stops being true stops being true loudly. That habit is what turns a
          simulator into something you are allowed to conclude things from.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/sim-vs-the-real-game", label: <>← Sim vs the real game</> }}
        />
      </div>
    </article>
  );
}
