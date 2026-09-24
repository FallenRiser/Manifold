import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Frames, hitboxes and i-frames — Manifold",
  description:
    "What 'the hitbox is live' actually means: a reach, an arc, and a facing that commits. Plus the player's side of it — eighteen frames of roll with ten of invulnerability — and the measurement showing the roll's window is twice as wide as the parry's and worth half as much.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FramesHitboxes() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 15 minutes"
        title={<>Frames, hitboxes and i-frames</>}
        intro={<>The moveset table says <code>heavy</code> is live on four frames. It does not say what live means.
          This page defines it — a hitbox here is a <em>reach</em> and an <em>arc</em>, and the boss&rsquo;s facing
          freezes the instant those frames begin — and then does the same for your side of it, where an eighteen-frame
          roll hands you ten frames during which nothing can touch you. Two windows, overlapping or not. That overlap is
          the fight.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>A hitbox is two numbers, and both have to be true</h2>
        <p>
          The one-dimensional prototype of this world had a single number per attack: how far it reached. That version
          could express &ldquo;back away from the slam&rdquo; and nothing else, which is why it was rebuilt. On a floor
          an attack is a <strong>wedge</strong>: a distance it can cross and a half-angle either side of where the boss
          is looking. You are hit only if you are inside both.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeFootprint} />
        <CodeOutput source="scripts/boss_cases.py">{outFootprint}</CodeOutput>
        <p>
          Those two pictures are the same fight seen from two moves. The <code>thrust</code> is a long thin spike: it
          will find you at 3.5 units, further than you can walk away from in the time it takes, but twenty degrees each
          side of centre is nothing — half a step is enough. The <code>slam</code> is a fat short cone: 1.4 radians is
          eighty degrees each side, so sidestepping it is hopeless and the only answers are distance or
          invulnerability.
        </p>
        <p>
          A world with only reach can price the first of those and not the second. That is not a missing feature; it is
          a missing <em>strategy</em>, and it is the strategy that separates somebody who has played these games from
          somebody who has not.
        </p>

        <h2>The rule that makes a late sidestep work</h2>
        <p>
          Wedges alone would not be enough either, because the boss could simply keep the wedge pointed at you. So there
          is one more rule, and it is the single most load-bearing line in the world:
        </p>
        <div style={brief}>
          The boss turns toward you while it winds up, slowly — 0.045 radians a frame. The instant the active frames
          begin, it stops turning.
        </div>
        <p>
          Everything about spacing follows from that. Step aside <em>early</em> and the boss has thirty frames of windup
          left to correct, at 0.045 a frame, which is 1.35 radians of correction — more than any arc in the table.
          Step aside <em>late</em>, in the last handful of windup frames, and it has no time to follow you. The
          difference between a sidestep that works and one that gets you killed is not the direction; it is the frame.
        </p>
        <PredictPrompt
          accent={GOLD}
          prompt={<>Two players both avoid every attack perfectly. One rolls <em>backwards</em> out of the reach; the
            other rolls <em>sideways</em> out of the arc. Over two hundred duels, which ends the fight further ahead —
            and by how much?</>}
          options={["Backwards, clearly — distance is safety", "Backwards, slightly",
                    "They are the same thing measured differently", "Sideways, and it is not close"]}
        />
        <CodeOutput source="scripts/boss_cases.py">{outArc}</CodeOutput>
        <p>
          <code>arcX</code> counts attacks that <em>reached</em> the player and missed anyway, because the player was
          not in front of the boss when the active frames began. The player who rolls backwards collects{" "}
          <strong>zero</strong> of them, by construction: it leaves the arc by leaving the reach, which is the
          one-dimensional answer. The player who rolls sideways collects 2.47 a duel, takes fewer hits, and — this is
          the part that matters — stands <strong>0.42 units closer</strong> while doing it, close enough to punish the
          recovery it just created. Same avoidance, better position.
        </p>
        <p>
          That gap is the entire justification for rebuilding this world from a line into a floor. If it had not
          appeared, the rebuild would have been a prettier picture of the same environment, and the honest thing would
          have been to say so.
        </p>

        <h2>Your side of it: eighteen frames, ten of them invulnerable</h2>
        <p>
          The player&rsquo;s defensive options are windows too, and they are not the same shape.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeIframes} />
        <CodeOutput source="scripts/boss_cases.py">{outIframes}</CodeOutput>
        <p>
          The roll is the forgiving one. Ten frames of invulnerability out of eighteen, and it carries you 1.7 units
          while it does it, so it answers a wedge in two ways at once — you are untouchable, <em>and</em> you have left.
          The parry is the strict one: five frames, no movement, no invulnerability outside them, and the fifteen
          stamina is gone whether it worked or not.
        </p>

        <h2>How wide is a window, measured rather than declared</h2>
        <p>
          Declaring &ldquo;the parry window is five frames&rdquo; is cheap. What matters is how much notice a player
          needs, so here is the sweep that answers it: a family of players identical except for one number{" "}
          <em>k</em> — press the button as soon as the next active frame is <em>k</em> frames away or closer.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outRoll}</CodeOutput>
        <p>
          Read the top block first, where the player decides every frame. The roll works for every <em>k</em> from 3 to
          12 and fails completely at 1 and 2 — a ten-frame-wide band with a cliff on the near side. It is not a slope:
          at <em>k</em> = 2 the press lands with the i-frames still starting up and you eat all 4.58 hits, exactly like
          a player who never pressed anything.
        </p>
        <p>
          The second block is the same sweep at the shipped decision rate of one press every three frames, and it is
          narrower and messier. A press aimed at <em>k</em> can land as late as <em>k</em> &minus; 2, so the usable band
          shrinks to 5 to 12, and <em>k</em> = 3 collapses to 2.17 dodges and 4.51 hits taken. The window did not change.
          What changed is how precisely you can aim at it — which is the whole subject of the{" "}
          <Link href="/learn/building-environments/stamina-and-the-perfect-guard-window" style={link}>next page</Link>,
          where the parry turns out to be four times less forgiving than this.
        </p>

        <Proof title="why the roll's window starts at frame 3 and not frame 0" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            Nothing in the physics requires a startup. It is there because a roll with invulnerability on frame 0 is a
            <em> reaction test with no cost</em>: you would press it at the last possible moment, every time, and the
            correct policy would be &ldquo;roll when the hitbox is one frame away&rdquo;. The three-frame startup makes
            the press a <em>prediction</em> instead — you have to commit before you are certain — and that is the skill
            the world exists to teach.
          </p>
          <p style={{ margin: 0 }}>
            The same argument sets the parry&rsquo;s startup, and you can see both in the sweep above: every row where{" "}
            <em>k</em> &lt; 3 is a player who reacted perfectly and died anyway. The startup frames are where a
            reaction-time advantage stops paying.
          </p>
        </Proof>

        <h2>Two decisions worth writing down</h2>
        <p>
          <strong>Your attack has a reach and no arc.</strong> An early draft declared <code>ATK_ARC = 0.90</code>{" "}
          alongside the player&rsquo;s reach, and it was never used: the hit test asks only whether the boss is within
          2.0 units. That could have been quietly left in the file as a constant that implies a rule the world does not
          have, and instead it was deleted. The justification for the asymmetry is that the player is{" "}
          <strong>locked on</strong> — always facing the boss, exactly as these games do it — so an arc test would be
          true whenever it mattered and false only in cases the world cannot reach. A rule that is never false is not a
          rule.
        </p>
        <p>
          <strong>A raised shield always covers the attack, for the same reason.</strong> An earlier version did test a
          guard arc, and because the player always faces the boss the test came out false exactly when a block mattered:{" "}
          <code>hold guard</code> blocked nothing and scored identically to standing still. That bug is only visible if
          your sanity ladder contains a player whose entire strategy is the mechanic being tested — which is an argument
          for the ladder, made twice now in this world.
        </p>

        <Callout color={GOLD} title={<>A whiff and an arc miss are different events, on purpose</>}>
          <p style={{ margin: 0 }}>
            When an active frame finds nobody, the world records a <code>whiff</code>. If the player was inside the reach
            and outside the arc, it <em>also</em> records an <code>arcX</code>. Two counters for one event looks
            redundant until you try to measure the sentence &ldquo;stepping out of an arc is worth more than stepping
            out of a reach&rdquo;, at which point the difference between them is the entire finding. Counters are
            cheap; the measurement you cannot make later because you did not count something is not.
          </p>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments/a-moveset-as-a-state-machine", label: <>← A moveset as a state machine</> }}
          next={{ href: "/learn/building-environments/stamina-and-the-perfect-guard-window", label: <>Stamina and the perfect-guard window →</> }}
        />
      </div>
    </article>
  );
}

const codeFootprint = `# "Live" means BOTH: inside the reach AND inside the arc. Draw the footprint of two moves.
def footprint(m, cols=41):
    print("%s -- reach %.1f, arc %.2f rad (%.0f degrees each side)"
          % (m["name"], m["reach"], m["arc"], m["arc"] * 180 / math.pi))
    print("   dist |      -1.6 rad  <---  straight ahead  --->  +1.6 rad")
    for i in range(13):
        d = 1.0 + 0.25 * i
        row = ""
        for j in range(cols):
            off = -1.6 + 3.2 * j / (cols - 1)
            row += "#" if d <= m["reach"] and abs(off) <= m["arc"] else "."
        print("   %4.2f | %s" % (d, row))

footprint(MOVES[1])
print()
footprint(MOVES[3])`;

const codeIframes = `# The player's two defensive windows, drawn the same way the boss's moves were.
roll = "".join("I" if ROLL_I0 <= f <= ROLL_I1 else "." for f in range(ROLL_LEN))
parry = "".join("P" if PAR_I0 <= f <= PAR_I1 else "." for f in range(PARRY_LEN))
print("roll   " + roll)
print("       %d frames, %d invulnerable (I), %.1f units of ground, %.0f stamina"
      % (ROLL_LEN, ROLL_I1 - ROLL_I0 + 1, ROLL_DIST, ROLL_COST))
print()
print("parry  " + parry)
print("       %d frames, %d that counter (P), no movement, %.0f stamina"
      % (PARRY_LEN, PAR_I1 - PAR_I0 + 1, PARRY_COST))
print()
print("and for scale, your own attack:")
print("swing  " + "".join({"w": "-", "h": "#", "r": "."}[k] * n for k, n in ATK_SEG))
print("       %d frames, %d active, reach %.1f, %.0f damage, %.0f stamina"
      % (sum(n for _, n in ATK_SEG), sum(n for k, n in ATK_SEG if k == "h"),
         ATK_REACH, ATK_DMG, ATK_COST))`;

const outFootprint = `thrust -- reach 3.6, arc 0.35 rad (20 degrees each side)
   dist |      -1.6 rad  <---  straight ahead  --->  +1.6 rad
   1.00 | ................#########................
   1.25 | ................#########................
   1.50 | ................#########................
   1.75 | ................#########................
   2.00 | ................#########................
   2.25 | ................#########................
   2.50 | ................#########................
   2.75 | ................#########................
   3.00 | ................#########................
   3.25 | ................#########................
   3.50 | ................#########................
   3.75 | .........................................
   4.00 | .........................................

slam -- reach 2.6, arc 1.40 rad (80 degrees each side)
   dist |      -1.6 rad  <---  straight ahead  --->  +1.6 rad
   1.00 | ...###################################...
   1.25 | ...###################################...
   1.50 | ...###################################...
   1.75 | ...###################################...
   2.00 | ...###################################...
   2.25 | ...###################################...
   2.50 | ...###################################...
   2.75 | .........................................
   3.00 | .........................................
   3.25 | .........................................
   3.50 | .........................................
   3.75 | .........................................
   4.00 | .........................................`;

const outIframes = `roll   ...IIIIIIIIII.....
       18 frames, 10 invulnerable (I), 1.7 units of ground, 25 stamina

parry  ...PPPPP..............
       22 frames, 5 that counter (P), no movement, 15 stamina

and for scale, your own attack:
swing  --------##..............
       24 frames, 2 active, reach 2.0, 12 damage, 20 stamina`;

const outArc = `reach is not enough: an attack also has an ARC (200 held-out duels)
  arcX counts attacks that reached the player and missed anyway, because the player
  was not in front of the boss when the active frames began.
  roll, punish       own hp  72.0  hits taken 1.81  i-frame dodges 2.41  arcX 0.00  mean distance 2.01  G 11.66
  sidestep, punish   own hp  75.3  hits taken 1.57  i-frame dodges 6.16  arcX 2.47  mean distance 1.59  G 12.35`;

const outRoll = `roll -- 18 frames long, invulnerable on ITS frames 3-12, pressed at k frames' notice (a decision every 1 frames, 100 duels)
---------------------------------------------------------------------------------------------------------------------------
   k   parries  dodges  hits taken   own hp        G
   1      0.00    0.00        4.58    -12.7   -41.27
   2      0.00    0.00        4.58    -12.7   -41.27
   3      0.00    9.70        0.20     97.2    -0.28
   4      0.00    8.17        0.20     97.2    -0.28
   5      0.00    8.17        0.20     97.2    -0.28
   6      0.00    8.17        0.21     97.1    -0.29
   7      0.00    8.17        0.25     96.5    -0.35
   8      0.00    8.17        0.32     95.5    -0.45
   9      0.00    7.37        0.00    100.0     0.00
  10      0.00    7.35        0.03     99.6    -0.04
  11      0.00    6.78        0.07     99.0    -0.10
  12      0.00    7.29        0.13     98.2    -0.18

roll -- 18 frames long, invulnerable on ITS frames 3-12, pressed at k frames' notice (a decision every 3 frames, 100 duels)
---------------------------------------------------------------------------------------------------------------------------
   k   parries  dodges  hits taken   own hp        G
   1      0.00    0.00        4.58    -12.7   -41.27
   2      0.00    0.00        4.58    -12.7   -41.27
   3      0.00    2.17        4.51    -12.0   -39.40
   4      0.00    5.65        3.18     23.5   -16.95
   5      0.00    8.65        0.09     98.7    -0.13
   6      0.00    8.17        0.18     97.5    -0.25
   7      0.00    8.17        0.21     97.1    -0.29
   8      0.00    8.03        0.25     96.5    -0.35
   9      0.00    7.79        0.19     97.3    -0.27
  10      0.00    7.36        0.21     97.1    -0.29
  11      0.00    7.30        0.24     96.6    -0.34
  12      0.00    7.29        0.25     96.5    -0.35

  the roll is FORGIVING and it is not a slope. At one decision a frame it works for every
  k from 3 to 12 -- ten frames wide, which is its ten invulnerable frames written down --
  and at k = 1 or 2 the press lands with the startup still running and you eat all 4.58
  hits, exactly like a player who never pressed anything. At one decision every three
  frames the band starts at 5 instead of 3, because a press aimed at k can land as late
  as k-2.`;

const brief: React.CSSProperties = {
  borderLeft: "3px solid var(--c-rl)",
  background: "color-mix(in srgb, var(--c-rl) 7%, transparent)",
  padding: "14px 18px",
  borderRadius: "0 8px 8px 0",
  fontFamily: "var(--font-display)",
  fontSize: 19,
  lineHeight: 1.45,
  color: "var(--ink)",
  margin: "1rem 0 1.2rem",
};
