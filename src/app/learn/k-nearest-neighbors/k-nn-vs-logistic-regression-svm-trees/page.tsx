import Link from "next/link";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-NN vs logistic regression, SVM, trees — Manifold",
  description:
    "Four classifiers, four philosophies. How k-NN's local, non-parametric approach stacks up against logistic regression's line, the SVM's margin, and a tree's splits — criterion by criterion.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "9px 11px", fontSize: 12, color: "var(--ink)", fontWeight: 600, borderBottom: "2px solid var(--border-strong)", background: "var(--surface)", position: "sticky", top: 0 };
const rowh: React.CSSProperties = { textAlign: "left", padding: "9px 11px", fontSize: 12.5, color: "var(--ink)", fontWeight: 600, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 11px", fontSize: 12.5, color: "var(--muted)", borderBottom: "1px solid var(--border)", verticalAlign: "top", minWidth: 130 };

function Row({ h, knn, logit, svm, tree }: { h: React.ReactNode; knn: React.ReactNode; logit: React.ReactNode; svm: React.ReactNode; tree: React.ReactNode }) {
  return (
    <tr>
      <td style={rowh}>{h}</td>
      <td style={{ ...td, background: "color-mix(in srgb, var(--c-classification) 5%, transparent)" }}>{knn}</td>
      <td style={td}>{logit}</td>
      <td style={td}>{svm}</td>
      <td style={td}>{tree}</td>
    </tr>
  );
}

export default function KnnVsOthersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · strengths & kin", color: "var(--c-classification)" }]}
        time="about 9 minutes"
        title={<>k-NN vs logistic regression, SVM, trees</>}
        intro={<>
          The best way to understand a method is to set it beside its rivals. Each of these four classifiers
        embodies a different bet about what a decision boundary <em>is</em> — and those bets decide which one
        wins on your problem.
        </>}
      />

      <div className="lesson">
        <h2>Four philosophies of a boundary</h2>
        <ul style={ul}>
          <li><strong>k-NN</strong> — memorise everything; decide locally by who&rsquo;s nearby. No global model at all.</li>
          <li><strong>Logistic regression</strong> — assume one global log-odds <em>line</em> (hyperplane) separates the classes.</li>
          <li><strong>SVM</strong> — find the single <em>maximum-margin</em> boundary; kernels bend it without leaving the linear framework.</li>
          <li><strong>Decision tree</strong> — carve space with a hierarchy of <em>axis-aligned</em> yes/no splits.</li>
        </ul>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 680, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={{ ...th, color: "var(--c-classification)" }}>k-NN</th>
                <th style={th}>Logistic reg.</th>
                <th style={th}>SVM</th>
                <th style={th}>Decision tree</th>
              </tr>
            </thead>
            <tbody>
              <Row h="Model type" knn="Non-parametric, lazy" logit="Parametric, linear" svm="Parametric (+kernel)" tree="Non-parametric, greedy" />
              <Row h="Boundary shape" knn="Arbitrary, local" logit="Linear hyperplane" svm="Linear or kernel-curved" tree="Axis-aligned rectangles" />
              <Row h="Training cost" knn={<>None — <M>{String.raw`O(1)`}</M> store</>} logit="Cheap convex fit" svm="Costly (∼quadratic)" tree="Moderate, greedy splits" />
              <Row h="Inference cost" knn={<>High — <M>{String.raw`O(nd)`}</M> or indexed</>} logit="Trivial dot product" svm="Cheap (support vectors)" tree="Trivial — walk the tree" />
              <Row h="Interpretability" knn="By example only" logit="High — coefficients / odds" svm="Low (esp. kernel)" tree="High — readable rules" />
              <Row h="Extrapolation" knn="Never" logit="Yes (linearly)" svm="Yes (linearly)" tree="Flat beyond leaves" />
              <Row h="Scaling needed?" knn="Critical" logit="Helpful" svm="Critical" tree="Not needed" />
              <Row h="High-d behaviour" knn="Poor (curse)" logit="Good" svm="Good (esp. margins)" tree="Moderate" />
              <Row h="Irrelevant features" knn="Hurt a lot" logit="Down-weighted" svm="Down-weighted (reg.)" tree="Ignored by splits" />
              <Row h="Handles non-linearity" knn="Yes, natively" logit="No (needs features)" svm="Yes (kernel)" tree="Yes" />
            </tbody>
          </table>
        </div>

        <h2>How to read the table</h2>
        <ul style={ul}>
          <li><strong>k-NN vs logistic regression</strong> — the cleanest contrast: local &amp; flexible vs global &amp; linear. If the truth is roughly linear or you need interpretable coefficients and extrapolation, logistic wins; if it&rsquo;s wiggly and you have data, k-NN wins. (You met this exact trade-off in the <Link href="/learn/logistic-regression" style={inlineLink}>logistic track</Link>.)</li>
          <li><strong>k-NN vs SVM</strong> — both can draw curved boundaries (k-NN natively, SVM via kernels), and both are scaling-critical. But the SVM keeps only the <em>support vectors</em>, giving cheap, compact inference, while k-NN keeps everything. The SVM also copes far better in high dimensions.</li>
          <li><strong>k-NN vs trees</strong> — near-opposites on preprocessing: trees are scale-invariant and shrug off irrelevant features (a split just ignores them), where k-NN is acutely sensitive to both. Trees give readable rules and instant inference; k-NN gives smoother, non-axis-aligned boundaries.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>The honest default: try k-NN first, rarely ship it alone</>}>
          Because it&rsquo;s assumption-light and needs almost no setup, k-NN is an excellent{" "}
            <strong>baseline</strong> — if a tuned k-NN barely beats the majority-class rate, your features
            probably lack signal, which is worth knowing before you reach for anything fancier. In production it&rsquo;s
            most often <em>either</em> the retrieval backbone (similarity search at scale) <em>or</em> a component,
            with trees/boosting and linear models doing the heavy classification lifting. Use it to learn the
            problem, then pick deliberately.
        </Callout>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "Compared with an SVM, a key downside of k-NN at inference time is…",
              options: ["k-NN must consult all training data; an SVM keeps only the support vectors", "k-NN can't draw curved boundaries", "k-NN needs a kernel to work"],
              answer: 0,
              explain: "Both can be non-linear, but the SVM's model is a compact set of support vectors, giving cheap inference. k-NN carries the whole dataset.",
            },
            {
              q: "On which preprocessing point are k-NN and decision trees near-opposites?",
              options: ["Feature scaling and irrelevant features — critical for k-NN, largely irrelevant to trees", "Both require heavy scaling", "Both ignore feature scale"],
              answer: 0,
              explain: "Trees split one feature at a time, so scale and irrelevant columns don't matter; k-NN sums all features into one distance, so both matter enormously.",
            },
            {
              q: "The best default role for k-NN in a project is usually…",
              options: ["A fast, assumption-light baseline (and the retrieval backbone at scale)", "The final production classifier for any tabular task", "A replacement for cross-validation"],
              answer: 0,
              explain: "k-NN is superb for learning the problem quickly and for similarity search; heavy classification lifting usually goes to linear models, trees, or boosting.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/when-to-use-k-nn", label: <>← When to use k-NN</> }} next={{ href: "/learn/k-nearest-neighbors/k-nn-vs-k-means", label: <>Next up · k-NN vs k-means (the name trap) →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
