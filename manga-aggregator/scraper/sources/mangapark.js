const BaseScraper = require('../../../base');

class MangaParkScraper extends BaseScraper {
  constructor() {
    super('MangaPark', 'https://mangapark.net', {
      timeout: 15000,
      retries: 3,
      headers: {
        'Referer': 'https://mangapark.net/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    this.baseUrl = 'https://mangapark.net';
  }

  // ─── 1. SEARCH ───
  async searchManga(query) {
    const html = await this.request(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.title a').text().trim();
      const url = $el.find('.title a').attr('href');
      const cover = $el.find('.cover img').attr('src')
                 || $el.find('.cover img').attr('data-src');
      const latest = $el.find('.latest a').text().trim();
      const rating = $el.find('.score').text().trim();

      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
          cover: cover?.startsWith('//') ? `https:${cover}` : cover,
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

    const title = $('.manga-detail h1').text().trim() 
               || $('.title').first().text().trim();
    const cover = $('.manga-detail .cover img').attr('src')
               || $('.cover img').first().attr('src');
    const description = $('.manga-detail .summary').text().trim()
                     || $('.summary').first().text().trim();
    const author = $('.manga-detail .meta a[href*="/author/"]').first().text().trim() || '';
    const status = $('.manga-detail .meta span:contains("Status")').next().text().trim() 
                || 'Unknown';
    const genres = $('.manga-detail .meta a[href*="/genre/"]')
                  .map((_, a) => $(a).text().trim()).get();
    const rating = $('.manga-detail .score').text().trim();
    const altTitles = $('.manga-detail .alt-titles').text().trim();

    const chapters = [];
    $('.chapter-list .item').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('a').text().trim();
      const chUrl = $el.find('a').attr('href');
      const chDate = $el.find('.time').text().trim();
      const chNum = this.extractChapterNumber(chTitle);

      if (chUrl) {
        chapters.push({ 
          number: chNum, 
          title: chTitle, 
          url: chUrl.startsWith('http') ? chUrl : `${this.baseUrl}${chUrl}`, 
          date: chDate 
        });
      }
    });

    return {
      title,
      cover: cover?.startsWith('//') ? `https:${cover}` : cover,
      description,
      author,
      status,
      genres,
      altTitles: altTitles ? altTitles.split(',').map(s => s.trim()).filter(Boolean) : [],
      rating: rating ? parseFloat(rating) : null,
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

    // MangaPark v3 uses JSON in script
    const scriptMatch = html.match(/var\s+_load_pages\s*=\s*(\[.*?\]);/s);
    if (scriptMatch) {
      try {
        const pageData = JSON.parse(scriptMatch[1]);
        pageData.forEach(page => {
          if (page.u) pages.push(page.u);
        });
      } catch (e) {
        console.error('Failed to parse page data:', e);
      }
    }

    // Fallback
    if (pages.length === 0) {
      $('.img-fluid, .reader-img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src) pages.push(src);
      });
    }

    return pages;
  }

  // ─── 4. LATEST ───
  async getLatestManga(page = 1) {
    const html = await this.request(
      `${this.baseUrl}/latest?page=${page}`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.title a').text().trim();
      const url = $el.find('.title a').attr('href');
      const cover = $el.find('.cover img').attr('src')
                 || $el.find('.cover img').attr('data-src');
      const updated = $el.find('.latest a').text().trim();

      if (title && url) {
        results.push({ 
          title, 
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`, 
          cover: cover?.startsWith('//') ? `https:${cover}` : cover,
          updated
        });
      }
    });
    return results;
  }
}

module.exports = MangaParkScraper;
