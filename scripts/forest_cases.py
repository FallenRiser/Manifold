"""Real-number backing for the Random Forests track "In the wild" case.

Dataset: Forest Cover Type (OpenML/UCI 'covtype', 581k rows, 54 features, 7
classes) — predict the tree-cover type of a 30x30m forest patch from cartographic
features. Fittingly, a forest classifying forests. We subsample 25k rows for a
fast, reproducible run.

Honest-numbers doctrine (PROJECT.md §11): every figure printed here is what the
published page reports. Run: `python scripts/forest_cases.py`. sklearn 1.8,
numpy; fetches covtype once (cached by sklearn). Deterministic via random_state=0.
"""

import numpy as np
from sklearn.datasets import fetch_covtype
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance

RS = 0
rng = np.random.RandomState(RS)

data = fetch_covtype(as_frame=True)
df = data.frame
# subsample 25k for speed, keep it reproducible
df = df.sample(n=25000, random_state=RS).reset_index(drop=True)
feat_names = [c for c in df.columns if c != "Cover_Type"]
X = df[feat_names].to_numpy(float)
y = df["Cover_Type"].to_numpy(int)

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=RS)
print(f"train {len(y_tr)}  test {len(y_te)}  features {X.shape[1]}  classes {len(set(y))}")

# --- 1. a single tuned decision tree (the baseline from the last track) -----
# tune depth briefly so the single-tree baseline is fair, not a strawman
best_d, best = None, -1
from sklearn.model_selection import cross_val_score
for d in [8, 12, 16, 20, None]:
    cv = cross_val_score(DecisionTreeClassifier(max_depth=d, random_state=RS), X_tr, y_tr, cv=3).mean()
    if cv > best:
        best, best_d = cv, d
tree = DecisionTreeClassifier(max_depth=best_d, random_state=RS).fit(X_tr, y_tr)
print(f"\n[single decision tree]  best max_depth={best_d}")
print(f"  test accuracy {tree.score(X_te, y_te):.3f}")

# --- 2. a random forest, out of the box -------------------------------------
rf = RandomForestClassifier(
    n_estimators=300, max_features="sqrt", oob_score=True,
    n_jobs=-1, random_state=RS,
).fit(X_tr, y_tr)
print("\n[random forest, 300 trees, defaults]")
print(f"  OOB accuracy  {rf.oob_score_:.3f}   (estimated from training data alone)")
print(f"  test accuracy {rf.score(X_te, y_te):.3f}")
print(f"  lift over single tree: +{(rf.score(X_te, y_te) - tree.score(X_te, y_te)) * 100:.1f} points")

# --- 3. accuracy vs number of trees (the plateau) ---------------------------
print("\n[test accuracy vs n_estimators]")
for B in [1, 5, 25, 50, 100, 300]:
    m = RandomForestClassifier(n_estimators=B, max_features="sqrt", n_jobs=-1, random_state=RS).fit(X_tr, y_tr)
    print(f"  B={B:>3}  test {m.score(X_te, y_te):.3f}")

# --- 4. what drives it? permutation importance (top features) ---------------
perm = permutation_importance(rf, X_te, y_te, n_repeats=5, random_state=RS, n_jobs=-1)
order = np.argsort(perm.importances_mean)[::-1][:6]
print("\n[permutation importance, top 6 features]")
for j in order:
    print(f"  {feat_names[j]:34s} {perm.importances_mean[j]:+.3f}")


# ============================================================================
# EXPANSION (mastery track): regression + quantile intervals, correlated-feature
# importance, imbalanced forests, and isolation forests. Backs the pages of the
# same names. California housing is real; the imbalance/correlation/anomaly demos
# are synthetic and framed as such on their pages.
# ============================================================================
print("\n\n===== EXPANSION NUMBERS =====")
from sklearn.datasets import fetch_california_housing, make_classification
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error, r2_score, roc_auc_score, recall_score, precision_score

# --- regression forest + 80% prediction intervals (California housing) ---
cal = fetch_california_housing(as_frame=True)
Xr, yr = cal.data.to_numpy(float), cal.target.to_numpy(float)
Xrtr, Xrte, yrtr, yrte = train_test_split(Xr, yr, test_size=0.25, random_state=RS)
rtree = DecisionTreeRegressor(max_depth=9, random_state=RS).fit(Xrtr, yrtr)
rfr = RandomForestRegressor(n_estimators=300, oob_score=True, n_jobs=-1, random_state=RS).fit(Xrtr, yrtr)
print(f"[regression] single tree R2 {r2_score(yrte, rtree.predict(Xrte)):.3f} RMSE {mean_squared_error(yrte, rtree.predict(Xrte))**0.5:.3f}")
print(f"[regression] RF 300      R2 {r2_score(yrte, rfr.predict(Xrte)):.3f} RMSE {mean_squared_error(yrte, rfr.predict(Xrte))**0.5:.3f}  OOB R2 {rfr.oob_score_:.3f}")
allp = np.stack([t.predict(Xrte) for t in rfr.estimators_], axis=1)
lo, hi = np.percentile(allp, [10, 90], axis=1)
print(f"[quantile] 80% interval coverage {np.mean((yrte>=lo)&(yrte<=hi)):.3f}  mean width {np.mean(hi-lo):.3f}")

# --- correlated-feature importance trap ---
rng = np.random.RandomState(RS)
z = rng.randn(3000)
x1, x2 = z + 0.05*rng.randn(3000), z + 0.05*rng.randn(3000)
Xc = np.column_stack([x1, x2, rng.randn(3000, 4)])
yc = (z + 0.3*rng.randn(3000) > 0).astype(int)
Xctr, Xcte, yctr, ycte = train_test_split(Xc, yc, test_size=0.3, random_state=RS)
rfc = RandomForestClassifier(n_estimators=300, random_state=RS, n_jobs=-1).fit(Xctr, yctr)
pm = permutation_importance(rfc, Xcte, ycte, n_repeats=10, random_state=RS).importances_mean
print(f"[correlated] MDI  x1 {rfc.feature_importances_[0]:.3f} x2 {rfc.feature_importances_[1]:.3f} (shared)")
print(f"[correlated] perm x1 {pm[0]:.3f} x2 {pm[1]:.3f} (twin compensates when one is shuffled)")

# --- imbalanced forest: class_weight is a weak lever; threshold-moving works ---
Xi, yi = make_classification(n_samples=6000, n_features=20, weights=[0.95, 0.05], flip_y=0.01, random_state=RS)
Xitr, Xite, yitr, yite = train_test_split(Xi, yi, test_size=0.3, stratify=yi, random_state=RS)
def _rep(tag, model, thr=0.5):
    p = (model.predict_proba(Xite)[:, 1] >= thr).astype(int)
    print(f"[imbalance] {tag:26s} recall {recall_score(yite, p):.3f}  precision {precision_score(yite, p):.3f}")
_rep("default thr .5", RandomForestClassifier(n_estimators=300, random_state=RS, n_jobs=-1).fit(Xitr, yitr))
_rep("class_weight=balanced", RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=RS, n_jobs=-1).fit(Xitr, yitr))
_rep("default thr .30", RandomForestClassifier(n_estimators=300, random_state=RS, n_jobs=-1).fit(Xitr, yitr), 0.30)

# --- isolation forest (synthetic: 2000 inliers + 100 uniform outliers) ---
inl = rng.randn(2000, 2)*0.5 + np.array([2, 2])
out = rng.uniform(-2, 6, size=(100, 2))
Xa, ya = np.vstack([inl, out]), np.r_[np.zeros(2000), np.ones(100)]
iso = IsolationForest(n_estimators=200, contamination=0.05, random_state=RS).fit(Xa)
print(f"[isolation] ROC-AUC {roc_auc_score(ya, -iso.score_samples(Xa)):.3f}")
