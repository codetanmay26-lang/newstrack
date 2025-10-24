const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./newstrack.db');

// Table creation (if not exist)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS journalists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outlet TEXT,
    name TEXT,
    section TEXT,
    article_count INTEGER,
    latest_article TEXT,
    date TEXT,
    contact TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journalist_id INTEGER,
    topic TEXT,
    FOREIGN KEY(journalist_id) REFERENCES journalists(id)
  )`);
});

module.exports = db;
