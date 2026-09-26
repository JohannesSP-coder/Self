const MAX_DATA_URL_CHARS = 190_000;
const SIZES = [1080, 900, 720];
const QUALITIES = [0.72, 0.6, 0.5];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

const AVATAR_SIZE = 256;

/** Center-crops a photo to a square and returns a 256×256 JPEG data URL (≈20 KB). */
export async function compressAvatar(file: File): Promise<string> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    throw new Error("Dieses Bild konnte nicht gelesen werden. Bitte nimm ein JPG- oder PNG-Foto.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Das Foto konnte nicht verarbeitet werden.");
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * Shrinks a photo to a JPEG data URL small enough to store (≈140 KB), stepping size and quality
 * down until it fits. Rejects if the browser can't decode the file.
 */
export async function compressPhoto(file: File): Promise<string> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    throw new Error("Dieses Bild konnte nicht gelesen werden. Bitte nimm ein JPG- oder PNG-Foto.");
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Das Foto konnte nicht verarbeitet werden.");

  let last = "";
  for (const size of SIZES) {
    const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of QUALITIES) {
      last = canvas.toDataURL("image/jpeg", quality);
      if (last.length <= MAX_DATA_URL_CHARS) return last;
    }
  }
  return last;
}
