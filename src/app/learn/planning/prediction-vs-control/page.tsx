import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
// Aliased: this page's own default export is also called PredictionVsControl.
import { PredictionVsControl as PredictionVsControlFigure } from "@/components/figures/planning/PlanningDiagrams";
import { GridRow } from "@/components/figures/planning/GridField";
import { V_RANDOM, V_STAR, PI_STAR } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "Prediction vs control — Manifold",
  description:
    "Two distinct questions in dynamic programming: prediction (evaluate a given policy) and control (find the best policy). The MDP track solved prediction; this track is about control.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PredictionVsControl() {
  const code = `import numpy as np
# The goal/pit world we'll plan in. make_goal_grid builds an MDP where reaching
# cell 15 pays +1, falling into cell 3 pays -1, and every step costs a little.
P, R = make_goal_grid()
gamma = 0.9
GOAL, PIT = 15, 3
nonterm = [s for s in range(nS) if s not in (GOAL, PIT)]

# PREDICTION: what is the equiprobable random policy worth here? (solved exactly,
# exactly as in the MDP track — this is not new).
pi = np.full((nS, nA), 1.0 / nA)
Ppi = np.einsum('sa,sat->st', pi, P); Rpi = (pi * R).sum(1)
V = np.zeros(nS)
V[nonterm] = np.linalg.solve(np.eye(len(nonterm)) - gamma * Ppi[np.ix_(nonterm, nonterm)], Rpi[nonterm])
print("PREDICTION — value of the random policy:")
show(V)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 7 minutes"
        title={<>Prediction vs <em>control</em></>}
        intro={<>Dynamic programming answers two different questions, and it is worth being crisp about which is
          which. One is a measurement; the other is a search. The last track spent all its energy on the
          measurement. This track is about the search — and the surprise is how directly the measurement leads to
          it.</>}
      />

      <div className="lesson">
        <h2>Two questions</h2>
        <p>
          Given an MDP, there are two things you might want:
        </p>
        <ul>
          <li>
            <strong>Prediction</strong> (also called <em>policy evaluation</em>): you are <em>given</em> a policy{" "}
            <M>{String.raw`\pi`}</M>, and you want its value function <M>{String.raw`V^\pi`}</M> — how good is this
            particular way of behaving? This is a measurement. There is nothing to choose.
          </li>
          <li>
            <strong>Control</strong>: you are given nothing but the world, and you want the <em>best</em> policy{" "}
            <M>{String.raw`\pi^*`}</M> and its value <M>{String.raw`V^*`}</M>. This is a search over all possible
            ways of behaving. This is the real goal.
          </li>
        </ul>
        <p>
          The MDP track solved prediction completely: the Bellman expectation equation is linear in the values, so{" "}
          <M>{String.raw`V^\pi = (I - \gamma P^\pi)^{-1}R^\pi`}</M> — one matrix solve and you know exactly what a
          policy is worth. Here it is again on the world we will plan in, just to fix that prediction is a settled,
          mechanical thing:
        </p>

        <PredictionVsControlFigure
          caption={<>The distinction the whole family is organised around. Prediction is handed the
            arrows and asked what they are worth; control is handed nothing and asked for the best
            arrows. They look like very different problems, and the last row is the reason they are
            not: the same Bellman backup, swept to convergence, answers both.</>}
        />

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`PREDICTION — value of the random policy:
 -0.40   -0.45   -0.60    0.00
 -0.36   -0.36   -0.38   -0.43
 -0.30   -0.24   -0.10    0.13
 -0.25   -0.13    0.22    0.00`}</CodeOutput>
        <p>
          A coin-flipping random walk on this grid is worth <em>negative</em> value almost everywhere — it wanders,
          paying the small step cost over and over, as likely to stumble into the pit as onto the goal. That is a
          precise answer to &ldquo;how good is the random policy?&rdquo; But it is not what we want. We want the{" "}
          <em>best</em> policy, and prediction alone will never hand it to us.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Prediction gives you V^π for one policy. Naively, how could you use it to find the best policy?"
          options={[
            "Evaluate every possible policy and keep the best — but there are A^S of them, astronomically many",
            "You can't use prediction for control at all",
            "Lower the discount factor until one policy wins",
          ]}
          nudge="Locked in. Brute force is hopeless — but prediction plus one clever step will get us there efficiently."
        />

        <GridRow
          grids={[
            { values: V_RANDOM, label: "prediction: Vπ for the random policy" },
            { values: V_STAR, policy: PI_STAR, label: "control: V* and π*" },
          ]}
          caption={<>Two answers to two questions, on one board and one colour scale. Wandering at random
            is worth a small negative amount almost everywhere — the step costs pile up faster than the
            goal pays out. Acting optimally is worth a positive amount everywhere. The gap between the
            grids is the value of having a plan at all.</>}
        />

        <h2>Why control looks hard — and isn&rsquo;t</h2>
        <p>
          The brute-force route to control is to enumerate every policy, evaluate each, and keep the winner. But a
          deterministic policy assigns one of <M>{String.raw`|\mathcal{A}|`}</M> actions to each of{" "}
          <M>{String.raw`|\mathcal{S}|`}</M> states, so there are <M>{String.raw`|\mathcal{A}|^{|\mathcal{S}|}`}</M>{" "}
          of them — on this tiny 14-cell grid already <M>{String.raw`4^{14} \approx 2.7\times 10^8`}</M>, and
          hopeless on anything real. Control cannot be search-by-listing.
        </p>
        <MathBlock>{String.raw`\text{control} \;=\; \arg\max_{\pi}\, V^\pi(s)\ \text{ for every } s \quad\text{— but not by trying them all.}`}</MathBlock>
        <p>
          The escape is the greedy step you already met. Evaluating a policy tells you not just how good it is, but{" "}
          <em>which actions would have been better</em> — and switching to those actions gives a strictly better
          policy. Prediction, used this way, becomes an engine for control. That interplay — evaluate, then improve
          — is the subject of the next page, and the heart of the whole track.
        </p>

        <Callout color={GOLD} title={<>Prediction is the subroutine; control is the loop</>}>
          Keep the two words straight and every algorithm here becomes legible. <strong>Prediction</strong>
          (policy evaluation) is a subroutine you already own. <strong>Control</strong> is a loop that calls it
          repeatedly, improving the policy between calls. Policy iteration and value iteration differ only in{" "}
          <em>how much prediction they do per improvement</em> — nothing more.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/planning", label: <>← Planning with a map</> }}
          next={{ href: "/learn/planning/evaluation-and-improvement", label: <>Next · Evaluation and improvement →</> }}
        />
      </div>
    </article>
  );
}
