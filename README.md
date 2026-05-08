# Peekable

**Creative Archive Previewer** — drag in any ZIP-based creative file and see its embedded thumbnail instantly, right in the browser. No upload, no server, no install.

---

## The problem

Cloud storage and file browsers (Google Drive, Finder, Windows Explorer) show a generic ZIP icon for most creative archive formats — even when the file contains a perfectly good embedded thumbnail. Files larger than 25 MB often get no preview at all on Google Drive.

Discontinued formats are especially affected: Adobe Dimension (.dn), Adobe Fuse, Tilt Brush, and many others are orphaned by their original applications but still hold years of work.

Peekable bypasses all of that by reading the ZIP structure client-side and extracting whatever thumbnail is stored inside.

---

## Supported formats

Any file that is secretly a ZIP archive works. Formats confirmed or likely to work:

- `.dn` — Adobe Dimension
- `.sketch` — Sketch
- `.procreate` — Procreate
- `.key` — Apple Keynote
- `.pages` — Apple Pages
- `.numbers` — Apple Numbers
- `.docx` / `.xlsx` / `.pptx` — Microsoft Office
- `.epub` — eBook
- `.zip` — any generic archive with image contents

---

## How to use

1. Open `peekable.html` in any modern browser (Chrome, Firefox, Safari, Edge).
2. Drag files onto the drop zone, or click to browse.
3. Thumbnails appear immediately — no internet connection required after the page loads.

Filter by filename, sort by name or file size, or toggle "Thumbnails only" to hide files with no recoverable image.

---

## How it works

Peekable uses [JSZip](https://stuk.github.io/jszip/) to read ZIP archives entirely in the browser. It checks 20+ known thumbnail paths first (covering Sketch, Procreate, Keynote, Dimension, and others), then falls back to any image file found anywhere in the archive.

All processing is local. No files leave your machine.

---

## Features

- Drag-and-drop or click-to-browse, multi-file
- Reads thumbnail from any ZIP-based archive format
- Falls back to any image inside the archive if no standard thumbnail path exists
- Shows all ZIP entries with image files highlighted
- Filter by filename, sort by name or size
- Thumbnails-only view to hide files with no preview
- Works offline after initial page load
- Single HTML file, no build step, no dependencies beyond JSZip CDN

---

## License

MIT. Use it, fork it, ship it.

---

Built by Ryan Seslow — [ryanseslow.com](https://ryanseslow.com)
