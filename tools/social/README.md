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

## Fonts for server-rendered graphics

The analytics milestone card (`/dashboard/analytics/share-image`) is rendered
by Satori, which reads `ttf`/`otf` but not the `woff2` the site serves to
browsers. So `public/fonts` also carries three static instances, subset to
printable ASCII plus `· — ’ → ↗ ₱`, of the same two families:

- `inter-regular.ttf` (wght 400) and `inter-semibold.ttf` (wght 600)
- `bitcount-medium.ttf` (wght 500), the display face for the number

Regenerate them with `fonttools` (`pip install fonttools brotli`) if the source
`woff2` files change:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

CHARS = "".join(chr(c) for c in range(0x20, 0x7F)) + "·—’→↗₱"

def make(src, out, wght):
    f = instantiateVariableFont(TTFont(src), {"wght": wght}, overlap=True)
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    s = subset.Subsetter(options=options)
    s.populate(text=CHARS)
    s.subset(f)
    f.flavor = None
    f.save(out)

make("public/fonts/inter-latin.woff2", "public/fonts/inter-regular.ttf", 400)
make("public/fonts/inter-latin.woff2", "public/fonts/inter-semibold.ttf", 600)
make("public/fonts/bitcount-prop-single-latin.woff2", "public/fonts/bitcount-medium.ttf", 500)
```
