# -*- coding: utf-8 -*-
import warnings
warnings.filterwarnings("ignore")
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score

# ===================== PERFECT SEPARATION =====================
# 1-D perfectly separable data: class 0 all below 0, class 1 all above.
print("===== PERFECT SEPARATION =====")
x = np.array([-3.,-2.5,-2.,-1.5,-1.,-0.5, 0.5,1.,1.5,2.,2.5,3.])
yb = np.array([0,0,0,0,0,0, 1,1,1,1,1,1])
X = x.reshape(-1,1)
# Unpenalized -> weight tries to run to infinity; watch coef grow with max_iter
print("Unpenalized logistic, coefficient vs iteration budget:")
for it in [5, 20, 100, 1000, 10000]:
    m = LogisticRegression(penalty=None, max_iter=it).fit(X, yb)
    print(f"  max_iter={it:6d}  weight={m.coef_[0][0]:10.3f}  intercept={m.intercept_[0]:8.3f}")
print("  -> the weight just keeps growing; there is no finite minimum.")
print()
print("With L2 (C=1.0) the weight is pinned to a finite value:")
m = LogisticRegression(penalty='l2', C=1.0, max_iter=10000).fit(X, yb)
print(f"  weight={m.coef_[0][0]:.3f}  intercept={m.intercept_[0]:.3f}")
mp = m.predict_proba([[0.4],[0.0],[-0.4]])[:,1]
print(f"  P(class1) at x=0.4/0.0/-0.4: {mp.round(3)}")
mu = LogisticRegression(penalty=None, max_iter=10000).fit(X, yb)
mup = mu.predict_proba([[0.4],[0.0],[-0.4]])[:,1]
print(f"  unpenalized same points:    {mup.round(3)}  (0.999.. / 0.5 / 0.000..)")
print()

# ===================== CLASS IMBALANCE =====================
print("===== CLASS IMBALANCE =====")
X, y = make_classification(n_samples=3000, n_features=6, n_informative=4, n_redundant=0,
                           weights=[0.94, 0.06], flip_y=0.02, class_sep=0.9, random_state=1)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
print("positive rate:", round(y.mean(),3), " test positives:", int(yte.sum()), "/", len(yte))
print()

def report(name, clf):
    clf.fit(Xtr, ytr)
    pred = clf.predict(Xte)
    proba = clf.predict_proba(Xte)[:,1]
    acc = (pred==yte).mean()
    tn, fp, fn, tp = confusion_matrix(yte, pred).ravel()
    print(f"  {name}")
    print(f"    acc={acc:.3f}  precision={precision_score(yte,pred,zero_division=0):.3f}  recall={recall_score(yte,pred,zero_division=0):.3f}  f1={f1_score(yte,pred,zero_division=0):.3f}  AUC={roc_auc_score(yte,proba):.3f}")
    print(f"    confusion [tn={tn} fp={fp} fn={fn} tp={tp}]  caught {tp}/{tp+fn} positives")

report("default (no weighting), threshold 0.5", LogisticRegression(max_iter=5000))
report("class_weight='balanced', threshold 0.5", LogisticRegression(class_weight='balanced', max_iter=5000))

# threshold tuning on the default model instead of reweighting
print()
clf = LogisticRegression(max_iter=5000).fit(Xtr, ytr)
proba = clf.predict_proba(Xte)[:,1]
print("  default model, lowered threshold:")
for t in [0.5, 0.2, 0.1, 0.06]:
    pred = (proba>=t).astype(int)
    tn, fp, fn, tp = confusion_matrix(yte, pred).ravel()
    print(f"    t={t:.2f}  precision={precision_score(yte,pred,zero_division=0):.3f}  recall={recall_score(yte,pred,zero_division=0):.3f}  caught {tp}/{tp+fn}")

# ===================== FEATURE ENGINEERING (curved boundary) =====================
print()
print("===== FEATURE ENGINEERING: circular data =====")
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
rng = np.random.default_rng(3)
nn = 400
r = rng.uniform(0, 2.4, nn); th = rng.uniform(0, 2*np.pi, nn)
Xc = np.column_stack([r*np.cos(th), r*np.sin(th)])
yc = (r < 1.3).astype(int)   # inner disk = class 1, outer ring = class 0
yc = yc ^ (rng.random(nn) < 0.05)  # 5% noise
lin = LogisticRegression(max_iter=5000).fit(Xc, yc)
print("  plain logistic accuracy on circular data:", round(lin.score(Xc,yc),3), "(can't separate a ring with a line)")
poly = make_pipeline(PolynomialFeatures(2, include_bias=False), LogisticRegression(max_iter=5000)).fit(Xc, yc)
print("  with degree-2 features (adds x^2,y^2,xy):", round(poly.score(Xc,yc),3))
