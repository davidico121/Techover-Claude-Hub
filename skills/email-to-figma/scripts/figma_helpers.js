// Paste at the top of each use_figma call that builds layers (plain JS, top-level await).
// Fonts: verify style names first with figma.listAvailableFontsAsync().
const FONT = { reg:{family:"Inter",style:"Regular"}, semi:{family:"Inter",style:"Semi Bold"}, bold:{family:"Inter",style:"Bold"}, mono:{family:"Roboto Mono",style:"Regular"} };
for (const f of Object.values(FONT)) await figma.loadFontAsync(f);
const hex = (h, a) => { const n = parseInt(h.slice(1),16); const c = {r:((n>>16)&255)/255, g:((n>>8)&255)/255, b:(n&255)/255}; if (a !== undefined) c.a = a; return c; };
const solid = (h, a) => ({ type:'SOLID', color: hex(h), opacity: a === undefined ? 1 : a });
// affine inverse -> Figma gradientTransform
const inv = (a,b,c,d,e,f) => { const det = a*e - b*d; return [[e/det, -b/det, (b*f - c*e)/det],[-d/det, a/det, (c*d - a*f)/det]]; };
// CSS linear-gradient(deg, ...) on a W x H box. stops: [{position:0..1, color: hex(h,a)}]
const linear = (deg, W, H, stops) => { const t = deg*Math.PI/180, dx = Math.sin(t), dy = -Math.cos(t); const L = Math.abs(W*Math.sin(t)) + Math.abs(H*Math.cos(t)); const sx = W/2 - dx*L/2, sy = H/2 - dy*L/2, ex = W/2 + dx*L/2, ey = H/2 + dy*L/2; const px = -dy*L, py = dx*L; const a=(ex-sx)/W, d=(ey-sy)/H, b=px/W, e=py/H, c=sx/W-b/2, f=sy/H-e/2; return { type:'GRADIENT_LINEAR', gradientTransform: inv(a,b,c,d,e,f), gradientStops: stops }; };
// CSS radial: center (cx,cy) and radii (rx,ry) as fractions of the box
const radial = (cx, cy, rx, ry, stops) => ({ type:'GRADIENT_RADIAL', gradientTransform: inv(2*rx,0,cx-rx,0,2*ry,cy-ry), gradientStops: stops });
const created = [];
const mk = (n, parent) => { if (parent) parent.appendChild(n); created.push(n.id); return n; };
const rect = (name, parent, x, y, w, h, fills, r) => { const n = figma.createRectangle(); n.name = name; n.resize(w,h); n.x = x; n.y = y; n.fills = fills; if (r !== undefined) n.cornerRadius = r; return mk(n, parent); };
const ell = (name, parent, x, y, w, h, fills, stroke) => { const n = figma.createEllipse(); n.name = name; n.resize(w,h); n.x = x; n.y = y; n.fills = fills; if (stroke) { n.strokes = [solid(stroke)]; n.strokeWeight = 1; n.strokeAlign = 'INSIDE'; } return mk(n, parent); };
const slot = (name, parent, w, h, x, y) => { const n = figma.createRectangle(); n.name = name; n.resize(w,h); n.fills = []; if (x !== undefined) { n.x = x; n.y = y; } return mk(n, parent); };
const txt = (str, parent, o) => { const t = figma.createText(); t.fontName = FONT[o.f || 'reg']; t.characters = str; t.fontSize = o.s || 16; t.fills = [solid(o.c || '#000000')]; if (o.ls !== undefined) t.letterSpacing = { unit:'PIXELS', value:o.ls }; if (o.lh !== undefined) t.lineHeight = { unit:'PIXELS', value:o.lh }; t.textAlignHorizontal = o.a || 'LEFT'; if (o.name) t.name = o.name; if (o.u) t.textDecoration = 'UNDERLINE'; if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height); } if (parent) parent.appendChild(t); if (o.x !== undefined) { t.x = o.x; t.y = o.y; } created.push(t.id); return t; };
const al = (name, dir, parent, o = {}) => { const f = figma.createAutoLayout(dir); f.name = name; f.fills = o.fill ? [solid(o.fill)] : []; if (o.gap !== undefined) f.itemSpacing = o.gap; if (o.p) { f.paddingTop = o.p[0]; f.paddingRight = o.p[1]; f.paddingBottom = o.p[2]; f.paddingLeft = o.p[3]; } if (o.r !== undefined) f.cornerRadius = o.r; if (o.cross) f.counterAxisAlignItems = o.cross; if (o.main) f.primaryAxisAlignItems = o.main; if (parent) parent.appendChild(f); created.push(f.id); return f; };
// Image fill from base64 (validate first!)
const toBytes = (b64) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; };
const setImage = (node, b64) => { const img = figma.createImage(toBytes(b64)); node.fills = [{ type:'IMAGE', imageHash: img.hash, scaleMode:'FILL' }]; };
