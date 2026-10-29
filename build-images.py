#!/usr/bin/env python3
"""Genererer responsive billedvarianter (avif/webp/jpg i 3 bredder) fra assets/*.jpg.
Kør: python3 build-images.py   (kræver Pillow + pillow-avif-plugin)"""
import os, sys
from PIL import Image
try:
    import pillow_avif  # noqa
    AVIF = True
except Exception:
    AVIF = False
W = [800, 1200, 1672]
names = ['horoskop','vadestedet','koen','skjoldet','skjoldmoeen','protokollen','nettet','toke','brian','stamtavle','kat','gudrun']
os.makedirs('assets/r', exist_ok=True)
for n in names:
    src = f'assets/{n}.jpg'
    if not os.path.exists(src): continue
    im = Image.open(src).convert('RGB')
    for w in W:
        r = im if w >= im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(f'assets/r/{n}-{w}.jpg', quality=80, optimize=True, progressive=True)
        r.save(f'assets/r/{n}-{w}.webp', quality=76, method=6)
        if AVIF: r.save(f'assets/r/{n}-{w}.avif', quality=55, speed=4)
    print(n, 'ok', 'avif' if AVIF else 'no-avif')
