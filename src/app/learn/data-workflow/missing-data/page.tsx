import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { MissingnessLab } from "@/components/labs/MissingnessLab";

export const metadata = {
  title: "Missing data — Manifold",
  description:
    "MCAR, MAR and MNAR, measured on real runs: why the mechanism decides whether your fix works, why you cannot tell MAR from MNAR in the data, and when a missingness flag is a free 0.07 of R².",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MissingDataPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Data quality & leakage", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 9 minutes"
        title={<>Missing data</>}
        intro={<>&ldquo;Fill it with the mean&rdquo; is not a default. It is a strong claim about why the value is
          absent — and whether that claim is true decides whether your fix repairs the problem or entrenches
          it.</>}
      />

      <div className="lesson">
        <h2>The absence is data</h2>
        <p>
          A blank cell records two things: that you do not know the value, and that <em>this row</em> is one where
          the value was not recorded. The second is often more informative than the first. Patients who skip the
          optional test differ from those who take it. Customers who leave the income field empty differ from
          those who fill it in. Treating a blank as a hole to be plugged discards that.
        </p>
        <p>
          So the first question is never &ldquo;what should I fill it with?&rdquo; It is{" "}
          <strong>&ldquo;what process removed it?&rdquo;</strong> There are three answers, they are not equally
          survivable, and the standard names are unhelpfully similar.
        </p>

        <h2>The three mechanisms</h2>
        <ul>
          <li><strong>MCAR</strong> — missing completely at random. Nothing about the row predicts the absence: a
            dropped packet, a smudged form. The observed rows are a fair sample of all rows.</li>
          <li><strong>MAR</strong> — missing at random. The absence depends on things you <em>did</em> record.
            Older patients skip the test more often, and you have age. The observed rows are biased, and the bias
            is explainable by columns you have.</li>
          <li><strong>MNAR</strong> — missing not at random. The absence depends on the missing value itself.
            High earners decline to state their income. The observed rows are biased in a way nothing you
            recorded can explain.</li>
        </ul>
        <p>
          The names are about what the missingness depends on, and everything downstream follows from that.
          Here is the mechanism made visible: which <em>values</em> of a column survived being recorded.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>Under MAR, the missingness depends only on x₂ — a column you fully observe. You impute x₁ by regressing it on x₂. Does that recover the true mean of x₁?</>}
          options={[
            "No — 40% of the data is gone, the estimate must stay biased",
            "Yes — the thing that caused the gap is observed, so it can be corrected for",
            "Only if x₁ and x₂ are uncorrelated",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Start on MCAR and note the bars are level. Switch to MAR, then MNAR, and watch the shape of the hole — then read the two mean estimates underneath before moving on.</>}
          insight={<>MCAR loses rows evenly, and the naive mean (<strong>0.0105</strong>) is fine. MAR tilts hard, the naive mean is <strong>−0.3451</strong> — but imputing x₁ from the observed x₂ brings it back to <strong>0.0123</strong>. MNAR tilts almost identically, the naive mean is <strong>−0.5001</strong>, and imputation only reaches <strong>−0.2961</strong>. The repair works exactly when the cause of the gap is something you recorded.</>}
        >
          <MissingnessLab />
        </LabFrame>

        <Callout color={GRAY} title={<>The uncomfortable part: MAR and MNAR look the same</>}>
          Compare the two survival curves in the lab. They tilt the same way, by nearly the same amount.{" "}
          <strong>Nothing in your data distinguishes them</strong> — the distinguishing information is precisely
          the values you do not have. Which mechanism you face is an assumption about the world, defended with
          domain knowledge, and every imputation method you choose inherits it. Anyone who tells you their
          pipeline &ldquo;handles missing data&rdquo; has made this assumption without saying so.
        </Callout>

        <h2>What each fix actually assumes</h2>
        <ul>
          <li><strong>Drop the rows.</strong> Unbiased under MCAR. Under MAR or MNAR you are analysing a biased
            subsample. It also throws away every other column in those rows, which is why it scored worst in every
            row of the prediction table above — <strong>0.7204 / 0.6049 / 0.5006</strong> against 0.77 / 0.75 /
            0.72 for imputation.</li>
          <li><strong>Mean or median fill.</strong> Cheap and it destroys the variance and every correlation
            involving that column. Reasonable for a column with 2% missing; a real distortion at 40%.</li>
          <li><strong>Model-based imputation</strong> (regression, kNN, iterative). Uses the other columns, which
            is exactly the MAR assumption written as code. It is the right default when you believe MAR — and it
            cannot rescue MNAR, as the −0.2961 shows.</li>
          <li><strong>Add a missingness indicator.</strong> Almost free, and the honest one: instead of pretending
            you know the value, you tell the model you do not. Under MNAR this is the only one of the four that{" "}
            <em>gained</em> anything — R² <strong>0.7157 → 0.7881</strong> from the flag alone, because being
            missing was itself a signal about the value. Under MCAR it added exactly nothing (0.7685 either way),
            which is precisely right: there, absence carries no information.</li>
        </ul>

        <Proof title="why the indicator helps under MNAR and not MCAR" color={GRAY}>
          <p>
            Write the model as <M>{String.raw`\hat y = \beta_1 \tilde x_1 + \beta_2 x_2 + \gamma m`}</M>, where{" "}
            <M>m = 1</M> when <M>{String.raw`x_1`}</M> is missing and{" "}
            <M>{String.raw`\tilde x_1`}</M> is the filled column — equal to <M>{String.raw`x_1`}</M> when
            observed and to the constant <M>c</M> when not.
          </p>
          <p>
            On the rows where <M>m = 1</M>, the term <M>{String.raw`\beta_1 \tilde x_1`}</M> is the constant{" "}
            <M>{String.raw`\beta_1 c`}</M> for every one of them. So <M>{String.raw`\gamma`}</M> is free to be
            whatever correction those rows need on average: the fitted model predicts{" "}
            <M>{String.raw`\beta_1 c + \gamma`}</M> plus the <M>{String.raw`x_2`}</M> term for missing rows, and{" "}
            <M>{String.raw`\beta_1 x_1`}</M> plus the <M>{String.raw`x_2`}</M> term for observed ones. The
            indicator has bought a <em>separate intercept for the missing subpopulation</em>.
          </p>
          <p>
            That is worth something exactly when the missing subpopulation has a different conditional mean of{" "}
            <M>y</M>. Under MNAR it does, by construction: rows are missing <em>because</em>{" "}
            <M>{String.raw`x_1`}</M> was large, and <M>y</M> increases in <M>{String.raw`x_1`}</M>, so{" "}
            <M>{String.raw`E[y \mid m=1] > E[y \mid m=0]`}</M> even after conditioning on{" "}
            <M>{String.raw`x_2`}</M>. The optimal <M>{String.raw`\gamma`}</M> is non-zero and the fit improves.
          </p>
          <p>
            Under MCAR the missing rows are a fair sample, so{" "}
            <M>{String.raw`E[y \mid m=1, x_2] = E[y \mid m=0, x_2]`}</M>, the population value of{" "}
            <M>{String.raw`\gamma`}</M> is zero, and the extra column can only add estimation variance. The
            measured 0.7685 versus 0.7685 is that zero, to four decimal places.
          </p>
          <p>
            Two consequences worth carrying: the indicator recovers a <em>level</em> shift, not the missing values
            themselves, so it repairs prediction rather than inference — the coefficient{" "}
            <M>{String.raw`\beta_1`}</M> stays biased. And it assumes the same missingness process will be present
            at prediction time. If the upstream system is fixed next quarter and the column starts arriving in
            full, the model has learnt a relationship that no longer exists.
          </p>
        </Proof>

        <h2>The practical procedure</h2>
        <ol>
          <li><strong>Quantify it</strong> per column and per row. A column that is 95% missing is usually a
            different decision (drop the column) from one that is 5% missing.</li>
          <li><strong>Look for structure.</strong> Are the same rows missing many columns at once? That is a
            failed batch or a different collection process, not independent gaps.</li>
          <li><strong>Ask why, out loud, with someone who knows the system.</strong> This is the step that
            determines the mechanism, and it cannot be done from the data.</li>
          <li><strong>Add the indicator</strong> whenever missingness is plausibly informative. It costs one
            column and it is the only fix that can help under MNAR.</li>
          <li><strong>Put the imputer in the pipeline</strong> so it is fitted inside the fold. An imputer fitted
            on all your data is a leak, and it is measured in{" "}
            <Link href="/learn/data-workflow/pipelines-and-the-fold" style={link}>two pages</Link>.</li>
        </ol>

        <Callout color={GRAY} title={<>One thing that is not on the list</>}>
          Deleting the column because it has missing values. Gradient-boosted trees handle missing values natively
          and often extract real signal from the pattern; the housing capstone&rsquo;s{" "}
          <Link href="/learn/california-housing-capstone/data-quality" style={link}>data-quality page</Link> is a
          worked example of a column being worth keeping in exactly this way. Drop a column because it is
          uninformative or unavailable at prediction time — not because it is inconvenient.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/data-workflow/sanity-checks", label: <>← Sanity checks that catch disasters</> }}
          next={{ href: "/learn/data-workflow/outliers-and-influence", label: <>Next up · Outliers &amp; influence →</> }}
        />
      </div>
    </article>
  );
}
