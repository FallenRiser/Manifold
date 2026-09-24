import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Scripted players and a difficulty dial — Manifold",
  description:
    "Eleven hand-written duellists, every one of them there to answer a question the world would otherwise answer wrong — and an aggression dial that turns out to have two signs: harder for the players who block, and a gift to the players who avoid.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ScriptedPlayers() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 16 minutes"
        title={<>Scripted players and a difficulty dial</>}
        intro={<>Chapter 6 built the world. This chapter tests it, and the test is not a unit test — it is eleven
          hand-written players, each one an argument. Together they say the world is solvable, say what the obvious
          strategies are worth, and provide the control column for every ablation on every page that follows. Then we
          turn the difficulty up, and find that difficulty is not one direction.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The exam, and everyone who sits it</h2>
        <p>
          Every world in this track gets a ladder before it gets an agent, for the same reason a lab calibrates a
          thermometer in ice water. Here is the whole thing: eleven players, two hundred held-out duels each on seeds
          the world&rsquo;s design never touched, a decision every three frames.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outLadder}</CodeOutput>
        <p>
          The ladder is not a leaderboard, and reading it as one misses the point. Each row is there to answer a
          specific question, and several of them are there because they once caught something.
        </p>
        <ul style={{ lineHeight: 1.75 }}>
          <li><strong><code>stand still</code></strong> — the floor. Whatever the reward is, nothing may score below
            this. It dies in every duel at &minus;41.26, and that number is the bottom of the scale for every other
            row.</li>
          <li><strong><code>random buttons</code></strong> — is the interesting behaviour reachable by accident? It
            lands 0.18 parries and 0.07 poise breaks a duel and wins none of two hundred. The skill has to be found.</li>
          <li><strong><code>mash attack</code></strong> — the thing a real person does first. It takes the boss down to
            67 health and dies 198 times.</li>
          <li><strong><code>run away</code></strong> and <strong><code>circle</code></strong> — the two ways to decline
            the task. This pair is the most important thing on the ladder and gets its own section below.</li>
          <li><strong><code>hold guard</code></strong> — the player who only ever uses one mechanic, which makes it the
            control for every experiment about that mechanic. When the{" "}
            <Link href="/learn/building-environments/stamina-and-the-perfect-guard-window" style={link}>chip sweep</Link>{" "}
            moves this row and not the sidestepper&rsquo;s, the sweep is measuring what it claims to.</li>
          <li><strong><code>block, punish</code></strong>, <strong><code>roll, punish</code></strong>,{" "}
            <strong><code>sidestep, punish</code></strong> — three defences with the same offence bolted on, so the
            difference between the rows is the defence and nothing else.</li>
          <li><strong><code>parry oracle</code></strong> and <strong><code>patient parry</code></strong> — the ceiling,
            twice, differing by one line.</li>
        </ul>

        <Proof title="the two experts differ by one line, and the line is greed" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            Both read the boss&rsquo;s animation clock and parry when the next hitbox is three to five frames away. The
            oracle <em>also</em> swings during the boss&rsquo;s recovery frames. That single extra clause takes it from
            200 wins and 0 deaths on 100.0 health to <strong>195 wins, 5 deaths and 44.7 health</strong>.
          </p>
          <p style={{ margin: 0 }}>
            Every one of those five deaths is a swing still in its recovery when the boss started moving again. The
            patient version simply refuses to start a swing the stagger will not outlast, and gives up damage to do it —
            7.00 swings against the oracle&rsquo;s 9.23. Having both on the ladder is what turns &ldquo;be
            careful&rdquo; from advice into a measurement, and it is the ceiling a trained agent gets compared against:
            not &ldquo;did it win&rdquo; but &ldquo;did it win the way the patient one does or the way the greedy one
            does&rdquo;.
          </p>
        </Proof>

        <h2>The row that exists because of a disaster</h2>
        <p>
          World 1 lost a week to a boat that learned to sail off the course, because nothing in its ladder ever tried
          to leave. This world nearly repeated it. The first version of the duel had no <code>run away</code> row, the
          boss closed the distance only while idle, and it walked more slowly than the player — so backing away was a
          free, perfect, permanent escape from the entire task. Both learners found it within a few hundred thousand
          decisions and never fought again.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outRefuse}</CodeOutput>
        <p>
          The fix is not a reward patch. It is a fact about the room: a wall at eight units, and a boss that closes at
          0.105 a frame against your 0.075. Backing away now spends <strong>89.3% of its frames pinned to the
          wall</strong> and dies in all two hundred duels; circling forever dies in 197, because the boss turns faster
          than you can orbit it.
        </p>
        <Callout color={GOLD} title={<>Put the refusal in the ladder, not in the reward</>}>
          <p style={{ margin: 0 }}>
            The tempting fix for an agent that will not engage is to pay it for engaging. That is a patch on the
            symptom, it changes what the world is worth measuring, and it stales every number you had. The question a
            refusal row actually asks is <em>&ldquo;is declining the task physically available?&rdquo;</em> — and if the
            answer is yes, the environment is wrong, not the reward. Both worlds in this track that have been trained on
            found a refusal, and in both cases the honest fix was a change to the world. A sanity ladder without an
            agent that declines will not tell you.
          </p>
        </Callout>

        <Proof title="a baseline that moves when you run it twice is not a baseline" color={GOLD}>
          <p style={{ margin: 0 }}>
            The <code>random buttons</code> row originally held one shared generator, so its score depended on how many
            duels had already been flown in the same session — &minus;38.97 on the first call and &minus;38.91 on the
            second. It now re-seeds from the duel&rsquo;s own seed at frame 0 and is identical on repeated calls. This
            is the same family of bug as World 2&rsquo;s helicopter, and it is worth a habit: <strong>run your ladder
            twice in one process and diff it</strong>. Anything that moves is holding state it should not.
          </p>
        </Proof>

        <h2>Writing a row of your own</h2>
        <p>
          A ladder player is a function from the environment to a button. That is the entire interface, and the helpers
          the world provides — <code>frames_to_active</code>, <code>will_connect</code>, <code>boss_recovering</code>,{" "}
          <code>hold_range</code> — are the same ones every shipped player uses.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeOwn} />
        <CodeOutput source="scripts/boss_cases.py">{outOwn}</CodeOutput>
        <p>
          Four lines of policy, and it already beats the two most obvious strategies a person tries. That is worth
          knowing before you spend an hour of GPU: the bar a learner has to clear is not &ldquo;better than
          random&rdquo;, it is &ldquo;better than something a person could have written over lunch&rdquo;.
        </p>

        <h2>The difficulty dial, and the thing it does that nobody expects</h2>
        <p>
          The boss takes one number, <code>aggr</code>, between 0 and 1. It shortens the gap between attacks and
          re-weights the choice toward the two heaviest moves: about eight attacks a duel at zero, about twelve at one.
          It is the obvious difficulty setting.
        </p>
        <PredictPrompt
          accent={GOLD}
          prompt={<>Turn that dial from 0 to 1 and score four players over sixty duels each. Which of them end the duel
            with <em>more</em> health than they did on the easy setting?</>}
          options={["None — it is a difficulty dial", "Only the parry expert, which is untouchable anyway",
                    "The sidestepping player", "The two players who block"]}
        />
        <CodeOutput source="scripts/boss_cases.py">{outDial}</CodeOutput>
        <p>
          The two players who block go down exactly as you would expect: <code>hold guard</code> from 56.3 to 30.0
          health, <code>block, punish</code> from 48.7 to 29.0. More attacks means more stamina spent absorbing them and
          more chip through the shield.
        </p>
        <p>
          The sidestepping player goes the other way — <strong>69.1 up to 79.0</strong> — and at the easiest setting it
          is the <em>worst off</em> it ever is. It even wins 6.7% of duels at <code>aggr = 0.00</code>, the only
          non-parrying player on the ladder ever to win anything.
        </p>
        <p>
          The mechanism is not subtle once you see it. An avoider takes almost nothing from an attack it steps out of,
          and every attack it steps out of is a recovery it can punish. Since{" "}
          <Link href="/learn/building-environments/the-duel-brief" style={link}>poise</Link> arrived, two landed hits
          inside one engagement put the boss on the floor — so an angrier boss is not a threat, it is a{" "}
          <em>supply of openings</em>. Before poise existed this row was flat at 70&ndash;74 across the whole dial. The
          mechanic gave the dial a second sign.
        </p>

        <Callout color={GOLD} title={<>&ldquo;Difficulty&rdquo; is not a property of the environment alone</>}>
          <p style={{ margin: 0 }}>
            The same knob is a difficulty setting for one kind of player and a gift to another, and there is no setting
            at which it is a difficulty setting for everybody. That is worth carrying out of this world: a curriculum
            built on <code>aggr</code> would be easy-to-hard for an agent that learns to block and{" "}
            <strong>hard-to-easy</strong> for one that learns to dodge — and you would not find out which until the
            curriculum had already shaped the policy. Any dial you intend to sweep as difficulty has to be checked
            against more than one strategy, and the ladder is what lets you do that in sixty seconds.
          </p>
        </Callout>

        <h2>What is still true no matter where the dial sits</h2>
        <p>
          The parry expert wins every duel on full health at every setting from 0.00 to 1.00. That is the solvability
          claim, and it is deliberately insensitive to the dial: if the world were only solvable on easy, the ceiling
          every agent is measured against would be a moving target. Three other findings are also unmoved by
          aggression — the{" "}
          <Link href="/learn/building-environments/stamina-and-the-perfect-guard-window" style={link}>decision-rate
          threshold</Link>, the boss&rsquo;s health-and-riposte balance, and the refusal rows — because none of them
          involve a player who lands hits.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/thousands-of-duels-at-once", label: <>← Thousands of duels at once</> }}
          next={{ href: "/learn/building-environments/curriculum-one-move-then-the-set", label: <>Curriculum: one move, then the set →</> }}
        />
      </div>
    </article>
  );
}

const codeOwn = `# A ladder player is a function from the environment to a button. That is the whole interface.
def duck_and_counter(env):
    """Roll sideways out of anything that is about to land, then hit the recovery."""
    k = frames_to_active(env)
    if k is not None and 3 <= k <= 10 and will_connect(env) and env.pst >= ROLL_COST:
        return ROLL_RIGHT if env.off_axis() >= 0 else ROLL_LEFT
    if boss_recovering(env) and env.pst >= ATK_COST + ROLL_COST:
        return close_and_hit(env)
    return hold_range(env)

ladder(players=[("duck and counter", duck_and_counter),
                ("mash attack", masher),
                ("hold guard", turtle)], n=25)`;

const outLadder = `the sanity ladder -- 200 held-out duels (seeds 1000-1199), a decision every 3 frames
------------------------------------------------------------------------------------
player           win  die  clk  bossHP  ownHP   sec  meanD  offax  parry  poise  block   brk  hits  dodge  arcX  swing  wall%        G
stand still         0  200    0   240.0  -12.6  11.7   1.77   0.00   0.00   0.00   0.00  0.00  4.53   0.00  0.00   0.00    0.0   -41.26
random buttons      0  200    0   228.1  -11.8  15.5   1.83   0.06   0.18   0.07   0.18  0.10  4.69   0.41  0.20   2.06    7.8   -39.99
mash attack         2  198    0    67.0  -12.6  14.2   1.25   0.00   0.00   1.97   0.00  0.00  4.64   0.00  0.00  10.21    0.0   -23.35
run away            0  200    0   240.0  -12.8  14.3   2.15   0.00   0.00   0.00   0.00  0.00  4.58   0.00  0.00   0.00   89.3   -41.28
circle              0  197    3   240.0  -12.0  14.5   1.84   0.26   0.00   0.00   0.00  0.00  4.62   0.00  0.93   0.00    0.0   -40.75
hold guard          0    0  200   240.0   45.3  30.0   1.29   0.00   0.00   0.00  10.80  3.23  0.14   0.00  0.00   0.00   12.1    -5.47
block, punish       0    0  200   163.9   41.9  30.0   1.12   0.00   0.00   1.00  10.12  6.31  0.57   0.00  0.00   4.12    5.1     1.81
roll, punish        0    0  200    95.4   72.0  30.0   2.01   0.00   0.00   1.72   0.00  0.00  1.81   2.41  0.00   8.50   11.4    11.66
sidestep, punish    0    1  199    90.4   75.3  29.9   1.59   0.25   0.00   1.80   0.00  0.00  1.57   6.16  2.47   8.80    0.0    12.35
parry oracle      195    5    0    -8.6   44.7  19.3   1.50   0.00   4.58   0.26   0.00  0.00  2.71   0.00  0.00   9.23    0.7    47.83
patient parry     200    0    0   -12.0  100.0  22.9   1.56   0.00   8.56   0.00   0.00  0.00  0.00   0.00  0.00   7.00    2.9    55.20

  the expert that cannot lose wins 200/200 and never takes a hit;
  the one that also punishes during recovery wins 195 and dies 5 times.`;

const outRefuse = `can a player simply decline the duel? (200 held-out duels)
----------------------------------------------------------
  run away       0 win 200 die   0 clock  own hp  -12.8  boss hp  240.0  against the wall  89.3% of frames  G -41.28
  circle         0 win 197 die   3 clock  own hp  -12.0  boss hp  240.0  against the wall   0.0% of frames  G -40.75
  hold guard     0 win   0 die 200 clock  own hp   45.3  boss hp  240.0  against the wall  12.1% of frames  G  -5.47
  the player walks at 0.075 a frame and the boss closes at 0.105, inside a wall at
  radius 8.0 -- so backing away ends against the wall and circling ends inside the
  boss's turn rate. Neither is a refusal any more; both are just a slower death.`;

const outDial = `boss aggression as a difficulty dial (60 duels, own hp left / win %)
--------------------------------------------------------------------
   aggr            hold guard         block, punish      sidestep, punish         patient parry
   0.00         0.0w   56.3hp         0.0w   48.7hp         6.7w   69.1hp       100.0w  100.0hp
   0.25         0.0w   49.8hp         0.0w   45.3hp         1.7w   69.5hp       100.0w  100.0hp
   0.50         0.0w   45.2hp         0.0w   42.7hp         0.0w   75.9hp       100.0w  100.0hp
   0.75         0.0w   38.7hp         0.0w   36.1hp         0.0w   79.0hp       100.0w  100.0hp
   1.00         0.0w   30.0hp         0.0w   29.0hp         0.0w   76.1hp       100.0w  100.0hp
  the dial pushes the players who BLOCK down (hold guard 56.3 -> 30.0 hp, block+punish
  48.7 -> 29.0) and, now that poise exists, pulls the ones who AVOID the other way:
  sidestep goes 69.1 -> 79.0 hp as the boss gets angrier. A boss that attacks more often
  offers an avoider more openings, and openings are exactly what poise pays for -- so
  the same dial is a difficulty knob for one kind of player and a gift to another.
  (Before poise this row was flat at 70-74. The mechanic gave the dial a second sign.)
  The parrier still wins every duel on full health at every setting, and at aggr 0.00
  sidestep now wins 6.7% -- the first player other than a parrier to win anything.`;

const outOwn = `player           win  die  clk  bossHP  ownHP   sec  meanD  offax  parry  poise  block   brk  hits  dodge  arcX  swing  wall%        G
duck and counter    0    0   25   126.7   69.4  30.0   1.58   0.23   0.00   2.48   0.00  0.00  1.88   5.64  2.08   9.60    0.0     8.26
mash attack         1   24    0    61.4  -11.6  14.0   1.22   0.00   0.00   1.92   0.00  0.00  4.52   0.00  0.00   9.96    0.0   -20.90
hold guard          0    0   25   240.0   44.5  30.0   1.28   0.00   0.00   0.00  10.52  3.20  0.28   0.00  0.00   0.00   11.0    -5.55`;
