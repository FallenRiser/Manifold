import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Staircase } from "@/components/figures/fa/Staircase";
import { WALK_STATES, TD_DESTINATIONS } from "@/components/figures/fa/data";

export const metadata = {
  title: "Semi-gradient TD(0) — Manifold",
  description:
    "Bootstrap with a linear approximator and TD still converges — but not to the best fit. It converges to the TD fixed point, a different function we can compute exactly. Measured on the 1000-state walk: sampled TD lands within 0.029 of that fixed point, and 2.1x worse than the value-error optimum.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SemiGradientTD() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 11 minutes"
        title={<>Semi-gradient TD(0)</>}
        intro={<>Gradient Monte Carlo is honest but slow: it waits for every episode to end. The Learning track
          taught you to bootstrap instead. Do that with a function approximator and something subtle happens —
          TD still settles down reliably, but it settles on a <em>different answer</em> from the one you asked
          for. We can compute exactly which one.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The algorithm</h2>
        <p>
          Take the gradient update and replace the unknown true value with a one-step bootstrapped target, exactly
          as in <Link href="/learn/learning/temporal-difference-learning" style={link}>tabular TD</Link>. With a
          linear approximator the gradient is just the feature vector, so the whole update is:
        </p>
        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\big[R_{t+1} + \gamma\,\mathbf{w}^\top\mathbf{x}(S_{t+1}) - \mathbf{w}^\top\mathbf{x}(S_t)\big]\,\mathbf{x}(S_t)`}</MathBlock>
        <p>
          Two pages ago we saw why this is only a <em>semi</em>-gradient:{" "}
          <M>{String.raw`\mathbf{w}`}</M> appears inside the target, and the update simply ignores that. So the
          natural question is what, if anything, it converges to. Not the value-error minimum — it is not
          descending the value error. Then what?
        </p>

        <h2>Where TD settles</h2>
        <p>
          An algorithm driven by noisy updates stops drifting when its updates cancel out <em>on average</em>. So
          ask what the expected TD update is, and where it becomes zero. For linear TD the answer is a small system
          of equations:
        </p>
        <MathBlock>{String.raw`\mathbf{A}\,\mathbf{w}_{\text{TD}} = \mathbf{b}, \qquad \mathbf{A} = \mathbb{E}\big[\mathbf{x}_t(\mathbf{x}_t - \gamma\,\mathbf{x}_{t+1})^\top\big], \qquad \mathbf{b} = \mathbb{E}\big[R_{t+1}\,\mathbf{x}_t\big]`}</MathBlock>
        <p>
          The solution <M>{String.raw`\mathbf{w}_{\text{TD}}`}</M> is the <strong>TD fixed point</strong>. It is
          where TD lands, and it is generally <em>not</em> where the value-error optimum is.
        </p>

        <Proof title="Why the fixed point solves A w = b">
          <p>
            Write the update as <M>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\,\delta_t\,\mathbf{x}_t`}</M>{" "}
            with the TD error{" "}
            <M>{String.raw`\delta_t = R_{t+1} + \gamma\,\mathbf{w}^\top\mathbf{x}_{t+1} - \mathbf{w}^\top\mathbf{x}_t`}</M>.
            Expand the product <M>{String.raw`\delta_t\,\mathbf{x}_t`}</M>:
          </p>
          <MathBlock>{String.raw`\delta_t\,\mathbf{x}_t = R_{t+1}\mathbf{x}_t - \mathbf{x}_t(\mathbf{x}_t - \gamma\,\mathbf{x}_{t+1})^\top\mathbf{w}`}</MathBlock>
          <p>
            (the scalar <M>{String.raw`\mathbf{w}^\top\mathbf{x}`}</M> equals{" "}
            <M>{String.raw`\mathbf{x}^\top\mathbf{w}`}</M>, which lets <M>{String.raw`\mathbf{w}`}</M> move to the
            right). Take the expectation over the states the policy visits:
          </p>
          <MathBlock>{String.raw`\mathbb{E}[\delta_t\,\mathbf{x}_t] = \mathbf{b} - \mathbf{A}\,\mathbf{w}`}</MathBlock>
          <p>
            The expected step is zero exactly when <M>{String.raw`\mathbf{A}\mathbf{w} = \mathbf{b}`}</M>. In matrix
            form over all states, with <M>{String.raw`\mathbf{D} = \mathrm{diag}(\mu)`}</M>, the transition matrix{" "}
            <M>{String.raw`\mathbf{P}`}</M> and expected rewards <M>{String.raw`\bar{\mathbf{r}}`}</M>:
          </p>
          <MathBlock>{String.raw`\mathbf{A} = \mathbf{X}^\top\mathbf{D}(\mathbf{X} - \gamma\,\mathbf{P}\mathbf{X}), \qquad \mathbf{b} = \mathbf{X}^\top\mathbf{D}\,\bar{\mathbf{r}}`}</MathBlock>
          <p>
            That is what the code below solves. On-policy, <M>{String.raw`\mathbf{A}`}</M> is positive definite, so
            the fixed point exists and is unique — and the expected update always points towards it, which is why
            linear on-policy TD converges (Tsitsiklis &amp; Van Roy, 1997). Keep the words{" "}
            <em>on-policy</em>; the whole next chapter is about what happens without them.
          </p>
        </Proof>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Run semi-gradient TD to convergence with a ten-group aggregation. The best that
            representation can possibly do has a value error of 0.0544. Where does TD land?</>}
          options={[
            "At 0.0544 — it converges to the best available approximation",
            "Slightly worse, within a few percent",
            "About twice as bad",
            "It does not converge at all",
          ]}
          nudge="Locked in. Both destinations are computed exactly and drawn below."
        />

        <Staircase
          x={WALK_STATES}
          lines={TD_DESTINATIONS}
          ylabel="vπ(s)"
          xlabel="state"
          caption={<>Two staircases, both reachable, and TD picks the worse one. The green steps are
            the value-error optimum — the closest a ten-group aggregation can get to the truth. The
            red steps are the TD fixed point, computed exactly by solving{" "}
            <M>{String.raw`X^\top D (X - PX)\mathbf{w} = X^\top D \bar{r}`}</M> rather than by
            running anything. Its value error is <strong>0.1167</strong> against{" "}
            <strong>0.0544</strong>: <strong>2.15 times</strong> worse, with the two disagreeing by
            as much as 0.1711 in a single group, and worst at the ends. This is not slow convergence
            or a bad step size. TD is not minimising the error you defined last chapter; it is
            solving a different equation, and this is where that equation puts it.</>}
        />

        <h2>Computing both destinations, then running TD</h2>
        <p>
          On the random walk we know the model exactly, so we can compute both answers directly: the value-error
          optimum (where gradient Monte Carlo heads) and the TD fixed point (where TD heads). Then we run
          semi-gradient TD from samples alone and see which one it lands on.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Semi-gradient TD runs for 10,000 episodes using only sampled rewards. Which destination will it
            end up closest to?</>}
          options={["The value-error optimum", "The TD fixed point", "Somewhere between", "Neither — it won't settle"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`VE optimum      : [-0.83  -0.652 -0.466 -0.279 -0.087  0.093  0.279  0.466  0.652  0.83 ]   VE 0.0544
TD fixed point  : [-0.693 -0.481 -0.303 -0.146 -0.001  0.122  0.25   0.388  0.544  0.731]   VE 0.1167
TD, from samples: [-0.696 -0.489 -0.315 -0.155 -0.012  0.109  0.23   0.359  0.516  0.718]   VE 0.1165

sampled TD vs its fixed point : max gap 0.0290
sampled TD vs the VE optimum  : max gap 0.1631`}</CodeOutput>

        <p>
          Sampled TD lands within <strong>0.029</strong> of the TD fixed point in every group — and{" "}
          <strong>0.163</strong> from the value-error optimum. It never went to the best fit. It went, reliably,
          precisely where the fixed-point equation said it would, having never seen either answer.
        </p>
        <p>
          And that destination is worse by the measure we set out to minimise: a value error of{" "}
          <strong>0.1167</strong> against <strong>0.0544</strong>, about <strong>2.1×</strong>. Look at the shape of
          the error, too. The TD fixed point is systematically <em>flatter</em> than the truth at both ends — the
          outer groups sit at −0.693 and +0.731 where the optimum has ±0.83. Bootstrapping pulls each group toward
          its neighbours&rsquo; estimates, and with aggregation that averaging leaks across group boundaries and
          shrinks the whole curve inward.
        </p>

        <Callout color={GOLD} title={<>How bad can the TD fixed point be?</>}>
          There is a classical bound for discounted, continuing tasks:
          <MathBlock>{String.raw`\overline{\mathrm{VE}}(\mathbf{w}_{\text{TD}}) \le \frac{1}{1-\gamma}\,\min_{\mathbf{w}}\overline{\mathrm{VE}}(\mathbf{w})`}</MathBlock>
          With <M>{String.raw`\gamma = 0.9`}</M> that permits TD to be up to <strong>10×</strong> worse than the
          best fit; with <M>{String.raw`\gamma = 0.99`}</M>, 100×. It is a worst case, not a prediction.
          <br /><br />
          It does not strictly apply here — the walk is episodic and undiscounted, <M>{String.raw`\gamma = 1`}</M>,
          where the bound is empty. So we cannot quote a guarantee for this problem; we can only report the
          measurement, which is <strong>2.1×</strong>. The honest reading is that TD&rsquo;s bias is real, is
          usually far smaller than the worst case, and that nothing in the theory promises you that.
        </Callout>

        <h2>So why does everyone use TD?</h2>
        <p>
          Because the reasons from the Learning track have not gone away. TD updates every step instead of waiting
          for the episode to end, so it works online and in continuing tasks where episodes never end at all. Its
          targets have lower variance than full returns. And in control — next chapter — bootstrapping is often the
          only practical option.
        </p>
        <p>
          We deliberately do not claim here that TD learned <em>faster</em>. On this walk with aggregation, which
          method got closer to its own destination sooner depended entirely on the step size, and we could not find
          a comparison fair enough to call a winner. The robust result is the one above: <strong>TD trades a biased
          destination for a cheaper journey</strong>, and you should know which destination you have chosen.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/tile-coding", label: <>← Coarse coding &amp; tile coding</> }}
          next={{ href: "/learn/function-approximation/semi-gradient-sarsa", label: <>Next · Semi-gradient SARSA →</> }}
        />
      </div>
    </article>
  );
}

const code = `P, rbar, mu = walk_model()                       # ORACLE: the walk's exact model
V_true = walk_true_values()[1:N_STATES + 1]
S = np.arange(1, N_STATES + 1)
k = 10
X = np.zeros((N_STATES, k))
X[np.arange(N_STATES), [group_of(s, k) for s in S]] = 1.0

# Where gradient MC is headed: the VE optimum (weighted least squares)
W = np.sqrt(mu)[:, None]
w_ve, *_ = np.linalg.lstsq(W * X, np.sqrt(mu) * V_true, rcond=None)

# Where semi-gradient TD is headed: solve  X^T D (X - P X) w = X^T D rbar
D = np.diag(mu)
w_td = np.linalg.solve(X.T @ D @ (X - P @ X), X.T @ D @ rbar)

# Now actually RUN semi-gradient TD(0), from samples alone
g = np.array([group_of(s, k) for s in S])
w = np.zeros(k)
env = RandomWalk1000(0)
for ep in range(10000):
    env.seed(100000 + ep); s = env.reset()
    while True:
        s2, r, done = env.step()
        target = r if done else w[g[s2 - 1]]       # bootstrap off our OWN estimate
        w[g[s - 1]] += 1e-3 * (target - w[g[s - 1]])
        s = s2
        if done: break

print("VE optimum      :", np.round(w_ve, 3), f"  VE {rmse(X @ w_ve, V_true, mu):.4f}")
print("TD fixed point  :", np.round(w_td, 3), f"  VE {rmse(X @ w_td, V_true, mu):.4f}")
print("TD, from samples:", np.round(w, 3), f"  VE {rmse(X @ w, V_true, mu):.4f}")
print()
print(f"sampled TD vs its fixed point : max gap {np.max(np.abs(w - w_td)):.4f}")
print(f"sampled TD vs the VE optimum  : max gap {np.max(np.abs(w - w_ve)):.4f}")`;
