import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Case: a regression tree, end to end — Manifold",
  description:
    "A single regression tree on California housing: it overfits exactly like a classifier, its predictions are capped by the training range (no extrapolation), and geography plus income drive it. The regression half of the track, on real data.",
};

const TREES = "var(--c-trees)";

const SETUP = `from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error, r2_score

cal = fetch_california_housing(as_frame=True)   # 20,640 blocks, 8 features
X, y = cal.data.to_numpy(float), cal.target.to_numpy(float)  # y = median value ($100k)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)`;

const SWEEP = `for d in [2, 4, 6, 8, 12, None]:
    t = DecisionTreeRegressor(max_depth=d, random_state=0).fit(X_tr, y_tr)
    rmse = mean_squared_error(y_te, t.predict(X_te)) ** 0.5
    print(f"depth {str(d):>4}  leaves {t.get_n_leaves():>5}  "
          f"train RMSE {mean_squared_error(y_tr, t.predict(X_tr))**0.5:.3f}  test RMSE {rmse:.3f}")`;

export default function RegressionCasePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "In the wild · real run", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Case: a regression tree, end to end</>}
        intro={<>
          The Titanic case was classification; this one is regression, on the California housing data behind the
          site&rsquo;s <Link href="/learn/california-housing-capstone" style={link}>capstone</Link>. Watch a
          single regression tree repeat every lesson of this track — overfitting, the staircase, no
          extrapolation — on a numeric target. Numbers are from <code>scripts/tree_cases.py</code>.
        </>}
      />

      <div className="lesson">
        <h2>The setup</h2>
        <p>
          Predict a census block&rsquo;s median house value (in units of $100k) from eight features: median
          income, house age, average rooms and occupancy, population, and latitude/longitude. No scaling, no
          encoding — a tree wants none of it.
        </p>
        <CodeBlock fromScratch={SETUP} />

        <h2>It overfits exactly like a classifier</h2>
        <CodeBlock fromScratch={SWEEP} />
        <CodeOutput label="output">{`depth    2  leaves     4  train RMSE 0.854  test RMSE 0.869
depth    4  leaves    16  train RMSE 0.738  test RMSE 0.768
depth    6  leaves    64  train RMSE 0.657  test RMSE 0.709
depth    8  leaves   242  train RMSE 0.569  test RMSE 0.663
depth   12  leaves  1949  train RMSE 0.362  test RMSE 0.683
depth None  leaves 14851  train RMSE 0.000  test RMSE 0.742`}</CodeOutput>
        <p>
          The same U-curve, now in RMSE. Test error falls to a minimum around <strong>depth 8</strong> (RMSE
          0.663), then climbs back as the tree memorises. The fully grown tree is the giveaway: 14,851 leaves,{" "}
          <strong> train RMSE exactly 0.000</strong> — it has carved a private leaf for essentially every one of
          the 15,480 training blocks — yet its test RMSE (0.742) is <em>worse</em> than the depth-8 tree&rsquo;s.
          Cross-validation picks depth 9, giving a test <strong>R² of 0.673</strong>: a respectable single-tree
          fit, and a clean baseline to beat.
        </p>

        <h2>The staircase has a hard ceiling</h2>
        <CodeOutput label="no extrapolation">{`training target range:  [0.15, 5.00]
tree prediction range:  [0.51, 5.00]   # never exceeds the training max`}</CodeOutput>
        <p>
          Here&rsquo;s the <Link href="/learn/decision-trees/regression-trees" style={link}>no-extrapolation</Link>
          property in the wild. Every prediction is a leaf mean, and a leaf mean can never exceed the largest
          target it was built from — so the tree&rsquo;s outputs top out at <strong>5.00</strong>, the dataset&rsquo;s
          capped maximum. A genuinely $600k block gets predicted at $500k, full stop. A linear model would happily
          extend the trend; the tree cannot, by construction. If your target has an open-ended upper range, this
          is disqualifying — and it&rsquo;s inherited by <Link href="/learn/random-forests" style={link}>random
          forests</Link> too.
        </p>

        <h2>What drove it</h2>
        <CodeOutput label="permutation importance (top 4, test set)">{`MedInc       +1.053
Latitude     +0.289
Longitude    +0.226
AveOccup     +0.224`}</CodeOutput>
        <p>
          <strong>Median income</strong> dominates — unsurprising for house prices — but notice the second and
          third features: <strong>latitude and longitude</strong>. The tree discovered that <em>where</em> a
          block sits matters enormously, carving California into geographic price regions with axis-aligned cuts
          on the coordinates. That&rsquo;s the same signal the capstone&rsquo;s{" "}
          <Link href="/learn/california-housing-capstone" style={link}>housing map</Link> shows visually, here
          recovered automatically from two raw coordinate columns.
        </p>

        <Callout color={TREES} title={<>The single tree&rsquo;s ceiling — and the door to ensembles</>}>
          R² 0.673 from one tree is decent, and fully interpretable, but the capstone pushes past 0.80 with a
          stacked ensemble. Everything you saw here — the overfitting, the blocky staircase, the flat ceiling —
          is what averaging and boosting many trees improve on. That&rsquo;s the entire <Link href="/map" style={link}>Trees
          &amp; ensembles</Link> family: the single tree is where the intuition lives; the ensembles are where
          the accuracy is.
        </Callout>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>The fully grown tree hit train RMSE 0.000 but test RMSE 0.742, worse than the depth-8 tree's 0.663. Why?</>,
              options: [
                "A bug in the code",
                "With 14,851 leaves it memorised the training set — one leaf per block — which is pure overfitting",
                "Regression trees can't reach zero error",
              ],
              answer: 1,
              explain: <>A leaf per training point gives perfect training error and terrible generalisation — the regression version of the same overfitting a classification tree shows. The best tree is a pruned one.</>,
            },
            {
              q: <>The tree's predictions never exceeded 5.00, the training maximum. What property is this?</>,
              options: [
                "A rounding artifact",
                "No extrapolation — a leaf predicts the mean of its training targets, which can't exceed the largest one",
                "The Gini criterion",
              ],
              answer: 1,
              explain: <>Piecewise-constant predictions are bounded by the training targets. A tree (and a forest of trees) cannot predict beyond the range it was trained on — disqualifying for open-ended targets.</>,
            },
            {
              q: <>Latitude and longitude ranked 2nd and 3rd in importance. What did the tree do with them?</>,
              options: [
                "Ignored them as noise",
                "Split on the raw coordinates to carve California into geographic price regions",
                "Averaged them into one feature",
              ],
              answer: 1,
              explain: <>Axis-aligned cuts on lat/long partition the map into price zones — the tree recovered spatial structure from two raw coordinate columns, the same signal the capstone's map shows.</>,
            },
            {
              q: <>The single tree reached R² 0.673; the capstone's ensemble exceeds 0.80. What's the general lesson?</>,
              options: [
                "Single trees are useless",
                "A single tree is the interpretable baseline; averaging/boosting many trees is where the accuracy comes from",
                "Regression needs a different model entirely",
              ],
              answer: 1,
              explain: <>The tree gives intuition and a readable baseline. Its weaknesses — variance, blocky fit, flat ceiling — are exactly what the ensembles in the rest of this family fix.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/case-a-titanic", label: <>← Case: predicting who survived</> }}
          next={{ href: "/learn/random-forests", label: <>Next track · Random forests →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
