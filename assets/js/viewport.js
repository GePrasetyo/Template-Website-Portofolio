/* Viewport theme: project pictures open full screen on click or Enter, and close on click or
   Escape, handing focus back to the picture. No dependencies. */
(function () {
  'use strict';

  var opener = null;

  function close(box) {
    box.parentNode.removeChild(box);
    document.body.style.overflow = '';
    if (opener) { opener.focus(); }
  }

  function open(img) {
    opener = img;
    var box = document.createElement('figure');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', img.alt || 'Picture');
    box.tabIndex = -1;
    var big = document.createElement('img');
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    box.appendChild(big);
    var caption = img.parentNode.querySelector('figcaption');
    if (caption) {
      var text = document.createElement('figcaption');
      text.textContent = Array.prototype.map.call(caption.children, function (el) { return el.textContent; }).join(' · ');
      box.appendChild(text);
    }
    box.addEventListener('click', function () { close(box); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(box); } });
    document.body.appendChild(box);
    document.body.style.overflow = 'hidden';
    box.focus();
  }

  /* Make every project picture openable. The editor's live preview (admin/preview.js) calls this
     again each time it redraws the page. */
  window.refreshTheme = function () {
    document.querySelectorAll('.item-picture > img').forEach(function (img) {
      if (img.__lightbox) { return; }
      img.__lightbox = true;
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Open picture: ' + (img.alt || ''));
      img.addEventListener('click', function () { open(img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); }
      });
    });
  };
  window.refreshTheme();
})();
