"""La Fleur — product photo pipeline (ТЗ §16–18).

Every product photo is rebuilt on one template so the catalogue reads as a
single photo session:

  * 1200 x 1500 (4:5), warm stone studio backdrop, soft floor shadow
  * bouquet cut out (rembg) and placed centred, ~76% of the frame height
  * the bouquet itself is never recoloured, redrawn or edited

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


def backdrop(w, h):
    bg = Image.new("RGB", (w, h))
    top, bot = TOP, BOTTOM
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        bg.paste(c, (0, y, w, y + 1))
    # soft light behind the subject
    glow = Image.new("L", (w, h), 0)
    ImageDraw.Draw(glow).ellipse((w * .1, h * .05, w * .9, h * .75), fill=38)
    glow = glow.filter(ImageFilter.GaussianBlur(w * .12))
    bg = Image.composite(Image.new("RGB", (w, h), (246, 240, 232)), bg, glow)
    return bg


def compose(subject, w, h, fill_h=.76, fill_w=.84, base=.91):
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
    x, y = (w - sw) // 2, int(h * base) - sh

    bg = backdrop(w, h).convert("RGBA")
    # floor shadow
    sh_l = Image.new("L", (w, h), 0)
    ImageDraw.Draw(sh_l).ellipse((x + sw * .12, y + sh - sh * .035, x + sw * .88, y + sh + sh * .045), fill=110)
    sh_l = sh_l.filter(ImageFilter.GaussianBlur(w * .022))
    bg = Image.composite(Image.new("RGBA", (w, h), (92, 78, 66, 255)), bg, sh_l)
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


def build_scenes():
    """Splash, editorial and occasion photos keep their real environment."""
    inc = lambda n: Image.open(P("incoming", n)).convert("RGB")

    def crop_4x5(im):
        w, h = im.size
        if w / h > .8:
            nw = int(h * .8)
            return im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
        nh = int(w * 1.25)
        return im.crop((0, (h - nh) // 2, w, (h + nh) // 2))

    def out(im, path, width=None, q=82):
        if width and im.size[0] > width:
            im = im.resize((width, int(im.size[1] * width / im.size[0])), Image.LANCZOS)
        im.save(path + ".jpg", "JPEG", quality=q, optimize=True, progressive=True)
        im.save(path + ".webp", "WEBP", quality=q - 4)

    im = inc("02.jpg")
    out(im.crop((0, 120, 1206, 1500)), P("assets", "hero", "splash-m"))
    out(im.crop((0, 330, 1206, 1010)), P("assets", "hero", "splash-d"))
    out(inc("04.jpg").crop((0, 150, 1206, 1500)), P("assets", "hero", "editorial"))
    occ = {  # 05 is cropped so the partner watermark stays out of frame
        "birthday": ("01.jpg", (0, 180, 1206, 1600)),
        "her": ("08.jpg", (60, 120, 1160, 1391)),
        "him": ("07.jpg", (0, 300, 1080, 1440)),
        "love": ("05.jpg", (60, 0, 940, 1100)),
        "thanks": ("06.jpg", (0, 330, 1206, 1480)),
        "noreason": ("03.jpg", (0, 150, 1206, 1597)),
    }
    for k, (f, box) in occ.items():
        out(crop_4x5(inc(f).crop(box)), P("assets", "occasions", k), width=900)


if __name__ == "__main__":
    keys = sys.argv[1:] or list(SOURCES)
    for k in keys:
        build(k)
    if not sys.argv[1:]:
        build_scenes()
