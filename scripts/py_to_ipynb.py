"""Turn routing_notebook.py (cells marked '# %%', markdown cells '# %% [markdown]') into an .ipynb."""
import json
import os
import sys

src, dst = sys.argv[1], sys.argv[2]
lines = open(src, encoding="utf-8").read().split("\n")
cells, cur = [], None
for ln in lines:
    if ln.startswith("# %%"):
        if cur:
            cells.append(cur)
        cur = {"kind": "markdown" if "[markdown]" in ln else "code", "lines": []}
        continue
    if cur is None:
        continue
    if cur["kind"] == "markdown":
        assert ln == "" or ln.startswith("#"), ln
        ln = ln[2:] if ln.startswith("# ") else ln[1:]
    elif ln.startswith("# MAGIC "):
        ln = ln[len("# MAGIC "):]
    cur["lines"].append(ln)
cells.append(cur)

out = []
for c in cells:
    ls = c["lines"]
    while ls and not ls[0].strip():
        ls.pop(0)
    while ls and not ls[-1].strip():
        ls.pop()
    source = [x + "\n" for x in ls[:-1]] + ls[-1:]
    if c["kind"] == "markdown":
        out.append({"cell_type": "markdown", "metadata": {}, "source": source})
    else:
        out.append({"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": source})

nb = {"cells": out,
      "metadata": {"accelerator": "GPU", "colab": {"provenance": []},
                   "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                   "language_info": {"name": "python"}},
      "nbformat": 4, "nbformat_minor": 4}
tmp = dst + ".tmp"
with open(tmp, "w", encoding="utf-8", newline="\n") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)
    f.write("\n")
os.replace(tmp, dst)
print("%d cells (%d code) -> %s" % (len(out), sum(c["cell_type"] == "code" for c in out), dst))
