// assets/js/footnotes-to-gutter.js
console.log("[FOOTNOTES] script loaded");

function moveFootnotes() {
  console.log("[FOOTNOTES] moveFootnotes() running");
  const gutter = document.querySelector(".post-stage > .right-gutter");
  const footnotes = document.querySelector("#main .footnotes");

  console.log("[FOOTNOTES] gutter:", gutter);
  console.log("[FOOTNOTES] footnotes:", footnotes);

  if (!gutter) {
    console.warn("[FOOTNOTES] NO gutter found: .post-stage > .right-gutter");
    return;
  }
  if (!footnotes) {
    console.warn("[FOOTNOTES] NO footnotes found: #main .footnotes");
    return;
  }

  console.log("[FOOTNOTES] gutter display:", getComputedStyle(gutter).display);

  if (footnotes.dataset.moved === "1") {
    console.log("[FOOTNOTES] already moved, skipping");
    return;
  }

  console.log("[FOOTNOTES] before move, parent:", footnotes.parentElement);
  footnotes.dataset.moved = "1";
  gutter.appendChild(footnotes);
  console.log("[FOOTNOTES] after move, parent:", footnotes.parentElement);
}

// Run ASAP (works with defer)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", moveFootnotes);
} else {
  moveFootnotes();
}

// Also run on full load (catches “another script replaced footnotes later”)
window.addEventListener("load", moveFootnotes);