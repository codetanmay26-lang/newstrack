import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const journalists = await page.evaluate(() => {
      const results = [];
      const authorLinks = document.querySelectorAll('a[href*="author"], a[href*="journalist"], a[href*="byline"]');
      authorLinks.forEach((link, i) => {
        if (i < 30) {
          results.push({
            id: i + 1,
            name: link.textContent.trim(),
            section: "Unknown",
            articleCount: 0,
            latestArticle: "",
            date: new Date().toISOString().split('T')[0],
            topics: [],
            contact: link.href,
            keywords: []
          });
        }
      });
      return results;
    });

    await browser.close();

    if (!journalists.length) {
      return res.status(404).json({ error: 'No journalist profiles found.' });
    }
    res.json({ journalists });
  } catch (err) {
    console.error('Scraper error:', err);
    res.status(500).json({ error: err.message || 'Scraping failed.' });
  }
});

app.listen(3001, () => console.log('Scraper backend running on port 3001'));
