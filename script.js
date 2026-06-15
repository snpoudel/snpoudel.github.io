(function () {
  const navbar       = document.getElementById('navbar');
  const navToggle    = document.querySelector('.nav-toggle');
  const navLinksEl   = document.getElementById('nav-links');
  const navLinkItems = document.querySelectorAll('.nav-link');
  const sections     = document.querySelectorAll('section[id]');

  // ── Sticky shadow + active nav link on scroll ───────────────────────
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 10);

    const scrollMid = window.scrollY + window.innerHeight / 3;
    let activeId = null;
    sections.forEach(section => {
      if (section.offsetTop <= scrollMid) activeId = section.id;
    });

    navLinkItems.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile hamburger ────────────────────────────────────────────────
  navToggle.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
      navLinksEl.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      navLinksEl.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ── Publications: load from pre-fetched publications.json ──────────────
  // To refresh, run:  python update_publications.py
  async function loadPublications() {
    const container = document.getElementById('pub-list');
    if (!container) return;

    try {
      const resp = await fetch('publications.json');
      if (!resp.ok) throw new Error('not found');
      const pubs = await resp.json();
      renderPubs(container, pubs);
    } catch (e) {
      container.innerHTML = `
        <p class="pub-fallback">
          View the full list on
          <a href="https://scholar.google.com/citations?user=wMsDspYAAAAJ&hl=en"
             target="_blank" rel="noopener">Google Scholar</a>.
        </p>`;
    }
  }

  function formatCitation(authors, year) {
    if (!authors || authors.length === 0) return year;
    if (authors.length === 1) return `${authors[0]} (${year})`;
    if (authors.length === 2) return `${authors[0]} and ${authors[1]} (${year})`;
    return `${authors[0]} et al. (${year})`;
  }

  function renderPubs(container, pubs) {
    container.innerHTML = '<div class="pub-list-inner">' +
      pubs.map(p => `
        <div class="pub-item">
          <span class="pub-citation">${formatCitation(p.authors, p.year)}${p.venue ? `&ensp;&middot;&ensp;<span class="pub-venue">${p.venue}</span>` : ''}</span>
          <a href="${p.url}" target="_blank" rel="noopener" class="pub-title">${p.title}</a>
        </div>
      `).join('') +
    '</div>';
  }

  loadPublications();
})();
