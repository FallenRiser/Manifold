import { LineOfBestFitLab } from "@/components/labs/LineOfBestFitLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-fundamentals)";

export const metadata = {
  title: "You already do machine learning — Manifold",
  description: "No prerequisites, no maths. Fit a model with your hands in the first two minutes, and learn what machine learning actually is.",
};

export default function StartHerePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Start here", color: ACCENT }, { label: "No prerequisites", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>You already do machine learning</>}
        intro={<>
          Before a single definition or symbol, you&rsquo;re going to train a model with your
          hands. It takes about a minute, and afterwards the phrase &ldquo;machine learning&rdquo;
          will never sound mysterious again.
        </>}
      />

      <div className="lesson">
        <p>
          Say a friend asks what their house might sell for. You know it&rsquo;s a bit bigger than
          your cousin&rsquo;s place, which went for $310k, and a bit smaller than the one down the
          street that went for $400k. So you guess something in between — nudged toward the bigger
          one, because size clearly matters here.
        </p>
        <p>
          That guess used <em>data</em> (prices of houses you know), found a <em>pattern</em>{" "}
          (bigger tends to mean pricier), and applied it to a <em>new case</em>. That three-step
          move — data, pattern, prediction — is the whole of machine learning. Everything else on
          this site is about doing it carefully, at scale, and knowing when to trust the result.
        </p>

        <h2>Prove it to yourself</h2>
        <p>
          Below are twelve real house sales — size across, price up. There&rsquo;s a line you can
          grab by either end. Your job: tilt it until it follows the trend as well as you can
          manage. The number under the chart tells you how wrong the line currently is; make it as
          small as you can.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Before you touch it: when your line is as good as it can possibly be, what will the error read?</>}
          options={["Zero — a perfect line has no error", "Small, but never zero", "It depends on luck"]}
          nudge={<>Locked in. Now drag the line and try to get the error to zero.</>}
        />
        <LabFrame
          accent={ACCENT}
          tryThis={<>Drag either end of the line until the error readout is as small as you can get it. Then hit snap-to-best-fit and see how close you came.</>}
          insight={<>What you just did — propose a rule, measure how wrong it is, adjust, repeat — is <em>exactly</em> what
            a computer does when it &ldquo;learns.&rdquo; The only differences: it measures the error with a formula and
            adjusts a few million times a second. And notice the error never hit zero — real data has scatter no
            line can explain, and chasing it to zero is one of the classic ways models go wrong.</>}
        >
          <LineOfBestFitLab />
        </LabFrame>

        <h2>What you just did, in the official words</h2>
        <p>
          Machine learning has a reputation for jargon, so here&rsquo;s a dictionary for the last
          two minutes. The line you dragged is a <strong>model</strong> — a rule that turns an
          input (size) into a prediction (price). The twelve dots are <strong>training data</strong>.
          The number you were shrinking is the <strong>loss</strong> — a single score for how wrong
          the model currently is. And the adjust-and-check loop you ran by hand is{" "}
          <strong>training</strong>. When the computer runs that loop itself, we say it{" "}
          <em>learned</em> from the data.
        </p>
        <p>
          That&rsquo;s the honest core of the field. Not robots, not magic — a rule, a score for
          how wrong the rule is, and a procedure for making the score smaller.
        </p>

        <Callout color={ACCENT} title={<>Why start with a boring straight line?</>}>
          Because every model you&rsquo;ll ever meet — including the ones behind chatbots and
          image generators — is this same loop with a fancier rule. A neural network is
          &ldquo;a line&rdquo; with millions of knobs instead of two. Master the two-knob version
          and the million-knob version is a difference of degree, not of kind.
        </Callout>

        <PrevNext next={{ href: "/learn/start-here/three-kinds-of-learning", label: <>Next up · The three kinds of learning →</> }} />
      </div>
    </article>
  );
}
