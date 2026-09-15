import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The first agent: Q-learning — Manifold",
  description:
    "The oracle needed the model. A learning agent has only samples — reset() and step() — and yet Q-learning reaches the oracle's ceiling in about a thousand episodes. One update rule, and the whole thing turns on replacing an expectation you cannot compute with a sample you can.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function QLearning() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 3 · Learn it", color: "var(--c-metrics)" }]}
        time="about 11 minutes"
        title={<>The first agent: Q-learning</>}
        intro={<>
          Everything so far has leaned on the oracle, which cheats: it reads the warehouse&rsquo;s hidden
          transition model. Our robot cannot. It can only <em>act and observe</em>. This is the page where it stops
          being told the answer and starts learning it — and, remarkably, reaches the same ceiling.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={3} n={10}>
          I do not have the transition probabilities — only the ability to try things and see what happens. What is
          the simplest update that turns that stream of experience into a good policy?
        </WorkOrder>

        <h2>The one equation the oracle could compute and we cannot</h2>
        <p>
          The oracle solved the Bellman optimality equation. For the action-value function it reads:
        </p>
        <MathBlock>{String.raw`Q^*(s,a) \;=\; \mathbb{E}\!\left[\, r + \gamma \max_{a'} Q^*(s',a') \,\right].`}</MathBlock>
        <p>
          Read it plainly: the value of taking <M>a</M> in <M>s</M> is the reward you get plus the discounted value
          of playing optimally forever after. The oracle could evaluate that expectation because it knew{" "}
          <M>{String.raw`P(s' \mid s,a)`}</M> — it could enumerate every <M>s'</M> and weight it. We know none of
          that. The whole of model-free RL is one idea for getting around it:{" "}
          <strong>you cannot compute the expectation, but every time you call <code>step()</code> you get a sample
          from it.</strong>
        </p>
        <p>
          So replace the expectation with the sample, and instead of solving for <M>{String.raw`Q`}</M> in one
          shot, nudge the current estimate a little way toward each sample as it arrives:
        </p>
        <MathBlock>{String.raw`Q(s,a) \;\leftarrow\; Q(s,a) \;+\; \alpha\,\big[\,\underbrace{r + \gamma \max_{a'} Q(s',a')}_{\text{sampled target}} \;-\; \underbrace{Q(s,a)}_{\text{old estimate}}\,\big].`}</MathBlock>
        <p>
          The bracket is the <strong>temporal-difference error</strong>: the gap between what we just saw and what
          we expected. The step size <M>\alpha</M> says how much to trust this one sample. That is Q-learning,
          complete. Two decisions in it are worth naming before we run it, because both come back later:
        </p>
        <ul>
          <li>
            The target uses <M>{String.raw`\max_{a'} Q(s',a')`}</M> — the value of the <em>best</em> next action,
            not the one the robot actually takes next. This is what makes Q-learning{" "}
            <strong>off-policy</strong>: it learns the value of acting optimally even while it wanders around
            exploring. The next page is entirely about that word.
          </li>
          <li>
            To learn, the robot must still <em>visit</em> state-action pairs. It acts <M>\varepsilon</M>-greedily —
            usually the current best action, occasionally a random one — so that it keeps sampling actions it does
            not yet believe in. Without that, it would lock onto its first decent idea and never discover better.
          </li>
        </ul>

        <Callout color={OLIVE} title={<>Why bootstrapping is allowed to work</>}>
          It should feel suspicious that the update improves <M>Q</M> by comparing it to a target{" "}
          <em>built from <M>Q</M> itself</em>. Pulling yourself up by your own estimates — &ldquo;bootstrapping&rdquo; —
          sounds circular. It works because the target contains one piece of <strong>real</strong> information the
          old estimate did not: the actual reward <M>r</M> just observed. Each update launders a little ground truth
          into the estimates, and provided every pair keeps getting visited and <M>\alpha</M> shrinks appropriately,
          the estimates provably converge to <M>{String.raw`Q^*`}</M>. We built the whole theory of this in the{" "}
          <Link href="/learn/learning/the-sampled-backup" style={link}>Learning track</Link>; here we get to watch
          it pay off on a real task.
        </Callout>

        <h2>The agent, in ten lines</h2>
        <p>
          Here is the entire learner. Note what it is <em>not</em> allowed to touch: no <code>dp_solve</code>, no{" "}
          <code>_transition</code>, no <M>P</M>. Only <code>reset</code> and <code>step</code>. And note{" "}
          <code>reset(&quot;uniform&quot;)</code> — we start training episodes from random states, not just the
          dock. That is a real decision with real consequences, and Act 5 has a whole page on why we were forced
          into it; for now, take it as &ldquo;make sure every state gets visited.&rdquo;
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={code} />
        <CodeOutput>{`episodes | greedy return | delivered
     100 |       -259.21 |    0.0%
     300 |       -220.18 |   20.3%
    1000 |         20.55 |  100.0%
    3000 |         20.65 |  100.0%
    6000 |         20.58 |  100.0%`}</CodeOutput>

        <PredictPrompt
          accent={OLIVE}
          prompt="After only 100 training episodes, the agent scores −259 and delivers nothing. Is it broken?"
          options={[
            "Yes — a working agent would show at least some deliveries by 100 episodes",
            "No — it simply hasn't stumbled onto a full delivery yet, so there's no +50 signal to propagate back through the values",
            "No, but it will never recover from such a bad start",
          ]}
          nudge="Locked in. Until the robot completes its first delivery by luck, the +50 has never been observed, so nothing in the Q-table knows the goal exists. The jump from episode 300 to 1000 is that signal finally propagating."
        />

        <h2>Reading the curve</h2>
        <p>
          The shape is the whole story of value-based RL. For the first hundred-odd episodes the robot has never
          once reached the dropoff carrying a package, so it has never observed the <M>{String.raw`+50`}</M>. Its
          entire world is step costs and spills, and it thrashes — <M>{String.raw`-259`}</M>, nothing delivered.
        </p>
        <p>
          Somewhere around episode 200&ndash;300, exploration blunders into a complete delivery. Now a single{" "}
          <M>{String.raw`+50`}</M> exists in the table, and every subsequent visit to a nearby state carries a
          little of it backward one step at a time. By episode 1,000 that signal has propagated across the whole
          floor and the greedy policy scores <strong>20.55</strong> — delivering 100% of packages. Against the
          oracle&rsquo;s <strong>21.21</strong>, a robot that started knowing <em>nothing</em> about the warehouse,
          and was never allowed to see its model, is now within a point of the best policy that model permits.
        </p>
        <p>
          After that it flattens. More episodes barely move the greedy score, which is the honest signature of a
          tabular problem that has essentially been solved. It is also a slight over-tidy picture — this is{" "}
          <em>one</em> run. Re-run it with a different seed and the ending is not always this clean, which is a
          hard truth we confront head-on two pages from now. For a first agent, though, this is exactly what
          success looks like: from <M>{String.raw`-259`}</M> to the ceiling, on samples alone.
        </p>

        <h2>What we actually built</h2>
        <p>
          It is worth appreciating how little there was. No neural network, no planner, no model of the warehouse —
          a table of numbers and one update rule applied to a stream of experience. The intelligence is not in any
          component; it is in the <em>process</em>, the slow laundering of observed rewards into an increasingly
          accurate map of what each move is worth. Everything from here is refinement: a different target (the next
          two pages), better exploration and step sizes (Act 4), and honest evaluation of what we have (Act 5).
        </p>

        <TransferBox>
          When you do not have a model, do not go looking for one — sample the expectation instead. The move that
          defines model-free RL is exactly this substitution of an observed transition for an expectation you
          cannot evaluate. And read learning curves for their <em>shape</em>: a flat, terrible start followed by a
          sharp rise usually means &ldquo;the reward signal was too sparse to find,&rdquo; not &ldquo;the algorithm
          is broken&rdquo; — a distinction that changes what you should do about it.
        </TransferBox>

        <PlaybookRule n={10}>
          <strong>When you lack a model, replace the Bellman expectation with sampled transitions</strong> and
          bootstrap: nudge each estimate toward <M>{String.raw`r + \gamma \max_{a'} Q(s',a')`}</M>. Keep exploring
          so every state-action pair is still visited, or the estimates you never update stay wrong.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/the-oracle", label: <>← The oracle</> }}
          next={{ href: "/learn/warehouse-robot-capstone/sarsa", label: <>Next up · SARSA →</> }}
        />
      </div>
    </article>
  );
}

const code = `def train_curve(kind, checkpoints, alpha=0.1, eps=0.1, seed=0):
    e = Warehouse(seed)
    Q = np.zeros((nS, nA))
    out = {}
    ep = 0
    while ep < max(checkpoints):
        s = e.reset("uniform")                     # exploring starts (Act 5 explains why)
        a = eps_greedy(Q, s, eps, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)                 # a SAMPLE from the hidden model
            if done:
                Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, eps, e.rng)
            target = r + GAMMA * Q[s2].max()         # off-policy: value of the BEST next action
            Q[s, a] += alpha * (target - Q[s, a])
            s, a = s2, a2
        ep += 1
        if ep in checkpoints:
            r = evaluate(lambda s: int(np.argmax(Q[s])), n=1000, seed=999)
            out[ep] = (r["ret"], r["delivered"])
    return out

curve = train_curve("q", {100, 300, 1000, 3000, 6000})
print("episodes | greedy return | delivered")
for ep in sorted(curve):
    print("%8d | %13.2f | %6.1f%%" % (ep, curve[ep][0], curve[ep][1] * 100))`;
