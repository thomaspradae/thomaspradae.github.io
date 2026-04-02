(function () {
  var ROOT_SELECTOR = ".js-search-page-rich";
  var CATEGORY_LABELS = {
    writing: "Writing",
    building: "Building",
    notes: "Notes",
    misc: "Marginalia"
  };
  var GROUP_ORDER = ["topic", "piece", "section"];
  var ALL_KIND = "";
  var ALL_SCOPE = "";
  var DEFAULT_SORT = "relevance";
  var RESULT_LIMITS = {
    topic: 6,
    piece: 8,
    section: 8
  };
  var DISCOVERY_TOPIC_LIMIT = 14;
  var DISCOVERY_RECENT_LIMIT = 8;
  var MIN_QUERY_LENGTH = 2;

  var PIECE_FUSE_CONFIG = {
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    threshold: 0.28,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 0.44 },
      { name: "tags", weight: 0.24 },
      { name: "description", weight: 0.12 },
      { name: "excerpt", weight: 0.1 },
      { name: "body", weight: 0.1 }
    ]
  };

  var TOPIC_FUSE_CONFIG = {
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    threshold: 0.24,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 0.72 },
      { name: "body", weight: 0.28 }
    ]
  };

  var SECTION_FUSE_CONFIG = {
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    threshold: 0.27,
    minMatchCharLength: 2,
    keys: [
      { name: "section_title", weight: 0.42 },
      { name: "piece_title", weight: 0.22 },
      { name: "tags", weight: 0.1 },
      { name: "body", weight: 0.26 }
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

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    return String(dateString).slice(0, 7).replace("-", ".");
  }

  function collectionLabel(category) {
    if (CATEGORY_LABELS[category]) {
      return CATEGORY_LABELS[category];
    }

    return category ? category.charAt(0).toUpperCase() + category.slice(1) : "Pieces";
  }

  function slugifyTag(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function slugifyHeading(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function normalizeUrl(url) {
    if (!url) {
      return "#";
    }

    return url;
  }

  function queryParamOrDefault(params, key, fallback) {
    return params.get(key) || fallback;
  }

  function sanitizeScope(value) {
    return ["writing", "building", "notes", "misc"].indexOf(value) !== -1 ? value : ALL_SCOPE;
  }

  function sanitizeKind(value) {
    return ["piece", "section", "topic"].indexOf(value) !== -1 ? value : ALL_KIND;
  }

  function sanitizeSort(value) {
    return ["relevance", "oldest", "newest"].indexOf(value) !== -1 ? value : DEFAULT_SORT;
  }

  function parseQuery(rawValue) {
    var raw = String(rawValue || "").trim();
    var phrases = [];
    var remainder = raw.replace(/"([^"]+)"/g, function (_, phrase) {
      var normalizedPhrase = normalizeText(phrase);
      if (normalizedPhrase.length >= MIN_QUERY_LENGTH) {
        phrases.push(normalizedPhrase);
      }

      return " ";
    });
    var tokens = normalizeText(remainder)
      .split(" ")
      .filter(function (token) {
        return token.length >= MIN_QUERY_LENGTH;
      });

    return {
      raw: raw,
      normalized: normalizeText(raw),
      phrases: phrases,
      tokens: tokens,
      fuseTerm: phrases.concat(tokens).join(" ").trim() || raw
    };
  }

  function containsNormalized(haystack, needle) {
    if (!needle) {
      return false;
    }

    return normalizeText(haystack).indexOf(needle) !== -1;
  }

  function exactNormalized(haystack, needle) {
    if (!needle) {
      return false;
    }

    return normalizeText(haystack) === needle;
  }

  function buildHighlightRegex(queryMeta) {
    var fragments = queryMeta.phrases.concat(queryMeta.tokens)
      .filter(Boolean)
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .map(function (value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      });

    if (!fragments.length) {
      return null;
    }

    return new RegExp("(" + fragments.join("|") + ")", "ig");
  }

  function highlightQuery(text, queryMeta) {
    var source = String(text || "");
    var regex = buildHighlightRegex(queryMeta);

    if (!regex || !source) {
      return escapeHtml(source);
    }

    return escapeHtml(source).replace(regex, "<mark>$1</mark>");
  }

  function snippetAround(text, queryMeta, radius) {
    var cleanText = String(text || "").replace(/\s+/g, " ").trim();
    var snippetRadius = radius || 70;
    var normalized = normalizeText(cleanText);
    var searchTerm = queryMeta.phrases[0] || queryMeta.tokens[0] || "";

    if (!cleanText) {
      return "";
    }

    if (!searchTerm) {
      return highlightQuery(cleanText.slice(0, 160), queryMeta) + (cleanText.length > 160 ? "..." : "");
    }

    var matchIndex = normalized.indexOf(searchTerm);

    if (matchIndex === -1) {
      return highlightQuery(cleanText.slice(0, 160), queryMeta) + (cleanText.length > 160 ? "..." : "");
    }

    var start = Math.max(0, matchIndex - snippetRadius);
    var end = Math.min(cleanText.length, matchIndex + searchTerm.length + snippetRadius);
    var prefix = start > 0 ? "..." : "";
    var suffix = end < cleanText.length ? "..." : "";

    return prefix + highlightQuery(cleanText.slice(start, end), queryMeta) + suffix;
  }

  function getKindLabel(kind) {
    if (kind === "topic") {
      return "Topics";
    }

    if (kind === "section") {
      return "Sections";
    }

    return "Pieces";
  }

  function getTypeOptions() {
    return [
      { value: ALL_KIND, label: "All" },
      { value: "piece", label: "Pieces" },
      { value: "section", label: "Sections" },
      { value: "topic", label: "Topics" }
    ];
  }

  function getScopeOptions() {
    return [
      { value: ALL_SCOPE, label: "All collections" },
      { value: "writing", label: "Writing" },
      { value: "building", label: "Building" },
      { value: "notes", label: "Notes" },
      { value: "misc", label: "Marginalia" }
    ];
  }

  function getSortOptions() {
    return [
      { value: "relevance", label: "Relevance" },
      { value: "oldest", label: "Oldest" },
      { value: "newest", label: "Newest" }
    ];
  }

  function buildPieces(rawItems) {
    return safeArray(rawItems).map(function (item) {
      return {
        entity_type: "piece",
        title: item.title || "",
        description: item.description || "",
        excerpt: item.excerpt || "",
        body: item.body || "",
        url: normalizeUrl(item.url),
        category: item.category || "",
        category_label: item.category_label || collectionLabel(item.category || ""),
        tags: safeArray(item.tags),
        date: item.date || ""
      };
    });
  }

  function buildTopics(pieces) {
    var topicsByKey = new Map();

    pieces.forEach(function (piece) {
      safeArray(piece.tags).forEach(function (tag) {
        var label = String(tag || "").trim();
        var key = normalizeText(label);

        if (!key) {
          return;
        }

        if (!topicsByKey.has(key)) {
          topicsByKey.set(key, {
            entity_type: "topic",
            title: label,
            slug: slugifyTag(label),
            url: "/tag/" + slugifyTag(label) + "/",
            category: "topic",
            category_label: "Topic",
            tags: [],
            date: piece.date || "",
            categories: new Set(),
            piece_titles: [],
            count: 0
          });
        }

        var topic = topicsByKey.get(key);
        topic.count += 1;
        topic.categories.add(piece.category);

        if (piece.date && String(piece.date) > String(topic.date || "")) {
          topic.date = piece.date;
        }

        if (topic.piece_titles.length < 8) {
          topic.piece_titles.push(piece.title);
        }
      });
    });

    return Array.from(topicsByKey.values())
      .map(function (topic) {
        var categoryLabels = Array.from(topic.categories).map(collectionLabel);

        return {
          entity_type: "topic",
          title: topic.title,
          slug: topic.slug,
          url: topic.url,
          category: "topic",
          category_label: "Topic",
          tags: [],
          date: topic.date,
          count: topic.count,
          categories: Array.from(topic.categories),
          description: topic.count + " piece" + (topic.count === 1 ? "" : "s") + (categoryLabels.length ? " across " + categoryLabels.join(" / ") : ""),
          body: topic.piece_titles.join(" • ")
        };
      })
      .sort(function (a, b) {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return a.title.localeCompare(b.title);
      });
  }

  function collectSectionText(nodes, start, end) {
    var parts = [];

    for (var i = start; i < end; i += 1) {
      var node = nodes[i];

      if (!node || !node.tagName) {
        continue;
      }

      if (/^H[2-6]$/.test(node.tagName)) {
        continue;
      }

      if (node.classList && (node.classList.contains("post-nav") || node.classList.contains("footnotes"))) {
        continue;
      }

      var text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      if (text) {
        parts.push(text);
      }
    }

    return parts.join(" ").trim();
  }

  function makeSectionRecord(piece, pieceTitle, sectionTitle, anchor, level, body, position) {
    return {
      entity_type: "section",
      title: pieceTitle + " > " + sectionTitle,
      piece_title: pieceTitle,
      section_title: sectionTitle,
      anchor: anchor,
      url: anchor === "page-title" ? piece.url : piece.url + "#" + anchor,
      piece_url: piece.url,
      category: piece.category,
      category_label: piece.category_label,
      tags: safeArray(piece.tags),
      date: piece.date,
      description: sectionTitle,
      excerpt: body.slice(0, 220),
      body: body,
      section_level: level,
      section_position: position
    };
  }

  function extractSectionsFromHtml(piece, html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(String(html || ""), "text/html");
    var article = doc.querySelector("#main .post-body-content") || doc.querySelector(".post-body-content");

    if (!article) {
      return [];
    }

    var pageTitle = (doc.querySelector(".page-title") || {}).textContent || piece.title;
    pageTitle = String(pageTitle || piece.title || "").trim();

    var nodes = Array.prototype.filter.call(article.children || [], function (child) {
      return child && child.tagName && child.tagName !== "SCRIPT";
    });

    if (!nodes.length) {
      return [];
    }

    var headings = [];

    nodes.forEach(function (node, index) {
      if (/^H[2-6]$/.test(node.tagName)) {
        headings.push({ node: node, index: index });
      }
    });

    var sections = [];
    var introEnd = headings.length ? headings[0].index : nodes.length;
    var introText = collectSectionText(nodes, 0, introEnd);

    if (introText.length > 140) {
      sections.push(
        makeSectionRecord(piece, pageTitle, "Opening", "page-title", 1, introText, 0)
      );
    }

    headings.forEach(function (entry, idx) {
      var heading = entry.node;
      var sectionTitle = String(heading.textContent || "").replace(/\s+/g, " ").trim();

      if (!sectionTitle) {
        return;
      }

      var anchor = heading.getAttribute("id") || slugifyHeading(sectionTitle) || ("section-" + (idx + 1));
      var nextEntry = headings[idx + 1];
      var end = nextEntry ? nextEntry.index : nodes.length;
      var text = collectSectionText(nodes, entry.index + 1, end);

      if (text.length < 40) {
        return;
      }

      sections.push(
        makeSectionRecord(
          piece,
          pageTitle,
          sectionTitle,
          anchor,
          parseInt(heading.tagName.slice(1), 10),
          text,
          idx + 1
        )
      );
    });

    return sections;
  }

  function fetchSectionsForPieces(pieces, onProgress) {
    if (!pieces.length) {
      return Promise.resolve([]);
    }

    var total = pieces.length;
    var completed = 0;

    return Promise.all(
      pieces.map(function (piece) {
        return fetch(piece.url, { credentials: "same-origin" })
          .then(function (response) {
            if (!response.ok) {
              throw new Error("Could not load " + piece.url);
            }

            return response.text();
          })
          .then(function (html) {
            return extractSectionsFromHtml(piece, html);
          })
          .catch(function () {
            return [];
          })
          .then(function (sections) {
            completed += 1;

            if (typeof onProgress === "function") {
              onProgress(completed, total);
            }

            return sections;
          });
      })
    ).then(function (allSections) {
      return allSections.flat();
    });
  }

  function computeBonus(text, queryMeta, exactWeight, partialWeight) {
    var bonus = 0;

    if (!text) {
      return bonus;
    }

    if (queryMeta.normalized && exactNormalized(text, queryMeta.normalized)) {
      bonus += exactWeight;
    }

    queryMeta.phrases.forEach(function (phrase) {
      if (containsNormalized(text, phrase)) {
        bonus += exactWeight;
      }
    });

    queryMeta.tokens.forEach(function (token) {
      if (containsNormalized(text, token)) {
        bonus += partialWeight;
      }
    });

    return bonus;
  }

  function computeRank(result, queryMeta, kind) {
    var item = result.item || {};
    var base = 1 - Math.min(typeof result.score === "number" ? result.score : 1, 1);
    var bonus = 0;

    if (kind === "topic") {
      bonus += computeBonus(item.title, queryMeta, 3.1, 0.9);
      bonus += computeBonus(item.body, queryMeta, 0.5, 0.12);
      bonus += Math.min(item.count || 0, 8) * 0.08;
      return base + bonus;
    }

    if (kind === "section") {
      bonus += computeBonus(item.section_title, queryMeta, 2.4, 0.55);
      bonus += computeBonus(item.piece_title, queryMeta, 1.1, 0.25);
      bonus += computeBonus(safeArray(item.tags).join(" "), queryMeta, 1.05, 0.2);
      bonus += computeBonus(item.body, queryMeta, 0.95, 0.15);
      bonus += Math.max(0, 0.16 - ((item.section_level || 2) - 2) * 0.03);
      return base + bonus;
    }

    bonus += computeBonus(item.title, queryMeta, 2.1, 0.55);
    bonus += computeBonus(safeArray(item.tags).join(" "), queryMeta, 1.4, 0.26);
    bonus += computeBonus(item.description, queryMeta, 0.9, 0.2);
    bonus += computeBonus(item.excerpt, queryMeta, 0.7, 0.12);
    bonus += computeBonus(item.body, queryMeta, 0.7, 0.08);

    return base + bonus;
  }

  function sortRankedResults(results, sortMode) {
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

    return results.slice().sort(function (a, b) {
      if (b.rank !== a.rank) {
        return b.rank - a.rank;
      }

      return String(b.item.date || "").localeCompare(String(a.item.date || ""));
    });
  }

  function filterByScope(items, scope) {
    if (!scope) {
      return items.slice();
    }

    return items.filter(function (item) {
      if (item.entity_type === "topic") {
        return safeArray(item.categories).indexOf(scope) !== -1;
      }

      return item.category === scope;
    });
  }

  function fallbackSearch(items, queryMeta, kind) {
    var fields = ["title", "description", "excerpt", "body"];

    if (kind === "topic") {
      fields = ["title", "body"];
    } else if (kind === "section") {
      fields = ["section_title", "piece_title", "body", "tags"];
    }

    return items.filter(function (item) {
      var haystack = normalizeText(fields.map(function (field) {
        var value = item[field];

        if (Array.isArray(value)) {
          return value.join(" ");
        }

        return String(value || "");
      }).join(" "));

      if (!haystack) {
        return false;
      }

      var phraseMatch = !queryMeta.phrases.length || queryMeta.phrases.every(function (phrase) {
        return haystack.indexOf(phrase) !== -1;
      });
      var tokenMatch = !queryMeta.tokens.length || queryMeta.tokens.some(function (token) {
        return haystack.indexOf(token) !== -1;
      });

      return phraseMatch && tokenMatch;
    }).map(function (item) {
      return {
        item: item,
        matches: [],
        score: 0.5
      };
    });
  }

  function runFuseSearch(fuse, items, queryMeta, kind) {
    if (!queryMeta.fuseTerm || queryMeta.fuseTerm.length < MIN_QUERY_LENGTH) {
      return [];
    }

    if (!items.length) {
      return [];
    }

    if (!fuse) {
      return fallbackSearch(items, queryMeta, kind);
    }

    return fuse.search(queryMeta.fuseTerm);
  }

  function buildSearchPageUrl(baseUrl, state) {
    var params = new URLSearchParams();

    if (state.query) {
      params.set("q", state.query);
    }

    if (state.scope) {
      params.set("scope", state.scope);
    }

    if (state.kind) {
      params.set("kind", state.kind);
    }

    if (state.sortMode && state.sortMode !== DEFAULT_SORT) {
      params.set("sort", state.sortMode);
    }

    var queryString = params.toString();
    return queryString ? baseUrl + "?" + queryString : baseUrl;
  }

  function renderControlRow(options, activeValue, dataAttr, cssClass) {
    return options.map(function (option) {
      return (
        '<button class="' + cssClass + (option.value === activeValue ? " active" : "") + '" data-' + dataAttr + '="' +
        escapeHtml(option.value) + '">' + escapeHtml(option.label) + "</button>"
      );
    }).join("");
  }

  function renderControls(state) {
    return (
      '<div class="search-controls search-controls--stacked">' +
      '<div class="search-controls-row">' +
      '<span class="search-controls-label">Type</span>' +
      '<span class="kind-pills">' +
      renderControlRow(getTypeOptions(), state.kind, "kind", "kind-pill") +
      "</span>" +
      "</div>" +
      '<div class="search-controls-row">' +
      '<span class="search-controls-label">Collection</span>' +
      '<span class="scope-pills">' +
      renderControlRow(getScopeOptions(), state.scope, "scope", "scope-pill") +
      "</span>" +
      "</div>" +
      '<div class="search-controls-row search-controls-row--sort">' +
      '<span class="search-controls-label">Sort</span>' +
      '<span class="sort-pills">' +
      renderControlRow(getSortOptions(), state.sortMode, "sort", "sort-pill") +
      "</span>" +
      "</div>" +
      "</div>"
    );
  }

  function renderTopicPill(topic) {
    return (
      '<a class="search-theme-pill" href="' + escapeHtml(topic.url) + '">' +
      '<span class="search-theme-pill-label">' + escapeHtml(topic.title) + "</span>" +
      '<span class="search-theme-pill-count">' + escapeHtml(String(topic.count || 0)) + "</span>" +
      "</a>"
    );
  }

  function renderDiscovery(state) {
    var topTopics = state.topics.slice(0, DISCOVERY_TOPIC_LIMIT);
    var recentPieces = state.pieces.slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    }).slice(0, DISCOVERY_RECENT_LIMIT);
    var statusHtml = "";

    if (state.sectionsStatus === "loading") {
      statusHtml =
        '<div class="search-status">Indexing sections in the background' +
        (state.sectionsProgressTotal ? " (" + state.sectionsProgressDone + "/" + state.sectionsProgressTotal + ")" : "") +
        "...</div>";
    }

    return (
      renderControls(state) +
      statusHtml +
      '<div class="search-discovery">' +
      '<section class="search-discovery-group">' +
      '<div class="search-group-heading">' +
      '<h3 class="search-group-title">Browse Themes</h3>' +
      '<span class="search-group-meta">Recurring tags across the site</span>' +
      "</div>" +
      '<div class="search-theme-pills">' +
      topTopics.map(renderTopicPill).join("") +
      "</div>" +
      "</section>" +
      '<section class="search-discovery-group">' +
      '<div class="search-group-heading">' +
      '<h3 class="search-group-title">Recent Pieces</h3>' +
      '<span class="search-group-meta">Fresh writing, building, notes, and marginalia</span>' +
      "</div>" +
      '<div class="search-group-results">' +
      recentPieces.map(function (piece) {
        return renderResultCard({
          item: piece,
          kind: "piece",
          queryMeta: parseQuery(""),
          matches: []
        });
      }).join("") +
      "</div>" +
      "</section>" +
      "</div>"
    );
  }

  function renderResultCard(payload) {
    var item = payload.item || {};
    var kind = payload.kind || item.entity_type || "piece";
    var queryMeta = payload.queryMeta || parseQuery("");
    var title = item.title || "";
    var excerptSource = item.body || item.excerpt || item.description || "";
    var metaBits = [];
    var kicker = "";
    var excerptHtml = "";

    if (kind === "section") {
      kicker = '<span class="result-kicker">Section</span>';
      title = (item.piece_title || "") + " > " + (item.section_title || item.title || "");
      excerptHtml = snippetAround(excerptSource, queryMeta, 70);
    } else if (kind === "topic") {
      kicker = '<span class="result-kicker">Topic</span>';
      excerptHtml = highlightQuery(item.description || item.body || "", queryMeta);
    } else {
      kicker = '<span class="result-kicker">Piece</span>';
      excerptHtml = snippetAround(excerptSource, queryMeta, 70);
    }

    if (kind === "topic") {
      if (item.count) {
        metaBits.push(escapeHtml(String(item.count)) + " linked piece" + (item.count === 1 ? "" : "s"));
      }

      if (safeArray(item.categories).length) {
        metaBits.push(escapeHtml(safeArray(item.categories).map(collectionLabel).join(" / ")));
      }
    } else {
      if (item.date) {
        metaBits.push(escapeHtml(formatDate(item.date)));
      }

      if (item.category_label) {
        metaBits.push('<span class="r-cat">' + escapeHtml(item.category_label) + "</span>");
      }

      if (safeArray(item.tags).length) {
        metaBits.push(escapeHtml(safeArray(item.tags).slice(0, 4).join(" · ")));
      }
    }

    return (
      '<a class="search-result search-result--' + kind + '" href="' + escapeHtml(item.url || "#") + '">' +
      kicker +
      '<span class="result-title">' + highlightQuery(title, queryMeta) + "</span>" +
      '<span class="result-meta">' + metaBits.join(" · ") + "</span>" +
      '<span class="result-excerpt">' + excerptHtml + "</span>" +
      "</a>"
    );
  }

  function renderGroup(kind, results, queryMeta, showAll) {
    var title = getKindLabel(kind);
    var visibleResults = showAll ? results : results.slice(0, RESULT_LIMITS[kind] || results.length);
    var body = visibleResults.map(function (result) {
      return renderResultCard({
        item: result.item,
        kind: kind,
        queryMeta: queryMeta,
        matches: result.matches || []
      });
    }).join("");

    return (
      '<section class="search-group search-group--' + kind + '">' +
      '<div class="search-group-heading">' +
      '<h3 class="search-group-title">' + escapeHtml(title) + "</h3>" +
      '<span class="search-group-meta">' + escapeHtml(String(results.length)) + " result" + (results.length === 1 ? "" : "s") + "</span>" +
      "</div>" +
      '<div class="search-group-results">' + body + "</div>" +
      "</section>"
    );
  }

  function renderNoResults(state, queryMeta) {
    var suggestedTopics = state.topics.slice(0, 8);
    var recentPieces = state.pieces.slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    }).slice(0, 5);

    return (
      renderControls(state) +
      '<div class="search-page-empty search-page-empty--rich">' +
      '<strong>No results for "' + escapeHtml(queryMeta.raw) + '"</strong>' +
      '<span>Try a broader term, change the collection, or browse one of these themes.</span>' +
      "</div>" +
      '<section class="search-discovery-group">' +
      '<div class="search-group-heading">' +
      '<h3 class="search-group-title">Themes To Try</h3>' +
      '<span class="search-group-meta">Tag pages that already exist on the site</span>' +
      "</div>" +
      '<div class="search-theme-pills">' +
      suggestedTopics.map(renderTopicPill).join("") +
      "</div>" +
      "</section>" +
      '<section class="search-discovery-group">' +
      '<div class="search-group-heading">' +
      '<h3 class="search-group-title">Recent Pieces</h3>' +
      '<span class="search-group-meta">Fallback so the page never dies on you</span>' +
      "</div>" +
      '<div class="search-group-results">' +
      recentPieces.map(function (piece) {
        return renderResultCard({
          item: piece,
          kind: "piece",
          queryMeta: parseQuery(""),
          matches: []
        });
      }).join("") +
      "</div>" +
      "</section>"
    );
  }

  function bindControls(root, state, render, baseUrl) {
    root.querySelectorAll("[data-kind]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.kind = button.dataset.kind || "";
        syncUrl(baseUrl, state);
        render();
      });
    });

    root.querySelectorAll("[data-scope]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.scope = button.dataset.scope || "";
        syncUrl(baseUrl, state);
        render();
      });
    });

    root.querySelectorAll("[data-sort]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.sortMode = button.dataset.sort || DEFAULT_SORT;
        syncUrl(baseUrl, state);
        render();
      });
    });
  }

  function syncUrl(baseUrl, state) {
    var nextUrl = buildSearchPageUrl(baseUrl, state);
    window.history.replaceState({}, "", nextUrl);
  }

  function initRichSearchPage(root) {
    var input = root.querySelector(".search-page-input");
    var clearButton = root.querySelector(".search-page-clear");
    var resultsRoot = root.querySelector(".search-page-results");

    if (!input || !clearButton || !resultsRoot) {
      return;
    }

    var searchIndexUrl = root.dataset.searchIndexUrl || "/search-index.json";
    var baseUrl = window.location.pathname;
    var params = new URLSearchParams(window.location.search);
    var state = {
      query: queryParamOrDefault(params, "q", ""),
      scope: sanitizeScope(queryParamOrDefault(params, "scope", ALL_SCOPE)),
      kind: sanitizeKind(queryParamOrDefault(params, "kind", ALL_KIND)),
      sortMode: sanitizeSort(queryParamOrDefault(params, "sort", DEFAULT_SORT)),
      pieces: [],
      topics: [],
      sections: [],
      pieceFuse: null,
      topicFuse: null,
      sectionFuse: null,
      sectionsStatus: "idle",
      sectionsProgressDone: 0,
      sectionsProgressTotal: 0,
      sectionsPromise: null,
      sectionsError: ""
    };

    input.value = state.query;

    function syncClearButton() {
      clearButton.classList.toggle("visible", input.value.trim().length > 0);
    }

    function ensureSections() {
      if (state.sectionsStatus === "ready") {
        return Promise.resolve(state.sections);
      }

      if (state.sectionsPromise) {
        return state.sectionsPromise;
      }

      state.sectionsStatus = "loading";
      state.sectionsProgressDone = 0;
      state.sectionsProgressTotal = state.pieces.length;
      render();

      state.sectionsPromise = fetchSectionsForPieces(state.pieces, function (done, total) {
        state.sectionsProgressDone = done;
        state.sectionsProgressTotal = total;
        render();
      })
        .then(function (sections) {
          state.sections = sections;
          state.sectionFuse = window.Fuse ? new window.Fuse(sections, SECTION_FUSE_CONFIG) : null;
          state.sectionsStatus = "ready";
          state.sectionsError = "";
          render();
          return sections;
        })
        .catch(function (error) {
          state.sectionsStatus = "error";
          state.sectionsError = error && error.message ? error.message : "Could not build section index.";
          render();
          return [];
        });

      return state.sectionsPromise;
    }

    function getRankedResults(items, fuse, queryMeta, kind) {
      var scopedItems = filterByScope(items, state.scope);
      var scopeUrlSet = new Set(scopedItems.map(function (item) {
        return (item.url || "") + "::" + (item.entity_type || "");
      }));
      var fuseResults = runFuseSearch(fuse, items, queryMeta, kind)
        .filter(function (result) {
          return scopeUrlSet.has((result.item.url || "") + "::" + (result.item.entity_type || ""));
        })
        .map(function (result) {
          return {
            item: result.item,
            matches: result.matches || [],
            rank: computeRank(result, queryMeta, kind)
          };
        });

      return sortRankedResults(fuseResults, state.sortMode);
    }

    function maybeWarmSections() {
      if (state.sectionsStatus !== "idle") {
        return;
      }

      var warm = function () {
        ensureSections();
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(warm, { timeout: 1200 });
      } else {
        window.setTimeout(warm, 400);
      }
    }

    function renderResults() {
      var queryMeta = parseQuery(state.query);

      if (queryMeta.fuseTerm.length < MIN_QUERY_LENGTH) {
        resultsRoot.innerHTML = renderDiscovery(state);
        bindControls(resultsRoot, state, render, baseUrl);
        return;
      }

      if (state.sectionsStatus === "idle") {
        ensureSections();
      }

      var topicResults = getRankedResults(state.topics, state.topicFuse, queryMeta, "topic");
      var pieceResults = getRankedResults(state.pieces, state.pieceFuse, queryMeta, "piece");
      var sectionResults = state.sectionsStatus === "ready"
        ? getRankedResults(state.sections, state.sectionFuse, queryMeta, "section")
        : [];
      var activeKinds = state.kind ? [state.kind] : GROUP_ORDER;
      var groupHtml = "";
      var totalCount = 0;
      var statusHtml = "";

      if (state.sectionsStatus === "loading") {
        statusHtml =
          '<div class="search-status">Loading section-level matches' +
          (state.sectionsProgressTotal ? " (" + state.sectionsProgressDone + "/" + state.sectionsProgressTotal + ")" : "") +
          "...</div>";
      } else if (state.sectionsStatus === "error" && !state.kind) {
        statusHtml = '<div class="search-status search-status--error">' + escapeHtml(state.sectionsError || "Section search is unavailable.") + "</div>";
      }

      activeKinds.forEach(function (kind) {
        var results = [];

        if (kind === "topic") {
          results = topicResults;
        } else if (kind === "section") {
          results = sectionResults;
        } else {
          results = pieceResults;
        }

        totalCount += results.length;

        if (!results.length) {
          return;
        }

        groupHtml += renderGroup(kind, results, queryMeta, Boolean(state.kind));
      });

      if (state.kind === "section" && state.sectionsStatus === "loading") {
        resultsRoot.innerHTML =
          renderControls(state) +
          statusHtml +
          '<div class="search-page-empty search-page-empty--rich">' +
          "<strong>Indexing section-level results.</strong>" +
          "<span>Piece and topic matches are already ready. Section matches will appear as soon as the background crawl finishes.</span>" +
          "</div>";
        bindControls(resultsRoot, state, render, baseUrl);
        return;
      }

      if (!totalCount) {
        resultsRoot.innerHTML = renderNoResults(state, queryMeta);
        bindControls(resultsRoot, state, render, baseUrl);
        return;
      }

      resultsRoot.innerHTML =
        renderControls(state) +
        statusHtml +
        '<div class="search-groups">' + groupHtml + "</div>" +
        '<div class="search-footer search-footer--page">' +
        '<span>' + escapeHtml(String(totalCount)) + " grouped result" + (totalCount === 1 ? "" : "s") + "</span>" +
        '<span>Sorted by ' + escapeHtml(state.sortMode) + "</span>" +
        "</div>";

      bindControls(resultsRoot, state, render, baseUrl);
    }

    function render() {
      syncClearButton();
      syncUrl(baseUrl, state);
      renderResults();
    }

    clearButton.addEventListener("click", function () {
      input.value = "";
      state.query = "";
      render();
      input.focus();
    });

    input.addEventListener("input", function () {
      state.query = input.value.trim();
      render();
    });

    resultsRoot.innerHTML =
      '<div class="search-page-empty"><strong>Loading search index.</strong><span>Pulling together pieces, topics, and sections...</span></div>';

    fetch(searchIndexUrl, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load search index.");
        }

        return response.json();
      })
      .then(function (data) {
        state.pieces = buildPieces(data);
        state.topics = buildTopics(state.pieces);
        state.pieceFuse = window.Fuse ? new window.Fuse(state.pieces, PIECE_FUSE_CONFIG) : null;
        state.topicFuse = window.Fuse ? new window.Fuse(state.topics, TOPIC_FUSE_CONFIG) : null;
        render();
        maybeWarmSections();
      })
      .catch(function (error) {
        resultsRoot.innerHTML =
          '<div class="search-page-empty"><strong>Search is unavailable.</strong><span>' +
          escapeHtml(error && error.message ? error.message : "Could not load the search index.") +
          "</span></div>";
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(ROOT_SELECTOR).forEach(initRichSearchPage);
  });
})();
