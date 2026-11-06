import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App.tsx";
import "./index.css";

// All routes in this app are static React components, without React Router
// loaders. vite-react-ssg 0.9.2 nevertheless fetches a hashed loader-data
// manifest when it hydrates pre-rendered HTML. Lovable's crawler renderer
// does not always serve that manifest and returns plain "Not found", causing
// a JSON parse error and a Google Search Console Soft 404.
//
// An empty manifest is correct for routes without loaders: it prevents the
// unnecessary request and retains hydration of the pre-rendered content.
if (typeof window !== "undefined") {
  window.__VITE_REACT_SSG_STATIC_LOADER_MANIFEST__ ??= {};
}

export const createRoot = ViteReactSSG({ routes });
