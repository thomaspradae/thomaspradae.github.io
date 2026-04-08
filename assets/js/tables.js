const PURE_MATH_HEADER_RE = /^\s*(?:\\+\((?:.|\n)+\\+\)|\\+\[(?:.|\n)+\\+\])\s*$/;

const stickyCleanups = new Map();

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

/* ── JS-based sticky header for scrollable tables ───────────────────
   CSS position:sticky can't work inside overflow-x:auto (it creates
   a scroll container that captures sticky). Instead we listen to
   page scroll and translateY the <thead> to keep it pinned. ──────── */

function setupStickyHeader(wrapper, table) {
  const thead = table.querySelector("thead");
  if (!thead) return null;

  const onScroll = () => {
    const wr = wrapper.getBoundingClientRect();
    const theadH = thead.offsetHeight;
    const maxY = table.offsetHeight - theadH;

    if (wr.top < 0 && maxY > 0) {
      const y = Math.min(-wr.top, maxY);
      thead.style.transform = `translateY(${y}px)`;
      if (!thead.classList.contains("thead--stuck")) {
        thead.classList.add("thead--stuck");
      }
    } else if (thead.style.transform) {
      thead.style.transform = "";
      thead.classList.remove("thead--stuck");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  return () => {
    window.removeEventListener("scroll", onScroll);
    thead.style.transform = "";
    thead.classList.remove("thead--stuck");
  };
}

function teardownStickyHeader(table) {
  const cleanup = stickyCleanups.get(table);
  if (cleanup) {
    cleanup();
    stickyCleanups.delete(table);
  }
}

function updateTablePresentation(table) {
  const wrapper = ensureTableWrapper(table);

  teardownStickyHeader(table);

  wrapper.classList.remove("table-wrapper--scrollable");
  table.classList.remove("table--scrollable");

  markMathHeaders(table);

  const shouldScroll = shouldUseScrollableLayout(table, wrapper);
  wrapper.classList.toggle("table-wrapper--scrollable", shouldScroll);
  table.classList.toggle("table--scrollable", shouldScroll);

  if (shouldScroll) {
    const cleanup = setupStickyHeader(wrapper, table);
    if (cleanup) stickyCleanups.set(table, cleanup);
  }
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
