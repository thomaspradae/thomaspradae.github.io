// assets/js/toc-autohide.js
(() => {
    "use strict";
  
    // Run after DOM is ready (safe even if you don't use `defer`)
    const boot = () => {
      const toc = document.querySelector(".post-stage > .left-toc");
      if (!toc) return;
  
      // -----------------------------
      // Config knobs
      // -----------------------------
      const HIDE_DELAY_MS = 900;     // how long after scroll stops to hide
      const STICKY_TOP_PX = 10 * 16; // only used if you want logic tied to top; not required
      // (STICKY_TOP_PX is unused right now; leaving it as a “future knob”)
  
      // Shared options object so removeEventListener can use the exact same reference
      const passiveOpts = { passive: true };
  
      let autoHideActive = false;
      let hideTimer = null;
  
      // -----------------------------
      // Helpers
      // -----------------------------
      const showTOC = () => toc.classList.remove("toc-hidden");
  
      const scheduleHide = () => {
        clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          if (!autoHideActive) return;
          toc.classList.add("toc-hidden");
        }, HIDE_DELAY_MS);
      };
  
      const teardownIntentListeners = () => {
        window.removeEventListener("wheel", onFirstIntent, passiveOpts);
        window.removeEventListener("touchmove", onFirstIntent, passiveOpts);
        window.removeEventListener("keydown", onFirstIntent);
        window.removeEventListener("mousedown", onMouseDownIntent);
      };
  
      const enableAutoHide = () => {
        if (autoHideActive) return;
        autoHideActive = true;
  
        // Optional global gate (useful if you want CSS tweaks later)
        document.documentElement.classList.add("toc-autohide-on");
  
        // Start visible; allow hiding after inactivity
        showTOC();
        scheduleHide();
  
        teardownIntentListeners();
      };
  
      // -----------------------------
      // “First intent” detectors
      // -----------------------------
      const onFirstIntent = (e) => {
        // For keydown, only activate on keys that normally scroll
        if (e.type === "keydown") {
          const scrollKeys = new Set([
            "ArrowDown",
            "ArrowUp",
            "PageDown",
            "PageUp",
            "Home",
            "End",
            " ",
          ]);
          if (!scrollKeys.has(e.key)) return;
        }
        enableAutoHide();
      };
  
      // Scrollbar drag is tricky: a plain click shouldn’t enable it.
      // So we only treat mousedown as “scroll intent” if it happens near the right edge
      // (where the scrollbar usually lives).
      const onMouseDownIntent = (e) => {
        const SCROLLBAR_GUTTER_PX = 28; // generous zone for scrollbar/track across OSes
        const nearRightEdge = e.clientX >= (window.innerWidth - SCROLLBAR_GUTTER_PX);
        if (!nearRightEdge) return;
        enableAutoHide();
      };
  
      // -----------------------------
      // While scrolling: show -> hide after delay
      // -----------------------------
      const onScroll = () => {
        if (!autoHideActive) return; // landing behavior: stay visible forever until intent happens
        showTOC();
        scheduleHide();
      };
  
      // Keep visible when user interacts with TOC itself
      const onTOCEnter = () => {
        if (!autoHideActive) return;
        showTOC();
        clearTimeout(hideTimer);
      };
  
      const onTOCLeave = () => {
        if (!autoHideActive) return;
        scheduleHide();
      };
  
      // Keyboard accessibility: if focus moves into the TOC, keep it visible
      const onTOCFocusIn = () => {
        if (!autoHideActive) return;
        showTOC();
        clearTimeout(hideTimer);
      };
  
      const onTOCFocusOut = () => {
        if (!autoHideActive) return;
        scheduleHide();
      };
  
      // -----------------------------
      // Attach listeners
      // -----------------------------
      window.addEventListener("wheel", onFirstIntent, passiveOpts);
      window.addEventListener("touchmove", onFirstIntent, passiveOpts);
      window.addEventListener("keydown", onFirstIntent);
      window.addEventListener("mousedown", onMouseDownIntent);
  
      window.addEventListener("scroll", onScroll, passiveOpts);
  
      toc.addEventListener("mouseenter", onTOCEnter);
      toc.addEventListener("mouseleave", onTOCLeave);
      toc.addEventListener("focusin", onTOCFocusIn);
      toc.addEventListener("focusout", onTOCFocusOut);
  
      // Initial landing state: visible, auto-hide disabled
      showTOC();
    };
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  })();
  