/* Shared by every theme: welcome screen, light/dark switch, lite YouTube, scroll reveal.
   No dependencies. */
(function () {
  'use strict';

  /* ---- welcome screen ---------------------------------------------
     _layouts/default.html adds .welcome-open to <html> before the page draws when the screen
     should show. The video or 3D model only loads then, and on phones only when the editor
     allowed it (data-phones); anyone who prefers less motion gets the picture instead of video. */
  var welcome = document.querySelector('.welcome');
  if (welcome && !document.documentElement.classList.contains('welcome-open')) {
    welcome.parentNode.removeChild(welcome);
  } else if (welcome) {
    var hidden = Array.prototype.filter.call(document.body.children, function (el) {
      return el !== welcome && el.tagName !== 'SCRIPT';
    });
    hidden.forEach(function (el) { el.inert = true; });
    var media = welcome.querySelector('.welcome-media');
    var phone = window.matchMedia('(max-width: 700px)').matches;
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (media && (!phone || media.hasAttribute('data-phones')) && !(calm && welcome.classList.contains('is-video'))) {
      media.addEventListener('load', function () { welcome.classList.add('loaded'); });
      media.src = media.getAttribute('data-src');
    }
    var enter = welcome.querySelector('.welcome-btn');
    var closed = false;
    var close = function () {
      if (closed) { return; }
      closed = true;
      try { sessionStorage.setItem(welcome.getAttribute('data-key'), '1'); } catch (e) {}
      hidden.forEach(function (el) { el.inert = false; });
      welcome.classList.add('closing');
      setTimeout(function () {
        document.documentElement.classList.remove('welcome-open');
        welcome.parentNode.removeChild(welcome);
      }, calm ? 0 : 500);
    };
    enter.addEventListener('click', close);
    welcome.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); } });
    enter.focus({ preventScroll: true });
  }

  /* ---- light/dark switch ------------------------------------------
     Only rendered when Look & feel follows the visitor's device. The choice is kept in
     localStorage and applied early by the inline script in _layouts/default.html. */
  var root = document.documentElement;
  function systemDark() { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
  function currentDark() {
    var m = root.getAttribute('data-mode');
    return m ? m === 'dark' : systemDark();
  }
  document.querySelectorAll('.mode-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentDark() ? 'light' : 'dark';
      root.setAttribute('data-mode', next);
      try { localStorage.setItem('mode', next); } catch (e) {}
    });
  });

  /* ---- lite YouTube ---------------------------------------------- */
  document.querySelectorAll('.item-video[data-id]').forEach(function (box) {
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-label', 'Play video: ' + (box.getAttribute('data-title') || ''));
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); box.click(); }
    });
    box.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-id') + '?autoplay=1&rel=0&modestbranding=1';
      f.title = box.getAttribute('data-title') || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
      box.removeAttribute('role');
      box.removeAttribute('tabindex');
      box.removeAttribute('aria-label');
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
