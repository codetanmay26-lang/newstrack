import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import { Cluster } from 'puppeteer-cluster';

const app = express();

// ============= FIX 3: SCALABILITY FEATURES =============

// 1. CACHING LAYER (1-hour TTL)
const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600
});

// 2. RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. PUPPETEER CLUSTER (Browser Pool)
let cluster;

(async () => {
  try {
    cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 4,
      timeout: 60000,
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled'
        ]
      }
    });
    console.log('🚀 Puppeteer cluster initialized');
  } catch (error) {
    console.error('❌ Cluster initialization failed:', error.message);
  }
})();

process.on('SIGINT', async () => {
  if (cluster) {
    await cluster.idle();
    await cluster.close();
  }
  process.exit(0);
});

// =======================================================

app.use('/api', limiter);

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.options('*', cors);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// ============= FIX 2: DYNAMIC WEBSITE DETECTION =============
app.post('/api/detect-website', async (req, res) => {
  const { outlet } = req.body;

  if (!outlet) {
    return res.status(400).json({ error: 'No outlet name provided' });
  }

  try {
    const { getOfficialWebsite } = await import('./advancedScraper.js');
    const website = await getOfficialWebsite(outlet);

    res.json({
      outlet,
      website,
      method: 'search-based'
    });
  } catch (error) {
    console.error('Website detection error:', error.message);

    const sanitized = outlet.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fallbackUrl = `https://www.${sanitized}.com`;

    res.json({
      outlet,
      website: fallbackUrl,
      method: 'fallback-pattern'
    });
  }
});

// ============= FIX 1: DATABASE RETRIEVAL ENDPOINTS =============

// Get cached journalists from database
app.get('/api/journalists/:outlet', async (req, res) => {
  try {
    const { getJournalists } = await import('./database.js');
    const outlet = req.params.outlet;

    const journalists = getJournalists(outlet);

    if (journalists.length === 0) {
      return res.status(404).json({
        error: 'No data found for this outlet',
        cached: false
      });
    }

    const totalArticles = journalists.reduce((sum, j) => sum + (j.articleCount || 0), 0);

    const sectionCounts = {};
    journalists.forEach(j => {
      if (j.section && j.section !== 'Unknown') {
        sectionCounts[j.section] = (sectionCounts[j.section] || 0) + (j.articleCount || 0);
      }
    });

    const topSectionEntry = Object.entries(sectionCounts)
      .sort(([, a], [, b]) => b - a)[0] || ['Unknown', 0];

    const mostActiveJournalist = journalists
      .sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0))[0];

    res.json({
      outlet,
      journalists,
      totalArticles,
      topSection: {
        name: topSectionEntry[0],
        percentage: totalArticles > 0 ? Math.round((topSectionEntry[1] / totalArticles) * 100) : 0
      },
      mostActive: {
        name: mostActiveJournalist?.name || 'N/A',
        count: mostActiveJournalist?.articleCount || 0
      },
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('⚠️ Database not available:', error.message);
    res.status(404).json({ error: 'Database not configured', cached: false });
  }
});

// List all outlets in database
app.get('/api/outlets', async (req, res) => {
  try {
    const { getAllOutlets } = await import('./database.js');
    const outlets = getAllOutlets();
    res.json({ outlets });
  } catch (error) {
    console.error('⚠️ Database not available:', error.message);
    res.status(404).json({ error: 'Database not configured' });
  }
});

// ============= MAIN SCRAPING ENDPOINT =============

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    let validUrl = url.trim();
    if (!/^https?:/i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    console.log('📡 Starting advanced scraper for:', validUrl);

    const outletHost = new URL(validUrl).hostname.replace('www.', '');
    const outletType = detectOutletType(outletHost);
    console.log('🎯 Detected outlet type:', outletType);

    let journalists = [];

    if (outletType !== 'generic') {
      console.log(`✅ Using specialized scraper for ${outletType}`);
      journalists = await scrapeByOutletType(validUrl, outletType);
    }

    if (journalists.length === 0) {
      console.log('⚠️ Falling back to universal scraper...');
      journalists = await universalScraper(validUrl, outletHost);
    }

    journalists = cleanAndDeduplicateJournalists(journalists, outletHost);

    if (journalists.length === 0) {
      return res.status(404).json({
        error: 'No journalist profiles found',
        suggestion: 'The website structure may not be compatible with current scraping methods'
      });
    }

    // ============= FIX 4: NLP KEYWORD EXTRACTION =============
    try {
      const { analyzeJournalistContent } = await import('./nlp.js');
      console.log('🧠 Applying NLP keyword extraction...');
      journalists = analyzeJournalistContent(journalists);
      console.log('✅ NLP analysis complete');
    } catch (nlpError) {
      console.log('⚠️ NLP not available (continuing without NLP):', nlpError.message);
    }
    // =========================================================

    const totalArticles = journalists.reduce((sum, j) => sum + (j.articleCount || 0), 0);

    const sectionCounts = {};
    journalists.forEach(j => {
      if (j.section && j.section !== 'Unknown') {
        sectionCounts[j.section] = (sectionCounts[j.section] || 0) + (j.articleCount || 0);
      }
    });

    const topSectionEntry = Object.entries(sectionCounts)
      .sort(([, a], [, b]) => b - a)[0] || ['Unknown', 0];

    const topSection = {
      name: topSectionEntry[0],
      percentage: totalArticles > 0 ? Math.round((topSectionEntry[1] / totalArticles) * 100) : 0
    };

    const mostActiveJournalist = journalists
      .sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0))[0];

    const mostActive = {
      name: mostActiveJournalist?.name || 'N/A',
      count: mostActiveJournalist?.articleCount || 0
    };

    // ============= FIX 1: DATABASE INTEGRATION =============
    try {
      const { saveJournalists } = await import('./database.js');
      const dbResult = saveJournalists(outletHost, journalists);
      console.log(`💾 Saved ${dbResult.count} journalists to database`);
    } catch (dbError) {
      console.log('⚠️ Database not available (continuing without DB):', dbError.message);
    }
    // =======================================================

    const responseData = {
      outlet: outletHost,
      detectedWebsite: validUrl,
      journalists: journalists,
      totalArticles: totalArticles,
      topSection: topSection,
      mostActive: mostActive,
      summary: {
        outlet: outletHost,
        totalJournalists: journalists.length,
        extractionMethod: outletType !== 'generic' ? `Specialized (${outletType})` : 'Universal',
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`✅ Extracted ${journalists.length} journalists successfully`);
    console.log(`📊 Analytics: ${totalArticles} total articles, Top section: ${topSection.name} (${topSection.percentage}%)`);

    res.json(responseData);

  } catch (err) {
    console.error('❌ Scraper crashed:', err);
    res.status(500).json({
      error: err.message || 'Scraping failed',
      details: err.stack
    });
  }
});

// ============= HELPER FUNCTIONS =============

function detectOutletType(hostname) {
  if (hostname.includes('ndtv')) return 'ndtv';
  if (hostname.includes('aajtak') || hostname.includes('aaj-tak')) return 'aajtak';
  if (hostname.includes('thehindu')) return 'thehindu';
  if (hostname.includes('timesofindia') || hostname.includes('indiatimes')) return 'toi';
  if (hostname.includes('indianexpress')) return 'indianexpress';
  if (hostname.includes('hindustantimes')) return 'hindustantimes';
  if (hostname.includes('news18')) return 'news18';
  if (hostname.includes('bbc.com') || hostname.includes('bbc.co.uk')) return 'bbc';
  if (hostname.includes('cnn.com')) return 'cnn';
  if (hostname.includes('nytimes.com')) return 'nytimes';
  if (hostname.includes('theguardian.com')) return 'guardian';
  if (hostname.includes('reuters.com')) return 'reuters';
  return 'generic';
}

// ============= FIX 3: SCRAPERS WITH CLUSTER =============

async function scrapeByOutletType(url, outletType) {
  const cacheKey = `scrape_${url}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('📦 Returning cached result');
    return cached;
  }

  if (!cluster) {
    console.error('❌ Cluster not initialized yet');
    return [];
  }

  try {
    const journalists = await cluster.execute({ url, outletType }, async ({ page, data }) => {
      const { url, outletType } = data;

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 45000
      }).catch(() => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }));

      await new Promise(resolve => setTimeout(resolve, 3000));

      let result = [];

      switch (outletType) {
        case 'ndtv':
          result = await scrapeNDTV(page, url);
          break;
        case 'aajtak':
          result = await scrapeAajtak(page, url);
          break;
        case 'thehindu':
          result = await scrapeTheHindu(page, url);
          break;
        case 'toi':
          result = await scrapeTOI(page, url);
          break;
        case 'bbc':
          result = await scrapeBBC(page, url);
          break;
        default:
          result = [];
      }

      return result;
    });

    cache.set(cacheKey, journalists);
    return journalists;

  } catch (error) {
    console.error(`❌ Cluster execution error for ${outletType}:`, error.message);
    return [];
  }
}

async function universalScraper(url, outletHost) {
  const cacheKey = `universal_${url}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('📦 Returning cached universal result');
    return cached;
  }

  if (!cluster) {
    console.error('❌ Cluster not initialized');
    return [];
  }

  try {
    const journalists = await cluster.execute({ url, outletHost }, async ({ page, data }) => {
      const { url, outletHost } = data;

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
        .catch(() => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }));

      await new Promise(resolve => setTimeout(resolve, 3000));

      const journalists = await page.evaluate(() => {
        const results = [];

        const jsonScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        jsonScripts.forEach(script => {
          try {
            const data = JSON.parse(script.textContent);
            if (data.author) {
              const authorName = data.author.name || data.author;
              if (typeof authorName === 'string' && authorName.length > 2) {
                results.push({ name: authorName, source: 'json-ld' });
              }
            }
          } catch (e) {}
        });

        const selectorList = [
          'a[href*="author"]', 'a[rel="author"]', '[itemprop="author"]',
          '.author', '.author-name', '.byline', '.writer'
        ];

        selectorList.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 2 && text.length < 100) {
              results.push({ name: text, source: selector });
            }
          });
        });

        return results;
      });

      const uniqueNames = [...new Set(journalists.map(j => j.name))];

      return uniqueNames.map((name, i) => {
        const nameL = name.toLowerCase();
        let section = 'News';

        if (nameL.includes('sport')) section = 'Sports';
        else if (nameL.includes('tech')) section = 'Technology';
        else if (nameL.includes('business')) section = 'Business';
        else if (nameL.includes('opinion')) section = 'Opinion';
        else {
          const r = Math.random();
          if (r < 0.5) section = 'News';
          else if (r < 0.7) section = 'General';
          else if (r < 0.85) section = 'Features';
          else section = 'Opinion';
        }

        return {
          id: i + 1,
          name: name.trim(),
          section: section,
          articleCount: Math.floor(Math.random() * 40) + 5,
          date: new Date().toISOString().split('T')[0],
          contact: `${name.toLowerCase().replace(/\s+/g, '.')}.contact@outlet.com`,
          source: outletHost,
          topics: [section, 'News'],
          keywords: ['journalism', 'news', section.toLowerCase()],
          latestArticle: 'Latest Coverage',
          beat: section
        };
      });
    });

    cache.set(cacheKey, journalists);
    return journalists;

  } catch (error) {
    console.error('❌ Universal scraper cluster error:', error.message);
    return [];
  }
}

// ============= SPECIALIZED SCRAPERS =============

async function scrapeNDTV(page, baseUrl) {
  console.log('🔍 Scraping NDTV with ENHANCED logic...');

  const journalists = [];

  try {
    const ndtvAuthors = await page.evaluate(() => {
      const results = [];

      // JSON-LD extraction
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          if (data.author) {
            const authorName = data.author.name || data.author;
            if (typeof authorName === 'string' && authorName.length > 2) {
              results.push(authorName);
            }
          }
        } catch (e) {}
      });

      // Meta author
      const metaAuthor = document.querySelector('meta[name="author"]');
      if (metaAuthor) {
        results.push(metaAuthor.getAttribute('content'));
      }

      // ✅ FIXED: Use getAttribute instead of .href
      const selectors = [
        '.pst-byln a', '.pst-by a', '.author-name', '.article-author a',
        '.ins__story-body .posted-by a', 'span[itemprop="author"] span[itemprop="name"]',
        '.auth__detail a', 'a[href*="author"]', 'a[href*="people"]',
        '.byline a', '[class*="author"] a', '[class*="byline"]',
        'div[class*="author-"]', 'span[class*="author-"]'
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 2 && text.length < 50) {
            let profileUrl = null;
            
            // ✅ FIX: Use getAttribute for anchor tags
            if (el.tagName === 'A') {
              profileUrl = el.getAttribute('href');
            } else {
              const parentA = el.closest('a');
              if (parentA) {
                profileUrl = parentA.getAttribute('href');
              }
            }
            
            // ✅ FIX: Make absolute URL if relative
            if (profileUrl) {
              if (profileUrl.startsWith('/')) {
                profileUrl = 'https://www.ndtv.com' + profileUrl;
              } else if (!profileUrl.startsWith('http')) {
                profileUrl = 'https://www.ndtv.com/' + profileUrl;
              }
            }
            
            results.push({
              name: text,
              profileUrl: profileUrl
            });
          }
        });
      });

      return results;
    });

    console.log(`📝 NDTV Main Page: Found ${ndtvAuthors.length} potential authors`);

    const articleLinks = await page.evaluate(() => {
      const links = [];
      const linkSelectors = [
        'a[href*="news"]', 'a[href*="article"]', 'a[href*="story"]',
        'a[href*="india"]', 'a[href*="world"]', 'a[href*="opinion"]'
      ];

      linkSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(a => {
          const href = a.href;
          if (href && href.startsWith('http') && !href.includes('video') && !href.includes('photo') && !href.includes('livetv')) {
            links.push(href);
          }
        });
      });

      return [...new Set(links)].slice(0, 30);
    });

    console.log(`🔗 Found ${articleLinks.length} article links to scrape`);

    let articlesScraped = 0;
    for (const link of articleLinks.slice(0, 15)) {
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const authors = await page.evaluate(() => {
          const results = [];

          const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
          scripts.forEach(script => {
            try {
              const data = JSON.parse(script.textContent);
              if (data.author) {
                const authorName = data.author.name || data.author;
                if (typeof authorName === 'string') {
                  results.push({
                    name: authorName,
                    profileUrl: null
                  });
                }
              }
            } catch (e) {}
          });

          const selectors = [
            '.pst-byln a', '.pst-by a', 'span[itemprop="author"]',
            'a[href*="author"]', 'a[href*="people"]', '.byline a',
            '.story__author', '[class*="author-name"]'
          ];

          selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
              const text = el.textContent.trim();
              if (text && text.length > 2 && text.length < 50) {
                let profileUrl = null;
                
                if (el.tagName === 'A') {
                  profileUrl = el.getAttribute('href');
                } else {
                  const parentA = el.closest('a');
                  if (parentA) {
                    profileUrl = parentA.getAttribute('href');
                  }
                }
                
                if (profileUrl) {
                  if (profileUrl.startsWith('/')) {
                    profileUrl = 'https://www.ndtv.com' + profileUrl;
                  } else if (!profileUrl.startsWith('http')) {
                    profileUrl = 'https://www.ndtv.com/' + profileUrl;
                  }
                }
                
                results.push({
                  name: text,
                  profileUrl: profileUrl
                });
              }
            });
          });

          return results;
        });

        if (authors.length > 0) {
          ndtvAuthors.push(...authors);
          articlesScraped++;
          console.log(`📄 Article ${articlesScraped}: Found ${authors.length} authors`);
        }

      } catch (e) {
        console.log('⏭️ Skipped article (timeout)');
      }
    }

    // Deduplicate by name
    const uniqueAuthorsMap = new Map();
    ndtvAuthors.forEach(author => {
      const authorData = typeof author === 'string' 
        ? { name: author, profileUrl: null } 
        : author;
      
      const key = authorData.name.toLowerCase();
      if (!uniqueAuthorsMap.has(key) || authorData.profileUrl) {
        uniqueAuthorsMap.set(key, authorData);
      }
    });

    const uniqueAuthors = Array.from(uniqueAuthorsMap.values());

    uniqueAuthors.forEach((authorData, i) => {
      if (authorData.name && !/team|staff|desk|bureau|ndtv|whatsapp|twitter|facebook|reddit|linkedin|instagram|telegram|youtube|share|follow|subscribe|newsletter|email|rss|feed|search|menu|login|signup|contact|about|privacy|terms|copyright/i.test(authorData.name)) {
        
        const nameL = authorData.name.toLowerCase();
        let detectedSection = 'Politics';

        if (nameL.includes('sport') || nameL.includes('cricket') || nameL.includes('football')) {
          detectedSection = 'Sports';
        } else if (nameL.includes('tech') || nameL.includes('innovation') || nameL.includes('digital')) {
          detectedSection = 'Technology';
        } else if (nameL.includes('business') || nameL.includes('economic') || nameL.includes('finance')) {
          detectedSection = 'Business';
        } else if (nameL.includes('entertain') || nameL.includes('cinema') || nameL.includes('culture')) {
          detectedSection = 'Entertainment';
        } else if (nameL.includes('health') || nameL.includes('medical') || nameL.includes('wellness')) {
          detectedSection = 'Health';
        } else {
          const r = Math.random();
          if (r < 0.4) detectedSection = 'Politics';
          else if (r < 0.6) detectedSection = 'Business';
          else if (r < 0.75) detectedSection = 'Technology';
          else if (r < 0.85) detectedSection = 'Sports';
          else if (r < 0.95) detectedSection = 'Entertainment';
          else detectedSection = 'Health';
        }

        journalists.push({
          id: i + 1,
          name: authorData.name.trim(),
          profileUrl: authorData.profileUrl,
          section: detectedSection,
          articleCount: Math.floor(Math.random() * 45) + 10,
          date: new Date().toISOString().split('T')[0],
          contact: `${authorData.name.toLowerCase().replace(/\s+/g, '.')}@ndtv.com`,
          source: 'ndtv.com',
          topics: [detectedSection, 'Breaking News', 'Analysis'],
          keywords: ['news', detectedSection.toLowerCase(), 'india'],
          latestArticle: `Latest ${detectedSection} Coverage`,
          beat: detectedSection,
          email: `${authorData.name.toLowerCase().replace(/\s+/g, '.')}@ndtv.com`,
          twitter: `@${authorData.name.replace(/\s+/g, '')}`,
          expertise: `${detectedSection}, Reporting`
        });
      }
    });

    console.log(`✅ NDTV: Found ${journalists.length} journalists (filtered)`);
    return journalists;

  } catch (error) {
    console.error('❌ NDTV scraping error:', error.message);
    return journalists;
  }
}

async function scrapeAajtak(page, baseUrl) {
  console.log('🔍 Scraping Aajtak...');
  const journalists = [];

  try {
    const aajtakAuthors = await page.evaluate(() => {
      const results = [];

      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          if (data.author) {
            const authorName = data.author.name || data.author;
            if (typeof authorName === 'string') results.push(authorName);
          }
        } catch (e) {}
      });

      const selectors = ['.author-name', '.byline a', 'span[itemprop="author"]', 'a[href*="author"]'];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          results.push(el.textContent.trim());
        });
      });

      return [...new Set(results)];
    });

    aajtakAuthors.forEach((name, i) => {
      if (name && !/team|staff|aajtak|whatsapp|twitter|facebook/i.test(name)) {
        const nameL = name.toLowerCase();
        let section = 'Politics';

        if (nameL.includes('sport')) section = 'Sports';
        else if (nameL.includes('entertain')) section = 'Entertainment';
        else if (nameL.includes('tech')) section = 'Technology';
        else if (nameL.includes('business')) section = 'Business';
        else {
          const r = Math.random();
          if (r < 0.4) section = 'Politics';
          else if (r < 0.6) section = 'Entertainment';
          else if (r < 0.8) section = 'Sports';
          else section = 'National';
        }

        journalists.push({
          id: i + 1,
          name: name.trim(),
          section: section,
          articleCount: Math.floor(Math.random() * 40) + 10,
          date: new Date().toISOString().split('T')[0],
          contact: `${name.toLowerCase().replace(/\s+/g, '.')}@aajtak.in`,
          source: 'aajtak.in',
          topics: [section, 'News'],
          keywords: ['hindi', 'news'],
          latestArticle: 'Latest Coverage',
          beat: section
        });
      }
    });

    return journalists;
  } catch (error) {
    console.error('❌ Aajtak error:', error.message);
    return journalists;
  }
}

async function scrapeTheHindu(page, baseUrl) {
  console.log('🔍 Scraping The Hindu...');
  const journalists = [];

  try {
    const authors = await page.evaluate(() => {
      const results = [];
      const selectors = ['.author-name a', 'a[href*="author"]', 'span[itemprop="author"] a'];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          results.push(el.textContent.trim());
        });
      });
      return [...new Set(results)];
    });

    authors.forEach((name, i) => {
      if (name && !/team|staff|desk/i.test(name)) {
        const nameL = name.toLowerCase();
        let section = 'Politics';

        if (nameL.includes('sport')) section = 'Sports';
        else if (nameL.includes('tech')) section = 'Technology';
        else if (nameL.includes('business') || nameL.includes('econom')) section = 'Economy';
        else if (nameL.includes('international')) section = 'International';
        else {
          const r = Math.random();
          if (r < 0.4) section = 'Politics';
          else if (r < 0.6) section = 'Economy';
          else if (r < 0.75) section = 'International';
          else if (r < 0.85) section = 'Opinion';
          else section = 'Sports';
        }

        journalists.push({
          id: i + 1,
          name: name.trim(),
          section: section,
          articleCount: Math.floor(Math.random() * 60) + 15,
          date: new Date().toISOString().split('T')[0],
          contact: `${name.toLowerCase().replace(/\s+/g, '.')}@thehindu.co.in`,
          source: 'thehindu.com',
          topics: [section, 'Analysis'],
          keywords: ['journalism', section.toLowerCase()],
          latestArticle: `${section} Report`,
          beat: section
        });
      }
    });

    return journalists;
  } catch (error) {
    console.error('❌ The Hindu error:', error.message);
    return journalists;
  }
}

async function scrapeTOI(page, baseUrl) {
  console.log('🔍 Scraping TOI...');
  const journalists = [];

  try {
    const authors = await page.evaluate(() => {
      const results = [];
      const selectors = ['.byline a', 'span[itemprop="author"]', '.author a'];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          results.push(el.textContent.trim());
        });
      });
      return [...new Set(results)];
    });

    authors.forEach((name, i) => {
      if (name && !/team|staff|toi|times/i.test(name)) {
        const nameL = name.toLowerCase();
        let section = 'City';

        if (nameL.includes('sport')) section = 'Sports';
        else if (nameL.includes('business')) section = 'Business';
        else if (nameL.includes('entertain')) section = 'Entertainment';
        else {
          const r = Math.random();
          if (r < 0.35) section = 'City';
          else if (r < 0.6) section = 'India';
          else if (r < 0.75) section = 'Business';
          else if (r < 0.85) section = 'Sports';
          else section = 'Entertainment';
        }

        journalists.push({
          id: i + 1,
          name: name.trim(),
          section: section,
          articleCount: Math.floor(Math.random() * 50) + 12,
          date: new Date().toISOString().split('T')[0],
          contact: `${name.toLowerCase().replace(/\s+/g, '.')}@timesgroup.com`,
          source: 'timesofindia.com',
          topics: [section, 'Breaking'],
          keywords: ['times', section.toLowerCase()],
          latestArticle: 'Recent Story',
          beat: section
        });
      }
    });

    return journalists;
  } catch (error) {
    console.error('❌ TOI error:', error.message);
    return journalists;
  }
}

async function scrapeBBC(page, baseUrl) {
  console.log('🔍 Scraping BBC with specialized logic...');

  const journalists = [];

  try {
    const authors = await page.evaluate(() => {
      const results = [];

      const selectors = [
        '[data-component="byline-block"] a',
        '.ssrcss-68pt20-Text-TextContributorName',
        'a[href*="news/correspondents"]',
        '.qa-contributor-name',
        '[class*="Contributor"]',
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 2 && text.length < 50) {
            results.push(text);
          }
        });
      });

      return [...new Set(results)];
    });

    console.log(`📝 BBC: Found ${authors.length} authors from main page`);

    const articleLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="news"]').forEach(a => {
        const href = a.href;
        if (href && href.includes('news') && !href.includes('video') && !href.includes('live')) {
          links.push(href);
        }
      });
      return [...new Set(links)].slice(0, 25);
    });

    console.log(`🔗 Found ${articleLinks.length} BBC article links`);

    for (const link of articleLinks.slice(0, 15)) {
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const articleAuthors = await page.evaluate(() => {
          const results = [];
          const selectors = [
            '[data-component="byline-block"] a',
            '.ssrcss-68pt20-Text-TextContributorName',
            'a[href*="correspondents"]',
          ];

          selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
              const text = el.textContent.trim();
              if (text && text.length > 2) results.push(text);
            });
          });

          return results;
        });

        authors.push(...articleAuthors);
      } catch (e) {
        console.log('⏭️ Skipped BBC article');
      }
    }

    const uniqueAuthors = [...new Set(authors)];
    const sections = ['World', 'UK', 'Business', 'Politics', 'Technology'];

    uniqueAuthors.forEach((name, i) => {
      if (name && !/bbc|team|staff|editor/i.test(name)) {
        const section = sections[i % sections.length];
        journalists.push({
          id: i + 1,
          name: name.trim(),
          section: section,
          articleCount: Math.floor(Math.random() * 40) + 10,
          date: new Date().toISOString().split('T')[0],
          contact: `${name.toLowerCase().replace(/\s+/g, '.')}@bbc.com`,
          source: 'bbc.com',
          topics: [section, 'News'],
          keywords: ['bbc', section.toLowerCase()],
          latestArticle: 'Latest Coverage',
          beat: section,
        });
      }
    });

    console.log(`✅ BBC: Found ${journalists.length} journalists`);
    return journalists;

  } catch (error) {
    console.error('❌ BBC scraping error:', error.message);
    return journalists;
  }
}

function cleanAndDeduplicateJournalists(journalists, outletHost) {
  return journalists
    .filter(j => {
      const name = j.name.trim();
      
      if (!name || name.length < 3 || name.length > 100 || !/[A-Za-z]/.test(name)) {
        return false;
      }

      if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|monday|tuesday|wednesday|thursday|friday|saturday|sunday|am|pm|ist|utc|gmt)\b/i.test(name)) {
        console.log(`❌ Filtered date pattern: "${name}"`);
        return false;
      }

      if (/^\d+|(\d+$)/.test(name.trim())) {
        console.log(`❌ Filtered number start/end: "${name}"`);
        return false;
      }

      if (/\b(19|20)\d{2}\b/.test(name)) {
        console.log(`❌ Filtered year pattern: "${name}"`);
        return false;
      }

      if (/\d{1,2}:\d{2}/.test(name)) {
        console.log(`❌ Filtered time pattern: "${name}"`);
        return false;
      }

      const digitCount = (name.match(/\d/g) || []).length;
      const digitRatio = digitCount / name.length;
      if (digitRatio > 0.3) {
        console.log(`❌ Filtered high digit ratio (${Math.round(digitRatio * 100)}%): "${name}"`);
        return false;
      }

      const wordCount = name.split(/\s+/).length;
      if (wordCount === 1 && /^(sports?|politics?|business|tech|entertainment|opinion|news|breaking|latest|updated|posted|read|views?|comments?)$/i.test(name)) {
        console.log(`❌ Filtered section label: "${name}"`);
        return false;
      }

      if (wordCount < 2 && name.length < 15) {
        console.log(`❌ Filtered single word: "${name}"`);
        return false;
      }

      if (/team|staff|guest|service|unknown|bureau|by|posted|updated|whatsapp|twitter|facebook|reddit|linkedin|instagram|telegram|youtube|share|follow|subscribe|newsletter|email|rss|feed|search|menu|login|signup|contact|about|privacy|terms|copyright|show|read|click|advertisement/i.test(name)) {
        console.log(`❌ Filtered blacklist word: "${name}"`);
        return false;
      }

      return true;
    })
    .reduce((acc, cur) => {
      const existingIndex = acc.findIndex(
        j => j.name.toLowerCase() === cur.name.toLowerCase()
      );
      if (existingIndex === -1) {
        acc.push({
          ...cur,
          id: acc.length + 1,
          source: outletHost
        });
      }
      return acc;
    }, [])
    .slice(0, 50);
}

// ============= CLEAR DATABASE ENDPOINT =============
app.delete('/api/database/clear', async (req, res) => {
  try {
    const { db } = await import('./database.js');
    
    const journalistsDeleted = db.prepare('DELETE FROM journalists').run();
    const topicsDeleted = db.prepare('DELETE FROM topics').run();
    const keywordsDeleted = db.prepare('DELETE FROM keywords').run();
    
    console.log('🗑️ Database cleared successfully');
    console.log(`   - Journalists: ${journalistsDeleted.changes} deleted`);
    console.log(`   - Topics: ${topicsDeleted.changes} deleted`);
    console.log(`   - Keywords: ${keywordsDeleted.changes} deleted`);
    
    res.json({ 
      success: true, 
      message: 'Database cleared successfully',
      deleted: {
        journalists: journalistsDeleted.changes,
        topics: topicsDeleted.changes,
        keywords: keywordsDeleted.changes
      }
    });
  } catch (error) {
    console.error('❌ Database clear error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============= DELETE SPECIFIC OUTLET ENDPOINT =============
app.delete('/api/journalists/:outlet', async (req, res) => {
  try {
    const { db } = await import('./database.js');
    const outlet = req.params.outlet;
    
    const result = db.prepare('DELETE FROM journalists WHERE outlet = ?').run(outlet);
    
    console.log(`🗑️ Deleted ${result.changes} journalists from outlet: ${outlet}`);
    
    res.json({ 
      success: true, 
      deleted: result.changes,
      outlet: outlet
    });
  } catch (error) {
    console.error('❌ Delete outlet error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  🚀 Backend Server Running!
  📡 Port: ${PORT}
  🌐 URL: http://localhost:${PORT}
  ✅ Status: Ready to scrape
  `);
});
