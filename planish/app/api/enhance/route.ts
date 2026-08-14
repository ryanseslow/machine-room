import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { ENHANCEMENT_PROMPT } from "@/lib/prompts";

// The OpenAI image edit call can take a while, so give this route room to run.
export const runtime = "nodejs";
export const maxDuration = 120;

// Accepted input types per the OpenAI Images API (GPT image models support
// JPG, PNG, and WEBP input files under 50MB).
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Image model used for editing.
 *
 * The brief asks for `gpt-image-1.5` if available, otherwise `gpt-image-1`.
 * We default to the broadly available `gpt-image-1` and allow overriding via
 * the OPENAI_IMAGE_MODEL env var (e.g. set it to `gpt-image-1.5` once your
 * account/SDK supports it) without a code change.
 */
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

export async function POST(req: NextRequest) {
  // ---------------------------------------------------------------------------
  // FUTURE: USER ACCOUNTS — authenticate the request here (read a session
  // cookie / bearer token) before doing any work, and attribute usage/quota.
  // ---------------------------------------------------------------------------

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY. Add it to .env.local." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Expected multipart/form-data." },
      { status: 400 }
    );
  }

  // ---------------------------------------------------------------------------
  // MVP: single image upload only. The field is named "image".
  //
  // FUTURE: BATCH PROCESSING — accept multiple files (e.g. formData.getAll
  // ("images")) and loop/parallelize the enhancement calls, returning an array
  // of results instead of a single image.
  // ---------------------------------------------------------------------------
  const file = formData.get("image");

  // Validate file exists and is actually a file upload.
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "No image file was uploaded." },
      { status: 400 }
    );
  }

  const upload = file as File;

  // Validate file type.
  if (!ALLOWED_TYPES.includes(upload.type)) {
    return NextResponse.json(
      {
        error: `Unsupported file type "${
          upload.type || "unknown"
        }". Please upload a JPG, PNG, or WEBP image.`,
      },
      { status: 400 }
    );
  }

  // Validate file size.
  if (upload.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Maximum size is 50MB." },
      { status: 400 }
    );
  }

  if (upload.size === 0) {
    return NextResponse.json(
      { error: "Uploaded image is empty." },
      { status: 400 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Convert the uploaded web File into something the OpenAI SDK accepts.
    const arrayBuffer = await upload.arrayBuffer();
    const imageFile = await toFile(
      Buffer.from(arrayBuffer),
      upload.name || "upload.png",
      { type: upload.type }
    );

    // ---------------------------------------------------------------------------
    // FUTURE: PRESETS — choose the prompt based on a `preset` form field, e.g.
    //   const preset = formData.get("preset");
    //   const prompt = PRESETS[preset]?.prompt ?? ENHANCEMENT_PROMPT;
    // ---------------------------------------------------------------------------
    const result = await openai.images.edit({
      model: IMAGE_MODEL,
      image: imageFile,
      prompt: ENHANCEMENT_PROMPT,
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: "The image service did not return an image. Please try again." },
        { status: 502 }
      );
    }

    // Return a ready-to-use PNG data URL. The original upload is never stored
    // or modified — this is a brand-new enhanced output.
    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ image: dataUrl });
  } catch (err: unknown) {
    // Surface a friendly message; log the real error server-side.
    console.error("[/api/enhance] OpenAI request failed:", err);

    const message =
      err instanceof OpenAI.APIError
        ? err.message
        : "Failed to enhance the image. Please try again.";
    const status =
      err instanceof OpenAI.APIError && typeof err.status === "number"
        ? err.status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
