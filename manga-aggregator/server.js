const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const axios = require('axios');
const Database = require('./database/db');
const ScraperEngine = require('./scraper/engine');
const { registerAllScrapers } = require('./scraper/sources');

const app = express();
const db = new Database();
const engine = new ScraperEngine();
registerAllScrapers(engine);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());

// ===== DEBUG & SEED ENDPOINTS (before static) =====
app.get('/api/debug/sources', (req, res) => {
  res.json({ count: engine.scrapers.size, sources: Array.from(engine.scrapers.keys()) });
});

app.get('/api/debug/test/:source', async (req, res) => {
  try {
    const scraper = engine.scrapers.get(req.params.source);
    if (!scraper) return res.status(404).json({ error: 'Source not found' });
    console.log(`Testing ${req.params.source}...`);
    const results = await scraper.searchManga('one punch man');
    res.json({ success: true, count: results.length, results: results.slice(0, 3) });
  } catch (err) {
    console.error(`Test error:`, err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.get('/api/seed', async (req, res) => {
  try {
    const demoManga = [
      {
        title: "One Punch Man",
        altTitles: ["ワンパンマン"],
        description: "The story of Saitama, a hero who can defeat any enemy with a single punch.",
        cover: "https://uploads.mangadex.org/covers/...",
        author: "ONE",
        artist: "Yusuke Murata",
        genres: ["Action", "Comedy", "Superhero"],
        status: "Ongoing",
        type: "manga",
        latestChapter: 200,
        sources: [{ name: "MangaDex", url: "https://mangadex.org/title/...", latestChapter: 200 }],
        chapters: Array.from({length: 10}, (_, i) => ({ number: 200 - i, title: `Chapter ${200 - i}`, url: "#", date: "2024-01-01" }))
      },
      {
        title: "Solo Leveling",
        altTitles: ["나 혼자만 레벨업"],
        description: "In a world where hunters battle deadly monsters, Sung Jin-Woo is the weakest of all hunters.",
        cover: "https://meo.comick.pictures/...",
        author: "Chugong",
        artist: "DUBU",
        genres: ["Action", "Fantasy", "Supernatural"],
        status: "Completed",
        type: "manhwa",
        latestChapter: 179,
        sources: [{ name: "ComicK", url: "https://comick.io/comic/...", latestChapter: 179 }],
        chapters: Array.from({length: 10}, (_, i) => ({ number: 179 - i, title: `Chapter ${179 - i}`, url: "#", date: "2024-01-01" }))
      },
      {
        title: "Tower of God",
        altTitles: ["신의 탑"],
        description: "Bam enters the Tower to find his friend Rachel.",
        cover: "https://meo.comick.pictures/...",
        author: "SIU",
        artist: "SIU",
        genres: ["Action", "Fantasy", "Drama"],
        status: "Ongoing",
        type: "manhwa",
        latestChapter: 550,
        sources: [{ name: "ComicK", url: "https://comick.io/comic/...", latestChapter: 550 }],
        chapters: Array.from({length: 10}, (_, i) => ({ number: 550 - i, title: `Chapter ${550 - i}`, url: "#", date: "2024-01-01" }))
      },
      {
        title: "Omniscient Reader",
        altTitles: ["전지적 독자 시점"],
        description: "Kim Dokja's favorite novel comes to life.",
        cover: "https://meo.comick.pictures/...",
        author: "Sing-Shong",
        artist: "Sleepy-C",
        genres: ["Action", "Fantasy", "Thriller"],
        status: "Ongoing",
        type: "manhwa",
        latestChapter: 150,
        sources: [{ name: "ComicK", url: "https://comick.io/comic/...", latestChapter: 150 }],
        chapters: Array.from({length: 10}, (_, i) => ({ number: 150 - i, title: `Chapter ${150 - i}`, url: "#", date: "2024-01-01" }))
      },
      {
        title: "Martial Peak",
        altTitles: ["武炼巅峰"],
        description: "The journey to the peak of martial arts.",
        cover: "https://meo.comick.pictures/...",
        author: "Momo",
        artist: "Momo",
        genres: ["Action", "Martial Arts", "Adventure"],
        status: "Ongoing",
        type: "manhua",
        latestChapter: 3200,
        sources: [{ name: "ComicK", url: "https://comick.io/comic/...", latestChapter: 3200 }],
        chapters: Array.from({length: 10}, (_, i) => ({ number: 3200 - i, title: `Chapter ${3200 - i}`, url: "#", date: "2024-01-01" }))
      },
      {
        title: "Nano Machine",
        altTitles: ["나노 마신"],
        description: "A descendant from the future injects nanomachines into a martial artist.",
        cover: "https://meo.comick.pictures/...",
        author: "Han-Joong-Wueol-Ya",
        artist: "Geum-Bi",
        genres: ["Action", "Martial Arts", "Sci-Fi"],
        status: "Ongoing",
        type: "manhwa",
        latestChapter: 180,
        sources: [{ name: "ComicK", url: "https://comick.io/comic/...", latestChapter: 180 }],
        chapters: Array.from({length: 10}, (_, i) => ({ number: 180 - i, title: `Chapter ${180 - i}`, url: "#", date: "2024-01-01" }))
      }
    ];

    for (const manga of demoManga) {
      await engine.saveToDatabase(manga);
    }

    res.json({ success: true, message: `Seeded ${demoManga.length} manga` });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== IMAGE PROXY (bypass CORS/referer blocks) =====
app.get('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://mangadex.org/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    console.error('Image proxy error:', err.message);
    res.status(500).send('Image fetch failed');
  }
});

// ===== STATIC FILES (after API routes) =====
app.use(express.static(path.join(__dirname, 'public')));

// ===== API ROUTES =====
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    console.log(`Searching for: ${q}`);
    const results = await engine.searchAll(q);
    console.log(`Found ${results.length} results`);
    for (const manga of results) {
      try { await engine.saveToDatabase(manga); } 
      catch (e) { console.error('Save error:', e.message); }
    }
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.get('/api/manga/:id', async (req, res) => {
  try {
    const manga = await db.get('SELECT * FROM manga WHERE id = ?', [req.params.id]);
    if (!manga) return res.status(404).json({ error: 'Not found' });
    const sources = await db.all('SELECT * FROM sources WHERE manga_id = ?', [req.params.id]);
    const chapters = await db.all('SELECT * FROM chapters WHERE manga_id = ? ORDER BY chapter_number DESC', [req.params.id]);
    res.json({ ...manga, sources, chapters });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/manga/:id/details', async (req, res) => {
  try {
    const manga = await db.get('SELECT * FROM manga WHERE id = ?', [req.params.id]);
    if (!manga) return res.status(404).json({ error: 'Not found' });
    const sources = await db.all('SELECT * FROM sources WHERE manga_id = ?', [req.params.id]);
    const details = await engine.getMangaDetails(manga.title, sources);
    res.json(details);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chapter/:source/:chapterId', async (req, res) => {
  try {
    const { source, chapterId } = req.params;
    const scraper = engine.scrapers.get(source);
    if (!scraper) return res.status(404).json({ error: 'Source not found' });
    const pages = await scraper.getChapterPages(chapterId);
    res.json({ success: true, pages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/latest', async (req, res) => {
  try {
    const results = await engine.getLatestFromAll();
    res.json({ success: true, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/library', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM manga WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const manga = await db.all(sql, params);
    res.json({ success: true, manga });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalManga = await db.get('SELECT COUNT(*) as count FROM manga');
    const totalChapters = await db.get('SELECT COUNT(*) as count FROM chapters');
    const totalSources = await db.get('SELECT COUNT(DISTINCT source_name) as count FROM sources');
    const byType = await db.all('SELECT type, COUNT(*) as count FROM manga GROUP BY type');
    res.json({ totalManga: totalManga.count, totalChapters: totalChapters.count, totalSources: totalSources.count, byType });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sources: Array.from(engine.scrapers.keys()) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Imperious Manga Aggregator on port ${PORT}`);
  console.log(`Sources: ${engine.scrapers.size}`);
  console.log(`Debug: /api/debug/sources, /api/debug/test/:source, /api/seed`);
});

module.exports = app;
