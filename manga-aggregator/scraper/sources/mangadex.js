const BaseScraper = require('../base');

class MangaDexScraper extends BaseScraper {
  constructor() {
    super('MangaDex', 'https://api.mangadex.org', { timeout: 15000, retries: 3 });
    this.apiBase = 'https://api.mangadex.org';
    this.cdnBase = 'https://uploads.mangadex.org';
  }

  async searchManga(query) {
    const data = await this.request(`${this.apiBase}/manga`, {
      params: { title: query, limit: 20, includes: ['cover_art', 'author', 'artist'] }
    });
    return data.data.map(manga => {
      const attributes = manga.attributes;
      const relationships = manga.relationships || [];
      const coverArt = relationships.find(r => r.type === 'cover_art');
      const author = relationships.find(r => r.type === 'author');
      const artist = relationships.find(r => r.type === 'artist');
      const coverFilename = coverArt?.attributes?.fileName;
      const coverUrl = coverFilename ? `${this.cdnBase}/covers/${manga.id}/${coverFilename}` : null;
      return {
        id: manga.id,
        title: attributes.title?.en || Object.values(attributes.title)[0] || 'Unknown',
        altTitles: attributes.altTitles?.map(t => Object.values(t)[0]) || [],
        description: attributes.description?.en || '',
        cover: coverUrl,
        author: author?.attributes?.name || '',
        artist: artist?.attributes?.name || '',
        genres: attributes.tags?.map(t => t.attributes?.name?.en).filter(Boolean) || [],
        status: attributes.status || 'Unknown',
        type: 'manga',
        latestChapter: 0,
        url: `${this.apiBase}/manga/${manga.id}`
      };
    });
  }

  async getMangaDetails(mangaId) {
    const data = await this.request(`${this.apiBase}/manga/${mangaId}`, { params: { includes: ['cover_art', 'author', 'artist'] } });
    const manga = data.data;
    const attributes = manga.attributes;
    const relationships = manga.relationships || [];
    const coverArt = relationships.find(r => r.type === 'cover_art');
    const author = relationships.find(r => r.type === 'author');
    const artist = relationships.find(r => r.type === 'artist');
    const coverFilename = coverArt?.attributes?.fileName;
    const coverUrl = coverFilename ? `${this.cdnBase}/covers/${manga.id}/${coverFilename}` : null;
    const chaptersData = await this.request(`${this.apiBase}/manga/${mangaId}/feed`, {
      params: { limit: 500, translatedLanguage: ['en'], order: { chapter: 'desc' } }
    });
    const chapters = chaptersData.data.map(ch => ({
      id: ch.id, number: parseFloat(ch.attributes.chapter) || 0,
      title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
      volume: ch.attributes.volume, pages: ch.attributes.pages,
      date: ch.attributes.publishAt, url: `${this.apiBase}/at-home/server/${ch.id}`
    }));
    return {
      id: manga.id, title: attributes.title?.en || Object.values(attributes.title)[0],
      altTitles: attributes.altTitles?.map(t => Object.values(t)[0]) || [],
      description: attributes.description?.en || '', cover: coverUrl,
      author: author?.attributes?.name || '', artist: artist?.attributes?.name || '',
      genres: attributes.tags?.map(t => t.attributes?.name?.en).filter(Boolean) || [],
      status: attributes.status, type: 'manga', latestChapter: chapters[0]?.number || 0,
      chapters, url: `${this.apiBase}/manga/${mangaId}`
    };
  }

  async getChapterPages(chapterId) {
    const data = await this.request(`${this.apiBase}/at-home/server/${chapterId}`);
    const { baseUrl, chapter } = data;
    return chapter.data.map(page => `${baseUrl}/data/${chapter.hash}/${page}`);
  }

  async getLatestManga(page = 1) {
    const data = await this.request(`${this.apiBase}/manga`, {
      params: { limit: 20, offset: (page - 1) * 20, includes: ['cover_art'], order: { updatedAt: 'desc' } }
    });
    return data.data.map(manga => {
      const coverArt = manga.relationships?.find(r => r.type === 'cover_art');
      const coverFilename = coverArt?.attributes?.fileName;
      return {
        id: manga.id, title: manga.attributes.title?.en || Object.values(manga.attributes.title)[0],
        cover: coverFilename ? `${this.cdnBase}/covers/${manga.id}/${coverFilename}` : null,
        latestChapter: 0, url: `${this.apiBase}/manga/${manga.id}`
      };
    });
  }

  async getPopularManga(page = 1) {
    const data = await this.request(`${this.apiBase}/manga`, {
      params: { limit: 20, offset: (page - 1) * 20, includes: ['cover_art'], order: { followedCount: 'desc' } }
    });
    return data.data.map(manga => {
      const coverArt = manga.relationships?.find(r => r.type === 'cover_art');
      const coverFilename = coverArt?.attributes?.fileName;
      return {
        id: manga.id, title: manga.attributes.title?.en || Object.values(manga.attributes.title)[0],
        cover: coverFilename ? `${this.cdnBase}/covers/${manga.id}/${coverFilename}` : null,
        latestChapter: 0, url: `${this.apiBase}/manga/${manga.id}`
      };
    });
  }
}

module.exports = MangaDexScraper;
