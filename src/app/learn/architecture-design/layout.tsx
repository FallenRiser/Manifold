import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { ARCH_TRACK, ARCH_TOTAL, ARCH_DONE } from "@/lib/architectureTrack";

export default function ArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={ARCH_TRACK}
          title="Architecture design"
          accent="var(--c-neural)"
          done={ARCH_DONE}
          total={ARCH_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
