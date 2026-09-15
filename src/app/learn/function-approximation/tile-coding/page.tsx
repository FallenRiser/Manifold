import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { TileCoding as TileCodingFigure } from "@/components/figures/fa/TileCoding";
import { Staircase } from "@/components/figures/fa/Staircase";
import { WALK_STATES, TILES_VS_AGG } from "@/components/figures/fa/data";

export const metadata = {
  title: "Coarse coding & tile coding — Manifold",
  description:
    "Aggregation ties generalisation and resolution to one knob. Let the groups overlap and they come apart: tiles stay wide while their intersections get narrow. At the same tile width, 50 offset tilings cut the error 2.35x — and a lesson about step sizes that nearly made tile coding look worse than it is.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TileCoding() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 10 minutes"
        title={<>Coarse coding &amp; tile coding</>}
        intro={<>The resolution dial had a flaw: coarse groups generalise broadly but can only draw a staircase,
          fine groups draw sharply but barely share. You could not have both. Let the groups <em>overlap</em> and
          you can — and the result is the feature map that did more for practical reinforcement learning than
          almost anything else before deep networks.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Coarse coding: overlapping receptive fields</h2>
        <p>
          Scatter a set of regions — call them <strong>receptive fields</strong> — over the state space, and let
          them overlap. Each field is a binary feature: 1 if the state falls inside it, 0 if not. A state now
          activates <em>every</em> field that contains it, not just one.
        </p>
        <p>
          Two states that sit close together share most of their active fields, so an update to one moves the
          other a lot. Two states far apart share few or none, so they barely affect each other. The{" "}
          <strong>size</strong> of the fields sets how far generalisation reaches; the <strong>density</strong> of
          the overlaps sets how finely you can discriminate. Those were one knob in aggregation. Here they are two.
        </p>

        <TileCodingFigure
          caption={<>Three tilings over a two-dimensional state space, drawn with the offsets the
            shipped <code>TileCoder</code> computes: tiling <em>i</em> is displaced by{" "}
            <M>{String.raw`i/n`}</M> of a tile along the first axis and{" "}
            <M>{String.raw`3i/n`}</M> along the second. The single point (●) falls in one cell of
            each grid, so it activates three weights out of the whole array. Two nearby points share
            most of those cells; two distant ones share none. That is the generalisation, and the
            asymmetric offsets are what keep it from collapsing along a diagonal.</>}
        />

        <h2>Tile coding: the version you can compute fast</h2>
        <p>
          Arbitrary scattered fields are awkward to compute with. <strong>Tile coding</strong> imposes structure:
          lay down a grid of tiles — a <em>tiling</em> — then lay down several more, each shifted by a fraction of a
          tile. Every state falls in exactly one tile per tiling, so with <M>n</M> tilings a state has exactly{" "}
          <M>n</M> active features, and its value is just the sum of those <M>n</M> weights:
        </p>
        <MathBlock>{String.raw`\hat v(s,\mathbf{w}) = \sum_{i=1}^{n} w_{\,\text{tile}_i(s)}`}</MathBlock>
        <p>
          Every tile is wide, so experience spreads broadly. But the region where a particular set of{" "}
          <M>n</M> tiles all overlap is narrow — roughly a tile width divided by <M>n</M>. So the function you can
          draw has fine steps, even though no single feature is fine. <strong>Wide features, narrow
          resolution.</strong>
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Keep every tile exactly <strong>200 states wide</strong>, and compare one tiling against fifty
            offset tilings. Same step size, same 5000 episodes. How much does the overlap buy?</>}
          options={["Nothing — same width, same generalisation", "A little", "About 2x lower error", "Over 10x lower error"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{` 1 tiling(s), each tile 200 states wide,   6 weights  ->  RMSE(mu) 0.1106
50 tiling(s), each tile 200 states wide, 300 weights  ->  RMSE(mu) 0.0471`}</CodeOutput>

        <p>
          <strong>2.35× lower error</strong>, at the same tile width. Nothing about how far experience travels
          changed — every tile still spans 200 states. What changed is that fifty staggered tilings carve the space
          into far smaller overlap regions, so the learned curve can follow the true S-shape instead of stepping
          around it in six big blocks.
        </p>
        <p>
          The single-tiling case is not a straw man, either: it <em>is</em> state aggregation, with six groups.
          Tile coding is aggregation, repeated with offsets and summed.
        </p>

        <h2>Against the best aggregation — and a step-size trap</h2>
        <p>
          The fair question is whether tile coding beats aggregation <em>at its best</em>, not at an arbitrary
          setting. So we swept both, at the same 5000-episode budget, across widths and two step sizes:
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Features (5000 episodes)</th><th style={thR}>α = 10⁻³</th><th style={thR}>α = 3×10⁻⁴</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>Aggregation, 10 groups</td><td style={tdR}>0.0777</td><td style={tdR}>0.0649</td></tr>
              <tr style={{ borderBottom: "2px solid var(--border)" }}><td style={td}>Aggregation, 20 groups</td><td style={tdR}>0.0536</td><td style={tdR}>0.0548</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>50 tilings, tiles 200 wide</td><td style={{ ...tdR, color: "var(--bad)" }}>0.0734</td><td style={tdR}>0.0471</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>50 tilings, tiles 100 wide</td><td style={tdR}>0.0575</td><td style={tdR}>0.0455</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>50 tilings, tiles 50 wide</td><td style={tdR}>0.0475</td><td style={tdR}>0.0555</td></tr>
              <tr><td style={td}>50 tilings, tiles 25 wide</td><td style={{ ...tdR, fontWeight: 600 }}>0.0434</td><td style={{ ...tdR, color: "var(--bad)" }}>0.0970</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -6 }}>
          Reproduced by <code>scripts/fa_cases.py ch2</code>. RMSE weighted by the on-policy distribution.
        </p>

        <p>
          The best tile coding, <strong>0.0434</strong>, beats the best aggregation, <strong>0.0536</strong>. So the
          answer is yes. But look at <em>which</em> step size wins in each row — it flips. Wide tiles want the
          small step; narrow tiles want the large one. Narrow tiles are each visited less often, so each needs a
          bigger nudge per visit to learn at all.
        </p>

        <Callout color={GOLD} title={<>The trap we nearly fell into</>}>
          The first time we ran this comparison, we used α = 10⁻³ for everything. Tile coding with 200-wide tiles
          scored <strong>0.0734</strong> — worse than plain 20-group aggregation at 0.0536. Had we stopped there,
          this page would have argued that tile coding is overrated.
          <br /><br />
          It was not the features losing. It was the step size, which suited one representation and not the other.{" "}
          <strong>A comparison of feature sets at one fixed step size is really a comparison of step sizes.</strong>{" "}
          The fix is the one the{" "}
          <Link href="/learn/warehouse-robot-capstone/tuning-protocol" style={link}>warehouse capstone</Link> made a
          Playbook rule: tune each contender, then compare their best.
        </Callout>

        <Staircase
          x={WALK_STATES}
          lines={TILES_VS_AGG}
          ylabel="vπ(s)"
          xlabel="state"
          caption={<>The same problem, the same figure, one representation swapped. Fifty overlapping
            tilings reach a best-possible error of <strong>0.0009</strong> against aggregation&rsquo;s
            0.0544 — sixty times lower — and the reason is visible rather than numeric: the overlap
            lets the fitted function take a <em>slope</em>. Aggregation can only step. Nothing about
            the capacity argument explains this; 550 weights against 10 would predict a better fit,
            but not a differently shaped one.</>}
        />

        <h2>Why practitioners loved it</h2>
        <p>
          Beyond the accuracy, tile coding has properties that made it the default for linear RL for two decades.
          The features are <strong>binary</strong>, so computing a value is <M>n</M> additions — no multiplications
          at all. Exactly <M>n</M> features are active, so the effective step size is easy to control: divide{" "}
          <M>{String.raw`\alpha`}</M> by <M>n</M> and a single update moves the value by{" "}
          <M>{String.raw`\alpha`}</M> times the error, whatever the tiling. And it extends to several dimensions:
          tile each dimension, offset the tilings by different amounts per dimension to avoid diagonal artefacts,
          and you have a map for continuous spaces.
        </p>
        <p>
          That last property is what the next chapter needs. Mountain Car&rsquo;s state is two continuous numbers,
          and eight 8×8 tilings over it — 512 binary features per action — are enough to learn to climb out of the
          valley.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/state-aggregation", label: <>← The resolution dial</> }}
          next={{ href: "/learn/function-approximation/semi-gradient-td", label: <>Next · Semi-gradient TD(0) →</> }}
        />
      </div>
    </article>
  );
}

const code = `V_true = walk_true_values()[1:N_STATES + 1]
mu = walk_mu()
S = np.arange(1, N_STATES + 1)

def run(tilings, tiles, alpha, episodes=5000):
    tc = TileCoder([1], [N_STATES], [tiles], tilings)
    idx = np.array([tc.indices([s]) for s in S])    # the active tile in each tiling, per state
    w = np.zeros(tc.size)
    a = alpha / tilings                               # so one update moves v by alpha * error
    env = RandomWalk1000(0)
    for ep in range(episodes):
        env.seed(ep); s = env.reset(); traj = []
        while True:
            traj.append(s); s, r, done = env.step()
            if done: break
        for st in traj:
            f = idx[st - 1]
            w[f] += a * (r - w[f].sum())
    return tc, rmse(w[idx].sum(axis=1), V_true, mu)

for tilings in (1, 50):
    tc, err = run(tilings, tiles=6, alpha=3e-4)
    print(f"{tilings:2d} tiling(s), each tile {tc.width[0]:.0f} states wide, "
          f"{tc.size:3d} weights  ->  RMSE(mu) {err:.4f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
