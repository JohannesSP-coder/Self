export const MAX_PROOF_BYTES = 700 * 1024;

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

// The declared type must match the file's real signature, since the bytes are later served with it.
function hasSignature(mimeType: string, data: Buffer): boolean {
  if (mimeType === "image/jpeg") return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mimeType === "image/png") return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
  return false;
}

/** Parses a base64 image data URL; null if it isn't a JPEG/PNG/WebP within the size limit. */
export function parseImageDataUrl(input: string): { mimeType: string; data: Buffer } | null {
  const match = DATA_URL.exec(input);
  if (!match) return null;
  const mimeType = match[1];
  const data = Buffer.from(match[2], "base64");
  if (data.length === 0 || data.length > MAX_PROOF_BYTES || !hasSignature(mimeType, data)) return null;
  return { mimeType, data };
}
