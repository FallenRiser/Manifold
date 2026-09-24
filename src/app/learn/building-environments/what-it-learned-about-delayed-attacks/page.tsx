import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "What it learned about delayed attacks — Manifold",
  description:
    "The brief promised that the held windups are the hard part. Here is the probe that answers it — when does a policy press, measured in frames before the hitbox, per move — and the fact it turned up on the way: for both delayed attacks, the parry window is inside the hold.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DelayedAttacks() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 14 minutes"
        title={<>What it learned about delayed attacks</>}
        intro={<>The brief made three promises and this page pays the first: that the attacks which hold a
          finished-looking windup are the hard part of this world. Paying it properly means deciding, in advance, what
          evidence would count — which turns out to be a single column of numbers, and which turned up something nobody
          had noticed about the parry.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What would count as evidence</h2>
        <p>
          &ldquo;It learned to wait&rdquo; is not measurable. Here is a version that is.
        </p>
        <div style={brief}>
          When a policy presses a defensive button, how many frames away is the hitbox? A policy that reads the
          animation clock presses at the same notice for every attack. A policy that reacts to the raised weapon presses
          early on exactly the two attacks that hold the pose.
        </div>
        <p>
          That is a single column, it is the same probe for a network and for a hand-written player, and it has a
          predicted value before anything is run: the scripted experts are <em>built</em> to press at a fixed notice, so
          their column should be flat by construction. If the probe cannot show that, the probe is wrong and nothing
          else on this page means anything.
        </p>
        <CodeOutput source="scripts/boss_train.py">{outExpert}</CodeOutput>
        <p>
          It is flat: <strong>4.0, 4.1, 4.0, 4.0, 4.0</strong>. The delayed attacks — <code>heavy</code> with eight
          frames of hold and <code>slam</code> with twelve — get pressed at the same notice as the two attacks with no
          hold at all, and every press lands inside the window. That is what &ldquo;it reads the clock&rdquo; looks like
          as a table, and it is the reference the trained policy gets compared against.
        </p>
        <p>
          The second expert, which rolls sideways instead of parrying, presses at a notice of 7 to 8 frames — also flat
          across moves, and also right: a roll has a wider window and needs more warning because it moves you.
        </p>

        <h2>The thing the probe turned up</h2>
        <p>
          Look at the phase breakdown under the expert&rsquo;s table. During the boss&rsquo;s <em>windup</em> frames it
          presses parry on 7% of its decisions. During the <em>delay</em> frames it presses parry on{" "}
          <strong>30%</strong> of them. That is a four-fold difference, and it is not because the delay is dangerous.
          It is arithmetic:
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeWindow} />
        <CodeOutput source="scripts/boss_cases.py">{outWindow}</CodeOutput>
        <p>
          For both attacks that hold, <strong>the moment you have to press the parry is inside the hold</strong>. The
          hitbox on <code>heavy</code> goes live on frame 28; the press has to land between frames 21 and 25; and the
          hold runs from 20 to 27. Every correct press on that move happens while the boss is standing perfectly still
          doing nothing.
        </p>
        <Callout color={GOLD} title={<>&ldquo;Wait out the delay&rdquo; is exactly the wrong advice</>}>
          <p style={{ margin: 0 }}>
            The folk wisdom for a delayed attack is to do nothing until it finally comes. For a player who dodges, that
            is right. For a player who parries, the delay is <em>not</em> dead time to be survived — it is the window,
            and the correct behaviour is to act in the middle of it. Nobody designed that. It fell out of putting the
            parry&rsquo;s five frames and the moveset&rsquo;s segment lengths in a table and then measuring what a
            frame-accurate player does, and it is the second time in this world that two numbers written on different
            pages have turned out to determine a mechanic between them — the first being the{" "}
            <Link href="/learn/building-environments/curriculum-one-move-then-the-set" style={link}>combo and the
            i-frame window</Link>.
          </p>
        </Callout>

        <h2>Why a pass here is weaker evidence than it looks</h2>
        <p>
          Before any trained result: the honest caveat, which the{" "}
          <Link href="/learn/building-environments/what-the-agent-sees" style={link}>observation page</Link> already
          made. The agent is handed <code>v[18] = phase is DELAY</code>, and it is handed the move identity and the
          animation frame, which determine the phase anyway. So a policy that presses at a constant notice has not
          necessarily learned anything about held windups — it may simply have learned to read a counter that the
          environment gives it for nothing.
        </p>
        <p>
          That does not make the measurement pointless. Pressing at a constant notice is still a non-trivial thing to
          learn from a reward signal alone, and pressing early on the two moves that look finished is a real failure:
          the{" "}
          <Link href="/learn/building-environments/stamina-and-the-perfect-guard-window" style={link}>timing
          sweep</Link> shows that a single press placed outside the band takes every hit in the duel. Whether a policy
          that presses <em>repeatedly</em> pays the same penalty is a different question, and it is the one the
          measurement below turns out to answer. But it does mean the sentence this world can honestly support is
          narrower than the brief&rsquo;s.
        </p>
        <Proof title="the experiment that would actually settle it, and its cost" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            Mask <code>v[11]</code> through <code>v[20]</code> down to a single &ldquo;a move is out&rdquo; flag, so the
            agent sees that the boss is attacking and not which attack or how far in. The phase now has to be inferred
            from history, which means a recurrent policy or a stack of past observations — and the delay becomes a
            genuine inference problem rather than a lookup.
          </p>
          <p style={{ margin: 0 }}>
            Then run the probe again. If the notice column stays flat, the policy has learned to time an attack it
            cannot directly see, which is the claim the brief was reaching for. <strong>This has not been run.</strong>{" "}
            It needs a second observation mode in the shipped environment, a recurrent network, and three seeds per arm,
            and it would stale nothing else because the masking is a wrapper rather than a change to the world. It is
            the single most interesting piece of unfinished work in this world.
          </p>
        </Proof>

        <h2>The trained duellist</h2>
        <p>
          It wins two hundred duels out of two hundred. And on this probe it fails, in exactly the way the probe was
          built to detect.
        </p>
        <CodeOutput source="scripts/boss_train.py">{outTrained}</CodeOutput>
        <p>
          The column is <em>not</em> flat. Against the three attacks with no hold it presses at a median notice of 4 to
          5 frames, close to the expert. Against the two that hold, the median slips to <strong>6</strong> and the mean
          blows out to <strong>9.1 and 11.0</strong> — a long tail of presses made far too early — and the share landing
          inside the usable band falls from 59&ndash;73% to <strong>49% and 45%</strong>. The two delayed attacks are
          measurably the ones it handles worst, which is the brief&rsquo;s promise confirmed. What it did about them is
          not what the brief predicted.
        </p>
        <p>
          It did not learn to wait. It learned to <strong>press more often</strong>. Over the same two hundred duels the
          network makes 925 and 1051 defensive presses against <code>heavy</code> and <code>slam</code> where the expert
          makes 465 and 496 — about twice as many — and it presses parry on <strong>44%</strong> of its delay-frame
          decisions against the expert&rsquo;s 30%. Across all five moves it presses about 15.4 times a duel and lands
          4.63 parries: a conversion rate near <strong>30%</strong>, against the expert&rsquo;s 8.6 presses and 8.56
          parries, which is essentially <strong>100%</strong>.
        </p>
        <Callout color={GOLD} title={<>A worse method that reaches the same result</>}>
          <p style={{ margin: 0 }}>
            This is a real strategy, not a bug. A parry costs fifteen stamina — the cheapest action in the world — and
            missing one is only punished if the hitbox arrives while you are committed. So repeatedly throwing out a
            cheap defensive option through a long hold is <em>affordable</em>, and it converts a timing problem into a
            volume problem. It gets 200 wins from 200, and it pays for them with the 0.85 hits a duel the expert never
            takes. The world did not ask for patience specifically; it asked for damage taken to be low and damage dealt
            to be high, and brute force satisfies that at a small, survivable cost.
          </p>
        </Callout>
        <p>
          So the honest verdict on the brief&rsquo;s first promise: <strong>the delayed attacks are the hard part —
          they are where the policy&rsquo;s timing is worst by every measure on this table — and the policy did not
          solve them by waiting.</strong> It solved them by spending a cheap resource repeatedly until one press landed.
          A page that only reported the win rate would have called this &ldquo;it learned to parry&rdquo; and been
          wrong about the thing the world was built to study.
        </p>
        <p>
          It also sharpens why the masked-observation ablation is the experiment that matters. The brute-force
          answer is available <em>because</em> the policy knows a hitbox is coming and roughly when; strip the frame
          counter and pressing early stops being a cheap bet and starts being a guess.
        </p>

        <h2>The ablation, run</h2>
        <p>
          <code>obs()</code> hands the network the boss&rsquo;s animation state outright: which move is out, how far
          into it, which segment, its reach, its arc, and whether that hitbox covers you right now. Fourteen of the
          twenty-seven floats. The masked view replaces all fourteen with a single flag &mdash; <em>a move is
          out</em> &mdash; and nothing else, so a held windup and the delay that follows it become identical from a
          single frame. Checked before training rather than assumed: on a real <code>heavy</code> at frame 18 versus
          frame 24, the full view differs in <strong>5 of 27</strong> floats including the frame counter and the
          two phase flags; the masked view differs in <strong>2 of 15</strong>, both incidental (distance and the
          clock). Two arms, 2,000,000 decisions each, seed 0, every other hyperparameter identical to the run that
          scored 200/200.
        </p>

        <CodeOutput source="scripts/boss_train.py">{outAblate}</CodeOutput>

        <p>
          <strong>Strip the animation state and the duellist falls from 200/200 to 96/200.</strong> Roughly half of
          what looked like skill was the observation doing the work. That is the headline, and it is the answer to
          the question this page has been asking since the brief: a large part of the delayed-attack lesson was
          handed over, not learned.
        </p>

        <Callout color={GOLD} title={<>The statistic needed its own control, and nearly fooled me</>}>
          <p>
            TV is how differently a policy behaves during a delay than during a windup &mdash; two phases that look
            identical and differ only in what comes next. The full-view net scores <strong>0.49</strong> and the
            masked one <strong>0.18</strong>, which reads like &ldquo;the full one understands timing.&rdquo; But
            look at the last row: <code>patient parry</code>, the hand-written player that reads the animation clock
            directly and provably <em>does</em> understand the timing, scores only <strong>0.22</strong>.
          </p>
          <p>
            So a high TV is not a measure of understanding. The full net&rsquo;s 0.49 comes from parrying 44% of the
            time during a delay against 13% during a windup &mdash; which is exactly what you would do if you were
            reading <code>v[18] = phase is DELAY</code> off the input, and requires no model of time at all. The
            number that was supposed to detect the skill is equally well explained by the shortcut. Without the
            scripted control in the same table I would have reported it the other way round.
          </p>
        </Callout>

        <p>
          The more telling column is <em>notice</em> &mdash; how many frames before the hitbox the policy commits to
          a defensive action. The full-view net acts at <strong>10.1 frames</strong> on the delayed attacks; the
          masked one acts at <strong>17.0</strong>. It does not wait longer and guess, it bails <em>earlier</em>:
          26% of its windup decisions are a roll, against the full net&rsquo;s parry-heavy pattern. Unable to tell a
          windup from a delay, it stops trying to time anything and leaves the area. That is a coherent policy, and
          it wins 96 duels out of 200 with it.
        </p>

        <Callout color={GOLD} title={<>What this experiment did not establish</>}>
          <p>
            Two things, and both matter more than the headline. First, the mask removes <em>fourteen</em> floats,
            not just the two phase flags &mdash; move identity, reach, arc and &ldquo;covering you now&rdquo; go
            with them. So 200&nbsp;&rarr;&nbsp;96 is the cost of losing all animation state, and it does not isolate
            the delay flag on its own. A surgical version that drops only <code>v[17..20]</code> is the follow-up.
          </p>
          <p>
            Second, the memory arm <strong>failed</strong>. The plan was that <code>--stack 16</code> would let
            timing be recovered from history, since a delay is only distinguishable from a windup by how long it has
            been going. That arm won <strong>zero</strong> evaluation duels at <em>every</em> checkpoint across
            2,000,000 decisions and ended swinging 0.11 times a duel &mdash; it learned to stand still. Its TV of
            0.35 is therefore noise from a degenerate policy and must not be read as timing discrimination. Sixteen
            stacked frames is 240 inputs against 27, on identical hyperparameters, and DQN with this learning rate
            and buffer did not train it. <strong>Whether memory can recover the lesson is still unanswered</strong>,
            and answering it needs a rerun tuned for the wider input, not a re-reading of this one.
          </p>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments/the-turtle", label: <>← The turtle: reward hacking a duel</> }}
          next={{ href: "/learn/building-environments/watch-it-fight", label: <>Watch it fight &rarr;</> }}
        />
      </div>
    </article>
  );
}

const codeWindow = `# Where does the parry window actually SIT inside each attack?
# You must press so the hitbox lands on your parry frames PAR_I0..PAR_I1.
print("move     hitbox at   press on frames   which the boss spends...")
for m in MOVES:
    acc, first = 0, None
    for kind, n in m["seg"]:
        if kind == "h":
            first = acc
            break
        acc += n
    lo, hi = first - PAR_I1, first - PAR_I0
    spent = []
    for f in range(lo, hi + 1):
        k = {"w": "winding up", "d": "HOLDING THE DELAY", "h": "attacking", "r": "recovering"}[
            phase_at(m, f)[0]]
        if k not in spent:
            spent.append(k)
    print("%-8s %9d %12d-%-4d %s" % (m["name"], first, lo, hi, " and ".join(spent)))`;

const outWindow = `move     hitbox at   press on frames   which the boss spends...
slash           14            7-11   winding up
thrust          18           11-15   winding up
heavy           28           21-25   HOLDING THE DELAY
slam            36           29-33   HOLDING THE DELAY
combo           12            5-9    winding up`;

const outExpert = `patient parry (the ceiling)
---------------------------
  move                 defensive presses    notice, in frames to the hitbox
                                          mean   median   inside 3-12
  slash                        242         4.0       4         100%
  thrust                       246         4.1       4         100%
  heavy   (delayed)            465         4.0       4         100%
  slam    (delayed)            496         4.0       4         100%
  combo                        264         4.0       4         100%
  (100% of those presses were made while the attack could actually have reached it,
   so this is not a policy pressing buttons at a safe distance.)
  what it presses, by the phase the boss is in:
    windup     10159 decisions   idle 70%   move back 22%   parry 7%
    DELAY       3218 decisions   idle 61%   parry 30%   move back 9%
    active       577 decisions   move back 50%   idle 50%   move in-right 0%

sidestep, punish (the best non-parrier)
---------------------------------------
  move                 defensive presses    notice, in frames to the hitbox
                                          mean   median   inside 3-12
  slash                        394         7.5       8         100%
  thrust                       411         7.9       8         100%
  heavy   (delayed)            754         7.8       8         100%
  slam    (delayed)            786         7.4       8         100%
  combo                        795         6.9       7         100%
  (100% of those presses were made while the attack could actually have reached it,
   so this is not a policy pressing buttons at a safe distance.)
  what it presses, by the phase the boss is in:
    windup     11311 decisions   idle 56%   move back 27%   roll right 16%
    DELAY       3224 decisions   idle 53%   roll right 20%   roll left 16%
    active      2420 decisions   move back 51%   idle 48%   roll right 1%
    recovery   14272 decisions   idle 66%   move back 24%   attack 8%`;

const outTrained = `the trained duellist (dqn_2000k_s0)
-----------------------------------
  move                 defensive presses    notice, in frames to the hitbox
                                          mean   median   inside 3-12
  slash                        447         5.2       5          73%
  thrust                       246         4.1       4          59%
  heavy   (delayed)            925         9.1       6          49%
  slam    (delayed)           1051        11.0       6          45%
  combo                        407         4.6       5          68%
  (99% of those presses were made while the attack could actually have reached it,
   so this is not a policy pressing buttons at a safe distance.)
  what it presses, by the phase the boss is in:
    windup      7283 decisions   idle 19%   move left 13%   parry 13%
    DELAY       2260 decisions   parry 44%   move in 21%   attack 11%
    active       668 decisions   parry 26%   attack 19%   move back-left 16%
    recovery    2024 decisions   move back 23%   idle 12%   attack 12%`;

const brief: React.CSSProperties = {
  borderLeft: "3px solid var(--c-rl)",
  background: "color-mix(in srgb, var(--c-rl) 7%, transparent)",
  padding: "14px 18px",
  borderRadius: "0 8px 8px 0",
  fontFamily: "var(--font-display)",
  fontSize: 17.5,
  lineHeight: 1.5,
  color: "var(--ink)",
  margin: "1rem 0 1.2rem",
};

const outAblate = `the delayed attack: learned, or handed over?
--------------------------------------------
  200 held-out duels each. heavy and slam hold a finished-looking windup for 8 and 12
  frames; the other three do not. TV is how differently a policy behaves during a delay
  than during a windup -- 0.00 means it cannot tell the two apart.

  arm                                 win  die  bossHP     TV notice: delayed    plain
  dqn_2000k_s0                        200    0   -12.1   0.49     10.1      4.7
  dqn_2000k_s0_masked_x1               96  104    21.6   0.18     17.0      6.6
  dqn_2000k_s0_masked_x16               0  187   239.3   0.35     18.0      7.3
  patient parry                       200    0   -12.0   0.22      4.0      4.0

what each one presses, windup versus delay
------------------------------------------

  dqn_2000k_s0 -- full x1 (27 floats in)
    windup      7283 decisions   idle 19%   move left 13%   parry 13%
    DELAY       2260 decisions   parry 44%   move in 21%   attack 11%
    TV(windup, delay) 0.487

  dqn_2000k_s0_masked_x1 -- masked x1 (15 floats in)
    windup      6361 decisions   roll left 26%   attack 10%   move left 9%
    DELAY       1757 decisions   roll left 18%   attack 14%   guard 11%
    TV(windup, delay) 0.185

  dqn_2000k_s0_masked_x16 -- masked x16 (240 floats in)
    windup      7581 decisions   move in-right 32%   roll in 13%   move back-left 12%
    DELAY       2092 decisions   move back-left 21%   move in-right 18%   move left 17%
    TV(windup, delay) 0.355

  patient parry -- hand-written, reads the clock directly
    windup     10159 decisions   idle 70%   move back 22%   parry 7%
    DELAY       3218 decisions   idle 61%   parry 30%   move back 9%
    TV(windup, delay) 0.225`;
