// assets/js/toc-scrollspy.js
(() => {
  const SEL = {
    toc: 'nav#left-toc.left-toc',
    main: '#main.post',
    body: '#main.post .post-body',
    headings: 'h2, h3, h4, h5, h6',
  };

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function ensureIndicator(toc) {
    let el = toc.querySelector('.toc-rail-indicator');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toc-rail-indicator';
      toc.appendChild(el);
    }
    return el;
  }

  function clearTicks(toc) {
    toc.querySelectorAll('.toc-rail-tick').forEach(n => n.remove());
  }

  function buildTicks(toc, headings, articleTop, articleHeight, railHeight) {
    clearTicks(toc);

    // ticks for H2 only (LessWrong-ish). change filter if you want.
    headings
      .filter(h => h.tagName === 'H2')
      .forEach(h => {
        const y = (h.getBoundingClientRect().top + window.scrollY - articleTop) / articleHeight;
        const tickTop = clamp01(y) * railHeight;

        const tick = document.createElement('div');
        tick.className = 'toc-rail-tick';
        tick.style.top = `${tickTop}px`;
        toc.appendChild(tick);
      });
  }

  function setActiveLink(toc, headings, probeY) {
    // last heading whose top is above probeY
    let active = null;
    for (const h of headings) {
      const top = h.getBoundingClientRect().top + window.scrollY;
      if (top <= probeY) active = h;
      else break;
    }

    toc.querySelectorAll('a.toc-active').forEach(a => a.classList.remove('toc-active'));
    if (!active) return;

    const link = toc.querySelector(`a[href="#${CSS.escape(active.id)}"]`);
    if (link) link.classList.add('toc-active');
  }

  function update(toc, main, headings, indicator) {
    // Use the article column as the truth source for top/height.
    const articleTop = main.getBoundingClientRect().top + window.scrollY;
    const articleHeight = main.offsetHeight;

    // Rail height is the visible TOC box height (since it's sticky)
    const railHeight = toc.getBoundingClientRect().height;

    // Probe point: slightly below top of viewport feels good
    const probeY = window.scrollY + 140;

    const progress = clamp01((probeY - articleTop) / articleHeight);
    const progressPx = progress * railHeight;

    toc.style.setProperty('--toc-progress-y', `${progressPx}px`);
    indicator.style.top = `${progressPx}px`;

    setActiveLink(toc, headings, probeY);
    // keep these available if you want them for other styles
    toc.style.setProperty('--toc-active-y', `${progressPx}px`);
  }

  function init() {
    const toc = document.querySelector(SEL.toc);
    const main = document.querySelector(SEL.main);
    if (!toc || !main) return;

    const article = document.querySelector(SEL.body) || main;
    const headings = Array.from(article.querySelectorAll(SEL.headings))
      .filter(h => h.id); // your toc.js guarantees ids

    const indicator = ensureIndicator(toc);

    const rebuild = () => {
      const articleTop = main.getBoundingClientRect().top + window.scrollY;
      const articleHeight = main.offsetHeight;
      const railHeight = toc.getBoundingClientRect().height;
      buildTicks(toc, headings, articleTop, articleHeight, railHeight);
      update(toc, main, headings, indicator);
    };

    // first pass
    rebuild();

    // keep in sync with images/fonts/mathjax layout shifts
    const ro = new ResizeObserver(rebuild);
    ro.observe(main);

    window.addEventListener('scroll', () => update(toc, main, headings, indicator), { passive: true });
    window.addEventListener('resize', rebuild);
  }

  // If toc.js builds first, we still init on DOMContentLoaded.
  // If toc.js builds later, this also catches it.
  document.addEventListener('toc:built', init);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
