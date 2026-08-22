import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Researching an unfamiliar field — Manifold",
  description:
    "The transferable first move on any dataset from a field you don't know: a five-step domain-research routine — provenance, the data dictionary, the target's official definition, plausibility, and the honest list of unknowns — before a single plot.",
};

const SPACE = "var(--c-space)";

export default function ResearchingTheFieldPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 1 · Frame the field", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Researching an unfamiliar field</>}
        intro={<>
          You&rsquo;ve been handed a table of asteroid data. You are not an astronomer. That is completely normal —
          most real projects start in a field you don&rsquo;t know. The skill isn&rsquo;t knowing the field; it&rsquo;s
          having a <em>routine</em> for getting oriented fast without fooling yourself.
        </>}
      />

      <div className="lesson">
        <AnalystQuestion>
          You&rsquo;ve been handed data from a field you know nothing about. Before a single plot — how do you get
          oriented, and how do you avoid confidently fooling yourself?
        </AnalystQuestion>

        <h2>You don&rsquo;t need to become an expert</h2>
        <p>
          You need a <strong>working model</strong>: enough to read every column, know exactly how the target is
          defined, and trust your own sanity checks. That&rsquo;s it. Chasing a domain PhD is procrastination; the
          fast, reliable path is a fixed routine you run on <em>every</em> new dataset.
        </p>

        <h2>The five-step domain-research routine</h2>
        <p>This is the part to memorise — it transfers to any dataset, in any field:</p>
        <ol style={ol}>
          <li>
            <strong>Provenance — who made this, when, and why?</strong> A dataset is an argument someone assembled for
            a purpose. Knowing the collector&rsquo;s goal reveals their blind spots and biases. Search the source, the
            collection method, and the date it was cut.
          </li>
          <li>
            <strong>The data dictionary — the official meaning and units of every column.</strong> Never guess from a
            column name. Is a distance in kilometres or astronomical units? A speed in km/h or km/s? A wrong unit
            assumption silently corrupts everything downstream.
          </li>
          <li>
            <strong>The target&rsquo;s official definition — how is the label actually assigned?</strong> This is the
            most important step and the most skipped. If a feature is <em>used to define</em> the label, then using it
            to predict the label is leakage — you&rsquo;re just re-deriving the definition and calling it a model.
          </li>
          <li>
            <strong>Plausibility — look up typical real-world ranges.</strong> Do your numbers agree with reality? If a
            &ldquo;human age&rdquo; column has values of 300, or a probability is 1.4, the problem is your data, not the
            world.
          </li>
          <li>
            <strong>Write down the unknowns.</strong> An explicit list of assumptions and gaps. Naming what you
            don&rsquo;t know is a professional skill, not an admission of weakness — it&rsquo;s what stops an unknown
            from becoming a silent bug.
          </li>
        </ol>

        <Callout color={SPACE} title={<>How a senior thinks, before touching the file</>}>
          They don&rsquo;t open the CSV first. They open a search engine and ask{" "}
          <em>&ldquo;what makes an asteroid &lsquo;potentially hazardous&rsquo; — NASA definition&rdquo;</em>. Because
          the target&rsquo;s definition (step 3) governs which features are real predictive work and which are just the
          definition in disguise. Ten minutes here saves ten hours of confused modelling later.
        </Callout>

        <h2>Doing it on our data</h2>
        <p>
          Running the routine on this dataset: the source is <strong>NASA</strong>&rsquo;s Center for Near-Earth Object
          Studies (published to Kaggle as <code>neo_v2.csv</code>). Each row is a recorded <em>close approach</em> of a
          near-Earth object. The target, <code>hazardous</code>, is NASA&rsquo;s official{" "}
          <strong>&ldquo;potentially hazardous&rdquo;</strong> designation — which, crucially, has a precise published
          definition we&rsquo;ll pin down on the next page. We&rsquo;ll confirm every column&rsquo;s units there too,
          and we&rsquo;ll immediately find that one part of the target&rsquo;s definition is sitting right in our
          feature list — and another part is missing entirely. That single fact will shape the whole project.
        </p>

        <TransferBox>
          Whatever your next dataset is — customer churn, tumour scans, loan defaults — run these five steps{" "}
          <em>before</em> any chart. The one that saves careers is step 3: <strong>how is the label defined?</strong>{" "}
          Half of all &ldquo;too good to be true&rdquo; models are just a feature that encodes the answer.
        </TransferBox>

        <PlaybookRule n={1}>
          Before forming opinions, research the domain: <strong>provenance → data dictionary → the target&rsquo;s
          official definition → plausibility of ranges → a written list of unknowns.</strong>
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone", label: <>← Overview &amp; goal</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/neo-field-guide", label: <>Next up · The NEO field guide →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
