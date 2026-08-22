"""Real-number backing for the Decision Trees track "In the wild" case.

Dataset: the classic Titanic survival data (OpenML 'titanic', 1309 rows).
Task: predict `survived` from passenger attributes.

Honest-numbers doctrine (PROJECT.md §11): every figure printed here is what the
published page reports. Run: `python scripts/tree_cases.py`. Requires internet
once to fetch OpenML; sklearn 1.8, numpy. Deterministic via random_state=0.

Leakage note: `boat`, `body`, and `home.dest` are recorded AFTER the outcome
(which lifeboat you reached, whether your body was recovered) and would let the
model cheat. They are dropped. We predict from pre-voyage attributes only.
"""

import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.inspection import permutation_importance

RS = 0

df = fetch_openml("titanic", version=1, as_frame=True).frame

FEATURES = ["pclass", "sex", "age", "sibsp", "parch", "fare", "embarked"]
X = df[FEATURES].copy()
y = df["survived"].astype(int).to_numpy()

# encode categoricals to numbers (sklearn trees need numeric input); impute the
# two features with missing values by median / mode — a standard minimal recipe
X["sex"] = (X["sex"] == "male").astype(int)
X["embarked"] = X["embarked"].map({"S": 0, "C": 1, "Q": 2})
X["embarked"] = X["embarked"].fillna(X["embarked"].mode()[0])
X["age"] = X["age"].astype(float).fillna(X["age"].astype(float).median())
X["fare"] = X["fare"].astype(float).fillna(X["fare"].astype(float).median())
X = X.to_numpy(dtype=float)

X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=RS
)
print(f"train {len(y_tr)}  test {len(y_te)}  survival rate {y.mean():.3f}")

# --- 1. a full, unconstrained tree overfits ---------------------------------
full = DecisionTreeClassifier(random_state=RS).fit(X_tr, y_tr)
print("\n[full tree]")
print(f"  depth {full.get_depth()}  leaves {full.get_n_leaves()}")
print(f"  train acc {full.score(X_tr, y_tr):.3f}")
print(f"  test  acc {full.score(X_te, y_te):.3f}")

# --- 2. tune max_depth by 5-fold CV -----------------------------------------
print("\n[depth sweep, 5-fold CV on the training set]")
best_d, best_cv = None, -1
for d in [1, 2, 3, 4, 5, 6, 8, 10]:
    cv = cross_val_score(
        DecisionTreeClassifier(max_depth=d, random_state=RS), X_tr, y_tr, cv=5
    ).mean()
    print(f"  depth {d:>2}  cv acc {cv:.3f}")
    if cv > best_cv:
        best_cv, best_d = cv, d
pruned = DecisionTreeClassifier(max_depth=best_d, random_state=RS).fit(X_tr, y_tr)
print(f"  -> best depth {best_d}  (cv {best_cv:.3f})")
print(f"  pruned tree: train {pruned.score(X_tr, y_tr):.3f}  test {pruned.score(X_te, y_te):.3f}"
      f"  leaves {pruned.get_n_leaves()}")

# --- 3. cost-complexity pruning: pick alpha by CV ---------------------------
alphas = full.cost_complexity_pruning_path(X_tr, y_tr).ccp_alphas
alphas = alphas[alphas >= 0]
scores = [
    cross_val_score(
        DecisionTreeClassifier(ccp_alpha=a, random_state=RS), X_tr, y_tr, cv=5
    ).mean()
    for a in alphas
]
best_a = alphas[int(np.argmax(scores))]
ccp = DecisionTreeClassifier(ccp_alpha=best_a, random_state=RS).fit(X_tr, y_tr)
print("\n[cost-complexity pruning]")
print(f"  path length {len(alphas)}  best alpha {best_a:.5f}")
print(f"  ccp tree: depth {ccp.get_depth()}  leaves {ccp.get_n_leaves()}"
      f"  train {ccp.score(X_tr, y_tr):.3f}  test {ccp.score(X_te, y_te):.3f}")

# --- 4. what did the pruned tree learn first? -------------------------------
print("\n[top of the pruned depth-3 tree]")
depth3 = DecisionTreeClassifier(max_depth=3, random_state=RS).fit(X_tr, y_tr)
print(export_text(depth3, feature_names=FEATURES, max_depth=2))

# --- 5. permutation importance (trustworthy, on the test set) ---------------
perm = permutation_importance(depth3, X_te, y_te, n_repeats=30, random_state=RS)
print("[permutation importance, depth-3 tree, on test set]")
for j in np.argsort(perm.importances_mean)[::-1]:
    print(f"  {FEATURES[j]:10s} {perm.importances_mean[j]:+.3f}")


# ============================================================================
# Case B — a REGRESSION tree, end to end (California housing).
# Ties to the capstone dataset. Shows the depth/overfit tradeoff, the staircase,
# no-extrapolation, and feature importance for a numeric target.
# ============================================================================
print("\n\n===== CASE B: regression tree on California housing =====")
from sklearn.datasets import fetch_california_housing
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error, r2_score

cal = fetch_california_housing(as_frame=True)
Xc = cal.data.to_numpy(float)
yc = cal.target.to_numpy(float)  # median house value in $100k
cfeat = list(cal.data.columns)
Xc_tr, Xc_te, yc_tr, yc_te = train_test_split(Xc, yc, test_size=0.25, random_state=RS)
print(f"train {len(yc_tr)}  test {len(yc_te)}  features {Xc.shape[1]}")

print("\n[depth sweep — a regression tree overfits too]")
for d in [2, 4, 6, 8, 12, None]:
    t = DecisionTreeRegressor(max_depth=d, random_state=RS).fit(Xc_tr, yc_tr)
    rmse_tr = mean_squared_error(yc_tr, t.predict(Xc_tr)) ** 0.5
    rmse_te = mean_squared_error(yc_te, t.predict(Xc_te)) ** 0.5
    label = str(d) if d is not None else "None"
    print(f"  depth {label:>4}  leaves {t.get_n_leaves():>5}  train RMSE {rmse_tr:.3f}  test RMSE {rmse_te:.3f}  test R2 {r2_score(yc_te, t.predict(Xc_te)):.3f}")

# a CV-tuned depth
best_d, best = None, 1e9
for d in [4, 5, 6, 7, 8, 9, 10]:
    cv = -cross_val_score(DecisionTreeRegressor(max_depth=d, random_state=RS), Xc_tr, yc_tr,
                          cv=5, scoring="neg_root_mean_squared_error").mean()
    if cv < best:
        best, best_d = cv, d
tuned = DecisionTreeRegressor(max_depth=best_d, random_state=RS).fit(Xc_tr, yc_tr)
print(f"\n  CV-best depth {best_d}: test RMSE {mean_squared_error(yc_te, tuned.predict(Xc_te))**0.5:.3f}  R2 {r2_score(yc_te, tuned.predict(Xc_te)):.3f}")

# no extrapolation demo: predictions are bounded by training targets
print(f"  training target range: [{yc_tr.min():.2f}, {yc_tr.max():.2f}]")
print(f"  tree prediction range: [{tuned.predict(Xc_te).min():.2f}, {tuned.predict(Xc_te).max():.2f}]  (never exceeds training)")

perm_c = permutation_importance(tuned, Xc_te, yc_te, n_repeats=10, random_state=RS)
print("\n[permutation importance, top 4]")
for j in np.argsort(perm_c.importances_mean)[::-1][:4]:
    print(f"  {cfeat[j]:12s} {perm_c.importances_mean[j]:+.3f}")
