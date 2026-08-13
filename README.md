# Machine Room

Single-file browser tools by Ryan Seslow. Each one is one self-contained `.html` file:
all CSS and JS inline, no build step, no backend, no API keys, no tracking. Nothing
leaves your machine.

| Tool | What it does | Open it |
|------|--------------|---------|
| Kistvaen | Reads the embedded thumbnail out of any ZIP-based creative file | [kistvaen.html](https://ryanseslow.github.io/machine-room/kistvaen.html) |

More tools land here as they finish.

---

# Kistvaen

Creative Archive Previewer. Drag in any ZIP-based creative file and see its embedded
thumbnail instantly, right in the browser. No upload, no server, no install.

A kistvaen is a stone burial chamber, sealed shut with the contents still inside. That
is what a `.procreate` or `.dn` file becomes once the app that made it is gone.

## The problem

Cloud storage and file browsers (Google Drive, Finder, Windows Explorer) show a generic
ZIP icon for most creative archive formats, even when the file contains a perfectly good
embedded thumbnail. Files larger than 25 MB often get no preview at all on Google Drive.

Discontinued formats are hit hardest. Adobe Dimension (`.dn`), Adobe Fuse, Tilt Brush and
many others are orphaned by their original applications but still hold years of work.

Kistvaen bypasses all of that by reading the ZIP structure client-side and extracting
whatever thumbnail is stored inside.

## Supported formats

Any file that is secretly a ZIP archive works. Confirmed or likely:

- `.dn` for Adobe Dimension
- `.sketch` for Sketch
- `.procreate` for Procreate
- `.key`, `.pages`, `.numbers` for Apple iWork
- `.docx`, `.xlsx`, `.pptx` for Microsoft Office
- `.epub` for eBooks
- `.zip` for any generic archive with images inside

## How to use

1. Open https://ryanseslow.github.io/machine-room/kistvaen.html in any modern browser.
2. Drag files onto the drop zone, or click to browse.
3. Thumbnails appear immediately. No internet connection needed after the page loads.

Filter by filename, sort by name or file size, or toggle "Thumbnails only" to hide files
with no recoverable image.

## How it works

Kistvaen uses [JSZip](https://stuk.github.io/jszip/) to read ZIP archives entirely in the
browser. It checks 20+ known thumbnail paths first, covering Sketch, Procreate, Keynote,
Dimension and others, then falls back to any image file found anywhere in the archive.

All processing is local. No files leave your machine.

## Features

- Drag-and-drop or click-to-browse, multi-file
- Reads the thumbnail from any ZIP-based archive format
- Falls back to any image inside the archive when no standard thumbnail path exists
- Shows all ZIP entries with image files highlighted
- Filter by filename, sort by name or size
- Thumbnails-only view to hide files with no preview
- Works offline after the initial page load
- Single HTML file, no build step, no dependencies beyond the JSZip CDN

---

## Batch mode (CLI)

`kistvaen_batch.py` is the headless version of the same idea. Instead of dragging one file
into a browser, point it at an entire folder and it previews every creative file it finds.
Built for archives with thousands of files: external drives, cloud folders, studio backups.

It keeps the core intact (the same known thumbnail paths, the same crack-the-ZIP-then-fall-
back-to-any-image logic, using Python's `zipfile` in place of JSZip) and adds two more
engines so it can preview anything, not just ZIP formats:

- ZIP-based creative files (`.sketch`, `.procreate`, `.key`, `.pages`, `.docx`, `.epub`,
  `.dn` and more): extract the embedded thumbnail.
- Raster (`.jpg`, `.png`, `.gif`, `.tiff`): downscale with `sips`.
- Adobe and vector (`.psd`, `.ai`, `.eps`, `.pdf`, `.indd`, `.svg`): pull the embedded
  preview via `sips` and `qlmanage`.

### Use it as a command

```bash
python3 kistvaen_batch.py /path/to/archive --gallery previews.html
```

Walks the folder, writes a jpeg thumbnail for every creative file into `kistvaen-thumbs/`,
and builds a single browsable HTML gallery. Resumable: rerun it and it skips anything
already rendered.

Options: `--out DIR` for the thumbnail folder, `--px N` for max edge (default 240),
`--gallery FILE.html` for the gallery.

### Use it as a library

```python
from kistvaen_batch import thumb_for
thumb_for("Local Stop.psd", "out.jpg", px=240)   # -> True on success
```

One call, any creative file, one jpeg preview out.

Requires macOS (`sips` and `qlmanage` are built in). No third-party packages.

---

## License

MIT. Use it, fork it, ship it.

Built by Ryan Seslow, [ryanseslow.com](https://ryanseslow.com)
