"""Train a crew for World 2 (Wildfire command) of the Building-environments track.

Two learners against the SAME shipped environment, on the same commander interface:

    DQN   value-based, off-policy, a replay buffer                (Function-approximation track, ch.5)
    PPO   policy-gradient, on-policy, fresh rollouts every update

The environment is not re-implemented here. It is extracted from src/lib/runtimeSetup.ts exactly
the way scripts/wildfire_cases.py extracts it, so the world a crew trains in is byte-identical to
the one the browser's Run button executes, and the held-out score comes from the SHIPPED `command()`
scorer (200 worlds, seeds 1000-1199, which training never touches).

    python scripts/wildfire_train.py dqn --steps 1000000 --seed 0
    python scripts/wildfire_train.py ppo --steps 2000000 --seed 0
    python scripts/wildfire_train.py dqn --steps 1000000 --seed 0 --reward extinguish --rscale 1.0
    python scripts/wildfire_train.py baselines          # the hand-written dispatchers, same scorer
    python scripts/wildfire_train.py race               # the whole head-to-head, one run after another
    python scripts/wildfire_train.py report             # every result JSON so far, as a table
    python scripts/wildfire_train.py curves             # the curves, into the RaceLab data module

Budgets are quoted in SIMULATOR steps, not decisions: a commander decision costs ~3.9 sim steps at
K=4, and the simulator is the scarce resource. Runs write results/wildfire/<tag>.json.

WARNING: do not run more than two trainings at once. The environment loop is CPU-bound and the learners
share one GPU; four at a time measured ~100x slower per iteration than one.
"""
import argparse
import json
import math
import pathlib
import re
import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "results" / "wildfire"


def load_setup(name="WILDFIRE_SETUP"):
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
Command, command, dispatcher = G["Command"], G["command"], G["dispatcher"]
N, DECIDE_EVERY = G["N"], G["DECIDE_EVERY"]
NA = N * N                     # 256 target cells
NC = 12                        # observation layers


# ---- the network: one 16x16 map in, one 16x16 map of scores out ----------------------
class PointerNet(nn.Module):
    """Fully convolutional. The action space IS the grid, so the head keeps the grid shape:
    every output cell scores 'send the crew here'. No flattening, so a pattern learned in one
    corner is the same pattern in another, and the 256 actions share almost all their weights."""

    def __init__(self, width=64, blocks=3, critic=False, dueling=False):
        super().__init__()
        layers = [nn.Conv2d(NC, width, 3, padding=1), nn.ReLU()]
        for _ in range(blocks):
            layers += [nn.Conv2d(width, width, 3, padding=1), nn.ReLU()]
        self.trunk = nn.Sequential(*layers)
        self.head = nn.Conv2d(width, 1, 1)
        self.dueling = dueling
        head = critic or dueling
        self.critic = nn.Sequential(nn.Linear(width, 64), nn.ReLU(), nn.Linear(64, 1)) if head else None

    def forward(self, x):
        h = self.trunk(x)
        scores = self.head(h).flatten(1)                      # (B, 256)
        if self.dueling:
            # every cell is worth about the same; only the differences pick a target, so say so:
            # Q(s, a) = V(s) + A(s, a) - mean_a A(s, a)
            v = self.critic(h.mean((2, 3)))                   # (B, 1)
            return v + scores - scores.mean(1, keepdim=True)
        if self.critic is None:
            return scores
        return scores, self.critic(h.mean((2, 3))).squeeze(-1)


# ---- a batch of commander worlds, stepped together ----------------------------------
class VecCommand:
    "B independent Command worlds. Autoreset: a finished world is replaced by a fresh one."

    def __init__(self, n, reward="values", K=DECIDE_EVERY, seed=0):
        self.n, self.reward, self.K = n, reward, K
        self.rng = np.random.default_rng(seed)
        self.worlds = [Command(reward=reward, K=K) for _ in range(n)]
        self.obs = np.zeros((n, NC, N, N), np.float32)
        self.sim_steps = 0
        self.ret = np.zeros(n)
        self.truncations = self.episodes = 0
        self.done_returns, self.done_damage = [], []
        for i in range(n):
            self.obs[i] = self._fresh(i)

    def _fresh(self, i):
        # training seeds live far away from the held-out block (1000-1199)
        o, _ = self.worlds[i].reset(seed=int(self.rng.integers(200_000, 2_000_000_000)))
        self.ret[i] = 0.0
        return o

    def step(self, actions):
        """Returns the TRUE successor of each transition. On an episode boundary that is the last
        observation of the episode that just ended, NOT the reset observation of the replacement
        world -- self.obs holds that, and it is what the next decision is taken from. Getting this
        wrong is silent: terminated transitions mask their bootstrap to zero anyway, so only the
        truncated ones are poisoned, and they are rare enough to hide in the noise."""
        n = self.n
        nxt = np.zeros_like(self.obs)
        rew = np.zeros(n, np.float32)
        term = np.zeros(n, bool)     # the fire is out: there is nothing left to bootstrap from
        trunc = np.zeros(n, bool)    # the clock ran out mid-fire: the future value is NOT zero
        for i in range(n):
            o, r, te, tr, info = self.worlds[i].step(int(actions[i]))
            self.sim_steps += info["steps"]
            rew[i], term[i], trunc[i] = r, te, tr
            self.ret[i] += r
            nxt[i] = o
            if te or tr:
                self.done_returns.append(float(self.ret[i]))
                self.done_damage.append(self.worlds[i].env.summary()["village_damaged"])
                self.truncations += int(tr)
                self.episodes += 1
                o = self._fresh(i)
            self.obs[i] = o
        return nxt, rew, term, trunc

    def recent(self, k=50):
        if not self.done_returns:
            return float("nan"), float("nan")
        return float(np.mean(self.done_returns[-k:])), float(np.mean(self.done_damage[-k:]))


# ---- scoring: always through the shipped command() on the held-out worlds -------------
@torch.no_grad()
def greedy_pick(net, device):
    "Wrap a network as a commander rule, so the SHIPPED scorer can fly it."
    def pick(env):
        x = torch.as_tensor(env.observe()[None], device=device)
        s = net(x)
        if isinstance(s, tuple):
            s = s[0]
        return int(s.argmax(1).item())
    return pick


def evaluate(net, device, reward, K, n=200):
    net.eval()
    t0 = time.time()
    score = command(greedy_pick(net, device), n=n, K=K, reward=reward)
    net.train()
    score["eval_seconds"] = round(time.time() - t0, 1)
    return score


def save(tag, payload):
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f"{tag}.json"
    p.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"  wrote {p.relative_to(ROOT)}")
    return p


def banner(a, extra=""):
    print(f"\n=== {a.learner} | seed {a.seed} | {a.steps/1e6:.1f}M sim steps | reward={a.reward}"
          f" | K={a.K} | {a.device} {extra}")



def curve_point(net, a, envs, t0, device):
    """A held-out probe during training, so the learning curve is an honest score and not the
    training return (which is noisy and biased toward the short episodes that end early).
    Nothing is ever SELECTED on this: no early stopping, no checkpoint picking."""
    h = evaluate(net, device, a.reward, a.K, a.curve_worlds)
    r_, d_ = envs.recent()
    pt = dict(sim_steps=envs.sim_steps, minutes=round((time.time() - t0) / 60, 2),
              village=h["village_damaged"], saved=h["village_saved"], burnt=h["burnt"],
              put_out=h["put_out"], train_return=None if r_ != r_ else round(r_, 1))
    print(f"  {pt['sim_steps']/1e6:5.2f}M  {pt['minutes']:5.1f} min  village {pt['village']:5.2f}  "
          f"saved {pt['saved']:5.1%}  burnt {pt['burnt']:6.1f}  put out {pt['put_out']:5.1f}  "
          f"{envs.sim_steps/(time.time()-t0):6.0f} sim/s")
    return pt


# ---- DQN ------------------------------------------------------------------------------
class Replay:
    "A ring buffer. Observations are kept as float16: 12 layers of a 16x16 grid, mostly 0/1."

    def __init__(self, cap, device):
        self.cap, self.device, self.i, self.full = cap, device, 0, False
        self.o = np.zeros((cap, NC, N, N), np.float16)
        self.o2 = np.zeros((cap, NC, N, N), np.float16)
        self.a = np.zeros(cap, np.int64)
        self.r = np.zeros(cap, np.float32)           # the n-step return, already discounted
        self.g = np.zeros(cap, np.float32)           # gamma**k for the k steps actually taken
        self.nb = np.zeros(cap, np.float32)          # 1 = bootstrap from o2, 0 = the fire went out

    def add(self, o, a, r, o2, g, nb):
        n = len(a)
        idx = (self.i + np.arange(n)) % self.cap
        self.o[idx], self.o2[idx], self.a[idx] = o, o2, a
        self.r[idx], self.g[idx], self.nb[idx] = r, g, nb
        self.full |= self.i + n >= self.cap
        self.i = (self.i + n) % self.cap

    def __len__(self):
        return self.cap if self.full else self.i

    def sample(self, b, rng):
        j = rng.integers(len(self), size=b)
        t = lambda x, dt: torch.as_tensor(x[j], dtype=dt, device=self.device)
        return (t(self.o, torch.float32), t(self.a, torch.long), t(self.r, torch.float32),
                t(self.o2, torch.float32), t(self.g, torch.float32), t(self.nb, torch.float32))


def train_dqn(a):
    device = torch.device(a.device)
    torch.manual_seed(a.seed); np.random.seed(a.seed)
    net = PointerNet(a.width, a.blocks, dueling=a.dueling).to(device)
    tgt = PointerNet(a.width, a.blocks, dueling=a.dueling).to(device)
    tgt.load_state_dict(net.state_dict())
    opt = torch.optim.Adam(net.parameters(), lr=a.lr)
    envs = VecCommand(a.envs, reward=a.reward, K=a.K, seed=a.seed)
    buf = Replay(a.replay, device)
    rng = np.random.default_rng(a.seed)
    window = [[] for _ in range(a.envs)]     # per env: the last n (obs, action, reward) not yet emitted
    banner(a, f"| eps {a.eps_start}->{a.eps_end} over {a.eps_frac:.0%} | replay {a.replay}"
              f" | {a.nstep}-step | {'dueling' if a.dueling else 'plain Q'}")

    t0, it, curve, grad_steps = time.time(), 0, [], 0
    next_curve = a.curve_every
    while envs.sim_steps < a.steps:
        frac = min(1.0, envs.sim_steps / (a.eps_frac * a.steps))
        eps = a.eps_start + frac * (a.eps_end - a.eps_start)
        o = envs.obs.copy()
        with torch.no_grad():
            q = net(torch.as_tensor(o, device=device))
        act = q.argmax(1).cpu().numpy()
        explore = rng.random(a.envs) < eps
        act[explore] = rng.integers(NA, size=int(explore.sum()))
        o2, r, term, trunc = envs.step(act)
        emit_o, emit_a, emit_r, emit_o2, emit_g, emit_nb = [], [], [], [], [], []
        for i in range(a.envs):
            window[i].append((o[i], act[i], float(r[i]) * a.rscale))
            done = term[i] or trunc[i]
            # a full window: its successor is the state n decisions on, which is this step's successor
            if len(window[i]) >= a.nstep and not done:
                emit_o.append(window[i][0][0]); emit_a.append(window[i][0][1])
                emit_r.append(sum(a.gamma ** j * w[2] for j, w in enumerate(window[i])))
                emit_o2.append(o2[i]); emit_g.append(a.gamma ** a.nstep); emit_nb.append(1.0)
                window[i].pop(0)
            elif done:
                # the tail: every remaining start runs to the end of the episode, so each gets its
                # own k. Only a TERMINATED episode has a future value of exactly zero.
                for j0 in range(len(window[i])):
                    tail = window[i][j0:]
                    emit_o.append(tail[0][0]); emit_a.append(tail[0][1])
                    emit_r.append(sum(a.gamma ** j * w[2] for j, w in enumerate(tail)))
                    emit_o2.append(o2[i]); emit_g.append(a.gamma ** len(tail))
                    emit_nb.append(0.0 if term[i] else 1.0)
                window[i].clear()
        if emit_o:
            buf.add(np.asarray(emit_o, np.float16), np.asarray(emit_a, np.int64),
                    np.asarray(emit_r, np.float32), np.asarray(emit_o2, np.float16),
                    np.asarray(emit_g, np.float32), np.asarray(emit_nb, np.float32))

        if len(buf) >= a.warmup:
            for _ in range(a.updates):
                bo, ba, br, bo2, bg, bnb = buf.sample(a.batch, rng)
                with torch.no_grad():
                    # Double DQN: the online net picks the target cell, the target net prices it
                    nxt = net(bo2).argmax(1, keepdim=True)
                    y = br + bg * bnb * tgt(bo2).gather(1, nxt).squeeze(1)
                qa = net(bo).gather(1, ba[:, None]).squeeze(1)
                loss = F.smooth_l1_loss(qa, y)
                opt.zero_grad(set_to_none=True)
                loss.backward()
                nn.utils.clip_grad_norm_(net.parameters(), a.clip_grad)
                opt.step()
                grad_steps += 1
                if grad_steps % a.target_every == 0:
                    tgt.load_state_dict(net.state_dict())
        it += 1
        if envs.sim_steps >= next_curve:
            curve.append(dict(eps=round(eps, 3), **curve_point(net, a, envs, t0, device)))
            next_curve += a.curve_every
    return net, dict(curve=curve, grad_steps=grad_steps, episodes=envs.episodes,
                     truncated=envs.truncations, minutes=round((time.time() - t0) / 60, 1))


# ---- PPO ------------------------------------------------------------------------------
def train_ppo(a):
    device = torch.device(a.device)
    torch.manual_seed(a.seed); np.random.seed(a.seed)
    net = PointerNet(a.width, a.blocks, critic=True).to(device)
    opt = torch.optim.Adam(net.parameters(), lr=a.lr)
    envs = VecCommand(a.envs, reward=a.reward, K=a.K, seed=a.seed)
    banner(a, f"| rollout {a.rollout} x {a.envs} = {a.rollout*a.envs} decisions/update")

    T, B = a.rollout, a.envs
    t0, it, curve = time.time(), 0, []
    next_curve = a.curve_every
    while envs.sim_steps < a.steps:
        obs = torch.zeros(T, B, NC, N, N, device=device)
        acts = torch.zeros(T, B, dtype=torch.long, device=device)
        logp = torch.zeros(T, B, device=device)
        vals = torch.zeros(T + 1, B, device=device)
        rews = torch.zeros(T, B, device=device)
        nboot = torch.zeros(T, B, device=device)      # bootstrap mask: 0 only when the fire went out
        cut = torch.zeros(T, B, device=device)        # episode boundary: stop GAE here
        vend = torch.zeros(T, B, device=device)       # value of the true final state of a truncated episode

        for t in range(T):
            x = torch.as_tensor(envs.obs, device=device)
            with torch.no_grad():
                sc, v = net(x)
                dist = torch.distributions.Categorical(logits=sc)
                act = dist.sample()
                obs[t], acts[t], logp[t], vals[t] = x, act, dist.log_prob(act), v
            nxt, r, term, trunc = envs.step(act.cpu().numpy())
            rews[t] = torch.as_tensor(r * a.rscale, device=device)
            nboot[t] = torch.as_tensor((~term).astype(np.float32), device=device)
            cut[t] = torch.as_tensor((term | trunc).astype(np.float32), device=device)
            if trunc.any():                           # price the state the clock caught them in
                with torch.no_grad():
                    _, vt = net(torch.as_tensor(nxt[trunc], device=device))
                vend[t, torch.as_tensor(np.flatnonzero(trunc), device=device)] = vt
        with torch.no_grad():
            _, vals[T] = net(torch.as_tensor(envs.obs, device=device))

        # GAE. A truncated episode still bootstraps (the fire was burning when the clock ran out);
        # a terminated one does not (there is nothing left to burn).
        adv = torch.zeros(T, B, device=device)
        last = torch.zeros(B, device=device)
        for t in reversed(range(T)):
            # the successor value is vals[t+1] except where the episode was cut short by the clock
            v_next = torch.where(cut[t] > 0, vend[t], vals[t + 1])
            delta = rews[t] + a.gamma * nboot[t] * v_next - vals[t]
            last = delta + a.gamma * a.lam * (1 - cut[t]) * last
            adv[t] = last
        ret = adv + vals[:T]

        bo, ba, bl = obs.reshape(-1, NC, N, N), acts.reshape(-1), logp.reshape(-1)
        badv, bret = adv.reshape(-1), ret.reshape(-1)
        badv = (badv - badv.mean()) / (badv.std() + 1e-8)
        idx = np.arange(T * B)
        for _ in range(a.epochs):
            np.random.shuffle(idx)
            for s in range(0, T * B, a.minibatch):
                j = torch.as_tensor(idx[s:s + a.minibatch], device=device)
                sc, v = net(bo[j])
                dist = torch.distributions.Categorical(logits=sc)
                ratio = (dist.log_prob(ba[j]) - bl[j]).exp()
                pg = -torch.min(ratio * badv[j],
                                ratio.clamp(1 - a.clip, 1 + a.clip) * badv[j]).mean()
                loss = pg + a.vf * F.mse_loss(v, bret[j]) - a.ent * dist.entropy().mean()
                opt.zero_grad(set_to_none=True)
                loss.backward()
                nn.utils.clip_grad_norm_(net.parameters(), a.clip_grad)
                opt.step()
        it += 1
        if envs.sim_steps >= next_curve:
            curve.append(curve_point(net, a, envs, t0, device))
            next_curve += a.curve_every
    return net, dict(curve=curve, episodes=envs.episodes, truncated=envs.truncations,
                     minutes=round((time.time() - t0) / 60, 1))


# ---- subcommands ----------------------------------------------------------------------
def run(a):
    tag = a.tag or f"{a.learner}_{a.reward}_{a.steps//1000000}M_s{a.seed}"
    net, log = (train_dqn if a.learner == "dqn" else train_ppo)(a)
    score = evaluate(net, torch.device(a.device), a.reward, a.K, a.eval_worlds)
    print(f"  held-out ({a.eval_worlds} worlds): {score}")
    if a.save_net:
        OUT.mkdir(parents=True, exist_ok=True)
        torch.save(net.state_dict(), OUT / f"{tag}.pt")
    save(tag, dict(tag=tag, learner=a.learner, seed=a.seed, sim_steps=a.steps, reward=a.reward,
                   K=a.K, rscale=a.rscale, held_out=score, **log, config=vars(a)))
    return score


def baselines(a):
    "The hand-written dispatchers, scored by the same shipped command() the crews are scored by."
    rows = {}
    for mode in ("random", "random_fire", "nearest", "guard", "densest"):
        t0 = time.time()
        rows[mode] = command(dispatcher(mode), n=a.eval_worlds, K=a.K, reward=a.reward)
        print(f"  {mode:12s} {rows[mode]}  ({time.time()-t0:.0f}s)")
    save(f"baselines_{a.reward}_K{a.K}", dict(kind="baselines", reward=a.reward, K=a.K, rows=rows))


def race(a):
    "The head-to-head. Sequential on purpose: two at a time is already CPU-bound."
    plan = [("dqn", 1_000_000), ("ppo", 1_000_000), ("ppo", 2_000_000)]
    for learner, steps in plan:
        for seed in range(a.seeds):
            b = argparse.Namespace(**vars(a))
            b.learner, b.steps, b.seed, b.tag = learner, steps, seed, None
            run(b)


def curves(a):
    """Write the measured training curves into the lab's data module. Every point is a held-out
    probe recorded with both what it had cost in simulator steps and what it had cost in minutes."""
    runs = []
    for f in sorted(OUT.glob("*.json")):
        r = json.loads(f.read_text())
        if r.get("kind") == "baselines" or r.get("reward") != "values" or not r.get("curve"):
            continue
        if any(k in r["tag"] for k in ("colab", "sweep", "diag")):   # another machine, a tuning
            continue                              # run, or a diagnostic: none belong on this axis
        pts = [dict(sim=c["sim_steps"], min=c["minutes"], village=c["village"],
                    saved=c["saved"], burnt=c["burnt"], put=c["put_out"]) for c in r["curve"]]
        h = r["held_out"]
        runs.append(dict(learner=r["learner"].upper(), budget=r["sim_steps"], seed=r["seed"],
                         minutes=r["minutes"], points=pts,
                         final=dict(sim=r["sim_steps"], min=r["minutes"], village=h["village_damaged"],
                                    saved=h["village_saved"], burnt=h["burnt"], put=h["put_out"])))
    base = json.loads((OUT / f"baselines_values_K{a.K}.json").read_text())["rows"]
    bar = {k: dict(village=v["village_damaged"], burnt=v["burnt"], put=v["put_out"], saved=v["village_saved"])
           for k, v in base.items()}
    head = [
        "// Generated by scripts/wildfire_train.py curves. Do not edit by hand.",
        "// Held-out probes taken DURING training (exam worlds, seeds 1000+), recorded with both the",
        "// simulator steps and the wall-clock minutes they had cost by then. Nothing was selected on",
        "// them. Runs were taken one at a time on an idle machine, so the minutes are comparable.",
        "export type RacePoint = { sim: number; min: number; village: number; saved: number; burnt: number; put: number };",
        'export type RaceRun = { learner: "DQN" | "PPO"; budget: number; seed: number; minutes: number; points: RacePoint[]; final: RacePoint };',
        "",
        "export const RACE_RUNS: RaceRun[] = " + json.dumps(runs, indent=1) + ";",
        "",
        "export const BAR = " + json.dumps(bar, indent=1) + ";",
        "",
    ]
    dst = ROOT / "src" / "components" / "fire" / "data" / "raceCurves.ts"
    dst.write_text("\n".join(head), encoding="utf-8")
    print(f"  wrote {dst.relative_to(ROOT)}  ({len(runs)} runs, "
          f"{sum(len(r['points']) for r in runs)} probes)")


def report(a):
    "Every result JSON written so far, as one table."
    files = sorted(OUT.glob("*.json"))
    if not files:
        raise SystemExit(f"no results in {OUT}")
    runs = [json.loads(p.read_text()) for p in files]
    runs = [r for r in runs if r.get("kind") != "baselines"]
    hdr = f"{'run':28s} {'min':>5s} {'village':>8s} {'saved':>6s} {'burnt':>6s} {'put out':>8s} {'steps':>6s}"
    print(hdr); print("-" * len(hdr))
    for r in sorted(runs, key=lambda r: (r["learner"], r["sim_steps"], r["seed"])):
        h = r["held_out"]
        print(f"{r['tag']:28s} {r.get('minutes', 0):5.1f} {h['village_damaged']:8.2f} "
              f"{h['village_saved']:6.1%} {h['burnt']:6.1f} {h['put_out']:8.1f} {h['steps']:6.1f}")
    for key in sorted({(r["learner"], r["sim_steps"], r["reward"]) for r in runs}):
        grp = [r for r in runs if (r["learner"], r["sim_steps"], r["reward"]) == key]
        v = [r["held_out"]["village_damaged"] for r in grp]
        b = [r["held_out"]["burnt"] for r in grp]
        print(f"\n  {key[0]} {key[1]/1e6:.0f}M {key[2]}: {len(grp)} seeds | village "
              f"{'/'.join(f'{x:.2f}' for x in v)} (mean {np.mean(v):.2f}) | "
              f"burnt {'/'.join(f'{x:.0f}' for x in b)} (mean {np.mean(b):.1f})")


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cmd", choices=["dqn", "ppo", "baselines", "race", "report", "curves"])
    p.add_argument("--steps", type=int, default=1_000_000, help="budget in SIMULATOR steps")
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--seeds", type=int, default=3, help="race: seeds per learner")
    p.add_argument("--reward", default="values", choices=["values", "area", "extinguish"])
    p.add_argument("--rscale", type=float, default=None, help="reward multiplier (default .1 values, 1 extinguish)")
    p.add_argument("--K", type=int, default=DECIDE_EVERY)
    p.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    p.add_argument("--envs", type=int, default=64)
    p.add_argument("--width", type=int, default=64)
    p.add_argument("--blocks", type=int, default=3)
    p.add_argument("--lr", type=float, default=3e-4)
    p.add_argument("--gamma", type=float, default=0.99)
    p.add_argument("--clip-grad", type=float, default=0.5)
    p.add_argument("--eval-worlds", type=int, default=200)
    p.add_argument("--curve-every", type=int, default=50_000, help="sim steps between held-out probes")
    p.add_argument("--curve-worlds", type=int, default=40, help="worlds per probe (seeds 1000+)")
    p.add_argument("--tag", default=None)
    p.add_argument("--save-net", action="store_true")
    # DQN
    p.add_argument("--replay", type=int, default=200_000)
    p.add_argument("--nstep", type=int, default=3, help="steps of reward carried before bootstrapping")
    p.add_argument("--dueling", type=int, default=1, help="1 = split Q into a state value and per-cell advantages")
    p.add_argument("--batch", type=int, default=256)
    p.add_argument("--updates", type=int, default=4, help="gradient steps per collected batch")
    p.add_argument("--warmup", type=int, default=5_000)
    p.add_argument("--target-every", type=int, default=1_000, help="gradient steps between target copies")
    p.add_argument("--eps-start", type=float, default=1.0)
    p.add_argument("--eps-end", type=float, default=0.05)
    p.add_argument("--eps-frac", type=float, default=0.3)
    # PPO
    p.add_argument("--rollout", type=int, default=32)
    p.add_argument("--epochs", type=int, default=4)
    p.add_argument("--minibatch", type=int, default=512)
    p.add_argument("--lam", type=float, default=0.95)
    p.add_argument("--clip", type=float, default=0.2)
    p.add_argument("--ent", type=float, default=0.01)
    p.add_argument("--vf", type=float, default=0.5)
    a = p.parse_args(argv)
    if a.rscale is None:
        a.rscale = 1.0 if a.reward == "extinguish" else 0.1
    a.learner = a.cmd
    t0 = time.time()
    if a.cmd in ("dqn", "ppo"):
        run(a)
    elif a.cmd == "baselines":
        baselines(a)
    elif a.cmd == "race":
        race(a)
    elif a.cmd == "curves":
        curves(a)
    else:
        report(a)
    print(f"\n({time.time() - t0:.1f}s)")


if __name__ == "__main__":
    main()
