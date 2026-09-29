/* Live preview for the editor. Sveltia CMS shows the page being edited in its preview pane, drawn
   with the site's own theme while you type: the Liquid templates in _includes/ and _layouts/
   (bundled into preview/templates.json by _tools/preview_bundle.py when the site is built) are
   rendered with LiquidJS the way Jekyll renders them, with the saved site data
   (preview/site.json) and the entry being edited. Jekyll still builds the real site, so small
   differences are possible, such as straight instead of curly quotes.
   window.SitePreview.renderer() gives the renderer, e.g. to try a render in the browser console. */
(function () {
  'use strict';

  var LIBS = [
    'https://unpkg.com/liquidjs@10/dist/liquid.browser.umd.js',
    'https://unpkg.com/marked@18/lib/marked.umd.js'
  ];
  /* Where each editor file lives in site.data. Keep in step with the file names in
     admin/config.yml. The Projects collection is previewed as a project page instead. */
  var DATA_FILES = {
    look: ['look'],
    profile: ['profile'],
    welcome: ['home', 'welcome'],
    hero: ['home', 'hero'],
    work_section: ['home', 'work'],
    experience: ['home', 'experience'],
    skills: ['home', 'skills'],
    about: ['home', 'about'],
    contact: ['home', 'contact']
  };
  var SCHEME = /^[a-z][a-z0-9+.-]*:/i;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) { throw new Error(url + ' answered ' + r.status + '. It is made when the site is built.'); }
      return r.json();
    });
  }

  /* The editor keeps empty fields as "" or null; the saved files leave them out
     (omit_empty_optional_fields), which is what the templates expect. */
  function prune(value) {
    if (Array.isArray(value)) {
      var list = value.map(prune).filter(function (v) { return v !== undefined; });
      return list.length ? list : undefined;
    }
    if (value && typeof value === 'object') {
      var out = {}, any = false;
      Object.keys(value).forEach(function (k) {
        var v = prune(value[k]);
        if (v !== undefined) { out[k] = v; any = true; }
      });
      return any ? out : undefined;
    }
    return value === '' || value === null ? undefined : value;
  }

  function createRenderer(bundle, saved) {
    var root = (saved.baseurl || '').replace(/\/$/, '');
    var findAsset = null;   // the editor's getAsset during a render, for pictures not saved yet

    function siteUrl(value) {
      var v = value == null ? '' : String(value);
      if (SCHEME.test(v)) { return v; }
      var asset = findAsset && v && findAsset(v);
      if (asset && asset.fileObj) { return asset.url; }
      return root + '/' + v.replace(/^\//, '');
    }

    var engine = new window.liquidjs.Liquid({ templates: bundle.includes, jekyllInclude: true, dynamicPartials: false });
    engine.registerFilter('relative_url', siteUrl);
    engine.registerFilter('absolute_url', function (v) {
      var u = siteUrl(v);
      return SCHEME.test(u) ? u : location.origin + u;
    });
    engine.registerFilter('markdownify', function (v) { return window.marked.parse(v == null ? '' : String(v)); });
    engine.registerFilter('jsonify', function (v) { return JSON.stringify(v); });

    async function withLayouts(name, content, scope) {
      while (name) {
        var layout = bundle.layouts[name];
        content = await engine.parseAndRender(layout.body, Object.assign({}, scope, { content: content }));
        name = layout.layout;
      }
      return content;
    }

    /* The whole page, as Jekyll would write it, for the editor file `name` holding `data`. */
    async function render(name, data, slug, getAsset) {
      var site = JSON.parse(JSON.stringify(saved));
      site.time = new Date();
      findAsset = getAsset || null;
      try {
        if (name === 'work') {
          var page = Object.assign({}, data, { collection: 'work', url: '/work/' + (slug || 'new') + '.html' });
          site.work = site.work.filter(function (w) { return w.url !== page.url; }).concat([page]);
          return await withLayouts('work', '', { site: site, page: page });
        }
        var path = DATA_FILES[name], parent = site.data;
        path.slice(0, -1).forEach(function (k) { parent = parent[k] = parent[k] || {}; });
        parent[path[path.length - 1]] = data;
        var home = bundle.pages['index.html'], scope = { site: site, page: { url: '/' } };
        return await withLayouts(home.layout, await engine.parseAndRender(home.body, scope), scope);
      } finally {
        findAsset = null;
      }
    }

    return { render: render };
  }

  var ready = null;
  function renderer() {
    if (!ready) {
      ready = Promise.all(LIBS.map(loadScript).concat([getJSON('preview/templates.json'), getJSON('preview/site.json')]))
        .then(function (r) { return createRenderer(r[LIBS.length], r[LIBS.length + 1]); });
      ready.catch(function () { ready = null; });   // try again on the next edit
    }
    return ready;
  }

  /* Split a rendered page into what goes into the preview's <head> (stylesheets and the colour
     and font variables), the theme scripts to run, and the body to show. */
  function splitPage(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var head = Array.prototype.map.call(doc.head.querySelectorAll('link[rel=stylesheet], style'), function (el) { return el.outerHTML; });
    var scripts = [];
    Array.prototype.forEach.call(doc.body.querySelectorAll('script'), function (el) {
      var src = el.getAttribute('src');
      if (src && !/\/site\.js(\?|$)/.test(src)) { scripts.push(src); }
      el.parentNode.removeChild(el);
    });
    return { head: head.join('\n'), scripts: scripts, body: doc.body.innerHTML };
  }

  /* Bring the preview document in line with a rendered page. Stylesheets are only replaced when
     they change, so typing doesn't make the page flash. */
  function update(doc, win, page, showWelcome) {
    if (doc.__siteHead !== page.head) {
      Array.prototype.forEach.call(doc.head.querySelectorAll('[data-site]'), function (el) { el.parentNode.removeChild(el); });
      var holder = doc.createElement('template');
      holder.innerHTML = page.head;
      Array.prototype.forEach.call(holder.content.children, function (el) { el.setAttribute('data-site', ''); });
      doc.head.appendChild(holder.content);
      doc.__siteHead = page.head;
    }
    var welcome = showWelcome && doc.querySelector('.welcome');
    doc.documentElement.classList.toggle('welcome-open', !!welcome);
    var media = welcome && welcome.querySelector('.welcome-media[data-src]');
    if (media) {
      media.onload = function () { welcome.classList.add('loaded'); };
      media.src = media.getAttribute('data-src');
    }
    /* Theme scripts (e.g. the Comic panel edges) load once, then redraw after every render. */
    page.scripts.forEach(function (src) {
      if (doc.querySelector('script[data-site-script="' + src + '"]')) {
        if (win.refreshTheme) { win.refreshTheme(); }
        return;
      }
      var s = doc.createElement('script');
      s.src = src;
      s.setAttribute('data-site-script', src);
      doc.head.appendChild(s);
    });
  }

  function previewFor(name) {
    return function Preview(props) {
      var React = window.CMS.React, h = React.createElement;
      var state = React.useState(null), page = state[0], setPage = state[1];
      var data = props.entry.get('data');

      React.useEffect(function () {
        var stale = false;
        var timer = setTimeout(function () {
          renderer()
            .then(function (r) { return r.render(name, prune(data ? data.toJS() : {}) || {}, props.entry.get('slug'), props.getAsset); })
            .then(function (html) { if (!stale) { setPage(splitPage(html)); } })
            .catch(function (err) { if (!stale) { setPage({ error: err.message }); } });
        }, 150);
        return function () { stale = true; clearTimeout(timer); };
      }, [data]);

      React.useEffect(function () {
        if (page && !page.error) { update(props.document, props.window, page, name === 'welcome'); }
      }, [page]);

      var note = { style: { font: '15px/1.5 system-ui, sans-serif', padding: '24px', margin: 0 } };
      if (!page) { return h('p', note, 'Drawing the preview…'); }
      if (page.error) { return h('p', note, 'The preview could not be drawn: ' + page.error); }
      return h('div', { dangerouslySetInnerHTML: { __html: page.body } });
    };
  }

  window.SitePreview = { renderer: renderer };
  if (window.CMS) {
    window.CMS.registerPreviewTemplate('work', previewFor('work'));
    Object.keys(DATA_FILES).forEach(function (name) { window.CMS.registerPreviewTemplate(name, previewFor(name)); });
  }
})();
