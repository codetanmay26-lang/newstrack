export async function detectWebsite(outletName: string): Promise<string | null> {
  try {
    console.log(`🔍 Detecting official website for: "${outletName}"`);

    // Call backend to use advancedScraper's getOfficialWebsite function
    const response = await fetch('/api/detect-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ outlet: outletName }),
    });

    if (!response.ok) {
      throw new Error('Website detection API failed');
    }

    const data = await response.json();
    
    if (data.website) {
      console.log(`✅ Detected: ${data.website}`);
      return data.website;
    }

    // Fallback: pattern-based
    const sanitized = outletName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fallbackUrl = `https://www.${sanitized}.com`;
    console.log(`⚠️ Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;

  } catch (err) {
    console.error("❌ detectWebsite error", err);
    
    // Final fallback
    const sanitized = outletName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://www.${sanitized}.com`;
  }
}

export async function extractJournalists(websiteUrl: string) {
  if (!websiteUrl) {
    throw new Error('No website URL provided for journalist extraction.');
  }

  try {
    console.log('🔌 Checking backend connection via proxy...');

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
    alert('Backend Connection Failed!\n\nMake sure:\n1. Backend server is running (npm run server)\n2. Backend shows "Backend Server Running on port 3001"\n3. No errors in backend terminal');
    throw new Error('Backend server is not accessible');
  }

  // ============= FIX 1: CHECK DATABASE FIRST =============
  try {
    // STEP 1: Check if data exists in database
    const outletSlug = new URL(websiteUrl).hostname.replace('www.', '');
    
    console.log('🔍 Checking database for cached data...');
    const cacheResponse = await fetch(`/api/journalists/${outletSlug}`);
    
    if (cacheResponse.ok) {
      const cachedData = await cacheResponse.json();
      console.log('✅ Found cached data in database:', cachedData.journalists.length, 'journalists');
      return cachedData;
    }

    console.log('📡 No cache found, fetching fresh data...');
  } catch (cacheError) {
    console.log('⚠️ Cache check skipped:', cacheError);
  }
  // =======================================================

  try {
    // STEP 2: Scrape fresh data
    console.log('📡 Sending scrape request via proxy for', websiteUrl);

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
          message += `\n${err.suggestion}`;
        }
      } catch {
        message = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(message);
    }

    const data = await response.json();

    if (data.summary) {
      console.log('📊 Extraction Summary:', data.summary);
      console.log(`📰 Total Articles: ${data.totalArticles}`);
      console.log(`📌 Top Section: ${data.topSection?.name} (${data.topSection?.percentage}%)`);
      console.log(`👤 Most Active: ${data.mostActive?.name} (${data.mostActive?.count} articles)`);
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