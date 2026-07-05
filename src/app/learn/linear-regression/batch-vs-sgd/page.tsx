import { M } from "@/components/Math";
import { SGDComparisonLab } from "@/components/labs/SGDComparisonLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 200)
y = 3 + 2*x + rng.normal(scale=1.5, size=200)
X = np.column_stack([np.ones_like(x), x])
n = len(y)

# full-batch: every step uses ALL n rows
theta = np.zeros(2)
for _ in range(50):
    theta -= 0.01 * (2/n) * X.T @ (X @ theta - y)
print("batch (50 full passes):     ", theta.round(3))

# SGD: one row at a time, 50 passes = 50*n cheap updates
theta = np.zeros(2)
for _ in range(50):
    for i in rng.permutation(n):
        xi = X[i]
        theta -= 0.01 * 2 * xi * (xi @ theta - y[i])
print("SGD (one row at a time):    ", theta.round(3))`;

const codeLib = `import numpy as np
from sklearn.linear_model import SGDRegressor

rng = np.random.default_rng(0)
x = np.linspace(0, 10, 200)
y = 3 + 2*x + rng.normal(scale=1.5, size=200)
Xc = x.reshape(-1, 1)

# SGDRegressor is stochastic; LinearRegression is the full-batch / exact analog
sgd = SGDRegressor(eta0=0.01, max_iter=50, tol=None).fit(Xc, y)
print("SGDRegressor:", round(float(sgd.intercept_[0]), 3), round(float(sgd.coef_[0]), 3))`;

export const metadata = {
  title: "Batch, stochastic, and mini-batch — Manifold",
  description: "Every gradient descent variant is the same algorithm. The only question is: how many examples do you look at before taking a step?",
};

export default function BatchVsSGDPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Batch, stochastic, and mini-batch</>}
        intro={<>
          Every gradient descent variant is the same algorithm. The only question is: how many
        examples do you look at before taking a step?
        </>}
      />

      <div className="lesson">
        <p>
          So far, every time we computed a gradient we used the <em>entire</em> dataset — all twelve
          points. For a dataset this small that&rsquo;s fine. But what if you have a million rows?
          Computing the exact gradient over a million examples every single step is expensive, and
          it turns out you don&rsquo;t need to. You just need a gradient that&rsquo;s pointed{" "}
          <em>roughly</em> in the right direction.
        </p>

        <h2>Three ways to pick your data</h2>
        <p>
          The three flavours differ only in how many training examples they peek at per step:
        </p>

        <div style={threeCol}>
          <FlavorCard
            color="var(--c-regression)"
            name="Batch GD"
            badge="all N examples"
            body="Uses every data point to compute one gradient — the true, exact gradient of the loss. Steps are slow to compute but dead-on. Spirals cleanly to the minimum."
          />
          <FlavorCard
            color="var(--brand)"
            name="Mini-batch GD"
            badge="B examples (e.g. 32–512)"
            body="Samples a small random subset each step. The gradient is noisy but unbiased — wrong on any given step, right on average. Fast per step, still converges. The workhorse of modern ML."
          />
          <FlavorCard
            color="var(--c-fundamentals)"
            name="SGD"
            badge="1 example"
            body="Uses a single randomly-chosen point per step. Extremely fast to compute, very noisy. Oscillates around the minimum rather than settling into it. Can escape shallow traps."
          />
        </div>

        <p style={{ marginTop: "1.4rem" }}>
          The maths is identical in all three. You compute a gradient, subtract it scaled by the
          learning rate, and repeat. The only difference is <em>which</em> examples go into that
          gradient.
        </p>

        <PredictPrompt
          prompt={<>Three optimisers race down the same loss surface: batch, mini-batch, and pure SGD. Which one reaches the <em>neighbourhood</em> of the minimum first?</>}
          options={["Batch — smooth and direct", "SGD — noisy but takes many cheap steps", "They arrive together"]}
          nudge={<>Locked in. Watch all three paths in the lab below — both who gets close first, and who settles cleanest.</>}
        />

        <h2>See the paths diverge</h2>
        <p>
          All three start from the same point on the loss surface. Watch how differently they move.
          Batch (blue) traces a smooth arc straight to the minimum. Mini-batch (violet) takes a
          slightly wiggly route but still converges. SGD (amber) darts around — it finds the
          neighbourhood of the answer fast but keeps bouncing once it arrives.
        </p>

        <LabFrame
          tryThis={<>Run all three from the same start. Watch who gets <em>near</em> the minimum first — and who actually settles on it.</>}
          insight={<>SGD reached the neighbourhood first on dirt-cheap steps but never stops twitching; batch arrives
            late but lands clean; mini-batch splits the difference — which is why it&rsquo;s the production default.
            &ldquo;Fast to almost-there&rdquo; and &ldquo;precise at the end&rdquo; are different virtues, and you can trade between them.</>}
        >
          <SGDComparisonLab />
        </LabFrame>

        <p>
          Notice that after enough steps, all three have reached roughly the same error. SGD got
          there with a noisier path, and it never fully <em>stops</em> moving — it keeps jittering
          around the minimum because each single-example gradient sends it in a slightly wrong
          direction. That persistent noise is the defining property of SGD, and it has a surprising
          upside.
        </p>

        <h2>Why noise can be a feature, not a bug</h2>
        <p>
          For a simple bowl like linear regression there&rsquo;s only one minimum, so SGD&rsquo;s
          jitter is pure downside — you want to land exactly at the bottom, not orbit it. But for{" "}
          <em>deep neural networks</em>, which have loss surfaces full of sharp narrow valleys and
          wide flat basins, the noise matters. A sharp valley generalises poorly (tiny perturbations
          in the data send the answer flying); a wide, flat basin generalises well.
        </p>
        <p>
          The stochastic noise acts like a random shove: it knocks the ball out of sharp minima and
          lets it roll into wider, flatter ones. This is one reason why in practice, models trained
          with SGD or small mini-batches often <em>generalise better</em> than those trained with
          large-batch gradient descent, even if the large-batch run finds a lower training loss.
        </p>

        <h2>Choosing in practice</h2>
        <p>
          Nobody uses pure batch GD on large datasets, and nobody uses pure SGD on deep networks
          (too noisy to tune reliably). The default is <strong>mini-batch</strong>:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.8, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Batch size 32–256</strong> is typical. Powers of 2 fit GPU memory efficiently.</li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Smaller batches</strong> → noisier gradient, more regularisation, slower wall-clock
            convergence per epoch but sometimes better generalisation.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Larger batches</strong> → smoother gradient, faster hardware utilisation, but can
            converge to sharper (worse-generalising) minima if not compensated.
          </li>
          <li>
            If you increase the batch size by <em>k</em>, a common heuristic is to also{" "}
            <strong style={{ color: "var(--ink)" }}>scale the learning rate by √k</strong> (or simply
            by <em>k</em> — the literature is divided, but scaling matters).
          </li>
        </ul>

        <Callout color="var(--c-fundamentals)" title={<>Interview-grade answer</>}>
          &ldquo;What&rsquo;s the difference between batch GD, SGD, and mini-batch SGD?&rdquo;
            — They all follow the same update rule:{" "}
            <M>{String.raw`\theta \leftarrow \theta - \eta \,\nabla L`}</M>. The only difference is what goes into the gradient:{" "}
            all N examples (batch), one example (SGD), or B examples (mini-batch). Mini-batch
            dominates in practice because it balances compute efficiency with gradient accuracy,
            and the noise acts as implicit regularisation — especially important for neural networks
            where wider loss basins generalise better.
        </Callout>

        <h2>Both loops, side by side</h2>
        <p>
          Full-batch uses every row per step; SGD updates from one row at a time.
          Both land near <code>[3, 2]</code> — SGD just gets there with many more,
          much cheaper steps.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/linear-regression/descent-on-the-surface", label: <>← Descent on the surface</> }} next={{ href: "/learn/linear-regression/when-do-we-stop", label: <>Next up · When do we stop? →</> }} />
      </div>
    </article>
  );
}



function FlavorCard({ color, name, badge, body }: { color: string; name: string; badge: string; body: string }) {
  return (
    <div style={{
      background: `color-mix(in srgb, ${color} 6%, var(--surface-2))`,
      border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`,
      borderRadius: 14, padding: "14px 16px",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 600, color }}>{name}</span>
        <span style={{ fontSize: 11.5, color: "var(--muted)", background: `color-mix(in srgb, ${color} 11%, var(--surface))`, display: "inline-block", padding: "2px 8px", borderRadius: 999, alignSelf: "flex-start" }}>{badge}</span>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

const threeCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  margin: "1.4rem 0 0",
};




