"""Rebuild site imagery from source photos.

Product photos: the legacy images are 341x255 with caption text burned into
the top band. We cut that band, then extend the soft studio wall upward to a
4:5 frame so every card shares one proportion. The bouquet itself is never
altered. Replace files in assets/products/src/ with real photos (any size)
and re-run: `python3 scripts/process_images.py`.
"""
from PIL import Image, ImageFilter
import glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
TOP_CUT = 58  # px band with burned-in captions on the legacy images


def to_4x5(im):
    w, h = im.size
    if w / h <= 0.8 + 1e-3:  # already portrait: centre crop to 4:5
        nh = int(w * 5 / 4)
        top = max(0, (h - nh) // 2)
        return im.crop((0, top, w, top + nh)) if h >= nh else im
    # legacy landscape: trim caption band + sides, extend wall upward
    im = im.crop((int(w * 0.12), TOP_CUT, w - int(w * 0.12), h))
    w, h = im.size
    nh = int(w * 5 / 4)
    # wall colour = median of light, low-saturation pixels near the top
    import colorsys
    wall = []
    for (r, g, b_) in im.crop((0, 0, w, 30)).resize((w // 2, 15)).get_flattened_data():
        hh, ll, ss = colorsys.rgb_to_hls(r / 255, g / 255, b_ / 255)
        if ll > .72 and ss < .45:
            wall.append((r, g, b_))
    wall = wall or [(234, 222, 218)]
    col = tuple(sorted(c[i] for c in wall)[len(wall) // 2] for i in range(3))
    out = Image.new("RGB", (w, nh), col)
    out.paste(im, (0, nh - h))
    # feather only the seam line (16px) so the wall reads as one surface
    seam = 16
    mask = Image.linear_gradient("L").resize((w, seam))
    region = out.crop((0, nh - h, w, nh - h + seam))
    out.paste(Image.composite(region, Image.new("RGB", (w, seam), col), mask), (0, nh - h))
    return out


def crop_4x5(im):
    """Plain centre crop to 4:5 for high-res photos."""
    w, h = im.size
    if w / h > 0.8:
        nw = int(h * 0.8)
        return im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    nh = int(w * 1.25)
    return im.crop((0, (h - nh) // 2, w, (h + nh) // 2))


def save(im, path, width=None, q=84):
    if width and im.size[0] > width:
        im = im.resize((width, int(im.size[1] * width / im.size[0])), Image.LANCZOS)
    im.save(path + ".jpg", "JPEG", quality=q, optimize=True, progressive=True)
    im.save(path + ".webp", "WEBP", quality=q - 4)


def main():
    src_dir = P("assets", "products", "src")
    for f in sorted(glob.glob(os.path.join(src_dir, "*.jpg"))):
        name = os.path.splitext(os.path.basename(f))[0]
        im = Image.open(f).convert("RGB")
        if name.startswith("e"):  # add-on thumbnails: square, no caption band
            w, h = im.size
            s = min(w, h)
            im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
        else:
            im = to_4x5(im)
        save(im, P("assets", "products", name), width=1200)

    inc = lambda n: Image.open(P("incoming", n)).convert("RGB")
    # Splash: portrait (mobile) + landscape (desktop) crops of the white-rose dome
    im = inc("02.jpg")
    save(im.crop((0, 120, 1206, 1500)), P("assets", "hero", "splash-m"), q=82)
    save(im.crop((0, 330, 1206, 1010)), P("assets", "hero", "splash-d"), q=82)
    # Editorial block
    save(inc("04.jpg").crop((0, 150, 1206, 1500)), P("assets", "hero", "editorial"), q=82)
    # Occasion tiles (4:5). 05 cropped to keep the partner watermark out of frame.
    occ = {
        "birthday": ("01.jpg", (0, 180, 1206, 1600)),
        "her": ("08.jpg", (60, 120, 1160, 1391)),
        "him": ("07.jpg", (0, 300, 1080, 1440)),
        "love": ("05.jpg", (60, 0, 940, 1100)),
        "thanks": ("06.jpg", (0, 330, 1206, 1480)),
        "noreason": ("03.jpg", (0, 150, 1206, 1597)),
    }
    for k, (f, box) in occ.items():
        save(crop_4x5(inc(f).crop(box)), P("assets", "occasions", k), width=900, q=82)


if __name__ == "__main__":
    main()
