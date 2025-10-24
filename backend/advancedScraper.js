import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

/* 1️⃣  Detect the news outlet's official website by scraping DuckDuckGo page */
export async function getOfficialWebsite(outlet) {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(outlet + " news official site")}`;
  const { data } = await axios.get(searchUrl);
  const $ = cheerio.load(data);
  let found = "";

  $("a.result__a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.startsWith("http") && !href.includes("facebook")) {
      found = href.match(/https?:\/\/[^/]+/i)?.[0];
      return false;
    }
  });

  return found;
}

/* 2️⃣  Collect article links from the homepage itself */
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

  return [...new Set(links)].slice(0, 10);  // first 10 links
}

/* 3️⃣  Extract journalist names: first try static, then dynamic */
export async function extractAuthors(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const authors = new Set();

    $("meta[name='author'], [class*='author'], .byline, [rel='author']").each((_, el) => {
      const text = $(el).attr("content") || $(el).text();
      if (text && /^[A-Z][a-z\s.]+$/.test(text.trim())) authors.add(text.trim());
    });

    if (authors.size) return [...authors];
  } catch {}

  // fallback: dynamic scrape
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  const names = await page.$$eval(
    'a[href*="author"], [class*="author"], [itemprop*="author"], .byline',
    els => els.map(e => e.textContent.trim()).filter(t => /^[A-Z][a-z\s.]+$/.test(t))
  );

  await browser.close();
  return [...new Set(names)];
}

/* 4️⃣  Local cleanup and formatting for structured output */
export function organizeData(outlet, authors, links) {
  const cleaned = [...new Set(authors.filter(a => !/guest|team|staff/i.test(a)))];

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
