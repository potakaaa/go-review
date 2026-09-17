# Social post templates

Announcement graphics for Facebook, built from the same tokens, fonts and
product cutouts as the site so a post looks like it came from the same place.

- `landscape.html` — 1200×630 (link previews and landscape feed posts)
- `square.html` — 1080×1080 (takes more vertical space in a mobile feed)

## Regenerating

These are captured from a browser rather than generated headlessly, because
`backdrop-filter` is what makes the glass panel read as a material and no
server-side renderer supports it.

1. Serve the repo root: `python3 -m http.server 8899`
2. Open `http://127.0.0.1:8899/tools/social/landscape.html`
3. Screenshot the `#poster` element and scale the result to its exact size.

The poster is pinned to the top-left at its true pixel size, so a screenshot
region starting at (0, 0) maps straight onto the output. For the square, the
1080px height exceeds a typical viewport, so capture it in two passes and join
them — the layout is static, so there is nothing to desynchronise.

Edit the copy directly in the HTML; everything else is shared with the site.
