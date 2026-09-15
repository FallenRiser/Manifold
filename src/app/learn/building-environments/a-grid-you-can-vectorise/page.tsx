import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { ShiftLab } from "@/components/fire/ShiftLab";

export const metadata = {
  title: "A grid you can vectorise — Manifold",
  description:
    "Your fire rule is correct and slow: a Python loop over 256 cells. Rewrite it as eight whole-grid passes with a shift, prove it identical, then add a batch axis and run 64 worlds at once. The honest surprise: on a 16 × 16 grid, vectorising one world buys little; batching many is where the speed is. Decision records for what to speed up first, dice per world, and product versus sum of logs.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function AGridYouCanVectorise() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 20 minutes"
        title={<>A grid you can vectorise</>}
        intro={<>The fire you wrote is right, and it is a Python loop over every cell. An agent needs hundreds of thousands
          of steps, and the environment runs on the CPU, one step at a time, while the agent waits. This page makes the
          fire fast without changing a single cell of it: first one grid at a time, then many worlds at once. The two turn
          out to be very different kinds of speed-up.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Where the time goes</h2>
        <p>
          Before speeding anything up, measure where a step spends its time. We timed every part of the
          environment&rsquo;s <code>step</code> over the 200 held-out worlds, natively on our machine (the steps per
          second move by a few percent between runs; the shares did not):
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>who flies</th><th style={th}>steps per second</th><th style={th}>the fire tick</th><th style={th}>building the observation</th><th style={th}>everything else</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>standing by</td><td style={td}>4,608</td><td style={td}>81%</td><td style={td}>13%</td><td style={td}>6%</td></tr>
              <tr><td style={td}>guard the village</td><td style={td}>4,232</td><td style={td}>80%</td><td style={td}>13%</td><td style={td}>7%</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          The fire only moves on every second step, and it still takes four fifths of the time. The helicopter, for all
          the logic of the last two pages, is part of the last column. So the fire is the thing to speed up — and the
          environment&rsquo;s <code>fire_tick</code> is already the fast version. Here is how much faster than yours.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Your fire tick loops over 256 cells in Python; the environment&rsquo;s does the same arithmetic as whole-grid
            numpy operations. On the same fires, how much faster is the environment&rsquo;s?</>}
          options={["About 100 times", "About 20 times", "Between 3 and 7 times", "No faster"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeSlow} />
        <CodeOutput>{`3 worlds, 90 fire ticks, identical to the environment's: True
your loop:        5.50 ms per fire tick
env.fire_tick:    0.84 ms per fire tick   (6.5 times faster)`}</CodeOutput>

        <p>
          <strong>Between 3 and 7 times, depending on where Python runs.</strong> The output above came from this
          page&rsquo;s browser Python on our machine (6.5 times; two more runs gave 5.9 and 5.5). Natively, the same comparison gave
          2.6 to 3.0 times over three runs. Your timings will not match ours — they depend on the machine and on what else
          it is doing — so read the ratio, not the milliseconds. The browser widens the gap because it slows Python loops
          more than it slows numpy: your loop took about five times longer there than natively, the environment&rsquo;s
          tick about twice as long.
        </p>
        <p>
          Either way it is a smaller win than most people guess, and the reason is the size of the grid. A numpy operation on 256 numbers is fast, but every call
          has a fixed cost, and the vectorised tick makes dozens of calls: several per direction, eight directions. The
          loop, meanwhile, does its expensive arithmetic — the exponentials, the clip — only for neighbours that are
          actually burning, and most cells have none; everywhere else it is a few cheap comparisons. On a 16 × 16 grid
          those two effects nearly cancel. Keep that in mind; it is the most useful number on this page, and
          it comes back at the end.
        </p>

        <h2>Piece 1: what arrives from one direction</h2>
        <p>
          The loop asks every cell about its eight neighbours. The vectorised rule turns the question around and asks
          every direction about all cells at once: <em>for fire travelling south, which cells have a burning neighbour
          on their north side?</em> The answer is the burning grid moved one row down. That move is{" "}
          <code>shift</code>: <code>out[r, c] = a[r - dr, c - dc]</code>, with a fill value for cells whose neighbour
          would be off the map.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeShift} />
        <CodeOutput>{`a =
[[ 0  1  2  3]
 [ 4  5  6  7]
 [ 8  9 10 11]
 [12 13 14 15]]

my_shift(a, 1, 0, fill=-1): each cell holds its neighbour to the NORTH
[[-1 -1 -1 -1]
 [ 0  1  2  3]
 [ 4  5  6  7]
 [ 8  9 10 11]]

my_shift(a, -1, 1, fill=-1): each cell holds its neighbour to the SOUTH-WEST
[[-1  4  5  6]
 [-1  8  9 10]
 [-1 12 13 14]
 [-1 -1 -1 -1]]

4096 checks (8 directions x 256 cells, on one grid and on a batch of 5): all match the definition: True`}</CodeOutput>

        <p>
          Read the first example as fire travelling south, <code>(dr, dc) = (1, 0)</code>: cell 4 now holds 0, the value
          of its northern neighbour, and the whole top row holds the fill value because nothing is north of it. The
          function is four lines of slices. <code>rows_to</code> are the rows that have a neighbour on the map in this
          direction; <code>rows_frm</code> are the rows those neighbours sit in, one step the other way. The same for
          columns. One assignment copies the whole block.
        </p>
        <p>
          Two details are there for later. The <code>...</code> in <code>out[..., rows_to, cols_to]</code> means
          &ldquo;any axes in front&rdquo;, so the same function shifts one grid or a stack of them; the test checks both.
          And <code>fill</code> matters: shifting the <em>burning</em> grid needs <code>False</code> off the map (no fire
          arrives from outside), while shifting heights needs a number.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>First pass</strong> a few times and watch the middle map: the burning cells slide one
            cell in the direction of travel, and the right-hand map picks up that direction&rsquo;s share of the chance.
            Hover a cell on the right to see which directions reached it. Then grow the fire and press{" "}
            <strong>All 8 at once</strong>.</>}
          insight={<>Eight passes, each one operation on the whole grid, and every cell ends with the same chance the loop
            gives it — the lab compares the two after the eighth pass, cell by cell. A cell with no burning neighbour
            just multiplies by 1 eight times, which is why the vectorised rule needs no <code>if</code>. The lab&rsquo;s
            map is flat, so it leaves out slope; the Python cells keep it.</>}
        >
          <ShiftLab />
        </LabFrame>

        <h2>Piece 2: the rule as eight passes</h2>
        <p>
          Now the whole tick. Compare it line by line with your loop from the last cell. The loop over cells is gone.
          What replaces it is a loop over the eight directions, and inside it every quantity is a grid: the burning
          neighbour in that direction (<code>src</code>), the slope between each cell and that neighbour, and{" "}
          <code>p</code> for every cell at once. The wind factor is a single number per direction, as before. The
          if-statements become masks: <code>np.where(src, 1 - p, 1.0)</code> multiplies a cell&rsquo;s{" "}
          <code>not_lit</code> only where its neighbour burns, and <code>new</code> is a mask of every cell that caught.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeVec} />
        <CodeOutput>{`10 worlds, 349 fire ticks: every cell, timer and moisture identical to the environment's
your vectorised tick:    0.79 ms per fire tick
env.fire_tick:           0.72 ms per fire tick`}</CodeOutput>

        <p>
          Identical on the same 349 ticks the last page used, and about as fast as the environment&rsquo;s — it is the
          same code, apart from two changes. The first is that <code>my_fire_tick_vec</code> takes its dice as an argument
          instead of drawing them itself. The second is the pair of lines that turn the wind into arrays with{" "}
          <code>[..., None, None]</code>: for one world they do nothing useful, and on the next cell they are the reason
          nothing else has to change.
        </p>

        <Callout color={GOLD} title={<>Decision record: a product of &ldquo;not lit&rdquo;, not a sum of logarithms</>}>
          Multiplying eight factors into a grid is the natural reading of the rule from the{" "}
          <Link href="/learn/building-environments/fire-as-a-cellular-automaton" style={link}>cellular-automaton page</Link>.
          The common alternative adds <code>log(1 − p)</code> over the directions and exponentiates once at the end, which
          turns the eight passes into a sum — the shape a convolution library wants. We tested it on the same 349 ticks:
          not one cell caught differently, and the largest difference in any cell&rsquo;s chance of not catching was
          2.2 × 10<sup>−16</sup>, the size of a rounding error. An honest null: both work. We kept the product because it
          is the rule as written, and because on this grid there is no convolution to hand the sum to. If you move the
          fire to a GPU, the sum of logs is a fine choice; check it the same way.
        </Callout>

        <h2>Piece 3: a batch axis</h2>
        <p>
          A learning agent does not need one fast world. It needs many worlds stepping together, so that one call to the
          network can choose actions for all of them. Stack the layers of <em>B</em> worlds into arrays of shape{" "}
          <code>(B, 16, 16)</code> and pass them to the function from the last cell, unchanged. <code>my_shift</code>{" "}
          shifts every grid in the stack through the <code>...</code>; the wind, one direction and one strength per world,
          becomes shape <code>(B, 1, 1)</code> and multiplies each world&rsquo;s grids by its own factor. The only new
          code is loading the worlds, and one decision about the dice.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeBatch} />
        <CodeOutput>{`64 worlds in one batch, 2478 world-ticks: every world identical to its solo environment

batch size   world-ticks per second
         1                     1200
        16                     6998
        64                    11899
       256                    10447`}</CodeOutput>

        <p>
          Every one of the 64 worlds burns exactly as it does on its own, through 2,478 world-ticks. And here is the speed
          the last two pieces did not give. In the output above, a batch of 64 does about ten times as many world-ticks
          per second as one world at a time (11,899 against 1,200), and about sixty-five times as many as your loop managed
          at 5.50 ms a tick. Natively, over three runs, a batch of 64 did seven to ten times as many as one world, and
          twenty to twenty-four times as many as the loop. A batch spreads the fixed cost of each numpy call over many worlds,
          which is exactly the cost that swallowed most of the gain on one small grid.
        </p>
        <p>
          The curve does not climb forever, and where it flattens is not stable. In three browser runs, a batch of 256 was
          faster than 64 twice and slower once; natively, 256 roughly matched 64, and 1,024 fell to about half. That
          depends on your processor and its memory, so measure it on your machine rather than borrow our number.
        </p>

        <Callout color={GOLD} title={<>Decision record: every world keeps its own dice</>}>
          <code>load</code> gives each world a copy of its own generator, and every tick draws one grid of dice from each,
          stacked into a batch. The obvious shortcut is a single generator drawing all <code>(B, 16, 16)</code> dice at
          once. It is faster, but not by much — natively, at a batch of 64, one generator per world was between 2% and 22%
          slower than a shared one across five runs. Noisy, but never free. What the shortcut costs is worse. With one
          shared generator, the dice a world gets depend on how many other worlds are in the batch: we ran the same 16
          worlds for 40 ticks in a batch of 16 and in a batch of 64, and all 16 burned a different number of cells (world
          1000: 165 against 180). That breaks the promise from the{" "}
          <Link href="/learn/building-environments/the-reset-step-contract" style={link}>reset/step contract</Link> — the
          same seed and the same actions give the same episode — and with it the common-random-numbers comparisons this
          world depends on. We pay the extra time.
        </Callout>

        <h3 style={h3}>From a fast fire to a fast step</h3>
        <p>
          The fire was 80% of a step, so what does batching it do for a whole step? We built a batched version of{" "}
          <code>step</code> for this measurement — the fire and the observation as whole-batch operations, the helicopter
          and the wind still one world at a time in a Python loop — and checked it against solo environments: over 16
          worlds and 120 random steps, not one observation differed. Natively on our machine, lowest and highest of three
          runs:
        </p>
        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>version</th><th style={th}>world-steps per second</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>the environment, one world at a time</td><td style={td}>4,177 – 4,505</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>batched step, 16 worlds</td><td style={td}>25,252 – 25,645</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>batched step, 64 worlds</td><td style={td}>35,825 – 37,897</td></tr>
              <tr><td style={td}>batched step, 256 worlds</td><td style={td}>29,064 – 31,866</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          About eight times the solo environment at 64 worlds (8.0 to 8.7 in the three runs), with the helicopter still in
          a Python loop. That batched
          step is not part of the environment you import on these pages: the solo <code>Wildfire</code> stays the
          readable reference that every cell tests against, and a batched version earns its place only by matching it.
        </p>

        <Callout color={GOLD} title={<>Decision record: numpy, and nothing faster</>}>
          Compilers for Python loops, and array libraries that run on a GPU, could make this fire faster still. We did not
          measure them, so we will not claim how much. We kept to numpy for two reasons that do not need a measurement:
          every cell on this site runs in the browser, where numpy is available and those tools are not; and the batched
          numpy version is still close enough to the rule you wrote to be checked line by line. The eightfold gain from a
          batch came from an idea — share the fixed cost across worlds — not from a tool, and the idea carries over to whatever
          tool you use.
        </Callout>

        <Callout color={GOLD} title={<>Vectorise the batch, not only the grid</>}>
          On a small grid, turning loops into array operations bought between three and seven times, depending on where
          Python ran,
          because each array operation has a fixed cost that 256 cells cannot spread out. Stacking many worlds spread it out, and that is where the speed
          was. Whatever you build, measure where the step spends its time before you touch it, prove the fast version
          identical to the slow one on the same dice, and give every world its own dice so that a batch never changes a
          single episode.
        </Callout>

        <h2>What the next page adds</h2>
        <p>
          Every proof so far has compared two versions of a system on a handful of worlds. The next page,{" "}
          <Link href="/learn/building-environments/invariants-and-property-tests" style={link}>invariants and property
          tests</Link>, asks a different kind of question: what must be true in <em>every</em> world, at every step,
          whatever the agent does — checked without a second version to compare against.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/coupled-clocks", label: <>← Coupled clocks</> }}
          next={{ href: "/learn/building-environments/invariants-and-property-tests", label: <>Invariants and property tests →</> }}
        />
      </div>
    </article>
  );
}

const codeSlow = `import time

def catch_chance(T, S, M, E, wdir, wspd, r, c):
    "The rule you wrote on the last two pages, one cell at a time."
    if S[r, c] != UNBURNT or not FLAMMABLE[T[r, c]]:
        return 0.0
    wr, wc = -np.cos(wdir), np.sin(wdir)
    not_lit = 1.0
    for dr, dc in DIRS:
        nr, nc = r - dr, c - dc
        if 0 <= nr < N and 0 <= nc < N and S[nr, nc] == BURNING:
            dist = math.hypot(dr, dc)
            wind = np.exp(WIND_GAIN * wspd * (dr * wr + dc * wc) / dist)
            slope = np.clip(np.exp(SLOPE_GAIN * (E[r, c] - E[nr, nc])), 0.5, 2.0)
            p = SPREAD[T[r, c]] * (1 - M[r, c]) * wind * slope * (DIAGONAL if dist > 1 else 1.0)
            not_lit *= 1 - min(p, 1.0)
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
    new_M = np.where(T == LAKE, 1.0, np.maximum(M - DRYING, 0.05))
    return new_S, new_timer, new_M

# Time your loop against env.fire_tick on the same three fires, with the same dice.
loop_time, env_time, ticks, same = 0.0, 0.0, 0, True
for seed in (1000, 1001, 1002):
    env = Wildfire(); env.reset(seed=seed)
    mine = np.random.default_rng()
    mine.bit_generator.state = env.rng.bit_generator.state
    S, timer, M = env.S.copy(), env.timer.copy(), env.M.copy()
    while (S == BURNING).any():
        t0 = time.perf_counter()
        S, timer, M = my_fire_tick(env.T, S, timer, M, env.E, env.wdir, env.wspd, mine)
        loop_time += time.perf_counter() - t0
        t0 = time.perf_counter()
        env.fire_tick()
        env_time += time.perf_counter() - t0
        ticks += 1
        same = same and np.array_equal(S, env.S) and np.array_equal(timer, env.timer) and np.array_equal(M, env.M)
print(f"3 worlds, {ticks} fire ticks, identical to the environment's: {same}")
print(f"your loop:      {1000 * loop_time / ticks:6.2f} ms per fire tick")
print(f"env.fire_tick:  {1000 * env_time / ticks:6.2f} ms per fire tick   ({loop_time / env_time:.1f} times faster)")`;

const codeShift = `def my_shift(a, dr, dc, fill=0):
    "out[r, c] = a[r - dr, c - dc]: at every cell, what its neighbour at offset (-dr, -dc) holds. Off the map: fill."
    out = np.full_like(a, fill)
    H, W = a.shape[-2:]
    # The cells that HAVE that neighbour on the map (to), and where those neighbours are (frm).
    rows_to, rows_frm = slice(max(dr, 0), H + min(dr, 0)), slice(max(-dr, 0), H + min(-dr, 0))
    cols_to, cols_frm = slice(max(dc, 0), W + min(dc, 0)), slice(max(-dc, 0), W + min(-dc, 0))
    out[..., rows_to, cols_to] = a[..., rows_frm, cols_frm]    # "..." = any extra axes in front, such as a batch
    return out

a = np.arange(16).reshape(4, 4)
print("a =")
print(a)
print()
print("my_shift(a, 1, 0, fill=-1): each cell holds its neighbour to the NORTH")
print(my_shift(a, 1, 0, fill=-1))
print()
print("my_shift(a, -1, 1, fill=-1): each cell holds its neighbour to the SOUTH-WEST")
print(my_shift(a, -1, 1, fill=-1))
print()

# The test: every direction, every cell, against the definition written as a plain loop, on one grid and on a
# batch of 5 grids.
rng = np.random.default_rng(0)
checks, same = 0, True
for shape in ((N, N), (5, N, N)):
    x = rng.random(shape)
    for dr, dc in DIRS:
        got = my_shift(x, dr, dc, fill=-1.0)
        for r in range(N):
            for c in range(N):
                inside = 0 <= r - dr < N and 0 <= c - dc < N
                want = x[..., r - dr, c - dc] if inside else -1.0
                same = same and bool(np.all(got[..., r, c] == want))
                checks += 1
print(f"{checks} checks (8 directions x 256 cells, on one grid and on a batch of 5): all match the definition: {same}")`;

const codeVec = `import time

def my_shift(a, dr, dc, fill=0):
    out = np.full_like(a, fill)
    H, W = a.shape[-2:]
    rows_to, rows_frm = slice(max(dr, 0), H + min(dr, 0)), slice(max(-dr, 0), H + min(-dr, 0))
    cols_to, cols_frm = slice(max(dc, 0), W + min(dc, 0)), slice(max(-dc, 0), W + min(-dc, 0))
    out[..., rows_to, cols_to] = a[..., rows_frm, cols_frm]
    return out

def my_fire_tick_vec(T, S, timer, M, E, wdir, wspd, dice):
    "The same rule on the whole grid at once: one pass per DIRECTION instead of one per cell."
    burning = S == BURNING
    wdir = np.asarray(wdir)[..., None, None]                     # a number now; one per world on the next cell
    wspd = np.asarray(wspd)[..., None, None]
    wr, wc = -np.cos(wdir), np.sin(wdir)
    not_lit = np.ones(S.shape)                                   # every cell's chance of NOT catching, all at once
    for dr, dc in DIRS:
        src = my_shift(burning, dr, dc, False)                  # True where the neighbour at (-dr, -dc) is burning
        dist = math.hypot(dr, dc)
        wind = np.exp(WIND_GAIN * wspd * (dr * wr + dc * wc) / dist)
        slope = np.clip(np.exp(SLOPE_GAIN * (E - my_shift(E, dr, dc, 0.0))), 0.5, 2.0)
        p = SPREAD[T] * (1 - M) * wind * slope * (DIAGONAL if dist > 1 else 1.0)
        not_lit *= np.where(src, 1 - np.clip(p, 0, 1), 1.0)     # multiply in only where that neighbour burns
    new = (S == UNBURNT) & FLAMMABLE[T] & (dice < 1 - not_lit)  # the loop's if-statements, as masks
    timer = np.where(burning, timer - 1, timer)
    S = np.where(burning & (timer <= 0), BURNT, S)
    S = np.where(new, BURNING, S).astype(np.int8)
    timer = np.where(new, BURN_TIME[T], timer).astype(np.int8)
    M = np.where(T == LAKE, 1.0, np.maximum(M - DRYING, 0.05))
    return S, timer, M

# The test from the last page, now for the vectorised version: 10 worlds, real wind, hills and moisture.
vec_time, env_time, ticks, first_mismatch = 0.0, 0.0, 0, None
for seed in range(1000, 1010):
    env = Wildfire(); env.reset(seed=seed)
    mine = np.random.default_rng()
    mine.bit_generator.state = env.rng.bit_generator.state
    S, timer, M = env.S.copy(), env.timer.copy(), env.M.copy()
    while (S == BURNING).any():
        t0 = time.perf_counter()
        S, timer, M = my_fire_tick_vec(env.T, S, timer, M, env.E, env.wdir, env.wspd, mine.random((N, N)))
        vec_time += time.perf_counter() - t0
        t0 = time.perf_counter()
        env.fire_tick()
        env_time += time.perf_counter() - t0
        ticks += 1
        same = np.array_equal(S, env.S) and np.array_equal(timer, env.timer) and np.array_equal(M, env.M)
        if not same and first_mismatch is None: first_mismatch = (seed, ticks)
print(f"10 worlds, {ticks} fire ticks:", "every cell, timer and moisture identical to the environment's"
      if first_mismatch is None else f"FIRST MISMATCH {first_mismatch}")
print(f"your vectorised tick:  {1000 * vec_time / ticks:6.2f} ms per fire tick")
print(f"env.fire_tick:         {1000 * env_time / ticks:6.2f} ms per fire tick")`;

const codeBatch = `import time

def my_shift(a, dr, dc, fill=0):
    out = np.full_like(a, fill)
    H, W = a.shape[-2:]
    rows_to, rows_frm = slice(max(dr, 0), H + min(dr, 0)), slice(max(-dr, 0), H + min(-dr, 0))
    cols_to, cols_frm = slice(max(dc, 0), W + min(dc, 0)), slice(max(-dc, 0), W + min(-dc, 0))
    out[..., rows_to, cols_to] = a[..., rows_frm, cols_frm]
    return out

def my_fire_tick_vec(T, S, timer, M, E, wdir, wspd, dice):
    "Last cell's function, unchanged. Every array may now have a batch axis in front."
    burning = S == BURNING
    wdir = np.asarray(wdir)[..., None, None]
    wspd = np.asarray(wspd)[..., None, None]
    wr, wc = -np.cos(wdir), np.sin(wdir)
    not_lit = np.ones(S.shape)
    for dr, dc in DIRS:
        src = my_shift(burning, dr, dc, False)
        dist = math.hypot(dr, dc)
        wind = np.exp(WIND_GAIN * wspd * (dr * wr + dc * wc) / dist)
        slope = np.clip(np.exp(SLOPE_GAIN * (E - my_shift(E, dr, dc, 0.0))), 0.5, 2.0)
        p = SPREAD[T] * (1 - M) * wind * slope * (DIAGONAL if dist > 1 else 1.0)
        not_lit *= np.where(src, 1 - np.clip(p, 0, 1), 1.0)
    new = (S == UNBURNT) & FLAMMABLE[T] & (dice < 1 - not_lit)
    timer = np.where(burning, timer - 1, timer)
    S = np.where(burning & (timer <= 0), BURNT, S)
    S = np.where(new, BURNING, S).astype(np.int8)
    timer = np.where(new, BURN_TIME[T], timer).astype(np.int8)
    M = np.where(T == LAKE, 1.0, np.maximum(M - DRYING, 0.05))
    return S, timer, M

def load(seeds):
    "Deal B worlds and stack their layers into arrays of shape (B, 16, 16). Each world keeps its own dice."
    envs = [Wildfire() for _ in seeds]
    for env, seed in zip(envs, seeds): env.reset(seed=seed)
    T, S, timer, M, E = (np.stack([getattr(env, k) for env in envs]) for k in ("T", "S", "timer", "M", "E"))
    wdir, wspd = np.array([env.wdir for env in envs]), np.array([env.wspd for env in envs])
    gens = []
    for env in envs:
        g = np.random.default_rng()
        g.bit_generator.state = env.rng.bit_generator.state   # a copy of that world's own generator
        gens.append(g)
    return envs, T, S, timer, M, E, wdir, wspd, gens

# 1. The proof: 64 worlds in one batch, each against its own solo environment, until every fire is out.
envs, T, S, timer, M, E, wdir, wspd, gens = load(range(1000, 1064))
alive = (S == BURNING).any(axis=(1, 2))
world_ticks, mismatched = 0, set()
while alive.any():
    dice = np.stack([g.random((N, N)) for g in gens])          # shape (64, 16, 16): one grid of dice per world
    S2, timer2, M2 = my_fire_tick_vec(T, S, timer, M, E, wdir, wspd, dice)
    for i in np.flatnonzero(alive):
        envs[i].fire_tick()
        world_ticks += 1
        if not (np.array_equal(S2[i], envs[i].S) and np.array_equal(timer2[i], envs[i].timer) and np.array_equal(M2[i], envs[i].M)):
            mismatched.add(i)
    keep = alive[:, None, None]                                 # a world whose fire is out stays exactly as it was
    S, timer, M = np.where(keep, S2, S), np.where(keep, timer2, timer), np.where(keep, M2, M)
    alive = (S == BURNING).any(axis=(1, 2))
print(f"64 worlds in one batch, {world_ticks} world-ticks:",
      "every world identical to its solo environment" if not mismatched else f"{len(mismatched)} worlds differ")

# 2. The payoff: how many world-ticks per second at each batch size.
print()
print("batch size   world-ticks per second")
for B in (1, 16, 64, 256):
    envs, T, S, timer, M, E, wdir, wspd, gens = load([1000 + i % 64 for i in range(B)])
    done, t0 = 0, time.perf_counter()
    while time.perf_counter() - t0 < 0.5:
        dice = np.stack([g.random((N, N)) for g in gens])
        S, timer, M = my_fire_tick_vec(T, S, timer, M, E, wdir, wspd, dice)
        done += B
    print(f"{B:10d}   {done / (time.perf_counter() - t0):22.0f}")`;

const h3: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, color: "var(--ink)", margin: "1.6rem 0 0.5rem" };
const th: React.CSSProperties = { textAlign: "left", padding: "7px 10px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "7px 10px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
