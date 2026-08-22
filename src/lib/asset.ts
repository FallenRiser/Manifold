// Plain <a href> / <img src> to files in public/ are NOT prefixed with the
// configured basePath the way next/link and next/image are — so a bare
// "/capstone/x" resolves to the domain root and 404s under basePath. Build public
// asset URLs through here instead. Keep BASE_PATH in sync with next.config.mjs.
export const BASE_PATH = "/Manifold";

export const asset = (path: string) => `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
