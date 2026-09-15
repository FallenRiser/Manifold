import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { RaceReplay } from "@/components/sail/RaceReplay";
import { RewardPriceLab } from "@/components/sail/RewardPriceLab";
import { SPEED_RACES } from "@/components/sail/data/speedRaces";

export const metadata = {
  title: "Pay for speed, get a boat that circles — Manifold",
  description:
    "The third candidate reward pays the boat its speed. Trained, it finishes 0 races in 200 and sails big loops behind the start at 2.47 m/s, never closer to the mark than when it began. The arithmetic of why: circling is worth 247, rounding the mark at most 115. A checklist for catching this before training.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PayForSpeed() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 13 minutes"
        title={<>Pay for speed, get a boat that circles</>}
        intro={<>The boat has one reward left to try, and it is the one that sounds most like common sense: a fast boat is a
          good boat, so pay it for going fast. It is the classic example of a <em>proxy</em> — a number that goes up
          when things are going well, used in place of the thing you actually want. Here is exactly what an agent does
          with it.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The proxy</h2>
        <p>
          The reward is the boat&rsquo;s speed, in metres per second, every second. Everything else about the world is
          unchanged: same course, same penalised edge, same learner, same 2000 practice races. The argument for it goes:
          a boat that sails fast reaches the mark sooner, so rewarding speed should reward reaching the mark. Every word
          of that is true of the boats <em>we</em> imagine — ones already trying to reach the mark. The agent is not one
          of those boats.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Paid its speed every second, what does the trained boat actually do?</>}
          options={["Races to the mark at top speed", "Reaches across the wind at top speed until it leaves the course", "Sails in circles", "Stalls — speed is hard to earn upwind"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeSpeed} />
        <CodeOutput>{`paid for speed: rounded 0 / 200, left the course 22, 3.17 full circles per race
held-out race 0: 200 s, ran out of time; mean speed 2.47 m/s, paid 493.9, closest approach to the mark 55.7 m
  wind v v v     one character = 3.5 m across, 8.8 m up
  +--------------------------------------------------------+
  |                                                        |
  |                      M                                 |
  |                                                        |
  |                                                        |
  |                                                        |
  |                                      ----              |
  |      /-------\\                 -//---   \\6--\\--        |
  |    |1        \\-\\\\---       ////               \\\\--\\\\   |
  |   |/               --S   ///                       /5  |
  |  |/                      7                       ///   |
  |  \\\\                      \\\\                    ///     |
  |   \\\\\\\\                    \\\\                 ///       |
  |      \\\\-2----              \\\\\\            ///4         |
  |             --\\--\\-          \\-\\\\-\\    ////            |
  |                    -\\\\\\\\           --8-/               |
  |                         ----3----/-                    |
  |                                                        |
  +--------------------------------------------------------+
  S start   M mark   * end   1-8: where the boat was every 25 s
  (a mark you cannot find is under an earlier digit: the boat was already there)`}</CodeOutput>

        <RaceReplay id="speed" races={SPEED_RACES} reward="speed"
          title="Held-out race 0, replayed: watch the pay column climb while the distance to the mark does not fall" />

        <p>
          <strong>It finishes nothing, and it is not trying to.</strong> Play the replay. The mark is at the top; the
          boat never goes near it. It sails two enormous loops, one either side of the start and mostly downwind of it, where a
          boat sails fast and there is plenty of water. It averages 2.47 m/s — most of its top speed — for the whole 200
          seconds and collects 493.9 in reward. The closest it ever gets to the mark is 55.7 metres, which is barely
          closer than the 60 metres it started from.
        </p>
        <p>
          It is not one unlucky run. Five training runs finished 0, 0, 1, 0 and 0 races, and averaged 3.03 to 4.50 full
          circles of turning per race (3.85 overall). Some of them clip the edge now and then — between 6 and 41 races
          in 200 left the course — but the dominant behaviour in every run is the same: stay inside, keep moving, keep
          turning, never finish.
        </p>

        <h2>The boat is right. The reward is wrong.</h2>
        <p>
          It is tempting to call this a failure of learning. It is the opposite: the agent found a genuinely better way
          to earn what it was paid than the one we had in mind. You can check that without training anything, by pricing
          the options the way the learner does.
        </p>

        <Proof title="What each ending is worth to a boat paid for speed">
          <p>
            <strong>Step 1 — a stream of pay.</strong> A boat sailing at speed <M>u</M> for <M>T</M> seconds, with
            discount <M>{String.raw`\gamma = 0.99`}</M>, is worth
          </p>
          <MathBlock>{String.raw`G(u, T) \;=\; u\,\big(1 + \gamma + \gamma^2 + \dots + \gamma^{T-1}\big) \;=\; u\,\frac{1-\gamma^T}{1-\gamma}`}</MathBlock>
          <p>
            <strong>Step 2 — never finishing.</strong> The learner bootstraps through the race clock, so a boat that
            keeps sailing is priced as if the stream never ends: <M>{String.raw`T \to \infty`}</M>. At the 2.47 m/s this
            boat actually averages, that is <M>{String.raw`2.47/(1-\gamma) =`}</M> <strong>247.0</strong>.
          </p>
          <p>
            <strong>Step 3 — rounding the mark.</strong> The mark is a terminal state: after it, the stream stops. Even
            granting the boat its top speed of 2.99 m/s for every second of a race as fast as the expert&rsquo;s (48.3 s),
            the most it could collect is <M>{String.raw`G(2.99,\, 48.3) \le`}</M> <strong>115.0</strong>. Taking the
            59.4 seconds the trained distance-paid boat needs raises that ceiling only to 134.4.
          </p>
          <p>
            <strong>Step 4 — leaving the course.</strong> The edge is at least 120 metres from the start, so sailing
            straight out at top speed reaches it in roughly 40 to 60 seconds. Taking 50: the stream is worth at most{" "}
            <M>{String.raw`G(2.99,\, 50) = 118.1`}</M>, minus the penalty of 100 discounted by{" "}
            <M>{String.raw`\gamma^{49}`}</M> (61.1), which leaves at most <strong>57.0</strong>.
          </p>
          <p>
            <strong>Step 5 — read it.</strong> Circling: 247.0. Finishing: at most 115.0. Leaving: at most 57.0. Rounding the
            mark is not merely unrewarded under this reward; it is <em>punished</em>, because it ends the pay. And
            straight-line speed runs into the edge, so the best strategy is speed that goes nowhere — which is what a loop
            is.
          </p>
        </Proof>

        <LabFrame
          accent={GOLD}
          tryThis={<>Try to make &ldquo;round the mark&rdquo; win while the boat is paid for speed. Then switch to distance
            gained.</>}
          insight={<>Under speed pay, finishing only wins if the boat circles below about 1.15 m/s or the discount drops so low
            that the future barely counts. Neither is the boat we built. Under distance gained the ranking flips with no tuning
            at all: circling earns nothing, so the behaviour we wanted is also the best-paid one. That is what a good reward
            looks like.</>}
        >
          <RewardPriceLab />
        </LabFrame>

        <p>
          This is the mirror image of the{" "}
          <Link href="/learn/building-environments/where-the-course-ends" style={link}>escaping boat</Link> two pages
          back. There, every second cost −1, so ending the race was a relief and the boat sailed off the course to get
          it. Here, every second pays, so ending the race is a loss and the boat refuses to finish. Same environment, same
          terminal states, opposite behaviour — decided entirely by the sign of what each second is worth.
        </p>

        <h2>Why this keeps happening</h2>
        <p>
          The general name is <strong>reward hacking</strong>, and it has a well-known cousin in economics, usually
          paraphrased as Goodhart&rsquo;s law: when a measure becomes a target, it stops being a good measure. Speed was a
          fine <em>measure</em> of how well a boat heading for the mark was sailing. The moment it became the{" "}
          <em>target</em>, the agent was free to pursue it without heading for the mark at all.
        </p>
        <p>
          Nothing about this is specific to boats or to tables. A learner optimises the reward you wrote down, over every
          behaviour the world permits, including the ones you never pictured. The more capable the learner, the more of
          those it finds. The fix is never to hope the agent will take the reasonable interpretation; it is to make sure
          the reasonable interpretation is also the most rewarding one.
        </p>

        <Callout color={GOLD} title={<>Four questions to ask of any reward, before training</>}>
          <strong>1. What does the behaviour you want earn, in total?</strong> Distance gained sums to about the course
          distance however long the race takes; speed sums to more the <em>longer</em> the boat stays out. The second
          answer is the warning.
          <br /><br />
          <strong>2. What does each terminal state do to future reward?</strong> If every step costs, endings are escapes.
          If every step pays, endings are losses. Either one will be exploited.
          <br /><br />
          <strong>3. What is the laziest or strangest policy you can imagine worth?</strong> Price it with the formula
          above, as we priced circling. If it beats the behaviour you want, the agent will find it.
          <br /><br />
          <strong>4. After training, look at what it does — not only at the score.</strong> This boat&rsquo;s score went
          up throughout training. Only the track showed what it was buying.
        </Callout>

        <h2>World 1, done</h2>
        <p>
          The sailboat is finished: planned, parameterised, coded, tested, and trained, with every choice argued and every
          result measured. Along the way it produced an escape hatch, a truncation rule that contradicted the textbook, a
          reward that looked broken and was only slow, and now a boat that circles for pay. The next world is bigger — a
          wildfire with several interacting systems — and every habit from this one carries straight over.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-agent-invents-tacking", label: <>← The agent invents tacking</> }}
          next={{ href: "/learn/building-environments/training-ground", label: <>Next · Training ground: train the fleet yourself →</> }}
        />
      </div>
    </article>
  );
}

const codeSpeed = `Q, log = train_sailor(reward="speed", seed=0)     # same world, same learner: paid its speed each second
r = race(greedy(Q))
print(f"paid for speed: rounded {r['arrived']} / 200, left the course {r['left_course']}, "
      f"{r['circles']:.2f} full circles per race")

env = Sail("speed"); o, _ = env.reset(seed=10**6); helm = greedy(Q)(env)
xs, ys, us, paid = [env.x], [env.y], [], 0.0
while True:
    o, rew, terminated, truncated, info = env.step(helm(o))
    xs.append(env.x); ys.append(env.y); us.append(env.u); paid += rew
    if terminated or truncated: break
how = "rounded the mark" if info["arrived"] else ("left the course" if info["out"] else "ran out of time")
closest = min(math.hypot(env.mx - x, env.my - y) for x, y in zip(xs, ys))
print(f"held-out race 0: {env.t} s, {how}; mean speed {np.mean(us):.2f} m/s, paid {paid:.1f}, "
      f"closest approach to the mark {closest:.1f} m")
draw_track(xs, ys, env)`;
