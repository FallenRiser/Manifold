"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchPages, SEARCH_INDEX, type SearchEntry } from "@/lib/searchIndex";

// ⌘K / Ctrl-K search over every live lesson page (PROJECT.md §10.5).
// Hand-rolled: ~200 entries need no search library, and staying dependency-free
// keeps it theme-correct and instant.

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = query.trim() ? searchPages(query) : [];

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (e: SearchEntry) => {
      close();
      router.push(e.href);
    },
    [close, router],
  );

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        setOpen((o) => !o);
      } else if (ev.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => setActive(0), [query]);

  // keep the active row in view while arrowing
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onInputKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (ev.key === "Enter" && results[active]) {
      ev.preventDefault();
      go(results[active]);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search lessons"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "var(--muted)",
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 10,
          padding: "5px 10px",
          cursor: "pointer",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <span className="search-hint">Search</span>
        <kbd
          className="search-hint"
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 10.5,
            color: "var(--faint)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "1px 5px",
            background: "var(--surface-2)",
          }}
        >
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Search lessons"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "color-mix(in srgb, var(--ink) 22%, transparent)",
            backdropFilter: "blur(2px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: "14vh",
          }}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            style={{
              width: "min(560px, calc(100vw - 32px))",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: 16,
              boxShadow: "0 24px 64px color-mix(in srgb, var(--ink) 18%, transparent)",
              overflow: "hidden",
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              onKeyDown={onInputKey}
              placeholder={`Search ${SEARCH_INDEX.length} lessons…`}
              aria-label="Search query"
              style={{
                width: "100%",
                fontSize: 15.5,
                padding: "15px 18px",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--ink)",
                borderBottom: results.length || query ? "1px solid var(--border)" : "none",
              }}
            />
            {query.trim() !== "" && (
              <div ref={listRef} style={{ maxHeight: "50vh", overflowY: "auto", padding: results.length ? 6 : 0 }}>
                {results.map((r, i) => (
                  <button
                    key={r.href}
                    data-idx={i}
                    onClick={() => go(r)}
                    onMouseEnter={() => setActive(i)}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      background: i === active ? "var(--surface-2)" : "transparent",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: r.accent, flexShrink: 0, transform: "translateY(-1px)" }} />
                    <span style={{ fontSize: 14, color: "var(--ink)", flex: "0 1 auto" }}>{r.title}</span>
                    <span style={{ fontSize: 11.5, color: "var(--faint)", marginLeft: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {r.track} · {r.chapter}
                    </span>
                  </button>
                ))}
                {results.length === 0 && (
                  <div style={{ padding: "18px 18px 20px", fontSize: 13.5, color: "var(--muted)" }}>
                    Nothing for &ldquo;{query}&rdquo; — try an algorithm, a concept (&ldquo;gradient&rdquo;, &ldquo;residual&rdquo;), or a chapter name.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
