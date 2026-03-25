// assets/js/toc.js — experiment-style TOC builder
console.log("[TOC] script loaded (experiment)");

const MOBILE_POST_MENU_QUERY = "(max-width: 1024px)";

function slugifyTOC(s) {
  return s.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function tocWordCount(text) {
  const m = text.trim().match(/\b[\p{L}\p{N}_']+\b/gu);
  return m ? m.length : 0;
}

function buildSectionModel(article) {
  const sections = [];

  const pageTitleEl = document.querySelector("#main .post-top .page-title");
  if (pageTitleEl) {
    if (!pageTitleEl.id) pageTitleEl.id = "page-title";
    sections.push({
      id: pageTitleEl.id,
      title: pageTitleEl.textContent.trim(),
      level: 1,
      wc: 1
    });
  }

  const all = Array.from(article.children);
  const headings = all.filter(el => /^H[2-6]$/.test(el.tagName));

  if (!headings.length) return sections;

  headings.forEach((heading, idx) => {
    const level = parseInt(heading.tagName.substring(1), 10);
    const title = heading.textContent.trim();

    if (!heading.id) {
      let base = slugifyTOC(title) || "section";
      let id = base;
      let i = 1;
      while (document.getElementById(id)) id = `${base}-${i++}`;
      heading.id = id;
    }

    const startIndex = all.indexOf(heading);
    const nextHeading = headings[idx + 1];
    const endIndex = nextHeading ? all.indexOf(nextHeading) : all.length;

    let textForCount = title + " ";
    for (let i = startIndex + 1; i < endIndex; i++) {
      textForCount += (all[i].textContent || "") + " ";
    }

    sections.push({
      id: heading.id,
      title,
      level,
      wc: tocWordCount(textForCount)
    });
  });

  return sections;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function createDesktopTOCList(sections) {
  const list = document.createElement("ul");
  list.className = "toc-list";

  sections.forEach((s, idx) => {
    const li = document.createElement("li");
    li.className = `toc-item toc-level-${s.level}`;
    li.dataset.target = s.id;

    const isTitleItem = idx === 0;
    if (isTitleItem) {
      li.classList.add("toc-title-item");
    } else {
      li.style.flexGrow = String(Math.max(1, s.wc));
      li.style.flexBasis = "0px";
    }

    const a = document.createElement("a");
    a.href = `#${s.id}`;
    a.textContent = s.title || `Section ${idx + 1}`;

    a.addEventListener("click", event => {
      event.preventDefault();
      scrollToSection(s.id);
    });

    li.appendChild(a);
    li.addEventListener("click", event => {
      if (event.target.closest("a")) return;
      scrollToSection(s.id);
    });

    list.appendChild(li);
  });

  return list;
}

function createMobileTOCList(sections, closeMenu) {
  const list = document.createElement("ul");
  list.className = "mobile-post-menu-list";

  sections.forEach((s, idx) => {
    const li = document.createElement("li");
    li.className = `mobile-post-menu-item mobile-post-menu-level-${s.level}`;

    if (idx === 0) {
      li.classList.add("mobile-post-menu-item--title");
    }

    const a = document.createElement("a");
    a.className = "mobile-post-menu-link";
    a.href = `#${s.id}`;
    a.textContent = s.title || `Section ${idx + 1}`;

    a.addEventListener("click", event => {
      event.preventDefault();
      closeMenu?.();
      window.setTimeout(() => scrollToSection(s.id), 60);
    });

    li.appendChild(a);
    list.appendChild(li);
  });

  return list;
}

function initMobilePostMenu(sections) {
  const shell = document.querySelector(".mobile-post-menu-shell");
  const toggle = shell?.querySelector(".mobile-post-menu-toggle");
  const panel = shell?.querySelector(".mobile-post-menu-panel");
  const backdrop = shell?.querySelector(".mobile-post-menu-backdrop");
  const tocContainer = shell?.querySelector(".mobile-post-menu-toc");
  if (!shell || !toggle || !panel || !backdrop || !tocContainer) return;

  const isMobileViewport = () => window.matchMedia(MOBILE_POST_MENU_QUERY).matches;

  const closeMenu = () => {
    document.body.classList.remove("mobile-post-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    backdrop.hidden = true;
  };

  const openMenu = () => {
    if (!isMobileViewport()) return;

    document.body.classList.add("mobile-post-menu-open");
    toggle.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    backdrop.hidden = false;
  };

  const syncScrolledState = () => {
    const isSticky = isMobileViewport() && window.scrollY > 0;
    shell.classList.toggle("is-sticky", isSticky);

    if (!isMobileViewport()) {
      closeMenu();
    }
  };

  tocContainer.innerHTML = "";
  tocContainer.appendChild(createMobileTOCList(sections, closeMenu));

  if (toggle.dataset.mobilePostMenuBound !== "true") {
    toggle.dataset.mobilePostMenuBound = "true";

    toggle.addEventListener("click", () => {
      if (panel.hidden) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    backdrop.addEventListener("click", closeMenu);

    panel.querySelector(".mobile-post-menu-nav")?.addEventListener("click", () => {
      closeMenu();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("scroll", syncScrolledState, { passive: true });
    window.addEventListener("resize", syncScrolledState);
  }

  shell.setAttribute("aria-hidden", "false");
  syncScrolledState();
}

function buildTOC() {
  const main = document.querySelector("#main.post");
  if (!main) return;

  const tocContainer = document.querySelector("#left-toc .toc-inner");

  const article = document.querySelector("#main .post-body-content");
  if (!article) return;
  const sections = buildSectionModel(article);
  if (!sections.length) return;

  if (tocContainer) {
    tocContainer.innerHTML = "";
    tocContainer.appendChild(createDesktopTOCList(sections));
    document.dispatchEvent(new CustomEvent("toc:built", { detail: { tocContainer } }));
  }

  initMobilePostMenu(sections);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildTOC);
} else {
  buildTOC();
}
