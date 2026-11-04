import { describe, it, expect } from "vitest";
import { filterPrerenderRoutes, normalizeRoutePath } from "../lib/seo-routes";

describe("SEO pre-render route selection", () => {
  it("accepts leading-slash paths supplied by vite-react-ssg", () => {
    expect(filterPrerenderRoutes([
      "/", "/rechner", "/ratgeber", "/impressum", "/datenschutz",
      "/ergebnis", "/verlauf", "/unbekannt",
    ])).toEqual(["/", "/rechner", "/ratgeber", "/impressum", "/datenschutz"]);
  });

  it("also accepts relative paths and trailing slashes", () => {
    expect(filterPrerenderRoutes([
      "/", "rechner", "ratgeber/", "impressum", "datenschutz/",
      "ergebnis", "verlauf",
    ])).toEqual(["/", "rechner", "ratgeber/", "impressum", "datenschutz/"]);
  });

  it("does not pre-render dynamic/private results", () => {
    expect(filterPrerenderRoutes(["/ergebnis", "/verlauf", "/mieterbund", "/random"])).toEqual([]);
  });

  it("normalizes root and nested paths consistently", () => {
    expect(normalizeRoutePath("/")).toBe("/");
    expect(normalizeRoutePath("rechner/")).toBe("/rechner");
    expect(normalizeRoutePath("//ratgeber//")).toBe("/ratgeber");
  });
});
