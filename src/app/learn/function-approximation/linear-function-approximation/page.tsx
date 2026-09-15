import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { TileCoding, GeneralisationFootprint } from "@/components/figures/fa/TileCoding";

export const metadata = {
  title: "Linear function approximation — Manifold",
  description:
    "The case where everything still works: a value that is a weighted sum of features. Its best possible fit is a least-squares solve, so we can measure each feature set's floor exactly — and discover that the features which represent the answer best are not the ones gradient descent can actually reach.",
};

const GOLD = "var(--c-rl)";

export default function LinearFunctionApproximation() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 10 minutes"
        title={<>Linear function approximation</>}
        intro={<>Before neural networks, the case that can actually be understood: a value that is a weighted sum
          of features. Linear sounds like a limitation. It is really a choice to put all the cleverness into the
          features and keep the learning simple enough to analyse — and it holds a surprise about what
          &ldquo;good features&rdquo; even means.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The form</h2>
        <p>
          Describe each state with a vector of <strong>features</strong>{" "}
          <M>{String.raw`\mathbf{x}(s) = (x_1(s), \dots, x_d(s))`}</M> — any numbers you like that summarise it —
          and let the value be a weighted sum of them:
        </p>
        <MathBlock>{String.raw`\hat v(s,\mathbf{w}) = \mathbf{w}^\top \mathbf{x}(s) = \sum_{i=1}^{d} w_i\, x_i(s)`}</MathBlock>
        <p>
          &ldquo;Linear&rdquo; means linear in the <em>weights</em>, not in the state. The features can be as
          nonlinear as you want — squares, cosines, indicator functions of a region. That distinction is the whole
          design philosophy: <strong>the features carry the shape; the weights only scale it.</strong>
        </p>
        <p>
          The payoff shows up in the gradient. Differentiating{" "}
          <M>{String.raw`\mathbf{w}^\top\mathbf{x}(s)`}</M> with respect to <M>{String.raw`\mathbf{w}`}</M> just
          returns <M>{String.raw`\mathbf{x}(s)`}</M> — which is Step 7 of the previous page&rsquo;s derivation — so
          every update is the same simple move: nudge the weights along the feature vector, in proportion to the
          error.
        </p>
        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\big[\,U_t - \mathbf{w}^\top\mathbf{x}(S_t)\big]\,\mathbf{x}(S_t)`}</MathBlock>

        <h2>Why linear is the case you can reason about</h2>
        <p>
          Plug a linear <M>{String.raw`\hat v`}</M> into the value error and it becomes a quadratic in{" "}
          <M>{String.raw`\mathbf{w}`}</M> — a bowl, with exactly one bottom. No local minima to get stuck in, no
          saddle points, no dependence on where you start. And a bowl&rsquo;s bottom can be computed directly:
          minimising a weighted sum of squared errors over a linear model is <strong>weighted least
          squares</strong>, one line of linear algebra.
        </p>
        <p>
          That gives us an unusually good tool. For any feature set we can compute its{" "}
          <strong>floor</strong> — the lowest error <em>any</em> choice of weights could achieve — without running a
          single episode. So we can compare feature sets on what they are capable of, separately from how well
          learning happens to go.
        </p>

        <h2>Three ways to describe a state</h2>
        <p>
          On the 1000-state walk, rescale the state number to <M>{String.raw`x \in [0,1]`}</M> and try three
          families:
        </p>
        <ul>
          <li><strong>Aggregation</strong> — one indicator per group of states. The staircase from the earlier pages.</li>
          <li><strong>Polynomial</strong> — <M>{String.raw`1, x, x^2, \dots, x^5`}</M>. The first thing anyone tries.</li>
          <li><strong>Fourier</strong> — <M>{String.raw`\cos(0), \cos(\pi x), \cos(2\pi x), \dots, \cos(5\pi x)`}</M>. Smooth waves of increasing frequency.</li>
        </ul>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Aggregation gets <strong>10</strong> features; polynomial and Fourier get only <strong>6</strong>.
            Which can represent the true values most accurately?</>}
          options={["Aggregation — it has the most features", "Polynomial", "Fourier", "About the same"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`features           d    floor   condition number
aggregation       10   0.0544            1.0
polynomial         6   0.0010         3848.2
Fourier            6   0.0079            1.4`}</CodeOutput>

        <p>
          Six polynomial features represent the true values <strong>54 times</strong> more accurately than ten
          aggregation features. The number of weights was never the point. What matters is whether the features{" "}
          <em>have the right shape</em> — and the true value function on this walk is a smooth S-curve, which a
          low-degree polynomial traces almost perfectly and a staircase can only step around.
        </p>
        <p>
          On that evidence you would pick polynomials and move on. Don&rsquo;t — the last column is about to
          overturn it.
        </p>

        <GeneralisationFootprint
          caption={<>What one update touches, which is the only difference that matters between
            these two representations. A table changes exactly the state you visited and nothing
            else; the feature map changes a neighbourhood. That is the entire mechanism by which
            1,000 states get covered by 550 weights, and it is also the entire reason approximation
            can hurt: the neighbourhood you helped is chosen by your features, not by the problem.</>}
        />

        <h2>Representable is not reachable</h2>
        <p>
          The floor says what the <em>best</em> weights would score. It says nothing about whether stochastic
          gradient descent will find them. So we ran gradient Monte Carlo on each feature set for 10,000 episodes,
          sweeping the step size and keeping the best result for each:
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 440 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Features</th><th style={thR}>Floor</th><th style={thR}>SGD reached</th><th style={thR}>Gap to floor</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Polynomial, 6</td><td style={tdR}>0.0010</td><td style={tdR}>0.0244</td><td style={{ ...tdR, color: "var(--bad)" }}>24×</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Fourier, 6</td><td style={tdR}>0.0079</td><td style={{ ...tdR, fontWeight: 600 }}>0.0159</td><td style={tdR}>2×</td>
              </tr>
              <tr>
                <td style={td}>Aggregation, 10</td><td style={tdR}>0.0544</td><td style={tdR}>0.0575</td><td style={tdR}>1.06×</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -6 }}>
          Best of a step-size sweep, 10,000 episodes each: polynomial at α = 5×10⁻⁴, Fourier at 5×10⁻⁵,
          aggregation at 3×10⁻⁴. Reproduced by <code>scripts/fa_cases.py</code>.
        </p>

        <p>
          <strong>Fourier wins.</strong> Its floor is eight times worse than the polynomial&rsquo;s, and it still
          learns a better value function, because gradient descent gets within 2× of its floor while stalling 24×
          short of the polynomial&rsquo;s. And the sweep made the polynomial&rsquo;s trouble worse, not better:
          raise its step size to 2×10⁻³ and the error jumps to 0.2358.
        </p>

        <Callout color={GOLD} title={<>The column that explains it: conditioning</>}>
          The last column of the output is the <strong>condition number</strong> — roughly, the ratio of the
          steepest direction of the error bowl to its shallowest. At <strong>3848</strong>, the polynomial&rsquo;s
          bowl is a long, narrow trench. At <strong>1.4</strong>, Fourier&rsquo;s is nearly round.
          <br /><br />
          A trench is miserable for gradient descent. Any step size small enough to stay stable across the steep
          walls crawls along the shallow floor; any step large enough to make progress along the floor bounces off
          the walls. The powers <M>{String.raw`x^4`}</M> and <M>{String.raw`x^5`}</M> look almost identical on{" "}
          <M>{String.raw`[0,1]`}</M>, so the weights on them fight each other. Cosines of different frequencies are
          close to orthogonal and pull independently.
          <br /><br />
          <strong>So a feature set has two separate grades:</strong> what it can express, and how easy it makes
          learning. The best representation is worthless if the learner cannot get there.
        </Callout>

        <p>
          That is why Fourier and tile-coded features, not raw polynomials, are what practitioners reach for in
          linear RL. It also foreshadows something about neural networks: part of why they need careful
          initialisation and normalisation is exactly this problem, one level up.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/gradient-descent-on-values", label: <>← Gradient descent on values</> }}
          next={{ href: "/learn/function-approximation/state-aggregation", label: <>Next · The resolution dial →</> }}
        />
      </div>
    </article>
  );
}

const code = `S = np.arange(1, N_STATES + 1)
x = (S - 1) / (N_STATES - 1)                   # states rescaled to [0, 1]
V_true = walk_true_values()[1:N_STATES + 1]
mu = walk_mu()

def features(kind, n):
    if kind == "aggregation":
        X = np.zeros((N_STATES, n))
        X[np.arange(N_STATES), [group_of(s, n) for s in S]] = 1.0
        return X
    if kind == "polynomial":
        return np.stack([x ** j for j in range(n)], axis=1)
    if kind == "Fourier":
        return np.stack([np.cos(np.pi * j * x) for j in range(n)], axis=1)

def floor(X):
    "The best ANY linear fit with these features can do: weighted least squares."
    W = np.sqrt(mu)[:, None]
    w, *_ = np.linalg.lstsq(W * X, np.sqrt(mu) * V_true, rcond=None)
    return rmse(X @ w, V_true, mu)

print("features           d    floor   condition number")
for kind, n in (("aggregation", 10), ("polynomial", 6), ("Fourier", 6)):
    X = features(kind, n)
    print(f"{kind:14s} {n:5d}   {floor(X):.4f}   {np.linalg.cond(X):12.1f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
