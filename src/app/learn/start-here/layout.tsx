import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { START_TRACK, START_TOTAL, START_DONE } from "@/lib/startHereTrack";

export default function StartHereLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={START_TRACK}
          title="Start here"
          accent="var(--c-fundamentals)"
          done={START_DONE}
          total={START_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
