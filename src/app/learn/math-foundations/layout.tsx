import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { MF_TRACK, MF_TOTAL, MF_DONE } from "@/lib/mathFoundationsTrack";

export default function MathFoundationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={MF_TRACK}
          title="Math foundations"
          accent="var(--c-fundamentals)"
          done={MF_DONE}
          total={MF_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
