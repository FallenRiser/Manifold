"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LR_TRACK, LR_TOTAL, LR_DONE } from "@/lib/linearRegressionTrack";
import type { TrackChapter } from "@/lib/linearRegressionTrack";
import { getRead, markRead, setLastVisit } from "@/lib/progress";

// Ink-deepening tier ramp, matching /map's depth scale (§10.1: brand is ink,
// not violet). Indexed by tier number.
const TIER_NAMES: Record<number, string> = { 1: "Intuition", 2: "Practitioner", 3: "Theory" };
const TIER_FILLS: Record<number, string> = {
  1: "color-mix(in srgb, var(--ink) 55%, var(--paper))",
  2: "color-mix(in srgb, var(--ink) 78%, var(--paper))",
  3: "var(--ink)",
};

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
  // loaded after mount so SSR markup matches the first client render
  const [read, setRead] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    setRead(markRead(pathname));
    const page = track.flatMap((c) => c.pages).find((p) => p.href === pathname);
    if (page) setLastVisit({ path: pathname, pageTitle: page.title, trackTitle: title, accent });
  }, [pathname, track, title, accent]);

  useEffect(() => {
    // refresh when another tab records progress
    const onStorage = () => setRead(getRead());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const builtHrefs = track.flatMap((c) => c.pages).filter((p) => p.href).map((p) => p.href!);
  const readCount = read ? builtHrefs.filter((h) => read[h]).length : 0;

  return (
    <nav aria-label={`${title} track`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: accent }} />
        <span className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          {title}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
        <div
          style={{
            width: `${(readCount / Math.max(1, done)) * 100}%`,
            height: "100%",
            background: accent,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>
        {read ? `${readCount} of ${done} pages read` : `${done} / ${total} pages`}
      </div>

      {track.map((chapter) => (
        <div key={chapter.title}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 6,
              fontSize: 10.5,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "26px 0 8px",
            }}
          >
            <span>{chapter.title}</span>
            {chapter.tier && (
              <span
                title={`Tier ${chapter.tier} · ${TIER_NAMES[chapter.tier]}`}
                style={{
                  flexShrink: 0,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: "var(--paper)",
                  background: TIER_FILLS[chapter.tier],
                  borderRadius: 4,
                  padding: "1px 5px",
                  cursor: "help",
                }}
              >
                T{chapter.tier}
              </span>
            )}
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 8, marginLeft: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {chapter.pages.map((page) => {
              const active = page.href && page.href === pathname;
              const built = Boolean(page.href);
              const isRead = Boolean(built && read && read[page.href!]);
              if (built) {
                return (
                  <Link
                    key={page.title}
                    href={page.href!}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 6,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      padding: "4px 9px",
                      borderRadius: 7,
                      textDecoration: "none",
                      color: active ? "var(--brand)" : isRead ? "var(--muted)" : "var(--ink)",
                      fontWeight: active ? 500 : 400,
                      background: active ? "color-mix(in srgb, var(--brand) 13%, transparent)" : "transparent",
                    }}
                  >
                    <span>{page.title}</span>
                    {isRead && (
                      <span aria-label="read" style={{ fontSize: 10, color: "var(--good)", flexShrink: 0 }}>
                        ✓
                      </span>
                    )}
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
