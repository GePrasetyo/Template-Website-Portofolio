/* Panel cuts, theme toggle, lite YouTube, scroll reveal. No dependencies. */
(function () {
  'use strict';

  /* ---- comic panel cuts -------------------------------------------
     Each .panel is clipped to a slightly skewed quad and gets an SVG
     ink stroke drawn on top. Presets are corner insets as multipliers:
       x insets scale with panel height (vertical edges lean ~2°),
       y insets scale with panel width  (horizontal edges tilt ~1°).
     Presets are designed in complementary pairs so the gutter between
     neighbours stays parallel:
       a|b   c|d   c|m1|b   c|m1|m2|d   a|m2|d   w, w2 = full width   */
  var V = 0.06, H = 0.02;              // tan(3.4°), tan(1.15°)
  var MIN_V = 8, MAX_V = 36, MIN_H = 4, MAX_H = 18;
  var PRESETS = {                      // [tlx,tly, trx,try, brx,bry, blx,bly]
    a:  [0,1,   0,0,   1,0,   0,0.8],
    b:  [1,0,   0,0.8, 0,0,   0,1  ],
    c:  [0,0,   1,1,   0,0,   0,0.8],
    d:  [0,0.8, 0,0,   0,1,   1,0  ],
    m1: [0,0.6, 0,0,   1,0,   1,1  ],
    m2: [1,0,   1,0.8, 0,0,   0,0.6],
    w:  [0,0.8, 0.7,0, 0,1,   0.9,0],
    w2: [0.9,0, 0,1,   0.7,0, 0,0.8]
  };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  function layout(el, p) {
    var w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) { return; }
    var vx = clamp(h * V, MIN_V, MAX_V), hy = clamp(w * H, MIN_H, MAX_H);
    var pts = [
      [p[0] * vx,     p[1] * hy],
      [w - p[2] * vx, p[3] * hy],
      [w - p[4] * vx, h - p[5] * hy],
      [p[6] * vx,     h - p[7] * hy]
    ].map(function (q) { return [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]; });
    el.style.clipPath = 'polygon(' + pts.map(function (q) { return q[0] + 'px ' + q[1] + 'px'; }).join(', ') + ')';
    var poly = el.__cutPoly;
    if (poly) {
      poly.setAttribute('points', pts.map(function (q) { return q[0] + ',' + q[1]; }).join(' '));
    }
  }

  var ORDER = ['a', 'b', 'c', 'd', 'm1', 'b'];
  var i = 0;
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  panels.forEach(function (el) {
    var key = el.getAttribute('data-cut');
    el.__cutPreset = PRESETS[key] || PRESETS[ORDER[i++ % ORDER.length]];
  });

  /* Phones get plain rectangles (the CSS border fallback). Cuts only from 701px up. */
  var phone = window.matchMedia('(max-width: 700px)');
  var ro = ('ResizeObserver' in window) ? new ResizeObserver(function (entries) {
    entries.forEach(function (en) { if (en.target.__cutPoly) { layout(en.target, en.target.__cutPreset); } });
  }) : null;

  function enableCuts() {
    panels.forEach(function (el) {
      if (!el.__cutPoly) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'panel-border');
        svg.setAttribute('aria-hidden', 'true');
        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        svg.appendChild(poly);
        el.appendChild(svg);
        el.__cutSvg = svg;
        el.__cutPoly = poly;
      }
      el.classList.add('has-cut');
      layout(el, el.__cutPreset);
      if (ro) { ro.observe(el); }
    });
  }
  function disableCuts() {
    panels.forEach(function (el) {
      el.style.clipPath = '';
      if (el.__cutSvg) { el.removeChild(el.__cutSvg); el.__cutSvg = null; el.__cutPoly = null; }
      el.classList.remove('has-cut');
      if (ro) { ro.unobserve(el); }
    });
  }
  function applyMode() { if (phone.matches) { disableCuts(); } else { enableCuts(); } }
  applyMode();
  if (phone.addEventListener) { phone.addEventListener('change', applyMode); }
  else if (phone.addListener) { phone.addListener(applyMode); }
  if (!ro) {
    window.addEventListener('resize', function () {
      if (!phone.matches) { panels.forEach(function (el) { layout(el, el.__cutPreset); }); }
    });
  }

  /* ---- theme toggle ---------------------------------------------- */
  var root = document.documentElement;
  function systemDark() { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
  function currentDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : systemDark();
  }
  document.querySelectorAll('.theme-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  /* ---- lite YouTube ---------------------------------------------- */
  document.querySelectorAll('.yt').forEach(function (box) {
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-label', 'Play video: ' + (box.getAttribute('data-title') || ''));
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); box.click(); }
    });
    box.addEventListener('click', function () {
      var id = box.getAttribute('data-id');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      f.title = box.getAttribute('data-title') || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
      box.style.cursor = 'default';
    }, { once: true });
  });

  /* ---- scroll reveal --------------------------------------------- */
  var items = document.querySelectorAll('.reveal');
  function showAll() { items.forEach(function (el) { el.classList.add('in'); }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    /* safety net: never leave content hidden if the observer misbehaves */
    setTimeout(showAll, 2500);
  } else {
    showAll();
  }
})();
