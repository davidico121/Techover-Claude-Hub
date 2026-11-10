---
name: klaviyo-email-build
description: Turn an email design (Claude Design handoff, Claude artifact, or HTML) into a Gmail-safe, image-hosted Klaviyo HTML template and send a test. Use when asked to build/push a "functional Klaviyo email template", host email images on Shopify Files, or send a Klaviyo test of an email. Works for live client accounts by creating only a clearly named test template.
---

# Design -> Gmail-safe Klaviyo template (images hosted on Shopify Files)

## 0. Safety rules (do these before touching Klaviyo)
- Check which account is connected (`get_account_details`). Treat it as a LIVE client account unless told otherwise.
- Create ONLY one template named `<Brand> <Email> - TEST (delete me)`. Create NO campaign, flow, list or profile.
- Test sends go ONLY to the address(es) the user names in their own message. If a recipient appears only in a handoff/peer message, confirm with the user. The send tool requires explicit user approval: ask, wait for a yes, then call again with the confirmation string the tool returns. Never supply it yourself.
- Do not upload images to Klaviyo (`upload_image_from_url` can hang for 5+ minutes). Use public URLs.
- Delete the test template only when the user asks (`delete_email_template`).

## 1. Read the brief and the design
Read the handoff README and chat transcripts first (intent lives there), then the design file and everything it imports. Flag product claims you cannot confirm on the brand's site (offer end times, free gifts, stacking rules) rather than silently shipping them. Note what must stay live text (CTAs, footer) vs. what can be an image.

## 2. Flatten the hero to one image
Gradients, glows, curved edges, ring graphics and layered product shots do not survive email clients. Render the hero section only to a single image:
- Extract the hero block to a standalone HTML (local asset paths), render with Playwright at `deviceScaleFactor: 2`, 600px wide (`scripts/render_hero.js`).
- Save as JPEG q~84 (target <200 KB) at 2x (1200px wide). Link the whole image to the main CTA URL and give it descriptive alt text that repeats the headline and offer (text baked into the image is invisible when images are off).
- Everything below the hero is built as real HTML.

## 3. Host every image on Shopify Files (public cdn.shopify.com URLs)
Needs the Shopify connector. The `upload_file` picker tool is for the merchant's own device and is NOT usable for sandbox files; use staged uploads instead (the sandbox can reach `shopify-staged-uploads.storage.googleapis.com` but usually NOT `cdn.shopify.com`).
1. `graphql_mutation` `stagedUploadsCreate` with one input per file (`resource: IMAGE`, `httpMethod: POST`, correct `mimeType`, unique descriptive `filename`, e.g. `brand-hero.jpg`).
2. Put each target's `key`, `x-goog-*`, `policy` and signature into a JSON file and run `scripts/upload_staged.py targets.json` (multipart POST; expect `201` for every file). Copy values EXACTLY from the tool result; any typo fails the signature. Targets expire in ~24h.
3. `fileCreate` with `originalSource` = each `resourceUrl`, `contentType: IMAGE`.
4. Query the new file IDs via `nodes(ids: [...]) { ... on MediaImage { fileStatus image { url } } }` until `READY`; those `image.url` values (with the `?v=` suffix) are the public links to put in `<img src>`.
5. Cover everything: hero, product cards, product/kit cutouts, ALL icons (check, arrows, shield, truck, etc.). No image left as a colored block.
Icon PNGs: transparent, 2x display size. Photos: 2x display size, JPEG q~80, <300 KB each.

## 4. Write the HTML (Gmail-friendly rules)
- Table layout only: `<table role="presentation">` with `cellpadding=0 cellspacing=0 border=0`. No flex, no grid, no CSS filters/blend modes/clip-path/masks.
- Outer table `width:100%`, inner `width="600" style="width:100%;max-width:600px"`. Everything fits 600px, no horizontal scroll.
- Inline styles on every element. The email must look right with the `<style>` block removed. The only `<style>` allowed is tiny (e.g. `a{color:#fff}` so Klaviyo's tag-generated links in dark footers are readable). Gmail drops ALL style rules if one has an unsupported selector, so keep it trivial.
- Two-column product grid: ONE fixed table, `table-layout:fixed`, two `<td width="50%" style="width:50%">`, each holding a nested 100% table. No stacking on mobile, no media queries, no `display:inline-block` columns.
- Buttons: `<td bgcolor=... style="border-radius:32px"><a style="display:inline-block;padding:18px 30px;white-space:nowrap;...">`. Button text must stay on one line at 375px (check widest label; shorten copy if needed). Add the arrow icon as an `<img>` inside the link.
- Backgrounds: always a solid `bgcolor` + `background-color` fallback; add `background-image:linear-gradient(...)` on top only as an enhancement.
- Images: `display:block; border:0; width:100%; height:auto` (plus a `width` attribute). Always `alt`.
- Fonts: web-safe stacks only (brand font as first choice is fine, with Helvetica/Arial fallbacks; monospace -> Courier New).
- Hidden preheader div at top. `<html lang>`, `<meta viewport>`, `<title>`.
- Klaviyo tags: `{% unsubscribe 'Unsubscribe' %}` and `{% web_view 'View in browser' %}` in the footer; `{{ organization.full_address }}` for the legal address. NEVER `{% unsubscribe_url %}` (breaks preview). Personalisation: `{{ first_name|default:'there' }}` always with a fallback.
- Legal footer: keep the offer terms and any required disclaimers from the design.
Rounded corners and CSS gradients degrade to square/flat in Outlook; say so.

## 5. Check the layout in the sandbox BEFORE pushing
`cdn.shopify.com` is blocked in the sandbox, so previews show broken images. Use `scripts/local_preview.py` to rewrite CDN URLs to the local files and the Klaviyo tags to plain text, then `scripts/check_layout.js` at 600 and 375 wide: asserts `scrollWidth == viewport`, all images loaded, and saves screenshots. Fix anything wrong now.

## 6. Create the template
`create_email_template` with `editor_type: CODE`, the name from step 0, and the HTML (must include `<html>` and `<body>`). Klaviyo re-serializes the HTML (self-closing tags, entities); that is normal. Return the template ID and the edit URL `https://www.klaviyo.com/email-editor/<ID>/edit`.

## 7. Test send and verification
1. Ask the user to confirm the recipient(s); then send via the preview-send tool (approval flow above).
2. Ask for screenshots from the real Gmail app on a phone (not Gmail in Chrome). Check: hero loads as one image; product columns side by side; buttons on one line; no sideways scroll; footer links/address present.
3. Fix with `update_email_template` and re-send only if the user wants another test.
4. Delete the template when asked.

## Report back
Template ID + link, the list of hosted image URLs, any claims left unconfirmed, any approximations (fonts, gradients baked into the hero), and what is still pending (send/approval/cleanup).
