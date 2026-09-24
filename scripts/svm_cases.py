"""
svm_cases.py — honest numbers for the Support Vector Machines track (PROJECT.md §11 rule 9/10).

Every published number in the SVM track comes from a run of this file. Deterministic: all
randomness seeded, sklearn 1.8, numpy 2.3.

    python scripts/svm_cases.py               # everything
    python scripts/svm_cases.py margin        # one section

The track's central claim is that the MAXIMUM-margin separator generalises better than an
arbitrary one. That is an empirical claim about this world, not a theorem you can quote at a
reader, so `margin` runs it as a repeated experiment over many seeds rather than showing one
flattering split. If it does not hold, the page says so.
"""
import itertools
import json
import math
import sys
import time

import numpy as np
from scipy.optimize import LinearConstraint, linprog, minimize, minimize_scalar
from scipy.spatial import cKDTree
from scipy.stats import norm
from sklearn.datasets import (load_breast_cancer, load_digits, load_wine, make_blobs,
                              make_circles, make_moons)
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression, Perceptron
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.multiclass import OneVsOneClassifier, OneVsRestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.svm import SVC, LinearSVC

np.set_printoptions(precision=4, suppress=True)
RS = 0


def section(t):
    print("\n" + "=" * 70 + "\n" + t + "\n" + "=" * 70)


def geom_margin(w, b, X, y):
    """Smallest distance from any training point to the hyperplane w.x + b = 0.

    Signed by the label, so a negative value means the separator does not actually separate.
    """
    s = np.sign(y - 0.5) * 2 if set(np.unique(y)) == {0, 1} else y
    return float(np.min(s * (X @ w + b)) / np.linalg.norm(w))


# ------------------------------------------------------------------ #
# 1. Does the maximum margin actually buy anything?
# ------------------------------------------------------------------ #
def margin():
    section("1. max-margin vs an arbitrary separator -- 200 separable draws")
    print("Both models separate the TRAINING data perfectly. The only difference is WHERE they")
    print("put the boundary. If the margin argument is real, the wider one wins on held-out data.")
    print()

    rows = []
    for seed in range(200):
        X, y = make_blobs(n_samples=60, centers=2, n_features=2, cluster_std=1.05,
                          random_state=seed)
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, random_state=seed,
                                              stratify=y)
        svm = SVC(kernel="linear", C=1e6).fit(Xtr, ytr)          # C huge = hard margin
        per = Perceptron(random_state=seed, max_iter=5000, tol=None).fit(Xtr, ytr)
        # Only count draws where BOTH separate the training set, or the comparison is unfair.
        if svm.score(Xtr, ytr) < 1.0 or per.score(Xtr, ytr) < 1.0:
            continue
        rows.append((
            geom_margin(svm.coef_[0], svm.intercept_[0], Xtr, ytr),
            geom_margin(per.coef_[0], per.intercept_[0], Xtr, ytr),
            svm.score(Xte, yte), per.score(Xte, yte)))

    a = np.array(rows)
    print("  %d of 200 draws were separated perfectly by both models." % len(a))
    print()
    print("  %-22s %-14s %s" % ("", "max-margin", "perceptron"))
    print("  %-22s %-14.3f %.3f" % ("mean train margin", a[:, 0].mean(), a[:, 1].mean()))
    print("  %-22s %-14.4f %.4f" % ("mean test accuracy", a[:, 2].mean(), a[:, 3].mean()))
    print()
    win = (a[:, 2] > a[:, 3]).sum()
    tie = (a[:, 2] == a[:, 3]).sum()
    print("  max-margin better on %d draws, worse on %d, tied on %d"
          % (win, len(a) - win - tie, tie))
    print("  mean accuracy gain: %+.4f" % (a[:, 2] - a[:, 3]).mean())
    print()
    print("  The margin is %.1fx wider on average. The accuracy gain is real but SMALL --"
          % (a[:, 0].mean() / a[:, 1].mean()))
    print("  most draws tie, because on easy separable data most separators agree.")


# ------------------------------------------------------------------ #
# 2. C: the softness dial
# ------------------------------------------------------------------ #
def soft():
    section("2. the soft margin -- what C actually trades")
    X, y = make_moons(n_samples=300, noise=0.32, random_state=RS)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.4, random_state=RS, stratify=y)
    print("make_moons(noise=0.32), %d train / %d test, LINEAR kernel so the only" % (len(ytr), len(yte)))
    print("thing changing is how much violation C tolerates.")
    print()
    print("  %8s %9s %9s %7s %10s" % ("C", "train", "test", "#SV", "margin 2/|w|"))
    for C in (0.001, 0.01, 0.1, 1, 10, 100, 1000):
        m = SVC(kernel="linear", C=C).fit(Xtr, ytr)
        width = 2.0 / np.linalg.norm(m.coef_[0])
        print("  %8g %9.4f %9.4f %7d %10.3f"
              % (C, m.score(Xtr, ytr), m.score(Xte, yte), m.n_support_.sum(), width))
    print()
    print("  Small C = wide margin, many support vectors, more training errors tolerated.")
    print("  Large C = narrow margin, few support vectors, training errors punished.")
    print("  C is a REGULARISATION dial, and it runs the opposite way to ridge's alpha.")


# ------------------------------------------------------------------ #
# 3. Sparsity: the solution only sees the support vectors
# ------------------------------------------------------------------ #
def sparsity():
    section("3. throw away every non-support-vector and refit")
    X, y = make_blobs(n_samples=400, centers=2, n_features=2, cluster_std=2.2, random_state=RS)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=RS, stratify=y)
    full = SVC(kernel="linear", C=1.0).fit(Xtr, ytr)
    idx = full.support_
    kept = SVC(kernel="linear", C=1.0).fit(Xtr[idx], ytr[idx])

    print("  trained on all %d points: %d support vectors (%.1f%% of the data)"
          % (len(ytr), len(idx), 100 * len(idx) / len(ytr)))
    print("  refit on ONLY those %d support vectors:" % len(idx))
    print()
    print("    %-26s %s" % ("w (all points)", np.round(full.coef_[0], 6)))
    print("    %-26s %s" % ("w (support vectors only)", np.round(kept.coef_[0], 6)))
    print("    %-26s %.6f" % ("b (all points)", full.intercept_[0]))
    print("    %-26s %.6f" % ("b (support vectors only)", kept.intercept_[0]))
    print()
    print("    identical predictions on the test set: %s"
          % bool(np.array_equal(full.predict(Xte), kept.predict(Xte))))
    print("    max |w| difference: %.2e" % np.abs(full.coef_[0] - kept.coef_[0]).max())
    print()
    print("  This is what 'the support vectors ARE the model' means, literally. Every other")
    print("  training point could be deleted and the boundary would not move.")


# ------------------------------------------------------------------ #
# 4. The losses, side by side
# ------------------------------------------------------------------ #
def losses():
    section("4. hinge vs logistic vs 0-1, as functions of the margin z = y*f(x)")
    print("  %8s %10s %10s %8s   %s" % ("z", "hinge", "logistic", "0-1", "what it means"))
    notes = {-2.0: "badly wrong", -0.5: "wrong side", 0.0: "on the boundary",
             0.5: "right side, inside margin", 1.0: "exactly on the margin",
             2.0: "correct and clear", 5.0: "correct and far"}
    for z in (-2.0, -0.5, 0.0, 0.5, 1.0, 2.0, 5.0):
        print("  %8.1f %10.4f %10.4f %8d   %s"
              % (z, max(0.0, 1 - z), float(np.log1p(np.exp(-z))), int(z <= 0), notes[z]))
    print()
    print("  Hinge hits EXACTLY zero at z = 1 and stays there. Logistic never does: a point")
    print("  at z = 5 still contributes %.5f, so every point keeps pulling on the boundary."
          % float(np.log1p(np.exp(-5.0))))
    print("  That flat stretch at zero is where sparsity comes from: a point out there enters")
    print("  the objective multiplied by nothing, so it cannot move the answer.")


# ------------------------------------------------------------------ #
# 5. Kernels
# ------------------------------------------------------------------ #
def kernels():
    section("5. kernels -- when a straight line cannot work")
    sets = {"moons  (noise 0.20)": make_moons(n_samples=400, noise=0.20, random_state=RS),
            "circles(noise 0.10)": make_circles(n_samples=400, noise=0.10, factor=0.45,
                                                random_state=RS),
            # Overlapping, NOT separable -- at this spread the Bayes error is nonzero, which is
            # the point: a curved boundary cannot beat a straight one when the truth is straight.
            "blobs  (linear truth)": make_blobs(n_samples=400, centers=2, n_features=2,
                                                cluster_std=1.6, random_state=RS)}
    print("  %-20s %10s %10s %10s %10s" % ("dataset", "linear", "poly d=3", "rbf", "#SV rbf"))
    for name, (X, y) in sets.items():
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.4, random_state=RS, stratify=y)
        out = []
        for k in ("linear", "poly", "rbf"):
            m = make_pipeline(StandardScaler(),
                              SVC(kernel=k, C=1.0, degree=3, gamma="scale")).fit(Xtr, ytr)
            out.append(m.score(Xte, yte))
        nsv = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1.0)).fit(Xtr, ytr)[-1]
        print("  %-20s %10.4f %10.4f %10.4f %10d"
              % (name, out[0], out[1], out[2], nsv.n_support_.sum()))
    print()
    print("  On the separable blobs the linear kernel is not beaten -- which is the point.")
    print("  A kernel is not an upgrade, it is a different assumption about the boundary.")


# ------------------------------------------------------------------ #
# 6. Scaling
# ------------------------------------------------------------------ #
def scaling():
    section("6. does an SVM need feature scaling? (breast_cancer, raw units)")
    X, y = load_breast_cancer(return_X_y=True)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=RS, stratify=y)
    rng = np.ptp(Xtr, axis=0)
    print("  feature ranges span %.4f to %.1f -- a factor of %.0f"
          % (rng.min(), rng.max(), rng.max() / rng.min()))
    print()
    print("  %-34s %9s %9s %8s" % ("", "test acc", "fit (s)", "#SV"))
    for name, mdl in (("SVC(rbf) on RAW features", SVC(kernel="rbf", C=1.0)),
                      ("SVC(rbf) on STANDARDISED", make_pipeline(StandardScaler(),
                                                                 SVC(kernel="rbf", C=1.0)))):
        t0 = time.time()
        m = mdl.fit(Xtr, ytr)
        secs = time.time() - t0
        sv = (m[-1] if hasattr(m, "steps") else m).n_support_.sum()
        print("  %-34s %9.4f %9.3f %8d" % (name, m.score(Xte, yte), secs, sv))
    print()
    print("  The RBF kernel is a distance, and a distance is dominated by whichever feature")
    print("  happens to be measured in the largest units. Scaling is not optional here.")


# ------------------------------------------------------------------ #
# 7. Multi-class
# ------------------------------------------------------------------ #
def multiclass():
    section("7. multi-class -- one-vs-one and one-vs-rest on digits")
    X, y = load_digits(return_X_y=True)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=RS, stratify=y)
    k = len(np.unique(y))
    print("  %d classes, so OvO fits %d pairwise models and OvR fits %d.\n"
          % (k, k * (k - 1) // 2, k))
    print("  %-30s %9s %9s %9s" % ("strategy", "test acc", "fit (s)", "#models"))
    for name, mdl, n in (
            ("OneVsOne  (sklearn default)", OneVsOneClassifier(SVC(kernel="rbf", C=1.0)),
             k * (k - 1) // 2),
            ("OneVsRest", OneVsRestClassifier(SVC(kernel="rbf", C=1.0)), k)):
        pipe = make_pipeline(StandardScaler(), mdl)
        t0 = time.time()
        pipe.fit(Xtr, ytr)
        print("  %-30s %9.4f %9.2f %9d" % (name, pipe.score(Xte, yte), time.time() - t0, n))
    print()
    print("  OvO fits more models but each on a SMALLER slice of the data, which is why the")
    print("  model count does not translate into proportional time.")


# ------------------------------------------------------------------ #
# 8. Head to head
# ------------------------------------------------------------------ #
def bakeoff():
    section("8. SVM vs logistic regression vs random forest -- 5-fold CV")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RS)
    for dname, (X, y) in (("breast_cancer", load_breast_cancer(return_X_y=True)),
                          ("wine", load_wine(return_X_y=True)),
                          ("digits", load_digits(return_X_y=True))):
        print("\n  %s  (n=%d, d=%d, classes=%d)" % (dname, X.shape[0], X.shape[1],
                                                    len(np.unique(y))))
        for name, mdl in (
                ("SVC(rbf, C=1)", make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1.0))),
                ("LinearSVC(C=1)", make_pipeline(StandardScaler(),
                                                 LinearSVC(C=1.0, max_iter=20000))),
                ("LogisticRegression", make_pipeline(StandardScaler(),
                                                     LogisticRegression(max_iter=5000))),
                ("RandomForest(300)", RandomForestClassifier(n_estimators=300,
                                                             random_state=RS))):
            s = cross_val_score(mdl, X, y, cv=cv, n_jobs=1)
            print("    %-22s %.4f  +/- %.4f" % (name, s.mean(), s.std()))


# ------------------------------------------------------------------ #
# 9. The solver the browser lab runs
# ------------------------------------------------------------------ #
def pegasos(X, y, C, iters=20000):
    """Full-batch Pegasos on the soft-margin primal: (lam/2)||w||^2 + mean hinge.

    lam = 1/(C n) makes this the same objective sklearn's C parameterisation minimises. The
    intercept is NOT regularised, which is also what sklearn's SVC does. This is the exact
    algorithm the MarginLab runs in the browser; svm_solver_check.mjs holds the two to each other.
    """
    n, d = X.shape
    lam = 1.0 / (C * n)
    w, b = np.zeros(d), 0.0
    for t in range(1, iters + 1):
        eta = 1.0 / (lam * t)
        m = y * (X @ w + b) < 1
        w = (1 - eta * lam) * w + (eta / n) * (y[m] @ X[m])
        b = b + (eta / n) * y[m].sum()
    return w, b


def solver():
    section("9. does the lab's solver find the same boundary sklearn does?")
    print("The lab cannot call sklearn, so it runs Pegasos. If the two disagree, the lab is")
    print("drawing a boundary and calling it 'the maximum-margin boundary' when it is not.")
    print()
    print("  %-26s %8s %10s %12s %12s" % ("dataset / C", "angle deg", "|b| diff", "lab margin",
                                          "sklearn margin"))
    import json
    import pathlib
    cases = []
    for name, (X, y0) in (("blobs std=1.0", make_blobs(n_samples=40, centers=2, n_features=2,
                                                       cluster_std=1.0, random_state=3)),
                          ("blobs std=2.0", make_blobs(n_samples=60, centers=2, n_features=2,
                                                       cluster_std=2.0, random_state=7))):
        X = (X - X.mean(0)) / X.std(0)                 # the lab works in standardised space
        y = np.where(y0 == 0, -1.0, 1.0)
        for C in (0.1, 1.0, 10.0):
            w, b = pegasos(X, y, C)
            ref = SVC(kernel="linear", C=C).fit(X, y)
            rw, rb = ref.coef_[0], float(ref.intercept_[0])
            cos = float(w @ rw / (np.linalg.norm(w) * np.linalg.norm(rw)))
            ang = float(np.degrees(np.arccos(np.clip(cos, -1, 1))))
            print("  %-26s %8.2f %10.4f %12.4f %12.4f"
                  % ("%s  C=%g" % (name, C), ang, abs(b - rb),
                     2 / np.linalg.norm(w), 2 / np.linalg.norm(rw)))
            # Both answers travel with the case: `w`/`b` is what THIS Pegasos found (so the .mjs
            # can prove the TypeScript is a faithful port) and `sw`/`sb` is what sklearn's QP
            # found (so it can prove Pegasos is close to the real optimum). Storing only one of
            # them would leave half the chain unchecked.
            cases.append(dict(name=name, C=C, X=X.round(10).tolist(), y=y.tolist(),
                              w=[round(v, 10) for v in w.tolist()], b=round(float(b), 10),
                              sw=[round(v, 10) for v in rw.tolist()], sb=round(rb, 10)))
    out = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_solver_case.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(cases), encoding="utf-8")
    print()
    print("  A few degrees of angle means the lab draws essentially the same line.")
    print("  Wrote %d cases to %s for the port check." % (len(cases), out.name), file=sys.stderr)


# ------------------------------------------------------------------ #
# 10-13. Functional vs geometric margin (track page 2)
#
# Four sections rather than one, because each is published as its own block and svm_regen.py
# can only guard a block that is a command's WHOLE stdout.
# ------------------------------------------------------------------ #
def _demo_fit():
    """One small separable draw and its hard-margin boundary, shared by the four sections."""
    X, y0 = make_blobs(n_samples=40, centers=2, n_features=2, cluster_std=1.0, random_state=3)
    y = np.where(y0 == 0, -1.0, 1.0)
    m = SVC(kernel="linear", C=1e6).fit(X, y)
    return X, y, m.coef_[0], float(m.intercept_[0])


def func_margin(w, b, X, y):
    """Smallest y(w.x+b) over the data -- NO division by ||w||."""
    return float(np.min(y * (X @ w + b)))


def rescale():
    section("10. the same boundary written four ways")
    X, y, w, b = _demo_fit()
    print("The line is the set of points where w.x + b = 0. Multiplying w and b by the same k")
    print("cannot move that set, so all four rows below are the SAME boundary.")
    print()
    print("  %8s %12s %18s %18s %14s" % ("k", "||kw||", "min y(w.x+b)", "geometric margin",
                                         "predictions"))
    base = np.sign(X @ w + b)
    for k in (0.1, 1.0, 10.0, 100.0):
        wk, bk = k * w, k * b
        same = bool(np.array_equal(np.sign(X @ wk + bk), base))
        print("  %8g %12.4f %18.4f %18.6f %14s"
              % (k, np.linalg.norm(wk), func_margin(wk, bk, X, y),
                 geom_margin(wk, bk, X, y), "identical" if same else "CHANGED"))
    print()
    print("  The functional margin y(w.x+b) moved by a factor of 1000. The boundary did not")
    print("  move at all, and neither did the geometric margin. So the functional margin is")
    print("  not a property of the boundary -- it is a property of how you chose to WRITE it.")


def distance():
    section("11. is the geometric margin really a distance?")
    X, y, w, b = _demo_fit()
    star = int(np.argmin(y * (X @ w + b)))
    p = X[star]
    # Checking |w.x+b|/||w|| against the projection formula would be circular -- it IS the
    # projection formula. So: parameterise the line and ternary-search the parameter for the
    # genuinely closest point on it. Distance along a line is convex in that parameter.
    if abs(w[1]) >= abs(w[0]):
        def pt(t):
            return np.array([t, (-b - w[0] * t) / w[1]])
    else:
        def pt(t):
            return np.array([(-b - w[1] * t) / w[0], t])
    lo, hi = -1e4, 1e4
    for _ in range(300):
        m1, m2 = lo + (hi - lo) / 3.0, hi - (hi - lo) / 3.0
        if np.linalg.norm(pt(m1) - p) < np.linalg.norm(pt(m2) - p):
            hi = m2
        else:
            lo = m1
    found = pt((lo + hi) / 2.0)
    searched = float(np.linalg.norm(found - p))
    formula = geom_margin(w, b, X, y)

    print("Dividing by ||w|| is supposed to turn the score into a DISTANCE. Checking that with")
    print("the projection formula would be circular, so this walks along the line instead and")
    print("ternary-searches for the closest point on it.")
    print()
    print("  %-34s %s" % ("closest training point", np.round(p, 6)))
    print("  %-34s %s" % ("closest point ON the line", np.round(found, 6)))
    print("  %-34s %.12f" % ("straight-line distance between", searched))
    print("  %-34s %.12f" % ("geometric margin |w.x+b|/||w||", formula))
    print("  %-34s %.2e" % ("difference", abs(searched - formula)))
    print()
    print("  Dividing by ||w|| does not just cancel the scale. It converts the score into a")
    print("  length, measured in the same units as the data.")


def ranking():
    section("12. can the functional margin rank two boundaries WRONG?")
    print("If the functional margin is not a property of the boundary, then comparing two")
    print("models by it is meaningless. This checks how often it actually misleads: 200 draws,")
    print("a max-margin boundary against a perceptron, both separating the training data.")
    print()
    flip = tot = 0
    ex = None
    for seed in range(200):
        Xs, ys = make_blobs(n_samples=60, centers=2, n_features=2, cluster_std=1.05,
                            random_state=seed)
        Xtr, _, ytr, _ = train_test_split(Xs, ys, test_size=0.5, random_state=seed, stratify=ys)
        s = SVC(kernel="linear", C=1e6).fit(Xtr, ytr)
        p = Perceptron(random_state=seed, max_iter=5000, tol=None).fit(Xtr, ytr)
        if s.score(Xtr, ytr) < 1.0 or p.score(Xtr, ytr) < 1.0:
            continue
        tot += 1
        yy = np.where(ytr == 0, -1.0, 1.0)
        fs = func_margin(s.coef_[0], float(s.intercept_[0]), Xtr, yy)
        fp = func_margin(p.coef_[0], float(p.intercept_[0]), Xtr, yy)
        gs = geom_margin(s.coef_[0], float(s.intercept_[0]), Xtr, yy)
        gp = geom_margin(p.coef_[0], float(p.intercept_[0]), Xtr, yy)
        # The max-margin boundary has the widest geometric margin BY DEFINITION, so this is a
        # sanity check on the experiment rather than a finding. If it trips, the draw was not
        # really separable and the comparison is not fair.
        assert gs >= gp - 1e-9, (seed, gs, gp)
        if fp > fs:
            flip += 1
            if ex is None and fp > 3 * fs:
                ex = (seed, fs, fp, gs, gp)

    print("  %d of 200 draws were separated perfectly by both models." % tot)
    print()
    print("  perceptron has the bigger FUNCTIONAL margin on %d of %d draws" % (flip, tot))
    print("  max-margin has the bigger GEOMETRIC margin on %d of %d draws" % (tot, tot))
    print()
    seed, fs, fp, gs, gp = ex
    print("  one example, seed %d:" % seed)
    print("    %-22s %-14s %s" % ("", "max-margin", "perceptron"))
    print("    %-22s %-14.3f %.3f" % ("functional margin", fs, fp))
    print("    %-22s %-14.3f %.3f" % ("geometric margin", gs, gp))
    print()
    print("  The functional margin prefers the perceptron by %.1fx. That boundary is actually"
          % (fp / fs))
    print("  %.1fx CLOSER to the data. Ranking by it is worse than not ranking at all."
          % (gs / gp))


def canonical():
    section("13. the one scale that is special")
    X, y, w, b = _demo_fit()
    print("Scaling freedom is a nuisance until you use it: pick the k that makes the closest")
    print("point score exactly 1. Then the geometric margin is just 1/||w||, and maximising the")
    print("margin becomes minimising ||w||. That is the canonical form, and it is what a solver")
    print("hands back.")
    print()
    print("  %-30s %18s %16s" % ("", "min y(w.x+b)", "1/||w||"))
    for label, tol in (("SVC defaults (tol=1e-3)", 1e-3), ("SVC with tol=1e-9", 1e-9)):
        m = SVC(kernel="linear", C=1e6, tol=tol).fit(X, y)
        ww, bb = m.coef_[0], float(m.intercept_[0])
        print("  %-30s %18.9f %16.6f" % (label, func_margin(ww, bb, X, y),
                                         1.0 / np.linalg.norm(ww)))
    print()
    print("  The constraint is exactly 1 in the algebra; a solver reaches it to whatever")
    print("  tolerance you ask for. The default stops about 4 parts in 10,000 short, which is")
    print("  the stopping criterion showing through -- not a different definition of a margin.")
    print()
    m = SVC(kernel="linear", C=1e6, tol=1e-9).fit(X, y)
    n = float(np.linalg.norm(m.coef_[0]))
    print("  so for this boundary:  ||w|| = %.6f  ->  corridor width 2/||w|| = %.6f"
          % (n, 2.0 / n))


# ------------------------------------------------------------------ #
# 14-16. The maximum-margin hyperplane (track page 3)
# ------------------------------------------------------------------ #
def _demo_fit_tight():
    """The same draw as _demo_fit, solved to tol=1e-9 instead of the default 1e-3.

    Page 2's sections deliberately run on the default tolerance -- `canonical` is *about* the gap
    it leaves. Page 3 compares the solver against an exhaustive sweep and asks which constraints
    sit exactly at 1, and on the default tolerance both readings are wrong in ways that look like
    findings: the QP appears to beat the sweep (its 1/||w|| is inflated by unconverged slack) and
    the tight constraints print as 0.9996 while the prose calls them 1.
    """
    X, y0 = make_blobs(n_samples=40, centers=2, n_features=2, cluster_std=1.0, random_state=3)
    y = np.where(y0 == 0, -1.0, 1.0)
    m = SVC(kernel="linear", C=1e6, tol=1e-9).fit(X, y)
    return X, y, m.coef_[0], float(m.intercept_[0])


def _canonical_for(X, y, theta):
    """(||w||, margin) for the best boundary whose normal points at theta; None if it cannot separate.

    A direction is usable only if every +1 point projects beyond every -1 point. The widest
    corridor along it is then the gap between the two innermost points, and canonical form fixes
    ||w|| = 2/gap.
    """
    u = np.array([np.cos(theta), np.sin(theta)])
    p = X @ u
    a, c = p[y == 1].min(), p[y == -1].max()
    if a <= c:
        return None
    return 2.0 / (a - c), (a - c) / 2.0


def minnorm():
    section("14. is minimising ||w|| really the same as maximising the margin?")
    X, y, w, b = _demo_fit_tight()
    # Full circle, not [0, pi). The NORMAL's direction matters and not merely its orientation:
    # sweeping a half turn drops every boundary whose normal points into the other half, and
    # quietly reports a fake optimum -- this one at 0 deg instead of the true 195 deg.
    ths = np.linspace(0, 2 * np.pi, 7201)[:-1]
    rows = [(t,) + r for t in ths for r in [_canonical_for(X, y, t)] if r]
    arr = np.array(rows)
    prod = arr[:, 1] * arr[:, 2]
    best = int(np.argmin(arr[:, 1]))

    print("Every boundary that separates this data, written in canonical form. If maximising the")
    print("margin really is minimising ||w||, the smallest ||w|| and the widest margin have to be")
    print("the same direction -- and margin x ||w|| has to be pinned at 1 everywhere.")
    print()
    print("  %d of %d directions separate the two classes." % (len(arr), len(ths)))
    print("  margin x ||w||, over every one of them:  min %.12f  max %.12f"
          % (prod.min(), prod.max()))
    print()
    print("  %-18s %12s %14s" % ("", "||w||", "margin"))
    print("  %-18s %12.6f %14.6f" % ("best of the sweep", arr[best, 1], arr[:, 2].max()))
    print("  %-18s %12.6f %14.6f" % ("sklearn's QP", np.linalg.norm(w),
                                     geom_margin(w, b, X, y)))
    print("  smallest ||w|| and largest margin are the same direction: %s"
          % ("yes" if best == int(np.argmax(arr[:, 2])) else "NO"))
    print("  sweep found %.3f deg, sklearn %.3f deg, and the sweep steps %.3f deg"
          % (np.degrees(arr[best, 0]), np.degrees(np.arctan2(w[1], w[0])) % 360,
             360.0 / len(ths)))
    print()
    print("  rotating away from the best direction:")
    print()
    print("  %12s %12s %12s %12s" % ("offset deg", "||w||", "margin", "product"))
    for off in (-12, -8, -4, 0, 4, 8, 12):
        r = _canonical_for(X, y, arr[best, 0] + np.radians(off))
        print("  %12d %12.6f %12.6f %12.9f" % (off, r[0], r[1], r[0] * r[1]) if r
              else "  %12d   does not separate" % off)
    print()
    print("  ||w|| bottoms out exactly where the margin peaks, and the product never leaves 1.")
    print("  Minimising ||w|| is not an approximation of maximising the margin. It is the same")
    print("  problem, read the other way up.")

    # The MinNormLab sweeps exactly this way in the browser, so record the dataset and a set of
    # probe directions for scripts/svm_minnorm_check.mjs to hold the TypeScript to.
    import json
    import pathlib
    probes = []
    for d in range(0, 360, 3):
        r = _canonical_for(X, y, np.radians(d))
        probes.append(dict(deg=d, sep=bool(r),
                           norm=round(r[0], 12) if r else None,
                           margin=round(r[1], 12) if r else None))
    out = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_minnorm_case.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(dict(X=X.round(12).tolist(), y=y.tolist(), probes=probes)),
                   encoding="utf-8")
    print("  Wrote %d probe directions to %s for the port check." % (len(probes), out.name),
          file=sys.stderr)


def squared():
    section("15. does squaring the norm change the answer?")
    X, y, w, b = _demo_fit_tight()
    print("Two objectives over the same constraints: minimise ||w||, or minimise 0.5||w||^2. Every")
    print("textbook writes the second. If the two ever disagreed, that substitution would be a bug.")
    print()
    cons = [{"type": "ineq", "fun": (lambda v, i=i: y[i] * (v[:2] @ X[i] + v[2]) - 1.0)}
            for i in range(len(y))]
    objs = (("||w||", lambda v: float(np.linalg.norm(v[:2]))),
            ("0.5||w||^2", lambda v: float(0.5 * v[:2] @ v[:2])))
    print("  %-20s %-12s %10s %8s %12s" % ("start", "objective", "||w||", "iters", "angle deg"))
    for s in ([0.1, 0.1, 0.0], [3.0, -2.0, 1.0], [-1.0, -1.0, -2.0], [0.01, 0.0, 0.0]):
        for name, f in objs:
            r = minimize(f, np.array(s), constraints=cons, method="SLSQP",
                         options={"maxiter": 800, "ftol": 1e-12})
            v = r.x[:2]
            cos = v @ w / (np.linalg.norm(v) * np.linalg.norm(w))
            print("  %-20s %-12s %10.6f %8d %12.6f%s"
                  % (str(s), name, np.linalg.norm(v), r.nit,
                     np.degrees(np.arccos(np.clip(cos, -1, 1))), "" if r.success else "  FAILED"))
    print()
    print("  All eight runs land on the same boundary. Squaring is monotone on non-negative")
    print("  numbers, so it cannot move the argmin -- the substitution is exact, not a")
    print("  convenience that costs a little accuracy.")
    print()
    print("  Note what the iteration counts do NOT show: 4-6 either way, no reliable speed")
    print("  advantage. The reason to write 0.5||w||^2 is structural. It is a quadratic, which")
    print("  makes this a quadratic program with linear constraints, and it is what gives the")
    print("  clean dual the kernel trick later depends on.")


def tight():
    section("16. at the optimum, how many constraints are doing any work?")
    X, y, w, b = _demo_fit_tight()
    z = y * (X @ w + b)
    print("The problem carries one constraint per training point. Here is how many of them the")
    print("solution is actually pressed up against.")
    print()
    print("  %d points, %d sitting at y(w.x+b) = 1 to within 1e-6"
          % (len(y), int((z <= 1 + 1e-6).sum())))
    print("  the five smallest scores: %s" % np.round(np.sort(z)[:5], 6))
    print()
    print("  Three constraints are tight; the other %d have slack to spare. Those three points"
          % (len(y) - 3))
    print("  are the support vectors, and they are the entire model -- which is the next")
    print("  chapter's business, and the reason an SVM forgets most of its training data.")


# ------------------------------------------------------------------ #
# 17-20. Does a wider margin actually help? (track page 4)
#
# These run on data that is separable BY CONSTRUCTION: a known true boundary with a clear band
# around it, which the training sample respects and the test sample does not. Two reasons.
# Overlapping blobs hand non-separable draws to SVC(C=1e6), which has no iteration cap and
# churns for minutes; and without a known truth there is nothing to measure "closer to right"
# against. The clear band is also the variable that turns out to matter most -- see `band`.
# ------------------------------------------------------------------ #
SPREAD = 3.0


def _truth_for(seed):
    rng = np.random.default_rng(seed)
    th = rng.uniform(0, 2 * np.pi)
    return np.array([np.cos(th), np.sin(th)]), rng


def _draw(rng, wt, n, gap):
    """n training points, uniform in the box but with a clear band of half-width `gap`."""
    pts, lab = [], []
    while len(pts) < n:
        p = rng.uniform(-SPREAD, SPREAD, 2)
        s = float(wt @ p)
        if abs(s) < gap:
            continue
        pts.append(p)
        lab.append(1.0 if s > 0 else -1.0)
    return np.array(pts), np.array(lab)


def _test_set(rng, wt, m=2000):
    """The real distribution: NO clear band, so points near the boundary do occur.

    This is the honest test. The band is a property of the training sample -- it is what makes
    many separators possible and the tie-break necessary -- not a property of the world.
    """
    X = rng.uniform(-SPREAD, SPREAD, (m, 2))
    return X, np.where(X @ wt > 0, 1.0, -1.0)


def _ang(u, v):
    c = float(u @ v / (np.linalg.norm(u) * np.linalg.norm(v)))
    return float(np.degrees(np.arccos(np.clip(abs(c), -1, 1))))


def _race(n, gap, seeds):
    sacc, pacc, sa, pa, w, l, t, closer = [], [], [], [], 0, 0, 0, 0
    for seed in range(seeds):
        wt, rng = _truth_for(seed)
        X, y = _draw(rng, wt, n, gap)
        if len(np.unique(y)) < 2:
            continue
        Xte, yte = _test_set(rng, wt)
        s = SVC(kernel="linear", C=1e6).fit(X, y)
        p = Perceptron(random_state=seed, max_iter=5000, tol=None).fit(X, y)
        if p.score(X, y) < 1.0:
            continue
        a, b = s.score(Xte, yte), p.score(Xte, yte)
        sacc.append(a)
        pacc.append(b)
        sa.append(_ang(s.coef_[0], wt))
        pa.append(_ang(p.coef_[0], wt))
        w += a > b
        l += a < b
        t += a == b
        closer += sa[-1] < pa[-1]
    return dict(draws=len(sacc), sacc=np.mean(sacc), pacc=np.mean(pacc),
                gain=np.mean(sacc) - np.mean(pacc), wlt="%d/%d/%d" % (w, l, t),
                sa=np.mean(sa), pa=np.mean(pa), closer=100.0 * closer / len(sacc))


def size():
    section("17. does the advantage depend on how much data you have?")
    print("Both models separate the training data perfectly every time; the test set is the whole")
    print("space, including the region near the boundary that the training sample avoided.")
    print()
    print("  %5s %7s %9s %9s %9s %10s %11s %11s %8s"
          % ("n", "draws", "max-marg", "percep", "gain", "W/L/T", "mm angle", "perc angle",
             "mm closer"))
    for n in (6, 10, 20, 40, 80, 160):
        r = _race(n, 0.6, 200)
        print("  %5d %7d %9.4f %9.4f %+9.4f %10s %11.2f %11.2f %7.0f%%"
              % (n, r["draws"], r["sacc"], r["pacc"], r["gain"], r["wlt"], r["sa"], r["pa"],
                 r["closer"]))
    print()
    print("  The gap WIDENS with more data: +0.021 at n=6, +0.043 at n=160, and the win/loss")
    print("  record goes from 110/82 to 198/1. The angle columns say why. The max-margin")
    print("  boundary converges on the truth -- 14.2 deg down to 0.7 -- while the perceptron")
    print("  stalls around 6 deg and stays there. It stops at the FIRST separator it finds, so")
    print("  extra data mostly gives it more ways to stop early.")


def band():
    section("18. how much room is there between the classes?")
    print("If the tie-break only matters when several separators are possible, then the width of")
    print("the clear band between the classes should control the whole effect. n = 40 throughout.")
    print()
    print("  %6s %9s %9s %9s %10s %11s %11s"
          % ("band", "max-marg", "percep", "gain", "W/L/T", "mm angle", "perc angle"))
    for gap in (0.05, 0.2, 0.6, 1.2, 1.8):
        r = _race(40, gap, 150)
        print("  %6.2f %9.4f %9.4f %+9.4f %10s %11.2f %11.2f"
              % (gap, r["sacc"], r["pacc"], r["gain"], r["wlt"], r["sa"], r["pa"]))
    print()
    print("  That is the whole story in one column. Squeeze the classes together and the gain")
    print("  collapses to +0.006; pull them apart and it grows to +0.087, a factor of fifteen.")
    print("  With no room between the classes every separator is nearly the same line, so")
    print("  choosing well among them cannot buy anything.")


def where():
    section("19. where you test decides whether you see any of this")
    print("The same trained models, scored on two different test sets. One is drawn the way the")
    print("TRAINING data was, with the same clear band. The other is the whole space, including")
    print("the strip beside the boundary that the training sample happened to avoid.")
    print()
    print("  %6s %28s %10s %9s %9s"
          % ("band", "test points drawn", "max-marg", "percep", "gain"))
    for gap in (0.6, 1.8):
        for mode in ("with the same clear band", "uniformly, boundary included"):
            sa, pa = [], []
            for seed in range(200):
                wt, rng = _truth_for(seed)
                X, y = _draw(rng, wt, 40, gap)
                if len(np.unique(y)) < 2:
                    continue
                if mode.startswith("with"):
                    Xte, yte = _draw(rng, wt, 2000, gap)
                else:
                    Xte, yte = _test_set(rng, wt)
                s = SVC(kernel="linear", C=1e6).fit(X, y)
                p = Perceptron(random_state=seed, max_iter=5000, tol=None).fit(X, y)
                if p.score(X, y) < 1.0:
                    continue
                sa.append(s.score(Xte, yte))
                pa.append(p.score(Xte, yte))
            print("  %6.2f %28s %10.4f %9.4f %+9.4f"
                  % (gap, mode, np.mean(sa), np.mean(pa), np.mean(sa) - np.mean(pa)))
    print()
    print("  Within each pair the models are identical; only the question changes. Test where the")
    print("  training data lived and both boundaries look near perfect, because the one region")
    print("  they disagree about is the region the test set avoids. Almost the entire difference")
    print("  between two separators lives in the strip between the classes, so a test set that")
    print("  stays out of that strip cannot see it -- and reports a tie.")


def bound():
    section("19b. does the theory predict the error without a test set?")
    print("Two classic bounds on a hard-margin SVM's error, both computable from the TRAINING")
    print("fit alone, against the error actually measured on held-out data.")
    print()
    print("  %6s %12s %13s %16s" % ("n", "test err", "#SV / n", "R^2 / (margin^2 n)"))
    for n in (20, 40, 80, 160):
        te, sv, rb = [], [], []
        for seed in range(120):
            wt, rng = _truth_for(seed)
            X, y = _draw(rng, wt, n, 0.6)
            if len(np.unique(y)) < 2:
                continue
            Xte, yte = _test_set(rng, wt)
            s = SVC(kernel="linear", C=1e6).fit(X, y)
            g = 1.0 / np.linalg.norm(s.coef_[0])
            te.append(1 - s.score(Xte, yte))
            sv.append(s.n_support_.sum() / n)
            rb.append(np.linalg.norm(X, axis=1).max() ** 2 / (g ** 2 * n))
        print("  %6d %12.4f %13.4f %16.1f" % (n, np.mean(te), np.mean(sv), np.mean(rb)))
    print()
    print("  The support-vector count is the useful one: it never dips below the true error and")
    print("  tracks it within about a factor of three, all without touching held-out data.")
    print("  The radius-margin bound is far looser -- at n=20 it reads 1.0, which says only")
    print("  'the error is at most 100%' and is no help at all.")


def onepoint():
    section("20. what one badly placed point does to a hard margin")
    wt, rng = _truth_for(11)
    X, y = _draw(rng, wt, 40, 0.6)
    Xte, yte = _test_set(rng, wt)
    who = int(np.argmin(np.abs(X @ wt)))
    target = X[who] - 2 * (X[who] @ wt) * wt      # its mirror image across the true boundary
    print("40 separable points, one of them walked steadily across the true boundary while")
    print("keeping its original label. Every other point stays exactly where it was.")
    print()
    print("  %9s %12s %12s %13s" % ("moved", "margin", "test acc", "separable"))
    for frac in (0.0, 0.5, 1.0, 1.5, 2.0, 2.5):
        Xm = X.copy()
        Xm[who] = X[who] + frac * (target - X[who])
        # Exact LP feasibility rather than a fit: asking SVC(C=1e6) about infeasible data is how
        # the first version of this experiment ran for minutes without finishing.
        A = -y[:, None] * np.c_[Xm, np.ones(len(y))]
        feasible = linprog(c=np.zeros(3), A_ub=A, b_ub=-np.ones(len(y)),
                           bounds=[(None, None)] * 3, method="highs").status == 0
        if not feasible:
            print("  %8.0f%% %12s %12s %13s" % (100 * frac, "--", "--", "NO"))
            continue
        m = SVC(kernel="linear", C=1e6).fit(Xm, y)
        print("  %8.0f%% %12.4f %12.4f %13s"
              % (100 * frac, 2 / np.linalg.norm(m.coef_[0]), m.score(Xte, yte), "yes"))
    print()
    print("  One point, and the margin falls from 1.44 to 0.05 while accuracy drops 17 points.")
    print("  The data stays separable the whole way down, so nothing warns you. Push it a little")
    print("  further and no separating hyperplane exists at all: the problem stops having an")
    print("  answer rather than returning a poor one.")



# ------------------------------------------------------------------ #
# 21-23. The soft margin (track page 5)
#
# Page 4 left the hard margin on a cliff: one point walked across the boundary took the margin
# from 1.44 to 0.05, and a little further there was no separating hyperplane at all. These three
# sections are the repair and its price.
# ------------------------------------------------------------------ #
def _slack(m, X, y):
    """Per-point violation xi_i = max(0, 1 - y_i f(x_i)), read back off a fitted model.

    Not an extra thing the solver hands you -- it is determined by the boundary, so it can be
    recomputed from w and b alone. Worth knowing before the dual chapter makes xi look like an
    independent variable being optimised alongside them.
    """
    return np.maximum(0.0, 1.0 - y * (X @ m.coef_[0] + m.intercept_[0]))


def _overlap(rng, n, d, sig, wt):
    """Two Gaussians whose means sit at +/- d along wt, each with spread sig.

    Unlike the band on page 4, the overlap here is a property of the WORLD, not of the sample:
    the test set is drawn the same way, and no line separates the classes at any sample size.
    The best achievable error is known exactly -- Phi(-d/sig) -- which gives every accuracy
    below something to be measured against.
    """
    lab = np.where(rng.random(n) < 0.5, -1.0, 1.0)
    return rng.normal(0, sig, (n, 2)) + d * lab[:, None] * wt, lab


def rescue():
    section("21. the same walk, with slack allowed")
    wt, rng = _truth_for(11)
    X, y = _draw(rng, wt, 40, 0.6)
    Xte, yte = _test_set(rng, wt)
    who = int(np.argmin(np.abs(X @ wt)))
    target = X[who] - 2 * (X[who] @ wt) * wt
    print("The walk that ended the last page, rerun with a soft-margin fit (C=1) alongside the")
    print("hard-margin one. Same points, same single point moving, same test set.")
    print()
    print("  %9s %10s %11s %11s %9s %11s"
          % ("moved", "hard?", "hard margin", "soft margin", "sum xi", "soft acc"))
    for frac in (0.0, 1.0, 2.0, 2.5, 3.0, 4.0, 6.0):
        Xm = X.copy()
        Xm[who] = X[who] + frac * (target - X[who])
        A = -y[:, None] * np.c_[Xm, np.ones(len(y))]
        ok = linprog(c=np.zeros(3), A_ub=A, b_ub=-np.ones(len(y)),
                     bounds=[(None, None)] * 3, method="highs").status == 0
        hm = "--"
        if ok:
            hm = "%.4f" % (2 / np.linalg.norm(SVC(kernel="linear", C=1e6).fit(Xm, y).coef_[0]))
        s = SVC(kernel="linear", C=1.0).fit(Xm, y)
        print("  %8.0f%% %10s %11s %11.4f %9.4f %11.4f"
              % (100 * frac, "yes" if ok else "NO", hm, 2 / np.linalg.norm(s.coef_[0]),
                 _slack(s, Xm, y).sum(), s.score(Xte, yte)))
    print()
    print("One walk is one anecdote, so the same thing over 100 fresh draws. The feasible column")
    print("is the share of draws that still admit a separating hyperplane at all; the hard-margin")
    print("column can only average over those, and the draws column says how many that was.")
    print()
    print("  %9s %10s %8s %12s %12s %12s"
          % ("moved", "feasible", "draws", "hard acc", "soft acc", "soft margin"))
    for frac in (0.0, 1.0, 2.0, 3.0, 4.0, 6.0):
        hs, ss, ms, nf = [], [], [], 0
        for seed in range(100):
            w0, r = _truth_for(seed)
            Xs, ys = _draw(r, w0, 40, 0.6)
            if len(np.unique(ys)) < 2:
                continue
            Xv, yv = _test_set(r, w0)
            j = int(np.argmin(np.abs(Xs @ w0)))
            tg = Xs[j] - 2 * (Xs[j] @ w0) * w0
            Xm = Xs.copy()
            Xm[j] = Xs[j] + frac * (tg - Xs[j])
            A = -ys[:, None] * np.c_[Xm, np.ones(len(ys))]
            if linprog(c=np.zeros(3), A_ub=A, b_ub=-np.ones(len(ys)),
                       bounds=[(None, None)] * 3, method="highs").status == 0:
                hs.append(SVC(kernel="linear", C=1e6).fit(Xm, ys).score(Xv, yv))
            else:
                nf += 1
            s = SVC(kernel="linear", C=1.0).fit(Xm, ys)
            ss.append(s.score(Xv, yv))
            ms.append(2 / np.linalg.norm(s.coef_[0]))
        print("  %8.0f%% %9.0f%% %8d %12s %12.4f %12.4f"
              % (100 * frac, 100 * len(hs) / (len(hs) + nf), len(hs),
                 ("%.4f" % np.mean(hs)) if hs else "no answer", np.mean(ss), np.mean(ms)))
    print()
    print("  With the data clean the two agree: 0.9780 against 0.9778, so allowing slack costs")
    print("  nothing when no slack is needed. One point across the boundary and the hard margin")
    print("  is down 9 points of accuracy while the soft margin is down 1. Past 200% the hard")
    print("  problem is infeasible in every draw -- not inaccurate, ANSWERLESS -- and the soft")
    print("  margin is still returning 0.968 and a WIDER corridor than it started with.")


def slack():
    section("22. what one xi is worth")
    rng = np.random.default_rng(0)
    th = rng.uniform(0, 2 * np.pi)
    wt = np.array([np.cos(th), np.sin(th)])
    X, y = _overlap(rng, 120, 1.0, 1.0, wt)
    m = SVC(kernel="linear", C=1.0).fit(X, y)
    xi = _slack(m, X, y)
    f = y * (X @ m.coef_[0] + m.intercept_[0])
    print("120 points from two overlapping Gaussians, one linear fit at C=1.")
    print("Every point falls into exactly one of four cases, and xi says which.")
    print()
    print("  %-38s %6s" % ("case", "points"))
    for lo, hi, name in ((-1e-9, 1e-9, "xi = 0       outside the corridor"),
                         (1e-9, 1.0, "0 < xi < 1   inside it, still correct"),
                         (1.0, 1.0 + 1e-9, "xi = 1       exactly on the boundary"),
                         (1.0 + 1e-9, 9e9, "xi > 1       on the wrong side")):
        print("  %-38s %6d" % (name, int(((xi > lo) & (xi <= hi)).sum())))
    print()
    print("  %-38s %6.4f" % ("sum of all xi", xi.sum()))
    print("  %-38s %6d" % ("training points misclassified", int((f < 0).sum())))
    print("  %-38s %6d" % ("points with xi > 0", int((xi > 1e-9).sum())))
    print("  %-38s %6d" % ("support vectors", m.n_support_.sum()))
    for i in sorted(set(m.support_.tolist()) - set(np.where(xi > 1e-9)[0].tolist())):
        print("  the support vector carrying no slack is point %d, at functional margin" % i)
        print("  %.6f -- resting ON the margin line rather than inside it." % f[i])
    print()
    print("Is sum(xi) >= the number of training errors always, or was that one lucky fit?")
    rows = []
    for seed in range(300):
        r = np.random.default_rng(seed)
        t2 = r.uniform(0, 2 * np.pi)
        w0 = np.array([np.cos(t2), np.sin(t2)])
        Xs, ys = _overlap(r, 100, 1.0, 1.0, w0)
        s = SVC(kernel="linear", C=1.0).fit(Xs, ys)
        rows.append((_slack(s, Xs, ys).sum(),
                     int((ys * (Xs @ s.coef_[0] + s.intercept_[0]) < 0).sum())))
    a = np.array(rows)
    print()
    print("  %-38s %8.2f" % ("mean sum(xi) over 300 draws", a[:, 0].mean()))
    print("  %-38s %8.2f" % ("mean training errors", a[:, 1].mean()))
    print("  %-38s %8d" % ("draws where sum(xi) < errors", int((a[:, 0] < a[:, 1]).sum())))
    print("  %-38s %8.4f" % ("smallest sum(xi) - errors seen", (a[:, 0] - a[:, 1]).min()))
    print()
    print("  It cannot go under, and the reason is in the table above: a misclassified point")
    print("  has xi > 1 all by itself. So sum(xi) is an upper bound on the training mistakes,")
    print("  which is why minimising it is a sane thing to ask for. It is a LOOSE bound --")
    print("  2.37x the true count here -- because every point inside the corridor pays too.")


def dial():
    section("23. what C buys and what it costs")
    print("Same two-Gaussian world, 100 training points, 4000 test points, 60 draws per row.")
    print("The truth is known, so the angle column is the real error of the direction of the")
    print("boundary rather than a proxy for it.")
    for d, sig in ((2.0, 1.0), (1.0, 1.0)):
        print()
        print("  -- means %.1f sigma apart; no line can beat %.4f accuracy --"
              % (d / sig, 1 - norm.cdf(-d / sig)))
        print("  %8s %9s %9s %7s %9s %9s %8s"
              % ("C", "margin", "sum xi", "#SV", "train", "test", "angle"))
        for C in (0.001, 0.01, 0.1, 1, 10, 100, 1000):
            mg, sx, nv, tr, te, an, one = [], [], [], [], [], [], 0
            for seed in range(60):
                r = np.random.default_rng(seed)
                t2 = r.uniform(0, 2 * np.pi)
                w0 = np.array([np.cos(t2), np.sin(t2)])
                Xtr, ytr = _overlap(r, 100, d, sig, w0)
                Xte, yte = _overlap(r, 4000, d, sig, w0)
                s = SVC(kernel="linear", C=C).fit(Xtr, ytr)
                w = s.coef_[0]
                one += len(np.unique(s.predict(Xte))) == 1
                mg.append(2 / np.linalg.norm(w))
                sx.append(_slack(s, Xtr, ytr).sum())
                nv.append(s.n_support_.sum())
                tr.append(s.score(Xtr, ytr))
                te.append(s.score(Xte, yte))
                an.append(_ang(w, w0))
            tail = "  (%d of 60 predict a single class)" % one if one else ""
            print("  %8g %9.3f %9.2f %7.1f %9.4f %9.4f %8.2f%s"
                  % (C, np.mean(mg), np.mean(sx), np.mean(nv), np.mean(tr), np.mean(te),
                     np.mean(an), tail))
    print()
    print("  Read the 2-sigma table across: as C rises, training accuracy climbs every step")
    print("  (0.9765 -> 0.9812) and test accuracy falls every step (0.9746 -> 0.9706). That is")
    print("  overfitting caught in the act, with C as the only thing that changed.")
    print("  The angle column is the more sensitive instrument: 3.42 degrees out at C=0.01 and")
    print("  9.25 at C=1000. Chasing the last few training points costs real direction.")
    print("  At the bottom of the dial the model stops modelling. C=0.001 gives a corridor")
    print("  11.8 wide -- wider than the data -- and 59 of 60 fits answer one class for every")
    print("  point. Free to ignore everything, it does.")
    print("  In the 1-sigma table test accuracy barely moves (0.8257 -> 0.8333). When the")
    print("  classes overlap this much the irreducible error swamps whatever C is doing.")
    print()
    print("Does a large C give back the hard margin on data that IS separable?")
    wt, rng = _truth_for(11)
    X, y = _draw(rng, wt, 40, 0.6)
    hard = SVC(kernel="linear", C=1e6, tol=1e-9).fit(X, y)
    hw = hard.coef_[0]
    print()
    print("  %10s %11s %11s %15s" % ("C", "margin", "sum xi", "angle vs hard"))
    for C in (0.1, 1, 10, 100, 1000):
        s = SVC(kernel="linear", C=C, tol=1e-9).fit(X, y)
        w = s.coef_[0]
        print("  %10g %11.4f %11.2e %15.4f"
              % (C, 2 / np.linalg.norm(w), _slack(s, X, y).sum(), _ang(w, hw)))
    print("  %10s %11.4f" % ("hard", 2 / np.linalg.norm(hw)))
    print()
    print("  From C=1 up it is the hard-margin answer to four decimals and 0.0000 degrees.")
    print("  Soft margin does not replace the hard one, it contains it: once C is steep enough")
    print("  that no violation is worth its price, the solver stops buying any. Nothing had to")
    print("  be switched off, and C did not have to go near infinity to get there.")


# ------------------------------------------------------------------ #
# 24-26. The hinge loss (track page 6)
#
# Page 5 ended by claiming that xi is fully determined by the boundary, so the constrained
# problem collapses into an unconstrained one. That is easy to assert and easy to get subtly
# wrong, so `unconstrained` solves the same problem three independent ways and checks that all
# three land in the same place.
#
# These reuse _truth_for and _overlap from the soft-margin sections, so the worlds here are the
# same worlds page 5 measured on.
# ------------------------------------------------------------------ #
def _hinge_sum(w, b, X, y):
    return float(np.maximum(0.0, 1.0 - y * (X @ w + b)).sum())


def _n_wrong(w, b, X, y):
    """Points on or over the boundary. `<= 0` so a point sitting exactly on it counts as wrong."""
    return int((y * (X @ w + b) <= 0).sum())


def _pure_hinge(X, y):
    """Minimise the RAW hinge sum -- no regulariser, so the only gap left is the surrogate's.

    Nelder-Mead rather than a gradient method because the objective has a kink at every point,
    and restarts because a piecewise-linear objective has flat faces a simplex can settle on.
    """
    f = lambda v: _hinge_sum(v[:2], v[2], X, y)
    best = None
    for s in range(8):
        r = minimize(f, np.random.default_rng(500 + s).normal(0, 1, 3), method="Nelder-Mead",
                     options={"maxiter": 40000, "xatol": 1e-11, "fatol": 1e-11})
        if best is None or r.fun < best.fun:
            best = r
    return best.x[:2], best.x[2]


def _best01(X, y):
    """The exact minimum training-error linear classifier, by exhaustive search.

    An optimal halfplane can be rotated and slid until its boundary touches two of the points
    without its error going up, so trying the line through every pair finds the optimum. Both
    orientations and a nudge either way, so points lying ON a candidate line are not a tie.
    Returns (errors, (w, b), candidates tried).
    """
    n = len(y)
    best, arg, seen = n + 1, None, 0
    for i, j in itertools.combinations(range(n), 2):
        d = X[j] - X[i]
        nrm = np.array([-d[1], d[0]])
        h = float(np.hypot(*nrm))
        if h < 1e-12:
            continue
        nrm = nrm / h
        b0 = float(-nrm @ X[i])
        for s in (1.0, -1.0):
            for eps in (1e-9, -1e-9):
                w, b = s * nrm, s * (b0 + eps)
                seen += 1
                e = _n_wrong(w, b, X, y)
                if e < best:
                    best, arg = e, (w, b)
    return best, arg, seen


def unconstrained():
    section("24. is the constrained problem really an unconstrained loss?")
    wt, rng = _truth_for(4)
    X, y = _overlap(rng, 60, 1.4, 1.0, wt)
    n = len(y)
    print("60 points from two overlapping clouds, solved THREE ways at each C:")
    print("  (a) sklearn, which solves the dual and never forms a xi at all;")
    print("  (b) the primal exactly as written, with n slack variables and 2n constraints;")
    print("  (c) xi eliminated -- an unconstrained minimisation over w and b only, 3 numbers.")
    print("If the elimination is valid, all three agree. Objective is (1/2)|w|^2 + C*sum(xi).")
    print()
    print("  %8s %14s %14s %14s %12s %12s"
          % ("C", "(a) sklearn", "(b) primal", "(c) no xi", "b vs a deg", "c vs a deg"))

    def primal(C):
        cons = [{"type": "ineq", "fun": lambda v: y * (X @ v[:2] + v[2]) - 1 + v[3:]},
                {"type": "ineq", "fun": lambda v: v[3:]}]
        return minimize(lambda v: 0.5 * v[:2] @ v[:2] + C * v[3:].sum(),
                        np.r_[np.zeros(3), np.ones(n)], constraints=cons, method="SLSQP",
                        options={"maxiter": 800, "ftol": 1e-12})

    for C in (0.1, 1.0, 10.0):
        m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
        ws, bs = m.coef_[0], float(m.intercept_[0])
        o_a = 0.5 * ws @ ws + C * _hinge_sum(ws, bs, X, y)
        rb = primal(C)
        g = lambda v: 0.5 * v[:2] @ v[:2] + C * _hinge_sum(v[:2], v[2], X, y)
        rc = None
        for s in range(6):
            t = minimize(g, np.random.default_rng(100 + s).normal(0, 1, 3), method="Nelder-Mead",
                         options={"maxiter": 20000, "xatol": 1e-12, "fatol": 1e-12})
            if rc is None or t.fun < rc.fun:
                rc = t
        print("  %8g %14.6f %14.6f %14.6f %12.4f %12.4f"
              % (C, o_a, rb.fun, rc.fun, _ang(rb.x[:2], ws), _ang(rc.x[:2], ws)))
    print()
    print("Route (b) optimises 60 real slack variables under constraints that only put a floor")
    print("under them. Compare what it chose against max(0, 1 - y f(x)) at the boundary it")
    print("returned, at C = 1:")
    rb = primal(1.0)
    xi = rb.x[3:]
    hinge = np.maximum(0.0, 1.0 - y * (X @ rb.x[:2] + rb.x[2]))
    print()
    print("  %-44s %12.3e" % ("largest gap between the two, over 60 points",
                              float(np.abs(xi - hinge).max())))
    print("  %-44s %12s" % ("any xi above its own hinge by 1e-6 or more",
                            str(bool(((xi - hinge) > 1e-6).any()))))
    print()
    print("  The solver could have set any xi as high as it liked and it put all 60 of them on")
    print("  max(0, 1 - y f(x)) to fourteen decimals. It had no choice: the constraints force")
    print("  xi >= 1 - y f(x) and xi >= 0, the objective charges for every unit, so the cheapest")
    print("  legal value is whichever of those two floors is higher. Nothing is being decided.")
    print("  Substituting that back leaves an objective in w and b alone, with no constraints:")
    print()
    print("      (1/2)|w|^2  +  C * sum_i max(0, 1 - y_i f(x_i))")
    print()
    print("  a penalty on w plus a per-point price. The second term is the HINGE, and the whole")
    print("  soft-margin construction is that loss and nothing else.")


def surrogate():
    section("25. what the hinge costs against the loss you actually care about")
    print("Nobody wants the hinge minimised. The thing anyone wants is the count of mistakes,")
    print("the 0-1 loss. Pointwise, writing z = y f(x):")
    print()
    print("  %8s %10s %8s   %s" % ("z", "hinge", "0-1", "what it means"))
    notes = {-2.0: "badly wrong", -0.5: "wrong side", 0.0: "on the boundary",
             0.5: "right side, inside the margin", 1.0: "exactly on the margin",
             2.0: "correct and clear", 5.0: "correct and far"}
    for z in (-2.0, -0.5, 0.0, 0.5, 1.0, 2.0, 5.0):
        print("  %8.1f %10.4f %8d   %s" % (z, max(0.0, 1 - z), int(z <= 0), notes[z]))
    print()
    print("  The hinge is never below the 0-1 loss, and at z = 0 it equals exactly 1 -- it sits")
    print("  on top of the step at the one place the step moves. So the summed hinge is an upper")
    print("  bound on the mistake count. A bound is not the thing, though. How far apart are")
    print("  the two once they are minimised?")
    print()
    print("30 draws, 60 training points, 4000 test points, clouds 1.0 sigma apart. The exact")
    print("0-1 minimiser comes from brute force over every pair of points.")
    rows = []
    for seed in range(30):
        wt, r = _truth_for(seed)
        X, y = _overlap(r, 60, 1.0, 1.0, wt)
        Xte, yte = _overlap(r, 4000, 1.0, 1.0, wt)
        m = SVC(kernel="linear", C=1.0).fit(X, y)
        wr, br = m.coef_[0], float(m.intercept_[0])
        wh, bh = _pure_hinge(X, y)
        e0, (w0, b0), _ = _best01(X, y)
        rows.append((_n_wrong(wr, br, X, y), _n_wrong(wh, bh, X, y), e0,
                     _n_wrong(wr, br, Xte, yte) / len(yte),
                     _n_wrong(wh, bh, Xte, yte) / len(yte),
                     _n_wrong(w0, b0, Xte, yte) / len(yte)))
    a = np.array(rows, dtype=float)
    print()
    print("  %-38s %14s %12s" % ("", "train errors", "test error"))
    print("  %-38s %14.2f %12.4f" % ("soft-margin fit, C = 1", a[:, 0].mean(), a[:, 3].mean()))
    print("  %-38s %14.2f %12.4f" % ("pure hinge, no regulariser", a[:, 1].mean(), a[:, 4].mean()))
    print("  %-38s %14.2f %12.4f" % ("exact minimum 0-1, brute force", a[:, 2].mean(), a[:, 5].mean()))
    print("  %-38s %14s %12.4f" % ("best any line can do on this world", "--", float(norm.cdf(-1.0))))
    print()
    print("  %-50s %s" % ("draws where pure hinge hit the 0-1 optimum",
                          "%d of 30" % int((a[:, 1] == a[:, 2]).sum())))
    print("  %-50s %.2f" % ("mean extra training errors it made", (a[:, 1] - a[:, 2]).mean()))
    print("  %-50s %s" % ("draws where the 0-1 optimum won on test",
                          "%d of 30" % int((a[:, 5] < a[:, 4]).sum())))
    print()
    print("  The surrogate really does fail at the job as stated. Minimising the hinge leaves")
    print("  about two more training mistakes than necessary and reaches the true optimum in")
    print("  2 draws out of 30. Now read the test column: the boundary with the FEWEST training")
    print("  mistakes is the WORST of the three out of sample, 0.1800 against 0.1664.")
    print("  The 0-1 loss cannot tell a point that just barely crossed from one that is nowhere")
    print("  near, so it will tilt the boundary hard toward points it is already deeply wrong")
    print("  about in order to shave one mistake off. The hinge charges by HOW wrong a point is,")
    print("  and attending to that is worth more than the two training errors it costs.")


def descend():
    section("26. the mistake count is not something you could minimise anyway")
    wt, rng = _truth_for(1)
    X, y = _overlap(rng, 60, 1.0, 1.0, wt)
    degs = np.arange(0, 360, 0.25)
    dirs = [2 * np.array([np.cos(np.radians(d)), np.sin(np.radians(d))]) for d in degs]
    e01 = np.array([_n_wrong(w, 0.0, X, y) for w in dirs])
    hng = np.array([_hinge_sum(w, 0.0, X, y) for w in dirs])
    d01 = np.abs(np.diff(e01))
    dh = np.abs(np.diff(hng))
    print("Rotate one boundary through a full turn in steps of 0.25 degrees, watching both.")
    print()
    print("  %-46s %12s %12s" % ("", "0-1", "hinge"))
    print("  %-46s %11.1f%% %11.1f%%" % ("steps where the loss does not move at all",
                                         100 * (d01 == 0).mean(), 100 * (dh < 1e-12).mean()))
    print("  %-46s %12d %12d" % ("distinct values over the sweep",
                                 len(np.unique(e01)), len(np.unique(hng.round(9)))))
    print("  %-46s %12d %12s" % ("largest jump in one step", int(d01.max()), "none"))
    print("  %-46s %12.2f %12.2f" % ("angle of the minimum, degrees",
                                     degs[e01.argmin()], degs[hng.argmin()]))
    print()
    print("  The 0-1 loss is flat across 92.5% of the sweep. Flat means zero gradient, and zero")
    print("  gradient means nothing for a descent method to follow -- from almost anywhere every")
    print("  direction looks equally good. Where it is not flat it does not slope either; it")
    print("  jumps, by as much as 3 errors at once. There is no local information in it at all.")
    print("  The hinge never sits still, so from any starting point there is a way downhill.")
    print("  And the last row is the previous section's surrogate gap seen as an angle: the two")
    print("  minima are 18.5 degrees apart.")
    print()
    print("Brute force worked above only because the data is 2-D and small. Counting the")
    print("boundaries it has to test, which unlike a stopwatch means the same thing on any")
    print("machine:")
    print()
    print("  %8s %14s %14s %16s" % ("n", "candidates", "vs previous", "per data point"))
    prev = None
    for n in (20, 40, 80, 160):
        w2, r2 = _truth_for(1)
        Xs, ys = _overlap(r2, n, 1.0, 1.0, w2)
        _, _, seen = _best01(Xs, ys)
        print("  %8d %14d %14s %16.1f"
              % (n, seen, "--" if prev is None else "%.2fx" % (seen / prev), seen / n))
        prev = seen
    print()
    print("  Every doubling of n costs roughly four times the work, because the count is one")
    print("  per PAIR of points. The fit does not enumerate anything, so none of this applies")
    print("  to it. And this is the easy case: the boundary rests on 2 points because there")
    print("  are 2 features. With d features it rests on d of them, so the search runs over")
    print("  subsets of size d and the exponent is the number of columns in the data.")
    print("  Minimising the mistake count exactly is not a slow approach waiting to be")
    print("  optimised; it is a different kind of problem.")
    print("  Convexity is what the hinge buys. Every local minimum is the global one, and a")
    print("  solver can walk downhill to it from anywhere.")


# ------------------------------------------------------------------ #
# 27. Where the pull on the boundary comes from (track page 7)
#
# Sections 3 and 4 already show the two halves of this separately -- 4 puts the losses side by
# side and 3 deletes every non-support-vector without moving the boundary. This one connects
# them: it measures how much of the force on the boundary comes from points that are already
# comfortably correct, which is exactly zero for the hinge and most of the total for log loss.
#
# The support-vector set comes from sklearn's `support_` and NOT from a z <= 1 test. Those
# disagree: at the default tolerance the points resting ON the margin land a whisker above 1
# (measured here: 1.0000356 up to 1.00053815), so the threshold quietly drops real support
# vectors. On a fit that rests on 3 points, dropping one swings the refit by 6 degrees, which
# looked like the sparsity claim failing when it was the measurement that was wrong.
# ------------------------------------------------------------------ #
def pull():
    section("27. which points are still pulling on the boundary")
    print("The derivative of each loss with respect to z = y f(x) is the force one point exerts.")
    print("For the hinge that is -1 below z = 1 and exactly 0 above it. For log loss it is")
    print("-1/(1 + e^z), which is never zero however far out the point sits.")
    print()
    print("  %8s %14s %16s" % ("z", "hinge pull", "log loss pull"))
    for z in (0.0, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0):
        print("  %8.1f %14s %16.3e"
              % (z, "1" if z < 1 else "0", 1.0 / (1.0 + np.exp(z))))
    print()
    print("  A point at z = 20 is correct by a mile and still pulls, by 2e-09. On its own that")
    print("  is nothing. The question is what they add up to, because there are usually a lot")
    print("  of them.")
    print()
    print("Same 20 datasets, 280 points each, fitted both ways at C = 1:")
    hs, ls, fh, fl = [], [], [], []
    for seed in range(20):
        X, y0 = make_blobs(n_samples=280, centers=2, n_features=2, cluster_std=2.2,
                           random_state=seed)
        y = np.where(y0 == 0, -1.0, 1.0)
        m = SVC(kernel="linear", C=1.0).fit(X, y)
        z = y * (X @ m.coef_[0] + m.intercept_[0])
        g = np.where(z < 1, 1.0, 0.0)
        hs.append(100 * g[z > 1].sum() / g.sum())
        fh.append(100 * float((z > 1).mean()))
        lr = LogisticRegression(C=1.0, max_iter=5000).fit(X, y)
        z = y * (X @ lr.coef_[0] + lr.intercept_[0])
        g = 1.0 / (1.0 + np.exp(z))
        ls.append(100 * g[z > 1].sum() / g.sum())
        fl.append(100 * float((z > 1).mean()))
    print()
    print("  %-34s %16s %16s" % ("", "hinge", "log loss"))
    print("  %-34s %15.1f%% %15.1f%%" % ("points sitting past z = 1", np.mean(fh), np.mean(fl)))
    print("  %-34s %15.4f%% %15.2f%%" % ("share of the total pull they exert",
                                         np.mean(hs), np.mean(ls)))
    print()
    print("  Over half the force shaping a logistic boundary comes from points it already")
    print("  classifies correctly and confidently. For the hinge that number is 0, not rounded")
    print("  to 0 -- those points are multiplied by a derivative that is exactly zero.")
    print()
    print("So each model is asked to give up the points it says it does not need. For the SVM")
    print("that set has a name: everything outside the margin. Log loss has no such set, so it")
    print("gives up the same NUMBER of its most comfortable points instead.")
    rows = []
    for seed in range(20):
        X, y0 = make_blobs(n_samples=280, centers=2, n_features=2, cluster_std=2.2,
                           random_state=seed)
        y = np.where(y0 == 0, -1.0, 1.0)
        n = len(y)
        m = SVC(kernel="linear", C=1.0).fit(X, y)
        ws = m.coef_[0]
        keep_s = np.sort(m.support_)
        lr = LogisticRegression(C=1.0, max_iter=5000).fit(X, y)
        zl = y * (X @ lr.coef_[0] + lr.intercept_[0])
        keep_l = np.sort(np.argsort(-zl)[n - len(keep_s):])
        if len(np.unique(y[keep_s])) < 2 or len(np.unique(y[keep_l])) < 2:
            continue
        rows.append((
            len(keep_s),
            _ang(SVC(kernel="linear", C=1.0).fit(X[keep_s], y[keep_s]).coef_[0], ws),
            _ang(LogisticRegression(C=1.0, max_iter=5000)
                 .fit(X[keep_l], y[keep_l]).coef_[0], lr.coef_[0]),
        ))
    a = np.array(rows, dtype=float)
    print()
    print("  %-44s %16s %16s" % ("", "SVM", "logistic"))
    print("  %-44s %15.4f %16.4f" % ("mean boundary movement, degrees",
                                     a[:, 1].mean(), a[:, 2].mean()))
    print("  %-44s %15.4f %16.4f" % ("worst movement over the 20 datasets",
                                     a[:, 1].max(), a[:, 2].max()))
    print("  %-44s %13d/%d %14d/%d" % ("datasets that moved less than 0.05 degrees",
                                       int((a[:, 1] < 0.05).sum()), len(a),
                                       int((a[:, 2] < 0.05).sum()), len(a)))
    print()
    print("  %-44s %.0f%% to %.0f%%" % ("support vectors as a share of the data",
                                        100 * a[:, 0].min() / 280, 100 * a[:, 0].max() / 280))
    print()
    print("  The SVM is unmoved: 0.03 degrees at worst, and that is solver noise rather than a")
    print("  real shift. Log loss moves 24 degrees on average and 74 at worst, on data it was")
    print("  getting right. The last row is the limit on all of this: how sparse the solution")
    print("  turns out to be is not fixed, and on one of these datasets 92% of the points are")
    print("  support vectors. Sparsity is a property of the fit, not a guarantee.")

    # The lab draws a logistic boundary beside the SVM one and calls it logistic regression.
    # That is a claim about a hand-written gradient descent in TypeScript, so record sklearn's
    # answer on fixed datasets for svm_logistic_check.mjs to hold the port to. Standardised,
    # because the lab works in standardised space. Notices go to stderr: this section's stdout
    # is pasted onto a page and internal plumbing has leaked onto one before.
    import json
    import pathlib
    cases = []
    for seed, C in ((0, 0.1), (0, 1.0), (0, 10.0), (3, 1.0), (7, 1.0)):
        X, y0 = make_blobs(n_samples=120, centers=2, n_features=2, cluster_std=2.2,
                           random_state=seed)
        X = (X - X.mean(0)) / X.std(0)
        y = np.where(y0 == 0, -1.0, 1.0)
        lr = LogisticRegression(C=C, max_iter=20000, tol=1e-10).fit(X, y)
        cases.append(dict(seed=seed, C=C, X=X.round(10).tolist(), y=y.tolist(),
                          w=[round(v, 10) for v in lr.coef_[0].tolist()],
                          b=round(float(lr.intercept_[0]), 10)))
    out = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_logistic_case.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(cases), encoding="utf-8")
    print("  Wrote %d logistic cases to %s for the port check." % (len(cases), out.name),
          file=sys.stderr)

# ------------------------------------------------------------------ #
# PAGE 8 -- the primal problem. Chapter 3 opens by naming the thing pages 1-7 built: a convex
# quadratic program. Nothing here moves the boundary. What changes is what can be SAID about
# it -- that a stock solver handles it, that there is exactly one answer, that the one part of
# the answer which is not unique can be located, and that the problem has a size written in d.
# ------------------------------------------------------------------ #
def _qp(X, y, C):
    """The soft-margin SVM as a standard-form QP: min (1/2)uPu + qu subject to Gu <= h.

    u stacks [w (d) | b (1) | xi (n)]. The first n rows of G are the margin constraints with
    everything moved to the left; the last n are xi >= 0. Returns arrays only -- no closures
    over X or y -- because the point of the section is that the solver never sees the data.
    """
    n, d = X.shape
    k = d + 1 + n
    P = np.zeros((k, k))
    P[:d, :d] = np.eye(d)
    q = np.zeros(k)
    q[d + 1:] = C
    G = np.zeros((2 * n, k))
    G[:n, :d] = -y[:, None] * X
    G[:n, d] = -y
    G[:n, d + 1:] = -np.eye(n)
    G[n:, d + 1:] = -np.eye(n)
    h = np.concatenate([-np.ones(n), np.zeros(n)])
    return P, q, G, h


def _qp_solve(P, q, G, h, u0, method="SLSQP"):
    """Hand P, q, G, h to a general-purpose constrained minimiser and take what comes back."""
    f = lambda u: 0.5 * u @ P @ u + q @ u
    jac = lambda u: P @ u + q
    if method == "SLSQP":
        return minimize(f, u0, jac=jac, method="SLSQP",
                        constraints=[{"type": "ineq", "fun": lambda u: h - G @ u,
                                      "jac": lambda u: -G}],
                        options={"maxiter": 800, "ftol": 1e-12})
    return minimize(f, u0, jac=jac, hess=lambda u: P, method="trust-constr",
                    constraints=[LinearConstraint(G, -np.inf, h)],
                    options={"maxiter": 3000, "gtol": 1e-12, "xtol": 1e-14})


def _b_star_interval(X, y, w):
    """Every offset that minimises the hinge sum for a fixed w, found exactly.

    For fixed w the sum is piecewise linear in b, with a kink at b = y_i - w.x_i for each
    point, and on each piece a slope of -sum{y_i : y_i(w.x_i + b) < 1} -- a whole number. So
    "flat" means a slope of exactly zero, which is a thing you can test, rather than "a small
    number", which is a thing you can only threshold. Convexity makes the slope
    non-decreasing, so the zero run is contiguous and the optimal set is an interval.
    """
    k = np.unique(y - X @ w)
    edges = np.concatenate([[k[0] - 1.0], k, [k[-1] + 1.0]])
    mids = 0.5 * (edges[:-1] + edges[1:])
    slope = np.array([-y[y * (X @ w + m) < 1].sum() for m in mids])
    if (slope == 0).any():
        j = np.where(slope == 0)[0]
        return float(edges[j[0]]), float(edges[j[-1] + 1])
    j = int(np.argmax(slope > 0))
    return float(edges[j]), float(edges[j])


def _blob(seed, n=40):
    """Two standardised clouds. Standardised because page 15 is about why that matters."""
    X, y0 = make_blobs(n_samples=n, centers=2, n_features=2, cluster_std=2.0, random_state=seed)
    return (X - X.mean(0)) / X.std(0), np.where(y0 == 0, -1.0, 1.0)


def _obj(w, b, X, y, C):
    return float(0.5 * w @ w + C * np.maximum(0.0, 1.0 - y * (X @ w + b)).sum())


def primal():
    section("28. the problem in the form a solver recognises")
    print("Pages 1 to 7 wrote the soft-margin problem in SVM words. Written in the words an")
    print("optimiser uses, it is a QUADRATIC PROGRAM -- minimise a quadratic subject to linear")
    print("inequalities -- and the translation is total: four arrays come out, and not one")
    print("entry in them knows what a margin is.")
    print()
    Xs = np.array([[1.2, 0.4], [0.3, 1.1], [-0.9, -0.2], [-0.4, -1.3]])
    ys = np.array([1.0, 1.0, -1.0, -1.0])
    P, q, G, h = _qp(Xs, ys, 1.0)
    print("Four points and two features, so the arrays fit on a screen. Every unknown the fit")
    print("has to choose stacks into one vector u = [w1 w2 | b | xi1 xi2 xi3 xi4], 7 numbers.")
    print()
    print("  P, the quadratic term (7x7)        q, the linear term")
    for i, r in enumerate(P):
        lab = ("w%d" % (i + 1) if i < 2 else "b" if i == 2 else "xi%d" % (i - 2))
        print("      " + " ".join("%2g" % v for v in r) + "        %5g        <- %s"
              % (q[i], lab))
    print()
    print("  %d nonzero entries in P out of %d, and both of them belong to w. C = 1 sits in q,"
          % (int((P != 0).sum()), P.size))
    print("  once per slack variable. Nothing anywhere penalises b -- that is a real asymmetry,")
    print("  and section 30 is what it costs.")
    print()
    print("  G and h, one row per constraint (%dx%d):" % G.shape)
    for i in range(len(h)):
        note = ("y%d(w.x%d + b) + xi%d >= 1" % (i + 1, i + 1, i + 1) if i < 4
                else "xi%d >= 0" % (i - 3))
        print("      " + " ".join("%6.2f" % (v + 0.0) for v in G[i] + 0.0)
              + "   <= %5.1f    %s" % (h[i] + 0.0, note))
    print()
    print("Now the real check. 40 points, and the four arrays handed to two general-purpose")
    print("solvers -- one sequential-quadratic, one interior-point -- against sklearn, which")
    print("solves a different form of the problem with an algorithm written for SVMs:")
    print()
    X, y = _blob(1)
    n, d = X.shape
    k = d + 1 + n
    print("  %-6s %-19s %16s %16s %17s"
          % ("C", "solver", "objective", "angle vs SVC", "worst violation"))
    worst = []
    for C in (0.1, 1.0, 10.0):
        P, q, G, h = _qp(X, y, C)
        m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
        ws, bs = m.coef_[0], float(m.intercept_[0])
        print("  %-6g %-19s %16.10f %16s %17s"
              % (C, "sklearn SVC", _obj(ws, bs, X, y, C), "--", "--"))
        u0 = np.zeros(k)
        u0[d + 1:] = 1.0
        for meth in ("SLSQP", "trust-constr"):
            r = _qp_solve(P, q, G, h, u0, meth)
            a = _ang(r.x[:d], ws)
            worst.append(a)
            print("  %-6s %-19s %16.10f %16.2e %17.2e"
                  % ("", "scipy " + meth, r.fun, a,
                     max(0.0, float((G @ r.x - h).max()))))
    print()
    print("  %-46s %16.2e" % ("worst angle against sklearn, degrees", max(worst)))
    print("  %-46s %16.2e" % ("best angle against sklearn, degrees", min(worst)))
    print()
    print("Six solves, and the worst of them puts the boundary a ten-thousandth of a")
    print("degree away from the answer a purpose-built SVM routine returns. The objective")
    print("agrees to ten figures for one solver and to six for the other, which is a fact")
    print("about their stopping rules rather than about the problem. The SVM is not an")
    print("algorithm here -- it is a shape, and optimisation had catalogued that shape long")
    print("before anyone pointed it at classifying anything.")


def convex():
    section("29. one answer, reached from anywhere")
    X, y = _blob(1)
    n, d = X.shape
    k = d + 1 + n
    C = 1.0
    P, q, G, h = _qp(X, y, C)
    f = lambda u: 0.5 * u @ P @ u + q @ u
    rng = np.random.default_rng(0)

    print("Convex is the word that makes the rest of this chapter safe, so it gets tested")
    print("rather than quoted. Convex means a chord never dips below the curve; the midpoint")
    print("is the cheapest case of that to check, and the feasible set gets the same test.")
    print()
    vf = vs = 0
    trials = 50000
    for _ in range(trials):
        pair = []
        for _ in range(2):
            wv = rng.normal(0, 3, d)
            bv = rng.normal(0, 3)
            xi = np.maximum(0.0, 1 - y * (X @ wv + bv)) + abs(rng.normal(0, 3))
            pair.append(np.concatenate([wv, [bv], xi]))
        u, v = pair
        mid = 0.5 * (u + v)
        vf += f(mid) > 0.5 * (f(u) + f(v)) + 1e-12
        vs += not bool((G @ mid <= h + 1e-12).all())
    print("  %d random pairs of feasible points" % trials)
    print("    midpoints where the objective beat the average of the two ends: %d" % int(vf))
    print("    midpoints that fell outside the feasible set:                   %d" % int(vs))
    ev = np.linalg.eigvalsh(P)
    print()
    print("  eigenvalues of the quadratic term: %d at 1, %d at 0"
          % (int((ev > 0.5).sum()), int((ev <= 0.5).sum())))
    print("    convex, then, but not STRICTLY convex: %d of the %d directions are flat."
          % (int((ev <= 0.5).sum()), k))
    print("    Hold that thought. Section 30 is about where the flatness survives.")
    print()
    print("What convexity is supposed to buy is that the starting point stops mattering. So:")
    print("60 starts spread over four scales, each one made feasible by handing it whatever")
    print("slack its own boundary happens to need.")
    print()
    objs, dirs, bs, j0, ok = [], [], [], [], []
    for t in range(60):
        sc = (0.1, 1.0, 5.0, 20.0)[t % 4]
        w0 = rng.normal(0, sc, d)
        b0 = rng.normal(0, sc)
        u0 = np.concatenate([w0, [b0], np.maximum(0.0, 1 - y * (X @ w0 + b0))])
        j0.append(f(u0))
        r = _qp_solve(P, q, G, h, u0)
        ok.append(bool(r.success))
        objs.append(r.fun)
        dirs.append(r.x[:d] / np.linalg.norm(r.x[:d]))
        bs.append(r.x[d])
    objs, dirs, bs, j0 = np.array(objs), np.array(dirs), np.array(bs), np.array(j0)
    ok = np.array(ok)
    deg = np.degrees(np.arccos(np.clip(dirs @ dirs[0], -1, 1)))
    print("  %-48s %16s" % ("objective at the start",
                             "%.1f to %.1f" % (j0.min(), j0.max())))
    print("  %-48s %16.10f" % ("objective at the finish, lowest", objs.min()))
    print("  %-48s %16.10f" % ("objective at the finish, highest", objs.max()))
    print("  %-48s %16.2e" % ("spread across the 60 finishes", np.ptp(objs)))
    print("  %-48s %16.2e" % ("worst disagreement about direction, degrees", deg.max()))
    print("  %-48s %16.2e" % ("spread of the offset b", np.ptp(bs)))
    print()
    fails = int((~ok).sum())
    print("  %-48s %16s" % ("runs that returned a failure flag", "%d of 60" % fails))
    print("  %-48s %16.2e" % ("worst objective among those, above the best",
                              (objs[~ok] - objs.min()).max()))
    print("  %-48s %16.2e" % ("worst direction among those, degrees", deg[~ok].max()))
    print()
    print("  Every one of the 60 landed on the same objective to ten figures and the same")
    print("  direction to five decimal places, from starts three orders of magnitude apart.")
    print("  The failure flags are worth keeping in the table rather than filtering out:")
    print("  %d runs reported that the line search had stalled, and all %d of them were" % (
        fails, fails))
    print("  standing on the answer when they said it. Convex settles where the bottom is,")
    print("  not how gracefully a solver arrives. The offset is the odd row out, and that one")
    print("  is not solver trouble at all -- section 30.")
    print()
    print("For contrast, the same 60 starts on the objective you actually care about -- the")
    print("count of mistakes from page 6 -- which is not convex:")
    print()

    def n01(th):
        wv = np.array([np.cos(th[0]), np.sin(th[0])])
        return float((y * (X @ wv + th[1]) <= 0).sum())

    got = []
    for _ in range(60):
        r = minimize(n01, np.array([rng.uniform(0, 2 * np.pi), rng.normal(0, 1)]),
                     method="Nelder-Mead",
                     options={"maxiter": 4000, "xatol": 1e-10, "fatol": 1e-10})
        got.append(int(r.fun))
    got = np.array(got)
    print("  %-48s %16d" % ("distinct answers returned", len(set(got.tolist()))))
    print("  %-48s %16s" % ("mistakes, best and worst",
                            "%d to %d" % (got.min(), got.max())))
    print("  %-48s %16s" % ("starts that reached the best value found",
                            "%d of 60" % int((got == got.min()).sum())))
    print()
    print("  Same data, same starts, same solver family, %d different answers to the same"
          % len(set(got.tolist())))
    print("  question. That gap is what the shape buys, and it is why the thing being")
    print("  minimised is the hinge.")


def flat():
    section("30. the one part of the answer the primal does not pin down")
    X, y = _blob(1)
    C = 1.0
    m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
    w, b = m.coef_[0], float(m.intercept_[0])
    lo, hi = _b_star_interval(X, y, w)
    print("Section 29 left a loose end: 60 restarts agreed about the direction to five decimal")
    print("places and disagreed about the offset in the second. Chasing that down is worth a")
    print("section, because the answer turns out to be that all 60 of them were right.")
    print()
    print("Fix w at the optimum and what is left is a sum of hinges in b alone: piecewise")
    print("linear, with a kink wherever a point crosses the margin, and on each piece a slope")
    print("that is a whole number. Flat means a slope of exactly zero, so it is testable.")
    print()
    print("  %-46s %14.6f" % ("lowest offset achieving the optimum", lo))
    print("  %-46s %14.6f" % ("highest offset achieving the optimum", hi))
    print("  %-46s %14.6f" % ("width of the interval", hi - lo))
    print("  %-46s %14.6f" % ("what sklearn returns", b))
    print("  %-46s %14.2e" % ("its distance from the midpoint", abs(b - 0.5 * (lo + hi))))
    print("  %-46s %14.2e" % ("objective at one end minus the other",
                              _obj(w, lo, X, y, C) - _obj(w, hi, X, y, C)))
    print()
    a = np.abs(m.dual_coef_[0])
    print("  %-46s %14d" % ("points resting exactly ON the margin", int((a < C - 1e-7).sum())))
    print("  %-46s %14d" % ("points pushed inside it", int((a >= C - 1e-7).sum())))
    print()
    print("  There is the mechanism. The offset is held in place by points resting on the")
    print("  margin, one pressing from each side. With nothing resting there, nothing objects")
    print("  to the boundary sliding, and every offset in the interval is an optimum.")
    print()
    print("How often, and does it matter? 40 datasets at 5 values of C, counting an interval")
    print("as real only above 1e-4 -- below that it is two copies of one number:")
    print()
    print("  %-6s %9s %10s %16s %16s"
          % ("C", "flat", "widest", "resting on it", "labels changed"))
    rows = []
    for seed in range(40):
        for Cv in (0.01, 0.1, 1.0, 10.0, 100.0):
            Xs, ys = _blob(seed)
            mm = SVC(kernel="linear", C=Cv, tol=1e-12).fit(Xs, ys)
            ww = mm.coef_[0]
            p, z = _b_star_interval(Xs, ys, ww)
            free = int((np.abs(mm.dual_coef_[0]) < Cv - 1e-7).sum())
            flips = int((np.sign(Xs @ ww + p) != np.sign(Xs @ ww + z)).sum())
            rows.append((Cv, z - p, free, flips))
    R = np.array(rows)
    wide = R[:, 1] > 1e-4
    for Cv in (0.01, 0.1, 1.0, 10.0, 100.0):
        s = R[R[:, 0] == Cv]
        fl = s[:, 1] > 1e-4
        print("  %-6g %4d/%-4d %10.4f %16.2f %16.2f"
              % (Cv, int(fl.sum()), len(s), s[:, 1].max(), s[:, 2].mean(),
                 s[fl][:, 3].mean() if fl.any() else 0.0))
    print()
    print("  %-54s %4d of %d" % ("fits whose optimal offset is a genuine interval",
                                 int(wide.sum()), len(R)))
    print("  %-54s %4d of %d" % ("of those, fits with nothing resting on the margin",
                                 int((wide & (R[:, 2] == 0)).sum()), int(wide.sum())))
    print("  %-54s %4d of %d" % ("fits with nothing resting on it that were NOT flat",
                                 int(((~wide) & (R[:, 2] == 0)).sum()),
                                 int((R[:, 2] == 0).sum())))
    print()
    print("  The correspondence holds in both directions across all 200 fits. And at C = 0.01")
    print("  it is not a rounding matter: the interval reaches 1.47 wide, and walking the")
    print("  offset from one end to the other relabels twelve training points on average")
    print("  without changing the objective in its last digit.")

    # The lab draws this bowl, which means a TypeScript copy of "minimise over b exactly, then
    # report the objective" -- so record what that should come out as on fixed data, at probe
    # directions spread over the whole plotted square, for svm_primallab_check.mjs to hold it
    # to. Notices go to stderr: this section prints onto a page.
    import json
    import pathlib
    rg = np.random.default_rng(11)
    cases = []
    for seed, Cv in ((2, 1.0), (5, 0.3), (9, 3.0)):
        Xc, yc = _blob(seed, 30)
        probes = []
        for _ in range(200):
            wv = rg.uniform(-2.5, 2.5, 2)
            lo2, hi2 = _b_star_interval(Xc, yc, wv)
            probes.append(dict(w=[round(float(v), 12) for v in wv],
                               bLo=round(lo2, 12), bHi=round(hi2, 12),
                               b=round(0.5 * (lo2 + hi2), 12),
                               hinge=round(_hinge_sum(wv, lo2, Xc, yc), 12),
                               J=round(_obj(wv, lo2, Xc, yc, Cv), 12)))
        mc = SVC(kernel="linear", C=Cv, tol=1e-12).fit(Xc, yc)
        cases.append(dict(seed=seed, C=Cv, X=Xc.round(12).tolist(), y=yc.tolist(),
                          probes=probes,
                          wStar=[round(float(v), 12) for v in mc.coef_[0]],
                          jStar=round(_obj(mc.coef_[0], float(mc.intercept_[0]), Xc, yc, Cv), 12)))
    outp = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_primal_case.json"
    outp.parent.mkdir(exist_ok=True)
    outp.write_text(json.dumps(cases), encoding="utf-8")
    print("  Wrote %d primal cases to %s for the port check." % (len(cases), outp.name),
          file=sys.stderr)


def shape():
    section("31. what the primal costs, and where that stops being affordable")
    print("The primal carries one unknown per feature, one for the offset, one per training")
    print("point, and two constraints per training point. Both n and d are in there, so")
    print("neither of them decides the size on its own.")
    print()
    print("  %-16s %8s %8s %13s %14s" % ("dataset", "n", "d", "unknowns", "constraints"))
    X, _ = _blob(1)
    sets = [("two blobs", X.shape[0], X.shape[1])]
    for nm, dat in (("breast_cancer", load_breast_cancer()), ("digits", load_digits())):
        sets.append((nm, dat.data.shape[0], dat.data.shape[1]))
    for nm, n, d in sets:
        print("  %-16s %8d %8d %13d %14d" % (nm, n, d, d + 1 + n, 2 * n))
    print()
    print("Comfortable, and it stays comfortable right until d stops being a property of the")
    print("data. Every kernel in this chapter is a promise about a feature space you never")
    print("build. Here is what building one would have cost on digits:")
    print()
    dat = load_digits()
    n = dat.data.shape[0]
    d0 = dat.data.shape[1]
    size = lambda k: ("%.1f GB" % (k * k * 8 / 1e9) if k * k * 8 >= 1e9
                      else "%.0f MB" % (k * k * 8 / 1e6))
    print("  %-28s %10s %12s %18s" % ("feature space", "d", "unknowns", "the P array alone"))
    print("  %-28s %10d %12d %18s"
          % ("the pixels themselves", d0, d0 + 1 + n, size(d0 + 1 + n)))
    big = None
    for deg in (2, 3):
        dd = PolynomialFeatures(degree=deg,
                                include_bias=False).fit(dat.data[:1]).n_output_features_
        k = dd + 1 + n
        big = k if deg == 3 else big
        print("  %-28s %10d %12d %18s" % ("degree-%d polynomial" % deg, dd, k, size(k)))
    print("  %-28s %10s %12s %18s" % ("RBF", "infinite", "--", "cannot be formed"))
    print()
    print("The dual form of the same problem, which the next two pages build, carries one")
    print("unknown per training point and nothing whatsoever per feature:")
    print()
    print("  %-46s %14d" % ("unknowns", n))
    print("  %-46s %14d" % ("equality constraints", 1))
    print("  %-46s %11.1f MB" % ("the matrix it needs, at any d", n * n * 8 / 1e6))
    print()
    print("  Smaller than the degree-3 primal by a factor of %d, and exactly that size for the"
          % round(float(big * big) / float(n * n)))
    print("  RBF, for a degree-9 polynomial, for anything at all. That ratio is the reason the")
    print("  next two pages exist. Nothing in this chapter improves the boundary -- pages 1 to")
    print("  7 already specified it completely. What changes is whether you can reach it.")

# ------------------------------------------------------------------ #
# PAGE 9 -- Lagrangian duality and the KKT conditions. The machine, not yet the SVM dual (that
# is page 10). Every constraint is given a PRICE; the prices turn a constrained problem into an
# unconstrained one, and at the optimum a price and its slack cannot both be nonzero. That last
# sentence is where support vectors come from, so it gets measured rather than stated.
# ------------------------------------------------------------------ #
# A two-variable problem small enough to print whole: minimise (1/2)(x^2 + y^2) subject to
# x + y >= 2 and x >= 0.5. One constraint binds at the optimum and the other does not, which is
# the whole of complementary slackness in four numbers.
TINY_G = np.array([[-1.0, -1.0], [-1.0, 0.0]])
TINY_H = np.array([-2.0, -0.5])


def _tiny_dual(lam):
    """min over u of (1/2)u.u + lam.(Gu - h). Strictly convex in u, so the min is at u = -G'lam."""
    u = -TINY_G.T @ lam
    return float(0.5 * u @ u + lam @ (TINY_G @ u - TINY_H)), u


def lagrangian():
    section("32. what a constraint is worth")
    print("Minimise (1/2)(x^2 + y^2) subject to x + y >= 2 and x >= 0.5. Two variables, two")
    print("constraints, and an answer you can check by eye: the closest point to the origin on")
    print("the line x + y = 2 is (1, 1), which also clears x >= 0.5 with room to spare.")
    print()
    rp = minimize(lambda u: 0.5 * u @ u, np.zeros(2), method="SLSQP",
                  constraints=[{"type": "ineq", "fun": lambda u: TINY_H - TINY_G @ u}],
                  options={"maxiter": 500, "ftol": 1e-14})
    print("  solved as a constrained problem:  x = %.6f, y = %.6f, objective %.10f"
          % (rp.x[0], rp.x[1], rp.fun))
    print()
    print("Now give each constraint a PRICE and charge for violating it instead of forbidding")
    print("it. The Lagrangian is the objective plus price times violation, and for any prices")
    print("you like it can be minimised with no constraints at all:")
    print()
    print("  L(x, y, lam) = (1/2)(x^2 + y^2) + lam1*(2 - x - y) + lam2*(0.5 - x)")
    print()
    print("Whatever the prices, the unconstrained minimum of L is a LOWER BOUND on the answer")
    print("above -- a feasible point pays the objective and a non-negative charge, so it can")
    print("never come in under L. Walking the first price up and leaving the second at zero:")
    print()
    print("  %-22s %14s %20s" % ("prices", "the bound", "where L bottoms out"))
    for lam in ([0, 0], [0.25, 0], [0.5, 0], [0.75, 0], [1, 0], [1.25, 0], [1.5, 0], [2, 0]):
        v, u = _tiny_dual(np.array(lam, float))
        print("  %-22s %14.6f %20s" % ("lam = (%g, %g)" % tuple(lam), v,
                                       "(%.3f, %.3f)" % (u[0], u[1])))
    print()
    print("  Every one of them is below %.4f, and the best of them touches it exactly." % rp.fun)
    print("  Prices that are too low do not squeeze hard enough; prices that are too high push")
    print("  the minimum out past the constraint and the bound falls away again.")
    print()
    rng = np.random.default_rng(0)
    vals = np.array([_tiny_dual(rng.exponential(1.0, 2))[0] for _ in range(20000)])
    r = minimize(lambda l: -_tiny_dual(l)[0], np.full(2, 0.5), method="L-BFGS-B",
                 bounds=[(0, None)] * 2)
    print("  %-46s %14d" % ("random price pairs tried", len(vals)))
    print("  %-46s %14d" % ("how many came in above the answer", int((vals > rp.fun).sum())))
    print("  %-46s %14.8f" % ("best bound any of them gave", vals.max()))
    print("  %-46s %14.10f" % ("best bound the optimiser found", -r.fun))
    print("  %-46s %14.2e" % ("its distance from the constrained answer", rp.fun + r.fun))
    print("  %-46s %14s" % ("the prices that achieve it",
                            "(%.6f, %.6f)" % (r.x[0], r.x[1])))
    print()
    print("Not one of 20000 random price pairs produced a bound above the answer, and the best")
    print("prices close the gap to nothing. Two things to take from the last row. The first")
    print("price is 1: raise the requirement from 2 to 2.001 and the answer goes up by about")
    print("0.001. The second is 0, and that constraint is the one with slack -- the optimum")
    print("sits at x = 1, well clear of x >= 0.5, so the requirement is worth nothing. Being")
    print("satisfied comfortably and being worth zero are the same statement.")


def kkt():
    section("33. the four conditions, checked on two solvers that never spoke")
    X, y = _blob(0)
    n, d = X.shape
    C = 1.0
    print("40 points, C = 1, solved twice over. sklearn solves a form of the problem written in")
    print("the prices and never builds a single slack variable. SLSQP is handed the primal")
    print("arrays from section 28 and never hears the word price. If the conditions below are")
    print("real, the two runs have to agree about things neither of them computed.")
    print()
    P, q, G, h = _qp(X, y, C)
    k = d + 1 + n
    u0 = np.zeros(k)
    u0[d + 1:] = 1.0
    r = _qp_solve(P, q, G, h, u0)
    wp, bp, xip = r.x[:d], float(r.x[d]), r.x[d + 1:]

    m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
    a = np.zeros(n)
    a[m.support_] = np.abs(m.dual_coef_[0])
    z = y * (X @ wp + bp)

    print("  STATIONARITY -- the prices rebuild the primal answer")
    print("    %-52s %12.3e" % ("|w from SLSQP  -  sum a_i y_i x_i|",
                                np.abs(wp - (a * y) @ X).max()))
    print("    %-52s %12.3e" % ("sum a_i y_i, which has to vanish", a @ y))
    print()
    print("  DUAL FEASIBILITY -- a price is never negative, and never above C")
    print("    %-52s %12.3e" % ("smallest price", a.min()))
    print("    %-52s %12.6f" % ("largest price (C = 1)", a.max()))
    print()
    print("  PRIMAL FEASIBILITY -- the answer satisfies what was asked")
    print("    %-52s %12.3e" % ("worst violation of y(w.x + b) >= 1 - xi",
                                max(0.0, float((1 - xip - z).max()))))
    print("    %-52s %12.3e" % ("most negative slack", xip.min()))
    print()
    print("  COMPLEMENTARY SLACKNESS -- price times slack, for every single point")
    print("    %-52s %12.3e" % ("worst |a_i * (y_i f_i - 1 + xi_i)|",
                                np.abs(a * (z - 1 + xip)).max()))
    print("    %-52s %12.3e" % ("worst |(C - a_i) * xi_i|", np.abs((C - a) * xip).max()))
    print()
    print("The last pair is the one that matters. It says a point can have a price or it can")
    print("have room, never both. That sorts every training point into exactly three kinds:")
    print()
    out = a < 1e-7
    free = (a > 1e-7) & (a < C - 1e-7)
    bound = a >= C - 1e-7
    print("  %-28s %7s %18s %16s" % ("", "points", "y f(x) range", "slack"))
    for nm, msk in (("price 0, room to spare", out), ("price between 0 and C", free),
                    ("price pinned at C", bound)):
        if not msk.any():
            print("  %-28s %7d %18s %16s" % (nm, 0, "--", "--"))
            continue
        print("  %-28s %7d %18s %16s"
              % (nm, int(msk.sum()), "%.4f to %.4f" % (z[msk].min(), z[msk].max()),
                 "%.4f to %.4f" % (max(0.0, xip[msk].min()), max(0.0, xip[msk].max()))))
    print()
    print("  %-46s %14.6f" % ("smallest price in the middle group", a[free].min() if free.any()
                              else float("nan")))
    print("  %-46s %14.6f" % ("largest price in the middle group", a[free].max() if free.any()
                              else float("nan")))
    print()
    print("The first group is %d of the %d points. Their price is zero, so by the stationarity"
          % (int(out.sum()), n))
    print("line above they contribute nothing to w -- they could be deleted and the sum would")
    print("be unchanged. That is the sparsity page 7 measured, arriving here as a consequence")
    print("rather than an observation. The other two groups are the support vectors, and the")
    print("difference between them is whether the point is resting on the margin or has been")
    print("pushed through it.")


def prices():
    section("34. is a price really a price?")
    X, y = _blob(0)
    n, d = X.shape
    C = 1.0
    P, q, G, h = _qp(X, y, C)
    k = d + 1 + n

    def solve(hv):
        u0 = np.zeros(k)
        u0[d + 1:] = 1.0
        return _qp_solve(P, q, G, hv, u0).fun

    m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
    a = np.zeros(n)
    a[m.support_] = np.abs(m.dual_coef_[0])
    base = solve(h)
    eps = 1e-3
    del base
    print("Calling a multiplier a price is a claim with a number in it: move one constraint by")
    print("a whisker and the optimum should shift by the price times the whisker, and by")
    print("nothing else. Nothing below was fitted to make that come out -- the prices come from")
    print("sklearn, and each movement is the primal re-solved from scratch, twice, once in each")
    print("direction.")
    print()
    print("  %-30s %11s %13s %13s %11s"
          % ("point", "its price", "predicted", "measured", "error"))
    out = np.where(a < 1e-7)[0]
    free = np.where((a > 1e-7) & (a < C - 1e-7))[0]
    bound = np.where(a >= C - 1e-7)[0]
    rows = ([("resting on the margin", i) for i in free[:3]]
            + [("pushed inside it", i) for i in bound[:2]]
            + [("outside, with room", i) for i in out[:3]])
    worst_rel = 0.0
    worst_abs = 0.0
    for nm, i in rows:
        # Central difference. A one-sided one is off by 1e-4 relative on the points resting on
        # the margin, and that is not noise: the optimum is piecewise QUADRATIC in h, so a
        # forward difference measures the curvature along with the slope. Taking both sides
        # cancels it and the same rows land at 1e-8. The points pinned at C never showed the
        # error, which is the tell -- their price is locally constant, so there is no curvature
        # at them to pick up.
        hp = h.copy()
        hp[i] += eps
        hm = h.copy()
        hm[i] -= eps
        got = 0.5 * (solve(hp) - solve(hm))
        pred = -a[i] * eps
        if a[i] > 1e-7:
            worst_rel = max(worst_rel, abs(got - pred) / abs(pred))
            err = "%.1e" % (abs(got - pred) / abs(pred))
        else:
            worst_abs = max(worst_abs, abs(got))
            err = "%.1e" % abs(got)
        print("  %-30s %11.6f %13.3e %13.3e %11s"
              % ("%s, #%d" % (nm, i), a[i], pred, got, err))
    print()
    print("  %-52s %10.1e" % ("worst relative error where the price was not zero", worst_rel))
    print("  %-52s %10.1e" % ("worst movement where the price was zero", worst_abs))
    print()
    print("The priced points move the answer by exactly what they are worth. The unpriced ones")
    print("do not move it at all -- and that is not a small number, it is the solver returning")
    print("the same optimum, because loosening a requirement that was never binding changes")
    print("nothing about the problem. The prices are the derivative of the answer with respect")
    print("to the question.")

# ------------------------------------------------------------------ #
# PAGE 10 -- the dual problem. Substitute page 9's stationarity conditions back into L and every
# primal variable cancels, leaving a problem in the prices alone. Three things to establish: it
# gives the same answer, it only ever touches the data through inner products, and each of its
# two constraints traces back to a specific feature of the primal.
# ------------------------------------------------------------------ #
def _dual_obj(a, K, y):
    """sum a - (1/2) a' (yy' * K) a, the function the dual maximises."""
    return float(a.sum() - 0.5 * a @ ((np.outer(y, y) * K) @ a))


def _dual_solve(K, y, C, cap=True, equality=True, iters=4000):
    """Maximise the dual. `cap` puts the box at C; `equality` imposes sum a_i y_i = 0.

    Both switches exist because section 37 removes them one at a time to show what each is for.
    """
    n = len(y)
    Q = np.outer(y, y) * K
    cons = ([{"type": "eq", "fun": lambda a: a @ y, "jac": lambda a: y}] if equality else [])
    return minimize(lambda a: -(a.sum() - 0.5 * a @ Q @ a),
                    np.full(n, min(0.05, (C if cap else 1.0) / 20)),
                    jac=lambda a: -(np.ones(n) - Q @ a), method="SLSQP",
                    bounds=[(0.0, C if cap else None)] * n, constraints=cons,
                    options={"maxiter": iters, "ftol": 1e-16})


def _b_from_alpha(a, X, y, w, C):
    """Recover the offset by averaging over the points resting ON the margin.

    Only the free multipliers say anything about b -- a price stuck at C means the point was
    pushed inside, and it fixes nothing about where the boundary sits along its own normal.
    Which is page 8's flat interval, arriving from the dual side.
    """
    free = (a > 1e-9) & (a < C - 1e-9)
    if not free.any():
        return float("nan"), 0
    return float(np.mean(y[free] - X[free] @ w)), int(free.sum())


def dual():
    section("35. the same problem, written in the prices")
    X, y = _blob(0)
    n, d = X.shape
    C = 1.0
    K = X @ X.T
    print("Page 9 ended with four conditions. Two of them say what w and the slack must be at the")
    print("optimum, so they can be substituted straight back into the Lagrangian -- and when they")
    print("are, every w, every b and every xi cancels. What survives is a problem in nothing but")
    print("the prices:")
    print()
    print("  maximise   sum_i a_i  -  (1/2) sum_i sum_j a_i a_j y_i y_j (x_i . x_j)")
    print("  subject to sum_i a_i y_i = 0   and   0 <= a_i <= C")
    print()
    print("%d unknowns instead of %d, one equality, and a box. Solved from scratch, with no help"
          % (n, d + 1 + n))
    print("from the primal and no help from sklearn:")
    print()
    r = _dual_solve(K, y, C)
    a = r.x
    w = (a * y) @ X
    b, nfree = _b_from_alpha(a, X, y, w, C)
    m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
    a_sk = np.zeros(n)
    a_sk[m.support_] = np.abs(m.dual_coef_[0])
    print("  %-46s %16d" % ("iterations it needed", r.nit))
    print("  %-46s %16.3e" % ("largest disagreement with sklearn's prices",
                              np.abs(a - a_sk).max()))
    print("  %-46s %16.3e" % ("largest disagreement in w", np.abs(w - m.coef_[0]).max()))
    print("  %-46s %16.3e" % ("angle between the two boundaries, degrees",
                              _ang(w, m.coef_[0])))
    print("  %-46s %16d" % ("points resting on the margin, used for b", nfree))
    print("  %-46s %16.3e" % ("disagreement in the offset", abs(b - float(m.intercept_[0]))))
    print()
    print("So the dual is not an approximation or a relaxation. It is the same answer, reached")
    print("by solving a different problem. Page 9 promised the two optima coincide; here is that")
    print("promise taken apart:")
    print()
    Q = np.outer(y, y) * K
    p_sk = _obj(m.coef_[0], float(m.intercept_[0]), X, y, C)
    p_du = _obj(w, b, X, y, C)
    d_du = _dual_obj(a, K, y)
    print("  %-50s %16.12f" % ("primal objective, at the w and b the dual gives", p_du))
    print("  %-50s %16.12f" % ("dual objective, at the same prices", d_du))
    print("  %-50s %16.3e" % ("gap", p_du - d_du))
    print()
    print("  %-50s %16.12f" % ("primal objective, at sklearn's answer instead", p_sk))
    print("  %-50s %16.3e" % ("gap against the same dual value", p_sk - d_du))
    print()
    print("  %-50s %16.12f" % ("(1/2)|w|^2, computed from the primal side", 0.5 * w @ w))
    print("  %-50s %16.12f" % ("(1/2) a'Qa, computed from the dual side", 0.5 * a @ Q @ a))
    print("  %-50s %16.3e" % ("difference", abs(0.5 * w @ w - 0.5 * a @ Q @ a)))
    print()
    print("  The quadratic halves agree to the last bit a double will hold, which says the two")
    print("  expressions are the same expression. The gap between the full objectives is only")
    print("  what each solver has left to converge: measured against its OWN primal value it is")
    print("  2e-08, and against sklearn's it is seven times larger, because that mixes two runs")
    print("  which stopped in slightly different places. There is no gap in the theory to find")
    print("  here -- page 9 swept 20000 price pairs looking for one.")

    # The lab solves this same dual in the browser with SMO, which is a different algorithm
    # reaching the same prices -- a claim worth recording rather than trusting. Notices go to
    # stderr; this section prints onto a page.
    import json
    import pathlib
    cases = []
    for seed, Cv in ((0, 1.0), (0, 0.2), (2, 1.0), (5, 3.0), (7, 0.5)):
        Xc, yc = _blob(seed, 30)
        mc = SVC(kernel="linear", C=Cv, tol=1e-12).fit(Xc, yc)
        ac = np.zeros(len(yc))
        ac[mc.support_] = np.abs(mc.dual_coef_[0])
        wc = (ac * yc) @ Xc
        bc, nfree = _b_from_alpha(ac, Xc, yc, wc, Cv)
        cases.append(dict(seed=seed, C=Cv, X=Xc.round(12).tolist(), y=yc.tolist(),
                          alpha=[round(float(v), 12) for v in ac],
                          w=[round(float(v), 12) for v in wc],
                          b=round(float(mc.intercept_[0]), 12),
                          bFromFree=(None if nfree == 0 else round(bc, 12)),
                          nFree=nfree,
                          objective=round(_dual_obj(ac, Xc @ Xc.T, yc), 12)))
    outp = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_dual_case.json"
    outp.parent.mkdir(exist_ok=True)
    outp.write_text(json.dumps(cases), encoding="utf-8")
    print("  Wrote %d dual cases to %s for the port check." % (len(cases), outp.name),
          file=sys.stderr)


def gram():
    section("36. the dual cannot see your data")
    X, y = _blob(0)
    n, d = X.shape
    C = 1.0
    K = X @ X.T
    a = _dual_solve(K, y, C).x
    w = (a * y) @ X
    print("Look at what the dual actually reads off the training set. Not a coordinate anywhere:")
    print("the data enters once, as x_i . x_j, and after that the problem is numbers in a table.")
    print("Anything that leaves every inner product alone is therefore invisible to it.")
    print()
    rng = np.random.default_rng(3)
    Qr, _ = np.linalg.qr(rng.normal(size=(2, 2)))
    Xr = X @ Qr.T
    ar = _dual_solve(Xr @ Xr.T, y, C).x
    wr = (ar * y) @ Xr
    print("  ROTATE the whole cloud by an arbitrary orthogonal matrix")
    print("    %-48s %14.3e" % ("largest change in any inner product",
                                np.abs(K - Xr @ Xr.T).max()))
    print("    %-48s %14.3e" % ("largest change in any price", np.abs(a - ar).max()))
    print("    %-48s %14.3e" % ("w, against the old w rotated the same way",
                                np.abs(wr - w @ Qr.T).max()))
    print()
    pad = 998
    Xp = np.hstack([X, np.zeros((n, pad))])
    ap = _dual_solve(Xp @ Xp.T, y, C).x
    print("  PAD every point with %d zero features" % pad)
    print("    %-48s %14.3e" % ("largest change in any inner product",
                                np.abs(K - Xp @ Xp.T).max()))
    print("    %-48s %14.3e" % ("largest change in any price", np.abs(a - ap).max()))
    print("    %-48s %8d -> %d" % ("unknowns in the primal", d + 1 + n, Xp.shape[1] + 1 + n))
    print("    %-48s %8d -> %d" % ("unknowns in the dual", n, n))
    print()
    print("  Not approximately unchanged. The prices are bit for bit the numbers they were,")
    print("  because the table the dual reads is bit for bit the table it read before. The")
    print("  primal grew by a factor of %d for the same answer." % ((Xp.shape[1] + 1 + n)
                                                                   // (d + 1 + n)))
    print()
    print("And prediction needs no coordinates either. f(x) = sum_i a_i y_i (x_i . x) + b is")
    print("inner products the whole way down, so a fresh point can be scored by a model that")
    print("never stored a single feature value:")
    print()
    Xt, _ = _blob(21, 400)
    b, _nf = _b_from_alpha(a, X, y, w, C)
    m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
    f_gram = (Xt @ X.T) @ (a * y) + b
    f_coord = Xt @ w + b
    print("  %-52s %12.3e" % ("scored from inner products vs scored from w",
                              np.abs(f_gram - f_coord).max()))
    print("  %-52s %12.3e" % ("against sklearn's own decision function",
                              np.abs(f_gram - m.decision_function(Xt)).max()))
    print("  %-52s %12s" % ("same predicted label on every one of %d points" % len(Xt),
                            str(bool((np.sign(f_gram) == m.predict(Xt)).all()))))
    print()
    print("That is the whole opening for the kernel. Nothing in the dual, and nothing in the")
    print("prediction rule, ever asks where a point IS -- only how it relates to other points.")


def pieces():
    section("37. what each constraint in the dual is doing there")
    X, y = _blob(0)
    n, d = X.shape
    C = 1.0
    K = X @ X.T
    print("The dual has exactly two constraints, and neither was chosen. Each one is the shadow")
    print("of something in the primal, and the way to see that is to take it away.")
    print()
    print("  THE BOX 0 <= a_i <= C. The ceiling is what the slack variables bought: a point can")
    print("  only pull so hard before it is cheaper to let it be wrong. Remove the ceiling and")
    print("  you should be back at a hard margin -- which on separable data is a real answer:")
    print()
    wt, rng = _truth_for(4)
    Xs, ys = _draw(rng, wt, 60, 0.6)
    ru = _dual_solve(Xs @ Xs.T, ys, 1.0, cap=False, iters=6000)
    wu = (ru.x * ys) @ Xs
    mh = SVC(kernel="linear", C=1e6, tol=1e-12).fit(Xs, ys)
    print("    %-50s %14.4f" % ("largest price, with no ceiling at all", ru.x.max()))
    print("    %-50s %14.3e" % ("angle against a hard-margin fit, degrees",
                                _ang(wu, mh.coef_[0])))
    print("    %-50s %14.6f" % ("|w| from the uncapped dual", float(np.linalg.norm(wu))))
    print("    %-50s %14.6f" % ("|w| from the hard-margin fit",
                                float(np.linalg.norm(mh.coef_[0]))))
    print()
    print("  and on data where the classes overlap, it is not an answer at all. Raising the")
    print("  ceiling on the 40 points from section 35, where no separating line exists:")
    print()
    print("    %-12s %16s %16s %14s" % ("ceiling", "largest price", "objective", "stuck at it"))
    for cap in (1.0, 10.0, 100.0, 1000.0):
        rr = _dual_solve(K, y, cap)
        print("    %-12g %16.4f %16.4f %14d"
              % (cap, rr.x.max(), -rr.fun, int((rr.x >= cap - 1e-6).sum())))
    print()
    print("    The prices go wherever the ceiling goes and the objective climbs with them. There")
    print("    is no answer to converge to -- page 5 measured the same thing from the primal")
    print("    side, where 0 of 100 draws admitted a hard-margin solution.")
    print()
    print("  THE EQUALITY sum_i a_i y_i = 0. This one is the offset. b appears in the Lagrangian")
    print("  linearly and nothing penalises it, so unless its coefficient is exactly zero the")
    print("  minimisation runs away -- and that coefficient is sum_i a_i y_i. Take the equality")
    print("  out and the dual stops describing a model with an offset:")
    print()
    rn = _dual_solve(K, y, C, equality=False)
    wn = (rn.x * y) @ X
    P2, q2, G2, h2 = _qp(X, y, C)
    k = P2.shape[0]
    Gb = np.vstack([G2, np.zeros((2, k))])
    Gb[-2, d] = 1.0
    Gb[-1, d] = -1.0
    hb = np.concatenate([h2, [0.0, 0.0]])
    u0 = np.zeros(k)
    u0[d + 1:] = 1.0
    rb = _qp_solve(P2, q2, Gb, hb, u0)
    print("    %-50s %16.9f" % ("dual with the equality removed", -rn.fun))
    print("    %-50s %16.9f" % ("primal with b nailed to zero", rb.fun))
    print("    %-50s %16.3e" % ("difference", abs(-rn.fun - rb.fun)))
    print("    %-50s %16.3e" % ("and their two w vectors differ by",
                                np.abs(wn - rb.x[:d]).max()))
    print()
    print("    Exactly the same problem, to twelve figures. The equality constraint is not a")
    print("    technical condition on the prices -- it is the intercept, written in the only")
    print("    language the dual has.")

# ------------------------------------------------------------------ #
# PAGE 11 -- support vectors, exactly. Page 7 already showed that the non-support-vectors can be
# deleted; it got there from the loss side, where the only visible distinction is "pulls" vs
# "does not pull". The dual has a finer instrument: a price, which splits the data three ways
# rather than two. These sections use that split to do what the loss side cannot -- say which
# points can be moved and which cannot, recover b, and bound the leave-one-out error.
# ------------------------------------------------------------------ #
def _groups(a, C):
    """0 = not a support vector, 1 = resting ON the margin, 2 = pinned at the cap."""
    g = np.zeros(len(a), dtype=int)
    g[a > 1e-9] = 1
    g[a > C - 1e-9] = 2
    return g


def _sk(X, y, C=1.0):
    """sklearn's fit, with the multipliers pulled out and spread back over all n points."""
    m = SVC(kernel="linear", C=C, tol=1e-12).fit(X, y)
    a = np.zeros(len(y))
    a[m.support_] = np.abs(m.dual_coef_[0])
    return a, m.coef_[0], float(m.intercept_[0])


def _b_interval(X, y, w):
    """The exact interval of offsets that minimise the hinge sum, given w.

    Same routine page 8 used to find the flat stretch: the hinge is piecewise linear in b with
    kinks at y_i - w.x_i, and the slope is an INTEGER, so "slope == 0" is exact rather than a
    tolerance.
    """
    f = X @ w
    kinks = np.unique(y - f)
    edges = np.concatenate([[kinks[0] - 1.0], kinks, [kinks[-1] + 1.0]])
    lo = hi = None
    for j in range(len(edges) - 1):
        mid = 0.5 * (edges[j] + edges[j + 1])
        if -np.sum(y[(y * (f + mid)) < 1.0]) == 0:
            lo = edges[j] if lo is None else lo
            hi = edges[j + 1]
    return lo, hi


def svset():
    section("38. which points, exactly")
    X, y = _blob(0)
    n = len(y)
    C = 1.0
    a, w, b = _sk(X, y, C)
    g = _groups(a, C)
    z = y * (X @ w + b)
    print("A support vector is a point with a price above zero. That is the whole definition, and")
    print("it is a fact about the SOLUTION, not about where a point sits when you look at the")
    print("picture. Page 9 sorted these 40 points by their price; the sort has three bins, not")
    print("two, and the rest of this page turns on the difference between the last two.")
    print()
    print("  %-34s %5s   %-24s" % ("", "count", "functional margin y f(x)"))
    for k, nm in ((0, "price 0 -- not a support vector"),
                  (1, "0 < price < C -- on the margin"),
                  (2, "price = C -- pushed inside")):
        print("  %-34s %5d   %.4f to %.4f"
              % (nm, (g == k).sum(), z[g == k].min(), z[g == k].max()))
    print()
    print("Now the claim that matters. Delete one training point, refit from scratch, and measure")
    print("how far the boundary turned. All 40, one at a time:")
    print()
    print("  %-34s %5s %12s %12s %14s"
          % ("point deleted", "count", "mean turn", "worst turn", "never turned"))
    for k, nm in ((0, "not a support vector"), (1, "on the margin"), (2, "pinned at the cap")):
        rows = []
        for i in np.where(g == k)[0]:
            keep = np.arange(n) != i
            _, wi, bi = _sk(X[keep], y[keep], C)
            rows.append((_ang(w, wi), abs(bi - b)))
        r = np.array(rows)
        still = int((r[:, 0] < 1e-5).sum())
        print("  %-34s %5d %8.4f deg %8.4f deg %8d of %d"
              % (nm, len(r), r[:, 0].mean(), r[:, 0].max(), still, len(r)))
    print()
    print("Twenty-four points can be deleted and the boundary does not move -- not approximately,")
    print("not on average, but to every digit, on every single one of them.")
    print()
    print("The last column is the half of it that gets overstated. Every one of the sixteen does")
    print("change the model -- the smallest offset shift among them is 0.040. But ten of the")
    print("sixteen do not TURN it at all: the direction comes back bit-identical and the boundary")
    print("only slides along its own normal. That includes one of the three sitting on the")
    print("margin, whose removal moves b by 0.090 and rotates nothing. What those points were")
    print("holding, others were holding too. A support vector is a point the solution priced --")
    print("not, on its own, a point the answer depends on. Taken in bulk:")
    print()
    subsets = [("all 40 points", np.ones(n, bool)),
               ("only the 16 support vectors", g > 0),
               ("only the 24 others", g == 0),
               ("all but the 3 on the margin", g != 1),
               ("all but the 13 pinned at C", g != 2)]
    print("  %-30s %5s %11s %10s %9s %10s"
          % ("trained on", "n", "turn (deg)", "|db|", "corridor", "same calls"))
    for nm, mask in subsets:
        _, wi, bi = _sk(X[mask], y[mask], C)
        same = bool(np.array_equal(np.sign(X @ wi + bi), np.sign(X @ w + b)))
        print("  %-30s %5d %11.3e %10.3e %9.4f %10s"
              % (nm, mask.sum(), _ang(w, wi), abs(bi - b), 1.0 / np.linalg.norm(wi), same))
    print()
    print("Sixteen points reproduce the boundary exactly -- the turn is a literal zero and the")
    print("offset agrees to fourteen decimals. Twenty-four of them reproduce nothing in")
    print("particular, and note they still label all 40 points the same way, so a boundary can be")
    print("several degrees wrong and look fine on the training set.")
    print()
    print("Read the corridor column on the last two rows. Dropping the three on the margin turns")
    print("the answer nearly six degrees. Dropping the thirteen pinned at C turns it by nothing")
    print("at all -- and widens the corridor from 0.4948 to 0.5475, which is the whole story of")
    print("this page in one number and is worth pulling on.")
    print()
    print("The tempting next thought is that only the three on the margin really count, since")
    print("they are the ones the geometry touches. That is worth testing rather than believing.")
    print("Refit on the free support vectors alone, with the cap lifted so the subproblem is not")
    print("forced to buy slack it does not need, over 12 samples and 3 values of C:")
    print()
    print("  %-10s %5s %5s %5s %12s %12s %10s"
          % ("sample", "C", "free", "bound", "|w| in full", "|w| on free", "turn"))
    wider = same_ = narrower = 0
    shown = 0
    for seed in range(12):
        for Cv in (0.5, 1.0, 3.0):
            Xs, ys = _blob(seed)
            asv, ws, bs = _sk(Xs, ys, Cv)
            gs = _groups(asv, Cv)
            f = gs == 1
            if f.sum() < 2 or len(set(ys[f])) < 2:
                continue
            _, w2, b2 = _sk(Xs[f], ys[f], 1e6)
            n1 = np.linalg.norm(ws)
            n2 = np.linalg.norm(w2)
            if n2 < n1 - 1e-6:
                wider += 1
                tag = "wider"
            elif n2 > n1 + 1e-6:
                narrower += 1
                tag = "NARROWER"
            else:
                same_ += 1
                tag = "identical"
            if shown < 6:
                print("  seed %-5d %5g %5d %5d %12.6f %12.6f %8.3f deg  %s"
                      % (seed, Cv, f.sum(), (gs == 2).sum(), n1, n2, _ang(ws, w2), tag))
                shown += 1
    print("  ... %d fits in all" % (wider + same_ + narrower))
    print()
    print("  %-46s %6d" % ("the free ones alone gave back the same model", same_))
    print("  %-46s %6d" % ("they gave a WIDER corridor instead", wider))
    print("  %-46s %6d" % ("they gave a narrower one", narrower))
    print()
    print("Never narrower, and that direction is the explanation. The full answer is always a")
    print("legal answer for the smaller problem -- those points sit at functional margin 1 in it")
    print("too -- so the smaller problem can only do as well or better, and better means wider.")
    print("What it does when it goes wider is drop the points that were pressing in from inside.")
    print("The ones pinned at C are not spectators paying a fine. They are holding the corridor")
    print("shut, and taking them away lets it open.")

    # SupportSetLab makes three claims a pretty picture would make equally well if the solver
    # were wrong: that its three groups are sklearn's three groups, that dropping every
    # unpriced point leaves the boundary alone, and that dropping a priced one does not.
    # Record the answers so scripts/svm_supportset_check.mjs can hold the port to them.
    import json
    import pathlib
    cases = []
    for seed, Cv in ((0, 1.0), (1, 1.0), (2, 0.5), (3, 2.0), (6, 1.0)):
        Xc, yc = _blob(seed, 26)
        ac, wc, bc = _sk(Xc, yc, Cv)
        gc = _groups(ac, Cv)
        keep = gc > 0
        _, wk, bk = _sk(Xc[keep], yc[keep], Cv)
        drops = []
        for i in np.where(gc > 0)[0]:
            m = np.arange(len(yc)) != i
            _, wi, bi = _sk(Xc[m], yc[m], Cv)
            drops.append(dict(i=int(i), w=[round(float(v), 12) for v in wi],
                              b=round(bi, 12), turn=round(_ang(wc, wi), 12)))
        cases.append(dict(seed=seed, C=Cv, X=Xc.round(12).tolist(), y=yc.tolist(),
                          alpha=[round(float(v), 12) for v in ac],
                          group=[int(v) for v in gc],
                          w=[round(float(v), 12) for v in wc], b=round(bc, 12),
                          keptW=[round(float(v), 12) for v in wk], keptB=round(bk, 12),
                          drops=drops))
    outp = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_supportset_case.json"
    outp.parent.mkdir(exist_ok=True)
    outp.write_text(json.dumps(cases), encoding="utf-8")
    print("  Wrote %d support-set cases to %s for the port check." % (len(cases), outp.name),
          file=sys.stderr)


def becoming():
    section("39. the moment a point starts to matter")
    X, y = _blob(0)
    C = 1.0
    a, w, b = _sk(X, y, C)
    g = _groups(a, C)
    z = y * (X @ w + b)
    far = int(np.argmax(np.where(g == 0, z, -np.inf)))
    u = w / np.linalg.norm(w)
    print("Deleting a point is a blunt instrument. A finer one: take the single most comfortable")
    print("point in the set -- price 0, functional margin %.4f, as far from the trouble as any"
          % z[far])
    print("point gets -- and walk it slowly toward the boundary, refitting from scratch at every")
    print("step.")
    print()
    print("  %-10s %12s %10s %12s %12s %7s"
          % ("moved", "y f(x)", "its price", "turn", "|w|", "#sv"))
    for step in (0.0, 0.5, 1.0, 1.5, 1.66, 1.68, 1.70, 1.75, 2.0, 2.5, 3.0, 5.0, 8.0):
        X2 = X.copy()
        X2[far] = X[far] - y[far] * step * u
        a2, w2, b2 = _sk(X2, y, C)
        print("  %-10.2f %12.4f %10.4f %8.4f deg %12.6f %7d"
              % (step, y[far] * (X2[far] @ w2 + b2), a2[far], _ang(w, w2),
                 np.linalg.norm(w2), int((a2 > 1e-9).sum())))
    print()
    print("The price is exactly 0.0000 while the functional margin is above 1 and exactly C the")
    print("moment it drops below. Not approaching, not ramping -- a switch, thrown at the margin.")
    print("That is complementary slackness from page 9 seen in motion: a constraint can have a")
    print("price or it can have room, never both.")
    print()
    print("There is no in-between state to catch, either, and the reason is worth having. A point")
    print("strictly inside the corridor is carrying slack, and page 9's fourth condition forces")
    print("any point carrying slack to pay the full C. A point strictly outside has room, so it")
    print("pays nothing. Between 0 and C is therefore not a phase a point passes through on its")
    print("way in -- it is available only at functional margin exactly 1. Scanning the crossing")
    print("in thousandths:")
    print()
    free_hits = 0
    steps = 0
    for step in np.arange(1.50, 1.72, 0.001):
        X2 = X.copy()
        X2[far] = X[far] - y[far] * float(step) * u
        a2, _, _ = _sk(X2, y, C)
        steps += 1
        free_hits += int(1e-9 < a2[far] < C - 1e-9)
    print("  %-52s %12d" % ("positions tried across the crossing", steps))
    print("  %-52s %12d" % ("of them where the price was strictly between 0 and C", free_hits))
    print()
    print("None. Which reframes page 9's middle group: those three points are not points that")
    print("happened to end up near the margin. They are points the solution PUT on the margin,")
    print("exactly, because that is the only place a price is allowed to be interior. It is also")
    print("why there are so few of them, and why some fits have none at all.")
    print()
    print("Now the part that undercuts the obvious reading. Look at the turn column while the")
    print("point crosses. It acquires a price at step 1.70, and at step 2.00 the model is still")
    print("bit-identical -- same direction, same |w|, same offset -- with the point now well")
    print("inside the corridor it is supposedly supporting. Acquiring a price and mattering are")
    print("different events, and the first is not evidence of the second.")
    print()
    print("Past that, something odder still. The point goes on getting more wrong and the")
    print("direction stays frozen while the corridor widens. Its price cannot rise past C, and")
    print("moving a point already stuck at C along the boundary's own normal changes its")
    print("contribution C*y*x by a multiple of w itself -- which rescales the answer without")
    print("turning it. This is the outlier robustness of the hinge arriving from the dual side:")
    print("a point that is already paying the maximum has nothing further to say. Only when it")
    print("gets far enough to drag the whole corridor does the direction go, and by then it has")
    print("recruited %d other points into the support set."
          % (int((_sk(np.vstack([X[:far], (X[far] - y[far] * 8.0 * u)[None], X[far + 1:]]),
                      y, C)[0] > 1e-9).sum()) - 16))
    print()
    print("The other direction is the control. Slide the same point sideways instead -- parallel")
    print("to the boundary, which changes where it sits enormously and its functional margin not")
    print("at all:")
    print()
    print("  %-14s %12s %10s %12s" % ("slid sideways", "y f(x)", "its price", "turn"))
    p = np.array([-u[1], u[0]])
    for step in (0.0, 1.0, 2.0, 4.0, 8.0):
        X2 = X.copy()
        X2[far] = X[far] + step * p
        a2, w2, b2 = _sk(X2, y, C)
        print("  %-14.2f %12.4f %10.4f %8.4f deg"
              % (step, y[far] * (X2[far] @ w2 + b2), a2[far], _ang(w, w2)))
    print()
    print("Eight units of travel, wider than the entire cloud, and not one digit moves. Distance")
    print("from the boundary is the only thing about a point an SVM ever asks.")


def offset():
    section("40. the one number the prices do not contain")
    X, y = _blob(0)
    C = 1.0
    a, w, b = _sk(X, y, C)
    g = _groups(a, C)
    print("Page 10 got w straight out of the prices: w = sum a_i y_i x_i, no data needed beyond")
    print("what the sum already uses. The offset is not in there. b was eliminated on the way")
    print("into the dual -- it turned into the constraint sum a_i y_i = 0 -- so it has to be read")
    print("back off the training set afterwards.")
    print()
    print("The reading rule is one line: a point resting ON the margin has y(w.x + b) = 1 exactly,")
    print("so b = y - w.x for that point. Which points qualify? Take every point in turn, compute")
    print("b = y_i - w.x_i as if it qualified, and see:")
    print()
    print("  %-34s %5s %12s %12s %12s"
          % ("computed from", "count", "lowest", "highest", "spread"))
    for k, nm in ((0, "a point with price 0"), (1, "a point on the margin"),
                  (2, "a point pinned at C")):
        idx = np.where(g == k)[0]
        bs = y[idx] - X[idx] @ w
        print("  %-34s %5d %12.6f %12.6f %12.3e"
              % (nm, len(idx), bs.min(), bs.max(), bs.max() - bs.min()))
    print()
    free = np.where(g == 1)[0]
    bs = y[free] - X[free] @ w
    print("  %-52s %12.6f" % ("sklearn's own intercept", b))
    print("  %-52s %12.3e" % ("worst error from ONE point on the margin alone",
                              np.abs(bs - b).max()))
    print("  %-52s %12.3e" % ("error from averaging the three of them",
                              abs(bs.mean() - b)))
    print()
    print("Three points agree to seven figures. The thirteen pinned at C spread over a range of")
    print("%.2f and the twenty-four with no price spread over %.2f, and both are useless -- a"
          % (float(np.ptp(y[g == 2] - X[g == 2] @ w)), float(np.ptp(y[g == 0] - X[g == 0] @ w))))
    print("point that is not resting on the margin has no equation to give you. Averaging the")
    print("free ones is what libsvm does, and it is for conditioning, not correctness: any one of")
    print("them would have done.")
    print()
    print("Which raises page 8's loose end. That page found fits whose optimal offset was not a")
    print("number but an INTERVAL, and could not say why. Here is why: those are the fits where")
    print("nothing rests on the margin at all, so no point has an equation to give. Sweep 40")
    print("samples and 7 values of C and collect every fit with an empty middle group:")
    print()
    print("  %-10s %5s %6s %6s %12s %12s %10s"
          % ("sample", "C", "free", "bound", "b", "interval", "position"))
    pos = []
    shown = 0
    for seed in range(40):
        for Cv in (0.02, 0.05, 0.1, 0.3, 0.5, 1.0, 3.0):
            Xs, ys = _blob(seed)
            asv, ws, bsk = _sk(Xs, ys, Cv)
            gs = _groups(asv, Cv)
            if (gs == 1).any() or not (gs == 2).any():
                continue
            lo, hi = _b_interval(Xs, ys, ws)
            if lo is None or hi - lo < 1e-9:
                continue
            p = (bsk - lo) / (hi - lo)
            pos.append(p)
            if shown < 6:
                print("  seed %-5d %5g %6d %6d %12.6f %12.6f %10.4f"
                      % (seed, Cv, 0, (gs == 2).sum(), bsk, hi - lo, p))
                shown += 1
    pos = np.array(pos)
    print("  ... %d such fits in all" % len(pos))
    print()
    print("  %-52s %12d" % ("fits with nothing resting on the margin", len(pos)))
    print("  %-52s %12.4f" % ("where b sits along the interval, median", float(np.median(pos))))
    print("  %-52s %12d" % ("of them within 0.001 of the exact middle",
                            int((np.abs(pos - 0.5) < 1e-3).sum())))
    print("  %-52s %12.4f" % ("the one furthest from the middle", float(pos[np.argmax(np.abs(pos - 0.5))])))
    print()
    print("So when the data does not determine b, the library splits the difference. That is a")
    print("reasonable choice and it is a CHOICE -- there is no fact of the matter inside that")
    print("interval, and a different implementation could hand you a different number and be")
    print("equally correct. Page 8 measured an interval 0.0169 wide; at C = 0.01 it reached 1.47,")
    print("which relabels training points. Worth knowing that the quantity exists.")


def loo():
    section("41. what the count is worth")
    print("One consequence of section 38 is sharper than it looks. Leave a point out and refit:")
    print("if that point was not a support vector, the model that comes back is the SAME model.")
    print("And a point with price 0 has functional margin at least 1, which means the model that")
    print("comes back classifies it correctly. So a non-support-vector can never produce a")
    print("leave-one-out error -- not usually, ever.")
    print()
    print("That is a claim with no tolerance in it, so it is worth running rather than quoting.")
    print("Twelve fits, every point left out in turn:")
    print()
    print("  %-10s %5s %5s %6s %8s %9s %9s"
          % ("sample", "C", "#sv", "#sv/n", "loo errs", "from a", "bound"))
    print("  %-10s %5s %5s %6s %8s %9s %9s"
          % ("", "", "", "", "", "non-sv", "holds"))
    ratios = []
    frm = 0
    fits = 0
    for seed in range(6):
        for C in (0.1, 1.0):
            X, y = _blob(seed, 60)
            n = len(y)
            a, w, b = _sk(X, y, C)
            nsv = int((a > 1e-9).sum())
            err = 0
            bad = 0
            for i in range(n):
                keep = np.arange(n) != i
                _, wi, bi = _sk(X[keep], y[keep], C)
                if y[i] * (X[i] @ wi + bi) <= 0:
                    err += 1
                    bad += int(a[i] <= 1e-9)
            frm += bad
            fits += n
            if err:
                ratios.append(nsv / err)
            print("  seed %-5d %5g %5d %6.3f %8d %9d %9s"
                  % (seed, C, nsv, nsv / n, err, bad, bool(err <= nsv)))
    r = np.array(ratios)
    print()
    print("  %-52s %12d" % ("models refitted, one point held out each time", fits))
    print("  %-52s %12d" % ("leave-one-out errors traced to a non-support-vector", frm))
    print()
    print("Zero, over %d refits. So the leave-one-out error COUNT is at most the number of" % fits)
    print("support vectors, and dividing by n gives a bound on the leave-one-out error rate that")
    print("you can read off a single fit without refitting anything. That is the theoretical")
    print("payoff of sparsity and it is genuinely free.")
    print()
    print("  %-52s %12.2f" % ("the bound overstates the error count by, at least", r.min()))
    print("  %-52s %12.2f" % ("at worst", r.max()))
    print("  %-52s %12.2f" % ("median", float(np.median(r))))
    print()
    print("Free, and loose. A bound that is %.1f times the quantity it bounds will not choose a" % np.median(r))
    print("model for you. It says something real -- an SVM with few support vectors cannot have a")
    print("bad leave-one-out error, whatever else is true of it -- and page 14 will want that")
    print("when the question is how many points a kernel model has to carry around.")
    print()
    print("Because the count is also the bill. A linear SVM collapses to one w, but a kernel one")
    print("cannot: scoring a single new point costs one kernel evaluation per support vector, so")
    print("the support set IS the model on disk and at prediction time.")
    print()
    Xb, yb0 = make_blobs(n_samples=4000, centers=2, n_features=8, cluster_std=6.0, random_state=0)
    Xb = (Xb - Xb.mean(0)) / Xb.std(0)
    yb = np.where(yb0 == 0, -1.0, 1.0)
    print("  %8s %8s %11s %26s"
          % ("C", "#sv", "% of data", "kernel evals for 10k calls"))
    for C in (0.003, 0.03, 0.3, 3.0, 30.0):
        m = SVC(kernel="rbf", C=C, gamma="scale").fit(Xb[:3000], yb[:3000])
        k = len(m.support_)
        print("  %8g %8d %10.1f%% %23.1f M" % (C, k, 100 * k / 3000, k * 10000 / 1e6))
    print()
    print("Same 3000 points, same kernel, and the model you have to keep ranges from 12% of the")
    print("training set to 96% of it. Page 7 said sparsity is a property of the fit rather than a")
    print("promise; this is the version of that sentence that shows up in a latency budget.")

def _rings(n, seed, noise=0.08):
    """Concentric circles. No line does better than a coin flip, which is the point."""
    X, y0 = make_circles(n_samples=n, noise=noise, factor=0.45, random_state=seed)
    return X, np.where(y0 == 0, -1.0, 1.0)


def _pair(X, Z=None):
    """Gram-style pieces: inner products and squared distances, both ways round."""
    Z = X if Z is None else Z
    G = Z @ X.T
    return G, np.maximum((Z ** 2).sum(1)[:, None] + (X ** 2).sum(1)[None, :] - 2 * G, 0.0)


def _b_any(K, y, a, C):
    """Offset from the free multipliers; the midpoint when there are none.

    Section 40 measured why the fallback is needed: with nothing resting on the margin the
    optimal offset is an interval, and libsvm takes its midpoint.
    """
    free = (a > 1e-9) & (a < C - 1e-9)
    if free.any():
        return float(np.mean(y[free] - K[free] @ (a * y))), int(free.sum())
    g = K @ (a * y)
    return float(-0.5 * (g[y > 0].min() + g[y < 0].max())), 0


def _poly_map(X, p, c=1.0):
    """Every monomial in the expansion of (c + x.z)^p, with its multinomial weight folded in.

    (c + sum_i x_i z_i)^p expands over all (k_0, ..., k_d) summing to p, with coefficient
    p!/(k_0!...k_d!) c^k_0 prod_i (x_i z_i)^k_i. Splitting that product between x and z gives
    a coordinate of phi: sqrt(coef * c^k_0) * prod_i x_i^k_i. So the map is explicit, finite,
    and writable -- which is exactly what makes it a fair comparison.
    """
    n, d = X.shape
    cols, names = [], []
    for ks in itertools.product(range(p + 1), repeat=d):
        if sum(ks) > p:
            continue
        k0 = p - sum(ks)
        coef = math.factorial(p)
        for k in (k0,) + ks:
            coef //= math.factorial(k)
        col = np.full(n, math.sqrt(coef * c ** k0))
        for j, k in enumerate(ks):
            col = col * X[:, j] ** k
        cols.append(col)
        names.append(ks)
    return np.column_stack(cols), names


# ------------------------------------------------------------------ #
# 42. The swap
# ------------------------------------------------------------------ #
def swap():
    section("42. one line different")
    print("Section 36 left the dual reading nothing but a table of inner products. So here is")
    print("the experiment that question invites: keep the solver, keep the box, keep the")
    print("equality constraint, keep the rule for the offset, keep the prediction formula --")
    print("and fill the table with a different function of each pair.")
    print()
    print("The data is two concentric rings. No straight line separates them, so if the rest of")
    print("the machinery survives the substitution, it will be obvious.")
    print()
    X, y = _rings(60, 0)
    Xt, yt = _rings(600, 7)
    C = 1.0
    G, D2 = _pair(X)
    Gt, D2t = _pair(X, Xt)
    cases = [("x . z", G, Gt, dict(kernel="linear")),
             ("(1 + x . z)^2", (1 + G) ** 2, (1 + Gt) ** 2,
              dict(kernel="poly", degree=2, gamma=1.0, coef0=1.0)),
             ("(1 + x . z)^3", (1 + G) ** 3, (1 + Gt) ** 3,
              dict(kernel="poly", degree=3, gamma=1.0, coef0=1.0)),
             ("exp(-|x - z|^2)", np.exp(-D2), np.exp(-D2t), dict(kernel="rbf", gamma=1.0))]
    print("  %-18s %8s %8s %6s %6s %13s" % ("K[i,j] =", "train", "test", "#sv", "free", "vs sklearn"))
    for name, K, Kt, kw in cases:
        a = _dual_solve(K, y, C).x
        b, nfree = _b_any(K, y, a, C)
        ftr, fte = K @ (a * y) + b, Kt @ (a * y) + b
        m = SVC(C=C, tol=1e-12, **kw).fit(X, y)
        print("  %-18s %8.4f %8.4f %6d %6d %13.3e"
              % (name, (np.sign(ftr) == y).mean(), (np.sign(fte) == yt).mean(),
                 int((a > 1e-9).sum()), nfree,
                 np.abs(fte - m.decision_function(Xt)).max()))
    print()
    print("Three of those four are perfect on 600 held-out points, and the solver was not told")
    print("it had changed problems. The last column is our prices scoring the test set against")
    print("sklearn's own decision function, so the curved fits are the same fits it makes.")
    print()
    print("The linear row is the odd one out twice over. It is at chance, and its check is")
    print("0.58 rather than 1e-7 -- because not one of its 60 multipliers is free. Nothing rests")
    print("on the margin, so the offset is an interval again (section 40), and two solvers are")
    print("entitled to pick different points in it. A model at chance has no margin to pin.")
    print()
    print("Now the part that is easy to miss. In the linear row the answer collapses into")
    print("w = sum a_i y_i x_i, two numbers, and the training points can be thrown away. In the")
    print("other three it cannot: the sum lives in whatever space the new function is an inner")
    print("product in, and we never built that space, so there is nowhere to add the vectors up.")
    print()
    for name, kw in (("linear", dict(kernel="linear")), ("rbf g=1", dict(kernel="rbf", gamma=1.0))):
        m = SVC(C=C, tol=1e-12, **kw).fit(X, y)
        k = int(m.n_support_.sum())
        has_w = kw["kernel"] == "linear"
        print("  %-10s  as w and b: %9s   as support vectors, prices and b: %4d numbers"
              % (name, ("%d numbers" % (X.shape[1] + 1)) if has_w else "no such w",
                 k * X.shape[1] + k + 1))
    print()
    print("That is the trade the rest of this page is about. You get a curved boundary for the")
    print("price of one edit, and you pay by carrying the points forever.")


# ------------------------------------------------------------------ #
# 43. The map is real
# ------------------------------------------------------------------ #
def lift():
    section("43. the space you did not build")
    print("Calling (1 + x.z)^p an inner product in some other space is a claim, and it is")
    print("checkable, because for this kernel the other space can be written down. Expand the")
    print("bracket: every term is a monomial in x times the same monomial in z, so define phi")
    print("to hold those monomials and the whole expansion becomes phi(x) . phi(z).")
    print()
    X, y = _blob(0)
    print("  %-6s %6s %14s %14s %16s"
          % ("degree", "D", "max |K|", "max |diff|", "relative"))
    for p in (2, 3, 4, 5, 6):
        P, _ = _poly_map(X, p)
        K_exp, K_ker = P @ P.T, (1.0 + X @ X.T) ** p
        mx, df = np.abs(K_ker).max(), np.abs(K_exp - K_ker).max()
        print("  %-6d %6d %14.4e %14.3e %16.3e" % (p, P.shape[1], mx, df, df / mx))
    print()
    print("Agreement at the last bit of a double, at every degree. The two columns are not")
    print("close, they are the same number computed twice -- once by building a D-dimensional")
    print("vector and dotting it, once by multiplying two numbers together p times.")
    print()
    print("And if the space is real, a plain linear SVM run inside it must return the same")
    print("model as the kernel. Same C, same solver, 400 fresh points scored both ways:")
    print()
    Xt, _ = _blob(21, 400)
    for p in (2, 3, 4):
        P, _ = _poly_map(X, p)
        Pt, _ = _poly_map(Xt, p)
        m_exp = SVC(kernel="linear", C=1.0, tol=1e-12).fit(P, y)
        m_ker = SVC(kernel="poly", degree=p, gamma=1.0, coef0=1.0, C=1.0, tol=1e-12).fit(X, y)
        f1, f2 = m_exp.decision_function(Pt), m_ker.decision_function(Xt)
        print("  degree %d: linear SVM on %3d explicit features vs kernel='poly'"
              "   max|f1-f2| %9.3e   #sv %d vs %d   same label %s"
              % (p, P.shape[1], np.abs(f1 - f2).max(), m_exp.n_support_.sum(),
                 m_ker.n_support_.sum(), bool((np.sign(f1) == np.sign(f2)).all())))
    print()
    print("Not similar models. The same model, reached twice, once through a space that was")
    print("built and once through a space that was not.")
    print()
    print("So why not build it? Because D is a binomial coefficient in the number of features,")
    print("and the kernel's cost is not:")
    print()
    print("  %8s %8s %22s %18s" % ("features", "degree", "D = C(d + p, p)", "kernel needs"))
    for d in (2, 10, 100, 1000):
        for p in (2, 5):
            print("  %8d %8d %22s %14d mults"
                  % (d, p, format(math.comb(d + p, p), ","), d))
    print()
    print("The right-hand column is flat because the kernel never touches D. It multiplies d")
    print("pairs of numbers, adds one, and raises the result to the fifth power -- at a thousand")
    print("features that is a thousand multiplications either way you set C, while the vector it")
    print("is standing in for has eight and a half trillion coordinates. The map has to exist")
    print("for the argument to work. It does not have to be built for the model to run.")


# ------------------------------------------------------------------ #
# 44. How big the space is, measured
# ------------------------------------------------------------------ #
def nospace():
    section("44. how big is the space, really")
    print("D = C(d+p, p) is what the construction happens to write. It is not obviously the")
    print("smallest space that would do, and the data may not use all of it. Both questions have")
    print("the same answer and it is readable off the Gram matrix: the rank of K is exactly the")
    print("dimension of the span of phi(x_1) ... phi(x_n), whatever phi is. Eigenvalues tell you")
    print("the size of a space nobody constructed.")
    print()
    n = 200
    X, y = _blob(0, n)
    G, D2 = _pair(X)
    ks = [("x . z", G, 2), ("(1 + x.z)^2", (1 + G) ** 2, math.comb(4, 2)),
          ("(1 + x.z)^3", (1 + G) ** 3, math.comb(5, 2)),
          ("(1 + x.z)^5", (1 + G) ** 5, math.comb(7, 2)),
          ("rbf gamma=0.5", np.exp(-0.5 * D2), 0),
          ("rbf gamma=2", np.exp(-2.0 * D2), 0)]
    print("  n = %d points in 2 features. r(eps) = how many eigenvalues you must keep for the" % n)
    print("  rebuilt matrix to be within eps of K in every single entry.")
    print()
    print("  %-14s %8s %8s %8s %8s %12s"
          % ("K[i,j] =", "1e-1", "1e-3", "1e-6", "1e-12", "C(d+p,p)"))
    for name, K, want in ks:
        ev, V = np.linalg.eigh(K)
        o = np.argsort(-ev)
        ev, V = ev[o], V[:, o]
        scale = np.abs(K).max()
        row = []
        for eps in (1e-1, 1e-3, 1e-6, 1e-12):
            r = n
            for rr in range(1, n + 1):
                if np.abs((V[:, :rr] * ev[:rr]) @ V[:, :rr].T - K).max() <= eps * scale:
                    r = rr
                    break
            row.append(r)
        print("  %-14s %8d %8d %8d %8d %12s"
              % (name, row[0], row[1], row[2], row[3], str(want) if want else "--"))
    print()
    print("The polynomial rows stop dead on the number the construction predicted and then do")
    print("not move: 6, 10 and 21 are C(4,2), C(5,2) and C(7,2). Nothing was wasted and nothing")
    print("was missing. The rbf rows never stop.")
    print()
    print("A ceiling would show up as a count that stops growing when you add points, so add")
    print("points. 'dimension used' below is the number of eigenvalues above float noise:")
    print()
    print("  %6s %10s %12s %12s %12s"
          % ("n", "x . z", "(1 + x.z)^3", "rbf g=0.5", "rbf g=2"))
    for m in (25, 50, 100, 200, 400, 800):
        Xm, _ = _blob(0, m)
        Gm, D2m = _pair(Xm)
        row = []
        for K in (Gm, (1 + Gm) ** 3, np.exp(-0.5 * D2m), np.exp(-2.0 * D2m)):
            ev = np.linalg.eigvalsh(K)[::-1]
            row.append(int((ev > 1e-11 * ev[0]).sum()))
        print("  %6d %10d %12d %12d %12d" % (m, row[0], row[1], row[2], row[3]))
    print()
    print("Two columns are constants and two are still climbing at 800. The rbf columns are")
    print("n exactly while n is small enough -- every point independent of every other, which is")
    print("what a space with no ceiling looks like from inside. They fall behind n later only")
    print("because eigenvalues shrink past what a double can hold, not because the kernel ran")
    print("out of dimensions. There is no finite D to print for the last two columns, and that")
    print("is not a gap in the measurement. It is the measurement.")


# ------------------------------------------------------------------ #
# 45. What you may substitute
# ------------------------------------------------------------------ #
def allowed():
    section("45. what you are allowed to put in the table")
    print("If any two-argument function worked, the trick would be a free lunch. Put one in and")
    print("see. Four functions below are inner products in some space; one is a distance, which")
    print("is not the same thing, and tanh(x.z + 1) is a function people genuinely do pass to")
    print("SVC as kernel='sigmoid'.")
    print()
    X, y = _blob(0)
    n = len(y)
    G, D2 = _pair(X)
    cands = [("x . z", G), ("(1 + x.z)^3", (1 + G) ** 3), ("rbf gamma=0.5", np.exp(-0.5 * D2)),
             ("tanh(x.z + 1)", np.tanh(G + 1.0)), ("|x - z|", np.sqrt(D2))]
    print("Every claim of the form 'K is an inner product table' has a consequence you can")
    print("check without solving anything: |phi(x) - phi(z)|^2 = k(x,x) - 2k(x,z) + k(z,z), and")
    print("a squared length is not allowed to be negative.")
    print()
    print("  %-16s %12s %14s %16s" % ("k(x,z) =", "min eig", "min |phi|^2", "pairs below 0"))
    for name, K in cands:
        dd = np.diag(K)[:, None] + np.diag(K)[None, :] - 2 * K
        off = dd[~np.eye(n, dtype=bool)]
        print("  %-16s %12.4f %14.4f %10d / %d"
              % (name, np.linalg.eigvalsh(K).min(), off.min(),
                 int((off < -1e-9).sum()), n * (n - 1)))
    print()
    print("The first three have no negative eigenvalue and no negative squared distance, to")
    print("float noise. The last two have both. There is no space in which tanh(x.z + 1) is an")
    print("inner product, because in that space 194 pairs of these 40 points would have to be a")
    print("negative distance apart. That is what a Gram matrix with a negative eigenvalue means,")
    print("and it is the whole content of the condition on kernels.")
    print()
    print("The damage shows up in the objective. With a genuine kernel the quadratic term is a")
    print("real squared length, so the dual is concave and its maximum is THE maximum. Without")
    print("one there are directions of negative curvature, and the only thing standing between")
    print("the objective and infinity is the box. So open the box:")
    print()
    Cs = (1.0, 100.0, 1e4, 1e6)
    print("  %-16s" % "k(x,z) =" + "".join("%14s" % ("C=%g" % c) for c in Cs) + "  per 100x C")
    for name, K in cands:
        row = [_dual_obj(_dual_solve(K, y, C).x, K, y) for C in Cs]
        print("  %-16s" % name + "".join("%14.4g" % v for v in row)
              + "  %9.1fx" % (row[-1] / row[-2]))
    print()
    print("Three behaviours in five rows. The polynomial and the rbf stop dead: 1027 and 2874,")
    print("unchanged to the last digit however wide the box gets, because in THEIR feature")
    print("spaces this data is separable -- the hinge sum reaches zero and what is left over is")
    print("the hard-margin answer, which does not care about C. The linear kernel never gets")
    print("there, since no line separates this data, so it keeps paying; but it pays in")
    print("proportion, a hundred times the objective for a hundred times the cap.")
    print()
    print("The bottom two multiply by ten thousand. Squaring the growth rate is the signature of")
    print("a quadratic form running downhill until it hits a wall, and no C is large enough to")
    print("level it off, because there is nothing down there to reach. Take the cap away and")
    print("these two problems have no solution -- not a hard one, none. On this data the box was")
    print("not tuning the fit. It was the only reason a number came back at all.")
    print()
    print("None of this raises an error:")
    print()
    for kn, kw in (("rbf", dict(kernel="rbf", gamma=0.5)),
                   ("sigmoid", dict(kernel="sigmoid", gamma=1.0, coef0=1.0))):
        m = SVC(C=1.0, **kw).fit(X, y)
        print("  SVC(kernel=%-9s) fits, returns %d support vectors, scores %.4f on its training"
              " data" % ("'" + kn + "'", m.n_support_.sum(), m.score(X, y)))
    print()
    print("It fits, it predicts, it looks like a model. What it is not is the maximum-margin")
    print("separator in any space, so every argument this track has made about it -- the margin,")
    print("the bound in section 41, duality itself -- is about a different object. The failure is")
    print("quiet, which is the reason to know the condition rather than trust the library.")


def _worlds(n=600, seed=0):
    """Three truths: a straight one, a ring inside a ring, two interlocking crescents."""
    Xb, yb = make_blobs(n_samples=n, centers=2, n_features=2, cluster_std=2.2, random_state=seed)
    Xc, yc = make_circles(n_samples=n, noise=0.09, factor=0.45, random_state=seed)
    Xm, ym = make_moons(n_samples=n, noise=0.22, random_state=seed)
    return [("straight", Xb, yb), ("rings", Xc, yc), ("moons", Xm, ym)]


def _linear_truth(n, d, seed, noise=1.0):
    """A boundary that really is a hyperplane, with only the first five features informative."""
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d))
    w = np.zeros(d)
    k = min(5, d)
    w[:k] = rng.normal(size=k)
    return X, (X @ w + noise * rng.normal(size=n) > 0).astype(int)


_KCV = StratifiedKFold(n_splits=5, shuffle=True, random_state=RS)


# ------------------------------------------------------------------ #
# 46. The menu
# ------------------------------------------------------------------ #
def menu():
    section("46. three kernels, three truths")
    print("Page 12 said a kernel is a claim about what 'similar' means. If that is more than a")
    print("phrase, then a kernel should win where its claim is true and lose where it is not.")
    print("Three worlds, each with a different kind of boundary, 5-fold CV on 600 points:")
    print()
    ks = [("linear", dict(kernel="linear")),
          ("poly d=2", dict(kernel="poly", degree=2, gamma="scale", coef0=1.0)),
          ("poly d=3", dict(kernel="poly", degree=3, gamma="scale", coef0=1.0)),
          ("rbf", dict(kernel="rbf", gamma="scale"))]
    print("  %-10s" % "world" + "".join("%11s" % k[0] for k in ks))
    rows = {}
    for name, X, y in _worlds():
        row = [cross_val_score(make_pipeline(StandardScaler(), SVC(C=1.0, **kw)), X, y,
                               cv=_KCV).mean() for _, kw in ks]
        rows[name] = row
        print("  %-10s" % name + "".join("%11.4f" % v for v in row))
    print()
    print("Half of that is what you would expect. A line is at chance on the rings (0.5367),")
    print("and a degree-3 boundary carries the moons where a line cannot. The other half is not.")
    print()
    print("  %-10s %12s %12s %14s" % ("world", "linear", "rbf", "rbf - linear"))
    for name in rows:
        lin, rbf = rows[name][0], rows[name][3]
        print("  %-10s %12.4f %12.4f %+14.4f" % (name, lin, rbf, rbf - lin))
    print()
    print("Look at the sizes rather than the signs. Guessing 'curved' when the truth is straight")
    print("costs %+.4f -- nothing. Guessing 'straight' when the truth is a ring costs %.4f."
          % (rows["straight"][3] - rows["straight"][0],
             rows["rings"][3] - rows["rings"][0]))
    print("The two mistakes are not the same size, and that asymmetry is most of why the rbf")
    print("kernel is the default everywhere. It is not that it is always right. It is that being")
    print("wrong in its direction is cheap on data like this.")
    print()
    print("Which is a claim about data like this. The rest of this page is the bill.")


# ------------------------------------------------------------------ #
# 47. What gamma is
# ------------------------------------------------------------------ #
def reach():
    section("47. gamma is a distance")
    print("exp(-gamma |x - z|^2) does not care about gamma in the abstract, only about gamma")
    print("times a squared distance. So gamma sets a LENGTH: the range over which two points")
    print("still count as similar. Solve exp(-gamma r^2) = 1/2 and that length is sqrt(ln2/gamma),")
    print("which is the honest unit to compare against the spread of your own data.")
    print()
    X, y = make_moons(n_samples=400, noise=0.22, random_state=RS)
    X = StandardScaler().fit_transform(X)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, random_state=RS, stratify=y)
    n = len(ytr)
    D2 = np.maximum((Xtr ** 2).sum(1)[:, None] + (Xtr ** 2).sum(1)[None, :] - 2 * Xtr @ Xtr.T, 0)
    off = ~np.eye(n, dtype=bool)
    print("  %8s %10s %11s %10s %7s %8s %8s"
          % ("gamma", "half-life", "neighbours", "mean k", "#sv", "train", "test"))
    print("  %8s %10s %11s %10s %7s %8s %8s"
          % ("", "distance", "with k>0.5", "off-diag", "", "", ""))
    for g in (0.01, 0.1, 0.5, 2.0, 10.0, 100.0, 1000.0):
        K = np.exp(-g * D2)
        m = SVC(kernel="rbf", gamma=g, C=1.0).fit(Xtr, ytr)
        print("  %8g %10.4f %11.2f %10.4f %7d %8.4f %8.4f"
              % (g, np.sqrt(np.log(2.0) / g), ((K > 0.5).sum(1) - 1).mean(), K[off].mean(),
                 m.n_support_.sum(), m.score(Xtr, ytr), m.score(Xte, yte)))
    print()
    far = float(np.sqrt(D2[off]).mean())
    near = float(np.sqrt(np.where(off, D2, np.inf).min(1)).mean())
    scale_hl = float(np.sqrt(np.log(2.0) / (1.0 / (2 * X.var()))))
    print("  %-46s %10.4f" % ("mean distance between two training points", far))
    print("  %-46s %10.4f" % ("mean distance to the NEAREST other point", near))
    print("  %-46s %10.4f" % ("half-life at gamma='scale'", scale_hl))
    print()
    print("Read the half-life column against those two numbers and the whole dial explains")
    print("itself. At gamma=0.01 the half-life is 8.33, %.1f times the mean distance across the"
          % (8.3255 / far))
    print("whole cloud: every point is similar to every point, the mean off-diagonal similarity")
    print("is 0.96, and the model underfits. At gamma=1000 the half-life is 0.026 against a")
    print("nearest-neighbour distance of %.4f -- %.2f of the way to the closest other point, so"
          % (near, 0.0263 / near))
    print("the average point has 0.05 neighbours, all 200 of them become support vectors,")
    print("training accuracy is 1.0000 and the test set falls to 0.6200. gamma='scale' sets the")
    print("half-life at %.2f, comfortably between the two." % scale_hl)
    print()
    import pathlib

    # Record sklearn's answers on the lab's own worlds, so the shipped TypeScript solver has
    # something outside itself to be checked against. See scripts/svm_choice_check.mjs.
    cases = []
    for kind, (Xw, yw) in (("straight", make_blobs(n_samples=60, centers=2, n_features=2,
                                                   cluster_std=1.4, random_state=7)),
                           ("rings", make_circles(n_samples=60, noise=0.08, factor=0.42,
                                                  random_state=7)),
                           ("moons", make_moons(n_samples=60, noise=0.16, random_state=7))):
        yy = np.where(yw == 0, -1.0, 1.0)
        Xw = np.round(Xw, 6)
        for g in (0.05, 0.2, 0.5, 1.0, 3.0, 10.0, 40.0, 200.0):
            m = SVC(kernel="rbf", gamma=g, C=1.0, tol=1e-10).fit(Xw, yy)
            cases.append(dict(world=kind, gamma=g,
                              X=Xw.tolist(), y=yy.tolist(),
                              nsv=int(m.n_support_.sum()),
                              train=float(m.score(Xw, yy)),
                              f=[float(v) for v in np.round(m.decision_function(Xw), 10)]))
    outp = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_choice_case.json"
    outp.parent.mkdir(exist_ok=True)
    outp.write_text(json.dumps(cases), encoding="utf-8")
    print("  [wrote results/svm_choice_case.json -- %d cases for svm_choice_check.mjs]"
          % len(cases), file=sys.stderr)
    print("That last column is worth sitting with. Nothing failed. The solver converged, the")
    print("margin was maximised, every KKT condition held, and the model memorised the training")
    print("set, because at that length scale the only point similar to a point is itself.")


# ------------------------------------------------------------------ #
# 48. The polynomial kernel's two traps
# ------------------------------------------------------------------ #
def coef0():
    section("48. the two ways the polynomial kernel bites")
    print("The polynomial kernel has a reputation for being fiddly. It is deserved, and it is")
    print("two specific things rather than a general mood.")
    print()
    X, y = make_moons(n_samples=400, noise=0.22, random_state=RS)
    Xs = StandardScaler().fit_transform(X)
    Xtr, Xte, ytr, yte = train_test_split(Xs, y, test_size=0.5, random_state=RS, stratify=y)
    print("FIRST: the constant is not decoration. sklearn's default is coef0=0.0, which makes")
    print("the kernel (gamma x.z)^p with nothing added. Same data, same degree, same everything")
    print("else -- only the constant differs:")
    print()
    print("  %8s %12s %12s %10s" % ("degree", "coef0=1", "coef0=0", "#sv"))
    for p in (2, 3, 4, 5, 8):
        r = []
        for c0 in (1.0, 0.0):
            m = SVC(kernel="poly", degree=p, gamma=1.0, coef0=c0, C=1.0,
                    max_iter=2000000).fit(Xtr, ytr)
            r.append((m.score(Xte, yte), int(m.n_support_.sum())))
        print("  %8d %12.4f %12.4f %10d" % (p, r[0][0], r[1][0], r[0][1]))
    print()
    print("The even degrees collapse to a coin flip and the odd ones do not. That is not noise,")
    print("it is a symmetry, and it is exact:")
    print()
    for p in (2, 3, 4, 5):
        K = (Xs @ Xs.T) ** p
        Kn = ((-Xs) @ Xs.T) ** p
        m = SVC(kernel="poly", degree=p, gamma=1.0, coef0=0.0, C=1.0).fit(Xs, y)
        f1, f2 = m.decision_function(Xs), m.decision_function(-Xs)
        print("  p=%d  max|k(x,z) - k(-x,z)| %10.3e    max|f(x) - f(-x)| %10.3e"
              "    x and -x labelled the same at %5.1f%% of points"
              % (p, np.abs(K - Kn).max(), np.abs(f1 - f2).max(),
                 100 * (np.sign(f1) == np.sign(f2)).mean()))
    print()
    print("With no constant the kernel is homogeneous, so (x.z)^p = (-x.z)^p whenever p is even")
    print("-- identically, to zero. Every such model must give x and its reflection through the")
    print("origin the same answer, and the table says it does, at 100.0% of points. Whether that")
    print("ruins you depends on your data:")
    print()
    T = [cKDTree(Xs[y == 0]), cKDTree(Xs[y == 1])]
    for cls in (0, 1):
        R = -Xs[y == cls]
        print("  %-52s %6.1f%%"
              % ("class %d points whose reflection sits nearer the other class" % cls,
                 100 * (T[1 - cls].query(R)[0] < T[cls].query(R)[0]).mean()))
    print()
    print("Nine points in ten. The moons are almost exactly antisymmetric, so a model forced to")
    print("agree with itself under reflection is forced to be wrong about half of them, and a")
    print("coin flip is the best it can do. Add the constant back and degree 8 still scores")
    print("0.9050.")
    print()
    print("SECOND: the kernel's own arithmetic is not scale-free. Raising a dot product to a")
    print("power magnifies whatever units you fed it:")
    print()
    print("  %8s %16s %16s %14s" % ("degree", "max K, scaled", "max K, x10 units", "ratio"))
    for p in (2, 3, 5, 8):
        a = float(((1 + Xs @ Xs.T) ** p).max())
        b = float(((1 + (10 * Xs) @ (10 * Xs).T) ** p).max())
        print("  %8d %16.3e %16.3e %14.3e" % (p, a, b, b / a))
    print()
    print("Ten times the units, and at degree 8 the numbers the solver is working with are")
    print("3.5e+15 times larger. That is not a rounding worry, it decides whether the fit")
    print("finishes at all. The same moons in 100x units, every solver capped at 2,000,000")
    print("iterations:")
    print()
    Xb = X * 100
    Btr, Bte, bytr, byte = train_test_split(Xb, y, test_size=0.5, random_state=RS, stratify=y)
    for p in (2, 3, 5):
        m = SVC(kernel="poly", degree=p, gamma=1.0, coef0=1.0, C=1.0,
                max_iter=2000000).fit(Btr, bytr)
        it = int(m.n_iter_.max())
        print("  %-14s test %.4f   iterations %9s   hit the cap: %s"
              % ("poly p=%d" % p, m.score(Bte, byte), format(it, ","), it >= 2000000))
    m = SVC(kernel="rbf", gamma=1.0, C=1.0, max_iter=2000000).fit(Btr, bytr)
    print("  %-14s test %.4f   iterations %9s   hit the cap: %s"
          % ("rbf", m.score(Bte, byte), format(int(m.n_iter_.max()), ","), False))
    print()
    print("Three runs out of three stopped because they ran out of iterations, not because they")
    print("found an answer. The rbf kernel on the identical data finished in 247. Page 15 is")
    print("about scaling and this is the sharpest version of why: exp(-gamma|x-z|^2) is bounded")
    print("between 0 and 1 whatever units you hand it, and (1 + x.z)^8 is not bounded by")
    print("anything.")


# ------------------------------------------------------------------ #
# 49. What the default costs
# ------------------------------------------------------------------ #
def lookup():
    section("49. when the rbf kernel quietly becomes a lookup table")
    print("Section 46 made the rbf kernel look free. It is not, and the bill does not arrive as")
    print("lost accuracy -- which is why it is easy to miss.")
    print()
    print("Data with a genuinely linear boundary, at most five informative features and the")
    print("rest noise, 400 points throughout. The only thing that changes is how many noise")
    print("columns come along. Everything is averaged over 5 draws, gamma left at 'scale':")
    print()
    print("  %6s %9s %10s %10s %9s %12s"
          % ("d", "#sv", "train", "cv", "train - cv", "linear cv"))
    shape = {}
    for d in (2, 10, 50, 200, 1000):
        sv, tr, cvs, lin, conc, ratio = [], [], [], [], [], []
        for s_ in range(5):
            X, y = _linear_truth(400, d, s_)
            Xs = StandardScaler().fit_transform(X)
            m = SVC(kernel="rbf", gamma="scale", C=1.0).fit(Xs, y)
            sv.append(m.n_support_.sum() / 400.0)
            tr.append(m.score(Xs, y))
            cvs.append(cross_val_score(SVC(kernel="rbf", gamma="scale", C=1.0), Xs, y,
                                       cv=_KCV).mean())
            lin.append(cross_val_score(SVC(kernel="linear", C=1.0), Xs, y, cv=_KCV).mean())
            off = ~np.eye(400, dtype=bool)
            D2 = np.maximum((Xs ** 2).sum(1)[:, None] + (Xs ** 2).sum(1)[None, :]
                            - 2 * Xs @ Xs.T, 0)
            D = np.sqrt(D2[off])
            conc.append(D.std() / D.mean())
            ratio.append(D.mean() / np.sqrt(np.where(off, D2, np.inf).min(1)).mean())
        shape[d] = (float(np.mean(conc)), float(np.mean(ratio)))
        print("  %6d %8.1f%% %10.4f %10.4f %9.4f %12.4f"
              % (d, 100 * np.mean(sv), np.mean(tr), np.mean(cvs),
                 np.mean(tr) - np.mean(cvs), np.mean(lin)))
    print()
    print("The accuracy columns are the boring ones. At d=1000 the rbf kernel scores 0.6060 and")
    print("a straight line scores 0.6195 -- the same answer, within noise, on data whose")
    print("boundary IS a straight line. The rbf column tracks the linear column the whole way")
    print("down, so nothing was lost by choosing it.")
    print()
    print("What moved is everything else. The support set went from 61.6% of the training data")
    print("to 100.0% of it, every point with no exceptions; training accuracy went to 1.0000")
    print("against a cross-validated 0.6060, a gap of 0.3940. The model fits its training set")
    print("perfectly and knows nothing, and by page 11's arithmetic each prediction now costs")
    print("400 kernel evaluations where the line costs one dot product.")
    print()
    print("The reason is in the shape of the data rather than in the kernel. Distances in high")
    print("dimensions concentrate, so 'near' stops meaning anything:")
    print()
    print("  %6s %22s %26s" % ("d", "spread of distances", "nearest vs average point"))
    print("  %6s %22s %26s" % ("", "sd / mean", "how much closer"))
    for d in (2, 10, 50, 200, 1000):
        print("  %6d %22.4f %25.2fx" % (d, shape[d][0], shape[d][1]))
    print()
    print("At d=2 your nearest neighbour is 14.7 times closer than a typical point and the")
    print("distances vary by half their own size. At d=1000 the spread has fallen to 0.0221 and")
    print("your nearest neighbour is 1.06 times closer -- six per cent. Every point is now")
    print("essentially the same distance from every other, so a similarity built out of distance")
    print("has nothing left to say, and the only point measurably close to a point is itself.")
    print()
    print("This is section 47's failure arriving by a different road. There, the half-life was")
    print("driven below the spacing of the data by turning gamma up. Here gamma is left alone")
    print("and the spacing is driven above the half-life by adding dimensions, because in high")
    print("dimensions points are all far apart and all equally far apart. Either way the kernel")
    print("ends up saying every point is similar only to itself, and a model that believes that")
    print("has memorised its training set. Page 16 turns both knobs on purpose.")


# ------------------------------------------------------------------ #
# helpers for page 14 (SMO)
# ------------------------------------------------------------------ #
def _dobj(a, K, y):
    """The dual objective: sum a - (1/2) sum sum a_i a_j y_i y_j K_ij."""
    return float(a.sum() - 0.5 * (a * y) @ K @ (a * y))


def _LH(ai, aj, yi, yj, C):
    """Where the constraint line leaves the box [0,C] x [0,C], written in terms of alpha_j.

    Opposite labels put the pair on a line of slope +1 (their DIFFERENCE is fixed); equal
    labels put it on a line of slope -1 (their SUM is fixed). Either way the segment that
    survives is an interval, and these are its ends.
    """
    if yi != yj:
        return max(0.0, aj - ai), min(C, C + aj - ai)
    return max(0.0, ai + aj - C), min(C, ai + aj)


def _smo(K, y, C, tol=1e-6, rule=("max", "max"), max_steps=2000000, seed=7,
         naive=False, trace=False):
    """Sequential minimal optimisation, with the two choices this page is about exposed.

    `rule` picks how i and j are chosen -- "max" is the maximal-violating-pair rule, "rand"
    is a coin flip -- and `naive` rebuilds the error vector from scratch instead of updating
    it, which is the O(n^2)-per-step version of the same algorithm.
    """
    n = len(y)
    a = np.zeros(n)
    f = np.zeros(n)                 # f_k = sum_m a_m y_m K[m,k], the model without its offset
    rng = np.random.default_rng(seed)
    steps = 0
    clipped = 0
    flat = 0
    log = []
    while steps < max_steps:
        g = f - y
        # The two sets a KKT-violating pair must come from: points whose price may rise on the
        # positive side of the constraint, and points whose price may fall on the negative one.
        up = ((a < C - 1e-12) & (y > 0)) | ((a > 1e-12) & (y < 0))
        dn = ((a < C - 1e-12) & (y < 0)) | ((a > 1e-12) & (y > 0))
        if not up.any() or not dn.any():
            break
        gap = float((-g)[up].max() - (-g)[dn].min())
        if trace:
            log.append((steps, _dobj(a, K, y), gap))
        if gap < tol:
            break
        i = (int(np.where(up)[0][np.argmax((-g)[up])]) if rule[0] == "max"
             else int(rng.choice(np.where(up | dn)[0])))
        j = (int(np.where(dn)[0][np.argmin((-g)[dn])]) if rule[1] == "max"
             else int(rng.integers(n)))
        eta = 2 * K[i, j] - K[i, i] - K[j, j]
        L, H = _LH(a[i], a[j], y[i], y[j], C)
        steps += 1
        if eta >= -1e-15:
            flat += 1
            continue
        if H - L < 1e-14:
            continue
        raw = a[j] - y[j] * (g[i] - g[j]) / eta
        nj = float(np.clip(raw, L, H))
        if raw < L - 1e-12 or raw > H + 1e-12:
            clipped += 1
        ni = a[i] + y[i] * y[j] * (a[j] - nj)
        oi, oj = a[i], a[j]
        a[i], a[j] = ni, nj
        f = (K @ (a * y) if naive
             else f + (ni - oi) * y[i] * K[i] + (nj - oj) * y[j] * K[j])
    return dict(alpha=a, steps=steps, clipped=clipped, flat=flat, log=log)


def _sk_alpha(model, n):
    """sklearn stores a_i y_i for the support vectors only. Put |a_i| back where it belongs."""
    a = np.zeros(n)
    a[model.support_] = np.abs(model.dual_coef_[0])
    return a


def _moons_rbf(n, seed=0, noise=0.30):
    X, y0 = make_moons(n_samples=n, noise=noise, random_state=seed)
    y = np.where(y0 == 0, -1.0, 1.0)
    gamma = 1.0 / (2 * X.var())
    d2 = (X ** 2).sum(1)[:, None] + (X ** 2).sum(1)[None, :] - 2 * X @ X.T
    return X, y, gamma, np.exp(-gamma * np.maximum(d2, 0.0))


def _lab_points(n=24, seed=11):
    """The 24 points SmoStepLab generates, reproduced exactly.

    Same Lehmer generator, same order of draws, same rounding to three decimals. 2^31 x 48271
    stays under 2^53, so this is exact arithmetic in both languages rather than two float
    sequences that happen to start together.
    """
    st = (seed % 2147483646) + 1

    def u():
        nonlocal st
        st = (st * 48271) % 2147483647
        return st / 2147483647

    X, y = [], []
    for i in range(n):
        lab = 1.0 if i % 2 == 0 else -1.0
        t = sum(u() for _ in range(6))
        t2 = sum(u() for _ in range(6))
        cx = 0.95 if lab > 0 else -0.95
        X.append([round((cx + ((t - 3) / 1.2247) * 0.62) * 1000) / 1000,
                  round(((t2 - 3) / 1.2247 * 0.82) * 1000) / 1000])
        y.append(lab)
    return np.array(X), np.array(y)


# ------------------------------------------------------------------ #
# 50. Why the prices move in pairs
# ------------------------------------------------------------------ #
def twoatatime():
    section("50. you cannot move one price at a time")
    print("Page 10 left the dual as a problem, not a procedure: maximise sum a - (1/2) a'Qa")
    print("over 0 <= a_i <= C with sum a_i y_i = 0. Coordinate ascent is the obvious attack --")
    print("pick one variable, maximise over it, repeat. It is not available here, and the")
    print("equality constraint is why.")
    print()
    X, y = _blob(0, n=60)
    K = X @ X.T
    C = 1.0
    a = np.zeros(60)
    a[np.where(y > 0)[0][:5]] = 0.4
    a[np.where(y < 0)[0][:5]] = 0.4
    print("  a feasible starting point:        sum a_i y_i = %.1f" % float(a @ y))
    for d in (0.1, 0.01, 1e-6):
        b = a.copy()
        b[np.where(y > 0)[0][0]] += d
        print("  raise one price by %-8g       sum a_i y_i = %+.6f" % (d, float(b @ y)))
    print()
    print("Every single-coordinate move of any size lands outside the feasible set. The only")
    print("legal step in one variable is no step at all. So two is the smallest move that")
    print("exists -- which is what the 'minimal' in sequential minimal optimisation means.")
    print()
    for tag, k, d in (("opposite labels, both +0.1", np.where(y < 0)[0][0], +0.1),
                      ("same label, +0.1 and -0.1", np.where(y > 0)[0][1], -0.1)):
        b = a.copy()
        b[np.where(y > 0)[0][0]] += 0.1
        b[k] += d
        print("  %-28s sum a_i y_i = %+.1e" % (tag, float(b @ y)))
    print()
    print("Fix every other price and the two that are left are not free of each other: their")
    print("weighted sum a_i y_i + a_j y_j has to stay where it was. That pins the pair to a")
    print("LINE. Opposite labels fix their difference, equal labels fix their sum, so the line")
    print("has slope +1 or -1, and the box 0 <= a <= C cuts it to a segment.")
    print()
    print("On that segment the objective is a quadratic in one variable, with curvature")
    print()
    print("    eta = 2 K_ij - K_ii - K_jj")
    print()
    print("and the maximum of a quadratic is a formula, not a search:")
    print()
    print("    a_j <- a_j - y_j (E_i - E_j) / eta,   E_k = f(x_k) - y_k")
    print()
    print("Checked against a numerical search along the same segment, from a random feasible")
    print("point, over every pair it was offered:")
    print()
    rng = np.random.default_rng(0)
    a0 = rng.uniform(0.05, 0.6, size=60)
    sp, sn = a0[y > 0].sum(), a0[y < 0].sum()
    a0[y > 0] *= min(sp, sn) / sp
    a0[y < 0] *= min(sp, sn) / sn
    f0 = K @ (a0 * y)
    warg = wobj = 0.0
    nb = 0
    for _ in range(500):
        i, j = (int(v) for v in rng.choice(60, size=2, replace=False))
        eta = 2 * K[i, j] - K[i, i] - K[j, j]
        L, H = _LH(a0[i], a0[j], y[i], y[j], C)
        if eta >= -1e-15 or H - L < 1e-14:
            continue
        g = f0 - y
        nj = float(np.clip(a0[j] - y[j] * (g[i] - g[j]) / eta, L, H))

        def neg(t, i=i, j=j):
            b = a0.copy()
            b[j] = t
            b[i] = a0[i] + y[i] * y[j] * (a0[j] - t)
            return -_dobj(b, K, y)

        r = minimize_scalar(neg, bounds=(L, H), method="bounded", options={"xatol": 1e-14})
        warg = max(warg, abs(r.x - nj))
        wobj = max(wobj, neg(nj) - r.fun)
        nb += 1
    print("  %d pairs, worst gap to the search's answer     %.2e" % (nb, warg))
    print("  worst amount the formula was WORSE by          %.2e" % max(wobj, 0.0))
    print()
    print("The first number is the search's own precision, not an error in the formula. The")
    print("second is the one that matters: on no segment did the formula land lower than the")
    print("search, by more than one rounding error in a number of size 20.")
    print()
    print("Two facts about eta make it safe to divide by. It is never positive, because Q is")
    print("positive semi-definite -- page 12's condition, arriving as a guarantee that the")
    print("subproblem curves the right way:")
    print()
    et = 2 * K - np.add.outer(np.diag(K), np.diag(K))
    off = et[~np.eye(60, dtype=bool)]
    print("  eta over all %d pairs:  max %+.3e   min %.4f" % (off.size, off.max(), off.min()))
    print("  pairs with eta > 0:    %d" % int((off > 0).sum()))
    print()
    print("And it is exactly zero when the two points are identical, because then the line")
    print("runs along a level set and there is no maximum to step to:")
    print()
    Xd = np.vstack([X, X[0]])
    Kd = Xd @ Xd.T
    print("  duplicate point 0 as point 60:")
    print("    K[0,0] %.6f   K[0,60] %.6f   K[60,60] %.6f" % (Kd[0, 0], Kd[0, 60], Kd[60, 60]))
    print("    eta = 2(%.6f) - %.6f - %.6f = %.1e"
          % (Kd[0, 60], Kd[0, 0], Kd[60, 60], 2 * Kd[0, 60] - Kd[0, 0] - Kd[60, 60]))
    print()
    print("Not small. Zero. That is the branch every SMO implementation has for skipping a")
    print("pair, and duplicated rows in a training set are how you meet it.")


def _lab_case():
    """Record sklearn's answer on the lab's own 24 points, for the browser solver to be held to."""
    import pathlib
    Xl, yl = _lab_points()
    Kl = Xl @ Xl.T
    out = {}
    for C in (0.1, 1.0, 10.0):
        m = SVC(kernel="linear", C=C, tol=1e-12).fit(Xl, yl)
        al = _sk_alpha(m, len(yl))
        out["C=%g" % C] = dict(
            C=C,
            objective=_dobj(al, Kl, yl),
            alpha=[float(v) for v in al],
            nsv=int((al > 1e-6).sum()),
            npinned=int((al > C - 1e-6).sum()),
            w=[float(v) for v in (al * yl) @ Xl],
            b=float(m.intercept_[0]),
        )
    p = pathlib.Path(__file__).resolve().parents[1] / "results" / "svm_smo_case.json"
    p.parent.mkdir(exist_ok=True)
    p.write_text(json.dumps(
        dict(points=[dict(x=float(a), z=float(b), y=float(c))
                     for (a, b), c in zip(Xl, yl)], cases=out), indent=1))
    sys.stderr.write("  [wrote %s]\n" % p)


# ------------------------------------------------------------------ #
# 51. The box, and running the thing
# ------------------------------------------------------------------ #
def clipbox():
    section("51. a quadratic on a line in a box")
    print("The formula in section 50 maximises over the whole line. The box only enters")
    print("afterwards, as a clip to the segment that is actually feasible:")
    print()
    print("    opposite labels:  a_i - a_j fixed,  L = max(0, a_j - a_i),  H = min(C, C + a_j - a_i)")
    print("    equal labels:     a_i + a_j fixed,  L = max(0, a_i + a_j - C),  H = min(C, a_i + a_j)")
    print()
    print("    a_j <- min(H, max(L, a_j - y_j (E_i - E_j) / eta))")
    print()
    print("That one line of clipping is where the soft margin lives. Landing on L or H is a")
    print("price hitting a wall, and a price pinned at C is exactly page 5's point inside the")
    print("margin. Running it to convergence on 60 standardised points, C = 1:")
    print()
    X, y = _blob(0, n=60)
    K = X @ X.T
    C = 1.0
    r = _smo(K, y, C, tol=1e-6)
    a = r["alpha"]
    sk = SVC(kernel="linear", C=C).fit(X, y)
    ask = _sk_alpha(sk, 60)
    print("  steps                     %6d" % r["steps"])
    print("  steps where the clip bit  %6d   (%.1f%%)"
          % (r["clipped"], 100.0 * r["clipped"] / r["steps"]))
    print()
    print("  %-26s %14s %14s" % ("", "this solver", "sklearn"))
    print("  %-26s %14.6f %14.6f" % ("dual objective", _dobj(a, K, y), _dobj(ask, K, y)))
    print("  %-26s %14d %14d" % ("support vectors", int((a > 1e-6).sum()), len(sk.support_)))
    print("  %-26s %14d %14d" % ("prices pinned at C", int((a > C - 1e-6).sum()),
                                 int((ask > C - 1e-6).sum())))
    print("  %-26s %14.2e" % ("max |a - a_sklearn|", np.abs(a - ask).max()))
    print()
    print("A quarter of the steps are clipped, and the same solver that page 10 described in")
    print("words lands on libsvm's answer: same objective to six decimals, same %d support"
          % len(sk.support_))
    print("vectors, the same %d of them pinned at the cap." % int((ask > C - 1e-6).sum()))
    print()
    print("Watching it get there is more interesting than the destination. Two quantities")
    print("move during the climb, and only one of them is well behaved:")
    print()
    r = _smo(K, y, C, tol=1e-9, trace=True)
    log = r["log"]
    objs = np.array([o for _, o, _ in log])
    d = np.diff(objs)
    print("  %8s %16s %18s" % ("step", "objective", "KKT violation"))
    for k in (0, 1, 2, 5, 10, 20, 50, 100, len(log) - 1):
        if k < len(log):
            print("  %8d %16.6f %18.2e" % log[k])
    print()
    print("  steps where the objective FELL     %d of %d" % (int((d < -1e-12).sum()), len(d)))
    print("  smallest increase                  %.3e" % d[d > 0].min())
    print("  largest increase                   %.4f" % d.max())
    print()
    print("The objective never once goes down. Every step maximises a quadratic over a set")
    print("containing the current point, so it cannot -- staying put is always available and")
    print("the step is at least as good. That is the whole convergence argument, and it does")
    print("not need the steps to be large or the pair to be well chosen.")
    print()
    _lab_case()
    print("The KKT violation is the other story. It starts at %.2f, and by step 5 it is %.2f --"
          % (log[0][2], log[5][2]))
    print("HIGHER than where it began, and it goes back up again at step 20. Fixing the worst")
    print("violation creates new ones, because every price shares the constraint with all the")
    print("others. So the quantity the algorithm stops on is not the quantity that improves")
    print("monotonically, and a run that looks stuck by that measure may be making progress by")
    print("the only measure that is guaranteed.")


# ------------------------------------------------------------------ #
# 52. Choosing the pair
# ------------------------------------------------------------------ #
def whichpair():
    section("52. which two")
    print("Nothing above says WHICH pair to step on. Convergence does not depend on it: any")
    print("violating pair raises the objective. Practicality depends on almost nothing else.")
    print()
    print("Three rules on one problem -- 300 points of noisy moons, rbf kernel, C = 10, run")
    print("until the KKT violation drops under 1e-3. The rule is: take i where -y_i grad is")
    print("largest among the prices that may rise, and j where it is smallest among those that")
    print("may fall. That is the pair whose step the first-order model says buys the most.")
    print()
    X, y, gamma, _ = _moons_rbf(600, seed=0)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, random_state=0)
    # gamma comes from the whole set, as sklearn's 'scale' would; the matrix is the training half
    d2 = ((Xtr ** 2).sum(1)[:, None] + (Xtr ** 2).sum(1)[None, :] - 2 * Xtr @ Xtr.T)
    Ktr = np.exp(-gamma * np.maximum(d2, 0.0))
    C = 10.0
    sk = SVC(kernel="rbf", gamma=gamma, C=C, tol=1e-12).fit(Xtr, ytr)
    ref = _dobj(_sk_alpha(sk, len(ytr)), Ktr, ytr)
    print("  reference objective (libsvm, tol 1e-12):  %.6f" % ref)
    print()
    CAP = 400000
    print("  %-26s %10s %16s" % ("how the pair is picked", "steps", "gap to optimum"))
    out = {}
    for tag, rule in (("both by the rule", ("max", "max")),
                      ("i by the rule, j at random", ("max", "rand")),
                      ("both at random", ("rand", "rand"))):
        rr = _smo(Ktr, ytr, C, tol=1e-3, rule=rule, max_steps=CAP)
        out[tag] = rr
        note = "  (hit the %d-step cap)" % CAP if rr["steps"] >= CAP else ""
        print("  %-26s %10d %16.3e%s"
              % (tag, rr["steps"], ref - _dobj(rr["alpha"], Ktr, ytr), note))
    print()
    a = out["both by the rule"]["steps"]
    b = out["i by the rule, j at random"]["steps"]
    print("Picking one end well and the other at random costs %.0fx the steps. Picking neither"
          % (b / a))
    print("does not finish at all: %d steps in, it is still %.1e from the optimum that the"
          % (CAP, ref - _dobj(out["both at random"]["alpha"], Ktr, ytr)))
    print("first rule reached in %d." % a)
    print()
    print("Which is the real shape of this algorithm. The step is a formula and the")
    print("convergence proof is one line, so all of the engineering is in the selection, and")
    print("a version of SMO with the selection removed is not a slower SVM solver -- on this")
    print("problem it is not an SVM solver.")


# ------------------------------------------------------------------ #
# 53. Stopping, and the bill
# ------------------------------------------------------------------ #
def stopping():
    section("53. when to stop, and what it costs")
    print("The loop ends when the KKT violation falls under a tolerance you choose. Sweeping")
    print("that tolerance over nine orders of magnitude, same problem as section 52:")
    print()
    X, y, gamma, _ = _moons_rbf(600, seed=0)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, random_state=0)
    d2 = ((Xtr ** 2).sum(1)[:, None] + (Xtr ** 2).sum(1)[None, :] - 2 * Xtr @ Xtr.T)
    Ktr = np.exp(-gamma * np.maximum(d2, 0.0))
    d2 = ((Xte ** 2).sum(1)[:, None] + (Xtr ** 2).sum(1)[None, :] - 2 * Xte @ Xtr.T)
    Kte = np.exp(-gamma * np.maximum(d2, 0.0))
    C = 10.0
    sk = SVC(kernel="rbf", gamma=gamma, C=C, tol=1e-12).fit(Xtr, ytr)
    ref = _dobj(_sk_alpha(sk, len(ytr)), Ktr, ytr)
    print("  %-9s %8s %18s %6s %10s %10s"
          % ("tol", "steps", "gap to optimum", "SVs", "train", "test"))
    rows = []
    for tol in (1.0, 1e-1, 1e-2, 1e-3, 1e-4, 1e-6, 1e-9):
        rr = _smo(Ktr, ytr, C, tol=tol)
        a = rr["alpha"]
        gi = Ktr @ (a * ytr)
        free = (a > 1e-9) & (a < C - 1e-9)
        b = float(np.mean(ytr[free] - gi[free])) if free.any() else 0.0
        tr = float(np.mean(np.sign(gi + b) == ytr))
        te = float(np.mean(np.sign(Kte @ (a * ytr) + b) == yte))
        rows.append((tol, rr["steps"], ref - _dobj(a, Ktr, ytr),
                     int((a > 1e-6).sum()), tr, te))
        print("  %-9.0e %8d %18.2e %6d %10.4f %10.4f" % rows[-1])
    print()
    print("Nine orders of magnitude of tolerance; the gap to the optimum falls through")
    print("twelve. (The last row is negative because the reference is libsvm at ITS tolerance,")
    print("and by then the two are arguing over the eleventh decimal.)")
    print()
    print("The test accuracy moves once, by %.4f, between the first row and the second -- one"
          % (rows[1][5] - rows[0][5]))
    print("point in %d. Then it does not move again, through %d more steps and eight more"
          % (len(yte), rows[-1][1] - rows[1][1]))
    print("orders of magnitude of tolerance. The support count settles at %d by tol 1e-02 and"
          % rows[2][3])
    print("stays there. Everything after that row buys a better answer to the dual and the")
    print("same model, which is worth knowing before you tighten a tolerance to fix a score.")
    print()
    print("The per-step cost is where the design actually shows. Every step changes two")
    print("prices, so the errors of all n points change -- and the whole trick is to update")
    print("them rather than recompute them. Updating touches two kernel rows, 2n numbers.")
    print("Recomputing multiplies the whole matrix, n^2. Both run to the same tolerance, so")
    print("the step counts are the algorithm's own and the totals are what each actually did:")
    print()
    print("  %6s %14s %14s %16s %16s %8s"
          % ("n", "steps cached", "steps rebuilt", "update (2n each)",
             "rebuild (n^2)", "ratio"))
    for n in (100, 200, 400, 800, 1600):
        _, yn, _, Kn = _moons_rbf(n, seed=3)
        s1 = _smo(Kn, yn, C, tol=1e-3)["steps"]
        s2 = _smo(Kn, yn, C, tol=1e-3, naive=True)["steps"]
        c1 = 2.0 * n * s1
        c2 = float(n) * n * s2
        print("  %6d %14d %14d %16.3g %16.3g %7.0fx" % (n, s1, s2, c1, c2, c2 / c1))
        last = c2 / c1
    print()
    print("O(n) against O(n^2), and by n = 1600 one version does %.0f times the arithmetic of"
          % last)
    print("the other to reach the same tolerance. Keeping that cache is not an optimisation")
    print("detail; it is the difference between an algorithm that finishes and one that does")
    print("not.")
    print()
    print("(The cache does change the arithmetic, and so the path. At tol 1e-3 the two")
    print("versions land up to 3.2e-02 apart in a, which sounds alarming until you tighten")
    print("the tolerance: 1.1e-04 at 1e-6, 2.7e-11 at 1e-12. They were never diverging, they")
    print("were stopping at different points of the same flat region -- page 8's interval")
    print("again, and the tolerance is what licensed both.)")
    print()
    print("Step counts are the part nobody can promise you. Same generator, same settings,")
    print("five draws at each size:")
    print()
    print("  %6s %14s %14s %16s" % ("n", "steps (mean)", "per point", "spread over draws"))
    for n in (100, 200, 400, 800, 1600):
        ss = []
        for sd in range(5):
            Xn, yn, gn, Kn = _moons_rbf(n, seed=sd)
            ss.append(_smo(Kn, yn, C, tol=1e-3)["steps"])
        ss = np.array(ss)
        print("  %6d %14.0f %14.2f %16s"
              % (n, ss.mean(), ss.mean() / n, "%d - %d" % (ss.min(), ss.max())))
    print()
    print("A few steps per point on average, but the draw matters more than the size does:")
    print("at n = 400 the five draws span 747 to 2700 steps, a range wider than the gap")
    print("between n = 100 and n = 800. There is no step count to quote, only a shape.")
    print()
    print("What IS predictable is the memory, because the kernel matrix has n^2 entries and")
    print("every one of them may be asked for:")
    print()
    for n in (1000, 10000, 100000, 1000000):
        by = n * n * 8.0
        u, v = ("MB", by / 1024 ** 2)
        if v >= 1024:
            u, v = "GB", by / 1024 ** 3
        if v >= 1024:
            u, v = "TB", by / 1024 ** 4
        print("  n = %-9d  %.3g entries  %8.1f %s" % (n, float(n * n), v, u))
    print()
    print("Ten thousand points is a comfortable 763 MB. A hundred thousand is 74.5 GB, and")
    print("that is the wall -- not the step count, not the kernel, not C. Real solvers cache")
    print("a slice of the matrix and recompute the rest, which trades the memory for time")
    print("without changing the shape. Page 20 is about what you reach for instead.")


CMDS = dict(margin=margin, soft=soft, sparsity=sparsity, losses=losses, kernels=kernels,
            scaling=scaling, multiclass=multiclass, bakeoff=bakeoff, solver=solver,
            rescale=rescale, distance=distance, ranking=ranking, canonical=canonical,
            minnorm=minnorm, squared=squared, tight=tight,
            size=size, band=band, where=where, bound=bound, onepoint=onepoint,
            rescue=rescue, slack=slack, dial=dial,
            unconstrained=unconstrained, surrogate=surrogate, descend=descend,
            pull=pull,
            primal=primal, convex=convex, flat=flat, shape=shape,
            lagrangian=lagrangian, kkt=kkt, prices=prices,

            dual=dual, gram=gram, pieces=pieces,
            svset=svset, becoming=becoming, offset=offset, loo=loo,
            swap=swap, lift=lift, nospace=nospace, allowed=allowed,
            menu=menu, reach=reach, coef0=coef0, lookup=lookup,
            twoatatime=twoatatime, clipbox=clipbox, whichpair=whichpair,
            stopping=stopping)

if __name__ == "__main__":
    want = sys.argv[1:] or list(CMDS)
    for w in want:
        if w not in CMDS:
            raise SystemExit("unknown: %s. one of %s" % (w, ", ".join(CMDS)))
        CMDS[w]()
