import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { RaceReplay } from "@/components/sail/RaceReplay";
import { HeadingRose } from "@/components/sail/HeadingRose";
import { LearningFilmstrip } from "@/components/sail/LearningFilmstrip";
import { TACK_RACES } from "@/components/sail/data/tackRaces";

export const metadata = {
  title: "The agent invents tacking — Manifold",
  description:
    "Train the boat that ships and read what it does. Nobody told it about tacking, yet only 1.3% of its upwind sailing is within 30° of the wind: it zig-zags, beating at a median 52.3° against the oracle's 49.5°. Five runs finish 156–191 races of 200 — and most of the failures are near misses that stall within metres of the mark.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheAgentInventsTacking() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 15 minutes"
        title={<>The agent invents tacking</>}
        intro={<>The world, the view and the reward are all decided. This is stage 5: train the boat that ships, and then
          do the part people skip — look at what it actually does on the water. The question the whole world was built to
          ask is simple. Nothing in the environment mentions tacking. Does the agent find it anyway?</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Train it, then look</h2>
        <p>
          The cell trains the shipped configuration — distance-gained reward, penalised edge, the relative view, 2000
          practice races — and then examines the frozen boat three ways: its race statistics, where it points while
          working upwind, and a picture of its first two held-out races. Those two races are simply the first two in the
          test set; they were not picked for looking good, and one of them does not.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>While the mark is still upwind, what share of the trained boat&rsquo;s sailing time is spent within 30° of
            the wind — roughly pointing at the mark?</>}
          options={["Most of it", "About a third", "Almost none", "Exactly zero"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeTack} />
        <CodeOutput>{`trained boat: rounded 156 / 200, mean 59.4 s, 1.28 tacks per race, beats upwind at a median 52.3 deg
for comparison: the polar's best angle 49.5 deg; the expert 48.3 s, 1.00 tacks

share of beating seconds spent at each heading:
   -80 to  -70  ####                            4.3%
   -70 to  -60  ############                   11.9%
   -60 to  -50  ##########                      9.7%
   -50 to  -40  ####################           20.0%
   -40 to  -30  ########                        8.4%
   -30 to  -20                                  0.1%
   -20 to  -10                                  0.0%
   -10 to   +0                                  0.0%
    +0 to  +10                                  0.3%
   +10 to  +20                                  0.4%
   +20 to  +30                                  0.5%
   +30 to  +40  ##########                     10.0%
   +40 to  +50  ######                          6.2%
   +50 to  +60  ######                          6.4%
   +60 to  +70  #####                           5.1%
   +70 to  +80  ####                            4.4%
  beyond +/-80 deg: 12.3%

held-out race 0: 53 s, 1 tack(s), rounded the mark
  wind v v v     one character = 1.7 m across, 4.3 m up
  +--------------------------------------------------------+
  |                                                        |
  |                                  /*    M               |
  |                              -5///                     |
  |                         //-//-                         |
  |                     --/--                              |
  |                /-4-/                                   |
  |               3/                                       |
  |                \\\\\\                                     |
  |                  \\\\\\                                   |
  |                    \\\\2\\                                |
  |                       \\\\\\\\                             |
  |                          \\\\\\\\\\\\                        |
  |                               \\\\\\1                     |
  |                                  \\\\\\                   |
  |                                     \\\\\\                |
  |                                       \\S               |
  |                                                        |
  +--------------------------------------------------------+
  S start   M mark   * end   1-5: where the boat was every 10 s

held-out race 1: 200 s, 2 tack(s), ran out of time
  wind v v v     one character = 2.0 m across, 5.0 m up
  +--------------------------------------------------------+
  |                                                        |
  |                             /-------\\                  |
  |                           ///        \\\\\\               |
  |                        //2/      M     \\|              |
  |                     ///4\\               |              |
  |                 /////   \\\\             //              |
  |              ////        \\\\\\\\-      ////               |
  |              |\\               -----3-                  |
  |               \\\\1                                      |
  |                 \\\\\\\\                                   |
  |                    \\\\\\                                 |
  |                      \\\\\\                               |
  |                         \\\\\\                            |
  |                           \\\\\\\\                         |
  |                              \\\\\\\\                      |
  |                                 \\S                     |
  |                                                        |
  +--------------------------------------------------------+
  S start   M mark   * end   1-8: where the boat was every 25 s
  (a mark you cannot find is under an earlier digit: the boat was already there)`}</CodeOutput>

        <h2>Reading 1: the histogram is the proof</h2>
        <p>
          Look at the middle of the bar chart. Between −30° and +30° — the dead zone, where pointing at the mark would
          put the boat — there is almost nothing: <strong>1.3% of all its upwind sailing time</strong>. Either side of
          that gap are two humps, one on each tack, with the tallest bar at −50° to −40°. That shape is tacking. The boat
          learned that the direct route does not work, that sailing at an angle does, and that it has to use both sides
          of the wind to arrive. No line of the environment says any of that; all the boat ever had was its heading, the
          mark&rsquo;s bearing and distance band, and the distance it gained each second.
        </p>
        <p>
          The picture is not perfect, and the imperfections are informative. The humps are lopsided — more time on the
          negative tack than the positive one — and 12.3% of its upwind time is spent pointing more than 80° off the wind,
          which makes almost no progress. It has invented tacking; it has not refined it.
        </p>

        <HeadingRose />

        <RaceReplay id="tack" races={TACK_RACES} together={false} reward="progress"
          title="The two held-out races from the cell, replayed exactly" />

        <h2>Reading 2: one race that works</h2>
        <p>
          Held-out race 0 is tacking in its textbook form. The boat starts at the bottom right (<code>S</code>), sails up
          and to the left on one tack, tacks once about two thirds of the way up, and comes across on the other tack to
          round the mark (<code>M</code>). Fifty-three seconds, one tack. The hand-written expert averages 48.3 seconds
          across the test races, and the physical floor from the{" "}
          <Link href="/learn/building-environments/parameterising-a-boat" style={link}>speed chart</Link> is 32.0. In this
          race, a boat that learned from reward alone came within five seconds of the average time of a sailor who was
          given the answer.
        </p>

        <h2>Reading 3: one race that doesn&rsquo;t</h2>
        <p>
          Held-out race 1 starts just as well — the same kind of zig-zag up the course — and reaches the area around
          the mark on schedule. Measured, it came within 20 metres of the mark at 48 seconds, on the expert&rsquo;s pace.
          Then it looped round the mark and never got inside the 10-metre rounding circle: its closest approach was 10.0
          metres. It spent 36 seconds within 20 metres of the finish and ended the race stopped, <strong>stuck in a single
          table cell for the final 50 seconds</strong> — the same frozen loop the{" "}
          <Link href="/learn/building-environments/paying-the-boat" style={link}>reward investigation</Link> found, now
          happening at the finish line.
        </p>
        <p>
          That is not a one-off for this boat. Of the 44 races it failed, 37 came within 20 metres of the mark, and the
          median closest approach was 12.4 metres. This boat&rsquo;s failures are overwhelmingly <em>near misses</em>: it
          gets to the mark and stalls just outside it.
        </p>

        <h2>Watching it learn</h2>
        <p>
          The cell showed only the finished boat. Here is the same training run paused along the way, each panel racing
          held-out race 0 with the table as it stood at that moment. Press play: all five start together.
        </p>

        <LearningFilmstrip />

        <p>
          After 100 practice races the table sails nowhere useful and finishes none of the 200 tests. By 250 it finishes 31,
          though not this race. From 500 races on it rounds this mark with one tack, and the time comes down from 75 s to
          71 s to 53 s as the table fills in — while the test count climbs to 53, 103 and finally 156. Tacking appears early;
          what the remaining practice buys is doing it cleanly and from more starts.
        </p>

        <h2>Five training runs, and an admission about this one</h2>
        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 660 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Seed</th><th style={thR}>finishes</th><th style={thR}>mean time</th><th style={thR}>tacks</th>
                <th style={thR}>beating angle</th><th style={thR}>speed lost vs best angle</th><th style={thR}>near-miss failures</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdMono}>0</td><td style={tdR}>156</td><td style={tdR}>59.4 s</td><td style={tdR}>1.28</td><td style={tdR}>52.3°</td><td style={tdR}>1.0%</td><td style={tdR}>37</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdMono}>1</td><td style={tdR}>165</td><td style={tdR}>73.9 s</td><td style={tdR}>1.23</td><td style={tdR}>41.4°</td><td style={tdR}>11.8%</td><td style={tdR}>13</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdMono}>2</td><td style={tdR}>190</td><td style={tdR}>82.6 s</td><td style={tdR}>1.70</td><td style={tdR}>49.2°</td><td style={tdR}>0.0%</td><td style={tdR}>8</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdMono}>3</td><td style={tdR}>177</td><td style={tdR}>79.8 s</td><td style={tdR}>1.33</td><td style={tdR}>43.5°</td><td style={tdR}>6.2%</td><td style={tdR}>2</td>
              </tr>
              <tr>
                <td style={tdMono}>4</td><td style={tdR}>191</td><td style={tdR}>70.0 s</td><td style={tdR}>1.28</td><td style={tdR}>42.7°</td><td style={tdR}>7.9%</td><td style={tdR}>1</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 6 }}>
            Near-miss failures: races that ran out of time after coming within 20 m of the mark. &ldquo;Speed lost&rdquo;: how
            much less upwind progress the median beating angle makes than the polar&rsquo;s best, 49.5°.
          </div>
        </div>

        <p>
          <strong>The admission: the run shown above is the worst of the five.</strong> Seed 0 finishes the fewest races
          (156), and it alone accounts for 37 of the 61 near-miss failures across all five runs; the best runs have one or
          two. We used seed 0 because every live cell in this track uses seed 0, decided before any results existed —
          and the alternative, picking the seed that looks best, is exactly the habit the{" "}
          <Link href="/learn/function-approximation/reading-a-learning-curve" style={link}>learning-curve page</Link> warns
          against. So read the near-miss story as real but concentrated: it is what seed 0&rsquo;s table got wrong, not a
          flaw every run shares.
        </p>
        <p>
          <strong>What every run does share is the tacking.</strong> All five beat upwind at an angle between 41.4° and
          52.3°, tack about 1.2 to 1.7 times per race, and finish 156 to 191 races. Their best angles cost between 0% and
          11.8% of the ideal upwind speed. And all five are slower than the expert — 59 to 83 seconds against 48.3 —
          which is consistent with the note on the{" "}
          <Link href="/learn/building-environments/paying-the-boat" style={link}>reward page</Link> that distance gained
          only pushes the boat to hurry through discounting.
        </p>

        <Callout color={GOLD} title={<>A hypothesis we tested, and got nowhere with</>}>
          Seed 0&rsquo;s near misses looked like a view problem: the nearest distance band covers everything within 15 m,
          so perhaps the table could not tell &ldquo;almost there&rdquo; from &ldquo;there&rdquo;. We retrained all five
          runs with an extra band edge at 10 m. The results came back identical to the digit — 156, 165, 190, 177, 191 —
          and on reflection they had to: inside 10 m the race is already over, so the boat never makes a decision in that
          new band, and the view was the same view with its bands renumbered. The experiment was badly designed, not
          informative. The real cause of the stalls near the mark remains open, and we are leaving it open rather than
          guessing.
        </Callout>

        <h2>Is the environment done?</h2>
        <p>
          The honest test of an environment is not whether an agent is perfect in it. It is whether an agent can learn the
          behaviour the world was designed to require, and whether the tests you built can explain the failures you see.
          Both are now true. The boat invents tacking from reward alone; its angles, times and failures can each be read
          against the oracle, the expert and the tools of the last few pages. Making the agent better — more practice, a
          better view, a smarter learner — is the business of the tracks about learning. The business of this track is the
          world, and this one works.
        </p>
        <p>
          One reward is still untested. It is the one that sounds most sensible of all, and the next page shows what a
          learner does with it.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/what-the-boat-sees", label: <>← Designing what the boat sees</> }}
          next={{ href: "/learn/building-environments/pay-for-speed", label: <>Next · Pay for speed, get a boat that circles →</> }}
        />
      </div>
    </article>
  );
}

const codeTack = `Q, log = train_sailor(seed=0)            # what ships: distance gained, penalised edge, 2000 races
r = race(greedy(Q))
print(f"trained boat: rounded {r['arrived']} / 200, mean {r['mean_time']:.1f} s, "
      f"{r['tacks']:.2f} tacks per race, beats upwind at a median {r['beat_angle']:.1f} deg")
print(f"for comparison: the polar's best angle {BEST_ANGLE:.1f} deg; the expert 48.3 s, 1.00 tacks")
print()

# Where does it point while working upwind? Signed angle to the wind, in 10-degree slices.
counts, total = {}, 0
for k in range(200):
    env = Sail(); o, _ = env.reset(seed=10**6 + k); helm = greedy(Q)(env)
    while True:
        o, rew, terminated, truncated, info = env.step(helm(o))
        b = math.degrees(math.atan2(env.mx - env.x, env.my - env.y))
        if abs(b) < BEST_ANGLE - 5 and env.u > 0.5:              # mark still upwind, boat moving
            lo = int((env.h + 180) // 10) * 10 - 180
            counts[lo] = counts.get(lo, 0) + 1; total += 1
        if terminated or truncated: break
print("share of beating seconds spent at each heading:")
for lo in range(-80, 80, 10):
    share = counts.get(lo, 0) / total
    print(f"  {lo:+4d} to {lo + 10:+4d}  {'#' * round(share * 100):<30s} {share:5.1%}")
outside = 1 - sum(counts.get(lo, 0) for lo in range(-80, 80, 10)) / total
print(f"  beyond +/-80 deg: {outside:.1%}")
print()

for k in (0, 1):                          # the first two held-out races, whatever they show
    xs, ys, env, info = sail_once(greedy(Q), seed=10**6 + k)
    how = "rounded the mark" if info["arrived"] else ("left the course" if info["out"] else "ran out of time")
    print(f"held-out race {k}: {env.t} s, {env.tacks} tack(s), {how}")
    draw_track(xs, ys, env)
    print()`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const tdR: React.CSSProperties = { padding: "8px 12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
const tdMono: React.CSSProperties = { padding: "8px 12px", fontFamily: "ui-monospace, monospace", color: "var(--muted)" };
