import { M } from "@/components/Math";
import { SigmoidLab } from "@/components/labs/SigmoidLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { CodeBlock } from "@/components/CodeBlock";
import { LOGISTIC_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LOG_DONE, LOG_TOTAL } from "@/lib/logisticRegressionTrack";

const ACCENT = "var(--c-classification)";

const codeLinFail = `import numpy as np
from sklearn.linear_model import LinearRegression

# y is 0 or 1 — what if we just fit a line to the labels?
lin = LinearRegression().fit(X_train, y_train)
y_hat = lin.predict(X_test)

print("smallest 'probability':", round(y_hat.min(), 2))
print("largest  'probability':", round(y_hat.max(), 2))
acc = ((y_hat > 0.5).astype(int) == y_test).mean()
print("accuracy if we threshold at 0.5:", round(acc, 3))`;

export const metadata = {
  title: "From numbers to categories — Manifold",
  description: "Linear regression predicts any number it likes. Classification needs a probability between 0 and 1 — and the sigmoid is the bridge.",
};

export default function LogisticHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: `In progress · ${LOG_DONE} of ${LOG_TOTAL} pages`, color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>From numbers to categories</>}
        intro={<>
          Spam or not. Default or repay. Disease or healthy. Half of applied machine learning is
          yes-or-no questions — and the most-used tool for them is a small, elegant twist on the
          regression you already know.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          accent={ACCENT}
          form={<>A line, squashed: <code>p = σ(w·x + b)</code></>}
          loss={<>Log loss — pay dearly for confident wrongness</>}
          optimiser={<>Gradient descent (no closed form this time)</>}
        />

        <h2>Why not just use a line?</h2>
        <p>
          Here&rsquo;s the obvious first move: code the two classes as 0 and 1, fit ordinary linear
          regression to those labels, and call anything above 0.5 a &ldquo;yes.&rdquo; It even sort
          of works. Run it:
        </p>

        <CodeBlock setup={LOGISTIC_SETUP} fromScratch={codeLinFail} />

        <p>
          On our two-feature dataset this scores <strong>86% accuracy</strong> — respectable. But
          look at the predictions themselves: they run from <strong>−0.53 to 1.10</strong>. What is
          a probability of −0.53? Of 1.10? The line doesn&rsquo;t know its output is supposed to
          <em> mean</em> something. And it gets worse: add one very obvious, far-away spam example
          to a spam dataset and the line tilts toward it, dragging the 0.5 crossing point and
          <em> changing verdicts on emails it already classified correctly</em>. Being extra-right
          about an easy case shouldn&rsquo;t change your mind about the hard ones.
        </p>
        <p>
          What we actually want is a curve that treats its output as a{" "}
          <strong>probability</strong>: always between 0 and 1, saturating flat near the extremes
          (once you&rsquo;re sure, more evidence barely moves you), and steep only in the undecided
          middle.
        </p>

        <h2>The sigmoid: a line, squashed</h2>
        <p>
          Logistic regression keeps the linear machinery — compute a score{" "}
          <M>{String.raw`z = w \cdot x + b`}</M> exactly as before — and then feeds that score
          through one extra function, the <strong>sigmoid</strong>:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\sigma(z) = \frac{1}{1 + e^{-z}}`}</M>
        </p>
        <p>
          Whatever number <M>z</M> is — 3, −40, a million — <M>{String.raw`\sigma(z)`}</M> lands
          strictly between 0 and 1. A big positive score becomes &ldquo;almost certainly class
          1,&rdquo; a big negative score &ldquo;almost certainly class 0,&rdquo; and a score of
          exactly zero becomes 0.5 — the model shrugging.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab below, <code>w</code> controls the curve&rsquo;s steepness. What does cranking <code>w</code> very high say about the model&rsquo;s personality?</>}
          options={["It becomes cautious — probabilities hug 0.5", "It becomes decisive — probabilities snap to 0 or 1", "Steepness doesn't change the probabilities"]}
          nudge={<>Locked in. Crank w to 5 in the lab and watch what happens to the probabilities between the two clouds.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Fit the S-curve: drag <code>w</code> and <code>b</code> until as few points as possible wear a red ring. Then hit snap-to-fitted and compare.</>}
          insight={<>Two things: the red-ringed points near the overlap are <em>unfixable</em> — the classes genuinely
            mix there, and no S-curve placement can separate them. And a very high <code>w</code> barely changes accuracy
            but sends log loss through the roof when it&rsquo;s wrong — a decisive model pays a decisive price for its
            mistakes. That trade is the next two pages.</>}
        >
          <SigmoidLab />
        </LabFrame>

        <h2>Despite the name, it&rsquo;s a classifier</h2>
        <p>
          The name &ldquo;logistic <em>regression</em>&rdquo; confuses everyone once: it&rsquo;s
          called that because it regresses a probability (a number!) — but that probability is then
          used to classify, so in practice it lives entirely in the classification world. It has
          been the workhorse of applied classification for decades: credit scoring, medical
          screening, click prediction, A/B test analysis. When someone at work says &ldquo;we ran a
          logit,&rdquo; this is what they ran.
        </p>

        <Callout color={ACCENT} title={<>The one-sentence version</>}>
          Logistic regression = linear regression&rsquo;s score, squashed through the sigmoid into
          a probability, trained with a loss that takes probabilities seriously. Same form, new
          loss — the anatomy strip above is the whole story.
        </Callout>

        <PrevNext next={{ href: "/learn/logistic-regression/the-sigmoid", label: <>Next up · The sigmoid →</> }} />
      </div>
    </article>
  );
}
