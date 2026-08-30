import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { PM_TRACK, PM_TOTAL, PM_DONE } from "@/lib/perceptronMlpTrack";

export default function PerceptronMlpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={PM_TRACK}
          title="Perceptron → MLP"
          accent="var(--c-neural)"
          done={PM_DONE}
          total={PM_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
