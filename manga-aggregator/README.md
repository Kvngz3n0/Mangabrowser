# Imperious Manga Aggregator

**Black & Gold Edition** — A multi-source manga, manhwa, and manhua aggregation platform with automated scraping, cover pooling, and a luxurious dark UI.

## Features

- **60+ Sources**: MangaDex, MangaNato, MangaSee, Bato.to, ComicK, AsuraScans, Webtoon, MangaPlus, and 50+ template sources
- **Multi-Source Aggregation**: Pools chapter data from multiple sources for maximum accuracy
- **Cover Image Fetching**: Automatically downloads and caches cover images
- **Automated Updates**: Cron scheduler runs every 6 hours
- **Premium Black & Gold UI**: Glassmorphism, gold gradients, particle effects, animated borders
- **SQLite Database**: Local caching for fast access
- **Full REST API**: JSON endpoints for all operations
- **Chapter Reader**: Built-in reader with keyboard navigation

## Quick Start

```bash
npm install
npm run setup
npm start
```

Then open `http://localhost:3000`

## API

- `GET /api/search?q=query` — Search across all sources
- `GET /api/manga/:id` — Get manga from DB
- `GET /api/manga/:id/details` — Fresh aggregated details
- `GET /api/chapter/:source/:chapterId` — Get chapter pages
- `GET /api/latest` — Latest from all sources
- `GET /api/library?type=manga` — Browse cached library
- `GET /api/stats` — Aggregation statistics
- `GET /api/health` — Source status

## Adding Sources

Extend `scraper/sources/template.js` or create a new class extending `BaseScraper`:

```javascript
class MyScraper extends BaseScraper {
  constructor() {
    super('MySource', 'https://example.com');
  }
  async searchManga(query) { /* ... */ }
  async getMangaDetails(url) { /* ... */ }
  async getChapterPages(url) { /* ... */ }
}
```

## License

MIT — For educational purposes only.
