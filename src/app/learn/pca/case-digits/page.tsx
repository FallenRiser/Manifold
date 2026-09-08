import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { ScreeLab } from "@/components/labs/ScreeLab";

export const metadata = {
  title: "Case: compressing handwritten digits — Manifold",
  description:
    "PCA end to end on the 64-dimensional load_digits data: fit, read the scree plot, choose k, and measure the compression. Every number is a real scikit-learn run.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const FIT = `import numpy as np
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA

X = load_digits().data          # (1797, 64) pixel intensities 0..16
pca = PCA().fit(X)              # images share a scale -> center only, no scaling

cum = np.cumsum(pca.explained_variance_ratio_)
for thr in (0.80, 0.90, 0.95, 0.99):
    k = int(np.searchsorted(cum, thr) + 1)
    print(f"{int(thr*100)}% variance -> k = {k:2d} components ({k/64:.0%} of dims)")`;

const RECON = `# reconstruction error at a few k (mean squared pixel error)
for k in (1, 10, 20, 30, 40, 64):
    p  = PCA(n_components=k).fit(X)
    Xr = p.inverse_transform(p.transform(X))
    print(f"k={k:2d}: pixel MSE = {np.mean((X-Xr)**2):7.4f}  "
          f"| variance kept = {p.explained_variance_ratio_.sum():.1%}")`;

export default function CaseDigitsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "In the wild", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Case: compressing handwritten digits</>}
        intro={<>Time to run the whole pipeline on real data. The <code>load_digits</code> dataset is 1,797 handwritten
          numerals as 8×8 images — 64 pixels each. We&rsquo;ll fit PCA, read its scree plot, pick <M>k</M>, and put a
          hard number on how much we compressed. All outputs are real runs.</>}
      />

      <div className="lesson">
        <h2>Fit and read the spectrum</h2>
        <p>
          Because every pixel is on the same 0–16 scale and magnitude is meaningful, we <em>center but don&rsquo;t
          standardize</em> — the exception from the <Link href="/learn/pca/standardize-first" style={link}>scaling
          rule</Link>. Then we ask how many components each variance threshold needs:
        </p>

        <CodeBlock
          language="Python"
          fromScratch={FIT}
          withLibrary={FIT}
        />
        <CodeOutput>{`80% variance -> k = 13 components (20% of dims)
90% variance -> k = 21 components (33% of dims)
95% variance -> k = 29 components (45% of dims)
99% variance -> k = 41 components (64% of dims)`}</CodeOutput>

        <p>
          The payoff is already visible: <strong>90% of everything that varies across 1,797 digits lives in just 21
          of the 64 dimensions.</strong> Two-thirds of the columns carry the last 10%. Explore the full spectrum —
          the same real numbers — in the scree lab:
        </p>

        <LabFrame
          accent={DIM}
          tryThis={<>Find the elbow, then slide to <M>k=21</M> and confirm the cumulative line hits ~90%. How much
            further does <M>k</M> have to go to squeeze out the next 5%?</>}
          insight={<>The curve is steep then flat: from 90% (k=21) to 95% costs another 8 components, and the final 5%
            costs 23 more. Diminishing returns is the whole reason truncation is nearly free.</>}
        >
          <ScreeLab />
        </LabFrame>

        <h2>Measure the compression</h2>

        <GuessSlider
          accent={DIM}
          prompt={<>At <M>k=20</M> components (under a third of the pixels), what fraction of the original variance do you think survives?</>}
          min={40} max={100} step={1} start={70} actual={89.4} decimals={1}
          reveal={<>89.4% — kept by storing 20 numbers instead of 64. The pixel error drops from 15.98 at k=1 to 1.98 at k=20, which is why a digit is already crisp there.</>}
        />

        <CodeBlock language="Python" fromScratch={RECON} withLibrary={RECON} />
        <CodeOutput>{`k= 1: pixel MSE = 15.9777  | variance kept = 14.9%
k=10: pixel MSE =  4.9143  | variance kept = 73.8%
k=20: pixel MSE =  1.9843  | variance kept = 89.4%
k=30: pixel MSE =  0.7681  | variance kept = 95.9%
k=40: pixel MSE =  0.2215  | variance kept = 98.8%
k=64: pixel MSE =  0.0000  | variance kept = 100.0%`}</CodeOutput>

        <p>
          At <M>k=30</M> we store <strong>47% of the numbers</strong> and keep <strong>95.9% of the variance</strong>,
          with a pixel error under 0.8 on a 0–16 scale — a difference no eye would catch. That&rsquo;s lossy
          compression with a dial: <M>k</M> trades storage against fidelity along the exact curve the scree plot drew.
        </p>

        <Callout color={DIM} title={<>What we actually did</>}>
          One <code>fit</code>, one look at the scree plot, one choice of <M>k</M>, and a reconstruction check. No
          tuning, no iteration — PCA is closed-form. The <em>whole</em> workflow is &ldquo;fit, read the spectrum,
          pick <M>k</M> for your fidelity target, project.&rdquo; Next we use those compressed features to make a
          classifier faster.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/vs-alternatives", label: <>← PCA vs LDA, t-SNE &amp; autoencoders</> }}
          next={{ href: "/learn/pca/case-preprocessing", label: <>Next up · Case: PCA as preprocessing →</> }}
        />
      </div>
    </article>
  );
}
