"""Real numbers for the Model selection track (PROJECT.md §11 rules 9-10).

Deterministic: fixed seeds, no network, stdlib + numpy + sklearn only.

    python scripts/model_selection_cases.py

Sections
  1. Selection optimism -- how much the winner's validation score lies.
  2. Nested vs flat cross-validation -- the size of the selection bias.
  3. The one-standard-error rule -- simpler model, same test performance.
  4. Learning curves -- reading which error term dominates.

Environment used for the published numbers: python 3.13.11, sklearn 1.8.0,
numpy 2.3.5.
"""

import numpy as np
from sklearn.datasets import load_digits, load_breast_cancer
from sklearn.linear_model import Ridge
from sklearn.model_selection import (
    GridSearchCV, KFold, StratifiedKFold, cross_val_score, train_test_split,
    learning_curve,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

RS = 0


def rule(title):
    print("\n" + "=" * 68)
    print(title)
    print("=" * 68)


# ---------------------------------------------------------------------------
# 1. Selection optimism: the winner's score is not an estimate
# ---------------------------------------------------------------------------
def section1():
    rule("1. Selection optimism (the winner's validation score is biased)")
    rng = np.random.RandomState(RS)
    n_val, trials = 200, 2000
    print(f"  {trials} trials. Every 'model' is a coin flip with TRUE accuracy 0.500.")
    print(f"  Each is scored on a validation set of n = {n_val}; we report the best.")
    print(f"{'models tried':>13} {'best val acc':>14} {'optimism':>10}")
    for k in [1, 2, 5, 10, 50, 200]:
        bests = []
        for _ in range(trials):
            # k independent models, each truly 50% accurate
            accs = rng.binomial(n_val, 0.5, size=k) / n_val
            bests.append(accs.max())
        m = float(np.mean(bests))
        print(f"{k:>13} {m:>14.4f} {m - 0.5:>10.4f}")
    print("\n  True accuracy is 0.500 in every row. The rise is pure selection.")


# ---------------------------------------------------------------------------
# 2. Nested vs flat cross-validation
# ---------------------------------------------------------------------------
def section2():
    rule("2. Nested vs flat cross-validation")
    X, y = load_breast_cancer(return_X_y=True)
    grid = {"svc__C": [0.01, 0.1, 1, 10, 100], "svc__gamma": [1e-4, 1e-3, 1e-2, 1e-1]}
    pipe = make_pipeline(StandardScaler(), SVC(random_state=RS))
    pipe.set_params()  # names: standardscaler, svc
    grid = {"svc__C": grid["svc__C"], "svc__gamma": grid["svc__gamma"]}

    flat_scores, nested_scores = [], []
    for trial in range(5):
        inner = StratifiedKFold(n_splits=4, shuffle=True, random_state=trial)
        outer = StratifiedKFold(n_splits=4, shuffle=True, random_state=trial + 100)
        gs = GridSearchCV(pipe, grid, cv=inner, n_jobs=-1)
        gs.fit(X, y)
        flat_scores.append(gs.best_score_)                      # the winner's own CV score
        nested = cross_val_score(gs, X, y, cv=outer, n_jobs=-1)  # honest outer estimate
        nested_scores.append(nested.mean())

    f, n_ = float(np.mean(flat_scores)), float(np.mean(nested_scores))
    print(f"  grid size: {len(grid['svc__C']) * len(grid['svc__gamma'])} configurations, 5 repeats")
    print(f"  flat CV   (best grid score, reported as performance): {f:.4f}")
    print(f"  nested CV (honest estimate)                         : {n_:.4f}")
    print(f"  optimism from reporting the winner's own score      : {f - n_:+.4f}")


# ---------------------------------------------------------------------------
# 3. The one-standard-error rule
# ---------------------------------------------------------------------------
def section3():
    rule("3. The one-standard-error rule")
    rng = np.random.RandomState(RS)
    n = 120
    x = np.sort(rng.uniform(-1, 1, n))
    y = np.sin(3 * x) + rng.normal(0, 0.35, n)
    xtr, xte, ytr, yte = train_test_split(x, y, test_size=0.4, random_state=RS)

    alphas = np.logspace(-6, 2, 25)
    cv = KFold(n_splits=5, shuffle=True, random_state=RS)
    means, ses = [], []
    for a in alphas:
        model = make_pipeline(PolynomialFeatures(9), Ridge(alpha=a))
        sc = -cross_val_score(model, xtr.reshape(-1, 1), ytr, cv=cv,
                              scoring="neg_mean_squared_error")
        means.append(sc.mean())
        ses.append(sc.std(ddof=1) / np.sqrt(len(sc)))
    means, ses = np.array(means), np.array(ses)

    i_min = int(np.argmin(means))
    threshold = means[i_min] + ses[i_min]
    # the SIMPLEST model (largest alpha) whose CV error is within one SE
    i_1se = int(np.max(np.where(means <= threshold)[0]))

    def test_mse(a):
        m = make_pipeline(PolynomialFeatures(9), Ridge(alpha=a))
        m.fit(xtr.reshape(-1, 1), ytr)
        return float(np.mean((m.predict(xte.reshape(-1, 1)) - yte) ** 2))

    print(f"  degree-9 polynomial ridge, 5-fold CV over {len(alphas)} alphas")
    print(f"  CV minimum      : alpha = {alphas[i_min]:.5f}  CV MSE {means[i_min]:.4f} "
          f"(+- {ses[i_min]:.4f})  test MSE {test_mse(alphas[i_min]):.4f}")
    print(f"  one-SE choice   : alpha = {alphas[i_1se]:.5f}  CV MSE {means[i_1se]:.4f}"
          f"                test MSE {test_mse(alphas[i_1se]):.4f}")
    print(f"  the 1-SE rule picks a penalty {alphas[i_1se] / alphas[i_min]:.0f}x stronger")


# ---------------------------------------------------------------------------
# 4. Learning curves
# ---------------------------------------------------------------------------
def section4():
    rule("4. Learning curves (which error term dominates?)")
    X, y = load_digits(return_X_y=True)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RS)

    # The weak model must genuinely PLATEAU for the "more data won't help"
    # reading to be honest. A depth-2 tree can express at most 4 leaves, so it
    # saturates almost immediately -- unlike a linear SVC on digits, which keeps
    # improving and would make the lesson false.
    for name, model in [
        ("capped    (decision tree, max_depth=2)", DecisionTreeClassifier(max_depth=2, random_state=RS)),
        ("good fit  (RBF SVC, C=10)", make_pipeline(StandardScaler(), SVC(C=10, gamma=0.001, random_state=RS))),
    ]:
        sizes, tr, va = learning_curve(
            model, X, y, cv=cv, n_jobs=-1,
            train_sizes=np.array([0.1, 0.325, 0.55, 0.775, 1.0]),
        )
        print(f"\n  {name}")
        print(f"{'n_train':>9} {'train acc':>11} {'val acc':>9} {'gap':>8}")
        for s, a, b in zip(sizes, tr.mean(axis=1), va.mean(axis=1)):
            print(f"{int(s):>9} {a:>11.4f} {b:>9.4f} {a - b:>8.4f}")


if __name__ == "__main__":
    section1()
    section2()
    section3()
    section4()
    print()
