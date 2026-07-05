import { QQPlotLab } from "@/components/labs/QQPlotLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { Backlinks } from "@/components/Backlinks";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

const codeScratch = `import numpy as np

rng = np.random.default_rng(4)
r = rng.standard_t(df=3, size=300)        # heavy-tailed residuals
n = len(r); m = r.mean(); s = r.std()

S = np.mean(((r - m)/s)**3)               # skewness
K = np.mean(((r - m)/s)**4)               # kurtosis
JB = n/6 * (S**2 + (K - 3)**2 / 4)        # Jarque-Bera statistic
print(f"skew {S:.2f}   kurtosis {K:.2f}   Jarque-Bera {JB:.1f}  (>6 => non-normal)")`;

const codeLib = `import numpy as np
from scipy import stats

rng = np.random.default_rng(4)
r = rng.standard_t(df=3, size=300)

jb, p_jb = stats.jarque_bera(r)
w,  p_sw = stats.shapiro(r)
print(f"Jarque-Bera: {jb:.1f}  p={p_jb:.5f}")
print(f"Shapiro-Wilk W: {w:.3f}  p={p_sw:.5f}")   # both p<0.05 => reject normality`;

export const metadata = {
  title: "Detecting non-normality — Manifold",
  description:
    "A practical guide to reading Q-Q plots, interpreting the Shapiro-Wilk test, and understanding when to care about non-normal residuals.",
};

export default function DetectingNonNormalityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Diagnostics", color: "var(--brand)" }]}
        time="about 4 minutes"
        title={<>Detecting non-normality</>}
        intro={<>
          Histograms are blocky and misleading in small samples. To definitively
        diagnose the distribution of your residuals, you need a Quantile-Quantile (Q-Q) plot.
        </>}
      />

      <Backlinks label="Related" items={[
        { label: "Normality of residuals", href: "/learn/linear-regression/normality-of-residuals" },
        { label: "Transformations", href: "/learn/linear-regression/transformations" },
        { label: "Outliers & influence", href: "/learn/linear-regression/outliers-leverage-influence" },
      ]} />

      <div className="lesson">
        <h2>How a Q-Q plot works</h2>
        <p>
          A Q-Q plot matches the quantiles of your actual residuals against the
          theoretical quantiles of a perfect normal distribution.
        </p>
        <ol style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15, marginBottom: "1.5rem" }}>
          <li>Sort your residuals from smallest to largest.</li>
          <li>For N points, calculate where the quantiles <em>should</em> be for a normal distribution.</li>
          <li>Plot the theoretical values on the x-axis, and your actual values on the y-axis.</li>
        </ol>
        <p>
          If your residuals are perfectly normal, the points will form a strict
          45-degree diagonal line. Deviations from that line tell a specific story.
        </p>

        <QQPlotLab />

        <h2>Reading the deviations</h2>
        <div style={readGrid}>
          <DevCard title="S-Shape (Heavy tails)" 
            body="Points bend up on the right and down on the left. This means your extremes are more extreme than a normal curve allows. Common in finance (leptokurtic)." />
          <DevCard title="Inverted S (Light tails)" 
            body="Points flatten out at the ends. The distribution is truncated or has thinner tails than normal. Rarely a problem for inference." />
          <DevCard title="U-Shape (Skewed)" 
            body="Points curve entirely above the line (right skew) or below (left skew). The errors lean heavily in one direction." />
        </div>

        <h2>Formal testing: Shapiro-Wilk</h2>
        <p>
          The Shapiro-Wilk test is the most powerful formal test for normality.
          The null hypothesis is that the data is normally distributed. A p-value
          &lt; 0.05 rejects the null, concluding the residuals are non-normal.
        </p>
        <p>
          <strong>However:</strong> Do not use it blindly. In very large samples
          (N &gt; 1000), Shapiro-Wilk has so much power that it will flag
          microscopic, utterly harmless deviations from perfect normality as
          "statistically significant". But remember the Central Limit Theorem:
          in large samples, non-normality doesn't matter anyway!
        </p>

        <Callout color="var(--c-fundamentals)" title={<>The golden rule of normality testing</>}>
          When N is small (where normality matters), Shapiro-Wilk is weak and
            might fail to detect issues. When N is large (where normality doesn't
            matter), it is too sensitive and will trigger false alarms. Always
            rely on the Q-Q plot and your knowledge of the sample size over the
            p-value of a formal test.
        </Callout>

        <h2>Test it yourself</h2>
        <p>
          The Jarque-Bera statistic rolls skew and kurtosis into one number; from
          scratch it&rsquo;s three lines. SciPy adds Shapiro-Wilk as a second opinion.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          title="Checkpoint · Diagnostics"
          questions={[
            {
              q: <>Which plot do you reach for first after fitting any regression?</>,
              options: ["Q–Q plot of the residuals", "Residuals vs fitted values", "Histogram of the target", "Coefficients bar chart"],
              answer: 1,
              explain: <>Residual-vs-fitted is the one plot that exposes the big three at a glance: curvature (non-linearity), a fan (heteroscedasticity), and stray extreme points (outliers). The other plots are follow-ups to what it shows you.</>,
            },
            {
              q: <>A point far from the others in x, but sitting exactly on the fitted line. It has:</>,
              options: ["High leverage, low influence — potential to move the line, unexercised", "High influence — it's dragging the line", "A large residual", "Nothing notable"],
              answer: 0,
              explain: <>Leverage is about being extreme in <em>x</em> (potential); influence = leverage actually exercised (Cook&rsquo;s distance ≈ leverage × residual). A high-leverage point that agrees with the trend moves nothing — but watch it: if its y drifts, the line follows.</>,
            },
            {
              q: <>On a Q–Q plot the points track the diagonal in the middle but bend away at both ends. That means:</>,
              options: ["Residuals are perfectly normal", "Heavy tails — extreme residuals are more common than the normal distribution predicts", "The model is non-linear", "Heteroscedasticity"],
              answer: 1,
              explain: <>Tail deviations on the Q–Q plot are heavy tails. Point estimates survive, but tail-sensitive claims — prediction intervals, small p-values — become optimistic. With big samples the CLT rescues coefficient inference; the intervals it doesn&rsquo;t.</>,
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/linear-regression/outliers-leverage-influence", label: <>← Outliers, leverage & influence</> }} next={{ href: "/learn/linear-regression/r-squared-and-adjusted", label: <>Next up · R² and adjusted R² →</> }} />
      </div>
    </article>
  );
}

function DevCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "12px 14px", borderLeft: "3px solid var(--warn)", background: "color-mix(in srgb, var(--warn) 3%, var(--surface))", borderRadius: "0 8px 8px 0" }}>
      <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}


const readGrid: React.CSSProperties = { display: "grid", gap: 10, margin: "1.4rem 0" };


