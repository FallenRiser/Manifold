import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WorkOrder, TransferBox, PlaybookRule } from "@/components/capstone/warehouse";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Designing the reward — Manifold",
  description:
    "The reward is the specification, and the agent will satisfy it literally. A helpful nudge for 'getting closer to the target' is harmless at +5 and catastrophic at +6 — the robot stops delivering entirely and farms the bonus forever. Measured, with the exact tipping point.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DesigningTheReward() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Act 1 · Frame it", color: "var(--c-metrics)" }]}
        time="about 10 minutes"
        title={<>Designing the reward</>}
        intro={<>
          The reward function is the only sentence the agent will ever read, and it reads it with hostile
          literalism. Here we add a mild, well-intentioned encouragement to the warehouse robot — and watch it stop
          doing its job entirely, at a threshold we can locate to within one point.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <WorkOrder act={1} n={4}>
          What am I actually paying for — and if the agent maximised this <em>literally</em>, without any of my
          good intentions, what would it do?
        </WorkOrder>

        <h2>Reward the outcome, not the method</h2>
        <p>
          The first rule is easy to say: <strong>reward what you want, not how you imagine getting it.</strong>{" "}
          Our warehouse reward says only what a good outcome is — <M>{String.raw`+50`}</M> for a delivery,{" "}
          <M>{String.raw`-30`}</M> for a spill, <M>{String.raw`-1`}</M> per step for time — and says nothing at all
          about routes. It never mentions the doorway or the bypass. That silence is deliberate: choosing between
          them is the agent&rsquo;s job, and any hint we drop is a constraint on a solution we have not yet seen.
        </p>
        <p>
          The temptation runs the other way. Learning is slow at first — the robot flails for thousands of steps
          before stumbling into its first delivery — so why not help? Give it a small bonus whenever it moves{" "}
          <em>closer</em> to wherever it is headed. It is obviously good advice. It is also, past a threshold, the
          end of the project.
        </p>

        <PredictPrompt
          accent={OLIVE}
          prompt="We add a bonus every time the robot reduces its distance to its current target. What is the biggest risk?"
          options={[
            "It will learn faster and reach the same policy — shaping is free",
            "It can earn the bonus repeatedly by moving closer, then away, then closer again — collecting reward forever without ever delivering",
            "It will take longer routes to collect more bonuses on the way",
          ]}
          nudge="Locked in. Any reward you can collect repeatedly is a loop the agent may prefer to the actual task. The only question is whether the loop pays better than finishing — and that's a number we can compute."
        />

        <h2>Finding the exact point where it breaks</h2>
        <p>
          Rather than warn about this abstractly, we can measure it. We add a bonus of <M>b</M> whenever the robot
          gets closer to its target, solve for the <em>optimal</em> policy under that modified reward, and then
          score that policy on the <strong>real</strong> reward — the one we actually care about. If shaping is
          harmless, the scores should barely move.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeHack} />
        <CodeOutput>{`bonus for 'getting closer' | TRUE return  delivered   steps
                      0.0 |       21.25     100.0%    24.5
                      3.0 |       21.51     100.0%    24.8
                      5.0 |       21.54     100.0%    25.3
                      6.0 |     -253.51       0.0%   250.0
                      7.0 |     -253.60       0.0%   250.0
                      8.0 |     -253.60       0.0%   250.0`}</CodeOutput>
        <p>
          There is the cliff, and it is one point wide. At a bonus of <strong>+5</strong> the robot still delivers
          <strong> 100%</strong> of packages and scores <strong>+21.54</strong> — the shaping is genuinely
          harmless. At <strong>+6</strong> it delivers <strong>0%</strong> and scores <strong>−253.51</strong>.
        </p>
        <p>
          It has not become confused, and it has not failed to optimise. It is optimising <em>perfectly</em> — for
          the reward we wrote. Stepping toward the target earns <M>{String.raw`+6-1 = +5`}</M>; stepping back earns{" "}
          <M>{String.raw`-1`}</M>. So a two-step shuffle nets <M>{String.raw`+4`}</M>, forever, and the discounted
          value of shuffling until the end of time now exceeds the one-off <M>{String.raw`+50`}</M> for finishing.
          A rational agent never delivers again. We asked for approach behaviour, and we got approach behaviour —
          it was delivery we forgot to make worth more.
        </p>

        <Callout color={OLIVE} title={<>The safe way to do this: potential-based shaping</>}>
          Shaping is not forbidden — it is one of the most useful tools in RL. It is <em>naive</em> shaping that is
          dangerous. There is a classical result (Ng, Harada &amp; Russell, 1999) that a shaping term of the form{" "}
          <M>{String.raw`F(s,s') = \gamma\,\Phi(s') - \Phi(s)`}</M>, built from a <em>potential</em>{" "}
          <M>\Phi</M> over states, leaves the optimal policy <strong>provably unchanged</strong> — no matter how you
          pick <M>\Phi</M>. The reason our version broke is that it is not of that form: the telescoping is what
          makes a loop pay exactly zero. If you want to accelerate learning with hints, use a potential. If you
          invent a bonus by hand, you have quietly rewritten the objective.
        </Callout>

        <h2>The knob that did less than expected</h2>
        <p>
          The step cost is where you would expect to control urgency: charge more per step, get a hastier robot.
          Let&rsquo;s vary it across a factor of thirty and re-solve each time.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeStep} />
        <CodeOutput>{`step cost |   return   steps  spills  (optimal policy, re-solved)
      0.0 |    46.22    25.4   0.126
     -0.1 |    43.73    24.9   0.126
     -1.0 |    20.70    24.7   0.154
     -3.0 |   -28.29    24.3   0.176`}</CodeOutput>
        <p>
          The <em>returns</em> move enormously — from <strong>+46</strong> to <strong>−28</strong>. The{" "}
          <em>behaviour</em> barely moves at all: <strong>25.4 steps down to 24.3</strong>, about one step, across a
          thirtyfold change in the price of time. Even with the step cost switched off entirely, the robot does not
          dawdle.
        </p>
        <p>
          The reason is that something else is already supplying the urgency: the <strong>discount</strong>. With{" "}
          <M>{String.raw`\gamma = 0.97`}</M>, a <M>{String.raw`+50`}</M> collected ten steps later is worth only{" "}
          <M>{String.raw`0.97^{10}\times 50 \approx 37`}</M>. Delay is <em>already</em> expensive, and the step cost
          is mostly re-stating a preference the discount has expressed. This is worth internalising before you
          spend an afternoon tuning a reward coefficient: <strong>check whether the knob you are reaching for is
          the one actually driving the behaviour.</strong> The next page shows what happens when we turn the one
          that is.
        </p>

        <TransferBox>
          Write your reward, then attack it: ask what the <em>laziest possible</em> agent could do to collect it
          without doing your task. Any term that can be earned repeatedly without progress is a farm. And when you
          add a hint, prefer a potential-based one — or accept that you have changed the objective and re-check the
          policy, scored on the reward you actually care about.
        </TransferBox>

        <PlaybookRule n={4}>
          <strong>Reward outcomes, not methods</strong>, and stress-test the reward by imagining an adversary
          maximising it literally. Score every candidate policy on the <em>true</em> objective, never on the shaped
          one — that gap is where reward hacking hides.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/warehouse-robot-capstone/designing-the-state", label: <>← Designing the state</> }}
          next={{ href: "/learn/warehouse-robot-capstone/choosing-the-discount", label: <>Next up · Choosing the discount →</> }}
        />
      </div>
    </article>
  );
}

const codeHack = `def dist(s):                       # how far from whatever it's currently after
    r, c, k = unpack(s)
    tr, tc = (DROP if k == 1 else PICK)
    return abs(r - tr) + abs(c - tc)

def solve_shaped(bonus, gamma=GAMMA):
    """optimal policy for reward + \`bonus\` whenever the robot gets CLOSER to its target"""
    outs = [[[] for _ in range(nA)] for _ in range(nS)]
    for s in range(nS):
        for a in range(nA):
            for p, d in ((1-SLIP, a), (SLIP/2, (a-1) % 4), (SLIP/2, (a+1) % 4)):
                s2, r, done = _transition(s, d)
                shaped = r + (bonus if (not done and dist(s2) < dist(s)) else 0.0)
                outs[s][a].append((p, s2, shaped, done))
    V = np.zeros(nS); term = sid(DROP[0], DROP[1], 1)
    for _ in range(4000):
        dlt = 0.0
        for s in range(nS):
            if s == term: continue
            best = max(sum(p*(rr + (0.0 if dn else gamma*V[s2])) for p, s2, rr, dn in outs[s][a])
                       for a in range(nA))
            dlt = max(dlt, abs(best - V[s])); V[s] = best
        if dlt < 1e-10: break
    return np.array([int(np.argmax([sum(p*(rr + (0.0 if dn else gamma*V[s2])) for p, s2, rr, dn in outs[s][a])
                                    for a in range(nA)])) for s in range(nS)])

print("bonus for 'getting closer' | TRUE return  delivered   steps")
for b in (0.0, 3.0, 5.0, 6.0, 7.0, 8.0):
    pi = solve_shaped(b)
    r = evaluate(lambda s: pi[s], n=1000, seed=41)   # scored on the REAL reward
    print("%25.1f | %11.2f %9.1f%% %7.1f" % (b, r["ret"], r["delivered"]*100, r["steps"]))`;

const codeStep = `print("step cost |   return   steps  spills  (optimal policy, re-solved)")
_orig = STEP_COST
for sc in (0.0, -0.1, -1.0, -3.0):
    STEP_COST = sc                       # the dynamics read this global
    V, PI = dp_solve()
    r = evaluate(lambda s: PI[s], n=1000, seed=23)
    print("%9.1f | %8.2f %7.1f %7.3f" % (sc, r["ret"], r["steps"], r["spills"]))
STEP_COST = _orig`;
