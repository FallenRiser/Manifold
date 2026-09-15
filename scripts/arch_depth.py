"""Depth, skip connections, and the diagnostic curves -- measured.

    python scripts/arch_depth.py
    python scripts/arch_depth.py 2 3      # run only sections 2 and 3

WHY THIS FILE EXISTS
--------------------
scripts/architecture_cases.py drives sklearn's MLPClassifier, which cannot
express a skip connection and replaces whatever initialisation you hand it. That
left three of this track's central claims untestable by its own script:

  * "a depth-20 width-16 ReLU net with He init reaches 0.750 test accuracy"
    -- architecture_cases.py section 5 measures 0.9400 for that architecture, and
    0.750 appears nowhere in its output. Five pages quote it.
  * "skip connections are what makes depth trainable" -- four pages argue this
    and nothing in the repo had ever run a residual network.
  * "regularising a model that is too big recovers the gap" -- section 8 prints
    that sentence directly underneath numbers where L2 makes the gap WORSE
    (0.0150 -> 0.0163) and test accuracy fall (0.9440 -> 0.9410).

So the network here is hand-rolled: He init is the init that trains, and a
residual block is a residual block.

Sections
  1. Is there a depth wall? Plain He+ReLU, width 16, depth 2..40.
  2. The same depths with skip connections -- the payoff for chapter 5.
  3. Gradient norm per layer, plain vs residual, at depth 20.
  4. Diagnostic learning curves on a problem small enough to overfit.
  5. The order of operations -- overfit first, then regularise.
  6. The residual stream explodes without normalisation -- forward scale by layer.
  7. Plain vs residual vs residual+BatchNorm under plain SGD, which is the
     regime where depth actually fails.

Deterministic: fixed seeds, numpy + sklearn's make_moons only.
Environment used for the published numbers: python 3.13.11, numpy 2.3.5,
sklearn 1.8.0.
"""

import sys
import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split

SEED = 0

# The same 800 two-moons points, split the same way, as architecture_cases.py,
# init_norm_cases.py, init_norm_train.py and the ARCH_SETUP / INIT_SETUP
# preambles. "Same data, same architecture, only X differs" is the entire
# argument of this track and it stops being true the moment the datasets drift.
X_all, y_all = make_moons(n_samples=800, noise=0.25, random_state=SEED)
X_TR, X_TE, Y_TR, Y_TE = train_test_split(X_all, y_all, test_size=0.25, random_state=SEED)


def rule(title):
    print()
    print("=" * 74)
    print(title)
    print("=" * 74)


# ---------------------------------------------------------------------------
# A small MLP with optional residual connections.
# ---------------------------------------------------------------------------
EPS = 1e-5


def build(sizes, seed, scale="he", bn=False):
    r = np.random.default_rng(seed)
    net = []
    for i in range(len(sizes) - 1):
        fan_in, fan_out = sizes[i], sizes[i + 1]
        s = np.sqrt(2.0 / fan_in) if scale == "he" else float(scale)
        L = {"W": r.normal(scale=s, size=(fan_in, fan_out)), "b": np.zeros(fan_out)}
        # BatchNorm sits inside the block, before the ReLU and before the
        # addition -- which is where a real ResNet puts it. Never on the output.
        if bn and i < len(sizes) - 2:
            L["g"] = np.ones(fan_out)
            L["be"] = np.zeros(fan_out)
            L["rm"] = np.zeros(fan_out)
            L["rv"] = np.ones(fan_out)
        net.append(L)
    return net


def forward(net, X, res=False, train_mode=True, momentum=0.9):
    """Residual form: h = relu(BN(Wx + b)) + x, applied on every hidden layer
    whose input and output widths match. The first hidden layer (2 -> width) and
    the output layer never carry a skip, which is how a ResNet stage works."""
    a = X
    cache = []
    last = len(net) - 1
    for i, L in enumerate(net):
        zr = a @ L["W"] + L["b"]
        z = zr
        c = {"a_in": a, "zr": zr}
        if "g" in L:
            if train_mode:
                mu, var = zr.mean(0), zr.var(0)
                L["rm"] = momentum * L["rm"] + (1 - momentum) * mu
                L["rv"] = momentum * L["rv"] + (1 - momentum) * var
            else:
                mu, var = L["rm"], L["rv"]
            inv = 1.0 / np.sqrt(var + EPS)
            zhat = (zr - mu) * inv
            z = L["g"] * zhat + L["be"]
            c.update({"zhat": zhat, "inv": inv})
        skip = res and i < last and a.shape[1] == z.shape[1]
        out = (np.maximum(0.0, z) + (a if skip else 0.0)) if i < last else z
        c.update({"z": z, "skip": skip})
        cache.append(c)
        a = out
    return a, cache


def backward(net, cache, y, logit):
    """Binary cross-entropy on the final logit. Also returns the per-layer
    gradient norms, which is the quantity chapter 5 argues about."""
    n = len(y)
    p = np.where(logit >= 0, 1.0 / (1.0 + np.exp(-np.abs(logit))),
                 np.exp(-np.abs(logit)) / (1.0 + np.exp(-np.abs(logit))))
    d = (p - y.reshape(-1, 1).astype(float)) / n
    grads = [None] * len(net)
    last = len(net) - 1
    for i in range(last, -1, -1):
        L, c = net[i], cache[i]
        skip_term = d if (i < last and c["skip"]) else 0.0
        dz = d * (c["z"] > 0).astype(float) if i < last else d
        g = {}
        if "g" in L:
            g["g"] = (dz * c["zhat"]).sum(0)
            g["be"] = dz.sum(0)
            dzhat = dz * L["g"]
            m = len(c["zr"])
            dz = c["inv"] / m * (m * dzhat - dzhat.sum(0)
                                 - c["zhat"] * (dzhat * c["zhat"]).sum(0))
        g["W"] = c["a_in"].T @ dz
        g["b"] = dz.sum(0)
        grads[i] = g
        # The skip path hands the gradient straight down, unmultiplied.
        # That identity term is the whole mechanism.
        d = dz @ L["W"].T + skip_term
    return grads


def train(net, X, y, epochs=60, lr=0.01, batch=64, seed=SEED, res=False, l2=0.0,
          opt="adam", record=None, probe=None):
    """record=N samples train/test accuracy every N epochs WITHIN this run.
    Sampling a curve by calling train() repeatedly would restart Adam's moment
    estimates at every sample, which is a materially gentler optimiser than the
    one being described."""
    r = np.random.default_rng(seed + 1000)
    state = [{k: [np.zeros_like(L[k]), np.zeros_like(L[k])]
              for k in L if k not in ("rm", "rv")} for L in net]
    t = 0
    curve = []
    for ep in range(epochs):
        order = r.permutation(len(X))
        for s in range(0, len(order), batch):
            idx = order[s:s + batch]
            if len(idx) < 4:
                continue
            logit, cache = forward(net, X[idx], res=res)
            grads = backward(net, cache, y[idx], logit)
            t += 1
            for L, g, st in zip(net, grads, state):
                for k, gv in g.items():
                    if l2 and k == "W":
                        gv = gv + l2 * L[k]
                    if not np.all(np.isfinite(gv)):
                        gv = np.zeros_like(gv)
                    if opt == "sgd":
                        L[k] -= lr * gv
                        continue
                    m, v = st[k]
                    m[:] = 0.9 * m + 0.1 * gv
                    v[:] = 0.999 * v + 0.001 * gv * gv
                    L[k] -= lr * (m / (1 - 0.9 ** t)) / (np.sqrt(v / (1 - 0.999 ** t)) + 1e-8)
        if record and (ep + 1) % record == 0:
            curve.append((ep + 1, accuracy(net, X, y, res=res),
                          accuracy(net, probe[0], probe[1], res=res)))
    return (net, curve) if record else net


def accuracy(net, X, y, res=False):
    logit, _ = forward(net, X, res=res, train_mode=False)
    return float(((logit.ravel() > 0).astype(int) == y).mean())


def run_depth(depth, width=16, res=False, seeds=(0, 1, 2), epochs=60, lr=0.01,
              bn=False, opt="adam"):
    trs, tes = [], []
    for s in seeds:
        net = build([2] + [width] * depth + [1], s, bn=bn)
        train(net, X_TR, Y_TR, epochs=epochs, lr=lr, seed=s, res=res, opt=opt)
        trs.append(accuracy(net, X_TR, Y_TR, res=res))
        tes.append(accuracy(net, X_TE, Y_TE, res=res))
    return (float(np.mean(trs)), float(np.mean(tes)),
            float(np.std(tes)), float(np.min(tes)))


DEPTHS = [2, 4, 6, 8, 12, 16, 20, 30, 40]


# ---------------------------------------------------------------------------
def section1():
    rule("SECTION 1: Is there a depth wall? (plain net, He init)")
    print("Width 16, ReLU, He init, Adam lr 0.01, 60 epochs, 3 seeds.")
    print("The published pages claim 0.750 test accuracy at depth 20.")
    print()
    print("%6s %8s %8s %8s %8s" % ("depth", "train", "test", "sd", "worst"))
    print("-" * 42)
    rows = []
    for d in DEPTHS:
        tr, te, sd, wo = run_depth(d)
        rows.append((d, tr, te, sd, wo))
        print("%6d %8.4f %8.4f %8.4f %8.4f" % (d, tr, te, sd, wo))
    print()
    print("majority class on this test set: %.4f" % max(Y_TE.mean(), 1 - Y_TE.mean()))
    print("PLAIN = [")
    for d, tr, te, sd, wo in rows:
        print("  { depth: %d, train: %.4f, test: %.4f, sd: %.4f, worst: %.4f }," % (d, tr, te, sd, wo))
    print("]")


def section2():
    rule("SECTION 2: The same depths, with skip connections")
    print("Identical in every respect except h = relu(Wx+b) + x on each hidden layer.")
    print()
    print("%6s %8s %8s %8s %9s" % ("depth", "plain", "residual", "delta", "res worst"))
    print("-" * 46)
    rows = []
    for d in DEPTHS:
        _, p_te, _, p_wo = run_depth(d, res=False)
        r_tr, r_te, r_sd, r_wo = run_depth(d, res=True)
        rows.append((d, p_te, r_te, r_sd, r_wo, p_wo))
        print("%6d %8.4f %8.4f %+8.4f %9.4f" % (d, p_te, r_te, r_te - p_te, r_wo))
    print()
    print("RESID = [")
    for d, p, r, sd, wo, pwo in rows:
        print("  { depth: %d, plain: %.4f, residual: %.4f, sd: %.4f, resWorst: %.4f, plainWorst: %.4f }," % (d, p, r, sd, wo, pwo))
    print("]")


def section3():
    rule("SECTION 3: Gradient norm per layer, plain vs residual")
    print("At He init (before any training), width 16, depth 20, full training batch.")
    print("Layer 1 is the input side; layer 21 is the output side.")
    print()
    for label, res in (("plain", False), ("residual", True)):
        net = build([2] + [16] * 20 + [1], 0)
        logit, cache = forward(net, X_TR, res=res)
        grads = backward(net, cache, Y_TR, logit)
        norms = [float(np.linalg.norm(g["W"])) for g in grads]
        print("%s:" % label)
        print("  " + "  ".join("%.3e" % n for n in norms))
        print("  first/last ratio = %.4f" % (norms[0] / norms[-1]))
        print("  GRAD_%s = [%s]" % (label.upper(), ", ".join("%.6g" % n for n in norms)))
        print()
    print("Now the same measurement AFTER 60 epochs of training:")
    for label, res in (("plain", False), ("residual", True)):
        net = build([2] + [16] * 20 + [1], 0)
        train(net, X_TR, Y_TR, seed=0, res=res)
        logit, cache = forward(net, X_TR, res=res)
        grads = backward(net, cache, Y_TR, logit)
        norms = [float(np.linalg.norm(g["W"])) for g in grads]
        print("  %-9s first/last = %.4f   first = %.3e  last = %.3e"
              % (label, norms[0] / norms[-1], norms[0], norms[-1]))
        print("  GRAD_%s_TRAINED = [%s]" % (label.upper(), ", ".join("%.6g" % n for n in norms)))


def section4():
    rule("SECTION 4: Diagnostic learning curves")
    print("architecture_cases.py section 6 labels a 3x128 net 'overfit' and measures")
    print("a gap of 0.0100 -- smaller than some of its 'fit' rows. 600 training points")
    print("of two moons cannot be overfit by any architecture. Here the training set is")
    print("cut to 40 points, which is the regime where the four shapes are actually")
    print("distinguishable, and the curve is sampled inside one continuous run.")
    print()
    r = np.random.default_rng(7)
    idx = r.choice(len(X_TR), 40, replace=False)
    Xs, ys = X_TR[idx], Y_TR[idx]

    cases = [
        ("underfit (1x2)",     [2] + [2] + [1],       0.01),
        ("good fit (2x16)",    [2] + [16] * 2 + [1],  0.01),
        ("overfit (4x128)",    [2] + [128] * 4 + [1], 0.01),
        ("lr too high (2x16)", [2] + [16] * 2 + [1],  1.0),
    ]
    for label, sizes, lr in cases:
        curves = []
        for s in (0, 1, 2):
            net = build(sizes, s)
            _, c = train(net, Xs, ys, epochs=400, lr=lr, batch=16, seed=s,
                         record=10, probe=(X_TE, Y_TE))
            curves.append(c)
        eps = [row[0] for row in curves[0]]
        tr_m = np.mean([[row[1] for row in c] for c in curves], axis=0)
        te_m = np.mean([[row[2] for row in c] for c in curves], axis=0)
        print("%-20s final train %.4f  test %.4f  gap %+.4f   best test %.4f at epoch %d"
              % (label, tr_m[-1], te_m[-1], tr_m[-1] - te_m[-1],
                 te_m.max(), eps[int(np.argmax(te_m))]))
        print("   epochs = [%s]" % ", ".join(str(e) for e in eps))
        print("   train  = [%s]" % ", ".join("%.4f" % v for v in tr_m))
        print("   test   = [%s]" % ", ".join("%.4f" % v for v in te_m))
        print()


def section5():
    rule("SECTION 5: The order of operations -- overfit first, then regularise")
    print("On the same 40 training points. A 4x128 net, with and without L2.")
    print("Then the same treatment applied to a net that is too small.")
    print()
    r = np.random.default_rng(7)
    idx = r.choice(len(X_TR), 40, replace=False)
    Xs, ys = X_TR[idx], Y_TR[idx]

    def go(sizes, l2):
        trs, tes = [], []
        for s in (0, 1, 2):
            net = build(sizes, s)
            train(net, Xs, ys, epochs=400, lr=0.01, batch=16, seed=s, l2=l2)
            trs.append(accuracy(net, Xs, ys))
            tes.append(accuracy(net, X_TE, Y_TE))
        return float(np.mean(trs)), float(np.mean(tes))

    print("%-24s %8s %8s %8s" % ("", "train", "test", "gap"))
    print("-" * 52)
    rows = []
    for label, sizes, l2 in [
        ("big (4x128), no L2", [2] + [128] * 4 + [1], 0.0),
        ("big (4x128), L2 1e-2", [2] + [128] * 4 + [1], 1e-2),
        ("big (4x128), L2 1e-1", [2] + [128] * 4 + [1], 1e-1),
        ("small (1x2), no L2", [2] + [2] + [1], 0.0),
        ("small (1x2), L2 1e-2", [2] + [2] + [1], 1e-2),
    ]:
        tr, te = go(sizes, l2)
        rows.append((label, tr, te))
        print("%-24s %8.4f %8.4f %8.4f" % (label, tr, te, tr - te))
    print()
    print("ORDER = [")
    for label, tr, te in rows:
        print("  { label: \"%s\", train: %.4f, test: %.4f }," % (label, tr, te))
    print("]")


def section6():
    rule("SECTION 6: The residual stream, and why a bare skip is not enough")
    print("Std of the activations leaving each hidden layer, at He init, depth 20,")
    print("width 16, measured on the 600 training points.")
    print()
    for label, res, bn in (("plain", False, False),
                           ("residual (no norm)", True, False),
                           ("residual + BatchNorm", True, True)):
        net = build([2] + [16] * 20 + [1], 0, bn=bn)
        _, cache = forward(net, X_TR, res=res)
        # a_in of layer i+1 is the output of layer i
        outs = [float(c["a_in"].std()) for c in cache[1:]]
        print("%-22s %s" % (label, "  ".join("%.3g" % v for v in outs[:6]) + "  ...  "
                            + "  ".join("%.3g" % v for v in outs[-3:])))
        print("%-22s ACT = [%s]" % ("", ", ".join("%.6g" % v for v in outs)))
        print("%-22s first %.4f -> last %.4f  (x%.1f)"
              % ("", outs[0], outs[-1], outs[-1] / outs[0]))
        print()


def section7():
    rule("SECTION 7: Plain SGD -- the regime where depth actually fails")
    print("Adam rescues deep plain networks by rescaling every parameter's step,")
    print("which is why sections 1 and 2 show no depth wall. Plain SGD does not.")
    print("Width 16, He init, SGD lr 0.1, 60 epochs, 3 seeds.")
    print()
    print("%6s %9s %9s %9s" % ("depth", "plain", "residual", "res+BN"))
    print("-" * 38)
    rows = []
    for d in [2, 4, 8, 12, 20, 30, 40]:
        _, p_te, p_sd, _ = run_depth(d, opt="sgd", lr=0.1)
        _, r_te, r_sd, _ = run_depth(d, res=True, opt="sgd", lr=0.1)
        _, b_te, b_sd, _ = run_depth(d, res=True, bn=True, opt="sgd", lr=0.1)
        rows.append((d, p_te, r_te, b_te, p_sd, r_sd, b_sd))
        print("%6d %9.4f %9.4f %9.4f" % (d, p_te, r_te, b_te))
    print()
    print("SGD = [")
    for d, p, r, b, ps, rs, bs in rows:
        print("  { depth: %d, plain: %.4f, residual: %.4f, resBN: %.4f,"
              " plainSd: %.4f, residualSd: %.4f, resBNSd: %.4f }," % (d, p, r, b, ps, rs, bs))
    print("]")
    print()
    print("majority class on this test set: %.4f" % max(Y_TE.mean(), 1 - Y_TE.mean()))


SECTIONS = {1: section1, 2: section2, 3: section3, 4: section4, 5: section5,
            6: section6, 7: section7}

if __name__ == "__main__":
    wanted = [int(a) for a in sys.argv[1:]] or sorted(SECTIONS)
    for k in wanted:
        SECTIONS[k]()
