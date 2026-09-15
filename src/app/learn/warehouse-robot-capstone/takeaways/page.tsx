import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { WorkOrder, ShopFloor, SlabStats, HazardTape } from "@/components/capstone/warehouse";
import { asset } from "@/lib/asset";

export const metadata = {
  title: "Verdict, playbook & notebook — Manifold",
  description:
    "The warehouse is solved: a tabular agent reaching the oracle's ceiling from samples alone, and — more importantly — a 23-rule Playbook for turning any sequential decision under uncertainty into a solved problem. The verdict, the full playbook, and the notebook that reproduces every number.",
};

const OLIVE = "var(--c-warehouse)";

type Rule = { n: number; act: string; text: string };
const PLAYBOOK: Rule[] = [
  { n: 1, act: "Frame", text: "Write the decision the agent serves and how success is measured, before choosing an algorithm — and bracket the problem with a floor and, if you can, a ceiling." },
  { n: 2, act: "Frame", text: "Turn the task into ⟨S, A, P, R, γ⟩ on paper first, recording what each choice throws away; the dynamics may exist without being readable." },
  { n: 3, act: "State", text: "Design the state by asking what the agent must know to act optimally, then test for aliasing — if two situations needing different actions look identical, no algorithm can succeed." },
  { n: 4, act: "Reward", text: "Reward outcomes, not methods; stress-test the reward against an adversary maximising it literally, and score every policy on the true objective." },
  { n: 5, act: "Discount", text: "Choose γ from the task's timescale (1/(1−γ) should exceed the action-to-outcome delay), and remember shrinking it also makes the agent more risk-averse." },
  { n: 6, act: "Harness", text: "Specify the environment completely — truncation cap included — before training, and measure the true end-to-end cost of bad events, not the penalty you wrote." },
  { n: 7, act: "Harness", text: "Design and freeze the evaluation harness before training, then verify its noise floor is well below the effect sizes you intend to report." },
  { n: 8, act: "Harness", text: "Establish a random baseline and a hand-coded baseline; a deterministic policy repeats its mistakes forever, so a heuristic can score far worse than random." },
  { n: 9, act: "Harness", text: "Establish the ceiling before optimising, keep the discounted V* and the undiscounted scoreboard separate, and read the optimal policy's risk appetite as a review of your reward." },
  { n: 10, act: "Learn", text: "When you lack a model, replace the Bellman expectation with sampled transitions and bootstrap; keep exploring so every state-action pair is still visited." },
  { n: 11, act: "Learn", text: "Bootstrap from the action you'll actually take (on-policy) vs the best action (off-policy) by deployment — will it still explore in production?" },
  { n: 12, act: "Learn", text: "Replace a sampled action in the target with an expectation over the policy when you can afford it — same mean, zero target variance, steadier convergence." },
  { n: 13, act: "Learn", text: "Never trust one seed: an RL outcome is a distribution (often multi-modal); report the spread and the failure rate, and locate a trade-off in the reward and exploration before blaming the update rule." },
  { n: 14, act: "Learn", text: "Judge added complexity by whether its benefit reproduces across seeds; distrust a mean in a multi-modal world, and verify any textbook effect on your own problem." },
  { n: 15, act: "Tune", text: "Treat α as a stability dial on stochastic problems — small enough to average noise, decayed (Robbins–Monro) for early speed; too large destroys convergence." },
  { n: 16, act: "Tune", text: "Anneal exploration high→low toward GLIE: explore hard while estimates form, decay toward greedy to exploit and converge; a fixed ε can trap a self-fulfilling bad estimate." },
  { n: 17, act: "Tune", text: "Initialise optimistically for randomness-free systematic exploration — but only above the maximum true value; a partway-optimistic start can be worse than neutral." },
  { n: 18, act: "Tune", text: "Tune against a distribution over many seeds, split tuning seeds from reporting seeds, and quote the spread and worst case — never the best run." },
  { n: 19, act: "Interpret", text: "Read the policy, not just the score: render and audit the plan — main path, hazard-adjacent states, rarely-visited traps, disagreements with a reference." },
  { n: 20, act: "Interpret", text: "Stress-test outside the training distribution and report the tail, not the mean; the optimal-on-training policy can become the worst under shift." },
  { n: 21, act: "Interpret", text: "Name what the agent can never know (a POMDP if the state isn't enough), and what breaks at scale — a table generalises nothing, so state count explodes into function approximation." },
  { n: 22, act: "Transfer", text: "Keep the problem's specifics in data, not logic, so the method transfers to a new instance by swapping the data — then re-run the whole harness to verify it did." },
  { n: 23, act: "Transfer", text: "Trust a method only after it solves a problem structurally unlike the one you built it on; the Playbook is domain-independent, a trick is not." },
];

const ACT_COLOR: Record<string, string> = {
  Frame: "var(--c-rl)", State: "var(--c-rl)", Reward: "var(--c-rl)", Discount: "var(--c-rl)",
  Harness: "var(--c-metrics)", Learn: OLIVE, Tune: "var(--c-trees)", Interpret: "var(--c-classification)",
  Transfer: "var(--c-regression)",
};

const DEFEND: { q: string; a: string }[] = [
  { q: "Your Q-learning agent scores 21. Is it good?", a: "Meaningless without the brackets. Random scores −816, a hand-coded heuristic −3560, the oracle 21.21 — so 21 is essentially optimal. And it's the median of a distribution: over ten seeds the vanilla config reached that basin only 7 times, with one broken run. Always quote the ceiling and the spread." },
  { q: "Why not just use SARSA — isn't it the safe choice?", a: "That's the cliff-walking lore, and it did not reproduce here. Over ten seeds Q reached the good route 7/10 and SARSA 6/10 — indistinguishable. The route an agent learns is dominated by its seed, not its update rule. The reproducible difference was Expected SARSA's lower variance (no broken runs, half the spills), not a route preference." },
  { q: "The agent is optimal — safe to deploy?", a: "Optimal for the floor you trained on. Raise the slip from 0.10 to 0.20 and the risky policy's return collapses below the cautious one's; by 0.40 it loses by 30 points. And its mean of 21 hides a tail with episodes as bad as −124. Whether that tail is acceptable is a business decision, not a training metric." },
  { q: "You added the carrying bit to the state. Why does one bit matter so much?", a: "Without it the state is aliased: at the doorway the optimal action is 'down' when empty and 'up' when carrying, but those look identical to a position-only agent, so the optimal policy isn't representable. The result is 0% delivered, −250 — not undertraining, impossibility. State design decides feasibility before any algorithm runs." },
  { q: "How do you know your tuning actually improved the agent?", a: "By refusing to judge it on one run. The vanilla config looked solved on seed 2 (21.1) but averaged 17.66 over ten seeds with a broken run. The tuned config (annealed ε) reached the ceiling on all ten. A change is real only when it moves the distribution — measured on seeds held out from tuning." },
];

const detailsBox: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", margin: "0 0 8px" };
const summaryRow: React.CSSProperties = { cursor: "pointer", fontWeight: 500, fontSize: 14.5, color: "var(--ink)" };

export default function Takeaways() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 6 · Conclude", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Verdict, playbook &amp; notebook</>}
        intro={<>
          Six acts ago the warehouse was a fuzzy task. Now it is a solved control problem — and, more valuably, the
          work has distilled into a Playbook that has nothing to do with warehouses. Here is the verdict, the
          twenty-three rules you built, and the notebook that reproduces every number.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={6} n={22}>
          What did we actually achieve, what is the reusable lesson, and can someone else verify all of it from
          scratch?
        </WorkOrder>

        <h2>The verdict</h2>

        <ShopFloor stamp="Signed off" pad="22px 22px 18px">
          <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            Final bench, ten reporting seeds, annealed &epsilon; — measured, not asserted.
          </div>
          <SlabStats
            items={[
              { value: "21.10", label: "Learned agent", note: "from samples alone, no model", tone: "good" },
              { value: "21.21", label: "Oracle ceiling", note: "value iteration, handed the rules" },
              { value: "10/10", label: "Seeds at the ceiling", note: "vanilla config reached it 7/10, with one broken run" },
              { value: "23", label: "Rules banked", note: "none of them about warehouses" },
            ]}
          />
        </ShopFloor>

        <p>
          A tabular Q-learning agent, given only the ability to act and observe, learned to run the warehouse at{" "}
          <strong>the oracle&rsquo;s ceiling</strong> — ~21 return, 100% of packages delivered, from samples alone.
          That is the headline, and it is real. But the capstone spent most of its length on the parts that are not
          in that sentence: that the agent was <em>provably unable</em> to solve the task until we added one bit to
          its state; that the choice between algorithms mattered far less than the seed they were trained on; that
          the basin lottery this produced was tunable away with an exploration schedule; that the &ldquo;optimal&rdquo;
          policy is optimal only for the exact floor and slip it was trained on, and hides a worst case four times
          worse than its mean.
        </p>
        <p>
          The honest verdict, then, is not &ldquo;RL solved the warehouse.&rdquo; It is: <strong>a small, observable,
          stationary control problem yields completely to tabular methods — provided you frame the state correctly,
          evaluate honestly across seeds, tune the exploration deliberately, and stress-test before you trust it.</strong>{" "}
          Every one of those provisos was a place the naive version failed, and every one became a rule.
        </p>

        <h2>The Playbook</h2>
        <p>
          Twenty-three rules, banked one at a time as each was paid for by a real failure. None is about warehouses;
          all of them are how you approach the next sequential decision problem you meet.
        </p>

        <HazardTape label="Playbook · 23 rules" />

        <div style={{ display: "grid", gap: 5, margin: "0 0 1.6rem" }}>
          {PLAYBOOK.map((r) => (
            <div
              key={r.n}
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto 1fr",
                gap: 12,
                alignItems: "baseline",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderLeft: `3px solid ${ACT_COLOR[r.act]}`,
                borderRadius: "3px 10px 10px 3px",
                padding: "9px 13px",
              }}
            >
              <span
                className="font-display"
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 700,
                  color: ACT_COLOR[r.act],
                  fontSize: 12,
                  border: `1.5px solid color-mix(in srgb, ${ACT_COLOR[r.act]} 45%, transparent)`,
                  borderRadius: 4,
                  minWidth: 24,
                  textAlign: "center",
                  padding: "1px 0",
                  alignSelf: "center",
                }}
              >
                {r.n}
              </span>
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: ACT_COLOR[r.act],
                  minWidth: 74,
                }}
              >
                {r.act}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)" }}>{r.text}</span>
            </div>
          ))}
        </div>

        <Callout color={OLIVE} title={<>The seven questions under the twenty-three rules</>}>
          If twenty-three is too many to carry, carry the skeleton they hang on — the same seven questions that
          solved the grid and the inventory problem alike: <strong>frame it</strong> (decision + metric),{" "}
          <strong>design the state</strong> (enough to be Markov?), <strong>reward the outcome</strong> (not a
          proxy), <strong>bracket it</strong> (baseline and ceiling), <strong>learn from samples</strong> (bootstrap,
          keep exploring), <strong>tune honestly</strong> (many seeds, held out), and{" "}
          <strong>read and stress-test the policy</strong> (not just the score). The rules are the details; these are
          the moves.
        </Callout>

        <h2 id="reproduce-it-yourself">Reproduce every number</h2>
        <p>
          Not one figure in this capstone is asserted. The full analysis — every environment, every experiment from
          the aliasing collapse to the inventory transfer — is one deterministic notebook. It runs top to bottom on
          numpy alone and reproduces each published number exactly; the on-page code blocks run the identical
          environment in your browser.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "0 0 1.4rem" }}>
          <a href={asset("/capstone/warehouse-robot-capstone.ipynb")} download style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--brand)" }}>↓ warehouse-robot-capstone.ipynb</span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>
              the whole capstone as a runnable Jupyter notebook — the warehouse and inventory environments, and every
              act&rsquo;s experiments, reproducing each number deterministically
            </span>
          </a>
        </div>

        <h2>Defend it: the interview test</h2>
        <p>
          A capstone you cannot defend is a tutorial you followed. Answer each of these out loud — the questions a
          skeptical panel actually asks about an RL result — then check yourself.
        </p>
        {DEFEND.map((d) => (
          <details key={d.q} style={detailsBox}>
            <summary style={summaryRow}>{d.q}</summary>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--muted)", padding: "8px 2px 4px" }}>{d.a}</div>
          </details>
        ))}

        <Callout color={OLIVE} title={<>Now prove the thinking transferred</>}>
          The number 21 stays here; the Playbook comes with you. The final two pages are the graduation — the same
          moves on problems nobody framed for you. One <strong>near</strong> (a new warehouse floor: the method
          re-solves it by changing a single constant) and one <strong>far</strong> (inventory control: no grid, no
          route, and the classic (s, S) policy emerges anyway at 99% of optimal). If you can run the Playbook on
          those, you did not learn a warehouse — you learned reinforcement learning.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/limits", label: <>← Limits: what it can never know</> }}
          next={{ href: "/learn/warehouse-robot-capstone/transfer-near", label: <>Graduation · Transfer test I →</> }}
        />
      </div>
    </article>
  );
}
