import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LT_DONE, LT_TOTAL } from "@/lib/learningTheoryTrack";

export const metadata = {
  title: "Learning theory — Manifold",
  description:
    "Why does a model that fits the data you have say anything about the data you don't? The Tier-3 track behind that question: risk and the generalization gap, no free lunch, PAC learnability, VC dimension and Rademacher complexity, margins, algorithmic stability, and the honest place where the classical bounds stop working.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "Generalization: the central question",
    href: "/learn/learning-theory/risk-and-empirical-risk",
    blurb: "What we actually want, what we can actually measure, and the gap between them that everything else is about.",
    topics: "risk · empirical risk · the gap · no free lunch · the union bound · finite classes",
  },
  {
    name: "The PAC framework",
    href: "/learn/learning-theory/pac-learnability",
    blurb: "The definition that made \"this algorithm learns\" a provable statement rather than a hope.",
    topics: "probably approximately correct · sample complexity · agnostic PAC · ERM",
  },
  {
    name: "Measuring capacity",
    href: "/learn/learning-theory/when-counting-fails",
    blurb: "Counting hypotheses breaks the moment a class is infinite. What replaces it — and what it says about the models you actually use.",
    topics: "shattering · VC dimension · growth function · Sauer's lemma · the VC bound · Rademacher complexity",
  },
  {
    name: "Margins: capacity you can control",
    href: "/learn/learning-theory/margins",
    blurb: "Two classifiers can agree on every training label and still deserve different amounts of trust. Margins say why.",
    topics: "the margin · margin bounds · boosting's missing overfit",
  },
  {
    name: "Stability & where the theory ends",
    href: "/learn/learning-theory/algorithmic-stability",
    blurb: "A completely different route to a guarantee — and an honest accounting of what modern deep networks broke.",
    topics: "algorithmic stability · stability ⇒ generalization · vacuous bounds · double descent",
  },
];

export default function LearningTheoryHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Learning theory", color: GRAY },
          { label: LT_DONE >= LT_TOTAL ? `Complete · ${LT_TOTAL} pages` : `${LT_DONE} of ${LT_TOTAL} pages`, color: GRAY },
          { label: "Tier 3 · theory", color: GRAY },
        ]}
        time="a foundations track"
        title={<>Why does learning work <em>at all</em>?</>}
        intro={<>You fit a model on a few thousand examples. Then you show it something it has never seen and expect
          it to be right. Nothing about fitting the first set logically forces anything about the second — and yet it
          works, reliably, every day. This track is the mathematics of that leap: what has to be true for it to
          work, how much data it takes, and exactly when the promise runs out.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The question, stated once</h2>
        <p>
          Every other track on this site teaches you to make training error small. This one asks the uncomfortable
          follow-up: <em>so what?</em> Training error is a number about data you already have. The number you care
          about — how often the model is wrong on the next customer, the next scan, the next asteroid — is about data
          that doesn&rsquo;t exist yet. Learning theory is the study of the bridge between them, and its central
          object is the distance across:
        </p>
        <p style={{ textAlign: "center", fontSize: 15.5, color: "var(--ink)", margin: "1.1rem 0 1.3rem" }}>
          <M>{String.raw`\underbrace{R(h)}_{\text{what you want}} \;\le\; \underbrace{\hat R(h)}_{\text{what you measure}} \;+\; \underbrace{\text{(a gap)}}_{\text{what theory bounds}}`}</M>
        </p>
        <p>
          Almost every result in this track is a way of filling in that third term. They differ in what they charge
          you for: the <em>number</em> of hypotheses you considered, the <em>richness</em> of the class they came
          from, the <em>margin</em> by which you got the training labels right, or the <em>sensitivity</em> of your
          algorithm to a single swapped example. Four accounting systems, one debt.
        </p>

        <Callout color={GRAY} title={<>This is Tier 3 — opt-in, never a gate</>}>
          You can use every model on Manifold without reading a line of this track, and plenty of excellent
          practitioners do. Read it when you want to know <em>why</em> the habits you&rsquo;ve been taught are the
          right ones — why a held-out set has to be held out, why more parameters aren&rsquo;t automatically worse,
          why the maximum-margin separator is the one worth finding. Each page keeps the main thread readable and
          folds the complete derivation into a <strong>&ldquo;Go deeper&rdquo;</strong> aside you can leave closed.
        </Callout>

        <h2>What you should already have</h2>
        <p>
          One prerequisite does real work here: <strong>concentration</strong>. The whole track is built on the fact
          that an average of <M>n</M> independent bounded terms sticks close to its expectation, with a failure
          probability that shrinks <em>exponentially</em> in <M>n</M>. If{" "}
          <Link href="/learn/math-foundations/hoeffding" style={link}>Hoeffding&rsquo;s inequality</Link> is new to
          you, read that page first — the{" "}
          <Link href="/learn/math-foundations/markov-chebyshev" style={link}>concentration strand</Link> of the math
          foundations track was written as the machinery for exactly these pages. Beyond that you need comfort with{" "}
          <Link href="/learn/math-foundations/random-variables" style={link}>probability notation</Link> and nothing
          more exotic than a supremum.
        </p>

        <h2>The five chapters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {CHAPTERS.map((c) => (
            <Link key={c.name} href={c.href} className="gcard" style={{ ["--accent" as string]: GRAY, display: "block", textDecoration: "none", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15.5, fontWeight: 500, color: GRAY, marginBottom: 4 }}>{c.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 8px" }}>{c.blurb}</p>
              <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>{c.topics}</div>
            </Link>
          ))}
        </div>

        <h2>An honest warning about what&rsquo;s coming</h2>
        <p>
          Most treatments of this material quietly skip the punchline, so here it is up front: for the models people
          actually deploy, <strong>the classical bounds in this track are usually far too loose to use as numbers</strong>.
          A VC bound for a modest neural network can &ldquo;guarantee&rdquo; an error rate above 1, which is a way of
          guaranteeing nothing at all. That is not a reason to skip the theory — it is the most interesting thing
          about it. The bounds are wrong as predictions and right as <em>explanations</em>: they tell you which knob
          controls generalization, in which direction, and why. The final chapter faces the failure directly, up to
          and including{" "}
          <Link href="/learn/learning-theory/when-the-bounds-break" style={link}>double descent</Link>, where the
          textbook U-curve simply stops being the shape of reality.
        </p>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/learning-theory/risk-and-empirical-risk", label: <>Start · Risk, empirical risk &amp; the gap →</> }}
        />
      </div>
    </article>
  );
}
