"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LR_TRACK, LR_TOTAL, LR_DONE } from "@/lib/linearRegressionTrack";
import type { TrackChapter } from "@/lib/linearRegressionTrack";

export function TrackSidebar({
  track = LR_TRACK,
  title = "Linear regression",
  accent = "var(--c-regression)",
  done = LR_DONE,
  total = LR_TOTAL,
}: {
  track?: TrackChapter[];
  title?: string;
  accent?: string;
  done?: number;
  total?: number;
} = {}) {
  const pathname = usePathname();

  return (
    <nav aria-label={`${title} track`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: accent }} />
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          {title}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ width: `${(done / total) * 100}%`, height: "100%", background: "var(--brand)" }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>
        {done} / {total} pages
      </div>

      {track.map((chapter) => (
        <div key={chapter.title}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "26px 0 8px",
            }}
          >
            {chapter.title}
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 8, marginLeft: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {chapter.pages.map((page) => {
              const active = page.href && page.href === pathname;
              const built = Boolean(page.href);
              if (built) {
                return (
                  <Link
                    key={page.title}
                    href={page.href!}
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      padding: "4px 9px",
                      borderRadius: 7,
                      textDecoration: "none",
                      color: active ? "var(--brand)" : "var(--ink)",
                      fontWeight: active ? 500 : 400,
                      background: active ? "color-mix(in srgb, var(--brand) 13%, transparent)" : "transparent",
                    }}
                  >
                    {page.title}
                  </Link>
                );
              }
              return (
                <div
                  key={page.title}
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    padding: "4px 9px",
                    color: "var(--faint)",
                  }}
                >
                  {page.title}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
