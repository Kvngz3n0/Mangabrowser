const {
  MangaDexScraper,
  MangaFoxScraper,
  MangaKakalotScraper,
  MangaNatoScraper,
  MangaHereScraper,
  MangaParkScraper,
  ReaperScansScraper,
  AsuraScansScraper,
  WebtoonScraper,
  MangaSeeScraper,
  KingOfShoujoScraper
} = require('./index');

async function testScraper(ScraperClass, name) {
  console.log(`\n=== Testing ${name} ===`);
  try {
    const scraper = new ScraperClass();

    // Test search
    console.log(`Searching on ${name}...`);
    const searchResults = await scraper.searchManga('one piece');
    console.log(`Found ${searchResults.length} results`);
    if (searchResults.length > 0) {
      console.log('First result:', {
        title: searchResults[0].title,
        url: searchResults[0].url
      });

      // Test details (only for first result)
      console.log('Getting details...');
      const details = await scraper.getMangaDetails(searchResults[0].url);
      console.log('Title:', details.title);
      console.log('Chapters:', details.chapters?.length || 0);

      // Test chapter pages (only if chapters exist)
      if (details.chapters && details.chapters.length > 0) {
        console.log('Getting chapter pages...');
        const pages = await scraper.getChapterPages(details.chapters[0].url);
        console.log('Pages:', pages.length);
      }
    }

    // Test latest
    console.log('Getting latest manga...');
    const latest = await scraper.getLatestManga(1);
    console.log(`Found ${latest.length} latest manga`);

  } catch (error) {
    console.error(`Error testing ${name}:`, error.message);
  }
}

async function main() {
  const scrapers = [
    { class: MangaDexScraper, name: 'MangaDex' },
    { class: MangaFoxScraper, name: 'MangaFox' },
    { class: MangaKakalotScraper, name: 'MangaKakalot' },
    { class: MangaNatoScraper, name: 'MangaNato' },
    { class: MangaHereScraper, name: 'MangaHere' },
    { class: MangaParkScraper, name: 'MangaPark' },
    { class: ReaperScansScraper, name: 'ReaperScans' },
    { class: AsuraScansScraper, name: 'AsuraScans' },
    { class: WebtoonScraper, name: 'Webtoon' },
    { class: MangaSeeScraper, name: 'MangaSee' },
    { class: KingOfShoujoScraper, name: 'KingOfShoujo' }
  ];

  for (const { class: ScraperClass, name } of scrapers) {
    await testScraper(ScraperClass, name);
  }
}

main().catch(console.error);
