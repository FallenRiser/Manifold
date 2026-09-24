import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { ShieldLab } from "@/components/fire/ShieldLab";

export const metadata = {
  title: "What the crew learned — Manifold",
  description:
    "The trained crew beats the fire chief. This page opens it up and asks what it is actually doing, and the answer is not firefighting: it aims at cells that are not on fire, throws water that hits nothing eleven to sixteen per cent of the time, and puts out less fire than any hand-written rule on the page. Two ablations show why that wins — take the wetting out of a drop and the crew falls behind the chief; slide its aim onto the nearest flame and the advantage disappears entirely. Then the uncomfortable part: in a hundred and fifty of the two hundred exam worlds the crew and the chief score identically, so the headline average is a claim about a quarter of the exam.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatTheCrewLearned() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 20 minutes"
        title={<>What the crew learned</>}
        intro={<>Two pages ago the crew{" "}
          <Link href="/learn/building-environments/training-the-crew" style={link}>won its race</Link>: 0.69, 0.69 and
          0.86 village cells lost against the guard chief&rsquo;s 1.11, paired on the same two hundred worlds. That
          sentence is the entire published result, and it says nothing whatever about what the crew <em>does</em>. This
          page flies the three trained networks back over the exam with a recorder attached, and finds a policy that
          would fail a job interview at any fire service: it aims at ground that is not burning, misses more often than
          it hits, and puts out less fire than every hand-written rule in this chapter. Then it takes that advantage
          apart twice, to find out which part of it was real.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>A score is not a policy</h2>
        <p>
          There is a habit worth naming before the measurements start. A trained agent arrives as a number, the number
          is compared to a baseline, and if it wins the project moves on. Nobody asks what the thing does, because the
          score is the deliverable and the behaviour is not.
        </p>
        <p>
          It is the wrong way round. The score is the part that does not transfer: it belongs to this world, this
          reward, these two hundred seeds. The behaviour is the part you would carry into the next world, and the part
          that tells you whether the win was a discovery or an accident of the exam. Everything below is measured with
          one command — the same trainer that produced the crews, flying them through the same shipped{" "}
          <code>Command</code> loop that scored them, with <code>env.step</code> wrapped so that every bucket is
          recorded at the moment it is thrown.
        </p>

        <PredictPrompt
          prompt="The crew loses a third fewer village cells than the best hand-written chief. Where do you expect it aims its water?"
          options={[
            "At the fire, like the chiefs, but at better bits of it",
            "At the fire nearest the village, only earlier",
            "Often at cells that are not on fire at all",
            "At the village itself, soaking it and waiting",
          ]}
          accent={GOLD}
          nudge="Locked in. The next table is one command's worth of output, and the bottom block of it answers this."
        />

        <h2>Watch every bucket</h2>
        <p>
          Three families of probe, all on the two hundred exam worlds. What happens in an episode; what each bucket is
          thrown at; what the commander names as a target and whether there is any fire there. The three chiefs are on
          the left for scale, the three trained crews on the right.
        </p>

        <CodeOutput source="scripts/wildfire_train.py">{outLearned}</CodeOutput>

        <p>
          Read the bottom block first, because it is the one that should not be there.{" "}
          <strong>Between 89% and 96% of the crew&rsquo;s decisions name a cell that is not on fire.</strong> The
          chiefs are at 100% on fire by construction — <code>nearest</code> and <code>guard</code> select from{" "}
          <code>np.argwhere(env.S == BURNING)</code>, so they could not do otherwise if they wanted to. Even{" "}
          <code>densest</code>, which is free to name any cell and picks the five-by-five square covering the most
          flame, lands on a burning cell a third of the time and within 0.9 cells of one. The crew aims 2.6 to 3.4
          cells away from the nearest flame, and on 34–44% of its decisions there is no burning cell inside its drop
          square at all.
        </p>
        <p>
          The rest of the probe is the same story told in different units. It hits <strong>3.4 to 4.2 cells a
          drop</strong> where the guard chief hits 5.1 and <code>densest</code> hits 7.5. Its buckets hit nothing at
          all 11–16% of the time, against 1–2% for every chief. It puts out less fire and throws roughly the same
          number of buckets. By every measure a fire service would put on a dashboard, this crew is the worst policy on
          the page — and it loses 0.69 village cells where the best chief loses 1.11, burns 70 cells where the chief
          burns 82, and finishes two steps sooner.
        </p>
        <Callout color={GOLD} title="One number in that table reconciles two pages">
          <p>
            The{" "}
            <Link href="/learn/building-environments/the-cobra-effect" style={link}>cobra page</Link> quotes a DQN crew
            paid for damage at 2.51 / 2.71 / 2.45 village cells, which is nowhere near the 0.69 / 0.69 / 0.86 above.
            Both are true and they are different crews. The cobra page&rsquo;s came from the build log, trained by the
            version of the script that ran one-step returns with a fifty-thousand-sample replay; the crews here came
            from the race, after the trainer gained n-step returns, a dueling head and a replay four times the size.
            The cobra page&rsquo;s comparison is internally fair — both of its arms are from that older trainer — and
            its finding is unaffected, which is why it has not been restated. The trainer stamps a version into every
            result file now, and <code>wildfire_train.py version</code> prints which copy you are holding, precisely
            because this confusion has already cost this chapter two Colab batches.
          </p>
        </Callout>

        <h2>A bucket does two things</h2>
        <p>
          The explanation is in five lines of <code>step()</code> that have been in the environment since the{" "}
          <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link>, and that nothing
          in this chapter has looked at closely:
        </p>
        <pre style={pre}><code>{`block[hit] = UNBURNT                                             # 1. put the fire out
self.timer[r0:r1, c0:c1][hit] = 0
self.M[r0:r1, c0:c1] = np.maximum(self.M[r0:r1, c0:c1], WET)     # 2. leave the square wet`}</code></pre>
        <p>
          A drop is two actions welded into one. It turns every burning cell under it back to unburnt — the part a crew
          would report — and it raises the moisture of the whole five-by-five square to <code>WET = 0.9</code>, which
          divides the ignition probability of every cell in it by ten and holds for many ticks, since moisture only
          dries at 0.01 a fire tick. The first half is worth something only where fire already is. The second half is
          worth most exactly where fire is <em>not yet</em>.
        </p>
        <p>
          Every hand-written chief in this chapter uses the first half deliberately and the second half by accident.
          The crew appears to be doing the opposite. That is a hypothesis, and this chapter has already been burned
          once by a tidy hypothesis — the{" "}
          <Link href="/learn/building-environments/the-cobra-effect" style={link}>cobra page</Link> had two of them and
          the measurements killed both — so it needs a test that could come out the other way.
        </p>

        <h2>Ablation one: take the wetting away</h2>
        <p>
          <code>WET</code> is read as a plain global inside <code>Wildfire.step</code>, so the whole ablation is one
          assignment. Set it to zero and <code>np.maximum(M, WET)</code> becomes a no-op: a bucket still un-burns every
          burning cell under it, and leaves nothing behind. Nothing else about the world changes. The chiefs are the
          control — they aim at fire, so if the wetting is merely a bonus for them they should barely notice.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeShield} />
        <CodeOutput>{outShield}</CodeOutput>

        <p>
          They notice. The guard chief goes from 1.11 village cells to 2.94 and from 82 burnt cells to 108 — the
          wetting it never asked for was worth more than half of its damage. So this is not a mechanism only the crew
          uses; it is a large part of what a bucket is worth to anybody. Which makes the trained crews&rsquo; version
          of the same table the interesting one:
        </p>

        <CodeOutput source="scripts/wildfire_train.py">{outShieldAll}</CodeOutput>

        <p>
          The crews lose <strong>2.57, 2.75 and 2.82</strong> village cells to the ablation where the guard chief loses
          1.82 and <code>densest</code> loses 0.77. And the direction of the whole chapter reverses: with no wetting,
          all three crews (3.26 / 3.45 / 3.69) finish <em>behind</em> the guard chief (2.94). Everything the crew had
          over the best hand-written rule, and a little more, was living in the half of the action that the rule was
          using by accident.
        </p>

        <Callout color={GOLD} title="What this ablation does not prove">
          <p>
            The crew was trained in a world where drops wet the ground and is being scored in a world where they do
            not. That is a policy run outside its distribution, and a distribution shift is enough on its own to make
            anything look bad. The honest reading is narrow: <em>this</em> crew, which learned to rely on wetting,
            collapses when wetting is removed. It is not evidence that the problem is unsolvable without it, and it is
            not evidence about what a crew <em>trained</em> in the dry world would do. That second run has not been
            made — it is a full million-step training on a machine with a GPU — and until it has, this page claims the
            narrow version. The next ablation is the one that does not have this problem.
          </p>
        </Callout>

        <h2>Ablation two: move only the aim</h2>
        <p>
          The second test changes nothing about the world and nothing about the network. It takes the crew&rsquo;s own
          chosen target and slides it onto the nearest burning cell — which is exactly where a chief would have aimed.
          Same weights, same observations, same worlds, same seeds. The only thing removed is the offset.
        </p>

        <CodeOutput source="scripts/wildfire_train.py">{outSnap}</CodeOutput>

        <p>
          The offset <em>is</em> the policy. Snapped onto the fire, the three crews score 1.14, 1.51 and 1.52 village
          cells against the guard chief&rsquo;s 1.11 — one of them is level with the chief and two are worse. Their
          returns fall from −75.4 / −76.1 / −80.6 to −85.6 / −92.5 / −88.4, which brackets the guard chief&rsquo;s
          −92.3, the bar the{" "}
          <Link href="/learn/building-environments/the-cobra-effect" style={link}>cobra page</Link> named. A network
          that has learned to pick good <em>regions</em> of the map is worth nothing once the last three cells of its
          choice are overruled by a rule that sounds obviously correct.
        </p>
        <p>
          It is worth being precise about what this does and does not establish, because it is easy to over-read.
          Snapping changes the target, the target changes where the helicopter flies, and from there the whole episode
          is different — so this is not a per-decision counterfactual and it cannot tell you what any single overrule
          cost. It answers a coarser question, which happens to be the one that matters:{" "}
          <strong>is a crew that aims like a chief still better than a chief?</strong> It is not.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Switch the condition to <em>aim snapped to the fire</em> and then to <em>a drop stops wetting</em>,
            and watch the three gold bars. Then switch to <em>where the win lives</em> and look at how much of the
            chart is empty.</>}
          insight={<>Two different ablations remove the same advantage, and the second one does it without touching the
            world. What the crew learned is not a better way to fight fire; it is <em>where to stand a wet square so
            that the fire never arrives</em>. And the second view is the sting: the average that the whole race was
            decided on is made almost entirely in a quarter of the exam.</>}
        >
          <ShieldLab />
        </LabFrame>

        <h2>Where does the win actually live?</h2>
        <p>
          The{" "}
          <Link href="/learn/building-environments/the-cobra-effect" style={link}>cobra page</Link> closed on a
          question it asked of a metric: is this number local? The same question belongs to an <em>advantage</em>. A
          mean gap of −0.42 village cells could be a small edge in every world, or a rout in a handful with nothing
          happening anywhere else. Those are different policies and they have the same headline.
        </p>

        <CodeOutput source="scripts/wildfire_train.py">{outWhere}</CodeOutput>

        <p>
          In <strong>142 to 150 of the 200 exam worlds the crew and the chief score exactly the same</strong> — nearly
          always zero, because both of them saved all nine houses. The entire difference is made in the fifty-odd
          worlds at the ends, and <strong>79% to 136% of the total gap comes from the ten best worlds alone</strong>.
          The third seed&rsquo;s figure is above one hundred per cent, which is not a typo: its ten best worlds are
          worth more than its whole advantage, and the rest of the exam is a net loss.
        </p>
        <p>
          And the crew is not uniformly better. It loses in 14 to 24 worlds, and in its worst one it gives up{" "}
          <strong>seven to nine more village cells</strong> than the chief would have. A fire service reading only the
          average would never know that the policy it just adopted has a failure mode that costs most of a village, in
          roughly one world in twenty. That is not an argument against the crew — the chief has bad worlds too — it is
          an argument against the average as the whole report.
        </p>
        <p style={{ fontSize: 14.5, color: "var(--muted)" }}>
          This is also why the{" "}
          <Link href="/learn/building-environments/training-the-crew" style={link}>race page</Link> paired every
          comparison on the same worlds rather than scoring the two policies separately. With 150 of 200 differences
          identically zero, a paired test is measuring only the worlds that can carry information, and an unpaired one
          is spending its whole error budget on the world-to-world spread of a quantity both policies agree about.
        </p>

        <h2>What it did not learn</h2>
        <p>
          The probe has three columns that are not flattering, and they are more interesting than the win.
        </p>
        <ul>
          <li>
            <strong>It does not close out a fire.</strong> With between one and six cells still alight — the endgame,
            where a single well-placed bucket ends the episode — the crew&rsquo;s target covers a burning cell only
            42–53% of the time. Every chief is at 100%. The crew finishes sooner anyway, at 42.7–46.3 steps against
            45.2, so this costs it little here; in a world where the last embers mattered it would be a real hole.
          </li>
          <li>
            <strong>It answers a threatened village about half the time.</strong> Counting decisions taken while fire
            burns within three and a half cells of the village centre, the crew responds on 51–64% of them where the
            guard chief responds on 100%. It faces about as many of those moments as the chief does — 1.4–1.9 against
            1.6 — so it is not preventing the crisis either. It is simply not a crisis responder, and it still loses
            fewer houses, because most of its work happened twenty steps earlier.
          </li>
          <li>
            <strong>Its water is not obviously aimed at the fire&rsquo;s edge.</strong> The natural version of the
            firebreak story is that the crew wets the cells the fire is about to reach. On the drops that hit nothing
            at all, the square contains 0.8 to 1.3 cells that are unburnt, flammable and touching a flame right now —
            more than the chiefs&rsquo; 0.0 to 0.2, but not a wall of them. Something in between is going on: 57–66% of
            its targets have no fire in the square when it names them, and only 11–16% of its drops land on nothing,
            so most of the gap is fire arriving in the square during the three or four steps the helicopter takes to
            get there. Whether that is anticipation or ambient spread, this page does not know — the control it would
            need is a matched target at the same distance from the same fire, and that has not been run.
          </li>
        </ul>

        <h2>Then why not just soak the village?</h2>
        <p>
          If a wet square is the mechanism, the laziest possible policy ought to work: park over the village, drop,
          refill, repeat. No learning, one line. It is worth running because it is the rule a reader is entitled to
          propose after everything above, and because the answer is instructive.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeSoak} />
        <CodeOutput>{outSoak}</CodeOutput>

        <p>
          On the column this chapter has been quoting all along, <strong>the lazy rule wins</strong>: 0.45 village
          cells against the crew&rsquo;s 0.69 and the chief&rsquo;s 1.11. It also lets 143 cells burn instead of 70,
          runs 73 steps instead of 43, and scores −145.8 against the crew&rsquo;s −75.4. It saves the village by
          ignoring the fire, and the reward we{" "}
          <Link href="/learn/building-environments/reward-is-a-values-decision" style={link}>chose on purpose</Link>{" "}
          charges it for every cell of forest that burns while it hovers. Moving the shield to the village&rsquo;s
          downwind edge — the version that sounds cleverer — is worse on every column at once.
        </p>
        <p>
          So the crew did not learn &ldquo;wet the village&rdquo;. It learned something with a moving part in it: where
          to put a wet square given this fire, this wind and this village, such that the village is defended{" "}
          <em>and</em> the fire still goes out. The one-line rule gets one of those and pays for it with the other.
          That is also the honest answer to a reader who suspects the whole result is a trick of the reward: the reward
          was published before the crew existed, the lazy rule is available to anyone, and it loses on it.
        </p>

        <Proof title="Why a wet cell is worth more than an extinguished one">
          <p>
            The ablations are empirical. There is also an arithmetic reason to expect the answer they gave, and it uses
            nothing but the reward and the spread rule. Under the shipped reward a cell is charged the moment it
            catches:
          </p>
          <MathBlock>{String.raw`R \;=\; -\,\mathrm{lit}\;-\;10\,\mathrm{village\_lit}`}</MathBlock>
          <p>
            Take one burning cell and put it out. The <M>{String.raw`-1`}</M> for it was charged on the tick it caught
            and is not refunded — <code>self.ever</code> records that it burned and <code>summary()</code> counts it
            forever. So extinguishing pays nothing directly at all. What it buys is the ignitions that cell will no
            longer cause: it has up to eight neighbours, each lit with probability{" "}
            <M>{String.raw`p = \mathrm{SPREAD}[T]\,(1-M)\,w\,s`}</M> per fire tick, and it would have burned for{" "}
            <M>{String.raw`\mathrm{BURN\_TIME}`}</M> more ticks.
          </p>
          <p>
            Now take the same bucket and land it on five-by-five of unburnt ground. Twenty-five cells have their
            moisture set to 0.9, so each one&rsquo;s <M>{String.raw`(1-M)`}</M> factor falls from about 0.85 to 0.1 —{" "}
            <strong>an 8.5-fold cut in the probability that any of them ever catches</strong>, and it decays at 0.01 a
            fire tick, so forty fire ticks later the square is still at moisture 0.5 and cutting ignition
            by about 40%. Every ignition prevented is a{" "}
            <M>{String.raw`-1`}</M> never charged, and an ignition prevented in the village is{" "}
            <M>{String.raw`-11`}</M> never charged.
          </p>
          <p>
            So the two halves of a drop are not comparable quantities. Extinguishing is a refund on a debt that has
            already been paid, claimed through a chain of prevented children; wetting is a debt that is never incurred,
            claimed directly, on twenty-five cells at once. The asymmetry is worth restating in the form that
            generalises: <strong>in a world where damage is charged at the moment it occurs and never uncharged, the
            value of an action lives in the futures it removes, not in the state it restores.</strong> That is exactly
            the quantity a hand-written rule which selects from{" "}
            <code>np.argwhere(env.S == BURNING)</code> cannot express, and it is the reason the{" "}
            <Link href="/learn/building-environments/pilot-or-commander" style={link}>commander page</Link> refused to
            shrink the action space to burning cells even though most of the 256 targets look useless.
          </p>
          <p>
            One caution against reading this as a proof of what the crew is doing. The arithmetic says a wet square is
            worth a great deal; it does not say the crew is placing its squares well, and a crew that placed them at
            random would also collapse under the wetting ablation. The snap test is what separates those two: a random
            placement would not lose its advantage when moved three cells onto the nearest flame, because it would not
            have one.
          </p>
        </Proof>

        <Callout color={GOLD} title="What this says about the cobra">
          <p>
            Put the two pages side by side. The{" "}
            <Link href="/learn/building-environments/the-cobra-effect" style={link}>bounty</Link> pays{" "}
            <code>+1</code> per burning cell turned back to unburnt, and it is the reward every instinct reaches for:
            dense, immediate, legible, the number a crew would report. The winning move in this world —{" "}
            <strong>a bucket thrown at ground that is not burning</strong> — earns that reward exactly zero. Not
            &ldquo;a little&rdquo;, not &ldquo;less than it deserves&rdquo;. Zero, on 11–16% of this crew&rsquo;s
            drops outright and partially on most of the rest, because the bounty pays only for the cells that happened
            to be alight under the square and never for the twenty-five it made hard to light.
          </p>
          <p>
            That is the cobra page&rsquo;s argument arriving from the other direction. It showed a bounty buying a
            crew that doubles its output and loses twice the village; this shows the same bounty being blind to the
            behaviour that actually wins. The general form: <strong>a reward that is easy to attribute pays for states
            restored, and the value in a coupled system is usually in futures removed.</strong> If your metric cannot
            express a good action, no amount of optimisation pressure will find it — it will find the best thing your
            metric <em>can</em> express, quickly and thoroughly, and hand it to you with a confident number attached.
          </p>
        </Callout>

        <h2>What to carry into the next world</h2>
        <p>
          World 2 is finished. It was planned, parameterised, coded, tested against rules that had to fail and a chief
          that had to succeed, and trained — and the last page of it is the one that found out what the training
          actually produced, which is the page that most projects skip.
        </p>
        <p>Three habits are worth taking to the boss fight, and all three cost less than the training run did.</p>
        <ol style={{ lineHeight: 1.75 }}>
          <li>
            <strong>Probe the behaviour, not just the score.</strong> One pass over the exam with a recorder attached
            produced the finding on this page, and it is the finding that transfers. It cost twenty-seven seconds.
          </li>
          <li>
            <strong>Ablate the thing you think is the mechanism.</strong> Two ablations, one that changes the world and
            one that changes only the action, and they agree. Neither needed retraining. If you cannot name an
            ablation that would remove your agent&rsquo;s advantage, you do not yet know what its advantage is.
          </li>
          <li>
            <strong>Look at the distribution of the gap before you quote the gap.</strong> An average over an exam can
            be made in a quarter of it, and the worlds where your agent is worse than the baseline are where the next
            piece of work is.
          </li>
        </ol>
        <p>
          The next world is a duel. It has no village to defend, no wind, and no fire — but it does have a reward that
          will be easy to attribute and a behaviour that will be hard to describe, and the questions on this page are
          the ones it will have to answer too.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-cobra-effect", label: <>← The cobra effect: pay per fire put out</> }}
          next={{ href: "/learn/building-environments/the-duel-brief", label: <>The brief: thirty seconds, one boss →</> }}
        />
      </div>
    </article>
  );
}

// Same shape as the `pre` in the-cobra-effect and the-reset-step-contract. The overflowX is the
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

const outLearned = `                                                 nearest           guard         densest          dqn s0          dqn s1          dqn s2

  episode
  village cells lost /9                             2.69            1.11            3.33            0.69            0.69            0.86
  all nine saved                                     66%             78%             56%             80%             82%             80%
  cells burnt                                       85.6            81.7            96.3            69.5            70.1            72.7
  steps                                             47.2            45.2            48.5            42.7            44.3            46.3
  ran out of time                                     0%              0%              0%              0%              0%              0%

  per drop
  buckets thrown                                    3.44            2.71            2.94            2.92            3.01            2.90
  first one at step                                  9.2            10.1            11.6             7.9             7.7             7.9
  cells hit per drop                                4.85            5.06            7.49            4.15            3.36            3.69
  drops that hit nothing                              2%              2%              1%             16%             11%             11%
  cells burning when it lands                       14.6            13.6            14.1            12.2            12.5            12.4
  cells on the fire's edge under it                  6.2             7.0             4.5             6.4             5.9             6.2
     ... on the drops that hit nothing               0.2             0.0             0.0             0.8             1.3             1.1
  distance from the village                          7.8             6.5             7.4             6.5             6.6             6.3
  drops touching the village                          9%             19%             16%             26%             22%             26%

  per decision
  decisions                                         13.2            12.3            13.6            12.0            12.4            12.5
  target is itself burning                          100%            100%             32%             11%              4%              6%
  drop square covers fire                           100%            100%            100%             66%             57%             56%
  cells to the nearest fire                          0.0             0.0             0.9             2.6             3.2             3.4
  target's distance from village                     8.1             7.4             7.5             7.1             7.1             6.1

  the endgame (1-6 cells alight)
  such decisions                                     5.4             5.0             5.7             5.6             5.8             5.8
  aimed at the last fire                            100%            100%            100%             53%             42%             42%

  the village threatened
  such decisions                                     3.2             1.6             3.7             1.6             1.4             1.9
  answered it                                        58%            100%             69%             64%             59%             51%`;

const codeShield = `# A bucket does two things at once. Take one of them away and re-run the exam.
# WET is the moisture a drop leaves behind; set it to 0 and np.maximum(M, WET) becomes a no-op,
# so a drop still un-burns every burning cell under it and no longer wets the square it lands on.
print(f"  {'chief':10s}{'a drop':>14}{'village':>10}{'burnt':>8}{'return':>9}")
for mode in ("guard", "nearest", "densest"):
    for tag, wet in (("as shipped", 0.9), ("no wetting", 0.0)):
        WET = wet
        s = command(dispatcher(mode), n=200, K=4)
        print(f"  {mode:10s}{tag:>14}{s['village_damaged']:10.2f}{s['burnt']:8.1f}{s['ret']:9.1f}")
WET = 0.9                                     # put the world back`;

const outShield = `  chief             a drop   village   burnt   return
  guard         as shipped      1.11    81.7    -92.3
  guard         no wetting      2.94   108.3   -156.9
  nearest       as shipped      2.69    85.6   -111.6
  nearest       no wetting      3.85   108.5   -157.8
  densest       as shipped      3.33    96.3   -129.9
  densest       no wetting      4.10   116.4   -173.2`;

const outShieldAll = `  nearest                village  2.69 ->  3.85  (+1.17 +/-0.40)   burnt   85.6 ->  108.5
  guard                  village  1.11 ->  2.94  (+1.82 +/-0.45)   burnt   81.7 ->  108.3
  densest                village  3.33 ->  4.10  (+0.77 +/-0.32)   burnt   96.3 ->  116.4
  dqn_values_1M_s0       village  0.69 ->  3.26  (+2.57 +/-0.51)   burnt   69.5 ->  108.5
  dqn_values_1M_s1       village  0.69 ->  3.45  (+2.75 +/-0.53)   burnt   70.1 ->  116.3
  dqn_values_1M_s2       village  0.86 ->  3.69  (+2.82 +/-0.52)   burnt   72.7 ->  117.8`;

const outSnap = `  guard                   1.11 village    -92.3 return
  nearest                 2.69 village   -111.6 return
  dqn_values_1M_s0        0.69 village    -75.4 return    69.5 burnt
  dqn_values_1M_s0 snapped  1.14 village    -85.6 return    75.0 burnt
  dqn_values_1M_s1        0.69 village    -76.1 return    70.1 burnt
  dqn_values_1M_s1 snapped  1.51 village    -92.5 return    77.5 burnt
  dqn_values_1M_s2        0.86 village    -80.6 return    72.7 burnt
  dqn_values_1M_s2 snapped  1.52 village    -88.4 return    73.6 burnt`;

const outWhere = `  crew                      worlds better    same   worse      gap  top-10 share  worst world
  dqn_values_1M_s0                     34     142      24    -0.42          81%         +7.0
  dqn_values_1M_s1                     36     150      14    -0.42          79%         +9.0
  dqn_values_1M_s2                     31     147      22    -0.25         136%         +9.0`;

const codeSoak = `# If wetting is what wins, why not just stand over the village and keep it wet? One rule, no learning.
def soak(env):
    return int(np.argwhere(env.T == VILLAGE)[4] @ [N, 1])      # always the village's centre cell

def wet_ring(env):                                             # the village, and its downwind edge
    v = np.argwhere(env.T == VILLAGE).mean(0)
    step = np.array([-np.cos(env.wdir), np.sin(env.wdir)]) * 2
    r, c = np.clip(np.round(v + step), 0, N - 1).astype(int)
    return int(r * N + c)

print(f"  {'rule':22s}{'village':>9}{'burnt':>8}{'steps':>8}{'drops':>8}{'return':>9}")
for name, pick in (("guard chief", dispatcher("guard")),
                   ("soak the village", soak),
                   ("soak its downwind edge", wet_ring)):
    s = command(pick, n=200, K=4)
    print(f"  {name:22s}{s['village_damaged']:9.2f}{s['burnt']:8.1f}{s['steps']:8.1f}{s['drops']:8.2f}{s['ret']:9.1f}")`;

const outSoak = `  rule                    village   burnt   steps   drops   return
  guard chief                1.11    81.7    45.2    2.71    -92.3
  soak the village           0.45   142.7    73.0    4.54   -145.8
  soak its downwind edge     2.50   143.1    72.1    4.38   -167.0`;
