import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "What you're actually choosing — Manifold",
  description:
    "Model selection sounds like picking a model. It's really picking a hypothesis class — and once you see that, hyperparameter tuning, architecture search, feature selection and preprocessing choices all turn out to be the same operation.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "1.2rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top" };

const ROWS: [React.ReactNode, React.ReactNode][] = [
  [<>Choosing polynomial degree 3 over degree 9</>, <>picking the smaller of two nested classes</>],
  [<>Setting <M>{String.raw`\lambda`}</M> in ridge regression</>, <>picking the radius of a ball of allowed weight vectors</>],
  [<>Capping tree depth at 5</>, <>restricting to partitions with at most <M>{String.raw`2^5`}</M> leaves</>],
  [<>Dropping 40 of 60 features</>, <>restricting to functions that ignore those 40 inputs</>],
  [<>Stopping SGD after 20 epochs</>, <>restricting to what&rsquo;s reachable from the initialization in 20 epochs</>],
  [<>Choosing an RBF kernel over a linear one</>, <>swapping the class entirely, for a much richer one</>],
];

export default function WhatYoureChoosingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The selection problem", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 6 minutes"
        title={<>What you&rsquo;re actually choosing</>}
        intro={<>A short reframing that makes the rest of this pillar coherent. The half-dozen activities you think
          of as separate — tuning, architecture search, feature selection, preprocessing — are one operation wearing
          different clothes.</>}
      />

      <div className="lesson">
        <h2>Not a model. A class.</h2>
        <p>
          When you &ldquo;select a model&rdquo;, you do not pick a fitted function directly — the fitting procedure
          does that. What you pick is the <strong>set of functions the fitting procedure is allowed to choose
          from</strong>. That set is the hypothesis class <M>{String.raw`\mathcal H`}</M>, and every knob you turn
          before training resizes or reshapes it.
        </p>

        <table style={table}>
          <thead>
            <tr><th style={th}>What you call it</th><th style={th}>What it does to <M>{String.raw`\mathcal H`}</M></th></tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r[0]}</td>
                <td style={{ ...td, color: "var(--muted)" }}>{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          Six activities that live in different parts of a codebase and often different parts of a team&rsquo;s
          vocabulary. One operation: <em>choosing how big a space to search</em>.
        </p>

        <Callout color={GRAY} title={<>Why the reframing pays for itself</>}>
          Because it tells you these choices <strong>cannot be made independently</strong>, which is the single most
          common tuning mistake. Deepening your trees and weakening your regularization both enlarge{" "}
          <M>{String.raw`\mathcal H`}</M>; doing both at once moves you twice as far as you intended. Adding 200
          engineered features while keeping <M>{String.raw`\lambda`}</M> fixed is not &ldquo;the same model with
          more information&rdquo; — it is a substantially larger class that now needs a stronger penalty to sit in
          the same place. Grid-searching capacity knobs <em>jointly</em> isn&rsquo;t thoroughness; it&rsquo;s
          correctness.
        </Callout>

        <h2>The two-level structure</h2>
        <p>
          Once you see selection as choosing a class, the whole workflow has an obvious shape. There is an{" "}
          <strong>inner</strong> problem — given a class, find its best member — and an <strong>outer</strong>{" "}
          problem — given several classes, decide which one to use:
        </p>
        <MathBlock>{String.raw`\underbrace{\hat h_{\mathcal H} = \arg\min_{h \in \mathcal H} \hat R_{\text{train}}(h)}_{\text{inner: fitting}} \qquad\qquad \underbrace{\mathcal H^\star = \arg\min_{\mathcal H} \hat R_{\text{val}}(\hat h_{\mathcal H})}_{\text{outer: selection}}`}</MathBlock>
        <p>
          Both levels are minimisations over data, so — and this is the whole point of the chapter —{" "}
          <strong>both levels overfit.</strong> Everyone knows the inner one does; that&rsquo;s what a validation
          set is for. The outer one overfits the validation set by exactly the same mechanism, and it is the one
          people forget. That&rsquo;s why the validation score of the winner is not an estimate of its
          performance, and why a third split exists.
        </p>
        <p>
          Notice the two levels also use different data by necessity, not convention. If the outer problem were
          scored on the training set, the biggest class would always win — it can always fit training data at least
          as well, so <M>{String.raw`\hat R_{\text{train}}`}</M> is monotone in class size and carries no signal
          about which class to prefer.
        </p>

        <h2>What makes a class &ldquo;right&rdquo;</h2>
        <p>
          Not size, in either direction. A class is right for your problem when it is <em>large enough to contain
          something good</em> and <em>small enough that your data can find it</em>. Those two demands pull opposite
          ways, they have formal names, and separating them is the most useful diagnostic in this pillar — the next
          page.
        </p>

        <PrevNext
          prev={{ href: "/learn/model-selection", label: <>← Choosing among models</> }}
          next={{ href: "/learn/model-selection/approximation-vs-estimation", label: <>Next up · Approximation vs estimation →</> }}
        />
      </div>
    </article>
  );
}
