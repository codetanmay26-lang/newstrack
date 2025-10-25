import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

/* 1️⃣ Detect the news outlet's official website by scraping Google search results */

/**
 * Detects the official website of a news outlet using Google Search.
 * Falls back to pattern-based checking only if the website is online and reachable.
 */
export async function getOfficialWebsite(outlet) {
  try {
    // Use Google Search - works better for automation
    const searchQuery = encodeURIComponent(`${outlet} news official website`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;

    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    let found = "";

    // Extract the first valid external link from Google Search results
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        !href.includes("google.com") &&
        !href.includes("youtube.com") &&
        !href.includes("facebook.com") &&
        !href.includes("twitter.com")
      ) {
        // Clean extracted URL
        const match = href.match(/https?:\/\/[^&]+/i);
        if (match && !found) {
          found = match[0];
          return false; // Stop loop after first valid result
        }
      }
    });

    // If Google results fail, check a pattern-based fallback
    if (!found) {
      const outletSlug = outlet.toLowerCase().replace(/\s/g, "");
      const fallback = `https://www.${outletSlug}.com`;

      try {
        console.log("🔍 Checking reachability:", fallback);
        await axios.get(fallback, { timeout: 5000 });
        found = fallback; // Use fallback only if reachable
      } catch (err) {
        console.error("❌ Invalid or unreachable website, halting detection.");
        return null; // Stop detection entirely
      }
    }

    console.log(`✅ Detected website for "${outlet}": ${found}`);
    return found || null;
  } catch (error) {
    console.error("❌ Website detection error:", error.message);
    return null;
  }
}

/* 2️⃣ Collect article links from the homepage itself */
export async function getArticleLinks(domain) {
  const { data } = await axios.get(domain, { timeout: 15000 });
  const $ = cheerio.load(data);
  const links = [];

  $('a[href*="/news"], a[href*="/article"], a[href*="/story"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.length < 200) {
      links.push(href.startsWith("http") ? href : domain + href);
    }
  });

  return [...new Set(links)].slice(0, 10); // Return top 10 unique article links
}

/* 3️⃣ Extract journalist names: static scrape first, then Puppeteer fallback */
export async function extractAuthors(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const authors = new Set();

    $("meta[name='author'], [class*='author'], .byline, [rel='author']").each(
      (_, el) => {
        const text = $(el).attr("content") || $(el).text();
        if (text && /^[A-Z][a-z\s.]+$/.test(text.trim()))
          authors.add(text.trim());
      }
    );

    if (authors.size) return [...authors];
  } catch {
    // Static scrape failed — fallback to Puppeteer
    console.warn("⚙️ Static author extraction failed, trying dynamic render...");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  const names = await page.$$eval(
    'a[href*="author"], [class*="author"], [itemprop*="author"], .byline',
    (els) =>
      els
        .map((e) => e.textContent.trim())
        .filter((t) => /^[A-Z][a-z\s.]+$/.test(t))
  );

  await browser.close();
  return [...new Set(names)];
}

/* 4️⃣ Structuring and cleaning extracted data */
export function organizeData(outlet, authors, links) {
  const cleaned = [
    ...new Set(authors.filter((a) => !/guest|team|staff/i.test(a))),
  ];

  return {
    outlet,
    totalAuthors: cleaned.length,
    sampleArticles: links.length,
    journalists: cleaned.map((name, i) => ({
      id: i + 1,
      name,
      source: outlet,
    })),
  };
}
