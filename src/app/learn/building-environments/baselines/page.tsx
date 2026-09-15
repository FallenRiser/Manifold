import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { WILDFIRE_SETUP } from "@/lib/runtimeSetup";
import { ChiefRaceLab } from "@/components/fire/ChiefRaceLab";

export const metadata = {
  title: "Baselines a fire chief would try — Manifold",
  description:
    "Before any crew learns, race hand-written fire chiefs on the 200 held-out worlds. Random buttons beat standing by — and the reason is a single drop the helicopter can make on its first step. Stack that trick onto the best chief and it saves more villages but loses on return, so the page decides which number ranks a crew, and how big a gap is real when every rule faces the same fires.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function Baselines() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 20 minutes"
        title={<>Baselines a fire chief would try</>}
        intro={<>The sailing world had an expert who could not lose: it proved the task was solvable and set a time to beat.
          The wildfire world has no such expert. Nobody knows the best way to fly this helicopter, and the world is far too
          big to compute it. So before any crew learns, we race the rules a fire chief might write on the back of an
          envelope — and read every result as a test of the world, and as a bar the crew will have to clear.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Two jobs for a baseline</h2>
        <p>
          On the <Link href="/learn/building-environments/sanity-agents" style={link}>sanity-agents page</Link> for the
          boat, hand-written helms were <strong>tests</strong>: each came with a prediction, and a result that missed its
          prediction pointed at a bug. Here they do that job too, plus a second one. With no expert and no computed optimum,
          the best rule we can write <em>is</em> the <strong>bar</strong>. A crew that cannot beat it has learned nothing
          worth the training time, however good its curves look.
        </p>
        <p>
          Every rule on this page plays the same 200 held-out worlds, seeds 1000 to 1199, which no crew in this chapter
          ever trains on. The scorer <code>fly</code> reports what happened to the village (cells damaged, and how often
          it was untouched), how much of the map burned, how many burning cells were put out, how long the episode lasted,
          and the <strong>return</strong>: the sum of rewards under the values reward, −1 for every cell that catches fire
          and −10 more for each village cell.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>A rule that presses one of the six buttons uniformly at random, every step. Compared with a helicopter that
            just hovers, how much village does it lose?</>}
          options={["About the same", "A little less", "About half as much", "More — it wastes water"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeLadder} />
        <CodeOutput>{`rule                      village  untouched  burnt  put out  steps  return
stand by (hover)             6.79      20.0%  169.4      0.0   77.7  -235.2
press random buttons         3.55      39.0%  152.9      0.2   78.1  -186.4
fly to the nearest fire      2.65      65.0%   82.9     17.2   47.0  -108.5
guard the village            1.03      77.0%   83.7     13.4   46.9   -93.2`}</CodeOutput>

        <p>Read each row as the test it is.</p>

        <h3 style={h3}>Stand by — 6.79 of 9 village cells, and the fire always burns out</h3>
        <p>
          <strong>The prediction:</strong> nothing is put out, so the village is saved only in worlds where the fire never
          reaches it. <strong>What came back:</strong> zero cells put out, the village untouched in 20% of worlds, and every
          one of the 200 episodes ended with the fire out, on average after 77.7 steps — none reached the 300-step limit.
          That last fact matters for the world&rsquo;s design. The fire burns itself out long before time is called, so the
          limit is a safety net, not part of the task: the reasoning behind labelling it <em>truncated</em> on the{" "}
          <Link href="/learn/building-environments/terminated-vs-truncated" style={link}>terminated-vs-truncated page</Link>.
        </p>

        <h3 style={h3}>Random buttons — half the damage, and almost nothing put out</h3>
        <p>
          <strong>The prediction:</strong> a helicopter that wanders at random should rarely find the lake and the fire in
          order, so it should do about as badly as standing by. <strong>What came back:</strong> 3.55 village cells, not
          6.79, and the village untouched almost twice as often. Yet it put out 0.2 cells per episode. It saves the village
          without fighting the fire. That is a surprise, and a surprise about a baseline is a question about the world — the
          next section answers it.
        </p>

        <h3 style={h3}>Nearest fire and guard — the same area burnt, very different villages</h3>
        <p>
          <strong>The prediction:</strong> both chiefs refill and fight, so both should cut the damage and the episode
          length; guard, which always attacks the fire closest to the village, should protect the village better.{" "}
          <strong>What came back:</strong> both end the fire in about 47 steps and burn about the same area (82.9 and 83.7
          cells), but guard loses 1.03 village cells to nearest&rsquo;s 2.65. Notice the put-out column. Nearest puts out
          more fire, 17.2 cells to 13.4, and saves less village. Cells put out is not what the world cares about, a fact the
          cobra-effect page later in this chapter builds a whole experiment on.
        </p>

        <h2>Why random buttons save the village</h2>
        <p>
          Two facts from the <Link href="/learn/building-environments/the-helicopter" style={link}>helicopter page</Link>{" "}
          suggest an answer. The helicopter starts with a full bucket, hovering over the middle of the village. And a drop
          soaks a 5 × 5 square, which covers the whole 3 × 3 village. A random rule presses the button on its first step one
          time in six. If that is the reason, taking the water away should take the benefit away, and a single deliberate
          drop should get all of it.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeWhy} />
        <CodeOutput>{`random buttons, bucket full at the start    3.55
random buttons, bucket empty at the start   6.79
one drop on the village, then hover         2.81
village moisture 0.157 -> 0.900; the (1 - moisture) in its catch chance 0.843 -> 0.100
drying 0.01 a fire tick, it takes 74 fire ticks (149 steps) to dry back`}</CodeOutput>

        <p>
          Both predictions hold. With the bucket empty, random buttons lose 6.79 village cells, the same as standing by.
          And one press of the button on the first step, followed by nothing at all, loses 2.81: about what the nearest
          chief manages by flying the whole fire. The mechanism is in the last two lines. Every catch chance on the{" "}
          <Link href="/learn/building-environments/wind-moisture-and-slope" style={link}>wind, moisture and slope page</Link>{" "}
          is multiplied by (1 − moisture), and the drop takes that factor for the village from 0.843 to 0.100 — about an
          eighth. Drying back to the start takes 74 fire ticks, 149 steps. A typical fire under stand-by is out after 77.7
          steps, about 39 fire ticks, and by then the village has only dried to about 0.51, still catching at a little over
          half its dry rate.
        </p>

        <Callout color={GOLD} title={<>A starting condition can hand a baseline its score</>}>
          Nothing is broken here: the start full over the village was a deliberate choice on the helicopter page. But it
          means &ldquo;random beats standing by&rdquo; is not evidence that random flying helps; the whole effect is one
          drop at step 0. Keep the one-drop rule in the table. It is the cheapest thing that works in this world, and a
          learner that stumbles onto it will look like it learned to protect the village. The next page trains a crew on
          the pilot&rsquo;s controls and meets exactly that.
        </Callout>

        <h2>Stack the tricks</h2>
        <p>
          If one drop on the village is worth that much, two stronger rules suggest themselves. <strong>Soak the
          village</strong> never fights the fire: it fills, flies home, drops on the village, and repeats.{" "}
          <strong>Drop, then guard</strong> spends the first step soaking the village and then flies the guard chief.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>&ldquo;Drop, then guard&rdquo; against the plain guard chief, on the same 200 worlds. Which is better?</>}
          options={["Drop, then guard — on every measure", "Guard — on every measure", "It depends which number you look at", "They tie"]}
        />

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codeStack} />
        <CodeOutput>{`rule                      village  untouched  burnt  put out  steps  return
soak the village             0.45      79.0%  142.7      1.4   73.0  -145.8
drop, then guard             0.42      84.0%  102.6     10.9   51.0  -105.8`}</CodeOutput>

        <p>
          Both beat guard on the village. Soaking loses 0.45 village cells and lets 142.7 cells of forest and grass burn,
          59 more than guard. Drop-then-guard loses the least village of any rule, 0.42, with the village untouched in 84%
          of worlds against guard&rsquo;s 77% — but the helicopter starts the fight empty, has to refill first, and 18.9
          more cells burn. Put every rule in one table and each column crowns a different winner:
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Rule</th><th style={thr}>Village damaged</th><th style={thr}>Untouched</th><th style={thr}>Cells burnt</th><th style={thr}>Return</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map(([rule, v, u, b, r]) => (
                <tr key={rule} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={td}>{rule}</td>
                  {[v, u, b, r].map((x, i) => (
                    <td key={i} style={{ ...tdr, ...(x.startsWith("*") ? best : {}) }}>{x.replace("*", "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.6rem" }}>
          The best value in each column is in bold. Village and untouched crown drop-then-guard; cells burnt crowns the
          nearest chief; the return crowns guard.
        </p>

        <Callout color={GOLD} title={<>Decision record: one number ranks a crew, and three more stand next to it</>}>
          <p style={{ margin: 0 }}>
            <strong>The alternatives.</strong> <em>Village damage alone</em> would crown soaking, a rule that lets the
            forest burn. <em>How often the village is untouched</em> is coarser still: losing one village cell counts the
            same as losing nine. <em>Cells burnt</em> would crown the nearest chief, which loses two and a half times as
            much village as guard. <em>Cells put out</em> would crown nearest too, and the cobra-effect page shows what
            happens when a crew is paid for it.
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>The decision.</strong> A crew is ranked by its <strong>return on the 200 held-out worlds</strong>,
            because that is the number it is trained to raise, and it is always printed beside village damage, untouched
            and cells burnt. The return already prices the trade the table shows. Drop-then-guard saves 0.61 village cells,
            worth about 6 points at 10 each, and burns 18.9 more cells, costing about 19. Net, it is 12.6 points behind
            guard. So the bar for a crew is guard&rsquo;s −93.2, and a crew that clears it must also say what it traded to
            get there. Whether 10 is the right price for a village cell is not a question a baseline can answer; the reward
            page later in this chapter takes it on.
          </p>
        </Callout>

        <h2>How big a gap is real?</h2>
        <p>
          Guard beats nearest by 1.61 village cells on average. Is that a real difference or luck with these 200 worlds?
          The worlds vary enormously — a fire that starts beside the village is hard for every rule — and that variation
          swamps most gaps between rules. But every rule here faces <em>the same</em> 200 worlds, and, as the{" "}
          <Link href="/learn/building-environments/coupled-clocks" style={link}>coupled-clocks page</Link> set up, the fire
          draws its dice in fixed amounts whatever the helicopter does. So the rules can be compared world by world, and the
          difficulty of each world cancels out of the difference.
        </p>
        <p>
          The next cell does that for guard against nearest. It also tests one more rule: a guard chief that reads the wind,
          counting a fire as closer to the village when the wind is blowing it that way. The{" "}
          <Link href="/learn/building-environments/wind-moisture-and-slope" style={link}>wind page</Link> found that guard
          saves the village every time when the starting wind blows away from it, and 58% of the time when it blows toward
          it — information neither chief reads.
        </p>

        <CodeBlock setup={WILDFIRE_SETUP} fromScratch={codePaired} />
        <CodeOutput>{`guard minus nearest, village cells damaged: -1.61   standard error 0.317 on separate worlds, 0.216 paired  (2.1x fewer worlds)
guard minus nearest, return: +15.39   standard error 8.404 on separate worlds, 3.864 paired  (4.7x fewer worlds)
  village: guard better in 30.0% of worlds, the same in 67.5%, worse in 2.5%
wind guard minus guard, village cells damaged: +0.00   standard error 0.226 on separate worlds, 0.119 paired  (3.6x fewer worlds)
wind guard minus guard, return: -1.84   standard error 7.390 on separate worlds, 2.932 paired  (6.4x fewer worlds)
  village: wind guard better in 10.5% of worlds, the same in 76.5%, worse in 13.0%`}</CodeOutput>

        <p>
          <strong>Guard against nearest.</strong> The gap of 1.61 village cells is more than seven paired standard errors,
          so it is real. Pairing shrank the standard error from 0.317 to 0.216. Getting that precision from separate worlds
          would take 2.1 times as many. On the return, where the size of each world&rsquo;s fire dominates, the saving is
          4.7 times. The world-by-world count says the same thing more plainly: guard is better in 30% of worlds and worse
          in only 2.5%.
        </p>
        <p>
          <strong>The wind guard is an honest null.</strong> It changes the outcome in 23.5% of worlds, better in 10.5% and
          worse in 13%, and the changes cancel. The difference in village damage is 0.00, and in return −1.84 with a paired
          standard error of 2.93. Reading the wind this simply does not help. That does not mean the wind is useless. It
          means the obvious rule does not use it well, which leaves a real question for the last page of this chapter:
          does a trained crew read the wind layers, and does it gain from them?
        </p>

        <Callout color={GOLD} title={<>Decision record: 200 fixed worlds, compared world by world</>}>
          Every baseline and every crew is scored on the same 200 held-out seeds, and gaps are judged by the paired
          standard error. A gap of about two paired standard errors is the smallest we call real: for rules like these,
          roughly 0.4 village cells, or about 8 points of return. On its own, guard&rsquo;s 77% of villages untouched carries
          a 95% band of about ±6 points, which is why this page never compares two rules by their headline percentages. We
          considered more worlds. Each baseline takes a few seconds per 200 worlds, but every trained crew must be tested
          the same way, and pairing already buys 2 to 6 times the worlds for free. When a later gap is smaller than this
          resolution, the page will say so rather than add worlds after the fact.
        </Callout>

        <LabFrame
          accent={GOLD}
          tryThis={<>Start with the defaults: guard against nearest on cells burnt, same dice. Then switch to{" "}
            <strong>different dice</strong> and run again. Then race the one-drop rules against guard on both measures.</>}
          insight={<>On the lab map, guard and nearest burn almost the same area, 144.5 and 141.4 cells. Treated as separate
            runs, the standard error of that 3-cell gap is 4.57; fire by fire it is 2.49, the work of 3.4 times as many fires,
            and still not enough to call it. With different dice the advantage vanishes. The lab map is not the
            environment&rsquo;s worlds — it has one terrain, one wind and the same two starting fires — and the one-drop trick is
            even stronger here: one drop, then guard, loses 0.41 village cells to guard&rsquo;s 1.33, and burns more cells than
            guard in 166 of 200 fires.</>}
        >
          <ChiefRaceLab />
        </LabFrame>

        <h2>If a row had come out differently</h2>
        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Surprise</th><th style={th}>What it would have meant</th>
              </tr>
            </thead>
            <tbody>
              {SURPRISES.map(([s, m], i) => (
                <tr key={i} style={{ borderBottom: i < SURPRISES.length - 1 ? "1px solid var(--border)" : undefined }}>
                  <td style={td}>{s}</td><td style={td}>{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>The bar</h2>
        <p>
          The world passes its baseline tests, with one surprise explained rather than fixed. A crew now has a bar to clear:
          a return better than guard&rsquo;s −93.2 on the 200 held-out worlds, by more than about 8 points to be sure, reported
          beside its village damage, untouched villages and cells burnt. And it has a trap to avoid: one drop at step 0
          already buys most of the village protection that fighting the fire does. The next page trains a crew on the
          pilot&rsquo;s controls and finds out which it gets.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/invariants-and-property-tests", label: <>← Invariants and property tests</> }}
          next={{ href: "/learn/building-environments/the-crew-that-learned-nothing", label: <>The crew that learned nothing →</> }}
        />
      </div>
    </article>
  );
}

// [rule, village, untouched, burnt, return]; "*" marks the best in its column
const TABLE: [string, string, string, string, string][] = [
  ["Stand by", "6.79", "20.0%", "169.4", "−235.2"],
  ["Random buttons", "3.55", "39.0%", "152.9", "−186.4"],
  ["One drop, then hover", "2.81", "44.0%", "152.2", "−178.3"],
  ["Nearest fire", "2.65", "65.0%", "*82.9", "−108.5"],
  ["Guard the village", "1.03", "77.0%", "83.7", "*−93.2"],
  ["Soak the village", "0.45", "79.0%", "142.7", "−145.8"],
  ["Drop, then guard", "*0.42", "*84.0%", "102.6", "−105.8"],
];

const SURPRISES: [string, string][] = [
  ["Standing by reaches the 300-step limit", "A burn timer that never runs down, or cells that relight forever — the fire should always burn out"],
  ["Standing by puts out a cell", "The put-out count or the drop runs without the button — bookkeeping is wrong"],
  ["Random buttons with an empty bucket beat standing by", "A drop works with no water in the bucket, or the empty start is not applied"],
  ["Guard loses more village than nearest", "Guard is not aiming at the fire nearest the village — its target or its distance is wrong"],
  ["A return far from −(cells burnt) − 10 × (village cells damaged)", "The reward is not charging what the brief says; only re-ignitions and the two starting fires should separate them"],
];

const codeLadder = `rng = np.random.default_rng(0)
rules = [
    ("stand by (hover)",        lambda env: 0),
    ("press random buttons",    lambda env: int(rng.integers(6))),
    ("fly to the nearest fire", pilot_chief("nearest")),
    ("guard the village",       pilot_chief("guard")),
]

# fly() plays each rule on the same 200 held-out worlds (seeds 1000-1199) and averages over them.
print(f"{'rule':24s} {'village':>8s} {'untouched':>10s} {'burnt':>6s} {'put out':>8s} {'steps':>6s} {'return':>7s}")
for name, policy in rules:
    s = fly(policy)
    print(f"{name:24s} {s['village_damaged']:8.2f} {s['village_saved']:10.1%} {s['burnt']:6.1f} "
          f"{s['put_out']:8.1f} {s['steps']:6.1f} {s['ret']:7.1f}")`;

const codeWhy = `def village_damage(policy, empty_start=False):
    "Mean village cells damaged over the 200 held-out worlds, optionally with the bucket empty at the start."
    damaged = []
    for seed in range(1000, 1200):
        env = Wildfire(); env.reset(seed=seed)
        if empty_start: env.water = 0
        while True:
            _, _, terminated, truncated, _ = env.step(policy(env))
            if terminated or truncated: break
        damaged.append(env.summary()["village_damaged"])
    return np.mean(damaged)

rng = np.random.default_rng(0)
random_buttons = lambda env: int(rng.integers(6))
print(f"random buttons, bucket full at the start    {village_damage(random_buttons):.2f}")
rng = np.random.default_rng(0)
print(f"random buttons, bucket empty at the start   {village_damage(random_buttons, empty_start=True):.2f}")
print(f"one drop on the village, then hover         {village_damage(lambda env: 5 if env.t == 0 else 0):.2f}")

# Why one drop does so much: every catch chance is multiplied by (1 - moisture).
before, after = [], []
for seed in range(1000, 1200):
    env = Wildfire(); env.reset(seed=seed)
    village = env.T == VILLAGE
    before.append(env.M[village].mean())
    env.step(5)
    after.append(env.M[village].mean())
m0, m1 = np.mean(before), np.mean(after)
print(f"village moisture {m0:.3f} -> {m1:.3f}; the (1 - moisture) in its catch chance {1 - m0:.3f} -> {1 - m1:.3f}")
print(f"drying {DRYING} a fire tick, it takes {(m1 - m0) / DRYING:.0f} fire ticks ({FIRE_EVERY * (m1 - m0) / DRYING:.0f} steps) to dry back")`;

const codeStack = `def to_lake(env):
    lake = np.argwhere(env.T == LAKE)
    return toward(env.pos, lake[np.abs(lake - env.pos).sum(1).argmin()])

def soak_the_village(env):
    "Keep the village wet: fill, fly to the middle of the village, drop, repeat. Never fight the fire."
    if env.water == 0: return to_lake(env)
    return toward(env.pos, np.argwhere(env.T == VILLAGE)[4])    # the middle of the 3 x 3 village

guard = pilot_chief("guard")
def drop_then_guard(env):
    "One drop on the village at the first step, then the guard chief."
    return 5 if env.t == 0 else guard(env)

print(f"{'rule':24s} {'village':>8s} {'untouched':>10s} {'burnt':>6s} {'put out':>8s} {'steps':>6s} {'return':>7s}")
for name, policy in [("soak the village", soak_the_village), ("drop, then guard", drop_then_guard)]:
    s = fly(policy)
    print(f"{name:24s} {s['village_damaged']:8.2f} {s['village_saved']:10.1%} {s['burnt']:6.1f} "
          f"{s['put_out']:8.1f} {s['steps']:6.1f} {s['ret']:7.1f}")`;

const codePaired = `def per_world(policy):
    "Village cells damaged and return in each of the 200 held-out worlds, in order."
    village, returns = [], []
    for seed in range(1000, 1200):
        env = Wildfire(); env.reset(seed=seed); G = 0.0
        while True:
            _, r, terminated, truncated, _ = env.step(policy(env)); G += r
            if terminated or truncated: break
        village.append(env.summary()["village_damaged"]); returns.append(G)
    return np.array(village), np.array(returns)

def wind_guard(env):
    "The guard chief, but a fire's distance to the village counts less when the wind blows it that way."
    if env.water == 0:
        lake = np.argwhere(env.T == LAKE)
        return toward(env.pos, lake[np.abs(lake - env.pos).sum(1).argmin()])
    fire = np.argwhere(env.S == BURNING)
    if len(fire) == 0: return 0
    gap = np.argwhere(env.T == VILLAGE).mean(0) - fire          # from each fire to the village
    dist = np.hypot(*gap.T) + 1e-9                               # + a hair: a fire can sit on the village centre
    push = (gap[:, 0] * -np.cos(env.wdir) + gap[:, 1] * np.sin(env.wdir)) / dist
    return toward(env.pos, fire[(dist / np.exp(WIND_GAIN * env.wspd * push)).argmin()])

def compare(name_a, a, name_b, b):
    n = len(a[0])
    for what, x, y in (("village cells damaged", a[0], b[0]), ("return", a[1], b[1])):
        d = x - y
        separate = np.sqrt(x.var(ddof=1) / n + y.var(ddof=1) / n)   # as if each rule had its own 200 worlds
        paired = d.std(ddof=1) / np.sqrt(n)                         # the same 200 worlds for both
        print(f"{name_a} minus {name_b}, {what}: {d.mean():+.2f}   standard error {separate:.3f} on separate worlds, "
              f"{paired:.3f} paired  ({(separate / paired) ** 2:.1f}x fewer worlds)")
    better, worse = np.mean(a[0] < b[0]), np.mean(a[0] > b[0])
    print(f"  village: {name_a} better in {better:.1%} of worlds, the same in {1 - better - worse:.1%}, worse in {worse:.1%}")

nearest, guard, windy = per_world(pilot_chief("nearest")), per_world(pilot_chief("guard")), per_world(wind_guard)
compare("guard", guard, "nearest", nearest)
compare("wind guard", windy, "guard", guard)`;

const h3: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, color: "var(--ink)", margin: "1.6rem 0 0.5rem" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thr: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5, verticalAlign: "top" };
const tdr: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const best: React.CSSProperties = { color: "var(--ink)", fontWeight: 700 };
