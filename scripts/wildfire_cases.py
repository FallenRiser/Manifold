"""Honest numbers for World 2 (Wildfire command) of the Building-environments track.

Every figure quoted on a World 2 page is produced here by running the SHIPPED environment code
(src/lib/runtimeSetup.ts -> WILDFIRE_SETUP), extracted from the TypeScript so what is verified is
byte-identical to what the browser's Run button executes.

    python scripts/wildfire_cases.py check      # contract + invariants + the prototype numbers it must reproduce
    python scripts/wildfire_cases.py baselines  # pilot and commander baseline tables
    python scripts/wildfire_cases.py whisper    # how much one bucket is worth (common random numbers)
    python scripts/wildfire_cases.py explore    # how often a random pilot ever scores after a refill
    python scripts/wildfire_cases.py clock      # the commander's decision clock K
    python scripts/wildfire_cases.py ca         # cellular-automaton page: fire strength, lifetime ignition, dice, shape
    python scripts/wildfire_cases.py wind       # wind/moisture/slope page: each factor changed, steer-only wind, by wind
    python scripts/wildfire_cases.py heli       # helicopter page: step budgets, bucket x drop, start, doused cells, lake distance
    python scripts/wildfire_cases.py clocks     # coupled-clocks page: the fire/helicopter ratio, step order, the weather clock
    python scripts/wildfire_cases.py vec        # vectorising page: step profile, loop vs whole-grid tick, batches, dice per world
    python scripts/wildfire_cases.py invariants # invariants page: long invariant runs, planted bugs, drop-vs-hover relation, shrinking
    python scripts/wildfire_cases.py chiefs     # baselines page: chief ladder, the step-0 drop, stacked rules, paired comparisons
    python scripts/wildfire_cases.py train      # training page: the shapes, the budget, the noise, the reward split
    python scripts/wildfire_cases.py cobra      # cobra-effect page: the bounty's ranking, the dominated rule it picks, where the water lands
    python scripts/wildfire_cases.py values     # reward-is-a-values-decision page: the weight, the shape, the crossovers, loudness
    python scripts/wildfire_cases.py commander  # pilot-or-commander page: the scripted pilot, the clock K, exploration, 256 targets
    python scripts/wildfire_cases.py crew       # the-crew-that-learned-nothing page: the local optimum, the exploration funnel, the whisper

The trained crews (DQN / PPO, torch) are produced by scripts/wildfire_train.py, which trains against
this same extracted environment and scores through this same command() function.
"""
import re
import sys
import time
import pathlib

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_setup(name="WILDFIRE_SETUP"):
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const " + name + r" = `(.*?)\n`;", src, re.S)
    if not m:
        raise SystemExit(f"{name} not found in runtimeSetup.ts")
    body = m.group(1).replace("\\\\u", "\\u").replace("\\\\n", "\\n")
    ns = {}
    exec(compile(body, f"<{name}>", "exec"), ns)
    return ns


G = load_setup()
W = G["Wildfire"]; C = G["Command"]


def expect(label, got, want, tol=1e-9):
    ok = all(abs(got[k] - v) <= tol for k, v in want.items())
    print(f"  {'ok  ' if ok else 'FAIL'} {label}: {got}" + ("" if ok else f"\n       expected {want}"))
    return ok


def check():
    t0 = time.time(); allok = True
    # determinism: same seed + same actions = same episode; different seed changes the start
    rng = np.random.default_rng(0); acts = rng.integers(6, size=300)
    def roll(seed):
        env = W(); o, _ = env.reset(seed=seed); out = [o]
        for a in acts:
            o, r, te, tr, _ = env.step(int(a)); out.append(o)
            if te or tr: break
        return out
    a, b, c = roll(7), roll(7), roll(8)
    same = len(a) == len(b) and all(np.array_equal(x, y) for x, y in zip(a, b))
    print(f"  {'ok  ' if same else 'FAIL'} same seed + same actions = same episode"); allok &= same
    diff = not np.array_equal(a[0], c[0])
    print(f"  {'ok  ' if diff else 'FAIL'} a different seed changes the start"); allok &= diff
    # invariants under random play
    bad = {}
    for s in range(32):
        env = W(); env.reset(seed=s); prev = env.S.copy(); rr = np.random.default_rng(s)
        for _ in range(300):
            _, r, te, tr, _ = env.step(int(rr.integers(6)))
            S = env.S
            for k, v in {"burnt cell came back": ((prev == 2) & (S != 2)).any(),
                         "fire on lake or rock": ((S != 0) & ((env.T == 3) | (env.T == 2))).any(),
                         "helicopter off the map": not (0 <= env.pos[0] < 16 and 0 <= env.pos[1] < 16),
                         "water outside [0, bucket]": not (0 <= env.water <= G["BUCKET"]),
                         "moisture outside [0, 1]": (env.M < 0).any() or (env.M > 1).any(),
                         "burning cell with no time left": ((S == 1) & (env.timer <= 0)).any(),
                         "terminated and truncated together": te and tr}.items():
                if v: bad[k] = bad.get(k, 0) + 1
            prev = S.copy()
            if te or tr: break
    print(f"  {'ok  ' if not bad else 'FAIL'} invariants over 32 random episodes: {bad or 'none violated'}"); allok &= not bad
    # the prototype numbers the shipped code must reproduce
    allok &= expect("pilot 3x3 guard", pick(G["fly"](G["pilot_chief"]("guard"), drop_r=1)), dict(village_damaged=2.64, village_saved=0.58))
    allok &= expect("pilot 5x5 guard", pick(G["fly"](G["pilot_chief"]("guard"))), dict(village_damaged=1.03, village_saved=0.77))
    allok &= expect("commander K=4 guard", pick(G["command"](G["dispatcher"]("guard"))), dict(village_damaged=1.11, village_saved=0.785))
    allok &= expect("commander K=4 densest", pick(G["command"](G["dispatcher"]("densest"))), dict(village_damaged=3.33, village_saved=0.565))
    print(f"  {'ALL OK' if allok else 'SOMETHING FAILED'}  ({time.time() - t0:.1f} s)")


def pick(d):
    return {k: d[k] for k in ("village_damaged", "village_saved", "burnt", "put_out", "drops", "steps")}


def baselines():
    rr = np.random.default_rng(12345)
    rand = lambda env: int(rr.integers(6))
    for drop_r in (1, 2):
        print(f"PILOT, drop {2 * drop_r + 1}x{2 * drop_r + 1}")
        for name, pol in (("hover", lambda env: 0), ("random", rand), ("nearest", G["pilot_chief"]("nearest")), ("guard", G["pilot_chief"]("guard"))):
            print(f"  {name:8s}", pick(G["fly"](pol, drop_r=drop_r)))
    print("COMMANDER, 5x5, K=4")
    for name in ("random", "random_fire", "nearest", "guard", "densest"):
        print(f"  {name:12s}", pick(G["command"](G["dispatcher"](name))))


def whisper():
    """Replay each world with the guard chief's FIRST drop replaced by hovering. The fire dice do not depend on the
    helicopter, so the difference in return is exactly what that one bucket was worth."""
    for drop_r in (1, 2):
        full, skip = [], []
        for k in range(200):
            vals = []
            for skip_first in (False, True):
                env = W(drop_r=drop_r); env.reset(seed=1000 + k); pol = G["pilot_chief"]("guard"); Gs = 0.0; dropped = 0
                while True:
                    a = pol(env)
                    if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != 3:
                        if skip_first and dropped == 0: a = 0
                        dropped += 1
                    _, r, te, tr, _ = env.step(a); Gs += r
                    if te or tr: break
                vals.append(Gs)
            full.append(vals[0]); skip.append(vals[1])
        full, skip = np.array(full), np.array(skip); eff = full - skip
        print(f"drop {2 * drop_r + 1}x{2 * drop_r + 1}: first bucket worth {eff.mean():+.2f} (median {np.median(eff):+.2f}; "
              f"helps {np.mean(eff > 0):.0%}, no change {np.mean(eff == 0):.0%}, hurts {np.mean(eff < 0):.0%}) "
              f"vs spread of returns across worlds sd {full.std():.1f}  ->  signal/noise {eff.mean() / full.std():.3f}")


def explore():
    for drop_r in (1, 2):
        rng = np.random.default_rng(0); refills = first = after = 0
        for k in range(200):
            env = W(drop_r=drop_r); env.reset(seed=1000 + k); filled = False; f = a2 = 0
            while True:
                _, _, te, tr, info = env.step(int(rng.integers(6)))
                if env.stats["fills"] > 0: filled = True
                if info["put_out"] > 0:
                    if filled: a2 += 1
                    else: f += 1
                if te or tr: break
            refills += filled; first += f > 0; after += a2 > 0
        print(f"drop {2 * drop_r + 1}x{2 * drop_r + 1}: random pilot refilled in {refills} of 200 episodes; "
              f"put out fire with the starting bucket in {first}; after a refill in {after}")


def clock():
    for K in (1, 2, 4, 8, 999):
        row = {name: pick(G["command"](G["dispatcher"](name), K=K)) for name in ("nearest", "guard")}
        print(f"K={K:3d}  nearest {row['nearest']['village_damaged']:.2f} / {row['nearest']['village_saved']:.1%}"
              f"   guard {row['guard']['village_damaged']:.2f} / {row['guard']['village_saved']:.1%}")


def chiefs():
    """Baselines page: the chief ladder, why random buttons help (the step-0 drop), stacked rules, the metric table,
    and paired comparisons world by world (guard vs nearest, a wind-reading guard, drop-then-guard vs guard)."""
    LAKE_, VIL, BURN, toward = G["LAKE"], G["VILLAGE"], G["BURNING"], G["toward"]

    def per_world(policy, empty_start=False):
        rows = []
        for k in range(200):
            env = W(); env.reset(seed=1000 + k)
            if empty_start: env.water = 0
            Gs = 0.0
            while True:
                _, r, te, tr, _ = env.step(policy(env)); Gs += r
                if te or tr: break
            s = env.summary(); rows.append((s["village_damaged"], s["burnt"], Gs, te, s["put_out"], s["t"]))
        return np.array(rows, dtype=float)

    def to_lake(env):
        lake = np.argwhere(env.T == LAKE_); return toward(env.pos, lake[np.abs(lake - env.pos).sum(1).argmin()])
    guard = G["pilot_chief"]("guard")

    def wind_guard(env):
        if env.water == 0: return to_lake(env)
        fire = np.argwhere(env.S == BURN)
        if len(fire) == 0: return 0
        gap = np.argwhere(env.T == VIL).mean(0) - fire; dist = np.hypot(*gap.T) + 1e-9
        push = (gap[:, 0] * -np.cos(env.wdir) + gap[:, 1] * np.sin(env.wdir)) / dist
        return toward(env.pos, fire[(dist / np.exp(G["WIND_GAIN"] * env.wspd * push)).argmin()])

    rng = np.random.default_rng(0)
    rules = {"stand by": lambda env: 0, "random buttons (rng 0)": lambda env: int(rng.integers(6)),
             "one drop, then hover": lambda env: 5 if env.t == 0 else 0,
             "nearest": G["pilot_chief"]("nearest"), "guard": guard,
             "soak the village": lambda env: to_lake(env) if env.water == 0 else toward(env.pos, np.argwhere(env.T == VIL)[4]),
             "drop, then guard": lambda env: 5 if env.t == 0 else guard(env), "wind guard": wind_guard}
    R = {}
    print("rule                     village untouched  burnt put_out steps  return  fire out")
    for name, pol in rules.items():
        R[name] = x = per_world(pol)
        print(f"  {name:22s} {x[:, 0].mean():6.2f} {np.mean(x[:, 0] == 0):8.1%} {x[:, 1].mean():6.1f} {x[:, 4].mean():6.1f} "
              f"{x[:, 5].mean():6.1f} {x[:, 2].mean():7.1f}  {int(x[:, 3].sum())}/200")
    rng = np.random.default_rng(0)
    print(f"random buttons (rng 0), empty bucket at start: village {per_world(lambda env: int(rng.integers(6)), True)[:, 0].mean():.2f}")
    before, after = [], []
    for k in range(200):
        env = W(); env.reset(seed=1000 + k); v = env.T == VIL
        before.append(env.M[v].mean()); env.step(5); after.append(env.M[v].mean())
    m0, m1 = np.mean(before), np.mean(after)
    print(f"village moisture {m0:.3f} -> {m1:.3f}; (1-M) {1 - m0:.3f} -> {1 - m1:.3f}; dry back {(m1 - m0) / 0.01:.0f} fire ticks; "
          f"after 77.7 steps (~39 ticks) M ~ {m1 - 0.389:.2f}, rate {(1 - (m1 - 0.389)) / (1 - m0):.2f} of dry")
    for a, b in (("guard", "nearest"), ("wind guard", "guard"), ("drop, then guard", "guard"), ("one drop, then hover", "nearest"),
                 ("soak the village", "guard")):
        for col, what in ((0, "village"), (2, "return")):
            x, y = R[a][:, col], R[b][:, col]; d = x - y
            sep = np.sqrt(x.var(ddof=1) / 200 + y.var(ddof=1) / 200); pr = d.std(ddof=1) / np.sqrt(200)
            print(f"  {a} - {b} {what}: {d.mean():+.2f} se separate {sep:.3f} paired {pr:.3f} ({(sep / pr) ** 2:.1f}x)"
                  + (f"  better/same/worse {np.mean(d < 0):.1%}/{np.mean(d == 0):.1%}/{np.mean(d > 0):.1%}" if col == 0 else ""))
    print(f"guard untouched 95% band +- {1.96 * np.sqrt(0.77 * 0.23 / 200):.3f}")


CODE = {("T", 0): ".", ("T", 1): "^", ("T", 2): "#", ("T", 3): "~", ("T", 4): "H"}


def record(policy, seed, **kw):
    """Fly one episode and keep every frame. A frame is a 256-character map: . grass ^ forest # rock ~ lake
    H village, * burning, x burnt (the helicopter is stored separately)."""
    env = W(**kw); env.reset(seed=seed)
    def frame():
        cells = []
        for r in range(16):
            for c in range(16):
                s = int(env.S[r, c])
                cells.append("*" if s == 1 else "x" if s == 2 else CODE[("T", int(env.T[r, c]))])
        return "".join(cells)
    frames, pos, water, wind = [frame()], [[int(env.pos[0]), int(env.pos[1])]], [int(env.water)], [[round(env.wdir, 3), round(env.wspd, 3)]]
    drops = []
    while True:
        a = policy(env)
        will_drop = a == 5 and env.water > 0 and env.T[tuple(env.pos)] != 3
        _, r, te, tr, info = env.step(a)
        if will_drop: drops.append(env.t)
        frames.append(frame()); pos.append([int(env.pos[0]), int(env.pos[1])]); water.append(int(env.water))
        wind.append([round(env.wdir, 3), round(env.wspd, 3)])
        if te or tr: break
    s = env.summary()
    return dict(seed=seed, frames=frames, pos=pos, water=water, wind=wind, drops=drops,
                end="out" if te else "clock", village_damaged=s["village_damaged"], burnt=s["burnt"],
                put_out=s["put_out"], steps=s["t"])


def _write(name, const, episodes, note):
    import json
    out = ROOT / "src" / "components" / "fire" / "data" / f"{name}.ts"
    out.parent.mkdir(parents=True, exist_ok=True)
    body = (f"// Generated by running the shipped WILDFIRE_SETUP ({note}). Do not edit by hand.\n"
            f"import type {{ FireEpisode }} from \"../types\";\n\n"
            f"export const {const}: FireEpisode[] = {json.dumps(episodes, separators=(',', ':'))};\n")
    out.write_text(body, encoding="utf-8")
    print(f"  wrote {out.relative_to(ROOT)} ({len(body) // 1024} KB)")


def export():
    """Brief page: the first held-out world where standing by loses most of the village and flying to the nearest
    fire saves all of it — the same world, three helms."""
    hover = lambda env: 0
    for k in range(200):
        seed = 1000 + k
        h = record(hover, seed); n = record(G["pilot_chief"]("nearest"), seed)
        if h["village_damaged"] >= 6 and n["village_damaged"] == 0:
            g = record(G["pilot_chief"]("guard"), seed)
            eps = []
            for label, e in (("Stand by (hover)", h), ("Fly to the nearest fire", n), ("Guard the village", g)):
                e["label"] = label; eps.append(e)
            print(f"  seed {seed}: " + " · ".join(f"{e['label']}: village {e['village_damaged']}/9, burnt {e['burnt']}, {e['steps']} steps" for e in eps))
            _write("briefFires", "BRIEF_FIRES", eps, f"brief page, held-out seed {seed}")
            return


def ca():
    """Cellular-automaton page prose: fire strength sweep, lifetime ignition, one die per cell vs dice where needed,
    and the neighbourhood shape. (The in-place update and the equivalence test are the page's own cells.)"""
    import math
    N, DIRS, SPREAD, DIAGONAL = G["N"], G["DIRS"], G["SPREAD"], G["DIAGONAL"]

    print("fire strength (village dmg · untouched · burnt), 5x5 drop")
    for mult in (1.0, 0.8, 0.6):
        H = load_setup(); H["SPREAD"] = np.array([0.30, 0.16, 0.0, 0.0, 0.20]) * mult
        row = [f"{name} " + "{village_damaged:.2f} · {village_saved:.1%} · {burnt:.1f}".format(**H["fly"](pol))
               for name, pol in (("stand by", lambda env: 0), ("nearest", H["pilot_chief"]("nearest")), ("guard", H["pilot_chief"]("guard")))]
        print(f"  x{mult}: " + "   ".join(row))

    print("a grass cell beside ONE burning cell, dry calm flat: exact vs the environment's fire (4000 runs)")
    for src_t, name in ((0, "grass"), (1, "forest"), (4, "village")):
        for (dr, dc), lab in (((0, 1), "side"), ((1, 1), "corner")):
            p = SPREAD[0] * (DIAGONAL if dr else 1.0); caught = 0
            for k in range(4000):
                env = W(); env.reset(seed=k)
                env.T[:] = 2; env.E[:] = 0.0; env.wspd = 0.0; env.S[:] = 0; env.timer[:] = 0
                env.T[8, 8] = src_t; env.S[8, 8] = 1; env.timer[8, 8] = G["BURN_TIME"][src_t]; env.T[8 + dr, 8 + dc] = 0
                while (env.S == 1).any() and env.S[8 + dr, 8 + dc] == 0:
                    env.M[:] = 0.0; env.fire_tick()
                caught += env.S[8 + dr, 8 + dc] != 0
            print(f"  beside burning {name:7s} ({lab:6s}): exact {1 - (1 - p) ** G['BURN_TIME'][src_t]:.3f}   simulated {caught / 4000:.3f}")

    class NeededDice(W):
        "The shipped fire, except dice are rolled only for cells that could catch."
        def fire_tick(self):
            T, S, M, E = self.T, self.S, self.M, self.E
            burning = S == 1; not_lit = np.ones((N, N))
            wr, wc = -np.cos(self.wdir), np.sin(self.wdir)
            for dr, dc in DIRS:
                src = G["shift"](burning, dr, dc, False); dist = math.hypot(dr, dc)
                wind = np.exp(G["WIND_GAIN"] * self.wspd * (dr * wr + dc * wc) / dist)
                slope = np.clip(np.exp(G["SLOPE_GAIN"] * (E - G["shift"](E, dr, dc, 0.0))), 0.5, 2.0)
                p = SPREAD[T] * (1 - M) * wind * slope * (DIAGONAL if dist > 1 else 1.0)
                not_lit *= np.where(src, 1 - np.clip(p, 0, 1), 1.0)
            prob = 1 - not_lit
            cand = (S == 0) & G["FLAMMABLE"][T] & (prob > 0)
            new = np.zeros((N, N), bool); new[cand] = self.rng.random(int(cand.sum())) < prob[cand]
            timer = np.where(burning, self.timer - 1, self.timer); spent = burning & (timer <= 0)
            S = np.where(spent, 2, S)
            self.S = np.where(new, 1, S).astype(np.int8)
            self.timer = np.where(new, G["BURN_TIME"][T], timer).astype(np.int8)
            self.M = np.where(T == 3, 1.0, np.maximum(M - G["DRYING"], 0.05)); self.ever |= new
            return int(new.sum()), int((new & (T == 4)).sum())

    print("guard chief, first drop replaced by hovering, 200 held-out worlds (return units)")
    for cls, name in ((W, "a die for every cell"), (NeededDice, "dice only where needed")):
        eff = []
        for k in range(200):
            vals = []
            for skip_first in (False, True):
                env = cls(); env.reset(seed=1000 + k); pol = G["pilot_chief"]("guard"); Gs = 0.0; dropped = 0
                while True:
                    a = pol(env)
                    if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != 3:
                        if skip_first and dropped == 0: a = 0
                        dropped += 1
                    _, r, te, tr, _ = env.step(a); Gs += r
                    if te or tr: break
                vals.append(Gs)
            eff.append(vals[0] - vals[1])
        eff = np.array(eff)
        print(f"  {name:22s} worth {eff.mean():+.2f}, sd of paired difference {eff.std():.1f}, paired worlds for +-1: {int(np.ceil(eff.std() ** 2))}")

    print("one fire in a 41x41 calm dry grass field, 8 ticks, 4000 fires")
    for wd in (0.0, 0.7, 1 / math.sqrt(2), 1.0):
        rng = np.random.default_rng(0); size, m = 41, 20
        S = np.zeros((4000, size, size), np.int8); timer = np.zeros_like(S); S[:, m, m] = 1; timer[:, m, m] = 2
        for _ in range(8):
            burning = S == 1; not_lit = np.ones(S.shape)
            for dr, dc in DIRS:
                w = wd if (dr and dc) else 1.0
                if w: not_lit *= np.where(G["shift"](burning, dr, dc, False), 1 - SPREAD[0] * w, 1.0)
            new = (S == 0) & (rng.random(S.shape) < 1 - not_lit)
            timer = np.where(burning, timer - 1, timer); S = np.where(burning & (timer <= 0), 2, S)
            S = np.where(new, 1, S).astype(np.int8); timer = np.where(new, 2, timer).astype(np.int8)
        hit = S != 0; k = np.arange(1, m + 1)
        reach = lambda dr, dc: np.where(hit[:, m + dr * k, m + dc * k].any(1), (hit[:, m + dr * k, m + dc * k] * k).max(1), 0).mean()
        axis = np.mean([reach(*d) for d in ((-1, 0), (1, 0), (0, -1), (0, 1))])
        diag = math.sqrt(2) * np.mean([reach(*d) for d in ((-1, -1), (-1, 1), (1, -1), (1, 1))])
        print(f"  corners x{wd:.3f}: straight {axis:.2f}, diagonal {diag:.2f}, ratio {diag / axis:.2f}, cells reached {hit.sum((1, 2)).mean():.1f}")


def steer_only(H):
    "The shipped fire, except the wind factor is divided by its average over the 8 directions: it steers, never feeds."
    import math
    base = H["Wildfire"]
    class SteerOnly(base):
        def fire_tick(self):
            wr, wc = -math.cos(self.wdir), math.sin(self.wdir)
            ws = [(H["DIAGONAL"] if dr and dc else 1.0, math.exp(H["WIND_GAIN"] * self.wspd * (dr * wr + dc * wc) / math.hypot(dr, dc)))
                  for dr, dc in H["DIRS"]]
            norm = sum(w * x for w, x in ws) / sum(w for w, _ in ws)
            old = H["SPREAD"]; H["SPREAD"] = old / norm
            try:
                return super().fire_tick()
            finally:
                H["SPREAD"] = old
    return SteerOnly


def wind():
    """Wind, moisture and slope page prose: each factor switched off, steer-only wind, the open-field shape, how often
    the clips bind, and village damage grouped by where the starting wind blows. (The direction table, the moisture
    and slope tables, the equivalence test and its broken versions are the page's own cells.)"""
    import math
    DIRS = G["DIRS"]
    fmt = "{village_damaged:.2f} · {village_saved:.1%} · {burnt:.1f}"
    chiefs = lambda H: (("stand by", lambda env: 0), ("nearest", H["pilot_chief"]("nearest")), ("guard", H["pilot_chief"]("guard")))

    print("each factor changed (village dmg · untouched · burnt), 200 held-out worlds")
    for label, patch in (("shipped", {}), ("wind off", {"WIND_GAIN": 0.0}), ("wind gain 3", {"WIND_GAIN": 3.0}),
                         ("wind steers only", "steer"), ("slope off", {"SLOPE_GAIN": 0.0}), ("slope gain 8", {"SLOPE_GAIN": 8.0}),
                         ("no drying", {"DRYING": 0.0}), ("drying 0.03", {"DRYING": 0.03})):
        H = load_setup()
        if patch == "steer": H["Wildfire"] = steer_only(H)
        else: H.update(patch)
        print(f"  {label:17s}" + "   ".join(f"{n} " + fmt.format(**H["fly"](p)) for n, p in chiefs(H)), flush=True)

    print("one fire, 41x41 dry flat grass, 8 ticks, 4000 fires, wind toward east at full speed")
    for label, gain, steer in (("calm", 0.0, False), ("wind (shipped)", 1.5, False), ("wind steers only", 1.5, True)):
        rng = np.random.default_rng(0); size, m = 41, 20
        S = np.zeros((4000, size, size), np.int8); timer = np.zeros_like(S); S[:, m, m] = 1; timer[:, m, m] = 2
        wr, wc = -math.cos(math.pi / 2), math.sin(math.pi / 2)
        fac = [math.exp(gain * (dr * wr + dc * wc) / math.hypot(dr, dc)) for dr, dc in DIRS]
        if steer:
            wts = [G["DIAGONAL"] if dr and dc else 1.0 for dr, dc in DIRS]
            norm = sum(w * x for w, x in zip(wts, fac)) / sum(wts); fac = [x / norm for x in fac]
        for _ in range(8):
            burning = S == 1; not_lit = np.ones(S.shape)
            for (dr, dc), f in zip(DIRS, fac):
                p = min(G["SPREAD"][0] * f * (G["DIAGONAL"] if dr and dc else 1.0), 1.0)
                not_lit *= np.where(G["shift"](burning, dr, dc, False), 1 - p, 1.0)
            new = (S == 0) & (rng.random(S.shape) < 1 - not_lit)
            timer = np.where(burning, timer - 1, timer); S = np.where(burning & (timer <= 0), 2, S)
            S = np.where(new, 1, S).astype(np.int8); timer = np.where(new, 2, timer).astype(np.int8)
        hit = S != 0; k = np.arange(1, m + 1)
        reach = lambda dr, dc: np.where(hit[:, m + dr * k, m + dc * k].any(1), (hit[:, m + dr * k, m + dc * k] * k).max(1), 0).mean()
        print(f"  {label:17s} downwind {reach(0, 1):.2f}  upwind {reach(0, -1):.2f}  across {(reach(-1, 0) + reach(1, 0)) / 2:.2f}  cells {hit.sum((1, 2)).mean():.1f}")

    over = tot = 0
    for k in range(200):
        env = W(); env.reset(seed=1000 + k)
        while True:
            T, S, M, E = env.T, env.S, env.M, env.E
            wr, wc = -np.cos(env.wdir), np.sin(env.wdir)
            for dr, dc in DIRS:
                dist = math.hypot(dr, dc)
                p = (G["SPREAD"][T] * (1 - M) * np.exp(G["WIND_GAIN"] * env.wspd * (dr * wr + dc * wc) / dist)
                     * np.clip(np.exp(G["SLOPE_GAIN"] * (E - G["shift"](E, dr, dc, 0.0))), 0.5, 2.0) * (G["DIAGONAL"] if dist > 1 else 1.0))
                live = G["shift"](S == 1, dr, dc, False) & (S == 0) & G["FLAMMABLE"][T]
                tot += live.sum(); over += (live & (p > 1)).sum()
            _, _, te, tr, _ = env.step(0)
            if te or tr: break
    print(f"stand by, 200 worlds: {over} of {tot} ignition attempts had p > 1 ({over / tot:.2%})")

    print("village damage by the starting wind (cos of the angle between the wind and the line from a fire to the village)")
    for gain in (1.5, 0.0):
        H = load_setup(); H["WIND_GAIN"] = gain
        for name, pol in chiefs(H):
            rows = []
            for k in range(200):
                env = H["Wildfire"](); env.reset(seed=1000 + k)
                village = np.argwhere(env.T == 4).mean(0)
                wr, wc = -math.cos(env.wdir), math.sin(env.wdir)
                align = max(float((v[0] * wr + v[1] * wc) / (np.hypot(*v) + 1e-9)) for v in village - np.argwhere(env.S == 1))
                while True:
                    _, _, te, tr, _ = env.step(pol(env))
                    if te or tr: break
                rows.append((align, env.summary()["village_damaged"]))
            a = np.array(rows); toward, away = a[:, 0] > 0.5, a[:, 0] < 0.0
            print(f"  wind gain {gain} {name:9s} toward (n={toward.sum()}) {a[toward, 1].mean():.2f} untouched {np.mean(a[toward, 1] == 0):.1%}"
                  f"   away (n={away.sum()}) {a[away, 1].mean():.2f} untouched {np.mean(a[away, 1] == 0):.1%}", flush=True)


def heli():
    """Helicopter page prose: where each chief's steps go, bucket x drop size, where the helicopter starts, what a
    doused cell becomes, and village damage by distance to water. (The branch-covering equivalence test, the drop demo
    and the guard chief's step budget are the page's own cells.)"""
    fmt = "{village_damaged:.2f} · {village_saved:.1%} · {burnt:.1f} · put out {put_out:.1f} · drops {drops:.2f} · steps {steps:.1f}"
    chiefs = ("nearest", "guard")

    print("where the steps go, 200 held-out worlds")
    for name in chiefs:
        counts = dict(to_lake=0, fill=0, to_fire=0, drop=0, hover=0)
        doused_n = recaught_n = 0
        for k in range(200):
            env = W(); env.reset(seed=1000 + k); pol = G["pilot_chief"](name)
            doused = np.zeros((16, 16), bool); recaught = np.zeros((16, 16), bool)
            while True:
                a = pol(env); r, c = env.pos
                kind = "hover" if a == 0 else ("to_lake" if env.water == 0 else "to_fire") if a < 5 else "fill" if env.T[r, c] == 3 else "drop"
                hit = np.zeros((16, 16), bool)
                if kind == "drop":
                    hit[max(r - env.drop_r, 0):r + env.drop_r + 1, max(c - env.drop_r, 0):c + env.drop_r + 1] = True
                    hit &= env.S == 1
                before = env.S.copy()
                _, _, te, tr, _ = env.step(a)
                recaught |= (doused & (env.S == 1) & (before != 1)) | (hit & (env.S == 1)); doused |= hit
                counts[kind] += 1
                if te or tr: break
            doused_n += doused.sum(); recaught_n += recaught.sum()
        tot = sum(counts.values())
        print(f"  {name:8s} " + "  ".join(f"{k} {v / tot:.1%}" for k, v in counts.items())
              + f"  | cells doused per episode {doused_n / 200:.1f}, caught fire again {recaught_n / doused_n:.1%}")

    print("bucket x drop (village dmg · untouched · burnt · put out · drops · steps)")
    for bucket in (1, 3):
        for drop_r in (1, 2, 3):
            H = load_setup(); H["BUCKET"] = bucket
            print(f"  bucket {bucket} drop {2 * drop_r + 1}x{2 * drop_r + 1}  " + "   ".join(f"{n} " + fmt.format(**H["fly"](H["pilot_chief"](n), drop_r=drop_r)) for n in chiefs), flush=True)

    print("where the helicopter starts")
    for label in ("full over the village", "empty over the village", "full at the nearest lake cell"):
        H = load_setup(); base = H["Wildfire"]
        class Start(base):
            def reset(self, seed=None, _label=label):
                o = super().reset(seed)
                if _label.startswith("empty"): self.water = 0
                if _label.endswith("lake cell"):
                    lake = np.argwhere(self.T == 3); self.pos = lake[np.abs(lake - self.pos).sum(1).argmin()].copy()
                return o
        H["Wildfire"] = Start
        print(f"  {label:30s} " + "   ".join(f"{n} " + fmt.format(**H["fly"](H["pilot_chief"](n))) for n in chiefs), flush=True)

    print("what a doused cell becomes")
    H = load_setup(); base = H["Wildfire"]
    class Burnt(base):
        "A drop turns the burning cells it hits into BURNT (spent) instead of UNBURNT."
        def step(self, a):
            r, c = self.pos; k = self.drop_r; self._pending = None
            if a == 5 and self.T[r, c] != 3 and self.water > 0:
                m = np.zeros((16, 16), bool); m[max(r - k, 0):r + k + 1, max(c - k, 0):c + k + 1] = True
                self._pending = m & (self.S == 1)
            out = super().step(a)
            if self._pending is not None: self.S[self._pending] = 2; self._pending = None
            return out
        def fire_tick(self):
            if getattr(self, "_pending", None) is not None: self.S[self._pending] = 2; self._pending = None
            return super().fire_tick()
    H["Wildfire"] = Burnt
    print("  put out = unburnt (shipped)  " + "   ".join(f"{n} " + fmt.format(**G["fly"](G["pilot_chief"](n))) for n in chiefs))
    print("  put out = burnt              " + "   ".join(f"{n} " + fmt.format(**H["fly"](H["pilot_chief"](n))) for n in chiefs), flush=True)

    print("village damage by steps from the village centre to the nearest lake cell")
    dist = []
    for k in range(200):
        env = W(); env.reset(seed=1000 + k); lake = np.argwhere(env.T == 3)
        dist.append(int(np.abs(lake - env.pos).sum(1).min()))
    dist = np.array(dist); q1, q2 = np.quantile(dist, [1 / 3, 2 / 3])
    groups = [("near", dist <= q1), ("middle", (dist > q1) & (dist <= q2)), ("far", dist > q2)]
    print(f"  distance: min {dist.min()} median {np.median(dist):.0f} max {dist.max()}; near <= {q1:.0f} < middle <= {q2:.0f} < far")
    for name in ("stand by",) + chiefs:
        pol = (lambda env: 0) if name == "stand by" else G["pilot_chief"](name); v = []
        for k in range(200):
            env = W(); env.reset(seed=1000 + k)
            while True:
                _, _, te, tr, _ = env.step(pol(env))
                if te or tr: break
            v.append(env.summary()["village_damaged"])
        v = np.array(v)
        print(f"  {name:8s} " + "   ".join(f"{lab} (n={g.sum()}) {v[g].mean():.2f} · {np.mean(v[g] == 0):.1%}" for lab, g in groups))


def clocks():
    """Coupled-clocks page prose: the fire/helicopter ratio with every clock scaled in fire time, the same change made
    naively, the worth of one bucket at each ratio, the order of the systems inside step, and the weather clock."""
    def scaled(k):
        return dict(fire_every=k, weather_every=15 * k, max_steps=150 * k)

    def run(make, name, n=200):
        rows = []
        for k in range(n):
            env = make(); env.reset(seed=1000 + k)
            pol = {"stand by": lambda e: 0, "nearest": G["pilot_chief"]("nearest"), "guard": G["pilot_chief"]("guard"),
                   "random": (lambda rr: (lambda e: int(rr.integers(6))))(np.random.default_rng(1000 + k))}[name]
            while True:
                _, _, te, tr, _ = env.step(pol(env))
                if te or tr: break
            s = env.summary(); s["trunc"] = tr; s["ticks"] = env.t // env.fire_every; rows.append(s)
        return rows

    def line(rows):
        m = lambda key: np.mean([d[key] for d in rows])
        return (f"{m('village_damaged'):.2f} · {np.mean([d['village_damaged'] == 0 for d in rows]):.1%} · {m('burnt'):.1f}"
                f" (steps {m('t'):.1f}, fire ticks {m('ticks'):.1f}, time called {np.mean([d['trunc'] for d in rows]):.1%})")

    names = ("stand by", "random", "nearest", "guard")
    print("ratio, every clock scaled in fire time (village dmg · untouched · burnt); random = its own dice per world")
    ever = {}
    for k in (1, 2, 3, 4, 6):
        for name in names:
            rows = run(lambda k=k: W(**scaled(k)), name)
            if name == "stand by": ever[k] = [d["burnt"] for d in rows]
            print(f"  k={k} {name:8s} {line(rows)}", flush=True)
    print(f"  stand by identical in every world at every k: {all(v == ever[2] for v in ever.values())}")

    print("the same change made naively: only fire_every (wind every 30 steps, time called at 300)")
    for k in (1, 3, 4):
        for name in names:
            print(f"  k={k} {name:8s} {line(run(lambda k=k: W(fire_every=k), name))}", flush=True)

    print("what one bucket is worth at each ratio (guard's first drop replaced by hovering; scaled clocks)")
    for k in (1, 2, 3, 4):
        full, skip = [], []
        for j in range(200):
            vals = []
            for skip_first in (False, True):
                env = W(**scaled(k)); env.reset(seed=1000 + j); pol = G["pilot_chief"]("guard"); ret = 0.0; dropped = 0
                while True:
                    a = pol(env)
                    if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != G["LAKE"]:
                        if skip_first and dropped == 0: a = 0
                        dropped += 1
                    _, r, te, tr, _ = env.step(a); ret += r
                    if te or tr: break
                vals.append(ret)
            full.append(vals[0]); skip.append(vals[1])
        full, eff = np.array(full), np.array(full) - np.array(skip)
        print(f"  k={k}: first bucket worth {eff.mean():+.2f} (helps {np.mean(eff > 0):.0%}, no change {np.mean(eff == 0):.0%}, "
              f"hurts {np.mean(eff < 0):.0%}) vs sd {full.std():.1f} -> signal/noise {eff.mean() / full.std():.3f}", flush=True)

    print("the order of the systems inside step")
    class Ordered(W):
        def __init__(self, order, **kw):
            super().__init__(**kw); self.order = order
        def step(self, a):
            put_out = lit = village_lit = 0; advanced = False
            for part in self.order:
                if part == "heli":
                    r, c = self.pos
                    if a < 5:
                        dr, dc = G["MOVES"][a]; self.pos = np.array([min(max(r + dr, 0), 15), min(max(c + dc, 0), 15)])
                    elif self.T[r, c] == G["LAKE"]:
                        if self.water < G["BUCKET"]: self.water = G["BUCKET"]; self.stats["fills"] += 1
                    elif self.water > 0:
                        k = self.drop_r; r0, r1, c0, c1 = max(r - k, 0), min(r + k + 1, 16), max(c - k, 0), min(c + k + 1, 16)
                        hit = self.S[r0:r1, c0:c1] == 1; put_out = int(hit.sum())
                        self.S[r0:r1, c0:c1][hit] = 0; self.timer[r0:r1, c0:c1][hit] = 0
                        self.M[r0:r1, c0:c1] = np.maximum(self.M[r0:r1, c0:c1], G["WET"])
                        self.water -= 1; self.stats["drops"] += 1; self.stats["put_out"] += put_out
                    continue
                if not advanced: self.t += 1; advanced = True
                if part == "fire" and self.t % self.fire_every == 0:
                    lit, village_lit = self.fire_tick()
                if part == "weather" and self.t % self.weather_every == 0:
                    self.wdir = float((self.wdir + self.rng.normal(0, np.pi / 6)) % (2 * np.pi))
                    self.wspd = float(np.clip(self.wspd + self.rng.normal(0, 0.15), 0.0, 1.0))
            te = not (self.S == 1).any(); tr = (not te) and self.t >= self.max_steps
            return self.observe(), float(-lit - 10.0 * village_lit), te, tr, dict(lit=lit, village_lit=village_lit, put_out=put_out)
    for order in (("heli", "fire", "weather"), ("fire", "weather", "heli"), ("heli", "weather", "fire")):
        for name in ("stand by", "nearest", "guard"):
            print(f"  {' -> '.join(order):26s} {name:8s} {line(run(lambda order=order: Ordered(order), name))}", flush=True)

    print("the weather clock")
    for we in (10 ** 9, 30, 10):
        for name in ("stand by", "nearest", "guard"):
            rows = run(lambda we=we: W(weather_every=we), name)
            extra = ""
            if we == 30:
                sh = np.array([d["t"] // 30 for d in rows])
                extra = f"  | wind shifts seen per episode {sh.mean():.2f}, none {np.mean(sh == 0):.1%}"
            print(f"  every {'never' if we == 10 ** 9 else we:>5} {name:8s} {line(rows)}{extra}", flush=True)


def vec():
    """Vectorising page prose (native Python; timings are this machine's): where a step's time goes, the loop vs the
    vectorised fire tick, the log-sum alternative, a batch axis (identity + throughput), dice per world vs one shared
    generator, and a whole batched step."""
    import math
    N_, UNB, BUR, BRN, LAKE_ = G["N"], G["UNBURNT"], G["BURNING"], G["BURNT"], G["LAKE"]
    SPREAD, BT, FL, DIRS, shift = G["SPREAD"], G["BURN_TIME"], G["FLAMMABLE"], G["DIRS"], G["shift"]
    WG, SG, DG, DRY = G["WIND_GAIN"], G["SLOPE_GAIN"], G["DIAGONAL"], G["DRYING"]
    perf = time.perf_counter

    def loop_tick(T, S, timer, M, E, wdir, wspd, dice):
        new_S, new_t = S.copy(), timer.copy(); wr, wc = -np.cos(wdir), np.sin(wdir)
        for r in range(N_):
            for c in range(N_):
                if S[r, c] == BUR:
                    new_t[r, c] -= 1
                    if new_t[r, c] <= 0: new_S[r, c] = BRN
                    continue
                if S[r, c] != UNB or not FL[T[r, c]]: continue
                nl = 1.0
                for dr, dc in DIRS:
                    nr, nc = r - dr, c - dc
                    if 0 <= nr < N_ and 0 <= nc < N_ and S[nr, nc] == BUR:
                        d = math.hypot(dr, dc)
                        p = SPREAD[T[r, c]] * (1 - M[r, c]) * np.exp(WG * wspd * (dr * wr + dc * wc) / d) \
                            * np.clip(np.exp(SG * (E[r, c] - E[nr, nc])), 0.5, 2.0) * (DG if d > 1 else 1.0)
                        nl *= 1 - min(p, 1.0)
                if dice[r, c] < 1 - nl: new_S[r, c] = BUR; new_t[r, c] = BT[T[r, c]]
        return new_S, new_t, np.where(T == LAKE_, 1.0, np.maximum(M - DRY, 0.05))

    def vec_tick(T, S, timer, M, E, wdir, wspd, dice, logsum=False):
        burning = S == BUR
        wdir = np.asarray(wdir, float)[..., None, None]; wspd = np.asarray(wspd, float)[..., None, None]
        wr, wc = -np.cos(wdir), np.sin(wdir); acc = np.zeros(S.shape) if logsum else np.ones(S.shape)
        for dr, dc in DIRS:
            src = shift(burning, dr, dc, False); d = math.hypot(dr, dc)
            p = SPREAD[T] * (1 - M) * np.exp(WG * wspd * (dr * wr + dc * wc) / d) \
                * np.clip(np.exp(SG * (E - shift(E, dr, dc, 0.0))), 0.5, 2.0) * (DG if d > 1 else 1.0)
            if logsum:
                with np.errstate(divide="ignore"): acc += np.where(src, np.log1p(-np.clip(p, 0, 1)), 0.0)
            else:
                acc *= np.where(src, 1 - np.clip(p, 0, 1), 1.0)
        nl = np.exp(acc) if logsum else acc
        new = (S == UNB) & FL[T] & (dice < 1 - nl)
        t2 = np.where(burning, timer - 1, timer)
        S2 = np.where(new, BUR, np.where(burning & (t2 <= 0), BRN, S)).astype(np.int8)
        return S2, np.where(new, BT[T], t2).astype(np.int8), np.where(T == LAKE_, 1.0, np.maximum(M - DRY, 0.05)), new

    print("where a solo env.step spends its time (200 held-out worlds)")
    class Timed(W):
        def fire_tick(self):
            t0 = perf(); r = super().fire_tick(); PROF["fire"] += perf() - t0; return r
        def observe(self):
            t0 = perf(); r = super().observe(); PROF["obs"] += perf() - t0; return r
    for name, pol in (("stand by", lambda e: 0), ("guard", G["pilot_chief"]("guard"))):
        PROF = {"fire": 0.0, "obs": 0.0}; tot = 0.0; steps = 0
        for k in range(200):
            env = Timed(); env.reset(seed=1000 + k)
            while True:
                a = pol(env); t0 = perf(); _, _, te, tr, _ = env.step(a); tot += perf() - t0; steps += 1
                if te or tr: break
        print(f"  {name:8s} {steps / tot:6.0f} steps/s; fire_tick {PROF['fire'] / tot:.0%}, observe {PROF['obs'] / tot:.0%}, "
              f"the rest of step {(tot - PROF['fire'] - PROF['obs']) / tot:.0%}", flush=True)

    recs = []
    for s in range(1000, 1010):
        env = W(); env.reset(seed=s)
        while (env.S == BUR).any():
            g = np.random.default_rng(); g.bit_generator.state = env.rng.bit_generator.state
            rec = (env.T, env.S.copy(), env.timer.copy(), env.M.copy(), env.E, env.wdir, env.wspd, g.random((N_, N_)))
            env.fire_tick(); recs.append((rec, (env.S.copy(), env.timer.copy(), env.M.copy())))
    same = lambda out, res: all(np.array_equal(a, b) for a, b in zip(out, res))
    print(f"one world, {len(recs)} fire ticks (worlds 1000-1009): loop identical {all(same(loop_tick(*r), x) for r, x in recs)}, "
          f"vectorised identical {all(same(vec_tick(*r)[:3], x) for r, x in recs)}")
    t0 = perf(); [loop_tick(*r) for r, _ in recs]; tl = (perf() - t0) / len(recs)
    t0 = perf()
    for _ in range(20): [vec_tick(*r) for r, _ in recs]
    tv = (perf() - t0) / (20 * len(recs))
    print(f"  loop {tl * 1e3:.2f} ms per tick, vectorised {tv * 1e3:.2f} ms ({tl / tv:.1f}x)")
    flips = sum(int((vec_tick(*r)[3] != vec_tick(*r, logsum=True)[3]).sum()) for r, _ in recs)
    print(f"  sum of logs instead of a product: cells that caught differently {flips}")

    def load(seeds):
        envs = [W() for _ in seeds]
        for e, s in zip(envs, seeds): e.reset(seed=s)
        st = [np.stack([getattr(e, k) for e in envs]) for k in ("T", "S", "timer", "M", "E")]
        wd, ws = np.array([e.wdir for e in envs]), np.array([e.wspd for e in envs])
        gens = []
        for e in envs:
            g = np.random.default_rng(); g.bit_generator.state = e.rng.bit_generator.state; gens.append(g)
        return envs, st, wd, ws, gens
    envs, (T, S, tm, M, E), wd, ws, gens = load(range(1000, 1064)); alive = (S == BUR).any((1, 2)); bad = set(); wt = 0
    while alive.any():
        S2, t2, M2, _ = vec_tick(T, S, tm, M, E, wd, ws, np.stack([g.random((N_, N_)) for g in gens]))
        for i in np.flatnonzero(alive):
            envs[i].fire_tick(); wt += 1
            if not same((S2[i], t2[i], M2[i]), (envs[i].S, envs[i].timer, envs[i].M)): bad.add(i)
        keep = alive[:, None, None]; S, tm, M = np.where(keep, S2, S), np.where(keep, t2, tm), np.where(keep, M2, M)
        alive = (S == BUR).any((1, 2))
    print(f"a batch of 64 worlds, {wt} world-ticks: worlds that differ from their solo environment {len(bad)}")
    print("fire ticks per second by batch size (dice: one generator per world | one shared generator)")
    for B in (1, 4, 16, 64, 256, 1024):
        row = []
        for mode in ("per world", "shared"):
            envs, (T, S0, tm0, M0, E), wd, ws, gens = load([1000 + i % 200 for i in range(B)]); shared = np.random.default_rng(0)
            S, tm, M = S0, tm0, M0; done = 0; t0 = perf()
            while perf() - t0 < 1.0:
                dice = np.stack([g.random((N_, N_)) for g in gens]) if mode == "per world" else shared.random((B, N_, N_))
                S, tm, M, _ = vec_tick(T, S, tm, M, E, wd, ws, dice); done += B
            row.append(done / (perf() - t0))
        print(f"  B={B:5d}  {row[0]:8.0f} | {row[1]:8.0f}", flush=True)

    def shared_run(B, ticks=40):
        envs, (T, S, tm, M, E), wd, ws, _ = load(range(1000, 1000 + B)); g = np.random.default_rng(0); ever = S == BUR
        for _ in range(ticks):
            S, tm, M, new = vec_tick(T, S, tm, M, E, wd, ws, g.random((B, N_, N_))); ever |= new
        return ever.sum((1, 2))
    a16, a64 = shared_run(16), shared_run(64)[:16]
    print(f"one shared generator: of worlds 1000-1015, {int((a16 != a64).sum())} burn a different number of cells in 40 ticks "
          f"when the batch is 64 instead of 16 (world 1000: {a16[0]} vs {a64[0]})")

    print("a whole batched step: vectorised fire and observation, helicopter and wind one world at a time")
    MOVES, BUCKET, WET, DROP_R = G["MOVES"], G["BUCKET"], G["WET"], G["DROP_R"]
    class Batch:
        def __init__(self, seeds):
            self.envs = [W() for _ in seeds]
            for e, s in zip(self.envs, seeds): e.reset(seed=s)
            g = lambda k: np.stack([getattr(e, k) for e in self.envs])
            self.T, self.S, self.timer, self.M, self.E, self.pos = g("T"), g("S"), g("timer"), g("M"), g("E"), g("pos")
            self.water = np.array([e.water for e in self.envs]); self.B = len(seeds); self.t = 0
            self.wdir = np.array([e.wdir for e in self.envs]); self.wspd = np.array([e.wspd for e in self.envs])
            self.rngs = [e.rng for e in self.envs]
        def step(self, actions):
            for i in range(self.B):
                a = int(actions[i]); r, c = self.pos[i]
                if a < 5:
                    dr, dc = MOVES[a]; self.pos[i] = (min(max(r + dr, 0), N_ - 1), min(max(c + dc, 0), N_ - 1))
                elif self.T[i, r, c] == LAKE_:
                    self.water[i] = BUCKET
                elif self.water[i] > 0:
                    r0, r1, c0, c1 = max(r - DROP_R, 0), min(r + DROP_R + 1, N_), max(c - DROP_R, 0), min(c + DROP_R + 1, N_)
                    blk = self.S[i, r0:r1, c0:c1]; hit = blk == BUR; blk[hit] = UNB; self.timer[i, r0:r1, c0:c1][hit] = 0
                    self.M[i, r0:r1, c0:c1] = np.maximum(self.M[i, r0:r1, c0:c1], WET); self.water[i] -= 1
            self.t += 1
            if self.t % G["FIRE_EVERY"] == 0:
                dice = np.stack([g.random((N_, N_)) for g in self.rngs])
                self.S, self.timer, self.M, _ = vec_tick(self.T, self.S, self.timer, self.M, self.E, self.wdir, self.wspd, dice)
            if self.t % G["WEATHER_EVERY"] == 0:
                for i, g in enumerate(self.rngs):
                    self.wdir[i] = float((self.wdir[i] + g.normal(0, np.pi / 6)) % (2 * np.pi))
                    self.wspd[i] = float(np.clip(self.wspd[i] + g.normal(0, 0.15), 0.0, 1.0))
            T, S, B = self.T, self.S, self.B
            o = np.zeros((B, 12, N_, N_), np.float32)
            for k, ty in enumerate((G["GRASS"], G["FOREST"], LAKE_, G["VILLAGE"])): o[:, k] = (T == ty) & (S != BRN)
            o[:, 4] = self.E; o[:, 5] = self.M; o[:, 6] = S == BUR; o[:, 7] = S == BRN
            o[np.arange(B), 8, self.pos[:, 0], self.pos[:, 1]] = 1; o[:, 9] = (self.water / BUCKET)[:, None, None]
            o[:, 10] = (np.cos(self.wdir) * self.wspd)[:, None, None]; o[:, 11] = (np.sin(self.wdir) * self.wspd)[:, None, None]
            return o
    rng = np.random.default_rng(0); acts = rng.integers(6, size=(120, 16))
    bt = Batch(range(1000, 1016)); solo = [W() for _ in range(16)]
    for i, e in enumerate(solo): e.reset(seed=1000 + i)
    bad = 0
    for t in range(120):
        ob = bt.step(acts[t])
        for i in range(16): bad += not np.array_equal(ob[i], solo[i].step(int(acts[t, i]))[0])
    print(f"  16 worlds x 120 random steps: observations that differ from solo env.step {bad}")
    n = 0; t0 = perf()
    for s in range(10):
        e = W(); e.reset(seed=1000 + s)
        for t in range(120): e.step(int(rng.integers(6))); n += 1
    print(f"  solo env.step {n / (perf() - t0):.0f} world-steps/s")
    for B in (16, 64, 256):
        bt = Batch([1000 + i % 200 for i in range(B)]); t0 = perf()
        for t in range(120): bt.step(rng.integers(6, size=B))
        print(f"  batch of {B:3d}: {B * 120 / (perf() - t0):.0f} world-steps/s", flush=True)


def invariants():
    """Invariants page prose: the invariants on long random runs of the shipped env, the naive reward invariant's alarms
    and their explanation, bugs planted by editing the shipped source, a drop-vs-hover metamorphic relation on 200
    held-out worlds, shrinking a failing episode, and what the checks cost."""
    import copy
    N_, LAKE_, VIL, UNB, BUR, BRN = G["N"], G["LAKE"], G["VILLAGE"], G["UNBURNT"], G["BURNING"], G["BURNT"]
    FL, BUCKET, DROP_R = G["FLAMMABLE"], G["BUCKET"], G["DROP_R"]
    body = re.search(r"export const WILDFIRE_SETUP = `(.*?)\n`;", (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8"), re.S).group(1)

    def planted(old, new):
        assert old in body, old
        ns = {}; exec(compile(body.replace(old, new), "<planted>", "exec"), ns); return ns

    def snap(env):
        return dict(T=env.T.copy(), E=env.E.copy(), S=env.S.copy(), timer=env.timer.copy(), ever=env.ever.copy(), pos=env.pos.copy(), water=env.water, t=env.t)

    def caught(b, env, a):
        S = b["S"].copy()
        if a == 5 and b["water"] > 0 and b["T"][tuple(b["pos"])] != LAKE_:
            r, c = b["pos"]; sq = S[max(r - DROP_R, 0):r + DROP_R + 1, max(c - DROP_R, 0):c + DROP_R + 1]; sq[sq == BUR] = UNB
        return (S == UNB) & (env.S == BUR)

    def broken(b, env, a, out, naive=False):
        o, rew, te, tr, _ = out; S, T = env.S, env.T
        dropped = a == 5 and b["water"] > 0 and b["T"][tuple(b["pos"])] != LAKE_
        grew = env.ever & ~b["ever"]; new = caught(b, env, a)
        rules = {
            "map": np.array_equal(T, b["T"]) and np.array_equal(env.E, b["E"]),
            "burnt stays burnt": not ((b["S"] == BRN) & (S != BRN)).any(),
            "fire on fuel": not ((S == BUR) & ~FL[T]).any(),
            "time left": not ((S == BUR) & (env.timer <= 0)).any(),
            "record grows": not (b["ever"] & ~env.ever).any() and not ((S != UNB) & ~env.ever).any(),
            "helicopter": 0 <= env.pos.min() and env.pos.max() < N_ and np.abs(env.pos - b["pos"]).sum() <= 1,
            "drop empties": env.water == b["water"] - 1 if dropped else True,
            "water": env.water == b["water"] if a < 5 else 0 <= env.water <= BUCKET,
            "moisture": env.M.min() >= 0.05 and env.M.max() <= 1 and bool((env.M[T == LAKE_] == 1).all()),
            "wind": 0 <= env.wspd <= 1, "clock": env.t == b["t"] + 1,
            "terminated": te == (not (S == BUR).any()), "not both": not (te and tr),
            "observation": np.array_equal(o[6], S == BUR) and np.array_equal(o[7], S == BRN),
            "reward": rew == (-grew.sum() - 10.0 * (grew & (T == VIL)).sum() if naive else -new.sum() - 10.0 * (new & (T == VIL)).sum()),
        }
        return [k for k, ok in rules.items() if not ok]

    def play(Wcls, pilot, episodes, policy="mixed", limits=True, naive=False, stop=False):
        rng = np.random.default_rng(0); steps = 0; hits = {}; first = None; called = 0
        for ep in range(episodes):
            env = Wcls(max_steps=int(rng.integers(10, 120))) if limits else Wcls(); env.reset(seed=ep); chief = pilot("guard")
            while True:
                a = int(rng.integers(6)) if policy == "random" or rng.random() < 0.5 else chief(env)
                b = snap(env)
                try:
                    out = env.step(a); bad = broken(b, env, a, out, naive)
                except Exception as e:
                    out = None; bad = [f"crash {type(e).__name__}"]
                steps += 1
                for k in bad: hits[k] = hits.get(k, 0) + 1
                if bad and first is None:
                    first = (ep, b["t"] + 1, bad[0])
                    if stop: return steps, hits, first, called
                if out is None or out[2] or out[3]:
                    called += out is not None and out[3]; break
        return steps, hits, first, called

    print("the shipped environment, corrected invariants")
    for policy in ("random", "mixed"):
        for limits in (False, True):
            s, h, f, called = play(W, G["pilot_chief"], 500, policy, limits)
            print(f"  {policy:6s} limits={limits!s:5s} {s} steps, time called {called}, broken {h or 'none'}", flush=True)
    s, h, f, _ = play(W, G["pilot_chief"], 500, "mixed", False, naive=True)
    print(f"  naive reward invariant (= -growth of the record), mixed, no limits: {s} steps, alarms {h}, first {f}")

    rng = np.random.default_rng(1); ts = tc = 0.0; n = 0
    for ep in range(100):
        env = W(); env.reset(seed=ep)
        while True:
            a = int(rng.integers(6)); t0 = time.perf_counter(); b = snap(env); t1 = time.perf_counter(); out = env.step(a); t2 = time.perf_counter()
            broken(b, env, a, out); t3 = time.perf_counter(); ts += t2 - t1; tc += (t1 - t0) + (t3 - t2); n += 1
            if out[2] or out[3]: break
    print(f"  cost: snapshot + checks {tc / ts:.2f}x a step (this machine)")

    print("bugs planted in the shipped source (first catch, 300 episodes, mixed play)")
    bugs = {
        "no wall at the edge": ("self.pos = np.array([min(max(r + dr, 0), N - 1), min(max(c + dc, 0), N - 1)])", "self.pos = np.array([r + dr, c + dc])"),
        "a drop un-burns burnt cells": ("hit = block == BURNING", "hit = block != UNBURNT"),
        "a drop never empties the bucket": ("            self.water -= 1\n", "            pass\n"),
        "the lake dries out": ("self.M = np.where(T == LAKE, 1.0, np.maximum(M - DRYING, 0.05))", "self.M = np.maximum(M - DRYING, 0.05)"),
        "cells burn one tick too long": ("spent = burning & (timer <= 0)", "spent = burning & (timer < 0)"),
        "wind strength not clipped": ("np.clip(self.wspd + self.rng.normal(0, 0.15), 0.0, 1.0)", "self.wspd + self.rng.normal(0, 0.15)"),
        "village fires cost nothing extra": ("reward = -lit - 10.0 * village_lit", "reward = -lit"),
        "time called even when the fire is out": ("truncated = (not terminated) and self.t >= self.max_steps", "truncated = self.t >= self.max_steps"),
        "the wind blows the wrong way": ("wr, wc = -np.cos(self.wdir), np.sin(self.wdir)", "wr, wc = np.cos(self.wdir), -np.sin(self.wdir)"),
        "fire spreads from burnt cells too": ("burning = S == BURNING\n", "burning = S != UNBURNT\n"),
        "the ground dries 5x too fast": ("np.maximum(M - DRYING, 0.05))", "np.maximum(M - 5 * DRYING, 0.05))"),
    }
    for name, (old, new) in bugs.items():
        ns = planted(old, new); row = []
        for limits in (False, True):
            s, h, f, _ = play(ns["Wildfire"], ns["pilot_chief"], 300, "mixed", limits, stop=True)
            row.append(f"limits={limits!s:5s} " + (f"episode {f[0]} step {f[1]} ({f[2]})" if f else f"survived {s} steps"))
        print(f"  {name:40s} " + " | ".join(row), flush=True)

    print("drop vs hover on the same dice (guard chief, 200 held-out worlds; both hover after the split)")
    ks = (1, 2, 4, 8); only = dict.fromkeys(ks, 0); more = dict.fromkeys(ks, 0); record = dict.fromkeys(ks, 0); forks = 0; relit = 0
    for seed in range(1000, 1200):
        env = W(); env.reset(seed=seed); chief = G["pilot_chief"]("guard")
        while True:
            a = chief(env)
            if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE_:
                d, h = copy.deepcopy(env), copy.deepcopy(env); S0 = env.S.copy(); r, c = env.pos
                sq = np.zeros((N_, N_), bool); sq[max(r - DROP_R, 0):r + DROP_R + 1, max(c - DROP_R, 0):c + DROP_R + 1] = True
                d.step(5); h.step(0); forks += 1; ticks = 0
                while ticks < 8:
                    if d.t % G["FIRE_EVERY"] == 0:
                        ticks += 1
                        if ticks in only:
                            extra = (d.S == BUR) & (h.S != BUR)
                            only[ticks] += bool(extra.any()); more[ticks] += int((d.S == BUR).sum() > (h.S == BUR).sum())
                            record[ticks] += int(d.ever.sum() > h.ever.sum())
                            if ticks == 1 and extra.any() and (extra <= (sq & (S0 == BUR) & (h.S == BRN))).all(): relit += 1
                        if ticks == 8: break
                    d.step(0); h.step(0)
            _, _, te, tr, _ = env.step(a)
            if te or tr: break
    print(f"  {forks} drops; a cell burning only in the drop copy {only}; more cells burning {more}; more cells in the record {record}; "
          f"k=1 cases that are a doused cell relit while its hover twin burned out: {relit} of {only[1]}")

    print("shrinking a failing episode (bug: a drop un-burns burnt cells; random actions)")
    MW = planted("hit = block == BURNING", "hit = block != UNBURNT")["Wildfire"]
    def fails(seed, acts):
        env = MW(); env.reset(seed=seed)
        for a in acts:
            b = snap(env); out = env.step(a)
            if "burnt stays burnt" in broken(b, env, a, out): return True
            if out[2] or out[3]: return False
        return False
    rng = np.random.default_rng(0)
    for ep in range(300):
        acts = [int(x) for x in rng.integers(6, size=300)]
        if fails(ep, acts): break
    env = MW(); env.reset(seed=ep); n = 0
    for a in acts:
        b = snap(env); out = env.step(a); n += 1
        if "burnt stays burnt" in broken(b, env, a, out) or out[2] or out[3]: break
    acts = acts[:n]; start = (len(acts), sum(a != 0 for a in acts)); changed = True
    while changed:
        changed = False
        for i in range(len(acts)):
            if acts[i] != 0 and fails(ep, acts[:i] + [0] + acts[i + 1:]): acts[i] = 0; changed = True
    print(f"  world {ep}: {start[0]} actions ({start[1]} not hover) -> {len(acts)} actions, not hover: "
          + ", ".join(f"step {i + 1} {['hover', 'north', 'east', 'south', 'west', 'button'][a]}" for i, a in enumerate(acts) if a))


def crew():
    """The crew that learned nothing (chapter 5 page 2): the flat pilot's local optimum written as one line, the
    exploration funnel with and without help, how long a random walk takes to find the lake, how much one good drop
    is worth against the noise between worlds, and the length bias that makes a flat training curve look alive."""
    LAKE_, BUCKET_ = G["LAKE"], G["BUCKET"]

    def episodes(policy, n=200, free_water=False, on_lake=False, **kw):
        """Fly n held-out worlds. Per world: village, burnt, return, put out, drops, filled, steps, scored before /
        after the first refill."""
        rows = []
        for k in range(n):
            env = W(**kw); env.reset(seed=1000 + k)
            if on_lake:
                lake = np.argwhere(env.T == LAKE_); env.pos = lake[np.abs(lake - env.pos).sum(1).argmin()]
            Gs = 0.0; filled = first = after = 0
            while True:
                if free_water: env.water = BUCKET_
                _, r, te, tr, info = env.step(policy(env)); Gs += r
                filled = filled or env.stats["fills"] > 0
                if info["put_out"] > 0:
                    if filled: after += 1
                    else: first += 1
                if te or tr: break
            s = env.summary()
            rows.append((s["village_damaged"], s["burnt"], Gs, s["put_out"], s["drops"], filled, s["t"], first, after))
        return np.array(rows, dtype=float)

    print("== 1. the flat pilot's local optimum is a one-line rule (200 held-out worlds)")
    print("   drop  rule / run                                village untouched    burnt    return  drops  put out  steps")
    for dr, runs in ((1, [("PPO, reward as written, seed 1, 2M", 4.470, .285, 163.680, -206.470, 0.995, 0.070, 78.81),
                          ("PPO, reward x0.1, 1M", 4.165, .285, 163.075, -202.725, 0.995, 0.055, 78.16),
                          ("PPO, reward x0.1, helicopter view, 1M", 4.530, .275, 162.785, -206.110, 0.995, 0.025, 78.46)]),
                     (2, [("PPO, reward x0.1, 1M", 2.815, .440, 152.155, -178.305, 1.000, 0.000, 77.39)])):
        x = episodes(lambda env: 5 if env.t == 0 else 0, drop_r=dr)
        print(f"   {2 * dr + 1}x{2 * dr + 1}  {'one drop, then hover':38s} {x[:, 0].mean():7.3f} {np.mean(x[:, 0] == 0):8.1%} "
              f"{x[:, 1].mean():8.3f} {x[:, 2].mean():9.3f} {x[:, 4].mean():6.2f} {x[:, 3].mean():8.3f} {x[:, 6].mean():6.2f}")
        for name, v, u, b, r, d, e, t in runs:
            print(f"        {name:38s} {v:7.3f} {u:8.1%} {b:8.3f} {r:9.3f} {d:6.2f} {e:8.3f} {t:6.2f}")
    print("   (the trained rows are held-out tests of the prototype trainer, not of this script)")

    print("== 1b. the crew did not even find the best version of its own trick: one drop, at step k, then hover")
    for dr, ks in ((1, (0, 2, 5, 10, 20)), (2, (0, 10, 20, 30, 40, 60))):
        for k0 in ks:
            x = episodes(lambda env, k0=k0: 5 if env.t == k0 else 0, drop_r=dr)
            print(f"   {2 * dr + 1}x{2 * dr + 1}  press at step {k0:2d}: village {x[:, 0].mean():.3f}  "
                  f"untouched {np.mean(x[:, 0] == 0):.1%}  return {x[:, 2].mean():.2f}")

    print("== 2. the exploration funnel: a uniform random pilot, 200 worlds, with and without help")
    print(f"   {'a random pilot that...':28s}{'refills':>8}{'scores':>8}{'chains':>8}{'put out/ep':>12}{'drops':>8}{'steps':>8}")
    for name, kw in (("presses buttons", {}), ("never empties its bucket", dict(free_water=True)),
                     ("starts on the lake", dict(on_lake=True))):
        rng = np.random.default_rng(0)
        x = episodes(lambda env: int(rng.integers(6)), **kw)
        fills = "     -" if kw.get("free_water") else f"{int(x[:, 5].sum()):6d}"
        print(f"   {name:28s}{fills:>8}{int((x[:, 7] > 0).sum()):8d}{int((x[:, 8] > 0).sum()):8d}"
              f"{x[:, 3].mean():12.2f}{x[:, 4].mean():8.2f}{x[:, 6].mean():8.1f}")

    print("== 3. how long does a random walk take to find the lake? (fire frozen, 200 worlds, cap 5000 steps)")
    rng = np.random.default_rng(1)
    short, found = [], []
    for k in range(200):
        env = W(fire_every=10 ** 9, max_steps=10 ** 9); env.reset(seed=1000 + k)
        lake = np.argwhere(env.T == LAKE_)
        short.append(int(np.abs(lake - env.pos).sum(1).min()))
        for step in range(5000):
            env.step(int(rng.integers(6)))
            if env.T[tuple(env.pos)] == LAKE_: found.append(step + 1); break
        else:
            found.append(np.nan)
    f = np.array(found, float)
    print(f"   shortest flight from the village to the lake: median {np.median(short):.0f} steps, worst {max(short)}")
    print(f"   a random walk first stands on the water after: median {np.nanmedian(f):.0f}, mean {np.nanmean(f):.0f}, "
          f"best {np.nanmin(f):.0f}, worst {np.nanmax(f):.0f}, never inside 5000: {int(np.isnan(f).sum())}")
    print(f"   worlds where it got there inside an average episode (77.7 steps): {int((f <= 77.7).sum())} of 200")

    print("== 4. one good drop against the noise between worlds")
    guard = G["pilot_chief"]("guard")
    full, skip = [], []
    for k in range(200):
        pair = []
        for hush in (False, True):
            env = W(); env.reset(seed=1000 + k); Gs = 0.0; dropped = 0
            while True:
                a = guard(env)
                if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE_:
                    if hush and dropped == 0: a = 0
                    dropped += 1
                _, r, te, tr, _ = env.step(a); Gs += r
                if te or tr: break
            pair.append(Gs)
        full.append(pair[0]); skip.append(pair[1])
    full, skip = np.array(full), np.array(skip); eff = full - skip; sd = full.std()
    print(f"   the guard chief's first drop is worth {eff.mean():+.2f} return (median {np.median(eff):+.1f}; helps "
          f"{np.mean(eff > 0):.0%}, changes nothing {np.mean(eff == 0):.0%}, hurts {np.mean(eff < 0):.0%})")
    print(f"   returns vary from world to world with sd {sd:.1f}  ->  signal/noise {eff.mean() / sd:.3f}; on unpaired "
          f"worlds, about {2 * (sd / (eff.mean() / 2)) ** 2:.0f} episodes a side to see it at two standard errors")
    pse = eff.std(ddof=1) / np.sqrt(200)
    print(f"   paired (the page's Proof): spread of the difference {eff.std(ddof=1):.2f}, standard error {pse:.2f} -> "
          f"{eff.mean() / pse:.1f} standard errors from 200 worlds; {(2 * eff.std(ddof=1) / eff.mean()) ** 2:.0f} worlds "
          f"would have done")
    hover, whole = episodes(lambda env: 0), episodes(guard)
    gap = whole[:, 2].mean() - hover[:, 2].mean()
    print(f"   the WHOLE guard policy against standing by: {gap:+.1f} return  ->  signal/noise {gap / sd:.1f}")

    print("== 5. why a flat training curve looks alive: shorter episodes are safer ones (stand by)")
    t, v = hover[:, 6], hover[:, 0]
    cut = np.median(t)
    print(f"   episode length median {cut:.0f}; correlation with village damage {np.corrcoef(t, v)[0, 1]:+.2f}")
    print(f"   the shorter half loses {v[t <= cut].mean():.2f} village cells, the longer half {v[t > cut].mean():.2f}")
    print(f"   true mean {v.mean():.2f}; weighted by 1/length, roughly what a window of finished episodes sees, "
          f"{np.average(v, weights=1 / t):.2f}")


def commander():
    """Pilot-or-commander page: the scripted pilot, the interface that contains the chiefs at K=1, the decision
    clock K (good rules want it short, a random crew wants it long), the exploration funnel, and how wide 256 is."""
    BURN, Cmd, disp = G["BURNING"], G["Command"], G["dispatcher"]
    NN, MAXS = G["N"], G["MAX_STEPS"]
    SORTIE = MAXS                      # no clock at all: one decision per sortie (a sortie can never outlast the episode)

    def line(d):
        return (f"{d['village_damaged']:8.2f}{d['village_saved']:10.1%}{d['burnt']:8.1f}{d['ret']:9.1f}"
                f"{d['drops']:7.2f}{d['put_out']:9.1f}{d['steps']:7.1f}")

    head = f"{'':30s}{'village':>8}{'untouched':>10}{'burnt':>8}{'return':>9}{'drops':>7}{'put out':>9}{'steps':>7}"

    print("== 1. at K=1 the commander's interface IS the pilot chief, to every printed digit")
    print(head)
    for mode in ("nearest", "guard"):
        print(f"  pilot chief, {mode:16s}", line(G["fly"](G["pilot_chief"](mode))))
        print(f"  commander K=1, {mode:15s}", line(G["command"](disp(mode), K=1)))
    # and the two baselines-page rules that aim at a cell which is never on fire
    vil = lambda env: int(np.argwhere(env.T == G["VILLAGE"])[4] @ [NN, 1])
    guard_pick = disp("guard")
    both = lambda env: int(env.pos @ [NN, 1]) if env.t == 0 else guard_pick(env)
    for name, pick_, K in (("soak the village", vil, 1), ("soak the village", vil, 4),
                           ("drop, then guard", both, 1), ("drop, then guard", both, 4)):
        guard_pick = disp("guard")
        print(f"  {name} as a commander, K={K:<2d}", line(G["command"](pick_, K=K)))

    def run(mode, K, n=200):
        "One dispatcher at one clock, with the bookkeeping `command` does not return."
        pick = disp(mode)
        dec, sortie, drops, put_out, steps, rets = [], [], [], [], [], []
        refills = first = after = 0
        for k in range(n):
            w = Cmd(K=K); w.reset(seed=1000 + k); env = w.env
            d = 0; total = 0.0; filled = False; f0 = a0 = 0
            while True:
                _, r, te, tr, info = w.step(pick(env))
                d += 1; total += r; sortie.append(info["steps"])
                if env.stats["fills"] > 0: filled = True
                if info["put_out"] > 0:
                    if filled: a0 += 1
                    else: f0 += 1
                if te or tr: break
            s = env.summary()
            dec.append(d); drops.append(s["drops"]); put_out.append(s["put_out"]); steps.append(s["t"]); rets.append(total)
            refills += filled; first += f0 > 0; after += a0 > 0
        return dict(dec=np.mean(dec), sortie=np.mean(sortie), drops=np.mean(drops), put_out=np.mean(put_out),
                    steps=np.mean(steps), ret=np.array(rets), ppd=np.sum(put_out) / max(np.sum(drops), 1),
                    refills=refills, first=first, after=after)

    print("\n== 2. the decision clock (200 held-out worlds; 'sortie' = no clock, one decision per sortie)")
    print(f"  {'rule':12s}{'K':>7}{'decisions/ep':>14}{'steps/decision':>16}{'drops/ep':>10}{'put out/ep':>12}"
          f"{'put out/drop':>14}{'return':>9}")
    rows = {}
    for mode in ("guard", "nearest", "densest", "random_fire", "random"):
        for K in (1, 2, 4, 8, SORTIE):
            d = run(mode, K); rows[(mode, K)] = d
            print(f"  {mode:12s}{'sortie' if K == SORTIE else K:>7}{d['dec']:14.1f}{d['sortie']:16.2f}{d['drops']:10.2f}"
                  f"{d['put_out']:12.2f}{d['ppd']:14.2f}{d['ret'].mean():9.1f}")
        print()

    print("== 3. is the clock's cost real? paired returns against K=1, world by world")
    for mode in ("guard", "nearest"):
        base = rows[(mode, 1)]["ret"]
        for K in (2, 4, 8, SORTIE):
            d = rows[(mode, K)]["ret"] - base
            se = d.std(ddof=1) / np.sqrt(len(d))
            print(f"   {mode:8s} K={'sortie' if K == SORTIE else K:>6} minus K=1: {d.mean():+7.2f} return "
                  f"(paired sd {d.std(ddof=1):5.2f}, se {se:4.2f}) -> {abs(d.mean()) / se:5.1f} standard errors")

    print("\n== 4. exploration: how often a crew that dispatches at random ever completes the chain")
    print(f"   {'':44s}{'refills':>9}{'scores':>8}{'chains':>8}{'put out/ep':>12}{'drops/ep':>10}{'decisions/ep':>14}")
    rng = np.random.default_rng(0); refills = first = after = 0
    po = dr = st = 0
    for k in range(200):
        env = W(); env.reset(seed=1000 + k); filled = False; f0 = a0 = 0
        while True:
            _, _, te, tr, info = env.step(int(rng.integers(6)))
            if env.stats["fills"] > 0: filled = True
            if info["put_out"] > 0:
                if filled: a0 += 1
                else: f0 += 1
            if te or tr: break
        s = env.summary(); refills += filled; first += f0 > 0; after += a0 > 0
        po += s["put_out"]; dr += s["drops"]; st += s["t"]
    print(f"   {'a pilot pressing buttons at random':44s}{refills:9d}{first:8d}{after:8d}{po / 200:12.2f}{dr / 200:10.2f}{st / 200:14.1f}")
    for K in (1, 2, 4, 8, SORTIE):
        d = rows[("random", K)]
        label = f"a commander dispatching at random, K={'sortie' if K == SORTIE else K}"
        print(f"   {label:44s}{d['refills']:9d}{d['first']:8d}{d['after']:8d}{d['put_out']:12.2f}{d['drops']:10.2f}{d['dec']:14.1f}")

    print("\n== 5. how wide is an action space of 256 target cells")
    pick = disp("guard"); burning, cover_hit, tgt_hit = [], [], []
    for k in range(200):
        w = Cmd(K=4); w.reset(seed=1000 + k); env = w.env
        while True:
            S = env.S == BURN
            burning.append(int(S.sum())); tgt_hit.append(float(S.mean()))
            cs = np.pad(np.pad(S.astype(np.int32), 2).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
            cover = cs[5:, 5:] - cs[:-5, 5:] - cs[5:, :-5] + cs[:-5, :-5]
            cover_hit.append(float((cover > 0).mean()))
            _, _, te, tr, _ = w.step(pick(env))
            if te or tr: break
    print(f"   at {len(burning)} real decision moments: {np.mean(burning):.1f} of 256 cells are burning "
          f"({np.mean(tgt_hit):.1%} of targets)")
    print(f"   a target drawn uniformly whose 5x5 drop covers at least one burning cell: {np.mean(cover_hit):.1%}")
    for mode in ("guard", "nearest"):
        d = G["fly"](G["pilot_chief"](mode))
        print(f"   the flat pilot's chain: the {mode} chief spends {d['steps'] / d['drops']:.1f} button presses per bucket "
              f"delivered ({d['steps']:.1f} steps, {d['drops']:.2f} drops)")

    print("\n== 6. what a long clock costs: is the named cell still alight when the water lands?")
    toward_ = G["toward"]

    def probe(mode, K, n=200):
        "Command.step rewritten line for line (asserted below to score identically) so the target can be peeked at."
        pick = disp(mode); rows, rets = [], []; landings = alight = 0
        for k in range(n):
            env = W(); env.reset(seed=1000 + k); total = 0.0
            while True:
                tgt = divmod(int(pick(env)), NN)
                lake = np.argwhere(env.T == G["LAKE"]); lake = lake[np.abs(lake - env.pos).sum(1).argmin()]
                to_lake, steps, te, tr = env.water == 0, 0, False, False
                while True:
                    a = toward_(env.pos, lake if to_lake else tgt)
                    landing = a == 5 and not to_lake
                    if landing: landings += 1; alight += int(env.S[tgt] == BURN)
                    _, r, te, tr, _ = env.step(a); total += r; steps += 1
                    if a == 5 and to_lake: to_lake = False
                    if landing or te or tr or steps >= K: break
                if te or tr: break
            rows.append(env.summary()); rets.append(total)
        return G["_score"](rows, rets), landings, alight / max(landings, 1)

    for mode in ("guard", "nearest"):
        for K in (1, 2, 4, 8, SORTIE):
            got, landings, alight = probe(mode, K)
            same = got == G["command"](disp(mode), K=K)
            print(f"   {mode:8s} K={'sortie' if K == SORTIE else K:>6}: {landings:4d} drops on a named target, still "
                  f"alight when the water lands {alight:6.1%}   ({'reproduces Command' if same else 'MISMATCH'})")


def values():
    """Reward-is-a-values-decision page: fly the rule book once, then price it under many rewards. The weight,
    the shape, where the ranking actually changes, and what each choice costs a learner."""
    LAKE_, VIL, BURN, toward_ = G["LAKE"], G["VILLAGE"], G["BURNING"], G["toward"]

    def to_lake(env):
        lake = np.argwhere(env.T == LAKE_); return toward_(env.pos, lake[np.abs(lake - env.pos).sum(1).argmin()])
    guard = G["pilot_chief"]("guard")
    rng = np.random.default_rng(0)
    RULES = {"stand by": lambda env: 0,
             "random buttons": lambda env: int(rng.integers(6)),
             "one drop, then hover": lambda env: 5 if env.t == 0 else 0,
             "nearest": G["pilot_chief"]("nearest"),
             "guard": guard,
             "soak the village": lambda env: to_lake(env) if env.water == 0 else toward_(env.pos, np.argwhere(env.T == VIL)[4]),
             "drop, then guard": lambda env: 5 if env.t == 0 else guard(env)}

    def tally(policy, n=200, hush_first_drop=False):
        """Per episode: cells that caught, village cells that caught, the same two counted again on every fire
        tick they spend alight, then the env's own bookkeeping."""
        out = []
        for k in range(n):
            env = W(); env.reset(seed=1000 + k)
            lit = vlit = rent = vrent = dropped = 0
            while True:
                a = policy(env)
                if hush_first_drop and a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE_:
                    if dropped == 0: a = 0
                    dropped += 1
                _, r, te, tr, info = env.step(a)
                lit += info["lit"]; vlit += info["village_lit"]
                if env.t % env.fire_every == 0:
                    b = env.S == BURN
                    rent += int(b.sum()); vrent += int((b & (env.T == VIL)).sum())
                if te or tr: break
            s = env.summary()
            out.append((lit, vlit, rent, vrent, s["burnt"], s["village_damaged"], s["put_out"], s["drops"], s["t"]))
        return np.array(out, float)

    T = {name: tally(pol) for name, pol in RULES.items()}
    cols = ["caught", "village", "rent", "v-rent", "burnt", "v-dmg", "put out", "drops", "steps"]
    print("== 1. the rule book, flown once (200 held-out worlds; 'rent' = burning cells summed over fire ticks)")
    print(f"  {'rule':24s}" + "".join(f"{c:>9}" for c in cols))
    for name, a in T.items():
        print(f"  {name:24s}" + "".join(f"{v:9.2f}" for v in a.mean(0)))

    ret = lambda a, w: -(a[:, 0] + w * a[:, 1]).mean()
    ws = [0, 1, 3, 10, 30, 100]
    print("\n== 2. the same episodes priced under -lit - w * village_lit (a village cell costs 1 + w)")
    print(f"  {'rule':24s}" + "".join(f"{'w=' + str(w):>11}" for w in ws))
    for name, a in T.items():
        print(f"  {name:24s}" + "".join(f"{ret(a, w):11.1f}" for w in ws))
    prev = None
    for w in [0, 0.2, 0.44, 0.45, 1, 5, 10, 20, 30, 30.9, 31, 60, 100, 300]:
        best = max(T, key=lambda nm: ret(T[nm], w))
        if best != prev: print(f"   w >= {w:<6g} (a village cell = {1 + w:<6g} ordinary)  ->  the book says: {best}")
        prev = best

    print("\n== 3. where a values judgement is needed at all")
    nv = lambda n: T[n][:, 0].mean() - T[n][:, 1].mean()
    vv = lambda n: T[n][:, 1].mean()
    names = list(RULES); need = dom = 0
    for i_ in range(len(names)):
        for j in range(i_ + 1, len(names)):
            a, b = names[i_], names[j]
            if (nv(a) <= nv(b) and vv(a) <= vv(b)) or (nv(b) <= nv(a) and vv(b) <= vv(a)):
                dom += 1; continue
            need += 1
            hi, lo = (a, b) if vv(a) < vv(b) else (b, a)          # `hi` saves village cells, `lo` burns less elsewhere
            r = (nv(hi) - nv(lo)) / (vv(lo) - vv(hi))
            print(f"   {hi:22s} overtakes {lo:22s} once a village cell is worth {r:7.2f} ordinary "
                  f"(it costs {nv(hi) - nv(lo):+6.2f} ordinary to save {vv(lo) - vv(hi):.2f} village)")
    print(f"   {dom} of {dom + need} pairs are settled with no weight at all; {need} need one.")
    # the page's cell works from the rounded table the first cell prints, so record those crossovers too
    R = {n: tuple(float(f"{T[n][:, c].mean():.2f}") for c in (0, 1)) for n in names}   # as the cell PRINTS them
    rc = lambda a, b: ((R[a][0] - R[a][1]) - (R[b][0] - R[b][1])) / (R[b][1] - R[a][1])
    print("   from the 2-decimal table the page's cell uses: " + ", ".join(
        f"{a} over {b} {rc(a, b):.2f}" for a, b in (("guard", "nearest"), ("drop, then guard", "nearest"),
                                                    ("drop, then guard", "guard"), ("soak the village", "guard"))))

    print("\n== 4. opinions already inside the arithmetic")
    for name in ("nearest", "guard", "drop, then guard", "soak the village"):
        a = T[name]; re = a[:, 0] + 2 - a[:, 4]
        print(f"   {name:20s} re-ignitions charged again {re.mean():5.2f}/ep ({re.mean() / a[:, 0].mean():5.1%} of its bill, "
              f"worst world {re.max():.0f}); the {a[:, 6].mean():5.2f} cells it put out earned it exactly 0")
    g, sb = T["guard"], T["stand by"]
    print(f"   the guard chief's whole {(sb[:, 0] + 10 * sb[:, 1]).mean() - (g[:, 0] + 10 * g[:, 1]).mean():+.1f} over standing by "
          f"is fires that never started: {sb[:, 0].mean() - g[:, 0].mean():.1f} fewer ignitions, "
          f"{sb[:, 1].mean() - g[:, 1].mean():.2f} fewer village ones")
    for name in ("nearest", "guard", "drop, then guard"):
        a = T[name]; r = -(a[:, 0] + 10 * a[:, 1])
        print(f"   {name:20s} across the 200 worlds, corr(cells put out, return) = {np.corrcoef(a[:, 6], r)[0, 1]:+.2f}, "
              f"corr(cells put out, cells burnt) = {np.corrcoef(a[:, 6], a[:, 4])[0, 1]:+.2f}")

    print("\n== 5. a different SHAPE: rent (charge every burning cell every fire tick) -- honest null on the ranking")
    ign = sorted(names, key=lambda n: -ret(T[n], 10))
    rnt = sorted(names, key=lambda n: (T[n][:, 2] + 10 * T[n][:, 3]).mean())
    print(f"  {'rule':24s}{'rent+10v':>11}{'rank by catching':>18}{'rank by rent':>14}")
    for name in names:
        a = T[name]
        print(f"  {name:24s}{-(a[:, 2] + 10 * a[:, 3]).mean():11.1f}{ign.index(name) + 1:18d}{rnt.index(name) + 1:14d}")
    print(f"   the two orders are {'IDENTICAL' if ign == rnt else 'DIFFERENT: ' + str(rnt)}")
    rc = lambda a, b, c, v: ((T[a][:, c].mean() - T[a][:, v].mean()) - (T[b][:, c].mean() - T[b][:, v].mean()))         / (T[b][:, v].mean() - T[a][:, v].mean())
    for a, b in (("guard", "nearest"), ("drop, then guard", "guard")):
        print(f"   crossover {a} over {b}: charged at ignition {rc(a, b, 0, 1):6.2f}, charged as rent {rc(a, b, 2, 3):6.2f}")

    print("\n== 6. the reward is also a learnability decision: how loud is one bucket? (guard, CRN, first drop hushed)")
    full, hush = T["guard"], tally(guard, hush_first_drop=True)
    print(f"  {'reward':38s}{'one bucket':>12}{'sd of return':>14}{'S/N':>8}{'whole policy S/N':>18}")
    for shape, (ci, vi) in (("-1 per cell that catches", (0, 1)), ("-1 per burning cell per tick", (2, 3))):
        for w in (0, 1, 10, 30, 100):
            f = full[:, ci] + w * full[:, vi]; h = hush[:, ci] + w * hush[:, vi]
            sby = sb[:, ci] + w * sb[:, vi]
            eff, sd = (h - f).mean(), f.std()
            print(f"  {shape + f', w={w}':38s}{eff:+12.2f}{sd:14.1f}{eff / sd:8.3f}{(sby.mean() - f.mean()) / sd:18.2f}")


def cobra():
    """The cobra-effect page: pay per cell put out. What the bounty ranks first, why no exchange rate on the
    damage reward can reach it, whether 'let it grow' is really the mechanism, and where the water actually lands."""
    LAKE_, VIL, BURN, toward_ = G["LAKE"], G["VILLAGE"], G["BURNING"], G["toward"]
    N_ = G["N"]

    def to_lake(env):
        lake = np.argwhere(env.T == LAKE_); return toward_(env.pos, lake[np.abs(lake - env.pos).sum(1).argmin()])
    guard = G["pilot_chief"]("guard")
    densest_cell = G["dispatcher"]("densest")

    def densest(env):
        "The densest rule as a PILOT, so it sits in the same table as the others: aim at the fullest drop square."
        if env.water == 0: return to_lake(env)
        if not (env.S == BURN).any(): return 0
        return toward_(env.pos, np.array(divmod(int(densest_cell(env)), N_)))

    def wait_then(k, inner):
        return lambda env: 0 if env.t < k else inner(env)

    RULES = {"stand by": lambda env: 0,
             "one drop, then hover": lambda env: 5 if env.t == 0 else 0,
             "nearest": G["pilot_chief"]("nearest"),
             "guard": guard,
             "densest": densest,
             "soak the village": lambda env: to_lake(env) if env.water == 0 else toward_(env.pos, np.argwhere(env.T == VIL)[4]),
             "drop, then guard": lambda env: 5 if env.t == 0 else guard(env)}

    def tally(policy, n=200):
        "Per episode: cells that caught, village cells among them, cells put out, and the env's own bookkeeping."
        out = []
        for k in range(n):
            env = W(); env.reset(seed=1000 + k)
            lit = vlit = po = 0
            while True:
                _, r, te, tr, info = env.step(policy(env))
                lit += info["lit"]; vlit += info["village_lit"]; po += info["put_out"]
                if te or tr: break
            s = env.summary()
            out.append((lit, vlit, po, s["burnt"], s["village_damaged"], s["drops"], s["t"], s["put_out_again"]))
        return np.array(out, float)

    t0 = time.time()
    T = {n: tally(p) for n, p in RULES.items()}
    names = list(RULES)
    harm = lambda n, rate=11: (T[n][:, 0] + (rate - 1) * T[n][:, 1]).mean()
    pay = lambda n: T[n][:, 2].mean()

    print("== 1. the rule book, flown once, priced three ways (200 held-out worlds)")
    cols = ["caught", "village", "put out", "burnt", "v-dmg", "drops", "steps", "again"]
    print(f"  {'rule':24s}" + "".join(f"{c:>9}" for c in cols) + f"{'harm(11)':>10}{'area':>9}{'bounty':>9}")
    for n in names:
        print(f"  {n:24s}" + "".join(f"{v:9.2f}" for v in T[n].mean(0)) +
              f"{-harm(n):10.1f}{-T[n][:, 0].mean():9.1f}{pay(n):9.2f}")
    by_harm = sorted(names, key=harm)
    by_pay = sorted(names, key=lambda n: -pay(n))
    print("   paid for damage, the book says: " + " > ".join(by_harm))
    print("   paid per cell put out, it says: " + " > ".join(by_pay))
    print(f"   the bounty's favourite ({by_pay[0]}) is #{by_harm.index(by_pay[0]) + 1} of {len(names)} on damage; "
          f"the damage reward's favourite ({by_harm[0]}) is #{by_pay.index(by_harm[0]) + 1} of {len(names)} on the bounty")
    sb, od = T["stand by"], T["one drop, then hover"]
    print(f"   the bounty scores 'stand by' and 'one drop, then hover' identically ({pay('stand by'):.2f} vs "
          f"{pay('one drop, then hover'):.2f}) though they differ by {sb[:, 1].mean() - od[:, 1].mean():.2f} village cells "
          f"and {sb[:, 0].mean() - od[:, 0].mean():.1f} cells overall")

    print("\n== 2. no exchange rate on the damage reward can reach the bounty's favourite")
    for n in names:
        a = T[n].mean(0)
        dom = [m for m in names if m != n and T[m][:, 0].mean() <= a[0] and T[m][:, 1].mean() <= a[1]]
        print(f"   {n:24s} caught {a[0]:7.2f}  village {a[1]:5.2f}   " +
              ("dominated by " + ", ".join(dom) if dom else "ON THE FRONTIER"))
    print("   -> a rule that lets MORE cells catch and MORE village cells catch loses at every rate from 0 to infinity.")

    print("\n== 3. a bounty bolted on top of the shipped reward: -lit - 10*village_lit + b * put_out")
    sc = lambda n, b: -harm(n) + b * pay(n)
    prev = None
    for b in (0, 1, 2, 2.9, 3, 3.1, 4, 4.1, 6, 10):
        best = max(names, key=lambda n: sc(n, b))
        print(f"   b = {b:<5g} guard {sc('guard', b):8.1f}   nearest {sc('nearest', b):8.1f}   densest {sc('densest', b):8.1f}"
              f"   -> the book says: {best}" + ("   <-- it changes here" if best != prev else ""))
        prev = best
    for a, b_ in (("densest", "guard"), ("nearest", "guard"), ("densest", "nearest")):
        print(f"   {a} overtakes {b_} at b = {(harm(a) - harm(b_)) / (pay(a) - pay(b_)):.4f}"
              f"   ({harm(b_) - harm(a):+7.2f} points of damage bought with {pay(a) - pay(b_):+6.2f} more cells put out)")

    print("\n== 4. 'it lets the fire grow so there is more to put out' -- hover for the first k steps, then guard")
    print(f"  {'k':>4}{'put out':>9}{'v-dmg':>8}{'burnt':>8}{'drops':>7}{'per drop':>10}{'steps':>7}{'harm(11)':>10}")
    for k in (0, 4, 8, 12, 16, 20, 30, 45, 60):
        a = tally(wait_then(k, guard)); m = a.mean(0)
        print(f"  {k:4d}{m[2]:9.2f}{m[4]:8.2f}{m[3]:8.1f}{m[5]:7.2f}{m[2] / max(m[5], 1e-9):10.2f}{m[6]:7.1f}"
              f"{-(a[:, 0] + 10 * a[:, 1]).mean():10.1f}")
    print("   -> waiting costs the crew PAY as well as damage: the fire burns out on a clock it does not control.")

    print("\n== 5. what the bounty is really correlated with, holding the crew fixed")
    for n in ("nearest", "guard", "densest", "drop, then guard"):
        a = T[n]; ret = -(a[:, 0] + 10 * a[:, 1])
        print(f"   {n:20s} corr(put out, cells burnt) {np.corrcoef(a[:, 2], a[:, 3])[0, 1]:+.2f}   "
              f"corr(put out, return) {np.corrcoef(a[:, 2], ret)[0, 1]:+.2f}   "
              f"corr(put out, village damage) {np.corrcoef(a[:, 2], a[:, 4])[0, 1]:+.2f}")
    a = T["guard"]; o = np.argsort(a[:, 2], kind="stable")
    for lab, ix in (("best paid 20", o[-20:]), ("worst paid 20", o[:20])):
        s = a[ix]
        print(f"   guard, {lab:14s} put out {s[:, 2].mean():6.2f}  burnt {s[:, 3].mean():6.1f}  village {s[:, 4].mean():5.2f}"
              f"  return {-(s[:, 0] + 10 * s[:, 1]).mean():8.1f}")

    print("\n== 6. where the water lands (every drop, 200 worlds)")
    print(f"  {'rule':20s}{'drops/ep':>9}{'first at':>9}{'burning':>9}{'hit':>7}{'dist to village':>17}{'<= 4':>7}")
    for n, pol in (("nearest", RULES["nearest"]), ("guard", guard), ("densest", densest)):
        D, firsts = [], []
        for k in range(200):
            env = W(); env.reset(seed=1000 + k); vc = np.argwhere(env.T == VIL).mean(0); first = None
            while True:
                a = pol(env); r0, c0 = env.pos
                wet = a == 5 and env.water > 0 and env.T[r0, c0] != LAKE_
                if wet: burning = int((env.S == BURN).sum()); d = abs(r0 - vc[0]) + abs(c0 - vc[1])
                _, _, te, tr, info = env.step(a)
                if wet:
                    D.append((burning, info["put_out"], d))
                    if first is None: first = env.t - 1
                if te or tr: break
            if first is not None: firsts.append(first)
        D = np.array(D, float)
        print(f"  {n:20s}{len(D) / 200:9.2f}{np.mean(firsts):9.1f}{D[:, 0].mean():9.1f}{D[:, 1].mean():7.2f}"
              f"{D[:, 2].mean():17.1f}{(D[:, 2] <= 4).mean():7.0%}")

    print("\n== 7. which reward is legible? (guard chief, every step of 200 worlds)")
    steps = []
    for k in range(200):
        env = W(); env.reset(seed=1000 + k)
        while True:
            a = guard(env)
            dropped = a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE_
            _, r, te, tr, info = env.step(a)
            steps.append((int(dropped), info["lit"] + 10 * info["village_lit"], info["put_out"]))
            if te or tr: break
    A = np.array(steps, float); drop, hrm, pay_ = A[:, 0], A[:, 1], A[:, 2]
    print(f"   {len(A)} steps, {drop.mean():.1%} of them a drop")
    print(f"   non-zero on:  damage reward {(hrm > 0).mean():.1%} of steps   bounty {(pay_ > 0).mean():.1%}")
    print(f"   corr(this step's reward, the crew acted this step):  damage {np.corrcoef(-hrm, drop)[0, 1]:+.3f}"
          f"   bounty {np.corrcoef(pay_, drop)[0, 1]:+.3f}")
    print(f"   of the steps where the damage reward is non-zero, {drop[hrm > 0].mean():.1%} were a drop; "
          f"of the bounty's, {drop[pay_ > 0].mean():.1%}")
    print(f"   damage charged on a step the crew dropped {hrm[drop > 0].mean():.2f}, on a step it did not {hrm[drop == 0].mean():.2f}")

    print("\n== 8. and how loud is one bucket under each reward? (CRN, guard's first drop hushed)")
    def tally_h(hush_first):
        out = []
        for k in range(200):
            env = W(); env.reset(seed=1000 + k); lit = vlit = po = dropped = 0
            while True:
                a = guard(env)
                if a == 5 and env.water > 0 and env.T[tuple(env.pos)] != LAKE_:
                    if hush_first and dropped == 0: a = 0
                    dropped += 1
                _, r, te, tr, info = env.step(a)
                lit += info["lit"]; vlit += info["village_lit"]; po += info["put_out"]
                if te or tr: break
            out.append((lit, vlit, po))
        return np.array(out, float)
    full_, hushed_ = tally_h(False), tally_h(True)
    print(f"  {'reward':34s}{'one bucket':>12}{'spread':>9}{'S/N':>8}{'whole policy S/N':>18}")
    for label, f_, h_, idle in (("-1 a cell, -11 a village cell", full_[:, 0] + 10 * full_[:, 1], hushed_[:, 0] + 10 * hushed_[:, 1], 167.36 + 10 * 6.79),
                                ("+1 a cell put out (the bounty)", -full_[:, 2], -hushed_[:, 2], 0.0)):
        eff, sd = (h_ - f_).mean(), f_.std()
        print(f"  {label:34s}{eff:+12.2f}{sd:9.2f}{eff / sd:8.3f}{(idle - f_.mean()) / sd:18.2f}")

    print("\n== 9. the same rules through the commander interface at K=4 (what the trained crews are compared with)")
    for m in ("guard", "nearest", "densest", "random_fire"):
        print(f"   {m:14s}", G["command"](G["dispatcher"](m), K=4))
    print(f"  ({time.time() - t0:.0f} s)")


def train():
    "Training-the-crew page: what the learner is handed, what a budget buys, and how noisy a score is."
    t0 = time.time()

    print("\n1. what the learner is handed (the shape the network has to match)")
    w = C(K=4)
    o, _ = w.reset(seed=1000)
    layers = "grass forest lake village elevation moisture burning burnt helicopter water wind_x wind_y".split()
    print(f"   observation {o.shape} {o.dtype}   actions {w.nA}")
    for i, nm in enumerate(layers):
        print(f"     {i:2d} {nm:10s} {o[i].min():6.2f} .. {o[i].max():5.2f}")

    print("\n2. a budget is simulator steps, not decisions")
    pick = G["dispatcher"]("guard")
    dec = sim = 0
    for k in range(50):
        w = C(K=4); w.reset(seed=3000 + k)
        while True:
            _, r, te, tr, info = w.step(pick(w.env)); dec += 1; sim += info["steps"]
            if te or tr: break
    print(f"   50 episodes: {dec} decisions cost {sim} simulator steps -> {sim/dec:.2f} steps a decision")
    print(f"   an episode: {sim/50:.1f} simulator steps, {dec/50:.1f} decisions")
    for b in (1_000_000, 2_000_000):
        print(f"     a {b:,}-step budget = {b/(sim/50):,.0f} episodes = {b/(sim/dec):,.0f} decisions")

    print("\n3. how far a 200-world score moves on its own (a policy that cannot learn)")

    def worlds(p, seeds):
        out = []
        for k in seeds:
            w = C(K=4); w.reset(seed=k)
            while True:
                _, r, te, tr, _ = w.step(p(w.env))
                if te or tr: break
            out.append(w.env.summary()["village_damaged"])
        return np.array(out, float)

    g = worlds(G["dispatcher"]("guard"), range(1000, 1200))
    se = g.std(ddof=1) / np.sqrt(len(g))
    print(f"   guard over the 200 held-out worlds: {g.mean():.2f} lost, world-to-world sd {g.std(ddof=1):.2f}")
    print(f"     the mean of 200 is worth +/-{2*se:.2f} (two standard errors)")
    print(f"     first hundred {g[:100].mean():.2f}, second hundred {g[100:].mean():.2f}")
    n = worlds(G["dispatcher"]("nearest"), range(1000, 1200))
    d = n - g
    print(f"   nearest minus guard on the SAME worlds: {d.mean():+.2f} +/-{2*d.std(ddof=1)/np.sqrt(len(d)):.2f}")
    print(f"     scored separately that gap would carry +/-{2*np.sqrt(g.var(ddof=1)/200 + n.var(ddof=1)/200):.2f}")

    print("\n4. how the return splits into ordinary cells and the village")
    print(f"   {'rule':12s} {'ordinary':>9s} {'village':>8s} {'return':>9s} {'village share':>14s}")

    def split(mode):
        p = G["dispatcher"](mode)
        lit = vlit = ret = 0.0
        for k in range(200):
            w = C(K=4); w.reset(seed=1000 + k)
            env = w.env
            orig = env.step

            def step(a, _o=orig):
                nonlocal lit, vlit
                out = _o(a)
                lit += out[4]["lit"]; vlit += out[4]["village_lit"]
                return out

            env.step = step
            while True:
                _, r, te, tr, _ = w.step(p(env)); ret += r
                if te or tr: break
        return lit / 200, vlit / 200, ret / 200

    for mode in ("random", "random_fire", "nearest", "guard", "densest"):
        lit, vlit, ret = split(mode)
        area, vill = lit, 10 * vlit
        print(f"   {mode:12s} {lit:9.2f} {vlit:8.2f} {ret:9.2f} {vill/(area+vill):13.1%}"
              f"   check -{area:.2f} - {vill:.2f} = {-(area+vill):.2f}")

    print("\n5. how often the clock actually runs out (the truncation bug's hiding place)")
    for mode in ("random", "guard"):
        p = G["dispatcher"](mode)
        tr_n = 0
        for k in range(200):
            w = C(K=4); w.reset(seed=1000 + k)
            while True:
                _, r, te, tr, _ = w.step(p(w.env))
                if te or tr: break
            tr_n += int(tr)
        print(f"   {mode:12s} {tr_n}/200 episodes truncated ({tr_n/2:.1f}%)")

    print(f"\n({time.time() - t0:.1f}s)")


if __name__ == "__main__":
    {"check": check, "baselines": baselines, "whisper": whisper, "explore": explore, "clock": clock, "export": export,
     "ca": ca, "wind": wind, "heli": heli, "clocks": clocks, "vec": vec, "invariants": invariants, "chiefs": chiefs, "crew": crew, "commander": commander, "values": values, "cobra": cobra, "train": train}[sys.argv[1] if len(sys.argv) > 1 else "check"]()
