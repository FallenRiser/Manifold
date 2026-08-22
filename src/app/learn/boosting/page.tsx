import Link from "next/link";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { BOOSTING_DONE, BOOSTING_TOTAL } from "@/lib/boostingTrack";

export const metadata = {
  title: "Boosting — Manifold",
  description:
    "A random forest grows hundreds of trees in parallel and averages away their variance. Boosting does the opposite: it grows trees one at a time, each one fixing the mistakes of the ensemble so far. That sequential, error-correcting loop is what makes gradient boosting the reigning champion of tabular machine learning.",
};

const TREES = "var(--c-trees)";

export default function BoostingHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Trees & ensembles", color: TREES },
          { label: BOOSTING_DONE >= BOOSTING_TOTAL ? `Complete · ${BOOSTING_TOTAL} pages` : `In progress · ${BOOSTING_DONE} of ${BOOSTING_TOTAL} pages`, color: "var(--c-fundamentals)" },
        ]}
        time="about 7 minutes"
        title={<>Learning from mistakes</>}
        intro={<>
          A <Link href="/learn/random-forests" style={link}>random forest</Link> is a committee of independent
          experts, each shouting a guess; you average them and the noise cancels. Boosting runs a different
          playbook entirely — a <em>relay</em>, not a committee. Each model studies the errors the team has made
          so far and is trained to fix precisely those. Repeat a few hundred times and the residual mistakes
          shrink toward zero. It is the most accurate thing we know how to do with a table of numbers.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          accent={TREES}
          form={<>An <em>additive</em> model <M>{String.raw`F(x)=\sum_{m=1}^{M}\nu\, h_m(x)`}</M> — a sum of many small trees <M>{String.raw`h_m`}</M>, each scaled by a small learning rate <M>{String.raw`\nu`}</M>, built one after another.</>}
          loss={<>Any differentiable loss you like: squared error, log-loss, Huber, ranking losses. Boosting <em>minimises that loss directly</em>, which is exactly what a forest cannot do.</>}
          optimiser={<><strong>Stagewise gradient descent in function space.</strong> At each step, fit the next tree to the negative gradient of the loss — the direction that reduces the current error fastest — then take a small step.</>}
        />

        <h2>Two ways to combine trees</h2>
        <p>
          The last two tracks built the same primitive — a decision tree — into a powerful model in two opposite
          ways. It is worth seeing them side by side, because boosting is defined by the contrast.
        </p>
        <ul style={ul}>
          <li>
            <strong>Bagging / random forests — parallel, variance-reducing.</strong> Grow many{" "}
            <em>deep, independent, low-bias / high-variance</em> trees on resampled data and{" "}
            <strong>average</strong> them. No tree knows the others exist. The average is smoother than any
            member; averaging attacks <em>variance</em> and leaves bias alone.
          </li>
          <li>
            <strong>Boosting — sequential, bias-reducing.</strong> Grow many{" "}
            <em>shallow, dependent, high-bias / low-variance</em> trees, each one trained on what the ensemble
            still gets wrong, and <strong>add</strong> them up. Every tree depends on all the trees before it.
            The sum is sharper than any member; boosting attacks <em>bias</em>.
          </li>
        </ul>

        <figure style={{ margin: "1.6rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "18px 12px 12px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              <CombineFig mode="bag" />
              <CombineFig mode="boost" />
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 6, maxWidth: 520, marginInline: "auto" }}>
              <strong style={{ color: TREES }}>Bagging</strong> grows independent trees and <em>averages</em> them
              — the trees never interact. <strong style={{ color: TREES }}>Boosting</strong> grows trees in
              sequence, each fit to the <em>residual</em> the previous ones left, then <em>sums</em> them.
            </div>
          </div>
        </figure>

        <p>
          A forest turns a pile of overfitting trees into something stable. Boosting turns a pile of{" "}
          <em>underfitting</em> trees — often stumps with a single split — into something extraordinarily
          precise. Same Lego brick, opposite construction.
        </p>

        <Callout color={TREES} title={<>The one-sentence definition</>}>
          Boosting builds a strong learner as a <strong>sum of weak learners</strong>, adding them one at a time,
          each new one fitted to the <strong>errors that remain</strong>. AdaBoost does this by re-weighting the
          mistakes; gradient boosting does it by fitting the <strong>gradient</strong> of the loss. They are the
          same idea seen from two angles — and the gradient view is the one that took over machine learning.
        </Callout>

        <h2>Why it earns its own track</h2>
        <p>
          Gradient boosting — through XGBoost, LightGBM and CatBoost — is the single most successful family of
          models on structured, tabular data. It wins a lopsided share of Kaggle competitions on tables; it is
          the default in industry for credit scoring, click prediction, ranking, and demand forecasting. On the
          same forest-cover-type data where the random forest scored 0.847, a tuned{" "}
          <Link href="/learn/boosting/case-a-tabular" style={link}>LightGBM reaches 0.865</Link> — but, honestly,
          only when it is tuned. That tension — a higher ceiling that must be <em>earned</em> with care — is the
          spine of this track.
        </p>

        <h2>The arc of this track</h2>
        <ol style={ol}>
          <li><strong>The boosting idea</strong> — weak learners, the &ldquo;can we boost?&rdquo; question, and AdaBoost built by hand.</li>
          <li><strong>AdaBoost in depth</strong> — the exponential-loss view, the margin theory that explains its eerie resistance to overfitting, and multiclass variants.</li>
          <li><strong>Gradient boosting</strong> — the reframing that unlocked everything: fit each tree to the negative gradient. Regression, robust losses, and classification.</li>
          <li><strong>Regularising the ensemble</strong> — shrinkage, subsampling, tree size and early stopping — because boosting, unlike bagging, <em>will</em> overfit.</li>
          <li><strong>Modern gradient boosting</strong> — XGBoost&rsquo;s second-order step, LightGBM&rsquo;s histograms, CatBoost&rsquo;s ordered boosting, and how to tune them.</li>
          <li><strong>Theory &amp; interpretation</strong> — functional gradient descent, the bias/variance contrast with bagging, and how to read a boosted model.</li>
          <li><strong>In the wild</strong> — boosting beats the forest on real data, and a clear-eyed guide to when it&rsquo;s the wrong choice.</li>
        </ol>

        <Callout color={TREES} title={<>Prerequisites</>}>
          You need <Link href="/learn/decision-trees" style={link}>decision trees</Link> (a boosted model is a
          sum of them) and the <Link href="/learn/random-forests/why-averaging-works" style={link}>bias–variance
          framing</Link> from the forest track — boosting is the mirror image of it. A little{" "}
          <Link href="/learn/optimization/gradient-descent" style={link}>gradient descent</Link> intuition will
          make the central idea click instantly.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/random-forests", label: <>← Random forests</> }}
          next={{ href: "/learn/boosting/weak-learners", label: <>Next up · Weak learners &amp; the boosting question →</> }}
        />
      </div>
    </article>
  );
}

// Signature figure: bagging (parallel/independent) vs boosting (sequential/residual).
// Static, integer coords → SSR-safe. Colours are all tokens.
const TX = [34, 90, 146, 202];
function Canopy({ x, y, s, faded }: { x: number; y: number; s: number; faded?: boolean }) {
  return (
    <g>
      <polygon
        points={`${x},${y} ${x - s},${y + s * 1.4} ${x + s},${y + s * 1.4}`}
        fill={`color-mix(in srgb, var(--c-trees) ${faded ? 14 : 30}%, var(--surface))`}
        stroke="var(--c-trees)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <rect x={x - 1.1} y={y + s * 1.4} width={2.2} height={s * 0.55} fill="var(--c-trees)" rx={1} />
    </g>
  );
}
function VArrow({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <g stroke="var(--faint)" strokeWidth={1.1} fill="var(--faint)">
      <line x1={x} y1={y1} x2={x} y2={y2 - 4} />
      <polygon points={`${x - 3},${y2 - 4.5} ${x + 3},${y2 - 4.5} ${x},${y2}`} stroke="none" />
    </g>
  );
}
function HArrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g stroke="var(--c-trees)" strokeWidth={1.3} fill="var(--c-trees)">
      <line x1={x1} y1={y} x2={x2 - 4.5} y2={y} />
      <polygon points={`${x2 - 4.5},${y - 3} ${x2 - 4.5},${y + 3} ${x2},${y}`} stroke="none" />
    </g>
  );
}
function CombineFig({ mode }: { mode: "bag" | "boost" }) {
  const boost = mode === "boost";
  return (
    <figure style={{ margin: 0, width: 236 }}>
      <svg viewBox="0 0 236 132" width="100%" style={{ maxWidth: 236, display: "block" }} role="img" aria-label={boost ? "boosting: trees in sequence, summed" : "bagging: independent trees, averaged"}>
        <text x={118} y={12} textAnchor="middle" fontSize={11} fill="var(--ink)" style={{ fontWeight: 600 }}>
          {boost ? "Boosting — sequential" : "Bagging — parallel"}
        </text>
        {TX.map((x, i) => <Canopy key={i} x={x} y={22} s={12} faded={boost} />)}
        {/* boosting: horizontal residual arrows linking the trees */}
        {boost && TX.slice(0, 3).map((x, i) => <HArrow key={i} x1={x + 13} x2={TX[i + 1] - 13} y={30} />)}
        {boost && <text x={118} y={20} textAnchor="middle" fontSize={8.5} fill="var(--c-trees)">residual → residual → residual</text>}
        {/* down arrows to the combiner bar */}
        {TX.map((x, i) => <VArrow key={i} x={x} y1={44} y2={76} />)}
        <rect x={16} y={78} width={204} height={17} rx={5} fill={`color-mix(in srgb, var(--c-trees) 12%, var(--surface))`} stroke="var(--c-trees)" strokeWidth={1} />
        <text x={118} y={90} textAnchor="middle" fontSize={11} fill="var(--ink)" style={{ fontWeight: 600 }}>
          {boost ? "Σ  sum" : "average"}
        </text>
        <VArrow x={118} y1={95} y2={116} />
        <text x={118} y={128} textAnchor="middle" fontSize={10} fill="var(--muted)">prediction</text>
      </svg>
    </figure>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
