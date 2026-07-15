const MangaDexScraper = require('./mangadex');
const MangaNatoScraper = require('./manganato');
const MangaSeeScraper = require('./mangasee');
const BatoToScraper = require('./batoto');
const ComicKScraper = require('./comick');
const AsuraScansScraper = require('./asurascans');
const WebtoonScraper = require('./webtoon');
const MangaPlusScraper = require('./mangaplus');
const TemplateScraper = require('./template');

function registerAllScrapers(engine) {
  engine.register('MangaDex', new MangaDexScraper());
  engine.register('MangaNato', new MangaNatoScraper());
  engine.register('MangaSee', new MangaSeeScraper());
  engine.register('Bato.to', new BatoToScraper());
  engine.register('ComicK', new ComicKScraper());
  engine.register('AsuraScans', new AsuraScansScraper());
  engine.register('Webtoon', new WebtoonScraper());
  engine.register('MangaPlus', new MangaPlusScraper());

  const additionalSources = [
    { name: 'FlameScans', url: 'https://flamecomics.com', type: 'manhwa' },
    { name: 'ReaperScans', url: 'https://reaperscans.com', type: 'manhwa' },
    { name: 'TritiniaScans', url: 'https://tritinia.com', type: 'manhwa' },
    { name: 'ManhuaPlus', url: 'https://manhuaplus.com', type: 'manhua' },
    { name: 'ManhuaSY', url: 'https://manhuasy.com', type: 'manhua' },
    { name: '1stKissManga', url: 'https://1stkissmanga.io', type: 'manga' },
    { name: 'MangaBuddy', url: 'https://mangabuddy.com', type: 'manga' },
    { name: 'MangaPark', url: 'https://mangapark.net', type: 'manga' },
    { name: 'MangaTown', url: 'https://mangatown.com', type: 'manga' },
    { name: 'MangaReader', url: 'https://mangareader.to', type: 'manga' },
    { name: 'MangaOwl', url: 'https://mangaowl.io', type: 'manga' },
    { name: 'MangaHub', url: 'https://mangahub.io', type: 'manga' },
    { name: 'MangaClash', url: 'https://mangaclash.com', type: 'manga' },
    { name: 'MangaSY', url: 'https://mangasy.com', type: 'manga' },
    { name: 'MangaGreat', url: 'https://mangagreat.com', type: 'manga' },
    { name: 'KunManga', url: 'https://kunmanga.com', type: 'manga' },
    { name: 'ZinManga', url: 'https://zinmanga.com', type: 'manga' },
    { name: 'MangaForFree', url: 'https://mangaforfree.net', type: 'manga' },
    { name: 'Manga18FX', url: 'https://manga18fx.com', type: 'manga' },
    { name: 'Manhwa18', url: 'https://manhwa18.net', type: 'manhwa' },
    { name: 'Hiperdex', url: 'https://hiperdex.com', type: 'manhwa' },
    { name: 'Toonily', url: 'https://toonily.com', type: 'manhwa' },
    { name: 'ReadManhwa', url: 'https://readmanhwa.com', type: 'manhwa' },
    { name: 'ManhwaClub', url: 'https://manhwaclub.com', type: 'manhwa' },
    { name: 'WebToonily', url: 'https://webtoonily.com', type: 'manhwa' },
    { name: 'ManhuaES', url: 'https://manhuaes.com', type: 'manhua' },
    { name: 'ManhuaFast', url: 'https://manhuafast.com', type: 'manhua' },
    { name: 'Manhuaus', url: 'https://manhuaus.com', type: 'manhua' },
    { name: 'MangaKatana', url: 'https://mangakatana.com', type: 'manga' },
    { name: 'MangaPill', url: 'https://mangapill.com', type: 'manga' },
    { name: 'MangaRaw', url: 'https://manga-raw.club', type: 'manga' },
    { name: 'RawKuma', url: 'https://rawkuma.com', type: 'manga' },
    { name: 'SenManga', url: 'https://raw.senmanga.com', type: 'manga' },
    { name: 'Manga1000', url: 'https://manga1000.com', type: 'manga' },
    { name: 'Manga1001', url: 'https://manga1001.su', type: 'manga' },
    { name: 'NineManga', url: 'https://ninemanga.com', type: 'manga' },
    { name: 'MangaPanda', url: 'https://mangapanda.com', type: 'manga' },
    { name: 'MangaHere', url: 'https://mangahere.cc', type: 'manga' },
    { name: 'MangaFox', url: 'https://fanfox.net', type: 'manga' },
    { name: 'MangaLife', url: 'https://manga4life.com', type: 'manga' },
    { name: 'MangaNelo', url: 'https://manganelo.tv', type: 'manga' },
    { name: 'MangaBat', url: 'https://mangabat.com', type: 'manga' },
    { name: 'MangaJar', url: 'https://mangajar.com', type: 'manga' },
    { name: 'Manga347', url: 'https://manga347.com', type: 'manga' },
    { name: 'MangaSail', url: 'https://mangasail.com', type: 'manga' },
    { name: 'MangaWindow', url: 'https://mangawindow.net', type: 'manga' },
    { name: 'MangaTurf', url: 'https://mangaturf.com', type: 'manga' },
    { name: 'MangaMutiny', url: 'https://mangamutiny.com', type: 'manga' },
    { name: 'ComicLatest', url: 'https://comiclatest.com', type: 'manga' },
    { name: 'MangaDogs', url: 'https://mangadogs.fun', type: 'manga' },
    { name: 'Manga1s', url: 'https://manga1s.com', type: 'manga' },
    { name: 'MangaKiss', url: 'https://mangakiss.org', type: 'manga' },
    { name: 'BoomManga', url: 'https://boommanga.com', type: 'manga' },
    { name: 'KooManga', url: 'https://koomanga.com', type: 'manga' },
    { name: 'MangaArab', url: 'https://mangaarab.com', type: 'manga' },
    { name: 'MangaStarz', url: 'https://mangastarz.com', type: 'manga' },
    { name: 'MangaSpark', url: 'https://mangaspark.com', type: 'manga' },
    { name: 'MangaSwat', url: 'https://mangaswat.com', type: 'manga' },
    { name: 'NightComic', url: 'https://nightcomic.com', type: 'manga' },
    { name: 'ManhwaSmut', url: 'https://manhwasmut.com', type: 'manhwa' },
    { name: 'WebComics', url: 'https://webcomicsapp.com', type: 'webtoon' },
    { name: 'MangaToon', url: 'https://mangatoon.mobi', type: 'webtoon' },
    { name: 'BilibiliComics', url: 'https://bilibilicomics.com', type: 'manhua' },
    { name: 'Toomics', url: 'https://toomics.com', type: 'webtoon' },
    { name: 'Tappytoon', url: 'https://tappytoon.com', type: 'webtoon' },
    { name: 'Tapas', url: 'https://tapas.io', type: 'webtoon' },
    { name: 'Lezhin', url: 'https://lezhin.com', type: 'webtoon' },
    { name: 'KakaoPage', url: 'https://kakao.com', type: 'webtoon' },
    { name: 'Piccoma', url: 'https://piccoma.com', type: 'manga' },
    { name: 'ComicWalker', url: 'https://comic-walker.com', type: 'manga' },
    { name: 'NicoNico', url: 'https://seiga.nicovideo.jp', type: 'manga' },
    { name: 'GanganOnline', url: 'https://www.ganganonline.com', type: 'manga' },
    { name: 'SundayWebry', url: 'https://www.sunday-webry.com', type: 'manga' },
    { name: 'TonariNoYoungJump', url: 'https://tonarinoyj.jp', type: 'manga' },
    { name: 'ShonenJumpPlus', url: 'https://shonenjumpplus.com', type: 'manga' },
    { name: 'PixivComics', url: 'https://comic.pixiv.net', type: 'manga' }
  ];

  for (const source of additionalSources) {
    engine.register(source.name, new TemplateScraper(source.name, source.url, { type: source.type }));
  }
}

module.exports = { registerAllScrapers };
