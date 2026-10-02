"""Sweety Buket — non-destructive image derivatives.

Originals (Instagram @sweetybuket files, untouched) live in
sweetybuket/originals/<name>.jpg; SOURCES.json maps each to its source file.
This script writes crops to sweetybuket/assets/optimized/<name>-<variant>-<w>.{avif,webp,jpg}.

Each crop is chosen per photo (aspect + focal point), never a blind centre
fill, and never wider than the original (no upscaling). Run:

    python3 scripts/sweety_assets.py            # everything
    python3 scripts/sweety_assets.py hero       # one image
"""
import json
import os
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "sweetybuket")
ORIG = os.path.join(SITE, "originals")
OUT = os.path.join(SITE, "assets", "optimized")

P45 = 4 / 5
# variant: (aspect w/h or None = keep original, focal x, focal y, widths)
PRODUCT = {"card": (P45, .5, .45, [480, 800, 1200])}
SCENES = {
    # hero: model right, 51 peonies centre-left. Mobile keeps the full 3:4 frame;
    # desktop half-screen column uses 4:5 with face and bouquet inside.
    "hero": {"m": (None, .5, .5, [640, 960, 1280, 1600]), "d": (P45, .5, .42, [900, 1300, 1800])},
    # two baskets, model seated centre: the one photo that holds a wide crop
    "brand": {"d": (16 / 9, .5, .6, [1000, 1440]), "m": (P45, .5, .56, [600, 900])},
    "story-basket": {"v": (None, .5, .5, [600, 1000, 1400])},
    "story-two": {"v": (P45, .5, .5, [600, 1000, 1400])},
    "story-tulips": {"v": (P45, .42, .45, [600, 1000])},
    "gift-lead": {"v": (None, .5, .5, [600, 1000, 1400])},
    "gift-peony": {"v": (P45, .5, .5, [600, 1000])},
    "ig-1": {"sq": (1, .5, .55, [400, 700])},
    "ig-2": {"sq": (1, .5, .45, [400, 700])},
    "ig-3": {"sq": (1, .5, .55, [400, 700])},
    "ig-4": {"sq": (1, .5, .45, [400, 700])},
    "ig-5": {"sq": (1, .5, .5, [400, 700])},
    "ig-6": {"sq": (1, .5, .5, [400, 700])},
}
for occ in ("her", "birthday", "noreason", "love", "thanks", "evening"):
    SCENES["occ-" + occ] = {"v": (P45, .5, .48, [480, 800, 1100])}


def crop(im, aspect, fx, fy):
    w, h = im.size
    if not aspect:
        return im
    if w / h > aspect:            # too wide: trim sides around fx
        nw = round(h * aspect)
        x = min(max(round(fx * w - nw / 2), 0), w - nw)
        return im.crop((x, 0, x + nw, h))
    nh = round(w / aspect)        # too tall: trim top/bottom around fy
    y = min(max(round(fy * h - nh / 2), 0), h - nh)
    return im.crop((0, y, w, y + nh))


def build(name, variants):
    im = ImageOps.exif_transpose(Image.open(os.path.join(ORIG, name + ".jpg"))).convert("RGB")
    meta = {}
    for v, (aspect, fx, fy, widths) in variants.items():
        c = crop(im, aspect, fx, fy)
        done = []
        for w in widths:
            if w > c.size[0]:      # never upscale
                continue
            r = c.resize((w, round(c.size[1] * w / c.size[0])), Image.LANCZOS)
            base = os.path.join(OUT, "%s-%s-%d" % (name, v, w))
            r.save(base + ".avif", quality=62)
            r.save(base + ".webp", quality=82)
            r.save(base + ".jpg", quality=85, optimize=True, progressive=True)
            done.append(w)
        if not done or done[-1] < c.size[0] and c.size[0] < widths[-1]:
            w = c.size[0]          # largest available = native width
            base = os.path.join(OUT, "%s-%s-%d" % (name, v, w))
            c.save(base + ".avif", quality=62)
            c.save(base + ".webp", quality=82)
            c.save(base + ".jpg", quality=85, optimize=True, progressive=True)
            done.append(w)
        meta[v] = {"w": done, "ratio": round(c.size[0] / c.size[1], 4)}
    return meta


def main(names):
    os.makedirs(OUT, exist_ok=True)
    manifest_path = os.path.join(OUT, "manifest.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    all_names = sorted(os.path.splitext(f)[0] for f in os.listdir(ORIG) if f.endswith(".jpg"))
    for n in names or all_names:
        manifest[n] = build(n, SCENES.get(n, PRODUCT))
        print("ok", n, manifest[n])
    json.dump(manifest, open(manifest_path, "w"), indent=1, sort_keys=True)


if __name__ == "__main__":
    main(sys.argv[1:])
