(function () {
  var INLINE_LIMIT = 5;
  var INDEX_CACHE = {};
  var CATEGORY_LABELS = {
    writing: "Writing",
    building: "Building",
    notes: "Notes",
    marginalia: "Marginalia"
  };
  var FUSE_CONFIG = {
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    threshold: 0.3,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 0.5 },
      { name: "tags", weight: 0.3 },
      { name: "excerpt", weight: 0.15 },
      { name: "body", weight: 0.05 }
    ]
  };

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getCategoryLabel(item) {
    if (item && item.category_label) {
      return item.category_label;
    }

    if (item && item.category && CATEGORY_LABELS[item.category]) {
      return CATEGORY_LABELS[item.category];
    }

    if (!item || !item.category) {
      return "Archive";
    }

    return item.category.charAt(0).toUpperCase() + item.category.slice(1);
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    return dateString.slice(0, 7).replace("-", ".");
  }

  function isTypingField(target) {
    if (!target) {
      return false;
    }

    var tagName = (target.tagName || "").toLowerCase();
    return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
  }

  function sanitizeScope(scope) {
    if (scope === "writing" || scope === "building" || scope === "notes" || scope === "marginalia") {
      return scope;
    }

    return "";
  }

  function sanitizeSortMode(sortMode) {
    if (sortMode === "newest" || sortMode === "oldest") {
      return sortMode;
    }

    return "relevance";
  }

  function highlight(text, matches, key) {
    if (!text) {
      return "";
    }

    if (!matches || !matches.length) {
      return escapeHtml(text);
    }

    var selectedMatch = null;
    for (var i = 0; i < matches.length; i += 1) {
      if (matches[i].key === key) {
        selectedMatch = matches[i];
        break;
      }
    }

    if (!selectedMatch || !selectedMatch.indices || !selectedMatch.indices.length) {
      return escapeHtml(text);
    }

    var out = "";
    var cursor = 0;
    var indices = selectedMatch.indices.slice().sort(function (a, b) {
      return a[0] - b[0];
    });

    for (var j = 0; j < indices.length; j += 1) {
      var start = indices[j][0];
      var end = indices[j][1];

      if (start < cursor) {
        continue;
      }

      out += escapeHtml(text.slice(cursor, start));
      out += "<mark>" + escapeHtml(text.slice(start, end + 1)) + "</mark>";
      cursor = end + 1;
    }

    out += escapeHtml(text.slice(cursor));
    return out;
  }

  function snippetAround(text, matches, key, radius) {
    var cleanText = String(text || "");
    var snippetRadius = radius || 60;

    if (!cleanText) {
      return "";
    }

    if (!matches || !matches.length) {
      return escapeHtml(cleanText.slice(0, 120)) + (cleanText.length > 120 ? "..." : "");
    }

    var selectedMatch = null;
    for (var i = 0; i < matches.length; i += 1) {
      if (matches[i].key === key) {
        selectedMatch = matches[i];
        break;
      }
    }

    if (!selectedMatch || !selectedMatch.indices || !selectedMatch.indices.length) {
      return escapeHtml(cleanText.slice(0, 120)) + (cleanText.length > 120 ? "..." : "");
    }

    var first = selectedMatch.indices[0][0];
    var start = Math.max(0, first - snippetRadius);
    var end = Math.min(cleanText.length, first + snippetRadius + 40);
    var slice = cleanText.slice(start, end);
    var shifted = [];

    for (var j = 0; j < selectedMatch.indices.length; j += 1) {
      var shiftedStart = selectedMatch.indices[j][0] - start;
      var shiftedEnd = selectedMatch.indices[j][1] - start;

      if (shiftedStart >= 0 && shiftedEnd < slice.length) {
        shifted.push([shiftedStart, shiftedEnd]);
      }
    }

    var prefix = start > 0 ? "..." : "";
    var suffix = end < cleanText.length ? "..." : "";

    return prefix + highlight(slice, [{ key: key, indices: shifted }], key) + suffix;
  }

  function getSearchIndex(indexUrl) {
    if (INDEX_CACHE[indexUrl]) {
      return INDEX_CACHE[indexUrl];
    }

    INDEX_CACHE[indexUrl] = fetch(indexUrl, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load search index.");
        }

        return response.json();
      })
      .then(function (data) {
        return {
          data: safeArray(data),
          fuse: window.Fuse ? new window.Fuse(safeArray(data), FUSE_CONFIG) : null
        };
      })
      .catch(function (error) {
        delete INDEX_CACHE[indexUrl];
        throw error;
      });

    return INDEX_CACHE[indexUrl];
  }

  function fallbackSearch(indexData, term) {
    var lowered = term.toLowerCase();

    return indexData
      .filter(function (item) {
        var haystack = [
          item.title,
          item.description,
          item.excerpt,
          item.body,
          safeArray(item.tags).join(" ")
        ].join(" ").toLowerCase();

        return haystack.indexOf(lowered) !== -1;
      })
      .map(function (item) {
        return { item: item, matches: [] };
      });
  }

  function runSearch(index, term) {
    if (!term || term.length < 2) {
      return [];
    }

    if (index.fuse) {
      return index.fuse.search(term);
    }

    return fallbackSearch(index.data, term);
  }

  function filterResultsByScope(results, scope) {
    if (!scope) {
      return results.slice();
    }

    return results.filter(function (result) {
      return result.item && result.item.category === scope;
    });
  }

  function sortResults(results, sortMode) {
    if (sortMode === "newest") {
      return results.slice().sort(function (a, b) {
        return String(b.item.date || "").localeCompare(String(a.item.date || ""));
      });
    }

    if (sortMode === "oldest") {
      return results.slice().sort(function (a, b) {
        return String(a.item.date || "").localeCompare(String(b.item.date || ""));
      });
    }

    return results.slice();
  }

  function buildSearchPageUrl(baseUrl, term, scope, sortMode) {
    var params = new URLSearchParams();

    if (term) {
      params.set("q", term);
    }

    if (scope) {
      params.set("scope", scope);
    }

    if (sortMode && sortMode !== "relevance") {
      params.set("sort", sortMode);
    }

    var queryString = params.toString();
    return queryString ? baseUrl + "?" + queryString : baseUrl;
  }

  function getInlineScopeOptions(pageScope, pageLabel) {
    if (!pageScope) {
      return [];
    }

    return [
      { value: pageScope, label: "In " + pageLabel },
      { value: "", label: "Everywhere" }
    ];
  }

  function getPageScopeOptions() {
    return [
      { value: "", label: "All" },
      { value: "writing", label: "Writing" },
      { value: "building", label: "Building" },
      { value: "notes", label: "Notes" },
      { value: "marginalia", label: "Marginalia" }
    ];
  }

  function buildControlsMarkup(scopeOptions, activeScope, sortMode, controlsLabel) {
    var leftSide = "";

    if (scopeOptions.length) {
      leftSide += '<span class="scope-pills">';

      scopeOptions.forEach(function (option) {
        leftSide +=
          '<button class="scope-pill' +
          (option.value === activeScope ? " active" : "") +
          '" data-scope="' +
          escapeHtml(option.value) +
          '">' +
          escapeHtml(option.label) +
          "</button>";
      });

      leftSide += "</span>";
    } else {
      leftSide += '<span class="search-controls-label">' + escapeHtml(controlsLabel || "All collections") + "</span>";
    }

    return (
      '<div class="search-controls">' +
      leftSide +
      '<span class="sort-pills">' +
      '<button class="sort-pill' + (sortMode === "relevance" ? " active" : "") + '" data-sort="relevance">Relevance</button>' +
      '<span class="sort-sep">·</span>' +
      '<button class="sort-pill' + (sortMode === "oldest" ? " active" : "") + '" data-sort="oldest">Oldest</button>' +
      '<span class="sort-sep">·</span>' +
      '<button class="sort-pill' + (sortMode === "newest" ? " active" : "") + '" data-sort="newest">Newest</button>' +
      "</span>" +
      "</div>"
    );
  }

  function renderResultsMarkup(options) {
    var term = String(options.term || "").trim();

    if (term.length < 2) {
      if (options.mode === "page") {
        return (
          '<div class="search-page-empty">' +
          "<strong>Search writing, building, notes, and marginalia.</strong>" +
          '<span>Type at least 2 characters to start searching.</span>' +
          "</div>"
        );
      }

      return "";
    }

    var scopeOptions = options.mode === "page"
      ? getPageScopeOptions()
      : getInlineScopeOptions(options.pageScope, options.pageLabel);
    var scoped = sortResults(filterResultsByScope(options.results, options.scope), options.sortMode);
    var limit = options.mode === "inline" ? INLINE_LIMIT : scoped.length;
    var visibleResults = scoped.slice(0, limit);
    var html = buildControlsMarkup(scopeOptions, options.scope, options.sortMode, options.controlsLabel);

    if (!visibleResults.length) {
      html += '<div class="search-empty">';
      html += '<strong>No results for "' + escapeHtml(term) + '"</strong>';
      html += "Try a different term or widen the search scope.";
      html += "</div>";

      if (options.mode === "inline") {
        html += '<div class="search-kb-hint">↑↓ navigate · enter to open · esc to close</div>';
      }

      return html;
    }

    visibleResults.forEach(function (result, index) {
      var item = result.item || {};
      var matches = result.matches || [];
      var titleHtml = highlight(item.title || "", matches, "title");
      var snippetKey = null;

      for (var i = 0; i < matches.length; i += 1) {
        if (matches[i].key === "body") {
          snippetKey = "body";
          break;
        }

        if (matches[i].key === "excerpt") {
          snippetKey = "excerpt";
        }
      }

      var excerptSource = snippetKey === "body"
        ? (item.body || item.excerpt || item.description || "")
        : (item.excerpt || item.description || item.body || "");
      var excerptHtml = snippetKey
        ? snippetAround(excerptSource, matches, snippetKey, 50)
        : escapeHtml(excerptSource.slice(0, 120)) + (excerptSource.length > 120 ? "..." : "");
      var metaParts = [];
      var tags = safeArray(item.tags).join(" · ");
      var dateText = formatDate(item.date);

      if (tags) {
        metaParts.push(escapeHtml(tags));
      }

      if (dateText) {
        metaParts.push(escapeHtml(dateText));
      }

      metaParts.push('<span class="r-cat">' + escapeHtml(getCategoryLabel(item)) + "</span>");

      html += '<a class="search-result" href="' + escapeHtml(item.url || "#") + '" data-idx="' + index + '">';
      html += '<span class="result-title">' + titleHtml + "</span>";
      html += '<span class="result-meta">' + metaParts.join(" · ") + "</span>";
      html += '<span class="result-excerpt">' + excerptHtml + "</span>";
      html += "</a>";
    });

    if (options.mode === "inline") {
      html += '<div class="search-footer">';
      html +=
        "<span>" +
        scoped.length +
        " result" +
        (scoped.length === 1 ? "" : "s") +
        (options.scope ? " in " + escapeHtml(options.pageLabel || getCategoryLabel({ category: options.scope })) : "") +
        "</span>";

      if (scoped.length > INLINE_LIMIT) {
        html +=
          '<a href="' +
          escapeHtml(buildSearchPageUrl(options.resultsUrl, term, options.scope, options.sortMode)) +
          '">see all (' +
          scoped.length +
          ") →</a>";
      } else {
        html += "<span></span>";
      }

      html += "</div>";
      html += '<div class="search-kb-hint">↑↓ navigate · enter to open · esc to close</div>';
    } else {
      html += '<div class="search-footer">';
      html +=
        "<span>" +
        scoped.length +
        " result" +
        (scoped.length === 1 ? "" : "s") +
        "</span>";
      html += '<span>Sorted by ' + escapeHtml(options.sortMode) + "</span>";
      html += "</div>";
    }

    return html;
  }

  function renderInlineError(dropdown, message) {
    dropdown.innerHTML =
      '<div class="search-empty"><strong>Search is unavailable.</strong>' +
      escapeHtml(message || "Could not load the search index.") +
      "</div>";
    dropdown.classList.add("visible");
  }

  function renderPageError(resultsRoot, message) {
    resultsRoot.innerHTML =
      '<div class="search-page-empty"><strong>Search is unavailable.</strong><span>' +
      escapeHtml(message || "Could not load the search index.") +
      "</span></div>";
  }

  function initInlineSearch(root) {
    var trigger = root.querySelector(".search-trigger");
    var input = root.querySelector(".search-input");
    var clearButton = root.querySelector(".search-clear");
    var separator = root.querySelector(".search-actions-sep");
    var closeButton = root.querySelector(".search-close");
    var dropdown = root.querySelector(".search-dropdown");
    var aboutTrigger = root.querySelector(".about-trigger");
    var aboutOverlay = root.querySelector(".archive-about-overlay");
    var aboutPanel = root.querySelector(".archive-about-panel");
    var aboutCloseButton = root.querySelector(".archive-about-close");
    var navTrigger = root.querySelector(".archive-nav-trigger");
    var navOverlay = root.querySelector(".archive-nav-overlay");
    var navPanel = root.querySelector(".archive-nav-panel");
    var firstNavLink = navPanel ? navPanel.querySelector("a") : null;

    if (!trigger || !input || !clearButton || !separator || !closeButton || !dropdown) {
      return;
    }

    var searchIndexUrl = root.dataset.searchIndexUrl || "/search-index.json";
    var resultsUrl = root.dataset.searchResultsUrl || "/search/";
    var pageScope = sanitizeScope(root.dataset.searchScope || "");
    var pageLabel = root.dataset.searchScopeLabel || "This page";
    var state = {
      results: [],
      scope: pageScope,
      sortMode: "relevance",
      kbIndex: -1,
      debounceTimer: null
    };

    function syncClearButton() {
      var hasValue = input.value.trim().length > 0;
      clearButton.classList.toggle("visible", hasValue);
      separator.classList.toggle("visible", hasValue);
    }

    function clearDropdown() {
      dropdown.innerHTML = "";
      dropdown.classList.remove("visible");
      state.kbIndex = -1;
    }

    function openAbout(event) {
      if (!aboutTrigger || !aboutOverlay) {
        return;
      }

      if (event) {
        event.preventDefault();
      }

      if (document.body.classList.contains("search-open")) {
        closeSearch();
      }

      if (document.body.classList.contains("nav-open")) {
        closeNav();
      }

      document.body.classList.add("about-open");
      aboutTrigger.setAttribute("aria-expanded", "true");
      aboutOverlay.setAttribute("aria-hidden", "false");

      requestAnimationFrame(function () {
        if (aboutCloseButton) {
          aboutCloseButton.focus();
        }
      });
    }

    function closeAbout() {
      if (!aboutTrigger || !aboutOverlay) {
        return;
      }

      document.body.classList.remove("about-open");
      aboutTrigger.setAttribute("aria-expanded", "false");
      aboutOverlay.setAttribute("aria-hidden", "true");
    }

    function openNav(event) {
      if (!navTrigger || !navOverlay) {
        return;
      }

      if (event) {
        event.preventDefault();
      }

      if (document.body.classList.contains("search-open")) {
        closeSearch();
      }

      if (document.body.classList.contains("about-open")) {
        closeAbout();
      }

      document.body.classList.add("nav-open");
      navTrigger.setAttribute("aria-expanded", "true");
      navOverlay.setAttribute("aria-hidden", "false");

      requestAnimationFrame(function () {
        if (firstNavLink) {
          firstNavLink.focus();
        }
      });
    }

    function closeNav() {
      if (!navTrigger || !navOverlay) {
        return;
      }

      document.body.classList.remove("nav-open");
      navTrigger.setAttribute("aria-expanded", "false");
      navOverlay.setAttribute("aria-hidden", "true");
    }

    function updateKeyboardSelection() {
      var cards = dropdown.querySelectorAll(".search-result");

      Array.prototype.forEach.call(cards, function (card, index) {
        var active = index === state.kbIndex;
        card.classList.toggle("kb-active", active);

        if (active) {
          card.scrollIntoView({ block: "nearest" });
        }
      });
    }

    function bindDropdownControls() {
      Array.prototype.forEach.call(dropdown.querySelectorAll(".scope-pill"), function (button) {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          state.scope = sanitizeScope(button.dataset.scope || "");
          state.kbIndex = -1;
          render();
        });
      });

      Array.prototype.forEach.call(dropdown.querySelectorAll(".sort-pill"), function (button) {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          state.sortMode = sanitizeSortMode(button.dataset.sort || "relevance");
          state.kbIndex = -1;
          render();
        });
      });
    }

    function render() {
      var term = input.value.trim();
      var html = renderResultsMarkup({
        mode: "inline",
        term: term,
        results: state.results,
        scope: state.scope,
        sortMode: state.sortMode,
        pageScope: pageScope,
        pageLabel: pageLabel,
        controlsLabel: "All collections",
        resultsUrl: resultsUrl
      });

      if (!html) {
        clearDropdown();
        return;
      }

      dropdown.innerHTML = html;
      dropdown.classList.add("visible");
      bindDropdownControls();
      updateKeyboardSelection();
    }

    function refreshResults() {
      var term = input.value.trim();

      syncClearButton();

      if (term.length < 2) {
        state.results = [];
        clearDropdown();
        return;
      }

      getSearchIndex(searchIndexUrl)
        .then(function (index) {
          state.results = runSearch(index, term);
          state.kbIndex = -1;
          render();
        })
        .catch(function (error) {
          renderInlineError(dropdown, error && error.message ? error.message : "");
        });
    }

    function openSearch(event) {
      if (event) {
        event.preventDefault();
      }

      if (document.body.classList.contains("nav-open")) {
        closeNav();
      }

      if (document.body.classList.contains("about-open")) {
        closeAbout();
      }

      document.body.classList.add("search-open");
      trigger.setAttribute("aria-expanded", "true");

      getSearchIndex(searchIndexUrl).catch(function () {
        return null;
      });

      requestAnimationFrame(function () {
        input.focus();
      });
    }

    function closeSearch() {
      document.body.classList.remove("search-open");
      trigger.setAttribute("aria-expanded", "false");
      input.value = "";
      input.blur();
      state.results = [];
      state.scope = pageScope;
      state.sortMode = "relevance";
      clearDropdown();
      syncClearButton();
    }

    trigger.addEventListener("click", openSearch);

    if (aboutTrigger && aboutOverlay) {
      aboutTrigger.addEventListener("click", function (event) {
        if (document.body.classList.contains("about-open")) {
          event.preventDefault();
          closeAbout();
          return;
        }

        openAbout(event);
      });

      aboutOverlay.addEventListener("click", function (event) {
        if (aboutPanel && aboutPanel.contains(event.target)) {
          return;
        }

        closeAbout();
      });
    }

    if (navTrigger && navOverlay) {
      navTrigger.addEventListener("click", function (event) {
        if (document.body.classList.contains("nav-open")) {
          event.preventDefault();
          closeNav();
          return;
        }

        openNav(event);
      });

      navOverlay.addEventListener("click", function (event) {
        if (navPanel && navPanel.contains(event.target)) {
          return;
        }

        closeNav();
      });
    }

    closeButton.addEventListener("click", function () {
      closeSearch();
    });

    if (aboutCloseButton) {
      aboutCloseButton.addEventListener("click", function () {
        closeAbout();
      });
    }

    clearButton.addEventListener("click", function () {
      input.value = "";
      input.focus();
      state.results = [];
      syncClearButton();
      clearDropdown();
    });

    input.addEventListener("input", function () {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(refreshResults, 150);
    });

    document.addEventListener("click", function (event) {
      if (document.body.classList.contains("about-open") && aboutOverlay && aboutPanel) {
        if (aboutTrigger && aboutTrigger.contains(event.target)) {
          return;
        }

        if (aboutPanel.contains(event.target)) {
          return;
        }

        closeAbout();
        return;
      }

      if (document.body.classList.contains("nav-open") && navOverlay && navPanel) {
        if (navTrigger && navTrigger.contains(event.target)) {
          return;
        }

        if (!navPanel.contains(event.target) && !navOverlay.contains(event.target)) {
          closeNav();
        }
      }

      if (!document.body.classList.contains("search-open")) {
        return;
      }

      if (root.contains(event.target)) {
        return;
      }

      closeSearch();
    });

    document.addEventListener("keydown", function (event) {
      var isOpen = document.body.classList.contains("search-open");
      var isNavOpen = document.body.classList.contains("nav-open");
      var isAboutOpen = document.body.classList.contains("about-open");

      if ((event.key === "/" || (event.metaKey && event.key.toLowerCase() === "k")) && !isOpen && !isTypingField(event.target)) {
        event.preventDefault();

        if (isNavOpen) {
          closeNav();
        }

        if (isAboutOpen) {
          closeAbout();
        }

        openSearch();
        return;
      }

      if (event.key === "Escape") {
        if (isOpen) {
          closeSearch();
          return;
        }

        if (isAboutOpen) {
          closeAbout();
          return;
        }

        if (isNavOpen) {
          closeNav();
        }

        return;
      }

      if (!isOpen) {
        return;
      }

      var cards = dropdown.querySelectorAll(".search-result");

      if (event.key === "ArrowDown") {
        if (!cards.length) {
          return;
        }

        event.preventDefault();
        state.kbIndex = Math.min(state.kbIndex + 1, cards.length - 1);
        updateKeyboardSelection();
      } else if (event.key === "ArrowUp") {
        if (!cards.length) {
          return;
        }

        event.preventDefault();
        state.kbIndex = Math.max(state.kbIndex - 1, -1);
        updateKeyboardSelection();

        if (state.kbIndex === -1) {
          input.focus();
        }
      } else if (event.key === "Enter" && state.kbIndex >= 0 && cards[state.kbIndex]) {
        event.preventDefault();
        window.location.href = cards[state.kbIndex].getAttribute("href");
      }
    });

    syncClearButton();
  }

  function initSearchPage(root) {
    var input = root.querySelector(".search-page-input");
    var clearButton = root.querySelector(".search-page-clear");
    var resultsRoot = root.querySelector(".search-page-results");

    if (!input || !clearButton || !resultsRoot) {
      return;
    }

    var searchIndexUrl = root.dataset.searchIndexUrl || "/search-index.json";
    var params = new URLSearchParams(window.location.search);
    var state = {
      results: [],
      scope: sanitizeScope(params.get("scope") || ""),
      sortMode: sanitizeSortMode(params.get("sort") || "relevance"),
      debounceTimer: null
    };

    input.value = params.get("q") || "";

    function syncClearButton() {
      clearButton.classList.toggle("visible", input.value.trim().length > 0);
    }

    function syncUrl() {
      var nextUrl = buildSearchPageUrl(window.location.pathname, input.value.trim(), state.scope, state.sortMode);
      window.history.replaceState({}, "", nextUrl);
    }

    function bindResultsControls() {
      Array.prototype.forEach.call(resultsRoot.querySelectorAll(".scope-pill"), function (button) {
        button.addEventListener("click", function () {
          state.scope = sanitizeScope(button.dataset.scope || "");
          syncUrl();
          render();
        });
      });

      Array.prototype.forEach.call(resultsRoot.querySelectorAll(".sort-pill"), function (button) {
        button.addEventListener("click", function () {
          state.sortMode = sanitizeSortMode(button.dataset.sort || "relevance");
          syncUrl();
          render();
        });
      });
    }

    function render() {
      resultsRoot.innerHTML = renderResultsMarkup({
        mode: "page",
        term: input.value.trim(),
        results: state.results,
        scope: state.scope,
        sortMode: state.sortMode
      });

      bindResultsControls();
    }

    function refreshResults() {
      clearTimeout(state.debounceTimer);

      state.debounceTimer = setTimeout(function () {
        var term = input.value.trim();
        syncClearButton();
        syncUrl();

        if (term.length < 2) {
          state.results = [];
          render();
          return;
        }

        getSearchIndex(searchIndexUrl)
          .then(function (index) {
            state.results = runSearch(index, term);
            render();
          })
          .catch(function (error) {
            renderPageError(resultsRoot, error && error.message ? error.message : "");
          });
      }, 120);
    }

    clearButton.addEventListener("click", function () {
      input.value = "";
      state.results = [];
      syncClearButton();
      syncUrl();
      render();
      input.focus();
    });

    input.addEventListener("input", refreshResults);

    syncClearButton();

    if (input.value.trim().length >= 2) {
      getSearchIndex(searchIndexUrl)
        .then(function (index) {
          state.results = runSearch(index, input.value.trim());
          render();
        })
        .catch(function (error) {
          renderPageError(resultsRoot, error && error.message ? error.message : "");
        });
    } else {
      render();
      requestAnimationFrame(function () {
        input.focus();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll(".js-inline-search"), initInlineSearch);
    Array.prototype.forEach.call(document.querySelectorAll(".js-search-page"), initSearchPage);
  });
})();
