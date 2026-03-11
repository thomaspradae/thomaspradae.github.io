// assets/js/toc.js — experiment-style TOC builder
console.log("[TOC] script loaded (experiment)");

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

function buildTOC() {
  const main = document.querySelector("#main.post");
  if (!main) return;

  const tocContainer = document.querySelector("#left-toc .toc-inner");
  if (!tocContainer) return;

  tocContainer.innerHTML = "";

  const article = document.querySelector("#main .post-body-content");
  if (!article) return;
  const sections = buildSectionModel(article);
  if (!sections.length) return;

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

    li.appendChild(a);

    li.addEventListener("click", () => {
      document.getElementById(s.id)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    list.appendChild(li);
  });

  tocContainer.appendChild(list);
  document.dispatchEvent(new CustomEvent("toc:built", { detail: { tocContainer } }));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildTOC);
} else {
  buildTOC();
}