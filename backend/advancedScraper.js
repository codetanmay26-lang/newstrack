import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

/* 1️⃣  Detect the news outlet's official website by scraping DuckDuckGo page */
import * as cheerio from 'cheerio';
import axios from 'axios';

/**
 * Detect official website using web search
 * Uses Google search (DuckDuckGo blocks automation)
 */
export async function getOfficialWebsite(outlet) {
  try {
    // Use Google search as fallback (works better for automation)
    const searchQuery = encodeURIComponent(`${outlet} news official website`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
    
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    let found = '';

    // Extract from Google search results
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('google.com') && !href.includes('youtube.com') && !href.includes('facebook.com') && !href.includes('twitter.com')) {
        // Clean URL
        const match = href.match(/https?:\/\/[^&]+/i);
        if (match && !found) {
          found = match;
          return false; // break
        }
      }
    });

    // If Google didn't work, try pattern matching
    if (!found) {
      const outletSlug = outlet.toLowerCase().replace(/\s+/g, '');
      found = `https://www.${outletSlug}.com`;
    }

    console.log(`🔍 Detected website for "${outlet}": ${found}`);
    return found;

  } catch (error) {
    console.error('❌ Website detection error:', error.message);
    
    // Fallback: pattern-based URL construction
    const outletSlug = outlet.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    return `https://www.${outletSlug}.com`;
  }
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
