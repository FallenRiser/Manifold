import { LossSurface3D } from "@/components/labs/LossSurface3D";
import { GradientDescentLab } from "@/components/labs/GradientDescentLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The loss surface — Manifold",
  description: "See every possible line as a point on a landscape of error, and watch gradient descent roll downhill to the best one.",
};

export default function LossSurfacePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 10 minutes"
        title={<>The loss surface</>}
        intro={<>
          This is the big one — the idea that powers almost every model you&rsquo;ll ever train.
        Once you see it, gradient descent stops being a mystery and starts being obvious.
        </>}
      />

      <div className="lesson">
        <p>
          So far we&rsquo;ve been nudging a line by hand and reading off its error. But a computer
          can&rsquo;t eyeball the chart. To let it <em>search</em> for the best line, we need to
          change how we picture the problem — from &ldquo;a line on the data&rdquo; to{" "}
          &ldquo;a point on a landscape.&rdquo;
        </p>

        <h2>Every line is a point on a surface</h2>
        <p>
          A line is just two numbers: a slope and an intercept. So picture a map where{" "}
          <em>across</em> is the slope and <em>back</em> is the intercept. Every spot on that map
          is one possible line. Now lift each spot to a <em>height</em> equal to that line&rsquo;s
          error (its MSE). Low spots are good lines; high spots are bad ones. Together they form a
          smooth <strong>bowl</strong> — and the lowest point of the bowl is the best line there is.
        </p>

        <LossSurface3D />

        <p>
          Because we used squared error, this bowl is always a single, smooth valley with one
          bottom (no confusing dips to get stuck in). That&rsquo;s the quiet payoff of the choice we
          made last page — and it&rsquo;s exactly what makes the next idea work.
        </p>

        <h2>Gradient descent: just walk downhill</h2>
        <p>
          Here&rsquo;s the trick. Drop a ball anywhere on the bowl. Which way does it roll? Downhill,
          in the steepest direction. The <strong>gradient</strong> is simply the arrow pointing
          straight <em>uphill</em>, so to go down we step the opposite way. Take a small step,
          check the slope again, step again — and you spiral down to the bottom. That&rsquo;s the
          whole algorithm:
        </p>
        <p>
          <code>new value = old value − (learning rate) × (gradient)</code>
        </p>
        <p>
          Below, the left panel is the bowl seen <em>from above</em> — bright is the valley, deep
          violet is high error. Hit <strong>Run</strong> and watch the ball find its way down. The
          right panel shows the same thing as a line on the data: as the ball descends, the line
          quietly snaps into the perfect fit. They&rsquo;re two views of the <em>same</em> moment.
        </p>

        <PredictPrompt
          prompt={<>Before you run it: what happens to the ball if you push the learning rate above 1.0?</>}
          options={["Converges faster", "Bounces outward and blows up", "Same path, bigger steps"]}
          nudge={<>Locked in. Run the descent at the default rate first, then crank the slider past 1.0 and run it again.</>}
        />
        <LabFrame
          tryThis={<>Run the descent at the default rate, then again at 0.05 and again past 1.0 — watch both the ball and the line on the right.</>}
          insight={<>Two things worth noticing: the path always crosses the contour rings at right angles — that&rsquo;s
            what &ldquo;steepest descent&rdquo; means geometrically — and past α ≈ 1.0 each step overshoots the valley and lands
            higher than it started. Same algorithm, one dial, three completely different fates.</>}
        >
          <GradientDescentLab />
        </LabFrame>

        <h2>The learning rate is everything</h2>
        <p>
          That <strong>learning rate</strong> — how big a step you take — is the single most
          important dial in machine learning. Drag it and re-run:
        </p>
        <p>
          <strong>Too small</strong>, and the ball inches down forever — correct, but painfully
          slow. <strong>Just right</strong>, and it glides smoothly to the bottom in a few steps.
          <strong> Too large</strong>, and it overshoots the valley, bounces to the far wall, and
          flings itself <em>up</em> and out — the error explodes instead of shrinking. Push the
          slider past about <code>1.0</code> and watch it diverge.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>Why this matters everywhere</>}>
          This exact loop — compute the gradient, step downhill, repeat — is how neural networks,
            logistic regression, and most of modern ML are trained. The surfaces get vastly more
            complicated (millions of dimensions, bumpy valleys), but the move never changes. Master
            it here on a simple bowl and you&rsquo;ve met the engine under all of it.
        </Callout>

        <PrevNext prev={{ href: "/learn/linear-regression/why-squared-error", label: <>← Why squared error?</> }} next={{ href: "/learn/linear-regression/what-best-means", label: <>Next up · What best means →</> }} />
      </div>
    </article>
  );
}


