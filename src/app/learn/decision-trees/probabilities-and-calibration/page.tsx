import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Probabilities & calibration — Manifold",
  description:
    "A tree's leaf proportions make poor probabilities — coarse, and overconfident when leaves are pure. How to read them honestly with Laplace smoothing, why deep trees mis-calibrate, and how to fix it.",
};

const TREES = "var(--c-trees)";

// schematic reliability diagram — illustrative shape, not a measured run
const FS = 200, FP = 30;
const rx = (v: number) => Math.round((FP + v * (FS - 2 * FP)) * 100) / 100;
const ry = (v: number) => Math.round((FS - FP - v * (FS - 2 * FP)) * 100) / 100;
// a typical overconfident tree curve: predictions pushed toward 0/1, truth milder
const TREE_CURVE = [
  [0.0, 0.08], [0.15, 0.22], [0.3, 0.33], [0.5, 0.5], [0.7, 0.66], [0.85, 0.77], [1.0, 0.9],
] as [number, number][];

export default function CalibrationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Probabilities &amp; calibration</>}
        intro={<>
          Ask a tree for a probability and it hands you the class proportion in the leaf a point lands in. That
          number is useful, but it&rsquo;s a worse probability than people assume — and a fully grown tree
          produces some of the most overconfident probabilities in machine learning.
        </>}
      />

      <div className="lesson">
        <h2>Where a tree&rsquo;s probabilities come from</h2>
        <p>
          A classification leaf stores how many training points of each class reached it. The predicted
          probability of the positive class is just that leaf&rsquo;s positive fraction —{" "}
          <M>{String.raw`\hat{p} = k / n_{\text{leaf}}`}</M>. Simple, and it has two built-in problems.
        </p>
        <ul style={ul}>
          <li><strong>It&rsquo;s coarse.</strong> Every point in a leaf gets the <em>same</em> probability, and a
            tree has only as many distinct probabilities as it has leaves. A shallow tree might output just a
            handful of possible values — useless for ranking or fine thresholds.</li>
          <li><strong>It&rsquo;s overconfident when leaves are pure.</strong> Grow the tree deep and every leaf
            becomes 100% one class, so <M>{String.raw`\hat{p}`}</M> is exactly 0 or 1. The tree claims total
            certainty about points it has barely seen — a leaf of one training row asserting &ldquo;100%&rdquo;
            is noise dressed as confidence.</li>
        </ul>

        <figure style={{ margin: "1.4rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 12px" }}>
            <svg viewBox={`0 0 ${FS} ${FS}`} width="100%" style={{ maxWidth: 240, display: "block", margin: "0 auto" }} role="img" aria-label="Reliability diagram: a deep tree is overconfident">
              <line x1={FP} y1={FS - FP} x2={FS - FP} y2={FS - FP} stroke="var(--border-strong)" strokeWidth={1} />
              <line x1={FP} y1={FP} x2={FP} y2={FS - FP} stroke="var(--border-strong)" strokeWidth={1} />
              {/* perfect calibration diagonal */}
              <line x1={rx(0)} y1={ry(0)} x2={rx(1)} y2={ry(1)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 4" />
              <text x={rx(0.62)} y={ry(0.72)} fontSize={9} fill="var(--muted)" transform={`rotate(-45 ${rx(0.62)} ${ry(0.72)})`}>perfect</text>
              {/* tree reliability curve */}
              <polyline points={TREE_CURVE.map(([a, b]) => `${rx(a)},${ry(b)}`).join(" ")} fill="none" stroke="var(--c-trees)" strokeWidth={2} />
              <text x={FS / 2} y={FS - 6} fontSize={10} textAnchor="middle" fill="var(--faint)">predicted probability</text>
              <text x={10} y={FS / 2} fontSize={10} textAnchor="middle" fill="var(--faint)" transform={`rotate(-90 10 ${FS / 2})`}>observed frequency</text>
            </svg>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              Typical shape: where a deep tree says &ldquo;0.9,&rdquo; the true rate is lower; where it says
              &ldquo;0.1,&rdquo; the true rate is higher. The curve is flatter than the diagonal — overconfident at both ends.
            </div>
          </div>
        </figure>

        <h2>Reading them more honestly</h2>
        <p>Three fixes, in rough order of effort:</p>
        <ul style={ul}>
          <li><strong>Don&rsquo;t grow to purity.</strong> A <code>min_samples_leaf</code> of, say, 20 means every
            probability rests on 20 rows, not one — smoother, less extreme, more trustworthy. The pruning knobs
            you already know double as calibration knobs.</li>
          <li><strong>Laplace / m-estimate smoothing.</strong> Instead of <M>{String.raw`k/n`}</M>, use{" "}
            <M>{String.raw`(k+1)/(n+2)`}</M> (Laplace) so a pure leaf of one point reports ~0.67, not 1.0. It
            pulls extreme claims back toward the base rate in proportion to how little evidence supports them.</li>
          <li><strong>Post-hoc calibration.</strong> Fit a calibrator on held-out data that maps the
            tree&rsquo;s raw scores to honest probabilities — isotonic regression (flexible) or Platt scaling
            (a logistic fit).</li>
        </ul>

        <CodeBlock
          fromScratch={`from sklearn.calibration import CalibratedClassifierCV
from sklearn.tree import DecisionTreeClassifier

# wrap the tree; isotonic maps raw leaf proportions to calibrated probabilities
base = DecisionTreeClassifier(min_samples_leaf=20, random_state=0)
calibrated = CalibratedClassifierCV(base, method="isotonic", cv=5)
calibrated.fit(X_train, y_train)

# now predict_proba is trustworthy — check it with a reliability curve / Brier score
from sklearn.metrics import brier_score_loss
p = calibrated.predict_proba(X_test)[:, 1]
print("Brier score:", round(brier_score_loss(y_test, p), 3))  # lower = better`}
        />

        <Callout color={TREES} title={<>Forests calibrate better — but check</>}>
          A <Link href="/learn/random-forests" style={link}>random forest</Link> averages many trees&rsquo; leaf
          proportions, so it produces many distinct probabilities and is far less likely to output a naked 0 or
          1 — usually much better calibrated than a lone deep tree. It&rsquo;s not automatic, though: forests
          tend to be mildly <em>under</em>-confident near the extremes. Whenever a probability will drive a
          decision — a threshold, an expected-cost calculation — plot a reliability curve and calibrate if
          needed, rather than trusting <code>predict_proba</code> blind. The{" "}
          <Link href="/learn/evaluation/calibration" style={link}>calibration page</Link> in the evaluation
          pillar covers the how in depth.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/feature-importance", label: <>← Feature importance & reading a tree</> }}
          next={{ href: "/learn/decision-trees/when-to-use-a-tree", label: <>Next up · When to use a single tree →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
