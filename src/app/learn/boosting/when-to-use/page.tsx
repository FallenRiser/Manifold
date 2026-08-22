import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "When to use boosting (and when not) — Manifold",
  description:
    "A clear-eyed decision guide: gradient boosting is the accuracy champion on tabular data when you can tune it, but a random forest, a linear model, or a neural net is the better call in situations boosting handles poorly. Plus where the Trees & ensembles family goes next.",
};

const TREES = "var(--c-trees)";

export default function WhenToUsePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>When to use boosting (and when not)</>}
        intro={<>
          You can build a gradient booster; the last skill is knowing when to. Boosting is the strongest tabular
          model we have <em>and</em> the easiest to misapply. Here is the honest decision guide, and the send-off
          for the whole Trees &amp; ensembles family.
        </>}
      />

      <div className="lesson">
        <h2>Reach for boosting when…</h2>
        <ul style={ulGood}>
          <li><strong>The data is tabular and you want maximum accuracy.</strong> On structured rows of mixed numeric/categorical features, tuned gradient boosting is the reigning champion — the default first thing to try when the leaderboard, not convenience, is the goal.</li>
          <li><strong>You can afford to tune and validate.</strong> Boosting rewards a proper validation set, early stopping, and a short hyperparameter search. If that workflow is available, its ceiling is unmatched.</li>
          <li><strong>You need a custom or asymmetric objective.</strong> Quantile intervals, ranking (LambdaMART), survival, or a bespoke business loss — the <Link href="/learn/boosting/functional-gradient" style={link}>functional-gradient framework</Link> handles any differentiable loss.</li>
          <li><strong>You need accuracy <em>and</em> accountability.</strong> <Link href="/learn/boosting/interpretation" style={link}>TreeSHAP, partial dependence, and monotonic constraints</Link> make boosted models interpretable and certifiable — why they dominate credit, pricing, and risk.</li>
        </ul>

        <h2>Prefer something else when…</h2>
        <ul style={ulBad}>
          <li><strong>You want a strong answer with zero tuning → <Link href="/learn/random-forests" style={link}>random forest</Link>.</strong> It hit 0.842 out of the box where the default booster managed 0.783. Higher floor, no babysitting, embarrassingly parallel.</li>
          <li><strong>The data is small and noisy.</strong> Boosting&rsquo;s relentless error-chasing <Link href="/learn/boosting/margins" style={link}>amplifies label noise</Link>; a forest&rsquo;s averaging is more forgiving, and a regularised linear model may beat both.</li>
          <li><strong>The signal is genuinely linear → a <Link href="/learn/regularized-regression" style={link}>regularised linear model</Link>.</strong> Simpler, faster, more interpretable, and no ensemble will meaningfully beat it. Always run the linear baseline first.</li>
          <li><strong>The data is images, audio, or text → neural networks.</strong> Boosting has no notion of spatial or sequential structure; on perceptual data deep learning is in a different league. Boosting owns tables, not pixels.</li>
          <li><strong>You need very low-latency training or online updates.</strong> Boosting is sequential and retrains from scratch; for streaming or tight training-latency budgets, a forest or an online linear model fits better.</li>
        </ul>

        <Callout color={TREES} title={<>The one-line policy</>}>
          On a new tabular problem: <strong>start with a linear baseline, then a random forest for a fast strong
          number, then reach for tuned gradient boosting when you need to squeeze out the last few points.</strong>{" "}
          The forest tells you what &ldquo;good&rdquo; looks like with no effort; boosting tells you how far past
          it you can push with real effort. Use both — they answer different questions.
        </Callout>

        <h2>The family, in one picture</h2>
        <p>
          Three tracks, one decision-tree brick, built three ways:
        </p>
        <ul style={ul}>
          <li><strong><Link href="/learn/decision-trees" style={link}>A single tree</Link></strong> — interpretable, fast, but high variance and easily overfit. The building block.</li>
          <li><strong><Link href="/learn/random-forests" style={link}>A random forest</Link></strong> — many deep trees averaged in parallel to <em>kill variance</em>. The robust default.</li>
          <li><strong>Gradient boosting</strong> — many shallow trees added in sequence to <em>kill bias</em>. The accuracy champion.</li>
        </ul>
        <p>
          Forest and boosting sit on opposite sides of the{" "}
          <Link href="/learn/boosting/bias-variance" style={link}>bias–variance decomposition</Link>, which is why
          they feel so different to use despite sharing a base learner. Master both and you have covered the
          overwhelming majority of tabular machine learning as it is actually practised.
        </p>

        <h2>Where the family goes next</h2>
        <p>
          One combiner remains. Bagging averages, boosting adds — <strong>stacking</strong> does something smarter:
          it trains a <em>meta-model</em> to learn how best to combine the predictions of several different base
          models (a forest, a booster, a linear model, a neural net). Where boosting and bagging combine copies of
          one learner, stacking blends <em>diverse</em> learners, and it is how winning competition solutions
          wring out the final fraction of a percent. That is the next track in the{" "}
          <Link href="/map" style={link}>Trees &amp; ensembles</Link> family.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>A teammate needs a strong tabular model by end of day with no time to tune. What do you recommend?</>,
              options: [
                "Gradient boosting — it's the most accurate",
                "A random forest — high floor, near-zero tuning, fast and parallel",
                "A neural network",
              ],
              answer: 1,
              explain: <>Boosting's ceiling is higher but needs tuning; at defaults it can trail the forest. With no tuning time, the forest's high floor is the right call.</>,
            },
            {
              q: <>Why is gradient boosting usually the wrong tool for image classification?</>,
              options: [
                "It's too slow to train",
                "It has no notion of spatial structure; perceptual data is the domain of neural networks",
                "It can't handle more than two classes",
              ],
              answer: 1,
              explain: <>Boosting on trees treats features as an unordered table with no spatial/sequential inductive bias. On images/audio/text, deep learning dominates; boosting owns tabular data.</>,
            },
            {
              q: <>What fundamentally distinguishes stacking from bagging and boosting?</>,
              options: [
                "It uses more trees",
                "It trains a meta-model to combine several different base models, rather than combining copies of one learner",
                "It only works for regression",
              ],
              answer: 1,
              explain: <>Bagging averages and boosting adds copies of one base learner; stacking learns a combiner over diverse models — the next track in the family.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/case-a-tabular", label: <>← Case: boosting beats the forest</> }}
          next={{ href: "/map", label: <>Next family · Stacking, on the map →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const ulGood: React.CSSProperties = { ...ul };
const ulBad: React.CSSProperties = { ...ul };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
