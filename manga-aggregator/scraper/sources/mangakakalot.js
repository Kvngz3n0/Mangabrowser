const BaseScraper = require('../../../base');

class MangaKakalotScraper extends BaseScraper {
  constructor() {
    super('MangaKakalot', 'https://mangakakalot.com', {
      timeout: 15000,
      retries: 3,
      headers: {
        'Referer': 'https://mangakakalot.com/'
      }
    });
    this.baseUrl = 'https://mangakakalot.com';
    this.altBase = 'https://chapmanganato.to';
  }

  // ─── 1. SEARCH ───
  async searchManga(query) {
    const html = await this.request(
      `${this.baseUrl}/search/story/${encodeURIComponent(query).replace(/%20/g, '_')}`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.story_item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.story_name a').text().trim();
      const url = $el.find('.story_name a').attr('href');
      const cover = $el.find('img').attr('src');
      const author = $el.find('.story_item_right span').eq(0).text().replace('Author : ', '').trim();
      const views = $el.find('.story_item_right span').eq(1).text().replace('View : ', '').trim();
      const updated = $el.find('.story_item_right span').eq(2).text().replace('Updated : ', '').trim();

      if (title && url) {
        results.push({
          title,
          url,
          cover,
          author,
          views,
          updated,
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

    const title = $('.story-info-right h1').text().trim() 
               || $('.manga-info-text h1').text().trim();
    const cover = $('.story-info-left img').attr('src')
               || $('.manga-info-pic img').attr('src');
    const description = $('#panel-story-info-description, .noidungm').text()
                       .replace('Description :', '').trim();
    const author = $('.variations-tableInfo tr:contains("Author") td a, .manga-info-text li:contains("Author") a')
                  .first().text().trim() || '';
    const status = $('.variations-tableInfo tr:contains("Status") td, .manga-info-text li:contains("Status")')
                  .text().replace('Status :', '').trim() || 'Unknown';
    const genres = $('.variations-tableInfo tr:contains("Genres") td a, .manga-info-text li:contains("Genres") a')
                  .map((_, a) => $(a).text().trim()).get();
    const rating = $('.manga-info-text li:contains("Rating")').text().match(/(\d+\.?\d*)/)?.[0];
    const views = $('.manga-info-text li:contains("View")').text().replace('View : ', '').trim();

    const chapters = [];
    $('.row-content-chapter li, .chapter-list .row').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('a').text().trim();
      const chUrl = $el.find('a').attr('href');
      const chDate = $el.find('.chapter-time, span').last().text().trim();
      const chViews = $el.find('.chapter-view, span').eq(1).text().trim();
      const chNum = this.extractChapterNumber(chTitle);

      if (chUrl) {
        chapters.push({ 
          number: chNum, 
          title: chTitle, 
          url: chUrl, 
          date: chDate,
          views: chViews
        });
      }
    });

    return {
      title,
      cover,
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

    $('.container-chapter-reader img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) pages.push(src);
    });

    return pages;
  }

  // ─── 4. LATEST ───
  async getLatestManga(page = 1) {
    const html = await this.request(
      `${this.baseUrl}/manga_list?type=latest&category=all&state=all&page=${page}`
    );
    const $ = this.loadHtml(html);
    const results = [];

    $('.list-truyen-item-wrap').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h3 a').text().trim();
      const url = $el.find('h3 a').attr('href');
      const cover = $el.find('.list-story-item img').attr('src');
      const latest = $el.find('.list-story-item-wrap-chapter').first().text().trim();

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

module.exports = MangaKakalotScraper;
