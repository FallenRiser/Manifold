import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { SVR_TRACK, SVR_TOTAL, SVR_DONE } from "@/lib/svrTrack";

export default function SVRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={SVR_TRACK}
          title="Support vector regression"
          accent="var(--c-regression)"
          done={SVR_DONE}
          total={SVR_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
