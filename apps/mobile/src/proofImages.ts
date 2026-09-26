import { api } from "./api";

// Data-URI cache so revisiting a segment doesn't re-download every proof photo.
const cache = new Map<string, Promise<string>>();

export function proofUri(id: string): Promise<string> {
  let promise = cache.get(id);
  if (!promise) {
    promise = api.proofImage(id);
    cache.set(id, promise);
  }
  return promise;
}

export function forgetProof(id: string): void {
  cache.delete(id);
}
