import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { CAP_TRACK, CAP_TOTAL, CAP_DONE } from "@/lib/housingCapstoneTrack";

export default function HousingCapstoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={CAP_TRACK}
          title="Housing capstone"
          accent="var(--c-regression)"
          done={CAP_DONE}
          total={CAP_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
