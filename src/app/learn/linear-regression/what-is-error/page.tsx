import { ResidualsLab } from "@/components/labs/ResidualsLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "What is error? — Manifold",
  description: "Every prediction misses by a little. The gap between what the model says and what actually happened is called the residual — and it's the most important number in all of model fitting.",
};

export default function WhatIsErrorPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>What is error?</>}
        intro={<>
          Every prediction misses by a little. The gap between what the model says and what
        actually happened is called the <em>residual</em> — and it&rsquo;s the most important
        number in all of model fitting.
        </>}
      />

      <div className="lesson">
        <p>
          You&rsquo;ve chosen a model — a line with a slope and intercept. Now you have a dataset
          of real examples. For each example, your line will make a prediction. Almost always, that
          prediction will be a little wrong. The question is: <em>how wrong?</em>
        </p>

        <h2>The residual</h2>
        <p>
          For any single training example with true value <code>yᵢ</code> and predicted value{" "}
          <code>ŷᵢ</code>, the <strong>residual</strong> is:
        </p>
        <div style={{ textAlign: "center", margin: "1rem 0", padding: "14px 20px", background: "var(--surface-2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <code style={{ fontSize: 20, color: "var(--ink)" }}>eᵢ = yᵢ − ŷᵢ</code>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
            actual minus predicted — the signed vertical gap at point i
          </p>
        </div>
        <p>
          The sign tells you which way you were wrong: a <em>positive</em> residual means you
          predicted too low (the actual value is above your line). A <em>negative</em> residual
          means you predicted too high. If the residual is zero, you were exactly right — which
          almost never happens with real data.
        </p>
        <p>
          Residuals are also called <strong>errors</strong> in some contexts, though &ldquo;error&rdquo;
          technically refers to the deviation from the <em>true</em> underlying relationship (which
          we never know), while &ldquo;residual&rdquo; is what we actually measure on our training
          data. For now, treat them as the same thing.
        </p>

        <h2>See the residuals</h2>
        <p>
          The chart below shows our twelve data points with the best-fit line through them. Each
          coloured bar is the residual for that point — <span style={{ color: "var(--good)" }}>green</span>{" "}
          when the actual value is above the line, <span style={{ color: "var(--bad)" }}>red</span>{" "}
          when it&rsquo;s below.
        </p>

        <ResidualsLab />

        <p>
          Notice something in that &ldquo;Σeᵢ&rdquo; number: the positives and negatives nearly
          cancel out. That&rsquo;s not a coincidence — it&rsquo;s a property of the best-fit line.
          The OLS line is the unique line for which the sum of residuals is <em>exactly zero</em>.
          But that cancellation is precisely why we can&rsquo;t just add up errors to measure how
          bad a line is — a terrible line could also have errors that cancel.
        </p>

        <h2>What makes a residual small?</h2>
        <p>
          A smaller residual means the model got closer on that example. But &ldquo;closer&rdquo;
          in what units? In the same units as the target variable — if you&rsquo;re predicting
          house prices in thousands of dollars, a residual of 10 means your prediction was off by
          $10,000. That&rsquo;s concrete and interpretable.
        </p>
        <p>
          The collection of all residuals tells you a lot about a model:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.9, color: "var(--muted)", fontSize: 15 }}>
          <li>If the residuals are <strong>randomly scattered</strong> above and below zero, your
            model is unbiased — it&rsquo;s not systematically wrong in one direction.</li>
          <li>If they <strong>fan out</strong> as x grows, your line might be missing a curve in
            the data, or the spread of errors isn&rsquo;t constant (we&rsquo;ll come back to this
            when we talk about diagnostics).</li>
          <li>If one residual is <strong>enormous</strong> compared to the rest, you might have an
            outlier — a data point that&rsquo;s unusually far from the trend.</li>
        </ul>
        <p>
          But twelve individual residuals are hard to optimise. We need to squash them down to a
          single number that tells us how wrong a given line is overall. That single number — and
          why we compute it the way we do — is what&rsquo;s next.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>What to remember</>}>
          The <strong>residual</strong> eᵢ = yᵢ − ŷᵢ is the signed vertical distance from a
            data point to the model&rsquo;s prediction. Positive means under-predicted, negative
            means over-predicted. The sum of all residuals on the best-fit line is exactly zero —
            which is why we can&rsquo;t use the sum to judge how good a line is.
        </Callout>

        <Quiz
          questions={[
            {
              q: <>A data point sits at y = 30 and your line predicts ŷ = 34 there. The residual is:</>,
              options: ["+4 — the model was 4 too high", "−4 — actual minus predicted", "4 — residuals are always positive", "0.88 — the ratio of actual to predicted"],
              answer: 1,
              explain: <>The residual is e = y − ŷ = 30 − 34 = −4: the <em>signed</em> vertical gap, and negative means the model predicted too high.</>,
            },
            {
              q: <>On the OLS best-fit line, the residuals sum to exactly zero. Why can&rsquo;t we use &ldquo;sum of residuals&rdquo; to judge how good a line is?</>,
              options: ["Because it's too slow to compute", "Because positives and negatives cancel — a terrible line can also sum to zero", "Because residuals are unitless", "We can — that's exactly what OLS minimizes"],
              answer: 1,
              explain: <>A line that misses wildly high on half the points and wildly low on the other half sums to zero too. That cancellation is the whole motivation for squaring, which is where the next chapter starts.</>,
            },
            {
              q: <>What&rsquo;s the &ldquo;model&rdquo; that linear regression learns?</>,
              options: ["The training dataset itself", "A line — a slope and intercept chosen from the data", "The residuals", "The loss function"],
              answer: 1,
              explain: <>The model is the parameterised form (ŷ = wx + b) with specific values of w and b learned from data. The loss measures it, the optimiser tunes it — form + loss + optimiser, the pattern behind every model on this site.</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/linear-regression", label: <>← The line of best fit</> }} next={{ href: "/learn/linear-regression/the-cost-function", label: <>Next up · The cost function →</> }} />
      </div>
    </article>
  );
}


