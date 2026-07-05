import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";
import { POLY_TRACK, POLY_TOTAL, POLY_DONE } from "@/lib/polynomialRegressionTrack";

export default function PolynomialRegressionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonShell
      sidebar={
        <TrackSidebar
          track={POLY_TRACK}
          title="Polynomial & basis functions"
          accent="var(--c-regression)"
          done={POLY_DONE}
          total={POLY_TOTAL}
        />
      }
    >
      {children}
    </LessonShell>
  );
}
