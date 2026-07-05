# -*- coding: utf-8 -*-
import warnings; warnings.filterwarnings("ignore")
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification, make_blobs
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import roc_auc_score, roc_curve, precision_recall_curve, brier_score_loss
from sklearn.calibration import calibration_curve
from sklearn.multiclass import OneVsRestClassifier, OneVsOneClassifier

# ============ ROC / AUC (binary) — reuse LOGISTIC_SETUP-style data ============
print("===== ROC / AUC =====")
X, y = make_classification(n_samples=600, n_features=2, n_informative=2, n_redundant=0,
                           n_clusters_per_class=1, class_sep=0.9, flip_y=0.07, random_state=11)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.4, random_state=0)
clf = LogisticRegression().fit(Xtr, ytr)
proba = clf.predict_proba(Xte)[:, 1]
auc = roc_auc_score(yte, proba)
print("test AUC:", round(auc, 3), " n_test:", len(yte), " positives:", int(yte.sum()))
fpr, tpr, thr = roc_curve(yte, proba)
# sample ~14 points along the ROC curve for the lab
idx = np.linspace(0, len(fpr) - 1, 16).astype(int)
roc_pts = [(round(float(fpr[i]), 3), round(float(tpr[i]), 3), round(float(min(thr[i],1.0)), 3)) for i in idx]
print("ROC points (fpr, tpr, thr):")
for p in roc_pts: print("  ", p)

# a WEAKER model for the two-curve comparison (fewer informative features / noise)
Xw, yw = make_classification(n_samples=600, n_features=2, n_informative=1, n_redundant=1,
                             n_clusters_per_class=1, class_sep=0.5, flip_y=0.12, random_state=5)
Xwtr, Xwte, ywtr, ywte = train_test_split(Xw, yw, test_size=0.4, random_state=0)
pw = LogisticRegression().fit(Xwtr, ywtr).predict_proba(Xwte)[:, 1]
print("weak model AUC:", round(roc_auc_score(ywte, pw), 3))

# ============ CALIBRATION ============
print()
print("===== CALIBRATION =====")
# bigger binary set; logistic tends to be well-calibrated, GaussianNB over/under-confident
Xc, yc = make_classification(n_samples=4000, n_features=8, n_informative=5, n_redundant=2,
                             class_sep=0.8, flip_y=0.05, random_state=3)
Xctr, Xcte, yctr, ycte = train_test_split(Xc, yc, test_size=0.5, random_state=0)
lr = LogisticRegression(max_iter=5000).fit(Xctr, yctr)
nb = GaussianNB().fit(Xctr, yctr)
plr = lr.predict_proba(Xcte)[:, 1]
pnb = nb.predict_proba(Xcte)[:, 1]
print("Brier  logistic:", round(brier_score_loss(ycte, plr), 4), " naiveBayes:", round(brier_score_loss(ycte, pnb), 4))
for name, p in [("logistic", plr), ("naiveBayes", pnb)]:
    frac_pos, mean_pred = calibration_curve(ycte, p, n_bins=10, strategy="uniform")
    print(f"  {name} reliability (mean_pred -> observed_freq):")
    print("    pred:", np.round(mean_pred, 2).tolist())
    print("    obs :", np.round(frac_pos, 2).tolist())

# ============ MULTICLASS: softmax vs OvR vs OvO ============
print()
print("===== MULTICLASS =====")
Xm, ym = make_blobs(n_samples=600, centers=[[-2,-1],[2,-1],[0,2.4]], cluster_std=1.15, random_state=7)
Xmtr, Xmte, ymtr, ymte = train_test_split(Xm, ym, test_size=0.3, random_state=0)
soft = LogisticRegression(max_iter=5000).fit(Xmtr, ymtr)  # multinomial by default now
ovr = OneVsRestClassifier(LogisticRegression(max_iter=5000)).fit(Xmtr, ymtr)
ovo = OneVsOneClassifier(LogisticRegression(max_iter=5000)).fit(Xmtr, ymtr)
print("softmax (multinomial) test acc:", round(soft.score(Xmte, ymte), 3))
print("one-vs-rest            test acc:", round(ovr.score(Xmte, ymte), 3))
print("one-vs-one             test acc:", round(ovo.score(Xmte, ymte), 3))
# a sample point's 3 class probabilities (softmax sums to 1)
pt = np.array([[0.0, 0.0]])
print("softmax P at (0,0):", np.round(soft.predict_proba(pt)[0], 3), " sum:", round(soft.predict_proba(pt)[0].sum(),3))
print("num binary models: softmax=1 (joint), OvR=3, OvO=3 (=C(3,2))")
# export blob points for a lab (subsample 60)
rng = np.random.default_rng(1)
sub = rng.choice(len(Xm), 66, replace=False)
pts = [[round(float(Xm[i,0]),2), round(float(Xm[i,1]),2), int(ym[i])] for i in sub]
print("BLOB_PTS:", pts)
print("softmax coefs (3 classes x 2 feats):", np.round(soft.coef_,2).tolist(), "intercepts:", np.round(soft.intercept_,2).tolist())

# ============ COST-SENSITIVE ============
print()
print("===== COST-SENSITIVE threshold =====")
# using the ROC model: pick threshold minimizing expected cost for a cost ratio
# cost(FN)=C_fn, cost(FP)=C_fp. Optimal threshold = C_fp / (C_fp + C_fn) for calibrated probs.
for cfn, cfp in [(1,1),(5,1),(10,1),(1,5)]:
    t_star = cfp/(cfp+cfn)
    pred = (proba>=t_star).astype(int)
    from sklearn.metrics import confusion_matrix
    tn,fp,fn,tp = confusion_matrix(yte,pred).ravel()
    cost = cfn*fn + cfp*fp
    print(f"  C_fn={cfn} C_fp={cfp} -> t*={t_star:.2f}  fn={fn} fp={fp}  total cost={cost}")
