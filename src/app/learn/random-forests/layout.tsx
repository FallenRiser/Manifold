import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { RANDOM_FORESTS_TRACK, RANDOM_FORESTS_TOTAL, RANDOM_FORESTS_DONE } from "@/lib/randomForestsTrack";

export default function RandomForestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={RANDOM_FORESTS_TRACK}
          title="Bagging & random forests"
          accent="var(--c-trees)"
          done={RANDOM_FORESTS_DONE}
          total={RANDOM_FORESTS_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
