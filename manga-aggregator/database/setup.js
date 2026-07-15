const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, 'manga.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS manga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    alt_titles TEXT,
    description TEXT,
    cover_url TEXT,
    local_cover TEXT,
    type TEXT DEFAULT 'manga',
    status TEXT,
    author TEXT,
    artist TEXT,
    genres TEXT,
    rating REAL DEFAULT 0,
    source_count INTEGER DEFAULT 0,
    latest_chapter REAL DEFAULT 0,
    chapter_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER,
    source TEXT,
    chapter_number REAL,
    chapter_title TEXT,
    pages TEXT,
    page_count INTEGER DEFAULT 0,
    release_date TEXT,
    url TEXT,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(manga_id) REFERENCES manga(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER,
    source_name TEXT,
    source_url TEXT,
    source_id TEXT,
    latest_chapter REAL DEFAULT 0,
    last_checked DATETIME,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(manga_id) REFERENCES manga(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cover_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER,
    source TEXT,
    cover_url TEXT,
    local_path TEXT,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(manga_id) REFERENCES manga(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS search_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER,
    search_text TEXT,
    FOREIGN KEY(manga_id) REFERENCES manga(id)
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_manga_title ON manga(title)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_manga_type ON manga(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_chapters_manga ON chapters(manga_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sources_manga ON sources(manga_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_search_text ON search_index(search_text)`);

  console.log('Database initialized at', DB_PATH);
});

db.close();
