import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { DECISION_TREES_TRACK, DECISION_TREES_TOTAL, DECISION_TREES_DONE } from "@/lib/decisionTreesTrack";

export default function DecisionTreesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={DECISION_TREES_TRACK}
          title="Decision trees"
          accent="var(--c-trees)"
          done={DECISION_TREES_DONE}
          total={DECISION_TREES_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
