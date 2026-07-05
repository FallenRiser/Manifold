import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { LOG_TRACK, LOG_TOTAL, LOG_DONE } from "@/lib/logisticRegressionTrack";

export default function LogisticRegressionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={LOG_TRACK}
          title="Logistic regression"
          accent="var(--c-classification)"
          done={LOG_DONE}
          total={LOG_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
