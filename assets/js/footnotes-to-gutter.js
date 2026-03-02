// assets/js/footnotes-to-gutter.js
(() => {
  const SEL = {
    stage: ".post-stage",
    main: "#main.post",
    gutter: ".post-stage > .right-gutter",
    footnotes: "#main .footnotes",
    refs: 'sup[role="doc-noteref"] a.footnote[href^="#"]',
  };

  let raf = null;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      layout();
    });
  };

  function stripBackrefs(li) {
    const clone = li.cloneNode(true);
    clone.querySelectorAll('a.reversefootnote, a[href^="#fnref"]').forEach(a => a.remove());
    return clone.innerHTML.trim();
  }

  function layout() {
    const stage = document.querySelector(SEL.stage);
    const main = document.querySelector(SEL.main);
    const gutter = document.querySelector(SEL.gutter);
    const footnotes = document.querySelector(SEL.footnotes);

    if (!stage || !main || !gutter || !footnotes) return;

    // IMPORTANT: gutter must be a positioning context, but NOT sticky/fixed
    gutter.style.position = "relative";

    // Map: fnId ("fn:1") -> HTML content
    const map = new Map();
    footnotes.querySelectorAll("ol > li[id]").forEach(li => {
      map.set(li.id, stripBackrefs(li));
    });

    // Clear previously rendered gutter notes
    gutter.querySelectorAll(".gutter-note").forEach(n => n.remove());

    const stageTop = stage.getBoundingClientRect().top + window.scrollY;

    // Simple overlap-avoidance: push notes downward if they collide
    let cursor = 0;
    const minGap = 12; // px

    main.querySelectorAll(SEL.refs).forEach(ref => {
      const id = decodeURIComponent(ref.getAttribute("href").slice(1)); // "fn:1"
      const html = map.get(id);
      if (!html) return;

      const note = document.createElement("div");
      note.className = "gutter-note";
      note.style.position = "absolute";
      note.innerHTML = html;

      const refTop = ref.getBoundingClientRect().top + window.scrollY;
      let top = refTop - stageTop;

      // prevent overlap
      top = Math.max(top, cursor);
      note.style.top = `${top}px`;

      gutter.appendChild(note);

      cursor = top + note.offsetHeight + minGap;
    });

    // Hide the original bottom footnotes block
    footnotes.style.display = "none";
  }

  function init() {
    schedule();

    const main = document.querySelector(SEL.main);
    if (!main) return;

    // Re-layout whenever content height changes (images, fonts, MathJax, etc.)
    const ro = new ResizeObserver(schedule);
    ro.observe(main);

    // Also re-layout on image load
    main.querySelectorAll("img").forEach(img => {
      if (!img.complete) img.addEventListener("load", schedule, { once: true });
    });

    window.addEventListener("resize", schedule);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();