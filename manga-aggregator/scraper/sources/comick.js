const BaseScraper = require('../base');

class ComicKScraper extends BaseScraper {
  constructor() {
    super('ComicK', 'https://comick.io', { timeout: 15000, retries: 3 });
    this.apiBase = 'https://api.comick.fun';
  }

  async searchManga(query) {
    const data = await this.request(`${this.apiBase}/v1.0/search/?q=${encodeURIComponent(query)}&limit=20`);
    return data.map(manga => ({
      title: manga.title || manga.slug,
      url: `${this.apiBase}/comic/${manga.slug}`,
      cover: manga.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${manga.md_covers[0].b2key}` : null,
      latestChapter: manga.last_chapter || 0,
      type: 'manga'
    }));
  }

  async getMangaDetails(mangaUrl) {
    const slug = mangaUrl.split('/').pop();
    const data = await this.request(`${this.apiBase}/comic/${slug}`);
    const comic = data.comic;
    const chaptersData = await this.request(`${this.apiBase}/comic/${slug}/chapters?lang=en&limit=500`);
    const chapters = chaptersData.chapters?.map(ch => ({
      number: parseFloat(ch.chap) || 0,
      title: ch.title || `Chapter ${ch.chap}`,
      url: `${this.apiBase}/chapter/${ch.hid}`,
      date: ch.created_at
    })) || [];
    return {
      title: comic.title,
      altTitles: comic.md_titles?.map(t => t.title) || [],
      description: comic.desc || '',
      cover: comic.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${comic.md_covers[0].b2key}` : null,
      author: comic.md_comic_md_genres?.map(g => g.name).join(', ') || '',
      genres: comic.md_comic_md_genres?.map(g => g.name) || [],
      status: comic.status || 'Unknown',
      type: 'manga',
      latestChapter: chapters[0]?.number || 0,
      chapters,
      url: mangaUrl
    };
  }

  async getLatestManga(page = 1) {
    const data = await this.request(`${this.apiBase}/v1.0/search/?sort=follow&limit=20&page=${page}`);
    return data.map(manga => ({
      title: manga.title,
      url: `${this.apiBase}/comic/${manga.slug}`,
      cover: manga.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${manga.md_covers[0].b2key}` : null,
      latestChapter: manga.last_chapter || 0
    }));
  }
}

module.exports = ComicKScraper;
