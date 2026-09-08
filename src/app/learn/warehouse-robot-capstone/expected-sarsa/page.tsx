import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Expected SARSA — Manifold",
  description:
    "SARSA's target flinches with every random exploratory action it happens to sample. Expected SARSA removes that flinch by averaging over the whole policy instead of drawing one action — the target's variance drops from 9.1 to exactly 0, and the agent becomes the steadiest converger of the three.",
};

const OLIVE = "var(--c-warehouse)";

export default function ExpectedSarsa() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 3 · Learn it", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Expected SARSA</>}
        intro={<>
          SARSA&rsquo;s update depends on which random next action it happened to sample — so the very same
          transition teaches a different lesson depending on a coin flip. Expected SARSA replaces that coin flip
          with its average. One small change, and the update stops flinching.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion accent={OLIVE} label="The engineer's question" icon="🤖">
          My update target depends on a random action I sampled. Can I compute the <em>expectation</em> over that
          randomness directly, instead of paying for it as noise?
        </AnalystQuestion>

        <h2>The noise hiding in SARSA&rsquo;s target</h2>
        <p>
          SARSA bootstraps from <M>{String.raw`Q(s',a')`}</M>, where <M>a'</M> is the single action the{" "}
          <M>\varepsilon</M>-greedy policy drew for the next step. Most of the time that is the greedy action; one
          time in ten it is a random one, possibly a terrible one. So the target for the <em>same</em>{" "}
          <M>(s,a,r,s')</M> jumps around depending purely on which <M>a'</M> the coin selected. That jitter is not
          information — it is sampling noise, and every noisy update wastes a little of the step size on chasing a
          draw that will not recur.
        </p>
        <p>
          But we do not have to sample <M>a'</M> at all. We know the policy — it is our own{" "}
          <M>\varepsilon</M>-greedy rule — so we can compute the target&rsquo;s expectation in closed form,
          averaging over every action weighted by how often the policy takes it:
        </p>
        <MathBlock>{String.raw`r + \gamma \sum_{a'} \pi(a' \mid s')\,Q(s',a') \qquad \pi(a'\mid s') = \begin{cases}1-\varepsilon+\tfrac{\varepsilon}{|A|} & a' = \arg\max_{a}Q(s',a)\\[2pt] \tfrac{\varepsilon}{|A|} & \text{otherwise.}\end{cases}`}</MathBlock>
        <p>
          That is <strong>Expected SARSA</strong>. It is still on-policy — it is the expected value of the very
          policy the robot runs — so it prices in exploration exactly as SARSA does. It just refuses to estimate
          that expectation with a single noisy draw when it can compute it exactly. In code the sampled{" "}
          <code>Q[s2, a2]</code> becomes a dot product <code>pi @ Q[s2]</code>.
        </p>

        <h2>Watching the flinch disappear</h2>
        <p>
          Let&rsquo;s make the noise concrete. Take a trained agent, freeze it, and stand at one state next to the
          spill wall. Ask each method for its bootstrap target, and — for SARSA — ask it 5,000 times, redrawing the
          next action each time exactly as training would.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeVar} />
        <CodeOutput>{`Expected SARSA (seed 0, 6000 ep): return 20.97  delivered 100.0%  spills 0.119  steps 25.5

At state (1,3) empty, action=down, most-likely next state:
  SARSA target       : mean 4.024   std 9.105   (redrawn each visit)
  Expected-SARSA tgt  : 4.047          std 0.000   (one deterministic average)`}</CodeOutput>

        <PredictPrompt
          accent={OLIVE}
          prompt="The two targets have the same mean (≈4.03). SARSA's has a standard deviation of 9.1; Expected SARSA's is exactly 0. What does that buy?"
          options={[
            "A higher final score — less noise means a better policy",
            "The same policy, reached more steadily — the noise was never signal, so removing it mainly stabilises learning, letting you use a larger step size safely",
            "Nothing measurable — variance in the target doesn't affect tabular learning",
          ]}
          nudge="Locked in. Same mean means same thing being learned; zero variance means it's learned without the jitter. The payoff is stability, not a higher ceiling — and stability is worth more than it sounds, as the next page's re-runs show."
        />

        <h2>Same target, no jitter</h2>
        <p>
          Both methods aim at the same place — mean <strong>4.02</strong> versus <strong>4.05</strong>, identical
          to within rounding. That has to be true: Expected SARSA is <em>defined</em> as the expectation SARSA is
          noisily sampling. The difference is entirely in the spread. SARSA&rsquo;s target carries a standard
          deviation of <strong>9.1</strong> at this state — most visits return the greedy value, but the
          one-in-ten exploratory draw yanks it far away, and that yank enters the update every time it happens.
          Expected SARSA&rsquo;s target has a standard deviation of <strong>zero</strong>: it computes the average
          once, exactly.
        </p>
        <p>
          Removing variance from the target does not change what is being learned — the mean is the same — so it
          does not raise the ceiling. What it changes is the <em>path</em> there. Lower-variance updates let you
          use a larger step size without the estimates rattling around, and they make the agent far less likely to
          be knocked into a bad corner of policy space by an unlucky run of draws. On this warehouse that shows up,
          on its own run, as the same near-oracle score (<strong>20.97</strong>) — and, across many runs, as the
          steadiest behaviour of the three algorithms, which is precisely the comparison the next page makes.
        </p>

        <Callout color={OLIVE} title={<>The cost, and when it is worth paying</>}>
          Expected SARSA is not free: the sampled update touches one entry of <M>Q[s']</M>, while the expected
          update reads all of them to form the dot product — <M>{String.raw`|A|`}</M> times the work per step. With
          four actions that is nothing. With thousands of actions, or a continuous action space, the sum becomes a
          real expense and sampling starts to look attractive again. This is the recurring shape of the
          bias&ndash;variance&ndash;compute triangle in RL: you can usually spend computation to buy a lower-variance
          estimate, and whether you should depends entirely on how expensive your actions are to enumerate. For a
          warehouse robot with four moves, always pay it.
        </Callout>

        <TransferBox accent={OLIVE}>
          Whenever an update target depends on a quantity you sampled but whose distribution you actually know,
          check whether you can take the expectation in closed form instead. It keeps the target&rsquo;s mean and
          deletes its variance, which almost always buys steadier learning and a safer step size. Reach back for
          sampling only when the expectation is too expensive to compute — many actions, or a continuous space.
        </TransferBox>

        <PlaybookRule n={12} accent={OLIVE}>
          <strong>Replace a sampled action in the target with an expectation over the policy when you can afford
          it</strong> — Expected SARSA keeps SARSA&rsquo;s mean, drops its target variance to zero, and trades{" "}
          <M>{String.raw`|A|\times`}</M> compute per step for steadier convergence.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/sarsa", label: <>← SARSA</> }}
          next={{ href: "/learn/warehouse-robot-capstone/the-safety-tradeoff", label: <>Next up · The safety trade-off →</> }}
        />
      </div>
    </article>
  );
}

const codeVar = `def train(kind, episodes=6000, alpha=0.1, eps=0.1, seed=0):
    e = Warehouse(seed); Q = np.zeros((nS, nA))
    for ep in range(episodes):
        s = e.reset("uniform"); a = eps_greedy(Q, s, eps, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)
            if done:
                Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, eps, e.rng)
            if kind == "sarsa":
                target = r + GAMMA * Q[s2, a2]                 # one sampled next action
            else:  # expected sarsa
                pi = np.full(nA, eps / nA); pi[np.argmax(Q[s2])] += 1 - eps
                target = r + GAMMA * float(pi @ Q[s2])          # average over the policy
            Q[s, a] += alpha * (target - Q[s, a])
            s, a = s2, a2
    return Q

Q = train("exp", seed=0)
r = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
print("Expected SARSA (seed 0, 6000 ep): return %.2f  delivered %.1f%%  spills %.3f  steps %.1f"
      % (r["ret"], r["delivered"] * 100, r["spills"], r["steps"]))

# how noisy is each bootstrap target at one hazard-adjacent state?
eps = 0.1
s = sid(1, 3, 0); a = int(np.argmax(Q[s]))
s2, rr, done = _transition(s, a)                      # the most likely (no-slip) landing
pi = np.full(nA, eps / nA); pi[np.argmax(Q[s2])] += 1 - eps
exp_t = rr + GAMMA * float(pi @ Q[s2])
rng = np.random.default_rng(0)
draws = [rr + GAMMA * Q[s2, (int(rng.integers(nA)) if rng.random() < eps else int(np.argmax(Q[s2])))]
         for _ in range(5000)]
print("\\nAt state (1,3) empty, action=%s, most-likely next state:" % ACTIONS[a])
print("  SARSA target       : mean %.3f   std %.3f   (redrawn each visit)" % (np.mean(draws), np.std(draws)))
print("  Expected-SARSA tgt  : %.3f          std 0.000   (one deterministic average)" % exp_t)`;
