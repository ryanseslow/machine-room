/**
 * Fixed enhancement prompt(s) for Planish.
 *
 * The MVP uses a single, hard-coded professional interior photography prompt.
 *
 * ---------------------------------------------------------------------------
 * FUTURE: PRESETS
 * ---------------------------------------------------------------------------
 * To support multiple enhancement styles (e.g. "Real Estate Listing",
 * "Architectural Digest", "Cozy Airbnb", "Bright & Airy"), turn this into a
 * keyed map of presets and let the UI/API select one:
 *
 *   export const PRESETS = {
 *     architectural: { label: "Architectural Digest", prompt: "..." },
 *     realEstate:    { label: "Real Estate Listing",  prompt: "..." },
 *     // ...
 *   } as const;
 *
 * The API route would then accept a `preset` field and look it up here.
 * ---------------------------------------------------------------------------
 */

export const ENHANCEMENT_PROMPT =
  "Transform this interior photograph into a professional architectural and " +
  "interior design photograph. Preserve all existing materials, finishes, " +
  "furniture, fixtures, colors, and layout. Improve sharpness, exposure, " +
  "white balance, dynamic range, and overall image clarity. Correct lens " +
  "distortion and perspective where appropriate. Enhance wood, stone, metal, " +
  "glass, and fabric materials with realistic texture detail. Use premium " +
  "commercial interior photography lighting with soft natural illumination " +
  "and balanced highlights. The final image should feel suitable for " +
  "publication in Architectural Digest, luxury real estate marketing, or a " +
  "high-end contractor portfolio. Ultra-clean, professional, realistic, " +
  "high resolution.";
