"""The v2 world, examined — and recorded for the TypeScript port to replay.

    python scripts/boss_v2_cases.py moveset    the eight moves as frames
    python scripts/boss_v2_cases.py ladder     every scripted player, scored
    python scripts/boss_v2_cases.py parry      what the shrinking window actually costs
    python scripts/boss_v2_cases.py poise      how many swings a stagger really costs
    python scripts/boss_v2_cases.py port       record duels for boss_port_check_v2.mjs

BOSS_SETUP (v1) is frozen and is not touched by anything here. This reads BOSS_SETUP_V2.
"""
import json
import pathlib
import re
import sys

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_setup(name="BOSS_SETUP_V2"):
    "Run the shipped setup preamble and hand back its namespace."
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const " + name + r" = `(.*?)\n`;", src, re.S)
    if not m:
        raise SystemExit(f"{name} not found in runtimeSetup.ts")
    body = m.group(1).replace("\\\\u", "\\u").replace("\\\\n", "\\n")
    ns = {}
    exec(compile(body, f"<{name}>", "exec"), ns)
    return ns


G = load_setup()
Duel = G["Duel"]
MOVES, N_MOVES = G["MOVES"], G["N_MOVES"]
PLAYERS = dict(G["PLAYERS"])
REPEAT = 3


def head(s):
    print("\n" + s)
    print("-" * len(s))


# --------------------------------------------------------------------------- moveset
def moveset():
    head("the eight moves, as the frames they actually occupy")
    G["moveset"]()
    print()
    print("  v1 had the first three of these plus heavy and slam: five frontal cones of a")
    print("  similar width, which one answer -- back away and to the side -- largely covered.")
    print("  jab is too fast to react to (%d frames to its active window), sweep is %.2f rad"
          % (sum(n for k, n in MOVES[0]["seg"] if k == "w"), MOVES[3]["arc"]))
    print("  wide so there is no side to step to, and eruption reaches %.1fm through the whole"
          % MOVES[7]["reach"])
    print("  circle and cannot be blocked or parried at all.")


# --------------------------------------------------------------------------- ladder
def ladder():
    head("every scripted player, 200 duels each")
    G["ladder"](n=200)
    print()
    print("  'mash parry' is on this ladder on purpose: it is the habit the new parry rule")
    print("  exists to punish, and a ladder is the honest place to show what it costs.")


# --------------------------------------------------------------------------- the parry rule
def parry():
    """What does the shrinking window actually do? Press it on a fixed period and measure."""
    head("the parry window, measured against how often you press it")
    PARRY_WIN, PARRY_HEAT = G["PARRY_WIN"], G["PARRY_HEAT"]
    PARRY_LEN, PARRY_COST = G["PARRY_LEN"], G["PARRY_COST"]
    A_PARRY, A_IDLE = G["A_PARRY"], G["A_IDLE"]
    print("  window %d frames (%.2fs), fatigue lasts %d frames, recovery is %d frames."
          % (PARRY_WIN, PARRY_WIN / 30.0, PARRY_HEAT, PARRY_LEN))
    print("  Heat outlasts recovery, so pressing again as soon as you are allowed to stacks.")
    print()
    print("  This presser is BLIND -- it presses on a fixed period and never looks at the boss --")
    print("  so every land% here is low, and the column to read is the last one.")
    print()
    print("  press every   presses   landed    land%   dead windows")
    rows = []
    for period in (REPEAT, 18, 21, 24, 27, 30, 33, 36, 45):
        presses = landed = dead = 0
        for i in range(60):
            e = Duel(seed=3000 + i)
            last = -999
            while True:
                a = A_IDLE
                if e.t - last >= period and not e.busy and e.pst >= PARRY_COST:
                    a = A_PARRY
                    last = e.t
                    presses += 1
                _, _, term, trunc, _ = e.step(a)
                if term or trunc:
                    break
            landed += e.log["parries"]
            dead += e.log["parry_dead"]
        print("    %3d frames %8d %8d %7.1f%% %10d"
              % (period, presses, landed, 100.0 * landed / max(presses, 1), dead))
        rows.append((period, presses, landed, dead))
    under = [r for r in rows if r[0] < PARRY_HEAT]
    over = [r for r in rows if r[0] >= PARRY_HEAT]
    dead_under = sum(r[3] for r in under)
    dead_over = sum(r[3] for r in over)
    print()
    print("  Dead windows -- presses that arrived with no window left at all -- collapse from")
    print("  %d below a %d-frame gap to %d at or above it. That is not a gradient, it is the"
          % (dead_under, PARRY_HEAT, dead_over))
    print("  rule showing through: the fatigue clears after exactly %d frames, so a presser" % PARRY_HEAT)
    print("  slower than that never stacks and a presser faster than that always does.")
    print("  The worst row (%d frames apart) throws away %d of %d presses before they start."
          % (rows[0][0], rows[0][3], rows[0][1]))


# --------------------------------------------------------------------------- poise
def _land(combo, **over):
    """Land a fixed sequence of swings on a PINNED boss; return the poise trace.

    The boss is frozen on purpose -- held at a fixed distance and never allowed to start a move.
    Let it walk and the interval between your swings changes with it, so the same combo counts
    differently run to run and the number stops meaning "how many swings". Stamina is held full
    for the same reason: this measures the poise rule, with nothing else allowed to be the limit.
    """
    A_HEAVY, A_ATK, A_IDLE = G["A_HEAVY"], G["A_ATK"], G["A_IDLE"]
    e = Duel(seed=7, **over)
    trace, want = [], list(combo)
    while want and e.t < 4000:
        e.bx, e.bz, e.bang = 0.0, 0.0, 0.0     # pinned
        e.px, e.pz = 0.0, 1.5                  # inside the reach of both swings
        e.b_cd = 10 ** 9                       # and never allowed to swing back
        e.bm, e.bf = -1, 0
        e.pst = 1e9
        a = A_IDLE
        if not e.busy:
            a = A_HEAVY if want[0] == "H" else A_ATK
        n0 = e.log["hits_dealt"]
        before = e.b_poise
        e.step(a)
        if e.log["hits_dealt"] > n0:
            trace.append((want.pop(0), before, e.b_poise, e.b_stagger > 0))
            if e.b_stagger > 0:
                break
    return trace


def _count(combo, **over):
    t = _land(combo, **over)
    return len(t) if t and t[-1][3] else 0


def poise():
    """How many committed swings does a stagger actually cost?

    The answer is not the arithmetic you would do in your head, because the pool REGENERATES
    while you are swinging, and a heavy is 39 frames long.
    """
    head("what it costs to stagger the boss")
    mx, hit, hit2 = G["B_POISE_MAX"], G["POISE_HIT"], G["POISE_HIT2"]
    regen, stag = G["POISE_REGEN"], G["POISE_STAGGER"]
    print("  pool %.0f   light %.0f   heavy %.0f   regen %.2f/frame   stagger lasts %d frames"
          % (mx, hit, hit2, regen, stag))
    print("  On paper %d heavies clear the pool (%.0f >= %.0f). On the clock they do not:"
          % (-(-mx // hit2), hit2 * (-(-mx // hit2)), mx))
    print("  a heavy is %d frames, so the pool climbs back %.1f between two of them."
          % (sum(n for _, n in G["ATK2_SEG"]), sum(n for _, n in G["ATK2_SEG"]) * regen))
    print()
    print("  combo                       swings to stagger   poise after each")
    for name, combo in (("heavy only", "H" * 12), ("light only", "L" * 24),
                        ("heavy, then lights", "H" + "L" * 20),
                        ("alternating", "HL" * 10)):
        t = _land(combo)
        n = len(t) if t and t[-1][3] else 0
        seq = " ".join("%s%.0f" % (k, after) for k, _, after, _ in t)
        print("    %-24s %8s            %s"
              % (name, ("%d" % n) if n else "never", seq))
    print()
    nh, nl = _count("H" * 15), _count("L" * 30)
    print("  So one charged attack does not stagger, and neither do four: it takes %d." % nh)
    print("  %d frames of commitment and %.0f stamina. The light does the same job in %d swings,"
          % (nh * sum(n for _, n in G["ATK2_SEG"]), nh * G["ATK2_COST"], nl))
    print("  which is %d frames and %.0f stamina -- a real plan, and a much slower one."
          % (nl * sum(n for _, n in G["ATK_SEG"]), nl * G["ATK_COST"]))

    head("and what it costs to stop")
    # The bar is progress you can lose. Measure that directly rather than asserting it: put the
    # boss part-way down, then stand there doing nothing and see how much comes back.
    print("  The pool regenerates %.2f a frame, so standing off gives it back:" % regen)
    print()
    print("  seconds idle   posture recovered   that is worth")
    for secs in (0.5, 1, 2, 3, 5):
        back = regen * 30 * secs
        print("    %4.1fs %16.1f   %.2f heavies / %.2f lights"
              % (secs, back, back / hit2, back / hit))
    full = mx / (regen * 30)
    print()
    print("  A full bar comes back in %.1f seconds of no pressure at all. Four landed heavies is"
          % full)
    print("  %.0f posture; walk away for %.1f seconds and you have handed all four back."
          % (4 * hit2 - 3 * sum(n for _, n in G["ATK2_SEG"]) * regen,
             (4 * hit2 - 3 * sum(n for _, n in G["ATK2_SEG"]) * regen) / (regen * 30)))
    print("  That is the whole point of the rate: under the old 0.08 a frame, progress was")
    print("  effectively permanent and disengaging was free, so poking once and leaving cost")
    print("  nothing. Now pressure has to be sustained or it is wasted.")


# --------------------------------------------------------------------------- port
class Recorder:
    """Wraps the duel's generator and remembers every draw, in order."""

    def __init__(self, rng):
        self.rng, self.draws = rng, []

    def uniform(self, *a, **k):
        v = float(self.rng.uniform(*a, **k)); self.draws.append(("bearing", v)); return v

    def integers(self, lo, hi, *a, **k):
        v = int(self.rng.integers(lo, hi, *a, **k)); self.draws.append(("cooldown", v)); return v

    def choice(self, cands, *a, **k):
        v = int(self.rng.choice(cands, *a, **k)); self.draws.append(("choose", v)); return v


KEYS = ["px", "pz", "bx", "bz", "bang", "php", "bhp", "pst", "pa", "pf", "bm", "bf",
        "b_stagger", "b_poise", "parry_stack", "parry_heat", "parry_win"]
LOG_KEYS = ["parries", "blocks", "guard_breaks", "hits_taken", "rolls", "dodges", "swings",
            "heavies", "hits_dealt", "whiffs", "arc_misses", "guard_frames", "wall_frames",
            "dmg_dealt", "dmg_taken", "poise_breaks", "parry_mashes", "parry_dead"]


def _record(player, seed):
    pol = PLAYERS[player]
    e = Duel(seed=seed)
    # wrap the generator FIRST, then reset without a seed, so reset() does not replace it
    e.rng = Recorder(np.random.default_rng(seed))
    e.reset()
    frames, acts, a = [], [], G["A_IDLE"]
    while True:
        if e.t % REPEAT == 0:
            a = pol(e)
        acts.append(int(a))
        e.step(a)
        frames.append([round(float(getattr(e, k)), 12) if isinstance(getattr(e, k), float)
                       else int(getattr(e, k)) for k in KEYS])
        if e.php <= 0 or e.bhp <= 0 or e.t >= e.clock:
            break
    return dict(player=player, seed=seed, draws=e.rng.draws, actions=acts, frames=frames,
                log={k: (round(float(e.log[k]), 12) if isinstance(e.log[k], float) else int(e.log[k]))
                     for k in LOG_KEYS}), e


def port():
    """Record duels frame by frame, with the boss's random draws, for the TypeScript port.

    Two players, not one. 'patient parry' exercises the reads, the rolls and the heavy; 'mash
    parry' is the only thing that drives the fatigue counter to its ceiling, and a mechanic that
    the port check never reaches is a mechanic the port check does not check.
    """
    head("recording v2 duels for the TypeScript port to replay")
    cases = []
    for player, seed in (("patient parry", 1007), ("mash parry", 2011)):
        c, e = _record(player, seed)
        cases.append(c)
        print("  %-14s seed %4d  %4d frames, %3d boss draws   own hp %6.1f  boss hp %6.1f"
              % (player, seed, len(c["frames"]), len(c["draws"]), e.php, e.bhp))
        print("                 %d parries, %d mashes, %d dead windows, %d eruptions eaten"
              % (e.log["parries"], e.log["parry_mashes"], e.log["parry_dead"],
                 e.log["erupt_taken"]))
    path = ROOT / "results" / "boss_port_case_v2.json"
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(dict(keys=KEYS, logKeys=LOG_KEYS, cases=cases)), encoding="utf-8")
    print("\n  -> %s" % path.relative_to(ROOT))
    print("  now run: node scripts/boss_port_check_v2.mjs")


CMDS = {"moveset": moveset, "ladder": ladder, "parry": parry, "poise": poise,
        "port": port}

if __name__ == "__main__":
    args = sys.argv[1:] or ["moveset"]
    for a in args:
        if a not in CMDS:
            raise SystemExit("unknown command %r; try: %s" % (a, ", ".join(CMDS)))
    for a in args:
        CMDS[a]()
