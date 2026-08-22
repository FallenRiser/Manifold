import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { BOOSTING_TRACK, BOOSTING_TOTAL, BOOSTING_DONE } from "@/lib/boostingTrack";

export default function BoostingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={BOOSTING_TRACK}
          title="Boosting"
          accent="var(--c-trees)"
          done={BOOSTING_DONE}
          total={BOOSTING_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
