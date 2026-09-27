"""Every pasted output block and data file in the message-routing capstone, re-derived.

Same guard as scripts/svm_regen.py, for /learn/message-routing-capstone: a block is stdout frozen
at the moment someone pasted it, and a page keeps quoting it after the experiment changes. This
re-runs each block's section of scripts/routing_cases.py and compares.

It also covers the capstone's data files. Figures and labs import JSON from src/data/routing/,
which sections of routing_cases.py write; a file that no longer matches what its section writes
is drift of the same kind.

    python scripts/routing_regen.py --check     # verify only; exit 1 if anything drifted
    python scripts/routing_regen.py             # rewrite what drifted

A block is registerable only if it is one section's WHOLE stdout.
"""
import pathlib
import re
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEARN = ROOT / "src" / "app" / "learn"
DATA = ROOT / "src" / "data" / "routing"

# page (path under src/app/learn) -> {block suffix in `const outX`: routing_cases.py section}
BLOCKS = {
    "message-routing-capstone": {},
    "message-routing-capstone/the-job": {"Job": "job", "Followers": "followers"},
    "message-routing-capstone/how-the-data-was-made": {"Provenance": "provenance", "Senders": "senders"},
    "message-routing-capstone/anatomy-of-a-post": {"Parsers": "parsers", "Sample": "sample"},
    "message-routing-capstone/research-questions": {"Resolution": "resolution"},
    "message-routing-capstone/first-look": {"FirstLook": "first_look"},
    "message-routing-capstone/words-into-numbers": {"Vectors": "vectors"},
    "message-routing-capstone/reading-the-weights": {"Weights": "weights"},
    "message-routing-capstone/the-moderators-fingerprint": {"Fingerprint": "fingerprint",
                                                      "NotesCost": "notes_cost"},
}

# data file under src/data/routing -> the section that writes it
FILES = {
    "specimen.json": "specimen",
    "job.json": "job",
    "provenance.json": "provenance",
    "parsers.json": "parsers",
    "sample.json": "sample",
    "resolution.json": "resolution",
    "firstlook.json": "first_look",
    "vectors.json": "vectors",
    "weights.json": "weights",
    "fingerprint.json": "fingerprint",
    "notes.json": "notes_cost",
}

BANNER = re.compile(r"\n={70}\n(.*?)\n={70}\n")


def _trim(body):
    return "\n".join(ln.rstrip() for ln in body.split("\n")).rstrip("\n")


def run_sections(names):
    """Run several sections in ONE process and split the output on the section banners."""
    t0 = time.time()
    cmd = [sys.executable, "scripts/routing_cases.py"] + names
    p = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8")
    if p.returncode:
        raise SystemExit("%s exited %d:\n%s" % (" ".join(cmd), p.returncode, p.stderr[-2000:]))
    parts = BANNER.split(p.stdout.replace("\r\n", "\n"))
    bodies = [_trim(parts[i + 1]) for i in range(1, len(parts) - 1, 2)]
    if len(bodies) != len(names):
        raise SystemExit("expected %d sections, parsed %d" % (len(names), len(bodies)))
    return dict(zip(names, bodies)), time.time() - t0


def splice(s, page, name, got, check):
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
    print("  %-52s out%-12s %s" % (page, name, "ok" if same else ("DRIFTED" if check else "updated")))
    return s, 0 if same else 1


def regen_page(page, mapping, bodies, check):
    path = LEARN / page / "page.tsx"
    if not path.exists():
        print("  %-52s (no page yet)" % page)
        return 0
    if not mapping:
        print("  %-52s (no pasted blocks)" % page)
        return 0
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    s = raw.replace("\r\n", "\n")
    drift = 0
    for block, sec in mapping.items():
        s, d = splice(s, page, block, bodies[sec], check)
        drift += d
    if drift and not check:
        path.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    return drift


def regen_files(before, check):
    """Compare each data file the run rewrote with its bytes from before; in --check put them back."""
    drift = 0
    for f in FILES:
        now = (DATA / f).read_bytes()
        same = now == before[f]
        print("  %-52s %-15s %s" % ("src/data/routing/" + f, "", "ok" if same else
                                    ("DRIFTED" if check else "updated")))
        if not same:
            drift += 1
            if check and before[f] is not None:
                (DATA / f).write_bytes(before[f])
    return drift


def main(argv):
    check = "--check" in argv
    print("%s the message-routing capstone against scripts/routing_cases.py\n"
          % ("checking" if check else "regenerating"))
    # every section the pages paste or the data files come from, run ONCE in one process: a section
    # that feeds both a page block and a data file is not run twice
    before = {f: (DATA / f).read_bytes() if (DATA / f).exists() else None for f in FILES}
    want = sorted({sec for m in BLOCKS.values() for sec in m.values()} | set(FILES.values()))
    bodies, secs = run_sections(want)
    print("  %d sections in one run, %.1fs\n" % (len(want), secs))
    drift = sum(regen_page(p, BLOCKS[p], bodies, check) for p in BLOCKS)
    drift += regen_files(before, check)
    print()
    if check and drift:
        print("FAIL -- %d block(s)/file(s) no longer match what their section prints." % drift)
        return 1
    print("clean -- every block and file matches its section." if check
          else ("%d rewritten." % drift if drift else "nothing to do; all current."))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
