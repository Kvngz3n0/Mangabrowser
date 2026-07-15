const BaseScraper = require('../base');

class MangaNatoScraper extends BaseScraper {
  constructor() {
    super('MangaNato', 'https://manganato.com', { timeout: 15000, retries: 3 });
    this.baseUrl = 'https://manganato.com';
    this.searchUrl = 'https://manganato.com/search/story';
  }

  async searchManga(query) {
    const formattedQuery = query.replace(/\s+/g, '_');
    const html = await this.request(`${this.searchUrl}/${formattedQuery}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.search-story-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.item-title').text().trim();
      const url = $el.find('.item-title').attr('href');
      const cover = $el.find('.img-loading').attr('src') || $el.find('.img-loading').attr('data-src');
      const author = $el.find('.item-author').text().trim();
      const latestChapter = $el.find('.item-chapter a').first().text().trim();
      const chapterNum = this.extractChapterNumber(latestChapter);
      if (title && url) {
        results.push({ title, url, cover, author, latestChapter: chapterNum, type: 'manga' });
      }
    });
    return results;
  }

  async getMangaDetails(mangaUrl) {
    const html = await this.request(mangaUrl);
    const $ = this.loadHtml(html);
    const title = $('.story-info-right h1').text().trim();
    const altTitles = $('.variations-tableInfo td:contains("Alternative")').next().text().split(';').map(t => t.trim()).filter(Boolean);
    const author = $('.variations-tableInfo td:contains("Author(s)")').next().text().trim();
    const status = $('.variations-tableInfo td:contains("Status")').next().text().trim();
    const genres = $('.variations-tableInfo td:contains("Genres")').next().find('a').map((_, a) => $(a).text().trim()).get();
    const description = $('.panel-story-info-description').text().replace('Description :', '').trim();
    const cover = $('.info-image img').attr('src');
    const chapters = [];
    $('.row-content-chapter li').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('.chapter-name').text().trim();
      const chUrl = $el.find('.chapter-name').attr('href');
      const chDate = $el.find('.chapter-time').text().trim();
      const chNum = this.extractChapterNumber(chTitle);
      chapters.push({ number: chNum, title: chTitle, url: chUrl, date: chDate });
    });
    return { title, altTitles, description, cover, author, genres, status, type: 'manga', latestChapter: chapters[0]?.number || 0, chapters, url: mangaUrl };
  }

  async getChapterPages(chapterUrl) {
    const html = await this.request(chapterUrl);
    const $ = this.loadHtml(html);
    const pages = [];
    $('.container-chapter-reader img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) pages.push(src);
    });
    return pages;
  }

  async getLatestManga(page = 1) {
    const html = await this.request(`${this.baseUrl}/genre-all?page=${page}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.content-genres-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.genres-item-name').text().trim();
      const url = $el.find('.genres-item-name').attr('href');
      const cover = $el.find('.img-loading').attr('src') || $el.find('.img-loading').attr('data-src');
      const latestChapter = $el.find('.genres-item-chap').text().trim();
      const chapterNum = this.extractChapterNumber(latestChapter);
      if (title && url) results.push({ title, url, cover, latestChapter: chapterNum });
    });
    return results;
  }

  async getPopularManga(page = 1) {
    const html = await this.request(`${this.baseUrl}/genre-all?type=topview&page=${page}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.content-genres-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.genres-item-name').text().trim();
      const url = $el.find('.genres-item-name').attr('href');
      const cover = $el.find('.img-loading').attr('src') || $el.find('.img-loading').attr('data-src');
      if (title && url) results.push({ title, url, cover });
    });
    return results;
  }
}

module.exports = MangaNatoScraper;
