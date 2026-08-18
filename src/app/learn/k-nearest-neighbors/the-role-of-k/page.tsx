import { M, MathBlock } from "@/components/Math";
import { KNNBoundaryLab } from "@/components/labs/KNNBoundaryLab";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The role of k — Manifold",
  description:
    "k is the one dial k-NN gives you, and it controls the whole model's complexity. See what small and large k really mean, why n/k is the honest measure of flexibility, and what happens at the two extremes.",
};

export default function RoleOfKPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · choosing k", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>The role of k</>}
        intro={<>
          k-NN has almost no knobs — no weights to fit, no loss to minimise. Its behaviour is governed by a
        single integer, <em>k</em>. Understanding exactly what that one number controls is most of what it
        takes to use the algorithm well.
        </>}
      />

      <div className="lesson">
        <h2>k is the complexity dial, not a detail</h2>
        <p>
          In a parametric model, complexity lives in the parameters: more features, higher degree, more
          layers. k-NN keeps <em>all</em> the training data and fits nothing — so where does its complexity
          come from? From <strong>k alone</strong>. Choosing how many neighbours vote is choosing how flexible
          the model is allowed to be. Everything else about k-NN is fixed the moment you pick a distance; only
          k decides whether you get a jagged, wiggly rule or a smooth, cautious one.
        </p>

        <PredictPrompt
          accent="var(--c-classification)"
          prompt={<>As you raise <em>k</em> from 1 to 31 below, the decision boundary will become…</>}
          options={["Smoother and simpler", "More jagged and detailed", "Unchanged — k only affects speed"]}
        />
        <LabFrame
          accent="var(--c-classification)"
          tryThis={<>Step k up through 1 → 3 → 7 → 15 → 31 and watch the boundary. Then toggle the noisy points and see which k survives them.</>}
          insight={<>Small k chases every point (including noise); large k smooths the boundary toward a single simple shape. k <em>is</em> the amount of smoothing.</>}
        >
          <KNNBoundaryLab />
        </LabFrame>

        <h2>The two extremes tell the whole story</h2>
        <ul style={ul}>
          <li>
            <strong><M>{String.raw`k = 1`}</M> — maximum flexibility.</strong> Every query copies its single
            closest neighbour. Training error is exactly zero, the boundary is the jagged Voronoi seam, and one
            mislabelled point owns a whole island. This is the <strong>high-variance</strong> extreme: the rule
            swings wildly with the particular sample you happened to draw.
          </li>
          <li>
            <strong><M>{String.raw`k = n`}</M> — maximum rigidity.</strong> Every query polls the entire
            training set, so <em>every</em> point gets the same answer: the overall majority class (or, for
            regression, the global mean). The boundary vanishes — there isn&rsquo;t one. This is the
            <strong> high-bias</strong> extreme: the model ignores the input entirely.
          </li>
        </ul>
        <p>
          Useful k lives strictly between these poles. As k climbs from 1 toward n, you slide continuously from
          &ldquo;memorise everything&rdquo; to &ldquo;ignore everything&rdquo; — which is exactly the
          bias–variance trade-off, made into a single tunable integer.
        </p>

        <h2>Effective complexity: think in n/k</h2>
        <p>
          There&rsquo;s a clean way to quantify how flexible a given k is. A k-NN model partitions the data into
          roughly <M>{String.raw`n/k`}</M> local neighbourhoods, each producing one near-constant prediction.
          That ratio behaves like a count of effective parameters — the model&rsquo;s{" "}
          <strong>effective degrees of freedom</strong>:
        </p>
        <MathBlock>{String.raw`\text{effective d.o.f.} \;\approx\; \frac{n}{k}`}</MathBlock>
        <p>
          At <M>{String.raw`k = 1`}</M> that&rsquo;s <M>{String.raw`n`}</M> — one &ldquo;parameter&rdquo; per
          data point, the definition of overfitting. At <M>{String.raw`k = n`}</M> it&rsquo;s a single
          parameter, a constant model. This is why <strong>bigger k means a simpler model</strong>, which trips
          up everyone at first: with k-NN the complexity dial runs <em>backwards</em> compared to degree or
          layer count. Turning k <em>up</em> turns flexibility <em>down</em>.
        </p>

        <Callout color="var(--c-classification)" title={<>k is chosen, never learned</>}>
          Because k sets the model&rsquo;s capacity, it can&rsquo;t be read off the training data — the training
            set always &ldquo;prefers&rdquo; <M>{String.raw`k = 1`}</M> (zero error). k is a{" "}
            <strong>hyperparameter</strong>: you set it from the outside and judge it on held-out data. That&rsquo;s
            the entire job of the next two pages — first the theory of the trade-off, then the cross-validation
            procedure that actually picks k.
        </Callout>

        <h2>Two practical rules of thumb</h2>
        <ul style={ul}>
          <li>
            <strong>Prefer odd k for two classes.</strong> An odd number of voters can never tie, so you never
            need a coin-flip tie-break. (With more than two classes, ties can still happen — distance weighting,
            a later page, dissolves them.)
          </li>
          <li>
            <strong>Start near <M>{String.raw`\sqrt{n}`}</M>.</strong> A time-honoured default is
            <M>{String.raw`\,k \approx \sqrt{n}`}</M> — for a few hundred points that&rsquo;s single digits to low
            tens. It&rsquo;s only a starting guess to centre your search, not an answer; cross-validation makes the
            real call.
          </li>
        </ul>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "In k-NN, increasing k makes the model…",
              options: ["Simpler — lower effective degrees of freedom", "More complex — it uses more data", "Faster to train but more flexible"],
              answer: 0,
              explain: "Effective d.o.f. ≈ n/k, so larger k means fewer effective parameters and a smoother, simpler rule. k-NN's complexity dial runs opposite to degree or layer count.",
            },
            {
              q: "What does k-NN predict when k = n (all training points)?",
              options: ["The overall majority class (or global mean) for every query", "The nearest point's label", "It's undefined"],
              answer: 0,
              explain: "Every query polls the whole set, so the input stops mattering and you get one constant answer — the maximum-bias extreme.",
            },
            {
              q: "Why can't you choose k by picking the value with the lowest training error?",
              options: ["k=1 always has zero training error, yet overfits badly", "Training error is expensive to compute", "Training error doesn't depend on k"],
              answer: 0,
              explain: "k is a capacity knob, so the training set always rewards the most flexible choice. k must be judged on held-out data — that's what cross-validation is for.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/decision-boundaries", label: <>← Decision boundaries</> }} next={{ href: "/learn/k-nearest-neighbors/bias-and-variance-in-k-nn", label: <>Next up · Bias &amp; variance in k-NN →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
