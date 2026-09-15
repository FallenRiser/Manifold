import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { SeedStrip } from "@/components/sail/SeedStrip";
import { EndingSorterLab } from "@/components/sail/EndingSorterLab";

export const metadata = {
  title: "Terminated vs truncated — Manifold",
  description:
    "Gymnasium split one done flag into two because they change the learning update. The textbook rule says bootstrap through a time limit — and on an 80-second race it makes the boat round the mark 7.2 times in 200 instead of 76.4. Why both are right, and how to label any boundary in any world.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TerminatedVsTruncated() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 14 minutes"
        title={<>Terminated vs truncated</>}
        intro={<>Every episode ends, and your environment has to say <em>how</em> it ended. It sounds like
          bookkeeping. It is not: the answer is fed straight into the learning update, and on our sailboat getting
          it &ldquo;right&rdquo; by the textbook made the agent ten times worse. This page shows that happening,
          explains why the textbook and the result are both correct, and leaves you with one question that labels
          any boundary in any world.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Where the difference lands: one term of the update</h2>
        <p>
          On the <Link href="/learn/building-environments/the-reset-step-contract" style={link}>last page</Link>{" "}
          the boat had two ways to stop. <strong>Terminated</strong>: it rounded the mark or was disqualified, and
          the task is over. <strong>Truncated</strong>: the race clock ran out while it was still sailing. To see
          why an agent cares, look at the Q-learning update the boat trains with. After every step it nudges its
          estimate toward a <em>target</em>:
        </p>
        <MathBlock>{String.raw`\text{target} \;=\; r \;+\; \gamma \max_{a'} Q(s', a') \qquad\text{or}\qquad \text{target} \;=\; r`}</MathBlock>
        <p>
          The left version says &ldquo;this step paid <M>r</M>, and from where I landed there is still a future
          worth <M>{String.raw`\max_{a'} Q(s',a')`}</M>&rdquo;. The right version says &ldquo;this step paid{" "}
          <M>r</M>, and then nothing, ever&rdquo;. Choosing between them is the whole job of the two flags.
        </p>
        <p>
          When the boat rounds the mark, the right-hand target is simply true: the race is won, there is nothing
          more to collect, and pretending otherwise would invent value out of thin air. That case is never in
          doubt. The interesting case is the clock.
        </p>

        <h2>The textbook rule</h2>
        <p>
          The standard advice — and the reason Gymnasium bothered to split one <code>done</code> flag into two — is:{" "}
          <strong>on truncation, keep bootstrapping.</strong> The argument goes like this. A time limit is usually
          something we add so training keeps moving, not part of the problem. A boat 20 metres from the mark when
          the clock hits is in a genuinely good position; if the update says &ldquo;and then nothing&rdquo; it
          teaches the agent that this spot is worthless — but only on the runs where the clock happened to strike
          there. The same position gets two contradictory targets depending on something the boat cannot see.
        </p>
        <p>
          That argument is correct. So let us test it on the sailboat, with the clock tightened to 80 seconds — the
          expert sailor needs 48.3 on average, so a learning boat has some slack, but not much.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Two boats train for 2000 races against an 80-second clock. The first bootstraps at the buzzer (the
            textbook rule); the second treats the buzzer as the end. Which rounds the mark more often afterwards?</>}
          options={["The textbook one, clearly", "Treating the buzzer as the end", "No real difference", "Neither learns anything"]}
        />

        <CodeBlock setup={ENV_SETUP} fromScratch={codeClock} />
        <CodeOutput>{`bootstrap at the buzzer  rounded the mark   4 / 200   mean finish 56.2 s
zero at the buzzer       rounded the mark  77 / 200   mean finish 50.9 s`}</CodeOutput>

        <p>
          <strong>The textbook boat finished 4 races in 200. The &ldquo;wrong&rdquo; one finished 77.</strong> One
          training run could be a fluke, so here is the same comparison over five runs each, and at the generous
          200-second clock the boat normally uses:
        </p>

        <SeedStrip rows={[
          { label: "200 s clock · bootstrap at the buzzer", values: [156, 165, 190, 177, 191] },
          { label: "200 s clock · zero at the buzzer", values: [157, 196, 148, 152, 145] },
          { label: "80 s clock · bootstrap at the buzzer", values: [4, 0, 4, 28, 0], color: "var(--bad)" },
          { label: "80 s clock · zero at the buzzer", values: [77, 86, 20, 85, 114], strong: true },
        ]} note="The 200 s clock is about 4× the expert's time; 80 s is about 1.7×. Everything else identical: 2000 practice races, α = 0.5, γ = 0.99, seeds 0–4." />

        <p>
          Two very different stories. With a generous clock the choice barely matters — the gap of 16 races is
          smaller than the spread between runs, so we cannot even say which is better. With a tight clock it is the
          difference between a boat that learned and one that did not. The per-run numbers leave no room for luck:
          the bootstrapping boats finished 4, 0, 4, 28 and 0 races; the others 77, 86, 20, 85 and 114.
        </p>

        <h2>The textbook was answering a different question</h2>
        <p>
          Go back to the argument for bootstrapping. Its first sentence was the assumption:{" "}
          <em>a time limit is usually something we add so training keeps moving, not part of the problem.</em> When
          that is true, bootstrapping is right. At 200 seconds it is true — no boat that needs 60 seconds is ever
          really racing the clock; the clock is a safety net that stops a boat stuck in irons from sailing forever.
        </p>
        <p>
          At 80 seconds it is false. The clock is now <strong>a rule of the race</strong>: a boat that has not
          rounded the mark at the buzzer has lost, just as surely as one that sailed off the course. The honest label
          for that ending is <em>terminated</em>. Bootstrapping through it teaches the boat the value of positions in
          a race with no buzzer — a race where a slow, wandering route that would finish in 95 seconds looks nearly as
          good as a sharp one. Treating the buzzer as the end puts the urgency back. You can see a trace of it in the
          single run above: the boats that did finish came in at 50.9 seconds on average against 56.2, although the
          bootstrapping boat finished too few races for that comparison to carry much weight on its own.
        </p>

        <Proof title="What zeroing the future does to the values">
          <p>
            <strong>Step 1 — the two targets as one.</strong> Let <M>d</M> be 1 if this step hits the clock and 0
            otherwise. Treating the buzzer as the end means using the target
          </p>
          <MathBlock>{String.raw`y = r + \gamma\,(1 - d)\,\max_{a'} Q(s',a')`}</MathBlock>
          <p>while bootstrapping uses the same formula with <M>d</M> forced to 0.</p>
          <p>
            <strong>Step 2 — average over when the clock strikes.</strong> The boat does not observe the time, so
            the same table entry <M>Q(s,a)</M> is updated from early moments in some races and late moments in
            others. Write <M>p(s,a)</M> for the fraction of those visits where the next step hits the clock. The
            update is a running average, so it settles where the target averages out to the estimate:
          </p>
          <MathBlock>{String.raw`Q(s,a) = \bar r(s,a) + \gamma\,\big(1 - p(s,a)\big)\,\mathbb{E}\big[\max_{a'} Q(s',a')\big]`}</MathBlock>
          <p>
            <strong>Step 3 — read it as a discount.</strong> That is an ordinary Bellman equation with the discount{" "}
            <M>\gamma</M> replaced by <M>{String.raw`\gamma\,(1 - p(s,a))`}</M>. Wherever the buzzer tends to catch the
            boat, the future is shrunk. With a generous clock, <M>p</M> is almost zero everywhere, the two versions
            coincide, and the table above shows no resolvable difference. With a tight clock, <M>p</M> is large exactly
            in the situations a slow boat reaches late — so dawdling is punished, which is what the race rule demands.
          </p>
          <p>
            <strong>Step 4 — why the textbook worries anyway.</strong> Because <M>p(s,a)</M> is an average over
            times the boat cannot see, it blurs two different situations into one number. The principled fix, from
            Pardo and colleagues&rsquo; 2018 paper on time limits, is to put the remaining time in the observation, so
            that each situation gets its own value. We tried it: four time bands multiplied the table by four, and at
            this amount of practice it rescued neither version (7.2 → 14.2 bootstrapping, 76.4 → 85.6 treating the
            buzzer as the end, both within the spread between runs). The idea is right; this boat had too little
            experience to fill a table four times the size.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>Decision record: how to label any boundary, in any world</>}>
          Forget your code for a moment and ask one question about the <em>real</em> task:{" "}
          <strong>if my simulator did not stop here, would the task still be over?</strong>
          <br /><br />
          <strong>Yes → terminated.</strong> The boat rounded the mark. It was disqualified. In a timed race, the
          buzzer went. In the boss fight later in this track, the player&rsquo;s health reached zero.
          <br /><br />
          <strong>No → truncated.</strong> The clock exists only so a stuck boat cannot sail forever. The map ends
          but the ocean does not. You cap episodes at a few thousand frames so training batches keep moving.
          <br /><br />
          And if a limit is a genuine rule, ask a second question: <strong>can the agent see it?</strong> A buzzer
          the agent cannot anticipate is a buzzer it can only learn about on average.
        </Callout>

        <LabFrame
          accent={GOLD}
          tryThis={<>Label each ending before reading its reason. Two of them use the same clock.</>}
          insight={<>The 200 s clock and the 80 s regatta rule are the same line of code with opposite labels. The label comes
            from the task, never from the mechanism that stopped the simulation. It decides one thing in the update: whether
            the target keeps the γ·max Q term.</>}
        >
          <EndingSorterLab />
        </LabFrame>

        <h2>What our boat does, and why</h2>
        <p>
          The shipped sailboat uses a <strong>200-second clock and labels it truncated</strong>, and its learner
          bootstraps through it. Be clear about what justified that. It was <em>not</em> the score: 175.8 against
          159.6 is inside the noise, so the experiment cannot choose for us. It was the question above. No race we
          are modelling has a 200-second rule; the clock is there to keep promise 3 from the last page — every
          episode ends — and nothing else. If you adapt the boat into a timed race, change the label, and consider
          showing the boat the clock.
        </p>
        <p>
          This is the pattern for the whole track. An experiment tells you when a decision <em>matters</em> and by
          how much. When it matters, let it decide. When it does not — when the difference hides inside the noise —
          decide from what the task actually is, write down why, and move on.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-reset-step-contract", label: <>← The reset/step contract</> }}
          next={{ href: "/learn/building-environments/plan-parameterise-code-test-train", label: <>Next · Plan, parameterise, code, test, train →</> }}
        />
      </div>
    </article>
  );
}

const codeClock = `# Same boat, same learner, same 2000 practice races, same 80-second race clock.
# ONE line differs: what the update believes happens after the buzzer.
for bootstrap in (True, False):
    Q, log = train_sailor(seed=0, clock=80, bootstrap_truncation=bootstrap)
    result = race(greedy(Q), clock=80)
    label = "bootstrap at the buzzer" if bootstrap else "zero at the buzzer"
    finish = f"{result['mean_time']:.1f} s" if result["mean_time"] else "   -  "
    print(f"{label:24s} rounded the mark {result['arrived']:3d} / 200   mean finish {finish}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace" };
