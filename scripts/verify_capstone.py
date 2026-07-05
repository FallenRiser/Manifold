# Reproducibility guard for the California-housing capstone (PROJECT.md §11 rule 10).
#
# Executes every code cell of public/capstone/california-housing-capstone.ipynb
# (the ground-truth reproduction of all published capstone numbers) and checks
# the captured output against the manifest below. Any drift — library upgrade,
# notebook edit, dataset change — fails loudly instead of silently diverging
# from what the lesson pages publish.
#
#   python scripts/verify_capstone.py        (~8 min: runs the full model zoo)
#
# Exit 0 = every published number reproduced. Exit 1 = drift; the diff is printed.
import io
import json
import re
import sys
import contextlib
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NB = ROOT / "public" / "capstone" / "california-housing-capstone.ipynb"

# (name, regex over the notebook's combined stdout, expected, abs tolerance)
# Tolerances are 0 where the pages publish the exact digit, loose only for the
# few protocol-sensitive quantities (spatial CV).
MANIFEST: list[tuple[str, str, float, float]] = [
    ("rows at cap",              r"rows at cap:\s*(\d+)",                              808,   0),
    ("linear R2",                r"linear\s+\((-?[\d.]+),",                            0.653, 0),
    ("linear RMSE",              r"linear\s+\(-?[\d.]+,\s*([\d.]+)\)",                 0.681, 0),
    ("ridge R2",                 r"ridge\s+\((-?[\d.]+),",                             0.653, 0),
    ("poly ridge R2",            r"poly ridge:\s*\(([\d.]+),",                         0.711, 0),
    ("poly ridge RMSE",          r"poly ridge:\s*\([\d.]+,\s*([\d.]+)\)",              0.621, 0),
    ("tobit sigma",              r"sigma:\s*([\d.]+)",                                 0.674, 0.002),
    ("income coef OLS",          r"income coef\s+OLS:\s*([\d.]+)",                     0.779, 0.002),
    ("income coef Tobit",        r"Tobit:\s*([\d.]+)",                                 0.916, 0.003),
    ("RandomForest R2",          r"RandomForest\s+\(([\d.]+),",                        0.834, 0.002),
    ("HistGB R2",                r"HistGradientBoosting\s+\(([\d.]+),",                0.846, 0.002),
    ("XGBoost R2",               r"XGBoost\s+\(([\d.]+),",                             0.856, 0.002),
    ("LightGBM R2",              r"LightGBM\s+\(([\d.]+),",                            0.855, 0.001),
    ("Stacking R2",              r"Stacking:\s*\(([\d.]+),",                           0.858, 0.002),
    ("normal-zone RMSE",         r"normal\s+RMSE ([\d.]+)",                            0.398, 0.001),
    ("normal-zone n",            r"normal\s+RMSE [\d.]+\s+n=(\d+)",                    3069,  0),
    ("cap-zone RMSE",            r"cap zone RMSE ([\d.]+)",                            0.911, 0.001),
    ("cap-zone n",               r"cap zone RMSE [\d.]+\s+n=(\d+)",                    234,   0),
    ("spatial GroupKFold R2",    r"spatial GroupKFold R2:\s*([\d.]+)",                 0.691, 0.015),
    ("censored LGBM CV R2",      r"censored LGBM CV:\s*([\d.]+)",                      0.855, 0.001),
    ("censored cap-zone RMSE",   r"censored cap-zone RMSE ([\d.]+)",                   0.848, 0.003),
    ("capped latent mean",       r"latent value of capped blocks: mean ([\d.]+)",      5.117, 0.02),
    ("SHAP base value",          r"base value:\s*([\d.]+)",                            2.067, 0.002),
    ("test pred mean",           r"mean:\s*([\d.]+)\s+min:",                           2.058, 0.005),
    ("test pred min",            r"min:\s*([\d.]+)\s+max:",                            0.438, 0.005),
    ("test preds above cap",     r"above cap:\s*(\d+)",                                51,    2),
]


def main() -> int:
    nb = json.loads(NB.read_text(encoding="utf-8"))
    buf = io.StringIO()
    ns: dict = {}
    import os

    os.chdir(NB.parent)  # notebook expects the CSVs beside it
    for k, cell in enumerate(nb["cells"]):
        if cell["cell_type"] != "code":
            continue
        src = cell["source"] if isinstance(cell["source"], str) else "".join(cell["source"])
        print(f"  running cell {k}...", file=sys.stderr, flush=True)
        try:
            with contextlib.redirect_stdout(buf):
                exec(compile(src, f"cell{k}", "exec"), ns)
        except Exception:
            print(buf.getvalue())
            traceback.print_exc()
            print("\nFAIL: notebook raised before completing.")
            return 1

    out = buf.getvalue()
    failures = []
    for name, pattern, expected, tol in MANIFEST:
        m = re.search(pattern, out)
        if not m:
            failures.append(f"  {name}: pattern not found ({pattern!r})")
            continue
        got = float(m.group(1))
        if abs(got - expected) > tol:
            failures.append(f"  {name}: got {got}, expected {expected} (±{tol})")

    # clean up the side-effect file the delivery cell writes
    (NB.parent / "predictions.csv").unlink(missing_ok=True)

    if failures:
        print("CAPSTONE DRIFT DETECTED — published numbers no longer reproduce:")
        print("\n".join(failures))
        print("\nEither the notebook/pipeline changed (fix it) or the numbers truly moved")
        print("(then update the lesson pages AND this manifest together, never one alone).")
        return 1

    print(f"OK: all {len(MANIFEST)} published capstone numbers reproduced.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
