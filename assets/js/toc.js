// assets/js/toc.js
console.log("[TOC] script loaded");

function buildTOC() {
  console.log("[TOC] buildTOC()");

  const main = document.querySelector("#main.post");
  if (!main) {
    console.log("[TOC] #main.post NOT found, aborting");
    return;
  }

  const tocContainer = document.getElementById("left-toc");
  if (!tocContainer) {
    console.log("[TOC] #left-toc NOT found, aborting");
    return;
  }

  // prevent duplicates if something runs twice
  if (tocContainer.dataset.built === "1") {
    console.log("[TOC] already built, skipping");
    return;
  }
  tocContainer.dataset.built = "1";

  const article = main.querySelector(".post-body") || main;
  const headings = article.querySelectorAll("h2, h3, h4, h5, h6");
  console.log("[TOC] headings found:", headings.length);

  if (!headings.length) return;

  const list = document.createElement("ul");
  list.className = "toc-list";

  headings.forEach((h) => {
    const level = parseInt(h.tagName.substring(1), 10);
    const text = h.textContent.trim();

    if (!h.id) {
      let base = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
      if (!base) base = "section";
      let id = base;
      let i = 1;
      while (document.getElementById(id)) id = `${base}-${i++}`;
      h.id = id;
    }

    const li = document.createElement("li");
    li.classList.add("toc-item", `toc-level-${level}`);

    const a = document.createElement("a");
    a.href = `#${h.id}`;
    a.textContent = text;

    li.appendChild(a);
    list.appendChild(li);
  });

  tocContainer.appendChild(list);
  console.log("[TOC] TOC built and appended");

  // Let other scripts know TOC now exists
  document.dispatchEvent(new CustomEvent("toc:built", { detail: { tocContainer } }));
}

// Run ASAP: if deferred, DOM is already parsed; if not, wait.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildTOC);
} else {
  buildTOC();
}