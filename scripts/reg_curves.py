"""Per-epoch curves for the Regularisation track's figures.

    python scripts/reg_curves.py        # -> results/reg_curves.json

scripts/regularisation_cases.py already trains the right networks, but it keeps
only the summary — "best validation epoch 34, test MSE 0.0118 there and 0.0760
at the end". Those three numbers are the ones the pages publish, and they are
also the three that a reader cannot picture, because the thing being described
is the SHAPE of a curve between them.

This file re-runs the identical setups (same seeds, same architecture, same
optimiser, same splits) and records the whole trajectory, so the figures plot
the same runs the prose describes rather than an artist's impression of them.
The summary numbers it prints should match regularisation_cases.py section 6
exactly; if they drift, one of the two files has been edited and the figures are
no longer describing the published run.
"""

import json
import os
import numpy as np
import torch
import torch.nn as nn
from sklearn.model_selection import train_test_split

torch.set_num_threads(4)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVERY = 5   # the evaluation cadence regularisation_cases.py uses


class RegMLP(nn.Module):
    def __init__(self, width=256, depth=3):
        super().__init__()
        layers, d = [], 1
        for _ in range(depth):
            layers += [nn.Linear(d, width), nn.ReLU()]
            d = width
        layers.append(nn.Linear(d, 1))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


def run(seed, epochs=4000, lr=1e-3):
    """Identical to reg_es() in regularisation_cases.py, but logging the curves."""
    torch.manual_seed(seed)
    rng = np.random.RandomState(seed)
    X = rng.uniform(-3, 3, (80, 1)).astype(np.float32)
    f = lambda x: np.sin(1.5 * x) + 0.3 * x
    y = (f(X) + rng.normal(0, 0.3, X.shape)).astype(np.float32)
    Xtr, Xv, ytr, yv = train_test_split(X, y, train_size=56, random_state=seed)
    Xte = np.linspace(-3, 3, 400).reshape(-1, 1).astype(np.float32)
    yte = f(Xte).astype(np.float32)
    tt = torch.tensor
    Xtr, ytr, Xv, yv, Xte, yte = tt(Xtr), tt(ytr), tt(Xv), tt(yv), tt(Xte), tt(yte)

    m = RegMLP()
    opt = torch.optim.Adam(m.parameters(), lr=lr)
    lossf = nn.MSELoss()
    eps, tr_c, va_c, te_c = [], [], [], []
    best_val, best_ep = 1e9, -1
    for ep in range(epochs):
        m.train()
        opt.zero_grad()
        trl = lossf(m(Xtr), ytr)
        trl.backward()
        opt.step()
        if ep % EVERY == 0:
            m.eval()
            with torch.no_grad():
                vl = lossf(m(Xv), yv).item()
                tl = lossf(m(Xte), yte).item()
            eps.append(ep)
            tr_c.append(float(trl.item()))
            va_c.append(vl)
            te_c.append(tl)
            if vl < best_val:
                best_val, best_ep = vl, ep
    return {"epochs": eps, "train": tr_c, "val": va_c, "test": te_c, "best_epoch": best_ep}


if __name__ == "__main__":
    runs = [run(s) for s in (0, 1, 2, 3, 4)]
    eps = runs[0]["epochs"]
    mean = lambda k: [float(np.mean([r[k][i] for r in runs])) for i in range(len(eps))]
    train, val, test = mean("train"), mean("val"), mean("test")
    best_i = int(np.argmin(val))

    print("5-seed average, evaluated every %d epochs" % EVERY)
    print("  best-val epoch (avg of per-seed minima): %.0f of 4000"
          % np.mean([r["best_epoch"] for r in runs]))
    print("  epoch of the minimum of the AVERAGED val curve: %d" % eps[best_i])
    print("  test MSE at that epoch : %.4f" % test[best_i])
    print("  test MSE at epoch 4000 : %.4f" % test[-1])
    print("  train MSE at epoch 4000: %.6f" % train[-1])

    # Thin for the figure: dense early where the action is, sparse later.
    keep = [i for i, e in enumerate(eps) if e <= 200 or e % 100 == 0]
    out = {
        "every": EVERY,
        "best_epoch_avg": float(np.mean([r["best_epoch"] for r in runs])),
        "best_epoch_of_mean_curve": eps[best_i],
        "test_at_best": test[best_i],
        "test_at_end": test[-1],
        "epochs": [eps[i] for i in keep],
        "train": [round(train[i], 6) for i in keep],
        "val": [round(val[i], 6) for i in keep],
        "test": [round(test[i], 6) for i in keep],
    }
    os.makedirs(os.path.join(ROOT, "results"), exist_ok=True)
    path = os.path.join(ROOT, "results", "reg_curves.json")
    with open(path, "w") as fh:
        json.dump(out, fh, indent=1)
    print("wrote %s (%d points)" % (path, len(out["epochs"])))
