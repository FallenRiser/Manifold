import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Bregman divergences — Manifold",
  description:
    "Squared error and KL divergence look unrelated until you see they're both Bregman divergences — the gap between a convex function and its tangent line. This single family unifies half the loss functions in ML.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BregmanPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Information theory", color: AMBER }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Bregman divergences</>}
        intro={<>A closing idea that ties the whole track together. Squared error (from{" "}
          <Link href="/learn/math-foundations/spd-matrices" style={link}>linear algebra</Link>) and KL divergence (from
          information theory) seem unrelated — until you learn they are both instances of one construction, built from
          a single <Link href="/learn/math-foundations/convexity" style={link}>convex function</Link>.</>}
      />

      <div className="lesson">
        <h2>The gap above the tangent line</h2>
        <p>
          Take any strictly convex function <M>{String.raw`\phi`}</M>. At a point <M>q</M>, draw its tangent line.
          Because <M>{String.raw`\phi`}</M> is convex, the function sits <em>above</em> that tangent everywhere. The{" "}
          <strong>Bregman divergence</strong> <M>{String.raw`D_\phi(p, q)`}</M> is the vertical gap between the
          function at <M>p</M> and the tangent-from-<M>q</M> evaluated at <M>p</M>:
        </p>
        <MathBlock>{String.raw`D_\phi(p, q) = \phi(p) - \phi(q) - \nabla\phi(q)^\top (p - q).`}</MathBlock>
        <p>
          It&rsquo;s the error of a first-order (linear) approximation of <M>{String.raw`\phi`}</M> at <M>q</M>, used
          to predict <M>p</M>. Convexity makes it <M>{String.raw`\ge 0`}</M>, and <M>0</M> only when{" "}
          <M>{String.raw`p = q`}</M> — the two hallmarks of a divergence.
        </p>

        <h2>One template, many familiar losses</h2>
        <p>
          The magic is what you get by choosing different <M>{String.raw`\phi`}</M>:
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><M>{String.raw`\phi(x) = \lVert x\rVert^2`}</M> gives <strong>squared Euclidean distance</strong> — the loss of least squares and k-means.</li>
          <li><M>{String.raw`\phi(x) = \sum x_i \log x_i`}</M> (negative entropy) gives <strong><Link href="/learn/math-foundations/kl-divergence" style={link}>KL divergence</Link></strong> — the loss of classification.</li>
          <li>Other choices give the Itakura–Saito divergence (audio), the logistic loss, and more.</li>
        </ul>
        <p>
          So squared error and cross-entropy — the two losses you meet first — aren&rsquo;t a coincidence of separate
          fields. They&rsquo;re the same object with a different convex generator. That&rsquo;s why they share
          properties: for both, the <em>mean</em> is the minimizer of the average divergence, which is exactly why
          predicting the mean minimizes MSE and predicting the average distribution minimizes cross-entropy.
        </p>

        <Callout color={AMBER} title={<>The unifying picture</>}>
          Convexity (calculus) provides the generator; the divergence it induces measures &ldquo;how wrong&rdquo;
          (probability &amp; information); and the minimizer is an average (statistics). Bregman divergences sit at the
          confluence of every strand in this track — a fitting place to end, because it shows the pieces were never
          separate subjects, just different views of the same mathematics.
        </Callout>

        <Quiz
          title="Can you answer these? · whole track"
          accent={AMBER}
          questions={[
            {
              q: <>Across the linear-algebra strand, the deepest single idea was that a matrix is best understood as…</>,
              options: ["a grid of numbers to memorize", "a transformation that moves space", "always invertible"],
              answer: 1,
              explain: <>Matrix-as-motion makes eigenvectors (unmoved directions), the determinant (area scale), and the SVD (rotate–scale–rotate) all intuitive.</>,
            },
            {
              q: <>Why is a convex loss so desirable to optimize?</>,
              options: ["it trains faster always", "every local minimum is global, so gradient descent can't get trapped", "it needs no learning rate"],
              answer: 1,
              explain: <>One bowl, one minimum — downhill always leads to the best answer, the guarantee non-convex (neural) losses lack.</>,
            },
            {
              q: <>The central limit theorem and Hoeffding&rsquo;s inequality both concern sample averages. The key difference is…</>,
              options: [
                "they're identical",
                "the CLT is an asymptotic shape (n→∞); Hoeffding is an exact, finite-n probability bound",
                "Hoeffding needs Gaussian data",
              ],
              answer: 1,
              explain: <>The CLT describes the limiting Gaussian shape; concentration inequalities give guarantees that hold for every finite n.</>,
            },
            {
              q: <>Squared error and cross-entropy are unified by the fact that both are…</>,
              options: ["symmetric distances", "Bregman divergences from different convex generators", "always equal"],
              answer: 1,
              explain: <>Choose <M>{String.raw`\lVert x\rVert^2`}</M> and you get squared error; choose negative entropy and you get KL/cross-entropy — one construction, two losses.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/math-foundations/mutual-information", label: <>← Mutual information</> }}
          next={{ href: "/learn/math-foundations", label: <>Back to the Math foundations hub →</> }}
        />
      </div>
    </article>
  );
}
