#!/usr/bin/env python3
"""Sagsregistret (runde 10): én kilde i assets/kanon.json (sider + sagsakter).

  python3 sagsregister.py          tjekker alle sider, sætter manglende section-id'er, skriver tabellerne i
                                   /arkivet/sagsregister/ og /en/archive/case-register/ og genererer ankerkortet i assets/ankre.js
  python3 sagsregister.py --tjek   ændrer intet; afslutter med fejl, hvis noget ikke stemmer (bruges i CI og før commit)

Hver akt skal stå som <div class="kicker">Sagsakt N[ · Tillæg| · Bilag] · Titel</div> på den side, registret angiver
(og tilsvarende »Case file N · Supplement/Exhibit · Title« på engelsk), inde i en <section> med id = anker.
Ingen side må have en sagsakt-kicker, som ikke står i registret. Kun standardbiblioteket; kør bump.sh bagefter.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
TJEK = '--tjek' in sys.argv
ORD = {'da': ('Sagsakt', {'tillaeg': 'Tillæg', 'bilag': 'Bilag'}), 'en': ('Case file', {'tillaeg': 'Supplement', 'bilag': 'Exhibit'})}
REG = {'da': ('Sag', 'Sagsakt', 'Side'), 'en': ('No.', 'Case file', 'Page')}
FORSIDE = {'da': 'Vadestedet', 'en': 'The ford'}
# Gamle id'er, der ikke længere findes på nogen side, men kan stå i gamle links (/#oplev osv.).
ALIAS = {'oplev': 'oplevelser', 'prov': 'oplevelser', 'arkiv': 'arkivet', 'r5-graatand': 'arkivet', 'maskinrummet': 'maskinrummet'}

fejl, aendret = [], {}
kanon = json.load(open(os.path.join(ROOT, 'assets/kanon.json'), encoding='utf-8'))
SIDER, AKTER = kanon['sider'], kanon['sagsakter']
fil = lambda sti: sti.strip('/') + '/index.html' if sti.strip('/') else 'index.html'

def laes(rel):
    if rel not in aendret: aendret[rel] = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    return aendret[rel]
original = {}
def hent(rel):
    s = laes(rel); original.setdefault(rel, s); return s

def kicker(a, lang):
    o, typ = ORD[lang]
    return f'{o} {a["nr"]}' + (f' · {typ[a["type"]]}' if a.get('type') else '') + f' · {a[lang]}'

forventet = {'da': set(), 'en': set()}
for a in AKTER:
    for lang in ('da', 'en'):
        rel = fil(SIDER[a['side']][lang]); html = hent(rel); k = kicker(a, lang); forventet[lang].add((rel, k))
        tag = f'<div class="kicker">{k}</div>'
        n = html.count(tag)
        if n != 1: fejl.append(f'{rel}: »{k}« fundet {n} gange'); continue
        i = html.index(tag); s = html.rfind('<section', 0, i); e = html.index('</section>', i)
        if s < 0: fejl.append(f'{rel}: »{k}« står ikke i en <section>'); continue
        m = re.search(r'\sid="([^"]+)"', html[s:html.index('>', s)])
        if m and m.group(1) != a['anker']:
            fejl.append(f'{rel}: »{k}« står i section#{m.group(1)}, registret siger #{a["anker"]}'); continue
        if not m:
            j = html.find(f' id="{a["anker"]}"')
            if s < j < e: continue  # ankeret står på et element inde i sektionen
            if j >= 0: fejl.append(f'{rel}: id="{a["anker"]}" findes allerede uden for sektionen'); continue
            html = html[:s] + f'<section id="{a["anker"]}"' + html[s + len('<section'):]
            aendret[rel] = html

# Ingen kicker uden for registret
for lang in ('da', 'en'):
    o = ORD[lang][0]
    for k, v in SIDER.items():
        rel = fil(v[lang])
        for m in re.finditer(rf'<div class="kicker">({o} \d+[^<]*)</div>', hent(rel)):
            if (rel, m.group(1)) not in forventet[lang]: fejl.append(f'{rel}: »{m.group(1)}« står ikke i registret')

# Tabellerne
def sidenavn(key, lang):
    if key == 'forside': return FORSIDE[lang]
    html = hent(fil(SIDER[key][lang])); h1 = re.search(r'<h1>(.*?)</h1>', html).group(1)
    eb = re.search(r'<p class="side-eyebrow">(.*?)</p>', html)  # »Tingets« + »Maskinpark«
    return f'{eb.group(1)} {h1.lower() if lang == "da" else h1.lower()}' if eb else h1
for lang in ('da', 'en'):
    rel = fil(SIDER['sagsregister'][lang]); html = hent(rel)
    nr, akt, side = REG[lang]
    rk = []
    for a in AKTER:
        o, typ = ORD[lang]
        t = f'{a[lang]}' + (f' <span class="note">({typ[a["type"]].lower()})</span>' if a.get('type') else '')
        url = SIDER[a['side']][lang] + '#' + a['anker']
        rk.append(f'        <tr><td>{a["nr"]}</td><td><a href="{url}">{t}</a></td><td>{sidenavn(a["side"], lang)}</td></tr>')
    tabel = (f'<!-- sagsregister:start -->\n    <div class="regnskab sagsregister" tabindex="0" role="region" aria-label="{akt}">\n      <table>\n'
             f'        <thead><tr><th scope="col">{nr}</th><th scope="col">{akt}</th><th scope="col">{side}</th></tr></thead>\n        <tbody>\n'
             + '\n'.join(rk) + '\n        </tbody>\n      </table>\n    </div>\n    <!-- sagsregister:slut -->')
    aendret[rel] = re.sub(r'<!-- sagsregister:start -->.*?<!-- sagsregister:slut -->', lambda m: tabel, html, flags=re.S)

# Ankerkortet i ankre.js: alle id'er, der kun findes på én side (dansk), plus gamle aliasser
forekomst = {}
for k, v in SIDER.items():
    for i in set(re.findall(r'\sid="([^"]+)"', hent(fil(v['da'])))): forekomst.setdefault(i, set()).add(k)
idkort = {i: next(iter(s)) for i, s in sorted(forekomst.items()) if len(s) == 1 and not i.startswith(('sag-', 'paafund-'))}
for i, k in ALIAS.items(): idkort.setdefault(i, k)
rel = 'assets/ankre.js'; js = hent(rel)
sider_js = json.dumps({k: {'da': v['da'], 'en': v['en']} for k, v in SIDER.items()}, ensure_ascii=False, separators=(',', ':'))
js = re.sub(r'const SIDER = .*?;\n', lambda m: f'const SIDER = {sider_js};\n', js, count=1)
js = re.sub(r'const ID = .*?;\n', lambda m: f'const ID = {json.dumps(idkort, ensure_ascii=False, separators=(",", ":"))};\n', js, count=1)
aendret[rel] = js

if fejl:
    print('\n'.join('FEJL ' + f for f in fejl)); sys.exit(1)
skal = [r for r in aendret if aendret[r] != original.get(r)]
if TJEK:
    if skal: print('Skal opdateres (kør python3 sagsregister.py): ' + ', '.join(skal)); sys.exit(1)
    print(f'Sagsregistret stemmer: {len(AKTER)} akter på {len(SIDER)} sider × 2 sprog.'); sys.exit(0)
for r in skal: open(os.path.join(ROOT, r), 'w', encoding='utf-8').write(aendret[r])
print(f'{len(AKTER)} akter. Opdateret: ' + (', '.join(skal) or 'intet'))
