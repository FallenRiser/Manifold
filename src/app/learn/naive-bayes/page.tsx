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
        <h2>The idea this track rests on</h2>
        <p>
          Naive Bayes makes one deliberately simple assumption: that once you know the class, the features
          carry no information about each other. That is rarely true, and it does distort the probabilities
          the model reports. But <strong>a distorted probability and a wrong decision are not the same
          thing.</strong> Classification under zero-one loss only needs the <em>argmax</em> to be right —
          which class scores highest — not the exact probability attached to it. A model can be overconfident
          and double-count its own evidence and still place the boundary in very nearly the right spot. That
          gap between broken probabilities and intact decisions is what this track is about.
        </p>
        <p>
          And we hold it to the numbers. Duplicate a whole block of correlated features and Naive
          Bayes&rsquo; accuracy stays pinned at <strong>0.975</strong> while its confidence climbs to{" "}
          <strong>1.000</strong> and its log-loss quadruples from 0.186 to <strong>0.756</strong>. Against
          logistic regression it <strong>wins with little data and loses with lots</strong> — a crossover
          near 400 training points. On text it is a one-pass counting classifier that still edges out
          iterative logistic regression (0.768 vs 0.755).
        </p>

        <Callout color={TEAL} title={<>The uncomfortable findings, kept in</>}>
          Every number in this track is measured, not asserted — including the ones that do not flatter the
          method. Naive Bayes is <em>badly</em> calibrated (expected calibration error 0.116 versus logistic
          regression&rsquo;s 0.035 at nearly equal accuracy), and without smoothing a single unseen word
          collapses it to barely above chance. Both are shown in full rather than smoothed over.
        </Callout>

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
