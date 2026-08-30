import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Reproducibility — Manifold",
  description:
    "The test is whether someone else can produce your number from your repository next quarter. Seeds, data versions, the notebook problem, and why the pipeline is the reproducible artefact.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const LEVELS: { level: string; means: string; cost: string }[] = [
  { level: "Re-runnable", means: "the same code on the same machine gives the same number today", cost: "a seed and a saved dataset" },
  { level: "Reproducible", means: "someone else, on another machine, gets your number from your repo", cost: "pinned dependencies and a data version" },
  { level: "Auditable", means: "you can say which data, code and parameters produced a number from six months ago", cost: "an experiment log and immutable data snapshots" },
  { level: "Replicable", means: "the finding survives new data collected the same way", cost: "the only one that is about the world rather than the code" },
];

const CODE = `# The reproducibility header worth having at the top of every run.
# It costs six lines and it is the difference between "the number moved"
# and "the number moved and we know why".

import json, platform, subprocess, sys
import numpy as np, sklearn, pandas as pd

RUN = {
    "git_sha": subprocess.check_output(
        ["git", "rev-parse", "HEAD"], text=True).strip(),
    "dirty": bool(subprocess.check_output(
        ["git", "status", "--porcelain"], text=True).strip()),
    "python": sys.version.split()[0],
    "numpy": np.__version__,
    "sklearn": sklearn.__version__,
    "pandas": pd.__version__,
    "seed": 0,
    "data_snapshot": "s3://bucket/events/2026-08-01/",   # never "latest"
    "n_rows": len(df),
    "target_mean": float(df[target].mean()),   # catches silent data changes
}
print(json.dumps(RUN, indent=2))

# The last two entries are the ones people leave out and the ones that
# earn their place: if a rerun produces a different score, they tell you
# immediately whether the DATA changed or the CODE did.`;

export default function ReproducibilityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond the notebook", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Reproducibility</>}
        intro={<>Not a virtue you perform for a code review. It is the property that decides whether your results
          are evidence about the world or an anecdote about one afternoon.</>}
      />

      <div className="lesson">
        <h2>Four things the word means</h2>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {LEVELS.map((l, i) => (
            <div key={l.level} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: GRAY, flexShrink: 0, width: 16 }}>{i + 1}</div>
              <div>
                <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{l.level}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginTop: 2 }}>{l.means}</div>
                <div style={{ fontSize: 12.5, color: "var(--faint)", lineHeight: 1.5, marginTop: 2 }}>Costs: {l.cost}.</div>
              </div>
            </div>
          ))}
        </div>
        <p>
          Most projects sit at level one and believe they are at level two. The gap shows up the first time
          someone else clones the repository, or the first time you return to it after four months — which is the
          same experience, since by then you are someone else.
        </p>

        <h2>The three things that actually move underneath you</h2>
        <ul>
          <li><strong>Randomness.</strong> Splits, initialisations, subsampling, and any parallelism with
            non-deterministic reduction order. Set seeds explicitly and pass them everywhere; a{" "}
            <code>random_state</code> left at <code>None</code> is a number you cannot get back.</li>
          <li><strong>Data.</strong> The largest source, and the least tracked. &ldquo;The customers
            table&rdquo; is not a dataset — it is a view that changes hourly. Point at an immutable snapshot with
            a date in the path, never at <code>latest</code>.</li>
          <li><strong>Dependencies.</strong> A default changes between library versions and your number moves for
            reasons that are nowhere in your diff. Pin them, and record the versions in the run itself so a
            future reader can see them without archaeology.</li>
        </ul>
        <CodeBlock fromScratch={CODE} />

        <Callout color={GRAY} title={<>Seeds are for reproducibility, not for results</>}>
          Reporting the score from your best seed out of ten is selection on noise — the same mechanism that turns
          200 coin flips into a reported 0.5975 in the{" "}
          <Link href="/learn/model-selection/the-selection-trap" style={link}>model selection pillar</Link>. If
          your result changes materially with the seed, that variance <em>is</em> the finding: report the mean and
          spread over several seeds rather than picking one. A seed makes a run repeatable; it must never make a
          result better.
        </Callout>

        <h2>The notebook problem</h2>
        <p>
          Notebooks are excellent for exploration and structurally hostile to reproducibility, for one specific
          reason: <strong>the state you are looking at is a function of execution order, not of the document.</strong>{" "}
          A cell edited after it ran, a variable from a cell since deleted, an out-of-order execution — all are
          invisible in the saved file, and all change your results.
        </p>
        <p>
          The workable compromise, rather than banning them: explore in a notebook, and move anything whose output
          you will <em>quote</em> into a module the notebook imports. Then restart-and-run-all before you believe
          any number. If it does not survive that, it was not a result.
        </p>

        <h2>The pipeline is the reproducible artefact</h2>
        <p>
          There is a satisfying convergence here. The{" "}
          <Link href="/learn/data-workflow/pipelines-and-the-fold" style={link}>pipeline</Link> was introduced to
          prevent preprocessing leakage, and it turns out to be the unit of reproducibility too — one fitted
          object containing every transform with its learnt parameters, serialisable, and applying exactly the
          same steps in training and serving.
        </p>
        <p>
          The alternative — preprocessing in a notebook, model in a pickle, transforms reimplemented in the
          serving code — is not only more work but is the standard origin of training/serving skew, where the
          offline number and the production behaviour differ for reasons nobody can locate.
        </p>

        <h2>The test, and how this site applies it to itself</h2>
        <p>
          <strong>Delete your working directory, clone the repository, and reproduce your headline number.</strong>{" "}
          Every gap you hit is a real gap, and finding them at your convenience is much better than finding them
          in front of a stakeholder.
        </p>
        <p>
          Every quantitative claim in this pillar comes from{" "}
          <code>scripts/data_workflow_cases.py</code>, committed alongside the pages, with fixed seeds and stated
          library versions. That is not decoration: it is the only reason the numbers on these pages are evidence
          rather than assertion, and the same standard is what you should hold your own results to. The capstones
          go one step further and ship an{" "}
          <Link href="/learn/california-housing-capstone/takeaways" style={link}>executed reproduction
          notebook</Link>, because published page code and the real experimental protocol can drift apart — and
          when they do, the artefact is the ground truth.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/what-to-do-next", label: <>← What to do next</> }}
          next={{ href: "/learn/data-workflow/drift-and-monitoring", label: <>Next up · Drift &amp; monitoring →</> }}
        />
      </div>
    </article>
  );
}
