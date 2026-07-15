const BaseScraper = require('../../../base');

class ReaperScansScraper extends BaseScraper {
  constructor() {
    super('ReaperScans', 'https://reaperscans.com', {
      timeout: 15000,
      retries: 3,
      headers: {
        'Referer': 'https://reaperscans.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    this.baseUrl = 'https://reaperscans.com';
  }

  // ─── 1. SEARCH ───
  async searchManga(query) {
    const html = await this.request(
      `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=wp-manga`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.c-tabs-item .page-item-detail').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title h3 a').text().trim();
      const url = $el.find('.post-title h3 a').attr('href');
      const cover = $el.find('.item-thumb img').attr('data-src') 
                 || $el.find('.item-thumb img').attr('src');
      const latest = $el.find('.list-chapter .chapter-item .chapter a')
                    .first().text().trim();
      const rating = $el.find('.rating .score').text().trim();

      if (title && url) {
        results.push({
          title,
          url,
          cover,
          latestChapter: this.extractChapterNumber(latest),
          rating: rating ? parseFloat(rating) : null,
          type: 'manga'
        });
      }
    });
    return results;
  }

  // ─── 2. DETAILS ───
  async getMangaDetails(mangaUrl) {
    const html = await this.request(mangaUrl);
    const $ = this.loadHtml(html);

    const title = $('.post-title h1').text().trim();
    const cover = $('.summary_image img').attr('data-src') 
               || $('.summary_image img').attr('src');
    const description = $('.description-summary p').text().trim();
    const author = $('.post-content .post-status:contains("Author") .summary-content')
                  .text().trim() || '';
    const artist = $('.post-content .post-status:contains("Artist") .summary-content')
                  .text().trim() || '';
    const status = $('.post-content .post-status:contains("Status") .summary-content')
                  .text().trim() || 'Unknown';
    const genres = $('.post-content .post-status:contains("Genres") .summary-content a')
                  .map((_, a) => $(a).text().trim()).get();
    const rating = $('.post-rating .score').text().trim();
    const views = $('.post-content .post-status:contains("Views") .summary-content')
                 .text().trim();

    const chapters = [];
    $('.listing-chapters_wrap .wp-manga-chapter').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('a').first().text().trim();
      const chUrl = $el.find('a').first().attr('href');
      const chDate = $el.find('.chapter-release-date').text().trim();
      const chNum = this.extractChapterNumber(chTitle);

      chapters.push({ number: chNum, title: chTitle, url: chUrl, date: chDate });
    });

    return {
      title,
      cover,
      description,
      author,
      artist,
      status,
      genres,
      rating: rating ? parseFloat(rating) : null,
      views,
      type: 'manga',
      latestChapter: chapters[0]?.number || 0,
      chapters: chapters.reverse(),
      url: mangaUrl
    };
  }

  // ─── 3. CHAPTER PAGES ───
  async getChapterPages(chapterUrl) {
    const html = await this.request(chapterUrl);
    const $ = this.loadHtml(html);
    const pages = [];

    $('.reading-content .page-break img').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src) pages.push(src);
    });

    return pages;
  }

  // ─── 4. LATEST ───
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
      const latest = $el.find('.list-chapter .chapter-item .chapter a')
                    .first().text().trim();

      if (title && url) {
        results.push({ 
          title, 
          url, 
          cover,
          latestChapter: this.extractChapterNumber(latest)
        });
      }
    });
    return results;
  }
}

module.exports = ReaperScansScraper;
