"""
routing_cases.py -- honest numbers for the message-routing capstone (docs/routing-capstone-plan.md).

Every published number in /learn/message-routing-capstone comes from a run of this file.

    python scripts/routing_cases.py               # everything
    python scripts/routing_cases.py headline      # one section

Data: 20 Newsgroups, the "bydate" release, via sklearn's fetch_20newsgroups (18,846 Usenet posts
from 1993 in 20 forums; the training posts are all earlier than the test posts). Downloaded once
into ~/scikit_learn_data.

Pretrained sentence embeddings (the `embeddings` sections) are computed once from locally cached
models and saved under ~/scikit_learn_data/routing_cache, because a GPU encode is not guaranteed
to be bit-identical run to run and one flipped post would make every downstream number drift.
Each cache prints a short hash so a changed cache is visible.

Deterministic otherwise: sklearn 1.8, numpy 2.3, LinearSVC with its default dual solver, every
split seeded, forests with n_jobs=1.
"""
import collections
import hashlib
import itertools
import json
import os
import pathlib
import re
import sys
import time

import numpy as np
from scipy import sparse
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import GroupKFold, KFold, train_test_split
from sklearn.naive_bayes import ComplementNB, MultinomialNB
from sklearn.svm import LinearSVC

np.set_printoptions(precision=4, suppress=True)
ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = pathlib.Path.home() / "scikit_learn_data" / "routing_cache"


def section(t):
    print("\n" + "=" * 70 + "\n" + t + "\n" + "=" * 70)


# ------------------------------------------------------------------ #
# Reading a post: its five parts
# ------------------------------------------------------------------ #
# Quoted lines and "X writes:" attributions: the same pattern sklearn's remove=("quotes",) uses.
QUOTE_RE = re.compile(r"(writes in|writes:|wrote:|says:|said:|^In article|^Quoted from|^\||^>)")
# The Usenet signature delimiter is a line that is exactly "-- " (or "--" once trailing spaces
# are eaten). sklearn's remove=("footers",) instead cuts everything after the LAST blank line,
# which takes the final paragraph of almost every post with it; this cuts only a real signature.
SIG_RE = re.compile(r"^-- ?$")
CHANNELS = ("meta", "subject", "quotes", "sig")
CONTENT = ("subject",)  # what the router reads: the subject and the body, nothing else


def parse(doc):
    """Split one raw post into meta headers, subject, body, quoted lines and signature."""
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


_D = {}


def data():
    if not _D:
        tr = fetch_20newsgroups(subset="train")
        te = fetch_20newsgroups(subset="test")
        Ptr = [parse(d) for d in tr.data]
        Pte = [parse(d) for d in te.data]
        _D.update(
            names=tr.target_names, raw_tr=tr.data, raw_te=te.data, Ptr=Ptr, Pte=Pte,
            ytr=tr.target, yte=te.target,
            new=np.array([not is_reply(p) for p in Pte]),
            new_tr=np.array([not is_reply(p) for p in Ptr]),
            threads=[thread_of(p) for p in Ptr], authors=[author_of(p) for p in Ptr],
        )
    return _D


def texts(P, keep):
    return [render(p, keep) for p in P]


def tfidf(train, test, **kw):
    v = TfidfVectorizer(sublinear_tf=True, **kw)
    return v.fit_transform(train), v.transform(test), v


def svm_predict(Xa, ya, Xb, C):
    return LinearSVC(C=C).fit(Xa, ya).predict(Xb)


C_GRID = (0.1, 0.3, 1.0, 3.0)
_BEST_C = {}


def best_c():
    """C for the content-view linear SVM, chosen by thread-grouped 5-fold CV on training only."""
    if "c" not in _BEST_C:
        d = data()
        scores = {}
        for C in C_GRID:
            scores[C] = float(np.mean([np.mean(svm_predict(Ta, d["ytr"][i], Tb, C) == d["ytr"][j])
                                       for i, j, Ta, Tb in folds()]))
        _BEST_C["c"] = max(C_GRID, key=lambda c: (round(scores[c], 4), -c))
        _BEST_C["scores"] = scores
    return _BEST_C["c"]


def report(ok, mask):
    return "%.4f" % ok[mask].mean()


# ------------------------------------------------------------------ #
# 1. The headline: the tutorial number, and the number for the job
# ------------------------------------------------------------------ #
def headline():
    section("1. headline -- the tutorial's number and the job's number")
    d = data()
    C = best_c()
    raw_all = [render(p, CHANNELS) for p in d["Ptr"] + d["Pte"]]
    y_all = np.concatenate([d["ytr"], d["yte"]])
    print("posts %d  forums %d  (train %d earlier, test %d later)"
          % (len(y_all), len(d["names"]), len(d["ytr"]), len(d["yte"])))
    print()
    accs = []
    for seed in range(5):
        i, j = train_test_split(np.arange(len(y_all)), test_size=len(d["yte"]),
                                random_state=seed, stratify=y_all)
        Xa, Xb, _ = tfidf([raw_all[k] for k in i], [raw_all[k] for k in j])
        accs.append(np.mean(svm_predict(Xa, y_all[i], Xb, C) == y_all[j]))
    print("linear SVM (C=%g), TF-IDF, whole posts" % C)
    print("  random split, 5 seeds         accuracy %.4f  (range %.4f-%.4f)"
          % (np.mean(accs), min(accs), max(accs)))
    Xa, Xb, _ = tfidf(texts(d["Ptr"], CHANNELS), texts(d["Pte"], CHANNELS))
    ok = svm_predict(Xa, d["ytr"], Xb, C) == d["yte"]
    print("  later posts, all of them      accuracy %s" % report(ok, np.ones_like(ok)))
    print("  later posts, new threads      accuracy %s  (n=%d)" % (report(ok, d["new"]), d["new"].sum()))
    Xa, Xb, _ = tfidf(texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT))
    ok = svm_predict(Xa, d["ytr"], Xb, C) == d["yte"]
    print()
    print("the router's view: subject + body (no header metadata, quotes or signature)")
    print("  later posts, new threads      accuracy %s" % report(ok, d["new"]))


# ------------------------------------------------------------------ #
# 2. Who the model will actually meet
# ------------------------------------------------------------------ #
def population():
    section("2. population -- replies, new threads and the forum mix")
    d = data()
    names = d["names"]
    rtr = ~d["new_tr"]
    rte = ~d["new"]
    print("replies (subject starts 'Re:'): train %d of %d (%.3f)   test %d of %d (%.3f)"
          % (rtr.sum(), len(rtr), rtr.mean(), rte.sum(), len(rte), rte.mean()))
    print("new threads in the test set: %d" % d["new"].sum())
    print()
    c_all = np.bincount(d["yte"], minlength=20)
    c_new = np.bincount(d["yte"][d["new"]], minlength=20)
    print("%-26s %9s %12s %9s" % ("forum", "all posts", "new threads", "share"))
    for k in np.argsort(-c_new):
        print("%-26s %9d %12d %9.3f" % (names[k], c_all[k], c_new[k], c_new[k] / c_new.sum()))
    print()
    print("biggest forum share: all posts %.3f   new threads %.3f"
          % (c_all.max() / c_all.sum(), c_new.max() / c_new.sum()))


# ------------------------------------------------------------------ #
# Pretrained sentence embeddings, cached
# ------------------------------------------------------------------ #
EMBEDDERS = {
    "minilm": "sentence-transformers/all-MiniLM-L6-v2",
    "bge-large": "BAAI/bge-large-en-v1.5",
}


def embed(key):
    """(train, test) embeddings of the router's view, L2-normalised, from the local cache."""
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / ("%s_content.npz" % key)
    if not f.exists():
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        from sentence_transformers import SentenceTransformer
        d = data()
        m = SentenceTransformer(EMBEDDERS[key], device="cuda")  # fp32: on a GTX 1660 Ti, fp16 ran 4x slower
        enc = lambda P: m.encode(texts(P, CONTENT), batch_size=32, normalize_embeddings=True,
                                 show_progress_bar=False, convert_to_numpy=True).astype(np.float32)
        np.savez(f, tr=enc(d["Ptr"]), te=enc(d["Pte"]))
    z = np.load(f)
    return z["tr"], z["te"]


def cache_hash(key):
    f = CACHE / ("%s_content.npz" % key)
    return hashlib.sha256(f.read_bytes()).hexdigest()[:12]


def stack(X, E, w):
    return sparse.hstack([X, sparse.csr_matrix(E * w)]).tocsr()


# ------------------------------------------------------------------ #
# 3. The model ladder on the job's posts
# ------------------------------------------------------------------ #
def ladder():
    section("3. ladder -- every model on the router's view, scored on new threads")
    d = data()
    C = best_c()
    A, B = texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT)
    new, ytr, yte = d["new"], d["ytr"], d["yte"]
    Xa, Xb, v = tfidf(A, B)
    cv = CountVectorizer()
    Ca, Cb = cv.fit_transform(A), cv.transform(B)
    print("TF-IDF: %d posts x %d words, %.1f non-zero words per post (%.3f%% of the columns)"
          % (Xa.shape[0], Xa.shape[1], Xa.nnz / Xa.shape[0], 100 * Xa.nnz / np.prod(Xa.shape)))
    print()
    rows = []

    def add(name, p):
        ok = p == yte
        rows.append((name, ok[new].mean(), f1_score(yte[new], p[new], average="macro")))

    add("majority forum", np.full_like(yte, np.bincount(ytr).argmax()))
    add("multinomial NB, counts", MultinomialNB(alpha=0.01).fit(Ca, ytr).predict(Cb))
    add("multinomial NB, TF-IDF", MultinomialNB(alpha=0.01).fit(Xa, ytr).predict(Xb))
    add("complement NB, TF-IDF", ComplementNB(alpha=0.3).fit(Xa, ytr).predict(Xb))
    add("logistic regression, C=10", LogisticRegression(C=10, max_iter=3000).fit(Xa, ytr).predict(Xb))
    add("linear SVM, C=%g" % C, svm_predict(Xa, ytr, Xb, C))
    print("%-28s %12s %10s" % ("model", "new threads", "macro-F1"))
    for name, a, f in rows:
        print("%-28s %12.4f %10.4f" % (name, a, f))


# ------------------------------------------------------------------ #
# 4. Pretrained embeddings: alone, and next to TF-IDF
# ------------------------------------------------------------------ #
W_GRID = (0.1, 0.25, 0.5, 1.0)


def embeddings():
    section("4. embeddings -- pretrained sentence vectors, alone and beside TF-IDF")
    d = data()
    C = best_c()
    A, B = texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT)
    new, ytr, yte = d["new"], d["ytr"], d["yte"]
    Xa, Xb, _ = tfidf(A, B)
    ok = svm_predict(Xa, ytr, Xb, C) == yte
    print("%-40s new threads %.4f" % ("TF-IDF, linear SVM (C=%g)" % C, ok[new].mean()))
    for key in EMBEDDERS:
        Ea, Eb = embed(key)
        print()
        print("%s: %d dimensions, cache %s" % (EMBEDDERS[key], Ea.shape[1], cache_hash(key)))
        for c in C_GRID:
            ok = svm_predict(Ea, ytr, Eb, c) == yte
            print("  %-38s new threads %.4f" % ("embedding alone, linear SVM C=%g" % c, ok[new].mean()))
        # the TF-IDF/embedding balance is chosen on training data only (thread-grouped CV)
        cvs = cv_weights(key)
        w = max(W_GRID, key=lambda x: round(cvs[x], 4))
        ok = svm_predict(stack(Xa, Ea, w), ytr, stack(Xb, Eb, w), C) == yte
        print("  weight chosen by thread-grouped CV: %s -> %g" % (
            "  ".join("%g:%.4f" % (x, cvs[x]) for x in W_GRID), w))
        print("  %-38s new threads %.4f" % ("TF-IDF + embedding, linear SVM", ok[new].mean()))


# ------------------------------------------------------------------ #
# The final model, chosen on training data only
# ------------------------------------------------------------------ #
_FINAL = {}


_FOLDS = []
_CVW = {}


def folds():
    """The five thread-grouped folds of the router's view, vectorised once and reused."""
    if not _FOLDS:
        d = data()
        A = texts(d["Ptr"], CONTENT)
        for i, j in GroupKFold(n_splits=5).split(A, d["ytr"], d["threads"]):
            Ta, Tb, _ = tfidf([A[k] for k in i], [A[k] for k in j])
            _FOLDS.append((i, j, Ta, Tb))
    return _FOLDS


def cv_weights(key):
    """Thread-grouped CV accuracy of TF-IDF + embedding at each weight (computed once per key)."""
    if key not in _CVW:
        d = data()
        ytr = d["ytr"]
        Ea, _ = embed(key)
        C = best_c()
        _CVW[key] = {w: float(np.mean([np.mean(svm_predict(stack(Ta, Ea[i], w), ytr[i],
                                                            stack(Tb, Ea[j], w), C) == ytr[j])
                                        for i, j, Ta, Tb in folds()]))
                     for w in W_GRID}
    return _CVW[key]


def _cv_pick(key):
    cvs = cv_weights(key)
    w = max(W_GRID, key=lambda x: round(cvs[x], 4))
    return w, cvs[w]


def final_model():
    """TF-IDF alone or TF-IDF + one embedding, whichever thread-grouped CV on training prefers.

    Returns (name, train matrix, test matrix, C) for the router's view.
    """
    if not _FINAL:
        d = data()
        C = best_c()
        A, B = texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT)
        Xa, Xb, _ = tfidf(A, B)
        best = ("TF-IDF", _BEST_C["scores"][C], Xa, Xb)
        for key in EMBEDDERS:
            Ea, Eb = embed(key)
            w, s = _cv_pick(key)
            if round(s, 4) > round(best[1], 4):
                best = ("TF-IDF + %s (weight %g)" % (key, w), s, stack(Xa, Ea, w), stack(Xb, Eb, w))
        _FINAL.update(name=best[0], cv=best[1], Xa=best[2], Xb=best[3], C=C)
    return _FINAL


def margins(S):
    """Top score minus runner-up: how far the winning forum is ahead."""
    t = np.sort(S, axis=1)
    return t[:, -1] - t[:, -2]


# ------------------------------------------------------------------ #
# 6. Automate or hand off
# ------------------------------------------------------------------ #
TARGETS = (0.95, 0.90)


_AUTO = {}


def auto_route():
    """Out-of-fold margins of the final model on the TRAINING new threads (where thresholds are
    set, never on the test set) and its margins on the later new threads (computed once)."""
    if not _AUTO:
        d = data()
        f = final_model()
        ytr, yte, new = d["ytr"], d["yte"], d["new"]
        oof_m = np.zeros(len(ytr))
        oof_ok = np.zeros(len(ytr), bool)
        for i, j in GroupKFold(n_splits=5).split(f["Xa"], ytr, d["threads"]):
            m = LinearSVC(C=f["C"]).fit(f["Xa"][i], ytr[i])
            S = m.decision_function(f["Xa"][j])
            oof_m[j] = margins(S)
            oof_ok[j] = S.argmax(1) == ytr[j]
        m = LinearSVC(C=f["C"]).fit(f["Xa"], ytr)
        S = m.decision_function(f["Xb"])[new]
        y = yte[new]
        _AUTO.update(tm=oof_m[d["new_tr"]], tok=oof_ok[d["new_tr"]], mg=margins(S),
                     ok=S.argmax(1) == y, top3=(np.argsort(-S, axis=1)[:, :3] == y[:, None]).any(1))
    return _AUTO


def threshold(tgt):
    """The smallest margin at which the training new threads, most confident first, stay at tgt."""
    a = auto_route()
    o = np.argsort(-a["tm"])
    run = np.cumsum(a["tok"][o]) / np.arange(1, len(o) + 1)
    return a["tm"][o][np.where(run >= tgt)[0].max()]


def automation():
    section("6. automation -- route the sure ones, hand the rest to a moderator")
    f = final_model()
    print("model: %s, linear SVM C=%g (thread-grouped CV %.4f)" % (f["name"], f["C"], f["cv"]))
    a = auto_route()
    mg, ok, top3 = a["mg"], a["ok"], a["top3"]
    print("new threads in the test set: %d, accuracy with no hand-off %.4f, top-3 %.4f"
          % (len(ok), ok.mean(), top3.mean()))
    print()
    print("%-10s %-11s %-19s %-19s %s" % ("target", "threshold", "routed on its own", "their accuracy",
                                          "handed off: right forum in top 3"))
    for tgt in TARGETS:
        thr = threshold(tgt)
        auto = mg >= thr
        print("%-10s %-11.3f %5d (%.3f)        %.4f              %.4f"
              % ("%.0f%%" % (100 * tgt), thr, auto.sum(), auto.mean(), ok[auto].mean(),
                 top3[~auto].mean()))


# ------------------------------------------------------------------ #
# 7. Which validation predicts the future?
# ------------------------------------------------------------------ #
def harness():
    section("7. harness -- which validation on the training posts predicts the later posts?")
    d = data()
    C = best_c()
    A = texts(d["Ptr"], CONTENT)
    ytr = d["ytr"]
    Xa, Xb, _ = tfidf(A, texts(d["Pte"], CONTENT))
    ok = svm_predict(Xa, ytr, Xb, C) == d["yte"]
    print("linear SVM (C=%g) on the router's view; every estimate below uses training posts only"
          % C)
    print()
    rows = [("random 5-fold", KFold(5, shuffle=True, random_state=0), None),
            ("grouped by author, 5-fold", GroupKFold(5), d["authors"]),
            ("grouped by thread, 5-fold", GroupKFold(5), d["threads"])]
    print("%-28s %10s %14s" % ("validation", "estimate", "vs the future"))
    for name, cv, g in rows:
        acc = []
        for i, j in cv.split(A, ytr, g):
            Ta, Tb, _ = tfidf([A[k] for k in i], [A[k] for k in j])
            acc.append(np.mean(svm_predict(Ta, ytr[i], Tb, C) == ytr[j]))
        print("%-28s %10.4f %+14.4f" % (name, np.mean(acc), np.mean(acc) - ok.mean()))
    print("%-28s %10.4f" % ("the later posts (test)", ok.mean()))


# ------------------------------------------------------------------ #
# 8. People the model has met, and people it has not
# ------------------------------------------------------------------ #
def authors():
    section("8. authors -- accuracy for posters seen in training vs new posters")
    d = data()
    C = best_c()
    seen = set(d["authors"])
    met = np.array([author_of(p) in seen for p in d["Pte"]])
    print("later posts by someone who also posted in the training period: %d of %d (%.3f)"
          % (met.sum(), len(met), met.mean()))
    print()
    print("%-16s %13s %13s %8s" % ("model reads", "seen poster", "new poster", "gap"))
    for label, keep in (("whole post", CHANNELS), ("router's view", CONTENT)):
        Xa, Xb, _ = tfidf(texts(d["Ptr"], keep), texts(d["Pte"], keep))
        ok = svm_predict(Xa, d["ytr"], Xb, C) == d["yte"]
        print("%-16s %13.4f %13.4f %+8.4f" % (label, ok[met].mean(), ok[~met].mean(),
                                              ok[met].mean() - ok[~met].mean()))


# ------------------------------------------------------------------ #
# 9. The moderator's fingerprint
# ------------------------------------------------------------------ #
MODERATOR_HOST = "athos.rutgers.edu"
# soc.religion.christian was moderated: every post passed through one person before it appeared,
# and he sometimes wrote into it. His notes are bracketed blocks signed with his initials,
# "[... --clh]". His own posts come from MODERATOR_FROM (4 earlier posts); the page masks both.
MODERATOR_FROM = "hedrick@"
MOD_INITIALS = "clh"
NOTE_RE = re.compile(r"\[[^\[\]]*?--\s*clh\s*\]", re.S | re.I)
# Read by hand: the words that rank above the initials when the one-forum words are sorted by how
# consistently they are wrapped. Five come from three signatures typed without a '-- ' line (a
# spacecraft lab's drawn box, a quotation used as a sign-off, a one-line motto), two from subject
# lines repeated down their threads. The section asserts the ranking still gives exactly these.
FRAME_ABOVE = {"telos": "signature A", "3684": "signature A", "sahak": "signature B",
               "melkonian": "signature B", "jacked": "signature C", "inimitable": "subject",
               "dividian": "subject"}
BRACKET_RE = re.compile(r"\[[^\[\]]{20,}?\]", re.S)  # any bracketed aside, citation or edit
FP_SPECIMEN = 3347  # a later new thread: short, and one of the notes that most changes the margin
FP_NAMES = ("plastic", "Jason_Brinsley", "LEE", MOD_INITIALS)
FP_EXCERPT = 40  # words of each note shown in the lab


def strip_notes(p):
    """The router's view of a post with the moderator's notes taken out of the body."""
    return p["subject"] + "\n" + NOTE_RE.sub(" ", "\n".join(p["body"]))


def _note_in(P, part):
    return np.array([bool(NOTE_RE.search("\n".join(p[part]))) for p in P])


def fingerprint():
    section("9. fingerprint -- what the moderator of soc.religion.christian left in its posts")
    d = data()
    names, Ptr, Pte, ytr, yte, new, new_tr = (d["names"], d["Ptr"], d["Pte"], d["ytr"], d["yte"],
                                               d["new"], d["new_tr"])
    k = names.index("soc.religion.christian")
    C = best_c()
    ink, ink_te = ytr == k, yte == k
    hit = np.array([MODERATOR_HOST in r for r in d["raw_tr"]])
    print("the moderator's server, %s, anywhere in the earlier posts:" % MODERATOR_HOST)
    print("  soc.religion.christian   %d of %d" % (hit[ink].sum(), ink.sum()))
    print("  the other 19 forums      %d of %d" % (hit[~ink].sum(), (~ink).sum()))
    print()

    # -- the notes: where they are, and who wrote them
    body_tr, body_te = _note_in(Ptr, "body"), _note_in(Pte, "body")
    print("the moderator's notes, bracketed blocks signed with his initials, in the body")
    print("(the part of the post the router's view reads)       earlier posts    later posts")
    print("  soc.religion.christian, posts with one              %4d of %4d    %4d of %4d"
          % (body_tr[ink].sum(), ink.sum(), body_te[ink_te].sum(), ink_te.sum()))
    print("  the other 19 forums                                 %4d            %4d"
          % (body_tr[~ink].sum(), body_te[~ink_te].sum()))
    print("  soc.religion.christian new threads with one         %4d of %4d    %4d of %4d"
          % ((body_tr & ink & new_tr).sum(), (ink & new_tr).sum(), (body_te & ink_te & new).sum(),
             (ink_te & new).sum()))
    au = np.array(d["authors"])
    notes = [m.group(0) for i in np.where(body_tr)[0] for m in NOTE_RE.finditer("\n".join(Ptr[i]["body"]))]
    lens = np.array([len(TOKEN_RE.findall(t)) for t in notes])
    view_words = sum(len(TOKEN_RE.findall(t)) for t in texts([Ptr[i] for i in np.where(ink)[0]], CONTENT))
    mod_own = sum(a.startswith(MODERATOR_FROM) for a in au[body_tr])
    print("  in the earlier posts: %d notes in %d posts from %d different senders; sent from the"
          % (len(notes), body_tr.sum(), len(set(au[body_tr]))))
    print("  moderator's own address: %d. %d more posts carry one after the poster's signature,"
          % (mod_own, (_note_in(Ptr, "sig") & ~body_tr).sum()))
    print("  and %d quote one in a reply" % (_note_in(Ptr, "quotes") & ~body_tr).sum())
    print("  words inside notes: %d of the forum's %d words in the router's view (%.1f%%);"
          % (lens.sum(), view_words, 100 * lens.sum() / view_words))
    print("  a note runs to a median of %d words, the longest %d" % (np.median(lens), lens.max()))
    other = np.array([bool(BRACKET_RE.search(NOTE_RE.sub(" ", "\n".join(p["body"])))) for p in Ptr])
    print("  earlier posts whose body holds some other bracketed block of 20+ characters: %d"
          % other.sum())

    # -- in the model
    A, B = texts(Ptr, CONTENT), texts(Pte, CONTENT)
    Xa, Xb, v = tfidf(A, B)
    m = fit_svm(Xa, ytr, C)
    fn = v.get_feature_names_out()
    an = v.build_analyzer()
    occ, occ_note = collections.Counter(), collections.Counter()
    for i in np.where(ink)[0]:
        occ.update(an(A[i]))
        for mm in NOTE_RE.finditer("\n".join(Ptr[i]["body"])):
            occ_note.update(an(mm.group(0)))
    top = np.argsort(-m.coef_[k])[:20]
    share = {fn[j]: occ_note[fn[j]] / occ[fn[j]] for j in top}
    rank = [fn[j] for j in top].index(MOD_INITIALS) + 1
    j0 = v.vocabulary_[MOD_INITIALS]
    rest = max(share[fn[j]] for j in top if fn[j] != MOD_INITIALS)
    print()
    print("soc.religion.christian's twenty heaviest words in the router's view (linear SVM, C=%g):" % C)
    print("  the initials rank %d (weight %.2f); %d of their %d uses in the forum's earlier posts are"
          % (rank, m.coef_[k, j0], occ_note[MOD_INITIALS], occ[MOD_INITIALS]))
    print("  inside a note, the rest are posters naming him. Of the other 19 words, none has more")
    print("  than %.0f%% of its uses inside notes" % (100 * rest))

    # -- could a count have found it?
    cv = CountVectorizer(binary=True)
    Xc = cv.fit_transform(A).tocsc()
    cfn = cv.get_feature_names_out()
    df = np.diff(Xc.indptr)
    one = []
    for j in np.where(df >= 20)[0]:
        docs = Xc[:, j].indices
        f, nf = collections.Counter(ytr[docs]).most_common(1)[0]
        if nf / len(docs) >= 0.95:
            one.append((cfn[j], len(set(au[docs]))))
    senders = dict(one)
    wide = sorted(one, key=lambda r: -r[1])[0]
    frames = collections.defaultdict(collections.Counter)
    for t in A:
        for mm in TOKEN_RE.finditer(t):
            w = mm.group(0).lower()
            if w in senders:
                frames[w][(t[max(0, mm.start() - 2):mm.start()], t[mm.end():mm.end() + 1])] += 1
    wrap = {w: c.most_common(1)[0][1] / sum(c.values()) for w, c in frames.items()}
    (before, after), _ = frames[MOD_INITIALS].most_common(1)[0]
    above = sorted(w for w in wrap if wrap[w] > wrap[MOD_INITIALS])
    assert set(above) == set(FRAME_ABOVE), above
    kinds = collections.Counter(FRAME_ABOVE.values())
    print()
    print("a scan that knows nothing about moderators, on the earlier posts' router's view:")
    print("  words in 20+ posts, 95%%+ of those posts in one forum: %d. The initials are one, used by"
          % len(one))
    print("  %d different senders; '%s', the most widely used, by %d" % (senders[MOD_INITIALS], wide[0], wide[1]))
    print("  the same %d sorted by how often a word wears the same wrapping (the 2 characters before it,"
          % len(one))
    print("  the 1 after): the initials rank %d, %.1f%% of their uses wrapped '%s' before and '%s' after;"
          % (len(above) + 1, 100 * wrap[MOD_INITIALS], before, after))
    print("  the %d above them come from %d signatures typed without a '-- ' line (%d words) and %d"
          % (len(above), len([x for x in kinds if x.startswith("signature")]),
             sum(n for x, n in kinds.items() if x.startswith("signature")), kinds["subject"]))
    print("  subject lines repeated down their threads")

    # -- the data the page draws: one later post with a note, and the forum's twenty heaviest words
    mk = lambda s: _mask_names(s, FP_NAMES)
    raw = d["raw_te"][FP_SPECIMEN]
    p = Pte[FP_SPECIMEN]
    note_lines = set()
    for mm in NOTE_RE.finditer(raw):
        note_lines |= set(mm.group(0).split("\n"))
    head, _, body = raw.partition("\n\n")
    lines = []
    for ln in head.split("\n"):
        lines.append([{"part": "subject" if ln.lower().startswith("subject:") else "meta", "text": mk(ln)}])
    lines.append([])
    for ln in body.rstrip("\n").split("\n"):
        lines.append([{"part": _part_of(ln, p), "text": mk(ln), "pen": ln in note_lines and bool(ln.strip())}])
    top20 = [{"w": mk(fn[j]), "x": round(float(m.coef_[k, j]), 3), "note": round(share[fn[j]], 3),
              "mod": fn[j] == MOD_INITIALS} for j in top]
    out = {"forum": names[k], "specimen": {"post": FP_SPECIMEN, "lines": lines}, "top": top20}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "fingerprint.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n",
                                               encoding="utf-8")


def notes_cost():
    section("9b. notes_cost -- what taking the moderator's notes out changes on the later new threads")
    d = data()
    names, Ptr, Pte, ytr, yte, new = d["names"], d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"]
    k = names.index("soc.religion.christian")
    C = best_c()
    body_te = _note_in(Pte, "body")
    A, B = texts(Ptr, CONTENT), texts(Pte, CONTENT)
    Xa, Xb, v = tfidf(A, B)
    m = fit_svm(Xa, ytr, C)
    Xs = v.transform([strip_notes(p) for p in Pte])  # the later posts as the router would get them
    As = [strip_notes(p) for p in Ptr]
    Xa2, Xb2, v2 = tfidf(As, [strip_notes(p) for p in Pte])
    m2 = fit_svm(Xa2, ytr, C)
    S0, S1, S2 = m.decision_function(Xb), m.decision_function(Xs), m2.decision_function(Xb2)
    p0, p1, p2 = S0.argmax(1), S1.argmax(1), S2.argmax(1)
    ok0, ok1, ok2 = p0 == yte, p1 == yte, p2 == yte
    ch1 = (p0 != p1) & new
    ch2 = (p0 != p2) & new
    print("taking the notes out, the %d later new threads (linear SVM, C=%g)" % (new.sum(), C))
    print("                                                   accuracy   routes changed")
    print("  as collected: notes in earlier and later posts     %.4f" % ok0[new].mean())
    print("  notes taken out of the later posts                 %.4f     %d" % (ok1[new].mean(), ch1.sum()))
    print("  taken out of both                                  %.4f     %d, %d of them posts with no note"
          % (ok2[new].mean(), ch2.sum(), (ch2 & ~body_te).sum()))
    pr = _paired(ok2[new], ok0[new], check=False)
    print("  both vs as collected: %+.2f points (95%%: %+.2f to %+.2f); right only without the notes:"
          % (100 * pr["diff"], 100 * pr["lo"], 100 * pr["hi"]))
    print("  %d post, right only with them: %d" % (pr["only_a"], pr["only_b"]))
    moved = np.where(ch1)[0]
    for i in moved:
        print("  the route that moves when the notes leave the later posts: post %d, filed in" % i)
        print("  %s, goes to %s instead of %s" % (names[yte[i]], names[p1[i]], names[p0[i]]))
    sel = np.where(body_te & new)[0]
    assert all(yte[i] == k for i in sel)
    mg0, mg1 = margins(S0[sel]), margins(S1[sel])
    words = np.array([len(TOKEN_RE.findall(B[i])) for i in sel])
    nw = np.array([sum(len(TOKEN_RE.findall(t)) for t in NOTE_RE.findall("\n".join(Pte[i]["body"]))) for i in sel])
    more = np.where(nw > words - nw)[0]
    mg_all = margins(S0[new])
    print()
    print("the %d later new threads with a note: routed right %d with it, %d without it"
          % (len(sel), ok0[sel].sum(), ok1[sel].sum()))
    print("  margin over the runner-up: median %.2f with the note, %.2f without (all later new"
          % (np.median(mg0), np.median(mg1)))
    print("  threads: %.2f); it falls by more than half in %d" % (np.median(mg_all), (mg1 < mg0 / 2).sum()))
    print("  the moderator wrote more of the post than the poster did in %d (%s of its words)"
          % (len(more), " and ".join("%.0f%%" % (100 * nw[i] / words[i]) for i in more)))

    # -- the data the page draws: each of the 14 posts, with and without its note
    mk = lambda s: _mask_names(s, FP_NAMES)
    posts = []
    for n, i in enumerate(sel):
        o0, o1 = np.argsort(-S0[i]), np.argsort(-S1[i])
        ex = []
        for t in NOTE_RE.findall("\n".join(Pte[i]["body"])):
            w = t.split()
            ex.append(mk(" ".join(w) if len(w) <= FP_EXCERPT else " ".join(w[:FP_EXCERPT]) + " ... " + w[-1]))
        posts.append({"post": int(i), "subject": mk(Pte[i]["subject"]), "words": int(words[n]),
                      "note_words": int(nw[n]), "notes": ex,
                      "with": {"top": names[o0[0]], "second": names[o0[1]], "margin": round(float(mg0[n]), 3)},
                      "without": {"top": names[o1[0]], "second": names[o1[1]], "margin": round(float(mg1[n]), 3)},
                      "right": bool(ok0[i])})
    out = {"forum": names[k], "posts": posts, "median_margin": round(float(np.median(mg_all)), 3)}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "notes.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n",
                                         encoding="utf-8")


# ------------------------------------------------------------------ #
# 5. The specimen: one reply, and where its route came from
# ------------------------------------------------------------------ #
SPECIMEN = 4984  # a test-set reply in rec.motorcycles; found by searching for replies that the
#                  whole-post model routes right, the router's view routes wrong, and that carry
#                  a quote and a signature (the hero figure on the capstone's first page)
# Real posts are shown with personal details masked. Emails keep their host (the host is part
# of the lesson), everything that names or reaches a person is dotted out. The measurements
# above use the unmodified text.
SPECIMEN_NAMES = ("Dean", "Cookson", "Arturo", "Vega")
DATA_OUT = ROOT / "src" / "data" / "routing"


def _mask(s):
    # every mask keeps the length it replaces, so a signature's drawn box stays square
    s = re.sub(r"([\w.+-])([\w.+-]*)@", lambda m: m.group(1) + "•" * len(m.group(2)) + "@", s)
    for n in SPECIMEN_NAMES:
        s = re.sub(r"\b%s\b" % n, lambda m: m.group(0)[0] + "•" * (len(n) - 1), s, flags=re.I)
    s = re.sub(r"\b617 \d{3}-\d{4}\b", "617 •••-••••", s)
    s = re.sub(r"#\d+", lambda m: "#" + "•" * (len(m.group(0)) - 1), s)
    s = re.sub(r"\b0\d{4}\b", "•" * 5, s)
    return s


def _part_of(line, p):
    if line in p["sig"]:
        return "sig"
    if line in p["quotes"]:
        return "quotes"
    return "body"


def specimen():
    section("5. specimen -- one reply, and which parts of it decided the route")
    d = data()
    names = d["names"]
    C = best_c()
    p = d["Pte"][SPECIMEN]
    raw = d["raw_te"][SPECIMEN]
    print("post %d of the test set, filed in %s (a reply)" % (SPECIMEN, names[d["yte"][SPECIMEN]]))
    out = {}
    for label, keep in (("whole post", CHANNELS), ("router's view", CONTENT)):
        Xa, Xb, v = tfidf(texts(d["Ptr"], keep), texts(d["Pte"], keep))
        m = LinearSVC(C=C).fit(Xa, d["ytr"])
        s = m.decision_function(Xb[SPECIMEN])[0]
        o = np.argsort(-s)
        print()
        print("%-14s -> %s" % (label, "   ".join("%s %+.3f" % (names[k], s[k]) for k in o[:3])))
        out[label] = [(names[k], round(float(s[k]), 3)) for k in o[:3]]
        if keep != CHANNELS:
            continue
        an = v.build_analyzer()
        fn = v.get_feature_names_out()
        k = o[0]
        row = Xb[SPECIMEN]
        con = {fn[j]: row[0, j] * m.coef_[k, j] for j in row.indices}
        where = collections.defaultdict(list)
        for ch in ("meta", "subject", "body", "quotes", "sig"):
            txt = "\n".join(p[ch]) if isinstance(p[ch], list) else p[ch]
            for t in set(an(txt)):
                where[t].append(ch)
        by = collections.defaultdict(float)
        for t, c in con.items():
            for ch in where[t]:
                by[ch] += c / len(where[t])  # a word in two parts is split between them
        print("  the %s score, word by word, summed by the part of the post it came from:" % names[k])
        for ch in ("sig", "quotes", "meta", "body", "subject"):
            print("    %-8s %+.3f" % (ch, by[ch]))
        print("    %-8s %+.3f   (the model's constant)" % ("offset", m.intercept_[k]))
        print("    %-8s %+.3f" % ("total", sum(by.values()) + m.intercept_[k]))
        own = by["body"] + by["subject"]
        print("  the poster's own words (subject + body): %+.3f of %+.3f from words"
              % (own, sum(by.values())))
        top = sorted(con.items(), key=lambda kv: -kv[1])[:8]
        print("  its eight heaviest words: " + ", ".join("%s (%s)" % (t, "+".join(where[t])) for t, c in top))
        pens = [t for t, c in top if not (set(where[t]) & {"body", "subject"})]
        out["channels"] = {ch: round(by[ch], 3) for ch in ("sig", "quotes", "meta", "body", "subject")}

    # the printable post, line by line, with the pen on the leak words' first appearance
    head, _, body = raw.partition("\n\n")
    lines = []
    pending = list(pens)
    for part, block in (("head", head.split("\n")), (None, body.split("\n"))):
        for ln in block:
            prt = part or _part_of(ln, p)
            if prt == "head" and ln.lower().startswith("subject:"):
                prt = "subject"
            # mask first, then look for each ringed word in its masked form, so a ring never
            # splits an email address away from the @ that the mask keys on
            ml = _mask(ln)
            spans = []
            if prt in ("head", "quotes", "sig"):
                for t in list(pending):
                    pat = r"\b%s\b" % re.escape(t)
                    if t in (n.lower() for n in SPECIMEN_NAMES):
                        pat = r"\b%s•+" % re.escape(t[0])
                    mm = re.search(pat, ml, re.I)
                    if mm and not any(a < mm.end() and mm.start() < b for a, b in spans):
                        spans.append(mm.span())
                        pending.remove(t)
            pieces, at = [], 0
            for a, b in sorted(spans):
                pieces += [(ml[at:a], False), (ml[a:b], True)]
                at = b
            pieces.append((ml[at:], False))
            lines.append([{"part": "meta" if prt == "head" else prt, "text": tx, "pen": pen}
                          for tx, pen in pieces if tx])
    print()
    print("ringed on the page: %s" % ", ".join(pens))
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    spec = {"forum": names[d["yte"][SPECIMEN]], "scores": out, "lines": lines}
    (DATA_OUT / "specimen.json").write_text(json.dumps(spec, ensure_ascii=False, indent=1) + "\n",
                                            encoding="utf-8")


# ------------------------------------------------------------------ #
# 10. The job: which later posts need a model at all?
# ------------------------------------------------------------------ #
_TH = {}


def threads():
    """The router's thread memory and where each later reply falls in it (computed once).

    The router remembers every thread it has filed, keyed by the subject without "Re:". This
    release carries no Message-ID or References headers, so the subject is the only thread key.
    """
    if not _TH:
        d = data()
        Ptr, Pte, ytr, yte, new = d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"]
        before = collections.defaultdict(collections.Counter)  # filed before the cut-off
        for p, y in zip(Ptr, ytr):
            before[thread_of(p)][y] += 1
        opened = collections.defaultdict(collections.Counter)  # opened by a later new-thread post
        for i in np.where(new)[0]:
            opened[thread_of(Pte[i])][yte[i]] += 1
        grp = {"before": [], "later": [], "missing": []}
        for i in np.where(~new)[0]:
            t = thread_of(Pte[i])
            grp["before" if t in before else "later" if t in opened else "missing"].append(i)
        _TH.update(before=before, opened=opened, grp=grp)
    return _TH


def job():
    section("10. job -- which later posts need a model at all?")
    d = data()
    names, Pte, ytr, yte, new = d["names"], d["Pte"], d["ytr"], d["yte"], d["new"]
    th = threads()
    before, opened, grp = th["before"], th["opened"], th["grp"]
    n_rep = int((~new).sum())
    look = lambda t: (before[t] if t in before else opened[t]).most_common(1)[0][0]
    right = {g: np.array([look(thread_of(Pte[i])) == yte[i] for i in grp[g]]) for g in ("before", "later")}
    missing_threads = len(set(thread_of(Pte[i]) for i in grp["missing"]))
    n_look = n_rep - missing_threads
    n_model = int(new.sum()) + missing_threads
    print("later posts %d:  replies %d (%.3f)   new threads %d (%.3f)"
          % (len(yte), n_rep, n_rep / len(yte), new.sum(), new.mean()))
    print()
    print("a reply is filed wherever its thread already lives (thread = subject without 'Re:')")
    print("  thread filed before the cut-off        %5d replies   lookup right %.4f"
          % (len(grp["before"]), right["before"].mean()))
    print("  thread opened by a later new post      %5d replies   lookup right %.4f"
          % (len(grp["later"]), right["later"].mean()))
    print("  thread's first post not in the data    %5d replies   in %d threads"
          % (len(grp["missing"]), missing_threads))
    both = np.concatenate([right["before"], right["later"]])
    print("  %-39s%5d replies   lookup right %.4f" % ("where the thread's forum is known", len(both), both.mean()))
    # the misses: replies that went to a different forum from the rest of their thread
    missed = collections.Counter(thread_of(Pte[i]) for g in ("before", "later")
                                 for i, ok in zip(grp[g], right[g]) if not ok)
    spread = collections.defaultdict(collections.Counter)
    for P, Y in ((d["Ptr"], ytr), (Pte, yte)):
        for p, y in zip(P, Y):
            if thread_of(p) in missed:
                spread[thread_of(p)][names[y]] += 1
    print("  its %d misses sit in %d threads that ran in more than one forum; the largest:"
          % (sum(missed.values()), len(missed)))
    for t, _ in missed.most_common(2):
        print("    '%s'" % t)
        print("      " + ", ".join("%s %d" % kv for kv in spread[t].most_common()))
    print()
    print("filed by the lookup, no model            %5d (%.3f)" % (n_look, n_look / len(yte)))
    print("need the model: %d new threads" % new.sum())
    print("  + the first reply of each of the %d    %5d (%.3f)"
          % (missing_threads, n_model, n_model / len(yte)))

    # the forum mix of the posts the model is for, next to the mix of all later posts
    c_all = np.bincount(yte, minlength=20)
    c_new = np.bincount(yte[new], minlength=20)
    mix = [{"forum": names[k], "all": int(c_all[k]), "new": int(c_new[k])}
           for k in np.argsort(-c_new, kind="stable")]
    out = {"posts": int(len(yte)), "replies": n_rep, "new": int(new.sum()),
           "before": len(grp["before"]), "later": len(grp["later"]), "missing": len(grp["missing"]),
           "missing_threads": missing_threads, "lookup": n_look, "model": n_model,
           "lookup_right": round(float(both.mean()), 4),
           "right_before": round(float(right["before"].mean()), 4),
           "right_later": round(float(right["later"].mean()), 4), "mix": mix}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "job.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 11. A reply follows its thread, so a misfiled opener takes its replies with it
# ------------------------------------------------------------------ #
def followers():
    section("11. followers -- what a misfiled new thread takes with it")
    d = data()
    names, Ptr, Pte, ytr, yte, new = d["names"], d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"]
    th = threads()
    before, grp = th["before"], th["grp"]
    C = best_c()
    Xa, Xb, _ = tfidf(texts(Ptr, CONTENT), texts(Pte, CONTENT))
    pred = svm_predict(Xa, ytr, Xb, C)
    ok = pred == yte
    filed_as = collections.defaultdict(collections.Counter)
    for i in np.where(new)[0]:
        filed_as[thread_of(Pte[i])][pred[i]] += 1
    # the later new threads that opened a thread of their own (subject unused before the cut-off)
    n_rep = collections.Counter(thread_of(Pte[i]) for i in grp["later"])
    own = np.array([new[i] and thread_of(Pte[i]) not in before for i in range(len(yte))])
    drew = own & np.array([n_rep[thread_of(p)] > 0 for p in Pte])
    print("the model files each later new thread (router's view, linear SVM C=%g)" % C)
    print("  all %d new threads                   right %.4f" % (new.sum(), ok[new].mean()))
    print("  opened a thread that drew no reply     right %.4f  (n=%d)" % (ok[own & ~drew].mean(), (own & ~drew).sum()))
    print("  opened a thread that drew replies      right %.4f  (n=%d)" % (ok[drew].mean(), drew.sum()))
    fol = {}
    for i in grp["later"]:
        t = thread_of(Pte[i])
        fol.setdefault(t, []).append(filed_as[t].most_common(1)[0][0] == yte[i])
    allf = np.concatenate([np.array(v) for v in fol.values()])
    wrong = sorted(((len(v) - sum(v), t) for t, v in fol.items()), reverse=True)
    print()
    print("their %d replies go wherever the model filed the thread" % len(allf))
    print("  replies in the right forum             %.4f  (%d in the wrong one)" % (allf.mean(), (~allf).sum()))
    print("  threads with a reply in the wrong one  %d of %d" % (sum(1 for w, t in wrong if w), len(fol)))
    print("  the 5 biggest of them carry            %d of the %d" % (sum(w for w, t in wrong[:5]), (~allf).sum()))
    for w, t in wrong[:2]:
        home = collections.Counter(yte[i] for i in np.where(new)[0] if thread_of(Pte[i]) == t).most_common(1)[0][0]
        print("    '%s'  %d replies" % (t, w))
        print("      a %s thread, filed in %s" % (names[home], names[filed_as[t].most_common(1)[0][0]]))


# ------------------------------------------------------------------ #
# 12. Provenance: what survived of each post, and who wrote it
# ------------------------------------------------------------------ #
# RFC 1036 (1987), the standard for Usenet messages: six required headers and thirteen optional
RFC_REQUIRED = ("From", "Subject", "Date", "Newsgroups", "Message-ID", "Path")
RFC_OPTIONAL = ("Organization", "Lines", "Distribution", "Reply-To", "Keywords", "Summary", "Expires",
                "References", "Followup-To", "Approved", "Xref", "Sender", "Control")
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
ATTRIBUTION_RE = re.compile(r"(writes:|wrote:|^In article)")


def header_keys(p):
    keys = {m.group(1).lower() for ln in p["meta"] for m in [re.match(r"([A-Za-z][\w.-]*):", ln)] if m}
    return keys | ({"subject"} if p["subject"] else set())


def provenance():
    section("12. provenance -- which parts of a post survived, and who wrote them")
    d = data()
    P = d["Ptr"] + d["Pte"]
    n_tr, n_te = len(d["Ptr"]), len(d["Pte"])
    print("posts %d: earlier %d (%.3f), later %d (%.3f)"
          % (len(P), n_tr, n_tr / len(P), n_te, n_te / len(P)))
    keys = collections.Counter(k for p in P for k in header_keys(p))
    print()
    print("headers the Usenet standard (RFC 1036) defines, and how many posts carry each")
    for label, names in (("required", RFC_REQUIRED), ("optional", RFC_OPTIONAL)):
        here = sorted((h for h in names if keys[h.lower()]), key=lambda h: -keys[h.lower()])
        gone = [h for h in names if not keys[h.lower()]]
        for tag, cells in (("still there", ["%s %d" % (h, keys[h.lower()]) for h in here]),
                           ("in no post", gone)):
            for k in range(0, len(cells), 4):
                print("  %-22s %s" % ("%s, %s" % (label, tag) if k == 0 else "", "   ".join(cells[k:k + 4])))
    rfc = {h.lower() for h in RFC_REQUIRED + RFC_OPTIONAL}
    other = [(k, v) for k, v in keys.most_common() if k not in rfc][:3]
    print("  %-22s %s" % ("not in the standard", "   ".join("%s %d" % kv for kv in other)))

    # Date is gone, but a quoted Message-ID often starts with the day its post was written
    rx = re.compile(r"<(199\d)(%s)(\d{1,2})\." % "|".join(MONTHS))
    print()
    print("dates inside quoted Message-IDs (the day a quoted post was written)")
    dates = {}
    for label, raws in (("earlier posts", d["raw_tr"]), ("later posts", d["raw_te"])):
        ds = [(int(y), MONTHS.index(m) + 1, int(dd)) for r in raws for y, m, dd in rx.findall(r)]
        c = collections.Counter((y, m) for y, m, _ in ds)
        apr = np.array([dd for y, m, dd in ds if (y, m) == (1993, 4)])
        q = np.percentile(apr, [10, 50, 90]).astype(int)
        dates[label] = {"n": len(ds), "mar": c[(1993, 3)], "apr": c[(1993, 4)], "may": c[(1993, 5)],
                        "apr_p10": int(q[0]), "apr_median": int(q[1]), "apr_p90": int(q[2])}
        print("  %-14s %4d dates   Mar 1993 %4d   Apr 1993 %4d   May 1993 %4d"
              % (label, len(ds), c[(1993, 3)], c[(1993, 4)], c[(1993, 5)]))
        print("  %-14s April days: 10%% by the %d, median the %d, 90%% by the %d" % ("", *q))

    print()
    print("parts of the later posts          new threads     replies")
    new = d["new"]
    parts = {}
    for label, f in (("quote another post", lambda p: bool(p["quotes"])),
                     ("carry an attribution line", lambda p: any(ATTRIBUTION_RE.search(l) for l in p["quotes"])),
                     ("end in a signature", lambda p: bool(p["sig"]))):
        v = [float(np.mean([f(d["Pte"][i]) for i in np.where(m)[0]])) for m in (new, ~new)]
        parts[label] = [round(x, 4) for x in v]
        print("  %-30s %10.3f %11.3f" % (label, v[0], v[1]))
    share = []
    for m in (new, ~new):
        idx = np.where(m)[0]
        ql = sum(len(d["Pte"][i]["quotes"]) for i in idx)
        bl = sum(sum(1 for l in d["Pte"][i]["body"] if l.strip()) for i in idx)
        share.append(ql / (ql + bl))
    parts["share of lines quoted"] = [round(x, 4) for x in share]
    print("  %-30s %10.3f %11.3f" % ("share of their lines quoted", share[0], share[1]))

    out = {"posts": len(P), "headers": {h: keys[h.lower()] for h in RFC_REQUIRED + RFC_OPTIONAL},
           "other_headers": dict(other), "dates": dates, "parts": parts}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "provenance.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 13. Who, not what: the sender's fields as a route by themselves
# ------------------------------------------------------------------ #
def _header(p, key):
    for ln in p["meta"]:
        if ln.lower().startswith(key + ":"):
            return ln.split(":", 1)[1].strip().lower()
    return None


def senders():
    section("13. senders -- file a new thread by who sent it, not what it says")
    d = data()
    Ptr, Pte, ytr, yte, new = d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"]
    fields = (("From address", author_of), ("Organization", lambda p: _header(p, "organization")),
              ("NNTP-Posting-Host", lambda p: _header(p, "nntp-posting-host")))
    C = best_c()
    Xa, Xb, _ = tfidf(texts(Ptr, CONTENT), texts(Pte, CONTENT))
    model_ok = svm_predict(Xa, ytr, Xb, C) == yte
    print("each field's value -> the forum it was seen in most before the cut-off")
    print()
    print("%-19s %-20s  %-7s  %s" % ("field", "new threads, seen", "right", "the model on the same posts"))
    for name, f in fields:
        mem = collections.defaultdict(collections.Counter)
        for p, y in zip(Ptr, ytr):
            v = f(p)
            if v:
                mem[v][y] += 1
        idx = np.array([i for i in np.where(new)[0] if f(Pte[i]) in mem])
        right = np.mean([mem[f(Pte[i])].most_common(1)[0][0] == yte[i] for i in idx])
        print("%-19s %4d of %d (%.3f)  %.4f   %.4f"
              % (name, len(idx), new.sum(), len(idx) / new.sum(), right, model_ok[idx].mean()))
        if name == "From address":
            rep = [c for c in mem.values() if sum(c.values()) >= 2]
            n_rep = sum(sum(c.values()) for c in rep)
            print("  (before the cut-off, %d posts came from people who posted more than once;"
                  % n_rep)
            print("   %.3f of those sit in their sender's usual forum)"
                  % (sum(c.most_common(1)[0][1] for c in rep) / n_rep))


# ------------------------------------------------------------------ #
# 14. Parsers: scikit-learn's cleaning against this capstone's, on real posts
# ------------------------------------------------------------------ #
def _footer_line(lines):
    """scikit-learn 1.8's strip_newsgroup_footer, on a list of lines already stripped as a block:
    the index of the last blank (or all-dashes) line, or 0 when nothing is cut."""
    line_num = 0
    for line_num in range(len(lines) - 1, -1, -1):
        if lines[line_num].strip().strip("-") == "":
            break
    return line_num


def tail_split(p):
    """Split a post's body into (kept, tail): the tail is the last block that scikit-learn's footer
    rule would cut, taken only when the post has no '-- ' signature. Most tails are signatures that
    were typed without the delimiter (the hand-read sample below); a few are the poster's words.
    The router's view still includes the tail; act 3 audits it as a part of its own."""
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


def _mask_names(s, names):
    s = re.sub(r"([\w.+-])([\w.+-]*)@", lambda m: m.group(1) + "•" * len(m.group(2)) + "@", s)
    for n in names:
        s = re.sub(r"\b%s\b" % re.escape(n), lambda m: m.group(0)[0] + "•" * (len(m.group(0)) - 1),
                   s, flags=re.I)
    return s


# three training posts, each showing one parser getting something wrong (hand-picked for that)
PARSER_SPECIMENS = ((2780, ("Brian", "Lemire")), (6221, ("Altan", "Stalker")),
                    (548, ("David", "Ryan", "Dave", "der")))
_SK = {}


def sk_clean(subset):
    """fetch_20newsgroups(remove=("headers", "footers", "quotes")), the cleaning tutorials use."""
    if subset not in _SK:
        _SK[subset] = fetch_20newsgroups(subset=subset, remove=("headers", "footers", "quotes")).data
    return _SK[subset]


def _specimen_lines(i, names):
    """One training post, line by line: the part this capstone's parser gives each line, and
    whether scikit-learn's remove=("headers", "footers", "quotes") keeps it."""
    d = data()
    raw, p = d["raw_tr"][i], d["Ptr"][i]
    lines = raw.split("\n")
    head, _, after = raw.partition("\n\n")
    start = head.count("\n") + 2  # first line of the body
    # scikit-learn: the header block goes, then the footer rule on the stripped body, then quotes
    stripped = after.strip()
    first = start + after[:len(after) - len(after.lstrip())].count("\n")
    sl = stripped.split("\n")
    k = _footer_line(sl) or len(sl)
    sk = [False] * len(lines)
    for j in range(k):
        if not QUOTE_RE.search(sl[j]):
            sk[first + j] = True
    got = "\n".join(sl[j] for j in range(k) if sk[first + j])
    assert got == sk_clean("train")[i], "line map disagrees with scikit-learn for post %d" % i
    # this capstone's parser
    body = lines[start:]
    sigs = [j for j, ln in enumerate(body) if SIG_RE.match(ln)]
    cut = sigs[-1] if sigs else None
    plain = [j for j in range(cut if cut is not None else len(body)) if not QUOTE_RE.search(body[j])]
    _, tail = tail_split(p)
    tail_at = set(plain[len(plain) - len(tail):]) if tail else set()
    out = []
    for j, ln in enumerate(lines):
        if j < start - 1:
            part = "subject" if ln.lower().startswith("subject:") else "meta"
        elif j == start - 1:
            part = "body"
        else:
            bj = j - start
            part = ("sig" if cut is not None and bj >= cut else "quotes" if QUOTE_RE.search(ln)
                    else "tail" if bj in tail_at else "body")
        out.append({"text": _mask_names(ln, names), "part": part, "sk": sk[j]})
    while out and not out[-1]["text"].strip():
        out.pop()
    words = lambda keep: sum(len(re.findall(r"\w+", l["text"])) for l in out if keep(l))
    return {"post": int(i), "forum": d["names"][d["ytr"][i]], "lines": out,
            "words": {"all": words(lambda l: True),
                      "ours": words(lambda l: l["part"] in ("subject", "body", "tail")),
                      "sklearn": words(lambda l: l["sk"])}}


def parsers():
    section("14. parsers -- scikit-learn's cleaning and this capstone's, on the same posts")
    d = data()
    raws = d["raw_tr"] + d["raw_te"]
    new = d["new"]
    print('scikit-learn: fetch_20newsgroups(remove=("headers", "footers", "quotes")), rule by rule')
    heads = sum(1 for r in raws if re.search(r"^subject:", r.partition("\n\n")[0], re.I | re.M))
    print("  headers  drops everything above the first blank line, Subject included: %d of %d posts"
          % (heads, len(raws)))
    body = [r.partition("\n\n")[2].strip().split("\n") for r in raws]
    cut = np.array([_footer_line(b) > 0 for b in body])
    print("  footers  cuts from the last blank (or dashes) line to the end: %d of %d posts (%.3f)"
          % (cut.sum(), len(raws), cut.mean()))
    te = body[len(d["raw_tr"]):]
    nosig = np.array([not p["sig"] for p in d["Pte"]])
    c = np.array([_footer_line(b) > 0 for b in te]) & new & nosig
    lost = [sum(len(re.findall(r"\w+", l)) for l in te[i][_footer_line(te[i]):]) for i in np.where(c)[0]]
    print("           %d of the %d later new threads lose a last block and have no '-- ' signature"
          % (c.sum(), new.sum()))
    print("           (a median of %d words each)" % np.median(lost))
    print("  quotes   drops quoted lines and 'X writes:' lines, the same rule as this capstone's parser")
    print()
    C = best_c()
    rows = [("this capstone's parser: subject + body", texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT)),
            ("the same, without the subject", texts(d["Ptr"], ()), texts(d["Pte"], ())),
            ("scikit-learn's three removals", sk_clean("train"), sk_clean("test")),
            ("scikit-learn's three removals + the subject",
             [p["subject"] + "\n" + t for p, t in zip(d["Ptr"], sk_clean("train"))],
             [p["subject"] + "\n" + t for p, t in zip(d["Pte"], sk_clean("test"))])]
    print("linear SVM (C=%g), accuracy on the later new threads" % C)
    for name, A, B in rows:
        Xa, Xb, _ = tfidf(A, B)
        print("  %-44s %.4f" % (name, (svm_predict(Xa, d["ytr"], Xb, C) == d["yte"])[new].mean()))
    spec = [_specimen_lines(i, names) for i, names in PARSER_SPECIMENS]
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "parsers.json").write_text(json.dumps(spec, ensure_ascii=False, indent=1) + "\n",
                                           encoding="utf-8")


# ------------------------------------------------------------------ #
# 15. Read a sample: what does the footer rule actually cut?
# ------------------------------------------------------------------ #
SAMPLE_SEED, SAMPLE_N = 20, 40
# Each cut block in the sample, read and labelled by hand before any counting:
#   sig    a signature or contact details only (a name, address, disclaimer, quote, a drawn box)
#   words  the poster's own words (a question, output they pasted, a remark about the topic)
#   both   the poster's words and a sign-off together
#   rule   nothing but a divider line
SAMPLE_LABELS = {
    54: "sig", 378: "sig", 568: "sig", 793: "both", 813: "sig", 977: "sig", 1088: "words",
    1355: "both", 2449: "sig", 2780: "words", 2862: "sig", 2986: "both", 3102: "words",
    3176: "sig", 3429: "sig", 3718: "sig", 3827: "sig", 4606: "sig", 4642: "sig", 5102: "sig",
    5216: "sig", 5821: "sig", 6221: "sig", 6298: "sig", 6941: "both", 7228: "sig", 7374: "sig",
    7457: "rule", 7875: "words", 7984: "sig", 8790: "sig", 9170: "words", 9229: "sig",
    9947: "sig", 9983: "sig", 10017: "sig", 10357: "sig", 10421: "sig", 10434: "sig", 11052: "sig",
}
SAMPLE_NAMES = {793: ("Shaz",), 1355: ("Vishwa",), 6941: ("Michael", "Adams")}
SAMPLE_WORDS = {"sig": "signature or contact details only", "words": "the poster's own words",
                "both": "both", "rule": "a divider line only"}


def sample():
    section("15. sample -- what the footer rule cuts, read by hand")
    d = data()
    after = [r.partition("\n\n")[2].strip() for r in d["raw_tr"]]
    pool = [i for i in np.where(d["new_tr"])[0]
            if not d["Ptr"][i]["sig"] and _footer_line(after[i].split("\n")) > 0]
    pick = sorted(int(i) for i in np.random.default_rng(SAMPLE_SEED).choice(pool, SAMPLE_N, replace=False))
    assert pick == sorted(SAMPLE_LABELS), "the sample changed; the hand labels no longer apply"
    print("%d new threads drawn at random (seed %d) from the %d earlier ones whose last block"
          % (SAMPLE_N, SAMPLE_SEED, len(pool)))
    print("the footer rule cuts and that have no '-- ' signature; each cut block read and labelled")
    count = collections.Counter(SAMPLE_LABELS.values())
    for k in ("sig", "words", "both", "rule"):
        print("  %-36s %3d" % (SAMPLE_WORDS[k], count[k]))
    grid = []
    for i in pick:
        ls = after[i].split("\n")
        block = [l for l in ls[_footer_line(ls):] if l.strip().strip("-")]
        cell = {"post": i, "forum": d["names"][d["ytr"][i]], "label": SAMPLE_LABELS[i], "lines": len(block)}
        if SAMPLE_LABELS[i] in ("words", "both"):
            cell["text"] = _mask_names("\n".join(l.rstrip() for l in block), SAMPLE_NAMES.get(i, ()))
        grid.append(cell)

    # the router's view with that block cut too: did it carry the topic, or the sender?
    C = best_c()
    seen = set(d["authors"])
    met = np.array([author_of(p) in seen for p in d["Pte"]])
    new = d["new"]
    cut_view = lambda P: [p["subject"] + "\n" + "\n".join(tail_split(p)[0]) for p in P]
    print()
    print("the router's view on the later new threads, with and without that last block")
    print("%-18s %8s %14s %12s %9s" % ("", "all", "known sender", "new sender", "gap"))
    rows = {}
    for name, A, B in (("as parsed", texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT)),
                       ("last block cut", cut_view(d["Ptr"]), cut_view(d["Pte"]))):
        Xa, Xb, _ = tfidf(A, B)
        ok = svm_predict(Xa, d["ytr"], Xb, C) == d["yte"]
        r = [ok[new].mean(), ok[new & met].mean(), ok[new & ~met].mean()]
        rows[name] = [round(float(x), 4) for x in r]
        print("%-18s %8.4f %14.4f %12.4f %+9.4f" % (name, r[0], r[1], r[2], r[1] - r[2]))
    print("(known sender: the %d new threads from someone who posted before the cut-off; new: %d)"
          % ((new & met).sum(), (new & ~met).sum()))
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "sample.json").write_text(json.dumps({"pool": len(pool), "grid": grid, "views": rows},
                                                     ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 16. Resolution: how small a difference can the later new threads settle?
# ------------------------------------------------------------------ #
BOOT_N, BOOT_SEED = 2000, 16
Z95 = 1.959964


def _boot(stat, n, seed=BOOT_SEED):
    """2.5th and 97.5th percentiles of stat(idx) over BOOT_N resamples of n posts."""
    rng = np.random.default_rng(seed)
    v = np.array([stat(rng.integers(0, n, n)) for _ in range(BOOT_N)])
    return np.percentile(v, [2.5, 97.5])


def _paired(a, b, check=True):
    """Two models right/wrong on the same posts: the difference, who alone is right, and the
    bootstrap and normal-approximation 95% intervals. Only the posts where they disagree move it."""
    n = len(a)
    only_a, only_b = int((a & ~b).sum()), int((~a & b).sum())
    diff = (only_a - only_b) / n
    d = a.astype(float) - b.astype(float)
    lo, hi = _boot(lambda i: d[i].mean(), n)
    pa, pb = only_a / n, only_b / n
    sd1 = np.sqrt(pa + pb - (pa - pb) ** 2)  # one post's standard deviation of (a - b)
    half = Z95 * sd1 / np.sqrt(n)
    # the lab draws the normal interval; it must agree with the bootstrap
    assert not check or abs((hi - lo) / 2 - half) < 0.002, "normal interval disagrees with the bootstrap"
    need = (Z95 * sd1 / diff) ** 2 if diff else float("inf")
    return dict(diff=diff, only_a=only_a, only_b=only_b, lo=float(lo), hi=float(hi), half=float(half),
                need=need)


def resolution():
    section("16. resolution -- how small a difference can the later new threads settle?")
    d = data()
    C = best_c()
    new, ytr, yte, names = d["new"], d["ytr"], d["yte"], d["names"]
    y = yte[new]
    n = int(new.sum())

    def fit(A, B):
        Xa, Xb, _ = tfidf(A, B)
        return (svm_predict(Xa, ytr, Xb, C) == yte)[new]

    view = fit(texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT))
    whole = fit(texts(d["Ptr"], CHANNELS), texts(d["Pte"], CHANNELS))
    sk = fit(sk_clean("train"), sk_clean("test"))
    cut_view = lambda P: [p["subject"] + "\n" + "\n".join(tail_split(p)[0]) for p in P]
    cut = fit(cut_view(d["Ptr"]), cut_view(d["Pte"]))
    alone = {}
    for key in EMBEDDERS:
        Ea, Eb = embed(key)
        alone[key] = (svm_predict(Ea, ytr, Eb, C) == yte)[new]
    f = final_model()
    final = (svm_predict(f["Xa"], ytr, f["Xb"], f["C"]) == yte)[new]
    Xa, Xb, _ = tfidf(texts(d["Ptr"], CONTENT), texts(d["Pte"], CONTENT))
    Ea, Eb = embed("minilm")
    w, _ = _cv_pick("minilm")
    mini = (svm_predict(stack(Xa, Ea, w), ytr, stack(Xb, Eb, w), C) == yte)[new]

    lo, hi = _boot(lambda i: view[i].mean(), n)
    acc = view.mean()
    print("the later new threads: %d posts" % n)
    print("  router's view, linear SVM (C=%g): %.4f, 95%% interval %.4f to %.4f" % (C, acc, lo, hi))
    print("  (bootstrap, %d resamples; the normal approximation gives +/-%.4f)"
          % (BOOT_N, Z95 * np.sqrt(acc * (1 - acc) / n)))
    per = np.bincount(y, minlength=20)
    lo_k, hi_k = int(per.argmin()), int(per.argmax())
    small = view[y == lo_k]
    s_lo, s_hi = _boot(lambda i: small[i].mean(), len(small))
    print("  one forum's new threads: %d (%s) to %d (%s), median %d"
          % (per[lo_k], names[lo_k], per[hi_k], names[hi_k], np.median(per)))
    print("    the smallest: %.3f, 95%% interval %.3f to %.3f" % (small.mean(), s_lo, s_hi))
    print()

    # every comparison pages 1 and 4 drew a conclusion from; for "either embedding beside the word
    # counts beats both", the two closest of its four comparisons
    pairs = [("view", "the whole post", "the router's view", whole, view),
             ("sklearn", "the router's view", "scikit-learn's cleaning", view, sk),
             ("tail", "the tail kept", "the tail cut", view, cut),
             ("minilm", "TF-IDF", "MiniLM alone", view, alone["minilm"]),
             ("bge", "bge-large alone", "TF-IDF", alone["bge-large"], view),
             ("mini_both", "TF-IDF + MiniLM", "TF-IDF", mini, view),
             ("bge_both", "TF-IDF + bge-large", "bge-large alone", final, alone["bge-large"]),
             ("final", "TF-IDF + bge-large", "TF-IDF", final, view)]
    print("two models on the same %d posts: only the posts where they disagree say which is better" % n)
    print("%-44s %8s %9s %20s %13s" % ("", "diff", "disagree", "95% interval", "posts needed"))
    out = []
    for key, la, lb, a, b in pairs:
        r = _paired(a, b)
        need = "%13d" % round(r["need"]) if r["need"] < 1e7 else "%13s" % "over 10 m"
        print("%-44s %+8.4f %9d %9.4f to %+.4f %s" % ("%s vs %s" % (la, lb), r["diff"],
              r["only_a"] + r["only_b"], r["lo"], r["hi"], need))
        out.append(dict(key=key, a=la, b=lb, acc_a=round(float(a.mean()), 4),
                        acc_b=round(float(b.mean()), 4), only_a=r["only_a"], only_b=r["only_b"],
                        lo=round(r["lo"], 4), hi=round(r["hi"], 4)))
    print("(posts needed: how many new threads, with the same disagreements, would put zero")
    print(" outside the interval; the interval above is a bootstrap of %d resamples)" % BOOT_N)
    print()

    # two different groups of posts: each group has its own noise
    seen = set(d["authors"])
    met = np.array([author_of(p) in seen for p in d["Pte"]])[new]
    k, u = view[met], view[~met]
    rng = np.random.default_rng(BOOT_SEED)
    g = np.array([k[rng.integers(0, len(k), len(k))].mean() - u[rng.integers(0, len(u), len(u))].mean()
                  for _ in range(BOOT_N)])
    g_lo, g_hi = np.percentile(g, [2.5, 97.5])
    print("two different groups of posts")
    print("  known vs new senders (%d vs %d)            %+.4f, 95%% interval %+.4f to %+.4f"
          % (len(k), len(u), k.mean() - u.mean(), g_lo, g_hi))
    # page 4: cutting the tail cost familiar senders more than new ones. Is that split settled?
    ck, cu = cut[met], cut[~met]
    dk = k.astype(float) - ck
    du = u.astype(float) - cu
    rng = np.random.default_rng(BOOT_SEED)
    t = np.array([dk[rng.integers(0, len(dk), len(dk))].mean() - du[rng.integers(0, len(du), len(du))].mean()
                  for _ in range(BOOT_N)])
    t_lo, t_hi = np.percentile(t, [2.5, 97.5])
    rk, ru = _paired(k, ck, False), _paired(u, cu, False)
    print("  what cutting the tail costs, known senders   %+.4f, 95%% interval %+.4f to %+.4f"
          % (rk["diff"], rk["lo"], rk["hi"]))
    print("                               new senders     %+.4f, 95%% interval %+.4f to %+.4f"
          % (ru["diff"], ru["lo"], ru["hi"]))
    print("                               the difference  %+.4f, 95%% interval %+.4f to %+.4f"
          % (rk["diff"] - ru["diff"], t_lo, t_hi))
    a = auto_route()
    routed = a["ok"][a["mg"] >= threshold(0.95)]
    r_lo, r_hi = _boot(lambda i: routed[i].mean(), len(routed))
    print("  the 95%% promise: %d routed on their own, %.4f right, 95%% interval %.4f to %.4f"
          % (len(routed), routed.mean(), r_lo, r_hi))

    DATA_OUT.mkdir(parents=True, exist_ok=True)
    res = {"n": n, "acc": round(float(acc), 4), "lo": round(float(lo), 4), "hi": round(float(hi), 4),
           "forums": {"min": int(per[lo_k]), "min_name": names[lo_k], "max": int(per[hi_k]),
                      "max_name": names[hi_k], "median": int(np.median(per)),
                      "min_acc": round(float(small.mean()), 4), "min_lo": round(float(s_lo), 4),
                      "min_hi": round(float(s_hi), 4)},
           "pairs": out,
           "senders": {"known": int(len(k)), "new": int(len(u)), "gap": round(float(k.mean() - u.mean()), 4),
                       "lo": round(float(g_lo), 4), "hi": round(float(g_hi), 4)},
           "tail": {"known": round(rk["diff"], 4), "known_lo": round(rk["lo"], 4), "known_hi": round(rk["hi"], 4),
                    "new": round(ru["diff"], 4), "new_lo": round(ru["lo"], 4), "new_hi": round(ru["hi"], 4),
                    "gap": round(rk["diff"] - ru["diff"], 4), "lo": round(float(t_lo), 4), "hi": round(float(t_hi), 4)},
           "promise": {"routed": int(len(routed)), "acc": round(float(routed.mean()), 4),
                       "lo": round(float(r_lo), 4), "hi": round(float(r_hi), 4)}}
    (DATA_OUT / "resolution.json").write_text(json.dumps(res, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 17. First look: the shape of the posts, and the ones that break it
# ------------------------------------------------------------------ #
TOKEN_RE = re.compile(r"(?u)\b\w\w+\b")  # the words TfidfVectorizer counts
FL_BANDS = (0, 10, 20, 40, 80, 160)
FL_SEED, FL_PER_BAND = 6, 6
NEAR_COPY = 0.9  # cosine between TF-IDF vectors of the router's view
# The draw below, one list per length band, was read before it was published. Subjects that
# name a private person are masked (first letter kept, length kept), as on every page.
FL_DRAW = (
    [2286, 2309, 3512, 6913, 6948, 7071],
    [3128, 3537, 5106, 5488, 5543, 5898],
    [37, 6571, 6613, 6758, 7286, 7349],
    [410, 1525, 1895, 4098, 5444, 6187],
    [1380, 3651, 4189, 5567, 5706, 6344],
    [932, 1030, 1658, 3431, 6602, 7173],
)
FL_NAMES = {}  # none of the drawn subjects names a private person
UU_RE = re.compile(r"^M[\x21-\x60]{58,62}$")  # a full line of a uuencoded file


def _visible(t):
    """A subject as a reader should see it: any control character shown as its Unicode control
    picture rather than passed raw to the page."""
    return re.sub(r"[\x00-\x1f]", lambda m: chr(0x2400 + ord(m.group(0))), t) or "(no subject)"


def first_look():
    section("17. first_look -- the shape of the posts, and the ones that break it")
    d = data()
    Ptr, Pte, ytr, yte, new, names = d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"], d["names"]
    C = best_c()
    A, B = texts(Ptr, CONTENT), texts(Pte, CONTENT)
    Xa, Xb, _ = tfidf(A, B)
    m = LinearSVC(C=C).fit(Xa, ytr)
    S = m.decision_function(Xb)
    pred = S.argmax(1)
    ok = pred == yte
    mg = margins(S)
    words = np.array([len(TOKEN_RE.findall(t)) for t in B])
    body = np.array([len(TOKEN_RE.findall("\n".join(p["body"]))) for p in Pte])
    subj = np.array([len(TOKEN_RE.findall(p["subject"])) for p in Pte])
    n = int(new.sum())
    w = words[new]
    q10, q50, q90 = np.percentile(w, [10, 50, 90])
    print("the later new threads: %d posts, the router's view of each (subject + body)" % n)
    print("  words: median %d; 10%% have fewer than %d, 10%% more than %d; the longest %d"
          % (q50, q10, q90, w.max()))
    print("  subject: median %d words" % np.median(subj[new]))
    empty = new & (body == 0)
    print("  nothing but a subject (empty body): %d, routed right %d" % (empty.sum(), ok[empty].sum()))
    print()

    print("accuracy by length (linear SVM, C=%g)" % C)
    print("  %-14s %6s %10s %17s %15s" % ("words", "posts", "accuracy", "95% interval", "median margin"))
    edges = FL_BANDS + (None,)
    bands, rng = [], np.random.default_rng(FL_SEED)
    for k, (lo, hi) in enumerate(zip(edges[:-1], edges[1:])):
        mm = new & (words >= lo) & (words < (hi or 10 ** 9))
        x = ok[mm]
        r = np.random.default_rng(BOOT_SEED)
        c_lo, c_hi = np.percentile([x[r.integers(0, len(x), len(x))].mean() for _ in range(BOOT_N)], [2.5, 97.5])
        label = "under %d" % hi if lo == 0 else ("%d or more" % lo if hi is None else "%d-%d" % (lo, hi - 1))
        print("  %-14s %6d %10.3f %8.3f to %.3f %15.3f" % (label, mm.sum(), x.mean(), c_lo, c_hi, np.median(mg[mm])))
        pick = sorted(int(i) for i in rng.choice(np.where(mm)[0], FL_PER_BAND, replace=False))
        assert pick == FL_DRAW[k], "the draw changed; the reviewed samples no longer apply"
        bands.append({"label": label, "lo": lo, "hi": hi, "n": int(mm.sum()), "acc": round(float(x.mean()), 4),
                      "ci": [round(float(c_lo), 4), round(float(c_hi), 4)],
                      "margin": round(float(np.median(mg[mm])), 3),
                      "sample": [{"subject": _visible(_mask_names(Pte[i]["subject"], FL_NAMES.get(i, ()))),
                                  "forum": names[yte[i]], "routed": names[pred[i]], "words": int(words[i])}
                                 for i in pick]})
    print()

    # near-copies: a later new thread whose nearest earlier post is almost the same text
    idx = np.where(new)[0]
    sim = (Xb[new] @ Xa.T).tocsr()
    near_cos = np.asarray(sim.max(axis=1).todense()).ravel()
    near_at = np.asarray(sim.argmax(axis=1)).ravel()
    cp = near_cos >= NEAR_COPY
    same = ytr[near_at] == yte[idx]
    print("near-copies: later new threads with an earlier post at cosine %.1f or more" % NEAR_COPY)
    print("  %d posts, routed right %.3f; without them the other %d score %.4f (all %d: %.4f)"
          % (cp.sum(), ok[idx[cp]].mean(), (~cp).sum(), ok[idx[~cp]].mean(), n, ok[new].mean()))
    for label, f in (("its copy sits in the same forum", same), ("its copy sits in another forum", ~same)):
        k = cp & f
        print("    %-34s %3d   routed right %d" % (label, k.sum(), ok[idx[k]].sum()))
    fora = collections.Counter(names[yte[i]] for i in idx[cp]).most_common(3)
    print("    most of them in: " + ", ".join("%s %d" % kv for kv in fora))
    print()

    # identical text filed in two forums
    norm = lambda t: re.sub(r"\s+", " ", t.lower()).strip()
    groups = collections.defaultdict(list)
    for tag, P, Y in (("tr", Ptr, ytr), ("te", Pte, yte)):
        for i, p in enumerate(P):
            t = norm("\n".join(p["body"]))
            if t:
                groups[t].append((tag, i, int(Y[i])))
    clash = [g for g in groups.values() if len({y for _, _, y in g}) > 1]
    print("the same body filed in two forums (whole dataset): %d texts, %d posts, %d of them later new threads"
          % (len(clash), sum(len(g) for g in clash), sum(1 for g in clash for t, i, _ in g if t == "te" and new[i])))
    print()

    att = np.array([any(ATTRIBUTION_RE.search(l) for l in p["quotes"]) for p in Pte]) & new
    known = set(d["threads"])
    x = ok[att]
    r = np.random.default_rng(BOOT_SEED)
    a_lo, a_hi = np.percentile([x[r.integers(0, len(x), len(x))].mean() for _ in range(BOOT_N)], [2.5, 97.5])
    print("new threads that quote an earlier post (an attribution line): %d" % att.sum())
    print("  routed right %.3f (95%% interval %.3f to %.3f); the other new threads %.3f"
          % (x.mean(), a_lo, a_hi, ok[new & ~att].mean()))
    was = re.compile(r"\(\s*(was|re)\b", re.I)
    print("  whose subject names the old one, 'New subject (was: Old subject)': %d"
          % sum(1 for i in np.where(att)[0] if was.search(Pte[i]["subject"])))
    print("  whose subject matches a thread the router already knows: %d"
          % sum(1 for i in np.where(att)[0] if thread_of(Pte[i]) in known))
    uu_tr = np.array([sum(1 for l in t.split("\n") if UU_RE.match(l)) >= 10 for t in A])
    uu_te = np.array([sum(1 for l in t.split("\n") if UU_RE.match(l)) for t in B])
    top = collections.Counter(names[y] for y in ytr[uu_tr]).most_common(1)[0]
    print("posts carrying an encoded binary file (10+ uuencoded lines): earlier %d (%s %d), later %d"
          % (uu_tr.sum(), top[0], top[1], (uu_te >= 10).sum()))
    longest = int(np.argmax(words))
    print("  the longest later post (%s): %d words, %d of its lines uuencoded"
          % ("a reply" if not new[longest] else "a new thread", words[longest], uu_te[longest]))

    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "firstlook.json").write_text(json.dumps(
        {"n": n, "median": int(q50), "p10": int(q10), "p90": int(q90), "max": int(w.max()),
         "empty": int(empty.sum()), "empty_right": int(ok[empty].sum()), "bands": bands},
        ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 18. Vectors: the router's view as a table of numbers
# ------------------------------------------------------------------ #
from sklearn.preprocessing import normalize  # noqa: E402

# Each way of weighting the words, as (label, vectorizer settings, scale each post to length 1).
# TF-IDF with log counts is the router's (tfidf() above); the others are its ingredients removed
# one at a time, and two ways of pruning the vocabulary.
SCHEMES = (
    ("counts", dict(kind="count"), False),
    ("counts, each post scaled to length 1", dict(kind="count"), True),
    ("+ IDF (TF-IDF)", dict(kind="tfidf", sublinear_tf=False), True),
    ("+ log counts (the router's)", dict(kind="tfidf", sublinear_tf=True), True),
    ("  drop words seen in one post only", dict(kind="tfidf", sublinear_tf=True, min_df=2), True),
    ("  drop English stop words", dict(kind="tfidf", sublinear_tf=True, stop_words="english"), True),
)
SCHEME_C = (0.03, 0.1, 0.3, 1.0, 3.0)
# Unscaled counts put the useful C about 100x lower (a post's vector is as long as the post, and
# one encoded file repeats 'ax' 11,151 times); above 0.03 liblinear stops at its iteration cap.
COUNT_C = (0.001, 0.003, 0.01, 0.03)
MAX_ITER = 20000
COUNT_ITER = 200000  # unscaled counts converge slowly; on a CV fold C=0.03 needs more than 20,000


def fit_svm(X, y, C, max_iter=MAX_ITER):
    """A linear SVM whose solver is required to finish: a capped fit is not a result."""
    m = LinearSVC(C=C, max_iter=max_iter).fit(X, y)
    assert m.n_iter_ < max_iter, "liblinear stopped at its iteration cap (C=%g)" % C
    return m
# three later new threads for the lab, chosen for carrying no personal names: one whose every
# word the vocabulary knows, one with typos it has never seen, one with a new model number
VEC_SPECIMENS = (4394, 444, 1659)
LAB_SCHEMES = (("counts", dict(kind="count")), ("tfidf", dict(kind="tfidf", sublinear_tf=False)),
               ("router", dict(kind="tfidf", sublinear_tf=True)))


def _vectorize(A, B, kind, **kw):
    """Fit on A only, transform both. kind='count' gives raw counts; 'tfidf' L2-scaled TF-IDF."""
    if kind == "count":
        v = CountVectorizer(**kw)
        return v.fit_transform(A).astype(float), v.transform(B).astype(float), v
    v = TfidfVectorizer(**kw)
    return v.fit_transform(A), v.transform(B), v


def _scheme(A, B, spec, scale):
    spec = dict(spec)
    kind = spec.pop("kind")
    Xa, Xb, v = _vectorize(A, B, kind, **spec)
    if scale and kind == "count":
        Xa, Xb = normalize(Xa), normalize(Xb)
    return Xa, Xb, v


def vectors():
    section("18. vectors -- the router's view as a table of numbers")
    d = data()
    Ptr, Pte, ytr, yte, new, names = d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"], d["names"]
    C = best_c()
    A, B = texts(Ptr, CONTENT), texts(Pte, CONTENT)
    cv = CountVectorizer()
    Ca = cv.fit_transform(A)
    V = len(cv.vocabulary_)
    per = np.diff(Ca.indptr)
    print("vocabulary learned from the %d earlier posts: %d words" % (Ca.shape[0], V))
    print("  a post uses a median of %d of them (mean %d): %.3f%% of the table is non-zero"
          % (np.median(per), per.mean(), 100 * Ca.nnz / (Ca.shape[0] * V)))
    csr = Ca.data.nbytes + Ca.indices.nbytes + Ca.indptr.nbytes
    print("  stored as a full table of 8-byte numbers: %.1f GB; storing only the non-zeros: %.1f MB"
          % (Ca.shape[0] * V * 8 / 1e9, csr / 1e6))
    df = np.asarray((Ca > 0).sum(0)).ravel()
    print("  words seen in only one earlier post: %d (%.1f%%)" % ((df == 1).sum(), 100 * (df == 1).mean()))
    uu = np.array([sum(1 for l in t.split("\n") if UU_RE.match(l)) >= 10 for t in A])
    df_rest = np.asarray((Ca[~uu] > 0).sum(0)).ravel()
    only = int(((df > 0) & (df_rest == 0)).sum())
    print("  words found only in the %d posts carrying an encoded file: %d (%.1f%%)"
          % (uu.sum(), only, 100 * only / V))
    tot = np.asarray(Ca.sum(0)).ravel()
    inv = {i: w for w, i in cv.vocabulary_.items()}
    top = [inv[i] for i in np.argsort(-tot)[:2]]
    col = np.asarray(Ca[:, cv.vocabulary_[top[1]]].todense()).ravel()
    part = np.array([p["subject"].lower().startswith("roman.bmp") for p in Ptr])
    print("  the most common words: '%s' %d times, then '%s' %d times, %.1f%% of them in the %d parts"
          % (top[0], tot[cv.vocabulary_[top[0]]], top[1], col.sum(), 100 * col[part].sum() / col.sum(), part.sum()))
    print("    of one encoded picture, roman.bmp")
    an = cv.build_analyzer()
    toks = [an(B[i]) for i in np.where(new)[0]]
    unk = [sum(w not in cv.vocabulary_ for w in t) for t in toks]
    frac = np.array([u / len(t) if t else 0.0 for u, t in zip(unk, toks)])
    print()
    print("the later new threads, against that vocabulary")
    print("  words it has never seen: %.1f%% of all their words; in %.1f%% of the posts;"
          % (100 * sum(unk) / sum(len(t) for t in toks), 100 * np.mean(np.array(unk) > 0)))
    print("  more than a tenth of the words in %d posts" % (frac > 0.1).sum())
    print()

    # how far apart are posts? cosine = dot product of two posts scaled to length 1
    Xa, Xb, _ = tfidf(A, B)
    near = np.asarray((Xb[new] @ Xa.T).max(axis=1).todense()).ravel()
    print("cosine between each later new thread and its nearest earlier post (TF-IDF, log counts)")
    print("  median %.2f; 10%% below %.2f; 10%% above %.2f; %d at 0.9 or more"
          % (np.median(near), *np.percentile(near, [10, 90]), (near >= NEAR_COPY).sum()))
    print()

    print("a flat boundary through %d columns for %d posts (linear SVM, TF-IDF with log counts)" % (V, len(ytr)))
    print("  %-8s %20s %20s" % ("C", "earlier posts fit", "later new threads"))
    fits = {}
    for c in (C, 10.0):
        m = fit_svm(Xa, ytr, c)
        fits[c] = m
        print("  %-8g %20.4f %20.4f%s" % (c, (m.predict(Xa) == ytr).mean(), (m.predict(Xb) == yte)[new].mean(),
                                         "   (the router's C, chosen by thread-grouped CV)" if c == C else ""))
    miss = np.where(fits[10.0].predict(Xa) != ytr)[0]
    norm = lambda t: re.sub(r"\s+", " ", t.lower()).strip()
    body = collections.defaultdict(set)
    for k, p in enumerate(Ptr):
        body[norm("\n".join(p["body"]))].add(int(ytr[k]))
    twin = sum(1 for i in miss if len(body[norm("\n".join(Ptr[i]["body"]))]) > 1)
    print("  at C=10 all but %d fit; %d of those share their text with an earlier post in another forum"
          % (len(miss), twin))
    r = _paired((fits[C].predict(Xb) == yte)[new], (fits[10.0].predict(Xb) == yte)[new], False)
    print("  C=%g against C=10 on the later new threads: %+.4f (95%% interval %+.4f to %+.4f)"
          % (C, r["diff"], r["lo"], r["hi"]))
    print()

    # every weighting gets its own C, chosen by thread-grouped CV on the earlier posts
    groups = d["threads"]
    folds_ = list(GroupKFold(n_splits=5).split(A, ytr, groups))
    print("weighting the words (linear SVM; each row's C chosen by thread-grouped CV on the earlier posts)")
    print("  %-40s %7s %5s %12s %24s" % ("", "columns", "C", "new threads", "vs the row above, 95%"))
    base = None
    rows = []
    for label, spec, scale in SCHEMES:
        raw = not scale and spec["kind"] == "count"
        grid, it = (COUNT_C, COUNT_ITER) if raw else (SCHEME_C, MAX_ITER)
        cvs = {}
        for i, j in folds_:
            Ta, Tb, _ = _scheme([A[k] for k in i], [A[k] for k in j], spec, scale)
            for c in grid:
                cvs.setdefault(c, []).append(np.mean(fit_svm(Ta, ytr[i], c, it).predict(Tb) == ytr[j]))
        c = max(grid, key=lambda x: (round(float(np.mean(cvs[x])), 4), -x))
        assert c not in (grid[0], grid[-1]) or len(grid) < 3, "%s: CV chose the edge of its C grid" % label
        Ta, Tb, v = _scheme(A, B, spec, scale)
        ok = (fit_svm(Ta, ytr, c, it).predict(Tb) == yte)[new]
        rows.append((label, Ta.shape[1], c, ok))
        if "router" in label:
            base = ok
    # the first four rows add one ingredient each, so each is compared with the row above it;
    # the variants below them are compared with the router's weighting
    for k, (label, cols, c, ok) in enumerate(rows):
        ref = rows[k - 1][3] if 0 < k < 4 else (base if k >= 4 else None)
        if k == 4:
            print("  %-40s %7s %5s %12s %24s" % ("", "", "", "", "vs the router's, 95%"))
        r = _paired(ok, ref, False) if ref is not None else None
        cmp = "" if r is None else "%+.4f (%+.4f to %+.4f)" % (r["diff"], r["lo"], r["hi"])
        print("  %-40s %7d %5g %12.4f %26s" % (label, cols, c, ok.mean(), cmp))
    # the vocabulary and IDF fitted on every post, later ones too (C as the router's)
    v = TfidfVectorizer(sublinear_tf=True).fit(A + B)
    ok = (svm_predict(v.transform(A), ytr, v.transform(B), C) == yte)[new]
    r = _paired(ok, base, False)
    print("  %-40s %7d %5g %12.4f %26s" % ("  vocabulary and IDF fitted on all %d posts" % (len(A) + len(B)),
                                           len(v.vocabulary_), C, ok.mean(),
                                           "%+.4f (%+.4f to %+.4f)" % (r["diff"], r["lo"], r["hi"])))

    # the lab: three later new threads, their words under three weightings, and their nearest posts
    spec_out = []
    for i in VEC_SPECIMENS:
        words = an(B[i])
        entry = {"post": int(i), "forum": names[yte[i]], "text": B[i].strip("\n"),
                 "unknown": sorted({w for w in words if w not in cv.vocabulary_}), "schemes": {}}
        for key, sp in LAB_SCHEMES:
            sp = dict(sp)
            Ta, Tb, vv = _vectorize(A, B, sp.pop("kind"), **sp)
            row = Tb[i].toarray().ravel()
            inv2 = {k: w for w, k in vv.vocabulary_.items()}
            top = np.argsort(-row)[:10]
            top = [k for k in top if row[k] > 0]
            simv = (normalize(Tb[i]) @ normalize(Ta).T).toarray().ravel()
            nn = np.argsort(-simv)[:3]
            entry["schemes"][key] = {
                "top": [{"w": inv2[k], "n": words.count(inv2[k]),
                         "df": int(df[cv.vocabulary_[inv2[k]]]), "x": round(float(row[k]), 4)} for k in top],
                "nearest": [{"subject": _visible(Ptr[k]["subject"]), "forum": names[ytr[k]],
                             "cos": round(float(simv[k]), 3)} for k in nn]}
        spec_out.append(entry)
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "vectors.json").write_text(json.dumps(
        {"posts": len(A), "vocab": V, "specimens": spec_out}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8")


# ------------------------------------------------------------------ #
# 19. Weights: what the first models learned, and whether it is about the topic or the sender
# ------------------------------------------------------------------ #
WEIGHT_K = 12
# Read by hand from the two models' twelve heaviest words per forum: the ones that are a private
# person's name, username or initials. Shown masked (first letter kept). Servers, organisations and
# public figures under discussion (rushdie, clinton, koresh) are not on the list.
WEIGHT_PEOPLE = {
    "keith", "jaeger", "wingate", "schneider", "mangoe", "gtoal", "geb", "banks", "prb", "pat",
    "henry", "clh", "petch", "serdar", "argic", "kaldis", "cramer", "clayton", "ipser", "weiss",
    "sandvik", "ch981", "psyrobtw", "hudson", "benedikt", "jon", "tammy", "bobby",
}
PARTS = ("meta", "content", "quotes", "sig")


def _part_text(p, part):
    if part == "content":
        return p["subject"] + "\n" + "\n".join(p["body"])
    return "\n".join(p[part])


def _from_line(p):
    return next((l for l in p["meta"] if l.lower().startswith("from:")), "")


def weights():
    section("19. weights -- what the first models learned, and whether it is about topic or sender")
    d = data()
    Ptr, Pte, ytr, yte, new, names = d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"], d["names"]
    C = best_c()
    authors = np.array(d["authors"])
    out = {"forums": list(names), "models": {}}
    for key, label, keep in (("whole", "the whole post", CHANNELS), ("router", "the router's view", CONTENT)):
        A, B = texts(Ptr, keep), texts(Pte, keep)
        Xa, Xb, v = tfidf(A, B)
        m = LinearSVC(C=C).fit(Xa, ytr)
        an = v.build_analyzer()
        inv = v.get_feature_names_out()
        # where each word mostly occurs across all parts of the training posts
        occ = np.vstack([np.asarray(CountVectorizer(vocabulary=v.vocabulary_).transform(
            [_part_text(p, pt) for p in Ptr]).sum(0)).ravel() for pt in PARTS])
        home = np.array(PARTS)[occ.argmax(0)]
        # posts containing each word (in this model's view), and whether the word is also in that
        # post's own From line, i.e. the sender's own name or address
        has = (Xa > 0).tocsc()
        from_tok = [set(an(_from_line(p))) for p in Ptr]
        rows, tally = {}, collections.Counter()
        for k in range(20):
            top = np.argsort(-m.coef_[k])[:WEIGHT_K]
            cells = []
            for rank, j in enumerate(top):
                w = inv[j]
                docs = has[:, j].indices
                one = collections.Counter(authors[docs]).most_common(1)[0][1] / len(docs)
                own = float(np.mean([w in from_tok[i] for i in docs]))
                cells.append({"w": _mask_names(w, (w,)) if w in WEIGHT_PEOPLE else w,
                              "x": round(float(m.coef_[k, j]), 3), "home": str(home[j]),
                              "person": w in WEIGHT_PEOPLE, "one": round(one, 3), "own": round(own, 3)})
                if rank < 10:
                    tally["words"] += 1
                    tally["person"] += w in WEIGHT_PEOPLE
                    tally["outside"] += home[j] != "content"
                    tally["either"] += (w in WEIGHT_PEOPLE) or home[j] != "content"
                    tally["own"] += own > 0.5
                    tally["one"] += one > 0.5
            rows[names[k]] = cells
        print("%s (linear SVM, C=%g): the ten heaviest words of each of the 20 forums, %d words"
              % (label, C, tally["words"]))
        print("  a private person's name, username or initials            %3d" % tally["person"])
        print("  occur mostly in header lines, quotes or signatures        %3d" % tally["outside"])
        print("  either                                                    %3d" % tally["either"])
        print("  in most of their posts, the sender's own name or address  %3d" % tally["own"])
        print("  more than half their posts from a single sender           %3d" % tally["one"])
        out["models"][key] = rows

        # what the winning forum's score is made of on the later posts, part by part
        if key == "whole":
            fn = v.get_feature_names_out()
            S = m.decision_function(Xb)
            win = S.argmax(1)
            share = {}
            for grp, mask in (("new threads", new), ("replies", ~new)):
                by = collections.defaultdict(float)
                for i in np.where(mask)[0]:
                    p, k, row = Pte[i], win[i], Xb[i]
                    where = collections.defaultdict(list)
                    for pt in PARTS:
                        for t in set(an(_part_text(p, pt))):
                            where[t].append(pt)
                    for j, x in zip(row.indices, row.data):
                        c = x * m.coef_[k, j]
                        for pt in where[fn[j]]:
                            by[pt] += c / len(where[fn[j]])
                tot = sum(by.values())
                share[grp] = {pt: round(by[pt] / tot, 4) for pt in PARTS}
            print("  the winning forum's score from words, by the part of the post they came from")
            print("  %-14s %13s %13s %9s %11s" % ("later posts", "subject+body", "header lines", "quotes", "signature"))
            for grp in ("new threads", "replies"):
                print("  %-14s %13.3f %13.3f %9.3f %11.3f" % (grp, share[grp]["content"], share[grp]["meta"],
                                                          share[grp]["quotes"], share[grp]["sig"]))
            out["parts"] = share
        else:
            # the router's view: how much of the winning score is the sender's own name in the body
            fn = v.get_feature_names_out()
            S = m.decision_function(Xb)
            win = S.argmax(1)
            own_c, tot_c = 0.0, 0.0
            for i in np.where(new)[0]:
                mine = set(an(_from_line(Pte[i])))
                row = Xb[i]
                for j, x in zip(row.indices, row.data):
                    c = x * m.coef_[win[i], j]
                    tot_c += c
                    own_c += c if fn[j] in mine else 0.0
            print("  on the later new threads, the sender's own name or address inside the subject and")
            print("  body gives %.1f%% of the winning score from words" % (100 * own_c / tot_c))
            out["own_share"] = round(own_c / tot_c, 4)
        print()

    # 'keith' in the router's view: the sender, or the subject of the conversation?
    A = texts(Ptr, CONTENT)
    an = CountVectorizer().build_analyzer()
    at = [i for i, t in enumerate(A) if "keith" in set(an(t))]
    mine = sum("keith" in set(an(_from_line(Ptr[i]))) for i in at)
    k_ath = sum(ytr[i] == names.index("alt.atheism") for i in at)
    # (stdout stays ASCII: on Windows a piped child prints in cp1252, so the mask is not printed)
    print("the router's view keeps a first name among alt.atheism's heaviest words (masked on the page):")
    print("  in the subject or body of %d earlier posts (%d of them in alt.atheism); the sender has that"
          % (len(at), k_ath))
    print("  name in %d of them, and in the other %d someone else is writing to or about them"
          % (mine, len(at) - mine))
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "weights.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n",
                                           encoding="utf-8")


CMDS = dict(headline=headline, population=population, ladder=ladder, embeddings=embeddings,
            specimen=specimen, automation=automation, harness=harness, authors=authors,
            fingerprint=fingerprint, notes_cost=notes_cost, job=job, followers=followers,
            provenance=provenance, senders=senders, parsers=parsers, sample=sample,
            resolution=resolution, first_look=first_look, vectors=vectors, weights=weights)

if __name__ == "__main__":
    want = sys.argv[1:] or list(CMDS)
    for w in want:
        if w not in CMDS:
            raise SystemExit("unknown: %s. one of %s" % (w, ", ".join(CMDS)))
        CMDS[w]()
