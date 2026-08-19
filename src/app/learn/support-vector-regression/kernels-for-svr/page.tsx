import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Kernels for SVR — Manifold",
  description:
    "SVR inherits the same kernel toolbox as kernel ridge — linear, polynomial, RBF — and the same rules: RBF by default, standardise first, and the kernel is the model's inductive bias.",
};

export default function KernelsForSVRPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · the mechanics", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>Kernels for SVR</>}
        intro={<>
          Because the SVR dual is written in inner products, it accepts the <em>same</em> kernels as kernel
        ridge. The kernel is where all the nonlinearity lives; the ε-tube and C only decide how the model treats
        errors in whatever space the kernel defines.
        </>}
      />

      <div className="lesson">
        <h2>The same toolbox</h2>
        <p>
          Everything from the <Link href="/learn/kernel-ridge-regression/kernels-as-similarity" style={inlineLink}>kernels
          page</Link> carries over unchanged — a kernel is a valid kernel regardless of the loss it&rsquo;s paired
          with:
        </p>
        <ul style={ul}>
          <li><strong>Linear</strong> <M>{String.raw`(x\cdot z)`}</M> — linear SVR, a robust, sparse alternative to ridge that&rsquo;s excellent for high-dimensional/sparse data (text).</li>
          <li><strong>Polynomial</strong> <M>{String.raw`(\gamma\, x\cdot z + c)^d`}</M> — bounded-degree curvature and interactions.</li>
          <li><strong>RBF / Gaussian</strong> <M>{String.raw`\exp(-\gamma\lVert x - z\rVert^2)`}</M> — the default; local smoothness, universally flexible.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>The kernel sets the shape; ε and C set the attitude to error</>}>
          Keep the division of labour straight. The <strong>kernel (and γ)</strong> decides what functions SVR
            can represent — its inductive bias. The <strong>tube ε</strong> decides which errors are free, and{" "}
            <strong>C</strong> decides how hard to chase the rest. Change the kernel and you change the family of
            fits; change ε or C and you change how the same family responds to noise.
        </Callout>

        <h2>The usual cautions apply</h2>
        <ul style={ul}>
          <li><strong>Standardise first.</strong> RBF and polynomial kernels read distances and dot products, so an unscaled wide-range feature dominates. Always scale before SVR.</li>
          <li><strong>Start with RBF.</strong> It&rsquo;s the sensible default for nonlinear problems; use linear when features are many and the relationship is roughly linear, polynomial when you specifically want degree-d interactions.</li>
          <li><strong>The kernel matters more than ε or C.</strong> A wrong kernel can&rsquo;t be rescued by tuning the tube — pick the family first, then tune within it.</li>
        </ul>

        <MathBlock>{String.raw`\hat{y}(x) = \sum_{i \in \text{SV}} (\alpha_i - \alpha_i^*)\, k(x_i, x) + b`}</MathBlock>
        <p>
          The prediction is a similarity-weighted sum over support vectors — the same form as kernel ridge, just
          summed over fewer points. The kernel you pick is exactly the similarity being weighted.
        </p>

        <CodeBlock fromScratch={code} />

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Which kernels can SVR use?",
              options: ["The same ones as kernel ridge — linear, polynomial, RBF — since the dual is in inner products", "Only the linear kernel", "A special SVR-only kernel"],
              answer: 0,
              explain: "Any valid (PSD) kernel works with any inner-product method. SVR and kernel ridge share the entire toolbox.",
            },
            {
              q: "In an SVR model, what sets the shape of the fittable functions?",
              options: ["The kernel (and its γ) — the inductive bias", "ε alone", "C alone"],
              answer: 0,
              explain: "The kernel defines the function family; ε and C only govern how errors within that family are treated.",
            },
            {
              q: "Before using an RBF-kernel SVR you should…",
              options: ["Standardise the features, since the kernel depends on distances", "Set ε to zero", "Remove all outliers"],
              answer: 0,
              explain: "Like every distance-based kernel method, RBF SVR is scale-sensitive — an unscaled feature silently defines 'similar'.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/solving-the-qp-smo", label: <>← Solving the QP: SMO</> }} next={{ href: "/learn/support-vector-regression/hyperparameters-c-epsilon-gamma", label: <>Next up · Hyperparameters: C, ε, γ →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.svm import SVR
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# same kernels as kernel ridge; scale first because RBF reads distances
svr_rbf    = make_pipeline(StandardScaler(), SVR(kernel="rbf", gamma="scale"))
svr_linear = make_pipeline(StandardScaler(), SVR(kernel="linear"))
svr_poly   = make_pipeline(StandardScaler(), SVR(kernel="poly", degree=3))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
