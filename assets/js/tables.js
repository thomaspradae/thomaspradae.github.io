const PURE_MATH_HEADER_RE = /^\s*(?:\\+\((?:.|\n)+\\+\)|\\+\[(?:.|\n)+\\+\])\s*$/;

function ensureTableWrapper(table) {
  const existingWrapper = table.closest(".table-wrapper");
  if (existingWrapper) return existingWrapper;

  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper";
  table.parentNode.insertBefore(wrapper, table);
  wrapper.appendChild(table);
  return wrapper;
}

function longestTokenLength(table) {
  let longest = 0;

  table.querySelectorAll("th, td").forEach((cell) => {
    const tokens = (cell.textContent || "").match(/[^\s]+/g) || [];
    tokens.forEach((token) => {
      longest = Math.max(longest, token.length);
    });
  });

  return longest;
}

function isMathOnlyHeader(th) {
  const rawSource = th.dataset.tableHeaderSource || th.textContent || "";
  if (!th.dataset.tableHeaderSource) {
    th.dataset.tableHeaderSource = rawSource.trim();
  }

  if (th.querySelector(".table-header-mathjax")) return true;
  if (PURE_MATH_HEADER_RE.test(th.dataset.tableHeaderSource)) return true;

  const mathNode = th.querySelector("mjx-container");
  if (!mathNode) return false;

  const clone = th.cloneNode(true);
  clone.querySelectorAll("mjx-container, .mjx-assistive-mml").forEach((node) => {
    node.remove();
  });

  return clone.textContent.replace(/\s+/g, "") === "";
}

function markMathHeaders(table) {
  table.querySelectorAll("thead th").forEach((th) => {
    th.classList.toggle("table-header-mathjax", isMathOnlyHeader(th));
  });
}

function shouldUseScrollableLayout(table, wrapper) {
  const firstRow = table.tHead?.rows?.[0] || table.rows[0];
  const columnCount = firstRow?.cells?.length || 0;
  const availableWidth = wrapper.clientWidth || table.parentElement?.clientWidth || 0;
  const widthPerColumn = columnCount > 0 ? availableWidth / columnCount : availableWidth;
  const hasRealOverflow = table.scrollWidth > wrapper.clientWidth + 1;
  const longestToken = longestTokenLength(table);
  const isColumnHeavy =
    columnCount >= 5 ||
    (columnCount >= 4 && widthPerColumn < 170) ||
    (columnCount >= 3 && widthPerColumn < 118 && longestToken >= 22);

  return hasRealOverflow || isColumnHeavy;
}

function updateTablePresentation(table) {
  const wrapper = ensureTableWrapper(table);

  wrapper.classList.remove("table-wrapper--scrollable");
  table.classList.remove("table--scrollable");

  markMathHeaders(table);

  const shouldScroll = shouldUseScrollableLayout(table, wrapper);
  wrapper.classList.toggle("table-wrapper--scrollable", shouldScroll);
  table.classList.toggle("table--scrollable", shouldScroll);
}

document.addEventListener("DOMContentLoaded", () => {
  const tables = Array.from(document.querySelectorAll(".page-content table"));
  if (!tables.length) return;

  const refreshTables = () => {
    tables.forEach((table) => {
      updateTablePresentation(table);
    });
  };

  let rafId = 0;
  const scheduleRefresh = () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      refreshTables();
    });
  };

  refreshTables();
  window.addEventListener("load", scheduleRefresh, { once: true });
  window.addEventListener("resize", scheduleRefresh, { passive: true });

  if (window.MathJax?.startup?.promise) {
    window.MathJax.startup.promise.then(scheduleRefresh).catch(() => {});
  }
});
