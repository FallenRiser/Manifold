import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { DistributionLab } from "@/components/labs/DistributionLab";

export const metadata = {
  title: "One variable at a time — Manifold",
  description:
    "What the shape of a single column tells you to do: heavy tails, spikes at zero, ceilings, bimodality and sentinel values each imply a different action before any model is fitted.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const SHAPES: { shape: string; means: string; action: string }[] = [
  {
    shape: "Right-skewed with a long tail",
    means: "a multiplicative process — incomes, durations, counts of things people do",
    action: "consider a log transform for linear models; trees don't care. Report the median, not the mean",
  },
  {
    shape: "A large spike at exactly zero",
    means: "two processes mixed: whether it happened, and how much given that it did",
    action: "consider a two-part model, or a feature for 'is zero' alongside the amount",
  },
  {
    shape: "A hard ceiling with a pile-up against it",
    means: "the values are censored — the true value continues past the recorded maximum",
    action: "a censored model, or at minimum a flag; never treat the cap as a real value",
  },
  {
    shape: "Bimodal",
    means: "you are looking at two populations stacked on top of each other",
    action: "find the variable that separates them; it is usually more informative than this one",
  },
  {
    shape: "Isolated spikes at -1, 999, 9999",
    means: "sentinel codes for 'missing' that survived the export as numbers",
    action: "convert to NaN before anything else, or every statistic you compute is wrong",
  },
  {
    shape: "Suspiciously uniform",
    means: "often synthetic, defaulted, or a hash — real quantities are rarely uniform",
    action: "check the provenance before using it as a feature",
  },
];

export default function OneVariablePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Meeting the data", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 7 minutes"
        title={<>One variable at a time</>}
        intro={<>A univariate distribution is not a summary of a column. It is a description of the process that
          produced it — and each recognisable shape carries a specific instruction about what to do next.</>}
      />

      <div className="lesson">
        <h2>Shapes are evidence about mechanisms</h2>
        <p>
          Before it is a modelling input, a distribution is a fingerprint. Incomes are right-skewed because income
          grows multiplicatively. Time-to-event data piles up near zero and trails away because hazards compound.
          A spike at exactly one value is almost never nature; it is a default, a cap, or a sentinel.
        </p>
        <p>
          So the useful question is never &ldquo;is this normal?&rdquo; It is <em>what process would produce this
          shape, and does that process match what I believe about this column?</em> When the answer is no, you
          have found a data-quality problem, and you have found it in twenty seconds.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Push the exponential rate up and down, then switch to the Gaussian and try to make it look similar. Watch what happens to the gap between the mean (dashed) and the bulk of the mass.</>}
          insight={<>For the symmetric shapes the mean sits where the data sits. For the exponential it does not — the mean is dragged toward the tail and describes almost nobody. That single fact is why reporting a mean on skewed data misleads, why RMSE on a skewed target is dominated by a handful of rows, and why a log transform is so often the first thing to try.</>}
        >
          <DistributionLab />
        </LabFrame>

        <p>
          The lab shows the idealised families. Real columns are messier and are usually recognisable as one of
          these with something wrong bolted on — an exponential <em>with</em> a spike at zero, a Gaussian{" "}
          <em>with</em> a cliff where the recording device saturated.
        </p>

        <h2>Six shapes and what each one instructs you to do</h2>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {SHAPES.map((s) => (
            <div key={s.shape} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>{s.shape}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>Usually {s.means}.</div>
              <div style={{ fontSize: 12.5, color: GRAY, lineHeight: 1.55, marginTop: 3 }}>→ {s.action}.</div>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>The sentinel-value trap, because it is the one that silently corrupts everything</>}>
          A column with <M>{String.raw`-1`}</M> or <M>{String.raw`9999`}</M> standing in for &ldquo;unknown&rdquo;
          poisons every downstream number: the mean, the correlation, the scaler, the split of every tree. And it
          is invisible in a summary that reports only mean and standard deviation. It shows up instantly in a
          histogram or in <code>value_counts()</code> — which is the strongest single argument for looking at
          distributions rather than describing them.
        </Callout>

        <h2>The target column gets extra attention</h2>
        <p>
          Everything above applies double to <M>y</M>, because its shape propagates into your loss function and
          your metric rather than just your features.
        </p>
        <ul>
          <li><strong>Skewed target.</strong> Squared error is dominated by the tail — a handful of rows determine
            your model. Either that is what you want (large errors really are disproportionately costly) or it is
            not, and you should be modelling <M>{String.raw`\log y`}</M> or using MAE. This is a decision, not a
            convention; see <Link href="/learn/evaluation/rmse-vs-mae" style={link}>RMSE vs MAE</Link>.</li>
          <li><strong>Heavy imbalance.</strong> Accuracy is now nearly useless, and so is your intuition about
            what a good score looks like — the{" "}
            <Link href="/learn/data-workflow/start-with-a-baseline" style={link}>baseline page</Link> measures
            exactly how useless.</li>
          <li><strong>A ceiling.</strong> The housing capstone hits this: median house values capped at $500,001,
            with thousands of blocks piled against the cap. Ignoring it means confidently under-predicting every
            expensive neighbourhood. It is worked through in the{" "}
            <Link href="/learn/california-housing-capstone/censored-regression" style={link}>censored-regression
            page</Link>.</li>
        </ul>

        <h2>Percentiles beat summary statistics</h2>
        <p>
          If you look at one thing per numeric column, look at the percentile ladder — min, 1%, 25%, 50%, 75%,
          99%, max. It fits on one line, it survives skew, and the two ends do the work that a mean and standard
          deviation cannot: the gap between the 99th percentile and the max tells you instantly whether the
          extreme values are a smooth tail or a handful of impossible ones.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/eda-with-a-purpose", label: <>← EDA with a purpose</> }}
          next={{ href: "/learn/data-workflow/relationships-and-confounds", label: <>Next up · Relationships &amp; confounds →</> }}
        />
      </div>
    </article>
  );
}
