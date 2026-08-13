# CLAUDE.md

Context for Claude Code working in this repo. Read this first.

## What this repo is

`machine-room` is a collection of single-file, no-build, client-side web tools by
Ryan Seslow, hosted on GitHub Pages at `https://ryanseslow.github.io/machine-room/`.
Each tool is one self-contained `.html` file: all CSS and JS inline, no bundler,
no backend, no API keys. Nothing leaves the user's browser.

| File | URL | Purpose |
|------|-----|---------|
| `kistvaen.html` | `/machine-room/kistvaen.html` | Reads embedded thumbnails from ZIP-based creative files (.sketch, .procreate, .dn, .key, etc.) |
| `ruderal.html` | `/machine-room/ruderal.html` | Finds live-but-outdated Brooklyn business websites (5+ yrs old) as redesign leads |

## Naming rule, read before you name anything

This repo was renamed on 2026-08-13 because Claude had shipped names that were
already taken. `Peekable` was a shipped iOS tweak on Packix. `Brooklyn Lead Finder`
was a saturated commercial category with a trademarked Lead Finder™ in it.
`Midden`, proposed as the replacement, was taken on both PyPI and npm by developer
tools. The rename broke a live GitHub Pages URL and cost a public repo rename.

Do not propose or ship a name until all four checks pass, and show Ryan the results:

    curl -s -o /dev/null -w "%{http_code}" https://pypi.org/pypi/NAME/json    # 404 = free
    curl -s -o /dev/null -w "%{http_code}" https://registry.npmjs.org/NAME    # 404 = free
    curl -s "https://api.github.com/search/repositories?q=NAME+in:name&per_page=1" | grep total_count
    web search for "NAME app" and "NAME software"

Every common English word is gone on both registries. bitrot, patina, cobweb,
marquee, sluice, lacquer, placer and palimpsest were all tested and all taken.
Obscure or archaic words are what is left, which is why `kistvaen` (a sealed stone
burial chamber) and `ruderal` (a plant that colonizes neglected ground) came back
clean at 0 and 12 GitHub hits respectively. The name should describe the tool's
actual behavior through the metaphor, not just sound unusual.

## Conventions (follow these)

- One HTML file per tool. No `package.json`, no build step, no framework.
- Inline everything. Styles in a `<style>` block, logic in a `<script>` block.
- Dark theme. Background `#111`, cards `#181818`, borders `#262626`, text `#ddd`,
  accent blue `#5b8dd9`. Match the existing look.
- No API keys, no backend, no tracking. Only free/keyless public APIs, called
  directly from the browser. If a feature needs a key or a server, flag it to the
  user instead of adding it silently.
- Graceful degradation. External services (proxies, public APIs) fail often;
  always keep the tool usable and tell the user what happened.
- `"use strict";` at the top of scripts. Escape any user/remote strings before
  inserting into HTML (see `esc()` in ruderal.html).
- Prose in the README follows Ryan's house style: no em dashes, no scattered bold,
  and "e-mail" rather than "email".

## ruderal.html architecture

A three-stage pipeline, all client-side:

1. Discover. `POST` to the OpenStreetMap Overpass API (`runOverpass`, `buildQuery`).
   Scoped to Brooklyn (Kings County area id `3600369518`) or a neighborhood bounding
   box (`NEIGHBORHOODS`), filtered by business type (`CATEGORY_FILTERS`). Returns
   businesses tagged with `website`: name, address, phone, category. Social-only
   "websites" (facebook/instagram/yelp/etc.) are dropped in `parseElements`.
2. Age gate. `checkAge` queries the Wayback Machine CDX API for each domain's
   earliest and latest snapshot. "Old" means first archived at least
   `OLD_THRESHOLD_YEARS` (5) years ago. This is CORS-friendly and the reliable part.
3. Live scan. `fetchHtml` pulls the live page through public CORS proxies
   (`PROXIES`, tried in order). `scanHtml` detects outdated-tech signals (no
   viewport, no HTTPS, Flash, `<marquee>`/`<font>`/framesets, table layouts, old
   jQuery, FrontPage/Dreamweaver, stale copyright, "best viewed in IE"). Each flag
   has a weight `w`; `computeScore` combines flag weights and age into a 0 to 100
   opportunity score.

`analyzeLead` runs stages 2 and 3 per lead; `runPool` throttles to `CONCURRENCY` (3)
at a time and re-renders as results arrive. `qualifies()` means old AND at least one
outdated flag AND not confirmed down.

### Known fragility

- CORS proxies get rate-limited. When they do, `scanHtml` sees no HTML, flags come
  back empty, and sites will not qualify even when they are old. The Wayback age gate
  still works. The UI warns the user and suggests retrying or loosening the filter.
  If you improve one thing, make the live fetch more resilient: more proxy fallbacks,
  or an optional user-supplied proxy.
- Overpass has rate limits and rotating endpoints (`OVERPASS_ENDPOINTS`, tried in
  order). Whole-borough queries are capped server-side at 400 elements.

## kistvaen.html and kistvaen_batch.py

`kistvaen.html` uses JSZip to read ZIP archives in the browser, checking 20+ known
thumbnail paths (`THUMB_PATHS`) before falling back to any image in the archive.

`kistvaen_batch.py` is the headless port for whole archives. Same thumbnail paths,
Python's `zipfile` in place of JSZip, plus two more engines: `sips` for raster and
`sips`/`qlmanage` for Adobe and vector formats. Public API is `thumb_for(src, dst, px)`
and `which_engine(ext)`. Output defaults to `kistvaen-thumbs/` and is gitignored.
Resumable: rerunning skips anything already rendered. macOS only.

## Testing note

The web tools depend on external hosts (overpass-api.de, web.archive.org, the CORS
proxies, the JSZip CDN). Test by opening the file in a real browser; a headless or
sandboxed environment may have egress blocked, and `file://` URLs are blocked by the
browser automation tooling, so serve the folder over `python3 -m http.server` instead.
`node --check` the extracted script for syntax. For the Python side,
`python3 -m py_compile kistvaen_batch.py` and run it against a folder of real files.

## Backlog / ideas (not yet built)

- More resilient live-page fetch (additional proxies, retry/backoff, or a
  user-pasteable proxy URL).
- Other boroughs / arbitrary city (parameterize the Overpass area + bboxes).
- Live SSL-certificate / HTTP-status check separate from the HTML scan.
- Persist saved / dismissed leads in `localStorage` across sessions.
- An `index.html` landing page for the Machine Room listing every tool.
- PageSpeed/Lighthouse-style perf signal (would need an API key, ask first).

## Running locally

It is static HTML, so open the file in a browser:

    open kistvaen.html            # macOS
    # or serve it (nicer for some browser APIs)
    python3 -m http.server 8000   # then visit http://localhost:8000/kistvaen.html

## Git

- Default branch: `main`. Ask before committing/pushing; branch off `main` for
  changes rather than committing directly to it.
- GitHub Pages serves from the repo, so anything merged to `main` goes live at the
  URLs above.
