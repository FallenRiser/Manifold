import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The step size α — Manifold",
  description:
    "On a stochastic environment the learning rate is not a speed dial — it is a stability dial. Too small and learning crawls; too large and it never converges at all. At α=1 the warehouse agent goes broken 9 runs in 10; at α=0.02 it reaches the ceiling every time.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheStepSize() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 4 · Make it work", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>The step size α</>}
        intro={<>
          Act 3 ended with a lottery: the same algorithm, re-run, sometimes finds the best route and sometimes
          settles for a worse one or breaks outright. This act is about tuning that lottery away — and the first
          knob, the learning rate, turns out to be the difference between an agent that converges and one that
          never does.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={4} n={15}>
          How much should a single noisy sample move my estimate? Fast enough to learn in reasonable time, but not
          so fast that the estimates chase noise instead of settling on the truth.
        </WorkOrder>

        <h2>What α does to a noisy update</h2>
        <p>
          Every update nudges an estimate toward a target: <M>{String.raw`Q \leftarrow Q + \alpha\,[\text{target} - Q]`}</M>.
          On a <em>deterministic</em> problem you could set <M>{String.raw`\alpha = 1`}</M> and overwrite the
          estimate with each new target — every target is the truth, so trusting it fully is fine. Our warehouse is
          not deterministic. A 10% slip means the same state-action pair returns <em>different</em> outcomes on
          different visits: sometimes the move you asked for, sometimes a shove into a spill.
        </p>
        <p>
          With randomness in the returns, the step size becomes an <strong>averaging window</strong>. A small{" "}
          <M>\alpha</M> blends each new sample gently into a long running average, smoothing the noise. A large{" "}
          <M>\alpha</M> lets the latest sample dominate, so the estimate lurches toward whatever just happened —
          including the unlucky shoves. This is the{" "}
          <Link href="/learn/learning/what-td-converges-to" style={link}>step-size story from the Learning track</Link>,
          now with a delivery target attached to it.
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="We'll re-solve the warehouse at five learning rates, ten seeds each. What happens at α = 1.0, where each update completely overwrites the old estimate with the newest noisy sample?"
          options={[
            "Fastest and best — it learns immediately from every sample",
            "It never settles — the estimates are yanked around by slip forever, and most runs end up broken",
            "Identical to small α, just reached sooner",
          ]}
          nudge="Locked in. α=1 on a stochastic problem is not aggressive learning, it's amnesia — every update throws away everything learned so far in favour of one noisy draw. Watch it fail."
        />

        <h2>Ten seeds, five learning rates</h2>
        <p>
          The honest measurement is the one Act 3 taught us to demand: many seeds, and report the spread. We train
          ten seeds at each <M>\alpha</M> and count how many reach the good (risky-route, ~21) basin and how many
          break.
        </p>

        <CodeBlock fromScratch={codeSweep} />
        <CodeOutput>{`alpha | mean    median  risky/10  broken   (Q-learning, 15000 ep, fixed ε=0.1)
 0.02 | 21.09    21.03    10/10       0
 0.10 | 17.66    20.98     7/10       1
 0.30 | 16.49    16.42     0/10       0
 0.60 | 11.83    16.02     0/10       2
 1.00 | -133.82 -146.32    1/10       9`}</CodeOutput>
        <p>
          This is one of the cleanest results in the whole capstone, and it runs against a common instinct. The{" "}
          <em>smallest</em> step size is the best: <M>{String.raw`\alpha = 0.02`}</M> reaches the ceiling on all
          ten seeds. As <M>\alpha</M> grows, things get worse, not faster — and past a point they collapse:
        </p>
        <ul>
          <li><strong>α = 0.02:</strong> 10/10 at the ceiling. Slow per step, but it averages the noise away and the greedy policy it produces is trustworthy.</li>
          <li><strong>α = 0.30:</strong> every run now lands in the <em>safe</em> basin (16.4). The doorway&rsquo;s value estimate is too jittery to reliably beat the bypass, so the agent keeps retreating to the route with no noise near it.</li>
          <li><strong>α = 1.00:</strong> nine runs in ten are broken, mean <M>{String.raw`-134`}</M>. Each update erases the past for one sample; the estimates never converge, and the greedy policy read off them is garbage.</li>
        </ul>
        <p>
          Notice that <M>{String.raw`\alpha = 0.02`}</M> being 10/10 is <strong>a second cure for Act 3&rsquo;s
          lottery</strong> — the seed-to-seed variation at <M>{String.raw`\alpha = 0.1`}</M> was partly just too
          large a step size. Lower the noise in the updates and the good route stops being a coin flip.
        </p>

        <h2>Watching it happen, live</h2>
        <p>
          Averages over seeds tell you the outcome; a learning curve tells you the <em>character</em> of each
          failure. Here is a single run at three learning rates, evaluated greedily as it trains.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeCurve} />
        <CodeOutput>{`alpha |    200      600     1500     3000     6000   (greedy return)
 0.05 | -263.11    9.09   20.59   20.59   21.08
 0.20 | -223.18   14.75   16.22   16.18   16.34
 0.80 |  -45.54  -46.90   -1.97   -4.52   -1.14`}</CodeOutput>
        <p>
          Three completely different personalities. At <M>{String.raw`\alpha = 0.05`}</M> the agent climbs steadily
          and <em>locks in</em> at the ceiling — 20.59, then 21.08, and it would stay there. At{" "}
          <M>{String.raw`\alpha = 0.20`}</M> it actually learns <em>faster</em> at first (14.75 by episode 600
          against 9.09) but settles into the safe basin at 16.3 and never escapes — speed bought at the price of
          the better solution. At <M>{String.raw`\alpha = 0.80`}</M> it never converges at all: the score bounces
          between <M>{String.raw`-1`}</M> and <M>{String.raw`-47`}</M> with more training, because each pass of
          updates undoes the last.
        </p>

        <Callout color={OLIVE} title={<>Why decreasing α is the theoretically right answer</>}>
          There is a real tension here: you want a large step early (to learn fast when every estimate is wrong) and
          a small step late (to average out noise once you are near the truth). The classical resolution is to make{" "}
          <M>\alpha</M> <em>decrease over time</em>. The Robbins&ndash;Monro conditions say a schedule converges to
          the true values if <M>{String.raw`\sum_t \alpha_t = \infty`}</M> (the steps never shrink so fast that you
          stop moving) and <M>{String.raw`\sum_t \alpha_t^2 < \infty`}</M> (they shrink fast enough to kill the
          noise). A constant <M>\alpha</M> satisfies the first and fails the second — which is exactly why the
          constant-<M>\alpha</M> curves above wobble near their answer instead of settling on it exactly. In
          practice a small constant step is often good enough, as <M>{String.raw`\alpha = 0.02`}</M> shows; when it
          is not, anneal it.
        </Callout>

        <TransferBox>
          On a stochastic problem, treat the learning rate as a stability control, not a speed control. Start
          smaller than feels necessary and only raise it if learning is genuinely too slow — and if it must be
          large early, decay it. When an agent&rsquo;s scores wobble or diverge with <em>more</em> training rather
          than converging, suspect the step size before anything else.
        </TransferBox>

        <PlaybookRule n={15}>
          <strong>Treat α as a stability dial on stochastic problems: small enough to average out noise, decayed
          over time (Robbins&ndash;Monro) when you need speed early.</strong> Too large a step does not merely slow
          convergence — past a point it destroys it.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/algorithm-comparison", label: <>← Algorithm comparison</> }}
          next={{ href: "/learn/warehouse-robot-capstone/exploration-schedule", label: <>Next up · The exploration schedule →</> }}
        />
      </div>
    </article>
  );
}

const codeSweep = `# Produced by scripts/rl_capstone_cases.py (10 seeds x 15000 episodes is minutes
# in the browser, so this table is precomputed; the loop is the one below).
for alpha in (0.02, 0.10, 0.30, 0.60, 1.00):
    rets = []
    for seed in range(10):
        Q = train("q", alpha=alpha, episodes=15000, seed=seed)
        rets.append(evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)["ret"])
    risky  = sum(r > 18.5 for r in rets)
    broken = sum(r < 0    for r in rets)
    print(alpha, np.mean(rets), np.median(rets), "%d/10" % risky, broken)`;

const codeCurve = `def train_curve(alpha, checkpoints, eps=0.1, seed=0, episodes=6000):
    e = Warehouse(seed); Q = np.zeros((nS, nA)); out = {}
    for ep in range(episodes):
        s = e.reset("uniform"); a = eps_greedy(Q, s, eps, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)
            if done:
                Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, eps, e.rng)
            Q[s, a] += alpha * (r + GAMMA * Q[s2].max() - Q[s, a])
            s, a = s2, a2
        if (ep + 1) in checkpoints:
            out[ep + 1] = evaluate(lambda s: int(np.argmax(Q[s])), n=1000, seed=999)["ret"]
    return out

CP = (200, 600, 1500, 3000, 6000)
print("alpha |    200      600     1500     3000     6000   (greedy return)")
for alpha in (0.05, 0.2, 0.8):
    c = train_curve(alpha, set(CP), seed=0)
    print(" %.2f |" % alpha, " ".join("%7.2f" % c[e] for e in CP))`;
