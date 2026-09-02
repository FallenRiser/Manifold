import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { INIT_TRACK, INIT_TOTAL, INIT_DONE } from "@/lib/initNormTrack";

export default function InitNormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={INIT_TRACK}
          title="Initialisation & normalisation"
          accent="var(--c-neural)"
          done={INIT_DONE}
          total={INIT_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
