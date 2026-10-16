(() => {
  const root = document.documentElement;

  // Theme toggle
  const toggle = document.querySelector('[data-theme-toggle]');
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Publications: selected/all tabs, text filter, expandable rows
  const pubs = [...document.querySelectorAll('#pubs .pub')];
  const tabs = [...document.querySelectorAll('.seg button')];
  const ind = document.querySelector('.seg-ind');
  const q = document.getElementById('q');
  const empty = document.querySelector('#research .empty');
  let mode = 'selected';

  pubs.forEach((p) => {
    p.dataset.search = p.querySelector('.pub-row').textContent.replace(/\s+/g, ' ').toLowerCase();
  });

  const moveInd = () => {
    const on = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (!on || !ind) return;
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
  };

  const apply = () => {
    const term = (q?.value || '').trim().toLowerCase();
    // Searching always looks through everything.
    const scope = term ? 'all' : mode;
    let shown = 0;
    pubs.forEach((p) => {
      const ok = (scope === 'all' || p.dataset.sel === 'true') && (!term || p.dataset.search.includes(term));
      p.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  };

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      mode = t.dataset.f;
      tabs.forEach((b) => b.setAttribute('aria-selected', String(b === t)));
      moveInd();
      apply();
    })
  );

  q?.addEventListener('input', apply);
  q?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { q.value = ''; apply(); q.blur(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== q && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      q?.focus();
    }
  });


  // Hover magnifier: zooms toward the cursor using a full-resolution image
  const attachZoom = (fig) => {
    if (!matchMedia('(hover: hover)').matches) return;
    const img = fig.querySelector('img');
    const lens = document.createElement('div');
    lens.className = 'lens';
    fig.appendChild(lens);
    const ZOOM = 3;
    let loaded = false;
    const place = (e) => {
      const r = img.getBoundingClientRect();
      const f = fig.getBoundingClientRect();
      Object.assign(lens.style, {
        left: r.left - f.left + 'px', top: r.top - f.top + 'px',
        width: r.width + 'px', height: r.height + 'px', right: 'auto', bottom: 'auto',
        backgroundSize: r.width * ZOOM + 'px ' + r.height * ZOOM + 'px',
      });
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      lens.style.backgroundPosition = x * 100 + '% ' + y * 100 + '%';
    };
    img.addEventListener('mouseenter', (e) => {
      if (!loaded) { lens.style.backgroundImage = `url("${fig.dataset.zoom}")`; loaded = true; }
      fig.classList.add('zooming');
      place(e);
    });
    img.addEventListener('mousemove', place);
    img.addEventListener('mouseleave', () => fig.classList.remove('zooming'));
  };

  // Poster viewer: opens the poster in an overlay with the magnifier
  document.querySelectorAll('[data-zoom-open]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const v = document.createElement('div');
      v.className = 'viewer';
      v.innerHTML = `<button class="btn icon close" type="button" aria-label="Close">✕</button>
        <figure data-zoom="${a.href}"><img src="${a.dataset.preview}" alt="Poster" /></figure>`;
      document.body.appendChild(v);
      attachZoom(v.querySelector('figure'));
      const close = () => { v.remove(); removeEventListener('keydown', onKey); };
      const onKey = (k) => { if (k.key === 'Escape') close(); };
      addEventListener('keydown', onKey);
      v.addEventListener('click', (k) => { if (!k.target.closest('img')) close(); });
    });
  });

  // News: show the first few items, scroll for the rest
  const news = document.querySelector('.list.news');
  const fitNews = () => {
    if (!news) return;
    const items = news.querySelectorAll(':scope > li');
    const n = +news.dataset.show || 4;
    if (items.length <= n) return;
    const last = items[n - 1];
    news.style.maxHeight = last.offsetTop + last.offsetHeight + 'px';
    news.classList.add('more');
  };
  news?.addEventListener('scroll', () => {
    news.classList.toggle('end', news.scrollTop + news.clientHeight >= news.scrollHeight - 2);
  });
  fitNews();
  document.fonts?.ready.then(fitNews);
  addEventListener('resize', fitNews);

  moveInd();
  document.fonts?.ready.then(moveInd);
  addEventListener('resize', moveInd);

  // Hover highlight that glides between rows
  if (matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.list').forEach((list) => {
      const g = document.createElement('div');
      g.className = 'glide';
      list.prepend(g);
      list.addEventListener('mouseover', (e) => {
        const li = e.target.closest('.list > li');
        if (!li || li.parentElement !== list) return;
        const target = li.querySelector('.row, .pub-row') || li;
        g.style.transform = `translateY(${li.offsetTop + target.offsetTop}px)`;
        g.style.height = target.offsetHeight + 'px';
        g.style.opacity = '1';
      });
      list.addEventListener('mouseleave', () => { g.style.opacity = '0'; });
    });
  }

  // Highlight the section in view in the top nav
  const links = [...document.querySelectorAll('.jump a')];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  links.forEach((a) => {
    const s = document.querySelector(a.getAttribute('href'));
    if (s) io.observe(s);
  });
})();
