"""Recompute every published answer in the maths tracks, independently, and fail on a mismatch.

House rule #1 says every number on this site is reproduced by something in the repo. The teaching
rebuild (docs/math-pedagogy-plan.md) publishes hundreds of hand-written answers in a subject where
a sign error passes `tsc`, passes `check-pages.js`, and passes a careful read. This is the check
that catches one.

The independence matters and is easy to lose. Each entry below computes its answer FROM THE
PROBLEM STATEMENT with sympy -- differentiating, solving, taking limits -- and never from the
answer written on the page. The page's `verify` field is then parsed out of the content module and
compared symbolically. If a solution and this file disagree, one of them is wrong and neither is
trusted until a human looks.

    python scripts/math_check.py            # check everything
    python scripts/math_check.py -v         # print each answer as it is checked

Adding a page: write an entry in CASES keyed by the same ids the content module uses, then add the
module to MODULES.
"""
import pathlib
import re
import sys

import sympy as sp

ROOT = pathlib.Path(__file__).resolve().parents[1]

x, h, w, a, b = sp.symbols("x h w a b", real=True)

# Content modules to read `id` / `verify` pairs out of, and the pages that render them.
MODULES = {
    "derivatives": "src/content/math/derivatives.tsx",
}
# Pages carrying <Worked> blocks, whose `verify` props are parsed the same way.
PAGES = {
    "derivatives": "src/app/learn/math-foundations/derivatives/page.tsx",
}


# ---- the independent computations ------------------------------------------------------
# Every one of these is written from the STATEMENT. If you find yourself copying a result off the
# page to make a case pass, stop: that is the failure this file exists to prevent.

def derivatives():
    out = {}

    # --- worked examples ---
    # W1  f(x) = 3x^2 - 5x + 2, from the limit definition; then f'(2).
    f1 = 3 * x**2 - 5 * x + 2
    d1 = sp.limit((f1.subs(x, x + h) - f1) / h, h, 0)      # the definition, not the power rule
    out["d-w1"] = [sp.simplify(d1), d1.subs(x, 2)]

    # W2  f(x) = x^3 - 3x: the derivative, its two roots, and the value at each.
    f2 = x**3 - 3 * x
    d2 = sp.diff(f2, x)
    roots = sorted(sp.solve(sp.Eq(d2, 0), x))              # [-1, 1]
    lo, hi = roots[1], roots[0]                            # state the minimum's x first
    out["d-w2"] = [sp.expand(d2), lo, hi, f2.subs(x, lo), f2.subs(x, hi)]

    # W3  least squares through the origin on (1,2), (2,5), (3,7); w* and the loss there.
    pts = [(1, 2), (2, 5), (3, 7)]
    L = sum((yi - w * xi) ** 2 for xi, yi in pts)
    wstar = sp.solve(sp.Eq(sp.diff(L, w), 0), w)[0]
    out["d-w3"] = [sp.nsimplify(wstar), sp.nsimplify(sp.simplify(L.subs(w, wstar)))]

    # W4  one-sided slopes of |x-2| at x = 2.
    g = sp.Abs(x - 2)
    right = sp.limit((g.subs(x, 2 + h) - g.subs(x, 2)) / h, h, 0, "+")
    left = sp.limit((g.subs(x, 2 + h) - g.subs(x, 2)) / h, h, 0, "-")
    out["d-w4"] = [right, left]

    # --- band 1 · Apply ---
    p = 4 * x**3 - 2 * x**2 + 7 * x - 1
    out["d-a1"] = [sp.expand(sp.diff(p, x)), sp.diff(p, x).subs(x, 1)]

    q = 1 / x
    out["d-a2"] = [sp.simplify(sp.limit((q.subs(x, x + h) - q) / h, h, 0))]

    out["d-a3"] = [sp.diff(-3 * x + 8, x), sp.diff(sp.Integer(7), x)]

    f4 = x**2 - 6 * x + 5
    x4 = sp.solve(sp.Eq(sp.diff(f4, x), 0), x)[0]
    out["d-a4"] = [x4, f4.subs(x, x4)]

    f5 = sp.exp(x) - x
    x5 = sp.solve(sp.Eq(sp.diff(f5, x), 0), x)[0]
    out["d-a5"] = [sp.diff(f5, x), x5, f5.subs(x, x5)]

    # --- band 2 · Combine ---
    f6 = x**2 * sp.exp(x)
    z6 = sorted(sp.solve(sp.Eq(sp.diff(f6, x), 0), x), reverse=True)   # [0, -2]
    out["d-b1"] = [sp.simplify(sp.diff(f6, x)), z6[0], z6[1]]

    out["d-b2"] = [sp.simplify(sp.diff((2 * x + 1) / (x - 3), x))]

    pts_b = [(1, 2), (2, 3), (3, 7)]
    Lb = sum((yi - w * xi) ** 2 for xi, yi in pts_b)
    out["d-b3"] = [sp.nsimplify(sp.solve(sp.Eq(sp.diff(Lb, w), 0), w)[0])]

    # b4: x^2 for x <= 1, ax + b for x > 1, differentiable at 1 -> match value AND slope
    sol = sp.solve([sp.Eq(a * 1 + b, 1**2), sp.Eq(a, sp.diff(x**2, x).subs(x, 1))], [a, b])
    out["d-b4"] = [sol[a], sol[b]]

    # --- band 3 · Outsmart ---
    # c1: f(x) = prod_{k=1..10} (x - k); f'(1). Expanded on purpose -- the page takes the shortcut,
    # so the check must take the long way round or it is not a check.
    prod = sp.prod([x - k for k in range(1, 11)])
    out["d-c1"] = [sp.diff(sp.expand(prod), x).subs(x, 1)]

    # c2: the limit itself, evaluated as a limit -- not as a derivative, which is the page's move.
    out["d-c2"] = [sp.limit(((2 + h) ** 10 - 2**10) / h, h, 0)]

    # c3: |x-1| + |x-2| + |x-3| -- minimise by brute force over a fine grid, then count corners.
    f7 = sp.Abs(x - 1) + sp.Abs(x - 2) + sp.Abs(x - 3)
    grid = [sp.Rational(k, 100) for k in range(0, 401)]
    vals = [(f7.subs(x, g), g) for g in grid]
    best_val, best_x = min(vals, key=lambda t: float(t[0]))
    corners = sum(1 for k in (1, 2, 3)
                  if sp.limit((f7.subs(x, k + h) - f7.subs(x, k)) / h, h, 0, "+")
                  != sp.limit((f7.subs(x, k + h) - f7.subs(x, k)) / h, h, 0, "-"))
    out["d-c3"] = [best_val, best_x, sp.Integer(corners)]

    # c4: f(x+y) = f(x)f(y), f'(0) = 2 -> solve f' = f'(0) f with f(0) = 1, then report f' and f.
    F = sp.Function("F")
    sol4 = sp.dsolve(sp.Eq(sp.diff(F(x), x), 2 * F(x)), F(x), ics={F(0): 1}).rhs
    out["d-c4"] = [sp.simplify(sp.diff(sol4, x)), sp.simplify(sol4)]

    return out


CASES = {"derivatives": derivatives}


# ---- reading what the pages actually publish -------------------------------------------
VERIFY = re.compile(r'id:\s*"([^"]+)"[\s\S]{0,4000}?verify:\s*"([^"]+)"')
WORKED = re.compile(r'verify="([^"]+)"[\s\S]{0,400}?n=\{(\d+)\}|n=\{(\d+)\}[\s\S]{0,400}?verify="([^"]+)"')


def published(key):
    """Pull every (id, verify) pair out of the content module and the page."""
    found = {}
    mod = ROOT / MODULES[key]
    for pid, v in VERIFY.findall(mod.read_text(encoding="utf-8")):
        found[pid] = v
    page = ROOT / PAGES[key]
    if page.exists():
        src = page.read_text(encoding="utf-8")
        for m in re.finditer(r"<Worked\b([\s\S]*?)/?>", src):
            attrs = m.group(1)
            n = re.search(r"n=\{(\d+)\}", attrs)
            v = re.search(r'verify="([^"]+)"', attrs)
            if n and v:
                found[f"{key[0]}-w{n.group(1)}"] = v.group(1)
    return found


# The published strings must be parsed against THESE symbols. sympify() would otherwise mint a
# fresh Symbol("x") with no assumptions, which does not cancel against Symbol("x", real=True) --
# and every symbolic answer would "fail" while being perfectly correct.
LOCALS = {"x": x, "h": h, "w": w, "a": a, "b": b}


def parse(s):
    "One comma-separated answer string into sympy expressions."
    return [sp.sympify(part.strip(), locals=LOCALS) for part in s.split(",")]


def main(argv):
    loud = "-v" in argv
    bad, n = [], 0
    for key, compute in CASES.items():
        mine = compute()
        theirs = published(key)

        missing = sorted(set(mine) - set(theirs))
        extra = sorted(set(theirs) - set(mine))
        for pid in missing:
            bad.append(f"{key}: `{pid}` is computed here but published nowhere — id renamed?")
        for pid in extra:
            bad.append(f"{key}: `{pid}` is published with no independent check in this file")

        for pid in sorted(set(mine) & set(theirs)):
            want = mine[pid]
            try:
                got = parse(theirs[pid])
            except Exception as e:                      # noqa: BLE001 — report, don't crash
                bad.append(f"{key}/{pid}: published answer will not parse: {e}")
                continue
            if len(got) != len(want):
                bad.append(f"{key}/{pid}: published {len(got)} part(s), computed {len(want)}")
                continue
            for i, (g, wnt) in enumerate(zip(got, want), 1):
                n += 1
                if sp.simplify(g - wnt) != 0:
                    bad.append(f"{key}/{pid} part {i}: page says {g}, this script computes {wnt}")
                elif loud:
                    print(f"  ok  {key}/{pid} part {i}: {g}")

    print(f"checked {n} published answer(s) across {len(CASES)} page(s)")
    if not bad:
        print("clean — every published answer matches an independent computation.")
        return 0
    for line in bad:
        print("  " + line)
    print(f"\n{len(bad)} problem(s).")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
