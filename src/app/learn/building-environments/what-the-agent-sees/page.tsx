import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "What the agent sees: vectors or pixels — Manifold",
  description:
    "Twenty-seven floats instead of a screen — and the uncomfortable consequence: the observation tells the agent which frames are the delay, which is the one thing the screen refuses to tell a human. What that changes about what this world is testing, written down rather than smoothed over.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatTheAgentSees() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 16 minutes"
        title={<>What the agent sees: vectors or pixels</>}
        intro={<>A human playing the arena in the brief gets a picture and has to work out what it means. The agent gets
          twenty-seven numbers. This page is the decision record for those numbers — and it contains the most
          uncomfortable finding in this world, which is that four of them hand the agent exactly the fact the picture is
          designed to withhold.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The two honest options</h2>
        <p>
          There are only two defensible things to show an agent in a world like this, and they answer different
          questions.
        </p>
        <p>
          <strong>Pixels.</strong> Render the arena and hand over the frame. This is the fair fight: the agent and the
          human get the same information, and if it learns to wait out a delayed attack you have learned something
          about learning to <em>see</em>. It is also, in this project, impossible without building a second renderer —
          the arena is TypeScript in a browser, not a headless Python surface — and it is roughly three orders of
          magnitude more expensive per step than the alternative.
        </p>
        <p>
          <strong>The state.</strong> Hand over the numbers the simulation already has. Cheap, exactly Markov, and it
          moves the question from &ldquo;can it see?&rdquo; to &ldquo;can it <em>time</em>?&rdquo; This is what ships,
          and the rest of this page is about what that costs.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeObs} />
        <CodeOutput source="scripts/boss_cases.py">{outObs}</CodeOutput>

        <h2>Look at v[18]</h2>
        <p>
          That vector was taken at the exact moment the world is built around: the boss twenty-four frames into a slam,
          holding the pose, twelve frames of nothing between the weapon reaching the top of its arc and the hitbox going
          live. The brief promised that the arena draws those frames <em>identically</em> to the windup, because from
          where the player is standing that is what they look like.
        </p>
        <p>
          The observation says <code>phase = DELAY 1.000</code>.
        </p>
        <p>
          That is not a bug — it is what &ldquo;give the agent the state&rdquo; means — but it has to be said out loud,
          because it changes what this world is testing. Worse, it is not even the strongest version of the leak: the
          observation also carries which move is out (<code>v[11..15]</code>) and how many frames into it the boss is
          (<code>v[16]</code>), and those two <em>determine</em> the phase. Deleting the four phase flags would remove a
          convenience, not a secret. The agent can always work out that a slam on frame 24 is holding.
        </p>
        <Callout color={GOLD} title={<>So what IS the delay testing, once the agent can see it?</>}>
          <p style={{ margin: "0 0 .6rem" }}>
            For a human, a delayed attack is a <strong>perception and reaction</strong> problem: you cannot tell the
            hold from the windup, so you have to guess, and the whole skill is learning not to guess early.
          </p>
          <p style={{ margin: 0 }}>
            For an agent with the frame counter it is a <strong>patience and credit-assignment</strong> problem
            instead: it knows precisely when the hitbox goes live, and the difficulty is that the correct action for
            twelve consecutive decisions is &ldquo;do nothing&rdquo; while a large threat is on screen, and the payoff
            for having waited arrives twelve steps later. Those are genuinely different problems. The world is still
            hard, and it is hard for a different reason than the marketing suggests. That distinction is the page.
          </p>
        </Callout>

        <DecisionPoint
          accent={GOLD}
          question={<>Knowing that, what should the observation contain?</>}
          options={[
            {
              label: "The full state, and say so on the page",
              verdict: "best",
              response: (<>What ships. The alternative is a world whose difficulty comes from an artificial blindfold,
                which is harder to reason about and much harder to compare against the scripted players — every one of
                which reads the animation clock through <code>frames_to_active</code>. The ladder and the agent see the
                same world, so the comparison means something.</>),
            },
            {
              label: "Delete the four phase flags",
              verdict: "miss",
              response: (<>Cosmetic. The move identity and the frame counter still determine the phase exactly, so this
                removes a convenience and leaves the information. Worth doing only as part of the next option, never on
                its own — a blindfold with a hole in it is worse than no blindfold, because you will believe it.</>),
            },
            {
              label: "Hide the frame counter too: only 'something is winding up'",
              verdict: "close",
              response: (<>This is the genuinely interesting ablation, and it is the one this world owes. Strip{" "}
                <code>v[11..20]</code> down to a single &ldquo;a move is out&rdquo; flag and the agent has to infer
                timing from history, which means a recurrent policy or a stack of frames. It would make the delay a
                perception problem again. <strong>It has not been run</strong>, and this page does not claim a result
                for it.</>),
            },
            {
              label: "Render the arena and train on pixels",
              verdict: "close",
              response: (<>The most faithful answer and the most expensive. The duel steps at about 117,000 frames a
                second on one core; a render-plus-convolution pipeline is nowhere near that, and it would need a second
                renderer written in Python whose agreement with the shipped one would itself have to be verified. A
                good project, and a different project.</>),
            },
          ]}
        />

        <h2>How much of a duel is that hold, anyway?</h2>
        <CodeOutput source="scripts/boss_cases.py">{outDelay}</CodeOutput>
        <p>
          About one frame in eighteen. Fifty frames a duel of a boss standing there with its weapon up, doing nothing —
          which does not sound like much until you notice that it is the <em>only</em> part of the duel where the
          correct action differs from what a reactive player would choose. Everything else in the fight rewards
          responding to what you see.
        </p>
        <p>
          The last row is a detail worth stopping on. The expert spends <strong>zero</strong> frames watching a recovery
          animation, because it parries every attack it sees and a parry cancels the move outright. It never once
          watches the boss finish an attack. That is what a 200-from-200 duellist&rsquo;s view of this world actually
          looks like, and it is a reminder that the state distribution an expert visits can be wildly different from
          the one a learner starts in.
        </p>

        <h2>The twenty-seven, and the decisions inside them</h2>
        <ul style={{ lineHeight: 1.75 }}>
          <li>
            <strong>Angles as sine and cosine, never as radians.</strong> <code>v[1]</code> and <code>v[2]</code> are{" "}
            <code>sin</code> and <code>cos</code> of the off-axis angle. Handing over the angle itself puts a
            discontinuity at &plusmn;&pi; in the middle of the input — two states that are a hair apart in the world
            would be at opposite ends of the input range. Every angle on this site goes in as a pair for this reason.
          </li>
          <li>
            <strong>Everything relative to the boss, nothing absolute.</strong> There is no <code>px</code>,{" "}
            <code>pz</code> or world heading in the vector. The arena is circular and the duel is rotationally
            symmetric, so absolute position is a coordinate the agent would have to learn to ignore. World 1 measured
            exactly this and the relative view beat the absolute one: <strong>175.8 arrivals against 140.8</strong>.
          </li>
          <li>
            <strong>One derived feature, and it is doing a lot of work.</strong> <code>v[24]</code> is &ldquo;would the
            move currently out connect with you, right now?&rdquo; — the reach-and-arc test, precomputed. A network
            could derive it from <code>v[0]</code>, <code>v[1..2]</code>, <code>v[22]</code> and <code>v[23]</code>,
            and handing it over is a small piece of teaching. It is disclosed here rather than buried because a derived
            feature is a thumb on the scale: it makes this world easier and makes any transfer claim weaker.
          </li>
          <li>
            <strong>And one thing deliberately absent: the cooldown.</strong> Nothing in the vector says when the{" "}
            <em>next</em> attack will begin. The agent can read the attack that is happening and cannot predict the one
            that is not. That is the one place this world is genuinely partially observed, and it is the reason a
            trained duellist has to hold a neutral position rather than pre-empt.
          </li>
        </ul>

        <h2>The normalisation is not perfect, and here is where</h2>
        <p>
          The rule was &ldquo;divide everything by its maximum&rdquo;. Checking it rather than assuming it turns up two
          places where it does not hold.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeRanges} />
        <CodeOutput source="scripts/boss_cases.py">{outRanges}</CodeOutput>
        <p>
          Two of the four flags are fine: <code>sin</code> and <code>cos</code> are supposed to live in
          [&minus;1,&nbsp;1], and the check is flagging the rule rather than a defect. The other two are real.
        </p>
        <p>
          <code>v[21]</code> is the stagger counter divided by <code>STAGGER</code>, which is 55 — but a{" "}
          <Link href="/learn/building-environments/the-duel-brief" style={link}>poise break</Link> staggers the boss for
          60, so the field reads <strong>1.09</strong> for the first five frames after one. It is a small thing and it
          would be invisible without a range check. <code>v[23]</code> is the arc in raw radians, up to 1.40, while{" "}
          <code>v[22]</code> is a reach divided by the arena radius and never exceeds 0.45. Two neighbouring inputs with
          a factor of three between their scales is exactly the kind of thing the{" "}
          <Link href="/learn/function-approximation" style={link}>function-approximation track</Link> spends a chapter
          on.
        </p>
        <p>
          None of this is fatal — these are inputs to a network with a learned first layer, and it will rescale them.
          It is here because &ldquo;I normalised everything&rdquo; is a claim, and claims get checked. The check costs
          four lines.
        </p>

        <Proof title="why the observation is 27 floats and not 26" color={GOLD}>
          <p style={{ margin: 0 }}>
            It was 26 until poise was added, at which point <code>v[26] = b_poise / B_POISE_MAX</code> appeared. That
            sounds like a footnote and it is not: an agent trained against the 26-float version cannot be loaded against
            the 27-float one, and any saved network from before that change is scrap. Adding a mechanic to a world
            invalidates every trained policy in it, which is a much bigger deal than adding a mechanic to a game. It is
            the reason this track insists on the pipeline order — plan, parameterise, code, <em>test</em>, and only then
            train.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/building-environments/writing-the-duel", label: <>&larr; Writing step(), section by section</> }}
          next={{ href: "/learn/building-environments/thousands-of-duels-at-once", label: <>Thousands of duels at once →</> }}
        />
      </div>
    </article>
  );
}

const codeObs = `# Run one duel until the boss is HOLDING a delay -- the frames that look like a windup
# and do nothing -- and print everything the agent is handed at that moment.
NAMES = ["distance / ARENA", "sin(off-axis)", "cos(off-axis)", "room behind you",
         "your health", "boss health", "your stamina", "your action", "your action frame",
         "your hitstun", "guarding?",
         "move = slash", "move = thrust", "move = heavy", "move = slam", "move = combo",
         "its animation frame", "phase = windup", "phase = DELAY", "phase = active",
         "phase = recovery", "stagger frames left", "its reach", "its arc",
         "would it connect NOW?", "clock", "its poise"]

e, a = Duel(seed=1002), A_IDLE
while not (e.bm >= 0 and phase_at(MOVES[e.bm], e.bf)[0] == "d"):
    if e.t % 3 == 0:
        a = sidestep_and_punish(e)
    e.step(a)

v = e.obs()
print("frame %d: the boss is %d frames into '%s' and is holding the delay."
      % (e.t, e.bf, MOVES[e.bm]["name"]))
for i, name in enumerate(NAMES):
    print("  v[%2d]  %-24s %7.3f%s" % (i, name, v[i],
          "   <-- the screen does not tell a human this" if i == 18 else ""))`;

const codeRanges = `# "I normalised everything" is a claim. Check it: the range each field actually visits.
NAMES = ["dist", "sin off", "cos off", "room", "php", "bhp", "stam", "action", "act frame",
         "stun", "guard", "slash", "thrust", "heavy", "slam", "combo", "boss frame",
         "windup", "delay", "active", "recovery", "stagger", "reach", "arc", "connects",
         "clock", "poise"]

lo = [9e9] * 27
hi = [-9e9] * 27
for s in range(20):
    e, a = Duel(seed=1000 + s), A_IDLE
    while True:
        v = e.obs()
        for i in range(27):
            lo[i], hi[i] = min(lo[i], v[i]), max(hi[i], v[i])
        if e.t % 3 == 0:
            a = sidestep_and_punish(e)
        _, _, term, trunc, _ = e.step(a)
        if term or trunc:
            break

print("field            min     max   outside [0, 1]?")
for i, name in enumerate(NAMES):
    flag = "  <-- YES" if hi[i] > 1.0001 or lo[i] < -0.0001 else ""
    print("v[%2d] %-10s %6.3f  %6.3f%s" % (i, name, lo[i], hi[i], flag))`;

const outObs = `frame 56: the boss is 24 frames into 'slam' and is holding the delay.
  v[ 0]  distance / ARENA           0.224
  v[ 1]  sin(off-axis)              0.000
  v[ 2]  cos(off-axis)              1.000
  v[ 3]  room behind you            0.697
  v[ 4]  your health                1.000
  v[ 5]  boss health                0.950
  v[ 6]  your stamina               0.882
  v[ 7]  your action                0.000
  v[ 8]  your action frame          0.025
  v[ 9]  your hitstun               0.000
  v[10]  guarding?                  0.000
  v[11]  move = slash               0.000
  v[12]  move = thrust              0.000
  v[13]  move = heavy               0.000
  v[14]  move = slam                1.000
  v[15]  move = combo               0.000
  v[16]  its animation frame        0.400
  v[17]  phase = windup             0.000
  v[18]  phase = DELAY              1.000   <-- the screen does not tell a human this
  v[19]  phase = active             0.000
  v[20]  phase = recovery           0.000
  v[21]  stagger frames left        0.000
  v[22]  its reach                  0.325
  v[23]  its arc                    1.400
  v[24]  would it connect NOW?      1.000
  v[25]  clock                      0.062
  v[26]  its poise                  0.543`;

const outRanges = `field            min     max   outside [0, 1]?
v[ 0] dist        0.119   0.500
v[ 1] sin off    -1.000   1.000  <-- YES
v[ 2] cos off    -0.201   1.000  <-- YES
v[ 3] room        0.317   0.997
v[ 4] php         0.440   1.000
v[ 5] bhp         0.150   1.000
v[ 6] stam        0.023   1.000
v[ 7] action      0.000   0.867
v[ 8] act frame   0.000   0.600
v[ 9] stun        0.000   0.422
v[10] guard       0.000   0.000
v[11] slash       0.000   1.000
v[12] thrust      0.000   1.000
v[13] heavy       0.000   1.000
v[14] slam        0.000   1.000
v[15] combo       0.000   1.000
v[16] boss frame  0.000   1.000
v[17] windup      0.000   1.000
v[18] delay       0.000   1.000
v[19] active      0.000   1.000
v[20] recovery    0.000   1.000
v[21] stagger     0.000   1.091  <-- YES
v[22] reach       0.000   0.450
v[23] arc         0.000   1.400  <-- YES
v[24] connects    0.000   1.000
v[25] clock       0.000   0.999
v[26] poise       0.040   1.000`;

const outDelay = `how much of a duel IS that hold? (50 duels, boss-phase frames per duel)
-----------------------------------------------------------------------
player              frames  windup  DELAY  active  recovery  down/idle  delay share
mash attack            432      85     24      15        76        232        5.6%
hold guard             900     188     53      40       238        381        5.9%
sidestep, punish       900     174     50      37       215        424        5.5%
patient parry          681     152     50       8         0        470        7.4%
  about one frame in eighteen, and every one of them is a frame where a human has to
  decide to do nothing. Note the expert's recovery column: 0 frames a duel. It cancels
  every move it sees with a parry, so it never watches one finish.`;
