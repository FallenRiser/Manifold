import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The kernel trick — Manifold",
  description:
    "The idea that powers every kernel method: a linear model can work in a vast (even infinite) feature space without ever computing the features — as long as it only needs inner products, which a kernel returns directly.",
};

export default function KernelTrickPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · from ridge to kernels", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>The kernel trick</>}
        intro={<>
          One idea unlocks all of kernel methods: if an algorithm touches the data only through inner products,
        you can run it in a huge feature space while doing arithmetic only in the small original one. The
        features are implied, never built.
        </>}
      />

      <div className="lesson">
        <h2>Step 1: lift the data with a feature map</h2>
        <p>
          To fit a curve with a linear method, map each input into a richer space with a{" "}
          <strong>feature map</strong> <M>{String.raw`\phi`}</M>, then fit a plane there. For a 2-D input, a
          degree-2 map might be:
        </p>
        <MathBlock>{String.raw`\phi(x_1, x_2) = \big(1,\ \sqrt{2}\,x_1,\ \sqrt{2}\,x_2,\ x_1^2,\ x_2^2,\ \sqrt{2}\,x_1 x_2\big)`}</MathBlock>
        <p>
          A plane in this lifted space is a full quadratic (conic) in the original one. The recipe works — but
          the feature vector grows fast: degree <M>{String.raw`d`}</M> in <M>{String.raw`m`}</M> dimensions has{" "}
          <M>{String.raw`\binom{m+d}{d}`}</M> terms, and some useful maps are <em>infinite</em>-dimensional.
          Building <M>{String.raw`\phi(x)`}</M> explicitly is hopeless at scale.
        </p>

        <h2>Step 2: notice you only ever need inner products</h2>
        <p>
          Here&rsquo;s the escape hatch. Many linear algorithms — ridge regression among them — depend on the data
          <em> only</em> through inner products <M>{String.raw`\langle \phi(x), \phi(z)\rangle`}</M>, never through
          <M>{String.raw`\phi(x)`}</M> on its own. And for structured feature maps, that inner product has a{" "}
          <strong>closed form you can evaluate in the original space</strong>. For the degree-2 map above:
        </p>
        <MathBlock>{String.raw`\langle \phi(x), \phi(z)\rangle = (1 + x_1 z_1 + x_2 z_2)^2 = (1 + x\cdot z)^2`}</MathBlock>
        <p>
          The left side sums six products in the lifted space; the right side is a dot product in 2-D, plus one,
          squared. Same number, a fraction of the work. That closed form is a <strong>kernel</strong>:
        </p>
        <MathBlock>{String.raw`k(x, z) = \langle \phi(x), \phi(z)\rangle`}</MathBlock>

        <Callout color="var(--c-regression)" title={<>The trick, in one sentence</>}>
          Replace every inner product <M>{String.raw`\langle \phi(x), \phi(z)\rangle`}</M> in your algorithm with
            a kernel evaluation <M>{String.raw`k(x, z)`}</M>. You now run the algorithm in{" "}
            <M>{String.raw`\phi`}</M>-space — with all its nonlinear power — while touching only the original
            coordinates. The feature map is <em>implied by the kernel</em> and never materialised.
        </Callout>

        <h2>The payoff: infinite features, finite work</h2>
        <p>
          The RBF (Gaussian) kernel <M>{String.raw`k(x,z) = \exp(-\gamma \lVert x - z\rVert^2)`}</M> corresponds
          to an <strong>infinite-dimensional</strong> feature map — you could never write <M>{String.raw`\phi`}</M>
          down, yet <M>{String.raw`k`}</M> is a one-line computation. That&rsquo;s the whole magic: a linear model
          in an infinite feature space, priced like a distance calculation.
        </p>

        <h2>Which functions are valid kernels?</h2>
        <p>
          Not any two-argument function works — <M>{String.raw`k`}</M> must actually <em>be</em> an inner product
          in some space. The condition (Mercer&rsquo;s theorem) is that <M>{String.raw`k`}</M> is symmetric and{" "}
          <strong>positive semi-definite</strong>: for any points, the Gram matrix{" "}
          <M>{String.raw`K_{ij} = k(x_i, x_j)`}</M> must be PSD (no negative eigenvalues). PSD kernels are exactly
          the functions that correspond to some feature map, so the trick is guaranteed to be valid. The linear,
          polynomial, and RBF kernels all qualify — the <Link href="/learn/kernel-ridge-regression/kernels-as-similarity" style={inlineLink}>similarity page</Link> catalogues them.
        </p>

        <Callout color="var(--c-regression)" title={<>Not every method can be kernelised</>}>
          The trick only applies when an algorithm can be written purely in terms of inner products between data
            points. Ridge regression can (next page shows how); so can SVMs, PCA, and more. When it can, you get
            a nonlinear version essentially for free — which is why &ldquo;kernelise it&rdquo; is one of the most
            reused moves in machine learning.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "What does the kernel trick let you avoid computing?",
              options: ["The explicit feature vectors φ(x) — you only ever evaluate k(x, z)", "The training labels", "The inner products between points"],
              answer: 0,
              explain: "Kernels return the inner product in feature space directly, so the (possibly infinite-dimensional) φ(x) is never materialised.",
            },
            {
              q: "The RBF kernel corresponds to a feature map that is…",
              options: ["Infinite-dimensional — impossible to write down, yet k is a one-line formula", "Two-dimensional", "The identity map"],
              answer: 0,
              explain: "That's the headline case: an infinite feature space priced like a distance computation. You could never build φ, but you never need to.",
            },
            {
              q: "For k to be a valid kernel, its Gram matrix must be…",
              options: ["Symmetric and positive semi-definite (Mercer's condition)", "Diagonal", "Invertible"],
              answer: 0,
              explain: "PSD kernels are exactly those that correspond to an inner product in some feature space, which is what makes the trick legitimate.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression", label: <>← Bending ridge regression</> }} next={{ href: "/learn/kernel-ridge-regression/the-dual-form-of-ridge", label: <>Next up · The dual form of ridge →</> }} />
      </div>
    </article>
  );
}

const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
