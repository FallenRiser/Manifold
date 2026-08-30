import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { ACT_TRACK, ACT_TOTAL, ACT_DONE } from "@/lib/activationsTrack";

export default function ActivationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={ACT_TRACK}
          title="Activation functions"
          accent="var(--c-neural)"
          done={ACT_DONE}
          total={ACT_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
