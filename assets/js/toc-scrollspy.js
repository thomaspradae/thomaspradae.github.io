// /assets/js/toc-scrollspy.js
(() => {
    "use strict";
  
    const SELECTORS = {
      toc: ".post-stage > .left-toc",
      contentRoot: ".post-stage > #main.post",
      headings: "h2, h3, h4, h5, h6",
      tocLinks: 'a[href^="#"]',
      // “Section” definition: your TOC builder marks heading levels with toc-level-N.
      sectionLinks: ".toc-level-2 > a[href^='#']",
    };
  
    const activationLinePx = () => Math.max(120, Math.floor(window.innerHeight * 0.22));
  
    function init() {
      const toc = document.querySelector(SELECTORS.toc);
      const root = document.querySelector(SELECTORS.contentRoot);
      if (!toc || !root) return false;
  
      const links = Array.from(toc.querySelectorAll(SELECTORS.tocLinks));
      if (!links.length) return false; // TOC not built yet
  
      // Map heading id -> toc link
      const linkById = new Map();
      for (const a of links) {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#")) continue;
        const id = decodeURIComponent(href.slice(1));
        if (id) linkById.set(id, a);
      }
  
      const headings = Array.from(root.querySelectorAll(SELECTORS.headings))
        .filter(h => h.id && linkById.has(h.id));
  
      if (!headings.length) return false;
  
      // Ensure rail indicator exists (JS-driven moving dot)
      let indicator = toc.querySelector(".toc-rail-indicator");
      if (!indicator) {
        indicator = document.createElement("span");
        indicator.className = "toc-rail-indicator";
        indicator.setAttribute("aria-hidden", "true");
        toc.appendChild(indicator);
      }
  
      // Build section ticks for H2 (toc-level-2)
      function rebuildTicks() {
        // Remove old ticks
        toc.querySelectorAll(".toc-rail-tick").forEach(n => n.remove());
  
        const tocRect = toc.getBoundingClientRect();
        const sectionAnchors = Array.from(toc.querySelectorAll(SELECTORS.sectionLinks));
  
        for (const a of sectionAnchors) {
          const r = a.getBoundingClientRect();
          const y = (r.top - tocRect.top) + (r.height * 0.55);
  
          const tick = document.createElement("span");
          tick.className = "toc-rail-tick";
          tick.setAttribute("aria-hidden", "true");
          tick.style.top = `${Math.max(0, y)}px`;
          toc.appendChild(tick);
        }
      }
  
      let activeId = null;
      let ticking = false;
  
      function linkCenterY(a, tocRect) {
        const r = a.getBoundingClientRect();
        return (r.top - tocRect.top) + (r.height * 0.55);
      }
  
      function setActive(id) {
        if (!id || id === activeId) return;
        activeId = id;
  
        for (const [hid, a] of linkById.entries()) {
          const isActive = hid === id;
          a.classList.toggle("toc-active", isActive);
          if (isActive) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        }
      }
  
      function compute() {
        ticking = false;
  
        const line = activationLinePx();
        const tocRect = toc.getBoundingClientRect();
  
        // Find the “prev” heading (above the activation line) and “next” (below).
        let prev = headings[0];
        let next = null;
  
        for (const h of headings) {
          const top = h.getBoundingClientRect().top;
          if (top <= line) {
            prev = h;
          } else {
            next = h;
            break;
          }
        }
  
        // Active is the previous heading (snap state)
        setActive(prev.id);
  
        // Compute y positions for rail fill + moving indicator
        const prevLink = linkById.get(prev.id);
        const yPrev = prevLink ? linkCenterY(prevLink, tocRect) : 0;
  
        let yProgress = yPrev;
  
        if (next) {
          const nextLink = linkById.get(next.id);
          const yNext = nextLink ? linkCenterY(nextLink, tocRect) : yPrev;
  
          const prevTop = prev.getBoundingClientRect().top;
          const nextTop = next.getBoundingClientRect().top;
  
          const denom = Math.max(1, (nextTop - prevTop));
          const t = Math.min(1, Math.max(0, (line - prevTop) / denom));
  
          yProgress = yPrev + t * (yNext - yPrev);
        }
  
        // If at bottom of page, lock to last heading (both active & progress)
        const scrollBottom = window.scrollY + window.innerHeight;
        const docBottom = document.documentElement.scrollHeight;
        if (docBottom - scrollBottom < 4) {
          const last = headings[headings.length - 1];
          const lastLink = linkById.get(last.id);
          const yLast = lastLink ? linkCenterY(lastLink, tocRect) : yProgress;
          yProgress = yLast;
          setActive(last.id);
        }
  
        // Write CSS vars (scoped to TOC only)
        toc.style.setProperty("--toc-active-y", `${Math.max(0, yPrev)}px`);
        toc.style.setProperty("--toc-progress-y", `${Math.max(0, yProgress)}px`);
  
        // Move follower dot
        indicator.style.top = `${Math.max(0, yProgress)}px`;
      }
  
      function requestTick() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(compute);
      }
  
      // Initial layout-dependent build
      window.requestAnimationFrame(() => {
        rebuildTicks();
        compute();
      });
  
      window.addEventListener("scroll", requestTick, { passive: true });
      window.addEventListener("resize", () => {
        rebuildTicks();
        requestTick();
      }, { passive: true });
  
      window.addEventListener("hashchange", requestTick);
  
      return true;
    }
  
    function boot() {
      if (init()) return;
  
      // Wait for TOC builder to populate
      const toc = document.querySelector(".post-stage > .left-toc");
      if (!toc) return;
  
      const mo = new MutationObserver(() => {
        if (init()) mo.disconnect();
      });
  
      mo.observe(toc, { childList: true, subtree: true });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  })();
  