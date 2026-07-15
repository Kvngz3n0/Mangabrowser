const BaseScraper = require('../base');

class MangaPlusScraper extends BaseScraper {
  constructor() {
    super('MangaPlus', 'https://mangaplus.shueisha.co.jp', { timeout: 15000, retries: 3 });
    this.apiBase = 'https://jumpg-webapi.tokyo-cdn.com/api';
  }

  async searchManga(query) {
    const data = await this.request(`${this.apiBase}/title_searchV2?word=${encodeURIComponent(query)}&start=1&count=20`);
    const titles = data.success?.titleList || [];
    return titles.map(manga => ({
      title: manga.title,
      url: `${this.apiBase}/title_detail?title_id=${manga.titleId}`,
      cover: manga.thumbnailUrl,
      author: manga.author,
      latestChapter: manga.lastChapterNumber || 0,
      type: 'manga'
    }));
  }

  async getMangaDetails(mangaUrl) {
    const titleId = new URL(mangaUrl).searchParams.get('title_id');
    const data = await this.request(`${this.apiBase}/title_detail?title_id=${titleId}`);
    const title = data.success?.titleDetailView;
    const chapters = title?.chapterList?.map(ch => ({
      number: ch.chapterNumber || 0,
      title: ch.chapterName || `Chapter ${ch.chapterNumber}`,
      url: `${this.apiBase}/manga_viewer?chapter_id=${ch.chapterId}`,
      date: ch.startTimeStamp
    })) || [];
    return {
      title: title?.title || '',
      cover: title?.thumbnailUrl,
      description: title?.overview || '',
      author: title?.author || '',
      genres: [],
      status: title?.isCompleted ? 'Completed' : 'Ongoing',
      type: 'manga',
      latestChapter: chapters[0]?.number || 0,
      chapters,
      url: mangaUrl
    };
  }

  async getLatestManga(page = 1) {
    const data = await this.request(`${this.apiBase}/web/web_homeV4?lang=en&start_from=1&count=20`);
    const titles = data.success?.titleRanking?.titles || [];
    return titles.map(manga => ({
      title: manga.title,
      url: `${this.apiBase}/title_detail?title_id=${manga.titleId}`,
      cover: manga.thumbnailUrl,
      latestChapter: manga.lastChapterNumber || 0
    }));
  }
}

module.exports = MangaPlusScraper;
