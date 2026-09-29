"""Bundle the site's Liquid templates for the editor's live preview (admin/preview.js).

Writes one JSON file with every file in _includes/, the layouts in _layouts/ and the home page
(index.html), each split into its front matter and body. Jekyll doesn't publish these, so GitHub
Actions runs this before the Jekyll build (.github/workflows/pages.yml), and _tools/render.py runs
it for local previews. Standard library only: front matter here is plain `key: value` lines.

Usage:  python _tools/preview_bundle.py [OUTPUT]   (default: admin/preview/templates.json)
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONT_MATTER = re.compile(r'^---\s*\n(.*?)\n?---\s*\n?', re.S)


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def split_front_matter(text):
    m = FRONT_MATTER.match(text)
    if not m:
        return {}, text
    data = {}
    for line in m.group(1).splitlines():
        key, sep, value = line.partition(':')
        if sep and key.strip() and not key.lstrip().startswith('#'):
            data[key.strip()] = value.strip().strip('"\'') or None
    return data, text[m.end():]


def template(path):
    data, body = split_front_matter(read(path))
    return {'layout': data.get('layout'), 'body': body}


def bundle():
    includes = {}
    inc_dir = os.path.join(ROOT, '_includes')
    for dirpath, _, files in os.walk(inc_dir):
        for name in files:
            path = os.path.join(dirpath, name)
            includes[os.path.relpath(path, inc_dir).replace(os.sep, '/')] = read(path)
    layout_dir = os.path.join(ROOT, '_layouts')
    layouts = {os.path.splitext(name)[0]: template(os.path.join(layout_dir, name)) for name in os.listdir(layout_dir)}
    return {'includes': includes, 'layouts': layouts, 'pages': {'index.html': template(os.path.join(ROOT, 'index.html'))}}


def write(out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(bundle(), f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)


if __name__ == '__main__':
    write(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'admin', 'preview', 'templates.json'))
