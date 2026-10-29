#!/usr/bin/env python3
"""Delingsbilleder (runde 12): ét 1200×630-billede pr. side til og:image (X, LinkedIn, Discord, Slack, Facebook).

Billedet laves ud fra sidens eget maleri (heroen, eller maskinparkens maskinbillede) med sidens titel og beskrivelse
ovenpå i sitets skrifttyper, og sidens <meta property="og:image"> peges på det. Kør igen, når en side får ny hero.

Kør:  python3 build-og.py --fonts <mappe>      (kræver Pillow)
Skrifterne er Bricolage Grotesque 700/800 og Spectral 400 kursiv, som TTF. Hent dem fx med
  npm i @fontsource/bricolage-grotesque @fontsource/spectral  og konvertér woff2 → ttf med fontTools:
  python3 -c "from fontTools.ttLib import TTFont as F; f=F('<fil>.woff2'); f.flavor=None; f.save('<navn>.ttf')"
og navngiv dem bri800.ttf, bri700.ttf og spec-i.ttf i mappen.
"""
import argparse, html, os, re, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
SEKTION = {'maskinrummet': 'Maskinrummet', 'oplevelser': 'Oplevelser', 'arkivet': 'Arkivet', 'historien': 'Historien',
           'machine-room': 'The machine room', 'experiences': 'Experiences', 'archive': 'The archive', 'history': 'History'}


def kilde(s, f):
    """Sidens bedste maleri: maskinbilledet på maskinparkens undersider, ellers heroen, ellers forsiden."""
    m = re.search(r'assets/pak/ai/(?!avis-)[a-z0-9_-]+\.webp', s) if re.search(r'(maskinparken|machine-park)/[^/]+/', f) else None
    if m: return m.group(0)
    m = re.search(r'assets/pak/(?:undersider|arkiv|toppe|forside)/[a-z0-9_-]*?(?:hero|serverfarm)[a-z0-9_-]*?-(?:2048|1774)\.webp', s)
    return m.group(0) if m else 'assets/pak/forside/hero-1774.webp'


def beskaar(im):
    """Fylder 1200×630; brede heroes har motivet til højre, så vinduet lægges mod højre."""
    r = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = round((im.width - W) * (0.72 if im.width / im.height > 2.2 else 0.5))
    y = round((im.height - H) * 0.5)
    return im.crop((x, y, x + W, y + H))


def ombryd(d, tekst, font, bredde, maks):
    ord_, linjer, nu = tekst.split(), [], ''
    for o in ord_:
        prøv = (nu + ' ' + o).strip()
        if d.textlength(prøv, font=font) <= bredde: nu = prøv
        else: linjer.append(nu); nu = o
    linjer.append(nu)
    if len(linjer) > maks:
        linjer = linjer[:maks]
        while d.textlength(linjer[-1] + ' …', font=font) > bredde: linjer[-1] = linjer[-1].rsplit(' ', 1)[0]
        linjer[-1] += ' …'
    return linjer


def tegn(src, titel, beskr, sektion, F):
    im = beskaar(Image.open(src).convert('RGB'))
    # mørk flade fra venstre og forneden, så teksten kan læses
    maske = Image.new('L', (W, H))
    px = maske.load()
    for x in range(W):
        a = max(0.0, 1 - x / (W * 0.72)) ** 1.25
        for y in range(H):
            b = max(0.0, (y - H * 0.55) / (H * 0.45)) ** 1.6
            px[x, y] = int(235 * min(1, a + b * 0.8))
    im = Image.composite(Image.new('RGB', (W, H), (14, 12, 9)), im, maske)
    d = ImageDraw.Draw(im)
    x0, bredde = 64, 700
    for st in range(92, 54, -2):
        ft = ImageFont.truetype(F['bri800'], st)
        if d.textlength(titel, font=ft) <= bredde + 120: tl = [titel]; break
    else:
        ft = ImageFont.truetype(F['bri800'], 62); tl = ombryd(d, titel, ft, bredde + 80, 2)
    fb = ImageFont.truetype(F['spec-i'], 31)
    bl = ombryd(d, beskr, fb, bredde, 3) if beskr else []
    fs = ImageFont.truetype(F['bri700'], 19)
    lh_t, lh_b = round(ft.size * 1.02), 42
    y = H - 64 - 40 - len(bl) * lh_b - 18 - len(tl) * lh_t
    lag = [(x0, y + i * lh_t, l, ft, (246, 238, 222)) for i, l in enumerate(tl)]
    y += len(tl) * lh_t + 18
    lag += [(x0, y + i * lh_b, l, fb, (232, 224, 208)) for i, l in enumerate(bl)]
    lag.append((x0, H - 64, ('TINGSVAD.DK' + (' · ' + sektion.upper() if sektion else '')), fs, (232, 196, 120)))
    skygge = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(skygge)
    for x, y, t, f, c in lag: ds.text((x + 2, y + 3), t, font=f, fill=(0, 0, 0, 180))
    im = Image.alpha_composite(im.convert('RGBA'), skygge.filter(ImageFilter.GaussianBlur(5))).convert('RGB')
    d = ImageDraw.Draw(im)
    for x, y, t, f, c in lag: d.text((x, y), t, font=f, fill=c)
    return im


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--fonts', required=True); a = ap.parse_args()
    F = {k: os.path.join(a.fonts, k + '.ttf') for k in ('bri800', 'bri700', 'spec-i')}
    sider = [f for f in subprocess.check_output(['git', 'ls-files', '*index.html']).decode().split() if not f.startswith(('admin/', 'tests/'))]
    os.makedirs('assets/og', exist_ok=True)
    n = 0
    for f in sider:
        s = open(f, encoding='utf-8').read()
        t = re.search(r'<meta property="og:title" content="([^"]*)"', s)
        if not t: continue  # viderestillinger uden eget indhold
        titel = html.unescape(t.group(1)).replace(' · Tingsvad', '')
        if titel.startswith('Tingsvad –'): titel = 'Tingsvad'
        bm = re.search(r'<meta property="og:description" content="([^"]*)"', s)
        beskr = html.unescape(bm.group(1)) if bm else ''
        dele = f.split('/')[:-1]
        sek = SEKTION.get(dele[1] if dele[:1] == ['en'] and len(dele) > 1 else (dele[0] if dele else ''), '')
        navn = '-'.join(dele) or 'forside'
        ud = f'assets/og/{navn}.jpg'
        tegn(kilde(s, f), titel, beskr, sek, F).save(ud, quality=76, optimize=True, progressive=True)
        url = 'https://tingsvad.dk/' + ud
        s2 = re.sub(r'(<meta property="og:image" content=")[^"]*(">)', r'\g<1>' + url + r'\2', s)
        s2 = re.sub(r'(<meta property="og:image:width" content=")\d+', r'\g<1>1200', s2)
        s2 = re.sub(r'(<meta property="og:image:height" content=")\d+', r'\g<1>630', s2)
        alt = html.escape(titel + (' – ' + beskr if beskr else ''), quote=True)
        if 'og:image:alt' in s2: s2 = re.sub(r'(<meta property="og:image:alt" content=")[^"]*', r'\g<1>' + alt.replace('\\', '\\\\'), s2)
        else: s2 = re.sub(r'(<meta property="og:image:height" content="630">\n)', r'\1<meta property="og:image:alt" content="' + alt.replace('\\', '\\\\') + '">\n', s2)
        if s2 != s: open(f, 'w', encoding='utf-8').write(s2)
        n += 1
    print(f'{n} delingsbilleder i assets/og/')


if __name__ == '__main__':
    main()
