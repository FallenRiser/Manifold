import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { KM_TRACK, KM_TOTAL, KM_DONE } from "@/lib/kMeansTrack";

export default function KMeansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={KM_TRACK}
          title="k-Means clustering"
          accent="var(--c-clustering)"
          done={KM_DONE}
          total={KM_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
