import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { ENV_TRACK, ENV_TOTAL, ENV_DONE } from "@/lib/envBuildingTrack";

export default function BuildingEnvironmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={ENV_TRACK}
          title="Building environments"
          accent="var(--c-rl)"
          done={ENV_DONE}
          total={ENV_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
