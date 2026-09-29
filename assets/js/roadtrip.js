/* ------------------------------------------------------------------
   Road Trip theme: the home page drives sideways. No dependencies.
   The page keeps scrolling down as normal (wheel, trackpad, keyboard, touch); this script turns
   that distance into travel and writes it as --p on .stage. All motion is CSS reading --p, so
   this file only measures and sets a few properties.

   It drives only when it can do it well: a screen at least 960 × 600, no reduced-motion
   preference, and the roadside items still readable when scaled to fit above the road. Otherwise
   the same markup stays a normal vertical page (.drive without .on) and the car becomes the trip
   strip at the bottom. Project pages always use the trip strip.

   window.themeRefresh.roadtrip() finds the page's parts again and re-measures; the editor's live
   preview (admin/preview.js) calls it after every redraw.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var MIN_W = 960, MIN_H = 600, MIN_Z = 0.6, MAX_Z = 1.12;
  var WHEEL = 0.78;   // the car's front wheel, as a share of its width from the back
  var rt, drive, stage, track, band, car, trip, route;   // this page's parts, see find()
  var on = false, travel = 0, driveTop = 0, lastP = 0, stopX = {}, moveTimer = 0, ticking = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function px(name) { return parseFloat(getComputedStyle(rt).getPropertyValue(name)) || 0; }
  function viewW() { return document.documentElement.clientWidth; }
  function item(id) { return id && track ? track.querySelector('#' + CSS.escape(id)) : null; }
  function smooth() { return reduce.matches ? 'auto' : 'smooth'; }
  /* false once the page is gone: the editor's preview swaps pages in place, even to another theme */
  function here() { return !!rt && rt.isConnected; }
  function driving() { return on && here(); }

  function find() {
    rt = document.querySelector('.rt');
    drive = rt && rt.querySelector('.drive');           // home page only
    stage = drive && drive.querySelector('.stage');
    track = drive && drive.querySelector('.track');
    band = rt && rt.querySelector('.scene-band');       // project pages
    car = rt && rt.querySelector('.scenery .car');
    trip = rt && rt.querySelector('.trip');
    route = rt && rt.querySelector('.route');
    on = false;
    stopX = {};
  }

  function setMode(v) {
    on = v;
    drive.classList.toggle('on', v);
    rt.classList.toggle('driving', v);
  }

  /* where the road should be when an item is "reached": its left edge a third into the screen */
  function reachX(el, trackLeft, vw) {
    if (el.classList.contains('start')) { return 0; }
    return clamp(el.getBoundingClientRect().left - trackLeft - vw * 0.36, 0, travel);
  }

  /* the finish line goes under the car's front wheel where the drive ends, on any screen width */
  function placeFlag(dest, trackLeft) {
    var flag = dest.querySelector('.flag');
    if (!flag || !car) { return; }
    var c = car.getBoundingClientRect(), f = flag.getBoundingClientRect();
    var destEnd = dest.getBoundingClientRect().left - trackLeft - travel;   // its left edge on screen then
    var z = parseFloat(rt.style.getPropertyValue('--z')) || 1;              // the flag's left is in zoomed px
    flag.style.left = ((c.left + c.width * WHEEL - f.width / 2 - destEnd) / z).toFixed(1) + 'px';
  }

  function layout() {
    if (!here()) { return; }
    if (!drive) { update(); return; }
    var vw = viewW(), vh = window.innerHeight;
    rt.style.setProperty('--stage-w', vw + 'px');
    rt.style.setProperty('--z', '1');
    rt.style.removeProperty('--band-h');

    setMode(!reduce.matches && vw >= MIN_W && vh >= MIN_H);

    if (on) {
      /* scale the roadside items so the tallest fits between the top bar and the road; if that
         would make them too small (a very tall item or a short screen), stay vertical */
      var room = vh - px('--stand') - px('--top-h') - 12, tallest = 0;
      Array.prototype.forEach.call(track.children, function (el) {
        if (!el.classList.contains('start')) { tallest = Math.max(tallest, el.getBoundingClientRect().height); }
      });
      var z = tallest ? Math.min(MAX_Z, room / tallest) : 1;
      if (z < MIN_Z) { setMode(false); }
      else { rt.style.setProperty('--z', z.toFixed(3)); }
    }

    if (on) {
      /* drive until the destination is in full view, but stop sooner on a narrow window, where
         going on would push its left edge off the screen */
      var trackLeft = track.getBoundingClientRect().left, dest = track.querySelector('.destination');
      travel = Math.max(0, track.scrollWidth - vw);
      if (dest) {
        travel = Math.min(travel, Math.max(0, dest.getBoundingClientRect().left - trackLeft - 24));
        placeFlag(dest, trackLeft);
      }
      drive.style.height = (travel + vh) + 'px';
      driveTop = drive.getBoundingClientRect().top + window.scrollY;
      stopX = {};
      rt.querySelectorAll('[data-target]').forEach(function (a) {
        var id = a.getAttribute('data-target'), el = item(id);
        if (!el) { return; }
        var x = reachX(el, trackLeft, vw);
        stopX[id] = x;
        if (a.classList.contains('stop')) { a.style.left = (travel ? (x / travel) * 100 : 0) + '%'; }
      });
      rt.querySelectorAll('[data-dist]').forEach(function (em) {
        var el = item(em.getAttribute('data-dist'));
        if (el) { em.textContent = Math.max(0.1, reachX(el, trackLeft, vw) / 1000).toFixed(1) + ' km'; }
      });
    } else {
      drive.style.height = '';
      travel = 0;
      stage.style.removeProperty('--p');
      if (route) { route.querySelectorAll('.stop').forEach(function (a) { a.style.left = ''; }); }
      /* the scenery band behind the hero grows with it, so text never sits on the road */
      var start = track.querySelector('.start');
      if (start && start.offsetHeight > px('--band-h')) { rt.style.setProperty('--band-h', start.offsetHeight + 'px'); }
    }
    update();
  }

  function moveCar(p) {
    if (!car || reduce.matches) { lastP = p; return; }
    if (p !== lastP) {
      car.classList.add('moving');
      car.classList.toggle('reverse', p < lastP);
      clearTimeout(moveTimer);
      moveTimer = setTimeout(function () { car.classList.remove('moving', 'reverse'); }, 160);
    }
    lastP = p;
  }

  function update() {
    ticking = false;
    if (!here()) { return; }
    var y = window.scrollY;
    if (on) {
      var p = clamp(y - driveTop, 0, travel);
      stage.style.setProperty('--p', p.toFixed(1));
      rt.style.setProperty('--prog', travel ? (p / travel).toFixed(4) : '0');
      stage.classList.toggle('started', p > 24);
      moveCar(p);
      if (route) {
        route.querySelectorAll('.stop').forEach(function (a) {
          var x = stopX[a.getAttribute('data-target')];
          a.classList.toggle('passed', x !== undefined && p + 2 >= x);
        });
      }
    } else {
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var read = clamp(y / max, 0, 1);
      if (!reduce.matches) {
        var drift = (y * 1.4).toFixed(1);   // the scenery band drifts sideways as you read
        if (stage) { stage.style.setProperty('--p', drift); }
        if (band) { band.style.setProperty('--p', drift); }
        moveCar(y * 1.4);
      }
      rt.style.setProperty('--prog', read.toFixed(4));
      if (trip) { trip.style.setProperty('--read', read.toFixed(4)); trip.style.setProperty('--rp', y.toFixed(1)); }
    }
  }

  function requestUpdate() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  function driveTo(id, behavior) {
    if (!driving() || !(id in stopX)) { return false; }
    window.scrollTo({ top: driveTop + stopX[id], behavior: behavior || smooth() });
    return true;
  }

  /* Listeners are bound once and work on whatever find() last picked up. */

  /* route stops, the Next stops sign and any #work / #contact link on the home page */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.rt a[href*="#"]');
    if (!a || !driving()) { return; }
    var id = a.getAttribute('data-target') || a.hash.slice(1);
    if (a.pathname !== location.pathname && !a.hasAttribute('data-target')) { return; }
    if (driveTo(id)) { e.preventDefault(); history.replaceState(null, '', '#' + id); }
  });

  /* sideways trackpad swipes drive too (and don't trigger the browser's back gesture) */
  window.addEventListener('wheel', function (e) {
    if (!driving() || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) { return; }
    e.preventDefault();
    window.scrollBy(0, e.deltaX);
  }, { passive: false });

  /* arrow keys left / right */
  document.addEventListener('keydown', function (e) {
    if (!driving() || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) { return; }
    var t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) { return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') { return; }
    e.preventDefault();
    window.scrollBy({ top: (e.key === 'ArrowRight' ? 1 : -1) * viewW() * 0.5, behavior: smooth() });
  });

  /* keyboard focus on something off screen: drive to it */
  document.addEventListener('focusin', function (e) {
    if (!driving() || !track.contains(e.target)) { return; }
    var el = e.target.closest('.track > *');
    if (!el) { return; }
    var r = el.getBoundingClientRect(), vw = viewW();
    if (r.left < 0 || r.right > vw) {
      var x = clamp(r.left - track.getBoundingClientRect().left - vw * 0.3, 0, travel);
      window.scrollTo({ top: driveTop + x, behavior: 'auto' });
    }
  });

  var resizeTimer = 0;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); });
  window.addEventListener('scroll', requestUpdate, { passive: true });
  if (reduce.addEventListener) { reduce.addEventListener('change', layout); }
  window.addEventListener('hashchange', function () { driveTo(location.hash.slice(1), 'auto'); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { layout(); }); }

  function refresh() {
    find();
    /* re-measure once pictures have their real sizes */
    if (track) {
      track.querySelectorAll('img').forEach(function (img) {
        if (!img.complete) { img.addEventListener('load', layout, { once: true }); }
      });
    }
    layout();
  }
  (window.themeRefresh = window.themeRefresh || {}).roadtrip = refresh;
  refresh();
  if (location.hash) { driveTo(location.hash.slice(1), 'auto'); }
})();
