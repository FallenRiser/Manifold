import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "The NEO field guide — Manifold",
  description:
    "What each column physically means — absolute magnitude as a size proxy (smaller H = bigger!), diameters derived from it, velocity and miss distance — and the target defined literally: NASA's PHA rule needs size AND orbit distance, but our data only has the size half.",
};

const SPACE = "var(--c-space)";

export default function NeoFieldGuidePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 1 · Frame the field", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>The NEO field guide</>}
        intro={<>
          Now we apply the routine: read every column like a local, then read the target&rsquo;s definition{" "}
          <em>literally</em>. That literal reading hands us the single most important fact in the whole project — and
          it&rsquo;s the kind of fact you only get by doing your homework first.
        </>}
      />

      <div className="lesson">
        <AnalystQuestion>
          What does each column physically mean — and does the target&rsquo;s official definition secretly depend on
          any of them?
        </AnalystQuestion>

        <h2>Reading the columns like a local</h2>
        <dl style={dl}>
          <div style={row}>
            <dt style={dt}><code>id</code>, <code>name</code></dt>
            <dd style={dd}>Identifiers for the object. Not predictive — but <strong>keep <code>id</code></strong>: we&rsquo;ll need it later to detect that the same object appears many times.</dd>
          </div>
          <div style={row}>
            <dt style={dt}><code>absolute_magnitude</code> (H)</dt>
            <dd style={dd}>
              Brightness on a fixed scale — a stand-in for <strong>size</strong>. The trap: the scale runs{" "}
              <em>backwards</em>. <strong>Smaller H = brighter = bigger.</strong> Roughly{" "}
              <M>{String.raw`D \propto 10^{-0.2H}`}</M>, so every drop of 5 in H means an object about 10× wider.
            </dd>
          </div>
          <div style={row}>
            <dt style={dt}><code>est_diameter_min</code> / <code>_max</code></dt>
            <dd style={dd}>Estimated diameter in km. These are <em>computed from</em> H (plus an albedo guess) — not independent measurements. A quiet hint we&rsquo;ll confirm later: they may carry no information H doesn&rsquo;t already have.</dd>
          </div>
          <div style={row}>
            <dt style={dt}><code>relative_velocity</code></dt>
            <dd style={dd}>Speed of the object relative to Earth at close approach, in <strong>km/h</strong>. Faster impactors carry more energy.</dd>
          </div>
          <div style={row}>
            <dt style={dt}><code>miss_distance</code></dt>
            <dd style={dd}>How far the object passed from Earth <em>on this approach</em>, in <strong>km</strong>. Note the wording: it&rsquo;s one approach&rsquo;s distance — not the closest the two orbits <em>ever</em> come. That distinction is about to matter a lot.</dd>
          </div>
          <div style={row}>
            <dt style={dt}><code>orbiting_body</code>, <code>sentry_object</code></dt>
            <dd style={dd}>What the object orbits, and whether it&rsquo;s on NASA&rsquo;s automated impact-monitoring list. Read them now, because in <em>this</em> file they turn out to never vary — a landmine for the next act.</dd>
          </div>
          <div style={row}>
            <dt style={dt}><code>hazardous</code> <span style={{ color: SPACE }}>(target)</span></dt>
            <dd style={dd}>NASA&rsquo;s &ldquo;potentially hazardous&rdquo; flag. Everything hinges on how this is defined — so let&rsquo;s read the definition, literally.</dd>
          </div>
        </dl>

        <h2>The target, defined literally</h2>
        <p>
          NASA designates an object a <strong>Potentially Hazardous Asteroid</strong> when <em>both</em> of these hold:
        </p>
        <ol style={ol}>
          <li>it is <strong>big enough</strong> — absolute magnitude <M>{String.raw`H \le 22`}</M> (roughly ≥ 140 m across); <strong>and</strong></li>
          <li>its orbit comes <strong>close enough</strong> — the minimum orbit intersection distance (<strong>MOID</strong>) ≤ 0.05 AU (about 7.5 million km).</li>
        </ol>
        <p>
          Two conditions — a <em>size</em> gate and an <em>orbit-distance</em> gate. Now line that up against our
          columns, and a project-defining fact falls out:
        </p>

        <Callout color={SPACE} title={<>The fact that shapes everything</>}>
          Our data contains the <strong>size</strong> half of the definition directly (that&rsquo;s{" "}
          <code>absolute_magnitude</code>) — so size will look <em>almost sufficient</em> to predict the label, because
          it literally <em>is</em> half the rule. But the <strong>orbit</strong> half is <strong>missing</strong>:{" "}
          <code>miss_distance</code> is one flyby&rsquo;s distance, <em>not</em> MOID (the closest the orbits ever get).
          So a model here can never perfectly reproduce the label — it must <em>proxy</em> the missing orbital
          condition using miss distance and velocity. Reading the definition told us, before any modelling, exactly
          where the easy signal is and where the real work lives.
        </Callout>

        <p>
          Hold onto this. It predicts the two things we&rsquo;ll spend the rest of the capstone proving: that a plain
          size threshold is a shockingly strong (but incomplete) predictor, and that the model&rsquo;s genuine job is
          the leftover — separating the hazardous from the harmless <em>among the big objects</em>.
        </p>

        <TransferBox>
          On any dataset, once you know how the label is defined you can sort features into <strong>gimmes</strong>
          (part of the definition — expect them to dominate) and <strong>real predictive work</strong>. If a feature is
          the <em>whole</em> definition, you may not have a modelling problem at all — just a lookup.
        </TransferBox>

        <PlaybookRule n={2}>
          Read the target&rsquo;s definition literally. A feature that helped <em>define</em> the label is a gimme (or
          outright leakage) — expect it to dominate, and measure your model by the <strong>lift beyond it</strong>.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/researching-the-field", label: <>← Researching an unfamiliar field</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/research-questions", label: <>Next up · Research questions &amp; hypotheses →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
const dl: React.CSSProperties = { margin: "0 0 8px", display: "grid", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(140px, 200px) 1fr", gap: 14, background: "var(--surface)", padding: "12px 15px" };
const dt: React.CSSProperties = { fontSize: 13.5, color: "var(--ink)", fontWeight: 500 };
const dd: React.CSSProperties = { margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 };
