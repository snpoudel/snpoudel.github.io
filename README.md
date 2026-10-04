# Website — Edit Guide

Live at **https://snpoudel.github.io/**. Plain HTML/CSS/JS, served by GitHub Pages. No build step.

## Files

| File | Purpose |
|---|---|
| `index.html` | All visible content: intro, research, news, experience, contact |
| `publications.json` | Every paper shown in the Publications section |
| `update_publications.py` | Adds new papers from Google Scholar to `publications.json` |
| `style.css` | Colors, fonts, layout (colors are at the top in `:root`) |
| `script.js` | Navigation, dark mode, publication rendering |
| `images/profile.png` | Profile photo |
| `images/favicon.svg` | Browser tab icon |

---

## Common edits

Search `index.html` for the `EDIT:` comments.

**Bio / intro**: search `EDIT: intro`. The "Featured in" line is there too.

**News item** (press and features only): search `EDIT: news`. Copy an `<li>` block to the top (newest first):
```html
<li>
  <time datetime="2026-11">Nov 2026</time>
  <p><span class="outlet">Outlet name</span> <a href="URL" target="_blank" rel="noopener">Headline</a></p>
</li>
```
Keep three visible; move older ones into the `<div class="more">` below and update the `+N` on the "Earlier news" button.

**Research project**: search `EDIT: research`. Each `<article class="project">` has a meta line (place · years), a short title, one or two plain paragraphs (one study per paragraph), and links. Use `<span class="status">Manuscript in preparation</span>` when there's nothing to link yet. The first three are always visible; extra ones go inside `<div class="more">` (update the `+N` on the "More research" button). Keep visible projects in reverse-chronological order.

**Job or degree**: search `EDIT: experience`. Copy an `<li class="row">` block (newest first).

**Profile photo**: replace `images/profile.png` (keep the filename).

---

## Publications

Run this whenever you have a new paper:
```bash
pip install scholarly   # one-time setup
python update_publications.py
```
The site shows the **5 most recent papers**; older ones and preprints sit behind the "All publications" button. Conference abstracts stay in the file with `"hidden": true` so the script doesn't re-add them, but they aren't shown.

The script only **adds** papers that aren't listed yet. It never deletes entries or touches links you added by hand. It also lists any paper whose Scholar venue changed (e.g. a preprint that got published) so you can update that entry.

Each entry in `publications.json` looks like:
```json
{
  "type": "journal",
  "title": "Paper title",
  "authors": ["S. Poudel", "S. Steinschneider"],
  "year": 2026,
  "venue": "Journal of Hydrology",
  "details": "640, 131234",
  "url": "https://doi.org/...",
  "links": [
    { "label": "Code",  "url": "https://github.com/..." },
    { "label": "Press", "url": "https://..." }
  ]
}
```
- `type` is `journal`, `preprint`, or `conference`. Journal articles come first, then preprints.
- Add `"hidden": true` to keep an entry off the site.
- `S. Poudel` is bolded automatically.
- `links` adds small buttons under the paper (code, data, press, slides…).

---

## Preview locally

```bash
python3 -m http.server 8000
```
Then open http://localhost:8000. (Opening `index.html` directly won't load publications, because browsers block `fetch` from `file://`.)

## Publish

```bash
git add -A
git commit -m "Brief description"
git push
```
GitHub Pages updates within about a minute.
