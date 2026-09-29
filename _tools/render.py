"""Local preview only. GitHub Pages renders the real site with Jekyll.

Emulates the Jekyll features this site uses: _config.yml, _data/ (nested folders), the `work`
collection with its permalink and front matter defaults, `published: false`, layout chains,
_includes/ with Jekyll-style parameters, and the relative_url / absolute_url / markdownify filters.

Needs:  pip install python-liquid markdown pyyaml
Usage:  python _tools/render.py   then serve _site/ at the root (e.g. python -m http.server -d _site 8765)
"""
import datetime, os, re, shutil, sys

import markdown
import yaml
from liquid import DictLoader, Environment

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '_site')


def read(p): return open(p, encoding='utf-8').read()


def split_front_matter(text):
    m = re.match(r'^---\s*\n(.*?)\n?---\s*\n?', text, re.S)
    if not m: return None, text
    return (yaml.safe_load(m.group(1)) or {}), text[m.end():]


def load_data(folder):
    data = {}
    if not os.path.isdir(folder): return data
    for name in sorted(os.listdir(folder)):
        p = os.path.join(folder, name)
        key, ext = os.path.splitext(name)
        if os.path.isdir(p): data[name] = load_data(p)
        elif ext in ('.yml', '.yaml'): data[key] = yaml.safe_load(read(p))
    return data


# Jekyll `{% include file.html a=b c='d' %}`  ->  python-liquid `{% include 'file.html', a: b, c: 'd' %}`,
# and `include.x` inside include files -> `x` (python-liquid binds keyword args directly).
INCLUDE_RE = re.compile(r"\{%(-?)\s*include\s+([\w./-]+)((?:\s+\w+=(?:\"[^\"]*\"|'[^']*'|[\w.\[\]]+))*)\s*(-?)%\}")
PARAM_RE = re.compile(r"(\w+)=(\"[^\"]*\"|'[^']*'|[\w.\[\]]+)")


def jekyll_to_liquid(src):
    def sub(m):
        params = ''.join(', %s: %s' % p for p in PARAM_RE.findall(m.group(3)))
        return "{%%%s include '%s'%s %s%%}" % (m.group(1), m.group(2), params, m.group(4))
    return INCLUDE_RE.sub(sub, src)


def make_env(site):
    inc_dir = os.path.join(ROOT, '_includes')
    includes = {}
    if os.path.isdir(inc_dir):
        for f in os.listdir(inc_dir):
            includes[f] = jekyll_to_liquid(re.sub(r'\binclude\.', '', read(os.path.join(inc_dir, f))))
    env = Environment(loader=DictLoader(includes))
    base = (site.get('baseurl') or '').rstrip('/')

    def relative_url(v):
        v = '' if v is None else str(v)
        if re.match(r'^[a-z][a-z0-9+.-]*:', v, re.I): return v
        return base + '/' + v.lstrip('/')

    def absolute_url(v):
        v = relative_url(v)
        return v if re.match(r'^[a-z][a-z0-9+.-]*:', v, re.I) else (site.get('url') or 'http://localhost:8765').rstrip('/') + v

    def markdownify(v):
        return markdown.markdown('' if v is None else str(v), extensions=['smarty']) + '\n'

    env.filters['relative_url'] = relative_url
    env.filters['absolute_url'] = absolute_url
    env.filters['markdownify'] = markdownify
    return env


def main():
    site = yaml.safe_load(read(os.path.join(ROOT, '_config.yml')))
    site['data'] = load_data(os.path.join(ROOT, '_data'))
    site['time'] = datetime.datetime.now()
    env = make_env(site)
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT)

    layouts = {}
    for f in os.listdir(os.path.join(ROOT, '_layouts')):
        fm, body = split_front_matter(read(os.path.join(ROOT, '_layouts', f)))
        layouts[os.path.splitext(f)[0]] = (fm or {}, env.from_string(jekyll_to_liquid(body)))

    def defaults_for(doc_type):
        out = {}
        for d in site.get('defaults', []):
            if d.get('scope', {}).get('type') in (None, doc_type): out.update(d.get('values', {}))
        return out

    # Collections first so every page can see site.<collection>.
    docs = []
    for name, cfg in (site.get('collections') or {}).items():
        folder = os.path.join(ROOT, '_' + name)
        site[name] = []
        if not os.path.isdir(folder): continue
        for f in sorted(os.listdir(folder)):
            fm, body = split_front_matter(read(os.path.join(folder, f)))
            if fm is None: continue
            page = dict(defaults_for(name), **fm)
            if page.get('published') is False: continue
            stem = os.path.splitext(f)[0]
            page.update(collection=name, slug=stem, name=f,
                        url=cfg.get('permalink', '/%s/:name.html' % name).replace(':name', stem))
            site[name].append(page)
            if cfg.get('output'): docs.append((page, body, f.endswith('.md')))

    pages = []
    for dirpath, dirs, files in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        dirs[:] = [d for d in dirs if not d.startswith(('_', '.')) and d not in site.get('exclude', [])]
        for f in files:
            if f.startswith(('_', '.')) or f in site.get('exclude', []): continue
            src = os.path.join(dirpath, f)
            relf = f if rel == '.' else rel.replace(os.sep, '/') + '/' + f
            fm, body = split_front_matter(read(src)) if f.endswith(('.html', '.md')) else (None, None)
            if fm is None:
                dst = os.path.join(OUT, relf)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)
                continue
            page = dict(defaults_for('pages'), **fm)
            page['url'] = '/' + (relf[:-len('index.html')] if relf.endswith('index.html') else relf)
            pages.append((page, body, f.endswith('.md')))

    written = {}
    for page, body, is_md in pages + docs:
        ctx = {'site': site, 'page': page}
        html = env.from_string(jekyll_to_liquid(body)).render(**ctx)
        if is_md: html = markdown.markdown(html)
        layout = page.get('layout')
        while layout:
            fm, tpl = layouts[layout]
            html = tpl.render(content=html, layout=fm, **ctx)
            layout = fm.get('layout')
        url = page['url']
        path = url.lstrip('/') + ('index.html' if url.endswith('/') else '')
        if path in written: print('CONFLICT: %s is written by both %s' % (path, written[path]), file=sys.stderr)
        written[path] = page.get('name') or url
        dst = os.path.join(OUT, path)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'w', encoding='utf-8', newline='\n').write(html)
        print('rendered', url)
    print('done ->', OUT)


if __name__ == '__main__':
    main()
