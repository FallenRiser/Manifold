import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The Bayes classifier & Bayes error — Manifold",
  description:
    "The best any classifier can do — and the error even it can't avoid. The Bayes rule, the irreducible Bayes error rate, and why it's the yardstick every k-NN guarantee is measured against.",
};

// Two class-conditional densities overlapping. The Bayes decision boundary sits
// where they cross; the shaded overlap (min of the two) is the Bayes error.
// Unnormalised Gaussians (peak 1), equal priors → boundary at the midpoint.
const g = (x: number, mu: number) => Math.exp(-((x - mu) ** 2) / (2 * 13 * 13));
const GX = Array.from({ length: 61 }, (_, i) => i * (100 / 60));
const P0 = GX.map((x) => g(x, 37));
const P1 = GX.map((x) => g(x, 63));
const W = 360, H = 180, padB = 22, padT = 12, padX = 14;
const sx = (x: number) => Math.round((padX + (x / 100) * (W - 2 * padX)) * 100) / 100;
const sy = (v: number) => Math.round((H - padB - v * (H - padB - padT)) * 100) / 100;
const line = (arr: number[]) => GX.map((x, i) => `${sx(x)},${sy(arr[i])}`).join(" ");
// overlap polygon: along min(P0,P1), then back along the baseline
const minPts = GX.map((x, i) => `${sx(x)},${sy(Math.min(P0[i], P1[i]))}`).join(" ");
const overlap = `${minPts} ${sx(100)},${sy(0)} ${sx(0)},${sy(0)}`;

export default function BayesClassifierPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>The Bayes classifier &amp; Bayes error</>}
        intro={<>
          Before asking whether k-NN is any good, you need a standard to judge it by: the best <em>possible</em>
        classifier, and the error rate even that perfect classifier can&rsquo;t beat. That&rsquo;s the Bayes
        classifier and the Bayes error — the yardstick for the rest of this chapter.
        </>}
      />

      <div className="lesson">
        <h2>The optimal rule: follow the posterior</h2>
        <p>
          Suppose you knew the true conditional distribution <M>{String.raw`P(y \mid \mathbf{x})`}</M> exactly.
          To minimise the chance of being wrong, you&rsquo;d predict, at every <M>{String.raw`\mathbf{x}`}</M>, the
          class with the highest posterior probability:
        </p>
        <MathBlock>{String.raw`h^*(\mathbf{x}) = \arg\max_{c}\; P(y = c \mid \mathbf{x})`}</MathBlock>
        <p>
          This is the <strong>Bayes classifier</strong>, and it is provably optimal: no decision rule achieves a
          lower expected 0–1 error. The proof is short — at each <M>{String.raw`\mathbf{x}`}</M> your chance of
          error is <M>{String.raw`1 - P(\text{predicted class} \mid \mathbf{x})`}</M>, minimised by picking the
          most probable class. Do the pointwise best thing everywhere and you&rsquo;ve done the global best thing.
        </p>

        <h2>The error you still can&rsquo;t avoid</h2>
        <p>
          Even the optimal rule makes mistakes, because classes <em>overlap</em>: at a given{" "}
          <M>{String.raw`\mathbf{x}`}</M> more than one class can occur. The residual error of the Bayes
          classifier is the <strong>Bayes error rate</strong> <M>{String.raw`R^*`}</M>:
        </p>
        <MathBlock>{String.raw`R^* = \mathbb{E}_{\mathbf{x}}\!\left[\,1 - \max_{c} P(y = c \mid \mathbf{x})\right]`}</MathBlock>
        <p>
          For two classes, write <M>{String.raw`\eta(\mathbf{x}) = P(y = 1 \mid \mathbf{x})`}</M>. The Bayes rule
          predicts class 1 when <M>{String.raw`\eta > \tfrac12`}</M>, and its error at each point is the{" "}
          <em>smaller</em> of the two probabilities:
        </p>
        <MathBlock>{String.raw`R^* = \mathbb{E}_{\mathbf{x}}\!\left[\min\big(\eta(\mathbf{x}),\, 1 - \eta(\mathbf{x})\big)\right]`}</MathBlock>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Two overlapping class-conditional density curves; the shaded region where they overlap is the Bayes error, and their crossing point is the Bayes decision boundary.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polygon points={overlap} fill="color-mix(in srgb, var(--c-classification) 22%, transparent)" stroke="none" />
            <polyline points={line(P0)} fill="none" stroke="var(--c-regression)" strokeWidth={2.2} />
            <polyline points={line(P1)} fill="none" stroke="var(--c-classification)" strokeWidth={2.2} />
            <line x1={sx(50)} y1={padT} x2={sx(50)} y2={H - padB} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={sx(50)} y={padT + 8} fontSize={8.5} fill="var(--muted)" textAnchor="middle">Bayes boundary</text>
            <text x={sx(30)} y={sy(0.9)} fontSize={9} fill="var(--c-regression)" textAnchor="middle">class 0</text>
            <text x={sx(70)} y={sy(0.9)} fontSize={9} fill="var(--c-classification)" textAnchor="middle">class 1</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            The optimal boundary sits where the classes are equally likely. The shaded overlap — points that
            genuinely could be either class — is the Bayes error <M>{String.raw`R^*`}</M>. It shrinks only if the
            classes separate, never through a cleverer classifier.
          </figcaption>
        </figure>

        <h2>Why it&rsquo;s the yardstick — and why we can&rsquo;t just use it</h2>
        <p>
          <M>{String.raw`R^*`}</M> is the classification analogue of the irreducible noise floor{" "}
          <M>{String.raw`\sigma^2`}</M> in regression: the error built into the problem itself. It gives every
          other classifier a target — the closer to <M>{String.raw`R^*`}</M>, the better — and it&rsquo;s exactly
          what the next pages compare k-NN against.
        </p>
        <p>
          The catch: computing <M>{String.raw`h^*`}</M> needs the true <M>{String.raw`P(y \mid \mathbf{x})`}</M>,
          which you never have. Every real algorithm is, at heart, an attempt to <em>estimate</em> that posterior
          from data. k-NN&rsquo;s attempt is disarmingly direct — approximate <M>{String.raw`\eta(\mathbf{x})`}</M>
          by the <em>fraction of nearby points</em> in each class — which is precisely why it can come so close to
          the Bayes error, as the Cover–Hart bound shows next.
        </p>

        <Callout color="var(--c-metrics)" title={<>Bayes error is a property of the data, not the model</>}>
          You cannot beat <M>{String.raw`R^*`}</M> with a better algorithm, more features aside. If two classes
            overlap in your feature space, that overlap is a hard floor. The only ways down are{" "}
            <strong>better features</strong> (which change <M>{String.raw`\eta`}</M> by separating the classes) or
            accepting the floor. Chasing accuracy below <M>{String.raw`1 - R^*`}</M> is chasing noise.
        </Callout>

        <Quiz
          accent="var(--c-metrics)"
          questions={[
            {
              q: "What does the Bayes classifier predict at a point x?",
              options: ["The class with the highest posterior P(y=c | x)", "The nearest training point's label", "The overall majority class"],
              answer: 0,
              explain: "Maximising the posterior minimises the pointwise error probability, which makes it the globally optimal 0–1-loss classifier.",
            },
            {
              q: "The Bayes error rate R* represents…",
              options: ["The irreducible error from class overlap — no classifier can beat it", "The error of a poorly-tuned model", "The training error of k-NN"],
              answer: 0,
              explain: "R* = E[min(η, 1−η)] is baked into the data's class overlap. It's the classification analogue of the σ² noise floor in regression.",
            },
            {
              q: "How can you actually reduce the Bayes error for a problem?",
              options: ["Use better features that separate the classes", "Increase k", "Use a more powerful classifier"],
              answer: 0,
              explain: "R* is a property of the feature space, not the model. Only features that change η(x) — separating the classes — lower it; no algorithm can.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/k-nn-for-imputation-and-anomaly-detection", label: <>← Imputation &amp; anomaly detection</> }} next={{ href: "/learn/k-nearest-neighbors/the-1-nn-error-bound", label: <>Next up · The 1-NN error bound →</> }} />
      </div>
    </article>
  );
}
