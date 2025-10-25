
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database file in backend directory
const db = new Database(join(__dirname, 'newstrack.db'), { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS journalists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outlet TEXT NOT NULL,
    name TEXT NOT NULL,
    section TEXT,
    articleCount INTEGER DEFAULT 0,
    latestArticle TEXT,
    date TEXT,
    contact TEXT,
    source TEXT,
    beat TEXT,
    email TEXT,
    twitter TEXT,
    expertise TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    UNIQUE(outlet, name)
  );

  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journalistId INTEGER NOT NULL,
    topic TEXT NOT NULL,
    FOREIGN KEY(journalistId) REFERENCES journalists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journalistId INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    FOREIGN KEY(journalistId) REFERENCES journalists(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_journalists_outlet ON journalists(outlet);
  CREATE INDEX IF NOT EXISTS idx_journalists_name ON journalists(name);
  CREATE INDEX IF NOT EXISTS idx_topics_journalist ON topics(journalistId);
  CREATE INDEX IF NOT EXISTS idx_keywords_journalist ON keywords(journalistId);
`);

// Prepared statements for performance
const insertJournalist = db.prepare(`
  INSERT OR REPLACE INTO journalists 
  (outlet, name, section, articleCount, latestArticle, date, contact, source, beat, email, twitter, expertise)
  VALUES (@outlet, @name, @section, @articleCount, @latestArticle, @date, @contact, @source, @beat, @email, @twitter, @expertise)
`);

const insertTopic = db.prepare(`
  INSERT INTO topics (journalistId, topic) VALUES (?, ?)
`);

const insertKeyword = db.prepare(`
  INSERT INTO keywords (journalistId, keyword) VALUES (?, ?)
`);

const getJournalistsByOutlet = db.prepare(`
  SELECT j.*, 
    GROUP_CONCAT(DISTINCT t.topic) as topics,
    GROUP_CONCAT(DISTINCT k.keyword) as keywords
  FROM journalists j
  LEFT JOIN topics t ON j.id = t.journalistId
  LEFT JOIN keywords k ON j.id = k.journalistId
  WHERE j.outlet = ?
  GROUP BY j.id
  ORDER BY j.articleCount DESC
`);

const deleteJournalistsByOutlet = db.prepare(`
  DELETE FROM journalists WHERE outlet = ?
`);

// ============================================
// API FUNCTIONS - ES6 EXPORTS
// ============================================

/**
 * Save journalists data to database
 * @param {string} outlet - The outlet hostname
 * @param {Array} journalistsData - Array of journalist objects
 * @returns {Object} - Result object with success status and count
 */
export function saveJournalists(outlet, journalistsData) {
  const transaction = db.transaction((outlet, journalists) => {
    // Delete existing data for this outlet
    deleteJournalistsByOutlet.run(outlet);

    journalists.forEach(journalist => {
      // Insert journalist
      const result = insertJournalist.run({
        outlet,
        name: journalist.name,
        section: journalist.section || 'General',
        articleCount: journalist.articleCount || 0,
        latestArticle: journalist.latestArticle || '',
        date: journalist.date || new Date().toISOString().split('T')[0],
        contact: journalist.contact || null,
        source: journalist.source || outlet,
        beat: journalist.beat || journalist.section || 'General',
        email: journalist.email || null,
        twitter: journalist.twitter || null,
        expertise: journalist.expertise || 'Reporting'
      });

      const journalistId = result.lastInsertRowid;

      // Insert topics
      if (journalist.topics && Array.isArray(journalist.topics)) {
        journalist.topics.forEach(topic => {
          if (topic) {
            try {
              insertTopic.run(journalistId, topic);
            } catch (e) {
              console.warn(`⚠️ Failed to insert topic "${topic}":`, e.message);
            }
          }
        });
      }

      // Insert keywords
      if (journalist.keywords && Array.isArray(journalist.keywords)) {
        journalist.keywords.forEach(keyword => {
          if (keyword) {
            try {
              insertKeyword.run(journalistId, keyword);
            } catch (e) {
              console.warn(`⚠️ Failed to insert keyword "${keyword}":`, e.message);
            }
          }
        });
      }
    });
  });

  transaction(outlet, journalistsData);
  return { success: true, count: journalistsData.length };
}

/**
 * Get all journalists for a specific outlet
 * @param {string} outlet - The outlet hostname
 * @returns {Array} - Array of journalist objects with topics and keywords
 */
export function getJournalists(outlet) {
  const rows = getJournalistsByOutlet.all(outlet);
  
  return rows.map(row => ({
    ...row,
    topics: row.topics ? row.topics.split(',') : [],
    keywords: row.keywords ? row.keywords.split(',') : []
  }));
}

/**
 * Get all outlets in database with metadata
 * @returns {Array} - Array of outlet objects with count and last update time
 */
export function getAllOutlets() {
  const rows = db.prepare(`
    SELECT DISTINCT outlet, COUNT(*) as count, MAX(createdAt) as lastUpdated
    FROM journalists
    GROUP BY outlet
    ORDER BY lastUpdated DESC
  `).all();
  return rows;
}

/**
 * Delete all data for a specific outlet
 * @param {string} outlet - The outlet hostname
 * @returns {Object} - Result object
 */
export function deleteOutlet(outlet) {
  const result = deleteJournalistsByOutlet.run(outlet);
  return { 
    success: true, 
    deleted: result.changes 
  };
}

/**
 * Get statistics about the database
 * @returns {Object} - Statistics object
 */
export function getDatabaseStats() {
  const totalJournalists = db.prepare('SELECT COUNT(*) as count FROM journalists').get();
  const totalOutlets = db.prepare('SELECT COUNT(DISTINCT outlet) as count FROM journalists').get();
  const totalTopics = db.prepare('SELECT COUNT(*) as count FROM topics').get();
  const totalKeywords = db.prepare('SELECT COUNT(*) as count FROM keywords').get();

  return {
    totalJournalists: totalJournalists.count,
    totalOutlets: totalOutlets.count,
    totalTopics: totalTopics.count,
    totalKeywords: totalKeywords.count
  };
}

// Export db for advanced usage (optional)
export { db };

// Log successful initialization
console.log('💾 Database module loaded successfully (ES6)');
console.log(`📂 Database location: ${join(__dirname, 'newstrack.db')}`);