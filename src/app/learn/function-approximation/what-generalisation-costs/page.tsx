import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { TileCoding, GeneralisationFootprint } from "@/components/figures/fa/TileCoding";

export const metadata = {
  title: "What generalisation costs you — Manifold",
  description:
    "Generalisation is why we dropped the table, and it has a bill. Change the world on one edge of the random walk only: local features leave the far edge exactly alone, while 6 global Fourier features move it by 0.136 in states never visited. Interference is exactly the overlap of feature vectors — and it is why DQN needs a replay buffer.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatGeneralisationCosts() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 9 minutes"
        title={<>What generalisation costs you</>}
        intro={<>We dropped the table so that experience in one state could move the estimates of others. Every
          page since has leaned on that. This page is the bill: the same sharing that lets you learn about states
          you never visited also lets you <em>unlearn</em> them.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Cost 1: interference</h2>
        <p>
          In a table, an update to one state touches one number and nothing else can possibly change. With shared
          weights, an update to one state changes the estimate of every state that shares a feature with it. When
          those states really do have similar values, that is{" "}
          <Link href="/learn/function-approximation/generalisation-not-storage" style={link}>generalisation</Link>.
          When they do not, it is <strong>interference</strong>: learning here quietly damages what you knew over
          there.
        </p>
        <p>
          Here is a clean test on the 1000-state walk. Start each representation at its best possible fit to the
          true values. Then change the world on the <em>right edge only</em> — every true value in states 801 to
          1000 rises by 0.3 — and train 2,000 updates on right-edge states alone. States 1 to 200 are never
          visited and their true values never move. Anything the left edge learns is damage.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>After 2,000 updates on the right edge only, how far do the estimates on the (never visited,
            unchanged) <strong>left edge</strong> move?</>}
          options={["Zero for all three", "A little for all three", "Zero for the local ones, a lot for Fourier", "About the same for all three"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`aggregation, 10 groups      right edge moved 0.303   left edge (never visited) moved 0.000
tile coding, 50 x 100 wide  right edge moved 0.304   left edge (never visited) moved 0.000
Fourier, 6 features         right edge moved 0.314   left edge (never visited) moved 0.136`}</CodeOutput>

        <p>
          All three learned the change on the right: about <strong>0.30</strong>, as they should. The two
          representations built from <em>local</em> features — each covering one contiguous stretch of states —
          left the far edge exactly where it was: <strong>0.000</strong>. The Fourier features are{" "}
          <em>global</em>: every one is a cosine spanning the whole walk. They moved the left edge by{" "}
          <strong>0.136</strong>, nearly half the size of the real change, in states that never appeared once.
        </p>

        <Proof title="Interference is exactly the overlap of feature vectors">
          <p>
            <strong>Step 1 — one update.</strong> For a linear approximator{" "}
            <M>{String.raw`\hat v(s,\mathbf{w}) = \mathbf{w}^\top\mathbf{x}(s)`}</M>, one gradient step on state{" "}
            <M>s</M> with error <M>{String.raw`\delta`}</M> is
          </p>
          <MathBlock>{String.raw`\mathbf{w}' = \mathbf{w} + \alpha\,\delta\,\mathbf{x}(s)`}</MathBlock>
          <p>
            <strong>Step 2 — look somewhere else.</strong> Evaluate any other state <M>s'</M> before and after:
          </p>
          <MathBlock>{String.raw`\hat v(s',\mathbf{w}') - \hat v(s',\mathbf{w}) = \mathbf{x}(s')^\top(\mathbf{w}' - \mathbf{w}) = \mathbf{x}(s')^\top\big(\alpha\,\delta\,\mathbf{x}(s)\big)`}</MathBlock>
          <p>
            <strong>Step 3 — pull out the scalars.</strong> <M>{String.raw`\alpha`}</M> and{" "}
            <M>{String.raw`\delta`}</M> are numbers, so
          </p>
          <MathBlock>{String.raw`\Delta \hat v(s') = \alpha\,\delta\;\underbrace{\mathbf{x}(s')^\top\mathbf{x}(s)}_{\text{feature overlap}}`}</MathBlock>
          <p>
            <strong>Step 4 — read it off for each map.</strong> An update at <M>s</M> moves <M>s'</M> in
            proportion to the inner product of their feature vectors, and nothing else. For aggregation that is 1
            if the two share a group and 0 otherwise. For tile coding it is the number of tiles they share, which
            hits 0 once they are more than a tile width apart. For Fourier features it is{" "}
            <M>{String.raw`\sum_j \cos(\pi j x)\cos(\pi j x')`}</M>, which is almost never 0 — every state
            overlaps every other. The measurement above is this equation.
          </p>
        </Proof>

        <p>
          Global features are not the villain here. That same reach is why 6 Fourier features fit the walk&rsquo;s
          S-curve to a floor of <strong>0.0079</strong> against <strong>0.0544</strong> for 10 aggregated groups,
          back on the{" "}
          <Link href="/learn/function-approximation/linear-function-approximation" style={link}>linear
          methods</Link> page. Local features are safe and reach only as far as a tile; global features reach
          everywhere, and <em>interfere</em> everywhere. You do not get one without the other.
        </p>

        <Callout color={GOLD} title={<>Why this matters most for neural networks</>}>
          A neural network is the extreme of a global representation: every early-layer weight influences the
          output for every input. Train one on a stream of experience from a single part of the world — exactly
          what an RL agent produces, one correlated step after another — and it can overwrite what it knew about
          everywhere else. That is <strong>catastrophic forgetting</strong>, and it is the problem the replay
          buffer in DQN exists to solve: shuffle old and new experience together so no region dominates any
          stretch of updates. Chapter 5 builds it.
        </Callout>

        <GeneralisationFootprint
          caption={<>Interference is the right-hand picture read in a bad mood. Updating one state
            moves its neighbours, which is the whole point when the neighbours should move — and a
            corruption when they should not. A table has zero interference and zero generalisation;
            you cannot buy one without selling the other, and every feature-map choice in this
            chapter is a position on that trade.</>}
        />

        <h2>Cost 2: the guarantees</h2>
        <p>
          The Learning track could promise things. Tabular SARSA and Q-learning converge to the optimal action
          values under standard conditions on exploration and step sizes. Almost none of that survives here.
        </p>
        <p>
          Semi-gradient TD for <em>prediction</em>, on-policy and linear, still converges — to the TD fixed point
          rather than the best fit, as{" "}
          <Link href="/learn/function-approximation/semi-gradient-td" style={link}>chapter 2</Link> measured. For{" "}
          <em>control</em> it is weaker: linear semi-gradient SARSA is known not to diverge, but it can chatter
          within a region of weight space instead of settling on one policy (Gordon, 2001). Go off-policy — learn
          about one policy while following another, as Q-learning does — and even that is gone: the weights can
          grow without bound on a problem where a perfect answer is representable. The next chapter builds that
          counterexample and watches them grow <strong>68.6×</strong> in 1,000 steps.
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Dropping the table buys you…</th><th style={th}>…and charges you</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>Learning in continuous or enormous state spaces</td><td style={td}>A best fit that is never exact — a floor you cannot learn below</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>Experience that reaches states you never visited</td><td style={td}>Updates that damage states you never visited</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1,536 numbers where a table needed infinitely many</td><td style={td}>A step size and a feature width to tune, and to compare fairly</td></tr>
              <tr><td style={td}>TD&rsquo;s cheap, online, low-variance updates</td><td style={td}>A biased destination — and, off-policy, possibly no destination at all</td></tr>
            </tbody>
          </table>
        </div>

        <p>
          That last row is where the next chapter starts. Bootstrapping, function approximation and off-policy
          learning are each worth having, and any two of them together are safe enough. All three at once are the{" "}
          <strong>deadly triad</strong>.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/the-width-dial", label: <>← The width dial</> }}
          next={{ href: "/learn/function-approximation/when-td-diverges", label: <>Next · When TD diverges →</> }}
        />
      </div>
    </article>
  );
}

const code = `S = np.arange(1, N_STATES + 1); x = (S - 1) / (N_STATES - 1)
V_true = walk_true_values()[1:N_STATES + 1]; mu = walk_mu()

agg = np.zeros((N_STATES, 10)); agg[np.arange(N_STATES), [group_of(s, 10) for s in S]] = 1.0
tc = TileCoder([1], [N_STATES], [11], 50)
idx = np.array([tc.indices([s]) for s in S])
tiles = np.zeros((N_STATES, tc.size)); tiles[np.repeat(np.arange(N_STATES), 50), idx.ravel()] = 1.0
fourier = np.stack([np.cos(np.pi * j * x) for j in range(6)], axis=1)

left, right = S <= 200, S > 800
for name, X, alpha in (("aggregation, 10 groups", agg, 0.05),
                       ("tile coding, 50 x 100 wide", tiles, 0.05 / 50),
                       ("Fourier, 6 features", fourier, 0.05)):
    W = np.sqrt(mu)[:, None]
    w, *_ = np.linalg.lstsq(W * X, np.sqrt(mu) * V_true, rcond=None)   # start from the best fit
    before = X @ w
    rng = np.random.default_rng(0)
    for _ in range(2000):                        # the world changes on the RIGHT edge only:
        s = int(rng.choice(S[right]))            # every true value there rises by 0.3
        f = X[s - 1]
        w = w + alpha * ((V_true[s - 1] + 0.3) - f @ w) * f
    moved = np.abs(X @ w - before)
    print(f"{name:27s} right edge moved {moved[right].max():.3f}   "
          f"left edge (never visited) moved {moved[left].max():.3f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
