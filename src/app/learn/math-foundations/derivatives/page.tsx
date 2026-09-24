import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { GradientTangentLab } from "@/components/labs/GradientTangentLab";
import { Worked } from "@/components/Worked";
import { Practice } from "@/components/Practice";
import { CALCULUS_SETUP } from "@/lib/runtimeSetup";
import { DERIVATIVE_PROBLEMS } from "@/content/math/derivatives";

export const metadata = {
  title: "Derivatives: the rate of change — Manifold",
  description:
    "The derivative is the slope of a function at a point, and it is the only signal a learning algorithm ever follows. This page builds it from the difference quotient, watches the limit converge numerically, shows what the sign and a zero actually mean (and what a zero does not mean), and takes it to the one place it is going: setting a derivative to zero to find a best fit. Four worked examples in full, then thirteen problems with complete solutions, in three bands.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DerivativesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Calculus & optimization", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 35 minutes, and the practice is most of it"
        title={<>Derivatives: the rate of change</>}
        intro={<>Training a model means improving it a little at a time, and to know <em>which way</em> is better you
          need the slope of the error — how it changes when you nudge one parameter. That slope is the derivative. It
          is the compass every learning algorithm on this site steers by, it is the reason &ldquo;set the derivative to
          zero&rdquo; finds a line of best fit, and it is worth being able to compute rather than merely recognise.</>}
        titleSize={40}
        introSize={17}
      />

      <div className="lesson">
        <h2>Rise over run, with the run shrinking</h2>
        <p>
          Start with something you can already do. Between two points on a curve, the average rate of change is the
          rise divided by the run — the slope of the straight line joining them, called a <strong>secant</strong>. If
          one point is at <M>x</M> and the other is <M>h</M> further along, that is
        </p>
        <MathBlock>{String.raw`\frac{f(x+h) - f(x)}{h}.`}</MathBlock>
        <p>
          This is an honest answer to &ldquo;how fast is <M>f</M> changing?&rdquo;, but it is an answer about an{" "}
          <em>interval</em>, not about a point. Over a wide interval it can be badly wrong about what is happening at
          either end. The fix is the obvious one: shrink the run. Push <M>h</M> toward zero and ask what the quotient
          settles on. That limit, when it exists, is the <strong>derivative</strong>:
        </p>
        <MathBlock>{String.raw`f'(x) \;=\; \lim_{h\to 0}\frac{f(x+h)-f(x)}{h}.`}</MathBlock>
        <p>
          The care in that sentence is not decoration. You cannot simply put <M>{String.raw`h = 0`}</M> — the
          expression becomes <M>{String.raw`0/0`}</M>, which is not a number. The whole craft of computing a
          derivative from the definition is rearranging the quotient until the <M>h</M> in the denominator
          cancels against an <M>h</M> in the numerator, and only <em>then</em> letting <M>h</M> go. Every worked
          example below does that one thing.
        </p>

        <h2>Watch it converge</h2>
        <p>
          A limit is a claim about what happens eventually, which is exactly the kind of claim worth checking
          numerically before trusting. Take <M>{String.raw`f(x) = 3x^2 - 5x + 2`}</M> at{" "}
          <M>{String.raw`x = 2`}</M> — the first worked example below — and shrink <M>h</M> by powers of ten. Beside
          it, run the same quotient on <M>{String.raw`|x-2|`}</M>, which has a corner at exactly that point.
        </p>

        <CodeBlock setup={CALCULUS_SETUP} fromScratch={codeLimit} />
        <CodeOutput>{outLimit}</CodeOutput>

        <p>
          The left column closes in on <strong>7</strong> from above and from below, and it does so at a steady rate —
          halve <M>h</M> and the error halves. That is the derivative existing, in front of you. The right column does
          nothing of the kind: it is <M>{String.raw`+1`}</M> from the right and <M>{String.raw`-1`}</M> from the left,
          forever, no matter how small <M>h</M> gets. There is no single number for the quotient to settle on, so{" "}
          <M>{String.raw`|x-2|`}</M> has no derivative at 2. Hold on to that column; it comes back three times on this
          page and it is the reason the{" "}
          <Link href="/learn/math-foundations/subgradients" style={link}>subgradient</Link> page exists at all.
        </p>

        <LabFrame
          accent={AMBER}
          tryThis={<>Drag the ball along the curve and read the slope of the tangent. Where is the slope zero? Where is
            it steepest? Then use &ldquo;step downhill&rdquo; to walk toward the bottom.</>}
          insight={<>The tangent&rsquo;s slope <em>is</em> the derivative — steep where the curve turns hard, zero at
            the valley floor. Stepping in the downhill (negative-slope) direction is one-dimensional gradient descent:
            the entire idea of training, in miniature.</>}
        >
          <GradientTangentLab />
        </LabFrame>

        <h2>What the number tells you</h2>
        <p>
          A derivative is a signed quantity and both halves of it carry information.{" "}
          <strong>Positive</strong> means the function is climbing as <M>x</M> increases;{" "}
          <strong>negative</strong> means it is falling; and the <em>size</em> says how steeply. That is already
          enough to train a model: if the loss has positive slope in a parameter, the parameter is too big, so move it
          down. Take a step against the slope, repeat. That is gradient descent, and nothing else is going on in it.
        </p>
        <p>
          <strong>Zero</strong> is the interesting case, and it is where most of the mistakes live. A zero derivative
          means the function is momentarily flat — the tangent is horizontal. That happens at the bottom of a valley,
          which is what you usually want, and it also happens at the top of a hill, and on a plateau that is neither.
          A point where <M>{String.raw`f'(x) = 0`}</M> is called a <strong>stationary point</strong>, and stationary
          is all it promises.
        </p>
        <Callout color={AMBER} title="Zero slope is a shortlist, not an answer">
          <p>
            &ldquo;Set the derivative to zero and solve&rdquo; is the single most-used move in this subject, and what
            it actually produces is a <em>shortlist of candidates</em>. Every interior minimum of a differentiable
            function is on that list. Not everything on the list is a minimum — <M>{String.raw`f(x)=x^3`}</M> has{" "}
            <M>{String.raw`f'(0)=0`}</M> and 0 is neither a peak nor a valley — and if the function has a corner, or
            you are on the boundary of the region you are allowed to search, the minimum may not be on the list at
            all. Problem 12 in the practice set is a minimum that the equation <M>{String.raw`f'(x)=0`}</M> cannot
            find, because at the minimum the derivative does not exist.
          </p>
          <p style={{ marginBottom: 0 }}>
            So the honest recipe has three steps: find the stationary points, add the corners and the boundary, and
            then decide which of the candidates is actually lowest. For the convex losses most of this site uses,
            steps two and three are free —{" "}
            <Link href="/learn/math-foundations/convexity" style={link}>convexity</Link> is precisely the property
            that makes a stationary point automatically the global minimum, which is why it is worth a page of its
            own.
          </p>
        </Callout>

        <h2>The rules, and why they are the rules</h2>
        <p>
          Nobody computes derivatives from the definition in practice; they use half a dozen rules, each of which was
          proved once from the definition and then never again. The four worth knowing cold:
        </p>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Rule</th><th style={th}>Statement</th><th style={th}>Where you meet it</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map((r, i) => (
                <tr key={r[0]} style={{ borderBottom: i < RULES.length - 1 ? "1px solid var(--border)" : undefined }}>
                  <td style={td}>{r[0]}</td>
                  <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}><M>{r[1]}</M></td>
                  <td style={{ ...td, color: "var(--muted)" }}>{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Two of those are worth a warning. The <strong>product rule is not</strong>{" "}
          <M>{String.raw`u'v'`}</M> — the sum rule distributes over its operation and the product rule does not, and
          assuming otherwise is the most common error in this chapter. And the <strong>power rule</strong> is not a
          separate fact about each exponent; it is one statement proved once for all <M>n</M>, which the derivation at
          the bottom of this page does from the definition.
        </p>
        <p>
          <M>{String.raw`e^x`}</M> deserves its line. It is the function that is its own derivative, which is why it
          survives every differentiation you do to it, and that is the reason it turns up in the{" "}
          <Link href="/learn/logistic-regression/the-sigmoid" style={link}>sigmoid</Link>, in the Gaussian, and in
          every place on this site where an exponential meets a gradient.
        </p>

        <h2>Four worked examples</h2>
        <p>
          Each of these is done in full, and each one has the same shape: what the problem is asking, which technique
          to reach for <em>and why that one</em>, the steps, and then an independent way to believe the answer. The
          plan and the check are the parts worth reading twice. Try each one before opening it — thirty seconds of
          your own attempt changes what you get from the solution.
        </p>

        <Worked
          n={1}
          verify="6*x - 5, 7"
          title="Straight from the definition"
          technique="expand, cancel the h, and only then take the limit"
          given={<>Use the limit definition to find <M>{String.raw`f'(x)`}</M> for{" "}
            <M>{String.raw`f(x) = 3x^2 - 5x + 2`}</M>, and then the slope at <M>{String.raw`x = 2`}</M>.</>}
          read={<>&ldquo;Using the definition&rdquo; is an instruction, not a suggestion — the power rule would give
            the answer in four seconds and would not answer the question that was asked. The point of the exercise is
            the cancellation.</>}
          plan={<>Write the difference quotient, expand <M>{String.raw`f(x+h)`}</M> fully, and subtract{" "}
            <M>{String.raw`f(x)`}</M>. Everything that survives the subtraction must contain a factor of <M>h</M> —
            if it does not, an algebra slip has happened — so the division by <M>h</M> is exact and the limit becomes
            a substitution. <em>The alternative</em>, applying the power rule term by term, gives{" "}
            <M>{String.raw`6x - 5`}</M> immediately and is what you would do in practice; keep it as the check rather
            than the method.</>}
          steps={[
            {
              math: String.raw`\begin{aligned} f(x+h) &= 3(x+h)^2 - 5(x+h) + 2 \ &= 3x^2 + 6xh + 3h^2 - 5x - 5h + 2\end{aligned}`,
              why: <>Expand completely, including the <M>{String.raw`h^2`}</M> term. Dropping it as
                &ldquo;small&rdquo; is exactly the sort of shortcut that produces a wrong answer with a right-looking
                shape.</>,
            },
            {
              math: String.raw`f(x+h) - f(x) = \big(6xh + 3h^2 - 5h\big)`,
              why: <>Every term without an <M>h</M> cancels against <M>{String.raw`f(x)`}</M>. That is the structural
                fact: what is left <em>always</em> has <M>h</M> as a common factor.</>,
            },
            {
              math: String.raw`\frac{f(x+h)-f(x)}{h} = \frac{h\,(6x + 3h - 5)}{h} = 6x + 3h - 5`,
              why: <>The cancellation is legal because <M>{String.raw`h \neq 0`}</M> — a limit as{" "}
                <M>{String.raw`h \to 0`}</M> never evaluates anything <em>at</em> zero, it only looks at what happens
                nearby.</>,
            },
            {
              math: String.raw`f'(x) = \lim_{h\to 0}\,(6x + 3h - 5) = 6x - 5`,
              why: <>Now that nothing is being divided by <M>h</M>, the limit is a substitution. The{" "}
                <M>{String.raw`3h`}</M> term vanishes and <M>{String.raw`6x-5`}</M> remains.</>,
            },
          ]}
          answer={<><M>{String.raw`f'(x) = 6x - 5`}</M>, and <M>{String.raw`f'(2) = 12 - 5 = 7`}</M>.</>}
          check={<>The numeric table at the top of this page is the check: at <M>{String.raw`x=2`}</M> the quotient
            reads 7.003 at <M>{String.raw`h = 10^{-3}`}</M> and 6.997 at <M>{String.raw`h = -10^{-3}`}</M>, closing on
            7 from both sides. Second check, free: <M>{String.raw`6x-5`}</M> is zero at{" "}
            <M>{String.raw`x = 5/6`}</M>, and the vertex of <M>{String.raw`3x^2-5x+2`}</M> is at{" "}
            <M>{String.raw`-b/2a = 5/6`}</M>. Two routes, one number.</>}
          trap={<>Substituting <M>{String.raw`h=0`}</M> before cancelling, and concluding that the derivative is{" "}
            <M>{String.raw`0/0`}</M> or that it does not exist. The quotient is undefined <em>at</em>{" "}
            <M>{String.raw`h=0`}</M> for every function that ever had a derivative; that is why the definition is a
            limit and not an evaluation.</>}
        />

        <Worked
          n={2}
          verify="3*x**2 - 3, 1, -1, -2, 2"
          title="What a zero derivative is actually telling you"
          technique="solve f'=0 for a shortlist, then classify each candidate — never assume"
          given={<>Find every stationary point of <M>{String.raw`f(x) = x^3 - 3x`}</M> and classify each one as a
            local minimum, a local maximum, or neither.</>}
          read={<>Two questions, and the second is the real one. Finding where <M>{String.raw`f'=0`}</M> is
            mechanical; deciding <em>what happens there</em> is the part that has to be argued.</>}
          plan={<>Differentiate, solve for zero, and then classify with the sign of{" "}
            <M>{String.raw`f''`}</M> — positive means the slope is increasing through the point, so the curve is
            bending upward and you are in a valley. <em>The alternative</em> is a sign table for{" "}
            <M>{String.raw`f'`}</M> either side of each point, which is slower but never fails, and is what you fall
            back on when <M>{String.raw`f''`}</M> is also zero.</>}
          steps={[
            {
              math: String.raw`f'(x) = 3x^2 - 3 = 3(x-1)(x+1)`,
              why: <>Factorise rather than reaching for the quadratic formula. The factored form hands you the roots
                and the sign pattern at once.</>,
            },
            {
              math: String.raw`f'(x) = 0 \iff x = 1 \ \text{ or } \ x = -1`,
              why: <>The shortlist. Nothing has yet been decided about either point.</>,
            },
            {
              math: String.raw`f''(x) = 6x \;\Rightarrow\; f''(1) = 6 > 0, \quad f''(-1) = -6 < 0`,
              why: <>Positive curvature at <M>{String.raw`x=1`}</M> means a local minimum; negative at{" "}
                <M>{String.raw`x=-1`}</M> means a local maximum.</>,
            },
            {
              math: String.raw`f(1) = -2, \qquad f(-1) = 2`,
              why: <>The values. Note the local maximum sits <em>above</em> the local minimum but neither is global —{" "}
                <M>{String.raw`x^3`}</M> runs off to <M>{String.raw`\pm\infty`}</M>, so this function has no smallest
                or largest value at all.</>,
            },
          ]}
          answer={<>A local minimum at <M>{String.raw`x = 1`}</M> with <M>{String.raw`f(1) = -2`}</M>, and a local
            maximum at <M>{String.raw`x = -1`}</M> with <M>{String.raw`f(-1) = 2`}</M>. Neither is a global
            extremum.</>}
          check={<>Evaluate slightly outside each point. <M>{String.raw`f(1.1) = -1.969 > -2`}</M> and{" "}
            <M>{String.raw`f(0.9) = -1.971 > -2`}</M>, so <M>{String.raw`x=1`}</M> really is a low point of its
            neighbourhood; <M>{String.raw`f(-1.1) = 1.969 < 2`}</M> and <M>{String.raw`f(-0.9) = 1.971 < 2`}</M>{" "}
            confirm the other. And <M>{String.raw`f(3) = 18`}</M>, which is far above the &ldquo;maximum&rdquo; — the
            word <em>local</em> is doing real work.</>}
          trap={<>Reporting <M>{String.raw`x=1`}</M> as &ldquo;the minimum&rdquo;. It is a minimum of its
            neighbourhood only. And the deeper version of the same trap: assuming a stationary point must be one or
            the other. Run this method on <M>{String.raw`g(x) = x^3`}</M> and you get{" "}
            <M>{String.raw`g'(0) = 0`}</M> and <M>{String.raw`g''(0) = 0`}</M> — the test is silent, and the answer is
            that 0 is neither, since <M>{String.raw`x^3`}</M> is increasing on both sides of it.</>}
        />

        <Worked
          n={3}
          verify="33/14, 3/14"
          title="The reason this page exists: fitting a line"
          technique="write the loss as a function of the parameter, differentiate with respect to that parameter, set to zero"
          given={<>Three measurements come back: <M>{String.raw`(1, 2)`}</M>, <M>{String.raw`(2, 5)`}</M>,{" "}
            <M>{String.raw`(3, 7)`}</M>. Fit the best line through the origin,{" "}
            <M>{String.raw`\hat{y} = wx`}</M>, where &ldquo;best&rdquo; means the smallest total squared error{" "}
            <M>{String.raw`L(w) = \sum_i (y_i - w x_i)^2`}</M>. Find <M>{String.raw`w^\star`}</M> and the loss
            there.</>}
          read={<>The variable is <M>w</M>, not <M>x</M>. Six of the numbers in this problem are data and are
            constants; the one unknown is the slope of the line you are choosing. Getting that the wrong way round is
            the single most common confusion when calculus first meets machine learning.</>}
          plan={<>Expand <M>{String.raw`L(w)`}</M> into a polynomial in <M>w</M>. It will be a quadratic with a
            positive <M>{String.raw`w^2`}</M> coefficient — an upward parabola — so it has exactly one stationary
            point and that point is the global minimum, no classification needed. Differentiate, set to zero, solve.{" "}
            <em>The alternative</em> is to differentiate each squared term with the chain rule without expanding;
            same answer, and worth doing once you trust the chain rule.</>}
          steps={[
            {
              math: String.raw`L(w) = (2-w)^2 + (5-2w)^2 + (7-3w)^2`,
              why: <>Just substitution: each residual is <M>{String.raw`y_i - w x_i`}</M> with the numbers put in.</>,
            },
            {
              math: String.raw`\begin{aligned} L(w) &= \big(4 - 4w + w^2\big) \ &\;+ \big(25 - 20w + 4w^2\big) \ &\;+ \big(49 - 42w + 9w^2\big) \ &= 78 - 66w + 14w^2\end{aligned}`,
              why: <>Expanded and collected. The <M>{String.raw`14 = 1 + 4 + 9`}</M> is{" "}
                <M>{String.raw`\sum x_i^2`}</M> and the <M>{String.raw`66 = 2(2 + 10 + 21)`}</M> is{" "}
                <M>{String.raw`2\sum x_i y_i`}</M> — the general formula is already visible in the arithmetic.</>,
            },
            {
              math: String.raw`L'(w) = -66 + 28w`,
              why: <>Differentiating with respect to <M>w</M>. The constant 78 vanishes, which is the mathematical
                statement that the size of the errors you cannot avoid has no bearing on which line is best.</>,
            },
            {
              math: String.raw`-66 + 28w = 0 \;\Longrightarrow\; w^\star = \frac{66}{28} = \frac{33}{14} \approx 2.357`,
              why: <>And <M>{String.raw`L''(w) = 28 > 0`}</M>, so this is a minimum — the only one.</>,
            },
            {
              math: String.raw`L(w^\star) = 78 - 66\cdot\tfrac{33}{14} + 14\cdot\tfrac{33^2}{14^2} = 78 - \frac{1089}{14} = \frac{3}{14} \approx 0.214`,
              why: <>The leftover error. It is not zero, and it should not be: three points do not sit on one line
                through the origin, and the fit is the best compromise, not a solution.</>,
            },
          ]}
          answer={<><M>{String.raw`w^\star = \tfrac{33}{14} \approx 2.357`}</M>, with a minimum loss of{" "}
            <M>{String.raw`\tfrac{3}{14} \approx 0.214`}</M>.</>}
          check={<>The closed form for a line through the origin is{" "}
            <M>{String.raw`w^\star = \sum x_i y_i / \sum x_i^2`}</M>, which here is{" "}
            <M>{String.raw`(2 + 10 + 21)/(1 + 4 + 9) = 33/14`}</M> — and you have just derived that formula rather
            than looked it up. Sanity check on the value too: the three individual slopes{" "}
            <M>{String.raw`y_i/x_i`}</M> are 2, 2.5 and 2.333, so any sensible compromise lands near 2.3. It
            does.</>}
          trap={<>Differentiating with respect to <M>x</M>. It is the letter the last two examples used, the data are
            full of it, and it is not the variable here. If a derivative in an ML problem comes out depending on which
            data point you looked at, this is usually why.</>}
        />

        <Worked
          n={4}
          verify="1, -1"
          title="A function with no derivative at a point"
          technique="when a limit is suspect, take it separately from each side and compare"
          given={<>Show that <M>{String.raw`f(x) = |x - 2|`}</M> has no derivative at{" "}
            <M>{String.raw`x = 2`}</M>, even though it is perfectly continuous there.</>}
          read={<>&ldquo;Show it does not exist&rdquo; needs an argument that a limit <em>fails</em>, and there is
            essentially one way to do that: produce two ways of approaching which give different answers.</>}
          plan={<>Compute the one-sided limits of the difference quotient at <M>{String.raw`x=2`}</M> — one with{" "}
            <M>{String.raw`h > 0`}</M>, one with <M>{String.raw`h < 0`}</M>. A two-sided limit exists only if both
            one-sided limits exist <em>and agree</em>, so exhibiting a disagreement is a complete proof.{" "}
            <em>The alternative</em> — sketching the graph and pointing at the corner — is the right intuition and is
            not an argument.</>}
          steps={[
            {
              math: String.raw`\frac{f(2+h) - f(2)}{h} = \frac{|h| - 0}{h} = \frac{|h|}{h}`,
              why: <>Because <M>{String.raw`f(2) = 0`}</M> and <M>{String.raw`f(2+h) = |h|`}</M>. The whole problem
                has collapsed to the sign function.</>,
            },
            {
              math: String.raw`h > 0: \quad \frac{|h|}{h} = \frac{h}{h} = 1 \;\Longrightarrow\; \lim_{h\to 0^+} = 1`,
              why: <>To the right of the corner the graph is the line <M>{String.raw`y = x-2`}</M>, slope{" "}
                <M>{String.raw`+1`}</M>, and the quotient is exactly 1 for every positive <M>h</M> — not
                approximately, exactly.</>,
            },
            {
              math: String.raw`h < 0: \quad \frac{|h|}{h} = \frac{-h}{h} = -1 \;\Longrightarrow\; \lim_{h\to 0^-} = -1`,
              why: <>To the left the graph is <M>{String.raw`y = 2-x`}</M>, slope <M>{String.raw`-1`}</M>.</>,
            },
            {
              math: String.raw`1 \neq -1 \;\Longrightarrow\; \lim_{h\to 0}\frac{f(2+h)-f(2)}{h} \ \text{does not exist}`,
              why: <>The two-sided limit requires agreement. It does not have it, so there is no derivative at{" "}
                <M>{String.raw`x=2`}</M> — and note the failure is not that the function is wild, but that it is too
                sharp.</>,
            },
          ]}
          answer={<>The one-sided slopes are <M>{String.raw`+1`}</M> and <M>{String.raw`-1`}</M>. They disagree, so{" "}
            <M>{String.raw`f'(2)`}</M> does not exist — though <M>{String.raw`f'(x)`}</M> exists for every other{" "}
            <M>x</M>.</>}
          check={<>The right-hand column of the numeric table at the top of this page: the quotient sits at{" "}
            <M>{String.raw`+1.0`}</M> for every positive <M>h</M> down to <M>{String.raw`10^{-6}`}</M> and at{" "}
            <M>{String.raw`-1.0`}</M> for every negative one. It is not converging slowly — it is not converging.</>}
          trap={<>Believing that continuity implies differentiability. It does not, and this is the standard
            counterexample; the implication runs the other way only (that direction is proved at the bottom of this
            page). This is not a curiosity: <M>{String.raw`\mathrm{ReLU}(x) = \max(0, x)`}</M> is this exact shape,
            and it is the activation function in most neural networks ever trained.</>}
        />

        <Practice
          problems={DERIVATIVE_PROBLEMS}
          accent={AMBER}
          intro={<>Thirteen, in three bands. Work the first band until it is boring, because the second and third
            assume it is. Every problem has a complete solution — not an answer key — and the third band has
            progressive hints: the first names the region to look in, the second names the technique. Take the first
            hint early and the second one late, because finding the structure is the whole skill being drilled.</>}
        />

        <h2>What the third band is testing</h2>
        <p>
          The last four problems are a different kind of question, and it is worth being explicit about how, because
          the difference is not that the algebra is heavier. In each one <strong>the direct route exists and is a
          trap</strong>. You can expand the degree-ten product in problem 10; you can binomially expand{" "}
          <M>{String.raw`(2+h)^{10}`}</M> in problem 11; you can split problem 12 into four cases. Each of those takes
          twenty minutes and most attempts will make an arithmetic slip along the way. Each problem was built so that
          noticing one structural fact collapses it to a line.
        </p>
        <p>The structural facts, gathered — these are worth recognising on sight:</p>
        <ul style={{ lineHeight: 1.75 }}>
          <li>
            <strong>A derivative of a product, evaluated at one of its own roots.</strong> Every product-rule term
            that still contains the vanishing factor dies; exactly one survives. Ten terms become one.
          </li>
          <li>
            <strong>A limit that is a difference quotient in disguise.</strong> Anything of the form{" "}
            <M>{String.raw`\lim_{h\to0}\frac{g(a+h)-g(a)}{h}`}</M> or{" "}
            <M>{String.raw`\lim_{x\to a}\frac{g(x)-g(a)}{x-a}`}</M> is <M>{String.raw`g'(a)`}</M>, read backwards. The
            disguise is cheap to write and the expansion is expensive to do, which is precisely why the question gets
            asked this way.
          </li>
          <li>
            <strong>A sum of absolute values.</strong> Its slope is a tally of which side of each corner you are on,
            so it can only take a few values and it changes only at the corners. The minimum is at the median, and it
            is a point where the derivative does not exist.
          </li>
          <li>
            <strong>A functional equation instead of a formula.</strong> When you are told a property of <M>f</M>{" "}
            rather than given <M>f</M>, go back to the limit definition and substitute the property into{" "}
            <M>{String.raw`f(x+h)`}</M>. A factor of <M>{String.raw`f(x)`}</M> comes out of the limit and what is left
            is <M>{String.raw`f'(0)`}</M>.
          </li>
        </ul>
        <p>
          The habit underneath all four is the same one, and it is the habit these problems exist to build:{" "}
          <strong>before computing, look at the structure of what you were handed and ask what the question is
          shaped like.</strong> A problem that can be brute-forced in twenty minutes was rarely written to be
          brute-forced. That instinct transfers directly — it is the same one that notices a matrix is rank-one
          before inverting anything, or that a sum is an expectation of an indicator before summing it.
        </p>

        <Proof title="the power rule, from the definition, for every n at once">
          <p>
            Every rule in the table was proved once from the difference quotient. Here is the one you use most, so
            that it stops being a fact to remember and becomes a thing you have seen made.
          </p>
          <p>
            Take <M>{String.raw`f(x) = x^n`}</M> for a positive integer <M>n</M>. The difference quotient needs{" "}
            <M>{String.raw`(x+h)^n`}</M>, and the binomial theorem gives it exactly:
          </p>
          <MathBlock>{String.raw`(x+h)^n = x^n + n x^{n-1} h + \binom{n}{2} x^{n-2} h^2 + \cdots + h^n`}</MathBlock>
          <p>Subtract <M>{String.raw`x^n`}</M> — the first term cancels, and every surviving term carries an <M>h</M>:</p>
          <MathBlock>{String.raw`\begin{aligned}\frac{(x+h)^n - x^n}{h} &= \frac{n x^{n-1} h + \binom{n}{2}x^{n-2}h^2 + \cdots + h^n}{h} \\ &= n x^{n-1} + \underbrace{\binom{n}{2}x^{n-2}h + \cdots + h^{n-1}}_{\text{every term has an } h}\end{aligned}`}</MathBlock>
          <p>
            Let <M>{String.raw`h \to 0`}</M>. The braced group is a finite sum of terms each containing at least one
            factor of <M>h</M>, so it vanishes, and
          </p>
          <MathBlock>{String.raw`\frac{d}{dx}x^n = n x^{n-1}.`}</MathBlock>
          <p>
            Notice what did the work: <strong>only the second binomial term ever mattered</strong>. Everything past it
            was quadratic or worse in <M>h</M> and died. That is the same observation that makes problem 11 a one-line
            problem, and it is the general shape of differentiation — a derivative is the coefficient of the linear
            term in how a function responds to a small nudge, and every higher-order response is irrelevant in the
            limit. That sentence is the whole content of Taylor expansion, which is where this leads.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>And the converse of worked example 4.</strong> Differentiability implies continuity, though not
            the reverse. If <M>{String.raw`f'(a)`}</M> exists then
          </p>
          <MathBlock>{String.raw`\lim_{h\to0}\big(f(a+h) - f(a)\big) = \lim_{h\to0}\left(\frac{f(a+h)-f(a)}{h}\cdot h\right) = f'(a)\cdot 0 = 0,`}</MathBlock>
          <p style={{ marginBottom: 0 }}>
            which says exactly that <M>{String.raw`f(a+h) \to f(a)`}</M>: no jump. So every differentiable function is
            continuous, and <M>{String.raw`|x-2|`}</M> shows the implication cannot be turned around.
          </p>
        </Proof>

        <Callout color={AMBER} title="Where this goes next">
          <p>
            Every model on this site with a differentiable loss is trained the same way: compute the derivative of the
            loss with respect to each parameter, and step each parameter against its slope. Worked example 3 is that
            procedure with one parameter and three data points, done exactly rather than iteratively. Real models have
            millions of parameters, so the next three pages generalise the one piece that has to change —{" "}
            <Link href="/learn/math-foundations/gradients" style={link}>the gradient</Link> bundles one derivative per
            parameter into a vector,{" "}
            <Link href="/learn/math-foundations/chain-rule" style={link}>the chain rule</Link> lets you differentiate
            a composition, which is what a network is, and{" "}
            <Link href="/learn/math-foundations/gradient-descent" style={link}>gradient descent</Link> makes the
            stepping formal. The corner in worked example 4 gets its own treatment in{" "}
            <Link href="/learn/math-foundations/subgradients" style={link}>subgradients</Link>.
          </p>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/spd-matrices", label: <>← Symmetric positive-definite matrices</> }}
          next={{ href: "/learn/math-foundations/gradients", label: <>Next up · Gradients &amp; partial derivatives →</> }}
        />
      </div>
    </article>
  );
}

const RULES: [string, string, string][] = [
  ["Powers", String.raw`\frac{d}{dx}x^n = n x^{n-1}`, "squared error differentiates to something linear — the reason least squares has a closed form"],
  ["Sums & constants", String.raw`(u + v)' = u' + v', \quad c' = 0`, "a loss over a million rows is differentiated one row at a time"],
  ["Products", String.raw`(uv)' = u'v + uv'`, "anywhere a weight multiplies an activation"],
  ["Quotients", String.raw`\left(\tfrac{u}{v}\right)' = \tfrac{u'v - uv'}{v^2}`, "the sigmoid, softmax, and every normalised score"],
  ["The exponential", String.raw`\frac{d}{dx}e^x = e^x`, "it is its own derivative — why it survives everywhere in probability"],
];

const th: React.CSSProperties = { textAlign: "left", padding: "7px 14px 7px 0", fontWeight: 500, color: "var(--muted)", fontSize: 12.5 };
const td: React.CSSProperties = { padding: "8px 14px 8px 0", color: "var(--ink)", verticalAlign: "top", fontSize: 13.5 };

const codeLimit = `# The definition is a limit, so watch it BE one. Shrink h and read the difference quotient.
f      = lambda x: 3*x**2 - 5*x + 2          # worked example 1
corner = lambda x: abs(x - 2)                # worked example 4

print(f"  {'h':>10}{'at x=2: (f(2+h)-f(2))/h':>26}{'corner, same quotient':>24}")
for h in (1.0, 0.1, 0.01, 1e-3, 1e-6):
    q  = (f(2 + h) - f(2)) / h
    qc = (corner(2 + h) - corner(2)) / h
    print(f"  {h:10.6f}{q:26.6f}{qc:24.1f}")
print()
for h in (-1.0, -0.1, -0.01, -1e-3, -1e-6):
    q  = (f(2 + h) - f(2)) / h
    qc = (corner(2 + h) - corner(2)) / h
    print(f"  {h:10.6f}{q:26.6f}{qc:24.1f}")
print()
print("  f'(2) = 6(2) - 5 = 7, and the quotient closes on it from both sides.")
print("  The corner's quotient does not: +1 from the right, -1 from the left, forever.")`;

const outLimit = `           h   at x=2: (f(2+h)-f(2))/h   corner, same quotient
    1.000000                 10.000000                     1.0
    0.100000                  7.300000                     1.0
    0.010000                  7.030000                     1.0
    0.001000                  7.003000                     1.0
    0.000001                  7.000003                     1.0

   -1.000000                  4.000000                    -1.0
   -0.100000                  6.700000                    -1.0
   -0.010000                  6.970000                    -1.0
   -0.001000                  6.997000                    -1.0
   -0.000001                  6.999997                    -1.0

  f'(2) = 6(2) - 5 = 7, and the quotient closes on it from both sides.
  The corner's quotient does not: +1 from the right, -1 from the left, forever.`;
