import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ShatteringLab } from "@/components/labs/ShatteringLab";

export const metadata = {
  title: "Shattering & VC dimension — Manifold",
  description:
    "The VC dimension is the largest number of points a hypothesis class can label in every possible way. Its definition hides a quantifier that almost everyone gets backwards — and a one-parameter class with infinite capacity proves that parameters are not capacity.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "1.2rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)" };

const VC_TABLE: [React.ReactNode, React.ReactNode, React.ReactNode][] = [
  [<>Thresholds on <M>{String.raw`\mathbb R`}</M></>, <M>1</M>, <>1 parameter — capacity matches</>],
  [<>Intervals on <M>{String.raw`\mathbb R`}</M></>, <M>2</M>, <>2 endpoints — capacity matches</>],
  [<>Linear classifiers in <M>{String.raw`\mathbb R^d`}</M></>, <M>{String.raw`d+1`}</M>, <>weights plus bias — capacity matches</>],
  [<>Axis-aligned rectangles in <M>{String.raw`\mathbb R^2`}</M></>, <M>4</M>, <>4 edges — capacity matches</>],
  [<>Depth-<M>k</M> decision trees, <M>d</M> features</>, <>≈ <M>{String.raw`2^k \log d`}</M></>, <>grows fast with depth</>],
  [<><M>{String.raw`h_\alpha(x) = \mathbb 1[\sin(\alpha x) > 0]`}</M></>, <M>{String.raw`\infty`}</M>, <><strong>one</strong> parameter, infinite capacity</>],
];

export default function VcDimensionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Measuring capacity", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 9 minutes"
        title={<>Shattering &amp; VC dimension</>}
        intro={<>The most famous number in learning theory, and the one most often quoted slightly wrong. Its
          definition turns on a single quantifier — and getting that quantifier right is the difference between
          understanding capacity and reciting it.</>}
      />

      <div className="lesson">
        <h2>Shattering</h2>
        <p>
          Fix a set of points <M>{String.raw`C = \{x_1, \dots, x_k\}`}</M>. Each hypothesis in{" "}
          <M>{String.raw`\mathcal H`}</M> assigns them some pattern of labels, and there are{" "}
          <M>{String.raw`2^k`}</M> conceivable patterns. We say <M>{String.raw`\mathcal H`}</M>{" "}
          <strong>shatters</strong> <M>C</M> if it can produce <em>every single one</em> of them:
        </p>
        <MathBlock>{String.raw`\big|\{(h(x_1), \dots, h(x_k)) : h \in \mathcal H\}\big| \;=\; 2^k.`}</MathBlock>
        <p>
          Shattering means the class is completely unconstrained on those points — the data can never rule anything
          out there, because whatever labels arrive, some hypothesis was ready for them. That is exactly the
          condition under which those points teach you nothing.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>Straight lines in the plane can shatter 3 points arranged in a triangle. Do they shatter <em>every</em> set of 3 points?</>}
          options={[
            "Yes — 3 points is 3 points, the arrangement can't matter",
            "No — some arrangements of 3 points defeat every line",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Work through all 8 labelings of the triangle using the strip at the bottom. Then switch to the collinear preset and find the labelings that no line can produce. Finally try the square.</>}
          insight={<>The triangle is shattered (8/8) but three <em>collinear</em> points are not (6/8) — the same number of points, defeated by their arrangement. This is why VC dimension asks whether <strong>some</strong> set of size <M>d</M> is shattered, never whether every one is. And the square caps it: 14/16, because the two diagonal labelings are the XOR pattern no line can produce.</>}
        >
          <ShatteringLab />
        </LabFrame>

        <h2>The definition, with the quantifier in bold</h2>
        <p>
          The <strong>VC dimension</strong> of <M>{String.raw`\mathcal H`}</M>, written{" "}
          <M>{String.raw`\text{VCdim}(\mathcal H)`}</M>, is the size of the largest set that{" "}
          <M>{String.raw`\mathcal H`}</M> shatters:
        </p>
        <MathBlock>{String.raw`\text{VCdim}(\mathcal H) \;=\; \max\big\{k : \exists\, C \text{ with } |C| = k \text{ that } \mathcal H \text{ shatters}\big\}`}</MathBlock>
        <p>
          Note the <M>{String.raw`\exists`}</M>. You need <strong>some</strong> set of size <M>k</M> to be
          shattered, not all of them. The lab makes the reason vivid: lines fail on collinear triples, so if the
          definition demanded <em>every</em> triple, the VC dimension of lines in the plane would be 2 rather than
          3, and essentially every published VC value would be wrong.
        </p>
        <p>
          To prove <M>{String.raw`\text{VCdim}(\mathcal H) = d`}</M> you therefore owe two arguments of very
          different flavours, and they trip people up in opposite directions:
        </p>
        <ul>
          <li><strong>Lower bound</strong> (<M>{String.raw`\ge d`}</M>): <em>exhibit</em> one set of <M>d</M> points and show all <M>{String.raw`2^d`}</M> labelings are achievable. A single lucky construction suffices.</li>
          <li><strong>Upper bound</strong> (<M>{String.raw`< d+1`}</M>): show that <em>no</em> set of <M>{String.raw`d+1`}</M> points can be shattered — a statement about every arrangement, which is the harder half.</li>
        </ul>

        <Proof title="proving VCdim = 3 for linear classifiers in the plane" color={GRAY}>
          <p>
            <strong>Lower bound: some 3 points are shattered.</strong> Take any triangle — three points in general
            position, exactly the lab&rsquo;s first preset. For each of the 8 labelings we must exhibit a separating
            line. If all three share a label, take a line entirely off to one side. If exactly one differs, that
            single point can be cut off from the other two by a line parallel to the edge joining them, since the
            three points are not collinear. Those two cases and their complements exhaust all 8. Hence{" "}
            <M>{String.raw`\text{VCdim} \ge 3`}</M>.
          </p>
          <p>
            <strong>Upper bound: no 4 points are shattered.</strong> Take any four points in the plane. By{" "}
            <strong>Radon&rsquo;s theorem</strong>, any <M>{String.raw`d+2`}</M> points in{" "}
            <M>{String.raw`\mathbb R^d`}</M> can be partitioned into two sets whose convex hulls intersect — for{" "}
            <M>{String.raw`d = 2`}</M>, any 4 points split into two groups <M>{String.raw`A, B`}</M> with{" "}
            <M>{String.raw`\text{conv}(A) \cap \text{conv}(B) \ne \emptyset`}</M>.
          </p>
          <p>
            Now label everything in <M>A</M> positive and everything in <M>B</M> negative, and suppose some line
            separated them. A linear separator puts all of <M>A</M> strictly on one side; since a half-plane is
            convex, it must also contain all of <M>{String.raw`\text{conv}(A)`}</M>. The same argument puts{" "}
            <M>{String.raw`\text{conv}(B)`}</M> strictly on the other side. But the two hulls share a point{" "}
            <M>p</M>, which would have to lie strictly on both sides at once — a contradiction. So this labeling is
            unachievable, no 4-point set is shattered, and <M>{String.raw`\text{VCdim} < 4`}</M>.
          </p>
          <p>
            Together: <M>{String.raw`\text{VCdim}(\text{linear in } \mathbb R^2) = 3`}</M>. The two concrete
            failures the lab shows you are the two halves of this proof — the collinear triple is why the lower
            bound needs a <em>specific</em> configuration, and the square&rsquo;s XOR labeling is Radon&rsquo;s
            theorem appearing in the simplest possible case, the two diagonals crossing at a point. The general
            result is <M>{String.raw`\text{VCdim}(\text{linear in } \mathbb R^d) = d+1`}</M>, proved the same way
            with the full Radon theorem.
          </p>
        </Proof>

        <h2>A table, and the entry that ruins the pattern</h2>
        <table style={table}>
          <thead>
            <tr><th style={th}>Hypothesis class</th><th style={th}>VC dimension</th><th style={th}>vs. parameter count</th></tr>
          </thead>
          <tbody>
            {VC_TABLE.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r[0]}</td>
                <td style={{ ...td, color: i === VC_TABLE.length - 1 ? "var(--bad)" : "var(--ink)" }}>{r[1]}</td>
                <td style={{ ...td, color: "var(--muted)" }}>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          The first four rows make VC dimension look like a fancy name for &ldquo;number of parameters&rdquo;, and
          for those classes it is. Then look at the last row.
        </p>

        <h2>One parameter, infinite capacity</h2>
        <p>
          Consider <M>{String.raw`\mathcal H = \{h_\alpha(x) = \mathbb 1[\sin(\alpha x) > 0] : \alpha \in \mathbb R\}`}</M>.
          A single real parameter. Its VC dimension is <strong>infinite</strong>: for <em>any</em> <M>k</M>, there
          is a set of <M>k</M> points that this one-parameter class shatters. Choose the points at{" "}
          <M>{String.raw`x_i = 2\pi \cdot 10^{-i}`}</M>; cranking <M>{String.raw`\alpha`}</M> to a huge value makes
          the sine oscillate so violently that its sign at each of those scales can be set independently, so all{" "}
          <M>{String.raw`2^k`}</M> labelings are reachable by choosing <M>{String.raw`\alpha`}</M> appropriately.
        </p>
        <p>
          So &ldquo;more parameters means more capacity&rdquo; is <strong>false as a theorem</strong>, even though
          it&rsquo;s a decent rule of thumb for the models in rows one to four. Capacity measures how many patterns
          a class can express, and a single real number carries infinitely many bits if you use them
          adversarially. Hold onto this: it is the first crack in the intuition that the{" "}
          <Link href="/learn/learning-theory/when-the-bounds-break" style={link}>final chapter</Link> drives a
          truck through, when we look at networks with more parameters than training points that generalize
          beautifully anyway.
        </p>

        <Callout color={GRAY} title={<>What VC dimension is actually for</>}>
          Not for computing a number to report — for most models you use, it is unknown or uselessly loose. Its
          value is <em>structural</em>: it tells you that capacity is a real, measurable property distinct from
          parameter count; it makes &ldquo;this class is more expressive&rdquo; precise; and, via the growth
          function on the next page, it is what converts an infinite class into a finite effective one so the
          union-bound argument can run. Treat it as a lens, not a metric.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning-theory/when-counting-fails", label: <>← When counting hypotheses fails</> }}
          next={{ href: "/learn/learning-theory/growth-function", label: <>Next up · The growth function &amp; Sauer&rsquo;s lemma →</> }}
        />
      </div>
    </article>
  );
}
