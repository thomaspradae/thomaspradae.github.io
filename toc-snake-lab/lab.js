(() => {
  const labConfig = window.TOC_SNAKE_LAB || {};
  const variantName = labConfig.variant || "current";
  const lengthName = labConfig.length || "normal";

  const variants = {
    current: {
      title: "Current production-style snake",
      blurb: "This is the closest recreation of the current rail: segmented snake pieces, live item measurements, and the same visual model you already have.",
      risk: "No change. Baseline reference.",
      watch: "Watch for the tiny not-quite-buttery feeling when you scroll continuously."
    },
    tuned: {
      title: "Low-risk tuned current snake",
      blurb: "Same segmented snake idea, but with cached TOC item geometry and a slightly softer response curve. Architecture stays basically the same.",
      risk: "Low risk. Still your current mechanism.",
      watch: "Feels a little calmer without visually abandoning the current style."
    },
    single: {
      title: "Medium upgrade: single snake element",
      blurb: "This keeps the look of the rail but swaps the mechanism. One real snake element moves with transform instead of many tiny per-item slices.",
      risk: "Medium risk. Same vibe, different rendering model.",
      watch: "Usually reads smoother because the browser is moving one thing instead of many."
    },
    spring: {
      title: "Biggest in-house change: spring snake",
      blurb: "Single snake element plus spring smoothing. This is the most obviously buttery option without bringing in an external animation library.",
      risk: "Higher than the other demos, but still self-contained.",
      watch: "The motion is the smoothest, but it is also the furthest from the exact current implementation."
    }
  };

  const lengthProfiles = {
    short: {
      label: "Short article",
      blurb: "A compact post where the snake should stay taller because the viewport covers a larger share of the article."
    },
    normal: {
      label: "Normal article",
      blurb: "The baseline fake-post length used for the original comparison pages."
    },
    long: {
      label: "Long article",
      blurb: "A stretched post where the snake should become noticeably shorter because it represents a smaller share of the full article."
    }
  };

  const profile = variants[variantName];
  const lengthProfile = lengthProfiles[lengthName] || lengthProfiles.normal;
  const app = document.getElementById("app");
  if (!app || !profile) return;

  const baseSections = [
    {
      level: 2,
      title: "Shannon Entropy",
      paragraphs: [
        "Entropy is the canonical \"how surprised am I\" quantity. The point of this lab is not the math itself, but using a real-note-like structure so the TOC rail is tested against something that reads like one of your actual long posts instead of a sterile prototype.",
        "Long paragraphs, stacked sections, a figure break, a blockquote, and a right gutter together make the page feel closer to the real post experience, which is what matters if you are judging motion quality."
      ]
    },
    {
      level: 3,
      title: "Bernoulli Intuition",
      paragraphs: [
        "A fair coin feels maximally uncertain; a coin that lands heads ninety-nine percent of the time barely surprises you. That change in uncertainty is useful here because the same thing happens visually: some motion feels informative, some motion just feels noisy."
      ]
    },
    {
      level: 2,
      title: "Cross-Entropy",
      paragraphs: [
        "Cross-entropy is what you feel when the model's guess and the world's actual outcome do not line up. In UI terms, that is roughly the sensation of your eye expecting smooth continuation and instead catching a tiny discontinuity.",
        "That is why these pages preserve the same editorial skeleton: if the motion changes but the page proportions also change, your eye can no longer tell which factor is really responsible."
      ]
    },
    {
      level: 3,
      title: "Numerical Hygiene",
      paragraphs: [
        "Good implementation details matter when the visual difference is subtle. A tiny motion system can feel weird not because the idea is wrong, but because the browser is doing a little more work than it wants to during scroll."
      ]
    },
    {
      level: 2,
      title: "KL Divergence",
      paragraphs: [
        "The current snake is clever because it looks like one thing, but underneath it behaves like many tiny overlaps. That can still work well, but if you want the rail to feel more continuous, changing the underlying model may matter more than changing the duration from eighty milliseconds to one hundred and twenty.",
        "That is the main reason the medium-upgrade page exists in this lab."
      ]
    },
    {
      level: 3,
      title: "Figure Break",
      paragraphs: [
        "A fake media block helps create the same cadence shift your real pages get from screenshots, diagrams, or code. If the snake only feels smooth in uninterrupted text, that is not a good enough test."
      ]
    },
    {
      level: 2,
      title: "Mutual Information",
      paragraphs: [
        "A nice demo tells you something useful about the real thing. The more this page resembles the current post layout, the more trustworthy your reaction to each snake variant becomes.",
        "That is the whole point of bringing the real post classes, metadata row, TOC rail proportions, and note gutter into the experiment."
      ]
    },
    {
      level: 3,
      title: "Implementation Cost",
      paragraphs: [
        "A low-risk pass is mostly timing and caching. A medium-risk pass changes the mechanism but keeps the aesthetic. The spring version is still small enough to own, though it is definitely the most bespoke."
      ]
    },
    {
      level: 2,
      title: "Why This Matters",
      paragraphs: [
        "The best outcome here is not necessarily the most ambitious one. If the tuned-current page already fixes the thing that bothers you, then you keep the current concept and move on. If it still feels slightly crunchy, the single-element version is the strongest next step."
      ]
    },
    {
      level: 3,
      title: "Closing Thought",
      paragraphs: [
        "This lab is here so you do not have to decide from abstractions. Open the four pages, scroll them, and trust the version your eye keeps wanting to stay on."
      ]
    }
  ];

  function buildSectionsForLength() {
    if (lengthName === "short") {
      return baseSections.slice(0, 4).map((section) => ({
        ...section,
        paragraphs: section.paragraphs.slice(0, 1)
      }));
    }

    if (lengthName === "long") {
      const passes = [
        { suffix: "", extra: "" },
        { suffix: " II", extra: " This extra pass intentionally stretches the post so the viewport represents a much smaller fraction of the article." },
        { suffix: " III", extra: " If the single-snake model is behaving correctly, the bar should now be clearly shorter than in the short-page version." },
        { suffix: " IV", extra: " This final pass is just there to make the article very long instead of merely a bit longer than normal." }
      ];

      return passes.flatMap((pass) => baseSections.map((section) => ({
        ...section,
        title: `${section.title}${pass.suffix}`,
        paragraphs: section.paragraphs.map((paragraph, index) => (
          index === section.paragraphs.length - 1
            ? `${paragraph}${pass.extra}`
            : paragraph
        ))
      })));
    }

    return baseSections;
  }

  const sections = buildSectionsForLength();

  const topbarLinks = [
    { href: "./index.html", label: "Lab Home" },
    { href: "./current.html", label: "Current", key: "current" },
    { href: "./tuned.html", label: "Low-Risk", key: "tuned" },
    { href: "./single.html", label: "Medium", key: "single" },
    { href: "./spring.html", label: "Max Smooth", key: "spring" }
  ];

  function slugifyTOC(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function tocWordCount(text) {
    const match = text.trim().match(/\b[\p{L}\p{N}_']+\b/gu);
    return match ? match.length : 0;
  }

  function buildSectionModel(article) {
    const built = [];
    const pageTitleEl = document.querySelector("#main .post-top .page-title");

    if (pageTitleEl) {
      if (!pageTitleEl.id) pageTitleEl.id = "page-title";
      built.push({
        id: pageTitleEl.id,
        title: pageTitleEl.textContent.trim(),
        level: 1,
        wc: 1
      });
    }

    const all = Array.from(article.children);
    const headings = all.filter((el) => /^H[2-6]$/.test(el.tagName));
    if (!headings.length) return built;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1), 10);
      const title = heading.textContent.trim();

      if (!heading.id) {
        const base = slugifyTOC(title) || "section";
        let id = base;
        let i = 1;
        while (document.getElementById(id)) id = `${base}-${i++}`;
        heading.id = id;
      }

      const startIndex = all.indexOf(heading);
      const nextHeading = headings[index + 1];
      const endIndex = nextHeading ? all.indexOf(nextHeading) : all.length;

      let textForCount = `${title} `;
      for (let i = startIndex + 1; i < endIndex; i += 1) {
        textForCount += `${all[i].textContent || ""} `;
      }

      built.push({
        id: heading.id,
        title,
        level,
        wc: tocWordCount(textForCount)
      });
    });

    return built;
  }

  function createTOCList(sectionModel) {
    const list = document.createElement("ul");
    list.className = "toc-list";

    sectionModel.forEach((section, index) => {
      const li = document.createElement("li");
      li.className = `toc-item toc-level-${section.level}`;
      li.dataset.target = section.id;

      if (index === 0) {
        li.classList.add("toc-title-item");
      } else {
        li.style.flexGrow = String(Math.max(1, section.wc));
        li.style.flexBasis = "0px";
      }

      const link = document.createElement("a");
      link.href = `#${section.id}`;
      link.textContent = section.title || `Section ${index + 1}`;

      link.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById(section.id)?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });

      li.appendChild(link);
      li.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;
        document.getElementById(section.id)?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });

      list.appendChild(li);
    });

    return list;
  }

  function renderArticleSections() {
    const intro = `
      <div class="lab-variant-callout">
        <strong>${profile.title}</strong>
        <p>${profile.blurb}</p>
        <p><strong>Article size:</strong> ${lengthProfile.label}. ${lengthProfile.blurb}</p>
      </div>
      <p>
        This is not meant to be “real content.” It is a controlled fake post so the left rail has
        realistic proportions, a long scroll runway, and enough headings to make the comparison worth
        looking at.
      </p>
    `;

    const blocks = sections.map((section, index) => {
      const heading = `<h${section.level}>${section.title}</h${section.level}>`;
      const paragraphs = section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");

      if (index === 5) {
        return `
          ${heading}
          ${paragraphs}
          <div class="lab-demo-figure" role="img" aria-label="Abstract placeholder figure"></div>
          <p class="lab-demo-caption"><em>Figure stand-in: just enough texture so the fake page feels like a real post with media.</em></p>
        `;
      }

      if (index === 7) {
        return `
          ${heading}
          ${paragraphs}
          <blockquote>
            <p>The right implementation is the one whose smoothness survives repeated scrolling, not the one that sounds nicest in theory.</p>
          </blockquote>
        `;
      }

      return `${heading}${paragraphs}`;
    }).join("");

    return `${intro}${blocks}`;
  }

  function renderTopbar() {
    const links = topbarLinks.map((item) => {
      const isActive = item.key === variantName;
      return `<a class="lab-topbar-link${isActive ? " is-active" : ""}" href="${item.href}">${item.label}</a>`;
    }).join("");

    const lengthLinks = variantName === "single" ? `
      <div class="lab-topbar-subrow">
        <nav class="lab-topbar-links" aria-label="Single snake article lengths">
          <a class="lab-topbar-link${lengthName === "normal" ? " is-active" : ""}" href="./single.html">Single / Normal</a>
          <a class="lab-topbar-link${lengthName === "short" ? " is-active" : ""}" href="./single-short.html">Single / Short</a>
          <a class="lab-topbar-link${lengthName === "long" ? " is-active" : ""}" href="./single-long.html">Single / Long</a>
        </nav>
      </div>
    ` : "";

    return `
      <header class="lab-topbar">
        <div class="lab-topbar-inner">
          <div class="lab-topbar-brand">Snake Comparison Lab</div>
          <nav class="lab-topbar-links" aria-label="Snake comparison pages">
            ${links}
          </nav>
        </div>
        ${lengthLinks}
      </header>
    `;
  }

  function renderShell() {
    app.innerHTML = `
      ${renderTopbar()}
      <main class="content">
        <section class="post-wrapper">
          <div class="post-outer">
            <div class="post-stage">
              <nav id="left-toc" class="left-toc" aria-label="Table of contents">
                <div class="toc-rail">
                  <div class="lab-snake" aria-hidden="true"></div>
                  <div class="lab-gap-layer" aria-hidden="true"></div>
                  <div class="toc-inner"></div>
                </div>
              </nav>

              <div id="main" class="post">
                <div class="post-top">
                  <div class="post-header">
                    <div class="post-meta-container">
                      <div class="post-meta-container-left-side">
                        <section class="breadcrumbs">
                          <a href="./index.html">← Back to snake lab</a>
                        </section>
                      </div>

                      <div class="post-meta-container-right-side archive-topnav js-post-nav">
                        <a href="./index.html" class="archive-topnav-link">Lab</a>
                        <a href="./index.html" class="archive-nav-trigger" aria-expanded="false">Nav</a>
                        <div class="archive-nav-overlay" aria-hidden="true">
                          <nav class="archive-nav-panel home-nav" aria-label="Site navigation">
                            <ul class="home-nav-list archive-nav-list">
                              <li class="home-nav-item">
                                <a class="home-nav-link home-nav-link--icon" href="./index.html">
                                  <span class="home-nav-icon" style="--icon-url: url('./assets/images/resources/home.png');" aria-hidden="true"></span>
                                  <span class="home-nav-label">Lab Home</span>
                                </a>
                              </li>
                              <li class="home-nav-item">
                                <a class="home-nav-link home-nav-link--icon" href="./current.html">
                                  <span class="home-nav-icon" style="--icon-url: url('./assets/images/resources/notes.png');" aria-hidden="true"></span>
                                  <span class="home-nav-label">Current</span>
                                </a>
                              </li>
                              <li class="home-nav-item">
                                <a class="home-nav-link home-nav-link--icon" href="./tuned.html">
                                  <span class="home-nav-icon" style="--icon-url: url('./assets/images/resources/building.png');" aria-hidden="true"></span>
                                  <span class="home-nav-label">Low-Risk</span>
                                </a>
                              </li>
                              <li class="home-nav-item">
                                <a class="home-nav-link home-nav-link--icon" href="./single.html">
                                  <span class="home-nav-icon" style="--icon-url: url('./assets/images/resources/writing.png');" aria-hidden="true"></span>
                                  <span class="home-nav-label">Medium</span>
                                </a>
                              </li>
                              <li class="home-nav-item">
                                <a class="home-nav-link home-nav-link--icon" href="./spring.html">
                                  <span class="home-nav-icon" style="--icon-url: url('./assets/images/resources/marginalia.png');" aria-hidden="true"></span>
                                  <span class="home-nav-label">Max Smooth</span>
                                </a>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      </div>

                      <div class="mobile-post-menu-shell" aria-hidden="true">
                        <button
                          type="button"
                          class="mobile-post-menu-toggle"
                          aria-label="Open post menu"
                          aria-controls="mobile-post-menu-panel"
                          aria-expanded="false">
                          <span class="mobile-post-menu-dot"></span>
                          <span class="mobile-post-menu-dot"></span>
                          <span class="mobile-post-menu-dot"></span>
                        </button>

                        <div class="mobile-post-menu-backdrop" hidden></div>

                        <aside id="mobile-post-menu-panel" class="mobile-post-menu-panel" hidden aria-label="Post menu">
                          <div class="mobile-post-menu-panel-inner">
                            <div class="mobile-post-menu-label">Table of Contents</div>
                            <div class="mobile-post-menu-toc"></div>
                            <a class="mobile-post-menu-nav" href="./index.html">Lab</a>
                          </div>
                        </aside>
                      </div>
                    </div>
                  </div>

                  <div class="post-intro post">
                    <article class="post-body">
                      <h1 class="page-title">TOC snake comparison demo</h1>
                    </article>
                  </div>

                  <div class="post-metadata">
                    <div class="meta">
                      <div class="post-meta-row">
                        <div class="post-meta-date">
                          <p class="meta-label">published</p>
                          <time class="date-post" datetime="2026-04-05">April 5, 2026</time>
                        </div>

                        <div class="post-meta-last-modified">
                          <p class="meta-label">variant</p>
                          <time class="date-post date-post-mono">${profile.title} / ${lengthProfile.label}</time>
                        </div>

                        <div class="post-meta-tags">
                          <p class="meta-label">tags</p>
                          <div class="tags-holder">
                            <a class="internal-link tag-pill tag-pill--notes" href="#">
                              <span class="tag-pill-dot"></span>
                              <span class="tag-pill-label">notes</span>
                            </a>
                            <a class="internal-link tag-pill tag-pill--animation" href="#">
                              <span class="tag-pill-dot"></span>
                              <span class="tag-pill-label">animation</span>
                            </a>
                            <a class="internal-link tag-pill tag-pill--prototype" href="#">
                              <span class="tag-pill-dot"></span>
                              <span class="tag-pill-label">prototype</span>
                            </a>
                            <a class="internal-link tag-pill tag-pill--performance" href="#">
                              <span class="tag-pill-dot"></span>
                              <span class="tag-pill-label">performance</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div class="post-meta-section">
                        <p class="meta-label">type</p>
                        <p class="post-meta-section-text">
                          <a class="post-meta-section-link" href="./index.html">
                            <span class="post-meta-section-chip">
                              <img
                                src="./assets/images/resources/normalized/16/notes.png"
                                alt=""
                                class="post-meta-section-icon"
                                aria-hidden="true">
                              <span>Lab</span>
                            </span>
                          </a>
                        </p>
                      </div>
                    </div>

                    <div class="post-meta-mobile">
                      <div class="post-meta-mobile-row">
                        <div class="post-meta-date">
                          <p class="meta-label">published</p>
                          <time class="date-post" datetime="2026-04-05">April 5, 2026</time>
                        </div>

                        <div class="post-meta-last-modified">
                          <p class="meta-label">variant</p>
                          <time class="date-post date-post-mono">${profile.title} / ${lengthProfile.label}</time>
                        </div>

                        <div class="post-meta-section">
                          <p class="meta-label">type</p>
                          <p class="post-meta-section-text">
                            <a class="post-meta-section-link" href="./index.html">
                              <span class="post-meta-section-chip">
                                <img
                                  src="./assets/images/resources/normalized/16/notes.png"
                                  alt=""
                                  class="post-meta-section-icon"
                                  aria-hidden="true">
                                <span>Lab</span>
                              </span>
                            </a>
                          </p>
                        </div>
                      </div>

                      <div class="post-meta-tags">
                        <p class="meta-label">tags</p>
                        <div class="tags-holder">
                          <a class="internal-link tag-pill tag-pill--notes" href="#">
                            <span class="tag-pill-dot"></span>
                            <span class="tag-pill-label">notes</span>
                          </a>
                          <a class="internal-link tag-pill tag-pill--animation" href="#">
                            <span class="tag-pill-dot"></span>
                            <span class="tag-pill-label">animation</span>
                          </a>
                          <a class="internal-link tag-pill tag-pill--prototype" href="#">
                            <span class="tag-pill-dot"></span>
                            <span class="tag-pill-label">prototype</span>
                          </a>
                          <a class="internal-link tag-pill tag-pill--performance" href="#">
                            <span class="tag-pill-dot"></span>
                            <span class="tag-pill-label">performance</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <article class="post-body post-body-content">
                  ${renderArticleSections()}

                  <nav class="post-nav" aria-label="Post navigation">
                    <div class="post-nav-prev">
                      <a href="./index.html" class="post-nav-link">lab home</a>
                    </div>
                    <div class="post-nav-center">
                      <a href="#" class="post-nav-link" onclick="window.scrollTo({top:0,behavior:'smooth'}); return false;">back to top</a>
                    </div>
                    <div class="post-nav-next">
                      <a href="./spring.html" class="post-nav-link">last demo</a>
                    </div>
                  </nav>
                </article>
              </div>

              <aside class="right-gutter" aria-label="Notes">
                <div class="right-gutter-inner">
                  <div class="lab-gutter-title">Lab Notes</div>

                  <div class="gutter-note">
                    <div class="gutter-note-inner">
                      <div class="gutter-note-number">1</div>
                      <div class="gutter-note-body">
                        <p><strong>Variant</strong>: ${profile.title}</p>
                      </div>
                    </div>
                  </div>

                  <div class="gutter-note">
                    <div class="gutter-note-inner">
                      <div class="gutter-note-number">2</div>
                      <div class="gutter-note-body">
                        <p><strong>Article size</strong>: ${lengthProfile.label}</p>
                      </div>
                    </div>
                  </div>

                  <div class="gutter-note">
                    <div class="gutter-note-inner">
                      <div class="gutter-note-number">3</div>
                      <div class="gutter-note-body">
                        <p><strong>Watch for</strong>: ${profile.watch}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  function buildPageTOC() {
    const tocContainer = document.querySelector("#left-toc .toc-inner");
    const article = document.querySelector("#main .post-body-content");
    if (!tocContainer || !article) return [];

    const sectionModel = buildSectionModel(article);
    tocContainer.innerHTML = "";
    tocContainer.appendChild(createTOCList(sectionModel));
    return sectionModel;
  }

  function createState() {
    return {
      toc: document.querySelector("#left-toc.left-toc"),
      rail: document.querySelector("#left-toc.left-toc .toc-rail"),
      main: document.querySelector("#main.post"),
      article: document.querySelector("#main.post .post-body-content"),
      title: document.querySelector(".page-title"),
      snake: document.querySelector(".lab-snake"),
      gapLayer: document.querySelector(".lab-gap-layer"),
      tocItemEls: Array.from(document.querySelectorAll("#left-toc .toc-item")),
      cachedMetrics: [],
      hasScrolledOnce: false,
      updateRAF: null,
      settleRAF: null,
      targetTop: 0,
      currentTop: 0,
      targetHeight: 20,
      currentHeight: 20,
      topVelocity: 0,
      heightVelocity: 0
    };
  }

  function updateTOCState(state) {
    const body = document.body;

    if (!state.hasScrolledOnce && (window.scrollY || document.documentElement.scrollTop) > 6) {
      state.hasScrolledOnce = true;
    }

    body.classList.toggle("toc-open", !state.hasScrolledOnce);
    body.classList.toggle("toc-collapsed", state.hasScrolledOnce);

    if (state.title) {
      const rect = state.title.getBoundingClientRect();
      const titleFullyGone = rect.bottom <= 0;
      body.classList.toggle("title-hidden", !titleFullyGone);
      body.classList.toggle("title-toc-visible", titleFullyGone);
    } else {
      body.classList.remove("title-hidden");
      body.classList.remove("title-toc-visible");
    }
  }

  function updateActiveLink(state) {
    if (!state.toc || !state.article) return;

    const headings = Array.from(state.article.querySelectorAll("h2, h3, h4, h5, h6")).filter((heading) => heading.id);
    if (!headings.length) return;

    const probeY = window.scrollY + 140;
    let active = null;

    for (const heading of headings) {
      const top = heading.getBoundingClientRect().top + window.scrollY;
      if (top <= probeY) active = heading;
      else break;
    }

    state.toc.querySelectorAll("a.toc-active").forEach((link) => link.classList.remove("toc-active"));
    if (!active) return;

    const link = state.toc.querySelector(`a[href="#${CSS.escape(active.id)}"]`);
    if (link) link.classList.add("toc-active");
  }

  function computeSnakeTarget(state) {
    if (!state.rail || !state.main) return null;

    const railRect = state.rail.getBoundingClientRect();
    const railHeight = railRect.height;
    const articleHeight = state.main.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const mainRect = state.main.getBoundingClientRect();
    const articleTop = mainRect.top + scrollY;
    const scrollStart = articleTop;
    const scrollEnd = articleTop + articleHeight - viewportHeight;
    const scrollRange = Math.max(1, scrollEnd - scrollStart);

    const snakeHeight = Math.min(
      railHeight,
      Math.max(20, (viewportHeight / Math.max(1, articleHeight)) * railHeight)
    );

    const maxTop = Math.max(0, railHeight - snakeHeight);
    const progress = Math.max(0, Math.min(1, (scrollY - scrollStart) / scrollRange));

    return {
      railRect,
      snakeTop: progress * maxTop,
      snakeHeight
    };
  }

  function measureCachedMetrics(state) {
    if (!state.rail || !state.tocItemEls.length) return;
    const railTop = state.rail.getBoundingClientRect().top;

    state.cachedMetrics = state.tocItemEls.map((element) => {
      const rect = element.getBoundingClientRect();
      const top = rect.top - railTop;
      const height = rect.height;

      return {
        element,
        top,
        bottom: top + height,
        height
      };
    });
  }

  function renderGapCovers(state) {
    if (!state.gapLayer || !state.rail) return;

    state.gapLayer.innerHTML = "";
    if (variantName !== "single" && variantName !== "spring") return;
    if (!state.cachedMetrics.length) return;

    const railHeight = state.rail.getBoundingClientRect().height;
    const covers = [];

    const first = state.cachedMetrics[0];
    if (first.top > 0) {
      covers.push({ top: 0, height: first.top });
    }

    for (let i = 0; i < state.cachedMetrics.length - 1; i += 1) {
      const current = state.cachedMetrics[i];
      const next = state.cachedMetrics[i + 1];
      const gapHeight = next.top - current.bottom;

      if (gapHeight > 0) {
        covers.push({ top: current.bottom, height: gapHeight });
      }
    }

    const last = state.cachedMetrics[state.cachedMetrics.length - 1];
    if (last.bottom < railHeight) {
      covers.push({ top: last.bottom, height: railHeight - last.bottom });
    }

    covers.forEach((cover) => {
      const element = document.createElement("div");
      element.className = "lab-gap-cover";
      element.style.top = `${cover.top}px`;
      element.style.height = `${cover.height}px`;
      state.gapLayer.appendChild(element);
    });
  }

  function applyPerItemSnakeLive(state, target) {
    for (const element of state.tocItemEls) {
      const rect = element.getBoundingClientRect();
      const itemTop = rect.top - target.railRect.top;
      const itemBottom = rect.bottom - target.railRect.top;
      const overlapTop = Math.max(itemTop, target.snakeTop);
      const overlapBottom = Math.min(itemBottom, target.snakeTop + target.snakeHeight);
      const overlapHeight = Math.max(0, overlapBottom - overlapTop);

      if (overlapHeight <= 0) {
        element.style.setProperty("--snake-h", "0px");
        continue;
      }

      element.style.setProperty("--snake-top", `${overlapTop - itemTop}px`);
      element.style.setProperty("--snake-h", `${overlapHeight}px`);
    }
  }

  function applyPerItemSnakeCached(state, snakeTop, snakeHeight) {
    state.cachedMetrics.forEach((metric) => {
      const overlapTop = Math.max(metric.top, snakeTop);
      const overlapBottom = Math.min(metric.bottom, snakeTop + snakeHeight);
      const overlapHeight = Math.max(0, overlapBottom - overlapTop);

      if (overlapHeight <= 0) {
        metric.element.style.setProperty("--snake-h", "0px");
        return;
      }

      metric.element.style.setProperty("--snake-top", `${overlapTop - metric.top}px`);
      metric.element.style.setProperty("--snake-h", `${overlapHeight}px`);
    });
  }

  function applySingleSnake(state, snakeTop, snakeHeight) {
    if (!state.snake) return;
    state.snake.style.transform = `translateY(${snakeTop}px)`;
    state.snake.style.height = `${snakeHeight}px`;
  }

  function scheduleStateFrame(state, callback) {
    if (state.updateRAF) return;
    state.updateRAF = requestAnimationFrame(() => {
      state.updateRAF = null;
      updateTOCState(state);
      updateActiveLink(state);
      callback();
    });
  }

  function initCurrent(state) {
    const render = () => {
      const target = computeSnakeTarget(state);
      if (target) applyPerItemSnakeLive(state, target);
    };

    const onChange = () => scheduleStateFrame(state, render);
    onChange();
    return { onChange, onResize: onChange };
  }

  function initTuned(state) {
    const settle = () => {
      state.settleRAF = null;

      state.currentTop += (state.targetTop - state.currentTop) * 0.22;
      state.currentHeight += (state.targetHeight - state.currentHeight) * 0.22;
      applyPerItemSnakeCached(state, state.currentTop, state.currentHeight);

      const topDiff = Math.abs(state.targetTop - state.currentTop);
      const heightDiff = Math.abs(state.targetHeight - state.currentHeight);

      if (topDiff > 0.25 || heightDiff > 0.25) {
        state.settleRAF = requestAnimationFrame(settle);
      }
    };

    const render = () => {
      const target = computeSnakeTarget(state);
      if (!target) return;

      state.targetTop = target.snakeTop;
      state.targetHeight = target.snakeHeight;

      if (!state.cachedMetrics.length) {
        measureCachedMetrics(state);
        state.currentTop = state.targetTop;
        state.currentHeight = state.targetHeight;
      }

      if (!state.settleRAF) {
        state.settleRAF = requestAnimationFrame(settle);
      }
    };

    const onChange = () => scheduleStateFrame(state, render);
    const onResize = () => {
      measureCachedMetrics(state);
      renderGapCovers(state);
      onChange();
    };

    onResize();
    return { onChange, onResize };
  }

  function initSingle(state) {
    const render = () => {
      const target = computeSnakeTarget(state);
      if (target) applySingleSnake(state, target.snakeTop, target.snakeHeight);
    };

    const onChange = () => scheduleStateFrame(state, render);
    const onResize = () => {
      measureCachedMetrics(state);
      renderGapCovers(state);
      onChange();
    };

    onResize();
    return { onChange, onResize };
  }

  function initSpring(state) {
    const settle = () => {
      state.settleRAF = null;

      state.topVelocity = (state.topVelocity * 0.72) + ((state.targetTop - state.currentTop) * 0.16);
      state.heightVelocity = (state.heightVelocity * 0.72) + ((state.targetHeight - state.currentHeight) * 0.16);

      state.currentTop += state.topVelocity;
      state.currentHeight += state.heightVelocity;

      applySingleSnake(state, state.currentTop, state.currentHeight);

      const topDiff = Math.abs(state.targetTop - state.currentTop);
      const heightDiff = Math.abs(state.targetHeight - state.currentHeight);
      const velocity = Math.abs(state.topVelocity) + Math.abs(state.heightVelocity);

      if (topDiff > 0.18 || heightDiff > 0.18 || velocity > 0.18) {
        state.settleRAF = requestAnimationFrame(settle);
      } else {
        state.currentTop = state.targetTop;
        state.currentHeight = state.targetHeight;
        applySingleSnake(state, state.currentTop, state.currentHeight);
      }
    };

    const render = () => {
      const target = computeSnakeTarget(state);
      if (!target) return;

      state.targetTop = target.snakeTop;
      state.targetHeight = target.snakeHeight;

      if (!state.settleRAF && state.currentHeight === 20 && state.currentTop === 0) {
        state.currentTop = state.targetTop;
        state.currentHeight = state.targetHeight;
        applySingleSnake(state, state.currentTop, state.currentHeight);
      }

      if (!state.settleRAF) {
        state.settleRAF = requestAnimationFrame(settle);
      }
    };

    const onChange = () => scheduleStateFrame(state, render);
    const onResize = () => {
      measureCachedMetrics(state);
      renderGapCovers(state);
      onChange();
    };

    onResize();
    return { onChange, onResize };
  }

  function initVariant(state) {
    switch (variantName) {
      case "tuned":
        return initTuned(state);
      case "single":
        return initSingle(state);
      case "spring":
        return initSpring(state);
      case "current":
      default:
        return initCurrent(state);
    }
  }

  function bindObservers(state, controller) {
    const onScroll = () => controller.onChange();
    const onResize = () => controller.onResize();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    if (typeof ResizeObserver !== "undefined" && state.main) {
      const observer = new ResizeObserver(onResize);
      observer.observe(state.main);
    }
  }

  renderShell();
  buildPageTOC();
  const state = createState();
  const controller = initVariant(state);
  bindObservers(state, controller);
})();
