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
      cachedMetrics: []
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
    const body = document.body;
    const firstTitle = state?.title || document.querySelector(SEL.title);

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

  function computeSnakeTarget() {
    if (!state?.rail || !state.main) return null;

    const railRect = state.rail.getBoundingClientRect();
    const railHeight = railRect.height;
    const articleHeight = state.main.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const mainRect = state.main.getBoundingClientRect();
    const articleTop = mainRect.top + scrollY;
    const scrollStart = articleTop;
    const scrollEnd = articleTop + articleHeight - viewportHeight;
    const scrollRange = Math.max(1, scrollEnd - scrollStart);

    const snakeHeight = Math.min(
      railHeight,
      Math.max(20, (viewportHeight / Math.max(1, articleHeight)) * railHeight)
    );

    const maxTop = Math.max(0, railHeight - snakeHeight);
    const progress = Math.max(0, Math.min(1, (scrollY - scrollStart) / scrollRange));

    return {
      snakeTop: progress * maxTop,
      snakeHeight
    };
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
        covers.push({ top: metric.top, height: metric.height });
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
      element.style.top = `${cover.top}px`;
      element.style.height = `${cover.height}px`;
      state.gapLayer.appendChild(element);
    });
  }

  function applySingleSnake(target) {
    if (!state?.snake || !target) return;
    state.snake.style.transform = `translateY(${target.snakeTop}px)`;
    state.snake.style.height = `${target.snakeHeight}px`;
  }

  function updateRailProgress() {
    if (!state?.snake) return;
    applySingleSnake(computeSnakeTarget());
  }

  function updateActiveLink() {
    if (!state?.toc || !state.article) return;

    const headings = Array.from(state.article.querySelectorAll(SEL.headings)).filter((heading) => heading.id);
    if (!headings.length) return;

    const probeY = window.scrollY + 140;
    let active = null;

    for (const heading of headings) {
      const top = heading.getBoundingClientRect().top + window.scrollY;
      if (top <= probeY) active = heading;
      else break;
    }

    state.toc.querySelectorAll("a.toc-active").forEach((link) => link.classList.remove("toc-active"));
    if (!active) return;

    const link = state.toc.querySelector(`a[href="#${CSS.escape(active.id)}"]`);
    if (link) link.classList.add("toc-active");
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
