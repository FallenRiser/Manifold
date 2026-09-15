import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { HelicopterLab } from "@/components/fire/HelicopterLab";

export const metadata = {
  title: "The helicopter: logistics as a system — Manifold",
  description:
    "Write the helicopter: fly one cell, fill over the lake, drop a 5 × 5 square of water. Its rules are simple; its job is logistics. Prove your helicopter matches the environment's on every branch, fly it yourself, and measure where a good fire chief's time goes (89% of it flying). Decision records for the starting bucket, what a doused cell becomes, bucket and drop size, and how far the lake is from the village.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheHelicopter() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 22 minutes"
        title={<>The helicopter: logistics as a system</>}
        intro={<>The fire is finished. The second system in this world is the helicopter, and its rules take about twenty
          lines: fly one cell, fill the bucket over the lake, drop the water anywhere else. What makes it hard is not
          the rules but the distances between things — where the water is, where the fire is, and how many fire ticks
          pass while you fetch one bucket. You will write it, prove it, fly it, and then measure where the time goes.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>A system with easy rules and a hard job</h2>
        <p>
          The helicopter adds two things to the environment&rsquo;s state: <code>pos</code>, the cell it is over, and{" "}
          <code>water</code>, how many drops are left in the bucket — 0 or 1, since the bucket holds one. It has six
          actions. <code>0</code> hovers; <code>1</code> to <code>4</code> fly one cell north, east, south or west; and{" "}
          <code>5</code> is a single button that fills the bucket when the helicopter is over the lake and drops the
          water anywhere else.
        </p>
        <p>
          The helicopter acts every step, and the fire moves every 2 steps. So the useful unit for thinking about the
          helicopter is not the step but the <em>trip</em>. Here is world 1002 from the brief, measured in trips.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeState} />
        <CodeOutput>{`the helicopter: row 13, column 7 (the middle of the village), bucket 1 of 1
the nearest lake cell is 12 steps away

fire at row 4, column 5:  11 steps to reach with the first bucket; every bucket after that is a 14-step round trip = 7 fire ticks
fire at row 10, column 14:  10 steps to reach with the first bucket; every bucket after that is a 14-step round trip = 7 fire ticks`}</CodeOutput>

        <p>
          Distances are counted in steps along rows and columns — the <code>steps</code> lambda adds up how many rows
          and how many columns apart two cells are, because the helicopter cannot fly diagonally. The first bucket is
          free: the helicopter starts full, over the village. Every bucket after that costs a trip to the lake, a step
          to fill, a trip back and a step to drop: 14 steps here, during which the fire advances 7 ticks. That ratio —
          how far the fire gets while one bucket is fetched — is the heart of the helicopter&rsquo;s problem, and the
          rest of this page and the next are about it.
        </p>

        <Callout color={GOLD} title={<>Decision record: the helicopter starts full, over the village</>}>
          A base at the village is the natural story, but the bucket could start empty, or the helicopter could start at
          the lake. We measured all three over the 200 held-out worlds (village cells damaged · village untouched ·
          cells burnt):
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>the helicopter starts</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...td, color: "var(--ink)" }}><strong>full, over the village (shipped)</strong></td><td style={td}>2.65 · 65% · 82.9</td><td style={td}>1.03 · 77% · 83.7</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={td}>empty, over the village</td><td style={td}>3.48 · 54.5% · 100.3</td><td style={td}>1.61 · 64.5% · 105.6</td>
                </tr>
                <tr>
                  <td style={td}>full, at the nearest lake cell</td><td style={td}>2.62 · 65.5% · 66.5</td><td style={td}>0.89 · 80.5% · 79.6</td>
                </tr>
              </tbody>
            </table>
          </div>
          The first bucket is worth a lot: starting empty costs the guard chief 12.5 points of untouched villages.
          Starting full at the lake is about the same for the nearest-fire chief and a little better for the guard
          chief (80.5% against 77%). We kept the base at the village because it is the story the brief tells and the
          measured difference from the lake start is small; we did not find a reason in the numbers to prefer either
          strongly, and we say so rather than invent one.
        </Callout>

        <h2>Piece 1: the button, and everything else</h2>
        <p>
          Here is the whole helicopter as a function. It takes the map layers, the position, the water and an action,
          and returns the new ones — it copies the layers first, so the function never changes what it was given. Read
          it top to bottom: the three branches are flying, filling and dropping, in that order.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeAct} />
        <CodeOutput>{`helicopter over row 7, column 8, bucket full -> button pressed

   before          after           moisture after, x10 (~ lake)
   x x . x . . .   x x . x . . .   0 0 0 0 1 0 ~
   x x x * * * .   x x x . . . .   0 9 9 9 9 9 ~
   x x x * * * *   x x x . . . *   0 9 9 9 9 9 0
   * * x * x x x   * . x . x x x   0 9 9 9 9 9 0
   x * * x x x x   x . . x x x x   0 9 9 9 9 9 0
   * . x x x x x   * . x x x x x   0 9 9 9 9 9 0
   . x x x x x x   . x x x x x x   0 0 0 0 0 0 0

put out 10 burning cells; bucket now 0; the button again, with an empty bucket: put out 0, map unchanged: True`}</CodeOutput>

        <p>
          A few lines carry the design. <strong>The wall:</strong>{" "}
          <code>min(max(r + dr, 0), N - 1)</code> keeps the helicopter on the map, so flying into the edge is the same
          as hovering. <strong>The square:</strong> <code>r0, r1</code> and <code>c0, c1</code> are the rows and columns
          of the 5 × 5 square around the helicopter, trimmed at the edge of the map; note the <code>+ 1</code>, because
          a Python slice stops one short of its end. <code>S[r0:r1, c0:c1][hit] = UNBURNT</code> then changes only the
          burning cells inside that square. <strong>The soak:</strong> every cell under the water, burning or not, gets
          moisture of at least 0.9 — which, as the last page measured, cuts its chance of catching to a tenth.
        </p>
        <p>
          In the demo, the drop landed on ten burning cells and put them all out. The burnt cells (<code>x</code>)
          stay burnt — water does not bring fuel back — and the burning cells in the window&rsquo;s outer columns, just
          outside the square, are still burning. Pressing the button again with an empty bucket does nothing at all.
        </p>

        <Callout color={GOLD} title={<>Decision record: a put-out cell is unburnt, not burnt</>}>
          When water hits a burning cell, the environment sets it back to <em>unburnt</em>, with its fuel. The
          alternative is to mark it <em>burnt</em> — spent, safe forever — which would make every drop a permanent
          firebreak. Unburnt is closer to what water does: it stops the burning, but whatever has not burnt yet can
          still burn once it dries. We measured whether the choice matters for the chiefs:
          <div style={{ overflowX: "auto", margin: "0.8rem 0" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                  <th style={th}>a put-out cell becomes</th><th style={th}>nearest fire</th><th style={th}>guard the village</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...td, color: "var(--ink)" }}><strong>unburnt (shipped)</strong></td><td style={td}>2.65 · 65% · 82.9</td><td style={td}>1.03 · 77% · 83.7</td>
                </tr>
                <tr>
                  <td style={td}>burnt</td><td style={td}>2.52 · 67% · 80.4</td><td style={td}>0.95 · 79% · 82.2</td>
                </tr>
              </tbody>
            </table>
          </div>
          It barely does. The guard chief puts out 13.3 cells an episode, and only 6.2% of them ever catch fire again —
          which fits the last page&rsquo;s measurement that a drop&rsquo;s moisture takes 40 fire ticks to lose half its
          effect, while a guard episode lasts about 23 fire ticks. So
          the difference between the two rules is small, and we report it as that. We kept <em>unburnt</em> because it
          is the honest model, and because it leaves the protection where it really is: in the water, which dries.
        </Callout>

        <h2>Prove it, branch by branch</h2>
        <p>
          The test follows the pattern of the last two pages, with one new idea. <strong>Switch off what you are not
          testing:</strong> <code>Wildfire(fire_every=10 ** 9)</code> gives the fire a tick only once every billion
          steps, so within an episode the helicopter is the only thing that changes the map. <strong>Same inputs on
          both sides:</strong> every action goes to your function and to <code>env.step</code>. The new idea is{" "}
          <strong>make sure every branch runs.</strong> A fire chief never flies into the wall or presses the button
          with an empty bucket, so half the actions are random — and the test counts how often each branch actually
          ran, so you can see that it did.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeTest} />
        <CodeOutput>{`20 worlds, 1602 helicopter actions: every cell, position and bucket identical to the environment's
how often each branch ran:
  hover                    132
  fly                     1253
  fly into the wall          3
  fill                      79
  drop on fire              40
  drop on nothing           45
  button, empty bucket      50`}</CodeOutput>

        <p>
          <strong>Identical, on every branch.</strong> Look at the counts before you trust that. The wall was reached
          only 3 times in 1,602 actions: if the random half had been a little less random, the wall branch might never
          have run, and the test would have passed a helicopter that flies off the map. We broke the function six ways:
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>broken version</th><th style={th}>first caught</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>square one short (no <code>+ 1</code>: a 4 × 4 drop)</td><td style={td}>world 1000, step 8</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the drop does not soak the ground</td><td style={td}>world 1000, step 8</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>a put-out cell becomes burnt</td><td style={td}>world 1000, step 43</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>no wall at the edge of the map</td><td style={td}>world 1000, step 67 — and a crash a few steps later</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the button fills an empty bucket anywhere</td><td style={td}>world 1000, step 68</td></tr>
              <tr><td style={td}>the button drops with an empty bucket</td><td style={td}>world 1000, step 68</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          All six are caught in the first world. The missing wall is the instructive one. Flying off the top of the map
          makes the row −1, and numpy reads index −1 as <em>the last row</em> — so the helicopter silently appears on
          the far side of the map and carries on. The test caught the mismatch the moment it happened; the crash only
          came later, when the helicopter flew off the bottom edge into row 16, which numpy does refuse. Without the
          comparison, the first sign of this bug would have been a crash with a message about index 16, a few steps
          after the real mistake.
        </p>

        <h2>Fly it yourself</h2>
        <p>
          The lab puts you in the pilot&rsquo;s seat on a hand-made map, with the environment&rsquo;s rules: the fire
          moves every second step, the bucket holds one drop, and the button fills or drops depending on where you are.
          The strip under the map records what every step was spent on. You can also hand the controls to either fire
          chief and watch.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Click the lab and fly with the arrow keys and space: put out the fire nearest the village, then
            go back to the lake, fill, and return. Then press <strong>Same fire again</strong> and let the{" "}
            <strong>guard-the-village chief</strong> fly the same fire. Compare the two strips.</>}
          insight={<>The fire&rsquo;s dice only roll on fire ticks, never because of anything the helicopter does, so
            &ldquo;same fire again&rdquo; really is the same fire — the only difference between your episode and the
            chief&rsquo;s is the flying. And the strip is almost all flying: the drops are single thin red marks between
            long runs to and from the lake.</>}
        >
          <HelicopterLab />
        </LabFrame>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          The lab&rsquo;s map is hand-made and flat, with a fixed gentle wind, and its dice come from a seeded generator
          in the page, so no episode here matches a Python run. The helicopter&rsquo;s rules and the fire&rsquo;s rule
          are the environment&rsquo;s.
        </p>

        <h2>Where a good fire chief&rsquo;s time goes</h2>
        <p>
          The strip in the lab is a measurement you can take properly, over the 200 held-out worlds. First, a guess.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Take the better of our two chiefs, guard the village. Of all the steps it takes, what share are spent
            actually dropping water?</>}
          options={["About half", "About a quarter", "About a tenth", "Less than a tenth"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeBudget} />
        <CodeOutput>{`guard the village, 200 worlds, 9375 steps (46.9 per episode)

  flying to the lake, bucket empty  31.0%  ###################
  filling                          4.6%  ###
  flying to a fire, bucket full   58.4%  ###################################
  dropping on fire                 6.0%  ####
  dropping on nothing burning      0.0%
  hovering                         0.0%

2.81 drops per episode, 4.77 burning cells put out per drop
between one drop and the next: 16 steps (median) = 8 fire ticks`}</CodeOutput>

        <p>
          <strong>Less than a tenth: 6.0%.</strong> Nearly nine steps in ten — 89.4% — are spent flying: 58.4% carrying
          water toward a fire and 31.0% flying back to the lake with an empty bucket. The chief makes 2.81 drops an
          episode, each putting out 4.77 burning cells, and between one drop and the next the fire gets 8 ticks. It never
          wastes a drop and never hovers while fire is burning. The nearest-fire chief looks almost the same: 7.3% of
          its steps are drops.
        </p>
        <p>
          This is what &ldquo;logistics&rdquo; means here. Most steps only carry out a choice already made — keep flying
          toward the lake, keep flying toward that fire. The choices that shape an episode come a few times per
          episode: which fire to go for with this bucket. Chapter 5 comes back to what that means for an agent that has
          to learn those choices one step at a time.
        </p>

        <h2>Decision: one bucket, and a 5 × 5 drop</h2>
        <p>
          The two numbers that set how much a helicopter can do are the bucket size (drops per fill) and the drop size.
          We measured both chiefs at every combination of a 1- or 3-drop bucket and a 3 × 3, 5 × 5 or 7 × 7 drop, over
          the 200 held-out worlds (village cells damaged · village untouched):
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>bucket</th><th style={th}>drop</th><th style={th}>nearest fire</th><th style={th}>guard the village</th><th style={th}>guard: steps per episode</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1</td><td style={td}>3 × 3</td><td style={td}>4.05 · 49%</td><td style={td}>2.64 · 58%</td><td style={td}>55.8</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={{ ...td, color: "var(--ink)" }}><strong>1</strong></td><td style={{ ...td, color: "var(--ink)" }}><strong>5 × 5 (shipped)</strong></td><td style={td}>2.65 · 65%</td><td style={td}>1.03 · 77%</td><td style={td}>46.9</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1</td><td style={td}>7 × 7</td><td style={td}>1.36 · 80.5%</td><td style={td}>0.45 · 89.5%</td><td style={td}>38.3</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>3</td><td style={td}>3 × 3</td><td style={td}>3.46 · 55%</td><td style={td}>1.47 · 73.5%</td><td style={td}>48.3</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>3</td><td style={td}>5 × 5</td><td style={td}>1.43 · 78.5%</td><td style={td}>0.35 · 91.5%</td><td style={td}>38.9</td></tr>
              <tr><td style={td}>3</td><td style={td}>7 × 7</td><td style={td}>0.54 · 90%</td><td style={td}>0.03 · 98.5%</td><td style={td}>28.3</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Either lever makes the helicopter much stronger, and together they make the world nearly solved: a 3-drop
          bucket with a 7 × 7 drop lets the guard chief keep the village untouched in 98.5% of worlds, leaving a trained
          crew nothing to improve. At the other end, a single 3 × 3 drop leaves even the better chief losing village cells in
          42% of worlds. We chose the combination that sits in the middle for the better chief — 77% untouched — so
          there is room both below it (standing by is 20%) and above it.
        </p>
        <p>
          The table cannot tell you why 5 × 5 rather than a 3-drop bucket at 3 × 3, which scores almost the same for the
          guard chief (73.5% against 77%). The reason is learning, not firefighting. Chapter 5 replays each world with one
          drop removed and compares what that drop was worth with how much episodes differ from world to world anyway.
          With the 3 × 3 drop that ratio is 0.039; with the 5 × 5 drop it is 0.125, about three times clearer. A bigger
          drop makes each decision stand out more from the noise a learner has to see through.
        </p>

        <h2>Decision: where the lake goes</h2>
        <p>
          Every map places its lake and village at random, with one rule: their centres are at least 5 cells apart. So
          the flight to water varies a lot from world to world — from 4 steps to 18, with a median of 9, measured from
          the village&rsquo;s centre to the nearest lake cell. The logistics above suggest that should matter. We split
          the 200 held-out worlds into three roughly equal groups by that distance:
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>village damaged · untouched</th><th style={th}>lake near (≤ 7 steps, 76 worlds)</th><th style={th}>middle (8–10, 58)</th><th style={th}>far (≥ 11, 66)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>stand by</td><td style={td}>6.39 · 25%</td><td style={td}>6.78 · 19%</td><td style={td}>7.24 · 15.2%</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>nearest fire</td><td style={td}>2.03 · 71.1%</td><td style={td}>2.69 · 63.8%</td><td style={td}>3.33 · 59.1%</td></tr>
              <tr><td style={td}>guard the village</td><td style={td}>0.66 · 80.3%</td><td style={td}>0.95 · 77.6%</td><td style={td}>1.55 · 72.7%</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          With the lake far away, the guard chief loses more than twice as many village cells as with the lake near:
          1.55 against 0.66. But be careful what you conclude. Standing by — no helicopter at all — is also worse with a
          far lake, 6.39 against 7.24, so part of this is the map itself: a lake near the village, and the wet ground
          around it, can slow a fire there with or without water drops. In village cells, the rise is about the same for
          standing by and for the guard chief (0.85 and 0.89); in proportion, the guard chief&rsquo;s damage more than
          doubles while standing by&rsquo;s grows by about an eighth. We have not separated the two causes, so read the
          table as &ldquo;distance to water is a difficulty dial hidden in the map generator&rdquo;, not as &ldquo;it is
          all the flying&rdquo;.
        </p>
        <p>
          We kept it random rather than fixing it, on purpose: a crew trained on these maps meets both easy and hard
          worlds. What we did <em>not</em> do is tune the 5-cell minimum; we did not
          measure a closer or farther rule, so it is a guard against a lake inside the village, not a tested value. The
          lesson for your own environments is about reporting: an average over the 200 worlds hides a spread like this
          one, so whenever a generator randomises something the job depends on, split the results by it at least once.
        </p>

        <Callout color={GOLD} title={<>In a multi-system world, the difficulty lives between the systems</>}>
          The helicopter&rsquo;s rules are simpler than the fire&rsquo;s, and it has the fewest decisions of any part of
          this world. Yet the numbers on this page that moved the chiefs most came from how the systems meet: how far
          the fire gets during one round trip, how far the water is from the thing you protect, how many drops a fill
          buys. None of that is visible in either system&rsquo;s code on its own. When you build a world with several
          systems, the numbers worth measuring first are the ones that connect them.
        </Callout>

        <h2>What the next page adds</h2>
        <p>
          World 1002&rsquo;s round trip was 14 steps: 7 fire ticks. That ratio came from one line of the brief — the
          fire advances every 2 steps. The{" "}
          <Link href="/learn/building-environments/wildfire-brief" style={link}>brief</Link> promised to measure what
          happens when you change it, and the next page does:{" "}
          <Link href="/learn/building-environments/coupled-clocks" style={link}>coupled clocks</Link>, and what a world
          with systems on different schedules does to the helicopter, the fire and the agent.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/wind-moisture-and-slope", label: <>← Wind, moisture and slope</> }}
          next={{ href: "/learn/building-environments/coupled-clocks", label: <>Coupled clocks →</> }}
        />
      </div>
    </article>
  );
}

const codeState = `env = Wildfire()
env.reset(seed=1002)
steps = lambda a, b: int(np.abs(np.array(a) - np.array(b)).sum())   # one cell per step, no diagonals
lake = np.argwhere(env.T == LAKE)
nearest_lake = lambda p: min(steps(p, l) for l in lake)

print(f"the helicopter: row {env.pos[0]}, column {env.pos[1]} (the middle of the village), bucket {env.water} of {BUCKET}")
print(f"the nearest lake cell is {nearest_lake(env.pos)} steps away")
print()
for f in np.argwhere(env.S == BURNING):
    there = steps(env.pos, f)
    sortie = nearest_lake(f) + 1 + nearest_lake(f) + 1        # to the lake, fill, back to the fire, drop
    print(f"fire at row {f[0]}, column {f[1]}:  {there} steps to reach with the first bucket;"
          f" every bucket after that is a {sortie}-step round trip = {sortie // FIRE_EVERY} fire ticks")`;

const codeAct = `def helicopter(T, S, timer, M, pos, water, a):
    "One helicopter action. Returns the new map layers, position, water, and how many burning cells it put out."
    S, timer, M = S.copy(), timer.copy(), M.copy()
    r, c = pos
    put_out = 0
    if a < 5:                                            # 0 hover, 1-4 fly one cell north, east, south, west
        dr, dc = MOVES[a]
        r, c = min(max(r + dr, 0), N - 1), min(max(c + dc, 0), N - 1)   # the edge of the map is a wall
    elif T[r, c] == LAKE:                                # the button, over the lake: fill the bucket
        water = BUCKET
    elif water > 0:                                      # the button, anywhere else: drop, if there is water
        r0, r1 = max(r - DROP_R, 0), min(r + DROP_R + 1, N)
        c0, c1 = max(c - DROP_R, 0), min(c + DROP_R + 1, N)
        hit = S[r0:r1, c0:c1] == BURNING
        put_out = int(hit.sum())
        S[r0:r1, c0:c1][hit] = UNBURNT                   # put out, NOT burnt: the cell still has its fuel
        timer[r0:r1, c0:c1][hit] = 0
        M[r0:r1, c0:c1] = np.maximum(M[r0:r1, c0:c1], WET)   # and everything under the water is soaked
        water -= 1
    return S, timer, M, np.array([r, c]), water, put_out

# World 1002 after the fire has had 12 ticks to grow. Put the helicopter on a burning cell and press the button.
env = Wildfire(); env.reset(seed=1002)
for _ in range(12):
    env.fire_tick()
fire = np.argwhere(env.S == BURNING)
pos = fire[np.abs(fire - 7.5).max(1).argmin()]          # the burning cell farthest from the map's edges
S, timer, M, pos2, water, put_out = helicopter(env.T, env.S, env.timer, env.M, pos, 1, 5)
r, c = pos
window = lambda layer: layer[max(r - 3, 0):r + 4, max(c - 3, 0):c + 4]
show = lambda S: [" ".join(".*x"[v] for v in row) for row in window(S)]
print(f"helicopter over row {r}, column {c}, bucket full -> button pressed")
print()
print("   before          after           moisture after, x10 (~ lake)")
for b, a_, m in zip(show(env.S), show(S), window(M)):
    print(f"   {b}   {a_}   {' '.join('~' if v == 1 else str(int(v * 10)) for v in m)}")
print()
print(f"put out {put_out} burning cells; bucket now {water}; the button again, with an empty bucket:", end=" ")
S3, _, _, _, water3, put_out3 = helicopter(env.T, S, timer, M, pos2, water, 5)
print(f"put out {put_out3}, map unchanged: {np.array_equal(S3, S)}")`;

const codeTest = `def helicopter(T, S, timer, M, pos, water, a):
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

# The test: freeze the fire, so the helicopter is the only thing that changes the map. Then act in the
# environment and in your function side by side, half the time like a fire chief and half the time at random.
rng = np.random.default_rng(0)
seen = {"hover": 0, "fly": 0, "fly into the wall": 0, "fill": 0, "drop on fire": 0, "drop on nothing": 0, "button, empty bucket": 0}
steps, first_mismatch = 0, None
for seed in range(1000, 1020):
    env = Wildfire(fire_every=10 ** 9); env.reset(seed=seed)   # a fire tick every billion steps: never, here
    chief = pilot_chief("nearest")
    S, timer, M, pos, water = env.S.copy(), env.timer.copy(), env.M.copy(), env.pos.copy(), env.water
    while True:
        a = chief(env) if rng.random() < 0.5 else int(rng.integers(6))
        if a == 0: kind = "hover"
        elif a < 5: kind = "fly into the wall" if np.array_equal(np.clip(pos + MOVES[a], 0, N - 1), pos) else "fly"
        elif env.T[tuple(pos)] == LAKE: kind = "fill"
        elif water == 0: kind = "button, empty bucket"
        else: kind = "drop"                              # on fire or on nothing: we find out below
        S, timer, M, pos, water, put_out = helicopter(env.T, S, timer, M, pos, water, a)
        _, _, terminated, truncated, info = env.step(a)
        if kind == "drop": kind = "drop on fire" if put_out else "drop on nothing"
        seen[kind] += 1
        steps += 1
        same = (np.array_equal(S, env.S) and np.array_equal(timer, env.timer) and np.array_equal(M, env.M)
                and np.array_equal(pos, env.pos) and water == env.water and put_out == info["put_out"])
        if not same and first_mismatch is None: first_mismatch = (seed, env.t)
        if terminated or truncated: break
print(f"20 worlds, {steps} helicopter actions:", "every cell, position and bucket identical to the environment's"
      if first_mismatch is None else f"FIRST MISMATCH {first_mismatch}")
print("how often each branch ran:")
for k, v in seen.items():
    print(f"  {k:22s} {v:5d}")`;

const codeBudget = `# Where does a good fire chief's time go? Classify every step of the guard chief, over the 200 held-out worlds.
names = ["flying to the lake, bucket empty", "filling", "flying to a fire, bucket full", "dropping on fire",
         "dropping on nothing burning", "hovering"]
counts = dict.fromkeys(names, 0)
drops, put_out, gaps = 0, 0, []
for seed in range(1000, 1200):
    env = Wildfire(); env.reset(seed=seed)
    chief = pilot_chief("guard")
    last_drop = None
    while True:
        a = chief(env)
        if a == 0:
            kind = "hovering"
        elif a < 5:
            kind = "flying to the lake, bucket empty" if env.water == 0 else "flying to a fire, bucket full"
        elif env.T[tuple(env.pos)] == LAKE:
            kind = "filling"
        else:
            kind = "dropping"
        _, _, terminated, truncated, info = env.step(a)
        if kind == "dropping":
            kind = "dropping on fire" if info["put_out"] else "dropping on nothing burning"
            drops += 1; put_out += info["put_out"]
            if last_drop is not None: gaps.append(env.t - last_drop)
            last_drop = env.t
        counts[kind] += 1
        if terminated or truncated: break

total = sum(counts.values())
print(f"guard the village, 200 worlds, {total} steps ({total / 200:.1f} per episode)")
print()
for k in names:
    print((f"  {k:30s} {counts[k] / total:6.1%}  " + "#" * round(60 * counts[k] / total)).rstrip())
print()
print(f"{drops / 200:.2f} drops per episode, {put_out / drops:.2f} burning cells put out per drop")
print(f"between one drop and the next: {np.median(gaps):.0f} steps (median) = {np.median(gaps) / FIRE_EVERY:.0f} fire ticks")`;

const th: React.CSSProperties = { textAlign: "left", padding: "7px 10px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "7px 10px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
