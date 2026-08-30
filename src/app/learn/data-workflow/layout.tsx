import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { DW_TRACK, DW_TOTAL, DW_DONE } from "@/lib/dataWorkflowTrack";

export default function DataWorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={DW_TRACK}
          title="The data workflow"
          accent="var(--c-metrics)"
          done={DW_DONE}
          total={DW_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
