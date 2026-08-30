import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LeakageLab } from "@/components/labs/LeakageLab";

export const metadata = {
  title: "The many faces of leakage — Manifold",
  description:
    "Four distinct kinds of leakage, each with its own tell and its own fix — measured: a feature selector fitted outside the fold reports 0.878 accuracy on data containing no signal at all.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const FACES: { name: string; what: string; tell: string; fix: string; measured?: string }[] = [
  {
    name: "Target leakage",
    what: "a feature that is a consequence of the target, or the target renamed",
    tell: "one feature dominates the importances; performance far exceeds expert expectation",
    fix: "the time-travel test on every feature, and a hard look at anything above 0.95 correlation",
  },
  {
    name: "Preprocessing leakage",
    what: "a transform fitted on data that includes the validation rows — scaler, imputer, selector, encoder",
    tell: "nothing. This one is silent, which is what makes it the most common",
    fix: "every fitted step inside a Pipeline, so it is refitted in each fold",
    measured: "0.878 reported where the truth is 0.500",
  },
  {
    name: "Group leakage",
    what: "the same entity on both sides of the split, so recognition passes for generalisation",
    tell: "performance drops sharply when you switch to a grouped split — and nothing before that",
    fix: "GroupKFold on the entity from your framing contract's unit line",
    measured: "R² 0.569 → 0.044",
  },
  {
    name: "Temporal leakage",
    what: "training on rows from after the rows you test on, in data that has a direction",
    tell: "the model does well offline and degrades immediately in production",
    fix: "forward-chaining splits; never shuffle time-ordered data",
    measured: "R² 0.396 → −0.220",
  },
];

export default function LeakagePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Data quality & leakage", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 10 minutes"
        title={<>The many faces of leakage</>}
        intro={<>Leakage is not one bug. It is four different bugs that share a symptom — an offline number that
          production will not honour — and they have four different tells and four different fixes.</>}
      />

      <div className="lesson">
        <h2>The definition worth memorising</h2>
        <p>
          <strong>Leakage is your model having access to information it will not have when it is asked.</strong>{" "}
          Information about the specific rows you are testing on, information from the future, information that
          exists only because the outcome already happened. Every variety below is that one sentence wearing a
          different disguise.
        </p>
        <p>
          The reason it deserves a chapter rather than a warning box is that <strong>leakage never raises an
          error and always improves your score.</strong> Every other class of bug makes something look worse.
          This one makes everything look better, which means the feedback you get for introducing it is positive.
        </p>

        <h2>The four faces</h2>
        <div style={{ display: "grid", gap: 9, margin: "1.3rem 0" }}>
          {FACES.map((f, i) => (
            <div key={f.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: GRAY }}>{i + 1}. {f.name}</span>
                {f.measured && (
                  <span style={{ fontSize: 11, color: "var(--bad)" }}>measured: {f.measured}</span>
                )}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55 }}>{f.what}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 3 }}><strong>Tell:</strong> {f.tell}.</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 2 }}><strong>Fix:</strong> {f.fix}.</div>
            </div>
          ))}
        </div>

        <h2>The silent one, measured</h2>
        <p>
          Target leakage announces itself. Group and temporal leakage announce themselves the moment you try the
          correct split. Preprocessing leakage does neither, and it is written by careful people following what
          look like reasonable steps: select the most informative features, then cross-validate the model on them.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>100 rows, 2,000 columns of pure random noise, labels generated by coin flips. You pick the 20 features most associated with the label, then run 5-fold cross-validation on those 20. What does CV report?</>}
          options={[
            "About 0.50 — there is genuinely nothing to learn",
            "Somewhat above 0.50, inflated by the small sample",
            "Around 0.88 — a strong, entirely fabricated result",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Leave it on the leaky setting and drag the slider from 50 features up to 5,000. Then switch to the pipeline version and drag it again.</>}
          insight={<>The honest curve never leaves chance — <strong>0.501 at p=50, 0.495 at p=5,000</strong> — because there is nothing there. The leaky curve climbs from <strong>0.636 to 0.878</strong>. Every point of that is manufactured, and the mechanism is the giveaway: the illusion grows with the number of features you let the selector examine, because a bigger search finds a better accident.</>}
        >
          <LeakageLab />
        </LabFrame>

        <p>
          The bug is precise. The selector looked at all 100 labels, including the 20 in each test fold, and kept
          the columns that happened to align with them. By the time cross-validation ran, the test folds had
          already contributed to choosing the features, so the &ldquo;held-out&rdquo; rows were not held out. The
          model then honestly reports how well those pre-selected columns fit — which, on data chosen for fitting
          them, is very well.
        </p>

        <Callout color={GRAY} title={<>Why the illusion grows with p</>}>
          With more columns of noise, the best accidental alignment with the labels gets better — this is the
          same mechanism as the selection optimism in the{" "}
          <Link href="/learn/model-selection/the-selection-trap" style={link}>model selection pillar</Link>, and{" "}
          <Link href="/learn/learning-theory/the-union-bound-argument" style={link}>learning theory prices it
          exactly</Link>: searching <em>M</em> options costs about{" "}
          <span style={{ whiteSpace: "nowrap" }}>√(ln M / 2n)</span> of optimism. High-dimensional data does not
          make this bug more likely, it makes it more <em>rewarding</em> — which is exactly backwards from what
          you want.
        </Callout>

        <h2>Anything fitted is a leak risk</h2>
        <p>
          The useful generalisation: <strong>every step that learns a parameter from the data must learn it from
          the training rows only.</strong> Not just the model. The list is longer than people expect:
        </p>
        <ul>
          <li><strong>Scalers</strong> — the mean and standard deviation are parameters</li>
          <li><strong>Imputers</strong> — the fill value is a parameter</li>
          <li><strong>Encoders</strong> — the category list is a parameter, and target encoding is a parameter
            computed from <em>y</em>, which makes it the most dangerous of all</li>
          <li><strong>Feature selectors</strong> — the chosen subset is a parameter, as measured above</li>
          <li><strong>Resamplers</strong> — SMOTE applied before the split copies training rows into test</li>
          <li><strong>Discretisers and binners</strong> — the bin edges are parameters</li>
          <li><strong>Dimensionality reduction</strong> — PCA components are parameters fitted on data</li>
        </ul>

        <h2>The other three, briefly</h2>
        <p>
          <strong>Group leakage</strong> is covered in{" "}
          <Link href="/learn/data-workflow/the-unit-of-analysis" style={link}>what is one row?</Link> — the 0.569
          to 0.044 collapse. <strong>Target leakage</strong> is covered in{" "}
          <Link href="/learn/data-workflow/what-you-know-at-prediction-time" style={link}>what you know at
          prediction time</Link>. <strong>Temporal leakage</strong> is worth one number here: on 1,200
          time-ordered rows where the effect of a variable drifts from +2 to −2, a random 75/25 split reports{" "}
          <strong>R² 0.396</strong>. Train on the past and test on the future — which is the only thing production
          ever does — and it is <strong>−0.220</strong>, worse than predicting the mean.
        </p>
        <p>
          That gap is the whole argument for time-aware splitting, and note what it is <em>not</em>: it is not
          that the model is bad. It is that a random split let it interpolate between surrounding months instead
          of extrapolating forward, and interpolation is not the task.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/outliers-and-influence", label: <>← Outliers &amp; influence</> }}
          next={{ href: "/learn/data-workflow/pipelines-and-the-fold", label: <>Next up · Pipelines &amp; the fold →</> }}
        />
      </div>
    </article>
  );
}
