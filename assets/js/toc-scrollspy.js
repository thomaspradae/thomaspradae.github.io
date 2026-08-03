// assets/js/toc-scrollspy.js — single-element snake + state
(() => {
  const SEL = {
    toc: "#left-toc.left-toc",
    rail: "#left-toc.left-toc .toc-rail",
    snake: "#left-toc.left-toc .toc-snake",
    gapLayer: "#left-toc.left-toc .toc-gap-layer",
    main: "#main.post",
    body: "#main.post .post-body-content",
    headings: "h2, h3, h4, h5, h6",
    title: ".page-title"
  };

  let state = null;
  let railRAF = null;
  let hasScrolledOnce = false;
  let listenersBound = false;
  let resizeObserver = null;

  function setBodyFlag(className, shouldHave) {
    const hasClass = document.body.classList.contains(className);
    if (hasClass !== shouldHave) {
      document.body.classList.toggle(className, shouldHave);
    }
  }

  function collectState() {
    const toc = document.querySelector(SEL.toc);
    const rail = document.querySelector(SEL.rail);
    const main = document.querySelector(SEL.main);
    const article = document.querySelector(SEL.body);

    if (!toc || !rail || !main || !article) return null;

    return {
      toc,
      rail,
      snake: document.querySelector(SEL.snake),
      gapLayer: document.querySelector(SEL.gapLayer),
      main,
      article,
      title: document.querySelector(SEL.title),
      tocItemEls: Array.from(toc.querySelectorAll(".toc-item")),
      cachedMetrics: [],
      railMetrics: null,
      titleMetrics: null,
      headingMetrics: [],
      linkById: new Map(),
      activeHeadingId: null,
      snakeTop: null
    };
  }

  function scheduleUpdate() {
    if (railRAF || !state) return;

    railRAF = requestAnimationFrame(() => {
      railRAF = null;
      updateTOCState();
      updateRailProgress();
      updateActiveLink();
    });
  }

  function updateTOCState() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    if (!hasScrolledOnce && scrollY > 6) {
      hasScrolledOnce = true;
    }

    setBodyFlag("toc-open", !hasScrolledOnce);
    setBodyFlag("toc-collapsed", hasScrolledOnce);

    if (state?.titleMetrics) {
      const titleFullyGone = state.titleMetrics.bottom <= scrollY;
      setBodyFlag("title-hidden", !titleFullyGone);
      setBodyFlag("title-toc-visible", titleFullyGone);
    } else {
      setBodyFlag("title-hidden", false);
      setBodyFlag("title-toc-visible", false);
    }
  }

  function measureRailMetrics() {
    if (!state?.rail || !state.main) {
      if (state) state.railMetrics = null;
      return;
    }

    const railRect = state.rail.getBoundingClientRect();
    const railHeight = railRect.height;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const mainRect = state.main.getBoundingClientRect();

    const articleTop = mainRect.top + scrollY;
    const articleHeight = state.main.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollStart = articleTop;
    const scrollEnd = articleTop + articleHeight - viewportHeight;
    const scrollRange = Math.max(1, scrollEnd - scrollStart);

    const snakeHeight = Math.min(
      railHeight,
      Math.max(20, (viewportHeight / Math.max(1, articleHeight)) * railHeight)
    );

    const maxTop = Math.max(0, railHeight - snakeHeight);

    state.railMetrics = {
      railHeight,
      articleTop,
      articleHeight,
      viewportHeight,
      scrollStart,
      scrollEnd,
      scrollRange,
      snakeHeight,
      maxTop
    };
  }

  function computeSnakeTop() {
    if (!state?.railMetrics) return 0;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const { scrollStart, scrollRange, maxTop } = state.railMetrics;
    const progress = Math.max(0, Math.min(1, (scrollY - scrollStart) / scrollRange));
    return progress * maxTop;
  }

  function measureCachedMetrics() {
    if (!state?.rail || !state.tocItemEls.length) {
      if (state) state.cachedMetrics = [];
      return;
    }

    const railTop = state.rail.getBoundingClientRect().top;
    state.cachedMetrics = state.tocItemEls.map((element) => {
      const rect = element.getBoundingClientRect();
      const top = rect.top - railTop;
      const height = rect.height;

      return {
        element,
        top,
        bottom: top + height,
        height
      };
    });
  }

  function renderGapCovers() {
    if (!state?.gapLayer || !state.rail) return;

    state.gapLayer.innerHTML = "";
    if (!state.cachedMetrics.length) return;

    const railHeight = state.rail.getBoundingClientRect().height;
    const covers = [];

    state.cachedMetrics.forEach((metric) => {
      if (metric.element.classList.contains("toc-title-item")) {
        covers.push({ top: metric.top, height: metric.height, type: "title-item" });
      }
    });

    const first = state.cachedMetrics[0];
    if (first.top > 0) {
      covers.push({ top: 0, height: first.top });
    }

    for (let i = 0; i < state.cachedMetrics.length - 1; i += 1) {
      const current = state.cachedMetrics[i];
      const next = state.cachedMetrics[i + 1];
      const gapHeight = next.top - current.bottom;

      if (gapHeight > 0) {
        covers.push({ top: current.bottom, height: gapHeight });
      }
    }

    const last = state.cachedMetrics[state.cachedMetrics.length - 1];
    if (last.bottom < railHeight) {
      covers.push({ top: last.bottom, height: railHeight - last.bottom });
    }

    covers.forEach((cover) => {
      const element = document.createElement("div");
      element.className = "toc-gap-cover";
      if (cover.type === "title-item") {
        element.classList.add("toc-gap-cover--title-item");
      }
      element.style.top = `${cover.top}px`;
      element.style.height = `${cover.height}px`;
      state.gapLayer.appendChild(element);
    });
  }

  function measureHeadingMetrics() {
    if (!state?.article || !state?.toc) {
      if (state) {
        state.headingMetrics = [];
        state.linkById = new Map();
      }
      return;
    }

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    state.linkById = new Map(
      Array.from(state.toc.querySelectorAll('a[href^="#"]'))
        .map((link) => [decodeURIComponent(link.hash.slice(1)), link])
    );
    const visibleHeadingIds = new Set(state.linkById.keys());

    state.headingMetrics = Array.from(state.article.querySelectorAll(SEL.headings))
      .filter((heading) => heading.id && visibleHeadingIds.has(heading.id))
      .map((heading) => ({
        id: heading.id,
        top: heading.getBoundingClientRect().top + scrollY
      }));

    state.toc.querySelectorAll("a.toc-active").forEach((link) => link.classList.remove("toc-active"));
  }

  function measureTitleMetrics() {
    if (!state?.title) {
      if (state) state.titleMetrics = null;
      return;
    }

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const rect = state.title.getBoundingClientRect();

    state.titleMetrics = {
      top: rect.top + scrollY,
      bottom: rect.bottom + scrollY
    };
  }

  function updateRailGeometry() {
    if (!state?.snake || !state?.railMetrics) return;

    const nextHeight = `${state.railMetrics.snakeHeight}px`;
    if (state.snake.style.height !== nextHeight) {
      state.snake.style.height = nextHeight;
    }
  }

  function updateRailProgress() {
    if (!state?.snake || !state?.railMetrics) return;

    const snakeTop = computeSnakeTop();
    if (state.snakeTop !== null && Math.abs(state.snakeTop - snakeTop) < 0.1) return;

    state.snakeTop = snakeTop;
    state.snake.style.transform = `translate3d(0, ${snakeTop}px, 0)`;
  }

  function updateActiveLink() {
    if (!state?.toc || !state.headingMetrics.length) return;

    const probeY = window.scrollY + 140;
    let activeId = null;

    for (const heading of state.headingMetrics) {
      if (heading.top <= probeY) activeId = heading.id;
      else break;
    }

    if (state.activeHeadingId === activeId) return;

    if (state.activeHeadingId) {
      state.linkById.get(state.activeHeadingId)?.classList.remove("toc-active");
    }

    state.activeHeadingId = activeId;
    if (!activeId) return;

    state.linkById.get(activeId)?.classList.add("toc-active");
  }

  function observePendingImages() {
    if (!state?.main) return;

    state.main.querySelectorAll("img").forEach((img) => {
      if (img.complete || img.dataset.tocSnakeObserved === "true") return;

      img.dataset.tocSnakeObserved = "true";
      img.addEventListener("load", refreshState, { once: true });
    });
  }

  function bindObservers() {
    if (!state) return;

    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    if (typeof ResizeObserver === "undefined") return;

    resizeObserver = new ResizeObserver(() => {
      refreshState();
    });

    resizeObserver.observe(state.main);
    resizeObserver.observe(state.rail);
  }

  function bindGlobalListeners() {
    if (listenersBound) return;
    listenersBound = true;

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", refreshState);
  }

  function refreshState() {
    state = collectState();
    if (!state) return;

    measureCachedMetrics();
    renderGapCovers();
    measureTitleMetrics();
    measureHeadingMetrics();
    measureRailMetrics();
    updateRailGeometry();
    observePendingImages();
    bindObservers();
    scheduleUpdate();
  }

  function bootstrap() {
    bindGlobalListeners();
    refreshState();

    if (document.fonts?.ready) {
      document.fonts.ready.then(refreshState).catch(() => {});
    }

    window.addEventListener("load", refreshState, { once: true });
  }

  document.addEventListener("toc:built", refreshState);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
