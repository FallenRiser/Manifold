import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/capstone/DecisionPoint";

export const metadata = {
  title: "Capstone: Tobit & censored regression — Manifold",
  description:
    "Upgrade 2: the target is censored at 5.0, so OLS systematically under-estimates the true relationships. A Tobit model bakes the ceiling into its likelihood and recovers unbiased coefficients — income's effect jumps from 0.78 to 0.92.",
};

export default function CensoredRegressionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "Upgrade 2 · Censored target", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Upgrade 2 · Tobit & censored regression</>}
        intro={<>
          <strong>Diagnosis:</strong> the target is censored at 5.0 — 808 expensive blocks all recorded as the ceiling.
        OLS treats &ldquo;5.0&rdquo; as the truth, so it under-estimates every relationship. <strong>Fix:</strong> a model whose
        likelihood <em>knows</em> 5.0 is only a lower bound on those blocks&rsquo; real value.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <DecisionPoint
          question={<>808 blocks (4.9%) are pinned at exactly 5.0 — every one of them is really worth <em>at least</em> $500k, possibly far more. How do you handle them?</>}
          options={[
            {
              label: "Drop the capped rows and fit on the clean 95%",
              verdict: "miss",
              response: <>That&rsquo;s not removing noise — it&rsquo;s removing <em>the most expensive neighbourhoods in California</em>, systematically. The model would never see the top of the market, and its coefficients would be biased by the selective deletion instead of by the cap. Worse than the disease.</>,
            },
            {
              label: "Leave them — 5.0 is a fine approximation of “expensive”",
              verdict: "miss",
              response: <>OLS takes the 5.0 literally, and the clipped values flatten every slope — the coefficients attenuate toward zero. We measured it: the income effect reads 0.78 when its true value is 0.92. The model looks fine and quietly understates every relationship.</>,
            },
            {
              label: "Change the likelihood — tell the model 5.0 means “at least 5.0”",
              verdict: "best",
              response: <>That&rsquo;s the Tobit model, and it&rsquo;s this page. Censored rows contribute the <em>probability</em> that the latent value exceeds the cap, not a pretend-exact 5.0 — which recovers the un-attenuated coefficients. Match the model to the data-generating process.</>,
            },
          ]}
        />

        <h2>What censoring does to OLS</h2>
        <p>
          A block recorded at 5.0 might truly be worth 6, or 9 — we can&rsquo;t tell, only that it&rsquo;s <em>at least</em> 5.
          OLS takes the 5.0 literally and fits a line through it, which <strong>flattens the slope</strong>: the
          high-income, high-value blocks that should pull the line steeply upward are clipped, so OLS settles for a
          gentler fit. The coefficients are <strong>biased toward zero</strong> — attenuated. The fitted line looks
          fine on the censored data and quietly understates every real effect.
        </p>

        <h2>The Tobit model</h2>
        <p>
          A Tobit (censored regression) model posits a normal <em>latent</em> value{" "}
          <M>{String.raw`y^{*} = \mathbf{x}^\top\boldsymbol\beta + \varepsilon`}</M> that we observe only up to the
          cap: <M>{String.raw`y = \min(y^{*}, 5)`}</M>. Its likelihood treats the two kinds of rows differently —
          uncensored rows use the normal density, censored rows contribute the <em>probability</em> the latent value
          exceeded the cap:
        </p>
        <MathBlock>{String.raw`\mathcal{L} = \prod_{y_i < 5} \tfrac{1}{\sigma}\phi\!\Big(\tfrac{y_i - \mathbf{x}_i^\top\boldsymbol\beta}{\sigma}\Big) \prod_{y_i = 5} \Big[1 - \Phi\!\Big(\tfrac{5 - \mathbf{x}_i^\top\boldsymbol\beta}{\sigma}\Big)\Big]`}</MathBlock>
        <p>
          The second product is the key: instead of pretending a capped block equals 5, it rewards the model for
          placing <em>most of the latent distribution above</em> 5. Maximising this recovers the un-attenuated
          relationship. We fit it by maximum likelihood with a numerical optimizer.
        </p>

        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`Tobit MLE converged.   sigma = 0.674

standardized IncomeLevel coefficient:
   OLS   :  0.779
   Tobit :  0.916      <- +18%, the attenuation removed

the steeper slope is the TRUE income effect, freed from the cap`}</CodeOutput>

        <h2>What it buys — and what it doesn&rsquo;t</h2>
        <p>
          The income coefficient jumps from <strong>0.78 to 0.92</strong> (+18%), and the other effects steepen
          similarly. That&rsquo;s the payoff: <strong>unbiased coefficients</strong> — a truer picture of how income and
          location actually drive value, undistorted by the recording artifact. This matters enormously if the goal
          is <em>inference</em> (&ldquo;how much does income really move price?&rdquo;).
        </p>
        <p>
          What Tobit does <em>not</em> do is dramatically lower RMSE on the observed test data — because that data is
          censored too, so a model judged against clipped values can&rsquo;t show its full benefit on the usual metric.
          This is a subtle, important senior point: <strong>the right model isn&rsquo;t always the one with the best score
          on a flawed metric.</strong> Tobit is the correct tool for understanding the relationships; if pure predictive
          accuracy on censored data is the only goal, the next upgrade wins.
        </p>

        <Callout color="var(--c-regression)" title={<>Match the model to the data-generating process</>}>
          The deepest lesson here isn&rsquo;t Tobit specifically — it&rsquo;s that you model the process that <em>generated</em>
            the data, including how it was recorded. The cap isn&rsquo;t noise to ignore; it&rsquo;s a known mechanism, and a
            model that encodes it extracts truth that OLS structurally cannot. Spotting &ldquo;this needs a censored model&rdquo;
            is the kind of judgement that separates someone who runs algorithms from someone who does statistics.
        </Callout>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/spatial-features", label: <>← Upgrade 1: spatial features</> }} next={{ href: "/learn/california-housing-capstone/gradient-boosting", label: <>Next up · Upgrade 3: gradient boosting →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

U = 5.0                                   # the upper censoring limit
censored = (y >= 4.9999)
Xc = np.c_[np.ones(len(y)), X_std]        # add intercept

def neg_log_likelihood(params):
    beta, sigma = params[:-1], np.exp(params[-1])
    mu = Xc @ beta
    ll_obs = norm.logpdf(y, mu, sigma)                 # uncensored rows
    ll_cen = norm.logsf((U - mu) / sigma)              # P(latent >= U)
    return -np.sum(np.where(censored, ll_cen, ll_obs))

res = minimize(neg_log_likelihood, x0_from_ols, method="L-BFGS-B")
beta_tobit = res.x[:-1]
print("Tobit income coef:", beta_tobit[1].round(3),
      " vs OLS:", ols_income_coef.round(3))`;

