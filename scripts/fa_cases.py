"""Honest numbers for the Function-approximation track.

Every figure quoted on a page in /learn/function-approximation is produced here,
by running the SHIPPED environment code (src/lib/runtimeSetup.ts -> FA_SETUP),
not a reimplementation of it. Run a section by name:

    python scripts/fa_cases.py walk
    python scripts/fa_cases.py mountaincar
    python scripts/fa_cases.py baird
    python scripts/fa_cases.py all

The setup string is extracted from the TypeScript so that what is verified here is
byte-identical to what the browser's Run button executes.
"""

import re
import sys
import time
import pathlib

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_setup(name="FA_SETUP"):
    """Pull a setup preamble out of runtimeSetup.ts and exec it."""
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const " + name + r" = `(.*?)\n`;", src, re.S)
    if not m:
        raise SystemExit(f"{name} not found in runtimeSetup.ts")
    body = m.group(1)
    # The TS template literal escapes backslashes for JS; undo the ones we use.
    body = body.replace("\\\\u", "\\u").replace("\\\\n", "\\n")
    ns = {}
    exec(compile(body, f"<{name}>", "exec"), ns)
    return ns


G = load_setup()
globals().update(G)


# --------------------------------------------------------------------------
def section(title):
    print("\n" + "=" * 72)
    print(title)
    print("=" * 72)


def aggregate_features(s, n_groups=10):
    """State aggregation: the bridge from a table. One binary feature per group."""
    return min((s - 1) * n_groups // N_STATES, n_groups - 1)


def walk():
    section("1000-state random walk: what approximation costs")

    t0 = time.time()
    V_true = walk_true_values()
    print(f"exact v_pi by DP                       ({time.time() - t0:.2f}s)")
    print(f"  v(1)    = {V_true[1]:+.4f}")
    print(f"  v(500)  = {V_true[500]:+.4f}   (500 is just left of centre, 500.5)")
    print(f"  v(1000) = {V_true[1000]:+.4f}")

    # --- the on-policy distribution mu, needed to weight the error honestly ---
    env = RandomWalk1000(0)
    counts = np.zeros(N_STATES + 2)
    for ep in range(2000):
        env.seed(ep)
        s = env.reset()
        while True:
            counts[s] += 1
            s, r, done = env.step()
            if done:
                break
    mu = counts[1:N_STATES + 1] / counts[1:N_STATES + 1].sum()
    print(f"\non-policy distribution mu: centre {mu[499]:.5f} vs edge {mu[0]:.5f} "
          f"= {mu[499] / mu[0]:.1f}x more visits")

    # --- gradient Monte Carlo with state aggregation --------------------------
    for n_groups in (10, 20):
        w = np.zeros(n_groups)
        alpha = 2e-5
        env = RandomWalk1000(0)
        for ep in range(100000):
            env.seed(ep)
            s = env.reset()
            traj = []
            while True:
                traj.append(s)
                s, r, done = env.step()
                if done:
                    break
            for st in traj:                       # every-visit, return is r (0 until the end)
                g = aggregate_features(st, n_groups)
                w[g] += alpha * (r - w[g])
        V_hat = np.array([w[aggregate_features(s, n_groups)] for s in range(1, N_STATES + 1)])
        err = rmse(V_hat, V_true[1:N_STATES + 1], mu)
        print(f"\ngradient MC, {n_groups:2d} groups   RMSE(mu-weighted) = {err:.4f}")
        print(f"   group values: {np.round(w, 3)[:10]}")

    # --- semi-gradient TD(0) with the same features ---------------------------
    n_groups = 10
    w = np.zeros(n_groups)
    alpha = 2e-4
    env = RandomWalk1000(0)
    for ep in range(100000):
        env.seed(100000 + ep)
        s = env.reset()
        while True:
            s2, r, done = env.step()
            g = aggregate_features(s, n_groups)
            target = r if done else w[aggregate_features(s2, n_groups)]
            w[g] += alpha * (target - w[g])
            s = s2
            if done:
                break
    V_td = np.array([w[aggregate_features(s, n_groups)] for s in range(1, N_STATES + 1)])
    err_td = rmse(V_td, V_true[1:N_STATES + 1], mu)
    print(f"\nsemi-gradient TD(0), 10 groups  RMSE(mu-weighted) = {err_td:.4f}")
    print(f"   group values: {np.round(w, 3)}")
    print("\n   NOTE the two disagree: MC minimises VE, TD converges to the TD fixed")
    print("   point, which is a DIFFERENT function. Neither is 'wrong'.")


# --------------------------------------------------------------------------
def mountaincar():
    section("Mountain Car: the table is not large, it is impossible")

    # --- baseline: acting at random ------------------------------------------
    lengths = []
    for ep in range(20):
        mc = MountainCar(ep)
        mc.reset()
        r = np.random.default_rng(ep)
        n = 0
        done = False
        while not done and n < 20000:
            _, _, done = mc.step(int(r.integers(3)))
            n += 1
        lengths.append(n if done else 20000)
    print(f"random policy over 20 episodes: median {int(np.median(lengths))} steps, "
          f"worst {max(lengths)} (cap 20000), reached goal {sum(l < 20000 for l in lengths)}/20")

    # --- tile-coded semi-gradient SARSA --------------------------------------
    def train(episodes=500, tilings=8, tiles=8, alpha=0.5, eps=0.0, seed=0, cap=5000):
        coder = mc_coder(tilings, tiles)
        w = np.zeros((MountainCar.nA, coder.size))
        rng = np.random.default_rng(seed)
        mc = MountainCar(seed)
        a_step = alpha / tilings
        out = []
        for ep in range(episodes):
            mc.seed(seed * 10000 + ep)
            s = mc.reset()
            f = coder.indices(s)
            qs = w[:, f].sum(axis=1)
            a = eps_greedy_q(qs, eps, rng)
            n = 0
            while True:
                s2, r, done = mc.step(a)
                n += 1
                q_sa = w[a, f].sum()
                if done or n >= cap:
                    w[a, f] += a_step * (r - q_sa)
                    break
                f2 = coder.indices(s2)
                qs2 = w[:, f2].sum(axis=1)
                a2 = eps_greedy_q(qs2, eps, rng)
                w[a, f] += a_step * (r + w[a2, f2].sum() - q_sa)
                f, a = f2, a2
            out.append(n)
        return w, coder, np.array(out)

    t0 = time.time()
    w, coder, lens = train()
    print(f"\nsemi-gradient SARSA, 8 tilings x 8x8, alpha=0.5/8   ({time.time() - t0:.1f}s)")
    print(f"  episode   1 : {lens[0]:5d} steps")
    print(f"  episode  10 : {lens[9]:5d} steps")
    print(f"  episode 100 : {lens[99]:5d} steps")
    print(f"  last 100 mean: {lens[-100:].mean():.1f} steps   best {lens.min()}")
    print(f"  weights stored: {w.size} vs a table over CONTINUOUS states: impossible")

    # --- generalisation width is a dial --------------------------------------
    print("\n  the width dial (last-100 mean steps, 500 episodes each):")
    for tilings, tiles in ((1, 8), (8, 8), (8, 16)):
        _, c, l = train(tilings=tilings, tiles=tiles)
        print(f"    {tilings:2d} tilings x {tiles:2d}x{tiles:<2d} -> {l[-100:].mean():7.1f}   "
              f"({c.size} weights/action)")


# --------------------------------------------------------------------------
def baird():
    section("Baird's counterexample: the deadly triad, in seven states")

    phi, b_probs, gamma = globals()["baird"]() if False else G["baird"]()
    w = BAIRD_W0.copy()
    alpha = 0.01
    rng = np.random.default_rng(0)

    print("every true value is 0, and w = 0 represents that exactly.")
    print("target policy: always SOLID (-> state 7). behaviour: dashed 6/7 of the time.\n")
    print(f"  {'step':>7}  {'||w||':>12}  {'max|v(s)|':>12}")
    norms = []
    for t in range(1, 1001):
        s = int(rng.integers(7))
        # behaviour picks dashed (uniform over states 1-6) with prob 6/7, else solid
        if rng.random() < b_probs[0]:
            s2 = int(rng.integers(6))
            rho = 0.0                      # target policy never takes dashed
        else:
            s2 = 6
            rho = 1.0 / b_probs[1]         # importance ratio for the solid action
        delta = 0.0 + gamma * phi[s2] @ w - phi[s] @ w
        w += alpha * rho * delta * phi[s]
        norms.append(np.linalg.norm(w))
        if t in (1, 10, 100, 500, 1000):
            print(f"  {t:7d}  {np.linalg.norm(w):12.2f}  {np.max(np.abs(phi @ w)):12.2f}")

    print(f"\n  ||w|| grew {norms[-1] / norms[0]:.1f}x. Nothing here is a bug: the")
    print("  environment is trivial, the representation is exact, the step size is")
    print("  small. Function approximation + bootstrapping + off-policy is enough.")

    # --- drop one leg of the triad -------------------------------------------
    w = BAIRD_W0.copy()
    rng = np.random.default_rng(0)
    for t in range(1000):
        s = int(rng.integers(7))
        if rng.random() < b_probs[0]:
            s2 = int(rng.integers(6))
        else:
            s2 = 6
        delta = 0.0 + gamma * phi[s2] @ w - phi[s] @ w
        w += alpha * delta * phi[s]        # rho == 1: ON-policy now
    print(f"\n  same code, ON-policy (drop one leg):  ||w|| = {np.linalg.norm(w):.2f}  (stable)")


# --------------------------------------------------------------------------
def ch2():
    """Chapter 2 — linear methods & features. Every number on pages 5-8."""
    section("Chapter 2: linear methods & features")
    S = np.arange(1, N_STATES + 1)
    x = (S - 1) / (N_STATES - 1)
    V_true = walk_true_values()[1:N_STATES + 1]
    mu = walk_mu()

    def episodes(budget, seed0=0):
        env = RandomWalk1000(0)
        for ep in range(budget):
            env.seed(seed0 + ep); s = env.reset(); tr = []
            while True:
                tr.append(s); s, r, d = env.step()
                if d: break
            yield tr, r

    def agg(k):
        X = np.zeros((N_STATES, k)); X[np.arange(N_STATES), [group_of(s, k) for s in S]] = 1.0
        return X

    feats = {
        "aggregation-10": agg(10),
        "polynomial-6": np.stack([x ** j for j in range(6)], axis=1),
        "Fourier-6": np.stack([np.cos(np.pi * j * x) for j in range(6)], axis=1),
    }

    def floor(X):
        W = np.sqrt(mu)[:, None]
        w, *_ = np.linalg.lstsq(W * X, np.sqrt(mu) * V_true, rcond=None)
        return rmse(X @ w, V_true, mu)

    # --- page 5: floors, conditioning, and what SGD actually reaches -------
    print("\n[p5] floor vs what gradient MC reaches in 10,000 episodes")
    grids = {"aggregation-10": (3e-4,), "polynomial-6": (5e-5, 2e-4, 5e-4, 2e-3),
             "Fourier-6": (5e-5, 2e-4, 5e-4)}
    for name, X in feats.items():
        print(f"  {name:15s} floor {floor(X):.4f}   cond {np.linalg.cond(X):8.1f}")
        for alpha in grids[name]:
            w = np.zeros(X.shape[1])
            for tr, r in episodes(10000):
                for st in tr:
                    f = X[st - 1]; w += alpha * (r - f @ w) * f
            print(f"      alpha={alpha:<7} reached {rmse(X @ w, V_true, mu):.4f}")

    # --- page 6: the resolution dial ---------------------------------------
    for budget, alpha in ((2000, 1e-3), (10000, 3e-4)):
        print(f"\n[p6] resolution dial, {budget} episodes, alpha={alpha}")
        for k in (2, 5, 10, 20, 50, 100, 1000):
            X = agg(k); g = np.array([group_of(s, k) for s in S]); w = np.zeros(k)
            for tr, r in episodes(budget):
                for st in tr:
                    j = g[st - 1]; w[j] += alpha * (r - w[j])
            print(f"   {k:5d} groups  floor {floor(X):.4f}   reached {rmse(w[g], V_true, mu):.4f}")

    # --- page 7: tile coding vs aggregation, like for like -----------------
    print("\n[p7] 5000 episodes, tile coding (50 tilings) vs aggregation")
    for k in (10, 20):
        g = np.array([group_of(s, k) for s in S])
        for alpha in (1e-3, 3e-4):
            w = np.zeros(k)
            for tr, r in episodes(5000):
                for st in tr:
                    j = g[st - 1]; w[j] += alpha * (r - w[j])
            print(f"   aggregation {k:3d} groups   alpha={alpha:<7} {rmse(w[g], V_true, mu):.4f}")
    for tilings, tiles in ((1, 6), (50, 6), (50, 11), (50, 21), (50, 41)):
        tc = TileCoder([1], [N_STATES], [tiles], tilings)
        idx = np.array([tc.indices([s]) for s in S])
        for alpha in (1e-3, 3e-4):
            w = np.zeros(tc.size); a = alpha / tilings
            for tr, r in episodes(5000):
                for st in tr:
                    f = idx[st - 1]; w[f] += a * (r - w[f].sum())
            print(f"   {tilings:2d} tilings, width {tc.width[0]:6.1f}  alpha={alpha:<7} "
                  f"{rmse(w[idx].sum(axis=1), V_true, mu):.4f}")

    # --- page 8: the TD fixed point, exactly, and sampled TD landing on it -
    print("\n[p8] where TD settles")
    P, rbar, mu_x = walk_model()
    X = agg(10); g = np.array([group_of(s, 10) for s in S])
    W = np.sqrt(mu_x)[:, None]
    w_ve, *_ = np.linalg.lstsq(W * X, np.sqrt(mu_x) * V_true, rcond=None)
    D = np.diag(mu_x)
    w_td = np.linalg.solve(X.T @ D @ (X - P @ X), X.T @ D @ rbar)
    w = np.zeros(10); env = RandomWalk1000(0)
    for ep in range(10000):
        env.seed(100000 + ep); s = env.reset()
        while True:
            s2, r, d = env.step()
            tgt = r if d else w[g[s2 - 1]]
            w[g[s - 1]] += 1e-3 * (tgt - w[g[s - 1]]); s = s2
            if d: break
    print(f"   VE optimum      VE {rmse(X @ w_ve, V_true, mu_x):.4f}")
    print(f"   TD fixed point  VE {rmse(X @ w_td, V_true, mu_x):.4f}")
    print(f"   sampled TD      VE {rmse(X @ w, V_true, mu_x):.4f}   "
          f"gap to fixed point {np.max(np.abs(w - w_td)):.4f}   gap to VE optimum {np.max(np.abs(w - w_ve)):.4f}")


def ch3():
    """Chapter 3 — control with approximation. Every number on pages 9-12."""
    section("Chapter 3: control with approximation")

    # --- page 9: semi-gradient SARSA on Mountain Car -----------------------
    t0 = time.time()
    w, coder, L = train_mc_sarsa(episodes=200)
    print("\n[p9] tile-coded semi-gradient SARSA, 8 tilings x 8x8, eps = 0")
    for k in (1, 10, 50, 100, 200):
        print(f"   episode {k:3d}: {L[k-1]:5d} steps")
    print(f"   last 20 mean {L[-20:].mean():.1f}   best {L.min()}   weights {w.size}")
    print(f"   longest episode {L.max()} (cap is 5000, so the cap never bit)  "
          f"({time.time() - t0:.1f}s)")

    # --- page 10: the greedy policy, and the frozen-policy trap ------------
    print("\n[p10] greedy drive from the valley floor (-0.5, 0)")
    mc = MountainCar(0); mc.reset(); mc.pos, mc.vel = -0.5, 0.0
    s = np.array([mc.pos, mc.vel]); path = [s[0]]; done = False
    while not done and len(path) <= 1000:
        a = int(np.argmax(w[:, coder.indices(s)].sum(axis=1)))
        s, r, done = mc.step(a); path.append(s[0])
    path = np.array(path)
    print(f"   {len(path)-1} steps, reached {done}, lowest {path.min():.3f} "
          f"at step {int(path.argmin())}")
    print(f"   last 200 steps between {path[-200:].min():.3f} and {path[-200:].max():.3f}"
          f"   (the valley floor is at -pi/6 = {-np.pi/6:.4f})")
    print("\n   greedy action map      < reverse   . coast   > forward")
    for v in np.linspace(MC_VEL[1], MC_VEL[0], 9):
        row = "".join("<.>"[int(np.argmax(w[:, coder.indices([p, v])].sum(axis=1)))]
                      for p in np.linspace(MC_POS[0], MC_POS[1], 18))
        print(f"     velocity {v:+.3f}  {row}")

    def drive(w0, cdr, pos, learning, cap=1000):
        "Drive from (pos, 0) under w0. learning=True keeps applying SARSA updates."
        ww = w0.copy()
        m = MountainCar(0); m.reset(); m.pos, m.vel = pos, 0.0
        st = np.array([pos, 0.0]); f = cdr.indices(st)
        a = int(np.argmax(ww[:, f].sum(axis=1))); n = 0
        while True:
            s2, r, d = m.step(a); n += 1
            q = ww[a, f].sum()
            if d or n >= cap:
                if learning:
                    ww[a, f] += (0.5 / 8) * (r - q)
                return d, n
            f2 = cdr.indices(s2); a2 = int(np.argmax(ww[:, f2].sum(axis=1)))
            if learning:
                ww[a, f] += (0.5 / 8) * (r + ww[a2, f2].sum() - q)
            f, a = f2, a2

    print("\n   frozen vs still-learning, same weights, same start:")
    for learning in (False, True):
        d, n = drive(w, coder, -0.5, learning)
        print(f"     learning={str(learning):5s}: reached {d} after {n} steps")

    starts = np.random.default_rng(123).uniform(-0.6, -0.4, 100)
    print("\n   frozen greedy policy over 100 starts from the training distribution:")
    for eps_ in (200, 300, 500):
        ww, cc, _ = train_mc_sarsa(episodes=eps_)
        wins = sum(drive(ww, cc, p, False)[0] for p in starts)
        print(f"     trained {eps_:3d} episodes: {wins}/100")
    rates = []
    for seed in range(10):
        ww, cc, _ = train_mc_sarsa(episodes=200, seed=seed)
        rates.append(sum(drive(ww, cc, p, False)[0] for p in starts))
    print(f"     200 episodes across 10 seeds: {rates}  mean {np.mean(rates):.1f}/100")

    # --- page 11: the width dial ------------------------------------------
    print("\n[p11] width dial, 100 episodes, seed 0 (the page's live cell)")
    for tiles in (4, 8, 16):
        _, c, l = train_mc_sarsa(episodes=100, tilings=8, tiles=tiles)
        print(f"   {tiles:2d}x{tiles:<2d} {c.width[0]:.3f} wide  {c.size:5d} weights  "
              f"first20 {l[:20].mean():7.1f}   ep81-100 {l[-20:].mean():7.1f}")

    print("\n[p11] width dial, 200 episodes, 5 seeds")
    for tiles in (4, 8, 16):
        early, late, tot = [], [], []
        for seed in range(5):
            _, _, l = train_mc_sarsa(episodes=200, tilings=8, tiles=tiles, seed=seed)
            early.append(l[:20].mean()); late.append(l[-50:].mean()); tot.append(l.sum())
        e, la, to = map(np.array, (early, late, tot))
        print(f"   {tiles:2d}x{tiles:<2d}: first20 {e.mean():6.1f} +- {e.std(ddof=0):4.1f}   "
              f"last50 {la.mean():6.1f} +- {la.std(ddof=0):4.1f}   total {to.mean():8.0f}")
        print(f"          per-seed last50 {np.round(la, 1).tolist()}")

    print("\n[p11] the OTHER dial: 1 tiling vs 8, same tile size, 200 episodes")
    for tilings in (1, 8):
        _, c, l = train_mc_sarsa(episodes=200, tilings=tilings, tiles=8)
        print(f"   {tilings} tiling(s) of 8x8: last 50 mean {l[-50:].mean():8.1f} steps")

    # --- page 12: interference --------------------------------------------
    print("\n[p12] interference: train the RIGHT edge only, watch the left")
    S = np.arange(1, N_STATES + 1); x = (S - 1) / (N_STATES - 1)
    V_true = walk_true_values()[1:N_STATES + 1]; mu = walk_mu()
    agg = np.zeros((N_STATES, 10))
    agg[np.arange(N_STATES), [group_of(s, 10) for s in S]] = 1.0
    tc = TileCoder([1], [N_STATES], [11], 50)
    idx = np.array([tc.indices([s]) for s in S])
    tiles_X = np.zeros((N_STATES, tc.size))
    tiles_X[np.repeat(np.arange(N_STATES), 50), idx.ravel()] = 1.0
    fourier = np.stack([np.cos(np.pi * j * x) for j in range(6)], axis=1)
    left, right = S <= 200, S > 800
    for name, X, alpha in (("aggregation, 10 groups", agg, 0.05),
                           ("tile coding, 50 x 100 wide", tiles_X, 0.05 / 50),
                           ("Fourier, 6 features", fourier, 0.05)):
        W = np.sqrt(mu)[:, None]
        wv, *_ = np.linalg.lstsq(W * X, np.sqrt(mu) * V_true, rcond=None)
        before = X @ wv
        rng = np.random.default_rng(0)
        for _ in range(2000):
            s = int(rng.choice(S[right])); f = X[s - 1]
            wv = wv + alpha * ((V_true[s - 1] + 0.3) - f @ wv) * f
        moved = np.abs(X @ wv - before)
        print(f"   {name:27s} right {moved[right].max():.3f}   left {moved[left].max():.3f}")


def ch4():
    """Chapter 4 — the deadly triad. Every number on pages 13-16."""
    section("Chapter 4: the deadly triad")
    phi, b_probs, gamma = G["baird"]()

    # --- page 13: the two-state, one-weight example ------------------------
    print("\n[p13] w -> 2w, off-policy vs on-policy (alpha=0.1)")
    for g in (0.99, 0.9, 0.4):
        w = 1.0
        for _ in range(100):
            w += 0.1 * (0.0 + g * 2 * w - w) * 1.0
        print(f"   gamma {g:4.2f}, only s1->s2 updated : w = {w:14.4f}"
              f"   (per-step factor {1 + 0.1 * (2 * g - 1):.3f})")
    for steps in (100, 1000):
        w = 1.0
        for x, x2 in [(1.0, 2.0)] + [(2.0, 2.0)] * (steps - 1):
            w += 0.1 * (0.0 + 0.99 * x2 * w - x * w) * x
        print(f"   gamma 0.99, following the chain, {steps:4d} steps: w = {w:.6f}")

    # --- shared Baird runner ----------------------------------------------
    def run(steps, alpha=0.01, mode="triad", target_every=0, beta=0.05, seed=0, snap=()):
        X = np.eye(7) if mode == "tabular" else phi
        w = (np.array([1., 1., 1., 1., 1., 1., 10.]) if mode == "tabular"
             else BAIRD_W0.copy().astype(float))
        v = np.zeros_like(w)
        w_targ = w.copy()
        rng = np.random.default_rng(seed)
        out = {}
        for t in range(1, steps + 1):
            s = int(rng.integers(7))
            if rng.random() < b_probs[0]:
                s2, rho = int(rng.integers(6)), 0.0
            else:
                s2, rho = 6, 1.0 / b_probs[1]
            if mode == "onpolicy":
                rho = 1.0
            x, x2 = X[s], X[s2]
            if mode == "nobootstrap":
                delta = 0.0 - x @ w
                w = w + alpha * rho * delta * x
            elif mode == "tdc":
                delta = gamma * (x2 @ w) - (x @ w)
                w = w + alpha * rho * (delta * x - gamma * x2 * (x @ v))
                v = v + beta * rho * (delta - (x @ v)) * x
            else:
                wb = w_targ if target_every else w
                delta = gamma * (x2 @ wb) - (x @ w)
                w = w + alpha * rho * delta * x
            if target_every and t % target_every == 0:
                w_targ = w.copy()
            if not np.all(np.isfinite(w)):
                return {k: np.inf for k in snap}, np.inf, np.inf
            if t in snap:
                out[t] = float(np.max(np.abs(X @ w)))
        return out, float(np.linalg.norm(w)), float(np.max(np.abs(X @ w)))

    # --- page 14: Baird diverges, sampled and expected ---------------------
    print("\n[p14] Baird, sampled, alpha=0.01, seed 0")
    snap = (1, 10, 100, 500, 1000)
    o, n, mv = run(1000, snap=snap)
    for k in snap:
        print(f"   step {k:5d}: max|v(s)| {o[k]:10.2f}")
    print(f"   ||w|| {n:.2f} = {n / np.linalg.norm(BAIRD_W0):.1f}x the starting norm")
    print(f"   rank of the feature matrix: {np.linalg.matrix_rank(phi)} over 7 states "
          f"-> zero approximation error")

    print("\n[p14] Baird with EXPECTED (noise-free) sweeps, alpha=0.01")
    w = BAIRD_W0.copy().astype(float)
    for k in range(1, 10001):
        dw = np.zeros(8)
        for s in range(7):
            dw += (gamma * (phi[6] @ w) - (phi[s] @ w)) * phi[s]
        w = w + 0.01 / 7 * dw
        if k in (10, 100, 1000, 10000):
            print(f"   sweep {k:6d}: max|v(s)| {np.max(np.abs(phi @ w)):12.4g}")

    # --- page 15: drop one leg at a time -----------------------------------
    print("\n[p15] drop one leg (1000 steps, alpha=0.01)")
    for mode, label in (("triad", "all three legs"),
                        ("onpolicy", "drop OFF-POLICY"),
                        ("nobootstrap", "drop BOOTSTRAPPING"),
                        ("tabular", "drop FUNCTION APPROX")):
        _, n, mv = run(1000, mode=mode)
        print(f"   {label:22s} ||w|| {n:10.2f}   max|v(s)| {mv:10.2f}")

    print("\n[p15] the tabular row is a TRANSIENT: run it out")
    o, n, mv = run(1000000, mode="tabular", snap=(1000, 10000, 100000, 1000000))
    for k, val in o.items():
        print(f"   {k:8d} steps: max|v(s)| {val:10.4f}")
    print(f"   final ||w|| {n:.4f}")

    # --- page 16: the three candidate fixes --------------------------------
    print("\n[p16] does a smaller step size save you?")
    for alpha in (0.01, 0.001, 0.0001):
        row = [run(k, alpha=alpha)[2] for k in (1000, 10000, 100000)]
        print(f"   alpha {alpha:<8} 1k {row[0]:12.2f}   10k {row[1]:16.2f}   100k {row[2]:12.4g}")

    print("\n[p16] does a target network save you? (alpha=0.01)")
    for K in (0, 100, 1000):
        o, n, _ = run(1000000, alpha=0.01, target_every=K,
                      snap=(1000, 10000, 100000, 1000000))
        row = "  ".join(f"{k // 1000}k:{o[k]:.4g}" for k in sorted(o))
        print(f"   sync {('none' if K == 0 else 'every %d' % K):<12} {row}"
              f"   final ||w|| {n:.4g}")

    print("\n[p16] TDC (gradient-TD), EXPECTED sweeps, alpha=0.005 beta=0.05")

    def pbe(w):
        v_ = phi @ w
        return float(np.sqrt((((gamma * (phi[6] @ w)) - v_) ** 2).mean()))

    w, v = BAIRD_W0.copy().astype(float), np.zeros(8)
    for k in range(1, 20001):
        dw, dv = np.zeros(8), np.zeros(8)
        for s in range(7):
            x, x2 = phi[s], phi[6]
            delta = gamma * (x2 @ w) - (x @ w)
            dw += delta * x - gamma * x2 * (x @ v)
            dv += (delta - (x @ v)) * x
        w = w + 0.005 / 7 * dw
        v = v + 0.05 / 7 * dv
        if k in (10, 100, 1000, 20000):
            print(f"   sweep {k:6d}: max|v(s)| {np.max(np.abs(phi @ w)):9.4f}"
                  f"   RMS projected BE {pbe(w):.6f}")
    print("   stable, but the remaining error decays at rate (1 - gamma) = 0.01,")
    print("   which is why max|v(s)| is still ~1.95 after 20,000 sweeps.")

    print("\n[p16] TDC is step-size sensitive: alpha=0.005 with a bigger beta")
    for beta in (0.5, 5.0):
        w, v = BAIRD_W0.copy().astype(float), np.zeros(8)
        died = None
        for k in range(1, 1001):
            dw, dv = np.zeros(8), np.zeros(8)
            for s in range(7):
                x, x2 = phi[s], phi[6]
                delta = gamma * (x2 @ w) - (x @ w)
                dw += delta * x - gamma * x2 * (x @ v)
                dv += (delta - (x @ v)) * x
            w = w + 0.005 / 7 * dw
            v = v + beta / 7 * dv
            if not np.all(np.isfinite(w)):
                died = k
                break
        print(f"   beta {beta:<5} " + (f"OVERFLOWED at sweep {died}" if died
              else f"max|v(s)| {np.max(np.abs(phi @ w)):.4f} after 1000 sweeps"))


def ch5():
    """Chapter 5 — Deep Q-Networks. Every number on pages 17-21. Takes a few minutes."""
    section("Chapter 5: Deep Q-Networks")

    # --- page 17: a network vs features a human chose ----------------------
    print("\n[p17] 1000-state walk, 2000 episodes of gradient Monte Carlo")
    V_true = walk_true_values()[1:N_STATES + 1]
    mu = walk_mu()
    S = np.arange(1, N_STATES + 1)
    xs = (S - 1) / (N_STATES - 1) * 2 - 1
    states, returns = [], []
    env_ = RandomWalk1000(0)
    for ep in range(2000):
        env_.seed(ep)
        s = env_.reset()
        traj = []
        while True:
            traj.append(s)
            s, r, done = env_.step()
            if done:
                break
        states.extend(traj)
        returns.extend([r] * len(traj))
    states = np.array(states)
    returns = np.array(returns, dtype=float)
    print(f"   {len(states)} state-visits")

    w = np.zeros(10)
    gi = np.array([group_of(s, 10) for s in S])
    for st, r in zip(states, returns):
        w[gi[st - 1]] += 1e-3 * (r - w[gi[st - 1]])
    print(f"   aggregation, 10 groups   10 params   RMSE(mu) {rmse(w[gi], V_true, mu):.4f}")

    for h in (16, 64):
        errs = []
        for seed in range(3):
            net = G["MLP"](1, h, 1, seed=seed, lr=1e-3)
            rng = np.random.default_rng(100 + seed)
            idx = np.arange(len(states))
            for _ in range(3):
                rng.shuffle(idx)
                for k in range(0, len(idx) - 63, 64):
                    b = idx[k:k + 64]
                    out = net.forward(xs[states[b] - 1][:, None])
                    net.backward((out - returns[b][:, None]) * (2.0 / 64))
            errs.append(rmse(net.forward(xs[:, None])[:, 0], V_true, mu))
        e = np.array(errs)
        n_par = 1 * h + h + h * 1 + 1
        print(f"   MLP 1-{h}-1 {n_par:4d} params   RMSE(mu) {e.mean():.4f} +- {e.std(ddof=1):.4f}"
              f"   per-seed {np.round(e, 4).tolist()}")

    # --- pages 18-20: the ablations, 5 seeds -------------------------------
    train = G["train_cartpole_dqn"]
    print("\n[p18-20] CartPole DQN, 300 episodes, 5 seeds, mean of the last 50")
    res = {}
    for label, kw in (("full DQN", {}), ("no replay", {"replay": False}),
                      ("no target net", {"target": False}), ("Double DQN", {"double": True})):
        t0 = time.time()
        vals = [train(episodes=300, seed=s, **kw)[1][-50:].mean() for s in range(5)]
        v = np.array(vals)
        res[label] = v
        print(f"   {label:15s} mean {v.mean():7.1f}  sd {v.std(ddof=1):6.1f}  "
              f"per-seed {np.round(v).astype(int).tolist()}   ({time.time() - t0:.0f}s)")
    for a, b in (("Double DQN", "full DQN"), ("no target net", "full DQN")):
        d = res[a] - res[b]
        verdict = "INSIDE one sd (not resolvable)" if abs(d.mean()) < d.std(ddof=1) else "outside one sd"
        print(f"   {a} - {b}: {d.mean():+.1f}, sd {d.std(ddof=1):.1f} -> {verdict}")

    print("\n[p18-19] the live cells (150 episodes, seed 0)")
    for kw, label in (({}, "replay + target"), ({"replay": False}, "no replay"),
                      ({"target": False}, "no target net")):
        L = train(episodes=150, seed=0, **kw)[1]
        print(f"   {label:16s} last 25 {L[-25:].mean():7.1f}   best {L.max():4d}")

    # --- page 21: overestimation -------------------------------------------
    gamma = 0.99
    ceiling = (1 - gamma ** 500) / (1 - gamma)
    print(f"\n[p21] value calibration. A perfect 500-step episode is worth {ceiling:.1f}")

    def predicted_vs_actual(q, n=20):
        pred, actual = [], []
        for k in range(n):
            e = G["CartPole"](10000 + k)
            s = e.reset()
            pred.append(float(np.max(q.forward(s[None])[0])))
            g_, disc, done, t = 0.0, 1.0, False, 0
            while not done and t < 500:
                s, r, done = e.step(int(np.argmax(q.forward(s[None])[0])))
                g_ += disc * r
                disc *= gamma
                t += 1
            actual.append(g_)
        return np.mean(pred), np.mean(actual)

    for double, label in ((False, "DQN"), (True, "Double DQN")):
        gaps, preds = [], []
        for s in range(5):
            q, _ = train(episodes=300, seed=s, double=double)
            p, a = predicted_vs_actual(q)
            gaps.append(p - a)
            preds.append(p)
        gp = np.array(gaps)
        print(f"   {label:12s} mean predicted {np.mean(preds):7.2f}   mean gap {gp.mean():+7.2f}"
              f"   per-seed gaps {np.round(gp, 1).tolist()}")
    print("   (seed 0 is DQN's worst by far -- the page says so)")


def ch6():
    """Chapter 6 — practice & limits. Every number on pages 22-24."""
    section("Chapter 6: practice & limits")
    train = G["train_cartpole_dqn"]
    MLP_, CartPole_ = G["MLP"], G["CartPole"]

    # --- page 22: the training curve vs the agent you would ship -----------
    print("\n[p22] training returns vs frozen greedy evaluation, 200 episodes, 5 seeds")
    print(f"   {'seed':>4} {'peak eval':>10} {'at ep':>6} {'final':>8} {'drop':>8} {'final training':>15}")
    drops, nonmono, rise_fall, total_pairs = [], 0, 0, 0
    for s in range(5):
        q, L, E = train(episodes=200, seed=s, eval_every=25)
        evs = [e for _, e in E]
        eps_ = [e for e, _ in E]
        peak = max(evs)
        at = eps_[evs.index(peak)]
        fin = evs[-1]
        drops.append((peak - fin) / peak * 100)
        nonmono += (at != eps_[-1])
        for (e1, v1), (e2, v2) in zip(E, E[1:]):
            total_pairs += 1
            if L[e2 - 25:e2].mean() > L[e1 - 25:e1].mean() and v2 < v1:
                rise_fall += 1
        print(f"   {s:4d} {peak:10.1f} {at:6d} {fin:8.1f} {drops[-1]:7.1f}% {L[-25:].mean():15.1f}")
    print(f"   best evaluation was NOT the last one in {nonmono}/5 runs; "
          f"mean drop {np.mean(drops):.1f}%, max {max(drops):.1f}%")
    print(f"   checkpoints where TRAINING rose while EVALUATION fell: {rise_fall}/{total_pairs}")

    # --- page 23: partial observability ------------------------------------
    print("\n[p23] hide the velocities and CartPole stops being Markov")

    def dqn_partial(keep, episodes=200, seed=0):
        d = len(keep)
        env = CartPole_(seed)
        q = MLP_(d, 64, 2, seed=seed, lr=1e-3)
        qt = MLP_(d, 64, 2, seed=seed, lr=1e-3)
        qt.copy_from(q)
        rng = np.random.default_rng(seed + 1)
        cap, batch, gamma, sync = 20000, 32, 0.99, 200
        S = np.zeros((cap, d)); A = np.zeros(cap, int); R = np.zeros(cap)
        S2 = np.zeros((cap, d)); D = np.zeros(cap)
        n = total = 0
        lengths = []
        for ep in range(episodes):
            env.seed(seed * 1000 + ep)
            s = env.reset()[keep]
            for t in range(500):
                eps = max(0.05, 1.0 - total / 5000.0)
                a = (int(rng.integers(2)) if rng.random() < eps
                     else int(np.argmax(q.forward(s[None])[0])))
                s2_full, r, done = env.step(a)
                s2 = s2_full[keep]
                i = n % cap
                S[i], A[i], R[i], S2[i], D[i] = s, a, r, s2, float(done)
                n += 1; total += 1; s = s2
                if n >= batch:
                    idx = rng.integers(0, min(n, cap), batch)
                    bs, ba, br, bs2, bd = S[idx], A[idx], R[idx], S2[idx], D[idx]
                    y = br + gamma * (1 - bd) * qt.forward(bs2).max(axis=1)
                    out = q.forward(bs)
                    dY = np.zeros_like(out)
                    dY[np.arange(batch), ba] = (out[np.arange(batch), ba] - y) * (2.0 / batch)
                    q.backward(dY)
                    if total % sync == 0:
                        qt.copy_from(q)
                if done:
                    break
            lengths.append(t + 1)
        return np.array(lengths)

    for keep, label in (([0, 1, 2, 3], "full state"), ([0, 2], "position and angle only")):
        L = dqn_partial(keep)
        print(f"   {label:26s} last 25 {L[-25:].mean():7.1f}   best {L.max():4d}")

    # --- page 23: the sample bill ------------------------------------------
    print("\n[p23] sample efficiency on CartPole")
    _, L3 = train(episodes=300, seed=0)
    cum = np.cumsum(L3)
    smooth = np.convolve(L3, np.ones(25) / 25, "valid")
    for thresh in (200, 350):
        if smooth.max() >= thresh:
            hit = int(np.argmax(smooth >= thresh))
            print(f"   first 25-episode average of {thresh}: episode {hit + 25}, "
                  f"after {cum[hit + 24]:,} environment steps")
    print(f"   300 episodes total: {cum[-1]:,} steps = "
          f"{cum[-1] * 0.02 / 60:.1f} minutes of simulated pole-balancing")


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    if which in ("ch2", "all"):
        ch2()
    if which in ("ch3", "all"):
        ch3()
    if which in ("ch4", "all"):
        ch4()
    if which in ("ch5", "all"):
        ch5()
    if which in ("ch6", "all"):
        ch6()
    if which in ("walk", "all"):
        walk()
    if which in ("mountaincar", "mc", "all"):
        mountaincar()
    if which in ("baird", "all"):
        baird()
