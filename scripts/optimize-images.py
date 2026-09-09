#!/usr/bin/env python3
"""Resize and convert generated PNGs to WebP for the examples. Needs Pillow (maintainer tool, not required by users).
usage: optimize-images.py <src.png> <dest.webp> --max 1600 [--square] [--quality 78]
       optimize-images.py <src.webp> <dest.webp> --variants cover|thumbnail
"""
import sys, argparse
from pathlib import Path
from PIL import Image
p = argparse.ArgumentParser(); p.add_argument('src'); p.add_argument('dest'); p.add_argument('--max', type=int, default=1600); p.add_argument('--square', action='store_true'); p.add_argument('--quality', type=int, default=78)
p.add_argument('--variants', choices=['cover', 'thumbnail'], help='Write width-suffixed siblings; leave the source and destination originals unchanged.')
a = p.parse_args()
im = Image.open(a.src).convert('RGB')
if a.square:
    w, h = im.size; s = min(w, h); im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
if a.variants:
    dest = Path(a.dest)
    widths = [900, 1800] if a.variants == 'cover' else [88, 176]
    for width in widths:
        if im.width < width:
            continue  # Never claim a width that the source cannot supply.
        resized = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
        target = dest.with_name(f'{dest.stem}-{width}w.webp')
        resized.save(target, 'WEBP', quality=a.quality, method=6)
        print(target, resized.size, f'{target.stat().st_size} bytes')
else:
    im.thumbnail((a.max, a.max), Image.Resampling.LANCZOS)
    im.save(a.dest, 'WEBP', quality=a.quality, method=6)
    print(a.dest, im.size, f"{__import__('os').path.getsize(a.dest)//1024} KB")
