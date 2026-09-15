import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { CommanderLab } from "@/components/fire/CommanderLab";

export const metadata = {
  title: "Pilot or commander: choosing the action — Manifold",
  description:
    "An action space is a design decision. Replace the helicopter's six buttons with one target cell and a scripted pilot, and the hand-written chiefs come back to the digit — while a crew choosing at random goes from finishing the job once in 200 fires to 41 times. The cost is a new knob: how long the commander must live with its choice.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PilotOrCommander() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 20 minutes"
        title={<>Pilot or commander: choosing the action</>}
        intro={<>The <Link href="/learn/building-environments/the-crew-that-learned-nothing" style={link}>last page</Link>{" "}
          ended in a decision: change what a decision <em>is</em>, rather than reach for a better learner. This page
          carries it out. We replace the helicopter&rsquo;s six buttons with a single target cell and a scripted pilot, check
          that nothing we already had was thrown away, and then find the knob the change smuggled in — how long the
          commander has to live with each choice. An action space is not something a task hands you. It is something you
          design, and it can be designed badly.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Sixteen presses of flying, one decision</h2>
        <p>
          Look at what the guard chief actually spends its actions on. Over the 200 held-out worlds it takes 46.9 steps
          and delivers 2.81 buckets — <strong>16.7 button presses per bucket</strong>. One of those presses is the
          decision that matters, which fire to fight. The other sixteen are &ldquo;fly straight&rdquo;, and we already know
          the answer to them: the shortest path. We built an environment in which the interesting question comes up once
          every seventeen actions and then buried it in navigation.
        </p>
        <p>
          A real fire command centre does not send stick inputs. It hands out targets. So: <strong>one decision is one
          cell of the map</strong>, any of the 256, and everything between decisions is a script — fill at the nearest
          lake if the bucket is empty, fly toward the target one step at a time, press the button on arrival. That is the
          whole idea. What is left is four choices about how to write it down, and each one is a real fork.
        </p>

        <h3>Four choices, made out loud</h3>
        <p>
          <strong>What can be a target?</strong> Any cell, including cells that are not on fire. The tempting restriction
          — &ldquo;the action is which burning cell to attack&rdquo; — would shrink the action space from 256 to about
          eleven and make every choice useful. It would also delete two of the best rules on the{" "}
          <Link href="/learn/building-environments/baselines" style={link}>baselines page</Link> from the world: soaking
          the village, which aims at the village centre whether or not anything there is alight, and the step-0 drop the
          flat pilot found. A crew that cannot wet unburnt ground cannot do the one thing that actually protects a
          village. The action space stays wide.
        </p>
        <p>
          <strong>Who fills the bucket?</strong> The script does, automatically, whenever the bucket is empty at the
          moment a decision is taken. This is the link the last page showed never happens by accident — a random pilot
          completed the fill-then-drop chain once in 200 fires. We are not hiding a hard problem from the crew; we are
          deciding it was never the crew&rsquo;s problem.
        </p>
        <p>
          <strong>When does a decision end?</strong> On the drop. A decision exists to deliver one bucket, so the
          commander gets the map back the moment the water is in the air.
        </p>
        <p>
          <strong>And if the sortie is long?</strong> Then the commander is blind while it happens, and a sortie can run
          well past a dozen steps. So the script also stops after <M>K</M> steps and asks again, whether or not it
          arrived. <M>K</M> is the fourth choice, it has no obviously right value, and the second half of this page is
          about finding one.
        </p>
        <p>Here is the script, and two decisions on the world we have been flying all chapter.</p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeSortie} />
        <CodeOutput>{`  world 1002: helicopter at (13, 7), bucket full
  decision 1: target (10, 14), bucket full
    step   1  east       (13, 8)
    step   2  east       (13, 9)
    step   3  east       (13,10)
    step   4  east       (13,11)
    step   5  north      (12,11)
    step   6  east       (12,12)
    step   7  north      (11,12)
    step   8  east       (11,13)
    step   9  north      (10,13)
    step  10  east       (10,14)
    step  11  the button (10,14)   DROP -> 4 cells out
  -> the commander gets the map back after 11 steps, because it dropped
  decision 2: target (7, 14), bucket empty
    step  12  north      ( 9,14)
    step  13  north      ( 8,14)
    step  14  north      ( 7,14)
    step  15  north      ( 6,14)
    step  16  north      ( 5,14)
    step  17  west       ( 5,13)
    step  18  the button ( 5,13)   filled the bucket
    step  19  south      ( 6,13)
    step  20  south      ( 7,13)
    step  21  east       ( 7,14)
    step  22  the button ( 7,14)   DROP -> 3 cells out
  -> the commander gets the map back after 11 steps, because it dropped`}</CodeOutput>

        <p>
          Two decisions, eleven steps each, seven cells put out. Notice what the second one did: it named cell (7, 14),
          flew <em>past</em> it to the lake at (5, 13), filled, and came back. The commander never mentioned the lake and
          never had to. But notice the other thing — it chose (7, 14) at step 11 and the water did not land there until
          step 22. Eleven steps is five and a half fire ticks. Whether that cell is still burning when the bucket arrives
          is not obvious, and it is exactly what the clock decides.
        </p>

        <h2>Did we just take something away?</h2>
        <p>
          Wrapping a learner&rsquo;s actions in a script is a way to lose things quietly. The honest first test is not
          &ldquo;does the new interface score well&rdquo; but &ldquo;can it still do everything the old one was actually
          doing&rdquo;. Set the clock to <M>K = 1</M>, so the commander re-decides every step at exactly the pilot&rsquo;s
          rate, and write each hand-written chief as a rule that names a cell instead of a button.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The guard chief, flown by the script at K = 1, against the guard chief pressing its own buttons.
            Which way does it go?</>}
          options={["Worse — a script cannot fly as well as a rule", "Slightly better — the script is tidier", "Identical", "It depends on the world"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeSame} />
        <CodeOutput>{`                                  village  untouched   burnt   return  drops  put out
pilot chief, nearest                 2.65      65.0%    82.9   -108.5   3.42     17.2
commander K=1, nearest               2.65      65.0%    82.9   -108.5   3.42     17.2
pilot chief, guard                   1.03      77.0%    83.7    -93.2   2.81     13.4
commander K=1, guard                 1.03      77.0%    83.7    -93.2   2.81     13.4
commander K=1, soak the village      0.45      79.0%   142.7   -145.8   4.54      1.4`}</CodeOutput>

        <p>
          Identical, column by column. At <M>K = 1</M> the commander interface does not <em>approximate</em> the chiefs;
          it <em>is</em> them, because &ldquo;name the fire nearest the village, then take one step toward it&rdquo; is
          precisely what the guard chief was doing all along. The third row is the one that earns the wide action space:
          soaking the village aims at a cell that is usually not burning at all, saves more village cells than either
          chief, and would have been unrepresentable if we had made the action &ldquo;pick a fire&rdquo;.
        </p>
        <p>
          It is worth being exact about what that does <em>not</em> prove. The commander&rsquo;s action set is not a
          superset of the pilot&rsquo;s behaviours. Three things the flat pilot could do and this crew cannot: drop
          mid-flight on something better that it happened to pass, fly a curved path around a fire front instead of the
          axis-by-axis one the script takes, and deliberately hover to wait. If the best policy in this world needs any of
          those, we have just put it out of reach. Nothing on this page says it doesn&rsquo;t.
        </p>

        <h2>The knob we smuggled in</h2>
        <p>
          <M>K</M> is the number of steps the commander must live with a target before it may choose again. At{" "}
          <M>K = 1</M> it decides as often as the pilot did. With no clock at all, one decision buys a whole sortie and
          the commander speaks about four times an episode. Everything in between is a trade: fewer decisions means a
          shorter chain of actions to assign credit along, and less ability to react.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The guard rule scores −93.2 at K = 1. Give it a longer clock — 4, then 8, then none at all. What
            happens to the return?</>}
          options={["It gets steadily worse", "It holds, then falls off a cliff", "It improves — fewer, better decisions", "It barely moves at any clock"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeClock} />
        <CodeOutput>{`            decisions/ep   drops/ep   put out/ep   put out/drop   target alight    return
  K =    1          46.9       2.81        13.42           4.77          100.0%     -93.2
  K =    4          12.3       2.71        13.71           5.06           84.7%     -92.3
  K =    8           7.3       2.82        14.47           5.13           59.0%    -107.2
  K = none           4.1       3.38        10.92           3.23           10.4%    -152.8`}</CodeOutput>

        <p>
          It holds and then falls off a cliff. The chapter&rsquo;s rule for calling a gap real is about two paired standard
          errors, and world by world against <M>K = 1</M> the differences are{" "}
          <strong>+0.87 at K = 4 (0.4 standard errors)</strong>, −0.85 at <M>K = 2</M> (1.7), −14.02 at <M>K = 8</M>{" "}
          (4.4) and −59.62 with no clock (11.0). So clocks of 1, 2 and 4 are one thing, a clock of 8 is a genuine loss,
          and no clock at all is a rout — from the best rule in the chapter down to worse than the rule that ignores the fire
          entirely and just keeps the village wet (−145.8, three rows above).
        </p>
        <p>
          The <em>target alight</em> column is the mechanism, and it is what a cell can show you that a score cannot. It
          asks a single question at the moment the water leaves the helicopter: is the cell the commander named still
          burning? At <M>K = 1</M> it always is, because the commander re-aimed one step ago. With no clock, nine times
          out of ten it is <strong>not</strong> — the fire there has burnt through or been overtaken during the fourteen
          steps of the flight, and the drop only catches anything because fire nearby has spread into the square. Cells
          put out per drop falls from 5.06 to 3.23 and episodes stretch from 45 steps to 57.
        </p>
        <p>
          <M>K = 8</M> fails differently, and the difference is worth noticing. Its drops are <em>good</em> — 5.13 cells a
          drop, the best of the four rows — but it loses 0.7 of a village cell against <M>K = 1</M> (1.03 → 1.74). A
          commander on an eight-step clock is not making bad choices; it is answering a fire that started near the village
          up to four fire ticks after it started. What a long clock costs is not aim. It is response time.
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr>
                <th style={th} rowSpan={2}>Clock</th>
                <th style={{ ...thr, textAlign: "center" }} colSpan={3}>Guard the village</th>
                <th style={{ ...thr, textAlign: "center" }} colSpan={3}>Name any cell at random</th>
              </tr>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={thr}>Decisions</th><th style={thr}>Put out</th><th style={thr}>Return</th>
                <th style={thr}>Decisions</th><th style={thr}>Put out</th><th style={thr}>Return</th>
              </tr>
            </thead>
            <tbody>
              {CLOCKS.map((r, i) => (
                <tr key={i} style={{ borderBottom: i < CLOCKS.length - 1 ? "1px solid var(--border)" : undefined, ...(i === 2 ? { background: "color-mix(in srgb, var(--c-rl) 7%, transparent)" } : {}) }}>
                  <td style={td}>{r[0]}</td>
                  {r.slice(1).map((x, j) => <td key={j} style={tdr}>{x}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.9rem" }}>
          Decisions and cells put out are per episode, over the 200 held-out worlds. The nearest-fire and densest-square
          rule follows the guard column&rsquo;s shape; the densest-square rule starts slipping a clock earlier. All five
          are in <code>wildfire_cases.py commander</code>.
        </p>

        <p>
          Read the two halves of that table against each other and the knob changes character. For the best rule we have,
          a long clock is a steady loss. For a crew naming cells at random — which is what any learner is, for its first
          few hundred thousand steps — a long clock is worth <strong>43 points of return</strong>, from −229.9 at{" "}
          <M>K = 1</M> to −186.4 with no clock, and ten times as many cells put out.
        </p>

        <Callout color={GOLD} title={<>A knob that helps a bad crew and hurts a good one</>}>
          There is no setting of <M>K</M> that is best for both ends of training, because the two ends want opposite
          things. A good policy wants to re-aim constantly; a policy that does not yet know anything wants to follow one
          idea long enough to find out what it was worth. Every knob that trades exploration against control has this
          shape, and the honest move is to say which end you are protecting. We are protecting the beginning, because a
          crew that never sees the job done cannot get to the end at all.
        </Callout>

        <h2>The chain, again</h2>
        <p>
          The last page&rsquo;s funnel is the cleanest way to ask whether the interface did the thing it was chosen to do.
          Same question, same 200 worlds: does a crew acting at random ever fill the bucket, and does it ever put fire out{" "}
          <em>after</em> filling it — the whole chain, start to finish?
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>A random pilot completed the chain once in 200 fires. A commander naming cells at random, on a
            four-step clock, completes it how often?</>}
          options={["Still about once — random is random", "About 10 times", "About 40 times", "Nearly always"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeChain} />
        <CodeOutput>{`  out of 200 fires                               refills  scores  chains  put out   drops  choices
  a pilot pressing buttons at random                  13      10       1     0.21    1.07     78.1
  a commander naming cells at random, K = 1           45      20       1     0.48    0.28     78.0
  a commander naming cells at random, K = 4          153      64      41     2.60    1.52     19.8
  a commander naming cells at random, K = none       191      66     122     5.01    3.60      4.7`}</CodeOutput>

        <p>
          One in 200 becomes <strong>41 in 200</strong> on a four-step clock, and 122 in 200 with no clock. Cells put out
          per episode go from 0.21 to 2.60 and then 5.01 — twelve times, then twenty-four times, more of the actual job
          done by accident. That is the pool of experience a learner starts from, and it has stopped being empty.
        </p>
        <p>
          The second row is the one to stare at. At <M>K = 1</M> the commander has the refill script, the target-cell
          action, everything — and it completes the chain <strong>once</strong>, exactly as the flat pilot did. It reaches
          the lake more often (45 episodes against 13, because the script goes there when the bucket is empty) and then
          throws it away, because a new random cell every step is a walk that goes nowhere, whatever it is named after. So
          the autopilot is not what fixed exploration. <strong>Persistence</strong> is. The thing that made the chain
          happen was being made to follow one bad idea for four steps.
        </p>
        <p>
          And a wrinkle worth keeping, because it is the sort of thing that makes people abandon a good change. Scored the
          way the chapter scores things, the random commander at <M>K = 4</M> is <em>worse</em> than the random pilot: 5.58
          village cells damaged against 3.55. The reason is the trap from the last page. The random pilot begins sitting
          over the village with a full bucket, so its flailing often dumps water exactly where it helps; the commander
          flies somewhere else first. The headline number got worse and the experience got dramatically better. It is the
          drops and cells-put-out columns that tell you which one you actually want to train.
        </p>

        <Proof title="Why one decision is worth thousands of button presses">
          <p>
            <strong>How wide is 256, really?</strong> At the 2,457 decision points a guard commander visits on the 200
            held-out worlds, an average of <strong>11.2 of the 256 cells</strong> are burning — 4.4% of the map. But an
            action is not a cell, it is a 5 × 5 drop centred on that cell. Draw a target uniformly and its square covers
            at least one burning cell <strong>26.2%</strong> of the time. Since the script guarantees the bucket is full,
            roughly one random decision in four lands water on fire.
          </p>
          <p>
            <strong>Against the flat pilot.</strong> The guard chief needs 16.7 button presses per bucket delivered.
            Pressing at random, one particular seventeen-press sequence has probability{" "}
            <M>{String.raw`6^{-17} \approx 1.7\times10^{-13}`}</M>. That number is not the honest comparison — random play
            does not need one exact sequence, it can wander, which is why the measured answer was 1 in 200 rather than 1
            in 17 trillion. The honest comparison is the measured pair: about <strong>1 in 4 per decision</strong> against
            about <strong>1 in 200 per episode</strong>.
          </p>
          <p>
            <strong>And the credit chain.</strong> The{" "}
            <Link href="/learn/building-environments/the-crew-that-learned-nothing" style={link}>last page</Link> priced
            one good bucket at +9.27 return against a world-to-world spread of 74.1. That has not changed — the world is
            the same. What changed is what has to be picked out. Under the flat pilot the credit for that bucket sat on
            seventeen actions, sixteen of which were navigation that would have been right for almost any target. Under
            the commander it sits on one. The signal is the same size; there is far less for a learner to sort through.
          </p>
          <p>
            <strong>What this does not prove.</strong> 26.2% is measured at the states a <em>guard</em> commander visits,
            which are not the states a random or a half-trained crew visits. It is an order-of-magnitude statement about
            the action space, not a prediction about training.
          </p>
        </Proof>

        <h2>Fly it yourself</h2>
        <p>
          The lab gives you the interface. Pick the targets yourself by clicking the map, or hand it to one of the rules,
          and set the clock. The crosshair is the current target and the badge under the map counts the steps the
          commander still owes it.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Pick <strong>you</strong> and a clock of <strong>4</strong>, then click a fire and watch the sortie
            get interrupted before it arrives. Switch to <strong>no clock</strong> and click the same fire. Then hand it
            to <strong>any cell at all</strong>, count 200 fires at a clock of 1, and count again with no clock.</>}
          insight={<>The lab map is the hard one — its lake is 18 steps from the village rather than the median 9 — and it
            tells the same story. Naming cells at random, the whole chain completes 2 times in 200 at a clock of 1, 22
            times at 4, and 117 times with no clock, and cells put out per fire go 0.72 → 2.50 → 4.90. Now do it with a
            real rule: guarding the village puts out 12.23 cells a fire at a clock of 1 and 11.96 with no clock, but the
            episodes in which it ever puts fire out <em>after</em> a refill fall from 193 in 200 to 135. Same knob, opposite
            direction, exactly as on the real worlds.</>}
        >
          <CommanderLab />
        </LabFrame>

        <h2>What goes in the build log</h2>

        <Callout color={GOLD} title={<>Decision record: the commander interface, on a four-step clock</>}>
          <p style={{ margin: 0 }}>
            <strong>Chosen.</strong> One action is a target cell, all 256 of them. A scripted pilot flies the shortest
            axis-by-axis path, filling at the nearest lake first when the bucket is empty. The decision ends on the drop
            or after <M>K = 4</M> steps, whichever comes first. The observation does not change.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Why 4 and not 1.</strong> Against the best rule we have it is free: +0.87 return world by world, 0.4
            standard errors, where the chapter calls nothing under two. It buys a quarter of the decisions — 12.3 an
            episode instead of 46.9, a shorter chain to assign credit along. And for a crew that starts out choosing at
            random it is worth 41 completed chains in 200 fires instead of 1. One of those three arguments is about the
            trained crew and two are about the untrained one, which is the right balance for a knob that only has to hold
            until the crew is good.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Why not longer.</strong> <M>K = 8</M> costs 14 points of return at 4.4 standard errors and 0.7 village
            cells; with no clock the named cell has gone out before the water lands 90% of the time and the loss is 60
            points. The exploration benefit keeps rising past 4 and we are declining it.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Rejected: an action that must be a burning cell.</strong> Eleven useful actions instead of 256, and
            every one of them sensible. It also makes soaking the village — the rule that saves the most village cells of
            anything in this chapter — literally unsayable, along with the pre-wetting trick a crew already found on its
            own. A narrower action space is a stronger claim about what the answer looks like than we are entitled to
            make.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Rejected: one decision per sortie.</strong> The cleanest interface of all, and the measured worst: the
            fire moves during the fourteen steps the commander is not watching.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>What it costs, and what would move it.</strong> We can no longer see a crew invent a flight pattern,
            because it cannot fly. And <M>K = 4</M> was tuned on hand-written rules and on a crew choosing at random — the
            crew we actually train is neither of those, especially half way through. If a trained crew turns out to want a
            different clock, this is the first number to move, and it is cheap to move because nothing else in the
            environment depends on it.
          </p>
        </Callout>

        <h2>Where that leaves us</h2>
        <p>
          The world is unchanged: same fire, same wind, same helicopter, same reward. What changed is the sentence the
          crew is allowed to say. An episode is about twelve decisions for the guard rule instead of forty-seven, and
          twenty for a crew acting at random instead of seventy-eight; a useful drop happens by accident 41 times in 200
          instead of once; and every rule we spent the baselines page writing is still reachable, to the digit.
        </p>
        <p>
          What has not changed is the bar. The guard chief still scores −93.2 pressing its own buttons, and −92.3 as a
          commander on a four-step clock — the same thing, well inside the noise. Before we hand this to a learner there is one thing left to settle, and it is the one nobody
          can settle with an experiment: the environment pays −1 for each cell that catches and −10 more for each village
          cell, and those two numbers are an opinion about what matters. The next page takes that opinion apart.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-crew-that-learned-nothing", label: <>← The crew that learned nothing</> }}
          next={{ href: "/learn/building-environments/reward-is-a-values-decision", label: <>Reward is a values decision →</> }}
        />
      </div>
    </article>
  );
}

// [clock, guard decisions/ep, guard put out/ep, guard return, random decisions/ep, random put out/ep, random return]
const CLOCKS: string[][] = [
  ["K = 1", "46.9", "13.42", "−93.2", "78.0", "0.48", "−229.9"],
  ["K = 2", "24.1", "13.61", "−94.0", "38.5", "0.80", "−222.6"],
  ["K = 4", "12.3", "13.71", "−92.3", "19.8", "2.60", "−207.4"],
  ["K = 8", "7.3", "14.47", "−107.2", "10.1", "3.12", "−195.5"],
  ["no clock", "4.1", "10.92", "−152.8", "4.7", "5.01", "−186.4"],
];

const codeSortie = `# One decision is a target CELL. Between decisions the pilot is a script, not a learner.
def toward(pos, target):
    "One step along the longer axis toward the target; button 5 (fill or drop) on arrival."
    dr, dc = target[0] - pos[0], target[1] - pos[1]
    if dr == 0 and dc == 0: return 5
    if abs(dr) >= abs(dc): return 3 if dr > 0 else 1
    return 2 if dc > 0 else 4

NAMES = ["hover", "north", "east", "south", "west", "the button"]

def sortie(env, target, K):
    "Fly to the target, filling at the nearest lake first if the bucket is empty. Ends on the drop, or when K runs out."
    lake = np.argwhere(env.T == LAKE); lake = lake[np.abs(lake - env.pos).sum(1).argmin()]
    to_lake, steps = env.water == 0, 0
    while True:
        a = toward(env.pos, lake if to_lake else target)
        _, r, terminated, truncated, info = env.step(a); steps += 1
        note = "   filled the bucket" if a == 5 and to_lake else f"   DROP -> {info['put_out']} cells out" if a == 5 else ""
        print(f"    step {env.t:3d}  {NAMES[a]:10s} ({env.pos[0]:2d},{env.pos[1]:2d}){note}")
        if a == 5 and to_lake: to_lake = False
        elif a == 5: return steps, "it dropped"
        if terminated or truncated: return steps, "the fire ended"
        if steps >= K: return steps, "the clock ran out"

def nearest_fire(env):
    "The commander rule we will use here: name the burning cell closest to the helicopter."
    fire = np.argwhere(env.S == BURNING)
    return fire[np.abs(fire - env.pos).sum(1).argmin()]

env = Wildfire(); env.reset(seed=1002)
print(f"  world 1002: helicopter at ({env.pos[0]}, {env.pos[1]}), bucket full")
for k in (1, 2):
    tgt = nearest_fire(env)
    print(f"  decision {k}: target ({tgt[0]}, {tgt[1]}), bucket {'full' if env.water else 'empty'}")
    steps, why = sortie(env, tgt, 300)
    print(f"  -> the commander gets the map back after {steps} steps, because {why}")`;

const codeSame = `# Is anything lost by handing the flying to a script? Set the clock to 1 -- the commander re-decides every
# step -- and write each hand-written chief as a rule that picks a TARGET rather than a button.
def commander_chief(mode):
    def pick(env):
        fire = np.argwhere(env.S == BURNING)
        if mode == "nearest":
            f = fire[np.abs(fire - env.pos).sum(1).argmin()]
        else:                                                     # guard: the fire closest to the village
            village = np.argwhere(env.T == VILLAGE).mean(0)
            f = fire[np.hypot(*(fire - village).T).argmin()]
        return int(f[0] * N + f[1])
    return pick

village_centre = lambda env: int(np.argwhere(env.T == VILLAGE)[4] @ [N, 1])      # never on fire when it is chosen

print(f"{'':32s}{'village':>9}{'untouched':>11}{'burnt':>8}{'return':>9}{'drops':>7}{'put out':>9}")
rows = [("pilot chief, nearest", fly(pilot_chief("nearest"))),
        ("commander K=1, nearest", command(commander_chief("nearest"), K=1)),
        ("pilot chief, guard", fly(pilot_chief("guard"))),
        ("commander K=1, guard", command(commander_chief("guard"), K=1)),
        ("commander K=1, soak the village", command(village_centre, K=1))]
for name, d in rows:
    print(f"{name:32s}{d['village_damaged']:9.2f}{d['village_saved']:11.1%}{d['burnt']:8.1f}"
          f"{d['ret']:9.1f}{d['drops']:7.2f}{d['put_out']:9.1f}")`;

const codeClock = `# The decision clock K: how many steps the commander must live with a target before it may choose again.
# This is Command.step re-written line for line, so that we can look at the target cell as the water lands.
# K = 300 is no clock at all -- one decision per sortie, since a sortie can never outlast the episode.
def clock(pick, K, n=200):
    landings, still_alight, rets, rows = 0, 0, [], []
    for k in range(n):
        env = Wildfire(); env.reset(seed=1000 + k); total, decisions = 0.0, 0
        while True:
            target = divmod(int(pick(env)), N); decisions += 1
            lake = np.argwhere(env.T == LAKE); lake = lake[np.abs(lake - env.pos).sum(1).argmin()]
            to_lake, steps = env.water == 0, 0
            while True:
                a = toward(env.pos, lake if to_lake else target)
                landing = a == 5 and not to_lake                  # the water is about to fall on the target
                if landing:
                    landings += 1; still_alight += int(env.S[target] == BURNING)
                _, r, terminated, truncated, _ = env.step(a); total += r; steps += 1
                if a == 5 and to_lake: to_lake = False
                if landing or terminated or truncated or steps >= K: break
            if terminated or truncated: break
        s = env.summary(); s["decisions"] = decisions; rows.append(s); rets.append(total)
    m = lambda key: np.mean([r[key] for r in rows])
    print(f"  K = {'none' if K > 100 else K:>4}{m('decisions'):14.1f}{m('drops'):11.2f}{m('put_out'):13.2f}"
          f"{m('put_out') / m('drops'):15.2f}{still_alight / landings:16.1%}{np.mean(rets):10.1f}")

print(f"  {'':8s}{'decisions/ep':>14}{'drops/ep':>11}{'put out/ep':>13}{'put out/drop':>15}{'target alight':>16}{'return':>10}")
for K in (1, 4, 8, 300):
    clock(dispatcher("guard"), K)`;

const codeChain = `# The chain the flat pilot almost never completed: fill at the lake, fly to a fire, land water on it.
def chain(name, K, n=200):
    pick = dispatcher("random")                       # a commander that names one of the 256 cells at random
    refills = first = after = put_out = drops = decisions = 0
    for k in range(n):
        world = Command(K=K); world.reset(seed=1000 + k); env = world.env
        filled = f = a2 = 0
        while True:
            _, _, terminated, truncated, info = world.step(pick(env)); decisions += 1
            filled = filled or env.stats["fills"] > 0
            if info["put_out"] > 0:
                if filled: a2 += 1
                else: f += 1
            if terminated or truncated: break
        s = env.summary()
        refills += filled > 0; first += f > 0; after += a2 > 0
        put_out += s["put_out"]; drops += s["drops"]
    print(f"  {name:46s}{refills:8d}{first:8d}{after:8d}{put_out / n:9.2f}{drops / n:8.2f}{decisions / n:9.1f}")

rng = np.random.default_rng(0)                        # the last page's pilot, pressing one of six buttons at random
refills = first = after = put_out = drops = steps = 0
for k in range(200):
    env = Wildfire(); env.reset(seed=1000 + k); filled = f = a2 = 0
    while True:
        _, _, terminated, truncated, info = env.step(int(rng.integers(6)))
        filled = filled or env.stats["fills"] > 0
        if info["put_out"] > 0:
            if filled: a2 += 1
            else: f += 1
        if terminated or truncated: break
    s = env.summary(); refills += filled > 0; first += f > 0; after += a2 > 0
    put_out += s["put_out"]; drops += s["drops"]; steps += s["t"]

print(f"  {'out of 200 fires':46s}{'refills':>8}{'scores':>8}{'chains':>8}{'put out':>9}{'drops':>8}{'choices':>9}")
print(f"  {'a pilot pressing buttons at random':46s}{refills:8d}{first:8d}{after:8d}{put_out / 200:9.2f}{drops / 200:8.2f}{steps / 200:9.1f}")
for K in (1, 4, 300):
    chain(f"a commander naming cells at random, K = {'none' if K > 100 else K}", K)`;

const th: React.CSSProperties = { textAlign: "left", padding: "7px 12px 7px 0", fontWeight: 500, color: "var(--muted)", fontSize: 12.5 };
const thr: React.CSSProperties = { ...th, textAlign: "right", paddingRight: 14 };
const td: React.CSSProperties = { padding: "7px 12px 7px 0", color: "var(--ink)" };
const tdr: React.CSSProperties = { ...td, textAlign: "right", paddingRight: 14, fontFamily: "ui-monospace, monospace", fontSize: 12.5 };
