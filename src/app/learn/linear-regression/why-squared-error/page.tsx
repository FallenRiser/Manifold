import { PenaltyCurves } from "@/components/labs/PenaltyCurves";
import { OutlierLab } from "@/components/labs/OutlierLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Why squared error? — Manifold",
  description: "Why linear regression squares its errors instead of just taking the absolute value — and the trade-off that choice quietly makes.",
};

export default function WhySquaredErrorPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Why squared error?</>}
        intro={<>
          We&rsquo;ve been squaring our mistakes without really asking why. It turns out that one
        small choice quietly shapes how your model behaves — for better <em>and</em> for worse.
        </>}
      />

      <div className="lesson">
        <p>
          Last time, we measured how wrong a line was by squaring each gap and averaging — the
          mean squared error. But squaring is a <em>choice</em>. We could just as easily take the
          plain distance, ignoring the sign — the <strong>absolute error</strong>. So why does
          almost everyone reach for squares? Three good reasons, and one real cost.
        </p>

        <h2>Reason 1 — it makes the sign disappear</h2>
        <p>
          A residual can be positive (we guessed too low) or negative (too high). If we just added
          them up, a line that&rsquo;s wildly wrong in both directions could look perfect as the
          errors cancel out. Squaring fixes that instantly: a square is never negative, so mistakes
          can only ever <em>add up</em>. (Absolute value does this too — hold that thought.)
        </p>

        <h2>Reason 2 — big mistakes hurt more</h2>
        <p>
          Here&rsquo;s the interesting one. With absolute error, being off by 2 is exactly twice as
          bad as being off by 1. But with squared error, being off by 2 is <em>four</em> times as
          bad. Slide the error size below and watch the two penalties pull apart.
        </p>

        <PenaltyCurves />

        <p>
          Past an error of 1, the squared penalty rockets away from the absolute one. That means a
          squared-error line will go out of its way to avoid any single large miss — it would
          rather be a little wrong on many points than very wrong on one. Often that&rsquo;s exactly
          the behaviour you want.
        </p>

        <h2>Reason 3 — it has one clean answer</h2>
        <p>
          Squared error is smooth — a gentle bowl with a single lowest point (you saw that bowl as
          the loss surface). That smoothness means there&rsquo;s a tidy formula for the best line,
          <em>and</em> it&rsquo;s easy for an algorithm to roll downhill to the bottom. Absolute
          error has a sharp kink at zero that makes both of those harder. This is the reason squared
          error pairs so naturally with <strong>gradient descent</strong>, coming up next.
        </p>

        <PredictPrompt
          prompt={<>You drag one point far away from the trend. Which fitted line moves more to meet it — the squared-error one or the absolute-error one?</>}
          options={["The squared-error line", "The absolute-error line", "Both move equally"]}
          nudge={<>Locked in. Make the orange point an outlier in the lab below and watch both lines react.</>}
        />

        <h2>The cost — squared error is fragile to outliers</h2>
        <p>
          That same eagerness to crush big errors is also squared error&rsquo;s weakness. Because
          one far-off point contributes such an enormous penalty, the line will <em>chase</em> it,
          twisting away from everything else just to reduce that one giant square. Drag the orange
          point below into an outlier and watch it happen.
        </p>

        <LabFrame
          tryThis={<>Drag the orange point far above the trend, then bring it slowly back. Watch both fitted lines the whole way.</>}
          insight={<>The solid squared-error line lurched toward the outlier while the dashed absolute-error line barely
            flinched — one squared term outweighed every well-behaved point. That&rsquo;s the trade in one picture: MSE&rsquo;s
            urgency about big misses is exactly what makes it fragile to bad data.</>}
        >
          <OutlierLab />
        </LabFrame>

        <p>
          The squared-error line (solid) lurches toward the outlier; the absolute-error line
          (dashed) shrugs it off. That&rsquo;s the trade-off in one picture: <strong>squared error
          is precise but sensitive; absolute error is robust but blunt.</strong> An outlier is just
          a point far from the rest — sometimes a data-entry mistake, sometimes a genuine rare event.
        </p>

        <h2>So which should you use?</h2>
        <p>
          Reach for <strong>squared error (MSE)</strong> by default — it&rsquo;s smooth, has a clean
          solution, and big errors usually <em>should</em> be punished. Reach for{" "}
          <strong>absolute error (MAE)</strong> when your data has outliers you don&rsquo;t want
          dominating the fit — predicting house prices where a few mansions would otherwise warp
          everything, or any sensor data prone to occasional wild readings.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>In an interview</>}>
          &ldquo;Why MSE over MAE?&rdquo; → <em>MSE is differentiable everywhere and convex, so it
            has a closed-form solution and plays nicely with gradient descent; it also penalises
            large errors more heavily. The catch is sensitivity to outliers — when that matters, MAE
            (or a robust loss like Huber, which blends the two) is the better choice.</em>
        </Callout>

        <PrevNext prev={{ href: "/learn/linear-regression/the-cost-function", label: <>← The cost function</> }} next={{ href: "/learn/linear-regression/the-loss-surface", label: <>Next up · The loss surface →</> }} />
      </div>
    </article>
  );
}


