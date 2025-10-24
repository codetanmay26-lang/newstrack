// src/services/scraper.ts

export async function detectWebsite(outletName: string): Promise<string> {
  // A robust solution would hit a backend API or a search engine
  // Here is a direct DuckDuckGo call (replace with a backend API for real production)
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(outletName + " news")}&format=json`
  );
  const data = await response.json();
  if (data && data.AbstractURL) {
    return data.AbstractURL;
  }
  return `https://www.${outletName.toLowerCase().replace(/\s+/g, '')}.com`;
}

export async function extractJournalists(websiteUrl: string) {
  // Use your backend scraping endpoint with Puppeteer/Playwright
  const response = await fetch("/api/scrape", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ url: websiteUrl }),
  });
  const data = await response.json();
  return data.journalists;
}
