import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { TDvsMCLab } from "@/components/labs/TDvsMCLab";

export const metadata = {
  title: "TD vs Monte Carlo — Manifold",
  description:
    "The bias–variance trade at the heart of value learning. Monte Carlo is unbiased but noisy and offline; TD is biased but low-variance and online. On Sutton's random walk, TD reaches half the error of MC — watch it happen.",
};

const GOLD = "var(--c-rl)";

export default function TdVsMonteCarlo() {
  const code = `import numpy as np
true = np.array([1,2,3,4,5]) / 6           # true values of states A..E (γ = 1)

def run(method, alpha, episodes, seed):
    rng = np.random.default_rng(seed)
    V = np.full(7, 0.5); V[0] = V[6] = 0.0  # positions 0 and 6 are terminal (value 0)
    hist = []
    for _ in range(episodes):
        pos = 3; traj = []                   # every walk starts in the centre
        while 0 < pos < 6:
            nxt = pos + rng.choice([-1, 1]); r = 1.0 if nxt == 6 else 0.0
            traj.append((pos, r, nxt))
            if method == "TD":
                V[pos] += alpha * (r + V[nxt] - V[pos])       # bootstrap, every step
            pos = nxt
        if method == "MC":
            G = 0.0
            for p, r, _ in reversed(traj):
                G = r + G; V[p] += alpha * (G - V[p])          # full return, at the end
        hist.append(np.sqrt(np.mean((V[1:6] - true) ** 2)))    # RMS error this episode
    return np.array(hist)

def avg(method, alpha, episodes=100, runs=200):
    return np.mean([run(method, alpha, episodes, s) for s in range(runs)], axis=0)

for method, alpha in [("TD", 0.10), ("MC", 0.02)]:
    h = avg(method, alpha)
    print(f"{method} a={alpha:.2f}:  RMS after  1 ep = {h[0]:.3f}   10 ep = {h[9]:.3f}   100 ep = {h[99]:.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>TD vs Monte Carlo</>}
        intro={<>Two ways to estimate a value from experience, and a clean trade-off between them. Monte Carlo waits
          for the true return — unbiased, but noisy, and only at the end. TD bootstraps after one step — biased, but
          calm, and online. Neither dominates in principle; on most real problems TD wins, and here you can watch
          exactly why.</>}
      />

      <div className="lesson">
        <h2>The trade, in one table</h2>
        <p>
          The two methods sit at opposite corners on three axes:
        </p>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}></th><th style={th}>Monte Carlo</th><th style={th}>Temporal-difference</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}><strong>Target</strong></td><td style={tdc}>full return <M>{String.raw`G_t`}</M></td><td style={tdc}><M>{String.raw`R_{t+1}+\gamma V(S_{t+1})`}</M></td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}><strong>Bias</strong></td><td style={tdc}>unbiased</td><td style={tdc}>biased (bootstraps off an estimate)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}><strong>Variance</strong></td><td style={tdc}>high (whole random trajectory)</td><td style={tdc}>low (one random step)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}><strong>When it learns</strong></td><td style={tdc}>episode end only</td><td style={tdc}>every step, online</td>
              </tr>
              <tr>
                <td style={tdc}><strong>Markov structure</strong></td><td style={tdc}>ignored</td><td style={tdc}>exploited</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The whole difference traces to the target. MC&rsquo;s target sums every random reward to the end of the
          episode, so it is centred on the truth (unbiased) but swings widely (high variance). TD&rsquo;s target uses
          one real reward and then a <em>deterministic</em> lookup of the next state&rsquo;s value, so it barely
          swings (low variance) but inherits whatever error that estimate carries (biased). Everything else in the
          table follows.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="On Sutton's random walk, run both to 100 episodes at sensible step sizes. How do their RMS errors compare?"
          options={[
            "MC wins — being unbiased, it must be more accurate",
            "They tie — bias and variance cancel out",
            "TD wins clearly — its low variance more than pays for its small bias, roughly halving the error",
          ]}
          nudge="Locked in. Unbiased doesn't mean accurate at finite data: MC's variance dominates its error, and TD's calm targets win."
        />

        <h2>The classic head-to-head</h2>
        <p>
          Sutton &amp; Barto&rsquo;s five-state random walk is the standard proving ground: states{" "}
          <M>A</M>&ndash;<M>E</M> in a line, start in the middle, step left or right with equal chance, terminate off
          the left edge (reward 0) or the right (reward 1). The true values climb evenly,{" "}
          <M>{String.raw`\tfrac16,\tfrac26,\ldots,\tfrac56`}</M>. Run TD and constant-<M>\alpha</M> MC on the same
          walks and track the error:
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`TD a=0.10:  RMS after  1 ep = 0.222   10 ep = 0.129   100 ep = 0.054
MC a=0.02:  RMS after  1 ep = 0.232   10 ep = 0.199   100 ep = 0.077`}</CodeOutput>
        <p>
          They start neck and neck, but TD pulls away fast: by ten episodes its error is already a third lower, and
          by a hundred it sits at <M>{String.raw`0.054`}</M> against MC&rsquo;s <M>{String.raw`0.077`}</M> — despite
          MC being the <em>unbiased</em> one. Unbiased is not the same as accurate: at finite data, MC&rsquo;s
          variance dwarfs TD&rsquo;s small bias. This is the rule, not the exception, on Markov problems.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>+10</strong> a few times and watch the gold TD bars slide smoothly onto the
            dashed true values while the red Monte Carlo bars lurch around them. Keep going to ~100 episodes and
            compare the two RMS readouts and the error curves on the right. Then drag <M>\alpha</M> up: MC&rsquo;s
            wobble explodes faster than TD&rsquo;s — high-variance targets can&rsquo;t tolerate big steps.</>}
          insight={<>TD&rsquo;s low-variance target lets it take steady, confident steps, so its estimates settle
            quickly and quietly. MC&rsquo;s target is a whole random return, so every update yanks the estimate
            around; it is unbiased but jittery, and needs far more episodes — and a smaller step size — to reach the
            same accuracy. Low variance is the quiet superpower.</>}
        >
          <TDvsMCLab />
        </LabFrame>

        <Callout color={GOLD} title={<>When to reach for which</>}>
          <strong>TD</strong> is the default: online, low-variance, works on continuing tasks, and exploits Markov
          structure — the reason SARSA and Q-learning are TD methods. <strong>Monte Carlo</strong> earns its keep
          when episodes are short and clearly terminating, when you want an <em>unbiased</em> estimate, or when the
          Markov assumption is so badly broken that bootstrapping off a meaningless successor value would mislead. In
          between lives a whole spectrum — the n-step returns of the final chapter — that dials smoothly from one to
          the other.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/temporal-difference-learning", label: <>← Learning from one step</> }}
          next={{ href: "/learn/learning/what-td-converges-to", label: <>Next · What TD converges to →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const tdc: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", verticalAlign: "top", lineHeight: 1.5 };
