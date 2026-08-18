"""
Real runs behind the Kernel Ridge Regression and Support Vector Regression
worked-example pages. Every number cited on those pages comes from this script.
Deterministic (fixed random_state throughout).

    python scripts/kernel_cases.py

Dataset: make_friedman1 — a strongly NONLINEAR target
    y = 10 sin(pi x0 x1) + 20 (x2-0.5)^2 + 10 x3 + 5 x4 + noise
so a linear model must lose badly and the kernel methods should win.
"""
import numpy as np
from sklearn.datasets import make_friedman1
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge
from sklearn.kernel_ridge import KernelRidge
from sklearn.svm import SVR
from sklearn.metrics import r2_score, mean_squared_error


def rmse(a, b):
    return float(np.sqrt(mean_squared_error(a, b)))


def main():
    X, y = make_friedman1(n_samples=400, noise=1.0, random_state=0)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)
    sc = StandardScaler().fit(Xtr)
    Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)
    print("=== Kernel methods on make_friedman1 (nonlinear) ===")
    print(f"samples=400  features={X.shape[1]}  train={len(ytr)}  test={len(yte)}")
    print()

    # ---- linear ridge baseline (can't bend) ----
    lin = GridSearchCV(Ridge(), {"alpha": [0.01, 0.1, 1, 10, 100]}, cv=5).fit(Xtr, ytr)
    pl = lin.predict(Xte)
    print("Linear ridge:")
    print(f"  best alpha={lin.best_params_['alpha']}")
    print(f"  test R^2={r2_score(yte, pl):.4f}  RMSE={rmse(yte, pl):.4f}")
    print()

    # ---- kernel ridge (RBF) ----
    krr = GridSearchCV(
        KernelRidge(kernel="rbf"),
        {"alpha": [1e-3, 1e-2, 1e-1, 1], "gamma": [0.01, 0.03, 0.1, 0.3, 1]},
        cv=5,
    ).fit(Xtr, ytr)
    pk = krr.predict(Xte)
    print("Kernel ridge (RBF):")
    print(f"  best alpha={krr.best_params_['alpha']}  gamma={krr.best_params_['gamma']}")
    print(f"  test R^2={r2_score(yte, pk):.4f}  RMSE={rmse(yte, pk):.4f}")
    print(f"  model uses ALL {len(ytr)} training points (dense dual coefficients)")
    print()

    # ---- support vector regression (RBF) ----
    svr = GridSearchCV(
        SVR(kernel="rbf"),
        {"C": [1, 10, 100], "epsilon": [0.1, 0.5, 1.0], "gamma": [0.01, 0.03, 0.1, 0.3]},
        cv=5,
    ).fit(Xtr, ytr)
    ps = svr.predict(Xte)
    n_sv = int(svr.best_estimator_.support_.shape[0])
    print("Support vector regression (RBF):")
    print(f"  best C={svr.best_params_['C']}  epsilon={svr.best_params_['epsilon']}  gamma={svr.best_params_['gamma']}")
    print(f"  test R^2={r2_score(yte, ps):.4f}  RMSE={rmse(yte, ps):.4f}")
    print(f"  support vectors: {n_sv} of {len(ytr)} "
          f"({100*n_sv/len(ytr):.0f}% of training points)")
    print()
    print("done.")


if __name__ == "__main__":
    main()
