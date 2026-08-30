import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { BP_TRACK, BP_TOTAL, BP_DONE } from "@/lib/backpropTrack";

export default function BackpropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={BP_TRACK}
          title="Backpropagation"
          accent="var(--c-neural)"
          done={BP_DONE}
          total={BP_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
