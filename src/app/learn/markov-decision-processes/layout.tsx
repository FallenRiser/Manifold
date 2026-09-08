import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { MDP_TRACK, MDP_TOTAL, MDP_DONE } from "@/lib/mdpTrack";

export default function MdpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={MDP_TRACK}
          title="Markov decision processes"
          accent="var(--c-rl)"
          done={MDP_DONE}
          total={MDP_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
