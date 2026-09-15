"""
rl_capstone_cases.py — honest numbers for the Warehouse-robot RL capstone
(PROJECT.md §11 rule 9/10; docs/rl-capstone-plan.md).

Every published number in /learn/warehouse-robot-capstone comes from a run of
this file. The environment here is byte-for-byte the one the site ships to
Pyodide as WAREHOUSE_SETUP (src/lib/runtimeSetup.ts); the on-page CodeBlocks
run the same code, so their Run output matches these tables exactly.

Deterministic: numpy only, all randomness seeded. numpy 2.x.

Run:  python scripts/rl_capstone_cases.py            # everything (minutes)
      python scripts/rl_capstone_cases.py act3       # just the algorithm sweep
"""

import sys
import numpy as np

# ======================================================================
#  THE ENVIRONMENT — identical to WAREHOUSE_SETUP in src/lib/runtimeSetup.ts
# ======================================================================
FLOOR = ["S......D",
         "........",
         "HHH.HH..",
         "........",
         "P......."]
NROW, NCOL = len(FLOOR), len(FLOOR[0])
ACTIONS = ["up", "right", "down", "left"]
ARROWS = ["^", ">", "v", "<"]
MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]
nA = 4

SLIP, STEP_COST, SPILL, DELIVER = 0.10, -1.0, -30.0, 50.0
GAMMA = 0.97

_find = lambda ch: [(r, c) for r in range(NROW) for c in range(NCOL) if FLOOR[r][c] == ch]
DOCK = _find("S")[0]
PICK = _find("P")[0]
DROP = _find("D")[0]
SPILLS = set(_find("H"))

nS = NROW * NCOL * 2
sid = lambda r, c, k: (r * NCOL + c) * 2 + k
unpack = lambda s: ((s // 2) // NCOL, (s // 2) % NCOL, s % 2)


def _move(r, c, d):
    nr, nc = r + MOVES[d][0], c + MOVES[d][1]
    if nr < 0 or nr >= NROW or nc < 0 or nc >= NCOL:
        return r, c
    return nr, nc


def _transition(s, d):
    r, c, k = unpack(s)
    nr, nc = _move(r, c, d)
    rew = STEP_COST
    if (nr, nc) in SPILLS:
        return sid(DOCK[0], DOCK[1], k), rew + SPILL, False
    if (nr, nc) == PICK and k == 0:
        return sid(nr, nc, 1), rew, False
    if (nr, nc) == DROP and k == 1:
        return sid(nr, nc, 1), rew + DELIVER, True
    return sid(nr, nc, k), rew, False


class Warehouse:
    """You may only SAMPLE this world: reset() and step(). No P, no R."""

    def __init__(self, seed=0):
        self.rng = np.random.default_rng(seed)
        self.s = sid(DOCK[0], DOCK[1], 0)

    def reset(self, state=None):
        if state is None:
            self.s = sid(DOCK[0], DOCK[1], 0)
        elif state == "uniform":
            self.s = int(self.rng.choice(NONTERMINAL))
        else:
            self.s = int(state)
        return self.s

    def step(self, a):
        u = self.rng.random()
        if u < SLIP / 2:
            d = (a - 1) % 4
        elif u < SLIP:
            d = (a + 1) % 4
        else:
            d = a
        s2, r, done = _transition(self.s, d)
        self.s = s2
        return s2, r, done


NONTERMINAL = [s for s in range(nS) if s != sid(DROP[0], DROP[1], 1)]


def eps_greedy(Q, s, eps, rng):
    if rng.random() < eps:
        return int(rng.integers(nA))
    return int(np.argmax(Q[s]))


def evaluate(policy, n=2000, seed=999, eps=0.0, max_steps=250):
    env = Warehouse(seed)
    tot = spills = delivered = steps = 0.0
    for _ in range(n):
        s = env.reset()
        for t in range(max_steps):
            a = int(env.rng.integers(nA)) if env.rng.random() < eps else int(policy(s))
            s, r, done = env.step(a)
            tot += r
            steps += 1
            if r <= STEP_COST + SPILL + 1e-9:
                spills += 1
            if done:
                delivered += 1
                break
    return dict(ret=tot / n, delivered=delivered / n, spills=spills / n, steps=steps / n)


def dp_solve(gamma=GAMMA, tol=1e-12):
    """ORACLE — peeks at the hidden model to compute V* and pi*."""
    V = np.zeros(nS)
    outs = [[[] for _ in range(nA)] for _ in range(nS)]
    for s in range(nS):
        for a in range(nA):
            for p, d in ((1 - SLIP, a), (SLIP / 2, (a - 1) % 4), (SLIP / 2, (a + 1) % 4)):
                outs[s][a].append((p,) + _transition(s, d))
    term = sid(DROP[0], DROP[1], 1)
    for _ in range(5000):
        delta = 0.0
        for s in range(nS):
            if s == term:
                continue
            best = max(sum(p * (r + (0.0 if done else gamma * V[s2])) for p, s2, r, done in outs[s][a])
                       for a in range(nA))
            delta = max(delta, abs(best - V[s]))
            V[s] = best
        if delta < tol:
            break
    pi = np.zeros(nS, dtype=int)
    for s in range(nS):
        pi[s] = int(np.argmax([sum(p * (r + (0.0 if done else gamma * V[s2])) for p, s2, r, done in outs[s][a])
                               for a in range(nA)]))
    return V, pi


# ======================================================================
#  THE LEARNER — one skeleton, three targets (q / sarsa / exp)
# ======================================================================
def train(kind, episodes=15000, alpha=0.1, eps=0.1, eps_end=None, q0=0.0, seed=0):
    """kind q/sarsa/exp. eps_end!=None linearly anneals eps->eps_end (Act 4);
       q0 sets the optimistic initial value (Act 4)."""
    e = Warehouse(seed)
    Q = np.full((nS, nA), q0, dtype=float)
    for ep in range(episodes):
        cur = eps if eps_end is None else eps + (eps_end - eps) * (ep / max(1, episodes - 1))
        s = e.reset("uniform")                    # exploring starts (Act 5)
        a = eps_greedy(Q, s, cur, e.rng)
        for t in range(250):
            s2, r, done = e.step(a)
            if done:
                Q[s, a] += alpha * (r - Q[s, a]); break
            a2 = eps_greedy(Q, s2, cur, e.rng)
            if kind == "q":
                target = r + GAMMA * Q[s2].max()
            elif kind == "sarsa":
                target = r + GAMMA * Q[s2, a2]
            else:  # expected sarsa
                pi = np.full(nA, cur / nA); pi[np.argmax(Q[s2])] += 1 - cur
                target = r + GAMMA * float(pi @ Q[s2])
            Q[s, a] += alpha * (target - Q[s, a])
            s, a = s2, a2
    return Q


# ======================================================================
#  ACT-BY-ACT REPRODUCTIONS
# ======================================================================
def act1():
    print("\n===== ACT 1 — frame it =====")
    V, PI = dp_solve()
    print("state aliasing (the doorway disagrees with itself):")
    for (r, c) in [(1, 3), (2, 3), (3, 3), (0, 4)]:
        print("  cell (%d,%d): empty -> %-5s  carrying -> %s"
              % (r, c, ACTIONS[PI[sid(r, c, 0)]], ACTIONS[PI[sid(r, c, 1)]]))
    print("gamma sweep (return / steps / doorway%):")
    for g in (0.5, 0.8, 0.9, 0.97, 0.99):
        _, pg = dp_solve(gamma=g)
        rr = evaluate(lambda s: pg[s], n=1000, seed=21)
        print("  gamma %.2f -> ret %6.2f  steps %.1f" % (g, rr["ret"], rr["steps"]))


def act2():
    print("\n===== ACT 2 — lock the harness =====")
    rng = np.random.default_rng(0)
    rand = evaluate(lambda s: int(rng.integers(nA)), n=2000, seed=3)

    def heuristic(s):
        r, c, k = unpack(s); tr, tc = (DROP if k == 1 else PICK)
        if r != tr: return 2 if tr > r else 0
        return 1 if tc > c else 3

    heur = evaluate(heuristic, n=2000, seed=3)
    V, PI = dp_solve()
    orac = evaluate(lambda s: PI[s], n=2000, seed=999)
    print("random      : ret %8.2f  delivered %.1f%%  spills %.2f" % (rand["ret"], rand["delivered"]*100, rand["spills"]))
    print("hand-coded  : ret %8.2f  delivered %.1f%%  spills %.2f" % (heur["ret"], heur["delivered"]*100, heur["spills"]))
    print("oracle      : ret %8.2f  delivered %.1f%%  spills %.3f  (V*(dock)=%.2f discounted)"
          % (orac["ret"], orac["delivered"]*100, orac["spills"], V[sid(DOCK[0], DOCK[1], 0)]))
    global SPILL
    _o = SPILL; SPILL = -300.0; _, PIs = dp_solve(); SPILL = _o
    safe = evaluate(lambda s: PIs[s], n=2000, seed=999)
    print("zero-risk   : ret %8.2f  spills %.3f  steps %.1f" % (safe["ret"], safe["spills"], safe["steps"]))


def act3():
    print("\n===== ACT 3 — the algorithm sweep (the safety-tradeoff & comparison tables) =====")
    print("%d seeds each, 15000 episodes, greedy eval." % 10)
    names = {"q": "Q-learning  ", "sarsa": "SARSA       ", "exp": "Exp. SARSA  "}
    for kind in ("q", "sarsa", "exp"):
        rets, sps = [], []
        for seed in range(10):
            Q = train(kind, episodes=15000, seed=seed)
            r = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
            rets.append(r["ret"]); sps.append(r["spills"])
        rets = np.array(rets)
        risky = int((rets > 18.5).sum())
        broken = int((rets < 0).sum())
        print("%s: %s  risky %d/10  mean %6.2f  median-spills %.3f  broken %d"
              % (names[kind], " ".join("%5.1f" % x for x in rets), risky,
                 rets.mean(), float(np.median(sps)), broken))


def _sweep(label, **kw):
    rets = np.array([evaluate(lambda s: int(np.argmax(train("q", seed=sd, **kw)[s])),
                              n=2000, seed=999)["ret"] for sd in range(10)])
    print("%-32s | mean %7.2f | median %7.2f | risky %2d/10 | broken %d"
          % (label, rets.mean(), np.median(rets), int((rets > 18.5).sum()), int((rets < 0).sum())))


def act4():
    print("\n===== ACT 4 — tuning (10 seeds x 15000 ep each) =====")
    print("-- the-step-size: alpha --")
    for a in (0.02, 0.10, 0.30, 0.60, 1.00):
        _sweep("alpha = %.2f" % a, alpha=a)
    print("-- exploration-schedule: annealed eps --")
    _sweep("fixed eps = 0.1", eps=0.1)
    _sweep("anneal 0.5 -> 0.01", eps=0.5, eps_end=0.01)
    _sweep("anneal 0.3 -> 0.01", eps=0.3, eps_end=0.01)
    _sweep("anneal 1.0 -> 0.05", eps=1.0, eps_end=0.05)
    print("-- optimism: initial Q --")
    for q0 in (0.0, 25.0, 50.0):
        _sweep("q0 = %.0f" % q0, q0=q0)
    print("-- tuning-protocol: vanilla vs tuned --")
    _sweep("vanilla a=0.1 fixed eps=0.1", alpha=0.1, eps=0.1)
    _sweep("tuned   a=0.1 anneal 1.0->0.05", alpha=0.1, eps=1.0, eps_end=0.05)


def act5():
    print("\n===== ACT 5 — evaluate, interpret, stress-test =====")
    V, PI = dp_solve()
    global SPILL
    _o = SPILL; SPILL = -300.0; _, PIsafe = dp_solve(); SPILL = _o

    print("-- reading-the-policy: learned agent vs oracle agreement --")
    Q = train("q", eps=1.0, eps_end=0.05, seed=0)      # tuned agent
    pol = Q.argmax(1)
    env = Warehouse(3); vis = set()
    for _ in range(2000):
        s = env.reset()
        for t in range(250):
            vis.add(s); s, r, done = env.step(int(pol[s]))
            if done: break
    r = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
    print("   learned %.2f / %.0f%%  | agrees with oracle on %.0f%% of visited, %.0f%% of all"
          % (r["ret"], r["delivered"] * 100,
             100 * sum(pol[s] == PI[s] for s in vis) / len(vis),
             100 * sum(pol[s] == PI[s] for s in NONTERMINAL) / len(NONTERMINAL)))

    print("-- failure-modes: distribution shift (deploy slippier than trained) --")

    def at_slip(policy, slip):
        global SLIP
        keep = SLIP; SLIP = slip
        out = evaluate(policy, n=4000, seed=999); SLIP = keep
        return out

    for sl in (0.10, 0.20, 0.30, 0.40):
        a = at_slip(lambda s: PI[s], sl); b = at_slip(lambda s: PIsafe[s], sl)
        print("   slip %.2f | risky %7.2f (%.3f) | safe %7.2f (%.3f)"
              % (sl, a["ret"], a["spills"], b["ret"], b["spills"]))

    print("-- failure-modes: the return tail (optimal policy, 5000 eps) --")
    env = Warehouse(7); rets = []
    for _ in range(5000):
        s = env.reset(); tot = 0.0
        for t in range(250):
            s, r, done = env.step(int(PI[s])); tot += r
            if done: break
        rets.append(tot)
    rets = np.array(rets)
    print("   mean %.2f  median %.2f  worst %.0f  worst-1%% %.2f"
          % (rets.mean(), np.median(rets), rets.min(), np.sort(rets)[:50].mean()))


def act6():
    print("\n===== ACT 6 — conclude & transfer =====")
    print("-- transfer-near: relocate the spill wall, re-run the SAME pipeline --")
    global FLOOR, NROW, NCOL, DOCK, PICK, DROP, SPILLS, nS, sid, unpack, NONTERMINAL
    FLOOR = ["S......D", "........", "..HHH.HH", "........", "P......."]
    NROW, NCOL = len(FLOOR), len(FLOOR[0])
    f = lambda ch: [(r, c) for r in range(NROW) for c in range(NCOL) if FLOOR[r][c] == ch]
    DOCK, PICK, DROP, SPILLS = f("S")[0], f("P")[0], f("D")[0], set(f("H"))
    nS = NROW * NCOL * 2
    sid = lambda r, c, k: (r * NCOL + c) * 2 + k
    unpack = lambda s: ((s // 2) // NCOL, (s // 2) % NCOL, s % 2)
    NONTERMINAL = [s for s in range(nS) if s != sid(DROP[0], DROP[1], 1)]
    V, PI = dp_solve()
    rng = np.random.default_rng(0)
    rnd = evaluate(lambda s: int(rng.integers(nA)), n=2000, seed=3)
    Q = train("q", episodes=8000, eps=1.0, eps_end=0.05, seed=0)
    orc = evaluate(lambda s: PI[s], n=2000, seed=999)
    lrn = evaluate(lambda s: int(np.argmax(Q[s])), n=2000, seed=999)
    print("   random %.2f | oracle %.2f | learned %.2f (%.0f%% of oracle, %.0f%% delivered)"
          % (rnd["ret"], orc["ret"], lrn["ret"], 100 * lrn["ret"] / orc["ret"], lrn["delivered"] * 100))
    print("-- transfer-far: inventory control lives in its own module (INVENTORY_SETUP);")
    print("   see the reproduction notebook's Act 6 cell for the (s,S) recovery (14.31/day, 99% of 14.52).")


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    if which in ("all", "act1"): act1()
    if which in ("all", "act2"): act2()
    if which in ("all", "act3"): act3()
    if which in ("all", "act4"): act4()
    if which in ("all", "act5"): act5()
    if which in ("all", "act6"): act6()
