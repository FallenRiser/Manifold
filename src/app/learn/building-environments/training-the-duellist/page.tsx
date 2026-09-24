import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Training the duellist — Manifold",
  description:
    "The first four steps of the pipeline are done, so now the fifth: a network, a budget in decisions rather than frames, and an exam that eleven hand-written players have already sat — so the result can be placed on a ladder instead of admired on its own.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TrainingTheDuellist() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 15 minutes"
        title={<>Training the duellist</>}
        intro={<>Plan, parameterise, code, test — and only now, train. Everything that follows is deliberately
          unglamorous: the same scorer the scripted players were measured with, a budget quoted in decisions, a network
          with nothing clever in it, and a result that gets placed <em>between two rungs of the ladder</em> rather than
          reported as a number on its own.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The exam was written before the student existed</h2>
        <p>
          The single most important thing on this page is that nothing about the evaluation was decided here. Two
          hundred duels on seeds 1000 to 1199, a decision every three frames, scored through the same{" "}
          <code>score()</code> function that produced every row of the{" "}
          <Link href="/learn/building-environments/scripted-players-and-a-difficulty-dial" style={link}>sanity
          ladder</Link>. Training never touches those seeds. The trained policy is literally a new row in the same
          table.
        </p>
        <p>
          That sounds like hygiene and it is actually the whole method. &ldquo;The agent reached a return of 34&rdquo;
          is uninterpretable. &ldquo;The agent sits above <code>sidestep, punish</code> and below{" "}
          <code>parry oracle</code>, and it gets there by parrying rather than by trading&rdquo; is a finding, and it is
          only available because eleven players sat the same exam first.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeBudget} />
        <CodeOutput source="scripts/boss_cases.py">{outBudget}</CodeOutput>

        <h2>Two learners, and why those two</h2>
        <p>
          <strong>DQN</strong> — value-based, off-policy, a replay buffer, an &epsilon;-greedy explorer and a target
          network. It is the algorithm the{" "}
          <Link href="/learn/function-approximation" style={link}>function-approximation track</Link> ends on, and it
          suits a small discrete action space: sixteen buttons, one Q-value each, and the argmax is the policy.
        </p>
        <p>
          <strong>PPO</strong> — policy-gradient, on-policy, fresh rollouts every update. It is the default in most
          modern control work, it is far more robust to reward scale, and it has a specific weakness this world is good
          at exposing: a policy that has collapsed onto one action produces no gradient to escape with.
        </p>
        <p>
          Both see the same twenty-seven floats and press the same sixteen buttons. The network is an MLP — two hidden
          layers of 256 for DQN, two of 128 for the actor-critic — and it is worth saying why there is nothing more
          interesting in it.
        </p>
        <ul style={{ lineHeight: 1.75 }}>
          <li><strong>No convolutions.</strong> There is no image and no grid. Twenty-seven floats have no spatial
            structure for a kernel to exploit. World 2 <em>did</em> use a convolutional pointer network, because its
            observation genuinely was twelve stacked maps.</li>
          <li><strong>No recurrence, and this one is a real decision.</strong> The observation is Markov — it carries
            the boss&rsquo;s move and its animation frame — so in principle no memory is needed. The moment you take
            those away, as the{" "}
            <Link href="/learn/building-environments/what-the-agent-sees" style={link}>observation page</Link> argues
            you arguably should, a recurrent policy stops being optional.</li>
          <li><strong>No frame stacking</strong>, for the same reason and with the same caveat.</li>
        </ul>

        <Proof title="why the budget is counted in decisions and not in frames" color={GOLD}>
          <p style={{ margin: 0 }}>
            A frame is what the simulator steps; a decision is what the learner sees. At <em>R</em> = 3 they differ by a
            factor of three, and quoting the wrong one makes two runs incomparable. The convention here is decisions,
            because that is what the replay buffer, the gradient steps and the exploration schedule are all counted in —
            and because the simulator is not the scarce resource anyway. A two-million-decision run spends about ninety
            seconds{" "}
            <Link href="/learn/building-environments/thousands-of-duels-at-once" style={link}>stepping duels</Link> and
            an hour doing everything else.
          </p>
        </Proof>

        <h2>What we are watching for, chosen in advance</h2>
        <p>
          The ladder columns double as a behaviour probe, which means a trained policy announces which strategy it found
          without anybody having to watch it play.
        </p>
        <ul style={{ lineHeight: 1.75 }}>
          <li><strong><code>guard%</code> near 100 and <code>swings</code> near zero</strong> — it has become{" "}
            <code>hold guard</code>. Under the shipped reward that scores &minus;5.47.</li>
          <li><strong><code>bossHP</code> stuck at 240.0 with no hits taken</strong> — it has found the refusal, and the
            arena wall has failed to close it.</li>
          <li><strong><code>parries</code> climbing</strong> — it is on the expert&rsquo;s path, the one this world was
            built around.</li>
          <li><strong><code>poise</code> breaks climbing with few parries</strong> — it found the other route: two clean
            hits in one engagement, stagger, riposte. Legitimate, worth 12.35 for the sidestepper, and nowhere near the
            ceiling.</li>
          <li><strong><code>hits</code> above 4.5</strong> — whatever it is doing, it is not defending; that is the
            number every dying row on the ladder shares.</li>
        </ul>
        <DecisionPoint
          accent={GOLD}
          question={<>A run ends at 2,000,000 decisions with a 62% win rate. What do you report?</>}
          options={[
            {
              label: "The whole curve, and say where the run happened to stop",
              verdict: "best",
              response: (<>The only honest option when the curve is not monotone — and in this world it has not been.
                A single end-of-run number misreports a wobbling curve in whichever direction the last evaluation
                happened to land, and you cannot tell which without looking.</>),
            },
            {
              label: "62%, with a note on the budget",
              verdict: "close",
              response: (<>Standard practice and not enough here. If the previous evaluation said 89% and the next would
                have said 40%, the headline is a sample from a distribution you have not described.</>),
            },
            {
              label: "The best evaluation the run ever reached",
              verdict: "miss",
              response: (<>This is early stopping without a validation set, and the &ldquo;best&rdquo; point was chosen
                using the same two hundred duels you are reporting on. The held-out seeds stop being held out the moment
                you use them to pick a checkpoint.</>),
            },
            {
              label: "Re-run with more seeds before reporting anything",
              verdict: "close",
              response: (<>The right instinct and the expensive one. Three seeds at an hour each is a real cost, and the
                honest interim position is to report one run, say it is one run, and say what it would take to make the
                claim properly — which is what happens below.</>),
            },
          ]}
        />

        <Callout color={GOLD} title={<>The result, and how much of it there is</>}>
          <p style={{ margin: 0 }}>
            One DQN run, one seed, two million decisions, on the shipped world with poise, the neutral clock and the{" "}
            <code>damage</code> reward. That is enough to answer &ldquo;is the skill learnable at all&rdquo; and not
            enough to answer &ldquo;does DQN beat PPO&rdquo; or &ldquo;how reliable is it&rdquo;. Both of those need
            three seeds per arm and are not claimed here. The curve and the final row are below, with the ladder rungs
            for scale.
          </p>
        </Callout>
        <CodeOutput source="scripts/boss_train.py">{outRun}</CodeOutput>

        <h2>It learned the parry, and it took its time about it</h2>
        <p>
          <strong>Two hundred wins from two hundred held-out duels, no deaths, 83.6 health left.</strong> That is the
          patient expert&rsquo;s win rate, reached by a network that was handed nothing but twenty-seven floats and a
          reward. On the ladder it lands above <code>parry oracle</code> (195 wins, 47.83) and just below{" "}
          <code>patient parry</code> (55.20), at 53.57.
        </p>
        <p>
          It gets there by parrying — 4.63 a duel against the expert&rsquo;s 8.56 — and, notably,{" "}
          <strong>not</strong> by using poise at all: 0.00 breaks, exactly like the expert, because everything it lands
          is already riposte damage. The prettiest number in the table is the swing count. The expert takes{" "}
          <strong>7.00</strong> swings a duel and the network takes <strong>7.01</strong>, and neither is a
          coincidence: a riposte does 12 &times; 3 = 36 damage, the boss has 240 health, and 240 &divide; 36 is 6.7. Two
          completely different policies converge on seven swings because seven is the number the arithmetic allows.
        </p>
        <p>
          The difference between them is what it costs to get those seven openings. The expert is never touched. The
          network takes 0.85 hits a duel and finishes on 83.6 health rather than 100.0 — it wins some of its openings by
          trading rather than by reading, which is exactly the gap the{" "}
          <Link href="/learn/building-environments/what-it-learned-about-delayed-attacks" style={link}>next page</Link>{" "}
          takes apart.
        </p>

        <h2>Why the curve, not the number</h2>
        <p>
          The DecisionPoint above was written before this run finished, and the run then made the case better than the
          argument did. Nothing happens for nine hundred thousand decisions — <strong>nine consecutive evaluations at
          zero wins</strong>. Then 22%, 59%, 68%, and <strong>100% at 1.3M</strong>. And then it falls over:{" "}
          <strong>91% at 1.5M and 69% at 1.6M</strong>, before returning to 100% and staying there.
        </p>
        <p>
          Had the budget been 1.6M decisions, this page would have reported a 69% duellist. Had it been 1.3M, a perfect
          one. Both would have been the same run. That is the whole argument for publishing the curve, and it is the
          second time this world has produced a non-monotone one.
        </p>
        <Callout color={GOLD} title={<>Two local optima it visited and left</>}>
          <p style={{ margin: 0 }}>
            Read the <code>poise</code> and <code>guard%</code> columns down the curve. At 700k&ndash;900k decisions the
            policy is opening <strong>1.00 and 1.28 poise breaks a duel</strong> — it found the other route to a
            stagger, the one you reach by hitting the boss — and by 1.4M it has abandoned it completely for 0.00. At
            900k it is also guarding <strong>27.3%</strong> of its frames, which is the turtle from the next page
            starting to form, and by 1.3M that is down to 0.6%. Both dead ends are visible in the numbers, and both were
            passed through rather than settled in. A run that had stopped at 900k would have been reported as a policy
            that plays a completely different game.
          </p>
        </Callout>
        <p>
          <strong>What this is not.</strong> One algorithm, one seed, one budget. It says the skill this world was built
          around is learnable and roughly where it appears. It does not say DQN beats PPO, it does not say another seed
          would get there, and it does not say 2M decisions is the right budget rather than the one that happened to be
          run. Those claims need three seeds an arm and about six hours, and they are not made here.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-training-loop", label: <>&larr; The training loop, line by line</> }}
          next={{ href: "/learn/building-environments/the-turtle", label: <>The turtle: reward hacking a duel →</> }}
        />
      </div>
    </article>
  );
}

const codeBudget = `# The exam: 200 duels on seeds the world's design never touched, scored by the same
# function every hand-written player was scored by.
print("held-out seeds 1000-1199, one decision every 3 frames")
print("a duel is %d frames, so at most %d decisions." % (MAX_FRAMES, MAX_FRAMES // 3))
print()
print(" budget (decisions)     frames    full-length duels")
for b in (600000, 1000000, 2000000, 3000000):
    print("%19d %10.1fM %20.0f" % (b, b * 3 / 1e6, b / (MAX_FRAMES // 3)))
print()
print("the three rungs a trained policy has to be placed between:")
ladder(players=[("hold guard", turtle),
                ("sidestep, punish", sidestep_and_punish),
                ("patient parry", patient_parry)], n=25)`;

const outBudget = `held-out seeds 1000-1199, one decision every 3 frames
a duel is 900 frames, so at most 300 decisions.

 budget (decisions)     frames    full-length duels
             600000        1.8M                 2000
            1000000        3.0M                 3333
            2000000        6.0M                 6667
            3000000        9.0M                10000

the three rungs a trained policy has to be placed between:
player           win  die  clk  bossHP  ownHP   sec  meanD  offax  parry  poise  block   brk  hits  dodge  arcX  swing  wall%        G
hold guard          0    0   25   240.0   44.5  30.0   1.28   0.00   0.00   0.00  10.52  3.20  0.28   0.00  0.00   0.00   11.0    -5.55
sidestep, punish    0    0   25    82.1   75.2  30.0   1.59   0.25   0.00   1.88   0.00  0.00  1.60   5.80  2.40   9.20    0.0    13.31
patient parry      25    0    0   -12.0  100.0  22.6   1.56   0.00   8.36   0.00   0.00  0.00  0.00   0.00  0.00   7.00    2.9    55.20`;

const outRun = `dqn_2000k_s0 -- DQN, seed 0, damage reward, clock = truncate, 63 min
--------------------------------------------------------------------
  decisions   win%    ownHP  parries  poise  swings  guard%        G   (100 held-out duels)
     100000    0.0    17.8     0.05   0.01    1.01     7.1  -14.84
     200000    0.0     1.8     0.00   0.00    0.00     3.3  -26.32
     300000    0.0    -9.5     0.01   0.00    0.00     1.1  -37.65
     400000    0.0    -2.7     0.99   0.00    0.00     0.3  -29.77
     500000    0.0    -6.4     0.36   0.00    0.12     0.5  -37.28
     600000    0.0     1.3     0.23   0.00    2.42     2.7  -21.57
     700000    0.0    -4.3     0.71   1.00    7.10     2.0  -16.54
     800000    0.0    -0.2     0.90   0.27    2.66     5.0  -16.98
     900000    0.0     2.4     0.97   1.28    8.10    27.3   -4.51
    1000000   22.0    10.4     2.05   0.89    8.21     2.5   13.30
    1100000   59.0    21.8     2.61   1.01    9.39     2.2   26.80
    1200000   68.0    32.1     4.03   0.56    9.42     1.9   35.07
    1300000  100.0    73.2     4.62   0.03    7.30     0.6   52.49
    1400000  100.0    85.6     5.46   0.00    7.10     2.3   53.67
    1500000   91.0    65.8     4.95   0.00    7.18     1.3   48.32
    1600000   69.0    54.3     4.33   0.00    6.76     2.5   40.21
    1700000  100.0    79.2     4.77   0.00    7.18     6.1   53.08
    1800000  100.0    83.9     4.76   0.00    7.23     0.8   53.48
    1900000  100.0    84.0     4.69   0.00    7.13     0.3   53.55
    2000000  100.0    82.8     4.62   0.00    7.00     0.2   53.48

  and the full 200 held-out duels at the end, beside the rungs it sits between:
  THE TRAINED NET     200    0    0   -12.1   83.6   4.63   0.00   7.01  0.85    0.2    53.57
  hold guard            0    0  200   240.0   45.3   0.00   0.00   0.00  0.14   85.4    -5.47
  sidestep, punish      0    1  199    90.4   75.3   0.00   1.80   8.80  1.57    0.0    12.35
  parry oracle        195    5    0    -8.6   44.7   4.58   0.26   9.23  2.71    0.0    47.83
  patient parry       200    0    0   -12.0  100.0   8.56   0.00   7.00  0.00    0.0    55.20
                      win  die  clk  bossHP  ownHP  parry  poise  swing  hits guard%        G`;
