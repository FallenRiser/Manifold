import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "PCA vs LDA, t-SNE & autoencoders — Manifold",
  description:
    "PCA is one point in a family of reducers. A clear map of when to use it versus LDA, kernel PCA, t-SNE/UMAP, and autoencoders — organised by the two questions that actually decide it.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const ROWS: [string, string, string, string][] = [
  ["PCA", "Unsupervised", "Linear", "Fast, deterministic, interpretable, reversible. The default first move."],
  ["Kernel PCA", "Unsupervised", "Nonlinear", "PCA in a kernel feature space — captures curved structure PCA misses."],
  ["LDA", "Supervised", "Linear", "Maximises class separation, not variance. Use when you have labels."],
  ["t-SNE / UMAP", "Unsupervised", "Nonlinear", "For 2-D visualisation only — preserves local neighbourhoods, distorts global distances."],
  ["Autoencoder", "Unsupervised", "Nonlinear", "Learned, flexible, scales to huge data — but iterative, opaque, needs tuning."],
];

export default function VsAlternativesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>PCA vs LDA, t-SNE &amp; autoencoders</>}
        intro={<>PCA is the linear, unsupervised, variance-maximising corner of a much bigger family. Every other
          method relaxes one of those three words. Two questions — do you have labels, and is your structure curved? —
          decide almost every real choice.</>}
      />

      <div className="lesson">
        <h2>The family, on two axes</h2>
        <p>
          Sort the common reducers by whether they use the labels (supervised vs unsupervised) and whether they can
          bend (linear vs nonlinear), and the map almost draws itself:
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5, minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Method</th>
                <th style={th}>Uses labels?</th>
                <th style={th}>Shape</th>
                <th style={th}>Character</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([m, s, l, c], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i === 0 ? `color-mix(in srgb, ${DIM} 6%, var(--surface))` : undefined }}>
                  <td style={{ ...td, fontWeight: 600, color: i === 0 ? DIM : "var(--ink)" }}>{m}</td>
                  <td style={td}>{s}</td>
                  <td style={td}>{l}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>How to choose</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Have labels and want to classify?</strong> Use <strong>LDA</strong> — it finds directions that separate classes, which PCA&rsquo;s variance criterion can miss entirely (the <Link href="/learn/pca/when-pca-fails" style={link}>&ldquo;variance isn&rsquo;t importance&rdquo;</Link> trap).</li>
          <li><strong>Structure is curved?</strong> Use <strong>kernel PCA</strong> or a <strong>manifold method</strong>. PCA&rsquo;s flat subspace can&rsquo;t follow a spiral or a ring.</li>
          <li><strong>Just want a 2-D picture to eyeball clusters?</strong> Use <strong>t-SNE or UMAP</strong> — but never read distances or cluster sizes off them literally; they preserve who&rsquo;s-near-whom, not how-far.</li>
          <li><strong>Huge data, and you can afford to train?</strong> An <strong>autoencoder</strong> scales and bends, at the cost of tuning, opacity, and a non-unique answer.</li>
          <li><strong>Everything else — and as a baseline always.</strong> <strong>PCA.</strong> It&rsquo;s so fast and safe that it&rsquo;s worth running first even when you&rsquo;ll end up using something fancier; it tells you the intrinsic dimension and gives every other method a sane starting point.</li>
        </ul>

        <Callout color={DIM} title={<>A common misuse worth flagging</>}>
          People often run <strong>t-SNE and then read the plot like a map</strong> — &ldquo;these two clusters are
          far apart, so they&rsquo;re very different.&rdquo; t-SNE and UMAP deliberately distort global distances to
          preserve local ones, so cluster <em>separations</em> and <em>sizes</em> on those plots are not meaningful.
          For anything where distances must be trusted — reconstruction, downstream distance-based models — reach for
          PCA, whose geometry is faithful.
        </Callout>

        <p>
          Every method past PCA appears elsewhere in this family; PCA is the one you understand them <em>against</em>.
          &ldquo;Like PCA, but nonlinear,&rdquo; &ldquo;like PCA, but supervised,&rdquo; &ldquo;like PCA, but
          learned&rdquo; — that&rsquo;s why it earned the first, deepest track. Next, two real datasets put it to work.
        </p>

        <PrevNext
          prev={{ href: "/learn/pca/when-pca-fails", label: <>← When PCA fails</> }}
          next={{ href: "/learn/pca/case-digits", label: <>Next up · Case: compressing handwritten digits →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: 12, fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "9px 10px", verticalAlign: "top", color: "var(--ink)", lineHeight: 1.5 };
