import { M } from "@/components/Math";
import { ImbalanceLab } from "@/components/labs/ImbalanceLab";
import { OddsRatioLab } from "@/components/labs/OddsRatioLab";
import { CostLab } from "@/components/labs/CostLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Case A: credit default prediction — Manifold",
  description: "One end-to-end pass through a real workflow: predict loan defaults with logistic regression, from the imbalance trap to odds-ratio explanations to a threshold set by what a mistake actually costs.",
};

export default function CaseCreditDefaultPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Case study", color: "var(--c-fundamentals)" }]}
        time="about 11 minutes"
        title={<>Case A: credit default prediction</>}
        intro={<>
          Everything the track built, run once on a single problem. A lender wants to predict which borrowers
          will default. We&rsquo;ll walk it end to end — the trap, the model, the explanation, the decision —
          and each stage is a page you&rsquo;ve already met, now doing real work together.
        </>}
      />

      <div className="lesson">
        <p>
          The dataset is the loan book from the practice tier: 1,200 borrowers described by age, income, credit
          utilisation, and number of prior delinquencies, with a binary label — did they default? It&rsquo;s a
          textbook logistic-regression problem: a yes/no outcome, interpretable features, and a decision with a
          concrete dollar cost attached. Perfect for the model whose whole selling point is honest, explainable
          probabilities.
        </p>

        <h2>Stage 1 — meet the imbalance before it fools you</h2>
        <p>
          Only <strong>6.8%</strong> of borrowers default. The first page of the evaluation story applies
          immediately: a model that predicts &ldquo;nobody defaults&rdquo; scores 93% accuracy and is worthless.
          So we never look at accuracy alone — we look at what the model does to the 61 real defaulters, and we
          budget the trade between missing them and false-alarming on good borrowers.
        </p>

        <LabFrame
          accent={ACCENT}
          tryThis={<>Compare the three strategies. The default 0.5-threshold model catches only 13 of 61. See what class weighting and a lower threshold each recover — and what they cost.</>}
          insight={<>The naïve model&rsquo;s 94.7% accuracy hides a 21% recall — useless to a lender who loses money on every
            missed default. Class weighting and threshold-lowering both trade precision for recall; which one, and how far,
            is a business decision we make explicitly in Stage 3, not a default we accept by accident.</>}
        >
          <ImbalanceLab />
        </LabFrame>

        <h2>Stage 2 — fit it, then explain it</h2>
        <p>
          We standardise the features and fit a regularised logistic regression. Because the coefficients are
          on standardised inputs, they&rsquo;re directly comparable, and exponentiating each gives an{" "}
          <strong>odds ratio</strong> — the multiplier on the odds of default per one-standard-deviation move.
          On this data, prior delinquencies and credit utilisation dominate; higher income lowers the odds. This
          is the explanation a regulator (or a declined applicant) is owed, and it&rsquo;s why a black-box model
          would be the wrong tool here even if it scored a point higher.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>A feature has an odds ratio of about 2.1. Where does moving it by one standard deviation change a borrower&rsquo;s default probability the most — for a low-risk or a high-risk borrower?</>}
          options={[
            "It moves a mid-risk borrower (near 50%) the most; barely moves a very safe one",
            "It moves the safest borrowers the most",
            "It shifts everyone's probability by the same amount",
          ]}
          nudge={<>Set the odds ratio near 2.1 in the lab and compare the probability jump at a low base risk vs near 50%.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Fix the odds ratio and slide the base risk. Watch the same multiplier on the odds produce a big probability change near 50% and a tiny one out in the tails.</>}
          insight={<>An odds ratio is constant on the odds scale but its effect on <em>probability</em> depends on where you
            start — largest in the uncertain middle, negligible for already-safe or already-doomed borrowers. That&rsquo;s
            why &ldquo;each prior delinquency doubles the odds&rdquo; is the honest summary, and &ldquo;adds X% to the
            probability&rdquo; is not: the percentage isn&rsquo;t constant.</>}
        >
          <OddsRatioLab />
        </LabFrame>

        <h2>Stage 3 — turn the probability into a decision</h2>
        <p>
          Now the money. Suppose a missed default costs the lender roughly <M>{String.raw`10\times`}</M> what a
          false alarm does (a bad loan wipes out the margin on many good ones; a wrongly-declined applicant is a
          lost bit of expected profit). The cost-sensitive page gave the exact rule — set the threshold at{" "}
          <M>{String.raw`t^\* = C_{fp}/(C_{fp}+C_{fn})`}</M> — which for a 10× ratio is about <strong>0.09</strong>,
          not the default 0.5. Flag anyone above a 9% chance of default.
        </p>

        <LabFrame
          accent={ACCENT}
          tryThis={<>Set the cost ratio to 10× and read the optimal threshold and the collapse in missed defaults. Then drop it to 1× and watch the threshold climb back toward 0.5.</>}
          insight={<>At a 10× miss-to-false-alarm cost the threshold drops to 0.09 and missed defaults fall from 23 to 3 — at
            the price of more false alarms, which is exactly the trade the lender wants at that cost ratio. The threshold is
            a dial the business sets from its own numbers; the model just has to give calibrated probabilities for the dial
            to mean anything. This is where imbalance, calibration, and cost all cash out into one number.</>}
        >
          <CostLab />
        </LabFrame>

        <Callout color={ACCENT} title={<>The workflow, assembled</>}>
          Distrust accuracy on imbalanced data → fit a regularised, standardised logistic model → explain it with
          odds ratios → and set the operating threshold from the real cost of a mistake, trusting the model&rsquo;s
          calibrated probabilities to make that threshold meaningful. Every stage was a page in this track; the
          case study is just where they stop being separate lessons and become one decision.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "The credit model is 94.7% accurate but catches 13 of 61 defaulters. Why is that unacceptable to the lender?",
              options: [
                "Accuracy should be higher than 95%",
                "It misses 79% of the defaults — the exact costly event the model exists to prevent",
                "The model is overfit",
              ],
              answer: 1,
              explain: "On a 6.8%-default book, high accuracy is trivially achieved by mostly predicting 'no default'. The lender loses money on missed defaults, so recall on the positive class — not accuracy — is what matters.",
            },
            {
              q: "Why report odds ratios rather than raw coefficients to stakeholders?",
              options: [
                "Odds ratios are always larger",
                "exp(coef) is an interpretable multiplier on the odds — 'each prior delinquency doubles the odds of default'",
                "Coefficients can't be computed for logistic regression",
              ],
              answer: 1,
              explain: "Exponentiating a coefficient turns the log-odds scale into a multiplicative effect on the odds, which is far more communicable — and, with standardised inputs, comparable across features.",
            },
            {
              q: "A missed default costs ~10× a false alarm. The deployed threshold should be…",
              options: ["0.5 — the default", "About 0.09, from t* = C_fp/(C_fp+C_fn)", "0.9 — be very cautious about flagging"],
              answer: 1,
              explain: "t* = 1/(1+10) ≈ 0.09. The costlier a miss, the lower the bar for flagging. It works only because the logistic probabilities are calibrated, so 0.09 really means a 9% chance.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/when-to-use-logistic-regression", label: <>← When to use it</> }}
          next={{ href: "/learn/logistic-regression/case-medical-screening", label: <>Next up · Case B: medical screening →</> }}
        />
      </div>
    </article>
  );
}
