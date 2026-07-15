# Manga Scraper Collection

A comprehensive collection of JavaScript manga/webtoon scrapers for popular manga reading sites.

## Supported Sources (11 Total)

| Source | Type | Notes |
|--------|------|-------|
| **MangaDex** | API-based | Official API, most reliable |
| **MangaFox (FanFox)** | HTML scraping | Uses script variables for chapter images |
| **MangaKakalot** | HTML scraping | Fast and stable |
| **MangaNato** | HTML scraping | MangaKakalot alternative domain |
| **MangaHere** | HTML scraping | Similar structure to MangaFox |
| **MangaPark** | HTML scraping | Uses JSON in scripts |
| **ReaperScans** | HTML scraping | WP-Manga based |
| **AsuraScans** | HTML scraping | WP-Manga based |
| **Webtoon** | HTML scraping | Official Webtoon platform |
| **MangaSee** | HTML scraping | Uses script variables for pages |
| **KingOfShoujo** | HTML scraping | WP-Manga based (your reference) |

## Installation

```bash
npm install axios cheerio
```

## Usage

```javascript
const { MangaDexScraper, MangaFoxScraper } = require('./index');

async function main() {
  // Search for manga
  const scraper = new MangaDexScraper();
  const results = await scraper.searchManga('one piece');
  console.log(results);

  // Get manga details
  const details = await scraper.getMangaDetails(results[0].url);
  console.log(details);

  // Get chapter pages
  const pages = await scraper.getChapterPages(details.chapters[0].url);
  console.log(pages);

  // Get latest manga
  const latest = await scraper.getLatestManga(1);
  console.log(latest);
}

main();
```

## API Reference

All scrapers extend `BaseScraper` and implement these methods:

### `searchManga(query)`
Search for manga by title.
- **Returns**: `Array<{ title, url, cover, ... }>`

### `getMangaDetails(mangaUrl)`
Get detailed information about a manga.
- **Returns**: `{ title, cover, description, author, status, genres, chapters, ... }`

### `getChapterPages(chapterUrl)`
Get all page image URLs for a chapter.
- **Returns**: `Array<string>` (image URLs)

### `getLatestManga(page)`
Get the latest updated manga.
- **Returns**: `Array<{ title, url, cover, ... }>`

## Project Structure

```
.
├── base.js                  # Base scraper class
├── index.js                 # Export all scrapers
├── package.json             # Dependencies
├── test.js                  # Example usage
├── scrapers/
│   ├── mangadex.js          # MangaDex (API)
│   ├── mangafox.js          # MangaFox/FanFox
│   ├── mangakakalot.js      # MangaKakalot
│   ├── manganato.js         # MangaNato
│   ├── mangahere.js         # MangaHere
│   ├── mangapark.js         # MangaPark
│   ├── reaperscans.js       # ReaperScans
│   ├── asurascans.js        # AsuraScans
│   ├── webtoon.js           # Webtoon
│   ├── mangasee.js          # MangaSee
│   └── kingofshoujo.js      # KingOfShoujo (reference)
```

## Notes

- All scrapers include retry logic with exponential backoff
- User-Agent rotation for stealth
- Proper Referer headers for image access
- Error handling for network failures
- MangaDex uses the official API (most stable)
- HTML-based scrapers may break if site layouts change

## Disclaimer

These scrapers are for educational purposes only. Please respect the terms of service of each website and support official releases when possible.
