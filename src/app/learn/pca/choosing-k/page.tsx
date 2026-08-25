import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Choosing k in practice — Manifold",
  description:
    "There is no universal right number of components — only the right number for your goal. Five rules, when each applies, and the one that beats them all when you have a downstream task.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const RULES: [string, string, string][] = [
  ["Variance threshold", "Keep enough components to reach 90% / 95% / 99% cumulative variance.", "General compression & denoising when you want a faithful copy."],
  ["The elbow", "Keep the components before the scree plot flattens.", "Quick exploration; when a compact, defensible cut matters more than exact fidelity."],
  ["Kaiser / average-eigenvalue", "Keep components whose eigenvalue exceeds the average (on standardized data, > 1).", "Standardized data; a fast rule of thumb, but often keeps too many."],
  ["Fixed budget", "k = 2 or 3, no matter what the variance says.", "Visualisation — you can only plot 2–3 axes regardless of what's optimal."],
  ["Downstream cross-validation", "Treat k as a hyperparameter; pick the k that maximises the end model's CV score.", "PCA as preprocessing — the only rule that optimises what you actually care about."],
];

export default function ChoosingKPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Choosing k in practice</>}
        intro={<>The honest answer to &ldquo;how many components?&rdquo; is &ldquo;it depends what you&rsquo;re
          reducing for.&rdquo; Compression, visualisation, and preprocessing pull toward different <M>k</M>. Here are
          the standard rules, what each optimises, and when to trust it.</>}
      />

      <div className="lesson">
        <h2>Five rules and what they&rsquo;re for</h2>
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Rule</th>
                <th style={th}>What it says</th>
                <th style={th}>Reach for it when…</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map(([a, b, c], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink)" }}>{a}</td>
                  <td style={td}>{b}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>They genuinely disagree — and that&rsquo;s fine</h2>
        <p>
          On the <code>load_digits</code> data the elbow points at ~10 components, the 90% threshold needs 21, and
          95% needs 29. If your job is a 2-D scatter plot, none of those matter — you keep 2 and accept that
          you&rsquo;re seeing only 28.5% of the variance, because two axes are all a page can show. If your job is
          compression, you chase the threshold. The rules aren&rsquo;t rivals; they answer different questions.
        </p>

        <Callout color={DIM} title={<>The rule that wins when you have a real task</>}>
          If PCA is a <em>preprocessing step</em> before a classifier or regressor, stop guessing and let the
          downstream model vote. Put PCA in a pipeline, treat <M>k</M> as a hyperparameter, and cross-validate. The
          best <M>k</M> is whatever maximises the end-to-end score — which may keep <em>fewer</em> components than any
          variance rule, because low-variance directions can still be noise the model is better off without. The{" "}
          <Link href="/learn/pca/case-preprocessing" style={link}>preprocessing case study</Link> does exactly this.
        </Callout>

        <h2>Cautions</h2>
        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Variance is not importance.</strong> A high-variance direction can be irrelevant to your label, and a low-variance one can be decisive. For <em>supervised</em> goals, cross-validate rather than trusting variance — or reach for <Link href="/learn/pca/vs-alternatives" style={link}>a supervised method like LDA</Link>.</li>
          <li><strong>The threshold depends on scaling.</strong> &ldquo;95% of variance&rdquo; means something completely different before and after <Link href="/learn/pca/standardize-first" style={link}>standardizing</Link> — always decide scaling first.</li>
          <li><strong>Kaiser over-keeps.</strong> The &ldquo;eigenvalue &gt; 1&rdquo; rule is popular but notoriously generous; use it as a ceiling, not a target.</li>
        </ul>

        <PrevNext
          prev={{ href: "/learn/pca/scree-and-explained-variance", label: <>← The scree plot &amp; explained variance</> }}
          next={{ href: "/learn/pca/standardize-first", label: <>Next up · Standardize before you PCA →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: 12, fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "9px 10px", verticalAlign: "top", color: "var(--ink)", lineHeight: 1.5 };
