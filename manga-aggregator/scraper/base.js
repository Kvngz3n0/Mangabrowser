const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');

class BaseScraper {
  constructor(name, baseUrl, config = {}) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.config = { timeout: 30000, retries: 3, delay: 1000, ...config };
    this.userAgent = new UserAgent();
  }

  async request(url, options = {}) {
    const headers = {
      'User-Agent': this.userAgent.toString(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      ...options.headers
    };
    for (let i = 0; i < this.config.retries; i++) {
      try {
        await this.sleep(this.config.delay * (i + 1));
        const response = await axios.get(url, { headers, timeout: this.config.timeout, ...options });
        return response.data;
      } catch (error) {
        if (i === this.config.retries - 1) throw error;
      }
    }
  }

  async postRequest(url, data, options = {}) {
    const headers = {
      'User-Agent': this.userAgent.toString(),
      'Content-Type': 'application/json',
      ...options.headers
    };
    const response = await axios.post(url, data, { headers, timeout: this.config.timeout, ...options });
    return response.data;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  loadHtml(html) {
    return cheerio.load(html);
  }

  async searchManga(query) { throw new Error('Not implemented'); }
  async getMangaDetails(mangaUrl) { throw new Error('Not implemented'); }
  async getChapterList(mangaUrl) { throw new Error('Not implemented'); }
  async getChapterPages(chapterUrl) { throw new Error('Not implemented'); }
  async getLatestManga(page = 1) { throw new Error('Not implemented'); }
  async getPopularManga(page = 1) { throw new Error('Not implemented'); }

  normalizeTitle(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  extractChapterNumber(title) {
    const match = title.match(/(?:chapter|ch|ep|episode|vol|volume)?\s*[#\.]?\s*(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : 0;
  }
}

module.exports = BaseScraper;
