#!/usr/bin/env python3
"""Turn a Claude Design .dc.html (or any HTML with relative assets) into a self-contained HTML for html_to_figma.
Usage: python3 -I make_static_html.py <input.html> <project_root> <output.html> [root_marker]
- cuts from root_marker (default: <div id="email") to </x-dc> or </body>
- removes <sc-if>/<sc-else> wrapper tags (keeps content; edit toggles by hand if needed)
- inlines every src="relative/path" as a base64 data URI
"""
import re, sys, base64, os
inp, root, outp = sys.argv[1:4]
marker = sys.argv[4] if len(sys.argv) > 4 else '<div id="email"'
src = open(inp).read()
a = src.index(marker)
b = src.find('</x-dc>'); b = b if b != -1 else src.find('</body>')
body = re.sub(r'</?sc-(if|else)[^>]*>', '', src[a:b])
mime = {'png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','svg':'image/svg+xml','webp':'image/webp'}
def emb(m):
    p = m.group(1)
    if p.startswith(('http', 'data:')): return m.group(0)
    ext = p.rsplit('.', 1)[1].lower()
    return 'src="data:%s;base64,%s"' % (mime[ext], base64.b64encode(open(os.path.join(root, p), 'rb').read()).decode())
body = re.sub(r'src="([^"]+)"', emb, body)
open(outp, 'w').write('<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0}</style></head><body>' + body + '</body></html>')
print(os.path.getsize(outp) / 1e6, "MB")
