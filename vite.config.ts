import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
      const allowed = new Set(["/", "rechner", "impressum", "datenschutz", "ratgeber"]);
      return paths.filter((p: string) => allowed.has(p));
    },
  },
} as any));
