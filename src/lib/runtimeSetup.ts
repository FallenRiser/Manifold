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
