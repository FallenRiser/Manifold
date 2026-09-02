import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { NB_DONE, NB_TOTAL } from "@/lib/naiveBayesTrack";

export const metadata = {
  title: "Naive Bayes — Manifold",
  description:
    "A generative classifier whose absurd independence assumption breaks its probabilities but usually not its decisions. Bayes' rule, the three flavours, smoothing, and the honest crossover against logistic regression.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "The generative idea",
    href: "/learn/naive-bayes/bayes-rule-as-a-classifier",
    blurb: "Model how each class generates data, then invert with Bayes' rule. The opposite move from logistic regression — and the reason it behaves so differently.",
    topics: "Bayes' rule · prior & likelihood · generative vs discriminative",
  },
  {
    name: "The naive assumption",
    href: "/learn/naive-bayes/conditional-independence",
    blurb: "Assume every feature is independent given the class. It is almost never true — yet the classifier works anyway. Why, exactly, is the heart of the track.",
    topics: "conditional independence · why naive · the decision survives",
  },
  {
    name: "The three flavours",
    href: "/learn/naive-bayes/gaussian-nb",
    blurb: "Gaussian for continuous features, Multinomial for counts, Bernoulli for presence. Each is the same idea with a different likelihood.",
    topics: "Gaussian · Multinomial · Bernoulli · choosing",
  },
  {
    name: "Making it work",
    href: "/learn/naive-bayes/laplace-smoothing",
    blurb: "The engineering that turns the idea into a working text classifier: smoothing away zeros, scoring in log-space, and knowing not to trust the probabilities.",
    topics: "Laplace smoothing · log-space · text · calibration",
  },
  {
    name: "Where it stands",
    href: "/learn/naive-bayes/vs-logistic-regression",
    blurb: "The measured crossover against logistic regression, the linear classifier hiding inside, and when Naive Bayes is genuinely the right call.",
    topics: "vs logistic regression · the linear form · when to use it · playbook",
  },
];

export default function NaiveBayesHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: NB_DONE >= NB_TOTAL ? `Complete · ${NB_TOTAL} pages` : `${NB_DONE} of ${NB_TOTAL} pages`, color: TEAL },
        ]}
        time="the generative front door"
        title={<>The classifier that is <em>wrong on purpose</em></>}
        intro={<>Naive Bayes assumes something absurd — that every feature is independent of every
          other, given the class. In real data that is almost never true. And yet it remains one of the
          fastest, most reliable classifiers we have, especially for text. The resolution of that paradox
          is the whole point of this track: <strong>a broken model of the probabilities can still make
          the right decision.</strong></>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this track rests on</h2>
        <p>
          <strong>Naive Bayes is a generative classifier whose absurd independence assumption breaks its
          probabilities but usually not its decisions.</strong> Classification under zero-one loss only
          needs the <em>argmax</em> to be right — which class scores highest — not the actual value of the
          probability itself. A model can be wildly overconfident, miscalibrated, double-counting its own
          evidence, and still put the decision boundary in very nearly the right place.
        </p>
        <p>
          This track measures exactly that. Duplicate a network of correlated features and Naive Bayes&rsquo;
          accuracy stays pinned at <strong>0.975</strong> while its confidence climbs to <strong>1.000</strong>{" "}
          and its log-loss quadruples from 0.186 to <strong>0.756</strong>. Against logistic regression it{" "}
          <strong>wins with little data and loses with lots</strong> — a crossover near 400 training points.
          On text it is a one-pass counting classifier that still beats iterative logistic regression
          (0.768 vs 0.755).
        </p>

        <Callout color={TEAL} title={<>The version of this you can check</>}>
          Every number here comes from <code>scripts/naive_bayes_cases.py</code>, run on python 3.13 /
          sklearn 1.8 / numpy 2.3, offline (the text corpus is synthetic and reproducible). That includes
          the uncomfortable findings: Naive Bayes is <em>badly</em> calibrated (ECE 0.116 vs logistic
          regression&rsquo;s 0.035 at nearly equal accuracy), and without smoothing a single unseen word
          collapses it to barely-above-chance.
        </Callout>

        <h2>The five chapters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {CHAPTERS.map((c) => (
            <Link key={c.name} href={c.href} className="gcard" style={{ ["--accent" as string]: TEAL, display: "block", textDecoration: "none", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15.5, fontWeight: 500, color: TEAL, marginBottom: 4 }}>{c.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 8px" }}>{c.blurb}</p>
              <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>{c.topics}</div>
            </Link>
          ))}
        </div>

        <h2>What you should already have</h2>
        <p>
          <Link href="/learn/math-foundations/random-variables" style={link}>Probability</Link> — conditional
          probability and Bayes&rsquo; rule are the entire engine here.{" "}
          <Link href="/learn/logistic-regression" style={link}>Logistic regression</Link> for the
          discriminative twin this track is measured against; the crossover between them is one of the most
          useful facts in applied classification.{" "}
          <Link href="/learn/evaluation/calibration" style={link}>Calibration</Link> for what it means for a
          probability to be trustworthy — a bar Naive Bayes conspicuously fails.
        </p>

        <h2>Where it goes next</h2>
        <p>
          Naive Bayes is the generative corner of the <Link href="/map" style={link}>Classification family</Link>.
          Its discriminative counterpart is logistic regression; its geometric cousins are{" "}
          <Link href="/learn/k-nearest-neighbors" style={link}>k-NN</Link> and (soon) SVMs. The last chapter
          places it among them and hands you a playbook for when its speed and small-data strength make it
          the right first model.
        </p>

        <PrevNext
          prev={{ href: "/learn/k-nearest-neighbors", label: <>← k-Nearest Neighbors</> }}
          next={{ href: "/learn/naive-bayes/bayes-rule-as-a-classifier", label: <>Start · Bayes&rsquo; rule as a classifier →</> }}
        />
      </div>
    </article>
  );
}
