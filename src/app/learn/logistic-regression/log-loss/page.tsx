import { M } from "@/components/Math";
import { LogLossLab } from "@/components/labs/LogLossLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Term } from "@/components/Term";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Log loss — Manifold",
  description: "Why classification abandons squared error: log loss charges unboundedly for confident wrongness, and it keeps the training surface a clean bowl.",
};

export default function LogLossPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Log loss</>}
        intro={<>
          New model, new loss. Squared error served regression well — but the moment your output
          is a probability, it asks the wrong question. The right one: <em>how surprised were you
          by the truth?</em>
        </>}
      />

      <div className="lesson">
        <p>
          A weather app said 99% chance of sun; it poured on your wedding. Another app said 60%
          sun. Both were &ldquo;wrong,&rdquo; but not equally — the first one deserves most of the
          blame, because it was <em>certain</em>. A loss for probabilities has to encode that
          intuition: wrongness should be priced by how confidently you committed to it.
        </p>

        <h2>Charge for surprise</h2>
        <p>
          <Term accent={ACCENT} def={<>Also called cross-entropy or negative log-likelihood. For one example: −log(probability the model gave to what actually happened). Prediction 0.9 for something that happened costs 0.105; prediction 0.01 costs 4.6.</>}>Log loss</Term>{" "}
          does exactly that. For a single example, the charge is
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\ell = -\log\big(p_{\text{model gave to what happened}}\big)`}</M>
        </p>
        <p>
          Say the truth was class 1. Predict 0.9 and you pay <M>{String.raw`-\log 0.9 \approx 0.11`}</M> —
          nearly free. Predict 0.5, pay 0.69. Predict 0.01 — you said it almost couldn&rsquo;t
          happen, and it happened — pay 4.6. Predict exactly 0? The charge is <em>infinite</em>.
          There is no bottom. Squared error, by contrast, can never charge more than 1 for any
          single example, no matter how outrageous the confidence.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>The truth is class 1. Roughly where does log loss start charging <em>more</em> than squared error?</>}
          options={["Only below p ≈ 0.5", "Everywhere — it's always harsher", "Below about p ≈ 0.3, and then explosively"]}
          nudge={<>Locked in. Drag the slider from 0.99 down to 0.01 and watch the gap between the solid and dashed curves.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide the predicted probability from 0.99 down to 0.01 with the truth set to class 1, then flip the truth and do it again.</>}
          insight={<>The two losses agree that being right is cheap — they only part ways on confident wrongness, where
            squared error saturates at 1 while log loss climbs without limit. That unbounded left tail is the whole
            personality of logistic regression: it would rather stay humble at 0.7 than risk saying 0.99 and being wrong.</>}
        >
          <LogLossLab />
        </LabFrame>

        <h2>The formula you&rsquo;ll see in the wild</h2>
        <p>
          Averaged over a dataset, with <M>{String.raw`y_i \in \{0,1\}`}</M> and predicted
          probabilities <M>{String.raw`p_i`}</M>, both cases fold into one line —
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`L = -\frac{1}{n}\sum_{i=1}^{n}\Big[\,y_i \log p_i + (1-y_i)\log(1-p_i)\,\Big]`}</M>
        </p>
        <p>
          — read it as a switch: when <M>{String.raw`y_i = 1`}</M> only the first term survives,
          when <M>{String.raw`y_i = 0`}</M> only the second. Each example is charged −log of the
          probability the model gave the truth. You&rsquo;ll meet the same quantity under the
          names <em>cross-entropy</em> and <em>negative log-likelihood</em> — same formula, three
          communities.
        </p>

        <h2>The quieter reason: the bowl</h2>
        <p>
          There&rsquo;s a second, less obvious argument. If you train the sigmoid with{" "}
          <em>squared</em> error, the loss surface develops flat plateaus and non-convex bumps —
          in the saturated tails the sigmoid&rsquo;s slope is nearly zero, so gradient descent
          receives almost no signal exactly where the model is confidently wrong, the one place it
          most needs correcting. Log loss cancels that saturation (the log&rsquo;s steepness undoes
          the sigmoid&rsquo;s flatness) and the surface becomes{" "}
          <Term accent={ACCENT} def={<>A convex surface is a single bowl: no local dips to get stuck in, every downhill path leads to the one global minimum. Convexity is why logistic regression training is reliable and reproducible.</>}>convex</Term>{" "}
          — one bowl, one bottom, exactly the guarantee you had with linear regression.
        </p>

        <Callout color={ACCENT} title={<>In an interview</>}>
          &ldquo;Why log loss instead of MSE for classification?&rdquo; → <em>Two reasons. It
          prices probabilities correctly — unbounded penalty for confident wrongness, so the model
          learns calibrated humility. And paired with the sigmoid it keeps the objective convex
          with a strong gradient even when the model is saturated-and-wrong, whereas MSE through a
          sigmoid gives a non-convex surface with vanishing gradients exactly where learning is
          most needed.</em>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/logistic-regression/the-decision-boundary", label: <>← The decision boundary</> }}
          next={{ href: "/learn/logistic-regression/the-beautiful-gradient", label: <>Next up · The beautiful gradient →</> }}
        />
      </div>
    </article>
  );
}
