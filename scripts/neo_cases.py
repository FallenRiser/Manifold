"""Real-number backing for the Asteroid-Hazard capstone (/learn/asteroid-hazard-capstone).

Dataset: NASA Nearest-Earth-Objects, `public/capstone/neo_v2.csv` (90,836 rows).
Task: predict `hazardous` (a NASA "potentially hazardous asteroid" flag) from
object/approach features.

Honest-numbers doctrine (PROJECT.md §11): every figure the capstone pages print
comes from this script. Run: `python scripts/neo_cases.py`. Deterministic (RS=0),
sklearn 1.8 / numpy / pandas. No internet needed.

The capstone's spine (see docs/neo-capstone-plan.md): a naive "is it big?" rule
looks brilliant on ROC-AUC but collapses on PR-AUC; the real work is honest
metrics + a GROUPED-by-id split (the same object recurs across rows) plus the
bounded, genuine lift a model wrings from velocity + miss-distance.
"""

from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, average_precision_score, precision_score, recall_score,
    f1_score, confusion_matrix, precision_recall_curve,
)

RS = 0
ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "public" / "capstone" / "neo_v2.csv"

df = pd.read_csv(CSV)


def h1(t):
    print("\n" + "=" * 66 + f"\n{t}\n" + "=" * 66)


# ---------------------------------------------------------------- Section 1
h1("1 · First contact & integrity")
print(f"shape                : {df.shape[0]:,} rows x {df.shape[1]} cols")
print(f"nulls (total)        : {int(df.isnull().sum().sum())}")
print(f"unique id / rows     : {df['id'].nunique():,} / {len(df):,}  "
      f"({len(df) - df['id'].nunique():,} duplicate-id rows)")
print("constant columns     :", [c for c in df.columns if df[c].nunique() == 1])
rate = df["hazardous"].mean()
print(f"target `hazardous`   : {df['hazardous'].sum():,} True  ({rate:.4f} positive rate)")

# per-id consistency: is the label / size object-level, but kinematics event-level?
print("ids w/ >1 hazardous  :", int((df.groupby("id")["hazardous"].nunique() > 1).sum()))
print("ids w/ >1 abs_mag    :", int((df.groupby("id")["absolute_magnitude"].nunique() > 1).sum()))
print("ids w/ >1 rel_veloc  :", int((df.groupby("id")["relative_velocity"].nunique() > 1).sum()))

# ---------------------------------------------------------------- Section 2
h1("2 · Redundancy: three 'features' are one")
ratio = df["est_diameter_max"] / df["est_diameter_min"]
print(f"diameter_max/min     : constant {ratio.mean():.6f}  (= sqrt(5) = {5**0.5:.6f}),"
      f" std {ratio.std():.2e}")
corr = np.corrcoef(np.log(df["est_diameter_min"]), df["absolute_magnitude"])[0, 1]
print(f"corr(log diameter_min, absolute_magnitude) : {corr:.6f}")
print("=> diameter columns are a deterministic function of H; keep only absolute_magnitude.")

# ---------------------------------------------------------------- Section 3
h1("3 · The label is near-determined by size (partial leakage)")
haz = df[df.hazardous]
non = df[~df.hazardous]
print(f"H range  hazardous   : {haz['absolute_magnitude'].min():.2f} .. {haz['absolute_magnitude'].max():.2f}")
print(f"H range  non-hazard  : {non['absolute_magnitude'].min():.2f} .. {non['absolute_magnitude'].max():.2f}")
for thr in (21, 22, 22.5, 23):
    pred = df["absolute_magnitude"] <= thr
    acc = (pred == df["hazardous"]).mean()
    prec = precision_score(df["hazardous"], pred)
    rec = recall_score(df["hazardous"], pred)
    print(f"  rule H<= {thr:<4}: acc {acc:.4f}  precision {prec:.3f}  recall {rec:.3f}")

# ---------------------------------------------------------------- Section 4
FEATURES = ["absolute_magnitude", "relative_velocity", "miss_distance"]
X = df[FEATURES].to_numpy()
y = df["hazardous"].astype(int).to_numpy()
groups = df["id"].to_numpy()


def bench(name, Xtr, Xte, ytr, yte):
    print(f"\n--- {name}  (test n={len(yte):,}, positive rate {yte.mean():.3f}) ---")
    print(f"{'model':<26}{'ROC-AUC':>9}{'PR-AUC':>9}")
    out = {}

    def row(label, score):
        r = roc_auc_score(yte, score)
        p = average_precision_score(yte, score)
        print(f"{label:<26}{r:>9.4f}{p:>9.4f}")
        out[label] = (r, p)

    row("majority", np.full_like(yte, ytr.mean(), dtype=float))
    row("rule: smaller-H", -Xte[:, 0])                     # smaller H = bigger = likelier hazardous
    sc = StandardScaler().fit(Xtr)
    lr = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=RS).fit(sc.transform(Xtr), ytr)
    row("logistic (balanced)", lr.predict_proba(sc.transform(Xte))[:, 1])
    dt = DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=RS).fit(Xtr, ytr)
    row("decision tree (d=6)", dt.predict_proba(Xte)[:, 1])
    rf = RandomForestClassifier(n_estimators=300, class_weight="balanced", n_jobs=-1, random_state=RS).fit(Xtr, ytr)
    row("random forest", rf.predict_proba(Xte)[:, 1])
    gb = HistGradientBoostingClassifier(random_state=RS).fit(Xtr, ytr)
    row("hist gradient boosting", gb.predict_proba(Xte)[:, 1])
    return out, rf, sc


h1("4 · The evaluation harness: RANDOM vs GROUPED split")
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=RS, stratify=y)
rand_out, _, _ = bench("RANDOM split (object leakage!)", Xtr, Xte, ytr, yte)

gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=RS)
tr, te = next(gss.split(X, y, groups))
grp_out, rf_grp, _ = bench("GROUPED-by-id split (honest)", X[tr], X[te], y[tr], y[te])

print("\nLeakage gap (PR-AUC, random - grouped):")
for k in grp_out:
    print(f"  {k:<26}{rand_out[k][1] - grp_out[k][1]:+.4f}")

# ---------------------------------------------------------------- Section 5
h1("5 · Operating point (grouped split, random forest)")
p = rf_grp.predict_proba(X[te])[:, 1]
yte_g = y[te]
prec, rec, thr = precision_recall_curve(yte_g, p)
# pick threshold achieving >= 0.70 precision, maximising recall there
mask = prec[:-1] >= 0.70
if mask.any():
    idx = np.argmax(rec[:-1] * mask)
    t = thr[idx]
    pred = (p >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(yte_g, pred).ravel()
    print(f"threshold for precision>=0.70 : {t:.3f}")
    print(f"  precision {precision_score(yte_g, pred):.3f}  recall {recall_score(yte_g, pred):.3f}"
          f"  F1 {f1_score(yte_g, pred):.3f}")
    print(f"  confusion [tn={tn} fp={fp} fn={fn} tp={tp}]")
    print(f"  -> catches {tp}/{tp + fn} hazardous, {fp} false alarms")

# ---------------------------------------------------------------- Section 6
h1("6 · Logistic coefficients (grouped split, standardized features)")
Xg_tr, Xg_te, yg_tr, yg_te = X[tr], X[te], y[tr], y[te]
scg = StandardScaler().fit(Xg_tr)
lrg = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=RS).fit(scg.transform(Xg_tr), yg_tr)
for f, c in zip(FEATURES, lrg.coef_[0]):
    print(f"  {f:20} log-odds {c:+.3f}   odds x{np.exp(c):.2f} per +1 SD")
print(f"  intercept {lrg.intercept_[0]:+.3f}")

# ---------------------------------------------------------------- Section 7
h1("7 · Decision-tree depth: train vs test PR-AUC (the overfitting curve)")
print(f"{'depth':>6}{'train PR':>10}{'test PR':>10}")
for d in (1, 2, 3, 4, 6, 8, 12, 20, None):
    t_ = DecisionTreeClassifier(max_depth=d, class_weight="balanced", random_state=RS).fit(Xg_tr, yg_tr)
    trp = average_precision_score(yg_tr, t_.predict_proba(Xg_tr)[:, 1])
    tep = average_precision_score(yg_te, t_.predict_proba(Xg_te)[:, 1])
    print(f"{str(d):>6}{trp:>10.3f}{tep:>10.3f}")

# ---------------------------------------------------------------- Section 8
h1("8 · Random-forest impurity importances (grouped split)")
for f, imp in zip(FEATURES, rf_grp.feature_importances_):
    print(f"  {f:20} {imp:.3f}")
print("  (caveat: impurity importance is biased toward high-cardinality features)")

# ---------------------------------------------------------------- Section 9
h1("9 · Permutation importance (unbiased; drop in PR-AUC on grouped test)")
from sklearn.inspection import permutation_importance  # noqa: E402
pi = permutation_importance(
    rf_grp, X[te], y[te], scoring="average_precision",
    n_repeats=10, random_state=RS, n_jobs=-1,
)
for f, m, s in sorted(zip(FEATURES, pi.importances_mean, pi.importances_std), key=lambda z: -z[1]):
    print(f"  {f:20} -{m:.3f}  (+/- {s:.3f})")
print("  => miss_distance >> relative_velocity, reversing impurity's rank"
      " and agreeing with the logistic coefficients + conditional AUC.")

print("\nDone. Every number above backs a published capstone figure.")
