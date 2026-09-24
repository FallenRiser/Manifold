"""Train a duellist for World 3 (Boss fight) of the Building-environments track.

Two learners against the SAME shipped environment, on the same 16-button interface:

    DQN   value-based, off-policy, a replay buffer                (Function-approximation track, ch.5)
    PPO   policy-gradient, on-policy, fresh rollouts every update

The environment is not re-implemented here. It is extracted from src/lib/runtimeSetup.ts exactly the
way scripts/boss_cases.py extracts it, so the world a duellist trains in is byte-identical to the one
the browser's Run button executes, and the held-out score comes from the SHIPPED `score()` -- 200
duels on seeds 1000-1199, which training never touches, and which every scripted player on the sanity
ladder was measured over.

    python scripts/boss_train.py dqn --decisions 1000000 --seed 0
    python scripts/boss_train.py ppo --decisions 1000000 --seed 0
    python scripts/boss_train.py dqn --decisions 1000000 --seed 0 --timeout defeat
    python scripts/boss_train.py ladder            # the hand-written players, through the same scorer
    python scripts/boss_train.py race              # the whole head-to-head, one run after another
    python scripts/boss_train.py report            # every result JSON so far, as a table
    python scripts/boss_train.py probe             # what a trained duellist actually PRESSES
    python scripts/boss_train.py delays            # did it learn to WAIT out the held windups?
    python scripts/boss_train.py curve             # one run's whole curve + the ladder rungs
    python scripts/boss_train.py bench             # where a training second goes (run it alone)
    python scripts/boss_train.py devices           # is the GPU worth it? cpu vs cuda, same loops
    python scripts/boss_train.py export            # ship the trained net to public/ for the arena lab
    python scripts/boss_train.py version           # which copy is this? run it first on a new machine

Budgets are quoted in DECISIONS, not frames: the agent presses a button every 3 frames (R=3, the rate
measured on the `rate` sweep), so one decision costs 3 simulator frames and a 900-frame duel is 300
decisions. Runs write results/boss/<tag>.json.

WARNING: the environment loop is CPU-bound and the learners share one GPU. Do not run more than two
trainings at once.
"""
import argparse
import json
import pathlib
import re
import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "results" / "boss"


def load_setup(name="BOSS_SETUP"):
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
Duel, score, ladder = G["Duel"], G["score"], G["ladder"]
PLAYERS = dict(G["PLAYERS"])
N_ACTIONS, ACTION_NAMES = G["N_ACTIONS"], G["ACTION_NAMES"]
N_OBS = 27
REPEAT = 3

# --------------------------------------------------------------------------- what it can see
# obs() hands the network the boss's animation state outright: v[11..15] one-hot which move,
# v[16] how far into it, v[17..20] which segment it is in, v[22] reach, v[23] arc, v[24] whether
# that hitbox covers you right now. Fourteen of the twenty-seven floats, and between them they
# make "is this a windup or a delay" a lookup rather than a question.
#
# The masked view replaces all fourteen with a single flag -- a move is out -- and nothing else.
# A held windup and the delay that follows it then look identical, so the only way to tell them
# apart is to remember how long the move has been running. --stack supplies that memory.
MASK_DROP = tuple(list(range(11, 21)) + [22, 23, 24])
MASK_KEEP = tuple(i for i in range(N_OBS) if i not in MASK_DROP)
_KEEP = list(MASK_KEEP)


class View:
    """What the network is shown, between env.obs() and the first Linear."""

    def __init__(self, mode="full", stack=1):
        if mode not in ("full", "masked"):
            raise SystemExit("unknown view " + mode)
        self.mode, self.stack = mode, max(1, int(stack))
        self.base = N_OBS if mode == "full" else len(MASK_KEEP) + 1
        self.width = self.base * self.stack

    def one(self, v):
        if self.mode == "full":
            return v
        out = np.empty(self.base, np.float32)
        out[:len(_KEEP)] = v[_KEEP]
        # v[11..15] is the one-hot of which move is out, so .any() is exactly "a move is out"
        # without saying which one -- and v[16..20], the frame and the segment, are gone.
        out[-1] = 1.0 if v[11:16].any() else 0.0
        return out

    def label(self):
        return "%s x%d (%d floats in)" % (self.mode, self.stack, self.width)

    def suffix(self):
        return "" if (self.mode == "full" and self.stack == 1) else "_%s_x%d" % (self.mode, self.stack)


class Eyes:
    """One agent's rolling window over a View. Zero-padded at the start of a duel, so the first
    decisions honestly see nothing behind them."""

    def __init__(self, view):
        self.v = view
        self.buf = np.zeros(view.width, np.float32)

    def reset(self):
        self.buf[:] = 0.0

    def see(self, raw):
        b = self.v.base
        if self.v.stack > 1:
            self.buf[:-b] = self.buf[b:]          # slide the window back one slot
        self.buf[-b:] = self.v.one(raw)
        return self.buf.copy()


VIEW = View()


# --------------------------------------------------------------------------- the net
class MLP(nn.Module):
    """Two hidden layers of 256. The observation is 27 floats, so there is nothing to convolve."""

    def __init__(self, out, width=256):
        super().__init__()
        self.f = nn.Sequential(nn.Linear(VIEW.width, width), nn.ReLU(),
                               nn.Linear(width, width), nn.ReLU(),
                               nn.Linear(width, out))

    def forward(self, x):
        return self.f(x)


class ActorCritic(nn.Module):
    def __init__(self, width=128):
        super().__init__()
        self.body = nn.Sequential(nn.Linear(VIEW.width, width), nn.Tanh(),
                                  nn.Linear(width, width), nn.Tanh())
        self.pi = nn.Linear(width, N_ACTIONS)
        self.v = nn.Linear(width, 1)

    def forward(self, x):
        h = self.body(x)
        return self.pi(h), self.v(h).squeeze(-1)


# --------------------------------------------------------------------------- the loop
class Arena:
    """One decision = REPEAT frames with the same button held, exactly as score() does it."""

    def __init__(self, seed, **kw):
        self.kw = kw
        self.rng = np.random.default_rng(seed)
        self.env = Duel(seed=int(self.rng.integers(0, 10 ** 6)), **kw)
        self.eyes = Eyes(VIEW)

    def reset(self):
        self.env = Duel(seed=int(self.rng.integers(0, 10 ** 6)), **self.kw)
        self.eyes.reset()
        return self.eyes.see(self.env.obs())

    def step(self, a):
        r = 0.0
        for _ in range(REPEAT):
            o, ri, term, trunc, info = self.env.step(a)
            r += ri
            if term or trunc:
                return self.eyes.see(o), r, True, info
        return self.eyes.see(o), r, False, info


def greedy(net, device):
    """A policy in the shape score() wants: it is handed the env and returns a button.

    duel() calls this on the first frame of every decision and starts each duel at t == 0, which
    is the only signal available for clearing the window -- and it is an exact one."""
    eyes = Eyes(VIEW)

    def pol(env):
        if env.t == 0:
            eyes.reset()
        x = eyes.see(env.obs())
        with torch.no_grad():
            q = net(torch.as_tensor(x, dtype=torch.float32, device=device).unsqueeze(0))
            if isinstance(q, tuple):
                q = q[0]
            return int(q.argmax(1).item())
    return pol


def evaluate(net, device, n=200, **kw):
    r = score(greedy(net, device), n=n, seed0=1000, repeat=REPEAT, **kw)
    return r


def save(tag, payload):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / (tag + ".json")).write_text(json.dumps(payload, indent=1), encoding="utf-8")
    print("wrote", (OUT / (tag + ".json")).relative_to(ROOT))


def head(t):
    print()
    print(t)
    print("-" * len(t))


def row(label, r):
    return ("%-22s win %3d  die %3d  clk %3d | bossHP %6.1f  ownHP %6.1f | parry %5.2f  poise %5.2f "
            "swing %5.2f  hits %5.2f  guard%% %5.1f | G %7.2f"
            % (label, r["win"], r["die"], r["clock"], r["bhp"], r["php"], r["parries"],
               r["poise_breaks"], r["swings"], r["hits_taken"], r["guard_pct"], r["G"]))


def env_kw(a):
    kw = dict(timeout=a.timeout, reward=a.reward)
    if a.aggr is not None:
        kw["aggr"] = a.aggr
    if a.moves:
        kw["moves"] = [int(x) for x in a.moves.split(",")]
    return kw


# --------------------------------------------------------------------------- DQN
class Replay:
    def __init__(self, cap, device):
        self.o = np.zeros((cap, VIEW.width), np.float32)
        self.a = np.zeros(cap, np.int64)
        self.r = np.zeros(cap, np.float32)
        self.o2 = np.zeros((cap, VIEW.width), np.float32)
        self.d = np.zeros(cap, np.float32)
        self.cap, self.n, self.i = cap, 0, 0
        self.device = device

    def add(self, o, a, r, o2, d):
        i = self.i
        self.o[i], self.a[i], self.r[i], self.o2[i], self.d[i] = o, a, r, o2, d
        self.i = (i + 1) % self.cap
        self.n = min(self.n + 1, self.cap)

    def sample(self, k, rng):
        idx = rng.integers(0, self.n, k)
        t = lambda x: torch.as_tensor(x[idx], device=self.device)
        return t(self.o), t(self.a), t(self.r), t(self.o2), t(self.d)


def train_dqn(a):
    device = torch.device(a.device)
    torch.manual_seed(a.seed)
    rng = np.random.default_rng(a.seed)
    net, tgt = MLP(N_ACTIONS).to(device), MLP(N_ACTIONS).to(device)
    tgt.load_state_dict(net.state_dict())
    opt = torch.optim.Adam(net.parameters(), lr=a.lr)
    buf = Replay(a.buffer, device)
    kw = env_kw(a)
    # Several duels are stepped side by side, and NOT because the duel is slow: it is not, at
    # well over 100,000 frames a second on one core. It is because a decision costs one GPU round
    # and 16 of them in one batch cost about the same as one. See the "thousands of duels" page.
    envs = [Arena(a.seed * 1000 + i, **kw) for i in range(a.envs)]
    obs = np.stack([e.reset() for e in envs])
    curve, t0, step = [], time.time(), 0

    while step < a.decisions:
        frac = min(1.0, step / (a.explore * a.decisions))
        eps = 1.0 + frac * (a.eps_end - 1.0)
        with torch.no_grad():
            acts = net(torch.as_tensor(obs, device=device)).argmax(1).cpu().numpy()
        roll = rng.random(a.envs) < eps
        acts = np.where(roll, rng.integers(0, N_ACTIONS, a.envs), acts)
        nxt = []
        for i, e in enumerate(envs):
            o2, r, done, _ = e.step(int(acts[i]))
            buf.add(obs[i], int(acts[i]), r, o2, float(done))
            nxt.append(e.reset() if done else o2)
        obs = np.stack(nxt)
        prev, step = step, step + a.envs

        if step >= a.warmup:
            # one gradient step per `train_every` decisions collected, whatever the batch of envs is
            for _ in range(max(1, a.envs // a.train_every)):
                bo, ba, br, bo2, bd = buf.sample(a.batch, rng)
                with torch.no_grad():
                    y = br + a.gamma * (1 - bd) * tgt(bo2).max(1).values
                q = net(bo).gather(1, ba.unsqueeze(1)).squeeze(1)
                loss = F.smooth_l1_loss(q, y)
                opt.zero_grad(set_to_none=True)
                loss.backward()
                nn.utils.clip_grad_norm_(net.parameters(), 10.0)
                opt.step()
        if prev // a.target_every != step // a.target_every:
            tgt.load_state_dict(net.state_dict())

        if prev // a.eval_every != step // a.eval_every or step >= a.decisions:
            r_ = evaluate(net, device, n=a.eval_n, **kw)
            curve.append(dict(step=step, win=r_["win"], die=r_["die"], G=r_["G"], bhp=r_["bhp"],
                              php=r_["php"], parries=r_["parries"], poise=r_["poise_breaks"],
                              swings=r_["swings"], guard=r_["guard_pct"]))
            print("%8d dec  eps %.2f  %s  [%.1f min]"
                  % (step, eps, row("", r_).strip(), (time.time() - t0) / 60))
            sys.stdout.flush()
    return finish(a, "dqn", net, device, curve, t0, kw)


# --------------------------------------------------------------------------- PPO
def train_ppo(a):
    device = torch.device(a.device)
    torch.manual_seed(a.seed)
    net = ActorCritic().to(device)
    opt = torch.optim.Adam(net.parameters(), lr=a.lr)
    kw = env_kw(a)
    envs = [Arena(a.seed * 1000 + i, **kw) for i in range(a.envs)]
    obs = np.stack([e.reset() for e in envs])
    T = a.rollout
    curve, t0, step = [], time.time(), 0

    while step < a.decisions:
        O = np.zeros((T, a.envs, VIEW.width), np.float32)
        A = np.zeros((T, a.envs), np.int64)
        LP = np.zeros((T, a.envs), np.float32)
        R = np.zeros((T, a.envs), np.float32)
        D = np.zeros((T, a.envs), np.float32)
        V = np.zeros((T + 1, a.envs), np.float32)
        for t in range(T):
            with torch.no_grad():
                logits, v = net(torch.as_tensor(obs, device=device))
                dist = torch.distributions.Categorical(logits=logits)
                act = dist.sample()
                lp = dist.log_prob(act)
            O[t], A[t], LP[t], V[t] = obs, act.cpu().numpy(), lp.cpu().numpy(), v.cpu().numpy()
            nxt = []
            for i, e in enumerate(envs):
                o2, r, done, _ = e.step(int(A[t, i]))
                R[t, i], D[t, i] = r, float(done)
                nxt.append(e.reset() if done else o2)
            obs = np.stack(nxt)
            step += a.envs
        with torch.no_grad():
            V[T] = net(torch.as_tensor(obs, device=device))[1].cpu().numpy()

        adv = np.zeros((T, a.envs), np.float32)
        last = np.zeros(a.envs, np.float32)
        for t in reversed(range(T)):
            nonterm = 1.0 - D[t]
            delta = R[t] + a.gamma * V[t + 1] * nonterm - V[t]
            last = delta + a.gamma * a.lam * nonterm * last
            adv[t] = last
        ret = adv + V[:T]

        bo = torch.as_tensor(O.reshape(-1, VIEW.width), device=device)
        ba = torch.as_tensor(A.reshape(-1), device=device)
        blp = torch.as_tensor(LP.reshape(-1), device=device)
        badv = torch.as_tensor(adv.reshape(-1), device=device)
        bret = torch.as_tensor(ret.reshape(-1), device=device)
        badv = (badv - badv.mean()) / (badv.std() + 1e-8)
        n = bo.shape[0]
        for _ in range(a.epochs):
            perm = torch.randperm(n, device=device)
            for s in range(0, n, a.batch):
                idx = perm[s:s + a.batch]
                logits, v = net(bo[idx])
                dist = torch.distributions.Categorical(logits=logits)
                ratio = torch.exp(dist.log_prob(ba[idx]) - blp[idx])
                l1 = ratio * badv[idx]
                l2 = torch.clamp(ratio, 1 - a.clip, 1 + a.clip) * badv[idx]
                loss = (-torch.min(l1, l2).mean()
                        + 0.5 * F.mse_loss(v, bret[idx])
                        - a.entropy * dist.entropy().mean())
                opt.zero_grad(set_to_none=True)
                loss.backward()
                nn.utils.clip_grad_norm_(net.parameters(), 0.5)
                opt.step()

        if step % a.eval_every < a.envs * T or step >= a.decisions:
            r_ = evaluate(net, device, n=a.eval_n, **kw)
            curve.append(dict(step=step, win=r_["win"], die=r_["die"], G=r_["G"], bhp=r_["bhp"],
                              php=r_["php"], parries=r_["parries"], poise=r_["poise_breaks"],
                              swings=r_["swings"], guard=r_["guard_pct"]))
            print("%8d dec  %s  [%.1f min]" % (step, row("", r_).strip(), (time.time() - t0) / 60))
            sys.stdout.flush()
    return finish(a, "ppo", net, device, curve, t0, kw)


# --------------------------------------------------------------------------- shipping the policy
LAYERS = ("f.0.weight", "f.0.bias", "f.2.weight", "f.2.bias", "f.4.weight", "f.4.bias")


def export(a):
    """Write the trained net where the browser can fetch it, plus a case file to check it by.

    The weights go out as raw little-endian float32 in the order above -- not base64, not
    quantised -- so the policy the reader watches in the arena lab is bit-for-bit the policy
    that scored 200/200 here, and nothing has to be argued about rounding.
    """
    import hashlib

    tag = a.tag or "dqn_2000k_s0"
    p = OUT / (tag + ".pt")
    if not p.exists():
        raise SystemExit("no net at %s -- train one first" % p)
    device = torch.device("cpu")
    net = MLP(N_ACTIONS).to(device)
    net.load_state_dict(torch.load(p, map_location=device))
    net.eval()

    sd = net.state_dict()
    blob = b"".join(sd[k].detach().numpy().astype("<f4").tobytes() for k in LAYERS)
    n_par = sum(sd[k].numel() for k in LAYERS)
    pub = ROOT / "public" / "boss"
    pub.mkdir(parents=True, exist_ok=True)
    (pub / (tag + ".bin")).write_bytes(blob)

    res = json.loads((OUT / (tag + ".json")).read_text(encoding="utf-8"))
    man = dict(tag=tag, obs=N_OBS, actions=N_ACTIONS, repeat=REPEAT,
               layers=[dict(name=k, shape=list(sd[k].shape)) for k in LAYERS],
               params=int(n_par), bytes=len(blob), sha1=hashlib.sha1(blob).hexdigest(),
               actionNames=list(ACTION_NAMES),
               decisions=res["decisions"], minutes=res["minutes"],
               final={k: res["final"][k] for k in ("win", "die", "n", "php", "bhp", "parries",
                                                   "poise_breaks", "swings", "hits_taken", "G")})
    (pub / (tag + ".json")).write_text(json.dumps(man, indent=1), encoding="utf-8")
    print("wrote public/boss/%s.bin  %d params, %d bytes, sha1 %s"
          % (tag, n_par, len(blob), man["sha1"][:12]))

    # A case file: real states off real duels, the observation the shipped world builds from each,
    # and what torch says the Q-values are. scripts/boss_policy_check.mjs replays all three
    # through the TypeScript port -- so a drift in obs() is caught, not just one in the matmuls.
    #
    # The names on the left are the Python fields; the names on the right are what duelSim.ts
    # calls them. Keeping the mapping here, next to the code that reads it, is the point.
    STATE = [("px", "px"), ("pz", "pz"), ("bx", "bx"), ("bz", "bz"), ("bang", "bang"),
             ("php", "php"), ("bhp", "bhp"), ("pst", "pst"), ("pa", "pa"), ("pf", "pf"),
             ("p_stun", "pStun"), ("guarding", "guarding"), ("bm", "bm"), ("bf", "bf"),
             ("b_stagger", "bStagger"), ("b_poise", "bPoise"), ("t", "t"), ("clock", "clock")]
    pol, obs_rows, states = greedy(net, device), [], []
    for seed in range(1000, 1000 + a.case_duels):
        e = Duel(seed=seed, **env_kw(a))
        act, k = 0, 0
        while True:
            if e.t % REPEAT == 0:
                if k % a.case_every == 0:
                    obs_rows.append(e.obs().tolist())
                    states.append({ts: (int(v) if isinstance(v, (bool, np.bool_)) else float(v))
                                   for py, ts in STATE for v in [getattr(e, py)]})
                act, k = pol(e), k + 1
            _, _, term, trunc, _ = e.step(act)
            if term or trunc:
                break
    O = np.asarray(obs_rows, np.float32)
    with torch.no_grad():
        Q = net(torch.as_tensor(O)).numpy()
    (ROOT / "results" / "boss_policy_case.json").write_text(
        json.dumps(dict(tag=tag, sha1=man["sha1"], obsWidth=N_OBS, actions=N_ACTIONS,
                        state=states,
                        obs=[[round(float(x), 9) for x in r] for r in O],
                        q=[[round(float(x), 6) for x in r] for r in Q]), indent=0),
        encoding="utf-8")
    print("wrote results/boss_policy_case.json  %d states + observations off %d held-out duels"
          % (len(O), a.case_duels))
    print("now: node scripts/boss_policy_check.mjs")


# --------------------------------------------------------------------------- results
def finish(a, algo, net, device, curve, t0, kw):
    r = evaluate(net, device, n=200, **kw)
    tag = a.tag or ("%s_%dk_s%d%s%s" % (algo, a.decisions // 1000, a.seed,
                                        "" if a.timeout == "truncate" else "_" + a.timeout,
                                        VIEW.suffix()))
    payload = dict(algo=algo, seed=a.seed, decisions=a.decisions, timeout=a.timeout,
                   obs=VIEW.mode, stack=VIEW.stack,
                   reward=a.reward, aggr=a.aggr, moves=a.moves, minutes=(time.time() - t0) / 60,
                   final={k: float(v) for k, v in r.items()}, curve=curve)
    save(tag, payload)
    torch.save(net.state_dict(), OUT / (tag + ".pt"))
    print(row(tag, r))
    return payload


def load_net(tag, device):
    """Load a net AND the view it was trained behind. A masked x16 net has 240 inputs and a full
    one has 27, so guessing wrong is a shape error at best and a silent nonsense at worst."""
    global VIEW
    p = OUT / (tag + ".pt")
    if not p.exists():
        raise SystemExit("no net at " + str(p))
    j = OUT / (tag + ".json")
    if j.exists():
        d = json.loads(j.read_text(encoding="utf-8"))
        VIEW = View(d.get("obs", "full"), d.get("stack", 1))
    net = MLP(N_ACTIONS).to(device)
    net.load_state_dict(torch.load(p, map_location=device))
    net.eval()
    return net


def do_ladder(a):
    print("the hand-written players, through the same scorer the learners are graded by")
    for name, pol in G["PLAYERS"]:
        print(row(name, score(pol, n=a.eval_n, seed0=1000, repeat=REPEAT, **env_kw(a))))


def race(a):
    for seed in range(a.seeds):
        for algo in ("dqn", "ppo"):
            b = argparse.Namespace(**vars(a))
            b.seed, b.tag = seed, None
            print("\n=== %s seed %d, %d decisions ===" % (algo, seed, a.decisions))
            (train_dqn if algo == "dqn" else train_ppo)(b)


def report(a):
    rows = []
    for p in sorted(OUT.glob("*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        if "final" in d:
            rows.append((p.stem, d))
    if not rows:
        raise SystemExit("no results yet in " + str(OUT))
    for tag, d in rows:
        print(row("%-22s" % tag, d["final"]), " [%.1f min]" % d.get("minutes", 0))


def probe(a):
    """What does a trained duellist actually press? Buttons, by share of decisions."""
    device = torch.device(a.device)
    net = load_net(a.tag or "dqn_2000k_s0", device)
    A_ATK, A_PARRY, A_ROLL0 = G["A_ATK"], G["A_PARRY"], G["A_ROLL0"]
    ATK_COST, PARRY_COST, ROLL_COST = G["ATK_COST"], G["PARRY_COST"], G["ROLL_COST"]

    def cost_of(act):
        if act == A_ATK:
            return ATK_COST
        if act == A_PARRY:
            return PARRY_COST
        if A_ROLL0 <= act <= A_ROLL0 + 3:
            return ROLL_COST
        return 0.0

    counts = np.zeros(N_ACTIONS)
    started = np.zeros(N_ACTIONS)        # read on some frame of the decision, and affordable
    committed = np.zeros(N_ACTIONS)      # dropped: committed for all three frames
    broke = np.zeros(N_ACTIONS)          # dropped: free at some point, could not pay
    pol = greedy(net, device)
    swings = rolls = 0.0
    for i in range(a.eval_n):
        e = Duel(seed=1000 + i, **env_kw(a))
        act, done = 0, False
        while not done:
            act = pol(e)
            counts[act] += 1
            # A decision holds one button for REPEAT frames and step() reads it on each of
            # them, so the press lands on the first frame the player is free -- not only on
            # the frame the decision was made.
            outcome = "committed"
            for _ in range(REPEAT):
                if outcome != "started" and not e.busy:
                    outcome = "started" if e.pst >= cost_of(act) else "poor"
                _, _, term, trunc, _ = e.step(act)
                if term or trunc:
                    done = True
                    break
            {"started": started, "committed": committed, "poor": broke}[outcome][act] += 1
        swings += e.log["swings"]
        rolls += e.log["rolls"]
    share = 100.0 * counts / counts.sum()
    head("what it presses, over %d held-out duels" % a.eval_n)
    print("  button                 share of decisions")
    for i in np.argsort(-share):
        if share[i] >= 0.05:
            print("    %-20s %7.2f%%" % (ACTION_NAMES[i], share[i]))

    head("...and what the world did with those presses")
    print("  A press is not an action. Section 1 of step() reads it only if you are not already")
    print("  committed, and the attack, roll and parry branches read it only if you can pay for")
    print("  it. Everything else is dropped on the floor. Per duel:")
    print()
    print("  %-14s %7s %8s %11s %11s" %
          ("button", "presses", "started", "committed", "too poor"))
    order = [i for i in np.argsort(-counts) if counts[i] > 0]
    for i in order:
        if counts[i] / a.eval_n < 0.5:
            continue
        print("  %-14s %7.1f %8.2f %11.1f %11.1f"
              % (ACTION_NAMES[i], counts[i] / a.eval_n, started[i] / a.eval_n,
                 committed[i] / a.eval_n, broke[i] / a.eval_n))
    roll = slice(A_ROLL0, A_ROLL0 + 4)
    print()
    print("  check: the two columns the shipped log also counts, which must agree ->")
    print("    attack  started %6.2f   log swings %6.2f   %s"
          % (started[A_ATK] / a.eval_n, swings / a.eval_n,
             "ok" if abs(started[A_ATK] - swings) < 1e-9 else "MISMATCH"))
    print("    roll    started %6.2f   log rolls  %6.2f   %s"
          % (started[roll].sum() / a.eval_n, rolls / a.eval_n,
             "ok" if abs(started[roll].sum() - rolls) < 1e-9 else "MISMATCH"))
    print()
    print("  Rolls are the extreme case: %.1f presses a duel and %.2f rolls started, because a"
          % (counts[roll].sum() / a.eval_n, started[roll].sum() / a.eval_n))
    print("  roll costs %.0f stamina and this policy has already spent it on attacks and parries."
          % ROLL_COST)
    print("  It is not choosing not to roll -- it is asking to, constantly, and being refused.")


def curve(a):
    """One run's whole learning curve, plus the ladder rungs it has to be placed between.

    The curve is the point: a single end-of-run number misreports a non-monotone run in
    whichever direction the last evaluation happened to land.
    """
    tag = a.tag or "dqn_2000k_s0"
    p = OUT / (tag + ".json")
    if not p.exists():
        raise SystemExit("no run at " + str(p))
    d = json.loads(p.read_text(encoding="utf-8"))
    head = "%s -- %s, seed %d, %s reward, clock = %s, %.0f min" % (
        tag, d["algo"].upper(), d["seed"], d["reward"], d["timeout"], d["minutes"])
    print(head)
    print("-" * len(head))
    print("  decisions   win%    ownHP  parries  poise  swings  guard%        G   (100 held-out duels)")
    for c in d["curve"]:
        print("  %9d %6.1f %7.1f %8.2f %6.2f %7.2f %7.1f %7.2f"
              % (c["step"], c["win"], c["php"], c["parries"], c["poise"], c["swings"],
                 c["guard"], c["G"]))
    print()
    print("  and the full 200 held-out duels at the end, beside the rungs it sits between:")
    f = d["final"]
    print("  %-18s %4.0f %4.0f %4.0f %7.1f %6.1f %6.2f %6.2f %6.2f %5.2f %6.1f %8.2f"
          % ("THE TRAINED NET", f["win"], f["die"], f["clock"], f["bhp"], f["php"],
             f["parries"], f["poise_breaks"], f["swings"], f["hits_taken"],
             f["guard_pct"], f["G"]))
    for name in ("hold guard", "sidestep, punish", "parry oracle", "patient parry"):
        r = score(PLAYERS[name], n=200, seed0=1000, repeat=REPEAT,
                  timeout=d["timeout"], reward=d["reward"])
        print("  %-18s %4d %4d %4d %7.1f %6.1f %6.2f %6.2f %6.2f %5.2f %6.1f %8.2f"
              % (name, r["win"], r["die"], r["clock"], r["bhp"], r["php"], r["parries"],
                 r["poise_breaks"], r["swings"], r["hits_taken"], r["guard_pct"], r["G"]))
    print("  %-18s %4s %4s %4s %7s %6s %6s %6s %6s %5s %6s %8s"
          % ("", "win", "die", "clk", "bossHP", "ownHP", "parry", "poise", "swing",
             "hits", "guard%", "G"))


def delays(a):
    """Did it learn to WAIT? Two probes, both of which the scripted expert also sits.

    1. When it presses a defensive button, how many frames away is the hitbox? A policy that has
       learned the animation clock presses at the same notice for every move. One that is reacting
       to the raised weapon presses early on exactly the two moves that hold the pose.
    2. What does it do DURING the delay frames, compared with during the windup?
    """
    device = torch.device(a.device)
    frames_to_active, phase_at = G["frames_to_active"], G["phase_at"]
    will_connect = G["will_connect"]
    MOVES, A_PARRY, A_ROLL0 = G["MOVES"], G["A_PARRY"], G["A_ROLL0"]
    kw = env_kw(a)

    def probe(label, pol):
        # Two buckets, because the scripted players only ever press when the attack could
        # actually reach them (`will_connect`). Counting a network's presses made at a safe
        # distance against that would be comparing two different questions.
        notice = {m["name"]: ([], []) for m in MOVES}      # (all presses, presses that mattered)
        byphase = {k: np.zeros(N_ACTIONS) for k in ("w", "d", "h", "r")}
        for i in range(a.eval_n):
            e, act = Duel(seed=1000 + i, **kw), 0
            while True:
                if e.t % REPEAT == 0:
                    act = pol(e)
                    if e.bm >= 0 and e.b_stagger == 0:
                        byphase[phase_at(MOVES[e.bm], e.bf)[0]][act] += 1
                        k = frames_to_active(e)
                        if k is not None and (act == A_PARRY or A_ROLL0 <= act <= A_ROLL0 + 3):
                            notice[MOVES[e.bm]["name"]][0].append(k)
                            if will_connect(e):
                                notice[MOVES[e.bm]["name"]][1].append(k)
                _, _, term, trunc, _ = e.step(act)
                if term or trunc:
                    break
        print()
        print(label)
        print("-" * len(label))
        print("  move                 defensive presses    notice, in frames to the hitbox")
        print("                                          mean   median   inside 3-12")
        n_all = n_hot = 0
        for m in MOVES:
            allv, hot = (np.array(x) for x in notice[m["name"]])
            n_all, n_hot = n_all + allv.size, n_hot + hot.size
            tag = "(delayed)" if any(k == "d" for k, _ in m["seg"]) else "         "
            if allv.size == 0:
                print("  %-7s %s %14d" % (m["name"], tag, 0))
                continue
            print("  %-7s %s %14d %11.1f %7.0f %11.0f%%"
                  % (m["name"], tag, allv.size, allv.mean(), np.median(allv),
                     100 * np.mean((allv >= 3) & (allv <= 12))))
        print("  (%.0f%% of those presses were made while the attack could actually have reached it,"
              % (100.0 * n_hot / max(n_all, 1)))
        print("   so this is not a policy pressing buttons at a safe distance.)")
        print("  what it presses, by the phase the boss is in:")
        for k, name in (("w", "windup"), ("d", "DELAY "), ("h", "active"), ("r", "recovery")):
            tot = byphase[k].sum()
            if tot == 0:
                continue
            top = np.argsort(-byphase[k])[:3]
            print("    %-9s %6.0f decisions   %s" % (name, tot, "   ".join(
                "%s %.0f%%" % (ACTION_NAMES[j], 100 * byphase[k][j] / tot) for j in top)))

    tag = a.tag or "dqn"
    if (OUT / (tag + ".pt")).exists():
        net = load_net(tag, device)
        probe("the trained duellist (%s, %s)" % (tag, VIEW.label()), greedy(net, device))
    else:
        print("no net at %s -- probing the scripted players only" % (OUT / (tag + ".pt")))
    probe("patient parry (the ceiling)", PLAYERS["patient parry"])
    probe("sidestep, punish (the best non-parrier)", PLAYERS["sidestep, punish"])


def _delay_stats(pol, n, kw):
    """Per-move notice in frames, and the action distribution in each phase of a boss move."""
    frames_to_active, phase_at = G["frames_to_active"], G["phase_at"]
    will_connect = G["will_connect"]
    MOVES, A_PARRY, A_ROLL0 = G["MOVES"], G["A_PARRY"], G["A_ROLL0"]
    notice = {m["name"]: [] for m in MOVES}
    byphase = {k: np.zeros(N_ACTIONS) for k in ("w", "d", "h", "r")}
    for i in range(n):
        e, act = Duel(seed=1000 + i, **kw), 0
        while True:
            if e.t % REPEAT == 0:
                act = pol(e)
                if e.bm >= 0 and e.b_stagger == 0:
                    byphase[phase_at(MOVES[e.bm], e.bf)[0]][act] += 1
                    k = frames_to_active(e)
                    defensive = act == A_PARRY or A_ROLL0 <= act <= A_ROLL0 + 3
                    if k is not None and defensive and will_connect(e):
                        notice[MOVES[e.bm]["name"]].append(k)
            _, _, term, trunc, _ = e.step(act)
            if term or trunc:
                break
    return notice, byphase


def _tv(p, q):
    """Total-variation distance between two action distributions. 0 = indistinguishable."""
    ps, qs = p.sum(), q.sum()
    if ps == 0 or qs == 0:
        return float("nan")
    return 0.5 * float(np.abs(p / ps - q / qs).sum())


def ablate(a):
    """Did it LEARN the delayed attack, or was it handed it?

    v[17..20] of the observation names the segment the boss is in, so a full-view agent is told
    outright whether it is looking at a windup or at the delay that follows one. Retrain behind a
    view that hides it -- one flag saying a move is out, nothing more -- and the same question has
    to be answered from memory instead. --stack is that memory.

        python scripts/boss_train.py dqn --decisions 2000000 --seed 0
        python scripts/boss_train.py dqn --decisions 2000000 --seed 0 --obs masked --stack 1
        python scripts/boss_train.py dqn --decisions 2000000 --seed 0 --obs masked --stack 16
        python scripts/boss_train.py ablate --tags dqn_2000k_s0,dqn_2000k_s0_masked_x1,...
    """
    global VIEW
    device = torch.device(a.device)
    kw = env_kw(a)
    MOVES = G["MOVES"]
    delayed = [m["name"] for m in MOVES if any(k == "d" for k, _ in m["seg"])]
    plain = [m["name"] for m in MOVES if m["name"] not in delayed]

    arms = []
    for tag in [t.strip() for t in (a.tags or "dqn_2000k_s0").split(",") if t.strip()]:
        net = load_net(tag, device)                  # this sets VIEW to the one it was trained behind
        arms.append((tag, VIEW.label(), greedy(net, device)))
    VIEW = View()
    arms.append(("patient parry", "hand-written, reads the clock directly", PLAYERS["patient parry"]))

    head("the delayed attack: learned, or handed over?")
    print("  %d held-out duels each. heavy and slam hold a finished-looking windup for 8 and 12"
          % a.eval_n)
    print("  frames; the other three do not. TV is how differently a policy behaves during a delay")
    print("  than during a windup -- 0.00 means it cannot tell the two apart.")
    print()
    print("  %-34s %4s %4s %7s %6s %8s %8s"
          % ("arm", "win", "die", "bossHP", "TV", "notice: delayed", "plain"))
    rows = []
    for tag, label, pol in arms:
        r = score(pol, n=a.eval_n, seed0=1000, repeat=REPEAT, **kw)
        notice, byphase = _delay_stats(pol, a.eval_n, kw)
        tv = _tv(byphase["w"], byphase["d"])
        nd = [k for m in delayed for k in notice[m]]
        np_ = [k for m in plain for k in notice[m]]
        rows.append((tag, label, r, notice, byphase, tv))
        print("  %-34s %4d %4d %7.1f %6.2f %8s %8s"
              % (tag[:34], r["win"], r["die"], r["bhp"], tv,
                 ("%.1f" % np.mean(nd)) if nd else "--",
                 ("%.1f" % np.mean(np_)) if np_ else "--"))

    head("what each one presses, windup versus delay")
    for tag, label, r, notice, byphase, tv in rows:
        print()
        print("  %s -- %s" % (tag, label))
        for k, name in (("w", "windup"), ("d", "DELAY ")):
            tot = byphase[k].sum()
            if tot == 0:
                print("    %-9s none" % name)
                continue
            top = np.argsort(-byphase[k])[:3]
            print("    %-9s %6.0f decisions   %s" % (name, tot, "   ".join(
                "%s %.0f%%" % (ACTION_NAMES[j], 100 * byphase[k][j] / tot) for j in top)))
        print("    TV(windup, delay) %.3f" % tv)


LOOPS = ("the duel alone, random buttons, 1 at a time",
         "+ a network forward per decision, 1 duel",
         "+ the same forward over 16 duels at once",
         "+ half a gradient step per decision (DQN)")


def _loop_state(a, device):
    "Everything one device needs to run the benchmark loops."
    net, tgt = MLP(N_ACTIONS).to(device), MLP(N_ACTIONS).to(device)
    return dict(device=device, net=net, tgt=tgt, buf=Replay(50_000, device),
                opt=torch.optim.Adam(net.parameters(), lr=a.lr),
                rng=np.random.default_rng(0))


def _timed_loop(a, st, envs, use_net, grad):
    """ONE timed pass of a benchmark loop, returning decisions/s.

    Each loop adds exactly one layer to the one above it, so the gap between two of them is
    the cost of that layer and not of anything else.
    """
    device, net, tgt, buf, opt, rng = (st["device"], st["net"], st["tgt"], st["buf"],
                                       st["opt"], st["rng"])
    es = [Arena(i, timeout=a.timeout) for i in range(envs)]
    obs = np.stack([e.reset() for e in es])
    for _ in range(200 // envs + 1):                          # warm the caches and the buffer
        for i, e in enumerate(es):
            o2, r, d, _ = e.step(0)
            buf.add(obs[i], 0, r, o2, float(d))

    def policy(o):
        if not use_net:
            return rng.integers(0, N_ACTIONS, o.shape[0])
        with torch.no_grad():
            return net(torch.as_tensor(o, device=device)).argmax(1).cpu().numpy()

    t0, n = time.perf_counter(), 0
    while n < a.bench_n:
        acts = policy(obs)
        nxt = []
        for i, e in enumerate(es):
            o2, r, d, _ = e.step(int(acts[i]))
            buf.add(obs[i], int(acts[i]), r, o2, float(d))
            nxt.append(e.reset() if d else o2)
        obs = np.stack(nxt)
        n += envs
        for _ in range(grad * envs // 2):
            bo, ba, br, bo2, bd = buf.sample(a.batch, rng)
            with torch.no_grad():
                y = br + a.gamma * (1 - bd) * tgt(bo2).max(1).values
            q = net(bo).gather(1, ba.unsqueeze(1)).squeeze(1)
            loss = F.smooth_l1_loss(q, y)
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()
    return n / (time.perf_counter() - t0)


# (label, envs, uses the network, does gradient steps)
SPECS = [(LOOPS[0], 1, False, 0), (LOOPS[1], 1, True, 0),
         (LOOPS[2], 16, True, 0), (LOOPS[3], 16, True, 1)]


def _train_loops(a, device, show=True):
    "The four loops on one device, best of 3 -- what `bench` reports."
    st = _loop_state(a, device)
    out = {}
    for label, envs, use_net, grad in SPECS:
        best = max(_timed_loop(a, st, envs, use_net, grad) for _ in range(3))
        out[label] = best
        if show:
            print("  %-46s %9.0f decisions/s  %9.0f frames/s" % (label, best, best * REPEAT))
    return out


def _compare_loops(a):
    """The four loops on BOTH devices, with the reps interleaved.

    Interleaving is the whole point. Running every cpu rep and then every cuda rep makes the
    comparison a hostage to whatever else the machine did in between; alternating them puts
    the two measurements next to each other in time, so background load lands on both.
    """
    st = {n: _loop_state(a, torch.device(n)) for n in ("cpu", "cuda")}
    best = {n: {} for n in st}
    for label, envs, use_net, grad in SPECS:
        for n in st:
            best[n][label] = 0.0
        for _ in range(3):
            for n in ("cpu", "cuda"):
                best[n][label] = max(best[n][label],
                                     _timed_loop(a, st[n], envs, use_net, grad))
    return best["cpu"], best["cuda"]


def devices(a):
    """Is a GPU worth it for a net this small? Run the same four loops on both and see."""
    if not torch.cuda.is_available():
        raise SystemExit("no CUDA visible to torch on this machine -- nothing to compare against")
    print("does the GPU help? the same four loops on both devices, best of 3, %d decisions each"
          % a.bench_n)
    print("cpu vs %s" % torch.cuda.get_device_name(0))
    print("-" * 78)
    cpu, gpu = _compare_loops(a)
    print("  %-46s %9s %9s %9s" % ("", "cpu", "cuda", "speedup"))
    for k in LOOPS:
        print("  %-46s %9.0f %9.0f %8.2fx" % (k, cpu[k], gpu[k], gpu[k] / cpu[k]))
    print()
    print("  decisions/s. The bottom row is the one a real run is made of, so a 2,000,000-decision")
    print("  run costs about %.0f min of it on the cpu and %.0f min on the gpu, before evaluations."
          % (2e6 / cpu[LOOPS[3]] / 60, 2e6 / gpu[LOOPS[3]] / 60))
    ctrl = gpu[LOOPS[0]] / cpu[LOOPS[0]]
    print("  The top row is the duel itself and has no tensors in it, so it is the control: the")
    print("  two devices MUST agree there. This run: %.2fx -- %s" %
          (ctrl, "good, the table is readable" if 0.93 <= ctrl <= 1.07 else
           "TOO FAR FROM 1.00; the machine was busy, measure it again"))
    print("  (Reps are interleaved cpu/cuda/cpu/cuda so load lands on both sides equally. An")
    print("  earlier version timed all of one device and then the other, and the control row")
    print("  wandered between 0.84x and 1.49x run to run.)")

    # Rows 2-4 above are dominated by the Python env loop, so they cannot tell you whether the GPU
    # is slow or merely idle. Take the environment out entirely and time the tensor work alone.
    print()
    label = "the same question with the environment taken out: gradient steps a second"
    print(label)
    print("-" * len(label))
    print("  %-46s %9s %9s %9s" % ("batch", "cpu", "cuda", "speedup"))
    for batch in (256, 1024, 4096, 16384, 65536):
        c = g = 0.0
        for _ in range(2):                       # interleaved, for the same reason as above
            c = max(c, _grad_only(a, torch.device("cpu"), batch))
            g = max(g, _grad_only(a, torch.device("cuda"), batch))
        note = "  <- what this world trains at" if batch == a.batch else ""
        print("  %-46s %9.0f %9.0f %8.2fx%s"
              % (batch, c, g, g / c, note))
    print()
    print("  A gradient step on 256 rows of 27 floats is about a microsecond of arithmetic and")
    print("  several microseconds of launch overhead, so the launch wins. The GPU is not slow")
    print("  here; it is idle, waiting for work small enough that sending it costs more than")
    print("  doing it. The crossover is the number to remember, not the hardware.")
    _is_it_really_cuda(a)


# Published FP32 peaks, for putting a measured GFLOP/s in proportion. The integrated parts are
# here because "is it using my real GPU or the built-in one?" is the first thing anyone asks of
# a table where the GPU buys nothing.
PEAKS = {"GTX 1660 Ti": 5437, "Intel UHD 630 (integrated)": 400, "AMD Vega 8 (integrated)": 1100}


def _is_it_really_cuda(a):
    """The obvious objection to the table above is that cuda was never actually used.

    Watch a run in Task Manager and the card sits near zero, which looks exactly like a silent
    fall back to the CPU -- or to an integrated GPU, on the many machines that have both. These
    checks separate the explanations. A fallback cannot put weights on cuda:0, and no integrated
    part can do 4096-square matmuls at thousands of GFLOP/s.

    Note on utilisation: it is sampled and summarised with a MEDIAN. An earlier version of this
    printed the max, which reports 100% for a batch that is idle almost all of the time.
    """
    import statistics
    import subprocess

    dev = torch.device("cuda")
    label = "is it even on the GPU? (yes -- the dedicated one, and it is bored)"
    print()
    print(label)
    print("-" * len(label))

    try:
        out = subprocess.run(["powershell", "-NoProfile", "-Command",
                              "Get-CimInstance Win32_VideoController | "
                              "Select-Object -ExpandProperty Name"],
                             capture_output=True, text=True, timeout=60).stdout
        names = [ln.strip() for ln in out.splitlines() if ln.strip()]
        if names:
            print("  display adapters this machine has: %s" % ", ".join(names))
    except Exception:                                              # noqa: BLE001
        pass
    print("  adapters CUDA can address: %d, because CUDA runs on NVIDIA silicon and nothing else"
          % torch.cuda.device_count())
    for i in range(torch.cuda.device_count()):
        p = torch.cuda.get_device_properties(i)
        print("    cuda:%d  %s -- capability %d.%d, %d SMs, %.1f GB VRAM, pci bus %d"
              % (i, p.name, p.major, p.minor, p.multi_processor_count,
                 p.total_memory / 1e9, p.pci_bus_id))

    net = MLP(N_ACTIONS).to(dev)
    p0 = next(net.parameters())
    own = sum(p.numel() * p.element_size() for p in net.parameters())
    print("  the trainer's own MLP, built exactly as train_dqn builds it:")
    print("    f.0.weight %-12s device %s" % (tuple(p0.shape), p0.device))
    print("    %d parameters, %.1f KB of VRAM" % (sum(p.numel() for p in net.parameters()),
                                                  own / 1024))

    print("  the same card on work it IS big enough for -- 50 matmuls of 4096 squared:")
    for name in ("cpu", "cuda"):
        d = torch.device(name)
        x = torch.randn(4096, 4096, device=d)
        for _ in range(3):
            x @ x
        if name == "cuda":
            torch.cuda.synchronize()
        t0 = time.perf_counter()
        for _ in range(50):
            x @ x
        if name == "cuda":
            torch.cuda.synchronize()
        dt = time.perf_counter() - t0
        gf = 50 * 2 * 4096 ** 3 / dt / 1e9
        print("    %-5s %6.2f s   %7.0f GFLOP/s" % (name, dt, gf))
        if name == "cuda":
            print("    for proportion: %s" % "  ".join("%s ~%d" % kv for kv in PEAKS.items()))
            print("    -- a measured %.0f is out of reach of any integrated part by 10x." % gf)
        del x
    torch.cuda.empty_cache()

    print("  and what the card is doing while a gradient step of each size runs:")
    for batch in (a.batch, 4096, 65536):
        opt = torch.optim.Adam(net.parameters(), lr=a.lr)
        bo = torch.rand(batch, VIEW.width, device=dev)
        ba = torch.randint(0, N_ACTIONS, (batch,), device=dev)
        br = torch.rand(batch, device=dev)

        def once():
            q = net(bo).gather(1, ba.unsqueeze(1)).squeeze(1)
            loss = F.smooth_l1_loss(q, br)
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()

        for _ in range(10):
            once()
        torch.cuda.synchronize()
        t0, n, util = time.perf_counter(), 0, []
        while time.perf_counter() - t0 < 3.0:
            once()
            n += 1
            if n % 20 == 0:
                util.append(torch.cuda.utilization())
        torch.cuda.synchronize()
        smi = subprocess.run(["nvidia-smi", "--query-gpu=utilization.gpu",
                              "--format=csv,noheader"],
                             capture_output=True, text=True).stdout.strip().splitlines()
        print("    batch %-6d %6.0f steps/s   utilisation: torch median %3d%%, nvidia-smi %s"
              % (batch, n / (time.perf_counter() - t0),
                 statistics.median(util) if util else -1, smi[0] if smi else "n/a"))
        del bo, ba, br
    torch.cuda.empty_cache()
    print("  So the card is real, it is the dedicated one, it is being used -- and at the batch")
    print("  this world trains at it is mostly idle. A faster card would not shorten the run.")
    print("  (Task Manager shows the 3D engine by default and CUDA work lands on Compute_0, so")
    print("  a busy card can read 0% there. Change the graph dropdown, or use nvidia-smi.)")


def _grad_only(a, device, batch, steps=200):
    """One DQN gradient step, repeated, with no environment anywhere near it."""
    net, tgt = MLP(N_ACTIONS).to(device), MLP(N_ACTIONS).to(device)
    opt = torch.optim.Adam(net.parameters(), lr=a.lr)
    g = torch.Generator(device="cpu").manual_seed(0)
    bo = torch.rand(batch, VIEW.width, generator=g).to(device)
    bo2 = torch.rand(batch, VIEW.width, generator=g).to(device)
    ba = torch.randint(0, N_ACTIONS, (batch,), generator=g).to(device)
    br = torch.rand(batch, generator=g).to(device)
    bd = torch.zeros(batch, device=device)

    def once():
        with torch.no_grad():
            y = br + a.gamma * (1 - bd) * tgt(bo2).max(1).values
        q = net(bo).gather(1, ba.unsqueeze(1)).squeeze(1)
        loss = F.smooth_l1_loss(q, y)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        opt.step()

    for _ in range(20):                      # warm the allocator and any cuda kernels
        once()
    if device.type == "cuda":
        torch.cuda.synchronize()
    t0 = time.perf_counter()
    for _ in range(steps):
        once()
    if device.type == "cuda":
        torch.cuda.synchronize()
    return steps / (time.perf_counter() - t0)


def bench(a):
    """Where does a training second actually go? Four loops, each adding one layer."""
    device = torch.device(a.device)
    print("where a training second goes (best of 3, %s)" % a.device)
    print("-" * 78)
    _r = _train_loops(a, device)
    a_env, a_1, a_16, a_tr = (_r[k] for k in LOOPS)
    net, tgt = MLP(N_ACTIONS).to(device), MLP(N_ACTIONS).to(device)
    rng = np.random.default_rng(0)
    print()
    print("  the duel is %.0fx faster than the cheapest loop that trains on it, and batching the"
          % (a_env / max(a_tr, 1e-9)))
    print("  duels bought %.1fx -- not because the duels were slow, but because one GPU round trip"
          % (a_16 / max(a_1, 1e-9)))
    print("  costs about the same whether it carries 1 state or 16. The environment is not the")
    print("  bottleneck in this world, so it was never vectorised.")

    # The first row above is LOWER than `boss_cases.py speed`, and the difference is not the
    # duel -- it is the bookkeeping a learner needs around it. Take it apart rather than assert it.
    print()
    label = "why that first row is below what boss_cases.py speed reports"
    print(label)
    print("-" * len(label))
    buf2 = np.zeros((200_000, VIEW.width), np.float32)
    box = {"i": 0}

    def loop2(tag, policy, obs_call, store, stack):
        best = 0.0
        for _ in range(3):
            t0, n, e, act = time.perf_counter(), 0, Duel(seed=0), 0
            while n < 90_000:
                if e.t % REPEAT == 0:
                    if obs_call:
                        o = e.obs()
                        if store:
                            buf2[box["i"] % 200_000] = o
                            buf2[(box["i"] + 1) % 200_000] = o
                            box["i"] += 2
                        if stack:
                            np.stack([o])
                    act = policy(e)
                _, _, term, trunc, _ = e.step(act)
                n += 1
                if term or trunc:
                    e = Duel(seed=n)
            best = max(best, n / (time.perf_counter() - t0))
        print("  %-52s %8.0f frames/s" % (tag, best))
        return best

    scripted = PLAYERS["patient parry"]
    rand_pol = lambda e: int(rng.integers(0, N_ACTIONS))
    s0 = loop2("a scripted player, no obs, no buffer   (what speed times)", scripted, False, False, False)
    s1 = loop2("random buttons instead (they die early, so more resets)", rand_pol, False, False, False)
    s2 = loop2("+ an obs() every decision", rand_pol, True, False, False)
    s3 = loop2("+ the replay writes", rand_pol, True, True, False)
    s4 = loop2("+ stacking the batch", rand_pol, True, True, True)
    print("  steps:  x%.2f random play   x%.2f obs()   x%.2f replay   x%.2f stack   = x%.2f overall"
          % (s1 / s0, s2 / s1, s3 / s2, s4 / s3, s4 / s0))
    print("  so the duel did not get slower -- a learner just needs more done per frame than a")
    print("  scripted player does, and the rest of the gap is the batching wrapper itself.")


def version(a):
    import hashlib
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const BOSS_SETUP = `(.*?)\n`;", src, re.S)
    print("boss_train.py   ", hashlib.sha1(pathlib.Path(__file__).read_bytes()).hexdigest()[:12])
    print("BOSS_SETUP      ", hashlib.sha1(m.group(1).encode()).hexdigest()[:12],
          "(%d lines)" % m.group(1).count("\n"))
    print("torch           ", torch.__version__, "cuda", torch.cuda.is_available())
    print("observation     ", N_OBS, "floats ·", N_ACTIONS, "actions · one decision =", REPEAT, "frames")
    print("view            ", VIEW.label(),
          "" if VIEW.mode == "full" else "-- hides which move, how far into it, and its geometry")


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cmd", choices=["dqn", "ppo", "ladder", "race", "report", "probe", "delays",
                                   "curve", "bench", "devices", "export", "version", "ablate"])
    p.add_argument("--decisions", type=int, default=1_000_000)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--seeds", type=int, default=3)
    p.add_argument("--timeout", default="truncate", choices=["truncate", "defeat"])
    p.add_argument("--reward", default="damage", choices=["damage", "trade", "survive"])
    p.add_argument("--aggr", type=float, default=None)
    p.add_argument("--moves", default=None, help="comma-separated move indices, for the curriculum")
    p.add_argument("--tag", default=None)
    p.add_argument("--obs", default="full", choices=["full", "masked"],
                   help="masked hides which boss move is out, how far into it, and its geometry")
    p.add_argument("--stack", type=int, default=1,
                   help="show the network the last N observations instead of one")
    p.add_argument("--tags", default=None, help="comma-separated tags, for ablate")
    p.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    p.add_argument("--lr", type=float, default=3e-4)
    p.add_argument("--gamma", type=float, default=0.99)
    p.add_argument("--eval-every", type=int, default=50_000)
    p.add_argument("--eval-n", type=int, default=100)
    # DQN
    p.add_argument("--buffer", type=int, default=300_000)
    p.add_argument("--batch", type=int, default=256)
    p.add_argument("--warmup", type=int, default=5_000)
    p.add_argument("--train-every", type=int, default=2)
    p.add_argument("--target-every", type=int, default=2_000)
    p.add_argument("--explore", type=float, default=0.4, help="fraction of the budget spent decaying eps")
    p.add_argument("--eps-end", type=float, default=0.05)
    # PPO
    p.add_argument("--envs", type=int, default=16)
    p.add_argument("--rollout", type=int, default=256)
    p.add_argument("--epochs", type=int, default=4)
    p.add_argument("--lam", type=float, default=0.95)
    p.add_argument("--clip", type=float, default=0.2)
    p.add_argument("--entropy", type=float, default=0.01)
    p.add_argument("--bench-n", type=int, default=4_000, help="decisions per timed loop")
    # export
    p.add_argument("--case-duels", type=int, default=12, help="held-out duels to sample the case file from")
    p.add_argument("--case-every", type=int, default=4, help="record every Nth decision")
    a = p.parse_args(argv)
    global VIEW
    VIEW = View(a.obs, a.stack)
    dict(dqn=train_dqn, ppo=train_ppo, ladder=do_ladder, race=race, report=report,
         probe=probe, delays=delays, curve=curve, bench=bench, devices=devices,
         export=export, version=version, ablate=ablate)[a.cmd](a)


if __name__ == "__main__":
    main()
