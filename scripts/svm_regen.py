"""Every pasted output block in the SVM track, re-derived from the script that produced it.

House rule: no number appears on a page unless a script reproduces it. `scripts/svm_cases.py`
IS that script -- but "a script exists that computes this" and "the text on the page still says
what that script prints" are different claims, and only the first one survives on its own. A
block is stdout frozen at the moment someone pasted it; edit the experiment and the page keeps
quoting the old run, silently, with prose written around numbers nothing produces any more.

That is not hypothetical. The same blind spot on the boss track left three blocks quoting a
parry window the world had moved on from, plus two paragraphs reasoning off the stale figures.
This is the same guard for this track (see scripts/boss_regen.py, which covers that one).

    python scripts/svm_regen.py --check     # verify only; exit 1 if any block has drifted
    python scripts/svm_regen.py             # rewrite the drifted blocks

A block is registerable only if it is one section's WHOLE stdout. Hand-trimmed excerpts must not
go in here: the tool would either overwrite the trim or cry wolf about it forever.
"""
import pathlib
import re
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEARN = ROOT / "src" / "app" / "learn"

# page (path under src/app/learn) -> {block suffix in `const outX`: svm_cases.py section}
BLOCKS = {
    "support-vector-machines": {
        "Margin": "margin",
    },
    "support-vector-machines/functional-and-geometric-margin": {
        "Rescale": "rescale",
        "Distance": "distance",
        "Ranking": "ranking",
        "Canonical": "canonical",
    },
    "support-vector-machines/the-maximum-margin-hyperplane": {
        "Minnorm": "minnorm",
        "Squared": "squared",
        "Tight": "tight",
    },
    "support-vector-machines/does-a-wider-margin-help": {
        "Size": "size",
        "Band": "band",
        "Where": "where",
        "Onepoint": "onepoint",
    },
    "support-vector-machines/soft-margin-slack-and-c": {
        "Rescue": "rescue",
        "Slack": "slack",
        "Dial": "dial",
    },
    "support-vector-machines/the-hinge-loss": {
        "Unconstrained": "unconstrained",
        "Surrogate": "surrogate",
        "Descend": "descend",
    },
    "support-vector-machines/hinge-vs-log-loss-and-sparsity": {
        "Losses": "losses",
        "Pull": "pull",
        "Sparsity": "sparsity",
    },
    "support-vector-machines/the-primal-problem": {
        "Primal": "primal",
        "Convex": "convex",
        "Flat": "flat",
        "Shape": "shape",
    },
    "support-vector-machines/lagrangian-duality-and-kkt": {
        "Lagrangian": "lagrangian",
        "Kkt": "kkt",
        "Prices": "prices",
    },
    "support-vector-machines/the-dual-problem": {
        "Dual": "dual",
        "Gram": "gram",
        "Pieces": "pieces",
    },
    "support-vector-machines/support-vectors-exactly": {
        "Svset": "svset",
        "Becoming": "becoming",
        "Offset": "offset",
        "Loo": "loo",
    },
    "support-vector-machines/the-kernel-trick": {
        "Swap": "swap",
        "Lift": "lift",
        "Nospace": "nospace",
        "Allowed": "allowed",
    },
    "support-vector-machines/kernels-you-will-actually-use": {
        "Menu": "menu",
        "Reach": "reach",
        "Coef0": "coef0",
        "Lookup": "lookup",
    },
    "support-vector-machines/solving-it-smo": {
        "Two": "twoatatime",
        "Clip": "clipbox",
        "Which": "whichpair",
        "Stop": "stopping",
    },
    "support-vector-machines/scaling-and-why-an-svm-cannot-skip-it": {
        "Units": "units", "Dial": "unitsdial",
        "Penalty": "penalty", "Scaler": "whichscaler",
    },
    "support-vector-machines/choosing-c-and-gamma": {
        "Grid": "cgrid", "Buys": "tuningbuys",
        "Curse": "curse", "Flat": "flattop",
    },
    "support-vector-machines/multi-class-one-vs-one-and-one-vs-rest": {
        "Two": "twoways", "Mask": "masking",
        "Claims": "claims", "Cost": "perk",
    },
    "support-vector-machines/probabilities-from-an-svm": {
        "Squash": "squash", "Scale": "scale",
        "Held": "heldout", "Prob": "probtrue",
    },
    "support-vector-machines/svm-vs-logistic-regression-vs-forest": {
        "Contest": "contest", "Noise": "noisefeat",
        "Linear": "linear", "Growth": "growth",
    },
    "support-vector-machines/when-to-use-an-svm": {
        "Imbalance": "imbalance", "Approx": "approx", "Landmarks": "landmarks",
    },
}

BANNER = re.compile(r"\n={70}\n(.*?)\n={70}\n")


def _trim(body):
    return "\n".join(ln.rstrip() for ln in body.split("\n")).rstrip("\n")


def run_sections(names):
    """Run several sections in ONE process and split the output on section banners.

    One process rather than one per block: importing sklearn costs more than the experiments
    do. The banner is an exact delimiter, so each body is still that section's whole stdout --
    it is not a hand trim.
    """
    t0 = time.time()
    cmd = [sys.executable, "scripts/svm_cases.py"] + names
    p = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    if p.returncode:
        raise SystemExit("%s exited %d:\n%s" % (" ".join(cmd), p.returncode, p.stderr[-2000:]))
    parts = BANNER.split(p.stdout.replace("\r\n", "\n"))
    # Trailing spaces off every line. A %-14s in the last column of a table emits padding that
    # nobody pastes onto a page and no editor keeps, so without this the guard reports drift on
    # blocks whose numbers are all correct -- which is how a guard teaches people to ignore it.
    bodies = [_trim(parts[i + 1]) for i in range(1, len(parts) - 1, 2)]
    if len(bodies) != len(names):
        raise SystemExit("expected %d sections, parsed %d" % (len(names), len(bodies)))
    return dict(zip(names, bodies)), time.time() - t0


def splice(s, page, name, got, check):
    """Compare one outX block against what its section just printed; rewrite unless --check."""
    # A page is a TypeScript template literal. A printed backtick, ${ or backslash would end it
    # or be re-interpreted, so refuse the splice rather than corrupt the page.
    bad = [c for c in ("`", "${", "\\") if c in got]
    if bad:
        raise SystemExit("%s: out%s would break the template literal (contains %s)"
                         % (page, name, " ".join(repr(b) for b in bad)))
    pat = re.compile(r"(const out" + name + r" = `)(.*?)(`;)", re.S)
    m = pat.search(s)
    if not m:
        raise SystemExit("%s: nothing named out%s to write into" % (page, name))
    same = m.group(2) == got
    if not same:
        s = pat.sub(lambda mm: mm.group(1) + got + mm.group(3), s, count=1)
    print("  %-52s out%-12s %s" % (page, name, "ok" if same else
                                   ("DRIFTED" if check else "updated")))
    return s, 0 if same else 1


def regen(page, mapping, check):
    path = LEARN / page / "page.tsx"
    if not path.exists():
        print("%-52s (no page yet)" % page)
        return 0
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    s = raw.replace("\r\n", "\n")

    names = list(mapping.values())
    bodies, secs = run_sections(names)
    print("  %-52s %d section(s), %.1fs" % (page, len(names), secs))

    drift = 0
    for block, sec in mapping.items():
        s, d = splice(s, page, block, bodies[sec], check)
        drift += d
    if drift and not check:
        path.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    return drift


def main(argv):
    check = "--check" in argv
    want = [a for a in argv if not a.startswith("--")] or list(BLOCKS)
    unknown = [w for w in want if w not in BLOCKS]
    if unknown:
        raise SystemExit("unknown page(s): %s" % ", ".join(unknown))
    print("%s %d page(s) against scripts/svm_cases.py\n"
          % ("checking" if check else "regenerating", len(want)))
    drift = sum(regen(p, BLOCKS[p], check) for p in want)
    print()
    if check and drift:
        print("FAIL -- %d block(s) no longer match what their section prints." % drift)
        return 1
    print("clean -- every block matches its section." if check
          else ("%d block(s) rewritten." % drift if drift else "nothing to do; all current."))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
