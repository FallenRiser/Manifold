import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { NB_TRACK, NB_TOTAL, NB_DONE } from "@/lib/naiveBayesTrack";

export default function NaiveBayesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={NB_TRACK}
          title="Naive Bayes"
          accent="var(--c-classification)"
          done={NB_DONE}
          total={NB_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
