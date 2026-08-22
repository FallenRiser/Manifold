import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Logistic regression — the honest first model — Manifold",
  description:
    "The simplest model that outputs probabilities, read for its story before its score. On the grouped split it lifts PR-AUC to 0.309 — barely past the size rule — but its coefficients rediscover the domain: size dominates, and among the kinematics miss distance outweighs velocity, exactly as the conditional analysis predicted.",
};

const SPACE = "var(--c-space)";

export default function LogisticPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Logistic regression — the honest first model</>}
        intro={<>
          The harness is locked, so we can finally fit — and we start at the bottom rung, deliberately. The first model
          should be the simplest one that could work, chosen not because we expect it to win but because we can{" "}
          <em>read</em> it, and a model we can read is how we sanity-check everything above it.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          What does the simplest honest model say — and does the <em>story</em> it tells match what I learned in
          exploration?
        </AnalystQuestion>

        <h2>Why start simple, and start interpretable</h2>
        <p>
          It&rsquo;s tempting to open with the fanciest model and chase the best number. Resist it. A simple,
          interpretable model bought cheaply gives you three things a black box can&rsquo;t: a <strong>coherence
          check</strong> (do its parameters agree with the domain?), a <strong>real baseline with skill</strong> (better
          than the one-liner, so a fair bar for complex models), and a <strong>debugging anchor</strong> (if a forest
          later disagrees wildly with a sensible linear model, that&rsquo;s a clue, not a triumph). Logistic regression
          is the natural first rung: it outputs calibrated-ish probabilities and its coefficients are directly readable.
        </p>

        <ModelAnatomy
          accent={SPACE}
          form={<>a weighted sum of features passed through a sigmoid → <em>P</em>(hazardous)</>}
          loss={<>log-loss (cross-entropy), with <code>class_weight=&quot;balanced&quot;</code> for the 9.73% imbalance</>}
          optimiser={<>convex — solved reliably by L-BFGS</>}
        />

        <h2>Fit it, then read it before scoring it</h2>
        <p>
          We standardise the three features (so coefficients are comparable), balance the classes, and fit. Then — before
          we even look at PR-AUC — we read the coefficients as <em>odds multipliers per one standard deviation</em>.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`standardized log-odds coefficients (grouped split)
  absolute_magnitude   -2.326    odds x0.10 per +1 SD
  relative_velocity    +0.224    odds x1.25 per +1 SD
  miss_distance        -0.323    odds x0.72 per +1 SD
  intercept            -1.412

grouped-split scores:  ROC-AUC 0.877   PR-AUC 0.309`}</CodeOutput>

        <Callout color={SPACE} title={<>The model rediscovered the domain — and confirmed Act 3</>}>
          Read the coefficients as physics. <code>absolute_magnitude</code> has a huge negative weight (odds ×0.10 per SD):
          a smaller, dimmer object is drastically less likely to be hazardous — i.e. <em>big objects dominate</em>, exactly
          the size gate we found. Among the two kinematics, <code>miss_distance</code>&rsquo;s weight (−0.32) is{" "}
          <em>larger in magnitude</em> than <code>relative_velocity</code>&rsquo;s (+0.22) — the model independently agrees
          with our conditional-AUC finding that, once size is accounted for, how close it passes matters more than how
          fast. When a model&rsquo;s parameters echo what exploration told you, both are more trustworthy.
        </Callout>

        <h2>The score: honest, and honestly modest</h2>
        <p>
          PR-AUC <strong>0.309</strong> on the grouped split. Against the size-rule bar of <strong>0.289</strong>, that
          is a lift of only <strong>+0.020</strong> — real, but small. And that is a genuine finding, not a
          disappointment: a linear boundary in these three features can barely improve on &ldquo;is it big?&rdquo;. Either
          the extra signal is faint, or it&rsquo;s <em>non-linear</em> and a straight-line model can&rsquo;t capture it.
          That is precisely the diagnostic that justifies climbing to the next rung — a model that can bend.
        </p>

        <TransferBox>
          Make your first model one you can interrogate, and read its parameters <em>before</em> its score. Coefficients
          that contradict domain knowledge are a red flag worth chasing (leakage? a sign error? a mis-scaled feature?).
          And treat a simple model&rsquo;s small lift over the baseline as information: it tells you whether the remaining
          signal is weak, or just non-linear — which decides what you reach for next.
        </TransferBox>

        <PlaybookRule n={13}>
          Start with an <strong>interpretable model and read its parameters before its score.</strong> A coherent story
          (coefficients that match the domain) is a prerequisite for trusting anything more complex you build on top.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/baselines", label: <>← Baselines: the number to beat</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/decision-tree", label: <>Next up · Decision tree →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

sc = StandardScaler().fit(Xtr)                 # fit scaler on TRAIN only
lr = LogisticRegression(max_iter=1000, class_weight="balanced",
                        random_state=0).fit(sc.transform(Xtr), ytr)

for f, c in zip(features, lr.coef_[0]):
    print(f, round(c, 3), "-> odds x", round(np.exp(c), 2))`;
