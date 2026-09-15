import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { LOP_CAP_TRACK, LOP_CAP_TOTAL, LOP_CAP_DONE } from "@/lib/lopCapstoneTrack";

export default function LiesOfPCapstoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={LOP_CAP_TRACK}
          title="Learning to parry"
          accent="var(--c-krat)"
          done={LOP_CAP_DONE}
          total={LOP_CAP_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
