import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { PolicyIterationLab } from "@/components/labs/PolicyIterationLab";

export const metadata = {
  title: "Watching policy iteration run — Manifold",
  description:
    "An interactive policy-iteration lab: drive the two levers by hand on a goal-and-pit gridworld. Run one evaluation sweep, one greedy improvement, and watch the value seep and the arrows lock onto the goal.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WatchingPolicyIteration() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Interactive", color: GOLD }]}
        time="about 7 minutes"
        title={<>Watching policy iteration <em>run</em></>}
        intro={<>The algorithm is short enough to read in a minute, but the way value floods the grid and the arrows
          swing into place is the kind of thing you have to <em>watch</em> to feel. This page hands you the two
          levers directly. Pull them in any order and see the loop climb to the optimum in front of you.</>}
      />

      <div className="lesson">
        <h2>Drive it yourself</h2>
        <p>
          The lab starts from a deliberately bad policy — every cell pointing <em>up</em>, into the walls and away
          from the goal — with all values at zero. You have two buttons. <strong>Evaluate ×1</strong> runs a single
          sweep of policy evaluation: each cell&rsquo;s value is updated to reward-plus-discounted-neighbour under
          the arrows you currently have. <strong>Improve</strong> makes every arrow greedy with respect to the
          current values.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>First press <strong>Evaluate ×1</strong> a few times and watch Δ (the largest change) shrink as
            value seeps outward from the goal under the starting policy. Then press <strong>Improve</strong> once and
            watch the arrows snap toward higher-value neighbours. Alternate a couple more rounds by hand, then hit{" "}
            <strong>Run to optimal</strong> to finish — note how few <em>improve</em> steps it takes, and that the
            final arrows route <em>around</em> the pit.</>}
          insight={<>Evaluation and improvement chase each other. Evaluation makes the numbers honest about the
            arrows; improvement makes the arrows greedy about the numbers. Neither alone gets anywhere — evaluate
            and the policy is frozen; improve and the numbers go stale — but alternated, each lifts the other until
            the policy stops changing. That fixed point is <M>{String.raw`\pi^*`}</M>: the arrows form a single flow
            to the <span style={{ color: "var(--good)" }}>goal</span> and never point into the{" "}
            <span style={{ color: "var(--bad, #c0392b)" }}>pit</span>.</>}
        >
          <PolicyIterationLab />
        </LabFrame>

        <PredictPrompt
          accent={GOLD}
          prompt="If you press Improve BEFORE running any evaluation (values all still 0), what happens?"
          options={[
            "The policy jumps straight to optimal",
            "Nothing useful — with all values equal, every action ties, so greedy can't distinguish them yet",
            "It throws an error",
          ]}
          nudge="Locked in. Improvement needs a value signal to be greedy about; flat values give it nothing to grip."
        />

        <Callout color={GOLD} title={<>The two things worth noticing</>}>
          <strong>One:</strong> value spreads <em>outward from the goal</em>, one ring per evaluation sweep — the{" "}
          <M>{String.raw`+1`}</M> has to propagate through the Bellman backup to reach distant cells. <strong>Two:</strong>{" "}
          the arrows become optimal in far fewer <em>improvement</em> steps than the values take to fully settle.
          The policy is a coarser object than the value function, and it locks in early — a fact the next page turns
          into a genuinely surprising result.
        </Callout>

        <p>
          When you have played enough, move on: we&rsquo;ll pin down <em>why</em> policy iteration needs so few
          improvement steps, and meet the classic demonstration that the optimal policy appears long before the
          values do.
        </p>

        <PrevNext
          prev={{ href: "/learn/planning/why-policy-iteration-works", label: <>← Why it reaches the optimum</> }}
          next={{ href: "/learn/planning/how-many-iterations", label: <>Next · How few iterations it takes →</> }}
        />
      </div>
    </article>
  );
}
