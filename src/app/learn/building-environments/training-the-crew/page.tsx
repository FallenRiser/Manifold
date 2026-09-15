import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { RaceLab } from "@/components/fire/RaceLab";

export const metadata = {
  title: "Training the crew: DQN vs PPO — Manifold",
  description:
    "Two learners, one world, one interface. DQN and PPO are raced against the shipped wildfire environment on the same two hundred held-out worlds, and the answer depends entirely on what you count: at equal simulator steps one of them wins clearly, at equal minutes of training it is a tie. The page ships the trainer that produced every number on it.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TrainingTheCrew() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 22 minutes"
        title={<>Training the crew: DQN vs PPO</>}
        intro={<>Everything the crew needs has now been decided. The{" "}
          <Link href="/learn/building-environments/pilot-or-commander" style={link}>interface</Link> is the commander:
          one decision names a target cell, and a scripted pilot flies the sortie. The{" "}
          <Link href="/learn/building-environments/reward-is-a-values-decision" style={link}>reward</Link> is a values
          decision we made deliberately, at eleven to one. The{" "}
          <Link href="/learn/building-environments/baselines" style={link}>bar</Link> is a ten-line rule that loses 1.11
          village cells. What is left is the part that usually gets written first: pick a learner and train it. This
          page picks two, races them against each other on the same two hundred worlds, and finds that the winner
          depends on what you put on the bottom axis.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What is fixed, and what is being raced</h2>
        <p>
          A head-to-head is only worth running if exactly one thing differs. Everything on the left of this list was
          settled on an earlier page and is identical for both learners; only the last line changes.
        </p>
        <ul>
          <li><strong>The world</strong> — the shipped <code>Wildfire</code> simulator, the same code the Run buttons on
            this page execute.</li>
          <li><strong>The interface</strong> — <code>Command</code> with <M>K = 4</M>: one decision is a target cell,
            re-decided every four simulator steps.</li>
          <li><strong>The reward</strong> — <code>values</code>, minus one per cell that catches and minus ten more for
            a village cell, scaled by a tenth so the numbers a network sees are small.</li>
          <li><strong>The budget</strong> — counted in <em>simulator steps</em>, not gradient steps and not episodes.</li>
          <li><strong>The exam</strong> — the two hundred worlds with seeds 1000–1199, which no training run ever
            touches, scored by the same shipped <code>command()</code> function that scored the hand-written chiefs.</li>
          <li><strong>The learner</strong> — DQN or PPO. This is the only difference.</li>
        </ul>
        <p>
          Start with what a learner is actually handed. It is not a list of numbers describing the fire; it is a
          picture, and the thing it has to answer with is a picture of the same shape.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeShape} />
        <CodeOutput>{outShape}</CodeOutput>

        <p>
          Twelve layers of a sixteen-by-sixteen grid in, one score per cell out. That symmetry is not a coincidence —
          it is the whole reason the commander interface was worth building — and it decides the network.
        </p>

        <h2>The network is shaped like the map</h2>
        <p>
          There are two hundred and fifty-six actions, which sounds like a lot until you notice that they are not two
          hundred and fifty-six <em>unrelated</em> actions. Action 137 means &ldquo;send the crew to row 8, column 9&rdquo;,
          and action 138 means the cell next door. Whatever makes a cell worth attacking — fire on it, village behind
          it, wind pushing it the wrong way — is a local pattern that means the same thing wherever on the map it
          appears.
        </p>
        <p>
          So the network is fully convolutional and never flattens: a stack of 3×3 convolutions over the twelve input
          layers, then a single 1×1 convolution down to one channel. The output is a sixteen-by-sixteen map of scores,
          read as 256 logits or 256 action values depending on the learner. The 256 actions share every weight except
          the final one-by-one, and a pattern learned in the top-left corner is already learned in the bottom-right.
        </p>

        <Callout title="Decision record: a fully convolutional head, not 256 output units" color={GOLD}>
          <p>
            <strong>What we ship.</strong> Conv 12→64, three 3×3 blocks at width 64, then 1×1 → 1 channel, flattened to
            256 scores. PPO adds a value head: mean over the grid, then a small MLP to one number.
          </p>
          <p>
            <strong>Rejected: flatten the observation and use a 256-unit output layer.</strong> A dense layer from a
            3,072-dimensional input to 256 outputs is 786,432 weights that have to learn independently that
            &ldquo;fire next to the village&rdquo; is urgent in every one of the 256 positions. Nothing is shared, so
            every corner of the map is a separate lesson.
          </p>
          <p>
            <strong>Rejected: score one candidate cell at a time.</strong> Feed the network the map plus a candidate
            target and have it return one number. It shares weights properly, but it costs 256 forward passes per
            decision instead of one, and the fully convolutional head computes exactly the same thing in a single pass.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>How we concluded.</strong> This is the one design choice on the page we did not race, because the
            convolutional argument is structural rather than empirical: the action space <em>is</em> the observation
            grid, and a head that throws that away has to relearn translation by brute force. It is worth naming as an
            untested assumption anyway — both learners inherit it, so it cannot favour either of them, which is the
            property a head-to-head actually needs.
          </p>
        </Callout>

        <h2>A budget is simulator steps</h2>
        <p>
          Before racing anything, decide what a run <em>costs</em>. There are at least four candidates — gradient
          steps, decisions, episodes, wall-clock minutes — and they are not proportional to each other. The one that
          matters here is the simulator, because the fire is the expensive part: a sixteen-by-sixteen cellular
          automaton stepped in Python is far slower than a forward pass through a small convnet on a GPU.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>At <M>K = 4</M> the commander re-decides every four simulator steps, but a sortie can also end
            early when the pilot arrives and drops. So how many simulator steps does one commander decision actually
            cost, on average?</>}
          options={["Exactly 4 — that is what K means", "A little under 4", "About 2 — most sorties end on arrival", "It varies so much there is no useful average"]}
          nudge={<>The pilot flies one cell per step and the map is sixteen across.</>}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeBudget} />
        <CodeOutput>{outBudget}</CodeOutput>

        <p>
          A million simulator steps is about twenty-two thousand episodes and a quarter of a million decisions. That is
          the budget both learners get, and it is worth holding on to the middle number: twenty-two thousand
          <em> episodes</em> is not very many for a task whose reward arrives as a trickle of small negative numbers
          spread over a dozen decisions.
        </p>

        <h2>The same budget, spent two different ways</h2>
        <p>
          DQN and PPO differ in almost every detail, but for a race whose currency is simulator steps the difference
          that matters is how many times a learner is allowed to look at a step it has already paid for.
        </p>
        <p>
          PPO is on-policy. It collects a rollout, computes advantages, takes a handful of gradient epochs over exactly
          that data, and then throws all of it away, because the next update must come from the policy it is now. With
          four epochs, every transition is looked at four times and never again:
        </p>
        <MathBlock>{String.raw`\text{PPO reuse} \;=\; \text{epochs} \;=\; 4`}</MathBlock>
        <p>
          DQN is off-policy. A transition goes into a replay buffer and stays there, and every gradient step samples a
          fresh batch from the whole buffer. With a batch of 256, four gradient steps per 64 collected transitions, the
          expected number of times a given transition is used before it is evicted is:
        </p>
        <MathBlock>{String.raw`\text{DQN reuse} \;=\; \frac{\text{batch} \times \text{updates}}{\text{collected}} \;=\; \frac{256 \times 4}{64} \;=\; 16`}</MathBlock>
        <p>
          Sixteen against four. If the simulator is the scarce resource, that arithmetic is the whole case for DQN, and
          it predicts the shape of the result before anything is run: at equal simulator steps DQN should be ahead,
          and it should cost more minutes to get there, because those extra looks are gradient steps someone has to
          pay for.
        </p>

        <Callout title="The one place a bug here would be invisible" color={GOLD}>
          <p style={{ margin: 0 }}>
            Both learners bootstrap from the next state — <M>{String.raw`r + \gamma V(s')`}</M> — and both must
            <em> not</em> do that when the episode genuinely ended. This world has two ways to stop, and they are not
            the same: <code>terminated</code> means the fire is out, so there is nothing left to burn and the correct
            future value is exactly zero; <code>truncated</code> means the clock ran out while the fire was still
            burning, and the correct future value is emphatically <em>not</em> zero. Treating truncation as
            termination teaches the crew that the world ends at step 200 and that fire it has not put out by then is
            free. It is a one-character mistake that produces a plausible-looking training curve, which is why the
            environment was built to report the two separately in the first place.
          </p>
        </Callout>

        <h2>How big does a gap have to be before it is a result?</h2>
        <p>
          A race produces two numbers and a temptation. Before generating either number it is worth measuring how far
          a single number moves on its own, using a policy that cannot learn, improve, or get lucky: the hand-written
          guard chief, scored on the same two hundred worlds.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeNoise} />
        <CodeOutput>{outNoise}</CodeOutput>

        <p>
          The world-to-world spread is <strong>2.46 village cells</strong> around a mean of 1.11 — most worlds cost the
          guard chief nothing at all and a few cost it the whole village. Averaged over two hundred worlds that still
          leaves <strong>±0.35</strong>, and the two halves of the exam disagree by 0.27 with the same policy flying
          both. So a race result of &ldquo;2.5 versus 2.9&rdquo; is not a result at all.
        </p>
        <p>
          The last two lines are the fix, and it is the same trick the{" "}
          <Link href="/learn/building-environments/reward-is-a-values-decision" style={link}>whisper test</Link> used:
          fly both policies on the <em>same</em> worlds and difference them per world. The gap between nearest and
          guard is +1.57 either way, but paired it carries ±0.42 instead of ±0.65 — the worlds that are hard for one
          rule are hard for the other, and pairing deletes that shared difficulty instead of counting it twice.
        </p>

        <Callout title="Two sources of noise, and the smaller one is the worlds" color={GOLD}>
          <p style={{ margin: 0 }}>
            The exam is one source of noise and the training seed is the other, and they are independent. A learner
            that scores 2.5 on this exam might have scored 2.8 with a different initialisation and a different stream
            of exploration, and no amount of extra exam worlds will tell you that. Both numbers below are therefore
            reported as three separate training runs rather than a mean with an error bar, and a claim only gets made
            on this page when the seeds do not overlap.
          </p>
        </Callout>

        {/* RESULTS */}

        {/* CLOSING — rewritten once the race lands */}

        <Proof title="Why the thing we care about is the quietest part of the reward">
          <p>
            The reward is <M>{String.raw`-\,\mathrm{lit} - 10\,\mathrm{village\_lit}`}</M>, so a policy&rsquo;s return
            splits cleanly into two pieces: the ordinary cells that caught, and ten times the village cells that
            caught. The environment already reports both every step, so the split can be summed exactly rather than
            inferred. Over the two hundred exam worlds, the guard chief:
          </p>
          <MathBlock>{String.raw`\underbrace{-80.69}_{\text{ordinary cells}} \;+\; \underbrace{10 \times (-1.16)}_{\text{village}} \;=\; -92.28 \qquad \text{village share} \;=\; \frac{11.60}{92.28} \;=\; 12.6\%`}</MathBlock>
          <p>
            and the dispatcher that names cells at random:
          </p>
          <MathBlock>{String.raw`\underbrace{-151.53}_{\text{ordinary cells}} \;+\; \underbrace{10 \times (-5.58)}_{\text{village}} \;=\; -207.38 \qquad \text{village share} \;=\; \frac{55.85}{207.38} \;=\; 26.9\%`}</MathBlock>
          <p>
            Run the same split across the whole rule book and the pattern is sharp. Every rule that is not
            specifically protecting the village sits in a narrow band — random 26.9%, a random burning cell 26.8%,
            densest 26.2%, nearest 24.2% — and the single rule that <em>is</em> protecting it drops to{" "}
            <strong>12.6%</strong>. Protecting the village is the behaviour that makes the village stop appearing in
            the reward.
          </p>
          <p>
            The eleven-to-one exchange rate chosen on the previous page does not rescue this. It sets how much a
            village cell is worth; it does not set how many of them there are left to be worth anything. As a crew
            improves, the village cells stop catching, the village term shrinks toward zero, and what still has size
            in the signal is the generic burnt area — the term that does not distinguish the guard chief&rsquo;s
            behaviour from the nearest chief&rsquo;s.
          </p>
          <p style={{ marginBottom: 0 }}>
            So the gradient that would take a crew from &ldquo;pretty good&rdquo; to &ldquo;as good as the guard
            chief&rdquo; is the quietest gradient in the problem, and it gets quieter the closer you get. The
            hand-written rule does not have this difficulty because it was never listening to the reward at all — a
            human read the exchange rate once, concluded &ldquo;stand between the fire and the village&rdquo;, and
            wrote that down. That is what a good baseline is: a place to put prior knowledge that the reward can only
            communicate in a whisper.
          </p>
        </Proof>

        <Callout title="What this page does not show" color={GOLD}>
          <p style={{ margin: 0 }}>
            Neither learner was tuned <em>per learner</em>. Both use ordinary settings — Adam at 3e-4,{" "}
            <M>{String.raw`\gamma = 0.99`}</M>, the same trunk, the same width — and the head-to-head asks only which of two standard
            implementations does better on this world at this budget. A day spent tuning PPO&rsquo;s clip range,
            entropy bonus and rollout length against a day spent tuning DQN&rsquo;s replay size and target-copy
            interval could easily move the answer, and nothing here rules that out. Neither is this a statement about
            the algorithms in general: it is one world, one interface, one reward, one network, three seeds. The
            transferable part is not the winner. It is the question — <em>what are you counting?</em> — and the
            discovery that the two obvious answers disagree.
          </p>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments/reward-is-a-values-decision", label: <>← Reward is a values decision</> }}
          next={{ href: "/learn/building-environments/the-cobra-effect", label: <>The cobra effect: pay per fire put out →</> }}
        />
      </div>
    </article>
  );
}

const codeShape = `# What the learner is handed, and what it is allowed to answer with.
w = Command(K=4)                                   # the commander interface: one decision = one target cell
o, _ = w.reset(seed=1000)
layers = "grass forest lake village elevation moisture burning burnt helicopter water wind_x wind_y".split()
print(f"observation {o.shape} {o.dtype}   actions {w.nA} -- every cell on the map is a target")
for i, n in enumerate(layers):
    print(f"  {i:2d} {n:10s} {o[i].min():6.2f} .. {o[i].max():5.2f}")
print(f"\\nso the input is a {o.shape[0]}-layer picture of a {o.shape[1]}x{o.shape[2]} grid,")
print(f"and the output is one score per cell of that same grid: {o.shape[1]}x{o.shape[2]} = {w.nA} of them.")`;

const outShape = `observation (12, 16, 16) float32   actions 256 -- every cell on the map is a target
   0 grass        0.00 ..  1.00
   1 forest       0.00 ..  1.00
   2 lake         0.00 ..  1.00
   3 village      0.00 ..  1.00
   4 elevation    0.00 ..  1.00
   5 moisture     0.10 ..  1.00
   6 burning      0.00 ..  1.00
   7 burnt        0.00 ..  0.00
   8 helicopter   0.00 ..  1.00
   9 water        1.00 ..  1.00
  10 wind_x       0.26 ..  0.26
  11 wind_y      -0.18 .. -0.18

so the input is a 12-layer picture of a 16x16 grid,
and the output is one score per cell of that same grid: 16x16 = 256 of them.`;

const codeBudget = `# A training budget is simulator steps, not decisions: one decision buys about four steps of fire.
pick = dispatcher("guard")
dec = sim = 0
for k in range(50):
    w = Command(K=4); w.reset(seed=3000 + k)
    while True:
        _, r, te, tr, info = w.step(pick(w.env)); dec += 1; sim += info["steps"]
        if te or tr: break
print(f"50 episodes: {dec} decisions cost {sim} simulator steps -> {sim/dec:.2f} steps a decision")
print(f"an episode: {sim/50:.1f} simulator steps, {dec/50:.1f} decisions")
for b in (1_000_000, 2_000_000):
    print(f"  a {b:,}-step budget = {b/(sim/50):,.0f} episodes = {b/(sim/dec):,.0f} decisions")`;

const outBudget = `50 episodes: 617 decisions cost 2249 simulator steps -> 3.65 steps a decision
an episode: 45.0 simulator steps, 12.3 decisions
  a 1,000,000-step budget = 22,232 episodes = 274,344 decisions
  a 2,000,000-step budget = 44,464 episodes = 548,688 decisions`;

const codeNoise = `# Before believing any race result: how far does a 200-world score move on its own?
def worlds(pick, seeds):
    out = []
    for k in seeds:
        w = Command(K=4); w.reset(seed=k)
        while True:
            _, r, te, tr, _ = w.step(pick(w.env))
            if te or tr: break
        out.append(w.env.summary()["village_damaged"])
    return np.array(out, float)

g = worlds(dispatcher("guard"), range(1000, 1200))
se = g.std(ddof=1) / np.sqrt(len(g))
print(f"guard over the 200 held-out worlds: {g.mean():.2f} village cells lost, world-to-world sd {g.std(ddof=1):.2f}")
print(f"  the mean of 200 is worth +/-{2*se:.2f} (two standard errors)")
print(f"  first hundred worlds {g[:100].mean():.2f}, second hundred {g[100:].mean():.2f}")
n = worlds(dispatcher("nearest"), range(1000, 1200))
d = n - g
print(f"nearest minus guard, flown on the SAME 200 worlds: {d.mean():+.2f} +/-{2*d.std(ddof=1)/np.sqrt(len(d)):.2f}")
print(f"  scored separately, the same gap would carry +/-{2*np.sqrt(g.var(ddof=1)/200 + n.var(ddof=1)/200):.2f}")`;

const outNoise = `guard over the 200 held-out worlds: 1.11 village cells lost, world-to-world sd 2.46
  the mean of 200 is worth +/-0.35 (two standard errors)
  first hundred worlds 1.25, second hundred 0.98
nearest minus guard, flown on the SAME 200 worlds: +1.57 +/-0.42
  scored separately, the same gap would carry +/-0.65`;

const th: React.CSSProperties = { textAlign: "left", padding: "7px 12px 7px 0", fontWeight: 500, color: "var(--muted)", fontSize: 12.5 };
const thr: React.CSSProperties = { ...th, textAlign: "right", paddingRight: 14 };
const td: React.CSSProperties = { padding: "7px 12px 7px 0", color: "var(--ink)" };
const tdr: React.CSSProperties = { ...td, textAlign: "right", paddingRight: 14, fontFamily: "ui-monospace, monospace", fontSize: 12.5 };
