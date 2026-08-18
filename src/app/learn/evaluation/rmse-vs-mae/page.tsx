import { M } from "@/components/Math";
import { ErrorMetricsLab } from "@/components/labs/ErrorMetricsLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "RMSE vs MAE: which error? — Manifold",
  description: "For regression, evaluation means summarising the residuals into one number. RMSE and MAE do it differently — and the difference is entirely about how much you fear a big miss.",
};

export default function RmseVsMaePage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 7 minutes"
        title={<>RMSE vs MAE: which error?</>}
        intro={<>
          Classification counted right and wrong. Regression can&rsquo;t — being off by $1 and off by
          $100,000 are both &ldquo;wrong.&rdquo; So a regression metric summarises the <em>residuals</em>,
          and the two standard choices disagree about one thing only: how hard to punish a big miss.
        </>}
      />

      <div className="lesson">
        <p>
          The residual of a prediction is <M>{String.raw`r_i = y_i - \hat y_i`}</M>. Every regression metric
          is a way to boil the whole vector of residuals down to a single positive number. The two you&rsquo;ll
          meet everywhere:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{MAE} = \frac{1}{n}\sum_i |r_i|, \qquad \text{RMSE} = \sqrt{\frac{1}{n}\sum_i r_i^2}`}</M>
        </p>
        <p>
          <strong>MAE</strong> averages the absolute residuals: every dollar of error counts the same, so an
          MAE of 3.0 means &ldquo;typically off by 3, in the units of <M>y</M>.&rdquo; <strong>RMSE</strong>{" "}
          squares first, averages, then square-roots. The squaring is the whole story: a residual of 10
          contributes 100, a residual of 2 contributes 4. Big misses dominate the sum, so RMSE is{" "}
          <em>outlier-sensitive by design</em>. Both come out in the units of the target (unlike plain MSE,
          which is in units-squared and mainly used as a loss because it&rsquo;s smooth to differentiate).
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, you drag a single point far from the line. Which metric climbs faster — MAE or RMSE?</>}
          options={["MAE — absolute error adds up quickly", "RMSE — the squared term makes one big miss explode", "They rise identically; both are averages"]}
          nudge={<>Drag the outlier shift to the right and watch the two bars separate.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Start with the outlier shift at 0 (RMSE and MAE nearly equal). Drag it right and watch RMSE pull away from MAE — one bad point barely moves MAE but sends RMSE climbing.</>}
          insight={<>With no outlier the two metrics almost agree. Move one point far off and RMSE races ahead while MAE
            strolls — because the squared residual grows quadratically. That gap <em>is</em> the choice: RMSE if a single
            large error is genuinely much worse (a delivery ETA off by an hour, a dosage off by a lot); MAE if all errors
            scale linearly with cost and you don&rsquo;t want a few outliers to dominate the score. RMSE is always ≥ MAE.</>}
        >
          <ErrorMetricsLab />
        </LabFrame>

        <h2>Choosing between them</h2>
        <ul>
          <li>
            <strong>Reach for RMSE</strong> when large errors are disproportionately costly, or when you want
            the metric to agree with the squared-error loss the model was trained on. It&rsquo;s the default in
            most regression leaderboards for exactly that reason.
          </li>
          <li>
            <strong>Reach for MAE</strong> when your data has outliers you don&rsquo;t want to dominate the
            verdict, or when you need a number that&rsquo;s easy to explain (&ldquo;median-ish typical
            error&rdquo;). MAE is to RMSE what the median is to the mean: more robust.
          </li>
        </ul>
        <p>
          It&rsquo;s the same lesson as the classification pillar in a new costume: the metric encodes an
          assumption about what a mistake costs. RMSE assumes cost grows faster than linearly with error size;
          MAE assumes it grows linearly. Neither is &ldquo;more correct&rdquo; — pick the one whose assumption
          matches your problem, and report both if you&rsquo;re unsure.
        </p>

        <Callout color={ACCENT} title={<>The one-line rule</>}>
          Both measure typical residual size in the target&rsquo;s units. RMSE squares, so it fears big misses;
          MAE doesn&rsquo;t, so it shrugs at outliers. Large gap between them on your test set? You have outliers —
          that gap is itself a diagnostic worth reading.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A house-price model has MAE $12k but RMSE $47k. The most likely explanation is…",
              options: [
                "A bug — RMSE can't exceed MAE",
                "A handful of houses with very large prediction errors are inflating RMSE",
                "The model is unbiased",
              ],
              answer: 1,
              explain: "RMSE ≥ MAE always, and a large gap signals a few big residuals. The squared term lets those outliers dominate RMSE while MAE stays modest — a sign to investigate those specific predictions.",
            },
            {
              q: "You're predicting delivery times and being 60 minutes late is far worse than being 5 minutes late four times over. Which metric fits?",
              options: ["MAE — treat every minute equally", "RMSE — punish the one big miss more heavily", "Neither; use accuracy"],
              answer: 1,
              explain: "When a single large error is disproportionately costly, RMSE's quadratic penalty matches your real cost. MAE would rate the one 60-min miss the same as several small ones.",
            },
            {
              q: "Why is RMSE usually preferred over plain MSE for reporting?",
              options: [
                "RMSE is in the same units as the target, so it's interpretable",
                "RMSE is always smaller",
                "MSE can be negative",
              ],
              answer: 0,
              explain: "MSE is in squared units (dollars², minutes²) — hard to interpret. Taking the square root returns to the target's units. MSE stays popular as a training loss because it's smooth; RMSE is the readable report of the same quantity.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/cost-sensitive-thresholds", label: <>← Cost-sensitive thresholds</> }}
          next={{ href: "/learn/evaluation/r-squared", label: <>Next up · R² &amp; adjusted R² →</> }}
        />
      </div>
    </article>
  );
}
