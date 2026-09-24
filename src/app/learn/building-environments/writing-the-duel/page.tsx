import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Writing step(), section by section — Manifold",
  description:
    "The duel has been planned and parameterised; now it gets written. Six numbered sections in a fixed order, three lines whose cost is measured rather than asserted, and a step() you assemble yourself and check frame for frame against the shipped one.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WritingTheDuel() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 18 minutes"
        title={<>Writing <code>step()</code>, section by section</>}
        intro={<>Three pages of design decisions have to become one function. This is that function, written out in
          the order it runs, with the three lines that a reader is most likely to write differently priced rather than
          asserted. At the end you assemble the whole of <code>step()</code> yourself and check it against the shipped
          world frame for frame — which is the only way to know that reading it was the same as understanding it.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Six sections, and the order is the design</h2>
        <p>
          <code>step()</code> advances the duel by exactly one frame — a thirtieth of a second — and it does six things
          in a fixed sequence. The sequence is not incidental. Almost every rule this world has that could be called
          &ldquo;feel&rdquo; is a consequence of which section runs before which.
        </p>
        <ol style={{ lineHeight: 1.8 }}>
          <li><strong>Read the button</strong> — but only if you are not already committed to something.</li>
          <li><strong>Move the player</strong> — walking, or the fixed arc of a roll.</li>
          <li><strong>Let the boss decide</strong> — count its cooldown, turn to face you, close, commit to a move.</li>
          <li><strong>Advance its animation</strong> — its aim, and its hitbox if this is an active frame.</li>
          <li><strong>Resolve your own hitbox</strong> — and, if it is not a riposte, spend its poise.</li>
          <li><strong>Tick every clock</strong>, decide whether the duel ended, and price the frame as a reward.</li>
        </ol>
        <p>
          Two orderings are load-bearing and worth naming now. <strong>The boss swings before you do</strong> (4 before
          5), and the consequence is sharper than &ldquo;it gets there first&rdquo;: when its hit lands,{" "}
          <code>_boss_hits</code> sets <code>self.pa = A_IDLE</code>, so by the time section 5 asks{" "}
          <code>if self.pa == A_ATK</code> the answer is no. Your swing is not merely late — it is{" "}
          <strong>cancelled</strong>. There is no trade in this world. You can only win an exchange by not being in
          one, which is why every player on the ladder that attacks into an attack sits at the bottom of it. And{" "}
          <strong>the reward is computed last</strong> (6), against health values captured on the first line, so a
          frame is priced by what it changed rather than by what it intended.
        </p>

        <h2>1 — the button, and the line that makes this a Soulslike</h2>
        <p>
          The whole of section 1 sits under one guard:
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeGuardLine} />
        <CodeOutput>{outGuardLine}</CodeOutput>
        <p>
          If you are mid-attack, mid-roll, mid-parry or in hitstun, the button you pressed is{" "}
          <strong>discarded</strong>. Not queued, not buffered — read and thrown away. That single line is most of the
          difference between this and a twin-stick shooter, and it is what makes a mistimed press a real cost rather
          than a slight delay.
        </p>
        <PredictPrompt
          accent={GOLD}
          prompt={<>Across a whole duel, what fraction of a good player&rsquo;s decisions are made while it is already
            committed, and therefore read and thrown away?</>}
          options={["Almost none — a good player presses when it can act",
                    "Around a tenth",
                    "Around a third",
                    "Around half"]}
        />
        <CodeOutput source="scripts/boss_cases.py">{outCommit}</CodeOutput>
        <p>
          Between a third and two thirds, depending on what the player does — and the number is a property of the{" "}
          <em>strategy</em>, not of the world. That is the first sign that this is a game about timing: the sidestepper
          and the parrier are both good and they sit eleven points apart, which is nowhere near enough to explain the
          forty-three-point gap in their scores. What separates them is <em>when</em> that committed time falls, not how
          much of it there is.
        </p>

        <h2>2 and 3 — moving, and the boss&rsquo;s own clock</h2>
        <p>
          Section 2 is four lines and one number worth arguing about: a guarding player moves at{" "}
          <strong>55%</strong> speed. That is the shield&rsquo;s real price — not the chip damage, which the{" "}
          <Link href="/learn/building-environments/stamina-and-the-perfect-guard-window" style={link}>stamina page</Link>{" "}
          showed is small, but the fact that you cannot reposition while holding it. A roll, by contrast, moves along a
          direction fixed when it started: <code>ROLL_DIST / ROLL_I1</code> per frame, so it always covers the same
          ground regardless of what you press during it.
        </p>
        <p>
          Section 3 is the boss&rsquo;s turn, and it is written as a chain of exclusions. If it is staggered, it does
          nothing but count down. Otherwise, if it has no move out, it counts its cooldown, turns toward you at the
          idle turn rate, closes if you are beyond <code>ENGAGE</code>, and only then — cooldown finished and you inside
          engage range — commits to a move. Committing is the one irreversible thing it does, and the{" "}
          <Link href="/learn/building-environments/a-moveset-as-a-state-machine" style={link}>moveset page</Link>{" "}
          covers how it chooses.
        </p>

        <h2>4 — animation, aim, and a hitbox that fires once</h2>
        <p>
          A windup frame lets the boss keep turning, slowly, so a small sidestep during a windup is tracked and a large
          one is not. Then the hitbox, which is three conditions deep and whose third one is easy to leave out:
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeOnce} />
        <CodeOutput>{outOnce}</CodeOutput>
        <p>
          <code>slam</code> is active for five consecutive frames. Without <code>seg != self.b_seg_done</code>, all five
          would connect — because the test is run once per frame and nothing else would stop it. Here is what that
          missing guard would cost, against a player who has a hundred health:
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outOnceTable}</CodeOutput>
        <p>
          Two of the five moves would kill outright from full health — <code>heavy</code> at 136 and{" "}
          <code>slam</code> at 150 — and the cheapest of them, <code>thrust</code>, would still take 44 of your 100. It
          is also the reason the guard compares against a <em>segment index</em> rather than setting a boolean:{" "}
          <code>combo</code> has two
          separate active segments and is supposed to hit twice, for 14 each. A boolean would silently collapse it into
          a single 14-damage poke and quietly delete the one attack that,{" "}
          <Link href="/learn/building-environments/curriculum-one-move-then-the-set" style={link}>as the curriculum
          page found</Link>, is the hardest in the set.
        </p>

        <h2>5 — your hitbox, and two lines whose order is worth 29%</h2>
        <p>
          Your attack is simpler than the boss&rsquo;s: one reach test, no arc, one active window. The interesting part
          is four lines at the bottom of it.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeOrder} />
        <CodeOutput>{outOrder}</CodeOutput>
        <p>
          <code>mult</code> is read <em>before</em> poise is spent, and the poise is spent in the <code>else</code>{" "}
          branch. So the hit that breaks the boss&rsquo;s poise lands for ordinary damage, and the riposte is the{" "}
          <strong>next</strong> swing — meaning a poise break is only worth anything if you follow it up. Swap those
          two lines and a break pays for itself immediately:
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outOrderTable}</CodeOutput>
        <Callout color={GOLD} title={<>A one-line reordering, and a different game</>}>
          <p style={{ margin: 0 }}>
            Twenty-nine per cent more damage for the best non-parrying player on the ladder, from moving one assignment
            above another. That is not a bug that was avoided; it is a <em>design decision</em> that happens to be
            expressed as line ordering, and it is the kind of thing that is almost impossible to find by reading. It was
            found by writing the counterfactual down and pricing it.
          </p>
        </Callout>

        <h2>6 — clocks, and the five things step() hands back</h2>
        <p>
          The last section ticks everything that counts down — poise regen, your animation frame, hitstun, the stamina
          regen lock, the duel clock — and then answers the two questions the{" "}
          <Link href="/learn/building-environments/terminated-vs-truncated" style={link}>terminated-vs-truncated
          page</Link> insisted be answered separately. Someone died: <code>terminated</code>. The clock ran out:{" "}
          <code>truncated</code>. The <code>timeout=&quot;defeat&quot;</code> option converts the second into the first,
          which is the one line in this world that changes what running out of time <em>means</em>.
        </p>

        <h2>Write it out, and prove you were right</h2>
        <p>
          Here is the exercise the whole page exists for. Below is <code>step()</code> written out in full, subclassing
          the shipped <code>Duel</code> so that <em>only</em> <code>step()</code> differs — reset, the helpers, the
          reward and the observation are all inherited. Then both are stepped side by side on the same seeds with the
          same buttons, and every state field, every reward, every one of the twenty-seven observation floats and every
          log counter is compared on every frame.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeAssemble} />
        <CodeOutput>{outAssemble}</CodeOutput>
        <p>
          Zero. Not &ldquo;close&rdquo;, not &ldquo;within tolerance&rdquo; — the same arithmetic in the same order
          produces the same floats. That is the standard worth holding a port to, and it is the same standard the{" "}
          <Link href="/learn/building-environments/sim-vs-the-real-game" style={link}>TypeScript arena</Link> is held to
          by <code>scripts/boss_port_check.mjs</code>.
        </p>
        <DecisionPoint
          accent={GOLD}
          question={<>You want to add a dodge that gives i-frames on a <em>parry</em> as well as a roll. Where in{" "}
          <code>step()</code> does it go?</>}
          options={[
            {
              label: "In _boss_hits, where the incoming hit is already resolved",
              verdict: "best",
              response: (<>Right. Every &ldquo;what happens when the boss connects&rdquo; rule already lives in one
                helper, called from section 4, and that is why the roll&rsquo;s i-frames, the block, the parry and the
                guard break are all one readable cascade rather than four scattered conditions. New defensive rules go
                where the existing ones are.</>),
            },
            {
              label: "In section 1, by refusing the button when a hitbox is incoming",
              verdict: "miss",
              response: (<>This makes the world read the future to decide whether a press is legal, which means the
                player can no longer be wrong. The whole difficulty of this world is that you commit before you know.</>),
            },
            {
              label: "In section 5, beside the player's own hitbox",
              verdict: "miss",
              response: (<>Section 5 is your offence. Putting a defensive window there would run it after the boss has
                already resolved its hit in section 4 — one frame too late, every time.</>),
            },
            {
              label: "In section 6, by undoing the damage if the parry window was open",
              verdict: "close",
              response: (<>It would work, and it is how a surprising amount of real game code is written. But undoing
                something a previous section did means two places now encode one rule, and the log counters incremented
                in section 4 would already be wrong.</>),
            },
          ]}
        />
        <Proof title="why the reward is computed from a snapshot taken on line one" color={GOLD}>
          <p style={{ margin: 0 }}>
            The first line of <code>step()</code> is <code>php0, bhp0 = self.php, self.bhp</code>, and the last thing
            before the return is <code>self._reward(php0, bhp0, won, lost)</code>. The reward therefore sees exactly the
            change this frame caused, with no access to which section caused it. That is deliberate: it keeps the reward
            a pure function of the state transition, which is what lets the same environment be trained under three
            different reward functions — <code>damage</code>, <code>trade</code> and <code>survive</code> — by swapping
            one argument, as the{" "}
            <Link href="/learn/building-environments/the-turtle" style={link}>turtle page</Link> does. A reward that
            read intermediate state would have to be rewritten for each.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/building-environments/stamina-and-the-perfect-guard-window", label: <>← Stamina and the perfect-guard window</> }}
          next={{ href: "/learn/building-environments/what-the-agent-sees", label: <>What the agent sees: vectors or pixels →</> }}
        />
      </div>
    </article>
  );
}

const codeGuardLine = `# Section 1 in miniature: swing, then try to do anything else while the swing runs.
e = Duel(seed=1000)
e.step(A_ATK)
print("pressed attack -- pa is now %s, and ATK_SEG is %s (%d frames)"
      % (ACTION_NAMES[e.pa], ATK_SEG, move_len(dict(seg=ATK_SEG))))
print()
print(" frame  busy    pressed  ->  what step() did with it")
dropped = 0
for _ in range(26):
    was, busy = e.pa, e.busy
    e.step(A_PARRY)
    took = e.pa != was
    dropped += 0 if took else 1
    print("%6d  %-5s   parry    ->  %s"
          % (e.t, busy, "ACCEPTED -- pa is now " + ACTION_NAMES[e.pa] if took else "ignored"))
print()
print("%d of 26 presses read and dropped. The one that landed did so on the frame the" % dropped)
print("swing ended -- and the parry commits in ITS turn, so the ones after it go too.")`;

const outGuardLine = `pressed attack -- pa is now attack, and ATK_SEG is [('w', 8), ('h', 2), ('r', 14)] (24 frames)

 frame  busy    pressed  ->  what step() did with it
     2  True    parry    ->  ignored
     3  True    parry    ->  ignored
     4  True    parry    ->  ignored
     5  True    parry    ->  ignored
     6  True    parry    ->  ignored
     7  True    parry    ->  ignored
     8  True    parry    ->  ignored
     9  True    parry    ->  ignored
    10  True    parry    ->  ignored
    11  True    parry    ->  ignored
    12  True    parry    ->  ignored
    13  True    parry    ->  ignored
    14  True    parry    ->  ignored
    15  True    parry    ->  ignored
    16  True    parry    ->  ignored
    17  True    parry    ->  ignored
    18  True    parry    ->  ignored
    19  True    parry    ->  ignored
    20  True    parry    ->  ignored
    21  True    parry    ->  ignored
    22  True    parry    ->  ignored
    23  True    parry    ->  ignored
    24  True    parry    ->  ignored
    25  False   parry    ->  ACCEPTED -- pa is now parry
    26  True    parry    ->  ignored
    27  True    parry    ->  ignored

25 of 26 presses read and dropped. The one that landed did so on the frame the
swing ended -- and the parry commits in ITS turn, so the ones after it go too.`;

const codeOnce = `# The boss's hitbox test, and the three conditions it is made of.
m = MOVES[3]                      # slam: w24, d12, h5, r30
print("%s: %s" % (m["name"], m["seg"]))
print()
print(" bf  phase  seg  'is this an active frame nobody has been hit by yet?'")
for f in range(34, 42):
    kind, seg = phase_at(m, f)
    active = kind == "h"
    print("%3d  %-5s  %3d  %s" % (f, kind, seg,
          "yes -- test reach and arc" if active else "no"))
print()
print("without the b_seg_done guard the test would pass on every one of those frames.")`;

const outOnce = `slam: [('w', 24), ('d', 12), ('h', 5), ('r', 30)]

 bf  phase  seg  'is this an active frame nobody has been hit by yet?'
 34  d        1  no
 35  d        1  no
 36  h        2  yes -- test reach and arc
 37  h        2  yes -- test reach and arc
 38  h        2  yes -- test reach and arc
 39  h        2  yes -- test reach and arc
 40  h        2  yes -- test reach and arc
 41  r        3  no

without the b_seg_done guard the test would pass on every one of those frames.`;

const codeOrder = `# Section 5's last four lines, with the ordering made explicit.
for staggered in (False, True):
    e = Duel(seed=1000)
    e.b_poise = POISE_HIT          # one clean hit from a break
    if staggered:
        e.b_stagger = 30
    mult = RIPOSTE_MULT if e.b_stagger > 0 else 1.0
    dealt = ATK_DMG * mult
    print("boss staggered: %-5s  mult %.1f  damage %5.1f  %s"
          % (staggered, mult, dealt,
             "riposte -- poise is NOT spent" if mult > 1.0 else "ordinary -- poise IS spent"))
print()
print("so the hit that BREAKS poise does %.0f, and the %.0f only arrives on the next swing."
      % (ATK_DMG, ATK_DMG * RIPOSTE_MULT))`;

const outOrder = `boss staggered: False  mult 1.0  damage  12.0  ordinary -- poise IS spent
boss staggered: True   mult 3.0  damage  36.0  riposte -- poise is NOT spent

so the hit that BREAKS poise does 12, and the 36 only arrives on the next swing.`;

const codeAssemble = `# step(), written out. Only step() is overridden -- reset, the helpers, the reward and obs
# are inherited -- so what is being checked is the six sections and their order.
class MyDuel(Duel):
    def step(self, a):
        php0, bhp0 = self.php, self.bhp

        # 1. read the button, but ONLY if not already committed
        if not self.busy:
            self.guarding = (a == A_GUARD)
            if A_MOVE0 <= a <= A_MOVE0 + 7:
                self.pdir = (a - A_MOVE0)
                self.pa, self.pf = a, 0
            elif a == A_ATK and self.pst >= ATK_COST:
                self.pa, self.pf, self.p_hit_done = A_ATK, 0, False
                self.spend(ATK_COST); self.log["swings"] += 1
            elif A_ROLL0 <= a <= A_ROLL0 + 3 and self.pst >= ROLL_COST:
                self.pa, self.pf = a, 0
                self.pdir = 2 * (a - A_ROLL0)
                self.spend(ROLL_COST); self.log["rolls"] += 1
            elif a == A_PARRY and self.pst >= PARRY_COST:
                self.pa, self.pf = A_PARRY, 0
                self.spend(PARRY_COST)
            elif a in (A_IDLE, A_GUARD):
                self.pa, self.pf = a, 0
        if self.guarding:
            self.log["guard_frames"] += 1
        if self.d > 0 and math.hypot(self.px, self.pz) > ARENA - 0.6:
            self.log["wall_frames"] += 1

        # 2. you move -- 55% speed with the shield up; a roll follows its own fixed arc
        if self.p_stun == 0:
            if A_MOVE0 <= self.pa <= A_MOVE0 + 7:
                self._shift(self.pa - A_MOVE0, P_SPEED * (0.55 if self.guarding else 1.0))
            elif A_ROLL0 <= self.pa <= A_ROLL0 + 3 and self.pf < ROLL_I1:
                self._shift(2 * (self.pa - A_ROLL0), ROLL_DIST / ROLL_I1)

        # 3. the boss decides: stagger, then cooldown, then turn, then close, then commit
        if self.b_stagger > 0:
            self.b_stagger -= 1
        elif self.bm < 0:
            if self.b_cd > 0:
                self.b_cd -= 1
            self.bang = self.bang + max(-B_TURN_IDLE,
                                        min(B_TURN_IDLE, wrap(self.to_player() - self.bang)))
            if self.d > ENGAGE:
                self._close(B_CHASE)
            if self.b_cd <= 0 and self.d <= ENGAGE:
                self.bm = self._pick()
                self.bf, self.b_seg_done = 0, -1
                self.log["boss_moves"][self.bm] += 1

        # 4. its animation, its aim, and a hitbox that fires ONCE per active segment
        if self.bm >= 0 and self.b_stagger == 0:
            m = MOVES[self.bm]
            kind, seg = phase_at(m, self.bf)
            if kind in ("w", "d"):
                self.bang = self.bang + max(-B_TURN_WIND,
                                            min(B_TURN_WIND, wrap(self.to_player() - self.bang)))
                self._close(m["adv"])
            if kind == "h" and seg != self.b_seg_done:
                if self.d <= m["reach"] and abs(self.off_axis()) <= m["arc"]:
                    self._boss_hits(m["dmg"])
                    self.b_seg_done = seg
                elif self.bf == self._seg_start(m, seg):
                    self.log["whiffs"] += 1
                    if self.d <= m["reach"]:
                        self.log["arc_misses"] += 1
            self.bf += 1
            if self.bf >= move_len(m):
                self.bm, self.bf = -1, 0
                lo = int(round(6 + 40 * (1.0 - self.aggr)))
                self.b_cd = int(self.rng.integers(lo, lo + 26))

        # 5. your hitbox -- mult is read BEFORE poise is spent
        if self.pa == A_ATK:
            kind, _ = phase_at(dict(seg=ATK_SEG), self.pf)
            if kind == "h" and not self.p_hit_done and self.d <= ATK_REACH:
                mult = RIPOSTE_MULT if self.b_stagger > 0 else 1.0
                dealt = ATK_DMG * mult
                self.bhp -= dealt
                self.p_hit_done = True
                self.log["hits_dealt"] += 1; self.log["dmg_dealt"] += dealt
                if mult > 1.0:
                    self.log["riposte_dmg"] += dealt
                else:
                    self.b_poise -= POISE_HIT
                    if self.b_poise <= 0.0:
                        self._stagger(POISE_STAGGER); self.log["poise_breaks"] += 1

        # 6. clocks, then the ending, then the price of the frame
        if self.b_stagger == 0:
            self.b_poise = min(B_POISE_MAX, self.b_poise + POISE_REGEN)
        self.pf += 1
        if self.p_stun > 0:
            self.p_stun -= 1
        if self.p_regen_lock > 0:
            self.p_regen_lock -= 1
        elif not self.guarding:
            self.pst = min(P_ST_MAX, self.pst + ST_REGEN)
        self.t += 1
        won, lost = self.bhp <= 0, self.php <= 0
        terminated = bool(won or lost)
        truncated = bool(self.t >= self.clock and not terminated)
        if truncated and self.timeout == "defeat":
            lost, terminated, truncated = True, True, False
        r = self._reward(php0, bhp0, won, lost)
        return self.obs(), r, terminated, truncated, dict(won=won, lost=lost)


# Same seeds, same buttons, stepped together. Any divergence shows up on the frame it happens.
FIELDS = ["px", "pz", "bx", "bz", "bang", "php", "bhp", "pst", "pa", "pf",
          "p_stun", "bm", "bf", "b_stagger", "b_poise", "t"]
worst, frames, duels = 0.0, 0, 0
for s in range(1000, 1010):
    mine, real, act = MyDuel(seed=s), Duel(seed=s), 0
    while True:
        if real.t % 3 == 0:
            act = patient_parry(real)
        o1, r1, t1, u1, _ = mine.step(act)
        o2, r2, t2, u2, _ = real.step(act)
        worst = max(worst, max(abs(getattr(mine, f) - getattr(real, f)) for f in FIELDS))
        worst = max(worst, abs(r1 - r2), float(max(abs(o1 - o2))))
        frames += 1
        if t1 != t2 or u1 != u2:
            print("ENDINGS DISAGREE at frame", real.t)
        if t2 or u2:
            duels += 1
            break

print("%d duels, %d frames, same seeds and same buttons" % (duels, frames))
print("largest disagreement in any state field, reward or observation float: %.3g" % worst)
print("every log counter identical:", all(mine.log[k] == real.log[k]
                                          for k in real.log if k != "boss_moves"))`;

const outAssemble = `10 duels, 6867 frames, same seeds and same buttons
largest disagreement in any state field, reward or observation float: 0
every log counter identical: True`;

const outCommit = `1. commitment -- how many presses does step() simply refuse to read?
--------------------------------------------------------------------
  'if not self.busy:' guards the whole of section 1, so every button pressed during an
  attack, a roll, a parry or hitstun is DISCARDED -- not buffered, not queued. That one
  line is most of the difference between a Soulslike and a twin-stick shooter, so it is
  worth knowing how much of the duel it actually swallows.

  player               decisions   ignored    share
  mash attack               3507      2187    62.4%
  roll, punish              7500      2714    36.2%
  sidestep, punish          7500      2733    36.4%
  patient parry             5651      2707    47.9%
  random buttons            3851      2040    53.0%

  Every player on the ladder spends between a third and two thirds of its decisions
  unable to act, and the two best ones -- the sidestepper at 36% and the parrier at
  48% -- differ more in WHEN they are committed than in how often. A reader who
  buffers presses instead of dropping them has built a different game.`;

const outOnceTable = `2. a hitbox that fires ONCE -- what 'seg != self.b_seg_done' is worth
---------------------------------------------------------------------
  Section 4 tests a hitbox on every frame of an active segment, so without a guard it
  would connect on every one of them. The guard is three words; here is its price.

  move       hits  frames    dmg  as written   un-guarded 
  slash         1       3     18          18           54 
  thrust        1       2     22          22           44 
  heavy         1       4     34          34          136 lethal from full health
  slam          1       5     30          30          150 lethal from full health
  combo         2       6     14          28           84 

  The player has 100 health, so TWO of the five -- heavy at 136 and slam at 150 -- would
  kill outright from full, and the other three would roughly halve you. 'combo' is why
  the guard compares against the SEGMENT INDEX rather than a boolean: it has two active
  segments and is meant to hit twice for 28, which a boolean would collapse to one 14.`;

const outOrderTable = `3. why the riposte multiplier is read BEFORE poise is spent
-----------------------------------------------------------
  Section 5 reads 'mult' first, then spends poise in the else-branch. So the hit that
  BREAKS the pool lands for ordinary damage and the riposte is the NEXT swing. Swap the
  two lines and a break pays for itself immediately, which is a different game.

  sidestep, punish over 200 held-out duels:
    poise breaks a duel            1.80
    damage dealt a duel           149.6
    of which riposte damage        68.2

    a break costs 25 poise and the pool is 50, so it is 2 clean hits
    if the breaking hit were itself a riposte: +24 damage each,
    or +43.2 a duel -- 29% more damage, for a one-line reordering.`;
