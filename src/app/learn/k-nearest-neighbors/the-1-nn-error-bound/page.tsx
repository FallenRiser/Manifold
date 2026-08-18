import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The 1-NN error bound (Cover & Hart) — Manifold",
  description:
    "One of the most beautiful results in learning theory: as data grows, the simplest possible classifier — copy your nearest neighbour — is never worse than twice the Bayes error. Here's the proof and what it means.",
};

// Asymptotic 1-NN error 2η(1−η) sits above the Bayes error min(η,1−η) for all η,
// touching only at η ∈ {0, ½, 1}. Curves computed at module scope, rounded.
const H_ETA = Array.from({ length: 51 }, (_, i) => i / 50);
const nn = (e: number) => 2 * e * (1 - e);
const bayes = (e: number) => Math.min(e, 1 - e);
const W = 340, H = 200, padL = 30, padB = 26, padT = 12, padR = 12;
const px = (e: number) => Math.round((padL + e * (W - padL - padR)) * 100) / 100;
const py = (v: number) => Math.round((H - padB - (v / 0.55) * (H - padB - padT)) * 100) / 100;
const line = (f: (e: number) => number) => H_ETA.map((e) => `${px(e)},${py(f(e))}`).join(" ");

export default function OneNNBoundPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>The 1-NN error bound (Cover &amp; Hart)</>}
        intro={<>
          The crudest neighbour rule — <em>k</em> = 1, just copy the closest point — sounds like it should be
        badly beaten by cleverer methods. Cover and Hart proved the opposite: with enough data it is never
        worse than <strong>twice</strong> the best error achievable by any classifier at all.
        </>}
      />

      <div className="lesson">
        <h2>What happens to the nearest neighbour as data grows</h2>
        <p>
          Fix a query <M>{String.raw`\mathbf{x}`}</M>. As the training set grows, its nearest neighbour{" "}
          <M>{String.raw`\mathbf{x}'`}</M> gets ever closer, and in the limit{" "}
          <M>{String.raw`\mathbf{x}' \to \mathbf{x}`}</M>. So the neighbour&rsquo;s label is (asymptotically) a
          draw from the <em>same</em> distribution as the query&rsquo;s own label:{" "}
          <M>{String.raw`\eta(\mathbf{x}') \to \eta(\mathbf{x})`}</M>, writing{" "}
          <M>{String.raw`\eta(\mathbf{x}) = P(y = 1 \mid \mathbf{x})`}</M>.
        </p>

        <h2>The asymptotic 1-NN error</h2>
        <p>
          1-NN misclassifies the query exactly when the query&rsquo;s label and its neighbour&rsquo;s label{" "}
          <em>disagree</em>. Both are independent draws with class-1 probability{" "}
          <M>{String.raw`\eta = \eta(\mathbf{x})`}</M>, so the chance they differ is:
        </p>
        <MathBlock>{String.raw`P(\text{disagree} \mid \mathbf{x}) = \eta(1 - \eta) + (1 - \eta)\eta = 2\,\eta(1 - \eta)`}</MathBlock>
        <p>Averaging over the feature space gives the asymptotic 1-NN error rate:</p>
        <MathBlock>{String.raw`R_{\text{1NN}} = \mathbb{E}_{\mathbf{x}}\!\left[\,2\,\eta(\mathbf{x})\big(1 - \eta(\mathbf{x})\big)\right]`}</MathBlock>

        <h2>Comparing to Bayes, point by point</h2>
        <p>
          Recall the Bayes error is <M>{String.raw`R^* = \mathbb{E}[\min(\eta, 1-\eta)]`}</M>. Compare the two
          integrands. Writing <M>{String.raw`m = \min(\eta, 1-\eta)`}</M>, the 1-NN integrand factors as{" "}
          <M>{String.raw`2\eta(1-\eta) = 2m(1-m)`}</M>, and since <M>{String.raw`1 - m \le 1`}</M>:
        </p>
        <MathBlock>{String.raw`\underbrace{\min(\eta, 1-\eta)}_{\text{Bayes}} \;\le\; \underbrace{2\,\eta(1-\eta)}_{\text{1-NN}} \;\le\; 2\min(\eta, 1-\eta)`}</MathBlock>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="The 1-NN error curve 2η(1−η) lies above the Bayes error curve min(η,1−η) for every η, touching only at η=0, η=½, and η=1.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={line(nn)} fill="none" stroke="var(--c-classification)" strokeWidth={2.4} />
            <polyline points={line(bayes)} fill="none" stroke="var(--c-regression)" strokeWidth={2.4} />
            <text x={px(0.5)} y={py(0.5) - 6} fontSize={9} fill="var(--c-classification)" textAnchor="middle">1-NN: 2η(1−η)</text>
            <text x={px(0.26)} y={py(0.24) + 2} fontSize={9} fill="var(--c-regression)" textAnchor="end">Bayes: min(η,1−η)</text>
            <text x={px(0)} y={H - padB + 12} fontSize={8.5} fill="var(--faint)">η=0</text>
            <text x={px(0.5)} y={H - padB + 12} fontSize={8.5} fill="var(--faint)" textAnchor="middle">½</text>
            <text x={px(1)} y={H - padB + 12} fontSize={8.5} fill="var(--faint)" textAnchor="end">1</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            The 1-NN error (pink parabola) sits above the Bayes error (blue tent) everywhere, but never more
            than double it — and the two <em>coincide</em> at <M>{String.raw`\eta = 0, \tfrac12, 1`}</M> (perfect
            certainty, or a total coin-flip). The gap is the price of copying one noisy neighbour.
          </figcaption>
        </figure>

        <h2>The bound</h2>
        <p>Taking expectations of the pointwise inequality gives the celebrated result:</p>
        <MathBlock>{String.raw`R^* \;\le\; R_{\text{1NN}} \;\le\; 2R^*\left(1 - R^*\right) \;\le\; 2R^*`}</MathBlock>
        <p>
          (The tighter middle term follows from Jensen&rsquo;s inequality applied to the concave{" "}
          <M>{String.raw`2m(1-m)`}</M>.) In words: <strong>the asymptotic error of the simplest neighbour rule is
          at most twice the best error any classifier could ever achieve.</strong> Cover and Hart&rsquo;s gloss is
          famous — <em>&ldquo;in the nearest neighbour rule, at least half the classification information is
          contained in the single nearest neighbour.&rdquo;</em>
        </p>

        <Callout color="var(--c-metrics)" title={<>Why this is remarkable</>}>
          1-NN does no training, estimates nothing, and looks at a single point — yet it is guaranteed
            (asymptotically) to land within a factor of two of the theoretical optimum, <em>for any
            distribution whatsoever</em>. When the problem is nearly separable (<M>{String.raw`R^* \approx 0`}</M>),
            the bound <M>{String.raw`2R^*(1-R^*)`}</M> is tiny, so 1-NN is nearly optimal. The factor of two is
            the cost of that noisy single vote — and closing it is exactly what larger <em>k</em> does next.
        </Callout>

        <h2>The catch: a factor of two is a ceiling, not a promise of optimality</h2>
        <p>
          &ldquo;Within 2× of Bayes&rdquo; also means 1-NN can be genuinely worse — up to twice the error. It does
          not converge to <M>{String.raw`R^*`}</M>; it plateaus at <M>{String.raw`R_{\text{1NN}}`}</M>, which
          stays strictly above <M>{String.raw`R^*`}</M> whenever there&rsquo;s any class overlap. Removing that gap
          requires averaging away the neighbour&rsquo;s label noise — growing <M>{String.raw`k`}</M> with the data.
          Whether, and how, that reaches <M>{String.raw`R^*`}</M> is the consistency question, next.
        </p>

        <Quiz
          accent="var(--c-metrics)"
          questions={[
            {
              q: "As n → ∞, 1-NN misclassifies a query when…",
              options: ["The query's label and its nearest neighbour's label disagree — probability 2η(1−η)", "The neighbour is more than distance 1 away", "η(x) > ½"],
              answer: 0,
              explain: "The neighbour's label becomes an independent draw with the same η, so error is the disagreement probability η(1−η)+(1−η)η = 2η(1−η).",
            },
            {
              q: "The Cover–Hart bound states that asymptotically…",
              options: ["R* ≤ R_1NN ≤ 2R*(1−R*) ≤ 2R*", "R_1NN = R* exactly", "R_1NN ≤ R*/2"],
              answer: 0,
              explain: "1-NN's error is at least the Bayes error and at most twice it — the famous 'half the information is in the nearest neighbour' result.",
            },
            {
              q: "Why doesn't 1-NN reach the Bayes error R*?",
              options: ["It relies on one noisy neighbour label; that variance keeps it above R* whenever classes overlap", "It uses the wrong distance metric", "R* is unattainable by any method"],
              answer: 0,
              explain: "The single neighbour's label carries irreducible noise, leaving a gap. Averaging more neighbours (larger k) is what can close it — the consistency story.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/the-bayes-classifier-and-bayes-error", label: <>← The Bayes classifier &amp; Bayes error</> }} next={{ href: "/learn/k-nearest-neighbors/consistency-of-k-nn", label: <>Next up · Consistency of k-NN →</> }} />
      </div>
    </article>
  );
}
