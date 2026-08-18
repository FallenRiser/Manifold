import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Bias & variance in k-NN — Manifold",
  description:
    "k-NN is the one model where the bias–variance trade-off has a clean formula. Variance falls as 1/k, bias grows as the neighbourhood widens, and the sum is a U you can see — here's the derivation.",
};

// A static, server-computed bias–variance curve for k-NN regression. Illustrative
// constants (σ²=1, a smoothing-bias term ∝ (k/kMax)²) chosen only so the U lands at
// an interior k; all coordinates are rounded so SSR and client strings match exactly.
const KS = [1, 2, 3, 4, 5, 7, 9, 12, 16, 20, 26, 33, 41];
const KMAX = 41;
const NOISE = 0.14; // irreducible σ² floor, drawn for reference
const variance = (k: number) => 1 / k; // σ²/k with σ²=1
const bias2 = (k: number) => 0.55 * (k / KMAX) ** 2; // widening the neighbourhood smooths away real signal
const total = (k: number) => variance(k) + bias2(k) + NOISE;

const W = 380, H = 220, padL = 30, padR = 14, padT = 14, padB = 30;
const YMAX = 1.25;
const px = (i: number) => Math.round((padL + (i / (KS.length - 1)) * (W - padL - padR)) * 100) / 100;
const py = (v: number) => Math.round((padT + (1 - v / YMAX) * (H - padT - padB)) * 100) / 100;
const line = (f: (k: number) => number) => KS.map((k, i) => `${px(i)},${py(f(k))}`).join(" ");
const bestIdx = KS.reduce((bi, k, i) => (total(k) < total(KS[bi]) ? i : bi), 0);

export default function BiasVarianceKNNPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · choosing k", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Bias &amp; variance in k-NN</>}
        intro={<>
          Most models make the bias–variance trade-off abstract. k-NN makes it arithmetic: the variance of a
        prediction is exactly <M>{String.raw`\sigma^2/k`}</M>, and the bias grows as the neighbourhood widens.
        Their sum is the U-curve that choosing k is all about.
        </>}
      />

      <div className="lesson">
        <h2>The prediction is an average</h2>
        <p>
          Take k-NN regression, where the prediction at a query <M>{String.raw`\mathbf{x}`}</M> is the mean of
          its k nearest training targets:
        </p>
        <MathBlock>{String.raw`\hat{f}(\mathbf{x}) = \frac{1}{k} \sum_{i \in N_k(\mathbf{x})} y_i`}</MathBlock>
        <p>
          Because it&rsquo;s a plain average of the neighbours&rsquo; labels, we can compute its bias and variance
          directly — no approximation. Model each label as the true function plus independent noise,{" "}
          <M>{String.raw`y_i = f(\mathbf{x}_i) + \varepsilon_i`}</M>, with{" "}
          <M>{String.raw`\operatorname{Var}(\varepsilon_i) = \sigma^2`}</M>.
        </p>

        <h2>Variance: the clean part</h2>
        <p>
          Averaging k independent noisy labels shrinks the noise by a factor of k — the same reason a mean of
          more samples is steadier than a single draw:
        </p>
        <MathBlock>{String.raw`\operatorname{Var}\!\big(\hat{f}(\mathbf{x})\big) = \operatorname{Var}\!\left(\frac{1}{k}\sum_{i} y_i\right) = \frac{1}{k^2}\sum_{i} \sigma^2 = \frac{\sigma^2}{k}`}</MathBlock>
        <p>
          So <strong>variance falls as <M>{String.raw`1/k`}</M></strong>. Doubling k halves the variance of every
          prediction. This is the precise sense in which more neighbours means a steadier model — and why{" "}
          <M>{String.raw`k = 1`}</M> is the noisiest possible choice.
        </p>

        <h2>Bias: the price of widening the net</h2>
        <p>
          Bias is the error baked in even with infinite data. At <M>{String.raw`k = 1`}</M> the single nearest
          point is essentially at <M>{String.raw`\mathbf{x}`}</M>, so the average targets{" "}
          <M>{String.raw`f(\mathbf{x})`}</M> itself — almost no bias. As k grows, the neighbourhood must reach
          out to points where the true function <M>{String.raw`f`}</M> has drifted away from{" "}
          <M>{String.raw`f(\mathbf{x})`}</M>. Averaging those in pulls the estimate off target:
        </p>
        <MathBlock>{String.raw`\operatorname{Bias}\!\big(\hat{f}(\mathbf{x})\big) = \frac{1}{k}\sum_{i \in N_k(\mathbf{x})} f(\mathbf{x}_i) \;-\; f(\mathbf{x})`}</MathBlock>
        <p>
          The wider the neighbourhood, the more the local curvature of <M>{String.raw`f`}</M> gets smoothed
          over, so <strong>bias grows with k</strong>. Where a wiggly true function needs tight neighbourhoods,
          a large k blurs the peaks and fills the valleys.
        </p>

        <h2>The trade-off, as a total error</h2>
        <p>
          Put them together with the irreducible noise floor <M>{String.raw`\sigma^2`}</M> and you get the
          expected test error at the query:
        </p>
        <MathBlock>{String.raw`\mathbb{E}\big[(y - \hat{f})^2\big] = \underbrace{\text{bias}^2(k)}_{\uparrow \text{ with } k} \;+\; \underbrace{\frac{\sigma^2}{k}}_{\downarrow \text{ with } k} \;+\; \underbrace{\sigma^2}_{\text{irreducible}}`}</MathBlock>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Bias-squared rises with k while variance falls as 1/k; their sum is a U-curve minimised at an interior k.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* noise floor */}
            <line x1={padL} y1={py(NOISE)} x2={W - padR} y2={py(NOISE)} stroke="var(--faint)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={W - padR} y={py(NOISE) - 4} fontSize={9} fill="var(--faint)" textAnchor="end">irreducible noise</text>
            {/* variance ~ 1/k */}
            <polyline points={line(variance)} fill="none" stroke="var(--c-regression)" strokeWidth={2.2} />
            {/* bias^2 */}
            <polyline points={line(bias2)} fill="none" stroke="var(--c-fundamentals)" strokeWidth={2.2} />
            {/* total */}
            <polyline points={line(total)} fill="none" stroke="var(--c-classification)" strokeWidth={2.8} />
            {/* best-k marker */}
            <line x1={px(bestIdx)} y1={padT} x2={px(bestIdx)} y2={H - padB} stroke="var(--good)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
            <circle cx={px(bestIdx)} cy={py(total(KS[bestIdx]))} r={4.5} fill="var(--good)" stroke="var(--surface)" strokeWidth={1.4} />
            <text x={px(bestIdx)} y={padT + 9} fontSize={9} fill="var(--good)" textAnchor="middle">best k = {KS[bestIdx]}</text>
            <text x={px(0)} y={py(variance(1)) - 5} fontSize={9} fill="var(--c-regression)">variance ∝ 1/k</text>
            <text x={px(KS.length - 1)} y={py(bias2(KMAX)) - 5} fontSize={9} fill="var(--c-fundamentals)" textAnchor="end">bias²</text>
            <text x={W / 2} y={H - 6} fontSize={9} fill="var(--faint)" textAnchor="middle">k  (small → large)</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            The <span style={{ color: "var(--c-regression)" }}>variance</span> curve drops as{" "}
            <M>{String.raw`\sigma^2/k`}</M>; <span style={{ color: "var(--c-fundamentals)" }}>bias²</span> climbs
            as the neighbourhood widens. Their sum (
            <span style={{ color: "var(--c-classification)" }}>total error</span>) is a U with a minimum at an
            interior k — the k worth finding.
          </figcaption>
        </figure>

        <p>
          That is the entire story of choosing k in one picture. Push k too low and variance dominates
          (overfitting the noise); push it too high and bias dominates (over-smoothing real structure). The
          sweet spot is the bottom of the U — and crucially, its location depends on the data (how noisy, how
          wiggly, how much of it), so it must be <em>measured</em>, not assumed.
        </p>

        <Callout color="var(--c-classification)" title={<>Why n has to grow for k to grow</>}>
          For k-NN to be <strong>consistent</strong> — error approaching the best possible as data grows — you
            need <M>{String.raw`k \to \infty`}</M> (variance <M>{String.raw`\sigma^2/k \to 0`}</M>) while{" "}
            <M>{String.raw`k/n \to 0`}</M> (neighbourhoods still shrink geographically, so bias{" "}
            <M>{String.raw`\to 0`}</M>). Both at once. That twin condition is the theoretical backbone of k-NN,
            and we prove it properly in the Tier-3 consistency page.
        </Callout>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "The variance of a k-NN regression prediction scales as…",
              options: ["σ²/k — it falls as 1/k", "σ²·k — it grows with k", "σ² — it doesn't depend on k"],
              answer: 0,
              explain: "Averaging k independent noisy labels divides the noise variance by k. That's the clean, exact half of the trade-off.",
            },
            {
              q: "Why does bias increase as k grows?",
              options: ["Larger neighbourhoods include farther points where f has drifted, smoothing away local structure", "Larger k adds more parameters to estimate", "Bias is unrelated to k"],
              answer: 0,
              explain: "To find more neighbours you must reach farther out, averaging over points whose true value differs from f(x). That systematic smoothing is bias.",
            },
            {
              q: "For k-NN to be consistent as n → ∞, k must satisfy…",
              options: ["k → ∞ and k/n → 0", "k stays fixed at √n", "k = n"],
              answer: 0,
              explain: "k → ∞ kills variance (σ²/k → 0); k/n → 0 keeps neighbourhoods shrinking so bias → 0. You need both simultaneously.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/the-role-of-k", label: <>← The role of k</> }} next={{ href: "/learn/k-nearest-neighbors/choosing-k-by-cross-validation", label: <>Next up · Choosing k by cross-validation →</> }} />
      </div>
    </article>
  );
}
