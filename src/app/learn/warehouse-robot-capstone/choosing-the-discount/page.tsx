import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Choosing the discount — Manifold",
  description:
    "γ is usually treated as a constant you copy from a paper. On the warehouse it silently chooses the robot's route: at γ ≤ 0.8 it always takes the safe bypass, at γ ≥ 0.9 it starts using the risky doorway. The discount is a risk-appetite decision in disguise.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ChoosingTheDiscount() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 1 · Frame it", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Choosing the discount</>}
        intro={<>
          <M>\gamma</M> is the parameter people copy from a paper without thinking — 0.99, next question. On this
          warehouse it turns out to decide something no one would expect a discount to decide: <em>which physical
          route the robot drives</em>, and therefore how much risk it accepts.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={1} n={5}>
          How far into the future should consequences count — and am I sure that is a modelling decision rather
          than a default I inherited?
        </WorkOrder>

        <h2>γ as an effective horizon</h2>
        <p>
          The discount weights a reward <M>k</M> steps away by <M>{String.raw`\gamma^k`}</M>. Summing that
          geometric decay gives the standard rule of thumb — the agent effectively plans over a window of about
        </p>
        <MathBlock>{String.raw`H_{\text{eff}} \;\approx\; \frac{1}{1-\gamma}\ \text{steps}.`}</MathBlock>
        <p>
          So <M>{String.raw`\gamma = 0.9`}</M> is a robot that meaningfully cares about the next ten steps;{" "}
          <M>{String.raw`\gamma = 0.99`}</M>, about the next hundred. Now put that beside a fact about our floor:
          a complete delivery takes roughly <strong>25 steps</strong>. That comparison is the whole page. A robot
          whose horizon is shorter than its task <em>cannot see the reward it exists to collect.</em>
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="A delivery takes ~25 steps. What does a very short-sighted robot (γ = 0.5, horizon ≈ 2 steps) do?"
          options={[
            "Rush recklessly — with no view of the future it takes the shortest, riskiest path",
            "Play it safe — the +50 is invisible at that horizon, so avoiding the nearby −30 spill is all that's left to optimise",
            "Behave identically — γ only rescales values, it doesn't change the best action",
          ]}
          nudge="Locked in. When the goal is beyond the horizon, the only rewards in view are the penalties nearby — so the myopic robot becomes cautious, not hasty. Watch it happen."
        />

        <h2>Re-solving the world at five discounts</h2>
        <p>
          We solve the warehouse exactly at each <M>\gamma</M> and then measure the resulting policy on the{" "}
          <em>same</em> undiscounted scoreboard — real return, real steps, real spills — plus one behavioural
          question: when it crosses the spill wall, does it use the doorway or the bypass?
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={code} />
        <CodeOutput>{`gamma | horizon |   return   steps  spills   doorway
 0.50 |       2 |    16.46    33.5   0.002        0%
 0.80 |       5 |    16.14    33.1   0.026        0%
 0.90 |      10 |    21.46    24.8   0.125       35%
 0.97 |      33 |    20.53    24.6   0.162       35%
 0.99 |     100 |    21.60    24.9   0.118       48%`}</CodeOutput>

        <h2>Reading the table</h2>
        <p>
          There is a phase change between <M>{String.raw`\gamma = 0.8`}</M> and{" "}
          <M>{String.raw`\gamma = 0.9`}</M>, and it is not subtle:
        </p>
        <ul>
          <li>
            <strong>Short-sighted (γ ≤ 0.8).</strong> The robot <em>never</em> uses the doorway — 0%, both times.
            It takes the long way around, 33 steps, and hits a spill almost never (0.002 per episode at{" "}
            <M>{String.raw`\gamma = 0.5`}</M>). It looks beautifully safe. It also scores <strong>16.5</strong>.
          </li>
          <li>
            <strong>Far-sighted (γ ≥ 0.9).</strong> The doorway appears — 35%, then 48% — the trip shortens to
            about <strong>24.7 steps</strong>, spills rise to ~0.12–0.16 per episode, and the return climbs to{" "}
            <strong>21.5</strong>.
          </li>
        </ul>
        <p>
          The myopic robot is not being prudent; it is being <em>ignorant</em>. At a two-step horizon the{" "}
          <M>{String.raw`+50`}</M> for delivering is discounted into invisibility —{" "}
          <M>{String.raw`0.5^{25}\approx 3\times10^{-8}`}</M> of its face value — so the only rewards it can still
          perceive are the <M>{String.raw`-1`}</M> underfoot and the <M>{String.raw`-30`}</M> next door. Faced with
          a scoreboard on which finishing is worth nothing and spills are worth everything, avoiding spills is
          genuinely optimal. It solves that problem perfectly. It is just not our problem.
        </p>
        <p>
          And the cost is real, not cosmetic: <strong>16.46 versus 21.60</strong> on the objective we actually
          care about. A quarter of the achievable value, given away by a parameter most people never examine.
        </p>

        <Callout color={OLIVE} title={<>What γ is really doing here</>}>
          We set out to answer &ldquo;how far ahead should it care?&rdquo; and, without ever mentioning risk,
          answered <strong>&ldquo;how much risk should it accept?&rdquo;</strong> as well. That coupling is not a
          quirk of this warehouse. Risk and delay are the same currency to a discounted agent: a hazard is
          immediate, a payoff is distant, so anything that shrinks the value of distance <em>automatically</em>
          makes the agent more conservative. Whenever you tune <M>\gamma</M>, you are tuning risk appetite, whether
          or not you meant to.
          <br /><br />
          The corollary is practical: <strong>choose γ from the task&rsquo;s timescale</strong>, not from habit.
          Ours needs ~25 steps, so <M>{String.raw`1/(1-\gamma) \gtrsim 25`}</M> — i.e.{" "}
          <M>{String.raw`\gamma \gtrsim 0.96`}</M>. We use <strong>0.97</strong>. And note the table&rsquo;s last
          honest wrinkle: 0.90, 0.97 and 0.99 all land within a point of each other. Once the horizon comfortably
          covers the task, the exact value stops mattering much — which is precisely why 0.99 is a defensible
          default, and precisely why defaulting without checking is a gamble.
        </Callout>

        <Quiz
          accent={OLIVE}
          title="Act 1 checkpoint"
          questions={[
            {
              q: <>What made the position-only agent fail so completely?</>,
              options: [
                "It needed more training episodes",
                "State aliasing: at the same cell it must act differently depending on whether it carries the package, and one table row cannot hold two answers",
                "The learning rate was too high",
              ],
              answer: 1,
              explain: <>The optimal action at the doorway is <em>down</em> when empty and <em>up</em> when carrying.
                With the carrying bit removed those are the same state, so the optimal policy is not representable —
                no amount of training can fix a representation problem.</>,
            },
            {
              q: <>Why did a &ldquo;get closer to your target&rdquo; bonus of +6 destroy the robot?</>,
              options: [
                "It confused the value estimates",
                "The bonus could be farmed forever by stepping toward and away, and past +5 that loop pays better than delivering — so a perfectly rational agent stops delivering",
                "It made the rewards too large to represent",
              ],
              answer: 1,
              explain: <>Approach (+6−1) then retreat (−1) nets +4 per two steps, indefinitely. Once the discounted
                value of that loop beats the one-off +50, never finishing is optimal. The agent optimised exactly
                what we wrote.</>,
            },
            {
              q: <>A robot with γ = 0.5 refuses the short doorway route. Why?</>,
              options: [
                "It is correctly accounting for the risk of spills",
                "Its horizon (~2 steps) is far shorter than the task (~25 steps), so the +50 is invisible and only nearby penalties remain to optimise — caution by ignorance, costing ~5 points of return",
                "Short horizons always produce longer paths",
              ],
              answer: 1,
              explain: <>At γ=0.5 the delivery reward is discounted to about 3×10⁻⁸ of face value. The only visible
                rewards are the step cost and the spill, so avoiding spills is locally optimal — and it scores 16.46
                against the far-sighted 21.60.</>,
            },
            {
              q: <>Which framing decision should you make <em>first</em>, and why?</>,
              options: [
                "The algorithm, since it determines everything downstream",
                "The state — it decides whether the optimal policy is representable at all, and no later choice can compensate for getting it wrong",
                "The discount, since it sets the horizon",
              ],
              answer: 1,
              explain: <>Reward and discount shape <em>which</em> policy is best; the state decides whether the best
                policy can be expressed at all. That is why it is the first question and the one with the most
                catastrophic failure mode.</>,
            },
          ]}
        />

        <TransferBox>
          On your next problem, estimate the number of steps between an action and the outcome it is meant to
          cause, and pick <M>\gamma</M> so that <M>{String.raw`1/(1-\gamma)`}</M> comfortably exceeds it. Then
          re-solve at two or three values and compare the <em>behaviour</em>, not just the value — if the policy
          changes character, your discount is doing more work than you assigned it.
        </TransferBox>

        <PlaybookRule n={5}>
          <strong>Choose γ from the task&rsquo;s timescale</strong> (<M>{String.raw`1/(1-\gamma)`}</M> should exceed
          the action-to-outcome delay), and remember that shrinking it does not merely shorten the horizon — it
          quietly makes the agent more risk-averse.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/designing-the-reward", label: <>← Designing the reward</> }}
          next={{ href: "/learn/warehouse-robot-capstone/the-warehouse", label: <>Next act · The warehouse field guide →</> }}
        />
      </div>
    </article>
  );
}

const code = `print("gamma | horizon |   return   steps  spills   doorway")
for g in (0.5, 0.8, 0.9, 0.97, 0.99):
    V, PI = dp_solve(gamma=g)
    r = evaluate(lambda s: PI[s], n=1000, seed=21)
    # which way does it cross the spill wall?
    e = Warehouse(31); door = byp = 0
    for _ in range(200):
        s = e.reset()
        for t in range(250):
            s, rr, done = e.step(int(PI[s]))
            rc = unpack(s)[:2]
            if rc == (2, 3): door += 1
            elif rc in ((2, 6), (2, 7)): byp += 1
            if done: break
    print("%5.2f | %7.0f | %8.2f %7.1f %7.3f %8d%%" % (
        g, 1/(1-g), r["ret"], r["steps"], r["spills"], round(100*door/max(1, door+byp))))`;
