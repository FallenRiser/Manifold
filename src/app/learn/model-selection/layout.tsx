import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { MS_TRACK, MS_TOTAL, MS_DONE } from "@/lib/modelSelectionTrack";

export default function ModelSelectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={MS_TRACK}
          title="Model selection"
          accent="var(--c-metrics)"
          done={MS_DONE}
          total={MS_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
