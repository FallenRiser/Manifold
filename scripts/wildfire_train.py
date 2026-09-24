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
    python scripts/wildfire_train.py version            # which copy is this? run it first on a new machine
    python scripts/wildfire_train.py race               # the whole head-to-head, one run after another
    python scripts/wildfire_train.py report             # every result JSON so far, as a table
    python scripts/wildfire_train.py curves             # the curves, into the RaceLab data module
    python scripts/wildfire_train.py learned            # what the trained crew DOES, beside the chiefs
    python scripts/wildfire_train.py where-won          # is the crew's win spread over the exam, or local?
    python scripts/wildfire_train.py shield             # take the wetting out of a drop: who falls over?
    python scripts/wildfire_train.py snap               # move only the crew's aim onto the fire
    python scripts/wildfire_train.py figure             # those results, into the ShieldLab data module

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
VILLAGE, BURNING, LAKE = G["VILLAGE"], G["BURNING"], G["LAKE"]   # the probes in `learned` read the map
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


# Bumped whenever a change would make older results incomparable. Stamped into every
# result file so a run that came back from another machine can be checked instead of trusted.
TRAINER = 2   # 2: DQN gained n-step returns, a dueling head and a 200k replay


def save(tag, payload):
    payload.setdefault("trainer", TRAINER)
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


def stale(r):
    """Was this run produced by a different trainer than the one in the repo right now?

    Returns a reason string, or "" if the run is current. The check is on the CONFIG, not the
    tag: the runs that caught this out were named exactly like race runs. A DQN result whose
    config has no `nstep`/`dueling` key came from the version before those existed, i.e. 1-step
    with a small replay -- the configuration `diag_dqn_1step_1M_s0` documents as the one that
    peaks early and then unlearns. Publishing it as the DQN arm would race a tuned PPO against
    a deliberately bad DQN and call the result a finding.
    """
    c = r.get("config", {})
    if r.get("stale_config"):
        return "marked stale_config"
    if r.get("trainer") is not None and r["trainer"] < TRAINER:
        return f"trainer v{r['trainer']}, this script is v{TRAINER}"
    # No stamp means the run predates stamping, not that it is wrong -- fall through to the
    # config, which is what actually distinguishes the arms. v2 changed DQN only: train_ppo()
    # reads none of nstep, dueling or replay, so an unstamped PPO run is still current.
    if r["learner"] == "dqn" and ("nstep" not in c or "dueling" not in c):
        return "DQN config has no nstep/dueling: produced by a trainer older than v2"
    return ""


def curves(a):
    """Write the measured training curves into the lab's data module. Every point is a held-out
    probe recorded with both what it had cost in simulator steps and what it had cost in minutes."""
    runs, skipped = [], []
    for f in sorted(OUT.glob("*.json")):
        r = json.loads(f.read_text())
        if r.get("kind") == "baselines" or r.get("reward") != "values" or not r.get("curve"):
            continue
        if any(k in r["tag"] for k in ("colab", "sweep", "diag")):   # another machine, a tuning
            continue                              # run, or a diagnostic: none belong on this axis
        why = stale(r)
        if why:
            print(f"  SKIP {r['tag']}: {why}")
            skipped.append(r["tag"])
            continue
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

    # A curve point is a probe over curve_worlds worlds, not over the 200-world exam, and the two
    # are not interchangeable: the probe block is easier for any policy that can defend the village
    # (guard 0.85 there against 1.11 over 200). Drawing the 200-world bar under 40-world curves
    # flatters every crew by about a fifth, so measure the chiefs on the probe block too.
    probe = {}
    block = range(1000, 1000 + a.curve_worlds)
    for mode in ("nearest", "guard"):
        v = per_world(dispatcher(mode), block, a.K)
        b = per_world(dispatcher(mode), block, a.K, "burnt")
        probe[mode] = dict(village=round(float(v.mean()), 2),
                           burnt=round(float(b.mean()), 1),
                           se2=round(float(2 * v.std(ddof=1) / np.sqrt(len(v))), 2))
        print(f"  probe block ({a.curve_worlds} worlds): {mode} village {probe[mode]['village']:.2f} "
              f"+/-{probe[mode]['se2']:.2f}  burnt {probe[mode]['burnt']:.1f}")
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
        "// The chiefs scored on the PROBE block instead — the same " + str(a.curve_worlds) + " worlds every curve",
        "// point above is measured on. Use these for reference lines drawn under the curves; BAR is the",
        "// 200-world exam and belongs with the final scores, not with a probe.",
        "export const BAR_PROBE = " + json.dumps(probe, indent=1) + ";",
        "",
    ]
    dst = ROOT / "src" / "components" / "fire" / "data" / "raceCurves.ts"
    dst.write_text("\n".join(head), encoding="utf-8")
    print(f"  wrote {dst.relative_to(ROOT)}  ({len(runs)} runs, "
          f"{sum(len(r['points']) for r in runs)} probes)")
    if skipped:
        print(f"  {len(skipped)} run(s) skipped as not current: {', '.join(skipped)}")
    arms = {(r["learner"], r["budget"]) for r in runs}
    for want in (("DQN", 1_000_000), ("PPO", 1_000_000), ("PPO", 2_000_000)):
        if want not in arms:
            print(f"  INCOMPLETE: no {want[0]} at {want[1]/1e6:.0f}M — the race is not ready to publish")


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


def per_world(pick, seeds, K, field="village_damaged"):
    """Fly one policy over each world alone and keep its per-world score.

    command() returns the mean over its worlds, which is enough to report a score and not enough
    to test a difference. Same worlds, same order, one row each.
    """
    out = []
    for k in seeds:
        w = Command(K=K)
        w.reset(seed=k)
        while True:
            _, _, te, tr, _ = w.step(pick(w.env))
            if te or tr:
                break
        out.append(w.env.summary()[field])
    return np.array(out, dtype=float)


def paired(a):
    """Every saved crew against every hand-written chief, paired on the 200 exam worlds."""
    device = torch.device(a.device)
    seeds = range(1000, 1000 + a.eval_worlds)
    scores = {}

    for mode in ("nearest", "guard", "densest"):
        scores[mode] = per_world(dispatcher(mode), seeds, a.K)
        print(f"  {mode:22s} {scores[mode].mean():.2f}")

    for p in sorted(OUT.glob("*.pt")):
        r = json.loads((OUT / f"{p.stem}.json").read_text())
        net = PointerNet(r["config"]["width"], r["config"]["blocks"],
                         critic=r["learner"] == "ppo",
                         dueling=bool(r["config"].get("dueling", 0))).to(device)
        net.load_state_dict(torch.load(p, map_location=device))
        net.eval()
        scores[p.stem] = per_world(greedy_pick(net, device), seeds, a.K)
        print(f"  {p.stem:22s} {scores[p.stem].mean():.2f}")

    crews = [k for k in scores if k not in ("nearest", "guard", "densest")]
    n = a.eval_worlds
    print(f"\n  paired differences over the same {n} worlds (crew minus chief, negative = crew better)")
    print(f"  {'crew':22s} {'chief':10s} {'gap':>7s} {'2 s.e.':>8s} {'unpaired 2 s.e.':>16s}  verdict")
    rows = {}
    for c in sorted(crews):
        for chief in ("guard", "nearest"):
            d = scores[c] - scores[chief]
            se = 2 * d.std(ddof=1) / np.sqrt(n)
            un = 2 * np.sqrt(scores[c].var(ddof=1) / n + scores[chief].var(ddof=1) / n)
            verdict = "crew better" if d.mean() + se < 0 else ("chief better" if d.mean() - se > 0 else "not separated")
            print(f"  {c:22s} {chief:10s} {d.mean():+7.2f} {se:8.2f} {un:16.2f}  {verdict}")
            rows[f"{c}_vs_{chief}"] = dict(gap=round(float(d.mean()), 3), se2=round(float(se), 3),
                                           unpaired_se2=round(float(un), 3), verdict=verdict)

    if len(crews) > 1:
        print(f"\n  seed-to-seed, paired the same way")
        cs = sorted(crews)
        for i in range(len(cs)):
            for j in range(i + 1, len(cs)):
                d = scores[cs[i]] - scores[cs[j]]
                se = 2 * d.std(ddof=1) / np.sqrt(n)
                print(f"  {cs[i]:22s} {cs[j]:22s} {d.mean():+7.2f} +/-{se:.2f}")

    save(f"paired_K{a.K}", dict(kind="paired", K=a.K, worlds=n,
                                means={k: round(float(v.mean()), 3) for k, v in scores.items()},
                                world_sd={k: round(float(v.std(ddof=1)), 3) for k, v in scores.items()},
                                rows=rows))


# ---- what did it learn? ---------------------------------------------------------------
VTHREAT = 3.5     # a burning cell this close to the village centre is a threat (cobra page's probe)


def probe_one(pick, seed, K, drop_r=None):
    """Fly one world and record every decision and every bucket.

    The crew is flown by the SHIPPED Command loop -- the same one that scores it -- with
    env.step wrapped so a drop is recorded at the moment it happens. An instance attribute
    shadows the bound method, so Command.step's `env.step(a)` goes through the wrapper.
    """
    w = Command(K=K)
    w.reset(seed=seed)
    env = w.env
    k = env.drop_r if drop_r is None else drop_r
    village = np.argwhere(env.T == VILLAGE)
    vc = village.mean(0)
    raw = env.step
    drops, decisions = [], []

    def wrapped(a):
        r, c = env.pos
        wet = a == 5 and env.water > 0 and env.T[r, c] != LAKE
        if wet:
            sq = (slice(max(r - k, 0), r + k + 1), slice(max(c - k, 0), c + k + 1))
            # A drop that hits no fire is not necessarily wasted: it can wet the cells the fire is
            # about to reach. Count them -- unburnt, flammable, and touching a burning cell now.
            burning = env.S == BURNING
            touching = np.zeros((N, N), bool)
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    if dr or dc:
                        touching |= G["shift"](burning, dr, dc, False)
            edge = (env.S == G["UNBURNT"]) & G["FLAMMABLE"][env.T] & touching
            before = dict(t=env.t, alight=int(burning.sum()),
                          dv=float(np.hypot(r - vc[0], c - vc[1])),
                          edge=int(edge[sq].sum()),
                          on_village=int((env.T[sq] == VILLAGE).any()))
        out = raw(a)
        if wet:
            before["hit"] = out[4]["put_out"]
            drops.append(before)
        return out

    env.step = wrapped
    while True:
        fire = np.argwhere(env.S == BURNING)
        tgt = int(pick(env))
        tr, tc = divmod(tgt, N)
        if len(fire):
            cheb = np.abs(fire - np.array([tr, tc])).max(1)
            near_v = np.hypot(*(fire - vc).T)
            decisions.append(dict(
                alight=len(fire),
                on_fire=int(env.S[tr, tc] == BURNING),
                covers=int(cheb.min() <= k),                 # the 5x5 drop square holds a burning cell
                reach=float(cheb.min()),
                dv=float(np.hypot(tr - vc[0], tc - vc[1])),
                threat=int(near_v.min() <= VTHREAT),
                answers=int((cheb <= k).any() and near_v[cheb <= k].min() <= VTHREAT),
            ))
        _, _, te, tr_, _ = w.step(tgt)
        if te or tr_:
            break
    s = env.summary()
    s["truncated"] = int(env.t >= env.max_steps and (env.S == BURNING).any())
    return s, drops, decisions


def probe(pick, seeds, K):
    "Roll probe_one over the exam worlds and reduce to one row."
    eps, drops, decs, firsts = [], [], [], []
    for seed in seeds:
        s, d, c = probe_one(pick, seed, K)
        eps.append(s)
        drops += d
        decs += c
        if d:
            firsts.append(d[0]["t"])
    n = len(eps)
    mean = lambda rows, key: float(np.mean([r[key] for r in rows])) if rows else float("nan")
    endgame = [d for d in decs if 1 <= d["alight"] <= 6]
    threat = [d for d in decs if d["threat"]]
    return dict(
        village=mean(eps, "village_damaged"), burnt=mean(eps, "burnt"), steps=mean(eps, "t"),
        saved=float(np.mean([e["village_damaged"] == 0 for e in eps])),
        truncated=mean(eps, "truncated"),
        drops=len(drops) / n, put_out=mean(eps, "put_out"),
        first_drop=float(np.mean(firsts)) if firsts else float("nan"),
        hit=mean(drops, "hit"), dry=float(np.mean([d["hit"] == 0 for d in drops])) if drops else float("nan"),
        alight_at_drop=mean(drops, "alight"), drop_dv=mean(drops, "dv"),
        edge=mean(drops, "edge"),
        edge_dry=mean([d for d in drops if d["hit"] == 0], "edge"),
        on_village=float(np.mean([d["on_village"] for d in drops])) if drops else float("nan"),
        decisions=len(decs) / n,
        on_fire=mean(decs, "on_fire"), covers=mean(decs, "covers"), reach=mean(decs, "reach"),
        tgt_dv=mean(decs, "dv"),
        endgame_n=len(endgame) / n, endgame_covers=mean(endgame, "covers"),
        threat_n=len(threat) / n, threat_answers=mean(threat, "answers"),
    )


def load_crew(p, device):
    "Rebuild a saved net from the config stored beside it."
    r = json.loads((OUT / f"{p.stem}.json").read_text())
    if stale(r):
        raise SystemExit(f"{p.stem}: {stale(r)}")
    net = PointerNet(r["config"]["width"], r["config"]["blocks"],
                     critic=r["learner"] == "ppo", dueling=bool(r["config"].get("dueling", 0))).to(device)
    net.load_state_dict(torch.load(p, map_location=device))
    net.eval()
    return net


def learned(a):
    """What the trained crew does, beside what the hand-written chiefs do.

    The score says the crew is better. It does not say how, and "how" is the only part that
    transfers to the next world. Three families of probe, all on the exam worlds:
      per drop     -- when a bucket is thrown, onto how much fire, how far from the village
      per decision -- what the commander names as a target, and whether fire is even there
      the endgame  -- decisions taken with the fire nearly out, where the episode can be ended
      the threat   -- decisions taken while fire burns within VTHREAT of the village centre
    """
    device = torch.device(a.device)
    seeds = range(1000, 1000 + a.eval_worlds)
    rows = {}
    for mode in ("nearest", "guard", "densest"):
        rows[mode] = probe(dispatcher(mode), seeds, a.K)
        print(f"  {mode} done")
    for p in sorted(OUT.glob("*.pt")):
        rows[p.stem] = probe(greedy_pick(load_crew(p, device), device), seeds, a.K)
        print(f"  {p.stem} done")

    order = list(rows)
    FIELDS = [
        ("episode", None, None),
        ("village cells lost /9", "village", "{:.2f}"),
        ("all nine saved", "saved", "{:.0%}"),
        ("cells burnt", "burnt", "{:.1f}"),
        ("steps", "steps", "{:.1f}"),
        ("ran out of time", "truncated", "{:.0%}"),
        ("per drop", None, None),
        ("buckets thrown", "drops", "{:.2f}"),
        ("first one at step", "first_drop", "{:.1f}"),
        ("cells hit per drop", "hit", "{:.2f}"),
        ("drops that hit nothing", "dry", "{:.0%}"),
        ("cells burning when it lands", "alight_at_drop", "{:.1f}"),
        ("cells on the fire's edge under it", "edge", "{:.1f}"),
        ("   ... on the drops that hit nothing", "edge_dry", "{:.1f}"),
        ("distance from the village", "drop_dv", "{:.1f}"),
        ("drops touching the village", "on_village", "{:.0%}"),
        ("per decision", None, None),
        ("decisions", "decisions", "{:.1f}"),
        ("target is itself burning", "on_fire", "{:.0%}"),
        ("drop square covers fire", "covers", "{:.0%}"),
        ("cells to the nearest fire", "reach", "{:.1f}"),
        ("target's distance from village", "tgt_dv", "{:.1f}"),
        ("the endgame (1-6 cells alight)", None, None),
        ("such decisions", "endgame_n", "{:.1f}"),
        ("aimed at the last fire", "endgame_covers", "{:.0%}"),
        ("the village threatened", None, None),
        ("such decisions", "threat_n", "{:.1f}"),
        ("answered it", "threat_answers", "{:.0%}"),
    ]
    w = max(len(f[0]) for f in FIELDS) + 2
    print("\n  " + " " * w + "".join(f"{k.replace('dqn_values_1M_', 'dqn '):>16s}" for k in order))
    for label, key, fmt in FIELDS:
        if key is None:
            print(f"\n  {label}")
            continue
        print(f"  {label:{w}s}" + "".join(f"{fmt.format(rows[k][key]):>16s}" for k in order))
    save(f"learned_K{a.K}", dict(kind="learned", K=a.K, worlds=a.eval_worlds, vthreat=VTHREAT, rows=rows))


def where_won(a):
    """Is the win spread over the exam, or does it live in a handful of worlds?

    The cobra page asked whether a number was local. The same question applies to an advantage:
    a mean of -0.42 village cells could be a small edge everywhere or a rout in ten worlds.
    """
    device = torch.device(a.device)
    seeds = list(range(1000, 1000 + a.eval_worlds))
    chief = per_world(dispatcher("guard"), seeds, a.K)
    print(f"  {'crew':24s} {'worlds better':>14s} {'same':>7s} {'worse':>7s} {'gap':>8s} "
          f"{'top-10 share':>13s} {'worst world':>12s}")
    out = {}
    for p in sorted(OUT.glob("*.pt")):
        crew = per_world(greedy_pick(load_crew(p, device), device), seeds, a.K)
        d = crew - chief
        tot = d.sum()
        top = np.sort(d)[:10].sum()
        out[p.stem] = dict(better=int((d < 0).sum()), same=int((d == 0).sum()), worse=int((d > 0).sum()),
                           gap=round(float(d.mean()), 3), top10_share=round(float(top / tot), 3),
                           worst=round(float(d.max()), 1),
                           crew_mean=round(float(crew.mean()), 3), chief_mean=round(float(chief.mean()), 3),
                           # the gaps themselves, sorted, so a figure can show the shape and not the mean
                           sorted_gap=[int(x) for x in np.sort(d)])
        r = out[p.stem]
        print(f"  {p.stem:24s} {r['better']:14d} {r['same']:7d} {r['worse']:7d} {r['gap']:+8.2f} "
              f"{r['top10_share']:12.0%} {r['worst']:+12.1f}")
    save(f"where_won_K{a.K}", dict(kind="where_won", K=a.K, worlds=a.eval_worlds,
                                   chief="guard", rows=out))


def shield(a):
    """Take the wetting out of a drop and re-run the exam.

    WET is read as a global inside Wildfire.step, and the environment lives in the namespace the
    shipped preamble was exec'd into -- so setting G["WET"] = 0 is the whole ablation: a drop still
    un-burns every burning cell under it, and no longer leaves the square wet. The hand-written
    chiefs are the control. They aim at fire, so the wetting is a side effect for them; if it is
    the crew's mechanism, only the crew should fall over.
    """
    device = torch.device(a.device)
    seeds = range(1000, 1000 + a.eval_worlds)
    picks = {m: dispatcher(m) for m in ("nearest", "guard", "densest")}
    for p in sorted(OUT.glob("*.pt")):
        picks[p.stem] = greedy_pick(load_crew(p, device), device)

    rows, wet0 = {}, G["WET"]
    for name, pick in picks.items():
        out = {}
        for tag, wet in (("shipped", wet0), ("no shield", 0.0)):
            G["WET"] = wet
            v = per_world(pick, seeds, a.K)
            b = per_world(pick, seeds, a.K, field="burnt")
            out[tag] = (float(v.mean()), float(b.mean()), v)
        G["WET"] = wet0
        d = out["no shield"][2] - out["shipped"][2]
        se = 2 * d.std(ddof=1) / np.sqrt(a.eval_worlds)
        rows[name] = dict(village=round(out["shipped"][0], 3), village_dry=round(out["no shield"][0], 3),
                          burnt=round(out["shipped"][1], 1), burnt_dry=round(out["no shield"][1], 1),
                          cost=round(float(d.mean()), 3), se2=round(float(se), 3))
        r = rows[name]
        print(f"  {name:22s} village {r['village']:5.2f} -> {r['village_dry']:5.2f}  "
              f"({r['cost']:+.2f} +/-{r['se2']:.2f})   burnt {r['burnt']:6.1f} -> {r['burnt_dry']:6.1f}")
    save(f"shield_K{a.K}", dict(kind="shield", K=a.K, worlds=a.eval_worlds, wet=wet0, rows=rows))


def snap_to_fire(pick):
    "The crew's own target, moved onto the nearest burning cell (Chebyshev: the drop is a square)."
    def p(env):
        t = int(pick(env))
        tr, tc = divmod(t, N)
        fire = np.argwhere(env.S == BURNING)
        if not len(fire):
            return t
        f = fire[np.abs(fire - np.array([tr, tc])).max(1).argmin()]
        return int(f[0] * N + f[1])
    return p


def snap(a):
    """Every saved crew, as trained and with its aim snapped onto the fire.

    A caveat that belongs with the number: snapping changes the whole trajectory, so this is not a
    per-decision counterfactual. It answers "is a crew that aims like a chief still better than a
    chief", not "what would this one decision have cost".
    """
    device = torch.device(a.device)
    rows = {}
    for mode in ("guard", "nearest"):
        rows[mode] = command(dispatcher(mode), n=a.eval_worlds, K=a.K)
        print(f"  {mode:22s} {rows[mode]['village_damaged']:5.2f} village  {rows[mode]['ret']:7.1f} return")
    for p in sorted(OUT.glob("*.pt")):
        pick = greedy_pick(load_crew(p, device), device)
        for tag, q in ((p.stem, pick), (p.stem + " snapped", snap_to_fire(pick))):
            rows[tag] = command(q, n=a.eval_worlds, K=a.K)
            print(f"  {tag:22s} {rows[tag]['village_damaged']:5.2f} village  {rows[tag]['ret']:7.1f} return  "
                  f"{rows[tag]['burnt']:6.1f} burnt")
    save(f"snap_K{a.K}", dict(kind="snap", K=a.K, worlds=a.eval_worlds, rows=rows))


def figure(a):
    """Write results/wildfire/{shield,snap,where_won}_K*.json into the ShieldLab data module."""
    need = [f"shield_K{a.K}", f"snap_K{a.K}", f"where_won_K{a.K}", f"learned_K{a.K}"]
    have = {}
    for tag in need:
        p = OUT / f"{tag}.json"
        if not p.exists():
            raise SystemExit(f"missing {p.relative_to(ROOT)} -- run `{tag.split('_K')[0].replace('_', '-')}` first")
        have[tag] = json.loads(p.read_text())

    sh, sn, ww, le = (have[t] for t in need)
    crews = sorted(k for k in sh["rows"] if k.endswith(tuple("0123456789")) and k.startswith("dqn"))
    chiefs = ["guard", "nearest", "densest"]

    def label(k):
        return f"DQN seed {k[-1]}" if k.startswith("dqn") else k

    rows = []
    for k in chiefs + crews:
        crew = k in crews
        rows.append(dict(
            key=k, label=label(k), crew=crew,
            trained=sh["rows"][k]["village"],
            # A chief already aims at the nearest fire, so snapping it there is the identity. The
            # middle column is drawn flat for them on purpose, and that is the control.
            snapped=sn["rows"][f"{k} snapped"]["village_damaged"] if crew else sh["rows"][k]["village"],
            dry=sh["rows"][k]["village_dry"],
            dryCost=sh["rows"][k]["cost"], drySe=sh["rows"][k]["se2"],
            onFire=round(le["rows"][k]["on_fire"], 3),
            reach=round(le["rows"][k]["reach"], 2),
        ))

    gaps = [dict(key=k, label=label(k), gap=v["gap"], better=v["better"], same=v["same"],
                 worse=v["worse"], sorted=v["sorted_gap"]) for k, v in sorted(ww["rows"].items())]

    head = [
        "// Generated by scripts/wildfire_train.py figure. Do not edit by hand.",
        "// Two ablations and one distribution, all on the 200 exam worlds (seeds 1000-1199).",
        "//   trained  the policy as it is scored everywhere else in this chapter",
        "//   snapped  the SAME policy, its chosen target slid onto the nearest burning cell",
        "//   dry      the shipped policy in a world where a drop no longer wets the square it lands on",
        "// A chief always aims at fire already, so `snapped` is the identity for the three of them.",
        "export type Ablation = { key: string; label: string; crew: boolean; trained: number; snapped: number;"
        " dry: number; dryCost: number; drySe: number; onFire: number; reach: number };",
        "export type Gap = { key: string; label: string; gap: number; better: number; same: number;"
        " worse: number; sorted: number[] };",
        "",
        "export const ABLATION: Ablation[] = " + json.dumps(rows, indent=1) + ";",
        "",
        "// Per-world village damage, crew minus the guard chief, sorted. Negative = the crew did better.",
        "export const GAPS: Gap[] = " + json.dumps(gaps, indent=1) + ";",
        "",
        "export const CHIEF = " + json.dumps(dict(village=sh["rows"]["guard"]["village"],
                                                 dry=sh["rows"]["guard"]["village_dry"]), indent=1) + ";",
        "",
    ]
    dst = ROOT / "src" / "components" / "fire" / "data" / "whatLearned.ts"
    dst.write_text("\n".join(head), encoding="utf-8")
    print(f"  wrote {dst.relative_to(ROOT)}  ({len(rows)} policies, {len(gaps)} crews)")


def version(a):
    """Which copy of this trainer is this? Run it first on any machine you upload to.

    Twice a batch has come back from an older copy whose DQN arm ran 1-step with a 50k replay,
    and nothing caught it until the configs were read by hand. Checking with `--help | grep`
    needs grep to exist and the pipe to survive, so an empty answer could mean a stale file OR a
    shell that has no grep. This cannot be ambiguous: it always prints a verdict.
    """
    have = {k: hasattr(a, k) for k in ("nstep", "dueling", "replay")}
    ok = all(have.values()) and a.replay >= 200_000 and a.nstep >= 2 and a.dueling
    print(f"wildfire_train.py  TRAINER v{TRAINER}")
    print(f"  DQN arm: nstep={getattr(a, 'nstep', 'MISSING')}  "
          f"dueling={getattr(a, 'dueling', 'MISSING')}  replay={getattr(a, 'replay', 'MISSING')}")
    print("  CURRENT: results from this copy belong in the race."
          if ok else "  STALE OR RETUNED: do not race results from this copy.")
    return 0 if ok else 1


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("cmd", choices=["dqn", "ppo", "baselines", "race", "report", "curves", "paired",
                                   "learned", "where-won", "shield", "snap", "figure", "version"])
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
    elif a.cmd == "paired":
        paired(a)
    elif a.cmd == "learned":
        learned(a)
    elif a.cmd == "where-won":
        where_won(a)
    elif a.cmd == "shield":
        shield(a)
    elif a.cmd == "snap":
        snap(a)
    elif a.cmd == "figure":
        figure(a)
    elif a.cmd == "version":
        raise SystemExit(version(a))
    else:
        report(a)
    print(f"\n({time.time() - t0:.1f}s)")


if __name__ == "__main__":
    main()
