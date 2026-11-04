/**
 * Verify the HTML pages that must be crawlable after the SSG production build.
 * Run with: npm run build
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const origin = "https://co2kostenberechnung.de";
const routes = ["/", "/rechner", "/ratgeber", "/impressum", "/datenschutz"];
const errors = [];

for (const route of routes) {
  const folder = route === "/" ? "" : route.slice(1);
  const file = resolve("dist", folder, "index.html");
  if (!existsSync(file)) {
    errors.push(`${route}: pre-rendered HTML missing (${file})`);
    continue;
  }

  const html = readFileSync(file, "utf8");
  const expectedUrl = origin + route;
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();

  if (!title || !/CO2|Datenschutz|Impressum/i.test(title)) {
    errors.push(`${route}: meaningful title missing`);
  }
  if (!/<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(html) &&
      !/<meta\s+content=["'][^"']+["']\s+name=["']description["']/i.test(html)) {
    errors.push(`${route}: meta description missing`);
  }
  if (!html.includes(`href="${expectedUrl}"`) &&
      !html.includes(`href='${expectedUrl}'`)) {
    errors.push(`${route}: canonical URL missing or mismatched (${expectedUrl})`);
  }
  if (!/<h1\b[^>]*>/i.test(html)) {
    errors.push(`${route}: no server-rendered h1 (possible client-only output)`);
  }
  const visibleText = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (visibleText.length < 350) {
    errors.push(`${route}: unexpectedly little rendered text (${visibleText.length} characters)`);
  }
  console.log(`SEO check ${route}: ${title || "(title missing)"}`);
}

const robotsPath = resolve("dist", "robots.txt");
const sitemapPath = resolve("dist", "sitemap.xml");
if (!existsSync(robotsPath)) errors.push("robots.txt missing");
if (!existsSync(sitemapPath)) errors.push("sitemap.xml missing");

if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  for (const route of routes) {
    if (!sitemap.includes(`<loc>${origin + route}</loc>`)) {
      errors.push(`${route}: URL missing from sitemap`);
    }
  }
  for (const privateRoute of ["/ergebnis", "/verlauf"]) {
    if (sitemap.includes(`<loc>${origin + privateRoute}</loc>`)) {
      errors.push(`${privateRoute}: private results/history URL must not be in sitemap`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`SEO ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("SEO pre-render check passed.");
}
