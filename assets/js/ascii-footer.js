(function () {
  const pre = document.querySelector('.ascii-footer');
  if (!pre) return;

  const raw = pre.textContent;
  const TIERS = 9;
  const FOOTER_ROOT_MARGIN = '240px 0px';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let isHydrated = false;
  let isVisible = false;
  let isRunning = false;
  let timerId = null;
  let current = 0;
  let phase = 'up';

  function tierOf(ch) {
    if (ch === '.') return 0;
    if (ch === '-') return 1;
    if (ch === ':') return 2;
    if (ch === ';') return 3;
    if (ch === '+') return 4;
    if (ch === 'x') return 5;
    if (ch === 'X') return 6;
    if (ch === '$') return 7;
    if (ch === '&') return 8;
    return -1;
  }

  function clearTimer() {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  }

  function queueNext(delay) {
    clearTimer();
    timerId = window.setTimeout(tick, delay);
  }

  function hydrate() {
    if (isHydrated) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < raw.length;) {
      const tier = tierOf(raw[i]);
      let end = i + 1;

      while (end < raw.length && tierOf(raw[end]) === tier) {
        end++;
      }

      const chunk = raw.slice(i, end);

      if (tier === -1) {
        fragment.appendChild(document.createTextNode(chunk));
      } else {
        const span = document.createElement('span');
        span.className = 't' + tier;
        span.textContent = chunk;
        fragment.appendChild(span);
      }

      i = end;
    }

    pre.textContent = '';
    pre.appendChild(fragment);
    isHydrated = true;
  }

  function resetAnimation() {
    clearTimer();
    for (let i = 0; i < TIERS; i++) {
      pre.classList.remove('hl-' + i);
    }
    current = 0;
    phase = 'up';
    isRunning = false;
  }

  function tick() {
    if (!isRunning) return;

    if (phase === 'up') {
      pre.classList.add('hl-' + current);
      current++;

      if (current >= TIERS) {
        phase = 'hold';
        queueNext(2800);
      } else {
        queueNext(580);
      }
      return;
    }

    if (phase === 'hold') {
      phase = 'down';
      current = 0;
      queueNext(450);
      return;
    }

    if (phase === 'down') {
      pre.classList.remove('hl-' + current);
      current++;

      if (current >= TIERS) {
        phase = 'pause';
        queueNext(800);
      } else {
        queueNext(500);
      }
      return;
    }

    phase = 'up';
    current = 0;
    queueNext(580);
  }

  function syncPlayback() {
    if (reducedMotion.matches) {
      resetAnimation();
      return;
    }

    if (!isVisible || document.hidden) {
      clearTimer();
      isRunning = false;
      return;
    }

    hydrate();

    if (!isRunning) {
      isRunning = true;
      queueNext(120);
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        isVisible = entries.some(function (entry) {
          return entry.isIntersecting;
        });

        if (isVisible) {
          hydrate();
        }

        syncPlayback();
      },
      { rootMargin: FOOTER_ROOT_MARGIN }
    );

    observer.observe(pre);
  } else {
    isVisible = true;
    hydrate();
    syncPlayback();
  }

  document.addEventListener('visibilitychange', syncPlayback);

  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', syncPlayback);
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(syncPlayback);
  }
})();
