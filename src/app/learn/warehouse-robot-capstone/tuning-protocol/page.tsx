import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";

export const metadata = {
  title: "Tuning without fooling yourself — Manifold",
  description:
    "Every knob in Act 4 could be tuned into a lie. The vanilla config looks perfect on seed 2 (21.1) and fails a third of the time across ten seeds. A tuning protocol — many seeds, a tuning/reporting split, the whole distribution — is what separates a real improvement from a lucky one.",
};

const OLIVE = "var(--c-warehouse)";

const cell: React.CSSProperties = { padding: "7px 12px", borderBottom: "1px solid var(--border)", fontSize: 14.5 };
const num: React.CSSProperties = { ...cell, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const head: React.CSSProperties = { ...cell, fontWeight: 600, color: "var(--muted)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.04em" };

export default function TuningProtocol() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 4 · Make it work", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Tuning without fooling yourself</>}
        intro={<>
          We just found three knobs that each rescue a broken agent. That is exactly the situation in which it is
          easiest to lie to yourself — a knob that &ldquo;fixed it&rdquo; on the run you happened to watch may have
          done nothing at all. This page is the protocol that keeps tuning honest, and it closes the act.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={4} n={18}>
          When I change a hyperparameter and the score goes up, how do I know I improved the agent rather than
          re-rolled the dice — and that I am not just fitting my knobs to noise?
        </WorkOrder>

        <h2>The trap: one seed makes any config look decided</h2>
        <p>
          Recall the vanilla Act-3 configuration — <M>{String.raw`\alpha = 0.1`}</M>, fixed{" "}
          <M>{String.raw`\varepsilon = 0.1`}</M>. Suppose, as almost everyone does, you developed it while watching
          a single training run. If that run happened to be seed 2, here is what you saw, and what was actually
          true:
        </p>

        <div style={{ overflowX: "auto", margin: "1.6rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 480 }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: "left" }}>What you measured</th>
                <th style={head}>Return</th>
                <th style={head}>Verdict you&rsquo;d reach</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cell}>Vanilla on seed 2 alone</td>
                <td style={num}>21.1</td>
                <td style={cell}>&ldquo;Solved. Ship it.&rdquo;</td>
              </tr>
              <tr>
                <td style={{ ...cell, fontWeight: 600 }}>Vanilla over 10 seeds</td>
                <td style={{ ...num, fontWeight: 600 }}>17.66</td>
                <td style={{ ...cell, color: "var(--bad)" }}>7/10 good, 1 broken, 2 mediocre</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Seed 2 gave <strong>21.1</strong> — the ceiling. On that evidence you would conclude there was no
          exploration problem to solve, never write Act 4, and deploy a configuration that <strong>fails roughly a
          third of the time</strong>. The single run did not lie about seed 2; it lied about <em>the
          configuration</em>, by presenting one draw from a wide distribution as if it were the distribution.
          Everything in this act — the α cliff, the annealing win, the optimism sweep — was only visible because we
          refused to trust one seed.
        </p>

        <h2>The protocol</h2>
        <p>
          Three rules, each closing a specific way tuning goes wrong.
        </p>
        <ul>
          <li>
            <strong>Judge every candidate on a distribution, not a run.</strong> Train several seeds per
            configuration and compare their <em>summaries</em> — mean, the fraction reaching the good basin, the
            failure count. A change is only real if it moves the distribution, not one lucky member of it.
          </li>
          <li>
            <strong>Separate the seeds you tune on from the seeds you report on.</strong> If you pick the winning
            hyperparameters using seeds 0&ndash;9 and then report on seeds 0&ndash;9, you have overfit your knobs to
            those particular runs — the RL version of testing on your training set. Tune on one set of seeds, quote
            your final number on a fresh, untouched set. The evaluation seed we have fixed at 999 all along was
            never a tuning seed, on purpose.
          </li>
          <li>
            <strong>Report the spread and the failures, never just the best.</strong> &ldquo;Our agent scores
            21&rdquo; is meaningless without &ldquo;…on 8 of 10 seeds, with one catastrophic failure.&rdquo; The
            worst run is often the number that decides whether you can deploy at all.
          </li>
        </ul>

        <PredictPrompt
          accent={OLIVE}
          prompt="We compare the vanilla config against a tuned one (α unchanged, but ε annealed 1.0 → 0.05) — properly, over ten seeds. What separates them?"
          options={[
            "Nothing much — both reach ~21 on their best runs",
            "The mean and the reliability: the tuned config reaches the ceiling on all ten seeds with no failures, while vanilla manages seven",
            "The tuned one is higher on its best seed but more variable",
          ]}
          nudge="Locked in. The tuned config's win isn't a higher ceiling — both top out near 21. It's that it gets there every single time."
        />

        <h2>A real improvement, measured properly</h2>
        <p>
          Here is the comparison done the honest way — the whole distribution, side by side.
        </p>

        <div style={{ overflowX: "auto", margin: "1.6rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: "left" }}>Configuration</th>
                <th style={head}>Mean</th>
                <th style={head}>Reaches ceiling</th>
                <th style={head}>Broken runs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cell}>Vanilla — α 0.1, fixed ε 0.1</td>
                <td style={num}>17.66</td>
                <td style={num}>7 / 10</td>
                <td style={num}>1</td>
              </tr>
              <tr>
                <td style={{ ...cell, fontWeight: 600, color: OLIVE }}>Tuned — α 0.1, ε annealed 1.0→0.05</td>
                <td style={{ ...num, fontWeight: 600 }}>21.10</td>
                <td style={{ ...num, fontWeight: 600, color: "var(--good)" }}>10 / 10</td>
                <td style={{ ...num, fontWeight: 600, color: "var(--good)" }}>0</td>
              </tr>
              <tr>
                <td style={{ ...cell, color: "var(--muted)" }}>oracle ceiling</td>
                <td style={{ ...num, color: "var(--muted)" }}>21.21</td>
                <td style={{ ...num, color: "var(--muted)" }}>—</td>
                <td style={{ ...num, color: "var(--muted)" }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.4rem" }}>
          10 seeds, 15,000 episodes, greedy evaluation on seed 999. From <code>rl_capstone_cases.py</code>.
        </p>
        <p>
          <strong>21.10 against the oracle&rsquo;s 21.21, on every seed, with zero failures.</strong> This is a real
          improvement, and now we can say so with a straight face: it is not one lucky run beating one unlucky one,
          it is the entire distribution moving to the ceiling and staying there. The lottery Act 3 discovered is, for
          practical purposes, closed — by tuning <em>when</em> the agent explores, verified the way tuning has to be.
        </p>

        <Callout color={OLIVE} title={<>The meta-trap: overfitting the knobs themselves</>}>
          There is a subtler failure lurking one level up. If you try forty hyperparameter combinations and pick the
          one with the best ten-seed mean, that winner is partly good and partly <em>lucky across those ten
          seeds</em> — you have optimised against the evaluation noise, and its true performance is a little worse
          than it looked. The more configurations you search, the larger this optimism. The defences are the same as
          in supervised learning: hold out seeds you never tune against and report on those; prefer the simplest
          configuration whose distribution is statistically indistinguishable from the best; and be suspicious of a
          &ldquo;winner&rdquo; that beat the runner-up by less than the spread. Tuning is model selection, and it
          has all the same ways to fool you.
        </Callout>

        <h2>What Act 4 accomplished</h2>
        <p>
          We arrived from Act 3 with an agent that reached the ceiling only when it was lucky. We leave with one
          that reaches it every time, and — more importantly — with an account of <em>why</em> each knob works: α
          controls the noise in the estimates, the exploration schedule controls whether the good route is ever
          discovered, optimism substitutes a prior belief for random search, and the protocol above is what lets you
          tell a genuine fix from a fortunate seed. Act 5 stops tuning and starts interrogating: we read the policy
          the agent actually learned, hunt for its failure modes, and name the things it can never know.
        </p>

        <Quiz
          accent={OLIVE}
          title="Act 4 checkpoint"
          questions={[
            {
              q: <>On a stochastic problem, why did α = 1.0 leave 9 of 10 runs broken while α = 0.02 reached the ceiling every time?</>,
              options: [
                "α = 1.0 learns too slowly to finish in 15000 episodes",
                "α = 1.0 overwrites the estimate with each noisy sample, so the values never settle; a small α averages the slip out and produces a trustworthy greedy policy",
                "α = 0.02 explores more",
              ],
              answer: 1,
              explain: <>With randomness in the returns, the step size is an averaging window. Too large a step chases
                noise and destroys convergence — it is a stability dial, not just a speed dial.</>,
            },
            {
              q: <>A fixed ε = 0.1 gets an agent stuck in the safe basin. What is the mechanism?</>,
              options: [
                "0.1 is simply too small a number",
                "After a couple of early spills the doorway's value drops, the agent then visits it only on rare random steps, and never gathers enough evidence to discover the spills were unlucky — a self-fulfilling bad estimate",
                "Fixed ε makes the learning rate unstable",
              ],
              answer: 1,
              explain: <>Annealing from high ε fixes it by exploring the doorway thoroughly while estimates are still
                forming — heavy early exploration is what discovers the better route.</>,
            },
            {
              q: <>Optimistic initialisation at +50 helped, but +25 was worse than 0. Why?</>,
              options: [
                "+25 is an unlucky number",
                "Optimism only drives systematic exploration when the initial value exceeds every true value; a partway value explores some regions thoroughly while letting the high-value route look merely average, biasing the search",
                "Higher initial values always learn faster",
              ],
              answer: 1,
              explain: <>Set the optimistic value above the maximum achievable return, or you get biased exploration
                with no guarantee — the same &ldquo;well-meaning number, unchecked against the scale&rdquo; trap as
                naive reward shaping.</>,
            },
            {
              q: <>The vanilla config scored 21.1 on seed 2 but 17.66 averaged over ten seeds. What is the lesson?</>,
              options: [
                "Seed 2 was buggy",
                "A single run reports one draw from a wide distribution as if it were the distribution; tuning or judging a configuration on one seed hides failures that a multi-seed protocol exposes",
                "Ten seeds is too few to be reliable",
              ],
              answer: 1,
              explain: <>Everything in Act 4 was only visible because we refused to trust one seed. Judge a
                configuration on its distribution, not a run.</>,
            },
            {
              q: <>Why report your final number on seeds you didn&rsquo;t tune on?</>,
              options: [
                "To save computation",
                "Picking hyperparameters on the same seeds you then report overfits the knobs to those runs' noise — the RL version of testing on your training set — so the quoted number is optimistic",
                "Because more seeds are always better",
              ],
              answer: 1,
              explain: <>Tuning is model selection and carries the same risks. Hold out seeds you never tune against,
                and be suspicious of a winner that beat the field by less than the spread.</>,
            },
          ]}
        />

        <TransferBox>
          Build a tuning harness before you tune: a function that takes a configuration, trains N seeds, and returns
          the distribution — mean, basin fractions, worst case. Choose hyperparameters on one set of seeds and
          report on another. Treat a change as real only when it moves the distribution by more than its spread, and
          always publish the failure count alongside the average.
        </TransferBox>

        <PlaybookRule n={18}>
          <strong>Tune against a distribution over many seeds, split tuning seeds from reporting seeds, and quote the
          spread and the worst case — never the best run.</strong> A hyperparameter that &ldquo;fixed it&rdquo; on
          one seed may have changed nothing; searching many configs optimises against noise unless you hold seeds
          out.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/optimism-and-initialisation", label: <>← Optimism and initialisation</> }}
          next={{ href: "/learn/warehouse-robot-capstone/reading-the-policy", label: <>Next act · Evaluate & interpret →</> }}
        />
      </div>
    </article>
  );
}
