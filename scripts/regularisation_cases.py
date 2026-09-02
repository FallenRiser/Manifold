"""
regularisation_cases.py -- measured numbers for the Regularisation track
(sixth and final track of the neural networks family).

Every quantitative claim in the track comes from here. The design principle
that a previous session learned the hard way: you cannot demonstrate a
regulariser on a problem that does not overfit. So this script deliberately
builds a setup with a LARGE train-test gap -- a high-capacity MLP on a small,
noisy, moderately high-dimensional classification problem -- and then measures
how each regulariser closes that gap.

Run:  python scripts/regularisation_cases.py
Env:  python 3.13 / torch 2.11 / sklearn 1.8 / numpy 2.3  (CPU is fine)
"""

import numpy as np
import torch
import torch.nn as nn
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

torch.set_num_threads(4)
DEVICE = "cpu"


def rule(title):
    print("\n" + "=" * 74)
    print(title)
    print("=" * 74)


# --------------------------------------------------------------------------
# The dataset: deliberately overfittable.
#  - 50 features, only 10 informative -> lots of room to memorise noise
#  - 10% label noise (flip_y) -> a ceiling below 1.0 that memorisation blows past
#  - only 250 training points against a big network -> guaranteed gap
# --------------------------------------------------------------------------
def make_data(seed=0):
    X, y = make_classification(
        n_samples=1250, n_features=50, n_informative=10, n_redundant=10,
        n_clusters_per_class=2, flip_y=0.10, class_sep=1.0, random_state=seed,
    )
    Xtr, Xte, ytr, yte = train_test_split(X, y, train_size=250, test_size=1000,
                                          random_state=seed, stratify=y)
    sc = StandardScaler().fit(Xtr)
    Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)
    t = lambda a, d: torch.tensor(a, dtype=d, device=DEVICE)
    return (t(Xtr, torch.float32), t(ytr, torch.long),
            t(Xte, torch.float32), t(yte, torch.long))


class MLP(nn.Module):
    def __init__(self, d_in=50, width=256, depth=3, dropout=0.0, bn=False):
        super().__init__()
        layers, d = [], d_in
        for _ in range(depth):
            layers.append(nn.Linear(d, width))
            if bn:
                layers.append(nn.BatchNorm1d(width))
            layers.append(nn.ReLU())
            if dropout > 0:
                layers.append(nn.Dropout(dropout))
            d = width
        layers.append(nn.Linear(d, 2))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


def train(model, Xtr, ytr, Xte, yte, epochs=400, wd=0.0, lr=1e-3,
          l2_in_loss=0.0, label_smooth=0.0, jitter=0.0, mixup=0.0,
          decoupled=True, track_val=False, seed=0):
    """Full-batch AdamW (decoupled weight decay) unless decoupled=False.
    Returns dict with train/test accuracy, and optionally the early-stopping
    epoch and the test accuracy at best validation loss."""
    torch.manual_seed(seed)
    if decoupled:
        opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=wd)
    else:
        opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=wd)
    lossf = nn.CrossEntropyLoss(label_smoothing=label_smooth)

    # a validation split carved from train, only used when track_val
    n = Xtr.shape[0]
    if track_val:
        idx = torch.randperm(n)
        vcut = int(n * 0.3)
        vi, ti = idx[:vcut], idx[vcut:]
        Xv, yv = Xtr[vi], ytr[vi]
        Xt, yt = Xtr[ti], ytr[ti]
    else:
        Xt, yt = Xtr, ytr

    best_val, best_state, best_epoch = 1e9, None, -1
    for ep in range(epochs):
        model.train()
        xb, yb = Xt, yt
        if jitter > 0:
            xb = xb + jitter * torch.randn_like(xb)
        if mixup > 0:
            lam = np.random.beta(mixup, mixup)
            perm = torch.randperm(xb.shape[0])
            xb = lam * xb + (1 - lam) * xb[perm]
            opt.zero_grad()
            out = model(xb)
            loss = lam * lossf(out, yb) + (1 - lam) * lossf(out, yb[perm])
        else:
            opt.zero_grad()
            out = model(xb)
            loss = lossf(out, yb)
        if l2_in_loss > 0:
            l2 = sum((p ** 2).sum() for p in model.parameters())
            loss = loss + l2_in_loss * l2
        loss.backward()
        opt.step()

        if track_val:
            model.eval()
            with torch.no_grad():
                vl = lossf(model(Xv), yv).item()
            if vl < best_val:
                best_val, best_epoch = vl, ep
                best_state = {k: v.clone() for k, v in model.state_dict().items()}

    def acc(X, y):
        model.eval()
        with torch.no_grad():
            return (model(X).argmax(1) == y).float().mean().item()

    res = {"train": acc(Xtr, ytr), "test": acc(Xte, yte)}
    if track_val:
        res["end_test"] = res["test"]
        model.load_state_dict(best_state)
        res["best_epoch"] = best_epoch
        res["best_val_test"] = acc(Xte, yte)
    return res


def avg(fn, seeds=(0, 1, 2)):
    keys = None
    acc = {}
    for s in seeds:
        r = fn(s)
        keys = keys or r.keys()
        for k in keys:
            acc.setdefault(k, []).append(r[k])
    return {k: float(np.mean(v)) for k, v in acc.items()}


# --------------------------------------------------------------------------
# Extra apparatus for the weight-decay sections: an SGD trainer (the classic
# L2 regime) and a small regression net (where weight decay shows the textbook
# bias-variance tradeoff most cleanly).
# --------------------------------------------------------------------------
def train_sgd(model, Xtr, ytr, Xte, yte, wd=0.0, epochs=800, lr=0.05,
              mom=0.9, batch=32, seed=0):
    torch.manual_seed(seed)
    opt = torch.optim.SGD(model.parameters(), lr=lr, momentum=mom, weight_decay=wd)
    lossf = nn.CrossEntropyLoss()
    n = Xtr.shape[0]
    for ep in range(epochs):
        model.train()
        perm = torch.randperm(n)
        for i in range(0, n, batch):
            idx = perm[i:i + batch]
            opt.zero_grad()
            lossf(model(Xtr[idx]), ytr[idx]).backward()
            opt.step()

    def acc(X, y):
        model.eval()
        with torch.no_grad():
            return (model(X).argmax(1) == y).float().mean().item()
    return {"train": acc(Xtr, ytr), "test": acc(Xte, yte)}


class RegMLP(nn.Module):
    def __init__(self, width=256, depth=3):
        super().__init__()
        layers, d = [], 1
        for _ in range(depth):
            layers += [nn.Linear(d, width), nn.ReLU()]
            d = width
        layers.append(nn.Linear(d, 1))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


def make_reg(seed=0):
    """60 noisy samples of a smooth 1-D target. Few points + a wide net = the
    net will happily fit the noise unless something holds its weights back."""
    rng = np.random.RandomState(seed)
    Xtr = rng.uniform(-3, 3, (60, 1)).astype(np.float32)
    f = lambda x: np.sin(1.5 * x) + 0.3 * x
    ytr = (f(Xtr) + rng.normal(0, 0.3, Xtr.shape)).astype(np.float32)
    Xte = np.linspace(-3, 3, 400).reshape(-1, 1).astype(np.float32)
    yte = f(Xte).astype(np.float32)  # clean target = the thing to generalise to
    t = lambda a: torch.tensor(a)
    return t(Xtr), t(ytr), t(Xte), t(yte)


def train_reg(wd=0.0, epochs=3000, lr=1e-3, seed=0):
    torch.manual_seed(seed)
    Xtr, ytr, Xte, yte = make_reg(seed)
    m = RegMLP()
    opt = torch.optim.AdamW(m.parameters(), lr=lr, weight_decay=wd)
    lossf = nn.MSELoss()
    for ep in range(epochs):
        m.train()
        opt.zero_grad()
        lossf(m(Xtr), ytr).backward()
        opt.step()
    m.eval()
    with torch.no_grad():
        return {"train": lossf(m(Xtr), ytr).item(), "test": lossf(m(Xte), yte).item()}


# ==========================================================================
rule("SECTION 1: The gap -- a network that overfits")
# ==========================================================================
print("High-capacity MLP (3x256), 250 training points, 50 feats, 10% label noise.")
print("This is the problem the whole track uses. It MUST overfit or nothing")
print("below is demonstrable.\n")

def baseline(seed):
    Xtr, ytr, Xte, yte = make_data(seed)
    m = MLP(depth=3, width=256).to(DEVICE)
    return train(m, Xtr, ytr, Xte, yte, epochs=400, wd=0.0, seed=seed)

r = avg(baseline)
print(f"  baseline (no regularisation):  train {r['train']:.3f}  "
      f"test {r['test']:.3f}  gap {r['train']-r['test']:.3f}")

print("\nCapacity vs gap (no regularisation):")
print("  depth x width      train    test     gap")
print("  " + "-" * 46)
for depth, width in [(1, 32), (2, 64), (3, 256), (4, 512)]:
    def cap(seed, d=depth, w=width):
        Xtr, ytr, Xte, yte = make_data(seed)
        m = MLP(depth=d, width=w).to(DEVICE)
        return train(m, Xtr, ytr, Xte, yte, epochs=400, seed=seed)
    rr = avg(cap)
    tag = f"{depth} x {width}"
    print(f"  {tag:<16} {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")


# ==========================================================================
rule("SECTION 2: Weight decay -- where it works, and where it does not")
# ==========================================================================
print("Weight decay penalises large weights. Its effect is clearest when weight")
print("MAGNITUDE is the thing that controls overfitting -- which is not always")
print("the case. Three measurements make the honest picture.\n")

print("2a) Regression, AdamW: the textbook bias-variance tradeoff.")
print("    A wide net on 60 noisy points of a smooth 1-D target. As decay rises,")
print("    train MSE goes UP (less fitting of noise) and test MSE goes DOWN.")
print("    weight_decay   train_mse   test_mse")
print("    " + "-" * 42)
for wd in [0.0, 1e-4, 1e-3, 1e-2, 3e-2, 1e-1, 3e-1]:
    rr = avg(lambda seed, wd=wd: train_reg(wd=wd, seed=seed))
    print(f"    {wd:<12.4f}   {rr['train']:.4f}     {rr['test']:.4f}")

print("\n2b) Classification, SGD+momentum: decay closes the gap.")
print("    The same overfitting classifier, trained with plain SGD (batch 32).")
print("    weight_decay   train    test     gap")
print("    " + "-" * 42)
for wd in [0.0, 1e-4, 1e-3, 5e-3, 1e-2, 5e-2]:
    def f(seed, wd=wd):
        Xtr, ytr, Xte, yte = make_data(seed)
        m = MLP(depth=3, width=256).to(DEVICE)
        return train_sgd(m, Xtr, ytr, Xte, yte, wd=wd, seed=seed)
    rr = avg(f)
    print(f"    {wd:<12.4f}   {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")

print("\n2c) Classification, full-batch AdamW: the honest null result.")
print("    The SAME sweep under full-batch AdamW barely moves test accuracy --")
print("    only ~400 steps, so per-step decay lr*wd*w never compounds enough,")
print("    and the net memorises the 250 points with SMALL weights anyway.")
print("    weight_decay   train    test     gap")
print("    " + "-" * 42)
for wd in [0.0, 1e-2, 1e-1]:
    def f(seed, wd=wd):
        Xtr, ytr, Xte, yte = make_data(seed)
        m = MLP(depth=3, width=256).to(DEVICE)
        return train(m, Xtr, ytr, Xte, yte, epochs=400, wd=wd, seed=seed)
    rr = avg(f)
    print(f"    {wd:<12.4f}   {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")


# ==========================================================================
rule("SECTION 3: Weight decay is not L2 (with Adam)")
# ==========================================================================
print("For adaptive optimisers, decoupled weight decay (AdamW) and adding an")
print("L2 term to the loss (Adam) are NOT the same update. Measured, same net,")
print("same nominal strength 1e-3.\n")

def adamw(seed):
    Xtr, ytr, Xte, yte = make_data(seed)
    m = MLP(depth=3, width=256).to(DEVICE)
    return train(m, Xtr, ytr, Xte, yte, epochs=400, wd=1e-3, decoupled=True, seed=seed)

def adam_l2(seed):
    Xtr, ytr, Xte, yte = make_data(seed)
    m = MLP(depth=3, width=256).to(DEVICE)
    return train(m, Xtr, ytr, Xte, yte, epochs=400, wd=0.0, l2_in_loss=1e-3,
                 decoupled=False, seed=seed)

ra, rl = avg(adamw), avg(adam_l2)
print(f"  AdamW decoupled wd=1e-3 :  train {ra['train']:.3f}  test {ra['test']:.3f}  gap {ra['train']-ra['test']:.3f}")
print(f"  Adam + L2 in loss 1e-3  :  train {rl['train']:.3f}  test {rl['test']:.3f}  gap {rl['train']-rl['test']:.3f}")
print("  (The two differ because Adam scales the L2 gradient by the per-parameter")
print("   adaptive rate, while AdamW applies decay uniformly.)")


# ==========================================================================
rule("SECTION 4: Dropout -- sweeping the rate")
# ==========================================================================
print("Dropout after each hidden ReLU, 3x256 net, no weight decay. Sweep p.\n")
print("  dropout p    train    test     gap")
print("  " + "-" * 40)
do_rows = []
for p in [0.0, 0.1, 0.2, 0.3, 0.5, 0.7]:
    def f(seed, p=p):
        Xtr, ytr, Xte, yte = make_data(seed)
        m = MLP(depth=3, width=256, dropout=p).to(DEVICE)
        return train(m, Xtr, ytr, Xte, yte, epochs=400, seed=seed)
    rr = avg(f)
    do_rows.append((p, rr))
    print(f"  {p:<10.2f}   {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")
best_do = max(do_rows, key=lambda x: x[1]["test"])
print(f"\n  best test at dropout={best_do[0]}: test {best_do[1]['test']:.3f} "
      f"(gap {best_do[1]['train']-best_do[1]['test']:.3f})")


# ==========================================================================
rule("SECTION 5: Dropout at test time -- the scaling")
# ==========================================================================
print("At test, dropout is turned OFF and activations are used at full strength")
print("(inverted dropout already scaled them up during training). Using dropout")
print("at test (MC-dropout) instead gives a NOISY, non-deterministic prediction.\n")
Xtr, ytr, Xte, yte = make_data(0)
m = MLP(depth=3, width=256, dropout=0.5).to(DEVICE)
train(m, Xtr, ytr, Xte, yte, epochs=400, seed=0)
m.eval()
with torch.no_grad():
    det = (m(Xte).argmax(1) == yte).float().mean().item()
# MC-dropout: keep dropout ON at test, average many stochastic passes
m.train()
mc_accs = []
with torch.no_grad():
    logits_sum = torch.zeros(Xte.shape[0], 2)
    for _ in range(50):
        out = m(Xte)
        mc_accs.append((out.argmax(1) == yte).float().mean().item())
        logits_sum += out
    mc_avg = (logits_sum.argmax(1) == yte).float().mean().item()
print(f"  eval() deterministic test acc      : {det:.3f}")
print(f"  single MC-dropout pass (stochastic): mean {np.mean(mc_accs):.3f} "
      f"std {np.std(mc_accs):.3f}  (varies run to run)")
print(f"  50-pass MC-dropout average         : {mc_avg:.3f}")


# ==========================================================================
rule("SECTION 6: Early stopping")
# ==========================================================================
print("Track a held-out validation error while training; keep the weights at its")
print("minimum. Early stopping is clearest when test error OVER-FITS OVER TIME --")
print("bottoms out, then climbs as training continues.\n")

print("6a) Regression: the clean overfitting-over-time curve.")
print("    The wide net on 80 noisy points, 56 train / 24 val, Adam, 4000 epochs,")
print("    tracking validation MSE. 5-seed average.")

def reg_es(seed, epochs=4000, lr=1e-3):
    torch.manual_seed(seed)
    rng = np.random.RandomState(seed)
    X = rng.uniform(-3, 3, (80, 1)).astype(np.float32)
    f = lambda x: np.sin(1.5 * x) + 0.3 * x
    y = (f(X) + rng.normal(0, 0.3, X.shape)).astype(np.float32)
    from sklearn.model_selection import train_test_split as _tts
    Xtr, Xv, ytr, yv = _tts(X, y, train_size=56, random_state=seed)
    Xte = np.linspace(-3, 3, 400).reshape(-1, 1).astype(np.float32)
    yte = f(Xte).astype(np.float32)
    tt = lambda a: torch.tensor(a)
    Xtr, ytr, Xv, yv, Xte, yte = tt(Xtr), tt(ytr), tt(Xv), tt(yv), tt(Xte), tt(yte)
    m = RegMLP()
    opt = torch.optim.Adam(m.parameters(), lr=lr)
    lossf = nn.MSELoss()
    best_val, best_state, best_ep = 1e9, None, -1
    for ep in range(epochs):
        m.train(); opt.zero_grad(); lossf(m(Xtr), ytr).backward(); opt.step()
        if ep % 5 == 0:
            m.eval()
            with torch.no_grad():
                vl = lossf(m(Xv), yv).item()
            if vl < best_val:
                best_val, best_ep = vl, ep
                best_state = {k: v.clone() for k, v in m.state_dict().items()}
    end_state = {k: v.clone() for k, v in m.state_dict().items()}
    def te(st):
        m.load_state_dict(st); m.eval()
        with torch.no_grad():
            return lossf(m(Xte), yte).item()
    return {"best_epoch": best_ep, "best_val_test": te(best_state), "end_test": te(end_state)}

rr = avg(reg_es, seeds=(0, 1, 2, 3, 4))
print(f"    best-val epoch (avg)   : {rr['best_epoch']:.0f} of 4000")
print(f"    test MSE at best-val   : {rr['best_val_test']:.4f}")
print(f"    test MSE at end        : {rr['end_test']:.4f}")
print(f"    early stopping saves   : {rr['end_test']-rr['best_val_test']:+.4f} MSE\n")

print("6b) Classification: stop on the RIGHT metric.")
print("    On the overfitting classifier, validation LOSS and validation ACCURACY")
print("    disagree: the loss bottoms almost immediately (the net gets over-")
print("    confident on the label noise) while test accuracy keeps drifting up.")

def train_es_sgd(seed, epochs=600, lr=0.05, mom=0.9, batch=32):
    """Minibatch SGD with validation tracking: the regime where the val curve
    has a real minimum and late training genuinely over-trains."""
    torch.manual_seed(seed)
    Xtr, ytr, Xte, yte = make_data(seed)
    n = Xtr.shape[0]
    idx = torch.randperm(n)
    vcut = int(n * 0.3)
    Xv, yv = Xtr[idx[:vcut]], ytr[idx[:vcut]]
    Xt, yt = Xtr[idx[vcut:]], ytr[idx[vcut:]]
    m = MLP(depth=3, width=256).to(DEVICE)
    opt = torch.optim.SGD(m.parameters(), lr=lr, momentum=mom)
    lossf = nn.CrossEntropyLoss()
    best_val, best_state, best_epoch = 1e9, None, -1
    nt = Xt.shape[0]
    for ep in range(epochs):
        m.train()
        perm = torch.randperm(nt)
        for i in range(0, nt, batch):
            j = perm[i:i + batch]
            opt.zero_grad()
            lossf(m(Xt[j]), yt[j]).backward()
            opt.step()
        m.eval()
        with torch.no_grad():
            vl = lossf(m(Xv), yv).item()
        if vl < best_val:
            best_val, best_epoch = vl, ep
            best_state = {k: v.clone() for k, v in m.state_dict().items()}
    def acc(st):
        m.load_state_dict(st)
        m.eval()
        with torch.no_grad():
            return (m(Xte).argmax(1) == yte).float().mean().item()
    end_state = {k: v.clone() for k, v in m.state_dict().items()}
    return {"best_epoch": best_epoch, "best_val_test": acc(best_state),
            "end_test": acc(end_state)}

re = avg(train_es_sgd)
print(f"  best validation epoch (avg)   : {re['best_epoch']:.0f} of 600")
print(f"  test acc at best-val weights   : {re['best_val_test']:.3f}")
print(f"  test acc after full 600 epochs : {re['end_test']:.3f}")
print(f"  early stopping recovers        : {re['best_val_test']-re['end_test']:+.3f}")


# ==========================================================================
rule("SECTION 7: Data augmentation (input jitter)")
# ==========================================================================
print("The tabular analogue of augmentation: add fresh Gaussian noise to inputs")
print("every epoch, so the network never sees the same 250 points twice.\n")
print("  jitter std   train    test     gap")
print("  " + "-" * 40)
for j in [0.0, 0.05, 0.1, 0.2, 0.4]:
    def f(seed, j=j):
        Xtr, ytr, Xte, yte = make_data(seed)
        m = MLP(depth=3, width=256).to(DEVICE)
        return train(m, Xtr, ytr, Xte, yte, epochs=400, jitter=j, seed=seed)
    rr = avg(f)
    print(f"  {j:<10.2f}   {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")


# ==========================================================================
rule("SECTION 8: Label smoothing and mixup")
# ==========================================================================
print("Label smoothing softens the one-hot target; mixup trains on convex blends")
print("of pairs of points and their labels. Both discourage overconfidence.\n")
print("  method              train    test     gap")
print("  " + "-" * 48)
def ls_run(seed, s):
    Xtr, ytr, Xte, yte = make_data(seed)
    m = MLP(depth=3, width=256).to(DEVICE)
    return train(m, Xtr, ytr, Xte, yte, epochs=400, label_smooth=s, seed=seed)
for s in [0.0, 0.05, 0.1, 0.2]:
    rr = avg(lambda seed, s=s: ls_run(seed, s))
    print(f"  label_smooth={s:<6.2f}   {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")
def mix_run(seed, a):
    Xtr, ytr, Xte, yte = make_data(seed)
    m = MLP(depth=3, width=256).to(DEVICE)
    return train(m, Xtr, ytr, Xte, yte, epochs=400, mixup=a, seed=seed)
for a in [0.2, 0.4, 1.0]:
    rr = avg(lambda seed, a=a: mix_run(seed, a))
    print(f"  mixup alpha={a:<7.2f}   {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")


# ==========================================================================
rule("SECTION 9: Combining regularisers + BatchNorm as implicit reg")
# ==========================================================================
print("Do the effects stack? Best single vs a sensible combination.\n")

configs = {
    "none":                    dict(),
    "weight_decay 1e-2":       dict(wd=1e-2),
    "dropout 0.3":             dict(dropout=0.3),
    "wd + dropout":            dict(wd=1e-2, dropout=0.3),
    "wd + dropout + jitter":   dict(wd=1e-2, dropout=0.3, jitter=0.1),
}
print("  config                    train    test     gap")
print("  " + "-" * 52)
for name, cfg in configs.items():
    dp = cfg.get("dropout", 0.0)
    def f(seed, cfg=cfg, dp=dp):
        Xtr, ytr, Xte, yte = make_data(seed)
        m = MLP(depth=3, width=256, dropout=dp).to(DEVICE)
        return train(m, Xtr, ytr, Xte, yte, epochs=400,
                     wd=cfg.get("wd", 0.0), jitter=cfg.get("jitter", 0.0), seed=seed)
    rr = avg(f)
    print(f"  {name:<24} {rr['train']:.3f}   {rr['test']:.3f}   {rr['train']-rr['test']:.3f}")

print("\nBatchNorm as implicit regularisation (no other reg):")
for bn in [False, True]:
    def f(seed, bn=bn):
        Xtr, ytr, Xte, yte = make_data(seed)
        m = MLP(depth=3, width=256, bn=bn).to(DEVICE)
        return train(m, Xtr, ytr, Xte, yte, epochs=400, seed=seed)
    rr = avg(f)
    print(f"  batchnorm={str(bn):<5}  train {rr['train']:.3f}  test {rr['test']:.3f}  gap {rr['train']-rr['test']:.3f}")

print("\nDONE.")
