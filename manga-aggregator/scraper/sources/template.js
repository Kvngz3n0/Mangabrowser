const BaseScraper = require('../base');

class TemplateScraper extends BaseScraper {
  constructor(name, baseUrl, config = {}) {
    super(name, baseUrl, { timeout: 15000, retries: 2, ...config });
    this.sourceType = config.type || 'manga';
  }

  async searchManga(query) {
    try {
      const html = await this.request(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      const $ = this.loadHtml(html);
      const results = [];

      $('.manga-item, .comic-item, .series-item, .search-item, .c-tabs-item, .page-item-detail').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h3, h2, .title, .name, .post-title').first().text().trim();
        const url = $el.find('a').first().attr('href');
        const cover = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
        const latest = $el.find('.chapter, .latest, .item-chapter').first().text().trim();

        if (title && url) {
          results.push({
            title,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            cover,
            latestChapter: this.extractChapterNumber(latest),
            type: this.sourceType
          });
        }
      });

      return results;
    } catch (err) {
      console.warn(`Template search failed for ${this.name}:`, err.message);
      return [];
    }
  }

  async getMangaDetails(mangaUrl) {
    try {
      const html = await this.request(mangaUrl);
      const $ = this.loadHtml(html);

      const title = $('h1, .title, .manga-title, .post-title h1').first().text().trim();
      const cover = $('.cover img, .manga-cover img, .thumbnail img, .summary_image img').first().attr('src')
                 || $('.cover img, .manga-cover img, .thumbnail img, .summary_image img').first().attr('data-src');
      const description = $('.description, .summary, .synopsis, .description-summary').first().text().trim();
      const author = $('.author, .artist, .author-content').first().text().trim();
      const status = $('.status, .post-status .summary-content').first().text().trim();
      const genres = $('.genre, .genres-content a').map((_, g) => $(g).text().trim()).get();

      const chapters = [];
      $('.chapter-item, .chapter, .wp-manga-chapter, .row-content-chapter li').each((_, el) => {
        const $el = $(el);
        const chTitle = $el.find('a').first().text().trim();
        const chUrl = $el.find('a').first().attr('href');
        const chNum = this.extractChapterNumber(chTitle);
        if (chTitle && chUrl) {
          chapters.push({ number: chNum, title: chTitle, url: chUrl.startsWith('http') ? chUrl : `${this.baseUrl}${chUrl}` });
        }
      });

      return {
        title,
        cover,
        description,
        author,
        status,
        genres,
        type: this.sourceType,
        latestChapter: chapters[0]?.number || 0,
        chapters: chapters.reverse(),
        url: mangaUrl
      };
    } catch (err) {
      console.warn(`Template details failed for ${this.name}:`, err.message);
      return null;
    }
  }

  async getLatestManga(page = 1) {
    try {
      const html = await this.request(`${this.baseUrl}/latest?page=${page}`);
      const $ = this.loadHtml(html);
      const results = [];

      $('.manga-item, .comic-item, .page-item-detail, .content-genres-item').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h3, h2, .title, .post-title').first().text().trim();
        const url = $el.find('a').first().attr('href');
        const cover = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
        if (title && url) results.push({ title, url, cover });
      });

      return results;
    } catch (err) {
      return [];
    }
  }
}

module.exports = TemplateScraper;
