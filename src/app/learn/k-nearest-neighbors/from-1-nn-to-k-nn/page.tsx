import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "From 1-NN to k-NN — Manifold",
  description:
    "Start with the simplest case — copy the single nearest neighbour — see why it's dangerously noise-sensitive, and watch how averaging over k neighbours is the fix that defines the algorithm.",
};

// 1-NN decision regions: colour a grid by the class of its single nearest training
// point. Includes one mislabelled outlier to show the noise island 1-NN creates.
const CLASSES = ["var(--c-classification)", "var(--c-regression)"];
const TRAIN: { x: number; y: number; c: number }[] = [
  { x: 24, y: 30, c: 0 }, { x: 32, y: 46, c: 0 }, { x: 20, y: 58, c: 0 }, { x: 38, y: 28, c: 0 },
  { x: 30, y: 70, c: 0 }, { x: 44, y: 60, c: 0 }, { x: 18, y: 42, c: 0 },
  { x: 76, y: 70, c: 1 }, { x: 68, y: 54, c: 1 }, { x: 80, y: 42, c: 1 }, { x: 62, y: 72, c: 1 },
  { x: 70, y: 30, c: 1 }, { x: 56, y: 40, c: 1 }, { x: 82, y: 58, c: 1 },
  { x: 40, y: 50, c: 1 }, // a noisy class-1 point deep in class-0 territory
];
const W = 300, H = 220, STEP = 4;
const sx = (x: number) => Math.round((14 + (x / 100) * (W - 28)) * 100) / 100;
const sy = (y: number) => Math.round((H - 14 - (y / 100) * (H - 28)) * 100) / 100;
const CELLS: { gx: number; gy: number; c: number }[] = [];
for (let gx = 0; gx <= 100; gx += STEP) for (let gy = 0; gy <= 100; gy += STEP) {
  let best = 0, bd = Infinity;
  TRAIN.forEach((p) => { const d = (gx - p.x) ** 2 + (gy - p.y) ** 2; if (d < bd) { bd = d; best = p.c; } });
  CELLS.push({ gx, gy, c: best });
}

export default function From1to_kPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-classification)")}>Classification</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        From 1-NN to k-NN
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The simplest neighbour rule uses just one neighbour. Seeing exactly how it fails is the cleanest
        way to understand why we average over <em>k</em> — and what that <em>k</em> buys us.
      </p>

      <div className="lesson">
        <h2>1-NN: copy your single closest neighbour</h2>
        <p>
          With <em>k</em> = 1, a query simply takes the label of the one training point nearest to it.
          That carves the plane into <strong>Voronoi cells</strong> — one region per training point — and
          the decision boundary is the jagged seam where regions of different classes meet.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {CELLS.map((c, i) => (
              <rect key={i} x={sx(c.gx) - (STEP / 100) * (W - 28) / 2} y={sy(c.gy) - (STEP / 100) * (H - 28) / 2}
                width={(STEP / 100) * (W - 28)} height={(STEP / 100) * (H - 28)} fill={CLASSES[c.c]} fillOpacity={0.13} />
            ))}
            {TRAIN.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={CLASSES[p.c]} stroke="var(--canvas)" strokeWidth={1} />
            ))}
            <text x={sx(40)} y={sy(50) - 8} fontSize={9} fill="var(--bad, #d9534f)" textAnchor="middle">noisy point</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            1-NN regions. The boundary is ragged, and that single mislabelled blue point deep in pink
            territory carves out its own little blue <strong>island</strong> — every query that lands there
            is misclassified. 1-NN trusts every point completely, noise included.
          </div>
        </div>

        <h2>Why 1-NN is fragile</h2>
        <p>
          1-NN has <strong>zero training error</strong> — every training point is its own nearest
          neighbour, so it&rsquo;s always &ldquo;right&rdquo; on the data it memorised. But that&rsquo;s exactly the
          problem: it memorises the noise too. A single mislabelled or outlier point creates a whole region
          of wrong predictions. In bias–variance terms, 1-NN is <strong>maximum variance</strong>: wildly
          sensitive to the particular training sample.
        </p>

        <h2>k-NN: vote, don&rsquo;t copy</h2>
        <p>
          The fix is to ask more neighbours and take a majority vote. With <em>k</em> = 5, the lone noisy
          point is outvoted four-to-one by the genuine class around it, and its island dissolves. Averaging
          over neighbours:
        </p>
        <ul style={ul}>
          <li><strong>Smooths the boundary</strong> — it grows less jagged as <em>k</em> rises.</li>
          <li><strong>Resists noise</strong> — one bad point can no longer dictate a region.</li>
          <li><strong>Trades variance for bias</strong> — larger <em>k</em> is steadier but blurs fine, real detail too.</li>
        </ul>
        <p>
          So <em>k</em> is the dial between memorising (small <em>k</em>, jagged, high variance) and
          over-smoothing (large <em>k</em>, blurry, high bias). Tuning it is important enough to get its own
          chapter — but the core insight is right here: <strong>k buys you robustness by averaging.</strong>
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-classification)", marginBottom: 4 }}>
            A note on even vs. odd k
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            For two-class problems, an <strong>odd</strong> <em>k</em> avoids tied votes (you can&rsquo;t split 5
            evenly). With more classes, or distance-weighted voting, ties can still happen and need a
            tie-break rule — a practical detail we&rsquo;ll return to. For now: prefer odd <em>k</em> for binary
            k-NN.
          </p>
        </div>

        <h2>1-NN and k-NN, side by side</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-nearest-neighbors/similarity-and-distance" style={navLink}>← Similarity &amp; distance</Link>
          <Link href="/learn/k-nearest-neighbors/the-algorithm-end-to-end" style={{ ...navLink, fontWeight: 600 }}>Next up · The algorithm, end to end →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from collections import Counter

def knn(X_train, y_train, x, k):
    d = np.sqrt(((X_train - x)**2).sum(axis=1))
    nearest = y_train[np.argsort(d)[:k]]
    return Counter(nearest).most_common(1)[0][0]

# k=1 copies the single closest label (memorises noise);
# k=5 takes a vote (a lone bad neighbour gets outvoted).
print(knn(X_train, y_train, x_query, k=1))
print(knn(X_train, y_train, x_query, k=5))`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier

one_nn  = KNeighborsClassifier(n_neighbors=1).fit(X_train, y_train)   # jagged, noisy
five_nn = KNeighborsClassifier(n_neighbors=5).fit(X_train, y_train)   # smoother, robust

print("1-NN train accuracy:", one_nn.score(X_train, y_train))  # 1.0 — memorised!
print("5-NN train accuracy:", five_nn.score(X_train, y_train)) # < 1.0, but generalises better`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-classification) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-classification) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
