(function () {
  const root         = document.documentElement;
  const navbar       = document.getElementById('navbar');
  const navToggle    = document.querySelector('.nav-toggle');
  const navLinksEl   = document.getElementById('nav-links');
  const navLinkItems = document.querySelectorAll('.nav-link');
  const themeToggle  = document.querySelector('.theme-toggle');
  const sections     = document.querySelectorAll('main section[id]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Email links: build the address at runtime so it isn't in the page source ──
  // <a data-email-user="name" data-email-domain="example.edu" [data-email-show]>
  document.querySelectorAll('[data-email-user]').forEach(link => {
    const address = link.dataset.emailUser + '@' + link.dataset.emailDomain;
    link.href = 'mailto:' + address;
    if ('emailShow' in link.dataset) link.textContent = address;
  });

  // ── Sticky border + active nav link on scroll ───────────────────────
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    const scrollMid = window.scrollY + window.innerHeight / 3;
    let activeId = null;
    sections.forEach(section => {
      if (section.offsetTop <= scrollMid) activeId = section.id;
    });
    // At the very bottom, highlight the last section
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
      activeId = sections[sections.length - 1].id;
    }

    navLinkItems.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile menu ─────────────────────────────────────────────────────
  function closeMenu() {
    navLinksEl.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }

  navToggle.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  navLinkItems.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!navbar.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // ── Light / dark toggle (follows the OS until the visitor picks one) ─
  themeToggle.addEventListener('click', () => {
    const current = root.dataset.theme ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ── "Show more" buttons (research, publications, news) ──────────────
  // Markup: <div class="more" id="X" hidden>…</div> followed by
  // <button class="show-more" aria-controls="X" data-more="…" data-less="…">
  function wireShowMore(button) {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const label = button.querySelector('.show-more-label');
    button.addEventListener('click', () => {
      const opening = panel.hidden;
      panel.hidden = !opening;
      button.setAttribute('aria-expanded', String(opening));
      label.textContent = opening ? button.dataset.less : button.dataset.more;
      if (!opening) {
        const top = button.getBoundingClientRect().top;
        if (top < 80 || top > innerHeight) {
          button.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }
    });
  }
  document.querySelectorAll('.show-more').forEach(wireShowMore);

  // ── Publications (rendered from publications.json) ──────────────────
  // The 5 most recent papers show first; the rest sit behind "show more".
  // To pull in new papers from Google Scholar, run:  python update_publications.py
  const ME = 'S. Poudel';
  const RECENT = 5;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function renderPub(p) {
    const authors = p.authors.map(a => a === ME ? `<strong>${esc(a)}</strong>` : esc(a)).join(', ');
    const links = [{ label: 'Paper', url: p.url }, ...(p.links || [])]
      .map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
    return `
      <li class="pub">
        <span class="pub-year">${p.year ? esc(p.year) : p.type === 'preprint' ? 'Preprint' : ''}</span>
        <div>
          <a class="pub-title" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>
          <p class="pub-authors">${authors}</p>
          <p class="pub-venue"><em>${esc(p.venue)}</em>${p.details ? ', ' + esc(p.details) : ''}</p>
          <div class="pub-links">${links}</div>
        </div>
      </li>`;
  }

  const list = items => `<ol class="pubs">${items.map(renderPub).join('')}</ol>`;

  async function loadPublications() {
    const container = document.getElementById('pub-list');
    if (!container) return;
    try {
      const resp = await fetch('publications.json');
      if (!resp.ok) throw new Error(resp.status);
      // Journal articles newest first (file order breaks ties), then preprints
      const rank = p => (p.type === 'preprint' ? 1 : 0);
      const pubs = (await resp.json())
        .filter(p => !p.hidden && p.url)
        .sort((a, b) => rank(a) - rank(b) || (b.year || 0) - (a.year || 0));

      const recent = pubs.slice(0, RECENT);
      const older = pubs.slice(RECENT);
      container.innerHTML = list(recent) + (older.length ? `
        <div class="more" id="pub-more" hidden>${list(older)}</div>
        <button class="show-more" type="button" aria-expanded="false" aria-controls="pub-more"
                data-more="All publications" data-less="Show less">
          <span class="show-more-label">All publications</span><span class="count">+${older.length}</span>
          <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        </button>` : '');
      container.querySelectorAll('.show-more').forEach(wireShowMore);
    } catch (e) {
      container.innerHTML = `
        <p>See the full list on
          <a href="https://scholar.google.com/citations?user=wMsDspYAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a>.
        </p>`;
    }
  }

  loadPublications();

  // ── Gentle fade-in as sections scroll into view ─────────────────────
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.section-inner').forEach(el => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // ── Footer: year and "last updated" (from the deploy time) ──────────
  document.getElementById('year').textContent = new Date().getFullYear();
  const updated = new Date(document.lastModified);
  if (!isNaN(updated)) {
    document.querySelector('.updated').textContent =
      ' · Updated ' + updated.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
})();
