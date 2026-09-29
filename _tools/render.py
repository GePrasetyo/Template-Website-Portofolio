"""Local preview only. GitHub Pages renders the real site with Jekyll.

Emulates the Jekyll features this site uses: _config.yml, _data/ (nested folders), the `work`
collection with its permalink and front matter defaults, `published: false`, layout chains,
Jekyll's include tag (`include.x` parameters, sub-folders of _includes/, and file names built
from variables such as `themes/{{ site.data.look.theme }}/home.html`), and the relative_url /
absolute_url / markdownify filters.

Needs:  pip install python-liquid markdown pyyaml
Usage:  python _tools/render.py   then serve _site/ at the root (e.g. python -m http.server -d _site 8765)
"""
import datetime, io, os, re, shutil, sys

import markdown
import yaml
from liquid import DictLoader, Environment
from liquid.ast import Node
from liquid.builtin.expressions import parse_primitive, tokenize
from liquid.exceptions import LiquidSyntaxError
from liquid.stream import TokenStream
from liquid.tag import Tag
from liquid.token import TOKEN_EXPRESSION, TOKEN_TAG

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


# Jekyll's include tag: `{% include file.html a=b c="d" %}`. The file name may contain `{{ var }}`,
# and the parameters are only visible as `include.a`, `include.c` inside the included file.
# The patterns are Jekyll's own (jekyll/tags/include.rb).
INCLUDE_VARIABLE = re.compile(r'(?P<variable>[^{]*(?:\{\{\s*[\w\-.]+\s*(?:\|.*)?\}\}[^\s{}]*)+)(?P<params>.*)', re.S)
INCLUDE_PARAM = re.compile(r'([\w-]+)\s*=\s*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|\'([^\'\\]*(?:\\.[^\'\\]*)*)\'|([\w.-]+))')


class JekyllIncludeNode(Node):
    __slots__ = ('markup',)

    def __init__(self, token, markup):
        super().__init__(token)
        self.markup = markup.strip()
        self.blank = False

    def render_to_output(self, context, buffer):
        m = INCLUDE_VARIABLE.fullmatch(self.markup) if '{{' in self.markup else None
        if m:
            out = io.StringIO()
            context.env.from_string(m.group('variable')).render_with_context(context, out, partial=True)
            name, params_src = out.getvalue().strip(), m.group('params')
        else:
            name, _, params_src = self.markup.partition(' ')
        params = {}
        for key, dq, sq, var in INCLUDE_PARAM.findall(params_src):
            if var:  # a variable path or a literal such as true, 3 or nil, as Liquid reads it
                expr = parse_primitive(context.env, TokenStream(tokenize(var, parent_token=self.token)))
                params[key] = expr.evaluate(context)
            else:
                params[key] = dq or sq
        template = context.env.get_template(name, context=context, tag='include')
        with context.extend({'include': params}, template=template):
            template.render_with_context(context, buffer, partial=True)
        return True


class JekyllIncludeTag(Tag):
    name = 'include'
    block = False

    def parse(self, stream):
        token = stream.eat(TOKEN_TAG)
        if stream.current.kind != TOKEN_EXPRESSION:
            raise LiquidSyntaxError('missing file name', token=token)
        return JekyllIncludeNode(token, stream.current.value)


def make_env(site):
    inc_dir = os.path.join(ROOT, '_includes')
    includes = {}
    for dirpath, _, files in os.walk(inc_dir):
        for f in files:
            path = os.path.join(dirpath, f)
            includes[os.path.relpath(path, inc_dir).replace(os.sep, '/')] = read(path)
    env = Environment(loader=DictLoader(includes))
    env.add_tag(JekyllIncludeTag)
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
        layouts[os.path.splitext(f)[0]] = (fm or {}, env.from_string(body))

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
        html = env.from_string(body).render(**ctx)
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
