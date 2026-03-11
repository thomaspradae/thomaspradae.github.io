// assets/js/footnotes-to-gutter.js
(() => {
  const SEL = {
    stage: ".post-stage",
    main: "#main.post",
    gutter: ".post-stage > .right-gutter > .right-gutter-inner",
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

  function getFootnoteNumber(id) {
    const match = id.match(/^fn:(.+)$/);
    return match ? match[1] : "";
  }

  function layout() {
    const stage = document.querySelector(SEL.stage);
    const main = document.querySelector(SEL.main);
    const gutter = document.querySelector(SEL.gutter);
    const footnotes = document.querySelector(SEL.footnotes);

    if (!stage || !main || !gutter || !footnotes) return;

    gutter.style.position = "relative";

    // Map: fnId -> { number, html }
    const map = new Map();
    footnotes.querySelectorAll("ol > li[id]").forEach(li => {
      map.set(li.id, {
        number: getFootnoteNumber(li.id),
        html: stripBackrefs(li),
      });
    });

    gutter.querySelectorAll(".gutter-note").forEach(n => n.remove());

    const stageTop = stage.getBoundingClientRect().top + window.scrollY;

    let cursor = 0;
    const minGap = 12;

    main.querySelectorAll(SEL.refs).forEach(ref => {
      const id = decodeURIComponent(ref.getAttribute("href").slice(1));
      const data = map.get(id);
      if (!data) return;

      const note = document.createElement("div");
      note.className = "gutter-note";
      note.style.position = "absolute";

      note.innerHTML = `
        <div class="gutter-note-inner">
          <span class="gutter-note-number">${data.number}</span>
          <div class="gutter-note-body">${data.html}</div>
        </div>
      `;

      const refTop = ref.getBoundingClientRect().top + window.scrollY;
      let top = refTop - stageTop;

      top = Math.max(top, cursor);
      note.style.top = `${top}px`;

      gutter.appendChild(note);

      cursor = top + note.offsetHeight + minGap;
    });

    footnotes.style.display = "none";
  }

  function init() {
    schedule();

    const main = document.querySelector(SEL.main);
    if (!main) return;

    const ro = new ResizeObserver(schedule);
    ro.observe(main);

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
