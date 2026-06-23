import { TrackSidebar } from "@/components/TrackSidebar";
import { KM_TRACK, KM_TOTAL, KM_DONE } from "@/lib/kMeansTrack";

export default function KMeansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "32px 24px 96px",
        display: "grid",
        gridTemplateColumns: "210px minmax(0, 1fr)",
        gap: 40,
        alignItems: "start",
      }}
      className="lesson-shell"
    >
      <aside
        style={{
          position: "sticky",
          top: 76,
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 12px",
        }}
        className="lesson-aside"
      >
        <TrackSidebar
          track={KM_TRACK}
          title="k-Means clustering"
          accent="var(--c-clustering)"
          done={KM_DONE}
          total={KM_TOTAL}
        />
      </aside>
      <div style={{ maxWidth: 720 }}>{children}</div>
    </div>
  );
}
