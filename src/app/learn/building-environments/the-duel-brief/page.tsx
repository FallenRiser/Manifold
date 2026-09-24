import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BOSS_SETUP } from "@/lib/runtimeSetup";
import { DuelArenaLab } from "@/components/boss/DuelArenaLab";

export const metadata = {
  title: "The brief: thirty seconds, one boss — Manifold",
  description:
    "World 3 starts without code. A Soulslike duel in a walled arena against a boss with five telegraphed moves, each with a reach and an arc: why this world, what the obvious strategies are worth, and every planning decision behind the spec — with an arena you can fight in yourself.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DuelBrief() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 15 minutes"
        title={<>The brief: thirty seconds, one boss</>}
        intro={<>The sailboat fought the wind, which does not care. The helicopter fought a fire, which does not
          aim. The third world puts something on the other side of the screen that has its own animations, its own
          timing and its own openings — and every one of them is a fact you can learn. As before, it begins with no
          code: the task, why this task, and what we will measure.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The task, in one sentence with no RL words in it</h2>
        <div style={brief}>
          You have thirty seconds and one health bar. The boss in front of you has five attacks, each of which
          telegraphs before it lands. Take it down before the clock does you.
        </div>
        <p>
          The sentence is short because a duel is a small world. What makes it hard is not size — it is that the
          information you need arrives <em>early and briefly</em>. The boss raises its weapon, and somewhere in the
          next half-second there is a moment when hitting the right button turns its attack into your opening. Miss
          that moment by two frames and you take thirty-four damage instead.
        </p>
        <p>
          That is a different kind of problem from the first two worlds. The boat needed a <em>strategy</em> — tack, do
          not sail into irons. The helicopter needed <em>priorities</em> — the village before the forest. This one needs{" "}
          <strong>timing</strong> and <strong>spacing</strong>, and both are things an environment either represents
          honestly or quietly throws away.
        </p>

        <h2>Stand in it</h2>
        <p>
          Here is the world, before we have said a word about how it is built. Fight it yourself, or hand the controls
          to one of the scripted players and watch. The wedge on the floor is the attack the boss is currently winding
          up — it shows you both of the things that matter, how far the attack reaches and <em>how wide it is</em> — and
          it turns red on the frames that can actually hurt you. The frames in between — the ones where it holds a
          finished-looking windup and does nothing at all — are drawn exactly like the windup, because from where you
          are standing that is exactly what they look like.
        </p>
        <DuelArenaLab />
        <p style={{ fontSize: 14.5, color: "var(--muted)" }}>
          Everything in that arena is the same simulation the rest of this world runs on, ported to TypeScript so it can
          be played rather than replayed. <code>scripts/boss_port_check.mjs</code> feeds the port and the Python the
          same boss decisions and the same buttons and then compares all nine hundred frames: the largest disagreement
          in any position, angle, health or stamina is 5&times;10<sup>&minus;13</sup>, and all fifteen event counters
          come out identical. Every meter is a field of that simulation read straight off it. The pale bar under the
          boss&rsquo;s health is its <strong>poise</strong>: land two clean hits inside the same engagement and it goes
          down. The gold bar is the window that opens when it does &mdash; sixty frames from a poise break,
          fifty-five from a parry &mdash; during which your attack does three times damage, and at the end of which it
          does not.
        </p>
        <PredictPrompt
          accent={GOLD}
          prompt={<>You have probably just died a few times. Over 25 fresh duels, which of these do you expect to score
            best under a reward that simply adds up damage dealt and subtracts damage taken?</>}
          options={["Walking in and attacking whenever the bar allows", "Never lowering the shield",
                    "Backing away and refusing to engage", "Rolling sideways through attacks, then punishing"]}
        />

        <h2>Frames, because that is what the real thing uses</h2>
        <p>
          The games this imitates run at thirty frames a second and define every attack by which of those frames its
          hitbox is live. So the world does the same: one step is one frame, a duel is nine hundred of them, and a move
          is a little list of segments — some windup, sometimes a <em>hold</em>, then the frames that actually hurt,
          then a recovery during which the boss cannot defend itself.
        </p>
        <p>
          Writing it that way costs nothing and buys the entire world. Below, every boss attack drawn as the frames it
          occupies. The two with <code>=</code> in them are the reason this world is interesting: that segment looks
          exactly like windup and does nothing at all, so a player who reacts to the raised weapon swings at nothing
          and eats the real hit on the way back down.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeMoveset} />
        <CodeOutput source="scripts/boss_cases.py">{outMoveset}</CodeOutput>
        <p>
          Read the <code>slam</code> row: twenty-four frames of windup, then <strong>twelve frames of nothing</strong>,
          then five frames that take thirty of your hundred health. Eight tenths of a second of held breath. Every
          Soulslike has this move and every new player dies to it, because the honest response is to do nothing for
          longer than feels safe.
        </p>
        <p>
          The other number on each row is the one that makes this world two-dimensional. An attack has a{" "}
          <strong>reach</strong> and an <strong>arc</strong>, and it lands only if you are inside both. The thrust is
          long and narrow — 3.6 units of reach but 0.35 radians of arc, about twenty degrees each side — so you can step
          out of it without giving up any ground at all. The slam is shorter and 1.4 radians wide, eighty degrees each
          side, and you cannot. The boss keeps tracking you while it winds up, slowly, and <strong>stops turning the
          instant the active frames begin</strong>: that one rule is what makes a late sidestep work and an early one
          fail.
        </p>

        <h2>What the obvious strategies are worth</h2>
        <p>
          Every world in this track gets a ladder of hand-written players before it gets an agent, for the same reason
          you check a thermometer in ice water. Six of them here, over twenty-five held-out duels, with a decision every
          three frames — the same rate the arena above gave you.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeLadder} />
        <CodeOutput source="scripts/boss_cases.py">{outLadder}</CodeOutput>
        <p>
          The player who walks in swinging <strong>dies in twenty-four of the twenty-five duels</strong>, having
          taken the boss down by about three quarters on the way. The player who never lowers the shield{" "}
          <strong>survives every duel and wins none</strong>: the boss ends on full health and the clock calls it. And
          the player that reads the animation clock and parries on frame wins all twenty-five without being touched
          once, which is the ceiling every trained agent in this world gets measured against.
        </p>
        <p>
          The <code>poise</code> column is the second way to put the boss down, and the one you reach by attacking
          rather than by defending. A landed hit takes twenty-five off a pool of fifty that refills at 0.08 a frame, so
          two clean hits belonging to the same engagement stagger it; hits spread thinly across a whole duel do not,
          because the pool is back inside about twenty seconds. Over two hundred duels it is worth a great deal to the
          player who was already avoiding damage &mdash; the sidestepper opens 1.80 breaks a duel and leaves the boss on
          90 health where without poise it left it on 148 &mdash; and nothing at all to the parry expert, which opens
          0.00, because everything that player lands is riposte damage already.
        </p>
        <p>
          It also cost something, and the cost is visible in the top row. Before poise existed, walking in swinging lost
          <strong> two hundred duels out of two hundred</strong>. It now wins two. A reward for landing hits hands the
          reckless player a lottery ticket, and one duel in a hundred is small enough to live with and far too large to
          leave undocumented: it is exactly the kind of crack a trained agent is good at widening.
        </p>
        <p>
          Two of those columns only exist because the world has a floor rather than a line. <code>arcX</code> counts
          attacks that reached the player and <em>missed anyway</em>, because the player was not in front of the boss
          when the active frames began — and the sidestepping player collects 2.40 of them a duel while giving up almost
          no distance. <code>wall%</code> is the share of frames spent pinned against the edge of the arena, which is
          what happens to anybody who tries to leave.
        </p>

        <Callout color={GOLD} title={<>The row for the player who refuses to fight, and why it is there</>}>
          <p style={{ margin: "0 0 .6rem" }}>
            An earlier version of this ladder had no <code>run away</code> row, and the omission hid the worst bug this
            world has had. In that version the arena was a single axis, the boss closed the gap only while it was idle,
            and it walked more slowly than the player did — so backing away was a free, perfect, permanent escape. Both
            learners we trained found it within a few hundred thousand decisions and never fought again.
          </p>
          <p style={{ margin: 0 }}>
            The fix is not a patch to the reward, it is a fact about the room: a wall at eight units, and a boss that
            closes at 0.105 a frame against your 0.075. You cannot outwalk it and there is nowhere to walk to. Backing
            away now spends <strong>89% of its frames against the wall</strong> and dies anyway; circling forever dies
            too, because the boss turns faster than you can orbit it. World 1 learned the same lesson when its boat{" "}
            <Link href="/learn/building-environments/where-the-course-ends" style={link}>sailed off the course</Link>. A
            sanity ladder needs the agent that declines the task, or the agent you train will be the one to point out
            that declining was available.
          </p>
        </Callout>

        <h2>Four requirements, answered</h2>
        <p>
          The sailboat page set out four things a first world needs. The duel answers each differently, and the
          differences are what it is for.
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li>
            <strong>The obvious strategy must leave room.</strong> Mashing dies 198 duels out of 200. Blocking
            wins none.
            Both are things a real person does on their first attempt — you may have just done both — and neither is
            anywhere near the ceiling.
          </li>
          <li>
            <strong>There must be a hand-written player that wins,</strong> or the world may simply be impossible and
            you would never know. There is: reading the boss&rsquo;s animation clock and parrying five frames before the
            hitbox goes live wins two hundred duels out of two hundred on full health.
          </li>
          <li>
            <strong>The interesting behaviour must not be reachable by accident.</strong> Uniformly random button
            presses across forty duels land thirteen parries and two poise breaks and win <em>none</em> of them; they
            die in all forty. The
            skill has to be found, not stumbled into.
          </li>
          <li>
            <strong>It has to run fast enough to train on one machine.</strong> A duel is arithmetic on about two dozen
            numbers, and the whole world steps tens of thousands of frames a second on a single core, with no GPU in
            sight.
          </li>
        </ol>

        <h2>What we are deliberately not deciding yet</h2>
        <p>
          Two things are missing from the brief on purpose, and both get their own page.
        </p>
        <p>
          <strong>The reward.</strong> The sentence at the top says &ldquo;take it down before the clock does
          you&rdquo;, which is a statement about winning, not a number per frame. World 2 spent a page arguing that a
          reward is a{" "}
          <Link href="/learn/building-environments/reward-is-a-values-decision" style={link}>values decision</Link>; this
          world adds a sharper one, because the duel has an ending that is neither a win nor a loss, and what you decide
          that ending is worth changes what the agent becomes.
        </p>
        <p>
          <strong>How often the agent gets to press a button.</strong> A human at thirty frames a second is not making
          thirty independent decisions; an agent can. That number turns out not to be a training-speed knob at all — set
          it too coarse and a mechanic silently stops existing — so it is measured rather than guessed.
        </p>

        <Callout color={GOLD} title={<>Promises this page has made</>}>
          <p style={{ margin: "0 0 .5rem" }}>Three claims are now owed a measurement, and later pages pay them:</p>
          <ul style={{ margin: 0, lineHeight: 1.65 }}>
            <li>that the delayed attacks are the hard part, and that an agent has to learn to wait them out;</li>
            <li>that the decision rate can delete a mechanic, with the threshold predicted from the moveset;</li>
            <li>that stepping out of an arc is worth more than stepping out of a reach — the whole case for giving this
              world a floor instead of a line.</li>
          </ul>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments/what-the-crew-learned", label: <>← What the crew learned</> }}
          next={{ href: "/learn/building-environments/a-moveset-as-a-state-machine", label: <>A moveset as a state machine →</> }}
        />
      </div>
    </article>
  );
}

const codeMoveset = `# Every boss attack, drawn as the frames it actually occupies.
# An attack lands only inside BOTH its reach and its arc.
moveset()`;

const codeLadder = `# Six hand-written players, 25 held-out duels each (seeds 1000-1024).
# arcX  = attacks that reached the player and missed anyway, on angle
# wall% = share of frames spent pinned against the edge of the arena
ladder(players=[(name, dict(PLAYERS)[name]) for name in
                ["mash attack", "run away", "circle", "hold guard",
                 "sidestep, punish", "patient parry"]],
       n=25)`;

const outMoveset = `windup -   delay =   ACTIVE #   recovery .
slash   --------------###................  33 frames, reach 2.4, arc 0.80 rad, 18 damage
thrust  ------------------##......................  42 frames, reach 3.6, arc 0.35 rad, 22 damage
heavy   --------------------========####............................  60 frames, reach 2.7, arc 0.95 rad, 34 damage
slam    ------------------------============#####..............................  71 frames, reach 2.6, arc 1.40 rad, 30 damage
combo   ------------###---------###......................  49 frames, reach 2.3, arc 0.70 rad, 14 damage`;

const outLadder = `player           win  die  clk  bossHP  ownHP   sec  meanD  offax  parry  poise  block   brk  hits  dodge  arcX  swing  wall%        G
mash attack         1   24    0    61.4  -11.6  14.0   1.22   0.00   0.00   1.92   0.00  0.00  4.52   0.00  0.00   9.96    0.0   -20.90
run away            0   25    0   240.0  -12.6  14.4   2.10   0.00   0.00   0.00   0.00  0.00  4.48   0.00  0.00   0.00   89.3   -41.26
circle              0   25    0   240.0  -11.0  14.0   1.77   0.27   0.00   0.00   0.00  0.00  4.60   0.00  0.64   0.00    0.0   -41.10
hold guard          0    0   25   240.0   44.5  30.0   1.28   0.00   0.00   0.00  10.52  3.20  0.28   0.00  0.00   0.00   11.0    -5.55
sidestep, punish    0    0   25    82.1   75.2  30.0   1.59   0.25   0.00   1.88   0.00  0.00  1.60   5.80  2.40   9.20    0.0    13.31
patient parry      25    0    0   -12.0  100.0  22.6   1.56   0.00   8.36   0.00   0.00  0.00  0.00   0.00  0.00   7.00    2.9    55.20`;

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
