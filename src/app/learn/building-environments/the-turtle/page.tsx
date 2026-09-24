import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The turtle: reward hacking a duel — Manifold",
  description:
    "Three rewards and two clock rules, scored on the same eleven players. One of the six combinations pays a player who never attacks exactly as much as it pays a player who wins — and the arithmetic is exact, not approximate.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheTurtle() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 16 minutes"
        title={<>The turtle: reward hacking a duel</>}
        intro={<>Every world in this track has been hacked by something. World 1&rsquo;s boat learned to sail off the
          course; World 2&rsquo;s crew learned to be paid per fire and started letting fires burn. This world offers two
          hacks — <em>turtle</em> and <em>refuse</em> — and the interesting thing is that you can find both of them,
          exactly, before training anything, by scoring hand-written players under each candidate reward.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Three rewards that all sound reasonable</h2>
        <p>
          The brief said &ldquo;take it down before the clock does you&rdquo;, which is a sentence about winning, not a
          number per frame. Turning it into a number is a{" "}
          <Link href="/learn/building-environments/reward-is-a-values-decision" style={link}>values decision</Link>, and
          there are three candidates a reasonable person would write down.
        </p>
        <ul style={{ lineHeight: 1.75 }}>
          <li><strong><code>damage</code></strong> — 0.1 per point you deal, &minus;0.1 per point you take, &plusmn;30
            at the end. The obvious one: reward the exchange.</li>
          <li><strong><code>trade</code></strong> — 0.1 per point you deal and nothing for what you take. Also obvious:
            the goal is to kill it, and health is only a means.</li>
          <li><strong><code>survive</code></strong> — a thirtieth of a point per frame you are alive, &plusmn;30 at the
            end. This one models &ldquo;do not die&rdquo;, which is what these games are about.</li>
        </ul>
        <p>
          And two clock rules. <strong>Truncate</strong>: running out of time is neither a win nor a loss, the episode
          simply stops. <strong>Defeat</strong>: running out of time means you failed to finish the duel, so it counts
          as a loss. World 1 met this question and answered <em>truncate</em>; that answer does not automatically carry.
        </p>
        <p>
          Six combinations, one ladder, no training required.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outRewards}</CodeOutput>

        <h2>The one to stare at is the bottom-left</h2>
        <p>
          Under <code>survive</code> with a neutral clock, <code>hold guard</code> scores <strong>exactly
          30.00</strong>. So does <code>block, punish</code>. The sidestepping player, which is genuinely good at this
          game, scores 29.80 over the same two hundred duels — <em>worse</em>, because it dies in one of them, and the
          short twenty-five-duel decomposition below catches it on a run where it does not. A policy whose entire
          strategy is
          &ldquo;never lower the shield&rdquo; is not merely competitive under this reward; it is at the top of
          everything that is not an expert, and it is there by arithmetic rather than by luck.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeArith} />
        <CodeOutput source="scripts/boss_cases.py">{outArith}</CodeOutput>
        <p>
          Nine hundred frames at a thirtieth of a point each is thirty points, and winning is worth thirty points. The
          reward says, in as many words, that <strong>surviving the full duel and killing the boss are worth the same
          amount</strong>, and the only thing separating them is how long the winner happened to spend getting there.
        </p>
        <p>
          Which produces the second hack, hiding inside the first. Because the time reward keeps accruing, a{" "}
          <em>slow</em> win outscores a fast one: finishing at twenty-nine seconds pays 59.0 and finishing at ten pays
          40.0. A reward meant to say &ldquo;stay alive&rdquo; has quietly said &ldquo;stay alive <em>and take your
          time</em>&rdquo;, and an agent optimising it would learn to win on the last possible frame. Nobody writing
          that reward intends either of those things.
        </p>

        <Callout color={GOLD} title={<>Why the turtle is worth naming</>}>
          <p style={{ margin: 0 }}>
            The failure is not that the agent is stupid. It is that the agent is <em>correct</em>: given that reward, a
            shield is the optimal policy among everything a learner is likely to find early, and it is stable, low
            variance and immediately available. A reward hack is almost never a bug in the agent. It is a sentence the
            designer meant one way and wrote another way, and the agent read it the way it was written.
          </p>
        </Callout>

        <h2>The other column: paying only for damage dealt</h2>
        <p>
          <code>trade</code> looks like the fix — stop paying for health and the turtle has nothing to gain. Look at
          what it actually does: <code>hold guard</code> scores <strong>exactly 0.00</strong>. It never deals damage and
          is never charged for what it takes, so it sits precisely at the origin, above{" "}
          <code>stand still</code> (&minus;30.00, which dies) and above <code>mash attack</code> (&minus;12.10, which
          also dies). Under this reward, doing nothing safely is better than trying and failing — which is the shape of
          every reward that punishes outcomes and not effort.
        </p>
        <p>
          It also flatters the recklessness the poise mechanic introduced. Mashing goes from &minus;23.35 under{" "}
          <code>damage</code> to &minus;12.10 under <code>trade</code>, because the 46 health it loses on the way in
          stops costing anything. A reward that ignores damage taken is a reward that has stopped modelling half of
          this world.
        </p>

        <h2>The clock rule, and what fixing it costs</h2>
        <p>
          Now compare the two columns of the <code>damage</code> block. Under a neutral clock the eight players spread
          across 53 points and rank in an order any player would agree with. Switch the clock to a defeat and every
          non-winner is squeezed into &minus;17 to &minus;41, and the ordering breaks in a specific, visible way:{" "}
          <strong><code>mash attack</code> (dead in fourteen seconds) scores &minus;23.35 while <code>hold guard</code>{" "}
          (alive at thirty seconds on 45 health) scores &minus;35.47.</strong>
        </p>
        <p>
          That is World 1&rsquo;s{" "}
          <Link href="/learn/building-environments/terminated-vs-truncated" style={link}>terminated-versus-truncated</Link>{" "}
          question asked again, and it gets the opposite textbook answer, for a reason specific to this world.
        </p>
        <DecisionPoint
          accent={GOLD}
          question={<>So which clock rule ships?</>}
          options={[
            {
              label: "Truncate — and fix refusal in the environment instead",
              verdict: "best",
              response: (<>What ships. In the one-dimensional prototype a neutral clock paid refusal about zero, which
                <em> was</em> the hack, and calling the clock a defeat was the obvious patch. On a floor with a wall,
                refusal already dies — <code>run away</code> loses 200 of 200 at &minus;41.28 — so the neutral clock no
                longer rewards anything. <strong>The wall did the job the reward was being asked to do</strong>, and the
                reward got to keep its ability to rank the losers.</>),
            },
            {
              label: "Defeat — running out of time is a failure, and it should be scored as one",
              verdict: "close",
              response: (<>Defensible and honest about the task: you were told to take it down in thirty seconds.
                The cost is measured above — every non-winner within 24 points of every other, and a policy that dies in
                fourteen seconds outscoring one that survives. When the reward can no longer tell bad policies apart,
                the gradient between them is gone too.</>),
            },
            {
              label: "Truncate, but add a small bonus for damage dealt near the buzzer",
              verdict: "miss",
              response: (<>Patching a reward with a second reward is how you get World 2&rsquo;s{" "}
                <Link href="/learn/building-environments/the-cobra-effect" style={link}>cobra effect</Link>. Every term
                you add is a new sentence the agent can read differently from how you meant it, and you will not know
                which until it has been trained on.</>),
            },
            {
              label: "Shorten the clock so the question stops mattering",
              verdict: "close",
              response: (<>Interesting, and World 1 measured exactly this: with a generous clock the label barely
                mattered, and with a tight one treating the buzzer as terminal was ten times better. A tight clock makes
                the clock a rule of the task rather than a safety net. It also changes what the world is, and the
                balance sweep says this one is already one notch inside a cliff.</>),
            },
          ]}
        />

        <Proof title="the hack that came first, and why it is not on this page's tables" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            The plan predicted turtling as this world&rsquo;s hack. What the first trained agents actually found was{" "}
            <strong>refusal</strong>, which is worse: a turtle at least stays in the fight. In the one-dimensional
            prototype, PPO on all three seeds ended with zero attacks, zero hits taken and the boss on full health, and
            one DQN seed spent 93% of its buttons walking backwards. Switching the clock to a defeat — which scores that
            policy &minus;30 on every duel — left it completely unchanged, because once a policy never engages, every
            outcome is equally bad and there is no gradient left to climb.
          </p>
          <p style={{ margin: 0 }}>
            Those numbers came from a different environment — a duel on a line, with a boss that could not catch anyone —
            so none of them describe the world you are reading about, and they are not quoted as results. The lesson
            survives the rebuild intact: <strong>a reward cannot fix a world in which declining the task is
            available</strong>, and the fix was a wall and a boss that runs, not a term in a sum.
          </p>
        </Proof>

        <h2>What ships, and the rule behind it</h2>
        <p>
          <code>damage</code> with a neutral clock. Under it the ladder ranks the way a player would: the expert at
          +55.20, the sidestepper at +12.35, the blocker-punisher barely positive at +1.81, the turtle negative at
          &minus;5.47, the masher at &minus;23.35, and the two refusals at the floor with everything else that dies.
          Every strategy that engages scores above every strategy that does not, and the gaps between them are large
          enough to climb.
        </p>
        <p>
          The rule, stated generally: <strong>when an agent finds a way to opt out, change the world before you change
          the reward.</strong> A reward patch buys you a policy that stops doing the thing you noticed, in a world where
          the thing is still the best available move — which means the next opt-out is already waiting. Both of the
          worlds in this track that have been trained on found a refusal, and both times the honest fix was physical: a
          course boundary in one, a wall and a faster boss in the other.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/training-the-duellist", label: <>← Training the duellist</> }}
          next={{ href: "/learn/building-environments/what-it-learned-about-delayed-attacks", label: <>What it learned about delayed attacks →</> }}
        />
      </div>
    </article>
  );
}

const codeArith = `# Under "survive" the reward is 1/30 a frame, plus 30 for a win and minus 30 for a death.
# So a score decomposes exactly, and the decomposition is the whole problem.
print("player             seconds   time part   ending part      G   (check)")
for name, pol in [("hold guard", turtle),
                  ("sidestep, punish", sidestep_and_punish),
                  ("patient parry", patient_parry)]:
    r = score(pol, n=25, reward="survive")
    secs = r["frames"] / FPS
    ending = 30.0 * (r["win"] - r["die"]) / 25
    print("%-18s %7.1f %11.2f %13.2f %6.2f %8.2f"
          % (name, secs, secs, ending, r["G"], secs + ending))

print()
print("a full duel is %.0f frames = %.1f points for the time alone." % (MAX_FRAMES, MAX_FRAMES / FPS))
print("a win is worth 30.0 points.  Those two numbers are the same size.")
print()
print("and because the clock keeps paying, a SLOWER win scores better:")
for secs in (10, 20, 29):
    print("  win at %2d s -> %5.1f      survive the clock -> %5.1f"
          % (secs, secs + 30.0, MAX_FRAMES / FPS))`;

const outRewards = `reward = damage (0.1 x damage dealt - 0.1 x damage taken, +-30 at the end)
--------------------------------------------------------------------------
player              win  die  clk | clock = truncate | clock = defeat
stand still           0  200    0 |           -41.26 |         -41.26
mash attack           2  198    0 |           -23.35 |         -23.35
run away              0  200    0 |           -41.28 |         -41.28
circle                0  197    3 |           -40.75 |         -41.20
hold guard            0    0  200 |            -5.47 |         -35.47
block, punish         0    0  200 |             1.81 |         -28.19
sidestep, punish      0    1  199 |            12.35 |         -17.50
patient parry       200    0    0 |            55.20 |          55.20

reward = trade (0.1 x damage dealt only: being hit is free)
-----------------------------------------------------------
player              win  die  clk | clock = truncate | clock = defeat
stand still           0  200    0 |           -30.00 |         -30.00
mash attack           2  198    0 |           -12.10 |         -12.10
run away              0  200    0 |           -30.00 |         -30.00
circle                0  197    3 |           -29.55 |         -30.00
hold guard            0    0  200 |             0.00 |         -30.00
block, punish         0    0  200 |             7.61 |         -22.39
sidestep, punish      0    1  199 |            14.81 |         -15.04
patient parry       200    0    0 |            55.20 |          55.20

reward = survive (1/30 a frame for staying alive, +-30 at the end)
------------------------------------------------------------------
player              win  die  clk | clock = truncate | clock = defeat
stand still           0  200    0 |           -18.27 |         -18.27
mash attack           2  198    0 |           -15.15 |         -15.15
run away              0  200    0 |           -15.71 |         -15.71
circle                0  197    3 |           -15.04 |         -15.49
hold guard            0    0  200 |            30.00 |           0.00
block, punish         0    0  200 |            30.00 |           0.00
sidestep, punish      0    1  199 |            29.80 |          -0.05
patient parry       200    0    0 |            52.91 |          52.91

  read the 'survive' block twice. Under a neutral clock it pays 'hold guard' exactly
  30.00 -- thirty seconds at a thirtieth a frame -- and it pays a WIN exactly +30 too,
  so refusing to fight and finishing the fight are worth the same number and the only
  difference is how long the winner had to spend. That is the turtle, in arithmetic.
  Under 'trade', where being hit costs nothing, 'hold guard' scores exactly 0.00: it
  never deals damage and is never charged for what it takes. And under 'damage' with
  the clock as a DEFEAT, every non-winner is squeezed into -17..-41 and the ordering
  stops being informative -- which is World 1's terminated-vs-truncated question,
  asked again and answered the other way round.`;

const outArith = `player             seconds   time part   ending part      G   (check)
hold guard            30.0       30.00          0.00  30.00    30.00
sidestep, punish      30.0       30.00          0.00  30.00    30.00
patient parry         22.6       22.56         30.00  52.56    52.56

a full duel is 900 frames = 30.0 points for the time alone.
a win is worth 30.0 points.  Those two numbers are the same size.

and because the clock keeps paying, a SLOWER win scores better:
  win at 10 s ->  40.0      survive the clock ->  30.0
  win at 20 s ->  50.0      survive the clock ->  30.0
  win at 29 s ->  59.0      survive the clock ->  30.0`;
