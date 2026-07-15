const BaseScraper = require('../base');

class KingOfShoujoScraper extends BaseScraper {
  constructor() {
    super('KingOfShoujo', 'https://kingofshojo.com', { 
      timeout: 15000, 
      retries: 3 
    });
    this.baseUrl = 'https://kingofshojo.com';
  }

  // Override search with KingOfShoujo-specific selectors
  async searchManga(query) {
    const html = await this.request(
      `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=wp-manga`
    );
    const $ = this.loadHtml(html);
    const results = [];

    // Madara theme search results
    $('.c-tabs-item .page-item-detail').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title h3 a').text().trim();
      const url = $el.find('.post-title h3 a').attr('href');
      const cover = $el.find('.item-thumb img').attr('data-src') 
        || $el.find('.item-thumb img').attr('src');
      const latest = $el.find('.list-chapter .chapter-item .chapter a').first().text().trim();
      
      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
          cover,
          latestChapter: this.extractChapterNumber(latest),
          type: 'shoujo'
        });
      }
    });
    return results;
  }

  // Override details with KingOfShoujo-specific selectors
  async getMangaDetails(mangaUrl) {
    const html = await this.request(mangaUrl);
    const $ = this.loadHtml(html);
    
    const title = $('.post-title h1').text().trim();
    const cover = $('.summary_image img').attr('data-src') 
      || $('.summary_image img').attr('src');
    const description = $('.description-summary p').text().trim();
    const author = $('.post-content .post-status:contains("Author") .summary-content a').first().text().trim()
      || $('.post-content .post-status:contains("Author") .summary-content').text().trim();
    const status = $('.post-content .post-status:contains("Status") .summary-content').text().trim();
    const genres = $('.post-content .post-status:contains("Genres") .summary-content a')
      .map((_, a) => $(a).text().trim()).get();

    const chapters = [];
    $('.listing-chapters_wrap .wp-manga-chapter').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('a').first().text().trim();
      const chUrl = $el.find('a').first().attr('href');
      const chDate = $el.find('.chapter-release-date').text().trim();
      const chNum = this.extractChapterNumber(chTitle);
      
      chapters.push({ 
        number: chNum, 
        title: chTitle, 
        url: chUrl, 
        date: chDate 
      });
    });

    return {
      title,
      cover,
      description,
      author,
      status,
      genres,
      type: 'shoujo',
      latestChapter: chapters[0]?.number || 0,
      chapters: chapters.reverse(),
      url: mangaUrl
    };
  }

  // Override chapter pages
  async getChapterPages(chapterUrl) {
    const html = await this.request(chapterUrl);
    const $ = this.loadHtml(html);
    const pages = [];
    
    // Madara theme uses .reading-content for chapter images
    $('.reading-content .page-break img').each((_, el) => {
      const src = $(el).attr('data-src') 
        || $(el).attr('src');
      if (src) pages.push(src);
    });
    
    return pages;
  }

  // Override latest
  async getLatestManga(page = 1) {
    const html = await this.request(
      `${this.baseUrl}/manga/?m_orderby=latest&page=${page}`
    );
    const $ = this.loadHtml(html);
    const results = [];
    
    $('.page-item-detail').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title h3 a').text().trim();
      const url = $el.find('.post-title h3 a').attr('href');
      const cover = $el.find('.item-thumb img').attr('data-src') 
        || $el.find('.item-thumb img').attr('src');
      const latest = $el.find('.chapter-item .chapter a').first().text().trim();
      
      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
          cover,
          latestChapter: this.extractChapterNumber(latest)
        });
      }
    });
    return results;
  }
}

module.exports = KingOfShoujoScraper;
