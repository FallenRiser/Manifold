import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The workflow is a loop — Manifold",
  description:
    "Tutorials present the machine-learning workflow as seven steps in a row. In practice it is a loop, and knowing which arrow to take back is the skill that separates a stalled project from a finished one.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static, server-rendered figure: the seven stages on a ring, with the three
// back-edges that the linear presentation leaves out. All coordinates are
// literal numbers, so there is no hydration surface here at all.
const STAGES = ["Frame", "Explore", "Clean", "Features", "Baseline", "Diagnose", "Ship"];

// All three back-edges leave from Diagnose, which is the page's argument: the
// diagnosis is what tells you which stage to return to. Nested at increasing
// depths so no two labels can ever share a y, and each vertical drop is offset
// by a few pixels so the three do not stack into one line.
const BACKS: [number, string, number][] = [
  [3, "needs more to work with", 18],
  [2, "the data is wrong", 40],
  [0, "the question is wrong", 62],
];

function LoopFigure() {
  const W = 560, H = 152;
  const bw = 62, gap = (W - 24 - STAGES.length * bw) / (STAGES.length - 1);
  const x = (i: number) => 12 + i * (bw + gap);
  const cy = 30;
  const FROM = 5; // Diagnose

  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="The seven workflow stages in a row — frame, explore, clean, features, baseline, diagnose, ship — with three dashed arrows running back from diagnose to baseline, to clean, and to frame"
      >
        {STAGES.map((label, i) => (
          <g key={label}>
            {i > 0 && (
              <line x1={x(i) - gap + 3} y1={cy} x2={x(i) - 4} y2={cy} stroke="var(--border-strong)" strokeWidth={1.5} />
            )}
            <rect x={x(i)} y={cy - 15} width={bw} height={30} rx={8} fill="var(--surface)" stroke="var(--border-strong)" />
            <text x={x(i) + bw / 2} y={cy + 4} fontSize={11} fill="var(--ink)" textAnchor="middle" className="font-display">{label}</text>
          </g>
        ))}
        {BACKS.map(([to, label, dy], k) => {
          const xf = x(FROM) + bw / 2 + (k - 1) * 4;
          const xt = x(to) + bw / 2;
          const yb = cy + 15 + dy;
          return (
            <g key={label}>
              <path
                d={`M ${xf} ${cy + 16} L ${xf} ${yb} L ${xt} ${yb} L ${xt} ${cy + 16}`}
                fill="none"
                stroke={GRAY}
                strokeWidth={1.4}
                strokeDasharray="4 3"
                opacity={0.75}
              />
              <path d={`M ${xt - 3.5} ${cy + 21} L ${xt} ${cy + 16} L ${xt + 3.5} ${cy + 21}`} fill="none" stroke={GRAY} strokeWidth={1.4} />
              <text x={(xf + xt) / 2} y={yb - 4} fontSize={9} fill={GRAY} textAnchor="middle">{label}</text>
            </g>
          );
        })}
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        The solid arrows are the tutorial. The dashed ones are the job — and all three leave from the same place.
      </figcaption>
    </figure>
  );
}

export default function TheLoopPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Before you model", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 6 minutes"
        title={<>The workflow is a loop</>}
        intro={<>Every tutorial draws it as an arrow: load, clean, split, fit, evaluate, done. That picture is not
          wrong so much as it is a photograph of one lap — and it leaves out the only part that requires
          judgement.</>}
      />

      <div className="lesson">
        <h2>The seven stages, and the arrows nobody draws</h2>
        <p>
          Frame the problem. Explore the data. Clean it. Build features. Get a baseline. Diagnose what went wrong.
          Ship it. That sequence is real and the order genuinely matters — you cannot sensibly clean data before
          you know what you are predicting.
        </p>
        <LoopFigure />
        <p>
          But nobody does one lap. You get a baseline, look at the errors, and discover that a quarter of your rows
          have a timestamp in the future. You go back to cleaning. You fix that, get a better score, look again,
          and realise the thing you are predicting is not the thing anyone will act on. You go back to framing —
          and everything downstream of it is now scrap.
        </p>
        <p>
          <strong>The skill this pillar teaches is not the stages. It is which arrow to take back.</strong> A
          project that is stuck is almost always a project where someone is looping in the wrong place: tuning
          hyperparameters when the label is wrong, collecting data when the model is capped, engineering features
          when a fifth of the target column is missing.
        </p>

        <Callout color={GRAY} title={<>Why the linear picture is worse than merely incomplete</>}>
          A linear workflow makes going backwards feel like failure — like admitting the last three days were
          wasted. So people don&rsquo;t. They stay in the last stage they reached, turning the knobs that stage
          offers, because forward motion feels like progress. <strong>The most expensive habit in applied machine
          learning is continuing to optimise inside a stage whose inputs are broken.</strong>
        </Callout>

        <h2>Each lap should cost less than the last</h2>
        <p>
          The counter-argument to looping is that it sounds slow. It is the opposite, provided you make the first
          lap deliberately cheap. Frame roughly, look at the data for twenty minutes, clean only what obviously
          needs it, skip features entirely, fit something dumb, and look hard at what it got wrong. That lap can
          take an afternoon, and it tells you which stage the difficulty actually lives in — which is information
          you cannot get by thinking harder about stage one.
        </p>
        <p>
          This is why{" "}
          <Link href="/learn/data-workflow/start-with-a-baseline" style={link}>starting with a baseline</Link> is
          not a formality. The baseline is not there to be good; it is there to complete the circuit so that the
          diagnosis stage can start telling you things.
        </p>

        <h2>What each lap is for</h2>
        <ul>
          <li><strong>Lap one — is this problem well-posed?</strong> A dumb model end to end. You are looking for
            broken framing, impossible values, and a split that does not simulate deployment. Score is nearly
            irrelevant here.</li>
          <li><strong>Lap two — where is the difficulty?</strong> A reasonable model and honest error analysis.
            You are deciding whether you are short on data, short on features, short on capacity, or short on a
            usable label.</li>
          <li><strong>Lap three — is this good enough to ship?</strong> Now tuning is a defensible use of your
            time, because you know the ceiling you are pushing against is a real one.</li>
        </ul>
        <p>
          Most people spend lap one doing lap three&rsquo;s work. That is the mistake this whole pillar is trying
          to prevent.
        </p>

        <Quiz
          accent={GRAY}
          title="Checkpoint"
          questions={[
            {
              q: <>Your first model scores poorly. What is the single most useful next action?</>,
              options: [
                "Try three more model families and compare",
                "Look at the specific rows it got wrong",
                "Tune the hyperparameters of the model you have",
              ],
              answer: 1,
              explain: <>Looking at the errors is the only action that tells you <em>which arrow to take back</em>. The other two both assume the difficulty is in the model — which is one hypothesis out of five, and usually not the right one. Swapping model families is a reasonable lap-two move, but only after the errors have told you that capacity is the constraint.</>,
            },
            {
              q: <>Why make the first lap deliberately cheap rather than doing each stage properly the first time?</>,
              options: [
                "Because good work isn't necessary until the end",
                "Because you don't yet know which stage the difficulty is in, and finishing the loop is what tells you",
                "Because fast iteration is always better than careful work",
              ],
              answer: 1,
              explain: <>Effort spent in a stage is only well spent if that stage is the binding constraint, and you cannot know which one is until you have been all the way round once. A cheap first lap is not sloppiness — it is buying the information that tells you where to be careful.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow", label: <>← The data workflow</> }}
          next={{ href: "/learn/data-workflow/what-question-are-you-answering", label: <>Next up · What question are you answering? →</> }}
        />
      </div>
    </article>
  );
}
