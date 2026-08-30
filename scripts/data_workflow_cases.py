"""Real numbers for The Data Workflow pillar (PROJECT.md §11 rules 9-10).

Deterministic: fixed seeds, no network, stdlib + numpy + sklearn only.

    python scripts/data_workflow_cases.py

Sections
  1. Baselines -- what a score means before you have something to compare it to.
  2. Preprocessing leakage -- fitting a selector outside the fold, on pure noise.
  3. Group leakage -- the same entity in train and test.
  4. Temporal leakage -- a random split on time-ordered data.
  5. Missing data -- MCAR / MAR / MNAR against the same imputation strategies.
  6. Error analysis -- a good overall score hiding a bad slice.
  7. Simpson's paradox -- every subgroup up, the aggregate down.
  8. Drift -- what degrades after you ship, and what you can monitor without labels.

Environment used for the published numbers: python 3.13.11, sklearn 1.8.0,
numpy 2.3.5.
"""

import numpy as np
from sklearn.datasets import load_breast_cancer, load_diabetes, load_digits
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge
from sklearn.metrics import accuracy_score, r2_score
from sklearn.model_selection import (
    GroupKFold, KFold, StratifiedKFold, cross_val_score, train_test_split,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

RS = 0


def rule(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# ---------------------------------------------------------------------------
# 1. Baselines: a score is meaningless until something worse exists
# ---------------------------------------------------------------------------
rule("1. BASELINES -- the number you must beat before yours means anything")

Xc, yc = load_breast_cancer(return_X_y=True)
cv = StratifiedKFold(5, shuffle=True, random_state=RS)

dummy_c = cross_val_score(DummyClassifier(strategy="most_frequent"), Xc, yc, cv=cv).mean()
logit_c = cross_val_score(
    make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)), Xc, yc, cv=cv
).mean()
print(f"breast cancer (n={len(yc)}, {yc.mean():.1%} positive)")
print(f"  majority-class baseline accuracy : {dummy_c:.4f}")
print(f"  logistic regression accuracy     : {logit_c:.4f}")
print(f"  the model's actual contribution  : {logit_c - dummy_c:+.4f}")

# An imbalanced version of the same problem: the baseline eats most of the score.
rng = np.random.default_rng(RS)
pos = np.flatnonzero(yc == 1)
neg = np.flatnonzero(yc == 0)
keep_pos = rng.choice(pos, size=12, replace=False)
idx = np.concatenate([keep_pos, neg])
Xi, yi = Xc[idx], yc[idx]
dummy_i = cross_val_score(DummyClassifier(strategy="most_frequent"), Xi, yi, cv=cv).mean()
logit_i = cross_val_score(
    make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)), Xi, yi, cv=cv
).mean()
print(f"\nsame problem subsampled to {yi.mean():.1%} positive (n={len(yi)})")
print(f"  majority-class baseline accuracy : {dummy_i:.4f}")
print(f"  logistic regression accuracy     : {logit_i:.4f}")
print(f"  the model's actual contribution  : {logit_i - dummy_i:+.4f}")

Xr, yr = load_diabetes(return_X_y=True)
cvr = 5
dummy_r = cross_val_score(DummyRegressor(strategy="mean"), Xr, yr, cv=cvr).mean()
ridge_r = cross_val_score(make_pipeline(StandardScaler(), Ridge(alpha=1.0)), Xr, yr, cv=cvr).mean()
print(f"\ndiabetes regression (n={len(yr)}), 5-fold R^2")
print(f"  predict-the-mean baseline R^2    : {dummy_r:.4f}")
print(f"  ridge R^2                        : {ridge_r:.4f}")


# ---------------------------------------------------------------------------
# 2. Preprocessing leakage: select features outside the fold, on pure noise
# ---------------------------------------------------------------------------
rule("2. PREPROCESSING LEAKAGE -- cross-validating the wrong way, on pure noise")

rng = np.random.default_rng(RS)
n, p, k = 100, 2000, 20
Xn = rng.normal(size=(n, p))
yn = rng.integers(0, 2, size=n)          # labels independent of X: truth is 0.500
cvn = StratifiedKFold(5, shuffle=True, random_state=RS)

# WRONG: choose the k best features using ALL the labels, then cross-validate.
sel = SelectKBest(f_classif, k=k).fit(Xn, yn)
X_leaky = sel.transform(Xn)
leaky = cross_val_score(LogisticRegression(max_iter=5000), X_leaky, yn, cv=cvn).mean()

# RIGHT: the selector is a pipeline step, refit inside every fold.
honest = cross_val_score(
    make_pipeline(SelectKBest(f_classif, k=k), LogisticRegression(max_iter=5000)),
    Xn, yn, cv=cvn,
).mean()

print(f"n={n} rows, p={p} pure-noise features, labels are coin flips")
print(f"true accuracy of any model here   : 0.5000")
print(f"  selection OUTSIDE the fold (CV) : {leaky:.4f}   <- fabricated")
print(f"  selection INSIDE  the fold (CV) : {honest:.4f}")
print(f"  invented signal                 : {leaky - honest:+.4f}")

# How the illusion grows with the number of features you let the selector see.
# Averaged over REP independent label draws, because a single 5-fold CV on 100
# rows has a standard error near 0.05 -- too noisy to read a trend off.
REP = 10
print(f"\naveraged over {REP} independent coin-flip label draws")
print(f"{'p (noise features)':>19} {'leaky CV':>10} {'honest CV':>11}")
for pp in (50, 200, 500, 1000, 2000, 5000):
    lks, hns = [], []
    for r in range(REP):
        rr = np.random.default_rng(1000 + r)
        Xp = rr.normal(size=(n, pp))
        yp = rr.integers(0, 2, size=n)
        s = SelectKBest(f_classif, k=k).fit(Xp, yp)
        lks.append(cross_val_score(LogisticRegression(max_iter=5000), s.transform(Xp), yp, cv=cvn).mean())
        hns.append(cross_val_score(
            make_pipeline(SelectKBest(f_classif, k=k), LogisticRegression(max_iter=5000)),
            Xp, yp, cv=cvn,
        ).mean())
    print(f"{pp:>19} {np.mean(lks):>10.4f} {np.mean(hns):>11.4f}")
print("-> the honest column stays at chance; the leaky one climbs with the search space.")


# ---------------------------------------------------------------------------
# 3. Group leakage: the same entity on both sides of the split
# ---------------------------------------------------------------------------
rule("3. GROUP LEAKAGE -- repeated visits from the same patient")

# Each patient has stable covariates (a fingerprint a flexible model can memorise)
# and a personal offset that no feature explains. Split randomly and the model
# recalls that offset from the fingerprint; split by patient and it cannot.
rng = np.random.default_rng(RS)
NP, VISITS = 250, 6
static = rng.normal(size=(NP, 4))                     # same at every visit
offset = 3.0 * rng.normal(size=NP)                    # unexplainable personal level
groups = np.repeat(np.arange(NP), VISITS)
Xstatic = np.repeat(static, VISITS, axis=0)
Xvary = rng.normal(size=(NP * VISITS, 3))             # changes visit to visit
Xg = np.column_stack([Xstatic, Xvary])
yg = offset[groups] + 1.2 * Xvary[:, 0] + rng.normal(scale=0.6, size=NP * VISITS)

reg = RandomForestRegressor(n_estimators=300, random_state=RS, n_jobs=-1)
random_cv = cross_val_score(reg, Xg, yg, cv=KFold(5, shuffle=True, random_state=RS)).mean()
grouped_cv = cross_val_score(reg, Xg, yg, cv=GroupKFold(5), groups=groups).mean()

print(f"n={len(yg)} rows = {NP} patients x {VISITS} visits")
print(f"  random 5-fold CV R^2            : {random_cv:.4f}   <- patient seen in train")
print(f"  grouped 5-fold CV R^2           : {grouped_cv:.4f}")
print(f"  cost of ignoring the group      : {random_cv - grouped_cv:+.4f}")
print("  (deployment means a NEW patient, so the grouped number is the real one)")


# ---------------------------------------------------------------------------
# 4. Temporal leakage: a random split on data that has a direction
# ---------------------------------------------------------------------------
rule("4. TEMPORAL LEAKAGE -- random split vs predicting the future")

rng = np.random.default_rng(RS)
T = 1200
t = np.arange(T)
# the coefficient on x1 drifts over time: the past does not describe the future
drift = np.linspace(2.0, -2.0, T)
X1 = rng.normal(size=T)
X2 = rng.normal(size=T)
yt = drift * X1 + 1.0 * X2 + rng.normal(scale=0.5, size=T)
Xt = np.column_stack([X1, X2, t / T])

cut = int(T * 0.75)
model = LinearRegression()
# random split: train rows are interleaved with test rows in time
Xa, Xb, ya, yb = train_test_split(Xt, yt, test_size=0.25, random_state=RS)
random_r2 = r2_score(yb, model.fit(Xa, ya).predict(Xb))
# forward split: train on the past, test on the future
fwd_r2 = r2_score(yt[cut:], model.fit(Xt[:cut], yt[:cut]).predict(Xt[cut:]))

print(f"T={T} time-ordered rows, the effect of x1 drifts from +2.0 to -2.0")
print(f"  random 75/25 split R^2          : {random_r2:.4f}   <- reads the future")
print(f"  train-past / test-future R^2    : {fwd_r2:.4f}")
print(f"  overstatement                   : {random_r2 - fwd_r2:+.4f}")


# ---------------------------------------------------------------------------
# 5. Missing data: the mechanism decides whether your fix works
# ---------------------------------------------------------------------------
rule("5. MISSING DATA -- MCAR / MAR / MNAR against the same three fixes")

N = 8000
RHO = 0.7          # x1 and x2 are correlated, which is what makes MAR recoverable


def make_missing(mechanism, seed):
    """x1 is the column that goes missing. x2 is always observed."""
    rg = np.random.default_rng(seed)
    x2 = rg.normal(size=N)
    x1 = RHO * x2 + np.sqrt(1 - RHO ** 2) * rg.normal(size=N)
    y = 2.0 * x1 + 1.0 * x2 + rg.normal(scale=1.0, size=N)
    if mechanism == "MCAR":       # unrelated to anything
        miss = rg.random(N) < 0.40
    elif mechanism == "MAR":      # depends only on x2, which you DO observe
        miss = rg.random(N) < 1 / (1 + np.exp(-(1.8 * x2 - 0.4)))
    else:                         # MNAR: depends on the value that is missing
        miss = rg.random(N) < 1 / (1 + np.exp(-(1.8 * x1 - 0.4)))
    return x1, x2, y, miss


# 5a. Estimating a simple population quantity: the mean of x1.
print("5a. Estimating E[x1] when 40%-ish of x1 is missing.  True E[x1] = 0.0000\n")
print(f"{'mechanism':10} {'% missing':>10} {'observed mean':>15} {'regression-imputed':>20}")
for mech in ("MCAR", "MAR", "MNAR"):
    x1, x2, y, miss = make_missing(mech, RS)
    keep = ~miss
    naive = x1[keep].mean()
    # impute x1 from the column you DO observe, then average
    reg = LinearRegression().fit(x2[keep].reshape(-1, 1), x1[keep])
    filled = x1.copy()
    filled[miss] = reg.predict(x2[miss].reshape(-1, 1))
    print(f"{mech:10} {miss.mean():>9.1%} {naive:>15.4f} {filled.mean():>20.4f}")
print("\nMCAR: both fine. MAR: the naive mean is biased, imputing from x2 recovers it.")
print("MNAR: nothing you can observe explains the gap, so both stay biased.")

# Which VALUES of x1 survive: the shape of the hole is the whole diagnosis.
BINS = np.linspace(-3, 3, 13)
print(f"\nsurvival rate of x1 by value (share of each bin still observed):")
print("  bin centre " + " ".join(f"{c:>5.1f}" for c in (BINS[:-1] + BINS[1:]) / 2))
for mech in ("MCAR", "MAR", "MNAR"):
    x1, x2, y, miss = make_missing(mech, RS)
    b = np.digitize(x1, BINS) - 1
    rates = [
        (~miss[b == i]).mean() if (b == i).sum() > 20 else np.nan
        for i in range(len(BINS) - 1)
    ]
    print(f"  {mech:10} " + " ".join("    ." if np.isnan(r) else f"{r:>5.2f}" for r in rates))
print("  -> MCAR is flat. MAR and MNAR look ALMOST IDENTICAL here, and that is the")
print("     point: the data cannot tell you which one you have. It is an assumption")
print("     about the world, and the fix you choose is only as good as that assumption.")

# 5b. Does the fix survive into predictions? Train and test both carry the holes.
print("\n5b. Held-out R^2 predicting y, with the SAME missingness in train and test.\n")
print(f"{'mechanism':10} {'drop rows':>11} {'mean impute':>13} {'impute+flag':>13}")
for mech in ("MCAR", "MAR", "MNAR"):
    x1, x2, y, miss = make_missing(mech, RS)
    x1o = np.where(miss, np.nan, x1)
    idx = np.arange(N)
    itr, ite = train_test_split(idx, test_size=0.3, random_state=RS)

    fill = np.nanmean(x1o[itr])
    x1f = np.where(np.isnan(x1o), fill, x1o)
    flag = np.isnan(x1o).astype(float)

    # drop rows: can only train on complete cases, still must predict for all
    ctr = itr[~np.isnan(x1o[itr])]
    m_drop = LinearRegression().fit(np.column_stack([x1o[ctr], x2[ctr]]), y[ctr])
    r_drop = r2_score(y[ite], m_drop.predict(np.column_stack([x1f[ite], x2[ite]])))

    m_mean = LinearRegression().fit(np.column_stack([x1f[itr], x2[itr]]), y[itr])
    r_mean = r2_score(y[ite], m_mean.predict(np.column_stack([x1f[ite], x2[ite]])))

    Xi = np.column_stack([x1f, x2, flag])
    m_ind = LinearRegression().fit(Xi[itr], y[itr])
    r_ind = r2_score(y[ite], m_ind.predict(Xi[ite]))

    print(f"{mech:10} {r_drop:11.4f} {r_mean:13.4f} {r_ind:13.4f}")
print("\nThe missingness flag is a free feature exactly when missingness carries signal.")


# ---------------------------------------------------------------------------
# 6. Error analysis: a good average hiding a bad slice
# ---------------------------------------------------------------------------
rule("6. ERROR ANALYSIS -- the average is not the experience of any user")

Xd, yd = load_digits(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(Xd, yd, test_size=0.3, random_state=RS, stratify=yd)
m = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)).fit(Xtr, ytr)
pred = m.predict(Xte)
overall = accuracy_score(yte, pred)
print(f"overall test accuracy: {overall:.4f}  (n={len(yte)})\n")
print(f"{'digit':>6} {'n':>5} {'accuracy':>10}   most-confused-with")
per = []
for d in range(10):
    sl = yte == d
    acc = accuracy_score(yte[sl], pred[sl])
    wrong = pred[sl][pred[sl] != d]
    conf = np.bincount(wrong, minlength=10).argmax() if len(wrong) else -1
    per.append((d, sl.sum(), acc, conf))
    print(f"{d:>6} {sl.sum():>5} {acc:>10.4f}   {conf if conf >= 0 else '-'}")
worst = min(per, key=lambda r: r[2])
print(f"\nworst label slice: digit {worst[0]} at {worst[2]:.4f}, "
      f"{overall - worst[2]:.4f} below the headline number")

# The transferable version: slice by a FEATURE, not by the label. Here, how much
# ink is on the card -- faintly-written digits are the ones that fail.
ink = Xte.sum(axis=1)
edges = np.quantile(ink, [0.25, 0.5, 0.75])
qs = np.digitize(ink, edges)
print(f"\nslice A -- total ink (a feature, not the label):")
print(f"{'quartile':>9} {'n':>5} {'accuracy':>10}")
for q, name in enumerate(["faintest", "Q2", "Q3", "boldest"]):
    sl = qs == q
    print(f"{name:>9} {sl.sum():>5} {accuracy_score(yte[sl], pred[sl]):>10.4f}")
print("-> a null slice. Most slices are. That is what makes the next one worth having.")

# slice B: the model's own confidence -- the slice that is always available and
# almost always pays, because it tells you what to route to a human.
conf = m.predict_proba(Xte).max(axis=1)
cedges = np.quantile(conf, [0.25, 0.5, 0.75])
cq = np.digitize(conf, cedges)
print(f"\nslice B -- the model's own confidence:")
print(f"{'quartile':>9} {'n':>5} {'accuracy':>10} {'mean conf':>11}")
for q, name in enumerate(["lowest", "Q2", "Q3", "highest"]):
    sl = cq == q
    print(f"{name:>9} {sl.sum():>5} {accuracy_score(yte[sl], pred[sl]):>10.4f} {conf[sl].mean():>11.4f}")
lo = cq == 0
print(f"-> {lo.mean():.0%} of traffic holds {(pred[lo] != yte[lo]).sum()} of "
      f"{(pred != yte).sum()} total errors.")


# ---------------------------------------------------------------------------
# 7. Simpson's paradox: every group up, the whole thing down
# ---------------------------------------------------------------------------
rule("7. SIMPSON'S PARADOX -- the aggregate trend that no group has")

rg = np.random.default_rng(RS)
NG, PER = 4, 60
gx, gy, gid = [], [], []
for g in range(NG):
    # later groups sit further right on x, but start lower on y
    xg = rg.normal(loc=2.0 + 2.2 * g, scale=0.55, size=PER)
    yg_ = 0.8 * xg + (10.0 - 4.0 * g) + rg.normal(scale=0.35, size=PER)
    gx.append(xg); gy.append(yg_); gid.append(np.full(PER, g))
gx = np.concatenate(gx); gy = np.concatenate(gy); gid = np.concatenate(gid)

pooled = np.polyfit(gx, gy, 1)[0]
print(f"pooled slope over all {len(gx)} points : {pooled:+.4f}")
for g in range(NG):
    s = np.polyfit(gx[gid == g], gy[gid == g], 1)[0]
    print(f"  group {g} slope (n={PER})           : {s:+.4f}")
print(f"\nevery within-group slope is positive; the pooled slope is {pooled:+.4f}")


# ---------------------------------------------------------------------------
# 8. Drift: what decays, and what you can watch without labels
# ---------------------------------------------------------------------------
rule("8. DRIFT -- performance after you ship, and the label-free early warning")

D = 6
NTR = 6000
# one feature carries most of the rule, so a change to it is a change to the rule
w0 = np.array([2.5, 0.5, 0.4, 0.3, 0.3, 0.2])
# shift the inputs along a direction ORTHOGONAL to w0, so P(y|x) is untouched and
# the class balance does not move -- covariate shift in its purest form
u = np.array([0.0, 0.4, -0.5, 0.3, 0.3, -0.2])
u = u - (u @ w0) / (w0 @ w0) * w0
u = u / np.linalg.norm(u)


def batch(shift, rot, nn, seed):
    """shift moves P(x) only; rot moves P(y|x) only. Independent knobs."""
    r = np.random.default_rng(seed)
    X = r.normal(size=(nn, D)) + shift * u
    w = w0.copy()
    w[0] = w0[0] * (1 - 2 * rot)      # rot=1 flips the sign of the dominant feature
    prob = 1 / (1 + np.exp(-(X @ w)))
    return X, (r.random(nn) < prob).astype(int)


Xtr, ytr = batch(0.0, 0.0, NTR, RS)
clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)).fit(Xtr, ytr)
mu_tr, sd_tr = Xtr.mean(axis=0), Xtr.std(axis=0)


def monitor(Xm):
    """Label-free: how far has any input column's mean moved, in training SDs?"""
    return float(np.abs((Xm.mean(axis=0) - mu_tr) / sd_tr).max())


print("Scenario A -- COVARIATE SHIFT ONLY: the inputs move, P(y|x) does not.\n")
print(f"{'month':>6} {'input shift':>13} {'accuracy':>10} {'input monitor':>15}")
for month, shift in enumerate([0.0, 0.3, 0.6, 1.0, 1.5]):
    Xm, ym = batch(shift, 0.0, 4000, RS + 100 + month)
    print(f"{month:>6} {shift:>13.2f} {accuracy_score(ym, clf.predict(Xm)):>10.4f} {monitor(Xm):>15.4f}")
print("-> the monitor screams; accuracy is fine. A well-specified model survives this.")

print("\nScenario B -- CONCEPT DRIFT ONLY: the inputs are identical, the rule changes.\n")
print(f"{'month':>6} {'rule change':>13} {'accuracy':>10} {'input monitor':>15}")
for month, rot in enumerate([0.0, 0.25, 0.5, 0.75, 1.0]):
    Xm, ym = batch(0.0, rot, 4000, RS + 200 + month)
    print(f"{month:>6} {rot:>13.2f} {accuracy_score(ym, clf.predict(Xm)):>10.4f} {monitor(Xm):>15.4f}")
print("-> accuracy collapses; the input monitor never moves. It is blind to this.")
print("\nThe two monitors answer different questions. Neither one covers the other.")

print("\n" + "=" * 70)
print("done")
print("=" * 70)
