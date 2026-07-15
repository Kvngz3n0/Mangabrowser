const BaseScraper = require('../../../base');

class MangaFoxScraper extends BaseScraper {
  constructor() {
    super('MangaFox', 'https://fanfox.net', {
      timeout: 15000,
      retries: 3,
      headers: {
        'Referer': 'https://fanfox.net/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    this.baseUrl = 'https://fanfox.net';
  }

  // ─── 1. SEARCH ───
  async searchManga(query) {
    const html = await this.request(
      `${this.baseUrl}/search?title=${encodeURIComponent(query)}&stype=1`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.manga-list-4-list li').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.manga-list-4-item-title a').text().trim();
      const url = $el.find('.manga-list-4-item-title a').attr('href');
      const cover = $el.find('.manga-list-4-cover img').attr('src') 
                 || $el.find('.manga-list-4-cover img').attr('data-original');
      const latest = $el.find('.manga-list-4-item-subtitle a').first().text().trim();
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

    const title = $('.detail-info-right-title-font').text().trim() 
               || $('.manga-detail .detail-info-right h1').text().trim();
    const cover = $('.detail-info-cover-img').attr('src')
               || $('.manga-detail .detail-info-cover img').attr('src');
    const description = $('.detail-info-right-content').text().trim()
                     || $('.manga-detail .fullcontent').text().trim();
    const author = $('.detail-info-right-say a').first().text().trim() || '';
    const status = $('.detail-info-right-title-tip').text().trim() || 'Unknown';
    const genres = $('.detail-info-right-tag-list a')
                  .map((_, a) => $(a).text().trim()).get();
    const rating = $('.detail-info-right-title-star .item-score').text().trim();

    const chapters = [];
    $('#chapterlist li, .detail-main-list li').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('a').attr('title') || $el.find('.title3').text().trim();
      const chUrl = $el.find('a').attr('href');
      const chDate = $el.find('.title2, .time').text().trim();
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

    // MangaFox uses a script variable to store image data
    const scriptMatch = html.match(/var\s+chapterImages\s*=\s*(\[.*?\]);/s);
    if (scriptMatch) {
      try {
        const chapterImages = JSON.parse(scriptMatch[1]);
        const pathMatch = html.match(/var\s+chapterPath\s*=\s*["'](.*?)["'];/);
        const chapterPath = pathMatch ? pathMatch[1] : '';
        const serverMatch = html.match(/var\s+chapterServer\s*=\s*["'](.*?)["'];/);
        const server = serverMatch ? serverMatch[1] : '//s1.fanfox.net';

        chapterImages.forEach(img => {
          if (img.startsWith('http')) {
            pages.push(img);
          } else {
            pages.push(`${server}${chapterPath}${img}`);
          }
        });
      } catch (e) {
        console.error('Failed to parse chapter images:', e);
      }
    }

    // Fallback: try to find images directly
    if (pages.length === 0) {
      $('.reader-main img, #viewer img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !src.includes('blank.gif')) pages.push(src);
      });
    }

    return pages;
  }

  // ─── 4. LATEST ───
  async getLatestManga(page = 1) {
    const html = await this.request(
      `${this.baseUrl}/directory/?page=${page}&latest`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.manga-list-1-list li, .manga-list-4-list li').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.manga-list-1-item-title a, .manga-list-4-item-title a').text().trim();
      const url = $el.find('.manga-list-1-item-title a, .manga-list-4-item-title a').attr('href');
      const cover = $el.find('.manga-list-1-cover img, .manga-list-4-cover img').attr('src')
                 || $el.find('.manga-list-1-cover img, .manga-list-4-cover img').attr('data-original');

      if (title && url) {
        results.push({ 
          title, 
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`, 
          cover: cover?.startsWith('//') ? `https:${cover}` : cover 
        });
      }
    });
    return results;
  }

  // ─── 5. POPULAR ───
  async getPopularManga(page = 1) {
    const html = await this.request(
      `${this.baseUrl}/directory/?page=${page}&rating`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.manga-list-1-list li, .manga-list-4-list li').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.manga-list-1-item-title a, .manga-list-4-item-title a').text().trim();
      const url = $el.find('.manga-list-1-item-title a, .manga-list-4-item-title a').attr('href');
      const cover = $el.find('.manga-list-1-cover img, .manga-list-4-cover img').attr('src')
                 || $el.find('.manga-list-1-cover img, .manga-list-4-cover img').attr('data-original');
      const rating = $el.find('.manga-list-1-rate-score, .manga-list-4-rate-score').text().trim();

      if (title && url) {
        results.push({ 
          title, 
          url: url.startsWith('http') ? url : `${this.baseUrl}${url}`, 
          cover: cover?.startsWith('//') ? `https:${cover}` : cover,
          rating: rating ? parseFloat(rating) : null
        });
      }
    });
    return results;
  }
}

module.exports = MangaFoxScraper;
