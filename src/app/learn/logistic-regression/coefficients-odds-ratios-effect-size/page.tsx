import { M } from "@/components/Math";
import { OddsRatioLab } from "@/components/labs/OddsRatioLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Term } from "@/components/Term";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { CREDIT_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

const code = `# a fitted loan-default model — read its coefficients
clf = LogisticRegression(penalty=None, max_iter=5000).fit(X, y)

for name, b in zip(feature_names, clf.coef_[0]):
    print(f"{name:8s} coef={b:+.4f}   odds ratio e^coef = {np.exp(b):.3f}")`;

export const metadata = {
  title: "Coefficients, odds ratios & effect size — Manifold",
  description: "A logistic regression's coefficients are log-odds. Exponentiate them and they become odds ratios — the currency risk analysts actually speak in.",
};

export default function CoefficientsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Coefficients, odds ratios &amp; effect size</>}
        intro={<>
          A trained logistic model is a row of numbers. The whole reason it beat the neural network
          onto a bank&rsquo;s dashboard is that those numbers <em>mean</em> something you can say out
          loud — once you know the translation.
        </>}
      />

      <div className="lesson">
        <p>
          Back on the sigmoid page we found the one modelling claim logistic regression makes: the{" "}
          <strong>log-odds are linear in the features</strong>,{" "}
          <M>{String.raw`\log\frac{p}{1-p} = b + w_1 x_1 + \dots`}</M>. That equation is also the key
          to reading the model. Each coefficient <M>{String.raw`w_i`}</M> is the number of{" "}
          <strong>log-odds</strong> added per unit of its feature. Log-odds are hard to feel, so we
          exponentiate.
        </p>

        <h2>From coefficient to odds ratio</h2>
        <p>
          Because the features enter through a sum inside an exponential, adding one unit of{" "}
          <M>{String.raw`x_i`}</M> <em>multiplies</em> the odds by{" "}
          <M>{String.raw`e^{w_i}`}</M> — a quantity called the{" "}
          <Term accent={ACCENT} def={<>The factor by which the odds of the event change per one-unit increase in a feature, holding the others fixed. It equals e raised to the coefficient. OR &gt; 1 raises the odds, OR &lt; 1 lowers them, OR = 1 means no effect.</>}>odds ratio</Term>.
          That multiply-don&rsquo;t-add structure is the whole trick: a coefficient of 0 means an
          odds ratio of 1 (no effect), a positive coefficient means an odds ratio above 1 (raises
          the odds), a negative one means below 1 (lowers them).
        </p>

        <CodeBlock setup={CREDIT_SETUP} fromScratch={code} />
        <CodeOutput>{`age      coef=-0.0129   odds ratio e^coef = 0.987
income   coef=-0.0221   odds ratio e^coef = 0.978
util     coef=+3.5727   odds ratio e^coef = 35.612
prior    coef=+0.7622   odds ratio e^coef = 2.143`}</CodeOutput>

        <p>
          Now the model speaks English. Each prior default multiplies a borrower&rsquo;s odds of
          defaulting again by <strong>2.14</strong> — more than doubles them. Each extra $1k of
          annual income multiplies the odds by 0.978, a 2.2% reduction; over a $10k gap
          that compounds to <M>{String.raw`0.978^{10} \approx 0.80`}</M>, a 20% cut. The{" "}
          <code>util</code> coefficient looks enormous (odds ratio 35!) but hold that thought — its
          feature only ranges from 0 to 1, so &ldquo;one unit&rdquo; is the entire scale. Comparing
          raw coefficients across features on different scales is the classic beginner trap, and the
          whole subject of the next page.
        </p>

        <h2>Why the same coefficient isn&rsquo;t the same effect</h2>
        <p>
          Here is the subtlety that separates people who <em>quote</em> odds ratios from people who{" "}
          <em>understand</em> them. An odds ratio is a constant multiplier on the <em>odds</em>. But
          nobody makes decisions in odds — they think in <strong>probability</strong>, and
          probability is not linear in odds. The very same odds ratio barely nudges a near-certain
          case and dramatically swings a coin-flip case.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>A feature has odds ratio 2 (one unit doubles the odds). It moves a borrower at 10% risk to ~18%. Where does it move a borrower already at 50% risk?</>}
          options={["To about 58% — same +8 points", "To about 67% — a bigger jump", "To exactly 100%"]}
          nudge={<>Locked in. Set the base risk to 50% in the lab and read the new probability, then try 10%.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Fix the coefficient, then drag the base risk from 5% to 50% to 90%. Watch the odds ratio stay put while the probability jump balloons and then shrinks.</>}
          insight={<>The odds ratio never moved — but the probability jump is largest right around 50% risk and vanishes at
            both extremes. This is why &ldquo;odds ratio 2&rdquo; is an honest, transferable summary of a feature&rsquo;s effect
            while &ldquo;+8 percentage points&rdquo; is only true for one specific patient. Report odds ratios; compute
            probabilities per case.</>}
        >
          <OddsRatioLab />
        </LabFrame>

        <Callout color={ACCENT} title={<>The interview-grade sentence</>}>
          &ldquo;What does a logistic coefficient of 0.76 mean?&rdquo; → <em>Its feature adds 0.76 to
          the log-odds per unit, i.e. multiplies the odds of the positive class by e^0.76 ≈ 2.14,
          holding other features fixed. It is <strong>not</strong> a change in probability — the
          probability effect depends on the baseline risk, largest near 50% and shrinking toward
          either extreme.</em>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/logistic-regression/thresholds-and-the-confusion-matrix", label: <>← Thresholds &amp; the confusion matrix</> }}
          next={{ href: "/learn/logistic-regression/standardize-before-you-compare", label: <>Next up · Standardize before you compare →</> }}
        />
      </div>
    </article>
  );
}
