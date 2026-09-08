import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { PLANNING_TRACK, PLANNING_TOTAL, PLANNING_DONE } from "@/lib/planningTrack";

export default function PlanningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={PLANNING_TRACK}
          title="Planning"
          accent="var(--c-rl)"
          done={PLANNING_DONE}
          total={PLANNING_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
