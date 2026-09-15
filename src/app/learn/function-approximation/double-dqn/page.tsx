import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { MaxBiasLab } from "@/components/labs/MaxBiasLab";

export const metadata = {
  title: "Double DQN — Manifold",
  description:
    "DQN predicts a return of 122.11 on a task where 99.3 is the physical maximum — it believes in a future that cannot happen. Splitting the max into choose-and-score fixes the calibration completely (gaps within 2.5 across five seeds), though on CartPole it does not demonstrably improve the score.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DoubleDQN() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 11 minutes"
        title={<>Double DQN</>}
        intro={<>The agent from the last page balances the pole for 360 steps, which looks like success. Ask it
          what it expects to score and it names a number that the task makes physically impossible. The bug is in
          a single symbol of the update, and you have met it before.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The maximum of noisy estimates is biased</h2>
        <p>
          The Learning track met this as{" "}
          <Link href="/learn/learning/maximization-bias" style={link}>maximization bias</Link>, with a tabular
          fix called Double Q-learning. The argument survives intact with a network in place of the table, and it
          takes one line.
        </p>

        <Proof title="Why max over estimates overshoots max over truths">
          <p>
            <strong>Step 1 — the estimates are noisy.</strong> Write{" "}
            <M>{String.raw`\hat q(s,a) = q(s,a) + \epsilon_a`}</M>, where <M>{String.raw`\epsilon_a`}</M> is
            estimation error with mean zero for each action. Nothing here assumes the network is bad — only that
            it is not exact.
          </p>
          <p>
            <strong>Step 2 — take the max.</strong> The target uses{" "}
            <M>{String.raw`\max_a \hat q(s,a) = \max_a\,\big(q(s,a) + \epsilon_a\big)`}</M>.
          </p>
          <p>
            <strong>Step 3 — apply Jensen.</strong> The maximum is a convex function of its arguments, so the
            expectation of the max is at least the max of the expectations:
          </p>
          <MathBlock>{String.raw`\mathbb{E}\big[\max_a (q(s,a) + \epsilon_a)\big] \;\ge\; \max_a\, \mathbb{E}\big[q(s,a) + \epsilon_a\big] \;=\; \max_a q(s,a)`}</MathBlock>
          <p>
            <strong>Step 4 — see the mechanism, not just the inequality.</strong> The <M>{String.raw`\max`}</M>{" "}
            selects whichever action got the luckiest error, so selection and evaluation use the same noisy
            numbers. The overestimate is then <em>bootstrapped into the next target</em>, so it does not average
            out over time — it compounds.
          </p>
          <p>
            <strong>Step 5 — the fix.</strong> Use two estimators: let one <em>choose</em> the action and the
            other <em>score</em> it. The luck that made an action look best in the first estimator is unrelated to
            the second estimator&rsquo;s error, so it no longer feeds itself. DQN already has a second network
            lying around — the frozen target copy:
          </p>
          <MathBlock>{String.raw`y^{\text{DQN}} = r + \gamma\,\hat q\big(s', \textstyle\arg\max_{a'} \hat q(s',a',\mathbf{w}^-),\, \mathbf{w}^-\big) \;\longrightarrow\; y^{\text{Double}} = r + \gamma\,\hat q\big(s', \textstyle\arg\max_{a'} \hat q(s',a',\mathbf{w}),\, \mathbf{w}^-\big)`}</MathBlock>
          <p>
            The online network picks; the target network prices. That is the entire change.
          </p>
        </Proof>

        <h2>Catching it in the act</h2>
        <p>
          Overestimation is easy to state and easy to hand-wave, so here is a test with no wiggle room. With{" "}
          <M>{String.raw`\gamma = 0.99`}</M> and episodes capped at 500 steps of <M>+1</M> reward, the largest
          discounted return that <em>can physically exist</em> is
        </p>
        <MathBlock>{String.raw`\sum_{t=0}^{499} 0.99^t = \frac{1 - 0.99^{500}}{0.01} = 99.3`}</MathBlock>
        <p>
          So ask each trained agent what it predicts at the start state, then let it play and record what it
          actually gets. Any prediction above 99.3 is not optimism, it is arithmetic that cannot come true.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The DQN from the last page balances for ~360 steps. What does it predict its return will be,
            against a hard ceiling of 99.3?</>}
          options={["Below 99.3 — it is slightly pessimistic", "Just about 99.3", "Above the ceiling", "Far below — it undervalues itself"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`a perfect 500-step episode is worth 99.3, so no honest Q may exceed it

   agent          predicts  actually gets  overestimate
   DQN              107.96          94.05        +13.91
   Double DQN        96.95          99.34         -2.39`}</CodeOutput>

        <p>
          <strong>107.96.</strong> The network is confidently forecasting a return that no possible episode of
          CartPole can deliver — nearly 9% above a hard ceiling — while actually collecting 94.05. Double DQN,
          same seed, same budget, predicts <strong>96.95</strong> and collects <strong>99.34</strong>. It is
          slightly <em>pessimistic</em>, which is the harmless direction to be wrong in: nothing compounds when
          you undersell yourself.
        </p>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Run the same cell under CPython and DQN reports 122.11 against an actual 83.38 — the build-to-build
          chaos described on the{" "}
          <Link href="/learn/function-approximation/experience-replay" style={link}>replay page</Link>. The
          digits move; the sign does not. In both environments DQN forecasts a return above the maximum the task
          can pay, and Double DQN does not.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Raise the number of runs and watch both estimates. Every action here is
            genuinely worth zero, there is no function approximation and no replay buffer — just a
            tabular problem and an agent taking the maximum over noisy estimates of equal things.</>}
          insight={<>The gap you are looking at is maximisation bias with everything else removed.
            Q-learning&rsquo;s estimate sits above zero because <M>{String.raw`\max`}</M> of several
            noisy zeros is reliably positive; the double estimator uses one set of samples to pick
            the action and a different set to value it, and lands near zero. Double DQN is precisely
            this fix, with the online and target networks playing the two roles — which is why it
            costs nothing extra in a system that already has both.</>}
        >
          <MaxBiasLab />
        </LabFrame>

        <h2>What holds up across seeds, and what doesn&rsquo;t</h2>
        <p>
          Seed 0 is the most dramatic of the five we ran, and this track has a rule about that
          (<code>scripts/fa_cases.py ch5</code>):
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>5 seeds, 300 episodes</th><th style={thR}>mean gap</th>
                <th style={thR}>per-seed gaps</th><th style={thR}>last-50 steps</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>DQN</td><td style={tdR}>+8.41</td>
                <td style={tdR}><span style={{ color: "var(--bad)" }}>38.7</span> / 0.3 / −1.7 / 6.5 / −1.8</td>
                <td style={tdR}>360.4 ± 55.6</td>
              </tr>
              <tr>
                <td style={td}>Double DQN</td><td style={{ ...tdR, fontWeight: 600 }}>−0.38</td>
                <td style={tdR}>0.2 / −2.5 / −0.8 / −0.1 / 1.3</td>
                <td style={tdR}>418.6 ± 66.4</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Two honest readings, pulling in different directions.
        </p>
        <p>
          <strong>The calibration result is real.</strong> Double DQN&rsquo;s gap stays within 2.5 on every single
          seed — it never lies to you by much. DQN is usually fine and occasionally catastrophic: three of its
          seeds are within 2, one is +6.5, and one is <strong>+38.7</strong>. That is the signature of a failure
          mode, not of noise, and an agent whose value estimates are unreliable in an unpredictable way is
          dangerous precisely when you are using those estimates to decide something.
        </p>
        <p>
          <strong>The performance result is not.</strong> Double DQN averages 418.6 steps against 360.4, which
          looks like a clear win — but the standard deviation of that difference across seeds is{" "}
          <strong>93.1</strong>, comfortably larger than the 58.2 gap. On CartPole we cannot claim Double DQN
          balances the pole better. It fixes the numbers the agent reports, and on this task that does not
          translate into a score we can measure.
        </p>

        <Callout color={GOLD} title={<>Why fix a bias that did not cost you the score?</>}>
          Because the score is not always what you are buying. Overestimated values propagate through
          bootstrapping into every state that leads to the overvalued one, so on harder problems they distort the
          policy itself rather than just the reported numbers — that is what the original Double DQN paper
          measured across Atari. And whenever you use <M>{String.raw`\hat q`}</M> for anything besides an argmax
          — deciding when to stop training, comparing two agents, estimating risk before deployment — a value
          function that quietly exceeds the physically possible maximum is a broken instrument.
          <br /><br />
          It also costs essentially nothing: one extra forward pass through the online network, and no new
          hyperparameters. Cheap insurance with a measurable effect on calibration is worth taking even when the
          headline number does not move.
        </Callout>

        <p>
          That completes the DQN family as far as this track goes. What remains is the skill that every result on
          the last five pages depended on: reading these learning curves without fooling yourself.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/dqn-assembled", label: <>← DQN, assembled</> }}
          next={{ href: "/learn/function-approximation/reading-a-learning-curve", label: <>Next · Reading a learning curve that lies →</> }}
        />
      </div>
    </article>
  );
}

const code = `gamma = 0.99
best_possible = (1 - gamma ** 500) / (1 - gamma)
print(f"a perfect 500-step episode is worth {best_possible:.1f}, so no honest Q may exceed it\\n")

def predicted_vs_actual(q, n=20):
    pred, actual = [], []
    for k in range(n):
        env = CartPole(10000 + k); s = env.reset()
        pred.append(float(np.max(q.forward(s[None])[0])))
        g, disc, done, t = 0.0, 1.0, False, 0
        while not done and t < 500:
            s, r, done = env.step(int(np.argmax(q.forward(s[None])[0])))
            g += disc * r; disc *= gamma; t += 1
        actual.append(g)
    return np.mean(pred), np.mean(actual)

print(f"   {'agent':12s} {'predicts':>10} {'actually gets':>14} {'overestimate':>13}")
for double, label in ((False, "DQN"), (True, "Double DQN")):
    q, L = train_cartpole_dqn(episodes=300, double=double, seed=0)
    p, a = predicted_vs_actual(q)
    print(f"   {label:12s} {p:10.2f} {a:14.2f} {p - a:+13.2f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
