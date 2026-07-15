const cron = require('node-cron');
const Database = require('../database/db');
const ScraperEngine = require('../scraper/engine');
const { registerAllScrapers } = require('../scraper/sources');

class MangaScheduler {
  constructor() {
    this.db = new Database();
    this.engine = new ScraperEngine();
    registerAllScrapers(this.engine);
    this.isRunning = false;
  }

  start() {
    cron.schedule('0 */6 * * *', () => this.runUpdate());
    cron.schedule('0 */12 * * *', () => this.fetchMissingCovers());
    console.log('Scheduler active');
  }

  async runUpdate() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('Starting update...');
    try {
      const results = await this.engine.getLatestFromAll();
      for (const sourceResult of results) {
        for (const manga of sourceResult.data) {
          try {
            await this.engine.saveToDatabase({
              ...manga,
              sources: [{ name: sourceResult.source, url: manga.url, latestChapter: manga.latestChapter || 0 }]
            });
          } catch (err) {
            console.error(`Save error ${manga.title}:`, err.message);
          }
        }
      }
      console.log('Update complete');
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      this.isRunning = false;
    }
  }

  async fetchMissingCovers() {
    console.log('Fetching covers...');
    const manga = await this.db.all('SELECT id, cover_url FROM manga WHERE local_cover IS NULL AND cover_url IS NOT NULL LIMIT 50');
    for (const item of manga) {
      try {
        const localPath = await this.engine.downloadCover(item.id, item.cover_url, 'auto');
        if (localPath) {
          await this.db.run('UPDATE manga SET local_cover = ? WHERE id = ?', [localPath, item.id]);
        }
      } catch (err) {
        console.error(`Cover error ${item.id}:`, err.message);
      }
    }
    console.log('Covers done');
  }
}

module.exports = MangaScheduler;
