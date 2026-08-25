import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PowerIterationLab } from "@/components/labs/PowerIterationLab";

export const metadata = {
  title: "Computing the components: power iteration — Manifold",
  description:
    "We kept saying 'eigen-decompose the covariance matrix' as if by magic. Here is the actual algorithm, end to end: power iteration finds the top eigenvector, deflation gets the rest, and real libraries use the QR algorithm and the SVD.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const POWER = `import numpy as np

S = np.array([[3.0, 1.3],
              [1.3, 1.2]])         # a covariance matrix

v = np.array([np.cos(1.15), np.sin(1.15)])  # any starting vector
for k in range(1, 8):
    w = S @ v                      # multiply by Sigma
    v = w / np.linalg.norm(w)      # renormalise to unit length
    print(f"iter {k}: v=[{v[0]:.4f},{v[1]:.4f}]  rayleigh={v @ S @ v:.5f}")

vals, vecs = np.linalg.eigh(S)     # the library's answer, to compare
i = vals.argmax()
print(f"eigh : lambda1={vals[i]:.5f}  v1=[{abs(vecs[0,i]):.4f},{abs(vecs[1,i]):.4f}]")`;

const DEFLATE = `# after finding (lambda1, v1), remove it and repeat for PC2
S2 = S - lambda1 * np.outer(v1, v1)   # deflation
# power-iterate on S2 -> gives (lambda2, v2), orthogonal to v1
# ... repeat k times for the top-k components`;

export default function ComputingComponentsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Computing the components: power iteration</>}
        intro={<>Every page so far has said &ldquo;eigen-decompose <M>{String.raw`\Sigma`}</M>&rdquo; and moved on, as
          if the eigenvectors simply appear. They don&rsquo;t — there&rsquo;s an algorithm, and it&rsquo;s remarkably
          simple. This page builds it end to end: how you&rsquo;d actually find an eigenvector by hand, and what
          production libraries do instead.</>}
      />

      <div className="lesson">
        <h2>The one-move idea: keep multiplying by Σ</h2>
        <p>
          Recall that <M>{String.raw`\Sigma`}</M> stretches every direction, but stretches the top-eigenvalue
          direction the most. So if you take <em>any</em> vector and multiply it by <M>{String.raw`\Sigma`}</M> over
          and over, the component along the dominant eigenvector grows fastest and quickly swamps the others. Renormalise
          to unit length after each multiply so the vector doesn&rsquo;t blow up, and you have <strong>power
          iteration</strong>:
        </p>
        <MathBlock>{String.raw`v \;\leftarrow\; \frac{\Sigma\, v}{\lVert \Sigma\, v\rVert}, \quad\text{repeat.}`}</MathBlock>

        <p>
          Why it works, precisely: write your starting vector in the (unknown) eigenbasis as{" "}
          <M>{String.raw`v = c_1 v_1 + c_2 v_2 + \cdots`}</M>. Applying <M>{String.raw`\Sigma`}</M> a total of{" "}
          <M>k</M> times scales each term by its eigenvalue to the <M>k</M>:
        </p>
        <MathBlock>{String.raw`\Sigma^k v = c_1\lambda_1^k v_1 + c_2\lambda_2^k v_2 + \cdots = \lambda_1^k\!\left(c_1 v_1 + c_2\big(\tfrac{\lambda_2}{\lambda_1}\big)^{\!k} v_2 + \cdots\right).`}</MathBlock>
        <p>
          Since <M>{String.raw`\lambda_2/\lambda_1 < 1`}</M>, every term but the first decays to nothing. After enough
          steps only <M>{String.raw`v_1`}</M> survives — the estimate has converged to PC1. The <em>speed</em> depends
          on the ratio <M>{String.raw`\lambda_2/\lambda_1`}</M>: a big gap between the top two eigenvalues means fast
          convergence; a near-tie means slow.
        </p>

        <PredictPrompt
          accent={DIM}
          prompt={<>Start the arrow far from PC1 and step. How many iterations until it visibly locks onto the true
            PC1 line?</>}
          options={["1–2", "About 5", "Dozens"]}
        />

        <LabFrame
          accent={DIM}
          tryThis={<>Hit <strong>Step ×1</strong> repeatedly (or <strong>Run ×8</strong>). Watch the gold{" "}
            <M>{String.raw`\Sigma v`}</M> arrow always lean toward PC1, so renormalising drags the estimate that way.
            Try <strong>Random start</strong> — does where you begin change where it ends?</>}
          insight={<>From almost any start it snaps onto PC1 in about five steps, and the Rayleigh quotient climbs to{" "}
            <M>{String.raw`\lambda_1`}</M> while the angle-to-truth falls to 0°. The starting vector doesn&rsquo;t
            matter (unless you pick one exactly perpendicular to PC1) — the dominant direction always wins.</>}
        >
          <PowerIterationLab />
        </LabFrame>

        <h2>The whole thing in code</h2>
        <p>
          It really is just those two lines in a loop. Here it is converging on a real 2×2 matrix, matched against
          NumPy&rsquo;s library routine:
        </p>
        <CodeBlock language="Python" fromScratch={POWER} withLibrary={POWER} />
        <CodeOutput>{`iter 1: v=[0.8291,0.5591]  rayleigh=3.64260
iter 2: v=[0.8784,0.4779]  rayleigh=3.68036
iter 3: v=[0.8848,0.4661]  rayleigh=3.68112
iter 4: v=[0.8856,0.4644]  rayleigh=3.68114
iter 5: v=[0.8858,0.4641]  rayleigh=3.68114
eigh : lambda1=3.68114  v1=[0.8858,0.4641]`}</CodeOutput>
        <p>
          Five iterations of a two-line loop reproduce the library&rsquo;s eigenvector to four decimals, and the
          Rayleigh quotient <M>{String.raw`v^\top\Sigma v`}</M> lands on the eigenvalue exactly as the{" "}
          <Link href="/learn/pca/rayleigh-and-eigen" style={link}>Rayleigh page</Link> promised.
        </p>

        <h2>Getting the rest: deflation</h2>
        <p>
          Power iteration only gives you the <em>top</em> eigenvector. To get PC2, remove PC1&rsquo;s contribution from
          the matrix — <strong>deflation</strong> — and repeat. Subtracting <M>{String.raw`\lambda_1 v_1 v_1^\top`}</M>
          zeroes out the top direction, so the same iteration now converges to the next one:
        </p>
        <CodeBlock language="Python" fromScratch={DEFLATE} withLibrary={DEFLATE} />
        <p>
          Repeat <M>k</M> times and you have the top <M>k</M> components — which is exactly what you want for
          dimensionality reduction, without ever computing the small components you were going to discard anyway.
        </p>

        <Callout color={DIM} title={<>What production libraries actually run</>}>
          Power iteration is the <em>idea</em>; real solvers are faster and sturdier. For a full eigen-decomposition,
          LAPACK uses the <strong>QR algorithm</strong> (essentially power iteration on a whole basis at once, with
          shifts to speed convergence). For PCA specifically, libraries skip <M>{String.raw`\Sigma`}</M> entirely and
          take the <Link href="/learn/pca/svd" style={link}>SVD</Link> of the data; the <strong>randomized SVD</strong>
          that scikit-learn uses for big data is, under the hood, block power iteration that estimates just the top{" "}
          <M>k</M> directions in a handful of matrix multiplies. Same principle, industrial polish.
        </Callout>

        <p>
          The deeper linear-algebra machinery — orthogonality, the spectral theorem, the QR algorithm in full — lives
          in the <em>Math Foundations</em> track. For PCA, this is all you need: eigenvectors aren&rsquo;t conjured,
          they&rsquo;re iterated to, and you could code the essential version in five lines.
        </p>

        <PrevNext
          prev={{ href: "/learn/pca/rayleigh-and-eigen", label: <>← The Rayleigh quotient &amp; why eigenvectors</> }}
          next={{ href: "/learn/pca/whitening", label: <>Next up · Whitening &amp; decorrelation →</> }}
        />
      </div>
    </article>
  );
}
