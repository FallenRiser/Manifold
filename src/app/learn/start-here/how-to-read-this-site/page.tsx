import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-fundamentals)";

export const metadata = {
  title: "How to read this site — Manifold",
  description: "Tracks, tiers, labs, checkpoints, runnable code — the furniture of Manifold, and how to get the most out of it.",
};

export default function HowToReadPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Start here", color: ACCENT }]}
        time="about 5 minutes"
        title={<>How to read this site</>}
        intro={<>
          Manifold has a few kinds of furniture you&rsquo;ll see on every page. Two minutes on
          what each one is for — and the one habit that makes all of them work.
        </>}
      />

      <div className="lesson">
        <h2>Tracks and tiers</h2>
        <p>
          Content is organised into <strong>tracks</strong> — one per method, like linear
          regression or k-means — each a sequence of short pages in the sidebar to your left.
          Within a track, material runs in <strong>tiers</strong>: intuition first (see it work
          with your hands), then practice (use it well — code, tuning, judgement), then theory
          (why it&rsquo;s guaranteed to work). You can stop at any tier and still leave with
          something whole. Most readers should ride a track in order; the tiers are why the later
          pages of a track feel very different from the early ones.
        </p>

        <h2>The interactive furniture</h2>
        <p>
          <strong>Labs</strong> are the draggable, clickable figures. They&rsquo;re not
          illustrations — they&rsquo;re the argument. Each one opens with a{" "}
          <em>Try this</em> suggestion and rewards you with an observation once you&rsquo;ve
          actually touched it. If you scroll past a lab without dragging anything, you&rsquo;ve
          skipped the paragraph that mattered most.
        </p>
        <p>
          <strong>Predict-first prompts</strong> ask you to commit to a guess before a lab or a
          result reveals the answer. They&rsquo;re deliberately never graded — the reveal is the
          lab itself. And <strong>checkpoints</strong> are short quizzes at the end of chapters.
          Both exist for the same reason: memory research is unambiguous that{" "}
          <em>retrieving</em> an answer — even a wrong one — beats re-reading every time. Guess
          badly and often; it&rsquo;s the mechanism, not a test.
        </p>
        <p>
          <strong>Code blocks</strong> usually come in two tabs — <em>from scratch</em> (NumPy,
          so you can see the machinery) and <em>with a library</em> (how you&rsquo;d write it at
          work). Many have a <em>Run</em> button that executes the code right in your browser,
          and an <em>Edit</em> button so you can change the code and run <em>your</em> version.
          Breaking the examples on purpose is an excellent way to learn.
        </p>

        <h2>The numbers are real</h2>
        <p>
          A quiet promise: when a page on this site reports a result — an R², a cross-validation
          score, a failure case — that number came from actually running the experiment, and the
          capstone pages ship the notebook and data so you can reproduce every figure yourself.
          Nothing is typeset to look plausible. If you ever catch a number that doesn&rsquo;t
          reproduce, that&rsquo;s a bug, not a rounding convention.
        </p>

        <Callout color={ACCENT} title={<>The one habit</>}>
          Predict before you reveal. Before dragging a slider, guess what will happen. Before
          running code, guess the output. Before a checkpoint answer, commit. Every feature of
          this site is built around that single move, because it&rsquo;s the difference between
          reading about ML and learning it.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/start-here/every-model-is-three-choices", label: <>← Every model is three choices</> }}
          next={{ href: "/learn/start-here/pick-your-path", label: <>Next up · Pick your path →</> }}
        />
      </div>
    </article>
  );
}
