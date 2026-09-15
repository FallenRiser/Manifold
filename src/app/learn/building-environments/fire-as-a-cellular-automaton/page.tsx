import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { FireRuleLab } from "@/components/fire/FireRuleLab";

export const metadata = {
  title: "Fire as a cellular automaton — Manifold",
  description:
    "Write the wildfire's spread rule yourself: three layers of state, one cell's chance of catching (0.840 with eight burning neighbours, not 1.632), fuel that runs out, and a test that runs your fire beside the environment's for 433 ticks with identical results. Plus three decisions, each measured: update all cells at once, roll a die for every cell every tick, and weight the corners by 0.7.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FireAsACellularAutomaton() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 22 minutes"
        title={<>Fire as a cellular automaton</>}
        intro={<>The fire is the heart of this world, and it is built from one small rule: a cell looks at its eight
          neighbours and rolls a die. You will write that rule, run it, and then prove it is the same fire the
          environment uses — cell for cell, tick for tick. Along the way, three lines that look like housekeeping turn
          out to be decisions, and each gets measured.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>A world made of cells that only look next door</h2>
        <p>
          A <strong>cellular automaton</strong> is a grid where every cell has a small state, and time moves in ticks.
          On every tick, each cell works out its next state from two things only: its own state and the states of the
          cells touching it. Nothing looks further away, and every cell makes that decision at the same moment. Conway&rsquo;s
          Game of Life is the famous example; a spreading fire is one of the most natural.
        </p>
        <p>
          The rule for our fire, in words: <em>a burning cell may set each unburnt neighbour alight, and then burns out
          after its fuel is gone</em>. Everything interesting — fronts, fingers of flame running up a strip of grass, a
          fire starving against rock — comes out of that sentence, run 256 times per tick.
        </p>

        <Callout color={GOLD} title={<>Decision record: a grid of cells, not a fire front</>}>
          The alternative is what fire services actually use. Operational fire models, many built on Rothermel&rsquo;s
          1972 spread equation, compute how fast a continuous fire <em>front</em> advances, from fuel, wind and slope,
          in real units. We did not choose that, for three reasons. <strong>What the crew sees</strong> has to be an
          array the learner can read, and a grid of cells already is one: most of the twelve layers on the brief are
          the automaton&rsquo;s own state, copied out. <strong>Speed:</strong> training will run this fire millions of times, and a
          grid rule is a handful of array operations per tick. <strong>Testability:</strong> a rule that only looks
          next door can be checked one cell at a time, which is exactly what this page does. The price is realism,
          and we pay it knowingly — as the brief said, this world is tuned for what it teaches, not calibrated
          against real fires.
        </Callout>

        <h2>Piece 0: the state</h2>
        <p>
          Each cell carries three numbers, stored as three 16 × 16 arrays on the environment. <code>T</code> says what
          the cell <em>is</em> — grass, forest, rock, lake or village — and never changes during an episode.{" "}
          <code>S</code> says what the fire is doing there: unburnt, burning or burnt. And <code>timer</code> counts
          the fire ticks a burning cell has left before its fuel runs out. Here are all three around the first fire in
          world 1002, the map from the brief.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeState} />
        <CodeOutput>{`the 5 x 5 cells around the fire at row 4, column 5:

  T  what the cell is     S  what the fire is doing     timer  ticks left
  1 1 1 1 1            0 0 0 0 0                   0 0 0 0 0
  1 1 1 1 1            0 0 0 0 0                   0 0 0 0 0
  1 1 1 1 2            0 0 1 0 0                   0 0 5 0 0
  2 1 1 1 1            0 0 0 0 0                   0 0 0 0 0
  1 1 1 1 1            0 0 0 0 0                   0 0 0 0 0

T: 0 grass  1 forest  2 rock  3 lake  4 village      S: 0 unburnt  1 burning  2 burnt`}</CodeOutput>

        <p>
          One forest cell burning, with 5 ticks of fuel, in a forest with two rocks nearby. Notice what is{" "}
          <em>not</em> in the state. &ldquo;Burnt&rdquo; lives in <code>S</code>, not in <code>T</code>: a burnt
          forest cell is still forest as far as the map is concerned, which keeps the map layer fixed and makes
          &ldquo;how much forest did we lose&rdquo; a one-line question. And there is no amount of fuel or heat, just
          a countdown. The timer <em>is</em> the fuel, in the only unit the rule needs: how many more ticks this cell
          can threaten its neighbours.
        </p>

        <h2>Piece 1: one cell&rsquo;s chance of catching</h2>
        <p>
          Take a single unburnt cell. Each burning neighbour gets one attempt to light it this tick. How likely that
          attempt is depends on what the <em>target</em> cell is made of — grass catches with chance 0.24, forest
          0.128, the village 0.16, rock and lake never. Neighbours touching only at a corner are farther away, centre
          to centre, so their chance is multiplied by 0.7.
        </p>
        <p>
          The one real question is how several attempts combine. Suppose a grass cell is completely surrounded by fire.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>A grass cell has all eight neighbours burning. Each side neighbour alone would light it with chance
            0.24, each corner neighbour with 0.168. What is the chance it catches this tick?</>}
          options={["Certain — the chances add up past 1", "About 5 in 6", "About 2 in 3", "Still about 1 in 4"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeChance} />
        <CodeOutput>{`grass, one burning neighbour to the north:       0.240
grass, one burning neighbour to the north-west:  0.168
grass, all eight neighbours burning:             0.840   (adding the eight chances would say 1.632)
forest, all eight neighbours burning:            0.603
rock, all eight neighbours burning:              0.000`}</CodeOutput>

        <p>
          <strong>About 5 in 6: 0.840.</strong> Adding the eight chances gives 1.632, which is not a probability at
          all. The function computes it the right way round. A cell stays unburnt only if <em>every</em> neighbour
          fails, so it multiplies the chances of failure — 0.76 four times for the sides, 0.832 four times for the
          corners — to get 0.160, and the chance of catching is what is left. That product is the line{" "}
          <code>not_lit *= 1 - p</code>, and the whole function is built around it.
        </p>
        <p>
          Two lines deserve a closer look. <code>nr, nc = r - dr, c - dc</code> finds the neighbour that would spread{" "}
          <em>into</em> this cell in direction <code>(dr, dc)</code>: fire moving south, <code>(1, 0)</code>, arrives
          from the cell to the north. That sounds like a detail, but the next page adds wind, where the direction a
          fire travels is exactly what matters, and getting the sign backwards would make fire spread fastest{" "}
          <em>into</em> the wind. And the first line returns 0 for anything already burning, burnt, rock or lake, so
          the rest of the function only ever deals with cells that could catch.
        </p>

        <Callout color={GOLD} title={<>Decision record: each neighbour is an independent try</>}>
          Multiplying failures assumes each neighbour&rsquo;s attempt is independent of the others. The alternatives
          are all worse for this world. <strong>Adding the chances</strong> breaks as soon as a cell has four or five
          burning neighbours, and capping the sum at 1 would make a cell with seven burning neighbours exactly as
          doomed as one with five. <strong>Counting neighbours against a threshold</strong> — catch if three or more
          are burning — throws the dice away and makes the fire deterministic, so every episode from the same
          ignitions would be identical and there would be nothing for a crew to be uncertain about. Independent tries
          give the behaviour you would sketch on paper: one neighbour is a risk, a ring of fire is nearly certain, and
          no amount of fire makes it exactly certain.
        </Callout>

        <h2>Piece 2: fuel runs out</h2>
        <p>
          When a cell catches, its timer is set to how long its fuel lasts: 2 ticks for grass, 5 for forest, 4 for the
          village. On every tick after that, the cell is burning — so it gets to try its neighbours — and its timer
          drops by one. When the timer reaches zero, the cell is burnt, permanently. So a burning cell gets exactly as
          many tries at each neighbour as its fuel lasts.
        </p>
        <p>
          That gives the contrast between grass and forest a twist worth seeing in numbers. Grass catches easily but
          is quickly spent; forest is slow to catch but, once alight, keeps trying for five ticks. A grass cell beside
          one burning neighbour on its side, with nothing else burning, ends up catching with chance{" "}
          1 − 0.76<sup>2</sup> = <strong>0.422</strong> if that neighbour is grass, and 1 − 0.76<sup>5</sup> ={" "}
          <strong>0.746</strong> if it is forest. We checked that arithmetic against the environment&rsquo;s own fire,
          4,000 times each: 0.416 and 0.749. <em>A forest fire is the more dangerous neighbour, even though forest is
          the harder thing to light.</em>
        </p>

        <Callout color={GOLD} title={<>Decision record: how strong the fire is, and why the 0.8</>}>
          The chances in the code are written as <code>[0.30, 0.16, 0, 0, 0.20] * 0.8</code>. The first list sets the
          contrast — grass catches about twice as easily as forest, the village in between — and that contrast is a
          modelling choice, not a measurement of real fuel. The 0.8 is a single dial for how aggressive the whole fire
          is, and that one we set by measuring. Here are the two hand-written fire chiefs from the brief at three
          settings, over the 200 held-out worlds (village cells damaged · village untouched · cells burnt):
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>fire strength</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={td}>× 1.0</td><td style={td}>7.90 · 9% · 202.5</td><td style={td}>3.96 · 50% · 114.3</td><td style={td}>1.87 · 65% · 118.2</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...td, color: "var(--ink)" }}><strong>× 0.8 (shipped)</strong></td><td style={td}>6.79 · 20% · 169.4</td><td style={td}>2.65 · 65% · 82.9</td><td style={td}>1.03 · 77% · 83.7</td>
                </tr>
                <tr>
                  <td style={td}>× 0.6</td><td style={td}>4.93 · 37% · 119.2</td><td style={td}>1.12 · 82.5% · 43.4</td><td style={td}>0.39 · 90% · 46.4</td>
                </tr>
              </tbody>
            </table>
          </div>
          At × 0.6 the fire is weak enough that the better chief keeps the village untouched in 90% of worlds, which
          leaves little room for a trained crew to show it learned anything. At × 1.0 standing by loses the village
          almost every time, and even the better chief leaves it untouched in only 65% of worlds. × 0.8 keeps both
          kinds of room: a big gap between doing nothing and a good rule, and a village still damaged in almost a
          quarter of worlds by the better of the two chiefs. We tried these three values, not a fine sweep, so read 0.8 as &ldquo;a strength that leaves
          room&rdquo;, not as an optimum.
        </Callout>

        <h2>Play with the rule</h2>
        <p>
          Before assembling the tick, get a feel for it. The lab runs the rule you just wrote on a dry, calm, flat map —
          the same three conditions the test below uses. The number on each cell is its chance of catching on the next
          tick, computed by the same arithmetic as <code>catch_chance</code>; hover any cell to see the multiplication.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Step the fire a few ticks and hover a cell on the edge of the flames. Then press <strong>Play</strong>{" "}
            and watch the front reach the forest on the right. Finally, switch the update to <strong>in place, row by
            row</strong> and step once.</>}
          insight={<>The front is ragged because every cell rolls its own die. On the forest cells the numbers drop to
            roughly half the grass values, but once a forest cell is alight it keeps its fire for five ticks. Then the in-place update breaks the physics in a single tick: the fire runs
            south and east, the directions the loop sweeps in, far faster than north and west. The next section measures
            exactly that.</>}
        >
          <FireRuleLab />
        </LabFrame>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          The lab&rsquo;s dice come from a seeded generator in the page, not numpy&rsquo;s, so no single fire here
          matches a Python run. The rule and every chance on the cells do.
        </p>

        <h2>Assemble it — and prove it</h2>
        <p>
          A full tick is two jobs for every cell. A burning cell uses up a tick of fuel, and becomes burnt if it has
          none left. Any other cell rolls its die against <code>catch_chance</code>. The crucial detail is{" "}
          <em>which</em> map those decisions read: every cell looks at <code>S</code>, the map as it was at the start
          of the tick, and writes into <code>new_S</code>. Read the function, then the test beneath it, then run both.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeTick} />
        <CodeOutput>{`10 worlds, 433 fire ticks: every cell identical to the environment's fire
a dry, calm, flat world with nobody flying burns 204.7 of 256 cells`}</CodeOutput>

        <p>
          <strong>Your fire is the environment&rsquo;s fire.</strong> Across 10 held-out maps and 433 ticks, every
          cell&rsquo;s state and every timer matched, exactly. The test is built from three ideas you will reuse on
          every page of this world.
        </p>
        <p>
          <strong>Switch off what you have not written yet.</strong> The environment&rsquo;s fire also has wind,
          moisture and slope, which are the next page. Flattening the ground, stopping the wind and drying every cell
          makes each of those factors exactly 1, so the environment runs this page&rsquo;s rule and nothing else. We
          reset the moisture before every tick because the environment&rsquo;s tick raises every cell to at least
          0.05 as it goes.
        </p>
        <p>
          <strong>Give both fires the same dice.</strong> A random rule can only be compared exactly if both sides
          roll the same numbers. <code>mine.bit_generator.state = env.rng.bit_generator.state</code> copies the
          environment&rsquo;s random generator, mid-stream, into a second one. From then on, each 16 × 16 grid of rolls
          is identical on both sides — which works only because both roll exactly one grid per tick. The environment
          also rolls for the weather inside <code>step</code>, so the test calls <code>env.fire_tick()</code> directly
          and leaves the helicopter and the weather out.
        </p>
        <p>
          <strong>Make sure the test can fail.</strong> A test that always passes proves nothing, so we broke the
          function three ways and ran it again. Corners weighted 0.71 instead of 0.7: caught at tick 3. Chances added
          instead of multiplied: caught at tick 4. Writing into the map being read: caught at tick 1. Comparing every
          cell on every tick matters: with the corners at 0.71, the total burnt across the 10 worlds only moved from
          204.7 to 206.0 cells, a difference nobody would notice, but the first changed cell was caught at tick 3.
        </p>

        <h2>Decision: every cell reads the old map</h2>
        <p>
          The environment updates all 256 cells as if at the same instant. The obvious way to write the loop does not:
          sweep the rows, change each cell as you reach it, and let later cells see the changes. It is one line
          different, and it compiles, runs and produces a fire that looks like a fire. Here is what it does to one
          fire in the middle of a grass field, after 3 ticks, 100 times.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeInPlace} />
        <CodeOutput>{`all at once (shipped)   cells reached, per fire:  north  3.40   south  3.70   west  3.69   east  3.50
in place, row by row    cells reached, per fire:  north  5.18   south 23.14   west  9.98   east 17.62`}</CodeOutput>

        <p>
          Updated all at once, the fire spreads the same in every direction, to within the noise of 100 fires. Updated
          in place, it reaches 23.14 cells to the south and only 5.18 to the north. The loop goes top to bottom and left
          to right, so a cell set alight early in the sweep can light the cell below it in the <em>same</em> tick, and
          that one the next, and so on down the map. Nothing like that can happen northward: those cells have
          already had their turn. Fire can run many cells south in a single tick, while going north still takes a tick
          per cell.
        </p>
        <p>
          Now imagine this bug in a world you are training a crew in. Nothing crashes. The fire is just faster going
          south and east, and a trained crew might well learn to guard the south side of the village more than the north —
          a strategy that looks like wisdom and is actually the loop order. That is why the assembled tick writes into a
          copy, and why the test compares with the environment on the very first tick.
        </p>

        <h2>Decision: one die for every cell, every tick</h2>
        <p>
          <code>dice = rng.random((N, N))</code> rolls 256 numbers every tick, even though most cells have no burning
          neighbour and ignore theirs. Rolling only for the cells that could catch looks tidier and does fewer random
          draws. We chose the wasteful version on purpose, and it is the decision that makes chapter 5 possible.
        </p>
        <p>
          The brief promised a trick: replay a world with one decision changed, and measure exactly what that decision
          was worth. We did that for the guard-the-village chief on all 200 held-out worlds — once as normal, once
          with its first water drop replaced by hovering — under both ways of rolling. With a die for every cell, the
          two replays roll identical numbers on every tick, so they differ only where the drop actually changed the
          fire. With dice rolled only where needed, a drop that puts out a few cells changes <em>which</em> cells roll,
          so from then on the rolls land on different cells and the two replays drift into different fires.
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>how the fire rolls</th><th style={th}>first drop worth, on average</th><th style={th}>spread of the paired difference</th><th style={th}>paired worlds for ±1</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, color: "var(--ink)" }}><strong>a die for every cell (shipped)</strong></td><td style={td}>+9.27</td><td style={td}>sd 26.9</td><td style={td}>about 724</td>
              </tr>
              <tr>
                <td style={td}>dice only where needed</td><td style={td}>+10.87</td><td style={td}>sd 47.8</td><td style={td}>about 2,290</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The value is in the reward&rsquo;s units: −1 for every cell that catches, −10 more for a village cell. Both
          ways agree that one drop is worth roughly ten, but the paired differences scatter almost twice as widely when
          the dice drift. To pin the value of one drop to within ±1 (one standard error), you would need about 724
          paired worlds with the shipped dice, and about 2,290 without — three times the work to learn the same
          thing. Rolling 256 numbers a tick costs almost nothing by comparison.
        </p>

        <h2>Decision: eight neighbours, corners at 0.7</h2>
        <p>
          A cell has four neighbours that share a side and four that share only a corner. The two obvious alternatives
          are to ignore the corners, or to treat them like sides. We measured all three, with one fire in the middle of
          a larger 41 × 41 grass field so the edge never interferes, after 8 ticks, 4,000 fires each. &ldquo;Reach&rdquo;
          is the farthest cell the fire got to along a line from the start, in cell widths; a perfectly round fire would
          reach equally far along the diagonals as along the rows and columns.
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>neighbours</th><th style={th}>reach along rows and columns</th><th style={th}>reach along diagonals</th><th style={th}>diagonal ÷ straight</th><th style={th}>cells reached</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>4 sides only</td><td style={td}>1.13</td><td style={td}>0.92</td><td style={td}>0.82</td><td style={td}>12.8</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, color: "var(--ink)" }}><strong>8, corners × 0.7 (shipped)</strong></td><td style={td}>3.48</td><td style={td}>3.28</td><td style={td}>0.94</td><td style={td}>58.0</td>
              </tr>
              <tr>
                <td style={td}>8, corners × 1</td><td style={td}>4.49</td><td style={td}>4.35</td><td style={td}>0.97</td><td style={td}>85.9</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We expected the 0.7 to be about shape — that without it, the fire would grow as a square. The measurement
          says otherwise, and we report it as it came out. <strong>Corners at full strength give the roundest fire of
          the three</strong> (0.97), not the squarest. A fire that caught every neighbour every tick would be a perfect
          square, but at these chances the dice blur the corners away. Ignoring the corners does distort the shape — a
          diamond, 0.82 — and it also makes the fire far slower.
        </p>
        <p>
          So what the 0.7 really sets is <em>speed along the diagonals</em>: 58.0 cells reached after 8 ticks, against
          85.9 with full-strength corners. The value comes from geometry, not tuning: a corner neighbour is √2 ≈ 1.41
          times as far away, centre to centre, and 0.7 is close to 1/√2. We checked that the difference is too small
          to matter — 1/√2 exactly gives the same 0.94, and 58.6 cells — and kept the rounder number.
        </p>

        <Callout color={GOLD} title={<>A decision you expected to be about one thing may be about another</>}>
          The corner weight was chosen for a reason that sounded obviously right — keep the fire round — and the
          measurement showed that reason was mostly wrong, while the choice itself was still fine for a different
          reason. That is the normal outcome of measuring your own design decisions, not an embarrassment. Write down
          what you believed, measure it, and keep the record either way: the next person to change that constant will
          otherwise &ldquo;fix&rdquo; the shape and quietly change the speed of every fire in the world.
        </Callout>

        <h2>What the next page adds</h2>
        <p>
          Your fire spreads, burns out and matches the environment — but only on a dry, calm, flat map, because this
          page switched off three factors to test the rule on its own. The{" "}
          <Link href="/learn/building-environments/wildfire-brief" style={link}>brief</Link>&rsquo;s world has all
          three. The next page switches them back on one at a time: wind that pushes the fire downwind, moisture that
          damps it, and slope that drives it uphill — and the one-line direction question from Piece 1 comes back.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/wildfire-brief", label: <>← The brief: one helicopter, one village</> }}
          next={{ href: "/learn/building-environments/wind-moisture-and-slope", label: <>Next · Wind, moisture and slope →</> }}
        />
      </div>
    </article>
  );
}

const codeState = `env = Wildfire()
env.reset(seed=1002)
r, c = np.argwhere(env.S == BURNING)[0]              # the first of the two fires
rows, cols = slice(r - 2, r + 3), slice(c - 2, c + 3)   # the 5 x 5 cells around it
print(f"the 5 x 5 cells around the fire at row {r}, column {c}:")
print()
print("  T  what the cell is     S  what the fire is doing     timer  ticks left")
for i in range(5):
    line = lambda layer: " ".join(str(v) for v in layer[rows, cols][i])
    print(f"  {line(env.T)}            {line(env.S)}                   {line(env.timer)}")
print()
print("T: 0 grass  1 forest  2 rock  3 lake  4 village      S: 0 unburnt  1 burning  2 burnt")`;

const codeChance = `def catch_chance(T, S, r, c):
    "The chance that cell (r, c) catches fire this tick, from its burning neighbours."
    if S[r, c] != UNBURNT or not FLAMMABLE[T[r, c]]:
        return 0.0
    not_lit = 1.0                                    # the chance that NO neighbour lights it
    for dr, dc in DIRS:                              # the 8 directions, clockwise from north
        nr, nc = r - dr, c - dc                      # the neighbour that would spread into (r, c) this way
        if 0 <= nr < N and 0 <= nc < N and S[nr, nc] == BURNING:
            p = SPREAD[T[r, c]] * (DIAGONAL if dr and dc else 1.0)
            not_lit *= 1 - p                         # ...and this one fails too
    return 1 - not_lit

T = np.full((N, N), GRASS)
S = np.full((N, N), UNBURNT)
S[7, 8] = BURNING
print(f"grass, one burning neighbour to the north:       {catch_chance(T, S, 8, 8):.3f}")
S[:] = UNBURNT; S[7, 7] = BURNING
print(f"grass, one burning neighbour to the north-west:  {catch_chance(T, S, 8, 8):.3f}")
S[7:10, 7:10] = BURNING; S[8, 8] = UNBURNT
print(f"grass, all eight neighbours burning:             {catch_chance(T, S, 8, 8):.3f}"
      f"   (adding the eight chances would say {4 * SPREAD[GRASS] + 4 * SPREAD[GRASS] * DIAGONAL:.3f})")
T[8, 8] = FOREST
print(f"forest, all eight neighbours burning:            {catch_chance(T, S, 8, 8):.3f}")
T[8, 8] = ROCK
print(f"rock, all eight neighbours burning:              {catch_chance(T, S, 8, 8):.3f}")`;

const codeTick = `def catch_chance(T, S, r, c):
    if S[r, c] != UNBURNT or not FLAMMABLE[T[r, c]]:
        return 0.0
    not_lit = 1.0
    for dr, dc in DIRS:
        nr, nc = r - dr, c - dc
        if 0 <= nr < N and 0 <= nc < N and S[nr, nc] == BURNING:
            not_lit *= 1 - SPREAD[T[r, c]] * (DIAGONAL if dr and dc else 1.0)
    return 1 - not_lit

def my_fire_tick(T, S, timer, rng):
    "One tick. Every cell reads the map as it was at the START of the tick, and writes into a new one."
    dice = rng.random((N, N))                        # one roll for every cell, every tick
    new_S, new_timer = S.copy(), timer.copy()
    for r in range(N):
        for c in range(N):
            if S[r, c] == BURNING:                   # a burning cell uses up one tick of fuel
                new_timer[r, c] -= 1
                if new_timer[r, c] <= 0:
                    new_S[r, c] = BURNT
            elif dice[r, c] < catch_chance(T, S, r, c):   # anything else may catch
                new_S[r, c] = BURNING
                new_timer[r, c] = BURN_TIME[T[r, c]]
    return new_S, new_timer

# The test: run YOUR fire beside the environment's, on the same maps, with the same dice.
ticks, first_mismatch, burnt = 0, None, []
for seed in range(1000, 1010):
    env = Wildfire(); env.reset(seed=seed)
    env.E[:] = 0.0; env.wspd = 0.0                   # flat land and no wind: the next page's effects, off
    mine = np.random.default_rng()
    mine.bit_generator.state = env.rng.bit_generator.state   # a second generator, in the same state
    S, timer = env.S.copy(), env.timer.copy()
    while (S == BURNING).any():
        env.M[:] = 0.0                               # bone dry, every tick
        env.fire_tick()
        S, timer = my_fire_tick(env.T, S, timer, mine)
        ticks += 1
        same = np.array_equal(S, env.S) and np.array_equal(timer, env.timer)
        if not same and first_mismatch is None: first_mismatch = (seed, ticks)
    burnt.append(int((S == BURNT).sum()))
print(f"10 worlds, {ticks} fire ticks:", "every cell identical to the environment's fire" if first_mismatch is None
      else f"FIRST MISMATCH {first_mismatch}")
print(f"a dry, calm, flat world with nobody flying burns {np.mean(burnt):.1f} of 256 cells")`;

const codeInPlace = `def catch_chance(T, S, r, c):
    if S[r, c] != UNBURNT or not FLAMMABLE[T[r, c]]:
        return 0.0
    not_lit = 1.0
    for dr, dc in DIRS:
        nr, nc = r - dr, c - dc
        if 0 <= nr < N and 0 <= nc < N and S[nr, nc] == BURNING:
            not_lit *= 1 - SPREAD[T[r, c]] * (DIAGONAL if dr and dc else 1.0)
    return 1 - not_lit

def fire_tick(T, S, timer, rng, in_place=False):
    dice = rng.random((N, N))
    new_S, new_timer = S.copy(), timer.copy()
    if in_place:
        S = new_S                                    # the bug, in one line: read the map you are writing
    for r in range(N):
        for c in range(N):
            if S[r, c] == BURNING:
                new_timer[r, c] -= 1
                if new_timer[r, c] <= 0:
                    new_S[r, c] = BURNT
            elif dice[r, c] < catch_chance(T, S, r, c):
                new_S[r, c] = BURNING
                new_timer[r, c] = BURN_TIME[T[r, c]]
    return new_S, new_timer

# One fire in the middle of a grass field. Which way has it gone after 3 ticks?
T = np.full((N, N), GRASS)
for in_place in (False, True):
    reached = np.zeros(4)                            # north, south, west, east of the starting cell
    for seed in range(100):
        rng = np.random.default_rng(seed)
        S = np.full((N, N), UNBURNT); timer = np.zeros((N, N), int)
        S[8, 8] = BURNING; timer[8, 8] = BURN_TIME[GRASS]
        for _ in range(3):
            S, timer = fire_tick(T, S, timer, rng, in_place)
        hit = S != UNBURNT
        reached += [hit[:8].sum(), hit[9:].sum(), hit[:, :8].sum(), hit[:, 9:].sum()]
    n, s, w, e = reached / 100
    name = "in place, row by row" if in_place else "all at once (shipped)"
    print(f"{name:22s}  cells reached, per fire:  north {n:5.2f}   south {s:5.2f}   west {w:5.2f}   east {e:5.2f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "7px 10px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "7px 10px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
