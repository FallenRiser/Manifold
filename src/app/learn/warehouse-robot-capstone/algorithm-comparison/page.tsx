import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Algorithm comparison — Manifold",
  description:
    "Q-learning, SARSA and Expected SARSA on one honest scoreboard over ten seeds each. All three reach the oracle when they find the good route; the difference between them is not the route but the reliability — and the added complexity of Expected SARSA earns its keep by never failing catastrophically.",
};

const OLIVE = "var(--c-warehouse)";

const cell: React.CSSProperties = { padding: "7px 12px", borderBottom: "1px solid var(--border)", fontSize: 14.5 };
const num: React.CSSProperties = { ...cell, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const head: React.CSSProperties = { ...cell, fontWeight: 600, color: "var(--muted)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.04em" };

export default function AlgorithmComparison() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 3 · Learn it", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Algorithm comparison</>}
        intro={<>
          Three algorithms, one scoreboard, ten seeds each — the honest way to close an act that spent its last
          page proving one run means nothing. The verdict is not the one the individual pages set you up for, and
          that is the point.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion accent={OLIVE} label="The engineer's question" icon="🤖">
          Given three methods that all &ldquo;work&rdquo; on a single run, which do I actually ship — and did the
          extra machinery in the fancier ones earn its keep?
        </AnalystQuestion>

        <h2>The scoreboard, over ten seeds</h2>
        <p>
          Everything below obeys the protocol we locked in Act 2: greedy evaluation, 2,000 episodes from the dock,
          250-step cap. The only addition is the discipline the last page forced on us — we train ten seeds of each
          method and report the <em>distribution</em>, not a favourite.
        </p>

        <div style={{ overflowX: "auto", margin: "1.6rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: "left" }}>Algorithm</th>
                <th style={head}>Mean</th>
                <th style={head}>Reaches risky basin</th>
                <th style={head}>Typical best</th>
                <th style={head}>Spills</th>
                <th style={head}>Broken runs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cell, fontWeight: 600 }}>Q-learning</td>
                <td style={num}>17.66</td>
                <td style={num}>7 / 10</td>
                <td style={num}>~21.0</td>
                <td style={num}>0.117</td>
                <td style={num}>1</td>
              </tr>
              <tr>
                <td style={{ ...cell, fontWeight: 600 }}>SARSA</td>
                <td style={num}>17.27</td>
                <td style={num}>6 / 10</td>
                <td style={num}>~21.0</td>
                <td style={num}>0.092</td>
                <td style={num}>1</td>
              </tr>
              <tr>
                <td style={{ ...cell, fontWeight: 600, color: OLIVE }}>Expected SARSA</td>
                <td style={num}>18.74</td>
                <td style={num}>5 / 10</td>
                <td style={num}>~21.0</td>
                <td style={num}>0.050</td>
                <td style={{ ...num, fontWeight: 600, color: "var(--good)" }}>0</td>
              </tr>
              <tr>
                <td style={{ ...cell, color: "var(--muted)" }}>oracle (ceiling)</td>
                <td style={{ ...num, color: "var(--muted)" }}>21.21</td>
                <td style={{ ...num, color: "var(--muted)" }}>—</td>
                <td style={{ ...num, color: "var(--muted)" }}>21.21</td>
                <td style={{ ...num, color: "var(--muted)" }}>0.138</td>
                <td style={{ ...num, color: "var(--muted)" }}>—</td>
              </tr>
              <tr>
                <td style={{ ...cell, color: "var(--muted)" }}>hand-coded baseline</td>
                <td style={{ ...num, color: "var(--muted)" }}>−3560</td>
                <td style={{ ...num, color: "var(--muted)" }}>—</td>
                <td style={{ ...num, color: "var(--muted)" }}>—</td>
                <td style={{ ...num, color: "var(--muted)" }}>110</td>
                <td style={{ ...num, color: "var(--muted)" }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.4rem" }}>
          10 training seeds each, 15,000 episodes, from <code>rl_capstone_cases.py</code>. &ldquo;Typical best&rdquo;
          is the score in the risky basin; &ldquo;spills&rdquo; is the median across seeds.
        </p>

        <h2>What the table actually says</h2>
        <p>
          Three readings, in order of how much they matter.
        </p>
        <p>
          <strong>First: they are all, fundamentally, the same algorithm having a good or bad day.</strong> When
          any of the three lands in the risky basin it scores <strong>~21.0</strong> — the oracle&rsquo;s ceiling,
          reached from samples alone. The differences between the methods are dwarfed by the difference between a
          lucky seed and an unlucky one <em>within</em> each method. If you take one thing from Act 3, take that:
          the choice among these three matters far less than the fact that all three are hostage to their seed.
        </p>
        <p>
          <strong>Second: the mean is not measuring what it looks like it measures.</strong> Expected SARSA has the
          highest mean (<strong>18.74</strong>) despite reaching the good route <em>least</em> often (5/10). That is
          not a contradiction — it is the whole story. Its mean is highest because it has <strong>zero broken
          runs</strong>, while Q-learning and SARSA each have one catastrophic <M>{String.raw`-3`}</M> that drags
          their averages down. Expected SARSA does not win by finding better policies; it wins by never falling off
          a cliff. A mean, in a multi-modal world, is a summary of how often you fail as much as how well you
          succeed.
        </p>
        <p>
          <strong>Third: the reproducible edge is safety, not return.</strong> The one column that ranks the methods
          cleanly and consistently is spills: <strong>0.050</strong> for Expected SARSA against{" "}
          <strong>0.117</strong> for Q-learning, less than half. Its zero-variance target — the thing we measured on
          its own page — translates directly into fewer trips into the hazard and no catastrophic convergence.
          That is the benefit that survives re-running, and it is a different benefit from the one the cliff-walking
          story would have promised.
        </p>

        <Callout color={OLIVE} title={<>The verdict, and the one we refused to write</>}>
          If you must ship one of these on this warehouse, ship <strong>Expected SARSA</strong> — not because it
          scores highest on a good day (they tie at the ceiling) but because it is the least likely to hand you a
          disaster, and its safety edge is the only difference that reproduces. But note what we are{" "}
          <em>not</em> concluding. We are not telling you SARSA is the safe choice and Q-learning the reckless one —
          the data flatly refused to support that here. The clean, quotable ranking would have been more
          satisfying and less true. In RL especially, the temptation to report the effect you came looking for is
          strong, and the only defence is to run enough seeds that the effect has to prove it exists.
        </Callout>

        <h2>What Act 3 leaves on the table</h2>
        <p>
          We have a robot that reaches the ceiling when it is lucky and settles for three-quarters of it when it is
          not, with a one-in-ten chance of breaking outright. That variance is not something the choice of update
          rule can fix — we just watched all three suffer it. It is an <em>exploration</em> problem: agents get
          trapped in the worse basin because fixed-<M>\varepsilon</M> probing, after a couple of early spills, stops
          investigating the doorway hard enough to learn it was fine. Act 4 attacks exactly that, with a decaying
          schedule, optimistic initialisation, and a step size chosen on purpose — and shows how much of the
          seed-lottery is actually tunable away.
        </p>

        <Quiz
          accent={OLIVE}
          title="Act 3 checkpoint"
          questions={[
            {
              q: <>Q-learning&rsquo;s target uses <M>{String.raw`\max_{a'} Q(s',a')`}</M>. What makes that &ldquo;off-policy&rdquo;?</>,
              options: [
                "It updates every step instead of at the end of an episode",
                "It bootstraps from the value of the best next action regardless of what the exploratory policy actually does next, so it learns the greedy policy while behaving differently",
                "It never explores",
              ],
              answer: 1,
              explain: <>Off-policy = the policy being learned (greedy) differs from the policy generating behaviour
                (ε-greedy). SARSA bootstraps from the action actually taken, making the two the same policy —
                on-policy.</>,
            },
            {
              q: <>Expected SARSA&rsquo;s target had the same mean as SARSA&rsquo;s (~4.0) but a standard deviation of 0 instead of ~9. What does removing that variance buy?</>,
              options: [
                "A higher ceiling — it can reach scores the others cannot",
                "Steadier convergence and fewer catastrophes: same thing learned, without the jitter — which showed up as zero broken runs and the fewest spills",
                "Faster episodes",
              ],
              answer: 1,
              explain: <>Same mean ⇒ same target ⇒ same ceiling. The zero variance changes the path, not the
                destination: a safer step size and far less chance of being knocked into a bad basin.</>,
            },
            {
              q: <>Across ten seeds, the greedy returns piled up near 21 and 16.4 rather than scattering. What are those two values?</>,
              options: [
                "Measurement noise in the evaluation",
                "Two distinct stable policies — the risky doorway route (~21) and the safe bypass (~16.4) — with each run converging to one basin depending on its seed",
                "The scores before and after convergence",
              ],
              answer: 1,
              explain: <>The warehouse has two good policies. Which one an agent learns is decided by early
                exploration luck, not by the algorithm — the outcome is a distribution over basins, not a point.</>,
            },
            {
              q: <>Why did we refuse to report that &ldquo;SARSA learns the safe route, Q-learning the risky one&rdquo;?</>,
              options: [
                "It's an outdated result no longer taught",
                "We tested it over ten seeds and it didn't reproduce: Q reached the risky route 7/10 and SARSA 6/10 — indistinguishable, so the tidy story would have been fiction",
                "SARSA isn't a real algorithm",
              ],
              answer: 1,
              explain: <>The cliff-walking distinction is real in its original environment but invisible above the
                seed-to-seed variation here. Reporting it anyway would be exactly the error this capstone keeps
                warning against.</>,
            },
            {
              q: <>Expected SARSA has the highest mean (18.74) but reaches the good route least often (5/10). How?</>,
              options: [
                "The mean is calculated incorrectly",
                "It has zero broken runs, while Q-learning and SARSA each have one −3 catastrophe that drags their means down — in a multi-modal world the mean measures failure rate as much as skill",
                "It secretly finds a third, better route",
              ],
              answer: 1,
              explain: <>Its edge is reliability, not route quality. That is why you report the whole distribution:
                a single mean conflates &ldquo;how well it does&rdquo; with &ldquo;how often it fails.&rdquo;</>,
            },
          ]}
        />

        <TransferBox accent={OLIVE}>
          Compare algorithms on a distribution, not a point: tabulate the mean, the fraction reaching each basin,
          the typical best, and the failure count. Watch for means that are really failure-rate summaries in
          disguise, and prefer the method whose advantage <em>reproduces</em> across seeds — here, safety — over
          the one that merely looked best on the run you happened to see first.
        </TransferBox>

        <PlaybookRule n={14} accent={OLIVE}>
          <strong>Judge the added complexity by whether its benefit reproduces.</strong> Report a full distribution
          over seeds, distrust a mean in a multi-modal world, and verify any textbook effect on your own problem
          before you rely on it — the celebrated ones are real in their setting and often absent in yours.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/the-safety-tradeoff", label: <>← The safety trade-off</> }}
          next={{ href: "/learn/warehouse-robot-capstone/the-step-size", label: <>Next act · Make it work: tuning →</> }}
        />
      </div>
    </article>
  );
}
