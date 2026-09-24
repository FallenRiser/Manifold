import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { CobraLab } from "@/components/fire/CobraLab";

export const metadata = {
  title: "The cobra effect: pay per fire put out — Manifold",
  description:
    "The shipped reward pays nothing for extinguishing a fire, which sounds like an oversight. This page writes the reward that does pay for it and measures what that buys: a rule book whose top answer flips to a strictly dominated rule, a bounty of three points a cell that is enough to do it, a crew that douses twice as much fire and loses twice as much village — and two tidy explanations for that, both of which turn out to be wrong.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const TRAINED: string[][] = [
  ["guard — hand-written", "13.7", "1.11", "78.5%", "81.7", "45.2", "—"],
  ["nearest — hand-written", "16.7", "2.69", "65.5%", "85.6", "47.2", "—"],
  ["densest — hand-written", "22.0", "3.33", "56.5%", "96.3", "48.5", "—"],
  ["a burning cell at random", "13.3", "4.40", "44.0%", "121.7", "56.5", "—"],
  ["DQN paid for damage", "10.6 / 13.6 / 14.0", "2.51 / 2.71 / 2.45", "60–62%", "94–95", "54–56", "0.13–0.17"],
  ["DQN paid per cell put out", "24.4 / 25.6 / 25.3", "4.78 / 4.47 / 4.66", "38–42%", "119–124", "63–65", "0.50–0.55"],
];

const PROBE: string[][] = [
  ["first drop, at step", "10.6 / 11.7 / 12.7", "13.9 / 15.6 / 16.4", "12.3"],
  ["cells burning when it lands", "13.6 / 12.5 / 13.9", "16.9 / 18.0 / 18.6", "14.9"],
  ["cells hit per drop", "3.91 / 4.14 / 5.22", "6.78 / 7.56 / 8.29", "8.63"],
  ["drops that hit nothing", "25 / 29 / 14%", "9 / 5 / 3%", "0%"],
  ["distance from the village", "6.4 / 6.6 / 6.5", "7.6 / 7.5 / 7.3", "9.3"],
];

export default function TheCobraEffect() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 20 minutes"
        title={<>The cobra effect: pay per fire put out</>}
        intro={<>The{" "}
          <Link href="/learn/building-environments/reward-is-a-values-decision" style={link}>previous page</Link> found
          something odd about the reward we shipped: it pays <em>nothing</em> for putting out a fire. The guard chief
          douses 13.42 cells an episode and earns exactly zero for them, and across the two hundred held-out worlds the
          number of cells it puts out is <strong>anti</strong>-correlated with its score. That reads like an oversight.
          The obvious repair is one line — pay the crew a point for every cell it extinguishes — and this page writes it,
          measures what it buys, and then tries very hard to find the tidy story that explains the damage. Both of the
          tidy stories turn out to be wrong, which is the most useful thing on the page.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The reward that is obviously right</h2>
        <p>
          The environment has had the alternative in it since the day it was written. <code>Wildfire</code> takes a{" "}
          <code>reward</code> argument, and one of the three settings is the one a fire service would recognise:
        </p>
        <pre style={pre}><code>{`elif self.reward == "extinguish":
    reward = put_out                    # +1 for every burning cell this drop turned back to unburnt`}</code></pre>
        <p>
          It is hard to argue with. Putting out fire is what a firefighting crew does. It is the number a crew would
          report at the end of a shift, the number that would go on a dashboard, the number a commander would be proud
          of. And it has one property the shipped reward conspicuously lacks: <strong>you can see where it came
          from.</strong> Fly the guard chief through all two hundred worlds and look at every single step:
        </p>
        <ul>
          <li>Of its 9,375 steps, <strong>6.0%</strong> are a drop.</li>
          <li>The bounty is non-zero on exactly those 6.0% of steps, and on no others. Every point it ever pays was
            caused by the action taken on the step it was paid: <M>{String.raw`\mathrm{corr}`}</M> between the step&rsquo;s
            reward and &ldquo;the crew did something&rdquo; is <strong>+0.87</strong>.</li>
          <li>The shipped damage reward is non-zero on <strong>41.4%</strong> of steps — and only <strong>6.4%</strong>{" "}
            of those are steps where the crew did anything at all. Its correlation with &ldquo;the crew acted&rdquo; is{" "}
            <strong>+0.02</strong>. The mean charge on a step where the crew dropped a bucket is 1.72; on a step where
            it did nothing, 2.00.</li>
        </ul>
        <p>
          That is the honest case for the bounty, and it is a real one. More than nine times in ten the shipped reward
          charges the crew for fire it did not touch on that step, while it was flying between a lake and a fire. The
          bounty never does that. It is the only one of the two whose per-step reward is
          <em> legible as a consequence of the action</em>. Every instinct trained by the{" "}
          <Link href="/learn/building-environments/the-crew-that-learned-nothing" style={link}>crew that learned
          nothing</Link> says this is the reward to reach for.
        </p>
        <p>
          The story the page is named after is the one every economist tells about metrics like this. A colonial
          administration in Delhi is said to have put a bounty on cobras; people bred cobras to claim it; the bounty was
          cancelled; the now-worthless snakes were released, and there were more cobras than before. The provenance of
          the anecdote is thin, but the shape of it is not, and the shape is what matters here: the bounty was not badly
          set. It was <em>well</em> set on the wrong quantity. So let us find out what quantity we just bought.
        </p>

        <h2>A third shape for the reward</h2>
        <p>
          The previous page priced the rule book two ways and both were about harm — charge a cell once when it catches,
          or charge it rent for every tick it burns. Both reorder nothing important, because both are opinions about the
          same underlying quantity. The bounty is the first reward on this track that pays for a <em>deed</em> rather
          than charging for a <em>consequence</em>, and it is not on that dial at all.
        </p>
        <p>
          The method is the same one, though: <strong>fly once, price many times</strong>. Each rule is flown through
          the two hundred held-out worlds exactly once, and we record three raw counts — cells that caught, village
          cells among them, and cells put out. Every reward on this page is then arithmetic on those three numbers, so
          the flying is held still while the opinion changes. One rule is new. <code>densest</code> aims at whichever
          five-by-five square covers the most burning cells — it is the greediest rule you can write for the bounty
          without training anything, and the shipped <code>dispatcher</code> already has it.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Seven hand-written rules, scored on the 200 held-out worlds. Paid for damage, the guard chief wins
            the book. Paid one point for every cell it extinguishes, where does the guard chief finish?</>}
          options={["First again — putting out fire is how it protects the village", "Second or third — a greedier rule beats it", "Last — it barely drops any water at all", "Tied with standing by, at zero"]}
          nudge={<>Only one rule in the book is trying to maximise cells put out, and it is the one that was added for
            this page.</>}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeBook} />
        <CodeOutput>{outBook}</CodeOutput>

        <p>
          The two rewards disagree at the top, and they disagree about almost everything else too. Paid for damage, the
          book&rsquo;s answer is <strong>guard</strong> and the new rule finishes fourth of seven. Paid per cell put out,
          the answer is <strong>densest</strong> — it lets nearly three times as many village cells catch, burns seven
          more cells, and wins the bounty column by almost five cells over the runner-up. The guard chief drops to
          third.
        </p>
        <p>
          Look at the bottom of the bounty column as well, because it is worse than the top. <strong>Standing by and
          dropping one bucket at the start score identically: 0.00 each.</strong> Those two rules differ by 17.2 cells
          burnt and 3.98 village cells — that is <em>every single thing</em> that separates the worst rule in the book
          from the second worst, and the bounty cannot see any of it. A reward that pays only for what the crew touches
          is exactly blind to the part of the job that consists of not letting things catch.
        </p>

        <h2>Nothing on the dial reaches it</h2>
        <p>
          Before we blame the bounty, it is worth asking whether the previous page&rsquo;s exchange rate could have got
          to the same answer. That dial ran from a village cell worth one ordinary cell to a village cell worth two
          hundred, and it produced three different answers along the way. Could a village cell be worth some number that
          makes <code>densest</code> the right rule?
        </p>
        <p>
          It cannot, and the reason is arithmetic rather than taste. Compared with the guard chief, <code>densest</code>{" "}
          lets more ordinary cells catch <em>and</em> more village cells catch — 89.67 against 82.56, and 2.95 against
          1.06. It is worse on both columns. No weighting of two numbers, at any rate from zero to infinity, can rank a
          rule above one that beats it on both. The same is true against <code>nearest</code>.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Keep the shipped reward exactly as it is and simply add a bounty on top: minus one per cell that
            catches, minus ten more for a village cell, plus <M>b</M> for every cell put out. How large does{" "}
            <M>b</M> have to be before the rule book changes its answer?</>}
          options={["Around 3 — three points for undoing one point of damage", "Around 11 — the price of a village cell", "Around 30 — the bounty has to dominate the whole reward", "It never changes: the damage terms are much larger"]}
          nudge={<>The guard chief and the densest rule differ by 26.01 points of damage and by 8.67 cells put out.</>}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeReach} />
        <CodeOutput>{outReach}</CodeOutput>

        <p>
          <strong>Three points a cell.</strong> That is all it takes. And notice what three points is, in the units the
          reward already uses: a cell that catches costs one. So a bounty worth three times the damage it undoes —
          which is not an obviously greedy number, given that a doused cell also stops spreading to its neighbours — is
          enough to make the environment&rsquo;s best available answer a rule that no damage reward would ever choose.
          At the crossover the book gives up 26.01 points of damage, including nearly two extra village cells, in order
          to buy 8.67 more cells put out.
        </p>

        <Callout title="A bounty is not a small correction to a reward" color={GOLD}>
          <p style={{ margin: 0 }}>
            Turning the exchange rate up moves weight <em>between</em> two things the reward already charges for; the
            worst it can do is pick a different point on the same frontier. A bounty adds a term that is{" "}
            <strong>positively correlated with the quantity the rest of the reward is trying to minimise</strong>, so it
            does not nudge the answer along the frontier — it pulls it off the frontier entirely. There is no setting
            of the exchange rate that produces the bounty&rsquo;s answer, and there is no bounty small enough to be
            obviously safe without checking, because the size that is safe depends on the rules you happen to compare.
          </p>
        </Callout>

        <h2>The story everyone expects</h2>
        <p>
          Now the interesting part. Everybody who hears &ldquo;paid per cell extinguished&rdquo; predicts the same
          mechanism, because it is the cobra mechanism: the crew will <strong>farm</strong>. It will let the fire grow
          so that there is more of it to put out — breed cobras, then collect the bounty. It is a satisfying story and
          it is the first thing to test, so here is the cleanest test available. Take the guard chief, which cannot
          learn anything and has no incentives at all, and simply make it wait: hover for the first <M>k</M> steps, then
          guard as usual. If letting the fire grow pays, this should be paid better as <M>k</M> rises.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The guard chief puts out 13.42 cells an episode when it starts work at once. Make it hover for the
            first twenty steps while the fire spreads unopposed, then fly exactly as before. What happens to the number
            of cells it ends up putting out?</>}
          options={["It rises — there is more fire to put out", "It falls — the fire burns out on its own clock", "It barely moves — the drops just happen later", "It rises at first, then falls"]}
          nudge={<>A fire nobody fights is over after about 77 steps.</>}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeWait} />
        <CodeOutput>{outWait}</CodeOutput>

        <p>
          Waiting does not pay. Every column gets worse together: the damage more than doubles, and the bounty{" "}
          <em>also</em> falls, from 13.42 cells to 3.06. The reason is a clock the crew does not control. A fire left
          entirely alone burns itself out after about 77 steps, so time spent hovering is not time the fire is being
          banked for later — it is time being spent. Wait sixty steps and there are only a handful left in which to earn
          anything, and the number of drops collapses from 2.81 to 0.79. In this world, arson is not a viable business
          model, because the fire goes out whether you are there or not.
        </p>
        <p style={{ fontSize: 14.5, color: "var(--muted)" }}>
          This tests one specific way of waiting, on one rule, and it does not prove that no policy could ever farm
          here. It shows that the simplest and most-predicted version of farming loses money. The trained crews get
          checked directly for the same thing further down, and they fail it too.
        </p>

        <h2>What the bounty is actually correlated with</h2>
        <p>
          If the crew is not making more fire, where does the bounty come from? Two places, and the first one requires
          no crew at all.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeWater} />
        <CodeOutput>{outWater}</CodeOutput>

        <p>
          Start with the bottom half, because it is the part that should have been a warning before anybody wrote a
          bounty. <strong>Hold the crew completely fixed</strong> — the same guard chief, the same rule, every world —
          and the number of cells it puts out still varies enormously from world to world, because some worlds simply
          burn more. Across the two hundred worlds, the correlation between cells put out and cells burnt is{" "}
          <strong>+0.73</strong>, and between cells put out and the score, <strong>−0.70</strong>. The twenty worlds
          where the guard chief doused the most fire — 27.85 cells, its best-paid work — are worlds where it returned{" "}
          <strong>−178.6</strong>. The twenty where it doused the least, 2.80 cells, returned <strong>−14.7</strong>.
        </p>
        <p>
          So before any optimiser touches it, the bounty is already a measurement of <em>how bad the fire was</em>, not
          of how well the crew did. An agent that maximises it will happily take the worlds where it goes badly.
        </p>
        <p>
          The top half is the second source, and it is the one the crew can actually choose. Compare where the greedy
          rule puts its water against where the guard chief puts its. It drops <strong>later</strong> — first drop at
          step 12.3 against 10.2 — onto <strong>more fire</strong> — 14.9 cells burning against 13.5 — and hits{" "}
          <strong>8.63 cells a bucket</strong> against 4.77, nearly twice as much per drop with fewer drops. And it does
          all of it <strong>9.3 cells from the village</strong>, where the guard chief works at 7.9.
        </p>
        <p>
          That last number is the whole thing in one line. The fire always starts at least six cells from the village.
          Dense fire is therefore, almost by construction, fire that is not yet the village&rsquo;s problem. A reward
          that pays per cell extinguished is a reward that points the helicopter <strong>away from the thing we said we
          were protecting</strong> — not out of malice or cleverness, but because that is where the cells are.
        </p>

        <Callout title="The proxy is visible at the moment of the action. The objective is not." color={GOLD}>
          <p style={{ margin: 0 }}>
            The bounty for a drop is countable the instant the water lands: it is the number of burning cells inside a
            five-by-five square. The thing we actually want from that drop — the cells that now never catch, and the
            village that is now never threatened — is a counterfactual about a fire that will not happen, and it is
            never observable at all. Every reward that is easy to see is a reward for something local, and almost
            nothing worth having in this world is local.
          </p>
        </Callout>

        <LabFrame
          accent={GOLD}
          tryThis={<>Wait for the maps to settle, then look at where the two rings sit. Click the cell the bounty likes
            best and read what follows it; click the cell the damage reward likes best and read what it pays. Then move
            the moment to step 16, where the least-damaging order is a village cell that is not on fire at all.</>}
          insight={<>The two maps are built from the same 256 continuations, flown on the same twelve sets of dice — the
            only thing that differs between any two cells is the order that was given. They do not peak in the same
            place. At step 24 the best-paying order is down in the burning ground about eleven cells from the village
            and is followed by roughly twice the damage of the quietest order, which covers no burning cell whatever.
            Every drop this lab prices is a real drop; what changes is only which number you choose to read.</>}
        >
          <CobraLab />
        </LabFrame>

        <p>
          At step 24 the two maps do not have their peaks in the same place, and the gap is not subtle. The order that
          puts out the most fire is down in the burning ground eleven cells from the village; it douses about 18.7 cells
          and is followed by around 151 points of damage. The order that does the least damage is three cells from the
          village, covers <em>no burning cell at all</em>, and puts out about 3.9. A bounty would pay the first order
          nearly five times as much as the second. Step 16 makes the same point more bluntly: the least damaging order
          there is a village cell itself — pre-wetting a house that has not caught yet, worth nothing whatever to a
          reward that counts extinguished cells.
        </p>
        <p>
          That is the argument the{" "}
          <Link href="/learn/building-environments/pilot-or-commander" style={link}>commander page</Link> made when it
          refused to shrink the action space to burning cells only, arriving from the other direction. The best order is
          often a cell that is not on fire. A reward that only pays for fire cannot ask for one.
        </p>

        <h2>A crew that was actually trained on it</h2>
        <p>
          All of the above is hand-written rules, which is the point: none of them is trying to game anything. The real
          question is what an optimiser does with the same reward, and the answer comes from the training runs made
          while this world was being built — DQN on the{" "}
          <Link href="/learn/building-environments/pilot-or-commander" style={link}>commander interface</Link> at K = 4,
          one million simulator steps, three seeds per reward, scored on the same two hundred held-out worlds.
        </p>
        <p style={{ fontSize: 14.5, color: "var(--muted)" }}>
          The hand-written rows in this table come from the shipped code and you can reproduce them with{" "}
          <code>command(dispatcher(&quot;densest&quot;), K=4)</code>. The two trained rows do not: the crews are torch
          models that run on a machine, not in your browser, and the page in this chapter that ships the training script
          has not been written yet. They are quoted from the build log, exactly as the{" "}
          <Link href="/learn/building-environments/the-crew-that-learned-nothing" style={link}>first training
          page</Link> quoted its failures, and every claim that depends on them says so.
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 660 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Commander, K = 4</th><th style={thr}>Put out</th><th style={thr}>Village lost /9</th>
                <th style={thr}>All nine saved</th><th style={thr}>Burnt</th><th style={thr}>Steps</th>
                <th style={thr}>Re-doused</th>
              </tr>
            </thead>
            <tbody>
              {TRAINED.map((r, i) => (
                <tr key={r[0]} style={{ borderBottom: i < TRAINED.length - 1 ? "1px solid var(--border)" : undefined,
                  ...(r[0].startsWith("DQN") ? { background: "color-mix(in srgb, var(--c-rl) 7%, transparent)" } : {}) }}>
                  <td style={td}>{r[0]}</td>
                  {r.slice(1).map((x, j) => <td key={j} style={tdr}>{x}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The bounty works, in the sense that matters least. The crew paid per cell put out doubles the other
          crew&rsquo;s output — <strong>24.4 / 25.6 / 25.3</strong> cells an episode against 10.6 / 13.6 / 14.0 — and
          beats the greediest hand-written rule we could write. It is genuinely better at the thing it was paid for, on
          every seed, with no overlap.
        </p>
        <p>
          And it loses <strong>4.78 / 4.47 / 4.66</strong> village cells against the other crew&rsquo;s 2.51 / 2.71 /
          2.45 — again with no seed overlapping. It saves all nine houses in 38–42% of worlds where the other crew
          manages 60–62%. It burns 119–124 cells against 94–95. Put the sharpest version of it plainly:{" "}
          <strong>a crew trained to maximise cells extinguished protects the village slightly worse than a dispatcher
          that picks a burning cell at random</strong> — 4.64 village cells on average against 4.40 — while putting out
          nearly twice as much fire as that dispatcher does.
        </p>
        <p>
          And the signature of how it does it is the greedy rule&rsquo;s signature, column for column:
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Per drop</th><th style={thr}>Paid for damage (3 seeds)</th>
                <th style={thr}>Paid per cell out (3 seeds)</th><th style={thr}>densest, hand-written</th>
              </tr>
            </thead>
            <tbody>
              {PROBE.map((r, i) => (
                <tr key={r[0]} style={{ borderBottom: i < PROBE.length - 1 ? "1px solid var(--border)" : undefined }}>
                  <td style={td}>{r[0]}</td>
                  {r.slice(1).map((x, j) => <td key={j} style={tdr}>{x}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.9rem" }}>
          Seeds in order. The last column is the hand-written greedy rule from the cell above, flown as a pilot, so read
          it against that cell&rsquo;s guard chief rather than against the trained rows: 10.2 · 13.5 · 4.77 · 0% · 7.9.
        </p>

        <p>
          Not a single column overlaps between the two trained crews, and every one of them moves in the direction the
          one-line greedy rule already moved. The crew did not invent anything. It found the rule <code>densest</code>{" "}
          and then found a bit more of it.
        </p>

        <h2>Two tidy explanations, both wrong</h2>
        <p>
          The remaining question is <em>why</em> the harm is as large as it is, and this is where the page has to be
          careful, because there were two obvious answers and the measurements killed both.
        </p>
        <p>
          <strong>Farming the same cell.</strong> A cell put out is doused, not spent — it dries out and can catch
          again, which the{" "}
          <Link href="/learn/building-environments/invariants-and-property-tests" style={link}>invariants page</Link>{" "}
          discovered the hard way. So the crew could re-douse one cell forever. It does it more than the other crew does:
          0.50–0.55 re-doused cells an episode against 0.13–0.17. But half a cell an episode out of twenty-five is not a
          business model. It is not the mechanism.
        </p>
        <p>
          <strong>Prolonging the fire.</strong> The episode ends when the last cell stops burning, and ending the
          episode ends the pay — so a paid-per-cell crew ought to leave a few embers alive. The endgame probe looks at
          every decision taken while between one and six cells are burning and asks whether the named target covers any
          of them. The paid-per-cell crew covers some remaining fire <strong>57–70%</strong> of the time; the crew paid
          for damage manages <strong>40–53%</strong>. It aims at the last flames <em>more</em> often, not less. Whatever
          it is doing, it is not stalling to keep its paycheque alive.
        </p>
        <p>
          What is left is upstream. The village-threat probe counts decisions taken while fire burns within three and a
          half cells of the village centre. When the village <em>is</em> threatened, the paid-per-cell crew answers
          about as often as the other one — 48–56% against 47–61% — so it is not ignoring a burning village when it sees
          one. But it faces that situation <strong>5.6–5.9 times an episode against 3.3–3.8</strong>. The guard chief
          faces it 1.60 times, and answers every time. The damage is not a failure of nerve at the moment of crisis; it
          is that the crisis keeps arriving, because the water spent twenty steps earlier went somewhere else.
        </p>
        <p style={{ fontSize: 14.5, color: "var(--muted)" }}>
          That last sentence is an interpretation of two probes, not a controlled experiment — nothing here isolates the
          upstream choice from the downstream threat. And one part is frankly unexplained: the hand-written greedy rule
          reaches 22.0 cells put out with 3.33 village cells lost, while the trained crew reaches ~25 with ~4.6. Greed
          for dense fire accounts for the output, but it does not account for all of the harm. A residual of about 1.3
          village cells, 25 burnt cells and fifteen steps of episode length is still unattributed, and this page does
          not know what it is.
        </p>

        <Proof title="Why a bounty on a good deed is a tax on prevention">
          <p>
            The measurements above are about which rules win. There is also an exact statement to be made about what the
            reward instructs, and it needs no simulation at all. Write the combined reward with a bounty bolted on:
          </p>
          <MathBlock>{String.raw`R \;=\; -\,\mathrm{lit}\;-\;10\,\mathrm{village\_lit}\;+\;b\,\mathrm{put\_out}`}</MathBlock>
          <p>
            Take one ordinary cell and consider two futures. In the first, the crew acts early enough that the cell
            never catches: it contributes <M>{String.raw`0`}</M> to <M>R</M>, because <code>lit</code> never counts it
            and <code>put_out</code> never counts it either. In the second, the cell catches and the crew later drops a
            bucket on it: it contributes <M>{String.raw`-1 + b`}</M>.
          </p>
          <p>
            So the environment prefers the second future whenever <M>{String.raw`b > 1`}</M>. At any bounty above one
            point a cell, <strong>a fire that started and was put out pays better than a fire that never started.</strong>{" "}
            Not &ldquo;roughly&rdquo;, not &ldquo;in some worlds&rdquo; — identically, in every world, by{" "}
            <M>{String.raw`b - 1`}</M> points a cell. For a village cell the break-even is <M>{String.raw`b > 11`}</M>,
            because the ignition is charged eleven. The measured flip in the rule book happened at{" "}
            <M>{String.raw`b = 3.00`}</M>, which is comfortably inside the region where the arithmetic has already
            stopped preferring prevention.
          </p>
          <p>
            Two honest qualifications. First, a drop does more than un-burn the cells under it: it wets the whole
            five-by-five square to moisture 0.9, which suppresses ignitions for many ticks afterwards. Those prevented
            ignitions are real value and they are charged nowhere and paid nowhere, so the two-term comparison above
            understates how good a drop is under <em>both</em> rewards. Second, a doused cell is not permanently safe —
            it dries at 0.01 a fire tick and can catch again, in which case it is charged again. Neither qualification
            changes the direction of the inequality; both are reasons the true accounting is messier than the clean
            statement.
          </p>
          <p>
            There is a last twist worth recording, because it contradicts the natural intuition. A bounty is supposed to
            be the <em>learnable</em> reward — dense, immediate, attributable. Measure it the way the{" "}
            <Link href="/learn/building-environments/the-crew-that-learned-nothing" style={link}>whisper test</Link>{" "}
            measures things — replay every world with the guard chief&rsquo;s first drop hushed, on identical dice — and
            one bucket is worth <M>{String.raw`+0.36`}</M> cells put out against a spread of 7.34 across worlds, a
            signal-to-noise of <strong>0.049</strong>. Under the shipped damage reward the same bucket is worth{" "}
            <M>{String.raw`+9.27`}</M> against a spread of 74.13: <strong>0.125</strong>, two and a half times better.
            The whole policy is about as loud under either (1.83 against 1.92). So the bounty is not even buying the
            thing it was supposed to buy. Its advantage is per-step attribution — the reward lands on the step that
            earned it — and that is a real advantage for credit assignment, but it does not show up as a louder signal
            about whether one bucket was worth throwing.
          </p>
        </Proof>

        <Callout title="Decision record: the shipped reward pays nothing for putting fire out, and that stays" color={GOLD}>
          <p>
            <strong>What we keep.</strong> <code>reward=&quot;values&quot;</code>: minus one per cell that catches,
            minus ten more for a village cell, and nothing at all for extinguishing. The <code>extinguish</code> mode
            stays in the code, because a reward you can switch is how a values choice becomes testable, and because this
            page needs it.
          </p>
          <p><strong>What was considered.</strong></p>
          <ul>
            <li>
              <strong>The pure bounty</strong> (<code>reward=&quot;extinguish&quot;</code>). Measured, three seeds: it
              doubles cells put out and doubles village damage, landing behind a random burning-cell dispatcher on the
              only column we said we cared about. Rejected on evidence.
            </li>
            <li>
              <strong>A small bounty on top of the damage reward</strong> — the &ldquo;surely a little of it is
              fine&rdquo; option, and the one most likely to be reached for in practice. Measured: the rule book flips
              at <strong>b = 3.00</strong>, and the arithmetic above says any <M>{String.raw`b > 1`}</M> already prefers
              a cell lit and doused to a cell never lit. We could bound it below 3.00 and call that safe, but that bound
              is a fact about these seven rules, not about the environment, and a learner is not restricted to seven
              rules. Rejected as a knob whose safe range cannot be computed in general.
            </li>
            <li>
              <strong>Potential-based shaping.</strong> The principled way to add a dense hint without changing which
              policy is optimal, and the right tool if the real problem were learnability — it is what World 1 used when{" "}
              <Link href="/learn/building-environments/paying-the-boat" style={link}>minus one per second</Link> proved
              too quiet, and the{" "}
              <Link href="/learn/warehouse-robot-capstone/designing-the-reward" style={link}>warehouse capstone</Link>{" "}
              has the theory. Not run in this world. Named here as the option we would reach for first, and flagged as
              untested rather than dismissed.
            </li>
            <li>
              <strong>Pay for area saved against a counterfactual.</strong> Roll the world forward on the same dice with
              the crew doing nothing and pay the difference — this is exactly the machinery the whisper test uses, so we
              know it works. Rejected on two grounds: it costs a whole extra episode per episode, and it makes the
              reward depend on a baseline policy, so the crew is being paid to beat the guard chief rather than to
              protect the village. That is a different job.
            </li>
          </ul>
          <p>
            <strong>What it costs us.</strong> The environment gives a crew no credit whatever for the number a real
            crew would actually report, so any dashboard built on &ldquo;cells extinguished&rdquo; will disagree with
            the score, sometimes violently. That is why this chapter keeps printing drops per episode and cells put out
            beside every score: they are <em>mechanism</em> — how a crew achieved what it achieved — and never the
            objective. The moment they become the objective, this page happens.
          </p>
        </Callout>

        <h2>The check that would have caught it</h2>
        <p>
          None of this needed a trained agent to find. The warning was in the{" "}
          <Link href="/learn/building-environments/reward-is-a-values-decision" style={link}>previous page</Link>, in a
          single number: with the crew held completely fixed and never optimising anything, the correlation between
          cells put out and the score was <strong>−0.70</strong>. A quantity that runs backwards against your objective
          under a frozen policy will not start running forwards under an optimising one.
        </p>
        <p>
          So the transferable rule is cheap to apply. <strong>Before you pay for a metric, hold a policy fixed, run it
          across the distribution of worlds your agent will actually see, and measure the correlation between the metric
          and the thing you want.</strong> It costs one batch of rollouts and no training. If the correlation is
          negative, you have found a cobra before you have bred any.
        </p>
        <p>
          And the second lesson is about why the trap is attractive in the first place. The bounty was not a silly idea.
          It is the number a crew reports, it lands on the step that earned it, and on 94% of the steps where the
          shipped reward charges anything, the crew did not act at all. Every reward that is easy to attribute is a
          reward for something local, and in a world of coupled systems almost nothing worth having is local. That
          tension does not go away by choosing correctly once. The next world in this track is a duel between two
          fighters, where the obvious things to count are all local and immediate, and we will have to ask the same
          question about every one of them.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/training-the-crew", label: <>← Training the crew: DQN vs PPO</> }}
          next={{ href: "/learn/building-environments/what-the-crew-learned", label: <>What the crew learned →</> }}
        />
      </div>
    </article>
  );
}

// Same shape as the `pre` in the-reset-step-contract and training-ground. The overflowX is the
// point of it: without a scroll container a long line scrolls the whole page sideways instead.
const pre: React.CSSProperties = {
  background: "var(--code-bg, color-mix(in srgb, var(--ink) 5%, transparent))",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 13,
  lineHeight: 1.55,
  overflowX: "auto",
  fontFamily: "ui-monospace, monospace",
};

const th: React.CSSProperties = { textAlign: "left", padding: "7px 12px 7px 0", fontWeight: 500, color: "var(--muted)", fontSize: 12.5 };
const thr: React.CSSProperties = { ...th, textAlign: "right", paddingRight: 14 };
const td: React.CSSProperties = { padding: "7px 12px 7px 0", color: "var(--ink)" };
const tdr: React.CSSProperties = { ...td, textAlign: "right", paddingRight: 14, fontFamily: "ui-monospace, monospace", fontSize: 12.5 };

const codeBook = `# Fly a rule book once. Record what the fire did and what the crew did -- then pay for it two ways.
guard = pilot_chief("guard")
to_lake = lambda env: toward(env.pos, (lambda L: L[np.abs(L - env.pos).sum(1).argmin()])(np.argwhere(env.T == LAKE)))
densest_cell = dispatcher("densest")          # the target whose 5x5 drop covers the most burning cells

def densest(env):                             # the same greedy rule, flown as a pilot so it sits in this table
    if env.water == 0: return to_lake(env)
    if not (env.S == BURNING).any(): return 0
    return toward(env.pos, np.array(divmod(int(densest_cell(env)), N)))

RULES = {"stand by": lambda env: 0,
         "one drop, then hover": lambda env: 5 if env.t == 0 else 0,
         "nearest": pilot_chief("nearest"),
         "guard": guard,
         "densest": densest,
         "soak the village": lambda env: to_lake(env) if env.water == 0 else toward(env.pos, np.argwhere(env.T == VILLAGE)[4]),
         "drop, then guard": lambda env: 5 if env.t == 0 else guard(env)}

def tally(policy, n=200):
    rows = []
    for k in range(n):
        env = Wildfire(); env.reset(seed=1000 + k); lit = vlit = put_out = 0
        while True:
            _, r, terminated, truncated, info = env.step(policy(env))
            lit += info["lit"]; vlit += info["village_lit"]; put_out += info["put_out"]
            if terminated or truncated: break
        rows.append((lit, vlit, put_out))
    return np.array(rows, float).mean(0)

BOOK = {name: tally(pol) for name, pol in RULES.items()}
harm = lambda row: row[0] + 10 * row[1]              # a cell costs 1, a village cell 11 -- the shipped reward
print(f"  {'rule':22s}{'caught':>8}{'village':>9}{'put out':>9}     {'paid for harm':>14}{'paid per cell out':>19}")
for name, row in BOOK.items():
    print(f"  {name:22s}{row[0]:8.2f}{row[1]:9.2f}{row[2]:9.2f}     {-harm(row):14.1f}{row[2]:19.2f}")
print()
print("  paid for harm, the book says:   " + " > ".join(sorted(BOOK, key=lambda n: harm(BOOK[n]))))
print("  paid per cell put out, it says: " + " > ".join(sorted(BOOK, key=lambda n: -BOOK[n][2])))`;

const outBook = `  rule                    caught  village  put out      paid for harm  paid per cell out
  stand by                167.36     6.79     0.00             -235.2               0.00
  one drop, then hover    150.16     2.81     0.00             -178.3               0.00
  nearest                  81.84     2.67    17.20             -108.5              17.20
  guard                    82.56     1.06    13.42              -93.2              13.42
  densest                  89.67     2.95    22.09             -119.2              22.09
  soak the village        140.88     0.49     1.44             -145.8               1.44
  drop, then guard        101.27     0.46    10.87             -105.8              10.87

  paid for harm, the book says:   guard > drop, then guard > nearest > densest > soak the village > one drop, then hover > stand by
  paid per cell put out, it says: densest > nearest > guard > drop, then guard > soak the village > stand by > one drop, then hover`;

const codeReach = `#                      caught  village  put out
BOOK = {"stand by":             (167.36, 6.79,  0.00),
        "one drop, then hover": (150.16, 2.81,  0.00),
        "nearest":              ( 81.84, 2.67, 17.20),
        "guard":                ( 82.56, 1.06, 13.42),
        "densest":              ( 89.67, 2.95, 22.09),
        "soak the village":     (140.88, 0.49,  1.44),
        "drop, then guard":     (101.27, 0.46, 10.87)}

print("  which rules can ANY exchange rate on the damage reward ever pick?")
for name, (cells, village, _) in BOOK.items():
    beaten = [m for m, (c2, v2, _) in BOOK.items() if m != name and c2 <= cells and v2 <= village]
    print(f"   {name:22s} " + (f"never -- {beaten[0]} lets fewer cells catch AND fewer village cells" if beaten else "it is on the frontier"))

print()
print("  now bolt a bounty on top of the shipped reward:  -lit - 10 * village_lit + b * put_out")
score = lambda row, b: -(row[0] + 10 * row[1]) + b * row[2]
best = None
for i in range(0, 1001):
    b = i / 100
    now = max(BOOK, key=lambda n: score(BOOK[n], b))
    if now != best: print(f"   a bounty of {b:5.2f} a cell or more  ->  the book's answer is: {now}")
    best = now
g, d = BOOK["guard"], BOOK["densest"]
damage, doused = (d[0] + 10 * d[1]) - (g[0] + 10 * g[1]), d[2] - g[2]
print(f"   exactly: densest overtakes guard at {damage / doused:.2f} a cell -- {damage:.2f} points of damage "
      f"traded for {doused:.2f} more cells put out")`;

const outReach = `  which rules can ANY exchange rate on the damage reward ever pick?
   stand by               never -- one drop, then hover lets fewer cells catch AND fewer village cells
   one drop, then hover   never -- nearest lets fewer cells catch AND fewer village cells
   nearest                it is on the frontier
   guard                  it is on the frontier
   densest                never -- nearest lets fewer cells catch AND fewer village cells
   soak the village       never -- drop, then guard lets fewer cells catch AND fewer village cells
   drop, then guard       it is on the frontier

  now bolt a bounty on top of the shipped reward:  -lit - 10 * village_lit + b * put_out
   a bounty of  0.00 a cell or more  ->  the book's answer is: guard
   a bounty of  3.01 a cell or more  ->  the book's answer is: densest
   exactly: densest overtakes guard at 3.00 a cell -- 26.01 points of damage traded for 8.67 more cells put out`;

const codeWait = `# The obvious story: a crew paid per cell put out lets the fire grow so that there is more to put out.
# Test it on a rule that cannot learn anything -- hover for the first k steps, then guard as usual.
guard = pilot_chief("guard")

def wait_then_guard(k):
    return lambda env: 0 if env.t < k else guard(env)

print(f"  {'wait':>6}{'put out':>10}{'per drop':>10}{'drops':>8}{'village':>9}{'burnt':>8}{'steps':>8}{'paid for harm':>15}")
for k in (0, 8, 16, 24, 40, 60):
    rows = []
    for j in range(200):
        env = Wildfire(); env.reset(seed=1000 + j); lit = vlit = 0
        while True:
            _, r, terminated, truncated, info = env.step(wait_then_guard(k)(env))
            lit += info["lit"]; vlit += info["village_lit"]
            if terminated or truncated: break
        s = env.summary()
        rows.append((s["put_out"], s["drops"], s["village_damaged"], s["burnt"], s["t"], lit + 10 * vlit))
    m = np.array(rows, float).mean(0)
    print(f"  {k:6d}{m[0]:10.2f}{m[0] / max(m[1], 1e-9):10.2f}{m[1]:8.2f}{m[2]:9.2f}{m[3]:8.1f}{m[4]:8.1f}{-m[5]:15.1f}")`;

const outWait = `    wait   put out  per drop   drops  village   burnt   steps  paid for harm
       0     13.42      4.77    2.81     1.03    83.7    46.9          -93.2
       8     12.43      4.82    2.58     1.06   102.1    50.3         -112.1
      16     11.63      4.87    2.39     1.50   116.0    54.6         -131.0
      24     10.78      4.92    2.19     2.27   128.6    57.8         -151.4
      40      7.07      4.59    1.54     4.59   146.5    62.6         -191.1
      60      3.06      3.87    0.79     5.87   158.0    68.6         -214.8`;

const codeWater = `# So where does a greedy crew actually differ? Watch every bucket: when it is dropped, on how much fire,
# and how far from the village. And ask what the bounty is correlated with when the crew never changes.
guard = pilot_chief("guard")
to_lake = lambda env: toward(env.pos, (lambda L: L[np.abs(L - env.pos).sum(1).argmin()])(np.argwhere(env.T == LAKE)))
densest_cell = dispatcher("densest")

def densest(env):
    if env.water == 0: return to_lake(env)
    if not (env.S == BURNING).any(): return 0
    return toward(env.pos, np.array(divmod(int(densest_cell(env)), N)))

print(f"  {'rule':10s}{'drops':>7}{'first at':>10}{'burning then':>14}{'cells hit':>11}{'from village':>14}")
book = {}
for name, policy in (("nearest", pilot_chief("nearest")), ("guard", guard), ("densest", densest)):
    drops, firsts, eps = [], [], []
    for k in range(200):
        env = Wildfire(); env.reset(seed=1000 + k); lit = vlit = 0
        village = np.argwhere(env.T == VILLAGE).mean(0); first = None
        while True:
            a = policy(env); r0, c0 = env.pos
            wet = a == 5 and env.water > 0 and env.T[r0, c0] != LAKE
            if wet:
                alight = int((env.S == BURNING).sum())
                far = abs(r0 - village[0]) + abs(c0 - village[1])
            _, r, terminated, truncated, info = env.step(a)
            lit += info["lit"]; vlit += info["village_lit"]
            if wet:
                drops.append((alight, info["put_out"], far))
                if first is None: first = env.t - 1
            if terminated or truncated: break
        s = env.summary(); eps.append((s["put_out"], s["burnt"], -(lit + 10 * vlit)))
        if first is not None: firsts.append(first)
    D = np.array(drops, float); book[name] = np.array(eps, float)
    print(f"  {name:10s}{len(D) / 200:7.2f}{np.mean(firsts):10.1f}{D[:, 0].mean():14.1f}{D[:, 1].mean():11.2f}{D[:, 2].mean():14.1f}")

print()
print("  and across the 200 worlds, with the crew held completely fixed:")
for name, e in book.items():
    print(f"   {name:10s} corr(cells put out, cells burnt) {np.corrcoef(e[:, 0], e[:, 1])[0, 1]:+.2f}"
          f"    corr(cells put out, return) {np.corrcoef(e[:, 0], e[:, 2])[0, 1]:+.2f}")`;

const outWater = `  rule        drops  first at  burning then  cells hit  from village
  nearest      3.42       9.0          14.4       5.02           9.9
  guard        2.81      10.2          13.5       4.77           7.9
  densest      2.56      12.3          14.9       8.63           9.3

  and across the 200 worlds, with the crew held completely fixed:
   nearest    corr(cells put out, cells burnt) +0.79    corr(cells put out, return) -0.76
   guard      corr(cells put out, cells burnt) +0.73    corr(cells put out, return) -0.70
   densest    corr(cells put out, cells burnt) +0.78    corr(cells put out, return) -0.78`;
