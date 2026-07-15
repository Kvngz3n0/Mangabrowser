const BaseScraper = require('../base');

class MangaSeeScraper extends BaseScraper {
  constructor() {
    super('MangaSee', 'https://mangasee123.com', { timeout: 15000, retries: 3 });
    this.baseUrl = 'https://mangasee123.com';
  }

  async searchManga(query) {
    const html = await this.request(`${this.baseUrl}/search/?name=${encodeURIComponent(query)}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.SeriesName').each((_, el) => {
      const $el = $(el);
      const title = $el.text().trim();
      const url = $el.attr('href');
      if (title && url) {
        results.push({ title, url: url.startsWith('http') ? url : `${this.baseUrl}${url}`, type: 'manga' });
      }
    });
    return results;
  }

  async getMangaDetails(mangaUrl) {
    const html = await this.request(mangaUrl);
    const $ = this.loadHtml(html);
    const title = $('.SeriesName').first().text().trim();
    const description = $('.description').text().trim();
    const cover = $('.img-fluid').first().attr('src');
    const author = $('.InfoList tr:contains("Author(s)") td').last().text().trim();
    const status = $('.InfoList tr:contains("Status") td').last().text().trim();
    const genres = $('.InfoList tr:contains("Genre(s)") td a').map((_, a) => $(a).text().trim()).get();
    const chapters = [];
    $('.ChapterLink').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.text().trim();
      const chUrl = $el.attr('href');
      const chNum = this.extractChapterNumber(chTitle);
      chapters.push({ number: chNum, title: chTitle, url: chUrl.startsWith('http') ? chUrl : `${this.baseUrl}${chUrl}` });
    });
    return { title, description, cover, author, status, genres, type: 'manga', latestChapter: chapters[0]?.number || 0, chapters: chapters.reverse(), url: mangaUrl };
  }

  async getLatestManga(page = 1) {
    const html = await this.request(`${this.baseUrl}/`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.LatestEpisode').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.SeriesName').text().trim();
      const url = $el.find('a').attr('href');
      const cover = $el.find('img').attr('src');
      if (title && url) results.push({ title, url: `${this.baseUrl}${url}`, cover });
    });
    return results;
  }
}

module.exports = MangaSeeScraper;
