"""Real numbers for the Learning theory track (PROJECT.md §11 rules 9-10).

Every figure quoted on /learn/learning-theory pages that is not a closed form
evaluated live inside a lab comes from this script. Deterministic: fixed seeds
throughout, no network access, stdlib + numpy + sklearn only.

    python scripts/learning_theory_cases.py

Sections
  1. The VC bound, evaluated honestly -> it is vacuous for real model sizes.
  2. Memorizing random labels -> capacity is real, and bounds must respect it.
  3. Double descent -> the classical U-curve is not the shape of reality.

Environment used for the published numbers: python 3.13.11, sklearn 1.8.0,
numpy 2.3.5.
"""

import numpy as np
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import train_test_split

RS = 0


def rule(title):
    print("\n" + "=" * 66)
    print(title)
    print("=" * 66)


# ---------------------------------------------------------------------------
# 1. The VC generalization bound, evaluated
# ---------------------------------------------------------------------------
# Standard VC bound (Vapnik-Chervonenkis, shattering-coefficient form):
#
#   R(h) <= R_hat(h) + sqrt( (8/n) * [ d*(ln(2n/d) + 1) + ln(4/delta) ] )
#
# where d = VC dimension. For a linear classifier in R^p, d = p + 1.
def vc_gap(n, d, delta=0.05):
    return np.sqrt((8.0 / n) * (d * (np.log(2.0 * n / d) + 1.0) + np.log(4.0 / delta)))


def section1():
    rule("1. The VC bound, evaluated honestly")
    print("Linear classifiers in R^p  ->  VC dimension d = p + 1, delta = 0.05")
    print(f"{'features p':>11} {'d_VC':>6} {'n':>8} {'VC gap':>10}   verdict")
    for p, n in [(2, 100), (2, 1000), (10, 1000), (64, 1000), (64, 10000), (784, 60000)]:
        d = p + 1
        g = vc_gap(n, d)
        verdict = "usable" if g < 0.5 else "VACUOUS (>= 0.5 on a binary problem)"
        print(f"{p:>11} {d:>6} {n:>8} {g:>10.3f}   {verdict}")

    print("\nHow much data would the p=784 (MNIST-shaped) case need for a 0.1 gap?")
    d = 785
    n = 10 ** 6
    while vc_gap(n, d) > 0.1 and n < 10 ** 12:
        n = int(n * 1.2)
    print(f"  n = {n:,} examples  (gap = {vc_gap(n, d):.3f})")
    print("  MNIST has 60,000. The bound asks for orders of magnitude more.")


# ---------------------------------------------------------------------------
# 2. Memorizing random labels
# ---------------------------------------------------------------------------
def section2():
    rule("2. Memorizing random labels (capacity is real)")
    X, y = load_digits(return_X_y=True)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=RS, stratify=y)
    n, n_cls = len(ytr), len(np.unique(y))

    rng = np.random.RandomState(RS)
    y_rand = rng.permutation(ytr)          # labels destroyed, features untouched

    # Two classes of very different capacity, each given true and random labels.
    # The raw 64-pixel linear model has ~640 free parameters against n=1257
    # examples, so it CANNOT memorize -- which is itself the point. Expanding to
    # 4000 random tanh features gives a class with capacity far above n, and it
    # memorizes noise completely.
    W = rng.randn(X.shape[1], 4000)
    expand = lambda A: np.tanh((A / 16.0) @ W)

    setups = [
        ("linear, 64 raw pixels", Xtr, Xte),
        ("linear, 4000 random features", expand(Xtr), expand(Xte)),
    ]
    for label, A_tr, A_te in setups:
        print(f"\n  {label}   (n_train = {n})")
        for name, target in [("true labels", ytr), ("RANDOM labels", y_rand)]:
            clf = LogisticRegression(C=1e6, max_iter=5000, random_state=RS)
            clf.fit(A_tr, target)
            tr = clf.score(A_tr, target)
            te = clf.score(A_te, yte)
            print(f"    {name:>14}:  train acc {tr:.4f}   test acc {te:.4f}")

    print(f"\n  chance test accuracy = {1.0 / n_cls:.4f}")
    print("  Read the second block: identical class, identical optimiser. Given")
    print("  real structure it generalizes; given noise it memorizes perfectly")
    print("  and generalizes at chance. A training score alone cannot tell the")
    print("  two situations apart -- which is exactly why capacity must be")
    print("  measured, not inferred from how well the model fit.")


# ---------------------------------------------------------------------------
# 3. Double descent
# ---------------------------------------------------------------------------
# Random-feature ridge regression on a digits binary task. Sweep the number of
# random features p through the interpolation threshold p = n and watch test
# error rise, peak at p = n, then fall again -- the second descent.
def section3():
    rule("3. Double descent (the U-curve is not the whole shape)")
    X, y = load_digits(return_X_y=True)
    keep = np.isin(y, [3, 8])
    X, y = X[keep], (y[keep] == 8).astype(float)
    X = X / 16.0

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, random_state=RS, stratify=y)
    n = len(ytr)
    rng = np.random.RandomState(RS)
    W = rng.randn(X.shape[1], 4000)

    def feats(A, p):
        return np.tanh(A @ W[:, :p])

    print(f"  n_train = {n}  (the interpolation threshold)")
    print(f"{'features p':>11} {'train MSE':>11} {'test MSE':>10}   note")
    rows = []
    for p in [5, 10, 20, 40, 80, n // 2, n - 10, n, n + 10, 2 * n, 4 * n, 4000]:
        p = int(p)
        if p < 1 or p > 4000:
            continue
        model = Ridge(alpha=1e-8, fit_intercept=False)
        model.fit(feats(Xtr, p), ytr)
        tr = float(np.mean((model.predict(feats(Xtr, p)) - ytr) ** 2))
        te = float(np.mean((model.predict(feats(Xte, p)) - yte) ** 2))
        rows.append((p, tr, te))
        note = "<- interpolation threshold p = n" if p == n else ""
        print(f"{p:>11} {tr:>11.5f} {te:>10.5f}   {note}")

    peak = max(rows, key=lambda r: r[2])
    final = rows[-1]
    classical = min((r for r in rows if r[0] < n), key=lambda r: r[2])
    print(f"\n  best BEFORE the threshold : p={classical[0]:>4}  test MSE {classical[2]:.5f}")
    print(f"  worst (the peak)          : p={peak[0]:>4}  test MSE {peak[2]:.5f}")
    print(f"  far past the threshold    : p={final[0]:>4}  test MSE {final[2]:.5f}")
    if final[2] < peak[2]:
        print("  -> test error FELL after the peak: the second descent is real.")


if __name__ == "__main__":
    section1()
    section2()
    section3()
    print()
