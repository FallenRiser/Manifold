import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { DuelArenaLab } from "@/components/boss/DuelArenaLab";

export const metadata = {
  title: "Watch it fight — Manifold",
  description:
    "The trained duellist, in the arena, with the sixteen Q-values it is choosing between shown live beside it — and the chain of checks that makes the thing in your browser the same policy that won two hundred held-out duels.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WatchItFight() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 10 minutes"
        title={<>Watch it fight</>}
        intro={<>Two hundred wins from two hundred duels is a number. A probe saying it brute-forces the held windups
          rather than waiting them out is a better number. Neither is the same as watching it, so here it is — the
          actual trained network, in the actual arena, with the sixteen Q-values it is choosing between shown live as
          it chooses them.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <p>
          Press <strong>watch: the trained net</strong>. The panel above the arena is the network&rsquo;s output: one
          bar per button, re-computed every three frames, with the one it is about to press highlighted. Each bar is
          that button&rsquo;s Q measured against the average of all sixteen: right of the centre line means the network
          rates it above an average button, left means below. The scale is fixed rather than stretched to fit each
          frame, for a reason worth its own section further down.
        </p>
        <DuelArenaLab showNet />
        <Callout color={GOLD} title={<>What to look for</>}>
          <ul style={{ margin: 0, lineHeight: 1.75 }}>
            <li><strong>It parries constantly</strong> — not once per attack but repeatedly, through the whole windup.
              That is the 15-stamina button being spent as a lottery ticket, which is what{" "}
              <Link href="/learn/building-environments/what-it-learned-about-delayed-attacks" style={link}>the delay
              probe</Link> measured: roughly twice the expert&rsquo;s presses, converting about 30% of them.</li>
            <li><strong>It is never still.</strong> Walking is nearly two of every five decisions it makes, spread
              across all eight directions — which is not what the ladder&rsquo;s tidy scripted players look like.</li>
            <li><strong>Watch the bars during a <code>heavy</code> or a <code>slam</code></strong> — the two attacks
              that hold a finished-looking windup. The gap between parry and everything else is narrowest exactly
              there.</li>
            <li><strong>Watch the margin in the header.</strong> It is usually a rounding error. More on that below.</li>
          </ul>
        </Callout>

        <h2>What it presses is not what it does</h2>
        <p>
          The panel shows what the network <em>wants</em>. The ladder shows what the world <em>allowed</em>. Those turn
          out to be very different documents, and the difference is{" "}
          <Link href="/learn/building-environments/writing-the-duel" style={link}>section 1 of <code>step()</code></Link>{" "}
          — the commitment rule — doing its work on a trained policy rather than on a scripted one.
        </p>
        <CodeOutput source="scripts/boss_train.py">{outProbe}</CodeOutput>
        <p>
          Read the <code>attack</code> row first: <strong>33.3 presses a duel, 7.00 swings</strong>. Twenty-three of
          those presses arrive while it is already mid-animation and are thrown away, and three more arrive when it
          cannot pay the twenty stamina. It is asking to attack roughly five times as often as it is permitted to.
        </p>
        <p>
          Then the row that changed my mind about this policy. <strong>It presses a roll twenty-three times a duel and
          performs 0.01 of them.</strong> Not one in a hundred. I had written that it &ldquo;never rolls&rdquo; and
          that it had judged the roll a worse deal than a parry — and that is simply false. It asks for the roll
          constantly and is refused every single time: half the presses land while it is committed, and the rest land
          when it is under twenty-five stamina, because it has already spent that stamina attacking and parrying. The
          roll is not a decision it made. It is a door it keeps walking into.
        </p>
        <Callout color={GOLD} title={<>Why the check line is in the table</>}>
          <p style={{ margin: 0 }}>
            The first version of this measurement reported 0.96 attacks a duel against a ladder that says 7.01, and the
            contradiction is what exposed the bug: a decision holds one button for three frames and <code>step()</code>{" "}
            reads it on every one of them, so a press refused on the decision frame can still be accepted on the next.
            Counting only the decision frame undercounted by a factor of seven. The fix is two lines; the guard against
            the next such bug is the check printed under the table, which re-derives two of the columns from the
            environment&rsquo;s own log counters and fails loudly if they disagree.
          </p>
        </Callout>

        <h2>Most of its decisions are nearly ties</h2>
        <p>
          The number that surprised me most is not on the ladder. Across five hundred real decisions, the gap between
          the network&rsquo;s best Q-value and its second-best averages <strong>0.065</strong> — on values that run
          from about fifteen to about thirty-six. The policy is, almost everywhere, close to indifferent.
        </p>
        <p>
          That is worth sitting with, because it is easy to read a 200/200 win rate as confidence. It is not. A
          near-tie means a small perturbation — a slightly different observation, a slightly different weight — flips
          the button. It is consistent with the violently non-monotone curve on{" "}
          <Link href="/learn/building-environments/training-the-duellist" style={link}>the training page</Link>, where
          the same run swung from 100% to 69% and back, and it is the mechanism you would expect behind that: a policy
          balanced on knife edges does not degrade gracefully, it flips.
        </p>

        <p>
          You can watch that happen, but only because the panel was rebuilt to let you. Here is the whole distribution
          over two hundred duels, rather than the one average I had been quoting:
        </p>
        <CodeOutput source="scripts/boss_qspread.mjs">{outSpread}</CodeOutput>
        <p>
          The <em>fan</em> — the distance from the best button to the worst — is <strong>0.84</strong> wide in a median
          decision and <strong>5.35</strong> at the ninetieth percentile. That six-fold swing is the whole problem with
          the obvious way to draw sixteen bars, which is to stretch them between the best and worst value of the
          current frame. Doing that divides by the fan, so a full-width bar stands for 0.84 of Q in one frame and 5.35
          two frames later, and roughly <strong>a third of the panel</strong> sits pinned against the right-hand edge
          at any moment. The bars become a constant and only the numbers move.
        </p>
        <p>
          A fixed scale costs something — about 3% of bars run off the end and have to be clipped — and buys the thing
          that matters: two frames can be compared. When the sixteen bars collapse into a tight cluster around the
          centre line, that is not the drawing failing, it is the near-tie, visible.
        </p>

        <h2>Is this really the network that was scored?</h2>
        <p>
          It would be very easy for this page to be a lie. The lab is TypeScript running a re-implementation of the
          duel, fed weights through a re-implementation of a forward pass, reading an observation built by a
          re-implementation of <code>obs()</code>. Any of those three could differ from the Python that produced the
          200/200 and nothing on screen would look wrong.
        </p>
        <p>
          So all three are checked, against recorded states from real duels, and the check is a script you can run:
        </p>
        <CodeOutput source="scripts/boss_policy_check.mjs">{outCheck}</CodeOutput>
        <p>
          The weights are compared by hash, not by eye — they ship as 308 KB of raw little-endian float32 straight out
          of torch, neither quantised nor re-encoded. The observation is rebuilt from recorded duel states and compared
          float by float. The Q-values are compared value by value, and the only disagreements are in the last bits,
          where float32 accumulated in a different order than torch&rsquo;s BLAS is expected to differ. And then the
          thing that actually matters: the same button, on every one of the five hundred and five.
        </p>
        <Proof title="what this page still cannot claim" color={GOLD}>
          <p style={{ margin: 0 }}>
            The duels you watch here are <em>not</em> the held-out two hundred. Python draws its boss decisions from
            numpy&rsquo;s PCG64 and the browser draws from a small mulberry32 generator, so the same seed means nothing
            across the two — a deliberate choice made when the port was written, since matching generators would have
            been a far more fragile thing to maintain than matching mechanics. What the checks establish is that the{" "}
            <em>mechanics</em> and the <em>policy</em> are identical; the specific duels are fresh ones. So the win
            tally the lab accumulates is its own small sample, not a re-run of the published result, and it will
            occasionally lose one. If it never lost any over a long enough watch, that would be the surprising outcome
            given a mean decision margin of 0.065.
          </p>
        </Proof>
        <DecisionPoint
          accent={GOLD}
          question={<>The table says it performs 0.01 rolls a duel. Is the roll therefore dead weight in this
          action space?</>}
          options={[
            {
              label: "No — one policy not using it says nothing about whether it is needed",
              verdict: "best",
              response: (<>Right, and the table below sharpens it: this policy did not decline the roll, it was
                refused one. <code>roll, punish</code> and <code>sidestep, punish</code> both sit on the ladder above
                every non-defensive player, so the roll demonstrably works. Removing it would change what the next run
                could discover, which is a much larger claim than &ldquo;this run did not manage it&rdquo;.</>),
            },
            {
              label: "Yes — 0.005 rolls a duel is effectively never, so cut it",
              verdict: "miss",
              response: (<>This is using one seed of one algorithm as evidence about the world rather than about the
                policy — and here it is worse than that, because the table shows the roll is not being declined at all.
                It is requested twenty-three times a duel and refused. Cutting it would remove an option the policy is
                actively reaching for.</>),
            },
            {
              label: "Only if a PPO run also ignores it",
              verdict: "close",
              response: (<>Better evidence, and still not enough — two algorithms agreeing can mean the roll is
                useless or that both are finding the same local optimum. The curriculum page&rsquo;s per-move results
                are the stronger test, and they say the roll&rsquo;s ten i-frames are exactly what beats{" "}
                <code>combo</code>.</>),
            },
          ]}
        />
        <p>
          One more thing worth doing before moving on: switch to <strong>you have the controls</strong> and try to beat
          it yourself, then switch to <strong>watch: patient parry</strong> and compare. The scripted expert is
          unhurried and takes no damage at all. The network is frantic and finishes on 83.6 health. They reach the same
          win rate by genuinely different routes, and thirty seconds of watching makes that clearer than any table on
          this track.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/what-it-learned-about-delayed-attacks", label: <>← What it learned about delayed attacks</> }}
          next={{ href: "/learn/building-environments/sim-vs-the-real-game", label: <>Sim vs the real game →</> }}
        />
      </div>
    </article>
  );
}

const outCheck = `case: 505 states from dqn_2000k_s0

  ok   observation width 27 matches the manifest
  ok   action count 16 matches the manifest
  ok   the sixteen button labels are in the same order as the sixteen outputs
  ok   weights sha1 32d1fd3b2400 is the one torch recorded
  ok   308288 bytes, 77072 parameters
  ok   obs() agrees to 5.00e-10 over 13635 floats
       worst at state 123, v[21]: ts 0.7090908885002136 vs py 0.709090889
  ok   Q-values agree to 1.18e-5 over 8080 values
       worst at state 504, action 8: ts 32.59873580932617 vs py 32.598724
  ok   same button chosen 505/505
       mean margin between best and second-best Q: 0.065

OK -- the browser runs the same policy that scored 200/200.`;

const outProbe = `...and what the world did with those presses
--------------------------------------------
  A press is not an action. Section 1 of step() reads it only if you are not already
  committed, and the attack, roll and parry branches read it only if you can pay for
  it. Everything else is dropped on the floor. Per duel:

  button         presses  started   committed    too poor
  attack            33.3     7.00        23.3         3.1
  idle              29.0    24.22         4.8         0.0
  parry             16.8     4.73        11.3         0.8
  roll in           16.7     0.01        10.4         6.3
  move back         16.3     3.28        13.0         0.0
  move in           12.9    12.44         0.4         0.0
  move in-right     12.7     6.39         6.3         0.0
  move left         11.8     9.33         2.5         0.0
  roll back          5.1     0.00         3.5         1.6
  move back-left     3.6     1.78         1.9         0.0
  move right         3.6     2.97         0.6         0.0
  move in-left       1.6     1.49         0.1         0.0
  roll right         1.0     0.00         0.9         0.1
  guard              0.7     0.31         0.4         0.0

  check: the two columns the shipped log also counts, which must agree ->
    attack  started   7.00   log swings   7.00   ok
    roll    started   0.01   log rolls    0.01   ok

  Rolls are the extreme case: 23.0 presses a duel and 0.01 rolls started, because a
  roll costs 25 stamina and this policy has already spent it on attacks and parries.
  It is not choosing not to roll -- it is asking to, constantly, and being refused.`;

const outSpread = `32537 decisions over 200 duels of the trained net

                           p10   median     p90     max
  fan (best - worst)      0.20     0.84    5.35    9.50
  margin (best - 2nd)     0.00     0.03    0.19    2.27

  raw Q-values run from 15.4 to 35.9.
  The fan is the number that matters, and it is 6x wider at the 90th percentile
  than at the median, 27x wider than at the 10th. A scale recomputed inside each
  frame divides by exactly that, so a full-width bar stands for 0.84 of Q in a
  median frame and 5.35 in a wide one. There is no reading certainty off it.

bars reading as full (>= 90% of the track), out of 16:
  normalised per frame     median 4    mean 5.0
  ...its first 3 seconds   median 6    mean 5.8
  fixed +/-4 scale         median 0    mean 0.5

  31% of the panel pinned against the right-hand edge on an average frame is
  the visible symptom; the unreadable scale is the defect. A fixed scale clips 3%
  of bars instead, which is the price of being able to compare two frames at all.

what it presses, greedy, no exploration:
  attack           20.50%
  idle             18.69%
  parry            10.38%
  roll in          9.94%
  move back        9.72%
  move in          7.80%
  move in-right    7.48%
  move left        6.63%
  roll back        2.58%
  move right       2.31%
  move back-left   1.80%
  move in-left     1.01%
  roll right       0.68%`;
