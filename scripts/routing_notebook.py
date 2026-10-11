# The source of public/capstone/message-routing-capstone.ipynb (runnable as a script, too). Rebuild the notebook with
#   python scripts/py_to_ipynb.py scripts/routing_notebook.py public/capstone/message-routing-capstone.ipynb
# Lines before the first cell marker are not copied into it.

# %% [markdown]
# # Message-routing capstone: the reproduction notebook
#
# This notebook rebuilds the capstone's router from the raw posts and reproduces its main numbers: the
# tutorial's accuracy against the job's, the leak audit's view, the thread-grouped harness, the final router,
# its threshold, the whole system on next month's posts, a forum the router has never seen (H7) and the label
# budget for a new one (E1).
#
# **Data.** 20 Newsgroups, the "bydate" release, through scikit-learn's `fetch_20newsgroups` (about 14 MB,
# downloaded on the first run). The 11,314 training posts are all earlier than the 7,532 test posts.
#
# **Runtime.** Encoding 18,846 posts with bge-large needs a GPU (on Colab: Runtime > Change runtime type > GPU)
# and took about 20 minutes on a GTX 1660 Ti. Everything else took about 10 minutes on the same machine. The
# encoding is saved, so a second run skips it.
#
# **Exactness.** Everything is deterministic except the GPU encoding, which can differ in the last digits on a
# different GPU. The capstone's numbers were produced on a GTX 1660 Ti with scikit-learn 1.8.0, numpy 2.3.5,
# sentence-transformers 5.4.1 and torch 2.11; each cell states what it printed there. On other hardware, the
# numbers that use the embedding can move by a post or two.

# %%
# Colab: install the scikit-learn version the capstone used (and sentence-transformers if it is missing).
# MAGIC %pip install -q "scikit-learn==1.8.0" sentence-transformers

# %%
import collections
import hashlib
import pathlib
import re
import time

import numpy as np
import sklearn
from scipy import sparse
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold, KFold, train_test_split
from sklearn.naive_bayes import ComplementNB
from sklearn.svm import LinearSVC

print("scikit-learn", sklearn.__version__, "| numpy", np.__version__)
T0 = time.time()

# %% [markdown]
# ## 1. The posts, cut into their parts
#
# A post is a block of header lines, a blank line, then the body. The body holds the poster's own lines, lines
# quoting someone else, and perhaps a signature after a `-- ` line. The subject is pulled out on its own.
# A thread is the subject without its `Re:`, and the sender is the address on the `From:` line.

# %%
QUOTE_RE = re.compile(r"(writes in|writes:|wrote:|says:|said:|^In article|^Quoted from|^\||^>)")
SIG_RE = re.compile(r"^-- ?$")


def parse(doc):
    """Split one raw post into header lines, subject, body, quoted lines and signature."""
    head, _, body = doc.partition("\n\n")
    meta, subject = [], ""
    for line in head.split("\n"):
        if line.lower().startswith("subject:"):
            subject = line.split(":", 1)[1].strip()
        elif line.strip():
            meta.append(line)
    lines = body.split("\n")
    cut = None
    for i, line in enumerate(lines):
        if SIG_RE.match(line):
            cut = i  # the last delimiter wins
    sig = lines[cut:] if cut is not None else []
    lines = lines[:cut] if cut is not None else lines
    quotes = [ln for ln in lines if QUOTE_RE.search(ln)]
    text = [ln for ln in lines if not QUOTE_RE.search(ln)]
    return dict(meta=meta, subject=subject, quotes=quotes, sig=sig, body=text)


def is_reply(p):
    return bool(re.match(r"\s*re\s*:", p["subject"], re.I))


def thread_of(p):
    s = p["subject"].lower()
    return re.sub(r"^((re|fwd?)\s*:\s*|\[.*?\]\s*)+", "", s).strip()


def author_of(p):
    for line in p["meta"]:
        if line.lower().startswith("from:"):
            m = re.search(r"[\w.+-]+@[\w.-]+", line.lower())
            return m.group(0) if m else line.lower()
    return ""


tr, te = fetch_20newsgroups(subset="train"), fetch_20newsgroups(subset="test")
names, ytr, yte = tr.target_names, tr.target, te.target
Ptr, Pte = [parse(x) for x in tr.data], [parse(x) for x in te.data]
new_tr = np.array([not is_reply(p) for p in Ptr])
new = np.array([not is_reply(p) for p in Pte])
threads_tr = [thread_of(p) for p in Ptr]
authors, authors_te = [author_of(p) for p in Ptr], [author_of(p) for p in Pte]
# the article number: the order the collecting server received each post, per forum
art_tr = np.array([int(re.search(r"(\d+)$", str(f)).group(1)) for f in tr.filenames])
art_te = np.array([int(re.search(r"(\d+)$", str(f)).group(1)) for f in te.filenames])
nw = np.where(new)[0]
print("earlier posts %d, later posts %d, of which new threads %d" % (len(ytr), len(yte), len(nw)))

# %% [markdown]
# ## 2. The job: which later posts need a model at all (page 2)
#
# A reply goes wherever its thread already lives. The model is needed for the new threads, and for the first
# reply of each thread whose opening post is missing from the data.
#
# Printed on the capstone's machine: lookup right 0.9818 on 3,903 replies; 4,466 posts (0.593) filed by the
# lookup; 3,066 (0.407) need the model.

# %%
before = collections.defaultdict(collections.Counter)  # threads filed before the cut-off
for p, y in zip(Ptr, ytr):
    before[thread_of(p)][y] += 1
opened = collections.defaultdict(collections.Counter)  # threads opened by a later new post
for q in nw:
    opened[thread_of(Pte[q])][yte[q]] += 1
key_te = [thread_of(p) for p in Pte]
grp = {"before": [], "later": [], "missing": []}
for q in np.where(~new)[0]:
    k = key_te[q]
    grp["before" if k in before else "later" if k in opened else "missing"].append(q)
look = lambda k: (before[k] if k in before else opened[k]).most_common(1)[0][0]
known = grp["before"] + grp["later"]
right = np.array([look(key_te[q]) == yte[q] for q in known])
missing_threads = len(set(key_te[q] for q in grp["missing"]))
n_look = (~new).sum() - missing_threads
print("replies %d: the thread's forum is known for %d, lookup right %.4f" % ((~new).sum(), len(known), right.mean()))
print("filed by the lookup, no model: %d (%.3f)" % (n_look, n_look / len(yte)))
print("need the model: %d new threads + the first reply of %d threads = %d (%.3f)"
      % (len(nw), missing_threads, len(nw) + missing_threads, (len(nw) + missing_threads) / len(yte)))

# %% [markdown]
# ## 3. The tutorial's number and the job's number (page 1)
#
# A linear SVM on TF-IDF, C = 0.3 (chosen on folds grouped by thread). The tutorial splits all 18,846 posts at
# random; the job trains on the earlier posts and routes the later new threads.
#
# Printed: random split 0.9252 (0.9213-0.9280); later new threads, whole post 0.8239; the subject and body
# alone 0.8235.

# %%
C_SVM = 0.3
CHANNELS = ("meta", "subject", "quotes", "sig")


def render(p, keep):
    out = []
    if "meta" in keep:
        out += p["meta"]
    if "subject" in keep:
        out.append(p["subject"])
    out += p["body"]
    if "quotes" in keep:
        out += p["quotes"]
    if "sig" in keep:
        out += p["sig"]
    return "\n".join(out)


def tfidf(train, test):
    v = TfidfVectorizer(sublinear_tf=True)
    return v.fit_transform(train), v.transform(test)


def svm_predict(Xa, ya, Xb, C=C_SVM):
    return LinearSVC(C=C).fit(Xa, ya).predict(Xb)


whole = [render(p, CHANNELS) for p in Ptr + Pte]
y_all = np.concatenate([ytr, yte])
accs = []
for seed in range(5):
    i, j = train_test_split(np.arange(len(y_all)), test_size=len(yte), random_state=seed, stratify=y_all)
    Xa, Xb = tfidf([whole[k] for k in i], [whole[k] for k in j])
    accs.append(np.mean(svm_predict(Xa, y_all[i], Xb) == y_all[j]))
print("random split, 5 seeds: %.4f (%.4f-%.4f)" % (np.mean(accs), min(accs), max(accs)))
Xa, Xb = tfidf(whole[:len(ytr)], whole[len(ytr):])
print("later new threads, whole post: %.4f" % (svm_predict(Xa, ytr, Xb) == yte)[new].mean())
Xa, Xb = tfidf([render(p, ("subject",)) for p in Ptr], [render(p, ("subject",)) for p in Pte])
print("later new threads, subject and body: %.4f" % (svm_predict(Xa, ytr, Xb) == yte)[new].mean())

# %% [markdown]
# ## 4. The router's view after the leak audit (pages 9-10)
#
# The subject and the body, with the soc.religion.christian moderator's bracketed notes taken out and the last
# block cut when it is an undelimited signature (the block scikit-learn's footer rule would cut, taken only
# when the post has no `-- ` signature).
#
# Printed: later new threads 0.8168; 36.5% of them come from a sender the router has met.

# %%
NOTE_RE = re.compile(r"\[[^\[\]]*?--\s*clh\s*\]", re.S | re.I)


def _footer_line(lines):
    line_num = 0
    for line_num in range(len(lines) - 1, -1, -1):
        if lines[line_num].strip().strip("-") == "":
            break
    return line_num


def tail_split(p):
    b = p["body"]
    if p["sig"]:
        return b, []
    lo, hi = 0, len(b)
    while lo < hi and not b[lo].strip():
        lo += 1
    while hi > lo and not b[hi - 1].strip():
        hi -= 1
    k = _footer_line(b[lo:hi])
    return (b[:lo + k], b[lo + k:]) if k > 0 else (b, [])


def view_of(p):
    q = dict(p)
    q["body"] = NOTE_RE.sub(" ", "\n".join(p["body"])).split("\n")
    kept, _ = tail_split(q)
    return "\n".join([p["subject"]] + kept)


A, B = [view_of(p) for p in Ptr], [view_of(p) for p in Pte]
seen = set(authors)
met = np.array([a in seen for a in authors_te])
share = met[new].mean()
Xa, Xb = tfidf(A, B)
ok_later = svm_predict(Xa, ytr, Xb) == yte
print("later new threads: %.4f   all later posts: %.4f" % (ok_later[new].mean(), ok_later.mean()))
print("new threads from a sender the router has met: %.1f%%" % (100 * share))

# %% [markdown]
# ## 5. The harness: folds grouped by thread (page 11)
#
# Random folds put a thread's replies on both sides of the line. Folds grouped by thread, scored on the new
# threads and weighted to next month's share of familiar senders, predict the later posts.
#
# Printed: random 5-fold, all posts 0.8795 (later 0.8056); grouped by thread, new threads 0.8250, weighted
# 0.8181 (later 0.8168).

# %%
au = np.array(authors)
for name, splits in (("random 5-fold", KFold(5, shuffle=True, random_state=0).split(A)),
                     ("grouped by thread", GroupKFold(5).split(A, ytr, threads_tr))):
    oks, isnew, kn = [], [], []
    for i, j in splits:
        Ta, Tb = tfidf([A[a] for a in i], [A[b] for b in j])
        oks.append(svm_predict(Ta, ytr[i], Tb) == ytr[j])
        isnew.append(new_tr[j])
        s = set(au[i])
        kn.append(np.array([a in s for a in au[j]]))
    o, m, k = map(np.concatenate, (oks, isnew, kn))
    w = share * o[m & k].mean() + (1 - share) * o[m & ~k].mean()
    print("%-18s all posts %.4f   new threads %.4f   weighted to next month's senders %.4f" % (name, o.mean(), o[m].mean(), w))

# %% [markdown]
# ## 6. The final router (pages 18-20)
#
# Complement naive Bayes reading all four: word pairs, pieces of words (2-5 characters), the subject again
# with a vocabulary of its own, and the quoted text. Each block is put through log counts and scaled to length
# one. Beside it, the sender's history as a term of its own, and the log-probabilities of a logistic regression
# on the bge-large sentence embedding. Every setting was chosen on the harness (alpha 0.01, history beta 1 and
# weight 1, C 3, embedding weight 0.3).
#
# The words are counted once for every post. A refit on fewer posts keeps the columns those posts contain (a
# piece: in two of them), which is exactly what fitting the counters on those posts alone gives, so the
# refits in sections 7-10 are fast.

# %%
ATTRIBUTION_ONLY = re.compile(r"(writes in|writes:|wrote:|says:|said:|^In article|^Quoted from)")
ALPHA, BETA, HIST_W, C_EMB, V_EMB = 0.01, 1.0, 1.0, 3.0, 0.3


def quoted(p):
    return "\n".join(ln for ln in p["quotes"] if not ATTRIBUTION_ONLY.search(ln))


TA, TB = [v + "\n" + quoted(p) for v, p in zip(A, Ptr)], [v + "\n" + quoted(p) for v, p in zip(B, Pte)]
SA, SB = [p["subject"] for p in Ptr], [p["subject"] for p in Pte]
vw, vs = CountVectorizer(ngram_range=(1, 2)), CountVectorizer()
vp = CountVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2)
# two blocks, each (earlier counts, later counts, min_df): the words and the subject's own words; the pieces
BLOCKS = [[(vw.fit_transform(TA).tocsr(), vw.transform(TB).tocsr(), 1),
           (vs.fit_transform(SA).tocsr(), vs.transform(SB).tocsr(), 1)],
          [(vp.fit_transform(TA).tocsr(), vp.transform(TB).tocsr(), 2)]]
print("columns: words %d, subject %d, pieces %d" % tuple(M.shape[1] for parts in BLOCKS for M, _, _ in parts))


def _len(M):
    L = M.astype(float)
    L.data = 1 + np.log(L.data)
    return TfidfTransformer(use_idf=False).fit_transform(L)


def nb_scores(i, side, rows, w=None):
    """Complement NB on all four, fitted on the earlier posts i (weighted by w): scores for the rows of the
    earlier ('tr') or later ('te') posts, one column per forum (-inf for a forum with no posts in i)."""
    Na, Nb = [], []
    for parts in BLOCKS:
        a, b = [], []
        for Ma, Mb, m in parts:
            sub = Ma[i]
            c = np.where(np.bincount(sub.indices, minlength=Ma.shape[1]) >= m)[0]
            a.append(sub[:, c])
            b.append((Ma if side == "tr" else Mb)[rows][:, c])
        Na.append(_len(sparse.hstack(a).tocsr()))
        Nb.append(_len(sparse.hstack(b).tocsr()))
    r = 1 / np.sqrt(len(Na))
    Na, Nb = sparse.hstack(Na).tocsr() * r, sparse.hstack(Nb).tocsr() * r
    m = ComplementNB(alpha=ALPHA).fit(Na, ytr[i], sample_weight=w)
    out = np.full((Nb.shape[0], 20), -np.inf)
    out[:, m.classes_] = np.asarray(Nb @ m.feature_log_prob_.T)
    return out


def history(i, senders):
    """Each sender's earlier posts (those in i) by forum, as smoothed log shares; zeros for a sender with none."""
    H = collections.defaultdict(lambda: np.zeros(20))
    for q in i:
        H[authors[q]][ytr[q]] += 1
    Hc = np.array([H[s] if s in H else np.zeros(20) for s in senders])
    n = Hc.sum(1, keepdims=True)
    return np.where(n > 0, np.log((Hc + BETA) / (n + 20 * BETA)), 0.0)


# %% [markdown]
# The sentence embedding: bge-large-en-v1.5 on the router's view, L2-normalised, in fp32. The texts are hashed
# so a saved encoding is only reused for the same view. The view's hash on the capstone's machine: `a99e79bb3efe`.

# %%
def text_key(*parts):
    h = hashlib.sha256()
    for part in parts:
        for t in part:
            h.update(t.encode("utf-8", "surrogatepass") + bytes(1))
        h.update(bytes([1]))
    return np.frombuffer(h.digest(), np.uint8)


VIEW_KEY = text_key(A, B)
print("the router's view:", bytes(VIEW_KEY).hex()[:12])
CACHE = pathlib.Path.home() / "scikit_learn_data" / "routing_cache"
EMB = next((f for f in (CACHE / "bge-large_audited.npz", CACHE / "bge-large_notebook.npz")
            if f.exists() and (np.load(f)["key"] == VIEW_KEY).all()), None)
if EMB is None:
    from sentence_transformers import SentenceTransformer
    t1 = time.time()
    enc = SentenceTransformer("BAAI/bge-large-en-v1.5", device="cuda")
    E = lambda T: enc.encode(T, batch_size=32, normalize_embeddings=True, show_progress_bar=True,
                             convert_to_numpy=True).astype(np.float32)
    EMB = CACHE / "bge-large_notebook.npz"
    CACHE.mkdir(parents=True, exist_ok=True)
    np.savez(EMB, tr=E(A), te=E(B), key=VIEW_KEY)
    print("encoded in %.0f s" % (time.time() - t1))
z = np.load(EMB)
Etr, Ete = z["tr"], z["te"]
print("embedding", Etr.shape, Ete.shape, "from", EMB.name)


# %% [markdown]
# The router, fitted on any set of earlier posts and scoring any posts. Fitted on every earlier post, it scores
# all 7,532 later posts at once (replies too: the system in section 8 needs them).
#
# Printed: later new threads routed right 0.8809.

# %%
def logp(i, Eb, w=None):
    m = LogisticRegression(C=C_EMB, max_iter=5000).fit(Etr[i], ytr[i], sample_weight=w)
    out = np.full((len(Eb), 20), -np.inf)
    out[:, m.classes_] = m.predict_log_proba(Eb)
    return out


def router(i, side, rows, w=None):
    """The final router fitted on the earlier posts i: its score for each forum, for the given rows."""
    senders = [(authors if side == "tr" else authors_te)[q] for q in rows]
    Eb = (Etr if side == "tr" else Ete)[rows]
    return nb_scores(i, side, rows, w) + HIST_W * history(i, senders) + V_EMB * logp(i, Eb, w)


def margins(S):
    t = np.sort(S, axis=1)
    return t[:, -1] - t[:, -2]


ALL = np.arange(len(ytr))
S_all = router(ALL, "te", np.arange(len(yte)))
p_all, g_all = S_all.argmax(1), margins(S_all)
ok_new = p_all[nw] == yte[nw]
print("later new threads routed right: %.4f" % ok_new.mean())

# %% [markdown]
# ## 7. The threshold, set on each forum's latest quarter (page 22)
#
# The router is refitted on each forum's earliest three quarters of the earlier posts (by article number) and
# scores the new threads in the latest quarter. The threshold on the gap between its two best scores is the
# smallest at which those threads, surest first, are still 95% right.
#
# Printed: threshold 1.036. Next month it files 0.797 of the new threads, 0.9439 of them right; for the
# threads it hands to a person, the right forum is among its top three 0.926 of the time.

# %%
val = np.zeros(len(ytr), bool)
for k in range(20):
    idx = np.where(ytr == k)[0]
    val[idx[art_tr[idx] > np.quantile(art_tr[idx], 0.75)]] = True
jn = np.where(val & new_tr)[0]
S_val = router(np.where(~val)[0], "tr", jn)
g_val, ok_val = margins(S_val), S_val.argmax(1) == ytr[jn]
o = np.argsort(-g_val, kind="stable")
run = np.cumsum(ok_val[o]) / np.arange(1, len(o) + 1)
t = float(g_val[o][np.where(run >= 0.95)[0].max()])
filed = g_all[nw] >= t
rank = (S_all[nw] > S_all[nw, yte[nw]][:, None]).sum(1) + 1
print("threshold %.3f (set on %d new threads)" % (t, len(jn)))
print("later new threads: filed %.3f, right among filed %.4f; handed to a person %d, right forum in the top three %.3f"
      % (filed.mean(), ok_new[filed].mean(), (~filed).sum(), (rank[~filed] <= 3).mean()))

# %% [markdown]
# ## 8. The whole system on next month's posts (page 25)
#
# The router reads the new threads and the first reply (the earliest by article number) of each thread whose
# opener is missing. It files those whose gap reaches the threshold and hands the rest to a person, whose
# placement is counted right. Every other reply goes where its thread lives: the earlier posts' forum, or
# wherever its opener was placed.
#
# Printed: placed without a person 6,929 (0.920), right 0.9495; a person reads 603; the 350 wrong placements
# are 133 router misfiles, 149 replies that followed them and 68 replies in a thread held in two forums.

# %%
miss = collections.defaultdict(list)
for q in grp["missing"]:
    miss[key_te[q]].append(q)
first = {k: min(v, key=lambda q: (art_te[q], q)) for k, v in miss.items()}
routed = np.concatenate([nw, sorted(first.values())])
placed, how = np.full(len(yte), -1), np.full(len(yte), "", dtype=object)
for q in routed:
    placed[q], how[q] = (p_all[q], "filed") if g_all[q] >= t else (yte[q], "person")
where = collections.defaultdict(collections.Counter)
for q in nw:
    where[key_te[q]][placed[q]] += 1
is_routed = np.zeros(len(yte), bool)
is_routed[routed] = True
for q in np.where(~is_routed)[0]:
    k = key_te[q]
    if k in before:
        f = truth = before[k].most_common(1)[0][0]
    elif k in opened:
        f, truth = where[k].most_common(1)[0][0], opened[k].most_common(1)[0][0]
    else:
        f, truth = placed[first[k]], yte[first[k]]
    placed[q] = f
    how[q] = "lookup" if f == yte[q] else "two forums" if f == truth else "followed"
auto, ok_sys = how != "person", placed == yte
print("placed without a person: %d of %d (%.3f), right %.4f" % (auto.sum(), len(yte), auto.mean(), ok_sys[auto].mean()))
print("a person reads %d; every later post right, a person's placements counted right: %.4f"
      % ((~auto).sum(), ok_sys.mean()))
print("wrong: router misfiles %d, replies that followed them %d, replies in a thread held in two forums %d"
      % (((how == "filed") & ~ok_sys).sum(), (how == "followed").sum(), (how == "two forums").sum()))

# %% [markdown]
# ## 9. A forum the router has never seen (H7, page 24)
#
# Each forum in turn is left out of the training and the router is refitted on the other nineteen; each later
# new thread is read off the run that left its own forum out. Holding the new forum's family for a person sends
# every thread the router would file into that family to a person instead (misc.forsale has no family).
#
# Printed: filed without a person 0.3696 (0.3518-0.3870); with the hold, 0.0910 (0.0799-0.1025).

# %%
RELIGION = ("alt.atheism", "soc.religion.christian", "talk.religion.misc")


def family_of(forum):
    if forum in RELIGION:
        return "religion"
    for f in ("comp", "rec", "sci"):
        if forum.startswith(f + "."):
            return f
    return "politics" if forum.startswith("talk.politics.") else forum


def boot(stat, n, seed=16):
    rng = np.random.default_rng(seed)
    return np.percentile([stat(rng.integers(0, n, n)) for _ in range(2000)], [2.5, 97.5])


y = yte[nw]
fam = np.array([family_of(x) for x in names])
pred, gap, caught = np.zeros(len(y), int), np.zeros(len(y)), np.zeros(len(y), bool)
for k in range(20):
    S = router(np.where(ytr != k)[0], "te", nw)
    m = y == k
    pred[m], gap[m] = S.argmax(1)[m], margins(S)[m]
    if fam[k] != "misc.forsale":
        caught[m] = (gap[m] >= t) & (fam[pred[m]] == fam[k])
lost = gap >= t
print("filed without a person: %.4f (%.4f-%.4f)" % (lost.mean(), *boot(lambda i: lost[i].mean(), len(y))))
print("with the family hold: %.4f (%.4f-%.4f)" % ((lost & ~caught).mean(), *boot(lambda i: (lost & ~caught)[i].mean(), len(y))))

# %% [markdown]
# ## 10. The label budget for a new forum (E1, page 23)
#
# Each forum in turn keeps only its latest 80 earlier posts, the others keep all of theirs, and each later new
# thread is read off its own forum's run. As fitted, the 80 posts are outvoted; weighted to an average forum's
# pull (each counts as the other forums' posts / 19 / 80, in the naive Bayes and the logistic regression), they
# are not.
#
# Printed: routed right as fitted 0.3712 (0.3526-0.3902); weighted 0.7372 (0.7206-0.7543).

# %%
for weighted in (False, True):
    ok = np.zeros(len(y), bool)
    for k in range(20):
        idx = np.where(ytr == k)[0]
        keep = np.sort(np.concatenate([np.where(ytr != k)[0], idx[np.argsort(art_tr[idx], kind="stable")[-80:]]]))
        mk = ytr[keep] == k
        w = np.where(mk, (~mk).sum() / 19 / mk.sum(), 1.0) if weighted else None
        m = y == k
        ok[m] = router(keep, "te", nw, w).argmax(1)[m] == k
    print("%-10s routed right %.4f (%.4f-%.4f)" % ("weighted" if weighted else "as fitted", ok.mean(),
                                                    *boot(lambda i: ok[i].mean(), len(y))))
print("\nthe whole notebook: %.0f s" % (time.time() - T0))
