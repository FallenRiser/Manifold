import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { LT_TRACK, LT_TOTAL, LT_DONE } from "@/lib/learningTheoryTrack";

export default function LearningTheoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={LT_TRACK}
          title="Learning theory"
          accent="var(--c-metrics)"
          done={LT_DONE}
          total={LT_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
