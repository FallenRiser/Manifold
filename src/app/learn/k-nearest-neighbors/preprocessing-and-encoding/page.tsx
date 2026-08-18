import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Preprocessing & encoding — Manifold",
  description:
    "k-NN can only measure distance between numbers with no gaps. Categorical columns and missing values break that outright — here's how to encode and impute them so every feature lands in a distance-friendly space.",
};

export default function PreprocessingEncodingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · in practice", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Preprocessing &amp; encoding</>}
        intro={<>
          Scaling fixed features that were numbers on different scales. But real tables also carry categories
        and gaps — and a distance function can&rsquo;t subtract &ldquo;red&rdquo; from &ldquo;blue&rdquo; or handle a
        missing value at all. Getting those into a distance-friendly space is the rest of the prep work.
        </>}
      />

      <div className="lesson">
        <h2>Encoding categoricals for a distance</h2>
        <p>
          k-NN needs every feature to be a number, and the <em>gaps</em> between those numbers have to mean
          something, because they go straight into the distance. That makes categorical encoding a distance
          decision, not a formatting one.
        </p>
        <ul style={ul}>
          <li>
            <strong>One-hot encoding</strong> turns a k-category column into k 0/1 columns. Every pair of
            distinct categories is then equidistant (<M>{String.raw`\sqrt{2}`}</M> apart) — exactly right when
            the categories have <em>no</em> inherent order (colour, city, product).
          </li>
          <li>
            <strong>Ordinal encoding</strong> maps categories to <M>{String.raw`0, 1, 2, \dots`}</M>. This
            silently asserts that category 2 is twice as far from 0 as from 1 — <strong>only</strong> use it when
            that ordering is real (low / medium / high), never for unordered categories, where it invents
            distances that don&rsquo;t exist.
          </li>
          <li>
            <strong>Frequency / target encoding</strong> replaces a category with a statistic. Powerful for
            high-cardinality columns, but target encoding must be fit inside cross-validation folds or it leaks
            the label into the features.
          </li>
        </ul>

        <Callout color="var(--c-classification)" title={<>One-hot has a scaling side-effect</>}>
          A one-hot column contributes at most <M>{String.raw`\sqrt{2}`}</M> to the distance, while a
            standardised numeric feature routinely swings several units. After one-hot encoding, a{" "}
            <em>lot</em> of binary columns can collectively dominate — or be dominated by — the numeric ones.
            Scale thoughtfully, and remember that high-cardinality one-hot also feeds straight into the curse of
            dimensionality.
        </Callout>

        <h2>Missing values must go before distance</h2>
        <p>
          A single <code>NaN</code> makes a distance undefined — you can&rsquo;t take{" "}
          <M>{String.raw`(x_i - z_i)^2`}</M> when one side is missing. So imputation isn&rsquo;t optional
          housekeeping; it&rsquo;s a precondition for k-NN to run at all. The usual options:
        </p>
        <ul style={ul}>
          <li><strong>Simple imputation</strong> — fill with the column mean/median (numeric) or mode (categorical). Fast, and often enough.</li>
          <li><strong>k-NN imputation</strong> — fill a missing entry from the average of its nearest complete neighbours. Fittingly, k-NN is itself a strong imputer (scikit-learn&rsquo;s <code>KNNImputer</code>), because &ldquo;similar rows have similar values&rdquo; is the same premise.</li>
          <li><strong>Missingness as signal</strong> — sometimes &ldquo;this was blank&rdquo; is informative; add a binary &ldquo;was-missing&rdquo; indicator alongside the imputed value.</li>
        </ul>

        <h2>Order matters — and it&rsquo;s a pipeline</h2>
        <p>
          The steps have a required order, and every one of them <em>learns</em> something (means, categories,
          scales) that must come from the training data only:
        </p>
        <MathBlock>{String.raw`\text{impute} \;\rightarrow\; \text{encode} \;\rightarrow\; \text{scale} \;\rightarrow\; k\text{-NN}`}</MathBlock>
        <p>
          Impute first so encoding and scaling see complete data; encode so everything is numeric; scale last so
          every feature — including the freshly one-hot columns — speaks at a comparable volume. A{" "}
          <code>ColumnTransformer</code> inside a <code>Pipeline</code> applies the right treatment per column
          type and, crucially, refits all of it on each cross-validation fold&rsquo;s training portion — the same
          leakage guard from the choosing-k page, now covering imputation and encoding too.
        </p>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "You have an unordered 'city' column. Which encoding suits k-NN?",
              options: ["One-hot — keeps all cities equidistant", "Ordinal 0,1,2,… — compact and simple", "Leave it as text; k-NN handles strings"],
              answer: 0,
              explain: "Ordinal encoding invents a false ordering and false distances between cities. One-hot makes every distinct city equidistant, which is the honest geometry for unordered categories.",
            },
            {
              q: "Why must missing values be handled before k-NN, not after?",
              options: ["A NaN makes the distance undefined, so k-NN can't even run", "k-NN slows down with NaNs", "Missing values only affect training, not prediction"],
              answer: 0,
              explain: "Distance sums squared differences; you can't subtract a missing value. Imputation is a precondition for computing any neighbour distance at all.",
            },
            {
              q: "What's the correct order of preprocessing steps for k-NN?",
              options: ["Impute → encode → scale → k-NN, all inside the pipeline", "Scale → impute → encode", "Encode → k-NN → scale"],
              answer: 0,
              explain: "Impute so later steps see complete data, encode to make everything numeric, scale last so one-hot and numeric columns are comparable — and keep it all in the pipeline to refit per fold.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/the-curse-of-dimensionality", label: <>← The curse of dimensionality</> }} next={{ href: "/learn/k-nearest-neighbors/ties-and-class-imbalance", label: <>Next up · Ties &amp; class imbalance →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# a leakage-safe simple imputer, fit on TRAIN only
col_means = np.nanmean(X_train, axis=0)          # learned from train
def impute(X):
    X = X.copy()
    idx = np.where(np.isnan(X))
    X[idx] = np.take(col_means, idx[1])          # fill with train means
    return X

X_train_i = impute(X_train)
X_test_i  = impute(X_test)                        # same means — no peeking
print("any NaNs left?", np.isnan(X_train_i).any())`;

const codeLib = `from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import KNNImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.neighbors import KNeighborsClassifier

numeric = ["age", "income"]
categorical = ["city", "plan"]

pre = ColumnTransformer([
    ("num", Pipeline([("impute", KNNImputer()), ("scale", StandardScaler())]), numeric),
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
])
model = Pipeline([("pre", pre), ("knn", KNeighborsClassifier(n_neighbors=7))])
# every transform refits per CV fold on training data only — no leakage`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
