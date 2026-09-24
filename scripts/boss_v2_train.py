"""Train a duellist for the v2 world -- eleven moves, a six-frame parry that wears out.

    python scripts/boss_v2_train.py version                     what am I about to train against
    python scripts/boss_v2_train.py dqn --decisions 2000000     the run
    python scripts/boss_v2_train.py probe --tag v2_dqn_2000k_s0 what it actually does

This is a SEPARATE trainer from scripts/boss_train.py on purpose. That one is the script that
produced every published World 3 number against the frozen BOSS_SETUP, and it stays byte-stable
so those numbers stay reproducible by exactly the script that made them. Nothing here imports it.

The environment is not re-implemented here either. It is extracted from src/lib/runtimeSetup.ts
exactly the way the browser runs it, so the trainer and the reader are looking at one world.
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
OUT = ROOT / "results" / "boss_v2"


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
Duel, score, ladder_fn = G["Duel"], G["score"], G["ladder"]
PLAYERS = dict(G["PLAYERS"])
N_ACTIONS, ACTION_NAMES, N_OBS = G["N_ACTIONS"], G["ACTION_NAMES"], G["N_OBS"]
MOVES, N_MOVES = G["MOVES"], G["N_MOVES"]
REPEAT = 3


class MLP(nn.Module):
    """Two hidden layers of 256, exactly as v1. The observation is 38 floats now instead of 27,
    which is not a reason to change the network -- keeping it identical is what makes the two
    worlds comparable at all."""

    def __init__(self, out, width=256):
        super().__init__()
        self.f = nn.Sequential(nn.Linear(N_OBS, width), nn.ReLU(),
                               nn.Linear(width, width), nn.ReLU(),
                               nn.Linear(width, out))

    def forward(self, x):
        return self.f(x)


class Arena:
    """One decision = REPEAT frames with the same button held, exactly as score() does it."""

    def __init__(self, seed, **kw):
        self.kw = kw
        self.rng = np.random.default_rng(seed)
        self.env = Duel(seed=int(self.rng.integers(0, 10 ** 6)), **kw)

    def reset(self):
        self.env = Duel(seed=int(self.rng.integers(0, 10 ** 6)), **self.kw)
        return self.env.obs()

    def step(self, a):
        r = 0.0
        for _ in range(REPEAT):
            o, ri, term, trunc, info = self.env.step(a)
            r += ri
            if term or trunc:
                return o, r, True, info
        return o, r, False, info


def greedy(net, device):
    """A policy in the shape score() wants: handed the env, returns a button."""
    def pol(env):
        x = env.obs()
        with torch.no_grad():
            q = net(torch.as_tensor(x, dtype=torch.float32, device=device).unsqueeze(0))
            return int(q.argmax(1).item())
    return pol


def env_kw(a):
    kw = dict(timeout=a.timeout, reward=a.reward,
              poise_max=a.poise_max, poise_hit2=a.poise_hit2)
    if a.aggr is not None:
        kw["aggr"] = a.aggr
    if a.moves:
        kw["moves"] = [int(x) for x in a.moves.split(",")]
    return kw


def evaluate(net, device, n=200, **kw):
    return score(greedy(net, device), n=n, seed0=1000, repeat=REPEAT, **kw)


def row(tag, r):
    return ("%-10s win %3d  die %3d  clk %3d | bossHP %6.1f  ownHP %6.1f | "
            "parry %4.2f/%4.2f (%4.1f%%) mash %4.2f dead %4.2f | poise %4.2f hits %4.2f "
            "erupt %4.2f | G %7.2f"
            % (tag, r["win"], r["die"], r["clock"], r["bhp"], r["php"],
               r["parries"], r["parry_presses"], r["parry_pct"], r["parry_mashes"],
               r["parry_dead"], r["poise_breaks"], r["hits_taken"], r["erupt_taken"], r["G"]))


# --------------------------------------------------------------------------- DQN
class Replay:
    def __init__(self, cap, device):
        self.o = np.zeros((cap, N_OBS), np.float32)
        self.a = np.zeros(cap, np.int64)
        self.r = np.zeros(cap, np.float32)
        self.o2 = np.zeros((cap, N_OBS), np.float32)
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
        def t(x):
            return torch.as_tensor(x[idx], device=self.device)
        return t(self.o), t(self.a), t(self.r), t(self.o2), t(self.d)


def world_sha1():
    """The sha1 of the world this trainer just extracted, recorded into every run's json so
    "which world did this number come from" is answerable rather than inferable. This repo has
    had three v2 world hashes in a single day and two earlier Colab batches came back from a
    stale trainer; n_obs happened to identify the world this time, which was luck."""
    import hashlib
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const BOSS_SETUP_V2 = `(.*?)\n`;", src, re.S)
    return hashlib.sha1(m.group(1).encode()).hexdigest()[:12]


def train_dqn(a):
    device = torch.device(a.device)
    torch.manual_seed(a.seed)
    rng = np.random.default_rng(a.seed)
    net, tgt = MLP(N_ACTIONS).to(device), MLP(N_ACTIONS).to(device)
    curve, t0, step = [], time.time(), 0
    if a.resume:
        # Weights and the step counter come back; the replay buffer does NOT. Training restarts
        # its buffer from empty at the resumed epsilon, so a resumed run is not identical to an
        # uninterrupted one. It is a way to not lose four hours, not a way to pretend nothing
        # happened, and any run that used it should say so.
        tag_ = a.tag or ("v2_dqn_%dk_s%d" % (a.decisions // 1000, a.seed))
        ck, cj = OUT / (tag_ + ".ckpt.pt"), OUT / (tag_ + ".ckpt.json")
        if not ck.exists():
            raise SystemExit("no checkpoint at %s" % ck)
        net.load_state_dict(torch.load(ck, map_location=device))
        meta = json.loads(cj.read_text(encoding="utf-8")) if cj.exists() else {}
        step = int(meta.get("step", 0))
        curve = list(meta.get("curve", []))
        print("resumed %s at %d decisions (buffer starts empty)" % (tag_, step))
    tgt.load_state_dict(net.state_dict())
    opt = torch.optim.Adam(net.parameters(), lr=a.lr)
    buf = Replay(a.buffer, device)
    kw = env_kw(a)
    envs = [Arena(a.seed * 1000 + i, **kw) for i in range(a.envs)]
    obs = np.stack([e.reset() for e in envs])

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
            # Checkpoint every eval. A 6M run is hours, and on a hosted runtime that disconnects
            # an un-checkpointed run is hours thrown away. Weights only, not the replay buffer:
            # 300k transitions is ~77MB and the point here is to survive a drop, not to resume
            # bit-identically. See --resume, which is honest about what it does and does not keep.
            if a.checkpoint:
                OUT.mkdir(parents=True, exist_ok=True)
                tag_ = a.tag or ("v2_dqn_%dk_s%d" % (a.decisions // 1000, a.seed))
                torch.save(net.state_dict(), OUT / (tag_ + ".ckpt.pt"))
                (OUT / (tag_ + ".ckpt.json")).write_text(
                    json.dumps(dict(step=step, decisions=a.decisions, seed=a.seed,
                                    minutes=round((time.time() - t0) / 60, 2),
                                    curve=curve + [dict(step=step, win=r_["win"])])),
                    encoding="utf-8")
            curve.append(dict(step=step, win=r_["win"], die=r_["die"], G=r_["G"], bhp=r_["bhp"],
                              php=r_["php"], parries=r_["parries"],
                              parry_presses=r_["parry_presses"], parry_pct=r_["parry_pct"],
                              mashes=r_["parry_mashes"], dead=r_["parry_dead"],
                              poise=r_["poise_breaks"], erupt=r_["erupt_taken"]))
            print("%8d dec  eps %.2f  %s  [%.1f min]"
                  % (step, eps, row("", r_).strip(), (time.time() - t0) / 60))
            sys.stdout.flush()
    return finish(a, net, device, curve, t0, kw)


def finish(a, net, device, curve, t0, kw):
    r = evaluate(net, device, n=200, **kw)
    mins = (time.time() - t0) / 60
    tag = a.tag or ("v2_dqn_%dk_s%d" % (a.decisions // 1000, a.seed))
    OUT.mkdir(parents=True, exist_ok=True)
    torch.save(net.state_dict(), OUT / (tag + ".pt"))
    meta = dict(tag=tag, algo="dqn", world="v2", decisions=a.decisions, seed=a.seed,
                minutes=round(mins, 2), device=str(device), n_obs=N_OBS,
                world_sha1=world_sha1(),
                n_actions=N_ACTIONS, moves=[m["name"] for m in MOVES],
                final={k: (float(v) if isinstance(v, (int, float, np.floating)) else v)
                       for k, v in r.items()},
                curve=curve, env=kw)
    (OUT / (tag + ".json")).write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print("\n%s" % row(tag, r))
    print("saved %s  (%.1f min)" % ((OUT / (tag + ".pt")).relative_to(ROOT), mins))
    return net


def load_net(tag, device):
    p = OUT / (tag + ".pt")
    if not p.exists():
        raise SystemExit("no such net: %s" % p)
    net = MLP(N_ACTIONS).to(device)
    net.load_state_dict(torch.load(p, map_location=device))
    net.eval()
    return net


# --------------------------------------------------------------------------- reading it back
def probe(a):
    """What did it learn about the parry? That is the question v2 was built to ask.

    The interesting number is not how often it parries, it is how often a parry it presses
    LANDS -- because the window is only full width if it waited. A policy that mashes can show a
    high parry count and a terrible land rate, and the two look the same on a win/loss line.
    """
    device = torch.device(a.device)
    tags = [t.strip() for t in (a.tags or a.tag or "v2_dqn_2000k_s0").split(",") if t.strip()]
    arms = [(t, greedy(load_net(t, device), device)) for t in tags]
    for name in ("patient parry", "mash parry", "roll, punish"):
        arms.append((name + " (scripted)", PLAYERS[name]))

    print("\nthe parry, %d duels each" % a.eval_n)
    # 'clk' is not padding. A player that neither wins nor dies is not a player that did
    # nothing -- it is the turtle, running out the clock, and without this column that row
    # reads as a broken measurement instead of a result.
    print("%-26s %4s %4s %4s %8s %8s %7s %7s %6s %7s"
          % ("arm", "win", "die", "clk", "presses", "landed", "land%", "mashed", "dead", "erupt"))
    for tag, pol in arms:
        r = score(pol, n=a.eval_n, seed0=1000, repeat=REPEAT, **env_kw(a))
        print("%-26s %4d %4d %4d %8.2f %8.2f %6.1f%% %7.2f %6.2f %7.2f"
              % (tag[:26], r["win"], r["die"], r["clock"], r["parry_presses"], r["parries"],
                 r["parry_pct"], r["parry_mashes"], r["parry_dead"], r["erupt_taken"]))
    print("\n  presses/landed/mashed/dead are per duel. land% is landed over presses:")
    print("  the discipline number. A %d-frame window (%.0fms) only stays that wide if the last"
          % (G["PARRY_WIN"], 1000.0 * G["PARRY_WIN"] / 30.0))
    print("  press was more than %d frames ago; each one inside that costs %d frames."
          % (G["PARRY_HEAT"], G["PARRY_STEP"]))


def buttons(a):
    """Which buttons it presses, and in which phase of a boss move."""
    device = torch.device(a.device)
    net = load_net(a.tag or "v2_dqn_2000k_s0", device)
    pol = greedy(net, device)
    phase_at, A_PARRY = G["phase_at"], G["A_PARRY"]
    byphase = {k: np.zeros(N_ACTIONS) for k in ("w", "d", "h", "r", "i")}
    for i in range(a.eval_n):
        e = Duel(seed=1000 + i, **env_kw(a))
        act = 0
        while True:
            if e.t % REPEAT == 0:
                act = pol(e)
                k = phase_at(MOVES[e.bm], e.bf)[0] if (e.bm >= 0 and e.b_stagger == 0) else "i"
                byphase[k][act] += 1
            _, _, term, trunc, _ = e.step(act)
            if term or trunc:
                break
    print("\nwhat it presses, by the phase the boss is in (%d duels)" % a.eval_n)
    for k, label in (("i", "no move out"), ("w", "windup"), ("d", "DELAY"),
                     ("h", "active"), ("r", "recovery")):
        tot = byphase[k].sum()
        if tot == 0:
            print("  %-12s none" % label)
            continue
        top = np.argsort(-byphase[k])[:4]
        print("  %-12s %7.0f decisions   %s" % (label, tot, "   ".join(
            "%s %.0f%%" % (ACTION_NAMES[j], 100 * byphase[k][j] / tot) for j in top)))


def ladder(a):
    print("\nthe scripted ladder in the v2 world, %d duels each\n" % a.eval_n)
    ladder_fn(n=a.eval_n, repeat=REPEAT, **env_kw(a))


def version(a):
    import hashlib
    src = (ROOT / "src" / "lib" / "runtimeSetup.ts").read_text(encoding="utf-8")
    m = re.search(r"export const BOSS_SETUP_V2 = `(.*?)\n`;", src, re.S)
    print("BOSS_SETUP_V2   ", hashlib.sha1(m.group(1).encode()).hexdigest()[:12],
          " %d lines" % (m.group(1).count("\n") + 1))
    print("torch           ", torch.__version__, "cuda", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("device          ", torch.cuda.get_device_name(0))
    print("obs / actions   ", N_OBS, "/", N_ACTIONS)
    print("moves           ", ", ".join(m["name"] for m in MOVES))
    print("parry           ", "%d-frame window (%.0fms), -%d per press inside %d frames, floor 0"
          % (G["PARRY_WIN"], 1000.0 * G["PARRY_WIN"] / 30.0, G["PARRY_STEP"], G["PARRY_HEAT"]))
    print("arena / clock   ", "%.0fm radius, %ds" % (G["ARENA"], G["MAX_FRAMES"] // 30))


LAYERS = ("f.0.weight", "f.0.bias", "f.2.weight", "f.2.bias", "f.4.weight", "f.4.bias")


def export(a):
    """Write the trained net where the browser can fetch it, plus a case file to check it by.

    Same contract as boss_train.py export, for the same reason: raw little-endian float32 in
    the order above, not base64 and not quantised, so the policy the reader watches in the lab
    is bit-for-bit the policy these numbers came from. The manifest additionally carries the
    WORLD hash, which v1's does not -- v2 has had three of them in a day.
    """
    import hashlib

    tag = a.tag or "v2_dqn_6000k_s0"
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
               world="v2", world_sha1=world_sha1(),
               layers=[dict(name=k, shape=list(sd[k].shape)) for k in LAYERS],
               params=int(n_par), bytes=len(blob), sha1=hashlib.sha1(blob).hexdigest(),
               actionNames=list(ACTION_NAMES), moves=[m["name"] for m in MOVES],
               decisions=res["decisions"], minutes=res["minutes"],
               final={k: res["final"][k] for k in res["final"]})
    (pub / (tag + ".json")).write_text(json.dumps(man, indent=1), encoding="utf-8")
    print("wrote public/boss/%s.bin  %d params, %d bytes, sha1 %s"
          % (tag, n_par, len(blob), man["sha1"][:12]))
    print("  world %s  obs %d  actions %d" % (man["world_sha1"], N_OBS, N_ACTIONS))

    # Real states off real duels, the observation the shipped world builds from each, and what
    # torch says the Q-values are. boss_policy_check_v2.mjs replays all three through the
    # TypeScript port, so a drift in obs() is caught and not just one in the matmuls.
    STATE = [("px", "px"), ("pz", "pz"), ("bx", "bx"), ("bz", "bz"), ("bang", "bang"),
             ("php", "php"), ("bhp", "bhp"), ("pst", "pst"), ("pa", "pa"), ("pf", "pf"),
             ("p_stun", "pStun"), ("guarding", "guarding"), ("bm", "bm"), ("bf", "bf"),
             ("b_stagger", "bStagger"), ("b_poise", "bPoise"), ("b_flinch", "bFlinch"),
             ("parry_stack", "parryStack"), ("parry_heat", "parryHeat"),
             ("parry_win", "parryWin"), ("t", "t"), ("clock", "clock")]
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
    (ROOT / "results" / "boss_policy_case_v2.json").write_text(
        json.dumps(dict(tag=tag, sha1=man["sha1"], worldSha1=man["world_sha1"],
                        obsWidth=N_OBS, actions=N_ACTIONS, state=states,
                        obs=[[round(float(x), 9) for x in r] for r in O],
                        q=[[round(float(x), 6) for x in r] for r in Q]), indent=0),
        encoding="utf-8")
    print("wrote results/boss_policy_case_v2.json  %d states off %d held-out duels"
          % (len(O), a.case_duels))
    print("now: node scripts/boss_policy_check_v2.mjs")


CMDS = {"dqn": train_dqn, "probe": probe, "buttons": buttons, "ladder": ladder,
        "export": export, "version": version}


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cmd", choices=list(CMDS))
    p.add_argument("--decisions", type=int, default=2_000_000)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--timeout", default="truncate", choices=["truncate", "defeat"])
    p.add_argument("--reward", default="damage", choices=["damage", "trade", "survive"])
    p.add_argument("--aggr", type=float, default=None)
    p.add_argument("--moves", default=None, help="comma-separated move indices, for a curriculum")
    # The superseded build was poise_max 50 / poise_hit2 50 -- one heavy broke poise from full,
    # and the agent trained against it found a stunlock. Kept settable so that run reproduces.
    p.add_argument("--poise-max", type=float, default=G["B_POISE_MAX"])
    p.add_argument("--poise-hit2", type=float, default=G["POISE_HIT2"])
    p.add_argument("--tag", default=None)
    p.add_argument("--tags", default=None, help="comma-separated tags, for probe")
    p.add_argument("--case-duels", type=int, default=12, help="duels sampled for the export case file")
    p.add_argument("--case-every", type=int, default=7, help="record every Nth decision")
    p.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    p.add_argument("--lr", type=float, default=3e-4)
    p.add_argument("--gamma", type=float, default=0.99)
    p.add_argument("--eval-every", type=int, default=50_000)
    p.add_argument("--eval-n", type=int, default=100)
    p.add_argument("--buffer", type=int, default=300_000)
    p.add_argument("--batch", type=int, default=256)
    p.add_argument("--warmup", type=int, default=5_000)
    p.add_argument("--train-every", type=int, default=2)
    p.add_argument("--target-every", type=int, default=2_000)
    p.add_argument("--explore", type=float, default=0.4)
    p.add_argument("--eps-end", type=float, default=0.05)
    p.add_argument("--envs", type=int, default=16)
    p.add_argument("--checkpoint", action="store_true", default=True,
                   help="save weights at every eval (default on)")
    p.add_argument("--no-checkpoint", dest="checkpoint", action="store_false")
    p.add_argument("--resume", action="store_true",
                   help="continue from the checkpoint; the replay buffer is NOT restored")
    a = p.parse_args()
    CMDS[a.cmd](a)


if __name__ == "__main__":
    main()
