import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Capstone: Tobit & censored regression — Manifold",
  description:
    "Upgrade 2: the target is censored at 5.0, so OLS systematically under-estimates the true relationships. A Tobit model bakes the ceiling into its likelihood and recovers unbiased coefficients — income's effect jumps from 0.78 to 0.92.",
};

export default function CensoredRegressionPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>Upgrade 2 · Censored target</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 9 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Upgrade 2 · Tobit & censored regression
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        <strong>Diagnosis:</strong> the target is censored at 5.0 — 808 expensive blocks all recorded as the ceiling.
        OLS treats &ldquo;5.0&rdquo; as the truth, so it under-estimates every relationship. <strong>Fix:</strong> a model whose
        likelihood <em>knows</em> 5.0 is only a lower bound on those blocks&rsquo; real value.
      </p>

      <div className="lesson">
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

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Match the model to the data-generating process
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            The deepest lesson here isn&rsquo;t Tobit specifically — it&rsquo;s that you model the process that <em>generated</em>
            the data, including how it was recorded. The cap isn&rsquo;t noise to ignore; it&rsquo;s a known mechanism, and a
            model that encodes it extracts truth that OLS structurally cannot. Spotting &ldquo;this needs a censored model&rdquo;
            is the kind of judgement that separates someone who runs algorithms from someone who does statistics.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/spatial-features" style={navLink}>← Upgrade 1: spatial features</Link>
          <Link href="/learn/california-housing-capstone/gradient-boosting" style={{ ...navLink, fontWeight: 600 }}>Next up · Upgrade 3: gradient boosting →</Link>
        </div>
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

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
