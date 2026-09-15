"""Plottable series for the Function-approximation track's figures.

    python scripts/fa_figures.py            # everything
    python scripts/fa_figures.py baird mc   # named sections

scripts/fa_cases.py already verifies every NUMBER quoted on those pages. This
file is its companion: it re-runs the same environments, from the same shipped
FA_SETUP code, and prints the SERIES that a figure needs — the value function
across all 1000 states rather than its RMSE, the weight norm at every step
rather than at five checkpoints, the whole cost-to-go surface rather than a
sentence describing it.

Nothing here is a second implementation. The setup is pulled out of
runtimeSetup.ts by the same loader fa_cases.py uses, so a figure and the Run
button on the page are executing identical environment code.

Sections
  agg     true v_pi vs state aggregation vs tile coding, over all 1000 states
  baird   ||w|| per step, off-policy vs on-policy
  mc      Mountain Car: cost-to-go surface, greedy action map, learning curves
  width   the width dial: steps per episode at three tile sizes
  replay  how correlated consecutive transitions are, vs sampled ones
  td      the VE optimum and the TD fixed point, drawn as functions

Deterministic: fixed seeds throughout.
Environment used for the published numbers: python 3.13.11, numpy 2.3.5.
"""

import re
import sys
import pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_setup(name="FA_SETUP"):
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const " + name + r" = `(.*?)\n`;", src, re.S)
    if not m:
        raise SystemExit(f"{name} not found in runtimeSetup.ts")
    body = m.group(1).replace("\\\\u", "\\u").replace("\\\\n", "\\n")
    ns = {}
    exec(compile(body, f"<{name}>", "exec"), ns)
    return ns


G = load_setup()
globals().update(G)


def rule(title):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def arr(name, values, fmt="%.4f", per_line=10):
    """Print a JS-pasteable array, wrapped."""
    items = [fmt % v for v in values]
    print("%s = [" % name)
    for i in range(0, len(items), per_line):
        print("  " + ", ".join(items[i:i + per_line]) + ",")
    print("]")


# ---------------------------------------------------------------------------
def agg():
    rule("Aggregation and tile coding, as functions over the whole state space")
    S = np.arange(1, N_STATES + 1)
    V_true = walk_true_values()[1:N_STATES + 1]
    mu = walk_mu()

    # Subsample for the figure: 1000 points is more than an SVG needs.
    step = 10
    idx = np.arange(0, N_STATES, step)
    print("states sampled every %d, %d points" % (step, len(idx)))
    arr("V_TRUE", V_true[idx], "%.4f")

    # The best possible aggregation fit, under the on-policy distribution: this
    # is the FLOOR, not what any particular run reached.
    for k in (10, 20):
        g = np.array([group_of(s, k) for s in S])
        w = np.zeros(k)
        for j in range(k):
            m = g == j
            w[j] = float(np.sum(mu[m] * V_true[m]) / np.sum(mu[m]))
        fit = w[g]
        err = float(np.sqrt(np.sum(mu * (fit - V_true) ** 2)))
        print("\naggregation, %d groups: best-fit VE = %.4f" % (k, err))
        arr("AGG_%d" % k, fit[idx], "%.4f")

    # Tile coding, same number of weights as the 10-group aggregation would use
    # if you counted per tiling, so the comparison is about SHAPE not capacity.
    tc = TileCoder([1], [N_STATES], [11], 50)
    tile_idx = np.array([tc.indices([s]) for s in S])
    X = np.zeros((N_STATES, tc.size))
    X[np.repeat(np.arange(N_STATES), 50), tile_idx.ravel()] = 1.0
    W = np.sqrt(mu)[:, None]
    wt, *_ = np.linalg.lstsq(W * X, np.sqrt(mu) * V_true, rcond=None)
    fit = X @ wt
    print("\ntile coding, 50 tilings of 11: best-fit VE = %.4f, %d weights, tile width %.1f"
          % (float(np.sqrt(np.sum(mu * (fit - V_true) ** 2))), tc.size, tc.width[0]))
    arr("TILES_FIT", fit[idx], "%.4f")

    print("\nmu (on-policy visitation), same sampling:")
    arr("MU", mu[idx] * 1000, "%.4f")


# ---------------------------------------------------------------------------
def baird():
    rule("Baird's counterexample: the weight norm at every step")
    phi, b_probs, gamma = G["baird"]()

    def run(off_policy, steps=1000, alpha=0.01, seed=0):
        """Step for step the same loop as scripts/fa_cases.py's baird().

        "On-policy" here means exactly what dropping one leg of the triad means:
        the SAME behaviour (dashed 6/7 of the time) and the same transitions,
        with the importance ratio set to 1 so the update evaluates the policy
        that generated the data. Changing the transitions as well would be a
        different experiment, and it diverges too.
        """
        w = BAIRD_W0.copy()
        rng = np.random.default_rng(seed)
        norms, maxv = [], []
        for t in range(steps):
            s = int(rng.integers(7))
            if rng.random() < b_probs[0]:
                s2 = int(rng.integers(6))
                rho = 0.0 if off_policy else 1.0
            else:
                s2 = 6
                rho = (1.0 / b_probs[1]) if off_policy else 1.0
            delta = 0.0 + gamma * phi[s2] @ w - phi[s] @ w
            w = w + alpha * rho * delta * phi[s]
            norms.append(float(np.linalg.norm(w)))
            maxv.append(float(np.max(np.abs(phi @ w))))
        return np.array(norms), np.array(maxv)

    off, off_v = run(True)
    on, on_v = run(False)
    print("off-policy: ||w|| %.2f -> %.2f over 1000 steps (x%.1f)"
          % (off[0], off[-1], off[-1] / off[0]))
    print("on-policy : ||w|| %.2f -> %.2f  (x%.2f)" % (on[0], on[-1], on[-1] / on[0]))
    print("(fa_cases.py reports 68.6x and a stable 9.00; these must match)")
    keep = np.unique(np.concatenate([np.arange(0, 100, 4), np.arange(100, 1000, 25), [999]]))
    print("\nsteps kept: %d" % len(keep))
    arr("BAIRD_STEPS", keep + 1, "%d")
    arr("BAIRD_OFF", off[keep], "%.4f")
    arr("BAIRD_ON", on[keep], "%.4f")
    arr("BAIRD_OFF_MAXV", off_v[keep], "%.4f")

    print("\nthe seven states' feature rows (phi), for the diagram:")
    for i, row in enumerate(phi):
        print("  state %d: %s" % (i + 1, np.array2string(row, separator=", ")))


# ---------------------------------------------------------------------------
def mc():
    rule("Mountain Car: cost-to-go surface and learning curve")
    w, coder, L = train_mc_sarsa(episodes=200)
    print("200 episodes, 8 tilings of 8x8. last 20 mean %.1f steps, best %d"
          % (L[-20:].mean(), L.min()))
    arr("MC_EPISODES", np.arange(1, len(L) + 1), "%d", 20)
    arr("MC_STEPS", L, "%d", 20)

    # The classic figure: cost-to-go = -max_a q(s,a), over the state space.
    nx, ny = 24, 24
    pos = np.linspace(MC_POS[0], MC_POS[1], nx)
    vel = np.linspace(MC_VEL[0], MC_VEL[1], ny)
    surf = np.zeros((ny, nx))
    act = np.zeros((ny, nx), dtype=int)
    for j, v in enumerate(vel):
        for i, p in enumerate(pos):
            f = coder.indices([p, v])
            q = w[:, f].sum(axis=1)
            surf[j, i] = -float(np.max(q))
            act[j, i] = int(np.argmax(q))
    print("\ncost-to-go: min %.1f, max %.1f" % (surf.min(), surf.max()))
    print("MC_POS_GRID = [%s]" % ", ".join("%.4f" % p for p in pos))
    print("MC_VEL_GRID = [%s]" % ", ".join("%.5f" % v for v in vel))
    print("MC_COST = [")
    for row in surf:
        print("  [%s]," % ", ".join("%.1f" % x for x in row))
    print("]")
    print("MC_ACTION = [")
    for row in act:
        print("  [%s]," % ", ".join(str(x) for x in row))
    print("]")


# ---------------------------------------------------------------------------
def width():
    rule("The width dial: steps per episode at three tile sizes")
    out = {}
    for tiles in (4, 8, 16):
        curves = []
        for seed in range(5):
            _, c, l = train_mc_sarsa(episodes=200, tilings=8, tiles=tiles, seed=seed)
            curves.append(l)
        m = np.mean(curves, axis=0)
        out[tiles] = m
        print("%2dx%-2d  first20 %7.1f   last50 %7.1f   tile width %.3f  %d weights"
              % (tiles, tiles, m[:20].mean(), m[-50:].mean(), c.width[0], c.size))
    # Smooth for the figure: raw per-episode steps are extremely noisy.
    k = 10
    for tiles, m in out.items():
        sm = np.convolve(m, np.ones(k) / k, mode="valid")
        arr("WIDTH_%d" % tiles, sm[::4], "%.1f", 12)
    print("\nepisode index for the smoothed curves (window %d, every 4th):" % k)
    arr("WIDTH_EP", np.arange(k, 201)[::4], "%d", 20)


# ---------------------------------------------------------------------------
def replay():
    rule("Experience replay: how correlated is a consecutive batch?")
    # The argument on the page is that consecutive transitions are nearly the
    # same state, so a minibatch of them is close to a single example. Measure
    # it: mean absolute difference in (position, velocity) between the states in
    # a batch, taken consecutively vs sampled from a buffer.
    m = MountainCar(0)
    m.reset()
    states = []
    rng = np.random.default_rng(0)
    for _ in range(5000):
        s, r, d = m.step(int(rng.integers(0, 3)))
        states.append([m.pos, m.vel])
        if d:
            m.reset()
    states = np.array(states)
    # Normalise each dimension to its range so the two are comparable.
    span = np.array([MC_POS[1] - MC_POS[0], MC_VEL[1] - MC_VEL[0]])
    norm = states / span

    def spread(batch):
        return float(np.mean(np.std(batch, axis=0)))

    cons, samp = [], []
    for _ in range(400):
        i = int(rng.integers(0, len(states) - 32))
        cons.append(spread(norm[i:i + 32]))
        samp.append(spread(norm[rng.integers(0, len(states), 32)]))
    print("mean within-batch spread (normalised units), 32-transition batches:")
    print("  consecutive : %.4f" % np.mean(cons))
    print("  sampled     : %.4f" % np.mean(samp))
    print("  ratio       : %.1fx" % (np.mean(samp) / np.mean(cons)))
    def rows(name, pts):
        # Row-per-line, so scripts/fa_emit_data.js picks it up as a matrix.
        print("%s = [" % name)
        for pp, vv in pts:
            print("  [%.3f, %.3f]," % (pp, vv))
        print("]")

    print("\nfirst 120 consecutive states, for the figure (pos, vel normalised 0-1):")
    rows("REPLAY_CONSEC", (states[:120] - np.array([MC_POS[0], MC_VEL[0]])) / span)
    pick = rng.integers(0, len(states), 120)
    rows("REPLAY_SAMPLED", (states[pick] - np.array([MC_POS[0], MC_VEL[0]])) / span)


def td():
    rule("Where TD settles: the VE optimum and the TD fixed point")
    S = np.arange(1, N_STATES + 1)
    V_true = walk_true_values()[1:N_STATES + 1]
    P, rbar, mu_x = walk_model()
    k = 10
    g = np.array([group_of(s, k) for s in S])
    X = np.zeros((N_STATES, k))
    X[np.arange(N_STATES), g] = 1.0

    # The value-error optimum: the weighted least-squares projection of v_pi.
    W = np.sqrt(mu_x)[:, None]
    w_ve, *_ = np.linalg.lstsq(W * X, np.sqrt(mu_x) * V_true, rcond=None)
    # The TD fixed point: solve X'D(X - PX) w = X'D rbar. A different point, and
    # the one TD actually converges to -- which is the whole content of the page.
    D = np.diag(mu_x)
    w_td = np.linalg.solve(X.T @ D @ (X - P @ X), X.T @ D @ rbar)

    def ve(v):
        return float(np.sqrt(np.sum(mu_x * (v - V_true) ** 2)))

    print("VE optimum     VE = %.4f" % ve(X @ w_ve))
    print("TD fixed point VE = %.4f  (%.2fx the optimum)"
          % (ve(X @ w_td), ve(X @ w_td) / ve(X @ w_ve)))
    print("largest per-group difference: %.4f" % float(np.max(np.abs(w_ve - w_td))))
    idx = np.arange(0, N_STATES, 10)
    arr("TD_VE_OPT", (X @ w_ve)[idx], "%.4f")
    arr("TD_FIXED", (X @ w_td)[idx], "%.4f")


SECTIONS = {"agg": agg, "baird": baird, "mc": mc, "width": width, "replay": replay,
            "td": td}

if __name__ == "__main__":
    wanted = sys.argv[1:] or list(SECTIONS)
    for k in wanted:
        SECTIONS[k]()
