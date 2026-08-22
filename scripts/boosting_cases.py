"""
Honest-numbers backing for the Boosting track (Manifold, Trees & ensembles).

Every figure quoted on the Boosting pages is printed by this script. Deterministic
(random_state=0 everywhere). Reuses the SAME datasets as the Decision-Trees and
Random-Forests tracks so the cross-track comparisons are apples-to-apples:
  - California housing  (regression)  — tree R2 0.673, forest R2 0.795 (prior tracks)
  - Forest Cover Type   (25k subsample, classification) — forest test 0.847 (prior)

Requires: scikit-learn 1.8, numpy, xgboost, lightgbm.

    python scripts/boosting_cases.py
"""
import time
import warnings
import numpy as np
from sklearn.datasets import fetch_california_housing, fetch_covtype, load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    AdaBoostClassifier,
    GradientBoostingRegressor,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.metrics import accuracy_score, log_loss, r2_score, mean_squared_error

warnings.filterwarnings("ignore")
RS = 0


def rmse(y, p):
    return mean_squared_error(y, p) ** 0.5


def hr(title):
    print("\n" + "=" * 68)
    print(title)
    print("=" * 68)


# ----------------------------------------------------------------------------
# SECTION 1 — AdaBoost: train error -> 0 while test error keeps falling.
# The textbook margin demo needs stumps that can drive train error to 0, so use
# breast-cancer (569 rows, 30 features) rather than the hard covtype task.
# ----------------------------------------------------------------------------
hr("SECTION 1  AdaBoost with decision stumps (margins phenomenon)")
Xbc, ybc = load_breast_cancer(return_X_y=True)
Xbc_tr, Xbc_te, ybc_tr, ybc_te = train_test_split(
    Xbc, ybc, test_size=0.3, random_state=RS, stratify=ybc
)
ada = AdaBoostClassifier(
    estimator=DecisionTreeClassifier(max_depth=1),
    n_estimators=300,
    learning_rate=1.0,
    random_state=RS,
).fit(Xbc_tr, ybc_tr)
tr_stages = list(ada.staged_predict(Xbc_tr))
te_stages = list(ada.staged_predict(Xbc_te))
print("single stump:  train err %.4f   test err %.4f"
      % (1 - accuracy_score(ybc_tr, tr_stages[0]), 1 - accuracy_score(ybc_te, te_stages[0])))
first_zero = next((i + 1 for i, p in enumerate(tr_stages) if accuracy_score(ybc_tr, p) == 1.0), None)
print("train error first hits 0 at n = %s" % first_zero)
for n in [1, 5, 10, 25, 50, 100, 300]:
    tr = 1 - accuracy_score(ybc_tr, tr_stages[n - 1])
    te = 1 - accuracy_score(ybc_te, te_stages[n - 1])
    print("  n=%3d   train err %.4f   test err %.4f" % (n, tr, te))

# Covtype loaded once here for the classification sections below.
Xc, yc = fetch_covtype(return_X_y=True)
rng = np.random.RandomState(RS)
idx = rng.choice(len(Xc), 25000, replace=False)
Xc, yc = Xc[idx], yc[idx]


# ----------------------------------------------------------------------------
# SECTION 2 — Gradient boosting for REGRESSION (California housing).
# ----------------------------------------------------------------------------
hr("SECTION 2  Gradient boosting regression  (California housing)")
Xh, yh = fetch_california_housing(return_X_y=True)
Xh_tr, Xh_te, yh_tr, yh_te = train_test_split(
    Xh, yh, test_size=0.25, random_state=RS
)

gbr = GradientBoostingRegressor(
    n_estimators=300, learning_rate=0.1, max_depth=3, random_state=RS
).fit(Xh_tr, yh_tr)
p = gbr.predict(Xh_te)
print("GBM (lr=0.1, 300 trees, depth 3):  R2 %.3f  RMSE %.3f"
      % (r2_score(yh_te, p), rmse(yh_te, p)))
print("  reference — single tuned tree R2 0.673, random forest R2 0.795")

print("\nlearning curve (R2 as trees are added):")
staged = list(gbr.staged_predict(Xh_te))
for n in [1, 10, 50, 100, 200, 300]:
    print("  n=%3d   R2 %.3f" % (n, r2_score(yh_te, staged[n - 1])))

print("\nshrinkage: low learning rate + more trees generalises better:")
for lr, n in [(1.0, 300), (0.3, 300), (0.1, 300), (0.05, 600), (0.01, 3000)]:
    m = GradientBoostingRegressor(
        n_estimators=n, learning_rate=lr, max_depth=3, random_state=RS
    ).fit(Xh_tr, yh_tr)
    print("  lr=%.2f  trees=%4d   test R2 %.3f" % (lr, n, r2_score(yh_te, m.predict(Xh_te))))

print("\nstochastic (row subsample) at lr=0.1, 300 trees, depth 3:")
for sub in [1.0, 0.8, 0.5]:
    m = GradientBoostingRegressor(
        n_estimators=300, learning_rate=0.1, max_depth=3,
        subsample=sub, random_state=RS
    ).fit(Xh_tr, yh_tr)
    print("  subsample=%.1f   test R2 %.3f" % (sub, r2_score(yh_te, m.predict(Xh_te))))

print("\nrobust losses under 3%% gross label corruption (y *= 8 on outliers):")
ycorr = yh_tr.copy()
out = rng.choice(len(ycorr), int(0.03 * len(ycorr)), replace=False)
ycorr[out] = ycorr[out] * 8.0
for loss in ["squared_error", "absolute_error", "huber"]:
    m = GradientBoostingRegressor(
        n_estimators=300, learning_rate=0.1, max_depth=3,
        loss=loss, random_state=RS
    ).fit(Xh_tr, ycorr)
    print("  loss=%-15s test R2 %.3f  (clean targets)" % (loss, r2_score(yh_te, m.predict(Xh_te))))

print("\nearly stopping via a validation fraction (n_iter_no_change=10):")
es = GradientBoostingRegressor(
    n_estimators=3000, learning_rate=0.05, max_depth=3,
    validation_fraction=0.1, n_iter_no_change=10, random_state=RS
).fit(Xh_tr, yh_tr)
print("  stopped at %d of 3000 trees   test R2 %.3f"
      % (es.n_estimators_, r2_score(yh_te, es.predict(Xh_te))))


# ----------------------------------------------------------------------------
# SECTION 3 — Gradient boosting for CLASSIFICATION (covtype multiclass).
# ----------------------------------------------------------------------------
hr("SECTION 3  Gradient boosting classification  (Forest Cover Type, 25k)")
Xt_tr, Xt_te, yt_tr, yt_te = train_test_split(
    Xc, yc, test_size=0.3, random_state=RS, stratify=yc
)
yt_tr0, yt_te0 = yt_tr - 1, yt_te - 1  # 0-indexed labels for XGBoost
for it in [300, 700]:
    hgb = HistGradientBoostingClassifier(
        max_iter=it, learning_rate=0.1, max_leaf_nodes=63, random_state=RS
    ).fit(Xt_tr, yt_tr)
    pp = hgb.predict_proba(Xt_te)
    print("HistGradientBoosting (%d iters, 63 leaves):  test acc %.3f  log-loss %.3f"
          % (it, accuracy_score(yt_te, hgb.predict(Xt_te)), log_loss(yt_te, pp)))
print("  reference — random forest (300 trees) test 0.847")


# ----------------------------------------------------------------------------
# SECTION 4 — Modern boosters head-to-head (the CASE page). Same covtype split.
# ----------------------------------------------------------------------------
hr("SECTION 4  Head-to-head on covtype 25k  (accuracy + fit time)")
import xgboost as xgb
import lightgbm as lgb

def timed(name, model, y_tr=yt_tr, y_te=yt_te):
    t = time.time()
    model.fit(Xt_tr, y_tr)
    dt = time.time() - t
    acc = accuracy_score(y_te, model.predict(Xt_te))
    print("  %-24s test acc %.3f   fit %.1fs" % (name, acc, dt))
    return acc

timed("RandomForest(300)", RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=RS))
timed("sklearn HistGBM(700)", HistGradientBoostingClassifier(
    max_iter=700, learning_rate=0.1, max_leaf_nodes=63, random_state=RS))
timed("XGBoost(700)", xgb.XGBClassifier(
    n_estimators=700, learning_rate=0.1, max_depth=8, tree_method="hist",
    n_jobs=-1, random_state=RS, verbosity=0), y_tr=yt_tr0, y_te=yt_te0)
timed("LightGBM(700)", lgb.LGBMClassifier(
    n_estimators=700, learning_rate=0.1, num_leaves=63, n_jobs=-1,
    random_state=RS, verbose=-1))


# ----------------------------------------------------------------------------
# SECTION 5 — Newton step: effect of the L2 leaf penalty (XGBoost reg_lambda).
# ----------------------------------------------------------------------------
hr("SECTION 5  XGBoost regularisation (reg_lambda, the Newton denominator)")
for lam in [0.0, 1.0, 10.0]:
    m = xgb.XGBClassifier(
        n_estimators=300, learning_rate=0.1, max_depth=8, reg_lambda=lam,
        tree_method="hist", n_jobs=-1, random_state=RS, verbosity=0
    ).fit(Xt_tr, yt_tr0)
    print("  reg_lambda=%5.1f   test acc %.3f" % (lam, accuracy_score(yt_te0, m.predict(Xt_te))))


# ----------------------------------------------------------------------------
# SECTION 6 — Boosting is NOT self-regularising: without early stopping it
# overfits. (a) train vs test divergence on housing; (b) covtype collapse.
# ----------------------------------------------------------------------------
hr("SECTION 6  Overfitting: why early stopping / shrinkage are not optional")
over = GradientBoostingRegressor(
    n_estimators=3000, learning_rate=0.1, max_depth=5, random_state=RS
).fit(Xh_tr, yh_tr)
tr_st = list(over.staged_predict(Xh_tr))
te_st = list(over.staged_predict(Xh_te))
print("deep GBM (lr=0.1, depth 5), train vs test R2 as trees pile up:")
best_n, best_r2 = 0, -9
for n in [50, 100, 300, 700, 1500, 3000]:
    trr = r2_score(yh_tr, tr_st[n - 1])
    ter = r2_score(yh_te, te_st[n - 1])
    print("  n=%4d   train R2 %.3f   test R2 %.3f" % (n, trr, ter))
for i, p in enumerate(te_st):
    r = r2_score(yh_te, p)
    if r > best_r2:
        best_r2, best_n = r, i + 1
print("  test R2 peaks at n=%d (R2 %.3f) then drifts down — the classic hump"
      % (best_n, best_r2))

print("\ncovtype: same HistGBM with early stopping ON vs OFF (700 iters, 63 leaves):")
for es in [True, False]:
    m = HistGradientBoostingClassifier(
        max_iter=700, learning_rate=0.1, max_leaf_nodes=63,
        early_stopping=es, random_state=RS
    ).fit(Xt_tr, yt_tr)
    print("  early_stopping=%-5s test acc %.3f  (used %d iters)"
          % (str(es), accuracy_score(yt_te, m.predict(Xt_te)), m.n_iter_))
print("  (majority-class baseline on covtype is ~0.487)")

print("\nDone.")
