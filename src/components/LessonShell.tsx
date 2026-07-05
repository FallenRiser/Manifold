"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Shared lesson chrome for every track layout. Desktop: sticky sidebar +
// content grid (styles live in globals.css under .lesson-shell). Mobile
// (≤900px): the aside is hidden and a fixed "Contents" button opens the same
// sidebar in a left-slide drawer. The sidebar node is rendered in both places;
// TrackSidebar's progress effects are idempotent so the double mount is safe.

export function LessonShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lesson-shell">
      <aside className="lesson-aside">{sidebar}</aside>
      <div style={{ maxWidth: 720, minWidth: 0 }}>{children}</div>

      <button
        type="button"
        className="lesson-drawer-btn"
        aria-label="Open track contents"
        onClick={() => setOpen(true)}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M2 3.5h11M2 7.5h11M2 11.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Contents
      </button>

      <div
        className={`lesson-drawer${open ? " open" : ""}`}
        aria-hidden={!open}
        role="dialog"
        aria-label="Track contents"
      >
        <div className="lesson-drawer-backdrop" onClick={() => setOpen(false)} />
        <div className="lesson-drawer-panel" onClick={(e) => {
          // close when a chapter link inside the sidebar is tapped
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}>
          <button
            type="button"
            className="lesson-drawer-close"
            aria-label="Close contents"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          {sidebar}
        </div>
      </div>
    </div>
  );
}
