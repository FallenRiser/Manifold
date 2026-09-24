import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import type { Problem } from "@/components/Practice";

// Practice set for math-foundations/derivatives, to the standard in docs/math-pedagogy-plan.md §5.
//
// Problems live here rather than inline in the page because every `verify` field below is parsed
// out of this file by `scripts/math_check.py`, which recomputes the answer from the statement with
// sympy and fails on a mismatch. A worked example with a sign error teaches a wrong method to
// exactly the reader who cannot spot it, and nothing else in this repo can catch one.
//
// `answer` is what the reader sees (KaTeX). `verify` is the same answer in sympy syntax, and is
// never rendered. Multi-part answers are comma-separated and compared element by element.

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export const DERIVATIVE_PROBLEMS: Problem[] = [
  // ---- band 1 · Apply -----------------------------------------------------------------
  {
    id: "d-a1",
    band: 1,
    statement: (
      <>Differentiate <M>{String.raw`f(x) = 4x^3 - 2x^2 + 7x - 1`}</M>, then evaluate the slope at{" "}
        <M>{String.raw`x = 1`}</M>.</>
    ),
    answer: String.raw`f'(x) = 12x^2 - 4x + 7,\qquad f'(1) = 15`,
    verify: "12*x**2 - 4*x + 7, 15",
    solution: (
      <>
        <p>
          Differentiate term by term — the sum rule says you may, and it is the reason a loss with a
          hundred terms is no harder than a loss with one.
        </p>
        <MathBlock>{String.raw`\frac{d}{dx}\big(4x^3\big) = 12x^2,\quad \frac{d}{dx}\big(-2x^2\big) = -4x,\quad \frac{d}{dx}\big(7x\big) = 7,\quad \frac{d}{dx}(-1) = 0`}</MathBlock>
        <p>
          So <M>{String.raw`f'(x) = 12x^2 - 4x + 7`}</M>, and{" "}
          <M>{String.raw`f'(1) = 12 - 4 + 7 = 15`}</M>.
        </p>
        <p>
          <strong>Check:</strong> the discriminant of <M>{String.raw`12x^2 - 4x + 7`}</M> is{" "}
          <M>{String.raw`16 - 336 < 0`}</M>, so the slope is never zero and never negative —{" "}
          <M>f</M> is strictly increasing everywhere. A quick sketch of a cubic with a positive
          leading coefficient and no turning points agrees.
        </p>
      </>
    ),
  },
  {
    id: "d-a2",
    band: 1,
    statement: (
      <>Using the limit definition only — no rules — show that{" "}
        <M>{String.raw`f(x) = \tfrac{1}{x}`}</M> has derivative{" "}
        <M>{String.raw`f'(x) = -\tfrac{1}{x^2}`}</M> for <M>{String.raw`x \neq 0`}</M>.</>
    ),
    hints: [<span key="h1">The subtraction in the numerator is two fractions. Put them over a common denominator before you do anything else.</span>],
    answer: String.raw`f'(x) = -\frac{1}{x^2}`,
    verify: "-1/x**2",
    solution: (
      <>
        <MathBlock>{String.raw`\frac{f(x+h)-f(x)}{h} = \frac{1}{h}\left(\frac{1}{x+h} - \frac{1}{x}\right) = \frac{1}{h}\cdot\frac{x-(x+h)}{x(x+h)} = \frac{1}{h}\cdot\frac{-h}{x(x+h)}`}</MathBlock>
        <p>
          The <M>h</M> in the numerator cancels the <M>h</M> we are dividing by — which is the whole
          game in every limit-definition problem, and the reason the algebra is arranged to produce
          one:
        </p>
        <MathBlock>{String.raw`= \frac{-1}{x(x+h)} \;\xrightarrow[h\to 0]{}\; \frac{-1}{x\cdot x} = -\frac{1}{x^2}.`}</MathBlock>
        <p>
          <strong>Check:</strong> the sign is right. <M>{String.raw`1/x`}</M> falls as <M>x</M>{" "}
          grows on either side of zero, so its slope must be negative everywhere — and{" "}
          <M>{String.raw`-1/x^2`}</M> is negative for every <M>{String.raw`x \neq 0`}</M>, including
          negative <M>x</M>.
        </p>
      </>
    ),
  },
  {
    id: "d-a3",
    band: 1,
    statement: (
      <>Give the derivative of <M>{String.raw`g(x) = -3x + 8`}</M> and of{" "}
        <M>{String.raw`h(x) = 7`}</M>. Then say, in one sentence each, what the two answers mean
        about the graphs.</>
    ),
    answer: String.raw`g'(x) = -3,\qquad h'(x) = 0`,
    verify: "-3, 0",
    solution: (
      <>
        <p>
          <M>{String.raw`g'(x) = -3`}</M>: a straight line has the same slope everywhere, and that
          slope is its gradient. The <M>{String.raw`+8`}</M> shifts the line up and changes no
          slope, which is the general fact that <em>constants vanish</em>.
        </p>
        <p>
          <M>{String.raw`h'(x) = 0`}</M>: a flat line never changes, so its rate of change is zero
          at every point.
        </p>
        <p>
          <strong>Why it matters:</strong> <M>{String.raw`h'(x) = 0`}</M> everywhere is the first
          warning that &ldquo;derivative is zero&rdquo; does not mean &ldquo;minimum&rdquo;. Here it
          means nothing at all is happening. Worked example 2 has the sharper version.
        </p>
      </>
    ),
  },
  {
    id: "d-a4",
    band: 1,
    statement: (
      <>Find the point where <M>{String.raw`f(x) = x^2 - 6x + 5`}</M> has zero slope. Is it a
        minimum or a maximum, and what is the value there?</>
    ),
    answer: String.raw`x = 3,\quad \text{a minimum},\quad f(3) = -4`,
    verify: "3, -4",
    solution: (
      <>
        <p>
          <M>{String.raw`f'(x) = 2x - 6`}</M>, which is zero at <M>{String.raw`x = 3`}</M>. Then{" "}
          <M>{String.raw`f(3) = 9 - 18 + 5 = -4`}</M>.
        </p>
        <p>
          It is a minimum, and there are three ways to know without guessing: the parabola opens
          upward because the <M>{String.raw`x^2`}</M> coefficient is positive; the second derivative
          is <M>{String.raw`f''(x) = 2 > 0`}</M>; or the slope <M>{String.raw`2x-6`}</M> is negative
          to the left of 3 and positive to the right, so the function falls into the point and
          climbs out of it.
        </p>
        <p>
          <strong>Check:</strong> completing the square gives{" "}
          <M>{String.raw`f(x) = (x-3)^2 - 4`}</M>, which is a squared term plus a constant — it
          cannot go below <M>{String.raw`-4`}</M>, and hits it exactly at <M>{String.raw`x=3`}</M>.
          No calculus needed, which is the point of an independent check.
        </p>
      </>
    ),
  },
  {
    id: "d-a5",
    band: 1,
    statement: (
      <>For <M>{String.raw`f(x) = e^x - x`}</M>: find <M>{String.raw`f'(x)`}</M>, find where the
        slope is zero, and find the smallest value <M>f</M> ever takes.</>
    ),
    answer: String.raw`f'(x) = e^x - 1,\quad x = 0,\quad f(0) = 1`,
    verify: "exp(x) - 1, 0, 1",
    solution: (
      <>
        <p>
          <M>{String.raw`e^x`}</M> is its own derivative and <M>x</M> differentiates to 1, so{" "}
          <M>{String.raw`f'(x) = e^x - 1`}</M>. That is zero exactly when{" "}
          <M>{String.raw`e^x = 1`}</M>, i.e. <M>{String.raw`x = 0`}</M>, and{" "}
          <M>{String.raw`f(0) = 1 - 0 = 1`}</M>.
        </p>
        <p>
          It is a minimum: <M>{String.raw`e^x - 1`}</M> is negative for <M>{String.raw`x<0`}</M> and
          positive for <M>{String.raw`x>0`}</M>, so the function comes down and goes back up, once.
        </p>
        <p>
          <strong>Check:</strong> you have just proved the standard inequality{" "}
          <M>{String.raw`e^x \geq 1 + x`}</M>, since <M>{String.raw`f(x) \geq 1`}</M> rearranges to
          exactly that. It shows up again in the{" "}
          <Link href="/learn/math-foundations/chernoff" style={link}>Chernoff bound</Link>, where it
          is the step that turns an indicator into an exponential.
        </p>
      </>
    ),
  },

  // ---- band 2 · Combine ---------------------------------------------------------------
  {
    id: "d-b1",
    band: 2,
    statement: (
      <>Differentiate <M>{String.raw`f(x) = x^2 e^x`}</M> and find every point where the slope is
        zero.</>
    ),
    hints: [<span key="h1">This is a product of two things you can each differentiate. It is not the product of the two derivatives.</span>],
    answer: String.raw`f'(x) = e^x(x^2 + 2x),\qquad x = 0 \text{ and } x = -2`,
    verify: "exp(x)*(x**2 + 2*x), 0, -2",
    solution: (
      <>
        <p>
          Product rule: <M>{String.raw`(uv)' = u'v + uv'`}</M> with{" "}
          <M>{String.raw`u = x^2`}</M> and <M>{String.raw`v = e^x`}</M>.
        </p>
        <MathBlock>{String.raw`f'(x) = 2x\,e^x + x^2 e^x = e^x\big(x^2 + 2x\big) = x\,e^x\,(x+2)`}</MathBlock>
        <p>
          Factorising before solving is the part worth copying. <M>{String.raw`e^x`}</M> is never
          zero, so the zeros come only from <M>{String.raw`x(x+2) = 0`}</M>:{" "}
          <M>{String.raw`x = 0`}</M> and <M>{String.raw`x = -2`}</M>.
        </p>
        <p>
          <strong>Check:</strong> <M>{String.raw`f(x) = x^2 e^x`}</M> is <M>{String.raw`\geq 0`}</M>{" "}
          everywhere and equals zero at <M>{String.raw`x=0`}</M>, so <M>{String.raw`x = 0`}</M> must
          be a minimum. As <M>{String.raw`x \to -\infty`}</M> the function decays to 0 from above,
          so there has to be a hump somewhere on the left — that is <M>{String.raw`x = -2`}</M>, the
          local maximum, with <M>{String.raw`f(-2) = 4e^{-2} \approx 0.54`}</M>.
        </p>
        <p>
          <strong>The trap:</strong> writing <M>{String.raw`f'(x) = 2x \cdot e^x`}</M> by
          differentiating the two factors separately. It is wrong, and it looks right, because the
          sum rule does work that way and the product rule does not.
        </p>
      </>
    ),
  },
  {
    id: "d-b2",
    band: 2,
    statement: (
      <>Differentiate <M>{String.raw`f(x) = \dfrac{2x+1}{x-3}`}</M>. Then explain why this function
        has no stationary point anywhere, without solving anything.</>
    ),
    hints: [<span key="h1">Quotient rule first. Then look hard at the numerator you end up with.</span>],
    answer: String.raw`f'(x) = \frac{-7}{(x-3)^2}`,
    verify: "-7/(x-3)**2",
    solution: (
      <>
        <p>
          Quotient rule, <M>{String.raw`\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}`}</M>,
          with <M>{String.raw`u = 2x+1`}</M>, <M>{String.raw`v = x-3`}</M>:
        </p>
        <MathBlock>{String.raw`f'(x) = \frac{2(x-3) - (2x+1)(1)}{(x-3)^2} = \frac{2x - 6 - 2x - 1}{(x-3)^2} = \frac{-7}{(x-3)^2}`}</MathBlock>
        <p>
          The numerator came out a <em>constant</em>. A fraction is zero only when its numerator is,
          and <M>{String.raw`-7`}</M> never is — so <M>{String.raw`f'(x)`}</M> is never zero and the
          function has no stationary point. Better than that: the denominator is a square, so{" "}
          <M>{String.raw`f'`}</M> is strictly negative wherever it is defined, and <M>f</M> is
          strictly decreasing on <M>{String.raw`(-\infty, 3)`}</M> and again on{" "}
          <M>{String.raw`(3, \infty)`}</M>.
        </p>
        <p>
          <strong>Check:</strong> <M>{String.raw`f(x) = 2 + \frac{7}{x-3}`}</M> by dividing out,
          which is a shifted copy of <M>{String.raw`7/x`}</M> — and{" "}
          <Link href="#d-a2" style={link}>problem 2</Link> already established that{" "}
          <M>{String.raw`1/x`}</M> has slope <M>{String.raw`-1/x^2`}</M>. Multiply by 7 and shift:{" "}
          <M>{String.raw`-7/(x-3)^2`}</M>. Two routes, one answer.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Careful:</strong> &ldquo;strictly decreasing on each piece&rdquo; is not
          &ldquo;strictly decreasing&rdquo;. <M>{String.raw`f(2) = -5`}</M> and{" "}
          <M>{String.raw`f(4) = 9`}</M>, which climbs — the pole at 3 is not a point of the domain
          and you cannot reason across it.
        </p>
      </>
    ),
    technique: "read the structure of the derivative instead of solving it — a constant numerator settles the question outright",
  },
  {
    id: "d-b3",
    band: 2,
    statement: (
      <>You have three measurements <M>{String.raw`(1, 2)`}</M>, <M>{String.raw`(2, 3)`}</M> and{" "}
        <M>{String.raw`(3, 7)`}</M>, and you want the best line through the origin,{" "}
        <M>{String.raw`\hat{y} = wx`}</M>. Minimise{" "}
        <M>{String.raw`L(w) = \sum_i (y_i - w x_i)^2`}</M> over <M>w</M> and give the exact value.</>
    ),
    hints: [
      <span key="h1">You are differentiating with respect to <M>w</M>, not <M>x</M>. The data are constants.</span>,
      <span key="h2">Expand into <M>{String.raw`A - Bw + Cw^2`}</M> first if the chain rule on three squares feels slippery — it is a parabola in <M>w</M>.</span>,
    ],
    answer: String.raw`w^\star = \frac{29}{14} \approx 2.071`,
    verify: "29/14",
    solution: (
      <>
        <p>
          Write it out, treating the six data numbers as constants and <M>w</M> as the variable:
        </p>
        <MathBlock>{String.raw`L(w) = (2 - w)^2 + (3 - 2w)^2 + (7 - 3w)^2`}</MathBlock>
        <p>
          Each term is something-squared, so each differentiates to{" "}
          <M>{String.raw`2 \times (\text{the something}) \times (\text{its slope in } w)`}</M> — the
          chain rule, which the{" "}
          <Link href="/learn/math-foundations/chain-rule" style={link}>next page but one</Link>{" "}
          makes formal. The inner slopes are <M>{String.raw`-1, -2, -3`}</M>:
        </p>
        <MathBlock>{String.raw`L'(w) = -2(2-w) - 4(3-2w) - 6(7-3w) = 28w - 58`}</MathBlock>
        <p>
          Setting that to zero gives <M>{String.raw`w^\star = \frac{58}{28} = \frac{29}{14}`}</M>.
          It is a minimum because <M>{String.raw`L''(w) = 28 > 0`}</M> — and because a sum of
          squares in one variable is an upward parabola, which cannot have anything else.
        </p>
        <p>
          <strong>Check:</strong> the general answer for a line through the origin is{" "}
          <M>{String.raw`w^\star = \frac{\sum x_i y_i}{\sum x_i^2}`}</M>. Here that is{" "}
          <M>{String.raw`\frac{2 + 6 + 21}{1 + 4 + 9} = \frac{29}{14}`}</M>. Same number, and you
          have just derived the formula rather than recalling it.
        </p>
      </>
    ),
    technique: "set the derivative to zero — this is least squares, and it is the reason the page exists",
  },
  {
    id: "d-b4",
    band: 2,
    statement: (
      <>Choose <M>a</M> and <M>b</M> so that{" "}
        <M>{String.raw`f(x) = \begin{cases} x^2 & x \leq 1 \\ ax + b & x > 1\end{cases}`}</M>{" "}
        is differentiable at <M>{String.raw`x = 1`}</M>.</>
    ),
    hints: [
      <span key="h1">Differentiable is two conditions, not one. The weaker one comes first.</span>,
      <span key="h2">A function with a jump in it has no derivative at the jump, so start by making the two pieces meet.</span>,
    ],
    answer: String.raw`a = 2,\qquad b = -1`,
    verify: "2, -1",
    solution: (
      <>
        <p>
          <strong>Condition 1 — the pieces must meet.</strong> A derivative cannot exist at a jump,
          so first make <M>f</M> continuous at 1: the left piece gives{" "}
          <M>{String.raw`1^2 = 1`}</M> and the right piece approaches{" "}
          <M>{String.raw`a + b`}</M>, so <M>{String.raw`a + b = 1`}</M>.
        </p>
        <p>
          <strong>Condition 2 — the slopes must match.</strong> From the left the slope is{" "}
          <M>{String.raw`2x`}</M> at <M>{String.raw`x=1`}</M>, which is 2. From the right it is{" "}
          <M>a</M>. A corner is exactly a mismatch of one-sided slopes, so{" "}
          <M>{String.raw`a = 2`}</M>, and then <M>{String.raw`b = 1 - a = -1`}</M>.
        </p>
        <p>
          <strong>Check:</strong> the tangent to <M>{String.raw`y=x^2`}</M> at{" "}
          <M>{String.raw`x=1`}</M> is <M>{String.raw`y = 2x - 1`}</M> — which is exactly the line we
          were forced into. That is the geometric content of the answer: the only line that glues on
          smoothly is the tangent line.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>The trap:</strong> matching only the slopes, getting <M>{String.raw`a=2`}</M>, and
          leaving <M>b</M> free. Any other <M>b</M> gives a graph that jumps, and a jump has no
          derivative at all.
        </p>
      </>
    ),
    technique: "differentiability is continuity AND matching one-sided slopes — impose them in that order",
  },

  // ---- band 3 · Outsmart --------------------------------------------------------------
  {
    id: "d-c1",
    band: 3,
    statement: (
      <>Let <M>{String.raw`f(x) = (x-1)(x-2)(x-3)\cdots(x-10)`}</M>. Find{" "}
        <M>{String.raw`f'(1)`}</M>.</>
    ),
    hints: [
      <span key="h1">Expanding this is a degree-10 polynomial and about forty minutes. You are asked for the derivative at one specific point, and that point is special.</span>,
      <span key="h2">Write the product rule for ten factors. Every term is a product of nine of them. What happens to a term that still contains <M>{String.raw`(x-1)`}</M> when you substitute <M>{String.raw`x=1`}</M>?</span>,
    ],
    answer: String.raw`f'(1) = -9! = -362\,880`,
    verify: "-362880",
    solution: (
      <>
        <p>
          The product rule on ten factors gives ten terms, and each term differentiates one factor
          and keeps the other nine:
        </p>
        <MathBlock>{String.raw`f'(x) = \sum_{j=1}^{10} \; \prod_{k \neq j} (x - k)`}</MathBlock>
        <p>
          Now substitute <M>{String.raw`x = 1`}</M>. Nine of those ten terms still contain the
          factor <M>{String.raw`(x-1)`}</M> — every term except the one where{" "}
          <M>{String.raw`j=1`}</M> was the factor that got differentiated. All nine die. Exactly one
          survives:
        </p>
        <MathBlock>{String.raw`f'(1) = \prod_{k=2}^{10} (1-k) = (-1)(-2)(-3)\cdots(-9) = (-1)^9 \cdot 9! = -362\,880`}</MathBlock>
        <p>
          <strong>Check the sign without redoing it:</strong> there are nine negative factors, an
          odd count, so the product is negative. And <M>{String.raw`9! = 362\,880`}</M>. Two
          independent facts, both easy, and together they pin the answer.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>What this generalises to.</strong> For any product{" "}
          <M>{String.raw`f(x) = \prod_k (x - r_k)`}</M> evaluated at one of its own roots{" "}
          <M>{String.raw`r_j`}</M>, every term but one vanishes and{" "}
          <M>{String.raw`f'(r_j) = \prod_{k\neq j}(r_j - r_k)`}</M>. It is worth recognising on
          sight: a derivative of a big product, asked for <em>at a root</em>, is a one-line problem
          wearing a forty-minute disguise.
        </p>
      </>
    ),
    technique: "at a root of a product, every product-rule term that retains that root's factor vanishes — only one survives",
  },
  {
    id: "d-c2",
    band: 3,
    statement: (
      <>Evaluate <M>{String.raw`\displaystyle\lim_{h \to 0} \frac{(2+h)^{10} - 2^{10}}{h}`}</M>.</>
    ),
    hints: [
      <span key="h1">You could expand <M>{String.raw`(2+h)^{10}`}</M> with the binomial theorem. Before you do — have you seen this shape before?</span>,
      <span key="h2">Compare it, symbol for symbol, with the definition at the top of this page.</span>,
    ],
    answer: String.raw`10 \cdot 2^9 = 5120`,
    verify: "5120",
    solution: (
      <>
        <p>
          This is not a limit problem. It is the definition of a derivative with the letters moved
          around. Put <M>{String.raw`f(x) = x^{10}`}</M> and <M>{String.raw`x = 2`}</M>:
        </p>
        <MathBlock>{String.raw`\lim_{h\to 0}\frac{f(2+h) - f(2)}{h} \;=\; f'(2)`}</MathBlock>
        <p>
          And <M>{String.raw`f'(x) = 10x^9`}</M>, so the answer is{" "}
          <M>{String.raw`f'(2) = 10 \cdot 2^9 = 10 \cdot 512 = 5120`}</M>. No expansion, no
          cancellation, no limit taken by hand.
        </p>
        <p>
          <strong>Check:</strong> the brute-force route would expand{" "}
          <M>{String.raw`(2+h)^{10} = 2^{10} + 10\cdot 2^9 h + 45 \cdot 2^8 h^2 + \cdots`}</M>. The{" "}
          <M>{String.raw`2^{10}`}</M> cancels, dividing by <M>h</M> leaves{" "}
          <M>{String.raw`10 \cdot 2^9 + 45 \cdot 2^8 h + \cdots`}</M>, and every remaining term
          carries an <M>h</M> that dies. Same answer — and notice that only the <em>first</em>{" "}
          binomial coefficient ever mattered, which is exactly why the shortcut exists.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Recognising it:</strong> any limit of the form{" "}
          <M>{String.raw`\lim_{h\to0}\frac{g(a+h)-g(a)}{h}`}</M>, or the variant{" "}
          <M>{String.raw`\lim_{x\to a}\frac{g(x)-g(a)}{x-a}`}</M>, is a derivative in disguise.
          Problems are built in this shape precisely because the disguise costs nothing to write and
          the expansion costs a page.
        </p>
      </>
    ),
    technique: "recognise a difference quotient and read it backwards as a derivative",
  },
  {
    id: "d-c3",
    band: 3,
    statement: (
      <>Let <M>{String.raw`f(x) = |x-1| + |x-2| + |x-3|`}</M>. Find the smallest value <M>f</M>{" "}
        takes, the <M>x</M> where it takes it, and the number of points at which <M>f</M> has no
        derivative.</>
    ),
    hints: [
      <span key="h1">Do not split into four cases and differentiate each one. Ask what the derivative <em>is</em>, away from the corners — it can only take a few values.</span>,
      <span key="h2">Each <M>{String.raw`|x-k|`}</M> contributes <M>{String.raw`+1`}</M> to the slope when <M>{String.raw`x > k`}</M> and <M>{String.raw`-1`}</M> when <M>{String.raw`x < k`}</M>. So the slope just counts.</span>,
    ],
    answer: String.raw`\min f = 2 \text{ at } x = 2;\quad \text{no derivative at } 3 \text{ points}`,
    verify: "2, 2, 3",
    solution: (
      <>
        <p>
          Away from <M>{String.raw`x = 1, 2, 3`}</M> the function is differentiable and its slope is
          a tally: each term contributes <M>{String.raw`+1`}</M> if you are to the right of its
          corner and <M>{String.raw`-1`}</M> if you are to the left. So
        </p>
        <MathBlock>{String.raw`f'(x) = \#\{k : x > k\} - \#\{k : x < k\} \;\in\; \{-3,\,-1,\,+1,\,+3\}`}</MathBlock>
        <p>
          On <M>{String.raw`(-\infty,1)`}</M> the slope is <M>{String.raw`-3`}</M>; on{" "}
          <M>{String.raw`(1,2)`}</M> it is <M>{String.raw`-1`}</M>; on <M>{String.raw`(2,3)`}</M>{" "}
          it is <M>{String.raw`+1`}</M>; beyond 3 it is <M>{String.raw`+3`}</M>. The function falls,
          falls, then rises, rises — so the minimum is at the changeover, <M>{String.raw`x = 2`}</M>,
          and <M>{String.raw`f(2) = 1 + 0 + 1 = 2`}</M>.
        </p>
        <p>
          The derivative never equals zero anywhere. The minimum is at a point where the derivative{" "}
          <em>does not exist</em> — the middle corner — which is why &ldquo;solve{" "}
          <M>{String.raw`f'=0`}</M>&rdquo; finds nothing here and would have been the wrong tool.
          <M>f</M> has no derivative at exactly <strong>three</strong> points:{" "}
          <M>{String.raw`x = 1, 2, 3`}</M>.
        </p>
        <p>
          <strong>Check, with no calculus at all:</strong> <M>{String.raw`f(x)`}</M> is the total
          distance from <M>x</M> to the three marks. For an odd number of marks that total is
          smallest at the <em>median</em> — here 2 — and the value is the spread,{" "}
          <M>{String.raw`(3-1) = 2`}</M>. The median-minimises-absolute-error fact is the same one
          that makes{" "}
          <Link href="/learn/linear-regression/rmse-vs-mae" style={link}>mean absolute error</Link>{" "}
          robust to outliers where squared error is not.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Why this matters beyond the exam:</strong> the kink is not a pathology to be
          avoided. It is the mechanism. The{" "}
          <Link href="/learn/math-foundations/subgradients" style={link}>subgradient</Link> page
          picks this up, and it is why the Lasso produces exact zeros and ReLU networks train at all.
        </p>
      </>
    ),
    technique: "for a sum of absolute values, the derivative is a count of sides — and the minimum can live where no derivative exists",
  },
  {
    id: "d-c4",
    band: 3,
    statement: (
      <><M>f</M> is differentiable everywhere and satisfies{" "}
        <M>{String.raw`f(x+y) = f(x)\,f(y)`}</M> for all <M>x, y</M>, with{" "}
        <M>{String.raw`f'(0) = 2`}</M> and <M>f</M> not identically zero. Find{" "}
        <M>{String.raw`f'(x)`}</M> in terms of <M>{String.raw`f(x)`}</M>, and then find{" "}
        <M>{String.raw`f(x)`}</M> itself.</>
    ),
    hints: [
      <span key="h1">You are not given a formula for <M>f</M>, so the only tool available is the definition of the derivative. Write it down and use the functional equation on <M>{String.raw`f(x+h)`}</M>.</span>,
      <span key="h2">Before that, get <M>{String.raw`f(0)`}</M>: put <M>{String.raw`x=y=0`}</M> into the functional equation.</span>,
    ],
    answer: String.raw`f'(x) = 2f(x),\qquad f(x) = e^{2x}`,
    verify: "2*exp(2*x), exp(2*x)",
    solution: (
      <>
        <p>
          <strong>Step 1 — pin down <M>{String.raw`f(0)`}</M>.</strong> Setting{" "}
          <M>{String.raw`x = y = 0`}</M> gives <M>{String.raw`f(0) = f(0)^2`}</M>, so{" "}
          <M>{String.raw`f(0)`}</M> is 0 or 1. If it were 0 then{" "}
          <M>{String.raw`f(x) = f(x)f(0) = 0`}</M> for every <M>x</M>, which is excluded. So{" "}
          <M>{String.raw`f(0) = 1`}</M>.
        </p>
        <p>
          <strong>Step 2 — the definition, with the equation substituted in.</strong> No formula for{" "}
          <M>f</M> exists yet, so the limit definition is the only handle:
        </p>
        <MathBlock>{String.raw`\begin{aligned} f'(x) &= \lim_{h\to 0}\frac{f(x+h)-f(x)}{h} = \lim_{h\to 0}\frac{f(x)f(h)-f(x)}{h} \\ &= f(x)\lim_{h\to 0}\frac{f(h)-f(0)}{h}\end{aligned}`}</MathBlock>
        <p>
          The last step used <M>{String.raw`f(0)=1`}</M> to turn the <M>{String.raw`-1`}</M> into{" "}
          <M>{String.raw`-f(0)`}</M> — and that limit is, by definition,{" "}
          <M>{String.raw`f'(0) = 2`}</M>. Pulling <M>{String.raw`f(x)`}</M> out of the limit is
          legal because it does not depend on <M>h</M>. So
        </p>
        <MathBlock>{String.raw`f'(x) = 2\,f(x).`}</MathBlock>
        <p>
          <strong>Step 3 — solve it.</strong> A function whose derivative is twice itself, with{" "}
          <M>{String.raw`f(0)=1`}</M>, is <M>{String.raw`f(x) = e^{2x}`}</M>.
        </p>
        <p>
          <strong>Check:</strong> <M>{String.raw`e^{2(x+y)} = e^{2x}e^{2y}`}</M> ✓,{" "}
          <M>{String.raw`f(0) = 1`}</M> ✓, and{" "}
          <M>{String.raw`f'(0) = 2e^0 = 2`}</M> ✓. All three given conditions hold.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>The pattern:</strong> when a problem gives you a <em>property</em> of <M>f</M>{" "}
          instead of a formula, the definition of the derivative is almost always the way in —
          substitute the property into <M>{String.raw`f(x+h)`}</M> and a factor of{" "}
          <M>{String.raw`f(x)`}</M> falls out of the limit. The same three moves solve{" "}
          <M>{String.raw`f(xy)=f(x)+f(y)`}</M>, which gives you the logarithm.
        </p>
      </>
    ),
    technique: "given a functional equation and no formula, go back to the limit definition and factor the known function out of the limit",
  },
];
