import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { NEO_TRACK, NEO_TOTAL, NEO_DONE } from "@/lib/neoCapstoneTrack";

export default function NeoCapstoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={NEO_TRACK}
          title="Asteroid-hazard capstone"
          accent="var(--c-space)"
          done={NEO_DONE}
          total={NEO_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
