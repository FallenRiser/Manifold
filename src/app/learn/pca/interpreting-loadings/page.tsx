import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Reading components: loadings & biplots — Manifold",
  description:
    "A principal component is a weighted blend of your original features. Those weights — the loadings — are how you give a component a human name, and the biplot shows features and samples on one chart.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// real standardized load_wine PC1 loadings (top magnitudes), scripts/pca_cases.py
const LOAD: [string, number][] = [
  ["flavanoids", 0.423],
  ["total_phenols", 0.395],
  ["od280/od315", 0.376],
  ["proanthocyanins", 0.313],
  ["hue", 0.297],
  ["proline", 0.287],
  ["nonflavanoid_phenols", -0.299],
  ["alcalinity_of_ash", -0.239],
];

function LoadingsFig() {
  const VW = 520, VH = 260, MID = 250, PAD = 16;
  const barMax = 150;
  const rowH = (VH - 2 * PAD) / LOAD.length;
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: 14 }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="PC1 loadings for the standardized wine data">
          <line x1={MID} y1={PAD} x2={MID} y2={VH - PAD} stroke="var(--border-strong)" strokeWidth={1} />
          {LOAD.map(([name, w], i) => {
            const y = PAD + i * rowH + rowH / 2;
            const len = Math.abs(w) * barMax * 2;
            const x = w >= 0 ? MID : MID - len;
            return (
              <g key={name}>
                <rect x={x} y={y - rowH * 0.3} width={len} height={rowH * 0.6} rx={2} fill={w >= 0 ? DIM : "var(--brand-3)"} fillOpacity={0.8} />
                <text x={w >= 0 ? MID - 6 : MID + 6} y={y + 3} textAnchor={w >= 0 ? "end" : "start"} fontSize={10.5} fill="var(--muted)">{name}</text>
                <text x={w >= 0 ? x + len + 5 : x - 5} y={y + 3} textAnchor={w >= 0 ? "start" : "end"} fontSize={10} fill="var(--faint)">{w.toFixed(2)}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        PC1 loadings on the standardized <code>load_wine</code> data (real run). The big positive weights are all
        phenolic compounds moving together — so PC1 reads as an <strong>&ldquo;overall phenol content&rdquo;</strong>
        axis, not any single measurement.
      </figcaption>
    </figure>
  );
}

export default function InterpretingLoadingsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Reading components: loadings &amp; biplots</>}
        intro={<>A component is a direction in feature space, which means it&rsquo;s a recipe: so much of feature A, so
          much of feature B. Those coefficients — the <em>loadings</em> — are how you translate an abstract
          &ldquo;PC1&rdquo; into something you can name and reason about.</>}
      />

      <div className="lesson">
        <h2>Loadings are the recipe</h2>
        <p>
          Each principal component <M>{String.raw`v_j`}</M> is a unit vector, and its entries are the{" "}
          <strong>loadings</strong> — how much each original feature contributes to that component. A feature with a
          large positive loading pushes a sample&rsquo;s score up; a large negative one pushes it down; a near-zero
          loading means that feature is irrelevant to this component. Read the loadings and you can give the component
          a human label.
        </p>

        <LoadingsFig />

        <p>
          On the real wine data, PC1&rsquo;s biggest loadings — flavanoids (0.42), total phenols (0.40), OD280 (0.38)
          — are all measures of phenolic content, and they load together with the same sign. So PC1 isn&rsquo;t
          &ldquo;flavanoids&rdquo;; it&rsquo;s the underlying factor those correlated measurements share: overall
          phenolic richness. That&rsquo;s the payoff of interpretation — the component surfaces a latent theme the raw
          columns only hinted at.
        </p>

        <h2>The biplot</h2>
        <p>
          A <strong>biplot</strong> puts two things on one PC1–PC2 scatter: the <em>samples</em> as points (their
          scores) and the <em>features</em> as arrows (their loadings). It lets you read three things at once —
          which samples are similar (nearby points), which features drive each axis (arrow directions), and which
          features are correlated (arrows pointing the same way). It&rsquo;s the standard one-glance summary of a PCA,
          and the reason people reach for two components even when more would reconstruct better: two is what fits on a
          biplot.
        </p>

        <Callout color={DIM} title={<>Cautions when interpreting</>}>
          <strong>Signs are arbitrary.</strong> An eigenvector and its negation are equally valid, so PC1 pointing
          &ldquo;up&rdquo; vs &ldquo;down&rdquo; is meaningless — only relative signs within a component matter.
          <strong> Components need not be interpretable.</strong> PCA optimises variance, not meaning; a tidy story
          like &ldquo;phenol content&rdquo; is a bonus, not a guarantee. And <strong>standardize first</strong>, or
          the loadings just rank features by scale — the trap from the{" "}
          <Link href="/learn/pca/standardize-first" style={link}>standardizing page</Link>.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/whitening", label: <>← Whitening &amp; decorrelation</> }}
          next={{ href: "/learn/pca/when-pca-fails", label: <>Next up · When PCA fails →</> }}
        />
      </div>
    </article>
  );
}
