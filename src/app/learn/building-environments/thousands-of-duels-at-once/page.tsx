import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Thousands of duels at once — Manifold",
  description:
    "World 2 vectorised its grid and got eight times the throughput. World 3 measured the same question and did not vectorise anything, because the duel turned out to be the cheapest part of training by two orders of magnitude. Same discipline, opposite answer.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ThousandsOfDuels() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 13 minutes"
        title={<>Thousands of duels at once</>}
        intro={<>Every environment eventually gets asked to go faster. World 2 answered by turning its fire into array
          arithmetic and stepping sixty-four fires at a time. This world was asked the same question, measured the same
          way, and the answer came back <em>don&rsquo;t</em> — which is a more useful page than another speed-up,
          because the reason is a general one and the measurement takes four lines.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What World 2 did, and why it worked</h2>
        <p>
          The wildfire world&rsquo;s expensive object was a 41&times;41 grid of cells, every one of which had the same
          rule applied to it every tick. That is the ideal shape for vectorisation: one operation, many identical data,
          no branching. Stacking sixty-four worlds into an extra array axis and running one set of shifts over all of
          them gave <strong>8.0&ndash;8.7&times;</strong> on the whole step, and profiling said why —{" "}
          <code>fire_tick</code> was 80&ndash;81% of the runtime, so making it eight times faster made everything
          nearly eight times faster.
        </p>
        <p>
          That last sentence is the actual lesson, and it is not about fire. <strong>The thing worth optimising is the
          thing that dominates the profile</strong>, and you find that out by measuring, not by looking at which code
          seems complicated.
        </p>

        <h2>The duel, measured before anything was optimised</h2>
        <CodeOutput source="scripts/boss_cases.py">{outSpeed}</CodeOutput>
        <p>
          Between about 108,000 and 121,000 frames a second on one core across repeated runs, which at one decision
          every three frames is 36,000&ndash;40,000 decisions a second. (Timings are noisy; this page quotes ranges
          rather than digits, which is the same rule World 2&rsquo;s vectorisation page had to adopt.) Put that beside
          the budget: a two-million-decision training run is six million frames, which is{" "}
          <strong>under a minute of simulation</strong>. The run that produced this world&rsquo;s trained duellist took
          sixty-three minutes.
        </p>
        <p>
          So before writing a single line of vectorised duel, the arithmetic already says that making the environment
          infinitely fast would save <strong>about 1.4% of the run</strong>. The interesting question is not
          &ldquo;how do I make the duel faster&rdquo; but &ldquo;what is the other 98.6%?&rdquo;
        </p>
        <CodeOutput source="scripts/boss_train.py">{outBench}</CodeOutput>
        <p>
          Four loops, each adding one layer. The duel on its own is the fastest line on the board by a wide margin. Add
          a single network forward per decision and throughput collapses — not because the network is large (it is 27
          inputs and two hidden layers of 256) but because every decision becomes a round trip to the GPU, and a round
          trip costs about the same whether it carries one state or sixteen. Stepping sixteen duels side by side and
          asking for all sixteen actions in one call buys back a factor of seven and a half. Then the gradient steps
          arrive and dominate everything: the full DQN loop runs at about 680 decisions a second, which is where the
          sixty-three minutes went.
        </p>
        <p>
          The second block exists because the first row of the first block does not match the 115,000 frames a second
          measured above, and a page that published both without explaining the gap would be asking you not to notice.
          The duel did not get slower. A learner needs more done per frame than a scripted player does, and taking the
          difference apart one layer at a time accounts for nearly all of it: random play dies earlier so it resets more
          often (&times;0.82), an observation vector is built every decision (&times;0.87), the transition is written to
          the replay buffer (&times;0.95), and the batch is stacked (&times;0.83). That is &times;0.56 before the
          batching wrapper itself is counted.
        </p>
        <Callout color={GOLD} title={<>The reason to batch environments, stated correctly</>}>
          <p style={{ margin: 0 }}>
            &ldquo;Vectorised environments make the environment faster&rdquo; is the wrong sentence, and it is the one
            everybody says. What a batch of environments actually does is <strong>amortise the per-decision cost of
            whatever is choosing the actions</strong>. If your environment is a grid of identical cells, the array work
            is the win. If your environment is a small state machine and your policy is a neural network, the batch is
            for the network, and the environment could stay in a plain Python loop forever. The trainer in this world
            steps sixteen duels at a time and every one of them is an ordinary, unvectorised <code>Duel</code> object.
          </p>
        </Callout>

        <h2>What a vectorised duel would have to do</h2>
        <p>
          It is still worth knowing what you would build if the measurement had gone the other way, and the duel has
          one part that vectorises beautifully. The hitbox test is pure arithmetic over a batch: distances, angles,
          two comparisons.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeVec} />
        <CodeOutput source="scripts/boss_cases.py">{outVec}</CodeOutput>
        <p>
          One line, sixty-four duels, agreeing with the loop everywhere. If the whole world looked like that, this page
          would end differently.
        </p>
        <p>
          It does not, and here is the shape of the problem. The fire grid was in the same state in every world at
          every tick — burning or not, and the rule is the same either way. Sixty-four duels are not.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeDiverge} />
        <CodeOutput source="scripts/boss_cases.py">{outDiverge}</CodeOutput>
        <p>
          At any given frame the sixty-four duels are spread across five of the six situations the boss can be in — the
          sixth, staggered, is missing only because a player who holds a shield never causes one — and a vectorised step
          has to execute the code for <em>all</em> of them and mask away the results it does not want. That is not fatal —
          it is exactly how vectorised physics engines work — but it means the speed-up is a fraction of the batch size
          rather than close to it, and the code gets a great deal harder to read and to verify. Against a component
          that is already under 2% of the run, that is a bad trade, and it would have to be verified against the scalar
          version frame by frame the way{" "}
          <Link href="/learn/building-environments/a-grid-you-can-vectorise" style={link}>World 2&rsquo;s was</Link>.
        </p>

        <Proof title="what we would do instead, if the duel ever did become the bottleneck" color={GOLD}>
          <p style={{ margin: "0 0 .6rem" }}>
            In order of how much they cost to build: <strong>(1) more processes.</strong> The duel is pure Python and
            CPU-bound with no shared state, so eight worker processes are eight times the throughput for about twenty
            lines and no new correctness risk. <strong>(2) Fewer network calls.</strong> A larger batch of environments
            with the same policy — free, and already done.
          </p>
          <p style={{ margin: 0 }}>
            <strong>(3) Compile the scalar step.</strong> A numba-jitted <code>step</code> keeps the branchy code
            readable and removes the interpreter, which is where nearly all of the cost is. Only then{" "}
            <strong>(4) mask-vectorise</strong>, and only with a frame-by-frame agreement check against the scalar
            version. Notice that the option everyone reaches for first is the last one on the list. None of these have
            been measured in this world, because none of them are needed; that is a statement about this world, not
            about the techniques.
          </p>
        </Proof>

        <h2>The transferable bit</h2>
        <p>
          Two worlds, same question, opposite answers, and neither answer was guessable from the source code. World 2
          looked slow and was; World 3 looks like a state machine full of branches and is the cheapest thing in the
          training loop. The difference was found in both cases by the same four-line measurement: time the environment
          alone, time the loop that trains on it, and compare.
        </p>
        <p>
          The general form is that an RL training loop has three costs — <strong>stepping the world</strong>,{" "}
          <strong>choosing actions</strong>, and <strong>updating the network</strong> — and which of them dominates is
          a property of your world, not of reinforcement learning. Optimising the wrong one is the most common wasted
          week in this field, and it is avoidable in about five minutes.
        </p>

        <Callout color={GOLD} title={<>Chapter 6 is done. What it settled</>}>
          <p style={{ margin: 0 }}>
            A move is a <Link href="/learn/building-environments/a-moveset-as-a-state-machine" style={link}>list of
            segments</Link>, which bought a curriculum and a renderer that cannot lie. A hitbox is a{" "}
            <Link href="/learn/building-environments/frames-hitboxes-and-i-frames" style={link}>reach and an arc</Link>,
            and the boss&rsquo;s facing commits when the active frames begin. Stamina prices everything, and the{" "}
            <Link href="/learn/building-environments/stamina-and-the-perfect-guard-window" style={link}>parry
            window</Link> sets the decision rate at three frames. The agent sees{" "}
            <Link href="/learn/building-environments/what-the-agent-sees" style={link}>twenty-seven floats</Link>,
            including four it arguably should not have. And the world runs fast enough that none of the usual
            performance work applies. Next: players that are not agents, a dial that is not what it looks like, and the
            two ways this duel can be reward-hacked.
          </p>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/building-environments/what-the-agent-sees", label: <>← What the agent sees: vectors or pixels</> }}
          next={{ href: "/learn/building-environments/scripted-players-and-a-difficulty-dial", label: <>Scripted players and a difficulty dial →</> }}
        />
      </div>
    </article>
  );
}

const codeVec = `# The one part of the duel that vectorises perfectly: the hitbox test.
# 64 duels, one move, one line of numpy -- and the loop it has to agree with.
rng = np.random.default_rng(7)
px, pz = rng.uniform(-5, 5, 64), rng.uniform(-5, 5, 64)
bx, bz = rng.uniform(-2, 2, 64), rng.uniform(-2, 2, 64)
bang = rng.uniform(-math.pi, math.pi, 64)
m = MOVES[1]                                    # thrust: reach 3.6, arc 0.35

d = np.hypot(px - bx, pz - bz)
off = (np.arctan2(px - bx, pz - bz) - bang + math.pi) % (2 * math.pi) - math.pi
batched = (d <= m["reach"]) & (np.abs(off) <= m["arc"])

one_at_a_time = []
for i in range(64):
    di = math.hypot(px[i] - bx[i], pz[i] - bz[i])
    offi = wrap(math.atan2(px[i] - bx[i], pz[i] - bz[i]) - bang[i])
    one_at_a_time.append(di <= m["reach"] and abs(offi) <= m["arc"])

print("batched says it connects in %d of 64 duels" % batched.sum())
print("the loop agrees on all 64:", bool(np.all(batched == np.array(one_at_a_time))))`;

const codeDiverge = `# ...and the reason the REST of it does not. Sixty-four duels, same frame, doing what?
envs = [Duel(seed=2000 + i) for i in range(64)]

def situation(e):
    if e.b_stagger > 0:
        return "staggered"
    if e.bm < 0:
        return "idle or cooling down"
    return {"w": "windup", "d": "delay", "h": "ACTIVE", "r": "recovery"}[
        phase_at(MOVES[e.bm], e.bf)[0]]

for t in range(361):
    if t % 120 == 0 and t:
        counts = {}
        for e in envs:
            counts[situation(e)] = counts.get(situation(e), 0) + 1
        print("frame %3d:  %s" % (t, ",  ".join(
            "%s %d" % kv for kv in sorted(counts.items(), key=lambda kv: -kv[1]))))
    for e in envs:
        e.step(A_GUARD)`;

const outVec = `batched says it connects in 3 of 64 duels
the loop agrees on all 64: True`;

const outDiverge = `frame 120:  windup 39,  idle or cooling down 13,  recovery 7,  ACTIVE 3,  delay 2
frame 240:  recovery 24,  idle or cooling down 18,  windup 13,  delay 7,  ACTIVE 2
frame 360:  idle or cooling down 35,  recovery 18,  windup 7,  ACTIVE 2,  delay 2`;

const outSpeed = `throughput on one core (3 repeats, best of; nothing else running)
-----------------------------------------------------------------
  stand still (short duels)      115514 frames/s =  38505 decisions/s at R=3
  patient parry (long duels)     116613 frames/s =  38871 decisions/s at R=3
  a 2,000,000-decision training run is 6,000,000 frames, which is under a MINUTE of
  pure simulation. That run takes an hour. The duel is not the bottleneck --
  see boss_train.py, where the envs are batched to amortise the GPU round trip, not
  because the envs are slow.`;

const outBench = `where a training second goes (best of 3, cuda)
------------------------------------------------------------------------------
  the duel alone, random buttons, 1 at a time        18457 decisions/s      55372 frames/s
  + a network forward per decision, 1 duel            2108 decisions/s       6323 frames/s
  + the same forward over 16 duels at once           15622 decisions/s      46866 frames/s
  + half a gradient step per decision (DQN)            684 decisions/s       2053 frames/s

  the duel is 27x faster than the cheapest loop that trains on it, and batching the
  duels bought 7.4x -- not because the duels were slow, but because one GPU round trip
  costs about the same whether it carries 1 state or 16. The environment is not the
  bottleneck in this world, so it was never vectorised.

why that first row is below what boss_cases.py speed reports
------------------------------------------------------------
  a scripted player, no obs, no buffer   (what speed times)   113788 frames/s
  random buttons instead (they die early, so more resets)    93397 frames/s
  + an obs() every decision                               81258 frames/s
  + the replay writes                                     77012 frames/s
  + stacking the batch                                    63551 frames/s
  steps:  x0.82 random play   x0.87 obs()   x0.95 replay   x0.83 stack   = x0.56 overall
  so the duel did not get slower -- a learner just needs more done per frame than a
  scripted player does, and the rest of the gap is the batching wrapper itself.`;
