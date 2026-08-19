import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Scaling SVR to large n — Manifold",
  description:
    "Kernel SVR training grows between O(n²) and O(n³) — fine for thousands of rows, hopeless for millions. The fix is to stop kernelising exactly: approximate the feature map with Nyström or random Fourier features, then fit a fast linear SVR in that explicit space.",
};

export default function ScalingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in practice", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>Scaling SVR to large n</>}
        intro={<>
          Kernel SVR is superb up to a few thousand rows and then falls off a cliff. The reason is the same{" "}
          <M>{String.raw`n \times n`}</M> kernel matrix that gives it its power. Here is where the wall is, and the
        standard way around it.
        </>}
      />

      <div className="lesson">
        <h2>Where the wall is</h2>
        <p>
          Even with <Link href="/learn/support-vector-regression/solving-the-qp-smo" style={inlineLink}>SMO</Link>{" "}
          avoiding a dense matrix inverse, training an RBF-kernel SVR costs somewhere between{" "}
          <M>{String.raw`O(n^2)`}</M> and <M>{String.raw`O(n^3)`}</M> in time — the solver makes many passes over
          many kernel evaluations. Concretely:
        </p>
        <ul style={ul}>
          <li><strong>n ≈ 1,000–10,000:</strong> comfortable, seconds to minutes. This is SVR&rsquo;s sweet spot.</li>
          <li><strong>n ≈ 50,000:</strong> minutes to hours; you start feeling it.</li>
          <li><strong>n ≈ 1,000,000:</strong> effectively infeasible — the quadratic term dominates everything.</li>
        </ul>
        <p>
          <em>Prediction</em> is a second cost: each output sums over all support vectors, so a model with 100k
          support vectors is slow to serve as well as slow to train. Both problems trace back to keeping data in the
          implicit kernel space.
        </p>

        <Callout color="var(--c-regression)" title={<>The key move</>}>
          The kernel trick works with an <em>implicit</em>, infinite-dimensional feature map{" "}
            <M>{String.raw`\varphi`}</M>. To scale, we go the other way: build an{" "}
            <strong>explicit, finite, approximate</strong> feature map <M>{String.raw`\tilde{\varphi}(x) \in \mathbb{R}^D`}</M>{" "}
            with <M>{String.raw`k(x,z) \approx \tilde{\varphi}(x)^\top\tilde{\varphi}(z)`}</M>, then fit a plain{" "}
            <strong>linear</strong> model in that space. Linear SVR is <M>{String.raw`O(nD)`}</M> — linear in the data.
        </Callout>

        <h2>Two ways to build the approximate map</h2>
        <p>
          Both replace the <M>{String.raw`n \times n`}</M> kernel matrix with an <M>{String.raw`n \times D`}</M>{" "}
          feature matrix, <M>{String.raw`D \ll n`}</M> — the same trick used to scale{" "}
          <Link href="/learn/kernel-ridge-regression/the-computational-cost" style={inlineLink}>kernel ridge</Link>:
        </p>
        <ul style={ul}>
          <li>
            <strong>Random Fourier features</strong> (Rahimi &amp; Recht) — for shift-invariant kernels like the RBF,
            Bochner&rsquo;s theorem says the kernel is the Fourier transform of a probability density. Sample{" "}
            <M>{String.raw`D`}</M> random frequencies from it and the map <M>{String.raw`\tilde{\varphi}(x) = \sqrt{2/D}\,\cos(\Omega x + b)`}</M>{" "}
            satisfies <M>{String.raw`\tilde{\varphi}(x)^\top\tilde{\varphi}(z) \approx k(x,z)`}</M> in expectation.
          </li>
          <li>
            <strong>Nyström</strong> — pick <M>{String.raw`D`}</M> landmark points, compute the kernel against just
            those, and use a low-rank factorisation to project every point into a <M>{String.raw`D`}</M>-dim space.
            Data-dependent, and often more accurate than random features for the same <M>{String.raw`D`}</M>.
          </li>
        </ul>

        <MathBlock>{String.raw`\underbrace{K \in \mathbb{R}^{n\times n}}_{\text{implicit, } O(n^2)\text{ memory}} \quad\longrightarrow\quad \underbrace{\tilde{\Phi} \in \mathbb{R}^{n\times D}}_{\text{explicit, } O(nD)\text{ memory}} \quad\longrightarrow\quad \text{linear SVR}`}</MathBlock>

        <h2>In code</h2>
        <p>
          scikit-learn makes this a two-step pipeline: a feature map transformer, then a linear SVR that scales to
          large <M>{String.raw`n`}</M>. <code>LinearSVR</code> uses a fast coordinate-descent solver (liblinear),
          not SMO:
        </p>
        <CodeBlock fromScratch={code} />

        <Callout color="var(--c-regression)" title={<>The trade-off you are making</>}>
          You give up a little accuracy (the feature map is approximate) and gain a lot of scale — training drops
            from quadratic to linear in <M>{String.raw`n`}</M>. Raising <M>{String.raw`D`}</M> tightens the kernel
            approximation at higher cost, so <M>{String.raw`D`}</M> becomes the accuracy-versus-speed dial. For
            genuinely large <M>{String.raw`n`}</M>, an approximate kernel SVR beats an exact one you can never afford
            to train.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why does exact kernel SVR struggle at n ≈ 1,000,000?",
              options: ["Training scales between O(n²) and O(n³) — the quadratic kernel work dominates", "The kernel becomes invalid", "It runs out of hyperparameters"],
              answer: 0,
              explain: "The solver's cost grows superlinearly in n because it works in the implicit kernel space, whose matrix is n×n.",
            },
            {
              q: "How do random Fourier features / Nyström enable scaling?",
              options: ["They build an explicit D-dim approximate feature map so a fast linear SVR can be fit, D ≪ n", "They shrink the dataset", "They remove regularisation"],
              answer: 0,
              explain: "Replacing the implicit infinite map with an explicit finite one turns the problem linear — O(nD) instead of O(n²).",
            },
            {
              q: "What is the main cost of the approximation approach?",
              options: ["Slightly lower accuracy, traded for much better scaling; D tunes the balance", "It only works on linear data", "It needs more memory than exact SVR"],
              answer: 0,
              explain: "The finite feature map approximates the kernel, so accuracy dips a little — but training becomes linear in n, and larger D buys back accuracy.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/kernel-ridge-vs-svr", label: <>← Kernel ridge vs SVR</> }} next={{ href: "/learn/support-vector-regression/when-to-use-svr", label: <>Next up · When to use SVR →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.kernel_approximation import RBFSampler   # random Fourier features
from sklearn.svm import LinearSVR
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# approximate the RBF kernel with D=500 explicit features, then fit linear SVR
model = make_pipeline(
    StandardScaler(),
    RBFSampler(gamma=0.1, n_components=500, random_state=0),
    LinearSVR(C=10, epsilon=0.1, max_iter=10000),
).fit(X_train, y_train)          # O(n * D), scales to millions of rows

# for a data-dependent map, swap RBFSampler for:
#   from sklearn.kernel_approximation import Nystroem
#   Nystroem(kernel="rbf", gamma=0.1, n_components=500)`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
