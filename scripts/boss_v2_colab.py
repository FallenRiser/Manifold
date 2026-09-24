"""Package the v2 world + trainer for a hosted runtime, and print the cells to run there.

    python scripts/boss_v2_colab.py                 build the bundle, print the cells
    python scripts/boss_v2_colab.py --check FILE    verify a bundle against this repo

Why a bundle and not "just upload the script": this trainer does NOT contain the environment. It
extracts BOSS_SETUP_V2 out of src/lib/runtimeSetup.ts at import time, which is the whole point --
the thing that trains and the thing the reader plays are one world. Upload the trainer alone and
it will not even start.

Why a MANIFEST: a previous Colab batch in this project came back from a STALE trainer and the
numbers were quietly wrong. Every file in the bundle is hashed, the world's own hash is recorded,
and the first cell you run prints them back so a mismatch is loud instead of silent.
"""
import argparse
import hashlib
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "results" / "boss_v2"
BUNDLE = OUT / "boss_v2_colab.zip"

TRAINER = ROOT / "scripts" / "boss_v2_train.py"
SETUP = ROOT / "src" / "lib" / "runtimeSetup.ts"


def sha(b):
    return hashlib.sha1(b).hexdigest()[:12]


def v2_block(src):
    m = re.search(r"export const BOSS_SETUP_V2 = `(.*?)\n`;", src, re.S)
    if not m:
        raise SystemExit("BOSS_SETUP_V2 not found in runtimeSetup.ts")
    return m.group(1)


def build():
    src = SETUP.read_text(encoding="utf-8")
    body = v2_block(src)

    # Ship ONLY the v2 block, wrapped exactly as the trainer's regex expects. It is byte-identical
    # to what the site carries, and it leaves the frozen v1 world out of a bundle that has no use
    # for it. The hash below is what proves the two are the same world.
    mini = "export const BOSS_SETUP_V2 = `" + body + "\n`;\n"
    trainer = TRAINER.read_bytes()

    manifest = "\n".join([
        "boss v2 colab bundle",
        "world   BOSS_SETUP_V2  sha1 %s  (%d lines)" % (sha(body.encode()), body.count("\n") + 1),
        "trainer scripts/boss_v2_train.py  sha1 %s" % sha(trainer),
        "setup   src/lib/runtimeSetup.ts (v2 block only)  sha1 %s" % sha(mini.encode()),
        "",
        "If the first Colab cell prints a different world hash than the line above, the runtime is",
        "running something other than this repo. Stop and re-upload; do not keep the numbers.",
    ]) + "\n"

    OUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(BUNDLE, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("scripts/boss_v2_train.py", trainer)
        z.writestr("src/lib/runtimeSetup.ts", mini)
        z.writestr("MANIFEST.txt", manifest)

    kb = BUNDLE.stat().st_size / 1024
    print(manifest)
    print("wrote %s  (%.0f KB)\n" % (BUNDLE.relative_to(ROOT), kb))
    cells(sha(body.encode()))


def cells(world_hash):
    print("=" * 78)
    print("COLAB: Runtime -> Change runtime type -> GPU (T4 is plenty; the nets are tiny).")
    print("Upload boss_v2_colab.zip with the file browser, then run these four cells.")
    print("=" * 78)

    print("""
# ---- cell 1: unpack and CHECK. Do not skip the check. -----------------------
!unzip -o -q boss_v2_colab.zip -d /content/boss && cat /content/boss/MANIFEST.txt
%cd /content/boss
!python scripts/boss_v2_train.py version
""")
    print("""# Expected world hash: %s
# If the line above disagrees, the runtime is not running this repo's world. Stop.
""" % world_hash)

    print("""# ---- cell 2: the run. ~3-5 h for 6M decisions; checkpoints every 50k. -------
!python scripts/boss_v2_train.py dqn --decisions 6000000 --seed 0 2>&1 | tee /content/v2_6m.log
""")

    print("""# ---- cell 2b: ONLY if the runtime dropped. Resumes from the checkpoint. -----
# Honest caveat: weights and the step counter come back, the replay buffer does NOT.
# A resumed run is not identical to an uninterrupted one -- say so if you publish it.
!python scripts/boss_v2_train.py dqn --decisions 6000000 --seed 0 --resume 2>&1 | tee -a /content/v2_6m.log
""")

    print("""# ---- cell 3: look at it before you download it. ----------------------------
!python scripts/boss_v2_train.py probe --tag v2_dqn_6000k_s0 --eval-n 200 --device cpu
!python scripts/boss_v2_train.py buttons --tag v2_dqn_6000k_s0 --eval-n 150 --device cpu
""")

    print("""# ---- cell 4: bring it home. ------------------------------------------------
from google.colab import files
files.download('results/boss_v2/v2_dqn_6000k_s0.pt')
files.download('results/boss_v2/v2_dqn_6000k_s0.json')
""")

    print("=" * 78)
    print("Back here, drop both files into results/boss_v2/ and run:")
    print("  python scripts/boss_v2_train.py probe --tag v2_dqn_6000k_s0 --eval-n 200 --device cpu")
    print("  python scripts/boss_v2_stunlock.py 200")
    print("The local probe is the one that counts -- it scores the net against THIS repo's world,")
    print("so a bundle that drifted shows up as a disagreement rather than as a nice number.")
    print("=" * 78)


def check(path):
    with zipfile.ZipFile(path) as z:
        got_setup = z.read("src/lib/runtimeSetup.ts").decode("utf-8")
        got_trainer = z.read("scripts/boss_v2_train.py")
    here_body = v2_block(SETUP.read_text(encoding="utf-8"))
    there_body = v2_block(got_setup)
    ok = True
    for what, a, b in (("world", here_body.encode(), there_body.encode()),
                       ("trainer", TRAINER.read_bytes(), got_trainer)):
        same = sha(a) == sha(b)
        ok = ok and same
        print("  %-8s repo %s   bundle %s   %s"
              % (what, sha(a), sha(b), "same" if same else "DIFFERENT"))
    print("\n%s" % ("bundle matches this repo." if ok
                    else "STALE BUNDLE -- rebuild before trusting anything it produced."))
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--check", metavar="ZIP", default=None)
    a = p.parse_args()
    if a.check:
        check(a.check)
    else:
        build()
