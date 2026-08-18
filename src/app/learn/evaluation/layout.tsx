import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { EVAL_TRACK, EVAL_TOTAL, EVAL_DONE } from "@/lib/evaluationTrack";

export default function EvaluationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={EVAL_TRACK}
          title="Evaluation & metrics"
          accent="var(--c-metrics)"
          done={EVAL_DONE}
          total={EVAL_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
