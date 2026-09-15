import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { FireFactorsLab } from "@/components/fire/FireFactorsLab";

export const metadata = {
  title: "Wind, moisture and slope — Manifold",
  description:
    "Switch the fire's three factors back on: wind (and which way is which), moisture that a water drop leaves behind, and slope. Each is one multiplier that is exactly 1 when it is off. The equivalence test passes again with nothing switched off, six broken versions are caught, and two measurements surprise: with the wind off an unattended village does worse, and the wind decides which worlds can be saved at all.",
};

const GOLD = "var(--c-rl)";

export default function WindMoistureAndSlope() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 24 minutes"
        title={<>Wind, moisture and slope</>}
        intro={<>Last page&rsquo;s fire burned on a dry, calm, flat map, because we switched three things off to test the
          rule on its own. This page switches them back on, one at a time. Each one is a single multiplier on the chance
          you already compute, and the direction question from last page comes back with a sharper edge. Then the test
          runs again with nothing switched off — and the wind turns out to do something none of the totals would have
          told you.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Three multipliers on one chance</h2>
        <p>
          Last page, a burning neighbour lit a cell with chance <code>SPREAD[T]</code>, times 0.7 for a corner. The
          environment&rsquo;s full rule multiplies in three more numbers:
        </p>
        <pre style={formula}>p = SPREAD[T] × (1 − M) × wind × slope × corner</pre>
        <p>
          <code>(1 − M)</code> is the moisture of the cell that might catch. <code>wind</code> depends on which way the
          fire is travelling compared with the wind. <code>slope</code> depends on whether it is travelling uphill or
          down. Each one is exactly 1 when its effect is switched off — no moisture, no wind, flat ground — which is
          why last page&rsquo;s test could run this very function and get the plain rule.
        </p>

        <Callout color={GOLD} title={<>Decision record: multiply the factors, don&rsquo;t add them</>}>
          The alternative is bonuses: start from the base chance and <em>add</em> a little for wind, a little for slope.
          Multiplying wins on three counts. <strong>Nothing lights what cannot burn:</strong> rock and lake have a base
          chance of 0, and 0 times anything stays 0, while an added wind bonus would need a special case to keep rock
          from catching. <strong>Each factor scales with the fuel:</strong> a strong wind makes grass and forest both
          several times likelier to catch, instead of adding the same amount to both. <strong>Each factor can be tested
          alone,</strong> by setting the others to 1, which is what last page did. The price is that a product can pass
          1 — strong wind, uphill, dry grass — so the environment clips it. We counted how often that happens: in 200
          held-out worlds with nobody flying, 522 of 503,956 ignition attempts, or 0.10%. The clip is a guard, not
          something that shapes the fire.
        </Callout>

        <h2>Piece 1: wind, and which way is which</h2>
        <p>
          The environment stores the wind as two numbers. <code>wspd</code> is its strength, from 0 to 1.{" "}
          <code>wdir</code> is the angle it blows <em>toward</em>, measured clockwise from north. On the map, north is
          the top row, and rows count <em>downward</em>, so one step north is row −1. That is why the code turns the
          angle into a grid step with a minus sign: <code>wr, wc = -np.cos(wdir), np.sin(wdir)</code>.
        </p>
        <p>
          For each direction a fire could travel, <code>(dr, dc)</code>, the code measures how well it lines up with the
          wind: +1 straight downwind, 0 across it, −1 straight into it. The chance is multiplied by e raised to 1.5 ×
          strength × that alignment. Here are all eight directions for a full-strength wind blowing north — and then the
          environment&rsquo;s own fire in that wind.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeWind} />
        <CodeOutput>{`wind toward north, speed 1.0: one step of it on the grid is (row -1, column +0)

  fire travelling north       (dr, dc) = (-1, +0)   along the wind +1.00   chance x 4.48
  fire travelling north-east  (dr, dc) = (-1, +1)   along the wind +0.71   chance x 2.89
  fire travelling east        (dr, dc) = (+0, +1)   along the wind +0.00   chance x 1.00
  fire travelling south-east  (dr, dc) = (+1, +1)   along the wind -0.71   chance x 0.35
  fire travelling south       (dr, dc) = (+1, +0)   along the wind -1.00   chance x 0.22
  fire travelling south-west  (dr, dc) = (+1, -1)   along the wind -0.71   chance x 0.35
  fire travelling west        (dr, dc) = (+0, -1)   along the wind +0.00   chance x 1.00
  fire travelling north-west  (dr, dc) = (-1, -1)   along the wind +0.71   chance x 2.89

the environment's fire after 4 ticks, per fire:  north of the start 21.77 cells   south 1.51`}</CodeOutput>

        <p>
          Fire travelling north gets 4.48 times its chance, and fire travelling south gets 0.22 of it — the same factor,
          4.48, in each direction. After 4 ticks the environment&rsquo;s fire has reached 21.77 cells north of where it
          started and only 1.51 south.
        </p>
        <p>
          Now last page&rsquo;s <code>nr, nc = r - dr, c - dc</code> earns its place. A cell asks its neighbours whether
          they will light it, and the neighbour that sends fire travelling north into a cell is the one to its{" "}
          <em>south</em>. Write <code>r + dr</code> instead and the cell looks at its northern neighbour but still
          multiplies by the factor for travelling north. That fire is travelling south, into the wind, and it gets the
          downwind boost. Nothing crashes. The fire just runs upwind, and the map looks perfectly plausible. The test
          below catches it on the very first tick.
        </p>

        <Callout color={GOLD} title={<>Decision record: an exponential wind factor</>}>
          The obvious alternative is a straight line, 1 + k × alignment. It has a flaw built in: straight into the wind
          it gives 1 − k, which goes negative once k passes 1, so k has to stay below 1 — and then fire straight downwind
          can never be even twice as likely as in calm air. The exponential has no such limit, and it treats the two
          directions evenly: whatever it multiplies downwind by, it divides upwind by. At strength 0 it is exactly 1,
          and it is never negative. The gain of 1.5 makes a full wind multiply straight-downwind spread by 4.48, and we
          checked what shape of fire that produces: one fire in a large, dry, flat grass field, 8 ticks, 4,000 fires.
          In calm air it reaches 3.46 cells in each direction. With a full wind, it reaches 8.00 cells downwind — one
          cell every tick, as fast as this rule allows, because 0.24 × 4.48 is more than 1 on bone-dry grass — and only
          0.68 upwind. That is the long, downwind-running fire that wind-driven fires are known for. How strong the wind
          should be is its own decision, measured at the end of the page.
        </Callout>

        <h2>Piece 2: moisture</h2>
        <p>
          <code>M</code> is a 16 × 16 layer between 0 and 1. The map starts dry, 0.10 to 0.20, wetter close to the lake,
          and the lake itself is 1. Two things change it during an episode. Every fire tick, every cell dries by 0.01,
          down to a floor of 0.05. And a water drop from the helicopter leaves 0.9 on every cell of its square. The fire
          uses <code>1 − M</code> of the cell that might catch, so here is what those numbers mean, and how a drop
          wears off.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeMoisture} />
        <CodeOutput>{`moisture: the chance is multiplied by (1 - M) of the cell that might catch
  M = 0.05   chance x 0.950   as dry as it gets
  M = 0.165  chance x 0.835   a typical cell at the start
  M = 0.9    chance x 0.100   just hit by a water drop
  M = 1.0    chance x 0.000   the lake

a cell after a water drop:
   0 fire ticks later   M = 0.90   chance x 0.10
  20 fire ticks later   M = 0.70   chance x 0.30
  40 fire ticks later   M = 0.50   chance x 0.50
  60 fire ticks later   M = 0.30   chance x 0.70
  85 fire ticks later   M = 0.05   chance x 0.95
  90 fire ticks later   M = 0.05   chance x 0.95`}</CodeOutput>

        <p>
          A drop cuts a cell&rsquo;s chance of catching to a tenth. It is half gone after 40 fire ticks, and completely
          gone after 85, when the cell is back to the floor. The fire moves every 2 helicopter steps, so 40 fire ticks
          is 80 steps — while the guard-the-village chief&rsquo;s episodes last 46.9 steps on average. For that chief,
          the water from a drop is still doing most of its work when the fire goes out.
        </p>
        <p>
          The drop also does one more thing, which the helicopter page builds on: a burning cell it hits is put out,
          not burnt. That cell is unburnt again, with fuel, and it can catch again. Its wet 0.9 is the only thing
          keeping it from doing so.
        </p>

        <Callout color={GOLD} title={<>Decision record: moisture belongs to the cell that might catch, and it dries</>}>
          <p style={{ margin: "0 0 0.6rem" }}>
            <strong>Whose moisture.</strong> The factor could have used the burning neighbour&rsquo;s moisture instead —
            a damp fire spreads less. We chose the target&rsquo;s because of what a drop is for. A line of wet cells
            should be a firebreak: fire arriving at it should struggle to cross. If the burning cell&rsquo;s moisture
            counted, a fire burning in dry grass would light a freshly soaked cell at full chance, and dropping water
            ahead of a fire would do nothing.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Why it dries.</strong> With no drying, one drop would be a permanent firebreak, and the
            map&rsquo;s starting moisture would never fade either. We measured three drying rates over the 200 held-out
            worlds (village cells damaged · village untouched · cells burnt):
          </p>
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>drying per fire tick</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={td}>0 (never dries)</td><td style={td}>6.11 · 26% · 154.1</td><td style={td}>2.12 · 69.5% · 71.7</td><td style={td}>0.87 · 80.5% · 72.3</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...td, color: "var(--ink)" }}><strong>0.01 (shipped)</strong></td><td style={td}>6.79 · 20% · 169.4</td><td style={td}>2.65 · 65% · 82.9</td><td style={td}>1.03 · 77% · 83.7</td>
                </tr>
                <tr>
                  <td style={td}>0.03</td><td style={td}>7.12 · 16.5% · 175.8</td><td style={td}>3.02 · 61% · 90.9</td><td style={td}>1.40 · 73.5% · 93.4</td>
                </tr>
              </tbody>
            </table>
          </div>
          Faster drying makes the world a little harder for everyone, in the same direction for all three. The rate is
          a difficulty dial with a modest range, not a switch that changes who wins, and we tried three values, not a
          sweep. What it cannot sensibly be is zero, for the reason above.
        </Callout>

        <h2>Piece 3: slope</h2>
        <p>
          <code>E</code> is the elevation layer, a smooth set of hills scaled so the lowest cell on the map is 0 and the
          highest is 1. Fire runs uphill faster, because the flames lean over the ground above them and heat it before
          they arrive. The rule multiplies by e raised to 4 × rise, where the rise is the height of the cell that might
          catch minus the height of the burning neighbour — and keeps the result between 0.5 and 2.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeSlope} />
        <CodeOutput>{`slope: chance x e^(4 * rise), kept between 0.5 and 2
rise = height of the cell that might catch, minus the height of the burning neighbour
  rise -0.300   e^(4 * rise) = 0.30   after the clip x 0.50
  rise -0.100   e^(4 * rise) = 0.67   after the clip x 0.67
  rise +0.000   e^(4 * rise) = 1.00   after the clip x 1.00
  rise +0.100   e^(4 * rise) = 1.49   after the clip x 1.49
  rise +0.173   e^(4 * rise) = 2.00   after the clip x 2.00
  rise +0.300   e^(4 * rise) = 3.32   after the clip x 2.00

on the real maps, neighbour to neighbour: half the rises are under 0.056 (chance x 1.25 uphill)
the clip changes 3.4% of them; the steepest is 0.300`}</CodeOutput>

        <p>
          The line <code>shift(env.E, dr, dc, np.nan)</code> is last page&rsquo;s direction convention in array form:
          at every cell it puts the height of the neighbour at <code>(r - dr, c - dc)</code>, the one that would send
          fire in direction <code>(dr, dc)</code>. So <code>env.E - shift(...)</code> is exactly the rise the rule uses,
          for every cell at once. The hills are gentle: half of all neighbour-to-neighbour rises are under 0.056, which
          makes uphill spread 1.25 times likelier, and the clip only changes 3.4% of them.
        </p>

        <Callout color={GOLD} title={<>Decision record: slope is the weakest factor, and we say so</>}>
          We expected slope to matter about as much as the other two. It does not. Here it is switched off, as shipped,
          and with the gain doubled, over the 200 held-out worlds (village cells damaged · village untouched · cells
          burnt):
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>slope</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={td}>off</td><td style={td}>6.97 · 18% · 179.7</td><td style={td}>2.42 · 67.5% · 76.8</td><td style={td}>0.83 · 81% · 81.2</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...td, color: "var(--ink)" }}><strong>gain 4 (shipped)</strong></td><td style={td}>6.79 · 20% · 169.4</td><td style={td}>2.65 · 65% · 82.9</td><td style={td}>1.03 · 77% · 83.7</td>
                </tr>
                <tr>
                  <td style={td}>gain 8</td><td style={td}>6.64 · 20.5% · 164.8</td><td style={td}>2.50 · 65% · 80.2</td><td style={td}>1.01 · 79% · 80.7</td>
                </tr>
              </tbody>
            </table>
          </div>
          Switching slope off changes the guard chief&rsquo;s damage by 0.2 of a village cell. Doubling it changes nothing
          we can tell apart from the shipped world. We kept it because it costs one line and gives the elevation layer
          — one of the twelve the crew sees — a real, if small, meaning. But a reader should not expect a crew to win by
          reading the hills, and we would rather say that now than let the layer&rsquo;s presence suggest otherwise.
        </Callout>

        <h2>Play with the factors</h2>
        <p>
          The lab runs the full rule on a grass field with a hill in the top right, starting at moisture 0.165. The arrow
          is the wind; the numbers around it are the wind&rsquo;s multiplier for fire travelling each way, the same
          numbers as the table above. Hover any unburnt cell next to the fire to see every factor for every burning
          neighbour.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Play</strong> with the wind blowing north. Then press <strong>Same dice again</strong>,
            turn the wind to <strong>south</strong> and play the same fire. Finally, choose the <strong>water drop</strong>{" "}
            tool, blow the wind north-east, and drop a line of water right across the map ahead of the fire before you
            play. Watch the hill, too.</>}
          insight={<>The same dice give two different fires: the fire runs downwind first and creeps upwind later, so
            the wind decides where the damage starts. A wet line cuts the moisture factor from 0.835 to 0.1 and slows the
            fire badly, but it dries by 0.01 every tick, and in the lab&rsquo;s own runs the fire still gets across a
            line like that about two times in three — while burning about half as much of the map. And the hill? You
            will struggle to see it do anything, which is the slope decision above, showing up in the lab.</>}
        >
          <FireFactorsLab />
        </LabFrame>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          The lab&rsquo;s dice come from a seeded generator in the page, not numpy&rsquo;s, and its map is all grass
          with one hill and even moisture, so no single fire here matches a Python run. The rule and every multiplier
          do.
        </p>

        <h2>Assemble it — and prove it again</h2>
        <p>
          The full rule changes last page&rsquo;s code in two places. <code>catch_chance</code> now needs the moisture,
          the heights and the wind, and computes the three factors for every burning neighbour.{" "}
          <code>my_fire_tick</code> also returns the new moisture layer, dried by one tick. The test is last
          page&rsquo;s, with the switches removed: real hills, real moisture, real wind. It still calls{" "}
          <code>env.fire_tick()</code> directly, so the wind stays as the map was dealt; the environment changes the
          weather inside <code>step</code>, on a clock of its own, which gets its own page.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeFull} />
        <CodeOutput>{`10 worlds, 349 fire ticks: every cell, timer and moisture identical to the environment's
with wind, moisture and slope, nobody flying, the fire burns 157.5 of 256 cells`}</CodeOutput>

        <p>
          <strong>Identical again</strong>, on every cell, timer and moisture value, for 349 ticks. And the same worlds
          that burned 204.7 cells when dry, calm and flat now burn 157.5. With all three factors on at once, the fire
          ends up smaller overall; the last two sections take the factors apart to see which does what.
        </p>
        <p>
          As last page, a test only counts if it can fail. We broke the function six ways and ran the same test:
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>broken version</th><th style={th}>first caught</th><th style={th}>cells burnt, 10 worlds</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>correct</strong></td><td style={td}>—</td><td style={td}>157.5</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the neighbour at <code>r + dr</code> (fire runs upwind and downhill)</td><td style={td}>tick 1</td><td style={td}>171.2</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>wind angle measured from east, not north</td><td style={td}>tick 1</td><td style={td}>183.1</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>slope the wrong way (downhill faster)</td><td style={td}>tick 1</td><td style={td}>172.3</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>no drying</td><td style={td}>tick 1</td><td style={td}>142.7</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>moisture of the burning cell, not the one catching</td><td style={td}>tick 2</td><td style={td}>158.2</td></tr>
              <tr><td style={td}>slope not clipped</td><td style={td}>7th world, 219 ticks into the test</td><td style={td}>157.5</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Two rows are worth a second look. Using the burning cell&rsquo;s moisture moved the total by less than one
          cell — nobody flies in this test, so there are no wet firebreaks for the mistake to break. And the missing
          slope clip left the total <em>exactly</em> unchanged; the clip touches 3.4% of neighbour pairs, and in these
          10 worlds the first time it decided a die was 219 ticks in. Only comparing every cell on every tick finds a
          bug like that. A test on the totals would have passed it.
        </p>

        <h2>Decision: wind that feeds the fire, not only steers it</h2>
        <p>
          The eight wind multipliers do not average to 1. Downwind, the chance is multiplied by 4.48; upwind, it is only
          cut to 0.22 of what it was, and on a chance of 0.24 the gain is far bigger than the loss. So a wind does not
          just push the fire one way — it makes it bigger. The alternative is to divide the eight multipliers by their
          average, so the wind only redirects the fire. We measured both: the same open field as before, and the 200
          held-out worlds.
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>one fire, open field, 8 ticks</th><th style={th}>reach downwind</th><th style={th}>upwind</th><th style={th}>across</th><th style={th}>cells reached</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>calm</td><td style={td}>3.46</td><td style={td}>3.47</td><td style={td}>3.50</td><td style={td}>58.0</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>full wind that feeds (shipped)</strong></td><td style={td}>8.00</td><td style={td}>0.68</td><td style={td}>2.72</td><td style={td}>96.5</td></tr>
              <tr><td style={td}>full wind that only steers</td><td style={td}>6.84</td><td style={td}>0.24</td><td style={td}>1.09</td><td style={td}>50.8</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>200 held-out worlds</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>wind feeds (shipped)</strong></td><td style={td}>6.79 · 20% · 169.4</td><td style={td}>2.65 · 65% · 82.9</td><td style={td}>1.03 · 77% · 83.7</td></tr>
              <tr><td style={td}>wind only steers</td><td style={td}>5.58 · 30.5% · 138.3</td><td style={td}>1.51 · 79% · 55.0</td><td style={td}>0.53 · 87.5% · 57.4</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          A steering-only wind does not just remove the extra growth. In the open field it gives a <em>smaller</em> fire
          than no wind at all, 50.8 cells against 58.0. It moves chance out of the other seven directions and into the
          downwind one, and a likely reason for the shrinkage is that the downwind edge can advance at most one cell
          per tick, so extra chance there buys less than it costs elsewhere — we measured the shrinkage, not the
          reason. In the
          real worlds it makes the job much easier — the guard chief keeps the village untouched in 87.5% of worlds.
          We kept the feeding wind for two reasons: real wind speeds a fire up overall rather than only redirecting it,
          and a steering-only wind leaves too little room between a good hand-written rule and a perfect one.
        </p>

        <h2>Decision: how much wind, and what it is for</h2>
        <p>
          The wind&rsquo;s gain of 1.5 is the last dial. Before the table, a prediction.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Switch the wind off completely, and let nobody fly. Over the 200 held-out worlds, does the village end
            up better or worse off than in the shipped, windy world?</>}
          options={["Better — nothing is driving the fire at it", "Worse", "About the same"]}
        />

        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>wind gain</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>0 (no wind)</td><td style={td}>7.74 · 8.5% · 190.9</td><td style={td}>1.34 · 77.5% · 64.3</td><td style={td}>0.36 · 87.5% · 68.7</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>1.5 (shipped)</strong></td><td style={td}>6.79 · 20% · 169.4</td><td style={td}>2.65 · 65% · 82.9</td><td style={td}>1.03 · 77% · 83.7</td></tr>
              <tr><td style={td}>3</td><td style={td}>5.93 · 30.5% · 151.4</td><td style={td}>2.81 · 65% · 87.7</td><td style={td}>2.18 · 68% · 95.3</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>Worse: 7.74 village cells damaged with no wind, against 6.79.</strong> And more wind leaves the
          unattended village <em>better</em> off still, 5.93 at gain 3. Yet for the two chiefs, the same change runs the
          other way: with no wind, guarding the village keeps it untouched in 87.5% of worlds, and a strong wind drags
          that down to 68%. One dial, pushing the numbers in opposite directions depending on who is flying.
        </p>
        <p>
          The explanation is <em>where</em> the wind blows. We split the worlds by their starting wind. &ldquo;Toward
          the village&rdquo; means the wind blows within 60° of the line from at least one of the fires to the village
          (100 worlds). &ldquo;Away&rdquo; means it blows more than 90° away from every such line (68 worlds). The other
          32 are in between.
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>village damaged · untouched</th><th style={th}>stand by</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>shipped wind, blowing toward the village</td><td style={td}>8.53 · 3%</td><td style={td}>4.49 · 42%</td><td style={td}>1.97 · 58%</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>shipped wind, blowing away</td><td style={td}>3.99 · 47.1%</td><td style={td}>0.13 · 97.1%</td><td style={td}><strong>0.00 · 100%</strong></td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>no wind, same worlds that would blow toward</td><td style={td}>7.85 · 9%</td><td style={td}>1.40 · 78%</td><td style={td}>0.43 · 86%</td></tr>
              <tr><td style={td}>no wind, same worlds that would blow away</td><td style={td}>7.54 · 10.3%</td><td style={td}>1.19 · 77.9%</td><td style={td}>0.13 · 92.6%</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          With the wind blowing away from the village, the guard chief kept it untouched in all 68 worlds, and even
          standing by kept it untouched in almost half. With the wind blowing toward it, the better chief managed 58%.
          Without wind, the same two groups of worlds come out nearly alike — the split is the wind, not the maps.
          That is our reading of the prediction: a windless fire spreads out in every direction, so it reaches the
          village in most worlds; a windy one runs hard in one direction, and whether that direction is toward the
          village largely decides the episode.
        </p>
        <p>
          Here is the part that matters for chapter 5. Neither chief looks at the wind at all: both rules use only where
          the fires and the helicopter are. The wind is in the crew&rsquo;s observation, as two of its twelve layers,
          and it carries a lot of information about which fire will reach the village. That is where a crew that reads
          the wind <em>could</em> do better than these rules. Whether a trained crew actually does is a question for
          chapter 5, not something this table promises. We set the gain to 1.5 as a wind strong enough to decide
          worlds, with the guard chief still saving most of them. As before, we tried three values, so read it as
          &ldquo;strong enough&rdquo;, not as the best setting. The wind also shifts every 30 steps, so the starting
          wind is not the whole story.
        </p>

        <Callout color={GOLD} title={<>A factor can push the numbers in opposite directions, depending on who is flying</>}>
          Measured with nobody flying, the wind looks like it makes the world <em>easier</em>: less of the village
          burns. Measured with a sensible fire chief, it makes the world much harder. Both are true, and only the second
          is about the problem you are building the environment for. When you tune a factor in your own world, measure
          it against the policies you care about — at least a do-nothing baseline <em>and</em> a sensible hand-written
          rule — never the do-nothing world alone.
        </Callout>

        <h2>What the next page adds</h2>
        <p>
          The fire is now the environment&rsquo;s fire, with every factor on. The next page builds the other system in
          this world: the helicopter. It has one bucket, a lake it must fly back to, and a square of water it drops —
          the 0.9 moisture from this page is what keeps a doused cell from catching again. Building that system is
          mostly about logistics — where the water is, and what it costs to fetch it.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/fire-as-a-cellular-automaton", label: <>← Fire as a cellular automaton</> }}
          next={{ href: "/learn/building-environments/the-helicopter", label: <>Next · The helicopter: logistics as a system →</> }}
        />
      </div>
    </article>
  );
}

const codeWind = `wdir, wspd = 0.0, 1.0                                # the wind blows TOWARD the top row, at full strength
wr, wc = -np.cos(wdir), np.sin(wdir)                 # the same wind as a step on the grid: (-1, 0) is one row up
names = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"]
print(f"wind toward north, speed {wspd}: one step of it on the grid is (row {wr:+.0f}, column {wc:+.0f})")
print()
for (dr, dc), name in zip(DIRS, names):
    along = (dr * wr + dc * wc) / math.hypot(dr, dc) + 0.0   # +1 straight downwind, -1 straight into it (+ 0.0 prints -0 as 0)
    wind = np.exp(WIND_GAIN * wspd * along)
    print(f"  fire travelling {name:10s}  (dr, dc) = ({dr:+d}, {dc:+d})   along the wind {along:+.2f}   chance x {wind:.2f}")

# Now the environment's own fire: one fire in a dry, flat grass field, that wind, 4 fire ticks, 100 times.
north = south = 0
for seed in range(100):
    env = Wildfire(); env.reset(seed=seed)
    env.T[:] = GRASS; env.E[:] = 0.0; env.S[:] = UNBURNT; env.timer[:] = 0
    env.S[8, 8] = BURNING; env.timer[8, 8] = BURN_TIME[GRASS]
    env.wdir, env.wspd = wdir, wspd
    for _ in range(4):
        env.M[:] = 0.0
        env.fire_tick()
    north += (env.S[:8] != UNBURNT).sum(); south += (env.S[9:] != UNBURNT).sum()
print()
print(f"the environment's fire after 4 ticks, per fire:  north of the start {north / 100:.2f} cells   south {south / 100:.2f}")`;

const codeMoisture = `print("moisture: the chance is multiplied by (1 - M) of the cell that might catch")
for M, what in ((0.05, "as dry as it gets"), (0.165, "a typical cell at the start"), (0.9, "just hit by a water drop"), (1.0, "the lake")):
    print(f"  M = {M:<5}  chance x {1 - M:.3f}   {what}")

env = Wildfire(); env.reset(seed=1002)
env.M[0, 0] = WET                                    # what a drop leaves behind
after = {0: env.M[0, 0]}
for t in range(1, 91):
    env.fire_tick()                                  # every tick, the environment dries every cell a little
    after[t] = env.M[0, 0]
print()
print("a cell after a water drop:")
for t in (0, 20, 40, 60, 85, 90):
    print(f"  {t:2d} fire ticks later   M = {after[t]:.2f}   chance x {1 - after[t]:.2f}")`;

const codeSlope = `print("slope: chance x e^(4 * rise), kept between 0.5 and 2")
print("rise = height of the cell that might catch, minus the height of the burning neighbour")
for rise in (-0.30, -0.10, 0.0, 0.10, 0.173, 0.30):
    raw = np.exp(SLOPE_GAIN * rise)
    print(f"  rise {rise:+.3f}   e^(4 * rise) = {raw:.2f}   after the clip x {np.clip(raw, 0.5, 2.0):.2f}")

rises = []
for seed in range(1000, 1200):                       # the 200 held-out maps
    env = Wildfire(); env.reset(seed=seed)
    for dr, dc in DIRS:
        rise = env.E - shift(env.E, dr, dc, np.nan)  # each cell minus the neighbour at (r - dr, c - dc)
        rises.append(np.abs(rise[~np.isnan(rise)]))
rises = np.concatenate(rises)
print()
print(f"on the real maps, neighbour to neighbour: half the rises are under {np.median(rises):.3f} (chance x {np.exp(SLOPE_GAIN * np.median(rises)):.2f} uphill)")
print(f"the clip changes {np.mean(rises > np.log(2) / SLOPE_GAIN):.1%} of them; the steepest is {rises.max():.3f}")`;

const codeFull = `def catch_chance(T, S, M, E, wdir, wspd, r, c):
    "Last page's rule, with wind, moisture and slope switched back on."
    if S[r, c] != UNBURNT or not FLAMMABLE[T[r, c]]:
        return 0.0
    wr, wc = -np.cos(wdir), np.sin(wdir)
    not_lit = 1.0
    for dr, dc in DIRS:
        nr, nc = r - dr, c - dc                      # the burning neighbour sends fire in direction (dr, dc)
        if 0 <= nr < N and 0 <= nc < N and S[nr, nc] == BURNING:
            dist = math.hypot(dr, dc)
            wind = np.exp(WIND_GAIN * wspd * (dr * wr + dc * wc) / dist)
            slope = np.clip(np.exp(SLOPE_GAIN * (E[r, c] - E[nr, nc])), 0.5, 2.0)
            p = SPREAD[T[r, c]] * (1 - M[r, c]) * wind * slope * (DIAGONAL if dist > 1 else 1.0)
            not_lit *= 1 - min(p, 1.0)                   # strong wind uphill can push p past 1
    return 1 - not_lit

def my_fire_tick(T, S, timer, M, E, wdir, wspd, rng):
    dice = rng.random((N, N))
    new_S, new_timer = S.copy(), timer.copy()
    for r in range(N):
        for c in range(N):
            if S[r, c] == BURNING:
                new_timer[r, c] -= 1
                if new_timer[r, c] <= 0:
                    new_S[r, c] = BURNT
            elif dice[r, c] < catch_chance(T, S, M, E, wdir, wspd, r, c):
                new_S[r, c] = BURNING
                new_timer[r, c] = BURN_TIME[T[r, c]]
    new_M = np.where(T == LAKE, 1.0, np.maximum(M - DRYING, 0.05))   # every cell dries a little
    return new_S, new_timer, new_M

# The test from last page, with nothing switched off: real hills, real wind, real moisture.
ticks, first_mismatch, burnt = 0, None, []
for seed in range(1000, 1010):
    env = Wildfire(); env.reset(seed=seed)
    mine = np.random.default_rng()
    mine.bit_generator.state = env.rng.bit_generator.state
    S, timer, M = env.S.copy(), env.timer.copy(), env.M.copy()
    while (S == BURNING).any():
        env.fire_tick()
        S, timer, M = my_fire_tick(env.T, S, timer, M, env.E, env.wdir, env.wspd, mine)
        ticks += 1
        same = np.array_equal(S, env.S) and np.array_equal(timer, env.timer) and np.array_equal(M, env.M)
        if not same and first_mismatch is None: first_mismatch = (seed, ticks)
    burnt.append(int((S == BURNT).sum()))
print(f"10 worlds, {ticks} fire ticks:", "every cell, timer and moisture identical to the environment's" if first_mismatch is None
      else f"FIRST MISMATCH {first_mismatch}")
print(f"with wind, moisture and slope, nobody flying, the fire burns {np.mean(burnt):.1f} of 256 cells")`;

const formula: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 14.5, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", overflowX: "auto", color: "var(--ink)" };
const th: React.CSSProperties = { textAlign: "left", padding: "7px 10px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "7px 10px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
