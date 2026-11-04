/**
 * Pages which should be exported as full HTML during the SSG build.
 * Interactive result/history pages and unapproved partner drafts are intentionally
 * excluded from pre-rendering and the public sitemap.
 */
const INDEXABLE_ROUTES = new Set([
  "/",
  "/rechner",
  "/ratgeber",
  "/impressum",
  "/datenschutz",
]);

/** Vite React SSG may pass paths with or without a leading/trailing slash. */
export function normalizeRoutePath(routePath: string): string {
  const segments = routePath.split("/").filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "/";
}

export function filterPrerenderRoutes(paths: string[]): string[] {
  // Retain the original path so that vite-react-ssg can resolve it itself.
  return paths.filter((routePath) => INDEXABLE_ROUTES.has(normalizeRoutePath(routePath)));
}
