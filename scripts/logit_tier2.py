# -*- coding: utf-8 -*-
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
import statsmodels.api as sm

rng = np.random.default_rng(42)
n = 1200

# Interpretable "loan default" dataset with named features on real-ish scales
age = rng.normal(40, 11, n).clip(19, 75)
income = rng.normal(62, 22, n).clip(15, 200)          # $k
util = rng.beta(2, 3, n)                               # credit utilization 0..1
prior = rng.poisson(0.5, n).clip(0, 6)                 # # prior defaults

# true log-odds of default (higher util & priors -> default; higher income & age -> repay)
z = (-1.1
     - 0.030 * (age - 40)
     - 0.022 * (income - 62)
     + 3.2 * (util - 0.4)
     + 0.85 * prior)
p = 1 / (1 + np.exp(-z))
default = (rng.random(n) < p).astype(int)

df = pd.DataFrame({"age": age, "income": income, "util": util, "prior": prior, "default": default})
print("default rate:", round(default.mean(), 3), " n=", n)
print()

X = df[["age", "income", "util", "prior"]].values
y = df["default"].values

# ---------- 1. Raw-coefficient model (unpenalized, to match statsmodels) ----------
clf = LogisticRegression(penalty=None, max_iter=5000).fit(X, y)
coef = clf.coef_[0]
names = ["age", "income", "util", "prior"]
print("=== RAW coefficients & odds ratios ===")
for nm, c in zip(names, coef):
    print(f"  {nm:8s} coef={c:+.4f}  OR=e^coef={np.exp(c):.3f}")
print(f"  intercept {clf.intercept_[0]:+.4f}")
print()

# odds-ratio interpretation examples
print("util coef", round(coef[2],4), "-> +0.1 util multiplies odds by", round(np.exp(coef[2]*0.1),3))
print("prior coef", round(coef[3],4), "-> +1 prior default multiplies odds by", round(np.exp(coef[3]),3))
print("age coef", round(coef[0],4), "-> +10 yrs multiplies odds by", round(np.exp(coef[0]*10),3))
print("income coef", round(coef[1],4), "-> +$10k multiplies odds by", round(np.exp(coef[1]*10),3))
print()

# ---------- 2. Standardized coefficients ----------
Xs = StandardScaler().fit_transform(X)
clfs = LogisticRegression(penalty=None, max_iter=5000).fit(Xs, y)
print("=== STANDARDIZED coefficients (per 1 SD) ===")
sds = X.std(axis=0)
for nm, c, sd in zip(names, clfs.coef_[0], sds):
    print(f"  {nm:8s} std_coef={c:+.4f}  |OR per SD|={np.exp(abs(c)):.3f}   (1 SD = {sd:.3f})")
print("  ranking by |std coef|:", [names[i] for i in np.argsort(-np.abs(clfs.coef_[0]))])
print()

# ---------- 3. statsmodels for p-values / CIs ----------
Xc = sm.add_constant(X)
res = sm.Logit(y, Xc).fit(disp=0)
print("=== statsmodels Logit: coef, std err, z, p, 95% CI ===")
params = res.params; bse = res.bse; z_ = res.tvalues; pvals = res.pvalues; ci = res.conf_int()
labels = ["const"] + names
for i, lab in enumerate(labels):
    print(f"  {lab:8s} coef={params[i]:+.4f}  se={bse[i]:.4f}  z={z_[i]:+.2f}  p={pvals[i]:.2e}  CI=[{ci[i][0]:+.3f}, {ci[i][1]:+.3f}]")
print()
# odds-ratio CI for prior
print("prior OR CI:", round(np.exp(ci[4][0]),3), "-", round(np.exp(ci[4][1]),3))
print()

# ---------- 4. Regularization path (C sweep) ----------
print("=== L2 regularization path: coefficients vs C ===")
Cs = [0.001, 0.01, 0.1, 1.0, 10.0, 100.0]
for C in Cs:
    m = LogisticRegression(penalty="l2", C=C, max_iter=5000).fit(Xs, y)
    print(f"  C={C:7.3f}  coefs(std)={np.round(m.coef_[0],3)}")
print()
print("=== L1 path (sparsity) ===")
for C in Cs:
    m = LogisticRegression(penalty="l1", solver="liblinear", C=C, max_iter=5000).fit(Xs, y)
    nz = (np.abs(m.coef_[0])>1e-6).sum()
    print(f"  C={C:7.3f}  coefs(std)={np.round(m.coef_[0],3)}  nonzero={nz}")
