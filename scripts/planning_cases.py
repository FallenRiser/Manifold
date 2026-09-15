"""Honest numbers and plottable series for the Planning track.

    python scripts/planning_cases.py             # verify every published number
    python scripts/planning_cases.py --emit      # ... and write the figure data
    python scripts/planning_cases.py vi async    # named sections only

The Planning track shipped without a script, which makes it the only RL track
whose published numbers nobody could re-derive. This file closes that: every
CodeOutput block on the 22 pages is recomputed here and compared against what
the page claims, and the comparison is printed as PASS/FAIL rather than left to
the reader.

It is also the figure source. The track's subject is *a grid of numbers
changing*, so the pages need the grid at every sweep, not the last one -- and
they need the update ORDER, which no CodeOutput can show. Those series are
written to src/components/figures/planning/data.generated.ts by --emit, so that
forty 16-element arrays never pass through a human's hands.

The environment comes out of the shipped GRIDWORLD_SETUP in runtimeSetup.ts by
the same loader scripts/fa_figures.py uses. A figure and the Run button on the
page are therefore executing identical world code; if someone edits the grid,
this script changes with it instead of silently disagreeing.

Deterministic: fixed seeds throughout.
Environment used for the published numbers: python 3.13.11, numpy 2.3.5.
"""

import re
import sys
import pathlib
import numpy as np

try:                                     # the grid prints arrows; cp1252 cannot
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, OSError):
    pass

ROOT = pathlib.Path(__file__).resolve().parents[1]
GAMMA = 0.9
GOAL, PIT = 15, 3


def load_setup(name="GRIDWORLD_SETUP"):
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

P, R = make_goal_grid()                                   # noqa: F821 (from setup)
# Two worlds, and the track uses both: the goal/pit grid for planning, and the
# default Sutton & Barto grid (uniform -1 step cost, gamma = 1) for the two
# pages about evaluating the random policy.
P_default, R_default = build_gridworld(step_reward=-1.0, terminals=(0, 15))  # noqa: F821
NONTERM = [s for s in range(nS) if s not in (GOAL, PIT)]  # noqa: F821

OUT = {}      # name -> python value, serialised by --emit
CHECKS = []   # (label, ok, detail)


def rule(title):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def check(label, got, want, tol=5e-3):
    """Compare a recomputed number against what the page prints today."""
    ok = abs(float(got) - float(want)) <= tol
    CHECKS.append((label, ok, f"page says {want}, script gets {round(float(got), 4)}"))
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}: page {want} / script {round(float(got), 4)}")


def check_eq(label, got, want):
    ok = got == want
    CHECKS.append((label, ok, f"page says {want}, script gets {got}"))
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}: page {want} / script {got}")


# ---------------------------------------------------------------------------
# The three primitives every section below is built from.
# ---------------------------------------------------------------------------
def evaluate_exact(pi, gamma=GAMMA):
    """Solve V^pi exactly. Terminals are dropped from the linear system rather
    than given absorbing rows, so the matrix is non-singular at gamma = 1 too."""
    Ppi = np.einsum("sa,sat->st", pi, P)
    Rpi = (pi * R).sum(1)
    V = np.zeros(nS)                                       # noqa: F821
    idx = np.ix_(NONTERM, NONTERM)
    V[NONTERM] = np.linalg.solve(np.eye(len(NONTERM)) - gamma * Ppi[idx], Rpi[NONTERM])
    return V


def greedy(V, gamma=GAMMA):
    a = (R + gamma * (P @ V)).argmax(1)
    pi = np.zeros((nS, nA))                                # noqa: F821
    pi[np.arange(nS), a] = 1.0
    return pi, a


def bellman_opt(V, s, gamma=GAMMA):
    return float((R[s] + gamma * (P[s] @ V)).max())


V_STAR = None


def v_star():
    """V* by value iteration to machine precision -- the reference every error
    curve below is measured against."""
    global V_STAR
    if V_STAR is None:
        V = np.zeros(nS)                                   # noqa: F821
        for _ in range(4000):
            Vn = V.copy()
            for s in NONTERM:
                Vn[s] = bellman_opt(V, s)
            if np.abs(Vn - V).max() < 1e-14:
                V = Vn
                break
            V = Vn
        V_STAR = V
    return V_STAR


def grid(v):
    return [round(float(x), 4) for x in np.asarray(v).reshape(-1)]


# ---------------------------------------------------------------------------
# world -- the board itself, and what optimal looks like on it
# ---------------------------------------------------------------------------
def sec_world():
    rule("world -- the goal/pit grid")
    V = v_star()
    _, a = greedy(V)
    print("  V*:")
    show(np.round(V, 2))                                   # noqa: F821
    print("  pi*:")
    arrows = np.array([ARROWS[a[s]] for s in range(nS)], dtype=object)  # noqa: F821
    arrows[GOAL], arrows[PIT] = "G", "P"
    show(arrows)                                           # noqa: F821

    # The page prints these four corners of V* explicitly.
    check("V*(0)", V[0], 0.43)
    check("V*(12)", V[12], 0.73)
    check("V*(14)", V[14], 1.00)
    check("V*(7)", V[7], 0.86)

    pol = [int(x) for x in a]
    pol[GOAL], pol[PIT] = -2, -1        # -1 pit, -2 goal: the figure draws a badge
    OUT["V_STAR"] = grid(V)
    OUT["PI_STAR"] = pol
    OUT["REWARDS"] = {"step": -0.04, "goal": 1.0, "pit": -1.0, "gamma": GAMMA,
                      "goalCell": GOAL, "pitCell": PIT}


# ---------------------------------------------------------------------------
# predict -- prediction vs control on the same board
# ---------------------------------------------------------------------------
def sec_predict():
    rule("predict -- the random policy vs the optimal one")
    pi_rand = np.full((nS, nA), 1.0 / nA)                  # noqa: F821
    V_rand = evaluate_exact(pi_rand)
    print("  V of the random policy:")
    show(np.round(V_rand, 2))                              # noqa: F821

    check("V_random(0)", V_rand[0], -0.40)
    check("V_random(2)", V_rand[2], -0.60)
    check("V_random(14)", V_rand[14], 0.22)

    # One greedy pass off the random policy's values -- the whole "control is
    # not much harder than prediction" claim.
    _, a1 = greedy(V_rand)
    V_one = evaluate_exact(greedy(V_rand)[0])
    print(f"  sum of values, random policy   : {V_rand[NONTERM].sum():.3f}")
    print(f"  sum of values, one step better : {V_one[NONTERM].sum():.3f}")
    check("sum V_random", V_rand[NONTERM].sum(), -3.652)
    check("sum V after one improvement", V_one[NONTERM].sum(), 10.108)
    check_eq("improvement is everywhere >=", bool((V_one >= V_rand - 1e-12).all()), True)

    pol = [int(x) for x in a1]
    pol[GOAL], pol[PIT] = -2, -1
    OUT["V_RANDOM"] = grid(V_rand)
    OUT["PI_GREEDY_FROM_RANDOM"] = pol
    OUT["V_AFTER_ONE_IMPROVEMENT"] = grid(V_one)


# ---------------------------------------------------------------------------
# pi -- policy iteration, round by round
# ---------------------------------------------------------------------------
def sec_pi():
    rule("pi -- policy iteration")
    pi = np.full((nS, nA), 1.0 / nA)                       # noqa: F821
    vs, pols, sums = [], [], []
    prev_a = None
    rounds = 0
    for i in range(1, 12):
        V = evaluate_exact(pi)
        vs.append(grid(V))
        sums.append(round(float(V[NONTERM].sum()), 3))
        print(f"  round {i}: sum of state-values = {sums[-1]}")
        pi, a = greedy(V)
        pol = [int(x) for x in a]
        pol[GOAL], pol[PIT] = -2, -1
        pols.append(pol)
        if prev_a is not None and np.array_equal(prev_a, a):
            # The page counts rounds EXECUTED, so the final round -- the one that
            # confirms the policy stopped moving -- is included. Two policies
            # actually changed; the third round is the termination test.
            rounds = i
            break
        prev_a = a

    check("PI round-1 total value", sums[0], -3.652)
    check("PI round-2 total value", sums[1], 10.108)
    check_eq("PI improvement steps to converge", rounds, 3)
    check_eq("PI total value is monotone", all(b >= a - 1e-9 for a, b in zip(sums, sums[1:])), True)

    OUT["PI_VALUES"] = vs
    OUT["PI_TOTALS"] = sums
    OUT["PI_POLICIES"] = pols


# ---------------------------------------------------------------------------
# vi -- value iteration: the grid per sweep, and the stopping bound
# ---------------------------------------------------------------------------
def sec_vi():
    rule("vi -- value iteration, and how loose the stopping bound is")
    Vs = v_star()
    _, a_star = greedy(Vs)

    V = np.zeros(nS)                                       # noqa: F821
    grids, deltas, bounds, errs, opt = [grid(V)], [], [], [], []
    for sweep in range(1, 9):
        Vn = V.copy()
        for s in NONTERM:
            Vn[s] = bellman_opt(V, s)
        delta = float(np.abs(Vn - V).max())
        bound = GAMMA / (1 - GAMMA) * delta
        err = float(np.abs(Vn - Vs).max())
        _, a = greedy(Vn)
        is_opt = bool(np.array_equal(a[NONTERM], a_star[NONTERM]))
        print(f"  sweep {sweep}: delta={delta:.3f}  bound={bound:.3f}  "
              f"(true error {err:.3f})  greedy optimal? {is_opt}")
        grids.append(grid(Vn))
        deltas.append(round(delta, 4))
        bounds.append(round(bound, 4))
        errs.append(round(err, 4))
        opt.append(is_opt)
        V = Vn
        if delta == 0:
            break

    check("VI sweep-1 delta", deltas[0], 1.000)
    check("VI sweep-1 bound", bounds[0], 9.000)
    check("VI sweep-1 true error", errs[0], 0.900)
    check("VI sweep-5 bound", bounds[4], 5.905)
    check_eq("VI sweeps until delta = 0", len(deltas), 7)

    # The point the page makes in prose and cannot draw: the policy settles long
    # before the values do.
    first_opt = opt.index(True) + 1
    print(f"  greedy policy first optimal after sweep {first_opt}; "
          f"values converge after sweep {len(deltas)}")

    # How loose is the bound at the moment the answer is already exact?
    exact_at = errs.index(0.0) + 1
    print(f"  at sweep {exact_at} the true error is 0 while the bound still says "
          f"{bounds[exact_at - 1]:.3f} -- the bound is {bounds[exact_at-1]:.0f} "
          f"units of value away from the truth")

    OUT["VI_GRIDS"] = grids
    OUT["VI_DELTA"] = deltas
    OUT["VI_BOUND"] = bounds
    OUT["VI_ERROR"] = errs
    OUT["VI_POLICY_OPTIMAL"] = opt


# ---------------------------------------------------------------------------
# howmany -- the policy is coarser than the values
# ---------------------------------------------------------------------------
def sec_howmany():
    """NOTE the world: this page uses the DEFAULT Sutton & Barto grid (uniform
    step cost -1, gamma = 1) under the RANDOM policy, not the goal/pit grid the
    rest of the track plans in. Measuring it on the goal grid gives sweep 5, not
    sweep 3, which is how I first convinced myself the page was wrong."""
    rule("howmany -- the greedy policy is optimal long before the values are right")
    Pd, Rd = build_gridworld(step_reward=-1.0, terminals=(0, 15))   # noqa: F821
    g = 1.0
    pi_rand = np.full((16, 4), 0.25)
    Ppi = np.einsum("sa,sat->st", pi_rand, Pd)
    Rpi = (pi_rand * Rd).sum(1)
    TERM = [0, 15]

    Vstar = np.zeros(16)
    for _ in range(2000):
        nV = (Rd + g * (Pd @ Vstar)).max(1)
        nV[TERM] = 0.0
        if np.abs(nV - Vstar).max() < 1e-12:
            break
        Vstar = nV
    Qstar = Rd + g * (Pd @ Vstar)
    # Ties matter here: several cells have two equally optimal moves, and a
    # greedy tie-break that picks the other one is still optimal.
    opt_sets = [set(np.flatnonzero(np.isclose(Qstar[s], Qstar[s].max()))) for s in range(16)]

    V = np.zeros(16)
    flags, errs, grids = [], [], []
    for k in range(0, 8):
        ga = (Rd + g * (Pd @ V)).argmax(1)
        is_opt = all(int(ga[s]) in opt_sets[s] for s in range(16) if s not in TERM)
        err = float(np.abs(V - Vstar).max())
        print(f"  after {k} evaluation sweeps: greedy policy optimal? {is_opt}"
              f"   (values still {err:.2f} off)")
        flags.append(bool(is_opt))
        errs.append(round(err, 3))
        grids.append(grid(V))
        V = Rpi + g * (Ppi @ V)
        V[TERM] = 0.0

    first = flags.index(True)
    check_eq("greedy policy optimal after 3 sweeps", first, 3)
    check_eq("not yet optimal after 2 sweeps", flags[2], False)
    print(f"  the policy is right after {first} sweeps; the values are still "
          f"{errs[first]:.2f} away from V* at that point")

    OUT["HOWMANY_OPTIMAL"] = flags
    OUT["HOWMANY_VALUE_ERROR"] = errs
    OUT["HOWMANY_GRIDS"] = grids


# ---------------------------------------------------------------------------
# async -- the same backups in three different orders
# ---------------------------------------------------------------------------
def sweep_orders():
    """Jacobi, in-place forward, in-place reverse. Returns for each schedule the
    number of sweeps to converge and the sweep index at which each cell was last
    meaningfully changed -- which is what the figure colours."""
    out = {}

    def run(kind):
        V = np.zeros(nS)                                   # noqa: F821
        touched = np.full(nS, -1)
        order = list(range(nS)) if kind != "reverse" else list(range(nS))[::-1]
        for sweep in range(1, 60):
            before = V.copy()
            if kind == "jacobi":
                Vn = V.copy()
                for s in NONTERM:
                    Vn[s] = bellman_opt(V, s)
                V = Vn
            else:
                for s in order:
                    if s in NONTERM:
                        V[s] = bellman_opt(V, s)
            changed = np.abs(V - before) > 1e-9
            touched[changed] = sweep
            if not changed.any():
                # The page returns the sweep on which delta fell below 1e-9,
                # i.e. it counts the confirming sweep. Same convention here.
                return sweep, touched, V
        raise RuntimeError("did not converge")

    for kind in ("jacobi", "forward", "reverse"):
        n, touched, V = run(kind)
        out[kind] = (n, touched, V)
    return out


def sec_async():
    rule("async -- lockstep is optional, and the order matters")
    res = sweep_orders()
    names = {"jacobi": "Jacobi (all at once)     ", "forward": "in-place, forward 0..15  ",
             "reverse": "in-place, reverse 15..0  "}
    for k in ("jacobi", "forward", "reverse"):
        n, _, V = res[k]
        print(f"  {names[k]}: {n} sweeps")
        assert np.abs(V - v_star()).max() < 1e-6, f"{k} did not reach V*"

    check_eq("Jacobi sweeps", res["jacobi"][0], 7)
    check_eq("in-place forward sweeps", res["forward"][0], 7)
    check_eq("in-place reverse sweeps", res["reverse"][0], 2)

    OUT["SWEEP_SCHEDULES"] = [
        {"name": "Jacobi", "sweeps": res["jacobi"][0],
         "settled": [int(x) for x in res["jacobi"][1]]},
        {"name": "in-place, forward", "sweeps": res["forward"][0],
         "settled": [int(x) for x in res["forward"][1]]},
        {"name": "in-place, reverse", "sweeps": res["reverse"][0],
         "settled": [int(x) for x in res["reverse"][1]]},
    ]


# ---------------------------------------------------------------------------
# prio -- prioritized sweeping: where the backups actually go
# ---------------------------------------------------------------------------
def predecessors():
    pred = {s: set() for s in range(nS)}                    # noqa: F821
    for s in range(nS):                                     # noqa: F821
        for a in range(nA):                                 # noqa: F821
            for ns in np.nonzero(P[s, a])[0]:
                pred[int(ns)].add(s)
    return pred


def sec_prio():
    rule("prio -- uniform backups vs prioritized sweeping")

    # Uniform: sweep the whole state space until nothing moves.
    V = np.zeros(nS)                                        # noqa: F821
    uniform_counts = np.zeros(nS, int)
    uniform = 0
    for _ in range(60):
        delta = 0.0
        for s in NONTERM:
            old = V[s]
            V[s] = bellman_opt(V, s)
            uniform_counts[s] += 1
            uniform += 1
            delta = max(delta, abs(V[s] - old))
        if delta < 1e-6:
            break

    # Prioritized: a queue keyed by how much a backup would move the state.
    import heapq
    pred = predecessors()
    V = np.zeros(nS)                                        # noqa: F821
    prio_counts = np.zeros(nS, int)
    prio_order = []
    pq, inq = [], {}
    for s in NONTERM:
        p = abs(bellman_opt(V, s) - V[s])
        if p > 1e-6:
            heapq.heappush(pq, (-p, s))
            inq[s] = p
    backups = 0
    while pq:
        negp, s = heapq.heappop(pq)
        if inq.get(s) is None or abs(-negp - inq[s]) > 1e-12:
            continue
        inq.pop(s, None)
        old = V[s]
        V[s] = bellman_opt(V, s)
        prio_counts[s] += 1
        prio_order.append(int(s))
        backups += 1
        if abs(V[s] - old) < 1e-6:
            continue
        for p_s in pred[s]:
            if p_s in NONTERM:
                pr = abs(bellman_opt(V, p_s) - V[p_s])
                if pr > 1e-6 and pr > inq.get(p_s, 0):
                    inq[p_s] = pr
                    heapq.heappush(pq, (-pr, p_s))

    # The version the page ships re-queues every predecessor after every pop,
    # never dedupes, and never checks whether the backup moved anything. It
    # reaches V*, so the page's 76 is not a typo -- it is a real count of a
    # wasteful loop, and it undersells the method it is advertising by 5x.
    page_backups, page_wasted, page_counts = _page_prioritized()

    print(f"  uniform in-place backups     : {uniform}")
    print(f"  prioritized (as the page has it): {page_backups}"
          f"   -- {page_wasted} of them changed nothing")
    print(f"  prioritized (textbook queue) : {backups}"
          f"   -- one backup per non-terminal state")
    assert np.abs(V - v_star()).max() < 1e-5, "prioritized sweeping did not reach V*"
    check_eq("uniform backups", uniform, 98)
    check_eq("prioritized backups", backups, 14)
    check_eq("...which is one per non-terminal state", backups, len(NONTERM))
    # Kept as a regression test on the correction: this is what the page printed
    # before the queue was fixed, and the figure quotes both numbers.
    check_eq("the superseded queue, for the figure", page_backups, 76)

    print(f"  order of the textbook backups: {prio_order}")

    OUT["BACKUP_COUNTS"] = [
        {"name": "uniform sweeps", "total": int(uniform),
         "counts": [int(x) for x in uniform_counts]},
        {"name": "prioritized", "total": int(backups),
         "counts": [int(x) for x in prio_counts]},
    ]
    OUT["PRIO_WASTED"] = {"pageTotal": int(page_backups), "wasted": int(page_wasted),
                          "textbook": int(backups), "uniform": int(uniform)}
    # 1-based position in the backup order, 0 for terminals: the figure numbers
    # the cells and the wavefront out from the goal becomes visible.
    pos = [0] * nS                                          # noqa: F821
    for i, st in enumerate(prio_order):
        pos[st] = i + 1
    OUT["PRIO_ORDER"] = pos


# ---------------------------------------------------------------------------
# rtdp -- back up only where you stand
# ---------------------------------------------------------------------------
def _page_prioritized(theta=1e-9):
    """The page's own loop, verbatim, with counters added."""
    import heapq
    pred = predecessors()
    V = np.zeros(nS)                                        # noqa: F821
    counts = np.zeros(nS, int)
    backups = wasted = 0
    pq = []

    def err(s):
        return abs(float((R[s] + GAMMA * (P[s] @ V)).max()) - V[s])

    for s in NONTERM:
        if err(s) > theta:
            heapq.heappush(pq, (-err(s), s))
    while pq:
        _, s = heapq.heappop(pq)
        if s not in NONTERM:
            continue
        old = V[s]
        V[s] = bellman_opt(V, s)
        counts[s] += 1
        backups += 1
        if abs(V[s] - old) <= theta:
            wasted += 1
        for p_s in pred[s]:
            if p_s in NONTERM and err(p_s) > theta:
                heapq.heappush(pq, (-err(p_s), p_s))
    assert np.abs(V - v_star()).max() < 1e-6
    return backups, wasted, counts


def sec_rtdp():
    rule("rtdp -- relevance beats completeness")
    _, a_star = greedy(v_star())
    s, route = 12, [12]
    for _ in range(30):
        if s in (GOAL, PIT):
            break
        s = int(np.argmax(P[s, a_star[s]]))
        route.append(s)
    visited = sorted(set(route) - {GOAL, PIT})
    print(f"  optimal route from start 12: {route}")
    print(f"  it visits {len(visited)} of {len(NONTERM)} non-terminal states")
    check_eq("route from 12", route, [12, 13, 14, 15])
    check_eq("states on the route", len(visited), 3)

    # RTDP: back up only along greedy trajectories from a fixed start.
    V = np.zeros(nS)                                        # noqa: F821
    counts = np.zeros(nS, int)
    rng = np.random.default_rng(0)
    for _ in range(60):
        s = 12
        for _ in range(30):
            if s in (GOAL, PIT):
                break
            V[s] = bellman_opt(V, s)
            counts[s] += 1
            a = int((R[s] + GAMMA * (P[s] @ V)).argmax())
            s = int(rng.choice(nS, p=P[s, a]))              # noqa: F821
    on_route = int(counts[visited].sum())
    print(f"  RTDP put {on_route} of {int(counts.sum())} backups on the route's own states; "
          f"{int((counts > 0).sum())} of {len(NONTERM)} states were ever backed up")

    OUT["RTDP_COUNTS"] = [int(x) for x in counts]
    OUT["RTDP_ROUTE"] = [int(x) for x in route]


# ---------------------------------------------------------------------------
# sample -- replacing the expectation with an average
# ---------------------------------------------------------------------------
def sec_sample():
    rule("sample -- the sum becomes an average")
    # The page plans in the DEFAULT Sutton grid here (step -1, no discount), and
    # after the first action it acts at random -- so these are Q^random(6, a),
    # not Q*(6, a). Same rng seed, same 2000 rollouts, same 500-step cap.
    Pd, Rd = P_default, R_default
    rng = np.random.default_rng(0)

    def rollout(s0, a):
        g, first, steps, s = 0.0, True, 0, s0
        while s not in (0, 15) and steps < 500:
            act = a if first else int(rng.integers(4))
            first = False
            s2 = int(np.argmax(Pd[s, act]))
            g += Rd[s, act]
            s = s2
            steps += 1
        return g

    ests = []
    for a in range(4):
        est = float(np.mean([rollout(6, a) for _ in range(2000)]))
        ests.append(round(est, 1))
        print(f"  rollout Q(6, {ACTIONS[a]:<5}) ~ {est:6.1f}")     # noqa: F821

    check("rollout Q(6, up)", ests[0], -20.7, tol=0.05)
    check("rollout Q(6, right)", ests[1], -19.6, tol=0.05)
    check("rollout Q(6, down)", ests[2], -19.2, tol=0.05)
    check("rollout Q(6, left)", ests[3], -19.2, tol=0.05)

    # What the sampling is an estimate OF: the exact DP value, which the page
    # never prints. The figure needs it as the line the average settles onto.
    pi_rand = np.full((16, 4), 0.25)
    Ppi = np.einsum("sa,sat->st", pi_rand, Pd)
    Rpi = (pi_rand * Rd).sum(1)
    nt = [s for s in range(16) if s not in (0, 15)]
    Vr = np.zeros(16)
    Vr[nt] = np.linalg.solve(np.eye(14) - Ppi[np.ix_(nt, nt)], Rpi[nt])
    exact = [float(Rd[6, a] + Pd[6, a] @ Vr) for a in range(4)]
    print(f"  exact Q^random(6, a) by DP      : {[round(e, 2) for e in exact]}")
    # 2000 rollouts of a random walk with a heavy-tailed length is a noisy
    # estimator; see the note on the page about what these four numbers can and
    # cannot be read as. The tolerance here is the Monte-Carlo scale, not a
    # claim that the estimate is tight.
    for a in range(4):
        assert abs(ests[a] - exact[a]) < 2.0, f"rollout for action {a} is off the DP value"

    # How many rollouts does it take? The estimate at 1, 2, 4, ... 4096 samples
    # against the exact value -- the figure the page's four numbers cannot be.
    rng = np.random.default_rng(1)
    ns, means, tot = [], [], 0.0
    for i in range(1, 4097):
        tot += rollout(6, 1)
        if i & (i - 1) == 0:
            ns.append(i)
            means.append(round(tot / i, 3))
    print(f"  Q(6,right) sampled at n = 1, 8, 64, 512, 4096: "
          f"{[means[ns.index(k)] for k in (1, 8, 64, 512, 4096)]}   "
          f"(exact {exact[1]:.2f})")

    OUT["ROLLOUT_CONVERGE"] = {"n": ns, "mean": means, "exact": round(exact[1], 3)}
    OUT["ROLLOUT_Q"] = ests
    OUT["ROLLOUT_EXACT"] = [round(e, 2) for e in exact]


# ---------------------------------------------------------------------------
# cost -- what a sweep costs, and why the state space explodes
# ---------------------------------------------------------------------------
def sec_cost():
    rule("cost -- the sweep, and the curse")
    sizes = [16, 100, 10_000, 1_000_000]
    for n in sizes:
        print(f"  |S|={n:>9,}: sweep ~ |S|^2|A| = {n * n * 4:>25,}   "
              f"solve ~ |S|^3 = {n ** 3:>28,}")
    OUT["SWEEP_COST"] = [{"n": n, "sweep": n * n * 4, "solve": n ** 3} for n in sizes]

    dims = list(range(1, 11))
    OUT["CURSE"] = {"dims": dims, "states": [10 ** d for d in dims]}
    OUT["CURSE_MARKS"] = [
        {"label": "4x4 grid", "log10": 1.2},
        {"label": "Rubik's cube", "log10": 19.6},
        {"label": "backgammon", "log10": 20.0},
        {"label": "chess", "log10": 44.0},
        {"label": "atoms in the universe", "log10": 80.0},
        {"label": "Go 19x19", "log10": 170.0},
    ]


# ---------------------------------------------------------------------------
# mpi -- the dial between value iteration and policy iteration
# ---------------------------------------------------------------------------
def sec_mpi():
    rule("mpi -- k evaluation sweeps per improvement")
    rows = []
    for k in [1, 2, 3, 5, 10, 20, 50]:
        pi = np.full((nS, nA), 1.0 / nA)                     # noqa: F821
        V = np.zeros(nS)                                     # noqa: F821
        sweeps = 0
        prev_a = None
        for rnd in range(1, 200):
            for _ in range(k):
                Vn = V.copy()
                for s in NONTERM:
                    # one evaluation sweep uses the POLICY's backup, not the max
                    Vn[s] = float(pi[s] @ (R[s] + GAMMA * (P[s] @ V)))
                V = Vn
                sweeps += 1
            pi, a = greedy(V)
            if prev_a is not None and np.array_equal(a, prev_a):
                rows.append({"k": k, "rounds": rnd, "sweeps": sweeps,
                             "err": round(float(np.abs(V - v_star()).max()), 4)})
                break
            prev_a = a
    for r in rows:
        print(f"  k={r['k']:>2} eval sweeps/round: {r['rounds']:>3} rounds, "
              f"{r['sweeps']:>4} sweeps total, final |V-V*| = {r['err']}")
    OUT["MPI_DIAL"] = rows


SECTIONS = {
    "world": sec_world, "predict": sec_predict, "pi": sec_pi, "vi": sec_vi,
    "howmany": sec_howmany, "async": sec_async, "prio": sec_prio,
    "rtdp": sec_rtdp, "sample": sec_sample, "cost": sec_cost, "mpi": sec_mpi,
}


def emit():
    """Write the figure data module. Hand-transcribing forty 16-element grids is
    exactly the kind of step that introduces a number nobody can trace."""
    import json

    def js(v, indent=0):
        return json.dumps(v)

    path = ROOT / "src" / "components" / "figures" / "planning" / "data.generated.ts"
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "// GENERATED by scripts/planning_cases.py --emit. Do not edit by hand.",
        "//",
        "// Every array here is a measurement on the shipped GRIDWORLD_SETUP grid,",
        "// not a sketch: the value of all 16 cells at each sweep, the sweep at which",
        "// each cell last moved under three update orders, the backup count per cell",
        "// under uniform vs prioritized sweeping. Re-run the script to refresh.",
        "",
    ]
    for k, v in OUT.items():
        lines.append(f"export const {k} = {js(v)} as const;")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8", newline="\r\n")
    print(f"\nwrote {path.relative_to(ROOT)} ({len(OUT)} exports)")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    want = args or list(SECTIONS)
    for name in want:
        if name not in SECTIONS:
            raise SystemExit(f"unknown section {name}; pick from {list(SECTIONS)}")
        SECTIONS[name]()

    rule("verification")
    bad = [c for c in CHECKS if not c[1]]
    print(f"  {len(CHECKS) - len(bad)} of {len(CHECKS)} published numbers reproduced")
    for label, _, detail in bad:
        print(f"  FAIL  {label}: {detail}")

    if "--emit" in sys.argv:
        emit()
