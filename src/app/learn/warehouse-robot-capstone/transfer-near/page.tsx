import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Transfer test I · A new warehouse — Manifold",
  description:
    "The first transfer test is the near one: a different floor plan, same everything else. We change one constant — the map — and re-run the identical pipeline. No new ideas, no new code; the learned agent reaches 100% of the new oracle. This is what it means for a method to transfer.",
};

const OLIVE = "var(--c-warehouse)";

export default function TransferNear() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 6 · Transfer", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Transfer test I · A new warehouse</>}
        intro={<>
          A capstone that only works on the one problem it was built for has taught you a trick, not a skill. So we
          test it. The near test keeps the problem&rsquo;s shape and changes its particulars — a different floor —
          and asks whether the method survives the swap. It does, without a new idea.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={6} n={23}>
          If the specifics change but the structure doesn&rsquo;t, how much of my work carries over — and how much
          did I quietly hard-code to this one instance?
        </WorkOrder>

        <h2>Change the map, nothing else</h2>
        <p>
          Everything the agent needs about the warehouse lives in one constant: <code>FLOOR</code>, the grid of
          characters. Every function that matters — <code>_transition</code>, <code>dp_solve</code>,{" "}
          <code>evaluate</code> — reads the layout from module globals at call time. So we can relocate the entire
          spill wall by reassigning that constant and recomputing the handful of positions derived from it. No
          algorithm changes. No new environment class. The pipeline does not even know it is a different building.
        </p>
        <p>
          The new floor moves the hazard: the spill wall now blocks the middle and right, and the clear{" "}
          <strong>bypass has shifted to the left</strong>, hard against the dock and shelf. Then we run the same
          steps we ran across five acts — baseline, oracle, learn, evaluate — untouched.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={code} />
        <CodeOutput>{`random  :   ret  -494.59  delivered 14.1%
oracle  :   ret    32.58  delivered 100.0%  spills 0.011
learned :   ret    32.53  delivered 100.0%  spills 0.001

learned EMPTY-leg policy on the new floor:
  v   <   <   <   <   <   <   <
  v   <   ^   ^   ^   <   ^   ^
  v   <  ##  ##  ##   v  ##  ##
  v   <   v   v   <   v   v   v
  P   <   <   <   <   <   <   <`}</CodeOutput>

        <PredictPrompt
          accent={OLIVE}
          prompt="Same code, new floor. Where does the learned agent's return land relative to the new oracle?"
          options={[
            "Well short — a policy tuned for one map won't transfer to another",
            "At the ceiling — the method re-solves the new layout from scratch and reaches 100% of the new oracle",
            "Above the oracle — the new floor is easier",
          ]}
          nudge="Locked in. Nothing about the agent was specific to the old map; it learns whatever floor it's dropped on. The oracle moved to 32.58 and the learner followed it there."
        />

        <h2>What transferred, and what that proves</h2>
        <p>
          The learned agent scores <strong>32.53</strong> against the new oracle&rsquo;s <strong>32.58</strong> —
          essentially the ceiling — with 100% delivery, all from the same Q-learning loop and the same tuned
          exploration schedule. Read the map and you can see it discovered the new geometry on its own: from the
          dock it drives straight <em>down the left column</em>, the newly-clear bypass, instead of hunting for the
          doorway that used to be in the middle. Nobody told it the layout changed; it simply learned the floor it
          was given.
        </p>
        <p>
          This is the difference between a solution and a method. Every number in Acts 1&ndash;5 was specific to the
          original floor, but <em>none of the reasoning was</em>. The state design (position + carrying), the reward
          structure, the discount, the algorithm, the tuning protocol, the honest evaluation — all of it applied to
          a floor it had never seen, with a one-line change. When people say a technique &ldquo;generalises,&rdquo;
          this is the modest, concrete thing they should mean: the same procedure, pointed at a new instance of the
          same kind of problem, works.
        </p>

        <Callout color={OLIVE} title={<>Near transfer is the easy half — and still needs the harness</>}>
          Do not oversell this. Near transfer worked because the new problem is genuinely the same shape: a grid,
          the same state and action design, the same reward meanings. That is exactly the regime where reusing a
          method is safe. But notice we did not <em>assume</em> it worked — we re-ran the baseline (random still
          fails, −495), re-computed the oracle (the ceiling moved to 32.58), and checked the learned agent against
          it. Transfer is a claim to verify, not to trust: a new floor could have a coverage trap the old one
          didn&rsquo;t, or a slip the old tuning can&rsquo;t handle. The Playbook travels; so does the obligation to
          re-measure. The <em>far</em> test on the next page drops even the grid — and there the &ldquo;same
          shape&rdquo; assumption finally has to be earned rather than assumed.
        </Callout>

        <TransferBox>
          Write your environment so its specifics live in data (a map, a config), not in the logic, and your method
          transfers to new instances by changing that data alone. But re-run the full harness on every new instance
          — baseline, oracle or reference, evaluation — because &ldquo;it&rsquo;s basically the same problem&rdquo;
          is a hypothesis, and the cheap way to test it is the pipeline you already built.
        </TransferBox>

        <PlaybookRule n={22}>
          <strong>Keep the problem&rsquo;s specifics in data, not in the logic, so the method transfers to a new
          instance by swapping the data — then re-run the whole harness to verify it did.</strong> A method that
          only solves the one instance you built it on is a trick, not a skill.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/takeaways", label: <>← Verdict, playbook & notebook</> }}
          next={{ href: "/learn/warehouse-robot-capstone/transfer-far", label: <>Next up · Transfer test II · Inventory control →</> }}
        />
      </div>
    </article>
  );
}

const code = `# Point the SAME code at a NEW warehouse: just reassign the layout constant.
# Every function reads these globals at call time, so nothing else has to change.
FLOOR = ["S......D",
         "........",
         "..HHH.HH",     # the spill wall moved; the clear bypass is now on the LEFT
         "........",
         "P......."]
NROW, NCOL = len(FLOOR), len(FLOOR[0])
_find = lambda ch: [(r, c) for r in range(NROW) for c in range(NCOL) if FLOOR[r][c] == ch]
DOCK = _find("S")[0]; PICK = _find("P")[0]; DROP = _find("D")[0]; SPILLS = set(_find("H"))
nS = NROW * NCOL * 2
sid = lambda r, c, k: (r * NCOL + c) * 2 + k
unpack = lambda s: ((s // 2) // NCOL, (s // 2) % NCOL, s % 2)
NONTERMINAL = [s for s in range(nS) if s != sid(DROP[0], DROP[1], 1)]

def train(episodes=8000, alpha=0.1, seed=0):          # the tuned Act-4 recipe, unchanged
    e = Warehouse(seed); Q = np.zeros((nS, nA))
    for ep in range(episodes):
        cur = 1.0 + (0.05 - 1.0) * (ep / (episodes - 1))     # anneal 1.0 -> 0.05
        s = e.reset("uniform"); a = eps_greedy(Q, s, cur, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)
            if done: Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, cur, e.rng)
            Q[s, a] += alpha * (r + GAMMA * Q[s2].max() - Q[s, a]); s, a = s2, a2
    return Q

V, PI = dp_solve()                                    # re-solve the NEW floor for its ceiling
rng = np.random.default_rng(0)
rnd = evaluate(lambda s: int(rng.integers(nA)), n=2000, seed=3)
Q = train(seed=0)
orc = evaluate(lambda s: PI[s], n=2000, seed=999)
lrn = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
print("random  :   ret %8.2f  delivered %.1f%%" % (rnd["ret"], rnd["delivered"] * 100))
print("oracle  :   ret %8.2f  delivered %.1f%%  spills %.3f" % (orc["ret"], orc["delivered"]*100, orc["spills"]))
print("learned :   ret %8.2f  delivered %.1f%%  spills %.3f" % (lrn["ret"], lrn["delivered"]*100, lrn["spills"]))
print()
print("learned EMPTY-leg policy on the new floor:")
show(Q.argmax(1), 0)`;
