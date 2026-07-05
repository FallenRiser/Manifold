import { M } from "@/components/Math";
import { Term } from "@/components/Term";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "The sigmoid — Manifold",
  description: "Why this particular S-curve? Odds, log-odds, and the three properties that make the sigmoid the right squash for classification.",
};

export default function TheSigmoidPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>The sigmoid</>}
        intro={<>
          Of all the S-shaped curves in the world, why this one? Because the sigmoid isn&rsquo;t an
          arbitrary squash — it&rsquo;s what you get when a <em>line predicts the log-odds</em>.
        </>}
      />

      <div className="lesson">
        <h2>Three properties you already used</h2>
        <p>
          In the last lab you fit <M>{String.raw`\sigma(z) = 1/(1+e^{-z})`}</M> by hand. Three
          things made it workable, whether or not you noticed. It&rsquo;s{" "}
          <strong>bounded</strong>: outputs live strictly in (0, 1), so they can always be read as
          probabilities. It&rsquo;s <strong>monotonic</strong>: a higher score never lowers the
          probability, so &ldquo;more evidence for yes&rdquo; always means &ldquo;more yes.&rdquo;
          And it <strong>saturates</strong>: out in the tails the curve flattens, so once the model
          is nearly certain, another unit of score barely moves it — which is exactly why that
          far-away easy example stopped wrecking the fit.
        </p>
        <p>
          One more, for later: its derivative is{" "}
          <M>{String.raw`\sigma'(z) = \sigma(z)\,(1-\sigma(z))`}</M> — the slope of the curve is
          computable from its own output, no extra work. That little identity is why the gradient
          on the training page comes out so clean.
        </p>

        <h2>Where it comes from: odds, then log-odds</h2>
        <p>
          Gamblers don&rsquo;t speak in probabilities, they speak in{" "}
          <Term accent={ACCENT} def={<>The ratio of &ldquo;happens&rdquo; to &ldquo;doesn&rsquo;t&rdquo;: odds = p / (1 − p). Probability 0.75 means odds of 3 — three wins per loss. Probability 0.5 means odds of 1, &ldquo;even odds.&rdquo;</>}>odds</Term>:
          a 0.75 probability is &ldquo;3 to 1 on.&rdquo; Odds map probabilities from (0, 1) onto
          (0, ∞). Take the logarithm and you get the{" "}
          <Term accent={ACCENT} def={<>log-odds = log(p / (1 − p)), also called the logit. It runs over the whole number line: 0 means 50/50, +2.2 means about 90%, −2.2 about 10%. Every unit is a constant multiplicative bump to the odds.</>}>log-odds</Term>,
          which run over the <em>entire</em> number line — negative for &ldquo;probably not,&rdquo;
          zero at 50/50, positive for &ldquo;probably yes.&rdquo;
        </p>
        <p>
          That&rsquo;s the bridge. A linear score <M>{String.raw`w \cdot x + b`}</M> also runs over
          the entire number line. So logistic regression makes exactly one modelling claim:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\underbrace{\log \tfrac{p}{1-p}}_{\text{log-odds}} = w \cdot x + b`}</M>
        </p>
        <p>
          Solve that equation for <M>p</M> and the sigmoid falls out — you don&rsquo;t choose it,
          you <em>derive</em> it. The sigmoid is just &ldquo;undo the log-odds.&rdquo; This is also
          why the model is linear <em>somewhere</em>: not in probability space, but in log-odds
          space, where each feature contributes its steady <M>{String.raw`w_i`}</M> per unit.
        </p>

        <h2>What w and b mean now</h2>
        <p>
          This reading gives the knobs from the last lab their real names. The weight{" "}
          <strong>w is evidence strength</strong>: each unit of <M>x</M> adds <M>w</M> to the
          log-odds — equivalently, multiplies the odds by <M>{String.raw`e^{w}`}</M>. The bias{" "}
          <strong>b is the prior lean</strong>: what the log-odds are when every feature is zero.
          And the steepness you dragged? A large <M>w</M> means the probability sprints from
          &ldquo;no&rdquo; to &ldquo;yes&rdquo; over a tiny stretch of <M>x</M> — a model with
          strong opinions about a narrow boundary zone.
        </p>

        <Callout color={ACCENT} title={<>In an interview</>}>
          &ldquo;Why the sigmoid and not some other S-curve?&rdquo; → <em>Because logistic
          regression models the log-odds as linear in the features; inverting the log-odds gives
          the sigmoid exactly. Bonus points: it&rsquo;s also the natural (canonical) link for a
          Bernoulli outcome in the GLM framework, and its derivative σ(1−σ) makes the log-loss
          gradient identical in form to linear regression&rsquo;s.</em>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/logistic-regression", label: <>← From numbers to categories</> }}
          next={{ href: "/learn/logistic-regression/the-decision-boundary", label: <>Next up · The decision boundary →</> }}
        />
      </div>
    </article>
  );
}
