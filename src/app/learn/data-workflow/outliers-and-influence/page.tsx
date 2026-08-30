import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { InfluenceLab } from "@/components/labs/InfluenceLab";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "Outliers & influence — Manifold",
  description:
    "An outlier is not a value far from the others — it is a point whose removal changes your conclusion. The distinction between error, extreme and influence, and the only defensible reasons to delete a row.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const KINDS: { kind: string; example: string; action: string }[] = [
  {
    kind: "A recording error",
    example: "an age of 218, a price of −1, a timestamp in 2087",
    action: "fix if you can reconstruct it, otherwise set to missing and let the missing-data machinery handle it",
  },
  {
    kind: "A sentinel value",
    example: "999 meaning 'unknown', 0 meaning 'not measured'",
    action: "convert to NaN — this is a decoding bug, not an outlier at all",
  },
  {
    kind: "A different population",
    example: "wholesale orders in a table of retail ones",
    action: "exclude by an explicit rule that names the population, and record the rule in your framing contract",
  },
  {
    kind: "A genuine extreme",
    example: "the customer who really did spend £400,000",
    action: "keep it. It is the part of the distribution you most need to get right",
  },
];

export default function OutliersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Data quality & leakage", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 8 minutes"
        title={<>Outliers &amp; influence</>}
        intro={<>The standard advice — points more than three standard deviations out are outliers, remove them —
          is wrong twice over. It misidentifies which points matter, and it licenses deleting exactly the rows
          that carry the most information.</>}
      />

      <div className="lesson">
        <h2>Distance and influence are different things</h2>
        <p>
          A point can be far from the rest of the data and change nothing. A point can sit unremarkably inside the
          range of both variables and single-handedly determine your fitted slope. The property that matters is
          not distance, it is <strong>influence</strong>: how much your conclusion moves if the point is removed.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Drag the highlighted point straight up, near the middle of the x range, and watch the line. Then drag it back down and out to the far right, keeping it on the line. Finally drag it up from out there.</>}
          insight={<>Far from the centre in <em>x</em>, the point acts as a lever — a small vertical move swings the whole line. Near the centre it barely tilts anything, no matter how far up you drag it. Two points can be equally &ldquo;unusual&rdquo; and have completely different power over your model, and it is the horizontal position, not the vertical one, that decides which.</>}
        >
          <InfluenceLab />
        </LabFrame>

        <p>
          That is leverage, and it has a precise form. For simple regression, point <M>i</M>&rsquo;s leverage is
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`h_i = \frac{1}{n} + \frac{(x_i - \bar x)^2}{\sum_j (x_j - \bar x)^2}`}</M>
        </p>
        <p>
          — a function of <M>x</M> alone. The target never appears. A point can have huge leverage while sitting
          exactly on the trend, contributing nothing but stability; combine high leverage with a surprising{" "}
          <M>y</M> and you get a point that quietly rewrites your model. That combination is what Cook&rsquo;s
          distance measures, and it is the diagnostic worth reaching for instead of a z-score.
        </p>

        <Callout color={GRAY} title={<>The operational definition</>}>
          <strong>An outlier is a point whose removal changes your conclusion.</strong> If deleting it moves
          nothing that matters, it was never worth the argument. If deleting it moves your headline number, you
          have learnt something important — that your result depends on one row — and that is a finding to report,
          not a row to quietly drop.
        </Callout>

        <h2>Four kinds, four different actions</h2>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {KINDS.map((k) => (
            <div key={k.kind} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>{k.kind}</div>
              <div style={{ fontSize: 12.5, color: "var(--faint)", lineHeight: 1.5 }}>{k.example}</div>
              <div style={{ fontSize: 13, color: GRAY, lineHeight: 1.55, marginTop: 3 }}>→ {k.action}.</div>
            </div>
          ))}
        </div>
        <p>
          Only the first two are genuinely deletions, and both are really decoding fixes. The third is a
          population decision that belongs in your framing contract, where somebody can disagree with it. The
          fourth is the one people get wrong: <strong>the genuine extremes are usually why the project exists.</strong>{" "}
          The fraud is the outlier. The failure is the outlier. Trimming the tail to make the residual plot look
          nicer removes the phenomenon.
        </p>

        <DecisionPoint
          accent={GRAY}
          question={<>Your regression on house prices has three suburbs with enormous residuals — all genuinely expensive coastal areas. Removing them lifts R² from 0.66 to 0.74. What do you do?</>}
          options={[
            {
              label: "Keep them, and report that the model is weakest on high-value coastal areas",
              verdict: "best",
              response: <>The residuals are telling you something specific: the model lacks whatever feature explains coastal premiums. That is a <em>feature</em> finding, and acting on it (add distance-to-coast, add a location interaction) improves the model everywhere rather than just improving the number. Reporting the weak slice is also what makes the result usable — anyone pricing a coastal property now knows not to trust it.</>,
            },
            {
              label: "Keep them, but switch to a loss less sensitive to large errors",
              verdict: "close",
              response: <>Legitimate, and it changes the question you are answering. Huber or MAE will stop three suburbs from dominating the fit, which is right if you genuinely care about typical error more than total error. But it treats the symptom: the model still cannot price coastal property, you have just stopped it from distorting everything else. Do this <em>after</em> you have tried to explain the residuals, not instead.</>,
            },
            {
              label: "Remove them — they are unrepresentative and hurt the model",
              verdict: "miss",
              response: <>The R² went up because you deleted the hard cases, not because the model got better. It will still be asked to price coastal houses in production, and it will now be badly wrong about them with no warning in your offline metrics. This is the most common way a reported number and a deployed system come apart: the evaluation set was quietly redefined to exclude the difficulty.</>,
            },
          ]}
        />

        <h2>Robustness varies enormously by model</h2>
        <ul>
          <li><strong>Squared-error linear models</strong> are the most exposed — the loss grows quadratically, so
            one big residual can outweigh a hundred small ones.</li>
          <li><strong>Trees and forests</strong> barely care about extreme <M>x</M> values (they only use order)
            and are moderately affected by extreme <M>y</M> values in the leaves they land in.</li>
          <li><strong>Gradient boosting with squared loss</strong> is more exposed than a forest, because each
            round fits the residuals — and a huge residual gets chased hard. Switching to a Huber or quantile
            objective is the standard fix.</li>
          <li><strong>Distance-based methods</strong> (k-NN, k-means, SVMs with RBF kernels) are sensitive to
            extremes through the <em>scale</em> they induce, which is one more reason the{" "}
            <Link href="/learn/data-workflow/scaling-and-transforms" style={link}>scaling decision</Link> is not
            cosmetic.</li>
        </ul>
        <p>
          Which means &ldquo;should I remove outliers?&rdquo; has no model-independent answer. A point that would
          wreck an OLS fit may be entirely harmless to the gradient-boosted model you actually intend to ship.
        </p>

        <h2>The rule to leave with</h2>
        <p>
          Delete a row only when you can name the reason in the language of the data-generating process — it was
          mis-recorded, it is a sentinel, it belongs to a population you excluded on purpose. &ldquo;It was far
          from the others&rdquo; is not such a reason. And whatever rule you apply must be applicable at
          prediction time: if you trained without extremes, you have a model with no defined behaviour on the
          extremes it will certainly be shown.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/missing-data", label: <>← Missing data</> }}
          next={{ href: "/learn/data-workflow/the-many-faces-of-leakage", label: <>Next up · The many faces of leakage →</> }}
        />
      </div>
    </article>
  );
}
