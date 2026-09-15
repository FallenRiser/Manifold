import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { PolarLab } from "@/components/sail/PolarLab";

export const metadata = {
  title: "Parameterising a boat: the polar diagram — Manifold",
  description:
    "Write the boat's speed chart yourself, four lines at a time, and prove it matches the environment. Then use it to compute the ceiling before any agent exists: the fastest heading (101.7°) drifts away from the mark, and the best upwind angle is 49.5°, making 1.565 m/s toward the wind.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ParameterisingABoat() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 15 minutes"
        title={<>Parameterising a boat: the polar diagram</>}
        intro={<>Stage 2 is where a world gets its numbers. For a boat almost everything comes from one relationship —
          how fast it sails at each angle to the wind — and sailors have a name for the chart of it: the{" "}
          <em>polar diagram</em>. On this page you write that function yourself, check it against the environment,
          and then use it to answer the question an agent will spend two thousand races on, in a fraction of a second.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>One function holds the physics</h2>
        <p>
          A sail works like a wing. Point the boat straight into the wind and the sail just flaps — no drive at all.
          Turn away a little and the sail starts to fill; a bit more and it pulls hard. Keep turning until the wind is
          behind you and the sail is merely being pushed, which is slower than being pulled. So speed depends on the
          angle between the boat&rsquo;s heading and the wind, and the shape of that dependence is what makes sailing
          upwind a puzzle.
        </p>
        <p>
          We encode it in four steps. Type each one, and read the comment beside it — every line corresponds to a
          physical fact from the paragraph above.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codePolar} />
        <CodeOutput>{` angle    speed  toward the wind
    0°  0.000 m/s      +0.000 m/s
   20°  0.000 m/s      +0.000 m/s
   30°  0.000 m/s      +0.000 m/s
   35°  1.022 m/s      +0.837 m/s
   40°  1.696 m/s      +1.299 m/s
   45°  2.140 m/s      +1.514 m/s
   50°  2.433 m/s      +1.564 m/s
   55°  2.626 m/s      +1.506 m/s
   60°  2.754 m/s      +1.377 m/s
   75°  2.929 m/s      +0.758 m/s
   90°  2.980 m/s      +0.000 m/s
  100°  2.991 m/s      -0.519 m/s
  120°  2.923 m/s      -1.462 m/s
  150°  2.531 m/s      -2.192 m/s
  180°  1.800 m/s      -1.800 m/s

identical to the environment's polar at every 0.1 degree: True`}</CodeOutput>

        <p>Walk through the four steps against the table.</p>
        <p>
          <strong>Step 1 — the dead zone.</strong> <code>abs(angle)</code> first, because a boat with the wind on its
          left side sails exactly as fast as one with the wind on its right; that single call means the function only
          has to describe 0° to 180°. Then anything within <code>NO_GO</code> = 30° of the wind returns zero. That is
          the rule that stalled the point-at-the-mark helm on{" "}
          <Link href="/learn/building-environments/the-brief" style={link}>the previous page</Link>: 0°, 20° and 30°
          in the table are all dead.
        </p>
        <p>
          <strong>Step 2 — drive builds, then saturates.</strong>{" "}
          <M>{String.raw`1 - e^{-(a - 30)/12}`}</M> is zero at the edge of the dead zone and climbs toward one. The
          exponential is a deliberate choice of <em>shape</em>: the first few degrees out of irons help enormously
          (35° already gives 1.02 m/s), and each further degree helps a bit less. <code>RAMP</code> = 12° sets how fast
          that happens — about two-thirds of full drive is reached 12° past the dead zone.
        </p>
        <p>
          <strong>Step 3 — how far past a beam reach.</strong> A beam reach is 90°, the wind straight across the boat.
          From 100° onward, <code>x</code> runs from 0 to 1 as the wind moves round behind.
        </p>
        <p>
          <strong>Step 4 — running downwind costs speed.</strong> The factor <M>{String.raw`1 - 0.4x^2`}</M> leaves top
          speed alone until 100° and trims it to 60% dead downwind — 1.800 m/s at 180° in the table.
        </p>
        <p>
          The last line of the cell is a habit worth copying: <strong>after writing a piece of physics, prove it is
          the piece the environment uses.</strong> If you ever edit one and not the other, that line prints{" "}
          <code>False</code>, and you find out now rather than after a training run behaves strangely.
        </p>

        <h2>The column that matters is the third one</h2>
        <p>
          Look down the &ldquo;toward the wind&rdquo; column. It is the boat&rsquo;s speed multiplied by the cosine of
          its angle — the part of its motion that actually closes distance on a mark that lies directly upwind.
          Sailors call it <strong>velocity made good</strong>, or VMG:
        </p>
        <MathBlock>{String.raw`\text{VMG}(a) \;=\; \text{speed}(a)\,\cos a`}</MathBlock>
        <p>
          Two things happen in that column that the speed column hides. At 90° the boat is going nearly flat out and
          making <em>exactly zero</em> progress upwind. And at 100°, where it is fastest of all, the progress is{" "}
          <em>negative</em>. Before running the search below, commit to an answer.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The mark is straight upwind. Which heading, held steadily, closes the distance fastest?</>}
          options={["As close to the wind as the sail allows, just past 30°", "Somewhere around 45–50°", "The boat's fastest heading, about 100°", "Straight across the wind, 90°"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeBest} />
        <CodeOutput>{`fastest heading     101.70 deg   speed 2.992 m/s   toward the wind -0.607 m/s
best upwind heading  49.50 deg   speed 2.409 m/s   toward the wind +1.565 m/s

best upwind angle, for other boats:
                RAMP  6  RAMP 12  RAMP 24
  NO_GO 20 deg     35.9°    42.1°    47.7°
  NO_GO 30 deg     44.3°    49.5°    54.1°
  NO_GO 40 deg     52.7°    57.0°    60.5°`}</CodeOutput>

        <p>
          <strong>49.5°.</strong> Not as close to the wind as possible — at 35° the boat is too slow to make much of
          its good angle. Not the fastest heading either — at 101.7° it is doing 2.99 m/s and drifting 0.6 m/s{" "}
          <em>away</em> from the mark. The best angle is a trade between speed and direction, and it sits where
          giving up a little more angle stops buying enough extra speed. At 49.5° the boat does 2.41 m/s and makes
          1.565 m/s toward the wind.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Drag the blue handle from 90° up toward the wind and watch the green bar on the wind axis. Then move NO_GO and
            RAMP and see where the gold line settles.</>}
          insight={<>The green bar grows as you come up from 90°, peaks where the curve touches the gold line, then collapses as
            the boat slows near the no-go zone. That touching point is the whole oracle. Change the boat and the angle moves,
            anywhere from the mid-30s to the 60s, but there is always a peak well clear of both the wind and the fastest
            heading.</>}
        >
          <PolarLab />
        </LabFrame>
        <p>
          This is the <strong>oracle</strong> for the whole world, and notice what it cost: a loop over eighteen
          thousand angles, no agent, no training. Every agent you train on this boat can now be graded against it. If
          a learned boat beats upwind at 49.5°, it has rediscovered a sailor&rsquo;s rule of thumb from nothing but
          reward. If it beats at 42°, we know exactly how much it is losing.
        </p>

        <Proof title="Why tacking at the best angle costs nothing extra (in the ideal case)">
          <p>
            <strong>Step 1 — one leg.</strong> Sail at angle <M>\theta</M> to the wind for time <M>t_1</M> at speed{" "}
            <M>s</M>. Upwind progress is <M>{String.raw`s\cos\theta\; t_1`}</M>; sideways drift is{" "}
            <M>{String.raw`s\sin\theta\; t_1`}</M>, to the right.
          </p>
          <p>
            <strong>Step 2 — the mirror leg.</strong> Tack and sail at <M>-\theta</M> for time <M>t_2</M>. Upwind
            progress <M>{String.raw`s\cos\theta\; t_2`}</M> — the cosine does not care about the sign — and drift{" "}
            <M>{String.raw`s\sin\theta\; t_2`}</M>, to the left.
          </p>
          <p>
            <strong>Step 3 — arrive at a mark straight upwind.</strong> The drifts must cancel, so{" "}
            <M>{String.raw`t_1 = t_2 = T/2`}</M>, and the total upwind distance is
          </p>
          <MathBlock>{String.raw`D = s\cos\theta\,\tfrac{T}{2} + s\cos\theta\,\tfrac{T}{2} = \text{VMG}(\theta)\,T \quad\Rightarrow\quad T = \frac{D}{\text{VMG}(\theta)}`}</MathBlock>
          <p>
            <strong>Step 4 — read it.</strong> The time depends only on VMG, not on how many tacks you split it into —
            two long legs or twenty short ones cover the same distance in the same time. So minimising time means
            maximising VMG, which is exactly the search above. For our boat, <M>D</M> = 50 m of upwind progress
            (60 m to the mark, minus the 10 m rounding circle) gives <M>{String.raw`T = 50 / 1.565 = 32.0`}</M> s — the
            &ldquo;fastest conceivable&rdquo; line on the{" "}
            <Link href="/learn/building-environments/plan-parameterise-code-test-train" style={link}>spec card</Link>.
          </p>
          <p>
            <strong>Step 5 — where the ideal breaks.</strong> A real tack swings the bow through the dead zone and
            bleeds speed, and the boat starts from rest. So real tacks <em>do</em> cost time, which is why the
            expert takes 48.3 s rather than 32.0 and tacks once rather than twenty times. That cost comes from the{" "}
            <code>step</code> function on the next page, not from the polar.
          </p>
        </Proof>

        <h2>Where the numbers came from</h2>
        <p>
          Stage 2 is not finished when the function runs. Every constant needs one sentence saying why it has the
          value it has, and — just as important — how much the rest of the world depends on it.
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Constant</th><th style={th}>Value</th><th style={th}>Why this value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdCode}>V_MAX</td><td style={tdCode}>3.0 m/s</td>
                <td style={td}>About 6 knots — a plausible small boat in a moderate breeze. It scales every time in the world but does not move the best angle at all.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdCode}>NO_GO</td><td style={tdCode}>30°</td>
                <td style={td}>The dead zone. Chosen, together with RAMP, so the best upwind angle lands near 50°, in the range real boats typically sail upwind.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdCode}>RAMP</td><td style={tdCode}>12°</td>
                <td style={td}>How sharply drive builds past the dead zone. Softer (larger) values push the best angle further from the wind.</td>
              </tr>
              <tr>
                <td style={tdCode}>0.4 downwind</td><td style={tdCode}>−40% at 180°</td>
                <td style={td}>Only matters for sailing <em>away</em> from the mark. It keeps running dead downwind slower than reaching across the wind, which is true of real boats.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          The grid at the bottom of the second cell is the honest part of that table. The best angle is not a law of
          nature; it is a consequence of two constants we picked. Across plausible boats it moves from 35.9° to
          60.5°. What <em>is</em> robust is the shape of the answer — there is always a best angle well away from both
          the wind and the fastest heading — and that shape is the thing the agent has to discover. The exact number
          is just what our particular boat makes it.
        </p>

        <Callout color={GOLD} title={<>Decision record: a formula, not a real boat&rsquo;s polar</>}>
          Real boats have measured polar tables — hundreds of speeds across wind strengths and angles, produced by
          velocity-prediction programs or sea trials. We used a four-line formula instead, and it is worth being
          clear about the trade. A real table would make the boat more realistic and the lessons no different. The
          formula gives every piece of physics exactly one number with one meaning, lets you see the whole ceiling
          move when you change a constant (as the grid just did), and keeps the oracle a transparent search you can
          read. For a world whose purpose is to teach how environments are built, legibility beat realism. For a
          world whose purpose is to train a boat that races, it would be the other way round.
        </Callout>

        <h2>What the next page builds</h2>
        <p>
          The polar tells you how fast the boat <em>could</em> go at each angle. It says nothing about turning, about
          how quickly speed responds, or about where the boat ends up. That is <code>step()</code>, and you write it
          next — one line at a time, with a test after each.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-brief", label: <>← The brief: reach an upwind mark</> }}
          next={{ href: "/learn/building-environments/writing-step", label: <>Next · Writing step() →</> }}
        />
      </div>
    </article>
  );
}

const codePolar = `V_MAX, NO_GO, RAMP = 3.0, 30.0, 12.0

def my_polar(angle):
    "Boat speed (m/s) at an angle (deg) to the wind. 0 = head to wind, 180 = dead downwind."
    a = abs(angle)                                     # port and starboard are mirror images
    if a <= NO_GO:
        return 0.0                                     # 1. in irons: the sail gives no drive
    drive = 1.0 - math.exp(-(a - NO_GO) / RAMP)        # 2. drive builds quickly past the dead zone
    x = min(1.0, max(0.0, (a - 100.0) / 80.0))         # 3. how far past a beam reach we are, 0..1
    return V_MAX * drive * (1.0 - 0.4 * x * x)         # 4. running downwind costs up to 40%

print(f"{'angle':>6}  {'speed':>7}  {'toward the wind':>15}")
for a in (0, 20, 30, 35, 40, 45, 50, 55, 60, 75, 90, 100, 120, 150, 180):
    s = my_polar(a)
    print(f"{a:5d}°  {s:5.3f} m/s  {s * math.cos(math.radians(a)):+10.3f} m/s")

same = all(abs(my_polar(a / 10) - polar(a / 10)) < 1e-12 for a in range(-1800, 1801))
print()
print("identical to the environment's polar at every 0.1 degree:", same)`;

const codeBest = `angles = np.linspace(0, 180, 18001)                     # every 0.01 degree
speed = np.array([polar(a) for a in angles])
vmg = speed * np.cos(np.radians(angles))                # the part of the speed that points upwind

best = angles[vmg.argmax()]
fast = angles[speed.argmax()]
print(f"fastest heading     {fast:6.2f} deg   speed {speed.max():.3f} m/s   toward the wind {vmg[speed.argmax()]:+.3f} m/s")
print(f"best upwind heading {best:6.2f} deg   speed {polar(best):.3f} m/s   toward the wind {vmg.max():+.3f} m/s")
print()

# The ceiling depends on the constants. How much?
print("best upwind angle, for other boats:")
print(f"{'':>14}" + "".join(f"  RAMP {r:>2}" for r in (6, 12, 24)))
for ng in (20, 30, 40):
    row = []
    for r in (6, 12, 24):
        def p(a, ng=ng, r=r):
            a = abs(a)
            if a <= ng: return 0.0
            x = min(1.0, max(0.0, (a - 100.0) / 80.0))
            return 3.0 * (1.0 - math.exp(-(a - ng) / r)) * (1.0 - 0.4 * x * x)
        v = np.array([p(a) * math.cos(math.radians(a)) for a in angles])
        row.append(f"{angles[v.argmax()]:8.1f}°")
    print(f"  NO_GO {ng:>2} deg " + "".join(row))`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
const tdCode: React.CSSProperties = { ...td, fontFamily: "ui-monospace, monospace", color: "var(--ink)", whiteSpace: "nowrap" };
