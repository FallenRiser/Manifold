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
