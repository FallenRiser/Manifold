import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { PCA_TRACK, PCA_TOTAL, PCA_DONE } from "@/lib/pcaTrack";

export default function PcaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={PCA_TRACK}
          title="Principal component analysis"
          accent="var(--c-dimred)"
          done={PCA_DONE}
          total={PCA_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
