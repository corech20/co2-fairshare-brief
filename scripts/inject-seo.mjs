/**
 * vite-react-ssg renders page bodies, but react-helmet-async metadata is not
 * automatically transferred to the generated head.
 * Read the static SEO props in the existing page sources to avoid drift.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ORIGIN = "https://co2kostenberechnung.de";
const pages = new Map([
  ["/", "src/pages/Index.tsx"],
  ["/rechner", "src/pages/Calculator.tsx"],
  ["/ratgeber", "src/pages/Ratgeber.tsx"],
  ["/impressum", "src/pages/Impressum.tsx"],
  ["/datenschutz", "src/pages/Datenschutz.tsx"],
]);

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractSEO(sourceFile, route) {
  const source = readFileSync(resolve(sourceFile), "utf8");
  const allTags = [...source.matchAll(/<SEO\b([\s\S]*?)\/>/g)];
  const tag = allTags.find((match) => {
    const actualRoute = match[1].match(/\bpath="([^"]+)"/)?.[1];
    return actualRoute === route;
  })?.[1];

  if (!tag) throw new Error("Cannot find static SEO for " + route + " in " + sourceFile);
  const prop = (name) => {
    const result = tag.match(new RegExp("\\b" + name + '="([^"]+)"'));
    if (!result?.[1]) throw new Error("Missing " + name + " in SEO for " + route);
    return result[1];
  };

  return { title: prop("title"), description: prop("description") };
}

for (const [route, source] of pages) {
  const destination = resolve("dist", route === "/" ? "" : route.slice(1), "index.html");
  if (!existsSync(destination)) throw new Error("Pre-rendered HTML missing: " + destination);

  const { title, description } = extractSEO(source, route);
  const url = ORIGIN + route;
  let html = readFileSync(destination, "utf8");
  if (!html.includes("</head>")) throw new Error("Missing head closing tag in " + destination);

  const meta = [
    '<title data-rh="true">' + escapeHtml(title) + '</title>',
    '<meta data-rh="true" name="description" content="' + escapeHtml(description) + '">',
    '<link data-rh="true" rel="canonical" href="' + escapeHtml(url) + '">',
    '<meta data-rh="true" property="og:title" content="' + escapeHtml(title) + '">',
    '<meta data-rh="true" property="og:description" content="' + escapeHtml(description) + '">',
    '<meta data-rh="true" property="og:url" content="' + escapeHtml(url) + '">',
  ].join("\n");

  html = html.replace("</head>", meta + "\n</head>");
  writeFileSync(destination, html);
  console.log("SEO metadata injected: " + route);
}
