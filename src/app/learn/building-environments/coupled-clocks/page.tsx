import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { ClockRatioLab } from "@/components/fire/ClockRatioLab";

export const metadata = {
  title: "Coupled clocks — Manifold",
  description:
    "The helicopter acts every step, the fire every 2 steps, the wind every 30. Rebuild step from its systems and prove the order inside it, see why the fire and the wind share one stream of dice, and measure the fire/helicopter clock ratio: it moves the better fire chief from 48% to 97.5% of villages untouched. Decision records for the ratio, the order inside a step, and the weather clock.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CoupledClocks() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 22 minutes"
        title={<>Coupled clocks</>}
        intro={<>Nothing in this world runs at one speed. The helicopter acts every step, the fire moves every second
          step, the wind shifts every thirtieth. The last three pages proved each system correct on its own. This page is
          about where they meet: the order inside a single step, the one stream of dice they share, and the ratio between
          the fire&rsquo;s clock and the helicopter&rsquo;s — a single constant that turns out to be a difficulty dial as
          strong as the bucket and the drop.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Three clocks in one step</h2>
        <p>
          The environment keeps one counter, <code>env.t</code>, which counts helicopter steps. Everything else is
          scheduled from it by three constants: <code>FIRE_EVERY = 2</code>, <code>WEATHER_EVERY = 30</code> and{" "}
          <code>MAX_STEPS = 300</code>. Rather than read the schedule off the code, watch it happen. The cell below
          hovers over world 1002 and, after every step, looks at what changed.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeSchedule} />
        <CodeOutput>{`wind before step 30: toward 343 deg (N) at 0.44
wind after step 30:  toward 330 deg (NW) at 0.59

                           111111111122222222223333333
            step  123456789012345678901234567890123456
helicopter acts   ||||||||||||||||||||||||||||||||||||
fire ticks        .|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|
wind shifts       .............................|......

a full episode, if time is called: 300 helicopter actions, 150 fire ticks, 10 wind shifts
wind shifts that land on a fire tick: 10 of 10 (steps 30, 60, ... 300)`}</CodeOutput>

        <p>
          The cell never uses the schedule to draw the rows; it detects each clock by its effect. Every fire tick dries
          the ground by <code>DRYING</code>, and a hovering helicopter never wets anything, so a change in{" "}
          <code>env.M</code> means the fire ticked. A change in <code>wdir</code> or <code>wspd</code> means the wind
          shifted. The fire ticks on every even step; at step 30 the wind swung from 343° to 330° and picked up from
          0.44 to 0.59.
        </p>
        <p>
          The last line is worth noticing. Thirty is even, so every wind shift lands on a step where the fire also
          ticks. Which of the two goes first inside <code>step</code> is not a corner case that might come up; it comes
          up ten times in a full episode.
        </p>

        <h2>Piece 1: the order inside a step</h2>
        <p>
          Here is <code>step</code> rebuilt from its systems. Each numbered comment is one system, in the order the
          environment runs them: the helicopter acts, the clock advances, the fire moves if its tick is due, the wind
          shifts if its turn is due, and only then is the step scored and checked for an ending. The helicopter is the
          function you wrote on the <Link href="/learn/building-environments/the-helicopter" style={link}>last page</Link>;
          the fire is <code>env.fire_tick</code>, because the two pages before that proved the rule you wrote identical to
          it.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeStep} />
        <CodeOutput>{`20 worlds, 1090 steps: every observation, reward, ending and info identical to env.step
  steps where the fire ticked          544
  steps where the wind shifted         26
  ... and both in the same step        26
  episodes ended: fire out 12, time called 8`}</CodeOutput>

        <p>
          <strong>No dice to copy this time.</strong> On earlier pages the test copied the generator&rsquo;s state
          across by hand. Here both copies of the world are seeded the same, and as long as <code>my_step</code> draws
          from <code>env.rng</code> in the same order as <code>env.step</code>, the two generators stay in step on their
          own. That is exactly why this test can check the order: draw in a different order and the dice drift apart.
        </p>
        <p>
          <strong>The counts show what was tested.</strong> 544 fire ticks and 26 wind shifts, every one of them on a
          fire tick. The short 40-step limit on every other world is there for the last line: without it, all 20
          episodes in a first version of this test ended with the fire out, and the <code>truncated</code> line was
          never checked. A test only checks the endings it reaches.
        </p>
        <p>
          <strong>Does the test fail when it should?</strong> We broke <code>my_step</code> six ways, one at a time, and
          ran the same test:
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>the broken version</th><th style={th}>first mismatch</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the clock advances after the fire and wind checks</td><td style={td}>world 1000, step 1</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the fire and wind move before the helicopter acts</td><td style={td}>world 1000, step 8</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the wind shifts before the fire ticks</td><td style={td}>world 1000, step 30</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the wind rolls its own dice, from a separate generator</td><td style={td}>world 1000, step 30</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the ending is checked before the fire moves</td><td style={td}>world 1000, step 82</td></tr>
              <tr><td style={td}>time is called one step late (<code>&gt;</code> instead of <code>&gt;=</code>)</td><td style={td}>world 1003, step 40</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          All six are caught, but look at when. Moving the helicopter after the fire made no difference for the first
          seven steps of world 1000. Checking the ending too early survived until step 82 — the step where that
          world&rsquo;s last flames burned out on a fire tick, which is the only moment the mistake changes anything. And
          calling time late was caught only in world 1003, one of the short-limit worlds; without them it would have
          passed. Order bugs hide until the step where two systems actually interact.
        </p>

        <Callout color={GOLD} title={<>Decision record: the helicopter first, then the fire, then the wind</>}>
          The agent chooses its action from an observation. If the fire moved <em>before</em> that action took effect,
          the drop would land on a map the agent never saw — a hidden delay built into every action. So the helicopter
          acts first, on the map the agent was looking at, and the observation is taken after every system has moved, so
          the agent sees the consequences of its own action. Between the fire and the wind there is no such principle;
          we chose fire first so that a tick is steered by the wind the agent could see when it chose. We measured all
          three orders over the 200 held-out worlds (village cells damaged · village untouched):
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>order inside step</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...td, color: "var(--ink)" }}><strong>helicopter → fire → wind (shipped)</strong></td><td style={td}>6.79 · 20%</td><td style={td}>2.65 · 65%</td><td style={td}>1.03 · 77%</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={td}>fire → wind → helicopter</td><td style={td}>6.79 · 20%</td><td style={td}>2.81 · 64.5%</td><td style={td}>1.14 · 76.5%</td>
                </tr>
                <tr>
                  <td style={td}>helicopter → wind → fire</td><td style={td}>6.64 · 20.5%</td><td style={td}>2.68 · 64.5%</td><td style={td}>0.96 · 77%</td>
                </tr>
              </tbody>
            </table>
          </div>
          The differences are small next to everything else on this page. Moving the fire ahead of the helicopter costs
          both chiefs a little, as the hidden delay predicts, but only a little. Putting the wind first changes the fire
          itself — standing by gives 6.64 instead of 6.79 — because the shift at step 30 now steers the fire tick at step
          30. We did not choose the order from these numbers, which are too close to choose anything from; we chose it
          from the principle, and measured to check it was not costing the world anything large.
        </Callout>

        <h2>One stream of dice</h2>
        <p>
          The fourth broken version — the wind rolling its own dice — is a design question in disguise. The fire and the
          wind both draw from <code>env.rng</code>, and the number of draws never depends on anything the helicopter
          does: every fire tick rolls one die for each of the 256 cells whether or not anything is burning nearby (the
          choice made on the{" "}
          <Link href="/learn/building-environments/fire-as-a-cellular-automaton" style={link}>cellular-automaton page</Link>),
          and every wind shift draws two numbers. So, given a seed, the whole sequence of dice is fixed before the
          episode starts, and any two pilots flying the same world face exactly the same luck. That is what let the last
          page&rsquo;s lab replay &ldquo;the same fire again&rdquo;, and it is what makes the experiment below clean.
        </p>
        <p>
          Suppose you want a faster helicopter. The obvious change is <code>fire_every=3</code>. But that changes two
          other things at once: a wind shift every 30 steps is now every 10 fire ticks instead of every 15, and a 300-step
          episode now ends after 100 fire ticks instead of 150. To change only the ratio, scale every clock with it. The
          environment takes all three as arguments, so for <em>k</em> helicopter steps per fire tick it is{" "}
          <code>Wildfire(fire_every=k, weather_every=15 * k, max_steps=150 * k)</code>. Counted in fire ticks, those
          worlds should then be identical — and a pilot that never touches the world can prove it.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeSameFire} />
        <CodeOutput>{`world 1002          k  steps  fire ticks  cells burnt  village cells hit  drops
  stand by        1     44        44.0          214                  8      0
  stand by        2     88        44.0          214                  8      0
  stand by        3    132        44.0          214                  8      0
  stand by        4    176        44.0          214                  8      0

  guard           1     28        28.0          142                  0      2
  guard           2     56        28.0          113                  0      3
  guard           3     90        30.0          104                  0      6
  guard           4     99        24.8           64                  0      7

standing by, the four worlds are the same fire: same cells burnt, same wind at every shift, counted in fire ticks`}</CodeOutput>

        <p>
          Standing by, world 1002 is the brief&rsquo;s fire at every <em>k</em>: 44 fire ticks, 214 cells, 8 of the 9
          village cells. Only the step count changes, doubling, tripling and quadrupling. The comparison checks every cell
          that ever burned and the whole wind history, not just the totals.
        </p>
        <p>
          With the guard chief flying, the same fire burns 142 cells when the helicopter gets 1 step per tick and 64 when
          it gets 4, with more drops as the helicopter speeds up. The village survives in all four, so this world cannot
          show the village effect. And one world is only one world: at 3 steps per tick this episode lasted more fire
          ticks (30) than at 2 (28) while burning fewer cells. For a real comparison we need all 200 worlds.
        </p>

        <h2>The ratio, over 200 worlds</h2>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Slow the helicopter to half its shipped speed: 1 step per fire tick. Over the 200 held-out worlds, which
            pilot leaves the fewest village cells damaged — the guard-the-village chief, the nearest-fire chief, or a
            pilot pressing random buttons?</>}
          options={["The guard chief, by a wide margin", "The guard chief, but only just", "The random pilot", "The nearest-fire chief"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeRatio} />
        <CodeOutput>{`guard the village, 200 held-out worlds
  steps per fire tick   village cells damaged   village untouched   cells burnt   steps per episode
                    1                    3.25               48.0%         127.4                31.4
                    2                    1.03               77.0%          83.7                46.9
                    3                    0.26               91.0%          51.1                50.0
                    4                    0.09               97.5%          31.8                47.8

  standing by, for comparison: 6.79 village cells damaged, 20.0% untouched, 169.4 cells burnt`}</CodeOutput>

        <p>
          <strong>The guard chief, but only just.</strong> Here are all the pilots at each ratio, with every clock scaled
          as in the cell (village cells damaged · village untouched; standing by is 6.79 · 20% at every ratio, because it
          is the same fire):
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>steps per fire tick</th><th style={th}>random pilot</th><th style={th}>nearest fire</th><th style={th}>guard the village</th><th style={th}>nearest − guard</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1</td><td style={td}>3.50 · 40.5%</td><td style={td}>4.07 · 49%</td><td style={td}>3.25 · 48%</td><td style={td}>0.82</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>2 (shipped)</strong></td><td style={td}>3.37 · 41%</td><td style={td}>2.65 · 65%</td><td style={td}>1.03 · 77%</td><td style={{ ...td, color: "var(--ink)" }}><strong>1.62</strong></td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>3</td><td style={td}>3.43 · 41%</td><td style={td}>1.26 · 81%</td><td style={td}>0.26 · 91%</td><td style={td}>1.00</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>4</td><td style={td}>3.38 · 42.5%</td><td style={td}>0.62 · 91.5%</td><td style={td}>0.09 · 97.5%</td><td style={td}>0.53</td></tr>
              <tr><td style={td}>6</td><td style={td}>3.46 · 41.5%</td><td style={td}>0.15 · 97.5%</td><td style={td}>0.01 · 99.5%</td><td style={td}>0.14</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          At 1 step per tick the guard chief beats random buttons by a quarter of a village cell, 3.25 against 3.50, and
          the nearest-fire chief does <em>worse</em> than random on the village (4.07), even though it keeps more villages
          untouched (49% against 40.5%) and burns far less of the map (123.8 cells against 153.9). The random pilot
          barely moves across the table, from 3.37 to 3.50. That is what you would expect if most of its help is the
          starting bucket, which begins over the village, rather than anything it does later; we have not tested that
          directly. (The random pilot here rolls fresh dice for each world, so its numbers differ a little from other
          random-pilot numbers in this track.)
        </p>
        <p>
          The chiefs are where the ratio bites. Going from 1 to 4 steps per tick takes the guard chief from 48% to 97.5%
          of villages untouched — a swing as large as anything the bucket and drop size did on the last page, from one
          constant.
        </p>

        <Callout color={GOLD} title={<>Decision record: the fire advances every 2 steps</>}>
          The <Link href="/learn/building-environments/wildfire-brief" style={link}>brief</Link> claimed that this ratio
          decides how much room there is between a poor rule and a good one, and promised to measure it. The last column
          of the table is that room: how many more village cells the nearest-fire chief loses than the guard chief. It
          rises from 0.82 at 1 step per tick to <strong>1.62 at 2</strong>, then falls to 1.00, 0.53 and 0.14 as the
          helicopter gets faster and both chiefs start to win easily. The room <em>above</em> the better rule shrinks too:
          the guard chief still loses village cells in 23% of worlds at 2 steps per tick, but in only 9% at 3 and 2.5% at
          4. At 1 step per tick the opposite problem appears: neither rule is much better than random buttons.
          <br /><br />
          So 2 is the ratio where the two rules differ most and a trained crew still has something to beat. We first chose
          it in the prototype, where only fire every 2 or 3 steps was tried; this table, run on the shipped code with
          every clock scaled, is the check that the choice holds. It does.
        </Callout>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Play</strong> and watch the four helicopters fly the same fire, one fire tick at a
            time: the 1-step helicopter moves one cell per tick, the 4-step one four. Then switch to the{" "}
            <strong>nearest-fire chief</strong> and try a few different fires.</>}
          insight={<>On the default fire, the guard chief loses 1 village cell at 1 step per tick and 5 at 2 steps: here the
            slower helicopter did better. One fire can reverse the order. Over 500 fires on this map, the same chief keeps
            the village untouched 33% of the time at 1 step per tick, 67% at 2, 97% at 3 and 100% at 4. The lab&rsquo;s
            map, wind and dice are its own, so these are not the Python numbers — but the shape is the same.</>}
        >
          <ClockRatioLab />
        </LabFrame>

        <h3 style={h3}>What one bucket is worth at each speed</h3>
        <p>
          The <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link> measured one
          bucket&rsquo;s worth by replaying each world with the guard chief&rsquo;s first drop replaced by hovering; the
          fire&rsquo;s dice are the same in both replays, so the difference in return is exactly what that bucket bought.
          Repeated at each ratio, with every clock scaled:
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>steps per fire tick</th><th style={th}>first bucket worth</th><th style={th}>helps · no change · hurts</th><th style={th}>spread of returns (sd)</th><th style={th}>worth ÷ spread</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1</td><td style={td}>+13.15</td><td style={td}>66% · 12% · 22%</td><td style={td}>93.4</td><td style={td}>0.141</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>2 (shipped)</strong></td><td style={td}>+9.27</td><td style={td}>60% · 22% · 18%</td><td style={td}>74.1</td><td style={td}>0.125</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>3</td><td style={td}>+6.05</td><td style={td}>50% · 33% · 17%</td><td style={td}>51.2</td><td style={td}>0.118</td></tr>
              <tr><td style={td}>4</td><td style={td}>+3.00</td><td style={td}>38% · 53% · 8%</td><td style={td}>36.9</td><td style={td}>0.081</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          A faster helicopter makes any single bucket worth less — presumably because later buckets can make up for a
          missing one — and at 4 steps per tick more than half of first buckets change nothing at all. But the spread of
          returns across worlds shrinks too, so the ratio of the two, which is how clearly one good drop stands out from
          the luck of the world, stays roughly steady from 1 to 3 steps per tick (0.141 to 0.118) and drops at 4. Chapter 5 uses exactly this
          ratio to explain why the first crew learned nothing.
        </p>
        <p>
          A faster helicopter also has a cost in steps. A pilot that presses random buttons — roughly where an agent
          starts before it has learned anything — lasts 39.6 steps per episode at 1 step per tick, 79.3 at 2, 118.7 at 3
          and 157.2 at 4: nearly the same fire, stretched over more and more decisions. We have not trained crews at
          other ratios, so we cannot say how much that slows learning; only that the ratio is not free.
        </p>

        <Callout color={GOLD} title={<>How to change one clock without changing the others</>}>
          Scale the other clocks with it, in the unit you want to hold fixed, and check with a pilot that does nothing: if
          standing by changes, you changed more than you meant to. For comparison, here is the shortcut — only{" "}
          <code>fire_every</code> changed, the wind still every 30 steps and time still called at 300 (village cells
          damaged · village untouched):
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>steps per fire tick</th><th style={th}>stand by</th><th style={th}>guard, shortcut</th><th style={th}>guard, clocks scaled</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1</td><td style={td}>6.79 · 19.5%</td><td style={td}>3.09 · 47.5%</td><td style={td}>3.25 · 48%</td></tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>3</td><td style={td}>6.95 · 17%</td><td style={td}>0.21 · 92.5%</td><td style={td}>0.26 · 91%</td></tr>
                <tr><td style={td}>4</td><td style={td}>7.03 · 18%, time called in 3% of worlds</td><td style={td}>0.06 · 98.5%</td><td style={td}>0.09 · 97.5%</td></tr>
              </tbody>
            </table>
          </div>
          In this world the shortcut would have told nearly the same story. We only know that because we ran both, and the
          tell-tale was standing by: it moved, and at 4 steps per tick a 300-step limit started calling time on fires that
          were still burning.
        </Callout>

        <h2>The third clock: the wind</h2>
        <p>
          Every 30 steps the wind takes a random step: its direction moves by a normal draw with a standard deviation of
          30°, and its strength by one of 0.15, kept between 0 and 1. Those two sizes were not tuned and we did not
          measure alternatives to them. How often the wind shifts, we did measure.
        </p>

        <Callout color={GOLD} title={<>Decision record: the wind shifts every 30 steps</>}>
          Over the 200 held-out worlds (village cells damaged · village untouched):
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>the wind shifts</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>never</td><td style={td}>6.70 · 19.5%</td><td style={td}>2.57 · 64.5%</td><td style={td}>1.09 · 75.5%</td></tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>every 30 steps (shipped)</strong></td><td style={td}>6.79 · 20%</td><td style={td}>2.65 · 65%</td><td style={td}>1.03 · 77%</td></tr>
                <tr><td style={td}>every 10 steps</td><td style={td}>6.75 · 20%</td><td style={td}>2.49 · 63.5%</td><td style={td}>0.91 · 77%</td></tr>
              </tbody>
            </table>
          </div>
          An honest null: none of these pilots cares much. Part of the reason is how short their episodes are. The guard
          chief&rsquo;s episodes see 1.05 wind shifts on average, and 23.5% of them end before the first one; standing by
          sees 2.12. The other part is that neither chief reads the wind at all. We kept the shift anyway, for a reason the
          numbers above cannot test: with a fixed wind, the two wind layers at the first step would tell a crew everything
          it will ever know about the wind; with a shifting one, they are worth reading all episode. Whether a crew
          actually reads them is one of the things chapter 5 checks.
        </Callout>

        <Callout color={GOLD} title={<>A clock ratio is a difficulty dial that does not look like one</>}>
          <code>FIRE_EVERY = 2</code> sits in a list of constants next to <code>MAX_STEPS</code>, and it moves the better
          fire chief from 48% to 97.5% of villages untouched. When you build a world with systems on different schedules:
          write the schedule down, test the order inside the step with a test that reaches every ending, keep the dice
          independent of the agent, and when you change a clock, scale the others and check with a pilot that does
          nothing. One more clock is still to come: in chapter 5, how often a commander gets to re-decide.
        </Callout>

        <h2>What the next page adds</h2>
        <p>
          Every system in the world is now written, proven and connected. But the reader&rsquo;s version of the fire is
          still a loop over cells, the slow way. The next page,{" "}
          <Link href="/learn/building-environments/a-grid-you-can-vectorise" style={link}>a grid you can vectorise</Link>,
          rewrites it with whole-array operations and proves the fast version is the same world.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-helicopter", label: <>← The helicopter: logistics as a system</> }}
          next={{ href: "/learn/building-environments/a-grid-you-can-vectorise", label: <>A grid you can vectorise →</> }}
        />
      </div>
    </article>
  );
}

const codeSchedule = `# World 1002 with the helicopter hovering. After every step, look at what changed: moisture falls by DRYING
# on every fire tick (a hovering helicopter never wets anything), and the wind moves when the weather shifts.
env = Wildfire()
env.reset(seed=1002)
arrows = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
wind = lambda: f"toward {np.degrees(env.wdir):.0f} deg ({arrows[int(round(env.wdir / (np.pi / 4))) % 8]}) at {env.wspd:.2f}"
fire_row, wind_row = "", ""
for step in range(1, 37):
    M_before, wind_before = env.M.copy(), (env.wdir, env.wspd)
    if step == 30: print(f"wind before step 30: {wind()}")
    env.step(0)
    fire_row += "|" if not np.array_equal(M_before, env.M) else "."
    wind_row += "|" if (env.wdir, env.wspd) != wind_before else "."
    if step == 30: print(f"wind after step 30:  {wind()}")
print()
print("                  " + "".join(str(t // 10) if t >= 10 else " " for t in range(1, 37)))
print("            step  " + "".join(str(t % 10) for t in range(1, 37)))
print("helicopter acts   " + "|" * 36)
print("fire ticks        " + fire_row)
print("wind shifts       " + wind_row)
print()
print(f"a full episode, if time is called: {MAX_STEPS} helicopter actions, {MAX_STEPS // FIRE_EVERY} fire ticks, "
      f"{MAX_STEPS // WEATHER_EVERY} wind shifts")
both = [t for t in range(1, MAX_STEPS + 1) if t % FIRE_EVERY == 0 and t % WEATHER_EVERY == 0]
print(f"wind shifts that land on a fire tick: {len(both)} of {MAX_STEPS // WEATHER_EVERY} (steps {both[0]}, {both[1]}, ... {both[-1]})")`;

const codeStep = `def helicopter(T, S, timer, M, pos, water, a):
    "Last page's helicopter, unchanged."
    S, timer, M = S.copy(), timer.copy(), M.copy()
    r, c = pos
    put_out = 0
    if a < 5:
        dr, dc = MOVES[a]
        r, c = min(max(r + dr, 0), N - 1), min(max(c + dc, 0), N - 1)
    elif T[r, c] == LAKE:
        water = BUCKET
    elif water > 0:
        r0, r1 = max(r - DROP_R, 0), min(r + DROP_R + 1, N)
        c0, c1 = max(c - DROP_R, 0), min(c + DROP_R + 1, N)
        hit = S[r0:r1, c0:c1] == BURNING
        put_out = int(hit.sum())
        S[r0:r1, c0:c1][hit] = UNBURNT
        timer[r0:r1, c0:c1][hit] = 0
        M[r0:r1, c0:c1] = np.maximum(M[r0:r1, c0:c1], WET)
        water -= 1
    return S, timer, M, np.array([r, c]), water, put_out

def my_step(env, a):
    "One step of the whole world, built from its systems. Like env.step, it changes env in place."
    # 1. The helicopter acts first, on the map the agent was looking at when it chose a.
    env.S, env.timer, env.M, env.pos, env.water, put_out = helicopter(env.T, env.S, env.timer, env.M, env.pos, env.water, a)
    # 2. The clock advances.
    env.t += 1
    # 3. The fire moves, if its tick is due. (env.fire_tick is the rule you wrote and proved on the last two pages.)
    lit, village_lit = 0, 0
    if env.t % env.fire_every == 0:
        lit, village_lit = env.fire_tick()
    # 4. The wind shifts, if its turn is due: a random walk, drawn from the same dice as the fire.
    if env.t % env.weather_every == 0:
        env.wdir = float((env.wdir + env.rng.normal(0, np.pi / 6)) % (2 * np.pi))
        env.wspd = float(np.clip(env.wspd + env.rng.normal(0, 0.15), 0.0, 1.0))
    # 5. Only now, with every system moved, score the step and check whether the episode is over.
    reward = -lit - 10.0 * village_lit
    terminated = not (env.S == BURNING).any()
    truncated = (not terminated) and env.t >= env.max_steps
    return env.observe(), float(reward), terminated, truncated, dict(lit=lit, village_lit=village_lit, put_out=put_out)

# The test: two copies of each world with the same seed. One moves with env.step, the other with my_step.
# Same actions for both: half the time the guard chief's, half the time random. Every other world gets a short
# 40-step limit, so the test also sees time being called.
rng = np.random.default_rng(0)
steps, fire_due, wind_due, both_due, endings, first_mismatch = 0, 0, 0, 0, {"fire out": 0, "time called": 0}, None
for seed in range(1000, 1020):
    limit = MAX_STEPS if seed % 2 == 0 else 40
    env, mine = Wildfire(max_steps=limit), Wildfire(max_steps=limit)
    env.reset(seed=seed); mine.reset(seed=seed)
    chief = pilot_chief("guard")
    while True:
        a = chief(env) if rng.random() < 0.5 else int(rng.integers(6))
        o1, r1, te1, tr1, i1 = env.step(a)
        o2, r2, te2, tr2, i2 = my_step(mine, a)
        steps += 1
        fire_due += env.t % FIRE_EVERY == 0
        wind_due += env.t % WEATHER_EVERY == 0
        both_due += env.t % FIRE_EVERY == 0 and env.t % WEATHER_EVERY == 0
        if not (np.array_equal(o1, o2) and r1 == r2 and te1 == te2 and tr1 == tr2 and i1 == i2) and first_mismatch is None:
            first_mismatch = (seed, env.t)
        if te1 or tr1:
            endings["fire out" if te1 else "time called"] += 1
            break
print(f"20 worlds, {steps} steps:", "every observation, reward, ending and info identical to env.step"
      if first_mismatch is None else f"FIRST MISMATCH in world {first_mismatch[0]} at step {first_mismatch[1]}")
print(f"  steps where the fire ticked          {fire_due}")
print(f"  steps where the wind shifted         {wind_due}")
print(f"  ... and both in the same step        {both_due}")
print(f"  episodes ended: fire out {endings['fire out']}, time called {endings['time called']}")`;

const codeSameFire = `# World 1002 with a faster or slower helicopter. k = helicopter steps per fire tick. Every clock is scaled with k,
# so in FIRE ticks nothing else moves: the wind shifts every 15 fire ticks and time is called after 150.
def run(policy, k):
    env = Wildfire(fire_every=k, weather_every=15 * k, max_steps=150 * k)
    env.reset(seed=1002)
    chief = pilot_chief("guard")
    winds = []
    while True:
        wind_before = env.wdir
        _, _, terminated, truncated, _ = env.step(0 if policy == "stand by" else chief(env))
        if env.wdir != wind_before: winds.append((env.t // k, round(env.wdir, 9)))   # when, in fire ticks, and where to
        if terminated or truncated: break
    return env, winds

print("world 1002          k  steps  fire ticks  cells burnt  village cells hit  drops")
first, same = None, True
for policy in ("stand by", "guard"):
    for k in (1, 2, 3, 4):
        env, winds = run(policy, k)
        s = env.summary()
        print(f"  {policy:15s} {k}  {s['t']:5d}  {s['t'] / k:10.1f}  {s['burnt']:11d}  {s['village_damaged']:17d}  {s['drops']:5d}")
        if policy == "stand by":
            fire = (env.ever.tobytes(), winds)             # every cell that ever burned, and the whole wind history
            if first is None: first = fire
            same = same and fire == first
    print()
print("standing by, the four worlds are the same fire: same cells burnt, same wind at every shift, counted in fire ticks"
      if same else "standing by, the four fires are NOT the same")`;

const codeRatio = `# The guard chief over the 200 held-out worlds, at four helicopter speeds. As before, every clock is scaled with
# k, so each world is the same fire at every k; only the helicopter's steps per fire tick change.
print("guard the village, 200 held-out worlds")
print("  steps per fire tick   village cells damaged   village untouched   cells burnt   steps per episode")
for k in (1, 2, 3, 4):
    r = fly(pilot_chief("guard"), fire_every=k, weather_every=15 * k, max_steps=150 * k)
    print(f"  {k:19d}   {r['village_damaged']:21.2f}   {r['village_saved']:17.1%}   {r['burnt']:11.1f}   {r['steps']:17.1f}")
h = fly(lambda env: 0, fire_every=1, weather_every=15, max_steps=150)
print()
print(f"  standing by, for comparison: {h['village_damaged']:.2f} village cells damaged, {h['village_saved']:.1%} untouched, {h['burnt']:.1f} cells burnt")`;

const h3: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, color: "var(--ink)", margin: "1.6rem 0 0.5rem" };
const th: React.CSSProperties = { textAlign: "left", padding: "7px 10px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "7px 10px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
