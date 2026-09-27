import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { ROUTING_TRACK, ROUTING_TOTAL, ROUTING_DONE } from "@/lib/routingCapstoneTrack";

export default function RoutingCapstoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={ROUTING_TRACK}
          title="Message-routing capstone"
          accent="var(--c-post)"
          done={ROUTING_DONE}
          total={ROUTING_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
