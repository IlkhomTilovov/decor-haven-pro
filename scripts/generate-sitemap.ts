// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Reads primary_domain from system_settings, fetches active categories + products
// from Supabase, and writes public/sitemap.xml. Also syncs the Sitemap: directive
// in public/robots.txt to point at the same domain.

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const FALLBACK_BASE_URL = "https://decor-haven-pro.lovable.app";
const SUPABASE_URL = "https://fyltqyrnvibiwvegnqil.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bHRxeXJudmliaXd2ZWducWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNzg2NzUsImV4cCI6MjA4Mzc1NDY3NX0.jFKXjAbDT9F2rpxcc0lQ5SXiGuIe3fmYG0NDPIhg_sw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/catalog", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "weekly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "weekly", priority: "0.5" },
];

function normalize(url: string) {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u.replace(/\/+$/, "");
}

function xmlEntry(base: string, e: SitemapEntry) {
  return [
    `  <url>`,
    `    <loc>${base}${e.path}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function syncRobotsSitemap(sitemapUrl: string) {
  const robotsPath = resolve("public/robots.txt");
  if (!existsSync(robotsPath)) return;
  const original = readFileSync(robotsPath, "utf8");
  const withoutSitemap = original
    .split("\n")
    .filter((l) => !/^\s*Sitemap:/i.test(l))
    .join("\n")
    .replace(/\n+$/, "");
  const next = `${withoutSitemap}\n\nSitemap: ${sitemapUrl}\n`;
  writeFileSync(robotsPath, next);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let baseUrl = FALLBACK_BASE_URL;
  try {
    const { data: settings } = await supabase
      .from("system_settings")
      .select("primary_domain")
      .limit(1)
      .single();
    if (settings?.primary_domain) baseUrl = normalize(settings.primary_domain);
  } catch {
    /* keep fallback */
  }

  const entries: SitemapEntry[] = [...staticEntries];

  try {
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true)
      .eq("is_indexed", true);
    if (categories) {
      for (const c of categories) {
        entries.push({
          path: `/catalog?category=${c.slug}`,
          lastmod: c.updated_at,
          changefreq: "weekly",
          priority: "0.8",
        });
      }
    }

    const { data: products } = await supabase
      .from("products")
      .select("id, slug, updated_at")
      .eq("is_active", true)
      .eq("is_indexed", true);
    if (products) {
      for (const p of products) {
        entries.push({
          path: `/product/${p.slug || p.id}`,
          lastmod: p.updated_at,
          changefreq: "weekly",
          priority: "0.7",
        });
      }
    }
  } catch (err) {
    console.warn("[sitemap] dynamic fetch failed:", err);
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map((e) => xmlEntry(baseUrl, e)),
    `</urlset>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  syncRobotsSitemap(`${baseUrl}/sitemap.xml`);
  console.log(`sitemap.xml written for ${baseUrl} (${entries.length} entries)`);
}

main();
