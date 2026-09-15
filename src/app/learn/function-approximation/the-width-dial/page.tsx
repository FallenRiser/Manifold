import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Curve } from "@/components/figures/fa/Curve";
import { WIDTH_DIAL } from "@/components/figures/fa/data";

export const metadata = {
  title: "The width dial — Manifold",
  description:
    "Tile width decides how far one update travels. Wide tiles learn 3x faster in the opening episodes and finish coarser; narrow tiles start slow and land in between. Measured on Mountain Car across five seeds — and the number of tilings turns out to matter far more than the width of any one of them.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheWidthDial() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 10 minutes"
        title={<>The width dial: how far should experience spread?</>}
        intro={<>Generalisation is not free and it is not automatic — it is a setting. With tile coding that
          setting is the width of a tile, and it decides how much of the valley one update teaches. Turn it too
          far either way and the agent pays, in different currencies.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What the width actually controls</h2>
        <p>
          Mountain Car&rsquo;s position axis spans 1.8 units. Lay 8 tilings of 8×8 tiles over it and each tile
          covers about 0.257 of that span; go to 16×16 and each covers 0.120; drop to 4×4 and each covers 0.600 —
          a third of the whole world in one feature.
        </p>
        <p>
          An update to a state changes the weights of the 8 tiles that state activates, so it changes the estimate
          of <em>every other state sharing any of those tiles</em>. The tile width is therefore the radius of
          influence of a single experience: how far the agent assumes what it just learned remains true.
        </p>

        <Proof title="Why width is a claim about how similar nearby states are">
          <p>
            <strong>Step 1 — what one update does.</strong> With <M>n</M> tilings and step size{" "}
            <M>{String.raw`\beta = \alpha/n`}</M>, an update at state <M>s</M> with error{" "}
            <M>{String.raw`\delta`}</M> adds <M>{String.raw`\beta\delta`}</M> to each of the <M>n</M> weights
            that <M>s</M> activates.
          </p>
          <p>
            <strong>Step 2 — what a neighbour sees.</strong> From the{" "}
            <Link href="/learn/function-approximation/what-generalisation-costs" style={link}>interference
            identity</Link>, the change at another state <M>s'</M> is{" "}
            <M>{String.raw`\beta\delta\,\mathbf{x}(s')^\top\mathbf{x}(s)`}</M> — and for binary tile features that
            inner product is simply <em>how many tiles the two states share</em>.
          </p>
          <p>
            <strong>Step 3 — count the shared tiles.</strong> The tilings are offset by{" "}
            <M>{String.raw`d/n`}</M> each, where <M>d</M> is the tile width. Two states a distance{" "}
            <M>x</M> apart fall in the same tile in roughly <M>{String.raw`n(1 - x/d)`}</M> of the tilings, until{" "}
            <M>{String.raw`x \ge d`}</M>, where they share none:
          </p>
          <MathBlock>{String.raw`\Delta \hat q(s') \approx \alpha\,\delta\left(1 - \frac{x}{d}\right)_{\!+}`}</MathBlock>
          <p>
            <strong>Step 4 — read the dial.</strong> Generalisation falls off linearly and stops exactly at one
            tile width. So <M>d</M> is a <em>prior</em>: it asserts that states within <M>d</M> of each other have
            similar values, and that states further apart tell you nothing. Wide <M>d</M> spreads every lesson
            far — fast early, but it cannot represent detail finer than <M>{String.raw`d/n`}</M>. Narrow{" "}
            <M>d</M> keeps detail and teaches almost nobody per update.
          </p>
        </Proof>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Eight tilings, tiles of 4×4, 8×8 or 16×16, on Mountain Car. Which one gets through its{" "}
            <strong>first 20 episodes</strong> quickest?</>}
          options={["4x4 — widest tiles", "8x8 — the default", "16x16 — finest detail", "About the same"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`8 tilings of     weights/action   first 20 episodes   episodes 81-100
   4x4 , 0.600 wide        128         243.8 steps       144.1 steps
   8x8 , 0.257 wide        512         398.8 steps       148.1 steps
  16x16, 0.120 wide       2048         730.8 steps       235.8 steps`}</CodeOutput>

        <p>
          The widest tiles are <strong>3× faster</strong> out of the gate — 243.8 steps per episode against 730.8
          for the finest — and it is not close. With 128 weights per action, almost every update the 4×4 agent
          makes moves a large fraction of the state space at once. The 16×16 agent has 2,048 weights per action to
          fill, and each experience fills a sixteenth as much of the space, so it spends its opening episodes
          flailing.
        </p>
        <p>
          By episodes 81–100 the order has changed: the two coarser settings have converged to about 145 steps
          while 16×16 is still at 235.8. Fine tiles are not <em>better</em> here — they are slower, and 100
          episodes is not enough for them to cash in their extra resolution.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Three tile sizes on Mountain Car, 8 tilings each, averaged over 5 seeds: 4×4
            (coarse, 128 weights), 8×8 (512), 16×16 (fine, 2048). Which learns fastest in
            the first 20 episodes, and which is best after 200?</>}
          options={[
            "Fine is best at both — more resolution is more accuracy",
            "Coarse is fastest early; fine is best at the end",
            "Coarse is fastest early, and 8×8 is best at the end",
            "They are indistinguishable once averaged over seeds",
          ]}
          nudge="Locked in. All three curves are below."
        />

        <Curve
          x={WIDTH_DIAL.x}
          series={WIDTH_DIAL.series}
          xlabel="episode (10-episode moving average, 5 seeds)"
          ylabel="steps to the goal"
          caption={<>The dial, and the trade it actually controls. The coarse coder starts far
            better — <strong>237.7</strong> steps over the first 20 episodes against the fine
            coder&rsquo;s <strong>710.0</strong> — because 128 weights get evidence sixteen times
            faster than 2,048 do. And it finishes worst: <strong>170.9</strong> over the last 50,
            against 143.1 for 8×8. Resolution is not a quality setting, it is a position on a
            speed-versus-ceiling curve, and the best final score here belongs to neither extreme.</>}
        />

        <h2>One seed is not a result</h2>
        <p>
          Those numbers come from a single training seed, and Mountain Car is noisy. So we ran the same three
          settings across five seeds at 200 episodes (<code>scripts/fa_cases.py ch3</code>):
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>8 tilings of</th><th style={thR}>first 20 episodes</th>
                <th style={thR}>last 50 episodes</th><th style={thR}>total steps</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>4×4 &nbsp;(0.600 wide)</td><td style={{ ...tdR, fontWeight: 600 }}>237.7 ± 12.1</td>
                <td style={tdR}>170.9 ± 26.6</td><td style={{ ...tdR, fontWeight: 600 }}>33,628</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>8×8 &nbsp;(0.257 wide)</td><td style={tdR}>394.4 ± 8.5</td>
                <td style={{ ...tdR, fontWeight: 600 }}>143.1 ± 4.2</td><td style={tdR}>34,561</td>
              </tr>
              <tr>
                <td style={td}>16×16 (0.120 wide)</td><td style={tdR}>710.0 ± 13.0</td>
                <td style={tdR}>156.7 ± 6.4</td><td style={tdR}>52,504</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -6 }}>
          Mean ± standard deviation over 5 training seeds, 200 episodes each.
        </p>

        <p>
          The early-speed effect is enormous and rock solid: 237.7 against 710.0, with standard deviations near
          ten. The final-performance effect is real but small: 143.1 for 8×8 against 156.7 for 16×16 is about two
          standard deviations apart, so the middle setting genuinely wins — modestly.
        </p>
        <p>
          The interesting row is 4×4, at <strong>170.9 ± 26.6</strong>. That standard deviation is six times the
          others, and the per-seed numbers say why: 156.2, 157.7, 163.2, <strong>223.8</strong>, 153.7. Four runs
          finished fine and one got stuck. Very wide tiles cannot separate states that need different actions, so
          whether a given run ends up trapped depends on the seed. <strong>Coarse features do not just cost you
          accuracy on average — they cost you reliability.</strong>
        </p>

        <Callout color={GOLD} title={<>Width and resolution are two dials, and the other one matters more</>}>
          Tile <em>width</em> sets how far a lesson travels. The <em>number of tilings</em> sets how finely you can
          still tell states apart despite that width — that was the whole trick of{" "}
          <Link href="/learn/function-approximation/tile-coding" style={link}>coarse coding</Link>. It is easy to
          spend your time tuning the first and forget the second.
          <br /><br />
          Turn the second one down and everything collapses: a <strong>single</strong> 8×8 tiling, instead of
          eight offset ones, averages <strong>2,067.6</strong> steps over its last 50 episodes — against 146.4
          for the eight-tiling version with tiles of exactly the same size. That is a 14× difference from the dial
          nobody talks about.
        </Callout>

        <h2>So how do you pick?</h2>
        <p>
          There is no width that is right in the abstract, because the dial trades three things that different
          projects weigh differently. If you have few episodes, go wide: 4×4 does its best work early and its
          total-step count (33,628) is the lowest of the three. If you need a good final policy, the middle
          setting won. If you need <em>reliable</em> final policies, avoid the extremes — the coarse setting is
          the one that failed a seed.
        </p>
        <p>
          What is not negotiable is measuring it. Every claim on this page would have been wrong, or
          unjustifiably confident, from one seed: the 4×4 fragility would have looked like a good result four
          times out of five.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/mountain-car", label: <>← Mountain Car: what it actually learned</> }}
          next={{ href: "/learn/function-approximation/what-generalisation-costs", label: <>Next · What generalisation costs you →</> }}
        />
      </div>
    </article>
  );
}

const code = `print("8 tilings of     weights/action   first 20 episodes   episodes 81-100")
for tiles in (4, 8, 16):
    w, coder, lengths = train_mc_sarsa(episodes=100, tilings=8, tiles=tiles)
    print(f"  {tiles:>2d}x{tiles:<2d}, {coder.width[0]:.3f} wide {coder.size:10d}"
          f"   {lengths[:20].mean():11.1f} steps   {lengths[-20:].mean():9.1f} steps")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
