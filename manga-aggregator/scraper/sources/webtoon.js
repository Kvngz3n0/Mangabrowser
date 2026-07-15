const BaseScraper = require('../base');

class WebtoonScraper extends BaseScraper {
  constructor() {
    super('Webtoon', 'https://www.webtoons.com', { timeout: 15000, retries: 3 });
    this.baseUrl = 'https://www.webtoons.com';
  }

  async searchManga(query) {
    const html = await this.request(`${this.baseUrl}/en/search?keyword=${encodeURIComponent(query)}`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.card_lst li').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.subj').text().trim();
      const url = $el.find('a').attr('href');
      const cover = $el.find('.img_lz').attr('src') || $el.find('.img_lz').attr('data-src');
      const author = $el.find('.author').text().trim();
      if (title && url) {
        results.push({ title, url, cover, author, type: 'webtoon' });
      }
    });
    return results;
  }

  async getMangaDetails(mangaUrl) {
    const html = await this.request(mangaUrl);
    const $ = this.loadHtml(html);
    const title = $('.subj').first().text().trim();
    const cover = $('.detail_bg').css('background-image')?.replace(/url\(["']?/,'').replace(/["']?\)/,'') || $('.thmb img').attr('src');
    const description = $('.summary').text().trim();
    const author = $('.author').first().text().trim();
    const genres = $('.genre').map((_, g) => $(g).text().trim()).get();
    const chapters = [];
    $('#_episodeList li').each((_, el) => {
      const $el = $(el);
      const chTitle = $el.find('.subj span').text().trim();
      const chUrl = $el.find('a').attr('href');
      const chNum = this.extractChapterNumber(chTitle);
      const chDate = $el.find('.date').text().trim();
      chapters.push({ number: chNum, title: chTitle, url: chUrl, date: chDate });
    });
    return { title, cover, description, author, genres, status: 'Ongoing', type: 'webtoon', latestChapter: chapters[0]?.number || 0, chapters: chapters.reverse(), url: mangaUrl };
  }

  async getLatestManga(page = 1) {
    const html = await this.request(`${this.baseUrl}/en/dailySchedule`);
    const $ = this.loadHtml(html);
    const results = [];
    $('.daily_lst li').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.subj').text().trim();
      const url = $el.find('a').attr('href');
      const cover = $el.find('.img_lz').attr('src');
      if (title && url) results.push({ title, url, cover });
    });
    return results;
  }
}

module.exports = WebtoonScraper;
