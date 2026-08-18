import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-NN as non-parametric estimation — Manifold",
  description:
    "The unifying view: k-NN doesn't classify so much as estimate a density or a regression function by local averaging with an adaptive bandwidth. What 'non-parametric' really buys, and what it costs.",
};

// 1-D k-NN density view: a fixed k=3 uses a NARROW window where points are dense
// and a WIDE one where they're sparse — an adaptive bandwidth. Coordinates static.
const PTS1D = [10, 14, 17, 20, 24, 28, 33, 55, 78, 96];
const K = 3;
const rk = (q: number) => {
  const d = PTS1D.map((x) => Math.abs(x - q)).sort((a, b) => a - b);
  return d[K - 1];
};
const QA = 20, QB = 66;             // dense query, sparse query
const RA = rk(QA), RB = rk(QB);     // 4 and 30
const W = 340, H = 140, padX = 20;
const midY = 78;
const sx = (x: number) => Math.round((padX + (x / 100) * (W - 2 * padX)) * 100) / 100;

function Window({ q, r, label, up }: { q: number; r: number; label: string; up: boolean }) {
  const y = up ? midY - 26 : midY + 26;
  return (
    <g>
      <line x1={sx(q - r)} y1={y} x2={sx(q + r)} y2={y} stroke="var(--c-classification)" strokeWidth={2} />
      <line x1={sx(q - r)} y1={y - 4} x2={sx(q - r)} y2={y + 4} stroke="var(--c-classification)" strokeWidth={1.5} />
      <line x1={sx(q + r)} y1={y - 4} x2={sx(q + r)} y2={y + 4} stroke="var(--c-classification)" strokeWidth={1.5} />
      <line x1={sx(q)} y1={midY} x2={sx(q)} y2={y} stroke="var(--faint)" strokeWidth={0.8} strokeDasharray="2 2" />
      <rect x={sx(q) - 4} y={midY - 4} width={8} height={8} transform={`rotate(45 ${sx(q)} ${midY})`} fill="var(--ink)" />
      <text x={sx(q)} y={up ? y - 7 : y + 14} fontSize={8.5} fill="var(--muted)" textAnchor="middle">{label}</text>
    </g>
  );
}

export default function NonParametricPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>k-NN as non-parametric estimation</>}
        intro={<>
          Step back and k-NN isn&rsquo;t really a &ldquo;classifier&rdquo; at all — it&rsquo;s a way to <em>estimate</em>
        a probability or a function directly from data, with no assumed form. Seeing it as estimation explains
        both its uncanny flexibility and its appetite for data.
        </>}
      />

      <div className="lesson">
        <h2>What &ldquo;non-parametric&rdquo; means</h2>
        <p>
          A parametric model fixes a form and a finite parameter vector — a line has two, a logistic model has{" "}
          <M>{String.raw`d+1`}</M>. A <strong>non-parametric</strong> model fixes neither: it makes assumptions
          about <em>smoothness</em>, not functional form, and its effective complexity grows with the data. k-NN
          is the archetype — it keeps every training point, so the &ldquo;model&rdquo; <em>is</em> the data, and it
          can approximate any decision boundary given enough of it. That&rsquo;s the flexibility the whole track has
          leaned on.
        </p>

        <h2>k-NN is really estimating η(x)</h2>
        <p>
          Classification is a by-product. What k-NN actually computes at a point is the local class fraction,
          which is a direct estimate of the posterior:
        </p>
        <MathBlock>{String.raw`\hat{\eta}(\mathbf{x}) = \frac{1}{k}\sum_{i \in N_k(\mathbf{x})} \mathbb{1}[y_i = 1] \;\approx\; \eta(\mathbf{x}) = P(y = 1 \mid \mathbf{x})`}</MathBlock>
        <p>
          Predicting a class is then just thresholding <M>{String.raw`\hat{\eta}`}</M> at{" "}
          <M>{String.raw`\tfrac12`}</M> — the empirical Bayes rule. Regression is the identical construction with
          real-valued <M>{String.raw`y`}</M> (local averaging of targets). So &ldquo;vote&rdquo; and &ldquo;average&rdquo;
          are the same act of <strong>local estimation</strong>, and consistency (last page) is exactly the
          statement that this estimate converges to the truth.
        </p>

        <h2>Density estimation with an adaptive bandwidth</h2>
        <p>
          k-NN also estimates the data <em>density</em>. The smallest ball around <M>{String.raw`\mathbf{x}`}</M>
          that captures <M>{String.raw`k`}</M> points, with volume <M>{String.raw`V_k(\mathbf{x})`}</M>, gives:
        </p>
        <MathBlock>{String.raw`\hat{p}(\mathbf{x}) = \frac{k}{n\,V_k(\mathbf{x})}`}</MathBlock>
        <p>
          The key is that <M>{String.raw`V_k`}</M> <em>adapts</em>: where data is dense, a small ball already
          holds <M>{String.raw`k`}</M> points; where it&rsquo;s sparse, the ball must grow. Fixed <M>{String.raw`k`}</M>,
          variable width:
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", maxWidth: 380, margin: "0 auto" }} role="img" aria-label="Points on a line, dense on the left and sparse on the right. A fixed k=3 window is narrow in the dense region and wide in the sparse region — an adaptive bandwidth.">
            <rect x={1} y={1} width={W - 2} height={H - 2} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <line x1={sx(0)} y1={midY} x2={sx(100)} y2={midY} stroke="var(--border)" strokeWidth={1} />
            {PTS1D.map((x, i) => <circle key={i} cx={sx(x)} cy={midY} r={3.4} fill="var(--c-regression)" />)}
            <Window q={QA} r={RA} label={`dense → narrow (r=${RA})`} up={true} />
            <Window q={QB} r={RB} label={`sparse → wide (r=${RB})`} up={false} />
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            The same <M>{String.raw`k = 3`}</M> spans a tiny interval on the crowded left and a broad one on the
            sparse right. This is the mirror image of kernel density estimation, which fixes the window width and
            lets the <em>count</em> vary instead.
          </figcaption>
        </figure>

        <Callout color="var(--c-metrics)" title={<>k-NN and kernel methods are duals</>}>
          Both estimate the same density by counting points in a window. <strong>Kernel density estimation</strong>
            fixes the bandwidth and counts however many points fall in it; <strong>k-NN</strong> fixes the count{" "}
            <M>{String.raw`k`}</M> and grows the window until it holds them. Fixed volume vs fixed count — two
            faces of one idea. This is why distance-weighted k-NN turned out to <em>be</em> Nadaraya–Watson kernel
            regression back in the weighting chapter.
        </Callout>

        <h2>The price: slow rates and the curse</h2>
        <p>
          Non-parametric flexibility isn&rsquo;t free. Parametric estimators converge at the fast{" "}
          <M>{String.raw`O(1/\sqrt{n})`}</M> rate; non-parametric ones are slower, and the rate <em>degrades with
          dimension</em>. For a smooth target the k-NN regression error shrinks like{" "}
          <M>{String.raw`n^{-2/(d+2)}`}</M> — which is fine for small <M>{String.raw`d`}</M> but crawls as{" "}
          <M>{String.raw`d`}</M> grows: reaching a fixed accuracy needs sample sizes that blow up exponentially in
          the dimension. That is the <Link href="/learn/k-nearest-neighbors/the-curse-of-dimensionality" style={inlineLink}>curse
          of dimensionality</Link> reappearing — this time attacking the <em>rate</em> of convergence, not the
          limit. Consistency says k-NN gets there; the rate says how patiently you&rsquo;ll wait.
        </p>

        <Callout color="var(--c-metrics)" title={<>Where this chapter leaves you</>}>
          The theory closes the loop: k-NN is a universally consistent, non-parametric estimator of the Bayes
            rule, within a factor of two even at <M>{String.raw`k = 1`}</M>, whose flexibility and its costs —
            data hunger, no extrapolation, the curse — are two sides of being assumption-light. The last chapter
            steps back to the practitioner&rsquo;s summary: <em>when to reach for k-NN, and how it compares to
            logistic regression, SVMs, trees, and its namesake k-means.</em> See the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <Quiz
          accent="var(--c-metrics)"
          questions={[
            {
              q: "In what sense is k-NN 'non-parametric'?",
              options: ["It assumes smoothness, not a functional form; its complexity grows with the data", "It has no hyperparameters", "It never uses numbers"],
              answer: 0,
              explain: "Non-parametric means no fixed parameter vector or assumed form — the data itself is the model, and effective capacity scales with n.",
            },
            {
              q: "How does the k-NN density estimate k/(n·V_k) achieve an adaptive bandwidth?",
              options: ["V_k grows where data is sparse and shrinks where it's dense, for fixed k", "It uses a fixed-width window everywhere", "It ignores the volume"],
              answer: 0,
              explain: "Fixing the count k forces the enclosing ball's volume to adapt to local density — the dual of kernel density estimation's fixed window.",
            },
            {
              q: "Why do non-parametric methods like k-NN struggle in high dimensions even though they're consistent?",
              options: ["The convergence rate (e.g. n^(−2/(d+2))) degrades sharply with d — needing exponentially more data", "They stop being consistent above 3 dimensions", "They overfit less as d grows"],
              answer: 0,
              explain: "Consistency is about the limit; the rate is about speed. High d makes the rate crawl, so you need exponentially more samples — the curse attacking convergence speed.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/consistency-of-k-nn", label: <>← Consistency of k-NN</> }} next={{ href: "/learn/k-nearest-neighbors/when-to-use-k-nn", label: <>Next up · When to use k-NN →</> }} />
      </div>
    </article>
  );
}

const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
