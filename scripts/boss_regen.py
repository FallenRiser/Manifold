"""Every runnable cell on a World 3 page, executed, with its printed output pasted under it.

House rule for this track: no number appears on a page unless a script reproduces it. For the
cells the reader can press Run on, THIS is that script. For each `const codeFoo` on a page there
must be a `const outFoo`; the cell is executed against a FRESH copy of the shipped BOSS_SETUP
namespace -- which is exactly what the browser's Run button does, since CodeBlock evaluates
`${setup}\\n${code}` in a new namespace every time -- and whatever it printed is written back.

    python scripts/boss_regen.py --all             # rewrite every World 3 page's blocks
    python scripts/boss_regen.py --check --all     # verify only; exit 1 if any block has drifted
    python scripts/boss_regen.py the-turtle        # one page

--check is the guard that matters. It answers "does the block under this cell still say what the
cell prints?", which is the question that goes stale silently every time the environment changes.

Some blocks are not cells: they are stdout from a script too slow or too stateful to run in the
browser, rendered by CodeOutput with a `source=` attribute. Those are covered too, via STANDALONE
below -- the tool re-runs the named command and compares. They used to be the blind spot, and a
blind spot in a reproducibility guard is worth more than the guard.

Cells are independent: each one gets its own namespace, exactly as the browser gives it one, so a
cell that relies on a name defined in an earlier cell will fail here and in the page alike.
"""
import contextlib
import io
import pathlib
import re
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import boss_cases as bc  # noqa: E402

PAGES = ROOT / "src" / "app" / "learn" / "building-environments"

# The World 3 pages, in track order. Worlds 1 and 2 predate this tool and use other setups.
WORLD3 = ["the-duel-brief", "a-moveset-as-a-state-machine", "frames-hitboxes-and-i-frames",
          "stamina-and-the-perfect-guard-window", "writing-the-duel", "what-the-agent-sees",
          "thousands-of-duels-at-once", "scripted-players-and-a-difficulty-dial",
          "curriculum-one-move-then-the-set", "the-training-loop", "training-the-duellist",
          "the-turtle", "what-it-learned-about-delayed-attacks", "watch-it-fight",
          "sim-vs-the-real-game"]

# The v2 pages run against BOSS_SETUP_V2, not the frozen BOSS_SETUP. Keeping the two lists apart
# is the same discipline as everywhere else in this build: v1's numbers must stay reproducible by
# v1's world, and a cell on a v2 page that silently ran against v1 would be worse than no check.
WORLD3_V2 = ["a-harder-fight", "reading-a-policy", "coding-the-harder-fight"]
SETUP_FOR = {slug: "BOSS_SETUP_V2" for slug in WORLD3_V2}

# Blocks pasted from a SCRIPT's stdout rather than from a cell the reader can press Run on.
# CodeOutput renders these with a `source=` attribute, and that attribute is precisely why nothing
# was checking them: check-pages.js verifies only ATTACHED blocks, and this tool only knew how to
# pair `codeX` with `outX`. So a block whose script had been edited stayed on the page unchallenged.
# That is not hypothetical -- all three of a-harder-fight's blocks were still quoting the 3-frame
# parry window weeks after the world moved to 6, and two paragraphs of prose had been written off
# the stale figures. Same question as for a cell, asked of a command: does the page still say what
# the tool prints?
#
# A block is registerable only if it is the command's WHOLE stdout. Several blocks elsewhere in
# the track are hand-trimmed excerpts of a longer run (a-moveset/outFreq, frames-hitboxes/outArc,
# reading-a-policy/outSpread), and one is a throughput benchmark that legitimately reads a few per
# cent different every run (thousands-of-duels/outSpeed). Those are checked by hand; see
# docs/env-building-plan.md. Registering them here would either corrupt the excerpt or cry wolf.
#
# `echo` is the shell line the page shows above the output, reproduced verbatim so the block on
# the page keeps reading like a terminal session.
STANDALONE = {
    "a-harder-fight": {
        "Probe": ["node", "scripts/boss_v2_probe.mjs"],
        "Parry": [sys.executable, "scripts/boss_v2_cases.py", "parry"],
        "Stun": [sys.executable, "scripts/boss_v2_stunlock.py"],
    },
    "reading-a-policy": {
        "Probe": {"cmd": [sys.executable, "scripts/boss_v2_train.py", "probe", "--tag",
                          "v2_dqn_6000k_s0", "--eval-n", "200", "--device", "cpu"],
                  "echo": "$ python scripts/boss_v2_train.py probe --tag v2_dqn_6000k_s0"
                          " --eval-n 200 --device cpu"},
        "Buttons": {"cmd": [sys.executable, "scripts/boss_v2_train.py", "buttons", "--tag",
                            "v2_dqn_6000k_s0", "--eval-n", "150", "--device", "cpu"],
                    "echo": "$ python scripts/boss_v2_train.py buttons --tag v2_dqn_6000k_s0"
                            " --eval-n 150 --device cpu"},
    },
}


def run(code, setup="BOSS_SETUP"):
    """One cell, in its own namespace, with stdout captured -- as the Run button would."""
    ns = bc.load_setup(setup)
    buf = io.StringIO()
    t0 = time.time()
    with contextlib.redirect_stdout(buf):
        exec(compile(code, "<cell>", "exec"), ns)
    return buf.getvalue().rstrip("\n"), time.time() - t0


def run_script(spec):
    """One STANDALONE block: the script that produced it, re-run, stdout captured.

    Python on Windows writes CRLF to a redirected stdout, and several of these scripts open with a
    blank line, so normalise both ends before comparing -- otherwise every block reads as drifted.
    """
    cmd = spec["cmd"] if isinstance(spec, dict) else spec
    echo = spec.get("echo") if isinstance(spec, dict) else None
    t0 = time.time()
    p = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    if p.returncode:
        raise SystemExit("%s exited %d:\n%s" % (" ".join(cmd), p.returncode, p.stderr[-2000:]))
    out = p.stdout.replace("\r\n", "\n").rstrip("\n")
    # With an echo the block is a terminal session, so it keeps the blank line most of these
    # scripts open with -- `out` still carries that leading newline here. Without one the block is
    # just output, and the page starts it flush.
    return (echo + "\n" + out if echo else out.lstrip("\n")), time.time() - t0


def splice(s, slug, name, got, check, secs):
    """Compare one outX block against what its source just printed; rewrite it unless --check."""
    # A page is a TypeScript template literal. Printed backticks, ${ or a backslash would end it
    # or be re-interpreted, so refuse the splice rather than corrupt the page.
    bad = [c for c in ("`", "${", "\\") if c in got]
    if bad:
        raise SystemExit("%s: out%s would break the template literal (contains %s)"
                         % (slug, name, " ".join(repr(b) for b in bad)))
    pat = re.compile(r"(const out" + name + r" = `)(.*?)(`;)", re.S)
    m = pat.search(s)
    if not m:
        raise SystemExit("%s: nothing named out%s to write into" % (slug, name))
    same = m.group(2) == got
    if not same:
        s = pat.sub(lambda mm: mm.group(1) + got + mm.group(3), s, count=1)
    print("  %-40s out%-14s %-9s %5.1fs" % (slug, name, "ok" if same else
                                            ("DRIFTED" if check else "updated"), secs))
    return s, 0 if same else 1


def regen(slug, check):
    page = PAGES / slug / "page.tsx"
    if not page.exists():
        print("%-40s (no page)" % slug)
        return 0
    raw = page.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    s = raw.replace("\r\n", "\n")
    names = re.findall(r"const code([A-Za-z0-9]+) = `", s)
    shell = STANDALONE.get(slug, {})
    if not names and not shell:
        print("%-40s no runnable cells" % slug)
        return 0

    drift = 0
    for name in names:
        code = re.search(r"const code" + name + r" = `(.*?)`;", s, re.S).group(1)
        got, secs = run(code, SETUP_FOR.get(slug, "BOSS_SETUP"))
        s, d = splice(s, slug, name, got, check, secs)
        drift += d
    for name, spec in shell.items():
        got, secs = run_script(spec)
        s, d = splice(s, slug, name, got, check, secs)
        drift += d
    if drift and not check:
        page.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    return drift


def main(argv):
    check = "--check" in argv
    slugs = [a for a in argv if not a.startswith("--")]
    if "--all" in argv or not slugs:
        slugs = WORLD3 + WORLD3_V2
    print("%s %d page(s); v1 against BOSS_SETUP, v2 against BOSS_SETUP_V2\n"
          % ("checking" if check else "regenerating", len(slugs)))
    drift = sum(regen(s, check) for s in slugs)
    print()
    if check and drift:
        print("FAIL -- %d block(s) no longer match what their cell prints." % drift)
        return 1
    print("clean -- every block matches its cell." if check
          else ("%d block(s) rewritten." % drift if drift else "nothing to do; all blocks current."))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
