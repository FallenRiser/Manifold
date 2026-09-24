import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { SVM_TRACK, SVM_TOTAL, SVM_DONE } from "@/lib/svmTrack";

export default function SVMLayout({ children }: { children: React.ReactNode }) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={SVM_TRACK}
          title="Support vector machines"
          accent="var(--c-classification)"
          done={SVM_DONE}
          total={SVM_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
