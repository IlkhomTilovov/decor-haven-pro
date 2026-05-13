// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Fetches active categories + products from Supabase and writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://decor-haven-pro.lovable.app";
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

function xmlEntry(e: SitemapEntry) {
  return [
    `  <url>`,
    `    <loc>${BASE_URL}${e.path}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const entries: SitemapEntry[] = [...staticEntries];

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    console.warn("[sitemap] dynamic fetch failed, writing static-only:", err);
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(xmlEntry),
    `</urlset>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main();
