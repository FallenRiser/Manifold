import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { DuelArenaLabV2 } from "@/components/boss/DuelArenaLabV2";

export const metadata = {
  title: "Reading a policy off its buttons — Manifold",
  description:
    "The rebuilt duellist wins 92 of 200 and almost never parries. Here is how you work out what a policy actually does — the button trace by boss phase, the confidence behind each choice — and what to change when it ignores the mechanic you built the world around.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ReadingAPolicy() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 14 minutes"
        title={<>Reading a policy off its buttons</>}
        intro={<>Six million decisions later the duellist wins 92 of 200. That number tells you it
          works and nothing whatsoever about what it does — and &ldquo;it works&rdquo; is the least
          interesting thing you can know about a policy. This page is the method for finding out,
          applied to a net that turned out to be ignoring the mechanic the whole world was built
          around.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <p>
          The net trained against{" "}
          <Link href="/learn/building-environments/a-harder-fight" style={link}>the harder
          fight</Link> — eleven moves, a six-frame parry that wears out if you spam it, an
          unblockable with no button answer. It ran 6,000,000 decisions in 174 minutes on a
          1660&nbsp;Ti. Then the first question: does it beat the scripted players?
        </p>

        <CodeOutput source="scripts/boss_v2_train.py">{outProbe}</CodeOutput>

        <p>
          Four times the reference player&rsquo;s record, and ten times the best parry-based
          script. By the only measure the brief asked for, it works.
        </p>
        <p>
          Now look at the <code>presses</code> column. <strong>It presses parry 0.34 times per
          duel.</strong> The scripted <code>patient parry</code> presses twenty times more often
          and wins nine. Every mechanic added in the rebuild — the widened window, the fatigue
          ladder, the five- and seven-hit strings built specifically to manufacture parry
          openings — and the winning policy essentially does not use any of it.
        </p>
        <p>
          The last row is worth a second too. <code>roll, punish</code> wins nothing, dies
          nothing, and hits the clock 200 times out of 200. That is not a broken measurement; it
          is the turtle. It rolls 13.9 times a duel, swings 4.27 times, takes the boss from 300 to
          249, and finishes on 90 of its own 100 health. Perfectly safe, perfectly useless — and a
          useful foil, because the trained net also rolls constantly. The difference between
          0/200 and 92/200 is entirely about what happens next.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>If it is not parrying, what is it doing? One of these accounts for most of
            its decisions during a boss windup.</>}
          options={[
            "Guarding, and eating the chip damage",
            "Strafing sideways, so the attack misses",
            "Backing out of range and waiting",
            "Attacking into the windup to trade",
          ]}
          nudge="Hold that thought — the trace below settles it in one table."
        />

        <h2>The instrument: what it presses, and when</h2>
        <p>
          A win rate is a scalar. To see a <em>policy</em> you need its actions conditioned on
          something meaningful, and in a fighting game the meaningful thing is which phase of
          which attack is on screen. Every boss move here is a list of segments — windup, delay,
          active, recovery — so bucket every decision by the phase in progress and count.
        </p>

        <CodeOutput source="scripts/boss_v2_train.py">{outButtons}</CodeOutput>

        <p>Read it one row at a time and a strategy falls out of it.</p>
        <p>
          <strong>Windup — move right, 31%.</strong> Nearly a third of all decisions during a
          windup are a single button, and it is a sideways one. Every attack in this world is a
          cone of some arc in front of the boss, so stepping across the face of one is the
          cheapest possible answer: no stamina, no commitment, no window to hit.
        </p>
        <p>
          <strong>Active — roll in, 21%.</strong> Note the direction. Not <em>away</em> —{" "}
          <em>in</em>. The roll has invincibility frames, so rolling through the attack beats
          rolling out of it, and it arrives next to the boss just as the recovery starts. The
          turtle rolls back; this rolls forward.
        </p>
        <p>
          <strong>Recovery — heavy attack, 19%.</strong> The punish. The heavy costs 34 stamina
          and takes 14 frames to come out, which is suicide at any other moment and free during a
          recovery the roll already put it next to.
        </p>
        <Callout color={GOLD} title={<>The three-beat loop, stated plainly</>}>
          <p style={{ margin: 0 }}>
            Strafe the windup · roll through the active frames · heavy the recovery. Three buttons,
            one loop, and it never needs the parry at all. Anyone who has beaten a Souls boss by
            rolling and punishing will recognise it immediately — which is the point. It is a real
            strategy, not an exploit, and the agent found it without being shown one.
          </p>
        </Callout>
        <p>
          The <code>no move out</code> row is the other 15,394 decisions — over half the total —
          and it is diffuse: 16% here, 14% there. That is spacing, and spacing has many nearly
          equivalent answers. Hold on to that, because the next instrument explains it.
        </p>

        <h2>How decided was it?</h2>
        <p>
          A Q-network does not output an action. It outputs a value for every action, and the
          action is just the argmax. The <em>gap</em> between the best and second-best is
          therefore free information about how much the choice mattered — and it is information
          the action trace above throws away entirely.
        </p>

        <CodeOutput source="scripts/boss_qspread_v2.mjs">{outSpread}</CodeOutput>

        <p>
          This is the most interesting table on the page. Compare the p90 column down the rows:
          during a <strong>windup</strong> the top tenth of decisions are won by 0.366, during a{" "}
          <strong>delay</strong> by 0.611 — and during <strong>recovery</strong> by 0.063, barely
          distinguishable from a coin flip.
        </p>
        <p>
          <strong>Its confidence spikes exactly where there is something to read.</strong> That is
          much stronger evidence than the action trace that it genuinely reads the attack rather
          than following a learned rhythm. A policy running on a timer would be equally decided
          everywhere. This one is decided when the screen contains a question and indifferent when
          it does not.
        </p>
        <p>
          And the delay phase producing the single highest confidence anywhere is the{" "}
          <Link href="/learn/building-environments/what-it-learned-about-delayed-attacks" style={link}>
          delayed-attack lesson</Link> arriving from a different direction. The held windup was
          designed to be the hard part. It is also where the net is surest of itself.
        </p>

        <Callout color={GOLD} title={<>A near-tie is usually indifference, not confusion</>}>
          <p style={{ margin: 0 }}>
            The overall median margin is 0.024, which looks alarming until you see which pairs are
            tied: <code>move right</code> vs <code>move in-right</code> 2,474 times,{" "}
            <code>roll back</code> vs <code>roll in</code> 742, <code>move in</code> vs{" "}
            <code>move in-left</code> 819. These are <em>neighbouring</em> actions. Being unable to
            choose between two buttons that do nearly the same thing is not indecision, it is the
            problem genuinely having two answers. This is why a confidence readout has to name the
            runner-up: &ldquo;decided between roll-in and roll-back&rdquo; and &ldquo;decided
            between roll-in and heavy attack&rdquo; mean completely different things at an
            identical number.
          </p>
        </Callout>

        <h2>Watch it, with the numbers on screen</h2>
        <p>
          Everything above is a summary over tens of thousands of decisions. Here is the same
          policy one decision at a time. Press <strong>watch: the trained net</strong> — the arena
          fetches the actual 80,145 trained floats and runs them, and the panel above the fight
          shows the button it picked, the button it beat, and by how much.
        </p>
        <p>
          Two things to look for. First, <strong>the <code>parry</code> and <code>guard</code>{" "}
          rows sit empty almost the entire fight</strong> — you can watch it not consider the
          mechanic. Second, watch the bars spread apart as a windup begins and collapse back
          together during recovery. That is the table above, live.
        </p>

        <DuelArenaLabV2 />

        <Callout color={GOLD} title={<>Why the bars are on a fixed scale</>}>
          <p style={{ margin: 0 }}>
            An earlier version of this panel, in the first arena, normalised the values to their
            own minimum and maximum every frame. It was useless, and it took a measurement to see
            why: the spread of those values varies about <strong>46-fold</strong> between the tenth
            and ninetieth percentile, so rescaling to the extremes every frame erases precisely the
            thing the panel exists to show. A row here is full when that button ties the leader and
            empty when it is 0.17 of Q behind — the measured p90, fixed, never renormalised. When a
            riposte window opens you will see a margin near 4.0 and every other bar at zero; on a
            per-frame scale that frame would have looked identical to a coin flip.
          </p>
        </Callout>

        <h2>So the mechanic is optional. Now what?</h2>
        <p>
          It is worth being precise about what went wrong, because it is not a bug. Look at what
          the net <em>does</em> use: the heavy attack, on 19% of recovery decisions. A landed heavy
          is worth 33 posture. A parry is worth 50. But the heavy-on-recovery is nearly free — the
          boss is committed and cannot punish it — while the parry demands a 200ms read against a
          move that may kill you. <strong>The parry costs far more than 50-over-33 more risk, so it
          never pays.</strong> That is an economic imbalance, and it is measurable.
        </p>

        <DecisionPoint
          accent={GOLD}
          question={<>The agent ignores the parry. Is that a problem to fix?</>}
          options={[
            {
              label: "Leave it — an optional mechanic is a legitimate design",
              verdict: "close",
              response: (
                <>Defensible, and this is what we did here. Plenty of well-regarded games have a
                parry that skilled players use and everyone else rolls past. The 92/200 stands on
                its own terms. The cost is that four of the rebuild&rsquo;s changes are now
                decoration, and a world with decorative mechanics is a world you cannot reason
                about.</>
              ),
            },
            {
              label: "Raise the parry's posture payoff until it wins",
              verdict: "miss",
              response: (
                <>The obvious lever and the weakest one. The gap is not 50-versus-33, it is
                risk-adjusted, so you would have to raise the payoff until a parry is worth several
                free heavies — at which point one good read trivialises the fight and you have
                built a different exploit. Tuning a number that is not the binding constraint
                usually just moves the problem.</>
              ),
            },
            {
              label: "Make rolling stop being a universal answer",
              verdict: "best",
              response: (
                <>This is the one that bites. The roll is free because a seven-hit string can be
                rolled through end to end; make the stamina arithmetic forbid that and the last
                hits of a long combo have no answer except the parry. That changes which strategy
                is optimal rather than changing which is better rewarded — and it is testable: the
                action trace above would have to show parries appearing in the long strings.</>
              ),
            },
          ]}
        />

        <p>
          Concretely, the third option is three changes: raise the roll&rsquo;s stamina cost or
          lengthen its recovery so consecutive rolls cannot cover a whole string; make stamina
          regeneration pause during a combo; and leave the parry alone. None of that has been
          built or measured, and it is written here as a design rather than a result.
        </p>

        <Callout color={GOLD} title={<>Two numbers on this page that need an asterisk</>}>
          <p>
            <strong>92 or 93?</strong> The training run&rsquo;s own final evaluation said 93 of 200;
            the probe above says 92. Both ran the same weights over the same seeds. The difference
            is that training evaluated on the GPU and the probe runs on the CPU, and with a median
            margin of 0.024 the two accumulate float arithmetic in a different order and one duel
            in two hundred tips the other way. The published number is the reproducible one — the
            CPU command printed above the table.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>And 46% is not a settled figure.</strong> The last three evaluations during
            training scored 57, 67 and 47 wins per hundred. That is a ten-point swing well beyond
            sampling noise at n=100, which means the policy is still moving at six million
            decisions rather than having converged to something. One seed, not converged: enough to
            say what the strategy is, not enough to say what the ceiling is.
          </p>
        </Callout>

        <Quiz
          accent={GOLD}
          questions={[
            {
              q: <>The net&rsquo;s margin between best and second-best action is 0.017 during
                recovery and 0.611 during a delay. What does that most support?</>,
              options: [
                "The net is unreliable during recovery and should be retrained",
                "The net reads the attack, rather than acting on a fixed rhythm",
                "Recovery frames are a bug in the environment",
                "The Q-values are too small to be meaningful",
              ],
              answer: 1,
              explain: (
                <>A policy following a learned timing pattern would be equally confident
                everywhere. Confidence that rises precisely when the screen carries information
                about an incoming attack, and falls when it does not, is what reading looks like.
                The low recovery margin is not unreliability — during a recovery several approach
                actions genuinely are near-equivalent.</>
              ),
            },
            {
              q: <>A scripted player finishes 200 duels with 0 wins, 0 deaths and 200 clock
                timeouts. What have you most likely found?</>,
              options: [
                "A broken policy that never sends any inputs",
                "A measurement bug in the scoring harness",
                "A turtle — it survives by never committing to an attack",
                "A player that ties every duel on health",
              ],
              answer: 2,
              explain: (
                <>Measured: it rolls 13.9 times a duel, swings 4.27 times, and ends on 90 of 100
                health having taken the boss from 300 to 249. It is playing, just never risking
                anything. The row only looks empty because a win/die table with no clock column
                cannot express &ldquo;survived and achieved nothing&rdquo;.</>
              ),
            },
            {
              q: <>Why should a confidence panel avoid rescaling the Q-values to their own
                per-frame minimum and maximum?</>,
              options: [
                "It is slower to compute each frame",
                "The spread varies ~46x between frames, so rescaling erases the difference it exists to show",
                "Q-values can be negative",
                "It would need the runner-up's name as well",
              ],
              answer: 1,
              explain: (
                <>This is a mistake that actually shipped in the earlier arena. A frame where the
                leader wins by 4.0 and a frame where it wins by 0.01 both fill the bar to the top
                under per-frame normalisation. Encoding against a fixed, measured scale is what
                makes the two look different.</>
              ),
            },
          ]}
        />

        <PrevNext
          prev={{ label: "Coding the harder fight", href: "/learn/building-environments/coding-the-harder-fight" }}
          next={{ label: "Sim vs the real game", href: "/learn/building-environments/sim-vs-the-real-game" }}
        />
      </div>
    </article>
  );
}

const outProbe = `$ python scripts/boss_v2_train.py probe --tag v2_dqn_6000k_s0 --eval-n 200 --device cpu

the parry, 200 duels each
arm                         win  die  clk  presses   landed   land%  mashed   dead   erupt
v2_dqn_6000k_s0              92  103    5     0.34     0.30   88.4%    0.00   0.00    0.21
patient parry (scripted)      9  165   26     6.89     4.45   64.5%    0.00   0.00    0.14
mash parry (scripted)         0  200    0    14.41     0.98    6.8%    5.26   2.69    0.26
roll, punish (scripted)       0    0  200     0.00     0.00    0.0%    0.00   0.00    0.00

  presses/landed/mashed/dead are per duel. land% is landed over presses:
  the discipline number. A 6-frame window (200ms) only stays that wide if the last
  press was more than 30 frames ago; each one inside that costs 2 frames.`;

const outButtons = `$ python scripts/boss_v2_train.py buttons --tag v2_dqn_6000k_s0 --eval-n 150 --device cpu

what it presses, by the phase the boss is in (150 duels)
  no move out    15394 decisions   move back-right 16%   move in-left 14%   attack 10%   idle 10%
  windup         10678 decisions   move right 31%   move left 9%   idle 9%   heavy attack 7%
  DELAY           1300 decisions   move right 24%   move left 14%   move in 12%   idle 10%
  active          1658 decisions   roll in 21%   move right 13%   roll back 9%   guard 7%
  recovery        6729 decisions   heavy attack 19%   roll in 18%   roll back 15%   idle 12%`;

const outSpread = `$ node scripts/boss_qspread_v2.mjs

v2_dqn_6000k_s0: best-minus-second Q margin over 28877 decisions in 120 duels

  phase          decisions      p10     p25   median      p75      p90
  no move out       12501    0.003    0.008    0.020    0.039    0.074
  windup             8611    0.006    0.016    0.043    0.143    0.366
  DELAY               987    0.006    0.017    0.035    0.126    0.611
  active             1371    0.006    0.015    0.033    0.067    0.153
  recovery           5407    0.003    0.007    0.017    0.034    0.063
  ALL               28877    0.004    0.010    0.024    0.055    0.167

  the closest calls it keeps having to make (best vs runner-up):
      2474  move right  vs  move in-right
       952  heavy attack  vs  move in-right
       819  move in  vs  move in-left
       742  roll back  vs  roll in
       631  idle  vs  move back-right
       581  move in-left  vs  move in
       558  heavy attack  vs  idle
       520  roll in  vs  roll back`;
