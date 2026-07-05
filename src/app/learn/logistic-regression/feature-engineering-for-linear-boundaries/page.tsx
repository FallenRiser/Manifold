import Link from "next/link";
import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

const code = `from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline

# circular data: inner disk = class 1, outer ring = class 0
plain = LogisticRegression(max_iter=5000).fit(Xc, yc)
print("plain logistic:      ", round(plain.score(Xc, yc), 3))

# add squared & interaction terms: x^2, y^2, x*y
poly = make_pipeline(PolynomialFeatures(2, include_bias=False),
                     LogisticRegression(max_iter=5000)).fit(Xc, yc)
print("with degree-2 terms: ", round(poly.score(Xc, yc), 3))`;

export default function FeatureEngineeringPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Feature engineering for linear boundaries</>}
        intro={<>
          Logistic regression can only draw straight boundaries. That sounds like a hard ceiling —
          until you realize you get to choose what &ldquo;straight&rdquo; is drawn <em>in</em>.
        </>}
      />

      <div className="lesson">
        <p>
          The decision-boundary page nailed down the limit: logistic regression&rsquo;s frontier is
          always a straight line (or flat plane). So when the truth is curved — one class forming a
          ring around the other — a line is helpless. Here&rsquo;s exactly that: an inner disk of one
          class inside a ring of the other. No straight cut separates them, and plain logistic
          regression scores a feeble <strong>63.5%</strong>, barely above a coin flip.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "1.4rem 0" }} className="elbow-grid">
          <CircleFig mode="line" caption="A line can't separate a disk from its surrounding ring — 63.5%." />
          <CircleFig mode="circle" caption="A circular boundary splits them cleanly — 94.5%." />
        </div>

        <h2>The trick: bend the space, not the model</h2>
        <p>
          A circle has equation <M>{String.raw`x_1^2 + x_2^2 = r^2`}</M>. That&rsquo;s not linear in{" "}
          <M>{String.raw`x_1, x_2`}</M> — but it <em>is</em> linear in the new features{" "}
          <M>{String.raw`x_1^2`}</M> and <M>{String.raw`x_2^2`}</M>. So if we hand the model those
          squared columns (plus the cross term <M>{String.raw`x_1 x_2`}</M>), it can express{" "}
          <M>{String.raw`w_1 x_1^2 + w_2 x_2^2 + \dots \ge 0`}</M> — a straight boundary in the
          expanded space that shows up as a <strong>curve</strong> back in the original picture. One
          line of <code>PolynomialFeatures</code> and accuracy jumps to 94.5%:
        </p>

        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`plain logistic:       0.635
with degree-2 terms:  0.945`}</CodeOutput>

        <p>
          This is the exact same move as the{" "}
          <Link href="/learn/polynomial-regression" style={{ color: "var(--brand)" }}>polynomial
          regression track</Link>: the model stays linear in its parameters, so all the machinery —
          the convex log loss, the clean gradient, the fast solver — keeps working untouched. You
          didn&rsquo;t make logistic regression nonlinear; you gave it a richer vocabulary and let it
          stay linear in that.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You keep adding higher and higher polynomial degrees to squeeze out more training accuracy. What eventually goes wrong?</>}
          options={["Nothing — more features is always better", "It overfits: the boundary contorts around noise and generalizes worse", "The solver refuses to run"]}
          nudge={<>Think back to the polynomial regression track — the same Runge-style instability applies to boundaries.</>}
        />

        <h2>The judgement: which features, how many</h2>
        <p>
          Feature engineering is where domain knowledge earns its keep, and where the danger lives.
          Every feature you add is a new degree of freedom the model can use to overfit — enough
          polynomial terms and the boundary will wrap itself around individual noisy points, acing
          the training set and failing on new data. Three habits keep it honest: add features you can{" "}
          <em>justify</em> (a squared term because you expect a sweet-spot effect, an interaction
          because two factors plausibly combine), <strong>regularize</strong> once the feature count
          grows (the previous page&rsquo;s penalty), and <strong>cross-validate</strong> to confirm
          the new features help on held-out data, not just training data.
        </p>

        <Callout color={ACCENT} title={<>Why bother, when a tree would just do it?</>}>
          Fair question — random forests and gradient boosting learn curved boundaries automatically,
          no hand-crafted features required. You reach for engineered-feature logistic regression when
          you want its virtues: a fast, interpretable model whose coefficients you can defend, honest
          probabilities, and no black box. The features become part of the explanation
          (&ldquo;risk rises with the <em>square</em> of dosage&rdquo;), not a thing hidden inside an
          ensemble.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Adding x², y², and xy as features lets logistic regression draw…",
              options: ["Any shape at all", "Conic boundaries (circles, ellipses, hyperbolas) — still 'linear' in the expanded features", "Only steeper straight lines"],
              answer: 1,
              explain: "Degree-2 features let the boundary be any conic section, which looks curved in the original space. The model is still linear in its parameters — that's why all the training machinery is unchanged.",
            },
            {
              q: "Why doesn't adding polynomial features make logistic regression 'nonlinear' in the way that matters for training?",
              options: ["It does — training becomes much harder", "The model stays linear in its weights, so the loss stays convex and the same solver works", "Polynomial features are removed before fitting"],
              answer: 1,
              explain: "Linear-in-parameters is the property that matters: squares and cross-terms are just precomputed columns. The objective stays convex, the gradient stays clean — only the feature matrix got wider.",
            },
            {
              q: "The main risk of aggressively engineering features is…",
              options: ["The model trains too slowly", "Overfitting — extra degrees of freedom let the boundary memorize noise", "Losing the probability interpretation"],
              answer: 1,
              explain: "Each added feature is capacity to overfit. Justify features, regularize as the count grows, and cross-validate to confirm they help on held-out data — the same discipline the polynomial regression track teaches.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/class-imbalance-and-class-weights", label: <>← Class imbalance &amp; class weights</> }}
          next={{ href: "/learn/logistic-regression/when-perfect-separation-breaks-everything", label: <>Next up · When perfect separation breaks everything →</> }}
        />
      </div>
    </article>
  );
}

// Faithful illustration of the circular dataset: inner disk = class 1, outer
// ring = class 0 (matches scripts/logit_tier2b.py's geometry).
function CircleFig({ mode, caption }: { mode: "line" | "circle"; caption: string }) {
  const S = 210, C = S / 2, scale = (S / 2 - 14) / 2.4;
  // deterministic points
  const pts: { x: number; y: number; c: number }[] = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 130; i++) {
    const r = rnd() * 2.4, th = rnd() * Math.PI * 2;
    let c = r < 1.3 ? 1 : 0;
    if (rnd() < 0.05) c = 1 - c;
    pts.push({ x: C + r * Math.cos(th) * scale, y: C + r * Math.sin(th) * scale, c });
  }
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "12px" }}>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={S} height={S} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {mode === "circle" && (
          <circle cx={C} cy={C} r={1.3 * scale} fill="none" stroke="var(--ink)" strokeWidth={2} strokeDasharray="5 4" />
        )}
        {mode === "line" && (
          <line x1={18} y1={C + 22} x2={S - 18} y2={C - 22} stroke="var(--ink)" strokeWidth={2} strokeDasharray="5 4" />
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.4} fill={p.c === 1 ? "var(--c-classification)" : "var(--c-regression)"} fillOpacity={0.85} />
        ))}
      </svg>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{caption}</div>
    </div>
  );
}
