import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { filterPrerenderRoutes } from "./src/lib/seo-routes";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // The tagger runtime accesses window and must not enter prerender builds.
  plugins: [react(), mode === "development" && command === "serve" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "react-helmet-async"],
  },
  ssgOptions: {
    entry: "src/main.tsx",
    script: "async",
    formatting: "none",
    dirStyle: "nested",
    includedRoutes(paths: string[]) {
      return filterPrerenderRoutes(paths);
    },
  },
} as any));
