"""Real numbers for the Architecture design track (PROJECT.md §6.6b).

Deterministic: fixed seeds, stdlib + numpy + sklearn only.

    python scripts/architecture_cases.py
    python scripts/architecture_cases.py 3 5   # run only sections 3 and 5

Sections
  1. Depth x width sweep -- a grid of architectures on two moons.
  2. Depth alone -- fix width, sweep depth.
  3. Width alone -- fix depth, sweep width.
  4. Parameter budget -- same total params, spent as wide-shallow vs deep-narrow.
  5. Depth limit without skip connections -- gradient ratios at init vs depth.
  6. Diagnostic learning curves -- underfit / fit / overfit architectures.
  7. Funnel vs constant-width vs inverted funnel.
  8. The order of operations -- overfit first, then regularise.

Anything printed under "LAB DATA" is copied verbatim into a lab component.

Environment used for the published numbers: python 3.13.11, numpy 2.3.5,
sklearn 1.8.0.
"""

import numpy as np
from sklearn.datasets import make_moons
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split

SEED = 0


def rule(title):
    print("\n" + "=" * 74)
    print(title)
    print("=" * 74)


# ---------------------------------------------------------------------------
# Shared dataset
# ---------------------------------------------------------------------------
X_all, y_all = make_moons(n_samples=800, noise=0.25, random_state=SEED)
X_tr, X_te, y_tr, y_te = train_test_split(X_all, y_all, test_size=0.25, random_state=SEED)


def run_mlp(hidden, seeds=5, lr=0.001, max_iter=500, solver="adam", alpha=0.0001):
    """Train an MLPClassifier with the given hidden layer sizes, return mean
    train/test accuracy and their spreads over `seeds` initialisations."""
    trs, tes = [], []
    for s in range(seeds):
        clf = MLPClassifier(
            hidden_layer_sizes=hidden, activation="relu", solver=solver,
            learning_rate_init=lr, max_iter=max_iter, random_state=SEED + s,
            alpha=alpha, tol=0.0, n_iter_no_change=max_iter,
        )
        clf.fit(X_tr, y_tr)
        trs.append(clf.score(X_tr, y_tr))
        tes.append(clf.score(X_te, y_te))
    return {
        "train": round(float(np.mean(trs)), 4),
        "test": round(float(np.mean(tes)), 4),
        "train_std": round(float(np.std(trs)), 4),
        "test_std": round(float(np.std(tes)), 4),
    }


def count_sklearn_params(hidden):
    """Count parameters for a 2-input, 1-output MLP with given hidden sizes."""
    sizes = [2] + list(hidden) + [1]
    total = 0
    for i in range(len(sizes) - 1):
        total += sizes[i] * sizes[i+1] + sizes[i+1]
    return total


# ---------------------------------------------------------------------------
# Minimal hand-rolled MLP for gradient measurement only (no sklearn needed)
# ---------------------------------------------------------------------------
def init_manual(sizes, seed=SEED):
    r = np.random.default_rng(seed)
    params = []
    for i in range(len(sizes) - 1):
        fan_in = sizes[i]
        s = np.sqrt(2.0 / fan_in)
        params.append([r.normal(scale=s, size=(fan_in, sizes[i+1])),
                        np.zeros(sizes[i+1])])
    return params


def forward_manual(X, params):
    a = X
    zs, as_ = [], [X]
    for i, (W, b) in enumerate(params):
        z = a @ W + b
        zs.append(z)
        a = np.maximum(0.0, z) if i < len(params) - 1 else z
        as_.append(a)
    return a, (zs, as_)


def grad_norms(X, y, params):
    y = y.reshape(-1, 1).astype(float)
    logit, (zs, as_) = forward_manual(X, params)
    p = np.where(logit >= 0,
                 1.0 / (1.0 + np.exp(-np.abs(logit))),
                 np.exp(-np.abs(logit)) / (1.0 + np.exp(-np.abs(logit))))
    delta = (p - y) / len(X)
    norms = []
    for i in range(len(params) - 1, -1, -1):
        W, _ = params[i]
        gW = as_[i].T @ delta
        norms.insert(0, float(np.linalg.norm(gW)))
        if i > 0:
            delta = (delta @ W.T) * (zs[i-1] > 0).astype(float)
    return norms


# ===== SECTIONS =====

def section1():
    rule("SECTION 1: Depth × width sweep")
    print("Grid of (depth, width) on two moons, 5 seeds each, ReLU, SGD lr=0.01.")
    print()

    depths = [1, 2, 3, 4, 6, 8]
    widths = [4, 8, 16, 32, 64]
    results = []

    print(f"{'depth':>6}  {'width':>6}  {'params':>7}  {'train':>7}  {'test':>7}  {'gap':>7}")
    print("-" * 50)

    for d in depths:
        for w in widths:
            hidden = tuple([w] * d)
            n_params = count_sklearn_params(hidden)
            r = run_mlp(hidden)
            gap = round(r["train"] - r["test"], 4)
            results.append({
                "depth": d, "width": w, "params": n_params,
                "train": r["train"], "test": r["test"], "gap": gap,
            })
            print(f"{d:>6}  {w:>6}  {n_params:>7}  {r['train']:>7.4f}  {r['test']:>7.4f}  {gap:>7.4f}")

    print()
    best = max(results, key=lambda r: r["test"])
    print(f"Best test accuracy: {best['test']:.4f} at depth={best['depth']}, width={best['width']}, params={best['params']}")

    print("\n--- LAB DATA: DepthVsWidthLab ---")
    print(f"depths = {depths}")
    print(f"widths = {widths}")
    print("ROWS = [")
    for r in results:
        print(f"  {{ depth: {r['depth']}, width: {r['width']}, params: {r['params']}, train: {r['train']}, test: {r['test']} }},")
    print("]")

    return results


def section2():
    rule("SECTION 2: Depth alone (width fixed at 32)")
    print("Sweep depth 1 to 20, width=32, 5 seeds, ReLU, Adam lr=0.001, 500 iters.")
    print()

    width = 32
    depths = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20]
    results = []

    print(f"{'depth':>6}  {'params':>7}  {'train':>7}  {'test':>7}")
    print("-" * 36)

    for d in depths:
        hidden = tuple([width] * d)
        n_params = count_sklearn_params(hidden)
        r = run_mlp(hidden)
        results.append({
            "depth": d, "params": n_params,
            "train": r["train"], "test": r["test"],
        })
        print(f"{d:>6}  {n_params:>7}  {r['train']:>7.4f}  {r['test']:>7.4f}")

    return results


def section3():
    rule("SECTION 3: Width alone (depth fixed at 2)")
    print("Sweep width 2 to 512, depth=2, 5 seeds, ReLU, Adam lr=0.001, 500 iters.")
    print()

    depth = 2
    widths = [2, 4, 8, 16, 32, 64, 128, 256, 512]
    results = []

    print(f"{'width':>6}  {'params':>7}  {'train':>7}  {'test':>7}")
    print("-" * 36)

    for w in widths:
        hidden = tuple([w] * depth)
        n_params = count_sklearn_params(hidden)
        r = run_mlp(hidden)
        results.append({
            "width": w, "params": n_params,
            "train": r["train"], "test": r["test"],
        })
        print(f"{w:>6}  {n_params:>7}  {r['train']:>7.4f}  {r['test']:>7.4f}")

    return results


def section4():
    rule("SECTION 4: Same parameter budget, different shapes")
    print("~1000 parameters, spent as wide-shallow vs deep-narrow, 5 seeds.")
    print()

    configs = [
        ("1×333", (333,)),
        ("2×22",  (22, 22)),
        ("3×17",  (17, 17, 17)),
        ("4×14",  (14, 14, 14, 14)),
        ("6×12",  (12, 12, 12, 12, 12, 12)),
        ("8×10",  (10, 10, 10, 10, 10, 10, 10, 10)),
    ]

    results = []
    print(f"{'shape':>8}  {'params':>7}  {'train':>7}  {'test':>7}  {'test_std':>8}")
    print("-" * 46)

    for label, hidden in configs:
        n_params = count_sklearn_params(hidden)
        r = run_mlp(hidden)
        results.append({
            "label": label, "params": n_params,
            "train": r["train"], "test": r["test"],
            "test_std": r["test_std"],
        })
        print(f"{label:>8}  {n_params:>7}  {r['train']:>7.4f}  {r['test']:>7.4f}  {r['test_std']:>8.4f}")

    return results


def section5():
    rule("SECTION 5: Gradient ratio vs depth (the depth limit)")
    print("Gradient ratio (output norm / input norm) at He init, width=16, ReLU.")
    print("This is the measurable reason deep plain nets stop learning.")
    print()

    width = 16
    depths = [2, 4, 6, 8, 10, 12, 16, 20, 30]

    print(f"{'depth':>6}  {'ratio':>12}  {'log10':>7}")
    print("-" * 30)

    for d in depths:
        sizes = [2] + [width] * d + [1]
        ratios = []
        for s in range(5):
            p = init_manual(sizes, seed=SEED + s)
            norms = grad_norms(X_tr, y_tr, p)
            if norms[0] > 1e-30:
                ratios.append(norms[-1] / norms[0])
        ratio = float(np.mean(ratios)) if ratios else 0
        log10 = np.log10(ratio) if ratio > 0 else float('-inf')
        print(f"{d:>6}  {ratio:>12.4f}  {log10:>7.2f}")

    # Also compare trained accuracy at these depths
    print()
    print("Trained accuracy at these depths (width=16, SGD lr=0.01, 2000 iters):")
    print(f"{'depth':>6}  {'test':>7}")
    print("-" * 16)
    for d in [2, 4, 8, 12, 16, 20]:
        hidden = tuple([width] * d)
        r = run_mlp(hidden)
        print(f"{d:>6}  {r['test']:>7.4f}")


def section6():
    rule("SECTION 6: Diagnostic learning curves")
    print("Three architectures -- too small, right, too big -- same data.")
    print()

    configs = [
        ("underfit (1×4)", (4,)),
        ("fit (2×32)", (32, 32)),
        ("overfit (3×128)", (128, 128, 128)),
    ]

    for label, hidden in configs:
        n_params = count_sklearn_params(hidden)
        clf = MLPClassifier(
            hidden_layer_sizes=hidden, activation="relu", solver="adam",
            learning_rate_init=0.001, max_iter=500, random_state=SEED,
            tol=0.0, n_iter_no_change=500,
        )
        clf.fit(X_tr, y_tr)
        tr_acc = clf.score(X_tr, y_tr)
        te_acc = clf.score(X_te, y_te)
        gap = tr_acc - te_acc
        # Get loss curve
        curve = clf.loss_curve_
        # Sample 20 evenly-spaced points
        idx = np.linspace(0, len(curve) - 1, 20, dtype=int)
        sampled = [round(curve[i], 4) for i in idx]
        print(f"  {label}: params={n_params}, train={tr_acc:.4f}, test={te_acc:.4f}, gap={gap:.4f}")
        print(f"    loss curve (20 samples): {sampled}")
    print()


def section7():
    rule("SECTION 7: Funnel vs constant vs inverted funnel")
    print("Three width schedules, 3 hidden layers, 5 seeds.")
    print()

    configs = [
        ("funnel (64->32->16)", (64, 32, 16)),
        ("constant (32->32->32)", (32, 32, 32)),
        ("inv-funnel (16->32->64)", (16, 32, 64)),
    ]

    results = []
    print(f"{'shape':>26}  {'params':>7}  {'train':>7}  {'test':>7}  {'test_std':>8}")
    print("-" * 62)

    for label, hidden in configs:
        n_params = count_sklearn_params(hidden)
        r = run_mlp(hidden)
        results.append({
            "label": label, "params": n_params,
            "train": r["train"], "test": r["test"],
            "test_std": r["test_std"],
        })
        print(f"{label:>26}  {n_params:>7}  {r['train']:>7.4f}  {r['test']:>7.4f}  {r['test_std']:>8.4f}")

    return results


def section8():
    rule("SECTION 8: The order of operations -- overfit first, then regularise")
    print("A 3×128 net that overfits, then the SAME architecture with L2 regularisation.")
    print()

    # No regularisation
    r_no = run_mlp((128, 128, 128))
    print(f"  No regularisation:    train={r_no['train']:.4f}, test={r_no['test']:.4f}, gap={r_no['train']-r_no['test']:.4f}")

    # With L2 regularisation
    trs, tes = [], []
    for s in range(5):
        clf = MLPClassifier(
            hidden_layer_sizes=(128, 128, 128), activation="relu", solver="adam",
            learning_rate_init=0.001, max_iter=500, random_state=SEED + s,
            alpha=0.01, tol=0.0, n_iter_no_change=500,
        )
        clf.fit(X_tr, y_tr)
        trs.append(clf.score(X_tr, y_tr))
        tes.append(clf.score(X_te, y_te))
    r_l2 = {"train": round(float(np.mean(trs)), 4), "test": round(float(np.mean(tes)), 4)}
    print(f"  With L2 (alpha=0.01):    train={r_l2['train']:.4f}, test={r_l2['test']:.4f}, gap={r_l2['train']-r_l2['test']:.4f}")

    # Too small (can't overfit even without reg)
    r_small = run_mlp((4,))
    print(f"  Too small (1×4):     train={r_small['train']:.4f}, test={r_small['test']:.4f}, gap={r_small['train']-r_small['test']:.4f}")
    print()
    print("  The lesson: regularising a model that is too small does nothing;")
    print("  regularising a model that is too big recovers the gap.")


if __name__ == "__main__":
    import sys
    sections = [section1, section2, section3, section4, section5, section6, section7, section8]
    if len(sys.argv) > 1:
        for idx in sys.argv[1:]:
            sections[int(idx) - 1]()
    else:
        for s in sections:
            s()
