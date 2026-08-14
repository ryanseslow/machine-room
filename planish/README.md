# Planish

Turn rough interior photos into professional website-ready images.

To planish is to hammer sheet metal smooth, working the dents out of a surface
until it takes a finish. That is the whole job here.

Planish is a minimal Next.js web app for contractors, real estate
agents, interior designers, and WordPress builders. Upload a poor-quality
interior/property photo, and the app sends it to the OpenAI image edit API
with a fixed professional interior-photography prompt, then returns an
enhanced, publication-ready image you can preview and download.

- ✅ Single image upload (MVP)
- ✅ Before / After preview
- ✅ One-click download
- ✅ No login, no database, no payments
- 🔒 Your OpenAI key stays server-side

---

## Tech stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- [OpenAI Node SDK](https://github.com/openai/openai-node)

---

## Getting started

### 1. Install dependencies

```bash
cd planish
npm install
```

### 2. Add your OpenAI API key

The app reads your key from `OPENAI_API_KEY` in a local env file. Copy the
example file and paste in your key:

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and set your key:

```
OPENAI_API_KEY=sk-your-real-key-here
```

You can create a key at <https://platform.openai.com/api-keys>.

> `.env.local` is git-ignored, so your key is never committed. The key is only
> ever used server-side inside the `/api/enhance` route. It is never sent to
> the browser.

### 3. Run locally

```bash
npm run dev
```

Open <http://localhost:3000> in your browser. Upload a photo, click
**Enhance photo**, and download the result.

---

## Available scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the dev server on port 3000        |
| `npm run build`     | Production build                         |
| `npm run start`     | Run the production build                 |
| `npm run lint`      | Lint with Next.js ESLint                 |
| `npm run typecheck` | Type-check with `tsc --noEmit`           |

---

## How it works

1. The browser uploads a single image to the `POST /api/enhance` route as
   `multipart/form-data`.
2. The route validates the file (exists, is `image/jpeg` / `image/png` /
   `image/webp`, and is under 50MB).
3. It calls the OpenAI **image edit** endpoint with the source image and a
   fixed enhancement prompt (see `lib/prompts.ts`).
4. The enhanced image is returned to the browser as a base64 PNG data URL and
   shown in the **After** preview with a download button.

The original photo is never stored or modified. Each run produces a brand-new
enhanced output.

### Image model

The route uses `gpt-image-1` by default. To use a newer model such as
`gpt-image-1.5` once it is available on your account, set it without changing
code:

```
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

---

## Project structure

```
planish/
  app/
    page.tsx            # Home page (/)
    layout.tsx          # Root layout + metadata
    globals.css         # Tailwind entry
    api/
      enhance/
        route.ts        # POST /api/enhance, calls OpenAI
  components/
    ImageEnhancer.tsx   # Upload UI, previews, enhance + download
  lib/
    prompts.ts          # Fixed enhancement prompt
  public/
  .env.local.example
  package.json
  README.md
```

---

## Roadmap / extension points

The code includes clearly marked comments (`FUTURE:`) showing where to grow
the MVP:

- **Batch processing**: accept multiple files in `app/api/enhance/route.ts`
  and loop/parallelize calls.
- **Presets**: turn `lib/prompts.ts` into a keyed map of styles (Real Estate,
  Architectural Digest, Bright & Airy, …) and select one from the UI.
- **User accounts**: authenticate requests in the API route and track usage.
- **WordPress plugin integration**: the `/api/enhance` endpoint can be called
  directly from a WordPress plugin/media uploader to enhance images in place.

---

## License

MIT.
