import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The dual form of ridge — Manifold",
  description:
    "Kernel ridge is possible because ridge regression can be rewritten to touch the data only through inner products. Here's the dual derivation: from w = (XᵀX+λI)⁻¹Xᵀy to α = (K+λI)⁻¹y.",
};

export default function DualFormPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · from ridge to kernels", color: "var(--c-regression)" }]}
        time="about 9 minutes"
        title={<>The dual form of ridge</>}
        intro={<>
          The kernel trick needs an algorithm written purely in inner products. Ridge regression doesn&rsquo;t look
        like that — until you rewrite it. This &ldquo;dual&rdquo; form is the exact bridge to kernel ridge, and the
        derivation is short.
        </>}
      />

      <div className="lesson">
        <h2>The primal form you already know</h2>
        <p>
          Ridge minimises squared error plus an L2 penalty, with the familiar closed-form solution:
        </p>
        <MathBlock>{String.raw`\hat{w} = (X^\top X + \lambda I)^{-1} X^\top y`}</MathBlock>
        <p>
          Here <M>{String.raw`X`}</M> is <M>{String.raw`n \times m`}</M> (n points, m features), so{" "}
          <M>{String.raw`X^\top X`}</M> is <M>{String.raw`m \times m`}</M> — you solve an{" "}
          <strong>m-dimensional</strong> system. This is the <em>primal</em> form. Its problem for kernels: it
          works with features directly (<M>{String.raw`X^\top X`}</M>), and after a feature map those features
          could be infinite-dimensional.
        </p>

        <h2>The key move: w lives in the span of the data</h2>
        <p>
          Rearrange the normal equations <M>{String.raw`(X^\top X + \lambda I)\hat{w} = X^\top y`}</M> to isolate{" "}
          <M>{String.raw`\hat{w}`}</M> on one side:
        </p>
        <MathBlock>{String.raw`\lambda \hat{w} = X^\top y - X^\top X \hat{w} = X^\top(y - X\hat{w}) \quad\Longrightarrow\quad \hat{w} = X^\top \underbrace{\tfrac{1}{\lambda}(y - X\hat{w})}_{\alpha}`}</MathBlock>
        <p>
          So <M>{String.raw`\hat{w} = X^\top \alpha = \sum_i \alpha_i x_i`}</M> — the weight vector is a{" "}
          <strong>linear combination of the training inputs</strong>. (This is a preview of the representer
          theorem.) The unknown is now the coefficient vector <M>{String.raw`\alpha \in \mathbb{R}^n`}</M>, one
          weight per <em>data point</em> instead of per feature.
        </p>

        <h2>Solve for α — and the Gram matrix appears</h2>
        <p>
          Substitute <M>{String.raw`\hat{w} = X^\top \alpha`}</M> back into{" "}
          <M>{String.raw`\lambda \alpha = y - X\hat{w}`}</M>:
        </p>
        <MathBlock>{String.raw`\lambda \alpha = y - X X^\top \alpha \quad\Longrightarrow\quad (X X^\top + \lambda I)\,\alpha = y`}</MathBlock>
        <p>
          The matrix <M>{String.raw`X X^\top`}</M> is <M>{String.raw`n \times n`}</M>, and its entries are exactly
          inner products of data points: <M>{String.raw`(XX^\top)_{ij} = x_i \cdot x_j`}</M>. Call it the{" "}
          <strong>Gram matrix</strong> <M>{String.raw`K`}</M>. The dual solution is:
        </p>
        <MathBlock>{String.raw`\boxed{\;\alpha = (K + \lambda I)^{-1} y, \qquad K_{ij} = x_i \cdot x_j\;}`}</MathBlock>

        <h2>Predictions, in inner products only</h2>
        <p>
          A prediction at a new point <M>{String.raw`x`}</M> is{" "}
          <M>{String.raw`\hat{y} = \hat{w}\cdot x = \sum_i \alpha_i (x_i \cdot x)`}</M> — again, <em>only</em> inner
          products between the query and the training points. Both fitting and predicting now touch the data
          purely through dot products:
        </p>
        <MathBlock>{String.raw`\hat{y}(x) = \sum_{i=1}^{n} \alpha_i \,(x_i \cdot x)`}</MathBlock>

        <Callout color="var(--c-regression)" title={<>…and now kernelise</>}>
          Every dot product above — in <M>{String.raw`K`}</M> and in the prediction — is a place the kernel trick
            applies. Replace <M>{String.raw`x_i \cdot x_j`}</M> with <M>{String.raw`k(x_i, x_j)`}</M> and{" "}
            <M>{String.raw`x_i \cdot x`}</M> with <M>{String.raw`k(x_i, x)`}</M>, and dual ridge becomes{" "}
            <strong>kernel ridge regression</strong>: <M>{String.raw`\alpha = (K + \lambda I)^{-1} y`}</M> with{" "}
            <M>{String.raw`K_{ij} = k(x_i, x_j)`}</M>, and{" "}
            <M>{String.raw`\hat{y}(x) = \sum_i \alpha_i\, k(x_i, x)`}</M>. The primal form couldn&rsquo;t do this;
            the dual can.
        </Callout>

        <h2>Primal or dual — same answer, different size</h2>
        <p>
          Both forms give identical predictions for linear ridge; they just solve different-sized systems:
        </p>
        <ul style={ul}>
          <li><strong>Primal</strong> — an <M>{String.raw`m \times m`}</M> solve. Cheaper when features are few and data is plentiful (<M>{String.raw`m \ll n`}</M>).</li>
          <li><strong>Dual</strong> — an <M>{String.raw`n \times n`}</M> solve. Cheaper when features outnumber points — and, crucially, the <em>only</em> option once the feature map is implicit (kernels), because you can&rsquo;t form an infinite-dimensional <M>{String.raw`X`}</M>.</li>
        </ul>
        <p>
          That size trade — <M>{String.raw`n \times n`}</M> instead of <M>{String.raw`m \times m`}</M> — is why
          kernel methods scale with the number of <em>data points</em>, not features. It&rsquo;s the source of both
          their flexibility and their cost, a theme the depth chapter returns to.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "In the dual form, the weight vector ŵ is expressed as…",
              options: ["A linear combination of the training inputs, ŵ = Σ αᵢ xᵢ", "A single learned parameter", "The mean of the labels"],
              answer: 0,
              explain: "Rearranging the normal equations shows ŵ = Xᵀα — it lies in the span of the data, one coefficient αᵢ per training point.",
            },
            {
              q: "The dual ridge solution α = (K + λI)⁻¹y depends on the data through…",
              options: ["Inner products only, via the Gram matrix Kᵢⱼ = xᵢ·xⱼ", "The raw feature matrix X directly", "The labels only"],
              answer: 0,
              explain: "K collects all pairwise inner products. Because only inner products appear, each can be swapped for a kernel — that's kernelisation.",
            },
            {
              q: "Why must kernel methods use the dual (n×n) form rather than the primal (m×m)?",
              options: ["The feature map can be infinite-dimensional, so X (and XᵀX) can't be formed", "The dual is always faster", "The primal gives wrong answers"],
              answer: 0,
              explain: "With an implicit, possibly infinite feature map you cannot build X. The dual needs only pairwise kernel values, so it stays finite (n×n).",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/the-kernel-trick", label: <>← The kernel trick</> }} next={{ href: "/learn/kernel-ridge-regression/kernels-as-similarity", label: <>Next up · Kernels as similarity →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
