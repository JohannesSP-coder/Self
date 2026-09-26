import { api, errorMessage } from "./api";

/** False in the claude.ai demo's iframe and on any browser without the Push API. */
export function supportsPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Web push keys arrive base64url-encoded; the browser's subscribe() call wants raw bytes.
function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function bufferToBase64url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The endpoint of the current subscription, if this browser is already registered. */
export async function currentPushEndpoint(): Promise<string | null> {
  if (!supportsPush()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  } catch {
    return null;
  }
}

/** Registers the service worker, asks for permission and subscribes with the server's VAPID key. */
export async function enablePushReminders(): Promise<void> {
  if (!supportsPush()) {
    throw new Error("Push-Erinnerungen werden von diesem Gerät oder Browser nicht unterstützt.");
  }
  const { publicKey } = await api.pushPublicKey();
  if (!publicKey) {
    throw new Error("Push-Erinnerungen sind auf dem Server noch nicht eingerichtet.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Du hast Benachrichtigungen nicht erlaubt. Bitte erlaube sie in den Browser-Einstellungen.");
  }

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // TS's DOM types want an ArrayBuffer-backed view specifically; Uint8Array.from's result
      // satisfies that at runtime but not by its declared (ArrayBufferLike) type.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  } catch {
    // The browser throws its own (often cryptic) DOMException here, e.g. when it has no working
    // push backend at all - give a message people can actually act on instead.
    throw new Error("Push-Erinnerungen konnten nicht aktiviert werden. Versuch es später noch einmal.");
  }
  try {
    await api.subscribePush({
      kind: "web",
      endpoint: sub.endpoint,
      keys: {
        p256dh: bufferToBase64url(sub.getKey("p256dh")),
        auth: bufferToBase64url(sub.getKey("auth")),
      },
    });
  } catch (err) {
    await sub.unsubscribe().catch(() => undefined);
    throw new Error(errorMessage(err));
  }
}

/** Unsubscribes this browser, both locally and on the server. */
export async function disablePushReminders(): Promise<void> {
  if (!supportsPush()) return;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => undefined);
  await api.unsubscribePush(endpoint).catch(() => undefined);
}
