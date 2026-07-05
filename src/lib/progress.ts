// Reader progress, persisted in localStorage (client-only helpers).
// "Read" = the page was opened; last-visited powers "continue where you left off".

const READ_KEY = "manifold-read";
const LAST_KEY = "manifold-last";

export type LastVisit = {
  path: string;
  pageTitle: string;
  trackTitle: string;
  accent: string;
};

export function getRead(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markRead(path: string): Record<string, number> {
  const read = getRead();
  read[path] = Date.now();
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(read));
  } catch {
    // storage full/blocked — progress is best-effort
  }
  return read;
}

export function setLastVisit(v: LastVisit) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(v));
  } catch {}
}

export function getLastVisit(): LastVisit | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) || "null");
    return v && typeof v.path === "string" ? v : null;
  } catch {
    return null;
  }
}
