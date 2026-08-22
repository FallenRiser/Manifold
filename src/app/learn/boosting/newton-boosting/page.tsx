import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Newton boosting: XGBoost's second-order step — Manifold",
  description:
    "XGBoost's leap: expand the loss to second order, so every split and every leaf value uses the curvature (Hessian), not just the slope (gradient) — and bake an explicit regularization penalty into the objective. The result is the split-gain formula that made XGBoost the tabular champion.",
};

const TREES = "var(--c-trees)";

export default function NewtonBoostingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Newton boosting: XGBoost&rsquo;s second-order step</>}
        intro={<>
          Classic gradient boosting is <em>first-order</em> — it follows the slope of the loss. XGBoost (Chen &amp;
          Guestrin, 2016) uses the <strong>slope and the curvature</strong>, and folds an explicit complexity
          penalty into the objective the trees optimise. Two changes, one enormous jump in accuracy and speed.
        </>}
      />

      <div className="lesson">
        <h2>Second-order: use the curvature too</h2>
        <p>
          At each round, expand the loss around the current prediction with a second-order Taylor series. For each
          example define the <strong>gradient</strong> and <strong>Hessian</strong> of the loss w.r.t. the score:
        </p>
        <MathBlock>{String.raw`g_i = \frac{\partial L}{\partial F}\bigg|_{F_{m-1}}, \qquad h_i = \frac{\partial^2 L}{\partial F^2}\bigg|_{F_{m-1}}`}</MathBlock>
        <p>
          The per-round objective for the new tree becomes (dropping constants) a tidy quadratic:
        </p>
        <MathBlock>{String.raw`\tilde{\mathcal{L}}_m = \sum_i \Big[\, g_i\, h_m(x_i) + \tfrac12 h_i\, h_m(x_i)^2 \,\Big] + \Omega(h_m)`}</MathBlock>
        <p>
          Classic gradient boosting kept only the <M>{String.raw`g_i`}</M> term (fit the negative gradient) and
          recovered curvature approximately, through a line search on the leaves. XGBoost keeps the{" "}
          <M>{String.raw`h_i`}</M> term explicitly — a <strong>Newton step</strong> in function space — so the
          curvature guides not just the leaf values but the choice of <em>splits</em> as well.
        </p>

        <figure style={{ margin: "1.6rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 12px 12px" }}>
            <NewtonFig />
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8, maxWidth: 520, marginInline: "auto" }}>
              At the current prediction, gradient boosting knows only the{" "}
              <span style={{ color: "var(--c-classification)" }}>slope</span> — a tangent gives direction but not
              how far to step. Newton boosting also fits the local{" "}
              <span style={{ color: "var(--c-trees)" }}>parabola</span> from the curvature, so it takes a
              well-scaled step that jumps most of the way to the minimum in one round.
            </div>
          </div>
        </figure>

        <h2>The regularised objective</h2>
        <p>
          The <M>{String.raw`\Omega`}</M> above is XGBoost&rsquo;s second idea: penalise tree complexity{" "}
          <em>inside</em> the objective, rather than only through external knobs.
        </p>
        <MathBlock>{String.raw`\Omega(h) = \gamma\, T + \tfrac12 \lambda \sum_{j=1}^{T} w_j^2`}</MathBlock>
        <p>
          <M>{String.raw`T`}</M> is the number of leaves (penalised by <M>{String.raw`\gamma`}</M>, so a split
          must earn its keep) and <M>{String.raw`w_j`}</M> are the leaf output values (L2-penalised by{" "}
          <M>{String.raw`\lambda`}</M>, shrinking them toward zero). Regularisation is now part of what the tree
          optimises, not a constraint bolted on afterward.
        </p>

        <h2>The two formulas that result</h2>
        <p>
          Minimising the quadratic objective over a leaf&rsquo;s value is now exact. For a leaf holding example
          set <M>{String.raw`I_j`}</M>, write <M>{String.raw`G_j = \sum_{i\in I_j} g_i`}</M> and{" "}
          <M>{String.raw`H_j = \sum_{i\in I_j} h_i`}</M>. The optimal leaf weight and the resulting loss are:
        </p>
        <MathBlock>{String.raw`w_j^\star = -\frac{G_j}{H_j + \lambda}, \qquad \mathcal{L}_j^\star = -\frac12 \frac{G_j^2}{H_j + \lambda}`}</MathBlock>
        <p>
          And a candidate split — dividing a node into left <M>{String.raw`L`}</M> and right{" "}
          <M>{String.raw`R`}</M> — is scored by the <strong>gain</strong>, the loss it removes minus the cost of
          the extra leaf:
        </p>
        <MathBlock>{String.raw`\text{Gain} = \tfrac12\!\left[\frac{G_L^2}{H_L+\lambda} + \frac{G_R^2}{H_R+\lambda} - \frac{(G_L+G_R)^2}{H_L+H_R+\lambda}\right] - \gamma`}</MathBlock>
        <p>
          This single expression <em>is</em> XGBoost&rsquo;s tree-growing criterion — the second-order replacement
          for the Gini or variance reduction a <Link href="/learn/decision-trees/what-makes-a-good-split" style={link}>plain
          tree</Link> uses. The Hessian in every denominator means a split is only rewarded where the model is{" "}
          <em>curved</em> (uncertain); the <M>{String.raw`\lambda`}</M> damps leaves with little evidence; and{" "}
          <M>{String.raw`\gamma`}</M> vetoes splits that don&rsquo;t clear a minimum gain.
        </p>

        <Callout color={TREES} title={<>Where you&rsquo;ve seen H before</>}>
          On the <Link href="/learn/boosting/gbm-classification" style={link}>classification page</Link>, the
          log-loss leaf value divided the gradient by <M>{String.raw`\sum p(1-p)`}</M> — that sum{" "}
          <em>is</em> the Hessian <M>{String.raw`\sum h_i`}</M>. XGBoost&rsquo;s insight was to promote that
          Hessian from a leaf-value detail to the star of the whole split search. The famous{" "}
          <code>min_child_weight</code> is simply a floor on <M>{String.raw`H_j`}</M> — a leaf must contain enough
          total curvature (evidence) to exist.
        </Callout>

        <h2>The regularisation, measured</h2>
        <p>XGBoost on the covtype task, varying only the L2 leaf penalty <M>{String.raw`\lambda`}</M>:</p>
        <CodeOutput label="XGBoost test accuracy vs reg_lambda (covtype)">{`  reg_lambda =  0.0    acc 0.848
  reg_lambda =  1.0    acc 0.843
  reg_lambda = 10.0    acc 0.837`}</CodeOutput>
        <p>
          On this data more L2 slightly <em>hurts</em> — the signal is strong and wants expressive leaves — so the
          best setting is low. That is the honest lesson about regularisation knobs: they are dials to be tuned
          per dataset, not virtues to be maximised. What XGBoost gives you is the <em>machinery</em> to trade fit
          against smoothness precisely; where to set the dial is an empirical question for{" "}
          <Link href="/learn/boosting/tuning" style={link}>tuning</Link>. The other half of XGBoost&rsquo;s success —
          raw speed — is the <Link href="/learn/boosting/histogram" style={link}>next page</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/early-stopping", label: <>← Early stopping &amp; staged prediction</> }}
          next={{ href: "/learn/boosting/histogram", label: <>Next up · Histogram boosting: LightGBM &amp; speed →</> }}
        />
      </div>
    </article>
  );
}

// Static Newton-vs-gradient figure. A fixed convex (non-quadratic) loss, so the
// second-order Taylor genuinely beats the tangent. Deterministic → SSR-safe.
const NL = (F: number) => 0.5 * (F - 1.4) ** 2 + 0.4 * Math.exp(-1.3 * F);
const NLp = (F: number) => (F - 1.4) - 0.52 * Math.exp(-1.3 * F);
const NLpp = (F: number) => 1 + 0.676 * Math.exp(-1.3 * F);
const NF0 = -0.2;
const NF_NEWT = NF0 - NLp(NF0) / NLpp(NF0);
const N_TRUEMIN = (() => { let b = 0, bv = Infinity; for (let F = -0.6; F <= 2.6; F += 0.005) { const v = NL(F); if (v < bv) { bv = v; b = F; } } return b; })();
const NW = 300, NH = 150, NP = 16, NFA = -0.6, NFB = 2.6;
const NYMAX = NL(NFA);
const nrr = (v: number) => Math.round(v * 100) / 100;
const nx = (F: number) => nrr(NP + ((F - NFA) / (NFB - NFA)) * (NW - 2 * NP));
const ny = (y: number) => nrr(NP + (1 - y / NYMAX) * (NH - 2 * NP));
function nSample(fn: (F: number) => number) {
  const pts: string[] = [];
  for (let F = NFA; F <= NFB + 1e-9; F += 0.04) { const y = fn(F); if (y >= -0.01 && y <= NYMAX) pts.push(`${nx(F)},${ny(y)}`); }
  return pts.join(" ");
}
function NewtonFig() {
  const curve = nSample(NL);
  const tangent = nSample((F) => NL(NF0) + NLp(NF0) * (F - NF0));
  const parab = nSample((F) => NL(NF0) + NLp(NF0) * (F - NF0) + 0.5 * NLpp(NF0) * (F - NF0) ** 2);
  return (
    <svg viewBox={`0 0 ${NW} ${NH}`} width="100%" style={{ maxWidth: NW, display: "block", margin: "0 auto" }} role="img" aria-label="gradient tangent vs Newton parabola on a loss curve">
      <line x1={NP} y1={NH - NP} x2={NW - NP} y2={NH - NP} stroke="var(--border-strong)" strokeWidth={1} />
      <text x={NW - NP} y={NH - 4} textAnchor="end" fontSize={9} fill="var(--faint)">model output F</text>
      {/* the true loss */}
      <polyline points={curve} fill="none" stroke="var(--ink)" strokeWidth={2} />
      {/* gradient tangent */}
      <polyline points={tangent} fill="none" stroke="var(--c-classification)" strokeWidth={1.4} strokeDasharray="4 3" />
      {/* Newton parabola */}
      <polyline points={parab} fill="none" stroke="var(--c-trees)" strokeWidth={1.6} strokeDasharray="2 2.5" />
      {/* current point */}
      <circle cx={nx(NF0)} cy={ny(NL(NF0))} r={3.5} fill="var(--ink)" />
      <text x={nx(NF0)} y={ny(NL(NF0)) - 7} textAnchor="middle" fontSize={9} fill="var(--muted)">now</text>
      {/* Newton step lands here */}
      <line x1={nx(NF_NEWT)} y1={ny(NL(NF_NEWT))} x2={nx(NF_NEWT)} y2={NH - NP} stroke="var(--c-trees)" strokeWidth={1} strokeDasharray="2 2" />
      <circle cx={nx(NF_NEWT)} cy={ny(NL(NF_NEWT))} r={3} fill="var(--c-trees)" />
      <text x={nx(NF_NEWT)} y={ny(NL(NF_NEWT)) - 7} textAnchor="middle" fontSize={9} fill="var(--c-trees)">Newton step</text>
      {/* true minimum */}
      <circle cx={nx(N_TRUEMIN)} cy={ny(NL(N_TRUEMIN))} r={2.4} fill="none" stroke="var(--muted)" strokeWidth={1.2} />
      <text x={nx(N_TRUEMIN)} y={ny(NL(N_TRUEMIN)) + 14} textAnchor="middle" fontSize={8.5} fill="var(--muted)">true min</text>
    </svg>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
