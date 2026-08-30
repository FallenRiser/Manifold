"""Real numbers for the Perceptron -> MLP track (PROJECT.md §11 rules 9-10).

Deterministic: fixed seeds, no network, stdlib + numpy + sklearn only.

    python scripts/perceptron_mlp_cases.py

Sections
  1. The perceptron rule -- convergence on separable data, and what it does
     when the data is not separable (the failure the guarantee excludes).
  2. XOR -- the smallest problem one neuron cannot solve, and the smallest
     network that can.
  3. The collapse -- a deep network with no activation IS a single linear map,
     measured rather than asserted.
  4. The capacity ladder -- hidden width vs decision boundary vs parameters.
  5. Where an MLP wins -- raw pixels, against a linear model.
  6. Where an MLP loses -- tabular data, against a tuned forest.

Anything printed under "LAB DATA" is copied verbatim into a lab component.

Environment used for the published numbers: python 3.13.11, sklearn 1.8.0,
numpy 2.3.5.
"""

import numpy as np
from sklearn.datasets import fetch_openml, load_digits, make_moons
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

SEED = 0


def rule(title):
    print("\n" + "=" * 74)
    print(title)
    print("=" * 74)


# ----------------------------------------------------------------------------
# 1. The perceptron learning rule
# ----------------------------------------------------------------------------
def perceptron(X, y, epochs=100, lr=1.0, w0=None):
    """Rosenblatt's rule. y in {-1, +1}. Returns (w, b, updates, epochs_used,
    converged, history) where history is one (w, b) per update."""
    w = np.zeros(X.shape[1]) if w0 is None else np.array(w0, float)
    b = 0.0
    hist = [(w.copy(), b)]
    updates = 0
    for ep in range(1, epochs + 1):
        errors = 0
        for xi, yi in zip(X, y):
            if yi * (w @ xi + b) <= 0:
                w = w + lr * yi * xi
                b = b + lr * yi
                updates += 1
                errors += 1
                hist.append((w.copy(), b))
        if errors == 0:
            return w, b, updates, ep, True, hist
    return w, b, updates, epochs, False, hist


def section1():
    rule("1. THE PERCEPTRON RULE -- convergence, and the case it excludes")

    rng = np.random.default_rng(SEED)

    # A small, human-readable 2-D set that is separable BY CONSTRUCTION: points
    # are drawn in a box, then any point closer than MARGIN to a chosen true
    # boundary is rejected. That guarantees a separating line exists (so the
    # convergence theorem applies) while keeping the gap narrow -- with two
    # widely separated clouds the rule converges in two updates and there is no
    # trajectory for the lab to walk through.
    n = 12
    MARGIN = 0.55
    w_true, b_true = np.array([-1.0, 1.0]), -0.9
    pos, neg = [], []
    while len(pos) < n or len(neg) < n:
        p = np.round(rng.uniform([1.0, 1.0], [9.0, 9.0], size=2), 1)
        d = (w_true @ p + b_true) / np.linalg.norm(w_true)
        if abs(d) < MARGIN:
            continue
        (pos if d > 0 else neg).append(p)
    A = np.array(pos[:n])          # class +1, above the line
    B = np.array(neg[:n])          # class -1, below it
    X = np.vstack([A, B])
    y = np.hstack([np.ones(n), -np.ones(n)])
    assert np.all(y * (X @ w_true + b_true) > 0), "construction must be separable"

    # Start from a deliberately wrong direction, so the trajectory has to
    # travel: this is what the lab steps through.
    w, b, updates, eps, ok, hist = perceptron(X, y, lr=0.5, w0=[2.0, -1.0])
    margin = np.min(y * (X @ w + b)) / np.linalg.norm(w)
    print(f"separable set: n={len(X)}  converged={ok}  epochs={eps}  updates={updates}")
    print(f"  final w = [{w[0]:.2f}, {w[1]:.2f}]  b = {b:.2f}")
    print(f"  training accuracy = {np.mean(np.sign(X @ w + b) == y):.4f}")
    print(f"  geometric margin of the solution found = {margin:.4f}")

    # The same rule on data that is NOT separable: one point moved across.
    Xn = X.copy()
    Xn[0] = [7.0, 2.0]        # a +1 point deep inside the -1 cloud
    _, _, upd_n, eps_n, ok_n, hist_n = perceptron(Xn, y, epochs=100, lr=0.5)
    accs = []
    for wk, bk in hist_n[-40:]:
        accs.append(np.mean(np.sign(Xn @ wk + bk) == y))
    print(f"\nnon-separable set (one point moved to [7.0, 2.0]):")
    print(f"  converged={ok_n}  epochs run={eps_n}  updates={upd_n}")
    print(f"  accuracy over the last 40 updates: min={min(accs):.4f} "
          f"max={max(accs):.4f} mean={np.mean(accs):.4f}")
    print("  -> it never stops and never settles: the rule has no notion of "
          "'good enough'.")

    print("\n--- LAB DATA: PerceptronLab points (x, y, label) ---")
    print("POS =", [[float(p[0]), float(p[1])] for p in A])
    print("NEG =", [[float(p[0]), float(p[1])] for p in B])
    print("NEG_MOVED_INDEX = 0 of POS -> [7.0, 2.0]")
    print("\n--- LAB DATA: full update trajectory on the separable set (w1, w2, b) ---")
    print("TRAJ =", [[round(float(wk[0]), 2), round(float(wk[1]), 2), round(float(bk), 2)]
                     for wk, bk in hist])
    print("ACC_PER_STEP =", [round(float(np.mean(np.sign(X @ wk + bk) == y)), 4)
                             for wk, bk in hist])
    return X, y


# ----------------------------------------------------------------------------
# 2. XOR
# ----------------------------------------------------------------------------
def section2():
    rule("2. XOR -- one neuron cannot, two hidden units can")

    X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
    y = np.array([0, 1, 1, 0])

    lin = LogisticRegression().fit(X, y)
    print(f"logistic regression on XOR: accuracy = "
          f"{accuracy_score(y, lin.predict(X)):.4f}")
    print(f"  probabilities: {np.round(lin.predict_proba(X)[:, 1], 4).tolist()}")
    print("  -> it predicts 0.5 everywhere. Not a tuning failure: no line "
          "separates these four points.")

    # Exhaustive check that no linear rule can do it: try every labelling a
    # halfplane could produce on 4 points by brute-force over many directions.
    best = 0
    rng = np.random.default_rng(SEED)
    for _ in range(20000):
        w = rng.normal(size=2)
        b = rng.uniform(-2, 2)
        acc = np.mean((X @ w + b > 0).astype(int) == y)
        best = max(best, acc)
    print(f"  best accuracy over 20,000 random half-planes = {best:.4f}")

    # The smallest network that solves it. Trained, not hand-set.
    mlp = MLPClassifier(hidden_layer_sizes=(2,), activation="tanh",
                        solver="lbfgs", max_iter=5000, random_state=1).fit(X, y)
    print(f"\nMLP with 2 hidden units (tanh): accuracy = "
          f"{accuracy_score(y, mlp.predict(X)):.4f}")
    print(f"  probabilities: {np.round(mlp.predict_proba(X)[:, 1], 4).tolist()}")
    W1, W2 = mlp.coefs_
    b1, b2 = mlp.intercepts_
    print(f"  hidden weights W1 =\n{np.round(W1, 3)}")
    print(f"  hidden bias   b1 = {np.round(b1, 3).tolist()}")
    print(f"  output weights W2 = {np.round(W2.ravel(), 3).tolist()}  "
          f"b2 = {np.round(b2, 3).tolist()}")

    H = np.tanh(X @ W1 + b1)
    print("\n  the four inputs, as seen by the hidden layer:")
    for xi, hi, yi in zip(X, H, y):
        print(f"    x={xi.tolist()}  ->  h=[{hi[0]:+.3f}, {hi[1]:+.3f}]  (y={yi})")
    print("  -> in h-space the two classes ARE linearly separable. The hidden "
          "layer did not classify; it moved the points.")

    # How often does the smallest net actually find it?
    wins = 0
    TRIALS = 50
    for s in range(TRIALS):
        m = MLPClassifier(hidden_layer_sizes=(2,), activation="tanh",
                          solver="lbfgs", max_iter=5000, random_state=s).fit(X, y)
        wins += accuracy_score(y, m.predict(X)) == 1.0
    print(f"\n  2 hidden units, {TRIALS} random seeds: solved {wins}/{TRIALS}")
    wins4 = sum(
        accuracy_score(y, MLPClassifier(hidden_layer_sizes=(4,), activation="tanh",
                                        solver="lbfgs", max_iter=5000,
                                        random_state=s).fit(X, y).predict(X)) == 1.0
        for s in range(TRIALS)
    )
    print(f"  4 hidden units, {TRIALS} random seeds: solved {wins4}/{TRIALS}")
    print("  -> capacity is necessary, not sufficient: the same architecture "
          "succeeds or fails on the initialisation alone.")


# ----------------------------------------------------------------------------
# 3. The collapse
# ----------------------------------------------------------------------------
def section3():
    rule("3. THE COLLAPSE -- a deep net with no activation is one linear map")

    rng = np.random.default_rng(SEED)
    X = rng.normal(size=(500, 4))

    # Three "hidden" layers, no activation function anywhere.
    W1 = rng.normal(size=(4, 32)); b1 = rng.normal(size=32)
    W2 = rng.normal(size=(32, 32)); b2 = rng.normal(size=32)
    W3 = rng.normal(size=(32, 16)); b3 = rng.normal(size=16)
    W4 = rng.normal(size=(16, 1)); b4 = rng.normal(size=1)

    deep = ((((X @ W1 + b1) @ W2 + b2) @ W3 + b3) @ W4 + b4)

    # The single equivalent layer, obtained by multiplying the matrices out.
    W = W1 @ W2 @ W3 @ W4
    b = b1 @ W2 @ W3 @ W4 + b2 @ W3 @ W4 + b3 @ W4 + b4
    flat = X @ W + b

    nparam = sum(m.size for m in (W1, b1, W2, b2, W3, b3, W4, b4))
    print(f"deep (4 weight matrices, {nparam:,} parameters) vs the single 4->1 "
          f"layer it collapses to ({W.size + 1} parameters):")
    print(f"  max |difference| over 500 inputs = {np.max(np.abs(deep - flat)):.3e}")
    print(f"  equivalent w = {np.round(W.ravel(), 4).tolist()}  b = {b[0]:.4f}")
    print("  -> identical to floating-point error. Depth without a "
          "non-linearity buys exactly nothing.")

    # And the practical consequence on a task that needs a curve.
    Xm, ym = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(Xm, ym, test_size=0.35,
                                          random_state=SEED, stratify=ym)
    lin = MLPClassifier(hidden_layer_sizes=(64, 64), activation="identity",
                        max_iter=3000, random_state=SEED).fit(Xtr, ytr)
    log = LogisticRegression().fit(Xtr, ytr)
    relu = MLPClassifier(hidden_layer_sizes=(64, 64), activation="relu",
                         max_iter=3000, random_state=SEED).fit(Xtr, ytr)
    print(f"\non two moons (600 pts, noise 0.25, 35% test):")
    print(f"  64-64 net, activation='identity' : test acc "
          f"{accuracy_score(yte, lin.predict(Xte)):.4f}")
    print(f"  logistic regression (5 params)   : test acc "
          f"{accuracy_score(yte, log.predict(Xte)):.4f}")
    print(f"  64-64 net, activation='relu'     : test acc "
          f"{accuracy_score(yte, relu.predict(Xte)):.4f}")


# ----------------------------------------------------------------------------
# 4. The capacity ladder
# ----------------------------------------------------------------------------
def section4():
    rule("4. THE CAPACITY LADDER -- what hidden width buys, and where it stops")

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35,
                                          random_state=SEED, stratify=y)

    print(f"{'units':>6} {'params':>7} {'train':>8} {'test':>8}")
    rows = []
    for h in [1, 2, 3, 4, 8, 16, 64, 256]:
        # Average over 5 inits: a single seed on a small net measures the
        # initialisation as much as the architecture.
        tr, te = [], []
        for s in range(5):
            m = MLPClassifier(hidden_layer_sizes=(h,), activation="relu",
                              max_iter=4000, random_state=s).fit(Xtr, ytr)
            tr.append(accuracy_score(ytr, m.predict(Xtr)))
            te.append(accuracy_score(yte, m.predict(Xte)))
        params = 2 * h + h + h + 1     # W1 + b1 + W2 + b2
        rows.append((h, params, np.mean(tr), np.mean(te)))
        print(f"{h:>6} {params:>7} {np.mean(tr):>8.4f} {np.mean(te):>8.4f}")
    print("\n--- LAB DATA: CapacityLadder rows (units, params, train, test) ---")
    print([[r[0], r[1], round(r[2], 4), round(r[3], 4)] for r in rows])


# ----------------------------------------------------------------------------
# 5. Where an MLP wins
# ----------------------------------------------------------------------------
def spirals(n_per=500, turns=3.0, noise=0.045, seed=SEED):
    """Two interleaved spirals. The classic task where the useful features are
    compositions of the raw inputs that nobody would hand-design."""
    r = np.random.default_rng(seed)
    t = np.sqrt(r.uniform(size=n_per)) * turns * 2 * np.pi
    # The same radii for both arms, so the two classes are exact point
    # reflections of each other. Without this the arms differ slightly and a
    # straight line picks up real signal -- which would quietly undercut the
    # whole point of the example.
    def arm(sign):
        x = sign * t * np.cos(t) + r.normal(scale=noise, size=n_per) * t
        y_ = sign * t * np.sin(t) + r.normal(scale=noise, size=n_per) * t
        return np.column_stack([x, y_])
    X = np.vstack([arm(1.0), arm(-1.0)]) / (turns * 2 * np.pi)
    y = np.hstack([np.zeros(n_per), np.ones(n_per)]).astype(int)
    return X, y


def section5():
    rule("5. WHERE AN MLP WINS -- features nobody hand-designed")

    X, y = spirals()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3,
                                          random_state=SEED, stratify=y)
    log = LogisticRegression(max_iter=5000).fit(Xtr, ytr)
    rf = RandomForestClassifier(n_estimators=300, random_state=SEED).fit(Xtr, ytr)
    small = MLPClassifier(hidden_layer_sizes=(8,), max_iter=6000,
                          random_state=SEED).fit(Xtr, ytr)
    mlp = MLPClassifier(hidden_layer_sizes=(64, 64), max_iter=6000,
                        random_state=SEED).fit(Xtr, ytr)

    a_log = accuracy_score(yte, log.predict(Xte))
    a_rf = accuracy_score(yte, rf.predict(Xte))
    a_sm = accuracy_score(yte, small.predict(Xte))
    a_mlp = accuracy_score(yte, mlp.predict(Xte))
    print(f"two interleaved spirals, {len(X)} points, 2 features, 30% test")
    print(f"  logistic regression      : {a_log:.4f}")
    print(f"  MLP, 8 hidden units      : {a_sm:.4f}")
    print(f"  MLP, 64-64               : {a_mlp:.4f}")
    print(f"  random forest, 300 trees : {a_rf:.4f}")
    print(f"  MLP - logistic = {a_mlp - a_log:+.4f}")
    print("  -> the two classes occupy the same range on BOTH raw features. "
          "There is nothing for a linear rule to use.")

    # Every 2nd point, not every 8th: at 3 turns the two arms interleave
    # tightly, and a sparse sample reads as scatter rather than as a spiral --
    # which would destroy the whole point of showing it.
    print("\n--- LAB DATA: spiral points, 3dp (x, y) per class ---")
    Xr = np.round(X, 3)
    print("SPIRAL_A =", [[float(a), float(b)] for a, b in Xr[y == 0][::2]])
    print("SPIRAL_B =", [[float(a), float(b)] for a, b in Xr[y == 1][::2]])

    # Decision grids, so the lab draws the boundary the fitted models actually
    # produce rather than an artist's impression of one. One character per cell,
    # row-major; row 0 is y = -1.35, so a renderer must flip vertically.
    G = 44
    gx = np.linspace(-1.35, 1.35, G)
    gy = np.linspace(-1.35, 1.35, G)
    GX, GY = np.meshgrid(gx, gy)
    grid = np.column_stack([GX.ravel(), GY.ravel()])
    for name, model in [("LIN_GRID", log), ("MLP_GRID", mlp)]:
        bits = "".join("1" if v else "0" for v in model.predict(grid))
        print(f'{name} = "{bits}"   # {G}x{G}, x,y in [-1.35, 1.35]')

    # And the honest counterweight: on an easy problem the net buys nothing.
    rule("5b. ...AND WHERE IT BUYS ALMOST NOTHING -- 8x8 digits")
    X, y = load_digits(return_X_y=True)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3,
                                          random_state=SEED, stratify=y)

    log = make_pipeline(StandardScaler(),
                        LogisticRegression(max_iter=5000)).fit(Xtr, ytr)
    mlp = make_pipeline(StandardScaler(),
                        MLPClassifier(hidden_layer_sizes=(64,), max_iter=1000,
                                      random_state=SEED)).fit(Xtr, ytr)
    rf = RandomForestClassifier(n_estimators=300, random_state=SEED).fit(Xtr, ytr)

    a_log = accuracy_score(yte, log.predict(Xte))
    a_mlp = accuracy_score(yte, mlp.predict(Xte))
    a_rf = accuracy_score(yte, rf.predict(Xte))
    print(f"load_digits, 1797 rows, 64 pixel features, 30% test ({len(yte)} rows)")
    print(f"  logistic regression : {a_log:.4f}  ({int(round((1-a_log)*len(yte)))} errors)")
    print(f"  MLP, one 64-unit layer : {a_mlp:.4f}  "
          f"({int(round((1-a_mlp)*len(yte)))} errors)")
    print(f"  random forest, 300 trees : {a_rf:.4f}  "
          f"({int(round((1-a_rf)*len(yte)))} errors)")
    print(f"  MLP - logistic = {a_mlp - a_log:+.4f}  <- honest: near nothing. "
          f"An 8x8 digit is already almost linearly separable.")
    net = mlp.named_steps["mlpclassifier"]
    print(f"  hidden layer parameters: {64*64 + 64} weights+biases")
    print(f"  training loss at stop: {net.loss_:.4f}  (iterations: {net.n_iter_})")


# ----------------------------------------------------------------------------
# 6. Where an MLP loses
# ----------------------------------------------------------------------------
def section6():
    rule("6. WHERE AN MLP LOSES -- tabular data, against a forest")

    # A tabular task with mixed marginals and threshold-like structure, which is
    # what trees are built for and what an MLP has to learn the hard way.
    rng = np.random.default_rng(SEED)
    n = 4000
    age = rng.integers(18, 80, n).astype(float)
    income = np.round(rng.lognormal(10.4, 0.6, n), 0)
    tenure = rng.integers(0, 30, n).astype(float)
    region = rng.integers(0, 6, n).astype(float)
    # Rule: thresholds and an interaction -- the shape a tree splits into and an
    # MLP has to approximate with hyperplanes.
    logit = (2.2 * (income > 40000) + 1.6 * (age < 35) * (tenure < 3)
             - 1.4 * (region == 4) + 0.8 * (tenure > 15) - 1.9)
    p = 1 / (1 + np.exp(-logit))
    y = (rng.uniform(size=n) < p).astype(int)
    X = np.column_stack([age, income, tenure, region])

    Xtr, Xte, ytr, yte, _, pte = train_test_split(X, y, p, test_size=0.3,
                                                  random_state=SEED, stratify=y)
    # We know the generator, so we know the ceiling. Without it, "0.77" is a
    # number with nothing to be measured against.
    bayes = np.mean(np.maximum(pte, 1 - pte))
    print(f"Bayes-optimal accuracy on this test set = {bayes:.4f}  "
          f"(the label is genuinely noisy; nothing can beat this)")

    rf = RandomForestClassifier(n_estimators=400, min_samples_leaf=5,
                                random_state=SEED).fit(Xtr, ytr)
    mlp = make_pipeline(StandardScaler(),
                        MLPClassifier(hidden_layer_sizes=(64, 64), max_iter=2000,
                                      random_state=SEED)).fit(Xtr, ytr)
    log = make_pipeline(StandardScaler(),
                        LogisticRegression(max_iter=2000)).fit(Xtr, ytr)

    a_rf = accuracy_score(yte, rf.predict(Xte))
    a_mlp = accuracy_score(yte, mlp.predict(Xte))
    a_log = accuracy_score(yte, log.predict(Xte))
    print(f"synthetic tabular task, n={n}, 4 features, threshold rule + one "
          f"interaction, 30% test")
    print(f"  logistic regression       : {a_log:.4f}")
    print(f"  MLP, 64-64, standardised  : {a_mlp:.4f}")
    print(f"  random forest, 400 trees  : {a_rf:.4f}")
    print(f"  forest - MLP = {a_rf - a_mlp:+.4f}")
    print(f"  headroom left unclaimed by the MLP = {bayes - a_mlp:+.4f}, "
          f"by the forest = {bayes - a_rf:+.4f}")

    # The unscaled version -- the failure mode that is NOT the model's fault.
    raw = MLPClassifier(hidden_layer_sizes=(64, 64), max_iter=2000,
                        random_state=SEED).fit(Xtr, ytr)
    a_raw = accuracy_score(yte, raw.predict(Xte))
    print(f"  same MLP with NO scaling  : {a_raw:.4f}  "
          f"({a_raw - a_mlp:+.4f} vs scaled)")
    print(f"  positive-class rate {y.mean():.4f} / majority baseline "
          f"{max(y.mean(), 1 - y.mean()):.4f}  <- the unscaled net has collapsed "
          f"onto one class")
    print("  -> income spans five orders of magnitude more than region. The "
          "forest does not care; the net does.")


# ----------------------------------------------------------------------------
# 7. The sanity check every training loop should pass first
# ----------------------------------------------------------------------------
def section7():
    rule("7. OVERFIT TEN EXAMPLES -- the cheapest bug localiser there is")

    rng = np.random.default_rng(SEED)
    X, y = make_moons(n_samples=400, noise=0.25, random_state=SEED)
    Xs, ys = X[:10], y[:10].astype(float).reshape(-1, 1)

    # A hand-rolled 2 -> 16 -> 1 net so the loop is fully visible: no framework
    # is doing anything on our behalf here.
    W1 = rng.normal(scale=0.8, size=(2, 16)); b1 = np.zeros(16)
    W2 = rng.normal(scale=0.8, size=(16, 1)); b2 = np.zeros(1)
    lr = 0.15

    for step in range(501):
        Z1 = Xs @ W1 + b1
        H1 = np.maximum(0, Z1)
        Z2 = H1 @ W2 + b2
        P = 1 / (1 + np.exp(-Z2))
        loss = float(np.mean(-ys * np.log(P) - (1 - ys) * np.log(1 - P)))
        if step % 100 == 0:
            print(f"step {step:>4}  loss {loss:.6f}")

        dZ2 = (P - ys) / len(Xs)                  # sigmoid + BCE cancel
        gW2 = H1.T @ dZ2
        gb2 = dZ2.sum(0)
        dH1 = dZ2 @ W2.T
        dZ1 = dH1 * (Z1 > 0)
        gW1 = Xs.T @ dZ1
        gb1 = dZ1.sum(0)
        W1 -= lr * gW1; b1 -= lr * gb1
        W2 -= lr * gW2; b2 -= lr * gb2

    pred = (P > 0.5).astype(float)
    print(f"  final accuracy on the ten: {np.mean(pred == ys):.4f}")
    print("  -> a model with capacity MUST be able to do this. If it cannot, "
          "the fault is in the plumbing, not the dataset.")


# ----------------------------------------------------------------------------
# 8. There is no single best set of weights
# ----------------------------------------------------------------------------
def section8():
    rule("8. SYMMETRY -- the same function, written a factorial number of ways")

    import warnings

    from sklearn.datasets import make_moons
    from sklearn.exceptions import ConvergenceWarning
    from sklearn.model_selection import train_test_split
    from sklearn.neural_network import MLPClassifier

    X, y = make_moons(n_samples=600, noise=0.25, random_state=SEED)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.35, random_state=SEED,
                                          stratify=y)

    def fit(seed):
        # A fixed, generous budget rather than a convergence criterion: every
        # seed gets exactly the same treatment, which is what the comparison
        # below needs. Adam on a tiny problem rattles around its noise floor
        # forever, so the "not converged" warning is expected and uninformative.
        m = MLPClassifier(hidden_layer_sizes=(16,), activation="tanh",
                          max_iter=12000, random_state=seed, tol=1e-8)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", ConvergenceWarning)
            m.fit(Xtr, ytr)
        return m

    # -- 8a. Permute the hidden units and nothing at all changes -------------
    m = fit(0)
    W1, W2 = m.coefs_
    b1, b2 = m.intercepts_
    before = m.predict_proba(Xte)[:, 1]

    r = np.random.default_rng(7)
    perm = r.permutation(W1.shape[1])
    m.coefs_ = [W1[:, perm], W2[perm, :]]
    m.intercepts_ = [b1[perm], b2]
    after = m.predict_proba(Xte)[:, 1]

    print("  8a. relabel the 16 hidden units (and their weights) at random:")
    print(f"      permutation used: {perm.tolist()}")
    print(f"      max |prediction change| over the test set: "
          f"{np.abs(before - after).max():.3e}")
    print(f"      weights moved? mean |W1 - W1_permuted| = "
          f"{np.abs(W1 - W1[:, perm]).mean():.4f}")

    # -- 8b. tanh is odd, so signs flip too ---------------------------------
    m2 = fit(0)
    W1, W2 = m2.coefs_
    b1, b2 = m2.intercepts_
    flip = np.array([-1.0 if i % 2 == 0 else 1.0 for i in range(W1.shape[1])])
    m2.coefs_ = [W1 * flip, W2 * flip[:, None]]
    m2.intercepts_ = [b1 * flip, b2]
    after2 = m2.predict_proba(Xte)[:, 1]
    print("\n  8b. negate half the units, and the weights that read them "
          "(tanh is odd):")
    print(f"      max |prediction change|: {np.abs(before - after2).max():.3e}")

    # -- 8c. How many copies is that? ---------------------------------------
    import math
    for w in [4, 16, 64]:
        n_sym = math.factorial(w) * 2 ** w
        print(f"\n  8c. a single tanh layer of width {w:>3}: "
              f"{w}! x 2^{w} = {n_sym:.3e} identical copies")
    w1, w2 = 32, 32
    total = (math.factorial(w1) * 2 ** w1) * (math.factorial(w2) * 2 ** w2)
    print(f"      two layers of 32:      {total:.3e} "
          f"(= 10^{math.log10(total):.0f})")

    # -- 8d. Different seeds: different weights, same function --------------
    print("\n  8d. five seeds, same architecture, same data:")
    models, accs = [], []
    for s in range(5):
        mm = fit(s)
        models.append(mm)
        accs.append(mm.score(Xte, yte))
        flat = np.concatenate([c.ravel() for c in mm.coefs_])
        print(f"      seed {s}: test acc {accs[-1]:.4f}   "
              f"|w| = {np.linalg.norm(flat):7.3f}   "
              f"first 3 weights {np.round(mm.coefs_[0][0, :3], 3).tolist()}")
    d = np.linalg.norm(
        np.concatenate([c.ravel() for c in models[0].coefs_])
        - np.concatenate([c.ravel() for c in models[1].coefs_]))
    print(f"      distance between seed 0 and seed 1 in weight space: {d:.3f}")
    print(f"      difference in test accuracy: "
          f"{abs(accs[0] - accs[1]):.4f}")

    # -- 8e. So averaging the WEIGHTS is meaningless -------------------------
    avg = fit(0)
    avg.coefs_ = [(models[0].coefs_[i] + models[1].coefs_[i]) / 2 for i in range(2)]
    avg.intercepts_ = [(models[0].intercepts_[i] + models[1].intercepts_[i]) / 2
                       for i in range(2)]
    acc_avg = avg.score(Xte, yte)

    # ... but averaging the PREDICTIONS is the standard, and it works.
    ens = np.mean([m_.predict_proba(Xte)[:, 1] for m_ in models], axis=0)
    acc_ens = float(np.mean((ens > 0.5).astype(int) == yte))

    print(f"\n  8e. seed 0 alone           : {accs[0]:.4f}")
    print(f"      seed 1 alone           : {accs[1]:.4f}")
    print(f"      average of the WEIGHTS  : {acc_avg:.4f}   <- averaging in "
          f"weight space")
    print(f"      average of the OUTPUTS  : {acc_ens:.4f}   <- averaging in "
          f"function space (5 models)")
    print("\n  Two solutions can be equally good and nowhere near each other, so "
          "the midpoint\n  between them is not a compromise -- it is a third, "
          "unrelated network.")

    print("\n--- LAB DATA: seed table (seed, acc, norm, first3) ---")
    for s, mm in enumerate(models):
        print(f'  {{ seed: {s}, acc: {mm.score(Xte, yte):.4f}, '
              f"norm: {np.linalg.norm(np.concatenate([c.ravel() for c in mm.coefs_])):.3f}, "
              f"w: {np.round(mm.coefs_[0][0, :3], 3).tolist()} }},")
    print(f"  avg_weights: {acc_avg:.4f}, avg_outputs: {acc_ens:.4f}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:          # `python scripts/perceptron_mlp_cases.py 8`
        for a in sys.argv[1:]:
            globals()[f"section{a}"]()
        raise SystemExit(0)
    section1()
    section2()
    section3()
    section4()
    section5()
    section6()
    section7()
    print("\ndone.")
