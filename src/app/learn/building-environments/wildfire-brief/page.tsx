import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { FireReplay } from "@/components/fire/FireReplay";
import { BRIEF_FIRES } from "@/components/fire/data/briefFires";

export const metadata = {
  title: "The brief: one helicopter, one village — Manifold",
  description:
    "World 2 starts without code. A wildfire, a village and one water-bombing helicopter: why this world, what standing by costs (8 of 9 village cells lost on one map, 6.79 on average over 200), what the obvious rule already achieves, and every planning decision behind the spec — including the two we deliberately leave open.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WildfireBrief() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 14 minutes"
        title={<>The brief: one helicopter, one village</>}
        intro={<>The sailboat had one system: a boat in a steady wind. The second world has several, running at once and
          at different speeds — a fire that spreads, a wind that shifts, a helicopter that has to go back for water, and
          a village that cannot be rebuilt. As before, it starts with no code at all: the task, why this task, and what
          we will measure.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The task, in one sentence with no RL words in it</h2>
        <div style={brief}>
          A wildfire has broken out on a small map of grass and forest. You command one water-bombing helicopter, based
          at the village. Keep the village standing, and let as little land burn as you can, until the fire is out.
        </div>
        <p>
          Read it again and notice that it already contains a judgement. &ldquo;Keep the village standing&rdquo; comes
          first and &ldquo;as little land as you can&rdquo; second. The sailboat&rsquo;s sentence had one goal — get to
          the mark fast. This one has two, and they can pull in different directions: the fire that threatens the most
          land is not always the fire that threatens the village. Somebody has to decide how much a forest is worth next
          to a house, and in a reinforcement-learning world that somebody writes it into the reward. We will get there;
          for now, just notice that the sentence already made the call.
        </p>

        <h2>Why this world</h2>
        <p>
          We held the sailboat to four requirements. Here is how the wildfire answers each, because two of the answers
          are different, and the differences are what this world is for.
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li>
            <strong>The obvious strategy must leave room.</strong> For the boat, the obvious helm failed outright. For a
            fire, the obvious rule — fly to the nearest flames and drop water — works rather well, as you are about to
            see. What matters is that it is not the best rule, and that a better one exists which a fire chief would
            recognise. A world where the obvious rule is already optimal has nothing to teach.
          </li>
          <li>
            <strong>There is no ceiling to compute — and we say so.</strong> The boat&rsquo;s best angle came from
            physics in closed form. Nothing like that exists for a spreading fire with random ignitions and shifting
            wind. The honest substitute is a bar, not a ceiling: the best hand-written fire chief we can write. Every
            trained crew in this world is compared with that chief, never with an optimum we cannot know.
          </li>
          <li>
            <strong>Failures must be visible.</strong> A burning village on a map is about as visible as failure gets.
            That matters even more here than for the boat, because with several systems interacting, a wrong number
            is hard to diagnose without a picture.
          </li>
          <li>
            <strong>It must be small enough to run where you are reading.</strong> The world itself runs on this page:
            every map and every hand-written chief below is computed by the code you can run. Training an agent in it
            takes minutes on a graphics card, so that part happens on your own machine, and this track shows you the
            results and the code.
          </li>
        </ol>

        <h2>What happens if nobody flies</h2>
        <p>
          Before trying any strategy, measure the cost of none. The world already exists in this page&rsquo;s setup.
          Here is one map — world 1002 — at the moment the alarm comes in, and again after the helicopter has hovered
          over the village doing nothing until the fire burns itself out. The map is 16 cells square; each cell is
          drawn two characters wide so the map looks square.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeStandBy} />
        <CodeOutput>{`  step   0   wind blowing toward N at 0.44   bucket full
  +--------------------------------+
  | ^ ^ ^ ^ ^ ^ ^ ^ ^ # ^ ^ ^ ^ ^ ^|
  | ^ ^ ^ ^ ^ ^ ^ # ^ ^ ^ ^ ^ ^ ^ ^|
  | ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ # ^|
  | ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ~ ~ ~ ^ ^|
  | ^ ^ ^ ^ ^ * ^ # ^ # ^ ~ ~ ~ ^ ^|
  | ^ ^ ^ # ^ ^ ^ ^ ^ ^ ^ ~ ~ ~ ^ ^|
  | # ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^|
  | . . ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ # # ^ .|
  | . . . . . . . . . . ^ ^ ^ ^ . .|
  | . . . . . . . . . . . . . . . .|
  | . . . . . . . . . . . . . . * .|
  | . . . . . . . . . . . . . . . .|
  | . . . . . . H H H . . . . . . .|
  | . . . . . . H @ H . . . . . . .|
  | . . . . . . H H H . . . . . . .|
  | # . . . . . . . . . . . . . . .|
  +--------------------------------+
  . grass  ^ forest  # rock  ~ lake  H village  * burning  x burnt  @ helicopter

  step  88   wind blowing toward NW at 0.56   bucket full
  +--------------------------------+
  | x x x x x x x x x # x x x ^ ^ ^|
  | x x x x x x x # x x x x x ^ ^ ^|
  | x x x x x x x x x x x x x ^ # ^|
  | x x x x x x x x x x x ~ ~ ~ ^ ^|
  | x x x x x x x # x # x ~ ~ ~ ^ ^|
  | x x x # x x x x x x x ~ ~ ~ x ^|
  | # ^ ^ x x x x x x x x x x x x x|
  | x x ^ x x x x x x x x x # # x x|
  | x x x x x x x x x x x x x x x x|
  | x x x x x x . x x x x x x x x x|
  | x x x x x x x x x x x x x x x x|
  | x x x x x x x x x x x x x x x x|
  | x x x x x x x x x x x x x x x x|
  | x x x x x x x @ x x x x x x x x|
  | x x x x x x H x x x x x x x x x|
  | # . x x x x x x . . . x x x x .|
  +--------------------------------+
  . grass  ^ forest  # rock  ~ lake  H village  * burning  x burnt  @ helicopter
standing by: the fire went out on its own after 88 steps, 214 of 256 cells burnt, 8 of 9 village cells damaged`}</CodeOutput>
        <p>
          Two fires started: one in the forest to the north-west, one in the grass to the east. Nobody touched them,
          and after 88 steps there was almost nothing left to burn — 214 of the 256 cells, and 8 of the 9 village
          cells. That is the cost of doing nothing, and every strategy on these pages is measured against it.
        </p>

        <h2>Try the obvious thing</h2>
        <p>
          The rule anyone would try first: if the bucket is empty, fly to the lake and fill it; otherwise fly to the
          nearest burning cell and drop. The setup includes it as <code>pilot_chief(&quot;nearest&quot;)</code>. Here
          is the same world three ways — standing by, that rule, and a second rule you will meet properly on the
          baselines page. Play each and watch where the water goes.
        </p>

        <FireReplay episodes={BRIEF_FIRES} title="World 1002, three helms" />

        <p>
          On this map the obvious rule saved every house and burned fewer than half as many cells as standing by. One
          map is an anecdote, though, and this one was chosen <em>because</em> the difference is dramatic. So measure it
          on 200 worlds the rules have never been tuned on.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Over 200 held-out worlds, standing by damages 6.79 of the 9 village cells on average. How often does
            &ldquo;fly to the nearest fire&rdquo; leave the village completely untouched?</>}
          options={["Almost always", "About two worlds in three", "About half the time", "Rarely — it just slows the fire down"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeTwoHelms} />
        <CodeOutput>{`stand by                 village damaged 6.79 / 9 · untouched in 20% of worlds · 169 cells burnt
fly to the nearest fire  village damaged 2.65 / 9 · untouched in 65% of worlds · 83 cells burnt`}</CodeOutput>
        <p>
          <strong>About two worlds in three.</strong> The obvious rule cuts the village damage by more than half and the
          burnt land almost exactly in half. So requirement 1 does not hold the way it did for the boat: the obvious
          thing is good. What makes this world worth building is the one in three it still loses, and the question of
          whether a better rule — or a trained crew — can win those back. The baselines page answers the first half:
          a rule that guards the village instead of chasing the nearest flames leaves it untouched in 77% of worlds.
        </p>

        <h2>Answering the spec, one decision at a time</h2>
        <p>
          The same eight questions as the{" "}
          <Link href="/learn/building-environments/plan-parameterise-code-test-train" style={link}>sailboat&rsquo;s spec card</Link>,
          with the reasoning for each answer, and the alternative where there was one.
        </p>

        <h3 style={h3}>What success means</h3>
        <p>
          <strong>Decision: three numbers over 200 held-out worlds, in this order — village cells damaged (out of 9),
          the share of worlds where the village is untouched, and cells burnt.</strong> The order is the task
          sentence&rsquo;s order. We report the first two separately because they answer different questions: an
          average of 2.65 damaged cells could be every village lightly singed or a third of villages burnt flat, and a
          fire chief cares a great deal which. The held-out worlds are seeds 1000 to 1199; training never sees them.
        </p>

        <h3 style={h3}>What the world contains</h3>
        <p>
          <strong>Decision: a 16 × 16 map of grass, forest and rock, one lake, a 3 × 3 village, and a smooth random
          hill.</strong> Grass catches easily and burns out in two fire ticks; forest is slower to catch but burns for
          five. That contrast is the smallest one that makes the choice of where to drop interesting. The units are
          deliberately abstract — a cell and a step, not metres and seconds — because we tuned the world for what it
          teaches, not calibrated it against real fire behaviour, and pretending otherwise would be a lie with
          decimal places.
        </p>

        <h3 style={h3}>Several systems, several clocks</h3>
        <p>
          <strong>Decision: the helicopter acts every step, the fire advances every 2 steps, and the wind shifts every
          30.</strong> This is the part that makes World 2 a different kind of world, and it gets its own page. The
          short version: the ratio between the helicopter&rsquo;s clock and the fire&rsquo;s decides how much a single
          helicopter can matter, and so how much room there is between a poor rule and a good one. The coupled-clocks
          page measures what changing that ratio does.
        </p>

        <h3 style={h3}>What the crew sees</h3>
        <p>
          <strong>Decision: the whole map, as twelve layers.</strong> Four for what each cell is, one each for height and
          dryness, two for burning and burnt, one marking the helicopter, one for the water in the bucket, and two for
          the wind. A real incident commander sees far less than this. We chose full information on purpose, for the
          same reason the boat had a steady wind: when a trained crew makes a bad choice, we want to know it was not
          because it could not see the fire.
        </p>

        <h3 style={h3}>What the crew can do</h3>
        <p>
          <strong>Decision, for now: the environment offers a pilot&rsquo;s controls — hover, fly one cell north,
          east, south or west, and one button that fills the bucket over the lake or drops it anywhere else.</strong> A
          drop soaks a 5 × 5 square: burning cells go out, and every cell it lands on is left wet. Whether an agent
          should actually <em>fly</em> the helicopter, or give orders to someone who does, is a question we will
          settle with measurements in chapter 5 — and the answer changed the design.
        </p>

        <h3 style={h3}>Where the randomness is</h3>
        <p>
          <strong>Decision: everything random comes from the one seed, in a fixed order.</strong> The map, where the
          lake and village go, how dry each cell is, two ignitions at least six cells from the village, the starting
          wind, then the fire&rsquo;s dice on every tick and the wind&rsquo;s shift every 30 steps. The order matters:
          the fire&rsquo;s dice are drawn the same way whatever the helicopter does, so you can replay a world with one
          decision changed and see exactly what that decision was worth. Chapter 5 uses that trick to explain why the
          first trained crew learned nothing.
        </p>

        <h3 style={h3}>How an episode ends</h3>
        <p>
          <strong>Decision: when no cell is burning (terminated), or after 300 steps (truncated).</strong> A fire that
          is out is over — nothing that happens afterwards can burn anything. The 300-step limit is a safety net: across
          the 200 worlds, even standing by lets the fire burn out in 78 steps on average, so a crew that hits the limit
          is doing something strange, and the label says so.
        </p>

        <h3 style={h3}>What the crew is paid</h3>
        <p>
          <strong>Decision: deferred, and this time it is the whole point.</strong> The environment accepts three
          reward rules: a cost of 1 for every cell that catches fire plus an extra 10 when that cell is part of the
          village; a cost for land alone; and a payment for every burning cell the crew puts out. The last one sounds the most like
          &ldquo;reward good firefighting&rdquo;. Chapter 5 trains a crew on it and measures what that payment buys.
        </p>

        <Callout color={GOLD} title={<>No ceiling means you need a bar you trust</>}>
          The sailboat taught you to compute the best possible score before training anything, so that a result could
          be read. Most real environments do not allow that. When they do not, the substitute is a strong hand-written
          policy, built and tested first, with its score written down before any agent is trained. Without it,
          &ldquo;the agent damaged 2.5 village cells&rdquo; is a number with nothing to be compared with — and a
          trained agent that loses to a dozen-line rule is a finding, not a failure to hide.
        </Callout>

        <h2>What the next page builds</h2>
        <p>
          You have the sentence, the reasons, and two hard facts: standing by loses most of the village, and the
          obvious rule already saves it in two worlds out of three. The next page builds the fire itself — a cellular
          automaton, where every cell looks only at its neighbours — and writes its spread rule line by line.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/training-ground", label: <>← Training ground: train the fleet yourself</> }}
          next={{ href: "/learn/building-environments/fire-as-a-cellular-automaton", label: <>Next · Fire as a cellular automaton →</> }}
        />
      </div>
    </article>
  );
}

const codeStandBy = `env = Wildfire()
env.reset(seed=1002)
draw_fire(env)                                             # the moment the alarm comes in
while True:
    _, reward, terminated, truncated, info = env.step(0)   # 0 = hover over the village, do nothing
    if terminated or truncated: break
print()
draw_fire(env)
s = env.summary()
print(f"standing by: the fire went out on its own after {s['t']} steps, "
      f"{s['burnt']} of 256 cells burnt, {s['village_damaged']} of 9 village cells damaged")`;

const codeTwoHelms = `for name, helm in [("stand by", lambda env: 0),
                   ("fly to the nearest fire", pilot_chief("nearest"))]:
    s = fly(helm)                                          # 200 held-out worlds
    print(f"{name:24s} village damaged {s['village_damaged']:.2f} / 9 · untouched in "
          f"{s['village_saved']:.0%} of worlds · {s['burnt']:.0f} cells burnt")`;

const brief: React.CSSProperties = {
  borderLeft: "3px solid var(--c-rl)",
  background: "color-mix(in srgb, var(--c-rl) 7%, transparent)",
  padding: "14px 18px",
  borderRadius: "0 8px 8px 0",
  fontFamily: "var(--font-display)",
  fontSize: 19,
  lineHeight: 1.45,
  color: "var(--ink)",
  margin: "1rem 0 1.2rem",
};
const h3: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 19, marginTop: "1.6rem", color: "var(--ink)" };
