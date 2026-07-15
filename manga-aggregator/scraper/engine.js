const BaseScraper = require('./base');
const Database = require('../database/db');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class ScraperEngine {
  constructor() {
    this.scrapers = new Map();
    this.db = new Database();
    this.coverDir = path.join(__dirname, '..', 'public', 'images', 'covers');
    if (!fs.existsSync(this.coverDir)) {
      fs.mkdirSync(this.coverDir, { recursive: true });
    }
  }

  register(name, scraper) {
    this.scrapers.set(name, scraper);
    console.log(`Registered: ${name}`);
  }

  async searchAll(query) {
    const results = [];
    const promises = [];
    for (const [name, scraper] of this.scrapers) {
      promises.push(
        scraper.searchManga(query)
          .then(data => ({ source: name, data, success: true }))
          .catch(err => ({ source: name, error: err.message, success: false }))
      );
    }
    const settled = await Promise.allSettled(promises);
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value.success) {
        results.push(result.value);
      }
    }
    return this.aggregateSearchResults(results);
  }

  aggregateSearchResults(results) {
    const mangaMap = new Map();
    for (const { source, data } of results) {
      for (const manga of data) {
        const normalizedTitle = this.normalizeTitle(manga.title);
        if (mangaMap.has(normalizedTitle)) {
          const existing = mangaMap.get(normalizedTitle);
          existing.sources.push({
            name: source,
            url: manga.url,
            latestChapter: manga.latestChapter || 0
          });
          if (!existing.cover && manga.cover) existing.cover = manga.cover;
          if (manga.latestChapter > existing.latestChapter) {
            existing.latestChapter = manga.latestChapter;
          }
        } else {
          mangaMap.set(normalizedTitle, {
            title: manga.title,
            altTitles: manga.altTitles || [],
            cover: manga.cover || null,
            description: manga.description || '',
            author: manga.author || '',
            artist: manga.artist || '',
            genres: manga.genres || [],
            status: manga.status || 'Unknown',
            type: manga.type || 'manga',
            latestChapter: manga.latestChapter || 0,
            sources: [{ name: source, url: manga.url, latestChapter: manga.latestChapter || 0 }]
          });
        }
      }
    }
    return Array.from(mangaMap.values()).sort((a, b) => b.latestChapter - a.latestChapter);
  }

  async getMangaDetails(title, sources = []) {
    const results = [];
    for (const source of sources) {
      const scraper = this.scrapers.get(source.name);
      if (scraper) {
        try {
          const details = await scraper.getMangaDetails(source.url);
          results.push({ source: source.name, data: details });
        } catch (err) {
          console.error(`Error from ${source.name}:`, err.message);
        }
      }
    }
    return this.mergeDetails(results);
  }

  mergeDetails(results) {
    if (results.length === 0) return null;
    const merged = {
      title: '', altTitles: [], description: '', cover: '', author: '', artist: '',
      genres: [], status: 'Unknown', type: 'manga', chapters: [], sources: []
    };
    for (const { source, data } of results) {
      if (!merged.title && data.title) merged.title = data.title;
      if (data.altTitles) merged.altTitles.push(...data.altTitles);
      if (!merged.description && data.description) merged.description = data.description;
      if (!merged.cover && data.cover) merged.cover = data.cover;
      if (!merged.author && data.author) merged.author = data.author;
      if (!merged.artist && data.artist) merged.artist = data.artist;
      if (data.genres) merged.genres.push(...data.genres);
      if (!merged.status || merged.status === 'Unknown') merged.status = data.status;
      if (!merged.type || merged.type === 'manga') merged.type = data.type;
      if (data.chapters) {
        for (const ch of data.chapters) {
          const existing = merged.chapters.find(c => Math.abs(c.number - ch.number) < 0.01);
          if (!existing) {
            merged.chapters.push({ ...ch, sources: [source] });
          } else {
            existing.sources.push(source);
          }
        }
      }
      merged.sources.push({ name: source, url: data.url });
    }
    merged.altTitles = [...new Set(merged.altTitles)];
    merged.genres = [...new Set(merged.genres)];
    merged.chapters.sort((a, b) => b.number - a.number);
    return merged;
  }

  async downloadCover(mangaId, coverUrl, source = 'unknown') {
    if (!coverUrl) return null;
    try {
      const ext = path.extname(new URL(coverUrl).pathname) || '.jpg';
      const filename = `${mangaId}_${source}${ext}`;
      const filepath = path.join(this.coverDir, filename);
      const response = await axios.get(coverUrl, {
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      return `/images/covers/${filename}`;
    } catch (error) {
      console.error('Cover download error:', error.message);
      return null;
    }
  }

  async saveToDatabase(mangaData) {
    try {
      const existing = await this.db.get('SELECT id FROM manga WHERE title = ?', [mangaData.title]);
      let mangaId;
      if (existing) {
        mangaId = existing.id;
        await this.db.run(
          `UPDATE manga SET alt_titles=?, description=?, status=?, author=?, artist=?, genres=?, rating=?, source_count=?, latest_chapter=?, chapter_count=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
          [JSON.stringify(mangaData.altTitles), mangaData.description, mangaData.status, mangaData.author, mangaData.artist,
           JSON.stringify(mangaData.genres), mangaData.rating || 0, mangaData.sources.length, mangaData.latestChapter,
           mangaData.chapters?.length || 0, mangaId]
        );
      } else {
        const result = await this.db.run(
          `INSERT INTO manga (title, alt_titles, description, status, author, artist, genres, type, rating, source_count, latest_chapter, chapter_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [mangaData.title, JSON.stringify(mangaData.altTitles), mangaData.description, mangaData.status, mangaData.author,
           mangaData.artist, JSON.stringify(mangaData.genres), mangaData.type || 'manga', mangaData.rating || 0,
           mangaData.sources.length, mangaData.latestChapter || 0, mangaData.chapters?.length || 0]
        );
        mangaId = result.id;
      }
      if (mangaData.cover) {
        const localCover = await this.downloadCover(mangaId, mangaData.cover, 'aggregated');
        if (localCover) {
          await this.db.run('UPDATE manga SET cover_url=?, local_cover=? WHERE id=?', [mangaData.cover, localCover, mangaId]);
        }
      }
      for (const source of mangaData.sources) {
        const existingSource = await this.db.get('SELECT id FROM sources WHERE manga_id=? AND source_name=?', [mangaId, source.name]);
        if (existingSource) {
          await this.db.run('UPDATE sources SET source_url=?, latest_chapter=?, last_checked=CURRENT_TIMESTAMP WHERE id=?', [source.url, source.latestChapter || 0, existingSource.id]);
        } else {
          await this.db.run('INSERT INTO sources (manga_id, source_name, source_url, latest_chapter, last_checked) VALUES (?,?,?,?,CURRENT_TIMESTAMP)', [mangaId, source.name, source.url, source.latestChapter || 0]);
        }
      }
      if (mangaData.chapters) {
        for (const chapter of mangaData.chapters) {
          const existingCh = await this.db.get('SELECT id FROM chapters WHERE manga_id=? AND chapter_number=?', [mangaId, chapter.number]);
          if (!existingCh) {
            await this.db.run('INSERT INTO chapters (manga_id, source, chapter_number, chapter_title, release_date, url) VALUES (?,?,?,?,?,?)', [mangaId, chapter.sources?.[0] || 'unknown', chapter.number, chapter.title, chapter.date, chapter.url]);
          }
        }
      }
      const searchText = `${mangaData.title} ${mangaData.altTitles.join(' ')} ${mangaData.author} ${mangaData.artist} ${mangaData.genres.join(' ')}`.toLowerCase();
      await this.db.run('DELETE FROM search_index WHERE manga_id=?', [mangaId]);
      await this.db.run('INSERT INTO search_index (manga_id, search_text) VALUES (?,?)', [mangaId, searchText]);
      return mangaId;
    } catch (error) {
      console.error('DB save error:', error);
      throw error;
    }
  }

  normalizeTitle(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  async getLatestFromAll() {
    const results = [];
    for (const [name, scraper] of this.scrapers) {
      try {
        const data = await scraper.getLatestManga(1);
        results.push({ source: name, data });
      } catch (err) {
        console.error(`Latest fetch failed for ${name}:`, err.message);
      }
    }
    return results;
  }
}

module.exports = ScraperEngine;
