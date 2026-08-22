import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Multiclass & real-valued boosting — Manifold",
  description:
    "Classic AdaBoost is binary and votes with hard ±1 stumps. Two generalisations make it practical: SAMME extends the vote to K classes, and real-valued boosting (SAMME.R, Real AdaBoost) lets weak learners emit class probabilities for faster, smoother convergence.",
};

const TREES = "var(--c-trees)";

export default function MulticlassPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Multiclass &amp; real-valued boosting</>}
        intro={<>
          The AdaBoost you built handles two classes and hard ±1 votes. Real problems have more classes, and weak
          learners can often say more than &ldquo;left or right&rdquo; — they can give <em>probabilities</em>. Two
          clean generalisations cover both, and they explain the exact estimators you&rsquo;ll call in scikit-learn.
        </>}
      />

      <div className="lesson">
        <h2>The multiclass problem</h2>
        <p>
          The binary vote <M>{String.raw`\alpha_m = \tfrac12\ln\frac{1-\varepsilon_m}{\varepsilon_m}`}</M> has a
          hidden two-class assumption: &ldquo;better than chance&rdquo; means <M>{String.raw`\varepsilon < \tfrac12`}</M>.
          With <M>{String.raw`K`}</M> classes, random guessing is right only <M>{String.raw`1/K`}</M> of the time,
          so the threshold for a useful learner is <M>{String.raw`\varepsilon < 1 - 1/K`}</M> — much more lenient.
          The naive binary formula would assign a negative vote to a perfectly good three-class learner with
          error 0.6, which is nonsense.
        </p>

        <h2>SAMME: the one-term fix</h2>
        <p>
          <strong>SAMME</strong> (Stagewise Additive Modelling using a Multi-class Exponential loss; Zhu, Zou,
          Rosset &amp; Hastie, 2009) patches the vote with a single extra term:
        </p>
        <MathBlock>{String.raw`\alpha_m = \ln\frac{1-\varepsilon_m}{\varepsilon_m} + \ln(K-1)`}</MathBlock>
        <p>
          For <M>{String.raw`K=2`}</M>, <M>{String.raw`\ln(K-1)=\ln 1 = 0`}</M> and it collapses back to binary
          AdaBoost (up to the factor of 2). The <M>{String.raw`\ln(K-1)`}</M> term shifts the &ldquo;is this
          learner useful?&rdquo; threshold to the right place: now <M>{String.raw`\alpha_m > 0`}</M> exactly when{" "}
          <M>{String.raw`\varepsilon_m < 1 - 1/K`}</M>, i.e. whenever the learner beats <em>K-way</em> chance.
          Everything else — reweighting, the weighted vote across classes — is unchanged. It is derived, like
          binary AdaBoost, as forward stagewise descent on a multi-class exponential loss.
        </p>

        <h2>Real-valued boosting: use the probabilities</h2>
        <p>
          A decision stump doesn&rsquo;t only say &ldquo;class A&rdquo; — its leaf holds a class{" "}
          <em>proportion</em>, e.g. &ldquo;80% A.&rdquo; Discrete AdaBoost throws that confidence away and votes
          hard. <strong>Real AdaBoost</strong> and <strong>SAMME.R</strong> (the &ldquo;R&rdquo; is for{" "}
          <em>real</em>) keep it: the weak learner emits class probability estimates{" "}
          <M>{String.raw`p_k(x)`}</M>, and its contribution to the additive model is a real-valued, log-odds-like
          transform of those probabilities rather than a single <M>{String.raw`\pm\alpha`}</M>.
        </p>
        <MathBlock>{String.raw`h_m(x)_k \;\propto\; \Big(\ln p_k(x) - \tfrac1K \textstyle\sum_{j}\ln p_j(x)\Big)`}</MathBlock>
        <p>
          Because each round injects graded confidence instead of a hard bit, the ensemble{" "}
          <strong>converges in far fewer rounds</strong> — SAMME.R typically reaches a given accuracy in a
          fraction of the trees SAMME needs. The trade is that the weak learner must produce calibrated-ish
          probabilities (a shallow tree&rsquo;s leaf fractions do fine).
        </p>

        <Callout color={TREES} title={<>What you actually call</>}>
          In scikit-learn, <code>AdaBoostClassifier</code> historically defaulted to <code>SAMME.R</code>; recent
          versions default to <code>SAMME</code> (the <code>.R</code> algorithm was deprecated in 1.4 and removed
          in 1.6). For multiclass problems you rarely reach for AdaBoost at all now — you use{" "}
          <Link href="/learn/boosting/gbm-classification" style={link}>gradient boosting</Link>, which handles{" "}
          <M>{String.raw`K`}</M> classes natively via a softmax and one additive function per class. Think of
          SAMME/SAMME.R as the conceptual bridge, not the tool you&rsquo;ll grab.
        </Callout>

        <h2>And regression: AdaBoost.R2</h2>
        <p>
          AdaBoost can boost regressors too. <strong>AdaBoost.R2</strong> reweights examples by their{" "}
          <em>relative</em> loss each round — the points with the largest current residuals get up-weighted,
          exactly mirroring the classification version — and combines the learners with a weighted median. It
          works, but it was quickly eclipsed: once you view boosting through the{" "}
          <Link href="/learn/boosting/gradient-boosting" style={link}>gradient lens</Link>, regression boosting
          becomes the <em>cleaner</em> case, not a bolt-on. That reframing is the pivot of the whole track, and
          it is next.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/margins", label: <>← Margins &amp; resistance to overfitting</> }}
          next={{ href: "/learn/boosting/gradient-boosting", label: <>Next up · Boosting as gradient descent →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
