import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

// =====================================
//   UNIVERSAL JOURNALIST SCRAPER
// =====================================
app.post("/api/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    // STEP 1 — Normalize URL
    let validUrl = url.trim();
    if (!/^https?:\/\//i.test(validUrl)) validUrl = `https://${validUrl}`;
    console.log("🌐 Starting scraper for:", validUrl);

    const outletHost = new URL(validUrl).hostname.replace("www.", "");

    // =====================================
    // STEP 2 — FAST STATIC SCRAPE (CHEERIO)
    // =====================================
    try {
      const { data } = await axios.get(validUrl, { timeout: 15000 });
      const $ = cheerio.load(data);
      const staticAuthors = [];

      $(
        "meta[name='author'], [class*='author'], .byline, [rel='author']"
      ).each((_, el) => {
        const name = ($(el).attr("content") || $(el).text() || "").trim();
        if (
          name &&
          /^[A-ZÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(name) &&
          !/team|staff|guest|service|unknown/i.test(name)
        ) {
          staticAuthors.push({
            id: staticAuthors.length + 1,
            name,
            section: "Unknown",
            articleCount: 0,
            date: new Date().toISOString().split("T")[0],
            source: outletHost,
          });
        }
      });

      if (staticAuthors.length > 0) {
        console.log(`✅ Extracted ${staticAuthors.length} via static Cheerio`);
        return res.json({
          summary: {
            outlet: outletHost,
            totalJournalists: staticAuthors.length,
            extractionMethod: "Static (Cheerio)",
            timestamp: new Date().toISOString(),
          },
          journalists: staticAuthors,
        });
      }
    } catch (err) {
      console.warn("⚠ Static extraction failed, switching to Puppeteer...");
    }

    // =====================================
    // STEP 3 — ADVANCED SCRAPE VIA PUPPETEER
    // =====================================
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    try {
      await page.goto(validUrl, { waitUntil: "networkidle2", timeout: 45000 });
    } catch {
      console.warn("⚠ Initial load failed, retrying with relaxed mode...");
      try {
        await page.goto(validUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      } catch {
        await browser.close();
        return res.status(404).json({ error: "Could not open the website after retries." });
      }
    }

    await page.waitForSelector("body", { visible: true });
    await new Promise((r) => setTimeout(r, 4000));

    let journalists = [];

    // =====================================
    // STEP 4 — UNIVERSAL SELECTOR SCAN
    // =====================================
    try {
      const pageAuthors = await page.evaluate(() => {
        const selectorList = [
          'a[href*="author"]',
          'a[href*="journalist"]',
          'a[href*="byline"]',
          'a[rel="author"]',
          '[itemprop*="author"]',
          '[class*="author"]',
          '[class*="byline"]',
          'meta[name="author"]',
          '.article__byline a',
          '.story-author',
          '.byline-name',
          '.author-name',
          '.meta-author',
          '.author',
          '.journalist',
        ].join(",");

        const results = [];
        document.querySelectorAll(selectorList).forEach((el, i) => {
          const text = el.getAttribute("content") || el.textContent || "";
          const name = text.replace(/\s*By\s*/i, "").trim();
          if (
            name &&
            name.length > 2 &&
            !/team|staff|guest|unknown|service/i.test(name)
          ) {
            results.push({
              id: i + 1,
              name,
              contact: el.href || "",
              date: new Date().toISOString().split("T")[0],
            });
          }
        });
        return results;
      });
      journalists = journalists.concat(pageAuthors);
    } catch (e) {
      console.warn("Primary DOM scan failed:", e.message);
    }

// ------------------------------------------------------------
// Step 5 – Enhanced Article‑level Crawler for Dynamic Sites
// ------------------------------------------------------------
if (journalists.length < 3) {
  try {
    console.log("🕵️  Running extended article‑crawler to capture authors...");

    // Collect all possible article URLs from homepage or section index
    const articleLinks = await page.$$eval(
      `
      a[href*="/news/"],
      a[href*="/story/"],
      a[href*="/articles/"],
      a[href*="/article/"],
      a[href*="/content/"],
      a[href*="/videos/"]
      `,
      (els) =>
        Array.from(
          new Set(
            els
              .map((a) => a.href)
              .filter((h) => h && h.startsWith("http") && !h.endsWith(".jpg"))
              .filter((h) => !/\/(tag|category|photo|topic|sports)\//i.test(h))
          )
        ).slice(0, 8) // crawl first 8 articles max
    );

    const processed = new Set();
    for (const link of articleLinks) {
      if (processed.has(link)) continue;
      processed.add(link);
      try {
        console.log("🔗 Visiting:", link);
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 35000 });
        await new Promise((r) => setTimeout(r, 3000));

        // Match authors in multiple site patterns
        const names = await page.$$eval(
          `
            a[href*="author"],
            [rel="author"],
            .author,
            .author-name,
            .story-author,
            .meta-author,
            .byline,
            .byline-name,
            [itemprop="author"],
            [class*="Author"],
            [class*="Byline"]
          `,
          (els) =>
            els
              .map((e) => (e.textContent || "").trim())
              .filter(Boolean)
              .filter((n) => n.length > 2)
        );

        // Deduplicate and push into global array
        for (const n of names) {
          if (
            n &&
            !/team|staff|guest|service|unknown|reporter/i.test(n) &&
            !journalists.find((j) => j.name.toLowerCase() === n.toLowerCase())
          ) {
            journalists.push({
              name: n,
              contact: link,
              date: new Date().toISOString().split("T")[0],
            });
          }
        }
      } catch (err) {
        console.warn("⏭️  Skipping article due to error:", err.message);
      }
    }

    console.log(`🧾  Article crawler added ${journalists.length} names total.`);
  } catch (crawlErr) {
    console.warn("❌  Extended crawler failed:", crawlErr.message);
  }
}


    // =====================================
    // STEP 6 — CHEERIO RECHECK IF STILL EMPTY
    // =====================================
    if (!journalists.length) {
      console.log("🔁 No authors via Puppeteer; fallback Cheerio pass...");
      const { data } = await axios.get(validUrl, { timeout: 15000 });
      const $ = cheerio.load(data);
      $("meta[name='author'], [rel='author'], [class*='author'], .byline a").each(
        (i, el) => {
          const name = $(el).attr("content") || $(el).text();
          if (name && /^[A-Z][A-Za-z\s.]+$/.test(name.trim()))
            journalists.push({
              id: journalists.length + 1,
              name: name.trim(),
              contact: "",
              date: new Date().toISOString().split("T")[0],
            });
        }
      );
    }

    // =====================================
    // STEP 7 — CLEANUP & VALIDATION
    // =====================================
    journalists = journalists
      .filter(
        (j) =>
          j.name &&
          /^[A-ZÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(j.name) &&
          !/team|staff|guest|unknown|service/i.test(j.name)
      )
      .reduce((acc, cur) => {
        if (!acc.find((j) => j.name.toLowerCase() === cur.name.toLowerCase()))
          acc.push(cur);
        return acc;
      }, []);

    await browser.close();

    // =====================================
    // STEP 8 — FINAL RESPONSE
    // =====================================
    if (!journalists.length) {
      console.log("❌ No journalist data extracted.");
      return res.status(404).json({
        error:
          "No journalist profiles found. The site was reachable but returned no author metadata.",
      });
    }

    const summary = {
      outlet: outletHost,
      totalJournalists: journalists.length,
      extractionMethod: "Hybrid (Cheerio + Puppeteer)",
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Extracted ${journalists.length} verified journalists`);
    res.json({ summary, journalists });
  } catch (err) {
    console.error("Scraper crashed:", err);
    res.status(500).json({ error: err.message || "Scraping failed." });
  }
});

app.listen(3001, () =>
  console.log("✅ Advanced scraper backend running on port 3001")
);
