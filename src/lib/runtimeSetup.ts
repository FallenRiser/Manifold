// Hidden preambles prepended before a CodeBlock snippet runs in-browser (Pyodide).
// They declare the variables the lesson snippets reference (X, y, X_train, …) so the
// "Run" button executes without "name 'X' is not defined" errors. Self-contained
// snippets that redefine these are unaffected (their own assignment wins).
//
// One preamble per track context. Validated against every lesson snippet locally
// (same scikit-learn API as Pyodide): 92/104 pages run clean; the rest reference
// page-local helpers or unavailable libraries and intentionally get no Run button.

// Regression context — linear-regression & regularized-regression tracks.
export const REGRESSION_SETUP = `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
_rng = np.random.default_rng(0)
_n = 120
X = _rng.normal(size=(_n, 6))
_w = np.array([3.0, -2.0, 1.5, 0.0, 0.0, 0.8])
y = X @ _w + _rng.normal(scale=0.5, size=_n) + 5.0
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
X_new = X_test[:3]
feature_names = [f"x{i}" for i in range(X.shape[1])]
df = pd.DataFrame(X, columns=feature_names); df["target"] = y
`;

// Clustering context — k-means track (no labels needed).
export const CLUSTER_SETUP = `import numpy as np
from sklearn.datasets import make_blobs
X, _true = make_blobs(n_samples=150, centers=4, cluster_std=0.8, random_state=0)
y_true = _true
X_new = X[:5]
`;

// Binary-classification context — logistic-regression track. Deliberately
// overlapping classes (class_sep 0.9, 7% label noise) so accuracies land in
// the high-80s and probabilities spread across the whole (0,1) range — a
// perfectly separable dataset makes every lab and threshold discussion trivial.
export const LOGISTIC_SETUP = `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
X, y = make_classification(n_samples=200, n_features=2, n_informative=2,
                           n_redundant=0, n_clusters_per_class=1,
                           class_sep=0.9, flip_y=0.07, random_state=11)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
X_new = X_test[:3]
`;

// Interpretable binary-classification context — logistic-regression Tier-2
// (reading the model: coefficients, odds ratios, standardization). A synthetic
// but realistic "loan default" table with NAMED features on real-world scales,
// so odds ratios and standardized coefficients tell a concrete story. Numbers
// cited on the pages come from a real run of this exact data (seed 42, n=1200).
export const CREDIT_SETUP = `import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
_rng = np.random.default_rng(42)
_n = 1200
age    = _rng.normal(40, 11, _n).clip(19, 75)          # years
income = _rng.normal(62, 22, _n).clip(15, 200)         # $k / year
util   = _rng.beta(2, 3, _n)                            # credit utilization 0..1
prior  = _rng.poisson(0.5, _n).clip(0, 6)              # # prior defaults
_z = (-1.1 - 0.030*(age-40) - 0.022*(income-62) + 3.2*(util-0.4) + 0.85*prior)
_p = 1 / (1 + np.exp(-_z))
default = (_rng.random(_n) < _p).astype(int)
feature_names = ["age", "income", "util", "prior"]
X = np.column_stack([age, income, util, prior])
y = default
df = pd.DataFrame(X, columns=feature_names); df["default"] = y
`;

// Naive-Bayes context. Deliberately CORRELATED features (4 redundant on top of
// 6 informative, class_sep 0.8, 5% label noise) so the independence assumption
// is violated and GaussianNB comes out overconfident — the calibration story.
// Numbers on the pages come from scripts/naive_bayes_cases.py.
export const NB_SETUP = `import numpy as np
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
X, y = make_classification(n_samples=4000, n_features=12, n_informative=6,
                           n_redundant=4, n_clusters_per_class=2,
                           class_sep=0.8, flip_y=0.05, random_state=0)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=0)
X_new = X_test[:3]
`;

// Naive-Bayes TEXT context — a small synthetic bag-of-words corpus (the same
// two-topic model as scripts/naive_bayes_cases.py), so Multinomial/Bernoulli
// and smoothing snippets run offline. X_* are word-count matrices.
export const NB_TEXT_SETUP = `import numpy as np
from sklearn.naive_bayes import MultinomialNB, BernoulliNB
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
_rng = np.random.RandomState(0)
_vocab, _doc_len, _n = 400, 25, 1200
_base = _rng.gamma(0.4, size=_vocab)
def _topic(idx):
    w = _base.copy(); w[idx] *= 2.4; return w / w.sum()
_sa = _rng.choice(_vocab, 18, replace=False)
_sb = _rng.choice(_vocab, 18, replace=False)
_pa, _pb = _topic(_sa), _topic(_sb)
X = np.array([_rng.multinomial(_doc_len, _pa if d % 2 == 0 else _pb) for d in range(_n)])
y = np.array([d % 2 for d in range(_n)])
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
X_new = X_test[:3]
`;

// Classification context — k-nearest-neighbors track.
export const KNN_SETUP = `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
X, y = make_classification(n_samples=200, n_features=4, n_informative=3,
                           n_redundant=0, n_classes=3, random_state=0)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
X_new = X_test[:3]
x_new = X_new
x_query = X_test[0]
`;
