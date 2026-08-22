import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Loss functions & robustness — Manifold",
  description:
    "The gradient view means you choose the loss to match the job: squared error for clean data, absolute error and Huber for outliers, the pinball loss for quantiles. Under 3% gross label corruption, squared-error boosting collapses to R² 0.23 while Huber holds 0.81.",
};

const TREES = "var(--c-trees)";

export default function LossFunctionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Loss functions &amp; robustness</>}
        intro={<>
          The whole payoff of the gradient reframing is <em>freedom of loss</em>. Because a tree only ever fits
          the negative gradient, you can pick whatever loss matches your problem&rsquo;s error structure — and the
          choice has real, measurable consequences.
        </>}
      />

      <div className="lesson">
        <h2>The regression losses and their gradients</h2>
        <p>
          Remember: the loss enters gradient boosting only through its negative gradient (the pseudo-residual the
          next tree chases) and the leaf line-search. So each loss is really a rule for &ldquo;what counts as the
          error to fix.&rdquo;
        </p>
        <ul style={ul}>
          <li>
            <strong>Squared error</strong> <M>{String.raw`\tfrac12(y-F)^2`}</M> → gradient <M>{String.raw`-(y-F)`}</M>,
            the raw residual. The next tree chases errors <em>in proportion to their size</em>, so a single huge
            residual dominates. Optimal for clean, Gaussian-ish noise; fragile to outliers.
          </li>
          <li>
            <strong>Absolute error</strong> <M>{String.raw`|y-F|`}</M> → gradient <M>{String.raw`-\operatorname{sign}(y-F)`}</M>,
            just <M>{String.raw`\pm 1`}</M>. Every error counts the <em>same</em> regardless of magnitude, so one
            monstrous outlier pulls no harder than a small miss. Fits the conditional <strong>median</strong>.
          </li>
          <li>
            <strong>Huber</strong> — squared for small residuals, linear beyond a threshold <M>{String.raw`\delta`}</M>.
            It is quadratic where that&rsquo;s efficient and linear where that&rsquo;s robust: the best of both,
            and the usual default when you suspect outliers.
          </li>
          <li>
            <strong>Pinball / quantile loss</strong> <M>{String.raw`\rho_\tau`}</M> → fits a chosen{" "}
            <em>quantile</em> <M>{String.raw`\tau`}</M> instead of the mean. Fit <M>{String.raw`\tau=0.05`}</M> and{" "}
            <M>{String.raw`0.95`}</M> and you get a 90% <Link href="/learn/random-forests/quantile-regression-forests" style={link}>prediction
            interval</Link> — the boosting route to uncertainty.
          </li>
        </ul>
        <MathBlock>{String.raw`\rho_\tau(r) = \begin{cases} \tau\, r & r \ge 0 \\ (\tau-1)\, r & r < 0 \end{cases} \qquad r = y - F`}</MathBlock>

        <h2>Robustness, measured</h2>
        <p>
          To see it bite, take the California housing training set and <strong>grossly corrupt 3% of the
          labels</strong> (multiply their target by 8 — think fat-fingered data entry), then evaluate on the
          clean test set. Same model, three losses:
        </p>
        <CodeOutput label="R² on clean test data after 3% of training labels corrupted">{`  loss = squared_error    test R²  0.226
  loss = absolute_error   test R²  0.794
  loss = huber            test R²  0.811`}</CodeOutput>
        <p>
          Squared-error boosting is <strong>wrecked</strong> — R² falls from 0.815 to 0.226, because each
          poisoned point produces an enormous residual that the trees chase relentlessly, bending the whole model
          toward the noise. Absolute error barely notices (0.794): a corrupted point contributes a gradient of
          just <M>{String.raw`\pm 1`}</M>, no louder than any other. Huber does best of all (0.811), staying
          quadratic-efficient on the clean 97% while capping the damage from the poisoned 3%.
        </p>

        <Callout color={TREES} title={<>The practical rule</>}>
          Default to <strong>squared error</strong> when your data is clean and you want the conditional mean.
          Switch to <strong>Huber</strong> (or absolute error) the moment you suspect heavy tails or label
          errors — it is nearly free insurance. Reach for the <strong>pinball loss</strong> when you need
          intervals or an asymmetric penalty (e.g. under-forecasting demand costs more than over-forecasting).
          The model, the trees, the tuning — all identical; only the loss changes.
        </Callout>

        <h2>Classification uses log-loss</h2>
        <p>
          For classification the loss of choice is the <strong>logistic / log-loss</strong> (a.k.a. binomial or
          multinomial deviance), the same one behind <Link href="/learn/logistic-regression" style={link}>logistic
          regression</Link>. It is preferred over AdaBoost&rsquo;s exponential loss precisely because its penalty
          for a badly-misclassified point grows only <em>linearly</em> rather than exponentially, making it far
          more tolerant of the mislabelled examples that wrecked squared-error above. That gentler tail is why
          essentially every modern gradient booster classifies with log-loss — the mechanics of which are the
          next page.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/gbm-regression", label: <>← Gradient boosting for regression</> }}
          next={{ href: "/learn/boosting/gbm-classification", label: <>Next up · Gradient boosting for classification →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
