import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { RL_CAP_TRACK, RL_CAP_TOTAL, RL_CAP_DONE } from "@/lib/rlCapstoneTrack";

export default function WarehouseRobotCapstoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={RL_CAP_TRACK}
          title="Warehouse-robot capstone"
          accent="var(--c-warehouse)"
          done={RL_CAP_DONE}
          total={RL_CAP_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
