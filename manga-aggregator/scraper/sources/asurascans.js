const BaseScraper = require('../base');

class AsuraScansScraper extends BaseScraper {
  constructor() {
    super('AsuraScans', 'https://asuracomic.net', { timeout: 15000, retries: 3 });
    this.baseUrl = 'https://asuracomic.net';
  }

  async searchManga(query) {
    const html = await this.request(`${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=wp-manga`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.c-tabs-item__content').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title a').text().trim();
      const url = $el.find('.post-title a').attr('href');
      const cover = $el.find('.tab-thumb img').attr('src') || $el.find('.tab-thumb img').attr('data-src');
      const latest = $el.find('.chapter a').first().text().trim();
      if (title && url) {
        results.push({ title, url, cover, latestChapter: this.extractChapterNumber(latest), type: 'manhwa' });
      }
    });
    return results;
  }

  async getMangaDetails(mangaUrl) {
    const html = await this.request(mangaUrl);
    const $ = this.loadHtml(html);
    const title = $('.post-title h1').text().trim();
    const cover = $('.summary_image img').attr('src') || $('.summary_image img').attr('data-src');
    const description = $('.description-summary p').text().trim();
    const author = $('.author-content a').first().text().trim();
    const status = $('.post-status .summary-content').last().text().trim();
    const genres = $('.genres-content a').map((_, a) => $(a).text().trim()).get();
    const chapters = [];
    $('.wp-manga-chapter').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('a').text().trim();
      const chUrl = $el.find('a').attr('href');
      const chDate = $el.find('.chapter-release-date').text().trim();
      const chNum = this.extractChapterNumber(chTitle);
      chapters.push({ number: chNum, title: chTitle, url: chUrl, date: chDate });
    });
    return { title, cover, description, author, status, genres, type: 'manhwa', latestChapter: chapters[0]?.number || 0, chapters, url: mangaUrl };
  }

  async getLatestManga(page = 1) {
    const html = await this.request(`${this.baseUrl}/manga/?m_orderby=latest&page=${page}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.page-item-detail').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title a').text().trim();
      const url = $el.find('.post-title a').attr('href');
      const cover = $el.find('.item-thumb img').attr('src') || $el.find('.item-thumb img').attr('data-src');
      if (title && url) results.push({ title, url, cover });
    });
    return results;
  }
}

module.exports = AsuraScansScraper;
