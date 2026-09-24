"""FROZEN SNAPSHOT of the v2 world as it stood before the lunge was added.

sha1 cb065f440c4e -- eight moves, 32-float observation.

Why this file exists: `results/boss_v2/v2_stunlock_s0.pt` and `v2_dqn_2000k_s0.pt` were trained
against THIS world, and the numbers taken off them are published. Adding a ninth boss move changed
the observation layout, so those nets cannot even load against the live world any more. Rather
than let published figures become unverifiable, the build they belong to is kept here and
scripts/boss_v2_stunlock.py loads this instead of the live setup.

Do not edit. It is history, not code that is going anywhere.
"""
import math

import numpy as np

FPS = 30
MAX_FRAMES = 1080                 # 36 seconds

# --------------------------------------------------------------------- the floor
ARENA = 11.0                      # radius; both fighters are clamped inside it
START_D = 5.5
P_HP_MAX = 100.0
P_ST_MAX = 100.0
B_HP_MAX = 300.0

P_SPEED = 0.075                   # units per frame
B_CHASE = 0.105                   # you cannot outrun it -- rolling is the only way to make space
B_TURN_IDLE = 0.13                # radians per frame while it has no move out
B_TURN_WIND = 0.045               # and while winding one up: enough to punish an EARLY sidestep

ST_REGEN = 0.55
ST_DELAY = 20

# --------------------------------------------------------------------- the buttons
A_IDLE = 0
A_MOVE0 = 1
A_ATK = 9
A_ROLL0 = 10
A_GUARD = 14
A_PARRY = 15
A_HEAVY = 16
N_ACTIONS = 17
N_OBS = 32
ACTION_NAMES = (["idle"]
                + ["move in", "move in-right", "move right", "move back-right",
                   "move back", "move back-left", "move left", "move in-left"]
                + ["attack"]
                + ["roll in", "roll right", "roll back", "roll left"]
                + ["guard", "parry", "heavy attack"])

# --------------------------------------------------------------------- the player's two swings
# Light: fast and cheap, and worth very little posture. Twelve or thirteen of them break
# the boss, which is a real plan but a slow one -- see the note on POISE_REGEN.
ATK_SEG = [("w", 8), ("h", 2), ("r", 14)]
ATK_REACH = 2.0
ATK_DMG = 12.0
ATK_COST = 20.0
POISE_HIT = 16.0
# Heavy: slower than every boss move but the eruption, and worth more poise damage than a light
# -- but nothing like a whole pool on its own.
#
# Breaking poise takes THREE landed swings, and it takes three whatever you throw: heavy-only,
# light-only or mixed. That is not the arithmetic it looks like (36 + 36 = 72 >= 70), because the
# pool REGENERATES while you are swinging -- a heavy is 39 frames, which is 3.1 points back --
# so two heavies land on 1.2 remaining and the third is what puts it down. Measured, not
# reasoned: scripts/boss_v2_cases.py poise prints the trace.
#
# The first build of this world had the heavy at 50 against a pool of 50, so ONE broke poise from
# full and the trained agent stunlocked the boss for a 12.8-second win. See boss_v2_stunlock.py.
ATK2_SEG = [("w", 14), ("h", 3), ("r", 22)]
ATK2_REACH = 2.3
ATK2_DMG = 26.0
ATK2_COST = 34.0
# 33 against a pool of 100: FIVE landed heavies break the boss, not one and not two. The
# heavy is the posture weapon -- a light is worth about half of it per swing and less than half
# per second, so committing to the slow swing is what actually moves the bar.
POISE_HIT2 = 33.0

ROLL_LEN = 18
ROLL_I0 = 3
ROLL_I1 = 12
ROLL_DIST = 1.7
ROLL_COST = 25.0

# --------------------------------------------------------------------- the parry, rebuilt
# Sekiro's deflect is 12 frames at 60fps by default and SHRINKS with each recent press of the
# guard button -- down to about 4 frames, and to nothing if you mash -- clearing again after
# about 30 frames of not pressing, or instantly on a successful deflect.
#
# Ported to this sim's 30fps: 3 frames of window (a tenth of a second), one frame less for each
# press inside PARRY_HEAT, and heat that outlasts the recovery so that pressing again as soon as
# you are able DOES stack. PARRY_LEN is shorter than v1's 22 precisely so that mashing is
# physically possible -- a rule that punishes an input you cannot make teaches nothing.
PARRY_LEN = 16
PAR_I0 = 2
PARRY_WIN = 3
PARRY_HEAT = 30
PARRY_MAX_STACK = 3
PARRY_COST = 15.0

GUARD_CHIP = 0.20
GUARD_ST = 0.6
HITSTUN = 20
GUARDBREAK = 45
STAGGER = 55
RIPOSTE_MULT = 3.0

B_POISE_MAX = 100.0
# The bar is progress you can LOSE. At 0.35 a frame the boss recovers 10.5 posture a second,
# so disengaging for two seconds gives back roughly the whole of one heavy. That is the tension
# the old 0.08 did not have: there, progress was permanent and backing off was free, so there
# was no reason not to poke once and leave. Now pressure has to be sustained or it is wasted.
POISE_REGEN = 0.35
POISE_STAGGER = 60

# --------------------------------------------------------------------- the moveset
# arc is a HALF-angle in radians: the move connects when the player is within arc of the boss's
# centre line. 3.20 is past pi, which is how "everywhere" is spelled.
#
# v1 had five moves and they were all frontal cones of a similar width, so one answer -- back
# away and to the side -- covered nearly all of them. The three additions each close one of the
# doors that left open:
#   jab        18 frames start to finish. Too fast to react to, so it has to be respected before
#              it starts, which is a different skill from reacting.
#   sweep      arc 1.90. You cannot sidestep it. You leave, or you wear it.
#   eruption   the full circle out to 4.2m, and UNBLOCKABLE: no guard, no parry. The only answer
#              is to not be standing there, which costs stamina you wanted for something else.
MOVES = [
    dict(name="jab", seg=[("w", 6), ("h", 2), ("r", 10)],
         reach=2.2, arc=0.70, dmg=11, adv=0.05),
    dict(name="slash", seg=[("w", 14), ("h", 3), ("r", 16)],
         reach=2.4, arc=0.80, dmg=18, adv=0.03),
    dict(name="thrust", seg=[("w", 18), ("h", 2), ("r", 22)],
         reach=3.6, arc=0.35, dmg=22, adv=0.075),
    dict(name="sweep", seg=[("w", 16), ("h", 4), ("r", 24)],
         reach=3.2, arc=1.90, dmg=26, adv=0.04),
    dict(name="heavy", seg=[("w", 20), ("d", 8), ("h", 4), ("r", 28)],
         reach=2.7, arc=0.95, dmg=34, adv=0.015),
    dict(name="slam", seg=[("w", 24), ("d", 12), ("h", 5), ("r", 30)],
         reach=2.6, arc=1.40, dmg=30, adv=0.0),
    dict(name="combo", seg=[("w", 12), ("h", 3), ("w", 9), ("h", 3), ("r", 22)],
         reach=2.3, arc=0.70, dmg=14, adv=0.045),
    dict(name="eruption", seg=[("w", 30), ("d", 8), ("h", 6), ("r", 34)],
         reach=4.2, arc=3.20, dmg=40, adv=0.0, unblockable=True),
]
N_MOVES = len(MOVES)
ENGAGE = 3.4                      # beyond this it closes instead of swinging
BODY = 0.95                       # the two of them are solid: neither walks through the other


def move_len(m):
    return sum(n for _, n in m["seg"])


def phase_at(m, f):
    "Which segment of the animation frame f falls in, and its index."
    acc = 0
    for i, (kind, n) in enumerate(m["seg"]):
        if f < acc + n:
            return kind, i
        acc += n
    return "r", len(m["seg"]) - 1


def wrap(a):
    "An angle folded back into -pi..pi."
    return (a + math.pi) % (2 * math.pi) - math.pi


def clamp_arena(x, z):
    r = math.hypot(x, z)
    if r <= ARENA:
        return x, z
    return x * ARENA / r, z * ARENA / r


class Duel:
    """One fight on a floor. step() advances exactly one frame."""

    def __init__(self, seed=0, aggr=0.5, moves=None, reward="damage", chip=GUARD_CHIP,
                 clock=MAX_FRAMES, timeout="truncate",
                 poise_max=B_POISE_MAX, poise_hit=POISE_HIT, poise_hit2=POISE_HIT2,
                 poise_regen=POISE_REGEN):
        # poise_max / poise_hit2 are overridable so the SUPERSEDED build stays reproducible: the
        # first v2 had a 50-point pool and a heavy worth 50, i.e. a guaranteed break from full,
        # and the agent trained against it found a stunlock. scripts/boss_v2_stunlock.py.
        self.rng = np.random.default_rng(seed)
        self.poise_max = poise_max
        self.poise_hit = poise_hit
        self.poise_hit2 = poise_hit2
        self.poise_regen = poise_regen
        self.aggr = aggr
        self.allowed = list(range(N_MOVES)) if moves is None else list(moves)
        self.reward_kind = reward
        self.chip = chip
        self.clock = clock
        self.timeout = timeout
        self.reset(seed)

    # ------------------------------------------------------------------ reset
    def reset(self, seed=None):
        if seed is not None:
            self.rng = np.random.default_rng(seed)
            self.seed = seed
        self.t = 0
        th = float(self.rng.uniform(-math.pi, math.pi))
        self.bx, self.bz = 0.0, 0.0
        self.px, self.pz = START_D * math.sin(th), START_D * math.cos(th)
        self.bang = self.to_player()
        self.php, self.bhp = P_HP_MAX, B_HP_MAX
        self.pst = P_ST_MAX
        self.pa, self.pf = A_IDLE, 0
        self.pdir = 4
        self.p_stun = 0
        self.p_regen_lock = 0
        self.p_hit_done = False
        self.guarding = False
        self.bm, self.bf = -1, 0
        self.b_seg_done = -1
        self.b_cd = int(self.rng.integers(10, 40))
        self.b_stagger = 0
        self.b_poise = self.poise_max
        self.parry_stack = 0          # 0 fresh, PARRY_MAX_STACK is no window at all
        self.parry_heat = 0           # frames left in which another press counts as a repeat
        self.parry_win = PARRY_WIN    # the window THIS parry was started with
        self.log = dict(parries=0, blocks=0, guard_breaks=0, hits_taken=0, rolls=0,
                        dodges=0, swings=0, heavies=0, hits_dealt=0, riposte_dmg=0.0,
                        poise_breaks=0, chip_taken=0.0, dmg_taken=0.0, dmg_dealt=0.0,
                        whiffs=0, guard_frames=0, wall_frames=0, arc_misses=0,
                        parry_mashes=0, parry_dead=0, erupt_taken=0,
                        boss_moves=np.zeros(N_MOVES, int))
        return self.obs()

    # ------------------------------------------------------------------ geometry
    @property
    def d(self):
        return math.hypot(self.px - self.bx, self.pz - self.bz)

    def to_player(self):
        return math.atan2(self.px - self.bx, self.pz - self.bz)

    def off_axis(self):
        "How far off the boss's centre line you are, in radians. 0 = dead ahead."
        return wrap(self.to_player() - self.bang)

    # ------------------------------------------------------------------ helpers
    @property
    def busy(self):
        if self.p_stun > 0:
            return True
        if self.pa == A_ATK:
            return self.pf < move_len(dict(seg=ATK_SEG))
        if self.pa == A_HEAVY:
            return self.pf < move_len(dict(seg=ATK2_SEG))
        if A_ROLL0 <= self.pa <= A_ROLL0 + 3:
            return self.pf < ROLL_LEN
        if self.pa == A_PARRY:
            return self.pf < PARRY_LEN
        return False

    @property
    def parry_live(self):
        "Is the parry actually catching this frame? Uses the window frozen at press time."
        return self.pa == A_PARRY and PAR_I0 <= self.pf < PAR_I0 + self.parry_win

    def spend(self, c):
        self.pst = max(0.0, self.pst - c)
        self.p_regen_lock = ST_DELAY

    def _shift(self, eighths, dist):
        ang = self.to_player() + math.pi + eighths * math.pi / 4
        self.px, self.pz = clamp_arena(self.px + dist * math.sin(ang),
                                       self.pz + dist * math.cos(ang))
        self._separate()

    def _close(self, dist):
        self.bx, self.bz = clamp_arena(self.bx + dist * math.sin(self.bang),
                                       self.bz + dist * math.cos(self.bang))
        self._separate()

    def _separate(self):
        "Keep the two bodies apart, so the boss shoves the player instead of walking through."
        dx, dz = self.px - self.bx, self.pz - self.bz
        r = math.hypot(dx, dz)
        if r >= BODY:
            return
        if r < 1e-9:
            dx, dz, r = math.sin(self.bang), math.cos(self.bang), 1.0
        ux, uz = dx / r, dz / r
        self.px, self.pz = clamp_arena(self.bx + ux * BODY, self.bz + uz * BODY)
        if math.hypot(self.px - self.bx, self.pz - self.bz) < BODY - 1e-9:
            self.bx, self.bz = clamp_arena(self.px - ux * BODY, self.pz - uz * BODY)

    def _seg_start(self, m, seg):
        return sum(n for _, n in m["seg"][:seg])

    def _start_parry(self):
        "The button went down. Freeze the window it gets, and charge it for the habit."
        if self.parry_heat > 0:
            self.parry_stack = min(PARRY_MAX_STACK, self.parry_stack + 1)
            self.log["parry_mashes"] += 1
        else:
            self.parry_stack = 0
        self.parry_heat = PARRY_HEAT
        self.parry_win = max(0, PARRY_WIN - self.parry_stack)
        if self.parry_win == 0:
            self.log["parry_dead"] += 1
        self.pa, self.pf = A_PARRY, 0
        self.spend(PARRY_COST)

    # ------------------------------------------------------------------ one frame
    def step(self, a):
        php0, bhp0 = self.php, self.bhp

        # 1. the button, if it is even read this frame
        if not self.busy:
            self.guarding = a == A_GUARD
            if A_MOVE0 <= a <= A_MOVE0 + 7:
                self.pa, self.pf = a, 0
            elif a == A_ATK and self.pst >= ATK_COST:
                self.pa, self.pf, self.p_hit_done = A_ATK, 0, False
                self.spend(ATK_COST)
                self.log["swings"] += 1
            elif a == A_HEAVY and self.pst >= ATK2_COST:
                self.pa, self.pf, self.p_hit_done = A_HEAVY, 0, False
                self.spend(ATK2_COST)
                self.log["swings"] += 1
                self.log["heavies"] += 1
            elif A_ROLL0 <= a <= A_ROLL0 + 3 and self.pst >= ROLL_COST:
                self.pa, self.pf = a, 0
                self.spend(ROLL_COST)
                self.log["rolls"] += 1
            elif a == A_PARRY and self.pst >= PARRY_COST:
                self._start_parry()
            elif a in (A_IDLE, A_GUARD):
                self.pa, self.pf = a, 0
        if self.guarding:
            self.log["guard_frames"] += 1
        if math.hypot(self.px, self.pz) > ARENA - 0.6:
            self.log["wall_frames"] += 1

        # 2. the player moves
        if self.p_stun == 0:
            if A_MOVE0 <= self.pa <= A_MOVE0 + 7:
                self._shift(self.pa - A_MOVE0, P_SPEED * (0.55 if self.guarding else 1.0))
            elif A_ROLL0 <= self.pa <= A_ROLL0 + 3 and self.pf < ROLL_I1:
                self._shift(2 * (self.pa - A_ROLL0), ROLL_DIST / ROLL_I1)

        # 3. the boss decides
        if self.b_stagger > 0:
            self.b_stagger -= 1
        elif self.bm < 0:
            if self.b_cd > 0:
                self.b_cd -= 1
            want = wrap(self.to_player() - self.bang)
            self.bang += max(-B_TURN_IDLE, min(B_TURN_IDLE, want))
            if self.d > ENGAGE:
                self._close(B_CHASE)
            if self.b_cd <= 0 and self.d <= ENGAGE:
                self.bm = self._pick()
                self.bf, self.b_seg_done = 0, -1
                self.log["boss_moves"][self.bm] += 1

        # 4. the boss animation, its facing, and its hitboxes
        if self.bm >= 0 and self.b_stagger == 0:
            m = MOVES[self.bm]
            kind, seg = phase_at(m, self.bf)
            if kind in ("w", "d"):
                want = wrap(self.to_player() - self.bang)
                self.bang += max(-B_TURN_WIND, min(B_TURN_WIND, want))
                self._close(m["adv"])
            if kind == "h" and seg != self.b_seg_done:
                if self.d <= m["reach"] and abs(self.off_axis()) <= m["arc"]:
                    self._boss_hits(m["dmg"], m)
                    self.b_seg_done = seg
                elif self.bf == self._seg_start(m, seg):
                    self.log["whiffs"] += 1
                    if self.d <= m["reach"]:
                        self.log["arc_misses"] += 1
            self.bf += 1
            if self.bf >= move_len(m):
                self.bm, self.bf = -1, 0
                lo = int(round(6 + 40 * (1 - self.aggr)))
                self.b_cd = int(self.rng.integers(lo, lo + 26))

        # 5. the player's own hitbox
        if self.pa in (A_ATK, A_HEAVY):
            heavy = self.pa == A_HEAVY
            segs = ATK2_SEG if heavy else ATK_SEG
            reach = ATK2_REACH if heavy else ATK_REACH
            kind = phase_at(dict(seg=segs), self.pf)[0]
            if kind == "h" and not self.p_hit_done and self.d <= reach:
                mult = RIPOSTE_MULT if self.b_stagger > 0 else 1.0
                dealt = (ATK2_DMG if heavy else ATK_DMG) * mult
                self.bhp -= dealt
                self.p_hit_done = True
                self.log["hits_dealt"] += 1
                self.log["dmg_dealt"] += dealt
                if mult > 1:
                    self.log["riposte_dmg"] += dealt
                else:
                    # Poise. The multiplier was read BEFORE this, so the hit that breaks the pool
                    # does ordinary damage and the riposte is the NEXT one: a break only pays if
                    # you follow up.
                    self.b_poise -= self.poise_hit2 if heavy else self.poise_hit
                    if self.b_poise <= 0:
                        self._stagger(POISE_STAGGER)
                        self.log["poise_breaks"] += 1

        # 6. clocks
        if self.b_stagger == 0:
            self.b_poise = min(self.poise_max, self.b_poise + self.poise_regen)
        self.pf += 1
        if self.p_stun > 0:
            self.p_stun -= 1
        if self.parry_heat > 0:
            self.parry_heat -= 1
        if self.p_regen_lock > 0:
            self.p_regen_lock -= 1
        elif not self.guarding:
            self.pst = min(P_ST_MAX, self.pst + ST_REGEN)
        self.t += 1

        won = self.bhp <= 0
        lost = self.php <= 0
        term = won or lost
        trunc = self.t >= self.clock and not term
        if trunc and self.timeout == "defeat":
            lost, term, trunc = True, True, False
        r = self._reward(php0, bhp0, won, lost)
        return self.obs(), r, term, trunc, dict(won=won, lost=lost)

    def _pick(self):
        cands = []
        for i in self.allowed:
            m = MOVES[i]
            wind = sum(n for k, n in m["seg"] if k in ("w", "d"))
            if m["reach"] + m["adv"] * wind >= self.d - 0.1:
                cands.append(i)
        use = cands if cands else [1]
        # The slow, committing moves get likelier as aggression rises; the eruption stays rare
        # whatever happens, because a boss that opens with it every time is a boss with one move.
        w = []
        for i in use:
            n = MOVES[i]["name"]
            if n == "eruption":
                w.append(0.35 + 0.5 * self.aggr)
            elif n in ("heavy", "slam"):
                w.append(1 + 1.5 * self.aggr)
            else:
                w.append(1.0)
        w = np.array(w, float)
        return int(self.rng.choice(use, p=w / w.sum()))

    def _stagger(self, frames):
        "Put the boss down. Any stagger cancels the move it had out and refills its poise."
        self.b_stagger = frames
        self.b_poise = self.poise_max
        self.bm, self.bf, self.b_cd = -1, 0, 0

    def _boss_hits(self, dmg, m):
        if A_ROLL0 <= self.pa <= A_ROLL0 + 3 and ROLL_I0 <= self.pf <= ROLL_I1:
            self.log["dodges"] += 1
            return
        # The eruption goes through the shield and through the parry. Rolling out of it works
        # only because i-frames are i-frames; standing in it and pressing a button does not.
        if not m.get("unblockable"):
            if self.parry_live:
                self.log["parries"] += 1
                # A clean parry clears the fatigue outright, exactly as a successful deflect does
                # in Sekiro. Landing one is what buys back the next one.
                self.parry_stack, self.parry_heat = 0, 0
                self._stagger(STAGGER)
                return
            if self.guarding and self.pst > 0:
                chip = dmg * self.chip
                self.php -= chip
                self.pst -= dmg * GUARD_ST
                self.p_regen_lock = ST_DELAY
                self.log["blocks"] += 1
                self.log["chip_taken"] += chip
                self.log["dmg_taken"] += chip
                if self.pst <= 0:
                    self.pst = 0.0
                    self.p_stun = GUARDBREAK
                    self.pa, self.pf = A_IDLE, 0
                    self.guarding = False
                    self.log["guard_breaks"] += 1
                return
        self.php -= dmg
        self.p_stun = HITSTUN
        self.pa, self.pf = A_IDLE, 0
        self.guarding = False
        self.log["hits_taken"] += 1
        self.log["dmg_taken"] += dmg
        if m.get("unblockable"):
            self.log["erupt_taken"] += 1

    # ------------------------------------------------------------------ reward
    def _reward(self, php0, bhp0, won, lost):
        dealt = bhp0 - self.bhp
        taken = php0 - self.php
        if self.reward_kind == "damage":
            r = 0.1 * dealt - 0.1 * taken
        elif self.reward_kind == "trade":
            r = 0.1 * dealt
        elif self.reward_kind == "survive":
            r = 1.0 / FPS
        else:
            raise ValueError(self.reward_kind)
        if won:
            r += 30.0
        if lost:
            r -= 30.0
        return float(r)

    # ------------------------------------------------------------------ what it sees
    def obs(self):
        m = MOVES[self.bm] if self.bm >= 0 else None
        kind = phase_at(m, self.bf)[0] if m else "i"
        off = self.off_axis()
        v = np.zeros(N_OBS, np.float32)
        v[0] = self.d / ARENA
        v[1] = math.sin(off)
        v[2] = math.cos(off)
        v[3] = (ARENA - math.hypot(self.px, self.pz)) / ARENA     # room behind you
        v[4] = self.php / P_HP_MAX
        v[5] = self.bhp / B_HP_MAX
        v[6] = self.pst / P_ST_MAX
        v[7] = self.pa / (N_ACTIONS - 1)
        v[8] = min(self.pf, 40) / 40.0
        v[9] = self.p_stun / GUARDBREAK
        v[10] = 1.0 if self.guarding else 0.0
        if m is not None:
            v[11 + self.bm] = 1.0                                  # which move (8 slots)
        v[19] = min(self.bf, 60) / 60.0
        v[20] = 1.0 if kind == "w" else 0.0
        v[21] = 1.0 if kind == "d" else 0.0
        v[22] = 1.0 if kind == "h" else 0.0
        v[23] = 1.0 if kind == "r" else 0.0
        v[24] = self.b_stagger / STAGGER
        v[25] = (m["reach"] / ARENA) if m is not None else 0.0
        v[26] = (m["arc"] / math.pi) if m is not None else 0.0     # arc can exceed 1 now
        v[27] = 1.0 if (m is not None and self.d <= m["reach"] and abs(off) <= m["arc"]) else 0.0
        v[28] = self.t / self.clock
        v[29] = self.b_poise / self.poise_max
        # Without these two the parry rule is a partially observed problem for no reason: the
        # window depends on what you pressed half a second ago, so the agent is shown it.
        v[30] = self.parry_stack / PARRY_MAX_STACK                 # how worn the parry is
        v[31] = self.parry_heat / PARRY_HEAT                       # how long until it comes back
        return v


IN, IN_R, RIGHT, BACK_R, BACK, BACK_L, LEFT, IN_L = range(8)
ROLL_IN, ROLL_RIGHT, ROLL_BACK, ROLL_LEFT = (A_ROLL0 + i for i in range(4))


def frames_to_active(env):
    """Frames until the boss's next active frame, or None if it has no move out."""
    if env.bm < 0 or env.b_stagger > 0:
        return None
    m = MOVES[env.bm]
    acc, f = 0, env.bf
    for i, (kind, n) in enumerate(m["seg"]):
        if kind == "h" and acc + n > f and i != env.b_seg_done:
            return max(0, acc - f)
        acc += n
    return None


def will_connect(env, slack=0.25):
    """Is the player currently inside the reach AND the arc of the move being wound up?"""
    if env.bm < 0 or env.b_stagger > 0:
        return False
    m = MOVES[env.bm]
    return env.d <= m["reach"] + slack and abs(env.off_axis()) <= m["arc"]


def incoming(env):
    """The move the boss has out, or None."""
    return MOVES[env.bm] if (env.bm >= 0 and env.b_stagger == 0) else None


def boss_recovering(env):
    if env.bm < 0 or env.b_stagger > 0:
        return False
    return phase_at(MOVES[env.bm], env.bf)[0] == "r"


def window_if_pressed_now(env):
    """How many frames of parry the NEXT press would get, given the fatigue right now."""
    stack = min(PARRY_MAX_STACK, env.parry_stack + 1) if env.parry_heat > 0 else 0
    return max(0, PARRY_WIN - stack)


# --------------------------------------------------------------------- scripted players
def hold_range(env, lo=1.6, hi=2.3):
    if env.pst < 30:
        return A_MOVE0 + BACK
    if env.d > hi:
        return A_MOVE0 + IN
    if env.d < lo:
        return A_MOVE0 + BACK
    return A_MOVE0 + RIGHT


def close_and_hit(env):
    if env.d <= ATK_REACH and env.pst >= ATK_COST:
        return A_ATK
    return A_MOVE0 + IN


def stand_still(env):
    return A_IDLE


def random_buttons(seed=0):
    rng = np.random.default_rng(seed)

    def pol(env):
        return int(rng.integers(0, N_ACTIONS))
    return pol


def masher(env):
    return A_ATK if env.pst >= ATK_COST else A_IDLE


def run_away(env):
    return A_MOVE0 + BACK


def circle(env):
    return A_MOVE0 + RIGHT


def turtle(env):
    return A_GUARD


def mash_parry(env):
    """The habit the fatigue rule exists to punish. Kept as a named player so the cost of it is
    a number on the ladder rather than an assertion in a comment."""
    if env.b_stagger > 0 and env.d <= ATK2_REACH and env.pst >= ATK2_COST:
        return A_HEAVY
    if env.pst >= PARRY_COST:
        return A_PARRY
    return hold_range(env)


def roll_and_punish(env):
    k = frames_to_active(env)
    if k is not None and 3 <= k <= 10 and will_connect(env) and env.pst >= ROLL_COST:
        return ROLL_BACK
    if env.b_stagger > 0 or boss_recovering(env):
        if env.pst >= ATK_COST + ROLL_COST:
            return close_and_hit(env)
    return hold_range(env)


def patient_parry(env):
    """Parries only on a read, and only while the window is still full width. Rolls out of the
    sweep and the eruption, because neither can be answered with a button."""
    m = incoming(env)
    k = frames_to_active(env)
    if m is not None and m.get("unblockable"):
        if k is not None and k <= 14 and env.pst >= ROLL_COST:
            return ROLL_BACK
        return A_MOVE0 + BACK
    if env.b_stagger > 0:
        if env.d <= ATK2_REACH and env.pst >= ATK2_COST:
            return A_HEAVY
        if env.d <= ATK_REACH and env.pst >= ATK_COST:
            return A_ATK
        return A_MOVE0 + IN
    if (k is not None and 1 <= k <= 3 and will_connect(env) and env.pst >= PARRY_COST
            and window_if_pressed_now(env) >= PARRY_WIN):
        return A_PARRY
    if m is not None and m["arc"] > 1.5 and k is not None and k <= 6 and env.pst >= ROLL_COST:
        return ROLL_BACK
    if env.bm < 0 and env.d <= ATK_REACH and env.pst >= ATK_COST:
        return A_ATK
    return hold_range(env)


PLAYERS = [
    ("stand still", stand_still), ("random buttons", random_buttons()),
    ("mash attack", masher), ("run away", run_away), ("circle", circle),
    ("hold guard", turtle), ("mash parry", mash_parry),
    ("roll, punish", roll_and_punish), ("patient parry", patient_parry),
]


# --------------------------------------------------------------------- scoring
def duel(policy, seed=0, repeat=3, **kw):
    env = Duel(seed=seed, **kw)
    G, a, dsum, offsum = 0.0, A_IDLE, 0.0, 0.0
    presses = 0
    while True:
        if env.t % repeat == 0:
            a = policy(env)
        if a == A_PARRY and not env.busy and env.pst >= PARRY_COST:
            presses += 1
        _, r, term, trunc, info = env.step(a)
        G += r
        dsum += env.d
        offsum += abs(env.off_axis())
        if term or trunc:
            return dict(G=G, frames=env.t, won=int(info["won"]), lost=int(info["lost"]),
                        php=env.php, bhp=env.bhp, meanD=dsum / env.t,
                        meanOff=offsum / env.t, parry_presses=presses, **env.log)


def score(policy, n=200, seed0=1000, repeat=3, **kw):
    rows = [duel(policy, seed=seed0 + i, repeat=repeat, **kw) for i in range(n)]
    out = dict(win=sum(r["won"] for r in rows), die=sum(r["lost"] for r in rows), n=n)
    out["clock"] = n - out["win"] - out["die"]
    for k in rows[0]:
        if k not in ("won", "lost", "boss_moves"):
            out[k] = float(np.mean([float(r[k]) for r in rows]))
    out["guard_pct"] = 100.0 * out["guard_frames"] / out["frames"]
    out["wall_pct"] = 100.0 * out["wall_frames"] / out["frames"]
    out["parry_pct"] = (100.0 * out["parries"] / out["parry_presses"]
                        if out["parry_presses"] > 0 else 0.0)
    return out


def ladder(players=None, n=200, seed0=1000, repeat=3, **kw):
    print("player           win  die  clk  bossHP  ownHP   sec  press  parry  land%  mash  dead  poise  hits  erupt        G")
    out = {}
    for name, pol in (PLAYERS if players is None else players):
        r = score(pol, n=n, seed0=seed0, repeat=repeat, **kw)
        out[name] = r
        print("%-16s %4d %4d %4d %7.1f %6.1f %5.1f %6.2f %6.2f %6.1f %5.2f %5.2f %6.2f %5.2f %6.2f %8.2f" % (
            name, r["win"], r["die"], r["clock"], r["bhp"], r["php"], r["frames"] / FPS,
            r["parry_presses"], r["parries"], r["parry_pct"], r["parry_mashes"],
            r["parry_dead"], r["poise_breaks"], r["hits_taken"], r["erupt_taken"], r["G"]))
    return out


def timeline(name, width=1):
    """Draw one boss move as the frames it actually occupies."""
    m = [x for x in MOVES if x["name"] == name][0]
    mark = {"w": "-", "d": "=", "h": "#", "r": "."}
    bar = "".join(mark[k] * (n * width) for k, n in m["seg"])
    tail = "  UNBLOCKABLE" if m.get("unblockable") else ""
    return "%-9s %s  %d frames, reach %.1f, arc %.2f rad, %.0f damage%s" % (
        name, bar, move_len(m), m["reach"], m["arc"], m["dmg"], tail)


def moveset():
    print("windup -   delay =   ACTIVE #   recovery .")
    for m in MOVES:
        print(timeline(m["name"]))
