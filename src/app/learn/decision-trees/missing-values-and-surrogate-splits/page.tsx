import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Missing values & surrogate splits — Manifold",
  description:
    "How trees route a missing value through a split without imputing it: CART's surrogate splits, the learned default direction of modern GBMs, and why missingness itself is often a signal worth keeping.",
};

const TREES = "var(--c-trees)";

export default function MissingValuesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Missing values &amp; surrogate splits</>}
        intro={<>
          A split asks &ldquo;is <code>age ≤ 30</code>?&rdquo; — but what if a row&rsquo;s age is blank? Most
          models force you to impute the gap before they&rsquo;ll run. Trees don&rsquo;t: they can decide where
          a missing value goes <em>as part of the split itself</em>, and can even turn the missingness into a
          feature. This is one of a tree&rsquo;s quiet superpowers.
        </>}
      />

      <div className="lesson">
        <h2>Surrogate splits — CART&rsquo;s backup plan</h2>
        <p>
          The original CART answer is elegant. For every split it chooses, it also finds a ranked list of{" "}
          <strong>surrogate splits</strong>: splits on <em>other</em> features that mimic the primary one as
          closely as possible. If <code>age ≤ 30</code> sends mostly the same rows left and right as{" "}
          <code>income ≤ 40k</code>, then income is a good surrogate for age. When a row arrives with age
          missing, the tree consults its best available surrogate and routes the row the way that stand-in
          would have.
        </p>
        <p>
          Surrogates are ranked by <strong>agreement</strong> — the fraction of non-missing rows they send the
          same direction as the primary split (above the rate you&rsquo;d get by just sending everyone to the
          bigger child). A surrogate is only kept if it beats that trivial baseline. The result is graceful
          degradation: lose a feature and the tree leans on whatever correlated feature best reproduces its
          decisions, exactly the redundancy you&rsquo;d want.
        </p>

        <h2>The learned default direction — the modern shortcut</h2>
        <p>
          Today&rsquo;s workhorses — XGBoost, LightGBM, and scikit-learn&rsquo;s histogram-based trees — take a
          simpler, often better route. At each split they learn a <strong>default direction</strong> for
          missing values: during training they simply try sending all the missing-value rows left, then right,
          and keep whichever choice reduces the loss more. Missing values follow that learned default at
          prediction time.
        </p>
        <p>
          This is cheaper than maintaining a list of surrogates, and it has a subtle advantage: it lets the
          model exploit <em>informative</em> missingness. If &ldquo;income not reported&rdquo; correlates with
          the outcome, the default direction will send those rows wherever that pattern pays off — capturing a
          signal that mean-imputation would erase.
        </p>

        <Callout color={TREES} title={<>Missingness is often data, not noise</>}>
          Whether income is <em>reported</em> can matter as much as its value — non-response correlates with
          all sorts of things. Imputing a mean throws that signal away and pretends the value was ordinary. A
          tree&rsquo;s native handling keeps &ldquo;this was missing&rdquo; as a routable fact. When missingness
          might be meaningful (MNAR — missing not at random), that&rsquo;s a real edge; add an explicit
          &ldquo;was-missing&rdquo; indicator column and even an imputing model can share it.
        </Callout>

        <h2>So should you still impute?</h2>
        <p>Two honest caveats keep this from being a free lunch:</p>
        <ul style={ul}>
          <li><strong>scikit-learn&rsquo;s plain <code>DecisionTree</code> does not build surrogate splits.</strong>{" "}
            It gained direct NaN support (via the learned-default approach) only recently; older versions
            required you to impute first. Check what your tool actually does before relying on native handling.</li>
          <li><strong>Surrogates assume correlated features exist.</strong> If the missing feature is unique —
            nothing else predicts it — there&rsquo;s no good surrogate and the routing is a guess. Native
            handling shines when features are redundant, which in practice they usually are.</li>
        </ul>
        <p>
          The upshot: with a modern tree library you can very often skip imputation entirely, keep the
          missingness signal, and let the model route the gaps — a genuine simplification of the pipeline that
          most non-tree models can&rsquo;t offer.
        </p>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>A row reaches a split on <code>age</code> but its age is missing. How does classic CART decide where to send it?</>,
              options: [
                "It drops the row",
                "It uses the best surrogate split — a correlated feature whose split mimics the age split",
                "It always sends it left",
              ],
              answer: 1,
              explain: <>CART pre-computes surrogate splits ranked by how well they reproduce the primary split's routing. A missing primary value falls back to the best available surrogate.</>,
            },
            {
              q: <>What advantage does a learned default direction have over mean-imputing a missing value?</>,
              options: [
                "It's more accurate for every dataset",
                "It can exploit informative missingness — the fact that a value is missing may itself predict the target",
                "It requires no training",
              ],
              answer: 1,
              explain: <>Sending missing rows to whichever side lowers the loss lets the model use missingness as a signal. Mean-imputation pretends the value was ordinary and discards that information.</>,
            },
            {
              q: <>When do surrogate splits work poorly?</>,
              options: [
                "When features are highly correlated",
                "When the missing feature is unique and no other feature predicts it well",
                "When the target is numeric",
              ],
              answer: 1,
              explain: <>A surrogate is a stand-in built from correlated features. If nothing correlates with the missing feature, there's no good surrogate and the routing is little better than a guess.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/numeric-and-categorical-splits", label: <>← Numeric & categorical splits</> }}
          next={{ href: "/learn/decision-trees/how-trees-overfit", label: <>Next up · How a tree overfits →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
