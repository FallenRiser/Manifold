import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { LEARNING_TRACK, LEARNING_TOTAL, LEARNING_DONE } from "@/lib/learningTrack";

export default function LearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={LEARNING_TRACK}
          title="Learning"
          accent="var(--c-rl)"
          done={LEARNING_DONE}
          total={LEARNING_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
