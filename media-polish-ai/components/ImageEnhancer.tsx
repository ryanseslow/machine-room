"use client";

import { useCallback, useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 50 * 1024 * 1024; // 50MB — matches the server-side limit.

export default function ImageEnhancer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Validate + accept a chosen file. The original File object is kept intact;
  // we only generate a separate object URL for previewing.
  const acceptFile = useCallback((selected: File) => {
    setError(null);
    setEnhancedUrl(null);

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("Image is too large. Maximum size is 50MB.");
      return;
    }

    setFile(selected);
    // Revoke any previous object URL to avoid memory leaks.
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) acceptFile(selected);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  };

  const onEnhance = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setEnhancedUrl(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/enhance", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setEnhancedUrl(data.image as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance image.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setEnhancedUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Upload interface */}
      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
            dragActive
              ? "border-accent bg-blue-50"
              : "border-slate-300 hover:border-accent hover:bg-slate-50"
          }`}
        >
          <svg
            className="mb-4 h-10 w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm font-medium text-slate-700">
            Drag &amp; drop a photo, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-400">JPG, PNG, or WEBP · up to 50MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onInputChange}
        className="hidden"
      />

      {/* Before / After previews */}
      {file && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Before image preview */}
            <figure>
              <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Before
              </figcaption>
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Original upload"
                  className="w-full rounded-lg border border-slate-200 object-cover"
                />
              )}
            </figure>

            {/* Enhanced image preview */}
            <figure>
              <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                After
              </figcaption>
              <div className="flex min-h-[160px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-accent" />
                    <span className="text-sm">Enhancing your photo…</span>
                  </div>
                ) : enhancedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={enhancedUrl}
                    alt="Enhanced result"
                    className="w-full rounded-lg object-cover"
                  />
                ) : (
                  <p className="px-4 py-10 text-center text-sm text-slate-400">
                    Your enhanced image will appear here.
                  </p>
                )}
              </div>
            </figure>
          </div>

          {/* Error message display */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onEnhance}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enhancing…" : enhancedUrl ? "Enhance again" : "Enhance photo"}
            </button>

            {/* Download enhanced image button */}
            {enhancedUrl && !loading && (
              <a
                href={enhancedUrl}
                download="enhanced.png"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                Download
              </a>
            )}

            <button
              type="button"
              onClick={onReset}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-60"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Error shown before any file is selected (e.g. invalid drop). */}
      {!file && error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </section>
  );
}
