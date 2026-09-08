import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The safety trade-off — Manifold",
  description:
    "This warehouse has two good policies: a risky one through the doorway (21.2) and a safe one around the bypass (16.4). Which one an agent learns is a lottery decided by its random seed — and the textbook claim that SARSA reliably picks the safe route does not survive contact with the data.",
};

const OLIVE = "var(--c-warehouse)";

export default function TheSafetyTradeoff() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 3 · Learn it", color: "var(--c-metrics)" }]}
        time="about 12 minutes"
        title={<>The safety trade-off</>}
        intro={<>
          This is the capstone&rsquo;s second hard truth, and it arrives with a twist. There genuinely is a
          safe-versus-risky trade-off baked into this floor. But when we test the famous claim about which
          algorithm resolves it, the warehouse refuses to cooperate — and the honest result is more useful than the
          tidy one.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion accent={OLIVE} label="The engineer's question" icon="🤖">
          My problem has more than one good policy, differing in how much risk they accept. Does my choice of
          algorithm decide which one I get — and how would I actually know?
        </AnalystQuestion>

        <h2>Two good policies, not one</h2>
        <p>
          Recall the floor: the spill wall has a short <strong>doorway</strong> flanked by hazards and a longer,
          clear <strong>bypass</strong>. That geometry gives the warehouse two genuinely sensible policies, and we
          can price both exactly — the risky one is just the optimal policy; the safe one is what you get if you
          solve a world where spills are unthinkable, then score it on the real reward.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeBasins} />
        <CodeOutput>{`basin        |  return   spills   steps
risky (door) |   21.21  0.138    24.6
safe (bypass)|   16.44  0.000    33.6`}</CodeOutput>
        <p>
          These are the two attractors. The risky policy takes the doorway, saves nine steps, and pays for it with
          about one spill every seven episodes — netting <strong>21.21</strong>. The safe policy never goes near a
          hazard and scores <strong>16.44</strong>. On the reward we wrote, <em>the risky policy is
          better</em> — the doorway&rsquo;s time saving outweighs its spills. Hold onto that; it is the whole twist.
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="Textbook lore says on-policy SARSA learns the safe route and off-policy Q-learning the risky one. If that holds here, which scores higher on our reward?"
          options={[
            "Q-learning — it takes the doorway, and here the doorway genuinely pays",
            "SARSA — the safe route is always the better choice near hazards",
            "They tie — both converge to the optimal policy eventually",
          ]}
          nudge="If the lore held, Q-learning would win here — because on this reward the 'reckless' route is the correct one. But before crowning it, we have to check whether the lore holds at all. It doesn't."
        />

        <h2>The result is a lottery, not a ranking</h2>
        <p>
          Here is the experiment that matters, and the one a single training run cannot show you. Train each
          algorithm ten times, changing only the random seed, and evaluate each greedy policy. If the algorithm
          decides the route, the ten scores for each method should cluster. They do not.
        </p>

        <CodeBlock fromScratch={codeSweep} />
        <CodeOutput>{`10 seeds each, 15000 episodes, greedy return (produced by rl_capstone_cases.py)

Q-learning   :  -3.3  16.3  21.1  21.2  20.9  21.0  21.0  20.9  21.0  16.4    risky 7/10
SARSA        :  21.3  16.4  -3.2  20.9  21.0  20.7  16.6  21.1  21.1  16.8    risky 6/10
Exp. SARSA   :  21.0  16.4  16.5  16.4  16.4  21.0  21.2  16.4  21.1  21.0    risky 5/10`}</CodeOutput>
        <p>
          Read across any row. The scores are not scattered — they pile up at exactly two values,{" "}
          <strong>~21</strong> (found the doorway) and <strong>~16.4</strong> (settled for the bypass), with the
          occasional <strong>~−3</strong> where the agent converged on something outright broken. Each run lands in
          one basin or another depending on nothing but its seed — on whether early exploration happened to have a
          good or bad time near the doorway before the values hardened.
        </p>
        <p>
          And now the textbook claim. The lore says SARSA should sit in the safe basin and Q-learning in the risky
          one. In the data, <strong>Q-learning takes the risky route 7 times in 10 and SARSA 6 times in 10</strong> —
          a difference indistinguishable from noise at this sample size. Both are bimodal; both occasionally break;
          neither reliably owns a route. On this warehouse, the celebrated on-policy/off-policy safety distinction
          is <em>not visible above the seed-to-seed variation.</em>
        </p>

        <Callout color={OLIVE} title={<>Why we are telling you the effect isn't here</>}>
          The famous demonstration of this distinction is Sutton &amp; Barto&rsquo;s <em>cliff walking</em>, where
          SARSA visibly learns a safe detour and Q-learning walks the cliff edge. It is a real effect in that
          environment. It is tempting to re-tell it here with our doorway standing in for the cliff — the story
          writes itself, and you would probably believe it.
          <br /><br />
          But we ran it, ten seeds per algorithm, and it did not reproduce: the route an agent learns is dominated
          by <em>which seed it got</em>, not which update rule. Reporting the tidy story anyway would have been the
          exact error this capstone keeps warning about — writing the claim you expected instead of the one the
          numbers support. The cliff effect needs a sharper penalty structure and a narrower safe margin than our
          warehouse has. The honest headline is: <strong>here, the algorithm barely moves the outcome; the seed
          does.</strong>
        </Callout>

        <h2>So where <em>is</em> the trade-off?</h2>
        <p>
          It is real, but it does not live where the lore puts it. It lives in three places worth separating:
        </p>
        <ul>
          <li>
            <strong>In the reward, not the algorithm.</strong> Whether the doorway or the bypass is &ldquo;correct&rdquo;
            was decided back in Act 1 when we priced a spill at <M>{String.raw`-30`}</M> and a step at{" "}
            <M>{String.raw`-1`}</M>. Raise the spill penalty and the safe basin becomes the better one; the learning
            algorithm has no say in it.
          </li>
          <li>
            <strong>In exploration, not the update rule.</strong> The reason an agent gets <em>stuck</em> in the
            worse basin is that fixed-<M>\varepsilon</M> exploration, after a few unlucky spills near the doorway,
            stops probing it hard enough to discover it was fine. That is an exploration failure, and it is exactly
            what Act 4 is about — a decaying schedule and optimistic initialisation both raise the odds of finding
            the better basin.
          </li>
          <li>
            <strong>In variance, where Expected SARSA does help.</strong> Look again at its row: no broken run, and
            the fewest spills per episode of the three (it carried 0.05 against Q&rsquo;s 0.12 in the full sweep).
            Lower-variance updates do not change which basins exist, but they make the catastrophic{" "}
            <strong>−3</strong> outcome far less likely. That is a genuine, reproducible safety benefit — just not
            the one the textbook advertises.
          </li>
        </ul>

        <h2>What this changes about how you work</h2>
        <p>
          The practical lesson is severe and general: <strong>a single training run tells you almost nothing about
          an RL algorithm.</strong> Every per-page number in Act 3 so far came from seed 0, and each looked like a
          clean success — 21.21, 20.84, 20.97. Not one of them hinted that seed 0 of Q-learning at a longer horizon
          collapses to <M>{String.raw`-3`}</M>, or that a third of runs quietly settle for a policy worth a quarter
          less. Had we shipped a verdict on one run each, we would have shipped a fiction with a straight face.
        </p>
        <p>
          The fix is not subtle and it is not optional: run several seeds, plot the distribution, and report its
          spread — not its best member, and not one arbitrary member. When someone shows you an RL result as a
          single number, the correct first question is always <em>&ldquo;over how many seeds, and what was the
          spread?&rdquo;</em>
        </p>

        <TransferBox accent={OLIVE}>
          Before believing any RL comparison, ask how many seeds it averaged and how wide the outcomes were. Treat
          a result as a <em>distribution</em>: identify the basins your agent falls into, count how often it lands
          in each, and note the failures. And when a textbook effect &ldquo;should&rdquo; appear in your problem,
          verify it does before you rely on it — the celebrated ones are real in their original setting and often
          invisible in yours.
        </TransferBox>

        <PlaybookRule n={13} accent={OLIVE}>
          <strong>Never trust one seed.</strong> An RL outcome is a distribution over runs, often multi-modal; train
          several seeds, report the spread and the failure rate, and locate a trade-off in the reward and the
          exploration schedule before attributing it to the update rule.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/expected-sarsa", label: <>← Expected SARSA</> }}
          next={{ href: "/learn/warehouse-robot-capstone/algorithm-comparison", label: <>Next up · Algorithm comparison →</> }}
        />
      </div>
    </article>
  );
}

const codeBasins = `# the two stable policies, priced exactly (no training -- this is the oracle both ways)
V, PI = dp_solve()
risky = evaluate(lambda s: PI[s], n=2000, seed=999)

_orig = SPILL
SPILL = -300.0                       # solve a world where a spill is unthinkable...
Vs, PIs = dp_solve()
SPILL = _orig                        # ...but score the resulting policy on the REAL reward
safe = evaluate(lambda s: PIs[s], n=2000, seed=999)

print("basin        |  return   spills   steps")
print("risky (door) | %7.2f  %.3f   %5.1f" % (risky["ret"], risky["spills"], risky["steps"]))
print("safe (bypass)| %7.2f  %.3f   %5.1f" % (safe["ret"], safe["spills"], safe["steps"]))`;

const codeSweep = `# Ten training seeds per algorithm, 15000 episodes each, then greedy evaluation.
# This is deliberately NOT run inline (30 x 15000 episodes is minutes in the browser);
# the exact loop lives in scripts/rl_capstone_cases.py and produced the table below.
for kind in ("q", "sarsa", "exp"):
    rets = []
    for seed in range(10):
        Q = train(kind, episodes=15000, seed=seed)
        rets.append(evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)["ret"])
    risky = sum(r > 18.5 for r in rets)
    print(kind, [round(r, 1) for r in rets], "risky %d/10" % risky)`;
