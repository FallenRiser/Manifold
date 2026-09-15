import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Curve } from "@/components/figures/fa/Curve";
import { WIDTH_DIAL } from "@/components/figures/fa/data";

export const metadata = {
  title: "Reading a learning curve that lies — Manifold",
  description:
    "Between episodes 175 and 200 the training curve rises from 333.4 to 360.0 while the frozen agent's real score falls from 394.6 to 269.3. Six ways the curves in this track misled us, each with the check that catches it.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ReadingALearningCurve() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 12 minutes"
        title={<>Reading a learning curve that lies</>}
        intro={<>Every claim in this track rests on a curve or a table of numbers, and building them turned up
          six distinct ways those numbers mislead you. None of these are hypothetical: each one nearly made it
          onto a page as a false statement, and one of them did.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The two-line problem</h2>
        <p>
          A training curve plots the returns the agent collected <em>while learning</em>. That agent was
          exploring, its weights changed during every episode, and the average smears together twenty-five
          different policies. The thing you eventually deploy is none of those: it is one frozen set of weights,
          acting greedily.
        </p>
        <p>
          Chapter 3 already showed those two can disagree completely — an agent whose curve said 136 steps could
          not finish at all once frozen. Here is the same comparison for DQN, taken every 25 episodes.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The training curve climbs to around 360 steps by episode 200. What does the frozen greedy
            agent — the thing you would actually deploy — score over the same run?</>}
          options={["It tracks the training curve closely", "Consistently higher", "Consistently lower", "Identical, by construction"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`the same agent, measured two ways

    episode   training (last 25)   frozen + greedy
         25                 26.0              22.9
         50                 32.2              43.8
         75                 55.0              97.0
        100                268.3             377.3
        125                356.4             387.7
        150                385.3             395.8
        175                389.5             415.6
        200                358.6             449.3

   best evaluation: 449.3 at episode 200
   final evaluation: 449.3 at episode 200
   training curve over that stretch: 358.6 -> 358.6`}</CodeOutput>

        <p>
          The first thing to notice is the <strong>level</strong>. From episode 100 onward the frozen agent is
          worth 377 while the training curve says 268 — it is <strong>40% better than its own learning curve
          claims</strong>. Two reasons, both structural: the training average still includes{" "}
          <M>{String.raw`\varepsilon = 0.05`}</M> of random actions, and it averages twenty-five episodes
          produced by twenty-five <em>different</em> policies, most of them older and worse than the current one.
          A training curve is a lagging, noisy, pessimistic estimate of the thing you care about.
        </p>
        <p>
          The second thing is what this particular run does <em>not</em> show, and that is the more useful lesson.
          Here the last checkpoint is also the best one, so stopping at episode 200 costs nothing. Run the same
          experiment across five seeds and that turns out to be luck:
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Seed</th><th style={thR}>best evaluation</th><th style={thR}>at episode</th>
                <th style={thR}>final</th><th style={thR}>drop</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>0</td><td style={tdR}>394.6</td><td style={tdR}>175</td><td style={tdR}>269.3</td><td style={{ ...tdR, color: "var(--bad)" }}>−31.8%</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1</td><td style={tdR}>264.8</td><td style={tdR}>175</td><td style={tdR}>233.1</td><td style={tdR}>−12.0%</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>2</td><td style={tdR}>263.1</td><td style={tdR}>175</td><td style={tdR}>253.6</td><td style={tdR}>−3.6%</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>3</td><td style={tdR}>409.5</td><td style={tdR}>200</td><td style={tdR}>409.5</td><td style={tdR}>0%</td></tr>
              <tr><td style={td}>4</td><td style={tdR}>224.9</td><td style={tdR}>200</td><td style={tdR}>224.9</td><td style={tdR}>0%</td></tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>In three runs of five the final agent is not the best agent</strong>, and in the worst case
          keeping training past episode 175 threw away a third of the performance. Seed 0 is the sharpest
          version: its evaluation fell 394.6 → 269.3 while its training curve <em>rose</em> from 333.4 to 360.0 —
          the two measurements pointing in opposite directions over the same episodes. That outright reversal is
          rare (it happens in 3 of 35 consecutive checkpoint intervals we measured); the milder version, where
          the curve keeps climbing and the deployed agent quietly stops improving, is the common case.
        </p>
        <p>
          And note what just happened on this page. The run printed above comes from the browser; the same code
          under CPython produces seed 0&rsquo;s collapse instead. <strong>The cell you ran may not show the
          phenomenon the page is about</strong> — which is precisely why the claim rests on the five-seed table
          and not on the run in front of you.
        </p>

        <Curve
          x={WIDTH_DIAL.x}
          series={WIDTH_DIAL.series}
          xlabel="episode (10-episode moving average, 5 seeds)"
          ylabel="steps to the goal"
          caption={<>A curve that lies, and the lie is ordinary rather than exotic. Read the first
            thirty episodes and the coarse coder is winning by a mile; stop there — as a sweep with
            a short budget would — and you publish the wrong answer, because by episode 200 it is
            the worst of the three. Nothing here is noise or a bug: each line is a 5-seed average and
            every one of them is a real measurement of the thing it claims to measure. Curves cross,
            and where you stop looking decides what you conclude.</>}
        />

        <h2>The six ways, and the check for each</h2>
        <p>
          Every row of this table is a mistake this track actually made or nearly made:
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>The lie</th><th style={th}>Where it bit</th><th style={th}>The check</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>The curve measures a different agent</td>
                <td style={td}>Mountain Car: curve said 136 steps, frozen policy reached the goal 79/100</td>
                <td style={td}>Freeze the weights, turn exploration off, evaluate on fixed starts</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>One seed is not a result</td>
                <td style={td}>Width dial: four seeds near 157, one at 223.8. No-target DQN: sd 163.4</td>
                <td style={td}>Report mean ± sd over seeds; measure the noise before reading the signal</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>The verdict flips with the horizon</td>
                <td style={td}>Target network, same seed: wins 385–160 at 150 episodes, loses 339–449 at 300</td>
                <td style={td}>Fix the budget in advance; report the whole curve, not its endpoint</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Comparing methods at one hyperparameter compares hyperparameters</td>
                <td style={td}>Tile coding looked worse than aggregation (0.0734 vs 0.0536) at a shared α</td>
                <td style={td}>Tune each contender, then compare their best</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>A short run hides divergence</td>
                <td style={td}>Baird at α = 10⁻⁴: a tame 13.79 at 1k steps, 661.6 by 100k</td>
                <td style={td}>Watch <M>{String.raw`\|\mathbf{w}\|`}</M>, and run long enough to see the trend</td>
              </tr>
              <tr>
                <td style={td}>Good returns can hide broken values</td>
                <td style={td}>DQN balancing well while predicting 107.96 on a task capped at 99.3</td>
                <td style={td}>Compare predicted value against actual return; check it is even possible</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout color={GOLD} title={<>The one that actually got through</>}>
          Chapter 3&rsquo;s first draft claimed that 8×8 tiles beat 16×16 on Mountain Car, based on 124.0 against
          129.1 from a single seed. Running five seeds showed that gap sitting comfortably inside the noise, and
          the claim was wrong — not badly wrong, but stated with a confidence the evidence never supported. It is
          in the published notes as a correction rather than quietly deleted.
          <br /><br />
          The uncomfortable part is that the false version was <em>more</em> interesting: a crisp, counterintuitive
          &ldquo;more resolution is worse&rdquo;. Curves lie most persuasively when they tell you something worth
          writing down.
        </Callout>

        <h2>A protocol that survives contact with reality</h2>
        <ol>
          <li><strong>Decide the budget before you look.</strong> Episodes, seeds, and the metric — written down
            first, so &ldquo;let it run a bit longer&rdquo; cannot become a result.</li>
          <li><strong>Evaluate separately from training.</strong> Frozen weights, no exploration, a fixed set of
            starts the agent never trained on.</li>
          <li><strong>Three seeds minimum, five if the effect is small.</strong> Report the spread, not just the
            mean; if the difference is inside one standard deviation, say so.</li>
          <li><strong>Keep the checkpoint that evaluated best</strong>, not the one from the last episode — in
            three of our five runs those were different agents, and in one the gap was 31.8%.</li>
          <li><strong>Watch a second quantity</strong> — the weight norm, or predicted-versus-actual value. Both
            failures in this chapter were invisible in returns and obvious in something else.</li>
        </ol>

        <p>
          None of this is specific to reinforcement learning, but RL punishes sloppiness here harder than
          supervised learning does, because the agent generates its own data: a small early advantage compounds
          into a different dataset, and two runs that differ by one floating-point rounding can end up in
          different worlds.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/double-dqn", label: <>← Double DQN</> }}
          next={{ href: "/learn/function-approximation/what-approximation-cant-do", label: <>Next · What approximation still can&rsquo;t do →</> }}
        />
      </div>
    </article>
  );
}

const code = `q, L, E = train_cartpole_dqn(episodes=200, seed=0, eval_every=25)

print("the same agent, measured two ways\\n")
print(f"   {'episode':>8} {'training (last 25)':>20} {'frozen + greedy':>17}")
for ep, ev in E:
    print(f"   {ep:8d} {L[ep-25:ep].mean():20.1f} {ev:17.1f}")

best = max(E, key=lambda t: t[1])
print(f"\\n   best evaluation: {best[1]:.1f} at episode {best[0]}")
print(f"   final evaluation: {E[-1][1]:.1f} at episode {E[-1][0]}")
print(f"   training curve over that stretch: {L[best[0]-25:best[0]].mean():.1f} -> {L[-25:].mean():.1f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
