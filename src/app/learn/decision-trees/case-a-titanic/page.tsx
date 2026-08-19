import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Case: predicting who survived — Manifold",
  description:
    "A decision tree on the Titanic data, grown and pruned end to end. It overfits with 227 leaves, prunes to 8, and — reading its own rules — rediscovers 'women and children first' straight from the data.",
};

const TREES = "var(--c-trees)";

const PIPELINE = `import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.tree import DecisionTreeClassifier, export_text

df = fetch_openml("titanic", version=1, as_frame=True).frame

# LEAKAGE: boat / body / home.dest are recorded AFTER the outcome — drop them.
# Predict from pre-voyage attributes only.
features = ["pclass", "sex", "age", "sibsp", "parch", "fare", "embarked"]
X = df[features].copy()
y = df["survived"].astype(int).to_numpy()

# sklearn trees need numbers: encode sex (0=female, 1=male) and embarked,
# and median-impute the two features with gaps. No scaling — trees don't need it.
X["sex"] = (X["sex"] == "male").astype(int)
X["embarked"] = X["embarked"].map({"S": 0, "C": 1, "Q": 2}).fillna(0)
X["age"]  = X["age"].astype(float).fillna(X["age"].astype(float).median())
X["fare"] = X["fare"].astype(float).fillna(X["fare"].astype(float).median())
X = X.to_numpy(float)

X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=0)`;

const FULL = `full = DecisionTreeClassifier(random_state=0).fit(X_tr, y_tr)
print(full.get_depth(), "deep,", full.get_n_leaves(), "leaves")
print("train", round(full.score(X_tr, y_tr), 3),
      " test", round(full.score(X_te, y_te), 3))`;

const SWEEP = `for d in [1, 2, 3, 4, 5, 6, 8, 10]:
    cv = cross_val_score(
        DecisionTreeClassifier(max_depth=d, random_state=0),
        X_tr, y_tr, cv=5).mean()
    print(f"depth {d:>2}  cv {cv:.3f}")

pruned = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X_tr, y_tr)
print("pruned: test", round(pruned.score(X_te, y_te), 3),
      " leaves", pruned.get_n_leaves())`;

const RULES = `print(export_text(pruned, feature_names=features, max_depth=2))`;

export default function TitanicCasePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "In the wild · real run", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Case: predicting who survived</>}
        intro={<>
          Everything in this track, on one real dataset. We&rsquo;ll grow a tree on the Titanic passenger
          list, watch it overfit, prune it two ways, and then do the thing only a tree lets you do — read its
          rules and see what it actually learned. Every number below is from the run in{" "}
          <code>scripts/tree_cases.py</code>; the code is on the page.
        </>}
      />

      <div className="lesson">
        <h2>The setup — and a leakage trap</h2>
        <p>
          The Titanic data has 1,309 passengers and a <code>survived</code> label. It also has three columns
          that would let a model <em>cheat</em>: <code>boat</code> (which lifeboat you reached),{" "}
          <code>body</code> (whether your body was recovered), and <code>home.dest</code> — all recorded{" "}
          <em>after</em> the outcome. A model handed <code>boat</code> would &ldquo;predict&rdquo; survival
          near-perfectly and teach us nothing. The first real decision is to drop them and predict from
          pre-voyage attributes only.
        </p>

        <CodeBlock fromScratch={PIPELINE} />

        <p>
          Note what we <em>didn&rsquo;t</em> do: no scaling, no one-hot encoding. Trees split on value order,
          so ordinal codes and raw magnitudes are fine — the whole preprocessing step is two encodings and two
          median fills.
        </p>

        <h2>Step 1 — let it overgrow</h2>
        <p>Fit a tree with no limits and it does exactly what this track warned:</p>
        <CodeBlock fromScratch={FULL} />
        <CodeOutput label="output">{`21 deep, 227 leaves
train 0.967  test 0.762`}</CodeOutput>
        <p>
          A 227-leaf tree, 21 levels deep, scoring <strong>96.7% on training and 76.2% on test</strong>. That
          20-point gap is the memorisation from <Link href="/learn/decision-trees/how-trees-overfit" style={link}>
          &ldquo;How a tree overfits&rdquo;</Link>, live: the tree has carved out a private box for nearly every
          quirk in the training set.
        </p>

        <h2>Step 2 — prune it back</h2>
        <p>Cross-validate the depth and the truth is stark — the best tree is tiny:</p>
        <CodeBlock fromScratch={SWEEP} />
        <CodeOutput label="output">{`depth  1  cv 0.772
depth  2  cv 0.791
depth  3  cv 0.804
depth  4  cv 0.788
depth  5  cv 0.784
depth  6  cv 0.770
depth  8  cv 0.762
depth 10  cv 0.759
pruned: test 0.832  leaves 8`}</CodeOutput>
        <p>
          Cross-validation peaks at <strong>depth 3</strong> and falls monotonically after — the U-curve of the{" "}
          <Link href="/learn/decision-trees/bias-and-variance-of-trees" style={link}>bias–variance page</Link>,
          measured. The depth-3 tree has just <strong>8 leaves</strong> yet scores <strong>83.2% on test</strong>
          — seven points <em>better</em> than the 227-leaf giant. Cost-complexity pruning (in the script) tells
          the same story from the other direction: sweeping <code>ccp_alpha</code> over its 106-step path
          collapses the tree to 5 leaves. Both routes agree: almost all of those 227 leaves were noise.
        </p>

        <h2>Step 3 — read what it learned</h2>
        <p>
          Now the payoff no ensemble can give you. Print the pruned tree&rsquo;s rules (<code>sex</code> is
          encoded 0 = female, 1 = male):
        </p>
        <CodeBlock fromScratch={RULES} />
        <CodeOutput label="output">{`|--- sex <= 0.50            (female)
|   |--- pclass <= 2.50     (1st/2nd class)
|   |   |--- fare <= 32.09 -> survived
|   |   |--- fare >  32.09 -> survived
|   |--- pclass >  2.50     (3rd class)
|   |   |--- fare <= 23.35 -> survived
|   |   |--- fare >  23.35 -> died
|--- sex >  0.50            (male)
|   |--- age <= 9.50        (a child)
|   |   |--- sibsp <= 2.50 -> survived
|   |   |--- sibsp >  2.50 -> died
|   |--- age >  9.50        (adult man)
|   |   |--- ... -> died`}</CodeOutput>
        <p>
          The very first question the tree chose to ask is <strong>&ldquo;is the passenger female?&rdquo;</strong>
          Females mostly survive; among males, the next question is <strong>&ldquo;is this a child (age ≤
          9.5)?&rdquo;</strong>, and young boys with few siblings survive while adult men mostly don&rsquo;t.
          Nobody told the tree the maritime code of &ldquo;women and children first&rdquo; — it recovered that
          rule from the data, and wrote it down where you can read it. That is the entire case for a single
          tree.
        </p>

        <h2>Which feature carried it?</h2>
        <p>
          Permutation importance on the test set (the trustworthy measure from the{" "}
          <Link href="/learn/decision-trees/feature-importance" style={link}>importance page</Link>) confirms
          what the rules imply:
        </p>
        <CodeOutput label="permutation importance (test set)">{`sex        +0.261
pclass     +0.084
fare       +0.033
age        +0.032
sibsp      +0.018
parch      +0.000
embarked   +0.000`}</CodeOutput>
        <p>
          Shuffling <code>sex</code> costs the model 26 accuracy points; nothing else comes close. Class and
          fare (money bought a place in a lifeboat) matter modestly; where you embarked doesn&rsquo;t matter at
          all once the rest is known.
        </p>

        <Callout color={TREES} title={<>The honest verdict</>}>
          A gradient-boosted forest would likely nudge test accuracy a couple of points past our 83% — and it
          would give you nothing you could hand to a historian. The depth-3 tree&rsquo;s value isn&rsquo;t its
          score; it&rsquo;s that eight rules, readable in ten seconds, recover a known human decision. Use the
          single tree to <em>understand</em>; reach for the ensemble — <Link href="/map" style={link}>random
          forests and boosting</Link>, the rest of this family — when you need the last few points of accuracy.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/when-to-use-a-tree", label: <>← When to use a single tree</> }}
          next={{ href: "/map", label: <>Next family · Random forests, on the map →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
