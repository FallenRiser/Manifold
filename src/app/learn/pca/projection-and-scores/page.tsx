import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PcaProjectionLab } from "@/components/labs/PcaProjectionLab";

export const metadata = {
  title: "Projection & the new coordinates — Manifold",
  description:
    "Once you have the components, using them is a dot product. Each point's coordinates in the new, PCA basis are its scores — and keeping only the first k scores is the actual act of dimensionality reduction.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ProjectionScoresPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Projection &amp; the new coordinates</>}
        intro={<>You have the axes; now you use them. Reducing a point to its principal components is just a dot
          product per component. The results are called <em>scores</em>, and they are your data re-expressed in a
          new, smarter coordinate system.</>}
      />

      <div className="lesson">
        <h2>Scores are coordinates in the PCA basis</h2>
        <p>
          A point&rsquo;s <strong>score</strong> on component <M>{String.raw`v_j`}</M> is how far along that axis its
          shadow falls — the projection <M>{String.raw`z_j = v_j^\top(x-\bar x)`}</M>. Collect the first <M>k</M>{" "}
          components as columns of a matrix <M>{String.raw`V_k`}</M> and the whole reduction is one multiplication:
        </p>
        <MathBlock>{String.raw`z = V_k^\top (x - \bar x) \;\in\; \mathbb{R}^k.`}</MathBlock>
        <p>
          A point that took <M>d</M> numbers to write down now takes <M>k</M>. Those <M>k</M> scores <em>are</em> the
          reduced representation — the thing you plot, store, or feed to the next model. Nothing is lost yet if you
          keep all <M>d</M> components; you&rsquo;ve only <em>rotated</em> the coordinate system to the data&rsquo;s
          natural axes. Reduction happens the moment you keep only the first <M>k</M> and drop the rest.
        </p>

        <LabFrame
          accent={DIM}
          tryThis={<>Watch the violet dots — the projected shadows — as you rotate the line. Each shadow&rsquo;s
            position along the line is that point&rsquo;s <em>score</em> on this direction. When is the set of scores
            most spread out?</>}
          insight={<>The scores are just the 1-D coordinates of the points along the chosen axis. On PC1 they&rsquo;re
            maximally spread — the single number that best separates the points. That&rsquo;s a 2-D-to-1-D reduction
            you can literally see happen.</>}
        >
          <PcaProjectionLab />
        </LabFrame>

        <h2>Two properties that make scores special</h2>
        <p>
          The new coordinates aren&rsquo;t just smaller — they&rsquo;re better behaved than the originals in two ways:
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>They&rsquo;re uncorrelated.</strong> By construction the components are orthogonal, so the scores have zero covariance between them — PCA has <em>decorrelated</em> your features. Redundancy is gone.</li>
          <li><strong>They&rsquo;re ranked by variance.</strong> Score 1 varies most, score 2 next, and so on, so the columns arrive in order of importance. You never wonder which feature matters most; column order tells you.</li>
        </ul>

        <p>
          Because the components are orthonormal, going back is just as easy — no matrix inverse needed, only a
          transpose:
        </p>
        <MathBlock>{String.raw`\hat x = \bar x + V_k\, z.`}</MathBlock>
        <p>
          If <M>k = d</M> this rebuilds the point exactly. If <M>k &lt; d</M> it rebuilds the point&rsquo;s{" "}
          <em>shadow</em> on the <M>k</M>-dimensional surface — an approximation whose error is precisely the variance
          you dropped. That trade is the subject of the <Link href="/learn/pca/reconstruction" style={link}>next
          page</Link>.
        </p>

        <Callout color={DIM} title={<>Reduce, then rebuild — the encoder/decoder pair</>}>
          <M>{String.raw`z = V_k^\top(x-\bar x)`}</M> <strong>encodes</strong> a point into <M>k</M> numbers;{" "}
          <M>{String.raw`\hat x = \bar x + V_k z`}</M> <strong>decodes</strong> it back. Same matrix, once transposed.
          Hold onto that framing — it&rsquo;s exactly what makes PCA a{" "}
          <Link href="/learn/pca/linear-autoencoder" style={link}>linear autoencoder</Link>.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/eigenvectors", label: <>← Eigenvectors: the axes of the cloud</> }}
          next={{ href: "/learn/pca/reconstruction", label: <>Next up · Reconstruction &amp; what you drop →</> }}
        />
      </div>
    </article>
  );
}
