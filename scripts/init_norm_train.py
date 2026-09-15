"""What init and normalisation do when you actually TRAIN.

    python scripts/init_norm_train.py
    python scripts/init_norm_train.py 3        # run only section 3

scripts/init_norm_cases.py measures the network AT INITIALISATION -- activation
variances, gradient norms, dead fractions. That is half the story, and it is the
half that cannot answer the track's actual question: does any of this change the
model you end up with?

It could not answer it because it leaned on sklearn's MLPClassifier, which
ignores the init you hand it and uses its own. So every init scale in that
script's section 1 reports the identical 0.9567 / 0.9440. This file fixes that
by hand-rolling the whole thing in numpy -- Linear (+ optional BatchNorm) + ReLU,
binary cross-entropy, Adam -- so the initialisation under test is the
initialisation that trains.

Sections
  1. Init scale vs what you actually get. Same architecture, same data, same
     budget; only the starting weights differ.
  2. BatchNorm, measured. Activation std through the depth of the net, and test
     accuracy vs depth, with and without it.
  3. Why normalisation reduces init sensitivity -- the track's thesis, as a
     number: the SPREAD of outcomes across init scales, with and without BN.

Deterministic: fixed seeds, numpy + sklearn's make_moons only.
Environment used for the published numbers: python 3.13.11, numpy 2.3.5,
sklearn 1.8.0.
"""

import sys
import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split

SEED = 0
EPS = 1e-5

# Deliberately the same dataset as scripts/init_norm_cases.py and as the
# in-browser INIT_SETUP preamble, so every number in this track describes the
# same 600 training points. "Same data, same architecture, only X differs" is
# the whole argument; it stops being true the moment the datasets drift.
X_all, y_all = make_moons(n_samples=800, noise=0.25, random_state=SEED)
X_tr, X_te, y_tr, y_te = train_test_split(X_all, y_all, test_size=0.25, random_state=SEED)


def rule(title):
    print()
    print("=" * 74)
    print(title)
    print("=" * 74)


def scale_for(kind, fan_in):
    if kind == "xavier":
        return np.sqrt(1.0 / fan_in)
    if kind == "he":
        return np.sqrt(2.0 / fan_in)
    return float(kind)


def build(sizes, kind, seed, bn=False):
    r = np.random.default_rng(seed)
    net = []
    for i in range(len(sizes) - 1):
        fan_in, fan_out = sizes[i], sizes[i + 1]
        s = scale_for(kind, fan_in)
        W = r.normal(scale=s, size=(fan_in, fan_out)) if s > 0 else np.zeros((fan_in, fan_out))
        layer = {"W": W, "b": np.zeros(fan_out)}
        # BatchNorm on every hidden layer, never on the output.
        if bn and i < len(sizes) - 2:
            layer["g"] = np.ones(fan_out)
            layer["be"] = np.zeros(fan_out)
            layer["rm"] = np.zeros(fan_out)
            layer["rv"] = np.ones(fan_out)
        net.append(layer)
    return net


def forward(net, X, train=True, momentum=0.9):
    """Returns logits plus the cache each layer needs for its backward pass."""
    a = X
    cache = []
    last = len(net) - 1
    for i, L in enumerate(net):
        z = a @ L["W"] + L["b"]
        c = {"a_in": a, "z": z}
        if "g" in L:
            if train:
                mu, var = z.mean(0), z.var(0)
                L["rm"] = momentum * L["rm"] + (1 - momentum) * mu
                L["rv"] = momentum * L["rv"] + (1 - momentum) * var
            else:
                mu, var = L["rm"], L["rv"]
            inv = 1.0 / np.sqrt(var + EPS)
            zhat = (z - mu) * inv
            z = L["g"] * zhat + L["be"]
            c.update({"zhat": zhat, "inv": inv})
        if i < last:
            a = np.maximum(0.0, z)
        else:
            a = z
        c["a_out"] = a
        cache.append(c)
    return a, cache


def backward(net, cache, y):
    """Binary cross-entropy on the final logit. Returns grads parallel to net."""
    n = len(y)
    logit = cache[-1]["a_out"]
    p = np.where(logit >= 0, 1.0 / (1.0 + np.exp(-np.abs(logit))),
                 np.exp(-np.abs(logit)) / (1.0 + np.exp(-np.abs(logit))))
    d = (p - y.reshape(-1, 1).astype(float)) / n
    grads = [None] * len(net)
    for i in range(len(net) - 1, -1, -1):
        L, c = net[i], cache[i]
        if i < len(net) - 1:
            d = d * (c["a_out"] > 0).astype(float)   # through the ReLU
        g = {}
        if "g" in L:
            g["g"] = (d * c["zhat"]).sum(0)
            g["be"] = d.sum(0)
            dzhat = d * L["g"]
            m = len(c["z"])
            # the three terms of the BatchNorm backward pass
            d = c["inv"] / m * (m * dzhat - dzhat.sum(0) - c["zhat"] * (dzhat * c["zhat"]).sum(0))
        g["W"] = c["a_in"].T @ d
        g["b"] = d.sum(0)
        grads[i] = g
        if i > 0:
            d = d @ L["W"].T
    return grads


def train(net, epochs=60, lr=0.01, batch=64, seed=SEED):
    r = np.random.default_rng(seed + 1000)
    state = [{k: [np.zeros_like(L[k]), np.zeros_like(L[k])]
              for k in L if k not in ("rm", "rv")} for L in net]
    t = 0
    for _ in range(epochs):
        order = r.permutation(len(X_tr))
        for s in range(0, len(order), batch):
            idx = order[s:s + batch]
            if len(idx) < 4:
                continue
            _, cache = forward(net, X_tr[idx], train=True)
            grads = backward(net, cache, y_tr[idx])
            t += 1
            for L, g, st in zip(net, grads, state):
                for k, gv in g.items():
                    if not np.all(np.isfinite(gv)):
                        gv = np.zeros_like(gv)
                    m, v = st[k]
                    m[:] = 0.9 * m + 0.1 * gv
                    v[:] = 0.999 * v + 0.001 * gv * gv
                    mh = m / (1 - 0.9 ** t)
                    vh = v / (1 - 0.999 ** t)
                    L[k] -= lr * mh / (np.sqrt(vh) + 1e-8)
    return net


def accuracy(net, X, y):
    logit, _ = forward(net, X, train=False)
    return float(((logit.ravel() > 0).astype(int) == y).mean())


def act_stds(net, X):
    """Post-activation std per hidden layer, at whatever state the net is in."""
    _, cache = forward(net, X, train=False)
    return [float(c["a_out"].std()) for c in cache[:-1]]


def run(kind, depth=8, width=32, bn=False, seeds=(0, 1, 2)):
    accs = []
    for s in seeds:
        net = build([2] + [width] * depth + [1], kind, s, bn=bn)
        train(net, seed=s)
        accs.append(accuracy(net, X_te, y_te))
    return float(np.mean(accs)), float(np.std(accs))


# ---------------------------------------------------------------------------
def section1():
    rule("SECTION 1: Init scale vs what you actually get")
    print("8 hidden layers of width 32, ReLU, Adam lr 0.01, 60 epochs, 3 seeds.")
    print("Only the starting weights differ.")
    print()
    print("%10s %12s %10s %7s" % ("init", "w std (L1)", "test acc", "+/-"))
    print("-" * 44)
    for kind in ["0.001", "0.01", "xavier", "he", "1.0", "5.0"]:
        m, sd = run(kind)
        print("%10s %12.4f %10.4f %7.4f" % (kind, scale_for(kind, 32), m, sd))
    print()
    print("Majority class on this test set: %.4f" % max(y_te.mean(), 1 - y_te.mean()))


def section2():
    rule("SECTION 2: BatchNorm, measured")
    print("Post-activation std per hidden layer AFTER training (He init, depth 10).")
    print()
    for bn in (False, True):
        net = build([2] + [32] * 10 + [1], "he", SEED, bn=bn)
        train(net, seed=SEED)
        stds = act_stds(net, X_te)
        tag = "with BN   " if bn else "without BN"
        print("  " + tag + ": " + "  ".join("%.3f" % v for v in stds))
    print()
    print("Test accuracy vs depth, He init, 3 seeds:")
    print()
    print("%7s %9s %9s %8s" % ("depth", "no BN", "with BN", "gain"))
    print("-" * 36)
    for d in [2, 4, 8, 12, 16, 20]:
        a0, _ = run("he", depth=d, bn=False)
        a1, _ = run("he", depth=d, bn=True)
        print("%7d %9.4f %9.4f %+8.4f" % (d, a0, a1, a1 - a0))


def section3():
    rule("SECTION 3: Why normalisation reduces init sensitivity")
    print("The thesis as a number: how much does the CHOICE of init still matter")
    print("once BatchNorm is in the network? Depth 8, width 32, 3 seeds.")
    print()
    print("%10s %9s %9s" % ("init", "no BN", "with BN"))
    print("-" * 30)
    rows = []
    for kind in ["0.001", "0.01", "xavier", "he", "1.0", "5.0"]:
        a0, _ = run(kind, bn=False)
        a1, _ = run(kind, bn=True)
        rows.append((kind, a0, a1))
        print("%10s %9.4f %9.4f" % (kind, a0, a1))
    sp0 = max(r[1] for r in rows) - min(r[1] for r in rows)
    sp1 = max(r[2] for r in rows) - min(r[2] for r in rows)
    print("-" * 30)
    print("%10s %9.4f %9.4f" % ("spread", sp0, sp1))
    print()
    print("The spread across init scales is what 'init sensitivity' means.")
    print("Shrinking it is what normalisation is FOR.")


SECTIONS = {1: section1, 2: section2, 3: section3}

if __name__ == "__main__":
    wanted = [int(a) for a in sys.argv[1:]] or sorted(SECTIONS)
    for k in wanted:
        SECTIONS[k]()
