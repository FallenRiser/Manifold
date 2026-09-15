import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The exploration schedule — Manifold",
  description:
    "The basin lottery from Act 3 was an exploration failure in disguise. A fixed ε explores the same tiny amount forever; annealing from high to low ε — explore hard early, exploit once you know the map — turns 7 good runs in 10 into 10 in 10.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ExplorationSchedule() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 4 · Make it work", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>The exploration schedule</>}
        intro={<>
          The lottery that ended Act 3 — good route or bad route, decided by luck — was never really about the
          algorithm. It was about exploration. A robot that stops probing the doorway after a couple of early
          spills never learns the doorway was fine. Fix <em>when</em> it explores, and the lottery mostly goes
          away.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={4} n={16}>
          Am I exploring the right amount at the right time — enough early to discover every option, little enough
          late that I actually exploit what I learned?
        </WorkOrder>

        <h2>The problem with a constant ε</h2>
        <p>
          Everything in Act 3 used <M>{String.raw`\varepsilon = 0.1`}</M>, fixed, start to finish. That single
          choice is doing two contradictory jobs badly. Early on, when the Q-table is all zeros and the agent knows
          nothing, 10% random is <em>too little</em> exploration — it takes forever to stumble through the doorway
          enough times to learn it. Late on, when the agent has a good policy, 10% random is <em>too much</em> — one
          action in ten is a needless dice roll, and near the spill wall those rolls are expensive.
        </p>
        <p>
          Worse, a fixed <M>\varepsilon</M> can get an agent <em>stuck</em>. Suppose early exploration blunders into
          the doorway, slips, and eats a couple of spills. The doorway&rsquo;s value drops; the agent starts
          preferring the bypass; and now it visits the doorway only on the rare 10% random step — not often enough
          to discover that the spills were unlucky and the doorway is actually the better route. The bad estimate
          becomes self-fulfilling. That is precisely the &ldquo;safe basin&rdquo; trap from Act 3.
        </p>

        <h2>Explore hard early, exploit late</h2>
        <p>
          The fix is to make <M>\varepsilon</M> a <em>schedule</em>, not a constant: start high — even 1.0, pure
          exploration — and <strong>anneal</strong> it down toward near-zero as training proceeds.
        </p>
        <MathBlock>{String.raw`\varepsilon_t = \varepsilon_{\text{start}} + (\varepsilon_{\text{end}} - \varepsilon_{\text{start}})\cdot \frac{t}{T}.`}</MathBlock>
        <p>
          Early episodes explore the whole floor aggressively, so every route — doorway included — gets sampled
          enough times for its true value to emerge from the noise. Later episodes explore barely at all, so the
          agent commits to the best route it found and stops paying the exploration tax near the hazard. The two
          jobs a fixed <M>\varepsilon</M> was failing to share are now separated in time.
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="Seed 4 was one of the runs that broke under fixed ε=0.1 (it scored −248, delivering almost nothing). We retrain that exact seed with ε annealed from 1.0 down to 0.05. What happens?"
          options={[
            "Still broken — a bad seed is a bad seed",
            "It reaches the ceiling — heavy early exploration finds the delivery route the fixed-ε run never did",
            "Slightly better but still stuck in the safe basin",
          ]}
          nudge="Locked in. The seed was never the problem; the exploration was. Same random seed, same everything else — only the schedule changes."
        />

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeContrast} />
        <CodeOutput>{`fixed  eps = 0.1    : return  -248.34   delivered   1.1%   spills 0.007
anneal 1.0 -> 0.05  : return    21.32   delivered 100.0%   spills 0.116`}</CodeOutput>
        <p>
          Same seed. From <strong>−248 and 1% delivered</strong> — a robot that wanders and never finishes — to{" "}
          <strong>21.32 and 100%</strong>, the optimal risky route, purely by changing <em>when</em> it explored.
          The fixed-<M>\varepsilon</M> run wasn&rsquo;t unlucky in some irreparable way; it just never explored
          hard enough, early enough, to discover the delivery.
        </p>

        <h2>The lottery, across all ten seeds</h2>
        <p>
          One rescued seed is a demonstration, not a result — Act 3 drilled that in. So here is the full
          distribution: ten seeds each, comparing the fixed baseline against three annealing schedules.
        </p>

        <CodeBlock fromScratch={codeSweep} />
        <CodeOutput>{`schedule            | mean    risky/10  broken   (Q-learning, 15000 ep)
fixed ε = 0.1       | 17.66     7/10       1
anneal 0.5 -> 0.01  | 18.59     9/10       1
anneal 0.3 -> 0.01  | 20.12     8/10       0
anneal 1.0 -> 0.05  | 21.10    10/10       0`}</CodeOutput>
        <p>
          The strongest schedule, <M>{String.raw`1.0 \to 0.05`}</M>, reaches the ceiling on <strong>all ten
          seeds</strong>, mean <strong>21.10</strong> against the oracle&rsquo;s 21.21 — the basin lottery is
          essentially gone. The gentler schedules help less because they explore less aggressively at the start,
          which is exactly where the doorway needs to be discovered. More early exploration, more reliably found
          the better route.
        </p>

        <Callout color={OLIVE} title={<>GLIE: the condition that makes this principled</>}>
          Annealing is not just a trick; it satisfies a named requirement for convergence to the optimal policy,{" "}
          <strong>GLIE</strong> — <em>Greedy in the Limit with Infinite Exploration</em>. Two clauses, each doing
          real work. <em>Infinite exploration</em>: every state-action pair must keep being tried forever, so no
          value estimate is starved (this is why <M>\varepsilon</M> should approach zero but a schedule is usually
          kept slightly above it, or decayed slowly). <em>Greedy in the limit</em>: the policy must become greedy
          as <M>{String.raw`t \to \infty`}</M>, so what you converge to is the <em>optimal</em> policy and not some
          permanently-random one. A fixed <M>{String.raw`\varepsilon = 0.1`}</M> satisfies the first and violates
          the second — it never stops being 10% random — which is why even its successful runs left points on the
          table. We met GLIE in the{" "}
          <Link href="/learn/learning/exploration-returns" style={link}>Learning track</Link>; here it is the
          difference between 7 good runs and 10.
        </Callout>

        <p>
          There is one honest caveat, and it is the same one from the discount page: this all assumes you can afford
          to explore. On a simulated warehouse, a spill during early random flailing costs nothing real. On a
          physical robot, or a live recommender, aggressive early exploration has a price of its own — which is
          another reason on-policy methods and cautious schedules exist. The schedule that is optimal for{" "}
          <em>learning speed</em> is not always the one that is safe to <em>run</em>.
        </p>

        <TransferBox>
          Default to an annealed exploration schedule, not a constant one: explore aggressively while the value
          estimates are still forming, then decay toward greedy so you exploit what you learned. If an agent seems
          stuck in a mediocre policy, raising <em>early</em> exploration is often the fix — the problem is usually
          that it stopped looking before it found the good option, not that the good option isn&rsquo;t there.
        </TransferBox>

        <PlaybookRule n={16}>
          <strong>Anneal exploration from high to low (aim for GLIE): explore hard while estimates are forming,
          decay toward greedy to exploit and to converge to the optimal policy.</strong> A fixed ε explores too
          little early, too much late, and can trap an agent in a self-fulfilling bad estimate.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/the-step-size", label: <>← The step size α</> }}
          next={{ href: "/learn/warehouse-robot-capstone/optimism-and-initialisation", label: <>Next up · Optimism and initialisation →</> }}
        />
      </div>
    </article>
  );
}

const codeContrast = `def train(episodes=6000, alpha=0.1, eps=0.1, eps_end=None, seed=0):
    e = Warehouse(seed); Q = np.zeros((nS, nA))
    for ep in range(episodes):
        # linear anneal from eps to eps_end (or hold constant if eps_end is None)
        cur = eps if eps_end is None else eps + (eps_end - eps) * (ep / (episodes - 1))
        s = e.reset("uniform"); a = eps_greedy(Q, s, cur, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)
            if done:
                Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, cur, e.rng)
            Q[s, a] += alpha * (r + GAMMA * Q[s2].max() - Q[s, a])
            s, a = s2, a2
    return Q

for label, kw in (("fixed  eps = 0.1  ", dict(eps=0.1)),
                  ("anneal 1.0 -> 0.05", dict(eps=1.0, eps_end=0.05))):
    Q = train(seed=4, **kw)                              # seed 4 broke under fixed eps
    r = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
    print("%s : return %8.2f   delivered %5.1f%%   spills %.3f"
          % (label, r["ret"], r["delivered"] * 100, r["spills"]))`;

const codeSweep = `# 10 seeds x 15000 episodes per schedule — precomputed in scripts/rl_capstone_cases.py.
for label, (eps0, eps1) in [("fixed 0.1", (0.1, None)), ("0.5->0.01", (0.5, 0.01)),
                            ("0.3->0.01", (0.3, 0.01)), ("1.0->0.05", (1.0, 0.05))]:
    rets = [evaluate(lambda s: int(np.argmax(train("q", eps=eps0, eps_end=eps1, seed=sd)[s])),
                     n=2000, seed=999)["ret"] for sd in range(10)]
    print(label, np.mean(rets), "%d/10" % sum(r > 18.5 for r in rets), sum(r < 0 for r in rets))`;
