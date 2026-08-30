"""Real numbers for the Backpropagation & training track (PROJECT.md §11 rules 9-10).

Deterministic: fixed seeds, no network, stdlib + numpy + sklearn only.

    python scripts/backprop_cases.py

Sections
  1. Gradient checking -- the analytic gradient against finite differences.
  2. What backprop is worth -- finite differences vs one backward sweep, timed.
  3. Vanishing gradients -- per-layer gradient norms, by activation AND by
     initialisation scale.
  4. Exploding gradients -- the same mechanism with the sign flipped, and what
     clipping does about it.
  5. The learning rate -- a sweep across six orders of magnitude.
  6. Batch size -- same epochs, different numbers of updates.

Anything printed under "LAB DATA" is copied verbatim into a lab component.

Environment used for the published numbers: python 3.13.11, numpy 2.3.5,
sklearn 1.8.0.
"""

import time

import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split

SEED = 0


def rule(title):
    print("\n" + "=" * 74)
    print(title)
    print("=" * 74)


# ----------------------------------------------------------------------------
# A minimal, fully explicit MLP. Everything in this file is built on it, so the
# reader can be told truthfully that no framework is doing the work.
# ----------------------------------------------------------------------------
def init(sizes, scale="xavier", seed=SEED, act="relu"):
    r = np.random.default_rng(seed)
    params = []
    for i in range(len(sizes) - 1):
        fan_in, fan_out = sizes[i], sizes[i + 1]
        if scale == "xavier":
            s = np.sqrt(1.0 / fan_in)
        elif scale == "he":
            s = np.sqrt(2.0 / fan_in)
        else:
            s = float(scale)
        params.append([r.normal(scale=s, size=(fan_in, fan_out)), np.zeros(fan_out)])
    return params


def act_fwd(z, act):
    if act == "relu":
        return np.maximum(0.0, z)
    if act == "sigmoid":
        return 1.0 / (1.0 + np.exp(-z))
    if act == "tanh":
        return np.tanh(z)
    raise ValueError(act)


def act_grad(z, a, act):
    if act == "relu":
        return (z > 0).astype(float)
    if act == "sigmoid":
        return a * (1.0 - a)
    if act == "tanh":
        return 1.0 - a * a
    raise ValueError(act)


def forward(X, params, act):
    """Returns (logit, cache). The final layer has no activation -- the sigmoid
    is folded into the loss, exactly as every framework does it."""
    zs, as_ = [], [X]
    a = X
    for i, (W, b) in enumerate(params):
        z = a @ W + b
        zs.append(z)
        a = act_fwd(z, act) if i < len(params) - 1 else z
        as_.append(a)
    return a, (zs, as_)


def loss_and_grads(X, y, params, act):
    """Binary cross-entropy on the logit. Returns (loss, grads, per_layer_norms).

    y has shape (n, 1). The output-layer delta is (p - y)/n because sigmoid and
    BCE cancel -- see the output-layer page in the previous track."""
    logit, (zs, as_) = forward(X, params, act)
    # Stable sigmoid: exp(-z) overflows for the very large logits that section 4
    # deliberately produces, and a warning in the middle of a demonstration is
    # noise rather than information.
    p = np.where(logit >= 0,
                 1.0 / (1.0 + np.exp(-np.abs(logit))),
                 np.exp(-np.abs(logit)) / (1.0 + np.exp(-np.abs(logit))))
    eps = 1e-12
    loss = float(np.mean(-y * np.log(p + eps) - (1 - y) * np.log(1 - p + eps)))

    grads = [None] * len(params)
    delta = (p - y) / len(X)
    for i in range(len(params) - 1, -1, -1):
        W, _ = params[i]
        gW = as_[i].T @ delta
        gb = delta.sum(0)
        grads[i] = [gW, gb]
        if i > 0:
            delta = (delta @ W.T) * act_grad(zs[i - 1], as_[i], act)
    norms = [float(np.linalg.norm(g[0])) for g in grads]
    return loss, grads, norms


def flatten(params):
    return np.concatenate([m.ravel() for p in params for m in p])


def unflatten(vec, template):
    out, k = [], 0
    for W, b in template:
        nW, nb = W.size, b.size
        out.append([vec[k:k + nW].reshape(W.shape), vec[k + nW:k + nW + nb].reshape(b.shape)])
        k += nW + nb
    return out


# ----------------------------------------------------------------------------
# 1. Gradient checking
# ----------------------------------------------------------------------------
def section1():
    rule("1. GRADIENT CHECKING -- is the derivative you derived the real one?")

    X, y = make_moons(n_samples=60, noise=0.2, random_state=SEED)
    y = y.reshape(-1, 1).astype(float)
    params = init([2, 8, 8, 1], act="tanh")
    act = "tanh"

    loss, grads, _ = loss_and_grads(X, y, params, act)
    theta = flatten(params)
    ganalytic = flatten(grads)

    for h in [1e-2, 1e-4, 1e-6, 1e-8, 1e-10]:
        gnum = np.zeros_like(theta)
        for k in range(len(theta)):
            up, dn = theta.copy(), theta.copy()
            up[k] += h
            dn[k] -= h
            lu, _, _ = loss_and_grads(X, y, unflatten(up, params), act)
            ld, _, _ = loss_and_grads(X, y, unflatten(dn, params), act)
            gnum[k] = (lu - ld) / (2 * h)
        rel = (np.linalg.norm(ganalytic - gnum)
               / (np.linalg.norm(ganalytic) + np.linalg.norm(gnum)))
        print(f"  h = {h:.0e}   relative difference = {rel:.3e}")

    print(f"\n  {len(theta)} parameters checked. The best h is in the middle: too "
          f"large and the\n  approximation is wrong, too small and floating-point "
          f"cancellation destroys it.")


# ----------------------------------------------------------------------------
# 2. What backprop is actually worth
# ----------------------------------------------------------------------------
def section2():
    rule("2. WHAT BACKPROP IS WORTH -- one backward sweep vs one pass per weight")

    X, y = make_moons(n_samples=200, noise=0.2, random_state=SEED)
    y = y.reshape(-1, 1).astype(float)

    print(f"{'width':>6} {'params':>8} {'backprop (ms)':>15} {'finite diff (ms)':>18} {'ratio':>8}")
    rows = []
    for h in [4, 8, 16, 32]:
        params = init([2, h, h, 1], act="tanh")
        theta = flatten(params)
        P = len(theta)

        t0 = time.perf_counter()
        for _ in range(20):
            loss_and_grads(X, y, params, "tanh")
        t_bp = (time.perf_counter() - t0) / 20 * 1000

        # One central difference per parameter = 2P forward passes.
        t0 = time.perf_counter()
        for k in range(P):
            up, dn = theta.copy(), theta.copy()
            up[k] += 1e-5
            dn[k] -= 1e-5
            forward(X, unflatten(up, params), "tanh")
            forward(X, unflatten(dn, params), "tanh")
        t_fd = (time.perf_counter() - t0) * 1000

        rows.append((h, P, t_bp, t_fd, t_fd / t_bp))
        print(f"{h:>6} {P:>8} {t_bp:>15.3f} {t_fd:>18.1f} {t_fd / t_bp:>7.0f}x")

    print("\n  The ratio grows with the parameter count, because finite "
          "differences cost\n  O(P) passes and backprop costs O(1). That is the "
          "whole reason the field exists.")
    print("\n--- LAB DATA: cost rows (width, params, backprop_ms, fd_ms) ---")
    print([[r[0], r[1], round(r[2], 4), round(r[3], 1)] for r in rows])


# ----------------------------------------------------------------------------
# 3. Vanishing gradients
# ----------------------------------------------------------------------------
def section3():
    rule("3. VANISHING GRADIENTS -- gradient norm by layer, by activation")

    X, y = make_moons(n_samples=400, noise=0.2, random_state=SEED)
    y = y.reshape(-1, 1).astype(float)
    DEPTH = 12
    sizes = [2] + [16] * DEPTH + [1]

    out = {}
    for act in ["sigmoid", "tanh", "relu"]:
        params = init(sizes, scale="xavier", seed=SEED, act=act)
        _, _, norms = loss_and_grads(X, y, params, act)
        out[act] = norms
        ratio = norms[-1] / norms[0] if norms[0] > 0 else float("inf")
        print(f"\n  {act:>8}, xavier init, {DEPTH} hidden layers")
        print("    layer 1..13 grad norms: " + " ".join(f"{n:.2e}" for n in norms))
        print(f"    last / first = {ratio:.3g}")

    # The honest complication: initialisation scale matters as much as the
    # activation does. Same sigmoid net, three init scales.
    print("\n  same sigmoid net, three initialisation scales:")
    scales = {}
    for scale in ["xavier", 0.5, 2.0]:
        params = init(sizes, scale=scale, seed=SEED, act="sigmoid")
        _, _, norms = loss_and_grads(X, y, params, "sigmoid")
        scales[str(scale)] = norms
        print(f"    scale={str(scale):>7}: first={norms[0]:.2e}  last={norms[-1]:.2e}  "
              f"ratio={norms[-1] / norms[0]:.3g}")

    print("\n--- LAB DATA: GradientFlowLab norms by activation ---")
    for k, v in out.items():
        print(f'  {k} = {[float(f"{n:.4g}") for n in v]}')


# ----------------------------------------------------------------------------
# 4. Exploding gradients
# ----------------------------------------------------------------------------
def section4():
    rule("4. EXPLODING GRADIENTS -- the same mechanism, sign flipped")

    X, y = make_moons(n_samples=400, noise=0.2, random_state=SEED)
    y = y.reshape(-1, 1).astype(float)
    sizes = [2] + [16] * 12 + [1]

    print(f"{'init scale':>11} {'first layer':>14} {'last layer':>13} {'total norm':>13}")
    rows = []
    for scale in [0.5, 1.0, 1.5, 2.0, 3.0]:
        params = init(sizes, scale=scale, seed=SEED, act="relu")
        _, grads, norms = loss_and_grads(X, y, params, "relu")
        total = float(np.linalg.norm(flatten(grads)))
        rows.append((scale, norms[0], norms[-1], total))
        print(f"{scale:>11} {norms[0]:>14.3e} {norms[-1]:>13.3e} {total:>13.3e}")

    # What clipping does: rescale the whole gradient to a maximum norm.
    params = init(sizes, scale=3.0, seed=SEED, act="relu")
    _, grads, _ = loss_and_grads(X, y, params, "relu")
    g = flatten(grads)
    n = np.linalg.norm(g)
    for clip in [1.0, 5.0]:
        scaled = g * min(1.0, clip / n)
        print(f"\n  clip at {clip}: norm {n:.3e} -> {np.linalg.norm(scaled):.3f}  "
              f"(direction unchanged, cosine "
              f"{float(g @ scaled / (np.linalg.norm(g) * np.linalg.norm(scaled))):.6f})")


# ----------------------------------------------------------------------------
# 5. The learning rate
# ----------------------------------------------------------------------------
def train(X, y, Xte, yte, lr, steps=2000, act="relu", sizes=(2, 16, 16, 1), seed=SEED):
    params = init(list(sizes), scale="he", seed=seed, act=act)
    hist = []
    for t in range(steps):
        loss, grads, _ = loss_and_grads(X, y, params, act)
        if not np.isfinite(loss):
            return float("nan"), hist, float("nan"), [], []
        if t % 50 == 0:
            hist.append(loss)
        for (W, b), (gW, gb) in zip(params, grads):
            W -= lr * gW
            b -= lr * gb
    final, _, _ = loss_and_grads(X, y, params, act)
    logit, _ = forward(Xte, params, act)
    acc = float(np.mean(((logit > 0).astype(float)) == yte))
    # How much of the network is still alive? A ReLU unit that is <= 0 for every
    # training row receives zero gradient forever.
    _, (_, as_) = forward(X, params, act)
    dead = [int((a <= 0).all(0).sum()) for a in as_[1:-1]]
    widths = [a.shape[1] for a in as_[1:-1]]
    return final, hist, acc, dead, widths


def section5():
    rule("5. THE LEARNING RATE -- six orders of magnitude on one problem")

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)
    ytr = ytr.reshape(-1, 1).astype(float)
    yte = yte.reshape(-1, 1).astype(float)

    START = 0.6510        # the loss before any step is taken
    print(f"{'lr':>10} {'final loss':>13} {'test acc':>10} {'dead units':>12}   verdict")
    rows = []
    for lr in [1e-4, 1e-3, 1e-2, 1e-1, 1.0, 10.0, 100.0]:
        final, hist, acc, dead, widths = train(Xtr, ytr, Xte, yte, lr)
        rows.append((lr, final, acc, hist, dead))
        tail = hist[-8:]
        if not np.isfinite(final):
            verdict = "diverged to NaN"
        elif dead and dead[-1] == widths[-1]:
            verdict = "a whole layer died -- the network is severed"
        elif np.std(tail) > 1.0:
            verdict = "oscillating wildly, never settles"
        elif final > START:
            verdict = "worse than it started"
        elif final > 0.5:
            verdict = "moving, far too slowly"
        elif final > 0.3:
            verdict = "learning, but not finished"
        else:
            verdict = "healthy"
        dstr = "/".join(f"{d}of{w}" for d, w in zip(dead, widths)) if dead else "-"
        print(f"{lr:>10} {final:>13.4f} {acc:>10.4f} {dstr:>12}   {verdict}")

    print("\n--- LAB DATA: LearningRateLab (lr, final_loss, test_acc, curve every 50 steps) ---")
    for lr, final, acc, hist, dead in rows:
        h = [round(float(v), 4) if np.isfinite(v) else None for v in hist[:20]]
        print(f"  {{ lr: {lr}, final: {final:.4f}, acc: {acc:.4f}, dead: {dead}, curve: {h} }},")


# ----------------------------------------------------------------------------
# 6. Batch size
# ----------------------------------------------------------------------------
def section6():
    rule("6. BATCH SIZE -- same epochs, different numbers of updates")

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)
    ytr = ytr.reshape(-1, 1).astype(float)
    yte = yte.reshape(-1, 1).astype(float)
    n = len(Xtr)
    EPOCHS = 30
    LR = 0.5

    print(f"{'batch':>7} {'steps/epoch':>13} {'total steps':>13} {'final loss':>12} {'test acc':>10}")
    rows = []
    for bs in [8, 32, 128, n]:
        params = init([2, 16, 16, 1], scale="he", seed=SEED, act="relu")
        r = np.random.default_rng(SEED)
        steps = 0
        for _ in range(EPOCHS):
            order = r.permutation(n)
            for s in range(0, n, bs):
                idx = order[s:s + bs]
                _, grads, _ = loss_and_grads(Xtr[idx], ytr[idx], params, "relu")
                for (W, b), (gW, gb) in zip(params, grads):
                    W -= LR * gW
                    b -= LR * gb
                steps += 1
        final, _, _ = loss_and_grads(Xtr, ytr, params, "relu")
        logit, _ = forward(Xte, params, "relu")
        acc = float(np.mean((logit > 0).astype(float) == yte))
        rows.append((bs, steps, final, acc))
        print(f"{bs:>7} {int(np.ceil(n / bs)):>13} {steps:>13} {final:>12.4f} {acc:>10.4f}")

    print("\n  Identical epochs and identical learning rate. The only thing that "
          "changed is\n  how many times the parameters were actually updated.")


# ----------------------------------------------------------------------------
# 0. The worked example the "by hand" page walks through
# ----------------------------------------------------------------------------
def section0():
    rule("0. BACKPROP BY HAND -- the same 13-parameter net as the previous track")

    W1 = np.array([[0.8, -0.5, 1.2], [-0.6, 0.9, 0.4]])
    b1 = np.array([0.1, -1.5, -0.7])
    W2 = np.array([[1.5], [-2.0], [0.7]])
    b2 = np.array([0.3])
    x = np.array([[2.0, 1.0]])
    y = np.array([[0.0]])          # label 0 -- the model was confidently WRONG

    z1 = x @ W1 + b1
    h1 = np.maximum(0, z1)
    z2 = h1 @ W2 + b2
    p = 1 / (1 + np.exp(-z2))
    L = float((-y * np.log(p) - (1 - y) * np.log(1 - p))[0, 0])
    print(f"  forward:  z1 = {z1[0]}  h1 = {h1[0]}  z2 = {z2[0, 0]:.2f}  "
          f"p = {p[0, 0]:.4f}  loss = {L:.4f}")

    dz2 = p - y                     # sigmoid + BCE cancel
    gW2 = h1.T @ dz2
    gb2 = dz2.sum(0)
    dh1 = dz2 @ W2.T
    dz1 = dh1 * (z1 > 0)            # ReLU: pass through, or block entirely
    gW1 = x.T @ dz1
    gb1 = dz1.sum(0)

    print(f"  delta2 = p - y        = {dz2[0, 0]:.4f}")
    print(f"  dL/dW2                = {np.round(gW2.ravel(), 4).tolist()}")
    print(f"  dL/db2                = {np.round(gb2, 4).tolist()}")
    print(f"  dL/dh1                = {np.round(dh1[0], 4).tolist()}")
    print(f"  delta1 (after ReLU)   = {np.round(dz1[0], 4).tolist()}")
    print(f"  dL/dW1                =\n{np.round(gW1, 4)}")
    print(f"  dL/db1                = {np.round(gb1, 4).tolist()}")
    print("  -> unit 2 is off for this input, so its entire column of gradients "
          "is zero:\n     it cannot learn from an example it did not participate in.")

    def loss_of(A):
        zz1 = x @ A + b1
        hh1 = np.maximum(0, zz1)
        pp = 1 / (1 + np.exp(-(hh1 @ W2 + b2)))
        return float((-y * np.log(pp) - (1 - y) * np.log(1 - pp))[0, 0])

    h = 1e-6
    up, dn = W1.copy(), W1.copy()
    up[0, 0] += h
    dn[0, 0] -= h
    fd = (loss_of(up) - loss_of(dn)) / (2 * h)
    print(f"\n  check dL/dW1[0,0]:  analytic {gW1[0, 0]:.10f}   "
          f"finite difference {fd:.10f}")


# ----------------------------------------------------------------------------
# 7. Momentum and Adam, on the same problem as the learning-rate sweep
# ----------------------------------------------------------------------------
def section7():
    rule("7. MOMENTUM & ADAM -- same network, same steps, three update rules")

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)
    ytr = ytr.reshape(-1, 1).astype(float)
    yte = yte.reshape(-1, 1).astype(float)
    STEPS = 400

    def run(kind, lr):
        params = init([2, 16, 16, 1], scale="he", seed=SEED, act="relu")
        state = [[np.zeros_like(W), np.zeros_like(b)] for W, b in params]
        state2 = [[np.zeros_like(W), np.zeros_like(b)] for W, b in params]
        curve = []
        for t in range(1, STEPS + 1):
            loss, grads, _ = loss_and_grads(Xtr, ytr, params, "relu")
            if t % 20 == 1:
                curve.append(round(float(loss), 4))
            for li in range(len(params)):
                for pi in range(2):
                    g = grads[li][pi]
                    if kind == "sgd":
                        params[li][pi] -= lr * g
                    elif kind == "momentum":
                        state[li][pi] = 0.9 * state[li][pi] + g
                        params[li][pi] -= lr * state[li][pi]
                    elif kind == "adam":
                        state[li][pi] = 0.9 * state[li][pi] + 0.1 * g
                        state2[li][pi] = 0.999 * state2[li][pi] + 0.001 * g * g
                        mhat = state[li][pi] / (1 - 0.9 ** t)
                        vhat = state2[li][pi] / (1 - 0.999 ** t)
                        params[li][pi] -= lr * mhat / (np.sqrt(vhat) + 1e-8)
        final, _, _ = loss_and_grads(Xtr, ytr, params, "relu")
        logit, _ = forward(Xte, params, "relu")
        acc = float(np.mean((logit > 0).astype(float) == yte))
        return float(final), acc, curve

    print(f"{'rule':>10} {'lr':>7} {'loss @400':>11} {'test acc':>10}")
    out = {}
    for kind, lr in [("sgd", 0.1), ("momentum", 0.1), ("adam", 0.01)]:
        final, acc, curve = run(kind, lr)
        out[kind] = curve
        print(f"{kind:>10} {lr:>7} {final:>11.4f} {acc:>10.4f}")

    # Is momentum's advantage just a bigger effective step? Give plain SGD the
    # 1/(1-0.9) = 10x larger rate that momentum's accumulation is worth.
    final, acc, _ = run("sgd", 1.0)
    print(f"{'sgd':>10} {1.0:>7} {final:>11.4f} {acc:>10.4f}   <- SGD given "
          f"momentum's effective step")

    print("\n--- LAB DATA: optimiser curves (every 20 steps) ---")
    for k, v in out.items():
        print(f"  {k} = {v}")


# ----------------------------------------------------------------------------
# 8. Learning-rate schedules
# ----------------------------------------------------------------------------
def section8():
    rule("8. SCHEDULES -- what decaying the rate actually buys over a good constant")

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)
    ytr = ytr.reshape(-1, 1).astype(float)
    yte = yte.reshape(-1, 1).astype(float)
    n = len(Xtr)
    BS, EPOCHS = 32, 120
    steps_total = EPOCHS * int(np.ceil(n / BS))

    def lr_at(kind, t, base):
        """t in [0, steps_total). Every schedule starts from the same base rate,
        so the comparison is about the SHAPE and not about the size."""
        frac = t / steps_total
        if kind == "constant":
            return base
        if kind == "step":                      # x0.1 at 50% and 75%
            return base * (0.1 if frac >= 0.5 else 1.0) * (0.1 if frac >= 0.75 else 1.0)
        if kind == "cosine":
            return base * 0.5 * (1 + np.cos(np.pi * frac))
        if kind == "warmcos":                   # 5% linear warmup, then cosine
            if frac < 0.05:
                return base * frac / 0.05
            f2 = (frac - 0.05) / 0.95
            return base * 0.5 * (1 + np.cos(np.pi * f2))
        raise ValueError(kind)

    def run(kind, base, seed):
        params = init([2, 32, 32, 1], scale="he", seed=seed, act="relu")
        r = np.random.default_rng(seed)
        t = 0
        curve = []
        for ep in range(EPOCHS):
            order = r.permutation(n)
            for s in range(0, n, BS):
                idx = order[s:s + BS]
                _, grads, _ = loss_and_grads(Xtr[idx], ytr[idx], params, "relu")
                lr = lr_at(kind, t, base)
                for (W, b), (gW, gb) in zip(params, grads):
                    W -= lr * gW
                    b -= lr * gb
                t += 1
            # Sample across the WHOLE run: a decay that starts at 50% is
            # invisible if the curve stops at epoch 40.
            if ep % (EPOCHS // 40) == 0:
                full, _, _ = loss_and_grads(Xtr, ytr, params, "relu")
                curve.append(round(float(full), 4))
        final, _, _ = loss_and_grads(Xtr, ytr, params, "relu")
        logit, _ = forward(Xte, params, "relu")
        acc = float(np.mean((logit > 0).astype(float) == yte))
        return float(final), acc, curve

    SEEDS = [0, 1, 2, 3, 4]
    print(f"  minibatch SGD, batch {BS}, {EPOCHS} epochs = {steps_total} steps, "
          f"{len(SEEDS)} seeds")
    print(f"{'schedule':>12} {'base lr':>8} {'train loss':>18} {'test acc':>16}")
    lab = {}
    # The constants are swept, not strawmanned: a schedule has to beat the best
    # constant, not a badly chosen one.
    for kind, base in [("constant", 0.5), ("constant", 0.1), ("constant", 0.05),
                       ("constant", 0.01), ("step", 0.5), ("cosine", 0.5),
                       ("warmcos", 0.5)]:
        losses, accs, curve = [], [], None
        for s in SEEDS:
            f_, a_, c_ = run(kind, base, s)
            losses.append(f_)
            accs.append(a_)
            if s == 0:
                curve = c_
        key = f"{kind}@{base}"
        lab[key] = {"loss": float(np.mean(losses)), "acc": float(np.mean(accs)),
                    "lspread": float(np.max(losses) - np.min(losses)),
                    "aspread": float(np.max(accs) - np.min(accs)), "curve": curve}
        print(f"{kind:>12} {base:>8} {np.mean(losses):>10.4f} "
              f"±{np.max(losses) - np.min(losses):>6.4f} "
              f"{np.mean(accs):>9.4f} ±{np.max(accs) - np.min(accs):>5.4f}")

    print("\n  The constant rate cannot settle: minibatch noise keeps kicking it "
          "around a\n  floor set by the step size. Decaying shrinks the floor. "
          "Whether that buys any\n  TEST accuracy is the separate question the "
          "table answers.")

    # The shape of each schedule, for the lab.
    print("\n--- LAB DATA: schedule shapes (lr over 40 sampled points, base 0.5) ---")
    for kind in ["constant", "step", "cosine", "warmcos"]:
        pts = [round(float(lr_at(kind, int(steps_total * i / 39), 0.5)), 4) for i in range(40)]
        print(f"  {kind}: {pts}")
    print("\n--- LAB DATA: schedule results ---")
    for k, v in lab.items():
        print(f'  {{ key: "{k}", loss: {v["loss"]:.4f}, lspread: {v["lspread"]:.4f}, '
              f'acc: {v["acc"]:.4f}, aspread: {v["aspread"]:.4f}, curve: {v["curve"]} }},')


# ----------------------------------------------------------------------------
# 9. What backprop costs in MEMORY
# ----------------------------------------------------------------------------
def section9():
    rule("9. THE MEMORY BILL -- backprop is cheap in time and expensive in space")

    print("  measured bytes actually held, float32, for one forward+backward:")
    print(f"{'batch':>7} {'depth':>6} {'width':>6} {'params MB':>11} "
          f"{'activations MB':>16} {'ratio':>7}")
    rows = []
    for B, L, W in [(32, 12, 256), (256, 12, 256), (1024, 12, 256),
                    (256, 12, 1024), (256, 48, 256)]:
        sizes = [W] + [W] * L + [1]
        params = init(sizes, scale="he", seed=SEED, act="relu")
        pbytes = sum(m.nbytes for p in params for m in p)
        Xb = np.zeros((B, W), dtype=np.float64)
        _, (zs, as_) = forward(Xb, params, "relu")
        # Every pre-activation and every activation must survive until the
        # backward pass reaches it -- that is what "cache" means in every
        # framework's autograd.
        abytes = sum(a.nbytes for a in as_) + sum(z.nbytes for z in zs)
        # Report in float32 terms, which is what a real run uses.
        pmb, amb = pbytes / 2 / 1e6, abytes / 2 / 1e6
        rows.append((B, L, W, pmb, amb, amb / pmb))
        print(f"{B:>7} {L:>6} {W:>6} {pmb:>11.2f} {amb:>16.2f} {amb / pmb:>6.1f}x")

    print("\n  Parameter memory does not depend on the batch size. Activation "
          "memory is\n  linear in it -- which is why an out-of-memory error is "
          "fixed by shrinking the\n  batch and never by lowering the learning "
          "rate.")

    # Gradient checkpointing: keep only every k-th activation, recompute the rest.
    L, W, B = 48, 256, 256
    sizes = [W] + [W] * L + [1]
    params = init(sizes, scale="he", seed=SEED, act="relu")
    Xb = np.zeros((B, W))
    _, (zs, as_) = forward(Xb, params, "relu")
    full = (sum(a.nbytes for a in as_) + sum(z.nbytes for z in zs)) / 2 / 1e6

    # Time a step and a bare forward first, so the compute column below is a
    # measured cost rather than a model.
    t0 = time.perf_counter()
    for _ in range(5):
        loss_and_grads(Xb, np.zeros((B, 1)), params, "relu")
    t_step = (time.perf_counter() - t0) / 5
    t0 = time.perf_counter()
    for _ in range(5):
        forward(Xb, params, "relu")
    t_fwd = (time.perf_counter() - t0) / 5
    print(f"\n  timed on the {L}-layer net: one training step "
          f"{t_step * 1000:.1f} ms, of which the\n  forward pass alone is "
          f"{t_fwd * 1000:.1f} ms ({t_fwd / t_step * 100:.0f}% of the step).")

    print(f"\n  gradient checkpointing (full activation store {full:.1f} MB):")
    print(f"{'keep every':>11} {'stored MB':>11} {'memory':>9} {'extra time/step':>17}")
    ck = []
    for k in [1, 2, 4, 7, 12, 24]:
        kept = len([i for i in range(len(as_)) if i % k == 0])
        stored = full * kept / len(as_)
        # Backward recomputes each segment once, so the extra work is at most
        # ONE forward pass -- (k-1)/k of it, since the kept boundaries are free.
        extra_frac_of_fwd = 0.0 if k == 1 else (k - 1) / k
        extra_pct = extra_frac_of_fwd * t_fwd / t_step * 100
        ck.append([k, round(stored, 1), round(full / stored, 1), round(extra_pct)])
        print(f"{k:>11} {stored:>11.1f} {full / stored:>8.1f}x {extra_pct:>16.0f}%")

    print("\n  The whole trade fits in one sentence: memory falls like 1/k, "
          "while the extra\n  compute is capped at a single forward pass no "
          "matter how large k gets.")
    print(f"\n  The classical choice is k = sqrt(depth) = "
          f"{int(round(L ** 0.5))}, which is the "
          f"{sorted(ck, key=lambda r: abs(r[0] - L ** 0.5))[0][2]}x row: "
          f"O(sqrt(L)) memory for one extra forward.")
    print("\n--- LAB DATA: checkpointing rows (k, stored_mb, saving_x, extra_pct) ---")
    print(ck)

    print("\n--- LAB DATA: memory rows (batch, depth, width, param_mb, act_mb) ---")
    print([[r[0], r[1], r[2], round(r[3], 2), round(r[4], 2)] for r in rows])


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:          # `python scripts/backprop_cases.py 8 9`
        for a in sys.argv[1:]:
            globals()[f"section{a}"]()
        raise SystemExit(0)
    section0()
    section1()
    section2()
    section3()
    section4()
    section5()
    section6()
    section7()
    section8()
    section9()
    print("\ndone.")
