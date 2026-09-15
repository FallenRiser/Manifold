import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { RaceReplay } from "@/components/sail/RaceReplay";
import { EdgeValueLab } from "@/components/sail/EdgeValueLab";
import { SeedStrip } from "@/components/sail/SeedStrip";
import { EDGE_RACES } from "@/components/sail/data/edgeRaces";

export const metadata = {
  title: "Where the course ends — Manifold",
  description:
    "The edge of the race area looks like housekeeping. Pay the boat −1 a second and let the edge end the race for free, and it learns to sail off the course: 115 of 200 test races, 0 finished. A penalty delays the escape without removing it — and the arithmetic of discounting predicts exactly that.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhereTheCourseEnds() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 15 minutes"
        title={<>Where the course ends</>}
        intro={<>Your boat has one line that has not been argued yet: the edge of the race area. It is the last piece of
          stage 3, and it is a good place to finish the chapter, because it shows the most important thing about
          building environments in miniature: a rule you add for tidiness can quietly become something the agent
          optimises for.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Why a course needs an edge at all</h2>
        <p>
          The first reason is not about sailing. In the{" "}
          <Link href="/learn/building-environments/plan-parameterise-code-test-train" style={link}>build log</Link>,
          version 2 of the boat finished only 12 races in 200, and the diagnosis was that the agent&rsquo;s view of
          distance lumped everything from 80 metres to infinity into one band. A boat 100 metres out and a boat 800
          metres out looked identical, so wandering off cost nothing the agent could see. The race clock stops an
          episode eventually — that was promise 3 on the{" "}
          <Link href="/learn/building-environments/the-reset-step-contract" style={link}>contract page</Link> — but it
          does nothing to stop a boat spending 200 seconds somewhere it has no business being.
        </p>
        <p>
          The second reason is the task. Real races have a course area, and leaving it is a disqualification. So the
          environment draws a circle of radius 150 m, centred halfway between the start and the mark, and a boat that
          crosses it is out. Before worrying about what happens at that line, check the one thing it must never do:
          catch a boat that is sailing sensibly.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codeFar} />
        <CodeOutput>{`race area radius 150 m;  the expert's farthest point from its centre in 200 races: 54.4 m`}</CodeOutput>

        <p>
          The expert never gets closer than 95 metres to the edge. That margin is the justification for the number
          150: nearly three times as far out as good sailing ever goes, so the edge only ever meets a boat that has
          genuinely lost its way. A tighter circle would start disqualifying reasonable routes, and a much looser one
          would bring back the wandering the edge exists to stop.
        </p>

        <h2>What happens <em>at</em> the edge is a reward decision</h2>
        <p>
          Drawing the line is easy. Deciding what crossing it <em>means</em> is not, and there are three reasonable
          choices:
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li><strong>No edge.</strong> The boat can sail anywhere until the clock runs out.</li>
          <li><strong>A free edge.</strong> Crossing it terminates the race, and that is all.</li>
          <li><strong>A penalised edge.</strong> Crossing it terminates the race and costs something extra.</li>
        </ol>
        <p>
          The <Link href="/learn/building-environments/terminated-vs-truncated" style={link}>terminated-vs-truncated</Link>{" "}
          page already settled that leaving the area is a <em>terminated</em> ending — a disqualified boat&rsquo;s
          race is over. What that page did not ask is how that ending interacts with the reward. So take the reward
          most people would write first — <strong>−1 for every second</strong> until the boat rounds the mark, so
          faster is better — and train the same boat three times, changing only the edge.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The boat pays −1 every second it is racing. With a free edge — crossing it simply ends the race — what does
            the trained boat do?</>}
          options={["Stays well clear — leaving means losing", "Rounds the mark more, because wandering is cut short", "Sails off the course on purpose", "No difference from having no edge"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeEdges} />
        <CodeOutput>{`edge=none     practice:   0/200 left the course               -           test: rounded  27, left   0
edge=free     practice:  99/200 left the course after 100.6 s on average   test: rounded   0, left 115
edge=penalty  practice:  33/200 left the course after 135.8 s on average   test: rounded   4, left  37`}</CodeOutput>

        <RaceReplay id="edges" races={EDGE_RACES} wholeCourse reward="time"
          title="The three trained boats on the same start (held-out race 0), with the race area drawn in red" />

        <p>
          <strong>With a free edge the boat learns to leave.</strong> Half of its last 200 practice races ended off
          the course, and when tested it sailed out of 115 races and finished none. From the boat&rsquo;s point of view
          this is not a failure, it is the best thing it found: every second costs −1, it has not yet learned how to
          reach the mark, and the edge is a door out of the cost.
        </p>
        <p>
          The penalty — crossing the edge costs the rest of the clock, as if the boat had sailed the whole race and
          lost — cuts the escapes to a third (33 practice races, 37 in testing), but it does not end them. And none of
          the three versions learns to finish much: 27 races at best. Those are two separate problems, and it is
          worth keeping them apart. The escape is an <em>edge</em> problem, and it is this page&rsquo;s. Not finishing
          is a <em>reward</em> problem, and it has a page of its own in chapter 3.
        </p>

        <h2>Why the penalty doesn&rsquo;t close the door</h2>
        <p>
          The penalty was designed by an intuition that sounds airtight: leaving at second <M>t</M> costs <M>t</M> for
          the seconds sailed plus <M>200 - t</M> for the rest of the clock, which totals 200 — exactly what a boat that
          sails the whole race without finishing pays. So leaving should never be better than staying. The
          measurements say otherwise, and the gap is two things the intuition left out.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Drag the exit time from 20 s to 180 s and watch where each curve crosses the dashed line. Then push the discount
            up toward 0.999.</>}
          insight={<>The free edge sits above &ldquo;staying&rdquo; at every exit time: it is always the better deal. The
            penalised edge starts far below, crosses at about 100 s, and ends above. So the penalty turns early escapes into
            late ones. It never removes them, exactly as the practice log showed. A higher discount lowers the staying line
            and pushes the crossing later, but the shape stays.</>}
        >
          <EdgeValueLab />
        </LabFrame>

        <p>The derivation behind those curves, step by step:</p>

        <Proof title="The value of leaving, with discounting and a bootstrapped clock">
          <p>
            <strong>Step 1 — what staying is worth, to this learner.</strong> The boat learns with discount{" "}
            <M>{String.raw`\gamma = 0.99`}</M>, and it bootstraps through the clock (the choice made on the{" "}
            <Link href="/learn/building-environments/terminated-vs-truncated" style={link}>previous chapter&rsquo;s page</Link>).
            For a boat that has not learned to finish, every second pays −1 and the future looks the same forever, so
            its value satisfies <M>{String.raw`V = -1 + \gamma V`}</M>:
          </p>
          <MathBlock>{String.raw`V_{\text{stay}} = \frac{-1}{1-\gamma} = -100`}</MathBlock>
          <p>
            Not −200. Bootstrapping through the buzzer means the agent never sees the clock as the end of its costs.
          </p>
          <p>
            <strong>Step 2 — leaving through a free edge at second <M>t</M>.</strong> It pays −1 for <M>t</M> seconds
            and then nothing:
          </p>
          <MathBlock>{String.raw`G_{\text{free}}(t) = -\sum_{k=0}^{t-1}\gamma^k = -\frac{1-\gamma^t}{1-\gamma}`}</MathBlock>
          <p>
            That is <em>always</em> greater than −100, for any <M>t</M>. At the measured average exit of 100.6 s it is{" "}
            <strong>−63.6</strong>. A free edge is not a temptation the boat might resist; it is strictly the better
            option until the boat can actually finish.
          </p>
          <p>
            <strong>Step 3 — leaving through the penalised edge.</strong> The same −1 per second, plus the penalty{" "}
            <M>200 - t</M> arriving on the last step, discounted by <M>{String.raw`\gamma^{t-1}`}</M>:
          </p>
          <MathBlock>{String.raw`G_{\text{pen}}(t) = -\frac{1-\gamma^t}{1-\gamma} \;-\; \gamma^{t-1}\,(200 - t)`}</MathBlock>
          <p>
            <strong>Step 4 — evaluate it.</strong> Leaving after 20 s gives −166.9 and after 50 s gives −131.2 —
            much worse than staying. After 100.6 s it gives −100.1, break-even. After 135.8 s, the measured average exit
            time, it gives <strong>−91.0</strong>, and after 180 s, −86.9. Better than staying.
          </p>
          <p>
            <strong>Step 5 — read it.</strong> The penalty punishes <em>early</em> exits hard and <em>late</em> exits
            barely at all, because a penalty paid late is shrunk by discounting, while staying is valued as costing −1
            forever. That predicts both things the experiment showed: the escapes do not disappear, and they happen
            later — 135.8 s with the penalty against 100.6 s without.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>The general lesson: termination is a reward</>}>
          Whenever every step costs something, ending the episode is worth something — it stops the cost. Any exit
          you give the agent is therefore an action with a payoff, and the agent will price it exactly, using your
          discount and your bootstrapping rules rather than your intuition. Before shipping any terminal condition,
          ask what the episode is worth to an agent that takes it on purpose at the worst possible moment. In the boss
          fight later in this track, &ldquo;the player dies&rdquo; is a terminal condition too.
        </Callout>

        <h2>What the shipped boat uses, and why</h2>
        <p>
          The environment ships with a <strong>penalised edge</strong>. Here is the whole decision, because the
          measurements do not make it on their own. With the reward the boat actually trains on — payment for
          distance gained, chosen in chapter 3 — five training runs each gave:
        </p>

        <SeedStrip rows={[
          { label: "no edge", values: [187, 92, 170, 74, 168] },
          { label: "free edge", values: [195, 184, 190, 131, 168] },
          { label: "penalised edge (shipped)", values: [156, 165, 190, 177, 191], strong: true },
        ]} note="Paid for distance gained, 2000 practice races, seeds 0–4." />

        <p>
          <strong>Edge versus no edge:</strong> the no-edge average is 37 races lower, but its spread is so wide that
          the gap is not strictly resolvable from five runs. What is visible is <em>how</em> it loses: two of the five
          no-edge runs collapsed to 92 and 74, and no run with an edge fell below 131. That matches the diagnosis from
          version 2 — without an edge, wandering is invisible to the agent — so we keep the edge.
        </p>
        <p>
          <strong>Free versus penalised:</strong> 173.6 against 175.8 is a tie. The measurement cannot choose. So the
          choice comes from the page you just read: under this reward a free edge happens to be harmless, but under
          the −1-per-second reward it was an escape hatch, and chapter 3 will try several rewards on this same
          environment. A penalised edge is the setting that is safe under every reward we test. When an experiment
          ties, choose the option whose worst case you have already seen and understood.
        </p>

        <h2>Chapter 2, done</h2>
        <p>
          You have built the whole boat: a task sentence and its reasons, a speed chart and the ceiling it implies,
          a <code>step</code> function proven identical to the environment, and an edge whose consequences you can now
          compute. That is stages 1 to 3. Chapter 3 is stages 4 and 5 — testing the world properly, deciding what the
          agent should see and what it should be paid, and finally training a boat that has never heard of tacking.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/writing-step", label: <>← Writing step()</> }}
          next={{ href: "/learn/building-environments/sanity-agents", label: <>Next · Sanity agents, and a sailor who can&rsquo;t lose →</> }}
        />
      </div>
    </article>
  );
}

const codeFar = `# How close does a GOOD sailor ever come to the edge? (The edge must never catch a sensible boat.)
far = 0.0
for k in range(200):
    env = Sail(); o, _ = env.reset(seed=10**6 + k); helm = expert(env)
    while True:
        o, r, terminated, truncated, info = env.step(helm(o))
        far = max(far, math.hypot(env.x, env.y - env.my / 2))
        if terminated or truncated: break
print(f"race area radius {COURSE:.0f} m;  the expert's farthest point from its centre in 200 races: {far:.1f} m")`;

const codeEdges = `# Same boat, same reward (-1 every second), same 2000 practice races, same seed.
# ONLY the edge of the course changes.
for edge in ("none", "free", "penalty"):
    Q, log = train_sailor(reward="time", edge=edge, seed=0)
    tail = log[-200:]
    left = [steps for arrived, out, steps in tail if out]
    r = race(greedy(Q), edge=edge)
    how_fast = f"after {np.mean(left):5.1f} s on average" if left else "              -        "
    print(f"edge={edge:8s} practice: {len(left):3d}/200 left the course {how_fast}   "
          f"test: rounded {r['arrived']:3d}, left {r['left_course']:3d}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
const tdMono: React.CSSProperties = { ...td, fontFamily: "ui-monospace, monospace" };
