import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Isolation forests: anomaly detection — Manifold",
  description:
    "Isolation forests find outliers by how easily random splits isolate them: anomalies are few and different, so they fall out in fewer cuts. A label-free, fast anomaly detector — ROC-AUC 0.97 on a clean demo.",
};

const TREES = "var(--c-trees)";

export default function IsolationForestsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Isolation forests: anomaly detection</>}
        intro={<>
          Random trees can do something that has nothing to do with prediction: find outliers, with no labels
          at all. The idea is a genuinely clever inversion — instead of asking a tree to classify, you ask how{" "}
          <em> hard</em> a point is to isolate.
        </>}
      />

      <div className="lesson">
        <h2>Anomalies isolate quickly</h2>
        <p>
          Build a tree by splitting on a <strong>random feature at a random threshold</strong>, over and over,
          until every point sits alone in its own region. No target, no impurity — pure random partitioning.
          Now count how many splits it took to isolate each point — its <strong>path length</strong> from the
          root.
        </p>
        <p>
          Here&rsquo;s the insight: an <strong>anomaly is few and different</strong>, sitting out in a sparse
          region of space. A random cut is therefore likely to peel it off early — it takes <em>few</em> splits
          to isolate. A normal point, buried in a dense cluster, needs <em>many</em> splits to separate from its
          neighbours. Average the path length over a forest of these random trees, and short average paths flag
          anomalies. That&rsquo;s an <strong>isolation forest</strong>.
        </p>

        <figure style={{ margin: "1.4rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 12px" }}>
            <IsolationFig />
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              The lone point (right) is sliced off in one or two random cuts — a short path.
              A point inside the cluster needs many cuts to isolate — a long path. Short path = anomalous.
            </div>
          </div>
        </figure>

        <h2>Why this is a good algorithm</h2>
        <ul style={ul}>
          <li><strong>Unsupervised.</strong> It needs no labelled anomalies — perfect, since anomalies are rare
            and labelling them is the hard part.</li>
          <li><strong>Fast and scalable.</strong> Trees are shallow (you only need to isolate, not classify) and
            built on small subsamples, so it&rsquo;s near-linear and handles large data easily.</li>
          <li><strong>It models &ldquo;normal&rdquo; by density, not by a boundary.</strong> No assumption about
            the shape of the normal class — just &ldquo;normal points are in crowded regions.&rdquo;</li>
        </ul>

        <p>On a clean demo — 2,000 normal points and 100 scattered outliers — it separates them almost perfectly:</p>
        <CodeBlock
          fromScratch={`from sklearn.ensemble import IsolationForest
from sklearn.metrics import roc_auc_score

iso = IsolationForest(n_estimators=200, contamination=0.05, random_state=0)
iso.fit(X)                         # no labels used
scores = -iso.score_samples(X)     # higher = more anomalous (shorter path)

print("ROC-AUC vs known labels:", round(roc_auc_score(y_true, scores), 3))`}
        />
        <CodeOutput label="output (synthetic: 2000 inliers + 100 uniform outliers)">{`ROC-AUC vs known labels: 0.969`}</CodeOutput>

        <Callout color={TREES} title={<>Isolation forest vs forest proximities</>}>
          The <Link href="/learn/random-forests/proximities" style={link}>previous page</Link> found outliers
          from a <em>supervised</em> forest&rsquo;s proximity matrix — points unlike others of their class. An
          isolation forest is <em>unsupervised</em> and built for the job: it doesn&rsquo;t need a target at all,
          and it scores global anomalies directly. Reach for proximities when you already have a trained
          classifier and want its view of what&rsquo;s odd; reach for an isolation forest when anomaly detection{" "}
          <em> is</em> the task.
        </Callout>

        <h2>Where it struggles</h2>
        <p>
          It&rsquo;s tuned for <strong>global</strong> anomalies — points in genuinely empty regions. It can
          miss <strong>local</strong> anomalies (a point that&rsquo;s odd only relative to a nearby dense
          cluster but sits in an otherwise normal area), where a density method like{" "}
          <Link href="/learn/k-nearest-neighbors" style={link}>local outlier factor</Link> does better. And
          axis-aligned random cuts weaken in very high dimensions with many irrelevant features. As always,
          match the tool to the shape of &ldquo;weird&rdquo; you&rsquo;re hunting.
        </p>

        <PrevNext
          prev={{ href: "/learn/random-forests/proximities", label: <>← Proximities, outliers & missing data</> }}
          next={{ href: "/learn/random-forests/importance-for-correlated-features", label: <>Next up · Importance for correlated features →</> }}
        />
      </div>
    </article>
  );
}

// static isolation figure — a dense cluster + one lone outlier, module-scope + rounded
const FS = 300, FH = 150;
const CLUSTER = (() => {
  let s = 9;
  const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  return Array.from({ length: 30 }, () => ({ x: 40 + r() * 55, y: 40 + r() * 70 }));
})();
function IsolationFig() {
  return (
    <svg viewBox={`0 0 ${FS} ${FH}`} width="100%" style={{ maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="a dense cluster and a lone outlier isolated by random cuts">
      {/* one cut that isolates the outlier quickly */}
      <line x1={200} y1={10} x2={200} y2={FH - 10} stroke="var(--c-trees)" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={205} y={22} fontSize={9} fill="var(--c-trees)">1 cut isolates it →</text>
      {/* many cuts inside the cluster */}
      {[52, 66, 80].map((x, i) => <line key={i} x1={x} y1={30} x2={x} y2={FH - 20} stroke="var(--border-strong)" strokeWidth={0.75} strokeDasharray="2 3" />)}
      <text x={40} y={FH - 4} fontSize={9} fill="var(--muted)">many cuts needed</text>
      {CLUSTER.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--muted)" opacity={0.7} />)}
      <circle cx={255} cy={70} r={4.5} fill="var(--c-classification)" stroke="var(--surface)" strokeWidth={1} />
    </svg>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
