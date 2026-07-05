import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { CREDIT_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

// Real numbers from scripts/logit_tier2.py (seed 42). Raw coef, then per-SD.
const ROWS: { name: string; raw: number; std: number; sd: string }[] = [
  { name: "util", raw: 3.573, std: 0.681, sd: "0.19" },
  { name: "prior", raw: 0.762, std: 0.539, sd: "0.71" },
  { name: "income", raw: -0.022, std: -0.487, sd: "22.0" },
  { name: "age", raw: -0.013, std: -0.136, sd: "10.5" },
];

const code = `from sklearn.preprocessing import StandardScaler

# same model, but on standardized features (each rescaled to mean 0, SD 1)
Xs = StandardScaler().fit_transform(X)
clf = LogisticRegression(penalty=None, max_iter=5000).fit(Xs, y)

for name, b in sorted(zip(feature_names, clf.coef_[0]), key=lambda t: -abs(t[1])):
    print(f"{name:8s} std coef={b:+.3f}   (per 1 standard deviation)")`;

export default function StandardizePage() {
  const maxRaw = 3.573, maxStd = 0.681;
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Standardize before you compare</>}
        intro={<>
          Raw coefficients answer &ldquo;per unit of this feature.&rdquo; But a unit of credit
          utilization and a unit of annual income are wildly different things — so comparing their
          coefficients directly is comparing nothing at all.
        </>}
      />

      <div className="lesson">
        <p>
          On the last page the <code>util</code> coefficient was 3.57 and <code>income</code> was
          −0.022 — a 160-fold difference that makes utilization look like the only feature that
          matters. It&rsquo;s an illusion of <em>units</em>. Utilization runs 0 to 1, so its
          &ldquo;one unit&rdquo; spans the entire range; income is measured in thousands, so its
          &ldquo;one unit&rdquo; ($1k) is a rounding error on a salary. A coefficient&rsquo;s size is
          half about the feature&rsquo;s importance and half about the yardstick you happened to
          measure it in.
        </p>

        <h2>Put every feature on the same ruler</h2>
        <p>
          The fix is <strong>standardization</strong>: rescale each feature to mean 0 and standard
          deviation 1 before fitting, so &ldquo;one unit&rdquo; always means &ldquo;one standard
          deviation — one typical amount of variation.&rdquo; Now the coefficients are comparable:
          each says how many log-odds a <em>typical swing</em> in that feature buys.
        </p>

        <CodeBlock setup={CREDIT_SETUP} fromScratch={code} />
        <CodeOutput>{`util     std coef=+0.681   (per 1 standard deviation)
prior    std coef=+0.539   (per 1 standard deviation)
income   std coef=-0.487   (per 1 standard deviation)
age      std coef=-0.136   (per 1 standard deviation)`}</CodeOutput>

        <p>
          The ranking survives — utilization still leads — but the story changes completely.
          Income, which looked negligible at −0.022, is actually the <em>third</em>-strongest
          driver, nearly as important as prior defaults. Its raw coefficient was tiny only because a
          dollar is a tiny unit. Here is the same four features drawn both ways:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "1.4rem 0" }} className="elbow-grid">
          <BarPanel title="Raw |coefficient|" rows={ROWS} pick={(r) => Math.abs(r.raw)} max={maxRaw} fmt={(r) => r.raw.toFixed(3)} />
          <BarPanel title="Standardized |coefficient|" rows={ROWS} pick={(r) => Math.abs(r.std)} max={maxStd} fmt={(r) => r.std.toFixed(3)} />
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: "-0.6rem" }}>
          Left: raw coefficients say utilization is everything and income is nothing. Right: on a
          common ruler, three features are in the same league. The left chart isn&rsquo;t wrong — it
          answers a different question (&ldquo;per raw unit&rdquo;), one nobody actually wants
          answered.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You standardize the features and refit. What happens to the model&rsquo;s <em>predictions</em> and accuracy?</>}
          options={["They change — standardization is a different model", "They're identical — only the coefficients' scale changes", "Accuracy always improves"]}
          nudge={<>Think about it: standardizing is an invertible linear rescale of each feature. The next callout confirms.</>}
        />

        <Callout color={ACCENT} title={<>Standardization doesn&rsquo;t change the model — only its units</>}>
          Rescaling features is an invertible linear change of variables. The fitted probabilities,
          accuracy, and log loss are <strong>identical</strong> whether or not you standardize; only
          the coefficients&rsquo; numeric values move (each divides by its feature&rsquo;s SD). So
          standardize freely for interpretation. The one case where it genuinely changes results is
          when a <em>penalty</em> is involved — regularization judges coefficients by size, so it
          must see them on a common scale first. That&rsquo;s the next chapter.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Feature A has raw coefficient 4.0 (range 0–1); feature B has raw coefficient 0.05 (range 0–500). Which more likely has the larger effect across its real range?",
              options: ["A, obviously — 4.0 ≫ 0.05", "B — 0.05 × a 500-wide range dwarfs 4.0 × a 1-wide range", "Impossible to say without standardizing"],
              answer: 1,
              explain: "Effect across the real range ≈ coefficient × range. A gives ~4 log-odds end to end; B gives ~25. Raw coefficient size alone is meaningless across different scales — standardize (or multiply by SD) to compare.",
            },
            {
              q: "After standardizing and refitting, the model's test accuracy…",
              options: ["Is identical to before", "Usually goes up", "Usually goes down"],
              answer: 0,
              explain: "Standardization is an invertible linear rescale — the decision boundary and every predicted probability are unchanged. Only the coefficients' numbers move. (Penalized models are the exception — see the next chapter.)",
            },
            {
              q: "A standardized coefficient of −0.49 for income means…",
              options: ["Each $1 of income lowers the log-odds by 0.49", "A one-standard-deviation rise in income (~$22k) multiplies the odds by e^−0.49 ≈ 0.61", "Income has almost no effect"],
              answer: 1,
              explain: "Standardized units are standard deviations. One typical swing in income (~$22k here) cuts the odds of default to about 61% — a substantial effect that the raw coefficient of −0.022 completely hid.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/coefficients-odds-ratios-effect-size", label: <>← Coefficients &amp; odds ratios</> }}
          next={{ href: "/learn/logistic-regression/statistical-significance-of-coefficients", label: <>Next up · Statistical significance →</> }}
        />
      </div>
    </article>
  );
}

function BarPanel({ title, rows, pick, max, fmt }: {
  title: string;
  rows: { name: string; raw: number; std: number; sd: string }[];
  pick: (r: { name: string; raw: number; std: number; sd: string }) => number;
  max: number;
  fmt: (r: { name: string; raw: number; std: number; sd: string }) => string;
}) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
      <div className="font-display" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "grid", gridTemplateColumns: "48px 1fr 52px", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{r.name}</span>
            <div style={{ height: 12, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(pick(r) / max) * 100}%`, height: "100%", background: "var(--c-classification)", borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--faint)", fontFamily: "var(--font-geist-mono, monospace)", textAlign: "right" }}>{fmt(r)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
