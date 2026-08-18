import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "When to use basis regression (vs kernels, trees) — Manifold",
  description: "Basis-function regression fits a nonlinear curve while keeping the interpretability and toolkit of linear models. Here's where that trade-off wins — and where kernels, trees, or neural nets take over.",
};

export default function WhenToUsePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>When to use it — vs kernels, trees</>}
        intro={<>
          Basis regression sits in a sweet spot: more flexible than a line, far more transparent than a black box.
          Knowing when that middle ground is the right place to stand — and when to move on — is the practitioner&rsquo;s
          judgement this page hands you.
        </>}
      />

      <div className="lesson">
        <h2>The one-dimensional sweet spot</h2>
        <p>
          Basis regression shines brightest with <strong>one or a few inputs</strong> and a smooth, curved
          relationship: a dose–response curve, a growth trend, a seasonal signal. There, a spline or a modest
          polynomial captures the shape faithfully, keeps the closed-form fit and the whole inference toolkit
          (confidence intervals, standard errors), and stays interpretable — you can plot the fitted curve and
          reason about it. It&rsquo;s the natural next step up from a straight line when the straight line is
          visibly wrong.
        </p>

        <h2>The four options, compared</h2>
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 620, width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Method</th>
                <th style={th}>Flexibility</th>
                <th style={th}>Scales to many features?</th>
                <th style={th}>Interpretable?</th>
                <th style={th}>Best when…</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: `color-mix(in srgb, ${ACCENT} 6%, var(--surface))` }}>
                <td style={td}><strong>Basis regression</strong> (poly/spline)</td>
                <td style={td}>moderate, smooth</td>
                <td style={td}>poorly — bases explode combinatorially</td>
                <td style={td}>yes — plot the curve, keep CIs</td>
                <td style={td}>1–3 smooth inputs; you want a transparent curved fit</td>
              </tr>
              <tr>
                <td style={td}>Kernel methods (KRR, GP)</td>
                <td style={td}>high, smooth</td>
                <td style={td}>moderate (cost grows with samples)</td>
                <td style={td}>limited</td>
                <td style={td}>smooth high-dim surfaces; small/medium data; want uncertainty (GP)</td>
              </tr>
              <tr>
                <td style={td}>Trees / gradient boosting</td>
                <td style={td}>high, non-smooth</td>
                <td style={td}>yes — the tabular workhorse</td>
                <td style={td}>partial (importance/SHAP)</td>
                <td style={td}>many mixed features; interactions; discontinuities</td>
              </tr>
              <tr>
                <td style={td}>Neural networks</td>
                <td style={td}>very high (learned basis)</td>
                <td style={td}>yes, with lots of data</td>
                <td style={td}>low</td>
                <td style={td}>huge datasets; images/text/complex structure</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Where basis regression breaks down</h2>
        <p>
          Its Achilles&rsquo; heel is <strong>dimensionality</strong>. A full polynomial expansion of degree{" "}
          <em>d</em> over <em>p</em> features has on the order of <em>p</em><sup><em>d</em></sup> terms — it
          explodes combinatorially, and with it the variance and the compute. Manual basis construction also
          assumes you <em>know</em> the shape you&rsquo;re looking for. Once you have many features, unknown
          interactions, or non-smooth structure, hand-designing a basis is a losing game and you want a method
          that <em>learns</em> the representation:
        </p>
        <ul>
          <li><strong>Kernel methods</strong> if the surface is smooth and you&rsquo;d rather not enumerate bases — a kernel is an implicit, infinite basis (the RBF connection from earlier).</li>
          <li><strong>Gradient-boosted trees</strong> if features are many and mixed, with interactions and jumps — the default winner on tabular data.</li>
          <li><strong>Neural networks</strong> if you have the data and the structure (images, text) to justify learning the basis end-to-end.</li>
        </ul>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You have 40 features with unknown nonlinear interactions and plenty of rows, and interpretability is secondary. Basis regression or something else?</>}
          options={[
            "Gradient-boosted trees — basis expansion explodes with 40 features",
            "A degree-6 polynomial expansion over all 40 features",
            "A single straight line",
          ]}
          nudge={<>Estimate how many terms a degree-6 expansion over 40 features would create.</>}
        />

        <p>
          Trees are the right move: a degree-6 expansion over 40 features is millions of terms — computationally
          hopeless and hopelessly overfit — while boosting finds the interactions automatically. Basis regression
          was built for the low-dimensional, smooth, interpretable corner; honour that boundary and it&rsquo;s a
          superb tool, push past it and you&rsquo;re fighting the curse of dimensionality.
        </p>

        <Callout color={ACCENT} title={<>The selection rule</>}>
          Few smooth inputs and you want a transparent, curved fit with real inference → basis regression
          (splines first). Smooth but higher-dimensional → kernels. Many mixed features with interactions →
          boosted trees. Massive, structured data → neural nets. The dividing line is dimensionality and whether
          you can name the shape; when you can&rsquo;t, let the model learn the basis.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "The main scalability problem with polynomial basis expansion is…",
              options: [
                "It only works for one feature",
                "The number of terms grows roughly as p^d — combinatorial explosion with many features",
                "It can't be regularized",
              ],
              answer: 1,
              explain: "A degree-d expansion over p features produces on the order of pᵈ interaction terms. That blows up compute and variance, which is why basis regression is a low-dimensional tool.",
            },
            {
              q: "For a smooth relationship in a handful of inputs where you want confidence intervals, the best fit is…",
              options: ["A gradient-boosted tree", "Basis regression (e.g. a natural spline) — smooth, interpretable, keeps the inference toolkit", "A deep neural network"],
              answer: 1,
              explain: "In low dimensions with a smooth signal, splines give a faithful curve while retaining closed-form fitting and standard errors — transparency a black box can't match.",
            },
            {
              q: "The connection between RBF basis regression and kernel methods is that…",
              options: [
                "They're unrelated",
                "A kernel acts as an implicit, possibly infinite basis — kernels are basis regression without enumerating the bases",
                "Kernels can't fit smooth functions",
              ],
              answer: 1,
              explain: "Kernel ridge regression / Gaussian processes are basis regression where the kernel implicitly defines the (possibly infinite) feature map, so you get the flexibility without hand-building or listing the bases.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/pipelines-scaling-and-leakage", label: <>← Pipelines, scaling &amp; leakage</> }}
          next={{ href: "/learn/polynomial-regression/worked-example", label: <>Next up · A worked example →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = {
  border: "1px solid var(--border-strong)",
  padding: "8px 11px",
  textAlign: "left",
  background: "var(--surface-2)",
  fontWeight: 500,
  color: "var(--ink)",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  border: "1px solid var(--border-strong)",
  padding: "8px 11px",
  textAlign: "left",
  color: "var(--muted)",
  verticalAlign: "top",
};
