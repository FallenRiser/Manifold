import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { KRR_TRACK, KRR_TOTAL, KRR_DONE } from "@/lib/kernelRidgeTrack";

export default function KernelRidgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={KRR_TRACK}
          title="Kernel ridge regression"
          accent="var(--c-regression)"
          done={KRR_DONE}
          total={KRR_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
