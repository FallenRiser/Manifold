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
Each cache prints a short hash so a changed cache is visible. Sections 37-39 read the audited view's caches
(<model>_audited.npz, ~21 min for bge-large on a GTX 1660 Ti), which also hold the hash of the text they encoded
and are refused if the router's view changes.

Deterministic otherwise: sklearn 1.8, numpy 2.3, LinearSVC with its default dual solver, every
split and forest seeded, LightGBM run with deterministic=True. The forests, boosted trees and kernel
SVMs of sections 31-33, and the feature fits of sections 34-36, are cached under routing_cache/nonlinear,
keyed by every input; sections 34-36 fit the harness's five folds side by side (joblib, one core each).
"""
import collections
import functools
import hashlib
import html
import itertools
import json
import os
import pathlib
import re
import sys
import time
import warnings

import lightgbm as lgb
import numpy as np
import sklearn
from scipy import sparse
from scipy.special import logsumexp
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, CountVectorizer, TfidfTransformer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, roc_auc_score
from sklearn.model_selection import (GroupKFold, KFold, StratifiedGroupKFold, StratifiedKFold,
                                     train_test_split)
from sklearn.naive_bayes import ComplementNB, MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC, LinearSVC

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


# ------------------------------------------------------------------ #
# 20. Channels: each part of a post closed on its own and all together
# ------------------------------------------------------------------ #
# The four parts of a post beyond the subject and the body that the lab switches on and off. The
# moderator's notes (page 9) are out in every combination: they are stripped first, and the tail
# is then found on the post as the router would receive it.
LAB_CHANNELS = ("meta", "quotes", "sig", "tail")
CH_LABEL = {"meta": "the header lines", "quotes": "the quotes", "sig": "the signature", "tail": "the tail"}
CH_SEEDS = 5
# the lines of the quotes channel that name who is being quoted ("X writes:", "In article <...>")
ATTRIBUTION_ONLY = re.compile(r"(writes in|writes:|wrote:|says:|said:|^In article|^Quoted from)")
CH_SPECIMEN = 1165  # a later reply in sci.med with header lines, a quote and a sign-off without '-- '
CH_NAMES = ("Donald", "Mackie", "Don", "Janice", "Price")


def _unnoted(p):
    q = dict(p)
    q["body"] = NOTE_RE.sub(" ", "\n".join(p["body"])).split("\n")
    return q


def view_of(p, keep=()):
    """The subject and the body, the moderator's notes out, plus the channels named in keep.
    With nothing kept this is the audited router's view, the one the capstone uses from act 4 on."""
    q = _unnoted(p)
    kept, tail = tail_split(q)
    out = []
    if "meta" in keep:
        out += p["meta"]
    out.append(p["subject"])
    out += kept
    if "tail" in keep:
        out += tail
    if "quotes" in keep:
        out += p["quotes"]
    if "sig" in keep:
        out += p["sig"]
    return "\n".join(out)


def _combos():
    return [tuple(c for c in LAB_CHANNELS if m >> LAB_CHANNELS.index(c) & 1) for m in range(16)]


def _ckey(keep):
    return "+".join(keep) or "none"


def channels():
    section("20. channels -- each part of a post closed on its own and all together, random split")
    d = data()
    C = best_c()
    P = d["Ptr"] + d["Pte"]
    y = np.concatenate([d["ytr"], d["yte"]])
    rep = np.array([is_reply(p) for p in P])
    th = [thread_of(p) for p in P]
    splits = [train_test_split(np.arange(len(y)), test_size=len(d["yte"]), random_state=s, stratify=y)
              for s in range(CH_SEEDS)]
    acc, ok_of = {}, {}
    for keep in _combos():
        T = [view_of(p, keep) for p in P]
        acc[keep], ok_of[keep] = [], []
        for i, j in splits:
            Xa, Xb, _ = tfidf([T[a] for a in i], [T[b] for b in j])
            ok = svm_predict(Xa, y[i], Xb, C) == y[j]
            acc[keep].append(ok.mean())
            ok_of[keep].append(ok)
    whole = LAB_CHANNELS
    rows = [("nothing (the whole post)", whole), ("the header lines", ("quotes", "sig", "tail")),
            ("the quotes", ("meta", "sig", "tail")), ("the signature", ("meta", "quotes", "tail")),
            ("all three", ("tail",)), ("all three and the tail", ())]
    w = np.array(acc[whole])
    print("%d posts, %d random splits of %d test posts each, linear SVM (C=%g); the moderator's notes"
          % (len(y), CH_SEEDS, len(d["yte"]), C))
    print("are out throughout (page 9)")
    print()
    print("closing                        accuracy    cost (points)   cost per split")
    cost = {}
    for label, keep in rows:
        a = np.array(acc[keep])
        c = 100 * (w - a)
        cost[label] = c
        print("  %-28s %.4f  %s" % (label, a.mean(), "" if keep == whole else
                                    "%+10.2f        %+.2f to %+.2f" % (c.mean(), c.min(), c.max())))
    three = cost["all three"]
    alone = {k: cost[k] for k in ("the header lines", "the quotes", "the signature")}
    top = max(alone, key=lambda k: alone[k].mean())
    share = alone[top] / three
    print()
    print("the costliest on its own is %s: %.0f%% of what closing all three costs (per split %.0f%% to"
          % (top, 100 * alone[top].mean() / three.mean(), 100 * share.min()))
    print("%.0f%%). H3 needed every channel alone under a third of it" % (100 * share.max()))
    # where the quotes' cost falls
    seen, cr, cn = [], [], []
    for (i, j), a, b in zip(splits, ok_of[whole], ok_of[("meta", "sig", "tail")]):
        train_th = {th[k] for k in i}
        rj = rep[j]
        seen.append(np.mean([th[k] in train_th for k in j[rj]]))
        cr.append(100 * (a[rj].mean() - b[rj].mean()))
        cn.append(100 * (a[~rj].mean() - b[~rj].mean()))
    print("closing the quotes costs %.2f points on the test replies and %.2f on the test new threads;"
          % (np.mean(cr), np.mean(cn)))
    print("%.0f%% of the test replies have a post of their own thread on the training side"
          % (100 * np.mean(seen)))
    out = {"seeds": CH_SEEDS, "combos": {_ckey(k): round(float(np.mean(v)), 4) for k, v in acc.items()}}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "channels_random.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


def channels_job():
    section("21. channels_job -- the channels on the job, for senders the router has met and new ones")
    d = data()
    C = best_c()
    Ptr, Pte, ytr, yte, new, names = d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"], d["names"]
    seen = set(d["authors"])
    met = np.array([author_of(p) in seen for p in Pte])
    groups = (("all", new), ("known", new & met), ("new", new & ~met))

    def fit(fa, fb):
        Xa, Xb, _ = tfidf([fa(p) for p in Ptr], [fb(p) for p in Pte])
        return svm_predict(Xa, ytr, Xb, C) == yte

    first = fit(lambda p: render(p, CONTENT), lambda p: render(p, CONTENT))
    nonote = fit(strip_notes, strip_notes)
    ok = {keep: fit(lambda p, k=keep: view_of(p, k), lambda p, k=keep: view_of(p, k)) for keep in _combos()}
    base = ok[()]
    assert (ok[("tail",)] == nonote).all(), "the audited view plus its tail should be the notes-out view"
    print("the later new threads: %d, from %d senders the router has met and %d new ones"
          % (new.sum(), (new & met).sum(), (new & ~met).sum()))
    print("(linear SVM, C=%g)" % C)
    print()
    print("                                              all      known    new senders")
    for label, o in (("the router's view of acts 1-3", first), ("  without the moderator's notes", nonote),
                     ("  and without the tail: the audited view", base)):
        print("  %-41s %.4f   %.4f   %.4f" % (label, *(o[g].mean() for _, g in groups)))
    pr = _paired(base[new], first[new], check=False)
    print("  audited vs acts 1-3: %+.2f points (95%%: %+.2f to %+.2f); gap known - new %.1f -> %.1f"
          % (100 * pr["diff"], 100 * pr["lo"], 100 * pr["hi"],
             100 * (first[new & met].mean() - first[new & ~met].mean()),
             100 * (base[new & met].mean() - base[new & ~met].mean())))
    print()
    print("the audited view plus one channel, change in points (95% interval)")
    print("  %-22s %-21s %-21s %s" % ("", "all", "known", "new senders"))
    res = {}
    for keep in _combos():
        cell = {}
        for g, m in groups:
            p = _paired(ok[keep][m], base[m], check=False)
            cell[g] = {"acc": round(float(ok[keep][m].mean()), 4), "diff": round(100 * p["diff"], 2),
                       "lo": round(100 * p["lo"], 2), "hi": round(100 * p["hi"], 2)}
        res[_ckey(keep)] = cell
        if len(keep) == 1 or keep == LAB_CHANNELS:
            label = "+ " + CH_LABEL[keep[0]] if len(keep) == 1 else "+ all four at once"
            print("  %-22s %s" % (label, "  ".join("%+.2f (%+.2f, %+.2f)" % (cell[g]["diff"], cell[g]["lo"], cell[g]["hi"])
                                                   for g, _ in groups)))
    qtext = fit(lambda p: view_of(p) + "\n" + "\n".join(l for l in p["quotes"] if not ATTRIBUTION_ONLY.search(l)),
                lambda p: view_of(p) + "\n" + "\n".join(l for l in p["quotes"] if not ATTRIBUTION_ONLY.search(l)))
    cells = []
    for g, m in groups:
        p = _paired(qtext[m], base[m], check=False)
        cells.append("%+.2f (%+.2f, %+.2f)" % (100 * p["diff"], 100 * p["lo"], 100 * p["hi"]))
    print("  %-22s %s" % ("+ quoted text only", "  ".join(cells)))
    print("  (the quotes without the lines that name who is quoted)")

    # the specimen the lab prints, part by part
    raw, p = d["raw_te"][CH_SPECIMEN], Pte[CH_SPECIMEN]
    kept, tail = tail_split(_unnoted(p))
    head, _, body = raw.partition("\n\n")
    body = body.split("\n")  # trailing blank lines kept, so the tail lines up with tail_split's
    sigs = [j for j, ln in enumerate(body) if SIG_RE.match(ln)]
    cut = sigs[-1] if sigs else None
    plain = [j for j in range(cut if cut is not None else len(body)) if not QUOTE_RE.search(body[j])]
    tail_at = set(plain[len(plain) - len(tail):]) if tail else set()
    lines = [{"part": "subject" if ln.lower().startswith("subject:") else "meta", "text": _mask_names(ln, CH_NAMES)}
             for ln in head.split("\n")]
    lines.append({"part": "body", "text": ""})
    for j, ln in enumerate(body):
        part = ("sig" if cut is not None and j >= cut else "quotes" if QUOTE_RE.search(ln)
                else "tail" if j in tail_at else "body")
        lines.append({"part": part, "text": _mask_names(ln, CH_NAMES)})
    while lines and not lines[-1]["text"].strip():
        lines.pop()
    parts =collections.Counter(l["part"] for l in lines if l["text"].strip())
    print()
    print("the lab's post: %d of the later posts, a reply in %s; its lines by part: %s"
          % (CH_SPECIMEN, names[yte[CH_SPECIMEN]], ", ".join("%s %d" % kv for kv in sorted(parts.items()))))
    out = {"n": {g: int(m.sum()) for g, m in groups}, "combos": res,
           "first": {g: round(float(first[m].mean()), 4) for g, m in groups},
           "specimen": {"post": CH_SPECIMEN, "forum": names[yte[CH_SPECIMEN]], "lines": lines}}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "channels_job.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n",
                                                encoding="utf-8")


# ------------------------------------------------------------------ #
# 22. The split that predicts the future: which test on the earlier posts matches the later ones?
# ------------------------------------------------------------------ #
SPLIT_FRACS = (0.2, 0.25, 0.33)  # the latest share of each forum's earlier posts, as a time holdout


def _article_numbers():
    """Each earlier post's article number: the order the collecting server received it, per forum."""
    tr = fetch_20newsgroups(subset="train")
    assert (tr.target == data()["ytr"]).all()
    return np.array([int(re.search(r"(\d+)$", str(f)).group(1)) for f in tr.filenames])


def _ci(ok):
    lo, hi = _boot(lambda i: ok[i].mean(), len(ok))
    return float(lo), float(hi)


def the_split():
    section("22. the_split -- which test on the earlier posts predicts the later new threads?")
    d = data()
    C = best_c()
    Ptr, Pte, ytr, yte, new, ntr, names = (d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"], d["new_tr"],
                                           d["names"])
    au = np.array(d["authors"])
    A = [view_of(p) for p in Ptr]
    B = [view_of(p) for p in Pte]
    seen = set(au)
    met = np.array([author_of(p) in seen for p in Pte])
    share = met[new].mean()
    Xa, Xb, _ = tfidf(A, B)
    ok = svm_predict(Xa, ytr, Xb, C) == yte
    fut = {"new": ok[new].mean(), "all": ok.mean()}
    print("the audited view, linear SVM (C=%g); every test below uses the earlier posts only" % C)
    print()
    print("the future, the later posts:        new threads %.4f (95%%: %.4f-%.4f)   all posts %.4f"
          % (fut["new"], *_ci(ok[new]), fut["all"]))
    print("  %.1f%% of the later new threads come from a sender seen in the earlier posts" % (100 * share))

    art = _article_numbers()
    first_later = {k: min(int(re.search(r"(\d+)$", str(f)).group(1)) for f, y in
                       zip(fetch_20newsgroups(subset="test").filenames, yte) if y == k) for k in range(20)}
    late = sum(int(a > first_later[y]) for a, y in zip(art, ytr))
    holds = [("random 5-fold", list(KFold(5, shuffle=True, random_state=0).split(A))),
             ("grouped by author, 5-fold", list(GroupKFold(5).split(A, ytr, d["authors"]))),
             ("grouped by thread, 5-fold", list(GroupKFold(5).split(A, ytr, d["threads"])))]
    for frac in SPLIT_FRACS:
        val = np.zeros(len(ytr), bool)
        for k in range(20):
            idx = np.where(ytr == k)[0]
            val[idx[art[idx] > np.quantile(art[idx], 1 - frac)]] = True
        holds.append(("each forum's latest %d%%" % round(100 * frac), [(np.where(~val)[0], np.where(val)[0])]))
    print()
    print("%-28s %-15s %-15s %s" % ("test on the earlier posts", "all posts", "new threads", "new threads from"))
    print("%-28s %-15s %-15s %s" % ("", "(vs later)", "(vs later)", "a sender it has met"))
    rows, pooled = [], {}
    for name, splits in holds:
        oks, isnew, known, per, per_all = [], [], [], [], []
        for i, j in splits:
            Ta, Tb, _ = tfidf([A[a] for a in i], [A[b] for b in j])
            o = svm_predict(Ta, ytr[i], Tb, C) == ytr[j]
            s = set(au[i])
            oks.append(o)
            isnew.append(ntr[j])
            known.append(np.array([a in s for a in au[j]]))
            per.append(float(o[ntr[j]].mean()))
            per_all.append(float(o.mean()))
        o, m, k = np.concatenate(oks), np.concatenate(isnew), np.concatenate(known)
        pooled[name] = (o, m, k)
        a_all, a_new = o.mean(), o[m].mean()
        lo, hi = _ci(o[m])
        alo, ahi = _ci(o)
        print("%-28s %.4f %+.4f  %.4f %+.4f  %4.1f%%"
              % (name, a_all, a_all - fut["all"], a_new, a_new - fut["new"], 100 * k[m].mean()))
        rows.append({"name": name, "all": round(float(a_all), 4), "new": round(float(a_new), 4),
                     "lo": round(lo, 4), "hi": round(hi, 4), "folds": [round(x, 4) for x in per],
                     "all_lo": round(alo, 4), "all_hi": round(ahi, 4), "folds_all": [round(x, 4) for x in per_all],
                     "known": round(float(k[m].mean()), 3), "n": int(m.sum())})
    print("(the time holdouts order posts by article number, the order the collecting server received")
    print(" them; %d of the %d earlier posts carry a number later than their forum's first later post)"
          % (late, len(ytr)))

    o, m, k = pooled["grouped by thread, 5-fold"]
    kn, nw = o[m & k].mean(), o[m & ~k].mean()
    rew = share * kn + (1 - share) * nw
    print()
    print("grouped by thread, the new threads split by sender: met %.4f, new %.4f; the folds' mix is"
          % (kn, nw))
    print("%.1f%% met, the later posts' %.1f%%. Weighted to the later mix: %.4f (%+.4f vs later)"
          % (100 * k[m].mean(), 100 * share, rew, rew - fut["new"]))

    # the harness choosing C: does it pick the C the later posts would have picked?
    V = [(i, j, *tfidf([A[a] for a in i], [A[b] for b in j])[:2])
         for i, j in GroupKFold(5).split(A, ytr, d["threads"])]
    print()
    print("choosing C with it (grouped by thread, scored on new threads)")
    print("  %-6s %-10s %-18s %s" % ("C", "harness", "weighted to mix", "later new threads"))
    cs = []
    for c in C_GRID:
        oo, kk = [], []
        for i, j, Ta, Tb in V:
            r = svm_predict(Ta, ytr[i], Tb, c) == ytr[j]
            s = set(au[i])
            oo.append(r[ntr[j]])
            kk.append(np.array([a in s for a in au[j]])[ntr[j]])
        oo, kk = np.concatenate(oo), np.concatenate(kk)
        w = share * oo[kk].mean() + (1 - share) * oo[~kk].mean()
        f = (svm_predict(Xa, ytr, Xb, c) == yte)[new].mean()
        cs.append({"C": c, "harness": round(float(oo.mean()), 4), "weighted": round(float(w), 4),
                   "later": round(float(f), 4)})
        print("  %-6g %.4f     %.4f             %.4f" % (c, oo.mean(), w, f))
    pick = max(cs, key=lambda r: r["harness"])["C"]
    best = max(cs, key=lambda r: r["later"])["C"]
    print("  the harness picks C=%g; the later posts would have picked C=%g" % (pick, best))

    out = {"future": {"new": round(float(fut["new"]), 4), "lo": round(_ci(ok[new])[0], 4),
                      "hi": round(_ci(ok[new])[1], 4), "all": round(float(fut["all"]), 4),
                      "all_lo": round(_ci(ok)[0], 4), "all_hi": round(_ci(ok)[1], 4),
                      "known": round(float(share), 3)},
           "schemes": rows, "weighted": round(float(rew), 4), "c": cs}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "harness.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 23. The metric: what to count on the harness, and what an average hides
# ------------------------------------------------------------------ #
# From act 4 on every section uses the audited view and the harness below; the older best_c(),
# folds() and cv_weights() read the acts 1-3 view and score all posts.
FLOOR = 0.75  # a forum is named when its whole 95% interval sits below this share routed right
WACO_RE = re.compile(r"\b(waco|koresh|davidians?|batf)\b", re.I)
_AV = {}
_HF = []


def audited():
    """The audited router's view of every earlier and later post, and who the router has met."""
    if not _AV:
        d = data()
        seen = set(d["authors"])
        _AV.update(A=[view_of(p) for p in d["Ptr"]], B=[view_of(p) for p in d["Pte"]],
                   met=np.array([author_of(p) in seen for p in d["Pte"]]))
        _AV["known"] = float(_AV["met"][d["new"]].mean())  # the later mix the harness is weighted to
    return _AV


def harness_folds():
    """Act 4's harness: the earlier posts in five folds grouped by thread, the audited view, each fold
    vectorised on its own training part. Entries: (train, val, Ta, Tb, val_new, val_met)."""
    if not _HF:
        d = data()
        A, au, ntr = audited()["A"], np.array(d["authors"]), d["new_tr"]
        for i, j in GroupKFold(n_splits=5).split(A, d["ytr"], d["threads"]):
            Ta, Tb, _ = tfidf([A[k] for k in i], [A[k] for k in j])
            s = set(au[i])
            _HF.append((i, j, Ta, Tb, ntr[j], np.array([a in s for a in au[j]])))
    return _HF


def harness_run(fit_predict):
    """fit_predict(Xa, ya, train_idx, Xb) -> forums, run on every fold. Returns the harness's new
    threads pooled over the folds: their index, forum, prediction, fold and whether the sender was met,
    plus the score raw and weighted to the later posts' share of met senders."""
    d = data()
    ix, y, p, m, f = [], [], [], [], []
    for n, (i, j, Ta, Tb, vn, vm) in enumerate(harness_folds()):
        pr = fit_predict(Ta, d["ytr"][i], i, Tb)
        ix.append(j[vn]); y.append(d["ytr"][j][vn]); p.append(pr[vn]); m.append(vm[vn]); f.append(np.full(vn.sum(), n))
    ix, y, p, m, f = map(np.concatenate, (ix, y, p, m, f))
    ok = p == y
    k = audited()["known"]
    return dict(ix=ix, y=y, pred=p, met=m, fold=f, ok=ok, raw=float(ok.mean()),
                weighted=float(k * ok[m].mean() + (1 - k) * ok[~m].mean()))


def forum_mean(y, pred):
    """Each forum counted once: the mean of the twenty forums' shares routed right."""
    return float(np.mean([np.mean(pred[y == k] == k) for k in range(20) if (y == k).any()]))


def balanced_on_new(y, is_new):
    """Class weights that balance the forums by their new threads, not their posts: each forum's
    posts weighted by one over its share of the new threads (scaled to average 1)."""
    nt = np.bincount(y[is_new], minlength=20) / is_new.sum()
    w = 1 / nt
    return {k: float(v) for k, v in enumerate(w / w.mean())}


def _conversation(P, is_new, is_reply_of):
    """Weight of each new thread when a conversation counts once per post: 1 + the replies its thread
    drew, shared among new threads with the same subject key."""
    reps = collections.Counter(thread_of(P[r]) for r in is_reply_of)
    opens = collections.Counter(thread_of(P[i]) for i in np.where(is_new)[0])
    return np.array([1 + reps[thread_of(P[i])] / opens[thread_of(P[i])] for i in np.where(is_new)[0]])


def the_metric():
    section("23. the_metric -- what the harness counts, and what an average of new threads hides")
    d = data()
    names, Ptr, Pte, ytr, yte, new, ntr = d["names"], d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"], d["new_tr"]
    av = audited()
    Xa, Xb, _ = tfidf(av["A"], av["B"])
    C = 0.3  # the harness's pick (the_split)
    pred = svm_predict(Xa, ytr, Xb, C)
    yn, pn = yte[new], pred[new]
    okn = pn == yn
    N = len(yn)
    h = harness_run(lambda Ta, ya, i, Tb: svm_predict(Ta, ya, Tb, C))

    # the forum mix the scored posts carry
    mix = lambda y: np.bincount(y, minlength=20) / len(y)
    later = mix(yn)
    tv = lambda a: 0.5 * np.abs(a - later).sum()
    print("the audited view, linear SVM (C=%g); later new threads %d, harness new threads %d" % (C, N, len(h["y"])))
    print()
    print("the forum mix, distance from the later new threads' mix (half the summed difference of 20 shares)")
    print("  all earlier posts, the mix a test on every post scores   %.1f%%" % (100 * tv(mix(ytr))))
    print("  earlier new threads, the mix the harness scores          %.1f%%" % (100 * tv(mix(ytr[ntr]))))

    # three ways to count the same routes
    th = threads()
    later_open = [i for i in th["grp"]["later"]]  # replies to threads a later new post opened
    before = th["before"]
    w_later = _conversation(Pte, new & np.array([thread_of(p) not in before for p in Pte]), later_open)
    # a later new thread whose subject was already in use before the cut-off opened nothing: weight 1
    wl = np.ones(N)
    own = np.array([thread_of(Pte[i]) not in before for i in np.where(new)[0]])
    wl[own] = w_later
    tr_rep = [i for i in np.where(~ntr)[0]]
    wh_all = _conversation(Ptr, ntr, tr_rep)
    pos = {g: k for k, g in enumerate(np.where(ntr)[0])}
    wh = np.array([wh_all[pos[g]] for g in h["ix"]])

    def counts(y, pr, w):
        ok = pr == y
        n = len(y)
        s = {"thread": (ok.mean(), *_boot(lambda i: ok[i].mean(), n)),
             "forum": (forum_mean(y, pr), *_boot(lambda i: forum_mean(y[i], pr[i]), n)),
             "conv": ((w * ok).sum() / w.sum(), *_boot(lambda i: (w[i] * ok[i]).sum() / w[i].sum(), n))}
        return {k: [round(float(x), 4) for x in v] for k, v in s.items()}

    S = {"later": counts(yn, pn, wl), "harness": counts(h["y"], h["pred"], wh)}
    print()
    print("three ways to count the same routes          later new threads          harness")
    lab = {"thread": "each new thread once", "forum": "each forum once (mean of 20)",
           "conv": "each post of its conversation"}
    for k in ("thread", "forum", "conv"):
        a, b = S["later"][k], S["harness"][k]
        print("  %-38s %.4f (%.4f-%.4f)   %.4f (%.4f-%.4f)" % (lab[k], *a, *b))
    print("  (a conversation: the new thread and the replies its thread drew; the 5 largest carry %.1f%%"
          % (100 * np.sort(wl)[-5:].sum() / wl.sum()))
    print("   of the later weight)")
    c_new = np.bincount(yn, minlength=20)
    kf, ka = names.index("misc.forsale"), names.index("alt.atheism")
    print("  counting each forum once, one alt.atheism thread weighs as much as %.1f misc.forsale ones"
          % (c_new[kf] / c_new[ka]))

    # each forum, later and on the harness
    def per_forum(y, pr, w):
        rows = []
        for k in range(20):
            m = y == k
            ok, ww = (pr[m] == k), w[m]
            lo, hi = _boot(lambda i: ok[i].mean(), m.sum())
            clo, chi = _boot(lambda i: (ww[i] * ok[i]).sum() / ww[i].sum(), m.sum())
            rows.append({"n": int(m.sum()), "w": round(float(w[m].sum() / w.sum()), 4),
                         "acc": round(float(ok.mean()), 4), "lo": round(float(lo), 4), "hi": round(float(hi), 4),
                         "cacc": round(float((ww * ok).sum() / ww.sum()), 4),
                         "clo": round(float(clo), 4), "chi": round(float(chi), 4)})
        return rows

    F = {"later": per_forum(yn, pn, wl), "harness": per_forum(h["y"], h["pred"], wh)}
    print()
    print("each forum's new threads routed right (95%% interval); * = the whole interval below %.2f" % FLOOR)
    print("  %-25s %-5s %-22s %s" % ("forum", "share", "later new threads", "harness"))
    for k in np.argsort(-c_new, kind="stable"):
        a, b = F["later"][k], F["harness"][k]
        star = lambda r: "*" if r["hi"] < FLOOR else " "
        print(("  %-25s %4.1f%%  %.3f (%.3f-%.3f)%s  %.3f (%.3f-%.3f)%s"
               % (names[k], 100 * c_new[k] / N, a["acc"], a["lo"], a["hi"], star(a), b["acc"], b["lo"], b["hi"],
                  star(b))).rstrip())
    for s in ("harness", "later"):
        print("  below the floor, %-8s %s" % (s + ":", ", ".join(names[k] for k in range(20) if F[s][k]["hi"] < FLOOR)))

    # the forum the harness passed and the later posts did not
    kt, kg = names.index("talk.politics.misc"), names.index("talk.politics.guns")
    tm = np.where(new & (yte == kt))[0]
    miss = [i for i in tm if pred[i] != kt]
    to_g = [i for i in miss if pred[i] == kg]
    waco = [i for i in to_g if WACO_RE.search(av["B"][i])]
    print()
    print("talk.politics.misc: harness %.3f, later %.3f. Of its %d later new threads %d are misrouted, %d to"
          % (F["harness"][kt]["acc"], F["later"][kt]["acc"], len(tm), len(miss), len(to_g)))
    print("talk.politics.guns, and %s name Waco, Koresh, the Davidians or the BATF"
          % ("all %d" % len(to_g) if len(waco) == len(to_g) else "%d of those %d" % (len(waco), len(to_g))))
    print("  naming them          all    in guns   in politics.misc")
    for lbl, P, Y, sel in (("earlier posts", av["A"], ytr, np.ones(len(ytr), bool)),
                           ("later posts", av["B"], yte, np.ones(len(yte), bool)),
                           ("earlier new threads", av["A"], ytr, ntr), ("later new threads", av["B"], yte, new)):
        c = collections.Counter(names[Y[i]] for i in np.where(sel)[0] if WACO_RE.search(P[i]))
        print("  %-19s %4d    %4d      %4d" % (lbl, sum(c.values()), c["talk.politics.guns"], c["talk.politics.misc"]))
    print("  the misroutes to guns move the later new threads' score by %.2f points" % (100 * len(to_g) / N))

    out = {"floor": FLOOR, "names": list(names), "n_later": int(N), "n_harness": int(len(h["y"])),
           "scores": S, "forums": F, "order": [int(k) for k in np.argsort(-c_new, kind="stable")],
           "waco": {"forum": "talk.politics.misc", "n": len(tm), "miss": len(miss), "to_guns": len(to_g),
                    "named": len(waco)}}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "metric.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


def metric_choice():
    section("24. metric_choice -- does the count change what the harness picks?")
    d = data()
    names, ytr, yte, new, ntr = d["names"], d["ytr"], d["yte"], d["new"], d["new_tr"]
    av = audited()
    Xa, Xb, _ = tfidf(av["A"], av["B"])
    yn = yte[new]
    kf, ka = names.index("misc.forsale"), names.index("alt.atheism")
    bw = balanced_on_new(ytr, ntr)
    cands = [("C=%g" % c, c, None) for c in C_GRID] + [("C=0.3, balanced by new threads", 0.3, "eq")]
    print("the harness (thread-grouped, new threads) under two counts, and the later new threads")
    print("balanced by new threads: each forum's posts weighted by one over its share of the new")
    print("threads, so an alt.atheism post weighs %.1f misc.forsale posts in training" % (bw[ka] / bw[kf]))
    print()
    print("  %-31s %-28s %s" % ("", "harness", "later new threads"))
    print("  %-31s %-9s%-9s%-10s %-9s%s" % ("", "thread", "weighted", "forum", "thread", "forum"))
    R = []
    for lbl, c, kind in cands:
        def fp(Ta, ya, i, Tb, c=c, kind=kind):
            w = balanced_on_new(ya, ntr[i]) if kind == "eq" else None
            return LinearSVC(C=c, class_weight=w).fit(Ta, ya).predict(Tb)
        r = harness_run(fp)
        pl = fp(Xa, ytr, np.arange(len(ytr)), Xb)[new]
        R.append(dict(label=lbl, h=r, later=pl))
        print("  %-31s %-9.4f%-9.4f%-10.4f %-9.4f%.4f" % (lbl, r["raw"], r["weighted"], forum_mean(r["y"], r["pred"]),
                                                     np.mean(pl == yn), forum_mean(yn, pl)))
    grid = R[:len(C_GRID)]
    pick = lambda f: max(grid, key=f)["label"]
    print()
    print("  choosing C, counting threads: the harness picks %s, the later posts %s"
          % (pick(lambda r: r["h"]["raw"]), pick(lambda r: np.mean(r["later"] == yn))))
    print("  choosing C, counting forums:  the harness picks %s, the later posts %s"
          % (pick(lambda r: forum_mean(r["h"]["y"], r["h"]["pred"])), pick(lambda r: forum_mean(yn, r["later"]))))

    def paired_h(a, b):
        y = a["y"]
        dt = a["ok"].astype(float) - b["ok"].astype(float)
        t = (dt.mean(), *_boot(lambda i: dt[i].mean(), len(y)))
        f = (forum_mean(y, a["pred"]) - forum_mean(y, b["pred"]),
             *_boot(lambda i: forum_mean(y[i], a["pred"][i]) - forum_mean(y[i], b["pred"][i]), len(y)))
        return 100 * np.array(t), 100 * np.array(f)

    print()
    print("  on the harness, change against C=0.3, points (95% interval)")
    print("  %-31s %-24s %s" % ("", "counting threads", "counting forums"))
    for r in (R[2], R[4]):
        t, f = paired_h(r["h"], R[1]["h"])
        print("  %-31s %+.2f (%+.2f, %+.2f)    %+.2f (%+.2f, %+.2f)" % (r["label"], *t, *f))


# ------------------------------------------------------------------ #
# 25. Baselines: the majority guess and a keyword rule, on the harness
# ------------------------------------------------------------------ #
KW_K = (3, 5, 10, 25, 50, 100, 250, 1000)
KW_MIN_DF = 10  # a keyword must appear in at least this many earlier posts
KW_SHOW = 12  # keywords per forum shown in the lab
# private people among the rule's first twelve words per forum (hand-read in context): masked in the
# lab. Public figures (players, a cryptographer, an author) stay; so do places and organisations.
KW_PEOPLE = WEIGHT_PEOPLE | {"bobbe", "beauchaine", "ico", "mozumder", "teel", "jsh"}


def kw_fit(Ta, ya, K):
    """A keyword rule learned from posts: every word seen in KW_MIN_DF+ posts belongs to the forum that
    holds the largest share of the posts containing it; each forum keeps its K words with the largest
    share (ties: the more posts, the better). Returns the word columns per forum, the shares and df."""
    B = (Ta > 0).astype(np.int32).tocsc()
    df = np.asarray(B.sum(0)).ravel()
    dfk = np.vstack([np.asarray(B[ya == k].sum(0)).ravel() for k in range(20)])
    share = dfk / np.maximum(df, 1)
    best = share.argmax(0)
    words = []
    for k in range(20):
        c = np.where((df >= KW_MIN_DF) & (best == k))[0]
        words.append(c[np.lexsort((-df[c], -share[k, c]))[:K]])
    return words, share, df


def kw_route(Tb, words):
    """Each post goes to the forum with the most of its keywords present. Returns (forum, fired):
    fired is False when no keyword is present or two forums tie."""
    B = (Tb > 0).astype(np.int32).tocsc()
    hits = np.column_stack([np.asarray(B[:, w].sum(1)).ravel() for w in words])
    top = hits.max(1)
    return hits.argmax(1), (top > 0) & ((hits == top[:, None]).sum(1) == 1)


def baselines():
    section("25. baselines -- the majority guess and a keyword rule, on the harness and later")
    d = data()
    names, Ptr, ytr, yte, new, ntr = d["names"], d["Ptr"], d["ytr"], d["yte"], d["new"], d["new_tr"]
    av = audited()
    Xa, Xb, vec = tfidf(av["A"], av["B"])
    vocab = vec.get_feature_names_out()
    yn, k_met = yte[new], av["known"]
    svm_h = harness_run(lambda Ta, ya, i, Tb: svm_predict(Ta, ya, Tb, 0.3))
    svm_l = svm_predict(Xa, ytr, Xb, 0.3)[new] == yn
    wtd = lambda ok, met: float(k_met * ok[met].mean() + (1 - k_met) * ok[~met].mean())
    hy, hm = svm_h["y"], svm_h["met"]

    print("the audited view; harness = earlier posts, 5 folds grouped by thread, scored on their new")
    print("threads (weighted: to the later mix of senders it has met); later = the 2527 later new threads")
    print()
    print("the majority guess                          harness  weighted  later")
    maj = {}
    for lbl, pick in (("the most common forum of all posts", lambda y, isn: np.bincount(y).argmax()),
                      ("the most common forum of new threads", lambda y, isn: np.bincount(y[isn]).argmax())):
        oh = np.concatenate([np.full(vn.sum(), pick(ytr[i], ntr[i])) for i, j, Ta, Tb, vn, vm in harness_folds()]) == hy
        f = pick(ytr, ntr)
        ol = yn == f
        maj[lbl] = {"forum": names[f], "h": round(float(oh.mean()), 4), "w": round(wtd(oh, hm), 4),
                    "l": round(float(ol.mean()), 4)}
        print("  %-41s %.4f   %.4f    %.4f  (%s)" % (lbl, oh.mean(), wtd(oh, hm), ol.mean(), names[f]))

    print()
    print("a keyword rule learned from the earlier posts: every word seen in %d+ posts belongs to the forum"
          % KW_MIN_DF)
    print("holding the largest share of its posts; each forum keeps its K words with the largest share; a")
    print("post goes to the forum with the most of its keywords. No keyword, or a tie: the rule does not")
    print("fire and the post goes to the most common forum of new threads.")
    print()
    print("         harness                              later new threads")
    print("  K      right   weighted  fires  right when  right   fires  right when  SVM on the")
    print("                                  it fires                   it fires    same posts")
    fb_l = np.bincount(ytr[ntr]).argmax()
    rows, keep = [], {}
    for K in KW_K:
        pf, ff, per = [], [], []
        for i, j, Ta, Tb, vn, vm in harness_folds():
            w, _, _ = kw_fit(Ta, ytr[i], K)
            a, fi = kw_route(Tb, w)
            pf.append(np.where(fi, a, np.bincount(ytr[i][ntr[i]]).argmax())[vn]); ff.append(fi[vn])
        ph, fh = np.concatenate(pf), np.concatenate(ff)
        oh = ph == hy
        w, _, _ = kw_fit(Xa, ytr, K)
        a, fl = kw_route(Xb, w)
        pl, fl = np.where(fl, a, fb_l)[new], fl[new]
        ol = pl == yn
        r = {"K": K, "h": round(float(oh.mean()), 4), "w": round(wtd(oh, hm), 4), "h_fires": round(float(fh.mean()), 4),
             "h_prec": round(float(oh[fh].mean()), 4), "h_svm": round(float(svm_h["ok"][fh].mean()), 4),
             "l": round(float(ol.mean()), 4), "l_fires": round(float(fl.mean()), 4),
             "l_prec": round(float(ol[fl].mean()), 4), "l_svm": round(float(svm_l[fl].mean()), 4),
             "forum_h": [round(float(oh[hy == k].mean()), 4) for k in range(20)]}
        rows.append(r)
        keep[K] = (oh, fh)
        print("  %-5d  %.4f  %.4f    %4.1f%%  %.4f      %.4f  %4.1f%%  %.4f      %.4f"
              % (K, r["h"], r["w"], 100 * r["h_fires"], r["h_prec"], r["l"], 100 * r["l_fires"], r["l_prec"], r["l_svm"]))
    pick = max(rows, key=lambda r: r["h"])
    best_l = max(rows, key=lambda r: r["l"])
    print("  the harness picks K=%d; the later posts would pick K=%d (%.4f)" % (pick["K"], best_l["K"], best_l["l"]))

    Kp = pick["K"]
    oh, fh = keep[Kp]
    pr = _paired(svm_h["ok"], oh, check=False)
    print()
    print("the linear SVM (C=0.3)                       %.4f   %.4f    %.4f"
          % (svm_h["raw"], svm_h["weighted"], svm_l.mean()))
    print("  SVM - rule (K=%d) on the harness: %+.2f points (95%%: %+.2f to %+.2f); the rule alone is right"
          % (Kp, 100 * pr["diff"], 100 * pr["lo"], 100 * pr["hi"]))
    print("  on %d new threads, the SVM alone on %d" % (pr["only_b"], pr["only_a"]))
    surest = rows[0]
    print("  on the posts the rule is surest of (K=%d, it fires on %.1f%%): the rule %.3f, the SVM %.3f;"
          % (surest["K"], 100 * surest["h_fires"], surest["h_prec"], surest["h_svm"]))
    print("  later %.3f and %.3f" % (surest["l_prec"], surest["l_svm"]))
    svm_f = [float(svm_h["ok"][hy == k].mean()) for k in range(20)]
    beats = [names[k] for k in range(20) if pick["forum_h"][k] > svm_f[k]]
    print("  forums where the rule (K=%d) beats the SVM on the harness: %s" % (Kp, ", ".join(beats) or "none"))
    worst = min(range(20), key=lambda k: pick["forum_h"][k])
    print("  the rule's worst forum: %s, %.3f (the SVM %.3f)" % (names[worst], pick["forum_h"][worst], svm_f[worst]))

    # what the rule's first words are, all earlier posts
    words, share, df = kw_fit(Xa, ytr, KW_SHOW)
    B = (Xa > 0).tocsc()
    thr = np.array(d["threads"])
    uu = np.array([sum(1 for ln in p["body"] if UU_RE.match(ln)) >= 10 for p in Ptr])
    tally = collections.Counter()
    forums = []
    for k in range(20):
        ws = []
        for c in words[k]:
            docs = B[:, c].nonzero()[0]
            one = collections.Counter(thr[docs]).most_common(1)[0][1] / len(docs)
            wd = str(vocab[c])
            tag = ("encoded" if uu[docs].mean() > 0.5 else "person" if wd in KW_PEOPLE
                   else "thread" if one >= 0.5 else "")
            tally[tag] += 1
            ws.append({"w": wd[0] + "•" * (len(wd) - 1) if tag == "person" else wd, "df": int(df[c]),
                       "share": round(float(share[k, c]), 2), "tag": tag, "thread": round(float(one), 2)})
        forums.append({"name": names[k], "words": ws, "svm_h": round(svm_f[k], 4)})
    n = sum(tally.values())
    print()
    print("each forum's first %d keywords (%d words, all earlier posts):" % (KW_SHOW, n))
    for lbl, key in (("fragments of an encoded file (most of their posts carry one)", "encoded"),
                     ("a private person: a name, initials or an address", "person"),
                     ("one conversation (half their posts or more in one thread)", "thread"),
                     ("the rest", "")):
        print("  %-60s %3d" % (lbl, tally[key]))

    out = {"k": list(KW_K), "pick": Kp, "rows": rows, "majority": maj,
           "svm": {"h": round(svm_h["raw"], 4), "w": round(svm_h["weighted"], 4), "l": round(float(svm_l.mean()), 4)},
           "forums": forums, "min_df": KW_MIN_DF}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "keywords.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 26. Naive Bayes: the textbook model, the fixes, and the bar
# ------------------------------------------------------------------ #
NB_ALPHAS = (0.01, 0.03, 0.1, 0.3, 1.0)
NB_STEPS = (("word counts", "counts"), ("+ log counts", "log"), ("+ each post's length normalised", "len"),
            ("+ IDF (the SVM's TF-IDF)", "idf"))
NB_KINDS = (("multinomial", lambda a: MultinomialNB(alpha=a)), ("complement", lambda a: ComplementNB(alpha=a)),
            ("complement, weights normalised", lambda a: ComplementNB(alpha=a, norm=True)))
# later new threads for the lab, read in full and naming no private person: a Windows question the
# counts model files elsewhere, a sci.crypt request only naive Bayes gets right, and a verse posted
# to talk.religion.misc only the SVM gets right
NB_SPECIMENS = (407, 924, 2274)
_HC = []


def harness_counts():
    """Word counts of each harness fold, on the same vocabulary as the fold's TF-IDF."""
    if not _HC:
        A = audited()["A"]
        for i, j, Ta, Tb, vn, vm in harness_folds():
            cv = CountVectorizer()
            Ca, Cb = cv.fit_transform([A[k] for k in i]), cv.transform([A[k] for k in j])
            assert Ca.shape == Ta.shape and Cb.shape == Tb.shape
            _HC.append((Ca, Cb))
    return _HC


def nb_features(Ca, Cb, step):
    """The fixes of Rennie et al. (2003), cumulative: word counts; log counts (1 + ln n, as the router's
    TF-IDF has them); each post's length normalised; IDF, which makes it the TF-IDF the SVM reads."""
    if step == "counts":
        return Ca, Cb
    La, Lb = Ca.astype(float), Cb.astype(float)
    La.data, Lb.data = 1 + np.log(La.data), 1 + np.log(Lb.data)
    if step == "log":
        return La, Lb
    t = TfidfTransformer(use_idf=step == "idf")
    return t.fit_transform(La), t.transform(Lb)


def harness_steps(make, step):
    """A model on the harness, fitted on one of the feature steps."""
    folds = iter(harness_counts())

    def fp(Ta, ya, i, Tb):
        Ca, Cb = next(folds)
        assert Ca.shape[0] == Ta.shape[0]
        Xa, Xb = nb_features(Ca, Cb, step)
        return make().fit(Xa, ya).predict(Xb)
    return harness_run(fp)


def harness_choose(runs):
    """Choose among harness runs without the choice flattering the winner: in each fold, the run that
    scores best on the other four folds' new threads, scored on this fold. Returns right/wrong per new
    thread and the pick in each fold."""
    keys = list(runs)
    fo = runs[keys[0]]["fold"]
    ok, picks = np.zeros(len(fo), bool), []
    for f in range(5):
        k = max(keys, key=lambda q: runs[q]["ok"][fo != f].mean())
        ok[fo == f] = runs[k]["ok"][fo == f]
        picks.append(k)
    return ok, picks


def _nb_scores(m, X):
    """Each forum's score, and the parts it is the sum of: a weight per word, times the word's value in
    the post, plus the forum's prior (the complement model has none)."""
    W = m.feature_log_prob_
    prior = m.class_log_prior_ if isinstance(m, MultinomialNB) else np.zeros(len(W))
    return np.asarray(X @ W.T) + prior, W, prior


def _pp(p):
    return "%+.2f (%+.2f, %+.2f)" % (100 * p["diff"], 100 * p["lo"], 100 * p["hi"])


def naive_bayes():
    section("26. naive_bayes -- the textbook model, the fixes, and the bar")
    d = data()
    names, ytr, yte, new = d["names"], d["ytr"], d["yte"], d["new"]
    av = audited()
    A, B = av["A"], av["B"]
    X0, _ = nb_features(*harness_counts()[0], "idf")
    assert abs(X0 - harness_folds()[0][2]).max() < 1e-12, "the last step must be the SVM's TF-IDF"
    kw = names.index("comp.os.ms-windows.misc")

    svm = harness_run(lambda Ta, ya, i, Tb: svm_predict(Ta, ya, Tb, 0.3))
    n = len(svm["y"])
    print("the audited view; harness = earlier posts, 5 folds grouped by thread, scored on their %d new" % n)
    print("threads (weighted: to the later mix of senders it has met). Every cell picks its own alpha,")
    print("the smoothing, on the harness from %s." % ", ".join("%g" % a for a in NB_ALPHAS))
    print()

    runs = nb_runs()
    best = {}
    for (kind, step, a), r in runs.items():
        if (kind, step) not in best or r["raw"] > best[kind, step][1]["raw"]:
            best[kind, step] = (a, r)

    a0, r0 = best["multinomial", "counts"]
    fw = r0["y"] == kw
    print("the textbook model: multinomial naive Bayes on word counts, alpha %g" % a0)
    print("  harness %.4f, weighted %.4f; the SVM %.4f, %.4f" % (r0["raw"], r0["weighted"], svm["raw"], svm["weighted"]))
    print("  comp.os.ms-windows.misc: %d of its %d harness new threads routed there (the SVM %d); the model"
          % ((r0["pred"][fw] == kw).sum(), fw.sum(), (svm["pred"][fw] == kw).sum()))
    print("  sends %d of all %d there" % ((r0["pred"] == kw).sum(), n))
    cv = CountVectorizer()
    Ca, Cb = cv.fit_transform(A), cv.transform(B)
    vocab = cv.get_feature_names_out()
    uu = np.array([sum(1 for ln in p["body"] if UU_RE.match(ln)) >= 10 for p in d["Ptr"]])
    tot = np.asarray(Ca.sum(1)).ravel()
    mk = ytr == kw
    print("  %d of its %d earlier posts carry an encoded file; they hold %.1f%% of the words it counts"
          % ((uu & mk).sum(), mk.sum(), 100 * tot[uu & mk].sum() / tot[mk].sum()))
    the = np.asarray(Ca[:, cv.vocabulary_["the"]].todense()).ravel()
    rate = np.array([1000 * the[ytr == k].sum() / tot[ytr == k].sum() for k in range(20)])
    oth = np.delete(rate, kw)
    print("  'the' per 1000 counted words: %.1f in comp.os.ms-windows.misc, %.1f to %.1f in the other forums"
          % (rate[kw], oth.min(), oth.max()))

    print()
    print("the fixes of Rennie et al. (2003), one at a time; harness, with each cell's alpha")
    print("                                   multinomial      complement       complement, weights normalised")
    for lbl, step in NB_STEPS:
        print("  %-32s" % lbl + "".join(" %.4f  %-7g " % (best[k, step][1]["raw"], best[k, step][0]) for k, _ in NB_KINDS).rstrip())
    print("  each step against the row above, paired, points (95%):")
    for (lbl, step), (_, prev) in zip(NB_STEPS[1:], NB_STEPS):
        print("  %-32s" % lbl + "".join(" %-21s" % _pp(_paired(best[k, step][1]["ok"], best[k, prev][1]["ok"], check=False))
                                       for k, _ in NB_KINDS).rstrip())
    print("  complement against multinomial, lengths normalised: %s"
          % _pp(_paired(best["complement", "len"][1]["ok"], best["multinomial", "len"][1]["ok"], check=False)))
    print("  complement on the SVM's TF-IDF against the SVM: %s"
          % _pp(_paired(best["complement", "idf"][1]["ok"], svm["ok"], check=False)))
    sv = svm_runs()
    for step, lbl in (("len", "lengths normalised"), ("idf", "+ IDF")):
        c = max(C_GRID, key=lambda C: sv[step, C]["raw"])
        print("  the linear SVM, %-18s %.4f (C=%g)" % (lbl, sv[step, c]["raw"], c))

    key = max(runs, key=lambda q: runs[q]["raw"])
    pick = runs[key]
    nb_ok, nb_picks = harness_choose(runs)
    sv_ok, sv_picks = harness_choose(sv)
    print()
    assert key[:2] == ("complement", "len"), "the text below names the pick"
    print("the harness's pick among all %d: complement, log counts with each post's length normalised" % len(runs))
    print("  (no IDF), alpha %g" % key[2])
    print("  chosen on four folds and scored on the fifth: %.4f (the same pick in %d of 5 folds)"
          % (nb_ok.mean(), sum(q == key for q in nb_picks)))
    print("  the SVM, choosing its C and whether to use IDF the same way: %.4f" % sv_ok.mean())

    a, b, m = pick["ok"], svm["ok"], svm["met"]
    assert (pick["y"] == svm["y"]).all() and (pick["ix"] == svm["ix"]).all()
    print()
    print("the pick against the linear SVM (C=0.3, TF-IDF)")
    def row(lbl, x, z, p=None):
        print(("  %-30s %.4f       %.4f   %s" % (lbl, x, z, _pp(p) if p else "")).rstrip())
    print("                                 naive Bayes  SVM      naive Bayes - SVM, points (95%)")
    row("harness, %d new threads" % n, a.mean(), b.mean(), _paired(a, b, check=False))
    row("both chosen fold by fold", nb_ok.mean(), sv_ok.mean(), _paired(nb_ok, sv_ok, check=False))
    row("weighted", pick["weighted"], svm["weighted"])
    for lbl, sel in (("known senders", m), ("new senders", ~m)):
        row("%s, %d" % (lbl, sel.sum()), a[sel].mean(), b[sel].mean(), _paired(a[sel], b[sel], check=False))
    row("each forum once", forum_mean(pick["y"], pick["pred"]), forum_mean(svm["y"], svm["pred"]))
    same = pick["pred"] == svm["pred"]
    print("  they route %.1f%% of the new threads alike and are right on %.1f%% of those; of the %d where"
          % (100 * same.mean(), 100 * a[same].mean(), (~same).sum()))
    print("  they differ, naive Bayes alone is right on %d, the SVM alone on %d, neither on %d"
          % ((a & ~same).sum(), (b & ~same).sum(), (~a & ~b & ~same).sum()))

    print()
    print("  per forum on the harness, 95%% intervals; * the whole interval is below %.2f" % FLOOR)
    print("  %-26s %4s   %-22s %s" % ("", "n", "naive Bayes", "SVM"))
    y = svm["y"]
    forums, below = [], {"nb": [], "svm": []}
    for k in range(20):
        s = y == k
        c, v = (a[s].mean(), *_ci(a[s])), (b[s].mean(), *_ci(b[s]))
        fc, fv = c[2] < FLOOR, v[2] < FLOOR
        if fc:
            below["nb"].append(names[k])
        if fv:
            below["svm"].append(names[k])
        forums.append({"name": names[k], "n": int(s.sum()), "nb": [round(float(q), 4) for q in c],
                       "svm": [round(float(q), 4) for q in v]})
        print(("  %-26s %4d   %.3f (%.3f-%.3f)%s  %.3f (%.3f-%.3f)%s"
               % (names[k], s.sum(), *c, "*" if fc else " ", *v, "*" if fv else "")).rstrip())
    hi = sum(f["nb"][0] > f["svm"][0] for f in forums)
    lo = sum(f["nb"][0] < f["svm"][0] for f in forums)
    print("  naive Bayes is higher on %d forums, the SVM on %d, level on %d" % (hi, lo, 20 - hi - lo))
    print("  below the floor: naive Bayes %s" % ", ".join(below["nb"]))
    print("                   the SVM     %s" % ", ".join(below["svm"]))
    kr, ks = names.index("talk.religion.misc"), names.index("soc.religion.christian")
    s = y == kr
    print("  talk.religion.misc: naive Bayes sends %d of its %d to soc.religion.christian, the SVM %d"
          % ((pick["pred"][s] == ks).sum(), s.sum(), (svm["pred"][s] == ks).sum()))

    # the later new threads, report only; and the lab's three posts, fitted on all earlier posts
    Xa, Xb, v2 = tfidf(A, B)
    assert (v2.get_feature_names_out() == vocab).all()
    Na, Nb = nb_features(Ca, Cb, "len")
    yn = yte[new]
    lab = (("mnb_counts", "multinomial, word counts", MultinomialNB(alpha=a0).fit(Ca, ytr), Cb),
           ("mnb_len", "multinomial, lengths normalised", MultinomialNB(alpha=best["multinomial", "len"][0]).fit(Na, ytr), Nb),
           ("cnb_len", "complement, lengths normalised", dict(NB_KINDS)[key[0]](key[2]).fit(Na, ytr), Nb))
    sc = {k: (_nb_scores(mm, X), X) for k, _, mm, X in lab}
    pred = {k: s_[0][0].argmax(1) for k, s_ in sc.items()}
    ps = svm_predict(Xa, ytr, Xb, 0.3)
    pn = pred["cnb_len"]
    fl = yn == kw
    print()
    print("the later new threads (report only): multinomial on word counts %.4f, routing %d of the %d"
          % (np.mean(pred["mnb_counts"][new] == yn), (pred["mnb_counts"][new][fl] == kw).sum(), fl.sum()))
    print("  comp.os.ms-windows.misc new threads there; the pick %.4f, the SVM %.4f,"
          % (np.mean(pn[new] == yn), np.mean(ps[new] == yn)))
    print("  the pick - the SVM %s" % _pp(_paired(pn[new] == yn, ps[new] == yn, check=False)))

    specimens = []
    print()
    print("the lab's posts (later new threads; counts / lengths normalised / complement / SVM):")
    for t in NB_SPECIMENS:
        yt = int(yte[t])
        assert new[t]
        text = B[t].rstrip()
        segs, last = [], 0
        for mt in TOKEN_RE.finditer(text):
            if mt.start() > last:
                segs.append([text[last:mt.start()], ""])
            w = mt.group().lower()
            segs.append([mt.group(), w if w in cv.vocabulary_ else ""])
            last = mt.end()
        if last < len(text):
            segs.append([text[last:], ""])
        models = {}
        for k, lbl, mm, X in lab:
            (S, W, prior), _ = sc[k]
            s_ = S[t]
            order = np.argsort(-s_)
            pk = int(order[0])
            rival = pk if pk != yt else int(order[1])
            row = X[t].tocoo()
            words = sorted(({"w": str(vocab[c]), "x": round(float(x), 4), "c": round(float(x * (W[yt, c] - W[rival, c])), 4)}
                            for c, x in zip(row.col, row.data)), key=lambda q: -abs(q["c"]))
            pd = float(prior[yt] - prior[rival])
            total = float(s_[yt] - s_[rival])
            assert abs(sum(q["c"] for q in words) + pd - total) < 0.001 * max(10, len(words))
            models[k] = {"pick": names[pk], "rival": names[rival], "total": round(total, 3), "prior": round(pd, 3),
                         "words": words, "top": [{"f": names[int(q)], "gap": round(float(s_[pk] - s_[q]), 3)} for q in order[:3]]}
        specimens.append({"id": int(t), "forum": names[yt], "svm": names[int(ps[t])], "segments": segs, "models": models})
        print("  %d %s" % (t, names[yt]))
        print("    " + " / ".join("right" if models[k]["pick"] == names[yt] else models[k]["pick"] for k, _, _, _ in lab)
              + " / " + ("right" if ps[t] == yt else names[int(ps[t])]))
    s0, s1, s2 = specimens
    assert s0["models"]["mnb_counts"]["pick"] != s0["forum"] == s0["models"]["cnb_len"]["pick"]
    assert s1["models"]["cnb_len"]["pick"] == s1["forum"] != s1["svm"]
    assert s2["models"]["cnb_len"]["pick"] != s2["forum"] == s2["svm"]

    out = {"alphas": list(NB_ALPHAS), "n": n, "floor": FLOOR,
           "ladder": [{"label": lbl, **{k: {"h": round(best[k, s][1]["raw"], 4), "a": best[k, s][0]} for k, _ in NB_KINDS}}
                      for lbl, s in NB_STEPS],
           "pick": {"h": round(pick["raw"], 4), "w": round(pick["weighted"], 4), "cv": round(float(nb_ok.mean()), 4),
                    "l": round(float(np.mean(pn[new] == yn)), 4), "alpha": key[2]},
           "svm": {"h": round(svm["raw"], 4), "w": round(svm["weighted"], 4), "cv": round(float(sv_ok.mean()), 4),
                   "l": round(float(np.mean(ps[new] == yn)), 4)},
           "forums": forums, "models": [{"key": k, "label": lbl} for k, lbl, _, _ in lab], "specimens": specimens}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "naivebayes.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 27. Logistic regression: the second rung, and what its probability is for
# ------------------------------------------------------------------ #
LR_C = (1, 3, 10, 30, 100, 300, 1000)
LR_STEPS = (("TF-IDF", "idf", LR_C), ("no IDF", "len", (10, 100, 1000)))
LR_TOL = 1e-8  # on the gradient: at 1e-6 a fit at C=1000 stops with a gradient of 0.7 and a probability 0.02 off
LR_ITER = 200  # Newton steps; the slowest fit here takes about 20
LR_CACHE = CACHE / "logistic"
LR_DEFAULT_C = 100  # where sklearn's default solver is shown stopping short
BINS = 10  # equal-width bins of stated probability, for the calibration error and the lab's diagram


def _lr_loss(W, b, X, y, C):
    """What logistic regression minimises: half the squared weights, plus C times the summed log loss."""
    Z = np.asarray(X @ W.T) + b
    return float(0.5 * (W ** 2).sum() + C * (logsumexp(Z, axis=1) - Z[np.arange(len(y)), y]).sum())


def logistic_proba(Xa, ya, Xb, C):
    """Each forum's probability for the posts of Xb, from softmax logistic regression fitted on (Xa, ya),
    and the loss the fit reached. Fitted from cold with newton-cg to a gradient of 1e-8: warm-started at
    sklearn's default tolerance it stops after zero steps from C=100 up. A fit at C=1000 takes over a
    minute and the harness needs fifty, so results are cached, keyed by a hash of every input."""
    h = hashlib.sha256(("%r %r %d %s" % (C, LR_TOL, LR_ITER, sklearn.__version__)).encode())
    for a in (Xa.data, Xa.indices, Xa.indptr, np.asarray(ya), Xb.data, Xb.indices, Xb.indptr):
        h.update(np.ascontiguousarray(a).tobytes())
    f = LR_CACHE / (h.hexdigest()[:24] + ".npz")
    if not f.exists():
        m = LogisticRegression(C=C, solver="newton-cg", tol=LR_TOL, max_iter=LR_ITER).fit(Xa, ya)
        assert m.n_iter_.max() < LR_ITER and (m.classes_ == np.arange(20)).all()
        LR_CACHE.mkdir(parents=True, exist_ok=True)
        np.savez(f, P=m.predict_proba(Xb), loss=_lr_loss(m.coef_, m.intercept_, Xa, ya, C))
    z = np.load(f)
    return z["P"], float(z["loss"])


def harness_logistic(step, C):
    """Logistic regression on the harness, on one of naive Bayes's feature steps ("idf" is the harness's
    TF-IDF): harness_run's dict, plus P, each new thread's twenty probabilities, and each fold's loss."""
    folds = iter(harness_counts())
    Ps, losses = [], []

    def fp(Ta, ya, i, Tb):
        Ca, Cb = next(folds)
        Xa, Xb = (Ta, Tb) if step == "idf" else nb_features(Ca, Cb, step)
        P, loss = logistic_proba(Xa, ya, Xb, C)
        Ps.append(P)
        losses.append(loss)
        return P.argmax(1)
    r = harness_run(fp)
    r["P"] = np.vstack([P[vn] for P, (_, _, _, _, vn, _) in zip(Ps, harness_folds())])
    r["loss"] = losses
    assert (r["P"].argmax(1) == r["pred"]).all()
    return r


_LRR, _NBR, _SVR = {}, {}, {}


def lr_runs():
    """Logistic regression on the harness at every feature step and C of LR_STEPS, run once per process."""
    if not _LRR:
        _LRR.update({(step, C): harness_logistic(step, C) for _, step, Cs in LR_STEPS for C in Cs})
    return _LRR


def nb_runs():
    """Every naive Bayes setting on the harness (kind x feature step x alpha), run once per process."""
    if not _NBR:
        _NBR.update({(kind, step, a): harness_steps(lambda a=a, mk=mk: mk(a), step)
                     for kind, mk in NB_KINDS for _, step in NB_STEPS for a in NB_ALPHAS})
    return _NBR


class _Finished(LinearSVC):
    """LinearSVC at its own defaults, required to finish before its iteration cap."""
    def fit(self, X, y, sample_weight=None):
        super().fit(X, y, sample_weight)
        assert self.n_iter_ < self.max_iter, "liblinear stopped at its iteration cap (C=%g)" % self.C
        return self


def svm_runs():
    """The linear SVM on the harness, lengths normalised or with IDF, at each C of C_GRID."""
    if not _SVR:
        _SVR.update({(step, C): harness_steps(lambda C=C: _Finished(C=C), step)
                     for step in ("len", "idf") for C in C_GRID})
    return _SVR


def calib_error(says, ok):
    """Calibration error: in each tenth of stated probability, how far the share right is from the
    probability stated, averaged over the posts."""
    b = np.minimum((says * BINS).astype(int), BINS - 1)
    return float(sum(abs(ok[b == q].mean() - says[b == q].mean()) * (b == q).mean()
                     for q in range(BINS) if (b == q).any()))


def reliability(says, ok):
    """The lab's diagram: per tenth of stated probability, [posts, mean stated, share right]."""
    b = np.minimum((says * BINS).astype(int), BINS - 1)
    return [[int((b == q).sum()), round(float(says[b == q].mean()), 4), round(float(ok[b == q].mean()), 4)]
            if (b == q).any() else [0, None, None] for q in range(BINS)]


def top_gap(S):
    """How far the best score is ahead of the second best."""
    s = np.sort(S, 1)
    return s[:, -1] - s[:, -2]


def fitted_probability(g_fit, ok_fit, g):
    """A logistic regression with one input: the chance the pick is right, from the gap between the
    model's two best scores (Platt's method). Returns the probabilities for g and the slope."""
    m = LogisticRegression(C=1e6).fit(g_fit[:, None], ok_fit)
    return m.predict_proba(g[:, None])[:, 1], float(m.coef_[0, 0])


def logistic():
    section("27. logistic -- the second rung: fitting the weights instead of counting them")
    ytr = data()["ytr"]
    runs = lr_runs()
    r0 = runs["idf", LR_C[0]]
    met, n = r0["met"], len(r0["y"])
    print("the audited view; the harness as before, scored on its %d new threads. Softmax logistic" % n)
    print("regression over the 20 forums with an L2 penalty; C sets how closely it may fit the earlier")
    print("posts (one over the penalty's strength). Every fit runs from cold to a gradient of 1e-8.")

    # sklearn's defaults, at a C where they matter
    print()
    stops, gaps, okd, pd = [], [], [], []
    for f, (i, j, Ta, Tb, vn, vm) in enumerate(harness_folds()):
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            m = LogisticRegression(C=LR_DEFAULT_C).fit(Ta, ytr[i])
        assert not caught, "the text says the default fit raises no warning"
        assert m.get_params()["solver"] == "lbfgs" and m.get_params()["tol"] == 1e-4
        stops.append(int(m.n_iter_.max()))
        loss = _lr_loss(m.coef_, m.intercept_, Ta, ytr[i], LR_DEFAULT_C)
        gaps.append(100 * (loss / runs["idf", LR_DEFAULT_C]["loss"][f] - 1))
        okd.append(m.predict(Tb)[vn] == ytr[j][vn])
        pd.append(m.predict_proba(Tb)[vn])
    okd, pd = np.concatenate(okd), np.vstack(pd)
    gap_p = np.abs(pd - runs["idf", LR_DEFAULT_C]["P"]).max(1)
    print("sklearn's default solver (lbfgs, tolerance 1e-4) at C=%d, on the five folds:" % LR_DEFAULT_C)
    print("  stops after %d to %d of its %d steps, with no warning" % (min(stops), max(stops), m.max_iter))
    print("  its loss %.1f%% to %.1f%% above the minimum; routes %.4f against %.4f at the minimum"
          % (min(gaps), max(gaps), okd.mean(), runs["idf", LR_DEFAULT_C]["raw"]))
    print("  its probabilities differ from the minimum's by %.3f on the median post, %.2f at most"
          % (np.median(gap_p), gap_p.max()))

    print()
    print("features and C on the harness, share routed right (weighted: to the later mix of senders)")
    print("  %-9s %5s   %-7s %s" % ("features", "C", "right", "weighted"))
    for lbl, step, Cs in LR_STEPS:
        for C in Cs:
            print("  %-9s %5g   %.4f  %.4f" % (lbl, C, runs[step, C]["raw"], runs[step, C]["weighted"]))
    print("  TF-IDF from C=%g to C=%g: within %d posts of each other"
          % (LR_C[1], LR_C[-1], max(runs["idf", C]["ok"].sum() for C in LR_C[1:]) - min(runs["idf", C]["ok"].sum() for C in LR_C[1:])))

    key = max(runs, key=lambda q: runs[q]["raw"])
    pick = runs[key]
    lr_ok, lr_picks = harness_choose(runs)
    assert key == ("idf", 100), "the text below names the pick"
    print()
    print("the harness's pick: TF-IDF, C=%g: %.4f (weighted %.4f)" % (key[1], pick["raw"], pick["weighted"]))
    print("  chosen on four folds and scored on the fifth: %.4f (the same pick in %d of 5 folds)"
          % (lr_ok.mean(), sum(q == key for q in lr_picks)))

    nb, sv = nb_runs(), svm_runs()
    nb_ok, _ = harness_choose(nb)
    sv_ok, _ = harness_choose(sv)
    bar = nb["complement", "len", 0.1]
    assert (bar["ix"] == pick["ix"]).all()
    print()
    print("against the bar (complement naive Bayes) and the SVM, each chosen on four folds and scored on")
    print("the fifth; points (95%)")
    print("  logistic %.4f, naive Bayes %.4f: %s" % (lr_ok.mean(), nb_ok.mean(), _pp(_paired(lr_ok, nb_ok, check=False))))
    print("  logistic %.4f, the SVM %.4f:     %s" % (lr_ok.mean(), sv_ok.mean(), _pp(_paired(lr_ok, sv_ok, check=False))))
    for lbl, sel in (("known senders", met), ("new senders", ~met)):
        print("  the pick against the bar's pick, %s: %s" % (lbl, _pp(_paired(pick["ok"][sel], bar["ok"][sel], check=False))))
    svp = sv["idf", 0.3]["pred"]
    print("  routed alike: logistic and the SVM %.1f%%, logistic and naive Bayes %.1f%%, naive Bayes and"
          % (100 * np.mean(pick["pred"] == svp), 100 * np.mean(pick["pred"] == bar["pred"])))
    print("  the SVM %.1f%%" % (100 * np.mean(bar["pred"] == svp)))


def how_sure():
    section("28. how_sure -- how sure each model says it is, against how often it is right")
    d = data()
    ytr, yte, new = d["ytr"], d["yte"], d["new"]
    av = audited()
    A, B = av["A"], av["B"]
    runs, nb, sv = lr_runs(), nb_runs(), svm_runs()
    r0 = runs["idf", LR_C[0]]
    y, fo, n = r0["y"], r0["fold"], len(r0["y"])
    bar = nb["complement", "len", 0.1]
    assert (bar["ix"] == r0["ix"]).all()

    print("the harness's %d new threads. 'says': the probability a model gives its pick, on average;" % n)
    print("calibration error: in each tenth of stated probability, the gap between the probability")
    print("stated and the share routed right, averaged over the posts")
    print()
    print("logistic regression on TF-IDF, by C")
    print("  %5s   %-7s %-6s %-8s %s" % ("C", "right", "says", "log loss", "calibration error"))
    stat = {}
    for C in LR_C:
        r = runs["idf", C]
        says = r["P"].max(1)
        stat[C] = dict(right=r["raw"], says=float(says.mean()), ll=float(-np.log(r["P"][np.arange(n), y]).mean()),
                       ce=calib_error(says, r["ok"]))
        s = stat[C]
        print("  %5g   %.4f  %.3f  %.4f   %.3f" % (C, s["right"], s["says"], s["ll"], s["ce"]))
    fold_ll = {C: [float(-np.log(runs["idf", C]["P"][fo == f][np.arange((fo == f).sum()), y[fo == f]]).mean())
                   for f in range(5)] for C in LR_C}
    by_ll = [min(LR_C, key=lambda C: fold_ll[C][f]) for f in range(5)]
    kll = by_ll[0]
    assert set(by_ll) == {300}, "the text below names the C with the lowest log loss"
    print("  the lowest log loss is at C=%g in every fold" % kll)

    # the naive Bayes models' own probabilities, refitted per fold
    jl, pnb, jtext, ptext, gsv = [], [], [], [], []
    for f, ((i, j, Ta, Tb, vn, vm), (Ca, Cb)) in enumerate(zip(harness_folds(), harness_counts())):
        Na, Nb = nb_features(Ca, Cb, "len")
        m = ComplementNB(alpha=0.1).fit(Na, ytr[i])
        jl.append(m.predict_joint_log_proba(Nb)[vn])
        pnb.append(m.predict_proba(Nb)[vn])
        m = MultinomialNB(alpha=0.1).fit(Ca, ytr[i])
        jtext.append(m.predict_joint_log_proba(Cb)[vn])
        ptext.append(m.predict_proba(Cb)[vn])
        gsv.append(top_gap(LinearSVC(C=0.3).fit(Ta, ytr[i]).decision_function(Tb)[vn]))
    jl, pnb, jtext, ptext, gsv = np.vstack(jl), np.vstack(pnb), np.vstack(jtext), np.vstack(ptext), np.concatenate(gsv)
    assert (jl.argmax(1) == bar["pred"]).all() and (pnb.argmax(1) == bar["pred"]).all()
    text_ok = ptext.argmax(1) == y
    assert abs(text_ok.mean() - nb["multinomial", "counts", 0.1]["raw"]) < 1e-12
    g = top_gap(jl)
    fitted, slopes = np.zeros(n), []
    for f in range(5):
        fitted[fo == f], s = fitted_probability(g[fo != f], bar["ok"][fo != f], g[fo == f])
        slopes.append(s)
    assert min(slopes) > 0  # so the fitted probability sorts the posts exactly as the gap does

    print()
    print("how sure each model says it is, against how often it is right (the harness's new threads)")
    print("  %-42s %-7s %-6s %-9s %-6s %s" % ("", "right", "says", "expected", "right", "calibration error"))
    models = [("naive Bayes, the textbook model", "textbook", ptext.max(1), text_ok),
              ("complement naive Bayes (the bar)", "bar", pnb.max(1), bar["ok"])]
    models += [("logistic, C=%g" % kll, "lr", runs["idf", kll]["P"].max(1), runs["idf", kll]["ok"])]
    models += [("the bar + a probability fitted to its gap", "fitted", fitted, bar["ok"])]
    cal = {}
    for lbl, k, says, ok in models:
        cal[k] = dict(right=float(ok.mean()), says=float(says.mean()), expected=float(says.sum()), n_right=int(ok.sum()),
                      ce=calib_error(says, ok), bins=reliability(says, ok))
        c = cal[k]
        print("  %-42s %.4f  %.3f  %6.0f    %5d  %.3f" % (lbl, c["right"], c["says"], c["expected"], c["n_right"], c["ce"]))
    print("  the bar's own probability for its pick: median %.3f, on posts it routes right %.1f%% of the time"
          % (np.median(pnb.max(1)), 100 * bar["raw"]))
    print("  on the median post, the bar's twenty scores span %.2f log units, best to worst; the textbook"
          % np.median(jl.max(1) - jl.min(1)))
    print("  model's pick leads its second by %.1f" % np.median(top_gap(jtext)))

    print()
    print("sorting right from wrong: the chance a right route scores above a wrong one; the share right")
    print("among the surest 80% of posts")
    def sorts(lbl, score, ok):
        top = np.argsort(-score, kind="stable")[: int(0.8 * n)]
        print("  %-46s %.3f   %.3f" % (lbl, roc_auc_score(ok, score), ok[top].mean()))
    sorts("complement naive Bayes, its probability", pnb.max(1), bar["ok"])
    sorts("complement naive Bayes, the gap to its second", g, bar["ok"])
    sorts("the SVM, the gap to its second", gsv, sv["idf", 0.3]["ok"])
    sorts("logistic C=%g, its probability" % kll, runs["idf", kll]["P"].max(1), runs["idf", kll]["ok"])

    # the later new threads, report only: each model fitted on all earlier posts; the bar's fitted
    # probability fitted on all the harness's new threads
    Xa, Xb, _ = tfidf(A, B)
    cv = CountVectorizer()
    Na, Nb = nb_features(cv.fit_transform(A), cv.transform(B), "len")
    yn = yte[new]
    m = ComplementNB(alpha=0.1).fit(Na, ytr)
    nb_ok_l = m.predict(Nb)[new] == yn
    pl, _ = fitted_probability(g, bar["ok"], top_gap(m.predict_joint_log_proba(Nb)[new]))
    P, _ = logistic_proba(Xa, ytr, Xb, kll)
    P = P[new]
    lr_ok_l = P.argmax(1) == yn
    print()
    print("the later new threads (report only; every model fitted on all earlier posts):")
    for lbl, says, ok in (("logistic, C=%g" % kll, P.max(1), lr_ok_l), ("the bar + its fitted probability", pl, nb_ok_l)):
        print("  %s: right %.4f, says %.3f" % (lbl, ok.mean(), says.mean()))
        print("    expects %.0f right of %d, gets %d; calibration error %.3f"
              % (says.sum(), len(yn), ok.sum(), calib_error(says, ok)))

    key = max(runs, key=lambda q: runs[q]["raw"])
    out = {"n": n, "bins": BINS, "C": list(LR_C), "pick": key[1], "byLogLoss": kll,
           "lr": [{"C": C, "right": round(stat[C]["right"], 4), "says": round(stat[C]["says"], 4),
                   "ll": round(stat[C]["ll"], 4), "ce": round(stat[C]["ce"], 4),
                   "expected": round(float(runs["idf", C]["P"].max(1).sum()), 1), "nRight": int(runs["idf", C]["ok"].sum()),
                   "bins": reliability(runs["idf", C]["P"].max(1), runs["idf", C]["ok"])} for C in LR_C],
           "models": {k: {kk: (round(v, 4) if isinstance(v, float) else v) for kk, v in cal[k].items()}
                      for k in ("textbook", "bar", "fitted")}}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "logistic.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


# 29. The linear SVM: the third rung, given its own search
# ------------------------------------------------------------------ #
# The SVM has been the yardstick since act 2 at sklearn's defaults apart from C: squared hinge loss,
# an L2 penalty, one classifier per forum against the rest. Its own search adds the textbook hinge
# loss and an L1 penalty, which gives most words no weight at all. Squared hinge on both feature
# steps is svm_runs(), the runs pages 14 and 15 already compared against.
SVM_C = (0.3, 1.0, 3.0, 10.0)  # hinge and L1 peak at a larger C than squared hinge does
SVM_KINDS = (("hinge", "L2", "hinge", dict(loss="hinge")),
             ("squared hinge", "L1", "l1", dict(penalty="l1", dual=False)))
_SVK = {}


def svm_fit(X, y, C, **kw):
    """A LinearSVC required to finish before its iteration cap. Seeded: liblinear visits the posts (or,
    with the L1 penalty, the words) in a random order, and unseeded the L1 fits move by a post and a few
    words from run to run, and now and then one runs past the cap."""
    m = LinearSVC(C=C, max_iter=MAX_ITER, random_state=0, **kw).fit(X, y)
    assert m.n_iter_ < MAX_ITER, "liblinear stopped at its iteration cap (C=%g, %s)" % (C, kw)
    return m


def svm_kind_runs():
    """The hinge loss and the L1 penalty on the harness's TF-IDF at each C of SVM_C, run once per
    process; each run also records how many words its five fits give any weight."""
    if not _SVK:
        for _, _, kind, kw in SVM_KINDS:
            for C in SVM_C:
                used = []

                def fp(Ta, ya, i, Tb, C=C, kw=kw, used=used):
                    m = svm_fit(Ta, ya, C, **kw)
                    used.append(int((m.coef_ != 0).any(0).sum()))
                    return m.predict(Tb)
                r = harness_run(fp)
                r["words"] = float(np.mean(used))
                _SVK[kind, C] = r
    return _SVK


def linear_svm():
    section("29. linear_svm -- the third rung: the yardstick, given its own search")
    ytr = data()["ytr"]
    sv, sk = svm_runs(), svm_kind_runs()
    runs = {("sq", "L2") + k: r for k, r in sv.items()}
    runs.update({(("hinge", "L2") if kind == "hinge" else ("sq", "L1")) + ("idf", C): r for (kind, C), r in sk.items()})
    r0 = sv["idf", 0.3]
    met, n = r0["met"], len(r0["y"])
    voc = np.mean([Ta.shape[1] for _, _, Ta, _, _, _ in harness_folds()])
    used = []
    for i, j, Ta, Tb, vn, vm in harness_folds():
        used.append(int((svm_fit(Ta, ytr[i], 0.3).coef_ != 0).any(0).sum()))
    print("the audited view; the harness as before, scored on its %d new threads. LinearSVC: one" % n)
    print("classifier per forum against the rest; C sets how closely it may fit the earlier posts. Every")
    print("fit is required to finish before its iteration cap.")
    print()
    print("settings on the harness, share routed right (weighted: to the later mix of senders)")
    print("  %-14s %-8s %-9s %5s   %-7s %-9s %s" % ("loss", "penalty", "features", "C", "right", "weighted", "words used"))
    name = {"sq": "squared hinge", "hinge": "hinge"}
    for key, r in runs.items():
        loss, pen, step, C = key
        words = "{:>6,.0f}".format(r["words"]) if pen == "L1" else ""
        print(("  %-14s %-8s %-9s %5g   %.4f  %.4f    %s" % (name[loss], pen, "TF-IDF" if step == "idf" else "no IDF", C,
                                                          r["raw"], r["weighted"], words)).rstrip())
    print("  sklearn's defaults (squared hinge, L2, C=1): %.4f" % sv["idf", 1.0]["raw"])
    print("  with the L2 penalty at C=0.3, weight on {:,.0f} of the fold's {:,.0f} words, on average".format(np.mean(used), voc))

    key = max(runs, key=lambda q: runs[q]["raw"])
    pick = runs[key]
    sv_ok, sv_picks = harness_choose(runs)
    old_ok, _ = harness_choose(sv)
    assert key == ("sq", "L2", "idf", 0.3), "the text below names the pick"
    print()
    print("the harness's pick among all %d: squared hinge, L2, TF-IDF, C=0.3: %.4f (weighted %.4f)"
          % (len(runs), pick["raw"], pick["weighted"]))
    print("  chosen on four folds and scored on the fifth: %.4f (the same pick in %d of 5 folds)"
          % (sv_ok.mean(), sum(q == key for q in sv_picks)))
    print("  choosing only C and IDF, as pages 14 and 15 did: %.4f" % old_ok.mean())
    for kind in ("hinge", "l1"):
        c = max(SVM_C, key=lambda C: sk[kind, C]["raw"])
        lbl = "the hinge loss at its best C" if kind == "hinge" else "the L1 penalty at its best C"
        print("  %s (%g) against the pick: %s" % (lbl, c, _pp(_paired(sk[kind, c]["ok"], pick["ok"], check=False))))

    nb = nb_runs()
    nb_ok, _ = harness_choose(nb)
    bar = nb["complement", "len", 0.1]
    assert (bar["ix"] == pick["ix"]).all()
    print()
    print("against the bar (complement naive Bayes), each chosen on four folds and scored on the fifth;")
    print("points (95%)")
    print("  the SVM %.4f, naive Bayes %.4f: %s" % (sv_ok.mean(), nb_ok.mean(), _pp(_paired(sv_ok, nb_ok, check=False))))
    for lbl, sel in (("known senders", met), ("new senders", ~met)):
        print("  the pick against the bar's pick, %s: %s" % (lbl, _pp(_paired(pick["ok"][sel], bar["ok"][sel], check=False))))


# 30. Where the SVM wins: conversations it has already read
# ------------------------------------------------------------------ #
SVM_DIAL = (0.01, 0.03, 0.1, 0.3, 1.0, 3.0, 10.0)
MEM_GROUPS = (("new", "new threads"), ("read", "replies, conversation in the training posts"),
              ("unread", "replies, conversation not in them"))


def _random_folds():
    """Page 11's random 5-fold split of the earlier posts, each fold vectorised on its training part:
    (train, val, TF-IDF train, TF-IDF val, NB features train, NB features val)."""
    d = data()
    A = audited()["A"]
    out = []
    for i, j in KFold(5, shuffle=True, random_state=0).split(A):
        Ai, Aj = [A[k] for k in i], [A[k] for k in j]
        Ta, Tb, _ = tfidf(Ai, Aj)
        cv = CountVectorizer()
        Na, Nb = nb_features(cv.fit_transform(Ai), cv.transform(Aj), "len")
        out.append((i, j, Ta, Tb, Na, Nb))
    return out


def svm_memory():
    section("30. svm_memory -- where the SVM wins: conversations it has already read")
    d = data()
    Ptr, Pte, ytr, yte, new, ntr = d["Ptr"], d["Pte"], d["ytr"], d["yte"], d["new"], d["new_tr"]
    av = audited()
    A, B = av["A"], av["B"]
    th = threads()
    read = np.zeros(len(yte), bool)
    read[th["grp"]["before"]] = True
    later = {"new": new, "read": read, "unread": ~new & ~read, "all": np.ones(len(yte), bool)}
    look = np.array([th["before"][thread_of(Pte[i])].most_common(1)[0][0] == yte[i] for i in th["grp"]["before"]])

    Xa, Xb, _ = tfidf(A, B)
    cv = CountVectorizer()
    Na, Nb = nb_features(cv.fit_transform(A), cv.transform(B), "len")
    bar_l = ComplementNB(alpha=0.1).fit(Na, ytr).predict(Nb) == yte
    svm_l = {C: svm_fit(Xa, ytr, C) for C in SVM_DIAL}
    ok_l = {C: m.predict(Xb) == yte for C, m in svm_l.items()}

    rf = _random_folds()
    thr = np.array(d["threads"])
    rread = np.zeros(len(ytr), bool)
    bar_r = np.zeros(len(ytr), bool)
    ok_r = {C: np.zeros(len(ytr), bool) for C in SVM_DIAL}
    for i, j, Ta, Tb, Ma, Mb in rf:
        seen = set(thr[i])
        rread[j] = [t in seen for t in thr[j]]
        bar_r[j] = ComplementNB(alpha=0.1).fit(Ma, ytr[i]).predict(Mb) == ytr[j]
        for C in SVM_DIAL:
            ok_r[C][j] = svm_fit(Ta, ytr[i], C).predict(Tb) == ytr[j]
    rand = {"new": ntr, "read": ~ntr & rread, "unread": ~ntr & ~rread, "all": np.ones(len(ytr), bool)}

    def rows(groups, ok, bar):
        for k, lbl in (("all", "all posts"),) + MEM_GROUPS:
            m = groups[k]
            print("  %-44s %5d   %.4f   %.4f   %s" % (lbl, m.sum(), ok[m].mean(), bar[m].mean(),
                                                    _pp(_paired(ok[m], bar[m], check=False))))

    print("the SVM (squared hinge, TF-IDF, C=0.3) against the bar (complement naive Bayes), each fitted")
    print("on the earlier posts. A reply's conversation is its subject without 'Re:', as the thread")
    print("lookup reads it.")
    print()
    print("the later posts, all fitted on every earlier post")
    print("  %-44s %5s   %-7s  %-7s  %s" % ("", "posts", "the SVM", "the bar", "SVM - bar, points (95%)"))
    rows(later, ok_l[0.3], bar_l)
    print("  the thread lookup files the %d replies whose conversation is in the training posts: %.4f"
          % (len(look), look.mean()))
    print()
    print("the earlier posts in five random folds (page 11's random split)")
    rows(rand, ok_r[0.3], bar_r)

    print()
    print("C, how closely the SVM may fit the earlier posts: the later posts, fitted on every earlier post")
    row = "  %-7s  %-13s  %-10s  %-8s  %-8s  %-8s  %s"
    print(row % ("C", "earlier posts", "inside own", "new", "replies,", "replies,", "random folds,"))
    print(row % ("", "routed right", "margin", "threads", "read", "not read", "all posts"))
    fit = {}
    for C, m in svm_l.items():
        D = m.decision_function(Xa)
        fit[C] = dict(train=float((D.argmax(1) == ytr).mean()), inside=float((D[np.arange(len(ytr)), ytr] < 1).mean()))
        print(row % ("%g" % C, "%.4f" % fit[C]["train"], "%.3f" % fit[C]["inside"], "%.4f" % ok_l[C][new].mean(),
                     "%.4f" % ok_l[C][read].mean(), "%.4f" % ok_l[C][later["unread"]].mean(), "%.4f" % ok_r[C].mean()))
    print(row % ("the bar", "", "", "%.4f" % bar_l[new].mean(), "%.4f" % bar_l[read].mean(),
                 "%.4f" % bar_l[later["unread"]].mean(), "%.4f" % bar_r.mean()))
    pr = max(SVM_DIAL, key=lambda C: ok_r[C].mean())
    sv = svm_runs()
    ph = max(C_GRID, key=lambda C: sv["idf", C]["raw"])
    pl = max(SVM_DIAL, key=lambda C: ok_l[C][new].mean())
    print("  the random folds pick C=%g; the harness picks C=%g; the later new threads would pick C=%g" % (pr, ph, pl))
    print("  C=%g against C=%g on the later new threads: %s" % (pr, ph, _pp(_paired(ok_l[pr][new], ok_l[ph][new], check=False))))

    def stats(groups, ok, bar):
        n = {k: int(m.sum()) for k, m in groups.items()}
        return {"n": n, "bar": {k: round(float(bar[m].mean()), 4) for k, m in groups.items()},
                "svm": [{"C": C, **{k: round(float(ok[C][m].mean()), 4) for k, m in groups.items()}} for C in SVM_DIAL]}
    out = {"C": list(SVM_DIAL), "pick": {"harness": ph, "random": pr, "later": pl},
           "later": stats(later, ok_l, bar_l), "random": stats(rand, ok_r, bar_r),
           "lookup": round(float(look.mean()), 4),
           "fit": [{"C": C, "train": round(fit[C]["train"], 4), "inside": round(fit[C]["inside"], 4)} for C in SVM_DIAL]}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "svm.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


# 31. Kernels and trees: boundaries that bend
# ------------------------------------------------------------------ #
KNN_K = (1, 3, 5, 10, 20, 30, 50, 100)
KNN_VOTES = ("similarity", "one each")
RBF_GAMMA = (0.03, 0.1, 0.3, 1.0, 3.0, 10.0)
RBF_C = (1.0, 3.0, 10.0, 30.0, 100.0)
STRAIGHT_C = (0.3, 1.0, 3.0, 10.0)  # the kernel SVM's own solver with a straight line, the control
NL_CACHE = CACHE / "nonlinear"
_NL = {}


def _cached(tag, fn, *arrays):
    """fn() -> dict of arrays, cached under NL_CACHE, keyed by the tag, the library versions and
    every input array: the forests and the boosted trees take most of an hour from cold."""
    f = _cache_file(tag, *arrays)
    if not f.exists():
        NL_CACHE.mkdir(parents=True, exist_ok=True)
        np.savez(f, **fn())
    z = np.load(f)
    return {k: z[k] for k in z.files}


def _cache_file(tag, *arrays):
    """Where _cached keeps fn()'s result for these inputs."""
    h = hashlib.sha256(("%s %s %s" % (tag, sklearn.__version__, lgb.__version__)).encode())
    for a in arrays:
        for p in ((a.data, a.indices, a.indptr) if sparse.issparse(a) else (np.asarray(a),)):
            h.update(np.ascontiguousarray(p).tobytes())
    return NL_CACHE / (h.hexdigest()[:24] + ".npz")


def _sqdist(Ta, Tb, Kab):
    """Squared distances between the rows of Tb and of Ta, from their dot products. TF-IDF rows have
    length one, except a post with no words, whose row is all zeros."""
    na = np.asarray(Ta.multiply(Ta).sum(1)).ravel()
    nb = np.asarray(Tb.multiply(Tb).sum(1)).ravel()
    return np.maximum(nb[:, None] + na[None, :] - 2 * Kab, 0)


def knn_runs():
    """Nearest neighbours on the harness: each new thread goes to the forum with the most votes among
    its k most similar earlier posts (cosine on TF-IDF), each vote its similarity or one each."""
    if "knn" not in _NL:
        per = []
        for i, j, Ta, Tb, vn, vm in harness_folds():
            S = (Tb @ Ta.T).toarray()
            top = np.argsort(-S, axis=1, kind="stable")[:, :max(KNN_K)]
            per.append((top, np.take_along_axis(S, top, 1)))
        runs = {}
        for vote in KNN_VOTES:
            for k in KNN_K:
                folds = iter(per)

                def fp(Ta, ya, i, Tb, k=k, vote=vote, folds=folds):
                    top, s = next(folds)
                    V = np.zeros((len(top), 20))
                    w = s[:, :k] if vote == "similarity" else np.ones((len(top), k))
                    np.add.at(V, (np.arange(len(top))[:, None], ya[top[:, :k]]), w)
                    return V.argmax(1)
                runs[vote, k] = harness_run(fp)
        _NL["knn"] = runs
    return _NL["knn"]


def kernel_runs():
    """The kernel SVM (scikit-learn's SVC: hinge loss, one classifier per pair of forums) on the
    harness, from precomputed kernels: the RBF kernel at each gamma and C, and the straight line
    (the linear kernel) at each C of STRAIGHT_C. Each run also records the share of the training
    posts that are support vectors; _NL["reach"] holds each harness new thread's squared distance
    to its nearest training post and to its median one."""
    if "kernel" not in _NL:
        ytr = data()["ytr"]
        keys = [("straight", C) for C in STRAIGHT_C] + [(g, C) for g in RBF_GAMMA for C in RBF_C]
        name = lambda k: "%s_%g" % k if k[0] == "straight" else "rbf_%g_%g" % k
        got = []
        for i, j, Ta, Tb, vn, vm in harness_folds():
            def fn(Ta=Ta, Tb=Tb, ya=ytr[i]):
                out = {}
                Kaa, Kba = (Ta @ Ta.T).toarray(), (Tb @ Ta.T).toarray()
                for C in STRAIGHT_C:
                    m = SVC(kernel="precomputed", C=C).fit(Kaa, ya)
                    out["p_" + name(("straight", C))], out["s_" + name(("straight", C))] = m.predict(Kba), m.n_support_.sum() / len(ya)
                Daa, Dba = _sqdist(Ta, Ta, Kaa), _sqdist(Ta, Tb, Kba)
                del Kaa, Kba
                out["near"], out["mid"] = Dba.min(1), np.median(Dba, 1)
                for g in RBF_GAMMA:
                    Ea, Eb = np.exp(-g * Daa), np.exp(-g * Dba)
                    for C in RBF_C:
                        m = SVC(kernel="precomputed", C=C).fit(Ea, ya)
                        out["p_" + name((g, C))], out["s_" + name((g, C))] = m.predict(Eb), m.n_support_.sum() / len(ya)
                    del Ea, Eb
                return out
            got.append((_cached("kernels %s %s %s" % (STRAIGHT_C, RBF_GAMMA, RBF_C), fn, Ta, ytr[i], Tb), vn))
        runs = {}
        for k in keys:
            it = iter(got)
            runs[k] = harness_run(lambda Ta, ya, i, Tb, it=it, k=k: next(it)[0]["p_" + name(k)])
            runs[k]["sv"] = float(np.mean([g["s_" + name(k)] for g, _ in got]))
        _NL["kernel"] = runs
        _NL["reach"] = {q: np.concatenate([g[q][vn] for g, vn in got]) for q in ("near", "mid")}
    return _NL["kernel"]


RF_FEATURES = (1, 3, 10, 30, 100, "sqrt")  # words each split may choose from, down to the end of the dial;
#                                          the square root of ~91,000, the default, is ~300
RF_COUNTS = (100, 250, 500, 1000, 2000)  # the forest's vote after this many trees
RF_CHUNK = 250


def forest_chunks(Xa, ya, mf, n):
    """A random forest of n trees, grown RF_CHUNK at a time (scikit-learn forests seeded 0, 1, 2, ...)
    and yielded one tree at a time: a whole forest of trees this deep would not fit in memory.
    scikit-learn draws every tree's seed up front, so the trees are the same on any number of cores."""
    for c in range(-(-n // RF_CHUNK)):
        yield from RandomForestClassifier(n_estimators=RF_CHUNK, max_features=mf, n_jobs=-1,
                                          random_state=c).fit(Xa, ya).estimators_


def forest_votes(Xa, ya, Xb, mf):
    """Each forum's share of the forest's vote for the rows of Xb after each count of RF_COUNTS trees
    (V100, V250, ...), and how many words the trees so far ask about (W100, ...)."""
    def fn():
        V, used, out = np.zeros((Xb.shape[0], 20)), set(), {}
        Xa32, Xb32 = Xa.astype(np.float32).tocsc(), Xb.astype(np.float32).tocsr()  # converted once, not per tree
        for k, e in enumerate(forest_chunks(Xa32, ya, mf, max(RF_COUNTS)), 1):
            V += e.predict_proba(Xb32)
            f = e.tree_.feature
            used.update(f[f >= 0].tolist())
            if k in RF_COUNTS:
                out["V%d" % k], out["W%d" % k] = V / k, len(used)
        return out
    return _cached("forest %s %d %d" % (mf, max(RF_COUNTS), RF_CHUNK), fn, Xa, ya, Xb)


def forest_runs():
    """The random forest on the harness at each max_features and tree count; each run records the
    words its trees ask about, averaged over the folds."""
    if "forest" not in _NL:
        runs = {}
        for mf in RF_FEATURES:
            got = []

            def fp(Ta, ya, i, Tb, mf=mf, got=got):
                got.append(forest_votes(Ta, ya, Tb, mf))
                return got[-1]["V%d" % max(RF_COUNTS)].argmax(1)
            harness_run(fp)
            for k in RF_COUNTS:
                it = iter(got)
                runs[mf, k] = harness_run(lambda Ta, ya, i, Tb, it=it, k=k: next(it)["V%d" % k].argmax(1))
                runs[mf, k]["words"] = float(np.mean([g["W%d" % k] for g in got]))
        _NL["forest"] = runs
    return _NL["forest"]


# LightGBM's defaults; then a third of the words offered to each tree and leaves allowed to hold as few
# as five posts (at the default 20, a word must be in 20 posts before a tree can use it), at two step sizes
GB_SETTINGS = (dict(learning_rate=0.1, num_leaves=31, min_child_samples=20, colsample_bytree=1.0),
               dict(learning_rate=0.05, num_leaves=31, min_child_samples=5, colsample_bytree=0.3),
               dict(learning_rate=0.02, num_leaves=31, min_child_samples=5, colsample_bytree=0.3))
GB_ROUNDS = (25, 50, 100, 200)  # every setting probed peaked by round 100 and fell after


def boosted_fit(Xa, ya, s):
    """Gradient-boosted trees (LightGBM: one tree per forum per round), seeded and deterministic."""
    return lgb.LGBMClassifier(random_state=0, n_jobs=-1, verbose=-1, deterministic=True, force_col_wise=True,
                              n_estimators=max(GB_ROUNDS), **s).fit(Xa.astype(np.float32), ya)


def boosted_votes(Xa, ya, Xb, s):
    """Each forum's probability for the rows of Xb after each count of GB_ROUNDS rounds (P25, ...), and
    how many words the trees so far split on (W25, ...)."""
    def fn():
        b, out = boosted_fit(Xa, ya, s).booster_, {}
        for n in GB_ROUNDS:
            out["P%d" % n] = b.predict(Xb.astype(np.float32), num_iteration=n)
            out["W%d" % n] = int((b.feature_importance("split", iteration=n) > 0).sum())
        return out
    return _cached("boosted %s %d" % (sorted(s.items()), max(GB_ROUNDS)), fn, Xa, ya, Xb)


def tree_questions(trees, X):
    """What the trees ask each row of X on its way to a leaf. Per row: the questions per tree, the share
    of them about a word the row contains, and the share of the row's own words some tree asks about."""
    X = X.astype(np.float32).tocsr()
    own = (X > 0).astype(np.int32)
    q, qo, asked, t = np.zeros(X.shape[0]), np.zeros(X.shape[0]), sparse.csr_matrix(own.shape, dtype=np.int32), 0
    for e in trees:
        f = e.tree_.feature
        inner = np.where(f >= 0)[0]
        ask = sparse.csr_matrix((np.ones(len(inner), np.int32), (inner, f[inner])), shape=(len(f), X.shape[1]))
        Q = (e.decision_path(X) @ ask).tocsr()  # row x word: how often its path asks about the word
        Qo = Q.multiply(own).tocsr()
        q += np.asarray(Q.sum(1)).ravel()
        qo += np.asarray(Qo.sum(1)).ravel()
        asked = asked + (Qo > 0).astype(np.int32)
        t += 1
    n = np.asarray(own.sum(1)).ravel()
    return dict(per_tree=q / t, own_share=qo / np.maximum(q, 1), covered=np.asarray((asked > 0).sum(1)).ravel() / np.maximum(n, 1),
                words=n)


def boosted_runs():
    """Boosted trees on the harness at each setting of GB_SETTINGS and round count."""
    if "boosted" not in _NL:
        runs = {}
        for n, s in enumerate(GB_SETTINGS):
            got = []

            def fp(Ta, ya, i, Tb, s=s, got=got):
                got.append(boosted_votes(Ta, ya, Tb, s))
                return got[-1]["P%d" % max(GB_ROUNDS)].argmax(1)
            harness_run(fp)
            for r in GB_ROUNDS:
                it = iter(got)
                runs[n, r] = harness_run(lambda Ta, ya, i, Tb, it=it, r=r: next(it)["P%d" % r].argmax(1))
                runs[n, r]["words"] = float(np.mean([g["W%d" % r] for g in got]))
        _NL["boosted"] = runs
    return _NL["boosted"]


GB_LABEL = ("LightGBM's defaults: step 0.1, leaves of 20+ posts",
            "step 0.05, leaves of 5+ posts, a third of the words",
            "step 0.02, leaves of 5+ posts, a third of the words")
H1_TREES = 0.03  # H1: the tree models trail the linear SVM by more than three points


def _mf(mf):
    return "%d (sqrt)" % round(np.sqrt(np.mean([Ta.shape[1] for _, _, Ta, _, _, _ in harness_folds()]))) if mf == "sqrt" else str(mf)


def kernels_trees():
    section("31. kernels_trees -- the fourth rung: boundaries that bend")
    sv, nb = svm_runs(), nb_runs()
    sv_ok, _ = harness_choose(sv)
    nb_ok, _ = harness_choose(nb)
    kn, kr, fo, gb = knn_runs(), kernel_runs(), forest_runs(), boosted_runs()
    n = len(sv["idf", 0.3]["y"])
    print("the audited view; the harness as before, scored on its %d new threads. Every model reads the" % n)
    print("harness's TF-IDF. Each family searches its own settings on the harness, and the choice is priced")
    print("fold by fold, as the other rungs' were. Share routed right on the harness:")
    print()
    print("nearest neighbours: the forum with the most votes among the k earlier posts most similar to the")
    print("post (cosine), each vote worth its similarity or one each")
    print("  %-10s" % "k" + "".join("%8d" % k for k in KNN_K))
    for v in KNN_VOTES:
        print("  %-10s" % v + "".join("%8.4f" % kn[v, k]["raw"] for k in KNN_K))
    print()
    print("the kernel SVM (scikit-learn's SVC: hinge loss, one classifier per pair of forums), RBF kernel")
    print("exp(-gamma |a - b|^2), by gamma (rows) and C (columns)")
    print("  %-10s" % "gamma" + "".join("%8g" % C for C in RBF_C))
    for g in RBF_GAMMA:
        print("  %-10g" % g + "".join("%8.4f" % kr[g, C]["raw"] for C in RBF_C))
    print("  a straight line in the same solver (the linear kernel), C = %s: %s" % (
        ", ".join("%g" % C for C in STRAIGHT_C), "  ".join("%.4f" % kr["straight", C]["raw"] for C in STRAIGHT_C)))
    print()
    print("a random forest, by the words each split may choose from (rows) and the trees (columns), with")
    print("the words its %d trees ask about between them" % max(RF_COUNTS))
    print("  %-10s" % "words" + "".join("%8d" % k for k in RF_COUNTS) + "   words asked")
    for mf in RF_FEATURES:
        print("  %-10s" % _mf(mf) + "".join("%8.4f" % fo[mf, k]["raw"] for k in RF_COUNTS)
              + "   {:>11,.0f}".format(fo[mf, max(RF_COUNTS)]["words"]))
    print()
    print("boosted trees (LightGBM: a tree per forum per round), by setting (rows) and rounds (columns), with")
    print("the words their trees split on after %d rounds" % max(GB_ROUNDS))
    print("  %-52s" % "" + "".join("%8d" % r for r in GB_ROUNDS) + "   words used")
    for s, lbl in enumerate(GB_LABEL):
        print("  %-52s" % lbl + "".join("%8.4f" % gb[s, r]["raw"] for r in GB_ROUNDS)
              + "   {:>10,.0f}".format(gb[s, max(GB_ROUNDS)]["words"]))

    fam = (("the kernel SVM (RBF)", {k: r for k, r in kr.items() if k[0] != "straight"}, False),
           ("nearest neighbours", kn, False), ("a random forest", fo, True), ("boosted trees", gb, True))
    print()
    print("each family's search priced fold by fold (chosen on four folds, scored on the fifth); points (95%)")
    print("  %-24s %-8s %-27s %s" % ("", "chosen", "against the linear SVM", "against the bar"))
    print("  %-24s %.4f" % ("the bar (naive Bayes)", nb_ok.mean()))
    print("  %-24s %.4f   %-27s %s" % ("the linear SVM", sv_ok.mean(), "", _pp(_paired(sv_ok, nb_ok, check=False))))
    verdicts = []
    for lbl, runs, tree in fam:
        ok, picks = harness_choose(runs)
        p = _paired(ok, sv_ok, check=False)
        print("  %-24s %.4f   %-27s %s" % (lbl, ok.mean(), _pp(p), _pp(_paired(ok, nb_ok, check=False))))
        line = -H1_TREES if tree else 0.0
        verdicts.append("wrong" if p["lo"] > line else "held" if p["hi"] < line else "not settled")
    st = {k: r for k, r in kr.items() if k[0] == "straight"}
    st_ok, _ = harness_choose(st)
    rbf_ok, _ = harness_choose(fam[0][1])
    print("  the kernel SVM against a straight line in its own solver (chosen the same way, %.4f): %s"
          % (st_ok.mean(), _pp(_paired(rbf_ok, st_ok, check=False))))
    print()
    print("H1: each family below the linear SVM, the tree models by more than %d points:" % round(100 * H1_TREES))
    print("  " + "; ".join("%s %s" % (lbl, v) for (lbl, _, _), v in zip(fam, verdicts)))
    _NL["h1"] = verdicts

    d = data()
    ytr, yb = d["ytr"], d["yte"][d["new"]]
    av = audited()
    Xa, Xb, _ = tfidf(av["A"], av["B"])
    Xb = Xb[np.where(d["new"])[0]]
    bar = ComplementNB(alpha=0.1)
    cv = CountVectorizer()
    Na, Nb = nb_features(cv.fit_transform(av["A"]), cv.transform(av["B"]), "len")
    bar_ok = bar.fit(Na, ytr).predict(Nb)[d["new"]] == yb
    lin_ok = svm_fit(Xa, ytr, 0.3).predict(Xb) == yb
    later = []
    for lbl, runs, _ in fam:
        k = max(runs, key=lambda q: runs[q]["raw"])
        if lbl.startswith("the kernel"):
            pred = later_kernel(Xa, ytr, Xb, *k)
        elif lbl == "nearest neighbours":
            S = (Xb @ Xa.T).toarray()
            top = np.argsort(-S, axis=1, kind="stable")[:, :k[1]]
            V = np.zeros((len(top), 20))
            np.add.at(V, (np.arange(len(top))[:, None], ytr[top]), np.take_along_axis(S, top, 1) if k[0] == "similarity" else 1.0)
            pred = V.argmax(1)
        elif lbl == "a random forest":
            pred = forest_votes(Xa, ytr, Xb, k[0])["V%d" % k[1]].argmax(1)
        else:
            pred = boosted_votes(Xa, ytr, Xb, GB_SETTINGS[k[0]])["P%d" % k[1]].argmax(1)
        later.append((lbl, k, pred == yb))
    print()
    print("the later new threads (report only): each pick fitted on all %d earlier posts, scored on the %d"
          % (Xa.shape[0], len(yb)))
    print("  the linear SVM %.4f, the bar %.4f" % (lin_ok.mean(), bar_ok.mean()))
    for lbl, k, ok in later:
        print("  %-24s %.4f   against the linear SVM %s" % (lbl, ok.mean(), _pp(_paired(ok, lin_ok, check=False))))


REACH_BINS = 28  # the lab's histograms of distance, over 0 to sqrt(2)


def kernel_reach():
    section("32. kernel_reach -- how far apart the posts are, and what gamma does about it")
    kr, kn, sv, nb = kernel_runs(), knn_runs(), svm_runs(), nb_runs()
    re = _NL["reach"]
    lin = sv["idf", 0.3]
    near, mid = re["near"], re["mid"]
    cos = lambda d2: 1 - d2 / 2
    print("each harness new thread's squared distance to the training posts of its fold (TF-IDF rows have")
    print("length one: 0 is the same words in the same proportions, 2 is no word in common)")
    print("  to its nearest training post: median %.3f (cosine %.3f); 10th percentile %.3f, 90th %.3f"
          % (np.median(near), cos(np.median(near)), np.percentile(near, 10), np.percentile(near, 90)))
    print("  to a typical training post (its median one): median %.3f (cosine %.3f)" % (np.median(mid), cos(np.median(mid))))
    print("  as distances: the nearest %.2f, a typical one %.2f, the farthest possible %.2f"
          % (np.sqrt(np.median(near)), np.sqrt(np.median(mid)), np.sqrt(2)))
    print()
    print("the RBF kernel exp(-gamma d^2) by gamma: the distance at which it halves, sqrt(ln 2 / gamma); how")
    print("many times a typical post's weight the nearest post gets (median over new threads); and at")
    print("gamma's best C on the harness, the share of training posts that are support vectors, the share")
    print("routed right, and the share routed as the linear SVM routes them")
    print("  gamma   halves at  nearest counts  best C  support vectors  right    as the linear SVM")
    rows = []
    for g in RBF_GAMMA:
        C = max(RBF_C, key=lambda c: kr[g, c]["raw"])
        r = kr[g, C]
        ratio = float(np.median(np.exp(g * (mid - near))))
        alike = float((r["pred"] == lin["pred"]).mean())
        rows.append(dict(gamma=g, half=round(float(np.sqrt(np.log(2) / g)), 3), ratio=round(ratio, 3), C=C,
                         sv=round(r["sv"], 4), right=round(r["raw"], 4), alike=round(alike, 4)))
        print("  %-7g %-10.2f %-15s %-7g %-16.3f %.4f   %.3f" % (g, rows[-1]["half"], "%.2fx" % ratio, C, r["sv"], r["raw"], alike))
    st = max(STRAIGHT_C, key=lambda c: kr["straight", c]["raw"])
    print("  a straight line in the same solver (C=%g): %.4f, %.3f as the linear SVM, support vectors %.3f"
          % (st, kr["straight", st]["raw"], (kr["straight", st]["pred"] == lin["pred"]).mean(), kr["straight", st]["sv"]))
    nn = max(kn, key=lambda q: kn[q]["raw"])
    print("  nearest neighbours: the single nearest post %.4f; the best k (%d, votes by %s) %.4f"
          % (kn["similarity", 1]["raw"], nn[1], nn[0], kn[nn]["raw"]))

    edges = np.linspace(0, np.sqrt(2), REACH_BINS + 1)
    hist = lambda d2: [round(float(v), 4) for v in np.histogram(np.sqrt(d2), edges)[0] / len(d2)]
    out = {"rows": rows, "lin": round(lin["raw"], 4), "bar": round(nb["complement", "len", 0.1]["raw"], 4),
           "straight": {"C": st, "right": round(kr["straight", st]["raw"], 4)},
           "nn1": round(kn["similarity", 1]["raw"], 4), "knn": {"k": nn[1], "right": round(kn[nn]["raw"], 4)},
           "reach": {"near": round(float(np.sqrt(np.median(near))), 4), "mid": round(float(np.sqrt(np.median(mid))), 4),
                     "edges": [round(float(e), 4) for e in edges], "nearHist": hist(near), "midHist": hist(mid)}}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "kernels.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


TREE_SPECIMEN = 3041  # a later new thread in rec.motorcycles, chosen by hand-reading candidates (no private names)
TREE_BANDS = (0, 40, 160)


def forest_questions(Xa, ya, Xb, mf, k):
    """The forest of k trees fitted on (Xa, ya): what its trees ask each row of Xb (tree_questions), the
    depth and leaves of each tree, and every row's path through the first tree (node ids)."""
    def fn():
        first, depth, leaves = [], [], []

        def stream():  # one tree at a time: a forest of these trees would not fit in memory
            for e in itertools.islice(forest_chunks(Xa.astype(np.float32).tocsc(), ya, mf, k), k):
                first[:] = first or [e]
                depth.append(e.get_depth())
                leaves.append(e.get_n_leaves())
                yield e
        out = {"t_" + q: v for q, v in tree_questions(stream(), Xb).items()}
        out["depth"], out["leaves"] = np.array(depth), np.array(leaves)
        e = first[0]
        P = e.decision_path(Xb.astype(np.float32)).tocsr()
        out["path_ptr"], out["path_node"] = P.indptr, P.indices
        out["feature"], out["threshold"] = e.tree_.feature, e.tree_.threshold
        out["leaf_forum"] = e.tree_.value[:, 0, :].argmax(1)
        return out
    return _cached("forest questions %s %d %d" % (mf, k, RF_CHUNK), fn, Xa, ya, Xb)


def tree_questions_section():
    section("33. tree_questions -- what a tree asks a post")
    d = data()
    fo = forest_runs()
    mf, k = max(fo, key=lambda q: fo[q]["raw"])
    av = audited()
    Xa, Xb, v = tfidf(av["A"], av["B"])
    nw = np.where(d["new"])[0]
    Xn, yb, ytr = Xb[nw], d["yte"][d["new"]], d["ytr"]
    names, words = d["names"], v.get_feature_names_out()
    fq = forest_questions(Xa, ytr, Xn, mf, k)
    fpred = forest_votes(Xa, ytr, Xn, mf)["V%d" % k]
    lin = svm_fit(Xa, ytr, 0.3).predict(Xn)
    print("the harness's forest (%s word%s per split, %d trees) fitted on all %d earlier posts, routing the"
          % (_mf(mf), "" if mf == 1 else "s", k, Xa.shape[0]))
    print("%d later new threads (each tree grown on a bootstrap draw of the posts)" % len(yb))
    print("  each tree: %s leaves, and a longest path of %d questions (medians over the trees; the longest"
          % ("{:,.0f}".format(np.median(fq["leaves"])), np.median(fq["depth"])))
    print("  path runs from %d to %d)" % (fq["depth"].min(), fq["depth"].max()))
    print("  a new thread's way to its leaf: median %.1f questions per tree; %.1f%% of them about a word the post"
          % (np.median(fq["t_per_tree"]), 100 * np.median(fq["t_own_share"])))
    print("  contains (median); the post's own words: median %d; asked about by at least one of the %d trees: %.1f%%"
          % (np.median(fq["t_words"]), k, 100 * np.median(fq["t_covered"])))
    print("  questions about the post's words per tree: median %.1f"
          % np.median(fq["t_per_tree"] * fq["t_own_share"]))
    print()
    print("share routed right by the post's length in words (the router's view)")
    ok_f, ok_l = fpred.argmax(1) == yb, lin == yb
    n = fq["t_words"]
    for lo, hi in zip(TREE_BANDS, TREE_BANDS[1:] + (None,)):
        s = (n >= lo) & (n < hi) if hi else n >= lo
        lbl = "%d to %d" % (lo, hi - 1) if hi else "%d or more" % lo
        print("  %-12s %5d posts   the forest %.3f   the linear SVM %.3f   %s"
              % (lbl, s.sum(), ok_f[s].mean(), ok_l[s].mean(), _pp(_paired(ok_f[s], ok_l[s], check=False))))
    if TREE_SPECIMEN is None:
        print("\ncandidates (later index, words, forest right, svm right, subject):")
        rng = np.random.default_rng(17)
        for r in rng.choice(np.where((n >= 30) & (n <= 80))[0], 25, replace=False):
            print("  %5d %3d %d %d %s" % (nw[r], n[r], ok_f[r], ok_l[r], d["Pte"][nw[r]]["subject"][:60]))
        return

    r = int(np.where(nw == TREE_SPECIMEN)[0][0])
    nodes = fq["path_node"][fq["path_ptr"][r]:fq["path_ptr"][r + 1]]
    x = Xn[r].toarray().ravel()
    path = [{"w": str(words[fq["feature"][q]]), "has": bool(x[fq["feature"][q]] > 0),
             "yes": bool(x[fq["feature"][q]] > fq["threshold"][q])} for q in nodes[:-1]]
    vote = fpred[r]
    top = np.argsort(-vote, kind="stable")[:3]
    own = [str(words[f]) for f in np.where(x > 0)[0]]
    asked = sorted({q["w"] for q in path if q["has"]})
    print()
    print("one later new thread (%d, %s, %d words) on its way through the first tree: %d questions, %d about"
          % (TREE_SPECIMEN, names[yb[r]], n[r], len(path), len(asked)))
    print("  a word it contains (%s); its leaf: %s" % (", ".join(asked), names[fq["leaf_forum"][nodes[-1]]]))
    print("  the forest's %d trees: %s; the linear SVM: %s"
          % (k, ", ".join("%s %.1f%%" % (names[f], 100 * vote[f]) for f in top), names[lin[r]]))
    out = {"forest": {"words": _mf(mf), "trees": k, "depth": int(np.median(fq["depth"])),
                      "leaves": int(np.median(fq["leaves"]))},
           "all": {"perTree": round(float(np.median(fq["t_per_tree"])), 1),
                   "ownShare": round(float(np.median(fq["t_own_share"])), 4),
                   "covered": round(float(np.median(fq["t_covered"])), 4), "words": int(np.median(n))},
           "specimen": {"id": TREE_SPECIMEN, "forum": names[yb[r]], "subject": d["Pte"][TREE_SPECIMEN]["subject"],
                        "words": int(n[r]), "own": own, "path": path, "leaf": names[fq["leaf_forum"][nodes[-1]]],
                        "votes": [{"f": names[f], "share": round(float(vote[f]), 4)} for f in top],
                        "svm": names[lin[r]]}}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "trees.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")


def later_kernel(Xa, ya, Xb, g, C):
    """The RBF-kernel SVM fitted on every earlier post, routing the rows of Xb. The kernel on 11,314 posts
    is built in place: one array of a gigabyte, not three."""
    def fn():
        K = (Xa @ Xa.T).toarray()
        na = K.diagonal().copy()
        K *= -2
        K += na[:, None]
        K += na[None, :]
        np.maximum(K, 0, out=K)
        K *= -g
        np.exp(K, out=K)
        m = SVC(kernel="precomputed", C=C).fit(K, ya)
        del K
        return {"pred": m.predict(np.exp(-g * _sqdist(Xa, Xb, (Xb @ Xa.T).toarray())))}
    return _cached("later kernel %g %g" % (g, C), fn, Xa, ya, Xb)["pred"]


# ------------------------------------------------------------------ #
# 34. Better features: what else the router could read
# ------------------------------------------------------------------ #
# Act 5 so far changed the model and kept the words. Here the models stay and what they read changes:
# four changes to the text, each tried on the bar's model (complement naive Bayes on log counts, each
# post's length normalised) and on the linear SVM (TF-IDF), each with its own small search on the
# harness, the choice priced fold by fold. The fifth is not text: the sender's history is a second
# term added to a model's scores, so a post from a sender the router has not met routes as before.
BF_SETS = (("words", "the words, as before"),
           ("pairs", "+ pairs of neighbouring words"),
           ("pieces", "+ pieces of words, 2 to 5 characters"),
           ("subject", "+ the subject counted again"),
           ("quotes", "+ the quoted text"),
           ("both", "+ pairs and pieces"),
           ("all", "+ all four"))
BF_ALPHA = (0.001, 0.003, 0.01, 0.03, 0.1, 0.3)
BF_C = (0.3, 1.0, 3.0)  # the SVM's first grid, extended a step at a time while its best C sits at an end
BF_C_STEPS = (0.03, 0.1, 0.3, 1.0, 3.0, 10.0, 30.0)
BF_JOBS = 5  # liblinear runs on one core: the five folds are fitted side by side
HIST_BETA = (0.01, 0.03, 0.1, 0.3, 1.0, 3.0, 10.0)  # posts added to every forum before a sender's shares are taken
HIST_W = (0.01, 0.03, 0.1, 0.3, 1.0, 3.0, 10.0)  # the history's weight against the model's scores
BF_MODELS = (("nb", "the bar's model (complement naive Bayes)"), ("svm", "the linear SVM"))
PIECES = dict(analyzer="char_wb", ngram_range=(2, 5), min_df=2)  # inside word boundaries; seen in 2+ posts
_BF = {}


def quoted(p):
    """The lines of a post that quote someone else, without the lines that name who is quoted."""
    return "\n".join(ln for ln in p["quotes"] if not ATTRIBUTION_ONLY.search(ln))


def feature_texts(kind, P, V):
    """What one feature set reads of each post: the router's view V, the quoted text added for
    'quotes', and the subject alone as a second text for 'subject'."""
    if kind in ("quotes", "all"):
        V = [v + "\n" + quoted(p) for v, p in zip(V, P)]
    return V, [p["subject"] for p in P] if kind in ("subject", "all") else None


def feature_blocks(kind, A, B, SA=None, SB=None):
    """Counts of one feature set as blocks, each fitted on A and applied to B. Each block is scaled to
    length one on its own before they are put side by side, so the many pieces of a post do not drown
    its words. The subject counted again is one block with a vocabulary of its own for the subject."""
    if kind in ("subject", "all"):
        cv, cs = CountVectorizer(ngram_range=(1, 2) if kind == "all" else (1, 1)), CountVectorizer()
        out = [(sparse.hstack([cv.fit_transform(A), cs.fit_transform(SA)]).tocsr(),
                sparse.hstack([cv.transform(B), cs.transform(SB)]).tocsr())]
        if kind == "all":
            cp = CountVectorizer(**PIECES)
            out.append((cp.fit_transform(A), cp.transform(B)))
        return out
    specs = {"pairs": [dict(ngram_range=(1, 2))], "pieces": [{}, PIECES], "letters": [dict(token_pattern=ONE_LETTER)],
             "both": [dict(ngram_range=(1, 2)), PIECES]}.get(kind, [{}])
    out = []
    for kw in specs:
        cv = CountVectorizer(**kw)
        out.append((cv.fit_transform(A), cv.transform(B)))
    return out


def block_features(blocks, step):
    """Each block through one of nb_features' steps ('len' for the bar's model, 'idf' for the SVM),
    then side by side, the row scaled back to length one."""
    X = [nb_features(Ca, Cb, step) for Ca, Cb in blocks]
    if len(X) == 1:
        return X[0]
    r = 1 / np.sqrt(len(X))
    return sparse.hstack([a for a, _ in X]).tocsr() * r, sparse.hstack([b for _, b in X]).tocsr() * r


def _text_key(*parts):
    h = hashlib.sha256()
    for part in parts:
        for t in part:
            h.update(t.encode("utf-8", "surrogatepass") + bytes(1))
        h.update(bytes([1]))
    return np.frombuffer(h.digest(), np.uint8)


def _bf_fit(kind, A, ya, B, SA=None, SB=None, models=("nb", "svm"), alphas=BF_ALPHA, Cs=BF_C):
    """Each setting's scores for the posts B: the bar's model at every alpha (its weights summed over
    the post), the SVM at every C (its decision values)."""
    blocks = feature_blocks(kind, A, B, SA, SB)
    out = {"cols": np.array(sum(a.shape[1] for a, _ in blocks))}
    if "nb" in models:
        Na, Nb = block_features(blocks, "len")
        for a in alphas:
            out["nb_%g" % a] = np.asarray(Nb @ ComplementNB(alpha=a).fit(Na, ya).feature_log_prob_.T)
    if "svm" in models:
        Xa, Xb = block_features(blocks, "idf")
        for C in Cs:
            out["svm_%g" % C] = svm_fit(Xa, ya, C).decision_function(Xb)
    return out


def _cached_many(jobs):
    """_cached for several (tag, arrays, fn, args) at once: the missing ones are computed side by side,
    one process each."""
    from joblib import Parallel, delayed
    files = [_cache_file(tag, *arrays) for tag, arrays, fn, args in jobs]
    todo = [(f, fn, args) for f, (tag, arrays, fn, args) in zip(files, jobs) if not f.exists()]
    if todo:
        NL_CACHE.mkdir(parents=True, exist_ok=True)
        got = Parallel(n_jobs=min(BF_JOBS, len(todo)))(delayed(fn)(*args) for f, fn, args in todo)
        for (f, _, _), r in zip(todo, got):
            np.savez(f, **r)
    out = []
    for f in files:
        z = np.load(f)
        out.append({k: z[k] for k in z.files})
    return out


def _fold_jobs(kind, models, alphas, Cs):
    """One _bf_fit per harness fold, on the fold's training posts, scoring its new threads."""
    d, av = data(), audited()
    T, S = feature_texts(kind, d["Ptr"], av["A"])
    jobs = []
    for i, j, Ta, Tb, vn, vm in harness_folds():
        jn = j[vn]
        A, B = [T[q] for q in i], [T[q] for q in jn]
        SA, SB = (None, None) if S is None else ([S[q] for q in i], [S[q] for q in jn])
        jobs.append(("features %s %s %s %s" % (kind, models, alphas, Cs),
                     (_text_key(A, B, SA or [], SB or []), d["ytr"][i]),
                     functools.partial(_bf_fit, models=models, alphas=alphas, Cs=Cs),
                     (kind, A, d["ytr"][i], B, SA, SB)))
    return jobs


def feature_scores(kind):
    """Per harness fold, each setting's scores for the fold's new threads; cached by the fold's texts.
    The SVM's grid of C grows a step past either end while the best C on the harness sits there."""
    if ("scores", kind) not in _BF:
        got = _cached_many(_fold_jobs(kind, ("nb", "svm"), BF_ALPHA, BF_C))
        y = [data()["ytr"][j[vn]] for i, j, Ta, Tb, vn, vm in harness_folds()]

        def right(key):
            return sum(int((g[key].argmax(1) == yy).sum()) for g, yy in zip(got, y))
        Cs = list(BF_C)
        while True:
            best = max(Cs, key=lambda C: (right("svm_%g" % C), -C))
            at = BF_C_STEPS.index(best)
            nxt = (BF_C_STEPS[at - 1] if best == Cs[0] and at > 0 else
                   BF_C_STEPS[at + 1] if best == Cs[-1] and at + 1 < len(BF_C_STEPS) else None)
            if nxt is None or nxt in Cs:
                break
            for g, e in zip(got, _cached_many(_fold_jobs(kind, ("svm",), (), (nxt,)))):
                g["svm_%g" % nxt] = e["svm_%g" % nxt]
            Cs = sorted(Cs + [nxt])
        a = max(BF_ALPHA, key=lambda a: right("nb_%g" % a))
        assert BF_ALPHA[0] < a < BF_ALPHA[-1], "the best alpha sits at an end of BF_ALPHA (%s, %g)" % (kind, a)
        _BF["scores", kind], _BF["C", kind] = got, Cs
    return _BF["scores", kind]


def _from_folds(preds):
    """A harness run from forums already chosen for each fold's new threads (its replies are not scored)."""
    full = []
    for (i, j, Ta, Tb, vn, vm), pr in zip(harness_folds(), preds):
        p = np.full(len(j), -1)
        p[vn] = pr
        full.append(p)
    it = iter(full)
    return harness_run(lambda Ta, ya, i, Tb: next(it))


def feature_runs(kind):
    """The harness runs of one feature set: ("nb", alpha) and ("svm", C)."""
    if ("runs", kind) not in _BF:
        sc = feature_scores(kind)
        keys = [("nb", a) for a in BF_ALPHA] + [("svm", C) for C in _BF["C", kind]]
        _BF["runs", kind] = {k: _from_folds([g["%s_%g" % k].argmax(1) for g in sc]) for k in keys}
    return _BF["runs", kind]


def sender_counts(train_idx, senders):
    """Each sender's earlier posts (those in train_idx) counted by forum; a row of zeros for a sender
    with none."""
    d = data()
    au, ytr = d["authors"], d["ytr"]
    H = collections.defaultdict(lambda: np.zeros(20))
    for q in train_idx:
        H[au[q]][ytr[q]] += 1
    return np.array([H[s] if s in H else np.zeros(20) for s in senders])


def history_term(Hc, beta):
    """The sender's history as smoothed log shares: beta posts added to every forum before the shares
    are taken. A sender with no earlier post gets zeros, which changes no route."""
    n = Hc.sum(1, keepdims=True)
    return np.where(n > 0, np.log((Hc + beta) / (n + 20 * beta)), 0.0)


def harness_history():
    """Each harness fold's new threads: their senders' earlier posts by forum (from the fold's training part)."""
    if "hc" not in _BF:
        au = np.array(data()["authors"])
        _BF["hc"] = [sender_counts(i, au[j[vn]]) for i, j, Ta, Tb, vn, vm in harness_folds()]
    return _BF["hc"]


def history_runs(model):
    """A model with the sender's history added to its scores, for every reading and setting of its
    search, keyed (reading, setting, beta, w)."""
    if ("hist", model) not in _BF:
        hc, runs = harness_history(), {}
        for kind, _ in BF_SETS:
            sc = feature_scores(kind)
            for s in (BF_ALPHA if model == "nb" else _BF["C", kind]):
                for b in HIST_BETA:
                    for w in HIST_W:
                        runs[kind, s, b, w] = _from_folds([(g["%s_%g" % (model, s)] + w * history_term(h, b)).argmax(1)
                                                           for g, h in zip(sc, hc)])
        _BF["hist", model] = runs
    return _BF["hist", model]


def choose_history(hr, picks):
    """harness_choose for the history, with the model's reading and setting held at what it picked
    without the history in each fold: only beta and w are chosen, so a new sender's route cannot move."""
    fo = next(iter(hr.values()))["fold"]
    ok, got = np.zeros(len(fo), bool), []
    for f, pk in enumerate(picks):
        keys = [q for q in hr if q[:2] == pk]
        q = max(keys, key=lambda q: hr[q]["ok"][fo != f].mean())
        ok[fo == f] = hr[q]["ok"][fo == f]
        got.append(q)
    return ok, got


def _groups(Hc, y):
    """Senders met: is the post in the sender's usual forum (their most posts), another forum they had
    posted in, or a forum they never had?"""
    c, met = Hc[np.arange(len(y)), y], Hc.sum(1) > 0
    return {"usual": (c > 0) & (Hc.argmax(1) == y), "other": (c > 0) & (Hc.argmax(1) != y), "never": met & (c == 0)}


def later_jobs(specs):
    """Settings (kind, model, s) fitted on every earlier post: their scores for the later new threads,
    computed side by side and cached."""
    d, av = data(), audited()
    nw = np.where(d["new"])[0]
    jobs = []
    for kind, model, s in specs:
        A, S = feature_texts(kind, d["Ptr"], av["A"])
        B, SB = feature_texts(kind, [d["Pte"][q] for q in nw], [av["B"][q] for q in nw])
        kw = dict(models=(model,), alphas=(s,), Cs=(s,))
        jobs.append(("later features %s %s %g" % (kind, model, s), (_text_key(A, B, S or [], SB or []), d["ytr"]),
                     functools.partial(_bf_fit, **kw), (kind, A, d["ytr"], B, S, SB)))
    return [g["%s_%g" % (model, s)] for g, (kind, model, s) in zip(_cached_many(jobs), specs)]


def _three(a, b, met):
    """The change from b to a in points (95%) on all new threads, on senders met and on new senders."""
    return [_pp(_paired(a[m], b[m], check=False)) for m in (np.ones(len(a), bool), met, ~met)]


def _setting(model, s):
    return ("alpha %g" if model == "nb" else "C %g") % s


def reading_search():
    """Each model's search over every reading and setting on the harness, chosen fold by fold, and its
    choices: by fold (reading, setting), and the single best on the harness (fitted for the later posts)."""
    if "search" not in _BF:
        out = {}
        for model, _ in BF_MODELS:
            runs = {(kind, s): r for kind, _ in BF_SETS for (m, s), r in feature_runs(kind).items() if m == model}
            ok, picks = harness_choose(runs)
            out[model] = dict(ok=ok, picks=picks, best=max(runs, key=lambda q: runs[q]["raw"]), runs=runs)
        _BF["search"] = out
    return _BF["search"]


def later_readings():
    """Every reading's best setting on the harness, for each model, fitted on all earlier posts: scores for
    the later new threads, keyed (model, reading) -> (scores, setting)."""
    if "later" not in _BF:
        specs = [(kind, model, max((q for q in feature_runs(kind) if q[0] == model),
                                   key=lambda q: feature_runs(kind)[q]["raw"])[1])
                 for model, _ in BF_MODELS for kind, _ in BF_SETS]
        _BF["later"] = {(model, kind): (S, s) for (kind, model, s), S in zip(specs, later_jobs(specs))}
    return _BF["later"]


def _two(a, b, met):
    """The change from b to a on senders met and on new senders, as a second line under a table row."""
    _, m, n = _three(a, b, met)
    return "senders met %s, new senders %s" % (m, n)


SET_SHORT = {"words": "words", "pairs": "pairs", "pieces": "pieces", "subject": "subject", "quotes": "quoted text",
             "both": "pairs and pieces", "all": "all four"}


def better_features():
    section("34. better_features -- the fifth rung: what else the router could read")
    k = audited()["known"]
    nb_bar, _ = harness_choose(nb_runs())
    runs = {kind: feature_runs(kind) for kind, _ in BF_SETS}
    for a in BF_ALPHA:  # the words through this section's code are the bar's runs from page 14
        if ("complement", "len", a) in nb_runs():
            assert (runs["words"]["nb", a]["pred"] == nb_runs()["complement", "len", a]["pred"]).all()
    r0 = runs["words"]["nb", BF_ALPHA[0]]
    met = r0["met"]
    print("the audited view; the harness as before, scored on its %d new threads, %.1f%% of them from a sender"
          % (len(met), 100 * met.mean()))
    print("met in the fold's training posts (the later new threads: %.1f%%). Each reading is added to the" % (100 * k))
    print("words and tried on two models, each with its own search: alpha %g to %g for naive Bayes; C from"
          % (BF_ALPHA[0], BF_ALPHA[-1]))
    print("%s for the SVM, a step further while the best C sits at an end. Each choice is priced fold by"
          % ", ".join("%g" % C for C in BF_C))
    print("fold. Share routed right, then the change against the same model reading the words, in points (95%):")
    chosen = {}
    for model, label in BF_MODELS:
        print()
        print("%-42s %9s   %-6s   %s" % (label, "columns", "right", "all new threads"))
        for kind, lbl in BF_SETS:
            chosen[model, kind] = harness_choose({s: r for s, r in runs[kind].items() if s[0] == model})
        base = chosen[model, "words"][0]
        for kind, lbl in BF_SETS:
            ok = chosen[model, kind][0]
            cols = "{:,.0f}".format(np.median([g["cols"] for g in feature_scores(kind)]))
            if kind == "words":
                print("  %-40s %9s   %.4f   (senders met %.4f, new senders %.4f)"
                      % (lbl, cols, ok.mean(), base[met].mean(), base[~met].mean()))
            else:
                print("  %-40s %9s   %.4f   %s" % (lbl, cols, ok.mean(), _pp(_paired(ok, base, check=False))))
                print("      %s" % _two(ok, base, met))
    print()
    spans = ["%s %g-%g" % (SET_SHORT[kind], _BF["C", kind][0], _BF["C", kind][-1]) for kind, _ in BF_SETS]
    print("C searched for the SVM: %s;" % "; ".join(spans[:4]))
    print("  %s" % "; ".join(spans[4:]))
    _BF["chosen"] = chosen

    sr = reading_search()
    print()
    print("each model's whole search (every reading and setting above), chosen fold by fold, against the bar")
    print("(complement naive Bayes on the words, its own search on page 14: %.4f)" % nb_bar.mean())
    for model, label in BF_MODELS:
        q = sr[model]
        print("  %-42s %.4f   %s" % (label, q["ok"].mean(), _pp(_paired(q["ok"], nb_bar, check=False))))
        print("    picked by fold: %s" % ", ".join("%s (%s)" % (SET_SHORT[kd], _setting(model, st)) if n == 0 or q["picks"][n - 1] != (kd, st)
                                                 else "same" for n, (kd, st) in enumerate(q["picks"])))
    print("  the linear SVM against the bar's model, each with its search: %s"
          % _pp(_paired(sr["svm"]["ok"], sr["nb"]["ok"], check=False)))

    d = data()
    nw = np.where(d["new"])[0]
    yb = d["yte"][nw]
    lmet = audited()["met"][nw]
    later = later_readings()
    print()
    print("the later new threads (report only): each reading at its best setting on the harness, fitted on all")
    print("%d earlier posts, scored on the %d (%d from senders met); change against the same model on the words"
          % (len(d["ytr"]), len(yb), lmet.sum()))
    for model, label in BF_MODELS:
        print("  %s" % label)
        wok = later[model, "words"][0].argmax(1) == yb
        for kind, lbl in BF_SETS:
            S, st = later[model, kind]
            ok = S.argmax(1) == yb
            name = "%s (%s)" % (lbl, _setting(model, st))
            if kind == "words":
                print("    %-52s %.4f" % (name, ok.mean()))
            else:
                print("    %-52s %.4f   %s" % (name, ok.mean(), _pp(_paired(ok, wok, check=False))))
                print("        %s" % _two(ok, wok, lmet))
    bar_later = later["nb", "words"][0].argmax(1) == yb
    print("  against the bar on the later posts (%.4f):" % bar_later.mean())
    for model, label in BF_MODELS:
        kd = sr[model]["best"][0]
        print("    %s reading %s: %s" % (label.split(" (")[0], SET_SHORT[kd],
                                        _pp(_paired(later[model, kd][0].argmax(1) == yb, bar_later, check=False))))


# ------------------------------------------------------------------ #
# 35. Pieces: what pieces of words read that the words do not
# ------------------------------------------------------------------ #
# Two later new threads from senders the router had not met, each misrouted by the SVM on the words
# and routed right once it also reads pieces; read in full, and chosen for being short. The second
# names a private person, masked.
PIECE_SPECIMENS = (5811, 7226)
PIECE_NAMES = ("Bob", "Silverman")
PIECE_TOP = 6  # features shown per specimen
ONE_LETTER = r"(?u)\b\w+\b"  # the words, with the one-letter words scikit-learn's default pattern drops


def _tokens(t):
    return [w.lower() for w in TOKEN_RE.findall(t)]


def _piece_segments(text, pieces):
    """The text cut into runs, each marked when it is a word holding one of the pieces (a piece's spaces
    are the edges of a word, as scikit-learn's char_wb pads them)."""
    return [{"t": m.group(0), "hit": bool(m.group(0)[0].isalnum() and any(q in " %s " % m.group(0).lower() for q in pieces))}
            for m in re.finditer(r"\w+|\W+", text)]


def _specimen_features(rows):
    """The pieces model (the SVM on words and pieces, at the harness's best C) fitted on every earlier post:
    for each specimen row of the later new threads, the features that move it most from the words model's
    forum to its own."""
    d, av = data(), audited()
    nw = np.where(d["new"])[0]
    later = later_readings()
    C = later["svm", "pieces"][1]
    pw = later["svm", "words"][0].argmax(1)
    A, B = av["A"], [av["B"][nw[r]] for r in rows]

    def fn():
        blocks = feature_blocks("pieces", A, B)
        Xa, Xb = block_features(blocks, "idf")
        m = svm_fit(Xa, d["ytr"], C)
        nw_ = blocks[0][0].shape[1]
        cw = CountVectorizer().fit(A)
        cp = CountVectorizer(**PIECES).fit(A)
        names = np.concatenate([cw.get_feature_names_out(), cp.get_feature_names_out()])
        out = {}
        for n, r in enumerate(rows):
            x = Xb[n].toarray().ravel()
            c = x * (m.coef_[d["yte"][nw[r]]] - m.coef_[pw[r]])
            top = np.argsort(-c, kind="stable")[:PIECE_TOP]
            out["f%d" % n] = np.array([str(names[q]) for q in top])
            out["c%d" % n] = c[top]
            out["k%d" % n] = top >= nw_
            out["s%d" % n] = np.array([c[:nw_].sum(), c[nw_:].sum()])
        return out
    return _cached("pieces specimens %s %g" % (rows, C), fn, _text_key(A, B), d["ytr"])


def what_pieces_read():
    section("35. pieces -- what pieces of words read that the words do not")
    d, av = data(), audited()
    A, names = av["A"], d["names"]
    runs = {kind: feature_runs(kind) for kind in ("words", "pieces", "letters")}
    pick = {(m, kind): harness_choose({q: r for q, r in runs[kind].items() if q[0] == m})[0]
            for m, _ in BF_MODELS for kind in runs}
    r0 = runs["words"]["nb", BF_ALPHA[0]]
    met, y = r0["met"], r0["y"]
    has = []
    for i, j, Ta, Tb, vn, vm in harness_folds():
        voc = set(CountVectorizer().fit([A[q] for q in i]).vocabulary_)
        has += [any(t not in voc for t in _tokens(A[q])) for q in j[vn]]
    has = np.array(has)
    print("pieces of words against the words, on the harness's new threads, points (95%)")
    print("  %-40s %-6s %-27s %s" % ("", "posts", "the bar's model", "the linear SVM"))
    for lbl, m in (("senders met", met), ("new senders", ~met),
                   ("new senders, no word unseen in training", ~met & ~has),
                   ("new senders, at least one unseen word", ~met & has)):
        print("  %-40s %5d  %-27s %s" % (lbl, m.sum(), *(_pp(_paired(pick[mod, "pieces"][m], pick[mod, "words"][m], check=False))
                                                        for mod, _ in BF_MODELS)))
    print("  (%.1f%% of new threads have a word no training post contains)" % (100 * has.mean()))
    print()
    w, pc = pick["svm", "words"], pick["svm", "pieces"]
    net = [(int((pc & ~w)[y == f].sum() - (~pc & w)[y == f].sum()), f) for f in range(20)]
    net.sort(key=lambda q: (-q[0], q[1]))
    print("the linear SVM: posts pieces turn right minus posts they turn wrong, by forum (all %+d):" % sum(a for a, _ in net))
    print("  " + ", ".join("%s %+d" % (names[f], a) for a, f in net[:5]))
    print()
    xw = y == names.index("comp.windows.x")
    print("the words as scikit-learn counts them are runs of two or more letters or digits: the one-letter word X,")
    print("the name of the X Window System, is not one. The words with one-letter words kept, against the words:")
    for mod, lbl in BF_MODELS:
        ok = pick[mod, "letters"]
        print("  %-16s %.4f   %s; against pieces %s" % (lbl.split(" (")[0], ok.mean(), _pp(_paired(ok, pick[mod, "words"], check=False)),
                                                        _pp(_paired(ok, pick[mod, "pieces"], check=False))))
        print("    comp.windows.x's %d new threads: words %.3f, one-letter words kept %.3f, pieces %.3f"
              % (xw.sum(), pick[mod, "words"][xw].mean(), ok[xw].mean(), pick[mod, "pieces"][xw].mean()))

    nw = np.where(d["new"])[0]
    yb, lmet = d["yte"][nw], av["met"][nw]
    later = later_readings()
    pw = later["svm", "words"][0].argmax(1)
    pp = later["svm", "pieces"][0].argmax(1)
    rows = [int(np.where(nw == q)[0][0]) for q in PIECE_SPECIMENS]
    for r in rows:
        assert not lmet[r] and pp[r] == yb[r] != pw[r], "a specimen must be a new sender's post the pieces fix"
    sf = _specimen_features(rows)
    print()
    print("two later new threads from new senders: the SVM on the words routes them wrong, with pieces right.")
    print("The features that move each most from the words' forum to its own (piece = p, word = w):")
    out = []
    for n, (q, r) in enumerate(zip(PIECE_SPECIMENS, rows)):
        f, c, kk, sm = sf["f%d" % n], sf["c%d" % n], sf["k%d" % n], sf["s%d" % n]
        print("  %d, %s, %d words; the SVM on the words alone routes it to %s"
              % (q, names[yb[r]], len(_tokens(av["B"][q])), names[pw[r]]))
        print("    its margin toward %s, from the words %+.3f and from the pieces %+.3f" % (names[yb[r]], sm[0], sm[1]))
        print("    " + ", ".join("%s'%s' %+.3f" % ("p" if k else "w", t, v) for t, v, k in zip(f, c, kk)))
        # the subject, then the body's paragraphs reflowed: the posts are hard-wrapped at 72-80 characters,
        # which a narrow column would wrap a second time
        first, _, body = _mask_names(av["B"][q], PIECE_NAMES).partition("\n")
        paras = [" ".join(ln.strip() for ln in para.split("\n")) for para in re.split(r"\n\s*\n", body.strip("\n"))]
        text = first + "\n\n" + "\n\n".join(paras)
        pieces = [str(t) for t, k in zip(f, kk) if k]
        # where the top piece and the words holding it occur in the earlier posts
        held = sorted({t.lower() for t in re.findall(r"\w+", av["B"][q]) if pieces[0] in " %s " % t.lower()})
        for lbl, hit in [("a word holding '%s'" % pieces[0], lambda t: pieces[0] in " %s " % t)] + \
                [("the word '%s'" % h, lambda t, h=h: t == h) for h in held]:
            has_it = np.array([any(hit(t) for t in set(re.findall(r"\w+", a.lower()))) for a in A])
            print("      %-32s in %4d earlier posts, %.0f%% of them in %s"
                  % (lbl, has_it.sum(), 100 * (d["ytr"][has_it] == yb[r]).mean(), names[yb[r]]))
        out.append({"post": q, "forum": names[yb[r]], "words": names[pw[r]], "subject": d["Pte"][q]["subject"],
                    "segments": _piece_segments(text.strip("\n"), pieces),
                    "top": [{"f": str(t), "piece": bool(k), "c": round(float(v), 3)} for t, v, k in zip(f, c, kk)],
                    "from": {"words": round(float(sm[0]), 3), "pieces": round(float(sm[1]), 3)}})
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "pieces.json").write_text(json.dumps({"specimens": out}, ensure_ascii=False, indent=1) + "\n",
                                          encoding="utf-8")


# ------------------------------------------------------------------ #
# 36. The sender's history: who sent it, as a term of its own
# ------------------------------------------------------------------ #
HIST_DIAL = (0.0, 0.01, 0.03, 0.1, 0.3, 1.0, 3.0, 10.0)  # the lab's weights
HIST_GROUPS = (("usual", "the sender's usual forum"), ("other", "another forum they had posted in"),
               ("never", "a forum they never had"))


def _dial(S, Hc, y, beta, known):
    """The lab's rows: share right by group at each weight of HIST_DIAL, and the posts each weight turns
    right and wrong against no history."""
    grp = _groups(Hc, y)
    grp["new"] = Hc.sum(1) == 0
    met = ~grp["new"]
    L = history_term(Hc, beta)
    base = S.argmax(1) == y
    rows = []
    for w in HIST_DIAL:
        ok = (S + w * L).argmax(1) == y
        rows.append({"w": w, "all": round(float(ok.mean()), 4),
                     "weighted": round(float(known * ok[met].mean() + (1 - known) * ok[~met].mean()), 4),
                     **{g: round(float(ok[m].mean()), 4) for g, m in grp.items()},
                     "fixed": {g: int((ok & ~base)[m].sum()) for g, m in grp.items()},
                     "broken": {g: int((~ok & base)[m].sum()) for g, m in grp.items()}})
    return {"n": {g: int(m.sum()) for g, m in grp.items()}, "known": round(float(known), 4), "rows": rows}


def sender_history_section():
    section("36. sender_history -- who sent it, as a term of its own")
    d, av = data(), audited()
    k = av["known"]
    nb_bar, _ = harness_choose(nb_runs())
    sr = reading_search()
    r0 = feature_runs("words")["nb", BF_ALPHA[0]]
    met, y = r0["met"], r0["y"]
    Hc = np.concatenate(harness_history())
    assert ((Hc.sum(1) > 0) == met).all()
    grp = _groups(Hc, y)
    nm = met.sum()
    print("the sender's history, added to a model's scores: + w x ln(share of the sender's earlier posts in the")
    print("forum, beta posts added to every forum first). beta and w each from %s," % ", ".join("%g" % b for b in HIST_BETA))
    assert HIST_BETA == HIST_W
    print("chosen fold by fold, with the model's reading and setting held where its search put them: a sender")
    print("with no earlier post routes exactly as before.")
    print()
    print("the harness: %d new threads from senders met in the fold's training posts; the post went to" % nm)
    for g, lbl in HIST_GROUPS:
        print("  %-34s %5d (%.1f%%)" % (lbl, grp[g].sum(), 100 * grp[g].sum() / nm))
    print("  the sender's usual forum as the route, alone: %.4f of them" % (grp["usual"].sum() / nm))
    print()
    print("  %-34s %-7s  %-22s %s" % ("", "right", "senders met", "all new threads, at the later mix"))
    res = {}
    for model, label in BF_MODELS:
        hr = history_runs(model)
        ch = harness_choose({q: r for q, r in feature_runs("words").items() if q[0] == model})
        for name, picks, base in (("the words", [("words", q[1]) for q in ch[1]], ch[0]),
                                  ("its search", sr[model]["picks"], sr[model]["ok"])):
            ok, got = choose_history(hr, picks)
            assert (ok[~met] == base[~met]).all(), "the history moved a new sender's route"
            res[model, name] = (ok, got, base)
            p = _paired(ok[met], base[met], check=False)
            print("  %-34s %.4f   %-22s %+.2f (%+.2f, %+.2f)"
                  % ("%s, %s" % ("the bar's model" if model == "nb" else "the linear SVM", name), ok.mean(),
                     _pp(p), 100 * k * p["diff"], 100 * k * p["lo"], 100 * k * p["hi"]))
        print("    (beta, w) picked by fold with its search: %s" % "  ".join("%g, %g" % q[2:] for q in res[model, "its search"][1]))
    print()
    print("senders met, by where the post went: share right without -> with the history (each model with its search)")
    for g, lbl in HIST_GROUPS:
        m = grp[g]
        for n, (model, mlbl) in enumerate(BF_MODELS):
            ok, _, base = res[model, "its search"]
            print("  %-34s %-6s %-16s %.3f -> %.3f   %s" % (lbl if not n else "", str(m.sum()) if not n else "",
                                                          mlbl.split(" (")[0], base[m].mean(), ok[m].mean(),
                                                          _pp(_paired(ok[m], base[m], check=False))))
    print()
    print("against the bar (%.4f), all new threads:" % nb_bar.mean())
    for model, label in BF_MODELS:
        ok, _, base = res[model, "its search"]
        print("  %-42s %.4f   %s" % (label.split(" (")[0] + ", its search", base.mean(), _pp(_paired(base, nb_bar, check=False))))
        print("  %-42s %.4f   %s" % ("  + the sender's history", ok.mean(), _pp(_paired(ok, nb_bar, check=False))))
    print("  the linear SVM against the bar's model, both with their search and the history: %s"
          % _pp(_paired(res["svm", "its search"][0], res["nb", "its search"][0], check=False)))

    # the later new threads: the harness's best reading, setting, beta and w for each model
    nw = np.where(d["new"])[0]
    yb = d["yte"][nw]
    lmet = av["met"][nw]
    Lc = sender_counts(range(len(d["ytr"])), [author_of(d["Pte"][q]) for q in nw])
    assert ((Lc.sum(1) > 0) == lmet).all()
    lg = _groups(Lc, yb)
    later = later_readings()
    print()
    print("the later new threads (report only): %d from senders met. The post went to the sender's usual"
          % lmet.sum())
    print("forum %.1f%%, another forum they had posted in %.1f%%, a forum they never had %.1f%%; the usual forum"
          % (100 * lg["usual"].sum() / lmet.sum(), 100 * lg["other"].sum() / lmet.sum(), 100 * lg["never"].sum() / lmet.sum()))
    print("alone routes %.4f of them." % (lg["usual"].sum() / lmet.sum()))

    bar_later = later["nb", "words"][0].argmax(1) == yb
    dial = {}
    for model, label in BF_MODELS:
        hr = history_runs(model)
        for kind in dict.fromkeys(("words", sr[model]["best"][0])):
            S, st = later[model, kind]
            b, w = max(((b, w) for b in HIST_BETA for w in HIST_W), key=lambda q: (hr[(kind, st) + q]["raw"], -q[1]))
            base = S.argmax(1) == yb
            ok = (S + w * history_term(Lc, b)).argmax(1) == yb
            print("  %s, %s (%s), + history (beta %g, w %g): %.4f" % (
                "the bar's model" if model == "nb" else "the linear SVM", SET_SHORT[kind], _setting(model, st), b, w, ok.mean()))
            print("      against no history: senders met %s, all new threads %s"
                  % (_pp(_paired(ok[lmet], base[lmet], check=False)), _pp(_paired(ok, base, check=False))))
            for g, lbl in HIST_GROUPS:
                m = lg[g]
                print("      %-46s %4d   %.3f -> %.3f" % (lbl, m.sum(), base[m].mean(), ok[m].mean()))
            print("      against the bar on the later posts (%.4f): %s" % (bar_later.mean(), _pp(_paired(ok, bar_later, check=False))))
            if model == "nb" and kind == sr["nb"]["best"][0]:
                dial = {"reading": dict(BF_SETS)[kind], "setting": st, "beta": b, "pick": w,
                        "harness": _dial(np.concatenate([g["nb_%g" % st] for g in feature_scores(kind)]), Hc, y, b, k),
                        "later": _dial(S, Lc, yb, b, k)}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "history.json").write_text(json.dumps(dial, indent=1) + "\n", encoding="utf-8")



# ------------------------------------------------------------------ #
# 37. Pretrained embeddings: a model trained on other text, beside the words
# ------------------------------------------------------------------ #
EMB_KEYS = ("minilm", "bge-large")  # the two sentence models in the local cache, small and large
EMB_C = (0.3, 1.0, 3.0, 10.0, 30.0, 100.0)  # logistic regression on the embedding alone
EMB_V = (0.03, 0.1, 0.3, 1.0, 3.0, 10.0)  # the weight of its log-probability beside another model's scores
EMB_ITER = 5000


def embed_view(key):
    """Embeddings of the audited router's view, earlier and later posts, L2-normalised, with each post's
    length in the model's tokens. Encoded once on the GPU and cached; the cache carries a hash of the
    texts it encoded and is refused if the view has changed since."""
    av = audited()
    tk = _text_key(av["A"], av["B"])
    f = CACHE / ("%s_audited.npz" % key)
    if not f.exists():
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        from sentence_transformers import SentenceTransformer
        m = SentenceTransformer(EMBEDDERS[key], device="cuda")  # fp32: on a GTX 1660 Ti, fp16 ran 4x slower
        enc = lambda T: m.encode(T, batch_size=32, normalize_embeddings=True, show_progress_bar=False,
                                 convert_to_numpy=True).astype(np.float32)
        ntok = lambda T: np.array([len(m.tokenizer(t)["input_ids"]) for t in T])
        CACHE.mkdir(parents=True, exist_ok=True)
        np.savez(f, tr=enc(av["A"]), te=enc(av["B"]), ntr=ntok(av["A"]), nte=ntok(av["B"]),
                 max=np.array(m.max_seq_length), key=tk)
    z = np.load(f)
    assert (z["key"] == tk).all(), "the router's view changed since %s was encoded" % f.name
    return dict(tr=z["tr"], te=z["te"], ntr=z["ntr"], nte=z["nte"], max=int(z["max"]),
                hash=hashlib.sha256(f.read_bytes()).hexdigest()[:12])


def emb_fit(Ea, ya, Eb, Cs):
    """Logistic regression on an embedding alone, at each C: every forum's log-probability for the posts Eb."""
    out = {}
    for C in Cs:
        m = LogisticRegression(C=C, max_iter=EMB_ITER).fit(Ea, ya)
        assert m.n_iter_.max() < EMB_ITER, "logistic regression on the embedding stopped short (C=%g)" % C
        out["lr_%g" % C] = m.predict_log_proba(Eb)
    return out


def _fold_y():
    y = data()["ytr"]
    return [y[j[vn]] for i, j, Ta, Tb, vn, vm in harness_folds()]


def emb_scores(key):
    """Per harness fold, the embedding's logistic regression at every C, for the fold's new threads (cached)."""
    if ("emb", key) not in _BF:
        e, y = embed_view(key), data()["ytr"]
        _BF["emb", key] = _cached_many([("embedding logistic %s %s" % (key, EMB_C), (e["tr"][i], y[i], e["tr"][j[vn]]),
                                         emb_fit, (e["tr"][i], y[i], e["tr"][j[vn]], EMB_C))
                                        for i, j, Ta, Tb, vn, vm in harness_folds()])
    return _BF["emb", key]


def _choose(runs, f, tie):
    """The key of runs (each a list of right/wrong per fold) that is right most often outside fold f."""
    return max(runs, key=lambda q: (sum(int(r.sum()) for n, r in enumerate(runs[q]) if n != f), tie(q)))


def emb_alone(key):
    """The embedding alone on the harness, C chosen fold by fold: right/wrong per new thread and the picks."""
    sc, y = emb_scores(key), _fold_y()
    runs = {C: [g["lr_%g" % C].argmax(1) == yy for g, yy in zip(sc, y)] for C in EMB_C}
    got = [_choose(runs, f, lambda C: -C) for f in range(5)]
    return np.concatenate([runs[C][f] for f, C in enumerate(got)]), got, runs


def fuse_choose(base_for, picks, key):
    """The embedding's log-probability added to another model's scores with weight v. As in
    choose_history, fold f holds the other model at picks[f] (base_for(pick) gives its scores in every
    fold) and chooses C and v on the other four folds. Right/wrong per new thread and the (C, v) picked."""
    sc, y, memo, ok, got = emb_scores(key), _fold_y(), {}, [], []
    for f, pk in enumerate(picks):
        if pk not in memo:
            base = base_for(pk)
            memo[pk] = {(C, v): [(b + v * g["lr_%g" % C]).argmax(1) == yy for b, g, yy in zip(base, sc, y)]
                        for C in EMB_C for v in EMB_V}
        q = _choose(memo[pk], f, lambda q: (-q[1], -q[0]))
        ok.append(memo[pk][q][f])
        got.append(q)
    return np.concatenate(ok), got


def _scores_of(model, hist=False):
    """base_for for fuse_choose: a pick (reading, setting[, beta, w]) -> the model's scores in every fold."""
    def base_for(pk):
        sc = [g["%s_%g" % (model, pk[1])] for g in feature_scores(pk[0])]
        return [s + pk[3] * history_term(h, pk[2]) for s, h in zip(sc, harness_history())] if hist else sc
    return base_for


def _gain_gap(a, b, met):
    """What a gains over b on new senders minus what it gains on senders met, in points, with a 95%
    interval (each group resampled on its own: they are different posts)."""
    dn, dm = a[~met].astype(float) - b[~met], a[met].astype(float) - b[met]
    rng = np.random.default_rng(BOOT_SEED)
    g = np.array([dn[rng.integers(0, len(dn), len(dn))].mean() - dm[rng.integers(0, len(dm), len(dm))].mean()
                  for _ in range(BOOT_N)])
    lo, hi = np.percentile(g, [2.5, 97.5])
    return dict(diff=float(dn.mean() - dm.mean()), lo=float(lo), hi=float(hi))


def nearest_posts(key):
    """For each harness new thread, its nearest earlier post in the fold's training part, by the words
    (cosine of the TF-IDF rows) and by the embedding: is it in the same forum, and from the same sender?"""
    e, d = embed_view(key), data()
    au, y = np.array(d["authors"]), d["ytr"]
    out = {k: ([], []) for k in ("words", "meaning")}
    for i, j, Ta, Tb, vn, vm in harness_folds():
        jn = j[vn]
        for k, S in (("words", (Tb[vn] @ Ta.T).toarray()), ("meaning", e["tr"][jn] @ e["tr"][i].T)):
            nn = i[S.argmax(1)]
            out[k][0].append(y[nn] == y[jn])
            out[k][1].append(au[nn] == au[jn])
    return {k: (np.concatenate(f), np.concatenate(s)) for k, (f, s) in out.items()}


def _fuse_best(base_for, pk, key):
    """The (C, v) that is right most often over all five folds beside the model held at pk."""
    sc, y = emb_scores(key), _fold_y()
    base = base_for(pk)
    tab = {(C, v): sum(int(((b + v * g["lr_%g" % C]).argmax(1) == yy).sum()) for b, g, yy in zip(base, sc, y))
           for C in EMB_C for v in EMB_V}
    return max(tab, key=lambda q: (tab[q], -q[1], -q[0]))


def later_embedding(key, C):
    """The embedding's logistic regression fitted on every earlier post: log-probabilities for the later new threads."""
    d, e = data(), embed_view(key)
    nw = np.where(d["new"])[0]
    return _cached("later embedding logistic %s %g" % (key, C), lambda: emb_fit(e["tr"], d["ytr"], e["te"][nw], (C,)),
                   e["tr"], d["ytr"], e["te"][nw])["lr_%g" % C]


EMB_NAME = {"minilm": "MiniLM", "bge-large": "bge-large"}
EMB_BASES = ("the words", "its search", "its search + the history")


def fusion():
    """Each embedding beside each model at three stages (the words; its search; its search + the history),
    chosen fold by fold: (model, stage, key) -> (right/wrong, (C, v) by fold, the stage without it)."""
    if "fused" not in _BF:
        sr, res = reading_search(), {}
        for model, _ in BF_MODELS:
            ch = harness_choose({q: r for q, r in feature_runs("words").items() if q[0] == model})
            hist_ok, hist_picks = choose_history(history_runs(model), sr[model]["picks"])
            bases = ((EMB_BASES[0], [("words", q[1]) for q in ch[1]], ch[0], _scores_of(model)),
                     (EMB_BASES[1], sr[model]["picks"], sr[model]["ok"], _scores_of(model)),
                     (EMB_BASES[2], hist_picks, hist_ok, _scores_of(model, True)))
            for name, picks, base, base_for in bases:
                for key in EMB_KEYS:
                    ok, got = fuse_choose(base_for, picks, key)
                    res[model, name, key] = (ok, got, base)
        _BF["fused"] = res
    return _BF["fused"]


def pretrained():
    section("37. pretrained -- the sixth rung: a model trained on other text, beside the words")
    nb_bar, _ = harness_choose(nb_runs())
    r0 = feature_runs("words")["nb", BF_ALPHA[0]]
    met, y = r0["met"], r0["y"]
    print("the audited view, encoded once by two pretrained sentence models (cached, hash shown):")
    for key in EMB_KEYS:
        e = embed_view(key)
        n = np.concatenate([e["ntr"], e["nte"]])
        print("  %-40s %4d numbers per post; reads the first %d tokens" % (EMBEDDERS[key], e["tr"].shape[1], e["max"]))
        print("      %.1f%% of posts are longer; cache %s" % (100 * (n > e["max"]).mean(), e["hash"]))
    print("each embedding gets its own model: logistic regression, C from %g to %g, chosen fold by fold."
          % (EMB_C[0], EMB_C[-1]))
    print()
    print("the harness's %d new threads (%d from senders met), share right; change against the bar (%.4f):"
          % (len(y), met.sum(), nb_bar.mean()))
    print("  %-28s %-8s %-21s %-21s %s" % ("", "right", "all new threads", "senders met", "new senders"))
    alone = {}
    for key in EMB_KEYS:
        ok, got, runs = emb_alone(key)
        alone[key] = ok
        print("  %-28s %.4f   %-21s %-21s %s" % (EMB_NAME[key] + " alone", ok.mean(), *_three(ok, nb_bar, met)))
        best = max(EMB_C, key=lambda C: sum(int(r.sum()) for r in runs[C]))
        assert EMB_C[0] < best < EMB_C[-1], "the embedding's best C sits at an end of EMB_C (%s, %g)" % (key, best)
        print("      C picked by fold: %s" % ", ".join("%g" % C for C in got))

    print()
    print("beside a model's scores: + v x the embedding model's log-probability, v from %g to %g; C and v"
          % (EMB_V[0], EMB_V[-1]))
    print("chosen fold by fold with the model's own reading and setting held. Change against the same model")
    print("without the embedding, in points (95%):")
    res = fusion()
    for model, label in BF_MODELS:
        print("  %s" % label)
        for name in EMB_BASES:
            print("    %-26s %.4f" % (name, res[model, name, EMB_KEYS[0]][2].mean()))
            for key in EMB_KEYS:
                ok, got, base = res[model, name, key]
                print("      + %-22s %.4f   %-21s %-21s %s" % (EMB_NAME[key], ok.mean(), *_three(ok, base, met)))
            print("        (C, v) picked by fold, bge-large: %s" % "  ".join("%g, %g" % q for q in res[model, name, "bge-large"][1]))
    print("  all four, the history and bge-large, against the bar:")
    for model, label in BF_MODELS:
        ok = res[model, "its search + the history", "bge-large"][0]
        print("    %-26s %.4f   %s" % (label.split(" (")[0], ok.mean(), _pp(_paired(ok, nb_bar, check=False))))
    print("    the linear SVM against the bar's model: %s" % _pp(_paired(
        res["svm", "its search + the history", "bge-large"][0], res["nb", "its search + the history", "bge-large"][0],
        check=False)))


# ------------------------------------------------------------------ #
# 38. Nearest posts: what the words and the embedding each count as alike
# ------------------------------------------------------------------ #
NEAR_K = 5  # neighbours shown per post in the lab
NEAR_SPECIMENS = (601, 1413, 1193, 1144, 3145, 5748)  # later new threads from new senders, chosen by hand-reading the
# candidates this section prints with no specimens set: four where the embedding's nearest post is in the forum and
# the words' is not, then two the other way round (the words' five nearest mostly in the forum, the embedding's not)
NEAR_NAMES = ("412 268-8843", "Vlad")  # a phone number and a private name in what the lab shows
NEAR_WORDS = 45  # words of each specimen shown


def later_nearest(key, rows, k):
    """For later posts rows, the k nearest earlier posts by the words (cosine of TF-IDF fitted on every earlier
    post) and by the embedding: (index, similarity) each, nearest first."""
    av, e = audited(), embed_view(key)
    Xa, Xb, v = tfidf(av["A"], [av["B"][q] for q in rows])
    out = {}
    for name, S in (("words", (Xb @ Xa.T).toarray()), ("meaning", e["te"][rows] @ e["tr"].T)):
        top = np.argsort(-S, axis=1, kind="stable")[:, :k]
        out[name] = (top, np.take_along_axis(S, top, 1))
    return out, v


def _ascii(s):
    """A line for stdout, which stays ASCII: masked letters print as *."""
    return s.replace("•", "*").encode("ascii", "replace").decode()


def _shared(a, b, idf, n=4):
    """The words two posts share, rarest first, leaving out scikit-learn's list of common English words."""
    common = set(_tokens(a)) & set(_tokens(b))
    return sorted((w for w in common if w in idf and w not in ENGLISH_STOP_WORDS), key=lambda w: (-idf[w], w))[:n]


def nearest_section():
    section("38. nearest -- what the words and the embedding each count as alike")
    d, av = data(), audited()
    names, ytr = d["names"], d["ytr"]
    r0 = feature_runs("words")["nb", BF_ALPHA[0]]
    met = r0["met"]
    nn = nearest_posts("bge-large")
    print("each harness new thread's nearest earlier post in the fold's training part, by the words (TF-IDF)")
    print("and by the embedding (bge-large), share in the same forum and, for senders met, from the same sender:")
    stats = {}
    for k in ("words", "meaning"):
        f, s = nn[k]
        stats[k] = {"forum": round(float(f.mean()), 4), "forum_met": round(float(f[met].mean()), 4),
                    "forum_new": round(float(f[~met].mean()), 4), "sender": round(float(s[met].mean()), 4)}
        print("  %-8s same forum %.3f (senders met %.3f, new senders %.3f); same sender %.3f of senders met"
              % (k, f.mean(), f[met].mean(), f[~met].mean(), s[met].mean()))
    fw, fm = nn["words"][0], nn["meaning"][0]
    print("  the two disagree on %d new threads: the words' neighbour alone in the forum %d, the embedding's %d"
          % ((fw != fm).sum(), (fw & ~fm).sum(), (~fw & fm).sum()))

    nw = np.where(d["new"])[0]
    yb, lmet = d["yte"][nw], av["met"][nw]
    near, v = later_nearest("bge-large", nw, NEAR_K)
    idf = dict(zip(v.get_feature_names_out(), v.idf_))
    first = {k: ytr[near[k][0][:, 0]] == yb for k in near}
    print()
    print("the later new threads, nearest of all %d earlier posts: same forum, words %.3f, embedding %.3f"
          % (len(ytr), first["words"].mean(), first["meaning"].mean()))
    if not NEAR_SPECIMENS:
        print()
        print("candidates: new senders, 15-80 words, where the nearest by one is in the forum and by the other is not")
        lens = np.array([len(_tokens(av["B"][q])) for q in nw])
        for r in np.where(~lmet & (lens >= 15) & (lens <= 80) & (first["words"] != first["meaning"]))[0]:
            q = nw[r]
            print("  %5d %-24s %3d words  words->%-24s meaning->%-24s %s" % (
                q, names[yb[r]], lens[r], names[ytr[near["words"][0][r, 0]]], names[ytr[near["meaning"][0][r, 0]]],
                d["Pte"][q]["subject"][:60].encode("ascii", "replace").decode()))
        return
    spec = []
    for q in NEAR_SPECIMENS:
        r = int(np.where(nw == q)[0][0])
        text = _mask_names(av["B"][q], NEAR_NAMES)
        subject, _, body = text.partition("\n")
        words = body.split()
        lists = {}
        for k in ("words", "meaning"):
            top, sim = near[k]
            lists[k] = [{"forum": names[ytr[i]], "subject": _mask_names(d["Ptr"][i]["subject"], NEAR_NAMES),
                         "sim": round(float(s), 3), "shared": _shared(av["B"][q], av["A"][i], idf)}
                        for i, s in zip(top[r], sim[r])]
        spec.append({"post": int(q), "forum": names[yb[r]], "subject": subject,
                     "text": " ".join(words[:NEAR_WORDS]) + (" ..." if len(words) > NEAR_WORDS else ""),
                     "length": len(_tokens(av["B"][q])), **lists})
        print()
        print(_ascii("  %d, %s, %d words: %s" % (q, names[yb[r]], spec[-1]["length"], subject)))
        for k in ("words", "meaning"):
            print("    nearest by the %s:" % ("words" if k == "words" else "embedding"))
            for x in lists[k]:
                print(_ascii("      %.3f %-24s %-34s %s" % (x["sim"], x["forum"], x["subject"][:34], " ".join(x["shared"]))).rstrip())
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "nearest.json").write_text(json.dumps({"harness": stats, "specimens": spec}, indent=1) + "\n",
                                           encoding="utf-8")



# ------------------------------------------------------------------ #
# 39. Whom the embedding reaches: senders met and new, short posts and long, next month
# ------------------------------------------------------------------ #
def embedding_reach():
    section("39. embedding_reach -- whom the embedding helps: new senders, short posts, next month")
    d, av = data(), audited()
    sr = reading_search()
    r0 = feature_runs("words")["nb", BF_ALPHA[0]]
    met = r0["met"]
    res = fusion()
    alone = {key: emb_alone(key)[0] for key in EMB_KEYS}
    print("H4: what the embedding gains on new senders minus what it gains on senders met, points (95%):")
    for model, label in BF_MODELS:
        for name in ("the words", "its search", "its search + the history"):
            for key in EMB_KEYS:
                ok, got, base = res[model, name, key]
                print("  %-16s %-26s %-10s %s" % (label.split(" (")[0], name, EMB_NAME[key], _pp(_gain_gap(ok, base, met))))

    # by length
    nw_len = np.array([len(_tokens(av["A"][q])) for i, j, Ta, Tb, vn, vm in harness_folds() for q in j[vn]])
    ntok = np.concatenate([embed_view("bge-large")["ntr"][j[vn]] for i, j, Ta, Tb, vn, vm in harness_folds()])
    e_max = embed_view("bge-large")["max"]
    base = sr["nb"]["ok"]
    fused = res["nb", "its search", "bge-large"][0]
    print()
    print("by length: the bar's model reading all four, bge-large alone, and the two together")
    print("  %-9s %6s  %-9s %-9s %-10s %-8s %s" % ("words", "posts", "too long", "all four", "bge-large", "both",
                                                   "both against all four"))
    edges = list(TREE_BANDS) + [10 ** 9]
    for lo, hi in zip(edges, edges[1:]):
        m = (nw_len >= lo) & (nw_len < hi)
        print("  %-9s %6d  %5.1f%%    %.3f     %.3f      %.3f    %s"
              % ("%d+" % lo if hi > 10 ** 8 else "%d-%d" % (lo, hi - 1), m.sum(), 100 * (ntok[m] > e_max).mean(),
                 base[m].mean(), alone["bge-large"][m].mean(), fused[m].mean(), _pp(_paired(fused[m], base[m], check=False))))
    print("  (too long: past the %d tokens bge-large reads; the rest of the post is not encoded)" % e_max)

    # the later new threads: every setting at its best on the harness, fitted on all earlier posts
    nw = np.where(d["new"])[0]
    yb, lmet = d["yte"][nw], av["met"][nw]
    later = later_readings()
    kd = sr["nb"]["best"][0]
    S, st = later["nb", kd]
    hr = history_runs("nb")
    hb, hw = max(((b, w) for b in HIST_BETA for w in HIST_W), key=lambda q: (hr[(kd, st) + q]["raw"], -q[1]))
    Lc = sender_counts(range(len(d["ytr"])), [author_of(d["Pte"][q]) for q in nw])
    SH = S + hw * history_term(Lc, hb)
    bar_later = later["nb", "words"][0].argmax(1) == yb
    print()
    print("the later new threads (report only): each setting at its best on the harness, fitted on all %d"
          % len(d["ytr"]))
    print("earlier posts, scored on the %d (%d from senders met). An embedding alone is set against the bar"
          % (len(yb), lmet.sum()))
    print("(%.4f); a row with + against the row above it. All four at alpha %g; the history at beta %g, w %g."
          % (bar_later.mean(), st, hb, hw))
    print("  %-30s %-8s %-21s %-21s %s" % ("", "right", "all new threads", "senders met", "new senders"))
    later_ok = {}
    for key in EMB_KEYS:
        runs = emb_alone(key)[2]
        C = max(EMB_C, key=lambda C: (sum(int(r.sum()) for r in runs[C]), -C))
        ok = later_embedding(key, C).argmax(1) == yb
        print("  %-30s %.4f   %-21s %-21s %s" % ("%s alone (C %g)" % (EMB_NAME[key], C), ok.mean(),
                                                   *_three(ok, bar_later, lmet)))
    for name, base_S, pk, base_for in (("the bar's model, all four", S, (kd, st), _scores_of("nb")),
                                       ("all four + the history", SH, (kd, st, hb, hw), _scores_of("nb", True))):
        base = base_S.argmax(1) == yb
        print("  %-30s %.4f" % (name, base.mean()))
        for key in EMB_KEYS:
            C, v = _fuse_best(base_for, pk, key)
            ok = (base_S + v * later_embedding(key, C)).argmax(1) == yb
            later_ok[name, key] = (ok, base)
            print("    + %-26s %.4f   %-21s %-21s %s" % ("%s (C %g, v %g)" % (EMB_NAME[key], C, v), ok.mean(),
                                                        *_three(ok, base, lmet)))
    ok, base = later_ok["the bar's model, all four", "bge-large"]
    print("  H4 on the later posts (the bar's model, all four + bge-large): %s" % _pp(_gain_gap(ok, base, lmet)))
    ok = later_ok["all four + the history", "bge-large"][0]
    print("  all four, the history and bge-large, against the bar: %s" % _pp(_paired(ok, bar_later, check=False)))



# ------------------------------------------------------------------ #
# 40. Choosing the model: two finalists level on accuracy, and what else tells them apart
# ------------------------------------------------------------------ #
ENS_U = (0.03, 0.1, 0.3, 1.0, 3.0, 10.0, 30.0)  # the SVM's weight beside the bar's model when both route


def _fold_index():
    return np.concatenate([np.full(len(y), f) for f, y in enumerate(_fold_y())])


def full_scores(model, key="bge-large"):
    """The full model (all four readings, the history, the embedding) on the harness: its scores for every new
    thread, each fold with the picks fuse_choose made for it."""
    if ("full", model) not in _BF:
        _, hist_picks = choose_history(history_runs(model), reading_search()[model]["picks"])
        ok, got, _ = fusion()[model, EMB_BASES[2], key]
        bf, sc = _scores_of(model, True), emb_scores(key)
        S = np.concatenate([bf(pk)[f] + v * sc[f]["lr_%g" % C] for f, (pk, (C, v)) in enumerate(zip(hist_picks, got))])
        assert ((S.argmax(1) == np.concatenate(_fold_y())) == ok).all()
        _BF["full", model] = S
    return _BF["full", model]


def both_choose():
    """The two full models routing together: the bar's model's scores + u x the SVM's, u chosen fold by fold."""
    S, T, y, fo = full_scores("nb"), full_scores("svm"), np.concatenate(_fold_y()), _fold_index()
    runs = {u: [((S + u * T).argmax(1) == y)[fo == f] for f in range(5)] for u in ENS_U}
    got = [_choose(runs, f, lambda u: -u) for f in range(5)]
    best = max(ENS_U, key=lambda u: (sum(int(r.sum()) for r in runs[u]), -u))
    assert ENS_U[0] < best < ENS_U[-1], "the best u sits at an end of ENS_U (%g)" % best
    return np.concatenate([runs[u][f] for f, u in enumerate(got)]), got, best


def fixed_full(model, key="bge-large"):
    """The full model on the harness with one setting in every fold, the single best on all five, as the later fit
    has it (an in-sample choice, so if anything flattering): its scores for every new thread."""
    kd, st = reading_search()[model]["best"]
    hr = history_runs(model)
    hb, hw = max(((b, w) for b in HIST_BETA for w in HIST_W), key=lambda q: (hr[(kd, st) + q]["raw"], -q[1]))
    pk = (kd, st, hb, hw)
    C, v = _fuse_best(_scores_of(model, True), pk, key)
    return np.concatenate([b + v * g["lr_%g" % C] for b, g in zip(_scores_of(model, True)(pk), emb_scores(key))])


def later_full(model, key="bge-large"):
    """The full model fitted on every earlier post, each setting at its best on the harness: scores for the later
    new threads."""
    d = data()
    nw = np.where(d["new"])[0]
    kd = reading_search()[model]["best"][0]
    S, st = later_readings()[model, kd]
    hr = history_runs(model)
    hb, hw = max(((b, w) for b in HIST_BETA for w in HIST_W), key=lambda q: (hr[(kd, st) + q]["raw"], -q[1]))
    Lc = sender_counts(range(len(d["ytr"])), [author_of(d["Pte"][q]) for q in nw])
    C, v = _fuse_best(_scores_of(model, True), (kd, st, hb, hw), key)
    return S + hw * history_term(Lc, hb) + v * later_embedding(key, C), (st, hb, hw, C, v)


def _gap_auc(ok, g):
    """How well a score sorts right from wrong: the chance a right post has a larger gap than a wrong one."""
    return float(roc_auc_score(ok, g))


def choosing():
    section("40. choosing -- two finalists, level on accuracy, and what else tells them apart")
    d, av = data(), audited()
    names = d["names"]
    r0 = feature_runs("words")["nb", BF_ALPHA[0]]
    met, y = r0["met"], r0["y"]
    Hc = np.concatenate(harness_history())
    grp = _groups(Hc, y)
    S = {m: full_scores(m) for m in ("nb", "svm")}
    both_ok, both_got, u = both_choose()
    ok = {m: S[m].argmax(1) == y for m in S}
    ok["both"] = both_ok
    lbl = {"nb": "the bar's model", "svm": "the linear SVM", "both": "both together"}
    print("the two full models (all four readings, the sender's history, bge-large), as page 19 left them, and")
    print("the two routing together: the bar's model's scores + u x the SVM's, u from %g to %g chosen fold by"
          % (ENS_U[0], ENS_U[-1]))
    print("fold (picked: %s). The harness's %d new threads, share right:" % (", ".join("%g" % q for q in both_got), len(y)))
    print("  %-18s %-7s %-8s %-8s %s" % ("", "all", "met", "new", "each forum counted once"))
    for m in ("nb", "svm", "both"):
        below = [k for k in range(20) if _ci(ok[m][y == k])[1] < FLOOR]
        print("  %-18s %.4f  %.4f   %.4f   %.4f" % (lbl[m], ok[m].mean(), ok[m][met].mean(), ok[m][~met].mean(),
                                                  forum_mean(y, np.where(ok[m], y, -1))))
        assert not below, "a forum's whole interval sits below the floor (%s)" % lbl[m]
    print("  no forum's whole interval sits below %.2f for any of the three." % FLOOR)
    print()
    head = "  %-34s %5s   %-6s %-6s %-6s %s" % ("", "posts", "bar's", "SVM", "both", "SVM against the bar's model")
    row = "  %-34s %5d   %.3f  %.3f  %.3f  %s"
    print("the weakest forums, and senders met by where the post went (page 18's groups), share right:")
    print(head)
    weak = sorted({k for m in ("nb", "svm") for k in sorted(range(20), key=lambda k: (ok[m][y == k].mean(), k))[:2]})
    for k in weak:
        mk = y == k
        print(row % (names[k], mk.sum(), *(ok[m][mk].mean() for m in ("nb", "svm", "both")),
                     _pp(_paired(ok["svm"][mk], ok["nb"][mk], check=False))))
    for g, glbl in HIST_GROUPS:
        m = grp[g]
        print(row % (glbl, m.sum(), *(ok[q][m].mean() for q in ("nb", "svm", "both")),
                     _pp(_paired(ok["svm"][m], ok["nb"][m], check=False))))
    print()
    print("against each other, points (95%):")
    print("  the linear SVM against the bar's model   %s" % _pp(_paired(ok["svm"], ok["nb"], check=False)))
    print("  both together against the bar's model    %s" % _pp(_paired(ok["both"], ok["nb"], check=False)))
    print("  both together against the linear SVM     %s" % _pp(_paired(ok["both"], ok["svm"], check=False)))
    F = {m: fixed_full(m) for m in ("nb", "svm")}
    fnb = F["nb"].argmax(1) == y
    print("  both together, one setting in every fold as the later fit has it (u = %g), against the bar's model"
          % u)
    print("  with the same: %s" % _pp(_paired((F["nb"] + u * F["svm"]).argmax(1) == y, fnb, check=False)))
    pn, ps = S["nb"].argmax(1), S["svm"].argmax(1)
    print("  the two route %.1f%% of new threads alike; of the %d they split, the bar's model is right on %d, the"
          % (100 * (pn == ps).mean(), (pn != ps).sum(), (ok["nb"] & ~ok["svm"]).sum()))
    print("  SVM on %d, neither on %d" % ((~ok["nb"] & ok["svm"]).sum(), ((pn != ps) & ~ok["nb"] & ~ok["svm"]).sum()))
    print()
    print("how well the gap between the top two scores sorts right from wrong (the chance a right post has the")
    print("larger gap), and the share right among the half of the posts with the larger gaps:")
    T = dict(S, both=S["nb"] + u * S["svm"])
    gaps = {m: margins(T[m]) for m in T}
    for m in ("nb", "svm", "both"):
        top = gaps[m] >= np.median(gaps[m])
        print("  %-18s %.3f   surest half %.3f" % (lbl[m], _gap_auc(ok[m], gaps[m]), ok[m][top].mean()))
    n = len(y)
    lo, hi = _boot(lambda i: _gap_auc(ok["svm"][i], gaps["svm"][i]) - _gap_auc(ok["nb"][i], gaps["nb"][i]), n)
    print("  the SVM's against the bar's model's: %+.3f (%+.3f, %+.3f)"
          % (_gap_auc(ok["svm"], gaps["svm"]) - _gap_auc(ok["nb"], gaps["nb"]), lo, hi))

    nw = np.where(d["new"])[0]
    yb, lmet = d["yte"][nw], av["met"][nw]
    L = {m: later_full(m)[0] for m in ("nb", "svm")}
    L["both"] = L["nb"] + u * L["svm"]
    print()
    print("the later new threads (report only): each fitted on all %d earlier posts, every setting at its best"
          % len(d["ytr"]))
    print("on the harness; both together at u = %g, the best u on the harness. Share right, and against the"
          % u)
    print("bar's model:")
    lok = {m: L[m].argmax(1) == yb for m in L}
    for m in ("nb", "svm", "both"):
        print(("  %-18s %.4f   met %.4f, new %.4f   %s" % (lbl[m], lok[m].mean(), lok[m][lmet].mean(), lok[m][~lmet].mean(),
                                                          "" if m == "nb" else _pp(_paired(lok[m], lok["nb"], check=False)))).rstrip())
    gains = [_paired(((L["nb"] + q * L["svm"]).argmax(1) == yb), lok["nb"], check=False) for q in ENS_U]
    print("  both together at every u: %s" % ", ".join("%g %+.2f" % (q, 100 * p["diff"]) for q, p in zip(ENS_U, gains)))
    pn, ps = L["nb"].argmax(1), L["svm"].argmax(1)
    print("  the two route %.1f%% of later new threads alike; of the %d they split, the bar's model is right on %d,"
          % (100 * (pn == ps).mean(), (pn != ps).sum(), (lok["nb"] & ~lok["svm"]).sum()))
    print("  the SVM on %d" % (~lok["nb"] & lok["svm"]).sum())
    _BF["choosing"] = dict(ok=ok, lok=lok, u=u)



# ------------------------------------------------------------------ #
# 41. The ladder: every rung of act 5 on the harness, all new threads and by sender
# ------------------------------------------------------------------ #
def ladder_runs():
    """Every rung of act 5 as right/wrong per harness new thread, each chosen fold by fold: (key, label, page, path, ok)."""
    sr, fused = reading_search(), fusion()
    kr = {k: r for k, r in kernel_runs().items() if k[0] != "straight"}
    rows = [("nb", "complement naive Bayes, the words", 14, "nb", harness_choose(nb_runs())[0]),
            ("lr", "logistic regression, TF-IDF", 15, "other", harness_choose(lr_runs())[0]),
            ("svm", "the linear SVM, TF-IDF", 16, "svm", harness_choose(svm_runs())[0]),
            ("rbf", "the kernel SVM (RBF)", 17, "other", harness_choose(kr)[0]),
            ("knn", "nearest neighbours", 17, "other", harness_choose(knn_runs())[0]),
            ("forest", "a random forest", 17, "other", harness_choose(forest_runs())[0]),
            ("boost", "boosted trees", 17, "other", harness_choose(boosted_runs())[0])]
    for model in ("nb", "svm"):
        who = "naive Bayes" if model == "nb" else "the SVM"
        rows += [(model + "4", "%s + all four readings" % who, 18, model, sr[model]["ok"]),
                 (model + "h", "%s + the sender's history" % who, 18, model,
                  choose_history(history_runs(model), sr[model]["picks"])[0]),
                 (model + "e", "%s + bge-large" % who, 19, model, fused[model, EMB_BASES[2], "bge-large"][0])]
    rows.append(("both", "both full models together", 20, "both", both_choose()[0]))
    return rows


def act5_ladder():
    section("41. act5_ladder -- every rung of act 5 on the harness, and whom each one reached")
    r0 = feature_runs("words")["nb", BF_ALPHA[0]]
    met = r0["met"]
    rows = ladder_runs()
    for key, _, _, _, ok in rows[:7]:  # the single-model rungs score the same posts in the same order
        assert len(ok) == len(met)
    print("each rung chosen fold by fold on the harness's %d new threads (%d from senders met); share right"
          % (len(met), met.sum()))
    print("with its 95% interval. The page where each rung was built is in brackets.")
    print("  %-40s %-20s %-20s %s" % ("", "all new threads", "senders met", "new senders"))
    out = []
    for key, lbl, page, path, ok in rows:
        cells = {}
        for g, m in (("all", np.ones(len(ok), bool)), ("met", met), ("new", ~met)):
            lo, hi = _ci(ok[m])
            cells[g] = (float(ok[m].mean()), lo, hi)
        print("  %-40s %s" % ("%s (%d)" % (lbl, page), "  ".join("%.3f (%.3f-%.3f)" % cells[g] for g in ("all", "met", "new"))))
        out.append({"key": key, "label": lbl, "page": page, "path": path,
                    **{g: [round(v, 4) for v in cells[g]] for g in cells}})
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "ladder.json").write_text(json.dumps({"n": int(len(met)), "met": int(met.sum()), "rungs": out}, indent=1)
                                          + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 42. Where the router's mistakes land: in their family or out of it (H5), and how near they come
# ------------------------------------------------------------------ #
FAMILIES = (("comp", "comp"), ("rec", "rec"), ("sci", "sci"), ("politics", "talk.politics"),
            ("religion", "religion"), ("misc.forsale", "misc.forsale"))
RELIGION = ("alt.atheism", "soc.religion.christian", "talk.religion.misc")
TOP_PAIRS = 10  # the most common misroutes printed


def family_of(forum):
    """H5's families, as the register wrote them: the forums' own name groups, the three about religion
    together; misc.forsale belongs to none."""
    if forum in RELIGION:
        return "religion"
    for f in ("comp", "rec", "sci"):
        if forum.startswith(f + "."):
            return f
    return "politics" if forum.startswith("talk.politics.") else forum


def router_sets():
    """The router on the harness (each fold with page 19's picks) and on the later new threads (fitted on
    every earlier post): scores, forums, and each post's sender group (page 18's)."""
    if "router" not in _BF:
        d = data()
        y = np.concatenate(_fold_y())
        nw = np.where(d["new"])[0]
        yb = d["yte"][nw]
        Lc = sender_counts(range(len(d["ytr"])), [author_of(d["Pte"][q]) for q in nw])
        _BF["router"] = {"harness": dict(S=full_scores("nb"), y=y, grp=_groups(np.concatenate(harness_history()), y),
                                         Hc=np.concatenate(harness_history())),
                         "later": dict(S=later_full("nb")[0], y=yb, grp=_groups(Lc, yb), Hc=Lc, rows=nw)}
        fam = np.array([family_of(n) for n in d["names"]])
        for r in _BF["router"].values():
            r["p"] = r["S"].argmax(1)
            r["err"] = r["p"] != r["y"]
            r["inf"] = fam[r["p"]] == fam[r["y"]]
            r["rank"], r["gap"] = _rank(r["S"], r["y"]), margins(r["S"])
    return _BF["router"]


def _rank(S, y):
    """Where the right forum stands in the router's order: 1 is first."""
    return (S > S[np.arange(len(y)), y][:, None]).sum(1) + 1


def misroutes():
    section("42. misroutes -- where the router's mistakes land: in their family or out of it")
    d = data()
    names = d["names"]
    fam = np.array([family_of(n) for n in names])
    size = collections.Counter(fam)
    label = dict(FAMILIES)
    R = router_sets()
    print("the router (complement naive Bayes reading all four, the sender's history and bge-large): each harness")
    print("fold with the picks page 19 made, and fitted on all %d earlier posts for the later new threads." % len(d["ytr"]))
    print("families: comp (5 forums), rec (4), sci (4), talk.politics (3), and religion (3: %s," % RELIGION[0])
    print("%s). misc.forsale belongs to none." % ", ".join(RELIGION[1:]))
    print()
    print("  %-26s %-22s %s" % ("", "harness", "later new threads (report only)"))
    rows, out = collections.defaultdict(list), {}
    for key in ("harness", "later"):
        y, p, err, inf, rank = (R[key][q] for q in ("y", "p", "err", "inf", "rank"))
        lo, hi = _boot(lambda i: inf[i][err[i]].mean(), len(y))
        chance = float(np.mean([(size[fam[k]] - 1) / 19 for k in y[err]]))
        rows["new threads"].append("%d" % len(y))
        rows["routed right"].append("%.4f" % (~err).mean())
        rows["misrouted"].append("%d" % err.sum())
        rows["in their own family"].append("%.3f (%.3f-%.3f)" % (inf[err].mean(), lo, hi))
        rows["if they fell at random"].append("%.3f" % chance)
        rows["in the right family"].append("%.3f" % (fam[p] == fam[y]).mean())
        out[key] = {"n": int(len(y)), "right": round(float((~err).mean()), 4), "wrong": int(err.sum()),
                    "infam": [round(float(inf[err].mean()), 4), round(float(lo), 4), round(float(hi), 4)],
                    "chance": round(chance, 4),
                    "forums": [{"n": int((y == k).sum()), "to": np.bincount(p[(y == k) & err], minlength=20).tolist()}
                               for k in range(20)],
                    "rank": [round(float((rank[err] <= q).mean()), 4) for q in (2, 3, 5)],
                    "top3": round(float((rank <= 3).mean()), 4)}
        if key == "harness":
            verdict = "settled above half" if lo > 0.5 else "settled at half or below" if hi <= 0.5 else "not settled"
    for k, v in rows.items():
        print("  %-26s %-22s %s" % (k, v[0], v[1]))
    h = R["harness"]
    print("H5, more than half of the misroutes in their own family: harness %.3f, interval %.3f-%.3f: %s"
          % tuple(out["harness"]["infam"] + [verdict]))

    y, p, err, inf = h["y"], h["p"], h["err"], h["inf"]
    print()
    print("the harness's misroutes by the family they were posted in:")
    print("  %-14s %11s %7s %10s %10s %10s" % ("", "new threads", "right", "misrouted", "in family", "at random"))
    for f, lbl in FAMILIES:
        m = fam[y] == f
        e = err & m
        print("  %-14s %11d %7.3f %10d %10.3f %10.3f" % (lbl, m.sum(), (~err)[m].mean(), e.sum(), inf[e].mean(),
                                                       (size[f] - 1) / 19))
    off = err & ~inf
    print("the %d misroutes that leave their family, by the family they land in:" % off.sum())
    print("  %s" % ", ".join("%s %d" % (label[f], c) for f, c in collections.Counter(fam[p[off]]).most_common()))
    fs = names.index("misc.forsale")
    side = err & ((y == fs) | (p == fs))
    print("misroutes with misc.forsale on either side: %d of %d (posted there %d, routed there %d); the other %d"
          % (side.sum(), err.sum(), (err & (y == fs)).sum(), (err & (p == fs)).sum(), (err & ~side).sum()))
    print("stay in their family %.3f of the time" % inf[err & ~side].mean())
    print()
    print("the most common misroutes, posted -> routed (harness, then later):")
    for key in ("harness", "later"):
        r = R[key]
        e = r["err"]
        for (a, b), c in collections.Counter(zip(r["y"][e], r["p"][e])).most_common(TOP_PAIRS if key == "harness" else 5):
            print("  %-7s %3d  %-24s -> %-25s %s" % (key, c, names[a], names[b],
                                                    "same family" if fam[a] == fam[b] else "another family"))
    av, L = audited(), R["later"]
    pm, pg = names.index("talk.politics.misc"), names.index("talk.politics.guns")
    moved = L["rows"][L["err"] & (L["y"] == pm) & (L["p"] == pg)]
    print("of the %d later talk.politics.misc -> talk.politics.guns, %d name Waco, Koresh, the Davidians or the BATF"
          % (len(moved), sum(bool(WACO_RE.search(av["B"][q])) for q in moved)))
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "misroutes.json").write_text(json.dumps(
        {"names": list(names), "families": [[f, lbl, [k for k in range(20) if fam[k] == f]] for f, lbl in FAMILIES],
         **out}, separators=(",", ":")) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 43. How near the misroutes come: the right forum's place in the router's order, and the gap
# ------------------------------------------------------------------ #
def near_misses():
    section("43. near_misses -- how near the router's misroutes come, in its order and in its gap")
    R = router_sets()
    h = R["harness"]
    y, p, err, inf = h["y"], h["p"], h["err"], h["inf"]
    print("how near: where the router ranked the right forum, on its misroutes (harness / later)")
    for k, lbl in ((2, "second"), (3, "in its top three"), (5, "in its top five")):
        a, b = (R[q]["rank"][R[q]["err"]] for q in ("harness", "later"))
        print("  %-18s %.3f / %.3f" % (lbl, (a == 2).mean() if k == 2 else (a <= k).mean(),
                                       (b == 2).mean() if k == 2 else (b <= k).mean()))
    print("  on every new thread, the right forum in the router's top three: %.3f / %.3f"
          % tuple((R[q]["rank"] <= 3).mean() for q in ("harness", "later")))
    print("  misroutes in their family with the right forum second %.3f, the others %.3f (harness)"
          % ((h["rank"][err & inf] == 2).mean(), (h["rank"][err & ~inf] == 2).mean()))
    print()
    g, ok = h["gap"], ~err
    print("the gap between the router's top two scores (harness), and how well it sorts posts routed right from")
    print("each kind of misroute (the chance a right post has the larger gap):")
    a_in = lambda i: _gap_auc(ok[i][ok[i] | inf[i]], g[i][ok[i] | inf[i]])
    a_off = lambda i: _gap_auc(ok[i][ok[i] | ~inf[i]], g[i][ok[i] | ~inf[i]])
    al = np.arange(len(y))
    print("  %-30s median gap %.2f" % ("routed right", np.median(g[ok])))
    print("  %-30s median gap %.2f   %.3f" % ("misrouted, in its family", np.median(g[err & inf]), a_in(al)))
    print("  %-30s median gap %.2f   %.3f" % ("misrouted, out of its family", np.median(g[err & ~inf]), a_off(al)))
    lo, hi = _boot(lambda i: a_in(i) - a_off(i), len(y))
    print("  in family against out of family: %+.3f (%+.3f, %+.3f)" % (a_in(al) - a_off(al), lo, hi))
    print()
    grp, Hc = h["grp"], h["Hc"]
    met = Hc.sum(1) > 0
    nv = grp["never"]
    print("by sender (harness): misroutes from new senders %d (%.3f of theirs), from senders met %d (%.3f)"
          % ((err & ~met).sum(), err[~met].mean(), (err & met).sum(), err[met].mean()))
    print("  to a forum they never had: %d misroutes of %d posts, %d of them to the sender's usual forum"
          % ((err & nv).sum(), nv.sum(), (err & nv & (p == Hc.argmax(1))).sum()))


# ------------------------------------------------------------------ #
# 44. Forty of the misroutes, read by hand
# ------------------------------------------------------------------ #
READ_SEED, READ_N, READ_WORDS = 21, 40, 45
# Each misroute in the sample, read in the router's view and labelled by hand before any counting:
#   either   the post fits both forums: a person who knows the twenty could file it in either
#   missed   it belongs where it was posted, and a person would not pick the router's forum
#   better   it fits the router's forum better than the one it was posted in
#   none     too little to tell, or none of the twenty forums is about what it asks
#   cut      the router's view lost the words that tell (the cleaning cut them as a signature)
# A sale or wanted ad fits misc.forsale and also the forum about what is sold.
READ_LABELS = {
    249: "either", 386: "missed", 544: "either", 755: "none", 796: "missed", 1158: "none", 1272: "either",
    1501: "either", 2047: "either", 2354: "missed", 2754: "none", 3299: "either", 3777: "either", 3996: "either",
    4015: "missed", 4042: "missed", 4375: "none", 4394: "either", 4994: "either", 5182: "either", 5312: "better",
    5485: "none", 5636: "missed", 5819: "either", 6505: "either", 6529: "either", 7147: "either", 7568: "either",
    8141: "none", 8581: "either", 8803: "better", 8827: "either", 9016: "cut", 9164: "missed", 9563: "missed",
    9613: "missed", 10362: "either", 10491: "none", 10585: "either", 10983: "either",
}
READ_SALE = (249, 544, 2047, 3299, 3777, 5182, 6505, 7147, 8803, 9563, 10362, 10585)  # sale or wanted ads
READ_NAMES = {249: ("Jim", "Lewczyk"), 544: ("Timothy", "Duarte", "664", "Westport", "02790"), 796: ("David", "Harr"),
              1272: ("Chera", "Bekker"), 2047: ("Mike",), 3777: ("Bob",), 4015: ("Al", "Dykes"), 5636: ("Manu",),
              10983: ("Scott", "Fleming")}
READ_WORDS_OF = {"either": "fits both forums", "missed": "belongs where it was posted: the router missed",
                 "better": "fits the router's forum better", "none": "too little to tell, or no forum of the twenty",
                 "cut": "the cleaning cut the words that tell"}


def _mask_read(s, names):
    s = re.sub(r"([\w.+%-])([\w.+%-]*)@", lambda m: m.group(1) + "•" * len(m.group(2)) + "@", s)
    s = re.sub(r"\(\d{3}\) \d{3}-\d{4}", lambda m: re.sub(r"\d", "•", m.group(0)), s)
    for n in names:
        s = re.sub(r"\b%s\b" % re.escape(n), lambda m: m.group(0)[0] + "•" * (len(m.group(0)) - 1), s)
    return s


def read_errors():
    section("44. read_errors -- forty of the harness's misroutes, read by hand")
    d, av = data(), audited()
    names = d["names"]
    R = router_sets()
    h = R["harness"]
    y, p, gap, rank = h["y"], h["p"], h["gap"], h["rank"]
    ix = np.concatenate([j[vn] for i, j, Ta, Tb, vn, vm in harness_folds()])
    err = np.where(p != y)[0]
    rows = sorted(np.random.default_rng(READ_SEED).choice(err, READ_N, replace=False))
    assert sorted(int(ix[r]) for r in rows) == sorted(READ_LABELS), "the sample changed; the hand labels no longer apply"
    fam = np.array([family_of(n) for n in names])
    nv = h["grp"]["never"]
    lab = {int(ix[r]): READ_LABELS[int(ix[r])] for r in rows}
    count = collections.Counter(lab.values())
    print("%d of the harness's %d misroutes drawn at random (seed %d), each read in the router's view (the subject"
          % (READ_N, len(err), READ_SEED))
    print("and the body as it saw them) and labelled by hand before counting:")
    for k in ("either", "missed", "better", "none", "cut"):
        sale = sum(1 for q, v in lab.items() if v == k and q in READ_SALE)
        print("  %-48s %3d%s" % (READ_WORDS_OF[k], count[k],
                                  ("   (%d sale or wanted ad%s)" % (sale, "s" if sale > 1 else "")) if sale else ""))
    print("sale or wanted ads among the forty: %d; misc.forsale on one side of %d"
          % (len(READ_SALE), sum(1 for r in rows if names.index("misc.forsale") in (y[r], p[r]))))
    print("in their own family by the register's families: %d of %d" % (sum(fam[y[r]] == fam[p[r]] for r in rows), READ_N))
    miss = [r for r in rows if lab[int(ix[r])] == "missed"]
    print("the %d the router missed: right forum second on %d, median gap %.2f (all misroutes %.2f); %d from a sender"
          % (len(miss), sum(rank[r] == 2 for r in miss), np.median(gap[miss]), np.median(gap[err]),
             sum(nv[r] for r in miss)))
    print("posting to a forum they never had, routed to that sender's usual forum")
    assert all(p[r] == h["Hc"][r].argmax() for r in miss if nv[r])
    spec = []
    for r in rows:
        q = int(ix[r])
        subject, _, body = _mask_read(av["A"][q], READ_NAMES.get(q, ())).partition("\n")
        words = body.split()
        spec.append({"post": q, "forum": names[y[r]], "routed": names[p[r]], "rank": int(rank[r]),
                     "gap": round(float(gap[r]), 2), "label": lab[q], "sale": q in READ_SALE, "subject": subject,
                     "text": " ".join(words[:READ_WORDS]) + (" ..." if len(words) > READ_WORDS else ""),
                     "same": bool(fam[y[r]] == fam[p[r]])})
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "misread.json").write_text(json.dumps({"n": READ_N, "of": int(len(err)), "seed": READ_SEED,
                                                       "posts": spec}, indent=1) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ #
# 45. Automate or hand off: a threshold on the router's gap, set on folds, held next month (H6)
# ------------------------------------------------------------------ #
AUTO_TARGET = 0.95  # the share right the router promises on the posts it files without a person


def final_setting(model="nb", key="bge-large"):
    """The router's one setting, as later_full fits it: (reading, setting, beta, w, C, v)."""
    kd, st = reading_search()[model]["best"]
    hr = history_runs(model)
    hb, hw = max(((b, w) for b in HIST_BETA for w in HIST_W), key=lambda q: (hr[(kd, st) + q]["raw"], -q[1]))
    C, v = _fuse_best(_scores_of(model, True), (kd, st, hb, hw), key)
    assert later_full(model, key)[1] == (st, hb, hw, C, v)
    return kd, st, hb, hw, C, v


def sender_folds():
    """The earlier posts in five folds grouped by sender: (training posts, the fold's new threads). No sender
    is in both parts, so every new thread is scored by a router that has never met its sender."""
    d = data()
    return [(i, j[d["new_tr"][j]]) for i, j in GroupKFold(n_splits=5).split(d["ytr"], d["ytr"], d["authors"])]


def router_fits(parts, key="bge-large"):
    """The router at its one setting, fitted on each part's earlier posts: its scores for that part's posts.
    parts: (training posts, ("tr" or "te", the posts to score)); fitted side by side and cached."""
    d, av, e = data(), audited(), embed_view(key)
    kd, st, hb, hw, C, v = final_setting(key=key)
    T = {"tr": feature_texts(kd, d["Ptr"], av["A"]), "te": feature_texts(kd, d["Pte"], av["B"])}
    au = {"tr": [author_of(p) for p in d["Ptr"]], "te": [author_of(p) for p in d["Pte"]]}
    jobs = []
    for i, (side, jn) in parts:
        (TA, SA0), (TB, SB0) = T["tr"], T[side]
        A, B = [TA[q] for q in i], [TB[q] for q in jn]
        SA, SB = (None, None) if SA0 is None else ([SA0[q] for q in i], [SB0[q] for q in jn])
        jobs.append(("router fit %s nb %g" % (kd, st), (_text_key(A, B, SA or [], SB or []), d["ytr"][i]),
                     functools.partial(_bf_fit, models=("nb",), alphas=(st,), Cs=()),
                     (kd, A, d["ytr"][i], B, SA, SB)))
    out = []
    for (i, (side, jn)), g in zip(parts, _cached_many(jobs)):
        Hc = sender_counts(i, [au[side][q] for q in jn])
        Ea, Eb = e["tr"][i], e[side][jn]
        lr = _cached("router fit embedding logistic %s %g" % (key, C), lambda: emb_fit(Ea, d["ytr"][i], Eb, (C,)),
                     Ea, d["ytr"][i], Eb)["lr_%g" % C]
        out.append(dict(S=g["nb_%g" % st] + hw * history_term(Hc, hb) + v * lr, met=Hc.sum(1) > 0))
    return out


def router_fits_later(parts, key="bge-large"):
    """router_fits with later posts added to the training: parts are (earlier training posts, later training posts,
    later posts to score), each training post with its own forum. With no later training posts it is router_fits."""
    d, av, e = data(), audited(), embed_view(key)
    kd, st, hb, hw, C, v = final_setting(key=key)
    (TA, SA0), (TB, SB0) = feature_texts(kd, d["Ptr"], av["A"]), feature_texts(kd, d["Pte"], av["B"])
    au_tr, au_te = d["authors"], [author_of(p) for p in d["Pte"]]
    jobs, ys = [], []
    for i, l, jn in parts:
        l = np.asarray(l, dtype=int)
        A, B = [TA[q] for q in i] + [TB[q] for q in l], [TB[q] for q in jn]
        SA = None if SA0 is None else [SA0[q] for q in i] + [SB0[q] for q in l]
        SB = None if SB0 is None else [SB0[q] for q in jn]
        ya = np.concatenate([d["ytr"][i], d["yte"][l]])
        ys.append(ya)
        jobs.append(("router fit %s nb %g" % (kd, st), (_text_key(A, B, SA or [], SB or []), ya),
                     functools.partial(_bf_fit, models=("nb",), alphas=(st,), Cs=()), (kd, A, ya, B, SA, SB)))
    out = []
    for (i, l, jn), ya, g in zip(parts, ys, _cached_many(jobs)):
        l = np.asarray(l, dtype=int)
        H = collections.defaultdict(lambda: np.zeros(20))
        for a, k in zip([au_tr[q] for q in i] + [au_te[q] for q in l], ya):
            H[a][k] += 1
        Hc = np.array([H[au_te[q]] if au_te[q] in H else np.zeros(20) for q in jn])
        Ea, Eb = np.concatenate([e["tr"][i], e["te"][l]]), e["te"][jn]
        lr = _cached("router fit embedding logistic %s %g" % (key, C), lambda: emb_fit(Ea, ya, Eb, (C,)),
                     Ea, ya, Eb)["lr_%g" % C]
        out.append(dict(S=g["nb_%g" % st] + hw * history_term(Hc, hb) + v * lr, met=Hc.sum(1) > 0))
    return out


def later_article_numbers():
    """Each later post's article number: the order the collecting server received it, per forum."""
    if "art later" not in _BF:
        te = fetch_20newsgroups(subset="test")
        assert (te.target == data()["yte"]).all()
        _BF["art later"] = np.array([int(re.search(r"(\d+)$", str(f)).group(1)) for f in te.filenames])
    return _BF["art later"]


def later_halves():
    """Each forum's later posts split at their median article number: (first half, second half), as indices
    into the later posts."""
    yte, art = data()["yte"], later_article_numbers()
    first = np.zeros(len(yte), bool)
    for k in range(20):
        idx = np.where(yte == k)[0]
        first[idx[art[idx] <= np.median(art[idx])]] = True
    return np.where(first)[0], np.where(~first)[0]


def sender_scores():
    """The router on folds grouped by sender: scores for every earlier new thread (in sender_folds order) and
    their forums. The history adds nothing here: no sender has been met."""
    if "sender" not in _BF:
        folds = sender_folds()
        got = router_fits([(i, ("tr", jn)) for i, jn in folds])
        assert not any(g["met"].any() for g in got), "a sender-grouped fold has met one of its senders"
        rows = np.concatenate([jn for i, jn in folds])
        _BF["sender"] = dict(S=np.concatenate([g["S"] for g in got]), y=data()["ytr"][rows], rows=rows)
    return _BF["sender"]


def time_scores(frac=SPLIT_FRACS[0]):
    """The router fitted on each forum's earliest posts (by article number, page 11) and scored on the new
    threads among each forum's latest frac."""
    if ("time", frac) not in _BF:
        d = data()
        ytr, art = d["ytr"], _article_numbers()
        val = np.zeros(len(ytr), bool)
        for k in range(20):
            idx = np.where(ytr == k)[0]
            val[idx[art[idx] > np.quantile(art[idx], 1 - frac)]] = True
        jn = np.where(val & d["new_tr"])[0]
        g = router_fits([(np.where(~val)[0], ("tr", jn))])[0]
        _BF["time", frac] = dict(S=g["S"], y=ytr[jn], met=g["met"], rows=jn)
    return _BF["time", frac]


def fold_models_later():
    """The five harness fold models (thread-grouped, the router's one setting) each scoring the later new
    threads: is the slip the refit on all earlier posts, or the month?"""
    if "fold later" not in _BF:
        nw = np.where(data()["new"])[0]
        _BF["fold later"] = router_fits([(i, ("te", nw)) for i, j, Ta, Tb, vn, vm in harness_folds()])
    return _BF["fold later"]


def gap_threshold(gap, ok, tgt=AUTO_TARGET, w=None):
    """The smallest gap at which the posts, surest first, are still right at tgt (each post weighted by w)."""
    w = np.ones(len(gap)) if w is None else w
    o = np.argsort(-gap, kind="stable")
    run = np.cumsum((ok * w)[o]) / np.cumsum(w[o])
    return float(gap[o][np.where(run >= tgt)[0].max()])



def _verdict(lo, hi, line=AUTO_TARGET):
    return "confirmed" if lo >= line else "wrong" if hi < line else "not settled"


def _held(ok, gap, t):
    """Posts at or above threshold t: which they are, their share right and its 95% interval."""
    a = gap >= t
    lo, hi = _boot(lambda i: ok[i][a[i]].mean(), len(ok))
    return a, float(ok[a].mean()), float(lo), float(hi)


def _largest_block():
    """Earlier posts joined when they share a sender or a thread: the size of the largest joined block."""
    d = data()
    par = list(range(len(d["ytr"])))

    def find(a):
        while par[a] != a:
            par[a] = par[par[a]]
            a = par[a]
        return a
    for key in ("authors", "threads"):
        first = {}
        for q, k in enumerate(d[key]):
            if k in first:
                par[find(q)] = find(first[k])
            else:
                first[k] = q
    return collections.Counter(find(q) for q in range(len(par))).most_common(1)[0][1]


def auto_thresholds():
    """The 95% threshold set three ways on the earlier posts (the harness, folds grouped by sender, the harness
    reweighted to the later mix of senders), each with the posts it was set on, and the later posts' own."""
    if "auto" not in _BF:
        av, L = audited(), router_sets()["later"]
        y = router_sets()["harness"]["y"]
        F, ss = fixed_full("nb"), sender_scores()
        hm = np.concatenate([vm[vn] for i, j, Ta, Tb, vn, vm in harness_folds()])
        k = float(av["met"][L["rows"]].mean())
        sets = {"thread": (F.argmax(1) == y, margins(F), None),
                "sender": (ss["S"].argmax(1) == ss["y"], margins(ss["S"]), None),
                "weighted": (F.argmax(1) == y, margins(F), np.where(hm, k / hm.mean(), (1 - k) / (~hm).mean()))}
        T = {key: gap_threshold(g, ok, AUTO_TARGET, w) for key, (ok, g, w) in sets.items()}
        _BF["auto"] = dict(sets=sets, T=T, tL=gap_threshold(L["gap"], ~L["err"]), k=k, hm=hm)
    return _BF["auto"]


def automate():
    section("45. automate -- a threshold on the router's gap, set on folds, held next month (H6)")
    d, av = data(), audited()
    L = router_sets()["later"]
    at = auto_thresholds()
    sets, T, k, hm, tL = at["sets"], at["T"], at["k"], at["hm"], at["tL"]
    ss = sender_scores()
    lok, lg, lmet = ~L["err"], L["gap"], av["met"][L["rows"]]
    lbl = {"thread": "the harness (by thread)", "sender": "folds grouped by sender",
           "weighted": "the harness, reweighted"}
    print("the router files a new thread without a person when the gap between its two best scores reaches a")
    print("threshold, and hands the rest to a moderator with its three best forums. The threshold is the smallest")
    print("gap at which the posts it is set on, surest first, are still right %d%% of the time: set on the earlier"
          % round(100 * AUTO_TARGET))
    print("posts, held on the later ones. (The router at its one setting in every fold, as it runs next month.)")
    print()
    print("  %-26s %-28s %s" % ("", "where it is set:", "the later new threads:"))
    print("  %-26s %5s  %9s  %6s  %6s   %6s  %s" % ("set on", "posts", "threshold", "routed", "right", "routed",
                                                  "right (95% interval)"))
    for key in ("thread", "sender", "weighted"):
        ok, g, w = sets[key]
        a = g >= T[key]
        ww = np.ones(len(ok)) if w is None else w
        b, acc, lo, hi = _held(lok, lg, T[key])
        print("  %-26s %5d  %9.3f  %6.3f  %.4f   %6.3f  %.4f (%.4f-%.4f)" % (
            lbl[key], len(ok), T[key], (ww * a).sum() / ww.sum(), (ww * ok)[a].sum() / ww[a].sum(), b.mean(), acc, lo, hi))
        if key == "sender":
            h6 = (acc, lo, hi)
    print("  (reweighted: each harness post weighted so senders met make up %.1f%%, as in the later posts)" % (100 * k))
    print("the later new threads' own threshold, in hindsight: %.3f, routing %.3f" % (tL, (lg >= tL).mean()))
    print("H6, the sender-grouped threshold delivers %d%% on the later posts: %.4f (%.4f-%.4f): %s"
          % (round(100 * AUTO_TARGET), *h6, _verdict(h6[1], h6[2])))
    print()
    a = lg >= T["thread"]
    sok = sets["sender"][0]
    pos = {q: r for r, q in enumerate(np.concatenate([j[vn] for i, j, Ta, Tb, vn, vm in harness_folds()]))}
    sm = np.array([hm[pos[q]] for q in ss["rows"]])
    fok = sets["thread"][0]
    big = _largest_block()
    print("is it the senders?")
    print("  later, at the harness's threshold, share right: senders met %.4f, new senders %.4f"
          % (lok[a & lmet].mean(), lok[a & ~lmet].mean()))
    print("  on folds grouped by sender the router routes %.4f of the earlier new threads (the harness %.4f): the"
          % (sok.mean(), fok.mean()))
    print("  posts of senders the harness met %.4f, the others %.4f (on the harness %.4f and %.4f)"
          % (sok[sm].mean(), sok[~sm].mean(), fok[hm].mean(), fok[~hm].mean()))
    print("  grouped by sender, a thread's replies can sit in the training folds (page 11). Folds that keep out both")
    print("  the sender and the conversation cannot be built: senders and threads chain %d of the %d earlier"
          % (big, len(d["ytr"])))
    print("  posts (%.1f%%) into one block" % (100 * big / len(d["ytr"])))
    fl = [(r["S"].argmax(1) == L["y"])[margins(r["S"]) >= T["thread"]].mean() for r in fold_models_later()]
    print("is it the refit on every earlier post?")
    print("  each harness fold model on the later new threads, at the harness's threshold: right %.4f to %.4f"
          % (min(fl), max(fl)))
    print("  (the refit %.4f)" % lok[a].mean())


AUTO_FRAC = 0.25  # the time holdout the router's threshold is set on: each forum's latest quarter
AUTO_GRID = np.round(np.arange(0, 4.0001, 0.02), 2)  # the lab's thresholds (each test's own is added)
CHECK_N = (100, 300, 1000)  # filed posts a person might check in a month


def latest_posts():
    section("46. latest_posts -- the threshold set on each forum's latest earlier posts, and the hand-off")
    d = data()
    R = router_sets()
    L = R["later"]
    T = dict(auto_thresholds()["T"])
    lok, lg, rank = ~L["err"], L["gap"], L["rank"]
    print("each forum's latest earlier posts (page 11's time holdouts, by article number): the router fitted on the")
    print("rest, its threshold set on the latest posts' new threads")
    print("  %-12s %7s   %-19s %9s   %s" % ("", "new", "at the harness's %.3f" % T["thread"], "own", "the later new threads:"))
    print("  %-12s %7s   %6s  %-10s %9s   %6s  %s" % ("set on", "threads", "routed", "right", "threshold", "routed",
                                                   "right (95% interval)"))
    curves = {}
    for frac in SPLIT_FRACS:
        ts = time_scores(frac)
        tok, tg = ts["S"].argmax(1) == ts["y"], margins(ts["S"])
        t = gap_threshold(tg, tok)
        a = tg >= T["thread"]
        b, acc, lo, hi = _held(lok, lg, t)
        print("  latest %-5s %7d   %6.3f  %-10.4f %9.3f   %6.3f  %.4f (%.4f-%.4f)" % (
            "%d%%" % round(100 * frac), len(tok), a.mean(), tok[a].mean(), t, b.mean(), acc, lo, hi))
        if frac == AUTO_FRAC:
            T["latest"], curves["latest"] = t, (tok, tg)
    print()
    w = _conversation(d["Pte"], d["new"], threads()["grp"]["later"])
    assert len(w) == len(lok)
    print("the hand-off on the %d later new threads, at the latest quarter's threshold and at the harness's:" % len(lok))
    print("  %-42s %-16s %s" % ("", "latest quarter", "the harness"))
    rows = collections.defaultdict(list)
    for key in ("latest", "thread"):
        a = lg >= T[key]
        bad = a & ~lok
        rows["filed without a person"].append("%d (%.3f)" % (a.sum(), a.mean()))
        rows["  of those, in the wrong forum"].append("%d" % bad.sum())
        rows["  replies that follow them there (page 2)"].append("%d" % round((w[bad] - 1).sum()))
        rows["handed to a moderator"].append("%d (%.3f)" % ((~a).sum(), (~a).mean()))
        rows["  right forum among the router's three"].append("%.3f" % (rank[~a] <= 3).mean())
    for k, v in rows.items():
        print("  %-42s %-16s %s" % (k, v[0], v[1]))
    print("a check of filed posts drawn at random reads a share right of %d%% to within (95%% interval):"
          % round(100 * AUTO_TARGET))
    print("  %s" % ", ".join("%d posts +-%.1f points" % (n, 100 * Z95 * np.sqrt(AUTO_TARGET * (1 - AUTO_TARGET) / n))
                             for n in CHECK_N))

    F = fixed_full("nb")
    ss = sender_scores()
    curves.update(thread=(F.argmax(1) == R["harness"]["y"], margins(F)), sender=(ss["S"].argmax(1) == ss["y"], margins(ss["S"])),
                  later=(lok, lg))
    th = dict(T, later=auto_thresholds()["tL"])
    grid = np.unique(np.concatenate([AUTO_GRID, [th[k] for k in ("thread", "sender", "latest", "later")]]))
    out = {"grid": [round(float(t), 3) for t in grid], "target": AUTO_TARGET, "n": int(len(lok)),
           "thresholds": {k: round(v, 3) for k, v in th.items()}, "curves": {}}
    for key, (ok, g) in curves.items():
        a = g[None, :] >= grid[:, None]
        n = a.sum(1)
        out["curves"][key] = {"posts": int(len(ok)), "routed": np.round(n / len(ok), 4).tolist(),
                              "right": np.round((a & ok[None, :]).sum(1) / np.maximum(n, 1), 4).tolist()}
    hand = ~(lg[None, :] >= grid[:, None])
    out["curves"]["later"]["top3"] = np.round((hand & (rank <= 3)[None, :]).sum(1) / np.maximum(hand.sum(1), 1), 4).tolist()
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "automation.json").write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8")



BUDGETS = (5, 10, 20, 40, 80, 160, 320)  # a new forum's labelled earlier posts (the smallest forum has 377)
BUDGET_SEED = 23
BUDGET_JOBS = 3  # worker processes: each vectorises the posts once (about 1.6 GB) and fits on two threads
_BC = {}


def article_numbers():
    if "art" not in _BF:
        _BF["art"] = _article_numbers()
    return _BF["art"]


def budget_counts():
    """The router's count blocks (page 18's four readings) over every earlier post and the later new threads,
    vectorised once. A refit on fewer posts keeps the columns those posts contain (a piece: in two of them),
    which is what fitting the vectorisers on those posts gives; label_budget asserts that budget_nb on every
    earlier post is the router's own fit."""
    if not _BC:
        d, av = data(), audited()
        nw = np.where(d["new"])[0]
        TA, SA = feature_texts("all", d["Ptr"], av["A"])
        TB, SB = feature_texts("all", [d["Pte"][q] for q in nw], [av["B"][q] for q in nw])
        vw, vs, vp = CountVectorizer(ngram_range=(1, 2)), CountVectorizer(), CountVectorizer(**PIECES)
        _BC["blocks"] = [[(vw.fit_transform(TA).tocsr(), vw.transform(TB).tocsr(), 1),
                          (vs.fit_transform(SA).tocsr(), vs.transform(SB).tocsr(), 1)],
                         [(vp.fit_transform(TA).tocsr(), vp.transform(TB).tocsr(), PIECES["min_df"])]]
    return _BC["blocks"]


def budget_nb(i, st, w=None):
    """The router's naive Bayes (all four readings, alpha st) fitted on the earlier posts i, each weighted by w:
    its scores for the later new threads, one column per forum (-inf for a forum with no posts in i)."""
    blocks = []
    for parts in budget_counts():
        a, b = [], []
        for Ma, Mb, m in parts:
            sub = Ma[i]
            c = np.where(np.bincount(sub.indices, minlength=Ma.shape[1]) >= m)[0]
            a.append(sub[:, c])
            b.append(Mb[:, c])
        blocks.append((sparse.hstack(a).tocsr(), sparse.hstack(b).tocsr()))
    Na, Nb = block_features(blocks, "len")
    m = ComplementNB(alpha=st).fit(Na, data()["ytr"][i], sample_weight=w)
    out = np.full((Nb.shape[0], 20), -np.inf)
    out[:, m.classes_] = np.asarray(Nb @ m.feature_log_prob_.T)
    return out


def _cut(idx, n, how, seed):
    """n of a forum's earlier posts: its first n in the order they reached the server ('first'), its latest n
    ('latest'), or n drawn at random ('random')."""
    o = np.argsort(article_numbers()[idx], kind="stable")
    if how == "first":
        return idx[o[:n]]
    if how == "latest":
        return idx[o[len(o) - n:]]
    return np.random.default_rng(seed).choice(idx, n, replace=False)


def budget_keep(k, n, how="latest", r=0):
    """The earlier posts the router learns from when forum k has only n labelled posts: every other forum's
    posts and n of k's (see _cut; draw r for 'random'). k = -1 cuts every forum to n."""
    ytr = data()["ytr"]
    ks = range(20) if k < 0 else (k,)
    got = [_cut(np.where(ytr == j)[0], n, how, [BUDGET_SEED, j, n, r]) for j in ks]
    rest = np.where(~np.isin(ytr, ks))[0]
    return np.sort(np.concatenate([rest] + got))


def budget_weights(i, k):
    """Weights that give forum k's few posts the pull of a forum of average size: each of k's posts counts as
    (the other forums' posts / 19) / (k's posts); every other post counts once."""
    y = data()["ytr"][i]
    m = y == k
    return np.where(m, (~m).sum() / 19 / m.sum(), 1.0)


def _budget_work(todo, st, C, key):
    """One worker's share of the label-budget fits: each (cache file, earlier posts, weights) fitted and saved."""
    import routing_cases as rc
    from threadpoolctl import threadpool_limits
    d, e = rc.data(), rc.embed_view(key)
    nw = rc.np.where(d["new"])[0]
    with threadpool_limits(2):
        for f, i, w in todo:
            if f.exists():
                continue
            # emb_fit's fit, with the weights, and one column per forum (-inf for a forum with no posts in i)
            m = rc.LogisticRegression(C=C, max_iter=rc.EMB_ITER).fit(e["tr"][i], d["ytr"][i], sample_weight=w)
            assert m.n_iter_.max() < rc.EMB_ITER, "logistic regression on the embedding stopped short"
            lr = rc.np.full((len(nw), 20), -rc.np.inf)
            lr[:, m.classes_] = m.predict_log_proba(e["te"][nw])
            nb = rc.budget_nb(i, st, w)
            tmp = f.with_suffix(".tmp")
            with open(tmp, "wb") as fh:
                rc.np.savez(fh, nb=nb, lr=lr)
            os.replace(tmp, f)
    return len(todo)


def budget_fits(specs, weighted=False, key="bge-large"):
    """The router refitted with forum k cut back to n labelled posts, for each spec (k, n, how, r): its naive
    Bayes scores and the embedding's log-probabilities for the later new threads, and the later senders'
    earlier posts by forum. weighted: k's posts weighted up (budget_weights). Missing fits are computed by
    BUDGET_JOBS workers side by side and cached."""
    from joblib import Parallel, delayed
    d, av = data(), audited()
    kd, st, hb, hw, C, v = final_setting(key=key)
    assert kd == "all", kd
    tk = _text_key(av["A"], av["B"])
    keep = [budget_keep(*s) for s in specs]
    ws = [budget_weights(i, s[0]) if weighted else None for i, s in zip(keep, specs)]
    tag = "label budget %s nb %g, %s logistic %g" % (kd, st, key, C) + (" weighted" if weighted else "")
    files = [_cache_file(tag, tk, i) for i in keep]
    todo = [(f, i, w) for f, i, w in zip(files, keep, ws) if not f.exists()]
    if todo:
        NL_CACHE.mkdir(parents=True, exist_ok=True)
        chunks = [todo[w::BUDGET_JOBS] for w in range(BUDGET_JOBS)]
        Parallel(n_jobs=BUDGET_JOBS)(delayed(_budget_work)(c, st, C, key) for c in chunks if c)
    nw = np.where(d["new"])[0]
    senders = [author_of(d["Pte"][q]) for q in nw]
    out = []
    for f, i in zip(files, keep):
        z = np.load(f)
        out.append(dict(nb=z["nb"], lr=z["lr"], Hc=sender_counts(i, senders)))
    return out



def router_threshold():
    """The router's threshold, set on each forum's latest quarter (page 22)."""
    ts = time_scores(AUTO_FRAC)
    return gap_threshold(margins(ts["S"]), ts["S"].argmax(1) == ts["y"])


def budget_runs(how="latest", weighted=False):
    """Each later new thread read off the run in which its own forum had only n labelled posts, for every n in
    BUDGETS: the router's route and gap, and the words alone's route (naive Bayes, no history, no embedding);
    per run (forum k), the other forums' threads it filed into k and its share right among all it filed."""
    key = ("budget", how, weighted)
    if key not in _BF:
        kd, st, hb, hw, C, v = final_setting()
        y, t = router_sets()["later"]["y"], router_threshold()
        res = {}
        for n in BUDGETS:
            fits = budget_fits([(k, n, how, 0) for k in range(20)], weighted)
            pred, gap, words = np.zeros(len(y), int), np.zeros(len(y)), np.zeros(len(y), int)
            into, promise = [], []
            for k, f in enumerate(fits):
                S = f["nb"] + hw * history_term(f["Hc"], hb) + v * f["lr"]
                p, g = S.argmax(1), margins(S)
                m = y == k
                pred[m], gap[m], words[m] = p[m], g[m], f["nb"].argmax(1)[m]
                filed = g >= t
                into.append(int((filed & (p == k) & ~m).sum()))
                promise.append(float((p == y)[filed].mean()))
            res[n] = dict(pred=pred, gap=gap, words=words, into=np.array(into), promise=np.array(promise))
        _BF[key] = res
    return _BF[key]


def budget_every():
    """The textbook learning curve: every forum cut to its latest n earlier posts and the router refitted, right
    or wrong on each later new thread, for every n in BUDGETS."""
    if "budget every" not in _BF:
        kd, st, hb, hw, C, v = final_setting()
        y = router_sets()["later"]["y"]
        fits = budget_fits([(-1, n, "latest", 0) for n in BUDGETS])
        _BF["budget every"] = {n: (f["nb"] + hw * history_term(f["Hc"], hb) + v * f["lr"]).argmax(1) == y
                               for n, f in zip(BUDGETS, fits)}
    return _BF["budget every"]


def _openers(n, k):
    """New threads among forum k's latest n earlier posts: the ones a person filed by hand."""
    d = data()
    return int(d["new_tr"][_cut(np.where(d["ytr"] == k)[0], n, "latest", 0)].sum())


def label_budget():
    section("47. label_budget -- how many labelled posts a new forum needs (E1)")
    d = data()
    ytr = d["ytr"]
    R = router_sets()["later"]
    ok = ~R["err"]
    kd, st, hb, hw, C, v = final_setting()
    full = budget_fits([(0, int((ytr == 0).sum()), "latest", 0)])[0]
    assert np.array_equal(full["nb"], later_readings()["nb", kd][0]), "the label-budget refit is not the router's"
    lr = later_embedding("bge-large", C)
    assert (full["lr"].argmax(1) == lr.argmax(1)).all() and np.abs(full["lr"] - lr).max() < 1e-3
    E, U, F = budget_every(), budget_runs("latest"), budget_runs("first")
    size = len(ytr) / 20
    print("the router refitted at its one setting with fewer labelled posts, scored on the %d later new threads."
          % len(ok))
    print("(the words are counted once for every post; each refit keeps the columns its own posts contain, as a")
    print("fit on those posts alone would, and on every earlier post it reproduces the router exactly)")
    print()
    print("the textbook learning curve: every forum cut to its latest n earlier posts")
    print("  %-14s" % "posts a forum" + "".join("%7d" % n for n in BUDGETS) + "   all (%.0f on average)" % size)
    print("  %-14s" % "routed right" + "".join("%7.3f" % E[n].mean() for n in BUDGETS) + "   %.3f" % ok.mean())
    print()
    print("a new forum among old ones: each forum in turn keeps only its latest n earlier posts, every other forum")
    print("keeps all of its own; each later new thread is read off the run in which its own forum was the new one")
    print("  %5s  %-21s  %-28s  %s" % ("posts", "of them, new threads", "its threads routed right", "its first n instead"))
    for n in BUDGETS:
        a = U[n]["pred"] == R["y"]
        lo, hi = _boot(lambda i: a[i].mean(), len(a))
        print("  %5d  %-21s  %.4f (%.4f-%.4f)        %.4f" % (
            n, "%.1f" % np.mean([_openers(n, k) for k in range(20)]), a.mean(), lo, hi, (F[n]["pred"] == R["y"]).mean()))
    lo, hi = _boot(lambda i: ok[i].mean(), len(ok))
    print("  %5s  %-21s  %.4f (%.4f-%.4f)" % ("all", "%.1f" % (d["new_tr"].sum() / 20), ok.mean(), lo, hi))
    n = 80
    a = U[n]["pred"] == R["y"]
    fam = np.array([family_of(x) for x in d["names"]])
    w = ~a
    print("at %d posts its misrouted threads go to a forum of its own family %.3f of the time" % (
        n, (fam[U[n]["pred"][w]] == fam[R["y"][w]]).mean()))


def budget_weighted():
    section("48. budget_weighted -- the new forum's posts weighted to the pull of an average forum")
    d = data()
    ytr, names = d["ytr"], d["names"]
    R = router_sets()["later"]
    y, ok, g = R["y"], ~R["err"], R["gap"]
    t = router_threshold()
    U, W, E = budget_runs("latest"), budget_runs("latest", True), budget_every()
    print("each of the new forum's n posts counts (the other forums' posts / 19) / n times, in the naive Bayes counts")
    print("and in the embedding's logistic regression; every other post counts once")
    print("  %5s  %6s  %-28s  %-10s  %s" % ("posts", "weight", "its threads routed right", "unweighted",
                                         "the words alone: weighted, unweighted"))
    for n in BUDGETS:
        a = W[n]["pred"] == y
        lo, hi = _boot(lambda i: a[i].mean(), len(a))
        wt = np.mean([budget_weights(budget_keep(k, n), k).max() for k in range(20)])
        print("  %5d  %6.1f  %.4f (%.4f-%.4f)        %.4f      %.4f  %.4f" % (
            n, wt, a.mean(), lo, hi, (U[n]["pred"] == y).mean(), (W[n]["words"] == y).mean(), (U[n]["words"] == y).mean()))
    print("  %5s  %6s  %.4f" % ("all", "", ok.mean()))
    print()
    print("at the router's threshold (%.3f, page 22), the new forum's own later new threads, and the router's" % t)
    print("promise over all of them while that forum is new (the mean of the 20 runs; others = other forums' threads")
    print("filed into the new one, per forum):")
    head = "%12s  %5s  %6s  %7s" % ("filed: right", "wrong", "others", "promise")
    print("  %5s  %-36s   %s" % ("", "unweighted", "weighted"))
    print("  %5s  %s   %s" % ("posts", head, head))
    out = {"budgets": list(BUDGETS), "names": names, "threshold": round(t, 3),
           "posts": np.bincount(ytr).tolist(), "later": np.bincount(y, minlength=20).tolist(),
           "openers": [[_openers(n, k) for n in BUDGETS] for k in range(20)]}

    def counts(pred, gap):
        r, fl = pred == y, gap >= t
        return {key: [int((m & (y == k)).sum()) for k in range(20)] for key, m in (("right", r), ("fr", fl & r),
                                                                                    ("fw", fl & ~r))}
    for name, B in (("as", U), ("weighted", W)):
        rows = [counts(B[n]["pred"], B[n]["gap"]) for n in BUDGETS]
        out[name] = {key: [[rows[j][key][k] for j in range(len(BUDGETS))] for k in range(20)] for key in rows[0]}
        out[name]["into"] = [[int(B[n]["into"][k]) for n in BUDGETS] for k in range(20)]
        out[name]["promise"] = [[round(float(B[n]["promise"][k]), 4) for n in BUDGETS] for k in range(20)]
    out["every"] = [[int((E[n] & (y == k)).sum()) for n in BUDGETS] for k in range(20)]
    for j, n in enumerate(BUDGETS):
        cell = []
        for name, B in (("as", U), ("weighted", W)):
            fr, fw = (sum(out[name][key][k][j] for k in range(20)) / len(y) for key in ("fr", "fw"))
            cell.append("%12.3f  %5.3f  %6.1f  %7.4f" % (fr, fw, B[n]["into"].mean(), B[n]["promise"].mean()))
        print("  %5d  %s   %s" % (n, cell[0], cell[1]))
    fl = g >= t
    into = np.mean([(fl & (R["p"] == k) & (y != k)).sum() for k in range(20)])
    print("  %5s  %12.3f  %5.3f  %6.1f  %7.4f   (every forum with all its posts)" % (
        "all", (fl & ok).mean(), (fl & ~ok).mean(), into, ok[fl].mean()))
    out["full"] = dict(counts(R["p"], g), into=[int((fl & (R["p"] == k) & (y != k)).sum()) for k in range(20)],
                       promise=round(float(ok[fl].mean()), 4))
    n = 80
    fr, fw = (W[n]["pred"] == y) & (W[n]["gap"] >= t), (W[n]["pred"] != y) & (W[n]["gap"] >= t)
    print("weighted at %d posts, the new forum's own threads that are filed are right %.3f of the time (with all its"
          % (n, fr.sum() / (fr | fw).sum()))
    print("posts %.3f); at 160 posts %.3f, at 320 posts %.3f" % (
        ok[fl].mean(), *[((W[m]["pred"] == y) & (W[m]["gap"] >= t)).sum() / (W[m]["gap"] >= t).sum() for m in (160, 320)]))
    k = names.index("comp.os.ms-windows.misc")
    for m in (20, 40):
        got = _cut(np.where(ytr == k)[0], m, "latest", 0)
        uu = [sum(1 for ln in d["raw_tr"][q].splitlines() if UU_RE.match(ln)) for q in got]
        print("comp.os.ms-windows.misc, latest %d posts: %d carry encoded files (%d lines); weighted, routed right %.3f" % (
            m, sum(u >= 10 for u in uu), sum(uu), (W[m]["pred"] == y)[y == k].mean()))
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "labelbudget.json").write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8")



GAP_GRID = np.round(np.geomspace(0.1, 32, 49), 4)  # the lab's thresholds, on a log scale (the gaps run to 25+)
H7_LINE = 0.1  # H7: fewer than one in ten of a left-out forum's threads filed without a person


def left_out_runs():
    """Each forum left out of the training in turn, the router refitted on the other nineteen: every later new
    thread read off the run that left its own forum out (route, gap), and per run the other forums' threads
    (filed, right) and the nearest earlier post's similarity in each forum."""
    if "left out" not in _BF:
        d = data()
        kd, st, hb, hw, C, v = final_setting()
        y = router_sets()["later"]["y"]
        fits = budget_fits([(k, 0, "latest", 0) for k in range(20)])
        nw = np.where(d["new"])[0]
        e = embed_view("bge-large")
        sim = e["te"][nw] @ e["tr"].T
        near = np.stack([sim[:, d["ytr"] == f].max(1) for f in range(20)], 1)
        runs = []
        for k, f in enumerate(fits):
            S = f["nb"] + hw * history_term(f["Hc"], hb) + v * f["lr"]
            assert not (S.argmax(1) == k).any()
            top = np.exp(np.max(f["lr"], 1))
            runs.append(dict(p=S.argmax(1), g=margins(S), near=np.delete(near, k, 1).max(1), top=top))
        _BF["left out"] = runs
    return _BF["left out"]


def left_out():
    section("49. left_out -- a forum the router has never seen (H7)")
    d = data()
    names = d["names"]
    y, t = router_sets()["later"]["y"], router_threshold()
    runs = left_out_runs()
    fam = np.array([family_of(x) for x in names])
    p = np.zeros(len(y), int)
    g = np.zeros(len(y))
    for k, r in enumerate(runs):
        m = y == k
        p[m], g[m] = r["p"][m], r["g"][m]
    filed = g >= t
    lo, hi = _boot(lambda i: filed[i].mean(), len(y))
    other = [(r["g"] >= t, r["p"] == y, y != k) for k, r in enumerate(runs)]
    of = sum((f & m).sum() for f, ok, m in other) / sum(m.sum() for f, ok, m in other)
    oright = sum((f & ok & m).sum() for f, ok, m in other) / sum((f & m).sum() for f, ok, m in other)
    print("each forum in turn is left out of the training entirely; the router, refitted on the other nineteen,")
    print("scores the %d later new threads, and each is read off the run that left its own forum out. A thread is"
          % len(y))
    print("filed without a person when its gap reaches the router's threshold (%.3f, page 22)." % t)
    print("  the left-out forum's threads filed without a person: %.4f (%.4f-%.4f)" % (filed.mean(), lo, hi))
    print("H7, fewer than one in ten of them are filed on their own: %s" % (
        "confirmed" if hi < H7_LINE else "wrong" if lo >= H7_LINE else "not settled"))
    print("  of those filed, into a forum of its own family: %.3f" % (fam[p[filed]] == fam[y[filed]]).mean())
    print("  the other forums' threads in the same runs: filed %.3f, right among filed %.4f" % (of, oright))
    gk = np.concatenate([r["g"][y != k] for k, r in enumerate(runs)])
    print("  median gap: the left-out forum's threads %.3f, the other forums' %.3f" % (np.median(g), np.median(gk)))
    print()
    print("  %-25s %7s  %6s   %s" % ("left out", "threads", "filed", "where most of the filed ones went"))
    for k in range(20):
        m = y == k
        fd = p[m & filed]
        top = int(np.bincount(fd, minlength=20).argmax())
        print("  %-25s %7d  %6.3f   %s (%d)" % (names[k], m.sum(), filed[m].mean(), names[top], (fd == top).sum()))
    print()
    au = {key: np.mean([roc_auc_score(y == k, -r[key]) for k, r in enumerate(runs)]) for key in ("g", "near", "top")}
    print("telling the left-out forum's threads from the others (AUROC, the mean of the 20 runs; 0.5 is chance):")
    print("  the gap %.3f, the nearest earlier post (bge-large) %.3f, the embedding's top probability %.3f" % (
        au["g"], au["near"], au["top"]))
    t10 = float(np.quantile(g, 1 - H7_LINE))
    print("a threshold that files only 10%% of them: %.3f, which files %.3f of the other forums' threads" % (
        t10, (gk >= t10).mean()))
    print("(at the router's threshold, %.3f, it files %.3f of them)" % (t, of))
    caught, cost, base = np.zeros(len(y), bool), 0, 0
    grid = np.unique(np.append(GAP_GRID, round(t, 4)))
    out = {"names": names, "threshold": round(t, 3), "grid": grid.tolist(), "runs": []}
    for k, r in enumerate(runs):
        m = y == k
        fl = r["g"] >= t
        hold = fl & (fam[r["p"]] == fam[k]) if fam[k] != "misc.forsale" else np.zeros(len(y), bool)
        caught[m] = hold[m]
        if fam[k] != "misc.forsale":
            cost += (hold & ~m).sum()
            base += (fl & ~m).sum()
        ge = lambda x: (x[None, :] >= grid[:, None]).sum(1).tolist()  # threads filed at each threshold
        out["runs"].append({"n": int(m.sum()), "filed": np.bincount(r["p"][m & fl], minlength=20).tolist(),
                            "handed": np.bincount(r["p"][m & ~fl], minlength=20).tolist(),
                            "hold": bool(fam[k] != "misc.forsale"), "caught": int(hold[m].sum()),
                            "cost": int((hold & ~m).sum()), "others_filed": int((fl & ~m).sum()),
                            "others": int((~m).sum()), "out_ge": ge(r["g"][m]), "known_ge": ge(r["g"][~m])})
    print("holding the new forum's family for a person (every thread the router would file into that family goes")
    print("to a person instead; misc.forsale has no family): catches %.3f of the left-out forum's filed threads, and"
          % caught[filed].mean())
    print("hands a person %.3f of the other forums' filed threads in the nineteen runs with a family" % (cost / base))
    lo, hi = _boot(lambda i: (filed & ~caught)[i].mean(), len(y))
    print("with the hold, the left-out forum's threads filed without a person: %.4f (%.4f-%.4f)" % (
        (filed & ~caught).mean(), lo, hi))
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "leftout.json").write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8")



def drift():
    section("50. drift -- a subject that moves: Waco, and a refit on the newest posts")
    d, av = data(), audited()
    names = d["names"]
    pm, gu = names.index("talk.politics.misc"), names.index("talk.politics.guns")
    first, second = later_halves()
    nw = np.where(d["new"])[0]
    pos = {q: r for r, q in enumerate(nw)}
    R = router_sets()["later"]
    y, p, g, t = R["y"], R["p"], R["gap"], router_threshold()
    waco = np.array([bool(WACO_RE.search(av["B"][q])) for q in nw])
    print("posts that name Waco, Koresh, the Davidians or the BATF, by forum (the later posts split at each")
    print("forum's median article number):")
    print("  %-26s %5s  %6s  %13s" % ("", "posts", "guns", "politics.misc"))
    for lbl, P, Y in (("earlier posts", av["A"], d["ytr"]),
                      ("later posts, first half", [av["B"][q] for q in first], d["yte"][first]),
                      ("later posts, second half", [av["B"][q] for q in second], d["yte"][second])):
        c = np.array([bool(WACO_RE.search(x)) for x in P])
        print("  %-26s %5d  %6d  %13d" % (lbl, c.sum(), (c & (Y == gu)).sum(), (c & (Y == pm)).sum()))
    print()
    print("the router on the %d later new threads, at its threshold (%.3f):" % (len(y), t))
    print("  %-34s %7s  %6s  %6s  %s" % ("", "threads", "right", "filed", "filed in a wrong forum"))
    for k, lbl in ((pm, "politics.misc"), (gu, "guns")):
        for w in (True, False):
            m = (y == k) & (waco == w)
            print("  %-34s %7d  %6.3f  %6.3f  %d" % ("%s, %s" % (lbl, "naming Waco" if w else "the rest"), m.sum(),
                                                    (p == y)[m].mean(), (g >= t)[m].mean(), ((g >= t) & (p != y))[m].sum()))
    m = (y == pm) & waco & (p == gu)
    print("  politics.misc threads naming Waco routed to guns: %d, %d of them filed (gaps up to %.2f)" % (
        m.sum(), (g[m] >= t).sum(), g[m].max()))
    H = router_sets()["harness"]
    print("  talk.politics.misc routed right: the harness %.3f, the later new threads %.3f" % (
        (H["p"] == H["y"])[H["y"] == pm].mean(), (p == y)[y == pm].mean()))
    print()
    s2 = second[d["new"][second]]
    ytr, art = d["ytr"], article_numbers()
    drop = [np.where(ytr == k)[0][np.argsort(art[ytr == k], kind="stable")[:int((d["yte"][first] == k).sum())]]
            for k in range(20)]
    slide = np.setdiff1d(np.arange(len(ytr)), np.concatenate(drop))
    grow_r, slide_r = router_fits_later([(np.arange(len(ytr)), first, s2), (slide, first, s2)])
    ys = d["yte"][s2]
    S0 = R["S"][[pos[q] for q in s2]]
    w2, m2 = waco[[pos[q] for q in s2]], ys == pm
    base = S0.argmax(1) == ys
    print("refitted with the later posts' first half (%d posts, each with its forum) and scored on the second"
          % len(first))
    print("half's %d new threads. 'slide' keeps the size: it drops as many of each forum's oldest earlier posts"
          % len(s2))
    print("as the first half adds")
    print("  %-10s %-31s  %-13s  %s" % ("", "right (vs as fitted)", "politics.misc", "its Waco threads to guns"))
    for lbl, S in (("as fitted", S0), ("grow", grow_r["S"]), ("slide", slide_r["S"])):
        ok = S.argmax(1) == ys
        pr = _paired(ok, base, check=False)
        dif = "" if lbl == "as fitted" else "(%+.2f, %+.2f to %+.2f)" % (100 * pr["diff"], 100 * pr["lo"], 100 * pr["hi"])
        print("  %-10s %.4f %-24s  %.3f (%d)     %d of %d" % (lbl, ok.mean(), dif, ok[m2].mean(), m2.sum(),
                                                         (S.argmax(1) == gu)[m2 & w2].sum(), (m2 & w2).sum()))



# ------------------------------------------------------------------ #
# 51. The whole system on next month's posts (page 25)
# ------------------------------------------------------------------ #
def later_all_scores():
    """The router fitted on every earlier post, scoring every later post, replies included (cached)."""
    if "later all" not in _BF:
        d = data()
        S = router_fits_later([(np.arange(len(d["ytr"])), [], np.arange(len(d["yte"])))])[0]["S"]
        assert (S[d["new"]] == router_sets()["later"]["S"]).all(), "the new threads' scores moved"
        _BF["later all"] = S
    return _BF["later all"]


def system_parts():
    """Which later posts the router reads: every new thread, and the first reply (the earliest by article number) of
    each thread whose opener is missing from the data. Every other reply goes where its thread was placed."""
    d, th = data(), threads()
    art, key = later_article_numbers(), [thread_of(p) for p in d["Pte"]]
    miss = collections.defaultdict(list)
    for q in th["grp"]["missing"]:
        miss[key[q]].append(q)
    first = {k: min(v, key=lambda q: (art[q], q)) for k, v in miss.items()}
    return np.where(d["new"])[0], np.array(sorted(first.values())), first, key


def system_run(t):
    """Every later post placed by the system at threshold t: the router files the posts it reads when their gap
    reaches t and hands the rest to a person (whose placement is counted right); a reply goes where its thread lives:
    the earlier posts' forum for a thread filed before the cut-off, otherwise where its opener (or first reply) was
    placed. Returns each post's placement and how it got there."""
    d, th = data(), threads()
    yte, S = d["yte"], later_all_scores()
    nw, orph, first, key = system_parts()
    before, opened = th["before"], th["opened"]
    p, g = S.argmax(1), margins(S)
    routed = np.concatenate([nw, orph])
    placed = np.full(len(yte), -1)
    how = np.full(len(yte), "", dtype=object)
    for q in routed:
        filed = g[q] >= t
        placed[q], how[q] = (p[q], "filed") if filed else (yte[q], "person")
    oc = collections.defaultdict(collections.Counter)
    for q in nw:
        oc[key[q]][placed[q]] += 1
    is_routed = np.zeros(len(yte), bool)
    is_routed[routed] = True
    for q in np.where(~is_routed)[0]:
        k = key[q]
        if k in before:
            f, truth = before[k].most_common(1)[0][0], before[k].most_common(1)[0][0]
        elif k in opened:
            f, truth = oc[k].most_common(1)[0][0], opened[k].most_common(1)[0][0]
        else:
            f, truth = placed[first[k]], yte[first[k]]
        placed[q] = f
        # a lookup miss is the thread's fault when its thread was placed where its own posts mostly are
        how[q] = "lookup" if f == yte[q] else "two forums" if f == truth else "followed"
    return placed, how


def _system_counts(placed, how, yte):
    ok = placed == yte
    return dict(look=int(((how == "lookup") | (how == "two forums") | (how == "followed")).sum()),
                look_right=int((how == "lookup").sum()), two=int((how == "two forums").sum()),
                follow=int((how == "followed").sum()), filed=int((how == "filed").sum()),
                filed_right=int(((how == "filed") & ok).sum()), person=int((how == "person").sum()))


SYSTEM_SHOW = (0.0, 0.5, 2.0, 3.0)  # thresholds printed beside the router's own


def system():
    section("51. system -- the whole system on next month's posts: the lookup, the router and a person")
    d = data()
    yte, names = d["yte"], d["names"]
    S, t = later_all_scores(), router_threshold()
    nw, orph, first, key = system_parts()
    p, g = S.argmax(1), margins(S)
    print("the %d later posts: replies to a thread the system knows go where the thread lives (the lookup, page"
          % len(yte))
    print("2); the router reads the %d new threads and the first reply of each of the %d threads whose opener is"
          % (len(nw), len(orph)))
    print("missing (the earliest by article number), and files those whose gap reaches its threshold (%.3f)" % t)
    print("  %-31s %6s  %6s  %6s  %s" % ("", "posts", "right", "filed", "right among filed"))
    for lbl, ix in (("new threads", nw), ("first replies, opener missing", orph)):
        ok, a = p[ix] == yte[ix], g[ix] >= t
        print("  %-31s %6d  %.4f  %.3f   %.4f" % (lbl, len(ix), ok.mean(), a.mean(), ok[a].mean()))
    placed, how = system_run(t)
    c = _system_counts(placed, how, yte)
    print()
    print("where each later post ends up, at the router's threshold (a person's placements counted right):")
    rows = (("filed by the lookup, right", c["look_right"]), ("filed by the router, right", c["filed_right"]),
            ("given to a person", c["person"]),
            ("wrong: the router's own misfiles", c["filed"] - c["filed_right"]),
            ("wrong: replies that followed them", c["follow"]),
            ("wrong: replies in a thread held in two forums", c["two"]))
    for lbl, n in rows:
        print("  %-46s %5d  %.3f" % (lbl, n, n / len(yte)))
    auto = how != "person"
    ok = placed == yte
    # posts in one thread rise and fall together (a misfiled opener takes its replies), so the interval resamples threads
    ks = {k: i for i, k in enumerate(sorted(set(key)))}
    grp = np.array([ks[k] for k in key])[auto]
    R, N = np.bincount(grp, ok[auto], len(ks)), np.bincount(grp, minlength=len(ks)).astype(float)
    have = N > 0
    R, N = R[have], N[have]
    lo, hi = _boot(lambda i: R[i].sum() / N[i].sum(), len(N))
    print("placed without a person: %d of %d (%.3f), right %.4f (%.4f-%.4f, threads resampled)"
          % (auto.sum(), len(yte), auto.mean(), ok[auto].mean(), lo, hi))
    print("every later post, a person's placements counted right: %.4f" % ok.mean())
    print("(the router alone on every later post, replies included: %.4f; on the replies the lookup files: %.4f,"
          % ((p == yte).mean(), (p == yte)[(how != "filed") & (how != "person")].mean()))
    print(" the lookup %.4f)" % (1 - (c["two"] + c["follow"]) / c["look"]))
    print()
    print("the same system at other thresholds:")
    row = "  %-22s %-18s %-10s %-16s %s"
    print(row % ("threshold", "without a person", "right", "a person reads", "replies that followed a misfile"))
    for th_ in sorted(SYSTEM_SHOW + (t,)) + [np.inf]:
        pl, hw = system_run(th_)
        a = hw != "person"
        lbl = ("%.3f (the router's)" % t if th_ == t else "none filed" if th_ == np.inf
               else "%g%s" % (th_, " (file everything)" if th_ == 0 else ""))
        print(row % (lbl, "%d (%.3f)" % (a.sum(), a.mean()), "%.4f" % (pl == yte)[a].mean(),
                     "%d (%.3f)" % ((~a).sum(), (~a).mean()), _system_counts(pl, hw, yte)["follow"]))
    # the lab's thresholds: page 24's log grid from 0.1 (the gaps run past 25), with 0 and the router's own added
    grid = np.unique(np.concatenate([[0.0], GAP_GRID, [t]]))
    lab = [_system_counts(*system_run(th_), yte) for th_ in list(grid) + [np.inf]]
    # one list per count, a value per threshold on the grid; the last is no threshold at all (a person reads them all)
    out = {"posts": int(len(yte)), "threshold": round(t, 4), "grid": [round(float(x), 4) for x in grid] + [None],
           "router": {"new": int(len(nw)), "orphans": int(len(orph))},
           **{k: [r[k] for r in lab] for k in lab[0]}}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "system.json").write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8")



# ------------------------------------------------------------------ #
# 52-55. The transfer tests (pages 26 and 27): two new text datasets, downloaded once from the UCI repository
# into ~/scikit_learn_data/transfer (the SMS Spam Collection v.1 and Reuters-21578)
# ------------------------------------------------------------------ #
TRANSFER = pathlib.Path.home() / "scikit_learn_data" / "transfer"
SMS_FILE = TRANSFER / "sms" / "SMSSpamCollection"
SMS_BUDGET = 0.005  # the spam folder's promise: at most 1 real message in 200 sent there
# the lab's budgets: 1 real message in 1000, 667, 500, ... 20
SMS_GRID = np.round(1 / np.array([1000, 667, 500, 333, 250, 200, 167, 125, 100, 80, 67, 50, 40, 33, 25, 20]), 6)
# added to every real message for the stress test; 07700 900xxx is a range the UK regulator keeps for drama
SMS_ADD = (("a phone number", " Call me on 07700 900123."), ("a web link", " It's on www.bbc.co.uk/news"),
           ("a pound amount", " That's £15 each."))
SMS_URL = re.compile(r"(https?://\S+|www\.\S+|\b\S+\.(com|co\.uk|net|org|biz)\S*)", re.I)
SMS_PLACEHOLDER = re.compile(r"&lt;[^&]{0,20}&gt;")
_SMS = {}


def sms_data():
    """The SMS Spam Collection: each message, spam or not, and its copy group (the text with digits, case and spacing
    ignored), which keeps a campaign's copies in one fold."""
    if not _SMS:
        rows = [ln.split("\t", 1) for ln in SMS_FILE.read_text(encoding="utf-8").split("\n") if ln.strip()]
        T = [r[1] for r in rows]
        key = [re.sub(r"\s+", " ", re.sub(r"\d", "0", t.lower())).strip() for t in T]
        ids = {k: i for i, k in enumerate(dict.fromkeys(key))}
        _SMS.update(T=T, y=np.array([r[0] == "spam" for r in rows]), key=key, groups=np.array([ids[k] for k in key]))
    return _SMS


def sms_scrub(t):
    """The collectors' cleaning of the real messages, applied to every message: links, then numbers, become placeholders."""
    return re.sub(r"\d+", "&lt;#&gt;", SMS_URL.sub(" &lt;URL&gt; ", t))


def sms_embed():
    """bge-large on every message and on every real message with each stress addition (encoded once on the GPU, cached)."""
    s = sms_data()
    ham = np.where(~s["y"])[0]
    texts = [s["T"]] + [[s["T"][q] + add for q in ham] for _, add in SMS_ADD]
    tk = _text_key(*texts)
    f = CACHE / "transfer" / "sms_bge-large.npz"
    if not f.exists():
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        from sentence_transformers import SentenceTransformer
        m = SentenceTransformer(EMBEDDERS["bge-large"], device="cuda")
        enc = lambda T: m.encode(T, batch_size=64, normalize_embeddings=True, show_progress_bar=False,
                                 convert_to_numpy=True).astype(np.float32)
        f.parent.mkdir(parents=True, exist_ok=True)
        np.savez(f, all=enc(texts[0]), **{"add%d" % a: enc(T) for a, T in enumerate(texts[1:])}, key=tk)
    z = np.load(f)
    assert (z["key"] == tk).all(), "the SMS texts changed since they were encoded"
    return z["all"], [z["add%d" % a] for a in range(len(SMS_ADD))]


SMS_FILTERS = (("words", dict(kind="words")), ("pieces of words", dict(kind="pieces")),
               ("bge-large", dict(kind="embedding")), ("words, scrubbed", dict(kind="words", scrub=True)),
               ("pieces, scrubbed", dict(kind="pieces", scrub=True)))


def sms_runs(kind, scrub=False, grouped=True):
    """One filter on five folds (copies kept together, or at random): its score for every message, and for every real
    message with each stress addition, from the fold that held it out. The SVMs and the logistic regression all at C=1."""
    s = sms_data()
    T, y, groups = s["T"], s["y"], s["groups"]
    pre = sms_scrub if scrub else (lambda t: t)
    ham = np.where(~y)[0]
    pos = {q: r for r, q in enumerate(ham)}
    if kind == "embedding":
        E, EA = sms_embed()
    sp = StratifiedGroupKFold(5, shuffle=True, random_state=0) if grouped else StratifiedKFold(5, shuffle=True, random_state=0)
    sc, cf = np.zeros(len(T)), np.zeros((len(SMS_ADD), len(T)))
    for i, j in sp.split(T, y, groups):
        jh = j[~y[j]]
        if kind == "embedding":
            m = LogisticRegression(C=1.0, max_iter=EMB_ITER).fit(E[i], y[i])
            assert m.n_iter_.max() < EMB_ITER
            sc[j] = m.decision_function(E[j])
            for a in range(len(SMS_ADD)):
                cf[a, jh] = m.decision_function(EA[a][[pos[q] for q in jh]])
            continue
        v = TfidfVectorizer(sublinear_tf=True, **({} if kind == "words" else PIECES))
        m = svm_fit(v.fit_transform([pre(T[q]) for q in i]), y[i], 1.0)
        sc[j] = m.decision_function(v.transform([pre(T[q]) for q in j]))
        for a, (_, add) in enumerate(SMS_ADD):
            cf[a, jh] = m.decision_function(v.transform([pre(T[q] + add) for q in jh]))
    return sc, cf


def sms_at(sc, cf, y, budget):
    """The threshold that sends at most budget of the real messages to the spam folder: spam caught, and the share of
    real messages sent there once each stress addition is made."""
    th = np.quantile(sc[~y], 1 - budget, method="higher")
    return float((sc[y] > th).mean()), [float((c[~y] > th).mean()) for c in cf]


def sms():
    section("52. sms -- transfer near: 5574 text messages, and who made them")
    s = sms_data()
    T, y, key = s["T"], s["y"], s["key"]
    ck = collections.Counter(key)
    print("messages %d: real %d, spam %d (%.3f)" % (len(T), (~y).sum(), y.sum(), y.mean()))
    print("where they came from (the collection's readme): spam from a UK complaints forum (425) and an earlier spam")
    print("corpus (322); real messages from a corpus of Singapore university students' texts (3375), a UK thesis (450)")
    print("and the earlier corpus (1002). No dates and no senders.")
    print()
    rep = len(T) - len(set(T))
    has = np.array([ck[k] > 1 for k in key])
    print("copies: %d messages repeat an earlier one word for word; with digits, case and spacing ignored, %d distinct"
          % (rep, len(ck)))
    lab = collections.defaultdict(set)
    for k, l in zip(key, y):
        lab[k].add(bool(l))
    print("  spam with a copy %d of %d (%.3f), real %d of %d (%.3f); copies with both labels: %d" % (
        (has & y).sum(), y.sum(), has[y].mean(), (has & ~y).sum(), (~y).sum(), has[~y].mean(),
        sum(len(v) > 1 for v in lab.values())))
    ph = np.array([bool(SMS_PLACEHOLDER.search(t)) for t in T])
    kinds = collections.Counter(m for t in T for m in SMS_PLACEHOLDER.findall(t))
    print("the collectors' placeholders, where they took something out: real %d, spam %d" % ((ph & ~y).sum(), (ph & y).sum()))
    print("  " + ", ".join("%s %d" % kv for kv in kinds.most_common()))
    dg = np.array([bool(re.search(r"\d{5,}", t)) for t in T])
    lb = np.array(["£" in t for t in T])
    ln = np.array([len(t) for t in T])
    print("a run of five or more digits: real %d (%.4f), spam %d (%.3f)" % ((dg & ~y).sum(), dg[~y].mean(), (dg & y).sum(), dg[y].mean()))
    print("a pound sign: real %d (%.4f), spam %d (%.3f)" % ((lb & ~y).sum(), lb[~y].mean(), (lb & y).sum(), lb[y].mean()))
    print("median length: real %d characters, spam %d" % (np.median(ln[~y]), np.median(ln[y])))
    print()
    W = collections.defaultdict(list)
    for i, j in StratifiedGroupKFold(5, shuffle=True, random_state=0).split(T, y, s["groups"]):
        v = TfidfVectorizer(sublinear_tf=True)
        m = svm_fit(v.fit_transform([T[q] for q in i]), y[i], 1.0)
        for w, c in zip(v.get_feature_names_out(), m.coef_[0]):
            W[w].append(c)
    mean = {w: np.mean(c) for w, c in W.items() if len(c) == 5}
    o = sorted(mean, key=lambda w: (mean[w], w))
    print("the heaviest words, linear SVM on the words (the mean of five folds):")
    print("  real: " + ", ".join(_ascii(w) for w in o[:16]))
    print("  spam: " + ", ".join(_ascii(w) for w in o[::-1][:16]))
    print("the rule a team would ship: spam when a message holds a run of five or more digits. It catches %.3f of"
          % dg[y].mean())
    print("the spam and sends %d real messages (%.4f) to the spam folder" % ((dg & ~y).sum(), dg[~y].mean()))


def sms_filter():
    section("53. sms_filter -- the filters at 1 real message in 200, and a test the benchmark never runs")
    y = sms_data()["y"]
    print("five folds, copies kept together; each filter's threshold sends at most 1 real message in 200 (0.5%) to")
    print("the spam folder. Then the real messages are scored again with a phone number, a web link or a sum in")
    print("pounds added to each.")
    print("                     accuracy  spam caught at 0.5%   real messages sent to the folder once they carry")
    print("                     (at 0)    random  copies kept  a phone number  a web link  a pound amount")
    lab = {"budgets": SMS_GRID.tolist(), "budget": SMS_BUDGET, "real": int((~y).sum()), "spam": int(y.sum()),
           "adds": [a for a, _ in SMS_ADD], "filters": []}
    for name, kw in SMS_FILTERS:
        sc, cf = sms_runs(**kw)
        rs, _ = sms_runs(**kw, grouped=False)
        caught, blk = sms_at(sc, cf, y, SMS_BUDGET)
        print("  %-18s %.4f    %.3f   %.3f        %.3f           %.3f       %.3f" % (
            name, ((sc > 0) == y).mean(), sms_at(rs, cf, y, SMS_BUDGET)[0], caught, *blk))
        at = [sms_at(sc, cf, y, b) for b in SMS_GRID]
        lab["filters"].append({"name": name, "caught": [round(c, 4) for c, _ in at],
                               "blocked": [[round(b[a], 4) for _, b in at] for a in range(len(SMS_ADD))]})
    print("the additions: ' Call me on 07700 900123.' (a range the UK regulator keeps for drama), ' It's on")
    print("www.bbc.co.uk/news' and ' That's [pound sign]15 each.' 'scrubbed': every link, then every number, replaced")
    print("in both classes the way the collectors replaced them in the real messages")
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "sms.json").write_text(json.dumps(lab, separators=(",", ":")) + "\n", encoding="utf-8")


REUTERS_DIR = TRANSFER / "reuters"
_RT = {}


def _reuters_name(c):
    return re.compile(r"\b%s\b" % re.escape(c.replace("-", " ")), re.I)


def reuters_data():
    """Reuters-21578, the ModApte split: stories marked TOPICS="YES", LEWISSPLIT TRAIN or TEST, restricted to the 90
    topics with a story on each side. Each story is its title and body; its topics a 0/1 row."""
    if not _RT:
        docs = []
        for f in sorted(REUTERS_DIR.glob("reut2-*.sgm")):
            s = f.read_bytes().decode("latin-1")
            for m in re.finditer(r"<REUTERS(.*?)>(.*?)</REUTERS>", s, re.S):
                at, body = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1))), m.group(2)
                tp = re.search(r"<TOPICS>(.*?)</TOPICS>", body, re.S)
                tx = (re.search(r"<TEXT[^>]*>(.*?)</TEXT>", body, re.S) or [None, ""])[1]
                title = (re.search(r"<TITLE>(.*?)</TITLE>", tx, re.S) or [None, ""])[1]
                bod = (re.search(r"<BODY>(.*?)</BODY>", tx, re.S) or [None, ""])[1]
                date = re.search(r"<DATE>\s*(\d+-\w+-\d+)", body).group(1)
                docs.append(dict(split=at.get("LEWISSPLIT"), has=at.get("TOPICS"),
                                 topics=re.findall(r"<D>(.*?)</D>", tp.group(1) if tp else ""),
                                 text=html.unescape(title) + "\n" + html.unescape(bod),
                                 date=time.strptime(date.title(), "%d-%b-%Y")))
        tr = [d for d in docs if d["split"] == "TRAIN" and d["has"] == "YES"]
        te = [d for d in docs if d["split"] == "TEST" and d["has"] == "YES"]
        ctr = collections.Counter(t for d in tr for t in d["topics"])
        cte = collections.Counter(t for d in te for t in d["topics"])
        cats = sorted(t for t in ctr if cte[t] > 0)
        cs = set(cats)
        TR, TE = [d for d in tr if set(d["topics"]) & cs], [d for d in te if set(d["topics"]) & cs]
        Y = lambda ds: np.array([[c in d["topics"] for c in cats] for d in ds]).astype(int)
        # NONE: test stories with none of the 90 topics (in this release, all of them stories with no topic at all)
        _RT.update(cats=cats, TR=TR, TE=TE, NONE=[d for d in te if not set(d["topics"]) & cs],
                   A=[d["text"] for d in TR], B=[d["text"] for d in TE], Ya=Y(TR), Yb=Y(TE))
    return _RT


def reuters_ovr(Xa, Ya, Xbs, cw=None):
    """One linear SVM per topic (C=1): its decision values on each of Xbs. A topic with no story in Xa is never tagged."""
    out = [np.full((X.shape[0], Ya.shape[1]), -10.0) for X in Xbs]
    for k in range(Ya.shape[1]):
        if Ya[:, k].any():
            m = svm_fit(Xa, Ya[:, k], 1.0, class_weight=cw)
            for o, X in zip(out, Xbs):
                o[:, k] = m.decision_function(X)
    return out


def reuters_rule(texts, cats):
    """The rule an editor would write: tag a topic when its name (a hyphen read as a space) is a word in the story."""
    pats = [_reuters_name(c) for c in cats]
    return np.array([[bool(p.search(t)) for p in pats] for t in texts]).astype(int)


def reuters():
    section("54. reuters -- transfer far: 90 topics on 1987 newswire")
    r = reuters_data()
    TR, TE, cats, Ya, Yb = r["TR"], r["TE"], r["cats"], r["Ya"], r["Yb"]
    day = lambda d: time.strftime("%d %b %Y", d["date"]).lstrip("0")
    o = lambda ds: sorted(ds, key=lambda d: d["date"])
    print("the ModApte split of Reuters-21578, by date: %d training stories (%s to %s)," % (
        len(TR), day(o(TR)[0]), day(o(TR)[-1])))
    print("%d test stories (%s to %s); the %d topics with at least one story on each side" % (
        len(TE), day(o(TE)[0]), day(o(TE)[-1]), len(cats)))
    n = Ya.sum(0)
    top = np.argsort(-n, kind="stable")
    print("training stories per topic: " + ", ".join("%s %d" % (cats[k], n[k]) for k in top[:6]) + ", ...")
    print("  median %d; %d topics have 5 or fewer, %d have 20 or fewer" % (np.median(n), (n <= 5).sum(), (n <= 20).sum()))
    print("  the smallest: %s" % ", ".join("%s %d" % (cats[k], n[k]) for k in top[::-1][:5]))
    nl = Yb.sum(1)
    print("topics per test story: one for %d (%.3f), two for %d, three or more for %d (up to %d)" % (
        (nl == 1).sum(), (nl == 1).mean(), (nl == 2).sum(), (nl >= 3).sum(), nl.max()))
    seen = set(r["A"])
    print("test stories that repeat a training story word for word: %d" % sum(b in seen for b in r["B"]))
    assert not any(d["topics"] for d in r["NONE"])
    print("test stories an indexer considered and gave no topic at all: %d" % len(r["NONE"]))


REUTERS_BANDS = ((1, 5), (6, 20), (21, 100), (101, 10 ** 6))


def reuters_tags():
    section("55. reuters_tags -- one yes or no per topic: the average, the tail, and the rule an editor would write")
    r = reuters_data()
    cats, A, B, Ya, Yb = r["cats"], r["A"], r["B"], r["Ya"], r["Yb"]
    n = Ya.sum(0)
    v = TfidfVectorizer(sublinear_tf=True)
    Xa, Xb, Xn = v.fit_transform(A), v.transform(B), v.transform([d["text"] for d in r["NONE"]])
    S, Sn = reuters_ovr(Xa, Ya, [Xb, Xn])
    Sw, = reuters_ovr(Xa, Ya, [Xb], cw="balanced")
    cvs = np.zeros(Ya.shape)
    for i, j in KFold(5, shuffle=True, random_state=0).split(A):
        vv = TfidfVectorizer(sublinear_tf=True)
        cvs[j] = reuters_ovr(vv.fit_transform([A[q] for q in i]), Ya[i], [vv.transform([A[q] for q in j])])[0]
    th = np.zeros(len(cats))
    for k in range(len(cats)):
        # from the highest down, so a tie keeps the stricter threshold; no F1 on the folds keeps the default 0
        cand = np.unique(np.concatenate([[0.0], np.quantile(cvs[:, k], np.linspace(0.5, 1, 200))]))[::-1]
        fs = [f1_score(Ya[:, k], cvs[:, k] > c, zero_division=0) for c in cand]
        th[k] = cand[int(np.argmax(fs))] if max(fs) > 0 else 0.0
    ra, rb = reuters_rule(A, cats), reuters_rule(B, cats)
    use = np.array([f1_score(Ya[:, k], ra[:, k], zero_division=0) >
                    f1_score(Ya[:, k], cvs[:, k] > th[k], zero_division=0) for k in range(len(cats))])
    methods = (("as fitted (threshold 0)", (S > 0).astype(int)), ("balanced weights", (Sw > 0).astype(int)),
               ("thresholds from training folds", (S > th).astype(int)), ("the rule: the topic's name", rb),
               ("model or rule, chosen per topic", np.where(use[None, :], rb, (S > th).astype(int))))
    print("one linear SVM per topic (TF-IDF, C=1), each a yes or no on every story. micro-F1 pools all %d x %d"
          % Yb.shape)
    print("decisions; macro-F1 is the mean of the %d topics' F1" % len(cats))
    band = lambda lo, hi: (n >= lo) & (n <= hi)
    print("  %-33s %-7s %-7s mean F1, topics by training stories" % ("", "micro", "macro"))
    print("  %-33s %-7s %-7s " % ("", "", "") + " ".join("%-7s" % ("%d+" % lo if hi > 10 ** 5 else "%d-%d" % (lo, hi))
                                                      for lo, hi in REUTERS_BANDS).rstrip())
    print("  %-33s %-7s %-7s " % ("(topics)", "", "") + " ".join("%-7d" % band(lo, hi).sum() for lo, hi in REUTERS_BANDS).rstrip())
    F = {}
    for name, P in methods:
        f = f1_score(Yb, P, average=None, zero_division=0)
        F[name] = f
        print("  %-33s %.4f  %.4f  " % (name, f1_score(Yb, P, average="micro"), f.mean())
              + " ".join("%-7.3f" % f[band(lo, hi)].mean() for lo, hi in REUTERS_BANDS).rstrip())
    print("each topic's threshold below the default 0: %d of %d (median %.2f)" % ((th < 0).sum(), len(cats), np.median(th)))
    print("topics never tagged right as fitted: %d; the rule chosen on the training folds for %d topics, %d of the %d"
          % ((F[methods[0][0]] == 0).sum(), use.sum(), use[n <= 5].sum(), (n <= 5).sum()))
    print("with 5 or fewer stories")
    allt, Yall = A + B, np.vstack([Ya, Yb])
    rm, rM = [], []
    for seed in range(3):
        o = np.random.default_rng(seed).permutation(len(allt))
        i, j = o[:len(A)], o[len(A):]
        vv = TfidfVectorizer(sublinear_tf=True)
        Sj, = reuters_ovr(vv.fit_transform([allt[q] for q in i]), Yall[i], [vv.transform([allt[q] for q in j])])
        keep = Yall[i].sum(0) > 0
        rm.append(f1_score(Yall[j][:, keep], (Sj > 0)[:, keep], average="micro"))
        rM.append(f1_score(Yall[j][:, keep], (Sj > 0)[:, keep], average="macro", zero_division=0))
    print("the same stories split at random instead of by date (3 draws of %d / %d), as fitted: micro %.3f-%.3f,"
          % (len(A), len(B), min(rm), max(rm)))
    print("macro %.3f-%.3f (over the topics each draw trains on)" % (min(rM), max(rM)))
    print("the %d test stories an indexer gave no topic: %d get at least one tag as fitted"
          % (len(r["NONE"]), ((Sn > 0).sum(1) > 0).sum()))
    out = {"methods": [m for m, _ in methods],
           "micro": [round(float(f1_score(Yb, P, average="micro")), 4) for _, P in methods],
           "topics": [{"name": c, "train": int(n[k]), "test": int(Yb[:, k].sum()), "rule": bool(use[k]),
                       "f1": [round(float(F[m][k]), 4) for m, _ in methods]} for k, c in enumerate(cats)]}
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    (DATA_OUT / "reuters.json").write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8")


CMDS = dict(headline=headline, population=population, ladder=ladder, embeddings=embeddings,
            specimen=specimen, automation=automation, harness=harness, authors=authors,
            fingerprint=fingerprint, notes_cost=notes_cost, job=job, followers=followers,
            provenance=provenance, senders=senders, parsers=parsers, sample=sample,
            resolution=resolution, first_look=first_look, vectors=vectors, weights=weights,
            channels=channels, channels_job=channels_job, the_split=the_split,
            the_metric=the_metric, metric_choice=metric_choice,
            baselines=baselines, naive_bayes=naive_bayes, logistic=logistic, how_sure=how_sure,
            linear_svm=linear_svm, svm_memory=svm_memory, kernels_trees=kernels_trees,
            kernel_reach=kernel_reach, tree_questions=tree_questions_section,
            better_features=better_features, pieces=what_pieces_read, sender_history=sender_history_section,
            pretrained=pretrained, nearest=nearest_section, embedding_reach=embedding_reach,
            choosing=choosing, act5_ladder=act5_ladder, misroutes=misroutes, near_misses=near_misses,
            read_errors=read_errors, automate=automate, latest_posts=latest_posts,
            label_budget=label_budget, budget_weighted=budget_weighted, left_out=left_out,
            drift=drift, system=system, sms=sms, sms_filter=sms_filter,
            reuters=reuters, reuters_tags=reuters_tags)

if __name__ == "__main__":
    want = sys.argv[1:] or list(CMDS)
    for w in want:
        if w not in CMDS:
            raise SystemExit("unknown: %s. one of %s" % (w, ", ".join(CMDS)))
        CMDS[w]()
