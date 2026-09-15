import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { TriadDiagram } from "@/components/figures/fa/FaDiagrams";
import { DecisionPoint } from "@/components/DecisionPoint";

export const metadata = {
  title: "What's safe, and what you do about it — Manifold",
  description:
    "A smaller step size does not fix divergence, it only postpones it. A target network does fix Baird here — max|v| falls from 1096 to 1e-13 — and gradient-TD is stable but glacial, still at 1.95 after 20,000 sweeps because its error decays at rate 1-gamma.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatsSafe() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 12 minutes"
        title={<>What&rsquo;s safe, and what you do about it</>}
        intro={<>The triad is a fact of life rather than a bug, so the practical question is what to do when you
          need all three legs anyway. There are three standard answers. One of them does not work at all, one
          works far better than its reputation, and one is safe but so slow it is easy to mistake for broken.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The fix that isn&rsquo;t: turn the step size down</h2>
        <p>
          The instinct when something explodes is to take smaller steps. The two-state example already told us
          this cannot work: the weight is multiplied by <M>{String.raw`1 + \alpha(2\gamma - 1)`}</M> every update,
          and shrinking <M>{String.raw`\alpha`}</M> moves that factor closer to 1 without ever pushing it below.
          Divergence is not a step-size problem, it is a <em>direction</em> problem — the expected update points
          the wrong way, and going more slowly in the wrong direction is still the wrong direction.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Two candidate rescues for Baird: cut <M>{String.raw`\alpha`}</M> by 100×, or bootstrap from a{" "}
            <strong>frozen copy</strong> of the weights refreshed every 100 steps. Which one saves it?</>}
          options={["The smaller step size", "The frozen copy", "Both", "Neither"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`does a smaller step size save you?
   alpha 0.01     max|v(s)| after 1k      1096.07   after 10k 804834113192.88
   alpha 0.001    max|v(s)| after 1k        32.63   after 10k         665.18
   alpha 0.0001   max|v(s)| after 1k        13.79   after 10k          29.09

does a TARGET NETWORK save you?  (alpha = 0.01)
   sync none       max|v(s)| after 1k      1096.07   after 10k 804834113192.88
   sync every 100  max|v(s)| after 1k        56.21   after 10k          24.45
   sync every 1000 max|v(s)| after 1k        12.57   after 10k          11.51`}</CodeOutput>

        <p>
          Read the step-size block along each row, not down the column. At{" "}
          <M>{String.raw`\alpha = 10^{-4}`}</M> the error is a tame 13.79 after a thousand steps — and 29.09
          after ten thousand. It is still growing; it is merely growing 100× more slowly. Run it to 100,000 steps
          and it reaches <strong>661.6</strong>. A small step size buys you time, and if your training run is short
          enough it can hide the problem entirely, which is exactly what makes it dangerous.
        </p>

        <h2>The fix that works here: a target network</h2>
        <p>
          The second block changes one thing. Instead of bootstrapping off the weights you are currently
          updating, keep a <strong>frozen copy</strong> and build targets from that, refreshing it every{" "}
          <M>K</M> steps. The chase-your-own-tail loop from the two-state example is broken: between refreshes
          the target does not move at all, so each stretch is ordinary supervised regression toward a fixed
          function.
        </p>
        <p>
          With <M>K = 100</M> the error climbs to 56.21 early — the frozen target is stale and wrong at first —
          and then comes back down to 24.45. Keep going and it collapses completely:{" "}
          <strong>1.3 × 10<sup>−7</sup></strong> at 100,000 steps and{" "}
          <strong>9.6 × 10<sup>−14</sup></strong> at a million. On the problem built specifically to break TD, a
          target network converges to the true values.
        </p>

        <Callout color={GOLD} title={<>What this does and does not prove</>}>
          It is one problem, and a target network is not a convergence theorem — there are known cases where it
          only slows divergence rather than preventing it, and the &ldquo;stale target&rdquo; transient you can
          see in the numbers above is a real cost. Refresh too slowly and you are optimising toward an out-of-date
          answer; too quickly and you are back to bootstrapping off yourself.
          <br /><br />
          What it is, is evidence that the trick has a mechanism rather than being a superstition — and it is
          exactly the trick <Link href="/learn/function-approximation/semi-gradient-td" style={link}>DQN</Link>{" "}
          uses, alongside a replay buffer. Chapter 5 builds both, and now you know which of the three legs each
          one is bracing.
          <br /><br />
          One detail worth noticing: the weights do <em>not</em> go to zero even when the values do. The final{" "}
          <M>{String.raw`\|\mathbf{w}\| = 8.63`}</M> while max <M>|v(s)|</M> is{" "}
          <M>{String.raw`10^{-13}`}</M>. Eight weights
          describe seven states, so there is a direction in weight space that changes nothing at all — the values
          are pinned down, the weights are not.
        </Callout>

        <h2>The principled fix, and its honest price</h2>
        <p>
          The third answer is to stop using an update that is not a gradient. <strong>Gradient-TD</strong> methods
          (TDC, GTD2) do proper stochastic gradient descent on the projected Bellman error, with a second small
          weight vector to estimate the correction term, and they come with off-policy convergence guarantees for
          linear approximation. So they should fix Baird by construction — and they do, with a catch worth
          measuring (<code>scripts/fa_cases.py ch4</code>):
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>TDC on Baird (expected updates)</th><th style={thR}>max |v(s)|</th><th style={thR}>RMS projected BE</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>10 sweeps</td><td style={tdR}>12.1807</td><td style={tdR}>8.0163</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>100 sweeps</td><td style={tdR}>5.7681</td><td style={tdR}>2.7792</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>1,000 sweeps</td><td style={tdR}>1.9521</td><td style={tdR}>0.0074</td></tr>
              <tr><td style={td}>20,000 sweeps</td><td style={tdR}>1.9478</td><td style={tdR}>0.0074</td></tr>
            </tbody>
          </table>
        </div>

        <p>
          It does not diverge — that is the guarantee doing its job, and it is a real difference from the first
          row of the last page. But after twenty thousand full sweeps the worst value is still{" "}
          <strong>1.95</strong> when the truth is 0, and it is barely moving.
        </p>
        <p>
          The reason is instructive rather than damning. TDC minimises the <em>projected Bellman error</em>, and
          that quantity is already down to <strong>0.0074</strong> — essentially solved. But with{" "}
          <M>{String.raw`\gamma = 0.99`}</M>, a value of 1.95 that is wrong by 1.95 has a Bellman error of only{" "}
          <M>{String.raw`(1-\gamma)\times 1.95 \approx 0.02`}</M>. The objective is nearly flat along the
          direction that still has all the error in it, so progress crawls at rate{" "}
          <M>{String.raw`1-\gamma`}</M>. <strong>A near-zero Bellman error is a weak certificate when{" "}
          <M>{String.raw`\gamma`}</M> is close to 1.</strong>
        </p>
        <p>
          Gradient-TD is also fussier than it looks: at{" "}
          <M>{String.raw`\alpha = 0.005`}</M> it is stable, but raising the second step size to{" "}
          <M>{String.raw`\beta = 5`}</M> made it overflow within 335 sweeps. Guarantees are asymptotic and
          conditional; they are not the same as robustness.
        </p>

        <DecisionPoint
          accent={GOLD}
          question={<>Your value estimates are drifting upward with no sign of settling. You are
            using a neural network, one-step TD targets, and a replay buffer. Which do you try
            first?</>}
          options={[
            {
              label: "Add a target network",
              verdict: "best",
              response: <>Right, and the reason is that it is the only one of these that costs you
                nothing you wanted. It does not change the representation, does not change what you
                are learning, and does not throw away data — it just stops the regression target
                moving while you chase it. It is also the one the field converged on: it is in DQN
                for exactly this reason.</>,
            },
            {
              label: "Drop the step size",
              verdict: "miss",
              response: <>The most common first move and the one that does not work. Divergence here
                is not a step-size problem: the update has a positive feedback loop in it, and a
                smaller step slows the loop without breaking it. You will spend an afternoon watching
                a slower divergence and conclude the run needed longer.</>,
            },
            {
              label: "Go on-policy — drop the replay buffer",
              verdict: "close",
              response: <>This genuinely removes a leg of the triad, and it genuinely fixes the
                instability. It is also the most expensive fix on the list: the buffer is where your
                sample efficiency comes from, and on-policy methods need far more environment steps.
                Correct diagnosis, costly prescription — try the cheap leg-preserving fix first.</>,
            },
            {
              label: "Use a linear model so the theory applies",
              verdict: "miss",
              response: <>Linear function approximation is not safe off-policy either — Baird&rsquo;s
                counterexample is linear, with exact features. Removing the network removes the thing
                you needed the network for, and leaves the leg that was actually causing the
                problem.</>,
            },
          ]}
        />

        <h2>The practical ladder</h2>
        <ol>
          <li>
            <strong>Stay on-policy if you can.</strong> It is the only combination in this chapter with both a
            proof and good behaviour, and SARSA-style control got Mountain Car solved in 200 episodes.
          </li>
          <li>
            <strong>If you must go off-policy, break the self-reference.</strong> A target network is cheap, has a
            clear mechanism, and fixed the standard counterexample outright in the measurement above.
          </li>
          <li>
            <strong>Watch <M>{String.raw`\|\mathbf{w}\|`}</M>, not just the loss.</strong> Divergence announces
            itself in the weight norm long before the returns collapse, and a short run at a small step size will
            look perfectly healthy while heading for the cliff.
          </li>
          <li>
            <strong>Reach for gradient-TD when you need the guarantee</strong> — and budget for slow convergence
            and step-size tuning rather than expecting a drop-in replacement.
          </li>
        </ol>

        <p>
          That closes the theory of this track. What remains is to make{" "}
          <M>{String.raw`\hat v`}</M> a neural network and watch every one of these considerations reappear —
          replay because off-policy data is unavoidable, target networks because bootstrapping off yourself is
          unstable, and no proofs at all to fall back on.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/the-three-ingredients", label: <>← The three ingredients</> }}
          next={{ href: "/learn/function-approximation/from-linear-to-a-network", label: <>Next · From linear to a neural network →</> }}
        />
      </div>
    </article>
  );
}

const code = `phi, b_probs, gamma = baird()

def run(steps, alpha=0.01, target_every=0, seed=0):
    "target_every = 0 means no target network: bootstrap off the live weights."
    w = BAIRD_W0.copy(); w_target = w.copy()
    rng = np.random.default_rng(seed)
    for t in range(1, steps + 1):
        s = int(rng.integers(7))
        if rng.random() < b_probs[0]:
            s2, rho = int(rng.integers(6)), 0.0
        else:
            s2, rho = 6, 1.0 / b_probs[1]
        wb = w_target if target_every else w          # WHICH weights make the target?
        delta = 0.0 + gamma * phi[s2] @ wb - phi[s] @ w
        w = w + alpha * rho * delta * phi[s]
        if target_every and t % target_every == 0:
            w_target = w.copy()                        # the only change from the last page
        if not np.all(np.isfinite(w)):
            return np.inf
    return np.max(np.abs(phi @ w))

print("does a smaller step size save you?")
for alpha in (0.01, 0.001, 0.0001):
    print(f"   alpha {alpha:<8} max|v(s)| after 1k {run(1000, alpha):12.2f}"
          f"   after 10k {run(10000, alpha):14.2f}")

print("\\ndoes a TARGET NETWORK save you?  (alpha = 0.01)")
for K in (0, 100, 1000):
    label = "none" if K == 0 else f"every {K}"
    print(f"   sync {label:<10} max|v(s)| after 1k {run(1000, 0.01, K):12.2f}"
          f"   after 10k {run(10000, 0.01, K):14.2f}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
