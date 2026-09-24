import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Curriculum: one move, then the set — Manifold",
  description:
    "A boss built from a table can be given one attack at a time, so 'which move is hardest' becomes a measurement rather than an opinion. The answer inverts the obvious ordering: the slow terrifying slam is the easiest attack in the world, and the small fast combo is the one that beats an expert.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function Curriculum() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 15 minutes"
        title={<>Curriculum: one move, then the set</>}
        intro={<>Because the moveset is a table, <code>Duel(moves=[3])</code> is a boss that only ever slams. That one
          keyword argument turns &ldquo;which attack should an agent learn first?&rdquo; from a discussion into a
          measurement — and the measurement says the ordering everybody would have picked is backwards.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The idea, and why this world can test it cheaply</h2>
        <p>
          Curriculum learning is the oldest trick in the book: do not start a learner on the full task, start it on a
          simplified one and add difficulty as it copes. It works when the simplified task genuinely teaches a skill the
          full task needs, and it fails — expensively and quietly — when the simplified task teaches a policy that has
          to be unlearned.
        </p>
        <p>
          The usual obstacle is that simplifying a world means writing a second world. Here it does not. The boss is
          five rows of a table and <code>allowed</code> is a list of indices, so restricting the moveset costs one
          argument and changes nothing else — same physics, same stamina, same arena, same boss health. That makes the
          first question answerable in about a minute.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeOneMove} />
        <CodeOutput source="scripts/boss_cases.py">{outOneMove}</CodeOutput>

        <h2>How hard is each attack, on its own</h2>
        <p>
          Every player on the sanity ladder, against each move alone, a hundred duels each.
        </p>
        <CodeOutput source="scripts/boss_cases.py">{outCurriculum}</CodeOutput>
        <p>
          Start with the two attacks the brief made a fuss about. <code>heavy</code> is sixty frames long with eight
          frames of held breath in the middle; <code>slam</code> is seventy-one frames with twelve, takes thirty health,
          and is the move the brief says every new player dies to. Against either of them alone, both avoiding players
          finish on <strong>100.0 health</strong>. Not 90-something. They are never touched.
        </p>
        <p>
          Now look at <code>combo</code>: fourteen damage a hit, the smallest number in the table, and it leaves the
          sidestepping player on <strong>8.2 health</strong>, the shield-holder on <strong>0.8</strong>, and drags the
          greedy expert down from around 99&ndash;100% wins to <strong>44%</strong>. It is the only move in the world
          that beats a player who reads the animation clock.
        </p>
        <PredictPrompt
          accent={GOLD}
          prompt={<>Before reading on: what is it about a two-hit attack that costs fourteen damage that makes it harder
            than a thirty-damage slam with twelve frames of telegraph?</>}
          options={["It comes out faster, so there is less reaction time",
                    "Its second hit lands exactly when a roll's invulnerability runs out",
                    "It is used more often, so the damage adds up",
                    "It has the narrowest arc, so sidestepping does not work"]}
        />

        <h2>The mechanism, in twelve frames</h2>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeWhyCombo} />
        <CodeOutput source="scripts/boss_cases.py">{outWhyCombo}</CodeOutput>
        <p>
          The combo&rsquo;s second hitbox arrives <strong>twelve frames</strong> after its first. A roll is invulnerable
          on its frames 3 to 12. So whenever you time a roll to cover the first hit — which means being somewhere in
          that window when it lands — the second one arrives twelve frames later, which is <em>past the end of your
          window, for every possible press</em>. One roll cannot cover both. And the roll is eighteen frames long, so
          you cannot press a second one either.
        </p>
        <p>
          That is not an accident of tuning; it is the interaction between two numbers written on different pages. The
          i-frame window was set on the{" "}
          <Link href="/learn/building-environments/frames-hitboxes-and-i-frames" style={link}>hitbox page</Link> and the
          combo&rsquo;s internal spacing was set on the{" "}
          <Link href="/learn/building-environments/a-moveset-as-a-state-machine" style={link}>moveset page</Link>, and
          neither was chosen with the other in mind. Interactions like this are what a per-move sweep finds and a read
          of the constants does not.
        </p>

        <Callout color={GOLD} title={<>Why the parry expert does not care</>}>
          <p style={{ margin: 0 }}>
            <code>patient parry</code> finishes on 100.0 health against the combo, like everything else. The reason is
            one line in <code>_boss_hits</code>: a parry <strong>staggers the boss, and a stagger cancels the move it
            had out</strong>. Parry the first hit and the second hit never happens — the whole animation is thrown away.
            A roll survives an attack; a parry <em>deletes</em> it. The gap between 8.2 health and 100.0 health on that
            row is the difference between those two verbs, and it is the strongest argument in the world for why the
            hardest timing deserves the biggest payoff.
          </p>
        </Callout>

        <h2>So what ordering does the measurement suggest?</h2>
        <p>
          Easiest to hardest, by what an avoiding player keeps: <code>slam</code> and <code>heavy</code> (100.0), then{" "}
          <code>thrust</code> (71.2), then <code>slash</code> (49.8), then <code>combo</code> (8.2). Which is almost
          exactly the reverse of a ranking by how frightening each move looks, and roughly the reverse of a ranking by
          damage. The two moves with the longest telegraphs are the two easiest attacks in the world, because a long
          telegraph is only frightening to something with a reaction time.
        </p>
        <p>
          That sentence is worth keeping. Everything the brief said about the delayed attacks being the hard part is
          true <em>of a human</em>. For a policy that gets the boss&rsquo;s{" "}
          <Link href="/learn/building-environments/what-the-agent-sees" style={link}>animation frame in its
          observation</Link>, a long windup is not a threat, it is a generously long invitation to act at leisure. The
          moves that are hard for an agent are the ones whose <em>timing structure</em> defeats the available answers —
          and those turn out to be the fast, cheap, unimpressive ones.
        </p>

        <DecisionPoint
          accent={GOLD}
          question={<>Given that table, how should the duellist be trained?</>}
          options={[
            {
              label: "On the full moveset from the first step, and measure whether it needs help",
              verdict: "best",
              response: (<>What ships. A curriculum is a cost — extra code, extra hyperparameters, extra ways to be
                wrong — and it should be paid for by evidence that the flat task is too hard. The scripted ladder says
                the full task is solvable by four lines of policy, so there is no reason to believe the flat version is
                beyond a learner until one has failed at it.</>),
            },
            {
              label: "Slam and heavy first, then the rest",
              verdict: "miss",
              response: (<>The intuitive ordering and the measured-wrong one. Those two are the easiest attacks in the
                world for an avoider, and a policy that masters them learns &ldquo;there is always time&rdquo; — the
                single worst habit to carry into a combo. This is the failure mode where the simple task teaches
                something that has to be unlearned.</>),
            },
            {
              label: "Combo first, since it is the hardest",
              verdict: "close",
              response: (<>Defensible, and it is the reverse-curriculum instinct. Starting at the hard end avoids
                teaching bad habits, but it also means the early reward signal is nearly all punishment, which is how
                you get a policy that refuses to engage. If you try this, the refusal rows on the ladder are what you
                watch.</>),
            },
            {
              label: "Ramp the aggression dial from 0 to 1 over training",
              verdict: "miss",
              response: (<>The dial has <Link href="/learn/building-environments/scripted-players-and-a-difficulty-dial"
                style={link}>two signs</Link>: it makes life worse for players who block and{" "}
                <em>better</em> for players who avoid (69.1 to 79.0 health). So this schedule is easy-to-hard or
                hard-to-easy depending on which strategy the policy happens to find first — and you would not know which
                until it had already shaped the policy.</>),
            },
          ]}
        />

        <Proof title="what has been measured here, and what has not" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            <strong>Measured:</strong> how hard each move is on its own, for seven hand-written players, over a hundred
            duels each; the frame arithmetic that explains the combo; and the fact that a parry cancels a multi-hit move
            while a roll does not.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Not measured:</strong> whether a curriculum actually helps a <em>learner</em> here. That needs the
            same training run done several ways and compared, and it has not been done. This page therefore makes no
            claim about curricula improving anything — it makes a claim about what the ordering would have to be if you
            built one, and about how badly the obvious ordering would have gone.
          </p>
        </Proof>

        <h2>The transferable bit</h2>
        <p>
          If your environment is built from data rather than from branches, you get ablations for free — and the cheapest
          useful one is <em>leave a piece out and score the same fixed players</em>. It costs an argument and a minute,
          it needs no training, and in this world it overturned the ordering anybody would have guessed. The general
          version: <strong>rank the parts of your task by measured difficulty before you design a schedule over them</strong>,
          and rank it with several different strategies, because &ldquo;hard&rdquo; is a relation between a task and a
          policy rather than a property of the task.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/scripted-players-and-a-difficulty-dial", label: <>← Scripted players and a difficulty dial</> }}
          next={{ href: "/learn/building-environments/the-training-loop", label: <>The training loop, line by line &rarr;</> }}
        />
      </div>
    </article>
  );
}

const codeOneMove = `# A boss with one attack costs one keyword argument, because the moveset is data.
for i in (3, 4):                                     # 3 = slam, 4 = combo
    print("a boss that only ever throws '%s':" % MOVES[i]["name"])
    ladder(players=[("sidestep, punish", sidestep_and_punish),
                    ("patient parry", patient_parry)], n=25, moves=[i])
    print()`;

const codeWhyCombo = `# Why the smallest attack in the table is the hardest one in the world.
m = MOVES[4]
acc, active = 0, []
for kind, n in m["seg"]:
    if kind == "h":
        active.append(acc)
    acc += n
gap = active[1] - active[0]
print("combo's hitboxes go live on its frames %d and %d -- %d frames apart."
      % (active[0], active[1], gap))
print("a roll lasts %d frames and is invulnerable on its frames %d to %d."
      % (ROLL_LEN, ROLL_I0, ROLL_I1))
print()
print("press the roll k frames before the first hitbox:")
for k in range(ROLL_I0, ROLL_I1 + 1, 2):
    f1, f2 = k, k + gap
    safe = lambda f: "safe" if ROLL_I0 <= f <= ROLL_I1 else "HIT "
    print("  k=%2d  first hit at roll frame %2d (%s)   second at %2d (%s)"
          % (k, f1, safe(f1), f2, safe(f2)))
print()
print("there is no k that covers both, because the gap (%d) is larger than the window (%d)."
      % (gap, ROLL_I1 - ROLL_I0 + 1))
print("and you cannot roll again: the roll is %d frames long." % ROLL_LEN)`;

const outOneMove = `a boss that only ever throws 'slam':
player           win  die  clk  bossHP  ownHP   sec  meanD  offax  parry  poise  block   brk  hits  dodge  arcX  swing  wall%        G
sidestep, punish    0    0   25    82.6  100.0  30.0   1.78   0.17   0.00   2.00   0.00  0.00  0.00   7.32  0.00   9.12    0.0    15.74
patient parry      25    0    0   -12.0  100.0  21.3   1.71   0.00   7.00   0.00   0.00  0.00  0.00   0.00  0.00   7.00    0.0    55.20

a boss that only ever throws 'combo':
player           win  die  clk  bossHP  ownHP   sec  meanD  offax  parry  poise  block   brk  hits  dodge  arcX  swing  wall%        G
sidestep, punish    0   11   14    63.8    9.3  27.1   1.43   0.27   0.00   1.88   0.00  0.00  6.48   2.76  7.88   9.72    0.0    -4.66
patient parry      25    0    0   -12.0  100.0  29.3   1.44   0.00  13.00   0.00   0.00  0.00  0.00   0.00  0.00   7.00   24.3    55.20`;

const outWhyCombo = `combo's hitboxes go live on its frames 12 and 24 -- 12 frames apart.
a roll lasts 18 frames and is invulnerable on its frames 3 to 12.

press the roll k frames before the first hitbox:
  k= 3  first hit at roll frame  3 (safe)   second at 15 (HIT )
  k= 5  first hit at roll frame  5 (safe)   second at 17 (HIT )
  k= 7  first hit at roll frame  7 (safe)   second at 19 (HIT )
  k= 9  first hit at roll frame  9 (safe)   second at 21 (HIT )
  k=11  first hit at roll frame 11 (safe)   second at 23 (HIT )

there is no k that covers both, because the gap (12) is larger than the window (10).
and you cannot roll again: the roll is 18 frames long.`;

const outCurriculum = `one attack at a time: how hard is each move ALONE? (100 duels, win% / own hp left)
----------------------------------------------------------------------------------
moveset          mash attack        hold guard     block, punish      roll, punish  sidestep, punish      parry oracle     patient parry
slash             2% /  -7.6        0% /  58.0        0% /  51.4        0% /  58.8        0% /  49.8      100% /  36.8      100% / 100.0
thrust            0% / -10.0        0% /  50.7        0% /  49.0        0% /  71.2        0% /  71.2       99% /  36.6      100% / 100.0
heavy             0% /  -2.0        0% /  38.5        0% /  39.3        0% / 100.0        0% / 100.0      100% /  47.0      100% / 100.0
slam              0% / -20.0        0% /  50.6        0% /  52.1        0% / 100.0        0% / 100.0      100% /  65.5      100% / 100.0
combo             0% / -12.0        0% /   0.8        0% /  30.8        0% / -11.3        0% /   8.2       44% /   0.3      100% / 100.0
ALL FIVE          2% / -12.6        0% /  45.8        0% /  42.6        0% /  68.9        0% /  75.3       96% /  41.3      100% / 100.0

  the two attacks the brief calls frightening are the EASIEST: against 'slam' alone
  both avoiders finish on 100.0 hp, because a long telegraph is only frightening to
  something with a reaction time. 'combo' is the hard one -- two active segments 12
  frames apart, which is exactly when the roll's invulnerability runs out -- and it
  is the only move that beats the greedy expert (44% wins against 99-100% elsewhere).
  A curriculum ordered by how scary a move LOOKS would start at the wrong end.`;
