#!/usr/bin/env python3
"""
peekable_batch.py — batch, path-based port of Peekable (ryanseslow.com/peekable).

Ryan's original Peekable is a browser drag-drop tool: open a ZIP-based creative
file (.sketch/.procreate/.key/.pages/.docx/.epub/.dn), find the embedded
thumbnail, show it. This is that idea, ported to run over the whole archive from
the command line — no dragging, thousands of files at once — and extended with
raster + Adobe engines so it can produce a preview for ANY creative file.

It is the shared previewer engine for the archive-expansion work (external drive,
iCloud studio masters, Dropbox).

Engines, by file type:
  ZIP-based creative  -> crack container, pull embedded thumbnail   (the Peekable port)
  raster              -> sips downscale
  Adobe / vector / pdf-> qlmanage / sips embedded-preview extraction

Public API:
  thumb_for(src, dst, px=240) -> bool     # write a jpeg thumbnail, True on success
  which_engine(ext)           -> str      # 'zip' | 'raster' | 'adobe' | None

CLI:
  python3 peekable_batch.py <root> [--out DIR] [--px 240] [--gallery FILE.html]
"""

import argparse
import hashlib
import io
import os
import subprocess
import sys
import zipfile

# ---------------------------------------------------------------------------
# Peekable's known embedded-thumbnail paths inside ZIP-based creative files.
# Ported verbatim from peekable.html, plus a few iWork/Sketch additions.
# ---------------------------------------------------------------------------
THUMB_PATHS = [
    "thumbnail.png", "Thumbnail.png", "thumbnail.jpg", "Thumbnail.jpg",
    "preview.png", "Preview.png", "preview.jpg", "Preview.jpg",
    "metadata/thumbnail.png", "metadata/Thumbnail.png", "metadata/preview.png",
    "renditions/thumbnail.png", "renditions/preview.png",
    ".thumbnail.png",
    "cloud-content/thumbnail.png", "cloud-content/preview.png",
    "QuickLook/Thumbnail.png", "QuickLook/thumbnail.png", "QuickLook/Preview.png",
    "QuickLook/Thumbnail.jpg",
    "preview/thumbnail.png", "preview/Preview.png",
    # iWork (Keynote/Pages/Numbers)
    "preview.jpg", "preview-web.jpg", "preview-micro.jpg",
    # Sketch
    "previews/preview.png",
]

# ZIP-container creative formats — Peekable's home turf.
ZIP_EXTS = {
    "sketch", "procreate", "key", "pages", "numbers", "dn", "idraw", "graffle",
    "docx", "pptx", "xlsx", "epub", "kra", "ora", "afphoto", "afdesign", "zip",
}
RASTER_EXTS = {"jpg", "jpeg", "png", "gif", "tiff", "tif", "bmp", "webp"}
ADOBE_EXTS = {"psd", "psb", "ai", "eps", "pdf", "indd", "svg"}

IMG_SUFFIXES = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".tiff", ".tif")


def which_engine(ext):
    ext = ext.lower().lstrip(".")
    if ext in ZIP_EXTS:
        return "zip"
    if ext in RASTER_EXTS:
        return "raster"
    if ext in ADOBE_EXTS:
        return "adobe"
    return None


# ---------------------------------------------------------------------------
# Engine 1: the Peekable port — pull the embedded thumbnail out of a ZIP file.
# ---------------------------------------------------------------------------
def extract_zip_thumbnail(src):
    """Return raw image bytes of the embedded thumbnail, or None.

    Mirrors peekable.html: try the known THUMB_PATHS first, then fall back to
    the first image entry anywhere in the archive.
    """
    try:
        with zipfile.ZipFile(src) as z:
            names = set(z.namelist())
            # 1) known thumbnail paths (fast, exact)
            for p in THUMB_PATHS:
                if p in names:
                    data = z.read(p)
                    if data:
                        return data
            # 2) fallback: first image entry anywhere (largest wins for quality)
            candidates = [n for n in z.namelist()
                          if not n.endswith("/") and n.lower().endswith(IMG_SUFFIXES)]
            if candidates:
                # prefer a QuickLook/preview-ish name, else the biggest image
                def score(n):
                    low = n.lower()
                    pri = 0
                    if "thumbnail" in low or "preview" in low or "quicklook" in low:
                        pri = 2
                    elif "/" not in n:
                        pri = 1
                    try:
                        size = z.getinfo(n).file_size
                    except KeyError:
                        size = 0
                    return (pri, size)
                best = max(candidates, key=score)
                data = z.read(best)
                if data:
                    return data
    except (zipfile.BadZipFile, OSError, RuntimeError):
        pass
    return None


# ---------------------------------------------------------------------------
# Normalize any image bytes / source into a downscaled jpeg via sips.
# ---------------------------------------------------------------------------
def _sips_to_jpeg(src, dst, px):
    r = subprocess.run(
        ["sips", "-s", "format", "jpeg", "-Z", str(px), src, "--out", dst],
        capture_output=True, timeout=90)
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 0


def _bytes_to_jpeg(data, dst, px):
    tmp = dst + ".src"
    try:
        with open(tmp, "wb") as f:
            f.write(data)
        return _sips_to_jpeg(tmp, dst, px)
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


# ---------------------------------------------------------------------------
# Engine 3: Adobe / vector / pdf — extract embedded preview via qlmanage.
# ---------------------------------------------------------------------------
def _adobe_thumbnail(src, dst, px):
    # sips reads PSD/PDF directly and is faster; try it first.
    if _sips_to_jpeg(src, dst, px):
        return True
    # fallback: QuickLook renders AI/EPS/INDD embedded previews.
    tmpdir = dst + "_ql"
    os.makedirs(tmpdir, exist_ok=True)
    try:
        subprocess.run(["qlmanage", "-t", "-s", str(px), "-o", tmpdir, src],
                       capture_output=True, timeout=120)
        png = os.path.join(tmpdir, os.path.basename(src) + ".png")
        if os.path.exists(png):
            return _sips_to_jpeg(png, dst, px)
    except (subprocess.SubprocessError, OSError):
        pass
    finally:
        try:
            for f in os.listdir(tmpdir):
                os.remove(os.path.join(tmpdir, f))
            os.rmdir(tmpdir)
        except OSError:
            pass
    return False


# ---------------------------------------------------------------------------
# Unified entry point.
# ---------------------------------------------------------------------------
def thumb_for(src, dst, px=240):
    """Write a <=px jpeg preview of `src` to `dst`. Return True on success.

    Resumable: if dst already exists non-empty, returns True without work.
    """
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return True
    ext = src.rsplit(".", 1)[-1].lower() if "." in os.path.basename(src) else ""
    engine = which_engine(ext)
    try:
        if engine == "raster":
            return _sips_to_jpeg(src, dst, px)
        if engine == "adobe":
            return _adobe_thumbnail(src, dst, px)
        if engine == "zip":
            data = extract_zip_thumbnail(src)   # <-- the Peekable port
            if data:
                return _bytes_to_jpeg(data, dst, px)
            return False
    except (subprocess.SubprocessError, OSError):
        return False
    return False


# ---------------------------------------------------------------------------
# CLI: walk a root, render previews, optionally build a gallery.
# ---------------------------------------------------------------------------
def _hash_name(path):
    return hashlib.sha1(path.encode("utf-8")).hexdigest()[:16] + ".jpg"


def walk_and_render(root, out, px):
    os.makedirs(out, exist_ok=True)
    rendered = []
    total = ok = 0
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if not d.startswith(".")]
        for fn in fns:
            if fn.startswith("."):
                continue
            ext = fn.rsplit(".", 1)[-1].lower() if "." in fn else ""
            if which_engine(ext) is None:
                continue
            src = os.path.join(dp, fn)
            dst = os.path.join(out, _hash_name(src))
            total += 1
            if thumb_for(src, dst, px):
                ok += 1
                rendered.append((src, dst, ext))
            if total % 200 == 0:
                print(f"  {ok}/{total} previews rendered", flush=True)
    print(f"DONE: {ok}/{total} creative files previewed -> {out}")
    return rendered


def build_gallery(rendered, out_html):
    css = ("body{background:#0d0d10;color:#e8e8ea;font:14px -apple-system,sans-serif;"
           "margin:0;padding:20px}.g{display:grid;gap:12px;"
           "grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}"
           ".c{background:#17171c;border:1px solid #26262e;border-radius:10px;overflow:hidden}"
           ".c .ph{aspect-ratio:1;background:#000;display:flex;align-items:center;justify-content:center}"
           ".c img{width:100%;height:100%;object-fit:contain}"
           ".m{padding:8px;font-size:11px;color:#9a9aa2;word-break:break-word}")
    base = os.path.dirname(os.path.abspath(out_html))
    cells = []
    for src, dst, ext in rendered:
        rel = os.path.relpath(dst, base)
        cells.append(f'<div class=c><div class=ph><img loading=lazy src="{rel}">'
                     f'</div><div class=m>{os.path.basename(src)}<br>'
                     f'<span style="color:#5b8dd9">{ext.upper()}</span></div></div>')
    html = (f"<!doctype html><meta charset=utf-8>"
            f"<meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>Peekable — archive previews</title><style>{css}</style>"
            f"<h2>Peekable batch — {len(rendered)} previews</h2>"
            f"<div class=g>{''.join(cells)}</div>")
    with open(out_html, "w") as f:
        f.write(html)
    print(f"Gallery -> {out_html}")


def main():
    ap = argparse.ArgumentParser(description="Peekable — batch archive previewer")
    ap.add_argument("root", help="folder to scan (external drive, Dropbox, etc.)")
    ap.add_argument("--out", default="peekable-thumbs", help="thumbnail output dir")
    ap.add_argument("--px", type=int, default=240, help="max thumbnail edge (px)")
    ap.add_argument("--gallery", help="also write an HTML gallery to this path")
    a = ap.parse_args()
    if not os.path.isdir(a.root):
        sys.exit(f"Not a folder: {a.root}")
    rendered = walk_and_render(a.root, a.out, a.px)
    if a.gallery:
        build_gallery(rendered, a.gallery)


if __name__ == "__main__":
    main()
