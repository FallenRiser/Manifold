import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { REG_NN_TRACK, REG_NN_TOTAL, REG_NN_DONE } from "@/lib/regularisationTrack";

export default function RegularisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={REG_NN_TRACK}
          title="Regularisation"
          accent="var(--c-neural)"
          done={REG_NN_DONE}
          total={REG_NN_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
