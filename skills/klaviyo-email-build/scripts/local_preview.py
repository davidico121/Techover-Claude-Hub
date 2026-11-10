#!/usr/bin/env python3
"""Make a sandbox-previewable copy of the email HTML.
Usage: python3 -I local_preview.py <email.html> <assets_dir> <out.html> [org_address]
- rewrites https://cdn.shopify.com/.../files/<name>?v=N  ->  file://<assets_dir>/<name>
  (put a local copy of every hosted image in assets_dir with the SAME filename)
- replaces {% tag 'Label' %} with Label and {{ organization.full_address }} with org_address
"""
import re, sys, os
src, assets, out = sys.argv[1:4]
addr = sys.argv[4] if len(sys.argv) > 4 else "123 Example St, City"
h = open(src).read()
h = re.sub(r"https://cdn\.shopify\.com/s/files/[^\"']+/files/([^?\"']+)(\?v=\d+)?", lambda m: "file://" + os.path.join(os.path.abspath(assets), m.group(1)), h)
h = re.sub(r"\{%\s*[a-z_]+\s*'([^']*)'\s*%\}", r"\1", h)
h = h.replace("{{ organization.full_address }}", addr)
open(out, "w").write(h); print("wrote", out)
