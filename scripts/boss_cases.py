"""Honest numbers for World 3 (Boss fight) of the Building-environments track.

Every figure quoted on a World 3 page is produced here by running the SHIPPED environment code
(src/lib/runtimeSetup.ts -> BOSS_SETUP), extracted from the TypeScript so that what is verified is
byte-identical to what the browser's Run button executes.

    python scripts/boss_cases.py check      # contract, invariants, determinism, branch coverage
    python scripts/boss_cases.py ladder     # the sanity ladder, 200 held-out duels
    python scripts/boss_cases.py balance    # boss hp x riposte: the clock cliff
    python scripts/boss_cases.py rate       # one decision every R frames: when a mechanic disappears
    python scripts/boss_cases.py refuse     # can a player decline the duel? (the arena wall)
    python scripts/boss_cases.py arc        # reach is not enough: stepping out of the ARC
    python scripts/boss_cases.py clock      # the clock as truncation or as defeat
    python scripts/boss_cases.py dial       # boss aggression as a difficulty dial
    python scripts/boss_cases.py chip       # chip damage on a block: pricing the shield
    python scripts/boss_cases.py poise      # the second way to stagger it: how hard, and how long
    python scripts/boss_cases.py states     # the boss as a state machine: segments, reach, choice
    python scripts/boss_cases.py timing     # how wide the parry and the roll windows really are
    python scripts/boss_cases.py obs        # the 27 floats, and what the agent sees that you do not
    python scripts/boss_cases.py curriculum # each attack on its own: is the moveset a curriculum?
    python scripts/boss_cases.py rewards    # what each reward is paying for, on the same ladder
    python scripts/boss_cases.py speed      # throughput: the duel is not the bottleneck
    python scripts/boss_cases.py stepwise   # the three lines of step() that matter most
    python scripts/boss_cases.py moveset    # the moveset drawn as frames
    python scripts/boss_cases.py port       # record a duel for the TypeScript port to replay

The trained duellists (DQN / PPO, torch) are produced by scripts/boss_train.py, which trains against
this same extracted environment and scores through this same score() function.
"""
import pathlib
import re
import sys

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_setup(name="BOSS_SETUP"):
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
score, ladder, duel = G["score"], G["ladder"], G["duel"]
PLAYERS = dict(G["PLAYERS"])
MOVES, move_len = G["MOVES"], G["move_len"]
FPS, ATK_DMG = G["FPS"], G["ATK_DMG"]


def head(s):
    print()
    print(s)
    print("-" * len(s))


# --------------------------------------------------------------------------- check
def check():
    head("the reset/step contract")
    e = Duel(seed=0)
    o = e.reset(0)
    print(f"  observation is {o.shape[0]} floats, all finite: {bool(np.all(np.isfinite(o)))}")
    out = e.step(G["A_IDLE"])
    print(f"  step returns {len(out)} values (obs, reward, terminated, truncated, info)")

    head("invariants: 40 duels of uniformly random buttons, every frame checked")
    rng = np.random.default_rng(7)
    bad = []
    seen = dict(parry=0, dodge=0, block=0, brk=0, hit=0, whiff=0, poise=0,
                win=0, die=0, clock=0)
    for i in range(40):
        e = Duel(seed=i)
        while True:
            _, _, term, trunc, info = e.step(int(rng.integers(0, G["N_ACTIONS"])))
            import math as _m
            if _m.hypot(e.px, e.pz) > G["ARENA"] + 1e-9 or _m.hypot(e.bx, e.bz) > G["ARENA"] + 1e-9:
                bad.append("a fighter left the arena")
            if not (-_m.pi - 1e-9 <= e.off_axis() <= _m.pi + 1e-9):
                bad.append(f"off-axis angle {e.off_axis()}")
            if not (-1e-9 <= e.pst <= G["P_ST_MAX"] + 1e-9):
                bad.append(f"stamina {e.pst}")
            if e.php > G["P_HP_MAX"] + 1e-9 or e.bhp > G["B_HP_MAX"] + 1e-9:
                bad.append("hp went up")
            if e.bm >= 0 and e.bf >= G["move_len"](G["MOVES"][e.bm]):
                bad.append("boss frame past the end of its move")
            if e.b_stagger > 0 and e.bm >= 0:
                bad.append("a staggered boss still has a move out")
            if not (0.0 < e.b_poise <= G["B_POISE_MAX"] + 1e-9):
                bad.append(f"poise {e.b_poise}")
            if term or trunc:
                seen["win"] += info["won"]; seen["die"] += info["lost"]
                seen["clock"] += trunc
                break
        for a, b in (("parry", "parries"), ("dodge", "dodges"), ("block", "blocks"),
                     ("brk", "guard_breaks"), ("hit", "hits_taken"), ("whiff", "whiffs"),
                     ("poise", "poise_breaks")):
            seen[a] += e.log[b]
    print("  " + ("PASS" if not bad else f"FAIL {bad[:5]}"))
    print("  branch coverage:", ", ".join(f"{k} {v}" for k, v in seen.items()))
    print("  note: random play never once WINS, and at these poise constants it no longer reaches a")
    print("        guard break either -- a test only checks the branches it actually reaches, so both")
    print("        of those need a scripted player (patient parry wins; hold guard breaks 3.2 a duel).")

    head("determinism")
    rng = np.random.default_rng(3)
    acts = [int(a) for a in rng.integers(0, G["N_ACTIONS"], 900)]

    def trace(seed):
        e, out = Duel(seed=seed), []
        for a in acts:
            _, r, term, trunc, _ = e.step(a)
            out.append((round(float(r), 12), float(e.php), float(e.bhp), round(float(e.d), 12)))
            if term or trunc:
                break
        return out
    print(f"  same seed + same buttons identical: {trace(5) == trace(5)}")
    print(f"  a different seed differs:           {trace(5) != trace(6)}")


# --------------------------------------------------------------------------- ladder
def do_ladder():
    head("the sanity ladder -- 200 held-out duels (seeds 1000-1199), a decision every 3 frames")
    ladder()
    print()
    print("  the expert that cannot lose wins 200/200 and never takes a hit;")
    print("  the one that also punishes during recovery wins 195 and dies 5 times.")


# --------------------------------------------------------------------------- balance
def balance():
    head("boss hp x riposte multiplier -- the clock is a cliff, not a slope (120 duels)")
    print("  bossHP ripo |  patient parry  |   parry oracle")
    for hp in (200, 220, 240, 260):
        for rm in (2.5, 3.0, 3.5):
            G["B_HP_MAX"], G["RIPOSTE_MULT"] = float(hp), rm
            row = []
            for nm in ("patient parry", "parry oracle"):
                r = score(PLAYERS[nm], n=120)
                row.append(f"{100*r['win']/120:5.1f}w {100*r['die']/120:5.1f}d")
            print(f"  {hp:6d} {rm:4.1f} | {row[0]:>15} | {row[1]:>15}")
    G["B_HP_MAX"], G["RIPOSTE_MULT"] = 240.0, 3.0
    print("  shipped: 240 hp, x3.0. The flawless defender's win rate is a step function of the")
    print("  boss's health, because its damage per second barely varies: it does not start")
    print("  losing duels, it starts running out of clock.")


# --------------------------------------------------------------------------- rate
def rate():
    head("one decision every R frames -- the parry window is 5 frames wide (120 duels)")
    print(f"  {'R':>2} | {'patient parry':>21} | {'parry oracle':>21}")
    for R in (1, 2, 3, 4, 6, 8, 12):
        row = []
        for nm in ("patient parry", "parry oracle"):
            r = score(PLAYERS[nm], n=120, repeat=R)
            row.append(f"{100*r['win']/120:5.1f}w {100*r['die']/120:5.1f}d {r['parries']:5.2f}p")
        print(f"  {R:2d} | {row[0]:>21} | {row[1]:>21}")
    print("  R <= 3 is free; R = 6 cannot land a press inside the window and the mechanic goes.")


# --------------------------------------------------------------------------- refuse
def refuse():
    head("can a player simply decline the duel? (200 held-out duels)")
    for nm in ("run away", "circle", "hold guard"):
        r = score(PLAYERS[nm], n=200)
        print(f"  {nm:<12} {r['win']:3d} win {r['die']:3d} die {r['clock']:3d} clock  "
              f"own hp {r['php']:6.1f}  boss hp {r['bhp']:6.1f}  "
              f"against the wall {r['wall_pct']:5.1f}% of frames  G {r['G']:6.2f}")
    print("  the player walks at 0.075 a frame and the boss closes at 0.105, inside a wall at")
    print("  radius 8.0 -- so backing away ends against the wall and circling ends inside the")
    print("  boss's turn rate. Neither is a refusal any more; both are just a slower death.")


# --------------------------------------------------------------------------- arc
def arc():
    head("reach is not enough: an attack also has an ARC (200 held-out duels)")
    print("  arcX counts attacks that reached the player and missed anyway, because the player")
    print("  was not in front of the boss when the active frames began.")
    for nm in ("roll, punish", "sidestep, punish"):
        r = score(PLAYERS[nm], n=200)
        print(f"  {nm:<18} own hp {r['php']:5.1f}  hits taken {r['hits_taken']:4.2f}  "
              f"i-frame dodges {r['dodges']:4.2f}  arcX {r['arc_misses']:4.2f}  "
              f"mean distance {r['meanD']:4.2f}  G {r['G']:5.2f}")
    print("  rolling backwards leaves the arc by leaving the reach; rolling sideways leaves the")
    print("  arc and stays close enough to punish the recovery. Only the second is two-dimensional.")


# --------------------------------------------------------------------------- clock
def clock():
    head("the clock running out: a truncation, or a defeat? (200 held-out duels, return G)")
    names = ["stand still", "random buttons", "mash attack", "run away", "circle",
             "hold guard", "block, punish", "roll, punish", "sidestep, punish", "patient parry"]
    rows = {}
    for mode in ("truncate", "defeat"):
        rows[mode] = [score(PLAYERS[n], n=200, timeout=mode) for n in names]
    print(f"  {'player':<15} {'truncate':>9} {'defeat':>9}   {'win':>4} {'survives':>9}")
    for i, n in enumerate(names):
        a, b = rows["truncate"][i], rows["defeat"][i]
        print(f"  {n:<15} {a['G']:9.2f} {b['G']:9.2f}   {a['win']:4d} {a['clock']:9d}")
    print("  under truncate the non-winners spread over 53 points and rank sensibly: dying is the")
    print("  worst outcome and simply surviving still pays. Under defeat they are squeezed into")
    print("  -17..-41 and the ranking collapses -- mash attack, dead inside 15 s, outscores hold")
    print("  guard, alive and barely scratched at 30 s. Pricing out one bad policy flattened the")
    print("  reward's ability to rank all the others.")


# --------------------------------------------------------------------------- dial
def dial():
    head("boss aggression as a difficulty dial (60 duels, own hp left / win %)")
    names = ["hold guard", "block, punish", "sidestep, punish", "patient parry"]
    print(f"  {'aggr':>5} " + " ".join(f"{n:>21}" for n in names))
    for ag in (0.0, 0.25, 0.5, 0.75, 1.0):
        cells = []
        for n in names:
            r = score(PLAYERS[n], n=60, aggr=ag)
            cells.append(f"{100*r['win']/60:5.1f}w {r['php']:6.1f}hp")
        print(f"  {ag:5.2f} " + " ".join(f"{c:>21}" for c in cells))
    print("  the dial pushes the players who BLOCK down (hold guard 56.3 -> 30.0 hp, block+punish")
    print("  48.7 -> 29.0) and, now that poise exists, pulls the ones who AVOID the other way:")
    print("  sidestep goes 69.1 -> 79.0 hp as the boss gets angrier. A boss that attacks more often")
    print("  offers an avoider more openings, and openings are exactly what poise pays for -- so")
    print("  the same dial is a difficulty knob for one kind of player and a gift to another.")
    print("  (Before poise this row was flat at 70-74. The mechanic gave the dial a second sign.)")
    print("  The parrier still wins every duel on full health at every setting, and at aggr 0.00")
    print("  sidestep now wins 6.7% -- the first player other than a parrier to win anything.")


# --------------------------------------------------------------------------- chip
def chip():
    head("chip damage through a block -- what prices the shield (60 duels)")
    names = ["hold guard", "block, punish", "sidestep, punish"]
    print(f"  {'chip':>5} " + " ".join(f"{n:>26}" for n in names))
    for ch in (0.0, 0.10, 0.20, 0.35):
        cells = []
        for n in names:
            r = score(PLAYERS[n], n=60, chip=ch)
            cells.append(f"G {r['G']:6.2f} hp {r['php']:5.1f} brk {r['guard_breaks']:4.2f}")
        print(f"  {ch:5.2f} " + " ".join(f"{c:>26}" for c in cells))
    print("  guard breaks do not move with chip -- the stamina cost is what breaks a guard.")
    print("  sidestep, punish never blocks, so its row is flat: the ablation does what it says.")


# --------------------------------------------------------------------------- poise
def poise():
    base = dict(B_POISE_MAX=G["B_POISE_MAX"], POISE_HIT=G["POISE_HIT"],
                POISE_REGEN=G["POISE_REGEN"], POISE_STAGGER=G["POISE_STAGGER"])
    watch = ["mash attack", "block, punish", "roll, punish", "sidestep, punish", "patient parry"]

    head("does poise change any outcome? (200 held-out duels, poise off vs shipped)")
    print(f"  {'player':<18} {'win':>4} {'die':>4} {'bossHP':>8} {'ownHP':>7} {'brk':>5} {'hits':>5} {'G':>7}")
    for label, cfg in (("off", dict(POISE_HIT=0.0)), ("shipped", {})):
        G.update(base); G.update(cfg)
        print(f"  -- poise {label}")
        for nm in watch:
            r = score(PLAYERS[nm], n=200)
            print(f"  {nm:<18} {r['win']:4d} {r['die']:4d} {r['bhp']:8.1f} {r['php']:7.1f} "
                  f"{r['poise_breaks']:5.2f} {r['hits_taken']:5.2f} {r['G']:7.2f}")
    G.update(base)
    print("  the parry expert is untouched: 200/200 on full health, and 0.00 breaks, because it")
    print("  never needs one -- its damage is all riposte damage already. The punishers gain the")
    print("  most: block+punish crosses from -1.83 to 1.78 and stops dying, roll+punish doubles.")
    print("  And mashing, which lost 200 out of 200 before, now wins ONE. A reward for landing")
    print("  hits hands the reckless player a lottery ticket. It is still the worst policy on")
    print("  the board by 26 points, but it is no longer a policy that cannot possibly work.")

    head("how fast the pool refills decides WHO can use it (200 duels, two hits to break)")
    print(f"  {'regen':>6} {'refill':>7} | {'sidestep, punish':<26} | {'mash attack':<26}")
    for regen in (0.0, 0.08, 0.18, 0.40):
        G["POISE_REGEN"] = regen
        cells = []
        for nm in ("sidestep, punish", "mash attack"):
            r = score(PLAYERS[nm], n=200)
            cells.append(f"{r['poise_breaks']:4.2f}brk {r['bhp']:6.1f}bhp {r['G']:6.2f}G")
        refill = "never" if regen == 0 else f"{G['B_POISE_MAX'] / regen / FPS:.0f}s"
        print(f"  {regen:6.2f} {refill:>7} | {cells[0]:<26} | {cells[1]:<26}")
    G.update(base)
    print("  a fast refill does not switch the mechanic off evenly. The masher lands its hits")
    print("  back to back and keeps most of them; the punisher, whose hits are spread across")
    print("  openings, loses them first. The refill rate chooses which player the mechanic is for.")

    head("how long a break should put it down (200 duels) -- and the notch that decided it")
    rip = ATK_DMG * G["RIPOSTE_MULT"]
    print(f"  {'frames':>6} {'rip cashed':>11} {'mash wins':>10} {'gap':>7}  which avoider leads")
    for f in (40, 48, 52, 56, 58, 60, 64, 70):
        G["POISE_STAGGER"] = f
        r = {nm: score(PLAYERS[nm], n=200)
             for nm in ("roll, punish", "sidestep, punish", "mash attack")}
        gap = r["sidestep, punish"]["G"] - r["roll, punish"]["G"]
        print(f"  {f:6d} {r['sidestep, punish']['riposte_dmg'] / rip:11.2f} "
              f"{r['mash attack']['win']:10d} {gap:+7.2f}  "
              f"{'sideways' if gap > 0 else 'BACKWARDS'}")
    G.update(base)
    print("  two things move with the window. Short ones are inert: at 40 the punisher opens two")
    print("  breaks a duel and cashes 0.20 of them, because the window shuts before it is back in")
    print("  range with the stamina to swing. And 52-56 REVERSES which avoider scores better --")
    print("  a resonance between the window and the sidestepper's roll-and-swing cycle, not a")
    print("  design point, since the ordering comes back at 58. 58-64 is the only flat stretch")
    print("  where rolling sideways still beats rolling backwards, which is the thing this world")
    print("  was given a floor to show, so the shipped value sits in the middle of it at 60.")
    print("  It costs something, and the cost is in the second column: mashing, which could not")
    print("  win at all before poise, now wins 2 duels in 200.")



# --------------------------------------------------------------------------- states
def states():
    """The boss as a state machine: a move is a list of segments, and that is the whole design."""
    head("every move is a list of segments -- w windup, d delay, h active, r recovery")
    print("move     segments                        frames  reach   arc    dmg   advance/frame")
    for m in MOVES:
        segs = " ".join("%s%d" % (k, n) for k, n in m["seg"])
        print("%-8s %-30s %6d %6.1f %6.2f %6.0f %10.3f"
              % (m["name"], segs, move_len(m), m["reach"], m["arc"], m["dmg"], m["adv"]))

    head("what it is even ALLOWED to pick at a given distance (reach + advance during windup)")
    print("  distance   the moves whose hitbox can still reach you by the time it lands")
    for d in (1.5, 2.0, 2.4, 2.6, 2.8, 2.9):
        cands = [m["name"] for m in MOVES
                 if m["reach"] + m["adv"] * sum(n for k, n in m["seg"] if k in ("w", "d")) >= d - 0.1]
        print("%8.1f   %s" % (d, ", ".join(cands)))
    print("  beyond ENGAGE = %.1f it does not choose at all -- it walks at you." % G["ENGAGE"])
    print("  the slam is the only move that does not advance, so it drops out first: it is a")
    print("  punish for standing close, not an opener.")

    head("which move it actually picks, and how often (200 duels vs 'sidestep, punish')")
    print("aggr   slash  thrust   heavy    slam   combo   moves/duel")
    for aggr in (0.0, 0.5, 1.0):
        tot = np.zeros(len(MOVES))
        for i in range(200):
            e = Duel(seed=1000 + i, aggr=aggr)
            pol, a = PLAYERS["sidestep, punish"], 0
            while True:
                if e.t % 3 == 0:
                    a = pol(e)
                _, _, term, trunc, _ = e.step(a)
                if term or trunc:
                    break
            tot += e.log["boss_moves"]
        tot /= 200.0
        print("%4.1f  %6.2f  %6.2f  %6.2f  %6.2f  %6.2f  %11.2f"
              % (aggr, tot[0], tot[1], tot[2], tot[3], tot[4], tot.sum()))
    print("  aggression is one number and it does two things: it shortens the cooldown (7.9 ->")
    print("  11.9 moves a duel) and it re-weights the choice toward the two heavy attacks.")


# --------------------------------------------------------------------------- timing
def press_at(k, button):
    """Press `button` as soon as the boss's next active frame is k frames away or closer."""
    frames_to_active, will_connect = G["frames_to_active"], G["will_connect"]
    hold_range, A_PARRY = G["hold_range"], G["A_PARRY"]
    ROLL_RIGHT, ROLL_LEFT = G["ROLL_RIGHT"], G["ROLL_LEFT"]

    def pol(env):
        f = frames_to_active(env)
        if f is not None and f <= k and will_connect(env):
            if button == "parry" and env.pst >= G["PARRY_COST"]:
                return A_PARRY
            if button == "roll" and env.pst >= G["ROLL_COST"]:
                return ROLL_RIGHT if env.off_axis() >= 0 else ROLL_LEFT
        return hold_range(env)
    return pol


NOTE = dict(
    roll=["the roll is FORGIVING and it is not a slope. At one decision a frame it works for every",
          "k from 3 to 12 -- ten frames wide, which is its ten invulnerable frames written down --",
          "and at k = 1 or 2 the press lands with the startup still running and you eat all 4.58",
          "hits, exactly like a player who never pressed anything. At one decision every three",
          "frames the band starts at 5 instead of 3, because a press aimed at k can land as late",
          "as k-2."],
    parry=["the parry is the same shape and four times tighter: k = 3..7 at one decision a frame,",
           "which is the five-frame window written down as five frames, and NOTHING outside it. At",
           "one decision every three frames only k = 5..7 is safe -- three frames wide -- and k = 4",
           "already leaks 4.20 hits a duel. That is the whole argument for R <= 3, arrived at from",
           "the moveset rather than from how fast training goes. It costs 15 stamina against the",
           "roll's 25 and it buys a 55-frame stagger instead of survival: the hardest timing in",
           "the world pays the most."])


def timing():
    """How wide is each defensive window, really? Press at k frames' notice and count."""
    for button, label in (("roll", "roll -- 18 frames long, invulnerable on ITS frames 3-12"),
                          ("parry", "parry -- 22 frames long, counters on ITS frames 3-7")):
        for repeat in (1, 3):
            head("%s, pressed at k frames' notice (a decision every %d frames, 100 duels)"
                 % (label, repeat))
            print("   k   parries  dodges  hits taken   own hp        G")
            for k in range(1, 13):
                r = score(press_at(k, button), n=100, repeat=repeat)
                print("%4d %9.2f %7.2f %11.2f %8.1f %8.2f"
                      % (k, r["parries"], r["dodges"], r["hits_taken"], r["php"], r["G"]))
            if repeat == 3:
                print()
                for ln in NOTE[button]:
                    print("  " + ln)


# --------------------------------------------------------------------------- obs
OBS_NAMES = [
    "distance / ARENA", "sin(off-axis)", "cos(off-axis)", "room behind you",
    "your health", "boss health", "your stamina", "your action", "your action frame",
    "your hitstun", "guarding?",
    "move = slash", "move = thrust", "move = heavy", "move = slam", "move = combo",
    "its animation frame", "phase = windup", "phase = DELAY", "phase = active",
    "phase = recovery", "stagger frames left", "its reach", "its arc",
    "would it connect NOW?", "clock", "its poise",
]


def obs():
    """The 27 floats the agent gets, and the uncomfortable fact about four of them."""
    phase_at = G["phase_at"]
    head("the observation, read off a real duel at the worst possible moment")
    e = Duel(seed=1002)
    pol, a = PLAYERS["sidestep, punish"], 0
    while not (e.bm >= 0 and phase_at(MOVES[e.bm], e.bf)[0] == "d"):
        if e.t % 3 == 0:
            a = pol(e)
        _, _, term, trunc, _ = e.step(a)
        if term or trunc:
            raise SystemExit("no delay frame reached")
    v = e.obs()
    print("  frame %d: the boss is %d frames into '%s' and is HOLDING THE DELAY --"
          % (e.t, e.bf, MOVES[e.bm]["name"]))
    print("  the frames that look like a windup and do nothing.")
    for i, nm in enumerate(OBS_NAMES):
        mark = "  <-- the screen does not tell a human this" if i == 18 else ""
        print("  v[%2d]  %-26s %7.3f%s" % (i, nm, v[i], mark))

    head("how much of a duel IS that hold? (50 duels, boss-phase frames per duel)")
    print("player              frames  windup  DELAY  active  recovery  down/idle  delay share")
    for name in ("mash attack", "hold guard", "sidestep, punish", "patient parry"):
        cnt, tot = dict(w=0, d=0, h=0, r=0, i=0), 0
        for i in range(50):
            e = Duel(seed=1000 + i)
            pol, a = PLAYERS[name], 0
            while True:
                if e.t % 3 == 0:
                    a = pol(e)
                _, _, term, trunc, _ = e.step(a)
                k = phase_at(MOVES[e.bm], e.bf)[0] if (e.bm >= 0 and e.b_stagger == 0) else "i"
                cnt[k] += 1
                tot += 1
                if term or trunc:
                    break
        print("%-18s %7.0f %7.0f %6.0f %7.0f %9.0f %10.0f %10.1f%%"
              % (name, tot / 50, cnt["w"] / 50, cnt["d"] / 50, cnt["h"] / 50,
                 cnt["r"] / 50, cnt["i"] / 50, 100.0 * cnt["d"] / tot))
    print("  about one frame in eighteen, and every one of them is a frame where a human has to")
    print("  decide to do nothing. Note the expert's recovery column: 0 frames a duel. It cancels")
    print("  every move it sees with a parry, so it never watches one finish.")


# --------------------------------------------------------------------------- curriculum
def curriculum():
    """Is the moveset a curriculum? Score every player against each move on its own."""
    names = ["mash attack", "hold guard", "block, punish", "roll, punish",
             "sidestep, punish", "parry oracle", "patient parry"]
    head("one attack at a time: how hard is each move ALONE? (100 duels, win% / own hp left)")
    print("moveset   " + "".join("%18s" % n for n in names))
    for i, m in enumerate(MOVES + [None]):
        row = "%-9s " % (m["name"] if m else "ALL FIVE")
        for n in names:
            kw = dict(moves=[i]) if m else {}
            r = score(PLAYERS[n], n=100, **kw)
            row += "%18s" % ("%3d%% / %5.1f" % (r["win"], r["php"]))
        print(row)
    print()
    print("  the two attacks the brief calls frightening are the EASIEST: against 'slam' alone")
    print("  both avoiders finish on 100.0 hp, because a long telegraph is only frightening to")
    print("  something with a reaction time. 'combo' is the hard one -- two active segments 12")
    print("  frames apart, which is exactly when the roll's invulnerability runs out -- and it")
    print("  is the only move that beats the greedy expert (44% wins against 99-100% elsewhere).")
    print("  A curriculum ordered by how scary a move LOOKS would start at the wrong end.")

    head("the same, from the avoider's side (100 duels each, 'sidestep, punish')")
    print("move      attacks at you  hits taken  i-frame dodges  own hp")
    for i, m in enumerate(MOVES):
        r = score(PLAYERS["sidestep, punish"], n=100, moves=[i])
        print("%-9s %15.2f %11.2f %15.2f %7.1f"
              % (m["name"], r["hits_taken"] + r["dodges"] + r["arc_misses"],
                 r["hits_taken"], r["dodges"], r["php"]))


# --------------------------------------------------------------------------- rewards
def rewards():
    """What each reward is actually paying for, read off the ladder rather than argued."""
    names = ["stand still", "mash attack", "run away", "circle", "hold guard",
             "block, punish", "sidestep, punish", "patient parry"]
    note = dict(damage="0.1 x damage dealt - 0.1 x damage taken, +-30 at the end",
                trade="0.1 x damage dealt only: being hit is free",
                survive="1/30 a frame for staying alive, +-30 at the end")
    for kind in ("damage", "trade", "survive"):
        head("reward = %s (%s)" % (kind, note[kind]))
        print("player              win  die  clk | clock = truncate | clock = defeat")
        for n in names:
            a = score(PLAYERS[n], n=200, reward=kind, timeout="truncate")
            b = score(PLAYERS[n], n=200, reward=kind, timeout="defeat")
            print("%-18s %4d %4d %4d | %16.2f | %14.2f"
                  % (n, a["win"], a["die"], a["clock"], a["G"], b["G"]))
    print()
    print("  read the 'survive' block twice. Under a neutral clock it pays 'hold guard' exactly")
    print("  30.00 -- thirty seconds at a thirtieth a frame -- and it pays a WIN exactly +30 too,")
    print("  so refusing to fight and finishing the fight are worth the same number and the only")
    print("  difference is how long the winner had to spend. That is the turtle, in arithmetic.")
    print("  Under 'trade', where being hit costs nothing, 'hold guard' scores exactly 0.00: it")
    print("  never deals damage and is never charged for what it takes. And under 'damage' with")
    print("  the clock as a DEFEAT, every non-winner is squeezed into -17..-41 and the ordering")
    print("  stops being informative -- which is World 1's terminated-vs-truncated question,")
    print("  asked again and answered the other way round.")


# --------------------------------------------------------------------------- speed
def speed():
    """How fast is one duel? Fast enough that the duel is not what training waits for."""
    import time as _time
    head("throughput on one core (3 repeats, best of; nothing else running)")
    for label, pol in (("stand still (short duels)", PLAYERS["stand still"]),
                       ("patient parry (long duels)", PLAYERS["patient parry"])):
        best = 0.0
        for _ in range(3):
            t0, n = _time.perf_counter(), 0
            for i in range(60):
                e, a = Duel(seed=i), 0
                while True:
                    if e.t % 3 == 0:
                        a = pol(e)
                    _, _, term, trunc, _ = e.step(a)
                    n += 1
                    if term or trunc:
                        break
            best = max(best, n / (_time.perf_counter() - t0))
        print("  %-28s %8.0f frames/s = %6.0f decisions/s at R=3" % (label, best, best / 3))
    print("  a 2,000,000-decision training run is 6,000,000 frames, which is under a MINUTE of")
    print("  pure simulation. That run takes an hour. The duel is not the bottleneck --")
    print("  see boss_train.py, where the envs are batched to amortise the GPU round trip, not")
    print("  because the envs are slow.")

# --------------------------------------------------------------------------- moveset
def stepwise():
    """The three lines of step() a reader is most likely to get wrong, priced."""
    head("1. commitment -- how many presses does step() simply refuse to read?")
    print("  'if not self.busy:' guards the whole of section 1, so every button pressed during an")
    print("  attack, a roll, a parry or hitstun is DISCARDED -- not buffered, not queued. That one")
    print("  line is most of the difference between a Soulslike and a twin-stick shooter, so it is")
    print("  worth knowing how much of the duel it actually swallows.")
    print()
    print("  %-20s %9s %9s %8s" % ("player", "decisions", "ignored", "share"))
    for name in ("mash attack", "roll, punish", "sidestep, punish", "patient parry",
                 "random buttons"):
        pol, seen, ignored = PLAYERS[name], 0, 0
        for sd in range(1000, 1025):
            e, act = Duel(seed=sd), 0
            while True:
                if e.t % 3 == 0:
                    seen += 1
                    ignored += 1 if e.busy else 0
                    act = pol(e)
                _, _, term, trunc, _ = e.step(act)
                if term or trunc:
                    break
        print("  %-20s %9d %9d %7.1f%%" % (name, seen, ignored, 100.0 * ignored / seen))
    print()
    print("  Every player on the ladder spends between a third and two thirds of its decisions")
    print("  unable to act, and the two best ones -- the sidestepper at 36% and the parrier at")
    print("  48% -- differ more in WHEN they are committed than in how often. A reader who")
    print("  buffers presses instead of dropping them has built a different game.")

    head("2. a hitbox that fires ONCE -- what 'seg != self.b_seg_done' is worth")
    print("  Section 4 tests a hitbox on every frame of an active segment, so without a guard it")
    print("  would connect on every one of them. The guard is three words; here is its price.")
    print()
    print("  %-8s %6s %7s %6s %11s %12s %s"
          % ("move", "hits", "frames", "dmg", "as written", "un-guarded", ""))
    for m in MOVES:
        segs = sum(1 for k, _ in m["seg"] if k == "h")
        act = sum(n for k, n in m["seg"] if k == "h")
        one, many = m["dmg"] * segs, m["dmg"] * act
        note = "lethal from full health" if many >= 100 else ""
        print("  %-8s %6d %7d %6.0f %11.0f %12.0f %s"
              % (m["name"], segs, act, m["dmg"], one, many, note))
    print()
    print("  The player has 100 health, so TWO of the five -- heavy at 136 and slam at 150 -- would")
    print("  kill outright from full, and the other three would roughly halve you. 'combo' is why")
    print("  the guard compares against the SEGMENT INDEX rather than a boolean: it has two active")
    print("  segments and is meant to hit twice for 28, which a boolean would collapse to one 14.")

    head("3. why the riposte multiplier is read BEFORE poise is spent")
    print("  Section 5 reads 'mult' first, then spends poise in the else-branch. So the hit that")
    print("  BREAKS the pool lands for ordinary damage and the riposte is the NEXT swing. Swap the")
    print("  two lines and a break pays for itself immediately, which is a different game.")
    print()
    n = 200
    r = score(PLAYERS["sidestep, punish"], n=n, seed0=1000, repeat=3)
    extra = ATK_DMG * (G["RIPOSTE_MULT"] - 1.0)
    print("  sidestep, punish over %d held-out duels:" % n)
    print("    poise breaks a duel          %6.2f" % r["poise_breaks"])
    print("    damage dealt a duel          %6.1f" % r["dmg_dealt"])
    print("    of which riposte damage      %6.1f" % r["riposte_dmg"])
    print()
    print("    a break costs %.0f poise and the pool is %.0f, so it is 2 clean hits" %
          (G["POISE_HIT"], G["B_POISE_MAX"]))
    print("    if the breaking hit were itself a riposte: +%.0f damage each," % extra)
    print("    or +%.1f a duel -- %.0f%% more damage, for a one-line reordering."
          % (r["poise_breaks"] * extra, 100.0 * r["poise_breaks"] * extra / r["dmg_dealt"]))


def moveset():
    head("the boss moveset, drawn as the frames it occupies")
    G["moveset"]()


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


def port():
    """Record one duel frame by frame, with the boss's random draws, for the TypeScript port."""
    head("recording a duel for the TypeScript port to replay")
    import json
    pol = PLAYERS["sidestep, punish"]
    e = Duel(seed=1007)
    # wrap the generator FIRST, then reset without a seed, so reset() does not replace it
    e.rng = Recorder(np.random.default_rng(1007))
    e.reset()
    frames, acts, a = [], [], G["A_IDLE"]
    while True:
        if e.t % 3 == 0:
            a = pol(e)
        acts.append(int(a))
        e.step(a)
        frames.append([round(e.px, 12), round(e.pz, 12), round(e.bx, 12), round(e.bz, 12),
                       round(e.bang, 12), round(e.php, 12), round(e.bhp, 12), round(e.pst, 12),
                       int(e.pa), int(e.pf), int(e.bm), int(e.bf), int(e.b_stagger),
                       round(e.b_poise, 12)])
        if e.php <= 0 or e.bhp <= 0 or e.t >= e.clock:
            break
    out = dict(draws=e.rng.draws, actions=acts, frames=frames,
               log={k: (int(v) if not isinstance(v, float) else round(v, 12))
                    for k, v in e.log.items() if k != "boss_moves"})
    path = ROOT / "results" / "boss_port_case.json"
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(out), encoding="utf-8")
    print(f"  {len(frames)} frames, {len(e.rng.draws)} boss draws -> {path.relative_to(ROOT)}")
    print(f"  ending: own hp {e.php:.1f}, boss hp {e.bhp:.1f}, "
          f"{e.log['dodges']} dodges, {e.log['arc_misses']} arc misses")


CMDS = dict(check=check, ladder=do_ladder, balance=balance, rate=rate, refuse=refuse, arc=arc,
            clock=clock, dial=dial, chip=chip, poise=poise, states=states, timing=timing,
            obs=obs, curriculum=curriculum, rewards=rewards, speed=speed, stepwise=stepwise,
            moveset=moveset, port=port)

if __name__ == "__main__":
    want = sys.argv[1:] or ["check"]
    if want == ["all"]:
        want = list(CMDS)
    for w in want:
        if w not in CMDS:
            raise SystemExit(f"unknown: {w}. one of {', '.join(CMDS)}")
        CMDS[w]()
