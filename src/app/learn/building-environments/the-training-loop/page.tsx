import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { DecisionPoint } from "@/components/DecisionPoint";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BOSS_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The training loop, line by line — Manifold",
  description:
    "DQN with nothing hidden: one gradient step written out in numpy and runnable in the browser, the same step in a loop against the real duel, and the commands to run it properly on your own machine — with a measured answer to whether the GPU is worth using at all.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const pre: React.CSSProperties = {
  background: "var(--code-bg, color-mix(in srgb, var(--ink) 5%, transparent))",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 13,
  lineHeight: 1.55,
  overflowX: "auto",
  fontFamily: "ui-monospace, monospace",
};

export default function TheTrainingLoop() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 20 minutes"
        title={<>The training loop, line by line</>}
        intro={<>The world is finished and eleven hand-written players have been scored against it. What actually
          trains on it is about forty lines. This page writes them out — one gradient step in plain numpy that you can
          run in this browser, the same step in a loop, and then the real commands, including a measured and fairly
          unwelcome answer to the question of whether a GPU helps here at all.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The whole of DQN, in one screen</h2>
        <p>
          Stripped of bookkeeping, the loop in <code>scripts/boss_train.py</code> is this:
        </p>
        <ol style={{ lineHeight: 1.8 }}>
          <li><strong>Look</strong> at the observation and pick a button — the network&rsquo;s best guess, or a random
            one with probability &epsilon;.</li>
          <li><strong>Press</strong> it for three frames and keep what came back:{" "}
            <code>(obs, action, reward, next obs, done)</code>.</li>
          <li><strong>Store</strong> that tuple in a ring buffer of 300,000.</li>
          <li><strong>Sample</strong> 256 old tuples at random and ask: what <em>should</em> the Q of that action have
            been? The answer is the Bellman target, <code>r + &gamma; max Q&prime;</code>, computed with a frozen copy
            of the network.</li>
          <li><strong>Nudge</strong> the network&rsquo;s Q toward that target, and only for the action that was
            actually taken.</li>
          <li>Every 2,000 decisions, <strong>refresh the frozen copy</strong>. Every 50,000, score it on held-out
            seeds.</li>
        </ol>
        <p>
          Step 4 is the only subtle one, and it is subtle in a specific way: the target is computed with the network
          you are training. Freezing a copy of it is what stops the target moving every time you take a step toward
          it — the problem the{" "}
          <Link href="/learn/function-approximation" style={link}>function-approximation track</Link> calls the deadly
          triad, and the reason a target network exists at all.
        </p>

        <h2>One gradient step, with nothing hidden</h2>
        <p>
          torch is not available in this browser, and for a network this small that turns out to be a gift: every line
          below is arithmetic you can read. Twenty-seven inputs, two hidden layers, sixteen outputs. Press Run — it
          collects sixty-four real transitions by pressing random buttons at the real boss, then takes exactly one
          gradient step and reports whether the Q-values moved where they were supposed to.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeOneStep} />
        <CodeOutput>{outOneStep}</CodeOutput>
        <p>
          Four transitions out of sixty-four moved the <em>wrong</em> way, and that is not a bug either. All sixty-four
          share one set of weights, so a step that helps most of the batch can push a few individual Q-values further
          from their targets. Averaged over a run this comes out; it is the ordinary price of function approximation,
          and it is exactly what a table-based method does not pay.
        </p>
        <PredictPrompt
          accent={GOLD}
          prompt={<>The shipped run needed 2,000,000 decisions. The cell below runs 8,000 — four tenths of one per cent
            of that. What should it score against the boss?</>}
          options={["It should win a few duels; the loss will have fallen",
                    "It should survive the clock without winning",
                    "It should lose every duel and die",
                    "It should behave identically to random buttons"]}
        />

        <h2>The same step, in a loop</h2>
        <p>
          Now close the loop: &epsilon;-greedy exploration, a replay buffer, a target network refreshed every thousand
          decisions, and the shipped <code>score()</code> at the end so the result lands on the same ladder everything
          else in this world is measured against. This is a complete DQN. It is also far too small to work, which is
          the point of running it.
        </p>
        <CodeBlock setup={BOSS_SETUP} fromScratch={codeTinyRun} />
        <CodeOutput>{outTinyRun}</CodeOutput>
        <p>
          The loss falls by roughly half, so the network is unmistakably <em>learning something</em> — and it still
          loses every duel and dies with the boss barely scratched. That gap is the most useful thing on this page. A
          falling loss in reinforcement learning means the network is predicting its own targets better; it does not
          mean the policy is any good, and it will fall just as happily while the agent learns to stand still. The only
          honest progress signal is the held-out score, which is why{" "}
          <Link href="/learn/building-environments/training-the-duellist" style={link}>the next page</Link> reports a
          curve of those rather than a loss.
        </p>

        <h2>Running it properly: start on the CPU</h2>
        <p>
          The real trainer swaps numpy for torch, 64 hidden units for 256, and one environment for sixteen stepped side
          by side. Everything else is the loop you just ran. Before committing an hour, run the smallest thing that
          proves the pipeline works end to end:
        </p>
        <pre style={pre}>{`# is this copy of the trainer looking at the same world the browser runs?
python scripts/boss_train.py version

# the hand-written players, through the same scorer a learner will be graded by
python scripts/boss_train.py ladder --eval-n 25

# a two-minute run that will learn nothing, and is meant to
python scripts/boss_train.py dqn --decisions 20000 --eval-every 5000 --device cpu`}</pre>
        <p>
          That last command is the one worth insisting on. It exercises every part of the machinery — replay, target
          refresh, evaluation, the results JSON — in about two minutes, and if something is wrong it is wrong{" "}
          <em>now</em> rather than fifty minutes into a real run. <code>version</code> matters for the same reason:
          this track has already been bitten once by results that came back from a trainer running against a stale copy
          of the environment.
        </p>

        <h2>Does the GPU help? Measure it before you assume</h2>
        <p>
          The reflex is to reach for <code>--device cuda</code> and expect a large multiple. Here is the same four-layer
          benchmark run on both devices on the machine that produced this world&rsquo;s duellist — a GTX 1660 Ti — plus
          the tensor work with the environment taken out of it entirely, and a check that CUDA is genuinely being used
          at all.
        </p>
        <CodeOutput source="scripts/boss_train.py">{outDevices}</CodeOutput>
        <Callout color={GOLD} title={<>The GPU is not slow here. It is idle.</>}>
          <p style={{ margin: 0 }}>
            On the loop a real run is actually made of, the two devices are within a few per cent of each other, and
            for a <em>single</em> duel the GPU is roughly half the speed of the CPU. Both facts have the same cause: a
            forward pass on 27 floats is a microsecond of arithmetic behind several microseconds of launch overhead, so
            the cost is dominated by <em>sending</em> the work rather than doing it. Take the environment away and the
            crossover is visible — about even at batch 256, and better than ten times faster by batch 16,384. The
            number to remember is the batch size at which a GPU starts to pay, not the hardware.
          </p>
        </Callout>
        <p>
          It is worth being concrete about what this means for the run this track published: it took sixty-three
          minutes on the GPU, and it would have taken about the same on the CPU. The card sits at roughly a fifth of
          its capacity throughout. If you watch it in Windows Task Manager it will look like it is doing nothing at
          all — partly because it nearly is, and partly because Task Manager graphs the <em>3D</em> engine by default
          while CUDA work lands on <strong>Compute_0</strong>. The block above settles that question the only way worth
          settling it: it names every adapter the machine has, shows which one CUDA binds to, and puts a measured
          throughput beside that card&rsquo;s published peak.
        </p>
        <p>
          So the honest guidance is: <strong>use whichever device you have and do not buy one for this</strong>. Reach
          for a GPU when the batch is large, the network is wide, or the observation is an image — which is exactly
          what World 2&rsquo;s convolutional pointer network was, and why it had a different answer.
        </p>
        <pre style={pre}>{`# the run this track published -- about an hour either way
python scripts/boss_train.py dqn --decisions 2000000 --seed 0

# reproduce the table above on your own machine
python scripts/boss_train.py devices

# and the four training layers on one device, if you only want the breakdown
python scripts/boss_train.py bench`}</pre>
        <DecisionPoint
          accent={GOLD}
          question={<>Your first real run is under way and the loss is falling steadily. The win rate at 400,000
          decisions is still zero. What is the right read?</>}
          options={[
            {
              label: "Nothing yet — a falling loss says almost nothing about the policy",
              verdict: "best",
              response: (<>Correct, and this world is an unusually sharp example. The published run scored zero on
                <em>nine consecutive evaluations</em>, through 900,000 decisions, before reaching 100% at 1.3M. A run
                killed at 400k for &ldquo;not learning&rdquo; would have been killed during the normal part.</>),
            },
            {
              label: "Something is broken; a working DQN shows progress by 400k",
              verdict: "miss",
              response: (<>A reasonable prior from supervised learning and wrong here. Exploration has to stumble into a
                parry often enough for the replay buffer to contain any, and with &epsilon; still high that takes a
                while.</>),
            },
            {
              label: "Raise the learning rate so it moves faster",
              verdict: "miss",
              response: (<>This is changing the experiment because you are impatient with it. If you do want to change
                something, change it and re-run from the start — otherwise you have a run whose hyperparameters are a
                function of what you happened to see at 400k.</>),
            },
            {
              label: "Check the held-out score is being computed on seeds training never touches",
              verdict: "close",
              response: (<>Always worth checking, and here it already is — seeds 1000&ndash;1199, the same ones every
                scripted player sat. But it does not explain a zero at 400k, because a zero is what the world genuinely
                produces at 400k.</>),
            },
          ]}
        />
        <Proof title="why the budget is spent on decisions rather than on a bigger network" color={GOLD}>
          <p style={{ margin: 0 }}>
            The benchmark above prices it directly. With the environment removed, a gradient step at batch 256 runs at
            a few hundred a second on either device, and widening the network barely moves that — the card has capacity
            to spare and is waiting for work. What it is waiting <em>for</em> is the environment loop and the launch
            overhead, neither of which a bigger network fixes. So the marginal hour is better spent collecting more
            experience than on more parameters, which is the opposite of the usual advice and is a direct consequence
            of the observation being twenty-seven floats. Change the observation to pixels, as{" "}
            <Link href="/learn/building-environments/what-the-agent-sees" style={link}>that page</Link> discusses, and
            every line of this reasoning inverts.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/building-environments/curriculum-one-move-then-the-set", label: <>← Curriculum: one move, then the set</> }}
          next={{ href: "/learn/building-environments/training-the-duellist", label: <>Training the duellist →</> }}
        />
      </div>
    </article>
  );
}

const codeOneStep = `# One DQN gradient step, with nothing hidden. torch is not available in the browser, and for
# a net this small that is a feature: every line below is arithmetic you can read.
rng = np.random.default_rng(0)
H = 64                                            # hidden width; the real run uses 256

def init(n_in, n_out):
    # He scaling: variance 2/fan_in keeps a ReLU stack from collapsing or exploding
    return dict(W=rng.normal(0, np.sqrt(2.0 / n_in), (n_in, n_out)), b=np.zeros(n_out))

net = [init(27, H), init(H, H), init(H, 16)]

def forward(net, x):
    "x is (batch, 27). Returns the Q-values and everything backward() will need."
    h1 = np.maximum(0.0, x @ net[0]["W"] + net[0]["b"])
    h2 = np.maximum(0.0, h1 @ net[1]["W"] + net[1]["b"])
    return h2 @ net[2]["W"] + net[2]["b"], (x, h1, h2)

# --- collect one batch of REAL transitions, by pressing random buttons -------------------
O, A, R, O2, D = [], [], [], [], []
e = Duel(seed=0)
o = e.obs()
while len(O) < 64:
    a = int(rng.integers(0, 16))
    r = 0.0
    for _ in range(3):                            # one decision = 3 frames, as score() does it
        o2, ri, term, trunc, _ = e.step(a)
        r += ri
        if term or trunc:
            break
    O.append(o); A.append(a); R.append(r); O2.append(o2); D.append(float(term or trunc))
    if term or trunc:
        e = Duel(seed=len(O)); o = e.obs()
    else:
        o = o2
O, A, R, O2, D = np.array(O), np.array(A), np.array(R), np.array(O2), np.array(D)

# --- the step itself ---------------------------------------------------------------------
GAMMA = 0.99
q_all, cache = forward(net, O)
q = q_all[np.arange(64), A]                       # the Q of the button we actually pressed
q_next, _ = forward(net, O2)                      # the target net is a frozen COPY; here, equal
y = R + GAMMA * (1.0 - D) * q_next.max(1)         # Bellman target: reward + best next

err = q - y
delta = np.clip(err, -1.0, 1.0)                   # Huber: a linear tail, so one bad target
loss = np.mean(np.where(np.abs(err) <= 1.0,       # cannot dominate the batch
                        0.5 * err ** 2, np.abs(err) - 0.5))

# backward: dLoss/dq is the clipped error, placed ONLY on the action that was taken
g = np.zeros_like(q_all)
g[np.arange(64), A] = delta / 64
x, h1, h2 = cache
gW2, gb2 = h2.T @ g, g.sum(0)
gh2 = (g @ net[2]["W"].T) * (h2 > 0)
gW1, gb1 = h1.T @ gh2, gh2.sum(0)
gh1 = (gh2 @ net[1]["W"].T) * (h1 > 0)
gW0, gb0 = x.T @ gh1, gh1.sum(0)
grads = [dict(W=gW0, b=gb0), dict(W=gW1, b=gb1), dict(W=gW2, b=gb2)]

# Adam, one step, at its defaults
LR, B1, B2, EPS = 3e-4, 0.9, 0.999, 1e-8
for layer, gr in zip(net, grads):
    for k in ("W", "b"):
        m = (1 - B1) * gr[k]                      # first step, so the running means start at 0
        v = (1 - B2) * gr[k] ** 2
        mhat, vhat = m / (1 - B1), v / (1 - B2)   # bias correction at t = 1
        layer[k] -= LR * mhat / (np.sqrt(vhat) + EPS)

q_after = forward(net, O)[0][np.arange(64), A]
print("one gradient step on 64 real transitions")
print("  mean |TD error| before   %8.4f" % np.abs(err).mean())
print("  mean |TD error| after    %8.4f" % np.abs(q_after - y).mean())
print("  Huber loss               %8.4f" % loss)
print("  Q moved toward its target on %d of 64 transitions" %
      int(np.sum(np.abs(q_after - y) < np.abs(err))))
print()
print("  the first transition:  pressed %-12s reward %+6.3f  done %d"
      % (ACTION_NAMES[A[0]], R[0], D[0]))
print("    Q before %+8.4f   target %+8.4f   Q after %+8.4f"
      % (q[0], y[0], q_after[0]))`;

const outOneStep = `one gradient step on 64 real transitions
  mean |TD error| before     0.7928
  mean |TD error| after      0.7811
  Huber loss                 0.4145
  Q moved toward its target on 60 of 64 transitions

  the first transition:  pressed guard        reward +0.000  done 0
    Q before  -0.1357   target  +1.1395   Q after  -0.1219`;

const codeTinyRun = `# The same update, in a loop, against the real duel. This is a complete DQN.
rng = np.random.default_rng(0)
H, BATCH, GAMMA, LR = 64, 64, 0.99, 3e-4
BUDGET = 8000                                      # decisions. The shipped run used 2,000,000.

def init(n_in, n_out):
    return dict(W=rng.normal(0, np.sqrt(2.0 / n_in), (n_in, n_out)), b=np.zeros(n_out))

def fwd(net, x):
    h1 = np.maximum(0.0, x @ net[0]["W"] + net[0]["b"])
    h2 = np.maximum(0.0, h1 @ net[1]["W"] + net[1]["b"])
    return h2 @ net[2]["W"] + net[2]["b"], (x, h1, h2)

net = [init(27, H), init(H, H), init(H, 16)]
tgt = [{k: v.copy() for k, v in L.items()} for L in net]     # the frozen copy
adam = [{k: [np.zeros_like(v), np.zeros_like(v)] for k, v in L.items()} for L in net]
buf = dict(o=np.zeros((8000, 27)), a=np.zeros(8000, int), r=np.zeros(8000),
           o2=np.zeros((8000, 27)), d=np.zeros(8000))
n = i = t_adam = 0

e = Duel(seed=0)
o = e.obs()
losses = []
for step in range(BUDGET):
    eps = max(0.05, 1.0 - step / (0.6 * BUDGET))   # explore, then exploit
    if rng.random() < eps:
        a = int(rng.integers(0, 16))
    else:
        a = int(fwd(net, o[None])[0][0].argmax())
    r, done = 0.0, False
    for _ in range(3):
        o2, ri, term, trunc, _ = e.step(a)
        r += ri
        if term or trunc:
            done = True
            break
    buf["o"][i], buf["a"][i], buf["r"][i], buf["o2"][i], buf["d"][i] = o, a, r, o2, float(done)
    i, n = (i + 1) % 8000, min(n + 1, 8000)
    if done:
        e = Duel(seed=step + 1); o = e.obs()
    else:
        o = o2

    if n >= 500 and step % 4 == 0:                 # one gradient step per four decisions
        k = rng.integers(0, n, BATCH)
        O, A, R, O2, D = (buf["o"][k], buf["a"][k], buf["r"][k], buf["o2"][k], buf["d"][k])
        q_all, (x, h1, h2) = fwd(net, O)
        q = q_all[np.arange(BATCH), A]
        y = R + GAMMA * (1.0 - D) * fwd(tgt, O2)[0].max(1)
        err = q - y
        losses.append(float(np.mean(np.where(np.abs(err) <= 1.0,
                                             0.5 * err ** 2, np.abs(err) - 0.5))))
        g = np.zeros_like(q_all)
        g[np.arange(BATCH), A] = np.clip(err, -1, 1) / BATCH
        gh2 = (g @ net[2]["W"].T) * (h2 > 0)
        gh1 = (gh2 @ net[1]["W"].T) * (h1 > 0)
        grads = [dict(W=x.T @ gh1, b=gh1.sum(0)), dict(W=h1.T @ gh2, b=gh2.sum(0)),
                 dict(W=h2.T @ g, b=g.sum(0))]
        t_adam += 1
        for L, S, gr in zip(net, adam, grads):
            for key in ("W", "b"):
                m, v = S[key]
                m *= 0.9; m += 0.1 * gr[key]
                v *= 0.999; v += 0.001 * gr[key] ** 2
                L[key] -= LR * (m / (1 - 0.9 ** t_adam)) / (np.sqrt(v / (1 - 0.999 ** t_adam)) + 1e-8)
    if step % 1000 == 0 and step:                  # refresh the frozen copy
        tgt = [{k: v.copy() for k, v in L.items()} for L in net]

def policy(env):
    return int(fwd(net, env.obs()[None])[0][0].argmax())

res = score(policy, n=10, seed0=1000, repeat=3)
print("%d decisions, %d gradient steps" % (BUDGET, t_adam))
print("  Huber loss, first 200 steps  %7.4f" % np.mean(losses[:200]))
print("  Huber loss, last 200 steps   %7.4f" % np.mean(losses[-200:]))
print()
print("  scored on 10 held-out duels:")
print("    wins %d/10   own hp %5.1f   boss hp %6.1f   parries %.2f   swings %.2f"
      % (res["win"], res["php"], res["bhp"], res["parries"], res["swings"]))
print()
print("  the shipped run used 2,000,000 decisions -- 250x this -- and scored zero wins")
print("  on every evaluation through the first 900,000 of them.")`;

const outTinyRun = `8000 decisions, 1875 gradient steps
  Huber loss, first 200 steps   0.4404
  Huber loss, last 200 steps    0.2458

  scored on 10 held-out duels:
    wins 0/10   own hp  -8.2   boss hp  230.4   parries 0.10   swings 1.20

  the shipped run used 2,000,000 decisions -- 250x this -- and scored zero wins
  on every evaluation through the first 900,000 of them.`;

const outDevices = `does the GPU help? the same four loops on both devices, best of 3, 4000 decisions each
cpu vs NVIDIA GeForce GTX 1660 Ti
------------------------------------------------------------------------------
                                                       cpu      cuda   speedup
  the duel alone, random buttons, 1 at a time        19001     19116     1.01x
  + a network forward per decision, 1 duel            4458      1876     0.42x
  + the same forward over 16 duels at once           16013     12755     0.80x
  + half a gradient step per decision (DQN)            639       636     1.00x

  decisions/s. The bottom row is the one a real run is made of, so a 2,000,000-decision
  run costs about 52 min of it on the cpu and 52 min on the gpu, before evaluations.
  The top row is the duel itself and has no tensors in it, so it is the control: the
  two devices MUST agree there. This run: 1.01x -- good, the table is readable
  (Reps are interleaved cpu/cuda/cpu/cuda so load lands on both sides equally. An
  earlier version timed all of one device and then the other, and the control row
  wandered between 0.84x and 1.49x run to run.)

the same question with the environment taken out: gradient steps a second
-------------------------------------------------------------------------
  batch                                                cpu      cuda   speedup
  256                                                  395       389     0.99x  <- what this world trains at
  1024                                                 196       382     1.94x
  4096                                                  56       393     6.99x
  16384                                                 14       184    13.20x
  65536                                                  4        56    15.55x

  A gradient step on 256 rows of 27 floats is about a microsecond of arithmetic and
  several microseconds of launch overhead, so the launch wins. The GPU is not slow
  here; it is idle, waiting for work small enough that sending it costs more than
  doing it. The crossover is the number to remember, not the hardware.

is it even on the GPU? (yes -- the dedicated one, and it is bored)
------------------------------------------------------------------
  display adapters this machine has: NVIDIA GeForce GTX 1660 Ti, Intel(R) UHD Graphics 630
  adapters CUDA can address: 1, because CUDA runs on NVIDIA silicon and nothing else
    cuda:0  NVIDIA GeForce GTX 1660 Ti -- capability 7.5, 24 SMs, 6.4 GB VRAM, pci bus 1
  the trainer's own MLP, built exactly as train_dqn builds it:
    f.0.weight (256, 27)    device cuda:0
    77072 parameters, 301.1 KB of VRAM
  the same card on work it IS big enough for -- 50 matmuls of 4096 squared:
    cpu    23.94 s       287 GFLOP/s
    cuda    1.58 s      4341 GFLOP/s
    for proportion: GTX 1660 Ti ~5437  Intel UHD 630 (integrated) ~400  AMD Vega 8 (integrated) ~1100
    -- a measured 4341 is out of reach of any integrated part by 10x.
  and what the card is doing while a gradient step of each size runs:
    batch 256       401 steps/s   utilisation: torch median  19%, nvidia-smi 19 %
    batch 4096      415 steps/s   utilisation: torch median  49%, nvidia-smi 47 %
    batch 65536      78 steps/s   utilisation: torch median  97%, nvidia-smi 100 %
  So the card is real, it is the dedicated one, it is being used -- and at the batch
  this world trains at it is mostly idle. A faster card would not shorten the run.
  (Task Manager shows the 3D engine by default and CUDA work lands on Compute_0, so
  a busy card can read 0% there. Change the graph dropdown, or use nvidia-smi.)`;
