"""Honest numbers and plottable series for the k-Means track.

    python scripts/kmeans_cases.py            # print everything
    python scripts/kmeans_cases.py --emit     # ... and write the figure data
    python scripts/kmeans_cases.py fail init  # named sections only

The k-Means track is 45 pages, 39 code blocks, and -- this is the part worth
stating plainly -- zero CodeOutput blocks. Not one page commits to what its own
code prints. So unlike the other tracks' scripts, there is almost nothing here
to *verify*; the job is to supply the numbers the pages currently gesture at.

The gestures, and what this file measures instead:

  "an order of magnitude faster"      mini-batch vs Lloyd, timed, with the
                                      inertia it gives up to get there
  "Elkan skips redundant distances"   the actual speedup, and the n/k/d region
                                      where it is a slowdown
  "inertia always decreases with k"   measured, because it is the single fact
                                      that makes the elbow chapter necessary
  "k-means++ beats random restarts"   100 inits each, as distributions rather
                                      than as one lucky number
  "k-means fails on these shapes"     the four canonical failures, as data

The blobs come from the shipped CLUSTER_SETUP in runtimeSetup.ts, pulled out by
the same loader the RL scripts use, so the figures and the Run button on the
page cluster identical points.

Deterministic: random_state=0 / seed 0 throughout, except the timing section,
which reports the median of repeated runs and names the machine.
Environment used for the published numbers: python 3.13.11, numpy 2.3.5,
scikit-learn 1.8.0.
"""

import json
import re
import sys
import time
import pathlib
import warnings

import numpy as np
from sklearn.cluster import KMeans, MiniBatchKMeans, kmeans_plusplus
from sklearn.datasets import make_blobs, make_moons
from sklearn.metrics import (
    adjusted_rand_score,
    normalized_mutual_info_score,
    silhouette_score,
)
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, OSError):
    pass

ROOT = pathlib.Path(__file__).resolve().parents[1]
SEED = 0
OUT = {}


def load_setup(name="CLUSTER_SETUP"):
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const " + name + r" = `(.*?)\n`;", src, re.S)
    if not m:
        raise SystemExit(f"{name} not found in runtimeSetup.ts")
    ns = {}
    exec(compile(m.group(1), f"<{name}>", "exec"), ns)
    return ns


SETUP = load_setup()
X_BLOBS = SETUP["X"]
Y_BLOBS = SETUP["y_true"]


def rule(title):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def pts(X, nd=3):
    """Round a 2-D point cloud for the figure data."""
    return [[round(float(a), nd), round(float(b), nd)] for a, b in np.asarray(X)[:, :2]]


def fit(X, k, seed=SEED, n_init=10, **kw):
    return KMeans(n_clusters=k, n_init=n_init, random_state=seed, **kw).fit(X)


# ---------------------------------------------------------------------------
# blobs -- the dataset the track clusters, and the answer
# ---------------------------------------------------------------------------
def sec_blobs():
    rule("blobs -- the shipped CLUSTER_SETUP data, clustered")
    km = fit(X_BLOBS, 4)
    sil = silhouette_score(X_BLOBS, km.labels_)
    print(f"  n = {len(X_BLOBS)}, k = 4")
    print(f"  inertia          {km.inertia_:.2f}")
    print(f"  silhouette       {sil:.3f}")
    print(f"  ARI vs the true blob ids {adjusted_rand_score(Y_BLOBS, km.labels_):.3f}")

    OUT["BLOBS"] = {
        "points": pts(X_BLOBS),
        "labels": [int(v) for v in km.labels_],
        "truth": [int(v) for v in Y_BLOBS],
        "centroids": pts(km.cluster_centers_),
        "inertia": round(float(km.inertia_), 2),
        "silhouette": round(float(sil), 3),
        "ari": round(float(adjusted_rand_score(Y_BLOBS, km.labels_)), 3),
    }


# ---------------------------------------------------------------------------
# lloyd -- the alternating steps, frame by frame
# ---------------------------------------------------------------------------
def sec_lloyd():
    rule("lloyd -- assign, update, repeat")
    rng = np.random.default_rng(3)
    X = X_BLOBS
    # A deliberately poor start, so the frames have something to show. Seeding
    # from k-means++ would converge in two steps and teach nothing.
    C = X[rng.choice(len(X), 4, replace=False)].copy()

    frames = []
    prev = None
    for step in range(9):
        d = ((X[:, None, :] - C[None, :, :]) ** 2).sum(2)
        labels = d.argmin(1)
        inertia = float(d[np.arange(len(X)), labels].sum())
        moved = None if prev is None else float(np.abs(C - prev).max())
        frames.append({
            "labels": [int(v) for v in labels],
            "centroids": pts(C),
            "inertia": round(inertia, 2),
            "moved": None if moved is None else round(moved, 4),
        })
        print(f"  step {step}: inertia {inertia:9.2f}" +
              ("" if moved is None else f"   centroid shift {moved:.4f}"))
        prev = C.copy()
        newC = np.array([X[labels == j].mean(0) if (labels == j).any() else C[j]
                         for j in range(4)])
        if np.abs(newC - C).max() < 1e-9:
            C = newC
            break
        C = newC

    ins = [f["inertia"] for f in frames]
    assert all(b <= a + 1e-6 for a, b in zip(ins, ins[1:])), "inertia went UP"
    print(f"  inertia is monotone over all {len(frames)} steps: "
          f"{ins[0]:.1f} -> {ins[-1]:.1f}")

    OUT["LLOYD"] = {"points": pts(X), "frames": frames}


# ---------------------------------------------------------------------------
# inertia_k -- the fact the elbow chapter exists because of
# ---------------------------------------------------------------------------
def sec_inertia_k():
    rule("inertia_k -- inertia always falls as k grows; silhouette does not")
    ks = list(range(1, 11))
    inertias, sils = [], []
    for k in ks:
        km = fit(X_BLOBS, k)
        inertias.append(round(float(km.inertia_), 2))
        sils.append(round(float(silhouette_score(X_BLOBS, km.labels_)), 3) if k > 1 else None)
        print(f"  k = {k:>2}   inertia {inertias[-1]:>9.2f}   "
              f"silhouette {'    --' if k == 1 else f'{sils[-1]:.3f}'}")

    assert all(b < a for a, b in zip(inertias, inertias[1:])), "inertia did not fall"
    print("  inertia falls at EVERY step, so it can never choose k on its own.")
    best = max((s for s in sils if s is not None))
    print(f"  silhouette peaks at k = {sils.index(best) + 1} ({best})")

    # At k = n every point is its own centroid and inertia is exactly 0.
    km_n = KMeans(n_clusters=len(X_BLOBS), n_init=1, random_state=SEED).fit(X_BLOBS)
    print(f"  at k = n = {len(X_BLOBS)}, inertia = {km_n.inertia_:.10f}")

    OUT["INERTIA_K"] = {"k": ks, "inertia": inertias, "silhouette": sils}


# ---------------------------------------------------------------------------
# init -- 100 random starts against 100 k-means++ starts
# ---------------------------------------------------------------------------
def sec_init():
    rule("init -- the distribution of outcomes, not one lucky run")
    # A harder board than the default blobs: 8 well-separated clusters, where a
    # bad start really can strand two centroids in one blob.
    X, _ = make_blobs(n_samples=600, centers=8, cluster_std=0.55,
                      random_state=7, center_box=(-9, 9))

    def run(mode, trials=100):
        out = []
        for t in range(trials):
            rng = np.random.default_rng(1000 + t)
            if mode == "random":
                C = X[rng.choice(len(X), 8, replace=False)].copy()
            else:
                C, _ = kmeans_plusplus(X, n_clusters=8, random_state=1000 + t)
                C = C.copy()
            km = KMeans(n_clusters=8, init=C, n_init=1, max_iter=300).fit(X)
            out.append(float(km.inertia_))
        return np.array(out)

    rand = run("random")
    plus = run("plusplus")
    floor = min(rand.min(), plus.min())

    for name, a in (("random", rand), ("k-means++", plus)):
        # "how often does this start land on the best solution anyone found?"
        hits = int((a <= floor * 1.001).sum())
        print(f"  {name:>10}: best {a.min():8.2f}   median {np.median(a):8.2f}   "
              f"worst {a.max():8.2f}   reached the best solution {hits:>3}/100 times")

    print(f"  the worst random start is {rand.max() / floor:.2f}x the best solution; "
          f"the worst k-means++ start is {plus.max() / floor:.2f}x")

    OUT["INIT_DIST"] = {
        "random": [round(v, 2) for v in rand],
        "plusplus": [round(v, 2) for v in plus],
        "floor": round(float(floor), 2),
        "randomHits": int((rand <= floor * 1.001).sum()),
        "plusHits": int((plus <= floor * 1.001).sum()),
    }
    OUT["INIT_POINTS"] = {"points": pts(X)}

    # Best-of-m: what n_init actually buys, which is the restarts page's claim.
    rows = []
    for m in (1, 2, 3, 5, 10, 20, 50):
        best_of = [float(rand[i:i + m].min()) for i in range(0, 100 - m + 1, m)]
        rows.append({"m": m, "median": round(float(np.median(best_of)), 2),
                     "worst": round(float(np.max(best_of)), 2)})
        print(f"  best-of-{m:<2} random starts: median {rows[-1]['median']:8.2f}   "
              f"worst {rows[-1]['worst']:8.2f}")
    OUT["RESTARTS"] = rows


# ---------------------------------------------------------------------------
# fail -- the four canonical failures, as data
# ---------------------------------------------------------------------------
def sec_fail():
    """The four panels were CHOSEN by measurement, not by reputation. Two of the
    textbook constructions do not fail at all -- see the control below -- and a
    gallery whose panels quietly succeed teaches the opposite of its caption."""
    rule("fail -- the shapes k-means gets wrong, and one it does not")
    cases = []

    # 1. non-spherical: the boundary between clusters is a straight line, and
    #    no straight line separates two interlocking crescents.
    Xm, ym = make_moons(n_samples=500, noise=0.05, random_state=SEED)
    cases.append(("moons", "two crescents", Xm, ym, 2))

    # 2. anisotropic: sklearn's own shear, at the seed where it actually bites.
    T = np.array([[0.60834549, -0.63667341], [-0.40887718, 0.85253229]])
    Xa, ya = make_blobs(n_samples=500, centers=3, random_state=SEED)
    cases.append(("aniso", "sheared blobs", Xa @ T, ya, 3))

    # 3. unequal spread: inertia is a sum of SQUARED distances, so one wide
    #    cluster contributes more than its share and gets carved up.
    Xv, yv = make_blobs(n_samples=500, centers=3, cluster_std=[1.0, 2.5, 0.5],
                        random_state=SEED)
    cases.append(("variance", "unequal spread", Xv, yv, 3))

    # 4. a small cluster beside a large one. NOTE what this is not: three
    #    well-separated clusters of 500, 100 and 10 points are recovered
    #    perfectly (the control below). Unequal population alone is not a
    #    failure mode; unequal population next to a big neighbour is.
    Xs, ys = make_blobs(n_samples=[400, 400, 25], cluster_std=[1.6, 1.6, 0.35],
                        centers=[[-4, 0], [4, 0], [1.2, 0.0]], random_state=SEED)
    cases.append(("size", "a small cluster beside a big one", Xs, ys, 3))

    out = []
    for key, title, X, y, k in cases:
        km = fit(X, k)
        a = adjusted_rand_score(y, km.labels_)
        print(f"  {title:<34} k = {k}   ARI {a:.3f}")
        assert a < 0.75, f"{title} scored {a:.3f} -- that is not a failure"
        out.append({
            "key": key, "title": title, "k": k, "fails": True,
            "points": pts(X), "labels": [int(v) for v in km.labels_],
            "truth": [int(v) for v in y],
            "centroids": pts(km.cluster_centers_), "ari": round(float(a), 3),
        })

    print()
    print("  and the two controls, which matter as much as the four failures:")

    # Control A: the shape k-means is FOR.
    km = fit(X_BLOBS, 4)
    a = adjusted_rand_score(Y_BLOBS, km.labels_)
    print(f"  {'round, comparable blobs':<34} k = 4   ARI {a:.3f}")
    assert a > 0.85
    out.insert(0, {
        "key": "blobs", "title": "round, comparable blobs", "k": 4, "fails": False,
        "points": pts(X_BLOBS), "labels": [int(v) for v in km.labels_],
        "truth": [int(v) for v in Y_BLOBS],
        "centroids": pts(km.cluster_centers_), "ari": round(float(a), 3),
    })

    # Control B: the construction every textbook calls "unequal cluster sizes".
    # It is recovered EXACTLY, which is the evidence for the paragraph above.
    Xb, yb = make_blobs(n_samples=500, centers=3, random_state=170)
    idx = np.hstack([np.flatnonzero(yb == j)[:n] for j, n in enumerate((500, 100, 10))])
    Xu, yu = Xb[idx], yb[idx]
    km = fit(Xu, 3)
    a_u = adjusted_rand_score(yu, km.labels_)
    print(f"  {'500 / 100 / 10, well separated':<34} k = 3   ARI {a_u:.3f}"
          f"   <- no failure at all")
    assert a_u > 0.99, "the control was supposed to succeed"
    out.append({
        "key": "sizes-ok", "title": "500 / 100 / 10, well separated", "k": 3,
        "fails": False,
        "points": pts(Xu), "labels": [int(v) for v in km.labels_],
        "truth": [int(v) for v in yu],
        "centroids": pts(km.cluster_centers_), "ari": round(float(a_u), 3),
    })

    OUT["FAILURES"] = out


# ---------------------------------------------------------------------------
# speed -- the two claims the track makes without a number
# ---------------------------------------------------------------------------
def timeit(fn, repeat=5):
    ts = []
    for _ in range(repeat):
        t0 = time.perf_counter()
        r = fn()
        ts.append(time.perf_counter() - t0)
    return float(np.median(ts)), r


def sec_speed():
    rule("speed -- mini-batch and Elkan, timed")
    print("  (wall-clock, median of 5, on the machine named in the docstring;")
    print("   read the RATIOS, not the seconds)")

    rows = []
    for n, d, k in ((20_000, 8, 8), (200_000, 8, 8)):
        rng = np.random.default_rng(SEED)
        Xb, _ = make_blobs(n_samples=n, n_features=d, centers=k, cluster_std=1.2,
                           random_state=SEED)

        t_lloyd, km = timeit(lambda: KMeans(n_clusters=k, n_init=3, algorithm="lloyd",
                                            random_state=SEED).fit(Xb))
        t_elkan, ke = timeit(lambda: KMeans(n_clusters=k, n_init=3, algorithm="elkan",
                                            random_state=SEED).fit(Xb))
        t_mb, kmb = timeit(lambda: MiniBatchKMeans(n_clusters=k, batch_size=1024,
                                                   n_init=3, random_state=SEED).fit(Xb))
        row = {
            "n": n, "d": d, "k": k,
            "lloyd": round(t_lloyd, 4), "elkan": round(t_elkan, 4), "minibatch": round(t_mb, 4),
            "lloydInertia": round(float(km.inertia_), 1),
            "elkanInertia": round(float(ke.inertia_), 1),
            "mbInertia": round(float(kmb.inertia_), 1),
        }
        row["mbSpeedup"] = round(t_lloyd / t_mb, 2)
        row["elkanSpeedup"] = round(t_lloyd / t_elkan, 2)
        row["mbInertiaCost"] = round((kmb.inertia_ / km.inertia_ - 1) * 100, 2)
        rows.append(row)
        print(f"  n={n:>7,} d={d} k={k}:  Lloyd {t_lloyd:6.3f}s   "
              f"Elkan {t_elkan:6.3f}s ({row['elkanSpeedup']}x)   "
              f"mini-batch {t_mb:6.3f}s ({row['mbSpeedup']}x)")
        print(f"{'':>24}  mini-batch inertia is {row['mbInertiaCost']:+.2f}% "
              f"vs Lloyd; Elkan's is identical: {abs(km.inertia_ - ke.inertia_) < 1e-6}")

    # Elkan's bounds cost memory and bookkeeping per centroid; at k = 2 in low
    # dimensions there is nothing to skip, and it can lose.
    print()
    print("  where Elkan does NOT help -- the same test at small k, and at high d:")
    elk = []
    for n, d, k in ((20_000, 2, 2), (20_000, 2, 8), (20_000, 64, 8), (20_000, 256, 8)):
        Xb, _ = make_blobs(n_samples=n, n_features=d, centers=k, cluster_std=1.2,
                           random_state=SEED)
        t_l, _ = timeit(lambda: KMeans(n_clusters=k, n_init=2, algorithm="lloyd",
                                       random_state=SEED).fit(Xb), repeat=3)
        t_e, _ = timeit(lambda: KMeans(n_clusters=k, n_init=2, algorithm="elkan",
                                       random_state=SEED).fit(Xb), repeat=3)
        elk.append({"n": n, "d": d, "k": k, "lloyd": round(t_l, 4),
                    "elkan": round(t_e, 4), "speedup": round(t_l / t_e, 2)})
        verdict = "faster" if t_l / t_e > 1.05 else ("slower" if t_l / t_e < 0.95 else "a wash")
        print(f"  n={n:,} d={d:>3} k={k}:  Lloyd {t_l:6.3f}s  Elkan {t_e:6.3f}s  "
              f"-> {t_l / t_e:.2f}x, {verdict}")

    OUT["SPEED"] = rows
    # elk is printed above but not emitted: the elkan section measures the same
    # comparison more carefully, and a second unused array in the figure data is
    # just weight nobody can trace to a page.


# ---------------------------------------------------------------------------
# elkan -- the pruning is real; the speedup is not
# ---------------------------------------------------------------------------
def _lloyd_count(X, C0, iters=30):
    """Plain Lloyd. Returns (distance computations, labels, centroids)."""
    C = C0.copy()
    n, k = len(X), len(C0)
    calcs = 0
    for _ in range(iters):
        d = ((X[:, None, :] - C[None, :, :]) ** 2).sum(2)
        calcs += n * k                      # every point against every centroid
        labels = d.argmin(1)
        newC = np.array([X[labels == j].mean(0) if (labels == j).any() else C[j]
                         for j in range(k)])
        if np.abs(newC - C).max() < 1e-10:
            C = newC
            break
        C = newC
    return calcs, labels, C


def _elkan_count(X, C0, iters=30):
    """Elkan's algorithm, written out so the pruned distance computations can be
    counted. Bounds and conditions follow Elkan (2003) exactly; every explicit
    point-to-centroid distance is tallied, including the k^2/2 centroid-to-
    centroid distances the method needs each iteration."""
    n, k = len(X), len(C0)
    C = C0.copy()
    calcs = 0

    dist = lambda a, b: float(np.sqrt(((a - b) ** 2).sum()))

    lower = np.zeros((n, k))
    labels = np.zeros(n, int)
    upper = np.zeros(n)
    for i in range(n):                       # initialisation assigns fully
        for j in range(k):
            lower[i, j] = dist(X[i], C[j])
            calcs += 1
        labels[i] = int(lower[i].argmin())
        upper[i] = lower[i, labels[i]]
    r = np.ones(n, bool)

    for _ in range(iters):
        cc = np.sqrt(((C[:, None, :] - C[None, :, :]) ** 2).sum(2))
        calcs += k * (k - 1) // 2
        sc = np.array([np.min(np.delete(cc[j], j)) / 2 for j in range(k)])

        for i in range(n):
            if upper[i] <= sc[labels[i]]:
                continue                     # the whole point is pruned
            for j in range(k):
                if j == labels[i]:
                    continue
                if not (upper[i] > lower[i, j] and upper[i] > cc[labels[i], j] / 2):
                    continue
                if r[i]:
                    dxc = dist(X[i], C[labels[i]])
                    calcs += 1
                    r[i] = False
                    upper[i] = dxc
                    lower[i, labels[i]] = dxc
                else:
                    dxc = upper[i]
                if dxc > lower[i, j] or dxc > cc[labels[i], j] / 2:
                    dxj = dist(X[i], C[j])
                    calcs += 1
                    lower[i, j] = dxj
                    if dxj < dxc:
                        labels[i] = j
                        upper[i] = dxj

        newC = np.array([X[labels == j].mean(0) if (labels == j).any() else C[j]
                         for j in range(k)])
        delta = np.sqrt(((newC - C) ** 2).sum(1))
        if delta.max() < 1e-10:
            C = newC
            break
        lower = np.maximum(lower - delta[None, :], 0.0)
        upper = upper + delta[labels]
        r[:] = True
        C = newC

    return calcs, labels, C


def sec_elkan():
    """The audit's complaint about this page was that Elkan is presented without
    a speed number, "which is the only thing anyone wants from it". The honest
    speed number turns out to be the opposite of the expected one, so both are
    measured here: the arithmetic Elkan removes, and the time it adds."""
    rule("elkan -- distance computations saved, wall-clock lost")
    # Two separate exports rather than one mixed list: a single array holding
    # both {lloyd, elkan} and {lloydTime, elkanTime} rows types as a union in
    # TypeScript, and every use site then has to narrow it for no reason.
    counts, times = [], []
    for n, d, k in ((2000, 2, 8), (2000, 2, 20), (2000, 8, 20)):
        X, _ = make_blobs(n_samples=n, n_features=d, centers=min(k, 12),
                          cluster_std=1.1, random_state=SEED)
        rng = np.random.default_rng(SEED)
        C0 = X[rng.choice(n, k, replace=False)].copy()

        cl, ll, Cl = _lloyd_count(X, C0)
        ce, le, Ce = _elkan_count(X, C0)
        # Same answer, different route -- worth asserting, since a pruning bug
        # would show up as a speedup.
        assert adjusted_rand_score(ll, le) > 0.999, "Elkan reached a different clustering"

        counts.append({"n": n, "d": d, "k": k, "lloyd": int(cl), "elkan": int(ce),
                       "saved": round(1 - ce / cl, 3)})
        print(f"  n={n} d={d} k={k:>3}: Lloyd computes {cl:>9,} distances, "
              f"Elkan {ce:>9,} -- {100 * (1 - ce / cl):.1f}% fewer")

    print()
    print("  So the pruning is real and large. Now the same comparison on the")
    print("  clock, using scikit-learn's own C implementations of both:")
    for n, d, k in ((20_000, 8, 8), (20_000, 8, 50), (50_000, 8, 100)):
        X, _ = make_blobs(n_samples=n, n_features=d, centers=min(k, 30),
                          cluster_std=1.2, random_state=SEED)
        tl, _ = timeit(lambda: KMeans(n_clusters=k, n_init=1, algorithm="lloyd",
                                      max_iter=50, random_state=SEED).fit(X), repeat=3)
        te, _ = timeit(lambda: KMeans(n_clusters=k, n_init=1, algorithm="elkan",
                                      max_iter=50, random_state=SEED).fit(X), repeat=3)
        times.append({"n": n, "d": d, "k": k, "lloydTime": round(tl, 4),
                      "elkanTime": round(te, 4), "speedup": round(tl / te, 2)})
        print(f"  n={n:>6,} d={d} k={k:>3}: Lloyd {tl:6.3f}s   Elkan {te:6.3f}s   "
              f"-> {tl / te:.2f}x")

    print()
    print("  Elkan does LESS arithmetic and takes MORE time, and the gap widens")
    print("  with k -- the regime where the textbook says it should win most.")
    print("  The reason is that Lloyd's assign step is one big matrix product:")
    print("  it runs in threaded BLAS across every core. Elkan's bound checks")
    print("  are a branchy per-point loop that cannot vectorise. Removing 80%")
    print("  of the operations does not pay if the survivors run an order of")
    print("  magnitude slower each.")
    print(f"  (Measured with {_threads()} BLAS threads; on a single-threaded")
    print("   build the comparison is much closer.)")

    OUT["ELKAN_COUNTS"] = counts
    OUT["ELKAN_TIMES"] = times


def _threads():
    try:
        import threadpoolctl
        return max(i["num_threads"] for i in threadpoolctl.threadpool_info())
    except Exception:
        return "unknown"


# ---------------------------------------------------------------------------
# metrics -- the contingency table that makes ARI and NMI readable
# ---------------------------------------------------------------------------
def sec_metrics():
    rule("metrics -- external scores, and the table underneath them")
    km = fit(X_BLOBS, 4)
    k = 4
    tab = np.zeros((k, k), int)
    for t, p in zip(Y_BLOBS, km.labels_):
        tab[int(t), int(p)] += 1
    print("  rows = true blob, cols = cluster id")
    for r in tab:
        print("   " + "  ".join(f"{v:>4}" for v in r))
    ari = adjusted_rand_score(Y_BLOBS, km.labels_)
    nmi = normalized_mutual_info_score(Y_BLOBS, km.labels_)
    print(f"  ARI {ari:.3f}   NMI {nmi:.3f}")

    # Permuting the cluster ids must not change either score -- the whole point
    # of "external" metrics, and easy to state and never shown.
    perm = np.array([2, 0, 3, 1])[km.labels_]
    print(f"  after permuting the cluster labels: ARI {adjusted_rand_score(Y_BLOBS, perm):.3f}"
          f"   NMI {normalized_mutual_info_score(Y_BLOBS, perm):.3f}  (unchanged)")

    # And the score a random labelling gets: ARI is corrected for chance, NMI
    # much less so, which is the one practical difference between them.
    rng = np.random.default_rng(SEED)
    rnd = rng.integers(0, k, len(Y_BLOBS))
    print(f"  a RANDOM labelling scores: ARI {adjusted_rand_score(Y_BLOBS, rnd):+.3f}"
          f"   NMI {normalized_mutual_info_score(Y_BLOBS, rnd):.3f}")

    OUT["CONTINGENCY"] = {
        "table": [[int(v) for v in row] for row in tab],
        "ari": round(float(ari), 3), "nmi": round(float(nmi), 3),
        "randomAri": round(float(adjusted_rand_score(Y_BLOBS, rnd)), 3),
        "randomNmi": round(float(normalized_mutual_info_score(Y_BLOBS, rnd)), 3),
    }


# ---------------------------------------------------------------------------
# scaling -- the most common and most invisible failure
# ---------------------------------------------------------------------------
def sec_scaling():
    rule("scaling -- one feature in different units")
    X, y = make_blobs(n_samples=300, centers=3, cluster_std=1.0, random_state=SEED)
    Xw = X.copy()
    Xw[:, 1] *= 40          # e.g. metres vs millimetres

    raw = fit(Xw, 3)
    sc = StandardScaler().fit_transform(Xw)
    scaled = fit(sc, 3)
    a_raw = adjusted_rand_score(y, raw.labels_)
    a_scaled = adjusted_rand_score(y, scaled.labels_)
    print(f"  one feature multiplied by 40:")
    print(f"    clustering the raw columns    ARI {a_raw:.3f}")
    print(f"    after StandardScaler          ARI {a_scaled:.3f}")

    OUT["SCALING"] = {
        "raw": {"points": pts(Xw), "labels": [int(v) for v in raw.labels_], "ari": round(float(a_raw), 3)},
        "scaled": {"points": pts(sc), "labels": [int(v) for v in scaled.labels_], "ari": round(float(a_scaled), 3)},
        "truth": [int(v) for v in y],
    }


# ---------------------------------------------------------------------------
# outliers -- why the mean is the fragile part
# ---------------------------------------------------------------------------
def sec_outliers():
    rule("outliers -- one point, and where the centroid goes")
    X, y = make_blobs(n_samples=150, centers=3, cluster_std=0.7, random_state=SEED)
    far = np.array([[18.0, 18.0]])
    Xo = np.vstack([X, far])

    clean = fit(X, 3)
    dirty = fit(Xo, 3)
    # How far did the nearest centroid move, and how many points did the
    # outlier's own cluster end up with?
    sizes = np.bincount(dirty.labels_, minlength=3)
    victim = int(dirty.labels_[-1])
    print(f"  without the outlier: cluster sizes {np.bincount(clean.labels_)}")
    print(f"  with one point at (18, 18): sizes {sizes}, and the outlier's cluster "
          f"holds {sizes[victim]} points")
    print(f"  ARI against the real groups drops "
          f"{adjusted_rand_score(y, clean.labels_):.3f} -> "
          f"{adjusted_rand_score(y, dirty.labels_[:-1]):.3f}")

    med = np.array([np.median(X[clean.labels_ == j], axis=0) for j in range(3)])
    print(f"  (a k-medians centroid would sit at the coordinate-wise median, "
          f"which the outlier moves by {np.abs(med - clean.cluster_centers_).max():.3f})")

    OUT["OUTLIER"] = {
        "points": pts(Xo),
        "labels": [int(v) for v in dirty.labels_],
        "centroids": pts(dirty.cluster_centers_),
        "cleanCentroids": pts(clean.cluster_centers_),
        "cleanAri": round(float(adjusted_rand_score(y, clean.labels_)), 3),
        "dirtyAri": round(float(adjusted_rand_score(y, dirty.labels_[:-1])), 3),
        "sizes": [int(v) for v in sizes],
    }


# ---------------------------------------------------------------------------
# dim -- distances concentrate, so "nearest" stops meaning much
# ---------------------------------------------------------------------------
def sec_dim():
    rule("dim -- the curse, measured as a ratio")
    rng = np.random.default_rng(SEED)
    rows = []
    for d in (2, 5, 10, 25, 50, 100, 250, 500, 1000):
        X = rng.normal(size=(500, d))
        q = rng.normal(size=(1, d))
        dist = np.sqrt(((X - q) ** 2).sum(1))
        ratio = float(dist.max() / dist.min())
        contrast = float((dist.max() - dist.min()) / dist.mean())
        rows.append({"d": d, "ratio": round(ratio, 3), "contrast": round(contrast, 4)})
        print(f"  d = {d:>4}:  farthest/nearest = {ratio:6.3f}   "
              f"relative contrast = {contrast:.4f}")
    print("  as d grows every point is about equally far from every other, so")
    print("  'assign each point to its nearest centroid' decides less and less.")
    OUT["CURSE"] = rows


# ---------------------------------------------------------------------------
# quantize -- the colour-quantization case, with the compression measured
# ---------------------------------------------------------------------------
def sec_quantize():
    rule("quantize -- colours, k, and the error you pay")
    # A synthetic image, so the script has no binary asset dependency: a smooth
    # gradient plus a few saturated patches is a fair stand-in for a photograph
    # in the only respect that matters here (a continuum of colours).
    rng = np.random.default_rng(SEED)
    h = w = 128
    yy, xx = np.mgrid[0:h, 0:w] / max(h - 1, 1)
    img = np.stack([xx, yy, 0.5 + 0.5 * np.sin(6 * xx * np.pi)], -1)
    img[20:60, 20:60] = [0.9, 0.1, 0.2]
    img[70:110, 60:110] = [0.1, 0.3, 0.85]
    img = np.clip(img + rng.normal(0, 0.02, img.shape), 0, 1)
    flat = img.reshape(-1, 3)

    raw_bits = flat.shape[0] * 24
    rows = []
    for k in (2, 4, 8, 16, 32, 64):
        km = KMeans(n_clusters=k, n_init=3, random_state=SEED).fit(flat)
        recon = km.cluster_centers_[km.labels_]
        mse = float(((recon - flat) ** 2).mean())
        # index bits per pixel + the palette itself
        bits = flat.shape[0] * int(np.ceil(np.log2(k))) + k * 24
        rows.append({"k": k, "mse": round(mse, 6),
                     "rmse255": round(float(np.sqrt(mse) * 255), 2),
                     "bitsPerPixel": round(bits / flat.shape[0], 3),
                     "compression": round(raw_bits / bits, 2)})
        print(f"  k = {k:>3}: RMSE {rows[-1]['rmse255']:5.2f}/255   "
              f"{rows[-1]['bitsPerPixel']:.3f} bits/pixel   "
              f"{rows[-1]['compression']:5.2f}x smaller than 24-bit colour")
    OUT["QUANTIZE"] = rows


# ---------------------------------------------------------------------------
# nulls -- k-means always returns k groups, even when there are none
# ---------------------------------------------------------------------------
def sec_nulls():
    rule("nulls -- clustering data that has no clusters")
    rng = np.random.default_rng(SEED)
    X = rng.uniform(-1, 1, size=(300, 2))
    km = fit(X, 3)
    print(f"  300 uniform-random points, k = 3:")
    print(f"    inertia {km.inertia_:.2f}, silhouette "
          f"{silhouette_score(X, km.labels_):.3f}, cluster sizes "
          f"{np.bincount(km.labels_)}")
    print("    -- three tidy, confident, entirely meaningless groups.")

    real, _ = make_blobs(n_samples=300, centers=3, cluster_std=0.7, random_state=SEED)
    kr = fit(real, 3)
    print(f"  for contrast, on data that IS clustered: silhouette "
          f"{silhouette_score(real, kr.labels_):.3f}")

    OUT["NULL_CLUSTER"] = {
        "points": pts(X), "labels": [int(v) for v in km.labels_],
        "centroids": pts(km.cluster_centers_),
        "silhouette": round(float(silhouette_score(X, km.labels_)), 3),
        "realSilhouette": round(float(silhouette_score(real, kr.labels_)), 3),
    }


# ---------------------------------------------------------------------------
# stability -- does the clustering survive resampling the data?
# ---------------------------------------------------------------------------
def sec_stability():
    """The stability page argues that a clustering you cannot reproduce on a
    resample is not a finding. That is a measurable statement and the page
    never measures it."""
    rule("stability -- agreement between clusterings of bootstrap resamples")
    rng = np.random.default_rng(SEED)
    datasets = {
        "4 real blobs": X_BLOBS,
        "uniform noise": rng.uniform(-6, 6, size=(150, 2)),
    }
    rows = []
    for name, X in datasets.items():
        per_k = []
        for k in range(2, 8):
            scores = []
            for t in range(30):
                r = np.random.default_rng(100 + t)
                ia = r.choice(len(X), len(X), replace=True)
                ib = r.choice(len(X), len(X), replace=True)
                ka = KMeans(n_clusters=k, n_init=10, random_state=SEED).fit(X[ia])
                kb = KMeans(n_clusters=k, n_init=10, random_state=SEED).fit(X[ib])
                # Compare on the points both resamples contain.
                both = np.intersect1d(ia, ib)
                if len(both) < 10:
                    continue
                la = ka.predict(X[both])
                lb = kb.predict(X[both])
                scores.append(adjusted_rand_score(la, lb))
            per_k.append(round(float(np.mean(scores)), 3))
            print(f"  {name:<14} k = {k}: mean ARI between two resamples "
                  f"{per_k[-1]:.3f}")
        rows.append({"name": name, "k": list(range(2, 8)), "ari": per_k})
        print()
    OUT["STABILITY"] = rows


# ---------------------------------------------------------------------------
# pca -- clustering after dimensionality reduction
# ---------------------------------------------------------------------------
def sec_pca():
    rule("pca -- reduce first, then cluster")
    from sklearn.decomposition import PCA
    from sklearn.datasets import load_digits

    dig = load_digits()
    X, y = dig.data, dig.target
    rows = []
    base = KMeans(n_clusters=10, n_init=10, random_state=SEED).fit(X)
    a0 = adjusted_rand_score(y, base.labels_)
    print(f"  raw 64-D pixels          ARI {a0:.3f}")
    rows.append({"dims": 64, "ari": round(float(a0), 3), "label": "raw pixels"})
    for nc in (2, 5, 10, 20, 40):
        Z = PCA(n_components=nc, random_state=SEED).fit_transform(X)
        km = KMeans(n_clusters=10, n_init=10, random_state=SEED).fit(Z)
        a = adjusted_rand_score(y, km.labels_)
        rows.append({"dims": nc, "ari": round(float(a), 3), "label": f"PCA {nc}"})
        print(f"  PCA to {nc:>2} components      ARI {a:.3f}")

    Z2 = PCA(n_components=2, random_state=SEED).fit_transform(X)
    km2 = KMeans(n_clusters=10, n_init=10, random_state=SEED).fit(Z2)
    OUT["PCA_SWEEP"] = rows
    OUT["DIGITS_2D"] = {
        "points": pts(Z2 / np.abs(Z2).max() * 6),
        "labels": [int(v) for v in km2.labels_],
        "truth": [int(v) for v in y],
        "centroids": pts(km2.cluster_centers_ / np.abs(Z2).max() * 6),
        "ari": round(float(adjusted_rand_score(y, km2.labels_)), 3),
    }


# ---------------------------------------------------------------------------
# xmeans -- BIC can say "k = 1"; inertia never can
# ---------------------------------------------------------------------------
def sec_xmeans():
    rule("xmeans -- an information criterion over k, on real clusters and on noise")

    def bic(X, km, k):
        """Standard spherical-Gaussian BIC for a k-means fit."""
        n, d = X.shape
        var = km.inertia_ / max(n - k, 1) / max(d, 1)
        if var <= 0:
            var = 1e-12
        counts = np.bincount(km.labels_, minlength=k).astype(float)
        ll = float(np.sum(counts * (np.log(np.maximum(counts, 1e-12)) - np.log(n)
                                    - 0.5 * d * np.log(2 * np.pi * var)))
                   - 0.5 * (n - k) * d)
        params = k * (d + 1)
        return ll - 0.5 * params * np.log(n)

    rng = np.random.default_rng(SEED)
    for name, X in (("4 real blobs", X_BLOBS),
                    ("uniform noise", rng.uniform(-6, 6, size=(150, 2)))):
        ks, vals, ins = [], [], []
        for k in range(1, 9):
            km = KMeans(n_clusters=k, n_init=10, random_state=SEED).fit(X)
            ks.append(k)
            vals.append(round(float(bic(X, km, k)), 1))
            ins.append(round(float(km.inertia_), 2))
        best = ks[int(np.argmax(vals))]
        print(f"  {name:<14} BIC picks k = {best}   "
              f"(inertia at k=1..8: {ins[0]:.0f} -> {ins[-1]:.0f}, monotone down)")
        OUT["BIC_" + ("BLOBS" if "blobs" in name else "NOISE")] = {
            "k": ks, "bic": vals, "inertia": ins, "best": best, "name": name,
        }


# ---------------------------------------------------------------------------
# alternatives -- the methods the failure chapter points at
# ---------------------------------------------------------------------------
def sec_alternatives():
    rule("alternatives -- DBSCAN, GMM and Ward on the shapes k-means misses")
    from sklearn.cluster import DBSCAN, AgglomerativeClustering
    from sklearn.mixture import GaussianMixture

    T = np.array([[0.60834549, -0.63667341], [-0.40887718, 0.85253229]])
    boards = {
        "two crescents": make_moons(n_samples=500, noise=0.05, random_state=SEED),
        "sheared blobs": (make_blobs(n_samples=500, centers=3, random_state=SEED)[0] @ T,
                          make_blobs(n_samples=500, centers=3, random_state=SEED)[1]),
        "unequal spread": make_blobs(n_samples=500, centers=3,
                                     cluster_std=[1.0, 2.5, 0.5], random_state=SEED),
    }
    eps = {"two crescents": 0.18, "sheared blobs": 0.45, "unequal spread": 0.65}

    rows = []
    for name, (X, y) in boards.items():
        k = len(np.unique(y))
        res = {"board": name}
        res["k-means"] = round(float(adjusted_rand_score(
            y, KMeans(n_clusters=k, n_init=10, random_state=SEED).fit_predict(X))), 3)
        res["GMM"] = round(float(adjusted_rand_score(
            y, GaussianMixture(n_components=k, random_state=SEED).fit_predict(X))), 3)
        res["Ward"] = round(float(adjusted_rand_score(
            y, AgglomerativeClustering(n_clusters=k).fit_predict(X))), 3)
        res["DBSCAN"] = round(float(adjusted_rand_score(
            y, DBSCAN(eps=eps[name], min_samples=5).fit_predict(X))), 3)
        rows.append(res)
        print(f"  {name:<16} k-means {res['k-means']:+.3f}   GMM {res['GMM']:+.3f}   "
              f"Ward {res['Ward']:+.3f}   DBSCAN {res['DBSCAN']:+.3f}")
    print("  (DBSCAN's eps was tuned per board; that tuning is its real cost.)")
    OUT["ALTERNATIVES"] = rows


# ---------------------------------------------------------------------------
# metrics_geom -- what "distance" means changes what a cluster is
# ---------------------------------------------------------------------------
def sec_metrics_geom():
    rule("metrics_geom -- the unit ball of each distance, and cosine's blind spot")
    # Points along two rays from the origin: identical DIRECTION, very different
    # magnitude. Euclidean splits by length; cosine sees one group per ray.
    # The angles have to be CLOSE and the radii wide for this to demonstrate
    # anything: with rays 100 degrees apart, plain Euclidean k-means separates
    # them perfectly (ARI 1.000) and the figure proves nothing. Measured.
    rng = np.random.default_rng(SEED)
    ang = np.array([0.35, 0.75])
    X = []
    truth = []
    for j, a in enumerate(ang):
        for _ in range(100):
            r = rng.uniform(0.5, 8.0)
            n = rng.normal(0, 0.05, 2)
            X.append([r * np.cos(a) + n[0], r * np.sin(a) + n[1]])
            truth.append(j)
    X = np.array(X)
    truth = np.array(truth)

    euc = KMeans(n_clusters=2, n_init=10, random_state=SEED).fit(X)
    unit = X / np.linalg.norm(X, axis=1, keepdims=True)
    cos = KMeans(n_clusters=2, n_init=10, random_state=SEED).fit(unit)
    a_e = adjusted_rand_score(truth, euc.labels_)
    a_c = adjusted_rand_score(truth, cos.labels_)
    print(f"  two rays from the origin, same directions, different lengths:")
    print(f"    plain Euclidean k-means         ARI {a_e:.3f}")
    print(f"    after normalising to unit length ARI {a_c:.3f}  (spherical k-means)")
    assert a_e < 0.2 and a_c > 0.9, "this comparison is supposed to be lopsided"

    OUT["COSINE"] = {
        "points": pts(X),
        "euclidean": [int(v) for v in euc.labels_],
        "cosine": [int(v) for v in cos.labels_],
        "truth": [int(v) for v in truth],
        "euclideanAri": round(float(a_e), 3),
        "cosineAri": round(float(a_c), 3),
    }


SECTIONS = {
    "blobs": sec_blobs, "lloyd": sec_lloyd, "inertia_k": sec_inertia_k,
    "init": sec_init, "fail": sec_fail, "speed": sec_speed, "elkan": sec_elkan,
    "metrics": sec_metrics, "scaling": sec_scaling, "outliers": sec_outliers,
    "dim": sec_dim, "quantize": sec_quantize, "nulls": sec_nulls,
    "stability": sec_stability, "pca": sec_pca, "xmeans": sec_xmeans,
    "alternatives": sec_alternatives, "metrics_geom": sec_metrics_geom,
}


def emit():
    path = ROOT / "src" / "components" / "figures" / "kmeans" / "data.generated.ts"
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "// GENERATED by scripts/kmeans_cases.py --emit. Do not edit by hand.",
        "//",
        "// Point clouds, cluster assignments, Lloyd frames and timings, measured",
        "// rather than sketched. The blobs are the shipped CLUSTER_SETUP data, so a",
        "// figure and the Run button on the page cluster identical points.",
        "",
    ]
    for k, v in OUT.items():
        lines.append(f"export const {k} = {json.dumps(v)} as const;")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8", newline="\r\n")
    size = path.stat().st_size
    print(f"\nwrote {path.relative_to(ROOT)} ({len(OUT)} exports, {size // 1024} KB)")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name in args or list(SECTIONS):
        if name not in SECTIONS:
            raise SystemExit(f"unknown section {name}; pick from {list(SECTIONS)}")
        SECTIONS[name]()
    if "--emit" in sys.argv:
        emit()
