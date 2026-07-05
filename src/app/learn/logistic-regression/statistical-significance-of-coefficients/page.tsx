import { M } from "@/components/Math";
import { Term } from "@/components/Term";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

const code = `import statsmodels.api as sm

# statsmodels gives standard errors, z-tests, p-values and CIs
Xc = sm.add_constant(X)          # add an intercept column
res = sm.Logit(y, Xc).fit()
print(res.summary2().tables[1].round(4))`;

export default function SignificancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Statistical significance of coefficients</>}
        intro={<>
          A coefficient of −0.013 for age — is that a real effect, or noise the model dressed up as
          a number? Standard errors, z-tests, and confidence intervals are how you tell, and why
          scikit-learn quietly refuses to give them to you.
        </>}
      />

      <div className="lesson">
        <p>
          Every coefficient is an <em>estimate</em> from one particular sample. Draw a different
          1,200 borrowers and you&rsquo;d get slightly different numbers. The question significance
          testing answers is: <strong>if this feature truly had no effect (coefficient exactly 0),
          how surprised should we be to see an estimate this far from 0?</strong> Very surprised
          means the effect is probably real; not very means it could easily be luck.
        </p>

        <h2>Standard error, z, and p</h2>
        <p>
          Each coefficient comes with a{" "}
          <Term accent={ACCENT} def={<>An estimate of how much the coefficient would wobble from sample to sample. Small standard error = the data pins the coefficient down tightly; large = the estimate is shaky.</>}>standard error</Term>{" "}
          — how much it would wobble across resamples. Divide the coefficient by its standard error
          and you get a <M>z</M>-statistic: how many standard errors the estimate sits from zero. Feed
          that through the normal distribution and you get the{" "}
          <Term accent={ACCENT} def={<>The probability of seeing a coefficient at least this extreme if the feature's true effect were zero. Small p (&lt; 0.05 by convention) = unlikely to be a fluke. It is NOT the probability the effect is real, and it says nothing about effect size.</>}>p-value</Term>.
          For logistic regression you reach past scikit-learn to <code>statsmodels</code>, which
          reports all of it:
        </p>

        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`           Coef.  Std.Err.        z     P>|z|   [0.025   0.975]
const    -0.6115    0.3407  -1.7947   0.0727  -1.2792   0.0563
age      -0.0129    0.0063  -2.0430   0.0412  -0.0253  -0.0005
income   -0.0221    0.0031  -7.0208   0.0000  -0.0282  -0.0159
util      3.5727    0.3660   9.7625   0.0000   2.8553   4.2900
prior     0.7622    0.0957   7.9610   0.0000   0.5746   0.9498`}</CodeOutput>

        <p>
          Read the <code>P&gt;|z|</code> column. Utilization, income, and prior defaults have
          p-values essentially 0 — with over 7 standard errors between estimate and zero, chance is
          not a plausible explanation. Age sits at p = 0.041: real by the usual 0.05 convention, but
          only just, and its effect is small. The intercept&rsquo;s p = 0.073 isn&rsquo;t
          significant, which is fine — the baseline log-odds rarely needs to be.
        </p>

        <h2>The confidence interval is the better tool</h2>
        <p>
          The last two columns give the 95%{" "}
          <Term accent={ACCENT} def={<>A range that would contain the true coefficient 95% of the time across repeated samples. Its width shows precision; whether it crosses zero tells you significance at a glance.</>}>confidence interval</Term>.
          Prior defaults land in <M>{String.raw`[0.57,\ 0.95]`}</M> log-odds; exponentiate the ends
          and the <strong>odds ratio</strong> lands in <M>{String.raw`[1.78,\ 2.59]`}</M>. That single
          line says everything the p-value does and more: it excludes 1 (so: significant), and it
          quantifies the effect (each prior default between 1.8× and 2.6× the odds). A CI that
          straddles an odds ratio of 1 is the same news as p &gt; 0.05, but far more informative.
        </p>

        <Callout color={ACCENT} title={<>What a p-value is not</>}>
          It is <em>not</em> the probability the effect is real, and <em>not</em> a measure of effect
          size. With 50,000 rows a laughably tiny, useless effect can post p &lt; 0.001 simply
          because the standard error shrinks with sample size. Always read significance
          (&ldquo;is it distinguishable from zero?&rdquo;) alongside the coefficient or odds ratio
          (&ldquo;is it big enough to care about?&rdquo;). Significant and important are different
          questions.
        </Callout>

        <h2>Why scikit-learn won&rsquo;t give you p-values</h2>
        <p>
          It&rsquo;s a philosophy gap, not an oversight. <code>statsmodels</code> comes from
          statistics, where the goal is <em>inference</em> — understanding which factors drive an
          outcome, with honest uncertainty. <code>scikit-learn</code> comes from machine learning,
          where the goal is <em>prediction</em> — and, awkwardly, its default L2 penalty biases the
          coefficients, which would make naive standard errors wrong anyway. Use statsmodels
          (unpenalized) when you need to defend which features matter; use scikit-learn when you need
          the best out-of-sample predictions.
        </p>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A feature's 95% confidence interval for its odds ratio is [0.92, 1.35]. What do you conclude?",
              options: ["Strong positive effect", "Not significant at 5% — the interval includes 1 (no effect)", "The feature is broken"],
              answer: 1,
              explain: "An odds-ratio CI that straddles 1 means 'no effect' is a plausible value — equivalent to p > 0.05. The data can't distinguish this feature's effect from nothing.",
            },
            {
              q: "With 100,000 rows, a feature shows odds ratio 1.01 with p < 0.0001. The right read is…",
              options: ["A hugely important feature — tiny p!", "A real but trivially small effect — significant ≠ important", "The p-value must be a bug"],
              answer: 1,
              explain: "Massive samples shrink standard errors, so even a 1% effect becomes 'significant'. The odds ratio (1.01) tells you it barely matters. This is exactly why you read effect size and significance together.",
            },
            {
              q: "Why does statsmodels give p-values but scikit-learn's LogisticRegression doesn't by default?",
              options: ["scikit-learn's is a worse implementation", "statsmodels targets inference (unpenalized, with uncertainty); sklearn targets prediction and penalizes by default, which invalidates naive standard errors", "p-values only exist for linear regression"],
              answer: 1,
              explain: "Different goals. sklearn's default L2 penalty biases coefficients toward zero, so textbook standard errors wouldn't be valid anyway. For inference, reach for unpenalized statsmodels.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/standardize-before-you-compare", label: <>← Standardize before you compare</> }}
          next={{ href: "/learn/logistic-regression/regularized-logistic-regression", label: <>Next up · Regularized logistic regression →</> }}
        />
      </div>
    </article>
  );
}
