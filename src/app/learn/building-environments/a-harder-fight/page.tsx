import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { DuelArenaLabV2 } from "@/components/boss/DuelArenaLabV2";

export const metadata = {
  title: "A harder fight — Manifold",
  description:
    "The duel rebuilt: eleven moves instead of five, a two-hundred-millisecond parry window that shrinks every time you press it too soon, and an unblockable that no button answers — plus the measurement showing the new rule actually bites.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function AHarderFight() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 12 minutes"
        title={<>A harder fight</>}
        intro={<>The duellist won two hundred out of two hundred, and that is the problem. An environment an agent
          has solved has stopped asking anything. So here is the same fight with the doors its answer walked
          through closed: eleven moves instead of five, a parry window you can spend by pressing it, and one
          attack that no button in the game answers.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <p>
          Everything on the previous eight pages was measured against one world, and that world does not change
          again — <Link href="/learn/building-environments/watch-it-fight" style={link}>the arena you already
          have</Link> still runs the net that scored 200/200, still on the same five moves, because a published
          number whose environment moved underneath it is not a number any more. This is a <em>second</em> world,
          standing beside the first. The interesting part is not that it is harder; it is <em>which</em> things you
          have to change to make a solved problem into a problem again.
        </p>

        <p>
          Play it. <strong>W A S D</strong> to move, <strong>J</strong> light, <strong>L</strong> heavy,{" "}
          <strong>K</strong> parry, <strong>Shift</strong> guard, <strong>Space</strong> roll. Watch the parry
          window above the arena while you do — it is the instrument the old arena had no need of.
        </p>

        <DuelArenaLabV2 />

        <h2>What the old answer was, and how it is closed</h2>
        <p>
          v1 had five moves and they were all frontal cones of a similar width. That is a single shape, and a
          single shape has a single answer: back away and to the side, and almost everything misses. The agent
          found it, and once it had, the other four moves were decoration. Three additions close that door, and
          each one closes a different part of it.
        </p>

        <p>
          <strong>The jab</strong> is eighteen frames from start to finish — six of windup, then it is out. At
          thirty frames a second that is a fifth of a second of warning, which is under human reaction time and
          under the agent&rsquo;s three-frame decision period. You cannot react to it. You can only already be
          standing somewhere it does not reach, which is a different skill: it turns spacing from a thing you do
          between attacks into a thing you do during them.
        </p>
        <p>
          <strong>The sweep</strong> has an arc of 1.90 radians — nearly 109° either side of centre. There is no
          side to step to. Against a 0.80-radian slash, walking sideways is a complete answer; against this one,
          sideways is still inside it, and the only answers left cost something: roll, or be far away already.
        </p>
        <p>
          <strong>The eruption</strong> is the one that matters. Thirty frames of windup, eight of delay, then six
          active frames covering the <em>entire circle</em> out to 4.2 metres — and it ignores the shield and the
          parry both. Guarding does not chip it; parrying does not catch it. Rolling works, but only because
          i-frames are i-frames. It is the first move in either world whose answer is not a button.
        </p>

        <Callout color={GOLD} title={<>Why an unblockable is a design decision and not a difficulty knob</>}>
          <p>
            Every other move in this game is a question with a button-shaped answer, and a learner that finds the
            best button per situation has learned the whole game. The eruption has no button, so the only policy
            that survives it is one that has been managing its <em>position and its stamina</em> in the seconds
            before it started. It makes the earlier frames matter, which is a thing difficulty sliders cannot do.
          </p>
        </Callout>

        <h2>The parry, and the habit it is built to punish</h2>
        <p>
          The real change is the parry. In v1 it caught a blow on five of its twenty-two frames and cost fifteen
          stamina, which made it close to a free defensive option — press it on a read, and if you were early or
          late you mostly just lost the stamina. Nothing punished pressing it constantly except the cost.
        </p>
        <p>
          Sekiro does not work that way, and the reason is worth copying. Its deflect window is twelve frames at
          sixty per second by default, but it <em>shrinks with each recent press of the guard button</em> — down
          to about four frames, and to nothing at all if you mash — clearing again after about thirty frames of
          not pressing, or instantly on a deflect that lands. The button that looks free is only free if you are
          disciplined with it.
        </p>
        <p>
          Porting that is where it is easy to go wrong, and I did go wrong: the thing to carry across is the{" "}
          <em>duration</em>, not the frame count. Twelve frames at sixty a second is <strong>two hundred
          milliseconds</strong>, and two hundred milliseconds at thirty frames a second is <strong>six
          frames</strong>, not three. So the window is six — losing <strong>two</strong> of them for every press
          inside thirty frames of the last one, which puts the ladder at 6 → 4 → 2 → 0 and still lets three
          hasty presses spend it completely. Floor of zero, cleared outright by a parry that connects. One
          detail matters more than it looks:
          recovery is sixteen frames and the fatigue lasts thirty, so pressing parry again <em>as soon as the game
          allows you to</em> is exactly what wears it out. That is deliberate. A rule that punishes an input you
          are not able to make would teach nothing.
        </p>

        <DecisionPoint
          accent={GOLD}
          question={<>Why show the agent its own parry fatigue?</>}
          options={[
            {
              label: "Hide it — let it infer the fatigue from its own action history",
              verdict: "miss",
              response: (
                <>The window depends on a press up to thirty frames ago, and the network sees one frame at a
                time. It cannot recover that at all, so the problem becomes partially observed and the agent
                fails for a reason with nothing to do with the skill being tested. Hiding state is how you
                make a hard problem, not how you make an interesting one.</>
              ),
            },
            {
              label: "Show it — two floats: how worn the window is, and frames until it clears",
              verdict: "best",
              response: (
                <>Chosen. The observation goes from 27 floats to 38, two of them being exactly what a human
                reads off the meter above the arena. If the question is whether an agent can learn discipline,
                it has to be able to see the thing it is being disciplined about.</>
              ),
            },
            {
              label: "Show the raw frame counter instead, and let it work out the rule",
              verdict: "close",
              response: (
                <>Defensible, and nearly the same thing — the counter is the harder-to-use encoding of the
                same fact. It is the option worth taking if you wanted to test whether the agent can learn a
                rule rather than read a gauge. That is a different experiment from this one.</>
              ),
            },
          ]}
        />

        <h2>Does the rule actually do anything?</h2>
        <p>
          A mechanic is a claim, and a claim before it is measured is a hope. Three scripted players, two hundred
          duels each, before a single second of GPU was spent on the world: one pressing buttons at random, one
          pressing parry whenever the game legally allows it, and one pressing it only on a read and only while
          the window is still at its full six frames.
        </p>

        <CodeOutput source="scripts/boss_v2_probe.mjs">{outProbe}</CodeOutput>

        <p>
          <strong>Mash presses parry 2.2× as often as patient and lands 6.3% of them, against
          patient&rsquo;s 60.4% — ten times the success rate.</strong> 538 of mash&rsquo;s presses had no
          window left at all, because it had spent it. And the controls hold at both ends: random wins nothing,
          mash wins nothing, and <code>pressure</code> — the player that takes the route the constants
          actually describe — wins 23 of 200. A hard fight with a way through it, which is the specification.
        </p>

        <p>
          One more, because the table above compares two whole strategies and it is worth isolating the rule
          itself. This presser is <em>blind</em> — it presses parry on a fixed period and never looks at the
          boss — so the only thing varying between rows is how often the button goes down.
        </p>

        <CodeOutput source="scripts/boss_v2_cases.py">{outParry}</CodeOutput>

        <p>
          Read the last column. Presses that arrive with <em>no window left at all</em> go from 790 below a
          thirty-frame gap to <strong>exactly zero</strong> at or above it. That is not a gradient, it is the
          rule showing through the noise: the fatigue clears after thirty frames, so a presser slower than that
          never stacks and a presser faster than that always does. The land rates are all low here precisely
          because this player is blind — that is the control, and it is what makes the 60.4% above mean
          something.
        </p>

        <Callout color={GOLD} title={<>What was checked before any of this was written</>}>
          <p>
            The environment exists twice — once in Python, which is what trains, and once in TypeScript, which is
            what you just played — and the two have to be the same game or the arena is a lie. Both were fed
            identical boss decisions and compared frame by frame:{" "}
            <strong>22,780 state values identical across two recorded duels</strong>, all eighteen counters
            matching, the new parry stack, heat and window included among the fields compared. The check that
            proves it is <code>scripts/boss_port_check_v2.mjs</code>; the recorder is{" "}
            <code>scripts/boss_v2_cases.py</code>. The mashing duel is in there deliberately — it is the only
            thing that drives the fatigue counter to its ceiling, and a mechanic the port check never reaches is
            a mechanic the port check does not check.
          </p>
        </Callout>

        <h2>What the room is doing</h2>
        <p>
          The ring went from eight metres to eleven, which sounds cosmetic and is not: with an unblockable that
          reaches 4.2 metres and a boss that closes faster than you can walk, the extra space is the difference
          between the eruption being survivable and being a coin flip. The room around it grew with it — the
          colonnade, the braziers and the gate are all placed in units of the arena radius, so they scale rather
          than needing to be re-tuned.
        </p>
        <p>
          The set dressing and both fighters are the <em>same code</em> the v1 arena uses, parameterised rather
          than copied. That is not tidiness for its own sake: it means a visual improvement lands in both fights
          at once, and it means the only thing that differs between the two arenas on screen is the thing that
          actually differs between them.
        </p>

        <h2>What happened when it was trained: I had left a door open</h2>
        <p>
          A DQN went at this world for two million decisions with exactly the hyperparameters that produced the
          v1 duellist. It won <strong>198 of 200</strong>. I had asked whether it would learn to stop pressing
          the parry button, and the answer turned out to be a third thing I had not considered: it never
          pressed it at all. <strong>0.01 parry presses per duel. 0.04 rolls. Guard held on 0.1% of frames.</strong>
          It did not defend, in a fight I had spent the whole page describing as a defensive problem.
        </p>
        <p>
          What it did instead was land 6.25 heavy attacks a duel, break the boss&rsquo;s poise 3.17 times, and
          take <strong>73.7% of its damage from ripostes</strong> — killing a 300-health boss in 12.8 seconds.
          The reason is one line I wrote and did not check: I gave the heavy attack 50 points of poise damage
          against a poise pool of 50. One heavy therefore broke poise <em>from full, every time</em>, and a
          break is sixty frames of stagger in which every hit does triple damage. Heavy, break, two free
          ripostes, repeat. A stunlock.
        </p>

        <Callout color={GOLD} title={<>The shape of the mistake</>}>
          <p>
            Note what it was. I tightened the defence — a parry window you can spend, an unblockable AoE, a
            sweep you cannot step around — and in the same edit handed the player a heavy attack to &ldquo;refine&rdquo;
            them, without re-checking the poise arithmetic those two changes now met in. The agent did not
            beat the fight I designed. It found the cheapest path through the fight I actually built, which
            is the only thing an optimiser has ever done.
          </p>
        </Callout>

        <p>
          The fix is one number with a reason: a heavy is now worth 36 against a pool of 70, so breaking poise
          costs <em>two</em> commitments — two heavies, three lights, or one of each — rather than one.
          Because poise is a constructor argument, both builds still run, and the claim above is a command
          rather than an anecdote:
        </p>

        <CodeOutput source="scripts/boss_v2_stunlock.py">{outStun}</CodeOutput>

        <p>
          The last block is the part worth being careful about. The fixed world is harder for{" "}
          <em>everybody</em> — the scripted patient-parry player drops from 136/200 to 87/200, because a poise
          pool that takes two commitments makes the fight longer whoever you are. What separates them is how
          much: the control loses 36% of its wins and the exploiter loses 69%. That 33-point gap is the part
          of its record that was the stunlock rather than the policy, and its poise breaks falling 3.17 → 1.48
          against the control&rsquo;s 1.28 → 0.71 is the same statement from the mechanism&rsquo;s side.
        </p>

        <h2>Where this leaves the world</h2>
        <p>
          A DQN was trained against the build described above and lost to the script — 73 of 200 against
          87 — without ever pressing parry. That result belonged to a world that has since changed
          underneath it in four ways, each one closing a hole the last one opened, so its net cannot even
          load against the current observation and its number is not quoted here as though it still applied.
        </p>
        <p>
          The changes, in order, because the order is the lesson. <strong>Poise became posture:</strong> a
          pool of 100 that takes five landed heavies or eleven lights, regenerating fast enough that
          disengaging for three seconds hands back a whole heavy. <strong>The boss got a lunge</strong>, a
          committed gap-closer it can start from seven metres, so retreating is a decision with a price
          rather than a free reset. <strong>The parry stopped granting a stagger</strong> and instead feeds
          the posture bar — the largest single source in the game, but no longer a shortcut past it —
          with recovery tied to the boss&rsquo;s health, so the fight snowballs once it is hurt.{" "}
          <strong>And the boss got long strings</strong>, five and seven hits, which is what a deflect system
          needs in order to be a deflect system at all.
        </p>

        <Callout color={GOLD} title={<>Two bugs that only long combos could expose</>}>
          <p>
            Both were spacing. A parry takes sixteen frames to recover, so two hits closer together than
            that <em>cannot both be parried</em> — the original <code>combo</code> spaced its two hits
            twelve frames apart and was quietly unparryable on the second. And hitstun was a flat twenty
            frames while the new strings land every eighteen, so one missed parry stunned you through the
            entire rest of the combo: eat one, eat all seven. Hitstun now scales with the size of the blow,
            so a nine-damage chip costs you a beat instead of the string.
          </p>
          <p>
            Neither showed up while every move hit once. They appeared the moment the boss threw a real
            combo, which is the argument for building the thing that stresses a mechanic before trusting
            the mechanic.
          </p>
        </Callout>

        <p>
          So the world settles here: eleven moves, a scripted ceiling of <strong>23 of 200</strong>, and
          mashing the strongest defensive button still worth exactly nothing. That is the fight the
          six-million-decision run was finally pointed at, and it answered the question sideways. The
          trained net wins <strong>92 of 200</strong> — four times the best script — and it does it while
          pressing parry about a third of a time per duel. It did not find the route a human had to be told
          about, and it did not exploit a hole either. It found a third thing.{" "}
          <Link href="/learn/building-environments/coding-the-harder-fight" style={link}>The next page builds
          this world line by line</Link>, and{" "}
          <Link href="/learn/building-environments/reading-a-policy" style={link}>the one after it reads that
          policy off its own buttons</Link> to work out what the third thing is.
        </p>
      </div>

      <PrevNext
        prev={{ label: "Watch it fight", href: "/learn/building-environments/watch-it-fight" }}
        next={{ label: "Coding the harder fight", href: "/learn/building-environments/coding-the-harder-fight" }}
      />
    </article>
  );
}

const outParry = `the parry window, measured against how often you press it
---------------------------------------------------------
  window 6 frames (0.20s), fatigue lasts 30 frames, recovery is 16 frames.
  Heat outlasts recovery, so pressing again as soon as you are allowed to stacks.

  This presser is BLIND -- it presses on a fixed period and never looks at the boss --
  so every land% here is low, and the column to read is the last one.

  press every   presses   landed    land%   dead windows
      3 frames      751       70     9.3%        160
     18 frames      745       59     7.9%        149
     21 frames      714       40     5.6%        180
     24 frames      708       43     6.1%        159
     27 frames      718       48     6.7%        142
     30 frames      752       99    13.2%          0
     33 frames      721      102    14.1%          0
     36 frames      633       55     8.7%          0
     45 frames      530       58    10.9%          0

  Dead windows -- presses that arrived with no window left at all -- collapse from
  790 below a 30-frame gap to 0 at or above it. That is not a gradient, it is the
  rule showing through: the fatigue clears after exactly 30 frames, so a presser
  slower than that never stacks and a presser faster than that always does.
  The worst row (3 frames apart) throws away 160 of 751 presses before they start.`;

const outProbe = `11 boss moves, 17 buttons, an 11m ring, 36s on the clock.
200 duels per player, one decision every 3 frames.

  player      win   die   clk   bossHP   presses   parried   mashed   dead
  random       0   200     0    280.5       569     11.4%       17      0
  mash         0   200     0    300.0      2765      6.3%     1048    538
  patient      7   171    22    159.0      1269     60.4%        0      0
  pressure    23   161    16    100.0      1043     59.3%       93      0

  The window is 6 frames -- 200ms -- and it loses 2 frames for every press
  inside 30 frames of the last one. That is longer than the 16-frame recovery, so pressing
  parry again as soon as the game lets you is exactly what wears it out. A parry that LANDS
  clears the fatigue outright, which is the only way to hold the window open.

  mash presses 2.2x as often as patient and lands 6.3% of them, against
  patient's 60.4% -- 10x the success rate from 2.2x the presses.
  538 of mash's presses had no window left at all, and 0 of patient's did.

  patient, in detail: 7/200 won, mean duel 24.4s,
  1.22 posture breaks per duel, 85 rolls that beat a hitbox,
  and 34 eruptions eaten in 200 duels -- the unblockable is escapable, not free.

  But patient is no longer the reference. It only swings while the boss is already staggered,
  which was a plan when one parry granted a stagger and is not one now that a parry merely feeds
  the posture bar. pressure takes the route the constants describe -- five landed heavies -- and
  wins 23/200 against patient's 7/200, leaving the boss on
  100 health rather than 159.

  random wins 0/200 and mash wins 0/200, so the world is not solved by luck
  or by holding one button. pressure wins 12%, so it is not impossible
  either -- a hard fight with a route through it, which is the specification.

  the moveset:
    jab        18f  reach 2.2  arc 0.70  dmg 11          
    slash      33f  reach 2.4  arc 0.80  dmg 18          
    thrust     42f  reach 3.6  arc 0.35  dmg 22          
    sweep      44f  reach 3.2  arc 1.90  dmg 26          
    heavy      60f  reach 2.7  arc 0.95  dmg 34  delay 8f
    slam       71f  reach 2.6  arc 1.40  dmg 30  delay 12f
    combo      49f  reach 2.3  arc 0.70  dmg 14          
    flurry    114f  reach 2.4  arc 0.75  dmg  9          
    onslaught 174f  reach 2.5  arc 0.80  dmg  8  delay 14f
    lunge      47f  reach 2.8  arc 0.60  dmg 24          
    eruption   78f  reach 4.2  arc 3.20  dmg 40  delay 8f  UNBLOCKABLE`;

const outStun = `one heavy attack against a 50-point poise pool, 200 duels each
--------------------------------------------------------------
  broken build: poise pool 50, heavy worth 50 -- one heavy always breaks from full
  fixed build:  poise pool 70, heavy worth 36 -- a break costs two commitments

  arm                    win  die    duel     dmg riposte heavies  breaks parries  rolls  guard
  exploiter, broken      198    2   12.8s   314.0   73.7%    6.25    3.17    0.01   0.04    0.1%
  exploiter, fixed        62  138   17.1s   244.4   40.9%    7.07    1.48    0.01   0.43    0.6%
  retrained, fixed        73  116   22.4s   271.6   38.3%    7.79    1.80    0.09   1.11    1.6%
  patient parry, broken  136   61   22.1s   296.1   81.7%    3.70    1.28    4.08   1.26    0.0%
  patient parry, fixed    87  107   24.2s   271.6   73.9%    3.06    0.71    4.39   1.42    0.0%

what the numbers say
--------------------
  In the broken world the trained net won 198/200 in 12.8 seconds while pressing parry
  0.01 times a duel, rolling 0.04 times and guarding 0.1% of frames. It did not defend.
  74% of its damage was riposte damage, off 3.17 poise breaks a duel.

  Drop the SAME net into the fixed world and it wins 62/200 instead of 198/200:
  breaks fall from 3.17 to 1.48 a duel, and the duel runs 17.1s instead of 12.8s.

  The scripted patient-parry player is the control, and it is NOT unaffected: 136/200
  becomes 87/200, because a poise pool that takes two commitments instead of one makes
  the fight longer for anybody. The fixed world is harder for everyone.

  What separates them is how much: the control loses 36% of its wins, the exploiter
  loses 69%. The 33-point difference is the part of its record that was the
  stunlock and not the policy. Its poise breaks fall 3.17 -> 1.48 a duel against the
  control's 1.28 -> 0.71, which is the same statement from the mechanism's side.`;
