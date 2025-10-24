// src/services/scraper.ts
export async function detectWebsite(outletName: string): Promise<string | null> {
  try {
    // Step 1 – Known verified outlets (short‑circuit for speed)
    const knownSites: Record<string, string> = {
      "The Hindu": "https://www.thehindu.com",
      "The Times of India": "https://timesofindia.indiatimes.com",
      "Indian Express": "https://indianexpress.com",
      "Hindustan Times": "https://www.hindustantimes.com",
      "NDTV": "https://www.ndtv.com",
      "News18": "https://www.news18.com",
      "Aaj Tak": "https://www.aajtak.in",
      "BBC": "https://www.bbc.com",
      "CNN": "https://edition.cnn.com",
    };

    // Step 2 – Normalize user input
    const cleaned = outletName.trim().toLowerCase();
    const matchedKey = Object.keys(knownSites).find(
      (k) => k.toLowerCase() === cleaned
    );
    if (matchedKey) return knownSites[matchedKey];

    // Step 3 – Try DuckDuckGo HTML search (no paid API)
    const resp = await fetch(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(
        outletName + " official news site"
      )}`
    );
    const html = await resp.text();

    const match = html.match(/<a[^>]+href="(https?:\/\/[^"]+)"/i);
    if (match && match[1]) {
      const cleanUrl = match[1]
        .replace(/(&amp;|\?.+)$/, "")
        .replace(/\/$/, "");
      if (cleanUrl.includes(".") && !cleanUrl.includes("duckduckgo"))
        return cleanUrl;
    }

    return null;
  } catch (err) {
    console.error("detectWebsite error:", err);
    return null;
  }
}

// ------------------------------------------------------------
// Journalist Extraction – connects frontend to backend API
// ------------------------------------------------------------
export async function extractJournalists(websiteUrl: string) {
  if (!websiteUrl)
    throw new Error("No website URL provided for journalist extraction.");

  try {
    const response = await fetch("http://localhost:3001/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: websiteUrl }), // backend expects { url }
    });

    // Handle connection errors or backend failures
    if (!response.ok) {
      let message = "Backend scraper failed";
      try {
        const err = await response.json();
        message = err.error || message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    // Parse and return only journalist array
    const data = await response.json();
    if (data.journalists && Array.isArray(data.journalists)) {
      console.log(
        `✓ Received ${data.journalists.length} journalist records from backend`
      );
      return data.journalists;
    }

    if (data.error) throw new Error(data.error);
    return [];
  } catch (err) {
    console.error("extractJournalists error:", err);

    // ✅ Add this visual alert handler here
    alert(`⚠️ Failed to connect to backend (${(err as Error).message})`);
    
    throw err;
  }
}
