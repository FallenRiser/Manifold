import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { TriadDiagram } from "@/components/figures/fa/FaDiagrams";

export const metadata = {
  title: "From linear to a neural network — Manifold",
  description:
    "Swap hand-designed features for a network that reads the raw state. On the 1000-state walk a 49-parameter MLP reaches RMSE 0.0277 against aggregation's 0.0632 — and the bigger network is worse on average with seven times the seed variance. Nonlinearity buys features and costs guarantees.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FromLinearToANetwork() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 11 minutes"
        title={<>From linear to a neural network</>}
        intro={<>Every representation so far shared one property: a human chose the features. Aggregation needed
          someone to pick the groups, tile coding to pick the widths, Fourier to pick the frequencies. This
          chapter hands that job to the approximator — which is the whole content of the phrase{" "}
          <em>deep reinforcement learning</em>.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>What actually changes</h2>
        <p>
          Less than you might expect. The objective is the same value error, the update is the same
          semi-gradient step, and the target is built the same way. Only one term changes:
        </p>
        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\big[U_t - \hat v(S_t,\mathbf{w})\big]\,\nabla \hat v(S_t,\mathbf{w})`}</MathBlock>
        <p>
          For a linear approximator <M>{String.raw`\nabla \hat v = \mathbf{x}(s)`}</M> — the features themselves,
          which is why every update in chapters 2 and 3 was so simple. For a network, that gradient comes from
          backpropagation, and it depends on <M>{String.raw`\mathbf{w}`}</M>. The equation is unchanged; the
          object it refers to is not.
        </p>
        <p>
          Two consequences follow immediately, and they are the good news and the bad news of the whole chapter.
          The good: the network can <em>invent</em> its own features, so nobody has to guess where the interesting
          boundaries are. The bad: <M>{String.raw`\hat v`}</M> is no longer linear in{" "}
          <M>{String.raw`\mathbf{w}`}</M>, so the value error is no longer a bowl with one bottom. There is no
          unique best fit any more, only whatever your initialisation and step sizes happen to find.
        </p>

        <Proof title="Where the gradient comes from, one layer at a time">
          <p>
            <strong>Step 1 — the network.</strong> One hidden layer with ReLU, one output:
          </p>
          <MathBlock>{String.raw`\mathbf{z} = \mathbf{W}_1^\top\mathbf{x} + \mathbf{b}_1, \qquad \mathbf{h} = \max(\mathbf{z}, 0), \qquad \hat v = \mathbf{W}_2^\top\mathbf{h} + b_2`}</MathBlock>
          <p>
            <strong>Step 2 — the output layer.</strong> <M>{String.raw`\hat v`}</M> is linear in{" "}
            <M>{String.raw`\mathbf{W}_2`}</M>, so that part is exactly the linear case from chapter 2 — the
            gradient is the hidden activation:
          </p>
          <MathBlock>{String.raw`\frac{\partial \hat v}{\partial \mathbf{W}_2} = \mathbf{h}`}</MathBlock>
          <p>
            <strong>Step 3 — through the ReLU.</strong> The derivative of{" "}
            <M>{String.raw`\max(z,0)`}</M> is 1 where <M>z &gt; 0</M> and 0 elsewhere, so the signal reaching the
            hidden pre-activations is masked:
          </p>
          <MathBlock>{String.raw`\frac{\partial \hat v}{\partial \mathbf{z}} = \mathbf{W}_2 \odot \mathbf{1}[\mathbf{z} > 0]`}</MathBlock>
          <p>
            <strong>Step 4 — the input layer.</strong> Each first-layer weight sees the input scaled by that mask:
          </p>
          <MathBlock>{String.raw`\frac{\partial \hat v}{\partial \mathbf{W}_1} = \mathbf{x}\,\big(\mathbf{W}_2 \odot \mathbf{1}[\mathbf{z} > 0]\big)^\top`}</MathBlock>
          <p>
            <strong>Step 5 — read what the mask means.</strong> That indicator is the whole story of why this is
            not linear function approximation. Which hidden units are active <em>depends on the input</em>, so
            two states activate different subsets of units and therefore share only some of the weights. The
            network is choosing, per state, which parameters are responsible for it — that is a learned version
            of what tile coding does with a fixed grid.
          </p>
        </Proof>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The 1000-state walk, 2,000 episodes of experience, shared by both methods. On one side, 10
            aggregated groups a human chose. On the other, a network with 49 parameters that sees only the raw
            state number. Which fits the true values better?</>}
          options={["Aggregation — the features encode real knowledge", "About the same", "The network, clearly", "The network fails: 1 input is too little"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`164741 state-visits from 2000 episodes

aggregation, 10 groups     10 parameters   RMSE(mu) 0.0632
MLP 1-16-1                 49 parameters   RMSE(mu) 0.0277

what the network drew, every 100th state:
  state   true    network
    100  -0.754    -0.732
    280  -0.416    -0.401
    460  -0.076    -0.068
    640  +0.263    +0.253
    820  +0.603    +0.549
   1000  +0.922    +0.844`}</CodeOutput>

        <p>
          <strong>0.0277 against 0.0632</strong> — better by 2.3×, from the same data, with nobody choosing a
          single feature. And it is not merely a better number: aggregation can only ever draw a staircase of ten
          steps, while the network drew the S-curve. Look at the tracking column, and then at where it goes
          wrong: the error is largest at state 1000 (+0.844 against +0.922), the far edge, which the{" "}
          <Link href="/learn/function-approximation/what-best-fit-means" style={link}>on-policy distribution</Link>{" "}
          visits 135.8× less often than the centre. It fits what it sees.
        </p>

        <TriadDiagram
          caption={<>Where swapping the linear model for a network puts you. It does not add a leg
            — linear function approximation was already one — but it removes the last reason to
            believe the other two are survivable: the convergence results that hold for linear TD
            have no non-linear counterpart. This diagram is the same one from the previous chapter,
            and the point of showing it again here is that nothing about it changed. Only your
            ability to reason about the middle did.</>}
        />

        <h2>The bill arrives immediately</h2>
        <p>
          Before declaring networks the winner, run the obvious next experiment — make it bigger — and watch what
          happens to the <em>spread</em> across three seeds (<code>scripts/fa_cases.py ch5</code>):
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Representation</th><th style={thR}>parameters</th>
                <th style={thR}>RMSE(μ)</th><th style={thR}>per-seed</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>Aggregation, 10 groups</td><td style={tdR}>10</td>
                <td style={tdR}>0.0632</td><td style={tdR}>deterministic</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>MLP 1–16–1</td><td style={tdR}>49</td>
                <td style={{ ...tdR, fontWeight: 600 }}>0.0259 ± 0.0046</td>
                <td style={tdR}>.0277 / .0294 / .0207</td>
              </tr>
              <tr>
                <td style={td}>MLP 1–64–1</td><td style={tdR}>193</td>
                <td style={tdR}>0.0395 ± 0.0312</td>
                <td style={{ ...tdR, color: "var(--bad)" }}>.0739 / .0313 / .0132</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          The bigger network is <strong>worse on average</strong> and its seed-to-seed standard deviation is{" "}
          <strong>seven times larger</strong>. One seed of the 64-unit net beat every 16-unit run (0.0132); another
          was worse than plain aggregation (0.0739). Same data, same code, same budget — different random
          initialisation.
        </p>
        <p>
          That is the non-convexity showing up as a practical fact rather than a theoretical caveat. With linear
          features there was one best fit and the only question was whether you reached it. Here, &ldquo;the model
          you get&rdquo; is a property of the run, not of the model class, which is why single-seed comparisons of
          network architectures are close to worthless.
        </p>

        <Callout color={GOLD} title={<>What you just gave up</>}>
          Every convergence guarantee in this track had the word <em>linear</em> in it. Chapter 2&rsquo;s promise
          that on-policy TD converges to the TD fixed point? Linear. The proof that the matrix{" "}
          <M>{String.raw`\mathbf{A}`}</M> is positive definite on-policy? Linear. The one comfort left after{" "}
          <Link href="/learn/function-approximation/the-three-ingredients" style={link}>the deadly triad</Link>{" "}
          was that at least on-policy linear methods were safe — and a neural network is not linear.
          <br /><br />
          So deep RL operates with no convergence theory worth the name, on top of the triad, and works anyway.
          The rest of this chapter is about the engineering that makes &ldquo;anyway&rdquo; possible: two ideas,
          each of which braces one leg of the triad, and both of which you can watch fail when removed.
        </Callout>

        <p>
          One more thing to notice about the run above: it was <em>supervised</em>. We collected 2,000 episodes,
          computed their returns, and regressed on them — no bootstrapping, so no moving target. That is the easy
          case. Control needs bootstrapped targets from a network that is changing underneath you, and it is
          exactly there that things fall apart.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/whats-safe", label: <>← What&rsquo;s safe, and what you do about it</> }}
          next={{ href: "/learn/function-approximation/experience-replay", label: <>Next · Experience replay →</> }}
        />
      </div>
    </article>
  );
}

const code = `V_true = walk_true_values()[1:N_STATES + 1]; mu = walk_mu()
S = np.arange(1, N_STATES + 1)
x = (S - 1) / (N_STATES - 1) * 2 - 1        # the raw state number, squashed to [-1, 1]

# one batch of experience, shared by both methods
states, returns = [], []
env = RandomWalk1000(0)
for ep in range(2000):
    env.seed(ep); s = env.reset(); traj = []
    while True:
        traj.append(s); s, r, done = env.step()
        if done: break
    states.extend(traj); returns.extend([r] * len(traj))
states = np.array(states); returns = np.array(returns, dtype=float)
print(f"{len(states)} state-visits from 2000 episodes\\n")

# 1) features a human chose: 10 aggregated groups
w = np.zeros(10); gi = np.array([group_of(s, 10) for s in S])
for st, r in zip(states, returns):
    w[gi[st - 1]] += 1e-3 * (r - w[gi[st - 1]])
print(f"aggregation, 10 groups     10 parameters   RMSE(mu) {rmse(w[gi], V_true, mu):.4f}")

# 2) no chosen features at all: a network reading the raw state number
net = MLP(1, 16, 1, seed=0, lr=1e-3)
rng = np.random.default_rng(100)
idx = np.arange(len(states))
for epoch in range(3):
    rng.shuffle(idx)
    for k in range(0, len(idx) - 63, 64):
        b = idx[k:k + 64]
        out = net.forward(x[states[b] - 1][:, None])
        net.backward((out - returns[b][:, None]) * (2.0 / 64))
V_hat = net.forward(x[:, None])[:, 0]
n_par = sum(p.size for p in net.params())
print(f"MLP 1-16-1                 {n_par} parameters   RMSE(mu) {rmse(V_hat, V_true, mu):.4f}")

print("\\nwhat the network drew, every 100th state:")
print("  state   true    network")
for s_ in range(100, 1001, 180):
    print(f"  {s_:5d}  {V_true[s_-1]:+.3f}    {V_hat[s_-1]:+.3f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
