import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { FA_TRACK, FA_TOTAL, FA_DONE } from "@/lib/functionApproximationTrack";

export default function FunctionApproximationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={FA_TRACK}
          title="Function approximation"
          accent="var(--c-rl)"
          done={FA_DONE}
          total={FA_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
