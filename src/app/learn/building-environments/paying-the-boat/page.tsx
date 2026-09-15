import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { RaceReplay } from "@/components/sail/RaceReplay";
import { StallUpdateLab } from "@/components/sail/StallUpdateLab";
import { SeedStrip } from "@/components/sail/SeedStrip";
import { PAYING_RACES } from "@/components/sail/data/payingRaces";

export const metadata = {
  title: "Paying the boat: −1 per second, investigated — Manifold",
  description:
    "The reward most people write first — −1 every second until the mark — finishes 4.4 races in 200 after training, against 175.8 for paying distance gained. But its practice log shows hundreds of finishes. Three clues and one budget test later: its success lived in its learning rule, not its table, and it is a slow reward rather than a broken one.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PayingTheBoat() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 18 minutes"
        title={<>Paying the boat: −1 per second, investigated</>}
        intro={<>The boat accepts three rewards, and the spec deliberately left the choice to measurement. This page
          tests the one most people write first, finds a result that looks like a dead end, and then does what you
          should do with every surprising number: investigate it until you know what it means. The answer turned out
          to be more interesting than the question — and it overturned something this track had already claimed.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Two ways to pay for the same goal</h2>
        <p>
          The task is &ldquo;reach the mark as quickly as you can&rdquo;. There are two natural ways to turn that into a
          number each second:
        </p>
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            <strong>−1 every second, until the boat rounds the mark.</strong> The total is minus the race time, so
            maximising reward is exactly minimising time. It says what we want and nothing else, which is why almost
            everyone writes it first.
          </li>
          <li>
            <strong>The distance gained toward the mark this second.</strong> Close 1.5 metres, earn 1.5; drift 0.6
            metres away, earn −0.6. It says a little more than we want: it tells the boat, every single second,
            whether that second helped.
          </li>
        </ul>
        <p>
          Trained the same way — 2000 practice races, same learner, same step size — and tested on the usual 200
          held-out races, five training runs each:
        </p>

        <SeedStrip rows={[
          { label: "−1 per second", values: [4, 18, 0, 0, 0] },
          { label: "distance gained", values: [156, 165, 190, 177, 191], strong: true },
        ]} note="2000 practice races each, seeds 0–4, tested frozen." />

        <p>
          The tempting conclusion is &ldquo;−1 per second doesn&rsquo;t work&rdquo;, and an earlier draft of this track
          said almost exactly that. It was wrong, and the way we found out is worth following step by step.
        </p>

        <h2>Clue 1: the practice log disagrees with the test</h2>
        <p>
          Training keeps a log of every practice race. For the −1 boat it shows it reaching the mark{" "}
          <strong>360 to 408 times</strong> in its 2000 practice races, depending on the run — and reaching it for the
          first time <em>earlier</em> than the distance-paid boat did (race 23–83, against race 120–610). In its last
          200 practice races it finished 71 to 83 of them. A boat that finishes about 40% of its final practice races
          and 2% of its tests is not failing to find the mark. Something changes between practice and the test.
        </p>
        <p>
          Two things change. Practice still has a little random exploration; the test has none. And during practice
          the table is <em>updating</em>; during the test it is frozen.
        </p>

        <h2>Clue 2: frozen boats get stuck in one cell</h2>
        <p>
          Watching the frozen −1 boats race gave the second clue. Most tests end with the clock running out and the
          boat <strong>stalled</strong> — 76 to 155 of the 200 races, depending on the run, end with the boat nearly
          stopped. And in 62 to 140 of them the boat spends the final 50 seconds <strong>in a single table cell</strong>,
          choosing the same action again and again. That is a loop: a greedy agent in a cell where its preferred action
          leaves it in the same cell will choose that action forever, because nothing about its situation changes.
          The <Link href="/learn/function-approximation/mountain-car" style={link}>frozen Mountain Car</Link> in the
          last track parked at the bottom of its valley the same way.
        </p>
        <p>
          The obvious test: break the loops with a little randomness. Rerunning the same frozen tables with 5% random
          actions cut the one-cell loops to 13–20 per run — but raised the finishes only from 4.4 to 13.6. The loops are
          real, but they are a symptom. Breaking them does not give you a boat that knows where to go.
        </p>

        <h2>Clue 3: let the table keep learning during the race</h2>
        <p>
          That leaves the other difference. Here is the decisive experiment, on one training run: test the same trained
          table twice on the same 200 races, fully greedy both times, but the second time let it keep applying its
          learning update <em>inside</em> each race (starting every race from the trained table, so nothing carries
          over from one race to the next).
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>This boat finished 83 of its last 200 practice races. Tested frozen on 200 new races, how many does it
            finish — and what happens if its table keeps learning during each race?</>}
          options={["About 80 both ways", "A handful frozen; about the same with learning on", "A handful frozen; far more with learning on", "Far more frozen, since it no longer explores"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeInvestigate} />
        <CodeOutput>{`practice, last 200 races:      rounded the mark  83
test, table frozen:            rounded the mark   4   stuck in one cell for the final 50 s: 140
test, table still learning:    rounded the mark 117   stuck in one cell for the final 50 s:   0`}</CodeOutput>

        <p>
          <strong>Frozen: 4 finishes and 140 stuck boats. Still learning: 117 finishes and none stuck.</strong> Same
          table, same races, no randomness in either test. Across all five training runs, learning-on testing gave 117,
          101, 61, 129 and 65 finishes — 94.6 on average, against 4.4 frozen. The distance-paid boat, given the same
          treatment, barely changes: 175.8 frozen, 184.0 still learning.
        </p>

        <RaceReplay id="paying" races={PAYING_RACES} reward="time" showCells
          title="Held-out race 0, both ways: the same table, frozen and still learning" />
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.6rem" }}>
          Race 0 is simply the first test race, and it happens to show both behaviours. Scrub to the end and read the
          &ldquo;table cell&rdquo; column: the frozen boat is parked in one cell (the ×N counts the seconds it has not changed),
          while the learning boat keeps turning out of trouble and rounds the mark at 187 s.
        </p>
        <p>
          So the −1 boat&rsquo;s practice success was never stored in its table. It lived in its <em>update rule</em>.
          Every second the boat sits stalled, it pays −1, and the update pushes down the value of the action it keeps
          choosing — until some other action looks better and the boat turns. Learning was doing the escaping, in real
          time, every race. Freeze the table and that mechanism is gone, and what is left does not know how to sail.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>one stalled second</strong> a few times under −1 per second. Then switch to distance gained and
            do the same, and finally try the frozen table.</>}
          insight={<>Under −1 per second the stuck action loses about half a point a second and the boat turns within a few
            seconds. Under distance gained the same stall takes over half a minute to break. With the table frozen it never
            breaks. That is the whole investigation in one cell: the escape was the update, not the table.</>}
        >
          <StallUpdateLab />
        </LabFrame>

        <Proof title="Why a stalled second always pushes the stuck action down">
          <p>
            <strong>Step 1 — the update while stuck.</strong> Say the boat is in cell <M>s</M>, its best action is{" "}
            <M>{String.raw`a^*`}</M>, and taking it leaves it in <M>s</M>. With −1 per second the target is{" "}
            <M>{String.raw`-1 + \gamma \max_a Q(s,a) = -1 + \gamma Q(s,a^*)`}</M>, so
          </p>
          <MathBlock>{String.raw`Q(s,a^*) \;\leftarrow\; Q(s,a^*) + \alpha\big(-1 + \gamma Q(s,a^*) - Q(s,a^*)\big) \;=\; Q(s,a^*) - \alpha\big(1 + (1-\gamma)\,Q(s,a^*)\big)`}</MathBlock>
          <p>
            <strong>Step 2 — the sign.</strong> The bracket <M>{String.raw`1 + (1-\gamma)Q`}</M> is positive whenever{" "}
            <M>{String.raw`Q(s,a^*) > -1/(1-\gamma) = -100`}</M>, the value of paying −1 forever. That holds for any cell
            whose experience is only the −1 per second (the penalised edge can push a few cells lower, as the{" "}
            <Link href="/learn/building-environments/where-the-course-ends" style={link}>edge page</Link> computed, but a
            boat sitting still in irons is not crossing the edge). So every stalled second lowers{" "}
            <M>{String.raw`Q(s,a^*)`}</M>, by about <M>{String.raw`\alpha = 0.5`}</M> when the value is near zero. Within a
            few seconds another action becomes the best, and the boat does something different. That is the escape.
          </p>
          <p>
            <strong>Step 3 — the same situation with distance gained.</strong> A stalled boat gains almost no distance,
            so the reward is almost 0 and the update is close to{" "}
            <M>{String.raw`Q(s,a^*) \leftarrow Q(s,a^*) - \alpha(1-\gamma)\,Q(s,a^*)`}</M>: the value shrinks by 0.5% a
            second. That is far too slow to force an escape inside a race — and the distance-paid boat does not need
            one, because its table already prefers actions that make progress, which is why freezing it costs so little.
          </p>
          <p>
            <strong>Step 4 — why the −1 table stays uninformative.</strong> Under −1 per second, a second spent sailing
            well and a second spent drifting pay exactly the same. The only thing that separates good actions from bad
            ones is the eventual end of the race, carried backwards one bootstrap at a time. Under distance gained, the
            difference shows up in the very next reward. That is the textbook contrast between a <em>sparse</em> and a{" "}
            <em>dense</em> signal, and it predicts the next measurement.
          </p>
        </Proof>

        <h2>Slow, or broken? The budget test</h2>
        <p>
          If the −1 table is merely slow to become informative, more practice should fix it. If it is fundamentally
          confused, more exploration might be what is missing instead. Those are different claims, so we tested them
          separately, three training runs each:
        </p>

        <SeedStrip rows={[
          { label: "2000 races, normal exploration (shipped settings)", values: [4, 18, 0, 0, 0] },
          { label: "2000 races, three times the exploration", values: [19, 3, 0] },
          { label: "6000 races, normal exploration", values: [171, 77, 167], strong: true },
        ]} note="All paid −1 per second and tested frozen." />

        <p>
          <strong>Practice fixes it; exploration does not.</strong> Tripling the exploration at the same budget changed
          almost nothing. Tripling the practice took the frozen boat from 4.4 finishes to 138.3. The −1 reward is not
          broken — given enough experience its table does learn to sail — it is <em>slow</em>, and still less reliable
          at three times the cost than distance gained is at the shipped budget (138.3 ± 43.4 against 175.8 ± 13.7).
        </p>

        <Callout color={GOLD} title={<>Decision record: the boat is paid for distance gained</>}>
          The evidence, in one place. At the practice budget chosen so every result can be reproduced in your browser,
          distance gained is the only reward whose trained table works when frozen: 175.8 finishes against 4.4. The −1
          reward catches up only with three times the practice, and even then finishes fewer races with three times the
          spread. So distance gained ships.
          <br /><br />
          Two costs come with it, and both deserve writing down. First, it is not quite the reward we wanted: summed
          over a race, distance gained is about the same whether the boat takes 50 seconds or 150, so only discounting
          pushes it to hurry — one plausible reason trained boats take 59–83 seconds while the expert takes 48.3, though
          we have not tested that. Second, it is a <em>shaped</em> reward: it has the form{" "}
          <M>{String.raw`\Phi(s') - \Phi(s)`}</M> with <M>{String.raw`\Phi = -\text{distance}`}</M>. Shaping of the form{" "}
          <M>{String.raw`\gamma\Phi(s') - \Phi(s)`}</M> provably leaves the best policy unchanged, as the{" "}
          <Link href="/learn/warehouse-robot-capstone/designing-the-reward" style={link}>warehouse capstone</Link>{" "}
          explains; ours drops the <M>\gamma</M>, so with <M>\gamma = 0.99</M> that guarantee holds only approximately.
        </Callout>

        <h2>What this investigation was really about</h2>
        <p>
          Three habits carried this page, and they transfer to every environment you will build. <strong>When practice
          and test disagree, list what differs between them</strong> — here, exploration and learning — and change them
          one at a time. <strong>Separate &ldquo;slow&rdquo; from &ldquo;broken&rdquo;</strong> with a budget test before
          throwing a design away. And <strong>when a measurement contradicts something you have already written, the
          writing changes</strong>: the earlier pages of this track said the −1 reward &ldquo;never learned&rdquo;, and
          they have been corrected to say what was actually measured.
        </p>
        <p>
          The boat now has its world and its reward. One decision is left before training the version that ships:
          what the agent should look at. The next page settles that, and the one after trains the boat and looks at
          what it actually does on the water — including whether it ever worked out tacking.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/sanity-agents", label: <>← Sanity agents, and a sailor who can&rsquo;t lose</> }}
          next={{ href: "/learn/building-environments/what-the-boat-sees", label: <>Next · Designing what the boat sees →</> }}
        />
      </div>
    </article>
  );
}

const codeInvestigate = `# The reward most people write first: -1 every second until the boat rounds the mark.
Q, log = train_sailor(reward="time", seed=0)
practice = sum(arrived for arrived, out, steps in log[-200:])
print(f"{'practice, last 200 races:':30s} rounded the mark {practice:3d}")

def test(Q, keep_learning):
    "200 held-out races, always greedy. Optionally let the table keep updating DURING each race."
    finished = stuck = 0
    for k in range(200):
        q = Q.copy()                                  # every race starts from the trained table
        env = Sail("time"); o, _ = env.reset(seed=10**6 + k); s = observe(o, env)
        cells = []
        while True:
            a = int(np.argmax(q[s]))                  # no random actions at all
            o, r, terminated, truncated, info = env.step(a); s2 = observe(o, env)
            if keep_learning:
                q[s, a] += 0.5 * (r + (0.0 if terminated else 0.99 * q[s2].max()) - q[s, a])
            cells.append(s); s = s2
            if terminated or truncated: break
        finished += info["arrived"]
        stuck += truncated and len(set(cells[-50:])) == 1
    return finished, stuck

for keep in (False, True):
    f, st = test(Q, keep)
    label = "test, table still learning:" if keep else "test, table frozen:"
    print(f"{label:30s} rounded the mark {f:3d}   stuck in one cell for the final 50 s: {st:3d}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
const tdMono: React.CSSProperties = { ...td, fontFamily: "ui-monospace, monospace" };
