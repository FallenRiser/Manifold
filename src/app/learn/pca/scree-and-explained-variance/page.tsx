import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { ScreeLab } from "@/components/labs/ScreeLab";

export const metadata = {
  title: "The scree plot & explained variance — Manifold",
  description:
    "The eigenvalues, plotted in order, tell you how many components are worth keeping. The scree plot's elbow and the cumulative-variance curve are the two tools every practitioner reaches for first.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ScreePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dimensionality reduction", color: DIM }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>The scree plot &amp; explained variance</>}
        intro={<>PCA hands you as many components as you have features. The eigenvalues tell you which ones matter.
          Plot them in descending order and the shape of that plot — the classic &ldquo;scree&rdquo; — is the single
          most useful diagnostic for deciding how many to keep.</>}
      />

      <div className="lesson">
        <h2>Explained variance ratio</h2>
        <p>
          Each eigenvalue is the variance along its component, so its share of the total is the fraction of the
          data&rsquo;s variation that component explains:
        </p>
        <MathBlock>{String.raw`\text{explained variance ratio}_j = \frac{\lambda_j}{\sum_{i=1}^{d}\lambda_i}.`}</MathBlock>
        <p>
          Sort these from largest to smallest and plot them as bars: that&rsquo;s the <strong>scree plot</strong>
          {" "}(named after the loose rubble that piles at the foot of a cliff — the plot has the same shape). Add
          them up as you go and you get the <strong>cumulative explained variance</strong>, the curve that answers
          &ldquo;how much do I keep if I take the first <M>k</M>?&rdquo;.
        </p>

        <h2>The two things to look for</h2>
        <p>
          The bars below are the real spectrum of the 64-dimensional <code>load_digits</code> data. Two features of
          the plot guide the decision:
        </p>

        <LabFrame
          accent={DIM}
          tryThis={<>Slide <M>k</M> and find where the bars stop being tall and flatten into rubble — the
            &ldquo;elbow.&rdquo; Then find where the cumulative line crosses the 90% and 95% gridlines. How many
            components does each rule suggest?</>}
          insight={<>The elbow sits after the first ~10 steep bars, but the cumulative line doesn&rsquo;t reach 90%
            until <M>k=21</M> and 95% until <M>k=29</M>. The elbow and the variance-threshold rules disagree — which
            is exactly why &ldquo;how many components&rdquo; is a judgement call, taken up next.</>}
        >
          <ScreeLab />
        </LabFrame>

        <ul style={{ margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>The elbow.</strong> Where the bars drop from &ldquo;tall&rdquo; to &ldquo;flat,&rdquo; the marginal component stops buying you much. Keep the ones before the bend.</li>
          <li><strong>The threshold crossing.</strong> Draw a line at 90% or 95% cumulative variance and read off the <M>k</M> where the curve crosses it.</li>
        </ul>

        <Callout color={DIM} title={<>A scree plot is a diagnosis, not a verdict</>}>
          On the digits data the elbow says &ldquo;about 10&rdquo; while the 95% rule says &ldquo;29.&rdquo; Neither is
          wrong — they optimise for different things (a compact picture vs. faithful reconstruction). The scree plot
          shows you the trade-off; <em>you</em> pick the point on it that fits your goal. The{" "}
          <Link href="/learn/pca/choosing-k" style={link}>next page</Link> is the field guide for making that call.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/pca/reconstruction", label: <>← Reconstruction &amp; what you drop</> }}
          next={{ href: "/learn/pca/choosing-k", label: <>Next up · Choosing k in practice →</> }}
        />
      </div>
    </article>
  );
}
