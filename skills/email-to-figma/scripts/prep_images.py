#!/usr/bin/env python3
"""Shrink email assets so they can be embedded as base64 in a use_figma call.
Usage: python3 -I prep_images.py <src_dir> <out_dir> [--display name=WxH ...]
PNG -> quantized (<=48 colors, alpha kept). JPG -> resized, quality 58.
Writes manifest.json: {file: {bytes, b64_len}}.
"""
import sys, os, json, base64
from PIL import Image

def main():
    src, out = sys.argv[1], sys.argv[2]
    disp = {}
    for a in sys.argv[3:]:
        if a.startswith("--display"): continue
        if "=" in a:
            n, wh = a.split("="); w, h = wh.lower().split("x"); disp[n] = (int(w), int(h))
    os.makedirs(out, exist_ok=True)
    man = {}
    for f in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(f); ext = ext.lower()
        if ext not in (".png", ".jpg", ".jpeg"): continue
        im = Image.open(os.path.join(src, f))
        w, h = disp.get(stem) or disp.get(f) or (min(im.width, 252 if im.width > 120 else im.width), None)
        if h is None: h = round(im.height * w / im.width)
        if ext == ".png":
            im = im.convert("RGBA").resize((w, h), Image.LANCZOS)
            colors = 12 if w <= 64 else 48
            im = im.quantize(colors=colors, method=Image.FASTOCTREE, dither=Image.NONE)
            dst = os.path.join(out, stem + ".png"); im.save(dst, optimize=True)
        else:
            im = im.convert("RGB").resize((w, h), Image.LANCZOS)
            dst = os.path.join(out, stem + ".jpg"); im.save(dst, quality=58, optimize=True)
        b = open(dst, "rb").read()
        man[os.path.basename(dst)] = {"bytes": len(b), "b64_len": len(base64.b64encode(b)), "size": [w, h]}
    json.dump(man, open(os.path.join(out, "manifest.json"), "w"), indent=2)
    tot = sum(v["bytes"] for v in man.values())
    print(json.dumps(man, indent=2)); print("total bytes:", tot)
    if tot > 60000: print("WARNING: over ~60 KB; shrink further (smaller sizes / fewer colors).")

main()
