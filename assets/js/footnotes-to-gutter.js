document.addEventListener("DOMContentLoaded", () => {
    const gutter = document.querySelector(".post-stage > .right-gutter");
    const footnotes = document.querySelector("#main .footnotes");
  
    if (!gutter || !footnotes) return;
  
    // prevent double-moves if something hot-reloads
    if (footnotes.dataset.moved === "1") return;
    footnotes.dataset.moved = "1";
  
    gutter.appendChild(footnotes);
  });