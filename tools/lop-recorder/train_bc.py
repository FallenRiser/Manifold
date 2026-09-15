"""Behaviour-cloning baseline, built so the architecture is MEASURED, not asserted.

    python train_bc.py --val 041924 --exclude 040617                 # one run
    python train_bc.py --val 041924 --exclude 040617 --sweep depth   # the ladder

Every run appends one row to results.jsonl, so a ladder is a loop, not a rewrite.

HOW THE ARCHITECTURE IS CHOSEN (this is the point of the file):

  Default = the DQN "Nature" CNN: conv 32@8x8/4, 64@4x4/2, 64@3x3/1, then a
  512-unit head. Not because three layers is magic, but because it is the
  best-tested prior for "pixels in, discrete actions out, in real time", so it
  is the sensible thing to deviate FROM.

  Ceiling from above: the perfect-guard window. Whatever the see-think-act chain
  cannot fit inside it is useless however accurate. So every run reports its
  batch-1 forward latency next to its accuracy.

  Floor from below: the data. ~28k samples but only a few hundred parries, and
  neighbouring frames are near-duplicates, so the independent sample count is far
  smaller than it looks. Capacity past a few blocks buys overfitting.

  SELECTION RULE, fixed in advance so the choice cannot be rationalised after
  seeing the numbers: take the SMALLEST model whose validation parry AP is within
  one standard deviation (across seeds) of the best, and whose latency fits the
  budget.

METRICS: accuracy is meaningless at a 0.9% positive rate (predict all-zeros and
score 99.1%). We report average precision per action against a base-rate
baseline, which is what AP of a coin-flip-at-the-base-rate looks like.
"""

import argparse
import json
import os
import time

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import average_precision_score

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "..", "data", "lop", "processed", "dataset.npz")


class Net(nn.Module):
    """Nature-CNN by default; blocks/width are the knobs the ladder turns."""

    def __init__(self, n_out, stack, h, w, blocks=3, width=1.0, head=512):
        super().__init__()
        spec = [(32, 8, 4), (64, 4, 2), (64, 3, 1), (64, 3, 1)][:blocks]
        layers, c_in = [], stack
        for c, k, s in spec:
            c = max(8, int(c * width))
            layers += [nn.Conv2d(c_in, c, k, s), nn.ReLU(inplace=True)]
            c_in = c
        self.conv = nn.Sequential(*layers)
        with torch.no_grad():
            n_flat = self.conv(torch.zeros(1, stack, h, w)).numel()
        self.head = nn.Sequential(nn.Flatten(), nn.Linear(n_flat, head),
                                  nn.ReLU(inplace=True), nn.Linear(head, n_out))
        self.n_flat = n_flat

    def forward(self, x):
        return self.head(self.conv(x))


def stacks(idx, session, k):
    """Indices of the k frames ending at each idx, clamped inside their session."""
    out = np.empty((len(idx), k), dtype=np.int64)
    for j in range(k):
        prev = idx - (k - 1 - j)
        bad = (prev < 0) | (session[np.clip(prev, 0, len(session) - 1)] != session[idx])
        out[:, j] = np.where(bad, idx, prev)
    return out


def evaluate(model, X, S, Y, order, dev, k, bs=512):
    model.eval()
    P = []
    with torch.no_grad():
        for i in range(0, len(order), bs):
            sel = order[i:i + bs]
            xb = torch.from_numpy(X[stacks(sel, S, k)]).to(dev).float().div_(255.0)
            P.append(torch.sigmoid(model(xb)).cpu().numpy())
    return np.concatenate(P)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=DATA)
    ap.add_argument("--val", required=True, help="substring of the validation session")
    ap.add_argument("--exclude", nargs="*", default=[])
    ap.add_argument("--stack", type=int, default=4, help="frames per sample")
    ap.add_argument("--blocks", type=int, default=3)
    ap.add_argument("--width", type=float, default=1.0)
    ap.add_argument("--head", type=int, default=512)
    ap.add_argument("--epochs", type=int, default=12)
    ap.add_argument("--batch", type=int, default=128)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--sweep", default=None, choices=["depth", "width", "stack"])
    ap.add_argument("--tag", default="")
    args = ap.parse_args()

    d = np.load(os.path.abspath(args.data))
    X, Y, S = d["frames"], d["labels"].astype(np.float32), d["session"]
    cols = [str(c) for c in d["columns"]]
    names = [str(n) for n in d["sessions"]]
    h, w = X.shape[1], X.shape[2]

    val_ids = [i for i, n in enumerate(names) if args.val in n]
    ex_ids = [i for i, n in enumerate(names) if any(e in n for e in args.exclude)]
    if not val_ids:
        raise SystemExit(f"no session matches --val {args.val}: {names}")
    tr = np.where(~np.isin(S, val_ids + ex_ids))[0]
    va = np.where(np.isin(S, val_ids))[0]
    print(f"train {len(tr)} samples from {[names[i] for i in range(len(names)) if i not in val_ids + ex_ids]}")
    print(f"val   {len(va)} samples from {[names[i] for i in val_ids]}")
    print(f"frames {h}x{w}, actions {cols}\n")

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    base = Y[va].mean(axis=0)              # base rate = what a blind guesser scores

    configs = [{}]
    if args.sweep == "depth":
        configs = [{"blocks": b} for b in (1, 2, 3, 4)]
    elif args.sweep == "width":
        configs = [{"width": w_} for w_ in (0.25, 0.5, 1.0, 2.0)]
    elif args.sweep == "stack":
        configs = [{"stack": s} for s in (1, 2, 4, 8)]

    rows = []
    for cfg in configs:
        a = vars(args).copy(); a.update(cfg)
        torch.manual_seed(a["seed"]); np.random.seed(a["seed"])
        k = a["stack"]
        model = Net(len(cols), k, h, w, a["blocks"], a["width"], a["head"]).to(dev)
        n_par = sum(p.numel() for p in model.parameters())

        pos = Y[tr].sum(axis=0).clip(1)
        pos_weight = torch.tensor(((len(tr) - pos) / pos).clip(1, 50), device=dev)
        loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        opt = torch.optim.Adam(model.parameters(), lr=a["lr"])

        t0 = time.time()
        for ep in range(a["epochs"]):
            model.train()
            perm = np.random.permutation(tr)
            tot = 0.0
            for i in range(0, len(perm), a["batch"]):
                sel = perm[i:i + a["batch"]]
                xb = torch.from_numpy(X[stacks(sel, S, k)]).to(dev).float().div_(255.0)
                yb = torch.from_numpy(Y[sel]).to(dev)
                loss = loss_fn(model(xb), yb)
                opt.zero_grad(set_to_none=True); loss.backward(); opt.step()
                tot += float(loss) * len(sel)
            if ep % 4 == 3 or ep == a["epochs"] - 1:
                P = evaluate(model, X, S, Y, va, dev, k)
                aps = [average_precision_score(Y[va][:, j], P[:, j]) if Y[va][:, j].any()
                       else float("nan") for j in range(len(cols))]
                print(f"  ep{ep+1:3d} loss {tot/len(perm):.4f}  "
                      f"parryAP {aps[cols.index('press:guard')]:.3f}  "
                      f"attackAP {aps[cols.index('press:light_attack')]:.3f}")
        train_s = time.time() - t0

        # batch-1 forward latency: the number the parry budget actually cares about
        model.eval()
        xb = torch.zeros(1, k, h, w, device=dev)
        with torch.no_grad():
            for _ in range(20):
                model(xb)
            if dev == "cuda":
                torch.cuda.synchronize()
            t1 = time.time()
            for _ in range(200):
                model(xb)
            if dev == "cuda":
                torch.cuda.synchronize()
            lat_ms = (time.time() - t1) / 200 * 1000

        P = evaluate(model, X, S, Y, va, dev, k)
        aps = {c: (average_precision_score(Y[va][:, j], P[:, j]) if Y[va][:, j].any() else None)
               for j, c in enumerate(cols)}
        row = {"tag": args.tag, "blocks": a["blocks"], "width": a["width"], "stack": k,
               "params": n_par, "latency_ms": round(lat_ms, 3), "train_s": round(train_s, 1),
               "epochs": a["epochs"], "seed": a["seed"], "val": [names[i] for i in val_ids],
               "ap": {c: (round(v, 4) if v is not None else None) for c, v in aps.items()},
               "base_rate": {c: round(float(b), 4) for c, b in zip(cols, base)}}
        rows.append(row)
        with open(os.path.join(HERE, "results.jsonl"), "a", encoding="utf-8") as f:
            f.write(json.dumps(row) + "\n")

        print(f"\n  blocks {a['blocks']} width {a['width']} stack {k}: "
              f"{n_par/1e6:.2f}M params, {lat_ms:.2f} ms/forward, trained in {train_s:.0f}s")
        for c in cols:
            v, b = aps[c], dict(zip(cols, base))[c]
            if v is not None:
                print(f"    {c:22s} AP {v:.3f}   base rate {b:.3f}   "
                      f"{'x%.1f' % (v/b) if b > 0 else ''}")
        print()

    if len(rows) > 1:
        print("=" * 66)
        print(f"{'blocks':>7} {'width':>6} {'stack':>6} {'params':>9} {'ms':>7} "
              f"{'parryAP':>8} {'attackAP':>9}")
        for r in rows:
            print(f"{r['blocks']:7d} {r['width']:6.2f} {r['stack']:6d} "
                  f"{r['params']/1e6:8.2f}M {r['latency_ms']:7.2f} "
                  f"{r['ap']['press:guard']:8.3f} {r['ap']['press:light_attack']:9.3f}")
        print("\nSelection rule: smallest model within one seed-sigma of the best parry AP")
        print("whose latency fits the budget. Run more seeds before trusting a winner.")


if __name__ == "__main__":
    main()
