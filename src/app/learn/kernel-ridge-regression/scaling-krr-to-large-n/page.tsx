import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Scaling KRR to large n — Manifold",
  description:
    "Kernel ridge is dense: O(n³) to train, O(n²) memory, and every prediction touches every training point. Because it has no sparsity to fall back on, scaling means approximating the kernel with an explicit feature map and returning to plain primal ridge.",
};

export default function ScalingKrrPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in practice", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>Scaling KRR to large n</>}
        intro={<>
          The <Link href="/learn/kernel-ridge-regression/the-computational-cost" style={inlineLink}>cost page</Link>{" "}
          named the wall: <M>{String.raw`O(n^3)`}</M> to train, <M>{String.raw`O(n^2)`}</M> to store. Because kernel
        ridge is <em>dense</em> — no support vectors to thin the model — that wall is harder than SVR&rsquo;s. Here is
        the standard way through it.
        </>}
      />

      <div className="lesson">
        <h2>Why density makes this urgent</h2>
        <p>
          Every KRR prediction is <M>{String.raw`\hat{y}(x) = \sum_{i=1}^{n}\alpha_i\,k(x_i, x)`}</M> with{" "}
          <em>all</em> <M>{String.raw`n`}</M> coefficients nonzero. Unlike{" "}
          <Link href="/learn/support-vector-regression/scaling-svr-to-large-n" style={inlineLink}>SVR</Link>, which
          keeps only its support vectors, KRR has no sparsity to exploit — it stores and touches the whole training
          set forever. So all three costs bite at scale:
        </p>
        <ul style={ul}>
          <li><strong>Train:</strong> <M>{String.raw`O(n^3)`}</M> to factor <M>{String.raw`K + \lambda I`}</M>.</li>
          <li><strong>Memory:</strong> <M>{String.raw`O(n^2)`}</M> to hold the kernel matrix — 100k points is ~40&nbsp;GB.</li>
          <li><strong>Predict:</strong> <M>{String.raw`O(n)`}</M> per query, since the sum runs over all points.</li>
        </ul>
        <p>
          Past a few thousand points the memory alone is fatal. The fix is not a better solver — it is to stop using
          the exact kernel.
        </p>

        <Callout color="var(--c-regression)" title={<>The move: go back to the primal</>}>
          The whole reason we went <em>dual</em> was to avoid an explicit, infinite feature map{" "}
            <M>{String.raw`\varphi`}</M>. To scale, we reverse that: build a finite,{" "}
            <strong>approximate</strong> map <M>{String.raw`\tilde{\varphi}(x) \in \mathbb{R}^D`}</M> with{" "}
            <M>{String.raw`k(x,z) \approx \tilde{\varphi}(x)^\top\tilde{\varphi}(z)`}</M>, then solve{" "}
            <strong>ordinary primal ridge</strong> on those <M>{String.raw`D`}</M> features. That closes the loop — we
            are back to the very first model in this family, just on cleverly transformed inputs.
        </Callout>

        <h2>Two approximate feature maps</h2>
        <p>
          Both replace the <M>{String.raw`n \times n`}</M> kernel matrix with an <M>{String.raw`n \times D`}</M>{" "}
          feature matrix, <M>{String.raw`D \ll n`}</M>, turning the solve into <M>{String.raw`O(nD^2)`}</M> — linear
          in the data:
        </p>
        <ul style={ul}>
          <li>
            <strong>Random Fourier features</strong> (Rahimi &amp; Recht) — for a shift-invariant kernel like the RBF,
            Bochner&rsquo;s theorem writes it as the Fourier transform of a probability density. Sample{" "}
            <M>{String.raw`D`}</M> random frequencies from that density and{" "}
            <M>{String.raw`\tilde{\varphi}(x) = \sqrt{2/D}\,\cos(\Omega x + b)`}</M> approximates the kernel in
            expectation.
          </li>
          <li>
            <strong>Nyström</strong> — pick <M>{String.raw`m`}</M> landmark points and approximate{" "}
            <M>{String.raw`K \approx K_{nm}K_{mm}^{-1}K_{mn}`}</M>, a rank-<M>{String.raw`m`}</M> factorisation. Solve
            the reduced <M>{String.raw`m \times m`}</M> system in <M>{String.raw`O(nm^2)`}</M>. Data-dependent, so
            often more accurate than random features at the same budget.
          </li>
        </ul>

        <MathBlock>{String.raw`\underbrace{(K + \lambda I)\,\alpha = y}_{O(n^3),\ O(n^2)\text{ memory}} \quad\longrightarrow\quad \underbrace{(\tilde{\Phi}^\top\tilde{\Phi} + \lambda I)\,w = \tilde{\Phi}^\top y}_{O(nD^2),\ O(nD)\text{ memory}}`}</MathBlock>

        <h2>In code</h2>
        <p>
          scikit-learn makes it a two-step pipeline: an explicit feature map, then a plain <code>Ridge</code> — the
          same estimator you started this family with, now standing in for the kernel:
        </p>
        <CodeBlock fromScratch={code} />

        <Callout color="var(--c-regression)" title={<>The trade-off you are making</>}>
          You give up a little accuracy — the feature map only approximates the kernel — and gain a lot of scale, from
            cubic to linear in <M>{String.raw`n`}</M>, with a model whose size is fixed at <M>{String.raw`D`}</M>{" "}
            rather than growing with the data. Raising <M>{String.raw`D`}</M> (or <M>{String.raw`m`}</M>) tightens the
            approximation at higher cost, so it becomes the accuracy-versus-speed dial. For large{" "}
            <M>{String.raw`n`}</M>, an approximate KRR you can actually fit beats an exact one you cannot.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why is scaling more pressing for KRR than for SVR?",
              options: ["KRR is dense — all n dual coefficients are nonzero, so it stores and touches every training point, with no sparsity to fall back on", "KRR uses a worse solver", "SVR has no kernel"],
              answer: 0,
              explain: "SVR keeps only support vectors; KRR keeps everything. Its O(n²) memory and O(n) prediction can't be thinned, so the exact method hits a wall sooner.",
            },
            {
              q: "What is the core trick to scale KRR?",
              options: ["Build an explicit approximate feature map (Nyström / random Fourier) and solve primal ridge in it — O(nD²)", "Increase λ until it's fast", "Drop half the features"],
              answer: 0,
              explain: "Replacing the implicit infinite map with a finite explicit one turns the dual solve back into ordinary primal ridge — linear in n.",
            },
            {
              q: "What controls the accuracy–speed trade-off in these approximations?",
              options: ["The number of features / landmarks D — larger D tightens the kernel approximation at higher cost", "The value of y", "The random seed only"],
              answer: 0,
              explain: "D (or m for Nyström) sets the rank of the approximation: more components mean a closer match to the true kernel, and more compute.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/kernel-ridge-vs-svr-vs-linear", label: <>← Kernel ridge vs SVR vs linear</> }} next={{ href: "/learn/kernel-ridge-regression/worked-example", label: <>Next up · A worked example →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.kernel_approximation import RBFSampler   # random Fourier features
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# approximate the RBF kernel with D=500 explicit features, then plain ridge
model = make_pipeline(
    StandardScaler(),
    RBFSampler(gamma=0.1, n_components=500, random_state=0),
    Ridge(alpha=1.0),
).fit(X_train, y_train)          # O(n * D^2), scales to millions of rows

# data-dependent alternative — usually more accurate per component:
#   from sklearn.kernel_approximation import Nystroem
#   Nystroem(kernel="rbf", gamma=0.1, n_components=500)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
