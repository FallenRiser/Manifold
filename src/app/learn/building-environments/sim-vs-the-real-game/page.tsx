import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Sim vs the real game — Manifold",
  description:
    "An inventory of everything this duel simulator is not: a fixed boss, a state vector instead of a screen, no phases, no camera, and perfect determinism. What would transfer, what would not, and why the honest next step is imitation from real footage rather than transfer from here.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SimVsReal() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 13 minutes"
        title={<>Sim vs the real game</>}
        intro={<>This world was built to imitate a Soulslike boss fight, and the imitation is good enough that the
          skills have the right names — spacing, timing, punishing a recovery. The last page of a world should say
          exactly how far that goes. This one is an inventory of the gaps, ordered by how much they would cost to close,
          and it ends by arguing that the honest route to the real game does not start here at all.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Five things this is not</h2>
        <ol style={{ lineHeight: 1.75 }}>
          <li>
            <strong>The boss does not react to you.</strong> It picks from the moves that can reach you and throws one.
            A real boss has phases, changes its moveset below half health, punishes healing, and has attacks that exist
            to beat the answer you found for the last one. Ours has one behaviour for the whole fight, and it is
            deliberate — the boss is the exam, and an exam that adapts cannot be used to compare two policies.
          </li>
          <li>
            <strong>The agent is handed the state.</strong> Twenty-seven floats including which move is out and{" "}
            <Link href="/learn/building-environments/what-the-agent-sees" style={link}>which frame of it</Link>. A human
            gets a picture and has to identify the attack from an animation that starts identically to three other
            animations. This is the largest gap on the list and the one with the most visible consequence, below.
          </li>
          <li>
            <strong>There is no camera, and no second enemy.</strong> No lock-on to lose, nothing off-screen, no
            terrain, no ledge, no healing item to decide whether you have time for. Every one of those is a decision a
            real player makes constantly and this world does not contain.
          </li>
          <li>
            <strong>It is perfectly deterministic.</strong> The same seed and the same buttons give a bit-identical
            duel, which is what makes every measurement in this world reproducible — and it is exactly what a real game
            on real hardware is not, with frame-rate variance, input latency and animation blending between them.
          </li>
          <li>
            <strong>The player is permanently locked on.</strong> That is why the attack has a reach and{" "}
            <Link href="/learn/building-environments/frames-hitboxes-and-i-frames" style={link}>no arc</Link>, and why a
            raised shield always covers the attack. Both are honest simplifications of what lock-on does in these games,
            and both would need re-deriving the moment a camera existed.
          </li>
        </ol>

        <h2>The gap with a measurable consequence</h2>
        <p>
          Gaps two and one interact, and the result is visible in this world&rsquo;s own numbers. Here is the parry, from
          a human&rsquo;s side: how long after an attack starts you have to press, per move.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeReaction} />
        <CodeOutput source="scripts/boss_cases.py">{outReaction}</CodeOutput>
        <p>
          A simple visual reaction is about a quarter of a second — call it eight frames at this frame rate. On that
          measure three of the five attacks are comfortably reactable: the slam gives you twenty-nine frames before the
          press window even opens, and the heavy twenty-one. Two are not. <code>slash</code> wants the press between
          233 and 367 milliseconds after it starts, which is the width of a reaction time, and <code>combo</code> wants
          it between 167 and 300, which is inside one.
        </p>
        <p>
          Which is the point. <strong>Reacting is not what makes a real Soulslike hard.</strong> What makes it hard is
          that for the first ten or fifteen frames several attacks look the same, so a press is a bet on which one it
          is, and the delayed attacks exist precisely to punish a bet placed on the wrong animation. Our world hands the
          agent the answer to that bet as a one-hot vector. Strip it out and the numbers on this world&rsquo;s pages
          would move; leave it in and the{" "}
          <Link href="/learn/building-environments/curriculum-one-move-then-the-set" style={link}>slowest, most
          telegraphed attacks come out as the easiest</Link> in the game, which is the exact inverse of the human
          experience and a good measure of how big this particular gap is.
        </p>
        <p>
          Two independent readings agree on which move is genuinely hard, though, and that is worth something. The
          per-move sweep says <code>combo</code> is the only attack that beats an expert; the reaction arithmetic says{" "}
          <code>combo</code> has the tightest press window of the five, closing barely thirty milliseconds after a
          typical reaction would have begun. When a simplification and the thing it simplifies agree about the ordering,
          some of the structure has survived.
        </p>

        <h2>What would transfer, and what would not</h2>
        <p>
          <strong>Would transfer, in structure:</strong> the shape of the policy. &ldquo;Identify the move, count frames
          to the hitbox, choose between roll and parry on the basis of reach, arc and stamina, punish the recovery&rdquo;
          is the correct algorithm in both places. So is the economy: spend the cheap defence when the payoff is small
          and the expensive one when the payoff is a stagger.
        </p>
        <p>
          <strong>Would not transfer, at all:</strong> every number. Fourteen frames of windup, 0.35 radians, 0.55
          stamina a frame — none of these correspond to any real game, and a policy trained here has memorised all of
          them. A network that has learned &ldquo;press parry when <code>v[16]</code> is around 0.23 and{" "}
          <code>v[13]</code> is 1&rdquo; has learned a lookup table for one specific fiction.
        </p>
        <Callout color={GOLD} title={<>If you actually wanted transfer, here is what you would randomise</>}>
          <p style={{ margin: 0 }}>
            Domain randomisation says: make the thing you cannot measure into a distribution you sample from. For this
            world that would mean sampling every segment length by &plusmn;20% at each reset, jittering reach and arc,
            injecting an action latency of a few frames drawn per episode, adding noise to the observation, and —
            the important one — randomising <em>which</em> five moves the boss has, drawn from a much larger table.
            A policy that survives all of that has learned the algorithm rather than the table.{" "}
            <strong>None of this has been built or measured here</strong>, and it is listed as the design rather than as
            a result.
          </p>
        </Callout>

        <h2>Why the honest next step goes the other way</h2>
        <p>
          The instinct after building a simulator is to train in it and deploy to the real thing. For a boss fight in a
          commercial game that route is close to hopeless, and not for the usual sim-to-real reasons: you do not have
          the real game&rsquo;s frame data, you cannot reset it, you cannot run it faster than real time, and you get a
          handful of attempts an hour instead of forty thousand duels a minute.
        </p>
        <p>
          The other direction is much more promising, and it is what the{" "}
          <Link href="/learn/lies-of-p-capstone" style={link}>Lies of P capstone</Link> does: record a human playing the
          real game, and learn the mapping from screen to button by imitation. No environment, no reward, no resets —
          just supervised learning on frames a person actually produced. That capstone is a <em>field report</em>, and it
          ships its methodology before it ships its results on purpose, because the results depend on data that does not
          exist until somebody sits down and plays.
        </p>
        <Proof title="what this simulator is genuinely good for, then" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            Three things, none of which are &ldquo;playing the real game&rdquo;. <strong>Learning to build one</strong> —
            the pipeline this track is about, applied to a task where timing is the whole difficulty rather than an
            afterthought. <strong>Studying the algorithms</strong> — a small, fast, exactly reproducible world with a
            known ceiling (200 of 200 on full health) is an unusually clean place to compare learners, because you can
            say how far from optimal a run is rather than only how it compares to another run.
          </p>
          <p style={{ margin: 0 }}>
            And <strong>as a target for imitation</strong>: because it is deterministic and instrumented, it is a good
            place to test a behaviour-cloning pipeline before pointing it at footage of a real game, where nothing can
            be checked. That is the bridge between this world and the capstone, and it is the one claim on this page
            that a later project could actually falsify.
          </p>
        </Proof>

        <h2>The honest summary</h2>
        <p>
          This is a duel simulator that gets the <em>structure</em> of a Soulslike right — frames, telegraphs, a stamina
          economy, a defence that deletes attacks and one that only survives them, a punish window — and gets none of
          the <em>content</em> right, because the content is a specific game&rsquo;s specific numbers. It was built to
          teach environment design, and the measurements on these pages are about this world rather than about the game
          it imitates. Claiming more than that would be exactly the kind of overclaim the rest of the track spends its
          time refusing to make.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/reading-a-policy", label: <>&larr; Reading a policy off its buttons</> }}
          next={{ href: "/learn/building-environments/three-worlds-one-pipeline", label: <>Three worlds, one pipeline →</> }}
        />
      </div>
    </article>
  );
}

const codeReaction = `# The parry from a HUMAN's side: how long after an attack starts do you have to press?
# You must press so the hitbox lands on YOUR frames PAR_I0..PAR_I1, so the window is
# [first active frame - PAR_I1, first active frame - PAR_I0].
HUMAN = 8            # about a quarter of a second, a typical simple visual reaction

print("move      first hitbox   press between frames    after it starts   react to it?")
for m in MOVES:
    acc = 0
    for kind, n in m["seg"]:
        if kind == "h":
            break
        acc += n
    lo, hi = acc - PAR_I1, acc - PAR_I0
    print("%-9s %12d %14d to %2d %13.0f-%3.0f ms %11s"
          % (m["name"], acc, lo, hi, 1000 * lo / FPS, 1000 * hi / FPS,
             "yes" if lo >= HUMAN else "no -- predict"))
print()
print("a simple reaction is about %d frames (%.0f ms) at %d frames a second."
      % (HUMAN, 1000 * HUMAN / FPS, FPS))
print("the hard part of the real thing is not reacting -- it is knowing WHICH move it is")
print("while the windups still look alike. This world tells the agent, in v[11] to v[15].")`;

const outReaction = `move      first hitbox   press between frames    after it starts   react to it?
slash               14              7 to 11           233-367 ms no -- predict
thrust              18             11 to 15           367-500 ms         yes
heavy               28             21 to 25           700-833 ms         yes
slam                36             29 to 33           967-1100 ms         yes
combo               12              5 to  9           167-300 ms no -- predict

a simple reaction is about 8 frames (267 ms) at 30 frames a second.
the hard part of the real thing is not reacting -- it is knowing WHICH move it is
while the windups still look alike. This world tells the agent, in v[11] to v[15].`;
