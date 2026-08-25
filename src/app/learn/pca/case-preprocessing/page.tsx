import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { GuessSlider } from "@/components/capstone/GuessSlider";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Case: PCA as preprocessing — Manifold",
  description:
    "The most common real use of PCA isn't compression for its own sake — it's shrinking features before a model. We put PCA in a pipeline before logistic regression and cross-validate k, with real accuracy numbers.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CODE = `from sklearn.datasets import load_digits
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

X, y = load_digits(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3,
                                      random_state=0, stratify=y)

# baseline: all 64 features
full = make_pipeline(StandardScaler(),
                     LogisticRegression(max_iter=5000)).fit(Xtr, ytr)
print(f"full 64  : {full.score(Xte, yte):.4f}")

# PCA to k components, inside the pipeline (fit on train only -> no leakage)
for k in (10, 20, 30, 40):
    clf = make_pipeline(StandardScaler(), PCA(n_components=k),
                        LogisticRegression(max_iter=5000)).fit(Xtr, ytr)
    print(f"PCA({k:2d}) : {clf.score(Xte, yte):.4f}")`;

export default function CasePreprocessingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "In the wild", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Case: PCA as preprocessing</>}
        intro={<>Compression is nice; the reason PCA is everywhere is that it makes <em>downstream models</em> smaller
          and faster. Here we bolt PCA in front of a classifier, treat <M>k</M> as a hyperparameter, and see how few
          components we can get away with. Real runs, honest trade-offs.</>}
      />

      <div className="lesson">
        <h2>PCA in a pipeline</h2>
        <p>
          The pattern is: standardize → PCA → model, all inside one pipeline so the PCA is fit on the training fold
          only. Fitting PCA on the whole dataset before splitting would <strong>leak</strong> test information into
          the components — a subtle version of the mistake the{" "}
          <Link href="/learn/asteroid-hazard-capstone/the-split" style={link}>split page</Link> warns about. The
          pipeline makes the correct thing the easy thing.
        </p>

        <GuessSlider
          accent={DIM}
          prompt={<>Logistic regression on all 64 features scores 0.972 on the test set. Using only the top{" "}
            <strong>20</strong> principal components, what accuracy do you think it keeps?</>}
          min={70} max={100} step={0.5} start={85} actual={95.2} decimals={1}
          reveal={<>95.2% — off just 2 points while using under a third of the features. At 40 components it&rsquo;s 96.9%, essentially the full model. Low-variance directions were mostly dead weight.</>}
        />

        <CodeBlock language="Python" fromScratch={CODE} withLibrary={CODE} />
        <CodeOutput>{`full 64  : 0.9722
PCA(10) : 0.8759
PCA(20) : 0.9519
PCA(30) : 0.9593
PCA(40) : 0.9685`}</CodeOutput>

        <h2>Reading the trade-off</h2>
        <p>
          The curve tells a clear story. Ten components (0.876) throw away too much — accuracy drops 10 points. But
          <strong> 20 components recover 0.952</strong> and <strong>40 recover 0.969</strong>, within a whisker of the
          full 0.972 while cutting the feature count by 38%. If you were serving this model at scale, or feeding a{" "}
          <Link href="/learn/k-nearest-neighbors" style={link}>distance-based method</Link> that suffers in high
          dimensions, that reduction is real speed and real robustness for a negligible accuracy cost.
        </p>

        <Callout color={DIM} title={<>The honest caveat: variance ≠ accuracy</>}>
          Notice PCA is <em>unsupervised</em> — it never looked at the labels <M>y</M>. So there&rsquo;s no guarantee
          the top components are the most <em>predictive</em> ones, only the highest-variance ones. Here they largely
          coincide (digits&rsquo; big shape-variation is also what distinguishes them), which is why it works so well.
          When variance and label-relevance <em>diverge</em>, PCA can hurt — and you&rsquo;d cross-validate <M>k</M>
          (or switch to <Link href="/learn/pca/vs-alternatives" style={link}>LDA</Link>) rather than trust the scree
          plot. Always let the downstream score, not the variance, have the final word.
        </Callout>

        <h2>The whole track in one breath</h2>
        <p>
          PCA finds the directions your data varies along, ranked, in closed form. Center (and usually standardize),
          take the top eigenvectors of the covariance — really the SVD — and project. Keep enough components to hit
          your variance or accuracy target. It compresses, denoises, visualises, and speeds up models, and it fails
          gracefully — pointing at kernel PCA, manifolds, LDA, or autoencoders — exactly when its flat, unsupervised,
          variance-driven assumptions break. That&rsquo;s the foundation the whole{" "}
          <Link href="/map" style={link}>dimensionality-reduction family</Link> is built on.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={DIM}
          questions={[
            {
              q: <>Why must PCA be fit inside the cross-validation pipeline, not on the full dataset first?</>,
              options: [
                "It's faster that way",
                "Fitting on all data leaks test information into the components — a form of data leakage",
                "sklearn requires it",
              ],
              answer: 1,
              explain: <>The components are learned from the data; if they see the test rows, the evaluation is optimistic. Fit PCA on the training fold only.</>,
            },
            {
              q: <>PCA(20) scored 0.952 vs 0.972 for all 64 features. The best takeaway is…</>,
              options: [
                "PCA always improves accuracy",
                "You can keep almost all the accuracy with far fewer features — a favourable speed/fidelity trade",
                "The 44 dropped components were the important ones",
              ],
              answer: 1,
              explain: <>A 2-point drop for a 38%+ feature cut is usually a great deal, especially for distance-based or latency-sensitive models.</>,
            },
            {
              q: <>PCA is unsupervised, so its biggest risk as a preprocessor is that…</>,
              options: [
                "the highest-variance directions may not be the most predictive ones",
                "it always overfits",
                "it can only reduce to 2 dimensions",
              ],
              answer: 0,
              explain: <>Variance isn&rsquo;t importance. When they diverge, PCA can discard a useful low-variance direction — cross-validate k or use a supervised reducer like LDA.</>,
            },
            {
              q: <>Across this whole track, the single fact that makes PCA &ldquo;optimal&rdquo; is…</>,
              options: [
                "it uses gradient descent",
                "maximising kept variance equals minimising reconstruction error, and the top eigenvectors achieve both (Eckart–Young)",
                "it standardizes features automatically",
              ],
              answer: 1,
              explain: <>The variance/reconstruction duality plus Eckart–Young make the top-k eigenvectors the provably best flat k-dimensional summary of the data.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/pca/case-digits", label: <>← Case: compressing handwritten digits</> }}
          next={{ href: "/map", label: <>Back to the map →</> }}
        />
      </div>
    </article>
  );
}
