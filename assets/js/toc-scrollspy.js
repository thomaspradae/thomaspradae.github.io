// assets/js/toc-scrollspy.js — experiment-style snake + state
(() => {
  const SEL = {
    toc: "#left-toc.left-toc",
    main: "#main.post",
    body: "#main.post .post-body",
    headings: "h2, h3, h4, h5, h6",
    title: ".page-title"
  };

  let tocItemEls = [];
  let railRAF = null;
  let hasScrolledOnce = false;

  const scheduleUpdate = () => {
    if (railRAF) return;
    railRAF = requestAnimationFrame(() => {
      railRAF = null;
      updateTOCState();
      updateRailProgress();
      updateActiveLink();
    });
  };

  function updateTOCState() {
    const body = document.body;
    const firstTitle = document.querySelector(SEL.title);

    if (!hasScrolledOnce && (window.scrollY || document.documentElement.scrollTop) > 6) {
      hasScrolledOnce = true;
    }

    body.classList.toggle("toc-open", !hasScrolledOnce);
    body.classList.toggle("toc-collapsed", hasScrolledOnce);

    if (firstTitle) {
      const rect = firstTitle.getBoundingClientRect();
      const titleFullyGone = rect.bottom <= 0;

      body.classList.toggle("title-hidden", !titleFullyGone);
      body.classList.toggle("title-toc-visible", titleFullyGone);
    } else {
      body.classList.remove("title-hidden");
      body.classList.remove("title-toc-visible");
    }
  }

  function updateRailProgress() {
    const toc = document.querySelector(SEL.toc);
    const main = document.querySelector(SEL.main);
    if (!toc || !main) return;

    tocItemEls = Array.from(toc.querySelectorAll(".toc-item"));
    if (!tocItemEls.length) return;

    const railRect = toc.getBoundingClientRect();
    const railHeight = railRect.height;

    const articleHeight = main.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const mainRect = main.getBoundingClientRect();
    const articleTop = mainRect.top + scrollY;
    const scrollStart = articleTop;
    const scrollEnd = articleTop + articleHeight - viewportHeight;
    const scrollRange = Math.max(1, scrollEnd - scrollStart);

    const snakeH = Math.min(
      railHeight,
      Math.max(20, (viewportHeight / Math.max(1, articleHeight)) * railHeight)
    );

    const maxTop = Math.max(0, railHeight - snakeH);
    const t = Math.max(0, Math.min(1, (scrollY - scrollStart) / scrollRange));
    const snakeTop = t * maxTop;
    const snakeBot = snakeTop + snakeH;

    for (const el of tocItemEls) {
      const r = el.getBoundingClientRect();
      const itTop = r.top - railRect.top;
      const itBot = r.bottom - railRect.top;

      const overlapTop = Math.max(itTop, snakeTop);
      const overlapBot = Math.min(itBot, snakeBot);
      const overlapH = Math.max(0, overlapBot - overlapTop);

      if (overlapH <= 0) {
        el.style.setProperty("--snake-h", "0px");
        continue;
      }

      el.style.setProperty("--snake-top", (overlapTop - itTop) + "px");
      el.style.setProperty("--snake-h", overlapH + "px");
    }
  }

  function updateActiveLink() {
    const toc = document.querySelector(SEL.toc);
    const article = document.querySelector(SEL.body);
    if (!toc || !article) return;

    const headings = Array.from(article.querySelectorAll(SEL.headings)).filter(h => h.id);
    if (!headings.length) return;

    const probeY = window.scrollY + 140;
    let active = null;

    for (const h of headings) {
      const top = h.getBoundingClientRect().top + window.scrollY;
      if (top <= probeY) active = h;
      else break;
    }

    toc.querySelectorAll("a.toc-active").forEach(a => a.classList.remove("toc-active"));
    if (!active) return;

    const link = toc.querySelector(`a[href="#${CSS.escape(active.id)}"]`);
    if (link) link.classList.add("toc-active");
  }

  function init() {
    scheduleUpdate();

    const main = document.querySelector(SEL.main);
    if (!main) return;

    const ro = new ResizeObserver(scheduleUpdate);
    ro.observe(main);

    main.querySelectorAll("img").forEach(img => {
      if (!img.complete) img.addEventListener("load", scheduleUpdate, { once: true });
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
  }

  document.addEventListener("toc:built", init);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
