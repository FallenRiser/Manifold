import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "SARSA: valuing the policy you run — Manifold",
  description:
    "SARSA is Q-learning with one symbol changed — bootstrap from the action you'll actually take, not the best one. That single edit switches the agent from learning the value of optimal play to learning the value of its own exploratory behaviour. What that does, and when the difference matters.",
};

const OLIVE = "var(--c-warehouse)";

export default function Sarsa() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 3 · Learn it", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>SARSA: valuing the policy you run</>}
        intro={<>
          The smallest interesting change in this whole capstone: take Q-learning and swap one term in the target.
          The code barely moves. What the agent is learning changes completely — from &ldquo;how good is optimal
          play?&rdquo; to &ldquo;how good is what I actually do, exploration and all?&rdquo;
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={3} n={11}>
          Do I want to learn the value of the <em>best</em> policy, or the value of the policy I am actually
          running — random exploratory mistakes included? And which one matches how this agent will be used?
        </WorkOrder>

        <h2>One symbol</h2>
        <p>
          Put the two targets side by side. Q-learning bootstraps from the best available next action; SARSA
          bootstraps from the action it is <em>actually going to take</em> next:
        </p>
        <MathBlock>{String.raw`\text{Q-learning:}\quad r + \gamma\,\max_{a'} Q(s',a') \qquad\qquad \text{SARSA:}\quad r + \gamma\,Q(s',a').`}</MathBlock>
        <p>
          In SARSA the <M>a'</M> is the next action the <M>\varepsilon</M>-greedy policy has already chosen — the
          same <M>a'</M> the robot will execute on the next step. The name is literally the tuple the update needs:{" "}
          <strong>S</strong>tate, <strong>A</strong>ction, <strong>R</strong>eward, next <strong>S</strong>tate,
          next <strong>A</strong>ction. Drop the <M>{String.raw`\max`}</M>, use the action you sampled, and
          Q-learning becomes SARSA.
        </p>
        <p>
          That is the entire code difference — a single line in the loop:
        </p>
        <MathBlock>{String.raw`\texttt{target = r + GAMMA * Q[s2, a2]}\quad\text{instead of}\quad\texttt{target = r + GAMMA * Q[s2].max()}`}</MathBlock>

        <h2>Off-policy versus on-policy, concretely</h2>
        <p>
          This one symbol is the definition of a deep distinction. Q-learning is <strong>off-policy</strong>: the
          target assumes optimal play from <M>s'</M> onward, regardless of what the robot really does next. It
          learns about the greedy policy while behaving exploratorily — the behaviour and the thing being learned
          are two different policies.
        </p>
        <p>
          SARSA is <strong>on-policy</strong>: the target uses the action the exploratory policy actually picked, so
          it learns the value of <em>that</em> policy — the <M>\varepsilon</M>-greedy one, including the cost of its
          own random mistakes. The behaviour and the thing being learned are the same policy.
        </p>
        <p>
          The consequence is intuitive once you see where it bites. Consider a state next to a spill. Sometimes
          exploration will fire a random action there and shove the robot into the hazard. Q-learning&rsquo;s target
          ignores that — it assumes the best action is taken next, so the state looks safe. SARSA&rsquo;s target
          <em> includes</em> those occasional exploratory disasters in its average, so the same state looks a little
          more dangerous. On-policy learning quietly prices in the risk of being an explorer.
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="Because SARSA prices in its own exploration, what do you expect of the policy it learns near the spill wall, compared with Q-learning?"
          options={[
            "It should prefer routes with more clearance from the spills, even if they're a little longer",
            "It should be identical — both converge to the same optimal policy in the end",
            "It should take more risks, since it understands the hazard better",
          ]}
          nudge="Hold that thought. The instinct is exactly right in theory — SARSA should lean safer. Whether that instinct survives contact with this warehouse is the question the next two pages settle, and the answer is not the tidy one."
        />

        <h2>Running it</h2>
        <p>
          Same skeleton as the Q-learning page, same hyperparameters, one line changed. We train once from seed 0
          and evaluate the greedy policy.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={code} />
        <CodeOutput>{`SARSA (seed 0, 6000 episodes)
   greedy return  20.84   delivered 100.0%   spills 0.107   steps 25.9`}</CodeOutput>
        <p>
          <strong>20.84</strong>, 100% delivered — essentially the same as Q-learning&rsquo;s{" "}
          <strong>21.21</strong> on this run, and essentially the oracle. On the strength of one seed you would
          happily conclude the two algorithms are interchangeable here.
        </p>
        <p>
          Resist that conclusion. A single training run is a single sample from a noisy process, and the
          theoretical difference we just reasoned through — SARSA pricing in its exploration — is real; the
          question is only whether it is <em>large enough to see</em> on this particular warehouse. The honest way
          to find out is not to stare harder at one number. It is to run the thing many times and look at the whole
          distribution of outcomes, which is exactly what the safety-trade-off page does next.
        </p>

        <Callout color={OLIVE} title={<>Why keep an on-policy method at all?</>}>
          If Q-learning learns the optimal policy directly, why would anyone use SARSA? Because &ldquo;optimal&rdquo;
          assumes you will stop exploring and act greedily — and sometimes you will not. A recommender that keeps
          testing new items, a controller that must keep probing to stay adaptive, any agent that{" "}
          <em>continues to explore in production</em> is better served by a method that values the policy it will
          actually run, exploration included. On-policy is not a weaker Q-learning; it answers a different question
          — <em>&ldquo;how good is my behaviour?&rdquo;</em> rather than <em>&ldquo;how good could I be if I
          stopped exploring?&rdquo;</em> The right choice is a fact about your deployment, not about the algorithms.
        </Callout>

        <TransferBox>
          Decide on-policy versus off-policy from how the agent will be used, not from which one sounds more
          advanced. If it will act greedily in production, Q-learning&rsquo;s target matches; if it will keep
          exploring, SARSA&rsquo;s does. And when a theoretical difference between two methods is real but small,
          do not adjudicate it on one run — a single training seed cannot distinguish a genuine effect from luck.
        </TransferBox>

        <PlaybookRule n={11}>
          <strong>Bootstrap from the action you will actually take (on-policy, SARSA) when exploration continues in
          deployment; bootstrap from the best action (off-policy, Q-learning) when you will act greedily.</strong>{" "}
          The choice is set by your deployment, and it is one changed symbol in the target.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/q-learning", label: <>← The first agent: Q-learning</> }}
          next={{ href: "/learn/warehouse-robot-capstone/expected-sarsa", label: <>Next up · Expected SARSA →</> }}
        />
      </div>
    </article>
  );
}

const code = `def train(kind, episodes=6000, alpha=0.1, eps=0.1, seed=0):
    e = Warehouse(seed)
    Q = np.zeros((nS, nA))
    for ep in range(episodes):
        s = e.reset("uniform")
        a = eps_greedy(Q, s, eps, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)
            if done:
                Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, eps, e.rng)         # the action we'll ACTUALLY take next
            if kind == "q":
                target = r + GAMMA * Q[s2].max()        # best next action  (off-policy)
            else:  # sarsa
                target = r + GAMMA * Q[s2, a2]          # chosen next action (on-policy)
            Q[s, a] += alpha * (target - Q[s, a])
            s, a = s2, a2
    return Q

Q = train("sarsa", seed=0)
r = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
print("SARSA (seed 0, 6000 episodes)")
print("   greedy return %6.2f   delivered %.1f%%   spills %.3f   steps %.1f"
      % (r["ret"], r["delivered"] * 100, r["spills"], r["steps"]))`;
