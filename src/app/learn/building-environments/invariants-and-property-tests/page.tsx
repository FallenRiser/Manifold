import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { BugHuntLab } from "@/components/fire/BugHuntLab";

export const metadata = {
  title: "Invariants and property tests — Manifold",
  description:
    "Fifteen things that must be true after every step of the wildfire world, checked with no second implementation to compare against. One of them fails on the real environment — and the invariant turns out to be the thing that was wrong. Plant eight bugs and see which the invariants catch and which no invariant can see; test a relation between two runs (does a water drop ever leave more fire?), and shrink a failing episode to the one action that matters.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function InvariantsAndPropertyTests() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 24 minutes"
        title={<>Invariants and property tests</>}
        intro={<>Every test in this chapter so far compared two versions of a system: your fire against the
          environment&rsquo;s, your helicopter against its, your step against its. That needs a second version, and it only
          checks the worlds you run. This page asks a different question — what must be true after <em>every</em> step, in
          every world, whatever the agent does? — and checks it with no second version at all. Along the way, one of our
          invariants fails on the real environment, and the bug turns out to be in the invariant.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What must always be true</h2>
        <p>
          An invariant is a claim about a single step that you can check from the state before it and the state after it.
          They come in a few families. <strong>Conservation:</strong> a burnt cell stays burnt; the record of every cell
          that has caught fire only grows. <strong>Bounds:</strong> moisture stays between 0.05 and 1 and the lake stays
          at exactly 1; the bucket holds 0 or 1; the wind&rsquo;s strength stays in [0, 1].{" "}
          <strong>Bookkeeping:</strong> the clock moves by one; an episode is terminated exactly when no fire is left, and
          never terminated and truncated at once. <strong>Consistency:</strong> the observation&rsquo;s map layers show the
          real state, and the reward matches what happened to the fire.
        </p>
        <p>
          None of these says <em>how</em> the fire spreads or where the helicopter should go, which is why they need no
          second implementation. The harness below plays 100 worlds, with actions half from the guard chief and half
          random, and gives each world a random time limit — a lesson from the{" "}
          <Link href="/learn/building-environments/coupled-clocks" style={link}>coupled-clocks page</Link>, where a test
          without short limits never saw time being called.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>One of the fifteen invariants in the next cell breaks on the real, unmodified environment. Which one?</>}
          options={["A burnt cell stays burnt", "The record of fire only grows", "Moisture in [0.05, 1], lakes 1", "Reward = −(new cells on fire)"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeInvariants} />
        <CodeOutput>{`100 worlds, 5215 steps; seen: drops 231, fills 177, fires out 49, times called 51
14 of 15 invariants held at every step
  BROKEN: 'reward = -(new cells on fire)' at 52 steps, first in world 0 at step 50`}</CodeOutput>

        <p>
          <strong>The reward.</strong> Fourteen invariants held through 5,215 steps that included 231 drops and 177 fills,
          with 49 episodes ending with the fire out and 51 with time called. The reward rule broke at 52 of those steps. Before touching the environment,
          look at the first failure.
        </p>
        <p>
          How the invariants are written matters as much as what they say. Each one is a line in a dictionary, so a
          failure names the rule rather than pointing at a line number. The <code>snapshot</code> copies only what the
          rules compare against. And the <code>seen</code> counts are there for the same reason as the branch counts on
          the <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link>: an invariant
          about drops that ran in a test with no drops has checked nothing.
        </p>

        <h2>Whose bug is it?</h2>
        <p>
          The next cell replays the same worlds with the same actions, stops at the first alarm, and keeps track of every
          drop so we can see what each cell went through.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeWhose} />
        <CodeOutput>{`first alarm: world 0, step 50
  reward from the environment -28, the invariant expected -27
  cells that caught fire this step: 8; cells new to the record of fire: 7
  cell (12, 11): already in the record. A drop put it out at step 8; it caught fire again at step 50`}</CodeOutput>

        <p>
          Cell (12, 11) burned, was put out by a drop at step 8, and 42 steps later caught fire again. The environment
          charged it again: 8 cells caught fire, two of them village cells, so the reward is −8 − 2 × 10 = −28. The
          invariant assumed each cell can only be charged once, because it counted cells <em>new to the record</em> — 7.
          Over a longer run of 32,626 steps the same invariant raised 324 alarms, and every one of them was explained
          exactly by cells that caught fire a second time.
        </p>
        <p>
          So the environment is behaving as written, and the invariant was wrong. That is a common outcome, and it is
          still a useful one: the invariant forced a decision that had been made silently.
        </p>

        <Callout color={GOLD} title={<>Decision record: a cell that catches fire again is charged again</>}>
          The alternative is to charge each cell once, the first time it ever burns, which is exactly what the broken
          invariant expected. We kept charging every ignition. The reward is meant to describe fire the world has to live
          through, and a cell that burns twice is fire twice; a put-out cell that relights is not free just because it
          burned before. We have not trained a crew under the charge-once reward, so we cannot tell you it would behave
          differently — this is a statement about what the reward should mean, not a measured improvement. Chapter 5 is
          where the reward gets its full treatment.
        </Callout>

        <p>
          Fixing the invariant is instructive too. To count &ldquo;cells that caught fire&rdquo; correctly, it has to know
          which burning cells the drop put out <em>before</em> the fire moved — so the corrected rule re-does the drop
          square: take the old map, put out the burning cells under the helicopter, and count cells that went from unburnt
          to burning. With that version, the long run produced no alarms. But notice the price: the invariant now copies a
          small piece of the rule it is checking. Every line of the rule an invariant copies is a line where the invariant
          and the environment can share the same mistake. Keep that copying as small as you can, and know where it is.
        </p>

        <h2>Plant a bug, and see who catches it</h2>
        <p>
          An invariant that never fails proves nothing unless it would have failed on a broken environment. The next cell
          builds <code>Buggy</code>: the environment&rsquo;s step written out in full, with a switch that plants one bug at
          a time. It uses the corrected reward invariant, and stops at the first broken rule.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeBugs} />
        <CodeOutput>{`(no bug: the real step)                    never caught in 100 worlds
no wall at the edge                        world 14, step  44: crashed with IndexError
a drop un-burns burnt cells                world  0, step  52: a burnt cell stays burnt
a drop never empties the bucket            world  0, step   8: a drop empties the bucket
the lake dries out                         world  0, step   2: moisture in [0.05, 1], lakes 1
village fires cost nothing extra           world  0, step  48: reward = -(cells that caught fire)
time is called even when the fire is out   world 66, step  78: never terminated and truncated
the wind blows the wrong way               never caught in 100 worlds
the ground dries 5x too fast               never caught in 100 worlds`}</CodeOutput>

        <p>
          Six of the eight bugs are caught, most of them within a few dozen steps of the first world. Two details are
          worth a look. The missing wall was found by a crash, not a rule. Had the helicopter flown off the top or left
          edge first, numpy would have silently accepted row or column −1 and the &ldquo;moves at most 1&rdquo; rule
          would have fired; instead it first flew off the bottom or right edge, in world 14, where index 16 does not exist
          and the observation crashed. And time being called on a finished fire was caught only in world 66,
          because it needs a fire to go out on exactly the step the limit arrives. Without random time limits, not one of
          300 test episodes ever reached the 300-step limit, and the bug survived every step we ran.
        </p>
        <p>
          The two survivors are the lesson. A wind that blows the wrong way and ground that dries five times too fast are
          both <em>possible worlds</em>. Every cell still burns for its time, moisture stays in range, the reward still
          matches the fire. Invariants describe what is impossible, and these bugs make nothing impossible — only wrong.
          Only a comparison against something that knows the right answer catches them: the equivalence tests from{" "}
          <Link href="/learn/building-environments/wind-moisture-and-slope" style={link}>the wind page</Link> caught a
          flipped wind direction at the first fire tick.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Run the invariants with <strong>no bug</strong> first, then plant each bug in turn. Look at how many
            times each rule broke, not just whether it did — and at the map of the first failure.</>}
          insight={<>In 200 episodes on this map, every bug except the backwards wind breaks a rule. How often varies
            enormously: a lake that dries breaks a rule on almost every step, while the missing wall broke one only 3 times
            in about 9,400 steps, and time called on a finished fire only 4 times, first in episode 52. A bug that shows up
            3 times in 9,400 steps is one a short test would miss.</>}
        >
          <BugHuntLab />
        </LabFrame>

        <Callout color={GOLD} title={<>Two kinds of test, two kinds of bug</>}>
          <strong>Comparisons</strong> — your code against a reference, on the same dice — catch wrong-but-possible
          dynamics like a reversed wind, but need a reference and only cover the worlds you run. <strong>Invariants</strong>{" "}
          need no reference, cost little, and run on every step of every world, but they are blind to any bug that keeps
          the world possible. You need both. In this track the comparisons came first, while each system was being built,
          and the invariants stay switched on afterwards: natively, the snapshot and all fifteen checks cost roughly 0.4 of
          a step, cheap enough to leave on while you develop.
        </Callout>

        <h2>A property between two runs</h2>
        <p>
          Some things cannot be checked from one step, but can be checked by comparing two runs. This is a{" "}
          <strong>metamorphic</strong> test: you do not know the right answer for either run, but you know how the two
          answers should relate. Water puts fire out, so here is a relation that sounds safe: <em>with the same dice,
          dropping water never leaves more fire than hovering would have.</em>
        </p>
        <p>
          Every time the guard chief is about to drop, the cell below splits the world in two with{" "}
          <code>copy.deepcopy</code>, which copies the dice generator too. One copy drops, the other hovers; then both
          hover, and the cell compares their fires 1, 2, 4 and 8 fire ticks later.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Same world, same dice. One copy drops water on the fire, the other hovers, and then both hover. A few fire
            ticks later, can the copy that dropped water ever have more cells burning?</>}
          options={["No, never", "Yes, but very rarely", "Yes, in about a quarter of cases", "Yes, usually"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeMeta} />
        <CodeOutput>{`277 drops by the guard chief in 100 held-out worlds
fire ticks later                     1    2    4    8
a cell burns only in the drop copy     2   12   32   67
the drop copy has MORE cells burning    0    0    2   11
... MORE cells in the record of fire    0    0    0    0
first case: world 1055, drop at step 16, cell (2, 12) was burning with 1 fire tick left;
  in the hover copy it burned out (burnt); in the drop copy it was put out, then caught fire again`}</CodeOutput>

        <p>
          <strong>Yes, but rarely.</strong> Eight fire ticks after the split, 11 of 277 drops had left <em>more</em> cells
          burning than hovering would have. The first case shows how. Cell (2, 12) was burning with one tick left. In the
          hover copy it burned out at the next tick. In the drop copy the water put it out <em>before</em> it could — it
          became unburnt, with its fuel intact — and a burning neighbour lit it again, starting a fresh, full-length burn.
          The drop extended that cell&rsquo;s fire. Over all 200 held-out worlds the pattern holds: 563 drops, and every
          one of the 5 cases visible one tick later was exactly this — a doused cell relit while its twin in the hover copy
          burned out. By 8 ticks, 146 drops had left at least one cell burning that the hover copy did not, and 24 had
          left more cells burning in total.
        </p>
        <p>
          The relation, as we wrote it, is false. But look at the last row of the table: the drop copy never had more
          cells <em>in the record of fire</em> — not in these 277 drops, and not in all 563 across 200 worlds, at any of
          the four checkpoints. A drop can rearrange <em>when</em> cells burn; in everything we ran, it never made more
          cells catch fire. That is the property worth keeping, and it is a tested claim, not a proof: it held in every
          case we checked, over eight fire ticks.
        </p>

        <Callout color={GOLD} title={<>Decision record: a put-out cell still becomes unburnt</>}>
          The relighting above is a direct consequence of a choice from the{" "}
          <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link>: a doused cell
          becomes unburnt, with its fuel intact, rather than burnt. There we measured the alternative and found an honest
          null — treating put-out cells as burnt changed the guard chief&rsquo;s village damage from 1.03 to 0.95 and
          untouched villages from 77% to 79%. The metamorphic test adds a mechanism to that record, not a reason to change
          it: the choice keeps the idea that wet fuel can burn again once it dries, and it costs the chiefs little. What
          the test did do is correct a sentence we might have written in a later chapter: &ldquo;a drop never makes things
          worse&rdquo; is not true in this world, even with the same dice.
        </Callout>

        <h3 style={h3}>When a test fails, shrink the case</h3>
        <p>
          A failure found by random play arrives buried in noise. The bug &ldquo;a drop un-burns burnt cells&rdquo;, hunted
          with purely random actions, first fails in world 8 after 53 actions, 47 of them something other than hovering.
          Which of those actions matter? A shrinker answers mechanically: replace one action at a time with hovering, keep
          the change if the test still fails, and repeat until nothing more can be removed. Here it shrank the case to 52
          hovers and a single button press at step 53. The bug needs no flying at all: the helicopter starts over the
          village, and by step 53 the fire has burnt cells within its drop square. A 53-action mystery became a one-line
          story.
        </p>
        <p>
          Property-testing libraries such as Hypothesis generate the random cases and do this shrinking for you. We wrote
          both by hand on this page because every cell has to run in the browser and because a dozen lines of shrinking
          show exactly what such a library is doing. We did not compare the two, so we make no claim about which finds
          bugs faster.
        </p>

        <Callout color={GOLD} title={<>The testing ladder for a world with several systems</>}>
          Chapter 4 used four kinds of test, and each caught something the others could not. Compare every system with a
          reference on the same dice while you build it — that caught a flipped wind convention and the missing slope clip.
          Check invariants on every step forever after — they catch impossible states in any world, and they found a
          decision we had never written down. Test relations between runs where no single run has a right answer — that
          found the relighting. And when anything fails, shrink it before you read it.
        </Callout>

        <h2>Where chapter 5 starts</h2>
        <p>
          The world is built: the fire, the wind, the helicopter, their clocks, fast enough to train on, and tested four
          ways. Chapter 5 puts a crew in it. It starts where the sailing world started, with baselines — the rules any
          learned crew must beat before it deserves a second look.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/a-grid-you-can-vectorise", label: <>← A grid you can vectorise</> }}
          next={{ href: "/learn/building-environments/baselines", label: <>Next · Baselines a fire chief would try →</> }}
        />
      </div>
    </article>
  );
}

const codeInvariants = `def snapshot(env):
    "Everything an invariant might compare against, copied before the step."
    return dict(T=env.T.copy(), E=env.E.copy(), S=env.S.copy(), timer=env.timer.copy(), ever=env.ever.copy(),
                pos=env.pos.copy(), water=env.water, t=env.t)

def check_step(before, env, a, out):
    "Things that must be true after EVERY step, in every world, whatever the agent did. Returns the ones broken."
    obs, reward, terminated, truncated, info = out
    b, S, T = before, env.S, env.T
    dropped = a == 5 and b["water"] > 0 and b["T"][tuple(b["pos"])] != LAKE
    rules = {
        "the map never changes":             np.array_equal(T, b["T"]) and np.array_equal(env.E, b["E"]),
        "a burnt cell stays burnt":          not ((b["S"] == BURNT) & (S != BURNT)).any(),
        "fire only where there is fuel":     not ((S == BURNING) & ~FLAMMABLE[T]).any(),
        "a burning cell has time left":      not ((S == BURNING) & (env.timer <= 0)).any(),
        "the record of fire only grows":     not (b["ever"] & ~env.ever).any() and not ((S != UNBURNT) & ~env.ever).any(),
        "the helicopter moves at most 1":    0 <= env.pos.min() and env.pos.max() < N and np.abs(env.pos - b["pos"]).sum() <= 1,
        "a drop empties the bucket":         env.water == b["water"] - 1 if dropped else True,
        "no button, no change in water":     env.water == b["water"] if a < 5 else 0 <= env.water <= BUCKET,
        "moisture in [0.05, 1], lakes 1":    env.M.min() >= 0.05 and env.M.max() <= 1 and bool((env.M[T == LAKE] == 1).all()),
        "wind strength in [0, 1]":           0 <= env.wspd <= 1,
        "the clock moves by one":            env.t == b["t"] + 1,
        "terminated = no fire left":         terminated == (not (S == BURNING).any()),
        "never terminated and truncated":    not (terminated and truncated),
        "the map layers show the state":     np.array_equal(obs[6], S == BURNING) and np.array_equal(obs[7], S == BURNT),
        "reward = -(new cells on fire)":     reward == -(env.ever & ~b["ever"]).sum() - 10.0 * (env.ever & ~b["ever"] & (T == VILLAGE)).sum(),
    }
    return [name for name, ok in rules.items() if not ok]

# Run it: 100 worlds, actions half from the guard chief and half random, and a random time limit on each world so
# that time is really called sometimes.
rng = np.random.default_rng(0)
broken, first, steps, seen = {}, {}, 0, {"drops": 0, "fills": 0, "fires out": 0, "times called": 0}
for seed in range(100):
    env = Wildfire(max_steps=int(rng.integers(10, 120)))
    env.reset(seed=seed)
    chief = pilot_chief("guard")
    while True:
        a = chief(env) if rng.random() < 0.5 else int(rng.integers(6))
        before = snapshot(env)
        out = env.step(a)
        steps += 1
        for name in check_step(before, env, a, out):
            broken[name] = broken.get(name, 0) + 1
            first.setdefault(name, (seed, env.t))
        seen["drops"] += a == 5 and before["water"] > 0 and before["T"][tuple(before["pos"])] != LAKE
        seen["fills"] += env.water > before["water"]
        if out[2] or out[3]:
            seen["fires out" if out[2] else "times called"] += 1
            break
print(f"100 worlds, {steps} steps; seen: " + ", ".join(f"{k} {v}" for k, v in seen.items()))
print(f"{15 - len(broken)} of 15 invariants held at every step")
for name, n in broken.items():
    print(f"  BROKEN: {name!r} at {n} steps, first in world {first[name][0]} at step {first[name][1]}")`;

const codeWhose = `# The same 100 worlds and the same actions as the last cell, stopping at the first step where the reward did not
# match the record of fire. Keep track of every drop, so we can see what each cell went through.
rng = np.random.default_rng(0)
found = None
for seed in range(100):
    env = Wildfire(max_steps=int(rng.integers(10, 120)))
    env.reset(seed=seed)
    chief = pilot_chief("guard")
    put_out_at = {}                                            # cell -> the last step a drop put it out
    while True:
        a = chief(env) if rng.random() < 0.5 else int(rng.integers(6))
        S0, ever0, pos0, water0 = env.S.copy(), env.ever.copy(), env.pos.copy(), env.water
        obs, reward, terminated, truncated, info = env.step(a)
        after_drop = S0.copy()                                 # the map just after the helicopter acted
        if a == 5 and water0 > 0 and env.T[tuple(pos0)] != LAKE:
            r, c = pos0
            square = after_drop[max(r - DROP_R, 0):r + DROP_R + 1, max(c - DROP_R, 0):c + DROP_R + 1]
            for dr, dc in np.argwhere(square == BURNING):
                put_out_at[(max(r - DROP_R, 0) + int(dr), max(c - DROP_R, 0) + int(dc))] = env.t
            square[square == BURNING] = UNBURNT
        grew = env.ever & ~ever0
        expected = -grew.sum() - 10.0 * (grew & (env.T == VILLAGE)).sum()
        if reward != expected:
            caught = (after_drop == UNBURNT) & (env.S == BURNING)
            found = (seed, env.t, reward, expected, caught, grew, put_out_at)
            break
        if terminated or truncated: break
    if found: break

seed, t, reward, expected, caught, grew, put_out_at = found
print(f"first alarm: world {seed}, step {t}")
print(f"  reward from the environment {reward:.0f}, the invariant expected {expected:.0f}")
print(f"  cells that caught fire this step: {int(caught.sum())}; cells new to the record of fire: {int(grew.sum())}")
for r, c in np.argwhere(caught & ~grew):
    print(f"  cell ({r}, {c}): already in the record. A drop put it out at step {put_out_at[(r, c)]}; it caught fire again at step {t}")`;

const codeBugs = `def snapshot(env):
    return dict(T=env.T.copy(), E=env.E.copy(), S=env.S.copy(), timer=env.timer.copy(), ever=env.ever.copy(),
                pos=env.pos.copy(), water=env.water, t=env.t)

def caught_fire(before, env, a):
    "Cells that caught fire this step, counting a cell that was put out and caught again."
    S = before["S"].copy()
    if a == 5 and before["water"] > 0 and before["T"][tuple(before["pos"])] != LAKE:
        r, c = before["pos"]
        square = S[max(r - DROP_R, 0):r + DROP_R + 1, max(c - DROP_R, 0):c + DROP_R + 1]
        square[square == BURNING] = UNBURNT                    # what the drop put out, before the fire moved
    return (S == UNBURNT) & (env.S == BURNING)

def check_step(before, env, a, out):
    "The 15 invariants, with the reward rule corrected."
    obs, reward, terminated, truncated, info = out
    b, S, T = before, env.S, env.T
    dropped = a == 5 and b["water"] > 0 and b["T"][tuple(b["pos"])] != LAKE
    new = caught_fire(before, env, a)
    rules = {
        "the map never changes":             np.array_equal(T, b["T"]) and np.array_equal(env.E, b["E"]),
        "a burnt cell stays burnt":          not ((b["S"] == BURNT) & (S != BURNT)).any(),
        "fire only where there is fuel":     not ((S == BURNING) & ~FLAMMABLE[T]).any(),
        "a burning cell has time left":      not ((S == BURNING) & (env.timer <= 0)).any(),
        "the record of fire only grows":     not (b["ever"] & ~env.ever).any() and not ((S != UNBURNT) & ~env.ever).any(),
        "the helicopter moves at most 1":    0 <= env.pos.min() and env.pos.max() < N and np.abs(env.pos - b["pos"]).sum() <= 1,
        "a drop empties the bucket":         env.water == b["water"] - 1 if dropped else True,
        "no button, no change in water":     env.water == b["water"] if a < 5 else 0 <= env.water <= BUCKET,
        "moisture in [0.05, 1], lakes 1":    env.M.min() >= 0.05 and env.M.max() <= 1 and bool((env.M[T == LAKE] == 1).all()),
        "wind strength in [0, 1]":           0 <= env.wspd <= 1,
        "the clock moves by one":            env.t == b["t"] + 1,
        "terminated = no fire left":         terminated == (not (S == BURNING).any()),
        "never terminated and truncated":    not (terminated and truncated),
        "the map layers show the state":     np.array_equal(obs[6], S == BURNING) and np.array_equal(obs[7], S == BURNT),
        "reward = -(cells that caught fire)": reward == -new.sum() - 10.0 * (new & (T == VILLAGE)).sum(),
    }
    return [name for name, ok in rules.items() if not ok]

class Buggy(Wildfire):
    "The environment's step with one bug planted. bug=None is the real step."
    def __init__(self, bug=None, **kw):
        super().__init__(**kw); self.bug = bug

    def step(self, a):
        r, c = self.pos; put_out = 0
        if a < 5:
            dr, dc = MOVES[a]
            if self.bug == "no wall at the edge": self.pos = np.array([r + dr, c + dc])
            else: self.pos = np.array([min(max(r + dr, 0), N - 1), min(max(c + dc, 0), N - 1)])
        elif self.T[r, c] == LAKE:
            self.water = BUCKET
        elif self.water > 0:
            r0, r1, c0, c1 = max(r - DROP_R, 0), min(r + DROP_R + 1, N), max(c - DROP_R, 0), min(c + DROP_R + 1, N)
            block = self.S[r0:r1, c0:c1]
            hit = (block != UNBURNT) if self.bug == "a drop un-burns burnt cells" else (block == BURNING)
            put_out = int(hit.sum())
            block[hit] = UNBURNT
            self.timer[r0:r1, c0:c1][hit] = 0
            self.M[r0:r1, c0:c1] = np.maximum(self.M[r0:r1, c0:c1], WET)
            if self.bug != "a drop never empties the bucket": self.water -= 1
        self.t += 1
        lit, village_lit = 0, 0
        if self.t % self.fire_every == 0:
            if self.bug == "the wind blows the wrong way":
                wdir = self.wdir
                self.wdir = (wdir + np.pi) % (2 * np.pi)        # the fire reads the wind turned round
                lit, village_lit = self.fire_tick()
                self.wdir = wdir
            else:
                lit, village_lit = self.fire_tick()
            if self.bug == "the lake dries out": self.M[self.T == LAKE] -= DRYING
            if self.bug == "the ground dries 5x too fast": self.M = np.where(self.T == LAKE, 1.0, np.maximum(self.M - 4 * DRYING, 0.05))
        if self.t % self.weather_every == 0:
            self.wdir = float((self.wdir + self.rng.normal(0, np.pi / 6)) % (2 * np.pi))
            self.wspd = float(np.clip(self.wspd + self.rng.normal(0, 0.15), 0.0, 1.0))
        reward = -lit if self.bug == "village fires cost nothing extra" else -lit - 10.0 * village_lit
        terminated = not (self.S == BURNING).any()
        if self.bug == "time is called even when the fire is out": truncated = self.t >= self.max_steps
        else: truncated = (not terminated) and self.t >= self.max_steps
        return self.observe(), float(reward), terminated, truncated, dict(lit=lit, village_lit=village_lit, put_out=put_out)

def hunt(bug, worlds=100):
    "The last cells' harness, stopping at the first broken invariant or crash."
    rng = np.random.default_rng(0)
    for seed in range(worlds):
        env = Buggy(bug, max_steps=int(rng.integers(10, 120))); env.reset(seed=seed); chief = pilot_chief("guard")
        while True:
            a = chief(env) if rng.random() < 0.5 else int(rng.integers(6))
            before = snapshot(env)
            try:
                out = env.step(a)
            except Exception as e:
                return seed, before["t"] + 1, f"crashed with {type(e).__name__}"
            broken = check_step(before, env, a, out)
            if broken: return seed, env.t, broken[0]
            if out[2] or out[3]: break
    return None

for bug in [None, "no wall at the edge", "a drop un-burns burnt cells", "a drop never empties the bucket", "the lake dries out",
            "village fires cost nothing extra", "time is called even when the fire is out",
            "the wind blows the wrong way", "the ground dries 5x too fast"]:
    found = hunt(bug)
    label = "(no bug: the real step)" if bug is None else bug
    print(f"{label:42s} " + (f"world {found[0]:2d}, step {found[1]:3d}: {found[2]}" if found else "never caught in 100 worlds"))`;

const codeMeta = `import copy

# A metamorphic test: no single right answer to check, but a RELATION between two runs that should hold.
# Claim: "with the same dice, dropping water never leaves more fire than hovering would have."
# Every time the guard chief is about to drop, split the world in two: one copy drops, the other hovers.
# Then both hover, and we compare the fire at the next few fire ticks.
drops, extra_cell, more_fire, more_record = 0, {1: 0, 2: 0, 4: 0, 8: 0}, {1: 0, 2: 0, 4: 0, 8: 0}, {1: 0, 2: 0, 4: 0, 8: 0}
example = None
for seed in range(1000, 1100):
    env = Wildfire(); env.reset(seed=seed)
    chief = pilot_chief("guard")
    while True:
        a = chief(env)
        if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE:
            drop, hover = copy.deepcopy(env), copy.deepcopy(env)     # deepcopy copies the dice generator too
            drop.step(5); hover.step(0); drops += 1
            ticks = 0
            while ticks < 8:
                if drop.t % FIRE_EVERY == 0:
                    ticks += 1
                    if ticks in extra_cell:
                        only_in_drop = (drop.S == BURNING) & (hover.S != BURNING)
                        extra_cell[ticks] += bool(only_in_drop.any())
                        more_fire[ticks] += int((drop.S == BURNING).sum() > (hover.S == BURNING).sum())
                        more_record[ticks] += int(drop.ever.sum() > hover.ever.sum())
                        if ticks == 1 and only_in_drop.any() and example is None:
                            r, c = np.argwhere(only_in_drop)[0]
                            example = (seed, env.t, r, c, int(env.S[r, c]), int(env.timer[r, c]), int(hover.S[r, c]))
                    if ticks == 8: break
                drop.step(0); hover.step(0)
        _, _, terminated, truncated, _ = env.step(a)
        if terminated or truncated: break

print(f"{drops} drops by the guard chief in 100 held-out worlds")
print("fire ticks later                     1    2    4    8")
print("a cell burns only in the drop copy " + "".join(f"{extra_cell[k]:5d}" for k in (1, 2, 4, 8)))
print("the drop copy has MORE cells burning" + "".join(f"{more_fire[k]:5d}" for k in (1, 2, 4, 8)))
print("... MORE cells in the record of fire" + "".join(f"{more_record[k]:5d}" for k in (1, 2, 4, 8)))
if example:
    seed, t, r, c, s0, t0, sh = example
    names = {UNBURNT: "unburnt", BURNING: "burning", BURNT: "burnt"}
    print(f"first case: world {seed}, drop at step {t + 1}, cell ({r}, {c}) was burning with {t0} fire tick left;")
    print(f"  in the hover copy it burned out ({names[sh]}); in the drop copy it was put out, then caught fire again")`;

const h3: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, color: "var(--ink)", margin: "1.6rem 0 0.5rem" };
