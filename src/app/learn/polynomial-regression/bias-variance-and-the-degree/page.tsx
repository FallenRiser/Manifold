import { M, MathBlock } from "@/components/Math";
import { BiasVarianceLab } from "@/components/labs/BiasVarianceLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "Bias–variance & the degree — Manifold",
  description: "How flexible should the fit be? Too simple and it underfits; too flexible and it chases noise. The bias–variance decomposition turns that tension into a curve with a visible sweet spot.",
};

export default function BiasVarianceDegreePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 9 minutes"
        title={<>Bias–variance &amp; the degree</>}
        intro={<>
          Every knob in this track — polynomial degree, number of RBF bumps, number of knots — is really the same
          knob: <em>flexibility</em>. The bias–variance decomposition explains exactly why turning it too far in
          either direction hurts, and why the best setting sits in the middle.
        </>}
      />

      <div className="lesson">
        <h2>Two ways to be wrong</h2>
        <p>
          Imagine refitting your model on many fresh samples from the same source. Its expected error on a new
          point splits into three parts:
        </p>
        <MathBlock>{String.raw`\mathbb{E}\big[(y - \hat f(x))^2\big] = \underbrace{\big(\text{bias}\big)^2}_{\text{too rigid}} + \underbrace{\text{variance}}_{\text{too sensitive}} + \underbrace{\sigma^2}_{\text{irreducible noise}}.`}</MathBlock>
        <ul>
          <li>
            <strong>Bias</strong> is error from the model being too simple to represent the truth — a straight
            line fit to a curve is wrong <em>on average</em>, no matter how much data you give it.
          </li>
          <li>
            <strong>Variance</strong> is error from the model being too sensitive to the particular sample — a
            degree-15 fit lands somewhere wildly different each time the noise reshuffles.
          </li>
          <li>
            <strong>Irreducible noise</strong> <M>\sigma^2</M> is the floor: even the true function can&rsquo;t
            predict the random part of <M>y</M>. No model beats it.
          </li>
        </ul>

        <h2>Complexity trades one for the other</h2>
        <p>
          Here is the tension that makes model selection a real decision. Raising flexibility (higher degree, more
          bases) <strong>lowers bias</strong> — the model can bend to the truth — but <strong>raises
          variance</strong> — it also bends to the noise. Lowering flexibility does the reverse. You cannot drive
          both to zero; you can only balance them. Total error is their sum, so it traces a <strong>U</strong>:
          down as you escape underfitting, then up as you enter overfitting.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, slide the model complexity across its range. What shape does the <em>total</em> test error trace?</>}
          options={[
            "A U — high at both extremes, minimum at an intermediate complexity",
            "Always decreasing — more complexity is always better",
            "Always increasing",
          ]}
          nudge={<>Watch bias fall and variance rise as you slide right; their sum is the U.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide complexity from low to high. Watch bias² fall while variance climbs, and total error dip to a minimum before rising again. Find the complexity at the bottom of the U.</>}
          insight={<>At low complexity bias dominates (underfitting); at high complexity variance dominates (overfitting); the
            minimum total error sits between them. That bottom-of-the-U is the flexibility your data can support — enough to
            capture the signal, not so much that you fit the noise. Crucially it depends on how much data you have: more data
            suppresses variance, pushing the sweet spot toward higher complexity.</>}
        >
          <BiasVarianceLab />
        </LabFrame>

        <h2>Why you can&rsquo;t just eyeball it</h2>
        <p>
          The trap from the Runge page returns in general form: <strong>training error is not the U</strong>. It
          falls monotonically as complexity rises — a degree-15 fit has lower training error than degree-3, every
          time — so optimising it always picks the most complex model, i.e. maximum overfitting. Only error on{" "}
          <em>held-out</em> data shows the upward right arm of the U. That&rsquo;s why choosing complexity requires
          validation, not the training loss — the subject of the very next page.
        </p>

        <Callout color={ACCENT} title={<>One knob, one U, for every basis</>}>
          Polynomial degree, RBF count, spline knots, smoothing <M>\lambda</M> — all the same flexibility dial,
          all producing the same bias–variance U. Underfit on the left, overfit on the right, sweet spot in the
          middle, and the sweet spot moves right as you collect more data. Model selection is just finding the
          bottom of that U honestly.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A model that's too simple (e.g. a line for a curved trend) suffers mainly from…",
              options: ["High variance", "High bias — it's wrong on average no matter the sample", "Irreducible noise"],
              answer: 1,
              explain: "An underpowered model can't represent the true shape, so it's systematically off — high bias. More data won't rescue it; only more flexibility will.",
            },
            {
              q: "As you increase polynomial degree, bias and variance move…",
              options: [
                "Both down",
                "Bias down, variance up — total error traces a U",
                "Both up",
              ],
              answer: 1,
              explain: "More flexibility reduces bias (can fit the truth) but increases variance (also fits the noise). Their sum plus irreducible noise is U-shaped, with the minimum at an intermediate complexity.",
            },
            {
              q: "Why is training error useless for picking the degree?",
              options: [
                "It's expensive to compute",
                "It falls monotonically with complexity, so it always favours the most complex (overfit) model",
                "It only works for classification",
              ],
              answer: 1,
              explain: "Training error keeps dropping as you add flexibility — it never shows the overfitting arm of the U. Only held-out (validation) error reveals the upturn, which is why you validate.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/natural-and-smoothing-splines", label: <>← Natural &amp; smoothing splines</> }}
          next={{ href: "/learn/polynomial-regression/choosing-the-number-of-bases", label: <>Next up · Choosing the number of bases →</> }}
        />
      </div>
    </article>
  );
}
