import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { REG_TRACK, REG_TOTAL, REG_DONE } from "@/lib/regularizationTrack";

export default function RegularizedRegressionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={REG_TRACK}
          title="Regularized regression"
          accent="var(--c-regression)"
          done={REG_DONE}
          total={REG_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
