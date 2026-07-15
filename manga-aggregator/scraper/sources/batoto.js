const BaseScraper = require('../base');

class BatoToScraper extends BaseScraper {
  constructor() {
    super('Bato.to', 'https://bato.to', { timeout: 15000, retries: 3 });
    this.baseUrl = 'https://bato.to';
  }

  async searchManga(query) {
    const html = await this.request(`${this.baseUrl}/search?word=${encodeURIComponent(query)}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.item-comic').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.item-title').text().trim();
      const url = $el.find('a').attr('href');
      const cover = $el.find('img').attr('src');
      const latest = $el.find('.item-chapter').first().text().trim();
      if (title && url) {
        results.push({ title, url: url.startsWith('http') ? url : `${this.baseUrl}${url}`, cover, latestChapter: this.extractChapterNumber(latest), type: 'manga' });
      }
    });
    return results;
  }

  async getMangaDetails(mangaUrl) {
    const html = await this.request(mangaUrl);
    const $ = this.loadHtml(html);
    const title = $('.series-title').text().trim();
    const cover = $('.series-cover img').attr('src');
    const description = $('.series-description').text().trim();
    const author = $('.info-item:contains("Author")').next().text().trim();
    const status = $('.info-item:contains("Status")').next().text().trim();
    const genres = $('.info-item:contains("Genres")').next().find('a').map((_, a) => $(a).text().trim()).get();
    const chapters = [];
    $('.chapter-item').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('.ch-title').text().trim();
      const chUrl = $el.find('a').attr('href');
      const chNum = this.extractChapterNumber(chTitle);
      chapters.push({ number: chNum, title: chTitle, url: `${this.baseUrl}${chUrl}` });
    });
    return { title, cover, description, author, status, genres, type: 'manga', latestChapter: chapters[0]?.number || 0, chapters: chapters.reverse(), url: mangaUrl };
  }

  async getChapterPages(chapterUrl) {
    const html = await this.request(chapterUrl);
    const $ = this.loadHtml(html);
    const pages = [];
    $('.page-img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) pages.push(src);
    });
    return pages;
  }

  async getLatestManga(page = 1) {
    const html = await this.request(`${this.baseUrl}/browse?sort=update&page=${page}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.item-comic').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.item-title').text().trim();
      const url = $el.find('a').attr('href');
      const cover = $el.find('img').attr('src');
      if (title && url) results.push({ title, url: `${this.baseUrl}${url}`, cover });
    });
    return results;
  }
}

module.exports = BatoToScraper;
