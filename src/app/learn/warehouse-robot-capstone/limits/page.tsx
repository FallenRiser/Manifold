import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Limits: what it can never know — Manifold",
  description:
    "Everything that made this capstone solvable was a choice that also fenced it in: a table you can only fill because there are 80 states, a state that is Markov only because we made it so. Add one realistic feature and the table hits two million rows — which is exactly where tabular RL ends and function approximation begins.",
};

const OLIVE = "var(--c-warehouse)";

export default function Limits() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 5 · Interpret", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>Limits: what it can never know</>}
        intro={<>
          The honest way to end an analysis is to name what it cannot do. Our agent solved the warehouse — but only
          because the warehouse was small enough for a table and simple enough to be Markov. Both of those are
          load-bearing assumptions, and both break the moment the problem gets real.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={5} n={21}>
          What are the assumptions that made this solvable, where do they break, and what does the agent
          structurally have no way of knowing?
        </WorkOrder>

        <h2>Limit 1 — it only knows what is in the state</h2>
        <p>
          Act 1 taught this as a success story: add the carrying bit and the aliasing goes away. The limit is the
          same fact read pessimistically. The agent knows <em>exactly</em> what the state vector encodes and{" "}
          <strong>nothing else</strong>. It cannot know the floor is about to get slippery, that a human is around
          the corner, that this package is fragile — unless you put that in the state. Everything outside the state
          is, to the agent, not merely unknown but <em>invisible</em>.
        </p>
        <p>
          Our warehouse is Markov because we engineered it to be. Real environments rarely hand you that. When the
          information needed to act optimally is genuinely unavailable — a sensor cannot see it, it happened in the
          past — you are in a <strong>partially observable</strong> MDP, and no tabular method solves a POMDP
          directly. The honest responses are the ones from the state page: recover the missing fact if you can
          (add the bit), or give the agent memory (a history window, a recurrent state) if you cannot. But some
          things stay unknowable, and then &ldquo;optimal&rdquo; is defined only relative to what can be observed.
        </p>

        <h2>Limit 2 — the table wall</h2>
        <p>
          The deeper limit is that our whole method rests on there being one row per state. That is fine for 80
          states. Watch what one realistic feature at a time does to that count.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeExplode} />
        <CodeOutput>{`cell x carrying (this capstone)              80 states
+ battery level (0..9)                      800 states
+ a second robot's cell (40)             32,000 states
+ 3 package types                        96,000 states
+ shelf stock (0..20)                 2,016,000 states`}</CodeOutput>

        <PredictPrompt
          accent={OLIVE}
          prompt="At two million states, a Q-table is still only ~30 MB — memory isn't the wall. So what actually breaks?"
          options={[
            "Nothing — if it fits in memory, tabular RL still works",
            "Coverage: each state is learned in isolation, so you'd need to visit all two million enough times each — and the table can't transfer anything it learns in one state to a similar one",
            "The discount stops working at large state counts",
          ]}
          nudge="Locked in. The table's fatal flaw isn't size, it's that it generalises nothing: a cell one step away is, as far as the table knows, an unrelated problem it must learn from scratch."
        />

        <p>
          The number is not even the real problem — two million floats is about 30 MB, which fits anywhere. The
          problem is <strong>coverage and generalisation</strong>. A table learns every state{" "}
          <em>independently</em>: what it discovers about one cell tells it nothing about the cell next door, even
          though they are obviously similar. To fill two million rows it would need to visit two million states,
          many times each, and it would learn the same lesson two million separate times. The state count grows as
          the <em>product</em> of every feature&rsquo;s range — the &ldquo;curse of dimensionality&rdquo; — so a
          handful of extra dimensions pushes any real problem permanently out of a table&rsquo;s reach.
        </p>

        <Callout color={OLIVE} title={<>This is exactly where function approximation begins</>}>
          The fix is to stop storing a value per state and start <em>computing</em> one:{" "}
          <M>{String.raw`Q(s,a) \approx \hat{q}(s,a;\,\mathbf{w})`}</M>, a parameterised function — a linear model
          over features, or a neural network — with far fewer weights <M>{String.raw`\mathbf{w}`}</M> than there are states.
          Because it reads features rather than an index, it <em>generalises</em>: adjust the weights for one state
          and every similar state moves with it, so the agent learns a lesson once instead of two million times.
          That single change — table &rarr; function — is the entire content of the next RL track, and putting a
          neural network in that slot is what the word <strong>&ldquo;deep&rdquo;</strong> in deep reinforcement
          learning refers to. Everything you built here — the sampled backup, on- vs off-policy, exploration
          schedules, honest evaluation — carries over unchanged; only the thing being updated is different. It also
          brings new failure modes of its own (the estimates can now diverge), which is why we taught the tabular
          foundation first.
        </Callout>

        <h2>Limit 3 — it never had the model</h2>
        <p>
          One asymmetry ran through the whole capstone: the oracle could <code>dp_solve</code> because it read the
          transition model; the agent could only <code>step</code>. That is not a temporary handicap the agent
          trains its way out of — it <strong>never</strong> learns <M>{String.raw`P(s' \mid s, a)`}</M>. It learns
          the <em>value</em> of acting, which is enough to act well, but it cannot answer counterfactuals
          (&ldquo;what if I had gone left?&rdquo;) or plan a route it has never partly walked. Methods that learn a
          model and plan against it exist — that is model-<em>based</em> RL — and they buy sample-efficiency at the
          cost of a model that can itself be wrong. Our agent is model-free by construction, and its horizons are
          bounded by what it has actually tried.
        </p>

        <h2>Limit 4 — it assumes the world holds still</h2>
        <p>
          The convergence guarantees, the fixed evaluation seed, the whole notion of a single optimal policy — all
          assume a <strong>stationary</strong> environment. The failure-modes page already showed what a shifted
          slip does to a policy; a table makes it worse, because it has no way to notice the world changed and no
          cheap way to adapt short of re-exploring. Anything that drifts over time — prices, wear, user behaviour —
          violates the assumption underneath everything we did, and calls for methods that keep learning rather than
          converging and stopping.
        </p>

        <p>
          None of these are criticisms of what we built; they are the edges of it. A tabular agent on a small,
          observable, stationary MDP is exactly the right tool for this warehouse, and it reached the ceiling. The
          reason to name the edges is that the next problem will sit just past one of them, and knowing which edge
          you are crossing tells you which tool to reach for next.
        </p>

        <Quiz
          accent={OLIVE}
          title="Act 5 checkpoint"
          questions={[
            {
              q: <>A well-trained agent scored 20.85 but agreed with the oracle on only 84% of the states it visits. Why is that usually fine?</>,
              options: [
                "It isn't — it means the agent is undertrained",
                "Most disagreements are at near-ties (several actions of nearly equal value) or in rarely-visited states, so being 'wrong' there costs almost nothing — but you must check the map to confirm none is a reachable trap",
                "The oracle is only approximately correct",
              ],
              answer: 1,
              explain: <>A near-optimal score permits many different policies. The score guarantees good average
                behaviour; only reading the map tells you whether a disagreement is a harmless tie or a real
                defect.</>,
            },
            {
              q: <>The risky policy scored 21.5 at slip 0.10 but −42.8 at slip 0.40, while the safe policy held up. What failure is this?</>,
              options: [
                "Undertraining at high slip",
                "Distribution shift: a policy optimal for the training environment can become the worst choice when the deployment environment differs — and the more cautious policy is the robust one",
                "The discount was set wrong",
              ],
              answer: 1,
              explain: <>'Optimal' was optimal for one specific slip. When you can't trust the world to stay put, the
                highest training score is not what to optimise for.</>,
            },
            {
              q: <>The optimal policy's mean return is 21 but its worst 1% of episodes average −55 (worst single: −124). What's the lesson?</>,
              options: [
                "The mean is miscalculated",
                "A healthy average can hide an expensive tail; whether that tail is acceptable is a business decision, and if failures are costly you report and optimise the worst case, not the mean",
                "More episodes would remove the tail",
              ],
              answer: 1,
              explain: <>The distribution is a spike at 26 with a long left tail from spills. The mean chooses a
                policy; the tail decides whether you can live with it.</>,
            },
            {
              q: <>Adding a battery level, a second robot, and package types took the state count from 80 to over two million. Why does that break tabular RL, given it still fits in memory?</>,
              options: [
                "Two million floats is too much RAM",
                "The table learns each state in isolation and generalises nothing, so you'd need to visit every one many times — the state count grows as the product of feature ranges (the curse of dimensionality)",
                "The learning rate must shrink with state count",
              ],
              answer: 1,
              explain: <>Size isn't the wall; coverage and generalisation are. This is exactly the motivation for
                function approximation: compute Q(s,a;w) from features so one lesson transfers to all similar
                states.</>,
            },
            {
              q: <>What can the model-free agent structurally never know, no matter how long it trains?</>,
              options: [
                "The optimal policy",
                "The transition model P(s'|s,a) — it learns the value of acting, not the dynamics, so it cannot answer counterfactuals or plan a route it has never partly walked",
                "The reward it receives",
              ],
              answer: 1,
              explain: <>The oracle could solve the MDP because it read the model; the agent only ever samples. That
                asymmetry is permanent — it is the difference between model-free and model-based RL.</>,
            },
          ]}
        />

        <TransferBox>
          Close every RL project by naming its edges: what the state omits (and whether the problem is even Markov),
          how the state count scales with the features you&rsquo;ll eventually need, whether you have the model or
          only samples, and whether the world is stationary. The edge your next problem crosses tells you the tool
          to reach for — memory or a recurrent state for partial observability, function approximation for scale, a
          learned model for sample-efficiency, continual learning for drift.
        </TransferBox>

        <PlaybookRule n={21}>
          <strong>Name what the agent can never know, and what breaks at scale.</strong> It knows only what the
          state encodes (a POMDP if that&rsquo;s not enough), it learns values not the model, and a table generalises
          nothing — so the state count explodes as the product of features, which is where function approximation
          takes over.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/failure-modes", label: <>← Failure modes</> }}
          next={{ href: "/learn/warehouse-robot-capstone/takeaways", label: <>Next act · Conclude & transfer →</> }}
        />
      </div>
    </article>
  );
}

const codeExplode = `# A Q-table needs one row per state. Watch the count grow as we add realistic
# features -- each MULTIPLIES the state space (the curse of dimensionality).
count = nS                       # 80: cell x carrying, this capstone
print("%-34s %12s states" % ("cell x carrying (this capstone)", "{:,}".format(count)))
for label, mult in [("+ battery level (0..9)", 10),
                    ("+ a second robot's cell (40)", 40),
                    ("+ 3 package types", 3),
                    ("+ shelf stock (0..20)", 21)]:
    count *= mult
    print("%-34s %12s states" % (label, "{:,}".format(count)))`;
