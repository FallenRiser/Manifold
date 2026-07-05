import { TrackSidebar } from "@/components/TrackSidebar";
import { LessonShell } from "@/components/LessonShell";

export default function LinearRegressionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LessonShell sidebar={<TrackSidebar />}>{children}</LessonShell>;
}
