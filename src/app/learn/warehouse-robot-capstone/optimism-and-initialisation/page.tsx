import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Optimism and initialisation — Manifold",
  description:
    "The number you fill the Q-table with is a hyperparameter. Initialise it optimistically — above every true value — and the agent explores systematically without any randomness, because every untried action still looks better than the ones it has tested. It works here, but it is finicky, and the honest sweep shows why.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function OptimismAndInitialisation() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 4 · Make it work", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Optimism and initialisation</>}
        intro={<>
          We have started every agent with a Q-table full of zeros, as if that were the natural, neutral choice. It
          is neither. The value you seed the table with is a hyperparameter — and choosing it optimistically buys
          you exploration for free, without a single random action.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={4} n={17}>
          What am I telling the agent to believe before it has seen anything — and could that prior belief do some
          of my exploration for me?
        </WorkOrder>

        <h2>Zero is not neutral</h2>
        <p>
          Initialising <M>{String.raw`Q = 0`}</M> is a claim: &ldquo;before any experience, I expect every
          state-action pair to be worth zero.&rdquo; On this warehouse that is <em>pessimistic</em> — the true
          values range up past <M>{String.raw`+20`}</M>. The consequence is subtle. When the agent takes a real
          step, the step cost of <M>{String.raw`-1`}</M> makes the action it just tried look <em>worse</em> than the
          untried ones still sitting at zero — so, greedily, it drifts toward whatever it hasn&rsquo;t done yet. A
          little accidental exploration, but an unreliable amount, and it fades as values fill in.
        </p>
        <p>
          Now invert it. Initialise the table <strong>optimistically</strong> — say <M>{String.raw`Q = +50`}</M>,
          above the best achievable value anywhere. Every action starts out looking wonderful. The moment the agent
          tries one, its estimate drops toward reality, and now the <em>untried</em> actions — still sitting at the
          inflated +50 — look best by comparison. So a purely greedy agent is compelled to work through every action
          in every state it reaches, because &ldquo;the ones I haven&rsquo;t tried&rdquo; always win until they
          too are tested. <strong>Optimism turns greed into systematic exploration.</strong>
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="Seed 4 broke under vanilla settings (Q=0, ε=0.1): −248, 1% delivered. We keep ε=0.1 but initialise Q=+50 instead of 0. What happens?"
          options={[
            "No change — initialisation washes out after a few updates",
            "It reaches the ceiling — optimism forces the agent to try the doorway route thoroughly before giving up on it",
            "It gets worse — starting with wrong values can only hurt",
          ]}
          nudge="Locked in. The same seed that broke is rescued a second way — first annealing did it, now optimism. Both work by guaranteeing the good route gets explored."
        />

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeContrast} />
        <CodeOutput>{`q0 =  0  (neutral)    : return  -248.34   delivered   1.1%
q0 = 50  (optimistic) : return    21.05   delivered 100.0%`}</CodeOutput>
        <p>
          The identical broken seed, rescued to the ceiling by one number — the value the table starts at. No change
          to the algorithm, the step size, or the exploration rate. Optimism drove the agent to keep trying the
          doorway route until it had genuinely learned its value, instead of abandoning it after two unlucky spills.
        </p>

        <h2>But it is finicky — the honest sweep</h2>
        <p>
          It would be easy to stop there and sell optimism as a clean win. The ten-seed sweep says otherwise, and
          the caveat matters more than the headline.
        </p>

        <CodeBlock fromScratch={codeSweep} />
        <CodeOutput>{`q0     | mean    risky/10  broken   (Q-learning, ε=0.1, 15000 ep)
   0   | 17.66     7/10       1
 +25   | 13.90     7/10       1     <- one run collapsed to -41.6
 +50   | 20.10     8/10       0`}</CodeOutput>
        <p>
          Full optimism (<M>{String.raw`+50`}</M>) is a real improvement over zero: no broken runs, mean up to
          20.10. But <em>half</em>-optimism (<M>{String.raw`+25`}</M>) is <strong>worse than zero</strong> — mean
          13.90, with one run collapsing to <M>{String.raw`-41.6`}</M>. That is not noise; it is the mechanism
          biting back. At <M>{String.raw`+25`}</M> the initial value is above <em>some</em> true values but below
          others, so it drives thorough exploration of the cheap regions while making the genuinely high-value
          delivery route look, briefly, no better than average — and an unlucky run can lock onto the wrong thing
          before optimism has finished doing its job.
        </p>
        <p>
          The rule that falls out of this is precise: <strong>optimism only works cleanly when the initial value
          exceeds every true value.</strong> Set it above the maximum achievable return and it guarantees every
          action is tried before being dismissed. Set it partway — a &ldquo;mildly encouraging&rdquo; number picked
          by feel — and you get the worst of both, biased exploration with no guarantee. This is the same trap as
          naive reward shaping two acts ago: a well-meaning number, chosen without checking it against the scale of
          the true values, quietly changes what the agent does.
        </p>

        <Callout color={OLIVE} title={<>Optimism vs annealing — two routes to the same place</>}>
          Notice we have now cured Act 3&rsquo;s lottery <em>three</em> ways: a smaller step size, an annealed
          <M>\varepsilon</M>, and optimistic initialisation. They are not redundant — they attack the same disease
          (insufficient early exploration of the good route) from different angles, and they compose. Optimism has
          one lovely property the others lack: it needs <em>no randomness at all</em>. A purely greedy agent with
          an optimistic table explores systematically and deterministically, which makes runs reproducible and
          avoids paying the exploration tax at hazards on every step. Its weakness is the one we just saw — it
          demands you know roughly how large the true values are, and it does its exploring only once, at the
          start, so it cannot recover if the environment changes later. Annealing keeps a trickle of exploration
          alive; optimism front-loads all of it. Real systems often use both.
        </Callout>

        <TransferBox>
          Treat the initial value as a hyperparameter, not a default. If you want exploration without randomness,
          initialise optimistically — but set the optimistic value <em>above the maximum achievable return</em>, or
          you get biased exploration that can do more harm than good. And remember optimism explores only once, at
          the start: for a non-stationary problem, keep some ongoing exploration too.
        </TransferBox>

        <PlaybookRule n={17}>
          <strong>Initialise optimistically to get systematic, randomness-free exploration — but only above the
          maximum true value.</strong> A partway-optimistic start can be worse than a neutral one, and optimism
          explores only at the beginning, so pair it with ongoing exploration when the world can change.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/exploration-schedule", label: <>← The exploration schedule</> }}
          next={{ href: "/learn/warehouse-robot-capstone/tuning-protocol", label: <>Next up · Tuning without fooling yourself →</> }}
        />
      </div>
    </article>
  );
}

const codeContrast = `def train(episodes=6000, alpha=0.1, eps=0.1, q0=0.0, seed=0):
    e = Warehouse(seed)
    Q = np.full((nS, nA), q0)                            # the initial belief -- a hyperparameter
    for ep in range(episodes):
        s = e.reset("uniform"); a = eps_greedy(Q, s, eps, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)
            if done:
                Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, eps, e.rng)
            Q[s, a] += alpha * (r + GAMMA * Q[s2].max() - Q[s, a])
            s, a = s2, a2
    return Q

for label, q0 in (("q0 =  0  (neutral)   ", 0.0), ("q0 = 50  (optimistic)", 50.0)):
    Q = train(seed=4, q0=q0)                             # seed 4 broke under q0=0
    r = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
    print("%s : return %8.2f   delivered %5.1f%%" % (label, r["ret"], r["delivered"] * 100))`;

const codeSweep = `# 10 seeds x 15000 episodes per q0 — precomputed in scripts/rl_capstone_cases.py.
for q0 in (0.0, 25.0, 50.0):
    rets = [evaluate(lambda s: int(np.argmax(train("q", q0=q0, seed=sd)[s])),
                     n=2000, seed=999)["ret"] for sd in range(10)]
    print(q0, np.mean(rets), "%d/10" % sum(r > 18.5 for r in rets), sum(r < 0 for r in rets))`;
