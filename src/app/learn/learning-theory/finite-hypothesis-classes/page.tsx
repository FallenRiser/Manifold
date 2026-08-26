import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Finite hypothesis classes — Manifold",
  description:
    "Cash the union bound out into a usable rule: how much data a finite hypothesis class needs. When a perfect hypothesis exists the rate improves from 1/ε² to 1/ε, and ln|H| turns out to be the number of bits it takes to describe your model.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const box: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
  padding: "12px 14px", margin: "1.2rem 0",
};

export default function FiniteClassesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Generalization", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>Finite hypothesis classes</>}
        intro={<>Turn the union bound into something you could actually use: a rule for how much data a class needs.
          Along the way, one of the most quietly beautiful facts in the subject — <M>{String.raw`\ln|\mathcal H|`}</M> is
          measured in bits.</>}
      />

      <div className="lesson">
        <h2>The agnostic bound, restated as a requirement</h2>
        <p>
          From the previous page, for a finite class of size <M>M</M>, with probability at least{" "}
          <M>{String.raw`1-\delta`}</M> every <M>{String.raw`h \in \mathcal H`}</M> satisfies{" "}
          <M>{String.raw`|\hat R_S(h) - R(h)| \le \sqrt{(\ln M + \ln(2/\delta))/2n}`}</M>. Instead of asking
          &ldquo;how good is my guarantee?&rdquo;, invert it and ask the question a practitioner actually has:{" "}
          <em>how much data do I need to guarantee <M>{String.raw`\varepsilon`}</M>?</em>
        </p>
        <MathBlock>{String.raw`n \;\ge\; \frac{\ln M + \ln(2/\delta)}{2\varepsilon^2}`}</MathBlock>
        <p>
          This is a <strong>sample complexity</strong> statement, and its shape is worth memorizing:
          logarithmic in the size of the class, logarithmic in the confidence, and — the expensive
          part — <em>quadratic</em> in the precision. Wanting half the error costs four times the data.
        </p>

        <h2>When a perfect hypothesis exists, you do better</h2>
        <p>
          There&rsquo;s an important special case. Suppose your class actually contains a hypothesis that is exactly
          right — some <M>{String.raw`h^\star \in \mathcal H`}</M> with <M>{String.raw`R(h^\star) = 0`}</M>. This is
          called the <strong>realizable</strong> case, and in it the rate improves dramatically, from{" "}
          <M>{String.raw`1/\varepsilon^2`}</M> to <M>{String.raw`1/\varepsilon`}</M>:
        </p>
        <MathBlock>{String.raw`n \;\ge\; \frac{\ln M + \ln(1/\delta)}{\varepsilon}`}</MathBlock>
        <p>
          The reason is intuitive before it&rsquo;s technical. In the agnostic case you must estimate every
          hypothesis&rsquo;s risk accurately, and estimation is governed by variance, which decays like{" "}
          <M>{String.raw`1/\sqrt n`}</M>. In the realizable case you don&rsquo;t need to estimate anything — you only
          need to <em>eliminate</em>. A bad hypothesis survives only by getting every single training point right by
          luck, and that probability decays exponentially and directly.
        </p>

        <Proof title="the realizable bound, by elimination" color={GRAY}>
          <p>
            Let <M>{String.raw`\mathcal H`}</M> be finite with <M>{String.raw`|\mathcal H| = M`}</M>, and suppose the
            learner returns any <M>{String.raw`\hat h`}</M> that is <em>consistent</em> with the sample — zero
            training error. Since <M>{String.raw`h^\star`}</M> has zero true risk, it is consistent too, so such a
            hypothesis always exists and the learner never fails to return one.
          </p>
          <p>
            Call a hypothesis <M>h</M> <strong>bad</strong> if <M>{String.raw`R(h) > \varepsilon`}</M>. We want to
            show that with high probability, no bad hypothesis is consistent — because then whatever the learner
            returns, being consistent, cannot be bad.
          </p>
          <p>
            <strong>Step 1 — one bad hypothesis.</strong> Fix a bad <M>h</M>. On a single random example it errs
            with probability <M>{String.raw`R(h) > \varepsilon`}</M>, so it is <em>correct</em> with probability at
            most <M>{String.raw`1 - \varepsilon`}</M>. The <M>n</M> examples are independent, so
          </p>
          <MathBlock>{String.raw`P\big(h \text{ is consistent with all } n\big) \;\le\; (1-\varepsilon)^n \;\le\; e^{-n\varepsilon},`}</MathBlock>
          <p>
            where the last step uses the standard inequality <M>{String.raw`1 - x \le e^{-x}`}</M>, valid for all
            real <M>x</M>. Notice this is exponential in <M>{String.raw`n\varepsilon`}</M> directly, not in{" "}
            <M>{String.raw`n\varepsilon^2`}</M> — that missing square is the entire improvement.
          </p>
          <p>
            <strong>Step 2 — union over the bad ones.</strong> There are at most <M>M</M> bad hypotheses, so
          </p>
          <MathBlock>{String.raw`P\big(\exists \text{ bad } h \text{ that is consistent}\big) \;\le\; M e^{-n\varepsilon}.`}</MathBlock>
          <p>
            <strong>Step 3 — invert.</strong> Demand that this be at most <M>{String.raw`\delta`}</M>:{" "}
            <M>{String.raw`Me^{-n\varepsilon} \le \delta \iff n\varepsilon \ge \ln(M/\delta)`}</M>, giving
          </p>
          <MathBlock>{String.raw`n \;\ge\; \frac{\ln M + \ln(1/\delta)}{\varepsilon}.`}</MathBlock>
          <p>
            With at least that many examples, with probability <M>{String.raw`1-\delta`}</M> every consistent
            hypothesis — including the one returned — has true risk at most <M>{String.raw`\varepsilon`}</M>. The
            argument never mentions <em>which</em> consistent hypothesis is returned, so it holds for any consistent
            learner whatsoever.
          </p>
        </Proof>

        <h2>A worked example you can check</h2>
        <p>
          Take the class of <strong>boolean conjunctions</strong> over <M>d</M> binary features — rules like{" "}
          <em>&ldquo;<M>{String.raw`x_1`}</M> and not <M>{String.raw`x_4`}</M> and <M>{String.raw`x_7`}</M>&rdquo;</em>.
          Each feature can appear plain, negated, or not at all, so there are exactly{" "}
          <M>{String.raw`M = 3^d`}</M> such rules and <M>{String.raw`\ln M = d\ln 3`}</M>. Plug into the realizable
          bound with <M>{String.raw`\varepsilon = 0.05`}</M> and <M>{String.raw`\delta = 0.05`}</M>:
        </p>

        <div style={box}>
          <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.75 }}>
            <div><M>{String.raw`d = 10`}</M>: <M>{String.raw`M = 3^{10} = 59{,}049`}</M>,{" "}
              <M>{String.raw`\ln M \approx 10.99`}</M> → <M>{String.raw`n \ge (10.99 + 3.00)/0.05 \approx 280`}</M> examples.</div>
            <div><M>{String.raw`d = 100`}</M>: <M>{String.raw`\ln M \approx 109.86`}</M> →{" "}
              <M>{String.raw`n \ge (109.86 + 3.00)/0.05 \approx 2{,}258`}</M> examples.</div>
          </div>
        </div>

        <p>
          Look at what happened. The class grew from fifty-nine thousand hypotheses to a number with forty-eight
          digits, and the data requirement went up by a factor of eight. Sample complexity is{" "}
          <strong>linear in <M>d</M></strong>, because <M>{String.raw`\ln 3^d = d \ln 3`}</M>. Enormous classes are
          learnable as long as they&rsquo;re <em>describable</em> — which is the next idea, and the prettiest one on
          the page.
        </p>

        <h2><M>{String.raw`\ln M`}</M> is a number of bits</h2>
        <p>
          If a class has <M>M</M> members, you can label each one with a distinct binary string of length{" "}
          <M>{String.raw`\log_2 M`}</M>. So <M>{String.raw`\log_2 M`}</M> is literally the number of bits it takes to
          write down which hypothesis you mean, and up to the constant <M>{String.raw`\ln 2`}</M>, the sample
          complexity bound reads:
        </p>
        <MathBlock>{String.raw`n \;\gtrsim\; \frac{(\text{bits needed to describe } h) \;+\; (\text{bits of confidence})}{\varepsilon}`}</MathBlock>
        <p>
          <strong>You need about one example per bit of model description</strong>, divided by the accuracy you
          want. That single sentence is the honest core of &ldquo;more parameters need more data&rdquo;, and it
          connects directly to{" "}
          <Link href="/learn/math-foundations/entropy" style={link}>entropy</Link> as a measure of description
          length, and forward to minimum-description-length and Occam-style bounds. The conjunction example says it
          out loud: <M>d</M> features means about <M>{String.raw`d \log_2 3 \approx 1.58d`}</M> bits, so about{" "}
          <M>{String.raw`1.58d`}</M> examples per unit of accuracy. Structure, not raw count, is what you pay for.
        </p>

        <Callout color={GRAY} title={<>The catch that drives the next chapter</>}>
          Every model you actually train has an <em>infinite</em> hypothesis class. A linear classifier&rsquo;s
          weights are real numbers; there are uncountably many of them, so <M>{String.raw`M = \infty`}</M>,{" "}
          <M>{String.raw`\ln M = \infty`}</M>, and the bound reads &ldquo;you need infinitely many examples&rdquo; —
          which is both true of this argument and obviously false in practice, since linear classifiers learn fine
          from a few hundred points. The bound isn&rsquo;t wrong; <em>counting</em> is the wrong measure. Fixing that
          is what the next chapter is for.
        </Callout>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · Generalization"
          questions={[
            {
              q: <>You compute the same formula <M>{String.raw`\frac1n\sum_i \ell(h(x_i), y_i)`}</M> on your training set and on your test set. What actually makes the test number trustworthy and the training number not?</>,
              options: [
                "The test set is larger, so its average is more accurate",
                "The test sample was not used to choose h, so h is independent of it",
                "Test data comes from a different distribution than training data",
              ],
              answer: 1,
              explain: <>Both are empirical risk — the arithmetic is identical, and the test set is usually <em>smaller</em>. What matters is independence: Hoeffding&rsquo;s guarantee applies to a hypothesis fixed before the sample was seen. Training data chose <M>h</M>, so it no longer qualifies. And both sets are assumed to come from the <em>same</em> distribution — if they didn&rsquo;t, none of this machinery would apply at all.</>,
            },
            {
              q: <>Your grid search evaluates 1,000 hypotheses instead of 1. Roughly what happens to the guaranteed generalization gap, holding <M>n</M> fixed?</>,
              options: [
                "It grows by a factor of about 1,000",
                "It grows by a factor of about 31 (the square root of 1,000)",
                "It grows by a factor of well under 2",
              ],
              answer: 2,
              explain: <>The class size enters as <M>{String.raw`\sqrt{\ln M}`}</M>. With <M>{String.raw`\delta = 0.05`}</M>, going from <M>M=1</M> to <M>M=1000</M> takes the numerator from <M>{String.raw`\ln 40 \approx 3.7`}</M> to <M>{String.raw`\ln 40 + \ln 1000 \approx 10.6`}</M> — a ratio under 3, so the bound grows by <M>{String.raw`\sqrt{2.87} \approx 1.7`}</M>. Searching is log-cheap. That is why grid search is defensible and why it still isn&rsquo;t free.</>,
            },
            {
              q: <>A colleague cites no free lunch to argue that benchmarking models on your dataset is pointless, since all algorithms are provably equivalent. What&rsquo;s wrong with that?</>,
              options: [
                "Nothing — the theorem does say all algorithms perform identically",
                "The theorem averages over all possible problems, including the overwhelming majority that are pure noise; your dataset is one structured problem",
                "The theorem applies only to classification, not regression",
              ],
              answer: 1,
              explain: <>No free lunch is a statement about a <em>uniform average over all labeling functions</em>, a space dominated by structureless noise. It rules out a universal assumption-free learner; it says nothing about which algorithm suits <em>your</em> problem, whose structure is exactly what makes benchmarking informative. The theorem is a reason to benchmark, not a reason to skip it.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning-theory/the-union-bound-argument", label: <>← The union bound argument</> }}
          next={{ href: "/learn/learning-theory/pac-learnability", label: <>Next up · Probably approximately correct →</> }}
        />
      </div>
    </article>
  );
}
