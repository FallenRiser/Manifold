import { TrackSidebar } from "@/components/TrackSidebar";
import { KNN_TRACK, KNN_TOTAL, KNN_DONE } from "@/lib/knnTrack";

export default function KNNLayout({
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
          track={KNN_TRACK}
          title="k-Nearest Neighbors"
          accent="var(--c-classification)"
          done={KNN_DONE}
          total={KNN_TOTAL}
        />
      </aside>
      <div style={{ maxWidth: 720 }}>{children}</div>
    </div>
  );
}
