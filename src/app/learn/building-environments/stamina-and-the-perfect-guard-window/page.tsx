import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Stamina and the perfect-guard window — Manifold",
  description:
    "The resource that stops every good idea being free, and the five frames that pay the most in the world. Why the shield is priced in stamina rather than in chip damage, and why the agent's decision rate is set by the parry window rather than by how fast training runs.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function StaminaAndParry() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 16 minutes"
        title={<>Stamina and the perfect-guard window</>}
        intro={<>Without a second resource this world collapses into one sentence: roll through everything. Stamina is
          what stops it. It is also what makes the shield a decision rather than a setting, and — through one number
          nobody expects to be load-bearing — it is what sets how often the agent is allowed to press a button. That
          number was measured, not chosen, and getting it wrong deletes a mechanic without any error message.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>One hundred points, and everything costs some of them</h2>
        <p>
          Health answers &ldquo;how many mistakes can I make&rdquo;. Stamina answers a different and more interesting
          question: <em>how many good ideas can I have in a row?</em> Every defensive option in this world works. What
          stops the fight being trivial is that you cannot afford all of them.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeStamina} />
        <CodeOutput source="scripts/boss_cases.py">{outStamina}</CodeOutput>
        <p>
          The last block is the one that decides fights. Sustainably — counting the twenty-frame lock that any spend
          puts on regeneration — you can roll once every 2.2 seconds. The boss attacks roughly every 3.2 seconds, so{" "}
          <strong>you can just afford to avoid everything it does</strong>, with about a second to spare. What you
          cannot afford is to avoid everything <em>and</em> hit it: a roll plus a swing needs 4.1 seconds of
          regeneration, which is more than the gap between attacks.
        </p>
        <p>
          That single inequality is why the two avoiding players on the sanity ladder end their duels alive and losing.
          They take 8.50 and 8.80 swings in thirty seconds, roughly one for every attack they dodge, and still leave the
          boss on 95 and 90 health out of 240. They are not playing badly; they are paying for their defence in the
          currency they need for offence, which is what a stamina bar is <em>for</em>.
        </p>

        <h2>The shield is not free, and it is not priced in health</h2>
        <p>
          A block in this world lets 20% of the damage through as chip, which sounds like the cost. It is not. The real
          cost is that blocking spends 0.6 stamina per point of damage absorbed, and when stamina hits zero while you
          are guarding the shield is knocked aside and you are helpless for forty-five frames — a second and a half, in
          a world where the boss&rsquo;s slowest attack takes seventy-one frames and its fastest takes thirty-three.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeGuard} />
        <CodeOutput source="scripts/boss_cases.py">{outGuard}</CodeOutput>
        <p>
          That is one duel, printed frame by frame, and it is the whole argument. The shield holds for the first few
          attacks and then the bar runs out on a heavy hit and everything after it is free damage. A player who blocks
          is not choosing to take 20%; they are choosing <em>when</em> to be defenceless.
        </p>
        <p>
          The ablation makes the point properly. Turn chip damage from 0.20 down to 0.00 and up to 0.35, and watch which
          number moves and which does not.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outChip}</CodeOutput>
        <p>
          Chip moves the health left — 97.9 down to 5.9 across the sweep — and <strong>guard breaks do not move at
          all</strong>: 3.20, 3.20, 3.20, 3.17. They are caused by the stamina cost, which the sweep does not touch.
          If you wanted a shield that felt more dangerous, chip is the wrong dial; <code>GUARD_ST</code> is the right
          one. And the third column is the ablation checking itself: the sidestepping player never blocks, so its row is
          perfectly flat at 12.67 and 75.9 across every setting. A sweep whose control column moves is a sweep that is
          measuring something else.
        </p>

        <h2>Five frames that pay more than anything else in the world</h2>
        <p>
          The parry is the cheapest action on the board — fifteen stamina, less than a swing — and the most expensive
          mistake. It has no invulnerability outside its window, it does not move you, and the stamina is gone whether
          it worked or not. What it buys, when it lands, is the best deal in the world: the attack is negated entirely,
          the boss is staggered for fifty-five frames, and everything you land during those frames does triple damage.
        </p>
        <Proof title="the arithmetic of one successful parry" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            Fifty-five frames of stagger; your swing is twenty-four frames long from button to recovery. So a parry buys
            room for two full swings, costing forty stamina, dealing 2 &times; 12 &times; 3 = <strong>72 damage</strong>{" "}
            — nearly a third of the boss&rsquo;s bar, for a total of fifty-five stamina and one correctly timed button.
          </p>
          <p style={{ margin: 0 }}>
            The expert does not actually manage two, and the gap is instructive: over two hundred duels{" "}
            <code>patient parry</code> lands 8.56 parries and takes only <strong>7.00</strong> swings, because it
            refuses to start a swing that the stagger will not outlast. It leaves damage on the table on purpose. The
            greedier version of the same player — identical except that it also punishes recovery frames — deals more
            damage, wins five fewer duels out of two hundred and ends on 44.7 health instead of 100.0. One line of
            difference, and the line is greed.
          </p>
        </Proof>
        <p>
          So: how much notice does a player need to land one? Same sweep as the roll on the previous page, same players,
          one button changed.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outParry}</CodeOutput>
        <p>
          At one decision per frame it is a cliff with vertical sides: <em>k</em> from 3 to 7 wins every duel on full
          health, and <em>k</em> = 2 or <em>k</em> = 8 takes all 4.58 hits and dies. Five frames, exactly as written in
          the constants. That is a satisfying result and a slightly alarming one, because it means there is no partial
          credit anywhere in this mechanic — no region where you are &ldquo;nearly&rdquo; parrying.
        </p>

        <h2>The number that turned out not to be a training knob</h2>
        <p>
          Real players do not press a button every frame, and neither should the agent: thirty decisions a second is
          thirty times the training cost for no obvious gain. So the world lets one decision cover <em>R</em> frames,
          and the natural instinct is to treat <em>R</em> as a speed dial — turn it up until training is cheap enough.
        </p>
        <p>
          The second block above is why you cannot. At <em>R</em> = 3 the usable band narrows from five frames to three,
          because a press aimed at <em>k</em> can land as late as <em>k</em> &minus; 2. Push a little further and the
          band vanishes.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outRate}</CodeOutput>
        <DecisionPoint
          accent={GOLD}
          question={<>Training is slower than you want. You are considering one decision every six frames instead of
            every three. What is the honest thing to do?</>}
          options={[
            {
              label: "Predict the threshold from the moveset, then measure it",
              verdict: "best",
              response: (<>The parry window is five frames wide and the press has to land inside a three-frame band, so{" "}
                <em>R</em> &le; 3 guarantees a decision inside it and <em>R</em> = 6 cannot — the prediction comes out of
                the constants before any duel is run. The sweep then confirms it brutally: 100% wins at <em>R</em> = 3,{" "}
                <strong>21.7% wins and 73.3% deaths at <em>R</em> = 6</strong>, with parries halved.</>),
            },
            {
              label: "Halve the decision rate and check that the agent still trains",
              verdict: "miss",
              response: (<>The agent will still train. It will train in a world where the parry no longer exists, and
                nothing will tell you — no error, no warning, just a slightly worse learning curve you will attribute to
                hyperparameters. This is the failure mode the sweep exists to catch.</>),
            },
            {
              label: "Widen the parry window to match the coarser decision rate",
              verdict: "close",
              response: (<>Defensible, and it is what a game designer would do. But it changes the world rather than the
                experiment, and it stales every number measured before it. If training cost is genuinely the binding
                constraint, this is the honest way to spend it — but write it down as a design change, not as a
                configuration tweak.</>),
            },
            {
              label: "Keep R = 1: the agent should have every frame a human does",
              verdict: "close",
              response: (<>Safe, and three times the cost for nothing. The sweep says <em>R</em> &le; 3 is free: 100%
                wins and 8.43, 8.47, 8.51 parries at <em>R</em> = 1, 2 and 3. Buying a third of the decisions for no
                measurable loss is the kind of saving worth measuring for.</>),
            },
          ]}
        />
        <p>
          This generalises past duels, which is why it is worth a page. <strong>The decision rate is bounded below by
          the tightest window in the world.</strong> Whatever you are building — a robot with a contact event, a trading
          system with a quote lifetime, a game with a parry — find the shortest interval on which an action has to
          land, and derive the rate from it. It is not a hyperparameter; it is a fact about the environment, and you can
          compute it before you train anything.
        </p>

        <Callout color={GOLD} title={<>The four prices, side by side</>}>
          <p style={{ margin: 0 }}>
            <strong>Guard</strong> — 0.6 stamina per point blocked, 20% through, and a 45-frame lockout when the bar
            empties. Always available, never decisive. <strong>Roll</strong> — 25 stamina, ten invulnerable frames out
            of eighteen, 1.7 units of ground, forgiving to press. <strong>Parry</strong> — 15 stamina, five frames,
            nothing if you miss, and about a third of the boss&rsquo;s health if you do not. <strong>Attack</strong> —
            20 stamina, 24 frames during which you cannot defend yourself, which is why the interesting question in this
            world is never &ldquo;can I hit it&rdquo; but &ldquo;can I afford to be busy right now&rdquo;.
          </p>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments/frames-hitboxes-and-i-frames", label: <>← Frames, hitboxes and i-frames</> }}
          next={{ href: "/learn/building-environments/writing-the-duel", label: <>Writing step(), section by section &rarr;</> }}
        />
      </div>
    </article>
  );
}

const codeStamina = `# Everything you can do costs stamina, and the bar is the same size as your health bar.
print("action        cost   fraction of a full bar   how many in a row")
for name, cost in [("attack", ATK_COST), ("roll", ROLL_COST), ("parry", PARRY_COST)]:
    print("%-10s %6.0f %19.0f%% %19.1f" % (name, cost, 100 * cost / P_ST_MAX, P_ST_MAX / cost))
print("%-10s %6s %19s %19s" % ("guard", "%.1f/pt" % GUARD_ST, "-", "-"))

print()
print("regeneration: %.2f a frame = %.1f a second, but only after a %d-frame lock"
      % (ST_REGEN, ST_REGEN * FPS, ST_DELAY))
print("empty to full: %.1f seconds" % (P_ST_MAX / ST_REGEN / FPS))
print("one parry back: %.1f seconds  |  one roll back: %.1f seconds"
      % (ST_DELAY / FPS + PARRY_COST / ST_REGEN / FPS, ST_DELAY / FPS + ROLL_COST / ST_REGEN / FPS))
print()
print("the number that decides the fight is the SUSTAINABLE rate -- the lock plus the refill:")
for name, cost in [("roll", ROLL_COST), ("swing", ATK_COST), ("parry", PARRY_COST)]:
    print("  one %-6s every %4.1f s" % (name, (ST_DELAY + cost / ST_REGEN) / FPS))
print("  one roll AND one swing every %4.1f s"
      % ((2 * ST_DELAY + (ROLL_COST + ATK_COST) / ST_REGEN) / FPS))`;

const codeGuard = `# What actually breaks a guard: one duel spent holding the shield up, printed as it happens.
print("move     dmg   chip through   stamina spent   blocks before an empty bar")
for m in MOVES:
    print("%-7s %5.0f %14.1f %15.1f %28.1f"
          % (m["name"], m["dmg"], m["dmg"] * GUARD_CHIP, m["dmg"] * GUARD_ST,
             P_ST_MAX / (m["dmg"] * GUARD_ST)))

e = Duel(seed=1002)
print()
print("frame   event                        stamina   health")
while True:
    b0, k0 = e.log["guard_breaks"], e.log["blocks"]
    _, _, term, trunc, _ = e.step(A_GUARD)
    if e.log["guard_breaks"] > b0:
        print("%5d   GUARD BREAK - helpless for %d frames %5.1f %8.1f" % (e.t, GUARDBREAK, e.pst, e.php))
    elif e.log["blocks"] > k0:
        print("%5d   blocked                     %7.1f %8.1f" % (e.t, e.pst, e.php))
    elif e.log["hits_taken"] > 0 and e.p_stun == HITSTUN - 1:
        print("%5d   HIT - the shield was down    %7.1f %8.1f" % (e.t, e.pst, e.php))
    if term or trunc:
        break
print()
print("finished on %.1f health after %d frames: %d blocks, %d guard breaks, %d clean hits"
      % (e.php, e.t, e.log["blocks"], e.log["guard_breaks"], e.log["hits_taken"]))`;

const outStamina = `action        cost   fraction of a full bar   how many in a row
attack         20                  20%                 5.0
roll           25                  25%                 4.0
parry          15                  15%                 6.7
guard      0.6/pt                   -                   -

regeneration: 0.55 a frame = 16.5 a second, but only after a 20-frame lock
empty to full: 6.1 seconds
one parry back: 1.6 seconds  |  one roll back: 2.2 seconds

the number that decides the fight is the SUSTAINABLE rate -- the lock plus the refill:
  one roll   every  2.2 s
  one swing  every  1.9 s
  one parry  every  1.6 s
  one roll AND one swing every  4.1 s`;

const outGuard = `move     dmg   chip through   stamina spent   blocks before an empty bar
slash      18            3.6            10.8                          9.3
thrust     22            4.4            13.2                          7.6
heavy      34            6.8            20.4                          4.9
slam       30            6.0            18.0                          5.6
combo      14            2.8             8.4                         11.9

frame   event                        stamina   health
   61   blocked                        79.6     93.2
  155   blocked                        59.2     86.4
  259   blocked                        38.8     79.6
  342   blocked                        25.6     75.2
  449   blocked                         7.6     69.2
  540   GUARD BREAK - helpless for 45 frames   0.0     62.4
  637   GUARD BREAK - helpless for 45 frames   0.0     55.6
  746   GUARD BREAK - helpless for 45 frames   0.0     48.8
  835   blocked                         0.6     44.4

finished on 44.4 health after 900 frames: 9 blocks, 3 guard breaks, 0 clean hits`;

const outChip = `chip damage through a block -- what prices the shield (60 duels)
----------------------------------------------------------------
   chip                 hold guard              block, punish           sidestep, punish
   0.00 G  -0.21 hp  97.9 brk 3.20 G   6.91 hp  92.3 brk 6.22 G  12.67 hp  75.9 brk 0.00
   0.10 G  -2.85 hp  71.5 brk 3.20 G   4.43 hp  67.5 brk 6.22 G  12.67 hp  75.9 brk 0.00
   0.20 G  -5.48 hp  45.2 brk 3.20 G   1.95 hp  42.7 brk 6.22 G  12.67 hp  75.9 brk 0.00
   0.35 G -16.91 hp   5.9 brk 3.17 G  -8.19 hp   6.3 brk 6.17 G  12.67 hp  75.9 brk 0.00
  guard breaks do not move with chip -- the stamina cost is what breaks a guard.
  sidestep, punish never blocks, so its row is flat: the ablation does what it says.`;

const outParry = `parry -- 22 frames long, counters on ITS frames 3-7, pressed at k frames' notice (a decision every 1 frames, 100 duels)
-----------------------------------------------------------------------------------------------------------------------
   k   parries  dodges  hits taken   own hp        G
   1      0.00    0.00        4.58    -12.7   -41.27
   2      0.00    0.00        4.58    -12.7   -41.27
   3     11.05    0.00        0.00    100.0     0.00
   4     11.05    0.00        0.00    100.0     0.00
   5     11.05    0.00        0.00    100.0     0.00
   6     11.05    0.00        0.00    100.0     0.00
   7     11.05    0.00        0.00    100.0     0.00
   8      0.00    0.00        4.58    -12.7   -41.27
   9      0.00    0.00        4.58    -12.7   -41.27
  10      0.00    0.00        4.58    -12.7   -41.27
  11      0.00    0.00        4.58    -12.7   -41.27
  12      0.00    0.00        4.58    -12.7   -41.27

parry -- 22 frames long, counters on ITS frames 3-7, pressed at k frames' notice (a decision every 3 frames, 100 duels)
-----------------------------------------------------------------------------------------------------------------------
   k   parries  dodges  hits taken   own hp        G
   1      0.00    0.00        4.58    -12.7   -41.27
   2      0.00    0.00        4.58    -12.7   -41.27
   3      2.04    0.00        4.73    -12.6   -41.26
   4      5.57    0.00        4.20      5.4   -26.56
   5     11.05    0.00        0.00    100.0     0.00
   6     11.05    0.00        0.00    100.0     0.00
   7     11.05    0.00        0.00    100.0     0.00
   8      5.57    0.00        4.20      5.4   -26.56
   9      1.57    0.00        4.81    -12.6   -40.96
  10      0.00    0.00        4.58    -12.7   -41.27
  11      0.00    0.00        4.58    -12.7   -41.27
  12      0.00    0.00        4.58    -12.7   -41.27

  the parry is the same shape and four times tighter: k = 3..7 at one decision a frame,
  which is the five-frame window written down as five frames, and NOTHING outside it. At
  one decision every three frames only k = 5..7 is safe -- three frames wide -- and k = 4
  already leaks 4.20 hits a duel. That is the whole argument for R <= 3, arrived at from
  the moveset rather than from how fast training goes. It costs 15 stamina against the
  roll's 25 and it buys a 55-frame stagger instead of survival: the hardest timing in
  the world pays the most.`;

const outRate = `one decision every R frames -- the parry window is 5 frames wide (120 duels)
----------------------------------------------------------------------------
   R |         patient parry |          parry oracle
   1 |  100.0w   0.0d  8.43p |   98.3w   1.7d  4.60p
   2 |  100.0w   0.0d  8.47p |   98.3w   1.7d  4.67p
   3 |  100.0w   0.0d  8.51p |   96.7w   3.3d  4.60p
   4 |   95.8w   1.7d  8.16p |   86.7w  13.3d  3.74p
   6 |   21.7w  73.3d  4.14p |   52.5w  47.5d  2.33p
   8 |    0.0w 100.0d  1.57p |   13.3w  86.7d  1.23p
  12 |    2.5w  95.8d  1.77p |   14.2w  85.8d  1.19p
  R <= 3 is free; R = 6 cannot land a press inside the window and the mechanic goes.`;
