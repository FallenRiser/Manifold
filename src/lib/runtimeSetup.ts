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

// Calculus & optimization strand of Math foundations. Deliberately bare: these pages are about
// doing the calculus by hand, so the preamble supplies arithmetic and nothing that would do the
// work. No sympy, no autograd -- the point is to watch a limit converge, not to be handed it.
export const CALCULUS_SETUP = `import numpy as np
import math
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

// Architecture-design context — the "how much network" track. The same
// make_moons(800, noise=0.25) problem the whole Neural-networks family uses,
// plus a param counter and MLPClassifier. Sized so a page can fit ONE or TWO
// small nets live (a full depth×width sweep is too slow for the browser and
// stays a cited table / lab). Numbers come from scripts/architecture_cases.py.
export const ARCH_SETUP = `import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier

X_all, y_all = make_moons(n_samples=800, noise=0.25, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X_all, y_all, test_size=0.25, random_state=0)

def count_params(hidden):
    "Parameters in a 2-input, 1-output MLP with the given hidden-layer sizes."
    sizes = [2] + list(hidden) + [1]
    return sum(sizes[i]*sizes[i+1] + sizes[i+1] for i in range(len(sizes)-1))

def fit_mlp(hidden, seed=0, max_iter=500):
    "Train one ReLU MLP, return (train_acc, test_acc). One fit ~ a second or two."
    clf = MLPClassifier(hidden_layer_sizes=tuple(hidden), activation="relu",
                        solver="adam", learning_rate_init=0.001, max_iter=max_iter,
                        random_state=seed, tol=0.0, n_iter_no_change=max_iter)
    clf.fit(X_tr, y_tr)
    return round(clf.score(X_tr, y_tr), 4), round(clf.score(X_te, y_te), 4)
`;

// Initialisation & normalisation context. Carries the hand-rolled MLP helpers
// (init_manual / forward_activations / grad_norms) so the variance- and
// gradient-propagation snippets reproduce the EXACT published ladders from
// scripts/init_norm_cases.py — sklearn cannot measure per-layer activation
// variance, so the from-scratch numpy forward pass IS the tool here.
export const INIT_SETUP = `import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split

X_tr, X_te, y_tr, y_te = train_test_split(
    *make_moons(n_samples=800, noise=0.25, random_state=0),
    test_size=0.25, random_state=0)

def init_manual(sizes, scale="xavier", seed=0):
    "Weights for a stack of linear layers. scale: 'xavier' (1/fan_in), 'he'"
    "(2/fan_in), 'zero', or a float standard deviation."
    r = np.random.default_rng(seed)
    params = []
    for i in range(len(sizes) - 1):
        fan_in, fan_out = sizes[i], sizes[i+1]
        s = {"xavier": np.sqrt(1.0/fan_in), "he": np.sqrt(2.0/fan_in),
             "zero": 0.0}.get(scale, None)
        if s is None: s = float(scale)
        W = np.zeros((fan_in, fan_out)) if s == 0 else r.normal(scale=s, size=(fan_in, fan_out))
        params.append([W, np.zeros(fan_out)])
    return params

def forward_activations(X, params, act="relu"):
    "Forward pass; returns (output, pre_activations, activations) per layer."
    a, pre, acts = X, [], [X]
    for i, (W, b) in enumerate(params):
        z = a @ W + b
        pre.append(z)
        if i < len(params) - 1:
            a = {"relu": np.maximum(0.0, z),
                 "sigmoid": 1.0/(1.0+np.exp(-np.clip(z, -500, 500))),
                 "tanh": np.tanh(z)}.get(act, np.maximum(0.0, z))
        else:
            a = z
        acts.append(a)
    return a, pre, acts

def grad_norms(X, y, params, act="relu"):
    "Per-layer gradient norms from one backward pass (for vanishing/exploding)."
    y = y.reshape(-1, 1).astype(float)
    logit, pre, acts = forward_activations(X, params, act)
    p = 1.0/(1.0+np.exp(-np.clip(logit, -500, 500)))
    delta = (p - y) / len(X)
    norms = []
    for i in range(len(params) - 1, -1, -1):
        W, _ = params[i]
        norms.insert(0, float(np.linalg.norm(acts[i].T @ delta)))
        if i > 0:
            g = {"relu": (pre[i-1] > 0).astype(float),
                 "sigmoid": acts[i]*(1-acts[i]),
                 "tanh": 1 - acts[i]**2}.get(act, (pre[i-1] > 0).astype(float))
            delta = (delta @ W.T) * g
    return norms
`;

// Neural-network regularisation track. The track's own measurements come from
// PyTorch (scripts/regularisation_cases.py), which Pyodide cannot run here, so
// this preamble covers only what is exactly reproducible in numpy: the dropout
// arithmetic. That is not a consolation prize — the inverted-dropout scaling is
// the one part of the track a reader is most likely to get wrong in their own
// code, and it is the part that needs no training loop to check.
export const NN_REG_SETUP = `import numpy as np

rng = np.random.default_rng(0)

def relu_layer(n=4096, d=256, seed=0):
    "One hidden layer's post-ReLU activations. Positive, so means are readable."
    return np.maximum(0.0, np.random.default_rng(seed).normal(size=(n, d)))

def dropout_mask(shape, p, inverted=True, seed=1):
    "Keep with probability 1-p. Inverted dropout divides survivors by (1-p)."
    keep = np.random.default_rng(seed).random(shape) > p
    return keep / (1.0 - p) if inverted else keep.astype(float)
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

// Reinforcement-learning context — Markov decision processes track.
// A fully-specified, tabular gridworld MDP. The default is Sutton & Barto's
// Example 4.1 (4x4, terminals at the two shaded corners, reward -1 per step)
// so a reader's own run reproduces the textbook value function exactly. It
// exposes ONLY the MDP (P, R, gamma) and rendering helpers — never the
// solving algorithms, so every "from scratch" snippet stays genuine.
// make_goal_grid() returns a positive-goal / pit variant for the pages where
// far-sightedness (a discount < 1) is the point.
export const GRIDWORLD_SETUP = `import numpy as np

nrow, ncol = 4, 4
nS, nA = nrow * ncol, 4
TERMINALS = [0, 15]                       # top-left and bottom-right corners
ACTIONS = ["up", "right", "down", "left"] # a = 0, 1, 2, 3
ARROWS  = ["\\u2191", "\\u2192", "\\u2193", "\\u2190"]
_MOVES = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}

def build_gridworld(step_reward=-1.0, terminals=(0, 15), terminal_reward=None):
    """P[s,a,s'] transition probs and R[s,a] rewards for a deterministic 4x4 grid.
    Off-grid moves bounce back; terminal cells absorb at reward 0."""
    P = np.zeros((nS, nA, nS))
    R = np.full((nS, nA), float(step_reward))
    term_r = terminal_reward or {}
    for s in range(nS):
        r, c = divmod(s, ncol)
        if s in terminals:
            P[s, :, s] = 1.0
            R[s, :] = 0.0
            continue
        for a, (dr, dc) in _MOVES.items():
            nr, nc = r + dr, c + dc
            ns = nr * ncol + nc if (0 <= nr < nrow and 0 <= nc < ncol) else s
            P[s, a, ns] += 1.0
            if ns in term_r:                # reward paid on ENTERING a special cell
                R[s, a] = term_r[ns]
    return P, R

# default MDP: Sutton & Barto Example 4.1
P, R = build_gridworld(step_reward=-1.0, terminals=TERMINALS)
gamma = 1.0
random_policy = np.full((nS, nA), 1.0 / nA)   # equiprobable random walk

def make_goal_grid(step_reward=-0.04, goal=15, pit=3):
    """A positive-goal variant: reaching 'goal' pays +1, 'pit' pays -1, each step
    costs a little. Use gamma < 1 here to make the agent trade path length off."""
    P2, R2 = build_gridworld(step_reward=step_reward, terminals=(goal, pit),
                             terminal_reward={goal: 1.0, pit: -1.0})
    return P2, R2

def show(v):
    """Print a length-16 value vector (floats) or arrow/label vector on the grid."""
    v = np.asarray(v)
    for r in range(nrow):
        if v.dtype.kind in "fc":
            print("  ".join(f"{v[r*ncol+c]:6.2f}" for c in range(ncol)))
        else:
            print("  ".join(f"{str(v[r*ncol+c]):>4}" for c in range(ncol)))
`;

// Reinforcement-learning context — Learning track (model-free prediction/control).
// The whole point of this track is that the agent does NOT read the model: it must
// SAMPLE the world. So this preamble exposes a GridEnv with reset()/step() — a black
// box you can only interact with — instead of the P,R tables the MDP/Planning tracks
// summed over. Two worlds: the goal/pit grid (prediction demos, gamma<1) and Sutton
// & Barto's Cliff Walking (the SARSA-vs-Q-learning showpiece). The env keeps P,R
// INSIDE itself to simulate, and a dp_* oracle is provided ONLY so pages can print
// "the truth we are pretending not to have" as a cross-check — every learning snippet
// itself uses env.step alone. Numbers reproduce scripts/... verified natively.
export const LEARNING_SETUP = `import numpy as np

nA = 4
ACTIONS = ["up", "right", "down", "left"]
ARROWS  = ["\\u2191", "\\u2192", "\\u2193", "\\u2190"]
_MOVES  = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}
rng = np.random.default_rng(0)

def _build(nrow, ncol, step_reward, terminals, terminal_reward, cliff=None, cliff_start=None):
    nS = nrow * ncol
    P = np.zeros((nS, nA, nS)); R = np.full((nS, nA), float(step_reward))
    cliff = set(cliff or [])
    for s in range(nS):
        r, c = divmod(s, ncol)
        if s in terminals:
            P[s, :, s] = 1.0; R[s, :] = 0.0; continue
        for a, (dr, dc) in _MOVES.items():
            nr, nc = r + dr, c + dc
            ns = nr * ncol + nc if (0 <= nr < nrow and 0 <= nc < ncol) else s
            if ns in cliff:
                P[s, a, cliff_start] += 1.0; R[s, a] = -100.0
            elif ns in (terminal_reward or {}):
                P[s, a, ns] += 1.0; R[s, a] = terminal_reward[ns]
            else:
                P[s, a, ns] += 1.0
    return P, R

class GridEnv:
    """A gridworld you can only SAMPLE. reset() -> start state; step(a) -> (s2, r, done).
    P and R live inside to run the simulation; an agent is not meant to read them."""
    def __init__(self, P, R, terminals, start, nrow, ncol):
        self.P, self.R = P, R
        self.terminals = set(terminals); self.start = start
        self.nrow, self.ncol = nrow, ncol
        self.nS, self.nA = P.shape[0], P.shape[1]
        self.rng = np.random.default_rng(0)
    def seed(self, k):
        self.rng = np.random.default_rng(k); return self
    def reset(self, s=None):
        if s == "uniform":
            opts = [i for i in range(self.nS) if i not in self.terminals]
            self.s = int(self.rng.choice(opts))
        else:
            self.s = self.start if s is None else s
        return self.s
    def step(self, a):
        s = self.s
        s2 = int(self.rng.choice(self.nS, p=self.P[s, a]))
        r = float(self.R[s, a]); self.s = s2
        return s2, r, (s2 in self.terminals)

def make_goal_env(step_reward=-0.04, goal=15, pit=3):
    "4x4 grid: reaching goal pays +1, the pit -1, each step a little. Start = cell 12."
    P, R = _build(4, 4, step_reward, (goal, pit), {goal: 1.0, pit: -1.0})
    return GridEnv(P, R, (goal, pit), 12, 4, 4)

def make_cliff_env():
    "Sutton & Barto Cliff Walking: 4x12, start bottom-left (36), goal bottom-right (47),"
    "the bottom row between them is a cliff (-100, back to start). All else -1."
    cliff = list(range(37, 47))
    P, R = _build(4, 12, -1.0, (47,), {}, cliff=cliff, cliff_start=36)
    return GridEnv(P, R, (47,), 36, 4, 12)

env = make_goal_env()                         # default world for the prediction pages
nS = env.nS                                   # 16 (the goal/pit grid). Cliff env has 48.

def eps_greedy(Q, s, eps, rng):
    "Explore with probability eps, otherwise take the greedy action."
    if rng.random() < eps: return int(rng.integers(nA))
    return int(np.argmax(Q[s]))

def greedy_policy(Q):
    "Deterministic greedy action per state (a length-nS array of action indices)."
    return np.argmax(Q, axis=1)

def dp_eval(env, policy, gamma, iters=4000):
    "ORACLE (peeks at the model): exact V^pi by iterative policy evaluation."
    V = np.zeros(env.nS)
    for _ in range(iters):
        Vn = np.zeros(env.nS)
        for s in range(env.nS):
            if s in env.terminals: continue
            Vn[s] = sum(policy[s, a] * (env.R[s, a] + gamma * env.P[s, a] @ V) for a in range(nA))
        if np.max(np.abs(Vn - V)) < 1e-12: V = Vn; break
        V = Vn
    return V

def dp_solve(env, gamma, iters=5000):
    "ORACLE (peeks at the model): exact V*, Q* by value iteration."
    V = np.zeros(env.nS)
    for _ in range(iters):
        Vn = V.copy()
        for s in range(env.nS):
            if s in env.terminals: continue
            Vn[s] = max(env.R[s, a] + gamma * env.P[s, a] @ V for a in range(nA))
        if np.max(np.abs(Vn - V)) < 1e-12: V = Vn; break
        V = Vn
    Q = np.array([[env.R[s, a] + gamma * env.P[s, a] @ V for a in range(nA)] for s in range(env.nS)])
    return V, Q

def show(v, ncol=4):
    "Print a value vector (floats) or an arrow/label vector laid out on the grid."
    v = np.asarray(v); nrow = len(v) // ncol
    for r in range(nrow):
        if v.dtype.kind in "fc":
            print("  ".join(f"{v[r*ncol+c]:6.2f}" for c in range(ncol)))
        else:
            print("  ".join(f"{str(v[r*ncol+c]):>5}" for c in range(ncol)))
`;

// The warehouse-robot capstone (docs/rl-capstone-plan.md). A delivery robot on a
// 5x8 floor: dock -> pickup shelf -> dropoff, with a wall of spills split by a
// narrow doorway (col 3) and a safe-but-long bypass (cols 6-7). The state is
// (row, col, carrying) = 80 states — the `carrying` bit is the capstone's flagship
// lesson, and dropping it makes the task provably unsolvable.
// Like the RL tracks, the agent may only SAMPLE (reset/step); dp_solve is an ORACLE
// that peeks at the hidden model, used only to print the ceiling.
export const WAREHOUSE_SETUP = `import numpy as np

# ---- The warehouse floor -------------------------------------------------
#   S = dock (start)   P = pickup shelf   D = dropoff   H = spill
#   A spill costs SPILL and knocks the robot back to the dock (it does not end
#   the episode). Delivery ends the episode.
FLOOR = ["S......D",
         "........",
         "HHH.HH..",
         "........",
         "P......."]
NROW, NCOL = len(FLOOR), len(FLOOR[0])
ACTIONS = ["up", "right", "down", "left"]
ARROWS = ["^", ">", "v", "<"]
MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]
nA = 4

SLIP, STEP_COST, SPILL, DELIVER = 0.10, -1.0, -30.0, 50.0
GAMMA = 0.97

_find = lambda ch: [(r, c) for r in range(NROW) for c in range(NCOL) if FLOOR[r][c] == ch]
DOCK = _find("S")[0]
PICK = _find("P")[0]
DROP = _find("D")[0]
SPILLS = set(_find("H"))

# state = (row, col, carrying) packed into one integer
nS = NROW * NCOL * 2
sid = lambda r, c, k: (r * NCOL + c) * 2 + k
unpack = lambda s: ((s // 2) // NCOL, (s // 2) % NCOL, s % 2)


def _move(r, c, d):
    nr, nc = r + MOVES[d][0], c + MOVES[d][1]
    if nr < 0 or nr >= NROW or nc < 0 or nc >= NCOL:
        return r, c
    return nr, nc


def _transition(s, d):
    """deterministic result of MOVING in direction d -> (next_state, reward, done)"""
    r, c, k = unpack(s)
    nr, nc = _move(r, c, d)
    rew = STEP_COST
    if (nr, nc) in SPILLS:
        return sid(DOCK[0], DOCK[1], k), rew + SPILL, False   # knocked back to the dock
    if (nr, nc) == PICK and k == 0:
        return sid(nr, nc, 1), rew, False                     # auto pick-up
    if (nr, nc) == DROP and k == 1:
        return sid(nr, nc, 1), rew + DELIVER, True            # delivered
    return sid(nr, nc, k), rew, False


class Warehouse:
    """You may only SAMPLE this world: reset() and step(). No P, no R."""

    def __init__(self, seed=0):
        self.rng = np.random.default_rng(seed)
        self.s = sid(DOCK[0], DOCK[1], 0)

    def seed(self, k):
        self.rng = np.random.default_rng(k)

    def reset(self, state=None):
        if state is None:
            self.s = sid(DOCK[0], DOCK[1], 0)
        elif state == "uniform":
            self.s = int(self.rng.choice(NONTERMINAL))
        else:
            self.s = int(state)
        return self.s

    def step(self, a):
        u = self.rng.random()
        if u < SLIP / 2:
            d = (a - 1) % 4                      # shoved anticlockwise
        elif u < SLIP:
            d = (a + 1) % 4                      # shoved clockwise
        else:
            d = a
        s2, r, done = _transition(self.s, d)
        self.s = s2
        return s2, r, done


# every state except "standing on the dropoff holding a package" (that is terminal)
NONTERMINAL = [s for s in range(nS) if s != sid(DROP[0], DROP[1], 1)]


def eps_greedy(Q, s, eps, rng):
    if rng.random() < eps:
        return int(rng.integers(nA))
    return int(np.argmax(Q[s]))


def evaluate(policy, n=2000, seed=999, eps=0.0, max_steps=250):
    """Run the policy from the dock. Returns mean undiscounted return + diagnostics."""
    env = Warehouse(seed)
    tot = spills = delivered = steps = 0.0
    for _ in range(n):
        s = env.reset()
        for t in range(max_steps):
            a = int(env.rng.integers(nA)) if env.rng.random() < eps else int(policy(s))
            s, r, done = env.step(a)
            tot += r
            steps += 1
            if r <= STEP_COST + SPILL + 1e-9:
                spills += 1
            if done:
                delivered += 1
                break
    return dict(ret=tot / n, delivered=delivered / n, spills=spills / n, steps=steps / n)


def dp_solve(gamma=GAMMA, tol=1e-12):
    """ORACLE — peeks at the hidden model to compute V* and pi*. A learner cannot do this."""
    V = np.zeros(nS)
    outs = [[[] for _ in range(nA)] for _ in range(nS)]
    for s in range(nS):
        for a in range(nA):
            for p, d in ((1 - SLIP, a), (SLIP / 2, (a - 1) % 4), (SLIP / 2, (a + 1) % 4)):
                s2, r, done = _transition(s, d)
                outs[s][a].append((p, s2, r, done))
    term = sid(DROP[0], DROP[1], 1)
    for _ in range(5000):
        delta = 0.0
        for s in range(nS):
            if s == term:
                continue
            best = max(sum(p * (r + (0.0 if done else gamma * V[s2])) for p, s2, r, done in outs[s][a])
                       for a in range(nA))
            delta = max(delta, abs(best - V[s]))
            V[s] = best
        if delta < tol:
            break
    pi = np.zeros(nS, dtype=int)
    for s in range(nS):
        q = [sum(p * (r + (0.0 if done else gamma * V[s2])) for p, s2, r, done in outs[s][a])
             for a in range(nA)]
        pi[s] = int(np.argmax(q))
    return V, pi


def show(pi, carrying, mark=True):
    """Print the policy as arrows over the floor, for one value of \`carrying\`."""
    lines = []
    for r in range(NROW):
        row = []
        for c in range(NCOL):
            ch = FLOOR[r][c]
            if ch == "H":
                row.append(" ## ")
            elif mark and (r, c) == DROP and carrying == 1:
                row.append("  D ")
            elif mark and (r, c) == PICK and carrying == 0:
                row.append("  P ")
            else:
                row.append("  " + ARROWS[int(pi[sid(r, c, carrying)])] + " ")
        lines.append("".join(row))
    print("\\n".join(lines))


env = Warehouse(0)
`;

// ── Warehouse capstone, Act 6 (transfer-far) ──────────────────────────────
// A NON-grid MDP: single-item inventory control. Same Playbook, no geometry.
//   state  = units of stock on hand (0..CAP)
//   action = units to order this morning (arrive before demand)
// The optimal policy is a base-stock / (s,S) rule that EMERGES from planning,
// the way the route emerged on the grid. Verified in scripts/rl_capstone_cases.py.
export const INVENTORY_SETUP = `import numpy as np
import math

# ---- Single-item inventory MDP (no grid, no geometry) --------------------
CAP = 20                                  # warehouse capacity (max stock)
PRICE, ORDER_FIX, ORDER_UNIT = 5.0, 4.0, 1.0
HOLD, STOCKOUT = 0.5, 3.0                 # holding cost / unit / day ; lost-sale penalty / unit
GAMMA = 0.95

# demand ~ truncated Poisson(mean 5) on 0..12
_lam = 5.0
_d = np.arange(0, 13)
_pmf = np.exp(-_lam) * _lam**_d / np.array([math.factorial(int(k)) for k in _d])
DEMAND_P = _pmf / _pmf.sum()
DMAX = len(DEMAND_P) - 1

nS = CAP + 1                              # stock levels 0..CAP
nA = CAP + 1                             # order 0..CAP


def _step_reward(s, a, d):
    """one day: order a, meet demand d -> (next_stock, profit)."""
    on_hand = min(s + a, CAP)
    sold = min(on_hand, d)
    leftover = on_hand - sold
    lost = max(0, d - on_hand)
    profit = (PRICE * sold
              - (ORDER_FIX if a > 0 else 0.0) - ORDER_UNIT * a
              - HOLD * leftover - STOCKOUT * lost)
    return leftover, profit


class Inventory:
    """You may only SAMPLE this world: reset() and step(). No model peeking."""

    def __init__(self, seed=0):
        self.rng = np.random.default_rng(seed)
        self.s = 0

    def reset(self, state=None):
        if state == "uniform":
            self.s = int(self.rng.integers(nS))
        else:
            self.s = 0 if state is None else int(state)
        return self.s

    def step(self, a):
        a = min(int(a), CAP)
        d = int(self.rng.choice(DMAX + 1, p=DEMAND_P))
        s2, r = _step_reward(self.s, a, d)
        self.s = s2
        return s2, r, False               # continuing task: never terminates


def eps_greedy(Q, s, eps, rng):
    if rng.random() < eps:
        return int(rng.integers(nA))
    return int(np.argmax(Q[s]))


def evaluate(policy, steps=20000, seed=999):
    """long-run average PROFIT PER DAY of a policy (continuing task)."""
    env = Inventory(seed); s = env.reset(0); tot = 0.0
    for t in range(steps):
        s, r, _ = env.step(int(policy(s))); tot += r
    return tot / steps


def dp_solve(gamma=GAMMA, tol=1e-10):
    """ORACLE — value iteration over the known demand model. A learner can't do this."""
    ER = np.zeros((nS, nA)); P = np.zeros((nS, nA, nS))
    for s in range(nS):
        for a in range(nA):
            for d, pd in enumerate(DEMAND_P):
                s2, r = _step_reward(s, a, d)
                ER[s, a] += pd * r
                P[s, a, s2] += pd
    V = np.zeros(nS)
    for _ in range(20000):
        Vn = (ER + gamma * (P @ V)).max(1)
        if np.max(np.abs(Vn - V)) < tol:
            V = Vn; break
        V = Vn
    pi = (ER + gamma * (P @ V)).argmax(1)
    return V, pi


env = Inventory(0)
`;

// ---------------------------------------------------------------------------
// Function approximation — the FOURTH RL track. The table is gone: values are a
// parameterised function v(s,w) shared across states, so experience in one state
// moves the estimate in others. Three environments, each chosen to isolate one
// lesson and to stay inside the Pyodide budget:
//
//   RandomWalk1000  — 1000 states, true values computable exactly. The place to
//                     see WHAT approximation costs you (VE, the on-policy
//                     distribution, state aggregation as the bridge from tables).
//   MountainCar     — continuous state, so the table is not merely large, it is
//                     IMPOSSIBLE. Tile coding + semi-gradient SARSA.
//   baird()         — Sutton & Barto's counterexample. Seven states whose only
//                     job is to make off-policy semi-gradient TD diverge.
//
// Conventions match the earlier RL tracks: an agent may only reset()/step(); a
// function named *_true or dp_* is an ORACLE that peeks at the model and exists
// only to print a reference the agent could never compute.
export const FA_SETUP = `import numpy as np

rng = np.random.default_rng(0)

# ---- Environment 1: the 1000-state random walk ----------------------------
# States 1..1000, start at 500. Each step moves 1..100 cells left or right with
# equal probability; walking off an end terminates with -1 (left) or +1 (right).
# Small enough to solve EXACTLY, big enough that a table is already silly.
N_STATES = 1000
START = 500
MAX_STEP = 100

class RandomWalk1000:
    def __init__(self, seed=0):
        self.rng = np.random.default_rng(seed)
        self.s = START
    def seed(self, k):
        self.rng = np.random.default_rng(k); return self
    def reset(self):
        self.s = START; return self.s
    def step(self, a=None):
        "a is ignored: this is a PREDICTION problem, the policy is fixed."
        step = int(self.rng.integers(1, MAX_STEP + 1))
        if self.rng.random() < 0.5: step = -step
        s2 = self.s + step
        if s2 < 1: return 0, -1.0, True
        if s2 > N_STATES: return N_STATES + 1, 1.0, True
        self.s = s2
        return s2, 0.0, False

def walk_true_values(tol=1e-9, iters=20000):
    "ORACLE: exact v_pi for the random walk, by iterative policy evaluation."
    # Vectorised with a cumulative sum: each sweep is O(N) instead of O(N*200),
    # so the exact answer arrives in ~291 sweeps and a fraction of a second.
    V = np.zeros(N_STATES + 2)
    p = 1.0 / (2 * MAX_STEP)
    s = np.arange(1, N_STATES + 1)
    left_off = np.maximum(0, MAX_STEP - (s - 1))     # steps that fall off the left end
    right_off = np.maximum(0, MAX_STEP - (N_STATES - s))
    term = p * (right_off - left_off)                # the -1 / +1 terminations
    lo = np.maximum(1, s - MAX_STEP)
    hi = np.minimum(N_STATES, s + MAX_STEP)
    for _ in range(iters):
        inner = V[1:N_STATES + 1]
        C = np.concatenate(([0.0], np.cumsum(inner)))
        neighbours = C[hi] - C[lo - 1] - inner       # the walk never stays put
        Vn = term + p * neighbours
        done = np.max(np.abs(Vn - inner)) < tol
        V[1:N_STATES + 1] = Vn
        if done: break
    return V

def group_of(s, n_groups=10):
    "State aggregation: which group does state s fall in? The simplest feature map."
    return min((s - 1) * n_groups // N_STATES, n_groups - 1)

def walk_mu(episodes=2000, seed0=0):
    "The ON-POLICY distribution: how much time the walk actually spends in each state."
    e = RandomWalk1000(0)
    counts = np.zeros(N_STATES + 2)
    for ep in range(episodes):
        e.seed(seed0 + ep)
        s = e.reset()
        while True:
            counts[s] += 1
            s, r, done = e.step()
            if done: break
    return counts[1:N_STATES + 1] / counts[1:N_STATES + 1].sum()

def walk_model():
    "ORACLE: exact transition matrix P (non-terminal to non-terminal), expected reward rbar, exact mu."
    P = np.zeros((N_STATES, N_STATES))
    p = 1.0 / (2 * MAX_STEP)
    for s in range(1, N_STATES + 1):
        lo, hi = max(1, s - MAX_STEP), min(N_STATES, s + MAX_STEP)
        P[s - 1, lo - 1:hi] = p
        P[s - 1, s - 1] = 0.0                              # the walk never stays put
    s = np.arange(1, N_STATES + 1)
    rbar = p * (np.maximum(0, MAX_STEP - (N_STATES - s)) - np.maximum(0, MAX_STEP - (s - 1)))
    start = np.zeros(N_STATES); start[START - 1] = 1.0
    eta = np.linalg.solve(np.eye(N_STATES) - P.T, start)   # expected visits per episode
    return P, rbar, eta / eta.sum()

# ---- Environment 2: Mountain Car ------------------------------------------
# Continuous (position, velocity). An underpowered car must rock back and forth
# to climb out. Reward -1 per step, so the return IS the negated episode length.
MC_POS = (-1.2, 0.6)
MC_VEL = (-0.07, 0.07)
MC_GOAL = 0.5

class MountainCar:
    nA = 3          # 0 = reverse, 1 = coast, 2 = forward
    def __init__(self, seed=0):
        self.rng = np.random.default_rng(seed)
        self.reset()
    def seed(self, k):
        self.rng = np.random.default_rng(k); return self
    def reset(self):
        self.pos = float(self.rng.uniform(-0.6, -0.4))
        self.vel = 0.0
        return np.array([self.pos, self.vel])
    def step(self, a):
        throttle = a - 1
        self.vel += 0.001 * throttle - 0.0025 * np.cos(3.0 * self.pos)
        self.vel = float(np.clip(self.vel, MC_VEL[0], MC_VEL[1]))
        self.pos += self.vel
        self.pos = float(np.clip(self.pos, MC_POS[0], MC_POS[1]))
        if self.pos <= MC_POS[0] and self.vel < 0:
            self.vel = 0.0
        done = self.pos >= MC_GOAL
        return np.array([self.pos, self.vel]), -1.0, done

# ---- Tile coding ----------------------------------------------------------
# The workhorse feature map: several offset grids laid over the state space, so
# a state activates exactly one tile per tiling. Binary features, so the value
# is just a SUM of weights - cheap, and the generalisation width is a dial.
class TileCoder:
    def __init__(self, lows, highs, tiles_per_dim, num_tilings):
        self.lows = np.asarray(lows, dtype=float)
        self.highs = np.asarray(highs, dtype=float)
        self.tpd = np.asarray(tiles_per_dim, dtype=int)
        self.n = int(num_tilings)
        self.dim = len(self.lows)
        self.width = (self.highs - self.lows) / (self.tpd - 1)
        mult = 2.0 * np.arange(self.dim) + 1.0        # asymmetric offsets
        self.offsets = np.array([(i / self.n) * self.width * mult for i in range(self.n)])
        self.per_tiling = int(np.prod(self.tpd))
        self.size = self.n * self.per_tiling
    def indices(self, x):
        "Return the active tile index in each tiling (length num_tilings)."
        x = np.asarray(x, dtype=float)
        out = np.empty(self.n, dtype=np.int64)
        for i in range(self.n):
            coords = np.floor((x - self.lows + self.offsets[i]) / self.width).astype(np.int64)
            coords = np.clip(coords, 0, self.tpd - 1)
            flat = 0
            for d in range(self.dim):
                flat = flat * self.tpd[d] + int(coords[d])
            out[i] = i * self.per_tiling + flat
        return out

def mc_coder(tilings=8, tiles=8):
    return TileCoder([MC_POS[0], MC_VEL[0]], [MC_POS[1], MC_VEL[1]], [tiles, tiles], tilings)

def train_mc_sarsa(episodes=200, tilings=8, tiles=8, alpha=0.5, seed=0, cap=5000):
    "Tile-coded semi-gradient SARSA on Mountain Car. eps = 0: a zero start is already optimistic."
    coder = mc_coder(tilings, tiles)
    w = np.zeros((MountainCar.nA, coder.size))
    step = alpha / tilings
    r_ = np.random.default_rng(seed)
    mc = MountainCar(seed)
    lengths = []
    for ep in range(episodes):
        mc.seed(seed * 10000 + ep)
        s = mc.reset(); f = coder.indices(s)
        a = eps_greedy_q(w[:, f].sum(axis=1), 0.0, r_)
        n = 0
        while True:
            s2, r, done = mc.step(a); n += 1
            q_sa = w[a, f].sum()
            if done or n >= cap:
                w[a, f] += step * (r - q_sa); break
            f2 = coder.indices(s2)
            a2 = eps_greedy_q(w[:, f2].sum(axis=1), 0.0, r_)
            w[a, f] += step * (r + w[a2, f2].sum() - q_sa)
            f, a = f2, a2
        lengths.append(n)
    return w, coder, np.array(lengths)

# ---- Environment 3: Baird's counterexample --------------------------------
# Seven states, no reward anywhere, and a target policy that always takes the
# SOLID action into state 7. Every true value is 0, and there is a weight vector
# that represents that exactly - yet off-policy semi-gradient TD still blows up.
# The features are deliberately over-complete: 8 weights for 7 states.
def baird():
    "Return (features, behaviour_probs, gamma). features[s] is the feature vector."
    phi = np.zeros((7, 8))
    for s in range(6):
        phi[s, s] = 2.0
        phi[s, 7] = 1.0
    phi[6, 6] = 1.0
    phi[6, 7] = 2.0
    return phi, np.array([6.0 / 7.0, 1.0 / 7.0]), 0.99

BAIRD_W0 = np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 10.0, 1.0])

# ---- Environment 4: CartPole ----------------------------------------------
# Four continuous numbers, two actions, +1 per step until the pole tips past 12
# degrees or the cart leaves the track. Dense reward, so a network can learn it
# in a couple of hundred episodes - the standard first task for DQN.
GRAV, MCART, MPOLE, LEN, FORCE, TAU = 9.8, 1.0, 0.1, 0.5, 10.0, 0.02
X_LIM, TH_LIM = 2.4, 12 * np.pi / 180

class CartPole:
    nA, dim = 2, 4
    def __init__(self, seed=0):
        self.rng = np.random.default_rng(seed); self.reset()
    def seed(self, k):
        self.rng = np.random.default_rng(k); return self
    def reset(self):
        self.s = self.rng.uniform(-0.05, 0.05, 4); return self.s.copy()
    def step(self, a):
        x, xd, th, thd = self.s
        force = FORCE if a == 1 else -FORCE
        ct, st = np.cos(th), np.sin(th)
        total = MCART + MPOLE
        temp = (force + MPOLE * LEN * thd ** 2 * st) / total
        thacc = (GRAV * st - ct * temp) / (LEN * (4.0 / 3.0 - MPOLE * ct ** 2 / total))
        xacc = temp - MPOLE * LEN * thacc * ct / total
        x, xd = x + TAU * xd, xd + TAU * xacc
        th, thd = th + TAU * thd, thd + TAU * thacc
        self.s = np.array([x, xd, th, thd])
        done = bool(abs(x) > X_LIM or abs(th) > TH_LIM)
        return self.s.copy(), 1.0, done

# ---- A neural network, in numpy -------------------------------------------
# One hidden layer, ReLU, Adam. Deliberately small: you can read every line, and
# it is the whole difference between "linear function approximation" and "deep RL".
class MLP:
    def __init__(self, d_in, h, d_out, seed=0, lr=1e-3):
        r = np.random.default_rng(seed)
        self.W1 = r.normal(0, np.sqrt(2.0 / d_in), (d_in, h)); self.b1 = np.zeros(h)
        self.W2 = r.normal(0, np.sqrt(2.0 / h), (h, d_out));   self.b2 = np.zeros(d_out)
        self.lr = lr
        self.m = [np.zeros_like(p) for p in self.params()]
        self.v = [np.zeros_like(p) for p in self.params()]
        self.t = 0
    def params(self):
        return [self.W1, self.b1, self.W2, self.b2]
    def forward(self, X):
        self.X = X
        self.Z = X @ self.W1 + self.b1
        self.H = np.maximum(self.Z, 0.0)
        return self.H @ self.W2 + self.b2
    def backward(self, dY):
        "dY = dLoss/dOutput for the batch that was just forwarded."
        g = [self.H.T @ dY, dY.sum(0)]
        dZ = (dY @ self.W2.T) * (self.Z > 0)
        g = [self.X.T @ dZ, dZ.sum(0)] + g
        self.t += 1
        for p, gr, m, v in zip(self.params(), g, self.m, self.v):
            m *= 0.9;   m += 0.1 * gr
            v *= 0.999; v += 0.001 * gr * gr
            p -= self.lr * (m / (1 - 0.9 ** self.t)) / (np.sqrt(v / (1 - 0.999 ** self.t)) + 1e-8)
    def copy_from(self, other):
        for p, q in zip(self.params(), other.params()):
            p[...] = q

def eval_greedy(q, n=10, cap_steps=500):
    "Freeze the network and play n fixed held-out starts with no exploration at all."
    out = []
    for k in range(n):
        e = CartPole(50000 + k); s = e.reset(); t = 0; done = False
        while not done and t < cap_steps:
            s, r, done = e.step(int(np.argmax(q.forward(s[None])[0]))); t += 1
        out.append(t)
    return float(np.mean(out))

def train_cartpole_dqn(episodes=300, replay=True, target=True, double=False, seed=0,
                       h=64, batch=32, cap=20000, sync=200, lr=1e-3, gamma=0.99,
                       cap_steps=500, eval_every=0):
    """DQN on CartPole. replay/target/double turn the three ideas of this chapter on and off.
    eval_every > 0 also returns a frozen-greedy evaluation taken every that many episodes;
    it draws no random numbers, so the training run is bit-identical either way."""
    env = CartPole(seed)
    q = MLP(4, h, 2, seed=seed, lr=lr)
    qt = MLP(4, h, 2, seed=seed, lr=lr); qt.copy_from(q)
    rng = np.random.default_rng(seed + 1)
    S = np.zeros((cap, 4)); A = np.zeros(cap, int); R = np.zeros(cap)
    S2 = np.zeros((cap, 4)); D = np.zeros(cap)
    n = 0; total = 0; lengths = []; evals = []
    for ep in range(episodes):
        env.seed(seed * 1000 + ep)
        s = env.reset()
        for t in range(cap_steps):
            eps = max(0.05, 1.0 - total / 5000.0)
            a = int(rng.integers(2)) if rng.random() < eps else int(np.argmax(q.forward(s[None])[0]))
            s2, r, done = env.step(a)
            i = n % cap
            S[i], A[i], R[i], S2[i], D[i] = s, a, r, s2, float(done)
            n += 1; total += 1; s = s2
            if n >= batch:
                if replay:
                    idx = rng.integers(0, min(n, cap), batch)      # shuffle the past
                else:
                    idx = (np.arange(n - batch, n)) % cap           # the last few steps, in order
                bs, ba, br, bs2, bd = S[idx], A[idx], R[idx], S2[idx], D[idx]
                net = qt if target else q
                if double:
                    a_star = np.argmax(q.forward(bs2), axis=1)      # online net CHOOSES
                    nxt = net.forward(bs2)[np.arange(batch), a_star]  # target net SCORES
                else:
                    nxt = net.forward(bs2).max(axis=1)
                y = br + gamma * (1 - bd) * nxt
                out = q.forward(bs)
                dY = np.zeros_like(out)
                dY[np.arange(batch), ba] = (out[np.arange(batch), ba] - y) * (2.0 / batch)
                q.backward(dY)
                if target and total % sync == 0:
                    qt.copy_from(q)
            if done:
                break
        lengths.append(t + 1)
        if eval_every and (ep + 1) % eval_every == 0:
            evals.append((ep + 1, eval_greedy(q)))
    if eval_every:
        return q, np.array(lengths), evals
    return q, np.array(lengths)

# ---- Shared helpers -------------------------------------------------------
def eps_greedy_q(qs, eps, rng):
    "Epsilon-greedy over an array of action-values."
    if rng.random() < eps: return int(rng.integers(len(qs)))
    return int(np.argmax(qs))

def rmse(a, b, weights=None):
    "Root mean squared error, optionally weighted by a state distribution."
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    if weights is None:
        return float(np.sqrt(np.mean((a - b) ** 2)))
    w = np.asarray(weights, dtype=float)
    return float(np.sqrt(np.sum(w * (a - b) ** 2) / np.sum(w)))

env = RandomWalk1000(0)
`;

// Building environments from scratch — World 1: Beat to windward.
// A sailboat must reach a mark 60 m directly upwind. Boats cannot sail into the
// wind, so the only way there is to zig-zag (tack) — which nobody tells the agent.
// Every number on the World 1 pages comes from running THIS code.
export const ENV_SETUP = `import math
import numpy as np

# ---- The boat --------------------------------------------------------------
V_MAX = 3.0       # m/s, top speed
NO_GO = 30.0      # deg: closer than this to the wind, the sail gives no drive
RAMP = 12.0       # deg: how quickly drive builds once out of the no-go zone
TURN = 10.0       # deg the helm turns per step
INERTIA = 0.3     # fraction of the gap to the polar speed closed each step

def polar(angle):
    "Boat speed (m/s) sailing at angle (deg) to the wind: 0 = head to wind, 180 = dead downwind."
    a = abs(angle)
    if a <= NO_GO: return 0.0
    drive = 1.0 - math.exp(-(a - NO_GO) / RAMP)
    x = min(1.0, max(0.0, (a - 100.0) / 80.0))
    return V_MAX * drive * (1.0 - 0.4 * x * x)

def wrap(d):
    "Any angle, folded into [-180, 180)."
    return (d + 180.0) % 360.0 - 180.0

# ---- The oracle: the best upwind angle, straight from the polar ------------
_angles = np.linspace(0, 180, 18001)
_vmg = np.array([polar(a) * math.cos(math.radians(a)) for a in _angles])
BEST_ANGLE = float(_angles[_vmg.argmax()])   # 49.5 deg
BEST_VMG = float(_vmg.max())                  # 1.5647 m/s toward the wind

# ---- The course ------------------------------------------------------------
MARK_DIST = 60.0  # m upwind
ARRIVE = 10.0     # m: close enough to round the mark
MAX_STEPS = 200   # the race clock (seconds)
COURSE = 150.0    # m: radius of the race area, centred between start and mark

class Sail:
    nA = 3        # 0 = bear left, 1 = hold, 2 = bear right
    def __init__(self, reward="progress", edge="penalty", clock=MAX_STEPS):
        self.reward = reward      # "progress" | "time" | "speed"
        self.edge = edge          # "penalty" | "free" | "none"
        self.clock = clock        # steps before the race is called
        self.mx, self.my = 0.0, MARK_DIST
        self.rng = np.random.default_rng()
    def reset(self, seed=None):
        if seed is not None: self.rng = np.random.default_rng(seed)
        self.x = 0.0; self.y = 0.0
        self.h = float(self.rng.uniform(-180, 180))   # heading, 0 = straight into the wind
        self.u = 0.0; self.t = 0; self.tacks = 0
        return (self.x, self.y, self.h, self.u), {}
    def step(self, a):
        old = self.h
        self.h = wrap(self.h + (a - 1) * TURN)
        if (old >= 0) != (self.h >= 0) and abs(self.h) < 90: self.tacks += 1
        self.u += (polar(self.h) - self.u) * INERTIA
        d0 = math.hypot(self.mx - self.x, self.my - self.y)
        rad = math.radians(self.h)
        self.x += self.u * math.sin(rad); self.y += self.u * math.cos(rad)
        d1 = math.hypot(self.mx - self.x, self.my - self.y)
        self.t += 1
        arrived = d1 <= ARRIVE
        out = self.edge != "none" and math.hypot(self.x, self.y - self.my / 2) > COURSE
        terminated = arrived or out
        truncated = (not terminated) and self.t >= self.clock
        if self.reward == "time":
            r = -1.0
            if out and self.edge == "penalty": r += -1.0 * (self.clock - self.t)
        elif self.reward == "speed":
            r = self.u + (-100.0 if (out and self.edge == "penalty") else 0.0)
        else:
            r = d0 - d1
            if out and self.edge == "penalty": r += -100.0
        return (self.x, self.y, self.h, self.u), r, terminated, truncated, {"arrived": arrived, "out": out}

# ---- A sailor who can't lose: the solvability check -------------------------
def expert(env):
    "Sail at the best angle on the tack nearer the mark; tack at the layline."
    def policy(o):
        x, y, h, u = o
        b = math.degrees(math.atan2(env.mx - x, env.my - y))
        if abs(b) >= BEST_ANGLE: want = b
        else:
            side = 1.0 if h >= 0 else -1.0
            if side > 0 and b <= -(BEST_ANGLE - 1): side = -1.0
            if side < 0 and b >= (BEST_ANGLE - 1): side = 1.0
            want = side * BEST_ANGLE
        err = wrap(want - h)
        return 1 if abs(err) < 5 else (2 if err > 0 else 0)
    return policy

# ---- What the agent sees: a table index --------------------------------------
D_EDGES = [15, 30, 50, 80, 120]
N_STATES = 36 * 24 * 6

def observe(o, env):
    "Heading (10 deg bins) x bearing of the mark (15 deg bins) x distance band."
    x, y, h, u = o
    dx, dy = env.mx - x, env.my - y
    bearing = math.degrees(math.atan2(dx, dy))
    d = math.hypot(dx, dy)
    hi = int((h + 180) // 10) % 36
    bi = int((bearing + 180) // 15) % 24
    di = sum(d > e for e in D_EDGES)
    return (hi * 24 + bi) * 6 + di

# ---- Training and evaluation --------------------------------------------------
def train_sailor(reward="progress", edge="penalty", episodes=2000, seed=0, alpha=0.5, gamma=0.99, eps0=0.1,
                 clock=MAX_STEPS, bootstrap_truncation=True, view=observe, n_states=N_STATES):
    "Tabular Q-learning. Returns the table and a per-episode log of (arrived, out, steps)."
    env = Sail(reward, edge, clock); rng = np.random.default_rng(seed)
    Q = np.zeros((n_states, 3)); log = []
    for ep in range(episodes):
        o, _ = env.reset(seed=seed * 100000 + ep); s = view(o, env)
        eps = eps0 * max(0.0, 1 - ep / episodes)
        while True:
            a = int(rng.integers(3)) if rng.random() < eps else int(np.argmax(Q[s]))
            o, r, te, tr, info = env.step(a); s2 = view(o, env)
            end = te or (tr and not bootstrap_truncation)     # is there a future worth bootstrapping from?
            Q[s, a] += alpha * (r + (0.0 if end else gamma * Q[s2].max()) - Q[s, a]); s = s2
            if te or tr:
                log.append((info["arrived"], info["out"], env.t)); break
    return Q, log

def greedy(Q, view=observe):
    return lambda env: (lambda o: int(np.argmax(Q[view(o, env)])))

def race(policy_for, edge="penalty", n=200, clock=MAX_STEPS):
    "Sail n held-out races. Returns arrivals, exits, mean time, tacks, beating angle, circles."
    arr = out = 0; times = []; tacks = []; beat = []; circles = []
    for k in range(n):
        env = Sail("progress", edge, clock); o, _ = env.reset(seed=10**6 + k)
        pol = policy_for(env); prev = env.h; turned = 0.0
        while True:
            o, r, te, tr, info = env.step(pol(o))
            turned += abs(wrap(env.h - prev)); prev = env.h
            b = math.degrees(math.atan2(env.mx - o[0], env.my - o[1]))
            if abs(b) < BEST_ANGLE - 5 and o[3] > 0.5: beat.append(abs(o[2]))
            if te or tr: break
        arr += info["arrived"]; out += info["out"]; tacks.append(env.tacks); circles.append(turned / 360)
        if info["arrived"]: times.append(env.t)
    return dict(arrived=arr, left_course=out,
                mean_time=float(np.mean(times)) if times else None,
                tacks=float(np.mean(tacks)),
                beat_angle=float(np.median(beat)) if beat else None,
                circles=float(np.mean(circles)))

# ---- Seeing a race --------------------------------------------------------------
def sail_once(policy_for, seed=10**6, reward="progress", edge="penalty"):
    "Sail one race and record the path. Returns (xs, ys, env, info)."
    env = Sail(reward, edge); o, _ = env.reset(seed=seed); pol = policy_for(env)
    xs, ys = [env.x], [env.y]
    while True:
        o, r, te, tr, info = env.step(pol(o))
        xs.append(env.x); ys.append(env.y)
        if te or tr: break
    return xs, ys, env, info

def draw_track(xs, ys, env, cols=56, rows=17):
    "A text map of one race, upwind at the top. The path is a line; the digits show where the boat was as time passed."
    TALL = 2.5                                        # a text row is about 2.5 characters tall
    X = list(xs) + [env.mx]; Y = list(ys) + [env.my]
    x0, x1, y0, y1 = min(X), max(X), min(Y), max(Y)
    s = max((x1 - x0) / (cols - 4), (y1 - y0) / (TALL * (rows - 3)), 1.0)   # metres per character across
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    grid = [[" "] * cols for _ in range(rows)]
    def put(x, y, ch):
        c = int(round((x - cx) / s + (cols - 1) / 2))
        r = int(round((rows - 1) / 2 - (y - cy) / (TALL * s)))
        if 0 <= r < rows and 0 <= c < cols and not (grid[r][c].isdigit() and ch in "123456789*"):
            grid[r][c] = ch
    for i in range(1, len(xs)):                       # join each second to the next with a line
        dx, dy = xs[i] - xs[i - 1], ys[i] - ys[i - 1]
        if math.hypot(dx, dy) < 0.05: continue        # stopped: nothing to draw
        a = math.degrees(math.atan2(dy, dx)) % 180
        ch = "-" if (a < 22.5 or a >= 157.5) else "/" if a < 67.5 else "|" if a < 112.5 else chr(92)
        n = int(math.hypot(dx, dy) / s * 2) + 2
        for k in range(n + 1): put(xs[i - 1] + dx * k / n, ys[i - 1] + dy * k / n, ch)
    T = len(xs) - 1
    every = next(e for e in (5, 10, 20, 25, 50, 100) if T // e <= 9)
    for k in range(1, T // every + 1): put(xs[k * every], ys[k * every], str(k))
    put(xs[-1], ys[-1], "*"); put(0.0, 0.0, "S"); put(env.mx, env.my, "M")
    print(f"  wind v v v     one character = {s:.1f} m across, {TALL * s:.1f} m up")
    print("  +" + "-" * cols + "+")
    for row in grid: print("  |" + "".join(row) + "|")
    print("  +" + "-" * cols + "+")
    print(f"  S start   M mark   * end   1-{T // every}: where the boat was every {every} s")
    shown = "".join("".join(row) for row in grid)
    if sum(ch.isdigit() for ch in shown) < T // every or "*" not in shown:
        print("  (a mark you cannot find is under an earlier digit: the boat was already there)")
`;

// World 2 · Wildfire command. One world at a time, Gymnasium-shaped. The random draws happen in a fixed order
// (terrain, then fire dice every fire tick, then weather), which is what makes seeds reproducible.
// Every number on the World 2 pages is regenerated from THIS string by scripts/wildfire_cases.py.
export const WILDFIRE_SETUP = `import math
import numpy as np

# ---- The map -------------------------------------------------------------------
N = 16                                   # the map is N x N cells
GRASS, FOREST, ROCK, LAKE, VILLAGE = 0, 1, 2, 3, 4
UNBURNT, BURNING, BURNT = 0, 1, 2
N_IGNITIONS = 2                          # fires burning at the start, at least 6 cells from the village

# ---- The fire --------------------------------------------------------------------
SPREAD = np.array([0.30, 0.16, 0.0, 0.0, 0.20]) * 0.8   # chance a burning neighbour lights this cell, per fire tick
BURN_TIME = np.array([2, 5, 0, 0, 4])                   # fire ticks a cell burns before it is spent
FLAMMABLE = np.array([True, True, False, False, True])
DRYING = 0.01                            # moisture lost per fire tick (floor 0.05)
WIND_GAIN = 1.5                          # downwind spread x e^1.5 in the strongest wind, upwind / e^1.5
SLOPE_GAIN = 4.0                         # uphill spread x e^(4 * rise), clipped to [0.5, 2]
DIAGONAL = 0.7                           # diagonal neighbours are farther away
DIRS = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]

# ---- The clocks -----------------------------------------------------------------------
FIRE_EVERY = 2                           # the fire advances every 2 steps; the helicopter acts every step
WEATHER_EVERY = 30                       # the wind shifts every 30 steps
MAX_STEPS = 300                          # time is called (truncated)

# ---- The helicopter ----------------------------------------------------------------
BUCKET = 1                               # drops per fill
DROP_R = 2                               # a drop soaks the (2*DROP_R+1)-square around the helicopter
WET = 0.9                                # moisture left on every cell a drop lands on
MOVES = [(0, 0), (-1, 0), (0, 1), (1, 0), (0, -1)]   # 0 hover, 1 north, 2 east, 3 south, 4 west; 5 = fill or drop

def _blobs(rng, k, amp_lo, amp_hi, w_lo, w_hi):
    "A smooth random surface: k Gaussian bumps."
    r, c = np.mgrid[0:N, 0:N]
    z = np.zeros((N, N))
    for _ in range(k):
        cr, cc = rng.uniform(0, N, 2)
        w = rng.uniform(w_lo, w_hi)
        z += rng.uniform(amp_lo, amp_hi) * np.exp(-((r - cr) ** 2 + (c - cc) ** 2) / (2 * w * w))
    return z

def shift(a, dr, dc, fill=0):
    "out[r, c] = a[r - dr, c - dc]: what arrives at each cell from the neighbour at offset (-dr, -dc)."
    out = np.full_like(a, fill)
    H, W = a.shape[-2:]
    rs = slice(max(dr, 0), H + min(dr, 0)); rd = slice(max(-dr, 0), H + min(-dr, 0))
    cs = slice(max(dc, 0), W + min(dc, 0)); cd = slice(max(-dc, 0), W + min(-dc, 0))
    out[..., rs, cs] = a[..., rd, cd]
    return out

class Wildfire:
    "The pilot's world: the agent flies the helicopter one cell at a time."
    nA = 6
    def __init__(self, reward="values", drop_r=DROP_R, fire_every=FIRE_EVERY, max_steps=MAX_STEPS, weather_every=WEATHER_EVERY):
        self.reward = reward          # "values" | "area" | "extinguish"
        self.drop_r, self.fire_every, self.max_steps, self.weather_every = drop_r, fire_every, max_steps, weather_every
        self.rng = np.random.default_rng()

    def reset(self, seed=None):
        if seed is not None: self.rng = np.random.default_rng(seed)
        rng = self.rng
        E = _blobs(rng, 4, 0.5, 1.0, 2.5, 5.0); E = (E - E.min()) / (np.ptp(E) + 1e-9)   # elevation, 0..1
        F = _blobs(rng, 6, 0.5, 1.0, 1.5, 3.5)
        T = np.where(F > np.median(F), FOREST, GRASS).astype(np.int8)
        T[rng.random((N, N)) < 0.04] = ROCK
        r, c = np.mgrid[0:N, 0:N]
        while True:                                   # a lake and a village at least 5 cells apart
            lr, lc = rng.integers(2, N - 2, 2)
            vr, vc = rng.integers(1, N - 2, 2)
            if np.hypot(lr - (vr + 1), lc - (vc + 1)) >= 5: break
        T[np.hypot(r - lr, c - lc) <= 1.6] = LAKE
        T[vr:vr + 3, vc:vc + 3] = VILLAGE
        M = 0.10 + 0.10 * rng.random((N, N))          # moisture: dry, wetter near the lake
        M += 0.25 * np.exp(-np.hypot(r - lr, c - lc) / 2.0)
        M[T == LAKE] = 1.0
        S = np.zeros((N, N), np.int8); timer = np.zeros((N, N), np.int8)
        cand = np.argwhere((T == GRASS) | (T == FOREST))
        cand = cand[np.hypot(cand[:, 0] - (vr + 1), cand[:, 1] - (vc + 1)) >= 6]
        for k in rng.choice(len(cand), N_IGNITIONS, replace=False):
            S[tuple(cand[k])] = BURNING; timer[tuple(cand[k])] = BURN_TIME[T[tuple(cand[k])]]
        self.T, self.E, self.M, self.S, self.timer = T, E, M, S, timer
        self.ever = S == BURNING                      # every cell that has ever caught fire
        self.put_out_count = np.zeros((N, N), np.int16)
        self.pos = np.array([vr + 1, vc + 1]); self.water = BUCKET   # start full, over the village
        self.wdir = float(rng.uniform(0, 2 * np.pi)); self.wspd = float(rng.uniform(0.2, 1.0))
        self.t = 0
        self.stats = dict(put_out=0, put_out_again=0, drops=0, fills=0)
        return self.observe(), {}

    def observe(self):
        "12 map layers: grass, forest, lake, village, elevation, moisture, burning, burnt, helicopter, water, wind x2."
        T, S = self.T, self.S
        o = np.zeros((12, N, N), np.float32)
        for k, ty in enumerate((GRASS, FOREST, LAKE, VILLAGE)):
            o[k] = (T == ty) & (S != BURNT)
        o[4] = self.E; o[5] = self.M
        o[6] = S == BURNING; o[7] = S == BURNT
        o[8, self.pos[0], self.pos[1]] = 1
        o[9] = self.water / BUCKET
        o[10] = np.cos(self.wdir) * self.wspd; o[11] = np.sin(self.wdir) * self.wspd
        return o

    def fire_tick(self):
        "Advance the fire one tick. Returns (cells newly alight, village cells newly alight)."
        T, S, M, E = self.T, self.S, self.M, self.E
        burning = S == BURNING
        not_lit = np.ones((N, N))
        wr, wc = -np.cos(self.wdir), np.sin(self.wdir)    # the wind blows TOWARD wdir; 0 = toward the top row
        for dr, dc in DIRS:
            src = shift(burning, dr, dc, False)            # a burning neighbour that would spread by (dr, dc)
            dist = math.hypot(dr, dc)
            wind = np.exp(WIND_GAIN * self.wspd * (dr * wr + dc * wc) / dist)
            slope = np.clip(np.exp(SLOPE_GAIN * (E - shift(E, dr, dc, 0.0))), 0.5, 2.0)
            p = SPREAD[T] * (1 - M) * wind * slope * (DIAGONAL if dist > 1 else 1.0)
            not_lit *= np.where(src, 1 - np.clip(p, 0, 1), 1.0)
        new = (S == UNBURNT) & FLAMMABLE[T] & (self.rng.random((N, N)) < 1 - not_lit)
        timer = np.where(burning, self.timer - 1, self.timer)
        spent = burning & (timer <= 0)
        S = np.where(spent, BURNT, S)
        self.S = np.where(new, BURNING, S).astype(np.int8)
        self.timer = np.where(new, BURN_TIME[T], timer).astype(np.int8)
        self.M = np.where(T == LAKE, 1.0, np.maximum(M - DRYING, 0.05))
        self.ever |= new
        return int(new.sum()), int((new & (T == VILLAGE)).sum())

    def step(self, a):
        r, c = self.pos; put_out = 0
        if a < 5:                                          # fly
            dr, dc = MOVES[a]
            self.pos = np.array([min(max(r + dr, 0), N - 1), min(max(c + dc, 0), N - 1)])
        elif self.T[r, c] == LAKE:                         # fill
            if self.water < BUCKET: self.water = BUCKET; self.stats["fills"] += 1
        elif self.water > 0:                               # drop
            k = self.drop_r
            r0, r1, c0, c1 = max(r - k, 0), min(r + k + 1, N), max(c - k, 0), min(c + k + 1, N)
            block = self.S[r0:r1, c0:c1]
            hit = block == BURNING
            put_out = int(hit.sum())
            before = self.put_out_count[r0:r1, c0:c1]
            self.stats["put_out_again"] += int((hit & (before > 0)).sum())
            before[hit] += 1
            block[hit] = UNBURNT                           # doused, NOT spent: it can burn again once it dries
            self.timer[r0:r1, c0:c1][hit] = 0
            self.M[r0:r1, c0:c1] = np.maximum(self.M[r0:r1, c0:c1], WET)
            self.water -= 1
            self.stats["drops"] += 1; self.stats["put_out"] += put_out
        self.t += 1
        lit, village_lit = 0, 0
        if self.t % self.fire_every == 0:
            lit, village_lit = self.fire_tick()
        if self.t % self.weather_every == 0:
            self.wdir = float((self.wdir + self.rng.normal(0, np.pi / 6)) % (2 * np.pi))
            self.wspd = float(np.clip(self.wspd + self.rng.normal(0, 0.15), 0.0, 1.0))
        if self.reward == "values":
            reward = -lit - 10.0 * village_lit
        elif self.reward == "area":
            reward = -lit
        elif self.reward == "extinguish":
            reward = put_out
        else:
            raise ValueError(self.reward)
        terminated = not (self.S == BURNING).any()         # the fire is out
        truncated = (not terminated) and self.t >= self.max_steps
        info = dict(lit=lit, village_lit=village_lit, put_out=put_out)
        return self.observe(), float(reward), bool(terminated), bool(truncated), info

    def summary(self):
        v = self.T == VILLAGE
        return dict(t=self.t, burnt=int(self.ever.sum()), village_damaged=int((self.ever & v).sum()), **self.stats)

# ---- The commander's world: pick a target cell, a scripted pilot flies the sortie ---------
DECIDE_EVERY = 4                                         # the commander re-decides every 4 steps

def toward(pos, target):
    "The pilot: one step along the longer axis toward target; 5 (fill or drop) on arrival."
    dr, dc = target[0] - pos[0], target[1] - pos[1]
    if dr == 0 and dc == 0: return 5
    if abs(dr) >= abs(dc): return 3 if dr > 0 else 1
    return 2 if dc > 0 else 4

class Command:
    "Action = a target cell 0..255. Refill at the nearest lake if empty, fly to the target, drop."
    nA = N * N
    def __init__(self, reward="values", K=DECIDE_EVERY, **kw):
        self.env = Wildfire(reward, **kw); self.K = K
    def reset(self, seed=None):
        return self.env.reset(seed)
    def step(self, target):
        env = self.env
        tgt = divmod(int(target), N)
        lake = np.argwhere(env.T == LAKE)
        lake = lake[np.abs(lake - env.pos).sum(1).argmin()]
        heading_to_lake = env.water == 0
        total, steps, put_out = 0.0, 0, 0
        while True:
            a = toward(env.pos, lake if heading_to_lake else tgt)
            o, r, terminated, truncated, info = env.step(a)
            total += r; steps += 1; put_out += info["put_out"]
            done_sortie = a == 5 and not heading_to_lake
            if a == 5 and heading_to_lake: heading_to_lake = False
            if done_sortie or terminated or truncated or steps >= self.K: break
        return o, float(total), terminated, truncated, dict(steps=steps, put_out=put_out)

# ---- Fire chiefs: hand-written policies to test the world against -------------------
def pilot_chief(mode):
    "Fly it yourself. Empty bucket: go and fill. Otherwise go to a fire and drop. mode = nearest | guard."
    def act(env):
        if env.water == 0:
            lake = np.argwhere(env.T == LAKE)
            return toward(env.pos, lake[np.abs(lake - env.pos).sum(1).argmin()])
        fire = np.argwhere(env.S == BURNING)
        if len(fire) == 0: return 0
        if mode == "nearest":
            f = fire[np.abs(fire - env.pos).sum(1).argmin()]
        else:
            village = np.argwhere(env.T == VILLAGE).mean(0)
            f = fire[np.hypot(*(fire - village).T).argmin()]
        return toward(env.pos, f)
    return act

def dispatcher(mode, seed=5):
    "A commander rule. mode = random | random_fire | nearest | guard | densest."
    rng = np.random.default_rng(seed)
    def pick(env):
        fire = np.argwhere(env.S == BURNING)
        if mode == "random" or len(fire) == 0: return int(rng.integers(N * N))
        if mode == "random_fire":
            f = fire[rng.integers(len(fire))]
        elif mode == "nearest":
            f = fire[np.abs(fire - env.pos).sum(1).argmin()]
        elif mode == "guard":
            village = np.argwhere(env.T == VILLAGE).mean(0)
            f = fire[np.hypot(*(fire - village).T).argmin()]
        else:                                          # densest: the drop square covering the most fire
            k = env.drop_r; w = 2 * k + 1
            cs = np.pad(np.pad((env.S == BURNING).astype(np.int32), k).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
            cover = cs[w:, w:] - cs[:-w, w:] - cs[w:, :-w] + cs[:-w, :-w]
            best = np.flatnonzero(cover == cover.max())
            return int(best[np.abs(np.stack(np.divmod(best, N), 1) - env.pos).sum(1).argmin()])
        return int(f[0] * N + f[1])
    return pick

# ---- Scoring: 200 held-out worlds (seeds 1000-1199; training never uses them) ---------
def _score(rows, returns):
    m = lambda k: float(np.mean([d[k] for d in rows]))
    return dict(village_damaged=round(m("village_damaged"), 2),
                village_saved=round(float(np.mean([d["village_damaged"] == 0 for d in rows])), 3),
                burnt=round(m("burnt"), 1), put_out=round(m("put_out"), 1), drops=round(m("drops"), 2),
                steps=round(m("t"), 1), ret=round(float(np.mean(returns)), 1))

def fly(policy, n=200, **kw):
    "Score a pilot policy: policy(env) -> action 0..5."
    rows, rets = [], []
    for k in range(n):
        env = Wildfire(**kw); env.reset(seed=1000 + k); G = 0.0
        while True:
            _, r, te, tr, _ = env.step(policy(env)); G += r
            if te or tr: break
        rows.append(env.summary()); rets.append(G)
    return _score(rows, rets)

def command(pick, n=200, K=DECIDE_EVERY, **kw):
    "Score a commander policy: pick(env) -> target cell 0..255."
    rows, rets = [], []
    for k in range(n):
        world = Command(K=K, **kw); world.reset(seed=1000 + k); G = 0.0
        while True:
            _, r, te, tr, _ = world.step(pick(world.env)); G += r
            if te or tr: break
        rows.append(world.env.summary()); rets.append(G)
    return _score(rows, rets)

# ---- Seeing the map ---------------------------------------------------------------------
def draw_fire(env):
    "The map as text. Each cell is two characters wide so the map looks square."
    glyph = {GRASS: " .", FOREST: " ^", ROCK: " #", LAKE: " ~", VILLAGE: " H"}
    arrows = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    toward_dir = arrows[int(round(env.wdir / (np.pi / 4))) % 8]
    print(f"  step {env.t:3d}   wind blowing toward {toward_dir} at {env.wspd:.2f}   bucket {'full' if env.water else 'empty'}")
    print("  +" + "-" * (2 * N) + "+")
    for r in range(N):
        row = ""
        for c in range(N):
            if env.pos[0] == r and env.pos[1] == c: ch = " @"
            elif env.S[r, c] == BURNING: ch = " *"
            elif env.S[r, c] == BURNT: ch = " x"
            else: ch = glyph[int(env.T[r, c])]
            row += ch
        print("  |" + row + "|")
    print("  +" + "-" * (2 * N) + "+")
    print("  . grass  ^ forest  # rock  ~ lake  H village  * burning  x burnt  @ helicopter")
`;

// World 3 of the building-environments track: a Soulslike duel on a circular arena,
// one frame at a time. Both fighters are state machines; a boss move is a list of
// (kind, frames) segments and lands only inside BOTH its reach and its arc.
// Reproduced exactly by scripts/boss_cases.py, which extracts THIS string and runs it.
export const BOSS_SETUP = `import math

import numpy as np

FPS = 30
MAX_FRAMES = 900

# ---------------------------------------------------------------- the arena
ARENA = 8.0                       # radius; both fighters are clamped inside it
START_D = 4.0

# ---------------------------------------------------------------- the two fighters
P_HP_MAX, P_ST_MAX = 100.0, 100.0
B_HP_MAX = 240.0

P_SPEED = 0.075                   # units per frame
B_CHASE = 0.105                   # you cannot outrun it -- rolling is the only way to make space
B_TURN_IDLE = 0.13                # radians per frame while it has no move out
B_TURN_WIND = 0.045               # and while winding one up: enough to punish an EARLY sidestep

ST_REGEN = 0.55
ST_DELAY = 20

# ---------------------------------------------------------------- player actions
A_IDLE = 0
A_MOVE0 = 1                       # 1..8 = move, in eighths of a turn measured FROM the boss
A_ATK = 9
A_ROLL0 = 10                      # 10..13 = roll toward / right / away / left
A_GUARD = 14
A_PARRY = 15
N_ACTIONS = 16
ACTION_NAMES = (["idle"]
                + [f"move {n}" for n in ["in", "in-right", "right", "back-right",
                                         "back", "back-left", "left", "in-left"]]
                + ["attack"]
                + [f"roll {n}" for n in ["in", "right", "back", "left"]]
                + ["guard", "parry"])

ATK_SEG = [("w", 8), ("h", 2), ("r", 14)]
ATK_REACH, ATK_DMG, ATK_COST = 2.0, 12.0, 20.0

ROLL_LEN, ROLL_I0, ROLL_I1 = 18, 3, 12
ROLL_DIST, ROLL_COST = 1.7, 25.0

PARRY_LEN, PAR_I0, PAR_I1, PARRY_COST = 22, 3, 7, 15.0

GUARD_CHIP = 0.20
GUARD_ST = 0.6
HITSTUN, GUARDBREAK = 20, 45
STAGGER = 55
RIPOSTE_MULT = 3.0

# --- poise: the boss can be staggered by being HIT, not only by being parried.
# Two clean hits empty a pool of 50 that refills at 0.08 a frame, so the pool is back in about
# twenty seconds and the two hits have to belong to the same engagement rather than to the duel.
# POISE_STAGGER was measured, not assumed. Short windows (40-50) are almost inert: the punishers
# open two breaks a duel and cash 0.20 of them, because the window shuts before they are back in
# range with the stamina to swing. Worse, 52-56 is a resonance with the sidestepper's roll-and-
# swing cycle that REVERSES which avoider scores better, and 58-64 is the only flat stretch where
# the ordering the floor was built to show holds with margin. 60 sits in the middle of it.
# It is five frames longer than the STAGGER a parry buys, and that is the right way round: a parry
# also negates the blow that opened it and costs 15 stamina with no setup, where a break costs two
# landed attacks and the exposure of getting them in.
B_POISE_MAX = 50.0
POISE_HIT = 25.0
POISE_REGEN = 0.08
POISE_STAGGER = 60

# ---------------------------------------------------------------- the boss moveset
# "w" windup, "d" delay (looks exactly like windup), "h" active, "r" recovery.
# arc is the HALF-width in radians: 0.35 is a thrust you can step out of, 1.40 is a slam you cannot.
MOVES = [
    dict(name="slash", seg=[("w", 14), ("h", 3), ("r", 16)], reach=2.4, arc=0.80, dmg=18.0, adv=0.030),
    dict(name="thrust", seg=[("w", 18), ("h", 2), ("r", 22)], reach=3.6, arc=0.35, dmg=22.0, adv=0.075),
    dict(name="heavy", seg=[("w", 20), ("d", 8), ("h", 4), ("r", 28)], reach=2.7, arc=0.95, dmg=34.0, adv=0.015),
    dict(name="slam", seg=[("w", 24), ("d", 12), ("h", 5), ("r", 30)], reach=2.6, arc=1.40, dmg=30.0, adv=0.000),
    dict(name="combo", seg=[("w", 12), ("h", 3), ("w", 9), ("h", 3), ("r", 22)], reach=2.3, arc=0.70, dmg=14.0, adv=0.045),
]
N_MOVES = len(MOVES)
ENGAGE = 2.9                      # beyond this it closes instead of swinging
BODY = 0.95                       # the two of them are solid: neither walks through the other


def move_len(m):
    return sum(n for _, n in m["seg"])


def phase_at(m, f):
    """Which segment of move m is frame f in? Returns (kind, index of that segment)."""
    acc = 0
    for i, (kind, n) in enumerate(m["seg"]):
        if f < acc + n:
            return kind, i
        acc += n
    return "r", len(m["seg"]) - 1


def wrap(a):
    "An angle into [-pi, pi]."
    return (a + math.pi) % (2 * math.pi) - math.pi


def clamp_arena(x, z):
    r = math.hypot(x, z)
    if r <= ARENA:
        return x, z
    return x * ARENA / r, z * ARENA / r


class Duel:
    """One fight on a floor. step() advances exactly one frame."""

    def __init__(self, seed=0, aggr=0.5, moves=None, reward="damage", chip=GUARD_CHIP,
                 clock=MAX_FRAMES, timeout="truncate"):
        self.rng = np.random.default_rng(seed)
        self.aggr = aggr
        self.allowed = list(range(N_MOVES)) if moves is None else list(moves)
        self.reward_kind = reward
        self.chip = chip
        self.clock = clock
        self.timeout = timeout
        self.reset(seed)

    # ------------------------------------------------------------------ reset
    def reset(self, seed=None):
        if seed is not None:
            self.rng = np.random.default_rng(seed)
            self.seed = seed
        self.t = 0
        # the boss in the middle, the player on a random bearing at arm's length plus a bit
        th = float(self.rng.uniform(-math.pi, math.pi))
        self.bx, self.bz = 0.0, 0.0
        self.px, self.pz = START_D * math.sin(th), START_D * math.cos(th)
        self.bang = self.to_player()
        self.php, self.bhp = P_HP_MAX, B_HP_MAX
        self.pst = P_ST_MAX
        self.pa, self.pf = A_IDLE, 0
        self.pdir = 4                    # the direction a bare roll goes: away
        self.p_stun = 0
        self.p_regen_lock = 0
        self.p_hit_done = False
        self.guarding = False
        self.bm, self.bf = -1, 0
        self.b_seg_done = -1
        self.b_cd = int(self.rng.integers(10, 40))
        self.b_stagger = 0
        self.b_poise = B_POISE_MAX
        self.log = dict(parries=0, blocks=0, guard_breaks=0, hits_taken=0, rolls=0,
                        dodges=0, swings=0, hits_dealt=0, riposte_dmg=0.0, poise_breaks=0,
                        chip_taken=0.0, dmg_taken=0.0, dmg_dealt=0.0, whiffs=0,
                        guard_frames=0, wall_frames=0, arc_misses=0,
                        boss_moves=np.zeros(N_MOVES, int))
        return self.obs()

    # ------------------------------------------------------------------ geometry
    @property
    def d(self):
        return math.hypot(self.px - self.bx, self.pz - self.bz)

    def to_player(self):
        return math.atan2(self.px - self.bx, self.pz - self.bz)

    def off_axis(self):
        "How far off the boss's centre line you are, in radians. 0 = dead ahead."
        return wrap(self.to_player() - self.bang)

    # ------------------------------------------------------------------ helpers
    @property
    def busy(self):
        if self.p_stun > 0:
            return True
        if self.pa == A_ATK:
            return self.pf < move_len(dict(seg=ATK_SEG))
        if A_ROLL0 <= self.pa <= A_ROLL0 + 3:
            return self.pf < ROLL_LEN
        if self.pa == A_PARRY:
            return self.pf < PARRY_LEN
        return False

    def spend(self, c):
        self.pst = max(0.0, self.pst - c)
        self.p_regen_lock = ST_DELAY

    def _shift(self, eighths, dist):
        "Move the player dist units along a bearing measured in eighths of a turn from the boss."
        ang = self.to_player() + math.pi + eighths * math.pi / 4.0
        self.px, self.pz = clamp_arena(self.px + dist * math.sin(ang),
                                       self.pz + dist * math.cos(ang))
        self._separate()

    def _separate(self):
        """Keep the two bodies apart.

        Without this the boss simply walks through the player while closing, and the player
        ends up standing behind it -- which the one-dimensional version could not express and
        which looks exactly as wrong as it is once the duel is drawn on a floor.
        """
        dx, dz = self.px - self.bx, self.pz - self.bz
        r = math.hypot(dx, dz)
        if r >= BODY:
            return
        if r < 1e-9:
            dx, dz, r = math.sin(self.bang), math.cos(self.bang), 1.0
        ux, uz = dx / r, dz / r
        self.px, self.pz = clamp_arena(self.bx + ux * BODY, self.bz + uz * BODY)
        # if the wall stopped the player being pushed out, push the boss back instead
        if math.hypot(self.px - self.bx, self.pz - self.bz) < BODY - 1e-9:
            self.bx, self.bz = clamp_arena(self.px - ux * BODY, self.pz - uz * BODY)

    # ------------------------------------------------------------------ one frame
    def step(self, a):
        php0, bhp0 = self.php, self.bhp

        # --- 1. the button, if it is even read this frame -----------------------
        if not self.busy:
            self.guarding = (a == A_GUARD)
            if A_MOVE0 <= a <= A_MOVE0 + 7:
                self.pdir = (a - A_MOVE0)
                self.pa, self.pf = a, 0
            elif a == A_ATK and self.pst >= ATK_COST:
                self.pa, self.pf, self.p_hit_done = A_ATK, 0, False
                self.spend(ATK_COST)
                self.log["swings"] += 1
            elif A_ROLL0 <= a <= A_ROLL0 + 3 and self.pst >= ROLL_COST:
                self.pa, self.pf = a, 0
                self.pdir = 2 * (a - A_ROLL0)
                self.spend(ROLL_COST)
                self.log["rolls"] += 1
            elif a == A_PARRY and self.pst >= PARRY_COST:
                self.pa, self.pf = A_PARRY, 0
                self.spend(PARRY_COST)
            elif a in (A_IDLE, A_GUARD):
                self.pa, self.pf = a, 0

        if self.guarding:
            self.log["guard_frames"] += 1
        if self.d > 0 and math.hypot(self.px, self.pz) > ARENA - 0.6:
            self.log["wall_frames"] += 1

        # --- 2. the player moves -----------------------------------------------
        if self.p_stun == 0:
            if A_MOVE0 <= self.pa <= A_MOVE0 + 7:
                self._shift(self.pa - A_MOVE0, P_SPEED * (0.55 if self.guarding else 1.0))
            elif A_ROLL0 <= self.pa <= A_ROLL0 + 3 and self.pf < ROLL_I1:
                self._shift(2 * (self.pa - A_ROLL0), ROLL_DIST / ROLL_I1)

        # --- 3. the boss decides ------------------------------------------------
        if self.b_stagger > 0:
            self.b_stagger -= 1
        elif self.bm < 0:
            if self.b_cd > 0:
                self.b_cd -= 1
            self.bang = self.bang + max(-B_TURN_IDLE, min(B_TURN_IDLE, wrap(self.to_player() - self.bang)))
            if self.d > ENGAGE:
                self._close(B_CHASE)
            if self.b_cd <= 0 and self.d <= ENGAGE:
                self.bm = self._pick()
                self.bf, self.b_seg_done = 0, -1
                self.log["boss_moves"][self.bm] += 1

        # --- 4. the boss animation, its facing, and its hitboxes ----------------
        if self.bm >= 0 and self.b_stagger == 0:
            m = MOVES[self.bm]
            kind, seg = phase_at(m, self.bf)
            if kind in ("w", "d"):
                # it can still correct its aim while winding up, but only slowly
                self.bang = self.bang + max(-B_TURN_WIND, min(B_TURN_WIND, wrap(self.to_player() - self.bang)))
                self._close(m["adv"])
            if kind == "h" and seg != self.b_seg_done:
                if self.d <= m["reach"] and abs(self.off_axis()) <= m["arc"]:
                    self._boss_hits(m["dmg"])
                    self.b_seg_done = seg
                elif self.bf == self._seg_start(m, seg):
                    self.log["whiffs"] += 1
                    if self.d <= m["reach"]:
                        self.log["arc_misses"] += 1      # in range, but you were not in front of it
            self.bf += 1
            if self.bf >= move_len(m):
                self.bm, self.bf = -1, 0
                lo = int(round(6 + 40 * (1.0 - self.aggr)))
                self.b_cd = int(self.rng.integers(lo, lo + 26))

        # --- 5. the player's own hitbox ----------------------------------------
        if self.pa == A_ATK:
            kind, _ = phase_at(dict(seg=ATK_SEG), self.pf)
            if kind == "h" and not self.p_hit_done and self.d <= ATK_REACH:
                mult = RIPOSTE_MULT if self.b_stagger > 0 else 1.0
                dealt = ATK_DMG * mult
                self.bhp -= dealt
                self.p_hit_done = True
                self.log["hits_dealt"] += 1
                self.log["dmg_dealt"] += dealt
                if mult > 1.0:
                    self.log["riposte_dmg"] += dealt
                else:
                    # Poise. The multiplier above was read BEFORE this, so the hit that breaks
                    # the pool does ordinary damage and the riposte is the NEXT one: a break is
                    # only worth anything if you follow it up.
                    self.b_poise -= POISE_HIT
                    if self.b_poise <= 0.0:
                        self._stagger(POISE_STAGGER)
                        self.log["poise_breaks"] += 1

        # --- 6. clocks -----------------------------------------------------------
        if self.b_stagger == 0:
            self.b_poise = min(B_POISE_MAX, self.b_poise + POISE_REGEN)
        self.pf += 1
        if self.p_stun > 0:
            self.p_stun -= 1
        if self.p_regen_lock > 0:
            self.p_regen_lock -= 1
        elif not self.guarding:
            self.pst = min(P_ST_MAX, self.pst + ST_REGEN)
        self.t += 1

        won, lost = self.bhp <= 0, self.php <= 0
        terminated = bool(won or lost)
        truncated = bool(self.t >= self.clock and not terminated)
        if truncated and self.timeout == "defeat":
            lost, terminated, truncated = True, True, False
        r = self._reward(php0, bhp0, won, lost)
        return self.obs(), r, terminated, truncated, dict(won=won, lost=lost)

    def _close(self, dist):
        "The boss walks dist units along its own facing."
        self.bx, self.bz = clamp_arena(self.bx + dist * math.sin(self.bang),
                                       self.bz + dist * math.cos(self.bang))
        self._separate()

    def _seg_start(self, m, seg):
        return sum(n for _, n in m["seg"][:seg])

    def _pick(self):
        cands = []
        for i in self.allowed:
            m = MOVES[i]
            wind = sum(n for k, n in m["seg"] if k in ("w", "d"))
            if m["reach"] + m["adv"] * wind >= self.d - 0.1:
                cands.append(i)
        if not cands:
            cands = [1]
        w = np.array([1.0 + 1.5 * self.aggr if MOVES[i]["name"] in ("heavy", "slam") else 1.0
                      for i in cands])
        return int(self.rng.choice(cands, p=w / w.sum()))

    def _stagger(self, frames):
        """Put the boss down. Any stagger cancels the move it had out and refills its poise."""
        self.b_stagger = frames
        self.b_poise = B_POISE_MAX
        self.bm, self.bf = -1, 0
        self.b_cd = 0

    def _boss_hits(self, dmg):
        if A_ROLL0 <= self.pa <= A_ROLL0 + 3 and ROLL_I0 <= self.pf <= ROLL_I1:
            self.log["dodges"] += 1
            return
        if self.pa == A_PARRY and PAR_I0 <= self.pf <= PAR_I1:
            self.log["parries"] += 1
            self._stagger(STAGGER)
            return
        # the player is locked on to the boss, exactly as these games do it, so a raised shield
        # always covers the attack. (An earlier version tested a guard arc here and, because the
        # player always faces the boss, that test was false whenever it mattered: hold guard
        # blocked NOTHING and scored identically to standing still.)
        if self.guarding and self.pst > 0:
            chip = dmg * self.chip
            self.php -= chip
            self.pst -= dmg * GUARD_ST
            self.p_regen_lock = ST_DELAY
            self.log["blocks"] += 1
            self.log["chip_taken"] += chip
            self.log["dmg_taken"] += chip
            if self.pst <= 0:
                self.pst = 0.0
                self.p_stun = GUARDBREAK
                self.pa, self.pf = A_IDLE, 0
                self.guarding = False
                self.log["guard_breaks"] += 1
            return
        self.php -= dmg
        self.p_stun = HITSTUN
        self.pa, self.pf = A_IDLE, 0
        self.guarding = False
        self.log["hits_taken"] += 1
        self.log["dmg_taken"] += dmg

    # ------------------------------------------------------------------ reward
    def _reward(self, php0, bhp0, won, lost):
        dealt = bhp0 - self.bhp
        taken = php0 - self.php
        if self.reward_kind == "damage":
            r = 0.1 * dealt - 0.1 * taken
        elif self.reward_kind == "trade":
            r = 0.1 * dealt
        elif self.reward_kind == "survive":
            r = 1.0 / FPS
        else:
            raise ValueError(self.reward_kind)
        if won:
            r += 30.0
        if lost:
            r -= 30.0
        return float(r)

    # ------------------------------------------------------------------ what it sees
    def obs(self):
        m = MOVES[self.bm] if self.bm >= 0 else None
        kind = phase_at(m, self.bf)[0] if m else "i"
        off = self.off_axis()
        v = np.zeros(27, np.float32)
        v[0] = self.d / ARENA
        v[1] = math.sin(off)
        v[2] = math.cos(off)
        v[3] = (ARENA - math.hypot(self.px, self.pz)) / ARENA     # room behind you
        v[4] = self.php / P_HP_MAX
        v[5] = self.bhp / B_HP_MAX
        v[6] = self.pst / P_ST_MAX
        v[7] = self.pa / (N_ACTIONS - 1)
        v[8] = min(self.pf, 40) / 40.0
        v[9] = self.p_stun / GUARDBREAK
        v[10] = 1.0 if self.guarding else 0.0
        if m is not None:
            v[11 + self.bm] = 1.0                                  # which move (5 slots)
        v[16] = min(self.bf, 60) / 60.0
        v[17] = 1.0 if kind == "w" else 0.0
        v[18] = 1.0 if kind == "d" else 0.0
        v[19] = 1.0 if kind == "h" else 0.0
        v[20] = 1.0 if kind == "r" else 0.0
        v[21] = self.b_stagger / STAGGER
        v[22] = (m["reach"] / ARENA) if m is not None else 0.0
        v[23] = m["arc"] if m is not None else 0.0
        v[24] = 1.0 if (m is not None and self.d <= m["reach"] and abs(off) <= m["arc"]) else 0.0
        v[25] = self.t / self.clock
        v[26] = self.b_poise / B_POISE_MAX
        return v


IN, IN_R, RIGHT, BACK_R, BACK, BACK_L, LEFT, IN_L = range(8)
ROLL_IN, ROLL_RIGHT, ROLL_BACK, ROLL_LEFT = (A_ROLL0 + i for i in range(4))


def frames_to_active(env):
    """Frames until the boss's next active frame, or None if it has no move out."""
    if env.bm < 0 or env.b_stagger > 0:
        return None
    m = MOVES[env.bm]
    acc, f = 0, env.bf
    for i, (kind, n) in enumerate(m["seg"]):
        if kind == "h" and acc + n > f and i != env.b_seg_done:
            return max(0, acc - f)
        acc += n
    return None


def will_connect(env, slack=0.25):
    """Is the player currently inside the reach AND the arc of the move being wound up?"""
    if env.bm < 0 or env.b_stagger > 0:
        return False
    m = MOVES[env.bm]
    return env.d <= m["reach"] + slack and abs(env.off_axis()) <= m["arc"]


def boss_recovering(env):
    if env.bm < 0:
        return env.b_stagger == 0
    return phase_at(MOVES[env.bm], env.bf)[0] == "r"


def hold_range(env, lo=1.5, hi=2.2):
    "Stay inside the boss's threat range so it actually attacks, without crowding it."
    if env.d > hi:
        return A_MOVE0 + IN
    if env.d < lo:
        return A_MOVE0 + BACK
    return A_IDLE


def close_and_hit(env):
    if env.d > ATK_REACH - 0.15:
        return A_MOVE0 + IN
    return A_ATK if env.pst >= ATK_COST else A_IDLE


# --------------------------------------------------------------------- the ladder
def stand_still(env):
    return A_IDLE


def random_buttons(seed=0):
    box = {"rng": np.random.default_rng(seed)}

    def pol(env):
        if env.t == 0:
            box["rng"] = np.random.default_rng(seed + 7919 * env.seed)
        return int(box["rng"].integers(0, N_ACTIONS))
    return pol


def masher(env):
    """Walk in and swing whenever the bar allows."""
    return close_and_hit(env)


def turtle(env):
    return A_GUARD


def run_away(env):
    """Refuse the duel. On a floor with a wall there is nowhere to go, which is the point."""
    return A_MOVE0 + BACK


def circle(env):
    """Walk around it forever. The classic thing a new player tries in two dimensions."""
    return A_MOVE0 + RIGHT


def block_and_punish(env):
    if env.b_stagger > 0 or boss_recovering(env):
        if env.pst >= ATK_COST:
            return close_and_hit(env)
    return A_GUARD


def roll_and_punish(env):
    """Roll AWAY through the active frames."""
    k = frames_to_active(env)
    if k is not None and 3 <= k <= 10 and will_connect(env) and env.pst >= ROLL_COST:
        return ROLL_BACK
    if env.b_stagger > 0 or boss_recovering(env):
        if env.pst >= ATK_COST + ROLL_COST:
            return close_and_hit(env)
    return hold_range(env)


def sidestep_and_punish(env):
    """Step OUT OF THE ARC instead of away from it, then punish from the side.

    This is the player v1 could not have: rolling sideways keeps you close enough to hit the
    recovery, which rolling backwards does not. It only works because the boss commits its
    facing when the active frames start.
    """
    k = frames_to_active(env)
    if k is not None and 3 <= k <= 10 and will_connect(env) and env.pst >= ROLL_COST:
        return ROLL_RIGHT if env.off_axis() >= 0 else ROLL_LEFT
    if env.b_stagger > 0 or boss_recovering(env):
        if env.pst >= ATK_COST + ROLL_COST:
            return close_and_hit(env)
    return hold_range(env)


def parry_oracle(env):
    """Reads the animation clock and parries on frame; also punishes recovery."""
    k = frames_to_active(env)
    want = (PAR_I0 + PAR_I1) // 2
    if k is not None and 3 <= k <= want and will_connect(env) and env.pst >= PARRY_COST:
        return A_PARRY
    if env.b_stagger > 0:
        return close_and_hit(env)
    if boss_recovering(env) and env.pst >= ATK_COST + PARRY_COST:
        return close_and_hit(env)
    return hold_range(env)


def patient_parry(env):
    """The oracle minus the greed: it swings only while the boss is staggered, and only while
    the stagger will outlast the whole swing."""
    k = frames_to_active(env)
    want = (PAR_I0 + PAR_I1) // 2
    if k is not None and 3 <= k <= want and will_connect(env) and env.pst >= PARRY_COST:
        return A_PARRY
    if env.b_stagger > move_len(dict(seg=ATK_SEG)):
        if env.pst >= ATK_COST + PARRY_COST or env.d > ATK_REACH - 0.15:
            return close_and_hit(env)
    return hold_range(env)


PLAYERS = [
    ("stand still", stand_still), ("random buttons", random_buttons()),
    ("mash attack", masher), ("run away", run_away), ("circle", circle),
    ("hold guard", turtle), ("block, punish", block_and_punish),
    ("roll, punish", roll_and_punish), ("sidestep, punish", sidestep_and_punish),
    ("parry oracle", parry_oracle), ("patient parry", patient_parry),
]


# --------------------------------------------------------------------- scoring
def duel(policy, seed=0, repeat=3, **kw):
    env = Duel(seed=seed, **kw)
    G, a, dsum, offsum = 0.0, A_IDLE, 0.0, 0.0
    while True:
        if env.t % repeat == 0:
            a = policy(env)
        _, r, term, trunc, info = env.step(a)
        G += r
        dsum += env.d
        offsum += abs(env.off_axis())
        if term or trunc:
            return dict(G=G, frames=env.t, won=int(info["won"]), lost=int(info["lost"]),
                        php=env.php, bhp=env.bhp, meanD=dsum / env.t,
                        meanOff=offsum / env.t, **env.log)


def score(policy, n=200, seed0=1000, repeat=3, **kw):
    rows = [duel(policy, seed=seed0 + i, repeat=repeat, **kw) for i in range(n)]
    out = dict(win=sum(r["won"] for r in rows), die=sum(r["lost"] for r in rows), n=n)
    out["clock"] = n - out["win"] - out["die"]
    for k in rows[0]:
        if k not in ("won", "lost", "boss_moves"):
            out[k] = float(np.mean([float(r[k]) for r in rows]))
    out["guard_pct"] = 100.0 * out["guard_frames"] / out["frames"]
    out["wall_pct"] = 100.0 * out["wall_frames"] / out["frames"]
    return out


def ladder(players=None, n=200, seed0=1000, repeat=3, **kw):
    print("player           win  die  clk  bossHP  ownHP   sec  meanD  offax  parry  poise  block   brk  hits  dodge  arcX  swing  wall%        G")
    out = {}
    for name, pol in (PLAYERS if players is None else players):
        r = score(pol, n=n, seed0=seed0, repeat=repeat, **kw)
        out[name] = r
        print("%-16s %4d %4d %4d %7.1f %6.1f %5.1f %6.2f %6.2f %6.2f %6.2f %6.2f %5.2f %5.2f %6.2f %5.2f %6.2f %6.1f %8.2f" % (
            name, r["win"], r["die"], r["clock"], r["bhp"], r["php"], r["frames"] / FPS,
            r["meanD"], r["meanOff"], r["parries"], r["poise_breaks"], r["blocks"], r["guard_breaks"],
            r["hits_taken"], r["dodges"], r["arc_misses"], r["swings"], r["wall_pct"], r["G"]))
    return out


def timeline(name, width=1):
    """Draw one boss move as the frames it actually occupies."""
    m = [x for x in MOVES if x["name"] == name][0]
    mark = {"w": "-", "d": "=", "h": "#", "r": "."}
    bar = "".join(mark[k] * (n * width) for k, n in m["seg"])
    return "%-7s %s  %d frames, reach %.1f, arc %.2f rad, %.0f damage" % (
        name, bar, move_len(m), m["reach"], m["arc"], m["dmg"])


def moveset():
    print("windup -   delay =   ACTIVE #   recovery .")
    for m in MOVES:
        print(timeline(m["name"]))
`;

/**
 * The duel, version 2 -- "The Warden, rebound".
 *
 * BOSS_SETUP above is FROZEN: every number published in World 3 was measured against it.
 * This is a second world standing beside it, not a patch to the first. Eight moves instead
 * of five (a jab too fast to react to, a sweep too wide to step around, and an unblockable
 * eruption that covers the whole circle), a parry window of three frames that shrinks every
 * time you press it again too soon, a bigger ring, and a heavy attack for the player.
 *
 * The twin of src/components/boss/duelSimV2.ts; scripts/boss_port_check_v2.mjs feeds both
 * the same boss decisions and compares every frame.
 */
export const BOSS_SETUP_V2 = `import math

import numpy as np

FPS = 30
MAX_FRAMES = 1080                 # 36 seconds

# --------------------------------------------------------------------- the floor
ARENA = 11.0                      # radius; both fighters are clamped inside it
START_D = 5.5
P_HP_MAX = 100.0
P_ST_MAX = 100.0
B_HP_MAX = 300.0

P_SPEED = 0.075                   # units per frame
B_CHASE = 0.105                   # you cannot outrun it -- rolling is the only way to make space
B_TURN_IDLE = 0.13                # radians per frame while it has no move out
B_TURN_WIND = 0.045               # and while winding one up: enough to punish an EARLY sidestep

ST_REGEN = 0.55
ST_DELAY = 20

# --------------------------------------------------------------------- the buttons
A_IDLE = 0
A_MOVE0 = 1
A_ATK = 9
A_ROLL0 = 10
A_GUARD = 14
A_PARRY = 15
A_HEAVY = 16
N_ACTIONS = 17
# Twelve RESERVED slots for the move one-hot, not len(MOVES). The ninth move shifted every index
# after it and made two trained nets unloadable; this is the cheap insurance against doing that
# again. Three unused floats is a fair price.
MOVE_SLOTS = 12
N_OBS = 38
ACTION_NAMES = (["idle"]
                + ["move in", "move in-right", "move right", "move back-right",
                   "move back", "move back-left", "move left", "move in-left"]
                + ["attack"]
                + ["roll in", "roll right", "roll back", "roll left"]
                + ["guard", "parry", "heavy attack"])

# --------------------------------------------------------------------- the player's two swings
# Light: fast and cheap, and worth very little posture. Twelve or thirteen of them break
# the boss, which is a real plan but a slow one -- see the note on POISE_REGEN.
ATK_SEG = [("w", 8), ("h", 2), ("r", 14)]
ATK_REACH = 2.0
ATK_DMG = 12.0
ATK_COST = 20.0
POISE_HIT = 16.0
# Heavy: slower than every boss move but the eruption, and worth more poise damage than a light
# -- but nothing like a whole pool on its own.
#
# Breaking poise takes THREE landed swings, and it takes three whatever you throw: heavy-only,
# light-only or mixed. That is not the arithmetic it looks like (36 + 36 = 72 >= 70), because the
# pool REGENERATES while you are swinging -- a heavy is 39 frames, which is 3.1 points back --
# so two heavies land on 1.2 remaining and the third is what puts it down. Measured, not
# reasoned: scripts/boss_v2_cases.py poise prints the trace.
#
# The first build of this world had the heavy at 50 against a pool of 50, so ONE broke poise from
# full and the trained agent stunlocked the boss for a 12.8-second win. See boss_v2_stunlock.py.
ATK2_SEG = [("w", 14), ("h", 3), ("r", 22)]
ATK2_REACH = 2.3
ATK2_DMG = 26.0
ATK2_COST = 34.0
# 33 against a pool of 100: FIVE landed heavies break the boss, not one and not two. The
# heavy is the posture weapon -- a light is worth about half of it per swing and less than half
# per second, so committing to the slow swing is what actually moves the bar.
POISE_HIT2 = 33.0

ROLL_LEN = 18
ROLL_I0 = 3
ROLL_I1 = 12
ROLL_DIST = 1.7
ROLL_COST = 25.0

# --------------------------------------------------------------------- the parry, rebuilt
# Sekiro's deflect is 12 frames at 60fps by default and SHRINKS with each recent press of the
# guard button -- down to about 4 frames, and to nothing if you mash -- clearing again after
# about 30 frames of not pressing, or instantly on a successful deflect.
#
# Ported to this sim's 30fps: 6 frames of window -- 200ms, the same wall-clock as the
# source material -- losing PARRY_STEP frames for each press inside PARRY_HEAT, and heat that
# outlasts the recovery so that pressing again as soon as you are able DOES stack. An earlier
# build used 3 frames and called it a port; it was half the window it claimed to be. The width
# is forgiving now and the fatigue does the punishing, which is the split the source actually
# uses: a correct read should land, and what should cost you is pressing when you had not read
# anything. PARRY_LEN is shorter than v1's 22 precisely so that mashing is physically possible
# -- a mechanic that punishes an input you cannot make teaches nothing.
PARRY_LEN = 16
PAR_I0 = 2
PARRY_WIN = 6
# Frames of window lost per press inside PARRY_HEAT. At 2 the ladder is 6 -> 4 -> 2 -> 0, so
# three hasty presses still spend the window completely.
PARRY_STEP = 2
PARRY_HEAT = 30
PARRY_MAX_STACK = 3
PARRY_COST = 15.0

GUARD_CHIP = 0.20
GUARD_ST = 0.6
HITSTUN = 20
GUARDBREAK = 45
STAGGER = 55
RIPOSTE_MULT = 3.0

B_POISE_MAX = 100.0
# The bar is progress you can LOSE. At 0.35 a frame the boss recovers 10.5 posture a second,
# so disengaging for two seconds gives back roughly the whole of one heavy. That is the tension
# the old 0.08 did not have: there, progress was permanent and backing off was free, so there
# was no reason not to poke once and leave. Now pressure has to be sustained or it is wasted.
POISE_REGEN = 0.35
POISE_STAGGER = 60
# A landed parry is the biggest single source of posture damage in the game -- more than a heavy
# -- but it does NOT stagger on its own any more. It cancels the move and interrupts for
# PARRY_FLINCH frames, which is far too short to riposte into. The riposte window only opens when
# the bar actually breaks. One deflect never dropped a Sekiro boss either.
PARRY_POISE = 50.0
PARRY_FLINCH = 14
# Posture recovery is tied to vitality. Above REGEN_HI health it recovers at full rate, between
# REGEN_LO and REGEN_HI at half, and below REGEN_LO it does not recover at all. This is what makes
# the fight snowball: the pressure you build early stops leaking once the boss is hurt.
REGEN_HI = 0.7
REGEN_LO = 0.5

# --------------------------------------------------------------------- the moveset
# arc is a HALF-angle in radians: the move connects when the player is within arc of the boss's
# centre line. 3.20 is past pi, which is how "everywhere" is spelled.
#
# v1 had five moves and they were all frontal cones of a similar width, so one answer -- back
# away and to the side -- covered nearly all of them. The three additions each close one of the
# doors that left open:
#   jab        18 frames start to finish. Too fast to react to, so it has to be respected before
#              it starts, which is a different skill from reacting.
#   sweep      arc 1.90. You cannot sidestep it. You leave, or you wear it.
#   eruption   the full circle out to 4.2m, and UNBLOCKABLE: no guard, no parry. The only answer
#              is to not be standing there, which costs stamina you wanted for something else.
MOVES = [
    dict(name="jab", seg=[("w", 6), ("h", 2), ("r", 10)],
         reach=2.2, arc=0.70, dmg=11, adv=0.05),
    dict(name="slash", seg=[("w", 14), ("h", 3), ("r", 16)],
         reach=2.4, arc=0.80, dmg=18, adv=0.03),
    dict(name="thrust", seg=[("w", 18), ("h", 2), ("r", 22)],
         reach=3.6, arc=0.35, dmg=22, adv=0.075),
    dict(name="sweep", seg=[("w", 16), ("h", 4), ("r", 24)],
         reach=3.2, arc=1.90, dmg=26, adv=0.04),
    dict(name="heavy", seg=[("w", 20), ("d", 8), ("h", 4), ("r", 28)],
         reach=2.7, arc=0.95, dmg=34, adv=0.015),
    dict(name="slam", seg=[("w", 24), ("d", 12), ("h", 5), ("r", 30)],
         reach=2.6, arc=1.40, dmg=30, adv=0.0),
    dict(name="combo", seg=[("w", 12), ("h", 3), ("w", 9), ("h", 3), ("r", 22)],
         reach=2.3, arc=0.70, dmg=14, adv=0.045),
    dict(name="flurry",
         seg=[("w", 14), ("h", 2), ("w", 16), ("h", 2), ("w", 16), ("h", 2),
              ("w", 16), ("h", 2), ("w", 16), ("h", 2), ("r", 26)],
         reach=2.4, arc=0.75, dmg=9, adv=0.03),
    dict(name="onslaught",
         seg=[("w", 16), ("h", 2), ("w", 18), ("h", 2), ("w", 18), ("h", 2),
              ("w", 18), ("h", 2), ("d", 14), ("w", 10), ("h", 2), ("w", 18),
              ("h", 2), ("w", 18), ("h", 2), ("r", 30)],
         reach=2.5, arc=0.80, dmg=8, adv=0.025),
    dict(name="lunge", seg=[("w", 18), ("h", 3), ("r", 26)],
         reach=2.8, arc=0.60, dmg=24, adv=0.22, gap=True),
    dict(name="eruption", seg=[("w", 30), ("d", 8), ("h", 6), ("r", 34)],
         reach=4.2, arc=3.20, dmg=40, adv=0.0, unblockable=True),
]
N_MOVES = len(MOVES)
ENGAGE = 3.4                      # beyond this it closes instead of swinging
# How far out the boss will start a GAP-CLOSER. Everything else needs you inside ENGAGE, so
# backing off used to mean the boss simply walked at you and nothing happened until it arrived.
# The lunge closes 18 x 0.22 = 4.0 units during its own windup, which is what makes retreating a
# decision with a cost rather than a free reset.
LUNGE_ENGAGE = 7.0
BODY = 0.95                       # the two of them are solid: neither walks through the other


def move_len(m):
    return sum(n for _, n in m["seg"])


def phase_at(m, f):
    "Which segment of the animation frame f falls in, and its index."
    acc = 0
    for i, (kind, n) in enumerate(m["seg"]):
        if f < acc + n:
            return kind, i
        acc += n
    return "r", len(m["seg"]) - 1


def wrap(a):
    "An angle folded back into -pi..pi."
    return (a + math.pi) % (2 * math.pi) - math.pi


def clamp_arena(x, z):
    r = math.hypot(x, z)
    if r <= ARENA:
        return x, z
    return x * ARENA / r, z * ARENA / r


class Duel:
    """One fight on a floor. step() advances exactly one frame."""

    def __init__(self, seed=0, aggr=0.5, moves=None, reward="damage", chip=GUARD_CHIP,
                 clock=MAX_FRAMES, timeout="truncate",
                 poise_max=B_POISE_MAX, poise_hit=POISE_HIT, poise_hit2=POISE_HIT2,
                 poise_regen=POISE_REGEN, parry_poise=PARRY_POISE):
        # poise_max / poise_hit2 are overridable so the SUPERSEDED build stays reproducible: the
        # first v2 had a 50-point pool and a heavy worth 50, i.e. a guaranteed break from full,
        # and the agent trained against it found a stunlock. scripts/boss_v2_stunlock.py.
        self.rng = np.random.default_rng(seed)
        self.poise_max = poise_max
        self.poise_hit = poise_hit
        self.poise_hit2 = poise_hit2
        self.poise_regen = poise_regen
        self.parry_poise = parry_poise
        self.aggr = aggr
        self.allowed = list(range(N_MOVES)) if moves is None else list(moves)
        self.reward_kind = reward
        self.chip = chip
        self.clock = clock
        self.timeout = timeout
        self.reset(seed)

    # ------------------------------------------------------------------ reset
    def reset(self, seed=None):
        if seed is not None:
            self.rng = np.random.default_rng(seed)
            self.seed = seed
        self.t = 0
        th = float(self.rng.uniform(-math.pi, math.pi))
        self.bx, self.bz = 0.0, 0.0
        self.px, self.pz = START_D * math.sin(th), START_D * math.cos(th)
        self.bang = self.to_player()
        self.php, self.bhp = P_HP_MAX, B_HP_MAX
        self.pst = P_ST_MAX
        self.pa, self.pf = A_IDLE, 0
        self.pdir = 4
        self.p_stun = 0
        self.p_regen_lock = 0
        self.p_hit_done = False
        self.guarding = False
        self.bm, self.bf = -1, 0
        self.b_seg_done = -1
        self.b_cd = int(self.rng.integers(10, 40))
        self.b_stagger = 0
        self.b_poise = self.poise_max
        self.parry_stack = 0          # 0 fresh, PARRY_MAX_STACK is no window at all
        self.parry_heat = 0           # frames left in which another press counts as a repeat
        self.parry_win = PARRY_WIN    # the window THIS parry was started with
        self.b_flinch = 0             # parried: move cancelled, but NOT a riposte window
        self.log = dict(parries=0, blocks=0, guard_breaks=0, hits_taken=0, rolls=0,
                        dodges=0, swings=0, heavies=0, hits_dealt=0, riposte_dmg=0.0,
                        poise_breaks=0, chip_taken=0.0, dmg_taken=0.0, dmg_dealt=0.0,
                        whiffs=0, guard_frames=0, wall_frames=0, arc_misses=0,
                        parry_mashes=0, parry_dead=0, erupt_taken=0,
                        boss_moves=np.zeros(N_MOVES, int))
        return self.obs()

    # ------------------------------------------------------------------ geometry
    @property
    def d(self):
        return math.hypot(self.px - self.bx, self.pz - self.bz)

    def to_player(self):
        return math.atan2(self.px - self.bx, self.pz - self.bz)

    def off_axis(self):
        "How far off the boss's centre line you are, in radians. 0 = dead ahead."
        return wrap(self.to_player() - self.bang)

    # ------------------------------------------------------------------ helpers
    @property
    def busy(self):
        if self.p_stun > 0:
            return True
        if self.pa == A_ATK:
            return self.pf < move_len(dict(seg=ATK_SEG))
        if self.pa == A_HEAVY:
            return self.pf < move_len(dict(seg=ATK2_SEG))
        if A_ROLL0 <= self.pa <= A_ROLL0 + 3:
            return self.pf < ROLL_LEN
        if self.pa == A_PARRY:
            return self.pf < PARRY_LEN
        return False

    @property
    def parry_live(self):
        "Is the parry actually catching this frame? Uses the window frozen at press time."
        return self.pa == A_PARRY and PAR_I0 <= self.pf < PAR_I0 + self.parry_win

    def spend(self, c):
        self.pst = max(0.0, self.pst - c)
        self.p_regen_lock = ST_DELAY

    def _shift(self, eighths, dist):
        ang = self.to_player() + math.pi + eighths * math.pi / 4
        self.px, self.pz = clamp_arena(self.px + dist * math.sin(ang),
                                       self.pz + dist * math.cos(ang))
        self._separate()

    def _close(self, dist):
        self.bx, self.bz = clamp_arena(self.bx + dist * math.sin(self.bang),
                                       self.bz + dist * math.cos(self.bang))
        self._separate()

    def _separate(self):
        "Keep the two bodies apart, so the boss shoves the player instead of walking through."
        dx, dz = self.px - self.bx, self.pz - self.bz
        r = math.hypot(dx, dz)
        if r >= BODY:
            return
        if r < 1e-9:
            dx, dz, r = math.sin(self.bang), math.cos(self.bang), 1.0
        ux, uz = dx / r, dz / r
        self.px, self.pz = clamp_arena(self.bx + ux * BODY, self.bz + uz * BODY)
        if math.hypot(self.px - self.bx, self.pz - self.bz) < BODY - 1e-9:
            self.bx, self.bz = clamp_arena(self.px - ux * BODY, self.pz - uz * BODY)

    def _seg_start(self, m, seg):
        return sum(n for _, n in m["seg"][:seg])

    def _start_parry(self):
        "The button went down. Freeze the window it gets, and charge it for the habit."
        if self.parry_heat > 0:
            self.parry_stack = min(PARRY_MAX_STACK, self.parry_stack + 1)
            self.log["parry_mashes"] += 1
        else:
            self.parry_stack = 0
        self.parry_heat = PARRY_HEAT
        self.parry_win = max(0, PARRY_WIN - PARRY_STEP * self.parry_stack)
        if self.parry_win == 0:
            self.log["parry_dead"] += 1
        self.pa, self.pf = A_PARRY, 0
        self.spend(PARRY_COST)

    # ------------------------------------------------------------------ one frame
    def step(self, a):
        php0, bhp0 = self.php, self.bhp

        # 1. the button, if it is even read this frame
        if not self.busy:
            self.guarding = a == A_GUARD
            if A_MOVE0 <= a <= A_MOVE0 + 7:
                self.pa, self.pf = a, 0
            elif a == A_ATK and self.pst >= ATK_COST:
                self.pa, self.pf, self.p_hit_done = A_ATK, 0, False
                self.spend(ATK_COST)
                self.log["swings"] += 1
            elif a == A_HEAVY and self.pst >= ATK2_COST:
                self.pa, self.pf, self.p_hit_done = A_HEAVY, 0, False
                self.spend(ATK2_COST)
                self.log["swings"] += 1
                self.log["heavies"] += 1
            elif A_ROLL0 <= a <= A_ROLL0 + 3 and self.pst >= ROLL_COST:
                self.pa, self.pf = a, 0
                self.spend(ROLL_COST)
                self.log["rolls"] += 1
            elif a == A_PARRY and self.pst >= PARRY_COST:
                self._start_parry()
            elif a in (A_IDLE, A_GUARD):
                self.pa, self.pf = a, 0
        if self.guarding:
            self.log["guard_frames"] += 1
        if math.hypot(self.px, self.pz) > ARENA - 0.6:
            self.log["wall_frames"] += 1

        # 2. the player moves
        if self.p_stun == 0:
            if A_MOVE0 <= self.pa <= A_MOVE0 + 7:
                self._shift(self.pa - A_MOVE0, P_SPEED * (0.55 if self.guarding else 1.0))
            elif A_ROLL0 <= self.pa <= A_ROLL0 + 3 and self.pf < ROLL_I1:
                self._shift(2 * (self.pa - A_ROLL0), ROLL_DIST / ROLL_I1)

        # 3. the boss decides
        if self.b_stagger > 0:
            self.b_stagger -= 1
        elif self.b_flinch > 0:
            self.b_flinch -= 1
        elif self.bm < 0:
            if self.b_cd > 0:
                self.b_cd -= 1
            want = wrap(self.to_player() - self.bang)
            self.bang += max(-B_TURN_IDLE, min(B_TURN_IDLE, want))
            if self.d > ENGAGE:
                self._close(B_CHASE)
            if self.b_cd <= 0 and self.d <= LUNGE_ENGAGE:
                # Beyond ENGAGE only a gap-closer is eligible; _pick returns None if none reaches.
                want = self._pick(far=self.d > ENGAGE)
                if want is not None:
                    self.bm = want
                    self.bf, self.b_seg_done = 0, -1
                    self.log["boss_moves"][self.bm] += 1

        # 4. the boss animation, its facing, and its hitboxes
        if self.bm >= 0 and self.b_stagger == 0 and self.b_flinch == 0:
            m = MOVES[self.bm]
            kind, seg = phase_at(m, self.bf)
            if kind in ("w", "d"):
                want = wrap(self.to_player() - self.bang)
                self.bang += max(-B_TURN_WIND, min(B_TURN_WIND, want))
                self._close(m["adv"])
            if kind == "h" and seg != self.b_seg_done:
                if self.d <= m["reach"] and abs(self.off_axis()) <= m["arc"]:
                    self._boss_hits(m["dmg"], m)
                    self.b_seg_done = seg
                elif self.bf == self._seg_start(m, seg):
                    self.log["whiffs"] += 1
                    if self.d <= m["reach"]:
                        self.log["arc_misses"] += 1
            self.bf += 1
            if self.bf >= move_len(m):
                self.bm, self.bf = -1, 0
                lo = int(round(6 + 40 * (1 - self.aggr)))
                self.b_cd = int(self.rng.integers(lo, lo + 26))

        # 5. the player's own hitbox
        if self.pa in (A_ATK, A_HEAVY):
            heavy = self.pa == A_HEAVY
            segs = ATK2_SEG if heavy else ATK_SEG
            reach = ATK2_REACH if heavy else ATK_REACH
            kind = phase_at(dict(seg=segs), self.pf)[0]
            if kind == "h" and not self.p_hit_done and self.d <= reach:
                mult = RIPOSTE_MULT if self.b_stagger > 0 else 1.0
                dealt = (ATK2_DMG if heavy else ATK_DMG) * mult
                self.bhp -= dealt
                self.p_hit_done = True
                self.log["hits_dealt"] += 1
                self.log["dmg_dealt"] += dealt
                if mult > 1:
                    self.log["riposte_dmg"] += dealt
                else:
                    # Poise. The multiplier was read BEFORE this, so the hit that breaks the pool
                    # does ordinary damage and the riposte is the NEXT one: a break only pays if
                    # you follow up.
                    self.b_poise -= self.poise_hit2 if heavy else self.poise_hit
                    if self.b_poise <= 0:
                        self._stagger(POISE_STAGGER)
                        self.log["poise_breaks"] += 1

        # 6. clocks
        if self.b_stagger == 0:
            # vitality-linked recovery: full, half, then none
            frac = self.bhp / B_HP_MAX
            scale = 1.0 if frac > REGEN_HI else (0.5 if frac > REGEN_LO else 0.0)
            self.b_poise = min(self.poise_max, self.b_poise + self.poise_regen * scale)
        self.pf += 1
        if self.p_stun > 0:
            self.p_stun -= 1
        if self.parry_heat > 0:
            self.parry_heat -= 1
        if self.p_regen_lock > 0:
            self.p_regen_lock -= 1
        elif not self.guarding:
            self.pst = min(P_ST_MAX, self.pst + ST_REGEN)
        self.t += 1

        won = self.bhp <= 0
        lost = self.php <= 0
        term = won or lost
        trunc = self.t >= self.clock and not term
        if trunc and self.timeout == "defeat":
            lost, term, trunc = True, True, False
        r = self._reward(php0, bhp0, won, lost)
        return self.obs(), r, term, trunc, dict(won=won, lost=lost)

    def _pick(self, far=False):
        cands = []
        for i in self.allowed:
            m = MOVES[i]
            if far and not m.get("gap"):
                continue
            wind = sum(n for k, n in m["seg"] if k in ("w", "d"))
            if m["reach"] + m["adv"] * wind >= self.d - 0.1:
                cands.append(i)
        # Out past ENGAGE there is no fallback: if nothing can reach, the boss keeps walking.
        if far and not cands:
            return None
        use = cands if cands else [1]
        # The slow, committing moves get likelier as aggression rises; the eruption stays rare
        # whatever happens, because a boss that opens with it every time is a boss with one move.
        w = []
        for i in use:
            n = MOVES[i]["name"]
            if n == "eruption":
                w.append(0.35 + 0.5 * self.aggr)
            elif n == "lunge":
                w.append(1.4)
            # long strings are the parry test, so they are common on purpose
            elif n == "flurry":
                w.append(1.5)
            elif n == "onslaught":
                w.append(0.9 + 0.6 * self.aggr)
            elif n in ("heavy", "slam"):
                w.append(1 + 1.5 * self.aggr)
            else:
                w.append(1.0)
        w = np.array(w, float)
        return int(self.rng.choice(use, p=w / w.sum()))

    def _stagger(self, frames):
        "Put the boss down. Any stagger cancels the move it had out and refills its poise."
        self.b_stagger = frames
        self.b_poise = self.poise_max
        self.bm, self.bf, self.b_cd = -1, 0, 0

    def _boss_hits(self, dmg, m):
        if A_ROLL0 <= self.pa <= A_ROLL0 + 3 and ROLL_I0 <= self.pf <= ROLL_I1:
            self.log["dodges"] += 1
            return
        # The eruption goes through the shield and through the parry. Rolling out of it works
        # only because i-frames are i-frames; standing in it and pressing a button does not.
        if not m.get("unblockable"):
            if self.parry_live:
                self.log["parries"] += 1
                # A clean parry clears the fatigue outright, exactly as a successful deflect does
                # in Sekiro. Landing one is what buys back the next one.
                self.parry_stack, self.parry_heat = 0, 0
                # ...and it feeds the posture bar rather than skipping it. The move is cancelled
                # and the boss interrupted, but there is no riposte here -- only a BREAK opens it.
                self.b_poise -= self.parry_poise
                self.bm, self.bf = -1, 0
                self.b_flinch = PARRY_FLINCH
                if self.b_poise <= 0:
                    self._stagger(POISE_STAGGER)
                    self.log["poise_breaks"] += 1
                return
            if self.guarding and self.pst > 0:
                chip = dmg * self.chip
                self.php -= chip
                self.pst -= dmg * GUARD_ST
                self.p_regen_lock = ST_DELAY
                self.log["blocks"] += 1
                self.log["chip_taken"] += chip
                self.log["dmg_taken"] += chip
                if self.pst <= 0:
                    self.pst = 0.0
                    self.p_stun = GUARDBREAK
                    self.pa, self.pf = A_IDLE, 0
                    self.guarding = False
                    self.log["guard_breaks"] += 1
                return
        # Hitstun scales with the size of the blow. A flat 20 frames was fine when every move hit
        # once, but a 7-hit string lands every 18-20 frames, so a flat stun locked you through the
        # whole rest of the combo after one missed parry -- eat one, eat all seven. A 9-damage chip
        # now stuns 8 frames, short enough to recover and contest the next beat; the eruption still
        # stuns the full 20. Being hit should cost you a beat, not the string.
        self.php -= dmg
        self.p_stun = max(8, min(HITSTUN, int(round(HITSTUN * dmg / 22.0))))
        self.pa, self.pf = A_IDLE, 0
        self.guarding = False
        self.log["hits_taken"] += 1
        self.log["dmg_taken"] += dmg
        if m.get("unblockable"):
            self.log["erupt_taken"] += 1

    # ------------------------------------------------------------------ reward
    def _reward(self, php0, bhp0, won, lost):
        dealt = bhp0 - self.bhp
        taken = php0 - self.php
        if self.reward_kind == "damage":
            r = 0.1 * dealt - 0.1 * taken
        elif self.reward_kind == "trade":
            r = 0.1 * dealt
        elif self.reward_kind == "survive":
            r = 1.0 / FPS
        else:
            raise ValueError(self.reward_kind)
        if won:
            r += 30.0
        if lost:
            r -= 30.0
        return float(r)

    # ------------------------------------------------------------------ what it sees
    def obs(self):
        m = MOVES[self.bm] if self.bm >= 0 else None
        kind = phase_at(m, self.bf)[0] if m else "i"
        off = self.off_axis()
        v = np.zeros(N_OBS, np.float32)
        v[0] = self.d / ARENA
        v[1] = math.sin(off)
        v[2] = math.cos(off)
        v[3] = (ARENA - math.hypot(self.px, self.pz)) / ARENA     # room behind you
        v[4] = self.php / P_HP_MAX
        v[5] = self.bhp / B_HP_MAX
        v[6] = self.pst / P_ST_MAX
        v[7] = self.pa / (N_ACTIONS - 1)
        v[8] = min(self.pf, 40) / 40.0
        v[9] = self.p_stun / GUARDBREAK
        v[10] = 1.0 if self.guarding else 0.0
        if m is not None:
            v[11 + self.bm] = 1.0                                  # which move (12 reserved)
        v[23] = min(self.bf, 60) / 60.0
        v[24] = 1.0 if kind == "w" else 0.0
        v[25] = 1.0 if kind == "d" else 0.0
        v[26] = 1.0 if kind == "h" else 0.0
        v[27] = 1.0 if kind == "r" else 0.0
        v[28] = self.b_stagger / STAGGER
        v[29] = (m["reach"] / ARENA) if m is not None else 0.0
        v[30] = (m["arc"] / math.pi) if m is not None else 0.0     # arc can exceed 1
        v[31] = 1.0 if (m is not None and self.d <= m["reach"] and abs(off) <= m["arc"]) else 0.0
        v[32] = self.t / self.clock
        v[33] = self.b_poise / self.poise_max
        # Without these two the parry rule is a partially observed problem for no reason: the
        # window depends on what you pressed half a second ago, so the agent is shown it.
        v[34] = self.parry_stack / PARRY_MAX_STACK                 # how worn the parry is
        v[35] = self.parry_heat / PARRY_HEAT                       # until it comes back
        v[36] = self.b_flinch / PARRY_FLINCH                       # parried, interrupted
        # How far through THIS move we are, which v[23] stops being able to say once a move runs
        # past its 60-frame cap. flurry is 114 frames and onslaught is 174, so without this the
        # back half of every long string is one indistinguishable instant to the network.
        v[37] = min(1.0, self.bf / move_len(m)) if m else 0.0
        return v


IN, IN_R, RIGHT, BACK_R, BACK, BACK_L, LEFT, IN_L = range(8)
ROLL_IN, ROLL_RIGHT, ROLL_BACK, ROLL_LEFT = (A_ROLL0 + i for i in range(4))


def frames_to_active(env):
    """Frames until the boss's next active frame, or None if it has no move out."""
    if env.bm < 0 or env.b_stagger > 0:
        return None
    m = MOVES[env.bm]
    acc, f = 0, env.bf
    for i, (kind, n) in enumerate(m["seg"]):
        if kind == "h" and acc + n > f and i != env.b_seg_done:
            return max(0, acc - f)
        acc += n
    return None


def will_connect(env, slack=0.25):
    """Is the player currently inside the reach AND the arc of the move being wound up?"""
    if env.bm < 0 or env.b_stagger > 0:
        return False
    m = MOVES[env.bm]
    return env.d <= m["reach"] + slack and abs(env.off_axis()) <= m["arc"]


def incoming(env):
    """The move the boss has out, or None."""
    return MOVES[env.bm] if (env.bm >= 0 and env.b_stagger == 0) else None


def boss_recovering(env):
    if env.bm < 0 or env.b_stagger > 0:
        return False
    return phase_at(MOVES[env.bm], env.bf)[0] == "r"


def window_if_pressed_now(env):
    """How many frames of parry the NEXT press would get, given the fatigue right now."""
    stack = min(PARRY_MAX_STACK, env.parry_stack + 1) if env.parry_heat > 0 else 0
    return max(0, PARRY_WIN - PARRY_STEP * stack)


# --------------------------------------------------------------------- scripted players
def hold_range(env, lo=1.6, hi=2.3):
    if env.pst < 30:
        return A_MOVE0 + BACK
    if env.d > hi:
        return A_MOVE0 + IN
    if env.d < lo:
        return A_MOVE0 + BACK
    return A_MOVE0 + RIGHT


def close_and_hit(env):
    if env.d <= ATK_REACH and env.pst >= ATK_COST:
        return A_ATK
    return A_MOVE0 + IN


def stand_still(env):
    return A_IDLE


def random_buttons(seed=0):
    rng = np.random.default_rng(seed)

    def pol(env):
        return int(rng.integers(0, N_ACTIONS))
    return pol


def masher(env):
    return A_ATK if env.pst >= ATK_COST else A_IDLE


def run_away(env):
    return A_MOVE0 + BACK


def circle(env):
    return A_MOVE0 + RIGHT


def turtle(env):
    return A_GUARD


def mash_parry(env):
    """The habit the fatigue rule exists to punish. Kept as a named player so the cost of it is
    a number on the ladder rather than an assertion in a comment."""
    if env.b_stagger > 0 and env.d <= ATK2_REACH and env.pst >= ATK2_COST:
        return A_HEAVY
    if env.pst >= PARRY_COST:
        return A_PARRY
    return hold_range(env)


def roll_and_punish(env):
    k = frames_to_active(env)
    if k is not None and 3 <= k <= 10 and will_connect(env) and env.pst >= ROLL_COST:
        return ROLL_BACK
    if env.b_stagger > 0 or boss_recovering(env):
        if env.pst >= ATK_COST + ROLL_COST:
            return close_and_hit(env)
    return hold_range(env)


def patient_parry(env):
    """Parries only on a read, and only while the window is still full width. Rolls out of the
    sweep and the eruption, because neither can be answered with a button."""
    m = incoming(env)
    k = frames_to_active(env)
    if m is not None and m.get("unblockable"):
        if k is not None and k <= 14 and env.pst >= ROLL_COST:
            return ROLL_BACK
        return A_MOVE0 + BACK
    if env.b_stagger > 0:
        if env.d <= ATK2_REACH and env.pst >= ATK2_COST:
            return A_HEAVY
        if env.d <= ATK_REACH and env.pst >= ATK_COST:
            return A_ATK
        return A_MOVE0 + IN
    if (k is not None and 1 <= k <= 3 and will_connect(env) and env.pst >= PARRY_COST
            and window_if_pressed_now(env) >= PARRY_WIN):
        return A_PARRY
    if m is not None and m["arc"] > 1.5 and k is not None and k <= 6 and env.pst >= ROLL_COST:
        return ROLL_BACK
    if env.bm < 0 and env.d <= ATK_REACH and env.pst >= ATK_COST:
        return A_ATK
    return hold_range(env)


def pressure(env):
    """Builds posture with the HEAVY and stays on top of the boss; parries as defence, not as plan.

    This is the reference player for v2, and it exists because 'patient parry' is not one. That
    player only swings while the boss is already staggered, which was fine when a single parry
    granted a stagger -- it no longer does, so a policy waiting for one waits forever. The route
    the numbers actually describe is five landed heavies, and this is what taking it looks like.
    """
    m, k = incoming(env), frames_to_active(env)
    if m is not None and m.get("unblockable"):
        if k is not None and k <= 14 and env.pst >= ROLL_COST:
            return ROLL_BACK
        return A_MOVE0 + BACK
    if env.b_stagger > 0:                       # a break is earned; cash it
        if env.d <= ATK2_REACH and env.pst >= ATK2_COST:
            return A_HEAVY
        if env.d <= ATK_REACH and env.pst >= ATK_COST:
            return A_ATK
        return A_MOVE0 + IN
    if (k is not None and 1 <= k <= 3 and will_connect(env) and env.pst >= PARRY_COST
            and window_if_pressed_now(env) > 0):
        return A_PARRY
    if m is not None and m["arc"] > 1.5 and k is not None and k <= 6 and env.pst >= ROLL_COST:
        return ROLL_BACK
    # the plan: land heavies. Recovery is the safe window, but do not only wait for it.
    if env.d <= ATK2_REACH and env.pst >= ATK2_COST and (env.bm < 0 or boss_recovering(env)):
        return A_HEAVY
    if env.d <= ATK_REACH and env.pst >= ATK_COST and (env.bm < 0 or boss_recovering(env)):
        return A_ATK
    if env.pst < 40:
        return A_MOVE0 + BACK
    return A_MOVE0 + IN if env.d > ATK2_REACH else A_MOVE0 + RIGHT


PLAYERS = [
    ("stand still", stand_still), ("random buttons", random_buttons()),
    ("mash attack", masher), ("run away", run_away), ("circle", circle),
    ("hold guard", turtle), ("mash parry", mash_parry),
    ("roll, punish", roll_and_punish), ("patient parry", patient_parry),
    ("pressure", pressure),
]


# --------------------------------------------------------------------- scoring
def duel(policy, seed=0, repeat=3, **kw):
    env = Duel(seed=seed, **kw)
    G, a, dsum, offsum = 0.0, A_IDLE, 0.0, 0.0
    presses = 0
    while True:
        if env.t % repeat == 0:
            a = policy(env)
        if a == A_PARRY and not env.busy and env.pst >= PARRY_COST:
            presses += 1
        _, r, term, trunc, info = env.step(a)
        G += r
        dsum += env.d
        offsum += abs(env.off_axis())
        if term or trunc:
            return dict(G=G, frames=env.t, won=int(info["won"]), lost=int(info["lost"]),
                        php=env.php, bhp=env.bhp, meanD=dsum / env.t,
                        meanOff=offsum / env.t, parry_presses=presses, **env.log)


def score(policy, n=200, seed0=1000, repeat=3, **kw):
    rows = [duel(policy, seed=seed0 + i, repeat=repeat, **kw) for i in range(n)]
    out = dict(win=sum(r["won"] for r in rows), die=sum(r["lost"] for r in rows), n=n)
    out["clock"] = n - out["win"] - out["die"]
    for k in rows[0]:
        if k not in ("won", "lost", "boss_moves"):
            out[k] = float(np.mean([float(r[k]) for r in rows]))
    out["guard_pct"] = 100.0 * out["guard_frames"] / out["frames"]
    out["wall_pct"] = 100.0 * out["wall_frames"] / out["frames"]
    out["parry_pct"] = (100.0 * out["parries"] / out["parry_presses"]
                        if out["parry_presses"] > 0 else 0.0)
    return out


def ladder(players=None, n=200, seed0=1000, repeat=3, **kw):
    print("player           win  die  clk  bossHP  ownHP   sec  press  parry  land%  mash  dead  poise  hits  erupt        G")
    out = {}
    for name, pol in (PLAYERS if players is None else players):
        r = score(pol, n=n, seed0=seed0, repeat=repeat, **kw)
        out[name] = r
        print("%-16s %4d %4d %4d %7.1f %6.1f %5.1f %6.2f %6.2f %6.1f %5.2f %5.2f %6.2f %5.2f %6.2f %8.2f" % (
            name, r["win"], r["die"], r["clock"], r["bhp"], r["php"], r["frames"] / FPS,
            r["parry_presses"], r["parries"], r["parry_pct"], r["parry_mashes"],
            r["parry_dead"], r["poise_breaks"], r["hits_taken"], r["erupt_taken"], r["G"]))
    return out


def timeline(name, width=1):
    """Draw one boss move as the frames it actually occupies."""
    m = [x for x in MOVES if x["name"] == name][0]
    mark = {"w": "-", "d": "=", "h": "#", "r": "."}
    bar = "".join(mark[k] * (n * width) for k, n in m["seg"])
    tail = "  UNBLOCKABLE" if m.get("unblockable") else ""
    return "%-9s %s  %d frames, reach %.1f, arc %.2f rad, %.0f damage%s" % (
        name, bar, move_len(m), m["reach"], m["arc"], m["dmg"], tail)


def moveset():
    print("windup -   delay =   ACTIVE #   recovery .")
    for m in MOVES:
        print(timeline(m["name"]))
`;
