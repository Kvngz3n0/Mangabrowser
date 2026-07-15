class MangaApp {
  constructor() {
    this.currentView = 'home';
    this.currentFilter = 'all';
    this.currentChapter = null;
    this.currentPage = 0;
    this.chapterPages = [];
    this.init();
  }

  init() {
    this.createParticles();
    this.bindEvents();
    this.loadStats();
    this.loadLibrary();
  }

  createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 15 + 's';
      p.style.animationDuration = (10 + Math.random() * 10) + 's';
      container.appendChild(p);
    }
  }

  bindEvents() {
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.search();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDetail();
        this.closeReader();
      }
      if (document.getElementById('readerOverlay').classList.contains('active')) {
        if (e.key === 'ArrowRight' || e.key === ' ') this.nextPage();
        if (e.key === 'ArrowLeft') this.prevPage();
      }
    });
  }

  async loadStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      this.animateNumber('totalManga', data.totalManga);
      this.animateNumber('totalChapters', data.totalChapters);
      this.animateNumber('totalSources', data.totalSources);
    } catch (err) { console.error('Stats:', err); }
  }

  animateNumber(id, target) {
    const el = document.getElementById(id);
    const duration = 1500;
    const start = 0;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(start + (target - start) * ease).toLocaleString();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  setView(view) {
    this.currentView = view;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-view="${view}"]`)?.classList.add('active');

    const titles = { home: 'Discover', library: 'Library', latest: 'Latest Updates', manhwa: 'Manhwa', manhua: 'Manhua', webtoon: 'Webtoons' };
    document.getElementById('pageTitle').textContent = titles[view] || 'Discover';

    if (view === 'latest') this.loadLatest();
    else if (view === 'library') this.loadLibrary();
    else if (['manhwa', 'manhua', 'webtoon'].includes(view)) this.loadLibrary(view);
    else this.loadLibrary();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    document.querySelector(`.filter-pill[data-filter="${filter}"]`)?.classList.add('active');
    if (filter === 'all') this.loadLibrary();
    else this.loadLibrary(filter);
  }

  goHome() {
    this.setView('home');
  }

  async loadLibrary(type = null) {
    this.showLoading(true);
    try {
      const url = type ? `/api/library?type=${type}&limit=50` : '/api/library?limit=50';
      const res = await fetch(url);
      const data = await res.json();
      this.renderGrid(data.manga);
    } catch (err) { console.error('Library:', err); }
    finally { this.showLoading(false); }
  }

  async loadLatest() {
    this.showLoading(true);
    try {
      const res = await fetch('/api/latest');
      const data = await res.json();
      const allManga = [];
      data.results.forEach(source => {
        source.data.forEach(manga => {
          allManga.push({ ...manga, source_name: source.source, sources: [{ name: source.source, url: manga.url }] });
        });
      });
      this.renderGrid(allManga);
    } catch (err) { console.error('Latest:', err); }
    finally { this.showLoading(false); }
  }

  async search() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    this.showLoading(true);
    document.getElementById('pageTitle').textContent = `Results for "${query}"`;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      this.renderGrid(data.results);
    } catch (err) { console.error('Search:', err); }
    finally { this.showLoading(false); }
  }

  renderGrid(mangaList) {
    const grid = document.getElementById('mangaGrid');
    grid.innerHTML = '';
    if (!mangaList || mangaList.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted);font-family:var(--font-display);letter-spacing:2px;">No treasures found in the vault</div>`;
      return;
    }

    mangaList.forEach((manga, i) => {
      const card = document.createElement('div');
      card.className = 'manga-card';
      card.style.animationDelay = `${i * 0.05}s`;
      card.innerHTML = `
        <div class="card-type">${manga.type || 'manga'}</div>
        ${manga.sources?.length > 1 ? `<div class="card-source-count">${manga.sources.length} sources</div>` : ''}
        <img class="card-cover" src="${manga.cover || manga.local_cover || ''}" alt="${manga.title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%23111%22 width=%22200%22 height=%22300%22/><text fill=%22%235C4F3A%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 font-family=%22Cinzel%22 font-size=%2214%22>No Cover</text></svg>'">
        <div class="card-overlay">
          <div class="card-title">${manga.title}</div>
          <div class="card-meta">
            <span class="card-author">${manga.author || 'Unknown'}</span>
            ${manga.latestChapter ? `<span class="card-chapter">Ch. ${manga.latestChapter}</span>` : ''}
          </div>
        </div>
      `;
      card.addEventListener('click', () => this.showDetail(manga));
      grid.appendChild(card);
    });
  }

  async showDetail(manga) {
    const overlay = document.getElementById('detailOverlay');
    const content = document.getElementById('detailContent');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    content.innerHTML = `
      <div class="detail-header">
        <div class="detail-cover-wrap">
          <div class="detail-cover-glow"></div>
          <img class="detail-cover" src="${manga.cover || manga.local_cover || ''}" alt="${manga.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22330%22><rect fill=%22%23111%22 width=%22220%22 height=%22330%22/><text fill=%22%235C4F3A%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 font-family=%22Cinzel%22 font-size=%2216%22>No Cover</text></svg>'">
        </div>
        <div class="detail-info">
          <h2>${manga.title}</h2>
          <div class="detail-meta-row">
            <span class="detail-meta-item"><span class="label">Author:</span>${manga.author || 'Unknown'}</span>
            <span class="detail-meta-item"><span class="label">Status:</span>${manga.status || 'Unknown'}</span>
            <span class="detail-meta-item"><span class="label">Type:</span>${manga.type || 'manga'}</span>
          </div>
          <div class="detail-genres">
            ${(manga.genres || []).map(g => `<span class="detail-genre-tag">${g}</span>`).join('')}
          </div>
          <p class="detail-description">${manga.description || 'No description available.'}</p>
          <div class="detail-sources">
            ${(manga.sources || []).map(s => `<span class="detail-source-pill">${s.name}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="chapter-section-title">Chapters</div>
      <div class="chapter-list" id="chapterList">
        <div style="text-align:center;padding:30px;color:var(--text-muted);">Summoning chapters...</div>
      </div>
    `;

    if (manga.id) {
      try {
        const res = await fetch(`/api/manga/${manga.id}`);
        const data = await res.json();
        this.renderChapters(data.chapters || [], manga);
      } catch (err) {
        document.getElementById('chapterList').innerHTML = '<div style="text-align:center;padding:30px;">Failed to load chapters</div>';
      }
    } else {
      document.getElementById('chapterList').innerHTML = '<div style="text-align:center;padding:30px;">Save to library to view chapters</div>';
    }
  }

  renderChapters(chapters, manga) {
    const list = document.getElementById('chapterList');
    if (!chapters || chapters.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">No chapters available</div>';
      return;
    }
    list.innerHTML = chapters.map(ch => `
      <div class="chapter-item" onclick="app.readChapter('${ch.url}', '${ch.source || 'unknown'}', '${manga.title}', ${ch.chapter_number || ch.number || 0})">
        <span class="ch-number">Ch. ${ch.chapter_number || ch.number || '?'}</span>
        <span class="ch-title">${ch.chapter_title || ch.title || 'Untitled'}</span>
        <span class="ch-date">${ch.release_date || ch.date || ''}</span>
        <button class="ch-read-btn">Read</button>
      </div>
    `).join('');
  }

  closeDetail() {
    document.getElementById('detailOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  async readChapter(url, source, title, chapterNum) {
    this.closeDetail();
    const overlay = document.getElementById('readerOverlay');
    document.getElementById('readerTitle').textContent = `${title} - Chapter ${chapterNum}`;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('readerPages').innerHTML = '<div style="padding:40px;color:var(--gold-400);font-family:var(--font-display);">Loading pages...</div>';

    try {
      const res = await fetch(`/api/chapter/${source}/${encodeURIComponent(url)}`);
      const data = await res.json();
      this.chapterPages = data.pages || [];
      this.currentPage = 0;
      this.renderReaderPages();
    } catch (err) {
      document.getElementById('readerPages').innerHTML = '<div style="padding:40px;color:var(--text-muted);">Failed to load pages</div>';
    }
  }

  renderReaderPages() {
    const container = document.getElementById('readerPages');
    if (this.chapterPages.length === 0) {
      container.innerHTML = '<div style="padding:40px;color:var(--text-muted);">No pages available</div>';
      return;
    }
    document.getElementById('readerPage').textContent = `${this.currentPage + 1} / ${this.chapterPages.length}`;
    container.innerHTML = this.chapterPages.map((page, i) => `
      <img src="${page}" alt="Page ${i + 1}" loading="${i === this.currentPage ? 'eager' : 'lazy'}" style="${i === this.currentPage ? '' : 'display:none'}">
    `).join('');
  }

  nextPage() {
    if (this.currentPage < this.chapterPages.length - 1) {
      this.currentPage++;
      this.renderReaderPages();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.renderReaderPages();
    }
  }

  closeReader() {
    document.getElementById('readerOverlay').classList.remove('active');
    document.body.style.overflow = '';
    this.chapterPages = [];
    this.currentPage = 0;
  }

  showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
    document.getElementById('mangaGrid').style.display = show ? 'none' : 'grid';
  }
}

const app = new MangaApp();
