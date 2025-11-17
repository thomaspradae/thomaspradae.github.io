document.addEventListener("DOMContentLoaded", () => {
    // Only run on post pages with margin layout
    const mainPost = document.querySelector("#main.post");
    if (!mainPost) return;
  
    const footnotesBlock = document.querySelector(".footnotes");
    if (!footnotesBlock) return;
  
    const ol = footnotesBlock.querySelector("ol");
    if (!ol) return;
  
    const footnoteItems = ol.querySelectorAll("li[id]");
  
    footnoteItems.forEach(li => {
      const fnId = li.id; // e.g. "fn:1" or "fn1"
  
      // Find all references in the text: <a href="#fn:1"> or <a href="#fn1">
      const refs = document.querySelectorAll('a[href="#' + CSS.escape(fnId) + '"]');
      if (!refs.length) return;
  
      // Clone li so we can strip the backref link (↩) etc.
      const clone = li.cloneNode(true);
  
      // Remove backreference links (usually class="reversefootnote" or href starting with "#fnref")
      clone.querySelectorAll("a").forEach(a => {
        const href = a.getAttribute("href") || "";
        if (
          a.classList.contains("reversefootnote") ||
          href.startsWith("#fnref")
        ) {
          a.remove();
        }
      });
  
      const noteHtml = clone.innerHTML.trim();
      if (!noteHtml) return;
  
      refs.forEach(ref => {
        // Usually the ref is inside a <sup>, so we prefer to manipulate the sup
        const sup = ref.closest("sup") || ref;
  
        // Create sidenote-number (increments counter + superscript)
        const numberSpan = document.createElement("span");
        numberSpan.className = "sidenote-number";
  
        // Create sidenote content that floats to the right margin
        const noteSpan = document.createElement("span");
        noteSpan.className = "sidenote";
        noteSpan.innerHTML = noteHtml;
  
        // Insert directly after the reference point in the text
        sup.insertAdjacentElement("afterend", noteSpan);
        sup.insertAdjacentElement("afterend", numberSpan);
  
        // Remove the original footnote marker from the text
        sup.remove();
      });
    });
  
    // Hide bottom footnote block (we already re-used its content as margin notes)
    footnotesBlock.style.display = "none";
  });
  