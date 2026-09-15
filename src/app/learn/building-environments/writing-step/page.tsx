import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { TackCostLab } from "@/components/sail/TackCostLab";
import { HeadingFigure } from "@/components/sail/HeadingFigure";

export const metadata = {
  title: "Writing step() — Manifold",
  description:
    "Build the sailboat's environment yourself, one job at a time: reset, turning (and the wrap bug that silently costs 13.5% of speed), speed that responds instead of jumping (a tack drops the boat to 7.5% of full), and movement. Then assemble it and prove it: 5,012 steps identical to the environment, and the expert sails your boat 200 races out of 200.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WritingStep() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 20 minutes"
        title={<>Writing <code>step()</code></>}
        intro={<>This is the page where you build the world. You already have its speed chart from the last page; now
          you write the class around it, one job at a time, running each piece before moving on. At the end you
          assemble your boat and prove — not hope — that it behaves exactly like the environment every other page on
          this track uses.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What <code>step()</code> has to do</h2>
        <p>
          Every call to <code>step(action)</code> advances the world by one second, and in that second the boat does
          five jobs, always in this order:
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li><strong>Turn</strong> the helm by the chosen action.</li>
          <li><strong>Respond</strong>: the speed moves toward what the polar says the new heading allows.</li>
          <li><strong>Move</strong> the boat by that speed, in that direction.</li>
          <li><strong>Decide</strong> whether the race has ended, and how.</li>
          <li><strong>Pay</strong> the boat for this second.</li>
        </ol>
        <p>
          We will write jobs 1–3 as small functions you can poke at, then drop all five into the class. Each cell
          on this page is independent — it only relies on the constants and the <code>polar</code> function from the
          environment&rsquo;s setup, which you verified line for line on the{" "}
          <Link href="/learn/building-environments/parameterising-a-boat" style={link}>previous page</Link>.
        </p>

        <h2>Piece 0: the state, and <code>reset</code></h2>
        <p>
          Before anything can move, the boat needs a state and a way to put it back. Four numbers describe the boat
          completely — position <code>x, y</code>, heading <code>h</code>, speed <code>u</code> — plus a clock and a
          tack counter that are for bookkeeping, not physics.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codeReset} />
        <CodeOutput>{`seed 0:  mine (0.0, 0.0, 49.31, 0.0)   environment (0.0, 0.0, 49.31, 0.0)   same: True
seed 1:  mine (0.0, 0.0, 4.26, 0.0)   environment (0.0, 0.0, 4.26, 0.0)   same: True
seed 2:  mine (0.0, 0.0, -85.82, 0.0)   environment (0.0, 0.0, -85.82, 0.0)   same: True`}</CodeOutput>

        <p>
          Every choice in those lines was argued on earlier pages — the private random generator on the{" "}
          <Link href="/learn/building-environments/the-reset-step-contract" style={link}>contract page</Link>, the
          random heading and the mark&rsquo;s position on{" "}
          <Link href="/learn/building-environments/the-brief" style={link}>the brief</Link> — so here the only new
          thing is the test: same seed, same start, compared exactly. One more convention to notice, because every
          later line depends on it: <strong>heading 0 points straight into the wind</strong>. That makes the angle to
          the wind simply <code>abs(h)</code>, which is exactly what the polar takes. If you later add wind shifts,
          this is the line that changes: the angle to the wind becomes <code>wrap(h - wind_direction)</code>.
        </p>

        <h2>Piece 1: turning</h2>
        <p>
          The action is 0, 1 or 2. Subtracting 1 turns it into −1, 0 or +1, and multiplying by <code>TURN</code> = 10
          gives the change of heading. The one subtle part is keeping the heading inside a fixed range.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codeTurn} />
        <CodeOutput>{`bearing right from 160:   [160, 170, -180, -170, -160, -150]
without wrap it would be: [160, 170, 180, 190, 200, 210]
wrap(190) = -170.0    wrap(-190) = 170.0    wrap(180) = -180.0

why it matters - 190 and -170 are the SAME heading, but the physics only knows one of them:
  polar(190)  = 1.800 m/s   <- what an unwrapped heading would get
  polar(-170) = 2.081 m/s   <- the true speed`}</CodeOutput>

        <p>
          A heading of 190° and a heading of −170° point the same way. Without <code>wrap</code>, a boat that keeps
          bearing right would count up past 180 forever — and the polar, which assumes angles between −180 and 180,
          would read 190° as <em>further</em> round than dead downwind and give it 1.800 m/s instead of the true
          2.081. That bug would never crash. The boat would just sail 13.5% slower on some headings, and a learning
          agent would dutifully learn to avoid them. <code>wrap</code> is one line — <code>(d + 180) % 360 - 180</code>{" "}
          — and it is the first of several one-line decisions on this page whose absence would silently change the
          physics.
        </p>

        <h2>Piece 2: speed responds — it does not jump</h2>
        <p>
          The polar gives the speed a boat <em>settles</em> at on a heading. A real boat does not reach it
          instantly, and it does not stop instantly either. The simplest honest model is that each second the speed
          closes a fixed fraction of the gap: <code>u += (polar(h) - u) * INERTIA</code>, with <code>INERTIA</code> ={" "}
          0.3.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>A boat at full speed on a 50° heading tacks: it turns 10° a second, through the wind, to −50°. At the
            slowest moment of the tack, how fast is it going?</>}
          options={["Still above 2 m/s", "About half of full speed", "Under 10% of full speed", "Completely stopped"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeSpeed} />
        <CodeOutput>{`from rest, holding 50 degrees (polar speed 2.433 m/s):
  t=1 s   0.730 m/s    30% of full
  t=2 s   1.241 m/s    51% of full
  t=3 s   1.599 m/s    66% of full
  t=4 s   1.849 m/s    76% of full
  t=5 s   2.024 m/s    83% of full
  t=6 s   2.147 m/s    88% of full
  t=7 s   2.233 m/s    92% of full
  t=8 s   2.293 m/s    94% of full

a tack: at full speed on +50, bear left through the wind to -50
  t= 1 s   heading  +40.0   2.212 m/s
  t= 2 s   heading  +30.0   1.549 m/s
  t= 3 s   heading  +20.0   1.084 m/s
  t= 4 s   heading  +10.0   0.759 m/s
  t= 5 s   heading   +0.0   0.531 m/s
  t= 6 s   heading  -10.0   0.372 m/s
  t= 7 s   heading  -20.0   0.260 m/s
  t= 8 s   heading  -30.0   0.182 m/s
  t= 9 s   heading  -40.0   0.636 m/s
  t=10 s   heading  -50.0   1.175 m/s
  five seconds later, holding -50:  2.222 m/s`}</CodeOutput>

        <p>
          <strong>Under 10%: 0.182 m/s, which is 7.5% of full speed.</strong> Read the tack line by line. At +30°
          the boat enters the dead zone, where the polar says zero, so from there each second keeps only 70% of the
          speed it had. Seven seconds inside the zone (+30 down to −30) leaves 0.7⁷ ≈ 8% of what it entered with. The
          moment the bow reaches −40° the sail fills again and speed starts climbing, but five seconds after completing
          the turn it is still short of full.
        </p>
        <p>
          That table <em>is</em> the cost of a tack, and it is the reason the expert tacks once rather than twenty
          times. The{" "}
          <Link href="/learn/building-environments/parameterising-a-boat" style={link}>ideal-case derivation</Link>{" "}
          showed that with free tacks the number of tacks would not matter. Inertia is what makes it matter.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Slide INERTIA to 1, then down to 0.1, and watch the slowest moment and the cost of the tack.</>}
          insight={<>At 1 the boat stops dead in the no-go zone but is back at full speed a second after leaving it. At 0.1 it
            barely slows in the turn but takes an age to build speed. Neither extreme makes tacks expensive in the way real
            boats find them; 0.3 does, and that cost is what the agent will have to learn to respect.</>}
        >
          <TackCostLab />
        </LabFrame>

        <Callout color={GOLD} title={<>Decision record: why INERTIA = 0.3</>}>
          Two alternatives bracket the choice. <strong>INERTIA = 1</strong> means speed jumps straight to the polar
          value: the boat would stop dead the instant it entered the dead zone and be back at full speed the instant
          it left, so a tack would cost only the seconds spent inside the zone, and short zig-zags would be nearly
          free. <strong>A small value like 0.1</strong> would keep 90% of the speed each second: about 22 seconds to
          reach 90% of full speed, and a boat would come out of the seven dead seconds of a tack still carrying about
          half its speed (0.9⁷ ≈ 0.48) — so tacks would be cheap again, for the opposite reason, while every start
          from rest would be painfully slow. At 0.3 a boat reaches 92% of its speed in 7
          seconds and a tack costs a real, visible amount. We chose the value from what it does to the physics of a
          tack, as shown above; we did not train agents across different inertia values, so this is a modelling
          decision and not a tuned one.
        </Callout>

        <h2>Piece 3: moving</h2>
        <p>
          Now the boat has a heading and a speed, and needs to travel. Because heading 0 points up the course (into
          the wind), the upwind part of the motion is the <em>cosine</em> and the sideways part is the{" "}
          <em>sine</em> — the reverse of the maths-class convention where angles are measured from the x-axis.
        </p>

        <HeadingFigure />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeMove} />
        <CodeOutput>{`one second at full speed, heading   +0.0:   sideways +0.000 m   upwind +0.000 m
one second at full speed, heading  +49.5:   sideways +1.832 m   upwind +1.565 m
one second at full speed, heading  +90.0:   sideways +2.980 m   upwind +0.000 m
one second at full speed, heading  -49.5:   sideways -1.832 m   upwind +1.565 m
one second at full speed, heading +180.0:   sideways +0.000 m   upwind -1.800 m`}</CodeOutput>

        <p>
          Check the second row against the last page: one second at 49.5° gains exactly <strong>1.565 m</strong>{" "}
          upwind, the best velocity made good. The two ±49.5° rows show why tacking works — same upwind gain, opposite
          sideways drift, which is what cancels over the two legs. And the first row is the stalled boat from the
          brief, in one line: pointing into the wind, speed zero, going nowhere.
        </p>

        <h2>Assemble it — and prove it</h2>
        <p>
          All five jobs go into one class. Jobs 1–3 are the three functions above, inlined. Job 4 uses the three
          endings from the spec, and job 5 accepts all three candidate rewards, because choosing between them is
          chapter 3&rsquo;s job and the environment should not pre-empt it. Below the class are two tests. Read the
          class first, then the tests, then run it.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codeAssemble} />
        <CodeOutput>{`5012 steps, 3 rewards x 20 races: every return value identical
the expert on your boat: 200 / 200 rounded the mark, mean 48.3 s`}</CodeOutput>

        <p>
          <strong>Your boat is the environment.</strong> Over 5,012 steps of random sailing under all three reward
          rules, every observation, reward, ending flag and info dictionary came back identical, to the last bit. And
          the hand-written expert rounds the mark in all 200 held-out races, in the same 48.3 seconds as on the
          environment&rsquo;s boat. Three details in the class deserve a sentence each, because each was a choice.
        </p>
        <p>
          <strong>The order is turn, respond, move.</strong> Speed responds to the <em>new</em> heading before the boat
          moves, so a boat that starts from rest on a 50° heading travels 0.73 m in its very first second. Moving first and responding
          after is also a legitimate model — it is the same choice physics simulators face between updating velocity
          or position first — and it would shift every number slightly. What matters is picking one, writing it down,
          and keeping the tests pinned to it.
        </p>
        <p>
          <strong>A tack is counted only when the bow crosses the wind.</strong> The heading changes sign when it
          passes through 0° <em>or</em> through ±180°. Crossing 180° means turning with the wind behind you — a{" "}
          <em>gybe</em>, not a tack — so the <code>abs(self.h) &lt; 90</code> check excludes it. The counter never
          affects the physics or the reward; it exists so we can later ask what a trained boat actually does.
        </p>
        <p>
          <strong>The distance is measured before and after moving</strong>, because one of the three candidate
          rewards pays for distance gained in this second. The other two ignore it. Computing it for all of them costs
          two square roots and keeps the step function a single straight path, which is easier to test.
        </p>

        <Callout color={GOLD} title={<>Why the test compares every return value, not just the score</>}>
          It is tempting to test a new environment by checking that a good policy still does well — the expert still
          finishes 200 races, so the boat must be right. But look at what the expert reads: position, heading, speed.
          It never looks at the reward. You could flip the sign of the progress reward, or break the speed reward
          entirely, and the expert would still finish all 200 races in 48.3 seconds. The first test catches those
          bugs, because it compares <em>everything</em> <code>step</code> returns, under every reward setting. A test
          that only watches the outcome you care about is blind to every bug that does not affect that outcome — and
          the agent you train next will find every one of them.
        </Callout>

        <h2>What the next page decides</h2>
        <p>
          Your boat has one line that has not been argued yet: <code>out = ... &gt; COURSE</code>. Where the race area
          ends, and what happens when a boat crosses it, looks like housekeeping. Under one of the three rewards, it
          turned out to be the decision that taught the boat to sail away from the race on purpose.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/parameterising-a-boat", label: <>← Parameterising a boat</> }}
          next={{ href: "/learn/building-environments/where-the-course-ends", label: <>Next · Where the course ends →</> }}
        />
      </div>
    </article>
  );
}

const codeReset = `class MyBoat:
    nA = 3                                            # bear left, hold, bear right
    def __init__(self):
        self.mx, self.my = 0.0, MARK_DIST             # the mark: 60 m straight upwind
        self.rng = np.random.default_rng()            # this boat's own random stream

    def reset(self, seed=None):
        if seed is not None:
            self.rng = np.random.default_rng(seed)
        self.x, self.y = 0.0, 0.0                     # start line at the origin
        self.h = float(self.rng.uniform(-180, 180))   # random heading; 0 = into the wind
        self.u = 0.0                                  # from rest
        self.t = 0; self.tacks = 0
        return (self.x, self.y, self.h, self.u), {}

mine, theirs = MyBoat(), Sail()
for seed in (0, 1, 2):
    a, _ = mine.reset(seed=seed)
    b, _ = theirs.reset(seed=seed)
    print(f"seed {seed}:  mine {tuple(round(v, 2) for v in a)}   environment {tuple(round(v, 2) for v in b)}   same: {a == b}")`;

const codeTurn = `def turn(h, action):
    "Bear left (0), hold (1) or bear right (2): 10 degrees a second, kept inside [-180, 180)."
    return wrap(h + (action - 1) * TURN)

h = 160.0
trace = [h]
for _ in range(5):
    h = turn(h, 2)
    trace.append(h)
print("bearing right from 160:  ", [round(v) for v in trace])
print("without wrap it would be:", [160 + 10 * k for k in range(6)])
print("wrap(190) =", wrap(190), "   wrap(-190) =", wrap(-190), "   wrap(180) =", wrap(180))
print()
print("why it matters - 190 and -170 are the SAME heading, but the physics only knows one of them:")
print(f"  polar(190)  = {polar(190):.3f} m/s   <- what an unwrapped heading would get")
print(f"  polar(-170) = {polar(-170):.3f} m/s   <- the true speed")`;

const codeSpeed = `def respond(u, h):
    "Speed closes 30% of the gap to the polar speed every second."
    return u + (polar(h) - u) * INERTIA

u = 0.0
print(f"from rest, holding 50 degrees (polar speed {polar(50.0):.3f} m/s):")
for t in range(1, 9):
    u = respond(u, 50.0)
    print(f"  t={t} s   {u:.3f} m/s   {u / polar(50.0):4.0%} of full")

print()
print("a tack: at full speed on +50, bear left through the wind to -50")
h, u = 50.0, polar(50.0)
for t in range(1, 11):
    h = wrap(h - TURN)
    u = respond(u, h)
    print(f"  t={t:2d} s   heading {h:+6.1f}   {u:.3f} m/s")
for t in range(5):
    u = respond(u, h)
print(f"  five seconds later, holding -50:  {u:.3f} m/s")`;

const codeMove = `def move(x, y, h, u):
    "Heading 0 points into the wind (+y). Sine is the sideways part, cosine the upwind part."
    rad = math.radians(h)
    return x + u * math.sin(rad), y + u * math.cos(rad)

for h in (0.0, 49.5, 90.0, -49.5, 180.0):
    x1, y1 = move(0.0, 0.0, h, polar(h))
    print(f"one second at full speed, heading {h:+6.1f}:   sideways {x1:+.3f} m   upwind {y1:+.3f} m")`;

const codeAssemble = `class MyBoat:
    nA = 3
    def __init__(self, reward="progress", edge="penalty", clock=MAX_STEPS):
        self.reward, self.edge, self.clock = reward, edge, clock
        self.mx, self.my = 0.0, MARK_DIST
        self.rng = np.random.default_rng()

    def reset(self, seed=None):
        if seed is not None:
            self.rng = np.random.default_rng(seed)
        self.x = 0.0; self.y = 0.0
        self.h = float(self.rng.uniform(-180, 180))
        self.u = 0.0; self.t = 0; self.tacks = 0
        return (self.x, self.y, self.h, self.u), {}

    def step(self, a):
        # 1. turn the helm, and count it as a tack if the bow crossed the wind
        old = self.h
        self.h = wrap(self.h + (a - 1) * TURN)
        if (old >= 0) != (self.h >= 0) and abs(self.h) < 90:
            self.tacks += 1
        # 2. speed responds to the new heading
        self.u += (polar(self.h) - self.u) * INERTIA
        # 3. move, remembering the distance before and after
        d0 = math.hypot(self.mx - self.x, self.my - self.y)
        rad = math.radians(self.h)
        self.x += self.u * math.sin(rad); self.y += self.u * math.cos(rad)
        d1 = math.hypot(self.mx - self.x, self.my - self.y)
        self.t += 1
        # 4. how the race can end
        arrived = d1 <= ARRIVE
        out = self.edge != "none" and math.hypot(self.x, self.y - self.my / 2) > COURSE
        terminated = arrived or out
        truncated = (not terminated) and self.t >= self.clock
        # 5. what the boat is paid (three candidates; chapter 3 chooses)
        if self.reward == "time":
            r = -1.0
            if out and self.edge == "penalty": r += -1.0 * (self.clock - self.t)
        elif self.reward == "speed":
            r = self.u + (-100.0 if (out and self.edge == "penalty") else 0.0)
        else:
            r = d0 - d1
            if out and self.edge == "penalty": r += -100.0
        return (self.x, self.y, self.h, self.u), r, terminated, truncated, {"arrived": arrived, "out": out}

# Test 1: drive YOUR boat and the environment's with the same random helm. Compare everything.
rng = np.random.default_rng(7)
steps, mismatch = 0, None
for reward in ("progress", "time", "speed"):
    for seed in range(20):
        mine, theirs = MyBoat(reward), Sail(reward)
        mine.reset(seed=seed); theirs.reset(seed=seed)
        while True:
            act = int(rng.integers(3))
            A, B = mine.step(act), theirs.step(act)
            steps += 1
            if A != B and mismatch is None: mismatch = (reward, seed, steps)
            if A[2] or A[3]: break
print(f"{steps} steps, 3 rewards x 20 races:", "every return value identical" if mismatch is None else f"FIRST MISMATCH {mismatch}")

# Test 2: can the expert sail YOUR boat?
arrived, times = 0, []
for k in range(200):
    env = MyBoat(); o, _ = env.reset(seed=10**6 + k); helm = expert(env)
    while True:
        o, r, terminated, truncated, info = env.step(helm(o))
        if terminated or truncated: break
    arrived += info["arrived"]
    if info["arrived"]: times.append(env.t)
print(f"the expert on your boat: {arrived} / 200 rounded the mark, mean {np.mean(times):.1f} s")`;
