(function () {
  const pre = document.querySelector('.ascii-footer');
  if (!pre) return;

  const raw = pre.textContent;
  const TIERS = 9;

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

  var html = '';
  for (var i = 0; i < raw.length; i++) {
    var ch = raw[i];
    var t = tierOf(ch);
    if (t >= 0) {
      var safe = ch === '&' ? '&amp;' : ch;
      html += '<span class="t' + t + '">' + safe + '</span>';
    } else {
      html += ch;
    }
  }
  pre.innerHTML = html;

  var current = 0;
  var phase = 'up';

  function tick() {
    if (phase === 'up') {
      pre.classList.add('hl-' + current);
      current++;
      if (current >= TIERS) {
        phase = 'hold';
        setTimeout(tick, 2800);
      } else {
        setTimeout(tick, 580);
      }
    } else if (phase === 'hold') {
      phase = 'down';
      current = 0;
      setTimeout(tick, 450);
    } else if (phase === 'down') {
      pre.classList.remove('hl-' + current);
      current++;
      if (current >= TIERS) {
        phase = 'pause';
        setTimeout(tick, 800);
      } else {
        setTimeout(tick, 500);
      }
    } else {
      phase = 'up';
      current = 0;
      setTimeout(tick, 580);
    }
  }

  tick();
})();
