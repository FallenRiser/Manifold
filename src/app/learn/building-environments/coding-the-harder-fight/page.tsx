import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { Quiz } from "@/components/Quiz";
import { BOSS_SETUP_V2 } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Coding the harder fight — Manifold",
  description:
    "The whole v2 environment, section by section and runnable: the moveset as data, how the boss chooses a move, how it closes the distance, the posture economy, the deflect window that wears out, and the 38 floats the learner sees. Plus the checklist for adding a move of your own.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CodingTheHarderFight() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 20 minutes"
        title={<>Coding the harder fight</>}
        intro={<>Every cell on this page runs. It is the v2 world in six pieces — the moveset as
          data, how the boss picks, how it closes, the posture economy, the deflect window, and
          the 38 floats the learner is handed — and it ends with the checklist for adding a move
          of your own without breaking anything.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <p>
          A warning about shape before any code. This world does not replace the first one — it is
          a second file beside it. <code>BOSS_SETUP</code> is frozen at a hash that a script
          asserts on every edit, because{" "}
          <Link href="/learn/building-environments/watch-it-fight" style={link}>the 200/200
          duellist</Link> is only a reproducible claim while the world it was scored in still
          exists. <code>BOSS_SETUP_V2</code> is what you are about to read, and the two share whole
          functions verbatim. That matters more than it sounds: a careless find-and-replace across
          the file edits both, which is exactly how the frozen world got broken once during this
          build. Every edit since slices the v2 block by offset and re-hashes v1 before writing.
        </p>

        <h2>1 — a move is a list of segments</h2>
        <p>
          The single most useful decision in this environment is that an attack is <em>data</em>,
          not code. A move is a list of <code>(kind, frames)</code> pairs and four letters:{" "}
          <code>w</code> windup, <code>d</code> delay, <code>h</code> active, <code>r</code>{" "}
          recovery. Nothing in <code>step()</code> knows what a sweep is. It walks segments.
        </p>

        <CodeBlock setup={BOSS_SETUP_V2} fromScratch={codeMoveset} />
        <CodeOutput>{outMoveset}</CodeOutput>

        <p>
          Read the shapes rather than the numbers. <code>jab</code> is 18 frames end to end and
          gone; <code>onslaught</code> is 174 frames with seven separate hitboxes and a held pause
          before the fifth. The <code>=</code> run in <code>heavy</code>, <code>slam</code> and{" "}
          <code>eruption</code> is the delay — the windup finishing and the hitbox <em>not</em>{" "}
          arriving — and it exists solely to punish anyone answering the animation on a rhythm
          instead of watching it.
        </p>
        <p>
          Because the moveset is data, adding an attack is adding a row. That is the entire reason
          for the grammar, and it is what made the five- and seven-hit strings a ten-minute change
          rather than a rewrite.
        </p>

        <h2>2 — how the boss chooses</h2>
        <p>
          Enemy behaviour here is not a state machine or a behaviour tree. It is two filters and a
          weighted draw, which is less than you would expect and more than enough.
        </p>

        <CodeBlock setup={BOSS_SETUP_V2} fromScratch={codePick} />
        <CodeOutput>{outPick}</CodeOutput>

        <p>
          The first filter is the interesting one. A move is a candidate only if it can{" "}
          <em>arrive</em>, and arriving is not the same as reaching: <code>adv</code> is metres of
          forward drift per windup frame, so a slow move with a long windup covers ground while it
          winds up. The <code>lunge</code> reaches 2.8 m on paper and threatens 6.8 m in practice.
        </p>
        <p>
          The second is the difficulty dial. Aggression tilts the weights toward the committing
          moves, and the eruption is deliberately held back at both ends — a boss that opens with
          its unblockable every time is a boss with one move.
        </p>

        <Callout color={GOLD} title={<>Why a weighted draw and not a behaviour tree</>}>
          <p style={{ margin: 0 }}>
            A tree encodes the designer&rsquo;s theory of the fight, and an agent that trains
            against it learns that theory rather than the fight. A weighted draw over reachable
            moves has no theory in it — it produces sequences nobody wrote, including bad ones, and
            the only way to beat it is to answer what is actually on screen. It is also one
            parameter to sweep when you want a difficulty dial, instead of a tree to rewrite.
          </p>
        </Callout>

        <h2>3 — how it moves, and the hole this was built to close</h2>
        <p>
          The first version of this fight had a physics hole an agent found within a few hundred
          thousand decisions: the boss could not catch a player who simply walked backwards. That
          is not a difficulty problem, it is a <em>degenerate optimum</em> — the environment was
          asking a question with a boring answer. Two things fix it.
        </p>

        <CodeBlock setup={BOSS_SETUP_V2} fromScratch={codeChase} />
        <CodeOutput>{outChase}</CodeOutput>

        <p>
          The first fix is unglamorous: <strong>the boss simply walks faster than you do</strong>,
          3.15 m/s against 2.25. A straight retreat now bleeds nine metres of ground every ten
          seconds in an eleven-metre ring, so distance decays on its own and doing nothing is no
          longer a strategy.
        </p>
        <p>
          The second is the gap-closer, and the gating is the design. Ordinary moves are considered
          inside <code>ENGAGE</code> at 3.4 m; the lunge is considered all the way out to{" "}
          <code>LUNGE_ENGAGE</code> at 7.0 m, and out there it is the <em>only</em> move that
          passes the filter. The band that used to be a safe reset is now the band where exactly
          one thing can happen to you, and it hits for 24.
        </p>

        <h2>4 — posture, and why health is not the resource</h2>
        <p>
          Damage kills the boss eventually. Posture is what makes a fight have a shape, because it
          is the resource that opens it up — and unlike health, it comes back.
        </p>

        <CodeBlock setup={BOSS_SETUP_V2} fromScratch={codePoise} />
        <CodeOutput>{outPoise}</CodeOutput>

        <p>
          The regeneration rule is the part worth stealing. It is tied to the boss&rsquo;s{" "}
          <em>vitality</em>: above 70% health posture refills at full speed, between 50 and 70 at
          half, and below 50% it does not come back at all. So the fight has two halves. Early,
          backing off to heal costs you every point of posture you built — the pressure has to be
          continuous or it is wasted. Late, progress sticks, and the boss stops being able to
          recover from a bad exchange.
        </p>
        <p>
          That single rule is what stops the optimal policy being &ldquo;poke once, retreat,
          repeat&rdquo;, which is what a posture bar with a flat regeneration always collapses
          into.
        </p>

        <h2>5 — the deflect, and the habit it punishes</h2>
        <p>
          The parry is the mechanic the whole rebuild was organised around. Two numbers define it
          and they pull in opposite directions on purpose.
        </p>

        <CodeBlock setup={BOSS_SETUP_V2} fromScratch={codeParry} />
        <CodeOutput>{outParry}</CodeOutput>

        <p>
          <strong>The window is generous and the fatigue is brutal.</strong> A press connects if
          the blow arrives 67–233 ms later, which is a real read rather than a coin flip. But every
          press inside 30 frames of the last one costs two frames of that window, so three hasty
          presses spend it completely — and since recovery is 16 frames while the fatigue lasts 30,
          pressing again as soon as the game <em>lets</em> you is precisely what wears it out.
        </p>
        <p>
          A parry that lands clears the fatigue outright. Reading well is the only way to keep the
          window open, which is the entire point: width forgives imprecision, fatigue punishes
          pressing without a reason. An earlier build had both punishing, which double-taxed the
          read and made the mechanic feel like a dice roll.
        </p>

        <h2>6 — what the learner is handed</h2>
        <p>
          No pixels. Thirty-eight floats, and — this is the important omission —{" "}
          <strong>no frames-until-impact</strong>. That number exists in the file as a helper the
          scripted players call, and it is deliberately kept out of the observation, because
          learning it is the skill the world exists to test.
        </p>

        <CodeBlock setup={BOSS_SETUP_V2} fromScratch={codeObs} />
        <CodeOutput>{outObs}</CodeOutput>

        <p>
          So the agent does not watch an animation. It is handed a move&rsquo;s identity on frame
          one and a stopwatch, and has to learn the mapping from{" "}
          <em>(which move, how far in)</em> to <em>is this the moment</em>. It gets strictly more
          than a human does in one respect — perfect identification, no visual ambiguity — and
          strictly less in another: one frame at a time, a photograph with a caption, never motion.
        </p>
        <p>
          Two clocks, not one, and the second was a repair. <code>v[23]</code> saturates at 60
          frames, which was harmless when the longest move was 78 frames and became a real blind
          spot the moment the 114- and 174-frame strings were added: six of the moveset&rsquo;s 22
          hitboxes landed while that float read a flat 1.0, so four of{" "}
          <code>onslaught</code>&rsquo;s seven hits were untimeable. <code>v[37]</code> is position
          within <em>this</em> move, always 0 to 1, which makes them distinguishable again.
        </p>

        <Callout color={GOLD} title={<>The bug that keeps recurring in this build</>}>
          <p style={{ margin: 0 }}>
            Note the shape of that mistake, because it is the third time it happened here. The
            clock ceiling was correct. The long combos were correct. The defect lived in the
            <em> interaction</em>, and neither change looked wrong on its own. The same pattern
            produced a stunlock earlier — tightening defence and loosening offence in one sitting —
            and it is the reason the discipline on this track is to re-measure where two changes
            meet, not just to test each change.
          </p>
        </Callout>

        <h2>Adding a move of your own</h2>
        <p>
          Here is the checklist, in the order that avoids pain. It is short because the grammar did
          the work.
        </p>
        <ol>
          <li>
            <strong>Write the row.</strong> A name, a segment list, <code>reach</code>,{" "}
            <code>arc</code> in radians, <code>dmg</code>, and <code>adv</code> for forward drift.
            Add <code>gap: True</code> if it should be selectable past <code>ENGAGE</code>, or{" "}
            <code>unblockable: True</code> if no button should answer it.
          </li>
          <li>
            <strong>Space the hits at least <code>PARRY_LEN</code> apart</strong> if you want them
            parryable. The original <code>combo</code> spaced its two hits 12 frames apart against
            a 16-frame recovery, which made the second hit mathematically unparryable — and nobody
            noticed for weeks, because nothing counted.
          </li>
          <li>
            <strong>Give it a weight</strong> in the picker, or it inherits 1.0 and appears as
            often as a jab.
          </li>
          <li>
            <strong>Check the observation still fits.</strong> <code>MOVE_SLOTS</code> is 12 and
            only 11 are used, so the twelfth move costs nothing. The thirteenth shifts every index
            after it and silently invalidates every trained net.
          </li>
          <li>
            <strong>Mirror it in both twins and re-run the port check.</strong> The TypeScript
            arena and the Python world are separate implementations; the only thing keeping them
            identical is a script that replays recorded duels frame by frame.
          </li>
        </ol>

        <DecisionPoint
          accent={GOLD}
          question={<>You add a 200-frame combo. What breaks first?</>}
          options={[
            {
              label: "Nothing — the moveset is data, so a long move is just another row",
              verdict: "miss",
              response: (
                <>True of <code>step()</code>, and false of everything downstream. The engine walks
                segments and does not care how many there are. The observation does care.</>
              ),
            },
            {
              label: "The absolute clock saturates and the late hits become untimeable",
              verdict: "best",
              response: (
                <>Exactly what happened here. <code>v[23]</code> is <code>min(frame, 60)/60</code>,
                so every hit past frame 60 reports an identical 1.0 and the agent cannot tell them
                apart. It cost four of onslaught&rsquo;s seven hits until <code>v[37]</code> was
                added. A 200-frame move needs that per-move clock or most of it is invisible.</>
              ),
            },
            {
              label: "The episode clock — 200 frames is most of the 36-second limit",
              verdict: "close",
              response: (
                <>Worth checking, and not the first failure: 200 frames is 6.7 s against a 36 s
                limit, so it fits about five times over. It would distort the pacing long before it
                broke anything.</>
              ),
            },
          ]}
        />

        <Quiz
          accent={GOLD}
          questions={[
            {
              q: <>Why is <code>adv</code> (forward drift per windup frame) part of the reach
                filter rather than just <code>reach</code>?</>,
              options: [
                "It makes the arithmetic simpler",
                "A move with a long windup covers ground while winding up, so it arrives further than its reach",
                "It controls how much damage the move does at range",
                "It is only used for the eruption",
              ],
              answer: 1,
              explain: (
                <>The lunge reaches 2.8 m but drifts 0.22 m per frame across an 18-frame windup,
                covering 3.96 m before the hitbox exists — a threat range of 6.76 m. Filtering on
                reach alone would have the boss refuse to use its own gap-closer.</>
              ),
            },
            {
              q: <>The boss&rsquo;s posture stops regenerating below 50% health. What would happen
                if it regenerated at a flat rate instead?</>,
              options: [
                "Nothing much — regeneration rate is a cosmetic tuning choice",
                "The fight would be harder, since posture always comes back",
                "Poke-once-then-retreat becomes optimal, because retreating costs nothing",
                "The boss would never be staggered at all",
              ],
              answer: 2,
              explain: (
                <>With flat regeneration there is no penalty for disengaging, so the safest policy
                is to land one hit and back out forever. Tying recovery to vitality means early
                pressure must be continuous to count, and late progress sticks — which is what
                gives the fight two distinct halves.</>
              ),
            },
            {
              q: <>Two hits in a combo are spaced 12 frames apart. <code>PARRY_LEN</code> is 16.
                What is true of the second hit?</>,
              options: [
                "It is harder to parry but possible with good timing",
                "It cannot be parried at all — you are still in recovery when it lands",
                "It can be parried only if the first was missed",
                "It parries automatically as part of the same press",
              ],
              answer: 1,
              explain: (
                <>If you parried the first hit you are locked in recovery for 16 frames and the
                second arrives at 12. No input exists that answers it. This shipped undetected
                because the spacing was never checked against the recovery — the kind of defect
                that is invisible to playtesting and obvious to arithmetic.</>
              ),
            },
          ]}
        />

        <PrevNext
          prev={{ label: "A harder fight", href: "/learn/building-environments/a-harder-fight" }}
          next={{ label: "Reading a policy off its buttons", href: "/learn/building-environments/reading-a-policy" }}
        />
      </div>
    </article>
  );
}

const codeMoveset = `
# A move is a list of (kind, frames). Four kinds, and the whole moveset is data:
#   w = windup    the tell. Long enough to read, or it is not a fair move.
#   d = delay     the windup HOLDS. This is what breaks a player parrying to a rhythm.
#   h = active    the hitbox is live. Almost always 2-6 frames.
#   r = recovery  the punish window you are being offered.
moveset()

jab = MOVES[0]
print()
print("jab as data:", jab["seg"])
print("total frames:", move_len(jab), "  reach", jab["reach"], "  arc", jab["arc"], "rad")
print("windup is", jab["seg"][0][1], "frames =", round(1000 * jab["seg"][0][1] / FPS), "ms of warning")
`;

const outMoveset = `windup -   delay =   ACTIVE #   recovery .
jab       ------##..........  18 frames, reach 2.2, arc 0.70 rad, 11 damage
slash     --------------###................  33 frames, reach 2.4, arc 0.80 rad, 18 damage
thrust    ------------------##......................  42 frames, reach 3.6, arc 0.35 rad, 22 damage
sweep     ----------------####........................  44 frames, reach 3.2, arc 1.90 rad, 26 damage
heavy     --------------------========####............................  60 frames, reach 2.7, arc 0.95 rad, 34 damage
slam      ------------------------============#####..............................  71 frames, reach 2.6, arc 1.40 rad, 30 damage
combo     ------------###---------###......................  49 frames, reach 2.3, arc 0.70 rad, 14 damage
flurry    --------------##----------------##----------------##----------------##----------------##..........................  114 frames, reach 2.4, arc 0.75 rad, 9 damage
onslaught ----------------##------------------##------------------##------------------##==============----------##------------------##------------------##..............................  174 frames, reach 2.5, arc 0.80 rad, 8 damage
lunge     ------------------###..........................  47 frames, reach 2.8, arc 0.60 rad, 24 damage
eruption  ------------------------------========######..................................  78 frames, reach 4.2, arc 3.20 rad, 40 damage  UNBLOCKABLE

jab as data: [('w', 6), ('h', 2), ('r', 10)]
total frames: 18   reach 2.2   arc 0.7 rad
windup is 6 frames = 200 ms of warning`;

const codePick = `
# The boss does not pick uniformly. Two filters and a weighting, in that order.
#
# 1. REACH FILTER: a move is a candidate only if it can actually arrive. "adv" is how far the
#    boss drifts forward per windup frame, so a slow move reaches further than its reach says.
d_test = 3.0
print("at", d_test, "metres, which moves can reach?")
for i, m in enumerate(MOVES):
    wind = sum(n for k, n in m["seg"] if k in ("w", "d"))
    span = m["reach"] + m["adv"] * wind
    mark = "yes" if span >= d_test - 0.1 else " no"
    print("  %-10s reach %.1f + drift %.2f = %.2f   %s" % (m["name"], m["reach"], m["adv"] * wind, span, mark))

# 2. WEIGHTING: the committing moves get likelier as aggression rises. The eruption stays rare
#    whatever happens -- a boss that opens with its unblockable every time is a boss with one move.
print()
print("how aggression tilts the table (weights, not probabilities):")
for aggr in (0.1, 0.9):
    row = []
    for m in MOVES:
        n = m["name"]
        if n == "eruption":
            w = 0.35 + 0.5 * aggr
        elif n == "lunge":
            w = 1.4
        elif n == "flurry":
            w = 1.5
        elif n == "onslaught":
            w = 0.9 + 0.6 * aggr
        elif n in ("heavy", "slam"):
            w = 1 + 1.5 * aggr
        else:
            w = 1.0
        row.append("%s %.2f" % (n[:5], w))
    print("  aggr %.1f:" % aggr, "  ".join(row))
`;

const outPick = `at 3.0 metres, which moves can reach?
  jab        reach 2.2 + drift 0.30 = 2.50    no
  slash      reach 2.4 + drift 0.42 = 2.82    no
  thrust     reach 3.6 + drift 1.35 = 4.95   yes
  sweep      reach 3.2 + drift 0.64 = 3.84   yes
  heavy      reach 2.7 + drift 0.42 = 3.12   yes
  slam       reach 2.6 + drift 0.00 = 2.60    no
  combo      reach 2.3 + drift 0.94 = 3.24   yes
  flurry     reach 2.4 + drift 2.34 = 4.74   yes
  onslaught  reach 2.5 + drift 3.25 = 5.75   yes
  lunge      reach 2.8 + drift 3.96 = 6.76   yes
  eruption   reach 4.2 + drift 0.00 = 4.20   yes

how aggression tilts the table (weights, not probabilities):
  aggr 0.1: jab 1.00  slash 1.00  thrus 1.00  sweep 1.00  heavy 1.15  slam 1.15  combo 1.00  flurr 1.50  onsla 0.96  lunge 1.40  erupt 0.40
  aggr 0.9: jab 1.00  slash 1.00  thrus 1.00  sweep 1.00  heavy 2.35  slam 2.35  combo 1.00  flurr 1.50  onsla 1.44  lunge 1.40  erupt 0.80`;

const codeChase = `
# What the boss does when it cannot reach you. This is the hole v1 had: a boss that could not
# close simply lost to anyone who walked backwards, so the agent learned to walk backwards.
print("ENGAGE       ", ENGAGE, "m -- inside this, pick any move that reaches")
print("LUNGE_ENGAGE ", LUNGE_ENGAGE, "m -- out to HERE it may still pick a gap-closer")
print("B_CHASE      ", B_CHASE, "m/frame =", round(B_CHASE * FPS, 2), "m/s, the boss walking")
print("P_SPEED      ", P_SPEED, "m/frame =", round(P_SPEED * FPS, 2), "m/s, you")
print()

# The first fix is simply that the boss is FASTER. Retreating in a straight line now loses
# ground on its own, which it did not in v1.
gain = (B_CHASE - P_SPEED) * FPS
print("it closes at %.2f m/s while you run flat out, so a straight retreat" % gain)
print("gives up ground at %.1f m every ten seconds. Backing off is no longer free." % (gain * 10))
print()

# The second fix is the lunge: a move whose WINDUP travels. "adv" is metres of forward drift
# per windup frame, so the threat range is reach plus everything the windup covers.
lunge = [m for m in MOVES if m["name"] == "lunge"][0]
wind = sum(n for k, n in lunge["seg"] if k in ("w", "d"))
travel = wind * lunge["adv"]
print("lunge: %d windup frames x %.2f m drift = %.2f m of travel before the hitbox" % (wind, lunge["adv"], travel))
print("threat range = reach %.1f + travel %.2f = %.2f m from a standing start" % (lunge["reach"], travel, lunge["reach"] + travel))
print("retreating for those %d frames buys you only %.2f m." % (wind, wind * P_SPEED))
print()
print("That is why the gap-closer is gated at %.1f m and everything else at %.1f m:" % (LUNGE_ENGAGE, ENGAGE))
print("between those two distances the lunge is the ONLY move it may choose, so the band")
print("that used to be a safe reset is the band where it hurts most.")
`;

const outChase = `ENGAGE        3.4 m -- inside this, pick any move that reaches
LUNGE_ENGAGE  7.0 m -- out to HERE it may still pick a gap-closer
B_CHASE       0.105 m/frame = 3.15 m/s, the boss walking
P_SPEED       0.075 m/frame = 2.25 m/s, you

it closes at 0.90 m/s while you run flat out, so a straight retreat
gives up ground at 9.0 m every ten seconds. Backing off is no longer free.

lunge: 18 windup frames x 0.22 m drift = 3.96 m of travel before the hitbox
threat range = reach 2.8 + travel 3.96 = 6.76 m from a standing start
retreating for those 18 frames buys you only 1.35 m.

That is why the gap-closer is gated at 7.0 m and everything else at 3.4 m:
between those two distances the lunge is the ONLY move it may choose, so the band
that used to be a safe reset is the band where it hurts most.`;

const codePoise = `
# Posture, not health, is what opens the boss up. Every landed hit spends some.
print("pool          ", B_POISE_MAX)
print("light hit     ", POISE_HIT, "-> %d to break from full" % -(-B_POISE_MAX // POISE_HIT))
print("heavy hit     ", POISE_HIT2, "-> %d to break from full" % -(-B_POISE_MAX // POISE_HIT2))
print("a parry       ", PARRY_POISE, "-> %d to break from full" % -(-B_POISE_MAX // PARRY_POISE))
print("break gives   ", POISE_STAGGER, "frames of stagger, and hits during it do x%.0f" % RIPOSTE_MULT)
print()
print("Those counts assume the posture bar sits still between your hits. It does not --")
print("which is the whole design, and is why in a real duel a heavy route costs about one")
print("more swing than the division says.")
print()

# The regen is what makes the pool a decision rather than a counter. It is tied to VITALITY:
# below half health the boss stops recovering posture at all, so a fight that has gone well
# stays gone well.
print("posture regen per frame, by the boss's remaining health:")
for frac in (1.0, 0.8, 0.6, 0.4):
    scale = 1 if frac > REGEN_HI else 0.5 if frac > REGEN_LO else 0
    per_sec = POISE_REGEN * scale * FPS
    secs = (B_POISE_MAX / per_sec) if per_sec else float("inf")
    print("  at %3d%% health: %.2f/frame = %.1f/s" % (100 * frac, POISE_REGEN * scale, per_sec), end="")
    print("   full refill in %.1fs" % secs if per_sec else "   never refills")
`;

const outPoise = `pool           100.0
light hit      16.0 -> 7 to break from full
heavy hit      33.0 -> 4 to break from full
a parry        50.0 -> 2 to break from full
break gives    60 frames of stagger, and hits during it do x3

Those counts assume the posture bar sits still between your hits. It does not --
which is the whole design, and is why in a real duel a heavy route costs about one
more swing than the division says.

posture regen per frame, by the boss's remaining health:
  at 100% health: 0.35/frame = 10.5/s   full refill in 9.5s
  at  80% health: 0.35/frame = 10.5/s   full refill in 9.5s
  at  60% health: 0.17/frame = 5.2/s   full refill in 19.0s
  at  40% health: 0.00/frame = 0.0/s   never refills`;

const codeParry = `
# The deflect rule. The window is wide, and what punishes you is pressing without a read.
print("window when fresh:", PARRY_WIN, "frames =", round(1000 * PARRY_WIN / FPS), "ms")
print("live on frames", PAR_I0, "to", PAR_I0 + PARRY_WIN - 1, "after the press")
print("so a press lands if the hit arrives %d-%d frames later (%d-%d ms)"
      % (PAR_I0, PAR_I0 + PARRY_WIN - 1,
         round(1000 * PAR_I0 / FPS), round(1000 * (PAR_I0 + PARRY_WIN - 1) / FPS)))
print()
print("the fatigue ladder -- each press inside", PARRY_HEAT, "frames of the last costs", PARRY_STEP, "frames:")
for stack in range(PARRY_MAX_STACK + 1):
    win = max(0, PARRY_WIN - PARRY_STEP * stack)
    print("  press %d in a row: %d frames (%3d ms)%s"
          % (stack + 1, win, round(1000 * win / FPS), "   <- nothing left" if win == 0 else ""))
print()
print("recovery is %d frames, the fatigue lasts %d, and %d > %d --"
      % (PARRY_LEN, PARRY_HEAT, PARRY_HEAT, PARRY_LEN))
print("so pressing again the instant the game allows it is exactly what wears it out.")
print("A parry that LANDS clears the fatigue outright. Reading well is the only way to keep it wide.")
`;

const outParry = `window when fresh: 6 frames = 200 ms
live on frames 2 to 7 after the press
so a press lands if the hit arrives 2-7 frames later (67-233 ms)

the fatigue ladder -- each press inside 30 frames of the last costs 2 frames:
  press 1 in a row: 6 frames (200 ms)
  press 2 in a row: 4 frames (133 ms)
  press 3 in a row: 2 frames ( 67 ms)
  press 4 in a row: 0 frames (  0 ms)   <- nothing left

recovery is 16 frames, the fatigue lasts 30, and 30 > 16 --
so pressing again the instant the game allows it is exactly what wears it out.
A parry that LANDS clears the fatigue outright. Reading well is the only way to keep it wide.`;

const codeObs = `
# What the learner is handed: 38 floats, and nothing else. No pixels, no frames-until-impact.
env = Duel(seed=7)
for _ in range(40):
    env.step(A_IDLE)
v = env.obs()
LABELS = ["distance", "sin off-axis", "cos off-axis", "room behind you", "your health",
          "boss health", "your stamina", "your action", "your action frame", "your hitstun",
          "guarding"]
print("%d floats. The first eleven are you and the geometry:" % len(v))
for i, lab in enumerate(LABELS):
    print("  v[%2d] %-18s %7.3f" % (i, lab, v[i]))
print("  v[11..22]  one-hot of WHICH move is out (12 slots, 11 used -- room to add one)")
print("  v[23]      min(frame, 60)/60   the absolute clock on this move")
print("  v[24..27]  one-hot of the phase: windup / delay / active / recovery")
print("  v[28..31]  stagger, reach, arc, and whether you are inside the hitbox right now")
print("  v[32..33]  clock, boss posture")
print("  v[34..36]  parry fatigue, heat, and whether the boss is flinching")
print("  v[37]      frame / move_len   how far through THIS move -- see below")
print()
print("boss move out:", MOVES[env.bm]["name"] if env.bm >= 0 else "none",
      "  phase:", phase_at(MOVES[env.bm], env.bf)[0] if env.bm >= 0 else "-")
print("v[23] =", round(float(v[23]), 3), "   v[37] =", round(float(v[37]), 3))
`;

const outObs = `38 floats. The first eleven are you and the geometry:
  v[ 0] distance             0.089
  v[ 1] sin off-axis         0.000
  v[ 2] cos off-axis         1.000
  v[ 3] room behind you      0.500
  v[ 4] your health          1.000
  v[ 5] boss health          1.000
  v[ 6] your stamina         1.000
  v[ 7] your action          0.000
  v[ 8] your action frame    0.025
  v[ 9] your hitstun         0.000
  v[10] guarding             0.000
  v[11..22]  one-hot of WHICH move is out (12 slots, 11 used -- room to add one)
  v[23]      min(frame, 60)/60   the absolute clock on this move
  v[24..27]  one-hot of the phase: windup / delay / active / recovery
  v[28..31]  stagger, reach, arc, and whether you are inside the hitbox right now
  v[32..33]  clock, boss posture
  v[34..36]  parry fatigue, heat, and whether the boss is flinching
  v[37]      frame / move_len   how far through THIS move -- see below

boss move out: lunge   phase: w
v[23] = 0.183    v[37] = 0.234`;
