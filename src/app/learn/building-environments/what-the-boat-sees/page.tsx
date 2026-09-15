import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ENV_SETUP } from "@/lib/runtimeSetup";
import { LabFrame } from "@/components/LabFrame";
import { ViewLab } from "@/components/sail/ViewLab";

export const metadata = {
  title: "Designing what the boat sees — Manifold",
  description:
    "The environment reports everything; the agent's table needs a finite index. Three views of the same boat, five training runs each: where-am-I 140.8 ± 39.4 finishes, where-is-the-mark 175.8 ± 13.7, and adding speed — the physically complete view — 168.6 ± 28.5 with three times the table. Why the shipped view wins, and why one training run would have picked the wrong one.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatTheBoatSees() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 14 minutes"
        title={<>Designing what the boat sees</>}
        intro={<>The environment hands back four real numbers every second: position, heading, speed. A table-based agent
          cannot use real numbers — it needs to turn each moment into one cell of a finite table. How you do that
          decides what the agent can learn, how fast, and what it can never tell apart. It is the decision the very
          first version of this boat got wrong.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>A view is a question the agent asks</h2>
        <p>
          Every way of indexing the table answers a question about the boat. We tried three, and each one is a
          reasonable thing to try first:
        </p>
        <ol style={{ lineHeight: 1.7 }}>
          <li>
            <strong>&ldquo;Where am I?&rdquo;</strong> — heading in 10° slices, plus the boat&rsquo;s position on a
            10-metre grid. 5,184 cells. This is the view most people build first, because it is literally the state.
          </li>
          <li>
            <strong>&ldquo;Where is the mark, from here?&rdquo;</strong> — heading in 10° slices, the bearing of the mark
            in 15° slices, and which of six distance bands it is in. Also 5,184 cells. This is what ships.
          </li>
          <li>
            <strong>&ldquo;Where is the mark, and how fast am I going?&rdquo;</strong> — the second view plus three bands
            of speed. 15,552 cells. The physically complete one: the boat has momentum, so speed genuinely affects what
            happens next.
          </li>
        </ol>
        <p>
          The shipped view is the <code>observe</code> function in the setup. Its bin sizes were chosen, not tuned,
          and each has a reason: heading slices of 10° match the helm, so every action moves the boat into a new
          heading cell; distance bands are narrow near the mark (edges at 15, 30 and 50 m) because that is where one
          decision decides whether the boat rounds it, and wide far away where a few metres change nothing.
        </p>

        <h2>The mechanism, before any training</h2>
        <p>
          A table learns each cell separately. So the real question about a view is: <em>when two moments deserve the
          same decision, do they land in the same cell?</em> Here are two boats in exactly the same situation — same
          heading, the mark on the same bearing, both in the 30–50 m band — but ten metres apart on the water.
        </p>

        <CodeBlock setup={ENV_SETUP} fromScratch={codeView} />
        <CodeOutput>{`boat A at (-12.0,  27.1)   boat B at (-15.4,  17.7)   both heading 40
  absolute view:  A -> cell  3221   B -> cell  3220   same cell: False
  relative view:  A -> cell  3248   B -> cell  3248   same cell: True

cells the expert visits in 200 races:  absolute  257   relative  157`}</CodeOutput>

        <p>
          In the relative view, whatever the boat learns at A is already known at B. In the absolute view, A and B are
          strangers: the lesson has to be learned twice, from two separate batches of experience. The second result
          scales that up. Perfect sailing across 200 races passes through <strong>257 absolute cells but only 157
          relative ones</strong>. Fewer cells for the same behaviour means each cell gets more of the experience, and
          it means the table can fill in faster.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Drag boat B along the line from the mark through A, then off to one side. Flip between the two views as you go.</>}
          insight={<>In the shipped view a cell is a wedge pointing at the mark, so every boat on the same bearing and in the same
            band shares it, however far apart they are. In the other view a few metres in any direction starts a new cell. The
            wedges also shrink near the mark, where one decision matters most.</>}
        >
          <ViewLab />
        </LabFrame>
        <p>
          There is also a flaw in the absolute view that the numbers here cannot show. Nothing in &ldquo;where am
          I?&rdquo; says where the <em>mark</em> is. It only works because the mark never moves. Move the mark and every
          cell the agent learned would point it at the old spot, while the relative view would carry straight over. We
          did not build a moving mark, so treat that as a reason, not a result.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The third view adds speed — the one variable the boat&rsquo;s physics depends on that the shipped view
            leaves out. Trained the same way, does it finish more races than the shipped view?</>}
          options={["Clearly more — the view is now complete", "About the same", "Fewer — the table is too big to fill", "It fails completely"]}
        />

        <h2>Five training runs each</h2>
        <p>
          Same boat, same reward (payment for distance gained), same 2000 practice races, same step size — only the
          view differs. Each view was trained five times with different seeds and tested on the usual 200 held-out
          races.
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>View</th><th style={thR}>cells</th><th style={thR}>finishes of 200</th><th style={th}>per training run</th><th style={thR}>cells visited*</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>where am I</td><td style={tdR}>5,184</td><td style={tdR}>140.8 ± 39.4</td>
                <td style={tdMono}>185 · 81 · 120 · 135 · 183</td><td style={tdR}>3,219</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ ...td, color: "var(--ink)", fontWeight: 600 }}>where is the mark (shipped)</td><td style={tdR}>5,184</td>
                <td style={{ ...tdR, fontWeight: 600 }}>175.8 ± 13.7</td>
                <td style={tdMono}>156 · 165 · 190 · 177 · 191</td><td style={tdR}>2,922</td>
              </tr>
              <tr>
                <td style={td}>… and how fast</td><td style={tdR}>15,552</td><td style={tdR}>168.6 ± 28.5</td>
                <td style={tdMono}>124 · 185 · 193 · 146 · 195</td><td style={tdR}>3,364</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 6 }}>
            * cells the table ever updated, for the training run with seed 4.
          </div>
        </div>

        <p>
          <strong>The relative view wins on both counts that matter:</strong> the most finishes on average, and by far
          the smallest spread between runs. The absolute view is worse on average, but its real problem is
          reliability — anywhere from 81 to 185 depending on the seed.
        </p>
        <p>
          <strong>And look at seed 0.</strong> The absolute view finished 185 races with it and the relative view 156.
          Had we trained each view once, with the same seed, we would have shipped the worse view with a clear
          conscience. It is the same trap the{" "}
          <Link href="/learn/function-approximation/reading-a-learning-curve" style={link}>Function approximation</Link>{" "}
          track catalogued: one seed is not a result.
        </p>
        <p>
          <strong>Adding speed was an honest null.</strong> 168.6 against 175.8 is inside the spread, so we cannot
          call it worse — but it certainly bought nothing, at three times the table. The last column hints at why:
          the speed view touched 3,364 of its 15,552 cells, about a fifth, so most of its extra resolution was never
          used, while what was used got split three ways. A plausible reason speed adds so little is that with{" "}
          <code>INERTIA</code> = 0.3 the boat&rsquo;s speed is mostly decided by its last few headings, which the view
          already captures; we have not tested that directly.
        </p>

        <Callout color={GOLD} title={<>Decision record: the shipped view is &ldquo;where is the mark&rdquo;, without speed</>}>
          Three measurements and one principle made this choice. It has the best mean (175.8) and the smallest spread
          (± 13.7) of the three, and the mechanism cell shows why: it groups moments that deserve the same decision.
          Speed was left out because it did not measurably help and tripled the table — and when a more complete view
          does not beat a smaller one, the smaller one wins, because every cell you add is a cell that needs its own
          experience. That judgement is specific to this boat: make it heavier, so momentum matters more, and speed
          would deserve a re-test.
        </Callout>

        <h2>A note on the first version</h2>
        <p>
          The <Link href="/learn/building-environments/plan-parameterise-code-test-train" style={link}>build log</Link>{" "}
          records that version 1, which used the absolute view, finished 0 races in 200. At the shipped settings the
          same kind of view finishes 140.8. Do not read that as &ldquo;the absolute view got better&rdquo;: version 1
          also had a 100 m course, a smaller step size and a different budget, so too many things changed at once to
          credit any one of them. That is the practical lesson of this page as much as the table is — a view is only
          good or bad <em>relative to everything else in the world</em>, so every time you change the world, measure
          the view again.
        </p>

        <PrevNext
          prev={{ href: "/learn/building-environments/paying-the-boat", label: <>← Paying the boat: −1 per second, investigated</> }}
          next={{ href: "/learn/building-environments/the-agent-invents-tacking", label: <>Next · The agent invents tacking →</> }}
        />
      </div>
    </article>
  );
}

const codeView = `def view_absolute(o, env):
    "Where am I on the course? Heading x 10 m column x 10 m row."
    x, y, h, u = o
    hi = int((h + 180) // 10) % 36
    xi = min(11, max(0, int((x + 60) // 10)))
    yi = min(11, max(0, int((y + 30) // 10)))
    return (hi * 12 + xi) * 12 + yi

env = Sail(); env.reset(seed=0)

# Two boats in the SAME situation relative to the mark - same heading, the mark on the same
# bearing (20 degrees, measured from the wind like the heading), same distance band (30-50 m) -
# but at different places on the water.
b = math.radians(20)
A = (env.mx - 35 * math.sin(b), env.my - 35 * math.cos(b), 40.0, 2.0)
B = (env.mx - 45 * math.sin(b), env.my - 45 * math.cos(b), 40.0, 2.0)
print(f"boat A at ({A[0]:5.1f}, {A[1]:5.1f})   boat B at ({B[0]:5.1f}, {B[1]:5.1f})   both heading 40")
print(f"  absolute view:  A -> cell {view_absolute(A, env):5d}   B -> cell {view_absolute(B, env):5d}   same cell: {view_absolute(A, env) == view_absolute(B, env)}")
print(f"  relative view:  A -> cell {observe(A, env):5d}   B -> cell {observe(B, env):5d}   same cell: {observe(A, env) == observe(B, env)}")

# How many different cells does good sailing actually pass through, in each view?
seen_abs, seen_rel = set(), set()
for k in range(200):
    e = Sail(); o, _ = e.reset(seed=10**6 + k); helm = expert(e)
    while True:
        seen_abs.add(view_absolute(o, e)); seen_rel.add(observe(o, e))
        o, r, terminated, truncated, info = e.step(helm(o))
        if terminated or truncated: break
print()
print(f"cells the expert visits in 200 races:  absolute {len(seen_abs):4d}   relative {len(seen_rel):4d}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 12px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
const tdMono: React.CSSProperties = { ...td, fontFamily: "ui-monospace, monospace" };
