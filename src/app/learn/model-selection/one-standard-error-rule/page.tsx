import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The one-standard-error rule — Manifold",
  description:
    "Don't take the argmin of a noisy curve. Take the simplest model within one standard error of it. Measured on a real ridge path: a penalty 22× stronger, and test error that came out slightly better rather than worse.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// REAL values from scripts/model_selection_cases.py section 3
// (degree-9 polynomial ridge, 5-fold CV over 25 alphas, RS=0, sklearn 1.8.0).
const MIN = { alpha: 0.00100, cv: 0.1399, se: 0.0185, test: 0.1516 };
const ONE_SE = { alpha: 0.02154, cv: 0.1515, test: 0.1436 };

export default function OneSeRulePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "In practice", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 6 minutes"
        title={<>The one-standard-error rule</>}
        intro={<>A small discipline that follows directly from taking your own error bars seriously — and that
          quietly protects you from the selection trap every time you tune.</>}
      />

      <div className="lesson">
        <h2>The argmin is noisy</h2>
        <p>
          Your cross-validated error curve is not a curve. It is <M>k</M> fold-scores averaged at each point, each
          with real sampling noise, and the standard error of that average is
        </p>
        <MathBlock>{String.raw`\text{SE} \;=\; \frac{\text{sd of the } k \text{ fold scores}}{\sqrt{k}}`}</MathBlock>
        <p>
          When several hyperparameter values score within a standard error of each other, the one that happens to
          be lowest is lowest partly by luck. Taking its argmin is a small instance of the{" "}
          <Link href="/learn/model-selection/the-selection-trap" style={link}>selection trap</Link> — you are
          maximising over noise — and it systematically picks models that are <em>too complex</em>, because the
          complex end of the curve is where variance is highest and therefore where lucky low scores are most
          likely to appear.
        </p>

        <h2>The rule</h2>
        <p>
          Find the minimum of the CV curve. Compute its standard error. Then choose the{" "}
          <strong>simplest</strong> model whose CV score is within one standard error of that minimum:
        </p>
        <MathBlock>{String.raw`\lambda_{\text{1SE}} \;=\; \max\Big\{\lambda \;:\; \text{CV}(\lambda) \;\le\; \text{CV}(\lambda_{\min}) + \text{SE}(\lambda_{\min})\Big\}`}</MathBlock>
        <p>
          The logic: among models statistically indistinguishable from the best, prefer the simplest. You give up
          nothing you can actually measure, and you gain a model that is more stable, more interpretable, and less
          likely to have won by luck.
        </p>

        <h2>Measured on a real path</h2>
        <p>
          A degree-9 polynomial ridge on noisy sine data, 5-fold CV over 25 penalties, held-out test set kept
          aside (<code>scripts/model_selection_cases.py</code>):
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px", margin: "1.2rem 0" }}>
          <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.9 }}>
            <div>
              <strong>CV minimum</strong> — <M>{String.raw`\lambda = 0.00100`}</M> · CV MSE{" "}
              {MIN.cv.toFixed(4)} ± {MIN.se.toFixed(4)} · <strong>test MSE {MIN.test.toFixed(4)}</strong>
            </div>
            <div>
              <strong>one-SE choice</strong> — <M>{String.raw`\lambda = 0.02154`}</M> · CV MSE{" "}
              {ONE_SE.cv.toFixed(4)} · <strong style={{ color: "var(--good)" }}>test MSE {ONE_SE.test.toFixed(4)}</strong>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 4 }}>
              the rule picked a penalty <strong>22× stronger</strong> — a substantially simpler model
            </div>
          </div>
        </div>

        <p>
          The one-SE model has a <em>worse</em> CV score (0.1515 versus 0.1399) and a <em>better</em> test score
          (0.1436 versus 0.1516). That is the selection trap in miniature: the CV minimum was flattered by the
          same noise it was chosen for, and the honest test set didn&rsquo;t agree.
        </p>

        <Callout color={GRAY} title={<>Don't over-read this particular result</>}>
          We are showing you one run, and we should be precise about what it does and doesn&rsquo;t establish. The
          one-SE rule does <strong>not</strong> promise better test error — its claim is <em>comparable</em>{" "}
          performance from a simpler, more stable model, and on some datasets it will cost you a little. Here it
          happened to come out ahead, which is a plausible outcome rather than a demonstration of superiority. What
          the run <em>does</em> establish is the part that generalizes: a 22× difference in penalty was
          statistically invisible to the CV curve. When a decision that large lives inside your error bars, the
          argmin was never carrying the information you thought it was.
        </Callout>

        <h2>When to use it</h2>
        <ul>
          <li><strong>Use it</strong> whenever your CV curve is flat near the minimum — which, once you plot the error bars, is most of the time.</li>
          <li><strong>Use it</strong> when simplicity has independent value: interpretability, latency, fewer features to maintain in production.</li>
          <li><strong>Use it</strong> with <Link href="/learn/regularized-regression/lasso-for-feature-selection" style={link}>lasso</Link>, where it is close to standard practice and yields noticeably sparser models.</li>
          <li><strong>Skip it</strong> when the curve has a sharp, unambiguous minimum many standard errors below its neighbours — then the argmin is real signal, and the rule would just cost you.</li>
        </ul>
        <p>
          One habit worth adopting regardless of whether you apply the rule: <strong>plot the error bars</strong>.
          A CV curve without them invites you to believe in differences that aren&rsquo;t there, and most tuning
          plots you will see in the wild are drawn without them.
        </p>

        <PrevNext
          prev={{ href: "/learn/model-selection/learning-curves", label: <>← Reading learning curves</> }}
          next={{ href: "/learn/model-selection/when-data-isnt-iid", label: <>Next up · When your data isn&rsquo;t i.i.d. →</> }}
        />
      </div>
    </article>
  );
}
