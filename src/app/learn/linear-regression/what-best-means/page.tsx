import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "What 'best' means — Manifold",
  description: "We've been calling it the best fit line. It's time to say exactly what best means — and why the loss surface makes the answer obvious.",
};

export default function WhatBestMeansPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 5 minutes"
        title={<>What &ldquo;best&rdquo; means</>}
        intro={<>
          We&rsquo;ve been saying &ldquo;the best line&rdquo; for a few pages. It&rsquo;s time to
        say exactly what best means — and why the loss surface makes the answer obvious.
        </>}
      />

      <div className="lesson">
        <p>
          You&rsquo;ve seen the loss surface: a smooth bowl where every point is a line (a
          slope-intercept pair), and height represents how wrong that line is. Low is good; high
          is bad. &ldquo;Best&rdquo; has a precise meaning in this picture: it&rsquo;s the
          point at the very bottom.
        </p>

        <h2>The formal definition</h2>
        <p>
          We want the parameters that minimise the cost function. In notation:
        </p>
        <div style={{ textAlign: "center", margin: "1rem 0", padding: "16px 20px", background: "var(--surface-2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <code style={{ fontSize: 18, color: "var(--ink)", letterSpacing: "0.01em" }}>
            (m*, b*) = argmin<sub style={{ fontSize: 12 }}>m,b</sub> MSE(m, b)
          </code>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
            the slope and intercept that give the smallest possible mean squared error
          </p>
        </div>
        <p>
          The asterisk (*) on m* and b* is conventional notation for &ldquo;the optimal
          value.&rdquo; <code>argmin</code> means &ldquo;the argument (input value) that minimises
          the function&rdquo; — in other words, not the smallest MSE itself, but the{" "}
          <em>parameters that produce</em> the smallest MSE.
        </p>

        <h2>The bowl has exactly one bottom</h2>
        <p>
          Because we used squared error and a linear model, the loss surface is a <em>convex</em>{" "}
          bowl — it has exactly one minimum, not several competing valleys. This is a mathematically
          special and practically important property. It means:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.9, color: "var(--muted)", fontSize: 15 }}>
          <li>There&rsquo;s no ambiguity. One answer, not many.</li>
          <li>Any algorithm that keeps moving downhill will eventually reach the bottom.</li>
          <li>You can&rsquo;t get stuck in a false minimum — there isn&rsquo;t one.</li>
        </ul>

        {/* parabola illustration */}
        <svg viewBox="0 0 360 160" style={{ width: "100%", height: "auto", display: "block", margin: "1.2rem 0", borderRadius: 12, background: "var(--canvas)", border: "1px solid var(--border-strong)" }}>
          {/* parabola path */}
          <path d="M 30 140 Q 180 10 330 140" fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" />
          {/* minimum dot */}
          <circle cx={180} cy={10} r={0} fill="none" />
          {(() => {
            // compute minimum y on quadratic: at x=180, y≈10
            // add the green dot and label
            return (
              <g>
                <circle cx={180} cy={52} r={6} fill="var(--good)" stroke="var(--surface)" strokeWidth={1.5} />
                <line x1={180} y1={10} x2={180} y2={52} stroke="var(--good)" strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.5} />
                <text x={200} y={56} fontSize={11} fill="var(--good)" dominantBaseline="middle">(m*, b*)</text>
                <text x={200} y={70} fontSize={10} fill="var(--muted)" dominantBaseline="middle">minimum MSE</text>
              </g>
            );
          })()}
          {/* random ball on the bowl */}
          <circle cx={80} cy={116} r={5.5} fill="var(--brand)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={60} y={134} fontSize={10} fill="var(--brand)" textAnchor="middle">some line</text>
          <text x={60} y={145} fontSize={10} fill="var(--muted)" textAnchor="middle">high MSE</text>
          <text x={180} y={152} fontSize={10.5} fill="var(--faint)" textAnchor="middle">slope → </text>
          <text x={18} y={90} fontSize={10} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 18 90)">MSE →</text>
        </svg>

        <p>
          The ball on the left is any line you pick at random — it sits high on the bowl. Training
          is the process of sliding it to the green dot at the bottom. Different algorithms take
          different paths to get there, but they all end up in the same place.
        </p>

        <h2>Two ways to find the bottom</h2>
        <p>
          You&rsquo;ve already met one: <strong>gradient descent</strong> — roll downhill iteratively,
          taking small steps, until you stop moving. It generalises to any model, any loss function,
          any number of parameters. That&rsquo;s why it powers neural networks and almost everything else.
        </p>
        <p>
          But for this specific model (linear, squared error), there&rsquo;s a shortcut: you can
          jump straight to the bottom in one step by solving a set of equations directly. That&rsquo;s
          the <strong>normal equation</strong>, and we&rsquo;ll see it in Ch4. The contrast between
          the two approaches — iterative vs direct — is one of the most instructive comparisons in
          all of machine learning.
        </p>

        <h2>A note on what &ldquo;best&rdquo; doesn&rsquo;t mean</h2>
        <p>
          The best-fit line minimises MSE on the <em>training data</em>. That&rsquo;s not the same
          as the best possible predictions on data you haven&rsquo;t seen yet. A line that fits
          every training point perfectly might do worse on new data than one with a bit more error —
          that tension is <strong>overfitting</strong>, and it&rsquo;s one of the central problems
          in machine learning. We&rsquo;ll meet it properly in Ch8 (Evaluation).
        </p>

        <Callout color="var(--c-fundamentals)" title={<>The synthesis</>}>
          Training a linear regression model means finding (m*, b*) = argmin MSE(m, b). Because
            the squared-error loss surface is a convex bowl, there&rsquo;s exactly one answer, and
            any optimiser that moves downhill will find it. The rest of this track is about
            understanding that optimiser, what the answer means, and what to do when things go wrong.
        </Callout>

        <Quiz
          questions={[
            {
              q: <>Why square the errors instead of just adding them up?</>,
              options: ["Squaring makes the math look more impressive", "Raw errors cancel: +5 and −5 sum to zero, hiding both misses", "Squared errors are easier to explain to stakeholders", "Because errors are always negative"],
              answer: 1,
              explain: <>Positive and negative misses cancel in a raw sum. Squaring makes every miss count — and it penalises big misses disproportionately (an error of 2 costs 4× an error of 1).</>,
            },
            {
              q: <>One point on the loss surface represents:</>,
              options: ["One data point from the training set", "One choice of (slope, intercept) and the total loss that line earns", "One residual", "One step of gradient descent"],
              answer: 1,
              explain: <>The loss surface lives in <em>parameter</em> space, not data space: every location is a candidate line, its height is that line&rsquo;s MSE over the whole dataset. &ldquo;Best&rdquo; = the lowest point of the bowl.</>,
            },
            {
              q: <>Model A makes one miss of 2; model B makes two misses of 1 each. Under MSE, which is punished more?</>,
              options: ["A — 2² = 4 versus 1² + 1² = 2 for B", "B — two misses always beat one", "They tie: total miss is 2 in both", "MSE can't compare them"],
              answer: 0,
              explain: <>Squaring makes MSE care about <em>how</em> the total error is distributed: one big miss hurts more than several small ones. That&rsquo;s the property the &ldquo;why squared error&rdquo; page dissected.</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/linear-regression/the-loss-surface", label: <>← The loss surface</> }} next={{ href: "/learn/linear-regression/roll-downhill", label: <>Next up · Roll downhill →</> }} />
      </div>
    </article>
  );
}


