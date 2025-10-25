export async function detectWebsite(outletName: string): Promise<string | null> {
  try {
    const knownSites: Record<string, string> = {
      "The Hindu": "https://www.thehindu.com",
      "The Times of India": "https://timesofindia.indiatimes.com",
      "Indian Express": "https://indianexpress.com",
      "Hindustan Times": "https://www.hindustantimes.com",
      "NDTV": "https://www.ndtv.com",
      "News18": "https://www.news18.com",
      "Aaj Tak": "https://www.aajtak.in",
      "Aajtak": "https://www.aajtak.in",
      "BBC": "https://www.bbc.com",
      "CNN": "https://edition.cnn.com",
      "New York Times": "https://www.nytimes.com",
      "The Guardian": "https://www.theguardian.com",
      "Reuters": "https://www.reuters.com",
    };

    const cleaned = outletName.trim().toLowerCase();
    const matchedKey = Object.keys(knownSites).find(
      (k) => k.toLowerCase() === cleaned
    );
    if (matchedKey) return knownSites[matchedKey];

    const sanitized = outletName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://www.${sanitized}.com`;
  } catch (err) {
    console.error("detectWebsite error:", err);
    return null;
  }
}

export async function extractJournalists(websiteUrl: string) {
  if (!websiteUrl) {
    throw new Error('No website URL provided for journalist extraction.');
  }

  try {
    console.log('🔗 Checking backend connection via proxy...');
    
    const healthCheck = await fetch('/api/health', {
      method: 'GET',
    });

    if (!healthCheck.ok) {
      throw new Error('Backend health check failed');
    }

    const healthData = await healthCheck.json();
    console.log('✅ Backend connection verified:', healthData.message);

  } catch (healthError) {
    console.error('❌ Backend health check error:', healthError);
    alert('❌ Backend Connection Failed!\n\nPlease make sure:\n1. Backend server is running (npm run server)\n2. Backend shows "Backend Server Running on port 3001"\n3. No errors in backend terminal');
    throw new Error('Backend server is not accessible');
  }

  try {
    console.log('📤 Sending scrape request via proxy for:', websiteUrl);

    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: websiteUrl }),
    });

    if (!response.ok) {
      let message = 'Backend scraper failed';
      try {
        const err = await response.json();
        message = err.error || message;
        if (err.suggestion) {
          message += `\n\nSuggestion: ${err.suggestion}`;
        }
      } catch {
        message = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(message);
    }

    const data = await response.json();
    
    if (data.summary) {
      console.log('📊 Extraction Summary:', data.summary);
      console.log(`📊 Total Articles: ${data.totalArticles}`);
      console.log(`📊 Top Section: ${data.topSection?.name} (${data.topSection?.percentage}%)`);
      console.log(`📊 Most Active: ${data.mostActive?.name} (${data.mostActive?.count} articles)`);
    }
    
    if (data.journalists && Array.isArray(data.journalists)) {
      console.log(`✅ Received ${data.journalists.length} journalist records from backend`);
      
      return {
        journalists: data.journalists,
        totalArticles: data.totalArticles || data.journalists.reduce((sum, j) => sum + (j.articleCount || 0), 0),
        topSection: data.topSection || { name: 'Unknown', percentage: 0 },
        mostActive: data.mostActive || { name: 'N/A', count: 0 },
        outlet: data.outlet,
        detectedWebsite: data.detectedWebsite
      };
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      journalists: [],
      totalArticles: 0,
      topSection: { name: 'Unknown', percentage: 0 },
      mostActive: { name: 'N/A', count: 0 },
      outlet: '',
      detectedWebsite: websiteUrl
    };
    
  } catch (err) {
    console.error('❌ extractJournalists error:', err);
    throw err;
  }
}