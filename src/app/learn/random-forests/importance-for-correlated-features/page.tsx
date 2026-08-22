import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Importance for correlated features — Manifold",
  description:
    "Both of a forest's importance measures mislead when features are correlated: impurity importance splits the credit between duplicates, and permutation importance zeroes them out because a twin compensates. How to read importance honestly.",
};

const TREES = "var(--c-trees)";

export default function CorrelatedImportancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Importance for correlated features</>}
        intro={<>
          Feature importance is the first thing people read off a forest, and correlated features quietly break{" "}
          <em> both</em> ways of computing it — in opposite directions. Knowing how is the difference between an
          insight and a wrong conclusion shipped with confidence.
        </>}
      />

      <div className="lesson">
        <h2>A controlled experiment</h2>
        <p>
          Take one genuine driver of the target and give the model <strong>two near-duplicate copies</strong> of
          it, <code>x1</code> and <code>x2</code> (correlation ≈ 0.99), plus four noise features. We know the
          truth: <code>x1</code> and <code>x2</code> are equally, jointly important. Watch what a random
          forest&rsquo;s two importance measures say (real run, <code>scripts/forest_cases.py</code>):
        </p>
        <CodeOutput label="importance of the two duplicated drivers">{`MDI  (impurity):     x1 0.354   x2 0.479     sum 0.834
permutation:         x1 0.024   x2 0.372`}</CodeOutput>

        <h2>Two measures, two different lies</h2>
        <p>
          <strong>Impurity importance (MDI) splits the credit.</strong> At each node the tree picks{" "}
          <code>x1</code> or <code>x2</code> essentially at random (they&rsquo;re interchangeable), so the credit
          for the single underlying signal is <em>divided</em> between them — 0.354 and 0.479. Individually each
          looks middling; a naive reading (&ldquo;neither is very important&rdquo;) is exactly backwards. Their{" "}
          <strong> sum</strong>, 0.834, is closer to the truth — the pair matters enormously.
        </p>
        <p>
          <strong>Permutation importance under-credits both.</strong> Its logic is &ldquo;shuffle a feature, see
          how much score drops.&rdquo; But when you shuffle <code>x1</code>, its intact twin <code>x2</code>{" "}
          still carries the whole signal, so accuracy barely moves and <code>x1</code> scores ~0.024 —
          &ldquo;unimportant.&rdquo; The measure asks &ldquo;can the model do without this feature <em>alone</em>?&rdquo;
          and for correlated features the answer is always yes, because the twin compensates. Drop the wrong one
          and you&rsquo;d conclude a key driver was useless.
        </p>

        <Callout color={TREES} title={<>The trap, stated once</>}>
          With correlated features, <strong>MDI dilutes importance across the group</strong> (each looks smaller
          than it is) and <strong>permutation collapses it</strong> (each looks near-zero because a correlate
          covers). Neither is lying about the math — they&rsquo;re answering questions whose answers only make
          sense for <em>independent</em> features. Correlation breaks that assumption.
        </Callout>

        <h2>Reading importance honestly</h2>
        <ul style={ul}>
          <li><strong>Cluster correlated features first, then interpret groups.</strong> Compute importance for
            a <em>group</em> of correlated features together (sum their MDI, or permute them jointly). The group
            &ldquo;x1+x2&rdquo; shows its real 0.83 — the honest unit of interpretation is the cluster, not the
            column.</li>
          <li><strong>Use conditional permutation importance.</strong> Permute a feature <em>within</em> groups
            of similar rows so a correlate can&rsquo;t fully substitute — it restores credit to correlated
            features that plain permutation strips.</li>
          <li><strong>Prefer drop-column or SHAP when you can afford them.</strong> Drop-column importance
            (refit without the feature) is expensive but direct; SHAP values distribute credit more fairly and
            have correlation-aware variants.</li>
          <li><strong>Never rank features by MDI across mixed cardinalities</strong> — recall the separate{" "}
            <Link href="/learn/decision-trees/feature-importance" style={link}>impurity-bias</Link> that inflates
            high-cardinality features. Correlation and cardinality are two independent ways MDI misleads.</li>
        </ul>

        <p>
          The practical rule: treat a single feature&rsquo;s importance number as <em>provisional</em> whenever
          your features are correlated (which is nearly always). Group them, corroborate MDI against permutation,
          and be suspicious when the two measures disagree sharply — that disagreement is itself the signal that
          correlation is in play.
        </p>

        <PrevNext
          prev={{ href: "/learn/random-forests/isolation-forests", label: <>← Isolation forests</> }}
          next={{ href: "/learn/random-forests/when-to-use", label: <>Next up · When to use a random forest →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
