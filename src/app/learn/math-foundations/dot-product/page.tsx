import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DotProductLab } from "@/components/labs/DotProductLab";

export const metadata = {
  title: "The dot product & projection — Manifold",
  description:
    "The dot product turns two vectors into one number measuring how aligned they are. It's the single most-used operation in ML — every linear prediction, every projection, every similarity score is a dot product.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DotProductPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Linear algebra", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>The dot product &amp; projection</>}
        intro={<>If one operation deserves to be called the heartbeat of machine learning, it&rsquo;s the dot product.
          It takes two vectors and returns a single number that measures how much they point the same way — and from
          that one idea come predictions, projections, and similarity.</>}
      />

      <div className="lesson">
        <h2>Two formulas, one meaning</h2>
        <p>
          The dot product has an algebraic form (multiply matching components, add them up) and a geometric form
          (lengths times the cosine of the angle between them):
        </p>
        <MathBlock>{String.raw`\mathbf{a}\cdot\mathbf{b} = \sum_i a_i b_i = \lVert\mathbf a\rVert\,\lVert\mathbf b\rVert\cos\theta.`}</MathBlock>
        <p>
          The second form is the intuition: the dot product is <strong>large and positive</strong> when the vectors
          align, <strong>zero</strong> when they&rsquo;re perpendicular (<M>{String.raw`\cos 90^\circ = 0`}</M>), and{" "}
          <strong>negative</strong> when they point apart. It&rsquo;s a similarity score with a sign.
        </p>

        <PredictPrompt
          accent={AMBER}
          prompt={<>You drag <M>{String.raw`\mathbf b`}</M> until it&rsquo;s exactly perpendicular to{" "}
            <M>{String.raw`\mathbf a`}</M>. What will <M>{String.raw`\mathbf a\cdot\mathbf b`}</M> read?</>}
          options={["A large number", "Zero", "A negative number"]}
        />

        <LabFrame
          accent={AMBER}
          tryThis={<>Swing <M>{String.raw`\mathbf b`}</M> around. Find where the dot product is zero, most positive, and
            most negative. Watch the thick &ldquo;shadow&rdquo; — <M>{String.raw`\mathbf b`}</M>&rsquo;s projection
            onto <M>{String.raw`\mathbf a`}</M> — grow and shrink with it.</>}
          insight={<>Zero exactly when the arrows are perpendicular; largest when aligned. The shadow&rsquo;s length is{" "}
            <M>{String.raw`\mathbf a\cdot\mathbf b/\lVert\mathbf a\rVert`}</M> — the dot product <em>is</em> a
            projection in disguise, which is why PCA and least squares both live on it.</>}
        >
          <DotProductLab />
        </LabFrame>

        <h2>Projection: casting a shadow</h2>
        <p>
          The <strong>projection</strong> of <M>{String.raw`\mathbf b`}</M> onto <M>{String.raw`\mathbf a`}</M> is the
          shadow <M>{String.raw`\mathbf b`}</M> casts along <M>{String.raw`\mathbf a`}</M>&rsquo;s line — how much of{" "}
          <M>{String.raw`\mathbf b`}</M> lies in that direction:
        </p>
        <MathBlock>{String.raw`\text{proj}_{\mathbf a}\mathbf b = \frac{\mathbf a\cdot\mathbf b}{\lVert\mathbf a\rVert^2}\,\mathbf a.`}</MathBlock>
        <p>
          Projection is the geometric core of <Link href="/learn/pca/projection-and-scores" style={link}>PCA&rsquo;s
          scores</Link> (project data onto a component) and of <Link href="/learn/linear-regression" style={link}>least
          squares</Link> (project the target onto the space your features can reach). Orthogonality — a zero dot
          product — is what makes principal components independent and what the normal equations quietly enforce.
        </p>

        <Callout color={AMBER} title={<>Every linear prediction is a dot product</>}>
          A linear model computes <M>{String.raw`\hat y = \mathbf{w}\cdot\mathbf{x} + b`}</M> — the dot product of a
          weight vector with a feature vector. Cosine similarity for text and recommendations is a normalized dot
          product. A single neuron computes a dot product then bends it. Learn to read{" "}
          <M>{String.raw`\mathbf{w}^\top\mathbf{x}`}</M> as &ldquo;how much <M>{String.raw`\mathbf x`}</M> points the
          way <M>{String.raw`\mathbf w`}</M> cares about&rdquo; and linear models become transparent.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/norms", label: <>← Norms &amp; distance</> }}
          next={{ href: "/learn/math-foundations/matrices", label: <>Next up · Matrices as transformations →</> }}
        />
      </div>
    </article>
  );
}
