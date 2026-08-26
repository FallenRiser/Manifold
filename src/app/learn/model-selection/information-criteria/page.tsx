import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Information criteria: AIC, BIC & MDL — Manifold",
  description:
    "Fit plus a penalty for parameters, with no held-out data required. AIC and BIC look nearly identical and answer different questions — one predicts, one identifies — and knowing which you're asking decides which to use.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "1.2rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top" };

export default function InformationCriteriaPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capacity", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Information criteria: AIC, BIC &amp; MDL</>}
        intro={<>Structural risk minimization with a penalty you can compute in closed form and no data held out.
          Two of these differ by a single factor and answer genuinely different questions — which is the part worth
          getting right.</>}
      />

      <div className="lesson">
        <h2>The shape</h2>
        <p>
          Both criteria take the same form — goodness of fit, plus a penalty per parameter — and both are{" "}
          <em>minimised</em>:
        </p>
        <MathBlock>{String.raw`\text{AIC} = -2\ln \hat L + 2k \qquad\qquad \text{BIC} = -2\ln \hat L + k\ln n`}</MathBlock>
        <p>
          where <M>{String.raw`\hat L`}</M> is the maximised likelihood, <M>k</M> the number of free parameters,
          and <M>n</M> the sample size. The only difference is the price of a parameter: <strong>2 for AIC,{" "}
          <M>{String.raw`\ln n`}</M> for BIC</strong>. Since <M>{String.raw`\ln n > 2`}</M> whenever{" "}
          <M>{String.raw`n > 7`}</M>, BIC penalises complexity more heavily than AIC for any realistic dataset,
          and the gap widens with <M>n</M>: at <M>{String.raw`n = 10{,}000`}</M>, BIC charges 9.2 per parameter
          against AIC&rsquo;s 2.
        </p>

        <h2>They answer different questions</h2>
        <p>
          This is the part that gets muddled, and the distinction is genuinely useful:
        </p>

        <table style={table}>
          <thead>
            <tr><th style={th}></th><th style={th}>AIC</th><th style={th}>BIC</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>Asks</td>
              <td style={td}>&ldquo;which model predicts best?&rdquo;</td>
              <td style={td}>&ldquo;which model is <em>true</em>?&rdquo;</td>
            </tr>
            <tr>
              <td style={td}>Derived from</td>
              <td style={td}>estimating out-of-sample KL divergence</td>
              <td style={td}>approximating the Bayesian model evidence</td>
            </tr>
            <tr>
              <td style={td}>Assumes</td>
              <td style={td}>the true model may not be in your set</td>
              <td style={td}>the true model <em>is</em> in your set</td>
            </tr>
            <tr>
              <td style={td}>As <M>{String.raw`n \to \infty`}</M></td>
              <td style={{ ...td, color: "var(--muted)" }}>efficient — picks the best predictor, but keeps a nonzero chance of over-selecting</td>
              <td style={{ ...td, color: "var(--muted)" }}>consistent — picks the true model with probability → 1</td>
            </tr>
            <tr>
              <td style={td}>Tends to</td>
              <td style={td}>choose larger models</td>
              <td style={td}>choose smaller models</td>
            </tr>
          </tbody>
        </table>

        <p>
          So the choice isn&rsquo;t about taste. If you want the best forecasts and don&rsquo;t believe any
          candidate is literally correct — the normal situation in machine learning — <strong>AIC</strong> matches
          your goal. If you are doing science and genuinely believe one candidate is the data-generating process,
          and you want to identify it, <strong>BIC</strong> matches yours. Note the asymptotic properties are not
          rankings: AIC is not &ldquo;inconsistent&rdquo; through a defect but because it is optimising a different
          objective.
        </p>

        <h2>MDL: the same thing, in bits</h2>
        <p>
          The minimum description length principle says: <strong>the best model is the one that compresses your
          data most</strong>, counting the cost of transmitting the model itself.
        </p>
        <MathBlock>{String.raw`\text{total bits} \;=\; \underbrace{L(\text{model})}_{\text{describe the model}} \;+\; \underbrace{L(\text{data} \mid \text{model})}_{\text{describe the residuals}}`}</MathBlock>
        <p>
          A model too simple leaves large residuals that cost many bits to send. A model too complex costs many
          bits to describe. The optimum is the best compression — and under standard coding choices, MDL{" "}
          <em>recovers BIC exactly</em>. That is a satisfying convergence: a Bayesian argument and a
          coding-theoretic one land on the same formula, and it connects straight back to{" "}
          <M>{String.raw`\ln|\mathcal H|`}</M> as a bit count, which the{" "}
          <Link href="/learn/learning-theory/finite-hypothesis-classes" style={link}>learning theory track</Link>{" "}
          derives from the union bound. Three routes, one penalty.
        </p>

        <Callout color={GRAY} title={<>Why you'll still mostly use cross-validation</>}>
          Information criteria are fast — one fit, no held-out data — which is genuinely valuable when <M>n</M> is
          small or fits are expensive. But they need a <strong>likelihood</strong>, which rules out most of modern
          ML: random forests, gradient boosting, SVMs and neural networks have no clean one. And they need{" "}
          <M>k</M>, the number of free parameters, which is ill-defined the moment you regularize — a ridge model
          with 60 features doesn&rsquo;t have 60 free parameters, it has an{" "}
          <Link href="/learn/regularized-regression/degrees-of-freedom" style={link}>effective degrees of
          freedom</Link> that depends on <M>{String.raw`\lambda`}</M>. Cross-validation needs neither, which is
          why it dominates. Reach for AIC/BIC in the setting they were built for: parametric models, likelihoods
          available, data scarce.
        </Callout>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · Controlling capacity"
          questions={[
            {
              q: <>Why can&rsquo;t the ridge penalty <M>{String.raw`\lambda`}</M> be chosen by minimising the training objective?</>,
              options: [
                "The training objective is non-convex in λ",
                "It is always minimised at λ = 0, since the unpenalized class contains all the others",
                "λ only affects the penalty term, which isn't part of the loss",
              ],
              answer: 1,
              explain: <>Smaller <M>{String.raw`\lambda`}</M> means a larger class, and a larger class always fits the training data at least as well. So the training answer is <M>{String.raw`\lambda = 0`}</M> regardless of the data — a constant, carrying no information. That is precisely what makes <M>{String.raw`\lambda`}</M> an outer-loop parameter needing held-out data.</>,
            },
            {
              q: <>You have 10,000 observations and are comparing nested linear models. BIC charges about 9.2 per parameter and AIC charges 2. Which should you use to get the best <em>predictions</em>?</>,
              options: [
                "BIC — the heavier penalty is more conservative and safer",
                "AIC — it estimates out-of-sample predictive loss, which is the question being asked",
                "Whichever gives the smaller model, since simpler is better",
              ],
              answer: 1,
              explain: <>AIC targets predictive performance by estimating out-of-sample KL divergence; BIC targets identifying the true model under the assumption it is among your candidates. Since the question specifies prediction, AIC matches. &ldquo;More conservative is safer&rdquo; isn&rsquo;t a criterion — BIC&rsquo;s smaller models are the <em>right</em> answer to a different question.</>,
            },
            {
              q: <>In what sense is early stopping a form of capacity control rather than just saving time?</>,
              options: [
                "It isn't — it's purely a compute optimisation with a regularizing side effect",
                "The set of functions reachable in t gradient steps grows with t, so the step budget indexes a nested family of classes",
                "It reduces the number of parameters in the network",
              ],
              answer: 1,
              explain: <>Bounded step sizes mean bounded parameter travel, so <M>{String.raw`\mathcal H_1 \subset \mathcal H_2 \subset \cdots`}</M> indexed by <M>t</M> — a structure in the SRM sense. The parameter count never changes; the reachable set does. Hardt et al. make it a theorem: SGD&rsquo;s stability degrades with steps taken, so the generalization bound widens as you train.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/model-selection/early-stopping", label: <>← Early stopping</> }}
          next={{ href: "/learn/model-selection/learning-curves", label: <>Next up · Reading learning curves →</> }}
        />
      </div>
    </article>
  );
}
