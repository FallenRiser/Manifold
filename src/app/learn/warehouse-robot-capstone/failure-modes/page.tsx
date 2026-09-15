import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Failure modes — Manifold",
  description:
    "A tuned agent that scores 21 still fails in ways the mean-return scoreboard never shows: its optimal route becomes the worst choice on a slippier floor, and its 'good' return hides episodes as bad as −124. How to stress-test for the failures that matter.",
};

const OLIVE = "var(--c-warehouse)";

export default function FailureModes() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 5 · Stress-test", color: "var(--c-metrics)" }]}
        time="about 11 minutes"
        title={<>Failure modes</>}
        intro={<>
          We have an agent that reaches the ceiling and a policy we have read and understood. Now we try to break
          it. A headline return of 21 is an average over a friendly world; the failures that end projects live in
          the world changing, in the tail of the distribution, and in the states you never checked.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={5} n={20}>
          My agent is good on average, on the environment I trained it on. What happens when the world shifts, when
          I look at the worst episodes instead of the mean, and when a disturbance pushes it somewhere it rarely
          goes?
        </WorkOrder>

        <h2>Failure 1 — the world shifts, and optimal becomes worst</h2>
        <p>
          Everything so far assumed the floor slips 10% of the time, because that is what we trained on. Real
          floors get wetter. So take the two policies from the last page — the optimal (risky, through the doorway)
          and the spill-averse (safe, around the bypass) — and deploy each on progressively slippier floors than
          the one they were solved for.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeShift} />
        <CodeOutput>{`deploy slip | risky: ret / spills | safe: ret / spills
   0.10      |   21.48 / 0.133    |   16.43 / 0.000
   0.20      |    9.35 / 0.368    |   10.47 / 0.000  <- risky now loses
   0.30      |  -10.61 / 0.776    |    2.41 / 0.000  <- risky now loses
   0.40      |  -42.80 / 1.406    |   -9.03 / 0.000  <- risky now loses`}</CodeOutput>

        <PredictPrompt
          accent={OLIVE}
          prompt="The risky policy was strictly better at the training slip of 0.10 (21.48 vs 16.43). What happens as the floor gets slippier?"
          options={[
            "It stays better — it's the optimal policy, after all",
            "It collapses and the safe policy overtakes it: driving next to spills is fine at 10% slip and catastrophic at 40%",
            "Both degrade equally, so the ranking never changes",
          ]}
          nudge="Locked in. 'Optimal' was optimal for one specific slip. The doorway's whole value was that spills were rare; make them less rare and the policy that courts them is the one that suffers."
        />

        <p>
          The ranking <em>inverts</em>. At the training slip the risky policy wins by 5 points; by slip 0.20 the
          safe policy is already ahead, and by 0.40 it wins by more than 30. The mechanism is right there in the
          spill column: the safe policy touches a hazard <strong>zero times regardless of slip</strong> — it never
          goes near one — so it only degrades gently as slips lengthen its path. The risky policy&rsquo;s spills
          climb from 0.13 to <strong>1.4 per episode</strong>, and each one costs ~39. The decision that was
          correct became a liability, and nothing about the agent is broken — <strong>the environment moved out
          from under a policy that was optimal only for the floor it was trained on.</strong>
        </p>
        <p>
          This is the single most common way deployed RL disappoints: the deployment distribution is not the
          training distribution. It is worth noticing that the <em>more cautious</em> policy — the one that scored
          worse in training — is the robust one. When you cannot trust that the world will stay put, the highest
          training score is not the thing to optimise for.
        </p>

        <h2>Failure 2 — the tail behind the mean</h2>
        <p>
          Even at the training slip, on the environment it was built for, &ldquo;mean return 21&rdquo; is a
          reassuring lie of omission. A mean says nothing about the shape of the distribution it summarises. Let&rsquo;s
          look at the whole thing — run the optimal policy 5,000 times and inspect the spread, not the average.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeTail} />
        <CodeOutput>{`mean 21.22   median 26.00   worst single episode -124
13.3% of episodes score below 20 (a clean delivery is ~26)
the worst 1% of episodes average -55.62`}</CodeOutput>
        <p>
          The <em>median</em> episode scores <strong>26</strong> — a clean, fast delivery — which means the typical
          run is better than the mean suggests. The mean is dragged down to <strong>21.22</strong> by a{" "}
          <strong>left tail</strong>: 13% of episodes come in below 20, and the worst 1% average{" "}
          <M>{String.raw`-55`}</M>, with a single unlucky run reaching <M>{String.raw`-124`}</M> — four or five
          spills in one episode, each towing the robot back to the dock. The distribution is not a bell curve
          around 21; it is a spike at 26 with a long, thin, expensive tail.
        </p>
        <p>
          Whether that tail is acceptable is not a machine-learning question, it is a business one. If a spill is a
          mopped floor, a mean of 21 is the right thing to report. If a spill is a shattered pallet or an injured
          worker, the number that matters is <M>{String.raw`-124`}</M>, not 21 — and you would deliberately deploy
          the safe policy and its lower mean to make that tail disappear. <strong>The mean chooses a policy; the
          tail decides whether you can live with it.</strong>
        </p>

        <h2>Failure 3 — the seed lottery, one last time</h2>
        <p>
          The failures above are properties of a <em>good</em> agent. The third is the reminder that &ldquo;good
          agent&rdquo; was itself a gamble. Act 3 measured it and Act 4 tamed it, but never fully: even the tuned
          configuration&rsquo;s worst training seeds land in the mediocre basin, and the vanilla one broke outright
          about one run in ten. An agent is not a thing you have; it is a <em>sample</em> from a training process,
          and that process has a failure rate. The only defence is the one from the tuning page — train several
          seeds, and treat the worst outcome as a real possibility rather than an anomaly to discard.
        </p>

        <Callout color={OLIVE} title={<>The failure we designed around: coverage and exploring starts</>}>
          You may have noticed every training loop in this capstone begins episodes from <code>reset(&quot;uniform&quot;)</code>{" "}
          — a random state, not the dock. That is <strong>exploring starts</strong>, and it exists to guarantee{" "}
          <em>coverage</em>: a state whose value never gets sampled keeps whatever garbage it was initialised with,
          and if a disturbance later routes the agent there, that garbage becomes behaviour. In many gridworlds a
          fixed start plus modest exploration starves the off-path states and produces exactly the loops we worried
          about in the last page.
          <br /><br />
          Here is the honest twist: on <em>this</em> warehouse it turns out not to be decisive. Because a spill
          teleports the robot back to the dock, training churns it across the floor for free, and a dock-only start
          still reaches 100% delivery. We verified it. We kept exploring starts anyway, because it is nearly free
          insurance and because relying on an accidental property of the reward for your coverage is how you get
          surprised later. The transferable lesson is the one that survives the twist: <strong>know which of your
          safeguards are load-bearing</strong>, test what happens without them, and do not let a quirk of your
          environment silently do a job you should be doing on purpose.
        </Callout>

        <TransferBox>
          Stress-test past the training distribution before you trust an agent: perturb the dynamics and watch for
          rank inversions, plot the full return distribution and read its worst percentiles, and probe the states a
          disturbance could force it into. Report the tail alongside the mean, and remember that the robust policy is
          often not the one with the best training score.
        </TransferBox>

        <PlaybookRule n={20}>
          <strong>Stress-test outside the training distribution and report the tail, not just the mean.</strong>{" "}
          The optimal-on-training policy can become the worst under a shifted environment, a healthy average can hide
          a catastrophic worst case, and a safeguard you never tested may be doing nothing — or everything.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/reading-the-policy", label: <>← Reading the learned policy</> }}
          next={{ href: "/learn/warehouse-robot-capstone/limits", label: <>Next up · Limits: what it can never know →</> }}
        />
      </div>
    </article>
  );
}

const codeShift = `# Solve two policies at the TRAINING slip (0.10), then DEPLOY each on slippier floors.
V, PI = dp_solve()                            # optimal / risky (uses the doorway)
_orig = SPILL; SPILL = -300.0
Vs, PIsafe = dp_solve(); SPILL = _orig        # spill-averse / safe (uses the bypass)

def at_slip(policy, slip):
    global SLIP
    keep = SLIP; SLIP = slip                   # the dynamics read this global
    r = evaluate(policy, n=4000, seed=999); SLIP = keep
    return r

print("deploy slip | risky: ret / spills | safe: ret / spills")
for sl in (0.10, 0.20, 0.30, 0.40):
    a = at_slip(lambda s: PI[s], sl); b = at_slip(lambda s: PIsafe[s], sl)
    tag = "  <- risky now loses" if b["ret"] > a["ret"] else ""
    print("   %.2f      | %7.2f / %.3f    | %7.2f / %.3f%s" % (
        sl, a["ret"], a["spills"], b["ret"], b["spills"], tag))`;

const codeTail = `V, PI = dp_solve()
env = Warehouse(7); rets = []
for _ in range(5000):
    s = env.reset(); tot = 0.0
    for t in range(250):
        s, r, done = env.step(int(PI[s])); tot += r
        if done: break
    rets.append(tot)
rets = np.array(rets)

print("mean %.2f   median %.2f   worst single episode %.0f"
      % (rets.mean(), np.median(rets), rets.min()))
print("%.1f%% of episodes score below 20 (a clean delivery is ~26)" % (100 * np.mean(rets < 20)))
print("the worst 1%% of episodes average %.2f" % np.sort(rets)[:50].mean())`;
