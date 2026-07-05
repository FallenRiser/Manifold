import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { KNN_TRACK, KNN_TOTAL, KNN_DONE } from "@/lib/knnTrack";

export default function KNNLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={KNN_TRACK}
          title="k-Nearest Neighbors"
          accent="var(--c-classification)"
          done={KNN_DONE}
          total={KNN_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
