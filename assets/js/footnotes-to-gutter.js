// assets/js/footnotes-to-gutter.js
(() => {
  const SEL = {
    stage: ".post-stage",
    main: "#main.post",
    gutter: ".post-stage > .right-gutter > .right-gutter-inner",
    footnotes: "#main .footnotes",
    refs: 'sup[role="doc-noteref"] a.footnote[href^="#"]',
  };
  const MOBILE_MEDIA = "(max-width: 1024px)";

  let raf = null;
  let currentMode = null;
  let footnoteMap = new Map();

  const isMobile = () => window.matchMedia(MOBILE_MEDIA).matches;

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
    return clone;
  }

  function getFootnoteNumber(id) {
    const match = id.match(/^fn:(.+)$/);
    return match ? match[1] : "";
  }

  function buildInlineHtml(clone) {
    const parts = [];

    clone.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) parts.push(text);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node;

      if (el.matches("ul, ol")) {
        [...el.children].forEach(item => {
          const html = item.innerHTML.trim();
          if (html) parts.push(`&bull; ${html}`);
        });
        return;
      }

      const html = el.innerHTML.trim();
      if (html) parts.push(html);
    });

    return parts
      .filter(Boolean)
      .map(html => `<span class="inline-footnote-paragraph">${html}</span>`)
      .join("");
  }

  function buildFootnoteMap(footnotes) {
    const map = new Map();

    footnotes.querySelectorAll("ol > li[id]").forEach(li => {
      const clone = stripBackrefs(li);

      map.set(li.id, {
        id: li.id,
        number: getFootnoteNumber(li.id),
        html: clone.innerHTML.trim(),
        inlineHtml: buildInlineHtml(clone),
      });
    });

    return map;
  }

  function clearGutterNotes(gutter) {
    gutter?.querySelectorAll(".gutter-note").forEach(note => note.remove());
  }

  function clearInlineNotes(main) {
    if (!main) return;

    main.querySelectorAll(".inline-footnote").forEach(note => note.remove());
    main.querySelectorAll(SEL.refs).forEach(ref => {
      ref.classList.remove("is-inline-footnote-open");
      ref.setAttribute("aria-expanded", "false");
    });
  }

  function bindInlineRefs(main) {
    main.querySelectorAll(SEL.refs).forEach(ref => {
      if (ref.dataset.inlineFootnoteBound === "true") return;

      ref.dataset.inlineFootnoteBound = "true";
      ref.setAttribute("aria-expanded", "false");
      ref.addEventListener("click", onInlineRefClick);
    });
  }

  function createInlineNote(data) {
    const note = document.createElement("span");
    note.className = "inline-footnote";
    note.dataset.footnoteId = data.id;

    note.innerHTML = `
      <span class="inline-footnote-inner">
        <span class="inline-footnote-number">${data.number}</span>
        <span class="inline-footnote-body">${data.inlineHtml || data.html}</span>
      </span>
    `;

    return note;
  }

  function getInlineInsertionTarget(ref) {
    return ref.closest('sup[role="doc-noteref"]') || ref;
  }

  function getInlineInsertionReference(target) {
    let next = target.nextSibling;

    while (next instanceof Text) {
      const text = next.textContent || "";
      const match = text.match(/^([)\]}'"”’.,;:!?]+)/);
      if (!match) return next;

      const punctuation = match[1];
      const remainder = text.slice(punctuation.length);

      // If this node is already punctuation-only, keep it in place and keep
      // looking for the first real content node after it.
      if (!remainder) {
        next = next.nextSibling;
        continue;
      }

      const parent = target.parentNode;
      if (!parent) return next;

      parent.insertBefore(document.createTextNode(punctuation), next);
      next.textContent = remainder;
      return next;
    }

    return next;
  }

  function getOpenInlineNote(target, id) {
    const next = target.nextElementSibling;
    if (!next?.classList.contains("inline-footnote")) return null;
    if (next.dataset.footnoteId !== id) return null;
    return next;
  }

  function onInlineRefClick(event) {
    if (!isMobile()) return;

    const ref = event.currentTarget;
    if (!(ref instanceof HTMLAnchorElement)) return;

    const id = decodeURIComponent(ref.getAttribute("href").slice(1));
    const data = footnoteMap.get(id);
    if (!data) return;

    event.preventDefault();

    const target = getInlineInsertionTarget(ref);
    const openNote = getOpenInlineNote(target, id);
    if (openNote) {
      openNote.remove();
      ref.classList.remove("is-inline-footnote-open");
      ref.setAttribute("aria-expanded", "false");
      return;
    }

    const note = createInlineNote(data);
    const parent = target.parentNode;
    if (parent) {
      const reference = getInlineInsertionReference(target);
      parent.insertBefore(note, reference);
    } else {
      target.insertAdjacentElement("afterend", note);
    }

    ref.classList.add("is-inline-footnote-open");
    ref.setAttribute("aria-expanded", "true");

    requestAnimationFrame(() => {
      note.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function renderDesktop({ stage, main, gutter, footnotes }) {
    if (!stage || !main || !gutter || !footnotes) return;

    clearInlineNotes(main);
    clearGutterNotes(gutter);

    gutter.style.position = "relative";

    const stageTop = stage.getBoundingClientRect().top + window.scrollY;

    let cursor = 0;
    const minGap = 12;

    main.querySelectorAll(SEL.refs).forEach(ref => {
      const id = decodeURIComponent(ref.getAttribute("href").slice(1));
      const data = footnoteMap.get(id);
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

  function renderMobile({ gutter, footnotes }) {
    clearGutterNotes(gutter);

    if (footnotes) {
      footnotes.style.display = "none";
    }
  }

  function layout() {
    const stage = document.querySelector(SEL.stage);
    const main = document.querySelector(SEL.main);
    const gutter = document.querySelector(SEL.gutter);
    const footnotes = document.querySelector(SEL.footnotes);

    if (!main || !footnotes) return;

    footnoteMap = buildFootnoteMap(footnotes);
    bindInlineRefs(main);

    const nextMode = isMobile() ? "mobile" : "desktop";

    if (currentMode !== nextMode) {
      if (nextMode === "mobile") {
        clearGutterNotes(gutter);
      } else {
        clearInlineNotes(main);
      }
      currentMode = nextMode;
    }

    if (nextMode === "mobile") {
      renderMobile({ gutter, footnotes });
      return;
    }

    renderDesktop({ stage, main, gutter, footnotes });
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
    document.addEventListener("click", event => {
      if (!isMobile()) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".inline-footnote")) return;
      if (event.target.closest(SEL.refs)) return;

      clearInlineNotes(main);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
