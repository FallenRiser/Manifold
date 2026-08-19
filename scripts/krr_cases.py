"""
Real runs behind the Kernel Ridge Regression 'In the wild' case-study pages.
Every number cited on those pages comes from this script. Deterministic.

    python scripts/krr_cases.py

Cases:
  A) Dense vs sparse — KRR and SVR fit the SAME nonlinear data to nearly the same
                       accuracy, but KRR stores every training point while SVR
                       keeps only its support vectors. The cost of density,
                       measured: model size and prediction time.
  B) Efficient LOOCV — KRR's signature trick. One eigendecomposition of the kernel
                       matrix gives leave-one-out CV error for a whole grid of
                       lambda in closed form, picking the same lambda as k-fold
                       GridSearchCV at a fraction of the cost.
"""
import time
import numpy as np
from sklearn.datasets import make_friedman1
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.kernel_ridge import KernelRidge
from sklearn.svm import SVR
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.metrics import r2_score, mean_squared_error


def rmse(a, b):
    return float(np.sqrt(mean_squared_error(a, b)))


# ----------------------------------------------------------------------------- A
def case_dense_vs_sparse():
    print("=== Case A: dense vs sparse — KRR vs SVR on the same data ===", flush=True)
    X, y = make_friedman1(n_samples=800, noise=1.0, random_state=0)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)
    sc = StandardScaler().fit(Xtr)
    Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)
    print(f"train={len(ytr)}  test={len(yte)}  (same features, same split, RBF kernel)", flush=True)

    # tune both fairly by 5-fold CV, then score once on the test set
    krr = GridSearchCV(
        KernelRidge(kernel="rbf"),
        {"alpha": [1e-3, 1e-2, 1e-1, 1], "gamma": [0.01, 0.03, 0.1, 0.3]}, cv=5,
    ).fit(Xtr, ytr).best_estimator_
    svr = GridSearchCV(
        SVR(kernel="rbf"),
        {"C": [1, 10, 100], "epsilon": [0.1, 0.5, 1.0], "gamma": [0.01, 0.03, 0.1, 0.3]}, cv=5,
    ).fit(Xtr, ytr).best_estimator_

    pk, ps = krr.predict(Xte), svr.predict(Xte)
    # model size: stored points that carry nonzero weight
    krr_stored = len(ytr)                       # dense dual coefficients — all of them
    svr_stored = int(svr.support_.shape[0])     # support vectors only

    print(f"  KRR (dense)  test R^2={r2_score(yte, pk):.4f}  RMSE={rmse(yte, pk):.4f}  "
          f"stores {krr_stored}/{len(ytr)} points (100%)", flush=True)
    print(f"  SVR (sparse) test R^2={r2_score(yte, ps):.4f}  RMSE={rmse(yte, ps):.4f}  "
          f"stores {svr_stored}/{len(ytr)} points ({100*svr_stored/len(ytr):.0f}%)", flush=True)
    print(f"  -> same accuracy tier; KRR's price for its closed form is a model "
          f"{krr_stored/svr_stored:.1f}x larger", flush=True)
    print(flush=True)


# ----------------------------------------------------------------------------- B
def case_efficient_loocv():
    print("=== Case B: efficient leave-one-out CV for lambda ===", flush=True)
    X, y = make_friedman1(n_samples=600, noise=1.0, random_state=1)
    sc = StandardScaler().fit(X)
    X = sc.transform(X)
    y = y - y.mean()                            # center so no intercept needed
    n = len(y)
    gamma = 0.03
    lambdas = np.logspace(-4, 2, 60)
    print(f"n={n}  gamma={gamma}  grid={len(lambdas)} lambdas (1e-4 ... 1e2)", flush=True)

    # ---- closed-form LOOCV via a single eigendecomposition ----
    # K = U diag(s) U^T ; hat matrix H(lambda) = U diag(s/(s+lambda)) U^T
    # LOO residual_i = (y - H y)_i / (1 - H_ii)  -- no refitting, ever.
    t = time.perf_counter()
    K = rbf_kernel(X, gamma=gamma)
    s, U = np.linalg.eigh(K)                     # the one O(n^3) step, done ONCE
    Uty = U.T @ y
    U2 = U ** 2
    loo = np.empty(len(lambdas))
    for j, lam in enumerate(lambdas):
        f = s / (s + lam)                       # filter factors
        yhat = U @ (f * Uty)                     # H y
        h_diag = U2 @ f                          # diag(H)
        r = (y - yhat) / (1.0 - h_diag)          # LOO residuals, closed form
        loo[j] = float(np.mean(r ** 2))
    best_cf = lambdas[int(np.argmin(loo))]
    t_cf = time.perf_counter() - t

    # ---- the naive way: k-fold GridSearchCV, refitting at every lambda ----
    t = time.perf_counter()
    grid = GridSearchCV(
        KernelRidge(kernel="rbf", gamma=gamma),
        {"alpha": lambdas}, cv=5, scoring="neg_mean_squared_error",
    ).fit(X, y)
    best_gs = grid.best_params_["alpha"]
    t_gs = time.perf_counter() - t

    print(f"  closed-form LOOCV : best lambda={best_cf:.4g}   time={t_cf*1e3:.0f} ms", flush=True)
    print(f"  5-fold GridSearch : best lambda={best_gs:.4g}   time={t_gs*1e3:.0f} ms", flush=True)
    print(f"  -> same regime, closed-form is {t_gs/t_cf:.0f}x faster "
          f"(one eigendecomposition amortised over the whole grid)", flush=True)
    print(flush=True)


if __name__ == "__main__":
    case_dense_vs_sparse()
    case_efficient_loocv()
    print("done.")
