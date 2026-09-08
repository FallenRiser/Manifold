import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "What counts as success? — Manifold",
  description:
    "RL has no test set, so the evaluation harness is something you design — and it decides who wins. Turning exploration off during evaluation is worth 8 points here; measuring over 20 episodes instead of 500 gives a spread four times larger than the effects we will be claiming.",
};

const OLIVE = "var(--c-warehouse)";

export default function WhatSuccessMeans() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 2 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>What counts as success?</>}
        intro={<>
          Supervised learning hands you a test set and, with it, most of your evaluation protocol. Reinforcement
          learning hands you nothing: you decide what to run, how you run it, and how many times. Those choices are
          worth more points than most algorithm changes — so we make them now, in writing, before we have a
          favourite.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion accent={OLIVE} label="The engineer's question" icon="🤖">
          What exactly is the number I will put in the table — and is it stable enough to support the claim I want
          to make with it?
        </AnalystQuestion>

        <h2>The scoreboard</h2>
        <p>
          The objective the business cares about is simple: over a full shift, how much value does the robot
          generate? So our headline metric is the <strong>mean undiscounted return of a complete episode, starting
          at the dock</strong>. Three details in that sentence are decisions, not facts:
        </p>
        <ul>
          <li>
            <strong>Undiscounted.</strong> The agent optimises a discounted return because discounting is a
            learning device — it makes the value function well-defined and supplies urgency. But{" "}
            <M>\gamma</M> is <em>ours</em>, not the warehouse&rsquo;s. A package delivered on step 30 is worth the
            same to the business as one delivered on step 3. So we train on the discounted objective and score on
            the undiscounted one.
          </li>
          <li>
            <strong>From the dock.</strong> Training will sometimes start episodes elsewhere (Act 5 explains why we
            had to), but the deployed robot always starts at the dock. Evaluation must match deployment.
          </li>
          <li>
            <strong>Complete episodes, capped at 250 steps.</strong> Fixed for the whole capstone. Numbers
            measured under different caps are not comparable.
          </li>
        </ul>
        <p>
          Alongside the return we always report three diagnostics — <strong>delivered %</strong>,{" "}
          <strong>spills per episode</strong> and <strong>steps</strong> — because a single scalar hides the thing
          we most want to see. Two policies scoring 18 can be completely different animals: one slow and careful,
          one fast and occasionally catastrophic. The return alone cannot tell you which robot you are about to put
          on a real floor.
        </p>

        <h2>Do you evaluate with exploration on?</h2>
        <p>
          Here is the choice that quietly decides several arguments later in this capstone. An RL agent typically
          acts <M>\varepsilon</M>-greedily — mostly best action, sometimes random. When you measure it, do you leave
          that randomness on?
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="We score the optimal policy twice: once purely greedily, once with a 10% chance of a random action. How much does that 10% cost?"
          options={[
            "Almost nothing — one action in ten, and most random actions are harmless",
            "Around a third of the return — random actions near the spill wall are expensive, and the robot must recover from them",
            "It should score higher — exploration finds shortcuts",
          ]}
          nudge="Locked in. Watch what a one-in-ten random action does to a policy that has to squeeze through a doorway with spills on both sides."
        />

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeEps} />
        <CodeOutput>{`evaluation eps |   return  delivered  spills   steps
          0.00 |    20.97     100.0%   0.147    24.6
          0.02 |    20.35     100.0%   0.152    25.1
          0.05 |    18.02     100.0%   0.194    26.2
          0.10 |    13.10     100.0%   0.289    28.2`}</CodeOutput>
        <p>
          The <em>same policy</em> scores <strong>20.97</strong> or <strong>13.10</strong> depending purely on a
          measurement setting. That is a bigger swing than most of the algorithmic differences we are going to
          spend Act 3 investigating — which means reporting the number without the setting is close to meaningless.
        </p>
        <p>
          Notice where it goes: spills roughly double, from 0.147 to 0.289 per episode. Exploration is not
          uniformly cheap. It is cheap in open floor and expensive next to a hazard, and this warehouse has a
          hazard exactly where the good route runs. That observation is going to come back with force in Act 3,
          because it is the entire reason SARSA and Q-learning disagree.
        </p>

        <DecisionPoint
          accent={OLIVE}
          question={<>So which do you report as <em>the</em> number for a trained agent?</>}
          options={[
            {
              label: "Greedy (ε = 0) — it measures the policy the agent has learned",
              verdict: "best",
              response: <>Right for us, because the deployed robot will not explore: exploration is a training-time
                cost we pay to learn, not a behaviour we ship. Greedy evaluation answers &ldquo;how good is the
                policy this agent found?&rdquo; — and that is the question the table is for. We will state the
                setting every single time.</>,
            },
            {
              label: "On-policy (ε as trained) — it measures what the agent actually does",
              verdict: "close",
              response: <>A perfectly serious position, and the right one whenever exploration continues in
                deployment — a recommender that keeps testing new items, a controller that must keep probing. If
                that is your setting, this is the honest number, and the greedy score is optimistic fiction. We
                will in fact report <em>both</em> in Act 3, because the comparison between them is where the
                SARSA-versus-Q-learning question lives.</>,
            },
            {
              label: "The mean training return over the last 100 episodes",
              verdict: "miss",
              response: <>Convenient, and it is what the training loop already has lying around — which is exactly
                why it gets used and why it misleads. It mixes exploration noise with a policy that was still
                changing while it was measured, and it rewards agents that happened to be lucky late. Training
                curves are for diagnosis; final numbers deserve a clean, separate evaluation.</>,
            },
          ]}
        />

        <h2>How many episodes is enough?</h2>
        <p>
          The warehouse is stochastic, so any measurement is an estimate. The question is how noisy an estimate.
          Let&rsquo;s find out empirically rather than by rule of thumb: evaluate the <em>same fixed policy</em> 15
          separate times, with different evaluation seeds, at three sample sizes.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeNoise} />
        <CodeOutput>{`episodes |   mean    sd across 15 independent evaluations
      20 |  22.28     2.73
     100 |  21.27     1.43
     500 |  21.00     0.72`}</CodeOutput>
        <p>
          At 20 episodes the standard deviation is <strong>2.73</strong>. A difference of two or three points
          between two agents — which is roughly the size of the real algorithmic effects in this capstone — would
          be indistinguishable from noise. Worse, the 20-episode mean is <strong>22.28</strong>, above the true
          value: with few samples you are as likely to be reporting a lucky run as a good agent.
        </p>
        <p>
          The <M>{String.raw`1/\sqrt{n}`}</M> shape is visible and unforgiving: quartering the noise costs sixteen
          times the compute. We settle on <strong>2,000 evaluation episodes</strong> for headline numbers, which
          puts the spread near <M>{String.raw`\pm 0.35`}</M> — comfortably below the effects we intend to claim —
          and we use a fixed evaluation seed so the same policy always scores the same thing.
        </p>

        <Callout color={OLIVE} title={<>Two different noises, and only one of them is fixed by this</>}>
          Everything above measures <strong>evaluation noise</strong>: the same policy, run more times. There is a
          second, larger source of variation in RL — <strong>training noise</strong>. Retrain the same algorithm
          with a different seed and you get a genuinely different policy, and the spread across those is often much
          wider than the spread across evaluation runs.
          <br /><br />
          Evaluating one lucky agent 100,000 times gives you a beautifully precise measurement of a fluke. So the
          protocol has two layers: <strong>train several seeds, evaluate each thoroughly, and report the spread
          across training seeds.</strong> Act 4 pins down how many seeds we need — and shows a comparison that
          reverses when you add error bars.
        </Callout>

        <h2>The protocol, locked</h2>
        <p>
          Written down now, obeyed for the rest of the capstone. Every number in Acts 3&ndash;6 is produced this
          way unless a page says otherwise <em>and says why</em>:
        </p>
        <ul>
          <li><strong>Metric:</strong> mean undiscounted return per episode, plus delivered %, spills, steps.</li>
          <li><strong>Start:</strong> the dock, empty-handed. <strong>Cap:</strong> 250 steps.</li>
          <li><strong>Action selection:</strong> greedy (<M>{String.raw`\varepsilon = 0`}</M>) unless stated.</li>
          <li><strong>Episodes:</strong> 2,000 for headline numbers, with a fixed evaluation seed.</li>
          <li><strong>Training seeds:</strong> multiple, disjoint from the evaluation seed, with the spread reported.</li>
        </ul>
        <p>
          Writing this before we have a favourite algorithm is the whole point. Once you have a result you like,
          every knob in the protocol becomes a temptation, and each individual adjustment will feel reasonable at
          the moment you make it.
        </p>

        <TransferBox accent={OLIVE}>
          On your next RL project, write the evaluation protocol into the repo before the first agent trains, and
          make it a function every experiment calls rather than a block of code each script copies. Then check the
          noise floor: measure one fixed policy several times and confirm the spread is small compared with the
          differences you plan to claim. If it is not, you do not have a result yet — you have a sample.
        </TransferBox>

        <PlaybookRule n={7} accent={OLIVE}>
          <strong>Design and freeze the evaluation harness before training</strong> — metric, start state,
          truncation cap, exploration setting, episode count, seeds. Then verify its noise floor is well below the
          effect sizes you intend to report.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/the-warehouse", label: <>← The warehouse field guide</> }}
          next={{ href: "/learn/warehouse-robot-capstone/baselines", label: <>Next up · Baselines: the number to beat →</> }}
        />
      </div>
    </article>
  );
}

const codeEps = `V, PI = dp_solve(); pol = lambda s: PI[s]      # one fixed policy, measured four ways
print("evaluation eps |   return  delivered  spills   steps")
for eps in (0.0, 0.02, 0.05, 0.10):
    r = evaluate(pol, n=2000, seed=5, eps=eps)
    print("%14.2f | %8.2f %9.1f%% %7.3f %7.1f" % (eps, r["ret"], r["delivered"]*100, r["spills"], r["steps"]))`;

const codeNoise = `V, PI = dp_solve(); pol = lambda s: PI[s]
print("episodes |   mean    sd across 15 independent evaluations")
for n in (20, 100, 500):
    ms = [evaluate(pol, n=n, seed=100 + i)["ret"] for i in range(15)]
    print("%8d | %6.2f    %5.2f" % (n, float(np.mean(ms)), float(np.std(ms))))`;
