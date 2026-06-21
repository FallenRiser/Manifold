import Link from "next/link";
import { LineOfBestFitLab } from "@/components/labs/LineOfBestFitLab";

export default function LineOfBestFitPage() {
  return (
    <article>
      {/* page header */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-fundamentals)")}>Beginner</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The line of best fit
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        You already do this in your head all the time. Today we&rsquo;ll just slow it down and
        watch it happen — and by the end, you&rsquo;ll understand exactly what &ldquo;best&rdquo; means.
      </p>

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

        <LineOfBestFitLab />

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
          engine under almost every model you&rsquo;ll ever train. That&rsquo;s where we go next.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            Why this matters later
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Every supervised model is really three choices: a <strong>shape</strong> to fit (here,
            a line), a way to measure <strong>wrongness</strong> (here, MSE), and a method to{" "}
            <strong>minimise</strong> it (coming up next). Once you see that pattern, half of
            machine learning stops looking like a list of random algorithms.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/what-a-model-really-is" style={{ fontSize: 14, color: "var(--brand)", textDecoration: "none" }}>
            ← What a model really is
          </Link>
          <Link href="/learn/linear-regression/what-is-error" style={{ fontSize: 14, color: "var(--brand)", textDecoration: "none" }}>
            Next up · What is error? →
          </Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    background: `color-mix(in srgb, ${color} 13%, var(--surface))`,
    color,
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 999,
  };
}

const callout: React.CSSProperties = {
  background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))",
  borderRadius: 12,
  padding: "13px 15px",
  margin: "1.8rem 0 0",
};
