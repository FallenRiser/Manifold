import { M, MathBlock } from "@/components/Math";
import { SVRTubeLab } from "@/components/labs/SVRTubeLab";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The tube & support vectors — Manifold",
  description:
    "Inside the tube, points are free; on or outside it, they're support vectors that alone define the fit. The three categories of point, why most coefficients are exactly zero, and where SVR's sparsity comes from.",
};

export default function TubeAndSupportVectorsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · the ε-insensitive idea", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>The tube &amp; support vectors</>}
        intro={<>
          The ε-insensitive loss splits your data into two kinds of point: the ones the model can ignore, and the
        ones that define it. That split is the source of SVR&rsquo;s defining property — a <em>sparse</em> model
        built from just a handful of support vectors.
        </>}
      />

      <div className="lesson">
        <h2>Three categories of point</h2>
        <p>
          Relative to the fitted tube, every training point lands in one of three places — and the optimisation
          treats each completely differently:
        </p>
        <ul style={ul}>
          <li>
            <strong>Strictly inside the tube.</strong> Zero loss, zero influence. Its dual coefficient is exactly
            <M>{String.raw`\,0`}</M>. These points are <em>not</em> support vectors and can be deleted without
            changing the model at all.
          </li>
          <li>
            <strong>Exactly on the tube edge.</strong> A support vector with a coefficient <em>between</em> 0 and
            <M>{String.raw`\,C`}</M>. It sits right at the boundary of &ldquo;close enough,&rdquo; helping pin the
            fit&rsquo;s position.
          </li>
          <li>
            <strong>Outside the tube.</strong> A support vector at the <em>maximum</em> coefficient{" "}
            <M>{String.raw`C`}</M> — a point the model couldn&rsquo;t fit within tolerance. Its pull is capped at{" "}
            <M>{String.raw`C`}</M>, which is what bounds an outlier&rsquo;s influence.
          </li>
        </ul>

        <PredictPrompt
          accent="var(--c-regression)"
          prompt={<>As you <em>widen</em> the tube (increase ε) below, the number of support vectors will…</>}
          options={["Decrease — points slip inside and go free", "Increase", "Stay the same"]}
        />
        <LabFrame
          accent="var(--c-regression)"
          tryThis={<>Drag ε from narrow to wide. Watch filled (support-vector) points turn hollow (free) as the tube swallows them, and the support-vector count fall.</>}
          insight={<>Wider tube → fewer support vectors → sparser, flatter model. The two outliers stay support vectors, but their influence is capped at C — that&rsquo;s the robustness.</>}
        >
          <SVRTubeLab />
        </LabFrame>

        <h2>Why so many coefficients are exactly zero</h2>
        <p>
          The optimisation&rsquo;s KKT conditions force a clean rule: a point contributes to the model{" "}
          <em>only</em> if it&rsquo;s on or outside the tube. Everything strictly inside gets coefficient zero, by
          construction. So the trained SVR is a sum over the support vectors alone:
        </p>
        <MathBlock>{String.raw`\hat{y}(x) = \sum_{i \in \text{SV}} (\alpha_i - \alpha_i^*)\, k(x_i, x) + b`}</MathBlock>
        <p>
          where the sum runs only over support vectors — the points with a nonzero coefficient{" "}
          <M>{String.raw`(\alpha_i - \alpha_i^*)`}</M>. On typical data that&rsquo;s a fraction of the training set,
          which is exactly why the model is compact.
        </p>

        <Callout color="var(--c-regression)" title={<>Sparse where kernel ridge is dense</>}>
          This is the pivotal difference from kernel ridge regression. Under squared loss, <em>every</em>{" "}
            coefficient is nonzero, so KRR keeps all <M>{String.raw`n`}</M> points and predicting costs{" "}
            <M>{String.raw`O(n)`}</M>. SVR keeps only its support vectors — often far fewer — so its model is
            smaller and its predictions cheaper. Same representer-theorem form; the ε-insensitive loss is what
            zeroes the rest.
        </Callout>

        <h2>Reading the support-vector count</h2>
        <p>
          The fraction of points that end up as support vectors is a useful diagnostic. It&rsquo;s pushed <em>down</em>
          by a wider tube (larger ε) and pushed <em>up</em> by demanding a tighter fit (larger C). If nearly every
          point is a support vector, your model isn&rsquo;t really sparse — usually a sign ε is too small or the
          kernel is too flexible. The next page introduces C, the knob that governs the points outside the tube.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Which points are NOT support vectors in SVR?",
              options: ["Points strictly inside the ε-tube — coefficient exactly zero", "Points on the tube edge", "Points outside the tube"],
              answer: 0,
              explain: "Inside the tube the loss is zero, so the KKT conditions set the coefficient to zero. Those points can be removed without changing the model.",
            },
            {
              q: "A point far outside the tube has a dual coefficient…",
              options: ["Capped at C — which bounds how much an outlier can influence the fit", "Of exactly zero", "That grows without limit"],
              answer: 0,
              explain: "Points outside the tube sit at the maximum coefficient C. That ceiling is what makes SVR robust: no single outlier can dominate.",
            },
            {
              q: "Widening the tube (increasing ε) does what to sparsity?",
              options: ["Increases it — more points fall inside and become free (non-support-vectors)", "Decreases it", "No effect"],
              answer: 0,
              explain: "A wider dead zone swallows more points, so fewer remain as support vectors — a sparser, flatter model.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/the-epsilon-insensitive-loss", label: <>← The ε-insensitive loss</> }} next={{ href: "/learn/support-vector-regression/soft-margin-c-and-slack", label: <>Next up · Soft margin: C &amp; slack →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
