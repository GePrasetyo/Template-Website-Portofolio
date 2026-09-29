/* Comic theme: slanted panel edges. No dependencies.
   Each .panel is clipped to a slightly skewed quad and gets an SVG ink stroke drawn on top.
   Presets are corner insets as multipliers:
     x insets scale with panel height (vertical edges lean ~2°),
     y insets scale with panel width  (horizontal edges tilt ~1°).
   Shapes are picked per row so the gutter between neighbours stays parallel: a row starts with
   a or c, continues with middles and ends with b or d, e.g. a|b  c|d  a|m2|d  c|m1|b  c|m1|m2|d.
   A panel alone in its row is w or w2. Consecutive rows alternate between the two families.  */
(function () {
  'use strict';

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
  /* The right edge of a and m1 matches the left edge of m2 and b; the right edge of c and m2
     matches m1 and d. Each entry is [the next panel if it's a middle one, if it's the last one]. */
  var NEXT = { a: ['m2', 'b'], m1: ['m2', 'b'], c: ['m1', 'd'], m2: ['m1', 'd'] };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  function rowShapes(count, flip) {
    if (count === 1) { return [flip ? 'w2' : 'w']; }
    var shapes = [flip ? 'c' : 'a'];
    for (var k = 1; k < count; k++) { shapes.push(NEXT[shapes[k - 1]][k === count - 1 ? 1 : 0]); }
    return shapes;
  }

  function layout(el) {
    var p = el.__cutPreset;
    var w = el.clientWidth, h = el.clientHeight;
    if (!p || !w || !h) { return; }
    var vx = clamp(h * V, MIN_V, MAX_V), hy = clamp(w * H, MIN_H, MAX_H);
    var pts = [
      [p[0] * vx,     p[1] * hy],
      [w - p[2] * vx, p[3] * hy],
      [w - p[4] * vx, h - p[5] * hy],
      [p[6] * vx,     h - p[7] * hy]
    ].map(function (q) { return [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]; });
    el.style.clipPath = 'polygon(' + pts.map(function (q) { return q[0] + 'px ' + q[1] + 'px'; }).join(', ') + ')';
    el.__cutPoly.setAttribute('points', pts.map(function (q) { return q[0] + ',' + q[1]; }).join(' '));
  }

  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  /* Panels that share a parent and a top edge form a row. */
  function assignShapes() {
    var rows = [], row = null;
    panels.forEach(function (el) {
      if (row && el.parentNode === row[0].parentNode && Math.abs(el.offsetTop - row[0].offsetTop) < 4) {
        row.push(el);
      } else {
        row = [el];
        rows.push(row);
      }
    });
    var singles = 0, groups = 0;
    rows.forEach(function (r) {
      var flip = (r.length === 1 ? singles++ : groups++) % 2 === 1;
      rowShapes(r.length, flip).forEach(function (key, k) { r[k].__cutPreset = PRESETS[key]; });
    });
  }
  function relayout() {
    assignShapes();
    panels.forEach(layout);
  }

  /* Phones get plain rectangles (the CSS border fallback). Cuts only from 701px up. */
  var phone = window.matchMedia('(max-width: 700px)');
  var ro = ('ResizeObserver' in window) ? new ResizeObserver(function (entries) {
    entries.forEach(function (en) { if (en.target.__cutPoly) { layout(en.target); } });
  }) : null;

  function enableCuts() {
    panels.forEach(function (el) {
      if (!el.__cutPoly) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'panel-border');
        svg.setAttribute('aria-hidden', 'true');
        el.__cutPoly = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'polygon'));
        el.__cutSvg = el.appendChild(svg);
      }
      el.classList.add('has-cut');
    });
    relayout();
    if (ro) { panels.forEach(function (el) { ro.observe(el); }); }
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
  /* Rows re-form when the window width changes, e.g. three cards per row become two. */
  window.addEventListener('resize', function () { if (!phone.matches) { relayout(); } });
})();
