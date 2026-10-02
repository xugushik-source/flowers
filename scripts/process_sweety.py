"""Sweety Buket — photo pipeline.

Reuses the La Fleur template (scripts/process_images.py): every bouquet is
cut out and placed on one backdrop so the catalogue reads as one shoot.
Products: warm blush studio. Occasion tiles: deep plum.

    python3 scripts/process_sweety.py            # everything
    python3 scripts/process_sweety.py roses-12345  # one product key

Sources live in sweetybuket/src/<key>.jpg (downscaled originals from
Instagram @sweetybuket). The product list is sweetybuket/assets/js/data.js;
SOURCES below must contain every product key used there.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import process_images as base  # noqa: E402
from PIL import Image  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "sweetybuket")
base.CACHE = os.path.join(ROOT, "scripts", ".cache", "sweety")

BLUSH = dict(top=(240, 228, 225), bottom=(222, 204, 201), glow=(252, 244, 242), glow_a=40, shadow=(110, 80, 80), shadow_a=105)
PLUM = dict(top=(52, 30, 40), bottom=(18, 12, 15), glow=(92, 56, 70), glow_a=70, shadow=(0, 0, 0), shadow_a=150)

MODEL = "isnet-general-use"

# occasion tile -> product key whose cut-out is reused on the plum backdrop
OCCASIONS = {
    "birthday": "box-58109",
    "her": "pions-58736",
    "love": "box-48351",
    "thanks": "mono-74587",
    "noreason": "mono-04608",
    "sweet": "sweets-45389",
}


def product_keys():
    return sorted(os.path.splitext(f)[0] for f in os.listdir(os.path.join(SITE, "src"))
                  if f.endswith(".jpg") and not f.startswith("reel"))


def subject_for(key):
    im = Image.open(os.path.join(SITE, "src", key + ".jpg")).convert("RGB")
    s = base.cutout(key, im, MODEL)
    s.putalpha(base.keep_main(s.getchannel("A")))
    return s


def save(img, path, q=84):
    img.save(path + ".jpg", "JPEG", quality=q, optimize=True, progressive=True)
    img.save(path + ".webp", "WEBP", quality=q - 4)


def build_product(key):
    img = base.compose(subject_for(key), 1200, 1500, fill_h=.8, fill_w=.86, base=.93, style=BLUSH)
    save(img, os.path.join(SITE, "assets", "products", key))
    print("ok", key)


def build_occasion(name, key):
    img = base.compose(subject_for(key), 900, 1125, fill_h=.62, fill_w=.82, base=.74, style=PLUM)
    save(img, os.path.join(SITE, "assets", "occasions", name), q=82)
    print("ok occasion", name)


def build_posters():
    """Video posters: first frame covers from Instagram, resized."""
    for f in sorted(os.listdir(os.path.join(SITE, "src"))):
        if f.startswith("reel"):
            im = Image.open(os.path.join(SITE, "src", f)).convert("RGB")
            im.thumbnail((720, 1280))
            save(im, os.path.join(SITE, "assets", "video", os.path.splitext(f)[0]), q=80)


if __name__ == "__main__":
    keys = sys.argv[1:] or product_keys()
    for k in keys:
        build_product(k)
    if not sys.argv[1:]:
        for n, k in OCCASIONS.items():
            build_occasion(n, k)
        build_posters()
