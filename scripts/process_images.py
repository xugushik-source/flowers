"""La Fleur — product photo pipeline (ТЗ §16–18).

Every product photo is rebuilt on one template so the catalogue reads as a
single photo session:

  * 1200 x 1500 (4:5), warm stone studio backdrop, soft floor shadow
  * bouquet cut out (rembg) and placed centred, ~76% of the frame height
  * the bouquet itself is never recoloured, redrawn or edited

Scene photos (splash, editorial, occasion tiles) get the same cut-out
treatment on a dark botanical backdrop, see SCENES.

Usage:
    pip install pillow "rembg[cpu]"
    python3 scripts/process_images.py            # everything
    python3 scripts/process_images.py r6 b4      # only these ids

Source for each product id is chosen in SOURCES below. To use a real photo,
drop it into assets/products/src/<id>.jpg (or incoming/) and point SOURCES at
it. Cut-outs are cached in scripts/.cache (not committed).
"""
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
CACHE = P("scripts", ".cache")

W, H = 1200, 1500
TOP = (223, 214, 203)      # warm stone, lit
BOTTOM = (204, 193, 180)   # warm stone, floor
LEGACY_CAPTION = 58        # px band with burned-in captions on the old 341x255 photos

# id -> (source file, rembg model or None, optional pre-crop box)
# `incoming/*` are partner photos used as TEMPORARY placeholders until the
# real product photo exists. Replace the entry when the photo arrives.
SOURCES = {
    # roses
    "r1": ("assets/products/src/r1.jpg", "u2net", None),
    "r2": ("assets/products/src/r2.jpg", "u2net", None),
    "r3": ("incoming/04.jpg", "isnet-general-use", (0, 0, 1206, 1180)),   # placeholder
    "r4": ("incoming/05.jpg", "isnet-general-use", (0, 200, 1206, 1125)),                 # placeholder
    "r5": ("assets/products/src/r5.jpg", "u2net", None),
    "r6": ("incoming/02.jpg", "isnet-general-use", None),                 # placeholder (white roses)
    # pions
    "p1": ("assets/products/src/p1.jpg", "u2net", None),
    "p2": ("assets/products/src/p2.jpg", "key", None),                    # model cut-out fails: key out the plain wall
    "p3": ("incoming/08.jpg", "isnet-general-use", None),                 # placeholder
    "p4": ("assets/products/src/p4.jpg", "u2net", None),
    # author
    "m1": ("assets/products/src/m1.jpg", "u2net", None),
    "m2": ("assets/products/src/m2.jpg", "u2net", None),
    "m3": ("assets/products/src/m3.jpg", "u2net", None),
    "m4": ("assets/products/src/m4.jpg", "u2net", None),
    # boxes
    "b1": ("assets/products/src/b1.jpg", "u2net", None),
    "b2": ("assets/products/src/b2.jpg", "isnet-general-use", None),
    "b3": ("assets/products/src/b3.jpg", "u2net", None),
    "b4": ("incoming/06.jpg", "isnet-general-use", (0, 0, 1206, 1480)),   # placeholder
    # gift sets
    "cmb1": ("assets/products/src/cmb1.jpg", "isnet-general-use", None),
    "cmb2": ("assets/products/src/cmb2.jpg", "key", None),                # model cut-out fails: key out the plain wall
    # add-ons (square)
    "e1": ("assets/products/src/e1.jpg", "u2net", None),
    "e2": ("assets/products/src/e2.jpg", "u2net", None),
    "e3": ("assets/products/src/e3.jpg", "u2net", None),
    "e4": ("assets/products/src/e4.jpg", "u2net", None),
    "e5": ("assets/products/src/e5.jpg", "u2net", None),
    "e6": ("assets/products/src/e6.jpg", "u2net", None),
    # collection tiles for categories that have no products yet (placeholders)
    "tile-mono": ("incoming/03.jpg", "isnet-general-use", None),
    "tile-compositions": ("incoming/01.jpg", "isnet-general-use", None),
    "tile-gifts": ("incoming/07.jpg", "isnet-general-use", (0, 0, 1150, 1540)),
}


def load_source(path, box):
    im = Image.open(P(path)).convert("RGB")
    if im.size[0] < 500:  # legacy photo: drop the caption band
        im = im.crop((0, LEGACY_CAPTION, im.size[0], im.size[1]))
    if box:
        im = im.crop(box)
    return im


_sessions = {}


def cutout(key, im, model):
    os.makedirs(CACHE, exist_ok=True)
    cache = os.path.join(CACHE, "%s.%s.png" % (key, model))
    if os.path.exists(cache):
        return Image.open(cache).convert("RGBA")
    from rembg import new_session, remove
    if model not in _sessions:
        _sessions[model] = new_session(model)
    out = remove(im, session=_sessions[model]).convert("RGBA")
    # clean faint halo pixels left by the matting
    a = out.getchannel("A").point(lambda v: 0 if v < 24 else v)
    out.putalpha(a)
    out.save(cache)
    return out


def keep_main(alpha, keep=.08):
    """Drop stray specks: keep connected blobs >= `keep` of the largest one."""
    w, h = alpha.size
    f = 4 if max(w, h) > 600 else 2
    small = alpha.resize((w // f, h // f)).point(lambda v: 255 if v > 20 else 0)
    sw, sh = small.size
    px = small.load()
    seen = [[False] * sh for _ in range(sw)]
    blobs = []
    for x0 in range(sw):
        for y0 in range(sh):
            if px[x0, y0] and not seen[x0][y0]:
                stack, pts = [(x0, y0)], []
                seen[x0][y0] = True
                while stack:
                    x, y = stack.pop()
                    pts.append((x, y))
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < sw and 0 <= ny < sh and px[nx, ny] and not seen[nx][ny]:
                            seen[nx][ny] = True
                            stack.append((nx, ny))
                blobs.append(pts)
    if not blobs:
        return alpha
    big = max(len(b) for b in blobs)
    m = Image.new("L", (sw, sh), 0)
    mp = m.load()
    for b in blobs:
        if len(b) >= big * keep:
            for x, y in b:
                mp[x, y] = 255
    m = m.filter(ImageFilter.MaxFilter(5)).resize((w, h)).filter(ImageFilter.GaussianBlur(1.5))
    return ImageChops.multiply(alpha, m)


def key_out(im, tol=34):
    """Remove a plain studio wall by colour distance (for photos the model
    cannot separate, e.g. lilac flowers on a pink wall)."""
    w, h = im.size
    border = [im.getpixel((x, 2)) for x in range(0, w, 3)] + [im.getpixel((2, y)) for y in range(0, h // 2, 3)] + \
             [im.getpixel((w - 3, y)) for y in range(0, h // 2, 3)]
    wall = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    diff = ImageChops.difference(im, Image.new("RGB", im.size, wall)).convert("L")
    a = diff.point(lambda v: 0 if v < tol * .6 else (255 if v > tol else int((v - tol * .6) / (tol * .4) * 255)))
    a = a.filter(ImageFilter.MedianFilter(3))
    out = im.convert("RGBA")
    out.putalpha(keep_main(a))
    return out


def soft_edge(im):
    """Fallback when cut-out fails: keep the photo, dissolve its edges."""
    im = im.convert("RGBA")
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((w * .02, h * .02, w * .98, h * 1.1), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * .09))
    im.putalpha(mask)
    return im


# Backdrops -----------------------------------------------------------------
LIGHT = dict(top=TOP, bottom=BOTTOM, glow=(246, 240, 232), glow_a=38, shadow=(92, 78, 66), shadow_a=110)
# dark botanical, in the site palette (#1E2A23 -> #11100E): splash, editorial, occasions
DARK = dict(top=(34, 46, 39), bottom=(17, 16, 14), glow=(70, 88, 76), glow_a=70, shadow=(0, 0, 0), shadow_a=150)


def backdrop(w, h, style=LIGHT, cx=.5):
    bg = Image.new("RGB", (w, h))
    top, bot = style["top"], style["bottom"]
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        bg.paste(c, (0, y, w, y + 1))
    # soft light behind the subject
    glow = Image.new("L", (w, h), 0)
    gw = min(w, h * .9)
    ImageDraw.Draw(glow).ellipse((w * cx - gw * .45, h * .05, w * cx + gw * .45, h * .75), fill=style["glow_a"])
    glow = glow.filter(ImageFilter.GaussianBlur(gw * .14))
    bg = Image.composite(Image.new("RGB", (w, h), style["glow"]), bg, glow)
    return bg


def compose(subject, w, h, fill_h=.76, fill_w=.84, base=.91, cx=.5, style=LIGHT):
    bbox = subject.getchannel("A").getbbox() or (0, 0) + subject.size
    subject = subject.crop(bbox)
    sw, sh = subject.size
    s = min(h * fill_h / sh, w * fill_w / sw)
    subject = subject.resize((max(1, int(sw * s)), max(1, int(sh * s))), Image.LANCZOS)
    if s > 1.6:  # upscaled legacy photo: recover a little edge definition
        rgb = subject.convert("RGB").filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
        rgb.putalpha(subject.getchannel("A"))
        subject = rgb
    sw, sh = subject.size
    x, y = int(w * cx - sw / 2), int(h * base) - sh

    bg = backdrop(w, h, style, cx).convert("RGBA")
    # floor shadow
    sh_l = Image.new("L", (w, h), 0)
    ImageDraw.Draw(sh_l).ellipse((x + sw * .12, y + sh - sh * .035, x + sw * .88, y + sh + sh * .045), fill=style["shadow_a"])
    sh_l = sh_l.filter(ImageFilter.GaussianBlur(max(w, h) * .018))
    bg = Image.composite(Image.new("RGBA", (w, h), style["shadow"] + (255,)), bg, sh_l)
    bg.alpha_composite(subject, (x, y))
    return bg.convert("RGB")


def save(im, name, q=84):
    im.save(P("assets", "products", name + ".jpg"), "JPEG", quality=q, optimize=True, progressive=True)
    im.save(P("assets", "products", name + ".webp"), "WEBP", quality=q - 4)


def build(key):
    path, model, box = SOURCES[key]
    im = load_source(path, box)
    if model == "key":
        subject = key_out(im)
    elif model:
        subject = cutout(key, im, model)
        subject.putalpha(keep_main(subject.getchannel("A")))
    else:
        subject = soft_edge(im)
    if key.startswith("e"):
        out = compose(subject, 900, 900, fill_h=.74, fill_w=.74, base=.88)
    else:
        out = compose(subject, W, H)
    save(out, key)
    print("ok", key)


# Scene photos: same cut-out treatment, dark botanical backdrop -------------
# key -> (source, model, pre-crop, output path, size, layout)
SCENES = {
    "splash-m":  ("incoming/02.jpg", "isnet-general-use", None, ("hero", "splash-m"), (1110, 2400), dict(fill_h=.36, fill_w=.74, base=.52)),
    "splash-d":  ("incoming/02.jpg", "isnet-general-use", None, ("hero", "splash-d"), (1920, 1080), dict(fill_h=.84, fill_w=.38, base=.95, cx=.77)),
    "editorial": ("incoming/04.jpg", "isnet-general-use", (0, 0, 1206, 1180), ("hero", "editorial"), (1200, 1500), dict(fill_h=.78, fill_w=.86, base=.9)),
    # occasions: 05 cropped so the partner watermark stays out of frame
    "occ-birthday": ("incoming/01.jpg", "isnet-general-use", None, ("occasions", "birthday"), (900, 1125), dict(fill_h=.6, fill_w=.8, base=.72)),
    "occ-her":      ("incoming/08.jpg", "isnet-general-use", None, ("occasions", "her"), (900, 1125), dict(fill_h=.62, fill_w=.8, base=.74)),
    "occ-him":      ("incoming/07.jpg", "isnet-general-use", (0, 0, 1150, 1540), ("occasions", "him"), (900, 1125), dict(fill_h=.64, fill_w=.8, base=.74)),
    "occ-love":     ("incoming/05.jpg", "isnet-general-use", (0, 200, 1206, 1125), ("occasions", "love"), (900, 1125), dict(fill_h=.6, fill_w=.84, base=.72)),
    "occ-thanks":   ("incoming/06.jpg", "isnet-general-use", (0, 0, 1206, 1480), ("occasions", "thanks"), (900, 1125), dict(fill_h=.6, fill_w=.84, base=.72)),
    "occ-noreason": ("incoming/03.jpg", "isnet-general-use", None, ("occasions", "noreason"), (900, 1125), dict(fill_h=.68, fill_w=.8, base=.76)),
}


def build_scene(key):
    src, model, box, out, (w, h), layout = SCENES[key]
    im = load_source(src, box)
    # the cut-out is the same for every use of a photo, so share the cache
    subject = cutout(src.replace("/", "_") + (("_%d_%d_%d_%d" % box) if box else ""), im, model)
    subject.putalpha(keep_main(subject.getchannel("A")))
    img = compose(subject, w, h, style=DARK, **layout)
    path = P("assets", *out)
    img.save(path + ".jpg", "JPEG", quality=84, optimize=True, progressive=True)
    img.save(path + ".webp", "WEBP", quality=80)
    print("ok", key)


if __name__ == "__main__":
    keys = sys.argv[1:] or list(SOURCES) + list(SCENES)
    for k in keys:
        build_scene(k) if k in SCENES else build(k)
