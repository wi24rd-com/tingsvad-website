#!/bin/sh
# Kør efter ændringer i css/js/kanon.json (eller via `npm run prep`): én hash over filerne i assets/filer.json »versioneret«
# sættes som ?v= på dem i alle html-filer, som cache-navn V i sw.js, og <lastmod> i sitemap.xml sættes til i dag.
# Runde 13: listen bor i assets/filer.json (samme liste giver kantcache-reglerne i _headers via tools/headers.mjs).
cd "$(dirname "$0")" || exit 1
python3 - <<'PY'
import hashlib, json, re, os, datetime
filer = json.load(open('assets/filer.json', encoding='utf-8'))['versioneret']
h = hashlib.md5()
for f in filer: h.update(hashlib.md5(open(os.path.join('assets', f), 'rb').read()).hexdigest().encode())
v = h.hexdigest()[:8]
navne = '|'.join(re.escape(f) for f in filer)
pat = re.compile(r'(assets/(' + navne + r'))(\?v=[0-9a-zA-Z]+)?"')
html = []
for rod, mapper, fs in os.walk('.'):
    mapper[:] = [m for m in mapper if m not in ('node_modules', 'worker', 'byggepakke', '.wrangler', '.git', 'site-worker', 'mcp', 'tests') and not m.startswith('Tingsvad-')]
    if rod.startswith(('./arkivet/protokol', './en/archive/minutes')): continue
    html += [os.path.join(rod, f) for f in fs if f == 'index.html' or (rod == '.' and f == '404.html')]
n = 0
for f in html:
    s = open(f, encoding='utf-8').read(); t = pat.sub(lambda m: m.group(1) + '?v=' + v + '"', s)
    if t != s: open(f, 'w', encoding='utf-8').write(t); n += 1
sw = open('sw.js', encoding='utf-8').read(); sw2 = re.sub(r"const V = 'tingsvad-[^']*'", "const V = 'tingsvad-" + v + "'", sw, count=1)
if sw2 != sw: open('sw.js', 'w', encoding='utf-8').write(sw2)
d = datetime.date.today().isoformat()
sm = open('sitemap.xml', encoding='utf-8').read(); sm2 = re.sub(r'<lastmod>[0-9-]+</lastmod>', '<lastmod>' + d + '</lastmod>', sm)
if sm2 != sm: open('sitemap.xml', 'w', encoding='utf-8').write(sm2)
print(f'v={v} lastmod={d} ({n} html-filer ændret)')
PY
