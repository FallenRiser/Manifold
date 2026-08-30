"""Real numbers for the Activation functions track (PROJECT.md §11 rules 9-10).

Deterministic: fixed seeds, no network, stdlib + numpy + sklearn only.

    python scripts/activation_cases.py

Sections
  1. The anatomy table -- range, max slope, and how much of the input line each
     activation has effectively switched off.
  2. Saturation with depth -- per-layer gradient norms for the whole zoo, not
     just the three the backprop track measured.
  3. Dying ReLU -- units counted, not asserted, and what the leaky family does
     about it.
  4. Zero-centring -- the all-positive-output claim, measured as the fraction of
     weight-gradient rows whose entries all share a sign.
  5. The bakeoff -- same data, same net, same seeds, swap only the activation.
     Run at two depths, because that is the variable that decides whether the
     choice matters at all.
  6. Cost -- an exp() per unit per step is not free.
  7. Designing one -- Swish's shape derived from requirements, and how close the
     result lands to GELU.

Anything printed under "LAB DATA" is copied verbatim into a lab component.

Environment used for the published numbers: python 3.13.11, numpy 2.3.5,
sklearn 1.8.0.
"""

import time

import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split

SEED = 0
SQRT_2_OVER_PI = np.sqrt(2.0 / np.pi)


def rule(title):
    print("\n" + "=" * 74)
    print(title)
    print("=" * 74)


# ----------------------------------------------------------------------------
# The zoo. Every activation is a (value, derivative) pair -- the derivative is
# the half that decides whether learning happens, so it is never optional here.
# ----------------------------------------------------------------------------
def sigmoid(z):
    return np.where(z >= 0, 1.0 / (1.0 + np.exp(-np.abs(z))),
                    np.exp(-np.abs(z)) / (1.0 + np.exp(-np.abs(z))))


def f(z, act):
    if act == "sigmoid":
        return sigmoid(z)
    if act == "tanh":
        return np.tanh(z)
    if act == "relu":
        return np.maximum(0.0, z)
    if act == "leaky":
        return np.where(z > 0, z, 0.01 * z)
    if act == "elu":
        return np.where(z > 0, z, np.expm1(np.minimum(z, 0.0)))
    if act == "selu":
        lam, alpha = 1.0507009873554805, 1.6732632423543772
        return lam * np.where(z > 0, z, alpha * np.expm1(np.minimum(z, 0.0)))
    if act == "gelu":
        # The tanh approximation, which is what most frameworks ship.
        return 0.5 * z * (1.0 + np.tanh(SQRT_2_OVER_PI * (z + 0.044715 * z ** 3)))
    if act == "swish":
        return z * sigmoid(z)
    if act == "mish":
        return z * np.tanh(np.log1p(np.exp(-np.abs(z))) + np.maximum(z, 0.0))
    if act == "softplus":
        return np.log1p(np.exp(-np.abs(z))) + np.maximum(z, 0.0)
    if act == "identity":
        return z
    raise ValueError(act)


def df(z, act):
    """Derivative, computed from z alone so it is independent of the forward
    cache -- this is the quantity every claim in the track is about."""
    if act == "sigmoid":
        s = sigmoid(z)
        return s * (1.0 - s)
    if act == "tanh":
        return 1.0 - np.tanh(z) ** 2
    if act == "relu":
        return (z > 0).astype(float)
    if act == "leaky":
        return np.where(z > 0, 1.0, 0.01)
    if act == "elu":
        return np.where(z > 0, 1.0, np.exp(np.minimum(z, 0.0)))
    if act == "selu":
        lam, alpha = 1.0507009873554805, 1.6732632423543772
        return lam * np.where(z > 0, 1.0, alpha * np.exp(np.minimum(z, 0.0)))
    if act == "gelu":
        u = SQRT_2_OVER_PI * (z + 0.044715 * z ** 3)
        t = np.tanh(u)
        return 0.5 * (1.0 + t) + 0.5 * z * (1.0 - t ** 2) * SQRT_2_OVER_PI * (1 + 3 * 0.044715 * z ** 2)
    if act == "swish":
        s = sigmoid(z)
        return s + z * s * (1.0 - s)
    if act == "mish":
        h = 1e-6
        return (f(z + h, "mish") - f(z - h, "mish")) / (2 * h)
    if act == "softplus":
        return sigmoid(z)
    if act == "identity":
        return np.ones_like(z)
    raise ValueError(act)


ZOO = ["sigmoid", "tanh", "relu", "leaky", "elu", "selu", "gelu", "swish", "mish", "softplus"]


# ----------------------------------------------------------------------------
# 1. The anatomy table
# ----------------------------------------------------------------------------
def section1():
    rule("1. ANATOMY -- range, peak slope, and how much of the line is switched off")

    grid = np.linspace(-8, 8, 160001)
    print(f"{'activation':>10} {'output range':>18} {'max slope':>10} "
          f"{'slope<0.01 on [-8,8]':>22} {'zero-centred':>13}")
    rows = []
    for act in ZOO:
        v, d = f(grid, act), df(grid, act)
        dead = float(np.mean(np.abs(d) < 0.01))
        lo, hi = float(v.min()), float(v.max())
        rng = f"[{lo:.2f}, {hi:.2f}]" if hi < 100 else f"[{lo:.2f}, inf)"
        rows.append((act, lo, hi, float(np.abs(d).max()), dead))
        print(f"{act:>10} {rng:>18} {np.abs(d).max():>10.3f} {dead * 100:>21.1f}% "
              f"{'yes' if lo < -0.05 else 'no':>13}")

    print("\n  'Switched off' means the derivative is below 0.01 -- a factor that "
          "small,\n  multiplied twelve times, is the vanishing gradient.")
    print("\n--- LAB DATA: anatomy rows (act, min, max, max_slope, dead_fraction) ---")
    print([[r[0], round(r[1], 4), round(r[2], 4) if r[2] < 100 else None,
            round(r[3], 4), round(r[4], 4)] for r in rows])


# ----------------------------------------------------------------------------
# A minimal MLP, deliberately the same one the backprop track used, so the
# numbers here continue that track's rather than restarting.
# ----------------------------------------------------------------------------
def init(sizes, scale="he", seed=SEED):
    r = np.random.default_rng(seed)
    params = []
    for i in range(len(sizes) - 1):
        fan_in = sizes[i]
        if scale == "xavier":
            s = np.sqrt(1.0 / fan_in)
        elif scale == "he":
            s = np.sqrt(2.0 / fan_in)
        else:
            s = float(scale)
        params.append([r.normal(scale=s, size=(fan_in, sizes[i + 1])),
                       np.zeros(sizes[i + 1])])
    return params


def forward(X, params, act):
    zs, as_ = [], [X]
    a = X
    for i, (W, b) in enumerate(params):
        z = a @ W + b
        zs.append(z)
        a = f(z, act) if i < len(params) - 1 else z
        as_.append(a)
    return a, (zs, as_)


def loss_and_grads(X, y, params, act):
    logit, (zs, as_) = forward(X, params, act)
    p = sigmoid(logit)
    eps = 1e-12
    loss = float(np.mean(-y * np.log(p + eps) - (1 - y) * np.log(1 - p + eps)))
    grads = [None] * len(params)
    delta = (p - y) / len(X)
    for i in range(len(params) - 1, -1, -1):
        W, _ = params[i]
        grads[i] = [as_[i].T @ delta, delta.sum(0)]
        if i > 0:
            delta = (delta @ W.T) * df(zs[i - 1], act)
    norms = [float(np.linalg.norm(g[0])) for g in grads]
    return loss, grads, norms


def spirals(n_per=300, turns=3.0, noise=0.045, seed=SEED):
    """The same construction as the Perceptron -> MLP track: two interleaved
    arms, so the task genuinely needs the hidden layers."""
    r = np.random.default_rng(seed)
    t = np.sqrt(r.uniform(size=n_per)) * turns * 2 * np.pi
    out = []
    for sign in (1.0, -1.0):
        x = sign * t * np.cos(t) / (turns * 2 * np.pi)
        yv = sign * t * np.sin(t) / (turns * 2 * np.pi)
        out.append(np.stack([x, yv], 1) + r.normal(scale=noise, size=(n_per, 2)))
    X = np.concatenate(out)
    y = np.concatenate([np.zeros(n_per), np.ones(n_per)])
    return X, y


# ----------------------------------------------------------------------------
# 2. Saturation with depth
# ----------------------------------------------------------------------------
def section2():
    rule("2. GRADIENT FLOW BY ACTIVATION -- 12 hidden layers, identical weights")

    # Deliberately the same data, depth and init as section 3 of
    # scripts/backprop_cases.py, so sigmoid/tanh/relu reproduce that track's
    # published numbers exactly and this section only widens the comparison.
    X, y = make_moons(n_samples=400, noise=0.2, random_state=SEED)
    y = y.reshape(-1, 1).astype(float)
    sizes = [2] + [16] * 12 + [1]

    print(f"{'activation':>10} {'layer 1':>12} {'layer 13':>12} {'ratio last/first':>18}")
    out = {}
    for act in ["sigmoid", "tanh", "relu", "leaky", "elu", "gelu", "swish"]:
        params = init(sizes, scale="xavier", seed=SEED)
        _, _, norms = loss_and_grads(X, y, params, act)
        out[act] = norms
        print(f"{act:>10} {norms[0]:>12.3e} {norms[-1]:>12.3e} "
              f"{norms[-1] / norms[0]:>18.4g}")

    print("\n  Same weights, same data, same depth. The only difference is which "
          "curve the\n  signal passes through on the way back.")
    print("\n--- LAB DATA: per-layer gradient norms by activation ---")
    for k, v in out.items():
        print(f'  {k}: {[float(f"{n:.4g}") for n in v]},')


# ----------------------------------------------------------------------------
# 3. Dying ReLU
# ----------------------------------------------------------------------------
def train(X, y, Xte, yte, act, sizes, lr=0.05, steps=1200, seed=SEED,
          opt="adam", track_dead=False):
    params = init(list(sizes), scale="he", seed=seed)
    m = [[np.zeros_like(W), np.zeros_like(b)] for W, b in params]
    v = [[np.zeros_like(W), np.zeros_like(b)] for W, b in params]
    curve, deadhist = [], []
    for t in range(1, steps + 1):
        loss, grads, _ = loss_and_grads(X, y, params, act)
        if t % max(1, steps // 20) == 1:
            curve.append(round(float(loss), 4))
            if track_dead:
                deadhist.append(count_dead(X, params, act))
        for li in range(len(params)):
            for pi in range(2):
                g = grads[li][pi]
                if opt == "sgd":
                    params[li][pi] -= lr * g
                else:
                    m[li][pi] = 0.9 * m[li][pi] + 0.1 * g
                    v[li][pi] = 0.999 * v[li][pi] + 0.001 * g * g
                    mh = m[li][pi] / (1 - 0.9 ** t)
                    vh = v[li][pi] / (1 - 0.999 ** t)
                    params[li][pi] -= lr * mh / (np.sqrt(vh) + 1e-8)
    final, _, _ = loss_and_grads(X, y, params, act)
    logit, _ = forward(Xte, params, act)
    acc = float(np.mean((logit > 0).astype(float) == yte))
    return float(final), acc, curve, deadhist, params


def count_dead(X, params, act):
    """A unit is dead when its OUTPUT SLOPE is essentially zero for every
    training row -- that is the condition under which no gradient can reach the
    weights that feed it, whatever the activation."""
    _, (zs, _) = forward(X, params, act)
    return int(sum(int((np.abs(df(z, act)) < 1e-3).all(0).sum()) for z in zs[:-1]))


def section3():
    rule("3. DYING UNITS -- counted, for the ReLU family and its answers")

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)
    ytr, yte = ytr.reshape(-1, 1).astype(float), yte.reshape(-1, 1).astype(float)
    sizes = [2, 32, 32, 1]
    TOTAL = 64

    print("  ReLU alone, across learning rates -- where does the damage start?")
    print(f"{'lr':>7} {'dead at end':>13} {'final loss':>12} {'test acc':>10}")
    for lr in [0.1, 1.0, 3.0, 10.0, 30.0]:
        final, acc, _, _, params = train(Xtr, ytr, Xte, yte, "relu", sizes,
                                         lr=lr, steps=800, opt="sgd")
        print(f"{lr:>7} {count_dead(Xtr, params, 'relu'):>8} of {TOTAL} "
              f"{final:>12.4f} {acc:>10.4f}")

    LR = 3.0
    print(f"\n  the same run at lr = {LR}, with the activation swapped:")
    print(f"{'activation':>10} {'dead at end':>13} {'final loss':>12} {'test acc':>10}")
    lab = {}
    for act in ["relu", "leaky", "elu", "gelu", "swish"]:
        final, acc, curve, dh, params = train(
            Xtr, ytr, Xte, yte, act, sizes, lr=LR, steps=800,
            opt="sgd", track_dead=True)
        lab[act] = {"dead": dh, "curve": curve, "acc": acc,
                    "final_dead": count_dead(Xtr, params, act)}
        print(f"{act:>10} {lab[act]['final_dead']:>8} of {TOTAL} {final:>12.4f} "
              f"{acc:>10.4f}")

    print("\n  A dead unit is not a metaphor: it is a unit whose derivative is "
          "zero for\n  every row in the training set, so no update of any size "
          "can reach it.")
    print("\n--- LAB DATA: DyingReLULab (dead count every 40 steps) ---")
    for k, v in lab.items():
        print(f'  {k}: {{ dead: {v["dead"]}, curve: {v["curve"]}, acc: {v["acc"]:.4f} }},')


# ----------------------------------------------------------------------------
# 4. Zero-centring
# ----------------------------------------------------------------------------
def section4():
    rule("4. ZERO-CENTRING -- what an all-positive output does to the gradient")

    X, y = make_moons(n_samples=400, noise=0.2, random_state=SEED)
    y = y.reshape(-1, 1).astype(float)
    sizes = [2] + [16] * 4 + [1]

    print(f"{'activation':>10} {'mean activation':>17} {'units forced one way':>22}")
    for act in ["sigmoid", "tanh", "relu", "gelu"]:
        params = init(sizes, scale="xavier", seed=SEED)
        _, (_, as_) = forward(X, params, act)
        mean_a = float(np.mean(as_[2]))
        # The weight gradient for one example is outer(a, delta), so the weights
        # feeding unit j -- a COLUMN of W -- all get the sign of delta_j times
        # the sign of the incoming activations. If those are all positive, the
        # whole column is forced to move the same way on that example.
        same = total = 0
        for k in range(0, len(X), 7):
            _, g1, _ = loss_and_grads(X[k:k + 1], y[k:k + 1], params, act)
            for col in g1[2][0].T:
                nz = col[np.abs(col) > 1e-15]
                if len(nz) > 1:
                    total += 1
                    same += int(np.all(nz > 0) or np.all(nz < 0))
        print(f"{act:>10} {mean_a:>17.4f} {same / max(total, 1) * 100:>21.1f}%")

    print("\n  With an all-positive activation, every weight feeding a unit gets "
          "a gradient\n  of the same sign on a given example, so the update can "
          "only move them\n  together -- the zig-zag that tanh's negative half "
          "removes.")


# ----------------------------------------------------------------------------
# 5. The bakeoff
# ----------------------------------------------------------------------------
def section5():
    rule("5. BAKEOFF -- same data, same net, same seeds, only the curve changes")

    X, y = spirals(n_per=300)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)
    ytr, yte = ytr.reshape(-1, 1).astype(float), yte.reshape(-1, 1).astype(float)

    SEEDS = [0, 1, 2, 3, 4]
    acts = ["sigmoid", "tanh", "relu", "leaky", "elu", "gelu", "swish"]
    lab = {}
    for label, sizes in [("shallow (2 hidden layers of 32)", [2, 32, 32, 1]),
                         ("deep (10 hidden layers of 32)", [2] + [32] * 10 + [1])]:
        print(f"\n  {label} -- Adam, lr 0.005, 1500 steps, {len(SEEDS)} seeds")
        print(f"{'activation':>10} {'test acc mean':>15} {'spread':>9} {'final loss':>12}")
        rows = []
        for act in acts:
            accs, losses, curve = [], [], None
            for s in SEEDS:
                final, acc, c, _, _ = train(Xtr, ytr, Xte, yte, act, sizes,
                                            lr=0.005, steps=1500, seed=s, opt="adam")
                accs.append(acc)
                losses.append(final)
                if s == 0:
                    curve = c
            rows.append((act, float(np.mean(accs)), float(np.max(accs) - np.min(accs)),
                         float(np.mean(losses)), curve))
            print(f"{act:>10} {np.mean(accs):>15.4f} {np.max(accs) - np.min(accs):>9.4f} "
                  f"{np.mean(losses):>12.4f}")
        lab["deep" if "deep" in label else "shallow"] = rows

    print("\n--- LAB DATA: ActivationBakeoffLab ---")
    for depth, rows in lab.items():
        print(f"  {depth}:")
        for act, acc, spread, loss, curve in rows:
            print(f'    {{ act: "{act}", acc: {acc:.4f}, spread: {spread:.4f}, '
                  f"loss: {loss:.4f}, curve: {curve} }},")


# ----------------------------------------------------------------------------
# 6. Cost
# ----------------------------------------------------------------------------
def section6():
    rule("6. COST -- what the elegant curves charge you per forward pass")

    z = np.random.default_rng(SEED).normal(size=(4096, 512))
    print(f"{'activation':>10} {'ms per call':>13} {'vs relu':>9}")
    base = None
    rows = []
    for act in ["relu", "leaky", "tanh", "sigmoid", "elu", "swish", "gelu", "mish"]:
        f(z, act)  # warm up
        t0 = time.perf_counter()
        for _ in range(20):
            f(z, act)
        ms = (time.perf_counter() - t0) / 20 * 1000
        if base is None:
            base = ms
        rows.append((act, ms, ms / base))
        print(f"{act:>10} {ms:>13.2f} {ms / base:>8.1f}x")

    print("\n  Wall-clock on one machine, so read the ratios and not the "
          "milliseconds.\n  On a GPU with fused kernels the gaps shrink, but they "
          "do not vanish.")


# ----------------------------------------------------------------------------
# 7. Designing one
# ----------------------------------------------------------------------------
def section7():
    rule("7. DESIGNING ONE -- Swish's shape, derived from its requirements")

    grid = np.linspace(-10, 10, 200001)

    print("  x * sigmoid(beta*x), swept over beta:")
    print(f"{'beta':>7} {'min value':>11} {'at x =':>8} {'f(-1)':>9} {'f(2)':>8}  shape")
    for beta in [0.0, 0.5, 1.0, 2.0, 5.0, 20.0]:
        v = grid * sigmoid(beta * grid)
        k = int(np.argmin(v))
        shape = ("exactly x/2 -- linear" if beta == 0 else
                 "indistinguishable from ReLU" if beta >= 20 else
                 "a ReLU with a dip")
        mn = "unbounded" if beta == 0 else f"{v[k]:.4f}"
        at = "--" if beta == 0 else f"{grid[k]:.3f}"
        print(f"{beta:>7} {mn:>11} {at:>8} {v[np.argmin(np.abs(grid + 1))]:>9.4f} "
              f"{v[np.argmin(np.abs(grid - 2))]:>8.4f}  {shape}")

    v = grid * sigmoid(grid)
    d = df(grid, "swish")
    print(f"\n  beta = 1: minimum {v.min():.6f} at x = {grid[np.argmin(v)]:.4f}; "
          f"the derivative is\n  negative everywhere left of "
          f"{grid[d < 0].max():.4f} -- the non-monotone window that separates "
          f"this\n  from every function in the ReLU family.")
    print(f"  It is bounded below ({v.min():.4f}) and unbounded above, smooth "
          f"everywhere, and\n  its slope never exceeds {np.abs(d).max():.4f}.")

    # Two independent searches, one by hand and one by RL, landed in the same place.
    for beta in [1.0, 1.702]:
        diff = np.abs(grid * sigmoid(beta * grid) - f(grid, "gelu"))
        print(f"  max |swish_beta={beta} - gelu| over [-10, 10] = {diff.max():.4f}")

    print("\n  ReLU's own dead zone, for comparison: derivative exactly 0 on half "
          "the line.\n  Every smooth modern is the same idea -- keep the ReLU "
          "shape, remove the flat part.")


# ----------------------------------------------------------------------------
# 8. Where the units actually sit
# ----------------------------------------------------------------------------
def section8():
    rule("8. WHERE THE UNITS SIT -- the curve matters only where the network is")

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)
    ytr, yte = ytr.reshape(-1, 1).astype(float), yte.reshape(-1, 1).astype(float)
    sizes = [2] + [16] * 6 + [1]

    # Bin edges shared by every histogram so the shapes are comparable.
    EDGES = np.array([-np.inf, -6, -4, -2, -1, 0, 1, 2, 4, 6, np.inf])

    def profile(params, act):
        """For each hidden layer: the spread of pre-activations, and the
        fraction of them sitting where the derivative is below 0.01."""
        _, (zs, _) = forward(Xtr, params, act)
        out = []
        for z in zs[:-1]:
            sat = float(np.mean(np.abs(df(z, act)) < 0.01))
            out.append((float(z.mean()), float(z.std()), float(np.abs(z).max()), sat))
        allz = np.concatenate([z.ravel() for z in zs[:-1]])
        hist = np.histogram(allz, bins=EDGES)[0] / allz.size
        return out, [float(h) for h in hist]

    print(f"{'activation':>9} {'when':>9} {'mean z':>8} {'sd z':>7} {'max|z|':>8} "
          f"{'saturated':>10} {'test acc':>9}")
    lab = {}
    for act, scale in [("sigmoid", "xavier"), ("tanh", "xavier"), ("relu", "he")]:
        params0 = init(sizes, scale=scale, seed=SEED)
        pre, hist0 = profile(params0, act)
        m0 = float(np.mean([p[0] for p in pre]))
        s0 = float(np.mean([p[1] for p in pre]))
        x0 = float(np.max([p[2] for p in pre]))
        sat0 = float(np.mean([p[3] for p in pre]))
        print(f"{act:>9} {'at init':>9} {m0:>8.3f} {s0:>7.3f} {x0:>8.2f} "
              f"{sat0 * 100:>9.1f}% {'--':>9}")

        # Now train it and look again -- the interesting question is whether
        # training pushes units INTO the saturated region or out of it.
        params = init(sizes, scale=scale, seed=SEED)
        m_, v_ = ([[np.zeros_like(W), np.zeros_like(b)] for W, b in params],
                  [[np.zeros_like(W), np.zeros_like(b)] for W, b in params])
        for t in range(1, 1501):
            _, grads, _ = loss_and_grads(Xtr, ytr, params, act)
            for li in range(len(params)):
                for pi in range(2):
                    g = grads[li][pi]
                    m_[li][pi] = 0.9 * m_[li][pi] + 0.1 * g
                    v_[li][pi] = 0.999 * v_[li][pi] + 0.001 * g * g
                    params[li][pi] -= 0.01 * (m_[li][pi] / (1 - 0.9 ** t)) / (
                        np.sqrt(v_[li][pi] / (1 - 0.999 ** t)) + 1e-8)
        pre1, hist1 = profile(params, act)
        logit, _ = forward(Xte, params, act)
        acc = float(np.mean((logit > 0).astype(float) == yte))
        m1 = float(np.mean([p[0] for p in pre1]))
        s1 = float(np.mean([p[1] for p in pre1]))
        x1 = float(np.max([p[2] for p in pre1]))
        sat1 = float(np.mean([p[3] for p in pre1]))
        print(f"{act:>9} {'trained':>9} {m1:>8.3f} {s1:>7.3f} {x1:>8.2f} "
              f"{sat1 * 100:>9.1f}% {acc:>9.4f}")

        lab[act] = {"init": [round(h, 4) for h in hist0],
                    "trained": [round(h, 4) for h in hist1],
                    "sat0": round(sat0, 4), "sat1": round(sat1, 4),
                    "sd0": round(s0, 3), "sd1": round(s1, 3),
                    "max1": round(x1, 2), "acc": round(acc, 4),
                    "per_layer": [round(p[3], 4) for p in pre1]}
        print(f"{'':>9} {'':>9} per-layer saturated, trained: "
              + " ".join(f"{p[3] * 100:.0f}%" for p in pre1))

    print("\n  A curve's dead zone costs nothing if no unit is in it. Training "
          "moves the\n  units, so the honest question is never 'does this "
          "function saturate' but\n  'does this network end up where it does'.")

    print("\n--- LAB DATA: UnitDistributionLab ---")
    print(f"  edges: {['<-6','-6..-4','-4..-2','-2..-1','-1..0','0..1','1..2','2..4','4..6','>6']}")
    for k, v in lab.items():
        print(f"  {k}: {v},")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:      # `python scripts/activation_cases.py 5 7`
        for n in sys.argv[1:]:
            globals()[f"section{n}"]()
        raise SystemExit(0)
    section1()
    section2()
    section3()
    section4()
    section5()
    section6()
    section7()
    print("\ndone.")
