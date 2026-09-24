import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "A moveset as a state machine — Manifold",
  description:
    "The boss is a table, not a pile of if-statements. How a move becomes a list of segments, how it chooses which one to throw, and what that representation bought: a curriculum, a difficulty dial and a renderer, all for free.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MovesetStateMachine() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 14 minutes"
        title={<>A moveset as a state machine</>}
        intro={<>The brief showed you the boss&rsquo;s five attacks drawn as frames and moved on. This page writes
          them. There is one design decision on it and everything else follows: the boss&rsquo;s attacks are{" "}
          <em>data</em>, not code. Five rows in a table, each a list of segments. That choice is why the world has a
          curriculum, a difficulty dial, a three-dimensional renderer and a TypeScript port — none of which were
          planned, all of which fell out of the table.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What we are actually modelling</h2>
        <p>
          Open any fighting game&rsquo;s frame data and you will find the same shape. An attack is not an event; it is
          an interval, and the interval has parts. There is a stretch where the weapon is going up and nothing can hurt
          you. There is a short stretch where the hitbox is live. There is a stretch afterwards where the attacker is
          committed and cannot defend itself. Players talk about these in frames because at thirty frames a second the
          difference between a seven-frame startup and a nine-frame startup is the difference between a move that beats
          yours and one that loses to it.
        </p>
        <p>
          So the honest representation of a move is a <em>list of segments</em>, and each segment is a kind and a
          length. Four kinds are enough for this world:
        </p>
        <ul style={{ lineHeight: 1.7 }}>
          <li><code>w</code> — <strong>windup</strong>. The weapon is going up. You can see it. Nothing happens.</li>
          <li><code>d</code> — <strong>delay</strong>. Identical to windup from the outside, and that is the whole
            point. The boss holds a finished-looking pose and does nothing for a while.</li>
          <li><code>h</code> — <strong>active</strong>. These are the frames on which the hitbox is tested.</li>
          <li><code>r</code> — <strong>recovery</strong>. It is committed and cannot act. This is your turn.</li>
        </ul>
        <p>
          A move is then a list like <code>[(&quot;w&quot;, 20), (&quot;d&quot;, 8), (&quot;h&quot;, 4),
          (&quot;r&quot;, 28)]</code>, and asking &ldquo;what is happening on frame 25?&rdquo; is a walk down that list
          adding up lengths. That is the entire state machine.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeSegments} />
        <CodeOutput source="scripts/boss_cases.py">{outSegments}</CodeOutput>
        <p>
          Sixty frames — two full seconds — and the frames that can actually hurt you are four of them. That ratio is
          not a quirk of this world; it is what a telegraphed attack <em>is</em>. Ninety-three per cent of the move is
          information and seven per cent is consequence.
        </p>

        <Callout color={GOLD} title={<>The delay segment costs one row and buys the world</>}>
          <p style={{ margin: 0 }}>
            Compare the two ways to build a move that pauses. As data it is one extra tuple in a list and{" "}
            <code>phase_at</code> needs no change at all. As code it is a branch — <code>if move ==
            &quot;heavy&quot; and 20 &lt;= f &lt; 28: pass</code> — which has to be repeated in the animation, in the
            hitbox test, in whatever draws the boss, and in whatever the agent sees. Every one of those is a place the
            delay can be accidentally left out, and a delay that exists in three places out of four is a bug you will
            find by watching an agent exploit it. The table has one copy.
          </p>
        </Callout>

        <h2>Three states, not five</h2>
        <p>
          It is tempting to give the boss a state per move. It does not need one. At any frame the boss is in exactly
          one of three situations, and which move it is doing is a <em>variable</em>, not a state:
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li><strong>Staggered</strong> (<code>b_stagger &gt; 0</code>) — on the floor, counting down, its move
            cancelled. It cannot act and everything you land is a riposte.</li>
          <li><strong>Free</strong> (<code>bm &lt; 0</code>) — no move out. It turns toward you quickly, closes if you
            are further than <code>ENGAGE</code>, ticks a cooldown, and starts a move when the cooldown expires and you
            are in range.</li>
          <li><strong>Mid-move</strong> (<code>bm &gt;= 0</code>) — the frame counter <code>bf</code> advances, the
            segment list says what this frame means, and when the counter runs past the end of the list it goes back to
            free with a fresh cooldown.</li>
        </ol>
        <p>
          Two fields — <code>bm</code>, which move, and <code>bf</code>, which frame of it — carry all of the boss&rsquo;s
          behaviour. That is worth noticing, because those same two fields are what the arena in the brief reads to pose
          the model, what the observation hands to the agent, and what the TypeScript port has to reproduce. A small
          state is not tidiness; it is the reason four separate pieces of software can agree about what the boss is
          doing.
        </p>

        <Proof title="why the hitbox is tested once per segment, not once per frame" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            An active segment is three to five frames long. If the hitbox were tested on every one of them, an attack
            that caught you would hit you three times, and a slam would take ninety health instead of thirty. So the
            world records which segment already landed (<code>b_seg_done</code>) and refuses to land it twice.
          </p>
          <p style={{ margin: 0 }}>
            This is not a detail — it is why <code>combo</code> works. That move has <em>two</em> active segments, so it
            legitimately hits twice, and the bookkeeping that stops one segment double-dipping is the same bookkeeping
            that lets a genuine two-hit move exist. Miss counts follow the same rule: a whiff is recorded on the first
            frame of an active segment that found nothing, not on all of them, which is why{" "}
            <code>whiffs</code> and <code>arcX</code> count attacks rather than frames.
          </p>
        </Proof>

        <h2>How it decides what to throw</h2>
        <p>
          A boss that picked uniformly at random would be a worse teacher than it looks, because most of its choices
          would be attacks that cannot possibly reach you and you would learn that standing at four units is safe. So
          the choice is filtered first: a move is a candidate only if its hitbox can still reach you{" "}
          <em>by the time it lands</em>, counting the ground the boss covers during its own windup.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeChoose} />
        <CodeOutput source="scripts/boss_cases.py">{outChoose}</CodeOutput>
        <p>
          Read the bottom of that table. The <code>slam</code> is the first move to drop out as you back off, and it
          drops out because it is the only attack that does not walk forward while it winds up. That makes it, without
          anybody designing it that way, a <strong>punish for standing close</strong> rather than an opener — the exact
          role the same move plays in the games this imitates. The <code>thrust</code> survives to the longest distances
          because it both reaches 3.6 units and advances 0.075 a frame for eighteen frames.
        </p>
        <p>
          Among the candidates it draws at random, weighted by one number: <code>aggr</code>. That number does two
          things at once, which is worth saying out loud because it means the difficulty dial is not a clean
          single-variable experiment. It shortens the cooldown between moves, and it multiplies the weight on the two
          heavy attacks.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outFreq}</CodeOutput>
        <p>
          At the shipped <code>aggr = 0.5</code> the boss throws about nine and a half attacks in a duel that goes the
          distance. Turn the dial to 1.0 and it throws twelve, and nearly two thirds of them are the two that take
          thirty or more health. The page on the{" "}
          <Link href="/learn/building-environments/scripted-players-and-a-difficulty-dial" style={link}>difficulty
          dial</Link> measures what that does to each kind of player, and the answer is stranger than
          &ldquo;everybody does worse&rdquo;.
        </p>

        <h2>Why the boss is not the second agent</h2>
        <p>
          The obvious alternative, and the one everybody suggests, is self-play: train the boss too. We did not, and the
          reason is not that it would be hard.
        </p>
        <DecisionPoint
          accent={GOLD}
          question={<>You are building a duel to train an agent in. What should the opponent be?</>}
          options={[
            {
              label: "A fixed table of moves, chosen at random",
              verdict: "best",
              response: (<>What ships. The boss is the <em>exam</em>, and an exam that changes while you sit it cannot
                be used to compare anything. Every number on every page of this world — the ladder, the sweeps, the
                trained runs — is comparable only because the thing on the other side of the screen has not moved since
                the first measurement.</>),
            },
            {
              label: "A second learning agent, trained by self-play",
              verdict: "close",
              response: (<>Defensible, and it is how you get superhuman play in games with a symmetric win condition.
                But this world is not symmetric — the boss has 240 health and no stamina, the player has 100 and a
                budget — and a moving opponent makes the sanity ladder meaningless. The hand-written players that tell
                us the world is solvable would score differently every time we looked.</>),
            },
            {
              label: "A behaviour tree that reacts to the player",
              verdict: "close",
              response: (<>This is what a shipped game does, and it makes a better <em>game</em>. It also quietly
                converts the environment into a second policy that has to be tuned, debugged and documented, and every
                agent result becomes a statement about a pair. Worth doing once the fixed boss is beaten; not worth
                doing first.</>),
            },
            {
              label: "Scripted, but it always picks the attack that is hardest to answer",
              verdict: "miss",
              response: (<>This sounds like difficulty and is actually determinism. A boss that always picks the
                worst-case move is a boss whose next move you can predict perfectly, and the agent will learn the
                prediction rather than the reading. Randomness inside a filtered candidate set is what forces the agent
                to watch.</>),
            },
          ]}
        />
        <p>
          There is a second reason, and it is about honesty. A learned opponent would make it very hard to say what any
          result means. When the trained duellist beats the boss, we want that to be a fact about the duellist. With
          self-play it would be a fact about a race between two networks, and &ldquo;it won&rdquo; would carry no
          information about whether the skill the world was built around had been found.
        </p>

        <h2>Four things the table gave us that were not planned</h2>
        <ul style={{ lineHeight: 1.75 }}>
          <li>
            <strong>A curriculum, for free.</strong> <code>Duel(moves=[3])</code> is a boss that only ever slams. The{" "}
            <Link href="/learn/building-environments/curriculum-one-move-then-the-set" style={link}>curriculum
            page</Link> uses exactly that to measure how hard each attack is on its own, and the answer overturns which
            move you would have started with.
          </li>
          <li>
            <strong>A difficulty dial.</strong> One float re-weights the same table. No second moveset, no
            &ldquo;hard mode&rdquo; branch.
          </li>
          <li>
            <strong>A renderer that cannot lie.</strong> The arena in the brief poses the model from <code>bm</code> and{" "}
            <code>bf</code> and nothing else, so what you see on the floor is the state machine, not an animation that
            was written next to it and has to be kept in sync.
          </li>
          <li>
            <strong>A port that can be checked.</strong> Five rows of numbers are easy to copy into TypeScript exactly;
            five hundred lines of special-cased animation code are not. That is why{" "}
            <code>boss_port_check.mjs</code> can report agreement to 5&times;10<sup>&minus;13</sup> instead of
            &ldquo;looks about right&rdquo;.
          </li>
        </ul>

        <Callout color={GOLD} title={<>What this page owes the next one</>}>
          <p style={{ margin: 0 }}>
            The table says an attack is live on frames 20 to 23 of <code>heavy</code>. It does not say what{" "}
            <em>live</em> means. That is the next page: a hitbox here is a reach and an arc, tested against a player who
            has invulnerable frames of their own, and the interaction between those two windows is the whole fight.
          </p>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-duel-brief", label: <>← The brief: thirty seconds, one boss</> }}
          next={{ href: "/learn/building-environments/frames-hitboxes-and-i-frames", label: <>Frames, hitboxes and i-frames →</> }}
        />
      </div>
    </article>
  );
}

const codeSegments = `# A move is a list of (kind, frames). Nothing about the boss is special-cased anywhere else.
for m in MOVES:
    print("%-7s %s" % (m["name"], m["seg"]))

# "What is happening on frame f?" is a walk down that list, adding up lengths.
mark = {"w": "-", "d": "=", "h": "#", "r": "."}
print()
print("heavy, one character per frame:")
print("".join(mark[phase_at(MOVES[2], f)[0]] for f in range(move_len(MOVES[2]))))
print("windup -   delay =   ACTIVE #   recovery .")
print("%d frames long, %d of which can hurt you"
      % (move_len(MOVES[2]), sum(n for k, n in MOVES[2]["seg"] if k == "h")))`;

const codeChoose = `# It only picks a move whose hitbox can still reach you BY THE TIME IT LANDS:
# reach + (ground covered during its own windup) >= how far away you are.
print("distance   what it is allowed to choose")
for d in [1.5, 2.0, 2.4, 2.6, 2.8, 2.9]:
    wind = lambda m: sum(n for k, n in m["seg"] if k in ("w", "d"))
    ok = [m["name"] for m in MOVES if m["reach"] + m["adv"] * wind(m) >= d - 0.1]
    print("%8.1f   %s" % (d, ", ".join(ok)))
print()
print("beyond ENGAGE = %.1f it does not choose at all: it walks at you." % ENGAGE)
print("slam advances %.3f a frame -- it is the first to drop out." % MOVES[3]["adv"])`;

const outSegments = `slash   [('w', 14), ('h', 3), ('r', 16)]
thrust  [('w', 18), ('h', 2), ('r', 22)]
heavy   [('w', 20), ('d', 8), ('h', 4), ('r', 28)]
slam    [('w', 24), ('d', 12), ('h', 5), ('r', 30)]
combo   [('w', 12), ('h', 3), ('w', 9), ('h', 3), ('r', 22)]

heavy, one character per frame:
--------------------========####............................
windup -   delay =   ACTIVE #   recovery .
60 frames long, 4 of which can hurt you`;

const outChoose = `distance   what it is allowed to choose
     1.5   slash, thrust, heavy, slam, combo
     2.0   slash, thrust, heavy, slam, combo
     2.4   slash, thrust, heavy, slam, combo
     2.6   slash, thrust, heavy, slam, combo
     2.8   slash, thrust, heavy, combo
     2.9   slash, thrust, heavy, combo

beyond ENGAGE = 2.9 it does not choose at all: it walks at you.
slam advances 0.000 a frame -- it is the first to drop out.`;

const outFreq = `which move it actually picks, and how often (200 duels vs 'sidestep, punish')
aggr   slash  thrust   heavy    slam   combo   moves/duel
 0.0    1.49    1.57    1.61    1.57    1.65         7.88
 0.5    1.34    1.46    2.61    2.55    1.49         9.45
 1.0    1.42    1.53    3.83    3.82    1.31        11.91`;
