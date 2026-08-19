import { LineOfBestFitLab } from "@/components/labs/LineOfBestFitLab";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export default function LineOfBestFitPage() {
  const fromScratch = `import numpy as np

# House sizes (sq ft ÷ 1000) and prices ($k)
X = np.array([1.4, 1.7, 2.0, 2.3, 2.5, 2.8, 3.1, 3.4, 3.7, 4.0, 4.2, 4.5])
y = np.array([245, 312, 279, 308, 401, 390, 437, 421, 490, 518, 572, 601])

# OLS closed-form — derive slope and intercept directly
x_bar, y_bar = X.mean(), y.mean()
slope     = np.sum((X - x_bar) * (y - y_bar)) / np.sum((X - x_bar) ** 2)
intercept = y_bar - slope * x_bar

print(f"slope:     {slope:.2f}  (each +1k sqft → +\${slope:.0f}k)")
print(f"intercept: {intercept:.2f}")

# Predict and score
y_hat  = slope * X + intercept
mse    = np.mean((y - y_hat) ** 2)
ss_tot = np.sum((y - y_bar) ** 2)
r2     = 1 - np.sum((y - y_hat) ** 2) / ss_tot
print(f"MSE: {mse:.1f}   R²: {r2:.3f}")`;

  const withLibrary = `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

X = np.array([1.4,1.7,2.0,2.3,2.5,2.8,3.1,3.4,3.7,4.0,4.2,4.5]).reshape(-1, 1)
y = np.array([245,312,279,308,401,390,437,421,490,518,572,601])

model = LinearRegression().fit(X, y)

print(f"slope:     {model.coef_[0]:.2f}")
print(f"intercept: {model.intercept_:.2f}")

y_hat = model.predict(X)
print(f"MSE: {mean_squared_error(y, y_hat):.1f}")
print(f"R²:  {r2_score(y, y_hat):.3f}")`;

  return (

    <article>
      {/* page header */}
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>The line of best fit</>}
        intro={<>
          You already do this in your head all the time. Today we&rsquo;ll just slow it down and
        watch it happen — and by the end, you&rsquo;ll understand exactly what &ldquo;best&rdquo; means.
        </>}
      />

      <div className="lesson">
        <p>
          Imagine you&rsquo;re guessing the price of a house. Someone tells you it&rsquo;s a little
          bigger than the last one you saw, so you nudge your guess up a bit. Bigger house,
          higher price — you&rsquo;re drawing a line in your mind, even if you&rsquo;ve never
          written down a single equation.
        </p>
        <p>
          That&rsquo;s the whole idea behind <strong>linear regression</strong>: find the straight
          line that best follows the trend in your data, so that when a new house comes along,
          you can read its price right off the line. Simple — but it hides the single most
          important idea in all of machine learning, and we&rsquo;ll meet it in a minute.
        </p>

        <ModelAnatomy
          form={<>A straight line: <code>ŷ = m·x + b</code></>}
          loss={<>Mean squared error — the average of the squared misses</>}
          optimiser={<>Gradient descent (or the normal equation, exactly)</>}
        />

        <h2>First, what is a &ldquo;model&rdquo;?</h2>
        <p>
          A model is just a <strong>rule that turns an input into a prediction</strong>. For a
          straight line, that rule is <code>price = m × size + b</code> — where <code>m</code> is
          the slope (how steep the line is) and <code>b</code> is where it starts. Pick values
          for <code>m</code> and <code>b</code>, and you&rsquo;ve got a model. Pick <em>good</em>{" "}
          values, and you&rsquo;ve got a good one.
        </p>
        <p>
          So how do we know which line is good? Don&rsquo;t take my word for it — try it yourself.
          Grab either end of the line below and tilt it around until it feels right.
        </p>

        <PredictPrompt
          prompt={<>When you&rsquo;ve tuned the line as well as it can possibly be — how many data points will it actually pass through?</>}
          options={["Most of them", "All of them", "Often none at all"]}
          nudge={<>Locked in. Now drag the line until the error is as low as you can get it — then count.</>}
        />
        <LabFrame
          tryThis={<>Grab either end of the line, tilt it until the error readout is as small as you can make it, then hit snap-to-OLS and see how close you got.</>}
          insight={<>Notice where the best line ends up: through the <em>middle</em> of the cloud, often touching no
            point at all. It isn&rsquo;t trying to hit points — it&rsquo;s balancing the misses so the squared errors, and the
            residuals above and below, cancel as a whole.</>}
        >
          <LineOfBestFitLab />
        </LabFrame>

        <h2>Those little red lines are the whole game</h2>
        <p>
          Each red line is a <strong>residual</strong> — the gap between what really happened (a
          dot) and what your line predicted (the point on the line directly above or below it).
          A residual is just a fancy word for &ldquo;how wrong we were on this one example.&rdquo;
        </p>
        <p>
          A good line makes those gaps small <em>overall</em>. Notice you can&rsquo;t make them all
          zero — tilt to nail the points on the left and the ones on the right drift away. Fitting
          a line is always a compromise across <em>all</em> the points at once.
        </p>

        <h2>Turning &ldquo;how wrong&rdquo; into a single number</h2>
        <p>
          To compare two lines, we need one number that says how wrong a line is overall. The
          natural move is to add up all the residuals — but positives and negatives would cancel
          out, making a terrible line look perfect. So instead we <strong>square</strong> each
          residual first (squares are always positive) and take the average. That&rsquo;s the{" "}
          <strong>mean squared error</strong>, or MSE — the number shrinking and growing as you
          drag.
        </p>
        <p>
          Tick <em>show squared errors</em> in the lab and you&rsquo;ll literally see it: each
          residual becomes a square, and the MSE is their average area. Squaring has a useful side
          effect — a point that&rsquo;s twice as far off contributes <em>four</em> times the error,
          so the line works hard to avoid big misses. (That&rsquo;s also why a single weird outlier
          can drag the whole line toward it — something we&rsquo;ll come back to.)
        </p>
        <p>
          The <strong>R²</strong> next to it is a friendlier score: it runs from 0 to 1 and tells
          you what fraction of the ups and downs in price your line manages to explain. 1.0 is a
          perfect fit; 0 means your line is no better than just guessing the average price every
          time. Watch it climb toward 1 as your fit improves.
        </p>

        <h2>So what is the &ldquo;best&rdquo; line?</h2>
        <p>
          It&rsquo;s simply the one line — out of the infinitely many you could draw — with the{" "}
          <strong>smallest possible MSE</strong>. Hit <em>snap to best fit</em> and watch the line
          glide to that exact spot. Try as you might, you won&rsquo;t beat it by hand.
        </p>
        <p>
          Which raises the real question: how would a computer <em>find</em> that best line, when
          it can&rsquo;t eyeball the chart like you just did? That search — rolling downhill toward
          the smallest error — is called <strong>gradient descent</strong>, and it&rsquo;s the
          engine under almost every model you&rsquo;ll ever train. Before we can build it, though, we
          need to make &ldquo;error&rdquo; precise and map the landscape it descends — which is exactly
          where the next few pages go.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>Why this matters later</>}>
          Every supervised model is really three choices: a <strong>shape</strong> to fit (here,
            a line), a way to measure <strong>wrongness</strong> (here, MSE), and a method to{" "}
            <strong>minimise</strong> it (coming up next). Once you see that pattern, half of
            machine learning stops looking like a list of random algorithms.
        </Callout>

        <h2>The code</h2>
        <p>
          Here&rsquo;s what finding the line of best fit looks like in Python —
          first built from scratch with NumPy, then in a single call with
          scikit-learn. Both produce the same slope and intercept.
        </p>

        <CodeBlock setup={REGRESSION_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />


        <PrevNext prev={{ href: "/learn/linear-regression/what-a-model-really-is", label: <>← What a model really is</> }} next={{ href: "/learn/linear-regression/what-is-error", label: <>Next up · What is error? →</> }} />
      </div>
    </article>
  );
}




