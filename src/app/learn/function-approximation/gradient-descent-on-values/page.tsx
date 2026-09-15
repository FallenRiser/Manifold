import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { SemiGradient } from "@/components/figures/fa/FaDiagrams";

export const metadata = {
  title: "Gradient descent on values — Manifold",
  description:
    "How to actually minimise the value error: stochastic gradient descent, one visited state at a time. Gradient Monte Carlo reaches the exact optimum we computed analytically — and the same derivation exposes why the TD version is not a gradient method at all.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GradientDescentOnValues() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 11 minutes"
        title={<>Gradient descent on values</>}
        intro={<>We have an objective and a measured optimum. Now the algorithm — and it is the one you already
          know from supervised learning, with a twist hiding in it. Following the derivation carefully is what
          reveals that the most useful method in this whole track is <em>not actually doing gradient
          descent</em>.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Descend the error, one state at a time</h2>
        <p>
          We want to minimise <M>{String.raw`\overline{\mathrm{VE}}(\mathbf{w}) = \sum_s \mu(s)[v_\pi(s) - \hat v(s,\mathbf{w})]^2`}</M>.
          The sum is over every state, which we cannot afford — but we do not have to. The agent visits states{" "}
          <em>with frequency</em> <M>{String.raw`\mu`}</M> all by itself, simply by acting. So each visited state
          is already a sample from the distribution the objective wants, and we can take one small step per visit:
        </p>
        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\big[v_\pi(S_t) - \hat v(S_t,\mathbf{w})\big]\nabla \hat v(S_t,\mathbf{w})`}</MathBlock>
        <p>
          That is textbook stochastic gradient descent. Note what the agent&rsquo;s own behaviour is doing for us:{" "}
          <strong>walking around the world is how the expectation gets sampled.</strong> Nobody had to build the
          distribution; the policy is the sampler.
        </p>

        <Proof title="Where the update comes from — every step">
          <p>
            <strong>Step 0 · What we are differentiating.</strong> The objective is a weighted sum of squared
            errors over every state:
          </p>
          <MathBlock>{String.raw`\overline{\mathrm{VE}}(\mathbf{w}) = \sum_{s} \mu(s)\big[v_\pi(s) - \hat v(s,\mathbf{w})\big]^2`}</MathBlock>
          <p>
            The only thing we are allowed to move is <M>{String.raw`\mathbf{w}`}</M>. Both{" "}
            <M>{String.raw`\mu(s)`}</M> and <M>{String.raw`v_\pi(s)`}</M> are fixed facts about the environment and
            the policy — we do not get to choose them, and we usually do not even know them. Keep that in mind,
            because it is what makes a whole term collapse in Step 3.
          </p>

          <p>
            <strong>Step 1 · Name the error, so the chain rule has something to grip.</strong> Work on a single
            state <M>s</M> and give its error a name:
          </p>
          <MathBlock>{String.raw`e(\mathbf{w}) \;=\; v_\pi(s) - \hat v(s,\mathbf{w}), \qquad L(\mathbf{w}) \;=\; \tfrac{1}{2}\,e(\mathbf{w})^2`}</MathBlock>
          <p>
            Now <M>L</M> is a composition: square a thing, and that thing depends on{" "}
            <M>{String.raw`\mathbf{w}`}</M>. That is exactly the shape the chain rule handles. (The{" "}
            <M>{String.raw`\tfrac{1}{2}`}</M> is pure bookkeeping — see Step 5.)
          </p>

          <p>
            <strong>Step 2 · Differentiate the outer function.</strong> Treating <M>e</M> as the variable,
          </p>
          <MathBlock>{String.raw`\frac{d}{de}\Big(\tfrac{1}{2}e^2\Big) = e`}</MathBlock>
          <p>
            so by the chain rule the gradient we want is that, times the gradient of the inside:
          </p>
          <MathBlock>{String.raw`\nabla_{\mathbf{w}} L \;=\; e(\mathbf{w}) \cdot \nabla_{\mathbf{w}} e(\mathbf{w})`}</MathBlock>

          <p>
            <strong>Step 3 · Differentiate the inside — and watch a term vanish.</strong> The gradient is linear, so
            split the difference in two:
          </p>
          <MathBlock>{String.raw`\nabla_{\mathbf{w}} e(\mathbf{w}) = \underbrace{\nabla_{\mathbf{w}}\, v_\pi(s)}_{=\;\mathbf{0}} - \nabla_{\mathbf{w}}\, \hat v(s,\mathbf{w}) \;=\; -\,\nabla_{\mathbf{w}} \hat v(s,\mathbf{w})`}</MathBlock>
          <p>
            <M>{String.raw`v_\pi(s)`}</M> is the <em>true</em> value of state <M>s</M> — a number determined by the
            environment and the policy. Turning a weight does not change it, so its derivative with respect to every
            component of <M>{String.raw`\mathbf{w}`}</M> is zero, and the whole term disappears. It leaves behind
            only a minus sign.
          </p>
          <p>
            <strong>This single step is the hinge of the entire track.</strong> When we later swap the target for a
            bootstrapped one that <em>does</em> contain <M>{String.raw`\mathbf{w}`}</M>, this term stops being zero
            — and dropping it anyway is precisely what makes the method &ldquo;semi&rdquo;-gradient.
          </p>

          <p>
            <strong>Step 4 · Reassemble.</strong> Substitute Step 3 into Step 2:
          </p>
          <MathBlock>{String.raw`\nabla_{\mathbf{w}} L = \big[v_\pi(s) - \hat v(s,\mathbf{w})\big]\cdot\Big(-\nabla_{\mathbf{w}} \hat v(s,\mathbf{w})\Big) = -\big[v_\pi(s) - \hat v(s,\mathbf{w})\big]\nabla_{\mathbf{w}} \hat v(s,\mathbf{w})`}</MathBlock>

          <p>
            <strong>Step 5 · Descend, and see what the <M>{String.raw`\tfrac{1}{2}`}</M> was for.</strong> Gradient
            descent steps <em>against</em> the gradient, so the two minus signs cancel and the update comes out with
            a plus:
          </p>
          <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} - \alpha \nabla_{\mathbf{w}} L \;=\; \mathbf{w} + \alpha\big[v_\pi(s) - \hat v(s,\mathbf{w})\big]\nabla_{\mathbf{w}} \hat v(s,\mathbf{w})`}</MathBlock>
          <p>
            Had we not written the <M>{String.raw`\tfrac{1}{2}`}</M>, Step 2 would have produced{" "}
            <M>{String.raw`2e`}</M> and we would be carrying a stray factor of 2 — which, since it multiplies{" "}
            <M>{String.raw`\alpha`}</M>, would just mean calling a step size of 0.1 a step size of 0.05. It is
            cosmetic, which is why everyone writes the <M>{String.raw`\tfrac{1}{2}`}</M>.
          </p>

          <p>
            <strong>Step 6 · From all states to the one you are standing in.</strong> The real gradient sums over
            every state, which we cannot compute. But notice its shape:
          </p>
          <MathBlock>{String.raw`-\tfrac{1}{2}\nabla_{\mathbf{w}} \overline{\mathrm{VE}} = \sum_{s} \mu(s)\big[v_\pi(s) - \hat v(s,\mathbf{w})\big]\nabla \hat v(s,\mathbf{w}) = \mathbb{E}_{S \sim \mu}\Big[\big[v_\pi(S) - \hat v(S,\mathbf{w})\big]\nabla \hat v(S,\mathbf{w})\Big]`}</MathBlock>
          <p>
            A sum weighted by <M>{String.raw`\mu`}</M> <em>is</em> an expectation over{" "}
            <M>{String.raw`\mu`}</M>. And the agent, just by following its policy, visits states with exactly that
            frequency. So the single visited state <M>{String.raw`S_t`}</M> is a free sample from the right
            distribution, and one term is an <strong>unbiased estimate</strong> of the whole sum. Dropping the
            expectation and using that one sample is what makes this <em>stochastic</em> gradient descent:
          </p>
          <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\big[v_\pi(S_t) - \hat v(S_t,\mathbf{w})\big]\nabla \hat v(S_t,\mathbf{w})`}</MathBlock>
          <p>
            This is also the honest reason <M>{String.raw`\mu`}</M> appeared in the objective at all. It is not that
            someone decided visitation frequency <em>ought</em> to be the weighting — it is that sampling states by
            acting gives you that weighting whether you asked for it or not.
          </p>

          <p>
            <strong>Step 7 · What <M>{String.raw`\nabla \hat v`}</M> actually is.</strong> The formula stays
            abstract until you pick a function. For a <strong>linear</strong> approximator{" "}
            <M>{String.raw`\hat v(s,\mathbf{w}) = \mathbf{w}^\top \mathbf{x}(s)`}</M>, each partial derivative
            picks out one feature, so the gradient is just the feature vector:
          </p>
          <MathBlock>{String.raw`\nabla_{\mathbf{w}} \hat v(s,\mathbf{w}) = \mathbf{x}(s) \quad\Longrightarrow\quad \mathbf{w} \leftarrow \mathbf{w} + \alpha\,\big[\text{target} - \hat v\big]\,\mathbf{x}(s)`}</MathBlock>
          <p>
            For <strong>state aggregation</strong>, <M>{String.raw`\mathbf{x}(s)`}</M> is one-hot: a 1 in the
            visited state&rsquo;s group and 0 everywhere else. The gradient is zero for every other weight, so only
            that group&rsquo;s weight moves, and the vector update collapses to a single line of arithmetic:
          </p>
          <MathBlock>{String.raw`w_{k} \leftarrow w_{k} + \alpha\big[\text{target} - w_{k}\big], \qquad k = \text{group}(s)`}</MathBlock>
          <p>
            Which is exactly the line you already ran two pages ago —{" "}
            <code>w[group_of(s)] += 0.1 * (1.0 - w[group_of(s)])</code>. Starting from{" "}
            <M>{String.raw`w_k = 0`}</M> with a target of 1 and <M>{String.raw`\alpha = 0.1`}</M>, it produced{" "}
            <M>{String.raw`0.1 \times (1 - 0) = 0.100`}</M>, the number printed for <code>v(137)</code>. The
            gradient derivation and that one-liner are the same object.
          </p>
        </Proof>

        <h2>The problem: we do not have <M>{String.raw`v_\pi`}</M></h2>
        <p>
          The update needs the true value of the state we just visited — which is the thing we are trying to learn.
          This is the same wall the <Link href="/learn/learning" style={link}>Learning</Link> track hit, and it has
          the same answer: <strong>substitute a target you can actually obtain.</strong>
        </p>
        <p>
          Use the observed return <M>{String.raw`G_t`}</M>. It is a sample whose expectation is exactly{" "}
          <M>{String.raw`v_\pi(S_t)`}</M>, and — the part that matters — it is computed from rewards the world
          handed you, with no reference to <M>{String.raw`\mathbf{w}`}</M> whatsoever. Substituting an unbiased,
          weight-independent target leaves this a true SGD method, with SGD&rsquo;s convergence behaviour intact.
          That is <strong>gradient Monte Carlo</strong>.
        </p>

        <h2>Does it reach the optimum we computed?</h2>
        <p>
          The previous page computed the best achievable ten-group fit exactly, by taking weighted means of the
          true values. That gives us something rare: a <strong>known floor</strong>. So we can ask a sharp question
          rather than a vague one — not &ldquo;does learning work?&rdquo; but &ldquo;does it get where the theory
          says it should?&rdquo;
        </p>

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`learned by SGD : [-0.847 -0.661 -0.503 -0.311 -0.098  0.084  0.271  0.468  0.673  0.836]
the optimum    : [-0.829 -0.651 -0.466 -0.279 -0.086  0.093  0.28   0.467  0.652  0.83 ]

RMSE(mu) reached : 0.0575
best possible    : 0.0544
largest gap in any group: 0.0370`}</CodeOutput>

        <p>
          Ten thousand episodes of sampling, and it lands within <strong>0.037</strong> of the analytic optimum in
          every group, scoring <strong>0.0575</strong> against a floor of <strong>0.0544</strong>. It got there
          without ever being told a single true value — only rewards of 0, and a −1 or +1 at the end.
        </p>
        <p>
          The remaining gap is not a failure to converge; it is the jitter that a <em>constant</em> step size never
          stops making. As in the tabular case, <M>{String.raw`\alpha`}</M> that does not decay leaves the weights
          bouncing in a neighbourhood of the answer rather than settling on it. Shrink it on a Robbins–Monro
          schedule and the bouncing shrinks with it — at the cost of learning more slowly forever after.
        </p>

        <SemiGradient
          caption={<>The move this whole page turns on, and the reason the next four chapters exist.
            Once the target contains <M>{String.raw`\hat{v}(S', \mathbf{w})`}</M>, the weights appear
            on both sides of the error. The honest gradient would differentiate both. Semi-gradient
            methods differentiate only the left box and treat the right one as a fixed number — which
            is cheap, works nearly always, and is one of the three legs of the deadly triad.</>}
        />

        <h2>Now break it: use a TD target instead</h2>
        <p>
          Monte Carlo has to wait for the episode to end. Everything the Learning track taught says to bootstrap
          instead — replace the return with a one-step estimate,{" "}
          <M>{String.raw`R_{t+1} + \gamma\hat v(S_{t+1},\mathbf{w})`}</M> — and get an update you can apply
          immediately. Substituting it looks harmless:
        </p>
        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \alpha\big[\underbrace{R_{t+1} + \gamma\hat v(S_{t+1},\mathbf{w})}_{\text{the target}} - \hat v(S_t,\mathbf{w})\big]\nabla \hat v(S_t,\mathbf{w})`}</MathBlock>
        <p>
          It is not harmless. Look at where <M>{String.raw`\mathbf{w}`}</M> now appears: <strong>in the
          target.</strong> Go back to <strong>Step 3</strong> of the derivation — the whole thing turned on{" "}
          <M>{String.raw`\nabla_{\mathbf{w}} v_\pi(s) = \mathbf{0}`}</M>, which let one term vanish. With a
          bootstrapped target that term is <M>{String.raw`\gamma \nabla_{\mathbf{w}} \hat v(S_{t+1},\mathbf{w})`}</M>,
          which is emphatically <em>not</em> zero. A genuine gradient would have to carry it — and this update
          simply drops it.
        </p>

        <Callout color={GOLD} title={<>Semi-gradient: the name is an admission</>}>
          Because it ignores the target&rsquo;s dependence on <M>{String.raw`\mathbf{w}`}</M>, the TD update is not
          the gradient of anything. It is called a <strong>semi-gradient</strong> method, and the name is doing
          honest work: it is telling you that the guarantee is gone.
          <br /><br />
          You might expect that to be a fatal objection. It is not — semi-gradient TD is the workhorse of this
          entire track, it converges reliably in the linear on-policy case, and it learns far faster than gradient
          Monte Carlo. We use it constantly and it mostly behaves.
          <br /><br />
          But &ldquo;mostly&rdquo; is now doing real work in that sentence. <strong>This missing term is the first
          of the three ingredients of the deadly triad.</strong> On its own it is survivable. Combined with the
          other two, it is what makes the weights fly off to infinity in chapter four.
        </Callout>

        <p>
          Which sets up the rest of the chapter neatly. Next we make{" "}
          <M>{String.raw`\hat v(s,\mathbf{w})`}</M> linear, because that is the case where all of this can be
          analysed rather than hoped about — and where semi-gradient TD comes with a real, if weaker, promise about
          where it ends up.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/what-best-fit-means", label: <>← What &ldquo;best fit&rdquo; means now</> }}
          next={{ href: "/learn/function-approximation/linear-function-approximation", label: <>Next · Linear function approximation →</> }}
        />
      </div>
    </article>
  );
}

const code = `V_true = walk_true_values()[1:N_STATES + 1]
g = np.array([group_of(s) for s in range(1, N_STATES + 1)])
mu = walk_mu()
best_mu = np.array([np.sum(mu[g == k] * V_true[g == k]) / np.sum(mu[g == k])
                    for k in range(10)])

w = np.zeros(10)
alpha = 3e-4
env = RandomWalk1000(0)

for ep in range(10000):
    env.seed(ep)
    s = env.reset()
    traj = []
    while True:
        traj.append(s)
        s, r, done = env.step()          # every reward is 0 until the walk ends
        if done: break
    for st in traj:                      # target = the return G, which IS the final r
        k = group_of(st)
        w[k] += alpha * (r - w[k])

print("learned by SGD :", np.round(w, 3))
print("the optimum    :", np.round(best_mu, 3))
print()
print(f"RMSE(mu) reached : {rmse(w[g], V_true, mu):.4f}")
print(f"best possible    : {rmse(best_mu[g], V_true, mu):.4f}")
print(f"largest gap in any group: {np.max(np.abs(w - best_mu)):.4f}")`;
