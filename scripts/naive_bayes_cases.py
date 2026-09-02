"""
naive_bayes_cases.py -- measured numbers for the Naive Bayes track
(Classification family). Accent var(--c-classification).

The spine this track rests on:
  NAIVE BAYES IS A GENERATIVE CLASSIFIER WHOSE ABSURD INDEPENDENCE ASSUMPTION
  BREAKS ITS PROBABILITIES BUT USUALLY NOT ITS DECISIONS.
Zero-one loss only needs the argmax to be right, so a model can be badly wrong
about P(y|x) and still classify well. Every claim in the track is measured here.

Run:  python scripts/naive_bayes_cases.py
Env:  python 3.13 / sklearn 1.8 / numpy 2.3  (offline; text is synthetic)
"""

import numpy as np
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification, load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, KBinsDiscretizer
from sklearn.metrics import accuracy_score, log_loss, brier_score_loss

RNG = 0


def rule(title):
    print("\n" + "=" * 74)
    print(title)
    print("=" * 74)


# ==========================================================================
rule("SECTION 1: The generative recipe")
# ==========================================================================
print("Naive Bayes learns P(y) and P(x|y), then uses Bayes' rule to score each")
print("class. Fit GaussianNB on a 2-class, 2-feature problem and read out the")
print("pieces it stored.\n")

Xg, yg = make_classification(n_samples=600, n_features=2, n_informative=2,
                             n_redundant=0, n_clusters_per_class=1,
                             class_sep=1.3, random_state=RNG)
Xtr, Xte, ytr, yte = train_test_split(Xg, yg, test_size=0.3, random_state=RNG)
gnb = GaussianNB().fit(Xtr, ytr)
print(f"  class priors P(y)      : {gnb.class_prior_.round(3)}")
print(f"  class 0 feature means  : {gnb.theta_[0].round(3)}")
print(f"  class 1 feature means  : {gnb.theta_[1].round(3)}")
print(f"  class 0 feature var    : {gnb.var_[0].round(3)}")
print(f"  class 1 feature var    : {gnb.var_[1].round(3)}")
# hand-assemble the posterior for one test point to show Bayes' rule at work
i = 0
x = Xte[i]
logpost = gnb.predict_log_proba([x])[0]
post = np.exp(logpost)
print(f"  test point x           : {x.round(3)}")
print(f"  posterior P(y|x)       : {post.round(4)}  -> predict class {post.argmax()} (true {yte[i]})")
print(f"  test accuracy          : {accuracy_score(yte, gnb.predict(Xte)):.3f}")


# ==========================================================================
rule("SECTION 2: THE SPINE -- probabilities break, decisions survive")
# ==========================================================================
print("Duplicate the whole feature vector k times. Every copy is treated as fresh")
print("independent evidence, so the log-odds are multiplied by k -- the SIGN (the")
print("decision) is unchanged, but the sigmoid of a k-times-larger logit saturates.")
print("Watch the CONFIDENCE explode toward 1.0 while ACCURACY stays flat.\n")

Xb, yb = make_classification(n_samples=2000, n_features=5, n_informative=4,
                             n_redundant=0, n_clusters_per_class=1,
                             class_sep=1.5, flip_y=0.03, random_state=RNG)
Xtr, Xte, ytr, yte = train_test_split(Xb, yb, test_size=0.4, random_state=RNG)

print("  copies of the vector   accuracy   mean max-prob   log-loss   brier")
print("  " + "-" * 63)
for k in [1, 2, 4, 8, 16]:
    Xtr_k = np.tile(Xtr, (1, k))
    Xte_k = np.tile(Xte, (1, k))
    m = GaussianNB().fit(Xtr_k, ytr)
    proba = m.predict_proba(Xte_k)
    acc = accuracy_score(yte, m.predict(Xte_k))
    conf = proba.max(axis=1).mean()
    ll = log_loss(yte, proba)
    br = brier_score_loss(yte, proba[:, 1])
    print(f"  {k:<21} {acc:.3f}      {conf:.3f}         {ll:.3f}      {br:.3f}")
print("\n  The decision is stable; the probability is not. This is why NB is a good")
print("  CLASSIFIER and a poor PROBABILITY estimate.")


# ==========================================================================
rule("SECTION 3: Naive Bayes vs Logistic Regression (Ng-Jordan)")
# ==========================================================================
print("Generative (NB) vs discriminative (LR) on the SAME data, sweeping train")
print("size. NB has higher bias but lower variance: it wins with little data and")
print("is overtaken as data grows.\n")

Xn, yn = make_classification(n_samples=5000, n_features=20, n_informative=8,
                             n_redundant=0, n_clusters_per_class=2,
                             class_sep=0.9, flip_y=0.05, random_state=RNG)
Xpool, Xte, ypool, yte = train_test_split(Xn, yn, test_size=2000, random_state=RNG)
print("  train size     GaussianNB   LogReg    winner")
print("  " + "-" * 48)
for n in [15, 30, 60, 150, 400, 1000, 3000]:
    accs_nb, accs_lr = [], []
    for s in range(15):
        idx = np.random.RandomState(s).choice(len(Xpool), n, replace=False)
        Xt, yt = Xpool[idx], ypool[idx]
        sc = StandardScaler().fit(Xt)
        nb = GaussianNB().fit(Xt, yt)
        lr = LogisticRegression(max_iter=2000).fit(sc.transform(Xt), yt)
        accs_nb.append(accuracy_score(yte, nb.predict(Xte)))
        accs_lr.append(accuracy_score(yte, lr.predict(sc.transform(Xte))))
    a_nb, a_lr = np.mean(accs_nb), np.mean(accs_lr)
    win = "NB" if a_nb > a_lr else "LR"
    print(f"  {n:<12} {a_nb:.3f}        {a_lr:.3f}     {win}")
print("\n  The crossover is the whole story: NB reaches its (biased) asymptote fast.")


# ==========================================================================
rule("SECTION 4: The three flavours")
# ==========================================================================
print("Each flavour is a different P(x|y): Gaussian (continuous), Multinomial")
print("(counts), Bernoulli (binary presence).\n")

# Gaussian on wine (continuous features)
Xw, yw = load_wine(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(Xw, yw, test_size=0.3, random_state=RNG, stratify=yw)
acc_g = accuracy_score(yte, GaussianNB().fit(Xtr, ytr).predict(Xte))
print(f"  GaussianNB on wine (13 continuous features, 3 classes) : {acc_g:.3f}")

# Bernoulli on binarized wine
binz = KBinsDiscretizer(n_bins=2, encode="ordinal", strategy="quantile")
Xtr_b = binz.fit_transform(Xtr)
Xte_b = binz.transform(Xte)
acc_b = accuracy_score(yte, BernoulliNB().fit(Xtr_b, ytr).predict(Xte_b))
print(f"  BernoulliNB on the same features, binarized at the median: {acc_b:.3f}")


# --------------------------------------------------------------------------
# A synthetic bag-of-words corpus for the Multinomial / text sections.
# Two topics, each a categorical distribution over a shared vocabulary; a
# document is a bag of word counts. This is exactly the model MultinomialNB
# assumes, made reproducible without any download.
# --------------------------------------------------------------------------
def make_corpus(seed=RNG, n_docs=1200, vocab=400, doc_len=25,
                n_sig=18, boost=2.4):
    rng = np.random.RandomState(seed)
    # two topic word-distributions with heavy overlap: only a few signature
    # words separate them, and documents are short (little evidence each), so
    # the task is realistic rather than trivially separable.
    base = rng.gamma(0.4, size=vocab)          # shared background vocabulary
    def topic(bias_idx):
        w = base.copy()
        w[bias_idx] *= boost
        return w / w.sum()
    sig_a = rng.choice(vocab, n_sig, replace=False)
    sig_b = rng.choice(vocab, n_sig, replace=False)
    pa, pb = topic(sig_a), topic(sig_b)
    X, y = [], []
    for d in range(n_docs):
        cls = d % 2
        p = pa if cls == 0 else pb
        counts = rng.multinomial(doc_len, p)
        X.append(counts); y.append(cls)
    return np.array(X), np.array(y)

Xc, yc = make_corpus()
Xtr, Xte, ytr, yte = train_test_split(Xc, yc, test_size=0.3, random_state=RNG, stratify=yc)
acc_m = accuracy_score(yte, MultinomialNB().fit(Xtr, ytr).predict(Xte))
print(f"  MultinomialNB on synthetic 2-topic corpus (400-word vocab): {acc_m:.3f}")


# ==========================================================================
rule("SECTION 5: Smoothing and the zero-frequency problem")
# ==========================================================================
print("If a word never appears with a class in training, its smoothed likelihood")
print("collapses and the class is penalised for every such word in a test document.")
print("This bites hardest with a LARGE vocabulary, SHORT documents, and FEW training")
print("docs -- exactly where coverage is sparse. Sweep the smoothing strength alpha.\n")

Xs, ys = make_corpus(seed=RNG, n_docs=400, vocab=1000, doc_len=20,
                     n_sig=40, boost=5.0)
Xstr, Xste, ystr, yste = train_test_split(Xs, ys, test_size=0.5,
                                          random_state=RNG, stratify=ys)
# how sparse is training coverage?
seen0 = (Xstr[ystr == 0].sum(axis=0) > 0).sum()
seen1 = (Xstr[ystr == 1].sum(axis=0) > 0).sum()
print(f"  training docs: {len(Xstr)}   vocabulary: {Xs.shape[1]} words")
print(f"  words ever seen with class 0: {seen0} / {Xs.shape[1]}   "
      f"class 1: {seen1} / {Xs.shape[1]}  (most words unseen per class)\n")
print("  alpha        test accuracy")
print("  " + "-" * 30)
for a in [1e-10, 1e-4, 1e-2, 0.1, 0.5, 1.0, 2.0, 5.0]:
    m = MultinomialNB(alpha=a).fit(Xstr, ystr)
    acc = accuracy_score(yste, m.predict(Xste))
    print(f"  {a:<11} {acc:.3f}")
print("\n  Tiny alpha over-trusts the empty cells; too-large alpha washes the")
print("  signal out. There is a sweet spot, and alpha=0 is never it.")


# ==========================================================================
rule("SECTION 6: Why you must work in log-space")
# ==========================================================================
print("A document likelihood is a product of hundreds of small probabilities.")
print("In float64 that product underflows to exactly 0.0, and every class ties.")
print("Logs turn the product into a sum that stays finite.\n")
rng = np.random.RandomState(RNG)
probs = rng.uniform(0.001, 0.05, size=400)   # 400 per-word likelihoods
prod = np.prod(probs)
logsum = np.sum(np.log(probs))
print(f"  product of 400 small probs (naive)  : {prod:.3e}   (underflowed: {prod == 0.0})")
print(f"  sum of their logs (log-space)       : {logsum:.3f}")
print(f"  recovered via exp only if needed    : exp({logsum:.1f}) is below float min")
print("  Every Naive Bayes implementation scores in log-space for this reason.")


# ==========================================================================
rule("SECTION 7: Calibration -- NB is overconfident")
# ==========================================================================
print("Because it double-counts correlated evidence, NB's probabilities pile up")
print("near 0 and 1. Bin GaussianNB's predicted P(y=1) and compare to the actual")
print("frequency in each bin; do the same for logistic regression.\n")

Xcal, ycal = make_classification(n_samples=4000, n_features=12, n_informative=6,
                                 n_redundant=4, n_clusters_per_class=2,
                                 class_sep=0.8, flip_y=0.05, random_state=RNG)
Xtr, Xte, ytr, yte = train_test_split(Xcal, ycal, test_size=0.5, random_state=RNG)
sc = StandardScaler().fit(Xtr)
nb = GaussianNB().fit(Xtr, ytr)
lr = LogisticRegression(max_iter=2000).fit(sc.transform(Xtr), ytr)

def reliability(model, X, transform=None):
    Xin = transform.transform(X) if transform is not None else X
    p = model.predict_proba(Xin)[:, 1]
    edges = np.linspace(0, 1, 6)
    rows = []
    ece = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (p >= lo) & (p < hi if hi < 1 else p <= hi)
        if m.sum() == 0:
            rows.append((lo, hi, 0, np.nan, np.nan)); continue
        conf = p[m].mean(); acc = yte[m].mean()
        ece += (m.sum() / len(p)) * abs(conf - acc)
        rows.append((lo, hi, m.sum(), conf, acc))
    return rows, ece

print("  GaussianNB reliability (predicted vs actual P(y=1)):")
print("    bin          n     mean pred   actual")
rows, ece_nb = reliability(nb, Xte)
for lo, hi, n, conf, acc in rows:
    if n:
        print(f"    [{lo:.1f},{hi:.1f})   {n:<5} {conf:.3f}       {acc:.3f}")
print(f"    expected calibration error (ECE): {ece_nb:.3f}")

_, ece_lr = reliability(lr, Xte, transform=sc)
print(f"\n  Logistic regression ECE on the same data: {ece_lr:.3f}")
print(f"  accuracy -- NB {accuracy_score(yte, nb.predict(Xte)):.3f} vs "
      f"LR {accuracy_score(yte, lr.predict(sc.transform(Xte))):.3f}")
print("  Similar accuracy, very different trustworthiness of the probabilities.")


# ==========================================================================
rule("SECTION 8: The text killer app -- one pass, strong baseline")
# ==========================================================================
print("On the synthetic corpus, MultinomialNB is trained by COUNTING (a single")
print("pass, no iteration) and is a strong baseline against iterative LR.\n")
Xc, yc = make_corpus(n_docs=2000)
Xtr, Xte, ytr, yte = train_test_split(Xc, yc, test_size=0.3, random_state=RNG, stratify=yc)
mnb = MultinomialNB().fit(Xtr, ytr)
lrt = LogisticRegression(max_iter=2000).fit(Xtr, ytr)
print(f"  MultinomialNB accuracy : {accuracy_score(yte, mnb.predict(Xte)):.3f}")
print(f"  LogisticRegression acc : {accuracy_score(yte, lrt.predict(Xte)):.3f}")
print(f"  vocab size / n train   : {Xc.shape[1]} words / {len(Xtr)} docs")
print("  NB fits in one counting pass; on high-dim sparse text it is the classic")
print("  fast, strong baseline.")

print("\nDONE.")
