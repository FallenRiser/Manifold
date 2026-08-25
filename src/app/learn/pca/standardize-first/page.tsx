import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { StandardizeLab } from "@/components/labs/StandardizeLab";

export const metadata = {
  title: "Standardize before you PCA — Manifold",
  description:
    "PCA maximises variance, and variance depends on units. Leave a feature measured in thousands next to one measured in fractions and PCA will 'discover' nothing but the big-numbered column. Standardizing first is almost always the fix.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function StandardizeFirstPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Standardize before you PCA</>}
        intro={<>This is the mistake that silently ruins more PCA runs than any other. Because PCA chases variance and
          variance carries units, a feature that happens to be measured in large numbers will dominate the components
          for no reason but its scale. The fix is one line — but you have to know to reach for it.</>}
      />

      <div className="lesson">
        <h2>Variance has units, and PCA doesn&rsquo;t know that</h2>
        <p>
          Suppose one column is a chemical concentration around 700–1800 and another is a ratio around 0.4–1.7. The
          first column&rsquo;s variance is measured in the <em>hundreds of thousands</em>; the second&rsquo;s is a
          fraction. PCA, seeing only numbers, concludes the first direction has almost all the &ldquo;spread&rdquo;
          and makes PC1 point straight along it — capturing the biggest column, not the most structure. Rescale that
          column to different units and the entire analysis changes. That should worry you: a good method
          shouldn&rsquo;t depend on whether you measured in grams or kilograms.
        </p>

        <PredictPrompt
          accent={DIM}
          prompt={<>The two features below share a clear diagonal relationship, but feature 1 is on a far larger scale.
            Where will PC1 point on the raw data?</>}
          options={["Along the true diagonal", "Almost flat, along the big-scale feature", "Along the small-scale feature"]}
        />

        <LabFrame
          accent={DIM}
          tryThis={<>Look at PC1 on the raw data, then tick <strong>standardize features</strong> and watch it swing.
            Compare the PC1 loadings and the &ldquo;reads as&rdquo; readout in each mode.</>}
          insight={<>Raw, PC1 has loadings (1.00, 0.00) and ~100% of the variance — it has simply found the
            big-numbered column. Standardized, PC1 becomes the true (0.71, 0.71) diagonal. Same data, opposite
            conclusion, decided entirely by units.</>}
        >
          <StandardizeLab />
        </LabFrame>

        <h2>Standardizing = PCA on the correlation matrix</h2>
        <p>
          The fix is to z-score every feature first — subtract its mean, divide by its standard deviation — so each
          arrives with variance 1:
        </p>
        <p style={{ textAlign: "center", margin: "0.6rem 0 1.1rem" }}>
          <M>{String.raw`x'_j = \dfrac{x_j - \mu_j}{\sigma_j}`}</M>
        </p>
        <p>
          Running PCA on standardized data is identical to running it on the <strong>correlation matrix</strong>
          instead of the covariance matrix — every feature now gets an equal vote, and the components reflect
          <em> relationships</em> rather than <em>units</em>. On the real <code>load_wine</code> data, PCA without
          standardizing puts <strong>99.81%</strong> of the variance on PC1, made almost entirely of one feature
          (<code>proline</code>, loading 0.9998). After standardizing, PC1 drops to a sane <strong>36.2%</strong> and
          blends several genuinely related chemical measurements — a component that actually <em>means</em> something.
        </p>

        <Callout color={DIM} title={<>When not to standardize</>}>
          The exception is when your features are already in the <em>same</em> units and their relative scales are
          meaningful — pixels of an image (all 0–16), or spectra where a bigger peak really is more important. There,
          standardizing would <em>inflate</em> low-variance noise to equal footing with signal. Rule of thumb:
          different units → standardize; same units where magnitude is informative → center only.
        </Callout>

        <Quiz
          accent={DIM}
          questions={[
            {
              q: <>Why does an unstandardized feature with large numbers dominate PCA?</>,
              options: [
                "PCA maximises variance, and that feature's variance is huge purely because of its units",
                "PCA prefers the first column",
                "Large features are always more informative",
              ],
              answer: 0,
              explain: <>Variance carries units. A column measured in thousands has enormous numeric variance regardless of how much real structure it holds, so it hijacks PC1.</>,
            },
            {
              q: <>Standardizing every feature to unit variance makes PCA equivalent to working with…</>,
              options: ["the covariance matrix", "the correlation matrix", "the identity matrix"],
              answer: 1,
              explain: <>Z-scoring turns covariances into correlations, so PCA on standardized data is PCA on the correlation matrix — every feature gets an equal vote.</>,
            },
            {
              q: <>For an 8×8 image where all pixels are on the same 0–16 scale, you should usually…</>,
              options: [
                "standardize, always",
                "center only — the shared scale is meaningful, and standardizing would amplify noise",
                "skip centering too",
              ],
              answer: 1,
              explain: <>Same-unit features with meaningful magnitudes shouldn&rsquo;t be rescaled; standardizing would put low-variance noise on equal footing with real signal. Centering is still required.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/pca/choosing-k", label: <>← Choosing k in practice</> }}
          next={{ href: "/learn/pca/svd", label: <>Next up · PCA through the SVD →</> }}
        />
      </div>
    </article>
  );
}
