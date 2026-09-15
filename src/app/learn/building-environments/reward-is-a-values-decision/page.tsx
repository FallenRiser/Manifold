import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { ValuesDialLab } from "@/components/fire/ValuesDialLab";

export const metadata = {
  title: "Reward is a values decision — Manifold",
  description:
    "Every other line of an environment can be wrong in a way a test catches. The reward can only be disagreed with. Fly the rule book once, then price it under every opinion: the best rule changes at a village cell worth 1.45 and again at 32, the shipped 11 sits in the middle of that band, and turning the weight up makes the right answer clearer while making each single action harder to learn.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RewardIsAValuesDecision() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 20 minutes"
        title={<>Reward is a values decision</>}
        intro={<>Everything else in this world can be wrong in a way a test catches. The{" "}
          <Link href="/learn/building-environments/invariants-and-property-tests" style={link}>invariants page</Link>{" "}
          caught six planted bugs, the{" "}
          <Link href="/learn/building-environments/a-grid-you-can-vectorise" style={link}>vectorising page</Link> proved
          two implementations tick for tick identical, the{" "}
          <Link href="/learn/building-environments/coupled-clocks" style={link}>clocks page</Link> pinned down the order
          of operations. One line is not like the others. <code>reward = −lit − 10.0 × village_lit</code> is not a claim
          about fire. It is a claim about what we want, and no experiment settles it. This page does the three things
          measurement <em>can</em> do for a values decision, and is straight about the one it can&rsquo;t.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Reading the line out loud</h2>
        <p>
          Here is the reward, as an English sentence. <strong>Every cell that catches fire costs one. Every village cell
          that catches costs ten more.</strong> Nothing else costs anything: not time, not water, not flying, not the
          fire already burning. Nothing is paid for: not a cell put out, not a village saved.
        </p>
        <p>
          Note the arithmetic before we go further. <code>lit</code> counts <em>every</em> cell that catches, village
          cells included, and then <code>village_lit</code> charges those again. So the exchange rate the environment
          actually offers is <strong>a village cell for eleven ordinary ones</strong>, not ten. That kind of off-by-one
          is easy to write and hard to notice, and it is worth noticing because the whole page is about what that number
          buys. From here on we will talk about the rate — what one village cell is worth in ordinary cells — where the
          code talks about the extra weight.
        </p>
        <p>
          At least four more opinions are buried in that line, none of them announced. A forest cell and a grass cell
          cost the same, although forest burns for five fire ticks and grass for two. A cell is charged when it catches,
          not for how long it burns. A cell that a bucket puts out and that later catches again is charged a second
          time — the <Link href="/learn/building-environments/invariants-and-property-tests" style={link}>invariants
          page</Link> found that one by accident, when an invariant written from the obvious reading of the rule turned
          out to disagree with the code. And the village&rsquo;s nine cells are worth exactly the same as each other.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Six hand-written rules, scored on the 200 held-out worlds. Over what range of the exchange rate does
            the best of the six stay the same rule?</>}
          options={["A narrow range — the weight is delicate", "Roughly 1.5 to 32 — more than an order of magnitude", "Any rate at all — the best rule is best", "It changes at every value"]}
        />

        <h2>Fly once, price many times</h2>
        <p>
          The trick that makes a values question tractable is that <em>the reward is not part of the world</em>. The fire
          does not know what we are charging for it. So we can fly each rule once, write down what physically happened in
          units nobody has put a price on yet, and then change our minds as many times as we like without flying
          anything again.
        </p>
        <p>
          Two sets of units, because there are two natural things to charge for. <strong>Caught</strong> counts every cell
          that catches fire, once each, which is what the environment charges now. <strong>Rent</strong> counts the
          burning cells again on every fire tick, which charges for how long a fire lasts rather than for it starting.
          Each has a village column.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeBook} />
        <CodeOutput>{`  rule                     caught  village     rent   v-rent  put out   drops   steps
  stand by                 167.36     6.79   599.92    27.14     0.00    0.00    77.7
  one drop, then hover     150.16     2.81   538.99    11.26     0.00    1.00    77.4
  nearest                   81.84     2.67   259.21     9.96    17.20    3.42    47.0
  guard                     82.56     1.06   269.70     2.77    13.42    2.81    46.9
  soak the village         140.88     0.49   503.68     1.38     1.44    4.54    73.0
  drop, then guard         101.27     0.46   339.73     1.37    10.87    3.48    51.0`}</CodeOutput>

        <p>
          That table contains no opinions. It is six facts about what happens when you fly six ways, and every argument
          on this page is an argument about how to collapse those columns into one number.
        </p>
        <p>
          Read the two middle columns against each other and the shape of the disagreement appears. Going down the table
          the village column improves — 6.79, 2.81, 2.67, 1.06, 0.49, 0.46 — while the cells-caught column does{" "}
          <em>not</em>: the nearest chief lets the fewest cells catch of anything here, and the two rules that protect the
          village best let a lot more burn. There is a real trade, and no amount of further measurement resolves it.
        </p>

        <h2>The price list</h2>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codePrice} />
        <CodeOutput>{`  a village cell is worth...      1 cells   1.45 cells     11 cells     32 cells    101 cells
  stand by                       -167.4       -170.4       -235.3       -377.9       -846.4
  one drop, then hover           -150.2       -151.4       -178.3       -237.3       -431.2
  nearest                         -81.8        -83.0       -108.5       -164.6       -348.8
  guard                           -82.6        -83.0        -93.2       -115.4       -188.6
  soak the village               -140.9       -141.1       -145.8       -156.1       -189.9
  drop, then guard               -101.3       -101.5       -105.9       -115.5       -147.3

  guard                burns  +2.33 more ordinary cells to save 1.61 village ones than nearest          -> it wins once a village cell is worth   1.45
  drop, then guard     burns +21.64 more ordinary cells to save 2.21 village ones than nearest          -> it wins once a village cell is worth   9.79
  drop, then guard     burns +19.31 more ordinary cells to save 0.60 village ones than guard            -> it wins once a village cell is worth  32.18
  soak the village     burns +58.89 more ordinary cells to save 0.57 village ones than guard            -> it wins once a village cell is worth 103.32

  a village cell worth   1.00 or more  ->  the book's answer is: nearest
  a village cell worth   1.45 or more  ->  the book's answer is: guard
  a village cell worth  32.19 or more  ->  the book's answer is: drop, then guard

  the same six episodes, charged as RENT instead -- every burning cell, every fire tick:
   guard                     -297.4   (charged once, when it catches:   -93.2)
   drop, then guard          -353.4   (charged once, when it catches:  -105.9)
   nearest                   -358.8   (charged once, when it catches:  -108.5)
   soak the village          -517.5   (charged once, when it catches:  -145.8)
   one drop, then hover      -651.6   (charged once, when it catches:  -178.3)
   stand by                  -871.3   (charged once, when it catches:  -235.3)`}</CodeOutput>

        <p>
          Three bands, and only two boundaries. Value a village cell at anything under 1.45 ordinary cells and the book
          says fight the nearest fire. Between <strong>1.45 and 32.18</strong> it says guard the village. Above 32.18 it
          says wet the village at step zero and then guard. The shipped rate of eleven sits in the middle band, and it is
          not sitting near an edge: you could be wrong about it by a factor of seven downward, or nearly three upward, and
          get the same answer.
        </p>

        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.6rem" }}>
          Those boundaries carry less precision than they look like they do. The second cell works from the two-decimal
          table the first one printed, and the upper crossover divides by the gap between two village columns that round
          to 1.06 and 0.46 — so a hundredth of rounding moves it by a quarter. Computed from the full episode totals it
          is 31.93 rather than 32.18. Two decimals are plenty to <em>find</em> a boundary and not enough to place it to
          three figures, which for this argument is all we need.
        </p>

        <Callout color={GOLD} title={<>The order of magnitude is the decision. The digit is not.</>}>
          It is tempting to treat a reward weight as a dial to tune, and to feel that ten is somehow more principled than
          eight or twelve. On this rule book, everything from 1.45 to 32 picks the same winner — so the choice between
          them changes nothing, while the choice between 1.2 and 1.7 changes everything. The useful question is never
          &ldquo;what is the right number&rdquo;. It is <em>where are the boundaries</em>, and <em>which side of them do I
          mean to be on</em>. You cannot answer that by tuning, because there is nothing to tune against.
        </Callout>

        <h2>Most of the book needs no values at all</h2>
        <p>
          Of the twenty-one pairs you can make from the seven rules in the script,{" "}
          <strong>sixteen are settled without any weight whatsoever</strong>, because one rule is better on both counts.
          Drop-then-guard lets fewer cells catch <em>and</em> fewer village cells catch than soaking the village. The
          guard chief beats the one-drop rule on both. Standing by loses to everything. No opinion about villages is
          needed for any of those, and if the whole book looked like that, the reward&rsquo;s weight would be decoration.
        </p>
        <p>
          Five pairs are genuine trades, and the exchange rate decides them. One of those is decided rather finely: at
          the shipped rate of eleven, drop-then-guard scores −105.9 and the nearest chief scores −108.5, a gap of 2.6
          against the roughly eight points this chapter calls the smallest real difference. Those two rules are tied, and
          it is the weight — not the fire, not the helicopter — that breaks the tie.
        </p>

        <h2>The part that is uncomfortable</h2>
        <p>
          Now take the words seriously. A village cell is a house. An ordinary cell is trees. Asked plainly whether a
          house is worth eleven trees, most people would say it is worth a great deal more than that — and at a rate of
          32 the rule book&rsquo;s advice changes to &ldquo;wet the village first, then fight&rdquo;, which is roughly what
          an actual fire service does when a town is threatened.
        </p>
        <p>
          So the shipped eleven is probably too low, if the numbers mean what the words say. We are keeping it anyway,
          and the honest reason is not an ethical one.
        </p>

        <Callout color={GOLD} title={<>Decision record: a village cell is worth eleven, and why that is a design choice</>}>
          <p style={{ margin: 0 }}>
            <strong>Chosen.</strong> Charge one for every cell that catches and ten more for a village cell — an exchange
            rate of eleven. Unchanged from the prototype.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Why not a rate near one.</strong> Below 1.45 the best rule ignores the village entirely and the task
            becomes &ldquo;minimise burnt area&rdquo;, which is a fine task but not the one the{" "}
            <Link href="/learn/building-environments/wildfire-brief" style={link}>brief</Link> describes. It also makes
            the village scenery: nine cells out of 256 that nothing in the reward distinguishes.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>Why not a rate above 32, which the words arguably justify.</strong> Because at 32 the best rule
            becomes &ldquo;wet the village at step zero, then guard&rdquo;, and it stays the best rule however high you
            go — a rule whose decisive content is one drop in the first second, before the fire has moved. We built a
            world to watch a crew learn to fight a fire. Weighting the village that heavily makes the answer be{" "}
            <em>mostly don&rsquo;t</em>. That is a statement about what we want to study, not about what a village is
            worth, and it should be written down as one rather than dressed up as ethics.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>What it costs.</strong> Any conclusion this chapter reaches about &ldquo;the best policy&rdquo; is a
            conclusion about the best policy <em>at a rate of eleven</em>. A crew trained here would be wrong for a real
            fire service that valued houses properly — not badly implemented, but correctly optimising the wrong opinion.
            That is the failure mode to watch for, and it never shows up as a bug.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>What would move it.</strong> A reason to care about the area burnt for its own sake — smoke, carbon,
            a second village — would push the rate down. A brief that named the village as the only thing that matters
            would push it past 32 and we would need a different task, or a bigger map where wetting the village is not
            enough on its own.
          </p>
        </Callout>

        <h2>What the reward does not pay for</h2>
        <p>
          Read the line once more and notice the absence. <strong>Putting a fire out earns nothing.</strong> Not one
          point. A bucket is worth only the fires that never start because of it, which is why the{" "}
          <Link href="/learn/building-environments/the-crew-that-learned-nothing" style={link}>crew page</Link> had to
          price a drop by replaying the world without it. That has a consequence for the number a crew would most
          naturally put on a chart.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeNotPaid} />
        <CodeOutput>{`  the guard chief puts out 13.42 cells an episode, and the reward pays it 0.00 for them
  its whole +142.1 over standing by is fires that never started
  across the 200 worlds:  corr(cells put out, return)       -0.70
                          corr(cells put out, cells burnt)  +0.73
  the 20 worlds where it put out the MOST fire:  27.9 cells, return  -178.6
  the 20 where it put out the least:              2.8 cells, return   -14.7`}</CodeOutput>

        <p>
          Hold the policy completely fixed — this is one rule, flown 200 times — and the worlds where it puts out the most
          fire are the worlds where it does <strong>worst</strong>. Correlation −0.70. The twenty worlds where it doused
          27.9 cells returned −178.6; the twenty where it doused 2.8 returned −14.7. Nothing about the crew changed
          between those. Big fires simply give you more to put out and cost more, and &ldquo;cells extinguished&rdquo;
          measures the fire far more than it measures the firefighting.
        </p>
        <p>
          This is worth carrying into every project. The metric that feels like progress — units processed, errors caught,
          fires doused — can be a measurement of how hard the day was rather than how well you did. And it suggests an
          obvious fix, which is to pay the crew for cells extinguished so the two finally agree. That is a third shape for
          the reward, it is the most natural thing in the world to try, and it goes wrong in a specific and instructive
          way. It has a page of its own later in this chapter.
        </p>

        <h2>Weight against shape</h2>
        <p>
          The rate is one kind of decision; <em>what you charge for at all</em> is another. Charging rent — every burning
          cell, every fire tick — says something genuinely different: that a fire which smoulders for five ticks is worse
          than one that burns out in two, and that putting a fire out early is worth something in itself. It is a more
          defensible description of what a fire costs, and it was measured above.
        </p>
        <p>
          It reorders <strong>nothing</strong>. The last block of the price-list cell ranks all six rules by rent, and
          the order is the same one charging at ignition gives, top to bottom. The script checks all seven rules and
          prints <code>the two orders are IDENTICAL</code>. A change of shape that looked like a change of principle
          turned out to be a change of units.
        </p>
        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Two honest limits on that. It is a null about <em>this rule book</em> — six hand-written policies, none of which
          trades &ldquo;lots of short fires&rdquo; against &ldquo;a few long ones&rdquo;, which is the axis rent is
          sensitive to. A learner searching a much larger space might well find such a trade. And the crossovers do move, some of
          them a lot: under rent the guard chief overtakes the nearest chief at 2.46 rather than 1.45, and wetting the
          village first needs a rate of <strong>51</strong> rather than 32. The order you get is unchanged; the price of
          changing your mind is not.
        </p>

        <h2>The reward is also a learnability decision</h2>
        <p>
          There is one more thing measurement can do here, and it is the one people usually leave out. A reward is not
          only a statement of what you want. It is the signal a learner has to hear, and two rewards that agree about
          every policy can differ in how hard they are to learn from.
        </p>
        <p>
          The <Link href="/learn/building-environments/the-crew-that-learned-nothing" style={link}>crew page</Link>{" "}
          measured how loud a single good bucket is by replaying each world with that drop hushed. Do it again, and price
          the difference under each opinion in turn.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeLoud} />
        <CodeOutput>{`  the reward charges...                     one bucket   spread     S/N  whole policy S/N
  once, when a cell catches, village = 1         +8.37     57.0   0.147              1.49
  once, when a cell catches, village = 11        +9.27     74.1   0.125              1.92
  once, when a cell catches, village = 31       +11.06    115.4   0.096              2.22
  once, when a cell catches, village = 101      +17.36    275.0   0.063              2.39
  rent, every tick it burns, village = 1        +28.89    202.1   0.143              1.63
  rent, every tick it burns, village = 11       +34.19    247.4   0.138              2.32
  rent, every tick it burns, village = 31       +44.79    359.5   0.125              2.95
  rent, every tick it burns, village = 101      +81.89    808.8   0.101              3.42`}</CodeOutput>

        <p>
          The two right-hand columns move in <em>opposite directions</em>. Turn the village up from 1 to 101 and the whole
          guard policy gets easier to recognise as good — signal-to-noise 1.49 rising to 2.39 — while a single well-aimed
          bucket gets steadily harder to hear, 0.147 falling to 0.063. The same knob that sharpens the verdict on a
          finished policy blurs the evidence a learner needs to build one.
        </p>

        <Proof title="Why the same weight sharpens the verdict and blurs the steps">
          <p>
            <strong>Step 1 — everything is linear in the rate.</strong> A rule&rsquo;s cost is{" "}
            <M>{String.raw`(\text{ordinary cells}) + r\,(\text{village cells})`}</M>. So the value of anything — one
            bucket, a whole policy — and the spread of returns across worlds are all straight lines in <M>r</M>. Which
            one grows fastest is decided by how much <em>village</em> each one contains.
          </p>
          <p>
            <strong>Step 2 — one bucket is barely about the village.</strong> Measured on the same replay: the guard
            chief&rsquo;s first drop is worth <strong>8.275 ordinary cells and 0.090 village cells</strong> — village
            content about 1%. The whole guard policy, against standing by, is worth <strong>79.08 ordinary and 5.73
            village</strong> — about 7%, six times more. A drop early in the fire mostly stops ordinary ground from
            catching; protecting the village is what the policy accomplishes over the whole episode, not what any one
            bucket does.
          </p>
          <p>
            <strong>Step 3 — the noise is almost all village, eventually.</strong> Across the 200 worlds the guard chief
            lets 81.50 ordinary cells catch with a spread of 55.55 (two thirds of the mean) and 1.06 village cells with a
            spread of 2.36 — <em>twice</em> the mean, because 77% of worlds lose no village cell at all and one loses ten.
            Village damage is rare and clumped, so as <M>r</M> grows it dominates the spread.
          </p>
          <p>
            <strong>Step 4 — the two limits.</strong> As <M>{String.raw`r \to \infty`}</M> both ratios tend to
            (village content) ÷ (village spread): <strong>0.090 / 2.36 = 0.038</strong> for one bucket, and{" "}
            <strong>5.73 / 2.36 = 2.43</strong> for the whole policy. At <M>r = 1</M> they are 0.147 and 1.49. One falls
            by a factor of four, the other rises by 60%, and the table above is just those two lines crossing the rates in
            between.
          </p>
          <p>
            <strong>What follows, and what does not.</strong> This says a heavy village weight makes per-action evidence
            quieter relative to the noise; it does not predict that training fails, since learners pool experience across
            states and do not judge one action from returns alone. It is a reason to check loudness when you change a
            reward, not a law about what will train.
          </p>
        </Proof>

        <h2>Turn the dial yourself</h2>
        <p>
          The lab flies six rules on the lab map once and then lets you re-price them as often as you like. Nothing is
          re-flown when the dial moves — that is the point of it.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Start at the shipped rate of 11 and drag left until the leader changes, then right until it changes
            again. Watch the band strip under the slider: those two boundaries are the whole values decision. Then switch
            what the reward charges for and see how little moves.</>}
          insight={<>On the lab map the bands are 1 to 4.3 (fight the nearest fire), 4.3 to 27.6 (guard the village) and
            27.6 upward (wet the village first). It is a different map with a different lake and a different fire, so the
            boundaries are not the environment&rsquo;s 1.45 and 32.18 — but the structure is the same one: three bands,
            two boundaries, a wide plateau in the middle, and the shipped rate of 11 sitting inside it. Switching to rent
            moves the first boundary from 4.3 to 5.3 and leaves the second at 27.6, within a tenth of where it was.</>}
        >
          <ValuesDialLab />
        </LabFrame>

        <h2>What we can and cannot hand to a crew</h2>
        <p>
          Three things measurement did here. It found the boundaries — 1.45 and 32.18 — so we know which choices are real
          and which are decoration. It showed that most of the rule book never needed an opinion at all. And it priced
          the choice in a currency the values argument never mentions: how loud the evidence is for a learner.
        </p>
        <p>
          The thing it could not do is tell us what a village is worth. We wrote eleven down, we know it is probably low
          if the words mean what they say, and we know exactly why we are keeping it. That is the most a reward function
          ever gets: not a proof, but a written record of an opinion, with its boundaries marked.
        </p>
        <p>
          The rule book is now priced and the interface is settled. Next we hand both to a learner and find out which of
          the two algorithms this course has built can actually use them.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/pilot-or-commander", label: <>← Pilot or commander: choosing the action</> }}
          next={{ href: "/learn/building-environments/training-the-crew", label: <>Training the crew: DQN vs PPO →</> }}
        />
      </div>
    </article>
  );
}

const codeBook = `# Fly each rule ONCE and write down what happened, in units the reward has not yet put a price on.
# "caught" counts every cell that catches fire; "rent" counts the burning cells again on every fire tick.
def to_lake(env):
    lake = np.argwhere(env.T == LAKE); return toward(env.pos, lake[np.abs(lake - env.pos).sum(1).argmin()])

guard = pilot_chief("guard")
RULES = {"stand by": lambda env: 0,
         "one drop, then hover": lambda env: 5 if env.t == 0 else 0,
         "nearest": pilot_chief("nearest"),
         "guard": guard,
         "soak the village": lambda env: to_lake(env) if env.water == 0 else toward(env.pos, np.argwhere(env.T == VILLAGE)[4]),
         "drop, then guard": lambda env: 5 if env.t == 0 else guard(env)}

def fly_once(policy, n=200):
    totals = np.zeros(7)
    for k in range(n):
        env = Wildfire(); env.reset(seed=1000 + k)
        while True:
            _, r, terminated, truncated, info = env.step(policy(env))
            totals[0] += info["lit"]; totals[1] += info["village_lit"]
            if env.t % env.fire_every == 0:                  # the fire only moves on its own clock
                burning = env.S == BURNING
                totals[2] += int(burning.sum()); totals[3] += int((burning & (env.T == VILLAGE)).sum())
            if terminated or truncated: break
        s = env.summary()
        totals[4] += s["put_out"]; totals[5] += s["drops"]; totals[6] += s["t"]
    return totals / n

print(f"  {'rule':22s}{'caught':>9}{'village':>9}{'rent':>9}{'v-rent':>9}{'put out':>9}{'drops':>8}{'steps':>8}")
for name, pol in RULES.items():
    t = fly_once(pol)
    print(f"  {name:22s}" + "".join(f"{v:9.2f}" for v in t[:5]) + f"{t[5]:8.2f}{t[6]:8.1f}")`;

const codePrice = `# Nothing here re-flies anything. These six rows are what the cell above printed -- what each rule DID,
# in cells and ticks. A reward is only an opinion about those numbers, so we can hold the flying still
# and change our minds as often as we like.
#                       caught  village    rent   v-rent
BOOK = {"stand by":             (167.36, 6.79, 599.92, 27.14),
        "one drop, then hover": (150.16, 2.81, 538.99, 11.26),
        "nearest":              ( 81.84, 2.67, 259.21,  9.96),
        "guard":                ( 82.56, 1.06, 269.70,  2.77),
        "soak the village":     (140.88, 0.49, 503.68,  1.38),
        "drop, then guard":     (101.27, 0.46, 339.73,  1.37)}

def price(row, rate, rent=False):
    "One opinion: \`rate\` is what a single village cell is worth in ordinary cells. The env's reward is rate = 11."
    cells, village = (row[2], row[3]) if rent else (row[0], row[1])
    return (cells - village) + rate * village          # ordinary cells at 1, village cells at \`rate\`

rates = [1, 1.45, 11, 32, 101]
print(f"  {'a village cell is worth...':24s}" + "".join(f"{str(r) + ' cells':>13}" for r in rates))
for name, row in BOOK.items():
    print(f"  {name:24s}" + "".join(f"{-price(row, r):13.1f}" for r in rates))

def crossover(a, b):
    "The rate at which a overtakes b: extra ordinary cells burnt, divided by village cells saved."
    (na, va), (nb, vb) = [(BOOK[n][0] - BOOK[n][1], BOOK[n][1]) for n in (a, b)]
    return (na - nb) / (vb - va)

print()
for a, b in (("guard", "nearest"), ("drop, then guard", "nearest"),
             ("drop, then guard", "guard"), ("soak the village", "guard")):
    na, va = BOOK[a][0] - BOOK[a][1], BOOK[a][1]
    nb, vb = BOOK[b][0] - BOOK[b][1], BOOK[b][1]
    print(f"  {a:20s} burns {na - nb:+6.2f} more ordinary cells to save {vb - va:4.2f} village ones than {b:16s}"
          f" -> it wins once a village cell is worth {crossover(a, b):6.2f}")

print()
best = None
for i in range(100, 20001):
    rate = i / 100
    now = min(BOOK, key=lambda n: price(BOOK[n], rate))
    if now != best: print(f"  a village cell worth {rate:6.2f} or more  ->  the book's answer is: {now}")
    best = now

print()
print("  the same six episodes, charged as RENT instead -- every burning cell, every fire tick:")
for name in sorted(BOOK, key=lambda n: price(BOOK[n], 11, rent=True)):
    print(f"   {name:22s}{-price(BOOK[name], 11, rent=True):10.1f}   (charged once, when it catches:{-price(BOOK[name], 11):8.1f})")`;

const codeNotPaid = `# The reward never mentions putting fire out. So does the crew's most natural progress metric track the score?
guard = pilot_chief("guard")

def episodes(policy, n=200):
    rows = []
    for k in range(n):
        env = Wildfire(); env.reset(seed=1000 + k); total = 0.0
        while True:
            _, r, terminated, truncated, _ = env.step(policy(env)); total += r
            if terminated or truncated: break
        s = env.summary(); rows.append((s["put_out"], s["burnt"], total))
    return np.array(rows, float)

put_out, burnt, ret = episodes(guard).T
hover = episodes(lambda env: 0)[:, 2]
print(f"  the guard chief puts out {put_out.mean():.2f} cells an episode, and the reward pays it 0.00 for them")
print(f"  its whole {ret.mean() - hover.mean():+.1f} over standing by is fires that never started")
print(f"  across the 200 worlds:  corr(cells put out, return)       {np.corrcoef(put_out, ret)[0, 1]:+.2f}")
print(f"                          corr(cells put out, cells burnt)  {np.corrcoef(put_out, burnt)[0, 1]:+.2f}")
order = np.argsort(put_out, kind="stable")           # stable, so ties break the same way everywhere
busiest, quietest = order[-20:], order[:20]
print(f"  the 20 worlds where it put out the MOST fire: {put_out[busiest].mean():5.1f} cells, "
      f"return {ret[busiest].mean():7.1f}")
print(f"  the 20 where it put out the least:            {put_out[quietest].mean():5.1f} cells, "
      f"return {ret[quietest].mean():7.1f}")`;

const codeLoud = `# Replay every world twice with the guard chief, the second time with its FIRST drop replaced by a hover.
# Same dice, same map, one action different -- then price that difference under each opinion in turn.
STAND_BY = (167.36, 6.79, 599.92, 27.14)            # the row the first cell printed, for the whole-policy column
guard = pilot_chief("guard")

def replay(hush_the_first_drop):
    out = []
    for k in range(200):
        env = Wildfire(); env.reset(seed=1000 + k); lit = vlit = rent = vrent = dropped = 0
        while True:
            a = guard(env)
            if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE:
                if hush_the_first_drop and dropped == 0: a = 0
                dropped += 1
            _, r, terminated, truncated, info = env.step(a)
            lit += info["lit"]; vlit += info["village_lit"]
            if env.t % env.fire_every == 0:
                burning = env.S == BURNING
                rent += int(burning.sum()); vrent += int((burning & (env.T == VILLAGE)).sum())
            if terminated or truncated: break
        out.append((lit, vlit, rent, vrent))
    return np.array(out, float)

full, hushed = replay(False), replay(True)
print(f"  {'the reward charges...':40s}{'one bucket':>12}{'spread':>9}{'S/N':>8}{'whole policy S/N':>18}")
for label, (c, v) in (("once, when a cell catches", (0, 1)), ("rent, every tick it burns", (2, 3))):
    for rate in (1, 11, 31, 101):
        f = full[:, c] + (rate - 1) * full[:, v]       # cost, in the same units as price() above
        h = hushed[:, c] + (rate - 1) * hushed[:, v]
        idle = STAND_BY[c] + (rate - 1) * STAND_BY[v]
        bucket, sd = (h - f).mean(), f.std()
        print(f"  {label + f', village = {rate}':40s}{bucket:+12.2f}{sd:9.1f}{bucket / sd:8.3f}{(idle - f.mean()) / sd:18.2f}")`;
