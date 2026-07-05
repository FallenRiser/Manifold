import { PredictPrompt } from "@/components/PredictPrompt";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-fundamentals)";

export const metadata = {
  title: "The three kinds of learning — Manifold",
  description: "Supervised, unsupervised, and reinforcement learning — told apart by one question: what kind of feedback does the data give you?",
};

export default function ThreeKindsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Start here", color: ACCENT }, { label: "No prerequisites", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>The three kinds of learning</>}
        intro={<>
          Every ML method you&rsquo;ll ever meet belongs to one of three families. Telling them
          apart takes exactly one question: what kind of feedback does your data give you?
        </>}
      />

      <div className="lesson">
        <p>
          Last page you fit a line through house sales. Crucially, every dot came with the{" "}
          <em>answer attached</em> — you knew each house&rsquo;s real price, so you could measure
          how wrong your line was. That luxury of having the answers is what defines the first and
          biggest family.
        </p>

        <h2>Supervised learning — the answers come with the data</h2>
        <p>
          In <strong>supervised learning</strong> each training example is a pair: the input{" "}
          <em>and</em> the correct output, called the <strong>label</strong>. House features with
          the sale price. An email with &ldquo;spam&rdquo; or &ldquo;not spam.&rdquo; A photo with
          &ldquo;cat.&rdquo; The model proposes an answer, compares it against the label, and
          adjusts — the loop you ran by hand.
        </p>
        <p>
          It splits in two by what the answer looks like. If it&rsquo;s a <em>number</em> (a price,
          a temperature), that&rsquo;s <strong>regression</strong>. If it&rsquo;s a{" "}
          <em>category</em> (spam or not, cat or dog or horse), that&rsquo;s{" "}
          <strong>classification</strong>. Same family, different flavour of answer.
        </p>

        <h2>Unsupervised learning — no answers, find the structure</h2>
        <p>
          Now imagine a shop hands you 10,000 customer purchase histories and asks:{" "}
          <em>&ldquo;what kinds of customers do we have?&rdquo;</em> Nobody has labelled anyone a
          &ldquo;bargain hunter&rdquo; — there are no answers to check against.{" "}
          <strong>Unsupervised learning</strong> works on data like this: no labels, just the
          hope that the data has structure worth finding. Group similar customers together
          (<strong>clustering</strong>), or squeeze a hundred measurements down to the two that
          matter (<strong>dimensionality reduction</strong>).
        </p>
        <p>
          It&rsquo;s harder to know when you&rsquo;ve succeeded — with no answer key, &ldquo;did I
          find real groups or wishful thinking?&rdquo; becomes a genuine research question, and a
          big part of the k-Means track wrestles with exactly that.
        </p>

        <h2>Reinforcement learning — learn by acting</h2>
        <p>
          The third family has no dataset at all at the start. A <strong>reinforcement
          learning</strong> agent acts in a world — moves a chess piece, steers a simulated car —
          and gets back only a <strong>reward</strong>: occasional, often delayed, points. No one
          says what the right move <em>was</em>; the agent must work out which of its many past
          actions deserve credit for the reward that eventually arrived. This is how computers
          learned to beat world champions at Go.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Your bank flags card transactions as fraudulent or legitimate, trained on last year&rsquo;s confirmed fraud cases. Which family is that?</>}
          options={["Supervised — classification", "Unsupervised — clustering", "Reinforcement learning"]}
          nudge={<>Locked in. Ask the one question: did the training data come with answers attached? Confirmed fraud cases are labels — so it&rsquo;s supervised, and since the answer is a category, it&rsquo;s classification.</>}
        />

        <Callout color={ACCENT} title={<>The one-question test</>}>
          Answers attached to the data → <strong>supervised</strong>. No answers, find structure →{" "}
          <strong>unsupervised</strong>. Feedback arrives as rewards for actions →{" "}
          <strong>reinforcement</strong>. Nearly everything on Manifold — and most of ML in
          industry — lives in the first two.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/start-here", label: <>← You already do machine learning</> }}
          next={{ href: "/learn/start-here/every-model-is-three-choices", label: <>Next up · Every model is three choices →</> }}
        />
      </div>
    </article>
  );
}
