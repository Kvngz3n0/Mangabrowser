const BaseScraper = require('../../../base');

class MangaHereScraper extends BaseScraper {
  constructor() {
    super('MangaHere', 'https://www.mangahere.cc', {
      timeout: 15000,
      retries: 3,
      headers: {
        'Referer': 'https://www.mangahere.cc/',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    this.baseUrl = 'https://www.mangahere.cc';
  }

  // ─── 1. SEARCH ───
  async searchManga(query) {
    const html = await this.request(
      `${this.baseUrl}/search?title=${encodeURIComponent(query)}&page=1`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.manga-list-4-list li').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.manga-list-4-item-title a').text().trim();
      const url = $el.find('.manga-list-4-item-title a').attr('href');
      const cover = $el.find('.manga-list-4-cover img').attr('src')
                 || $el.find('.manga-list-4-cover img').attr('data-original');
      const latest = $el.find('.manga-list-4-item-subtitle').first().text().trim();
      const rating = $el.find('.manga-list-4-rate-score').text().trim();

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

    const title = $('.detail-info-right-title-font').text().trim();
    const cover = $('.detail-info-cover-img').attr('src');
    const description = $('.detail-info-right-content').text().trim();
    const author = $('.detail-info-right-say a').first().text().trim() || '';
    const status = $('.detail-info-right-title-tip').text().trim() || 'Unknown';
    const genres = $('.detail-info-right-tag-list a')
                  .map((_, a) => $(a).text().trim()).get();
    const rating = $('.detail-info-right-title-star .item-score').text().trim();
    const views = $('.detail-info-right-title-star .item-time').text().trim();

    const chapters = [];
    $('.detail-main-list li').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('a').attr('title') || $el.find('.title3').text().trim();
      const chUrl = $el.find('a').attr('href');
      const chDate = $el.find('.title2').text().trim();
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

    // MangaHere uses script variables
    const scriptMatch = html.match(/var\s+chapterImages\s*=\s*(\[.*?\]);/s);
    if (scriptMatch) {
      try {
        const chapterImages = JSON.parse(scriptMatch[1]);
        const pathMatch = html.match(/var\s+chapterPath\s*=\s*["'](.*?)["'];/);
        const chapterPath = pathMatch ? pathMatch[1] : '';

        chapterImages.forEach(img => {
          if (img.startsWith('http')) {
            pages.push(img);
          } else {
            pages.push(`https:${chapterPath}${img}`);
          }
        });
      } catch (e) {
        console.error('Failed to parse chapter images:', e);
      }
    }

    // Fallback
    if (pages.length === 0) {
      $('.reader-main img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src) pages.push(src);
      });
    }

    return pages;
  }

  // ─── 4. LATEST ───
  async getLatestManga(page = 1) {
    const html = await this.request(
      `${this.baseUrl}/latest/${page}/`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.manga-list-1-list li').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.manga-list-1-item-title a').text().trim();
      const url = $el.find('.manga-list-1-item-title a').attr('href');
      const cover = $el.find('.manga-list-1-cover img').attr('src')
                 || $el.find('.manga-list-1-cover img').attr('data-original');
      const updated = $el.find('.manga-list-1-item-subtitle').first().text().trim();

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

module.exports = MangaHereScraper;
