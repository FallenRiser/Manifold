import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Limits: what the model can never know — Manifold",
  description:
    "The honest close: naming what this model structurally cannot do. Its label is defined partly by MOID — the minimum orbit intersection distance — which our data does not contain, so the forest can only proxy it with a single flyby's miss distance. That missing half is why PR-AUC plateaus at ~0.48, and no model on these features will fix it.",
};

const SPACE = "var(--c-space)";

export default function LimitsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 6 · Interpret & hand off", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Limits: what the model can never know</>}
        intro={<>
          A trustworthy write-up spends as much care on what a model <em>can&rsquo;t</em> do as on what it can. These
          limits aren&rsquo;t failures to hide — they&rsquo;re the boundary of honest use, and naming them is what
          separates a result you can stake your name on from a number you got lucky with.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          What can this model <em>structurally</em> never know — and where would it fail if someone deployed it
          naively?
        </AnalystQuestion>

        <h2>The move: trace the limits back to the data, not the algorithm</h2>
        <p>
          The deepest limits of a model usually live in the <em>data</em>, not the choice of algorithm — so the way to
          find them is to return to the target&rsquo;s definition and ask which parts of it the features can and cannot
          express. We did that reading in the field guide; now we cash it out as the ceiling on what any model here can
          achieve.
        </p>

        <Callout color={SPACE} title={<>The missing half of the label — MOID</>}>
          NASA&rsquo;s hazard flag requires <em>both</em> a size condition (<M>{String.raw`H \le 22`}</M>) <strong>and</strong>{" "}
          an orbit-closeness condition (MOID <M>{String.raw`\le 0.05`}</M> AU) — the minimum distance the two orbits ever
          come, over all time. Our data contains the size half directly, but <strong>MOID is absent</strong>. The forest
          substitutes <code>miss_distance</code> — the distance of <em>one</em> flyby — which is a noisy proxy: an object
          can pass far on the approach we recorded yet have an orbit that comes dangerously close on another. No model
          built on these columns can recover the true MOID, so <strong>no model here can perfectly reproduce the
          label</strong>. That is a data limit, not a modelling one — a bigger network or more trees cannot fix it.
        </Callout>

        <h2>Why the score plateaued exactly where it did</h2>
        <p>
          This single fact explains the shape of the whole modelling act. Among big objects (<M>{String.raw`H \le 22`}</M>),
          only 30% are hazardous — the other 70% are big <em>and</em> orbit far enough to be safe, a distinction that{" "}
          <em>lives in the MOID we don&rsquo;t have</em>. So the forest and boosting converging at PR-AUC ≈ 0.48
          isn&rsquo;t two models running out of talent; it&rsquo;s two models hitting the <strong>information ceiling of
          the features</strong>. The honest ceiling of this dataset is roughly where we landed, and the way to break it
          is more <em>data</em> (obtain MOID, orbital elements), not more <em>model</em>.
        </p>

        <h2>The other honest caveats</h2>
        <ul style={ul}>
          <li>
            <strong>Scope, not the universe.</strong> The dead columns told us this file is <em>Earth-approaching</em>{" "}
            objects, none on the automated impact-monitor. The model knows nothing outside that slice — it can&rsquo;t
            speak to objects it never saw.
          </li>
          <li>
            <strong>A snapshot in time.</strong> Each row is one recorded approach. Orbits evolve and new objects are
            discovered constantly; a model trained on today&rsquo;s catalogue will drift and needs periodic retraining.
          </li>
          <li>
            <strong>The label is a human definition, and it can change.</strong> &ldquo;Potentially hazardous&rdquo; is a
            NASA threshold, not a law of nature. If the thresholds are revised, the target shifts under the model.
          </li>
          <li>
            <strong>Correlation, not causation.</strong> The model ranks risk; it does not model impact physics. It is a
            triage tool to prioritise human attention, not an oracle that decides an object&rsquo;s fate.
          </li>
        </ul>

        <p>
          None of this diminishes the result — it <em>frames</em> it. We have an honest, interpretable triage model that
          reaches the ceiling its data allows, and we can say precisely what would raise that ceiling. That sentence is
          worth more to a decision-maker than a bigger number with no boundary on it.
        </p>

        <TransferBox>
          For any model, write down what it structurally cannot know before you ship it: which part of the label the
          features can&rsquo;t express, what population it never saw, how it will drift, and whether the target
          definition could change. Trace each limit to its cause in the <em>data</em>. A model sold without its limits is
          a liability; a model delivered <em>with</em> them is a tool someone can use responsibly.
        </TransferBox>

        <PlaybookRule n={20}>
          <strong>Name the limits, and trace them to the data.</strong> State what the model can&rsquo;t know (missing
          label components, unseen populations, drift, mutable definitions) — a plateau usually means an information
          ceiling in the features, which more data fixes and more model does not.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/interpretation", label: <>← Interpretation</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/takeaways", label: <>Next up · Verdict, playbook &amp; notebook →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
