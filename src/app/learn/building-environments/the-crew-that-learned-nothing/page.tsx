import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { RandomPilotLab } from "@/components/fire/RandomPilotLab";

export const metadata = {
  title: "The crew that learned nothing — Manifold",
  description:
    "Hand a million steps of PPO and DQN the helicopter's six buttons and the best run scores 2.82 village cells — which turns out to be one line of Python. The diagnosis: the chain a useful drop needs never happens by accident, and one good drop is a whisper against the noise between worlds. Exploration is a property of the world you built.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function CrewThatLearnedNothing() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 22 minutes"
        title={<>The crew that learned nothing</>}
        intro={<>The world is built, tested and measured, and the{" "}
          <Link href="/learn/building-environments/baselines" style={link}>baselines</Link> left two things behind: a bar,
          the guard chief&rsquo;s −93.2, and a trap, the single drop at step 0 that buys most of the village protection
          without fighting anything. So we handed the helicopter&rsquo;s six buttons to two learners that work elsewhere in
          this course and gave them a million steps each. This page is the failure, and the diagnosis. The diagnosis is
          about the environment, not the algorithm — which is why it belongs in a track about building environments.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What we handed them</h2>
        <p>
          The interface is the one the world already has. The agent sees what <code>observe()</code> returns: the twelve
          map layers from the <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link>{" "}
          — terrain, elevation, moisture, burning, burnt, the helicopter&rsquo;s own cell, its bucket, and the wind as two
          numbers. It presses one of six buttons: hover, north, east, south, west, and the one button that fills at the
          lake or drops everywhere else. It is paid the values reward, −1 for each cell that catches and −10 more for each
          village cell. We will call this the <strong>flat pilot</strong> interface, because every decision is a single
          stick movement.
        </p>
        <p>
          Two learners. <strong>DQN</strong>, the one built in the{" "}
          <Link href="/learn/function-approximation" style={link}>function-approximation track</Link>, with a replay
          buffer, a target network and double-Q updates. And <strong>PPO</strong>, which the policy-gradient track teaches
          properly and which is used here as a tool. Both read the map with the same three convolution layers into a
          256-unit layer; both train on worlds seeded from 10<sup>6</sup> upward and are tested on the 200 held-out worlds,
          seeds 1000 to 1199, that no crew ever trains on. Training runs torch on a GPU, so it is the one thing on this
          page you cannot press Run on; everything used to diagnose it, you can.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The best of those runs came back with 2.82 village cells damaged. Standing by loses 6.79 and the guard
            chief loses 1.03. What did it learn?</>}
          options={["To fight the fire nearest the village", "To fight the nearest fire, badly", "Something much simpler than either", "Nothing — 2.82 is luck"]}
        />

        <h2>Ten runs, one answer</h2>
        <p>
          Ten flat-pilot runs; five of them ran to the end and took their held-out test, and those are the table. The first
          four are in the 3 × 3 drop world the prototype started with; the last is the shipped 5 × 5 world. Read the two
          right-hand columns first.
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 660 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Run</th><th style={th}>Drop</th><th style={thr}>Steps</th><th style={thr}>Village</th>
                <th style={thr}>Untouched</th><th style={thr}>Return</th><th style={thr}>Drops/ep</th><th style={thr}>Put out/ep</th>
              </tr>
            </thead>
            <tbody>
              {RUNS.map(([run, drop, steps, v, u, r, d, e], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", ...(i === RUNS.length - 1 ? { background: "color-mix(in srgb, var(--c-rl) 7%, transparent)" } : {}) }}>
                  <td style={td}>{run}</td><td style={td}>{drop}</td>
                  {[steps, v, u, r, d, e].map((x, j) => <td key={j} style={tdr}>{x}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.6rem" }}>
          For scale: standing by loses 6.79 village cells in both worlds, because it never drops. The guard chief loses
          2.64 with a 3 × 3 drop and 1.03 with 5 × 5, putting out 13.4 cells from about 2.8 drops an episode.
        </p>

        <p>
          Every one of them drops <strong>once</strong>, and the best of them puts out <strong>nothing at all</strong>. A
          crew that never extinguishes a cell is not fighting a fire. So what is a helicopter doing with exactly one drop
          an episode? It is doing the thing the baselines page warned about: the bucket starts full, hovering over the
          middle of the village, and a 5 × 5 drop covers the whole 3 × 3 village. Press the button once at step 0 and the
          village is soaked for the next 149 steps.
        </p>
        <p>That rule is one line. Run it against the crew.</p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeOneLine} />
        <CodeOutput>{`                        village  untouched    burnt    return  drops  put out  steps
PPO, 1M steps             2.815      44.0%  152.155  -178.305   1.00    0.000  77.39
one drop, then hover      2.815      44.0%  152.155  -178.305   1.00    0.000  77.39`}</CodeOutput>

        <p>
          Not close. <strong>Identical</strong>, on every column, to three decimal places. A million environment steps, a
          convolutional network and a GPU converged on <code>5 if env.t == 0 else 0</code>. And it is not a fluke of one
          seed: in the 3 × 3 world the same one-line rule scores 4.145, and the three runs there came back with 4.165,
          4.47 and 4.53 — at the rule or just behind it, never ahead. Four runs, two worlds, two reward scales and two ways
          of seeing the map, all landing on the same line of Python.
        </p>
        <p>
          It did not even find the <em>best</em> version of its own trick. The ground dries at 0.01 of moisture a fire
          tick, so water laid down at step 0 has partly worn off by the time a distant fire arrives. Press the same button
          once, a little later:
        </p>
        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>One drop, then hover — pressed at</th><th style={thr}>Village</th><th style={thr}>Untouched</th><th style={thr}>Return</th>
              </tr>
            </thead>
            <tbody>
              {LATE.map(([k, v, u, r], i) => (
                <tr key={i} style={{ borderBottom: i < LATE.length - 1 ? "1px solid var(--border)" : undefined, ...(i === 1 ? { background: "color-mix(in srgb, var(--c-rl) 7%, transparent)" } : {}) }}>
                  <td style={td}>{k}</td><td style={tdr}>{v}</td><td style={tdr}>{u}</td><td style={tdr}>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Waiting ten steps is worth 0.6 of a village cell and eight points of return; waiting forty throws the whole trick
          away, because by then the fire has arrived. So the crew did not find the best moment to press the button. It
          found the moment that is one step away from where every episode begins — which is the shape of the whole problem
          in miniature.
        </p>

        <Callout color={GOLD} title={<>A score that beats a weak baseline is not evidence of learning</>}>
          2.82 against stand-by&rsquo;s 6.79 looks like progress, and on a chart of village damage against training steps it
          would look like a learning curve. The columns that tell the truth are the ones that describe the{" "}
          <em>mechanism</em>: drops per episode and cells put out per episode. Both say the helicopter flew nowhere and
          fought nothing. Whenever a crew clears a bar in this chapter, the first question is not how much it scored but
          what it physically did to score it.
        </Callout>

        <h2>Three suspects</h2>
        <p>
          A learner that does nothing has three usual suspects, and the runs above were built to take them one at a time.
        </p>
        <p>
          <strong>The reward is enormous.</strong> Returns are around −200, so the value head has a large target and, with
          the gradient clipped, the value loss can swamp the policy gradient. Multiplying the reward by 0.1 is the
          standard first move. It changed the score from 4.47 to 4.17 and left the drops at 0.995. Suspect dismissed.
        </p>
        <p>
          <strong>The helicopter is one pixel.</strong> On a 16 × 16 map the agent&rsquo;s own position is a single 1 in one
          layer, and two stride-2 convolutions could easily blur it away. So we gave it a 31 × 31 view centred on itself,
          with a thirteenth layer marking which of those cells are really on the map. Score 4.53, drops 0.995. Suspect
          dismissed.
        </p>
        <p>
          <strong>Exploration.</strong> A useful drop is not one action. It is <em>fill at the lake</em>, then{" "}
          <em>fly to a fire</em>, then <em>press the button with fire underneath</em> — and the middle step is a lot of
          steps. This is the one the rest of the page is about.
        </p>
        <p>
          There was also a fourth move, which should have helped and did not. The{" "}
          <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link> chose the 5 × 5
          drop partly because it triples how loud a good drop is: the signal-to-noise of the first bucket goes from 0.039
          to 0.125. A bigger lever did not rescue the flat pilot. It made the trap better paid — the last row of the table
          is the best score on the page and the only one with exactly zero cells put out.
        </p>

        <h2>The chain that never happens</h2>
        <p>
          The cleanest way to see an exploration problem is to look at what random play ever stumbles into, because that is
          the pool of experience every learner starts from. A learner cannot reinforce behaviour it has never once
          produced. So: 200 held-out worlds, a pilot pressing one of the six buttons uniformly at random, and three
          questions. Does it ever fill the bucket? Does it ever put out fire with the bucket it started with? And does it
          ever put out fire <em>after</em> a refill — the whole chain, start to finish?
        </p>
        <p>
          Two versions of the same pilot get help. One has a bucket that never empties, so it needs no lake at all. The
          other is parked on the water when the episode begins.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Out of 200 episodes, how many times does the plain random pilot complete the whole chain — refill,
            then put out fire?</>}
          options={["About 1", "About 10", "About 40", "Most of them — fire is everywhere"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeFunnel} />
        <CodeOutput>{`  a random pilot that...     refills  scores  chains  put out/ep   drops   steps
  presses buttons                 13      10       1        0.21    1.07    78.1
  never empties its bucket         -     132       0        2.67   11.80    71.8
  starts on the lake              81      60      21        1.53    1.46    76.4`}</CodeOutput>

        <p>
          <strong>One.</strong> In 200 episodes, one random pilot ever refilled and then put fire out. Thirteen reached the
          lake and pressed the button there; ten managed to hit fire with the bucket they were given. The whole job, done
          once by accident, in 200 fires.
        </p>
        <p>
          The middle row says which link is missing. Give the pilot water for nothing and it scores in{" "}
          <strong>132 of 200</strong> episodes and puts out 2.67 cells an episode, from 11.8 drops. Finding fire was never
          the hard part — the map is full of it, and a 5 × 5 square pressed at random lands on flames often enough.{" "}
          <em>Getting more water</em> is the part that never happens. And the last row shows how cheaply that can change:
          start the helicopter on the lake instead of over the village and the chain completes 21 times instead of once.
        </p>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          One caveat on that last row. Moving the start also moves the helicopter away from the village and, on most of
          these maps, nearer the fire, so its 60 early scores are not comparable with the plain pilot&rsquo;s 10 — it is a
          different first drop, not just a different bucket. The number worth keeping is the 21, because the plain pilot
          and the lake pilot face the identical refill problem once their first bucket is gone.
        </p>
        <p>
          None of this is a hypothetical pool of experience. The DQN runs anneal ε from 1.0 down to 0.05 over the first
          fifth of training, so for their first two hundred thousand steps their behaviour is close to the top row. These
          200 worlds are held-out ones and training draws different seeds, so the exact count would differ — but the rate
          would not, and a buffer filled at that rate holds almost no example of the thing the crew is supposed to learn.
        </p>

        <h2>Why: the lake is further away than the fire lasts</h2>
        <p>
          The funnel says the refill never happens. The reason is geometry, and it can be measured without any fire at
          all. Freeze the fire, let a random pilot wander, and time how long it takes to first stand on water.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeWalk} />
        <CodeOutput>{`shortest flight from the village to the lake: median 9 steps, worst 18
a random walk first stands on the water after: median 411, mean 565, best 19, worst 3385
an average episode lasts 77.7 steps, so it arrived in time in 19 of 200 worlds`}</CodeOutput>

        <p>
          A chief flies it in nine steps. A random walk takes a median of 411, because a walk that takes one step forward
          and one step back covers ground like the square root of time, not like time. The fire is out after 78. In 19 of
          200 worlds the wandering helicopter reached the water before the episode ended — and reaching it is only the
          first link. It then has to press button 5 while standing there rather than drifting off, fly back to a fire that
          has moved in the meantime, and press again with flames underneath. One in 200 is what all of that multiplies out
          to.
        </p>

        <Callout color={GOLD} title={<>Exploration is a property of the world, not a knob on the learner</>}>
          The instinct when nothing is learned is to explore harder: raise ε, raise the entropy bonus, add noise to the
          parameters. Every one of those makes the walk <em>more random</em>. None of them makes the lake closer. The
          distance between where an agent starts and the first thing it can be paid for is something the environment&rsquo;s
          designer chose, usually without noticing — here, by putting the lake at least five cells from the village on the{" "}
          <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link> and by letting the
          fire burn out in about 78 steps.
        </Callout>

        <h2>And when it does happen, it is a whisper</h2>
        <p>
          Suppose the chain <em>does</em> complete. The learner now has to notice. On the{" "}
          <Link href="/learn/building-environments/baselines" style={link}>baselines page</Link> every rule was compared
          world by world, because the fire draws its dice whatever the helicopter does. The same trick prices a single
          action: replay a world twice with the same chief, the second time with its first drop replaced by a hover, and
          the difference in return is exactly what that one bucket was worth.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeWhisper} />
        <CodeOutput>{`one bucket, well aimed:      +9.27 return   (median +2.0; helps 60%, changes nothing 22%, hurts 18%)
the whole guard policy:    +142.06 return   (against standing by)
returns differ from world to world with sd 74.1
  -> signal / noise   one bucket 0.125   whole policy 1.9
  -> on unpaired worlds, seeing one bucket at two standard errors takes about 512 episodes a side`}</CodeOutput>

        <p>
          A good drop from the best rule we have is worth <strong>+9.27</strong> — and it hurts in 18% of worlds, because
          water spent early is water not spent later. The returns themselves swing by 74 points from world to world, so the
          drop is an eighth of the noise it is buried in. Flying the <em>whole</em> guard policy is worth +142, nearly two
          standard deviations: a shout. The learner&rsquo;s problem is that the only way to the shout is through thousands of
          whispers, each one of which it must hear correctly to take the next step.
        </p>

        <Proof title="Why 0.125 is the optimistic number">
          <p>
            <strong>Step 1 — where the noise comes from.</strong> A policy gradient scales each action&rsquo;s update by the
            return that followed it, or by an advantage: the return minus a baseline <M>b(s)</M>. Without a baseline the
            update carries the full spread of returns, sd <M>74.1</M>, to reinforce an action worth <M>9.27</M>.
          </p>
          <p>
            <strong>Step 2 — what a baseline can and cannot remove.</strong> A learned value baseline subtracts the{" "}
            <em>average</em> return from this state, over all worlds and all dice. Our replay subtracts something strictly
            better: the return of <em>this same world with these same dice</em>, differing only in the one action. So the
            0.125 is what a perfect, impossible baseline would leave. A real baseline leaves less signal, not more.
          </p>
          <p>
            <strong>Step 3 — the price in episodes.</strong> To resolve a shift of <M>\Delta</M> at two standard errors
            from unpaired returns with spread <M>s</M> needs about <M>{String.raw`n = 2\,(2s/\Delta)^2`}</M> episodes a
            side: with <M>s = 74.1</M> and <M>{String.raw`\Delta = 9.27`}</M>, about <strong>512</strong>. Paired, the
            difference has a spread of only 26.97, so 200 worlds already resolve it to 4.9 standard errors and{" "}
            <strong>34</strong> worlds would have done. That 30-fold gap is the whole reason this page can diagnose in
            seconds what a training run could not answer in an hour: we can hold the dice still and the learner cannot.
          </p>
          <p>
            <strong>What this does not prove.</strong> It is not a proof that the flat pilot is unlearnable. Learners do
            better than this arithmetic — they pool experience across states, reuse it, and bootstrap. It is an estimate of
            how loud the evidence is for one good action, and it is quiet.
          </p>
        </Proof>

        <h2>Reading your own training curve</h2>
        <p>
          Five runs are missing from that table, and it is worth saying exactly why, because the curves are where the
          temptation to self-deceive lives. Both DQN runs in the 3 × 3 world were stopped at about 1.2M steps with their
          curves sitting at 6.3 to 6.6 village cells and 0.3 to 0.5 cells put out; the helicopter-centred DQN run was
          stopped at 0.22M, at 6.1 to 6.6. In the 5 × 5 world, DQN was stopped at 0.81M with a curve at 3.4 to 3.8 and 0.2
          to 0.3 put out, and the helicopter-centred PPO run at 0.61M with 3.2 to 3.4. Pressing buttons at random scores
          4.95 in the 3 × 3 world and 3.55 in the 5 × 5 one, putting out 0.07 and 0.21 cells an episode. We stopped these
          without running the held-out test, so the honest claim is narrow: after those steps, nothing in their behaviour
          separated them from a random pilot.
        </p>
        <p>
          A curve at 3.4 still looks much better than stand-by&rsquo;s 6.79, and part of that gap is an artefact worth
          knowing about. A training curve averages the episodes that <em>finished</em> inside a window, and short episodes
          finish first. Short episodes are the small fires.
        </p>
        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Standing by, 200 held-out worlds</th><th style={thr}>Village cells damaged</th>
              </tr>
            </thead>
            <tbody>
              {BIAS.map(([k, v], i) => (
                <tr key={i} style={{ borderBottom: i < BIAS.length - 1 ? "1px solid var(--border)" : undefined }}>
                  <td style={td}>{k}</td><td style={tdr}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Episode length and village damage correlate at +0.33, and weighting episodes by 1 ⁄ length — roughly what a
          window of finished episodes does — turns the true 6.79 into 5.89. That is about a village cell of free optimism
          in every curve on this page, before any learning happens. It is why every number that decides anything in this
          chapter comes from the 200 held-out worlds, run to completion, after training stops.
        </p>

        <h2>Watch one</h2>
        <p>
          The lab flies a random pilot on the lab map so you can see what &ldquo;no useful experience&rdquo; looks like from
          the inside, then counts 200 of them into the same funnel the cell above printed. The two switches are the two
          links you can remove.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Fly one pilot and watch where the trail goes — then count 200 and read the bottom bar. Now switch on{" "}
            <strong>a bucket that never empties</strong> and count again, and then <strong>start it on the lake</strong>{" "}
            instead.</>}
          insight={<>The lab map is harder than the environment&rsquo;s worlds: its lake is 18 steps from the village, not the
            median 9, so not one of 200 random pilots ever stands on the water — 0 of 200, against 13 in 200 in the real
            worlds. Twenty-eight of them still hit fire with the bucket they were handed. Give them free water and 146 of
            200 score, 2.82 cells an episode from 9.73 drops — far short of what the chiefs put out on this map, 12.2 for
            guard and 20.5 for nearest, but no longer nothing. Start them on the lake and 77 refill and 21 complete the
            chain. Every one of those
            switches is something you could change about the world; none of them is something you could change about the
            learner.</>}
        >
          <RandomPilotLab />
        </LabFrame>

        <h2>Four ways out, and the one that belongs here</h2>
        <p>
          Nothing above says the flat pilot is impossible. It says the evidence a flat pilot needs is rare and quiet, and
          there are four honest responses to that.
        </p>

        <Callout color={GOLD} title={<>Decision record: change the action, not the learner</>}>
          <p style={{ margin: 0 }}>
            <strong>Shape the reward.</strong> Pay a little for carrying water toward a fire, the way the{" "}
            <Link href="/learn/warehouse-robot-capstone/designing-the-reward" style={link}>warehouse capstone</Link>{" "}
            shapes with a potential function. Not tested here. It works by putting <em>our</em> idea of progress into the
            reward, and this world was built to find out whether a crew can beat our ideas.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Show it how.</strong> Fill the replay buffer with guard-chief episodes and learn from there. Not
            tested. Same objection, more directly: it teaches the crew the answer we already have.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Change where training starts.</strong> A curriculum — start on the lake, or beside the fire, and
            anneal back. This one we <em>did</em> measure: starting on the lake takes the chain from 1 episode in 200 to
            21. It is a real fix and it is the strongest of the three. What it changes is the distribution the crew trains
            on, not the world, so it leaves the 16-step flight to the lake exactly where it was and hopes the crew carries
            its habit back.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Change the action interface — chosen.</strong> Let one decision be <em>a target cell</em>, and let a
            scripted pilot fly there, refilling on the way when the bucket is empty. Three reasons. It is the only one of
            the four that lives in the environment, and the evidence points at the environment: the reward scale and the
            observation were each changed with no effect, and the free-water row shows the missing link is the refill
            chain rather than the fire. It matches the job — a fire command centre hands out targets, not stick inputs, and
            &ldquo;one button press per second of flight&rdquo; was our first guess at an interface, not something the task
            demanded. And it leaves the crew free on the question we actually care about, which fire to fight, while
            handing away the part nobody wants a network to rediscover, how to fly in a straight line.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>What it costs.</strong> We will never see a crew invent a better flight pattern than &ldquo;go straight
            there&rdquo;, because we have removed its ability to try. And a scripted pilot introduces a new design knob — how
            often the commander gets to change its mind — that can be set badly. The next page builds the interface and
            measures both.
          </p>
        </Callout>

        <h2>What an hour of GPU bought</h2>
        <p>
          Ten training runs — the five that finished took 58 minutes of a 1660 Ti between them, and five more were stopped
          part-way — and the finding was: the crew learned a one-line rule. The three experiments that explained why — the
          funnel, the random walk, and the hushed drop — take about
          twenty-five seconds of CPU between them and all three are on this page with a Run button. That is not an argument
          against training. It is an argument for spending the first hour of a new world on what random play stumbles into
          and how loud a good action is, because both are answers about the environment, and you can have them before you
          own a GPU.
        </p>
        <p>
          The bar is still the guard chief&rsquo;s −93.2. The next page changes what a decision means and sees whether a crew
          can get near it.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/baselines", label: <>← Baselines a fire chief would try</> }}
          next={{ href: "/learn/building-environments/pilot-or-commander", label: <>Pilot or commander: choosing the action →</> }}
        />
      </div>
    </article>
  );
}

// [run, drop, steps, village, untouched, return, drops/ep, put out/ep] — held-out tests, 200 worlds
const RUNS: [string, string, string, string, string, string, string, string][] = [
  ["PPO, reward as written, seed 0", "3 × 3", "2M", "6.565", "20.5%", "−232.87", "0.48", "0.355"],
  ["PPO, reward as written, seed 1", "3 × 3", "2M", "4.470", "28.5%", "−206.47", "0.995", "0.070"],
  ["PPO, reward × 0.1", "3 × 3", "1M", "4.165", "28.5%", "−202.73", "0.995", "0.055"],
  ["PPO, reward × 0.1, helicopter-centred view", "3 × 3", "1M", "4.530", "27.5%", "−206.11", "0.995", "0.025"],
  ["PPO, reward × 0.1", "5 × 5", "1M", "2.815", "44.0%", "−178.31", "1.000", "0.000"],
];

// one drop at step k, then hover, in the shipped 5 × 5 world (200 held-out worlds)
const LATE: [string, string, string, string][] = [
  ["step 0 — what the crew learned", "2.815", "44.0%", "−178.31"],
  ["step 10", "2.215", "53.0%", "−170.16"],
  ["step 20", "2.325", "54.0%", "−172.60"],
  ["step 30", "3.505", "41.5%", "−188.33"],
  ["step 40", "4.630", "34.0%", "−202.52"],
];

const BIAS: [string, string][] = [
  ["The shorter half of episodes (72 steps or fewer)", "5.92"],
  ["The longer half", "7.68"],
  ["All 200, the number that counts", "6.79"],
  ["Weighted by 1 ⁄ length, as a training window sees them", "5.89"],
];

const codeOneLine = `# What a million steps of PPO on the pilot's six buttons scored on the 200 held-out worlds.
# (The training itself runs on a GPU, not in this browser; this is the row its held-out test printed.)
CREW = ("PPO, 1M steps", 2.815, 0.440, 152.155, -178.305, 1.00, 0.000, 77.39)

def one_drop(env):
    "The helicopter starts full, over the village. Press the button once, then hover for the rest of the fire."
    return 5 if env.t == 0 else 0

village, burnt, returns, put_out, drops, steps = [], [], [], [], [], []
for k in range(200):                                    # the same held-out worlds every baseline faced
    env = Wildfire(); env.reset(seed=1000 + k); total = 0.0
    while True:
        _, r, terminated, truncated, _ = env.step(one_drop(env)); total += r
        if terminated or truncated: break
    s = env.summary()
    village.append(s["village_damaged"]); burnt.append(s["burnt"]); returns.append(total)
    put_out.append(s["put_out"]); drops.append(s["drops"]); steps.append(s["t"])

rule = ("one drop, then hover", np.mean(village), np.mean([v == 0 for v in village]), np.mean(burnt),
        np.mean(returns), np.mean(drops), np.mean(put_out), np.mean(steps))
print(f"{'':22s}{'village':>9}{'untouched':>11}{'burnt':>9}{'return':>10}{'drops':>7}{'put out':>9}{'steps':>7}")
for name, v, u, b, g, d, e, t in (CREW, rule):
    print(f"{name:22s}{v:9.3f}{u:11.1%}{b:9.3f}{g:10.3f}{d:7.2f}{e:9.3f}{t:7.2f}")`;

const codeFunnel = `# A pilot that presses one of the six buttons uniformly at random, and the same pilot given a hand.
# "chains" counts episodes where it put fire out AFTER a refill: fill at the lake, fly to a fire, press the button.

def funnel(name, free_water=False, on_lake=False):
    rng = np.random.default_rng(0)
    refills = scores = chains = put_out = drops = steps = 0
    for k in range(200):
        env = Wildfire(); env.reset(seed=1000 + k)
        if on_lake:                                      # park it on the water instead of over the village
            lake = np.argwhere(env.T == LAKE)
            env.pos = lake[np.abs(lake - env.pos).sum(1).argmin()]
        filled = before = after = 0
        while True:
            if free_water: env.water = BUCKET            # a bucket that fills itself, so no lake trip is needed
            _, _, terminated, truncated, info = env.step(int(rng.integers(6)))
            filled = filled or env.stats["fills"] > 0
            if info["put_out"] > 0:
                if filled: after += 1
                else: before += 1
            if terminated or truncated: break
        s = env.summary()
        refills += filled > 0; scores += before > 0; chains += after > 0
        put_out += s["put_out"]; drops += s["drops"]; steps += s["t"]
    print(f"  {name:26s}{'-' if free_water else refills:>8}{scores:8d}{chains:8d}"
          f"{put_out / 200:12.2f}{drops / 200:8.2f}{steps / 200:8.1f}")

print(f"  {'a random pilot that...':26s}{'refills':>8}{'scores':>8}{'chains':>8}{'put out/ep':>12}{'drops':>8}{'steps':>8}")
funnel("presses buttons")
funnel("never empties its bucket", free_water=True)
funnel("starts on the lake", on_lake=True)`;

const codeWalk = `# How long does a random walk take to find the water? Freeze the fire, so this is pure geometry.
rng = np.random.default_rng(1)
shortest, found = [], []
for k in range(200):
    env = Wildfire(fire_every=10**9, max_steps=10**9); env.reset(seed=1000 + k)
    lake = np.argwhere(env.T == LAKE)
    shortest.append(int(np.abs(lake - env.pos).sum(1).min()))    # the flight a chief would make
    for step in range(5000):
        env.step(int(rng.integers(6)))
        if env.T[tuple(env.pos)] == LAKE:
            found.append(step + 1); break
    else:
        found.append(np.nan)                                     # never got there

f = np.array(found, float)
print(f"shortest flight from the village to the lake: median {np.median(shortest):.0f} steps, worst {max(shortest)}")
print(f"a random walk first stands on the water after: median {np.nanmedian(f):.0f}, mean {np.nanmean(f):.0f}, "
      f"best {np.nanmin(f):.0f}, worst {np.nanmax(f):.0f}")
print(f"an average episode lasts 77.7 steps, so it arrived in time in {int((f <= 77.7).sum())} of 200 worlds")`;

const codeWhisper = `# Replay every world twice with the guard chief: once as it flies, once with its FIRST drop replaced by a hover.
# The fire draws its dice whatever the helicopter does, so the gap in return is exactly what that bucket was worth.
guard = pilot_chief("guard")

def replay(policy, hush_the_first_drop=False):
    out = []
    for k in range(200):
        env = Wildfire(); env.reset(seed=1000 + k); total = 0.0; dropped = 0
        while True:
            a = policy(env)
            if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE:     # a drop, not a fill
                if hush_the_first_drop and dropped == 0: a = 0
                dropped += 1
            _, r, terminated, truncated, _ = env.step(a); total += r
            if terminated or truncated: break
        out.append(total)
    return np.array(out)

full, hushed, standing_by = replay(guard), replay(guard, True), replay(lambda env: 0)
effect, sd = (full - hushed).mean(), full.std()
print(f"one bucket, well aimed:    {effect:+7.2f} return   (median {np.median(full - hushed):+.1f}; helps "
      f"{np.mean(full > hushed):.0%}, changes nothing {np.mean(full == hushed):.0%}, hurts {np.mean(full < hushed):.0%})")
print(f"the whole guard policy:    {full.mean() - standing_by.mean():+7.2f} return   (against standing by)")
print(f"returns differ from world to world with sd {sd:.1f}")
print(f"  -> signal / noise   one bucket {effect / sd:.3f}   whole policy {(full.mean() - standing_by.mean()) / sd:.1f}")
print(f"  -> on unpaired worlds, seeing one bucket at two standard errors takes about "
      f"{2 * (sd / (effect / 2)) ** 2:.0f} episodes a side")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thr: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
const tdr: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
