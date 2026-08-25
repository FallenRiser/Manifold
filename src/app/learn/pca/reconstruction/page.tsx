import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { PcaDigitReconstructLab } from "@/components/labs/PcaDigitReconstructLab";

export const metadata = {
  title: "Reconstruction & what you drop — Manifold",
  description:
    "Keep k components, rebuild the data, and the error you're left with equals the variance you discarded. On real handwritten digits, 20 of 64 components already reconstruct a clearly legible number.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ReconstructionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Reconstruction &amp; what you drop</>}
        intro={<>Dropping components isn&rsquo;t free — but it&rsquo;s cheap, and you can measure the cost exactly.
          The error you incur by keeping only <M>k</M> components equals the variance carried by the ones you threw
          away. Nowhere is this clearer than watching a digit rebuild itself component by component.</>}
      />

      <div className="lesson">
        <h2>The error is the discarded variance</h2>
        <p>
          Encode a point to <M>k</M> scores and decode it back to <M>{String.raw`\hat x`}</M>. Because the components
          are orthonormal, the average squared reconstruction error has a stunningly clean form — it&rsquo;s just the
          sum of the eigenvalues you left out:
        </p>
        <MathBlock>{String.raw`\frac{1}{n}\sum_i \lVert x_i - \hat x_i\rVert^2 \;=\; \sum_{j=k+1}^{d} \lambda_j.`}</MathBlock>
        <p>
          Every eigenvalue is a variance, so keeping the <em>largest</em> eigenvalues throws away the{" "}
          <em>smallest</em> possible total error. This is why PCA&rsquo;s two objectives —{" "}
          <Link href="/learn/pca/two-objectives" style={link}>maximise retained variance, minimise reconstruction
          error</Link> — are the same objective wearing two hats. And it gives you a running quality gauge for free:
          the fraction of variance kept, <M>{String.raw`\big(\sum_{j\le k}\lambda_j\big)/\big(\sum_j\lambda_j\big)`}</M>,
          is one minus the relative error.
        </p>

        <h2>Watch a digit come back</h2>
        <p>
          The <code>load_digits</code> dataset is 1,797 handwritten numerals, each an 8×8 grid — a 64-dimensional
          vector of pixel intensities. Run PCA over all of them, then rebuild <em>one</em> digit from just its first{" "}
          <M>k</M> scores. At <M>k=1</M> you get a ghostly average; as <M>k</M> climbs, the specific digit sharpens
          into focus.
        </p>

        <PredictPrompt
          accent={DIM}
          prompt={<>These digits have 64 pixels. Roughly how many components do you think it takes before the number is clearly legible?</>}
          options={["About 5", "About 20", "You need almost all 64"]}
        />

        <LabFrame
          accent={DIM}
          tryThis={<>Slide <M>k</M> up from 1. When does the digit first become unmistakably a &ldquo;3&rdquo;? Compare
            the &ldquo;components stored&rdquo; against the &ldquo;variance kept&rdquo; at that point.</>}
          insight={<>Around <M>k=20</M> — under a third of the 64 dimensions — the 3 is unambiguous, because those 20
            components already hold ~89% of the variance. The last 44 components mostly encode fine noise you never
            needed. That gap between &ldquo;dimensions&rdquo; and &ldquo;information&rdquo; is the entire value of PCA.</>}
        >
          <PcaDigitReconstructLab />
        </LabFrame>

        <p>
          Notice the numbers move together exactly as the theory promised: at <M>k=20</M>, variance kept is 89.4%
          and the pixel error has fallen from 15.98 (at <M>k=1</M>) to 1.98. By <M>k=30</M> you&rsquo;re at 95.9%
          and an error of 0.77. You are storing less than half the numbers and losing almost nothing a human eye
          would notice — the essence of lossy compression. (All figures are real runs from{" "}
          <code>scripts/pca_cases.py</code>.)
        </p>

        <Callout color={DIM} title={<>Denoising falls out for free</>}>
          If the noise in your data is small, unstructured, and spread across many directions, it collects in the
          tiny trailing components — the ones reconstruction discards. So rebuilding from the top <M>k</M>
          components often returns data that is <em>cleaner</em> than the original, not just smaller. Compression and
          denoising are the same operation seen from two angles.
        </Callout>

        <Quiz
          accent={DIM}
          questions={[
            {
              q: <>Keeping the top <M>k</M> components, the mean squared reconstruction error equals…</>,
              options: ["the sum of the top k eigenvalues", "the sum of the discarded eigenvalues", "always zero"],
              answer: 1,
              explain: <>Error is the variance you dropped: <M>{String.raw`\sum_{j>k}\lambda_j`}</M>. Keeping the largest eigenvalues minimises it.</>,
            },
            {
              q: <>The 8×8 digit needed only ~20 of 64 components to read clearly because…</>,
              options: [
                "the pixels are independent, so each carries equal information",
                "neighbouring pixels are highly correlated, so the intrinsic dimension is far below 64",
                "PCA deletes pixels it doesn't like",
              ],
              answer: 1,
              explain: <>Correlated pixels mean the digits live near a low-dimensional surface; ~20 directions capture the shape, the rest are mostly noise.</>,
            },
            {
              q: <>Why can reconstructing from the top components act as a <em>denoiser</em>?</>,
              options: [
                "Noise is usually small and spread across the low-variance components that get discarded",
                "PCA can tell signal from noise perfectly",
                "It rescales every pixel to its mean",
              ],
              answer: 0,
              explain: <>Unstructured noise lands in the tiny trailing eigenvalues, so dropping them removes noise while keeping the high-variance signal.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/pca/projection-and-scores", label: <>← Projection &amp; the new coordinates</> }}
          next={{ href: "/learn/pca/scree-and-explained-variance", label: <>Next up · The scree plot &amp; explained variance →</> }}
        />
      </div>
    </article>
  );
}
