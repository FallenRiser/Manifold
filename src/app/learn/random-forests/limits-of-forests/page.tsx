import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";

export const metadata = {
  title: "Bias & the limits of forests — Manifold",
  description:
    "Averaging attacks variance, not bias — so a forest inherits its trees' blind spots: it can't extrapolate, it stays biased if the trees are biased, and correlation caps how much variance it can shed.",
};

const TREES = "var(--c-trees)";
const GREY = "var(--c-metrics)";

export default function LimitsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 3 · theory", color: GREY }]}
        time="about 7 minutes"
        title={<>Bias &amp; the limits of forests</>}
        intro={<>
          A random forest is a variance-reduction machine, and it&rsquo;s superb at that one job. But the
          variance formula is also a list of what it <em>can&rsquo;t</em> do — and those limits are exactly
          where boosting and other models earn their place.
        </>}
      />

      <div className="lesson">
        <h2>Averaging doesn&rsquo;t touch bias</h2>
        <p>
          The mean of many trees has, to a first approximation, the same <em>bias</em> as one tree — averaging
          re-centres nothing. Random forests get away with this because their base trees are grown deep, so that
          shared bias is already tiny. But the corollary is strict: <strong>a forest of biased trees is a biased
          forest.</strong> If the true relationship is something trees systematically miss, stacking 500 of them
          won&rsquo;t help. This is precisely the gap <Link href="/learn/random-forests/forest-vs-tree-vs-boosting" style={link}>boosting</Link>
          targets — it drives <em>bias</em> down, which averaging cannot.
        </p>

        <h2>It still can&rsquo;t extrapolate</h2>
        <p>
          Every tree predicts a constant beyond the range of its training data, so the average of trees does
          too. A random forest&rsquo;s prediction is <strong>bounded by the training targets</strong> — feed it
          an input past the edge of what it&rsquo;s seen and it returns a flat value, never a continuing trend.
          For extrapolation — forecasting a rising series, pricing beyond observed ranges — a forest is the
          wrong tool, exactly as a single tree was. Averaging smooths the staircase; it doesn&rsquo;t grow legs.
        </p>

        <h2>The correlation floor is real</h2>
        <p>
          The <M>{String.raw`\rho\sigma^2`}</M> floor from the last page means variance reduction has a hard
          limit. On problems where trees are unavoidably correlated — a single dominant feature, strong feature
          interactions everything keys on — <M>{String.raw`\rho`}</M> stays high and the forest can&rsquo;t shed
          much variance no matter how many trees or how aggressive the subsampling. Forests help most when there
          is <em>diversity to find.</em>
        </p>

        <Callout color={GREY} title={<>Forests are consistent — under conditions</>}>
          There&rsquo;s reassuring theory: under suitable assumptions, random forests are{" "}
          <strong>statistically consistent</strong> — their error approaches the best possible (Bayes) error as
          data grows (Biau, Scornet, and others). But the guarantees need care — the classic proofs often assume
          simplified, more-random forest variants — and, like all such results, they say nothing about a{" "}
          <em>finite</em> sample. Consistency is comfort, not a performance promise on your dataset.
        </Callout>

        <h2>And the practical costs</h2>
        <ul style={ul}>
          <li><strong>Interpretability is mostly gone.</strong> A single tree is a readable flowchart; a
            forest of 500 is a black box you can only probe with importances or SHAP. You trade the
            tree&rsquo;s best feature for accuracy.</li>
          <li><strong>Memory and latency.</strong> Hundreds of deep trees are large to store and slower to
            evaluate than one model — a real constraint on tiny or high-throughput deployments.</li>
          <li><strong>No free lunch on structured problems.</strong> If the truth is genuinely linear or
            smooth, a linear model or spline can beat a forest with a fraction of the size — the staircase is a
            handicap there.</li>
        </ul>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>A forest of deep trees is systematically off on a problem trees can't represent. Will more trees fix it?</>,
              options: [
                "Yes — more trees always improve accuracy",
                "No — averaging reduces variance, not bias; a biased base learner stays biased",
                "Only with bootstrapping off",
              ],
              answer: 1,
              explain: <>Averaging re-centres nothing. If the base trees share a bias, so does the forest. Reducing bias is boosting's job, not bagging's.</>,
            },
            {
              q: <>Why can't a random forest extrapolate beyond its training range?</>,
              options: [
                "Because of the bootstrap",
                "Because each tree predicts a constant outside the training data, so the average does too",
                "Because of feature subsampling",
              ],
              answer: 1,
              explain: <>Trees are piecewise-constant and predict their outermost leaf value forever. Averaging such trees is still bounded by the training targets — no trend continues.</>,
            },
            {
              q: <>The variance floor ρσ² means what for a problem where trees are unavoidably highly correlated?</>,
              options: [
                "The forest can still drive variance to zero with enough trees",
                "The forest can shed little variance — averaging is capped by the high correlation",
                "The bias goes to zero",
              ],
              answer: 1,
              explain: <>Adding trees only removes the (1−ρ)/B term; the ρσ² floor stays. High unavoidable correlation means a high floor and limited benefit from averaging.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/random-forests/strength-and-correlation", label: <>← Strength & correlation</> }}
          next={{ href: "/learn/random-forests/proximities", label: <>Next up · Proximities, outliers & missing data →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
