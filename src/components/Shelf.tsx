import Link from "next/link";
import { groupPages, countsFor } from "@/lib/catalog";
import { FamilyGlyph, GLYPH_FOR } from "./figures/FamilyGlyph";
import type { Group } from "@/lib/siteMap";

// One index row per family — the landing page and the map both use it.
// Everything numeric is derived from the track modules (src/lib/catalog.ts), and the track list
// is the WHOLE list, planned entries included, so the row is honest about what is not built yet
// instead of quietly showing only the finished parts.

export function Shelf({ groups, unit = "tracks" }: { groups: Group[]; unit?: "tracks" | "chapters" }) {
  return (
    <div className="shelf">
      {groups.map((g) => (
        <ShelfRow key={g.name} group={g} unit={unit} />
      ))}
    </div>
  );
}

function ShelfRow({ group, unit }: { group: Group; unit: "tracks" | "chapters" }) {
  const { pages, live, planned } = groupPages(group);
  // In FAMILIES every entry is its own track, so a page count next to each one is informative.
  // In PILLARS and FOUNDATIONS the *group* is the track and the entries are its chapters — they
  // all resolve to the same counts, so printing them would repeat one number down the row.
  const perTrackCounts = live > 1;
  const glyph = GLYPH_FOR[group.name];
  return (
    <div className="shelf-row" style={{ ["--accent" as string]: group.color }}>
      {glyph && (
        <span className="shelf-glyph">
          <FamilyGlyph kind={glyph} />
        </span>
      )}
      <span className="shelf-name">{group.name}</span>
      <span className="shelf-figure">
        {pages > 0 ? (
          <>
            <span className="shelf-num">{pages}</span>
            <span className="shelf-unit">pages</span>
          </>
        ) : (
          <span className="shelf-unit" style={{ marginLeft: 0 }}>not started</span>
        )}
      </span>

      <span className="shelf-meta">{group.blurb}</span>
      <span className="shelf-submeta">
        {unit === "chapters"
          ? `${planned} chapters`
          : live === planned
            ? `all ${planned} tracks`
            : `${live} of ${planned} tracks`}
      </span>

      <div className="shelf-tracks">
        {group.tracks.map((t, i) => {
          const k = countsFor(t.href);
          return (
            <span key={t.title}>
              {i > 0 && <span className="shelf-sep">·</span>}
              {t.href ? (
                <Link href={t.href}>
                  {t.title}
                  {k && perTrackCounts && (
                    <span style={{ color: "var(--faint)", fontSize: 11.5 }}>
                      &nbsp;{t.partial ? `${k.done}/${k.total}` : k.done}
                    </span>
                  )}
                </Link>
              ) : (
                <span>{t.title}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
