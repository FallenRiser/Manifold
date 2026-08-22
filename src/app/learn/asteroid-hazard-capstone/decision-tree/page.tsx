import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Decision tree — capacity and the overfitting tell — Manifold",
  description:
    "A single tree can bend where the linear model couldn't — lifting PR-AUC to 0.435 at depth 8. But push depth higher and train PR-AUC races to a perfect 1.0 while test collapses to 0.20. The gap between train and test, not the test score alone, is how you diagnose overfitting and choose capacity.",
};

const SPACE = "var(--c-space)";

// The overfitting curve, from scripts/neo_cases.py section 7. Depths on the x-axis
// (evenly spaced categories), train vs test PR-AUC. Static SVG → SSR-safe.
const DEPTHS = ["1", "2", "3", "4", "6", "8", "12", "20", "∞"];
const TRAIN = [0.295, 0.368, 0.408, 0.436, 0.459, 0.502, 0.573, 0.789, 1.0];
const TEST = [0.308, 0.362, 0.396, 0.419, 0.43, 0.435, 0.422, 0.336, 0.201];
const PEAK = 5; // index of depth 8, the test peak

function OverfitCurve() {
  const W = 640, H = 300, PL = 44, PR = 16, PT = 18, PB = 40;
  const n = DEPTHS.length;
  const x = (i: number) => PL + (i / (n - 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v) * (H - PT - PB);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Train PR-AUC rises to 1.0 with depth while test PR-AUC peaks near depth 8 then collapses">
      {/* gridlines */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((g) => (
        <g key={g}>
          <line x1={PL} y1={y(g)} x2={W - PR} y2={y(g)} stroke="var(--border)" strokeWidth={1} />
          <text x={PL - 6} y={y(g) + 3} textAnchor="end" fontSize={10} fill="var(--faint)">{g.toFixed(1)}</text>
        </g>
      ))}
      {/* peak marker */}
      <line x1={x(PEAK)} y1={PT} x2={x(PEAK)} y2={H - PB} stroke={SPACE} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
      {/* train + test lines */}
      <path d={path(TRAIN)} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 4" />
      <path d={path(TEST)} fill="none" stroke={SPACE} strokeWidth={2.5} />
      {TRAIN.map((v, i) => <circle key={`a${i}`} cx={x(i)} cy={y(v)} r={2.4} fill="var(--muted)" />)}
      {TEST.map((v, i) => <circle key={`b${i}`} cx={x(i)} cy={y(v)} r={i === PEAK ? 4 : 2.8} fill={SPACE} />)}
      {/* x labels */}
      {DEPTHS.map((d, i) => <text key={d} x={x(i)} y={H - PB + 16} textAnchor="middle" fontSize={10.5} fill="var(--faint)">{d}</text>)}
      <text x={(PL + W - PR) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">tree max_depth →</text>
      {/* legend */}
      <text x={W - PR - 4} y={y(0.92)} textAnchor="end" fontSize={11} fill="var(--muted)">— — train PR-AUC</text>
      <text x={W - PR - 4} y={y(0.5)} textAnchor="end" fontSize={11} fill={SPACE}>—— test PR-AUC</text>
    </svg>
  );
}

export default function DecisionTreePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Decision tree — capacity &amp; the overfitting tell</>}
        intro={<>
          The logistic model barely beat the size rule, hinting the leftover signal might be non-linear. A decision tree
          can bend — it carves the feature space into axis-aligned boxes — so it&rsquo;s the natural next rung. But that
          same flexibility is a loaded gun, and this page is really about learning to see it go off.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Can a single flexible model beat the linear one — and how do I <em>know</em> when its flexibility has tipped
          from fitting the signal into memorising the noise?
        </AnalystQuestion>

        <ModelAnatomy
          accent={SPACE}
          form={<>recursive axis-aligned splits into pure-ish leaves → leaf hazard rate</>}
          loss={<>Gini impurity at each split; depth caps capacity</>}
          optimiser={<>greedy — best single split at each node</>}
        />

        <h2>The move: sweep capacity and watch train vs test together</h2>
        <p>
          A tree&rsquo;s capacity is set by how deep it&rsquo;s allowed to grow. The single most important diagnostic in
          all of modelling is to vary that capacity and plot <strong>training</strong> score and <strong>test</strong>{" "}
          score on the same axes. You are not looking for the highest test score in isolation — you are watching the{" "}
          <em>gap</em> between the two curves, because that gap <em>is</em> overfitting made visible.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`max_depth   train PR-AUC   test PR-AUC
    1           0.295         0.308     <- underfit (~ the size rule)
    4           0.436         0.419
    6           0.459         0.430
    8           0.502         0.435     <- test peaks here
   12           0.573         0.422     <- gap opening, test falling
   20           0.789         0.336
   None         1.000         0.201     <- memorised train, test collapses`}</CodeOutput>

        <figure style={{ margin: "18px 0 6px" }}>
          <OverfitCurve />
          <figcaption style={cap}>
            Train PR-AUC (grey dashed) climbs without limit toward a perfect 1.0 — a deep tree can memorise every
            training row. Test PR-AUC (indigo) rises, <strong>peaks near depth 8 at 0.435</strong>, then falls as the
            widening gap turns into pure memorisation. The best model is at the peak, not the right edge.
          </figcaption>
        </figure>

        <Callout color={SPACE} title={<>The gap is the diagnosis, the peak is the choice</>}>
          Read the two curves as a story. Where they rise together (depth ≤ 8), added capacity is buying real signal —
          the model is learning. Where train keeps climbing but test turns down (depth &gt; 8), the extra capacity is
          fitting quirks of the training rows that don&rsquo;t generalise — that&rsquo;s overfitting, and no amount of it
          helps. At <code>max_depth=None</code> the tree scores a <em>perfect 1.0 on train</em> and a near-baseline 0.20
          on test: it has memorised the training set and learned almost nothing transferable. We pick the peak, around{" "}
          <strong>depth 8, test PR-AUC 0.435</strong>.
        </Callout>

        <h2>Did bending help?</h2>
        <p>
          Yes, decisively. The tuned tree&rsquo;s <strong>0.435</strong> clears the logistic model&rsquo;s 0.309 by a
          wide margin, confirming the earlier hunch: the leftover signal beyond size really is <em>non-linear</em>. A
          straight boundary couldn&rsquo;t use it; axis-aligned boxes can. That justifies the rung we climbed — and
          raises the next question. A single tuned tree is still notoriously high-variance (nudge the data, get a
          different tree). Could we keep the flexibility but tame the variance by <em>averaging many trees</em>? That is
          exactly the random forest.
        </p>

        <TransferBox>
          Never judge a flexible model by its test score alone — always plot train vs test (or CV) across a capacity
          knob (tree depth, polynomial degree, network size, regularisation strength). Rising together = keep going;
          diverging = you&rsquo;ve passed the sweet spot. A model that scores near-perfectly on train and poorly on test
          isn&rsquo;t &ldquo;powerful&rdquo; — it&rsquo;s memorising.
        </TransferBox>

        <PlaybookRule n={14}>
          Diagnose overfitting by the <strong>train–test gap across a capacity knob</strong>, not the test score alone.
          Tune capacity to where the two curves stop rising together — the peak — not to the deepest model you can fit.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/logistic", label: <>← Logistic regression</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/random-forest", label: <>Next up · Random forest →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import average_precision_score

for d in [1, 2, 3, 4, 6, 8, 12, 20, None]:
    t = DecisionTreeClassifier(max_depth=d, class_weight="balanced",
                               random_state=0).fit(Xtr, ytr)
    trP = average_precision_score(ytr, t.predict_proba(Xtr)[:, 1])
    teP = average_precision_score(yte, t.predict_proba(Xte)[:, 1])
    print(d, round(trP, 3), round(teP, 3))`;

const cap: React.CSSProperties = { marginTop: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 };
