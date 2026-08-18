"""
Real runs behind the SVR 'In the wild' case-study pages. Every number cited on
those pages comes from this script. Deterministic (fixed seeds throughout).

    python scripts/svr_cases.py

Cases:
  A) Forecasting  — the chaotic Mackey-Glass series, where linear AR fails and
                    an RBF-kernel SVR captures the nonlinear dynamics.
  B) Robustness   — a LINEAR target (same hypothesis class for both models), so
                    the only difference is the loss: SVR's epsilon-insensitive
                    loss shrugs off gross outliers that wreck least squares.
"""
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge, LinearRegression
from sklearn.svm import SVR
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import r2_score, mean_squared_error


def rmse(a, b):
    return float(np.sqrt(mean_squared_error(a, b)))


def mackey_glass(n, tau=17, beta=0.2, gamma=0.1, power=10, seed=0):
    """Discrete Mackey-Glass: a classic chaotic forecasting benchmark."""
    rng = np.random.default_rng(seed)
    burn = 500
    x = np.zeros(n + burn + tau)
    x[:tau] = 1.2
    for t in range(tau, len(x) - 1):
        x[t + 1] = x[t] + beta * x[t - tau] / (1 + x[t - tau] ** power) - gamma * x[t]
    x = x[burn + tau:]                       # drop transient
    x += rng.normal(0, 0.002, len(x))        # tiny observation noise
    return x


# ----------------------------------------------------------------------------- A
def case_forecasting():
    print("=== Case A: forecasting the chaotic Mackey-Glass series ===", flush=True)
    series = mackey_glass(900)
    L = 8                                     # predict next value from 8 recent lags
    X = np.stack([series[i - L:i] for i in range(L, len(series))])
    y = series[L:]
    cut = int(len(y) * 0.75)                  # chronological split — never shuffle time
    Xtr, Xte, ytr, yte = X[:cut], X[cut:], y[:cut], y[cut:]
    print(f"series length={len(series)}  lag features L={L}  train={len(ytr)}  test={len(yte)}", flush=True)

    ridge = make_pipeline(StandardScaler(), Ridge(alpha=1.0)).fit(Xtr, ytr)
    # fixed sensible hyperparameters (grid-search offline gave the same regime)
    svr = make_pipeline(
        StandardScaler(), SVR(kernel="rbf", C=100, gamma=0.1, epsilon=0.005)
    ).fit(Xtr, ytr)

    for name, m in [("ridge (linear AR)", ridge), ("SVR (RBF)", svr)]:
        p = m.predict(Xte)
        print(f"  {name:<20} test RMSE={rmse(yte, p):.4f}  R^2={r2_score(yte, p):.4f}", flush=True)
    best = svr.named_steps["svr"]
    print(f"  SVR support vectors: {best.support_.shape[0]} of {len(ytr)}", flush=True)
    print(flush=True)


# ----------------------------------------------------------------------------- B
def case_robustness():
    print("=== Case B: robustness to outliers (same linear hypothesis) ===")
    rng = np.random.default_rng(1)
    n = 200
    X = rng.uniform(-3, 3, size=(n, 1))
    y = 1.5 * X[:, 0] - 0.5 + rng.normal(0, 0.4, n)     # genuinely LINEAR target
    idx = rng.permutation(n); tr, te = idx[:150], idx[150:]
    Xtr, Xte, ytr, yte = X[tr], X[te], y[tr], y[te]

    def fit_score(ytr_use):
        # SAME hypothesis class (linear); only the loss differs
        ols = LinearRegression().fit(Xtr, ytr_use)
        svr = SVR(kernel="linear", C=10, epsilon=0.1).fit(Xtr, ytr_use)
        return rmse(yte, ols.predict(Xte)), rmse(yte, svr.predict(Xte))

    o_clean, s_clean = fit_score(ytr)
    ytr_bad = ytr.copy()
    k = int(0.10 * len(ytr_bad))
    bad = rng.choice(len(ytr_bad), k, replace=False)
    ytr_bad[bad] += rng.choice([-1, 1], k) * rng.uniform(20, 30, k)   # gross outliers
    o_bad, s_bad = fit_score(ytr_bad)

    print(f"corrupted {k} of {len(ytr)} training targets ({100*k/len(ytr):.0f}%) with gross outliers")
    print(f"  least squares  test RMSE:  clean={o_clean:.4f}  ->  corrupted={o_bad:.4f}  "
          f"(x{o_bad/o_clean:.1f} worse)")
    print(f"  SVR (linear)   test RMSE:  clean={s_clean:.4f}  ->  corrupted={s_bad:.4f}  "
          f"(x{s_bad/s_clean:.1f} worse)")
    print()


if __name__ == "__main__":
    case_forecasting()
    case_robustness()
    print("done.")
