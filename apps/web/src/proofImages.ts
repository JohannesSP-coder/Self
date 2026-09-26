import { api } from "./api";

// Proof images are loaded once per page load and shared by thumbnails and the full-size viewer.
const cache = new Map<string, Promise<string>>();

export function proofUrl(id: string): Promise<string> {
  let url = cache.get(id);
  if (!url) {
    url = api.proofImage(id);
    cache.set(id, url);
    url.catch(() => cache.delete(id));
  }
  return url;
}

export function forgetProof(id: string): void {
  const url = cache.get(id);
  cache.delete(id);
  url?.then((u) => u.startsWith("blob:") && URL.revokeObjectURL(u)).catch(() => undefined);
}
