// assets/js/toc.js

console.log("[TOC] script loaded");

document.addEventListener("DOMContentLoaded", function () {
  console.log("[TOC] DOMContentLoaded");

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

  // Prefer the article.post-body; fall back to the main container
  const article = main.querySelector(".post-body") || main;
  console.log("[TOC] article node:", article);

  const headings = article.querySelectorAll("h2, h3, h4");
  console.log("[TOC] headings found:", headings.length, headings);

  if (!headings.length) {
    console.log("[TOC] no h2/h3/h4 found under article/post-body");
    return;
  }

  const list = document.createElement("ul");
  list.className = "toc-list";

  headings.forEach(function (h) {
    const level = parseInt(h.tagName.substring(1), 10); // 2, 3, 4
    let text = h.textContent.trim();
    console.log(`[TOC] processing <${h.tagName.toLowerCase()}> "${text}"`);

    // Generate an id if missing
    if (!h.id) {
      let base = text.toLowerCase().replace(/[^\w]+/g, "-");
      base = base.replace(/^-+|-+$/g, ""); // trim dashes

      if (!base) base = "section";

      let id = base;
      let i = 1;
      while (document.getElementById(id)) {
        id = `${base}-${i++}`;
      }
      h.id = id;
      console.log(`[TOC] assigned id="${id}"`);
    } else {
      console.log(`[TOC] existing id="${h.id}"`);
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
});
