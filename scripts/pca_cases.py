"""
pca_cases.py — honest numbers for the PCA track (PROJECT.md §11 rule 9/10).

Every published number in the PCA track's scree, standardize, SVD, and
"in the wild" pages comes from a run of this file. Deterministic: all
randomness seeded, sklearn 1.8, numpy 2.3.

Run:  python scripts/pca_cases.py
"""

import numpy as np
from sklearn.datasets import load_digits, load_wine
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

np.set_printoptions(precision=4, suppress=True)
RS = 0


def section(t):
    print("\n" + "=" * 66 + "\n" + t + "\n" + "=" * 66)


# ------------------------------------------------------------------ #
# 1. DIGITS — the compression / scree story
# ------------------------------------------------------------------ #
section("1. load_digits — spectrum, cumulative variance, reconstruction")
digits = load_digits()
X = digits.data          # (1797, 64), pixel intensities 0..16
y = digits.target
print("shape", X.shape, "| classes", len(np.unique(y)))

# PCA centers internally; images are same-scale pixels so we do NOT standardize.
pca = PCA(random_state=RS).fit(X)
evr = pca.explained_variance_ratio_
cum = np.cumsum(evr)

print("\nfirst 12 explained-variance ratios (%):")
print(np.round(evr[:12] * 100, 2))

for k in [1, 2, 5, 10, 20, 21, 30, 40]:
    print(f"  k={k:>2}: cumulative variance = {cum[k-1]*100:5.2f}%")

for thresh in [0.80, 0.90, 0.95, 0.99]:
    k = int(np.searchsorted(cum, thresh) + 1)
    print(f"  reach {int(thresh*100)}% variance -> k = {k} components  ({k}/64 = {k/64*100:.0f}% of dims)")

# reconstruction error (mean squared pixel error) at each k
section("1b. digits reconstruction error vs k")
for k in [1, 5, 10, 20, 30, 40, 64]:
    p = PCA(n_components=k, random_state=RS).fit(X)
    Xr = p.inverse_transform(p.transform(X))
    mse = np.mean((X - Xr) ** 2)
    # discarded variance should equal (1 - cum[k-1]) * total variance
    print(f"  k={k:>2}: pixel MSE = {mse:7.4f} | variance kept = {np.sum(p.explained_variance_ratio_)*100:5.2f}%")

total_var = np.sum(pca.explained_variance_)
print(f"\ntotal variance (sum of all eigenvalues) = {total_var:.4f}")

# ------------------------------------------------------------------ #
# 2. DIGITS — PCA as preprocessing for a classifier
# ------------------------------------------------------------------ #
section("2. digits — logistic regression on full 64 vs PCA-k features")
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=RS, stratify=y)

full = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000, random_state=RS))
full.fit(Xtr, ytr)
print(f"  full 64 features : test accuracy = {full.score(Xte, yte):.4f}")

for k in [10, 20, 30, 40]:
    clf = make_pipeline(StandardScaler(), PCA(n_components=k, random_state=RS),
                        LogisticRegression(max_iter=5000, random_state=RS))
    clf.fit(Xtr, ytr)
    print(f"  PCA({k:>2}) features : test accuracy = {clf.score(Xte, yte):.4f}")

# ------------------------------------------------------------------ #
# 3. WINE — why you must standardize first
# ------------------------------------------------------------------ #
section("3. load_wine — PCA with vs without standardizing (the scale trap)")
wine = load_wine()
Xw = wine.data
feat = wine.feature_names
print("feature ranges (max - min), showing the scale spread:")
rng = Xw.max(0) - Xw.min(0)
order = np.argsort(rng)[::-1]
for i in order[:4]:
    print(f"  {feat[i]:<28} range = {rng[i]:10.2f}")
for i in order[-2:]:
    print(f"  {feat[i]:<28} range = {rng[i]:10.4f}")

# raw (covariance) PCA — dominated by the largest-scale feature
pca_raw = PCA(random_state=RS).fit(Xw)
top_raw = np.argmax(np.abs(pca_raw.components_[0]))
print("\nWITHOUT standardizing (covariance PCA):")
print(f"  PC1 explains {pca_raw.explained_variance_ratio_[0]*100:.2f}% of variance")
print(f"  PC1 is dominated by: {feat[top_raw]} (|loading| = {abs(pca_raw.components_[0][top_raw]):.4f})")
print(f"  first two PCs cumulative: {np.sum(pca_raw.explained_variance_ratio_[:2])*100:.2f}%")

# standardized (correlation) PCA — balanced
Xw_std = StandardScaler().fit_transform(Xw)
pca_std = PCA(random_state=RS).fit(Xw_std)
print("\nWITH standardizing (correlation PCA):")
print(f"  PC1 explains {pca_std.explained_variance_ratio_[0]*100:.2f}% of variance")
print(f"  first two PCs cumulative: {np.sum(pca_std.explained_variance_ratio_[:2])*100:.2f}%")
top3 = np.argsort(np.abs(pca_std.components_[0]))[::-1][:3]
print("  PC1 top loadings:", [(feat[i], round(pca_std.components_[0][i], 3)) for i in top3])
for thresh in [0.90, 0.95]:
    kk = int(np.searchsorted(np.cumsum(pca_std.explained_variance_ratio_), thresh) + 1)
    print(f"  standardized: reach {int(thresh*100)}% -> k = {kk} / 13 components")

# ------------------------------------------------------------------ #
# 4. SVD == PCA (numerical equivalence, Eckart-Young)
# ------------------------------------------------------------------ #
section("4. SVD equals PCA (singular values^2 / (n-1) == eigenvalues)")
Xc = X - X.mean(0)
U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
eig_from_svd = (S ** 2) / (Xc.shape[0] - 1)
print("first 5 eigenvalues via covariance :", np.round(pca.explained_variance_[:5], 4))
print("first 5 via SVD (s^2/(n-1))        :", np.round(eig_from_svd[:5], 4))
print("max abs difference over all 64      :", np.max(np.abs(pca.explained_variance_ - eig_from_svd)))

# ------------------------------------------------------------------ #
# 5. Data for the interactive ScreeLab (digits cumulative %, first 30)
# ------------------------------------------------------------------ #
section("5. arrays to hardcode into labs")
print("digits EVR% first 30 (for ScreeLab):")
print("[" + ", ".join(f"{v*100:.2f}" for v in evr[:30]) + "]")
print("\ndigits CUMULATIVE% first 30:")
print("[" + ", ".join(f"{v*100:.2f}" for v in cum[:30]) + "]")

print("\nDONE.")
